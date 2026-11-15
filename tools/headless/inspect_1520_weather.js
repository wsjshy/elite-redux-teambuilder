const H = require('./harness.js');
const { ERDATA, deriveBuilds, MV } = H;

const s = ERDATA.species.find(x => String(x.id) === '1520');
const bs = deriveBuilds(s, []);
for (const b of bs) {
  console.log("流派:", b.name, "| side", b.side, "| role", b.roleTag);
  console.log("特性:");
  for (const a of b.abi) console.log("  ", a.n, "id", a.id, "| sc", a.sc, "|", a.why);
  console.log("主招:");
  for (const m of b.mv.main) {
    const mv = MV[m.id];
    console.log("  ", mv[1], "id", m.id, mv[3], mv[4], "pow", mv[5], "|", m.why);
  }
  if (b.mv.func) for (const m of b.mv.func) {
    const mv = MV[m.id];
    console.log("  [func]", mv[1], "id", m.id, "|", m.why);
  }
}
