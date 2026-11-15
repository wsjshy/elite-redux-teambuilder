const OLD = require('C:/temp/er4378/harness.js');
const NEW = require('./harness.js');
const { ERDATA } = OLD;
const { MV } = NEW;
const SETUP={240:'雨',241:'晴',201:'沙',258:'雪',580:'青草',581:'薄雾',604:'电气',641:'精神'};
const CHARGE_SUN=new Set([76,632]);           // 日光束/日光刃 晴免蓄力
const ACC_RAIN=new Set([87,542]);             // 打雷/暴风 雨必中
const ACC_HAIL=new Set([59]);                 // 暴风雪 雪必中
const WBALL=new Set([311]);                   // 气象球
let total=0;
for(const s of ERDATA.species){
  if(s.base[5]<100)continue;
  let bs;try{bs=OLD.deriveBuilds(s,[]);}catch(e){continue}
  for(const b of bs){
    const side=String(b.side),role=String(b.roleTag);
    const off=(side==='物理'||side==='特殊'||side==='双刀')&&(role==='增伤'||role==='输出'||role==='强化');
    if(!off)continue;
    let wi=-1;b.mv.main.forEach((m,i)=>{if(SETUP[+m.id]!==undefined&&wi<0)wi=i});
    if(wi<0)continue;
    const wx=SETUP[+b.mv.main[wi].id];total++;
    const flags=[];
    b.mv.main.forEach((m,i)=>{if(i===wi)return;const _M=MV[m.id];if(!_M)return;
      if(CHARGE_SUN.has(+m.id))flags.push('蓄力['+_M[1]+']');
      if(ACC_RAIN.has(+m.id))flags.push('雨命中['+_M[1]+']');
      if(ACC_HAIL.has(+m.id))flags.push('雪命中['+_M[1]+']');
      if(WBALL.has(+m.id))flags.push('气象球['+_M[1]+']');
    });
    if(flags.length)console.log(`#${s.id} ${s.zh} [${b.name}] 体系=${wx} 依赖: ${flags.join(', ')}`);
  }
}
console.log("\n目标流派总数:",total);
