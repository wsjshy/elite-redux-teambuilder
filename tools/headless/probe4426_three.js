const H = require('./harness.js');
const { ERDATA } = H;
[382, 1589, 1638].forEach(id => {
  const s = ERDATA.species.find(x => String(x.id) === String(id));
  const ans = H.findTeammates(s);
  const picks = ans.main || ans;
  console.log('\n#' + id, s.zh);
  picks.forEach((p, i) => console.log(' ', i, '#' + p.s.id, p.s.zh, p.priRole));
});
