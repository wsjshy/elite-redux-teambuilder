// 按中文模糊查相关特性
const H = require('./harness.js');
const { ERDATA } = H;
const keys = ['翼', '角', '箭', '锤', '光', '弓', '钻', '翅', '风'];
const hit = [];
ERDATA.abilities.forEach(function (a) {
  const zh = String(a[1] || '');
  if (keys.some(function (w) { return zh.indexOf(w) >= 0; })) {
    hit.push('id=' + a[0] + ' zh=' + zh + ' en=' + a[2]);
  }
});
console.log(hit.join('\n'));
console.log('总命中:', hit.length);
