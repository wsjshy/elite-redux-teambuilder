// v4.386 落地段台账采集（只读）：①排序/白名单/loose；②换招落点；③改名/受阻；④性格过滤抽查。
const H = require('./harness.js');
const { ERDATA, deriveBuilds, learnOf, MV, NATURES, isGlassCannon } = H;
const by = id => ERDATA.species.find(s => String(s.id) === String(id));
const allTeam = [by(26), by(65), by(96), by(80), by(37), by(208)];
const DEF_ROLE = { '肉盾': 1, '受队': 1, '联防': 1, '辅助': 1 };
const TRUE_RW = { imposter_anchor: 1, toxic_heal_item: 1 };
const REC = { 105: 1, 234: 1, 235: 1, 236: 1, 355: 1, 303: 1, 135: 1, 208: 1, 631: 1, 275: 1, 392: 1, 622: 1, 744: 1, 915: 1, 202: 1, 409: 1, 532: 1, 72: 1, 71: 1, 837: 1, 73: 1 };
const alloc = b => (b.ev && b.ev.alloc) || [];
const mvIds = b => (b.mv.main || []).concat(b.mv.func || []).map(x => +x.id);

const out = { six: {}, empty: {} };
function scan(team, tag) {
  const r = { reordered: [], loose: [], whitelist: [], heal: [], cover: [], protect: [], rename: [], blocked: [], natClash: 0, natAfterFilter: 0 };
  for (const s of ERDATA.species) {
    let bs; try { bs = deriveBuilds(s, team); } catch (e) { continue; }
    bs.forEach(b => {
      if (b._v386Reordered) r.reordered.push({ id: s.id, zh: s.zh, name: b.name, role: b.roleTag, side: b.side });
      if (b._v386LooseLedger) r.loose.push({ id: s.id, zh: s.zh, name: b.name, side: b.side, role: b.roleTag });
      if (TRUE_RW[b.mechRw]) r.whitelist.push({ id: s.id, zh: s.zh, name: b.name, rw: b.mechRw });
      if (b._v386MvSwap) {
        const to = String(b._v386MvSwap).split('→')[1].split(' ')[0];
        if (String(b._v386MvSwap).indexOf('182') >= 0) r.protect.push({ id: s.id, zh: s.zh, name: b.name, swap: b._v386MvSwap });
        else if (REC[+to]) r.heal.push({ id: s.id, zh: s.zh, name: b.name, swap: b._v386MvSwap });
        else r.cover.push({ id: s.id, zh: s.zh, name: b.name, swap: b._v386MvSwap });
      }
      if (b._v386Renamed) r.rename.push({ id: s.id, zh: s.zh, old: b._v386OldName, now: b.name });
      // ④ 矛盾性格统计 + 过滤模拟（与展示层同口径：以首项为基准）
      const nat = Array.isArray(b.nat) ? b.nat : [];
      if (nat.length > 1) {
        const clash = nat.some((n, i) => {
          if (i === 0) return false;
          const e0 = NATURES[nat[0][0]] || [], e = NATURES[n[0]] || [];
          const p0 = String(e0[0] || '').slice(1), d0 = String(e0[1] || '').slice(1);
          const p = String(e[0] || '').slice(1), d = String(e[1] || '').slice(1);
          return (p && d0 === p) || (d && p0 === d);
        });
        if (clash) {
          r.natClash++;
          // 过滤后保留数
          const kept = [nat[0]]; const plus = {}, neg = {};
          const e0 = NATURES[nat[0][0]] || [];
          if (String(e0[0] || '').slice(1)) plus[String(e0[0]).slice(1)] = 1;
          if (String(e0[1] || '').slice(1)) neg[String(e0[1]).slice(1)] = 1;
          nat.forEach((n, i) => {
            if (i === 0) return;
            const e = NATURES[n[0]] || [];
            const p = String(e[0] || '').slice(1), d = String(e[1] || '').slice(1);
            const cl = (p && neg[p]) || (d && plus[d]);
            if (!cl) { kept.push(n); if (p) plus[p] = 1; if (d) neg[d] = 1; }
          });
          if (kept.length < nat.length) r.natAfterFilter++;
        }
      }
    });
  }
  out[tag] = r;
}
scan(allTeam, 'six'); scan([], 'empty');

// 66 档（cover+protect）按流派名细分（空队口径）
const typeB = {};
out.empty.cover.concat(out.empty.protect).forEach(r => { typeB[r.name] = (typeB[r.name] || 0) + 1; });
out.empty.coverByType = typeB;

// #1503 过滤抽查
const s1503 = by(1503);
const bs1503 = deriveBuilds(s1503, []);
out.sp1503 = bs1503.map(b => ({ name: b.name, side: b.side, role: b.roleTag, nat: (b.nat || []).map(p => p[0]) }));

console.log(JSON.stringify(out, null, 1));
