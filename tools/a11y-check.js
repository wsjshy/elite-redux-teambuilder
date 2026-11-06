#!/usr/bin/env node
/*
 * a11y-check.js — v4.178 无障碍回归固化脚本
 * 零依赖（Node 22 内置 WebSocket + fetch），CDP 驱动 headless Chrome。
 * 用法: node tools/a11y-check.js [URL]   默认 http://localhost:8901/
 * 退出码: 0=全 PASS / 非 0=FAIL / 2=CDP 不可用（请手工把 IIFE 段贴入 DevTools 控制台）
 */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const URL = process.argv[2] || 'http://localhost:8901/';
const CHROME = 'C:\\Users\\22210\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9222;
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'a11y-chrome-'));

const results = [];
function add(id, desc, status, detail) {
  results.push({ id, desc, status, detail: String(detail).slice(0, 200) });
}

async function getWS() {
  for (let i = 0; i < 30; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json`);
      const tabs = await r.json();
      const page = tabs.find(t => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch (e) {}
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error('CDP timeout');
}

async function cdp(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1e9);
    const onMsg = (ev) => {
      const msg = JSON.parse(typeof ev.data === 'string' ? ev.data : ev.data.toString());
      if (msg.id === id) {
        ws.removeEventListener('message', onMsg);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };
    ws.addEventListener('message', onMsg);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evalJS(ws, expr) {
  const r = await cdp(ws, 'Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error('eval: ' + JSON.stringify(r.exceptionDetails.exception));
  let v = r.result.value;
  if (typeof v === 'string') { try { v = JSON.parse(v); } catch (e) {} }
  return v;
}

async function main() {
  const chrome = spawn(CHROME, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${PROFILE}`,
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    'about:blank'
  ], { stdio: 'ignore' });

  try {
    const wsUrl = await getWS();
    const WebSocket = global.WebSocket;
    const ws = new WebSocket(wsUrl);
    await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', j); });

    await cdp(ws, 'Page.enable');
    await cdp(ws, 'Runtime.enable');
    await cdp(ws, 'Page.navigate', { url: URL });
    await new Promise(r => setTimeout(r, 4000));

    // 收集 console errors
    const consoleErrors = await evalJS(ws, `window.__errs||0`);

    // === a) nav aria-current 唯一 + 跟随 ===
    const navInit = await evalJS(ws, `
      (function(){
        var cur=document.querySelectorAll('nav button[aria-current="page"]');
        var active=document.querySelectorAll('nav button.active');
        return JSON.stringify({cur:cur.length, active:active.length, curText:cur[0]?cur[0].textContent.trim():null});
      })()
    `);
    add('a1', 'nav aria-current 唯一且跟随 active', navInit.cur === 1 && navInit.active === 1 ? 'PASS' : 'FAIL', navInit);

    // 切到 analyze tab
    await evalJS(ws, `document.querySelectorAll('nav button').forEach(function(b){if(b.dataset.tab==='analyze')b.click();});`);
    await new Promise(r => setTimeout(r, 300));
    const navAfter = await evalJS(ws, `
      (function(){
        var cur=document.querySelectorAll('nav button[aria-current="page"]');
        return JSON.stringify({cur:cur.length, curText:cur[0]?cur[0].textContent.trim():null});
      })()
    `);
    add('a2', '切 Tab 后 aria-current 迁移', navAfter.cur === 1 && navAfter.curText === '队伍分析' ? 'PASS' : 'FAIL', navAfter);

    // === b) atkChips aria-pressed 三态 ===
    await evalJS(ws, `document.querySelectorAll('nav button').forEach(function(b){if(b.dataset.tab==='type')b.click();});`);
    await new Promise(r => setTimeout(r, 300));
    // 清空
    await evalJS(ws, `document.querySelectorAll('#atkChips button.on').forEach(function(b){b.click();});`);
    await new Promise(r => setTimeout(r, 200));
    const none = await evalJS(ws, `
      (function(){
        var t=document.querySelectorAll('#atkChips button[aria-pressed="true"]').length;
        return JSON.stringify({pressedTrue:t});
      })()
    `);
    add('b1', '全取消 aria-pressed=true 计数=0', none.pressedTrue === 0 ? 'PASS' : 'FAIL', none);

    // 单选
    await evalJS(ws, `var bs=document.querySelectorAll('#atkChips button');for(var i=0;i<bs.length;i++){if(bs[i].textContent.trim()==='火'){bs[i].click();break;}}`);
    await new Promise(r => setTimeout(r, 200));
    const single = await evalJS(ws, `JSON.stringify({pressedTrue:document.querySelectorAll('#atkChips button[aria-pressed="true"]').length})`);
    add('b2', '单选 aria-pressed=true 计数=1', single.pressedTrue === 1 ? 'PASS' : 'FAIL', single);

    // 多选
    await evalJS(ws, `var bs=document.querySelectorAll('#atkChips button');for(var i=0;i<bs.length;i++){if(bs[i].textContent.trim()==='水'){bs[i].click();break;}}`);
    await new Promise(r => setTimeout(r, 200));
    const multi = await evalJS(ws, `JSON.stringify({pressedTrue:document.querySelectorAll('#atkChips button[aria-pressed="true"]').length})`);
    add('b3', '多选 aria-pressed=true 计数=2', multi.pressedTrue === 2 ? 'PASS' : 'FAIL', multi);

    // === c) 三搜索框 aria-label ===
    const labels = await evalJS(ws, `
      (function(){
        var a=document.getElementById('dmgAtkQ');
        var b=document.getElementById('dmgDefQ');
        var c=document.getElementById('dmgMvQ');
        if(!a||!b||!c) return {err:'missing input'};
        var la=a.getAttribute('aria-label'), lb=b.getAttribute('aria-label'), lc=c.getAttribute('aria-label');
        return {la:la,lb:lb,lc:lc, allSet:Boolean(la&&lb&&lc), distinct:(la!==lb && lb!==lc && la!==lc)};
      })()
    `);
    add('c', '三搜索框 aria-label 非空且互不相同', labels.allSet && labels.distinct ? 'PASS' : 'FAIL', labels);

    // === d) 深色按钮 aria-pressed 三态 + localStorage 恢复 ===
    await evalJS(ws, `document.querySelectorAll('nav button').forEach(function(b){if(b.dataset.tab==='analyze')b.click();});`);
    await new Promise(r => setTimeout(r, 200));
    const lightInit = await evalJS(ws, `JSON.stringify({pressed:document.getElementById('erThemeBtn').getAttribute('aria-pressed')})`);
    add('d1', '初始 light 时 aria-pressed=false', lightInit.pressed === 'false' ? 'PASS' : 'FAIL', lightInit);

    await evalJS(ws, `document.getElementById('erThemeBtn').click();`);
    await new Promise(r => setTimeout(r, 200));
    const darkAfter = await evalJS(ws, `JSON.stringify({pressed:document.getElementById('erThemeBtn').getAttribute('aria-pressed'), theme:document.documentElement.dataset.theme})`);
    add('d2', '点击切换深色后 aria-pressed=true', darkAfter.pressed === 'true' && darkAfter.theme === 'dark' ? 'PASS' : 'FAIL', darkAfter);

    // reload after localStorage er_theme=dark
    await cdp(ws, 'Page.navigate', { url: URL });
    await new Promise(r => setTimeout(r, 3000));
    const darkReload = await evalJS(ws, `JSON.stringify({pressed:document.getElementById('erThemeBtn').getAttribute('aria-pressed'), theme:document.documentElement.dataset.theme, stored:localStorage.getItem('er_theme')})`);
    add('d3', 'reload 后 er_theme=dark → aria-pressed=true（D 项缺口关闭）', darkReload.pressed === 'true' && darkReload.theme === 'dark' ? 'PASS' : 'FAIL', darkReload);

    // 切回 light
    await evalJS(ws, `document.getElementById('erThemeBtn').click();`);
    await new Promise(r => setTimeout(r, 200));
    const lightBack = await evalJS(ws, `JSON.stringify({pressed:document.getElementById('erThemeBtn').getAttribute('aria-pressed')})`);
    add('d4', '切回 light 后 aria-pressed=false', lightBack.pressed === 'false' ? 'PASS' : 'FAIL', lightBack);

    // === e) focus-visible CSS 规则存在（v4.167 全局） ===
    const focusOutline = await evalJS(ws, `
      (function(){
        var found=false, sample=null;
        for(var i=0;i<document.styleSheets.length;i++){
          try{
            var rules=document.styleSheets[i].cssRules;
            for(var j=0;j<rules.length;j++){
              if(rules[j].selectorText && rules[j].selectorText.indexOf(':focus-visible')>-1){
                found=true; sample=rules[j].cssText.slice(0,120); break;
              }
            }
          }catch(e){}
          if(found) break;
        }
        return {found:found, sample:sample};
      })()
    `);
    add('e', ':focus-visible 全局 CSS 规则存在', focusOutline.found ? 'PASS' : 'FAIL', focusOutline);

    // === f1) k2「→」为 button 且 tabIndex>=0（在 type tab 有选中态时） ===
    const k2btn = await evalJS(ws, `
      (function(){
        var a=document.querySelector('button[title^="跳伤害页"]');
        if(a) return {tag:a.tagName, tabIndex:a.tabIndex, type:a.type};
        return {none:true};
      })()
    `);
    add('f1', 'k2「→」为 button 且 tabIndex>=0', k2btn.tag === 'BUTTON' && k2btn.tabIndex >= 0 ? 'PASS' : 'FAIL', k2btn);

    // === f2) dmgDef 推导 chips ===
    await evalJS(ws, `document.querySelectorAll('nav button').forEach(function(b){if(b.dataset.tab==='analyze')b.click();});`);
    await new Promise(r => setTimeout(r, 300));
    const dmgChip = await evalJS(ws, `
      (function(){
        var box=document.getElementById('dmgQuickChips');
        if(!box) return {none:true};
        var s=box.querySelector('button');
        return s ? {tag:s.tagName, tabIndex:s.tabIndex} : {none:true};
      })()
    `);
    add('f2', 'dmgDef 推导 chips 为 button 且 tabIndex>=0', dmgChip.tag === 'BUTTON' && dmgChip.tabIndex >= 0 ? 'PASS' : 'FAIL', dmgChip);

    // === g) 横滚 0 ===
    const hscroll = await evalJS(ws, `JSON.stringify({sw:document.documentElement.scrollWidth, cw:document.documentElement.clientWidth})`);
    add('g', '横滚 scrollWidth<=clientWidth', hscroll.sw <= hscroll.cw ? 'PASS' : 'FAIL', hscroll);

    ws.close();
  } finally {
    chrome.kill();
    try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch (e) {}
  }

  // 汇总
  const pass = results.filter(r => r.status === 'PASS').length;
  const fail = results.filter(r => r.status === 'FAIL').length;
  console.log('=== a11y-check ' + URL + ' ===');
  for (const r of results) console.log(`[${r.status}] ${r.id} ${r.desc} :: ${r.detail}`);
  console.log(`--- summary: pass=${pass} fail=${fail} ---`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch(e => {
  console.error('CDP 启动失败:', e.message);
  console.error('请手工执行: 打开 DevTools Console, 把 tools/a11y-check.js 中 IIFE 段贴入控制台运行');
  process.exit(2);
});
