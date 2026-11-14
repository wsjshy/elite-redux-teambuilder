const H = require('./harness.js');
const { ERDATA, deriveBuilds, classifyBuilds, learnOf, MV, ITM } = H;

// 找 1520
const s = ERDATA.species.find(x => String(x.id) === '1520');
console.log("=== species ===");
console.log(JSON.stringify({
  id: s.id, zh: s.zh, en: s.en, t1: s.t1, t2: s.t2,
  base: s.base, abis: s.abis, abiIds: s.abiIds, inns: s.inns, innIds: s.innIds
}, null, 0));

// 找欺诈
console.log("\n=== 欺诈 / 相关招 ===");
for (const id in MV) {
  const r = MV[id];
  if (r[1] === '欺诈' || r[2] === 'Foul Play') {
    console.log("FoulPlay:", JSON.stringify(r));
  }
}
// 黑鲁加可学招里物理/恶/火相关
const learn = learnOf(s);
console.log("\nlearnset count:", learn.length);
const interesting = learn.map(id => MV[id]).filter(r => r &&
  (r[3] === '恶' || r[3] === '火' || r[4] === '变化'));
for (const r of interesting) {
  console.log(r[0], r[1], r[2], '| type', r[3], '| cat', r[4], '| pow', r[5], '| acc', r[6], '| prio', r[8]);
}
