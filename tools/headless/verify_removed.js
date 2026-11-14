const H = require('./harness.js');
const { ERDATA, deriveBuilds } = H;

let fpCount = 0;
const removed = [];
for (const s of ERDATA.species) {
  let builds;
  try { builds = deriveBuilds(s, []); } catch (e) { continue; }
  const hasFp = builds.some(b => b.mechRw === 'foul_play_atk');
  if (hasFp) fpCount++;
  // 原本应被移除的22只
  const bs = s.base;
  if (Math.max(bs[1],bs[3])>=110 && bs[5]>=100) {
    removed.push({ id:s.id, zh:s.zh, n:builds.length, hasFp,
      names: builds.map(b=>b.name) });
  }
}
console.log("当前仍有 Foul Play 流派的物种数:", fpCount);
console.log("\n22只速攻手现状（应无Foul Play且至少1流派）:");
for (const r of removed)
  console.log(`#${r.id} ${r.zh} 流派数=${r.n} hasFp=${r.hasFp} [${r.names.join(' / ')}]`);
