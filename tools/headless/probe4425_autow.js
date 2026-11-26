const H = require('./harness.js');
const { ERDATA } = H;
for (const tid of [245, 144, 460, 899, 480, 615, 1557, 1576, 605, 346]) {
  const s = ERDATA.species.find(x => x.id === String(tid));
  if (!s) continue;
  let w = null; try { w = autoWallAbi(s); } catch (e) { w = 'ERR'; }
  console.log(`#${tid} ${s.zh} autoWall=${w} | abis=${s.abis.join('/')} inns=${s.inns.join('/')}`);
}
