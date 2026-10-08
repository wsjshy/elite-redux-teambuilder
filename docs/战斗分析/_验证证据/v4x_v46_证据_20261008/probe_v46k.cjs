/* v4.6-B 链路实测（Node VM，独立）：真存档 → parseSavBytes → 我的宝可梦池 → myCoreTeam → 完整方案卡
   用法: node probe_v46k.cjs <html路径> <sav路径> */
'use strict';
const fs = require('fs'); const vm = require('vm');
const HTML = process.argv[2], SAV = process.argv[3];
const html = fs.readFileSync(HTML, 'utf8');
const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi; let m, parts = [];
while ((m = re.exec(html)) !== null) { if (/\bsrc\s*=/i.test(m[1] || '')) continue; parts.push(m[2]); }
const js = parts.join('\n;\n');

function mkEl(tag) {
  const e = {
    _tag: (tag || 'div').toLowerCase(), children: [], style: {}, dataset: {},
    value: '', checked: false, innerHTML: '', textContent: '', className: '', id: '',
    classList: { _s: new Set(), add() { for (const c of arguments) this._s.add(c) }, remove() { for (const c of arguments) this._s.delete(c) }, toggle(c, f) { if (f === undefined) f = !this._s.has(c); f ? this._s.add(c) : this._s.delete(c); return f }, contains(c) { return this._s.has(c) } },
    appendChild(c) { this.children.push(c); return c }, removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c },
    insertBefore(c) { this.children.push(c); return c }, querySelector() { return mkEl('div') }, querySelectorAll() { return [] },
    setAttribute(k, v) { this['a_' + k] = v }, getAttribute(k) { return this['a_' + k] === undefined ? null : this['a_' + k] }, removeAttribute() { },
    addEventListener() { }, removeEventListener() { }, focus() { }, blur() { }, click() { }, remove() { }, insertAdjacentHTML() { },
    scrollIntoView() { }, getBoundingClientRect() { return { top: 0, left: 0, width: 0, height: 0 } }, closest() { return null }, contains() { return false }, replaceWith() { }, after() { }, before() { }
  }; return e;
}
const registry = new Map();
function getEl(id) { if (!registry.has(id)) { const e = mkEl('div'); e.id = id; registry.set(id, e) } return registry.get(id) }
const documentStub = {
  getElementById: getEl, createElement: (t) => mkEl(t), createTextNode: (t) => ({ textContent: t, innerHTML: t }),
  querySelector: () => mkEl('div'), querySelectorAll: () => [], addEventListener() { }, removeEventListener() { },
  body: mkEl('body'), documentElement: mkEl('html'), head: mkEl('head'), execCommand() { }, createDocumentFragment: () => mkEl('frag')
};
const ctx = {
  console, document: documentStub, alert(msg) { alerts.push(String(msg)) }, setTimeout, clearTimeout, setInterval: () => 0, clearInterval() { },
  JSON, Math, Date, Object, Array, String, Number, Boolean, RegExp, Error, Map, Set, isFinite, isNaN, parseInt, parseFloat,
  encodeURIComponent, decodeURIComponent, Blob: function () { }, FileReader: function () { }, URL: { createObjectURL() { return '' }, revokeObjectURL() { } },
  navigator: { userAgent: 'node-v4verify' }, location: { hash: '', href: '' }
};
const alerts = [];
ctx.window = ctx; ctx.globalThis = ctx; ctx.window.addEventListener = function () { };
ctx.window.innerHeight = 900; ctx.window.scrollY = 0; ctx.addEventListener = function () { };
vm.createContext(ctx);
let loadErr = null; try { vm.runInContext(js, ctx, { filename: 'x.js' }) } catch (e) { loadErr = e }

const P = (s) => console.log(s);
let pass = 0, fail = 0;
const A = (id, desc, cond, note) => { cond ? pass++ : fail++; P('   [' + (cond ? 'PASS' : 'FAIL') + '] ' + id + ' ' + desc + (note ? '  | ' + String(note).slice(0, 240) : '')) };
const strip = (s) => String(s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

P('== 加载 ==');
A('L0', '内嵌 script 沙箱加载无异常', !loadErr, loadErr ? loadErr.message : '');
if (loadErr) { P('abort'); process.exit(1) }

P('\n== B1 真存档 → 解析（解析器未改口径）==');
const buf = new Uint8Array(fs.readFileSync(SAV));
let res = null, perr = null; try { res = ctx.parseSavBytes(buf) } catch (e) { perr = e }
A('B1', 'parseSavBytes 成功（无异常）', !!res && !perr, perr ? perr.message : '');
const s = res && res.summary || {};
P('   summary: total=' + s.total + ' party=' + s.party + ' pc=' + s.pc + ' special=' + s.special + ' K=' + s.K + ' anchorsOk=' + (s.anchorsOk || []).length + ' anchorsFail=' + JSON.stringify(s.anchorsFail || []));
A('B2', '5 锚点全过', (s.anchorsFail || []).length === 0 && (s.anchorsOk || []).length === 5, JSON.stringify(s.anchorsOk));
const rows = (res && res.rows) || [];
A('B3', '解析产出 rows（行）供池使用', rows.length === s.total, 'rows=' + rows.length);
P('   rows[0] 键 = ' + JSON.stringify(Object.keys(rows[0] || {}).slice(0, 14)));

P('\n== B2 SAV_ROWS → 我的宝可梦池（renderMyPool）==');
ctx.SAV_ROWS = rows;
let rerr = null; try { ctx.renderMyPool() } catch (e) { rerr = e }
A('B4', 'renderMyPool() 无异常', !rerr, rerr ? rerr.message : '');
const pool = getEl('myPoolWrap').innerHTML || '';
const cards = (pool.match(/class="poolcard"/g) || []).length;
A('B5', '选择池渲染出卡片（>0）', cards > 0, 'poolcard=' + cards + ' innerHTML=' + pool.length + ' 字符');
A('B6', '卡片含精灵图（相对路径 assets/sprites/sp<id>.png）', /class="spmid" src="assets\/sprites\/sp\d+\.png"/.test(pool), (pool.match(/src="([^"]*)"/) || [])[1]);
A('B7', '卡片含 分类(队伍/BOX) + 中文名 + Lv.', /class="psrc"/.test(pool) && /class="pn"/.test(pool) && /Lv\./.test(pool), '');
A('B8', '卡片含 道具 + 特性 标签（ptag）', (pool.match(/class="ptag"/g) || []).length >= 2, 'ptag=' + ((pool.match(/class="ptag"/g) || []).length));
A('B9', '卡片含 末招 摘要', /末招/.test(pool), '');
A('B10', '卡片可点（onclick=myCoreTeam(id)）', (pool.match(/onclick="myCoreTeam\(\d+\)"/g) || []).length === cards, 'n=' + (pool.match(/onclick="myCoreTeam\(\d+\)"/g) || []).length);

P('\n== B3 选核心 → 完整方案卡（buildTeamByNeeds/renderNeedPlan）==');
const partyIds = (res.party || []).map(r => String(r.图鉴编号));
P('   队伍编号 = ' + partyIds.join(','));
const coreId = partyIds[0] || '2232';
let berr = null; try { ctx.myCoreTeam(coreId) } catch (e) { berr = e }
A('B11', 'myCoreTeam(' + coreId + ') 无异常', !berr, berr ? berr.message : '');
const out = getEl('myTeamOut').innerHTML || '';
A('B12', '方案卡已渲染（#myTeamOut 非空）', out.length > 2000, 'innerHTML=' + out.length + ' 字符');
const need = (out.match(/class="needcard"/g) || []).length, slot = (out.match(/class="slotbody"/g) || []).length;
A('B13', '含需求清单卡 needcard（>0）', need > 0, 'needcard=' + need);
A('B14', '含成员槽位 slotbody（>0）', slot > 0, 'slotbody=' + slot);
A('B15', '含体系总览', /体系总览|体系/.test(out), strip(out).slice(0, 120));
A('B16', 'why 含「能打什么｜代价｜原则 P…」结构', /能打什么/.test(out) && /代价/.test(out) && /原则\s*P/.test(out), '原则P=' + (out.match(/原则\s*P[0-9]/g) || []).length);
const pCounts = {}; (out.match(/原则\s*P[0-9]/g) || []).forEach(x => pCounts[x.replace(/\s/g, '')] = (pCounts[x.replace(/\s/g, '')] || 0) + 1);
P('   P 分布 = ' + JSON.stringify(pCounts));
A('B17', '方案提及道具推荐（item 字段/道具名出现在槽位）', /道具/.test(out), '');
A('B18', '无内部编号/调试串泄漏到玩家可见 HTML', !/v45-3|WCONF\.|docs\/战斗分析|genBuilds/.test(out), '');
P('   方案卡文本节选 → ' + strip(out).slice(0, 420));

P('\n== B4 解析器未改（对真值队伍逐只核对）==');
const truth = [[2232, '黑色污泥', ['自我再生', '守住', '大地神力', '毒千针'], [5, 10, 10, 15]], [598, '吃剩的东西', null, null], [2667, '湿润岩石', null, null], [1677, '无', null, null], [249, '文柚果', null, null], [882, '讲究围巾', ['龙之牙', '咬碎', '砂之牙', '鳃咬'], null]];
(res.party || []).forEach((r, i) => {
  const t = truth[i]; if (!t) return;
  const idOk = String(r.图鉴编号) === String(t[0]);
  const itOk = String(r.道具 || '') === String(t[1]);
  let mvOk = true, ppOk = true;
  if (t[2]) { const mv = [r.招式1, r.招式2, r.招式3, r['招式4(末招)']].map(x => String(x || '').replace(/\(id=\d+\)$/, '')); mvOk = mv.join(',') === t[2].join(',') }
  if (t[3]) { const pp = [r.PP1, r.PP2, r.PP3, r.PP4].map(Number); ppOk = pp.join(',') === t[3].join(',') }
  A('B4-' + (i + 1), '队伍#' + (i + 1) + ' ' + (t[0]) + ' 编号/道具' + (t[2] ? '/招式' : '') + (t[3] ? '/PP' : ''), idOk && itOk && mvOk && ppOk, 'id=' + r.图鉴编号 + ' item=' + r.道具 + (t[2] ? ' mv=' + [r.招式1, r.招式2, r.招式3, r['招式4(末招)']].join('|') : '') + (t[3] ? ' pp=' + [r.PP1, r.PP2, r.PP3, r.PP4].join('|') : ''));
});

P('\n== B5 池内容抽样 ==');
const sample = pool.match(/<div class="poolcard"[\s\S]{0,420}?<\/div><\/div>/);
P('   首卡原文 → ' + String(sample && sample[0] || '').slice(0, 460));
P('   alerts 触发 = ' + JSON.stringify(alerts));
P('\n==== B 链路小结 ====');
P('PASS=' + pass + ' FAIL=' + fail);
