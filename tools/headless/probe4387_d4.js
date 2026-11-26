const H=require('./harness.js');
const {ERDATA,deriveBuilds,learnOf,MV,bulkOf}=H;
const by=id=>ERDATA.species.find(s=>String(s.id)===String(id));
const allTeam=[26,65,96,80,37,208].map(by);
const d=require('./_ev4387_d.json');
const d3=require('./_ev4387_d3.json');
const REC=new Set([105,234,235,236,355,303,135,208,631,275,392,622,744,915,202,409,532,72,71,837,73]);
const DREAM=['96','517','518','574','575'];
const STALL=[...new Set(d3.stallRows.map(r=>String(r.id)))];
console.log('STALL ids',STALL.join(','));
console.log('DREAM',DREAM.join(','));

const TYPES=ERDATA.types,matchup=ERDATA.matchup;
const ti=n=>TYPES.indexOf(n);
function dec(v){return v===0?0:(v===0.5||v===3?0.5:(v===2?2:1));}
function fourx(s){
  const ds=[...new Set([s.t1,s.t2].filter(x=>x&&x!=='-').map(ti).filter(x=>x>=0))];
  const res=[];
  for(let a=0;a<TYPES.length;a++){
    let mul=1;ds.forEach(d=>{const row=matchup[d];mul*=dec(row&&row[a]!=null?row[a]:1);});
    if(mul===4)res.push(TYPES[a]);
  }
  return res;
}
function allowOf(s){
  const b=bulkOf(s),def=+s.base[2],spd=+s.base[4];
  if(b>=300)return {ok:true,why:'bulk≥300'};
  if(b>=270&&Math.min(def,spd)>=90&&fourx(s).length===0)return {ok:true,why:'bulk270-299+双防≥90+无4x'};
  return {ok:false,bulk:b,def,spd,fourx:fourx(s)};
}

// 台账 replaceRows 索引（tag+id+name+mv）
const ledger={};
[...d.empty.replaceRows,...d.six.replaceRows].forEach(r=>{ledger[r.tag+'|'+r.id+'|'+r.name+'|'+r.mv.join('/')]=r;});

let allow=0,repl=0,heldStall=0,heldDream=0,land=0,landRec=0,landCover=0,landGuard=0,unmatched=[];
const learnCache={};
function learn(s){if(!learnCache[s.id])learnCache[s.id]=learnOf(s)||[];return learnCache[s.id];}

ERDATA.species.forEach(s=>{
  let bs;try{bs=deriveBuilds(s,allTeam)}catch(e){return;}
  bs.forEach(b=>{
    const ids=(b.mv.main||[]).concat(b.mv.func||[]).map(x=>+x.id);
    if(ids.indexOf(156)<0)return;
    const al=allowOf(s);
    const tag='six';
    const ledgerKey=tag+'|'+s.id+'|'+b.name+'|'+ids.join('/');
    const L=ledger[ledgerKey];
    if(al.ok){allow++;return;}
    repl++;
    const isDream=DREAM.includes(String(s.id))&&ids.indexOf(138)>=0;
    const isStall=STALL.includes(String(s.id))&&/受队消耗/.test(String(b.name||''));
    if(isDream){heldDream++;return;}
    if(isStall){heldStall++;return;}
    // 落地：真回复 / 补盲 / 守住
    const kit={};ids.forEach(id=>kit[''+id]=1);
    const rec=learn(s).filter(id=>REC.has(id)&&!kit[''+id]);
    if(rec.length){landRec++;}
    else{
      // 模拟补盲候选（不真改）：粗略看 learn 非变化招
      const dmg=learn(s).filter(id=>MV[id]&&MV[id][4]!=='变化'&&!kit[''+id]);
      if(dmg.length)landCover++;else landGuard++;
    }
    land++;
    if(!L)unmatched.push(ledgerKey);
  });
});
console.log('\n运行时：allow',allow,'repl',repl,'heldStall',heldStall,'heldDream',heldDream,'land',land);
console.log('落地三桶：真回复',landRec,'补盲',landCover,'守住',landGuard);
console.log('台账 replaceRows',Object.keys(ledger).length,'未匹配运行时落地/持有:',unmatched.length);
unmatched.slice(0,20).forEach(x=>console.log('  ',x));
