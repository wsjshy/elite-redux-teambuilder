// 只针对 6 个目标物种（7 流派）核对换特性结果
const base = require("C:\\temp\\er-deploy\\base\\harness.js");
const cur = require("./harness.js");
const TARGETS = [270, 271, 519, 520, 833, 1045, 2640];
TARGETS.forEach(function (id) {
  const sb = base.ERDATA.species.find((x) => +x.id === id);
  const sc = cur.ERDATA.species.find((x) => +x.id === id);
  const bb = base.deriveBuilds(sb, []);
  const bc = cur.deriveBuilds(sc, []);
  console.log("#" + id + " " + sc.zh + "  builds=" + bc.length);
  for (let i = 0; i < bc.length; i++) {
    const a = bb[i].abi[0], c = bc[i].abi[0];
    const mark = a.n === c.n ? "  (unchanged)" : "  *** SWAP ***";
    console.log("  [" + i + "] " + bc[i].name + " | role=" + bc[i].roleTag + " | " + a.n + " -> " + c.n + mark);
    if (a.n !== c.n) console.log("       sc=" + c.sc + " why=" + JSON.stringify(c.why));
  }
});
