const HB = require('./harness_base.js');
const { ERDATA, deriveBuilds, MV, abiTagOf, NM2ID, _abEnt } = HB;
const RED = new Set(require('./_red_ids.json').map(String));
const SURV = new Set(['5','209','248','427','429','583','629','899','864']);
const REC = new Set(['30','44','61','82','90','93','102','115','131','139','144','247','307','333','415','566','875','886','890','991']);
const REC_RE = /回复最大HP|每回合回复|回复造成伤害|吸取.*HP|回复1\/|治愈自身|治愈异常|替换下场时,治愈|下场时回复|回复2\/3|回复1\/4|回复1\/8|回复1\/16|回复1\/3/;
const BOOST = [14,187,334,339,347,349,417,468,483,504,526];
const PIV = [369,521];
const by = id => ERDATA.species.find(s => String(s.id)===String(id));
const allTeam=[26,65,96,80,37,208].map(by);
function abi0(b){const a=b.abi&&b.abi[0];if(!a)return{n:'',id:''};return{n:a.n,id:String(a.id||NM2ID[a.n]||'')}}
function redOf(a){if(!a.id)return false;if(RED.has(a.id))return true;const tg=abiTagOf(a.n);return !!(tg&&tg.hf&&tg.hf.length)}
function immOf(a){if(!a)return false;const tg=abiTagOf(a.n);return !!(tg&&tg.im&&tg.im.length)}
function survOf(a){return !!(a.id&&SURV.has(a.id))}
function recOf(a){if(!a.id)return false;if(REC.has(a.id))return true;const e=_abEnt(a.id);return !!(e&&REC_RE.test(String(e[3]||'')))}
function cfg(b){
  const ids=(b.mv.main||[]).map(x=>+x.id).concat((b.mv.func||[]).map(x=>+x.id));
  const dmg=ids.filter(id=>{const r=MV[id];return r&&r[4]!=='变化'}).length;
  const al=(b.ev&&b.ev.alloc)||[0,0,0,0,0,0];
  const offEv=Math.max(al[1]||0,al[3]||0);
  const boost=ids.some(id=>BOOST.indexOf(id)>=0);
  const piv=PIV.some(id=>ids.indexOf(id)>=0);
  return {ids,dmg,offEv,boost,piv,al};
}
function route(b,a){
  const c=cfg(b);
  if(immOf(a))return '属性免疫联防位';
  const offensive=c.dmg>=2&&c.offEv>=120;
  if(offensive) return c.boost?'强化清场':'主力输出压制';
  if(c.piv)return '轮转补盲';
  return '受队消耗';
}
const nonRed={}, noRedBoost={}, noRedNeither={}, rotDem={};
const samples={强化清场:[]};
for (const s of ERDATA.species){
  let bs; try{bs=deriveBuilds(s,allTeam)}catch(e){continue}
  bs.forEach(b=>{
    const n=String(b.name||''); if(n.indexOf('减伤轴')<0)return;
    const a=abi0(b); const isRed=redOf(a);
    if(isRed)return;
    const r=route(b,a);
    nonRed[r]=(nonRed[r]||0)+1;
    if(n.indexOf('强化减伤轴')>=0){ if(cfg(b).boost) noRedBoost[r]=(noRedBoost[r]||0)+1; else noRedNeither[r]=(noRedNeither[r]||0)+1; }
    if(r==='强化清场'&&samples['强化清场'].length<12) samples['强化清场'].push({id:s.id,zh:s.zh,name:n,abi:a.n,cfg:cfg(b)});
  });
}
for (const s of ERDATA.species){
  let bs; try{bs=deriveBuilds(s,allTeam)}catch(e){continue}
  bs.forEach(b=>{
    const n=String(b.name||''); if(n.indexOf('轮转')<0)return;
    const c=cfg(b); if(c.piv)return;
    const a=abi0(b); const r=route(b,a); rotDem[r]=(rotDem[r]||0)+1;
  });
}
console.log('=== 轮转降级 242（无 369/521）新路由 ===', JSON.stringify(rotDem), '合计', Object.values(rotDem).reduce((x,y)=>x+y,0));
console.log('=== 1557 非RED减伤轴 新路由 ===', JSON.stringify(nonRed), '合计', Object.values(nonRed).reduce((x,y)=>x+y,0));
console.log('=== 363 强化减伤轴缺减伤(有强化招) 新路由 ===', JSON.stringify(noRedBoost), '合计', Object.values(noRedBoost).reduce((x,y)=>x+y,0));
console.log('=== 150 强化减伤轴都缺(无强化招) 新路由 ===', JSON.stringify(noRedNeither), '合计', Object.values(noRedNeither).reduce((x,y)=>x+y,0));
console.log('\n强化清场抽查:');
samples['强化清场'].forEach(r=>console.log('  #'+r.id,r.zh,r.name,'abi='+r.abi,'alloc='+JSON.stringify(r.cfg.al),'dmg='+r.cfg.dmg,'offEv='+r.cfg.offEv,'boost='+r.cfg.boost,'piv='+r.cfg.piv,JSON.stringify(r.cfg.ids)));
require('fs').writeFileSync(require('path').join(__dirname,'_ev4383_route3.json'),JSON.stringify({nonRed,noRedBoost,noRedNeither,rotDem,samples},null,1));
