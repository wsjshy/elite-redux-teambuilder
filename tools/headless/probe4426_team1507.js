// 验证 #1507 两条组队路径现在都带强化推队手
const H = require('./harness.js');
const { ERDATA, MV } = H;
const s = ERDATA.species.find(x => String(x.id) === '1507');

// 1. buildTeam
const team = H.buildTeam(s);
console.log('=== buildTeam（核心 #1507 胡地）===');
const mates = team.mates || team.team || [];
mates.forEach(m => {
  const sp = m.s || m;
  const roles = H.findTeammates ? '' : '';
  console.log('#' + sp.id, sp.zh, '| priRole', m.priRole || '',
    '| 卡名', m.name || (m.b && m.b.name) || '');
});

// 2. findTeammates
console.log('\n=== findTeammates 答案卡 ===');
const ans = H.findTeammates(s);
const picks = ans.picks || ans.mainPicks || ans;
(picks || []).forEach(p => {
  const sp = p.s || p;
  console.log('#' + sp.id, sp.zh, '| priRole', p.priRole || '',
    '| comboGain', p.comboGain);
});
