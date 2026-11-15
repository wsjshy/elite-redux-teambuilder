const H = require('./harness_dbg.js');
const { ERDATA } = H;
const names=['友情防守','双持','暴风雨','复仇之魂','活力','舞者','燃烧','强壮之颚'];
for(const a of Object.values(ERDATA.abilities)){
  if(names.includes(a[2]))console.log(`${a[2]}: ${a[3]}`);
}
