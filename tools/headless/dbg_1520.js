const H = require('./harness_dbg.js');
const { ERDATA, MV, buildMoves, pickAbiFor, abiSysOf, abiSetOf, abiSetExt } = H;
const s = ERDATA.species.find(x=>String(x.id)==='1520');
console.log("buildMoves('特殊'):");
const bm = buildMoves(s,'特殊','输出');
console.log("  main:", bm.main.map(x=>MV[x.id][1]+"("+x.id+")/"+x.kind).join(', '));
console.log("  func:", (bm.func||[]).map(x=>MV[x.id][1]).join(', '));
console.log("\npickAbiFor general:");
for (const a of pickAbiFor(s,'特殊','输出',{}))
  console.log("  ", a.n, "id"+a.id, "sc"+a.sc, "|", a.why[0]||'');
console.log("\n体系归属:");
for (const n of s.abis)
  console.log("  ", n, "sysOf="+abiSysOf(n), "setOf="+abiSetOf(n), "setExt="+abiSetExt(n));
