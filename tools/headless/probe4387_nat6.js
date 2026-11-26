const H=require('./harness.js');
const {ERDATA,deriveBuilds,NATURES}=H;
const STAT_NM=['HP','攻击','防御','特攻','特防','速度'];
const by=id=>ERDATA.species.find(s=>String(s.id)===String(id));
const allTeam=ERDATA.species.slice(0,6).map(s=>s.id).map(by);
function clashKept(nat){
  const kept=[],plus={},neg={};
  (nat||[]).forEach(n=>{
    const nm=String((n&&n[0])||''),e=NATURES[nm]||null;
    const p=e?String(e[0]||''):'',d=e?String(e[1]||''):'';
    if(!kept.length){kept.push(n);if(p)plus[p.slice(1)]=1;if(d)neg[d.slice(1)]=1;return;}
    const c=(p&&neg[p.slice(1)])||(d&&plus[d.slice(1)]);
    if(!c){kept.push(n);if(p)plus[p.slice(1)]=1;if(d)neg[d.slice(1)]=1;}
  });
  return kept;
}
function evOf(ev,stat){const i=STAT_NM.indexOf(stat);return i>=0?(+ev[i]||0):0;}
function evKept(bd){
  const nat=bd.nat||[],ev=(bd.ev&&bd.ev.alloc)||bd.ev||[];
  const kept=[],plus={},neg={};
  nat.forEach(n=>{
    const nm=String((n&&n[0])||''),e=NATURES[nm]||null;
    const p=e?String(e[0]||''):'',d=e?String(e[1]||''):'';
    if(!kept.length){kept.push(n);if(p)plus[p.slice(1)]=1;if(d)neg[d.slice(1)]=1;return;}
    const c=(p&&neg[p.slice(1)])||(d&&plus[d.slice(1)]);
    const pS=p.slice(1),dS=d.slice(1);
    const waste=pS!=='速度'&&evOf(ev,pS)<=4;
    const hurt=dS!=='速度'&&evOf(ev,dS)>4;
    if(!c&&!waste&&!hurt){kept.push(n);if(p)plus[p.slice(1)]=1;if(d)neg[d.slice(1)]=1;}
  });
  return kept;
}
let multiClash=0,multiEv=0,total=0;const samples=[];
ERDATA.species.forEach(s=>{
  let bs;try{bs=deriveBuilds(s,allTeam)}catch(e){return;}
  bs.forEach(b=>{
    total++;
    const kc=clashKept(b.nat),ke=evKept(b);
    if(kc.length>1)multiClash++;
    if(ke.length>1)multiEv++;
    if(kc.length>1&&ke.length===1&&samples.length<15)samples.push(`#${s.id} ${b.name} ${(b.nat||[]).map(n=>n[0]).join('/')} -> ${ke.map(n=>n[0]).join('/')}`);
  });
});
console.log('总流派',total,'冲突过滤后多候选',multiClash,'EV对齐后多候选',multiEv);
console.log('EV对齐额外裁剪样例:');samples.forEach(x=>console.log('  ',x));
