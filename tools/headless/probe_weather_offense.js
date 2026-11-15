const H = require('./harness.js');
const { ERDATA, deriveBuilds, MV } = H;

const WEATHER = [240,241,201,258,580,581,604,641];
const WSET = new Set(WEATHER);
const OFF_ROLE = ['增伤','输出'];
function duraTri(b){return b[0]+b[2]+b[4];}

const rows = [];
for (const s of ERDATA.species) {
  const bs0=s.base, spe=bs0[5], dt=duraTri(bs0);
  let builds; try{builds=deriveBuilds(s,[]);}catch(e){continue;}
  for (const b of builds) {
    const isOff = OFF_ROLE.indexOf(b.roleTag)>=0 && b.side!=='辅助';
    if (!isOff) continue;
    const hasPrank = (b.abi[0]&&/恶作剧之心/.test(b.abi[0].n));
    for (const m of (b.mv.main||[])) {
      if (WSET.has(+m.id)) {
        rows.push({id:s.id,zh:s.zh,spe,dt,glass:spe>=100&&dt<270,
          name:b.name,side:b.side,role:b.roleTag,move:+m.id,prank:hasPrank});
      }
    }
  }
}
const fast = rows.filter(r=>r.spe>=100 && !r.prank);
console.log("进攻流派手动天气/场地 总命中:", rows.length);
console.log("速≥100 且非恶作剧之心:", fast.length);
console.log("  其中玻璃大炮:", fast.filter(r=>r.glass).length);
console.log("  速≥100但耐久≥270:", fast.filter(r=>!r.glass).length);
console.log("慢速(<100):", rows.filter(r=>r.spe<100).length, "| 恶作剧:", rows.filter(r=>r.prank).length);
console.log("\n=== 速≥100 非恶作剧 清单 ===");
for (const r of fast)
  console.log(`#${r.id} ${r.zh} 速${r.spe} 耐${r.dt}${r.glass?'[玻璃]':''} [${r.name}] ${r.side}/${r.role} 带${MV[r.move][1]}(${r.move})`);
