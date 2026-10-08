/* v4.6.2（合图）+ v4.6.3（两段式）专项探针
   用法: node probe_v462.cjs <html路径> [sav路径] */
'use strict';
const fs = require('fs'); const vm = require('vm');
const HTML = process.argv[2], SAV = process.argv[3];
const html = fs.readFileSync(HTML, 'utf8');
const lines = html.split('\n');
const P = (s) => console.log(s);
const cnt = (s, sub) => (sub === '' ? 0 : s.split(sub).length - 1);
const scriptTxt = (function () { let out = '', re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi, m; while ((m = re.exec(html)) !== null) { if (/\bsrc\s*=/i.test(m[1] || '')) continue; out += m[2] + '\n;\n' } return out })();
const slines = scriptTxt.split('\n');
const st = lines.findIndex(l => l.trim() === '<style>'), se = lines.findIndex(l => l.trim() === '</style>');

P('================ 0. 静态实现原文（合图 + 两段式）================');
P('   --- sprOf / spTag 区（script L840–856）---');
for (let i = 839; i < 856 && i < slines.length; i++) P('   sL' + (i + 1) + '  ' + slines[i].trim().slice(0, 200));
P('   --- 两段式区（script L4940–4995）---');
for (let i = 4939; i < 4997 && i < slines.length; i++) P('   sL' + (i + 1) + '  ' + slines[i].trim().slice(0, 200));
P('   --- 含 PickWrap/DetailWrap 的 CSS ---');
for (let k = st; k <= se; k++) if (/PickWrap|DetailWrap|\.back|corepick|coredetail|mcspr|spmiss|spsheet/i.test(lines[k])) P('   L' + (k + 1) + '  ' + lines[k].trim().slice(0, 190));

P('\n================ 1. SPR_SHEET 数据 ================');
function mkEl(tag) { return { _tag: (tag || 'div').toLowerCase(), children: [], style: {}, dataset: {}, value: '', innerHTML: '', textContent: '', className: '', id: '', hidden: false, classList: { _s: new Set(), add() { for (const c of arguments) this._s.add(c) }, remove() { for (const c of arguments) this._s.delete(c) }, toggle(c, f) { if (f === undefined) f = !this._s.has(c); f ? this._s.add(c) : this._s.delete(c); return f }, contains(c) { return this._s.has(c) } }, appendChild(c) { this.children.push(c); return c }, removeChild() { }, insertBefore(c) { return c }, querySelector() { return mkEl('div') }, querySelectorAll() { return [] }, setAttribute(k, v) { this['a_' + k] = v }, getAttribute(k) { return this['a_' + k] === undefined ? null : this['a_' + k] }, removeAttribute() { }, addEventListener() { }, focus() { }, blur() { }, click() { }, remove() { }, insertAdjacentHTML() { }, scrollIntoView() { }, getBoundingClientRect() { return { top: 0, left: 0, width: 0, height: 0 } }, closest() { return null }, contains() { return false } } }
const reg = new Map(); const getEl = (id) => { if (!reg.has(id)) { const e = mkEl('div'); e.id = id; reg.set(id, e) } return reg.get(id) };
const doc = { getElementById: getEl, createElement: (t) => mkEl(t), createTextNode: (t) => ({ textContent: t }), querySelector: () => mkEl('div'), querySelectorAll: () => [], addEventListener() { }, body: mkEl('body'), documentElement: mkEl('html'), head: mkEl('head'), createDocumentFragment: () => mkEl('frag') };
const ctx = { console, document: doc, alert() { }, setTimeout, clearTimeout, setInterval: () => 0, clearInterval() { }, JSON, Math, Date, Object, Array, String, Number, Boolean, RegExp, Error, Map, Set, isFinite, isNaN, parseInt, parseFloat, encodeURIComponent, decodeURIComponent, Blob: function () { }, FileReader: function () { }, URL: { createObjectURL() { return '' }, revokeObjectURL() { } }, navigator: { userAgent: 'node' }, location: { hash: '', href: '' } };
ctx.window = ctx; ctx.globalThis = ctx; ctx.window.addEventListener = function () { }; ctx.window.scrollTo = function () { }; ctx.addEventListener = function () { };
vm.createContext(ctx);
try { vm.runInContext(scriptTxt, ctx, { filename: 'x.js' }) } catch (e) { P('   加载异常 ' + e.message) }
const SH = ctx.window.SPR_SHEET || ctx.SPR_SHEET || {};
const keys = Object.keys(SH);
P('   SPR_SHEET 键数 = ' + keys.length + ' | 类型 = ' + (Array.isArray(SH[keys[0]]) ? 'array' : typeof SH[keys[0]]) + ' | 样本 ' + JSON.stringify(keys.slice(0, 3).map(k => [k, SH[k]])));
P('   --- 5 锚点坐标（期望 411→s1[10,9] / 469→s1[4,13] / 741→s2[4,14] / 1513→s4[9,6] / 2232→s6[1,7]）---');
[411, 469, 741, 1513, 2232].forEach(id => P('   id ' + String(id).padEnd(5) + ' → ' + JSON.stringify(SH[String(id)])));
P('   缺失 id 999999 → ' + JSON.stringify(SH['999999'] === undefined ? null : SH['999999']));
if (typeof ctx.sprOf === 'function') {
  P('   sprOf(2232) → ' + String(ctx.sprOf(2232)).slice(0, 200));
  P('   sprOf(999999) → ' + JSON.stringify(ctx.sprOf(999999)));
}
if (typeof ctx.spTag === 'function') { P('   spTag(2232) → ' + ctx.spTag(2232)); P('   spTag(999999) → ' + ctx.spTag(999999)); }
P('   sheet 图引用形式（script 内 sheet 字样样本）→ ' + (scriptTxt.match(/[^"'\n]{0,60}sheet[^"'\n]{0,60}/i) || ['(none)'])[0]);

P('\n================ 2. 渲染：sheet 引用 / assets 引用 / spmiss ================');
if (SAV && fs.existsSync(SAV)) { ctx.SAV_ROWS = ctx.parseSavBytes(new Uint8Array(fs.readFileSync(SAV))).rows; P('   真档已注入（' + SAV + '）') } else { P('   （无真档：仅跑静态 Tab 渲染）') }
['renderPoke', 'renderMoves', 'renderAbi', 'renderType', 'renderTeam', 'renderTpl', 'renderCore'].forEach(n => { if (typeof ctx[n] === 'function') { try { ctx[n]() } catch (e) { P('   ' + n + ' 异常 ' + e.message.slice(0, 60)) } } });
if (typeof ctx.renderMyPool === 'function') { try { ctx.renderMyPool() } catch (e) { P('   renderMyPool 异常 ' + e.message.slice(0, 60)) } }
if (typeof ctx.mxPanelAtk === 'function') { try { const a = ctx.mxPanelAtk('火', false, false); P('   mxPanelAtk(火) len=' + a.length + ' | mcspr=' + cnt(a, 'mcspr') + ' | spmiss=' + cnt(a, 'spmiss') + ' | background-image=' + cnt(a, 'background-image') + ' | <img=' + cnt(a, '<img') + ' | mcnm=' + cnt(a, 'class="mcnm"') + ' | sp\\d+.png=' + cnt(a, 'assets/sprites')); P('     样本 → ' + a.slice(0, 300).replace(/\s+/g, ' ')) } catch (e) { P('   mxPanelAtk 异常 ' + e.message.slice(0, 80)) } }
if (typeof ctx.mxPanelDef === 'function') { try { const d = ctx.mxPanelDef('草+毒', false); P('   mxPanelDef(草+毒) len=' + d.length + ' | mcspr=' + cnt(d, 'mcspr') + ' | spmiss=' + cnt(d, 'spmiss') + ' | background-image=' + cnt(d, 'background-image') + ' | <img=' + cnt(d, '<img') + ' | 拥有该属性=' + cnt(d, '拥有该属性') + ' | （免疫）=' + cnt(d, '（免疫）')); P('     样本 → ' + d.slice(0, 300).replace(/\s+/g, ' ')) } catch (e) { P('   mxPanelDef 异常 ' + e.message.slice(0, 80)) } }
const IDS = ['pokeOut', 'mvOut', 'abiOut', 'typeOut', 'teamOut', 'tplOut', 'coreOut', 'tplList', 'ruleBoxCore', 'myPoolWrap', 'myTeamOut', 'mxOut', 'mxPanel', 'corePickWrap', 'coreDetailWrap', 'myPickWrap', 'myDetailWrap'];
let all = ''; const per = [];
IDS.forEach(id => { const s = getEl(id).innerHTML || ''; if (s) { per.push([id, s]); all += s + '\n' } else per.push([id, '']); });
P('   容器（按 id）：');
per.forEach(([id, s]) => P('     #' + id.padEnd(15) + (s ? 'len=' + String(s.length).padStart(7) + ' | mcspr=' + String(cnt(s, 'mcspr')).padStart(4) + ' | spmiss=' + String(cnt(s, 'spmiss')).padStart(3) + ' | bg-img=' + String(cnt(s, 'background-image')).padStart(4) + ' | assets/sprites=' + String(cnt(s, 'assets/sprites')).padStart(3) + ' | <img=' + String(cnt(s, '<img')).padStart(3) : '(空)')));
P('   合计 ' + all.length + ' 字符 | mcspr=' + cnt(all, 'mcspr') + ' | spmiss=' + cnt(all, 'spmiss') + ' | background-image=' + cnt(all, 'background-image') + ' | assets/sprites=' + cnt(all, 'assets/sprites') + ' | <img=' + cnt(all, '<img') + ' | sp\\d+.png=' + cnt(all, '.png'));

P('\n================ 3. v4.6.3 两段式：core / 存档两条路径 ================');
const cand = ['showCorePick', 'showCoreDetail', 'coreStage', 'backToPick', 'backFromDetail', 'selectCore', 'myCoreTeam', 'myPick', 'myDetail', 'showPick', 'showDetail', 'pickMy'];
P('   候选函数存在性：' + cand.map(n => n + '=' + (typeof ctx[n])).join(' , '));
function stage(label, ids) { ids.forEach(id => { const s = getEl(id).innerHTML || ''; const el = getEl(id); P('     ' + label + ' #' + id.padEnd(15) + ' len=' + String(s.length).padStart(7) + ' | hidden=' + el.hidden + ' | display=' + (el.style.display === undefined ? '' : el.style.display)); }); }
P('   [初始] 核心页两屏：'); stage('core', ['corePickWrap', 'coreDetailWrap']);
if (typeof ctx.selectCore === 'function') { try { ctx.selectCore(3); P('   已调用 selectCore(3)') } catch (e) { P('   selectCore(3) 异常 ' + e.message.slice(0, 80)) } }
P('   [selectCore 后] 核心页两屏：'); stage('core', ['corePickWrap', 'coreDetailWrap']);
const detail = getEl('coreDetailWrap').innerHTML || '';
P('     详情屏含：mcspr=' + cnt(detail, 'mcspr') + ' | background-image=' + cnt(detail, 'background-image') + ' | 返回=' + cnt(detail, '返回') + ' | 原则 P=' + cnt(detail, '原则 P') + ' | <button=' + cnt(detail, '<button'));
const btns = detail.match(/<button[^>]*>[^<]{0,20}<\/button>/g) || [];
P('     详情屏按钮样本 → ' + JSON.stringify(btns.slice(0, 4)));
P('     返回类名（script 内 back 相关）→ ' + JSON.stringify((scriptTxt.match(/class="[^"]*back[^"]*"/gi) || []).slice(0, 5)));
if (SAV && fs.existsSync(SAV)) {
  if (typeof ctx.renderMyPool === 'function') { try { ctx.renderMyPool(); P('   已调用 renderMyPool()') } catch (e) { P('   renderMyPool 异常 ' + e.message.slice(0, 60)) } }
  P('   [池渲染后] 存档路径两屏：'); stage('my', ['myPickWrap', 'myDetailWrap']);
  if (typeof ctx.myCoreTeam === 'function') { try { ctx.myCoreTeam('2232'); P('   已调用 myCoreTeam(2232)') } catch (e) { P('   myCoreTeam 异常 ' + e.message.slice(0, 80)) } }
  P('   [myCoreTeam 后] 存档路径两屏：'); stage('my', ['myPickWrap', 'myDetailWrap']);
  const md = getEl('myDetailWrap').innerHTML || '';
  P('     详情屏：mcspr=' + cnt(md, 'mcspr') + ' | bg-img=' + cnt(md, 'background-image') + ' | 返回=' + cnt(md, '返回') + ' | 原则 P=' + cnt(md, '原则 P') + ' | needcard=' + cnt(md, 'needcard') + ' | 队伍成员=' + cnt(md, 'slotbody'));
}
P('\n================ 4. 回归哨兵 ================');
P('   alert( = ' + cnt(scriptTxt, 'alert(') + ' | toast( = ' + cnt(scriptTxt, 'toast(') + ' | assets/sprites（script）= ' + cnt(scriptTxt, 'assets/sprites') + ' | .spmiss（script）= ' + cnt(scriptTxt, 'spmiss'));
const navi = html.indexOf('<nav');
P('   nav → ' + html.slice(navi, html.indexOf('</nav>', navi) + 6).replace(/\s+/g, ' ').slice(0, 400));
