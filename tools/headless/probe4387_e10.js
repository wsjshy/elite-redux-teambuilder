const H = require('./harness.js');
const fs = require('fs'), path = require('path');
const { ERDATA, deriveBuilds, MV, _v383ImmAbi } = H;
const by = id => ERDATA.species.find(s => String(s.id) === String(id));
const allTeam = [26,65,96,80,37,208].map(by);
const R4386 = JSON.parse(fs.readFileSync(path.join(__dirname,'_ev4386.json'),'utf8'));
const ROWS = R4386.a2.six.noRecRows;
const WALL={113:1,115:1,657:1};
const IMM=['38','125','135','136','310','311','312','523','695','777','815','1075','1097','1590','1801','1812','1813','1864','2505'];

function collectMvIds(obj, acc, trail){
  if(obj==null)return;
  if(Array.isArray(obj)){obj.forEach((x,i)=>collectMvIds(x,acc,trail+'['+i+']'));return;}
  if(typeof obj==='object'){for(const k of Object.keys(obj)){
    if(k==='id'&&typeof obj[k]==='number')acc.push(trail+'.id='+obj[k]);
    collectMvIds(obj[k],acc,trail+'.'+k);
  }}
}
ERDATA.species.forEach(s=>{
  if(!IMM.includes(String(s.id)))return;
  let bs;try{bs=deriveBuilds(s,allTeam)}catch(e){return;}
  bs.forEach((b,bi)=>{
    const acc=[];collectMvIds(b.mv,acc,'mv');collectMvIds(b.core,acc,'core');
    const walls=acc.filter(t=>WALL[+t.split('=')[1]]);
    console.log(`#${s.id} ${s.zh||s.name} [${bi}] ${b.name} walls=${walls.join('|')||'无'} allIds=[${acc.map(t=>t.split('=')[1]).join(',')}]`);
  });
});
