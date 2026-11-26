// v4.435 probe: dump the 862 build card(s) and learnOf result
const H = require('./harness.js');
const { ERDATA, deriveBuilds, learnOf } = H;
const sp = ERDATA.species.find(x => String(x.id) === '862');
console.log('species', sp.id, sp.zh, sp.en);
console.log('learnOf:', JSON.stringify(learnOf(sp)));
const out = deriveBuilds(sp);
out.forEach((b, i) => {
  console.log('--- card', i, b.name, '| nat', b.nat, '| ev', JSON.stringify(b.ev), '| item', b.it);
  console.log('    mv.main:', JSON.stringify((b.mv && b.mv.main) || []));
});
// locate move 92 in MV table
const mv = ERDATA.moves || ERDATA.MV || {};
console.log('ERDATA keys:', Object.keys(ERDATA).join(','));
