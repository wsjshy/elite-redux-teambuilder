// 列出剩余 space/weather 命中及其来源路径
const H = require('./harness.js');
const { ERDATA, deriveBuilds, sideDisp } = H;
const FIELD = [366, 433, 113, 115, 657, 240, 241, 201, 258, 580, 581, 604, 641];
const OFF = ['增伤', '输出', '强化'];
for (const s of ERDATA.species) {
  let bs; try { bs = deriveBuilds(s, []); } catch (e) { continue; }
  for (const b of bs) {
    const off = OFF.indexOf(b.roleTag) > -1 && sideDisp(b.side).indexOf('受') < 0;
    if (!off) continue;
    for (const sl of (b.mv.main || [])) {
      if (FIELD.indexOf(sl.id) > -1) {
        console.log(`#${s.id}${s.zh}「${b.name}」role=${b.roleTag} side=${b.side} route=${b.breakingRoute || '-'} src=${b.src || '-'} 招=${sl.id}`);
      }
    }
  }
}
