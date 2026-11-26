// v4.426 取证：墙学习集分布 + #1507 答案卡队友（findTeammates）
const H = require('./harness.js');
const { ERDATA, learnOf, bulkOf, isGlassCannon, findTeammates, deriveBuilds, FUNC_MV } = H;
const cardRows = require('./probe4426_wallcards.json');
const ids = [...new Set(cardRows.map(r => String(r.id)))];
const learnBuckets = { both: 0, only113: 0, only115: 0, veil657: 0 };
const detail = [];
for (const sid of ids) {
  const sp = ERDATA.species.find(x => String(x.id) === sid);
  const L = learnOf(sp);
  const has113 = L.indexOf(113) > -1, has115 = L.indexOf(115) > -1, has657 = L.indexOf(657) > -1;
  if (has113 && has115) learnBuckets.both++;
  else if (has113) learnBuckets.only113++;
  else if (has115) learnBuckets.only115++;
  if (has657) learnBuckets.veil657++;
  if (sid === '1507') {
    const gc = isGlassCannon(sp);
    const mates = findTeammates(sp, '特殊', '受队');
    const list = (mates.main && mates.main.length ? mates.main : mates).slice(0, 5);
    for (const m of list) {
      const t = m.s;
      let bs; try { bs = deriveBuilds(t, []); } catch (e) { bs = []; }
      const hasBoost = b => (b.mv.main || []).some(x => FUNC_MV.boost.indexOf(+x.id) > -1);
      detail.push({ id: t.id, zh: t.zh, priRole: m.priRole,
        boostAny: bs.some(hasBoost), boostTop: bs.length ? hasBoost(bs[0]) : false });
    }
  }
}
console.log('learn buckets among 411:', JSON.stringify(learnBuckets));
console.log('--- #1507 answer-card mates:');
for (const d of detail) console.log(`  #${d.id}${d.zh} pri=${d.priRole} boostAny=${d.boostAny} boostTop=${d.boostTop}`);
