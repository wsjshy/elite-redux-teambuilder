const H = require('./harness.js');
const { ERDATA, deriveBuilds } = H;
const allTeam = [26,65,96,80,37,208].map(id=>ERDATA.species.find(s=>String(s.id)===String(id)));
const s = ERDATA.species.find(x=>String(x.id)==='1905'||String(x.spId)==='1905');
console.log('species', s && s.id, s && s.spId, s && s.zh);
const bs = deriveBuilds(s, allTeam);
bs.forEach((b,i)=>console.log(i, b.name, b.side, b.roleTag, (b.mv.main||[]).concat(b.mv.func||[]).map(x=>x.id).join('/'), b.abi[0]&&b.abi[0].n));
