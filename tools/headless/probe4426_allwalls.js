const H = require('./harness.js');
const { ERDATA } = H;
let total = 0, ok = 0, noBoosterPossible = 0, bad = [];
ERDATA.species.forEach(s => {
  let learn;
  try { learn = H.learnC(s); } catch (e) { return; }
  if (!H.FUNC_MV.wall.some(w => learn.indexOf(w) > -1)) return;
  if (!H.isFinalSp(s) || !H.isValidSp(s)) return;
  total++;
  let ans;
  try { ans = H.findTeammates(s); } catch (e) { bad.push('#' + s.id + ' 异常 ' + e.message); return; }
  const picks = ans.main || ans;
  const vis = picks.slice(0, 5);
  const hasSweep = vis.some(p => p.priRole === '强化');
  if (hasSweep) ok++;
  else bad.push('#' + s.id + ' ' + s.zh + ' 可见5格无强化');
});
console.log('会墙最终形态物种:', total);
console.log('可见5格含强化手:', ok);
console.log('问题数:', bad.length);
bad.slice(0, 20).forEach(b => console.log(' -', b));
