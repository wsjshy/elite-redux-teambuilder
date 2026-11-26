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
// v4.396 命中（日光束 76 / 日光刃 632 无晴源且无 chloroplast）：只换 mv 的 ids
// 注意各 verify 的豁免表达式首项恒为 'name'（式子是 ['name'].concat(实际变化字段)），
// 因此命中表必须同时放行 name 才能通过；本版实测 name 零变化，放行 name 只是格式要求。
const H396 = require('./_v4396_hit.json');
(H396.six || []).forEach(r => add(r.id + '[' + r.i + ']', ['name', 'ids']));
(H396.empty || []).forEach(r => add(r.id + '[' + r.i + ']', ['name', 'ids']));
// v4.395b 连带补救（在 v4.392 基线口径下未进 P395/B395 的 7 张）
// 去天气前缀 5 张：卡内既无对应手动天气招、所选特性也不是天气手 → 名字首字悬空，去首字后名实更准
//   186 蚊香蛙皇（物性池含降雨但未选） / 270 莲叶童子 / 271 莲帽小童 / 938 光蚪仔 / 1076 冰蛛霸（池含降雪但未选）
// 极光幕 657 换招 2 张：自身无开雪来源（997 的 269 冰天雪地=冰雹下冰招×1.5、2582 的 283 雪之精神=冰雹减伤，都不产冰雹）
//   997 冻脊龙 657→黑雾 114 / 2582 暴雪王-圣诞老人 657→光合作用 235
const DEP395B = {
  '186[1]': ['name', 'ids'], '270[0]': ['name', 'ids'], '271[0]': ['name', 'ids'],
  '938[0]': ['name', 'ids'], '1076[1]': ['name', 'ids'],
  '997[1]': ['name', 'ids'], '2582[1]': ['name', 'ids']
};
Object.keys(DEP395B).forEach(k => add(k, DEP395B[k]));
module.exports = {
  allowOf: function (k) { return M[k] || null },
  size: Object.keys(M).length
};
