// 量化：首推会心流特性但本流派实际招式无高会心招（且无会心道具）的流派
const H = require("./harness.js");
function isHighCrit(mvId){
  const o = H.MV[mvId];
  if (!o) return false;
  if (o[4] !== "物理" && o[4] !== "特殊") return false;
  const d = String(o[9] || "") + " " + String(o[10] || "");
  if (/HP is low/i.test(d)) return false;
  return /critical/i.test(d);
}
const CRIT = ["狙击手", "超幸运", "锋锐", "怒气冲天", "连胜"];
const bad = [];
let totalCritTop = 0;
H.ERDATA.species.forEach(function (s) {
  let bs;
  try { bs = H.deriveBuilds(s, []); } catch (e) { return; }
  bs.forEach(function (b) {
    const a0 = b.abi && b.abi[0];
    if (!a0 || CRIT.indexOf(a0.n) < 0) return;
    totalCritTop++;
    const ids = (b.mv.main || []).map((x) => +x.id);
    const buildCrit = ids.some((id) => isHighCrit(id));
    // 会心道具：焦点镜/大葱/要害攻击类
    const it0 = b.it && b.it[0] && b.it[0][0];
    const critItem = it0 && (/焦点镜|大葱|要害/.test(it0));
    if (!buildCrit && !critItem) {
      bad.push("#" + s.id + " " + s.zh + " | " + b.name + " | 首推" + a0.n + " | 实际招:" +
        ids.map((id) => (H.MV[id] || [])[1]).join("/") + " | 道具:" + it0);
    }
  });
});
console.log("首推会心流特性的流派总数:", totalCritTop);
console.log("其中实际招式无高会心招且无会心道具 [误推]:", bad.length);
bad.forEach((x) => console.log("  " + x));
