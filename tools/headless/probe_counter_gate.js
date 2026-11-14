// 量化反伤流资格 OR 缺陷：物理双倍奉还(68)却 Atk>=70（仅靠 SpA<70 混入）；镜面反射(243)却 SpA>=70
const H = require("./harness.js");
const physBad = [], spBad = [];
H.ERDATA.species.forEach(function (s) {
  const bb = s.base, atk = bb[1] || 0, spa = bb[3] || 0;
  const has68 = H.learnOf(s).indexOf(68) >= 0, has243 = H.learnOf(s).indexOf(243) >= 0, has368 = H.learnOf(s).indexOf(368) >= 0;
  const bulk = (bb[0] || 0) + (bb[2] || 0) + (bb[4] || 0);
  // 复刻引擎：选 mv0
  let mv0 = null;
  if (has68) mv0 = 68; else if (has243) mv0 = 243; else if (has368) mv0 = 368;
  if (mv0 === null) return;
  if (!((atk < 70) || (spa < 70))) return;
  if (!(bulk >= 250)) return;
  // 该 build 实际生成
  let bs;
  try { bs = H.deriveBuilds(s, []); } catch (e) { return; }
  const has = bs.some((b) => b.name === "反伤后手流");
  if (!has) return;
  if (mv0 === 68 && atk >= 70) physBad.push("#" + s.id + " " + s.zh + " Atk=" + atk + " SpA=" + spa + " bulk=" + bulk);
  if (mv0 === 243 && spa >= 70) spBad.push("#" + s.id + " " + s.zh + " Atk=" + atk + " SpA=" + spa + " bulk=" + bulk);
});
console.log("physical Counter (68) but Atk>=70 [wrongly admitted]:", physBad.length);
physBad.forEach((x) => console.log("  " + x));
console.log("Mirror Coat (243) but SpA>=70:", spBad.length);
spBad.forEach((x) => console.log("  " + x));
