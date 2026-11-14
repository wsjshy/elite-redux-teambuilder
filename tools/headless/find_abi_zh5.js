// 正确索引：[id, en, zh, desc, tags]
const H = require('./harness.js');
const { ERDATA } = H;
const want = ['Giant Wings', 'Mighty Horn', 'Hardened Sheath', 'Archer', 'Super Slammer',
  'Photokinesis', 'Photon Burst'];
ERDATA.abilities.forEach(function (a) {
  const en = String(a[1] || '');
  if (want.some(function (w) { return en === w; })) {
    console.log('id=' + a[0], 'en=' + en, 'zh=' + a[2]);
  }
});
console.log('--- 中文关键字 ---');
const keys = ['翼', '角', '箭', '锤', '光', '弓', '钻'];
ERDATA.abilities.forEach(function (a) {
  const zh = String(a[2] || '');
  if (keys.some(function (w) { return zh.indexOf(w) >= 0; })) {
    console.log('id=' + a[0], 'en=' + a[1], 'zh=' + zh);
  }
});
