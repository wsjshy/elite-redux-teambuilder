// 核对几个可疑替换的实际有效威力
const H = require("./harness.js");
function check(sid, pairs) {
  const s = H.ERDATA.species.find((x) => +x.id === sid);
  const pool = H.pickAttacks(s, "物理", 40, "强化");
  console.log("#" + sid + " " + s.zh);
  pairs.forEach(function (nm) {
    const o = pool.find((x) => H.MV[x.id][1] === nm);
    if (o) console.log("  " + nm + " base=" + H.MV[o.id][5] + " effScore=" + o.score.toFixed(1) + " why0=" + o.why[0]);
  });
}
check(822, ["迁怒", "小偷", "神鸟猛击"]);
check(924, ["暗袭要害", "咬住"]);
check(2213, ["出奇一击", "小偷", "冰冻拳"]);
check(1788, ["打嗝", "十万伏特", "爆音波"]);
