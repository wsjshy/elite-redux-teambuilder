// 追踪 #124 comboBuildsOf 原始输出 vs deriveBuilds 最终
const H = require('./harness.js');
const { ERDATA, MV } = H;
const s = ERDATA.species.find(x => String(x.id) === '124');
console.log('species', s.zh, 'base', s.base, 'abis', s.abis, 'inns', s.inns);

const combos = H.comboBuildsOf(s);
console.log('\n--- comboBuildsOf raw ---');
combos.forEach((b, i) => {
  const ids = (b.mv.main || []).map(x => +x.id);
  console.log('[' + i + ']', b.name, '| fast', b._fastScreen,
    '| ev', JSON.stringify(b.ev && b.ev.alloc), '| nat', (b.nat || []).map(n => n[0]),
    '| item', (b.it || []).map(x => x[0]),
    '\n     ', ids.map(id => id + ':' + (MV[id] || [])[1]).join(','));
});

const final = H.deriveBuilds(s, []);
console.log('\n--- deriveBuilds final ---');
final.forEach((b, i) => {
  const ids = (b.mv.main || []).concat(b.mv.func || []).map(x => +x.id);
  console.log('[' + i + ']', b.name, '| fast', b._fastScreen,
    '| ev', JSON.stringify(b.ev && b.ev.alloc), '| side', b.side,
    '\n     ', ids.map(id => id + ':' + (MV[id] || [])[1]).join(','));
});
