// v4.387 改前全量快照（双口径，字段同 v4386）；只读，不验证漂移，仅留基线。
const H = require('./harness.js');
const fs = require('fs'), path = require('path');
const { ERDATA, deriveBuilds } = H;
const dir = __dirname;
const by = id => ERDATA.species.find(s => String(s.id) === String(id));
const allTeam = [26, 65, 96, 80, 37, 208].map(by);

const alloc = b => (b.ev && b.ev.alloc) || [0,0,0,0,0,0];
const natStr = b => Array.isArray(b.nat) ? b.nat.map(p=>(p||[]).join(',')).join(',') : String(b.nat||'');
const mvIds = b => (b.mv.main||[]).concat(b.mv.func||[]).map(x=>+x.id);

function snapshot(team){
  const out=[];
  ERDATA.species.forEach(s=>{let bs;try{bs=deriveBuilds(s,team)}catch(e){return}
    bs.forEach(b=>out.push({id:String(s.id),zh:s.zh,name:String(b.name||''),side:String(b.side||''),roleTag:String(b.roleTag||''),
      nat:natStr(b),alloc:alloc(b),tpl:b.ev&&b.ev.template,mv:mvIds(b),it0:b.it&&b.it[0]?String(b.it[0][0]):'',abi0:b.abi&&b.abi[0]?String(b.abi[0].n):''}));
  });
  return out;
}
const snapSix=snapshot(allTeam), snapEmp=snapshot([]);
fs.writeFileSync(path.join(dir,'_v4387_base_snapshot.json'),JSON.stringify({six:snapSix,empty:snapEmp},null,1));
console.log('snapshot six=',snapSix.length,'empty=',snapEmp.length);
