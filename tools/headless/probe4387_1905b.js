const H = require('./harness.js');
const { ERDATA, deriveBuilds } = H;
const allTeam = [26,65,96,80,37,208].map(id=>ERDATA.species.find(s=>String(s.id)===String(id)));
const s = ERDATA.species.find(x=>String(x.id)==='1905'||String(x.spId)==='1905');
console.log('abis', JSON.stringify(s.abis), 'inns', JSON.stringify(s.inns));
const bs = deriveBuilds(s, allTeam);
bs.forEach((b,i)=>{
  console.log('---', i, b.name, b.side, b.roleTag, 'score', b.score);
  console.log('  mv', (b.mv.main||[]).concat(b.mv.func||[]).map(x=>x.id+':'+MVn(x.id)).join(' / '));
  console.log('  abi', (b.abi||[]).map(a=>a.id+':'+a.n+' sc='+a.sc).join(' / '));
  console.log('  why', (b.abi&&b.abi[0]&&b.abi[0].why||[]).join(' | '));
});
function MVn(id){return (H.MV[id]||[])[1]||'';}
