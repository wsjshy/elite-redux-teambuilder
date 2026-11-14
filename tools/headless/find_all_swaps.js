// 用同一口径（仅 abi[0]）分别数基线/当前的死特性，并找出基线死、当前已换的全部案例
const base = require("C:\\temp\\er-deploy\\base\\harness.js");
const cur = require("./harness.js");
const DEAD = "此特性当前不生效";
function isDead(b) {
  const a = b.abi && b.abi[0];
  return !!(a && a.why && JSON.stringify(a.why).indexOf(DEAD) >= 0);
}
let bDead = 0, cDead = 0;
const swapped = [];
cur.ERDATA.species.forEach(function (s, idx) {
  const sb = base.ERDATA.species[idx];
  let bb, bc;
  try { bb = base.deriveBuilds(sb, []); } catch (e) { return; }
  try { bc = cur.deriveBuilds(s, []); } catch (e) { return; }
  for (let i = 0; i < bc.length; i++) {
    if (isDead(bb[i])) bDead++;
    if (isDead(bc[i])) cDead++;
    if (isDead(bb[i]) && !isDead(bc[i])) {
      swapped.push("#" + s.id + " " + s.zh + " | " + bc[i].name + " | " + bb[i].abi[0].n + " -> " + bc[i].abi[0].n);
    }
  }
});
console.log("baseline dead:", bDead, "current dead:", cDead, "swapped:", swapped.length);
swapped.forEach((x) => console.log(x));
