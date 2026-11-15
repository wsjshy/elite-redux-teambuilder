const H = require('./harness_dbg.js');
const { ERDATA, MV } = H;
const s = ERDATA.species.find(x=>String(x.id)==='1043');
const bs = H.deriveBuilds(s,[]);
for (const b of bs) {
  console.log(`\n[${b.name}] role=${b.roleTag} 特性=${b.abi[0].n}`);
  for (const m of b.mv.main) {
    const M=MV[m.id];
    console.log(`   id${m.id} ${M[1]} ${M[3]}/${M[4]} 威力${M[5]} 命中${M[6]} tag=${M[11]}`);
  }
}
