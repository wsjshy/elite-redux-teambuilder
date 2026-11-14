// 模糊查相关特性是否存在
const H = require('./harness.js');
const { ERDATA } = H;
const keys = ['Wing', 'Horn', 'Arrow', 'Slam', 'Photo', 'Light', 'Sheath', 'Archer'];
ERDATA.abilities.forEach(function (a) {
  const en = String(a[2] || ''), zh = String(a[1] || '');
  if (keys.some(function (w) { return en.indexOf(w) >= 0; })) {
    console.log('id=' + a[0], 'zh=' + zh, 'en=' + en);
  }
});
console.log('--- 最大 ability id ---');
const ids = ERDATA.abilities.map(function (a) { return Number(a[0]); }).filter(function (x) { return !isNaN(x); });
console.log('max ability id:', Math.max.apply(null, ids));
