const H = require('./harness_dbg.js');
const { ERDATA, MV, pickAbiFor, abiSysOf, abiSetOf, abiSetExt } = H;
function chkMove(id){const m=MV[id];if(m)console.log(`  招id${id} ${m[1]} ${m[3]}/${m[4]} 威力${m[5]} 命中${m[6]}`)}
for(const id of [76,632])chkMove(id);
// 找居合劈/装饰/和风突袭/精神利刃/下压踢/灵骚
for(const id in MV){const m=MV[id];if(/居合|装饰|和风|精神利刃|下压踢|灵骚/.test(m[1]))chkMove(id)}
for(const tid of ['542','1120','1817']) {
  const s=ERDATA.species.find(x=>String(x.id)===tid);
  console.log(`\n#${tid} ${s.zh} abis=${JSON.stringify(s.abis)}`);
  const rank=pickAbiFor(s,'物理','增伤',{});
  for(const c of rank)console.log(`  abi候选: ${c.n} (sc${c.sc}) sys=${abiSysOf(c.n)} set=${abiSetOf(c.n)}`);
}
