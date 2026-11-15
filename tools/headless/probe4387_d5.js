const H=require('./harness.js');
const {ERDATA,deriveBuilds,learnOf,MV,bulkOf}=H;
const by=id=>ERDATA.species.find(s=>String(s.id)===String(id));
const allTeam=[26,65,96,80,37,208].map(by);
const d=require('./_ev4387_d.json');
const TYPES=ERDATA.types,matchup=ERDATA.matchup,ti=n=>TYPES.indexOf(n);
function dec(v){return v===0?0:(v===0.5||v===3?0.5:(v===2?2:1));}
function fourx(s){const ds=[...new Set([s.t1,s.t2].filter(x=>x&&x!=='-').map(ti).filter(x=>x>=0))];const res=[];for(let a=0;a<TYPES.length;a++){let mul=1;ds.forEach(d=>{const row=matchup[d];mul*=dec(row&&row[a]!=null?row[a]:1);});if(mul===4)res.push(TYPES[a]);}return res;}
function allowOf(s){const b=bulkOf(s),def=+s.base[2],spd=+s.base[4];if(b>=300)return true;if(b>=270&&Math.min(def,spd)>=90&&fourx(s).length===0)return true;return false;}

// 运行时索引
const rt={};
ERDATA.species.forEach(s=>{let bs;try{bs=deriveBuilds(s,allTeam)}catch(e){return;}bs.forEach(b=>{const ids=(b.mv.main||[]).concat(b.mv.func||[]).map(x=>+x.id);if(ids.indexOf(156)<0)return;rt[String(s.id)+'|'+b.name+'|'+ids.join('/')]={allow:allowOf(s),bulk:bulkOf(s),def:+s.base[2],spd:+s.base[4],fourx:fourx(s)};});});

const rows=d.six.replaceRows.concat(d.six.allowRows);
let mis=[];
rows.forEach(r=>{
  const k=r.id+'|'+r.name+'|'+r.mv.map(x=>String(x).split(':')[0]).join('/');
  const R=rt[k];
  if(!R){mis.push({k,ledger:r.allow?'allow':'repl',why:'运行时无此卡'});return;}
  if(R.allow!==r.allow)mis.push({k,ledger:r.allow?'allow':'repl',rt:R.allow?'allow':'repl',bulk:R.bulk,def:R.def,spd:R.spd,fourx:R.fourx,hasRec:r.hasRec});
});
console.log('six 行',rows.length,'分类不一致',mis.length);
mis.slice(0,40).forEach(m=>console.log(JSON.stringify(m)));
