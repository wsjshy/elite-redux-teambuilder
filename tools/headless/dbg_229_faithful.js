const H = require('./harness_dbg.js');
const { ERDATA, pickAbiFor, abiSysOf, abiSetOf, abiSetExt, finalizeBuildInPlace } = H;
const s=ERDATA.species.find(x=>String(x.id)==='229');
// 取一个未finalize的build：用mkBuild? 直接看deriveBuilds已finalize。手动复刻：
const builds=H.deriveBuilds(s,[]);
const b=builds[0];
console.log('finalize后:',b.name,b.abi[0].n,'id',b.abi[0].id,'swap=',b.abiSwappedForWeather);
// 手动跑候选逻辑，用build的side/role
const side=String(b.side),role=String(b.roleTag);
const rank=pickAbiFor(s,side,role,{});
for(const c of rank){
  const sy=abiSysOf(c.n),se=abiSetOf(c.n),ex=abiSetExt(c.n);
  // badAbi复刻
  const setupId=241;
  const a=ERDATA.abilities[c.id],d=String(a[3]||'');
  let bad=false;
  for(const w of ['晴'])if(d.indexOf(w)>-1&&/(提升|提高|增至|×|倍|回复|治愈|闪避|速度|威力|能力|伤害|减半|招式)/.test(d)){
    if(/对方无法.*先制|免疫|反弹|抵挡|出场时|入场时|吸引|替身/.test(d))bad=false;else bad=true;
  }
  console.log(`  ${c.n} id${c.id} sys=${sy} set=${se} ext=${ex} bad=${bad}`);
}
