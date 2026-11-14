// 探针：慢速物种（速种族≤60）却投满 252 速度 EV 的流派
const H = require('./harness.js');
const { ERDATA, deriveBuilds, MV } = H;

const SPEED_LOW = 60;
const hits = [];
let slowSpecies = 0;

ERDATA.species.forEach(function (s) {
  const spd = s.base[5] || 0;
  if (spd > SPEED_LOW) return;
  slowSpecies++;
  let bs;
  try { bs = deriveBuilds(s, []); } catch (e) { return; }
  bs.forEach(function (b) {
    const a = b.ev.alloc || [];
    if (a[5] === 252) {
      const ids = (b.mv.main || []).map(function (x) { return x.id; });
      hits.push({
        id: s.id, zh: s.zh, spd: spd, name: b.name, role: b.roleTag, side: b.side,
        nat: b.nat, moves: ids.map(function (m) { return MV[m] ? MV[m][1] : m; })
      });
    }
  });
});

console.log('慢速物种数(速≤60):', slowSpecies);
console.log('投满252速度的流派数:', hits.length);
hits.forEach(function (h) {
  console.log('#' + h.id, h.zh, '速' + h.spd, '|', h.name, '| ' + h.role + '/' + h.side,
    '| 性格=' + h.nat, '| 招=' + h.moves.join('/'));
});
