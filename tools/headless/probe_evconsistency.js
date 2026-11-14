// 探针：全库校验答案卡显示的 ev.summary 是否与 alloc 一致（防止出现 stale 满速/速攻标签）
const H = require('./harness.js');
const { ERDATA, deriveBuilds } = H;

const NM = ['HP', '攻', '防', '特攻', '特防', '速'];
function expectSummary(a) {
  const r = [];
  for (let i = 0; i < 6; i++) { if (a[i]) r.push(NM[i] + ' ' + a[i]); }
  return r.length ? r.join(' / ') : '—';
}

let builds = 0;
const bad = [];
ERDATA.species.forEach(function (s) {
  let bs;
  try { bs = deriveBuilds(s, []); } catch (e) { return; }
  bs.forEach(function (b) {
    builds++;
    const a = (b.ev && b.ev.alloc) || [];
    const sum = b.ev && b.ev.summary;
    if (sum !== expectSummary(a)) {
      bad.push({ id: s.id, zh: s.zh, name: b.name, alloc: a, summary: sum, expect: expectSummary(a) });
    }
  });
});

console.log('总流派数:', builds);
console.log('summary 与 alloc 不一致条数:', bad.length);
bad.forEach(function (b) {
  console.log('#' + b.id, b.zh, b.name, '| alloc=' + JSON.stringify(b.alloc),
    '| summary="' + b.summary + '" expect="' + b.expect + '"');
});
