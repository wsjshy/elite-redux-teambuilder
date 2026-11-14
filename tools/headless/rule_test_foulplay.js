const H = require('./harness.js');
const { ERDATA, deriveBuilds } = H;

let rows = [];
for (const s of ERDATA.species) {
  let builds;
  try { builds = deriveBuilds(s, []); } catch (e) { continue; }
  const fpIdx = builds.findIndex(b => b.mechRw === 'foul_play_atk');
  if (fpIdx === -1) continue;
  const bs = s.base;
  rows.push({
    id: s.id, zh: s.zh,
    hp: bs[0], atk: bs[1], def: bs[2], spa: bs[3], spd: bs[4], spe: bs[5],
    bestAtk: Math.max(bs[1], bs[3]),
    bulk: bs[0] + bs[2] + bs[4],
    isDefault: fpIdx === 0
  });
}
// 候选规则：进攻型 = 速度>=100 且 最高攻击>=120
function ruleOffensive(r) { return r.spe >= 100 && r.bestAtk >= 120; }

const wouldRemove = rows.filter(ruleOffensive);
console.log("候选规则（速≥100 且 最高攻≥120）会移除:", wouldRemove.length);
console.log("\n--- 会被移除的（检查是否都是进攻手）---");
for (const r of wouldRemove) console.log(`#${r.id} ${r.zh} atk${r.atk} spa${r.spa} spe${r.spe} bulk${r.bulk}`);

console.log("\n--- 保留但默认且高速/高特攻的（检查是否漏网）---");
for (const r of rows) {
  if (ruleOffensive(r)) continue;
  if (r.isDefault && (r.spe >= 100 || r.spa >= 120 || r.atk >= 120))
    console.log(`#${r.id} ${r.zh} atk${r.atk} spa${r.spa} spe${r.spe} bulk${r.bulk}`);
}
