const H = require('./harness.js');
const { ERDATA, deriveBuilds, MV } = H;

// 队伍级辅助/开启类招式
const SET = {
  weather: [240,241,201,258],
  screens: [113,115,657],
  terrain: [580,581,604,641],
};
const ALLSET = new Set([].concat(SET.weather, SET.screens, SET.terrain));

function categoryOf(id) {
  for (const k of Object.keys(SET)) if (SET[k].indexOf(+id)>=0) return k;
  return null;
}
function duraTri(b) { return b[0]+b[2]+b[4]; }

const hits = [];
for (const s of ERDATA.species) {
  const bs = s.base;
  const spe = bs[5], dt = duraTri(bs);
  const isGlass = spe>=100 && dt<270;
  const isFast = spe>=100;
  let builds;
  try { builds = deriveBuilds(s, []); } catch(e){ continue; }
  for (const b of builds) {
    const ids = (b.mv.main||[]).map(x=>+x.id);
    for (const id of ids) {
      if (ALLSET.has(id)) {
        hits.push({ id:s.id, zh:s.zh, spe, dt, isGlass, isFast,
          side:b.side, role:b.roleTag, name:b.name, setMove:id, setCat:categoryOf(id) });
      }
    }
  }
}
console.log("携带天气/墙/场地开启招的流派总数:", hits.length);
const glassHits = hits.filter(h=>h.isGlass);
const fastHits = hits.filter(h=>h.isFast && !h.isGlass);
console.log("其中玻璃大炮(速≥100且耐久<270):", glassHits.length);
console.log("其中速≥100但非玻璃:", fastHits.length);
console.log("慢速(<100):", hits.filter(h=>!h.isFast).length);

console.log("\n=== 玻璃大炮命中清单 ===");
for (const h of glassHits)
  console.log(`#${h.id} ${h.zh} 速${h.spe} 耐${h.dt} [${h.name}] ${h.side}/${h.role} 带${MV[h.setMove][1]}(${h.setMove})`);
