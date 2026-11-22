// v4.426 全库量化（阶段1）：双墙辅助流卡片名实分布
const fs = require('fs');
const H = require('./harness.js');
const { ERDATA, deriveBuilds, bulkOf, isGlassCannon, FUNC_MV } = H;
const WALL_IDS = [113, 115, 657];
const rows = [];
const agg = { cards: 0, wallCount: { 0: 0, 1: 0, 2: 0, 3: 0 },
  item0: {}, nat: {}, tpl: {}, gc: 0, nonGc: 0, side: {}, roleTag: {} };
for (const s of ERDATA.species) {
  let bs; try { bs = deriveBuilds(s, []); } catch (e) { continue; }
  for (const b of bs) {
    if (String(b.name || '').indexOf('双墙') < 0) continue;
    const ids = (b.mv.main || []).map(x => +x.id);
    const wc = ids.filter(id => WALL_IDS.indexOf(id) > -1).length;
    const item0 = b.it && b.it[0] ? b.it[0][0] : '(空)';
    const nat = b.nat && b.nat[0] ? b.nat[0][0] : '(空)';
    const tpl = b.ev && b.ev.template ? b.ev.template : '(空)';
    const gc = isGlassCannon(s);
    agg.cards++;
    agg.wallCount[wc]++;
    agg.item0[item0] = (agg.item0[item0] || 0) + 1;
    agg.nat[nat] = (agg.nat[nat] || 0) + 1;
    agg.tpl[tpl] = (agg.tpl[tpl] || 0) + 1;
    if (gc) agg.gc++; else agg.nonGc++;
    agg.side[b.side] = (agg.side[b.side] || 0) + 1;
    agg.roleTag[b.roleTag] = (agg.roleTag[b.roleTag] || 0) + 1;
    rows.push({ id: s.id, zh: s.zh, bulk: bulkOf(s), gc, wc, item0, nat, tpl,
      side: b.side, roleTag: b.roleTag, name: b.name, ids });
  }
}
fs.writeFileSync(__dirname + '/probe4426_wallcards.json', JSON.stringify(rows));
console.log(JSON.stringify(agg, null, 1));
console.log('species with wall card =', new Set(rows.map(r => r.id)).size);
console.log('GC single-wall sample:', rows.filter(r => r.gc && r.wc === 1).slice(0, 12)
  .map(r => `#${r.id}${r.zh} bulk=${r.bulk} ${r.item0}/${r.nat}/${r.tpl}`).join('\n  '));
