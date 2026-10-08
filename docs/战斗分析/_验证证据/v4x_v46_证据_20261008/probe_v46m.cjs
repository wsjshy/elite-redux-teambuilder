/* v4.6 第二轮取证：表格包裹复核 + 移动端媒体查询全文 + 内部串定位 + gotoItem + 渲染态内部文案扫描
   用法: node probe_v46m.cjs <html路径> */
'use strict';
const fs = require('fs'); const vm = require('vm');
const F = process.argv[2];
const html = fs.readFileSync(F, 'utf8');
const lines = html.split('\n');
const st = lines.findIndex(l => l.trim() === '<style>'), se = lines.findIndex(l => l.trim() === '</style>');
const P = (s) => console.log(s);

P('================ 1. 表格包裹（回溯 8 行）================');
const tbl = []; lines.forEach((l, i) => { if (/<table/.test(l)) tbl.push(i) });
let ok = 0;
tbl.forEach(i => {
  let found = false, at = -1;
  for (let k = i; k >= Math.max(0, i - 8); k--) { if (/class="scroll"|overflow-x:auto/.test(lines[k])) { found = true; at = k + 1; break } }
  if (found) ok++;
  P('   L' + (i + 1) + ' → ' + (found ? '✔ 包裹于 L' + at : '✘ 未找到包裹') + '  | ' + lines[i].trim().slice(0, 80));
});
P('   ⇒ ' + ok + '/' + tbl.length + (ok === tbl.length ? '  ✔ 11/11 全部包裹' : '  ✘'));

P('\n================ 2. 移动端媒体查询全文（L110–160）================');
for (let i = 110; i <= 162; i++) P('   ' + String(i + 1).padStart(4) + ' ' + lines[i]);

P('\n================ 3. 内部串定位（行号 + 上下文 90 字符）================');
['genBuilds', 'v45-3', 'WCONF.', '源码实证', '待游戏内截图校准', '数据契约', 'changelog', 'ABI_ATE', 'docs/战斗分析', '参数</th>'].forEach(tok => {
  const hits = [];
  lines.forEach((l, i) => { let q = -1; while ((q = l.indexOf(tok, q + 1)) > -1) hits.push({ ln: i + 1, ctx: l.slice(Math.max(0, q - 45), q + 45).trim() }) });
  P('   [' + tok + '] 共 ' + hits.length + ' 处');
  hits.slice(0, 6).forEach(h => P('      L' + h.ln + ' … ' + h.ctx));
});

P('\n================ 4. gotoItem 实现 =================');
const gi = html.indexOf('function gotoItem');
P(html.slice(gi, gi + 420).replace(/\n/g, '\n   '));

/* ---------- 渲染态：内部文案是否泄漏到玩家可见面 ---------- */
function mkEl(tag) {
  return { _tag: (tag || 'div').toLowerCase(), children: [], style: {}, dataset: {}, value: '', checked: false, innerHTML: '', textContent: '', className: '', id: '',
    classList: { _s: new Set(), add() { for (const c of arguments) this._s.add(c) }, remove() { for (const c of arguments) this._s.delete(c) }, toggle(c, f) { if (f === undefined) f = !this._s.has(c); f ? this._s.add(c) : this._s.delete(c); return f }, contains(c) { return this._s.has(c) } },
    appendChild(c) { this.children.push(c); return c }, removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c }, insertBefore(c) { this.children.push(c); return c },
    querySelector() { return mkEl('div') }, querySelectorAll() { return [] }, setAttribute(k, v) { this['a_' + k] = v }, getAttribute(k) { return this['a_' + k] === undefined ? null : this['a_' + k] }, removeAttribute() { },
    addEventListener() { }, removeEventListener() { }, focus() { }, blur() { }, click() { }, remove() { }, insertAdjacentHTML() { }, scrollIntoView() { }, getBoundingClientRect() { return { top: 0, left: 0, width: 0, height: 0 } }, closest() { return null }, contains() { return false }, replaceWith() { }, after() { }, before() { } };
}
const reg = new Map(); const getEl = (id) => { if (!reg.has(id)) { const e = mkEl('div'); e.id = id; reg.set(id, e) } return reg.get(id) };
const doc = { getElementById: getEl, createElement: (t) => mkEl(t), createTextNode: (t) => ({ textContent: t, innerHTML: t }), querySelector: () => mkEl('div'), querySelectorAll: () => [], addEventListener() { }, body: mkEl('body'), documentElement: mkEl('html'), head: mkEl('head'), execCommand() { }, createDocumentFragment: () => mkEl('frag') };
const ctx = { console, document: doc, alert() { }, setTimeout, clearTimeout, setInterval: () => 0, clearInterval() { }, JSON, Math, Date, Object, Array, String, Number, Boolean, RegExp, Error, Map, Set, isFinite, isNaN, parseInt, parseFloat, encodeURIComponent, decodeURIComponent, Blob: function () { }, FileReader: function () { }, URL: { createObjectURL() { return '' }, revokeObjectURL() { } }, navigator: { userAgent: 'node' }, location: { hash: '', href: '' } };
ctx.window = ctx; ctx.globalThis = ctx; ctx.window.addEventListener = function () { }; ctx.window.innerHeight = 900; ctx.addEventListener = function () { };
vm.createContext(ctx);
const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi; let m, parts = []; while ((m = re.exec(html)) !== null) { if (/\bsrc\s*=/i.test(m[1] || '')) continue; parts.push(m[2]) }
let le = null; try { vm.runInContext(parts.join('\n;\n'), ctx, { filename: 'x.js' }) } catch (e) { le = e }
P('\n================ 5. 渲染态：内部文案扫描 =================');
P('   加载 = ' + (le ? '异常: ' + le.message : 'OK'));
const TOK = ['WCONF.', '源码实证', '源码考古', '数据契约', '源码未找到', '待游戏内截图校准', 'changelog', 'docs/战斗分析', 'v45-3', 'ABI_ATE', '参数'];
if (!le) {
  const plates = [];
  try { ctx.selectCore('3') } catch (e) { P('   selectCore 异常 ' + e.message) }
  plates.push(['#coreOut', getEl('coreOut').innerHTML]);
  try { ctx.renderAnalyze && ctx.renderAnalyze() } catch (e) { }
  try { ctx.renderTpl && ctx.renderTpl() } catch (e) { }
  try { ctx.renderTplBody && ctx.renderTplBody(0) } catch (e) { }
  try { ctx.renderAbi && ctx.renderAbi() } catch (e) { }
  ['coreOut', 'ruleBoxTeam', 'ruleBoxCore', 'ruleBoxTpl', 'tplRuleTip', 'tplBody', 'abiOut', 'analyzeOut', 'teamOut'].forEach(id => { const h = getEl(id).innerHTML; if (h) plates.push(['#' + id, h]) });
  plates.forEach(([name, h]) => {
    const found = TOK.filter(t => h.indexOf(t) > -1).map(t => t + '×' + (h.split(t).length - 1));
    P('   ' + name.padEnd(14) + ' 长度=' + String(h.length).padEnd(8) + (found.length ? '✘ 命中 ' + found.join(', ') : '✔ 无内部串'));
  });
  const rb = ['ruleBoxTeam', 'ruleBoxCore', 'ruleBoxTpl'].map(id => getEl(id).innerHTML.length);
  P('   口径表三处长度 = ' + JSON.stringify(rb) + (rb[0] === rb[1] && rb[1] === rb[2] ? '  ⚠ 仍完全相同（重复注入未改）' : '  ✔ 已差异化'));
  const tip = getEl('tplRuleTip').innerHTML || getEl('tplRuleTip').textContent || '';
  P('   #tplRuleTip 渲染文本 → ' + String(tip).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 400));
  const co = getEl('coreOut').innerHTML;
  P('   #coreOut 文本节选 → ' + co.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 400));
}
