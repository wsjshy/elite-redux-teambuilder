const H = require('./harness.js');
const { ERDATA } = H;
const B = H._ER_BOOST_ROLE || {};
const ids = Object.keys(B);
let keep = 0; const cut = [];
ERDATA.species.forEach(s => {
  if (!B[s.id]) return;
  const a = H.atkBest(s), sd = H.spdOf(s);
  const ok = a >= 95 && (sd >= 70 || a >= 130);
  if (ok) keep++; else cut.push({ id: s.id, zh: s.zh, a, sd });
});
console.log('_ER_BOOST_ROLE 物种数:', ids.length);
console.log('新门保留(可推队强化手):', keep, ' 排除:', cut.length);
console.log('\n被排除样本（前 30）:');
cut.slice(0, 30).forEach(c => console.log('  #' + c.id, c.zh, 'atk' + c.a, '/spd' + c.sd));
// 关键样本
['97', '1507', '1104', '2144'].forEach(id => {
  const s = ERDATA.species.find(x => String(x.id) === id); if (!s) return;
  const a = H.atkBest(s), sd = H.spdOf(s);
  console.log('\n#' + id, s.zh, 'atk' + a, '/spd' + sd, 'boostRole', !!B[id],
    '新门', (B[id] && a >= 95 && (sd >= 70 || a >= 130)));
});
