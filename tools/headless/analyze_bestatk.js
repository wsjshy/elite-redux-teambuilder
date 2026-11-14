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
// 按 bestAtk 分桶
const buckets = {};
for (const r of rows) {
  const b = r.best;
  const key = b < 90 ? '<90' : b <= 100 ? '90-100' : b <= 110 ? '101-110' : b <= 120 ? '111-120' : '>120';
  (buckets[key] = buckets[key] || []).push(r);
}
for (const k of ['<90','90-100','101-110','111-120','>120']) {
  console.log(`\n===== bestAtk ${k} (${(buckets[k]||[]).length}) =====`);
  for (const r of (buckets[k]||[]))
    console.log(`#${r.id} ${r.zh} atk${r.atk} spa${r.spa} spe${r.spe} bulk${r.bulk}`);
}
