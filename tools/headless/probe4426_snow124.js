const H = require('./harness.js');
const { ERDATA } = H;
const s = ERDATA.species.find(x => String(x.id) === '124');
const L = H.learnOf(s);
console.log('258 hail:', L.indexOf(258) >= 0);
console.log('657:', L.indexOf(657) >= 0);
// 复刻我的 snow 判定
const snowIds = [117, 666, 929, 291, 348, 870, 493];
const all = (s.abis || []).concat(s.inns || []);
all.forEach(n => {
  const id = H.abiIdByZhOrEn(n);
  console.log(n, '->', id, 'snow?', id !== null && snowIds.indexOf(+id) > -1);
});
console.log('snowAbi', all.some(n => { const id = H.abiIdByZhOrEn(n); return id !== null && snowIds.indexOf(+id) > -1; }));
console.log('snowOk(final)', all.some(n => { const id = H.abiIdByZhOrEn(n); return id !== null && snowIds.indexOf(+id) > -1; }) || L.indexOf(258) > -1);
