/* v4.6.2/4.6.3 收口探针 B：内容容器实测（coreOut/myTeamOut）+ sheet 引用 + 两段式状态
   用法: node probe_v462b.cjs <html路径> <sav路径> */
'use strict';
const fs = require('fs'); const vm = require('vm');
const HTML = process.argv[2], SAV = process.argv[3];
const html = fs.readFileSync(HTML, 'utf8');
const P = (s) => console.log(s);
const cnt = (s, sub) => (sub === '' ? 0 : s.split(sub).length - 1);
const scriptTxt = (function () { let out = '', re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi, m; while ((m = re.exec(html)) !== null) { if (/\bsrc\s*=/i.test(m[1] || '')) continue; out += m[2] + '\n;\n' } return out })();
function mkEl(tag) { return { _tag: (tag || 'div').toLowerCase(), children: [], style: {}, dataset: {}, value: '', innerHTML: '', textContent: '', className: '', id: '', classList: { _s: new Set(), add() { for (const c of arguments) this._s.add(c) }, remove() { }, toggle() { }, contains() { return false } }, appendChild(c) { this.children.push(c); return c }, removeChild() { }, insertBefore(c) { return c }, querySelector() { return mkEl('div') }, querySelectorAll() { return [] }, setAttribute() { }, getAttribute() { return null }, removeAttribute() { }, addEventListener() { }, focus() { }, blur() { }, click() { }, remove() { }, insertAdjacentHTML() { }, scrollIntoView() { }, getBoundingClientRect() { return { top: 0, left: 0, width: 0, height: 0 } }, closest() { return null }, contains() { return false } } }
const reg = new Map(); const getEl = (id) => { if (!reg.has(id)) { const e = mkEl('div'); e.id = id; reg.set(id, e) } return reg.get(id) };
const doc = { getElementById: getEl, createElement: (t) => mkEl(t), createTextNode: (t) => ({ textContent: t }), querySelector: () => mkEl('div'), querySelectorAll: () => [], addEventListener() { }, body: mkEl('body'), documentElement: mkEl('html'), head: mkEl('head'), createDocumentFragment: () => mkEl('frag') };
const ctx = { console, document: doc, alert() { }, setTimeout, clearTimeout, setInterval: () => 0, clearInterval() { }, JSON, Math, Date, Object, Array, String, Number, Boolean, RegExp, Error, Map, Set, isFinite, isNaN, parseInt, parseFloat, encodeURIComponent, decodeURIComponent, Blob: function () { }, FileReader: function () { }, URL: { createObjectURL() { return '' }, revokeObjectURL() { } }, navigator: { userAgent: 'node' }, location: { hash: '', href: '' } };
ctx.window = ctx; ctx.globalThis = ctx; ctx.window.addEventListener = function () { }; ctx.window.scrollTo = function () { }; ctx.addEventListener = function () { };
vm.createContext(ctx);
try { vm.runInContext(scriptTxt, ctx, { filename: 'x.js' }) } catch (e) { P('加载异常 ' + e.message) }
const s = ctx.parseSavBytes(new Uint8Array(fs.readFileSync(SAV)));
ctx.SAV_ROWS = s.rows;
P('===== 解析真值 =====');
P('   total=' + s.total + ' party=' + s.party + ' pc=' + s.pc + ' special=' + s.special + ' K=' + s.K);
P('   锚点 → ' + JSON.stringify(s.anchorsOk) + ' | fail=' + JSON.stringify(s.anchorsFail || []));
const names = (s.rows || []).filter(r => ['2232', '598', '2667', '1677', '249', '882'].indexOf(String(r.id)) > -1).slice(0, 8);
P('   队伍 6 只（编号命中，中文名前缀口径）：');
['2232', '598', '2667', '1677', '249', '882'].forEach(id => {
  const r = (s.rows || []).find(x => String(x.id) === id);
  P('     #' + id.padEnd(5) + (r ? ' ' + String(r.zh || r.name || '').slice(0, 14).padEnd(14) + ' 道具「' + String(r.item || '').slice(0, 22) + '」 招式=' + JSON.stringify((r.moves || []).slice(0, 4)) : ' (未找到)'));
});

P('\n===== 两段式内容实测 =====');
function stat(id, tag) { const e = getEl(id); const h = e.innerHTML || ''; P('   ' + tag + ' #' + id.padEnd(15) + ' len=' + String(h.length).padStart(7) + ' | display=' + JSON.stringify(e.style.display === undefined ? '' : e.style.display) + ' | mcspr=' + cnt(h, 'mcspr') + ' | spmiss=' + cnt(h, 'spmiss') + ' | bg-img=' + cnt(h, 'background-image') + ' | assets/sheets=' + cnt(h, 'assets/sheets') + ' | assets/sprites=' + cnt(h, 'assets/sprites') + ' | <img=' + cnt(h, '<img')) }
if (typeof ctx.renderMyPool === 'function') { try { ctx.renderMyPool() } catch (e) { P('   renderMyPool 异常 ' + e.message.slice(0, 70)) } }
P('   [池渲染后]'); ['myPickWrap', 'myPoolWrap', 'myDetailWrap', 'myTeamOut'].forEach(id => stat(id, '「存档」'));
if (typeof ctx.myCoreTeam === 'function') { try { ctx.myCoreTeam('2232') } catch (e) { P('   myCoreTeam 异常 ' + e.message.slice(0, 70)) } }
P('   [选核心后]'); ['myPickWrap', 'myPoolWrap', 'myDetailWrap', 'myTeamOut'].forEach(id => stat(id, '「存档」'));
const t = getEl('myTeamOut').innerHTML || '';
P('     方案卡要点：原则 P=' + cnt(t, '原则 P') + ' | 代价=' + cnt(t, '代价') + ' | needcard=' + cnt(t, 'needcard') + ' | slotbody=' + cnt(t, 'class="slotbody"') + ' | 返回挑选=' + cnt(t, '返回挑选') + ' | 完美含「队伍构建方案」=' + (/队伍构建方案/.test(t) ? '✔' : '✘'));
P('     详情屏是否用到 sheet 精灵图 = ' + (cnt(t, 'background-image') > 0 ? '✔ (mcspr ' + cnt(t, 'mcspr') + ' 处)' : '✘'));
if (typeof ctx.selectCore === 'function') { try { ctx.selectCore(3) } catch (e) { P('   selectCore 异常 ' + e.message.slice(0, 70)) } }
P('   [全图鉴选核心后]'); ['corePickWrap', 'coreDetailWrap', 'coreOut'].forEach(id => stat(id, '「核心」'));
const co = getEl('coreOut').innerHTML || '';
P('     coreOut 要点：原则 P=' + cnt(co, '原则 P') + ' | needcard=' + cnt(co, 'needcard') + ' | slotbody=' + cnt(co, 'class="slotbody"') + ' | mcspr=' + cnt(co, 'mcspr'));
P('   --- 状态保留实证：corePhase/myPhase 是否触碰输入控件（script 原文）---');
P('     ' + (scriptTxt.slice(scriptTxt.indexOf('function corePhase'), scriptTxt.indexOf('function corePhase') + 420).replace(/\s+/g, ' ')));
P('     ' + (scriptTxt.slice(scriptTxt.indexOf('function myPhase'), scriptTxt.indexOf('function myPhase') + 420).replace(/\s+/g, ' ')));
P('\n===== 谱写/渲染面回归哨兵 =====');
const IDS = ['coreOut', 'myPoolWrap', 'myTeamOut', 'tplList', 'ruleBoxCore', 'ruleBoxTeam', 'ruleBoxTpl'];
let all = ''; IDS.forEach(id => { all += (getEl(id).innerHTML || '') + '\n' });
P('   合计 ' + all.length + ' 字符 | assets/sheets=' + cnt(all, 'assets/sheets') + ' | assets/sprites=' + cnt(all, 'assets/sprites') + ' | alert(=' + cnt(all, 'alert('));
['源码实证', '数据表实证', '待游戏内截图校准', 'v45-3', 'v4.6-', 'alert('].forEach(k => P('   含 "' + k + '" = ' + cnt(all, k)));
