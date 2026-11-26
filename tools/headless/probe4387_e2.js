// v4.387 E2：在 v4386 台账 66 档（玻璃大炮+睡觉+无可学自回血）内定位 双墙↔免疫 边界卡
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
// 方向锚点已核：matchup[def][atk]
function typeImmune(defTypes){
  const ds=[...new Set(defTypes.filter(x=>x&&x!=='-').map(ti).filter(x=>x>=0))];
  const res=[];
  for(let a=0;a<TYPES.length;a++){for(const d of ds)if(matchup[d]&&matchup[d][a]===0){res.push(TYPES[a]);break;}}
  return res;
}

// 当前引擎按 id+name 匹配，取 abi0/types
const cur={};
ERDATA.species.forEach(s=>{let bs;try{bs=deriveBuilds(s,allTeam)}catch(e){return}
  bs.forEach(b=>{const k=String(s.id)+'|'+String(b.name||'');(cur[k]=cur[k]||[]).push(b);});
});

const out=[];
ROWS.forEach(r=>{
  const s=by(r.id);
  const cands=cur[String(r.id)+'|'+r.name]||[];
  const b=cands[0]||null;
  const abi0=b&&b.abi&&b.abi[0]?String(b.abi[0].n):(b?'(无abi)':'(当前无此流派)');
  const abiObj=b&&b.abi&&b.abi[0]?b.abi[0]:null;
  const immAbi=abiObj?!!_v383ImmAbi(abiObj):false;
  const types=s?[s.t1,s.t2]:['?','?'];
  const immType=s?typeImmune([s.t1,s.t2]):[];
  const walls=r.mv.filter(id=>WALL[id]);
  out.push({id:r.id,zh:r.zh,types,name:r.name,role:r.roleTag,side:r.side,bulk:r.bulk,ev:r.ev,mv:r.mv,
    abi0:abi0,immAbi,immType,imm:immAbi||immType.length>0,walls:walls.map(x=>x+':'+WALL[x]),curFound:!!b});
});

const wall=out.filter(r=>r.name==='双墙辅助流');
const imm=out.filter(r=>r.name==='属性免疫联防位');
console.log('台账66：双墙',wall.length,'免疫',imm.length,'其他',out.filter(r=>!['双墙辅助流','属性免疫联防位'].includes(r.name)).length);
console.log('\n== 双墙卡中同时满足免疫判据（候选：用户口径落免疫）==');
wall.filter(r=>r.imm).forEach(r=>console.log(`#${r.id} ${r.zh} [${r.types.join('/')}] 特性=${r.abi0} immAbi=${r.immAbi} 免疫属性=${r.immType.join('/')} 墙=${r.walls.join('/')} cur=${r.curFound} | ${r.mv.map(x=>x+':'+(MV[x]?MV[x][1]:x)).join(' ')}`));
console.log('\n== 免疫卡中同时带墙招（候选：用户口径落双墙）==');
imm.filter(r=>r.walls.length>0).forEach(r=>console.log(`#${r.id} ${r.zh} [${r.types.join('/')}] 特性=${r.abi0} immAbi=${r.immAbi} 免疫属性=${r.immType.join('/')} 墙=${r.walls.join('/')} cur=${r.curFound} | ${r.mv.map(x=>x+':'+(MV[x]?MV[x][1]:x)).join(' ')}`));

console.log('\n== 19 免疫卡逐条 ==');
imm.forEach(r=>console.log(`#${r.id} ${r.zh} [${r.types.join('/')}] 特性=${r.abi0} immAbi=${r.immAbi} 免疫属性=${r.immType.join('/')} 墙=${r.walls.join('|')||'无'} | ${r.mv.map(x=>x+':'+(MV[x]?MV[x][1]:x)).join(' ')}`));

fs.writeFileSync(path.join(dir,'_ev4387_e2.json'),JSON.stringify({out,wall:wall.length,imm:imm.length,
  wallAlsoImm:wall.filter(r=>r.imm),immAlsoWall:imm.filter(r=>r.walls.length>0)},null,1));
