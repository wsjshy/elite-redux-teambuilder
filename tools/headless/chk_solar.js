const H = require('./harness_dbg.js');
const { MV } = H;
for (const id of [76,75,77]) {
  const m=MV[id];
  console.log(`id${id} ${m[1]} | EN long: ${m[10]}`);
}
