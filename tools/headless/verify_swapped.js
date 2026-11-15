const H = require('./harness_dbg.js');
const { ERDATA } = H;
const ids=[114,173,93,328,433,565,512,438,589,606,269,379,340,55,482,29,101,377,505,383,390];
for(const id of ids){const a=ERDATA.abilities[id];
  console.log(`id${id} ${a[2]}: ${String(a[3]).split('\n')[0]}`)}
