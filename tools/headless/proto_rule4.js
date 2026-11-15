const H = require('./harness_dbg.js');
const { ERDATA, MV, pickAttacks, pickAbiFor, ownAutoSys,
        abiSysOf, abiSetOf, abiSetExt, mvKindOf } = H;
const CHARGE_REG=/飞翔|挖洞|潜水|日光束|弹跳|自由落体|破坏光线|终极冲击|蓄力|影子之力/;
const WSET=new Set([240,241,201,258,580,581,604,641]);
const SOLAR=new Set([76,632]);
const WXWORDS={240:['雨'],241:['晴'],201:['沙'],258:['雪','冰雹'],580:['场地'],581:['场地'],604:['场地'],641:['场地']};
const ABI_BY_NAME={};Object.values(ERDATA.abilities).forEach(a=>{ABI_BY_NAME[a[2]]=a});
function descOf(n){const a=ABI_BY_NAME[n];return a?String(a[3]||''):''}
function badAbi(n,setupId){
  const d=descOf(n);if(!d)return false;
  // 纯双打同伴辅助（单打无价值）
  if(/双打/.test(d)&&/同伴/.test(d))return true;
  // 依赖被移除天气的增益（含天气词且有提升/×）
  const words=WXWORDS[setupId]||[];
  for(const w of words){if(d.indexOf(w)>-1&&/(提升|增至|×|回复|闪避|速度|威力|能力)/.test(d))return true}
  return false;
}

function transform(s,b){
  const sp=+s.base[5], side=String(b.side), role=String(b.roleTag);
  const isOff=(side==='物理'||side==='特殊'||side==='双刀')&&(role==='增伤'||role==='输出'||role==='强化');
  const prank=(b.abi[0]&&/恶作剧之心/.test(b.abi[0].n));
  const auto=ownAutoSys(s);
  if(!(sp>=100&&isOff&&!prank&&!auto.length))return null;
  const main=b.mv.main;let wi=-1,setupId=null;
  for(let w=0;w<main.length;w++){if(WSET.has(+main[w].id)){wi=w;setupId=+main[w].id;break}}
  if(wi<0)return null;
  const sd=(side==='双刀')?'双刀':(side==='物理'?'物理':'特殊');
  const pool=pickAttacks(s,sd,40,role);
  const used={};main.forEach(x=>used[''+x.id]=1);
  const haveTy={};main.forEach(x=>{const m=MV[x.id];if(m)haveTy[m[3]]=1});
  function pickOne(){let rep=null;
    for(const o of pool){if(!o||used[''+o.id]||haveTy[o.ty])continue;const M=MV[o.id];
      if(M&&(+M[5]||0)>=70&&(+M[6]||0)>=90&&!CHARGE_REG.test(M[1])){rep=o;break}}
    if(!rep)for(const o of pool){if(!o||used[''+o.id])continue;const M=MV[o.id];
      if(M&&!CHARGE_REG.test(M[1])){rep=o;break}}
    return rep}
  function fillSlot(idx){const rep=pickOne();
    if(rep){main[idx]={id:+rep.id,kind:mvKindOf(+rep.id),tag:'补盲',why:[]};used[''+rep.id]=1;haveTy[rep.ty]=1;return MV[rep.id][1]}
    return '（无补位）'}
  const out={setup:fillSlot(wi),solar:[]};
  for(let i=0;i<main.length;i++)if(SOLAR.has(+main[i].id))out.solar.push(MV[main[i].id][1]+'→'+fillSlot(i));
  out.abi='（不变）';
  const abn=b.abi[0].n,dep=abiSysOf(abn),set=abiSetOf(abn),sete=abiSetExt(abn);
  if(dep&&!set&&!sete){
    const rank=pickAbiFor(s,side,role,{});let pick=null;
    for(const c of rank){
      if(abiSysOf(c.n)||abiSetOf(c.n)||abiSetExt(c.n))continue;
      if(badAbi(c.n,setupId))continue;
      pick=c;break}
    if(pick){b.abi[0]={n:pick.n,id:pick.id,sc:pick.sc,why:[]};out.abi=pick.n}
  }
  const ch=String(b.name).charAt(0);
  if('雨晴沙雪'.indexOf(ch)>-1)b.name=String(b.name).replace(ch,'');
  out.name=b.name;return out;
}

let n=0;
for(const s of OLD_LOOP()){}
function OLD_LOOP(){return []}
const OLD=require('C:/temp/er4378/harness.js');
for(const s of OLD.ERDATA.species){
  if(s.base[5]<100)continue;
  for(const b of OLD.deriveBuilds(s,[])){
    const r=transform(s,b);
    if(r){n++;
      console.log(`#${s.id} ${s.zh} →「${r.name}」 开→「${r.setup}」${r.solar.length?(' 蓄力: '+r.solar.join('; ')):''} 特性「${r.abi}」`);
      console.log(`     ${b.mv.main.map(x=>MV[x.id][1]).join('/')} | ${b.abi[0].n}`)}
  }
}
console.log("\n转换条数:",n);
