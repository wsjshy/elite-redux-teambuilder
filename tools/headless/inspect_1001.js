// 详查 #1001 古简蜗：abis/inns/abiIds/innIds，两个流派的死特性与换入结果
const H = require("./harness.js");
const s = H.ERDATA.species.find((x) => +x.id === 1001);
console.log("zh:", s.zh, "en:", s.en);
console.log("abis:", JSON.stringify(s.abis), "abiIds:", JSON.stringify(s.abiIds));
console.log("inns:", JSON.stringify(s.inns), "innIds:", JSON.stringify(s.innIds));
const bs = H.deriveBuilds(s, []);
bs.forEach(function (b, i) {
  console.log("\n[" + i + "] " + b.name + " | side=" + b.side + " role=" + b.roleTag + " score=" + b.score);
  console.log("  main:", JSON.stringify((b.mv.main || []).map((x) => H.MV[x.id] ? H.MV[x.id][1] : x.id)));
  (b.abi || []).forEach(function (a) {
    console.log("  abi: " + a.n + " sc=" + a.sc + " why=" + JSON.stringify(a.why));
  });
});
