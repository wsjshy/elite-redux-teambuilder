const H = require('./harness_dbg.js');
const { ERDATA } = H;
for(const id of [41,351,362,110,81]){const a=ERDATA.abilities[id];
  console.log(`id${id} ${a[2]}: ${String(a[3]).split('\n')[0]}`)}
