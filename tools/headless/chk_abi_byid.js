const H = require('./harness_dbg.js');
const { ERDATA } = H;
for(const id of [606,390,202,249,435,81,935,33]) {
  const a=ERDATA.abilities[id];
  console.log(`id${id} ${a?a[2]:''}: ${a?a[3].split('\n')[0]:'?'}`);
}
