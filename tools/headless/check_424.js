// 详查 #424 双尾怪手：劈瓦 vs 碎岩，看选招评分与why
const H = require("./harness.js");
const s = H.ERDATA.species.find((x) => +x.id === 424);
const pool = H.pickAttacks(s, "物理", 40, "强化");
[75, 249, 418, 400].forEach(function () {});
pool.forEach(function (o) {
  const m = H.MV[o.id];
  if (["劈瓦", "碎岩", "劈瓦 "].indexOf(m[1]) >= 0 || /劈瓦|碎岩/.test(m[1]))
    console.log(m[1] + " id=" + o.id + " basePow=" + m[5] + " score=" + o.score + " why=" + JSON.stringify(o.why));
});
console.log("--- all pool names ---");
console.log(pool.map((o) => H.MV[o.id][1]).join("/"));
