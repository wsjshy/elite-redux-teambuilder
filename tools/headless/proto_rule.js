const H = require('./harness_dbg.js');
const { ERDATA, deriveBuilds, MV, pickAttacks, pickAbiFor, ownAutoSys,
        abiSysOf, abiSetOf, abiSetExt, mvKindOf } = H;
const CHARGE=/飞翔|挖洞|潜水|日光束|弹跳|自由落体|破坏光线|终极冲击|蓄力|影子之力/;
const WXIDS=[240,241,201,258,580,581,604,641];
const WSET=new Set(WXIDS);

function transform(s,b){
  const sp=+s.base[5], side=String(b.side), role=String(b.roleTag);
  const isOff=(side==='物理'||side==='特殊'||side==='双刀')&&(role==='增伤'||role==='输出'||role==='强化');
  const prank=(b.abi[0]&&/恶作剧之心/.test(b.abi[0].n));
  const auto=ownAutoSys(s);
  if(!(sp>=100&&isOff&&!prank&&!auto.length))return null;
  const main=b.mv.main;let wi=-1;
  for(let w=0;w<main.length;w++)if(WSET.has(+main[w].id)){wi=w;break}
  if(wi<0)return null;
  const used={};main.forEach(x=>used[''+x.id]=1);
  const haveTy={};main.forEach(x=>{const m=MV[x.id];if(m)haveTy[m[3]]=1});
  const pool=pickAttacks(s,(side==='双刀')?'双刀':(side==='物理'?'物理':'特殊'),40,role);
  let rep=null;
  for(const o of pool){if(!o||used[''+o.id]||haveTy[o.ty])continue;const M=MV[o.id];
    if((+M[5]||0)>=70&&(+M[6]||0)>=90&&!CHARGE.test(M[1])){rep=o;break}}
  if(!rep)for(const o of pool){if(!o||used[''+o.id])continue;const M=MV[o.id];
    if(M&&!CHARGE.test(M[1])){rep=o;break}}
  let repTxt='（无补位）';
  if(rep){main[wi]={id:+rep.id,kind:mvKindOf(+rep.id),tag:'补盲',why:[]};repTxt=MV[rep.id][1]}
  let abiTxt='（不变）';
  const abn=b.abi[0].n, dep=abiSysOf(abn), set=abiSetOf(abn), setE=abiSetExt(abn);
  if(dep&&!set&&!setE){
    const rank=pickAbiFor(s,side,role,{});let pick=null;
    for(const c of rank){if(!abiSysOf(c.n)&&!abiSetOf(c.n)&&!abiSetExt(c.n)){pick=c;break}}
    if(pick){b.abi[0]={n:pick.n,id:pick.id,sc:pick.sc,why:[]};abiTxt=pick.n}
  }
  let nmTxt=b.name;
  const ch=String(b.name).charAt(0);
  if('雨晴沙雪'.indexOf(ch)>-1){b.name=String(b.name).replace(ch,'');nmTxt=b.name}
  return {rep:repTxt,abi:abiTxt,name:nmTxt};
}

let n=0;
for(const s of ERDATA.species){
  if(s.base[5]<100)continue;
  let builds;try{builds=deriveBuilds(s,[]);}catch(e){continue}
  for(const b of builds){
    const r=transform(s,b);
    if(r){n++;
      console.log(`#${s.id} ${s.zh} → 名「${r.name}」 补「${r.rep}」 特性「${r.abi}」`);
      console.log(`     最终招:${b.mv.main.map(x=>MV[x.id][1]).join('/')} | 特性:${b.abi[0].n}`);
    }
  }
}
console.log("\n转换条数:",n);
