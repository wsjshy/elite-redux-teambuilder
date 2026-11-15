const H = require('./harness_dbg.js');
const { MV } = H;
const want=['日光束','日光刃','打雷','暴风','暴风雪','气象球','电力射击','Electro Shot','雷电','飓风','日光','流星光束'];
for (const id in MV) {
  const m=MV[id];
  if (want.some(w=>m[1].includes(w))) {
    console.log(`id${id} ${m[1]} ${m[3]}/${m[4]} 威力${m[5]} 命中${m[6]} | ${m[10]}`);
  }
}
