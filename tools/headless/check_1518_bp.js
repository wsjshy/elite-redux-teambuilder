// 找子弹拳在选招池里的位置与评分，并看引擎是否对先制/技术高手在选招评分里加分
const H = require("./harness.js");
const s = H.ERDATA.species.find((x) => +x.id === 1518);
const pool = H.pickAttacks(s, "物理", 40, "强化");
pool.forEach(function (o, i) {
  const m = H.MV[o.id];
  if (o.prio > 0 || o.id === 418 || i < 3)
    console.log("#" + i + " " + m[1] + " id=" + o.id + " pow=" + m[5] + " prio=" + m[8] + " score=" + o.score + " why=" + JSON.stringify(o.why));
});
console.log("pool total:", pool.length);
