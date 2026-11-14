const H = require('./harness.js');
const { ERDATA, deriveBuilds } = H;

let rows = [];
for (const s of ERDATA.species) {
  let builds;
  try { builds = deriveBuilds(s, []); } catch (e) { continue; }
  if (!builds.some(b => b.mechRw === 'foul_play_atk')) continue;
  const bs = s.base;
  rows.push({ id: s.id, zh: s.zh, atk: bs[1], spa: bs[3],
    best: Math.max(bs[1], bs[3]), spe: bs[5], bulk: bs[0]+bs[2]+bs[4] });
}

// 候选规则：明确进攻速攻手 = 最高攻>=110 且 速度>=100
function isFastSweeper(r) { return r.best >= 110 && r.spe >= 100; }
const removed = rows.filter(isFastSweeper);
console.log("规则（best≥110 且 spe≥100）移除:", removed.length);
for (const r of removed) console.log(`  #${r.id} ${r.zh} best${r.best} spe${r.spe} bulk${r.bulk}`);

console.log("\n保留下来但 best≥110 的（慢/高耐久，人工确认是否合理）:");
for (const r of rows.filter(r => !isFastSweeper(r) && r.best >= 110))
  console.log(`  #${r.id} ${r.zh} best${r.best} spe${r.spe} bulk${r.bulk}`);
