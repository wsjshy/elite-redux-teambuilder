const H = require('./harness.js');
const { ERDATA, deriveBuilds } = H;
for (const tid of ['1502', '862']) {
  const s = ERDATA.species.find(x => x.id === tid);
  const bs = deriveBuilds(s, []);
  console.log(`#${tid} ${s.zh} 共 ${bs.length} 流派`);
  bs.forEach(b => console.log(`  「${b.name}」role=${b.roleTag} 招=[${(b.mv.main || []).map(x => x.id).join(',')}]`));
}
