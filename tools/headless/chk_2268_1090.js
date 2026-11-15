const H = require('./harness_dbg.js');
const { ERDATA } = H;
for(const tid of ['2268','1090']) {
  const s=ERDATA.species.find(x=>String(x.id)===tid);
  console.log(`\n#${tid} ${s.zh} abis=${JSON.stringify(s.abis)} abiIds=${JSON.stringify(s.abiIds)}`);
  s.abiIds.forEach((id,i)=>{const a=ERDATA.abilities[id];
    console.log(`  ${s.abis[i]} id${id}: ${String(a[3]).split('\n')[0]}`)});
}
