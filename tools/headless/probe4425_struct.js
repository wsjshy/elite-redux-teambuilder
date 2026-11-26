const H = require('./harness.js');
const { ERDATA } = H;
console.log(JSON.stringify(ERDATA.abilities[76]));
console.log(JSON.stringify(ERDATA.abilities[346]));
const s = ERDATA.species.find(x => x.id === 1502);
console.log('1502 abis:', s.abis, 'inns:', s.inns);
