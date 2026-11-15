// v4.380 全库验证：复刻引擎触发条件 T，统计 钉子/戏法空间/双墙 残留；
// 双 harness（HEAD=v4.379 基线 vs 当前）逐条 diff 出被改动流派的 原招→新招。
const fs = require('fs');
const path = require('path');
const H1 = require('./harness.js');
const H0 = require('./_head_harness.js');

const HAZ = [191, 390, 446, 564];
const TR = 433;
const WALL = [113, 115, 657];
const OFF = ['物理', '特殊', '双刀'];
const ROLE = ['增伤', '输出', '强化'];

const mvName = (H, id) => (H.MV[id] && H.MV[id][1]) || ('#' + id);

let hazResid = [], trResid = [], wall2Resid = [];
const changed = { haz: [], tr: [], wall: [] };
let tTotal = 0;

for (const s of H1.ERDATA.species) {
  const spe = +s.base[5];
  let b1, b0;
  try { b1 = H1.deriveBuilds(s, []); } catch (e) { continue; }
  try { b0 = H0.deriveBuilds(s, []); } catch (e) { b0 = []; }

  for (let i = 0; i < b1.length; i++) {
    const b = b1[i], old = b0[i];
    const side = String(b.side), role = String(b.roleTag);
    const main = (b.mv.main || []).map(m => +m.id);
    const func = (b.mv.func || []).map(m => +m.id);
    const abi0 = b.abi && b.abi[0] && b.abi[0].n || '';
    const prank = /恶作剧之心/.test(abi0);
    let auto = []; try { auto = H1.ownAutoSys(s) || []; } catch (e) { auto = []; }
    const inT = spe >= 100 && OFF.includes(side) && ROLE.includes(role) &&
      !prank && !auto.length && b.score !== 99;
    if (!inT) continue;
    tTotal++;

    const all = main.concat(func);
    const hazHit = all.filter(id => HAZ.includes(id));
    const trHit = all.filter(id => id === TR);
    const wallHit = all.filter(id => WALL.includes(id));
    if (hazHit.length) hazResid.push({ id: s.id, zh: s.zh, name: b.name, moves: main.join(',') });
    if (trHit.length) trResid.push({ id: s.id, zh: s.zh, name: b.name, moves: main.join(',') });
    if (wallHit.length >= 2) wall2Resid.push({ id: s.id, zh: s.zh, name: b.name, moves: main.join(',') });

    // 招组 diff（HEAD → 当前）
    const oldIds = old ? (old.mv.main || []).map(m => +m.id) : [];
    const removed = oldIds.filter(id => !main.includes(id));
    const added = main.filter(id => !oldIds.includes(id));

    const rec = {
      id: s.id, zh: s.zh, side, role, score: b.score,
      name: b.name, oldName: old ? old.name : '?',
      old: oldIds.map(id => id + ':' + mvName(H0, id)),
      now: main.map(id => id + ':' + mvName(H1, id)),
      removed: removed.map(id => id + ':' + mvName(H1, id)),
      added: added.map(id => id + ':' + mvName(H1, id)),
      nameMismatch: b.nameMismatch || ''
    };
    if (b.hazTeamRemoved != null) changed.haz.push(rec);
    if (b.trSelfRemoved != null) changed.tr.push(rec);
    if (b.wallTeamRemoved != null || b.wallSelfKept) changed.wall.push(rec);
  }
}

const lines = [];
lines.push('=== v4.380 全库验证（触发范围内：速≥100 且 side∈物理/特殊/双刀 且 role∈增伤/输出/强化 非恶作剧 无自动体系 非 score99） ===');
lines.push('触发范围内流派数: ' + tTotal);
lines.push('钉子残留 = ' + hazResid.length + (hazResid.length ? '  ' + JSON.stringify(hazResid) : ''));
lines.push('戏法空间残留 = ' + trResid.length + (trResid.length ? '  ' + JSON.stringify(trResid) : ''));
lines.push('墙≥2 张残留 = ' + wall2Resid.length + (wall2Resid.length ? '  ' + JSON.stringify(wall2Resid) : ''));
lines.push('');

function dump(title, arr, marker) {
  lines.push('=== ' + title + '（共 ' + arr.length + ' 条） ===');
  arr.forEach((c, i) => {
    lines.push(`${i + 1}. #${c.id} ${c.zh} [${c.side}/${c.role} sc${c.score}] ${c.oldName} → ${c.name}`);
    lines.push(`   旧招: ${c.old.join(' | ')}`);
    lines.push(`   新招: ${c.now.join(' | ')}`);
    lines.push(`   变动: ${c.removed.join(' , ')}  →  ${c.added.join(' , ')}`);
    if (c.nameMismatch) lines.push(`   命名: ${c.nameMismatch}`);
  });
  lines.push('');
}
dump('① 钉子移除（速攻手不自己铺钉，交队友）', changed.haz);
dump('② 戏法空间移除（速≥100 开空间＝自己变最后出手）', changed.tr);
dump('③ 墙（单张保留保命 / 第二张替换）', changed.wall);

const out = lines.join('\r\n');
console.log(out);
fs.writeFileSync(path.join(__dirname, 'out_v4380_probe.txt'), out + '\r\n', 'utf8');
console.log('[written] out_v4380_probe.txt');
console.log('汇总: 钉子 ' + changed.haz.length + ' / 空间 ' + changed.tr.length + ' / 墙 ' + changed.wall.length);

process.exit((hazResid.length || trResid.length || wall2Resid.length) ? 1 : 0);
