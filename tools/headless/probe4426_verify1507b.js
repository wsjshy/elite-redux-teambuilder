const H = require('./harness.js');
const { ERDATA } = H;
const s = ERDATA.species.find(x => String(x.id) === '1507');
const ans = H.findTeammates(s);
const picks = ans.main || ans;
console.log('mainPicks（可见 5 = 前 5）:');
picks.forEach((p, i) => {
  console.log(i, '#' + p.s.id, p.s.zh, 'priRole', p.priRole);
});
const vis = picks.slice(0, 5);
const hasSweep = vis.some(p => p.priRole === '强化');
console.log('\n可见 5 格内是否有强化手:', hasSweep);
