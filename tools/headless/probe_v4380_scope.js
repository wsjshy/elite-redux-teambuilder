// v4.380 范围探针：复刻引擎触发条件 T（速≥100 + 进攻侧/角色 + 非恶作剧 + 无自动体系 + 非 score99）
const H = require('./harness.js');
const { ERDATA, deriveBuilds, MV, ownAutoSys } = H;
const CAT = {
  '钉子': [191, 390, 446, 564],
  '空间': [433],
  '墙':   [113, 115, 657]
};
const OFF = ['物理', '特殊', '双刀'];
const ROLE = ['增伤', '输出', '强化'];
const out = { '钉子': [], '空间': [], '墙': [] };
const skipped = [];
for (const s of ERDATA.species) {
  const spe = +s.base[5];
  let bs; try { bs = deriveBuilds(s, []); } catch (e) { continue; }
  for (const b of bs) {
    const side = String(b.side), role = String(b.roleTag);
    const main = (b.mv.main || []).map(m => +m.id);
    const func = (b.mv.func || []).map(m => +m.id);
    const all = [...main, ...func];
    let hitCat = null;
    for (const c of Object.keys(CAT)) if (all.some(id => CAT[c].includes(id))) { hitCat = c; break; }
    if (!hitCat) continue;
    const off = OFF.includes(side) && ROLE.includes(role);
    const prank = !!(b.abi[0] && /恶作剧之心/.test(b.abi[0].n));
    let auto = []; try { auto = ownAutoSys(s) || []; } catch (e) { auto = ['ERR']; }
    const inT = spe >= 100 && off && !prank && !auto.length && b.score !== 99;
    const rec = { id: s.id, zh: s.zh, spe, side, role, score: b.score, name: b.name,
      main: main.join(','), func: func.join(','), auto: auto.join('|'), abi: b.abi[0] && b.abi[0].n };
    if (inT) out[hitCat].push(rec);
    else skipped.push({ cat: hitCat, ...rec, why: !off ? '非进攻' : prank ? '恶作剧' : auto.length ? '自动体系:'+auto.join('|') : b.score === 99 ? 'score99' : '慢速' });
  }
}
for (const c of Object.keys(out)) {
  console.log('=== 触发范围内 [' + c + '] ' + out[c].length + ' 条 ===');
  for (const r of out[c]) console.log(`  #${r.id} ${r.zh} 速${r.spe} ${r.side}/${r.role} sc${r.score} ${r.name} | main:${r.main} func:${r.func} | abi:${r.abi}`);
}
console.log('\n=== 被条件排除 ===');
for (const r of skipped) console.log(`  [${r.cat}] #${r.id} ${r.zh} 速${r.spe} ${r.side}/${r.role} sc${r.score} ${r.name} 排除:${r.why}`);
