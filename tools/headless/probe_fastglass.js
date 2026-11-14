// 快速玻璃大炮（速≥100 且脆）专项：先制可得性 + 现有防护
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
  if (mpri && +mpri > 0 && split && split !== 'STATUS')
    for (const id in MV) if (MV[id][2] === name) priIds[id] = +mpri;
}
const BULK_CUT=4500, SPD_CUT=100;
const rows=[];
for (const s of ERDATA.species) {
  let learn; try{learn=learnOf(s);}catch(e){continue;}
  const b=s.base, bulk=b[0]*(b[3]+b[5])/2;
  if(b[5]<SPD_CUT||bulk>=BULK_CUT)continue;
  const priMoves=[...new Set(learn.filter(id=>priIds[id]!=null&&id!==252&&id!==364))];
  deriveBuilds(s,[]).forEach(bd=>{
    if(bd.roleTag!=='输出'&&bd.roleTag!=='强化')return;
    const runIds=(bd.mv.main||[]).map(x=>x.id);
    rows.push({sp:s.id,zh:s.zh,build:bd.name,side:bd.side,speed:b[5],bulk:Math.round(bulk),
      item:(bd.it[0]||[])[0],sub:runIds.indexOf(164)>-1,
      runPri:runIds.filter(id=>priIds[id]!=null).map(id=>id+':'+MV[id][1]),
      priAvail:priMoves.map(id=>id+':'+MV[id][1]+'('+MV[id][3]+',w'+MV[id][5]+')')});
  });
}
const withPri=rows.filter(r=>r.priAvail.length), noPri=rows.filter(r=>!r.priAvail.length);
const withStrong=withPri.filter(r=>r.priAvail.some(p=>/STAB|w(6[0-9]|[7-9]\d)/.test(p)));
console.log('快速玻璃大炮 进攻流派总数',rows.length,'物种',new Set(rows.map(r=>r.sp)).size);
console.log('有先制可学：',withPri.length,'| 无先制：',noPri.length);
console.log('\\n--- 有先制但未带（前30）---');
withPri.filter(r=>!r.runPri.length).slice(0,30).forEach(r=>console.log(r.sp,r.zh,'速'+r.speed,r.item,r.sub?'替身':'','|',r.priAvail.join(' ')));
console.log('\\n--- 无先制（前30）---');
noPri.slice(0,30).forEach(r=>console.log(r.sp,r.zh,'速'+r.speed,r.item,r.sub?'替身':'无替身'));
