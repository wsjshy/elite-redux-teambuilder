const H=require('./harness.js');
const {ERDATA,deriveBuilds,learnOf,MV}=H;
const by=id=>ERDATA.species.find(s=>String(s.id)===String(id));
const allTeam=[26,65,96,80,37,208].map(by);
const REC=new Set([105,234,235,236,355,303,135,208,631,275,392,622,744,915,202,409,532,72,71,837,73]);
const ids=b=>(b.mv.main||[]).concat(b.mv.func||[]).map(x=>+x.id);
const guard=[],rec=[],cover=[];
function scan(team,tag){
  ERDATA.species.forEach(s=>{let bs;try{bs=deriveBuilds(s,team)}catch(e){return;}bs.forEach(b=>{
    const m=b._v387SleepSwap;if(!m)return;
    const mv=ids(b);
    if(/→182/.test(m))guard.push({tag,id:s.id,zh:s.zh,name:b.name,mv:mv.join('/'),learn:learnOf(s).filter(x=>REC.has(x))});
    else if(REC.has(+m.split('→')[1].split(' ')[0]))rec.push({tag,id:s.id,m});
    else cover.push({tag,id:s.id,m});
  });});
}
scan([],'empty');scan(allTeam,'six');
console.log('rec',rec.length,'cover',cover.length,'guard',guard.length);
console.log('\n守住 6 条：');
guard.forEach(g=>console.log(`  ${g.tag} #${g.id} ${g.zh} ${g.name} | ${g.mv} | 可学真回复 ${g.learn.join('/')||'无'}`));
