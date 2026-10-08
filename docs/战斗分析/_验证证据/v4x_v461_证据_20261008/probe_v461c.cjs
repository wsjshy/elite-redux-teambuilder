/* v4.6.1 细节取证 C：渲染面开发过程语关键词全量量化（扩展词表 + 分容器）
   用法: node probe_v461c.cjs <html路径> <sav路径> */
'use strict';
const fs = require('fs'); const vm = require('vm');
const HTML = process.argv[2], SAV = process.argv[3];
const html = fs.readFileSync(HTML, 'utf8');
const P = (s) => console.log(s);
const cnt = (s, sub) => s.split(sub).length - 1;
const scriptTxt = (function () { let out = '', re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi, m; while ((m = re.exec(html)) !== null) { if (/\bsrc\s*=/i.test(m[1] || '')) continue; out += m[2] + '\n;\n' } return out })();
function mkEl(tag) { return { _tag: (tag || 'div').toLowerCase(), children: [], style: {}, dataset: {}, value: '', innerHTML: '', textContent: '', className: '', id: '', classList: { _s: new Set(), add() { for (const c of arguments) this._s.add(c) }, remove() { }, toggle() { }, contains() { return false } }, appendChild(c) { this.children.push(c); return c }, removeChild() { }, insertBefore(c) { return c }, querySelector() { return mkEl('div') }, querySelectorAll() { return [] }, setAttribute() { }, getAttribute() { return null }, removeAttribute() { }, addEventListener() { }, focus() { }, blur() { }, click() { }, remove() { }, insertAdjacentHTML() { }, scrollIntoView() { }, getBoundingClientRect() { return { top: 0, left: 0, width: 0, height: 0 } }, closest() { return null }, contains() { return false } } }
const reg = new Map(); const getEl = (id) => { if (!reg.has(id)) { const e = mkEl('div'); e.id = id; reg.set(id, e) } return reg.get(id) };
const doc = { getElementById: getEl, createElement: (t) => mkEl(t), createTextNode: (t) => ({ textContent: t }), querySelector: () => mkEl('div'), querySelectorAll: () => [], addEventListener() { }, body: mkEl('body'), documentElement: mkEl('html'), head: mkEl('head'), createDocumentFragment: () => mkEl('frag') };
const ctx = { console, document: doc, alert() { }, setTimeout, clearTimeout, setInterval: () => 0, clearInterval() { }, JSON, Math, Date, Object, Array, String, Number, Boolean, RegExp, Error, Map, Set, isFinite, isNaN, parseInt, parseFloat, encodeURIComponent, decodeURIComponent, Blob: function () { }, FileReader: function () { }, URL: { createObjectURL() { return '' }, revokeObjectURL() { } }, navigator: { userAgent: 'node' }, location: { hash: '', href: '' } };
ctx.window = ctx; ctx.globalThis = ctx; ctx.window.addEventListener = function () { }; ctx.window.scrollTo = function () { }; ctx.addEventListener = function () { };
vm.createContext(ctx);
try { vm.runInContext(scriptTxt, ctx, { filename: 'x.js' }) } catch (e) { P('加载异常 ' + e.message) }
ctx.SAV_ROWS = ctx.parseSavBytes(new Uint8Array(fs.readFileSync(SAV))).rows;
['renderPoke', 'renderMoves', 'renderAbi', 'renderType', 'renderTeam', 'renderTpl', 'renderCore', 'renderMyPool'].forEach(n => { if (typeof ctx[n] === 'function') { try { ctx[n]() } catch (e) { P('  ' + n + ' 异常 ' + e.message.slice(0, 50)) } } });
if (typeof ctx.myCoreTeam === 'function') { try { ctx.myCoreTeam('2232') } catch (e) { P('  myCoreTeam 异常 ' + e.message.slice(0, 60)) } }
const IDS = ['pokeOut', 'mvOut', 'abiOut', 'typeOut', 'teamOut', 'tplOut', 'coreOut', 'tplList', 'tplRuleTip', 'ruleBoxTeam', 'ruleBoxCore', 'ruleBoxTpl', 'myPoolWrap', 'myTeamOut', 'glossaryOut', 'mxOut'];
const KW = ['源码实证', '数据表实证', '待游戏内截图校准', '源码考古', '源码未找到', 'changelog', 'WCONF', '游戏源码', '源码核对', 'Pin A=', '待实测', '待游戏内实测确认', 'v2.65', 'v4.x', 'v4.6', 'v45-3', 'alert(', '内部参数', '调试', 'TODO', 'FIXME', 'console.'];
let all = ''; const per = [];
IDS.forEach(id => { const s = getEl(id).innerHTML || ''; if (s) { per.push([id, s]); all += s + '\n' } });
P('渲染面容器 ' + per.length + ' 个 / 合计 ' + all.length + ' 字符\n');
P('===== 全渲染面关键词命中 =====');
KW.forEach(k => { const n = cnt(all, k); P('  ' + k.padEnd(20) + n + (n > 0 ? '   ← 命中' : '')) });
P('\n===== 命中分布（按容器）=====');
per.forEach(([id, s]) => {
  const hits = KW.map(k => [k, cnt(s, k)]).filter(x => x[1] > 0);
  if (hits.length) P('  #' + id.padEnd(12) + ' len=' + String(s.length).padStart(6) + ' → ' + hits.map(x => x[0] + '×' + x[1]).join(' , '));
});
P('\n===== #tplRuleTip 全文（模板页玩家可见提示）=====');
P('  ' + (getEl('tplRuleTip').innerHTML || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
