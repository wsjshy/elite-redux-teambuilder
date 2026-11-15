const H = require('./harness_dbg.js');
const { ERDATA } = H;
for(const id of [315,482]){const a=ERDATA.abilities[id];
  console.log(`id${id} ${a[2]}: ${String(a[3]).split('\n')[0]}`)}
// 查1845原始首特性
const OLD=require('C:/temp/er4378/harness.js');
const s=OLD.ERDATA.species.find(x=>String(x.id)==='1845');
for(const b of OLD.deriveBuilds(s,[]))console.log('#1845原始:',b.name,b.abi[0].n,'id',b.abi[0].id);
