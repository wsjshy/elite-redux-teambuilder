// v4.387 E5：66 档内 墙招(113/115/657) × 类型免疫(matchup[def][atk]===0) 交叉；六对双卡逐张核
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
  for(let a=0;a<TYPES.length;a++){
    for(const d of defIds){const row=matchup[d];if(row&&row[a]===0){res.push(TYPES[a]);break;}}
  }
  return [...new Set(res)];
}

// 重跑引擎补 roleTag/side（按 kit 招式集合匹配）
function freshOf(id, mvSet){
  let bs;try{bs=deriveBuilds(ERDATA.species.find(s=>String(s.id)===String(id)),[]);}catch(e){return null;}
  const key=arr=>arr.map(x=>+x).sort((a,b)=>a-b).join(',');
  const k=key(mvSet);
  return bs.find(b=>key((b.mv.main||[]).concat(b.mv.func||[]).map(x=>+x.id))===k)||bs[0]||null;
}

const out=[];
E2.out.forEach(r=>{
  const mv=r.mv.map(Number);
  const walls=mv.filter(id=>WALL.has(id));
  const tImm=typeImmune(r.types);
  const fb=freshOf(r.id,mv)||{};
  out.push({id:r.id,zh:r.zh,types:r.types,name:r.name,side:fb.side||r.side,roleTag:fb.roleTag||r.roleTag,
    mv:mv,wall: walls.map(id=>id+':'+mvZh(id)),hasWall:walls.length>0,
    typeImm:tImm,immAbi:r.immAbi,abi0:r.abi0});
});

const both=out.filter(r=>r.hasWall&&r.typeImm.length>0);
const immOnly=out.filter(r=>!r.hasWall&&r.typeImm.length>0);
const wallOnly=out.filter(r=>r.hasWall&&r.typeImm.length===0);

const pairs=['125','310','311','312','1590','2505'];
const pairRows=pairs.flatMap(p=>out.filter(r=>String(r.id)===p));

const res={both,immOnlyCount:immOnly.length,wallOnlyCount:wallOnly.length,pairRows,all:out};
fs.writeFileSync(path.join(dir,'_ev4387_e5.json'),JSON.stringify(res,null,1));

console.log('同时具备墙招 + 类型免疫:',both.length);
both.forEach(r=>console.log(`  #${r.id} ${r.zh} ${r.name}｜${r.side}/${r.roleTag}｜墙 ${r.wall.join('/')}｜类型免疫 ${r.typeImm.join('/')}｜特性免疫 ${r.immAbi}｜${r.mv.map(mvZh).join(' ')}`));
console.log('\n六对双卡逐张:');
pairRows.forEach(r=>console.log(`  #${r.id} ${r.zh} ${r.name}｜${r.side}/${r.roleTag}｜墙 ${r.hasWall?'有('+r.wall.join('/')+')':'无'}｜类型免疫 ${r.typeImm.join('/')||'无'}｜特性免疫 ${r.immAbi}｜${r.mv.map(mvZh).join(' ')}`));
console.log('\n仅墙招无类型免疫',wallOnly.length,'；仅类型免疫无墙招',immOnly.length);
