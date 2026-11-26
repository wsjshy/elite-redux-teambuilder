const H = require('./harness.js');
const { ERDATA } = H;
const NM = {};
H.FUNC_MV.boost.forEach(id => { NM[id] = H.MV[id] ? H.MV[id][2] : '?'; });

function info(id) {
  const s = ERDATA.species.find(x => String(x.id) === String(id));
  const learn = H.learnC(s);
  const boosts = H.FUNC_MV.boost.filter(b => learn.indexOf(b) > -1);
  console.log('\n#' + id, s.zh, 'base', JSON.stringify(s.base),
    'bulk', H.bulkOf(s), 'spd', H.spdOf(s), 'atkBest', H.atkBest(s),
    'isGlassCannon', H.isGlassCannon(s));
  console.log('  会强化招:', boosts.map(b => b + ' ' + NM[b]).join(' / ') || '无');
  const bs = H.deriveBuilds(s, []);
  console.log('  流派卡:');
  bs.forEach(b => console.log('   -', b.name, '[' + b.roleTag + ']', b.mv.main.map(m => m.id + (H.MV[m.id] ? H.MV[m.id][2] : '')).join(', ')));
}

info(1507);
info(97);
