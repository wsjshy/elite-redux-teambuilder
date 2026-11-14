const H = require('./harness.js');
const { ERDATA, deriveBuilds, MV } = H;

const s = ERDATA.species.find(x => String(x.id) === '1520');
console.log("物种:", s.zh, s.en, "属性", s.t1, s.t2, "base", s.base);
const bs = deriveBuilds(s, []);
console.log("流派数:", bs.length);
for (const b of bs) {
  console.log("\n=== 流派:", b.name, "| side", b.side, "| role", b.roleTag, "| score", b.score);
  console.log("特性:", b.abi.map(a => a.n + "(id" + a.id + ")").join(', '));
  console.log("道具:", b.it.map(i => i[0]).join(', '));
  console.log("性格:", b.nat[0][0]);
  console.log("EV:", b.ev.alloc.join('/'), "|", b.ev.summary);
  console.log("主招:", b.mv.main.map(m => MV[m.id][1] + "(" + m.id + ")").join(' / '));
  if (b.warn) console.log("warn:", b.warn);
}
