const H = require("./harness.js");
const s = H.ERDATA.species.find((x) => +x.id === 1518);
const pool = H.pickAttacks(s, "物理", 40, "强化");
pool.forEach(function (o, i) {
  const m = H.MV[o.id];
  console.log("#" + i + " " + m[1] + " id=" + o.id + " mvPrio=" + m[8] + " score=" + o.score);
});
