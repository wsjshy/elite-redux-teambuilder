const H = require('./harness_dbg.js');
const { ERDATA } = H;
const s=ERDATA.species.find(x=>String(x.id)==='1845');
console.log('#1845 abis=',JSON.stringify(s.abis),'abiIds=',JSON.stringify(s.abiIds));
s.abiIds.forEach((id,i)=>{const a=ERDATA.abilities[id];
  console.log(`  ${s.abis[i]} id${id}: ${String(a[3]).split('\n')[0]}`)});
