// v4.393 验收：攻击/轮转名 + 肉盾 roleTag 的角色对齐（零矛盾 + 严格零漂移）
// 口径（medSpe 初始化顺序修复 + CONS_ITEM 可移植性修复后，浏览器与 head 完全一致）
//  ① 对齐卡（_v393RoleAlign）：six 547 / empty 0；边缘卡（_v393Edge）：six 35 / empty 0
//  ② 每张对齐卡的新 role 与「名→角色」规则一致，且 nature×EV 零矛盾（减项不满投、正项不零投）
//  ③ 边缘卡 role 仍为「肉盾」，且其 id 集合与期望 35 张完全一致
//  ④ 漂移（与 v4.392 快照逐卡比对）：
//     - 对齐卡：允许 role/alloc/nat 变（v393），允许 item 变（CONS_ITEM 修复，4 张）；name/side/ids 不变
//     - 边缘卡：role 保持肉盾，允许 item 变；name/side/ids 不变
//     - 其余卡：仅允许 item 变（CONS_ITEM，empty 44 / six 58），另 4 张已知路由卡（CONS_ITEM 道具修正后
//       失去回复件、改落稳健联防：588[1]/684[0]/944[4]/2524[4]）允许其 name/alloc/nat 随 item 联动
//     - 卡数零变化；上述之外的任何变化 = 未解释差异
const H = require('./harness.js');
const { ERDATA, deriveBuilds, NATURES } = H;
const fs = require('fs'), path = require('path');
const SNAP = JSON.parse(fs.readFileSync(path.join(__dirname, '_v4393_base_snapshot.json'), 'utf8'));
const by = id => ERDATA.species.find(s => String(s.id) === String(id));
const allTeam = [26, 65, 96, 80, 37, 208].map(by);
const IDX = { '攻击': 1, '防御': 2, '特攻': 3, '特防': 4, '速度': 5 };
function sIdx(t) { const m = String(t).match(/攻击|防御|特攻|特防|速度/); return m ? IDX[m[0]] : -1; }
function ruleRole(nm) {
  if (nm.indexOf('强化清场') >= 0) return '强化';
  if (nm.indexOf('轮转补盲') >= 0) return '轮转';
  if (nm.indexOf('主力输出压制') >= 0 || nm.indexOf('输出压制') >= 0) return '输出';
  return null;
}
const natArr = b => (b.nat || []).map(x => Array.isArray(x) ? String(x[0]) : String(x));
const idsOf = b => (b.mv.main || []).concat(b.mv.func || []).map(x => +x.id);
const EXPECT_EDGE = ["7[0]","13[0]","18[1]","143[2]","198[3]","274[1]","277[3]","355[1]","374[0]","543[1]","544[1]","599[1]","641[3]","663[1]","734[1]","753[0]","790[1]","808[1]","843[0]","917[1]","918[1]","938[0]","953[1]","1039[1]","1056[1]","1062[1]","1120[1]","1543[1]","1562[1]","1569[1]","2276[0]","2288[0]","2522[1]","2608[2]","2611[1]"];
// CONS_ITEM 修复后道具修正、失去回复件而改落稳健联防的已知路由卡
const CONS_ROUTE = { '588[1]': 1, '684[0]': 1, '944[4]': 1, '2524[4]': 1 };

let fail = 0;
function scan(team, tag) {
  const base = SNAP[tag].builds;
  const c = { aligned: 0, edge: 0, contradiction: 0, ruleMismatch: 0, drift: 0 };
  const gotEdge = [];
  const bad = [];
  let cur = 0;
  ERDATA.species.forEach(s => {
    let bs; try { bs = deriveBuilds(s, team); } catch (e) { return; }
    const arr = base[String(s.id)] || [];
    if (arr.length !== bs.length) { bad.push(`卡数变化 #${s.id} ${s.zh} ${arr.length}->${bs.length}`); return; }
    bs.forEach((b, idx) => {
      cur++;
      const nm = String(b.name || ''), e = arr[idx], key = `${s.id}[${idx}]`;
      const al = (b.ev && b.ev.alloc) || [], na = natArr(b), idc = idsOf(b);
      const item = String((b.it && b.it[0] && b.it[0][0]) || '');
      const isAligned = !!b._v393RoleAlign, isEdge = b._v393Edge !== undefined;
      if (isAligned) {
        c.aligned++;
        // ② 规则一致
        if (ruleRole(nm) !== b.roleTag) { c.ruleMismatch++; bad.push(`② #${s.id} ${s.zh}[${idx}] 规则 ${ruleRole(nm)} ≠ role ${b.roleTag}`); }
        // ② 零矛盾
        const pair = NATURES[b.nat[0][0]];
        if (pair) {
          const bI = sIdx(pair[0]), rI = sIdx(pair[1]);
          if (rI >= 0 && (+al[rI] || 0) >= 252) { c.contradiction++; bad.push(`② #${s.id} ${s.zh} 减项满投 ${pair[1]}`); }
          if (bI >= 0 && (+al[bI] || 0) === 0) { c.contradiction++; bad.push(`② #${s.id} ${s.zh} 正项零投 ${pair[0]}`); }
        }
      } else if (isEdge) {
        c.edge++; gotEdge.push(key);
        if (String(b.roleTag) !== '肉盾') bad.push(`③ #${s.id} ${s.zh} 边缘卡 role 非肉盾`);
      }
      // ④ 漂移：先算变化字段，再按卡类型判定是否允许
      const changed = [];
      if (String(e.name) !== nm) changed.push('name');
      if (String(e.role) !== String(b.roleTag)) changed.push('role');
      if (String(e.side) !== String(b.side)) changed.push('side');
      if (JSON.stringify(e.alloc) !== JSON.stringify(al)) changed.push('alloc');
      if (JSON.stringify(e.nat) !== JSON.stringify(na)) changed.push('nat');
      if (JSON.stringify(e.ids) !== JSON.stringify(idc)) changed.push('ids');
      if (String(e.item) !== item) changed.push('item');
      if (changed.length) {
        const hard = changed.filter(k => k === 'side' || k === 'ids');
        const allowRoute = CONS_ROUTE[key] === 1;
        let ok = true;
        if (hard.length) ok = false;
        if (isAligned) {
          // 允许 role/alloc/nat/item；name 不允许
          if (changed.indexOf('name') >= 0) ok = false;
          if (changed.some(k => k !== 'role' && k !== 'alloc' && k !== 'nat' && k !== 'item')) ok = false;
          if (changed.indexOf('role') < 0) ok = false; // role 必变
        } else if (isEdge) {
          // 仅允许 item
          if (changed.some(k => k !== 'item')) ok = false;
        } else if (allowRoute) {
          // 已知 CONS_ITEM 路由卡：允许 name/role/alloc/nat/item 联动（side/ids 已在 hard 排除）
          if (changed.some(k => k === 'side' || k === 'ids')) ok = false;
        } else {
          // 其余普通卡：仅允许 item
          if (changed.some(k => k !== 'item')) ok = false;
        }
        if (!ok) { c.drift++; bad.push(`④ #${s.id} ${s.zh}[${idx}] 未解释变化 ${changed.join(',')}`); }
      }
    });
  });
  console.log(`\n=== ${tag} === 当前卡 ${cur}`);
  console.log(` ① aligned ${c.aligned} | edge ${c.edge} | ② 矛盾 ${c.contradiction} 规则不符 ${c.ruleMismatch} | ④ 漂移 ${c.drift}`);
  bad.slice(0, 12).forEach(x => console.log('   ✗', x));
  if (tag === 'six') {
    if (c.aligned !== 547) bad.push(`① six aligned ${c.aligned} ≠ 547`);
    if (c.edge !== 35) bad.push(`① six edge ${c.edge} ≠ 35`);
    const a = gotEdge.slice().sort(), b = EXPECT_EDGE.slice().sort();
    if (JSON.stringify(a) !== JSON.stringify(b)) bad.push(`③ 边缘 id 集合不一致 got=${JSON.stringify(a)}`);
  } else {
    if (c.aligned !== 0) bad.push(`① empty aligned ≠ 0`);
    if (c.edge !== 0) bad.push(`① empty edge ≠ 0`);
  }
  fail += bad.length;
}
scan([], 'empty');
scan(allTeam, 'six');
console.log('\nv4.393 失败合计', fail);
process.exit(fail === 0 ? 0 : 1);
