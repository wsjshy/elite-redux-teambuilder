const H = require('./harness_dbg.js');
const { ERDATA, deriveBuilds } = H;
const WSET=new Set([240,241,201,258,580,581,604,641]);
const combos={};
for(const s of ERDATA.species){
  if(s.base[5]<100)continue;
  let bs;try{bs=deriveBuilds(s,[]);}catch(e){continue}
  for(const b of bs){
    let has=false;for(const m of b.mv.main)if(WSET.has(+m.id))has=true;
    if(!has)continue;
    const key=b.side+' / '+b.roleTag;
    combos[key]=(combos[key]||0)+1;
  }
}
console.log("速≥100 且带天气/场地招的 (side/role) 组合:");
for(const k of Object.keys(combos).sort())console.log(`  ${k}: ${combos[k]}`);
