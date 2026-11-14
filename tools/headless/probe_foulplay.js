const H = require('./harness.js');
const { ERDATA, deriveBuilds, MV } = H;

let fpBuilds = [];
for (const s of ERDATA.species) {
  let builds;
  try { builds = deriveBuilds(s, []); } catch (e) { continue; }
  for (const b of builds) {
    if (b.mechRw === 'foul_play_atk' || (b.name && b.name.includes('欺诈物反流'))) {
      const bs = s.base;
      fpBuilds.push({
        id: s.id, zh: s.zh,
        hp: bs[0], atk: bs[1], def: bs[2], spa: bs[3], spd: bs[4], spe: bs[5],
        score: b.score,
        nat: b.nat && b.nat[0] && b.nat[0][0],
        abi0: b.abi && b.abi[0] && b.abi[0].n,
        isDefault: b === builds[0]
      });
    }
  }
}
console.log("total Foul Play builds:", fpBuilds.length);
// 按是否高特攻/高速分类
console.log("\n=== 全部 Foul Play 流派 ===");
for (const x of fpBuilds) {
  const flags = [];
  if (x.spa >= 120) flags.push("高特攻");
  if (x.spe >= 100) flags.push("高速");
  if (x.atk >= 100) flags.push("物攻不低");
  console.log(`#${x.id} ${x.zh} | base[${x.hp},${x.atk},${x.def},${x.spa},${x.spd},${x.spe}] | sc=${x.score} | nat=${x.nat} | abi=${x.abi0} | default=${x.isDefault} ${flags.join('/')}`);
}
