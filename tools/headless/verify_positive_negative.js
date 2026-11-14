// 为 12 个接入特性找正例（实配含族群招）与反例，确认两分支与倍率文案
const H = require('./harness.js');
const { ERDATA, deriveBuilds, learnOf, MV, MV_FLAG } = H;
const target = {
  '巨翼': 'air', '强大之角': 'horn', '弓箭手': 'arrow', '超级重击者': 'hammer',
  '神话之箭': 'arrow', '能量角': 'horn', '穿刺者': 'horn', '灵魂粉碎者': 'hammer',
  '岩石载荷': 'rockthrow', '恶作剧礼物': 'icethrow', '锤拳': 'fisthammer', '巨型钻头': 'horndrill'
};
const positive = {};
const negative = {};
ERDATA.species.forEach(function (s) {
  let bs;
  try { bs = deriveBuilds(s, []); } catch (e) { return; }
  bs.forEach(function (b) {
    (b.abi || []).forEach(function (x) {
      if (!(x.n in target)) return;
      const why = (x.why || []).filter(function (w) { return /招 ×|族群|不触发/.test(w); });
      why.forEach(function (w) {
        if (/×/.test(w) && !positive[x.n]) positive[x.n] = { s: s.id, zh: s.zh, b: b.name, w: w };
        if (/不触发/.test(w) && !negative[x.n]) negative[x.n] = { s: s.id, zh: s.zh, b: b.name, w: w };
      });
    });
  });
});
console.log('=== 正例（命中族群，含倍率）===');
Object.keys(target).forEach(function (n) {
  const p = positive[n];
  console.log(n + ':', p ? ('#' + p.s + ' ' + p.zh + '「' + p.b + '」→ ' + p.w) : '（无正例）');
});
console.log('\n=== 反例（无族群招）===');
Object.keys(target).forEach(function (n) {
  const p = negative[n];
  console.log(n + ':', p ? ('#' + p.s + ' ' + p.zh + ' → ' + p.w) : '（无反例）');
});
