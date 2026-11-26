const H = require('./harness.js');
const { ERDATA } = H;
const s = ERDATA.species.find(x => String(x.id) === '382');
const learn = H.learnC(s);
const walls = H.FUNC_MV.wall.filter(w => learn.indexOf(w) > -1);
console.log('盖欧卡会的墙:', walls);
console.log('hasAny wall:', walls.length > 0);
// 它的配队卡是否真有墙流派
const builds = H.deriveBuilds(s);
builds.forEach(b => {
  const hasW = b.moves.some(m => H.FUNC_MV.wall.indexOf(m) > -1);
  if (hasW) console.log('含墙流派:', b.name, b.moves);
});
