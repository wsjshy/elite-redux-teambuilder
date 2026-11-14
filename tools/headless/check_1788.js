const H = require("./harness.js");
const s = H.ERDATA.species.find((x) => +x.id === 1788);
const pool = H.pickAttacks(s, "特殊", 40, "强化");
["打嗝", "十万伏特", "爆音波"].forEach(function (nm) {
  const o = pool.find((x) => H.MV[x.id][1] === nm);
  if (o) console.log(nm + " base=" + H.MV[o.id][5] + " score=" + o.score.toFixed(1) + " why=" + JSON.stringify(o.why).slice(0, 120));
});
