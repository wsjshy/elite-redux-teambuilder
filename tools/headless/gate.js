// 无头全库门禁：node tools/headless/gate.js
const H = require('./harness.js');
const { ERDATA, deriveBuilds, learnOf } = H;
const DEF_ROLES = { '肉盾': 1, '受队': 1, '联防': 1, '辅助': 1 };
const sp = ERDATA.species;
const M = { species: sp.length, total: 0, empty: [], fatal: [], badMove: 0, dup: 0,
  itemsOver: 0, defOrb: 0, offHist: {} };
for (const s of sp) {
  let bs;
  try { bs = deriveBuilds(s, []); } catch (e) { M.fatal.push([s.id, String(e)]); continue; }
  M.total += bs.length;
  if (!bs.length) M.empty.push(s.id);
  const learn = learnOf(s) || [];
  const seen = {};
  let no = 0;
  for (const b of bs) {
    if (!b.name || !(b.mv && b.mv.main && b.mv.main.length)) M.fatal.push([s.id, b.name || 'noname']);
    for (const sl of (b.mv.main || [])) if (learn.indexOf(sl.id) < 0) M.badMove++;
    const key = (b.mv.main || []).map(x => x.id).join(',');
    if (seen[key]) M.dup++;
    seen[key] = 1;
    if ((b.it || []).length > 3) M.itemsOver++;
    if (DEF_ROLES[String(b.roleTag)] && b.it && b.it[0] && b.it[0][0] === '生命宝珠') M.defOrb++;
    if (String(b.side) !== '辅助' && !DEF_ROLES[String(b.roleTag)]) no++;
  }
  M.offHist[no] = (M.offHist[no] || 0) + 1;
}
console.log(JSON.stringify(M, null, 1));
