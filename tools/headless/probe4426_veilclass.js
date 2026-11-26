// 分类：会 657 的物种，哪些有雪系特性；并检查最终卡是否保留 657
const H = require('./harness.js');
const { ERDATA, deriveBuilds, MV } = H;
const snowIds = [117, 666, 929, 291, 348, 870, 493];
const withAbi = [], noAbi = [];
for (const sp of ERDATA.species) {
  const L = H.learnOf(sp);
  if (L.indexOf(657) < 0) continue;
  let snowName = null;
  (sp.abis || []).concat(sp.inns || []).forEach(n => {
    if (snowName) return;
    let id = null; try { id = H.abiIdByZhOrEn(n); } catch (e) {}
    if (id !== null && snowIds.indexOf(+id) > -1) snowName = n;
  });
  (snowName ? withAbi : noAbi).push({ id: sp.id, zh: sp.zh, snowName });
}
console.log('会657且有雪特性:', withAbi.length, withAbi.map(x => '#' + x.id + x.zh + '(' + x.snowName + ')').join(','));
console.log('\n会657但无雪特性:', noAbi.length, noAbi.map(x => '#' + x.id + x.zh).join(','));

// 检查有雪特性者最终卡
console.log('\n--- 有雪特性者最终墙卡 ---');
withAbi.forEach(x => {
  const sp = ERDATA.species.find(s => String(s.id) === String(x.id));
  const bs = deriveBuilds(sp, []);
  const w = bs.find(b => b.name.indexOf('双墙') >= 0);
  if (!w) { console.log('#' + x.id, x.zh, '无墙卡'); return; }
  const ids = (w.mv.main || []).concat(w.mv.func || []).map(z => +z.id);
  console.log('#' + x.id, x.zh, ids.map(id => id + ':' + (MV[id] || [])[1]).join(','),
    '| abi', (w.abi || []).map(a => a.n).join('/'));
});
