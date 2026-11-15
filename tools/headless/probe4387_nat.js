const H=require('./harness.js');
const {ERDATA,deriveBuilds,NATURES}=H;
const by=id=>ERDATA.species.find(s=>String(s.id)===String(id));
const allTeam=[26,65,96,80,37,208].map(by);
['1503','66','70'].forEach(pid=>{
  const s=by(pid);let bs;try{bs=deriveBuilds(s,allTeam)}catch(e){console.log(pid,e.message);return;}
  console.log('\n#'+pid,s.zh);
  bs.forEach((b,i)=>{
    console.log(` [${i}] ${b.name} nat=${JSON.stringify(b.nat)}`);
    const abis=(b.abi||[]).map(a=>a.n+'::'+(Array.isArray(a.why)?a.why.join('；'):String(a.why||'')));
    abis.forEach(x=>console.log('    abi',x));
    if(b.ev&&b.ev.summary)console.log('    ev.summary',JSON.stringify(b.ev.summary));
  });
});
