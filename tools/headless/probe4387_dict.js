const fs=require('fs');
const s=fs.readFileSync('D:/game/elite-redux/data_lite_v498.js','utf8');
const i=s.indexOf('ERDATA["abiDescZh"]={');
console.log('idx',i);
const j=s.indexOf('};',i);
const seg=s.slice(i,j+2);
console.log('seg len',seg.length);
const m=seg.match(/'[^']+':"/g)||[];
console.log('entries',m.length);
console.log(seg.slice(0,300));
// existing keys among 34
const ids=['317','582','200','442','440','499','524','613','664','671','678','682','726','741','773','779','817','829','881','900','925','932','936','948','954','962','970','997','1004','1010','1032','968','1048','1053'];
const miss=ids.filter(x=>seg.indexOf("'"+x+"':")<0);
console.log('missing in dict:',miss.length,miss.join(','));
const lite=fs.readFileSync('D:/game/elite-redux/data_lite_v498.js','utf8');
['968','1032','1048','1053'].forEach(x=>{
  const m=lite.match(new RegExp('\\["'+x+'","[^"]*","[^"]*","[^"]*",\\[\\]\\]'));
  console.log(x, m?m[0]:'(无条目)');
});
