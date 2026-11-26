// 找出 19 张单面墙卡并溯源
const H = require('./harness.js');
const { ERDATA, deriveBuilds, MV } = H;
const list = [];
for (const sp of ERDATA.species) {
  let bs; try { bs = deriveBuilds(sp, []); } catch (e) { continue; }
  bs.forEach(b => {
    if (String(b.name).indexOf('双墙') < 0) return;
    const ids = (b.mv.main || []).concat(b.mv.func || []).map(x => +x.id);
    const w = ids.filter(id => id === 113 || id === 115).length;
    if (w < 2 && ids.indexOf(657) < 0) {
      const L = H.learnOf(sp);
      list.push({
        id: sp.id, zh: sp.zh,
        card: ids,
        learn113: L.indexOf(113) >= 0, learn115: L.indexOf(115) >= 0,
        learn657: L.indexOf(657) >= 0,
        fast: !!b._fastScreen,
      });
    }
  });
}
console.log('single-wall cards:', list.length);
list.forEach(x => {
  console.log('#' + x.id, x.zh, '| fast', x.fast,
    '| learn 113', x.learn113, '115', x.learn115, '657', x.learn657,
    '| card', x.card.map(id => id + ':' + (MV[id] || [])[1]).join(','));
});
