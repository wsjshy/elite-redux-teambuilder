// 量化：技术高手物种里，基础威力 37-54（被<55门剔除但×1.5后≥55）的可学攻击招
const H = require("./harness.js");
const rows = [];
H.ERDATA.species.forEach(function (s) {
  const all = (s.abis || []).concat(s.inns || []);
  if (all.indexOf("技术高手") < 0) return;
  const learn = H.learnOf(s);
  const hits = [];
  learn.forEach(function (id) {
    const m = H.MV[id];
    if (!m || (m[4] !== "物理" && m[4] !== "特殊")) return;
    const p = m[5] || 0;
    if (p >= 37 && p < 55) hits.push(m[1] + "(" + p + "→" + (p * 1.5) + "," + m[3] + ",prio" + m[8] + ")");
  });
  if (hits.length) rows.push("#" + s.id + " " + s.zh + " : " + hits.join("、"));
});
console.log("技术高手物种数:", H.ERDATA.species.filter((s) => (s.abis || []).concat(s.inns || []).indexOf("技术高手") >= 0).length);
console.log("含被门剔除但技术高手可救回招式的物种:", rows.length);
rows.forEach((r) => console.log("  " + r));
