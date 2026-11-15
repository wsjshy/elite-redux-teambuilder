const H=require('./harness.js');
const {ERDATA,deriveBuilds,NATURES,keptNatList}=H;
const by=id=>ERDATA.species.find(s=>String(s.id)===String(id));
const allTeam=[26,65,96,80,37,208].map(by);
['1503','66','70'].forEach(pid=>{
  const s=by(pid);let bs;try{bs=deriveBuilds(s,allTeam)}catch(e){console.log(pid,'ERR',e.message);return;}
  bs.forEach((b,i)=>{
    const k=keptNatList(b.nat);
    console.log(`#${pid}[${i}] ${b.name} side=${b.side} role=${b.roleTag} 原始=${(b.nat||[]).map(n=>n[0]).join('/')} 过滤后=${k.map(n=>n[0]).join('/')}`);
  });
});
