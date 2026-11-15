const H = require('./harness.js');
const { ERDATA, deriveBuilds, MV } = H;
const WSET=new Set([240,241,201,258,580,581,604,641]);
let remain=[];
for(const s of ERDATA.species){
  if(+s.base[5]<100)continue;
  for(const b of deriveBuilds(s,[])){
    const side=String(b.side),role=String(b.roleTag);
    const off=(side==='物理'||side==='特殊'||side==='双刀')&&(role==='增伤'||role==='输出'||role==='强化');
    if(!off)continue;
    const prank=b.abi[0]&&/恶作剧之心/.test(b.abi[0].n);
    if(prank)continue;
    for(const m of b.mv.main)if(WSET.has(+m.id))remain.push(s.id+' '+b.name+' '+MV[m.id][1]);
  }
}
console.log('速攻进攻流派残留天气/场地招:', remain.length);
remain.forEach(x=>console.log(' ',x));
