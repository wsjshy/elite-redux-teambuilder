/* ============================================================================
   v4.12 新机制 / Smogon 先验 / 体系模板 · 独立探针（D 线）
   规格：主任务“v4.12 测试线（D 线）”——P1 新机制命中改写评估 / P2 Smogon 先验生效 /
        P3 体系模板生成 / P4 优雅降级 / P5 计数契约。
   方法：Node VM + fake DOM 打桩，加载**最终产物** 配招助手_ER.html 的内嵌脚本
        （D:\game\elite-redux\_chk_script_1.js，由 _extract_script.js 抽出）。
   纪律：不读 build 脚本源码；只读产物与内嵌 script；不改任何项目文件。
   运行：node docs\战斗分析\_验证证据\verify_v412.js   （需先跑 _extract_script.js）
   ============================================================================ */
const fs = require('fs'), vm = require('vm');
const ER = 'D:\\game\\elite-redux\\';
const script = fs.readFileSync(ER + '_chk_script_1.js', 'utf8');

/* ---------- DOM 打桩（沿用 verify_v410.js 先例） ---------- */
function mkEl(id) {
  const el = {
    id: id || '', _html: '', children: [], style: {}, dataset: {}, value: '', checked: false,
    textContent: '', className: '', hidden: false, onclick: null, oninput: null, onchange: null, files: null, title: '',
    classList: { _s: {}, add(n){this._s[n]=1}, remove(n){delete this._s[n]}, toggle(n){this._s[n]=this._s[n]?0:1}, contains(n){return !!this._s[n]} },
    appendChild(c){this.children.push(c);return c}, removeChild(){}, querySelector(){return mkEl('')}, querySelectorAll(){return []},
    addEventListener(){}, removeEventListener(){}, click(){}, focus(){}, select(){}, closest(){return null}
  };
  Object.defineProperty(el, 'innerHTML', { get: () => el._html, set: v => { el._html = String(v) } });
  return el;
}
const registry = {};
function byId(id){ if(!registry[id]) registry[id]=mkEl(id); return registry[id]; }
const doc = { getElementById: byId, createElement: () => mkEl(''), body: mkEl('body'), querySelector: () => null,
  querySelectorAll: () => [], addEventListener(){}, execCommand(){ return true } };
const sandbox = { console, setTimeout, clearTimeout, setInterval, clearInterval, Math, Date, JSON, Object, Array, String, Number, Boolean, RegExp, Error,
  document: doc, alert: m => {}, window: {}, navigator: { userAgent: 'node' }, location: { href: 'file:///x.html' },
  Uint8Array, Uint16Array, Uint32Array, DataView, ArrayBuffer, TextDecoder, TextEncoder,
  Blob: function(){}, URL: { createObjectURL(){ return 'blob:x' }, revokeObjectURL(){} }, FileReader: function(){}, localStorage: { getItem: () => null, setItem(){} } };
sandbox.window = sandbox; sandbox.globalThis = sandbox;
sandbox.addEventListener = function(){}; sandbox.removeEventListener = function(){};
sandbox.scrollTo = function(){}; sandbox.innerHeight = 800; sandbox.scrollY = 0; sandbox.getComputedStyle = function(){ return {} };
vm.createContext(sandbox);
vm.runInContext(script, sandbox, { timeout: 900000 });
sandbox.toast = function(){};
sandbox.SAV_ROWS = [];

/* ---------- 断言工具 ---------- */
let pass = 0, fail = 0; const fails = [], notes = [];
function chk(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS  ' + name + (detail !== undefined ? '  → ' + detail : '')); }
  else { fail++; fails.push(name + '  → ' + detail); console.log('  FAIL  ' + name + '  → ' + detail); }
}
function hdr(t){ console.log('\n=== ' + t + ' ==='); }
function note(s){ notes.push(s); console.log('  NOTE  ' + s); }

const E = sandbox.ERDATA;
const spById = id => E.species.filter(s => String(s.id) === String(id))[0];
const spByZh = n => E.species.filter(s => s.zh === n)[0] || E.species.filter(s => s.zh.indexOf(n) > -1)[0];
const learnOf = s => sandbox.learnOf(s);
const ditto = spById(132);
function clearMemo(){ ['_MEV_MEMO', '_MECH_MEMO', '_MV_SEC'].forEach(k => { const o = sandbox[k]; if (o && typeof o === 'object') Object.keys(o).forEach(x => delete o[x]); }); }
const spWithAbi = id => E.species.filter(s => { let L = []; try { L = sandbox.mechAbiIdList(s) || []; } catch (e) { L = []; } return L.map(String).indexOf(String(id)) > -1; })[0];

/* =========================================================
   §0 前置：载荷与样本就位
   ========================================================= */
hdr('§0 前置：载荷与样本就位');
chk('0-1 内嵌脚本就位：mechOn/smogonOn 均 true 且 axisLib 非空',
  sandbox.mechOn() === true && sandbox.smogonOn() === true && sandbox.axisLib().length > 0,
  'mechOn=' + sandbox.mechOn() + ' smogonOn=' + sandbox.smogonOn() + ' axisLib=' + sandbox.axisLib().length);
const S34 = spWithAbi(34), S11 = spWithAbi(11), S37 = spWithAbi(37), S74 = spWithAbi(74),
      S22 = spWithAbi(22), S39 = spWithAbi(39), S553 = spWithAbi(553), S231 = spWithAbi(231);
chk('0-2 P1 样本物种全命中（叶绿素34/蓄水11/大力士37/瑜伽之力74/威吓22/反威吓39·553/幻影防守231）',
  [S34, S11, S37, S74, S22, S39, S553, S231].every(Boolean),
  [34, 11, 37, 74, 22, 39, 553, 231].map(id => id + ':' + ((spWithAbi(id) || {}).zh || 'MISSING')).join(' '));
const sp248 = sandbox.spId2Obj(248), core260 = sandbox.spId2Obj(260);
chk('0-3 P2/P3 样本就位（班基拉斯248 / 巨沼怪260）', !!sp248 && !!core260, (sp248 && sp248.zh) + ' / ' + (core260 && core260.zh));

/* =========================================================
   §A P5 计数契约
   ========================================================= */
hdr('§A P5 计数契约（mechLib 52/156 · 词汇表 40 · smogonPrior 120）');
const ALL = sandbox.mechAll();
let cbTotal = 0; ALL.forEach(m => { cbTotal += ((m.combos) || []).length; });
chk('A1 机制条目数 = 52（mechAll）', ALL.length === 52, 'mechs=' + ALL.length);
chk('A2 combo 总数 = 156', cbTotal === 156, 'combos=' + cbTotal);
chk('A3 mechLib.meta.count 自洽 = 52', !!(E.mechLib && E.mechLib.meta && E.mechLib.meta.count === 52),
  'meta.count=' + (E.mechLib && E.mechLib.meta ? E.mechLib.meta.count : '-'));
const RWS = Object.keys(sandbox.MECH_RW_ZH);
chk('A4 rewrite 词汇表 40 项', RWS.length === 40, 'vocab=' + RWS.length);
{
  const set = new Set(RWS);
  chk('A5 全部机制 rewrite 均在词汇表内（零 rogue）', ALL.filter(m => !set.has(m.rewrite)).length === 0,
    'rogue=' + JSON.stringify(ALL.filter(m => !set.has(m.rewrite)).map(m => m.id).slice(0, 5)));
}
chk('A6 smogonPrior 内嵌 120 条（ERDATA.smogonPrior.species）',
  !!(E.smogonPrior && E.smogonPrior.species && Object.keys(E.smogonPrior.species).length === 120),
  'n=' + (E.smogonPrior && E.smogonPrior.species ? Object.keys(E.smogonPrior.species).length : 'none'));
chk('A7 axis_lib 15 轴', sandbox.axisLib().length === 15, 'n=' + sandbox.axisLib().length);

/* =========================================================
   §B P1 新机制命中改写评估
   ========================================================= */
hdr('§B P1 新机制命中改写评估（叶绿素/蓄水/大力士/瑜伽之力/威吓·反威吓/幻影防守）');
if (S34) {
  const base = sandbox.spdOf(S34);
  const sunny = sandbox.mechSpdOf(S34, { sysKey: '晴' });
  const dry = sandbox.mechSpdOf(S34, { sysKey: '' });
  const me = sandbox.mechEvalOf(S34, { sysKey: '晴' });
  chk('B1 叶绿素 34：晴天队速度维度 = 基础 ×1.5（ER 口径，非官方 ×2）',
    base > 0 && sunny === Math.round(base * 1.5), S34.zh + '  base=' + base + ' → sunny=' + sunny + '（×' + (sunny / base).toFixed(2) + '）');
  chk('B2 叶绿素 34：非晴天体系不改写（前提未命中 → 仍表列速度）', dry === base, 'dry=' + dry);
  chk('B3 叶绿素 34：spdMul=1.5 且 why 登记 ER 口径与官方 ×2 差异',
    me.spdMul === 1.5 && /ER/.test(me.whys.join(' ')) && /官方 ×2/.test(me.whys.join(' ')), (me.whys[0] || '').slice(0, 120));
} else { chk('B1-B3 叶绿素样本', false, 'MISSING'); }
if (S11) {
  const tri = sandbox.defCellTrio(S11, '水'), me = sandbox.mechEvalOf(S11, {});
  chk('B4 蓄水 11：对水免疫 inn=0（防御匹配真实改写），受击回血只作前提登记（healFrac 不写）',
    tri.inn === 0 && me.defImm.indexOf('水') > -1 && me.healFrac === 0,
    S11.zh + '  inn=' + tri.inn + ' defImm=' + JSON.stringify(me.defImm) + ' healFrac=' + me.healFrac);
} else { chk('B4 蓄水样本', false, 'MISSING'); }
if (S37) {
  const me = sandbox.mechEvalOf(S37, {}), adj = sandbox.mechAtkMulOf(S37, '物理', null, {});
  const mcHP = ALL.filter(m => m.rewrite === 'huge_power_phys')[0];
  const lst = mcHP ? sandbox.mechMcAbiList(S37, mcHP) : [];
  chk('B5 大力士 37：物攻 ×2（ER 与官方一致）→ 攻击评估改写；按 id 分档只走 37 支（不含 74）',
    me.atkMul['物理'] === 2 && adj.mul === 2 && lst.map(String).indexOf('37') > -1 && lst.map(String).indexOf('74') < 0,
    S37.zh + '  phyMul=' + me.atkMul['物理'] + ' mechAtkMul=' + adj.mul + ' pool=' + JSON.stringify(lst));
} else { chk('B5 大力士样本', false, 'MISSING'); }
if (S74) {
  const me = sandbox.mechEvalOf(S74, {}), adjS = sandbox.mechAtkMulOf(S74, '特殊', null, {});
  const mcHP = ALL.filter(m => m.rewrite === 'huge_power_phys')[0];
  const lst = mcHP ? sandbox.mechMcAbiList(S74, mcHP) : [];
  chk('B6 瑜伽之力 74：ER 特攻 ×2（官方物攻 ×2，差异登记）→ 攻击维度改写（按 id 分档）',
    lst.map(String).indexOf('74') > -1 && me.atkMul['特殊'] === 2 && adjS.mul === 2 && /差异登记/.test(me.atkWhys.join(' ')),
    S74.zh + '  spaMul=' + me.atkMul['特殊'] + ' why=' + (me.atkWhys[0] || '').slice(0, 90));
} else { chk('B6 瑜伽之力样本', false, 'MISSING'); }
if (S22) {
  const me = sandbox.mechEvalOf(S22, {}), d11 = sandbox.DIM_IMPL.D11(S22, {});
  chk('B7 威吓 22：physWane=1（防御/站场增益）+ why 出现「威吓」+ D11 免疫/减伤维度加分',
    me.physWane === 1 && me.whys.some(w => /威吓/.test(w)) && d11.pts >= 2 && /威吓/.test(d11.txt),
    S22.zh + '  pt11=' + d11.pts + ' ' + d11.txt.slice(0, 70));
} else { chk('B7 威吓样本', false, 'MISSING'); }
if (S39) {
  const me = sandbox.mechEvalOf(S39, {});
  chk('B8 反威吓（39 免疫档）：vsIntim≥1（对抗威吓评估出现）且不误改攻击评估',
    me.vsIntim >= 1 && me.atkMul['物理'] === 1 && me.atkMul['特殊'] === 1, S39.zh + '  vsIntim=' + me.vsIntim + ' atkMul=' + JSON.stringify(me.atkMul));
} else { chk('B8 反威吓样本', false, 'MISSING'); }
if (S553) {
  const me = sandbox.mechEvalOf(S553, {}), hi = (S553.base[1] >= S553.base[3] ? '物理' : '特殊');
  chk('B9 反威吓（553 警卫犬档，按 id 分档）：被威吓攻击 +1（×1.5）+ why 出现',
    me.atkMul[hi] === 1.5 && me.vsIntim >= 1 && me.whys.some(w => /警卫犬/.test(w)), S553.zh + '  hi=' + hi + ' atkMul=' + me.atkMul[hi]);
} else { chk('B9 反威吓 553 样本', false, 'MISSING'); }
if (S231) {
  const me = sandbox.mechEvalOf(S231, {}), d11 = sandbox.DIM_IMPL.D11(S231, {});
  const tri = sandbox.defCellTrio(S231, '火');
  const ts = sandbox.effTypesOf(S231);
  chk('B10 幻影防守 231：复用 multiscale_sash 满血减伤语义（defFlat=0.5 → D11 满血受击减伤），不误当作类型抵抗',
    me.defFlat === 0.5 && d11.pts >= 2 && /满血受击减伤/.test(d11.txt) && tri.inn === sandbox.defMult(ts.base.concat(ts.inn), '火'),
    S231.zh + '  pt11=' + d11.pts + ' defFlat=' + me.defFlat + ' 火inn=' + tri.inn);
} else { chk('B10 幻影防守样本', false, 'MISSING'); }

/* =========================================================
   §C P2 Smogon 先验生效
   ========================================================= */
hdr('§C P2 Smogon 先验生效（注入 120 · 消费 · 开关回退 · 诚实标注）');
const SP248P = sandbox.smogonPriorOf(248);
const mv0 = SP248P && (SP248P.moves || [])[0], it0 = SP248P && (SP248P.items || [])[0];
chk('C1 smogonOn()===true（开关 true 且数据在）', sandbox.smogonOn() === true, '');
chk('C2 smogonPriorOf(248) 存在（班基拉斯，先验物种样例）', !!SP248P, sp248 ? sp248.zh : '-');
chk('C3 moves/items/teammates 三路取数可用',
  !!mv0 && !!it0 && sandbox.smogonPct(SP248P, 'moves', mv0.id) === +mv0.percent && sandbox.smogonPct(SP248P, 'items', it0.id) === +it0.percent && (SP248P.teammates || []).length > 0,
  mv0 ? ('mv=' + mv0.id + ':' + mv0.percent + ' it=' + it0.id + ':' + it0.percent + ' mates=' + (SP248P.teammates || []).length) : 'none');
chk('C4 道具先验：软优先权重 >0 且 ≤ SMOGON_PRIOR_W×0.30（并列微排序，不动机制主导）',
  !!it0 && sandbox.smogonItemBonus(sp248, it0.id) > 0 && sandbox.smogonItemBonus(sp248, it0.id) <= sandbox.SMOGON_PRIOR_W * 0.30 + 1e-9,
  it0 ? ('bonus=' + sandbox.smogonItemBonus(sp248, it0.id).toFixed(4) + ' / 上限=' + (sandbox.SMOGON_PRIOR_W * 0.30).toFixed(4)) : 'none');
chk('C5 配招先验：常见招小权重加成 >0 且 ≤ SMOGON_PRIOR_W×0.10',
  !!mv0 && sandbox.smogonMoveBonus(sp248, mv0.id) > 0 && sandbox.smogonMoveBonus(sp248, mv0.id) <= sandbox.SMOGON_PRIOR_W * 0.10 + 1e-9,
  mv0 ? ('bonus=' + sandbox.smogonMoveBonus(sp248, mv0.id).toFixed(4)) : 'none');
{
  const mateIds = sandbox.smogonMateIds(sp248);
  const mapped = mateIds.filter(id => { let o = null; try { o = sandbox.spId2Obj(+id); } catch (e) { o = null; } return !!(o && o.zh); });
  chk('C6 队友先验：smogonMateIds 非空且映射到 ER 物种 id（可取中文名）', mateIds.length > 0 && mapped.length > 0,
    'mates=' + mateIds.length + ' mapped=' + mapped.length);
}
chk('C7 诚实标注文案「原版惯例 ≠ ER 使用率」出现在渲染片段（smogonMateHtml 注入块）',
  /原版惯例 ≠ ER 使用率/.test(sandbox.smogonMateHtml(sp248, [])) && /队友先验/.test(sandbox.smogonMateHtml(sp248, [])) && /不改变队友排序硬门/.test(sandbox.smogonMateHtml(sp248, [])),
  'len=' + sandbox.smogonMateHtml(sp248, []).length);
{
  let rc = '', rerr = '';
  try { sandbox.renderCore(sp248); rc = byId('coreOut')._html; } catch (e) { rerr = String(e); }
  chk('C8 该诚实标注进入详情页渲染面（renderCore(248)）', rerr === '' && /原版惯例 ≠ ER 使用率/.test(rc), rerr || ('len=' + rc.length));
}
chk('C9 非先验物种（132 百变怪）零影响',
  sandbox.smogonItemBonus(ditto, 286) === 0 && sandbox.smogonMoveBonus(ditto, 33) === 0 && sandbox.smogonMateIds(ditto).length === 0, '');
{
  let off = false, od = '';
  try {
    sandbox.SMOGON_PRIOR_ENABLED = false;
    off = sandbox.smogonOn() === false && !!it0 && sandbox.smogonItemBonus(sp248, it0.id) === 0 && !!mv0 && sandbox.smogonMoveBonus(sp248, mv0.id) === 0
      && sandbox.smogonMateIds(sp248).length === 0 && sandbox.smogonMateHtml(sp248, []) === '' && sandbox.smogonMoveWhy(sp248, mv0.id) === '';
    od = 'on=false';
  } catch (e) { od = 'throw: ' + String(e).slice(0, 90); }
  finally { sandbox.SMOGON_PRIOR_ENABLED = true; }
  chk('C10 SMOGON_PRIOR_ENABLED=false → 全部消费函数返回空/零（回退零影响）', off, od);
}
{
  const a = sandbox.itemDecide(sp248, '物理', '输出', null);
  const b0 = a.length ? a[0].zh : '';
  sandbox.SMOGON_PRIOR_ENABLED = false;
  const b = sandbox.itemDecide(sp248, '物理', '输出', null);
  sandbox.SMOGON_PRIOR_ENABLED = true;
  chk('C11 开关关/开：道具榜首一致（机制覆盖主导，先验仅并列微排序）', a.length >= 1 && b.length >= 1 && b[0].zh === b0, 'on=' + b0 + ' off=' + (b[0] && b[0].zh));
}

/* =========================================================
   §D P3 体系模板生成
   ========================================================= */
hdr('§D P3 体系模板生成（axis_lib 15 轴 × 六位 · 用户池投影 · 池不足补位）');
const POS = ['体系核心', '打手位', '补盲位', '联防位', '撒钉清钉轮转位', '功能位'];
{
  const lib = sandbox.axisLib();
  chk('D1 axis_lib 15 条轴且每条均含「体系模板」对象', lib.length === 15 && lib.filter(a => a && a['体系模板'] && typeof a['体系模板'] === 'object').length === 15,
    'axes=' + lib.length);
  let ok6 = true, bad = [];
  lib.forEach(a => { const t = a['体系模板']; POS.forEach(k => { if (!t || !t[k]) { ok6 = false; bad.push(a.id + '/' + k); } }); });
  chk('D2 每轴六位全齐（体系核心/打手位/补盲位/联防位/撒钉清钉轮转位/功能位）', ok6, bad.length ? bad.slice(0, 5).join(',') : '15×6 全齐');
}
sandbox.SAV_ROWS = [];
const T0 = sandbox.axisTemplateOf(core260, 'rain');
chk('D3 axisTemplateOf(core,"rain") 返回六位且六位均有候选', !!T0 && T0.pos.length === 6 && T0.pos.filter(k => T0.picks[k]).length === 6,
  T0 ? T0.pos.map(k => k + ':' + (T0.picks[k] ? (T0.picks[k].zh + (T0.picks[k].fill ? '(补位)' : '')) : '—')).join(' | ') : 'null');
chk('D4 六位名与契约一致且顺序固定', !!T0 && T0.pos.join() === POS.join(), T0 ? T0.pos.join() : '-');
const pickedIds = T0 ? T0.pos.map(k => T0.picks[k]).filter(Boolean).map(p => p.id) : [];
const hEmpty = sandbox.axisTplHtml(core260, 'rain');
chk('D5 池空（SAV_ROWS=[]）→ nPool=0 且非核心位一律「补位」标注（axisTplHtml 含补位徽标）',
  !!T0 && T0.nPool === 0 && T0.pos.filter(k => k !== '体系核心').every(k => T0.picks[k] && T0.picks[k].fill === true) && /补位<\/span>/.test(hEmpty),
  'nPool=' + (T0 ? T0.nPool : '-') + ' 补位徽标=' + (hEmpty.match(/补位<\/span>/g) || []).length);
sandbox.SAV_ROWS = pickedIds.map(id => ({ '图鉴编号': String(id) }));
const T1 = sandbox.axisTemplateOf(core260, 'rain');
chk('D6 用户池投影：SAV_ROWS=引擎自选六位 → nPool=池物种数 且六位全来自池（fill=false）',
  !!T1 && T1.nPool === pickedIds.length && T1.pos.every(k => T1.picks[k] && T1.picks[k].fill === false),
  'nPool=' + (T1 ? T1.nPool : '-') + '/' + pickedIds.length + ' picks=' + (T1 ? T1.pos.map(k => (T1.picks[k] || {}).zh).join('/') : '-'));
const hPool = sandbox.axisTplHtml(core260, 'rain');
chk('D7 池满（六位全在池）→ 无「补位」徽标（全部来自池），且生成口径标注存档池只数',
  !/补位<\/span>/.test(hPool) && hPool.indexOf('存档池（' + pickedIds.length + ' 只）') > -1,
  '补位徽标=' + (hPool.match(/补位<\/span>/g) || []).length + ' 存档池只数=' + pickedIds.length);
chk('D8 axisTplHtml 渲染片段含「体系模板」+ 六位名 + 生成口径',
  /体系模板/.test(hEmpty) && POS.every(k => hEmpty.indexOf(k) > -1) && /存档池/.test(hEmpty) && /生成口径/.test(hEmpty), 'len=' + hEmpty.length);
chk('D9 字段缺失优雅降级：不存在的轴 → axisTplOf=null 且 axisTplHtml 返回空串',
  sandbox.axisTplOf('__nope__') === null && sandbox.axisTplHtml(core260, '__nope__') === '', '');
sandbox.SAV_ROWS = [];

/* =========================================================
   §E P4 优雅降级（mechLib / smogonPrior 置空 → v4.11 行为）
   ========================================================= */
hdr('§E P4 优雅降级（mechLib / smogonPrior 置空）');
const SAVED_MECH = E.mechLib, SAVED_PRIOR = E.smogonPrior, SAVED_EN = sandbox.SMOGON_PRIOR_ENABLED;
E.mechLib = { mechs: [] }; clearMemo();
chk('E1 mechLib 置空 → mechOn()===false（机制层整体退出）', sandbox.mechOn() === false, 'mechOn=' + sandbox.mechOn());
chk('E2 mechLib 置空 → 评分改写层退出（叶绿素晴天速度 = 表列速度）+ mechCoreHtml 空',
  sandbox.mechSpdOf(S34, { sysKey: '晴' }) === sandbox.spdOf(S34) && sandbox.mechCoreHtml(ditto, {}) === '',
  'spd=' + sandbox.mechSpdOf(S34, { sysKey: '晴' }) + ' base=' + sandbox.spdOf(S34));
{
  let ok = true, err = '';
  try { sandbox.renderCore(ditto); } catch (e) { ok = false; err = String(e); }
  const h = byId('coreOut')._html;
  chk('E3 mechLib 置空 → 重渲染无崩溃且无机制残留（mechsec / badge-mech / 机制解读 全空）',
    ok && h.length > 0 && !/mechsec/.test(h) && !/badge-mech/.test(h) && h.indexOf('机制解读') < 0, err || ('len=' + h.length));
}
E.smogonPrior = null; clearMemo();
{
  let off = false, od = '';
  try {
    off = sandbox.smogonOn() === false && sandbox.smogonItemBonus(sp248, it0.id) === 0 && sandbox.smogonMoveBonus(sp248, mv0.id) === 0
      && sandbox.smogonMateIds(sp248).length === 0 && sandbox.smogonMateHtml(sp248, []) === '' && sandbox.smogonMoveWhy(sp248, mv0.id) === '';
    od = 'clean';
  } catch (e) { od = 'throw: ' + String(e).slice(0, 90); }
  chk('E4 smogonPrior 置空 → smogonOn()===false 且全部消费函数返回空/零', off, od);
}
chk('E5 置空态下核心数据契约仍在（deriveBuilds 非空 + WCONF 不变）',
  sandbox.deriveBuilds(spByZh('妙蛙花')).length > 0 && sandbox.WCONF.boost === 0.5, '');
E.mechLib = SAVED_MECH; E.smogonPrior = SAVED_PRIOR; sandbox.SMOGON_PRIOR_ENABLED = SAVED_EN; clearMemo();
chk('E6 恢复后机制层与先验层可复现（mechOn/smogonOn===true；512 命中还原；先验消费还原）',
  sandbox.mechOn() === true && sandbox.smogonOn() === true && sandbox.mechByMove(512).length === 1 && sandbox.smogonItemBonus(sp248, it0.id) > 0,
  'mechOn=' + sandbox.mechOn() + ' smogonOn=' + sandbox.smogonOn() + ' m512=' + sandbox.mechByMove(512).length);

/* =========================================================
   汇总
   ========================================================= */
console.log('\n================ v4.12 新机制/Smogon 先验/体系模板 探针 汇总 ================');
console.log('PASS=' + pass + '  FAIL=' + fail);
if (fails.length) { console.log('FAIL 清单：'); fails.forEach(f => console.log('  - ' + f)); }
console.log('NOTE ' + notes.length + ' 条：'); notes.forEach(n => console.log('  · ' + n));
process.exitCode = fail ? 1 : 0;
