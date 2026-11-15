const H = require('./harness_dbg.js');
const { ERDATA } = H;
for(const n of ['拨雪','空中飞人','引水','复仇之魂','双持','强壮之颚','强大之角','燃烧']) {
  const a=Object.values(ERDATA.abilities).find(x=>x[2]===n);
  console.log(`${n}: ${a?a[3].split('\n')[0]:'(未找到)'}`);
}
