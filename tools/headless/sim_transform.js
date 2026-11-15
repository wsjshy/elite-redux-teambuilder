const H = require('./harness.js');
const { ERDATA, deriveBuilds, MV, pickAttacks } = H;
const WSET = new Set([240,241,201,258,580,581,604,641]);
const OFF_ROLE = ['增伤','输出'];
let n=0;
for (const s of ERDATA.species) {
  if (s.base[5]<100) continue;
  let builds; try{builds=deriveBuilds(s,[]);}catch(e){continue;}
  for (const b of builds) {
    if (OFF_ROLE.indexOf(b.roleTag)<0||b.side==='辅助') continue;
    if (b.abi[0]&&/恶作剧之心/.test(b.abi[0].n)) continue;
    const widx=(b.mv.main||[]).findIndex(m=>WSET.has(+m.id));
    if (widx<0) continue;
    n++;
    const used={};(b.mv.main||[]).forEach(x=>used[''+x.id]=1);
    const sd=(b.side==='双刀')?'双刀':(b.side==='物理'?'物理':'特殊');
    const cands=pickAttacks(s,sd,8,b.roleTag).filter(x=>!used[''+x.id]);
    const rep=cands[0];
    let abiRank=[];
    try{abiRank=H.pickAbiFor(s,b.side,b.roleTag,{});}catch(e){}
    console.log(`#${s.id} ${s.zh} [${b.name}] 现招:${b.mv.main.map(x=>MV[x.id][1]).join('/')}`);
    console.log(`   补位候选:${cands.slice(0,3).map(x=>MV[x.id][1]).join('/')} → 取「${rep?MV[rep.id][1]:'无'}」`);
    console.log(`   特性排序:${abiRank.slice(0,3).map(a=>a.n+'('+a.sc+')').join(' > ')}`);
  }
}
console.log("\n总:",n);
