// 确认岩石/冰的中文属性名与 MV 字段
const H = require('./harness.js');
const { MV } = H;
// 找一个岩石招、一个冰招
[247, 58].forEach(function (id) {
  const r = MV[id];
  console.log('#' + id, r[2], 'type field [3]=', r[3], 'category [4]=', r[4]);
});
// 列出所有出现过的属性名
const types = {};
Object.keys(MV).forEach(function (k) { const t = MV[k][3]; if (t) types[t] = (types[t] || 0) + 1; });
console.log(Object.keys(types).join(','));
