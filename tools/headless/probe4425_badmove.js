const H = require('./harness.js');
const { ERDATA, deriveBuilds, learnOf } = H;
for (const s of ERDATA.species) {
  let bs; try { bs = deriveBuilds(s, []); } catch (e) { continue; }
  const learn = learnOf(s) || [];
  for (const b of bs) {
    for (const sl of (b.mv.main || [])) {
      if (learn.indexOf(sl.id) < 0) {
        console.log(`#${s.id} ${s.zh}「${b.name}」role=${b.roleTag} 非法招 ${sl.id} | learn含该招: ${learn.indexOf(sl.id) > -1}`);
      }
    }
  }
}
