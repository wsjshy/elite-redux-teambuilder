const H = require('./harness_dbg.js');
const { ERDATA } = H;
const OLD=require('C:/temp/er4378/harness.js');
for(const tid of ['615','51','745']) {
  const s=OLD.ERDATA.species.find(x=>String(x.id)===tid);
  for(const b of OLD.deriveBuilds(s,[])){
    const id=b.abi[0].id,a=ERDATA.abilities[id];
    console.log(`#${tid} ${b.abi[0].n} id${id}: ${String(a[3]).split('\n')[0]}`);
  }
}
