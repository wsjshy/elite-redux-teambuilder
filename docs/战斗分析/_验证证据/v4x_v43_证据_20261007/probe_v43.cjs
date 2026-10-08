/* =========================================================================
   v4.3 独立复验 · 需求驱动动态构建专项探针   [自建 / 不依赖实施方 verify]
   用法: node probe_v43.cjs <html路径>
   只读 HTML 产物与内嵌脚本（不读 build_tool_*.py）
   判定项:
     X1 需求定义表 NEED_KINDS + needRegistryOk() 自检
     X2 固定骨架移除（SLOT_TABLE / genBuilds 均 undefined；NEED_EXAMPLES 降级为示例）
     X3 ①需求驱动：needList(core) 动态清单（中文需求 label、无 S- 槽位名）
     X4 ①天气来源条目：wxsrc 池含「九尾」且 gate 报「自动开晴（日照）」
     X5 ②流派命名=打法（含机制前缀；无 物攻流/特攻流/双刀流/均衡全能 残留）
     X6 ③双刀不默认第三流（破盾路线互斥择优，双刀流派 ≤1）
     X7 ④零硬门（空间打手池含龙头地鼠、低排位、不剔除；wxConflict 等已删）
     X8 ⑤紧凑队（凤王 / 大比鸟 <6 只合法，非被 6 只上限截断）
     X9 渲染面无「硬排除/已排除/固定槽位/体系互斥」负向文案
     X10 旧 V5 口径迁移：晴核心流派配招感知天气（生长 74 出现）
   ========================================================================= */
'use strict';
const fs = require('fs'), vm = require('vm');
const HTML = process.argv[2];
const html = fs.readFileSync(HTML, 'utf8');
const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
let m, parts = [];
while ((m = re.exec(html)) !== null) { if (/\bsrc\s*=/i.test(m[1] || '')) continue; parts.push(m[2]); }
const js = parts.join('\n;\n');
function mkEl(tag) {
  const e = {
    _tag: (tag || 'div').toLowerCase(), children: [], style: {}, dataset: {},
    value: '', checked: false, innerHTML: '', textContent: '', className: '', id: '',
    classList: { _s: new Set(), add() { for (const c of arguments) this._s.add(c); }, remove() { for (const c of arguments) this._s.delete(c); }, toggle(c, f) { if (f === undefined) f = !this._s.has(c); f ? this._s.add(c) : this._s.delete(c); return f; }, contains(c) { return this._s.has(c); } },
    appendChild(c) { this.children.push(c); this.innerHTML += (c && c.innerHTML !== undefined ? c.innerHTML : ''); return c; },
    removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c; },
    insertBefore(c) { this.children.push(c); this.innerHTML += (c && c.innerHTML !== undefined ? c.innerHTML : ''); return c; },
    querySelector() { return mkEl('div'); }, querySelectorAll() { return []; },
    setAttribute(k, v) { this['a_' + k] = v; }, getAttribute(k) { return this['a_' + k] === undefined ? null : this['a_' + k]; },
    removeAttribute() {}, addEventListener() {}, removeEventListener() {},
    focus() {}, blur() {}, click() {}, remove() {}, insertAdjacentHTML(p, h) { this.innerHTML += (h || ''); },
    scrollIntoView() {}, getBoundingClientRect() { return { top: 0, left: 0, width: 0, height: 0 }; },
    closest() { return null; }, contains() { return false; }, replaceWith() {}, after() {}, before() {}
  };
  return e;
}
const registry = new Map();
function getEl(id) { if (!registry.has(id)) { const e = mkEl('div'); e.id = id; registry.set(id, e); } return registry.get(id); }
const documentStub = {
  getElementById: getEl, createElement: (t) => mkEl(t), createTextNode: (t) => ({ textContent: t, innerHTML: t }),
  querySelector: () => mkEl('div'), querySelectorAll: () => [], addEventListener() {}, removeEventListener() {},
  body: mkEl('body'), documentElement: mkEl('html'), head: mkEl('head'), execCommand() {}, createDocumentFragment: () => mkEl('frag')
};
const ctx = {
  console, document: documentStub, alert() {}, setTimeout, clearTimeout, setInterval: () => 0, clearInterval() {},
  JSON, Math, Date, Object, Array, String, Number, Boolean, RegExp, Error, Map, Set, isFinite, isNaN, parseInt, parseFloat,
  encodeURIComponent, decodeURIComponent,
  Blob: function () {}, FileReader: function () {}, URL: { createObjectURL() { return ''; }, revokeObjectURL() {} },
  navigator: { userAgent: 'node-v4verify' }, location: { hash: '', href: '' }
};
ctx.window = ctx; ctx.globalThis = ctx;
ctx.window.addEventListener = function () {}; ctx.window.innerHeight = 900; ctx.window.scrollY = 0; ctx.addEventListener = function () {};
vm.createContext(ctx);
let loadErr = null;
try { vm.runInContext(js, ctx, { filename: 'html_script.js' }); } catch (e) { loadErr = e; }

const R = [];
function A(id, ok, detail) { R.push({ id: id, ok: !!ok, detail: detail || '' }); }
const SP = (ctx.ERDATA && ctx.ERDATA.species) || [];
const byZh = z => SP.filter(s => s.zh === z)[0];
const MV = {}; ((ctx.ERDATA && ctx.ERDATA.moves) || []).forEach(x => { MV[+x[0]] = x; });
const F = n => (typeof ctx[n] === 'function');

A('X0-load', !loadErr, loadErr ? ('加载异常: ' + loadErr.message) : ('物种=' + SP.length));

/* ---------- X1 需求定义表 ---------- */
const NK = ctx.NEED_KINDS || {}, NCFG = ctx.NEED_CFG || {};
let regOk = false; try { regOk = ctx.needRegistryOk(); } catch (e) { regOk = 'ERR:' + e.message }
A('X1-needTable', Object.keys(NK).length >= 8 && regOk === true && !!NCFG.MAX_TEAM,
  'NEED_KINDS=' + Object.keys(NK).length + '(' + Object.keys(NK).join(',') + ') needRegistryOk=' + regOk + ' MAX_TEAM=' + NCFG.MAX_TEAM);

/* ---------- X2 固定骨架移除 ---------- */
const gone = ['SLOT_TABLE', 'genBuilds', 'wxConflict', 'wxSetOf', 'LAST_TM_DROPS'].filter(k => ctx[k] !== undefined);
A('X2-noFixedSkeleton', gone.length === 0 && ctx.NEED_EXAMPLES !== undefined,
  '仍存在=' + JSON.stringify(gone) + ' NEED_EXAMPLES=' + (ctx.NEED_EXAMPLES ? Object.keys(ctx.NEED_EXAMPLES).length + '套(仅示例)' : 'undefined'));

const V = byZh('妙蛙花');
const sysKey = (() => { try { return ctx.sysForCore(V).sysKey } catch (e) { return '' } })();
const holes = (() => { try { return ctx.coverHoles(V) } catch (e) { return [] } })();
function baseCx(core, sk, hl) {
  try { const b = ctx.cx0Of(core, sk, hl); if (b) return b } catch (e) { }
  return { sysKey: sk, holes: hl, L: ctx.learnC(core), names: (core.abis || []).concat(core.inns || []), conv: ctx.convOf ? ctx.convOf(core) : null };
}
const NB = baseCx(V, sysKey, holes);
let needs = []; try { needs = ctx.needList(V, NB) } catch (e) { needs = [{ _err: e.message }] }
const nLabels = needs.filter(n => !n._err).map(n => n.id + ':' + n.label + '(p' + n.priority + ',' + n.status + ')');
A('X3-needList', needs.length >= 4 && !needs[0]._err && needs.every(n => n.id && n.kind && n.label && n.role && n.priority && n.status && n.def),
  'V(妙蛙花) 需求 ' + needs.length + ' 条: ' + nLabels.join(' | '));
A('X3b-noSlotNaming', needs.every(n => !/^S-|槽位/.test(String(n.label) + String(n.id))),
  'label 均中文需求、无 S- 槽位名');

/* ---------- X4 天气来源 → 九尾 ---------- */
let wxNeed = needs.filter(n => n.kind === 'wxsrc')[0];
let poolWx = [], wxDetail = '';
if (wxNeed) {
  const cxA = Object.assign({}, NB, { openNeeds: [wxNeed], need: [], needHoles: [] });
  try { poolWx = ctx.poolForNeed(V, cxA, wxNeed, [{ s: V }], {}) } catch (e) { wxDetail = 'ERR:' + e.message }
}
const wxTop = poolWx.slice(0, 5).map(x => x.s.zh + '(' + x.score + '|' + String(x.gate).slice(0, 26) + ')');
const nine = poolWx.filter(x => x.s.zh === '九尾')[0];
A('X4-weatherSourceNine', !!wxNeed && !!nine && /自动开晴/.test(String(nine.gate)),
  'need=' + (wxNeed ? wxNeed.label + ' / why=' + wxNeed.why : '无 wxsrc') + ' | 池Top5=' + wxTop.join(',') +
  ' | 九尾=' + (nine ? ('rank' + (poolWx.indexOf(nine) + 1) + '/' + poolWx.length + ' gate=' + nine.gate) : '不在池') + ' | 九尾特性=' + (byZh('九尾') ? JSON.stringify((byZh('九尾').abis || []).concat(byZh('九尾').inns || [])) : '?') + ' ' + wxDetail);

/* ---------- X5/X6/X10 流派推导 ---------- */
const deriv = (core, team) => { try { return ctx.deriveBuilds(core, team) } catch (e) { return [{ _err: e.message }] } };
const dV = deriv(V);
const banned = /物攻流|特攻流|双刀流|均衡全能|物攻队|特攻队|双刀队/;
const nameOk = dV.length >= 2 && dV.every(b => b.name && new RegExp('晴|空间|强化|清场|压制|破盾|钉子|顺风|免疫|接棒|场地|沙|雨|雪').test(b.name));
const bannedHit = dV.filter(b => banned.test(String(b.name))).map(b => b.name);
A('X5-namingPlaystyle', nameOk && bannedHit.length === 0,
  'V 流派 ' + dV.length + ' 条: ' + dV.map(b => b.id + '=' + b.name + '[tag:' + b.roleTag + ',side:' + b.side + ',basis:' + (b.basis ? b.basis.length : 0) + ']').join(' | ') +
  ' | 禁用词命中=' + JSON.stringify(bannedHit));
/* 修正记录（自纠 1）：初版用 JSON.stringify(b).indexOf('生长') 判 —— 但配招里存的是 {id:74}
   没有中文名，必然判 false（断言口径错，非产物缺陷）。改为按招式 id/ids→中文名解析。 */
const mvName = x => (MV[+x] ? MV[+x][1] : String(x));
const growHit = dV.map(b => ({
  name: b.name,
  main: ((b.mv || {}).main || []).map(x => (+x.id + ':' + mvName(x.id))),
  grow: ((b.mv || {}).main || []).some(x => +x.id === 74 || mvName(x.id) === '生长')
}));
const newV5 = growHit.some(x => x.grow);
A('X10-oldV5-migrated', newV5, '晴核心流派配招含 生长(74) = ' + newV5 + ' | ' + growHit.map(x => x.name + '[' + x.main.join(' ') + ']').join(' || ') + '（旧 V5 口径迁移到 deriveBuilds）');

const C6 = [{ zh: '妙蛙花' }, { zh: '超甲狂犀' }, { zh: '凤王' }, { zh: '班基拉斯' }];
const mixReport = [];
let mixOk = true, routeReport = [];
C6.forEach(o => {
  const c = byZh(o.zh); if (!c) { mixReport.push(o.zh + ':物种缺失'); return; }
  const bs = deriv(c);
  const dbl = bs.filter(b => String(b.name).indexOf('双刀') > -1 || b.side === '双刀');
  let route = ''; try { route = ctx.bestBreakingRoute(ctx.profileOf(c)) } catch (e) { route = 'ERR' }
  if (dbl.length > 1) mixOk = false;
  if (route !== '双刀' && dbl.length) mixOk = false;
  mixReport.push(o.zh + ':流派' + bs.length + '(双刀' + dbl.length + ',route=' + route + ',names=' + bs.map(b => b.name).join('/') + ')');
  routeReport.push(o.zh + '→' + route);
});
A('X6-mixedNotDefault', mixOk, mixReport.join(' | '));

/* ---------- X7 零硬门 + 空间打手池 ---------- */
const pool = (() => { try { return ctx.finalPool() } catch (e) { return [] } })();
const TR = byZh('超甲狂犀');
const trNeed = (() => { try { return ctx.needList(TR, baseCx(TR, (ctx.sysForCore(TR).sysKey || ''), ctx.coverHoles(TR))).filter(n => n.kind === 'truse')[0] } catch (e) { return null } })();
let poolTr = [], trDetail = '';
if (trNeed) {
  const b2 = baseCx(TR, (() => { try { return ctx.sysForCore(TR).sysKey } catch (e) { return '' } })(), ctx.coverHoles(TR));
  try { poolTr = ctx.poolForNeed(TR, Object.assign({}, b2, { openNeeds: [trNeed], need: [], needHoles: [] }), trNeed, [{ s: TR }], {}) }
  catch (e) { trDetail = 'ERR:' + e.message }
}
const dragon = poolTr.filter(x => x.s.zh === '龙头地鼠')[0];
A('X7-zeroHardGate', gone.indexOf('wxConflict') < 0 && pool.length > 800 && !!dragon,
  'finalPool=' + pool.length + ' | truse need=' + (trNeed ? trNeed.label + '(p' + trNeed.priority + ')' : '缺') +
  ' | 空间打手池=' + poolTr.length + ' | 龙头地鼠=' + (dragon ? ('rank' + (poolTr.indexOf(dragon) + 1) + '/' + poolTr.length + ' 分' + dragon.score + ' gate=' + String(dragon.gate).slice(0, 40)) : '不在池') +
  ' | Top3=' + poolTr.slice(0, 3).map(x => x.s.zh + '(' + x.s.base[5] + '速,' + x.score + ')').join(',') + ' ' + trDetail);

/* ---------- X8 紧凑队 ---------- */
const compact = [];
let compactOk = true;
['凤王', '大比鸟'].forEach(z => {
  const c = byZh(z); if (!c) { compact.push(z + ':物种缺失'); compactOk = false; return }
  let t = null; try { t = ctx.buildTeamByNeeds(c) } catch (e) { t = { _err: e.message } }
  if (t._err) { compact.push(z + ':ERR ' + t._err); compactOk = false; return }
  const len = (t.team || []).length;
  if (len >= (NCFG.MAX_TEAM || 6)) compactOk = false;
  if (/MAX_TEAM/.test(String(t.stopReason))) compactOk = false;
  compact.push(z + ':队伍' + len + '只 stop=' + t.stopReason + ' [' + (t.team || []).map(x => (x.s ? x.s.zh : '?')).join('+') + '] 需求' + ((t.needs || []).length) + '条');
});
A('X8-compactTeam', compactOk, compact.join(' | '));

/* ---------- X9 渲染面负向文案 ---------- */
let rendered = '';
const rNames = Object.keys(ctx).filter(k => /^render/.test(k) && typeof ctx[k] === 'function');
rNames.forEach(n => {
  try { const o = ctx[n](V); if (typeof o === 'string') rendered += o } catch (e) { }
  try { const o = ctx[n](V, {}); if (typeof o === 'string') rendered += o } catch (e) { }
});
registry.forEach(e => { rendered += (e.innerHTML || '') + (e.textContent || '') });
const negHit = (rendered.match(/硬排除|已排除|固定槽位|体系互斥/g) || []);
A('X9-noNegativeCopy', negHit.length === 0, 'render* 函数=' + rNames.length + ' 渲染字符=' + rendered.length + ' 负向命中=' + JSON.stringify(negHit.slice(0, 6)));

/* ---------- 报告 ---------- */
console.log('==== v4.3 需求驱动专项 ====');
const pass = R.filter(x => x.ok).length;
R.forEach(x => console.log((x.ok ? 'PASS ' : 'FAIL ') + x.id + ' | ' + x.detail));
console.log('total=' + R.length + ' PASS=' + pass + ' FAIL=' + (R.length - pass));
console.log('==== FACTS ====');
const dt = deriv(byZh('超甲狂犀'));
console.log('超甲狂犀流派=' + JSON.stringify(dt.map(b => ({ id: b.id, name: b.name, tag: b.roleTag, side: b.side, prio: b.prio }))));
console.log('妙蛙花需求优先级=' + JSON.stringify(needs.map(n => n.label + '(' + n.priority + ',' + n.status + ')')));
console.log('妙蛙花流派全字段=' + JSON.stringify(dV).slice(0, 1200));
