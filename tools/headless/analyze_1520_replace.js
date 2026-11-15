const H = require('./harness.js');
const { ERDATA, learnOf, MV, pickAttacks } = H;

const s = ERDATA.species.find(x => String(x.id)==='1520');
console.log("学习集（特殊/变化招）:");
for (const id of learnOf(s)) {
  const m=MV[id];
  if (m && (m[4]==='特殊'||m[4]==='变化'))
    console.log("  ", m[1], id, m[3], m[4], "pow",m[5],"acc",m[6]);
}
console.log("\nabIs:", s.abis, s.abiIds);
try {
  const pa = pickAttacks(s, '特殊');
  console.log("\npickAttacks('特殊'):", (pa||[]).map(x=>MV[x.id]?MV[x.id][1]+"("+x.id+")":x.id).slice(0,12));
} catch(e){ console.log("pickAttacks err", e.message); }
