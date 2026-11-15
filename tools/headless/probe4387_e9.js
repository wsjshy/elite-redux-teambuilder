const e=require('./_ev4387_e8.json');
const o=e.out;
console.log('其他桶:');
o.filter(r=>r.curName!=='双墙辅助流'&&r.curName!=='属性免疫联防位').forEach(r=>console.log(`#${r.id} ${r.zh} 台账=${r.ledgerName} 当前=${r.curName} immType=${r.immType.join('/')||'无'} immAbi=${r.immAbi} walls=${r.walls.join('|')||'无'}`));
console.log('\ne7 错位:');
const e7=require('./_ev4387_e7.json');
e7.out.filter(r=>r.userBucket!==r.name).forEach(r=>console.log(`#${r.id} ${r.zh} 名=${r.name} user=${r.userBucket} wall=${r.hasWall} abi=${r.abi0}(${r.abiId}) tImm=${r.tImm.join('/')||'无'}`));
