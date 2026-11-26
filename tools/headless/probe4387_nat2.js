const H=require('./harness.js');
const {ERDATA,deriveBuilds,NATURES}=H;
const by=id=>ERDATA.species.find(s=>String(s.id)===String(id));
const allTeam=[26,65,96,80,37,208].map(by);
function keptNat(nat){
  const list=nat||[],kept=[],plus={},neg={};
  list.forEach(n=>{
    const nm=String((n&&n[0])||''),e=NATURES[nm]||null;
    const p=e?String(e[0]||''):'',d=e?String(e[1]||''):'';
    if(!kept.length){kept.push(n);if(p)plus[p.slice(1)]=1;if(d)neg[d.slice(1)]=1;return;}
    const clash=(p&&neg[p.slice(1)])||(d&&plus[d.slice(1)]);
    if(!clash){kept.push(n);if(p)plus[p.slice(1)]=1;if(d)neg[d.slice(1)]=1;}
  });
  return kept;
}
['1503','66','70'].forEach(pid=>{
  const s=by(pid);let bs;try{bs=deriveBuilds(s,allTeam)}catch(e){return;}
  bs.forEach((b,i)=>{
    const k=keptNat(b.nat);
    console.log(`#${pid} [${i}] ${b.name} 原始=${(b.nat||[]).map(n=>n[0]).join('/')} 过滤后=${k.map(n=>n[0]).join('/')}`);
  });
});
