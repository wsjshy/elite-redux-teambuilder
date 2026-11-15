const H=require('./harness.js');
const {ERDATA,deriveBuilds}=H;
const by=id=>ERDATA.species.find(s=>String(s.id)===String(id));
const allTeam=[26,65,96,80,37,208].map(by);
const ids=b=>(b.mv.main||[]).concat(b.mv.func||[]).map(x=>+x.id);
function show(id){
  const s=by(id);let bs;try{bs=deriveBuilds(s,allTeam)}catch(e){}
  bs.forEach((b,i)=>{const m=b._v387SleepSwap||b._v387SleepKeep||'—';const why=(b.mv.main||[]).concat(b.mv.func||[]).find(x=>+x.id===156);
    console.log(`#${id} [${i}] ${b.name} | ${ids(b).join('/')} | ${m}`);
    if(why&&why.why)console.log('   睡觉 why:',why.why.join(' / '));
    const sw=(b.mv.main||[]).concat(b.mv.func||[]).find(x=>b._v387SleepSwap&&String(b._v387SleepSwap).indexOf('→'+x.id)>=0);
    if(sw&&sw.why)console.log('   换招 why:',sw.why.join(' / '));});
}
['96','95','263','1503','265'].forEach(show);
