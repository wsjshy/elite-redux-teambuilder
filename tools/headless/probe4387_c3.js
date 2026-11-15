const H=require('./harness.js');
const {ERDATA,deriveBuilds}=H;
const allTeam=[26,65,96,80,37,208].map(id=>ERDATA.species.find(s=>String(s.id)===String(id)));
['1643','1644','1645','1646','1647'].forEach(pid=>{
  const s=ERDATA.species.find(x=>String(x.id)===pid);
  const bs=deriveBuilds(s,allTeam);
  bs.forEach((b,i)=>{
    const mv=(b.mv&&b.mv.main||[]).map(x=>x.id);
    console.log(`#${pid} ${s.zh} [${i}] ${b.name} ${b.side}/${b.roleTag} alloc=${JSON.stringify(b.ev&&b.ev.alloc)} mv=${mv.join('/')}`);
  });
});
