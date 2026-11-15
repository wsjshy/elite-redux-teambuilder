const fs=require('fs'),path=require('path');
const snap=JSON.parse(fs.readFileSync(path.join(__dirname,'_v4386_base_snapshot.json'),'utf8'));
console.log('six len', snap.six.length, 'empty len', snap.empty.length);
console.log('sample', JSON.stringify(snap.six[0]).slice(0,400));
const R4386=require('./_ev4386.json');
const ROWS=R4386.a2.six.noRecRows;
// snapshot index by spId?
const s0=snap.six[0];
console.log('entry keys', Object.keys(s0));
