// 探针：慢物攻手（速<90）含技术高手，且有 1-60 威力先制本系招（技术高手后可过线）
const H = require("./harness.js");
let n = 0;
const ex = [];
H.ERDATA.species.forEach(function (s) {
  if (!s.base) return;
  if ((s.base[5] || 0) >= 90) return;
  const names = (s.abis || []).concat(s.inns || []);
  if (names.indexOf("技术高手") < 0) return;
  const learn = H.learnOf(s);
  const hits = [];
  learn.forEach(function (id) {
    const m = H.MV[id];
    if (!m || m[4] !== "物理") return;
    const prio = m[8] || 0;
    if (prio <= 0) return;
    if ((m[5] || 0) < 1 || (m[5] || 0) > 60) return;
    const stab = m[3] === s.t1 || m[3] === s.t2;
    hits.push(m[1] + "(prio" + prio + (stab ? ",STAB" : "") + ")");
  });
  if (hits.length) { n++; if (ex.length < 25) ex.push("#" + s.id + " " + s.zh + " 速" + s.base[5] + " " + hits.join(",")); }
});
console.log("慢技术高手+先制招 物种:", n);
ex.forEach((e) => console.log("  " + e));
