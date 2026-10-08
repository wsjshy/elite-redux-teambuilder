/* v4.6.1 细节取证 B：口径表引用块原文 / 残余开发语上下文 / toast 样式与实现
   用法: node probe_v461b.cjs <html路径> <sav路径> */
'use strict';
const fs = require('fs'); const vm = require('vm');
const HTML = process.argv[2], SAV = process.argv[3];
const html = fs.readFileSync(HTML, 'utf8');
const lines = html.split('\n');
const P = (s) => console.log(s);
const cnt = (s, sub) => s.split(sub).length - 1;
const scriptTxt = (function () { let out = '', re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi, m; while ((m = re.exec(html)) !== null) { if (/\bsrc\s*=/i.test(m[1] || '')) continue; out += m[2] + '\n;\n' } return out })();

P('================ A. toast 实现与样式 ================');
let i = scriptTxt.indexOf('function toast');
P('   toast 定义 → ' + scriptTxt.slice(i, i + 420).replace(/\n/g, ' ⌁ '));
P('   --- 含 toast 的 CSS 行 ---');
const st = lines.findIndex(l => l.trim() === '<style>'), se = lines.findIndex(l => l.trim() === '</style>');
for (let k = st; k <= se; k++) if (/toast/i.test(lines[k])) P('   L' + (k + 1) + '  ' + lines[k].trim().slice(0, 170));
P('   --- HTML 里 toast 容器 ---');
lines.forEach((l, k) => { if (/id="toast|class="toast/.test(l)) P('   L' + (k + 1) + '  ' + l.trim().slice(0, 170)) });
P('   ruleBox 引用块生成器？→ ' + (scriptTxt.indexOf('ruleBoxTeam') > -1 ? scriptTxt.slice(Math.max(0, scriptTxt.indexOf('ruleBoxTeam') - 420), scriptTxt.indexOf('ruleBoxTeam') + 260).replace(/\n/g, ' ⌁ ') : '(未找到)'));

P('\n================ B. 口径表三处渲染态原文 ================');
function mkEl(tag) { return { _tag: (tag || 'div').toLowerCase(), children: [], style: {}, dataset: {}, value: '', innerHTML: '', textContent: '', className: '', id: '', classList: { _s: new Set(), add() { for (const c of arguments) this._s.add(c) }, remove() { }, toggle() { }, contains() { return false } }, appendChild(c) { this.children.push(c); return c }, removeChild() { }, insertBefore(c) { return c }, querySelector() { return mkEl('div') }, querySelectorAll() { return [] }, setAttribute() { }, getAttribute() { return null }, removeAttribute() { }, addEventListener() { }, focus() { }, blur() { }, click() { }, remove() { }, insertAdjacentHTML() { }, scrollIntoView() { }, getBoundingClientRect() { return { top: 0, left: 0, width: 0, height: 0 } }, closest() { return null }, contains() { return false } } }
const reg = new Map(); const getEl = (id) => { if (!reg.has(id)) { const e = mkEl('div'); e.id = id; reg.set(id, e) } return reg.get(id) };
const doc = { getElementById: getEl, createElement: (t) => mkEl(t), createTextNode: (t) => ({ textContent: t }), querySelector: () => mkEl('div'), querySelectorAll: () => [], addEventListener() { }, body: mkEl('body'), documentElement: mkEl('html'), head: mkEl('head'), createDocumentFragment: () => mkEl('frag') };
const ctx = { console, document: doc, alert() { }, setTimeout, clearTimeout, setInterval: () => 0, clearInterval() { }, JSON, Math, Date, Object, Array, String, Number, Boolean, RegExp, Error, Map, Set, isFinite, isNaN, parseInt, parseFloat, encodeURIComponent, decodeURIComponent, Blob: function () { }, FileReader: function () { }, URL: { createObjectURL() { return '' }, revokeObjectURL() { } }, navigator: { userAgent: 'node' }, location: { hash: '', href: '' } };
ctx.window = ctx; ctx.globalThis = ctx; ctx.window.addEventListener = function () { }; ctx.window.scrollTo = function () { }; ctx.addEventListener = function () { };
vm.createContext(ctx);
try { vm.runInContext(scriptTxt, ctx, { filename: 'x.js' }) } catch (e) { P('   加载异常 ' + e.message) }
ctx.SAV_ROWS = ctx.parseSavBytes(new Uint8Array(fs.readFileSync(SAV))).rows;
['renderTeam', 'renderTpl', 'renderCore'].forEach(n => { if (typeof ctx[n] === 'function') { try { ctx[n]() } catch (e) { P('   ' + n + ' 异常 ' + e.message) } } });
['ruleBoxTeam', 'ruleBoxCore', 'ruleBoxTpl', 'tplRuleTip'].forEach(id => {
  const s = getEl(id).innerHTML || '';
  P('   ---- #' + id + ' (' + s.length + ' 字符) ----');
  P('   ' + (s.length > 700 ? s.slice(0, 700) + ' …[截断]' : s).replace(/\s+/g, ' '));
});
const core = getEl('ruleBoxCore').innerHTML || '';
P('\n   --- #ruleBoxCore 内 "changelog" 上下文 ---');
let q = -1, n = 0; while ((q = core.indexOf('changelog', q + 1)) > -1 && n < 3) { n++; P('   ' + core.slice(Math.max(0, q - 110), q + 90).replace(/\s+/g, ' ')) }
P('   --- #ruleBoxCore 内 "参数" 上下文（前 4 处）---');
q = -1; n = 0; while ((q = core.indexOf('参数', q + 1)) > -1 && n < 4) { n++; P('   ' + core.slice(Math.max(0, q - 130), q + 70).replace(/\s+/g, ' ')) }
P('   --- #ruleBoxCore 内 "WCONF." 上下文（前 3 处）---');
q = -1; n = 0; while ((q = core.indexOf('WCONF.', q + 1)) > -1 && n < 3) { n++; P('   ' + core.slice(Math.max(0, q - 120), q + 80).replace(/\s+/g, ' ')) }
