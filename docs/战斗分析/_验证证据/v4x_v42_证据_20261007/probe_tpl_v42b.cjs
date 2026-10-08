/* =========================================================================
   v4.2 复验 · 第二支探针：候选池独立重算 + 槽门属性校验
   用法: node probe_tpl_v42b.cjs <html路径>
   目的: (W1) SLOT_TABLE 19 键 vs tplAll 名称差集
         (W2) 晴天 SET 槽 pick 是否「自动开晴者」(属性校验，非硬编码物种)
         (W3) 独立重算 空间打手槽候选池 → 龙头地鼠#530 分数/排位/是否被剔除
         (W4) 同一去重口径下 龙头地鼠 是否落入 UI 可见切片（前8 / 末3）
         (W5) 空间方案 UI HTML 是否含「龙头地鼠」
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
    focus() {}, blur() {}, click() {}, remove() {}, insertAdjacentHTML() {},
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

const SP = (ctx.ERDATA && ctx.ERDATA.species) || [];
const byZh = z => SP.filter(s => s.zh === z)[0];
const spd = s => (s.base || [])[5];
const atkB = s => { try { return Math.max((s.base || [])[1] || 0, (s.base || [])[3] || 0); } catch (e) { return 0; } };
const TPL = (() => { try { return ctx.tplAll(); } catch (e) { return []; } })();
const ST = ctx.SLOT_TABLE || {};
const tplByName = n => TPL.filter(t => (t.name || '') === n)[0];
const plan = (core, tpl) => { try { return ctx.buildTeam(core, tpl ? { forceTpl: tpl } : {}); } catch (e) { return { _err: e.message }; } };
const slotOf = (p, id) => (p.slots || []).filter(s => s.slot === id)[0];
function locFor(p, t) {
  return {
    core: p.core, tpl: p.tpl, tplName: p.tplName, arch: p.arch, sysKey: p.sysKey, sysKey2: '',
    team: [], need: {}, holes: (ctx.coverHoles ? ctx.coverHoles(p.core) : []),
    L: ctx.learnC(t), names: (t.abis || []).concat(t.inns || []), sysList: ctx.spSys(t), conv: ctx.convOf(t)
  };
}
function isSunSetter(s) { try { return s.abis.concat(s.inns).filter(n => ctx.abiSetOf(n) === '晴'); } catch (e) { return []; } }
function famKey(s) { try { return ctx.teamFamKey(s); } catch (e) { return '#' + s.id; } }

console.log('loadErr=' + (loadErr ? ('THREW: ' + loadErr.message) : 'null'));

/* W1: 模板名差集 */
const stKeys = Object.keys(ST);
const tplNames = TPL.map(t => t.name);
console.log('---- W1 模板 vs 骨架 ----');
console.log('tplAll=' + TPL.length + ' :: ' + JSON.stringify(tplNames));
console.log('SLOT_TABLE=' + stKeys.length + ' :: ' + JSON.stringify(stKeys));
console.log('SLOT_TABLE 有而 tplAll 无 = ' + JSON.stringify(stKeys.filter(k => tplNames.indexOf(k) < 0)));
console.log('tplAll 有而 SLOT_TABLE 无 = ' + JSON.stringify(tplNames.filter(k => stKeys.indexOf(k) < 0)));

/* W2: 晴天 SET 槽 pick 是否自动开晴者 */
console.log('---- W2 晴天 SET 槽属性校验 ----');
const sun = tplByName('晴天速攻'), coreSun = byZh('妙蛙花');
const pSun = plan(coreSun, sun);
const setSl = slotOf(pSun, 'S-SET');
const setPick = setSl && setSl.picks[0];
const setAb = setPick ? isSunSetter(setPick.s) : [];
console.log('SET pick = ' + (setPick ? setPick.s.zh + '(' + Math.round((setPick.r || {}).score || 0) + ') 自动开晴能力=' + JSON.stringify(setAb) + ' | abis=' + JSON.stringify(setPick.s.abis) + ' inns=' + JSON.stringify(setPick.s.inns) : 'NONE'));
const setGate = (ctx.SLOT_DEF['S-SET'] || {}).gate;
let gateOk = null; try { gateOk = setGate ? !!setGate(setPick.s, {}) : null; } catch (e) { gateOk = 'THREW ' + e.message; }
const cands = [];
[(setSl || {}).alts || [], (setSl || {}).altLow || []].forEach(arr => arr.forEach(x => { if (isSunSetter(x.s).length) cands.push(x.s.zh); }));
console.log('SET 备选(前8/末3)中自动开晴者 = ' + JSON.stringify(cands));
/* 独立重算 S-SET 池：自动开晴者数量 */
let sunPool = 0, sunNames = [];
ctx.finalPool().forEach(t => { if (isSunSetter(t).length) { sunPool++; if (sunNames.length < 12) sunNames.push(t.zh); } });
console.log('全图鉴最终形态中「自动开晴」者 = ' + sunPool + ' :: ' + JSON.stringify(sunNames));

/* W3/W4: 空间打手槽候选池独立重算 */
console.log('---- W3/W4 空间打手槽(S-TRUSE)候选池独立重算 ----');
const stx = tplByName('戏法空间'), coreTr = byZh('超甲狂犀');
const pTr = plan(coreTr, stx);
const trSl = slotOf(pTr, 'S-TRUSE');
const roster = [pTr.core].concat((pTr.slots || []).reduce((a, sl) => a.concat((sl.picks || []).map(x => x.s)), []));
const rosterIds = {}; roster.forEach(s => rosterIds[s.id] = 1);
const pool = ctx.finalPool();
console.log('finalPool() 全量 = ' + pool.length + ' | 已入队/核心 = ' + roster.length);
const rows = [];
pool.forEach(t => {
  if (rosterIds[t.id]) return;
  const r = ctx.slotScore(t, 'S-TRUSE', locFor(pTr, t));
  if (r) rows.push({ s: t, score: r.score, gate: r.gate });
});
rows.sort((a, b) => b.score - a.score);
const raw = rows.length;
/* 同一去重口径：同族+同名只留最高（与 buildTeam L3401-3402 一致） */
const seenF = {}, seenN = {}, dedup = [];
rows.forEach(o => { const fk = 'f' + famKey(o.s); if (seenF[fk]) return; if (seenN[o.s.zh]) return; seenF[fk] = 1; seenN[o.s.zh] = 1; dedup.push(o); });
const find = n => { for (let i = 0; i < dedup.length; i++) if (dedup[i].s.zh === n) return { rank: i + 1, of: dedup.length, score: dedup[i].score }; return null; };
const rawFind = n => { for (let i = 0; i < rows.length; i++) if (rows[i].s.zh === n) return { rank: i + 1, of: rows.length, score: rows[i].score }; return null; };
console.log('过门候选 raw(未去重) = ' + raw + ' | 去重后 = ' + dedup.length + ' | buildTeam.altPool = ' + ((trSl || {}).altPool));
console.log('榜首 Top5 = ' + JSON.stringify(rows.slice(0, 5).map(o => o.s.zh + '(' + spd(o.s) + '速,' + Math.round(o.score * 10) / 10 + ')')));
console.log('龙头地鼠 raw 排位 = ' + JSON.stringify(rawFind('龙头地鼠')) + ' | 去重后排位 = ' + JSON.stringify(find('龙头地鼠')));
console.log('龙头地鼠 门内? gate=' + JSON.stringify((rows.filter(o => o.s.zh === '龙头地鼠')[0] || {}).gate));
console.log('龙头地鼠 在 buildTeam.alts(前8)? ' + ((trSl || {}).alts || []).some(x => x.s.zh === '龙头地鼠') + ' | 在 altLow(末3)? ' + ((trSl || {}).altLow || []).some(x => x.s.zh === '龙头地鼠'));
console.log('altLow(末3, UI「低排位示例」) = ' + JSON.stringify(((trSl || {}).altLow || []).map(x => x.s.zh + '(' + x.score + ')')));
console.log('alts(前8) = ' + JSON.stringify(((trSl || {}).alts || []).map(x => x.s.zh + '(' + x.score + ')')));

/* W5: 空间方案 UI HTML 是否含龙头地鼠 */
let uiHas = null, uiLen = 0;
try { ctx.renderCore(coreTr); const h = getEl('coreOut').innerHTML; uiLen = h.length; uiHas = h.indexOf('龙头地鼠') > -1; } catch (e) { uiHas = 'THREW ' + e.message; }
console.log('---- W5 ----');
console.log('renderCore(超甲狂犀) coreOut len=' + uiLen + ' 含「龙头地鼠」=' + uiHas);
console.log('该 UI 含「低排位示例」字样 = ' + (uiLen ? (getEl('coreOut').innerHTML.indexOf('低排位示例') > -1) : '?'));
console.log('该 UI 含「不剔除」= ' + (uiLen ? (getEl('coreOut').innerHTML.indexOf('不剔除') > -1) : '?'));
/* 逐槽位正文输出（供人读） */
const body = uiLen ? getEl('coreOut').innerHTML : '';
const mSlot = body.match(/该槽位备选[^<]*/g) || [];
console.log('槽位备选提示行 = ' + JSON.stringify(mSlot));
