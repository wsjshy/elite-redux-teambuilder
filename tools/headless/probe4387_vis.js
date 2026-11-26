const H=require('./harness.js');
const {ERDATA,abiDescZhOf,scrubLeak,mdInline}=H;
const ids=['317','582','200','442','440','499','524','613','664','671','678','682','726','741','773','779','817','829','881','900','925','932','936','948','954','962','970','997','1004','1010','1032','968','1048','1053'];
const out=[];
ids.forEach(id=>{
  const raw=abiDescZhOf(id)||'';
  const vis=scrubLeak(mdInline(raw));
  out.push(`#${id} | dict=${ERDATA.abiDescZh&&ERDATA.abiDescZh[id]?'Y':'N'} | 可见=${vis}`);
});
console.log(out.join('\n'));
// 关键自检
const v=id=>scrubLeak(mdInline(abiDescZhOf(id)||''));
const chk=(id,toks)=>toks.forEach(t=>console.log(`#${id} 含「${t}」:`,v(id).indexOf(t)>=0));
chk('317',['35%','25%']);chk('582',['35%','25%']);
chk('678',['×0.5','×2','只结算一次']);chk('948',['×0.5','×2','只结算一次']);
