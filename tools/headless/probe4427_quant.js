const H = require('./harness.js');
const { ERDATA } = H;
const NM = id => (H.MV[id] ? H.MV[id][2] : '?');

// ① 全库「双墙辅助流」卡的物种：GC / 非 GC
const gc = [], non = [];
ERDATA.species.forEach(s => {
  if (!H.isFinalSp(s) || !H.isValidSp(s)) return;
  let bs; try { bs = H.deriveBuilds(s, []); } catch (e) { return; }
  if (!bs.some(b => b.name && b.name.indexOf('双墙') > -1)) return;
  (H.isGlassCannon(s) ? gc : non).push(s);
});
console.log('双墙卡物种：GC', gc.length, ' 非GC', non.length);
console.log('GC 物种:', gc.map(s => '#' + s.id + s.zh + '(' + H.atkBest(s) + '/' + H.spdOf(s) + ')').join('、'));

// GC 物种删掉墙卡后是否仍有余卡
let zero = [];
gc.forEach(s => {
  const others = H.deriveBuilds(s, []).filter(b => !(b.name && b.name.indexOf('双墙') > -1));
  if (!others.length) zero.push('#' + s.id + s.zh);
});
console.log('GC 删墙后零卡物种:', zero.length, zero.join('、'));

// ② 强化手池：旧（有强化招）/ 新（进攻型且会强化）
const pool = [];
ERDATA.species.forEach(s => {
  if (!H.isFinalSp(s) || !H.isValidSp(s)) return;
  if (!H._ER_BOOST_ROLE || !H._ER_BOOST_ROLE[s.id]) return;
  const ab = H.atkBest(s), sd = H.spdOf(s);
  pool.push({ id: s.id, zh: s.zh, ab, sd, off: (ab >= 95 && (sd >= 70 || ab >= 130)) });
});
console.log('\n强化手池 旧:', pool.length, ' 新(进攻型):', pool.filter(p => p.off).length);
console.log('被新门排除的示例:', pool.filter(p => !p.off).slice(0, 15).map(p => '#' + p.id + p.zh + '(' + p.ab + '/' + p.sd + ')').join('、'));

// ③ 引梦貘人为核心的答案卡
const hyp = ERDATA.species.find(x => String(x.id) === '97');
const ans = H.findTeammates(hyp);
const picks = ans.main || ans;
console.log('\n引梦貘人核心答案卡:');
picks.slice(0, 6).forEach((p, i) => console.log(' ', i, '#' + p.s.id, p.s.zh, p.priRole, '(atk' + H.atkBest(p.s) + '/spd' + H.spdOf(p.s) + ')'));
