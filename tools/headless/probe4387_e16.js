const fs=require('fs'),path=require('path');
const snap=JSON.parse(fs.readFileSync(path.join(__dirname,'_v4386_base_snapshot.json'),'utf8'));
const R4386=require('./_ev4386.json');
const ROWS=R4386.a2.six.noRecRows;
const WALL={113:'光墙',115:'反射壁',657:'极光幕'};
const ledger=new Set(ROWS.map(r=>String(r.id)+'|'+r.name));
const ids=new Set(ROWS.map(r=>String(r.id)));
const snapRows=snap.six.filter(r=>ids.has(String(r.id)));
console.log('快照中台账未列名的记录:');
snapRows.filter(r=>!ledger.has(String(r.id)+'|'+r.name)).forEach(r=>{
  console.log(`  #${r.id} ${r.zh} 快照名=${r.name} role=${r.roleTag} 招=${r.mv.join('/')} 墙=${r.mv.filter(m=>WALL[m]).map(m=>WALL[m]).join('/')||'无'} abi=${r.abi0}`);
});
console.log('\n台账中快照未匹配的记录:');
const snapSet=new Set(snapRows.map(r=>String(r.id)+'|'+r.name));
ROWS.filter(r=>!snapSet.has(String(r.id)+'|'+r.name)).forEach(r=>console.log(`  #${r.id} ${r.zh} 台账=${r.name}`));
