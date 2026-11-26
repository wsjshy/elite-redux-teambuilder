// 快速核对胡地学习集关键招
const H = require('./harness.js');
const { ERDATA, MV } = H;
const s = ERDATA.species.find(x => String(x.id) === '1507');
const L = H.learnOf(s);
[269, 86, 164, 354, 105, 226, 270, 271, 272, 113, 115, 657].forEach(id => {
  console.log(id, (MV[id] || [])[1], L.indexOf(id) >= 0 ? 'YES' : 'no');
});
