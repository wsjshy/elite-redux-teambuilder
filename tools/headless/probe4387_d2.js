// v4.387 D2：456 条须替换卡中「战术依赖睡眠状态」量化（只读，不替换）
const fs=require('fs'),path=require('path');
const dir=__dirname;
const D=JSON.parse(fs.readFileSync(path.join(dir,'_ev4387_d.json'),'utf8'));

// 自身睡觉时才可使用：173 打鼾 / 214 梦话；替换 156 会直接废掉这两招
const OWN_DEP={173:'打鼾',214:'梦话'};
// 目标睡觉时才生效（敌方睡眠，不依赖自身 156，单列）
const TGT_DEP={138:'食梦',171:'恶梦',960:'睡梦侵袭'};

const mvIds=r=>r.mv.map(s=>+String(s).split(':')[0]);
const rows=D.empty.replaceRows;

const own=rows.filter(r=>mvIds(r).some(id=>OWN_DEP[id]));
const tgt=rows.filter(r=>mvIds(r).some(id=>TGT_DEP[id]));
const ownIds=[...new Set(own.map(r=>r.id))];
const tgtIds=[...new Set(tgt.map(r=>r.id))];

// 整套围绕睡觉：含自睡眠依赖招，且伤害招≤1（其余为变化/保命/强化）
const dmgMv=new Set();
const H=require('./harness.js');
rows.forEach(r=>mvIds(r).forEach(id=>{const m=H.MV[id];if(m&&m[5]>0)dmgMv.add(id);}));
const core=own.filter(r=>mvIds(r).filter(id=>{const m=H.MV[id];return m&&m[5]>0&&!OWN_DEP[id];}).length<=1);

const out={
  replaceTotal:rows.length,
  ownDepCount:own.length, ownDepIds:ownIds,
  tgtDepCount:tgt.length, tgtDepIds:tgtIds,
  coreAroundSleep:core.length,
  ownRows:own, tgtRows:tgt, coreRows:core,
};
fs.writeFileSync(path.join(dir,'_ev4387_d2.json'),JSON.stringify(out,null,1));
console.log('须替换总数',rows.length);
console.log('含自身睡眠依赖招(173打鼾/214梦话)',own.length,'条 / 物种',ownIds.length);
console.log('含目标睡眠招(138食梦/171恶梦/960睡梦侵袭)',tgt.length,'条 / 物种',tgtIds.length);
console.log('其中整套围绕睡觉(自睡眠依赖+伤害招≤1)',core.length);
console.log('\n自睡眠依赖样例 10:');
own.slice(0,10).forEach(r=>console.log(`  #${r.id} ${r.zh}#${r.idx} ${r.name}｜${r.side}/${r.roleTag}｜bulk ${r.bulk} D${r.def}/SpD${r.spd}｜回复 ${r.recovery.join('/')||'无'}｜${r.mv.join(' ')}`));
console.log('\n整套围绕睡觉清单:');
core.forEach(r=>console.log(`  #${r.id} ${r.zh}#${r.idx} ${r.name}｜${r.mv.join(' ')}`));
