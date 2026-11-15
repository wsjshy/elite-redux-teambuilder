// v4.381 探针：① 顺风(366) 在触发范围内的分布（按 isGlassCannon 分档）
//             ② 触发范围内全部变化招的出现频率（用于扫剩余「花自己回合、收益主要落在队友」的类别）
const H = require('./harness.js');
const { ERDATA, deriveBuilds, MV } = H;

const SPEED_HIGH = 100, BULK_MID = 270;
const OFFROLE = ['增伤', '输出', '强化'];
function bulk(s) { return (s.base[0] || 0) + (s.base[2] || 0) + (s.base[4] || 0); }
function glass(s) { return (s.base[5] || 0) >= SPEED_HIGH && bulk(s) < BULK_MID; }

let inScope = 0;
const tw = [];
const statusFreq = {};
const autoExcluded = [];
for (const s of ERDATA.species) {
  let builds; try { builds = deriveBuilds(s, []); } catch (e) { continue; }
  for (const b of builds) {
    const side = String(b.side || ''), role = String(b.roleTag || '');
    if (!['物理', '特殊', '双刀'].includes(side)) continue;
    if (OFFROLE.indexOf(role) < 0) continue;
    if (b.score === 99) continue;
    if ((s.base[5] || 0) < SPEED_HIGH) continue;
    if (b.abi && b.abi[0] && /恶作剧之心/.test(String(b.abi[0].n))) continue;
    inScope++;
    const main = (b.mv.main || []).map(m => +m.id);
    const func = ((b.mv.func || []).map(m => +m.id));
    // 顺风
    for (let i = 0; i < main.length; i++) {
      if (main[i] === 366) {
        tw.push({ id: s.id, zh: s.zh, g: glass(s), spe: s.base[5], bk: bulk(s),
          name: b.name, side, role, score: b.score,
          moves: main.map(x => (MV[x] ? MV[x][1] : x)).join('/'),
          nameHasTW: String(b.name || '').indexOf('顺风') === 0 });
      }
    }
    // 变化招频率（只统计 main 槽、且非伤害类：MV[id][4]==='变化'）
    for (const id of main.concat(func)) {
      const m = MV[id];
      if (!m) continue;
      if (m[4] !== '变化') continue;
      const key = id + '|' + m[1];
      if (!statusFreq[key]) statusFreq[key] = { id, zh: m[1], n: 0, glassN: 0 };
      statusFreq[key].n++;
      if (glass(s)) statusFreq[key].glassN++;
    }
  }
}

console.log('触发范围内流派数(已扣 score99/恶作剧/速<100):', inScope);
console.log('=== ① 顺风 366 ===');
console.log('  总命中:', tw.length,
  '| 玻璃大炮:', tw.filter(r => r.g).length,
  '| 耐久≥270:', tw.filter(r => !r.g).length,
  '| 名以顺风开头:', tw.filter(r => r.nameHasTW).length);

console.log('=== ② 触发范围内变化招频率（main+func）===');
const rows = Object.values(statusFreq).sort((a, b) => b.n - a.n);
for (const r of rows) console.log(`  ${r.id}\t${r.zh}\t${r.n}（玻璃 ${r.glassN}）`);
console.log('=== ③ 顺风明细（玻璃=待收口 / 耐久=保留）===');
for (const r of tw.slice().sort((a, b) => (a.g === b.g ? 0 : a.g ? -1 : 1)))
  console.log(`${r.g ? '[玻璃]' : '[耐久]'} #${r.id} ${r.zh} 速${r.spe} 耐${r.bk} ${r.name}${r.nameHasTW ? '(名带顺风)' : ''} ${r.side}/${r.role} sc${r.score} | ${r.moves}`);
