// v4.425 精简验证：进攻流派（物理/特殊/双刀 × 增伤/输出/强化）零手动场地招
const H = require('./harness.js');
const { ERDATA, deriveBuilds, sideDisp } = H;
const FIELD = [366, 433, 113, 115, 657, 240, 241, 201, 258, 580, 581, 604, 641];
const OFF = ['增伤', '输出', '强化'];
const hits = { tailwind: [], space: [], wall: [], weather: [] };
const catOf = id => id === 366 ? 'tailwind' : id === 433 ? 'space'
  : (id === 113 || id === 115 || id === 657) ? 'wall' : 'weather';
let total = 0, prankKept = 0;
for (const s of ERDATA.species) {
  let bs; try { bs = deriveBuilds(s, []); } catch (e) { continue; }
  for (const b of bs) {
    total++;
    const off = OFF.indexOf(b.roleTag) > -1 && sideDisp(b.side).indexOf('受') < 0;
    if (!off) continue;
    if (b.breakingRoute === '恶作剧') { prankKept++; continue; }
    for (const sl of (b.mv.main || [])) {
      if (FIELD.indexOf(sl.id) > -1) hits[catOf(sl.id)].push(`#${s.id}${s.zh}「${b.name}」${sl.id}`);
    }
  }
}
console.log(JSON.stringify({ total, prankKept, counts: {
  tailwind: hits.tailwind.length, space: hits.space.length, wall: hits.wall.length, weather: hits.weather.length
}, sample: hits.tailwind.slice(0, 3) }, null, 1));
