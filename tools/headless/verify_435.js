const H = require('./harness_dbg.js');
const { ERDATA } = H;
for(const id of [435,357]){const a=ERDATA.abilities[id];
  console.log(`id${id} ${a[2]}: ${String(a[3]).split('\n')[0]}`)}
