// 按 abiIds/innIds 统计指定自动设置特性的持有物种数
const H = require('./harness.js');
const { ERDATA } = H;
const targets = [76, 320, 346, 348, 870, 871, 833, 953, 604, 867];
for (const tid of targets) {
  const a = ERDATA.abilities[tid];
  const zh = a ? a[2] : '?';
  let n = 0; const examples = [];
  for (const s of ERDATA.species) {
    const ids = (s.abiIds || []).concat(s.innIds || []).map(Number);
    if (ids.indexOf(tid) > -1) { n++; if (examples.length < 6) examples.push(`${s.id}${s.zh}`); }
  }
  console.log(`${tid} ${zh}: ${n} 只 | ${examples.join(', ')}`);
}
