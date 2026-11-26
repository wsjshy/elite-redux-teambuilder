const H = require('./harness.js');
const fs=require('fs'),path=require('path');
const { ERDATA } = H;
const R4386 = require('./_ev4386.json');
const ROWS = R4386.a2.six.noRecRows;
console.log('ROWS', ROWS.length);
const byName={};
ROWS.forEach(r=>{byName[r.name]=(byName[r.name]||0)+1;});
console.log('台账名分布', JSON.stringify(byName));

// 基线快照 v4386（改前）按 id 取 builds[?] 名
const snap = JSON.parse(fs.readFileSync(path.join(__dirname,'_v4386_base_snapshot.json'),'utf8'));
console.log('snap keys', Object.keys(snap).slice(0,10));
