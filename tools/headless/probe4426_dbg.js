const H = require('./harness.js');
const { ERDATA } = H;
const s = ERDATA.species.find(x => String(x.id) === '1507');
console.log('base', s.base);
console.log('bulkOf', H.bulkOf(s));
console.log('isGlassCannon', H.isGlassCannon(s));
// 直接看 comboBuildsOf 未导出，改用 deriveBuilds 取卡
const bs = H.deriveBuilds(s, []);
const w = bs.find(b => b.name === '双墙辅助流');
console.log('card _fastScreen', w._fastScreen, 'ev', JSON.stringify(w.ev.alloc), 'nat', w.nat[0][0]);
