// 本版命中豁免表（v4.394 + v4.395 合并版）：key = `${物种id}[${卡序}]`
// v4.394 命中（名含强化清场但四招无强化招）：允许 name / role / alloc / nat 变化（role 回写会重算 EV 与性格）
// v4.395 命中（卡内带手动天气招）：允许 name / ids 变化（删天气招补槽 + 去雨晴沙雪前缀）
// 其余任何字段仍按各 verify 原口径严格判定。
const A394 = require('./_v4394_allow.json');
const P395 = require('./_v4395_plan.json');
const B395 = require('./_v4395b_hit.json');
const M = {};
function add(k, fs) { const o = M[k] || (M[k] = {}); fs.forEach(f => { o[f] = 1 }); }
(A394.six || []).forEach(r => add(r.id + '[' + r.idx + ']', ['name', 'role', 'alloc', 'nat']));
(A394.empty || []).forEach(r => add(r.id + '[' + r.idx + ']', ['name', 'role', 'alloc', 'nat']));
(P395.six || []).forEach(r => add(r.id + '[' + r.idx + ']', ['name', 'ids']));
(P395.empty || []).forEach(r => add(r.id + '[' + r.idx + ']', ['name', 'ids']));
(B395.six || []).forEach(r => add(r.id + '[' + r.idx + ']', ['name', 'ids']));
(B395.empty || []).forEach(r => add(r.id + '[' + r.idx + ']', ['name', 'ids']));
module.exports = {
  allowOf: function (k) { return M[k] || null },
  size: Object.keys(M).length
};
