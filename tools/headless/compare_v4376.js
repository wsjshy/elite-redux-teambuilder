// 对比 v4.375 基线与 v4.376 新引擎：gate 指标 + 精确的 abi[0] 变化
const path = require("path");
const base = require("C:\\temp\\er-deploy\\base\\harness.js");
const cur = require("./harness.js");

function gateOf(H) {
  const DEF_ROLES = { 肉盾: 1, 受队: 1, 联防: 1, 辅助: 1 };
  const M = { total: 0, badMove: 0, dup: 0, itemsOver: 0, defOrb: 0, offHist: {} };
  for (const s of H.ERDATA.species) {
    let bs;
    try { bs = H.deriveBuilds(s, []); } catch (e) { continue; }
    M.total += bs.length;
    const learn = H.learnOf(s) || [];
    const seen = {};
    let no = 0;
    for (const b of bs) {
      for (const sl of (b.mv.main || [])) if (learn.indexOf(sl.id) < 0) M.badMove++;
      const key = (b.mv.main || []).map((x) => x.id).join(",");
      if (seen[key]) M.dup++;
      seen[key] = 1;
      if ((b.it || []).length > 3) M.itemsOver++;
      if (DEF_ROLES[String(b.roleTag)] && b.it && b.it[0] && b.it[0][0] === "生命宝珠") M.defOrb++;
      if (String(b.side) !== "辅助" && !DEF_ROLES[String(b.roleTag)]) no++;
    }
    M.offHist[no] = (M.offHist[no] || 0) + 1;
  }
  return M;
}
const gb = gateOf(base), gc = gateOf(cur);
console.log("BASE:", JSON.stringify(gb));
console.log("CUR :", JSON.stringify(gc));
["total", "badMove", "dup", "itemsOver", "defOrb"].forEach((k) => {
  console.log(k, gb[k] === gc[k] ? "SAME (" + gb[k] + ")" : "CHANGED " + gb[k] + "->" + gc[k]);
});
console.log("offHist same:", JSON.stringify(gb.offHist) === JSON.stringify(gc.offHist));

// 精确找出 abi[0] 变化的流派
const changes = [];
cur.ERDATA.species.forEach(function (s, idx) {
  const sb = base.ERDATA.species[idx];
  let bb, bc;
  try { bb = base.deriveBuilds(sb, []); } catch (e) { return; }
  try { bc = cur.deriveBuilds(s, []); } catch (e) { return; }
  if (bb.length !== bc.length) return;
  for (let i = 0; i < bc.length; i++) {
    const a = bb[i].abi && bb[i].abi[0], c = bc[i].abi && bc[i].abi[0];
    if (a && c && a.n !== c.n) {
      changes.push("#" + s.id + " " + s.zh + " | " + bc[i].name + " | " + a.n + " -> " + c.n + " | why: " + JSON.stringify(c.why));
    }
  }
});
console.log("\nabi[0] changes:", changes.length);
changes.forEach((c) => console.log(c));
