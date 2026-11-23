const H = require('./harness.js');
const { ERDATA } = H;
const fin = s => { try { return H.isFinalSp(s) && H.isValidSp(s); } catch (e) { return false; } };
const isWall = b => b.name && b.name.indexOf('双墙') > -1;

// ① 全库墙卡物种 GC/非GC
const gc = [], non = [];
ERDATA.species.forEach(s => {
  if (!fin(s)) return;
  let bs; try { bs = H.deriveBuilds(s, []); } catch (e) { return; }
  if (!bs.some(isWall)) return;
  (H.isGlassCannon(s) ? gc : non).push(s);
});
console.log('① 双墙卡物种：GC', gc.length, ' 非GC', non.length);
if (gc.length) console.log('   残留 GC:', gc.map(s => '#' + s.id + s.zh).join('、'));

// ② 原本 GC 有墙的那批，现在还剩几张卡（零卡审计）
const oldGcIds = [26,65,166,178,189,196,282,311,312,313,314,386,466,475,478,482,547,561,615,655,678,743,785,806,989,991,1010,1015,1071,1096,1507,1529,1553,1557,1571,1588,1857,1891,2145,2156,2166,2208,1633,1635];
let zero = [];
oldGcIds.forEach(id => {
  const s = ERDATA.species.find(x => x.id === id); if (!s) return;
  let bs; try { bs = H.deriveBuilds(s, []); } catch (e) { zero.push('#' + id + 'ERR'); return; }
  if (!bs.length) zero.push('#' + id + s.zh);
});
console.log('② 原 GC 墙手 零卡数:', zero.length, zero.join('、'));

// ③ 全库「强化」角色池
const pool = [];
ERDATA.species.forEach(s => {
  if (!fin(s)) return;
  let roles; try { roles = H.mateRoleOf(s); } catch (e) { return; }
  if (roles && roles.indexOf('强化') > -1) pool.push({ id: s.id, zh: s.zh, ab: H.atkBest(s), sd: H.spdOf(s) });
});
console.log('③ 强化角色池:', pool.length, '  最低火力:', Math.min(...pool.map(p => p.ab)), ' 最低速:', Math.min(...pool.map(p => p.sd)));
[97, 1104, 1507, 26].forEach(id => {
  const s = ERDATA.species.find(x => String(x.id) === String(id)); if (!s) return;
  let roles = []; try { roles = H.mateRoleOf(s); } catch (e) { }
  console.log('   #' + id, s.zh, 'atk' + H.atkBest(s) + '/spd' + H.spdOf(s), '角色:', (roles || []).join('/'));
});

// ④ 胡地核心
const ala = ERDATA.species.find(x => String(x.id) === '1507');
console.log('\n④ 胡地#1507 卡片:', H.deriveBuilds(ala, []).map(b => b.name + '[' + b.roleTag + ']').join('｜'));
const a1 = H.findTeammates(ala); const p1 = a1.main || a1;
console.log('   答案卡:');
p1.slice(0, 6).forEach((p, i) => console.log('    ', i, '#' + p.s.id, p.s.zh, p.priRole, '(atk' + H.atkBest(p.s) + '/spd' + H.spdOf(p.s) + ')'));

// ⑤ 引梦貘人核心
const hyp = ERDATA.species.find(x => String(x.id) === '97');
console.log('\n⑤ 引梦貘人#97 卡片:', H.deriveBuilds(hyp, []).map(b => b.name + '[' + b.roleTag + ']').join('｜'));
const a2 = H.findTeammates(hyp); const p2 = a2.main || a2;
console.log('   答案卡:');
p2.slice(0, 6).forEach((p, i) => console.log('    ', i, '#' + p.s.id, p.s.zh, p.priRole, '(atk' + H.atkBest(p.s) + '/spd' + H.spdOf(p.s) + ')'));
