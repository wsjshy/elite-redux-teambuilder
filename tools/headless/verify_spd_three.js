// 确认热滑/丛林热/厚脂三特性的持有物种与 spdSpeedAbiOf 命中
const path = require("path");
const H = require("./harness.js");
const ERDATA = H.ERDATA;
const want = ["热滑", "丛林热", "厚脂"];
const found = {};
want.forEach((w) => (found[w] = []));
ERDATA.species.forEach(function (s) {
  const pool = [].concat(s.abis || [], s.inns || []);
  pool.forEach(function (a) {
    if (!a) return;
    want.forEach(function (w) {
      let same = false;
      try {
        same = H.abiSame(w, a);
      } catch (e) {
        same = w === a;
      }
      if (same) found[w].push("#" + s.id + " " + s.zh);
    });
  });
});
want.forEach(function (w) {
  console.log("== " + w + " : " + found[w].length + " holders ==");
  console.log(found[w].slice(0, 12).join("  ") || "(none)");
});
// 取一个命中物种验证 spdSpeedAbiOf 返回结构
const sample = ERDATA.species.find((s) =>
  [].concat(s.abis || [], s.inns || []).some((a) => {
    try {
      return H.abiSame("热滑", a);
    } catch (e) {
      return a === "热滑";
    }
  })
);
if (sample) {
  console.log("\nsample spdSpeedAbiOf(#" + sample.id + "):", JSON.stringify(H.spdSpeedAbiOf(sample)));
}
