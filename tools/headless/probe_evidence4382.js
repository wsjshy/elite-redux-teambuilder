const HB = require('./harness_base.js');
const HC = require('./harness.js');
const fs = require('fs');
const IDS = [103,385,521,579,719,1651,1652,1654,1657,1660,1664,2104,2234,2549,2587];
const DEF = {'肉盾':1,'受队':1,'联防':1,'辅助':1};
const BOOST=[349,483,504,187,526];
function off(b){ return String(b.side)!=='辅助' && !DEF[String(b.roleTag)]; }
function mv(b){ return (b.mv.main||[]).map(x=>+x.id); }
function jac(a,b){ const A={},B={},u={}; a.forEach(x=>A[x]=1); b.forEach(x=>B[x]=1); let inter=0; for(const k in A)if(B[k])inter++; a.concat(b).forEach(x=>{u[x]=1}); const un=Object.keys(u).length; return un?+(inter/un).toFixed(3):1; }
function row(H,b){ const ab=b.abi&&b.abi[0]?String(b.abi[0].n||''):''; const it=b.it&&b.it[0]?String(b.it[0][0]||''):'';
  return {name:String(b.name),side:String(b.side),role:String(b.roleTag),ab:ab,it:it,tpl:String((b.ev||{}).template||''),mv:mv(b).sort((x,y)=>x-y),off:off(b)}; }
function find(H,id){ return H.ERDATA.species.find(s=>String(s.id)===String(id)); }
function fullMatch(m,o){ return m.side===o.side&&m.ab===o.ab&&m.it===o.it&&m.tpl===o.tpl&&jac(m.mv,o.mv)>=0.6; }
const out=[];
for(const id of IDS){
  const sB=find(HB,id), sC=find(HC,id);
  const spdC=+(sC.base[5]||0);
  const bB=sB?HB.deriveBuilds(sB,[]).map(b=>row(HB,b)):[];
  const bC=sC?HC.deriveBuilds(sC,[]).map(b=>row(HC,b)):[];
  const news=bC.filter(m=>!bB.some(o=>fullMatch(m,o)));
  for(const mine of news){
    let sib='无';
    for(const o of bC){ if(o===mine||!o.off||!mine.off)continue;
      const same=mine.side===o.side&&mine.ab===o.ab&&mine.it===o.it&&mine.tpl===o.tpl;
      const j=jac(mine.mv,o.mv);
      if(same||j>=0.6) sib=o.name+'(sameCfg='+same+',J='+j+')';
    }
    let best={j:0,o:null}; bB.forEach(o=>{const j=jac(mine.mv,o.mv); if(j>best.j)best={j,o};});
    out.push({id,zh:sC.zh,spd:spdC,name:mine.name,side:mine.side,role:mine.role,ab:mine.ab,it:mine.it,tpl:mine.tpl,mv:mine.mv,
      baseNear:best.o?best.o.name+' J='+best.j:'无',sib});
  }
}
fs.writeFileSync(require('path').join(__dirname,'_ev_added15.json'), JSON.stringify(out,null,1),'utf8');

// 97 例外分档
const fastTeam=[find(HC,26),find(HC,65)];
const slowTeam=HC.ERDATA.species.filter(s=>(+s.base[5])<=60&&HC.learnOf(s).indexOf(433)>=0).slice(0,3);
const evSpd=b=>+((b.ev&&b.ev.alloc)||[])[5]||0;
function srcOf(s,b){
  const m=(b.mv.main||[]).concat(b.mv.func||[]).map(x=>+x.id);
  const wx=(HC.pvWeatherSpeedMul(s)||1)>1;
  const light=(s.abis||[]).concat(s.inns||[]).indexOf('轻装')>=0;
  const scarf=String(((b.it||[])[0]||[])[0]||'').indexOf('讲究围巾')>=0;
  const tw=m.indexOf(366)>=0;
  const boost=m.some(id=>BOOST.indexOf(id)>=0);
  return {wx,light,scarf,tw,boost,mult:wx||tw||light||scarf};
}
const dMap=new Map();
for(const team of [fastTeam,slowTeam])for(const s of HC.ERDATA.species){
  let bs;try{bs=HC.deriveBuilds(s,team);}catch(e){continue;}
  for(const b of bs){
    if(!/速攻/.test(String(b.name||'')))continue; if(evSpd(b)!==0)continue;
    const k=s.id+'|'+b.name;
    if(!dMap.has(k))dMap.set(k,{id:s.id,zh:s.zh,spd:+s.base[5]||0,name:b.name,src:srcOf(s,b),note:b.v13MultNote||''});
  }
}
const D=[...dMap.values()].filter(r=>r.src.mult);
fs.writeFileSync(require('path').join(__dirname,'_ev_exc97.json'), JSON.stringify(D,null,1),'utf8');

// offHist 每物种进攻条数迁移
const DEF2 = {'肉盾':1,'受队':1,'联防':1,'辅助':1};
function off2(b){ return String(b.side)!=='辅助' && !DEF2[String(b.roleTag)]; }
function cnt(H,id){
  const s=H.ERDATA.species.find(x=>String(x.id)===String(id)); if(!s) return {n:0,names:[]};
  let bs; try{bs=H.deriveBuilds(s,[]);}catch(e){return {n:-1,names:[]};}
  return {n:bs.filter(off2).length, names:bs.filter(off2).map(b=>String(b.name))};
}
const oh=[];
for(const s of HC.ERDATA.species){
  const id=String(s.id), b=cnt(HB,id), c=cnt(HC,id);
  if(b.n!==c.n){
    const onlyB=b.names.filter(x=>!c.names.includes(x));
    const onlyC=c.names.filter(x=>!b.names.includes(x));
    oh.push({id,zh:s.zh,bn:b.n,cn:c.n,onlyB,onlyC});
  }
}
fs.writeFileSync(require('path').join(__dirname,'_ev_offhist.json'), JSON.stringify(oh,null,1),'utf8');
console.log('added',out.length,'exc',D.length,'offhist',oh.length);
const cat={wx:0,tw:0,light:0,scarf:0};
D.forEach(r=>{if(r.src.wx)cat.wx++;if(r.src.tw)cat.tw++;if(r.src.light)cat.light++;if(r.src.scarf)cat.scarf++;});
console.log('cat',JSON.stringify(cat));
