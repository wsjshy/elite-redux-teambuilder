// 纯 JSON 对比两个签名文件，报告配招/特性/道具变化
const fs = require("fs");
const old = JSON.parse(fs.readFileSync("C:\\temp\\er-deploy\\sigs_old.json"));
const neu = JSON.parse(fs.readFileSync("C:\\temp\\er-deploy\\sigs_new.json"));
const H = require("./harness.js");
function nm(id) { return (H.MV[id] || [])[1] || id; }
let mv = 0, abi = 0, it = 0, removed = 0, added = 0;
const ex = [];
Object.keys(neu).forEach(function (sid) {
  const nbs = neu[sid], obs = old[sid] || [];
  nbs.forEach(function (b) {
    const ob = obs.find((x) => x.name === b.name);
    if (!ob) { added++; return; }
    if (b.mv.join(",") !== ob.mv.join(",")) {
      mv++;
      if (ex.length < 30) ex.push("#" + sid + " " + b.name + " 招: " + ob.mv.map(nm).join("/") + " -> " + b.mv.map(nm).join("/"));
    }
    if (b.abi !== ob.abi) abi++;
    if (b.it !== ob.it) it++;
  });
  obs.forEach((b) => { if (!nbs.some((x) => x.name === b.name)) removed++; });
});
console.log("配招变化:", mv, "| 首推特性变化:", abi, "| 首道具变化:", it, "| 流派删除:", removed, "| 新增:", added);
ex.forEach((e) => console.log("  " + e));
