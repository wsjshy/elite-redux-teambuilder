// 细化探针：47 命中里，无防守是固定天性还是可选特性；是否有可靠替代招
const path = require('path');
const H = require(path.join(__dirname, 'harness.js'));
const { ERDATA, deriveBuilds, MV, learnOf } = H;

function reliableAtkAlts(s, side, excludeId) {
  const out = [];
  learnOf(s).forEach(id => {
    const r = MV[id];
    if (!r || r[4] === '变化') return;
    if (id === excludeId) return;
    if (side !== '双刀' && r[4] !== side) return;
    const acc = r[6];
    if (acc > 0 && acc < 85) return; // 要可靠招
    out.push({ id: id, n: r[1], pow: r[5], acc: acc, type: r[3],
      stab: (r[3] === s.t1 || r[3] === s.t2) });
  });
  return out;
}

const rows = [];
ERDATA.species.forEach(s => {
  let bs = [];
  try { bs = deriveBuilds(s, []); } catch (e) { return; }
  const ngInInn = (s.inns || []).indexOf('无防守') > -1;
  const ngInAbi = (s.abis || []).indexOf('无防守') > -1;
  bs.forEach(b => {
    const actualAbi = (b.abi[0] || {}).n;
    (b.mv.main || []).forEach(m => {
      const r = MV[m.id];
      if (!r || r[4] === '变化') return;
      const acc = r[6];
      if (!(acc > 0 && acc < 70)) return;
      if (actualAbi === '无防守') return; // 实际就是无防守
      const alts = reliableAtkAlts(s, b.side, m.id);
      rows.push({ sp: s.id, zh: s.zh, score: b.score, build: b.name, actualAbi: actualAbi,
        ngInInn: ngInInn, ngInAbi: ngInAbi, mv: m.id, mvzh: r[1], acc: acc,
        alts: alts.length, topAlt: alts.sort((a,b)=>b.pow-a.pow).slice(0,2).map(a=>a.n+'('+a.pow+'/'+a.acc+')') });
    });
  });
});
console.log('problem rows', rows.length);
const byScore = {};
rows.forEach(r => { byScore[r.score] = (byScore[r.score]||0)+1; });
console.log('byScore', JSON.stringify(byScore));
console.log('ngInInn true count', rows.filter(r=>r.ngInInn).length);
rows.forEach(r => console.log(JSON.stringify(r)));
