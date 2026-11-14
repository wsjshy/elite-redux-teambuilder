const H = require('./harness.js');
const { ERDATA, deriveBuilds, MV } = H;
const s = ERDATA.species.find(x => String(x.id) === '1520');
const builds = deriveBuilds(s, []);
console.log("build count:", builds.length);
for (const b of builds) {
  console.log("\n=====================================");
  console.log("name:", b.name, "| side:", b.side, "| roleTag:", b.roleTag, "| score:", b.score);
  console.log("main:", (b.mv.main||[]).map(m => m.id + ':' + MV[m.id][1]).join(', '));
  console.log("func:", (b.mv.func||[]).map(m => m.id + ':' + MV[m.id][1]).join(', '));
  console.log("abi[0]:", JSON.stringify(b.abi && b.abi[0]));
  console.log("it[0]:", JSON.stringify(b.it && b.it[0]));
  console.log("nat:", b.nat, "| ev:", JSON.stringify(b.ev));
  if (b.warn) console.log("warn:", b.warn);
}
