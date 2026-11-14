// 直接核对 #2119 的 abis 与 abiIds 平行关系
const H = require('./harness.js');
const { ERDATA, deriveBuilds } = H;
const s = ERDATA.species.filter(function (x) { return x.id === '2119'; })[0];
console.log('#2119', s.zh);
console.log('abis:', JSON.stringify(s.abis));
console.log('abiIds:', JSON.stringify(s.abiIds));
console.log('inns:', JSON.stringify(s.inns), 'innIds:', JSON.stringify(s.innIds));
// 能力表 390 的名字
const ab390 = ERDATA.abilities.filter(function (a) { return Number(a[0]) === 390; })[0];
console.log('能力表390:', JSON.stringify(ab390));
// 看它的流派 abi
deriveBuilds(s, []).forEach(function (b) {
  console.log('流派「' + b.name + '」abi:');
  b.abi.forEach(function (x, i) {
    console.log('  [' + i + ']', x.n, 'id=' + x.id, 'sc=' + x.sc);
    (x.why || []).forEach(function (w) { if (/招 ×|族群|不触发/.test(w)) console.log('      why:', w); });
  });
});
