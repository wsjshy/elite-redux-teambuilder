const H=require('./harness.js');
const {ERDATA,deriveBuilds,MV}=H;
const by=id=>ERDATA.species.find(s=>String(s.id)===String(id));
const allTeam=[26,65,96,80,37,208].map(by);
const REC=new Set([105,234,235,236,355,303,135,208,631,275,392,622,744,915,202,409,532,72,71,837,73]);
function scan(team,tag){
  let rec=0,cover=0,guard=0,keep=0,sleep=0;
  ERDATA.species.forEach(s=>{let bs;try{bs=deriveBuilds(s,team)}catch(e){return;}bs.forEach(b=>{
    const ids=(b.mv.main||[]).concat(b.mv.func||[]).map(x=>+x.id);
    if(ids.indexOf(156)>=0)sleep++;
    const m=b._v387SleepSwap;
    if(!m)return;
    if(/→182/.test(m))guard++;
    else if(REC.has(+m.split('→')[1].split(' ')[0]))rec++;
    else cover++;
    if(b._v387SleepKeep)keep++;
  });});
  console.log(tag,'sleep(当前)',sleep,'rec',rec,'cover',cover,'guard',guard,'keep',keep,'land',rec+cover+guard);
}
scan([],'empty');scan(allTeam,'six');
