/* ============================================================================
   v4.10 机制知识库 · 独立回归 + 新机制探针（D 线验收）
   规格：docs/战斗分析/_v410_机制知识库_规格_20261009.md §6
   v4.11 校准（2026-10-10，口径：改版数据为准）：①道具三选 317→308（「服务铃」=繁中译名，ER 数据口径=脱壳忍者壳；
     317=Eject Button=逃脱按钮，挨招换下，与 308 Shed Shell 无失败换下是两个不同道具）；②杂技 112.5/75（ER 威力 75×1.5，
     官方 55×2=110 登记为口径差）；③蛮干 ER desc「自身 HP 低于对方时增力」（官方削至同血登记为口径差）。
   v4.12 校准（2026-10-10，只按数据层契约增长更新，其余断言一字不改）：
     ① mechLib 28→52 机制（L73 / E1）、combo 77→156（E2）；
     ② 条件过滤三关（D1/D3/D10）随目录增长改判：mechCombosFor 为「ok 优先 → 可见上限 10」，
        百变怪未截断边集 27 条（ok=11/fail=16）而可见 10 条全为满足边 → D1 改按未截断边集判定、
        D3 样本改「可见集含 fail 边」的首个物种、D10 载体改首个 512 学习者（性质不变，仅换见证者）；
     ③（收尾更新，2026-10-10）E7 名称内「26 条」为 v4.10 词汇表旧值 → 已按实际值校正为「40 条」
        （断言体仅判 badRw===0，一行未动，行为不变）；校正后全跑仍 86/0。
   方法：Node VM + fake DOM 打桩，加载**最终产物** 配招助手_ER.html 的内嵌脚本
        （D:\game\elite-redux\_chk_script_1.js，由 _extract_script.js 抽出），
        在真实引擎上跑 P1/P2/P3 + 组合联想器三关 + 详情区块 + 优雅降级 + 移动端 + token。
   纪律：不读 build 脚本源码；只读产物与内嵌 script；不改任何项目文件。
   运行：node docs\战斗分析\_验证证据\verify_v410.js   （需先跑 _extract_script.js）
   ============================================================================ */
const fs = require('fs'), vm = require('vm');
const ER = 'D:\\game\\elite-redux\\';
const script = fs.readFileSync(ER + '_chk_script_1.js', 'utf8');
const FULLHTML = fs.readFileSync(ER + '配招助手_ER.html', 'utf8');

/* ---------- DOM 打桩（沿用 verify_v1.js 先例） ---------- */
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

/* ---------- 断言工具 ---------- */
let pass = 0, fail = 0; const fails = [], notes = [];
function chk(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS  ' + name + (detail !== undefined ? '  → ' + detail : '')); }
  else { fail++; fails.push(name + '  → ' + detail); console.log('  FAIL  ' + name + '  → ' + detail); }
}
function hdr(t){ console.log('\n=== ' + t + ' ==='); }
function note(s){ notes.push(s); console.log('  NOTE  ' + s); }

const E = sandbox.ERDATA;
const spByZh = n => E.species.filter(s => s.zh === n)[0] || E.species.filter(s => s.zh.indexOf(n) > -1)[0];
const spById = id => E.species.filter(s => String(s.id) === String(id))[0];
const learnOf = s => sandbox.learnOf(s);
const ditto = spById(132);
const mechOn = () => sandbox.mechOn();
function clearMemo(){ Object.keys(sandbox._MECH_MEMO || {}).forEach(k => delete sandbox._MECH_MEMO[k]); }
const MV = sandbox.MV;
const dittoHtml = (function(){ sandbox.renderCore(ditto); return byId('coreOut')._html; })();

console.log('mechAll=' + sandbox.mechAll().length + '  mechOn=' + mechOn());
console.log('产物指纹(SHA256)以 D 线报告登记为准；本探针只消费 _chk_script_1.js（由 _extract_script.js 从最终 HTML 抽出）');

/* =========================================================
   0. 前置：P1 对象就位
   ========================================================= */
hdr('0 前置：百变怪对象与 mechLib 就位');
chk('P1 对象 百变怪 id="132"（数据中文名命中）', !!ditto && String(ditto.id) === '132', ditto ? ('id=' + ditto.id + ' en=' + ditto.en) : 'MISSING');
chk('百变怪特性池含 变身者（150）', !!ditto && (ditto.abis || []).indexOf('变身者') > -1 && sandbox.mechAbiId('变身者') === '150', ditto ? JSON.stringify(ditto.abis) : '');
chk('mechLib 已内嵌且非空（数据层嵌入 data.js 顶层键 mechLib）', sandbox.mechAll().length === 52, 'mechs=' + sandbox.mechAll().length);

/* =========================================================
   §A  P1 百变怪（132，特性池含 150）
   ========================================================= */
hdr('§A P1 百变怪 · 变身者剖面改写');
const mp = sandbox.mechSpProfile(ditto);
chk('A1 mechSpProfile(ditto).imposter === true', mp.imposter === true, JSON.stringify(mp.mechs.map(m => m.id)));
chk('A2 道具三选 id 集 = 讲究围巾285/气势披带287/脱壳忍者壳308', mp.items.join() === '285,287,308', JSON.stringify(mp.items));
chk('A3 why 含「变身者」「速度复制」「道具三选」', /变身者/.test(mp.why.join(' ')) && /速度复制/.test(mp.why.join(' ')) && /道具三选/.test(mp.why.join(' ')), mp.why[0]);
chk('A4 why 含「脱壳忍者壳」且已无「服务铃」（ER 数据口径；繁中译名已校准替换）', /脱壳忍者壳/.test(mp.why.join(' ')) && !/服务铃/.test(mp.why.join(' ')), (mp.why.find(x => /脱壳忍者壳/.test(x)) || '').slice(0, 80));
chk('A5 why 明示「种族值/技能池不作为主评分依据」（仍展示）', /不作为主评分依据/.test(mp.why.join(' ')) && /仍展示/.test(mp.why.join(' ')), mp.why[1]);
chk('A6 评估剖面不再按种族值/技能池作主判据（渲染面显式声明）', dittoHtml.indexOf('不作为主评分依据（机制覆盖优先）') > -1, '');
chk('A7 详情渲染面出现机制剖面改写横幅「机制剖面改写 · 变身者」', dittoHtml.indexOf('机制剖面改写 · 变身者') > -1 && /机制覆盖 &gt; 通用评分/.test(dittoHtml), '');
chk('A8 详情渲染面出现「道具三选」及三项显示名（讲究围巾/气势披带/脱壳忍者壳）', dittoHtml.indexOf('道具三选') > -1 && dittoHtml.indexOf('讲究围巾') > -1 && dittoHtml.indexOf('气势披带') > -1 && dittoHtml.indexOf('脱壳忍者壳') > -1 && String((E.items.filter(x => String(x[0]) === '308')[0] || [])[2]) === '脱壳忍者壳', 'ERDATA.items[308].zh=' + String((E.items.filter(x => String(x[0]) === '308')[0] || [])[2]));
chk('A9 「种族值低」不作为否决/主判据（渲染面零出现）', dittoHtml.indexOf('种族值低') < 0, '');
chk('A10 种族值仍展示（定位判断行含种族 物攻48/特攻48/速度48）', /种族 物攻48\/特攻48\/速度48/.test(dittoHtml), '');
const bi = sandbox.buildItem(ditto, '物理', '输出', null);
chk('A11 道具决策置顶三条机制锚点（变身者·道具三选）', bi.slice(0, 3).every(x => /机制锚点（变身者·道具三选）/.test(String(x[1]))) && bi.slice(0, 3).map(x => x[0]).join() === '讲究围巾,气势披带,脱壳忍者壳', bi.slice(0, 3).map(x => x[0] + '/').join(''));
const abw = sandbox.mechAbiWhy(ditto);
chk('A12 mechAbiWhy(ditto) 命中 变身者（特性级机制解读）', abw.some(a => a.rewrite === 'imposter_anchor'), JSON.stringify(abw.map(a => a.zh)));

/* =========================================================
   §B  P2 杂技（512）
   ========================================================= */
hdr('§B P2 杂技 · 威力条件与消耗联动');
chk('B1 MV[512] 就位（杂技/飞行/物理/75）', MV[512] && MV[512][1] === '杂技' && MV[512][3] === '飞行' && MV[512][5] === 75, JSON.stringify(MV[512] && MV[512].slice(0, 6)));
const a0 = sandbox.mechMvAdj(ditto, MV[512], {});
chk('B2 无道具位 → 威力 112.5 + why 含「无道具×1.5」「ER 改版口径」', a0.pow === 112.5 && /无道具×1\.5/.test(a0.why.join(' ')) && /ER 改版口径/.test(a0.why.join(' ')) && a0.warn === null, 'pow=' + a0.pow + ' why=' + JSON.stringify(a0.why));
chk('B3 why 明示口径差「112.5（ER 改版口径 75×1.5；官方 55×2=110，差异登记待实测）」', a0.why.some(x => /112\.5（ER 改版口径 75×1\.5；官方 55×2=110，差异登记待实测）/.test(x)), '');
const a285 = sandbox.mechMvAdj(ditto, MV[512], { item: 285 });
chk('B4 携带常驻道具（讲究围巾285）→ 威力 75 + warn「携带常驻道具时无加成（按表列威力 75）」', a285.pow === 75 && a285.warn === '携带常驻道具时无加成（按表列威力 75）' && /携带常驻道具时无加成/.test(a285.why.join(' ')), 'pow=' + a285.pow + ' warn=' + a285.warn);
const a339 = sandbox.mechMvAdj(ditto, MV[512], { item: 339 });
chk('B5 携带消耗性道具（飞行宝石339）→ 112.5 + 消耗联动标注', a339.pow === 112.5 && /消耗后杂技按 112\.5/.test(a339.why.join(' ')) && a339.why.some(x => /ER 改版口径 75×1\.5/.test(x)), 'pow=' + a339.pow);
const a331 = sandbox.mechMvAdj(ditto, MV[512], { item: 331 });
chk('B6 携带场地种子（青草种子331）→ 112.5 + 消耗联动标注', a331.pow === 112.5 && /消耗后杂技按 112\.5/.test(a331.why.join(' ')), 'pow=' + a331.pow);
chk('B7 消耗性道具判定：宝石339/种子328-331 真、常驻285 假、披带287 真、按钮317 真',
  sandbox.mechIsConsumable(339) && sandbox.mechIsConsumable(328) && sandbox.mechIsConsumable(329) && sandbox.mechIsConsumable(330) && sandbox.mechIsConsumable(331) && !sandbox.mechIsConsumable(285) && sandbox.mechIsConsumable(287) && sandbox.mechIsConsumable(317),
  [339, 328, 329, 330, 331, 285, 287, 317].map(i => i + ':' + sandbox.mechIsConsumable(i)).join(' '));
{
  const learners = E.species.filter(s => learnOf(s).indexOf(512) > -1);
  let withMech = 0, anomalies = [];
  learners.forEach(s => {
    let out = null; try { out = sandbox.pickAttacks(s, '物理', 4, '输出'); } catch (e) { anomalies.push(s.zh + ':throw'); return; }
    out.filter(c => c.id === 512).forEach(c => {
      const ok = c.mech && /无道具×1\.5|携带常驻道具时无加成|消耗后杂技按 112\.5/.test(c.why.join(' ')) && (c.pow === 112.5 || c.pow === 75);
      if (ok) withMech++; else anomalies.push(s.zh + ':pow=' + c.pow + ',mech=' + !!c.mech);
    });
  });
  chk('B8 E2E 杂技学习者候选池：出现机制标注的 512 候选 ≥1（实测 ' + withMech + ' 只）且无异常候选', withMech >= 1 && anomalies.length === 0, 'learners=' + learners.length + ' anomalies=' + JSON.stringify(anomalies.slice(0, 5)));
}
chk('B9 招式机制徽标 mechBadgeForMove(512) 含「机制解读：杂技」', /机制解读：杂技/.test(sandbox.mechBadgeForMove(512)), sandbox.mechBadgeForMove(512).trim());

/* =========================================================
   §C  P3 欺诈（492）
   ========================================================= */
hdr('§C P3 欺诈 · 按对方物攻，不受自身低物攻惩罚');
const f0 = sandbox.mechMvAdj(ditto, MV[492], {});
chk('C1 欺诈固定威力 95 + crossSide（跨侧纳入，不按本侧攻评）', f0.pow === 95 && f0.crossSide === true, 'pow=' + f0.pow + ' crossSide=' + f0.crossSide);
chk('C2 why 含「按对方物攻」+ 明示低物攻使用者不受惩罚', f0.why.some(x => x === '按对方物攻') && /低物攻使用者不受自身物攻惩罚/.test(f0.why.join(' ')), JSON.stringify(f0.why));
let lowAtkSample = null;
{
  const fpLearners = E.species.filter(s => learnOf(s).indexOf(492) > -1);
  let specSide = 0, anomalies = [];
  fpLearners.forEach(s => {
    [['物理', '物理'], ['特殊', '特殊']].forEach(([side]) => {
      let out = null; try { out = sandbox.pickAttacks(s, side, 4, '输出'); } catch (e) { anomalies.push(s.zh + ':throw'); return; }
      out.filter(c => c.id === 492).forEach(c => {
        if (side === '特殊') specSide++;
        if (!(c.pow === 95 && /按对方物攻/.test(c.why.join(' ')))) anomalies.push(s.zh + '/' + side + ':pow=' + c.pow);
      });
    });
    if (!lowAtkSample && s.base[1] <= 55 && learnOf(s).indexOf(492) > -1) lowAtkSample = s;
  });
  chk('C3 E2E 全部 492 候选（' + fpLearners.length + ' 只学习者 × 双侧）威力恒 95 且 why 含「按对方物攻」', anomalies.length === 0, 'anomalies=' + JSON.stringify(anomalies.slice(0, 5)));
  chk('C4 crossSide 生效：492 跨侧进入「特殊」侧候选（' + specSide + ' 例 >0）', specSide > 0, 'specialSideHits=' + specSide);
}
{
  let low = null;
  E.species.forEach(s => { if (!low && s.base && s.base[1] <= 50 && learnOf(s).indexOf(492) > -1) low = s; });
  if (low) {
    /* 低物攻使用者：加宽候选池（n=20）验证 492 仍以固定 95 入选 → 证明不受自身低物攻惩罚 */
    const hits = ['物理', '特殊'].map(sd => {
      const out = sandbox.pickAttacks(low, sd, 20, '输出');
      return out.filter(x => x.id === 492)[0];
    }).filter(Boolean);
    chk('C5 低物攻使用者（' + low.zh + ' 物攻' + low.base[1] + '，学欺诈）：加宽候选池下 492 以 95 入选且 why 含「按对方物攻」',
      hits.length > 0 && hits.every(c => c.pow === 95 && /按对方物攻/.test(c.why.join(' '))),
      'hits=' + hits.length + ' pow=' + hits.map(c => c.pow).join(','));
  } else {
    chk('C5 低物攻样本（物攻≤50 的 492 学习者）定位', false, '未找到样本（登记）');
  }
}

/* =========================================================
   §D  组合联想器 · 三关（条件过滤 / 个人池投影 / 效果叙事）
   ========================================================= */
hdr('§D 组合联想器 · 三关');
sandbox.SAV_ROWS = [];
/* 页面级组合（与 renderCore 同路径：mechCombosFor 汇总 物种+特性池+当前配招） */
const _db = sandbox.deriveBuilds(ditto);
const _mvid = ((((_db[0] || {}).mv || {}).main) || []).map(x => x.id);
const coMove = sandbox.mechCombosFor(ditto, { moves: _mvid });
/* v4.12 契约增长（D 线登记）：mechCombosFor 为「ok 优先 → slice(0,10)」上限；目录 28→52 后百变怪未截断边
   27 条（ok=11/fail=16），可见 10 条全为满足边 → D1 的条件过滤口径改按未截断边集判定（逐对象 comboAssocOf
   并集去重，与 mechCombosFor 同累积口径，仅去掉排序 / 池过滤 / 上限）。 */
function uEdges(s, moves) { const seen = {}, out = [];
  const objs = [{ kind: 'species', id: s.id }].concat((sandbox.mechAbiIdList(s) || []).map(id => ({ kind: 'ability', id: id }))).concat((moves || []).map(id => ({ kind: 'move', id: id })));
  objs.forEach(function(o) { const r = sandbox.comboAssocOf(o, { s: s }); r.list.forEach(function(x) { const k = [x.mechId, x.withKind, (x.withIds || []).join(',')].join('|'); if (!seen[k]) { seen[k] = 1; out.push(x); } }); });
  return out; }
const _uE = uEdges(ditto, _mvid);
chk('D1 条件过滤：既有「条件满足」边，也有「条件不满足」边（fail 非空）※按未截断边集（v4.12 目录增长后可见集被 ok 优先 10 上限截断）',
  _uE.some(x => x.ok === true) && _uE.some(x => x.ok === false && (x.fail || []).length > 0),
  '未截断 ok=' + _uE.filter(x => x.ok).length + ' fail=' + _uE.filter(x => !x.ok).length + ' n=' + _uE.length +
  ' / 可见 ok=' + coMove.list.filter(x => x.ok).length + ' fail=' + coMove.list.filter(x => !x.ok).length + ' (condOk=true ' + coMove.list.filter(x => x.condOk).length + ', cap ' + coMove.list.length + ')');
chk('D2 条件满足边标注（condOk=true → 渲染「条件满足」）', dittoHtml.indexOf('条件满足') > -1, 'count=' + (dittoHtml.match(/条件满足/g) || []).length);
/* v4.12：百变怪可见切片已全为满足边（见 D1），渲染面样本改用「可见集含 fail 边」的首个物种（性质不变，仅换见证者）。 */
const CBSP = (function(){
  for (const s of E.species) {
    let r; try { const b0 = sandbox.deriveBuilds(s)[0] || {}; const mv = (((b0.mv || {}).main) || []).map(x => x.id); r = sandbox.mechCombosFor(s, { moves: mv }); } catch (e) { continue; }
    if (!r.list.some(x => x.ok === false && (x.fail || []).length > 0)) continue;
    let h = ''; try { sandbox.renderCore(s); h = byId('coreOut')._html; } catch (e) { continue; }
    if (/条件不满足/.test(h)) return { s: s, h: h };
  }
  return null;
})();
chk('D3 条件不满足边标注（渲染「条件不满足：<原因>」）※样本改「可见集含 fail 边」的首个物种（v4.12）',
  !!CBSP && /条件不满足/.test(CBSP.h),
  CBSP ? (CBSP.s.zh + '#' + CBSP.s.id + ' 条件不满足×' + (CBSP.h.match(/条件不满足/g) || []).length) : 'n/a');
chk('D4 排序：满足条件（ok=true）边全部排在未满足之前', (function(){ const arr = coMove.list.map(x => x.ok); const f = arr.indexOf(false); return f < 0 || arr.slice(f).every(v => v === false); })(), JSON.stringify(coMove.list.map(x => x.ok)));
/* 个人池投影 */
const noPool = sandbox.comboAssocOf({ kind: 'item', id: 339 }, { s: ditto });
chk('D5 未解析存档（SAV_ROWS 空）→ pooled=false + note 含「未解析存档」+ 显示全量',
  noPool.pooled === false && /未解析存档/.test(noPool.note) && noPool.shown === noPool.count && noPool.shown > 0,
  'pooled=' + noPool.pooled + ' shown=' + noPool.shown + '/' + noPool.count + ' note=' + noPool.note);
sandbox.SAV_ROWS = [{ '图鉴编号': '132', '特性1': '变身者' }];
const poolNoItem = sandbox.comboAssocOf({ kind: 'item', id: 339 }, { s: ditto });
chk('D6 已解析存档（mock 只含 132）→ pooled=true + note 含「已解析存档」+ 未拥有的 item339 边被过滤',
  poolNoItem.pooled === true && /已解析存档/.test(poolNoItem.note) && poolNoItem.count > 0 && poolNoItem.shown === 0,
  'pooled=' + poolNoItem.pooled + ' count=' + poolNoItem.count + ' shown=' + poolNoItem.shown + ' note=' + poolNoItem.note);
sandbox.SAV_ROWS = [{ '图鉴编号': '132', '道具': '讲究围巾' }];
const poolItem = sandbox.comboAssocOf({ kind: 'item', id: 285 }, { s: ditto });
chk('D7 池内含「讲究围巾」→ item285 的边保留（owned=true，只显示池内）',
  poolItem.pooled === true && poolItem.shown === 1 && poolItem.list[0].owned === true,
  'shown=' + poolItem.shown + ' owned=' + (poolItem.list[0] || {}).owned);
sandbox.SAV_ROWS = [];
/* 效果叙事 */
let narrEmpty = 0, srcEmpty = 0, totalShown = 0;
[ditto, { kind: 'move', id: 512 }].forEach(obj => {
  const r = sandbox.comboAssocOf(obj, { s: ditto });
  r.list.forEach(x => { totalShown++; if (!x.narr || !String(x.narr).trim()) narrEmpty++; if (!x.src || !/^https?:/.test(x.src)) srcEmpty++; });
});
chk('D8 效果叙事：所有展示 combo 的 narr 非空、src 非空（' + totalShown + ' 条）', narrEmpty === 0 && srcEmpty === 0, 'narrEmpty=' + narrEmpty + ' srcEmpty=' + srcEmpty);
chk('D9 narr 与 JSON 一致（杂技+飞行宝石 = 规格示例句）', (function(){
  const cb = sandbox.mechAll().filter(m => m.id === 'acrobatics')[0];
  const c = (cb.combos || []).filter(x => x.with && x.with.ids && x.with.ids.indexOf(339) > -1)[0];
  return c && c.narr === '飞行宝石起手爆发，消耗后杂技全程 112.5';
})(), (function(){ const cb = sandbox.mechAll().filter(m => m.id === 'acrobatics')[0]; const c = (cb.combos || []).filter(x => x.with && x.with.ids && x.with.ids.indexOf(339) > -1)[0]; return c ? c.narr : 'n/a'; })());
/* v4.12：512 边在百变怪渲染面被可见上限截断（见 D1）。载体改用首个 512 学习者（其可见集含该边，与 §I「杂技页」同源）；
   「该叙事进入渲染面」的性质不变，仅换见证者。 */
chk('D10 narr 出现在渲染面（mechCoreHtml(512 学习者, moves 含 512) 含该叙事）※载体改首个 512 学习者（v4.12）',
  (function(){ const s = E.species.filter(x => learnOf(x).indexOf(512) > -1)[0]; if (!s) return false;
    const b0 = sandbox.deriveBuilds(s)[0] || {}; const mv = (((b0.mv || {}).main) || []).map(x => x.id);
    return sandbox.mechCoreHtml(s, { moves: mv.concat([512]) }).indexOf('飞行宝石起手爆发，消耗后杂技全程 112.5') > -1; })(),
  (function(){ const s = E.species.filter(x => learnOf(x).indexOf(512) > -1)[0]; return s ? (s.zh + '#' + s.id) : 'n/a'; })());

/* =========================================================
   §E  组合库契约（规格 §2 / §4）
   ========================================================= */
hdr('§E 组合库契约（mechLib schema）');
const ALL = sandbox.mechAll();
let cbTotal = 0, cbNoNarr = 0, cbNoSrc = 0, cbMagic170 = 0, mechNoBasis = 0, mechNoSrc = 0, badRw = 0, badCat = 0, cbNoWith = 0, badMatch = 0;
const RWS = new Set(Object.keys(sandbox.MECH_RW_ZH));
const CATS = ['eval_rewrite', 'power_cond', 'item_link', 'priority', 'weather_terrain', 'teammate'];
ALL.forEach(m => {
  if (!m.basis || !String(m.basis).trim()) mechNoBasis++;
  if (!m.src || !/^https?:/.test(m.src)) mechNoSrc++;
  if (!RWS.has(m.rewrite)) badRw++;
  if (CATS.indexOf(m.cat) < 0) badCat++;
  const mk = Object.keys(m.match || {});
  if (!mk.length || !mk.some(k => Array.isArray(m.match[k]) && m.match[k].length)) badMatch++;
  (m.combos || []).forEach(cb => {
    cbTotal++;
    if (!cb.narr || !String(cb.narr).trim()) cbNoNarr++;
    if (!cb.src || !/^https?:/.test(cb.src)) cbNoSrc++;
    const ids = ((cb.with || {}).ids || []).map(String);
    if (!(cb.with && cb.with.kind && ids.length)) cbNoWith++;
    if (ids.indexOf('170') > -1) cbMagic170++;
  });
});
chk('E1 机制条目数 = 52', ALL.length === 52, 'mechs=' + ALL.length);
chk('E2 combo 总数 = 156', cbTotal === 156, 'combos=' + cbTotal);
chk('E3 全部 combo narr 非空（结构化生成不编造）', cbNoNarr === 0, 'empty=' + cbNoNarr);
chk('E4 全部 combo src 非空且为 http(s)（铁律：每条可溯源）', cbNoSrc === 0, 'empty=' + cbNoSrc);
chk('E5 全部 mech basis 非空 + 顶层 src 非空', mechNoBasis === 0 && mechNoSrc === 0, 'basis=' + mechNoBasis + ' src=' + mechNoSrc);
chk('E6 无 combo 引用 魔术师170（§1 铁律：禁入任何 combo）', cbMagic170 === 0, 'hits=' + cbMagic170);
chk('E7 rewrite 全在 §3 词汇表内（40 条）', badRw === 0, 'rogue=' + badRw + ' vocab=' + RWS.size);
chk('E8 cat 全在六分类内', badCat === 0, 'rogue=' + badCat);
chk('E9 每条 combo 的 with.kind/ids 合规', cbNoWith === 0, 'bad=' + cbNoWith);
chk('E10 每条 mech match 至少一非空键', badMatch === 0, 'bad=' + badMatch);

/* =========================================================
   §F  详情页机制区块 & 溯源
   ========================================================= */
hdr('§F 详情页「机制解读 · 可配合组合」区块');
chk('F1 详情渲染面存在机制区块（<div class="sec mechsec"> + 标题）', /class="sec mechsec"/.test(dittoHtml) && dittoHtml.indexOf('🔧 机制解读 · 可配合组合') > -1, '');
chk('F2 组合折叠块存在（<details class="mechdet"> + 「可配合组合（N 条）」）', /<details class="mechdet"/.test(dittoHtml) && /可配合组合（\d+ 条）/.test(dittoHtml), (dittoHtml.match(/可配合组合（\d+ 条）[^<]*/) || [''])[0]);
const exp = (function(){
  const builds = sandbox.deriveBuilds(ditto);
  const mvid = ((((builds[0] || {}).mv || {}).main) || []).map(x => x.id);
  return sandbox.mechCombosFor(ditto, { moves: mvid }).shown;
})();
const srcLinks = (dittoHtml.match(/<a href="https?:\/\/[^"]+"[^>]*>溯源<\/a>/g) || []).length;
chk('F3 每条 combo 均有可展开溯源链接（溯源数 ' + srcLinks + ' = 区块 combo 数 ' + exp + '）', srcLinks === exp && srcLinks > 0, 'src=' + srcLinks + ' combos=' + exp);
chk('F4 溯源链接均指向 http(s) 真实 URL', (dittoHtml.match(/<a href="https?:\/\/[^"]+"[^>]*>溯源<\/a>/g) || []).every(a => /https?:\/\//.test(a)), '');
chk('F5 特性机制徽标 mechBadgeForAbi(变身者) 含「机制解读：变身者」', /机制解读：变身者/.test(sandbox.mechBadgeForAbi('变身者')), '');
chk('F6 详情渲染面出现机制徽标（badge-mech ≥1）', (dittoHtml.match(/badge-mech/g) || []).length >= 1, 'count=' + (dittoHtml.match(/badge-mech/g) || []).length);
chk('F7 mechCoreHtml 非空且结构完整', sandbox.mechCoreHtml(ditto, {}).length > 1000 && /mechdet/.test(sandbox.mechCoreHtml(ditto, {})), 'len=' + sandbox.mechCoreHtml(ditto, {}).length);
/* 按需出现 / 不出现（全物种扫描，渲染抽检各 40 只）；判定口径与 renderCore 完全一致：
   期望 = mechCoreHtml(s,{moves: 该物种 build 主招 id}) 是否非空  ← 引擎自身判据，不自行复算 */
{
  let hitN = 0, noHitN = 0, posChecked = 0, negChecked = 0, posMiss = 0, negMiss = 0, posMissEx = [], negMissEx = [];
  E.species.forEach(s => {
    const b0 = sandbox.deriveBuilds(s)[0] || {};
    const mvids = (((b0.mv || {}).main) || []).map(x => x.id);
    const expect = sandbox.mechCoreHtml(s, { moves: mvids }).length > 0;
    if (expect) hitN++; else noHitN++;
    if (expect && posChecked >= 40) return;
    if (!expect && negChecked >= 40) return;
    let h = ''; try { sandbox.renderCore(s); h = byId('coreOut')._html; } catch (e) { return; }
    const has = /class="sec mechsec"/.test(h);
    if (expect) { posChecked++; if (!has) { posMiss++; posMissEx.push(s.zh); } }
    else { negChecked++; if (has) { negMiss++; negMissEx.push(s.zh); } }
  });
  chk('F8 详情机制区块按需出现（引擎判据为「有内容」的物种 → 渲染 mechsec）：抽检 ' + posChecked + '/' + hitN + '，缺渲染 ' + posMiss, posChecked > 0 && posMiss === 0, JSON.stringify(posMissEx.slice(0, 5)));
  chk('F9 机制无内容物种不渲染 mechsec（保持 v4.9 结构，无泄漏）：抽检 ' + negChecked + '/' + noHitN + '，误挂 ' + negMiss, negChecked > 0 && negMiss === 0, JSON.stringify(negMissEx.slice(0, 5)));
}

/* =========================================================
   §G  优雅降级（mechLib 置空 + 清 memo → v4.9 行为不变）
   ========================================================= */
hdr('§G 优雅降级（就地置 ERDATA.mechLib={mechs:[]} + 清 _MECH_MEMO）');
const SAVED = E.mechLib;
E.mechLib = { mechs: [] }; clearMemo();
chk('G1 mechOn() === false（缺 mechLib → 机制层整体退出）', mechOn() === false, 'mechOn=' + mechOn());
chk('G2 mechByMove(512) 为空（清 memo 后不残留命中）', sandbox.mechByMove(512).length === 0, 'len=' + sandbox.mechByMove(512).length);
let gOk = true, gErr = '';
try { sandbox.renderCore(ditto); } catch (e) { gOk = false; gErr = String(e); }
const nh = byId('coreOut')._html;
chk('G3 置空后重渲染无崩溃', gOk && nh.length > 0, gOk ? ('len=' + nh.length) : gErr);
chk('G4 降级后无机制区块/徽标残留（mechsec / badge-mech / 机制解读 全空）', !/mechsec/.test(nh) && !/badge-mech/.test(nh) && nh.indexOf('机制解读') < 0, 'mechsec=' + /mechsec/.test(nh) + ' badge=' + /badge-mech/.test(nh));
/* v4.9 行为不变（独立断言集） */
let gPass = 0, gTotal = 0;
function gchk(cond){ gTotal++; if (cond) gPass++; return cond; }
const NLIST = ['百变怪', '妙蛙花', '沙奈朵', '大比鸟', '护城龙', '洛奇亚', '皮卡丘', '喷火龙'];
let renderFail = [];
NLIST.forEach(n => {
  const s = spByZh(n); if (!s) { renderFail.push(n + ':missing'); return; }
  let h = ''; try { sandbox.renderCore(s); h = byId('coreOut')._html; } catch (e) { renderFail.push(n + ':throw'); return; }
  gchk(h.length > 0);
  gchk(h.indexOf('定位判断') > -1);
  gchk(h.indexOf('选招依据') > -1);
  gchk(h.indexOf('天气 / 场地数值') > -1);
  gchk(h.indexOf('弱点（天性口径）') > -1);
  gchk(!/mechsec/.test(h) && !/badge-mech/.test(h) && h.indexOf('机制解读') < 0);
});
chk('G5 v4.9 渲染行为不变：' + NLIST.length + ' 只 × 6 断言 = ' + gTotal + ' 条全 PASS（无崩溃/无机制残留）', gTotal === NLIST.length * 6 && gPass === gTotal && renderFail.length === 0, 'pass=' + gPass + '/' + gTotal + ' renderFail=' + JSON.stringify(renderFail));
/* 数据契约不受影响 */
gchk((function(){ const b = sandbox.deriveBuilds(spByZh('妙蛙花')); return b.length > 0; })());
gchk(sandbox.WCONF.boost === 0.5);
chk('G6 降级下核心数据契 contract 保持（deriveBuilds/WCONF 不变）', gPass === gTotal, 'pass=' + gPass + '/' + gTotal);
E.mechLib = SAVED; clearMemo();
chk('G7 恢复 mechLib 后机制层可复现（mechOn()===true 且 512 命中还原）', mechOn() === true && sandbox.mechByMove(512).length === 1, 'mechOn=' + mechOn() + ' m512=' + sandbox.mechByMove(512).length);

/* =========================================================
   §H  移动端 360px CSS
   ========================================================= */
hdr('§H 移动端 360px CSS 断言');
{
  let bad = 0; const widths = [];
  (FULLHTML.match(/style="[^"]*"/g) || []).forEach(a => { let m; const r = /(?:^|[;\s])width:\s*(\d{2,4})px/g; while ((m = r.exec(a))) { if (+m[1] > 360) { bad++; widths.push(m[1]); } } });
  chk('H1 无内联 style 固定宽度 >360px（360px 不引入横向滚动）', bad === 0, 'bad=' + bad + ' ' + JSON.stringify(widths.slice(0, 8)));
}
chk('H2 移动端断点 @media (max-width:640px) 在位', (FULLHTML.match(/@media \(max-width:640px\)/g) || []).length >= 1, 'count=' + (FULLHTML.match(/@media \(max-width:640px\)/g) || []).length);
chk('H3 -webkit-text-size-adjust:100% 在位', /-webkit-text-size-adjust:100%/.test(FULLHTML), '');
chk('H4 触控目标 min-height:44px ≥5 处', (FULLHTML.match(/min-height:44px/g) || []).length >= 5, 'count=' + (FULLHTML.match(/min-height:44px/g) || []).length);
chk('H5 返回栏 .corebackbar flex-wrap:wrap（窄屏换行，无固定宽）', /\.corebackbar\{display:flex; align-items:center; gap:8px; flex-wrap:wrap/.test(FULLHTML), '');
chk('H6 机制区块就地展开（details.mechdet，非浮层/抽屉；mech 区无 position:fixed）', /\.mechdet\{/.test(FULLHTML) && !/\.mech(?:det|sec)[^{]*\{[^}]*position:fixed/.test(FULLHTML), '');
chk('H7 机制组合表格置于 .scroll 且 CSS 有 overflow-x:auto（窄屏表内滚动）', dittoHtml.indexOf('<div class="scroll">') > -1 && /overflow-x:\s*auto/.test(FULLHTML), '');
chk('H8 机制折叠块触控高度 .mechdet>summary min-height:44px', /\.mechdet>summary\{[^}]*min-height:44px/.test(FULLHTML), '');

/* =========================================================
   §I  token 扫描
   ========================================================= */
hdr('§I token 扫描（玩家可见渲染面）');
const face = dittoHtml + sandbox.mechCoreHtml(ditto, { moves: [512] });
[['<production>', /<production>/], ['undefined', /undefined/], ['[object Object]', /\[object Object\]/],
 ['NaN', /\bNaN\b/], ['mech_lib', /mech_lib/], ['build_tool', /build_tool/], ['nn_data', /nn_data/],
 ['imposter_anchor', /imposter_anchor/], ['rewrite', /\brewrite\b/]].forEach(([t, re]) => {
  chk('I1 渲染面无内部标记「' + t + '」', !re.test(face), 'count=' + (face.match(new RegExp(re.source, 'g')) || []).length);
});
/* 配合对象显示名完整性（数据层缺口探测） */
{
  const refItems = new Set(), hashEdges = [];
  ALL.forEach(m => {
    ((m.match || {}).items || []).forEach(i => refItems.add(String(i)));
    (m.combos || []).forEach(cb => {
      const w = cb.with || {}; if (w.kind === 'item') (w.ids || []).forEach(i => refItems.add(String(i)));
      const ci = (cb.cond || {}).item; if (ci) ci.forEach(i => refItems.add(String(i)));
      if (w.kind === 'item') (w.ids || []).forEach(id => { const z = String(sandbox.mechObjZh('item', id)); if (z.charAt(0) === '#') hashEdges.push(m.id + ':' + id + '→' + z); });
    });
  });
  const badZh = [];
  [...refItems].forEach(id => { const z = String(sandbox.mechItemZh2(id)); if (!z || z.charAt(0) === '#') badZh.push(id + '→' + (z || '(空)')); });
  const hh = E.species.filter(s => learnOf(s).indexOf(512) > -1)[0];
  const faceHtml = hh ? sandbox.mechCoreHtml(hh, { moves: [512] }) : '';
  const faceHash = [...new Set((faceHtml.match(/#\d{1,4}(?![0-9a-fA-F])/g) || []))];   /* hex 色值用 lookahead 排除 */
  chk('I2 机制引用的道具显示名完整（无 "#id" 回退）且渲染面无内部编号',
    badZh.length === 0 && faceHash.length === 0,
    '引用道具=' + refItems.size + ' 回退道具=' + JSON.stringify(badZh) + ' 渲染面#id=' + JSON.stringify(faceHash));
  if (badZh.length) note('I2 根因：ERDATA.items 中 339 Flying Gem / 352 Heavy-Duty Boots 的 zh 为空串 → mechItemZh2 回落 "#id"（与同层 mechBadgeForItem 注释「缺失回落 en」自相矛盾）；受影响 combo 边 ' + JSON.stringify(hashEdges) + '；并经 prem 文案「需携带 #id」路径二次暴露。属数据层既有缺口（' + E.items.filter(x => !x[2] || !String(x[2]).trim()).length + '/' + E.items.length + ' 项无中文名），非 v4.10 引擎回归。');
  note('杂技页（' + (hh ? hh.zh : 'n/a') + '）机制区块 "#id" 实测：' + JSON.stringify(faceHash) + '；prem 文案路径命中=' + /需携带 #\d+/.test(faceHtml));
}
/* 全脚本级（含注释）信息性扫描 */
['<production>', 'production', '种族值低'].forEach(t => {
  chk('I3 内嵌脚本全文无「' + t + '」', script.indexOf(t) < 0, 'count=' + (script.split(t).length - 1));
});
note('内嵌脚本注释层含内部文件名引用：build_tool?×' + (script.split('build_tool').length - 1) + '、nn_data×' + (script.split('nn_data').length - 1) + '、mech_lib_v410×' + (script.split('mech_lib_v410').length - 1) + '（仅 view-source 可见，渲染面 0；与 v4.9 axis_lib 注释同惯例）。');

/* =========================================================
   汇总
   ========================================================= */
console.log('\n================ v4.10 回归与探针 汇总 ================');
console.log('PASS=' + pass + '  FAIL=' + fail);
if (fails.length) { console.log('FAIL 清单：'); fails.forEach(f => console.log('  - ' + f)); }
console.log('NOTE ' + notes.length + ' 条：'); notes.forEach(n => console.log('  · ' + n));
process.exitCode = fail ? 1 : 0;
