const H = require('./harness.js');
const { ERDATA } = H;
const s = ERDATA.species.find(x => String(x.id) === '1507');

// 关键候选的角色
[282, 97, 150, 2144, 2203, 1800].forEach(id => {
  const t = ERDATA.species.find(x => String(x.id) === String(id));
  console.log('#' + id, t.zh, 'roles', H.mateRoleOf(t));
});

// 完整 picks
const ans = H.findTeammates(s);
const picks = ans.mainPicks || ans.picks;
console.log('\npicks（共', picks.length, '可见 5）:');
picks.forEach((p, i) => {
  console.log(i, '#' + p.s.id, p.s.zh, 'priRole', p.priRole, 'score', Math.round(p.score));
});
