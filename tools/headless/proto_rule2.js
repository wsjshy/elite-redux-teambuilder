const H = require('./harness_dbg.js');
const { ERDATA, MV, pickAttacks, pickAbiFor, ownAutoSys,
        abiSysOf, abiSetOf, abiSetExt, mvKindOf } = H;
const CHARGE_REG=/飞翔|挖洞|潜水|日光束|弹跳|自由落体|破坏光线|终极冲击|蓄力|影子之力/;
const WSET=new Set([240,241,201,258,580,581,604,641]);
const SOLAR=new Set([76,632]);

function transform(s,b){
  const sp=+s.base[5], side=String(b.side), role=String(b.roleTag);
  const isOff=(side==='物理'||side==='特殊'||side==='双刀')&&(role==='增伤'||role==='输出'||role==='强化');
  const prank=(b.abi[0]&&/恶作剧之心/.test(b.abi[0].n));
  const auto=ownAutoSys(s);
  if(!(sp>=100&&isOff&&!prank&&!auto.length))return null;
  const main=b.mv.main;let wi=-1;
  for(let w=0;w<main.length;w++)if(WSET.has(+main[w].id)){wi=w;break}
  if(wi<0)return null;
  const sd=(side==='双刀')?'双刀':(side==='物理'?'物理':'特殊');
  const pool=pickAttacks(s,sd,40,role);
  const used={};function recalc(){main.forEach(x=>used[''+x.id]=1)}
  const haveTy={};function recalcTy(){main.forEach(x=>{const m=MV[x.id];if(m)haveTy[m[3]]=1})}
  recalc();recalcTy();
  function pickOne(){
    let rep=null;
    for(const o of pool){if(!o||used[''+o.id]||haveTy[o.ty])continue;const M=MV[o.id];
      if(M&&(+M[5]||0)>=70&&(+M[6]||0)>=90&&!CHARGE_REG.test(M[1])){rep=o;break}}
    if(!rep)for(const o of pool){if(!o||used[''+o.id])continue;const M=MV[o.id];
      if(M&&!CHARGE_REG.test(M[1])){rep=o;break}}
    return rep;
  }
  function fillSlot(idx,whyTag){
    const rep=pickOne();
    if(rep){main[idx]={id:+rep.id,kind:mvKindOf(+rep.id),tag:'补盲',why:[]};
      used[''+rep.id]=1;haveTy[rep.ty]=1;return MV[rep.id][1]}
    return '（无补位）';
  }
  const out={setup:fillSlot(wi)};
  // 第二遍：替换残留蓄力招（日光束/日光刃）
  out.solar=[];
  for(let i=0;i<main.length;i++){if(SOLAR.has(+main[i].id)){
    out.solar.push(MV[main[i].id][1]+'→'+fillSlot(i));
  }}
  // 特性
  out.abi='（不变）';
  const abn=b.abi[0].n,dep=abiSysOf(abn),set=abiSetOf(abn),setE=abiSetExt(abn);
  if(dep&&!set&&!setE){
    const rank=pickAbiFor(s,side,role,{});let pick=null;
    for(const c of rank){if(!abiSysOf(c.n)&&!abiSetOf(c.n)&&!abiSetExt(c.n)){pick=c;break}}
    if(pick){b.abi[0]={n:pick.n,id:pick.id,sc:pick.sc,why:[]};out.abi=pick.n}
  }
  // 名
  const ch=String(b.name).charAt(0);
  if('雨晴沙雪'.indexOf(ch)>-1){b.name=String(b.name).replace(ch,'')}
  out.name=b.name;
  return out;
}

let n=0;
for(const s of ERDATA.species){
  if(s.base[5]<100)continue;
  let bs;try{bs=H.deriveBuilds(s,[]);}catch(e){continue}
  for(const b of bs){
    const r=transform(s,b);
    if(r){n++;
      console.log(`#${s.id} ${s.zh} →「${r.name}」 开招补「${r.setup}」${r.solar.length?(' 蓄力: '+r.solar.join('; ')):''} 特性「${r.abi}」`);
      console.log(`     最终: ${b.mv.main.map(x=>MV[x.id][1]).join('/')} | ${b.abi[0].n}`);
    }
  }
}
console.log("\n转换条数:",n);
