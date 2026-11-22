// v4.426 基线：全物种流派签名（name|role|side|item|nature|ev|move ids），输出 JSON 供改后对账
const fs = require('fs');
const H = require('./harness.js');
const { ERDATA, deriveBuilds } = H;
const out = {};
let total = 0;
for (const s of ERDATA.species) {
  let bs = []; try { bs = deriveBuilds(s, []); } catch (e) { bs = []; }
  out[s.id] = bs.map(b => ({
    n: b.name, r: b.roleTag, sd: b.side,
    it: b.it && b.it[0] ? b.it[0][0] : '',
    nat: b.nat && b.nat[0] ? b.nat[0][0] : '',
    ev: b.ev && b.ev.alloc ? b.ev.alloc : [],
    m: (b.mv.main || []).map(x => +x.id),
  }));
  total += bs.length;
}
fs.writeFileSync(process.argv[2] || 'baseline4426.json', JSON.stringify(out));
console.log('species:', ERDATA.species.length, 'builds:', total);
