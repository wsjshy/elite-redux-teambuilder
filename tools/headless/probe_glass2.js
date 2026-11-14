// 玻璃大炮 × 优质先制 窄口径探针（v4.372 审计）
const fs = require('fs');
const H = require('./harness.js');
const { ERDATA, deriveBuilds, MV, learnOf } = H;

const txt = fs.readFileSync('D:/game/scratch/eliteredux-source/proto/MoveList.textproto', 'utf8');
const priIds = {};
for (const blk of txt.split(/\moves \{/).slice(1)) {
  const body = blk.split(/\n\}/)[0];
  const name = (body.match(/name: "([^"]+)"/) || [])[1];
  const mpri = (body.match(/priority: (-?\d+)/) || [])[1];
  const split = (body.match(/split: (\w+)/) || [])[1];
  if (mpri && +mpri > 0 && split && split !== 'STATUS') {
    for (const id in MV) if (MV[id][2] === name) priIds[id] = +mpri;
  }
}
const BULK_CUT = 4500;   // 约下三分之一
function hasTech(s){ return (s.inns||[]).indexOf('技术高手')>-1; }
function isStab(s,id){ const t=MV[id][3]; return t===s.t1||t===s.t2; }
function goodPri(s,id){
  if (id===252||id===364) return false;
  if (isStab(s,id)) return true;                       // 本系先制
  if (hasTech(s) && (MV[id][5]||0)<=60) return true;   // 技术高手加成
  return false;
}
const goodNotRun=[], noAnswer=[], seen=new Set();
for (const s of ERDATA.species) {
  let learn; try{ learn=learnOf(s); }catch(e){ continue; }
  const b=s.base, bulk=b[0]*(b[3]+b[5])/2;
  if (bulk>=BULK_CUT) continue;
  const goodPriInLearn=[...new Set(learn.filter(id=>priIds[id]!=null && goodPri(s,id)))];
  deriveBuilds(s,[]).forEach(bd=>{
    if(bd.side!=='物理'&&bd.side!=='特殊')return;
    if(bd.roleTag!=='输出'&&bd.roleTag!=='强化')return;   // 只看纯进攻流派
    const key=s.id+'|'+bd.name; if(seen.has(key))return; seen.add(key);
    const runIds=(bd.mv.main||[]).map(x=>x.id);
    const runPri=runIds.some(id=>priIds[id]!=null);
    const rec={sp:s.id,zh:s.zh,build:bd.name,role:bd.roleTag,side:bd.side,speed:b[5],bulk:Math.round(bulk),item:(bd.it[0]||[])[0],sub:runIds.indexOf(164)>-1};
    if(goodPriInLearn.length&&!runPri){ rec.pri=goodPriInLearn.map(id=>id+':'+MV[id][1]+'(p'+priIds[id]+','+MV[id][3]+',w'+MV[id][5]+(isStab(s,id)?',STAB':'')+')'); goodNotRun.push(rec); }
    else if(!goodPriInLearn.length&&!runPri){ noAnswer.push(rec); }
  });
}
// 物种级去重统计
const spGood=new Set(goodNotRun.map(r=>r.sp)), spNo=new Set(noAnswer.map(r=>r.sp));
console.log('优质先制可带但未带：builds',goodNotRun.length,'物种',spGood.size);
console.log('无优质先制（靠替身/披带/队友）：builds',noAnswer.length,'物种',spNo.size);
fs.writeFileSync('probe_glass2.json',JSON.stringify({goodNotRun,noAnswer},null,1));
console.log('\\n--- 优质先制未带样例（前25）---');
goodNotRun.slice(0,25).forEach(r=>console.log(r.sp,r.zh,'|',r.build,'| 速'+r.speed,'|',r.item,r.sub?'替身':'','|',r.pri.join(' ')));
