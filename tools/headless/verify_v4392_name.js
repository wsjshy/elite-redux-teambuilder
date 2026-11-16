// v4.392 验收：「骚扰消耗」战术词按本卡配置口径准入 + 严格零漂移
// 断言（两口径：六人队 / 空队）
//  ① 名含「骚扰消耗」而招组无任何骚扰手段（钉/状态/削弱逼换）→ 必须 0
//  ② 由本块改名出的卡（b._v392Rename 存在）必须与规则重算一致（重算目标词 === 实际名）
//  ③ 保留下来的「骚扰消耗」必须真带 >=1 条骚扰手段（名字成立）
//  ④ 计数：六人队改名 423（强化清场 276 / 主力输出压制 45 / 输出压制 38 / 双墙辅助流 29 / 稳健联防 35）、空队 0
//  ⑤ 漂移：与 v4.391 快照逐卡比对——只允许 name 变化，EV/性格/道具/招组/role/side/卡数一律零变化；未解释差异 0
const H = require('./harness.js');
const { ERDATA, deriveBuilds, MV } = H;
const fs = require('fs'), path = require('path');
const SNAP = JSON.parse(fs.readFileSync(path.join(__dirname, '_v4392_base_snapshot.json'), 'utf8'));
const CONS_ALLOW = JSON.parse(fs.readFileSync(path.join(__dirname, '_cons_item_allow.json'), 'utf8'));
const by = id => ERDATA.species.find(s => String(s.id) === String(id));
const allTeam = [26, 65, 96, 80, 37, 208].map(by);
const HAZ = [191, 390, 446, 564], STA = [86, 92, 261, 137, 599];
const WEAK = [73, 282, 269, 46, 18, 525, 114, 499, 317], WALL = [113, 115, 657];
const BSTR = /剑舞|龙之舞|蝶舞|冥想|诡计|诅咒|健美|巨大化|破壳|腹鼓|磨爪|铁壁|集气|自我激励|生长|宇宙力量/;
const POWER_OK = 95;
const natArr = b => (b.nat || []).map(x => Array.isArray(x) ? String(x[0]) : String(x));
const idsOf = b => (b.mv.main || []).concat(b.mv.func || []).map(x => +x.id);
const dmgOf = ids => ids.filter(id => { const r = MV[id]; return r && r[4] !== '变化'; }).length;
const hasAny = (ids, set) => ids.some(id => set.indexOf(id) >= 0);
const fireOf = s => Math.max(+s.base[1], +s.base[3]);

function rule(s, ids) {
  const d = dmgOf(ids), bo = ids.some(id => MV[id] && BSTR.test(String(MV[id][1] || ''))), wa = hasAny(ids, WALL);
  if (bo && d >= 1) return '强化清场';
  if (d >= 2) return fireOf(s) >= POWER_OK ? '主力输出压制' : '输出压制';
  if (wa) return '双墙辅助流';
  return '稳健联防';
}

// v4.393 CONS_ITEM 修复后：588[1]/2524[4] 失去回复件（剩饭→宝石）不再落强化清场，改名数 423→421
const EXPECT = { six: 421, empty: 0 };
const EXPECT_DIST = { '输出压制': 38, '主力输出压制': 45, '强化清场': 274, '稳健联防': 35, '双墙辅助流': 29 };
let fail = 0;
function scan(team, tag) {
  const base = SNAP[tag].builds;
  const c = { a1: 0, a2: 0, a3: 0, kept: 0, rename: 0, same: 0, dist: {} };
  const bad = [];
  let cur = 0;
  ERDATA.species.forEach(s => {
    let bs; try { bs = deriveBuilds(s, team); } catch (e) { return; }
    const arr = base[String(s.id)] || [];
    if (arr.length !== bs.length) { bad.push(`#${s.id} ${s.zh} 卡数 ${arr.length} -> ${bs.length}`); return; }
    bs.forEach((b, idx) => {
      cur++;
      const nm = String(b.name || '');
      const ids = idsOf(b);
      const e = arr[idx];
      const har = hasAny(ids, HAZ) || hasAny(ids, STA) || hasAny(ids, WEAK);
      // ① 名实
      if (nm.indexOf('骚扰消耗') >= 0) {
        if (!har) { c.a1++; bad.push(`① #${s.id} ${s.zh}[${idx}] 骚扰消耗却无骚扰手段（${ids}）`); }
        else c.kept++;                                   // ③
      }
      // ② 由本块改名者与规则重算一致
      if (b._v392Rename !== undefined) {
        c.rename++; c.dist[rule(s, ids)] = (c.dist[rule(s, ids)] || 0) + 1;
        if (rule(s, ids) !== nm) { c.a2++; bad.push(`② #${s.id} ${s.zh}[${idx}] 重算 ${rule(s, ids)} ≠ 实际 ${nm}`); }
        if (!b._v392OldName || String(b._v392OldName).indexOf('骚扰消耗') < 0) { c.a2++; bad.push(`② #${s.id} ${s.zh}[${idx}] _v392OldName 异常 ${b._v392OldName}`); }
      } else if (nm.indexOf('骚扰消耗') >= 0 && !har) { c.a3++; }
      // ⑤ 漂移（v4.393：对齐卡的 role/alloc/nat 变化由 verify_v4393 校验，此处豁免；ids/item/side 仍严格）
      const al = (b.ev && b.ev.alloc) || [], na = natArr(b), idc = ids;
      const _v393ex = !!b._v393RoleAlign;
      const _key = s.id + '[' + idx + ']';
      const _consIO = CONS_ALLOW[tag].itemOnly.indexOf(_key) >= 0;
      const _consRT = CONS_ALLOW[tag].route.indexOf(_key) >= 0;
      // CONS_ITEM 修复：itemOnly 允许 item 变（可能叠加 v4.392 改名）；ids/side/role 不得变；route 允许联动
      if (_consIO) {
        if (JSON.stringify(e.ids) !== JSON.stringify(idc) || String(e.side) !== String(b.side) ||
          String(e.role) !== String(b.roleTag)) bad.push(`⑤ ${_key} CONS itemOnly 口径不符 ids/side/role`);
        c.same++;
        if (String(e.name) === nm) return;
        // 名称也变了：落入下方「骚扰消耗→规则词」校验
      } else if (_consRT) {
        if (JSON.stringify(e.ids) !== JSON.stringify(idc) || String(e.side) !== String(b.side)) bad.push(`⑤ ${_key} CONS route ids/side 变化`);
        return;
      }
      const dFixed = !_v393ex && (JSON.stringify(e.alloc) !== JSON.stringify(al) || JSON.stringify(e.nat) !== JSON.stringify(na) ||
        String(e.role) !== String(b.roleTag || ''));
      const dOther = dFixed ||
        JSON.stringify(e.ids) !== JSON.stringify(idc) || (!_consIO && String(e.item) !== String((b.it && b.it[0] && b.it[0][0]) || '')) ||
        String(e.side) !== String(b.side || '');
      if (dOther) { bad.push(`⑤ #${s.id} ${s.zh}[${idx}] 非名称字段变化 item:${e.item}->${(b.it && b.it[0] && b.it[0][0])} role:${e.role}->${b.roleTag} side:${e.side}->${b.side} ev:${JSON.stringify(e.alloc)}->${JSON.stringify(al)} nat:${JSON.stringify(e.nat)}->${JSON.stringify(na)} ids:${JSON.stringify(e.ids)}->${JSON.stringify(idc)}`); return; }
      if (String(e.name) === nm) { c.same++; return; }
      // 名称变了：只允许「骚扰消耗 → 规则词」
      if (String(e.name).indexOf('骚扰消耗') < 0 || rule(s, ids) !== nm) { bad.push(`⑤ #${s.id} ${s.zh}[${idx}] 未预期改名 ${e.name} -> ${nm}`); }
    });
  });
  console.log(`\n=== ${tag} === 当前卡 ${cur} / 基线卡 ${Object.keys(base).reduce((a, k) => a + base[k].length, 0)}`);
  console.log(` ① 骚扰消耗却无骚扰手段 ${c.a1} | ② 改名与规则不一致 ${c.a2} | ③ 残留无标记 ${c.a3}`);
  console.log(` ③ 保留「骚扰消耗」且真带骚扰手段 ${c.kept} | ⑤ 改名 ${c.rename} | 完全一致 ${c.same} | 未解释差异 ${bad.length === 0 ? '0 ✓' : bad.length + ' ✗'}`);
  console.log(` ④ 落词分布 ${JSON.stringify(c.dist)}（期望改名 ${EXPECT[tag]} 于 ${tag}）`);
  if (tag === 'six' && JSON.stringify(c.dist) !== JSON.stringify(EXPECT_DIST)) bad.push(`④ six 落词分布不符 ${JSON.stringify(c.dist)}`);
  if (tag === 'six' && c.rename !== EXPECT.six) { bad.push(`④ six 改名数 ${c.rename} ≠ ${EXPECT.six}`); }
  if (tag === 'empty' && c.rename !== EXPECT.empty) { bad.push(`④ empty 改名数 ${c.rename} ≠ ${EXPECT.empty}`); }
  bad.slice(0, 12).forEach(x => console.log('   ✗', x));
  fail += bad.length;
}
scan([], 'empty');
scan(allTeam, 'six');
console.log('\nv4.392 失败合计', fail);
process.exit(fail === 0 ? 0 : 1);
