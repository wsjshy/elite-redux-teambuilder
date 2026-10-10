/* 规格 v1.0 C 节验证：Node 沙箱跑 HTML 内嵌引擎（DOM 打桩），逐项断言 */
const fs = require('fs'), vm = require('vm'), path = require('path');
const ER = 'D:\\game\\elite-redux\\';
const script = fs.readFileSync(ER + '_chk_script_1.js', 'utf8');

/* ---------- DOM 打桩 ---------- */
function mkEl(id) {
  const el = {
    id: id || '', _html: '', children: [], style: {}, dataset: {}, value: '', checked: false,
    textContent: '', className: '', hidden: false, onclick: null, oninput: null, onchange: null,
    files: null, title: '',
    classList: { _s: {}, add(n) { this._s[n] = 1 }, remove(n) { delete this._s[n] }, toggle(n) { this._s[n] = this._s[n] ? 0 : 1 }, contains(n) { return !!this._s[n] } },
    appendChild(c) { this.children.push(c); return c },
    removeChild() { }, querySelector() { return mkEl('') }, querySelectorAll() { return [] },
    addEventListener() { }, removeEventListener() { }, click() { }, focus() { }, select() { }, closest() { return null }
  };
  Object.defineProperty(el, 'innerHTML', { get: () => el._html, set: v => { el._html = String(v) } });
  return el;
}
const registry = {};
function byId(id) { if (!registry[id]) registry[id] = mkEl(id); return registry[id]; }
const doc = {
  getElementById: byId, createElement: () => mkEl(''), body: mkEl('body'),
  querySelector: () => null, querySelectorAll: () => [], addEventListener() { },
  execCommand() { return true }
};
const alerts = [];
const sandbox = {
  console, setTimeout, clearTimeout, setInterval, clearInterval, Math, Date, JSON, Object, Array, String, Number, Boolean, RegExp, Error,
  document: doc, alert: m => alerts.push(String(m)),
  window: {}, navigator: { userAgent: 'node' }, location: { href: 'file:///x.html' },
  Uint8Array, Uint16Array, Uint32Array, DataView, ArrayBuffer, TextDecoder, TextEncoder,
  Blob: function () { }, URL: { createObjectURL() { return 'blob:x' }, revokeObjectURL() { } },
  FileReader: function () { }, localStorage: { getItem: () => null, setItem() { } }
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
sandbox.addEventListener = function () { };
sandbox.removeEventListener = function () { };
sandbox.scrollTo = function () { };
sandbox.innerHeight = 800;
sandbox.scrollY = 0;
sandbox.getComputedStyle = function () { return {} };
vm.createContext(sandbox);
vm.runInContext(script, sandbox, { timeout: 900000 });
/* v4.6 收尾：原生 alert 已全部改页内轻提示 toast（不阻塞 JS 线程）——断言侧改为捕获 toast 文本，消息内容与语义不变 */
sandbox.toast = function (m) { alerts.push(String(m)); };

/* ---------- 工具 ---------- */
let pass = 0, fail = 0; const fails = [];
function chk(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS  ' + name + (detail !== undefined ? '  → ' + detail : '')); }
  else { fail++; fails.push(name + '  → ' + detail); console.log('  FAIL  ' + name + '  → ' + detail); }
}
function hdr(t) { console.log('\n=== ' + t + ' ==='); }
const E = sandbox.ERDATA;
function spByZh(n) { return E.species.filter(s => s.zh === n)[0] || E.species.filter(s => s.zh.indexOf(n) > -1)[0]; }
function spWhere(f) { return E.species.filter(f); }
function mvName(id) { return sandbox.MV[id] ? sandbox.MV[id][1] : ('#' + id); }
function buildMovesSp(s, side, role) { return sandbox.buildMoves(s, side, role); }
function names(ids) { return ids.map(mvName).join('/'); }

/* ============ 0. 数据层探针（HTML 内嵌 ERDATA） ============ */
hdr('0 数据层探针（HTML 内嵌 ERDATA）');
chk('matchup 21 行 × 21 列', E.matchup.length === 21 && E.matchup.every(r => r.length === 21), 'rows=' + E.matchup.length + ' rowlens=' + JSON.stringify([...new Set(E.matchup.map(r => r.length))]));
chk('moves[0][10] 存在（lDesc 位置数组第 [10] 下标）', Array.isArray(E.moves[0]) && E.moves[0].length >= 11, 'len=' + E.moves[0].length);
const ldescCnt = E.moves.filter(m => m[10] && String(m[10]).trim()).length;
chk('lDesc 非空条数 > 1000', ldescCnt > 1000, 'count=' + ldescCnt);
const convKeys = Object.keys(E.abiTags).filter(k => E.abiTags[k] && E.abiTags[k].conv !== undefined);
chk('abiTags conv = 9 条（v3.24：数据层 2026-10-07 00:24 补入 280/659 目标属性）', convKeys.length === 9, JSON.stringify(convKeys.map(k => k + ':' + E.abiTags[k].conv)));
chk('数据层 conv 只给目标属性、无 src 字段（来源属性由引擎侧 CONV_SRC 补登：280→岩石 / 659→钢）', convKeys.every(k => E.abiTags[k].src === undefined) && E.abiTags['280'].conv === '冰' && E.abiTags['659'].conv === '电' && !!sandbox.CONV_SRC['280'].src && !!sandbox.CONV_SRC['659'].src, 'src 字段出现次数=' + convKeys.filter(k => E.abiTags[k].src !== undefined).length);

/* ============ B8：WCONF / ABI_ATE 落地 ============ */
hdr('B8 WCONF / ABI_ATE 参数落地（已按游戏源码核对后：按 v2.65 源码为准）');
const W = sandbox.WCONF, AT = sandbox.ABI_ATE;
const wantW = { manualDurTurns: 8, abilityDurTurns: 8, rockTurnsAbility: 12, rockTurnsManual: 12, boost: 0.5, abilityBoost: 0.5, terrainBoost: 1.3, terrainDurTurns: 8, terrainExtenderTurns: 12, tailwindTurns: 4, autoTailwindTurns: 4, trickroomTurns: 6, trickroomPrio: -7, paraSpeed: 0.5, paraFullChance: 0.25 };
Object.keys(wantW).forEach(k => chk('WCONF.' + k + ' = ' + wantW[k], W[k] === wantW[k], 'got=' + W[k]));
chk('WCONF.lightClayTurns 定稿结构：招式 4 招 5→8 / North Wind 3→5', W.lightClayTurns && W.lightClayTurns.moveScreens.base === 5 && W.lightClayTurns.moveScreens.clay === 8 && W.lightClayTurns.abilityNorthWind.base === 3 && W.lightClayTurns.abilityNorthWind.clay === 5, JSON.stringify(W.lightClayTurns));
chk('v3.23 天气回合单档：源码 8 / 岩石 12，手动与特性相同（无 changelog 的「手动 5」档）', W.manualDurTurns === 8 && W.abilityDurTurns === 8 && W.rockTurnsManual === 12 && W.rockTurnsAbility === 12, [W.manualDurTurns, W.abilityDurTurns, W.rockTurnsManual, W.rockTurnsAbility].join('/'));
chk('v3.23 天气增伤取消分源：boost == abilityBoost（同档 ×1.5，增量语义 1+值）', W.boost === 0.5 && W.abilityBoost === 0.5 && (1 + W.abilityBoost) === 1.5, 'boost=' + W.boost + ' abilityBoost=' + W.abilityBoost);
chk('v3.23 场地延展器 11 → 12（源码 TERRAIN_DURATION_EXTENDED=12）', W.terrainExtenderTurns === 12, String(W.terrainExtenderTurns));
chk('v3.23 顺风常量 3 ⇒ 实际 4 回合时段（手动/特性自动同）', W.tailwindTurns === 4 && W.autoTailwindTurns === 4, W.tailwindTurns + '/' + W.autoTailwindTurns);
chk('hazardRules 四类齐全', ['spikes', 'stealthRock', 'toxicSpikes', 'stickyWeb'].every(k => W.hazardRules[k]), Object.keys(W.hazardRules).join(','));
chk('hazardRules.spikes 3 层 1/8→1/6→1/4（考古修正 3/16→1/6）', W.hazardRules.spikes.maxLayers === 3 && W.hazardRules.spikes.dmg.join() === [1 / 8, 1 / 6, 1 / 4].join(), W.hazardRules.spikes.dmg.join());
chk('hazardRules.stickyWeb 速度 -1 + 免疫飞行/飘浮/气球', W.hazardRules.stickyWeb.speedStage === -1 && W.hazardRules.stickyWeb.immune.join() === '飞行,飘浮,气球', W.hazardRules.stickyWeb.immune.join());
chk('defogRapidSpin：spin=self / defog=both / 雾中闪避 -1', W.defogRapidSpin.rapidSpin === 'self' && W.defogRapidSpin.defog === 'both' && W.defogRapidSpin.defogEvasion === -1, JSON.stringify(W.defogRapidSpin));
chk('frostbite：1/16 + 特攻×0.5 + 冰雹×1（2026-10-10 定稿：v2.65 已删除雪天×3）', W.frostbite.dmgFraction === 1 / 16 && W.frostbite.spAtkMult === 0.5 && W.frostbite.hailChanceMult === 1, JSON.stringify(W.frostbite));
chk('toxicTerrain：8 回合 / 1.3 / 1/16 / 不转毒菱（定稿）/ 种子不存在（定稿）', W.toxicTerrain.exists === true && W.toxicTerrain.durTurns === 8 && W.toxicTerrain.boost === 1.3 && W.toxicTerrain.dmgFraction === 1 / 16 && W.toxicTerrain.spikesToToxicSpikes === false && W.toxicTerrain.seed.indexOf('不存在') === 0, JSON.stringify(W.toxicTerrain));
chk('ABI_ATE.multiplier = 1.0（v2.65 宏族无 onOffensiveMultiplier）+ stabConvert + procChance 1.0', AT.multiplier === 1.0 && AT.stabConvert === true && AT.procChance === 1.0, JSON.stringify(AT));
chk('ABI_ATE.specialBoost 三特例 ×1.1：96 Normalize / 280 Crystallize / 659 Superconductor', AT.specialBoost['96'] === 1.1 && AT.specialBoost['280'] === 1.1 && AT.specialBoost['659'] === 1.1 && Object.keys(AT.specialBoost).length === 3, JSON.stringify(AT.specialBoost));
chk('ateMulOf：宏族匿名 id → 1.0（如 174 Refrigerate）/ 三特例 → 1.1', sandbox.ateMulOf(174) === 1.0 && sandbox.ateMulOf(96) === 1.1 && sandbox.ateMulOf(280) === 1.1 && sandbox.ateMulOf(659) === 1.1 && sandbox.ateMulOf(null) === 1.0, [174, 96, 280, 659].map(x => x + '→' + sandbox.ateMulOf(x)).join(' '));
chk('待实测清单 0 项（2026-10-10 ER 机制实证定稿：原 6 项全部定稿，WCONF_PEND 清空）', Object.keys(sandbox.WCONF_PEND).length === 0, Object.keys(sandbox.WCONF_PEND).join(','));
chk('v3.23 转定稿项已移出 PEND（天气回合/岩石/增伤/场地倍率/延展器/顺风/-ate）', ['WCONF.rockTurnsManual', 'WCONF.terrainBoost', 'WCONF.terrainExtenderTurns', 'WCONF.tailwindTurns', 'ABI_ATE.stabConvert', 'ABI_ATE.multiplier', 'WCONF.boost', 'WCONF.abilityBoost', 'WCONF.manualDurTurns', 'WCONF.abilityDurTurns', 'WCONF.rockTurnsAbility', 'WCONF.terrainDurTurns'].every(k => !sandbox.WCONF_PEND[k]), Object.keys(sandbox.WCONF_PEND).join(','));
chk('wxNums() 单档 ×1.5（无 +20%）+ 无徽标', /晴\/雨增伤 ×1\.5/.test(sandbox.wxNums()) && /已按游戏源码核对/.test(sandbox.wxNums()) && !/\+20%/.test(sandbox.wxNums()) && !/待游戏内实测确认/.test(sandbox.wxNums()), sandbox.wxNums());
chk('terrainNums() ×1.3 + v2.65 源码注 + 延展器 12 + 无徽标', /×1\.3/.test(sandbox.terrainNums()) && /已按游戏源码核对/.test(sandbox.terrainNums()) && /延展器 12 回合/.test(sandbox.terrainNums()) && !/待游戏内实测确认/.test(sandbox.terrainNums()), sandbox.terrainNums());
const oldTips = E.templates.map(t => (t.tips || []).join('❙')).join('❙');
chk('模板 tips 原文含旧文案（证明 wxTip 有活干）', /20%|30%|无限/.test(oldTips), '含旧文案=' + /20%|30%|无限/.test(oldTips));
const wxTipped = E.templates.map(t => (t.tips || []).map(sandbox.wxTip).join('❙')).join('❙');
chk('wxTip 后无「增伤从 50% 削到 20%」旧文案', wxTipped.indexOf('削到 20%') < 0, wxTipped.indexOf('削到 20%') < 0 ? '已清除' : '仍存在');
chk('wxTip 后无写死 +30% 场地文案', !/\+\s*30%/.test(wxTipped), (wxTipped.match(/\+\s*30%/g) || []).length + ' 处');
chk('wxTip 后含 WCONF 数值(×1.3/8 回合/×1.5)', /×1\.3/.test(wxTipped) && /8 回合/.test(wxTipped) && /×1\.5/.test(wxTipped), '√');
chk('wxTip 后场地/天气标注 v2.65 源码（B_TERRAIN_TYPE_BOOST=GEN_8）', /B_TERRAIN_TYPE_BOOST=GEN_8/.test(wxTipped) && /已按游戏源码核对/.test(wxTipped), '');
chk('wxTip 后无残留徽标（模板 tips 涉及的均已定稿）', !/待游戏内实测确认/.test(wxTipped), (wxTipped.match(/待游戏内实测确认/g) || []).length + ' 处');
chk('wxRuleHtml 含 WCONF 行 + 除钉勘误', /WCONF\.boost/.test(sandbox.wxRuleHtml()) && /229=高速旋转/.test(sandbox.wxRuleHtml()), 'len=' + sandbox.wxRuleHtml().length);
chk('HTML 机制口径：完整表仅注入 #ruleBoxCore 一处（#ruleBoxTeam/#ruleBoxTpl 为引用跳转，同内容不重复）',
  /<th>机制<\/th>/.test(byId('ruleBoxCore')._html) && !/<th>机制<\/th>/.test(byId('ruleBoxTeam')._html) && !/<th>机制<\/th>/.test(byId('ruleBoxTpl')._html) &&
  /gotoRule\(\)/.test(byId('ruleBoxTeam')._html) && /gotoRule\(\)/.test(byId('ruleBoxTpl')._html), 'core=' + byId('ruleBoxCore')._html.length + 'B');
chk('tplRuleTip 已由 JS 填充（无写死 20% 文案）', /WCONF/.test(byId('tplRuleTip')._html) && byId('tplRuleTip')._html.indexOf('天气增伤统一 20%') < 0, byId('tplRuleTip')._html.slice(0, 60));

/* ============ B6：FUNC_MV ============ */
hdr('B6 FUNC_MV（hazard 补 564 / removal=[229,432]）');
chk('hazard 含 564', sandbox.FUNC_MV.hazard.indexOf(564) > -1, JSON.stringify(sandbox.FUNC_MV.hazard));
chk('564 = 黏黏网（Sticky Web）', mvName(564) === '黏黏网', mvName(564));
chk('removal = [229,432] 顺序正确', sandbox.FUNC_MV.removal.join() === '229,432', JSON.stringify(sandbox.FUNC_MV.removal));
chk('229 = 高速旋转（清自身侧）', mvName(229) === '高速旋转', mvName(229));
chk('432 = 清除浓雾（清双方）', mvName(432) === '清除浓雾', mvName(432));
chk('removal 权重 = 0（待实测，仅展示）', sandbox.funcWeight(spByZh('妙蛙花'), '肉盾', 'removal') === 0, sandbox.funcWeight(spByZh('妙蛙花'), '肉盾', 'removal'));
chk('weather 权重 = 40（设置手）', sandbox.funcWeight(spByZh('妙蛙花'), '天气设置手', 'weather') === 40, sandbox.funcWeight(spByZh('妙蛙花'), '天气设置手', 'weather'));
chk('hazard 权重 = 25（铺场/肉盾）', sandbox.funcWeight(spByZh('妙蛙花'), '肉盾', 'hazard') === 25, sandbox.funcWeight(spByZh('妙蛙花'), '肉盾', 'hazard'));

/* ============ B7：isValidSp 护栏 ============ */
hdr('B7 id 2502 护栏（isValidSp）');
const invalid = spWhere(s => { let t = 0; (s.base || []).forEach(x => t += x); return t <= 0 });
console.log('  base 总和<=0 的物种：' + invalid.map(s => s.id + ':' + s.zh + ':' + s.en + '=' + JSON.stringify(s.base)).join(' | '));
chk('isValidSp(2502) === false', sandbox.isValidSp(spByZh('烈焰猴') && spWhere(s => '' + s.id === '2502')[0]) === false, JSON.stringify((spWhere(s => '' + s.id === '2502')[0] || {}).zh));
chk('isValidSp(妙蛙花) === true', sandbox.isValidSp(spByZh('妙蛙花')) === true, '');
chk('isFinalSp 对 2502 无关（护栏独立生效）', typeof sandbox.isFinalSp(2502) === 'boolean', '');
sandbox.optFinalOnly = false;
sandbox.drawCoreList();
const coreMore = byId('coreMore').textContent;
console.log('  核心列表（仅最终形态关）计数：' + coreMore);
chk('核心列表已剔除无效物种（1906-1=1905）', /共 1905 只/.test(coreMore), coreMore);
sandbox.optFinalOnly = true;
sandbox.drawCoreList();
console.log('  核心列表（仅最终形态开）计数：' + byId('coreMore').textContent);

/* ============ B1 + 特性/天性三口径 ============ */
hdr('B1 defCellTrio：勾选可选特性时天性 im/hf 仍生效（叠加不顶替）');
const tStorm = spWhere(s => s.en === 'Storming')[0] || spWhere(s => /storming/i.test(s.en || ''))[0];
console.log('  Storming = #' + tStorm.id + ' ' + tStorm.zh + ' [' + tStorm.t1 + '/' + tStorm.t2 + '] inns=' + JSON.stringify(tStorm.inns) + ' abis=' + JSON.stringify(tStorm.abis));
function trio(s, ty, pick) { const t = sandbox.defCellTrio(s, ty, pick); return { base: t.base, inn: t.inn, opt: t.opt }; }
if (tStorm) {
  const t0 = trio(tStorm, '电', null), t1 = trio(tStorm, '电', tStorm.abis && tStorm.abis[1]);
  const t2 = trio(tStorm, '水', null);
  console.log('  Storming 电：base=' + t0.base + ' inn=' + t0.inn + ' opt=' + t0.opt + ' | 勾选可选「' + (tStorm.abis && tStorm.abis[1]) + '」→ opt=' + t1.opt);
  console.log('  Storming 水：base=' + t2.base + ' inn=' + t2.inn + ' opt=' + t2.opt);
  chk('Storming 电 4x→2x（天性闪电之躯）', t0.base === 4 && t0.inn === 2, 'base=' + t0.base + ' inn=' + t0.inn);
}
const tTu = spWhere(s => '' + s.id === '2232')[0] || spByZh('土王');
console.log('  土王 id=' + tTu.id + ' ' + tTu.zh + ' inns=' + JSON.stringify(tTu.inns) + ' abis=' + JSON.stringify(tTu.abis));
const tw0 = trio(tTu, '水', null);
chk('土王 水 天性储水 → 免（inn=0）', tw0.inn === 0, 'base=' + tw0.base + ' inn=' + tw0.inn + ' opt=' + tw0.opt);
const pickAbi = (tTu.abis || [])[0];
const tw1 = trio(tTu, '水', pickAbi);
console.log('  土王 水：勾选可选「' + pickAbi + '」→ base=' + tw1.base + ' inn=' + tw1.inn + ' opt=' + tw1.opt);
chk('B1 勾选可选特性后 天性水免仍在（inn 仍=0）', tw1.inn === 0, 'inn=' + tw1.inn);
chk('B1 勾选后 opt 仍为免疫（enter 天性叠加）', tw1.opt === 0, 'opt=' + tw1.opt);

/* ============ B5：-ate conv ============ */
hdr('B5 -ate 属性转换（conv 7 条消费）');
const convSp = spWhere(s => sandbox.convOf(s));
console.log('  持有 conv 特性的宝可梦数=' + convSp.length + ' 前 6：' + convSp.slice(0, 6).map(s => s.id + ':' + s.zh + '→' + sandbox.convOf(s).type + '(' + sandbox.convOf(s).abi + '/' + sandbox.convOf(s).scope + ')').join(' | '));
chk('convOf 命中数 > 0', convSp.length > 0, convSp.length + ' 只');
let convDemo = null;
convSp.forEach(s => {
  if (convDemo) return;
  const cv = sandbox.convOf(s);
  if (cv.type === '一般') return;
  ['物理', '特殊'].forEach(side => {
    if (convDemo) return;
    const pool = sandbox.pickAttacks(s, side, 4, '输出');
    const hit = pool.filter(c => c.conv)[0];
    if (hit) convDemo = { s: s, side: side, cv: cv, entry: hit, pool: pool };
  });
});
chk('存在 -ate 转换招进入配招池的样例', !!convDemo, convDemo ? (convDemo.s.zh + ' [' + convDemo.s.t1 + '/' + convDemo.s.t2 + '] ' + convDemo.cv.abi + '→' + convDemo.cv.type + '：' + sandbox.MV[convDemo.entry.id][1]) : '未找到');
if (convDemo) {
  const cidDemo = sandbox.convOf(convDemo.s).id, cmDemo = sandbox.ateMulOf(cidDemo);
  chk('v3.23/v3.24 -ate 转换招标 conv + why 记「×' + cmDemo + ' + 本系 STAB，已按游戏源码核对」+ src 来源属性招有效属性被转换',
    !!convDemo.entry.conv && convDemo.entry.why.join('').indexOf('-ate 属性转换：') > -1 && convDemo.entry.why.join('').indexOf('×' + cmDemo + ' + 本系 STAB，已按游戏源码核对') > -1 && sandbox.effMvType(convDemo.s, sandbox.MV[convDemo.entry.id], convDemo.cv) === convDemo.cv.type,
    sandbox.MV[convDemo.entry.id][1] + '：' + sandbox.whyHtml(convDemo.entry.why));
  chk('v3.23 -ate 转换招 why 无「倍率待实测」残留', convDemo.entry.why.join('').indexOf('待实测') < 0, sandbox.whyHtml(convDemo.entry.why));
  chk('-ate 转换后按本系 STAB（stab=true）', convDemo.entry.stab === true, 'stab=' + convDemo.entry.stab + ' 属性=' + convDemo.entry.ty);
  console.log('  -ate 样例池：' + convDemo.pool.map(c => mvName(c.id) + (c.conv ? '(转换 ×' + sandbox.ateMulOf(c.conv.id) + ')' : '')).join(' | '));
}
/* v3.23 新增：pickAttacks 里的 -ate 倍率消费（宏族 ×1.0 / 三特例 ×1.1 分别取到） */
const nzSp = E.species.filter(s => { const c = sandbox.convOf(s); return c && String(c.id) === '96' })[0];
const rgSp = E.species.filter(s => { const c = sandbox.convOf(s); return c && String(c.id) !== '96' })[0];
console.log('  Normalize(96) 样例=' + (nzSp ? nzSp.zh + '#' + nzSp.id : '无') + ' / 其它 conv 样例=' + (rgSp ? rgSp.zh + '#' + rgSp.id + '(' + sandbox.convOf(rgSp).abi + ')' : '无'));
if (nzSp) {
  const pool96 = sandbox.pickAttacks(nzSp, '物理', 4, '输出').concat(sandbox.pickAttacks(nzSp, '特殊', 4, '输出'));
  const hit96 = pool96.filter(c => c.conv && String(c.conv.id) === '96')[0];
  chk('v3.23 三特例 Normalize(96) 转换招在 pickAttacks 记 ×1.1（无 10% 加成旧值 ×1.05）', !!hit96 && hit96.why.join('').indexOf('×1.1 + 本系 STAB') > -1, hit96 ? (mvName(hit96.id) + ' → ' + sandbox.whyHtml(hit96.why)) : '未找到');
}
if (rgSp) {
  const rcv = sandbox.convOf(rgSp);
  const poolRg = sandbox.pickAttacks(rgSp, '物理', 4, '输出').concat(sandbox.pickAttacks(rgSp, '特殊', 4, '输出'));
  const hitRg = poolRg.filter(c => c.conv && String(c.conv.id) !== '96')[0];
  chk('v3.23 宏族 -ate（如 ' + rcv.abi + '）转换招在 pickAttacks 记 ×1（v2.65 无 onOffensiveMultiplier；旧 ×1.05 已废）', !!hitRg && hitRg.why.join('').indexOf('×1 + 本系 STAB') > -1, hitRg ? (mvName(hitRg.id) + ' → ' + sandbox.whyHtml(hitRg.why)) : '未找到');
}
/* ============ v3.24：conv 来源属性 src（280 Crystallize 岩石→冰 / 659 Superconductor 钢→电） ============ */
hdr('v3.24 -ate conv 来源属性 src（非一般系来源修正）');
chk('CONV_SRC 表：280 → {conv:冰, src:岩石} / 659 → {conv:电, src:钢}', (function () {
  const c = sandbox.CONV_SRC;
  return !!c && c['280'] && c['280'].conv === '冰' && c['280'].src === '岩石' && c['659'].conv === '电' && c['659'].src === '钢' && Object.keys(c).length === 2;
})(), JSON.stringify(sandbox.CONV_SRC));
const crSp = [1536, 1856, 2123].map(id => E.species.filter(s => s.id == id)[0]).filter(Boolean);
console.log('  280 持有者（NM2ID 解析）=' + crSp.map(s => '#' + s.id + s.zh + '[' + s.t1 + '/' + s.t2 + '] abis=' + JSON.stringify(s.abis) + ' inns=' + JSON.stringify(s.inns)).join(' | '));
chk('280 三只持有者（1536/1856/2123）均被 convOf 命中且 src=岩石 / type=冰 / id=280', crSp.length === 3 && crSp.every(s => {
  const c = sandbox.convOf(s); return c && c.src === '岩石' && c.type === '冰' && String(c.id) === '280';
}), crSp.map(s => '#' + s.id + '→' + JSON.stringify(sandbox.convOf(s))).join(' | '));
chk('280 持有者 ateMulOf(id)=1.1（三特例）', crSp.every(s => sandbox.ateMulOf(sandbox.convOf(s).id) === 1.1), String(crSp.length ? sandbox.ateMulOf(sandbox.convOf(crSp[0]).id) : '-'));
const s1536 = E.species.filter(s => s.id == 1536)[0];
if (s1536) {
  const c1536 = sandbox.convOf(s1536), l1536 = sandbox.learnOf(s1536);
  const rock1536 = l1536.filter(id => sandbox.MV[id] && sandbox.MV[id][3] === '岩石' && sandbox.MV[id][4] !== '变化');
  const gen1536 = l1536.filter(id => sandbox.MV[id] && sandbox.MV[id][3] === '一般' && sandbox.MV[id][4] !== '变化');
  console.log('  1536 岩石系攻击招=' + rock1536.length + '（' + rock1536.slice(0, 6).map(id => sandbox.MV[id][1]).join('/') + '） 一般系攻击招=' + gen1536.length);
  chk('v3.24 1536 岩石系招被识别为冰系（effMvType=冰）', rock1536.length > 0 && rock1536.every(id => sandbox.effMvType(s1536, sandbox.MV[id], c1536) === '冰'), rock1536.slice(0, 5).map(id => sandbox.MV[id][1] + '→' + sandbox.effMvType(s1536, sandbox.MV[id], c1536)).join(' | '));
  chk('v3.24 1536 一般系招**不再**被误转（来源是岩石，「一般→冰」错误逻辑已消除）', gen1536.length > 0 && gen1536.every(id => sandbox.effMvType(s1536, sandbox.MV[id], c1536) === '一般'), gen1536.slice(0, 5).map(id => sandbox.MV[id][1] + '→' + sandbox.effMvType(s1536, sandbox.MV[id], c1536)).join(' | '));
  chk('v3.24 1536 非岩非一般招不受影响（冰系仍冰）', l1536.filter(id => sandbox.MV[id] && sandbox.MV[id][3] === '冰').every(id => sandbox.effMvType(s1536, sandbox.MV[id], c1536) === '冰'), '');
  const pool1536 = sandbox.pickAttacks(s1536, '物理', 4, '输出').concat(sandbox.pickAttacks(s1536, '特殊', 4, '输出'));
  const convHit1536 = pool1536.filter(c => c.conv)[0];
  console.log('  1536 池含 conv 招=' + pool1536.filter(c => c.conv).length + ' 样例=' + (convHit1536 ? sandbox.MV[convHit1536.id][1] + ' ty=' + convHit1536.ty + ' why=' + sandbox.whyHtml(convHit1536.why) : '无'));
  chk('v3.24 1536 配招池含岩石系转换招，ty=冰 且 why 记「岩石→冰 ×1.1 + 本系 STAB」', !!convHit1536 && convHit1536.ty === '冰' && convHit1536.why.join('').indexOf('岩石→冰 ×1.1 + 本系 STAB') > -1, convHit1536 ? (sandbox.MV[convHit1536.id][1] + ' ty=' + convHit1536.ty + '：' + sandbox.whyHtml(convHit1536.why)) : '未找到');
  chk('v3.24 1536 配招池中岩石系原招不再以「岩石」计（无 ty=岩石 的攻击槽）', pool1536.filter(c => c.ty === '岩石').length === 0, pool1536.map(c => c.ty).join(','));
  chk('v3.24 convSrcLabel：一般→「一般属性招」/ 岩石→「岩石系招」', sandbox.convSrcLabel({ src: '一般' }) === '一般属性招' && sandbox.convSrcLabel({ src: '岩石' }) === '岩石系招' && sandbox.convSrcLabel({}) === '一般属性招' && sandbox.convSrcLabel({ src: '钢' }) === '钢系招', sandbox.convSrcLabel({ src: '岩石' }));
  const html1536 = (function () { byId('coreOut')._html = ''; sandbox.renderCore(s1536); return byId('coreOut')._html })();
  chk('v3.24 数值卡文案：1536 显示「岩石系招转为 冰」且不再出现「一般属性招转为」', /岩石系招转为/.test(html1536) && /来源属性 岩石→冰/.test(html1536) && !/一般属性招转为/.test(html1536), (html1536.match(/-ate 属性转换：[^<]{0,80}/) || [''])[0]);
}
/* 皮肤系回归：src 缺省「一般」，旧 7 条行为不变 */
chk('v3.24 皮肤系 src 缺省为「一般」（96/174/182/184/206/315/325 全命中）', (function () {
  const rows = [];
  [96, 174, 182, 184, 206, 315, 325].forEach(want => {
    const nm = (E.abilities.filter(a => a[0] == want)[0] || [])[1];
    const sp = E.species.filter(s => sandbox.isValidSp(s) && (s.abis || []).concat(s.inns || []).some(n => String(sandbox.NM2ID[n]) === String(want)))[0];
    if (sp) { const c = sandbox.convOf(sp); rows.push(want + ':' + (c ? (c.src + '→' + c.type) : 'null')); }
  });
  console.log('    皮肤系抽样=' + rows.join(' | '));
  return rows.length >= 5 && rows.every(r => /:一般→/.test(r));
})(), '');
chk('v3.24 一般系来源判定未被破坏：小拉达(96) 一般招→一般 / 尼多王(325) 一般招→毒', (function () {
  const s19 = E.species.filter(s => s.id == 19)[0], s34 = E.species.filter(s => s.id == 34)[0];
  const c19 = sandbox.convOf(s19), c34 = sandbox.convOf(s34);
  const mGen = Object.keys(sandbox.MV).map(k => sandbox.MV[k]).filter(m => m[3] === '一般' && m[4] !== '变化')[0];
  return c19.src === '一般' && sandbox.effMvType(s19, mGen, c19) === '一般' && c34.src === '一般' && sandbox.effMvType(s34, mGen, c34) === '毒';
})(), '小拉达=' + JSON.stringify(sandbox.convOf(E.species.filter(s => s.id == 19)[0])) + ' 尼多王=' + JSON.stringify(sandbox.convOf(E.species.filter(s => s.id == 34)[0])));
chk('v3.24 口径表 -ate 行含「来源属性 src」与 280/659 非一般来源说明', /来源属性 src/.test(byId('ruleBoxCore')._html) && /Crystallize 来源=岩石→冰/.test(byId('ruleBoxCore')._html) && /Superconductor 来源=钢→电/.test(byId('ruleBoxCore')._html) && /CONV_SRC/.test(byId('ruleBoxCore')._html), '');
chk('v3.24 全库 conv 持有者数 ≥ v3.23（新增 280 三只）', (function () {
  const n = E.species.filter(s => sandbox.isValidSp(s) && sandbox.convOf(s)).length;
  console.log('    conv 持有者(有效物种)=' + n);
  return n >= 3;
})(), '');

/* 特性名解析统一（本轮补丁 1）：别名型名称（ERDATA.abiAlias 命中）现在也应被 abiIdByZhOrEn 解析。
   旧断言以「abiIdByZhOrEn 解析为 null 而 abiTagOf 能解析」为别名型判据，修复后该判据恒空 → 改为
   ① 全量别名型名称零未解析；② 按别名表判据统计 conv/out 覆盖；③ 4 个既有调用点确实消费到别名。 */
const aliasMap = E.abiAlias || {};
const aliasNames = Object.keys(aliasMap);
let aliasSlots = 0, aliasUnresolved = [];
E.species.forEach(s => (s.inns || []).concat(s.abis || []).forEach(n => {
  if (aliasMap[n] !== undefined) { aliasSlots++; if (sandbox.abiIdByZhOrEn(n) === null) aliasUnresolved.push(n); }
}));
chk('别名型特性名全部可解析（abiIdByZhOrEn 读 abiAlias）', aliasUnresolved.length === 0,
  '别名表 ' + aliasNames.length + ' 条；别名型槽位 ' + aliasSlots + ' 个；未解析 ' + aliasUnresolved.length + (aliasUnresolved.length ? ' 样例=' + aliasUnresolved.slice(0, 5).join('/') : ''));
chk('命名样例解析：水合=315 / 天气控制=354 / 华贵之鸟≠null', sandbox.abiIdByZhOrEn('水合') === '315' && sandbox.abiIdByZhOrEn('天气控制') === '354' && !!sandbox.abiIdByZhOrEn('华贵之鸟'),
  '水合→' + sandbox.abiIdByZhOrEn('水合') + ' 天气控制→' + sandbox.abiIdByZhOrEn('天气控制') + ' 华贵之鸟→' + sandbox.abiIdByZhOrEn('华贵之鸟'));
const aliasConv = E.species.filter(s => sandbox.isValidSp(s) && aliasMap[s.inns.concat(s.abis).filter(n => aliasMap[n] !== undefined)[0]] !== undefined &&
  sandbox.convOf(s) && s.inns.concat(s.abis).some(n => aliasMap[n] !== undefined && sandbox.abiTagOf(n) && sandbox.abiTagOf(n).conv));
chk('别名型 conv 特性可解析（修正 27 条漏消费）', aliasConv.length > 0, aliasConv.length + ' 只，样例=' + aliasConv.slice(0, 3).map(s => s.zh + '→' + sandbox.convOf(s).type + '(' + sandbox.convOf(s).abi + ')').join(' / '));
const aliasOut = E.species.filter(s => sandbox.isValidSp(s) && s.inns.concat(s.abis).some(n => aliasMap[n] !== undefined && sandbox.abiTagOf(n) && sandbox.abiTagOf(n).out));
chk('别名型 out 特性可解析（修正 249 条漏消费）', aliasOut.length > 0, aliasOut.length + ' 只，样例=' + aliasOut.slice(0, 3).map(s => s.zh).join('/'));
if (aliasOut.length) {
  let demo = null;
  for (const s of aliasOut) {
    const an = s.inns.concat(s.abis).filter(n => aliasMap[n] !== undefined && sandbox.abiTagOf(n) && sandbox.abiTagOf(n).out)[0];
    const o = sandbox.abiTagOf(an).out;
    const ty = (o.type instanceof Array ? o.type[0] : o.type) || s.t1;
    const side = (o.stat === 'atk') ? '物理' : (o.stat === 'spa' ? '特殊' : (o.stat === 'highest' ? (s.base[1] >= s.base[3] ? '物理' : '特殊') : '物理'));
    const adj = sandbox.abiAdjOf(s, side, ty, [an]);
    if (adj.mul >= 1.2) { demo = { s: s, an: an, ty: ty, side: side, adj: adj }; break; }
  }
  chk('别名型 out 特性在 abiAdjOf 生效（对应属性/侧 ×1.2）', !!demo, demo ? (demo.s.zh + ':' + demo.an + ' ' + demo.side + '/' + demo.ty + ' mul=' + demo.adj.mul + ' why=' + demo.adj.why) : '未找到');
}
/* 4 个既有调用点（abiDesc / coreAbiPick / coreIntensity / pickAbiFor）现在消费到别名。
   注意探针口径：coreAbiPick / coreIntensity / pickAbiFor 只消费 s.abis（不含 inns），
   故探针必须落在 abis 上；且 coreAbiPick 只评 im/hf/add/phy/nt + SYS_MAP（不评 out），
   pickAbiFor / coreIntensity 才消费 out —— 分别用对应特性的样本断言。 */
const aliasInAbis = cond => E.species.filter(s => sandbox.isValidSp(s) && (s.abis || []).some(n => aliasMap[n] !== undefined && sandbox.abiTagOf(n) && cond(sandbox.abiTagOf(n))));
const spOut = aliasInAbis(g => g.out)[0];
if (spOut) {
  const an = spOut.abis.filter(n => aliasMap[n] !== undefined && sandbox.abiTagOf(n) && sandbox.abiTagOf(n).out)[0];
  const ci = sandbox.coreIntensity(spOut);
  chk('coreIntensity 消费别名型 out（强度倍率不再为空）', ci.mults.length > 0,
    spOut.zh + ' abis 含「' + an + '」→ mults=' + JSON.stringify(ci.mults.map(m => m.n + '×' + (m.o && m.o.mul))) + ' shield=' + ci.shield);
  const pa = sandbox.pickAbiFor(spOut, '特殊', '炮台');
  chk('pickAbiFor 消费别名型 out（输出评分入 why）', pa.some(x => x.n === an && x.why.join('').indexOf('输出×') > -1),
    spOut.zh + ' → ' + pa.map(x => x.n + ':' + x.sc + '[' + x.why.join(',') + ']').join(' | '));
}
const spIm = aliasInAbis(g => g.im || g.hf || g.add)[0];
if (spIm) {
  const an = spIm.abis.filter(n => aliasMap[n] !== undefined && sandbox.abiTagOf(n) && (sandbox.abiTagOf(n).im || sandbox.abiTagOf(n).hf || sandbox.abiTagOf(n).add))[0];
  const cp = sandbox.coreAbiPick(spIm);
  chk('coreAbiPick 消费别名型 im/hf/add（评分 > 0）', cp.some(x => x.n === an && x.sc > 0),
    spIm.zh + ' abis 含「' + an + '」→ ' + cp.map(x => x.n + ':' + x.sc + '[' + x.why.join(',') + ']').join(' | '));
}
const shellSp = E.species.filter(s => (s.abis || []).some(n => n === '水合'))[0];
if (shellSp) {
  let html = '';
  try { sandbox.openSp(shellSp); html = sandbox.document.getElementById('spDetail').innerHTML; } catch (e) { html = 'ERR ' + e.message; }
  const onclick = 'abiDesc(this,' + sandbox.abiIdByZhOrEn('水合') + ')';
  chk('abiDesc 渲染消费别名（详情 onclick 带 315 而非 null）', html.indexOf(onclick) > -1,
    shellSp.zh + ' 水合→' + sandbox.abiIdByZhOrEn('水合') + '；详情含「' + onclick + '」=' + (html.indexOf(onclick) > -1) + '（详情 html ' + html.length + ' 字符）');
}

/* ============ B3 / B4：lDesc 代价 + 命中微调 ============ */
hdr('B3 lDesc 代价标签 / B4 命中微调');
const m63 = sandbox.MV[63];
const c63 = sandbox.costOf(null, m63, true);
chk('63 破坏光线 → 僵直×0.85', c63.tags.join().indexOf('僵直×0.85') > -1, c63.tags.join() + ' mul=' + c63.mul);
const m457 = sandbox.MV[457];
const c457 = sandbox.costOf(null, m457, false);
chk('457 双刃头锤 → 反伤×0.9（+无回复再×0.9）', c457.tags.join().indexOf('反伤×0.9') > -1, c457.tags.join() + ' mul=' + c457.mul.toFixed(3));
const m332 = sandbox.MV[332];
chk('332 燕返 → 必中×1.05', sandbox.costOf(null, m332, true).tags.join().indexOf('必中×1.05') > -1, sandbox.costOf(null, m332, true).tags.join());
chk('B4 acc=0 → hitAdj 1.05', sandbox.hitAdjOf(m332).mul === 1.05, 'acc=' + m332[6]);
const acc85 = E.moves.filter(m => m[6] === 85 && m[4] !== '变化')[0];
chk('B4 acc=85 → hitAdj 0.95', sandbox.hitAdjOf(acc85).mul === 0.95, mvName(acc85[0]) + ' acc=' + acc85[6]);
const acc80 = E.moves.filter(m => m[6] === 80 && m[4] !== '变化')[0];
chk('B4 acc=80（<85）→ hitAdj 0.8', sandbox.hitAdjOf(acc80).mul === 0.8, mvName(acc80[0]) + ' acc=' + acc80[6]);
const wb = E.moves.filter(m => /Weather-based/i.test(String(m[10] || '')) && m[4] !== '变化').slice(0, 3);
wb.forEach(m => console.log('  条件威力样本 ' + m[0] + ' ' + m[1] + ' → ' + JSON.stringify(sandbox.costOf(null, m, true).tags)));
const wbMoves = E.moves.filter(m => /Weather-based|varies in power|depending on the weather/i.test(String(m[10] || '')) && m[4] !== '变化');
let wxOkPair = null, wxNoPair = null;
E.species.forEach(s => {
  if (wxOkPair && wxNoPair) return;
  const mv = wbMoves.filter(m => sandbox.learnOf(s).indexOf(m[0] * 1) > -1)[0];
  if (!mv) return;
  if (sandbox.wxConditionMet(s) && !wxOkPair) wxOkPair = { s: s, mv: mv };
  if (!sandbox.wxConditionMet(s) && !wxNoPair) wxNoPair = { s: s, mv: mv };
});
chk('条件威力：体系匹配者判「已满足」', wxOkPair && sandbox.costOf(wxOkPair.s, wxOkPair.mv, true).tags.join().indexOf('已满足') > -1, wxOkPair ? (wxOkPair.s.zh + ' ' + mvName(wxOkPair.mv[0]) + ' → ' + JSON.stringify(sandbox.costOf(wxOkPair.s, wxOkPair.mv, true).tags)) : 'n/a');
chk('条件威力：无体系者判「未满足×0.7」', wxNoPair && sandbox.costOf(wxNoPair.s, wxNoPair.mv, true).tags.join().indexOf('未满足×0.7') > -1, wxNoPair ? (wxNoPair.s.zh + ' coreSys=' + JSON.stringify(sandbox.coreSys(wxNoPair.s)) + ' ' + mvName(wxNoPair.mv[0]) + ' → ' + JSON.stringify(sandbox.costOf(wxNoPair.s, wxNoPair.mv, true).tags)) : 'n/a');

/* ============ B9：分层引擎 ============ */
hdr('B9 分层配招引擎');
const venus = spByZh('妙蛙花');
const buildsV = sandbox.deriveBuilds(venus);   /* v4.3：固定枚举 genBuilds → 动态流派推导 deriveBuilds */
console.log('  妙蛙花流派数=' + buildsV.length);
buildsV.forEach((b, i) => console.log('    [' + (i + 1) + '] ' + b.name + ' / ' + b.side + ' / 性格' + b.nat[0][0] + ' / ' + names(b.mv.main.map(x => x.id)) + ' / 备选:' + names(b.mv.backup)));
chk('妙蛙花 流派数 ≥ 2', buildsV.length >= 2, buildsV.length);
const vSpec = buildsV.filter(b => b.side === '特殊')[0];   /* v4.3：流派名=打法，不再按物特命名 */
chk('妙蛙花 特攻流不含剑舞(14)', vSpec && vSpec.mv.main.every(x => x.id !== 14), vSpec ? names(vSpec.mv.main.map(x => x.id)) : 'n/a');
chk('妙蛙花 特攻流含特攻强化(冥想347/诡计417/蝶舞483)或双攻强化(生长74/自我激励504/磨砺526)', vSpec && vSpec.mv.main.some(x => [347, 417, 483, 504, 526, 74].indexOf(x.id) > -1), vSpec ? names(vSpec.mv.main.map(x => x.id)) : 'n/a');
const vPhys = buildsV.filter(b => b.side === '物理')[0];
if (vPhys) chk('妙蛙花 物攻流强化招为物向', vPhys.mv.main.every(x => [347, 417, 483].indexOf(x.id) < 0), names(vPhys.mv.main.map(x => x.id)));
const hoOh = spByZh('凤王');
const buildsH = sandbox.deriveBuilds(hoOh);
console.log('  凤王流派数=' + buildsH.length);
buildsH.forEach((b, i) => console.log('    [' + (i + 1) + '] ' + b.name + ' / ' + b.side + ' / ' + names(b.mv.main.map(x => x.id))));
/* v4.3（07 §4.6）：流派动态推导 —— 破盾路线互斥择优（强化/双刀/拍落/消耗只取 1 条），
   双刀不再默认第三条流派。凤王本例 route=强化 → 不生成双刀流派（旧断言「双侧流派并存」已随
   「流派命名=物特二分」一并作废，改为断言互斥语义本身）。 */
const dualH = buildsH.filter(b => b.side === '双刀')[0];
chk('凤王 破盾路线互斥择优：route=强化 → 不生成双刀流派（双刀不默认第三流）', !dualH && buildsH.every(b => /强化|主力|联防|消耗|清场|轮转|压制/.test(b.name)),
  '流派=' + buildsH.map(b => b.name + '(' + b.side + ')').join(' | ') + ' ｜ 双刀流派=' + (dualH ? dualH.name : '无'));
chk('凤王 流派命名=打法（机制前缀+打法），非物特二分', buildsH.length >= 2 && buildsH.every(b => !/^[物特]攻流$|^双刀流$/.test(b.name)) && buildsH.every(b => b.basis.length >= 2),
  buildsH.map(b => b.name + '[' + b.basis.map(x => x.k).join('+') + ']').join(' | '));
console.log('  凤王属性=' + hoOh.t1 + '/' + hoOh.t2 + '（ER 官方 = 火/妖精）');
/* 选招依据 */
const anyWhy = buildsV[0].mv.main.filter(x => x.why && x.why.length);
chk('流派卡每槽带「选招依据」(why)', anyWhy.length === buildsV[0].mv.main.length, buildsV[0].mv.main.map(x => (x.why || []).length).join(','));
console.log('  选招依据样例：' + buildsV[0].mv.main.map(s => mvName(s.id) + ' = ' + sandbox.whyHtml(s.why)).join(' | '));
/* 功能招权重 */
const fns = sandbox.pickFuncs(venus, '天气', '特殊', []);
console.log('  妙蛙花(天气档)功能招：' + Object.keys(fns).map(k => k + '=' + mvName(fns[k].id) + '(+' + fns[k].w + ')').join(' / '));
chk('pickFuncs 返回带权重的功能招', Object.keys(fns).length > 0, Object.keys(fns).length + ' 类');
/* 天气分源 */
hdr('B9 天气分源（boost / abilityBoost）');
const rainSp = E.species.filter(s => (s.inns || []).some(n => sandbox.SYS_SET[n] === '雨'))[0];
const sunSp = E.species.filter(s => (s.inns || []).some(n => sandbox.SYS_SET[n] === '晴'))[0];
const learn0 = rainSp ? sandbox.learnOf(rainSp) : null;
const waterMv = rainSp ? learn0.filter(id => sandbox.MV[id] && sandbox.MV[id][3] === '水' && sandbox.MV[id][4] !== '变化')[0] : null;
if (rainSp && waterMv) {
  const adj = sandbox.weatherAdjOf(rainSp, sandbox.MV[waterMv], learn0, null);
  console.log('  特性雨设置手 ' + rainSp.zh + '（inns=' + JSON.stringify(rainSp.inns) + '）用水招 ' + mvName(waterMv) + ' → ' + JSON.stringify(adj));
}
const manualSp = E.species.filter(s => {
  const l = sandbox.learnOf(s);
  return l.indexOf(240) > -1 && sandbox.coreSys(s).indexOf('雨') > -1 && !(s.inns || []).some(n => sandbox.SYS_SET[n] === '雨') && l.some(id => sandbox.MV[id] && sandbox.MV[id][3] === '水' && sandbox.MV[id][4] !== '变化' && (sandbox.MV[id][5] || 0) >= 60);
})[0];
if (manualSp) {
  const lm = sandbox.learnOf(manualSp), wm = lm.filter(id => sandbox.MV[id] && sandbox.MV[id][3] === '水' && sandbox.MV[id][4] !== '变化' && (sandbox.MV[id][5] || 0) >= 60)[0];
  const adj2 = sandbox.weatherAdjOf(manualSp, sandbox.MV[wm], lm, null);
  console.log('  手动雨档 ' + manualSp.zh + '（会求雨）用水招 ' + mvName(wm) + ' → ' + JSON.stringify(adj2));
  chk('手动档水招 ×1.5（WCONF.boost）', adj2.mul === 1.5, JSON.stringify(adj2));
  const rainSetter = E.species.filter(s => (s.inns || []).some(n => sandbox.SYS_SET[n] === '雨') && sandbox.learnOf(s).some(id => sandbox.MV[id] && sandbox.MV[id][3] === '水' && sandbox.MV[id][4] !== '变化'))[0];
  if (rainSetter) {
    const lm2 = sandbox.learnOf(rainSetter), wm2 = lm2.filter(id => sandbox.MV[id] && sandbox.MV[id][3] === '水' && sandbox.MV[id][4] !== '变化')[0];
    const adj3 = sandbox.weatherAdjOf(rainSetter, sandbox.MV[wm2], lm2, null);
    console.log('  特性雨设置手 ' + rainSetter.zh + '（inns=' + JSON.stringify(rainSetter.inns) + '）用水招 ' + mvName(wm2) + ' → ' + JSON.stringify(adj3) + '（v3.23：单档，与手动相同）');
    chk('特性档水招 ×1.5（v3.23 取消分源：与手动同档 ×1.5，不再 ×1.2）', (function () {
      const learnNoSetter = lm2.filter(x => [240, 241, 201, 258, 604, 641, 580, 581].indexOf(x) < 0);
      const a = sandbox.weatherAdjOf(rainSetter, sandbox.MV[wm2], learnNoSetter, null);
      console.log('    单特性档 → ' + JSON.stringify(a));
      return a.mul === 1.5;
    })(), '');
    chk('特性档 why 文案含「v2.65 单档」且无 ×1.2 残留', (function () {
      const learnNoSetter = lm2.filter(x => [240, 241, 201, 258, 604, 641, 580, 581].indexOf(x) < 0);
      const a = sandbox.weatherAdjOf(rainSetter, sandbox.MV[wm2], learnNoSetter, null);
      return /v2\.65 单档/.test(String(a.why)) && !/×1\.2/.test(String(a.why)) && !/待游戏内实测确认/.test(String(a.why));
    })(), '');
  }
}
const neverMiss = E.species.filter(s => sandbox.learnOf(s).indexOf(87) > -1 && (s.inns || []).some(n => sandbox.SYS_SET[n] === '雨'))[0];
if (neverMiss) {
  const a = sandbox.weatherAdjOf(neverMiss, sandbox.MV[87], sandbox.learnOf(neverMiss), null);
  console.log('  雨档打雷必中：' + neverMiss.zh + ' → ' + JSON.stringify(a));
  chk('雨→打雷必中 ×1.05', a.mul === 1.05, JSON.stringify(a));
}
chk('雨天必中表 WX_NEVERMISS 正确（雨=87/542、雪=59）', sandbox.WX_NEVERMISS['雨'].join() === '87,542' && sandbox.WX_NEVERMISS['雪'].join() === '59', JSON.stringify(sandbox.WX_NEVERMISS));
chk('场地增伤表（电场→电 / 精神→超能力 / 青草→草 / 剧毒→毒）', sandbox.TERRAIN_DMG['电场'] === '电' && sandbox.TERRAIN_DMG['精神场地'] === '超能力' && sandbox.TERRAIN_DMG['青草场地'] === '草' && sandbox.TERRAIN_DMG['剧毒场地'] === '毒', JSON.stringify(sandbox.TERRAIN_DMG));
/* abiAdj / IMMUNE_RISK */
hdr('B9 abiAdj（out ×1.2 + 免疫风险 ×0.5 警示）');
const gutsSp = E.species.filter(s => (s.abis || []).some(n => { const id = sandbox.abiIdByZhOrEn(n); return id && E.abiTags[id] && E.abiTags[id].out && E.abiTags[id].out.stat === 'atk' }))[0];
if (gutsSp) {
  const a = sandbox.abiAdjOf(gutsSp, '物理', '一般', gutsSp.abis.concat(gutsSp.inns), null);
  console.log('  物攻向 out 特性持有者 ' + gutsSp.zh + ' → ' + JSON.stringify(a));
  chk('out 特性对应侧 ×1.2', a.mul === 1.2, JSON.stringify(a));
}
const waterAdj = sandbox.abiAdjOf(spByZh('妙蛙花'), '特殊', '水', [], null);
chk('免疫风险（无对手）：保守降权 ×0.7 + 提示（本轮补丁 2）', waterAdj.mul === 0.7 && /保守降权 ×0.7/.test(waterAdj.warn || ''), JSON.stringify(waterAdj));
const safeTy = E.types.filter(t => !sandbox.IMMUNE_RISK[t])[0];
if (safeTy) {
  const safeAdj = sandbox.abiAdjOf(spByZh('妙蛙花'), '特殊', safeTy, [], null);
  chk('免疫风险（无对手且该属性无常见免疫特性）：不降权 mul=1 无警示', safeAdj.mul === 1 && !safeAdj.warn, safeTy + ' → ' + JSON.stringify(safeAdj));
}
const riskyOutSp = E.species.filter(s => (s.abis || []).some(n => { const g = sandbox.abiTagOf(n); return g && g.out && (g.out.type instanceof Array ? g.out.type[0] : g.out.type) && sandbox.IMMUNE_RISK[(g.out.type instanceof Array ? g.out.type[0] : g.out.type)] }))[0];
if (riskyOutSp) {
  const rn = riskyOutSp.abis.filter(n => { const g = sandbox.abiTagOf(n); return g && g.out && (g.out.type instanceof Array ? g.out.type[0] : g.out.type) })[0];
  const og = sandbox.abiTagOf(rn).out;
  const oty = (og.type instanceof Array ? og.type[0] : og.type);
  const oside = og.stat === 'spa' ? '特殊' : (og.stat === 'atk' ? '物理' : (og.stat === 'highest' ? (riskyOutSp.base[1] >= riskyOutSp.base[3] ? '物理' : '特殊') : '物理'));
  const oa = sandbox.abiAdjOf(riskyOutSp, oside, oty, [rn], null);
  chk('自身 out ×1.2 与免疫风险共存：cap 口径取 0.7，但自身增益仍记录在 why（口径登记）',
    oa.mul === 0.7 && !!oa.why && !!oa.warn && /保守降权 ×0.7/.test(oa.warn),
    riskyOutSp.zh + ':' + rn + ' ' + oside + '/' + oty + ' → mul=' + oa.mul + ' why=' + oa.why + ' warn=' + oa.warn);
}
const bulletAdj = sandbox.abiAdjOf(leiziProbe(), '特殊', '电', [], null, true);
chk('裁决1 本系豁免：无对手时本系 STAB 电招不降权 mul=1 + 保留免疫警示',
  bulletAdj.mul === 1 && /豁免无目标保守降权/.test(bulletAdj.warn || '') && /蓄电/.test(bulletAdj.warn || ''),
  JSON.stringify(bulletAdj));
const bulletNoFlag = sandbox.abiAdjOf(leiziProbe(), '特殊', '电', [], null);
chk('裁决1 对照：isStab 缺省（未传第6参）时行为不变仍 ×0.7', bulletNoFlag.mul === 0.7, JSON.stringify(bulletNoFlag));
const probeSp = leiziProbe();
const nonStabTy = Object.keys(sandbox.IMMUNE_RISK).filter(t => t !== probeSp.t1 && t !== probeSp.t2)[0];
const bulletNonStab = sandbox.abiAdjOf(probeSp, '特殊', nonStabTy, [], null, false);
chk('裁决1 对照：非本系补盲招维持 ×0.7（同精灵/同无对手）', bulletNonStab.mul === 0.7 && /保守降权 ×0.7/.test(bulletNonStab.warn || ''),
  probeSp.zh + ' ' + nonStabTy + ' → ' + JSON.stringify(bulletNonStab));
const tgtAdj = sandbox.abiAdjOf(leiziProbe(), '特殊', '电', [], ['蓄电'], true);
chk('免疫风险（有对手且目标带免疫特性）：本系也 ×0.5（真免疫不豁免）+ 目标警示', tgtAdj.mul === 0.5 && /目标/.test(tgtAdj.warn || ''), JSON.stringify(tgtAdj));
const convStabSp = E.species.filter(s => { const c = sandbox.convOf(s); return c && c.type && sandbox.IMMUNE_RISK[c.type] })[0];
if (convStabSp) {
  const ct = sandbox.convOf(convStabSp).type;
  const cOn = sandbox.abiAdjOf(convStabSp, '特殊', ct, [], null, true);
  const cOff = sandbox.abiAdjOf(convStabSp, '特殊', ct, [], null, false);
  chk('裁决1 -ate 转换后本系同样豁免：同属性 isStab true=×1 / false=×0.7',
    cOn.mul === 1 && cOff.mul === 0.7 && /豁免/.test(cOn.warn || ''),
    convStabSp.zh + ' ' + sandbox.convOf(convStabSp).abi + '→' + ct + ' 本系=' + JSON.stringify(cOn) + ' 非本系=' + JSON.stringify(cOff));
}
function leiziProbe() { return E.species.filter(s => (s.inns || []).concat(s.abis || []).indexOf('蓄电') > -1)[0] }
chk('IMMUNE_RISK 非空且按属性索引', Object.keys(sandbox.IMMUNE_RISK).length >= 8, Object.keys(sandbox.IMMUNE_RISK).join(','));
/* B9 质量护栏：STAB 不得被免疫风险惩罚整体挤掉 */
const lzSp = E.species.filter(s => '' + s.id === '1677')[0];
const lzPool = sandbox.pickAttacks(lzSp, '特殊', 4, '输出');
chk('雷电云特攻池保留本系招（免疫惩罚不误伤自身 STAB）', lzPool.some(c => c.ty === lzSp.t1 || c.ty === lzSp.t2), lzPool.map(c => mvName(c.id) + '(' + c.ty + cx(c) + ')').join(' | '));
function cx(c) { return c.stab ? '·本系' : '' }
/* 裁决1 效果护栏：雷电云特攻主流派主攻槽须含本系攻击招（而非被非本系挤掉） */
const lzBuilds = sandbox.deriveBuilds(lzSp);
const lzSpec = lzBuilds.filter(b => b.side === '特殊')[0] || lzBuilds[0];
const lzAtkSlots = lzSpec.mv.main.filter(x => { const m = sandbox.MV[x.id]; return m && m[4] !== '变化' && (m[5] || 0) >= 55 });
const lzStabSlots = lzAtkSlots.filter(x => { const m = sandbox.MV[x.id], ty = sandbox.effMvType(lzSp, m, sandbox.convOf(lzSp)); return ty === lzSp.t1 || ty === lzSp.t2 });
chk('裁决1 效果：雷电云特攻主流派主攻槽含本系攻击招（电/飞行）', lzStabSlots.length > 0,
  (lzSpec.name || '?') + ' → ' + lzSpec.mv.main.map(x => mvName(x.id) + '(' + (sandbox.MV[x.id][4]) + (sandbox.MV[x.id][4] !== '变化' && (sandbox.MV[x.id][5] || 0) >= 55 ? '·攻' : '') + ')').join(' | '));
const lzStabWhy = lzAtkSlots.filter(x => { const m = sandbox.MV[x.id], ty = sandbox.effMvType(lzSp, m, sandbox.convOf(lzSp)); return ty === lzSp.t1 || ty === lzSp.t2 }).map(x => (x.why || []).join(' + ')).join(' || ');
chk('裁决1 效果：本系主攻招的「选招依据」含免疫警示且明确标注豁免（未套用保守降权）', /豁免无目标保守降权/.test(lzStabWhy) && !/（无明确对手，按规格 B9 保守降权 ×0.7）/.test(lzStabWhy), lzStabWhy);

/* ============ B9 分层5：盲点检查 ============ */
hdr('B9 分层5 盲点检查（setCoverProfile / blindList）');
const idsV = buildsV[0].mv.main.map(x => x.id);
const profV = sandbox.setCoverProfile(venus, idsV, sandbox.convOf(venus));
const blindV = sandbox.blindList(profV);
chk('setCoverProfile 覆盖 21 属性', Object.keys(profV).length === 21, Object.keys(profV).length);
chk('blindList 输出子集且不含 星晶/无/神秘', blindV.every(t => ['星晶', '无', '神秘'].indexOf(t) < 0), blindV.join('/') || '（无盲点）');
console.log('  妙蛙花流派1 盲点=' + (blindV.join('/') || '无'));

/* ============ B9 引擎端到端：土王 / 雷电云 / 鳃鱼龙 ============ */
hdr('B9 端到端多流派（土王 / 雷电云 / 鳃鱼龙 / 洛奇亚）');
[['2232', '土王Mega'], ['1677', '雷电云灵兽'], ['770', '鳃鱼龙']].forEach(function (p) {
  const s = spWhere(x => '' + x.id === p[0])[0];
  if (!s) { console.log('  ' + p[1] + ' #' + p[0] + ' 未找到'); return; }
  const bs = sandbox.deriveBuilds(s);
  console.log('  ' + s.zh + ' #' + s.id + ' [' + s.t1 + '/' + s.t2 + '] inns=' + JSON.stringify(s.inns) + ' 流派=' + bs.length);
  bs.forEach((b, i) => console.log('    [' + (i + 1) + '] ' + b.name + ' / ' + b.side + ' / ' + names(b.mv.main.map(x => x.id))));
  const ty = (s.t1 === '水' || s.t2 === '水') ? '水' : '电';
  const tr = sandbox.defCellTrio(s, ty);
  console.log('    defCellTrio(' + ty + ') base=' + tr.base + ' inn=' + tr.inn + ' opt=' + tr.opt);
});
const lugg = spByZh('洛奇亚');
if (lugg) { const tr = sandbox.defCellTrio(lugg, '地面'); console.log('  洛奇亚 地面 base=' + tr.base + ' inn=' + tr.inn + ' opt=' + tr.opt + ' inns=' + JSON.stringify(lugg.inns)); }
const leizi = spWhere(s => s.zh.indexOf('雷电云') > -1)[0];
if (leizi) { const tr = sandbox.defCellTrio(leizi, '电'); console.log('  ' + leizi.zh + ' 电 base=' + tr.base + ' inn=' + tr.inn + ' opt=' + tr.opt); }

/* ============ 存档解析回归 ============ */
hdr('存档导入回归（parseSavBytes 真实 .sav）');
const savCands = [ER + 'ER2.65简汉化\\ERv2.65-beta2-debug汉化版.sav', 'D:\\mGBA-0.10.2-win64\\ROM\\elite redux\\ER2.65简汉化\\ERv2.65-beta2-debug汉化版.sav', 'D:\\mGBA-0.10.2-win64\\ROM\\elite redux\\elite redux 2.5 debug.sav'];
const savPath = savCands.filter(p => fs.existsSync(p))[0];
if (!savPath) { console.log('  [存档回归] 未找到测试 .sav（已列入候选：' + savCands.join(' | ') + '）'); }
else console.log('  [存档回归] 使用 ' + savPath);
const buf = fs.readFileSync(savPath);
const u8 = new Uint8Array(buf);
const res = sandbox.parseSavBytes(u8);
console.log('  summary=' + JSON.stringify({ total: res.summary.total, party: res.summary.party, pc: res.summary.pc, special: res.summary.special, K: res.summary.K }));
console.log('  anchorsOk=' + JSON.stringify(res.summary.anchorsOk));
console.log('  anchorsFail=' + JSON.stringify(res.summary.anchorsFail));
chk('总记录 431', res.summary.total === 431, res.summary.total);
chk('队伍 6', res.summary.party === 6, res.summary.party);
chk('电脑区 425', res.summary.pc === 425, res.summary.pc);
chk('特殊区 15', res.summary.special === 15, res.summary.special);
chk('段轮换链 K 已识别（K∈[3,4]：K 是存档自身轮换状态指纹，随游玩推进变化——v4.6.1 时点 ROM 副本 K=3 / 原项目副本 K=4；解析器未改）', res.summary.K === 4 || res.summary.K === 3, res.summary.K);
chk('5 锚点全过', res.summary.anchorsFail.length === 0 && res.summary.anchorsOk.length === 5, 'ok=' + res.summary.anchorsOk.length + ' fail=' + res.summary.anchorsFail.join(';'));
res.party.forEach(r => console.log('    ' + r.位置 + ' ' + r.物种 + ' Lv' + r.等级 + ' 道具=' + (r.道具 || '无') + ' 4招=' + [r.招式1, r.招式2, r.招式3, r.招式4].join('/') + ' PP=' + [r.PP1, r.PP2, r.PP3, r.PP4].join('/')));
/* 队伍导入 + 队伍体检（含 B7 过滤） */
sandbox.importTeamRows ? null : null;
registry['saveCsv'] = mkEl('saveCsv');
registry['saveCsv'].value = sandbox.rowsToCsv(res.rows);
sandbox.importSaveBox();
console.log('  importSaveBox alert=' + JSON.stringify(alerts.slice(-2)));
chk('CSV 导入 6 只队伍成员', /已导入 6 只/.test(alerts.join('|')), alerts.slice(-2).join('|'));
chk('导入后队伍 6 只且无无效物种', sandbox.team.length === 6 && sandbox.team.every(s => sandbox.isValidSp(s)), sandbox.team.map(s => s.zh).join('/'));
sandbox.renderAnalyze();
const ana = byId('tmAnalyze')._html || '';
chk('队伍体检已渲染（含定位/补位）', ana.length > 500, 'len=' + ana.length);
chk('体检结果不含 2502 占位（B7 过滤生效）', ana.indexOf('2502') < 0, ana.indexOf('2502'));
console.log('  队伍体检片段：' + ana.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 400));

/* ============ 模板 / 核心配队回归 ============ */
hdr('既有功能回归（模板 / 核心配队 / 反查）');
/* v4.x G⑫：数据层 templates 已达 18 套（契约定 ≥18）；不足 18 时引擎侧 TPL_EXTRA 兜底补足 */
chk('数据层模板 ≥18 套（tplDataCount 与 ERDATA.templates 同步）', E.templates.length >= 18 && sandbox.tplDataCount() === E.templates.length, E.templates.length + ' / tplDataCount=' + sandbox.tplDataCount());
chk('v4.x 模板总数 ≥18（tplAll 合并数据层 + 引擎侧兜底）', sandbox.tplAll().length >= 18, sandbox.tplAll().length);
chk('v4.x 新增 6 套模板（毒钉受队/强化接力/天气双核/场地控制/吸血站场/双天气轮换）', ['毒钉受队', '强化接力', '天气双核', '场地控制', '吸血站场', '双天气轮换'].every(n => sandbox.tplAll().some(t => t.name === n)), sandbox.tplAll().map(t => t.name).join('/'));
let tplOk = 0;
const tplN = sandbox.tplAll().length;
sandbox.tplAll().forEach((t, i) => {
  registry['tplBody' + i] = mkEl('tplBody' + i);
  try { sandbox.renderTplBody(i); } catch (e) { console.log('  renderTplBody(' + i + ') ERROR ' + e.message); return; }
  const h = byId('tplBody' + i)._html;
  if (h.length > 300) tplOk++;
});
chk('全部模板展开渲染成功（含引擎侧兜底）', tplOk === tplN, tplOk + '/' + tplN);
/* B8 硬要求：模板 tips/flow 不得残留写死的 20% / +30% / 8回合 / 无限天气 旧文案 */
const legacyPats = [/增伤从 50% 削到 20%/, /晴增伤 20%/, /\+\s*30%/, /顺风仅 4 回合/, /ER 无限天气/, /无限回合（天气特性）/];
let legacyHit = [], wxTipBadge = 0, bodyHit = [];
sandbox.tplAll().forEach((t, i) => {
  (t.tips || []).concat(t.flow || []).forEach(txt => {
    const r = sandbox.wxTip(txt);
    legacyPats.forEach(p => { if (p.test(r)) legacyHit.push('#' + i + ' ' + p + ' → ' + r.slice(0, 40)); });
    if (/待游戏内实测确认/.test(r)) wxTipBadge++;
  });
  registry['tplBody' + i] = mkEl('tplBody' + i);
  sandbox.renderTplBody(i);
  const h = byId('tplBody' + i)._html;
  legacyPats.forEach(p => { const m = h.match(p); if (m) bodyHit.push('#' + i + ' → ' + m[0]); });
});
chk('模板 tips/flow 改写后无旧文案（20%/+30%/8回合/无限天气）', legacyHit.length === 0, legacyHit.join(' | ') || 'clean');
chk('v3.23 模板 tips/flow 改写后无残留徽标（=0；徽标只保留在口径表）', wxTipBadge === 0, wxTipBadge + ' 处');
chk('12 模板渲染产物无旧字面量（flow 已接入 wxTip）', bodyHit.length === 0, bodyHit.join(' | ') || 'clean');
chk('12 模板渲染产物含 WCONF 数值（×1.3 / +50% / ×1.5）', ['×1.3', '+50%', '×1.5'].every(x => E.templates.some((t, i) => byId('tplBody' + i)._html.indexOf(x) > -1)), '');
chk('12 模板渲染产物无旧分源文案（+20%）与残留徽标', E.templates.every((t, i) => byId('tplBody' + i)._html.indexOf('+20%') < 0 && byId('tplBody' + i)._html.indexOf('待游戏内实测确认') < 0), '');
const tplRecs = sandbox.tplRecs(E.templates[1]);
chk('模板推荐全为最终形态或奇石优势形态（v4.3.1 语义）+ 有效物种', tplRecs.every(r => (sandbox.isFinalForm(r.s) || sandbox.evioOk(r.s)) && sandbox.isValidSp(r.s)), tplRecs.map(r => r.s.zh + r.score).join('/'));
const idx0 = buildsV.length ? 0 : 0;
sandbox.selectCore(venus.id);
const coreHtml = byId('coreOut')._html;
chk('renderCore 渲染成功（含流派卡）', coreHtml.length > 1000 && /推荐流派/.test(coreHtml), 'len=' + coreHtml.length);
/* v4.x 收尾：机制口径折叠块改由独立容器 #ruleBoxCore 渲染（renderCore 若再追加会出现两遍 → 已去掉重复） */
chk('「机制口径」折叠块存在且唯一（#ruleBoxCore 渲染 wxRuleHtml）',
  /id="ruleBoxCore"/.test(require('fs').readFileSync('D:\\game\\elite-redux\\配招助手_ER.html', 'utf8')) &&
  /机制口径/.test(sandbox.wxRuleHtml()) && /WCONF/.test(sandbox.wxRuleHtml()) && !/机制口径/.test(coreHtml), '');
chk('流派卡含「选招依据」', /选招依据/.test(coreHtml), '');
chk('流派卡含「盲点」检查', /盲点/.test(coreHtml), '');
chk('流派卡含「特性免疫警示」或双刀补盲', /特性免疫警示|双刀补盲|无盲点/.test(coreHtml), '');
chk('renderCore 含天气/场地数值卡（v3.23：单档 ×1.5 + 定稿后无徽标）', /晴\/雨增伤 ×1\.5/.test(coreHtml) && !/\+20%/.test(coreHtml) && !/待游戏内实测确认/.test(coreHtml) && /戏法空间 6 回合（定稿：含施放回合，实际 6 个回合时段）/.test(coreHtml), '');
chk('renderCore 含耐久口径文案（B2）', /耐久口径/.test(coreHtml), '');
chk('renderCore 含除钉说明（229/432）', /229/.test(coreHtml) && /432/.test(coreHtml), '');
sandbox.selectCore(2502);
const core2502 = byId('coreOut')._html;
chk('核心选 2502 → 护栏提示（不渲染流派卡）', /占位\/无效物种/.test(core2502), core2502.replace(/<[^>]+>/g, '').slice(0, 60));
/* -ate 展示（选 conv 类型 ≠ 一般 的样本，展示才有效） */
if (convDemo) {
  sandbox.selectCore(convDemo.s.id);
  const h = byId('coreOut')._html;
  chk('-ate 宝可梦核心页出现「属性转换」标注', /属性转换/.test(h), convDemo.s.zh + '（' + convDemo.cv.abi + '→' + convDemo.cv.type + '）次数=' + (h.match(/属性转换/g) || []).length);
}
/* B9 分层5 双刀补盲（选盲点可被另一侧覆盖的样本） */
const pidSp = spByZh('大比鸟');
let dblCnt = 0;
E.species.forEach(s => {
  if (!sandbox.isValidSp(s) || !sandbox.isFinalSp(s)) return;
  const cv = sandbox.convOf(s);
  sandbox.deriveBuilds(s).forEach(bd => {
    if (bd.side === '双刀') return;
    const pr = sandbox.setCoverProfile(s, bd.mv.main.map(x => x.id), cv), bl = sandbox.blindList(pr);
    if (!bl.length) return;
    const al = sandbox.pickAttacks(s, bd.side === '物理' ? '特殊' : '物理', 2, bd.roleTag);
    if (!al.length) return;
    const ap = sandbox.setCoverProfile(s, al.map(x => x.id), cv);
    if (bl.filter(t => ap[t] >= 1).length) dblCnt++;
  });
});
chk('全图鉴「双刀补盲」触达 > 0 例', dblCnt > 0, dblCnt + ' 例（最终形态聚合）');
sandbox.selectCore(pidSp.id);
const pidH = byId('coreOut')._html;
chk('大比鸟核心页出现「双刀补盲」提示', /双刀补盲/.test(pidH), (pidH.match(/🔀 双刀补盲[^<]*/) || [''])[0].slice(0, 120));
/* 招式反查 */
registry['mvDetail'] = mkEl('mvDetail');
registry['mvDetail'].textContent = '';
sandbox.openMv(sandbox.MV[63]);
const mvHtml = byId('mvDetail')._html;
chk('招式反查含官方机制文本(lDesc)', /官方机制文本/.test(mvHtml) && /recharging/.test(mvHtml), '');
chk('招式反查含代价标签', /代价标签/.test(mvHtml) && /僵直/.test(mvHtml), '');
sandbox.openMv(sandbox.MV[229]);
const mv229 = byId('mvDetail')._html;
chk('229 招式页标「除钉·高速旋转（清自身侧）」', /除钉·高速旋转（清自身侧）/.test(mv229), '');
sandbox.openMv(sandbox.MV[432]);
const mv432 = byId('mvDetail')._html;
chk('432 招式页标「除钉·清除浓雾（清双方）」', /除钉·清除浓雾（清双方）/.test(mv432), '');
chk('裁定 3：432 招式页除钉范围行定稿（无徽标 + 用户确认 + 墙仅对手侧 + 降闪避 1 级）', /除钉范围：清双方钉子（已按游戏源码核对）· 墙仅对手侧 · 降闪避 1 级（用户确认，定稿）/.test(mv432) && !/除钉范围：清双方钉子（已按游戏源码核对）· 墙仅对手侧 · 降闪避 1 级（用户确认，定稿）<span class="badge badge-pend"/.test(mv432), '');
sandbox.openMv(sandbox.MV[564]);
chk('564 招式页标「钉子」标签', /机制标签/.test(byId('mvDetail')._html) && /钉子/.test(byId('mvDetail')._html), '');
/* 特性反查 */
registry['abiSearch'] = mkEl('abiSearch'); registry['abiSearch'].value = '';
registry['abiResult'] = mkEl('abiResult');
sandbox.renderAbi();
chk('特性反查渲染无异常', (byId('abiResult')._html || '').length >= 0, 'ok');

/* ============ 补丁 3：属性克制 Tab UI ↔ ERDATA.matchup 逐格 diff ============ */
hdr('属性克制 Tab UI 逐格 diff（21 攻 × 21 守 = 441 格 × 2 视角）');
/* 位置式解析：以 k2 / k05 / k0 标记的出现位置切分，缺组的属性（如「一般」无抗性块）也不会错判。
   页面结构：<div class="kgroup"><div class="k2"><b>…</b> <span class="t t-X">X</span>…</div></div>
   atk 视角 k2=2×克制 / k05=0.5×抵抗 / k0=0×无效；def 视角 k2=弱点 / k05=抗性 / k0=免疫。 */
const MARKSPEC = [['<div class="k2">', 'k'], ['<div class="k05">', 'h'], ['<div class="k0">', 'z']];
function parseGroups(html) {
  const marks = [];
  MARKSPEC.forEach(m => { const p = html.indexOf(m[0]); if (p > -1) marks.push({ p: p, name: m[1] }) });
  marks.sort((a, b) => a.p - b.p);
  const re = /<span class="t t-([^"]+)">([^<]*)<\/span>/g;
  const out = { k: [], h: [], z: [] }; let m;
  while ((m = re.exec(html)) !== null) {
    let g = 'n';
    marks.forEach(mk => { if (mk.p < m.index) g = mk.name });
    if (out[g]) out[g].push({ cls: m[1], txt: m[2] });
  }
  return out;
}
let uiCells = 0; const cellDiff = [], clsDiff = [];
E.types.forEach(atk => {
  const i = E.types.indexOf(atk);
  sandbox.renderAtk(atk);
  const g = parseGroups(byId('atkResult')._html);
  g.k.concat(g.h).concat(g.z).forEach(x => { if (x.cls !== x.txt) clsDiff.push(atk + ':' + x.cls + '≠' + x.txt) });
  E.types.forEach(def => {
    const v = E.matchup[E.types.indexOf(def)][i];
    const want = v === 2 ? 'k' : (v === 0.5 || v === 3 ? 'h' : (v === 0 ? 'z' : 'n'));
    const got = g.k.some(x => x.txt === def) ? 'k' : (g.h.some(x => x.txt === def) ? 'h' : (g.z.some(x => x.txt === def) ? 'z' : 'n'));
    uiCells++;
    if (got !== want) cellDiff.push(atk + '→' + def + ' UI=' + got + ' 数据=' + want + '(v=' + v + ')');
  });
});
chk('进攻视角 UI 逐格 diff = 0 差异（441 格全覆盖）', uiCells === 441 && cellDiff.length === 0,
  uiCells + ' 格，差异 ' + cellDiff.length + (cellDiff.length ? '：' + cellDiff.slice(0, 5).join(' | ') : '（UI 分组与 matchup 完全一致）'));
chk('UI 标签文本 = 属性名（span 类名与显示文本一致）', clsDiff.length === 0, clsDiff.length ? clsDiff.slice(0, 5).join(' | ') : '21×21 标签全部一致');
/* 防守视角：renderDef 走 #defChips 的 DOM，Node 侧打桩 21 个 chip 后逐格核对 */
const defChipsStub = E.types.map(t => { const e = mkEl('chip'); e.textContent = t; return e });
const origQSA = doc.querySelectorAll;
doc.querySelectorAll = sel => (sel === '#defChips button' ? defChipsStub : []);
sandbox.document.querySelectorAll = doc.querySelectorAll;
let defCells = 0; const defDiff = [];
E.types.forEach(dt => {
  defChipsStub.forEach(c => c.classList.remove('on'));
  defChipsStub.filter(c => c.textContent === dt)[0].classList.add('on');
  sandbox.renderDef();
  const g = parseGroups(byId('defResult')._html);
  E.types.forEach(at => {
    const v = E.matchup[E.types.indexOf(dt)][E.types.indexOf(at)];
    const want = v === 0 ? 'z' : (v === 2 ? 'k' : ((v === 0.5 || v === 3) ? 'h' : 'n'));
    const got = g.z.some(x => x.txt === at) ? 'z' : (g.k.some(x => x.txt === at) ? 'k' : (g.h.some(x => x.txt === at) ? 'h' : 'n'));
    defCells++;
    if (got !== want) defDiff.push(dt + '受' + at + ' UI=' + got + ' 数据=' + want + '(v=' + v + ')');
  });
});
defChipsStub.forEach(c => c.classList.remove('on'));
chk('防守视角 UI 逐格 diff = 0 差异（441 格全覆盖，renderDef 真函数）', defCells === 441 && defDiff.length === 0,
  defCells + ' 格，差异 ' + defDiff.length + (defDiff.length ? '：' + defDiff.slice(0, 5).join(' | ') : '（UI 分组与 matchup 完全一致）'));
doc.querySelectorAll = origQSA; sandbox.document.querySelectorAll = origQSA;
/* 防守侧基元核对：真实引擎函数 defMult(单属性, 攻击属性) ↔ matchup 原始值（441 格，独立于 UI 路径） */
let dmCells = 0; const dmDiff = [];
E.types.forEach(at => E.types.forEach(dt => {
  const v = E.matchup[E.types.indexOf(dt)][E.types.indexOf(at)];
  const want = v === 0 ? 0 : ((v === 0.5 || v === 3) ? 0.5 : (v === 2 ? 2 : 1));
  const got = sandbox.defMult([dt], at);
  dmCells++;
  if (got !== want) dmDiff.push(dt + '受' + at + ' 引擎=' + got + ' 数据=' + want + '(v=' + v + ')');
}));
chk('defMult 引擎 ↔ matchup 逐格一致（补防守侧 441 格）', dmCells === 441 && dmDiff.length === 0,
  dmCells + ' 格，差异 ' + dmDiff.length + (dmDiff.length ? '：' + dmDiff.slice(0, 5).join(' | ') : ''));

/* ============ D1~D4：独立黑盒复验四项修复断言 ============ */
/* D1：简评/流派标题不得再外露字面 HTML（esc() 消费端 + tlabel 拼装的组合缺陷）
   判据与黑盒方一致：把真实标签剥掉后，若仍残留 `<span` 即为字面泄漏。 */
hdr('D1 简评/流派标题 HTML 转义（无字面 <span> 残留）');
function visText(html) { return String(html).replace(/<[^>]*>/g, ''); }
const d1Samples = ['妙蛙花', '凤王', '土王', '大比鸟', '雷电云', 'Storming'].map(spByZh).filter(Boolean);
let d1Bad = [];
d1Samples.forEach(s => {
  const cmt = sandbox.coreComment(s);
  if (/<span|<\/span|<div/i.test(cmt)) d1Bad.push('coreComment(' + s.zh + '): ' + cmt.slice(0, 120));
  registry['coreOut'] = mkEl('coreOut');
  try { sandbox.renderCore(s); } catch (e) { d1Bad.push('renderCore(' + s.zh + ') ERR ' + e.message); return; }
  const raw = byId('coreOut')._html;
  const vis = visText(raw);
  const leak = vis.match(/<\/?[a-z]+[^>]*>/gi);
  if (leak) d1Bad.push('renderCore(' + s.zh + ') 可见文本残留字面标签: ' + leak.slice(0, 3).join(' , '));
  if (s.id === '3') {
    chk('D1 妙蛙花简评可读（含本系最高威力且无标签）', /本系最高威力 130（草）/.test(vis), (vis.match(/本系最高威力[^。]{0,20}/) || [''])[0]);
    chk('D1 妙蛙花流派标题可读（本系最高 飞叶风暴(草 130)）', /飞叶风暴\(草 130\)/.test(vis), (vis.match(/本系最高 飞叶风暴[^；]{0,20}/) || [''])[0]);
  }
});
chk('D1 6 样本 coreComment/renderCore 无字面 HTML 残留', d1Bad.length === 0, d1Bad.length ? d1Bad.slice(0, 3).join(' | ') : '6/6 clean');
/* 全量最终形态：coreComment + 每个流派 desc 均不得含 HTML 标签 */
let d1All = 0, d1AllBad = [];
spWhere(s => sandbox.isValidSp(s) && sandbox.isFinalSp(s)).forEach(s => {
  d1All++;
  const cmt = sandbox.coreComment(s);
  if (/<span|<\/span|<div/i.test(cmt)) d1AllBad.push('cmt#' + s.id);
  sandbox.deriveBuilds(s).forEach(b => { if (/<span|<\/span|<div/i.test(String(b.name) + (b.basis || []).map(x => x.txt).join(''))) d1AllBad.push('desc#' + s.id + '/' + b.name); });
});
chk('D1 全量最终形态（' + d1All + ' 只）coreComment + 流派 desc 无标签', d1AllBad.length === 0, d1AllBad.length ? d1AllBad.slice(0, 5).join(' | ') : d1All + ' 只 clean');

/* D2：导入前清空既有队伍（满 6 只不再静默丢弃） */
hdr('D2 存档 / CSV 导入前清空队伍');
sandbox.team.length = 0; Object.keys(sandbox.teamInfo).forEach(k => delete sandbox.teamInfo[k]);
['妙蛙花', '凤王', '洛奇亚'].map(spByZh).filter(Boolean).forEach(s => sandbox.addToTeam(s, { fromSave: false }));
const preLen = sandbox.team.length;
const imp = sandbox.autoImportParty(res);
const impIds = sandbox.team.map(s => '' + s.id).join(',');
const savIds = res.party.map(r => '' + r.图鉴编号).join(',');
chk('D2 autoImportParty 返回清空数（3）', imp && imp.cleared === preLen && preLen === 3, JSON.stringify(imp));
chk('D2 .sav 导入后队伍恰为 6 只', sandbox.team.length === 6, sandbox.team.length + ' 只');
chk('D2 .sav 导入队伍与存档队伍逐一一致（无静默丢弃）', impIds === savIds, impIds + ' vs ' + savIds);
chk('D2 摘要行明示清空与导入数量', /已清空原队伍 3 只 → 已导入队伍 6 只/.test(byId('savImpNote').textContent), byId('savImpNote').textContent);
/* CSV 路径：先塞满 6 只（不同成员）再导入，仍应得到存档 6 只 */
sandbox.team.length = 0; Object.keys(sandbox.teamInfo).forEach(k => delete sandbox.teamInfo[k]);
['妙蛙花', '凤王', '洛奇亚', '大比鸟', '鳃鱼龙', '超级土王'].map(spByZh).filter(Boolean).forEach(s => sandbox.addToTeam(s, { fromSave: false }));
const preLen2 = sandbox.team.length;
alerts.length = 0;
registry['saveCsv'].value = sandbox.rowsToCsv(res.rows);
sandbox.importSaveBox();
const impIds2 = sandbox.team.map(s => '' + s.id).join(',');
chk('D2 CSV 导入前清空满 6 队伍（提示含清空 ' + preLen2 + ' 只）', preLen2 === 6 && new RegExp('已清空原队伍 ' + preLen2 + ' 只 → 已导入 6 只队伍成员').test(alerts.join('|')), alerts.join('|').slice(0, 120));
chk('D2 CSV 导入队伍与存档队伍逐一一致', impIds2 === savIds, impIds2 + ' vs ' + savIds);
chk('D2 CSV 导入后队伍 6 只且全为有效物种', sandbox.team.length === 6 && sandbox.team.every(s => sandbox.isValidSp(s)), sandbox.team.map(s => s.zh).join('/'));

/* D3：待实测徽标只挂口径表「是否待实测=是」的参数（用户三项裁定后 = WCONF_PEND 8 项） */
hdr('D3 待校准徽标归属（= WCONF_PEND 8 项，已裁定/已实证/已移除参数不挂）');
const ruleHtml = sandbox.wxRuleHtml();
const ruleRows = [];
ruleHtml.replace(/<tr><td>([^<]*)<\/td><td[^>]*>([^<]*)<\/td><td[^>]*>(.*?)<\/td><\/tr>/g, (all, n, k, v) => { ruleRows.push({ n: n, k: k, v: v, badge: /待游戏内实测确认/.test(v) }); return all; });
const pendKeys = Object.keys(sandbox.WCONF_PEND);
/* 2026-10-10 ER 机制实证定稿后：原 5 项待实测全部定稿 → 口径表应 0 行带徽标 */
const expBadgeRows = [];
const gotBadgeRows = ruleRows.filter(r => r.badge).map(r => r.k);
const badgeOcc = (ruleHtml.match(/待游戏内实测确认/g) || []).length;
const badgeRowOcc = ruleRows.reduce((a, r) => a + (r.v.match(/待游戏内实测确认/g) || []).length, 0);
const rowBad = ruleRows.filter(r => r.badge !== (expBadgeRows.indexOf(r.k) > -1));
const expNoBadge = ['WCONF.boost', 'WCONF.abilityBoost', 'WCONF.manualDurTurns', 'WCONF.abilityDurTurns',
  'WCONF.rockTurnsAbility', 'WCONF.rockTurnsManual', 'WCONF.autoTailwindTurns', 'WCONF.terrainDurTurns', 'WCONF.terrainBoost',
  'WCONF.terrainExtenderTurns', 'WCONF.tailwindTurns', 'WCONF.paraSpeed', 'WCONF.paraFullChance', 'WCONF.hazardRules.stealthRock',
  'WCONF.defogRapidSpin', 'ABI_ATE'];
const noBadgeBad = expNoBadge.filter(k => (ruleRows.filter(r => r.k === k)[0] || {}).badge);
console.log('  机制口径表行数=' + ruleRows.length + ' 带徽标行=' + gotBadgeRows.length + ' 徽标出现次数=' + badgeOcc + ' pend 清单=' + pendKeys.length);
console.log('  带徽标行键=' + gotBadgeRows.join(', '));
console.log('  逐行徽标次数=' + ruleRows.map(r => r.k + '×' + (r.v.match(/待游戏内实测确认/g) || []).length).filter(x => !/×0$/.test(x)).join(' | '));
chk('D3 口径表徽标行 = 0（2026-10-10 实证定稿后全部无徽标）', rowBad.length === 0 && gotBadgeRows.length === expBadgeRows.length, rowBad.map(r => r.k + '(badge=' + r.badge + ')').join(' | ') || (gotBadgeRows.length + ' 行全一致'));
chk('D3 口径表表格内徽标出现次数 = 0（对应待实测 0 项；定稿前 v3.23 为 6 / v3.22 为 8 / 考古轮 11 / 初版 14）', badgeRowOcc === 0, badgeRowOcc + ' 处');
chk('D3 已裁定/已实证参数行不挂徽标（天气回合·增伤·场地倍率·延展器·顺风·-ate·麻痹·隐形岩·除钉 共 16 键）', noBadgeBad.length === 0, noBadgeBad.join(' | ') || 'clean');
chk('D3/v3.23 口径表 WCONF.boost 行无徽标 + 显示 +50%（×1.5）', !ruleRows.filter(r => r.k === 'WCONF.boost')[0].badge && /\+50%（×1\.5）/.test(ruleRows.filter(r => r.k === 'WCONF.boost')[0].v), ruleRows.filter(r => r.k === 'WCONF.boost')[0].v);
chk('v3.23 口径表 WCONF.terrainBoost 行无徽标（已按游戏源码核对定稿）+ 值 ×1.3 + 注 B_TERRAIN_TYPE_BOOST=GEN_8', !ruleRows.filter(r => r.k === 'WCONF.terrainBoost')[0].badge && /×1\.3（已按游戏源码核对：B_TERRAIN_TYPE_BOOST=GEN_8）/.test(ruleRows.filter(r => r.k === 'WCONF.terrainBoost')[0].v), ruleRows.filter(r => r.k === 'WCONF.terrainBoost')[0].v);
chk('v3.23 口径表天气回合行：手动 8（注 changelog 记 5）+ 岩石 12 + 无徽标', (function () {
  const m = ruleRows.filter(r => r.k === 'WCONF.manualDurTurns')[0], rk = ruleRows.filter(r => r.k === 'WCONF.rockTurnsManual')[0], ab = ruleRows.filter(r => r.k === 'WCONF.abilityDurTurns')[0];
  return !m.badge && /^8 回合（已按游戏源码核对 8，changelog 记 5）/.test(m.v) && !ab.badge && /^8 回合$/.test(ab.v) && !rk.badge && /^12 回合（已按游戏源码核对：与特性同档 8→12；原记 5→8）/.test(rk.v);
})(), ruleRows.filter(r => r.k === 'WCONF.manualDurTurns')[0].v + ' | ' + ruleRows.filter(r => r.k === 'WCONF.rockTurnsManual')[0].v);
chk('v3.23 口径表天气增伤行：双档均 ×1.5 且无徽标（特性档注明只写 TEMPORARY 档）', (function () {
  const a = ruleRows.filter(r => r.k === 'WCONF.boost')[0], b = ruleRows.filter(r => r.k === 'WCONF.abilityBoost')[0];
  return !a.badge && !b.badge && /\+50%（×1\.5）/.test(a.v) && /\+50%（×1\.5，已按游戏源码核对：TryChangeBattleWeather 只写 TEMPORARY 档，无「特性 20%」档）/.test(b.v);
})(), ruleRows.filter(r => r.k === 'WCONF.abilityBoost')[0].v);
chk('v3.23 口径表顺风/延展器行无徽标（常量 3 ⇒ 实际 4 时段 / 8+12）', (function () {
  const a = ruleRows.filter(r => r.k === 'WCONF.tailwindTurns')[0], b = ruleRows.filter(r => r.k === 'WCONF.autoTailwindTurns')[0], c = ruleRows.filter(r => r.k === 'WCONF.terrainExtenderTurns')[0];
  return !a.badge && !b.badge && !c.badge && /4 回合（已按游戏源码核对：常量 3 \+ 当回合不递减 ⇒ 实际 4 个回合时段）/.test(a.v) && /4 回合（已按游戏源码核对：SHORT=3，同上 ⇒ 实际 4 个回合时段，与手动相同）/.test(b.v) && /12 回合（已按游戏源码核对：TERRAIN_DURATION 8\/EXTENDED 12；原记 11）/.test(c.v);
})(), ruleRows.filter(r => r.k === 'WCONF.tailwindTurns')[0].v + ' | ' + ruleRows.filter(r => r.k === 'WCONF.terrainExtenderTurns')[0].v);
chk('2026-10-10 口径表冻伤行无徽标 + 注明冰雹×1 定稿（v2.65 已删除雪天×3，仅 Cryomancy×5）', (function () {
  const r = ruleRows.filter(r => r.k === 'WCONF.frostbite')[0];
  return r.badge === false && (r.v.match(/待游戏内实测确认/g) || []).length === 0 && /冰雹触发×1（定稿 2026-10-10：v2.65 已删除雪天×3，仅 Cryomancy×5；/.test(r.v) && /已按游戏源码核对/.test(r.v);
})(), ruleRows.filter(r => r.k === 'WCONF.frostbite')[0].v.replace(/<[^>]+>/g, '[徽标]'));
chk('2026-10-10 口径表戏法空间行无徽标 + 注明 6 个回合时段（含施放回合）定稿 + 先制 -7 已按游戏数据核对', (function () {
  const r = ruleRows.filter(r => r.k === 'WCONF.trickroomTurns')[0];
  return r.badge === false && (r.v.match(/待游戏内实测确认/g) || []).length === 0 && /6 个回合时段（定稿：源码常量 5 \+ 施放当回合不递减 ⇒ 实际 6 时段含施放回合；desc\/官方文案记 5 系不含施放回合口径） \/ 先制 -7（已按游戏数据核对）/.test(r.v);
})(), ruleRows.filter(r => r.k === 'WCONF.trickroomTurns')[0].v.replace(/<[^>]+>/g, '[徽标]'));
chk('考古：口径表 paraSpeed/paraFullChance 行无徽标且标注已按游戏源码核对', !ruleRows.filter(r => r.k === 'WCONF.paraSpeed')[0].badge && /已按游戏源码核对/.test(ruleRows.filter(r => r.k === 'WCONF.paraSpeed')[0].v) && !ruleRows.filter(r => r.k === 'WCONF.paraFullChance')[0].badge && /已按游戏源码核对/.test(ruleRows.filter(r => r.k === 'WCONF.paraFullChance')[0].v), ruleRows.filter(r => r.k === 'WCONF.paraSpeed')[0].v + ' | ' + ruleRows.filter(r => r.k === 'WCONF.paraFullChance')[0].v);
const spikesRow = ruleRows.filter(r => r.k === 'WCONF.hazardRules.spikes')[0];
chk('考古：撒菱行 = 1/8→1/6→1/4（无 1/8→3/16→1/4；无 0.166666… 浮点串；旧值仅作「原 3/16 为讹误」注记）', /1\/8→1\/6→1\/4/.test(spikesRow.v) && !/1\/8→3\/16/.test(spikesRow.v) && !/0\.1666/.test(spikesRow.v) && /原 3\/16 为 Psypoke 讹误/.test(spikesRow.v), spikesRow.v);
const stealthRow = ruleRows.filter(r => r.k === 'WCONF.hazardRules.stealthRock')[0];
chk('裁定 2：隐形岩行无徽标、无「疑似失效」风险文案、明示 bug 不计入', !stealthRow.badge && !/疑似失效/.test(stealthRow.v) && /bug 不计入/.test(stealthRow.v), stealthRow.v);
const defogRow = ruleRows.filter(r => r.k === 'WCONF.defogRapidSpin')[0];
chk('裁定 3：除钉行定稿（无徽标 + 用户确认 + 双方钉子/墙仅对手侧/降闪避 1 级）', !defogRow.badge && (defogRow.v.match(/待游戏内实测确认/g) || []).length === 0 && /用户确认/.test(defogRow.v) && /清双方钉子/.test(defogRow.v) && /墙仅对手侧/.test(defogRow.v) && /降闪避 1 级/.test(defogRow.v), defogRow.v);
const toxicRow = ruleRows.filter(r => r.k === 'WCONF.toxicTerrain')[0];
chk('裁定 1：剧毒场地毒招 +30%（用户确认定稿）+ 无徽标（转毒菱/种子 2026-10-10 定稿）', /毒招 ×1\.3（\+30%，用户确认，定稿）/.test(toxicRow.v) && (toxicRow.v.match(/待游戏内实测确认/g) || []).length === 0, toxicRow.v.replace(/<[^>]+>/g, '[徽标]'));
chk('裁定 2：WCONF 已无 hazardBugNote 键（整项移除，非降级）', !('hazardBugNote' in sandbox.WCONF), Object.keys(sandbox.WCONF).join(','));
chk('裁定 2：口径表全文无「疑似失效 / hazardBugNote」风险文案', !/疑似失效/.test(ruleHtml) && !/hazardBugNote/.test(ruleHtml), '');
chk('裁定 3：WCONF.defogRapidSpin 含 walls=foeOnly（墙仅对手侧）', sandbox.WCONF.defogRapidSpin.walls === 'foeOnly' && sandbox.WCONF.defogRapidSpin.defogEvasion === -1 && sandbox.WCONF.defogRapidSpin.rapidSpin === 'self' && sandbox.WCONF.defogRapidSpin.defog === 'both', JSON.stringify(sandbox.WCONF.defogRapidSpin));
const ateRow = ruleRows.filter(r => r.k === 'ABI_ATE')[0];
chk('v3.23 -ate 行零徽标（宏族 ×1.0 与 .onStab 均已按游戏源码核对）+ 倍率 ×1 + 三特例 ×1.1 + 转换后本系 ×1.6', /待游戏内实测确认/.test(ateRow.v) === false && /倍率 ×1（已按游戏源码核对/.test(ateRow.v) && /三特例 ×1\.1：Normalize\(96\)\/Crystallize\(280\)\/Superconductor\(659\)/.test(ateRow.v) && /转换后按本系 ×1\.6（\.onStab 实证/.test(ateRow.v) && !/倍率 ×1\.1（已按游戏源码核对/.test(ateRow.v), ateRow.v);
chk('v3.23 口径表脚注含 v2.65+ 考古段（Pin SHA / 8·12 / 单档 ×1.5 / -ate ×1.0）', /Pin A=7d85acd5@2026-03-28 \/ Pin B=910945b9@2026-10-06/.test(ruleHtml) && /天气回合 8\/岩石 12/.test(ruleHtml) && /不分来源单档 ×1\.5/.test(ruleHtml) && /-ate 宏族 \*\*×1\.0\*\*/.test(ruleHtml), '');
chk('考古：场地/撒菱勘误 + 用户三项裁定写入口径表脚注', /撒菱 2 层 = 1\/6/.test(ruleHtml) && /B_TERRAIN_TYPE_BOOST=GEN_8/.test(ruleHtml) && /用户裁定（2026-10-06）定稿 3 项/.test(ruleHtml), '');
const wxTippedAll = E.templates.map(t => [].concat(t.tips || [], [t.flow || '']).map(sandbox.wxTip).join('❙')).join('❙');
const rainTip = sandbox.wxTip((E.templates[0].tips || [])[0] || '');
console.log('  雨天 tips(wxTip 后)=' + rainTip.replace(/<[^>]+>/g, ''));
chk('D3 手动天气 +50% 后不再挂徽标（全模板）', !/\+50%[^。；]{0,30}待游戏内实测确认/.test(wxTippedAll), (wxTippedAll.match(/\+50%.{0,30}/g) || []).slice(0, 2).join(' | ') || '');
chk('D3/v3.23 雨天模板显示单档 ×1.5 数值（无 +20%）', /×1\.5/.test(rainTip) && !/\+20%/.test(rainTip), rainTip.replace(/<[^>]+>/g, '').slice(0, 120));
chk('D3/v3.23 wxTip 后全模板无残留徽标（v2.65 实证项已定稿；徽标仅存在于口径表）', (wxTippedAll.match(/待游戏内实测确认/g) || []).length === 0, (wxTippedAll.match(/待游戏内实测确认/g) || []).length + ' 处');
chk('D3/v3.23 tplRuleTip 天气行 = 8 回合 + ×1.5，无 +20% 分源数值（「无『特性 20%』档」否定式注记除外）', /天气 8 回合/.test(byId('tplRuleTip')._html) && /×1\.5/.test(byId('tplRuleTip')._html) && !/\+20%/.test(byId('tplRuleTip')._html), byId('tplRuleTip')._html.slice(0, 140));
chk('D3/v3.23 核心配队数值卡：天气 8 回合无徽标 / 单档 ×1.5 / 场地行无徽标 / 空间行 6 时段无徽标（定稿）', /晴\/雨增伤 ×1\.5（已按游戏源码核对：不分手动\/特性，单档）/.test(sandbox.wxNums()) && !/待游戏内实测确认/.test(sandbox.wxNums()) && !/待游戏内实测确认/.test(sandbox.terrainNums()) && /戏法空间 6 回合（定稿：含施放回合，实际 6 个回合时段）/.test(byId('coreOut')._html || '') && !/戏法空间[^<]*<span class="badge badge-pend"/.test(byId('coreOut')._html || '') && !/麻痹减速 ×0\.5（已按游戏源码核对）<span class="badge badge-pend"/.test(byId('coreOut')._html || ''), '');
chk('裁定 1/3：数值卡毒招 +30%（用户确认）与除钉定稿行均无徽标', /毒招 ×1\.3（\+30%，用户确认）\s*\/ 非毒钢接地/.test((byId('coreOut')._html || '').replace(/<[^>]+>/g, '')) && /除钉：229 高速旋转（清自身侧）\/ 432 清除浓雾（清双方钉子、墙仅对手侧、降闪避 1 级）——已按游戏源码核对 \+ 用户确认/.test((byId('coreOut')._html || '').replace(/<[^>]+>/g, '')) && !/毒招 ×1\.3（\+30%，用户确认）<span class="badge badge-pend"/.test(byId('coreOut')._html || ''), '');

/* D4：僵直关键词补全（间隔型/休息型）+ 蓄力型区分 + 误判守护 */
hdr('D4 lDesc 代价标签关键词补全');
const mvBy = id => E.moves.filter(m => '' + m[0] === '' + id)[0];
const d4Recharge = [63, 416, 439, 307, 308, 338, 722, 963, 723];
const d4Charge = [143, 901, 972, 988];
const d4Neg = [33, 394, 413, 127, 431, 245, 310, 623];
const d4RechargeMiss = d4Recharge.filter(id => sandbox.costOf(null, mvBy(id), true).tags.join().indexOf('僵直') < 0);
const d4ChargeMiss = d4Charge.filter(id => sandbox.costOf(null, mvBy(id), true).tags.join().indexOf('蓄力') < 0);
const d4False = d4Neg.filter(id => /僵直|蓄力/.test(sandbox.costOf(null, mvBy(id), true).tags.join()));
console.log('  僵直组：' + d4Recharge.map(id => id + ' ' + mvName(id) + '=' + (sandbox.costOf(null, mvBy(id), true).tags.join() || '无')).join(' | '));
console.log('  蓄力组：' + d4Charge.map(id => id + ' ' + mvName(id) + '=' + (sandbox.costOf(null, mvBy(id), true).tags.join() || '无')).join(' | '));
chk('D4 338 疯狂植物 → 僵直×0.85（原缺陷样本）', sandbox.costOf(null, mvBy(338), true).tags.join().indexOf('僵直×0.85') > -1, sandbox.costOf(null, mvBy(338), true).tags.join() + ' mul=' + sandbox.costOf(null, mvBy(338), true).mul);
chk('D4 间隔型/休息型 9 招全部获僵直标签', d4RechargeMiss.length === 0, d4RechargeMiss.length ? ('漏:' + d4RechargeMiss.map(mvName).join('/')) : '9/9');
chk('D4 蓄力型 4 招获「蓄力(2回合)」标签（文案区分）', d4ChargeMiss.length === 0, d4ChargeMiss.length ? ('漏:' + d4ChargeMiss.map(mvName).join('/')) : '4/4');
chk('D4 修辞性 charge 招不误标（撞击/闪焰冲锋/勇鸟猛攻/攀瀑/攀岩/神速/惊吓/迎头一击）', d4False.length === 0, d4False.length ? ('误标:' + d4False.map(mvName).join('/')) : '8/8 clean');
let tagCount = { z: 0, c: 0 };
E.moves.forEach(m => { const t = sandbox.costOf(null, m, true).tags.join(); if (t.indexOf('僵直') > -1) tagCount.z++; if (t.indexOf('蓄力') > -1) tagCount.c++; });
chk('D4 全库僵直=9 / 蓄力=4（无溢出命中）', tagCount.z === 9 && tagCount.c === 4, '僵直=' + tagCount.z + ' 蓄力=' + tagCount.c);
chk('D4 僵直/蓄力互斥（无同招双标签）', E.moves.every(m => { const t = sandbox.costOf(null, m, true).tags.join(); return !(t.indexOf('僵直') > -1 && t.indexOf('蓄力') > -1) }), '');

/* ---------- 汇总 ---------- */
console.log('\n================ 汇总 ================');
console.log('PASS=' + pass + '  FAIL=' + fail);
if (fail) { console.log('失败项：'); fails.forEach(f => console.log('  - ' + f)); }
process.exit(fail ? 1 : 0);
