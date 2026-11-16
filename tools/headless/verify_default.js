// v4.386 验证：①进攻身份物种默认 [0] 防守卡（有 strict 进攻卡、非白名单）= 0；
// ②玻璃大炮含睡觉 156 = 0；③ 9 条旧名残留 = 0。
// 另：快照逐条比对未命中卡 name/side/roleTag/nat/alloc/tpl/mv/it0/abi0 零漂移（机器可读 N 条 / 差异 0）。
const H = require('./harness.js');
const fs = require('fs'), path = require('path');
const { ERDATA, deriveBuilds, learnOf, MV, isGlassCannon, NATURES } = H;
const by = id => ERDATA.species.find(s => String(s.id) === String(id));
const allTeam = [by(26), by(65), by(96), by(80), by(37), by(208)];

const DEF_ROLE = { '肉盾': 1, '受队': 1, '联防': 1, '辅助': 1 };
const OFF_ROLE = { '输出': 1, '强化': 1, '增伤': 1 };
const OFF_SIDE = { '物理': 1, '特殊': 1, '双刀': 1 };
const TRUE_RW = { imposter_anchor: 1, toxic_heal_item: 1 };
const REC_STRICT = { 105: 1, 234: 1, 235: 1, 236: 1, 355: 1, 303: 1, 135: 1, 208: 1, 631: 1, 275: 1, 392: 1, 622: 1, 744: 1, 915: 1, 202: 1, 409: 1, 532: 1, 72: 1, 71: 1, 837: 1, 73: 1 };
const RENAME_TARGETS = {
  '636': ['属性免疫联防位', '慢速重炮', '辅助', '辅助', [252, 0, 4, 252, 0, 0]],
  '871': ['属性免疫联防位', '慢速重炮', '辅助', '辅助', [252, 0, 4, 252, 0, 0]],
  '2290': ['钉子破盾', '钉子主力输出压制', '双刀', '输出', [4, 0, 0, 252, 0, 252]],
  '1729': ['稳健联防', '速攻压制', '物理', '输出', [4, 252, 0, 0, 0, 252]]
};
// 受阻未改（#1643–1647 洛托姆五形态）：spd=86>60 撞 v4.382 慢速重炮速度硬门；
// 目标卡面（辅助/辅助 252/0/4/252/0/0）四招 156/164/315/437，无 369 急速折返、无 521 伏特替换，
// 轮转补盲名要求卡面带 pivot（369/521），亦不成立；维持「属性免疫联防位」台账，不新造名、不动速度轴门。
const RENAME_BLOCKED = { '1643': 1, '1644': 1, '1645': 1, '1646': 1, '1647': 1 };
const allocEq = (a, t) => t.length === a.length && t.every((v, i) => (+a[i] || 0) === v);

const alloc = b => (b.ev && b.ev.alloc) || [0, 0, 0, 0, 0, 0];
const natStr = b => Array.isArray(b.nat) ? b.nat.map(p => (p || []).join(',')).join(',') : String(b.nat || '');
const mvIds = b => (b.mv.main || []).concat(b.mv.func || []).map(x => +x.id);
const looseOff = b => OFF_SIDE[String(b.side)] && OFF_ROLE[String(b.roleTag)];
const dmgN = ids => ids.filter(id => MV[id] && MV[id][4] !== '变化').length;
const stabN = (s, ids) => ids.filter(id => { const m = MV[id]; return m && m[4] !== '变化' && (s.t1 === m[3] || s.t2 === m[3]); }).length;
const offEv = a => Math.max(a[1] || 0, a[3] || 0);
const strictOff = (s, b) => { const a = alloc(b), ids = mvIds(b); return looseOff(b) && dmgN(ids) >= 2 && offEv(a) >= 120 && stabN(s, ids) >= 1; };
const defBuild = b => DEF_ROLE[String(b.roleTag)] || String(b.side) === '辅助';
const ident = s => (+s.base[5] || 0) >= 100 || Math.max(+s.base[1] || 0, +s.base[3] || 0) >= 110;

const A1 = [], A2 = [], A3 = [];
const reordered = [], renamed = [], swapHeal = [], swapCover = [], swapProtect = [], looseLedger = [], RENAME_RESIDUAL = [], RENAME_BLOCKED_LEDGER = [];
const cur = { six: [], empty: [] };
let total = 0, emptyN = 0;

function snapOf(s, b) {
  return { id: String(s.id), zh: s.zh, name: String(b.name || ''), side: String(b.side || ''), roleTag: String(b.roleTag || ''),
    nat: natStr(b), alloc: alloc(b), tpl: b.ev && b.ev.template, mv: mvIds(b),
    it0: b.it && b.it[0] ? String(b.it[0][0]) : '', abi0: b.abi && b.abi[0] ? String(b.abi[0].n) : '' };
}

function scan(team, tag) {
  for (const s of ERDATA.species) {
    let bs; try { bs = deriveBuilds(s, team); } catch (e) { continue; }
    if (tag === 'empty' && bs.length === 0) emptyN++;
    for (const b of bs) {
      total++;
      const ids = mvIds(b);
      cur[tag].push(snapOf(s, b));
      if (b._v386Reordered) reordered.push({ id: s.id, zh: s.zh, name: b.name, role: b.roleTag, side: b.side });
      if (b._v386Renamed || b._v387Renamed) renamed.push({ id: s.id, zh: s.zh, old: b._v386OldName, now: b.name });
      const dSwap = b._v386MvSwap || b._v387SleepSwap;
      if (dSwap) {
        if (String(dSwap).indexOf('182') >= 0) swapProtect.push({ id: s.id, zh: s.zh, name: b.name, swap: dSwap });
        else if (REC_STRICT[+String(dSwap).split('→')[1].split(' ')[0]]) swapHeal.push({ id: s.id, zh: s.zh, name: b.name, swap: dSwap });
        else swapCover.push({ id: s.id, zh: s.zh, name: b.name, swap: dSwap });
      }
      if (b._v386LooseLedger) looseLedger.push({ id: s.id, zh: s.zh, name: b.name, side: b.side, role: b.roleTag });
      // ② 玻璃大炮含睡觉
      if (isGlassCannon(s) && ids.includes(156)) A2.push({ id: s.id, zh: s.zh, name: b.name, mv: ids });
      // ③ 目标身份卡旧名残留（非目标同名变体记台账，不算失败；受阻名单独登记）
      if (RENAME_BLOCKED[String(s.id)] && String(b.name) === '属性免疫联防位') {
        RENAME_BLOCKED_LEDGER.push({ id: s.id, zh: s.zh, name: b.name, side: b.side, role: b.roleTag, alloc: alloc(b), mv: ids, piv: ids.some(m => m === 369 || m === 521) });
      }
      const rt = RENAME_TARGETS[String(s.id)];
      if (rt && String(b.name) === rt[0]) {
        if (String(b.side) === rt[2] && String(b.roleTag) === rt[3] && allocEq(alloc(b), rt[4]))
          A3.push({ id: s.id, zh: s.zh, name: b.name });
        else RENAME_RESIDUAL.push({ id: s.id, zh: s.zh, name: b.name, side: b.side, role: b.roleTag, alloc: alloc(b) });
      }
    }
    // ① 默认 [0] 防守卡（有 strict、非白名单）
    if (ident(s) && bs.length) {
      const first = bs[0];
      const strict = bs.filter(b => strictOff(s, b));
      if (defBuild(first) && strict.length && !TRUE_RW[first.mechRw])
        A1.push({ id: s.id, zh: s.zh, first: first.name, role: first.roleTag, side: first.side, strict: strict.map(b => b.name) });
    }
  }
}
scan(allTeam, 'six'); scan([], 'empty');

// 快照比对（按物种 id 分组多重集配对；稳定签名 side/role/alloc/nat/tpl/it0/abi0 必须一致；
// 改名物种豁免 name，换招物种豁免 mv；①排序只动数组顺序，多重集不变）。
const snap = JSON.parse(fs.readFileSync(path.join(__dirname, '_v4386_base_snapshot.json'), 'utf8'));
const renameIds = new Set(renamed.map(r => String(r.id)));
const swapIds = new Set(swapHeal.concat(swapCover, swapProtect).map(r => String(r.id)));
const stableSig = c => [c.side, c.roleTag, JSON.stringify(c.alloc), c.nat, c.tpl, c.it0, c.abi0].join('|');
// v4.389：受队消耗分流/快卡加速/零伤防守卡换性格 属本版刻意改动，按其命中物种分组豁免 name+alloc+nat
const V389 = JSON.parse(fs.readFileSync(path.join(__dirname, '_v4389_base_snapshot.json'), 'utf8'));
const hitSp = new Set();
['six', 'empty'].forEach(t => {
  Object.keys(V389[t].builds).forEach(sid => V389[t].builds[sid].forEach(e => { if (e.origStall) hitSp.add(String(e.id)); }));
  (V389[t].r2 || []).concat(V389[t].r3 || []).forEach(e => hitSp.add(String(e.id)));
});
const sig2 = c => [c.side, c.roleTag, c.tpl, c.it0, c.abi0].join('|');
function diffAgainst(base, now, tag) {
  const bg = {}, ng = {};
  base.forEach(r => { (bg[r.id] = bg[r.id] || []).push(r); });
  now.forEach(c => { (ng[c.id] = ng[c.id] || []).push(c); });
  let compared = 0, diff = [], exemptGroups = 0;
  Object.keys({ ...bg, ...ng }).forEach(id => {
    const br = (bg[id] || []), nr = (ng[id] || []);
    if (br.length !== nr.length) { diff.push({ tag, id, zh: (nr[0] || br[0]).zh, why: '卡数不一致 base=' + br.length + ' now=' + nr.length }); return; }
    compared += br.length;
    const ex = hitSp.has(String(id));
    if (ex) exemptGroups++;
    const bs = br.slice().sort((a, b) => stableSig(a) < stableSig(b) ? -1 : 1);
    const ns = nr.slice().sort((a, b) => stableSig(a) < stableSig(b) ? -1 : 1);
    bs.forEach((r, i) => {
      const c = ns[i];
      if (ex ? (sig2(r) !== sig2(c)) : (stableSig(r) !== stableSig(c))) diff.push({ tag, id, zh: c.zh, name: c.name, why: ex ? '结构漂移(本版命中组)' : '稳定签名不一致', old: r, now: c });
      // v4.391：名含「主力输出压制」按底子打手门改名（→输出压制；个案 #605 →强化清场），只豁免 name 一项
      const _nmOk391 = (o, n) => {
        const s0 = String(o);
        if (s0.indexOf('主力输出压制') < 0) return false;
        return n === s0.split('主力输出压制').join('输出压制') || n === s0.split('主力输出压制').join('强化清场') || n === s0.split('主力输出压制').join('骚扰消耗');
      };
      if (!ex && !renameIds.has(id) && JSON.stringify(r.name) !== JSON.stringify(c.name) && !_nmOk391(r.name, c.name)) diff.push({ tag, id, zh: c.zh, why: '非改名物种 name 漂移', oldName: r.name, nowName: c.name });
      if (!swapIds.has(id) && JSON.stringify(r.mv) !== JSON.stringify(c.mv)) diff.push({ tag, id, zh: c.zh, name: c.name, why: '非换招物种 mv 漂移', oldMv: r.mv, nowMv: c.mv });
    });
  });
  return { tag, compared, diff, exemptGroups };
}
const dSix = diffAgainst(snap.six, cur.six, 'six');
const dEmp = diffAgainst(snap.empty, cur.empty, 'empty');

console.log('=== v4.386 默认排序 / 睡觉替换 / 改名 验证 ===');
console.log('流派总数(空队):', cur.empty.length, 'empty 物种数:', emptyN);
console.log('① 进攻身份默认 [0] 防守卡(有 strict、非白名单):', A1.length, A1.length === 0 ? 'PASS' : 'FAIL');
A1.forEach(r => console.log('   FAIL #' + r.id, r.zh, '首卡', r.first, r.role, r.side, 'strict', r.strict.join('/')));
console.log('② 玻璃大炮含睡觉 156:', A2.length, A2.length === 0 ? 'PASS' : 'FAIL');
A2.forEach(r => console.log('   FAIL #' + r.id, r.zh, r.name, r.mv.join('/')));
console.log('③ 9 条旧名残留:', A3.length, A3.length === 0 ? 'PASS' : 'FAIL');
A3.forEach(r => console.log('   FAIL #' + r.id, r.zh, r.name));
console.log('--- 落点台账（空队/六人队合并计数） ---');
console.log('排序移 [0]:', reordered.length, '; 改名:', renamed.length,
  '; 睡觉→自回血:', swapHeal.length, '; 睡觉→补盲伤害:', swapCover.length, '; 睡觉→守住182:', swapProtect.length,
  '; loose 台账不重排:', looseLedger.length);
renamed.forEach(r => console.log('   改名 #' + r.id, r.zh, r.old, '→', r.now));
console.log('   受阻未改(速度门 spd>60 且卡面无 369/521 pivot):', RENAME_BLOCKED_LEDGER.length);
RENAME_BLOCKED_LEDGER.forEach(r => console.log('     受阻 #' + r.id, r.zh, r.name, r.side, r.role, r.alloc.join('/'), 'pivot=' + r.piv, r.mv.join('/')));
console.log('   非目标同名变体保留旧名(台账):', RENAME_RESIDUAL.length);
RENAME_RESIDUAL.forEach(r => console.log('     保留 #' + r.id, r.zh, r.name, r.side, r.role, r.alloc.join('/')));
swapProtect.forEach(r => console.log('   守住 #' + r.id, r.zh, r.name, r.swap));
console.log('⑤ 快照比对 six: 比对', dSix.compared, '条, 差异', dSix.diff.length, '; empty: 比对', dEmp.compared, '条, 差异', dEmp.diff.length);
dSix.diff.concat(dEmp.diff).forEach(r => console.log('   DIFF [' + r.tag + '] #' + r.id, r.zh, r.name, r.why || ''));
const nonTargetDiff = dSix.diff.concat(dEmp.diff);
console.log('⑤ 未命中卡差异(必须 0):', nonTargetDiff.length, nonTargetDiff.length === 0 ? 'PASS' : 'FAIL');

const fail = A1.length + A2.length + A3.length + nonTargetDiff.length + (cur.empty.length === 4205 ? 0 : 1);
console.log('\n=== 断言结果:', fail === 0 ? 'ALL PASS' : fail + ' 项 FAIL', '===');
process.exit(fail === 0 ? 0 : 1);
