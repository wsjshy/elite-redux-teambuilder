const fs = require('fs');
const base = JSON.parse(fs.readFileSync(__dirname + '/baseline4425.json', 'utf8'));
console.log('baseline 862:', JSON.stringify(base['862'], null, 1));
const H = require('./harness.js');
const { ERDATA, learnOf } = H;
const s = ERDATA.species.find(x => x.id === '862');
console.log('learnset contains 92:', learnOf(s).indexOf(92) > -1);
console.log('learnset contains 73:', learnOf(s).indexOf(73) > -1);
