// v4.426 全库量化（阶段2）：双墙核心的队伍能否继承墙窗口（强化推队手）
const H = require('./harness.js');
const { ERDATA, buildTeam, deriveBuilds, FUNC_MV } = H;
const cardRows = require('./probe4426_wallcards.json');
const ids = [...new Set(cardRows.map(r => String(r.id)))];

function boostInfo(sp) {
  let bs; try { bs = deriveBuilds(sp, []); } catch (e) { return { any: false, top: false }; }
  const has = b => (b.mv.main || []).some(x => FUNC_MV.boost.indexOf(+x.id) > -1);
  return { any: bs.some(has), top: bs.length ? has(bs[0]) : false };
}

const agg = { teams: 0, withBoostAny: 0, withBoostTop: 0, noBooster: 0, memberCount: {} };
const detail1507 = [];
for (const sid of ids) {
  const sp = ERDATA.species.find(x => String(x.id) === sid);
  let plan; try { plan = buildTeam(sp); } catch (e) { continue; }
  agg.teams++;
  agg.memberCount[plan.team.length] = (agg.memberCount[plan.team.length] || 0) + 1;
  let any = false, top = false;
  const mates = plan.team.filter(m => !m.core);
  for (const m of mates) {
    const bi = boostInfo(m.s);
    if (bi.any) any = true;
    if (bi.top) top = true;
    if (sid === '1507') detail1507.push({ id: m.s.id, zh: m.s.zh, need: m.need && m.need.kind,
      boostAny: bi.any, boostTop: bi.top });
  }
  if (any) agg.withBoostAny++;
  if (top) agg.withBoostTop++;
  if (!any) agg.noBooster++;
}
console.log(JSON.stringify(agg, null, 1));
console.log('--- #1507 teammates:');
for (const d of detail1507) console.log(`  #${d.id}${d.zh} need=${d.need} boostAny=${d.boostAny} boostTop=${d.boostTop}`);
