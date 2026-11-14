const H = require('./harness.js');
const { ERDATA, deriveBuilds, MV } = H;

// 只统计：Foul Play 作为默认（builds[0]）且物种是进攻型（高特攻或高速）
let problematic = [];
let totalDefault = 0;
for (const s of ERDATA.species) {
  let builds;
  try { builds = deriveBuilds(s, []); } catch (e) { continue; }
  const fpIdx = builds.findIndex(b => b.mechRw === 'foul_play_atk');
  if (fpIdx === -1) continue;
  if (fpIdx === 0) totalDefault++;
  const bs = s.base;
  const offensive = (bs[3] >= 120) || (bs[5] >= 100);
  if (fpIdx === 0 && offensive) {
    problematic.push({
      id: s.id, zh: s.zh, base: bs,
      spa: bs[3], spe: bs[5], score: builds[0].score,
      other: builds.slice(1).map(b => b.name + '(sc' + b.score + ')')
    });
  }
}
console.log("Foul Play 作为默认的总数:", totalDefault);
console.log("其中进攻型宝可梦（高特攻≥120 或 高速≥100）被误纳的数量:", problematic.length);
for (const p of problematic) {
  console.log(`#${p.id} ${p.zh} base[${p.base}] fpSc=${p.score} | 其他流派: ${p.other.join(', ')}`);
}
