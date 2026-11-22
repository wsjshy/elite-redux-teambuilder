const H = require('./harness.js');
const { ERDATA } = H;
const boosters = [];
ERDATA.species.forEach(t => {
  let roles;
  try { roles = H.mateRoleOf(t); } catch (e) { roles = []; }
  if (roles && roles.indexOf('强化') > -1) boosters.push({ id: t.id, zh: t.zh, roles });
});
console.log('全库含强化角色物种:', boosters.length);
boosters.slice(0, 30).forEach(b => console.log('#' + b.id, b.zh, b.roles.join('/')));
