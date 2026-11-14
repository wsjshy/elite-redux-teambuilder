// 检查 harness MV 表的 id 范围与缺口
const H = require('./harness.js');
const { MV } = H;
const ids = Object.keys(MV).map(Number).sort(function (a, b) { return a - b; });
console.log('MV 条目数:', ids.length);
console.log('最小 id:', ids[0], '最大 id:', ids[ids.length - 1]);
// 找 1020-1041 区间哪些缺失
const present = {};
ids.forEach(function (i) { present[i] = true; });
const missing = [];
for (let i = 1020; i <= 1041; i++) { if (!present[i]) missing.push(i); }
console.log('1020-1041 缺失:', missing.join(','));
// 打印 1025-1041 存在的
for (let i = 1025; i <= 1041; i++) { if (present[i]) console.log(i, MV[i][2], MV[i][1]); }
