// v4.387 零漂移比对：改后全量快照 vs _v4387_base_snapshot.json。
// 允许的唯一变化：C 洛托姆五形态睡觉组 10 条记录 name 改为「主力输出压制」；其余字段/条目顺序必须逐条一致。
const H = require('./harness.js');
const fs = require('fs'), path = require('path');
const { ERDATA, deriveBuilds } = H;
const base = require('./_v4387_base_snapshot.json');
const allTeam = [26, 65, 96, 80, 37, 208].map(id => ERDATA.species.find(s => String(s.id) === String(id)));

const alloc = b => (b.ev && b.ev.alloc) || [0,0,0,0,0,0];
const natStr = b => Array.isArray(b.nat) ? b.nat.map(p=>(p||[]).join(',')).join(',') : String(b.nat||'');
const mvIds = b => (b.mv.main||[]).concat(b.mv.func||[]).map(x=>+x.id);

function snapshot(team){
  const out=[];
  ERDATA.species.forEach(s=>{let bs;try{bs=deriveBuilds(s,team)}catch(e){return}
    bs.forEach(b=>out.push({id:String(s.id),zh:s.zh,name:String(b.name||''),side:String(b.side||''),roleTag:String(b.roleTag||''),
      nat:natStr(b),alloc:alloc(b),tpl:b.ev&&b.ev.template,mv:mvIds(b),it0:b.it&&b.it[0]?String(b.it[0][0]):'',abi0:b.abi&&b.abi[0]?String(b.abi[0].n):'',
      swap:b._v387SleepSwap||b._v386MvSwap||null}));
  });
  return out;
}

const FIELDS = ['side','roleTag','nat','alloc','tpl','mv','it0','abi0'];
const ROT = ['1643','1644','1645','1646','1647'];
let nameChanged = [], otherDiff = [], lenDiff = [];

['six','empty'].forEach(side=>{
  const cur = snapshot(side==='six'?allTeam:[]);
  const old = base[side];
  if(cur.length!==old.length){lenDiff.push(side+': '+old.length+' -> '+cur.length);}
  const n=Math.min(cur.length,old.length);
  for(let i=0;i<n;i++){
    const a=old[i], b=cur[i];
    if(a.id!==b.id){otherDiff.push(side+'['+i+'] id 顺序漂移 '+a.id+' -> '+b.id);continue;}
    FIELDS.forEach(f=>{
      if(f==='mv'&&b.swap)return; // 授权换招（D 睡觉替换 / v4386 玻璃大炮）mv 漂移
      if(JSON.stringify(a[f])!==JSON.stringify(b[f]))otherDiff.push(side+'['+i+'] #'+b.id+' '+b.zh+' '+f+' 漂移');
    });
    if(a.name!==b.name){
      const ok = ROT.includes(b.id) && a.name==='属性免疫联防位' && b.name==='主力输出压制';
      if(ok) nameChanged.push(side+'['+i+'] #'+b.id+' '+b.zh+': '+a.name+' -> '+b.name);
      else otherDiff.push(side+'['+i+'] #'+b.id+' '+b.zh+' 名非授权变化: '+a.name+' -> '+b.name);
    }
  }
});

console.log('改名记录数:', nameChanged.length);
nameChanged.forEach(x=>console.log('  ✓', x));
console.log('非授权漂移:', otherDiff.length);
otherDiff.forEach(x=>console.log('  ✗', x));
console.log('条数差异:', lenDiff.length?lenDiff:'0');
process.exit(otherDiff.length+lenDiff.length===0 ? 0 : 1);
