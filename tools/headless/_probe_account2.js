const HB = require('./harness_base.js');
const HC = require('./harness.js');

function sig(bs) {
  return bs.map(b => {
    const ids = (b.mv.main||[]).map(x=>+x.id).concat((b.mv.func||[]).map(x=>+x.id));
    return {
      name: String(b.name||''),
      side: b.side,
      abi: b.abi && b.abi[0] ? (b.abi[0].n + '/' + (b.abi[0].id||'')) : '',
      it: b.it && b.it[0] ? b.it[0][0] : '',
      ev: b.ev && b.ev.template,
      ids
    };
  });
}
function jac(a,b){ const sa=new Set(a), sb=new Set(b); if(!sa.size&&!sb.size)return 1; let inter=0; sa.forEach(x=>{if(sb.has(x))inter++}); return inter/(sa.size+sb.size-inter); }

const base={}, cur={};
for (const s of HB.ERDATA.species){
  let bs; try{bs=HB.deriveBuilds(s,[])}catch(e){continue}
  base[s.id]=sig(bs);
}
for (const s of HC.ERDATA.species){
  let bs; try{bs=HC.deriveBuilds(s,[])}catch(e){continue}
  cur[s.id]=sig(bs);
}

let renamed=0, removed=[], added=[];
Object.keys(base).forEach(id=>{
  const B=base[id]||[], C=cur[id]||[];
  const used=new Array(C.length).fill(false);
  B.forEach(br=>{
    let bi=-1, bj=0;
    C.forEach((cr,i)=>{ if(used[i])return; if(br.side===cr.side&&br.abi===cr.abi&&br.it===cr.it&&br.ev===cr.ev){const j=jac(br.ids,cr.ids); if(j>=0.6&&j>bj){bj=j;bi=i}} });
    if(bi>=0){ used[bi]=true; if(br.name!==C[bi].name) renamed++; }
    else removed.push({id,name:br.name,abi:br.abi,ids:br.ids});
  });
  C.forEach((cr,i)=>{ if(!used[i]) added.push({id,name:cr.name,abi:cr.abi,ids:cr.ids}); });
});
const baseTotal=Object.values(base).reduce((x,y)=>x+y.length,0);
const curTotal=Object.values(cur).reduce((x,y)=>x+y.length,0);
console.log('base total', baseTotal, 'cur total', curTotal, 'Δ', curTotal-baseTotal);
console.log('renamed pairs', renamed, 'removed', removed.length, 'added', added.length);
// added 成因分类：(i) 改名后去重分组变化浮出 / (ii) top-4 候选重排浮出 / (iii) 真正新生成候选
// 空队口径下候选集合未变：added 应 0；若有，按是否存在同物种 baseline 兄弟卡判断
const addedBySpecies={}; added.forEach(a=>{(addedBySpecies[a.id]=addedBySpecies[a.id]||[]).push(a)});
console.log('added 物种数', Object.keys(addedBySpecies).length);
added.slice(0,30).forEach(a=>console.log('  + #'+a.id,a.name,a.abi,JSON.stringify(a.ids)));
removed.slice(0,30).forEach(r=>console.log('  - #'+r.id,r.name,r.abi,JSON.stringify(r.ids)));
require('fs').writeFileSync(require('path').join(__dirname,'_ev4383_account2.json'),
  JSON.stringify({baseTotal,curTotal,renamed,removed,added},null,1));
