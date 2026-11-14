// 按英文名查引擎特性表（数组结构 [id,zh,en,?,[]]）
const H = require('./harness.js');
const { ERDATA } = H;
const want = ['Giant Wings', 'Mighty Horn', 'Hardened Sheath', 'Archer', 'Super Slammer',
  'Photokinesis', 'Photon Burst'];
ERDATA.abilities.forEach(function (a) {
  const en = String(a[2] || '');
  if (want.some(function (w) { return en === w; })) {
    console.log('id=' + a[0], 'zh=' + a[1], 'en=' + a[2]);
  }
});
