// 汇总 56 死特性案例的全部备选名（去重），并标注能力表描述，识别 always-on 防守/中性特性
const H = require("./harness.js");
const ERDATA = H.ERDATA;
const DEAD = "此特性当前不生效";
const altCount = {};
ERDATA.species.forEach(function (s) {
  let builds = [];
  try { builds = H.deriveBuilds(s, []); } catch (e) { return; }
  builds.forEach(function (b) {
    const a0 = b.abi && b.abi[0];
    if (!a0 || !a0.why || JSON.stringify(a0.why).indexOf(DEAD) < 0) return;
    (b.abi || []).slice(1).forEach(function (a) {
      if (!a.n) return;
      if (!altCount[a.n]) altCount[a.n] = 0;
      altCount[a.n]++;
    });
  });
});
const names = Object.keys(altCount).sort();
console.log("distinct alternative names:", names.length);
names.forEach(function (nm) {
  // 用 abiSame 思路找能力表（先精确 zh，再 en，再模糊）
  let ab = ERDATA.abilities.find((a) => a[2] === nm || a[1] === nm);
  let desc = ab ? ab[3] : "(species-only name; table canonical differs)";
  let id = ab ? ab[0] : "?";
  console.log(nm + "  [x" + altCount[nm] + "] id=" + id + " :: " + desc);
});
