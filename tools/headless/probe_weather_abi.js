const H = require('./harness.js');
const { ERDATA, deriveBuilds, MV } = H;
const WSET = new Set([240,241,201,258,580,581,604,641]);
const OFF_ROLE = ['增伤','输出'];
const rows=[];
for (const s of ERDATA.species) {
  if (s.base[5]<100) continue;
  let builds; try{builds=deriveBuilds(s,[]);}catch(e){continue;}
  for (const b of builds) {
    if (OFF_ROLE.indexOf(b.roleTag)<0||b.side==='辅助') continue;
    if (b.abi[0]&&/恶作剧之心/.test(b.abi[0].n)) continue;
    for (const m of (b.mv.main||[])) if (WSET.has(+m.id))
      rows.push({id:s.id,zh:s.zh,dt:s.base[0]+s.base[2]+s.base[4],name:b.name,
        abi:b.abi[0].n,abiId:b.abi[0].id,allAbis:s.abis});
  }
}
for (const r of rows) {
  const dep = r.allAbis.filter(a=>a!==r.abi);
  console.log(`#${r.id} ${r.zh} [${r.name}] 首特性「${r.abi}」(id${r.abiId}) | 备选:${dep.join('/')||'无'}`);
}
console.log("\n总:",rows.length);
