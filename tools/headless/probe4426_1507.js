// v4.426 取证：#1507 超级胡地全部流派 + 墙相关学习集
const H = require('./harness.js');
const { ERDATA, deriveBuilds, learnOf, bulkOf, isGlassCannon } = H;
const s = ERDATA.species.find(x => String(x.id) === '1507');
console.log('zh=', s.zh, ' base=', JSON.stringify(s.base), ' t1=', s.t1, ' t2=', s.t2);
console.log('bulk=', bulkOf(s), ' isGlassCannon=', isGlassCannon(s));
const learn = learnOf(s);
const walls = learn.filter(id => [113, 115, 657].indexOf(id) > -1);
console.log('wall learn ids=', JSON.stringify(walls), walls.map(id => id + ':' + (H.MV[id] ? H.MV[id][1] : '?')).join(' '));
console.log('all abis=', JSON.stringify(s.abis), ' inns=', JSON.stringify(s.inns));
let bs;
try { bs = deriveBuilds(s, []); } catch (e) { console.log('ERR', e && e.stack); process.exit(1); }
bs.forEach((b, i) => {
  const ids = (b.mv.main || []).map(x => x.id);
  console.log('---', i, 'name=', b.name, ' side=', b.side, ' roleTag=', b.roleTag, ' score=', b.score,
    ' breaking=', b.breakingRoute);
  console.log('   ids=', JSON.stringify(ids), ids.map(id => id + ':' + (H.MV[id] ? H.MV[id][1] : '?')).join(' '));
  console.log('   item=', JSON.stringify((b.it || []).slice(0, 2)), ' nat=', JSON.stringify(b.nat && b.nat[0]),
    ' abi0=', b.abi && b.abi[0] && b.abi[0].n);
  console.log('   ev=', JSON.stringify(b.ev && b.ev.alloc), b.ev && b.ev.template, ' flags=', JSON.stringify({
    wallNoSource: b.wallNoSource, wallAbiSwitch: b.wallAbiSwitch, wallSelfKept: b.wallSelfKept }));
});
