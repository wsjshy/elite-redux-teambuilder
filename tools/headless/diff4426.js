// 改前/改后快照对账：按物种对比流派签名
const fs = require('fs');
const before = JSON.parse(fs.readFileSync('baseline4426.json'));
const after = JSON.parse(fs.readFileSync('after4426.json'));

let added = 0, removed = 0, changed = 0;
const removedDetail = [], changedDetail = [];
const sig = b => [b.n, b.r, b.sd, b.it, b.nat, b.ev.join('.'), b.m.join('.')].join('|');

for (const id of Object.keys(before)) {
  const bArr = before[id] || [];
  const aArr = after[id] || [];
  const bSigs = bArr.map(sig), aSigs = aArr.map(sig);
  // 移除：before 有 after 无
  bSigs.forEach((s, i) => {
    if (aSigs.indexOf(s) < 0) {
      removed++;
      removedDetail.push({ id, b: bArr[i] });
    }
  });
  aSigs.forEach((s, i) => {
    if (bSigs.indexOf(s) < 0) added++;
  });
  if (bArr.length === aArr.length && bSigs.some((s, i) => s !== aSigs[i])) {
    changed++;
    changedDetail.push({ id, b: bArr, a: aArr });
  }
}
console.log('added', added, 'removed', removed, 'changed(同数异签名)', changed);

// 移除卡按流派名分类
const byName = {};
removedDetail.forEach(x => { byName[x.b.n] = (byName[x.b.n] || 0) + 1; });
console.log('\n移除卡按流派:', JSON.stringify(byName));
console.log('\n移除明细（前 30）:');
removedDetail.slice(0, 30).forEach(x => {
  console.log('#' + x.id, x.b.n, '| item', x.b.it, '| nat', x.b.nat, '| ev', x.b.ev.join(','), '| moves', x.b.m.join(','));
});

// 变化卡：聚焦双墙相关
console.log('\n变化卡数', changedDetail.length, '示例（前 15）:');
changedDetail.slice(0, 15).forEach(x => {
  console.log('#' + x.id);
  x.b.forEach((b, i) => {
    const a = x.a[i];
    if (sig(b) === sig(a)) return;
    console.log('  BEFORE', b.n, '| it', b.it, '| nat', b.nat, '| ev', b.ev.join(','), '| m', b.m.join(','));
    console.log('  AFTER ', a.n, '| it', a.it, '| nat', a.nat, '| ev', a.ev.join(','), '| m', a.m.join(','));
  });
});
