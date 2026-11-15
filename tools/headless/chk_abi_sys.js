const H = require('./harness_dbg.js');
for (const n of ['雪隐','沙隐','炮术','龙颚','破格','杀戮之颚','神秘刀锋','压制']) {
  let dep=null,set=null,sete=null;
  try{dep=H.abiSysOf(n)}catch(e){}
  try{set=H.abiSetOf(n)}catch(e){}
  try{sete=H.abiSetExt(n)}catch(e){}
  console.log(`${n}: sys=${dep} set=${set} setExt=${sete}`);
}
