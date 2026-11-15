// v4.387 E8：以当前引擎（v4.387 改前口径，改描述不影响推荐）重推 v4386 台账 66 档；
// 逐张挖 main/func/core 全部招位找墙招 113/115/657；核类型免疫 × 特性免疫；输出台账 vs 当前差。
const H = require('./harness.js');
const fs = require('fs'), path = require('path');
const { ERDATA, deriveBuilds, MV, _v383ImmAbi } = H;
const dir = __dirname;
const by = id => ERDATA.species.find(s => String(s.id) === String(id));
const allTeam = [26,65,96,80,37,208].map(by);
const R4386 = JSON.parse(fs.readFileSync(path.join(dir,'_ev4386.json'),'utf8'));
const ROWS = R4386.a2.six.noRecRows;

const WALL={113:'光墙',115:'反射壁',657:'极光幕'};
const TYPES=ERDATA.types, matchup=ERDATA.matchup;
const ti=n=>TYPES.indexOf(n);
function typeImmune(defTypes){
  const ds=[...new Set(defTypes.filter(x=>x&&x!=='-').map(ti).filter(x=>x>=0))];
  const res=[];
  for(let a=0;a<TYPES.length;a++){for(const d of ds)if(matchup[d]&&matchup[d][a]===0){res.push(TYPES[a]);break;}}
  return res;
}
function slotMv(b){
  const out={main:[],func:[],core:[]};
  (b.mv&&b.mv.main||[]).forEach(x=>out.main.push(+x.id));
  const f=(b.mv&&(b.mv.func||b.mv.funcs))||[];
  f.forEach(x=>out.func.push(+x.id));
  (b.core||[]).forEach(x=>out.core.push(+x));
  return out;
}
function wallsIn(slots){
  const w=[];
  ['main','func','core'].forEach(k=>slots[k].forEach(id=>{if(WALL[id])w.push(k+':'+id+':'+WALL[id]);}));
  return w;
}

// 当前引擎全库索引：species id -> builds
const cur={};
ERDATA.species.forEach(s=>{let bs;try{bs=deriveBuilds(s,allTeam)}catch(e){return}cur[String(s.id)]=bs;});

const out=[];
ROWS.forEach(r=>{
  const s=by(r.id);
  const bs=cur[String(r.id)]||[];
  const match=bs.find(b=>String(b.name||'')===String(r.name))||null;
  const b=match||bs[0]||null;
  const slots=b?slotMv(b):{main:r.mv,func:[],core:[]};
  const abi0=b&&b.abi&&b.abi[0]?b.abi[0]:null;
  const immAbi=abi0?!!_v383ImmAbi(abi0):false;
  const types=s?[s.t1,s.t2]:['?','?'];
  const immType=s?typeImmune([s.t1,s.t2]):[];
  const walls=b?wallsIn(slots):r.mv.filter(id=>WALL[id]).map(id=>'main:'+id+':'+WALL[id]);
  out.push({
    id:r.id,zh:r.zh,types,ledgerName:r.name,curName:b?String(b.name):'(当前无流派)',
    side:b?String(b.side):r.side,role:b?String(b.roleTag):r.roleTag,
    bulk:r.bulk,ev:r.ev,main:slots.main,func:slots.func,core:slots.core,
    abi0:abi0?String(abi0.n):'(无)',immAbi,immType,imm:immAbi||immType.length>0,
    walls,curFound:!!b,nameMatch:!!match,
  });
});

const bucket=n=>n==='双墙辅助流'?'wall':(n==='属性免疫联防位'?'imm':'other');
const wall=out.filter(r=>bucket(r.ledgerName)==='wall');
const imm=out.filter(r=>bucket(r.ledgerName)==='imm');
const diff=out.filter(r=>bucket(r.ledgerName)!==bucket(r.curName));

console.log('台账66：双墙',wall.length,'免疫',imm.length,'其他',out.filter(r=>bucket(r.ledgerName)==='other').length);
console.log('当前引擎重推：双墙',out.filter(r=>bucket(r.curName)==='wall').length,'免疫',out.filter(r=>bucket(r.curName)==='imm').length,'其他',out.filter(r=>bucket(r.curName)==='other').length);
console.log('台账↔当前 分桶差:',diff.length);
diff.forEach(r=>console.log(`  ✗ #${r.id} ${r.zh} 台账=${r.ledgerName} 当前=${r.curName} role=${r.role}`));

console.log('\n== 免疫桶 19 张：全招位墙招核查 ==');
imm.forEach(r=>console.log(`#${r.id} ${r.zh} [${r.types.join('/')}] 特性=${r.abi0} immAbi=${r.immAbi} 免疫属性=${r.immType.join('/')||'无'} 墙招=[${r.walls.join('|')||'无'}] main=${r.main.join('/')} func=${r.func.join('/')} core=${r.core.join('/')}`));

console.log('\n== 双墙桶 45 张：类型免疫 × 特性免疫 ==');
wall.forEach(r=>console.log(`#${r.id} ${r.zh} [${r.types.join('/')}] 特性=${r.abi0} immAbi=${r.immAbi} 免疫属性=${r.immType.join('/')||'无'} 墙=[${r.walls.join('|')}] main=${r.main.join('/')}`));

const PAIR=['125','310','311','312','1590','2505'];
console.log('\n== 六对同物种双卡 ==');
PAIR.forEach(pid=>{
  out.filter(r=>r.id===pid).forEach(r=>console.log(`#${r.id} ${r.zh} 台账=${r.ledgerName} 当前=${r.curName} role=${r.role} 特性=${r.abi0} immAbi=${r.immAbi} 免疫属性=${r.immType.join('/')||'无'} 墙=[${r.walls.join('|')||'无'}] main=${r.main.join('/')} func=${r.func.join('/')}`));
});

fs.writeFileSync(path.join(dir,'_ev4387_e8.json'),JSON.stringify({out,wall:wall.length,imm:imm.length,diff},null,1));
