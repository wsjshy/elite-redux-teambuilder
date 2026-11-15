const H=require('./harness.js');
const {ERDATA,deriveBuilds,MV}=H;
const by=id=>ERDATA.species.find(s=>String(s.id)===String(id));
const allTeam=ERDATA.species.slice(0,6).map(s=>s.id).map(by);
['1643','1644','1645','1646','1647'].forEach(pid=>{
  const s=by(pid);let bs;try{bs=deriveBuilds(s,allTeam)}catch(e){return;}
  bs.forEach((b,i)=>{
    const ids=(b.mv.main||[]).concat(b.mv.func||[]).map(x=>x.id);
    const names=ids.map(id=>MV[id]?MV[id][1]:id);
    console.log(`#${pid}[${i}] ${b.name} side=${b.side} role=${b.roleTag} ev=${JSON.stringify((b.ev&&b.ev.alloc)||b.ev)} mv=${ids.join(',')} (${names.join('/')})`);
  });
});
console.log('--- 1905 ---');
const s1905=by('1905');let b1905;try{b1905=deriveBuilds(s1905,allTeam)}catch(e){}
(b1905||[]).forEach((b,i)=>console.log(`#1905[${i}] ${b.name} side=${b.side} role=${b.roleTag}`));
