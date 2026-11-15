// v4.387 D 风险子集：① 227 无真回复中，名含受队消耗/回收一次流、bulk<300、除睡觉外无回复招；② 5 条食梦卡耐久/4倍弱点。
const fs = require('fs'), path = require('path');
const d = require('./_ev4387_d.json');
const REC = new Set([105,234,235,236,355,303,135,208,631,275,392,622,744,915,202,409,532,72,71,837,73]);
const DREAM = ['96','517','518','574','575'];

const all = [...d.empty.replaceRows, ...d.six.replaceRows];
const noRec = all.filter(r => !r.hasRec);

// 子集①：破名风险（分两桶：受队消耗名 / 回收一次流名；后者仍带 278 回收利用，名单独标注）
const mvIds = r => (r.mv||[]).map(x => +String(x).split(':')[0]);
const breakName = noRec.filter(r =>
  /受队消耗|回收一次流/.test(String(r.name||'')) && (r.bulk||0) < 300 &&
  !(r.recovery||[]).some(id => REC.has(+id))
).map(r => ({tag:r.tag, id:r.id, zh:r.zh, name:r.name, roleTag:r.roleTag, bulk:r.bulk, def:r.def, spd:r.spd, mv:r.mv, fourx:r.fourx, hasRecycle278: mvIds(r).includes(278)}));
const stallRows = breakName.filter(r => /受队消耗/.test(r.name));
const recycleRows = breakName.filter(r => /回收一次流/.test(r.name));
const uniq = rows => [...new Map(rows.map(r=>[r.id,r])).values()];

// 子集②：食梦悬空 5 条（跨 empty/six 去重 by id+idx+tag）
const dream = all.filter(r => DREAM.includes(String(r.id)))
  .map(r => ({tag:r.tag, id:r.id, zh:r.zh, types:r.types, name:r.name, roleTag:r.roleTag, bulk:r.bulk, def:r.def, spd:r.spd, fourx:r.fourx, mv:r.mv, hasRec:r.hasRec, recovery:r.recovery}));

const out = {
  noRecTotal: noRec.length,
  breakNameCount: breakName.length,
  stallCount: stallRows.length, stallUniq: uniq(stallRows).length,
  recycleCount: recycleRows.length, recycleUniq: uniq(recycleRows).length,
  stallRows, recycleRows, breakName,
  dreamCount: dream.length, dreamUniq: uniq(dream).length, dream,
};
fs.writeFileSync(path.join(__dirname,'_ev4387_d3.json'), JSON.stringify(out,null,1));

console.log('无真回复须替换(empty+six 合计):', noRec.length, '; 唯一物种', uniq(noRec).length);
console.log('子集① 破名风险合计:', breakName.length, `（受队消耗 ${stallRows.length} / 唯一 ${uniq(stallRows).length}；回收一次流 ${recycleRows.length} / 唯一 ${uniq(recycleRows).length}，均带 278 回收利用）`);
stallRows.forEach(r => console.log(`  [受队] #${r.id} ${r.zh} [${r.tag}] bulk=${r.bulk} Def=${r.def} SpD=${r.spd} 四x=${(r.fourx||[]).join('/')||'无'} 招=${r.mv.join('/')}`));
recycleRows.forEach(r => console.log(`  [回收] #${r.id} ${r.zh} [${r.tag}] bulk=${r.bulk} Def=${r.def} SpD=${r.spd} 四x=${(r.fourx||[]).join('/')||'无'} 招=${r.mv.join('/')}`));
console.log('子集② 食梦悬空:', dream.length, '记录 / 唯一物种', uniq(dream).length);
dream.forEach(r => console.log(`  #${r.id} ${r.zh} [${r.tag}] ${r.name} bulk=${r.bulk} Def=${r.def} SpD=${r.spd} 四x=${(r.fourx||[]).join('/')||'无'} 招=${r.mv.join('/')}`));
