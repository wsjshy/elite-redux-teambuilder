const e=require('./_ev4387_e8.json');
const o=e.out;
const ub = r => {
  if(r.walls.length>0) return 'wall';
  if(r.imm) return 'imm';
  return 'other';
};
const cnt=(arr,k)=>arr.filter(r=>ub(r)===k).length;
console.log('总数',o.length);
console.log('用户口径: wall',cnt(o,'wall'),'imm',cnt(o,'imm'),'other',cnt(o,'other'));
console.log('引擎口径: wall',o.filter(r=>r.ledgerName==='双墙辅助流').length,'imm',o.filter(r=>r.ledgerName==='属性免疫联防位').length,'other',o.filter(r=>!['双墙辅助流','属性免疫联防位'].includes(r.ledgerName)).length);
console.log('\n交叉表（引擎名 × 用户桶）:');
['双墙辅助流','属性免疫联防位','回收一次流','扑击铁壁流'].forEach(en=>{
  const rows=o.filter(r=>r.ledgerName===en);
  console.log(`引擎=${en} (${rows.length}): 用户wall=${rows.filter(r=>ub(r)==='wall').length} 用户imm=${rows.filter(r=>ub(r)==='imm').length} 用户other=${rows.filter(r=>ub(r)==='other').length}`);
});
console.log('\n引擎免疫但用户other（无特性/类型免疫）:');
o.filter(r=>r.ledgerName==='属性免疫联防位'&&ub(r)==='other').forEach(r=>console.log(`  #${r.id} ${r.zh} [${r.types.join('/')}] 特性=${r.abi0} immAbi=${r.immAbi} tImm=${r.immType.join('/')||'无'} 招=${r.main.join('/')}`));
console.log('\n引擎双墙但用户imm（有类型/特性免疫）:');
o.filter(r=>r.ledgerName==='双墙辅助流'&&ub(r)==='imm').forEach(r=>console.log(`  #${r.id} ${r.zh} [${r.types.join('/')}] 特性=${r.abi0} immAbi=${r.immAbi} tImm=${r.immType.join('/')||'无'} 墙=${r.walls.join('|')}`));
