// 审计两个 conDead 残留：#2215 超级炎武王、#2640 小锻匠R
const H = require("./harness.js");
const ERDATA = H.ERDATA;
[2215, 2640].forEach(function (id) {
  const s = ERDATA.species.find((x) => +x.id === id);
  console.log("\n================ #%s %s ================", id, s ? s.zh : "(missing)");
  if (!s) return;
  console.log("t1/t2:", s.t1, s.t2, "| base:", (s.base || []).join("/"));
  console.log("species abis:", JSON.stringify(s.abis), "| inns:", JSON.stringify(s.inns));
  const builds = H.deriveBuilds(s, []);
  builds.forEach(function (b, bi) {
    console.log("\n -- build[%d] %s | side=%s score=%s role=%s", bi, b.name, b.side, b.score, b.roleTag);
    const mvs = [].concat((b.mv && b.mv.main) || [], (b.mv && b.mv.func) || []);
    console.log("    moves:", mvs.map((m) => "#" + m.id + (H.MV[m.id] ? H.MV[m.id][1] : "?")).join("  "));
    (b.abi || []).forEach(function (a, ai) {
      console.log("    abi[%d] n=%s id=%s sc=%s why=%s", ai, a.n, a.id, a.sc, JSON.stringify(a.why));
    });
  });
});
