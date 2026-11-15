const {execSync} = require('child_process');
const t = execSync('D:/Git/bin/git.exe show HEAD:data_lite_v498.js').toString('utf8');
const ids=['317','582','200','442','440','499','524','613','664','671','678','682','726','741','773','779','817','829','881','900','925','932','936','948','954','962','970','997','1004','1010','1032'];
const re=/\["(\d+)","[^"]*","[^"]*","(.*?)",\[\]\]/g; let m; const map={};
while((m=re.exec(t))){ if(ids.includes(m[1])) map[m[1]]=m[2]; }
ids.forEach(id=>{ const d=map[id]||'(无条目)'; console.log(id+'\t+'+((d.match(/\+/g)||[]).length)+'\t'+d); });
