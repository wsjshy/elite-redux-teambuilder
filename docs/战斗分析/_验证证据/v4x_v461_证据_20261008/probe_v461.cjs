/* v4.6.1 收尾修复专项复核：口径表注入收敛 / 渲染面无开发语 + alert / toast / 默认入口 / CSS 三项
   用法: node probe_v461.cjs <html路径> <sav路径> */
'use strict';
const fs = require('fs'); const vm = require('vm');
const HTML = process.argv[2], SAV = process.argv[3];
const html = fs.readFileSync(HTML, 'utf8');
const lines = html.split('\n');
const P = (s) => console.log(s);
const cnt = (s, sub) => s.split(sub).length - 1;

P('================ 0. 定位 / 行号基准 ================');
P('   文件 ' + html.length + ' 字符 / ' + lines.length + ' 行');
let srcIdx = -1, re0 = /<script\b([^>]*)>/gi, m0;
while ((m0 = re0.exec(html)) !== null) { if (!/\bsrc\s*=/i.test(m0[1] || '')) { srcIdx = m0.index + m0[0].length; break } }
const scriptStartLine = html.slice(0, srcIdx).split('\n').length;
P('   内嵌 script 起始 = HTML L' + scriptStartLine + ' → 行号换算偏移 = script行 + ' + (scriptStartLine - 1));
const st = lines.findIndex(l => l.trim() === '<style>'), se = lines.findIndex(l => l.trim() === '</style>');
P('   <style> L' + (st + 1) + ' .. L' + (se + 1));

P('\n================ 1. 静态：CSS 三项（10px→12px / tr.mv / 平板断点）================');
P('   --- 仍含 10px 声明的行 ---');
let ten = 0;
for (let i = st; i <= se; i++) { if (/font-size\s*:\s*10px/.test(lines[i])) { ten++; P('   L' + (i + 1) + '  ' + lines[i].trim().slice(0, 120)) } }
P('   10px 声明数 = ' + ten);
P('   --- @media 全部 ---');
lines.forEach((l, i) => { if (/@media/.test(l)) P('   L' + (i + 1) + '  ' + l.trim()) });
P('   --- tr.mv 相关声明（含媒体块内）---');
lines.forEach((l, i) => { if (/tr\.mv/.test(l)) P('   L' + (i + 1) + '  ' + l.trim().slice(0, 160)) });
P('   --- .ptag/.psrc 现行声明 ---');
lines.forEach((l, i) => { if (/\.(ptag|psrc)\b/.test(l) && /font-size|min-height/.test(l)) P('   L' + (i + 1) + '  ' + l.trim().slice(0, 160)) });

P('\n================ 2. 静态：alert / toast ================');
const scriptTxt = (function () { let out = '', re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi, m; while ((m = re.exec(html)) !== null) { if (/\bsrc\s*=/i.test(m[1] || '')) continue; out += m[2] + '\n;\n' } return out })();
P('   全库 "alert(" 次数 = ' + cnt(scriptTxt, 'alert(') + ' ; "window.alert" = ' + cnt(scriptTxt, 'window.alert'));
P('   toast 相关：定义 = ' + (/(function\s+toast\b|const\s+toast\s*=|toast\s*=\s*function)/.test(scriptTxt) ? '✔ 有' : '✘ 无') + ' | 调用 "toast(" = ' + cnt(scriptTxt, 'toast(') + ' | CSS .toast L' + (lines.findIndex(l => /^\.toast[\s,{:.]/.test(l.trim())) + 1));
P('   gotoItem 定义原文 → ' + (scriptTxt.slice(scriptTxt.indexOf('function gotoItem'), scriptTxt.indexOf('function gotoItem') + 320).replace(/\n/g, ' ⌁ ')));

P('\n================ 3. 静态：nav / 默认 Tab ================');
const navi = html.indexOf('<nav');
P('   nav → ' + html.slice(navi, html.indexOf('</nav>', navi) + 6).replace(/\s+/g, ' '));
lines.forEach((l, i) => { if (/class="tab active"|<section id="tab-/.test(l)) P('   L' + (i + 1) + '  ' + l.trim().slice(0, 100)) });
P('   switchTab 原文 → ' + scriptTxt.slice(scriptTxt.indexOf('function switchTab'), scriptTxt.indexOf('function switchTab') + 420).replace(/\n/g, ' ⌁ '));

P('\n================ 4. VM 渲染：口径表注入收敛 + 渲染面开发语扫描 ================');
function mkEl(tag) {
  return { _tag: (tag || 'div').toLowerCase(), children: [], style: {}, dataset: {}, value: '', checked: false, innerHTML: '', textContent: '', className: '', id: '',
    classList: { _s: new Set(), add() { for (const c of arguments) this._s.add(c) }, remove() { for (const c of arguments) this._s.delete(c) }, toggle(c, f) { if (f === undefined) f = !this._s.has(c); f ? this._s.add(c) : this._s.delete(c); return f }, contains(c) { return this._s.has(c) } },
    appendChild(c) { this.children.push(c); return c }, removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c }, insertBefore(c) { this.children.push(c); return c },
    querySelector(s) { return mkEl('div') }, querySelectorAll() { return [] }, setAttribute(k, v) { this['a_' + k] = v }, getAttribute(k) { return this['a_' + k] === undefined ? null : this['a_' + k] }, removeAttribute() { },
    addEventListener() { }, removeEventListener() { }, focus() { }, blur() { }, click() { }, remove() { }, insertAdjacentHTML() { }, scrollIntoView() { }, getBoundingClientRect() { return { top: 0, left: 0, width: 0, height: 0 } }, closest() { return null }, contains() { return false }, replaceWith() { }, after() { }, before() { } };
}
const reg = new Map(); const getEl = (id) => { if (!reg.has(id)) { const e = mkEl('div'); e.id = id; reg.set(id, e) } return reg.get(id) };
const alerted = []; const toasts = [];
const doc = { getElementById: getEl, createElement: (t) => mkEl(t), createTextNode: (t) => ({ textContent: t, innerHTML: t }), querySelector: () => mkEl('div'), querySelectorAll: () => [], addEventListener() { }, body: mkEl('body'), documentElement: mkEl('html'), head: mkEl('head'), execCommand() { }, createDocumentFragment: () => mkEl('frag') };
const ctx = { console, document: doc, alert: (m) => alerted.push(String(m).slice(0, 60)), setTimeout, clearTimeout, setInterval: () => 0, clearInterval() { }, JSON, Math, Date, Object, Array, String, Number, Boolean, RegExp, Error, Map, Set, isFinite, isNaN, parseInt, parseFloat, encodeURIComponent, decodeURIComponent, Blob: function () { }, FileReader: function () { }, URL: { createObjectURL() { return '' }, revokeObjectURL() { } }, navigator: { userAgent: 'node' }, location: { hash: '', href: '' } };
ctx.window = ctx; ctx.globalThis = ctx; ctx.window.addEventListener = function () { }; ctx.window.innerHeight = 900; ctx.window.scrollTo = function () { }; ctx.addEventListener = function () { };
vm.createContext(ctx);
try { vm.runInContext(scriptTxt, ctx, { filename: 'x.js' }) } catch (e) { P('   加载异常 ' + e.message) }
ctx.SAV_ROWS = ctx.parseSavBytes(new Uint8Array(fs.readFileSync(SAV))).rows;

const entries = ['renderPoke', 'renderPokemon', 'renderMoves', 'renderMove', 'renderAbi', 'renderAbilities', 'renderType', 'renderTypes', 'renderTeam', 'renderTpl', 'renderTemplates', 'renderCore', 'renderRuleBox', 'renderRuleTip', 'renderGlossary', 'init', 'renderAll', 'boot'];
const called = [];
entries.forEach(n => { if (typeof ctx[n] === 'function') { try { ctx[n](); called.push(n) } catch (e) { called.push(n + '(ERR:' + e.message.slice(0, 40) + ')') } } });
P('   已调用渲染入口 → ' + called.join(', '));
['renderMyPool', 'myCoreTeam'].forEach(n => { if (typeof ctx[n] === 'function') { try { n === 'myCoreTeam' ? ctx[n]('2232') : ctx[n]() } catch (e) { P('   ' + n + ' 异常 ' + e.message) } } });

P('   --- 口径表三处长度 / 内容形态 ---');
['ruleBoxTeam', 'ruleBoxCore', 'ruleBoxTpl'].forEach(id => {
  const s = getEl(id).innerHTML || '';
  P('   #' + id.padEnd(12) + ' len=' + String(s.length).padStart(6) + ' | <table>=' + cnt(s, '<table') + ' | 含按钮=' + cnt(s, '<button') + ' | 含跳转字样=' + (/跳转|查看完整|查看口径|去核心|打开/.test(s) ? '✔' : '✘') + ' | 含 WCONF.=' + cnt(s, 'WCONF.') + ' | 含源码实证=' + cnt(s, '源码实证'));
});
P('   #tplRuleTip len=' + (getEl('tplRuleTip').innerHTML || '').length + ' | 源码实证=' + cnt(getEl('tplRuleTip').innerHTML || '', '源码实证'));

P('   --- 渲染面合并扫描（所有已渲染容器 innerHTML 拼接）---');
const CONTAINERS = ['pokeOut', 'mvOut', 'abiOut', 'typeOut', 'teamOut', 'tplOut', 'coreOut', 'tplList', 'tplRuleTip', 'ruleBoxTeam', 'ruleBoxCore', 'ruleBoxTpl', 'myPoolWrap', 'myTeamOut', 'glossaryOut', 'glBox', 'teamPlan', 'mxOut', 'detailOut', 'pokeDetail'];
let all = ''; const used = [];
CONTAINERS.forEach(id => { const s = getEl(id).innerHTML || ''; if (s) { all += s + '\n'; used.push(id + ':' + s.length) } });
P('   非空容器 → ' + used.join(' , '));
P('   渲染面总长 = ' + all.length + ' 字符');
['源码实证', '数据表实证', '待游戏内截图校准', '源码考古', '源码未找到', 'changelog', 'WCONF.', 'v45-3', 'v46-', 'alert(', 'docs/战斗分析', '数据契约', '参数'].forEach(k => {
  const n = cnt(all, k); P('   含 "' + k + '" = ' + n + (n > 0 ? '   ← 命中' : ''));
});
P('   渲染期 alert 触发次数 = ' + alerted.length + (alerted.length ? ' → ' + JSON.stringify(alerted.slice(0, 3)) : ''));

P('\n================ 5. B 链路抽查（池 → 方案卡）================');
const pool = getEl('myPoolWrap').innerHTML || '', team = getEl('myTeamOut').innerHTML || '';
P('   #myPoolWrap len=' + pool.length + ' | .poolcard=' + cnt(pool, 'class="poolcard"') + ' | spmid=' + cnt(pool, 'class="spmid"') + ' | myCoreTeam(=' + cnt(pool, 'myCoreTeam('));
P('   #myTeamOut len=' + team.length + ' | needcard=' + cnt(team, 'needcard') + ' | slotbody=' + cnt(team, 'class="slotbody"') + ' | 原则 P=' + cnt(team, '原则 P') + ' | 代价=' + cnt(team, '代价') + ' | title=' + (team.match(/title="/g) || []).length);
P('   卡片首块 → ' + team.slice(0, 420).replace(/\s+/g, ' '));
