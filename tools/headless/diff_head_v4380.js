// 全库 diff：HEAD(v4.379) harness vs 当前 harness，按物种内顺序配对，列出主招 id 集合不同的流派。
const H0 = require('./_head_harness.js');
const H1 = require('./harness.js');

let nSp = 0, diffs = [];
for (const s of H0.ERDATA.species) {
  let b0, b1;
  try { b0 = H0.deriveBuilds(s, []); } catch (e) { continue; }
  try { b1 = H1.deriveBuilds(s, []); } catch (e) { continue; }
  nSp++;
  if (b0.length !== b1.length) diffs.push({ id: s.id, zh: s.zh, k: `流派数 ${b0.length}→${b1.length}`, old: '-', now: '-' });
  const n = Math.max(b0.length, b1.length);
  for (let i = 0; i < n; i++) {
    const a = b0[i], c = b1[i];
    if (!a || !c) { diffs.push({ id: s.id, zh: s.zh, k: (c || a).name, old: a ? '-' : '(缺)', now: c ? '-' : '(缺)' }); continue; }
    const m0 = (a.mv.main || []).map(x => +x.id).sort((p, q) => p - q).join(',');
    const m1 = (c.mv.main || []).map(x => +x.id).sort((p, q) => p - q).join(',');
    if (m0 !== m1) diffs.push({ id: s.id, zh: s.zh, k: a.side + '/' + a.roleTag + ' | ' + a.name + ' → ' + c.name, old: m0, now: m1 });
  }
}
console.log('species', nSp, 'diff builds', diffs.length);
const mv = id => H1.MV[id] ? H1.MV[id][1] : '#' + id;
diffs.forEach((d, i) => {
  const o = d.old === '-' ? '-' : d.old.split(',').filter(Boolean).map(x => x + ':' + mv(+x)).join(' | ');
  const n = d.now === '-' ? '-' : d.now.split(',').filter(Boolean).map(x => x + ':' + mv(+x)).join(' | ');
  console.log(`${i + 1}. #${d.id} ${d.zh} [${d.k}]`);
  console.log(`   旧: ${o}`);
  console.log(`   新: ${n}`);
});
