const fs=require('fs'),path=require('path');
const snap=JSON.parse(fs.readFileSync(path.join(__dirname,'_v4386_base_snapshot.json'),'utf8'));
const R4386=require('./_ev4386.json');
const ROWS=R4386.a2.six.noRecRows;
const byId={};
snap.six.forEach(r=>{(byId[r.id]=byId[r.id]||[]).push(r);});
const WALL={113:'光墙',115:'反射壁',657:'极光幕'};
ROWS.forEach(r=>{
  const rows=byId[String(r.id)]||[];
  const names=rows.map(x=>x.name);
  const ledgerIsWall=r.name==='双墙辅助流';
  const snapWall=rows.filter(x=>x.name==='双墙辅助流');
  const snapImm=rows.filter(x=>x.name==='属性免疫联防位');
  const flag=(ledgerIsWall&&snapImm.length&&!snapWall.length)||(!ledgerIsWall&&snapWall.length&&!snapImm.length);
  if(flag||!names.includes(r.name)){
    console.log(`#${r.id} ${r.zh} 台账=${r.name} 快照名=[${names.join('|')}] 快照墙招=${rows.map(x=>x.mv.filter(m=>WALL[m]).join('/')).join(';')}`);
  }
});
console.log('--- 快照 66 物种内 双墙/免疫 计数 ---');
const ids=new Set(ROWS.map(r=>String(r.id)));
const snapRows=snap.six.filter(r=>ids.has(String(r.id)));
console.log('快照双墙',snapRows.filter(x=>x.name==='双墙辅助流').length,'快照免疫',snapRows.filter(x=>x.name==='属性免疫联防位').length);
