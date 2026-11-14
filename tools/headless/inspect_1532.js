const OLD = require('C:/temp/er-deploy/harness_old.js');
const NEW = require('./harness.js');

function show(H, id) {
  const s = H.ERDATA.species.find(x => String(x.id) === String(id));
  console.log("base:", s.base, "spe:", s.base[5]);
  const bs = H.deriveBuilds(s, []);
  for (const b of bs) {
    console.log(`  [${b.name}] mechRw=${b.mechRw} side=${b.side} nat=${b.nat[0][0]} abi=${b.abi[0].n} moves=${b.mv.main.map(x=>x.id).join('/')}`);
  }
}
console.log("=== OLD #1532 ===");
show(OLD, 1532);
console.log("=== NEW #1532 ===");
show(NEW, 1532);
