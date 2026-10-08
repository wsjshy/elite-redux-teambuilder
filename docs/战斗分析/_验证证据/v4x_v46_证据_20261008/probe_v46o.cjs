/* v4.6 第三轮细节取证：<12px 选择器归属 / why 实际可见形态 / 默认 Tab 与 nav 顺序
   用法: node probe_v46o.cjs <html路径> <sav路径> */
'use strict';
const fs = require('fs'); const vm = require('vm');
const HTML = process.argv[2], SAV = process.argv[3];
const html = fs.readFileSync(HTML, 'utf8');
const lines = html.split('\n');
const P = (s) => console.log(s);
const st = lines.findIndex(l => l.trim() === '<style>'), se = lines.findIndex(l => l.trim() === '</style>');

P('================ 1. <12px 声明的选择器归属（base 层）================');
for (let i = st; i <= se; i++) { const m = /font-size\s*:\s*(1[0-1]|[0-9])px/.exec(lines[i]); if (m) P('   L' + (i + 1) + '  ' + lines[i].trim().slice(0, 130)) }
P('   --- 移动端覆盖块（L154–155 原文）---');
P('   L154 ' + lines[153].trim());
P('   L155 ' + lines[154].trim());
P('   --- 移动端 12px 覆盖是否含：ptag/psrc/mcnm/mcx/mxmore/tagline ---');
const cov = (lines[153] + lines[154]);
['.ptag', '.psrc', '.mcnm', '.mcx', '.mxmore', '.tagline', '.whylist', '.slotinfo', '.poolrow', '.savebox', '.gl', '.split', '.card .en', '.badge-pend', '.badge-warnimm', '.ruleline'].forEach(s => P('   ' + s.padEnd(14) + ' 覆盖 = ' + (cov.indexOf(s) > -1 ? '✔' : '✘')));

P('\n================ 2. nav 顺序 / 默认 Tab =================');
const navi = html.indexOf('<nav');
P('   nav 原文 → ' + html.slice(navi, html.indexOf('</nav>', navi) + 6).replace(/\s+/g, ' '));
const act = [];
lines.forEach((l, i) => { if (/class="tab active"/.test(l)) act.push('L' + (i + 1) + ' ' + l.trim().slice(0, 90)) });
P('   默认 active 段 = ' + JSON.stringify(act));
P('   switchTab 签名区 → ' + (html.slice(html.indexOf('function switchTab'), html.indexOf('function switchTab') + 240).replace(/\n/g, ' ')));

P('\n================ 3. why 的实际可见形态 =================');
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
ctx.window = ctx; ctx.globalThis = ctx; ctx.window.addEventListener = function () { }; ctx.window.innerHeight = 900; ctx.window.scrollTo = function () { }; ctx.addEventListener = function () { };
vm.createContext(ctx);
const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi; let m, parts = []; while ((m = re.exec(html)) !== null) { if (/\bsrc\s*=/i.test(m[1] || '')) continue; parts.push(m[2]) }
try { vm.runInContext(parts.join('\n;\n'), ctx, { filename: 'x.js' }) } catch (e) { P('   加载异常 ' + e.message) }
ctx.SAV_ROWS = ctx.parseSavBytes(new Uint8Array(fs.readFileSync(SAV))).rows;
ctx.renderMyPool(); ctx.myCoreTeam('2232');
const out = getEl('myTeamOut').innerHTML;
const ctxs = []; let q = -1;
while ((q = out.indexOf('原则 P', q + 1)) > -1) { ctxs.push(out.slice(Math.max(0, q - 170), q + 90).replace(/\s+/g, ' ')); if (ctxs.length >= 3) break }
ctxs.forEach((c, i) => P('   样本' + (i + 1) + ' → …' + c));
P('   代价 是否位于 title 属性内 = ' + (/title="[^"]*代价/.test(out) ? '✔ 是（悬浮可见）' : '✘ 否'));
const ti = out.match(/title="[^"]{0,240}"/g) || [];
P('   title 属性总数 = ' + ti.length + '；含原则者 = ' + ti.filter(x => /原则/.test(x)).length + '；含代价者 = ' + ti.filter(x => /代价/.test(x)).length);
P('   title 样本 → ' + (ti.find(x => /原则/.test(x)) || '(none)').slice(0, 300));
P('   可见文本中 why 类元素 class 名（slotbody 内首块 700 字符）→ ' + (out.slice(out.indexOf('slotbody'), out.indexOf('slotbody') + 700).replace(/\s+/g, ' ')));
