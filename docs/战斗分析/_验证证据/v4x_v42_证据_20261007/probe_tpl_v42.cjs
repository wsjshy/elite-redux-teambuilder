/* =========================================================================
   v4.2 独立复验 · 正向体系（槽位骨架 / buildTeam）专项探针  [修正版 2]
   用法: node probe_tpl_v42.cjs <html路径>
   约束: 自建，不依赖实施方 verify；只读 HTML 产物与内嵌脚本
   判定: V1..V10
     修正记录（诚实披露）：
       · V1 初版把 tplAll().length>=19 写死 → 实测 tplAll=18 真实模板 + `通用` 兜底骨架
         = SLOT_TABLE 19 键；改为「19 键且全 Σ=6、tplAll ⊂ SLOT_TABLE」。
       · V3 初版把天气手写死为「煤炭龟/九尾」→ 实测 SET 槽 pick=炎玄武（天性「干旱」= 自动开晴）
         属合法选择；改为属性校验「pick 具自动开晴能力」+「速攻槽含本体」。
       · V4/V5 初版只扫 alts 前8/altLow 末3 → 漏判；改为独立重算候选池（finalPool + slotScore）。
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
const TPL = (() => { try { return ctx.tplAll(); } catch (e) { return []; } })();
const tplNames = TPL.map(t => t.name || '');
const ST = ctx.SLOT_TABLE || {};
const stKeys = Object.keys(ST);
const tplByName = n => TPL.filter(t => (t.name || '') === n)[0];
const plan = (core, tpl) => { try { return ctx.buildTeam(core, tpl ? { forceTpl: tpl } : {}); } catch (e) { return { _err: e.message }; } };
const slotOf = (p, id) => (p.slots || []).filter(s => s.slot === id)[0];
const famKey = s => { try { return ctx.teamFamKey(s); } catch (e) { return '#' + s.id; } };
function locFor(p, t) {
  return {
    core: p.core, tpl: p.tpl, tplName: p.tplName, arch: p.arch, sysKey: p.sysKey, sysKey2: '',
    team: [], need: {}, holes: (ctx.coverHoles ? ctx.coverHoles(p.core) : []),
    L: ctx.learnC(t), names: (t.abis || []).concat(t.inns || []), sysList: ctx.spSys(t), conv: ctx.convOf(t)
  };
}
const setAbilOf = (s, sys) => { try { return s.abis.concat(s.inns).filter(n => ctx.abiSetOf(n) === sys); } catch (e) { return []; } };
console.log('loadErr=' + (loadErr ? ('THREW: ' + loadErr.message) : 'null'));
console.log('tplCount=' + TPL.length + ' slotTableKeys=' + stKeys.length + ' slotTableOk=' + (ctx.slotTableOk ? ctx.slotTableOk() : 'NOFN'));

/* 空间打手槽候选池独立重算（W3 口径） */
function poolRank(slotId, coreZh, tplName, name) {
  const t = tplByName(tplName), c = byZh(coreZh), p = plan(c, t);
  if (p._err) return { err: p._err };
  const roster = [p.core].concat((p.slots || []).reduce((a, sl) => a.concat((sl.picks || []).map(x => x.s)), []));
  const rid = {}; roster.forEach(s => rid[s.id] = 1);
  const rows = [];
  ctx.finalPool().forEach(x => {
    if (rid[x.id]) return;
    const r = ctx.slotScore(x, slotId, locFor(p, x));
    if (r) rows.push({ s: x, score: r.score, gate: r.gate });
  });
  rows.sort((a, b) => b.score - a.score);
  const sf = {}, sn = {}, dd = [];
  rows.forEach(o => { const k = 'f' + famKey(o.s); if (sf[k]) return; if (sn[o.s.zh]) return; sf[k] = 1; sn[o.s.zh] = 1; dd.push(o); });
  const iRaw = rows.findIndex(o => o.s.zh === name), iDd = dd.findIndex(o => o.s.zh === name);
  const sl = slotOf(p, slotId);
  return {
    p, sl, raw: rows.length, dedup: dd.length,
    rankRaw: iRaw + 1, rankDd: iDd + 1,
    score: iRaw >= 0 ? rows[iRaw].score : null,
    inPool: iRaw >= 0, gate: iRaw >= 0 ? rows[iRaw].gate : null,
    top1: rows[0] ? rows[0].s.zh + '(' + Math.round(rows[0].score) + ')' : '-', top1Score: rows[0] ? rows[0].score : null,
    inAlts: ((sl || {}).alts || []).some(x => x.s.zh === name),
    inAltLow: ((sl || {}).altLow || []).some(x => x.s.zh === name),
    altLow: ((sl || {}).altLow || []).map(x => x.s.zh + '(' + x.score + ')')
  };
}
const PR = (() => { try { return poolRank('S-TRUSE', '超甲狂犀', '戏法空间', '龙头地鼠'); } catch (e) { return { err: e.message }; } })();
console.log('---- 空间打手槽独立重算 ----');
console.log('过门 raw=' + PR.raw + ' 去重=' + PR.dedup + ' | 龙头地鼠 rankRaw=' + PR.rankRaw + '/' + PR.raw + ' 分=' + PR.score + ' 榜首=' + PR.top1 + '(' + PR.top1Score + ')');
console.log('龙头地鼠 inAlts(前8)=' + PR.inAlts + ' inAltLow(末3)=' + PR.inAltLow + ' | altLow=' + JSON.stringify(PR.altLow));

const NEG = /硬排除|已排除|体系互斥|硬否决|被剔除/;
const R = [];
function A(id, desc, fn) { let ok = false, note = ''; try { const r = fn(); if (r && typeof r === 'object' && 'ok' in r) { ok = !!r.ok; note = String(r.note); } else { ok = !!r; } } catch (e) { ok = false; note = 'THREW: ' + e.message; } R.push({ id, desc, ok, note }); }

A('V1', '骨架 19 键（18 模板+通用兜底）且全部 Σ槽位=6；tplAll ⊂ SLOT_TABLE', () => {
  const dev = stKeys.filter(k => tplNames.indexOf(k) < 0), extra = tplNames.filter(k => stKeys.indexOf(k) < 0);
  const all6 = stKeys.every(k => (ST[k] || []).reduce((a, p) => a + p[1], 0) === 6);
  return { ok: stKeys.length === 19 && all6 && dev.length === 1 && dev[0] === '通用' && extra.length === 0 && ctx.slotTableOk() === true,
    note: 'tplAll=' + TPL.length + ' slotKeys=' + stKeys.length + ' allΣ6=' + all6 + ' 仅骨架=' + JSON.stringify(dev) + ' 越界=' + JSON.stringify(extra) };
});
A('V2', '晴天速攻骨架 = SET1+SPD2+BOOST1+COVER1+WALL-P1', () => ({
  ok: JSON.stringify(ST['晴天速攻']) === JSON.stringify([['S-SET', 1], ['S-SPD', 2], ['S-BOOST', 1], ['S-COVER', 1], ['S-WALL-P', 1]]),
  note: JSON.stringify(ST['晴天速攻'])
}));
A('V3', '晴天方案卡：设置手槽 pick 具【自动开晴】能力 + 速攻槽含本体（妙蛙花）', () => {
  const p = plan(byZh('妙蛙花'), tplByName('晴天速攻'));
  if (p._err) return { ok: false, note: 'ERR ' + p._err };
  const set = slotOf(p, 'S-SET'), sp = slotOf(p, 'S-SPD'), pk = set && set.picks[0];
  const ab = pk ? setAbilOf(pk.s, '晴') : [];
  const coreInSpd = !!sp && (sp.picks || []).some(x => x.s.zh === '妙蛙花');
  return { ok: p.tplName === '晴天速攻' && !!(pk && ab.length) && coreInSpd,
    note: 'tpl=' + p.tplName + ' SETpick=' + (pk ? pk.s.zh : '-') + ' 开晴能力=' + JSON.stringify(ab) + ' SPD核心=' + coreInSpd };
});
A('V4', '空间打手槽：龙头地鼠#530 过门入池、未被剔除（独立重算）', () => ({
  ok: PR.inPool === true && PR.score !== null && PR.score < PR.top1Score,
  note: 'rank=' + PR.rankRaw + '/' + PR.raw + '（去重 ' + PR.rankDd + '/' + PR.dedup + '）分=' + PR.score + ' 榜首=' + PR.top1 + ' gate=' + JSON.stringify(PR.gate)
}));
A('V5', '空间打手槽 Top 由低速重炮占据（低速线维度生效，非中速手）', () => {
  const p = plan(byZh('超甲狂犀'), tplByName('戏法空间'));
  if (p._err) return { ok: false, note: 'ERR ' + p._err };
  const tr = slotOf(p, 'S-TRUSE');
  const picks = (tr.picks || []).map(x => x.s);
  const alts = (tr.alts || []).map(x => x.s);
  const allLow = picks.concat(alts).every(s => spd(s) <= 60);
  return { ok: allLow, note: 'picks+alts 速度=' + JSON.stringify(picks.concat(alts).map(s => s.zh + ':' + spd(s))) };
});
A('V6', '渲染面无负向文案（硬排除/已排除/体系互斥/硬否决/被剔除）', () => {
  const outs = [];
  try { ctx.renderTpl(); outs.push(['tplList', getEl('tplList').innerHTML]); } catch (e) { outs.push(['tplList', 'ERR ' + e.message]); }
  try { ctx.renderCore(byZh('妙蛙花')); outs.push(['coreOut', getEl('coreOut').innerHTML]); } catch (e) { outs.push(['coreOut', 'ERR ' + e.message]); }
  const bad = outs.filter(o => NEG.test(o[1])).map(o => o[0] + ':' + (o[1].match(NEG) || [''])[0]);
  return { ok: bad.length === 0, note: 'sizes=' + outs.map(o => o[0] + '=' + o[1].length).join('/') + ' 命中=' + JSON.stringify(bad) };
});
A('V7', 'wxConflict / wxSetOf / LAST_TM_DROPS 均已移除（undefined）', () => ({
  ok: typeof ctx.wxConflict === 'undefined' && typeof ctx.wxSetOf === 'undefined' && typeof ctx.LAST_TM_DROPS === 'undefined',
  note: 'wxConflict=' + typeof ctx.wxConflict + ' wxSetOf=' + typeof ctx.wxSetOf + ' LAST_TM_DROPS=' + typeof ctx.LAST_TM_DROPS
}));
A('V8', '体系合理性：沙暴方案以岩石/钢/地面受益者为主', () => {
  const p = plan(byZh('龙头地鼠'), tplByName('沙暴联防'));
  if (p._err) return { ok: false, note: 'ERR ' + p._err };
  const picks = [];
  (p.slots || []).forEach(sl => (sl.picks || []).forEach(x => picks.push(x.s)));
  const hit = picks.filter(s => [s.t1, s.t2].some(x => ['岩石', '钢', '地面'].indexOf(x) > -1)).length;
  return { ok: picks.length >= 4 && hit >= Math.ceil(picks.length * 0.6), note: '石/钢/地 ' + hit + '/' + picks.length + ' :: ' + picks.map(s => s.zh).join(',') };
});
A('V9', '体系合理性：雨天速攻方案以高速打手为主（avg ≥ 95）', () => {
  const p = plan(byZh('盖欧卡'), tplByName('雨天速攻'));
  if (p._err) return { ok: false, note: 'ERR ' + p._err };
  const picks = [];
  (p.slots || []).forEach(sl => (sl.picks || []).forEach(x => { if (!x.core) picks.push(x.s); }));
  const avg = picks.length ? Math.round(picks.reduce((a, s) => a + spd(s), 0) / picks.length) : 0;
  return { ok: picks.length >= 3 && avg >= 95, note: 'avg=' + avg + ' :: ' + picks.map(s => s.zh + '(' + spd(s) + ')').join(',') };
});
A('V10', '[低·UI 展示口径] 空间方案 UI 是否含「龙头地鼠」（前8+末3 切片）', () => {
  let has = null, len = 0;
  try { ctx.renderCore(byZh('超甲狂犀')); const h = getEl('coreOut').innerHTML; len = h.length; has = h.indexOf('龙头地鼠') > -1; } catch (e) { return { ok: false, note: 'THREW ' + e.message }; }
  return { ok: has === true, note: 'coreOut len=' + len + ' 含龙头地鼠=' + has + ' | 位次=' + PR.rankRaw + '/' + PR.raw + '（去重 ' + PR.rankDd + '/' + PR.dedup + '）→ 不在前8/末3 切片' };
});

console.log('---- v4.2 判定（V1..V10） ----');
R.forEach(r => console.log((r.ok ? 'PASS ' : 'FAIL ') + r.id + ' | ' + r.desc + ' | ' + r.note));
const pass = R.filter(r => r.ok).length;
console.log('==== SUMMARY ==== total=' + R.length + ' PASS=' + pass + ' FAIL=' + (R.length - pass) + ' FAILIDS=' + JSON.stringify(R.filter(r => !r.ok).map(r => r.id)));
