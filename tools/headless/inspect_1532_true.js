const OLD = require('C:/temp/er-deploy/harness_true_old.js');
const NEW = require('./harness.js');

function show(H, id) {
  const s = H.ERDATA.species.find(x => String(x.id) === String(id));
  console.log("base:", s.base);
  const bs = H.deriveBuilds(s, []);
  console.log("count:", bs.length);
  for (const b of bs)
    console.log(`  [${b.name}] mechRw=${b.mechRw} nat=${b.nat[0][0]} abi=${b.abi[0].n} moves=${b.mv.main.map(x=>x.id).join('/')}`);
}
console.log("=== TRUE OLD #1532 ===");
show(OLD, 1532);
console.log("=== NEW #1532 ===");
show(NEW, 1532);
