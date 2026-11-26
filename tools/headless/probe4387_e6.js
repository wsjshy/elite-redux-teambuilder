// v4.387 E6：从 harness 全变体重推 66 档，逐张列 name/kit/abi0/types/墙/类型免疫/特性免疫，找边界卡
const fs=require('fs'),path=require('path');
const dir=__dirname;
const H=require('./harness.js');
const {ERDATA,deriveBuilds}=H;
const E2=JSON.parse(fs.readFileSync(path.join(dir,'_ev4387_e2.json'),'utf8'));
const WALL=new Set([113,115,657]);
const TYPES=ERDATA.types||[], matchup=ERDATA.matchup||{};
const typeId=nm=>TYPES.indexOf(nm);
const mvZh=id=>H.MV[id]?(H.MV[id][1]||H.MV[id][2]||String(id)):String(id);
function typeImmune(types){
  const defIds=[...new Set(types.filter(t=>t&&t!=='-').map(typeId).filter(x=>x>=0))];
  const res=[];
  for(let a=0;a<TYPES.length;a++)for(const d of defIds){const row=matchup[d];if(row&&row[a]===0){res.push(TYPES[a]);break;}}
  return [...new Set(res)];
}
const key=arr=>arr.map(x=>+x).sort((a,b)=>a-b).join(',');
const out=[];
E2.out.forEach(r=>{
  const mv=r.mv.map(Number);
  let bs=[];try{bs=deriveBuilds(ERDATA.species.find(s=>String(s.id)===String(r.id)),[]);}catch(e){}
  const fb=bs.find(b=>key((b.mv.main||[]).concat(b.mv.func||[]).map(x=>+x.id))===key(mv))||bs[0]||null;
  const types=(fb&&fb.types)||r.types||[];
  const abi0=fb&&fb.abi&&fb.abi[0]?fb.abi[0].n:r.abi0;
  const abiId=fb&&fb.abi&&fb.abi[0]?fb.abi[0].id:null;
  const walls=mv.filter(id=>WALL.has(id));
  out.push({id:r.id,zh:r.zh,types,name:r.name,freshName:fb?fb.name:null,side:fb?fb.side:r.side,roleTag:fb?fb.roleTag:r.roleTag,
    mv,wall:walls.map(id=>id+':'+mvZh(id)),typeImm:typeImmune(types),immAbi:r.immAbi,abi0,abiId,
    allVariants:bs.map(b=>({name:b.name,mv:key((b.mv.main||[]).concat(b.mv.func||[]).map(x=>+x.id)),abi0:b.abi&&b.abi[0]?b.abi[0].n:''}))});
});
const imm=out.filter(x=>x.name==='属性免疫联防位');
const wall=out.filter(x=>x.name==='双墙辅助流');
console.log('重推 免疫',imm.length,'双墙',wall.length,'其他',out.length-imm.length-wall.length);
console.log('\n=== 免疫档全变体（查是否有变体带墙招）===');
imm.forEach(x=>{
  const vWall=x.allVariants.filter(v=>v.mv.split(',').some(id=>WALL.has(+id)));
  console.log(`#${x.id} ${x.zh} 当前=${x.name} 墙=${x.wall.join('/')||'无'} 类型免疫=${x.typeImm.join('/')||'无'} 特性免疫=${x.immAbi} abi0=${x.abi0}(${x.abiId})`);
  if(vWall.length)console.log('   !! 同物种另有带墙变体:',JSON.stringify(vWall));
});
console.log('\n=== 双墙档中带类型免疫的 ===');
wall.filter(x=>x.typeImm.length).forEach(x=>console.log(`#${x.id} ${x.zh} 类型免疫=${x.typeImm.join('/')} 墙=${x.wall.join('/')} abi0=${x.abi0}`));
fs.writeFileSync(path.join(dir,'_ev4387_e6.json'),JSON.stringify({out,imm,wall},null,1));
