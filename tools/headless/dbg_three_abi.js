const H = require('./harness_dbg.js');
const { ERDATA, MV } = H;
for(const tid of ['1090','1631','2672']) {
  const s=ERDATA.species.find(x=>String(x.id)===tid);
  console.log(`\n#${tid} ${s.zh}`);
  console.log('  abis=',JSON.stringify(s.abis),'abiIds=',JSON.stringify(s.abiIds));
  for(const b of H.deriveBuilds(s,[])){
    const a0=b.abi[0];
    const info=ERDATA.abilities[a0.id];
    console.log(`  [${b.name}] 首特性 n=${a0.n} id=${a0.id} → ${info?info[3].split('\n')[0]:'?'}`);
  }
}
