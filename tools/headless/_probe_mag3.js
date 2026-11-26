const HC = require('./harness.js');
const { ERDATA } = HC;
const SRC = require('./_src_reduce.json');
const RED = require('./_red_ids.json').map(String);
const MANUAL={'79':[0.75]};
function srcFactors(id){
  if(MANUAL[id]) return MANUAL[id];
  const e=SRC[id]; if(!e) return null;
  const blob=(e.defMul||[]).concat(e.teAfter||[]).join(' ');
  const fac=[]; let m;
  const re=/MUL\(([\d.]+)\)|RESISTANCE\(([\d.]+)\)/g;
  while(m=re.exec(blob)) fac.push(parseFloat(m[1]||m[2]));
  if(/\/= 2/.test(blob)) fac.push(0.5);
  if(/UQ_4_12\(0\.5\)/.test(blob)) fac.push(0.5);
  return fac;
}
function whyFactors(text){
  const fac=[];
  if(/减半/.test(text)) fac.push(0.5);
  let m; const rePct=/(\d+)%/g;
  while(m=rePct.exec(text)) fac.push(+(1-parseInt(m[1],10)/100).toFixed(2));
  const reX=/×(0\.\d+|\d\.\d+)|0\.(\d+)倍|(\d\.\d+)倍/g;
  while(m=reX.exec(text)){
    let v=m[1]?parseFloat(m[1]):m[2]?parseFloat('0.'+m[2]):parseFloat(m[3]);
    const seg=text.slice(Math.max(0,m.index-12),m.index+18);
    if(/威力|造成|输出|提升|招式威力|1\.5倍|1\.25倍|1\.2倍|1\.3倍/.test(seg)&&v>=1.1)continue;
    fac.push(v);
  }
  return [...new Set(fac)];
}
const close=(a,b)=>Math.abs(a-b)<=0.03;
const miss=[],bad=[];
RED.forEach(id=>{
  const e=HC._abEnt(id); if(!e)return;
  const desc=String(e[3]||'');
  const sf=srcFactors(id); if(!sf||!sf.length)return;
  const wf=whyFactors(desc);
  if(wf.length===0) miss.push({id,zh:e[2],en:e[1],src:sf,desc:desc.slice(0,100)});
  else if(!sf.some(x=>wf.some(y=>close(x,y)))) bad.push({id,zh:e[2],en:e[1],src:sf,why:wf,desc:desc.slice(0,120)});
});
console.log('=== 描述缺幅度（源码有倍率，描述无数字）', miss.length);
miss.forEach(r=>console.log(r.id,r.zh,'src=',r.src,'|',r.desc));
console.log('\n=== 描述幅度不一致', bad.length);
bad.forEach(r=>console.log(r.id,r.zh,'src=',r.src,'why=',r.why,'|',r.desc));
require('fs').writeFileSync(require('path').join(__dirname,'_ev4383_mag_desc.json'),JSON.stringify({miss,bad},null,1));
