const H = require('./harness_dbg.js');
const { ERDATA, deriveBuilds, MV, ownAutoSys } = H;
const WSET = new Set([240,241,201,258,580,581,604,641]);
const OFF_ROLE = ['增伤','输出'];
const s = ERDATA.species.find(x=>String(x.id)==='1520');
// 带一个晴天设置手（找一个有干旱/日照特性的）
const setter = ERDATA.species.find(x=>ownAutoSys(x).indexOf('晴')>-1 && String(x.id)!=='1520');
console.log("晴天设置手样本:", setter ? "#"+setter.id+" "+setter.zh+" auto="+ownAutoSys(setter) : "无");
if (setter) {
  const tb = deriveBuilds(s,[setter]);
  for (const b of tb) {
    console.log("\n[带setter] 流派:",b.name,"招:",b.mv.main.map(x=>MV[x.id][1]).join('/'));
    console.log("  含手动天气:", b.mv.main.some(x=>WSET.has(+x.id)));
  }
}
// 空队：道具 + basis
console.log("\n=== 空队 32 条道具/天气专属检查 ===");
let weatherItem=0;
for (const sp of ERDATA.species) {
  if (sp.base[5]<100) continue;
  let builds; try{builds=deriveBuilds(sp,[]);}catch(e){continue;}
  for (const b of builds) {
    if (OFF_ROLE.indexOf(b.roleTag)<0||b.side==='辅助') continue;
    if (b.abi[0]&&/恶作剧之心/.test(b.abi[0].n)) continue;
    if (!b.mv.main.some(x=>WSET.has(+x.id))) continue;
    const it=(b.it||[]).map(x=>x[0]).join('/');
    if (/岩石|黏土|种子|膜|延长/.test(it)) {weatherItem++;console.log(`#${sp.id} ${sp.zh} [${b.name}] 道具:${it}`);}
  }
}
console.log("天气/场地专属道具命中:",weatherItem);
