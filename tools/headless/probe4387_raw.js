const fs=require('fs'),path=require('path');
const dir=__dirname,root=path.dirname(path.dirname(dir));
const t=fs.readFileSync(path.join(root,'data_lite_v498.js'),'utf8');
const aKey='ERDATA["abilities"]=[';
const ai=t.indexOf(aKey);
console.log('abilities start',ai);
const segEnd=t.indexOf('];',ai);
const seg=t.slice(ai,segEnd);
const ids=['317','582','200','442','440','499','524','613','664','671','678','682','726','741','773','779','817','829','881','900','925','932','936','948','954','962','968','970','997','1004','1010','1032'];
ids.forEach(id=>{
  const needle='"'+id+'","';
  const i=seg.indexOf(needle);
  if(i<0){console.log(id,'NOT IN ABILITIES');return;}
  const j=seg.indexOf('],[',i);
  console.log('===',id);
  console.log(JSON.stringify(seg.slice(i,j+1)));
});
