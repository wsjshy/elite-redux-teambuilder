#!/usr/bin/env node
/*
 * probe-teamqa.js — v4.182 队检聚合告警 headless 探针
 *
 * 目的：在真实浏览器（Edge headless + CDP）里加载 index.html，
 *   ① 构造含两只同种宝可梦的队伍，断言 .qa-chip 出现在 #tmAnalyze 内；
 *   ② 点击 chip，断言 .qa-detail 拿到 .open 类（展开可见性变化）；
 *   ③ 375px 视口下 documentElement.scrollWidth 不超过 375（无横向溢出）。
 *
 * 零依赖：Node 22 全局 WebSocket + Edge 自带 CDP。
 * 用法：node probe-teamqa.js
 */
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const REPO = 'D:/game/elite-redux';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PROFILE = path.join(__dirname, 'edge-probe-profile');
const PORT = 9333;
const URL = 'file:///' + REPO.replace(/\\/g, '/') + '/index.html';

const results = [];
function check(name, cond, detail) {
  results.push({ name, ok: !!cond, detail: detail || '' });
  console.log((cond ? 'PASS ' : 'FAIL ') + name + (detail ? '  -- ' + detail : ''));
}

function httpGetJSON(p) {
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port: PORT, path: p }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

let msgId = 0;
const pending = new Map();
let ws = null;
function cdp(method, params) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params: params || {} }));
  });
}

(async () => {
  fs.rmSync(PROFILE, { recursive: true, force: true });
  const args = [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + PROFILE,
    '--remote-debugging-port=' + PORT,
    '--window-size=375,812',
    'about:blank'
  ];
  const child = spawn(EDGE, args, { stdio: 'ignore' });

  try {
    // 1. 等 CDP 起来
    let targets = null;
    for (let i = 0; i < 40; i++) {
      try { targets = await httpGetJSON('/json'); if (targets && targets.length) break; } catch (e) {}
      await new Promise(r => setTimeout(r, 250));
    }
    if (!targets) throw new Error('CDP 未在 10s 内起来');
    let page = targets.find(t => t.type === 'page');
    if (!page) throw new Error('没有 page target');

    ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    ws.onmessage = ev => {
      const m = JSON.parse(ev.data);
      if (m.id && pending.has(m.id)) {
        const { resolve, reject } = pending.get(m.id);
        pending.delete(m.id);
        if (m.error) reject(new Error(m.error.message)); else resolve(m.result);
      }
    };

    await cdp('Runtime.enable');
    await cdp('Page.enable');

    // 2. 打开 index.html
    await cdp('Page.navigate', { url: URL });

    // 3. 等 __erReady
    let ready = false;
    for (let i = 0; i < 60; i++) {
      const r = await cdp('Runtime.evaluate', { expression: 'window.__erReady === true', returnByValue: true });
      if (r.result && r.result.value === true) { ready = true; break; }
      await new Promise(r => setTimeout(r, 500));
    }
    check('页面加载完成 __erReady=true', ready, ready ? '' : '等了 30s 仍未 ready');
    if (!ready) throw new Error('页面未 ready');

    // 4. 375px 设备模拟
    await cdp('Emulation.setDeviceMetricsOverride', {
      width: 375, height: 812, deviceScaleFactor: 2, mobile: true
    });

    // 5. 构造两只同种队伍并触发 renderAnalyze
    const setupExpr = `(function(){
      try {
        var sp = ERDATA.species[0];
        team.length = 0;
        teamInfo = {};
        team.push(sp); team.push(sp);  /* 同物种 ×2 */
        renderAnalyze();
        return { id: sp.id, zh: sp.zh, teamLen: team.length };
      } catch (e) { return { error: e.message }; }
    })()`;
    const r1 = await cdp('Runtime.evaluate', { expression: setupExpr, returnByValue: true });
    const s1 = r1.result.value || {};
    check('构造双同物种队伍', !s1.error && s1.teamLen === 2,
      s1.error ? ('ERR: ' + s1.error) : ('#' + s1.id + ' ' + s1.zh + ' ×2'));

    // 6. 断言 .qa-chip 出现且含「重复物种」
    const chipExpr = `(function(){
      var chips = document.querySelectorAll('#tmAnalyze .qa-chip');
      var texts = Array.prototype.map.call(chips, function(c){ return c.textContent.trim(); });
      return { n: chips.length, texts: texts, first: chips[0] ? chips[0].outerHTML.slice(0,200) : null };
    })()`;
    const r2 = await cdp('Runtime.evaluate', { expression: chipExpr, returnByValue: true });
    const s2 = r2.result.value || {};
    const hasDupSp = (s2.texts || []).some(t => t.indexOf('重复物种') >= 0);
    check('断言 #tmAnalyze 内出现 .qa-chip 且含「重复物种」', s2.n >= 1 && hasDupSp,
      'chips=' + s2.n + ' texts=' + JSON.stringify(s2.texts));

    // 7. 点击第一个 chip，断言 .qa-detail.open 出现
    const clickExpr = `(function(){
      var c = document.querySelector('#tmAnalyze .qa-chip');
      if (!c) return { clicked: false };
      c.click();
      var open = document.querySelectorAll('#tmAnalyze .qa-detail.open');
      var openTexts = Array.prototype.map.call(open, function(d){ return d.textContent.trim(); });
      return { clicked: true, openCount: open.length, openTexts: openTexts };
    })()`;
    const r3 = await cdp('Runtime.evaluate', { expression: clickExpr, returnByValue: true });
    const s3 = r3.result.value || {};
    check('断言点击 chip 后 .qa-detail.open 出现', s3.clicked && s3.openCount >= 1,
      s3.clicked ? ('openCount=' + s3.openCount + ' texts=' + JSON.stringify(s3.openTexts)) : '没点到 chip');

    // 8. 再点一次，断言收起到 0
    const r4 = await cdp('Runtime.evaluate', { expression: clickExpr, returnByValue: true });
    const s4 = r4.result.value || {};
    check('断言再次点击可收起（openCount 回到 0）', s4.openCount === 0,
      'openCount=' + s4.openCount);

    // 9. 375px 横向溢出检查
    await new Promise(r => setTimeout(r, 200));
    const overflowExpr = `(function(){
      return {
        docScrollW: document.documentElement.scrollWidth,
        bodyScrollW: document.body.scrollWidth,
        innerW: window.innerWidth
      };
    })()`;
    const r5 = await cdp('Runtime.evaluate', { expression: overflowExpr, returnByValue: true });
    const s5 = r5.result.value || {};
    const noOverflow = s5.docScrollW <= 375 && s5.bodyScrollW <= 375;
    check('断言 375px 视口无横向溢出', noOverflow,
      'docScrollW=' + s5.docScrollW + ' bodyScrollW=' + s5.bodyScrollW + ' innerW=' + s5.innerW);

    // 10. 清理：切回单物种，断言 chip 消失
    const resetExpr = `(function(){
      team.length = 0;
      teamInfo = {};
      renderAnalyze();
      return document.querySelectorAll('#tmAnalyze .qa-chip').length;
    })()`;
    const r6 = await cdp('Runtime.evaluate', { expression: resetExpr, returnByValue: true });
    check('断言切回空队伍后 chip 清零（不残留）', r6.result.value === 0,
      'residual chips=' + r6.result.value);

  } finally {
    try { child.kill(); } catch (e) {}
  }

  const pass = results.filter(r => r.ok).length;
  console.log('\n' + pass + '/' + results.length + ' probe assertions passed');
  fs.writeFileSync(path.join(__dirname, 'probe-teamqa.output.json'),
    JSON.stringify({ pass, total: results.length, results: results }, null, 2));
  process.exit(pass === results.length ? 0 : 1);
})().catch(e => {
  console.error('PROBE FATAL:', e.message);
  process.exit(2);
});
