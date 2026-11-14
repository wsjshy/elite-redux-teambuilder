// 确认剩余死特性标注数 = 56-7 = 49，且换入的 7 个不再带死标记
const H = require("./harness.js");
const DEAD = "此特性当前不生效";
let dead = 0;
H.ERDATA.species.forEach(function (s) {
  let bs;
  try { bs = H.deriveBuilds(s, []); } catch (e) { return; }
  bs.forEach(function (b) {
    const a = b.abi && b.abi[0];
    if (a && a.why && JSON.stringify(a.why).indexOf(DEAD) >= 0) dead++;
  });
});
console.log("remaining dead-retained builds:", dead, "(expect 49)");
