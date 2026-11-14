// 单跑当前引擎：用新 why 标记找出全部换特性案例
const H = require("./harness.js");
const SWAP_MARK = "换成本流派常驻生效的防守特性";
const rows = [];
H.ERDATA.species.forEach(function (s) {
  let bs;
  try { bs = H.deriveBuilds(s, []); } catch (e) { return; }
  bs.forEach(function (b) {
    const a = b.abi && b.abi[0];
    if (a && a.why && JSON.stringify(a.why).indexOf(SWAP_MARK) >= 0) {
      rows.push("#" + s.id + " " + s.zh + " | " + b.name + " | role=" + b.roleTag + " | now=" + a.n);
    }
  });
});
console.log("total engine swaps:", rows.length);
rows.forEach((r) => console.log(r));
