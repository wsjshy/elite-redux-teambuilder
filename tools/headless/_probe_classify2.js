const H = require('./harness_base.js');
const { ERDATA, deriveBuilds, abiTagOf, NM2ID, _abEnt } = H;
const RED = new Set(require('./_red_ids.json').map(String));
const SURV = new Set(['5','209','248','427','429','583','629','899','864']);
const REC = new Set(['30','44','61','82','90','93','102','115','131','139','144','247','307','333','415','566','875','886','890','991']);
const REC_RE = /回复最大HP|每回合回复|回复造成伤害|吸取.*HP|回复1\/|治愈自身|治愈异常|替换下场时,治愈|下场时回复|回复2\/3|回复1\/4|回复1\/8|回复1\/16|回复1\/3/;
const BOOST = [14,187,334,339,347,349,417,468,483,504,526];
const PIV = [369,521];
const by = id => ERDATA.species.find(s => String(s.id) === String(id));
const allTeam = [by(26), by(65), by(96), by(80), by(37), by(208)];

function abi0(b) {
  const a = b.abi && b.abi[0];
  if (!a) return { n: '', id: '' };
  let id = String(a.id || NM2ID[a.n] || '');
  return { n: a.n, id };
}
function cat(a) {
  if (RED.has(a.id)) return 'RED';
  const tg = abiTagOf(a.n);
  if (tg && tg.hf && tg.hf.length) return 'RED';
  if (tg && tg.im && tg.im.length) return 'IMM';
  if (SURV.has(a.id)) return 'SURV';
  if (REC.has(a.id)) return 'REC';
  const e = _abEnt(a.id);
  if (e && REC_RE.test(String(e[3] || ''))) return 'REC';
  return 'NONE';
}
function mvIds(b) {
  return (b.mv.main||[]).map(x=>+x.id).concat((b.mv.func||[]).map(x=>+x.id));
}

const buckets = {RED:0,IMM:0,SURV:0,REC:0,NONE:0};
const boost = {both:0,noRed:0,noBoost:0,neither:0};
const rot = {piv:0,noPiv:0};
const rotPrefix = {};
const redCards = [], noneCards = [], rotNo = [];

function scan(team, tag) {
  for (const s of ERDATA.species) {
    let bs; try { bs = deriveBuilds(s, team); } catch(e){ continue; }
    for (const b of bs) {
      const n = String(b.name||'');
      if (n.indexOf('减伤轴')>=0) {
        const a = abi0(b), c = cat(a);
        buckets[c]++;
        if (c==='RED') redCards.push({id:s.id,zh:s.zh,name:n,abi:a});
        else noneCards.push({id:s.id,zh:s.zh,name:n,abi:a,cat:c});
        if (n.indexOf('强化减伤轴')>=0) {
          const ids = mvIds(b);
          const hasBoost = BOOST.some(x=>ids.indexOf(x)>=0);
          if (c==='RED' && hasBoost) boost.both++;
          else if (c!=='RED' && hasBoost) boost.noRed++;
          else if (c==='RED' && !hasBoost) boost.noBoost++;
          else boost.neither++;
        }
      }
      if (n.indexOf('轮转')>=0) {
        const ids = mvIds(b);
        const hasPiv = PIV.some(x=>ids.indexOf(x)>=0);
        if (hasPiv) rot.piv++; else { rot.noPiv++; rotNo.push({id:s.id,zh:s.zh,name:n,ids}); }
        const pref = n.replace(/轮转.*/,'轮转');
        rotPrefix[pref]=(rotPrefix[pref]||0)+1;
      }
    }
  }
}
scan(allTeam,'allTeam');
console.log('=== 基线 allTeam 卡片级 abi[0] 分桶 ===');
console.log('减伤轴', JSON.stringify(buckets), '合计', Object.values(buckets).reduce((x,y)=>x+y,0));
console.log('强化减伤轴', JSON.stringify(boost));
console.log('轮转', JSON.stringify(rot));
console.log('轮转前缀', JSON.stringify(rotPrefix));
console.log('\nRED 保留样例(前10):'); redCards.slice(0,10).forEach(r=>console.log('  #'+r.id,r.zh,r.name,r.abi.n,r.abi.id));
console.log('\n降级样例(按 cat, 前 20):');
['IMM','SURV','REC','NONE'].forEach(c=>{
  noneCards.filter(x=>x.cat===c).slice(0,5).forEach(r=>console.log('  ['+c+'] #'+r.id,r.zh,r.name,r.abi.n,r.abi.id));
});
require('fs').writeFileSync(require('path').join(__dirname,'_ev4383_base_buckets.json'),
  JSON.stringify({buckets,boost,rot,rotPrefix,redCards,noneCards,rotNo},null,1));
