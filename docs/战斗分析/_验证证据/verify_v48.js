/* v4.8 G1/G2/G3/G4 断言组（规模参数化 · 继续补位 · 死代码登记 · UI 接入）
   前置：D:\game\elite-redux\_chk_script_1.js 由 extract_script.js 从最新 HTML 提取
   基线：verify_v1.js 216 + verify_v4.js 285 = 501 PASS（v4.7 基线不降） */
const fs = require('fs'), vm = require('vm');
const ER = 'D:\\game\\elite-redux\\';
const script = fs.readFileSync(ER + '_chk_script_1.js', 'utf8');
const html = fs.readFileSync(ER + '配招助手_ER.html', 'utf8');
const RPT = fs.readFileSync(ER + 'docs\\战斗分析\\_验证证据\\引擎规模行为核查_报告.md', 'utf8');

function mkEl(id) {
  const el = {
    id: id || '', _html: '', children: [], style: {}, dataset: {}, value: '', checked: false,
    textContent: '', className: '', hidden: false, onclick: null, oninput: null, onchange: null,
    files: null, title: '', _attrs: {}, parentNode: null, nextSibling: null,
    classList: { _s: {}, add(n) { this._s[n] = 1 }, remove(n) { delete this._s[n] }, toggle(n) { this._s[n] = this._s[n] ? 0 : 1 }, contains(n) { return !!this._s[n] } },
    appendChild(c) { this.children.push(c); return c },
    removeChild(c) { const i = this.children.indexOf(c); if (i > -1) this.children.splice(i, 1) },
    setAttribute(k, v) { this._attrs[k] = String(v) },
    getAttribute(k) { return this._attrs[k] === undefined ? null : this._attrs[k] },
    querySelector() { return mkEl('') }, querySelectorAll() { return [] },
    addEventListener() { }, removeEventListener() { }, click() { }, focus() { }, select() { }, closest() { return null }
  };
  Object.defineProperty(el, 'innerHTML', { get: () => el._html, set: v => { el._html = String(v) } });
  return el;
}
const registry = {};
function byId(id) { if (!registry[id]) registry[id] = mkEl(id); return registry[id]; }
const doc = {
  getElementById: byId, createElement: () => mkEl(''), body: mkEl('body'),
  querySelector: () => null, querySelectorAll: () => [], addEventListener() { }, execCommand() { return true }
};
const sandbox = {
  console, setTimeout, clearTimeout, setInterval, clearInterval, Math, Date, JSON, Object, Array, String, Number, Boolean, RegExp, Error,
  document: doc, alert: () => { }, window: {}, navigator: { userAgent: 'node' }, location: { href: 'file:///x.html' },
  Uint8Array, Uint16Array, Uint32Array, DataView, ArrayBuffer, TextDecoder, TextEncoder,
  Blob: function () { }, URL: { createObjectURL() { return 'blob:x' }, revokeObjectURL() { } },
  FileReader: function () { }, localStorage: { getItem: () => null, setItem() { } }
};
sandbox.window = sandbox; sandbox.globalThis = sandbox;
sandbox.addEventListener = function () { }; sandbox.removeEventListener = function () { };
sandbox.scrollTo = function () { }; sandbox.innerHeight = 800; sandbox.scrollY = 0;
sandbox.getComputedStyle = function () { return {} };
vm.createContext(sandbox);
vm.runInContext(script, sandbox, { timeout: 900000 });

let pass = 0, fail = 0; const fails = [];
function chk(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS  ' + name + (detail !== undefined ? '  → ' + detail : '')); }
  else { fail++; fails.push(name + '  → ' + detail); console.log('  FAIL  ' + name + '  → ' + detail); }
}
function hdr(t) { console.log('\n=== ' + t + ' ==='); }
const S = sandbox, E = sandbox.ERDATA;
const spByZh = n => E.species.filter(s => s.zh === n)[0];
const teamIds = p => p.team.map(m => m.s.id).join(',');
const plan3 = () => S.buildTeamByNeeds(spByZh('妙蛙花'));
const html3 = () => S.renderNeedPlan(spByZh('妙蛙花'));
const html980 = () => S.renderNeedPlan(spByZh('土王'));

/* ============ G3 参数化 ============ */
hdr('v4.8 G3 产品级规模参数（TEAM_CFG / 访问器 / 映射规则）');
const T = S.TEAM_CFG;
chk('G3a TEAM_CFG 默认 = 现行为（target 6 / multiMax 2，与 NEED_CFG 同源）',
  T.target === 6 && T.multiMax === 2 && T.TARGET_MIN === 3 && T.TARGET_MAX === 6 &&
  T.target === S.NEED_CFG.MAX_TEAM && T.multiMax === S.NEED_CFG.MULTI_MAX &&
  S.teamTarget() === 6 && S.teamMultiMax() === 2, JSON.stringify(T));
chk('G3b multiMaxForTarget 映射：6→2 / 5→2 / 4→1 / 3→1',
  [6, 5, 4, 3].map(v => S.multiMaxForTarget(v)).join(',') === '2,2,1,1',
  [6, 5, 4, 3].map(v => v + '->' + S.multiMaxForTarget(v)).join(' '));
const bsrc = S.buildTeamByNeeds.toString();
chk('G3c 构建器不再硬编码（NEED_CFG.MAX_TEAM / MULTI_MAX 已无引用，旧常量按契约保留）',
  S.NEED_CFG.MAX_TEAM === 6 && S.NEED_CFG.MULTI_MAX === 2 && S.NEED_CFG.STOP_PRIORITY === 1 &&
  bsrc.indexOf('NEED_CFG.MAX_TEAM') < 0 && bsrc.indexOf('NEED_CFG.MULTI_MAX') < 0, 'builder 内已无硬编码');

/* ============ G2 默认零回归 ============ */
hdr('v4.8 G2-a 默认构建零回归（target 6 / mm 2 / fills 0）');
const p3 = plan3();
chk('G2a 妙蛙花方案与 v4.7 记录逐只一致（id 序列锚点）',
  teamIds(p3) === '3,192,1521,788,251,695' && p3.target === 6 && p3.multiMax === 2 && p3.fills === 0 && p3.stopReason === 'STOP_SIZE_LIMIT',
  teamIds(p3) + ' / ' + p3.stopReason);
const sizeCases = [['妙蛙花', 6], ['煤炭龟', 6], ['土王', 4], ['坚果哑铃', 4], ['护城龙', 5]];
const sizeGot = sizeCases.map(c => S.buildTeamByNeeds(spByZh(c[0])).team.length);
chk('G2b 规模分布与 M4 核查一致（4~6 只，无 <4）',
  sizeGot.join(',') === sizeCases.map(c => c[1]).join(','), sizeCases.map((c, i) => c[0] + '=' + sizeGot[i]).join(' '));
const warn980 = S.buildTeamByNeeds(spByZh('土王')).audit.warnings.join('|');
chk('G2c 紧凑队告警指向「继续补位」（玩家可读，不写死 6 只）',
  warn980.indexOf('继续补位') > -1 && warn980.indexOf('已满 6 只') < 0, warn980);

hdr('v4.8 G2-b 「继续补位」（非需求驱动追加）');
const p980a = S.buildTeamByNeeds(spByZh('土王'));
const p980b = S.buildTeamByNeeds(spByZh('土王'), { fill: 3 });
const fm980 = p980b.team.filter(m => m.fill);
chk('G2d 补位生效：土王 4 → 6 只（fills=2，达目标即止）',
  p980a.team.length === 4 && p980b.team.length === 6 && p980b.fills === 2 && p980b.stopReason === 'STOP_SIZE_LIMIT',
  p980a.team.length + '→' + p980b.team.length + ' fills=' + p980b.fills);
chk('G2e 补位成员契约完整（fill/kind/label/gate/dims/multi/links）',
  fm980.length === 2 && fm980.every(m => m.fill === true && m.need.kind === 'fill' &&
    m.need.label === '补位（非需求驱动）' && typeof m.gate === 'string' && m.gate.length > 0 &&
    m.dims.length > 0 && m.multi === 1 && Array.isArray(m.links) && m.links.length > 0),
  fm980.map(m => m.s.zh + '(' + m.dims.length + 'dims)').join(' '));
chk('G2f 补位不重复已用成员（used/family 双过滤），且不改需求闭合计数',
  fm980.every(m => !p980a.team.some(x => x.s.id === m.s.id)) && p980a.audit.satisfied === p980b.audit.satisfied,
  '新增 ' + fm980.map(m => m.s.id).join(',') + ' / satisfied 均 ' + p980b.audit.satisfied);
chk('G2g 补位候选池从不枯竭（fillCands 8 只含分数，供 UI/复验）',
  (p980b.fillCands || []).length === 8 && p980b.fillCands.every(x => x.s && typeof x.score === 'number'),
  (p980b.fillCands || []).slice(0, 3).map(x => x.s.zh + '(' + Math.round(x.score * 10) / 10 + ')').join(' '));
const p3fill = S.buildTeamByNeeds(spByZh('妙蛙花'), { fill: 3 });
chk('G2h 已满目标规模时补位不生效（不越界/不报错）',
  p3fill.team.length === 6 && p3fill.fills === 0 && (p3fill.fillCands || []).length === 0, '妙蛙花 fill:3 → 6 只 fills=0');

hdr('v4.8 G2-c 目标规模调小（上限收紧，正向引导）');
S.TEAM_CFG.target = 4; S.TEAM_CFG.multiMax = S.multiMaxForTarget(4);
const p3t4 = S.buildTeamByNeeds(spByZh('妙蛙花'));
const pk4 = p3t4.pools[p3t4.needs.filter(n => n.status === 'satisfied' && n.pickScore)[0].id];
const poolOk = !pk4 || (pk4.list || []).every(x => typeof x.score === 'number');
S.TEAM_CFG.target = 6; S.TEAM_CFG.multiMax = 2;
chk('G2i target=4 → 恰好 4 只 / 合并上限 ×1；候选池仍全量正向评分（零硬门）；恢复 6/2 回归默认',
  p3t4.target === 4 && p3t4.multiMax === 1 && p3t4.team.length === 4 && poolOk &&
  S.buildTeamByNeeds(spByZh('妙蛙花')).team.length === 6, 'target=4 → n=4 mm=1');

/* ============ G2-d UI ============ */
hdr('v4.8 G2-d UI 接入（选择器 / 补位按钮 / 补位标注 / 就地重渲染）');
const h3 = html3();
chk('G2j 方案卡容器 #teamPlan_<id>（无裸 id 残留，局部重渲染可定位）',
  h3.indexOf('id="teamPlan_3"') > -1 && h3.indexOf('id="teamPlan"') < 0 &&
  S.reRenderPlan.toString().indexOf('teamPlan_') > -1, '');
chk('G2k 目标规模选择器：4 个选项 + onchange → setPlanTarget + 默认选中 6',
  h3.indexOf('目标队伍规模') > -1 && h3.indexOf('class="tgtsel"') > -1 &&
  h3.indexOf('setPlanTarget(3,this.value)') > -1 &&
  (h3.match(/<option value="\d"/g) || []).length === 4 && h3.indexOf('<option value="6" selected') > -1, '');
chk('G2l 满员时显示「已达目标规模」而非补位按钮（6 只上限无位可补）',
  h3.indexOf('已达目标规模') > -1 && h3.indexOf('planFillMore(3)') < 0 && h3.indexOf('继续补位') < 0, '');
const h980 = html980();
chk('G2m 未满员时提供「继续补位」按钮（土王 4/6）',
  h980.indexOf('继续补位') > -1 && h980.indexOf('planFillMore(980)') > -1 && h980.indexOf('class="tgtsel"') > -1, '');
S.PLAN_FILL['980'] = 2;
const h980f = html980();
S.PLAN_FILL['980'] = 0;
chk('G2n 补位成员独立标注（.fillrow + 徽标 + 补位依据）+ 标题标注目标规模与补位数',
  h980f.indexOf('fillrow') > -1 && h980f.indexOf('补位（非需求驱动）') > -1 &&
  h980f.indexOf('补位依据（广义正向分') > -1 && h980f.indexOf('队伍方案（6 只 / 目标 6 只') > -1 &&
  h980f.indexOf('含手动补位 2 只') > -1, '土王 PLAN_FILL=2');
chk('G2o 玩家可见文案不含内部版本号/参数名（无 v4.x / STOP_PRIORITY / MULTI_MAX）',
  h3.indexOf('v4.') < 0 && h3.indexOf('STOP_PRIORITY') < 0 && h3.indexOf('MULTI_MAX') < 0, '');

/* ============ G4 / G1 ============ */
hdr('v4.8 G4/G1 死分支登记与评估口径登记');
chk('G4a STOP_PRIORITY 分支登记为护栏（源码含登记注释 + 常量保留 + 不可达说明）',
  script.indexOf('STOP_PRIORITY=1 时本分支在状态空间') > -1 && S.NEED_CFG.STOP_PRIORITY === 1 &&
  script.indexOf('不可达') > -1, '');
chk('G4b 停止原因文案不再写死「已满 6 只」',
  S.stopReasonZh('STOP_SIZE_LIMIT') === '已达目标规模' && script.indexOf('已满 6 只') < 0, S.stopReasonZh('STOP_SIZE_LIMIT'));
chk('G4c 构建口径文案同步（达目标规模 + 合并上限可配，不再声称满 6 只）',
  h3.indexOf('达目标规模 6 只') > -1 && h3.indexOf('可配参数') > -1 && h3.indexOf('满 6 只') < 0, '');
chk('G1 评估口径登记（报告含评测口径章节：mode A / min-size / 均值型偏置）',
  RPT.indexOf('评测口径') > -1 && RPT.length > 5000, '报告 ' + RPT.length + ' 字');

/* ============ RULE_SHIFT 零回归 ============ */
hdr('v4.8 红线：RULE_SHIFT 计算/权重零改动');
const RS = S.RULE_SHIFT;
chk('RS-a 开关 true + L1 三项逐值不变',
  S.RULE_SHIFT_ENABLED === true && RS.L1.slow === -2 && RS.L1.syscnt === 2 && RS.L1.bst === 2, JSON.stringify(RS.L1));
chk('RS-b L2 12 键逐值不变（权重/截距/尺度）', (function () {
  const L = RS.L2;
  return L.wE === -0.4031 && L.wsh === -0.034 && L.wslow === -0.8362 && L.wspd === -0.8775 && L.wsyscnt === 0.5131 &&
    L.wbst === 0.8504 && L.b0 === 0.15288 && L.eMean === 22.356 && L.eStd === 4.165126 && L.mu === 0.14355 &&
    L.sd === 0.56729 && L.mean === 22.428 && L.sdE === 4.1445;
})(), [RS.L2.wE, RS.L2.b0, RS.L2.eMean, RS.L2.sdE].join('/'));
chk('RS-c MU/SD 5 键逐值不变 + rsTeamCard 端到端 S′ 与 E 同量级',
  Object.keys(RS.MU).length === 5 && Object.keys(RS.SD).length === 5 &&
  RS.MU.slow === 0.39652951941977904 && RS.SD.bst === 85.47958129291573 &&
  Math.abs(S.rsTeamCard(p3.team).S - S.rsTeamCard(p3.team).E) <= 20,
  'E=' + S.rsTeamCard(p3.team).E.toFixed(1) + ' S′=' + S.rsTeamCard(p3.team).S.toFixed(1));
const rsSlow = S.rsL1Of(E.species.filter(s => '' + s.id === '411')[0], []);
const rsFast = S.rsL1Of(E.species.filter(s => '' + s.id === '145')[0], []);
let rsInj = 0;
Object.keys(p980a.pools).forEach(k => (p980a.pools[k].list || []).forEach(x => { if ((x.dims || []).some(d => d.id === 'RS')) rsInj++; }));
chk('RS-d 逐候选 RS 维度仍注入 needScore dims（慢速负分/高速正分 + why 含速度线）',
  !!rsSlow && rsSlow.pts < 0 && rsSlow.why.indexOf('速度线') > -1 && !!rsFast && rsFast.pts > 0 && rsInj > 0,
  '护城龙 RS=' + rsSlow.pts.toFixed(2) + ' / 闪电鸟 RS=' + rsFast.pts.toFixed(2) + ' / 注入 ' + rsInj + ' 候选');
chk('RS-e RULE_SHIFT 结构不变（MU/SD/L1/L2/W/SRC 六键）',
  ['MU', 'SD', 'L1', 'L2', 'W', 'SRC'].every(k => RS[k] !== undefined) && Object.keys(RS).length === 6, Object.keys(RS).join('/'));

/* ============ 数据契约 / 响应式 ============ */
hdr('v4.8 数据契约与响应式（红线：data.js 契约 / UI 结构不动）');
chk('CFG-a 数据契约不回归（matchupSp 非空 / usagePrior 747 / WCONF+ABI_ATE v3.23 基线）',
  !!E.matchupSp && Object.keys(E.matchupSp).length > 0 && Object.keys(E.usagePrior || {}).length === 747 &&
  S.WCONF.boost === 0.5 && S.ABI_ATE.multiplier === 1.0,
  'matchupSp 列 ' + Object.keys(E.matchupSp).length + ' / usagePrior 747');
chk('CFG-b 新增 CSS 三条入产物（.tgtsel 触控 ≥44px / .scalebar / .fillrow）',
  html.indexOf('.tgtsel{') > -1 && html.indexOf('min-height:44px') > -1 &&
  html.indexOf('.scalebar{') > -1 && html.indexOf('.fillrow{') > -1, '');
chk('CFG-c 响应式断点齐备（640px 手机 / 平板断点）+ iOS 惯性滚动',
  html.indexOf('@media (max-width:640px)') > -1 && html.indexOf('max-width:1024px') > -1 &&
  html.indexOf('-webkit-overflow-scrolling') > -1, '');
chk('CFG-d 精灵合图方案不回归（assets/sheets/ + SPR_SHEET）',
  html.indexOf('assets/sheets/') > -1 && script.indexOf('SPR_SHEET') > -1, '');
chk('CFG-e 两段式互斥视图不回归（myPhase/corePhase 状态机在位）',
  typeof S.myPhase !== 'undefined' || script.indexOf('myDetailWrap') > -1 || script.indexOf("mode:'pick'") > -1 ||
  script.indexOf('返回挑选') > -1, '');

console.log('\n================ v4.8 汇总 ================');
console.log('PASS=' + pass + '  FAIL=' + fail);
if (fail) { console.log('FAIL 明细：'); fails.forEach(f => console.log('  - ' + f)); }
