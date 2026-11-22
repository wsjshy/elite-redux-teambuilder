const H = require('./harness.js');
const { ERDATA } = H;
const sample = ERDATA.species.slice(0, 2).map(s => Object.keys(s));
console.log('species keys:', sample);
const hit = ERDATA.species.filter(x => String(x.id) === '1502' || String(x.dex || '') === '1502');
console.log('hits:', hit.length);
if (hit[0]) console.log(JSON.stringify({ id: hit[0].id, zh: hit[0].zh, abis: hit[0].abis, inns: hit[0].inns, base: hit[0].base }));
