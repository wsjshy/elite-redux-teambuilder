// 看能力表真实条目样貌
const H = require('./harness.js');
const { ERDATA } = H;
[1, 2, 50, 100, 500, 900, 1000, 1033].forEach(function (i) {
  console.log(i, JSON.stringify(ERDATA.abilities[i]));
});
// 统计中文名非占位的数量
let real = 0;
ERDATA.abilities.forEach(function (a) {
  if (a[1] && !/^-+$/.test(a[1])) real++;
});
console.log('中文名非占位数量:', real, '/', ERDATA.abilities.length);
