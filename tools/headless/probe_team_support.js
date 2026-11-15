// 探针：速攻手（速≥100 进攻流派、非恶作剧之心、无自动体系）身上携带
// 「花自己回合、收益主要在队友」的队伍级辅助招 —— 按类别逐一量化。
const H = require('./harness.js');
const { ERDATA, deriveBuilds, MV } = H;

const CAT = {
  '墙':      [113, 115, 657],        // 光墙/反射壁/极光幕
  '钉子':    [191, 390, 446, 564],   // 撒菱/毒菱/隐形岩/黏黏网
  '顺风':    [366],
  '双打辅助':[270, 469, 501, 502],   // 帮助/广域防守/快速防守/交换场地
  '空间':    [433],
  '牺牲退场':[262, 361],             // 临别礼物/治愈之愿
  '队伍治疗':[215, 312, 461, 915],     // 治愈铃声/芳香治疗/新月舞/新月祈祷
  '其他队伍级':[54, 114, 219, 356, 432, 702] // 白雾/黑雾/神秘守护/重力/清除浓雾/换场
};
const OFFROLE = ['增伤', '输出', '强化'];

const rows = [];
for (const s of ERDATA.species) {
  const bs = s.base;
  const spe = bs[5];
  let builds;
  try { builds = deriveBuilds(s, []); } catch (e) { continue; }
  for (const b of builds) {
    const side = b.side;
    if (!['物理', '特殊', '双刀'].includes(side)) continue;
    if (OFFROLE.indexOf(b.roleTag) < 0) continue;
    const prank = !!(b.abi[0] && /恶作剧之心/.test(b.abi[0].n));
    const main = (b.mv.main || []).map(m => +m.id);
    const func = ((b.mv.func || []).map(m => +m.id));
    for (const cat of Object.keys(CAT)) {
      const ids = CAT[cat];
      const hitM = main.filter(id => ids.includes(id));
      const hitF = func.filter(id => ids.includes(id));
      if (!hitM.length && !hitF.length) continue;
      rows.push({
        cat, id: s.id, zh: s.zh, spe, bulk: bs[0] + bs[2] + bs[4],
        name: b.name, side, role: b.roleTag, score: b.score, prank,
        glass: spe >= 100 && (bs[0] + bs[2] + bs[4]) < 270,
        hitM, hitF,
        moves: main.map(id => (MV[id] ? MV[id][1] : id)).join('/')
      });
    }
  }
}

const fast = rows.filter(r => r.spe >= 100 && !r.prank);
console.log('=== 全库进攻流派（物理/特殊/双刀 + role 增伤/输出/强化）命中总数 ===');
const byCat = {};
for (const r of rows) { byCat[r.cat] = (byCat[r.cat] || 0) + 1; }
for (const c of Object.keys(CAT)) console.log('  ' + c + ':', byCat[c] || 0, '（其中速≥100非恶作剧:', fast.filter(r => r.cat === c).length + '）');
console.log('  总命中:', rows.length, '| 速≥100 非恶作剧:', fast.length, '| 慢速:', rows.filter(r => r.spe < 100).length, '| 恶作剧:', rows.filter(r => r.prank).length);
console.log('\n=== 速≥100 非恶作剧 明细 ===');
for (const r of fast) {
  console.log(`[${r.cat}] #${r.id} ${r.zh} 速${r.spe} 耐${r.bulk}${r.glass ? '[玻璃]' : ''} ${r.name} ${r.side}/${r.role} sc${r.score} 槽:${r.hitM.length ? '主' + r.hitM.join(',') : ''}${r.hitF.length ? ' func' + r.hitF.join(',') : ''} | ${r.moves}`);
}
