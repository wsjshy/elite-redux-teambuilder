const H=require('./harness.js');
const {ERDATA,deriveBuilds}=H;
const by=id=>ERDATA.species.find(s=>String(s.id)===String(id));
const allTeam=[26,65,96,80,37,208].map(by);
['1503','66','70'].forEach(pid=>{
  const s=by(pid);let bs;try{bs=deriveBuilds(s,allTeam)}catch(e){return;}
  bs.forEach((b,i)=>{
    console.log(`#${pid}[${i}] ${b.name} side=${b.side} role=${b.roleTag} ev=${JSON.stringify((b.ev&&b.ev.alloc)||b.ev)} nat=${(b.nat||[]).map(n=>n[0]).join('/')}`);
  });
});
