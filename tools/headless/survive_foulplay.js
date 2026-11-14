const H = require('./harness.js');
const { ERDATA, deriveBuilds } = H;

function fpRemoved(s) {
  const bs = s.base;
  return Math.max(bs[1], bs[3]) >= 110 && bs[5] >= 100;
}

let survive = [];
for (const s of ERDATA.species) {
  let builds;
  try { builds = deriveBuilds(s, []); } catch (e) { continue; }
  const fp = builds.find(b => b.mechRw === 'foul_play_atk');
  if (!fp) continue;
  if (fpRemoved(s)) continue;  // 已被门控移除
  survive.push({
    id: s.id, zh: s.zh,
    nat: fp.nat && fp.nat[0] && fp.nat[0][0],
    abi: fp.abi && fp.abi[0] && fp.abi[0].n,
    abiId: fp.abi && fp.abi[0] && fp.abi[0].id,
    hasSun: (fp.mv.main || []).some(x => +x.id === 241)
  });
}
console.log("门控后保留的 Foul Play 流派数:", survive.length);
// 性格分布
const natCount = {};
for (const r of survive) natCount[r.nat] = (natCount[r.nat]||0)+1;
console.log("性格分布:", JSON.stringify(natCount));
console.log("\n非大胆/悠闲的（性格待修）:");
for (const r of survive.filter(r => r.nat !== '大胆' && r.nat !== '悠闲'))
  console.log(`  #${r.id} ${r.zh} nat=${r.nat} abi=${r.abi}`);
console.log("\n特性含太阳之力的:");
for (const r of survive.filter(r => r.abi === '太阳之力'))
  console.log(`  #${r.id} ${r.zh} nat=${r.nat} 自带晴天=${r.hasSun}`);
