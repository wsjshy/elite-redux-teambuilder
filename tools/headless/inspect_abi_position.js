// 看带「大角」物种的完整 abi 数组（含非首推位），确认族群 why 是否在次位出现
const H = require('./harness.js');
const { ERDATA, deriveBuilds } = H;

function findSpecies(abiName) {
  for (const s of ERDATA.species) {
    if ((s.abis || []).indexOf(abiName) >= 0) return s;
  }
  return null;
}

['大角', '大锤', '弓手', '搬岩'].forEach(function (name) {
  const s = findSpecies(name);
  console.log('\n##### 特性「' + name + '」物种 #' + s.id, s.zh, '可选特性:', s.abis.join('/'));
  const bs = deriveBuilds(s, []);
  bs.forEach(function (b) {
    console.log('  流派「' + b.name + '」');
    (b.abi || []).forEach(function (x, i) {
      console.log('    [' + i + '] ' + x.n + ' sc=' + x.sc);
      (x.why || []).forEach(function (w) { if (/招 ×|族群|不触发/.test(w)) console.log('        why:', w); });
    });
  });
});
