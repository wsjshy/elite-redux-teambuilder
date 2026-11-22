// probe4426_verify1507.js —— 修复后 #1507 双墙卡 + 全库墙卡统计
const H = require('./harness.js');
const { ERDATA, deriveBuilds, MV, FUNC_MV } = H;
const by = id => ERDATA.species.find(s => String(s.id) === String(id));

const s = by(1507);
const bs = deriveBuilds(s, []);
console.log('=== #1507', s.zh, 'builds', bs.length, '===');
bs.forEach((b, i) => {
  const ids = (b.mv.main || []).concat(b.mv.func || []).map(x => +x.id);
  console.log('[' + i + ']', b.name, '| role', b.roleTag, '| side', b.side,
    '| nat', (b.nat || []).map(n => n[0]).join(','),
    '| item', (b.it || []).map(x => x[0]).join(','),
    '| ev', JSON.stringify((b.ev || {}).alloc),
    '| tpl', (b.ev || {}).template);
  console.log('     moves', ids.map(id => id + ' ' + (MV[id] || [])[1]).join(' / '));
});

// 全库墙卡统计
let total = 0, dual = 0, veil = 0, single = 0, clay = 0;
const gcFast = [], nonGc = [];
for (const sp of ERDATA.species) {
  let b2; try { b2 = deriveBuilds(sp, []); } catch (e) { continue; }
  b2.forEach(b => {
    if (String(b.name).indexOf('双墙') < 0) return;
    total++;
    const ids = (b.mv.main || []).concat(b.mv.func || []).map(x => +x.id);
    const w = ids.filter(id => id === 113 || id === 115).length;
    if (ids.indexOf(657) >= 0) veil++;
    if (w >= 2) dual++; else if (w === 1) single++;
    if ((b.it || []).some(x => x[0] === '光之黏土')) clay++;
    if (H.isGlassCannon(sp)) gcFast.push(sp.zh); else nonGc.push(sp.zh);
  });
}
console.log('\n=== 全库双墙卡 ===');
console.log('total', total, '| dual(113+115)', dual, '| veil(657)', veil,
  '| single', single, '| 光之黏土', clay);
console.log('GC高速开墙', gcFast.length, '| 非GC耐久开墙', nonGc.length);
console.log('GC示例', gcFast.slice(0, 12).join(','));
console.log('非GC示例', nonGc.slice(0, 12).join(','));
