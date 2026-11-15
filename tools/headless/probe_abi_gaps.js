const H = require('./harness_dbg.js');
const { ERDATA, abiSysOf, abiSetOf, abiSetExt } = H;
const WXWORD=/雨|晴|沙|雪|冰雹|雾|场地/;
let gaps=0;
for(const a of Object.values(ERDATA.abilities)){
  const n=a[2], desc=String(a[3]||'');
  const sys=abiSysOf(n),set=abiSetOf(n),sete=abiSetExt(n);
  if(!sys&&!set&&!sete&&WXWORD.test(desc)){gaps++;console.log(`${n}: ${desc.split('\n')[0]}`)}
}
console.log("\n描述含天气词但表未分类的特性数:",gaps);
