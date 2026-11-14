// 对比 v4.376 与当前：哪些流派的配招/首推特性/首道具发生变化
const OLD = require("C:\\temp\\er-deploy\\harness_v4376.js");
const NEW = require("./harness.js");
function sig(b) {
  const ids = (b.mv.main || []).map((x) => x.id).join(",");
  const a0 = b.abi && b.abi[0] && b.abi[0].n;
  const i0 = b.it && b.it[0] && b.it[0][0];
  return ids + "|" + a0 + "|" + i0;
}
let changedMv = 0, changedAbi = 0, changedItem = 0;
const examples = [];
NEW.ERDATA.species.forEach(function (s) {
  const so = OLD.ERDATA.species.find((x) => +x.id === +s.id);
  let nbs, obs;
  try { nbs = NEW.deriveBuilds(s, []); obs = OLD.deriveBuilds(so, []); } catch (e) { return; }
  // match by name
  nbs.forEach(function (b) {
    const ob = obs.find((x) => x.name === b.name);
    if (!ob) return;
    const nm = (b.mv.main || []).map((x) => x.id).join(",");
    const om = (ob.mv.main || []).map((x) => x.id).join(",");
    if (nm !== om) { changedMv++; if (examples.length < 25) examples.push("#" + s.id + " " + s.zh + " " + b.name + " 招:" + om + " -> " + nm); }
    if ((b.abi[0] || {}).n !== (ob.abi[0] || {}).n) changedAbi++;
    if (((b.it[0] || [])[0]) !== ((ob.it[0] || [])[0])) changedItem++;
  });
});
console.log("changed moves:", changedMv, "changed top ability:", changedAbi, "changed top item:", changedItem);
examples.forEach((e) => console.log("  " + e));
