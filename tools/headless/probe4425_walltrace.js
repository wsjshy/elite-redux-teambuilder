const H = require('./harness.js');
const { ERDATA, deriveBuilds, MV } = H;
for (const tid of [245, 144, 460, 899]) {
  const s = ERDATA.species.find(x => x.id === String(tid));
  if (!s) continue;
  const bs = deriveBuilds(s, []);
  bs.forEach(b => {
    const ids = (b.mv.main || []).map(x => x.id);
    if (ids.some(id => [113, 115, 657].indexOf(+id) > -1)) {
      console.log(`#${tid} ${s.zh}「${b.name}」role=${b.roleTag}`);
      b.mv.main.forEach(x => console.log(`   ${x.id} ${MV[x.id] ? MV[x.id][1] : '?'} kind=${x.kind} tag=${x.tag}`));
    }
  });
}
