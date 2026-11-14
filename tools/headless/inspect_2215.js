// 看 #2215 关键招与特性：飞身重压560、深渊翻滚66、闪焰冲锋394；以及能否学560
const H = require("./harness.js");
const ERDATA = H.ERDATA;
[560, 66, 394, 187, 303].forEach(function (id) {
  const m = H.MV[id];
  console.log("#%s: %s", id, m ? JSON.stringify([m[1], m[2], m[3], m[4], m[5], m[6], m[11]]) : "(missing)");
});
const s = ERDATA.species.find((x) => +x.id === 2215);
const learn = H.learnOf(s);
console.log("\n#2215 learnable has 560?", learn.indexOf(560) >= 0, "| has 66?", learn.indexOf(66) >= 0);
// 该物种所有流派（含被去重/隐藏的）看是否有飞身重压路线
const builds = H.deriveBuilds(s, []);
console.log("build count:", builds.length);
// 能力表中 963 信息
const ab = ERDATA.abilities.find((a) => +a[0] === 963);
console.log("\nability 963:", ab ? JSON.stringify([ab[1], ab[2], ab[3]]) : "(missing)");
