const H=require('./harness.js');
const {ERDATA,deriveBuilds,NATURES}=H;
console.log('NATURES 固执',JSON.stringify(NATURES['固执']));
console.log('NATURES 慎重',JSON.stringify(NATURES['慎重']));
console.log('NATURES 大胆',JSON.stringify(NATURES['大胆']));
console.log('NATURES 内敛',JSON.stringify(NATURES['内敛']));
const by=id=>ERDATA.species.find(s=>String(s.id)===String(id));
['66','70'].forEach(pid=>{
  const s=by(pid);let bs;try{bs=deriveBuilds(s,null)}catch(e){return;}
  bs.forEach((b,i)=>{
    console.log(`#${pid}[${i}] ${b.name} side=${b.side} role=${b.roleTag} ev=${JSON.stringify((b.ev&&b.ev.alloc)||b.ev)} nat=${(b.nat||[]).map(n=>n[0]).join('/')}`);
  });
});
