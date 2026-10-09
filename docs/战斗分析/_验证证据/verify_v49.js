/* v4.9 断言组：阶段 1（多方案切换框架 / 核心思路横幅 / 环境威胁榜 / 对位预警）
   + 阶段 2（协同轴引擎：轴检测三态 / 轴需求前置 / 轴协同维度 / 轴方案卡 / 每轴 1 例核心实测）
   前置：D:\game\elite-redux\_chk_script_1.js（extract_script.js 从最新 HTML 提取）
   基线：v1 216 + v4 285 + v48 32 = 533 PASS（不得下降） */
const fs = require('fs'), vm = require('vm');
const ER = 'D:\\game\\elite-redux\\';
const script = fs.readFileSync(ER + '_chk_script_1.js', 'utf8');
const html = fs.readFileSync(ER + '配招助手_ER.html', 'utf8');
const axisRaw = JSON.parse(fs.readFileSync(ER + 'nn_data\\axis_lib.json', 'utf8'));
const htmlV48 = fs.readFileSync(ER + 'index.html', 'utf8');   /* v4.8 态（本轮尚未同步）→ 存档解析器逐字比对基准 */
/* 平衡花括号取函数体（存档解析器「逐字未改」强证据） */
function fnBody(src, name) {
  const i = src.indexOf('function ' + name + '(');
  if (i < 0) return null;
  const s = src.indexOf('{', i); if (s < 0) return null;
  let d = 0;
  for (let k = s; k < src.length; k++) {
    const c = src[k];
    if (c === '{') d++;
    else if (c === '}') { d--; if (d === 0) return src.slice(i, k + 1); }
  }
  return null;
}

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
const axOptsOf = (core, axId) => {
  const v = (S.axisVariantsOf(core) || []).filter(x => x.id === 'ax_' + axId)[0];
  return v ? v.opts.axis : null;
};
const okSp = s => s && s.base && (s.base[0] + s.base[1] + s.base[2] + s.base[3] + s.base[4] + s.base[5]) > 0;
const coresForAxis = ax => {
  const set = ax['轴手判定'] || {}, abr = ax['受益者判定'] || {}, out = [];
  const push = s => { if (s && out.indexOf(s) < 0) out.push(s) };
  const names = s => (s.abis || []).concat(s.inns || []);
  [].concat(set.ability_tags || [], abr.ability_tags || []).forEach(n =>
    E.species.filter(x => okSp(x) && names(x).indexOf(n) > -1).slice(0, 10).forEach(push));
  [].concat(set.moves || [], abr.moves || []).forEach(n => {
    const id = S.mvIdByZhOrEn(n); if (id == null) return;
    E.species.filter(x => okSp(x) && S.learnC(x).indexOf(Number(id)) > -1).slice(0, 10).forEach(push);
  });
  return out;
};
const axOptsDirect = (core, ax) => {
  const st = S.axisStateOf(core, ax);
  return { id: ax.id, name: ax.name, role: (st.setter ? '轴手' : (st.abuser ? '受益者' : '联防件')),
    idea: '（轴引擎直供测试）', state: { setter: st.setter, abuser: st.abuser, glue: st.glue, sysMatch: st.sysMatch },
    winline: ax['联动说明'], weakness: ax['弱点体系'].slice(0, 2), basis: (ax['依据'] || []).slice(0, 3), why: st.why };
};

/* ================= 阶段 1-A：多方案切换框架 ================= */
hdr('v4.9 阶段 1-A 多方案切换框架（互斥视图 · 懒渲染 · 状态保留）');
chk('A1 PLAN_VARIANTS 存在且含 std/tight/full 三态（≥3 套风格化变体）',
  Array.isArray(S.PLAN_VARIANTS) && S.PLAN_VARIANTS.length >= 3 &&
  ['std', 'tight', 'full'].every(k => S.PLAN_VARIANTS.some(v => v.id === k)),
  (S.PLAN_VARIANTS || []).map(v => v.id).join('/'));
chk('A2 planVariantList(妙蛙花) ≥4 套（3 基础 + 轴方案，轴数据落盘后自动追加）',
  S.planVariantList(spByZh('妙蛙花'), null).length >= 4,
  'n=' + S.planVariantList(spByZh('妙蛙花'), null).length + ' ids=' + S.planVariantList(spByZh('妙蛙花'), null).map(v => v.id).join('/'));
chk('A3 多方案容器：renderPlanSet 输出 #planSet_<id> / #planBar_<id> / #planSetBody_<id>（id 带核心后缀，无裸 id）',
  (() => { const h = S.renderPlanSet(spByZh('妙蛙花')); return h.indexOf('id="planSet_3"') > -1 && h.indexOf('id="planBar_3"') > -1 && h.indexOf('id="planSetBody_3"') > -1 && h.indexOf('id="planSet"') < 0; })());
chk('A4 切换按钮走 planSetShow(coreId,k)（事件委托安全：非 JSON.stringify 内联拼接）',
  /onclick="planSetShow\(\d+,\d+\)"/.test(S.renderPlanSet(spByZh('妙蛙花'))) && !/onclick="planSetShow\([^)]*JSON/.test(S.renderPlanSet(spByZh('妙蛙花'))));
chk('A5 切换=纯视图切换：planSetShow 只替换 #planSetBody_ / #planBar_，不触碰候选屏与任何输入控件',
  (() => { const src = S.planSetShow.toString(); return src.indexOf('planSetBody_') > -1 && src.indexOf('planBar_') > -1 && !/corePickWrap|coreSearch|coreFinal|\.value\s*=/.test(src); })(), S.planSetShow.toString().length + ' B');
chk('A6 懒渲染：容器内默认只有当前方案（方案①/②…不同时渲染 → 首屏轻量）',
  (() => { const h = S.renderPlanSet(spByZh('妙蛙花')); const n = (h.match(/id="teamPlan_/g) || []).length; return n === 1; })(), 'teamPlan 卡片数=1');
chk('A7 方案序号按核心记忆：PLAN_VAR 写入后可回读（planVarOf 与 PLAN_VAR 一致）',
  (() => { S.planVarOf(3); const before = S.planVarOf(3); S.PLAN_VAR['3'] = 2; const after = S.planVarOf(3); S.PLAN_VAR['3'] = 0; return typeof before === 'number' && after === 2; })(), 'memory=' + JSON.stringify(S.PLAN_VAR));
chk('A8 方案①（vi=0）与不传 vi 内容一致（仅池卡 DOM 序号 nd# 递增，属既有 v4.8 计数行为）',
  (() => { const N = h => h.replace(/nd\d+/g, 'nd#'); return N(S.renderNeedPlan(spByZh('妙蛙花'))) === N(S.renderNeedPlan(spByZh('妙蛙花'), 0)); })());
chk('A9 变体确实改变构建参数：紧凑核心队 ≤4 只、满编六只 = 6 只（同一核心）',
  (() => {
    const s = spByZh('土王'), L = S.planVariantList(s, null);
    const iT = L.findIndex(v => v.id === 'tight'), iF = L.findIndex(v => v.id === 'full');
    const t = S.buildTeamByNeeds(s, L[iT].opts), f = S.buildTeamByNeeds(s, L[iF].opts);
    return t.team.length <= 4 && f.team.length === 6 && teamIds(t) !== teamIds(f);
  })(), '→ ' + (() => { const s = spByZh('土王'), L = S.planVariantList(s, null); return 'tight=' + teamIds(S.buildTeamByNeeds(s, L.find(v => v.id === 'tight').opts)) + ' full=' + teamIds(S.buildTeamByNeeds(s, L.find(v => v.id === 'full').opts)); })());
chk('A10 目标规模参数按方案覆写不破坏默认（opts 缺省 → teamTarget()/teamMultiMax()）',
  (() => { const p = S.buildTeamByNeeds(spByZh('妙蛙花')); return p.target === S.teamTarget() && p.multiMax === S.teamMultiMax(); })(), 'target=' + S.buildTeamByNeeds(spByZh('妙蛙花')).target);

/* ================= 阶段 1-B：核心思路横幅 / 环境威胁榜 / 对位预警 ================= */
hdr('v4.9 阶段 1-B 核心思路横幅 · 环境威胁榜 · 方案级对位预警');
const ideaHtml = S.renderNeedPlan(spByZh('妙蛙花'));
chk('B1 方案卡顶部「核心思路」横幅（一句话；含方案名 + 体系 + 角色/侧向）',
  /<b>核心思路<\/b>/.test(ideaHtml) && /标准需求驱动/.test(ideaHtml) && ideaHtml.indexOf('ideabar') > -1,
  (ideaHtml.match(/<b>核心思路<\/b>：[^<]{0,90}/) || [''])[0]);
chk('B2 coreIdeaOf 输出玩家可读、无内部编号（无 v4./v45/v433 等调试痕迹）',
  !/v4\.|v45|v433|v432|v44/.test(S.coreIdeaOf(spByZh('妙蛙花'), planNoop(), 0, S.planVariantList(spByZh('妙蛙花'), null))));
function planNoop() { return S.buildTeamByNeeds(spByZh('妙蛙花')); }
chk('B3 环境威胁榜渲染：≥6 类威胁 + 可学率徽标 + 代理口径说明 + 代表物种（可点跳详情）',
  (() => {
    const h = S.threatBoardHtml();
    const names = S.THREAT_LIB.filter(t => h.indexOf(t.name) > -1).length;
    return names >= 6 && /可学率/.test(h) && /代理口径/.test(h) && /openSpById\(/.test(h) && /threatPriorLine|使用率/.test(h) === false ? (names >= 6 && /可学率/.test(h) && /代理口径/.test(h) && /openSpById\(/.test(h)) : (names >= 6 && /可学率/.test(h) && /代理口径/.test(h) && /openSpById\(/.test(h));
  })(), '威胁类命中=' + S.THREAT_LIB.filter(t => S.threatBoardHtml().indexOf(t.name) > -1).length);
chk('B4 threatShare 代理口径可复算（每类 0..100 或 null）',
  S.THREAT_LIB.every(t => { const v = S.threatShare(t); return v === null || (v >= 0 && v <= 100); }),
  S.THREAT_LIB.slice(0, 4).map(t => t.name + '=' + S.threatShare(t)).join(' '));
chk('B5 威胁榜写入 #thrBoardCore 且默认收起（details 无 open 属性；点开才见全文）',
  (() => { S.drawThreatBoard(); const h = byId('thrBoardCore')._html; return /<details/.test(h) && h.indexOf('<details open') < 0; })(),
  'len=' + byId('thrBoardCore')._html.length);
chk('B6 HTML 结构：#thrBoardCore 容器存在于核心详情容器内（且在 #coreOut 之前 → 方案仍置顶可见）',
  (() => { const iB = html.indexOf('id="thrBoardCore"'), iO = html.indexOf('id="coreOut"'); return iB > -1 && iO > iB; })());
chk('B7 corePhase(\'detail\') 触发 drawThreatBoard（详情阶段渲染威胁榜）',
  /drawThreatBoard\(\)/.test(S.corePhase.toString()));
chk('B8 方案级对位预警：四类缺口逐条判定，命中时输出「被 X 体系克制 n 只 → 建议 Y」',
  (() => {
    const cores = ['妙蛙花', '土王', '凤王', '煤炭龟', '护城龙', '班基拉斯', '坚果哑铃', '雷电云'].map(spByZh).filter(Boolean);
    const hs = cores.map(s => S.planThreatWarnHtml(S.buildTeamByNeeds(s)));
    const hit = hs.filter(h => /被 <b>[^<]+<\/b> 克制 <b>\d+<\/b> 只 → 建议/.test(h));
    const allOk = hs.every(h => /对位预警/.test(h) && (/被 <b>[^<]+<\/b> 克制 <b>\d+<\/b> 只 → 建议/.test(h) || /未命中可判定的对位缺口/.test(h)));
    return allOk && hit.length >= 1;
  })(), (() => {
    const cores = ['妙蛙花', '土王', '凤王', '煤炭龟', '护城龙', '班基拉斯', '坚果哑铃', '雷电云'].map(spByZh).filter(Boolean);
    const hs = cores.map(s => [s.zh, S.planThreatWarnHtml(S.buildTeamByNeeds(s))]);
    const hit = hs.filter(x => /被 <b>/.test(x[1]));
    return '命中缺口=' + hit.length + '/' + hs.length + (hit[0] ? ' 例:' + hit[0][0] + ' → ' + (hit[0][1].match(/被 <b>[^<]+<\/b> 克制 <b>\d+<\/b> 只[^；]*；建议 [^<]*/) || [''])[0].slice(0, 120) : '') + '｜如实为「无缺口」的核心: ' + hs.filter(x => !/被 <b>/.test(x[1])).map(x => x[0]).join('/');
  })());
chk('B9 预警出现在方案卡渲染面（renderNeedPlan 输出含对位预警）', /对位预警/.test(S.renderNeedPlan(spByZh('妙蛙花'))));
chk('B10 零负向文案：方案卡渲染面不含「已排除/硬排除/红框/体系互斥/被剔除」等强制规则表述（正向说明「不剔除 / 否决 ≠ 剔除」允许）',
  (() => {
    const cores = ['妙蛙花', '土王', '凤王', '煤炭龟', '护城龙'].map(spByZh).filter(Boolean);
    return cores.every(s => !/硬排除|已排除|红框|体系互斥|被剔除|一律剔除|直接剔除/.test(S.renderNeedPlan(s)));
  })(), (() => {
    const cores = ['妙蛙花', '土王', '凤王', '煤炭龟', '护城龙'].map(spByZh).filter(Boolean);
    const hits = [];
    cores.forEach(s => { const h = S.renderNeedPlan(s); ['硬排除', '已排除', '红框', '体系互斥', '被剔除'].forEach(tk => { if (h.indexOf(tk) > -1) hits.push(s.zh + ':' + tk); }); });
    return hits.join(',') || '无命中';
  })());

/* ================= 阶段 2-A：轴知识库 + 三态判定 + 协同维度 ================= */
hdr('v4.9 阶段 2-A 协同轴：契约 · 三态判定 · 滚动消费');
chk('C1 AXIS_LIB 内嵌且字段齐备（id/name/轴手判定/受益者判定/联动说明/弱点体系/依据）',
  S.axisLib().length === axisRaw.length && S.axisLib().every(a => a.id && a.name && a['轴手判定'] && a['受益者判定'] && a['联动说明'] && Array.isArray(a['弱点体系']) && Array.isArray(a['依据'])),
  S.axisLib().length + ' 条轴：' + S.axisLib().map(a => a.id).join('/'));
chk('C2 AXIS_SYS 把轴映射到引擎体系键（FIELD_SYS 口径：雨/晴/沙/雪/电场/…场地）',
  S.AXIS_SYS.rain === '雨' && S.AXIS_SYS.sun === '晴' && S.AXIS_SYS.sand === '沙' && S.AXIS_SYS.snow === '雪' && S.AXIS_SYS.e_terrain === '电场' && S.AXIS_SYS.psychic === '精神场地');
chk('C3 数据层新字段消费：ERDATA.tacticRole / ERDATA.synergyRole 存在且被引擎读取',
  (() => {
    const t = S.mvTacticTags(14), a = S.abiSynergyTags(33);
    return !!E.tacticRole && !!E.synergyRole && t.length > 0 && a.length > 0;
  })(), 'mv14=' + JSON.stringify(S.mvTacticTags(14)) + ' abi33=' + JSON.stringify(S.abiSynergyTags(33)));
chk('C4 精灵标签聚合：spTacticTags（招式打法标签）/ spSynergyTags（特性协同标签）非空且去重',
  (() => { const s = spByZh('妙蛙花'); const t = S.spTacticTags(s), y = S.spSynergyTags(s); return t.length > 0 && y.length > 0 && new Set(t).size === t.length; })(),
  '妙蛙花 tactic=' + JSON.stringify(S.spTacticTags(spByZh('妙蛙花')).slice(0, 4)) + ' synergy=' + JSON.stringify(S.spSynergyTags(spByZh('妙蛙花')).slice(0, 4)));
chk('C5 axisStateOf 三态判定结构完整（setter/abuser/glue/sysMatch/viable + why 可溯源）',
  (() => { const st = S.axisStateOf(spByZh('妙蛙花'), S.axisById('sun')); return st && typeof st.setter === 'boolean' && typeof st.abuser === 'boolean' && typeof st.glue === 'boolean' && typeof st.sysMatch === 'boolean' && Array.isArray(st.why); })(),
  JSON.stringify((() => { const st = S.axisStateOf(spByZh('妙蛙花'), S.axisById('sun')); return { sysMatch: st.sysMatch, setter: st.setter, abuser: st.abuser, glue: st.glue, why: st.why }; })()));
chk('C6 晴天核心（妙蛙花·叶绿素）被判为晴轴受益者/体系内（sysMatch 或 abuser = true）',
  (() => { const st = S.axisStateOf(spByZh('妙蛙花'), S.axisById('sun')); return st.sysMatch || st.abuser; })());
chk('C7 axisSyncOf 正向加分：晴轴对妙蛙花 >0 且 why 含轴名与依据；无关轴返回 null（不虚加分）',
  (() => { const a = S.axisSyncOf(spByZh('妙蛙花'), S.axisById('sun')); const b = S.axisSyncOf(spByZh('妙蛙花'), S.axisById('rain')); return a && a.pts > 0 && /晴/.test(a.why) && /依据/.test(a.why) && b === null; })(),
  JSON.stringify((() => { const a = S.axisSyncOf(spByZh('妙蛙花'), S.axisById('sun')); return a ? a.pts : null; })()));
chk('C8 轴需求复用既有求值器（AXIS_KIND_SPEC 全部键存在于 NEED_KINDS → 零新门）',
  (() => { const ks = Object.keys(S.AXIS_KIND_SPEC).reduce((a, id) => a.concat(S.AXIS_KIND_SPEC[id].map(p => p[0])), []); return ks.every(k => !!S.NEED_KINDS[k]); })(),
  Object.keys(S.AXIS_KIND_SPEC).length + ' 轴 / kinds=' + [...new Set(Object.keys(S.AXIS_KIND_SPEC).reduce((a, id) => a.concat(S.AXIS_KIND_SPEC[id].map(p => p[0])), []))].join(','));
chk('C9 axisVariantsOf：最多 3 套轴方案，每套含 opts.axis{id,name,role,idea,weakness,basis} + 标签命名=轴名·角色',
  (() => { const vs = S.axisVariantsOf(spByZh('妙蛙花')); return vs.length >= 1 && vs.length <= 3 && vs.every(v => v.opts.axis && v.opts.axis.name && v.opts.axis.role && /轴|受益|联防/.test(v.opts.axis.role) && v.name.indexOf('·') > -1); })(),
  S.axisVariantsOf(spByZh('妙蛙花')).map(v => v.name).join(' | '));

/* ================= 阶段 2-B：轴方案构建（轴需求前置 · 协同计入 · 弱点预警） ================= */
hdr('v4.9 阶段 2-B 轴方案：需求前置 · 零硬门 · 协同高亮 · 弱点预警');
chk('D1 轴方案构建：plan.axis 回传 + 首条需求为轴需求（axisNeed=true，id=A-xx 或基础需求被前置）',
  (() => {
    const s = spByZh('妙蛙花'), ax = axOptsOf(s, 'sun'); if (!ax) return false;
    const p = S.buildTeamByNeeds(s, { axis: ax });
    return !!p.axis && p.axis.id === 'sun' && p.needs.length > 0 && p.needs[0].axisNeed === true && /^(A|N)-\d\d$/.test(p.needs[0].id);
  })(), (() => { const s = spByZh('妙蛙花'), ax = axOptsOf(s, 'sun'); if (!ax) return 'no axis variant'; const p = S.buildTeamByNeeds(s, { axis: ax }); return p.needs.slice(0, 5).map(n => n.id + ':' + n.kind + '(' + n.priority + ')').join(' '); })());
chk('D2 轴需求去重正确：A- 新轴需求的 kind 不与基础清单重复（已在基础里的 kind 只做前置，不重复插入）',
  (() => {
    const s = spByZh('妙蛙花'), ax = axOptsOf(s, 'sun'); if (!ax) return false;
    const p = S.buildTeamByNeeds(s, { axis: ax });
    const nIds = p.needs.filter(n => /^N-/.test(n.id)), aIds = p.needs.filter(n => /^A-/.test(n.id));
    const nKinds = nIds.map(n => n.kind);
    return aIds.every(n => nKinds.indexOf(n.kind) < 0) && p.needs.filter(n => n.axisNeed).length >= 1;
  })(), (() => { const s = spByZh('妙蛙花'), ax = axOptsOf(s, 'sun'); if (!ax) return ''; const p = S.buildTeamByNeeds(s, { axis: ax }); return '轴需求=' + p.needs.filter(n => /^A-/.test(n.id)).map(n => n.id + ':' + n.kind).join(',') + ' | 前置(axisNeed)= ' + p.needs.filter(n => n.axisNeed).map(n => n.id + ':' + n.kind + '(' + n.priority + ')').join(','); })());
chk('D3 轴内协同显式计入：轴方案至少 1 名成员带「轴协同(AX)」维度（含分值 + 依据说明）',
  (() => {
    const s = spByZh('妙蛙花'), ax = axOptsOf(s, 'sun'); if (!ax) return false;
    const p = S.buildTeamByNeeds(s, { axis: ax });
    let hit = 0, txt = '';
    p.team.forEach(m => (m.dims || []).forEach(d => { if (d.id === 'AX') { hit++; txt = d.txt || ''; } }));
    return hit > 0 && /轴协同/.test(txt) && /依据/.test(txt);
  })(), (() => { const s = spByZh('妙蛙花'), ax = axOptsOf(s, 'sun'); if (!ax) return ''; const p = S.buildTeamByNeeds(s, { axis: ax }); let t = ''; p.team.forEach(m => (m.dims || []).forEach(d => { if (d.id === 'AX' && !t) t = d.txt; })); return t.slice(0, 80); })());
chk('D4 零硬门：轴方案候选池不因「非同轴」被裁剪（排他门会显著缩小池 → 池宽须与全图鉴同量级）',
  (() => {
    const s = spByZh('妙蛙花'), ax = axOptsOf(s, 'sun'); if (!ax) return false;
    const wOf = p => Math.max.apply(null, Object.keys(p.pools).map(k => { const x = p.pools[k]; return (x.all || x.list || []).length; }).concat([0]));
    const p = S.buildTeamByNeeds(s, { axis: ax });
    const w = wOf(p), stdW = wOf(S.buildTeamByNeeds(s));
    chk.detailD4 = '轴池最大宽=' + w + ' 标准池最大宽=' + stdW + ' 需求数=' + Object.keys(p.pools).length;
    return w >= 100 && w >= stdW * 0.9;
  })(), chk.detailD4);
chk('D5 轴方案卡渲染：协同轴 + 一句话赢法 + 关键协同（精灵图/可点）+ 弱点预警 + 依据',
  (() => {
    const s = spByZh('妙蛙花'), L = S.planVariantList(s, null), i = L.findIndex(v => v.id === 'ax_sun');
    if (i < 0) return false;
    const h = S.renderNeedPlan(s, i);
    return /协同轴/.test(h) && /一句话赢法/.test(h) && /关键协同/.test(h) && /弱点预警/.test(h) && /依据：/.test(h) && /openSpById\(|暂无轴标签命中/.test(h);
  })(), (() => { const s = spByZh('妙蛙花'), L = S.planVariantList(s, null), i = L.findIndex(v => v.id === 'ax_sun'); return i < 0 ? 'no ax_sun' : 'ok vi=' + i; })());
chk('D6 弱点预警取自轴库「弱点体系」（含 threat 与 建议 两要素）',
  (() => { const ax = S.axisById('sun'); const h = S.axWeakHtml({ weakness: ax['弱点体系'].slice(0, 2) }); return /被 /.test(h) && /建议 /.test(h) && ax['弱点体系'].slice(0, 2).every(w => h.indexOf(w.threat) > -1); })(),
  (() => { const ax = S.axisById('sun'); return S.axWeakHtml({ weakness: ax['弱点体系'].slice(0, 2) }).slice(0, 100); })());
chk('D7 轴方案与标准方案不同源（方案切换确有不同队伍；非同一份复制）',
  (() => {
    const s = spByZh('妙蛙花'), ax = axOptsOf(s, 'sun'); if (!ax) return false;
    const a = S.buildTeamByNeeds(s, {}), b = S.buildTeamByNeeds(s, { axis: ax });
    return teamIds(a) !== teamIds(b);
  })(), (() => { const s = spByZh('妙蛙花'), ax = axOptsOf(s, 'sun'); if (!ax) return ''; return 'std=' + teamIds(S.buildTeamByNeeds(s, {})) + ' axis=' + teamIds(S.buildTeamByNeeds(s, { axis: ax })); })());

/* ---------- 每轴 1 例核心实测（轴正确构建 / 协同高亮 / 弱点预警） ---------- */
hdr('v4.9 阶段 2-B 每轴实测（15 轴 × 1 例核心）');
const AXROWS = [];
S.axisLib().forEach(ax => {
  const cands = coresForAxis(ax);
  /* 优先选「该轴以方案变体形态暴露给玩家」的核心；无则直供轴 opts（仍完整走轴引擎） */
  let core = null, via = 'direct';
  for (const c of cands) {
    if ((S.axisVariantsOf(c) || []).some(v => v.id === 'ax_' + ax.id)) { core = c; via = 'variant'; break; }
  }
  if (!core) core = cands[0];
  if (!core) { chk('E ' + ax.id + ' 轴：找到可用核心并完成轴方案', false, '未取到核心'); return; }
  const st = S.axisStateOf(core, ax);
  const L = S.planVariantList(core, null);
  const i = L.findIndex(v => v.id === 'ax_' + ax.id);
  const axOpts = (i >= 0) ? L[i].opts.axis : axOptsDirect(core, ax);
  let built = null, err = '';
  try { built = S.buildTeamByNeeds(core, { axis: axOpts }); } catch (e) { err = '' + e; }
  const ok = !err && !!built && !!built.axis && built.axis.id === ax.id && built.team.length >= 2 &&
    (built.needs[0] && built.needs[0].axisNeed === true) &&
    (via === 'direct' || (S.axisVariantsOf(core) || []).some(v => v.id === 'ax_' + ax.id));
  AXROWS.push({ axis: ax.id, name: ax.name, core: core.zh + '#' + core.id, via: via,
    role: (st.setter ? '轴手' : (st.abuser ? '受益者' : '联防件')), sysMatch: st.sysMatch,
    need0: built && built.needs[0] ? built.needs[0].kind : '', team: built ? teamIds(built) : '',
    n: built ? built.team.length : 0, axDim: built ? built.team.filter(m => (m.dims || []).some(d => d.id === 'AX')).length : 0,
    axPart: (built && built.axis) ? built.team.filter(m => {
      if (m.core) { const axo = S.axisById(built.axis.id); if (!axo) return false; const s2 = S.axisStateOf(m.s, axo); return !!(s2.setter || s2.abuser || s2.glue); }
      return (m.dims || []).some(d => d.id === 'AX');
    }).length : 0,
    synLine: built ? S.axSynHtml(built).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').slice(0, 44) : '',
    weak: built ? S.planThreatWarnHtml(built).replace(/<[^>]+>/g, '').slice(0, 46) : '' });
  const r = AXROWS[AXROWS.length - 1];
  chk('E ' + ax.id + '（' + ax.name + '）轴 1 例核心实测：三态判定 + 轴需求前置 + 方案构建（≥2 只）+ 协同高亮',
    ok, r.core + ' via=' + r.via + ' role=' + r.role + ' need0=' + r.need0 + ' n=' + r.n + ' 轴参与者=' + r.axPart + ' 协同高亮=' + r.synLine + (err ? ' ERR=' + err : ''));
});
chk('E-ALL 15 轴全部完成实测（覆盖完整性）', AXROWS.length === S.axisLib().length && AXROWS.every(r => r.need0 && r.n >= 2 && r.axPart >= 1 && r.synLine && !/暂无轴标签命中/.test(r.synLine)), AXROWS.length + '/' + S.axisLib().length + ' 轴有核心与方案；以方案变体暴露=' + AXROWS.filter(r => r.via === 'variant').length + '/15；协同高亮非空=' + AXROWS.filter(r => r.synLine && !/暂无轴标签命中/.test(r.synLine)).length + '/15');
console.log('\n--- 每轴实测表 ---');
AXROWS.forEach(r => console.log('  ' + r.axis.padEnd(11) + ' ' + r.name.padEnd(9) + ' 核心=' + r.core.padEnd(14) + ' 形态=' + r.via.padEnd(8) + ' 角色=' + r.role.padEnd(4) + ' 体系内=' + r.sysMatch + ' need0=' + r.need0.padEnd(8) + ' 轴参与者=' + r.axPart + ' 队伍(' + r.n + ')=' + r.team + '  高亮:' + r.synLine + '  预警:' + r.weak));

/* ================= 回归红线（v4.8 行为 · 存档解析零改动 · 数据契约） ================= */
hdr('v4.9 回归红线');
chk('R1 RULE_SHIFT 逐值零回归：RULE_SHIFT_ENABLED 默认 true、常量块与 M5 来源标注在位',
  S.RULE_SHIFT_ENABLED === true && !!S.RULE_SHIFT && !!S.RULE_SHIFT.SRC &&
  /rsTeamCard\(plan\.team\)/.test(S.renderNeedPlan.toString()),
  S.RULE_SHIFT ? ('MU=' + S.RULE_SHIFT.MU + ' SD=' + S.RULE_SHIFT.SD) : 'no RULE_SHIFT');
chk('R2 存档解析器逐字未改（对 v4.8 index.html 逐一比对存档函数体 + SAV_SIZE 常量）',
  (() => {
    const names = ['parseSavBytes', 'parseSavFile', 'scanRecords', 'decodeRotation', 'importSaveBox', 'myPoolFromSav', 'copySavCsv', 'downloadSavCsv', 'toggleCsvPanel'];
    const diffs = [], same = [];
    names.forEach(n => {
      const a = fnBody(html, n), b = fnBody(htmlV48, n);
      if (a === null || b === null) { diffs.push(n + '(缺失 new=' + (a !== null) + '/old=' + (b !== null) + ')'); return; }
      if (a === b) same.push(n); else diffs.push(n + '(' + a.length + ' vs ' + b.length + ')');
    });
    const siz = k => { const m = html.match(new RegExp(k + '\\s*=\\s*(0x[0-9A-Fa-f]+|[0-9]+)')); return m ? m[1] : null; };
    const s1 = siz('SAV_SIZE'), s2 = (h => { const m = h.match(/SAV_SIZE\s*=\s*(0x[0-9A-Fa-f]+|[0-9]+)/); return m ? m[1] : null; })(htmlV48);
    chk.detailR2 = '逐字一致=' + same.length + '/' + names.length + '（' + same.slice(0, 3).join('/') + '…）差异=' + (diffs.join(',') || '无') + ' SAV_SIZE new=' + s1 + ' old=' + s2;
    return diffs.length === 0 && same.length >= 8 && s1 === s2 && s1 !== null;
  })(), chk.detailR2);
chk('R3 数据契约零破坏：matchup 21×21 / moves 含 m[10] / abiTags 逐 id 形含 conv ≥9（含 280/659）/ matchupSp / templates ≥18',
  (() => {
    const convIds = Object.keys(E.abiTags).filter(k => E.abiTags[k] && E.abiTags[k].conv);
    chk.detailR3 = 'matchup=' + E.matchup.length + 'x' + E.matchup[0].length + ' conv=' + convIds.length + '（' + convIds.join(',') + '）tpl=' + (E.templates || []).length + ' matchupSp=' + !!E.matchupSp;
    return E.matchup.length === 21 && E.matchup.every(r => r.length === 21) && (E.moves[0].length > 10) &&
      convIds.length >= 9 && convIds.indexOf('280') > -1 && convIds.indexOf('659') > -1 &&
      !!E.matchupSp && (E.templates || []).length >= 18;
  })(), chk.detailR3);
chk('R4 生成链与产物一致性：HTML 内嵌 AXIS_LIB 与 axis_lib.json 同源（条数 + id 序列一致）',
  (() => { const inHtml = (html.match(/var AXIS_LIB=\[/) || []).length; return inHtml === 1 && S.axisLib().map(a => a.id).join(',') === axisRaw.map(a => a.id).join(','); })());
chk('R5 移动端 390×844 规格：多方案标签条/按钮 min-height ≥44px（CSS 在位）',
  /\.planbar .planv\{min-height:44px/.test(html) && /max-width:768px/.test(html) || /min-height:44px/.test(html),
  'planv 44px=' + /\.planbar .planv\{min-height:44px/.test(html));
chk('R6 无内部编号进入玩家可见渲染面（扫描 5 核心方案卡 + 威胁榜 + 流派卡命名）',
  (() => {
    const cores = ['妙蛙花', '土王', '凤王', '煤炭龟', '班基拉斯'].map(spByZh).filter(Boolean);
    const all = cores.map(s => S.renderPlanSet(s)).join('') + S.threatBoardHtml();
    return !/v4\.\d|v45-|v433|v432|v44\b|phase 1|阶段 1/.test(all);
  })());

console.log('\n================ v4.9 汇总 ================');
console.log('PASS=' + pass + '  FAIL=' + fail);
if (fails.length) { console.log('FAIL 明细：'); fails.forEach(f => console.log('  - ' + f)); }
console.log('每轴实测表（JSON）：');
console.log(JSON.stringify(AXROWS));
