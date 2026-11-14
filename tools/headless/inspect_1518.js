// 详查 #1518 超级巨钳螳螂：数据、全部流派、招式威力/特性/天性
const H = require("./harness.js");
const s = H.ERDATA.species.find((x) => +x.id === 1518);
console.log("zh:", s.zh, "en:", s.en, "base:", JSON.stringify(s.base));
console.log("abis:", JSON.stringify(s.abis), "abiIds:", JSON.stringify(s.abiIds));
console.log("inns:", JSON.stringify(s.inns), "innIds:", JSON.stringify(s.innIds));
console.log("learnset:", JSON.stringify(H.learnOf(s)));
const bs = H.deriveBuilds(s, []);
bs.forEach(function (b, i) {
  console.log("\n=== [" + i + "] " + b.name + " | side=" + b.side + " role=" + b.roleTag + " score=" + b.score);
  const all = (b.mv.main || []).concat(b.mv.func || []);
  all.forEach(function (o) {
    const m = H.MV[o.id];
    if (m) console.log("  mv " + m[1] + " id=" + o.id + " " + m[3] + "/" + m[4] + " pow=" + m[5] + " prio=" + m[8] + " tag=" + m[11]);
  });
  console.log("  items:", JSON.stringify(b.it));
  (b.abi || []).forEach(function (a) {
    console.log("  abi " + a.n + " sc=" + a.sc + " why=" + JSON.stringify(a.why));
  });
  console.log("  EV:", b.ev.template, JSON.stringify(b.ev.alloc), "nat:", b.nat);
});
