// v4.425 全库量化：进攻流派（输出/增伤/强化）携带「手动队伍级场地招」的完整清单
// 不设速度门槛（v4.381 旧探针只看速≥100，且把耐久≥270 当保留依据——本探针验证该口径缺口）
const H = require('./harness.js');
const { ERDATA, deriveBuilds, MV } = H;

const OFF_SIDE = ['物理', '特殊', '双刀'];
const OFF_ROLE = ['增伤', '输出', '强化'];
const CATS = {
  weather: [240, 241, 201, 258],          // 求雨/大晴天/沙暴/冰雹
  terrain: [580, 581, 604, 641],          // 青草/薄雾/电气/精神场地
  tailwind: [366],
  trickroom: [433],
  wall: [113, 115, 657],
  hazard: [191, 390, 446, 564],
};
const CAT_OF = {};
Object.keys(CATS).forEach(c => CATS[c].forEach(id => { CAT_OF[id] = c; }));

const stat = {};
Object.keys(CATS).forEach(c => { stat[c] = { buildN: 0, spN: new Set(), examples: [] }; });
let inScope = 0;
const prankN = { n: 0 }, autoN = { n: 0 };
for (const s of ERDATA.species) {
  let builds; try { builds = deriveBuilds(s, []); } catch (e) { continue; }
  for (const b of builds) {
    const side = String(b.side || ''), role = String(b.roleTag || '');
    if (OFF_SIDE.indexOf(side) < 0 || OFF_ROLE.indexOf(role) < 0) continue;
    if (b.score === 99) continue;
    const isPrank = !!(b.abi && b.abi[0] && /恶作剧之心/.test(String(b.abi[0].n)));
    let auto = [];
    try { auto = ownAutoSys(s) || []; } catch (e) { auto = []; }
    if (isPrank) { prankN.n++; continue; }
    if (auto.length) { autoN.n++; }
    inScope++;
    const ids = (b.mv.main || []).concat(b.mv.func || []).map(m => +m.id);
    const hitCats = new Set();
    ids.forEach(id => { const c = CAT_OF[id]; if (c) hitCats.add(c); });
    hitCats.forEach(c => {
      stat[c].buildN++;
      stat[c].spN.add(s.id);
      if (stat[c].examples.length < 12)
        stat[c].examples.push(`#${s.id} ${s.zh} 速${s.base[5]} | ${b.name} | ${ids.map(x => (MV[x] ? MV[x][1] : x)).join('/')}`);
    });
  }
}

console.log('进攻流派总数(已扣 score99/恶作剧; 含自动设置手):', inScope,
  '| 其中恶作剧豁免卡:', prankN.n, '| 自身自动体系卡:', autoN.n);
console.log('=== 手动队伍级场地招命中（进攻流派）===');
Object.keys(stat).forEach(c => {
  console.log(`\n[${c}] 命中流派 ${stat[c].buildN} 张，涉及物种 ${stat[c].spN.size} 只`);
  stat[c].examples.forEach(e => console.log('  ' + e));
});
