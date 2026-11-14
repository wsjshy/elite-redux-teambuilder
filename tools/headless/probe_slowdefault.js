// 探针：慢速物种（速种族≤60）的答案卡默认首推（classifyBuilds 首组 rep）是否为满速流派
const H = require('./harness.js');
const { ERDATA, classifyBuilds, MV } = H;

const SPEED_LOW = 60;
const hits = [];
let slowN = 0;

ERDATA.species.forEach(function (s) {
  const spd = s.base[5] || 0;
  if (spd > SPEED_LOW) return;
  slowN++;
  let cls;
  try { cls = classifyBuilds(s, derive(s)); } catch (e) { return; }
  if (!cls.groups || !cls.groups.length) return;
  const rep = cls.groups[0].rep;
  const a = (rep.ev && rep.ev.alloc) || [];
  if (a[5] === 252) {
    const ids = (rep.mv.main || []).map(function (x) { return x.id; });
    hits.push({
      id: s.id, zh: s.zh, spd: spd, name: rep.name, role: rep.roleTag,
      tpl: rep.ev.template, moves: ids.map(function (m) { return MV[m] ? MV[m][1] : m; })
    });
  }
});

function derive(s) {
  const H2 = require('./harness.js');
  return H2.deriveBuilds(s, []);
}

console.log('慢速物种数:', slowN);
console.log('默认首推为满速的物种数:', hits.length);
hits.forEach(function (h) {
  console.log('#' + h.id, h.zh, '速' + h.spd, '| 首推=' + h.name, '| ' + h.role, '| tpl=' + h.tpl,
    '| 招=' + h.moves.join('/'));
});
