// v4.425 改前基线：全物种流派签名（id|name|role|move ids），输出 JSON 供改后对账
const fs = require('fs');
const H = require('./harness.js');
const { ERDATA, deriveBuilds } = H;
const out = {};
let total = 0;
for (const s of ERDATA.species) {
  let bs = []; try { bs = deriveBuilds(s, []); } catch (e) { bs = []; }
  out[s.id] = bs.map(b => ({
    n: b.name, r: b.roleTag,
    m: (b.mv.main || []).map(x => +x.id),
  }));
  total += bs.length;
}
fs.writeFileSync(process.argv[2] || 'baseline4425.json', JSON.stringify(out));
console.log('species:', ERDATA.species.length, 'builds:', total);
