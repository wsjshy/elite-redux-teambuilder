const H = require('./harness_dbg.js');
const { ERDATA, pickAbiFor, abiSysOf, abiSetOf, abiSetExt, famAbiRuleOf, pickAttacks, ownAutoSys, mvKindOf, MV } = H;
const WSET=new Set([240,241,201,258,580,581,604,641]);
const words={240:['雨'],241:['晴'],201:['沙'],258:['雪','冰雹'],580:['场地'],581:['场地'],604:['场地'],641:['场地']};
function constPart(d){return /对方无法.*先制|免疫|反弹|抵挡|出场时|入场时|吸引|替身/.test(d)}
function wxDep(id,setupId){const a=ERDATA.abilities[id];if(!a)return false;const d=String(a[3]||'');
  for(const w of (words[setupId]||[]))if(d.indexOf(w)>-1&&/(提升|提高|增至|×|倍|回复|治愈|闪避|速度|威力|能力|伤害|减半|招式)/.test(d)){
    if(constPart(d))return false;return true}
  return false}
function badAbi(id,setupId){const a=ERDATA.abilities[id];if(!a)return false;const d=String(a[3]||'');
  if(/双打/.test(d)&&/同伴/.test(d))return true;return wxDep(id,setupId)}

let n=0;
for(const s of ERDATA.species){
  if(+s.base[5]<100)continue;
  // 用当前生产deriveBuilds（已finalize），取weatherSelfRemoved
  for(const b of H.deriveBuilds(s,[])){
    if(!b.weatherSelfRemoved)continue;n++;
    const side=String(b.side),role=String(b.roleTag);
    // 找原setupId：从OLD build
    const oldS=H.ERDATA.species.find(x=>String(x.id)===String(s.id));
    let setupId=null;
    // 直接用当前final moves推断不了，用OLD
    const OLD=require('C:/temp/er4378/harness.js');
    const os=OLD.ERDATA.species.find(x=>String(x.id)===String(s.id));
    for(const ob of OLD.deriveBuilds(os,[])){
      for(const m of ob.mv.main)if(WSET.has(+m.id)){setupId=+m.id;break}
      if(setupId)break}
    const finalIds=b.mv.main.map(x=>+x.id);
    // 新候选逻辑
    const rank=pickAbiFor(s,side,role,{});
    let syn=null,neu=null;
    for(const c of rank){
      if(abiSysOf(c.n)||abiSetOf(c.n)||abiSetExt(c.n))continue;
      if(badAbi(c.id,setupId))continue;
      let rule=null;try{rule=famAbiRuleOf(c.n)}catch(e){}
      if(rule){if(finalIds.some(rule.check)){if(!syn)syn=c}}
      else{if(!neu)neu=c}
    }
    const pick=syn||neu;
    console.log(`#${s.id} ${s.zh} 当前=${b.abi[0].n} → 选=${pick?pick.n:'(无)'}${syn?'[协同]':(neu?'[中性]':'')}`);
  }
}
console.log('目标builds:',n);
