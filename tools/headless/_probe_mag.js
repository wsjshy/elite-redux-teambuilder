const HC = require('./harness.js');
const { ERDATA, deriveBuilds } = HC;
const SRC = require('./_src_reduce.json');
const by = id => ERDATA.species.find(s => String(s.id)===String(id));
const allTeam=[26,65,96,80,37,208].map(by);

const MANUAL_SRC={'79':[0.75]}; // 审计 JSON 截断，源码 abilities.cc:1415 防守侧同性/异性 MUL(.75)
function srcFactors(id){
  if(MANUAL_SRC[id]) return MANUAL_SRC[id];
  const e=SRC[id]; if(!e) return null;
  const blob=(e.defMul||[]).concat(e.teAfter||[]).join(' ');
  const fac=[]; let m;
  const re=/MUL\(([\d.]+)\)|RESISTANCE\(([\d.]+)\)/g;
  while(m=re.exec(blob)) fac.push(parseFloat(m[1]||m[2]));
  if(/\/= 2/.test(blob)) fac.push(0.5);
  if(/UQ_4_12\(0\.5\)/.test(blob)) fac.push(0.5);
  return fac;
}
// 从 why 文本抽防守侧倍率；进攻倍率（威力提升/造成…倍/输出×）剔除
function whyFactors(text){
  const fac=[];
  if(/减半/.test(text)) fac.push(0.5);
  let m;
  const rePct=/(\d+)%/g;
  while(m=rePct.exec(text)){ const n=parseInt(m[1],10); fac.push(+(1-n/100).toFixed(2)); }
  const reX=/×(0\.\d+|\d\.\d+)|0\.(\d+)倍|(\d\.\d+)倍/g;
  while(m=reX.exec(text)){
    let v;
    if(m[1]) v=parseFloat(m[1]); else if(m[2]) v=parseFloat('0.'+m[2]); else v=parseFloat(m[3]);
    const seg=text.slice(Math.max(0,m.index-12), m.index+18);
    if(/威力|造成|输出|提升|招式威力/.test(seg) && v>=1.1) continue;
    fac.push(v);
  }
  return [...new Set(fac)];
}
function close(a,b){ return Math.abs(a-b)<=0.03; }

const rows=[];
const seen=new Set();
for (const s of ERDATA.species){
  let bs; try{bs=deriveBuilds(s,allTeam)}catch(e){continue}
  bs.forEach(b=>{
    const n=String(b.name||''); if(n.indexOf('减伤轴')<0)return;
    const a=b.abi&&b.abi[0]; if(!a)return;
    const id=String(a.id||'');
    const key=s.id+'|'+n+'|'+id; if(seen.has(key))return; seen.add(key);
    const why=(a.why||[]).join(' ⏐ ');
    const sf=srcFactors(id);
    const wf=whyFactors(why);
    let cls;
    if(!sf){ cls='NOSRC'; }
    else if(sf.length===0){ cls='NOSRC'; }
    else if(wf.length===0){ cls='MISS'; }
    else { cls = sf.some(x=>wf.some(y=>close(x,y))) ? 'OK' : 'BAD'; }
    rows.push({sp:s.id, zh:s.zh, name:n, id, abi:a.n, src:sf, why:wf, cls, whyText:why.slice(0,220)});
  });
}
const OK=rows.filter(r=>r.cls==='OK'), MISS=rows.filter(r=>r.cls==='MISS'), BAD=rows.filter(r=>r.cls==='BAD'), NOSRC=rows.filter(r=>r.cls==='NOSRC');
console.log('总数', rows.length, '一致', OK.length, '缺幅度', MISS.length, '不一致', BAD.length, '不在权威表', NOSRC.length);
console.log('\n=== 缺幅度 ==='); MISS.forEach(r=>console.log('#'+r.sp,r.zh,r.name,'abi',r.id,r.abi,'src=',r.src,'why=',r.whyText));
console.log('\n=== 不一致 ==='); BAD.forEach(r=>console.log('#'+r.sp,r.zh,r.name,'abi',r.id,r.abi,'src=',r.src,'why=',r.why,'whyText=',r.whyText));
console.log('\n=== 不在权威表 ==='); NOSRC.forEach(r=>console.log('#'+r.sp,r.zh,r.name,'abi',r.id,r.abi));
require('fs').writeFileSync(require('path').join(__dirname,'_ev4383_mag.json'),JSON.stringify({OK,MISS,BAD,NOSRC},null,1));
