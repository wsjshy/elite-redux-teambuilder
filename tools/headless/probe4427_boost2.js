const H = require('./harness.js');
const { ERDATA } = H;
const OLD = H._ER_BOOST_ROLE || {};
const newIds = [];
ERDATA.species.forEach(s => {
  if (!H.isFinalSp(s) || !H.isValidSp(s)) return;
  if (OLD[s.id]) return;
  let L; try { L = H.learnOf(s) || []; } catch (e) { return; }
  if (L.indexOf(347) > -1) newIds.push(s.id);
});
console.log('会冥想347 且不在旧表:', newIds.length);
const merged = {}; Object.keys(OLD).forEach(k => merged[k] = true); newIds.forEach(id => merged[id] = true);
const keys = Object.keys(merged).map(Number).sort((a, b) => a - b);
require('fs').writeFileSync('boost4427b.json', JSON.stringify(keys.map(k => [k, true])));
console.log('合并后总数:', keys.length);
['26', '97', '1104', '1507', '788', '1783'].forEach(id => console.log('#' + id, 'in:', !!merged[id]));
