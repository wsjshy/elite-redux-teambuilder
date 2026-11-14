// 按英文名查引擎特性表，拿到中文名与 id
const H = require('./harness.js');
const { ERDATA } = H;
const want = ['Giant Wings', 'Mighty Horn', 'Hardened Sheath', 'Archer', 'Super Slammer',
  'Photokinesis', 'Photon Burst'];
const abis = ERDATA.abilities;
console.log('abilities 类型:', Array.isArray(abis) ? 'array' : typeof abis, '长度:', abis.length);
console.log('样例:', JSON.stringify(abis[0]));
abis.forEach(function (a) {
  const en = a.en || a[2] || '';
  if (want.indexOf(en) >= 0 || want.some(function (w) { return String(en).indexOf(w) >= 0; })) {
    console.log(JSON.stringify(a));
  }
});
