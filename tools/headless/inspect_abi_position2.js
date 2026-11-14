// 看带指定特性的物种完整 abi 数组（同时查 abis 与 inns）
const H = require('./harness.js');
const { ERDATA, deriveBuilds } = H;

function findSpecies(abiName) {
  for (const s of ERDATA.species) {
    if ((s.abis || []).indexOf(abiName) >= 0 || (s.inns || []).indexOf(abiName) >= 0) return s;
  }
  return null;
}

['大角', '大锤', '弓手', '搬岩'].forEach(function (name) {
  const s = findSpecies(name);
  if (!s) { console.log('\n### 没有任何物种的特性池含「' + name + '」'); return; }
  console.log('\n##### 特性「' + name + '」物种 #' + s.id, s.zh,
    '可选:', s.abis.join('/'), '| 隐藏:', (s.inns || []).join('/'));
  const bs = deriveBuilds(s, []);
  bs.forEach(function (b) {
    console.log('  流派「' + b.name + '」');
    (b.abi || []).forEach(function (x, i) {
      console.log('    [' + i + '] ' + x.n + ' sc=' + x.sc);
      (x.why || []).forEach(function (w) { if (/招 ×|族群|不触发/.test(w)) console.log('        why:', w); });
    });
  });
});
