const H = require('./harness_dbg.js');
const { ERDATA } = H;
const s=ERDATA.species.find(x=>String(x.id)==='229');
const b=H.deriveBuilds(s,[])[0];
console.log('最终:',b.abi[0].n);
console.log('pick trace:',globalThis._v9trace.join(' | '));
console.log('exit trace:',JSON.stringify(globalThis._v9exit));
