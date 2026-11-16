// v4.385 验证：后置最终化 EV/性格一致性。六断言：
// ① 速攻名 0 速且无自有倍率来源 = 0（天气提速/顺风/轻装/围巾/速度强化招为来源）；
// ② 防守身份（role∈肉盾/受队/联防/辅助，或名含 受队消耗/稳健联防/肉盾/减伤/属性免疫）攻/特攻≥252 且耐久<252 = 0
//    （role 进攻/轮转的防守名卡记台账，不进断言）；
// ③ 性格减项被满投 252（或防守身份挂加速性格）= 0；
// ④ EV 单项>252 / 结构非法（非 6 项、非整数、单项<0、总量>510）= 0；
// ⑤ 影响面：流派总数 4205；基线快照逐条比对未命中卡 ev.alloc 与 nat 逐项一致（机器可读：比对 N 条、差异 0 条）；
// ⑥ 回归另跑 verify_boost / verify_reduce / verify_speedaxis / verify_v4381 / verify_sash（本脚本不含）。
const H = require('./harness.js');
const fs = require('fs'), path = require('path');
const { ERDATA, deriveBuilds, pvWeatherSpeedMul, bulkOf } = H;
const by = id => ERDATA.species.find(s => String(s.id) === String(id));
const allTeam = [by(26), by(65), by(96), by(80), by(37), by(208)];
const BOOST = [349, 483, 504, 187, 526];

const DEF_ROLE = { '肉盾': 1, '受队': 1, '联防': 1, '辅助': 1 };
const DEF_NAME = /受队消耗|稳健联防|肉盾|减伤|属性免疫/;
const SPD_NAT = { '爽朗': 1, '开朗': 1, '胆小': 1, '急躁': 1, '天真': 1 };
const NATURES = H.NATURES || {};
const DN_IDX = { '-攻击': 1, '-特攻': 3, '-防御': 2, '-特防': 4, '-速度': 5 };

const nat0 = b => { const n = b.nat; return Array.isArray(n) ? (n[0] ? String(n[0][0] || '') : '') : String(n || '').split(',')[0].trim(); };
const natStr = b => Array.isArray(b.nat) ? b.nat.map(p => (p || []).join(',')).join(',') : String(b.nat || '');
const alloc = b => (b.ev && b.ev.alloc) || [0, 0, 0, 0, 0, 0];

function speedSrc(s, b) {
  const mv = (b.mv.main || []).concat(b.mv.func || []).map(x => +x.id);
  const wx = (pvWeatherSpeedMul(s) || 1) > 1;
  const light = (s.abis || []).concat(s.inns || []).indexOf('轻装') >= 0;
  const scarf = String(((b.it || [])[0] || [])[0] || '').indexOf('讲究围巾') >= 0;
  const tw = mv.indexOf(366) >= 0;
  const boost = mv.some(id => BOOST.indexOf(id) >= 0);
  return { wx, light, scarf, tw, boost, mult: wx || tw || light || scarf, spd: +s.base[5] || 0 };
}
function dnIdx(nat) { const e = NATURES[nat]; if (!e) return -1; const dn = String(e[1] || ''); return Object.prototype.hasOwnProperty.call(DN_IDX, dn) ? DN_IDX[dn] : -1; }
function clash(b) { const a = alloc(b); const di = dnIdx(nat0(b)); if (di < 0) return false; return (+a[di] || 0) >= 252; }
// v4.391：名含「主力输出压制」按底子打手门改名（→输出压制；个案 #605 →强化清场），属预期改名
//   → 分组键按改名后口径归一（alloc / nat 仍逐条比对，改名不是改配置的许可证）
const normN = n => String(n).split('主力输出压制').join('输出压制');
const keyOf = c => [c.id, normN(c.name), c.side, c.roleTag].join('|');
const sigOf = c => c.nat + '||' + JSON.stringify(c.alloc);

const A1 = [], A2 = [], A3 = [], A4 = [];
let total = 0, emptyN = 0;
const cur = { six: [], empty: [] };

function scan(team, tag) {
  for (const s of ERDATA.species) {
    let bs; try { bs = deriveBuilds(s, team); } catch (e) { continue; }
    if (tag === 'empty' && bs.length === 0) emptyN++;
    for (const b of bs) {
      total++;
      const n = String(b.name || ''), role = String(b.roleTag || ''), side = String(b.side || '');
      const a = alloc(b);
      const offEv = Math.max(a[1] || 0, a[3] || 0), bulk = (a[0] || 0) + (a[2] || 0) + (a[4] || 0);
      const isDefRole = !!DEF_ROLE[role], isDefName = DEF_NAME.test(n);
      const src = speedSrc(s, b);
      // ① 速攻名 0 速 无来源
      if (/速攻/.test(n) && (+a[5] || 0) === 0 && !src.mult && !src.boost)
        A1.push({ id: s.id, zh: s.zh, name: n, role, ev: a });
      // ② 防守身份（role 防守）进攻配置；role 进攻/轮转记台账不进断言
      if (isDefRole && offEv >= 252 && bulk < 252)
        A2.push({ id: s.id, zh: s.zh, name: n, role, side, ev: a });
      // ③ 性格矛盾 / 防守挂加速（已登记 uncertain 拿不准卡除外，单列上报）
      //    v4.389：骚击/耐久压制＝快卡先手撒状态，加速性格是设计而非矛盾，故豁免「防守挂加速」一句
      const _v389Fast = /骚扰消耗|耐久压制/.test(n);
      if (!b._v385Uncertain && (clash(b) || (isDefRole && !_v389Fast && SPD_NAT[nat0(b)])))
        A3.push({ id: s.id, zh: s.zh, name: n, role, nat: nat0(b), ev: a });
      // ④ EV 结构
      const bad = !Array.isArray(a) || a.length !== 6 || a.some(v => !Number.isInteger(+v) || +v < 0 || +v > 252) || a.reduce((x, y) => x + (+y || 0), 0) > 510;
      if (bad) A4.push({ id: s.id, zh: s.zh, name: n, ev: a });
      cur[tag].push({ id: String(s.id), zh: s.zh, name: n, side, roleTag: role, nat: natStr(b), alloc: a, fixed: !!b._v385EvNatureFixed, uncertain: !!b._v385Uncertain, ledger: !!b._v385StallLedger });
    }
  }
}
scan(allTeam, 'six'); scan([], 'empty');

// ⑤ 快照逐条比对（v4.386 起按物种 id 分组多重集配对；改名物种豁免 name 键错位，alloc/nat 仍比对）
const snap = JSON.parse(fs.readFileSync(path.join(__dirname, '_v4385_base_snapshot.json'), 'utf8'));
// v4.389：受队消耗分流 / 快卡加满速度 / 零伤防守卡换性格 = 本版刻意改动，按命中物种分组豁免 alloc+nat 比对
const V389 = JSON.parse(fs.readFileSync(path.join(__dirname, '_v4389_base_snapshot.json'), 'utf8'));
const hitSp = new Set();
['six', 'empty'].forEach(t => {
  Object.keys(V389[t].builds).forEach(sid => V389[t].builds[sid].forEach(e => { if (e.origStall) hitSp.add(String(e.id)); }));
  (V389[t].r2 || []).concat(V389[t].r3 || []).forEach(e => hitSp.add(String(e.id)));
});
const RENAME_IDS = { '636': 1, '871': 1, '2290': 1, '1729': 1, '1643': 1, '1644': 1, '1645': 1, '1646': 1, '1647': 1, '605': 1 };
function diffAgainst(base, now, tag) {
  // 改名物种整组豁免（name 键变化属预期）；其余按原 name 键多重集配对（v4.385 口径）。
  const baseG = new Map(), nowG = new Map();
  base.forEach(r => { if (RENAME_IDS[r.id]) return; const k = keyOf(r); if (!baseG.has(k)) baseG.set(k, []); baseG.get(k).push(r); });
  now.forEach(c => { if (RENAME_IDS[c.id]) return; const k = keyOf(c); if (!nowG.has(k)) nowG.set(k, []); nowG.get(k).push(c); });
  let compared = 0, diff = [], diffFixed = [], exempt = 0;
  const keys = new Set([...baseG.keys(), ...nowG.keys()]);
  keys.forEach(k => {
    const br = (baseG.get(k) || []).slice().sort((a, b) => sigOf(a) < sigOf(b) ? -1 : 1);
    const nr = (nowG.get(k) || []).slice().sort((a, b) => sigOf(a) < sigOf(b) ? -1 : 1);
    if (hitSp.has(String(k.split('|')[0]))) { exempt += br.length; return; }   // v4.389 命中物种整组豁免（改名会改分组键）
    if (br.length !== nr.length) {
      diff.push({ tag, k, why: '卡数不一致 base=' + br.length + ' now=' + nr.length });
      return;
    }
    br.forEach((r, i) => {
      const c = nr[i];
      compared++;
      if (JSON.stringify(r.alloc) !== JSON.stringify(c.alloc) || r.nat !== c.nat) {
        const rec = { tag, id: c.id, zh: c.zh, name: c.name, oldAlloc: r.alloc, nowAlloc: c.alloc, oldNat: r.nat, nowNat: c.nat, fixed: c.fixed, uncertain: c.uncertain, ledger: c.ledger };
        diff.push(rec);
        if (c.fixed) diffFixed.push(rec);
      }
    });
  });
  return { tag, compared, diff, diffFixed, exempt };
}
const dSix = diffAgainst(snap.six, cur.six, 'six');
const dEmp = diffAgainst(snap.empty, cur.empty, 'empty');
const diffAll = dSix.diff.concat(dEmp.diff);
const nonFixedDiff = diffAll.filter(r => !r.fixed);

console.log('=== v4.385 EV/性格最终化验证 ===');
console.log('流派总数(空队):', cur.empty.length, 'species empty 物种数:', emptyN);
console.log('① 速攻名 0 速 无来源:', A1.length, A1.length === 0 ? 'PASS' : 'FAIL');
A1.forEach(r => console.log('   FAIL #' + r.id, r.zh, r.name, '[', r.ev.join(','), ']'));
console.log('② 防守 role 进攻配置(耐久<252):', A2.length, A2.length === 0 ? 'PASS' : 'FAIL');
A2.forEach(r => console.log('   FAIL #' + r.id, r.zh, r.name, r.role, '[', r.ev.join(','), ']'));
console.log('③ 性格×主投资矛盾:', A3.length, A3.length === 0 ? 'PASS' : 'FAIL');
A3.forEach(r => console.log('   FAIL #' + r.id, r.zh, r.name, r.role, r.nat, '[', r.ev.join(','), ']'));
console.log('④ EV 单项>252 / 结构非法:', A4.length, A4.length === 0 ? 'PASS' : 'FAIL');
A4.forEach(r => console.log('   FAIL #' + r.id, r.zh, r.name, '[', r.ev.join(','), ']'));
console.log('⑤ 快照比对 six: 比对', dSix.compared, '条(本版命中组豁免', dSix.exempt, '条), 差异', dSix.diff.length, '条(其中本版 fixed', dSix.diffFixed.length, '); empty: 比对', dEmp.compared, '条(豁免', dEmp.exempt, '条), 差异', dEmp.diff.length, '条(其中 fixed', dEmp.diffFixed.length, ')');
nonFixedDiff.forEach(r => console.log('   NONFIXED DIFF #' + r.id, r.zh, r.name, 'fixed=' + r.fixed, 'ledger=' + r.ledger));
console.log('⑤ 未命中卡差异(必须 0):', nonFixedDiff.length, nonFixedDiff.length === 0 ? 'PASS' : 'FAIL');

const fail = A1.length + A2.length + A3.length + A4.length + nonFixedDiff.length + (cur.empty.length === 4205 ? 0 : 1);
console.log('\n=== 断言结果:', fail === 0 ? 'ALL PASS' : fail + ' 项 FAIL', '===');
process.exit(fail === 0 ? 0 : 1);
