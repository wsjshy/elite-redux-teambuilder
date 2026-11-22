const H = require('./harness.js');
const { ERDATA } = H;
const s = ERDATA.species.find(x => String(x.id) === '1507');
const team = H.buildTeam(s);
console.log('buildTeam keys:', Object.keys(team));
console.log(JSON.stringify(team, (k, v) => (k === 's' || k === 'core' || k === 'def') ? (v && v.id) : v, 1).slice(0, 2500));
