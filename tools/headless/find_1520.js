const H = require('./harness.js');
const { ERDATA } = H;
console.log("total species:", ERDATA.species.length);
console.log("sample ids/types:", ERDATA.species.slice(0,3).map(s => [s.id, typeof s.id, s.zh]));
const matches = ERDATA.species.filter(s => String(s.id) === '1520' || (s.zh && s.zh.includes('黑鲁加')));
console.log("matches:", matches.map(s => [s.id, typeof s.id, s.zh, s.en]));
