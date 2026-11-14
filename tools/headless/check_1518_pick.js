// 看 Scizor 选招池里子弹拳的评分，以及对比钢翼/彗星拳/十字剪/铁头
const H = require("./harness.js");
const s = H.ERDATA.species.find((x) => +x.id === 1518);
const pool = H.pickAttacks(s, "物理", 8, "强化");
pool.forEach(function (o) {
  const m = H.MV[o.id];
  console.log(JSON.stringify(o).slice(0, 200));
  console.log("   -> " + m[1] + " pow=" + m[5] + " prio=" + m[8] + " score=" + (o.score !== undefined ? o.score : "?"));
});
