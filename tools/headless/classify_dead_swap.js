// 确认 abiIds 与 abis 对齐，并把 56 死特性案例按「防守流派 + always-on 防守备选」分类
const H = require("./harness.js");
const ERDATA = H.ERDATA;
const DEAD = "此特性当前不生效";
// always-on 防守/中性能力（按能力表 id）
const DEF_IDS = {
  4: "战斗盔甲", 75: "硬壳盔甲", 109: "纯朴", 116: "坚硬岩石", 142: "防尘",
  7: "柔软", 20: "我行我素", 107: "危险预知", 578: "灾祸之简", 144: "再生力", 165: "芳香幕",
};
const DEF_ROLES = ["肉盾", "受队", "联防", "辅助"];
let swappable = 0, notDefRole = 0, noDefAlt = 0;
const details = [];
ERDATA.species.forEach(function (s) {
  let builds = [];
  try { builds = H.deriveBuilds(s, []); } catch (e) { return; }
  // 建 abis -> abiIds 映射
  const idByName = {};
  (s.abis || []).forEach((n, i) => { idByName[n] = s.abiIds ? s.abiIds[i] : null; });
  builds.forEach(function (b) {
    const a0 = b.abi && b.abi[0];
    if (!a0 || !a0.why || JSON.stringify(a0.why).indexOf(DEAD) < 0) return;
    const isDef = DEF_ROLES.indexOf(b.roleTag) >= 0 || b.side === "辅助";
    const defAlts = [];
    (b.abi || []).slice(1).forEach(function (a) {
      const aid = idByName[a.n];
      if (aid && DEF_IDS[+aid]) defAlts.push(a.n + "(id" + aid + ")");
    });
    if (!isDef) { notDefRole++; return; }
    if (defAlts.length) {
      swappable++;
      details.push("#" + s.id + " " + s.zh + " | " + b.name + " | dead=" + a0.n + " -> " + defAlts.join(","));
    } else { noDefAlt++; }
  });
});
console.log("defensive dead builds:", swappable + noDefAlt, "| swappable:", swappable, "| no defensive alt:", noDefAlt);
console.log("non-defensive (offensive) dead builds:", notDefRole);
details.forEach((d) => console.log(d));
