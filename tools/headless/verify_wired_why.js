// 全库找首推特性为 12 个新接入特性的流派，打印其族群 why，确认规则生效
const H = require('./harness.js');
const { ERDATA, deriveBuilds } = H;
const wired = ['巨大翅膀', '大角', '弓手', '大锤', '神秘箭矢', '能量之角', '穿刺者',
  '灵魂锤击', '搬岩', '恶作剧礼物', '锤拳', '巨型钻头'];
const seen = {};
let count = 0;
ERDATA.species.forEach(function (s) {
  let bs;
  try { bs = deriveBuilds(s, []); } catch (e) { return; }
  bs.forEach(function (b) {
    const t = b.abi && b.abi[0];
    if (t && wired.indexOf(t.n) >= 0) {
      count++;
      if (!seen[t.n]) {
        seen[t.n] = true;
        const why = (t.why || []).filter(function (w) { return /招 ×|族群|不触发/.test(w); });
        console.log('#' + s.id, s.zh, '| 流派「' + b.name + '」首推=' + t.n + ' sc=' + t.sc);
        why.forEach(function (w) { console.log('   ', w); });
      }
    }
  });
});
console.log('\n首推为新接入特性的流派总数:', count);
console.log('已覆盖特性:', Object.keys(seen).join(','));
