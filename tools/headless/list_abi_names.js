// 列出所有消费招族的特性中文名
const H = require('./harness.js');
const { ERDATA } = H;
const ids = [176, 376, 470, 601, 390, 391, 751, 845, 907, 371, 484, 550,
  472, 642, 643, 645, 931, 449, 941, 985];
const byId = {};
ERDATA.abilities.forEach(function (a) { byId[Number(a[0])] = a; });
ids.forEach(function (id) {
  const a = byId[id];
  console.log(id, '| en=' + (a ? a[1] : '?'), '| zh=' + (a ? a[2] : '?'));
});
