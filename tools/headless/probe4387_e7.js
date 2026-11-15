// v4.387 E7：66 档按用户规则（墙招优先双墙；否则免疫特性/属性免疫→免疫）重分，定位与引擎名的 1 张错位
const fs=require('fs'),path=require('path');
const dir=__dirname;
const H=require('./harness.js');
const {ERDATA,deriveBuilds,MV,_v383ImmAbi}=H;
const R4386=JSON.parse(fs.readFileSync(path.join(dir,'_ev4386.json'),'utf8'));
const ROWS=R4386.a2.six.noRecRows;
const WALL=new Set([113,115,657]);
const TYPES=ERDATA.types,matchup=ERDATA.matchup,ti=n=>TYPES.indexOf(n);
function typeImmune(defTypes){
  const ds=[...new Set(defTypes.filter(x=>x&&x!=='-').map(ti).filter(x=>x>=0))];
  const res=[];for(let a=0;a<TYPES.length;a++)for(const d of ds)if(matchup[d]&&matchup[d][a]===0){res.push(TYPES[a]);break;}
  return [...new Set(res)];
}
const key=arr=>arr.map(x=>+x).sort((a,b)=>a-b).join(',');
const out=[];
ROWS.forEach(r=>{
  const s=ERDATA.species.find(x=>String(x.id)===String(r.id));
  let bs=[];try{bs=deriveBuilds(s,[]);}catch(e){}
  const mv=r.mv.map(Number);
  const fb=bs.find(b=>key((b.mv.main||[]).concat(b.mv.func||[]).map(x=>+x.id))===key(mv))||bs[0]||null;
  const types=s?[s.t1,s.t2]:[];
  const abiObj=fb&&fb.abi&&fb.abi[0]?fb.abi[0]:null;
  const immAbi=abiObj?!!_v383ImmAbi(abiObj):false;
  const tImm=typeImmune(types);
  const hasWall=mv.some(id=>WALL.has(id));
  const userBucket=hasWall?'双墙辅助流':(immAbi||tImm.length?'属性免疫联防位':'其他');
  out.push({id:r.id,zh:r.zh,types,name:r.name,userBucket,hasWall,immAbi,tImm,abi0:abiObj?abiObj.n:'(无)',abiId:abiObj?abiObj.id:null,mv});
});
const diff=out.filter(x=>x.name!==x.userBucket);
const g={};out.forEach(x=>g[x.name]=(g[x.name]||0)+1);
console.log('引擎名分布',JSON.stringify(g));
const ug={};out.forEach(x=>ug[x.userBucket]=(ug[x.userBucket]||0)+1);
console.log('用户规则分布',JSON.stringify(ug));
console.log('\n=== 与引擎名不符（' + diff.length + '）===');
diff.forEach(x=>console.log(`#${x.id} ${x.zh} 引擎=${x.name} 用户=${x.userBucket} 墙=${x.hasWall?'有':'无'} 特性免疫=${x.immAbi} 类型免疫=${x.tImm.join('/')||'无'} abi0=${x.abi0}(${x.abiId}) mv=${x.mv.map(id=>id+':'+(MV[id]?MV[id][1]:id)).join(' ')}`));
fs.writeFileSync(path.join(dir,'_ev4387_e7.json'),JSON.stringify({out,diff},null,1));
