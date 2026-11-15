const H = require('./harness_dbg.js');
const { ERDATA, pickAbiFor, abiSysOf, abiSetOf, abiSetExt } = H;
for(const tid of ['229','2672']) {
  const s=ERDATA.species.find(x=>String(x.id)===tid);
  console.log(`\n#${tid} ${s.zh} side/role 探测`);
  const side=String(H.deriveBuilds(s,[])[0].side);
  const role=String(H.deriveBuilds(s,[])[0].roleTag);
  const rank=pickAbiFor(s,side,role,{});
  rank.forEach(c=>{
    console.log(`  ${c.n} id${c.id} sys=${abiSysOf(c.n)} set=${abiSetOf(c.n)} ext=${abiSetExt(c.n)}`);
  });
}
