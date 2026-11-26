const fs = require('fs');
const before = JSON.parse(fs.readFileSync(__dirname + '/baseline4425.json', 'utf8'));
const after = JSON.parse(fs.readFileSync(__dirname + '/after4425.json', 'utf8'));
const FIELD = [366, 433, 113, 115, 657, 240, 241, 201, 258, 580, 581, 604, 641];
let bN = 0, aN = 0, not4 = 0, nameChg = 0, fieldRemoved = 0, lostBuilds = 0;
const examples = [];
const ids = new Set(Object.keys(before).concat(Object.keys(after)));
for (const id of ids) {
  const B = before[id] || [], A = after[id] || [];
  bN += B.length; aN += A.length;
  for (const b of A) if (b.m.length !== 4) { not4++; console.log('非4槽:', id, b.n, b.m); }
  // 按 (name 或 index) 对齐：用名字匹配
  A.forEach((b, i) => {
    const old = B[i];
    if (!old) return;
    if (old.n !== b.n) nameChg++;
    const removed = old.m.filter(x => FIELD.indexOf(x) > -1 && b.m.indexOf(x) < 0);
    if (removed.length) {
      fieldRemoved += removed.length;
      if (examples.length < 8) examples.push({ id, old: old.n, now: b.n, removed, moves: b.m });
    }
  });
  if (A.length < B.length) lostBuilds += B.length - A.length;
}
console.log(JSON.stringify({ bN, aN, delta: aN - bN, not4, nameChg, fieldRemoved, lostBuilds, examples }, null, 1));
