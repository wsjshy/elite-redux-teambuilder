const H = require('./harness_dbg.js');
const { ERDATA, deriveBuilds, MV } = H;
const WSET=new Set([240,241,201,258,580,581,604,641]);
let funcHits=0;
for(const s of ERDATA.species){
  if(s.base[5]<100)continue;
  let builds;try{builds=deriveBuilds(s,[]);}catch(e){continue}
  for(const b of builds){
    for(const m of (b.mv.func||[]))if(WSET.has(+m.id)){funcHits++;
      console.log(`#${s.id} ${s.zh} [${b.name}] func带${MV[m.id][1]}`)}
  }
}
console.log("func槽天气/场地命中:",funcHits);
