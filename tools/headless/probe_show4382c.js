const H = require('./harness.js');
const { ERDATA, deriveBuilds } = H;
const by = id => ERDATA.species.find(s => String(s.id) === String(id));
const team=[by(26),by(65),by(96),by(80),by(37),by(208)];
const buckets={template:[],desc:[],why:[]};
for(const s of ERDATA.species){
  let bs; try{bs=deriveBuilds(s,team);}catch(e){continue;}
  for(const b of bs){
    const name=String(b.name||'');
    if(/速攻/.test(name))continue;
    const tpl=String((b.ev||{}).template||'');
    const desc=String(b.desc||'');
    const texts={it:[],mv:[],abi:[],other:[]};
    (b.it||[]).forEach(x=>texts.it.push(String(x[1]||'')));
    (b.mv.main||[]).forEach(x=>{(x.why||[]).forEach(w=>texts.mv.push(w))});
    (b.mv.func||[]).forEach(x=>{(x.why||[]).forEach(w=>texts.mv.push(w))});
    (b.abi||[]).forEach(a=>{(a.why||[]).forEach(w=>texts.abi.push(w))});
    texts.other.push(String(b.why||''),String(b.warn||''),String(b.nameMismatch||''));
    if(/速攻/.test(tpl))buckets.template.push({id:s.id,zh:s.zh,name,tpl});
    if(/速攻/.test(desc))buckets.desc.push({id:s.id,zh:s.zh,name,desc,demoted:b.v13Demoted||''});
    const whyAll=[].concat(texts.it,texts.mv,texts.abi,texts.other).filter(w=>/速攻/.test(w));
    if(whyAll.length)buckets.why.push({id:s.id,zh:s.zh,name,why:whyAll.slice(0,2)});
  }
}
console.log('A 模板名「速攻」:',buckets.template.length);
console.log('B 流派原始描述 desc 旧名:',buckets.desc.length);
console.log('C why/it/warn 文案:',buckets.why.length);
console.log('\n--- C 全部 ---');
const grp={};
buckets.why.forEach(r=>{const k=r.why.join('|').slice(0,28);grp[k]=(grp[k]||0)+1;});
console.log(JSON.stringify(grp,null,1));
buckets.why.forEach(r=>console.log('  #'+r.id,r.zh,r.name,JSON.stringify(r.why)));
console.log('\n--- B desc 前缀分布 ---');
const bp={};buckets.desc.forEach(r=>{const m=r.desc.match(/^[^：:]*速攻[^：:]*/);bp[m?m[0]:'?']=(bp[m?m[0]:'?']||0)+1;});
console.log(JSON.stringify(bp));
