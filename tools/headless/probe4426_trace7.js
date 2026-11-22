// 追踪 #363 与 #124 墙块原始输出
const H = require('./harness.js');
const { ERDATA, MV } = H;
for (const id of [363, 124]) {
  const s = ERDATA.species.find(x => String(x.id) === String(id));
  console.log('\n======== #' + id, s.zh, 'abis', s.abis, 'inns', s.inns);
  const L = H.learnOf(s);
  console.log('258 hail?', L.indexOf(258) >= 0, '657?', L.indexOf(657) >= 0);
  const combos = H.comboBuildsOf(s);
  combos.forEach((b, i) => {
    const ids = (b.mv.main || []).map(x => +x.id);
    console.log('raw[' + i + ']', b.name, 'abi', JSON.stringify(b.abi),
      '\n   ', ids.map(x => x + ':' + (MV[x] || [])[1]).join(','));
  });
  const fin = H.deriveBuilds(s, []);
  fin.forEach((b, i) => {
    const ids = (b.mv.main || []).concat(b.mv.func || []).map(x => +x.id);
    if (b.name.indexOf('双墙') < 0) return;
    console.log('FINAL[' + i + ']', b.name,
      '\n   ', ids.map(x => x + ':' + (MV[x] || [])[1]).join(','));
  });
}
