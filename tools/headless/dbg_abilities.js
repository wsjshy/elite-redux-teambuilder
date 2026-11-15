const H = require('./harness_dbg.js');
const { ERDATA } = H;
for (const id of [512,351,94]) {
  const a = ERDATA.abilities[id];
  console.log("id"+id, JSON.stringify(a));
}
