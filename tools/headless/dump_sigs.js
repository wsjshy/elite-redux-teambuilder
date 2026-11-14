// 用指定 harness 导出关键物种的流派签名到 JSON（进程参数：harness路径 输出路径）
const H = require(process.argv[2]);
const fs = require("fs");
const out = {};
H.ERDATA.species.forEach(function (s) {
  let bs;
  try { bs = H.deriveBuilds(s, []); } catch (e) { return; }
  out[s.id] = bs.map(function (b) {
    return {
      name: b.name,
      mv: (b.mv.main || []).map((x) => x.id),
      abi: (b.abi[0] || {}).n,
      it: ((b.it[0] || [])[0]),
    };
  });
});
fs.writeFileSync(process.argv[3], JSON.stringify(out));
console.log("dumped", Object.keys(out).length, "species to", process.argv[3]);
