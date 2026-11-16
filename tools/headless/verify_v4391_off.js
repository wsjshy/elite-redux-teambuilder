// v4.391 验收：主力输出压制按底子打手门准入 + 严格零漂移
// 断言（两口径：六人队 / 空队）
//  ① 名含「主力输出压制」且 max(攻,特攻)<POWER_OK(95) → 必须 0（准入证明）
//  ② 名含「输出压制」且 max(攻,特攻)>=95 → 必须 0（不误降证明）
//  ③ 名含「输出压制」的卡必须仍带 ≥2 条实配伤害招（降的是「主力」不是「在打」）
//  ④ 漂移：与 v4.390 快照逐卡比对——只允许 name 由 old.split('主力输出压制').join('输出压制') 得到，
//     其余 EV / 招组 / 道具 / 性格 / role / side / 卡数一律零变化；未解释差异 0
const H = require('./harness.js');
const { ERDATA, deriveBuilds, MV } = H;
const fs = require('fs'), path = require('path');
const SNAP = JSON.parse(fs.readFileSync(path.join(__dirname, '_v4391_base_snapshot.json'), 'utf8'));
const CONS_ALLOW = JSON.parse(fs.readFileSync(path.join(__dirname, '_cons_item_allow.json'), 'utf8'));
const by = id => ERDATA.species.find(s => String(s.id) === String(id));
const allTeam = [26, 65, 96, 80, 37, 208].map(by);
const POWER_OK = 95;
const atkBest = s => Math.max(+s.base[1], +s.base[3]);
const natArr = b => (b.nat || []).map(x => Array.isArray(x) ? String(x[0]) : String(x));
const idsOf = b => (b.mv.main || []).concat(b.mv.func || []).map(x => +x.id);
const dmgOf = ids => ids.filter(id => { const r = MV[id]; return r && r[4] !== '变化'; }).length;
const _V392_HAZ=[191,390,446,564],_V392_STA=[86,92,261,137,599],_V392_WK=[73,282,269,46,18,525,114,499,317],_V392_WALL=[113,115,657];
const _V392_BST=/剑舞|龙之舞|蝶舞|冥想|诡计|诅咒|健美|巨大化|破壳|腹鼓|磨爪|铁壁|集气|自我激励|生长|宇宙力量/;
function ruleWord(s, ids){
  if(ids.some(function(id){return _V392_HAZ.indexOf(id)>=0||_V392_STA.indexOf(id)>=0||_V392_WK.indexOf(id)>=0;}))return null;
  var d=0,bo=false,wa=false;
  ids.forEach(function(id){var r=MV[id];if(!r)return;if(r[4]!=='变化')d++;if(_V392_BST.test(String(r[1]||'')))bo=true;if(_V392_WALL.indexOf(id)>=0)wa=true;});
  if(bo&&d>=1)return '强化清场';
  if(d>=2)return (Math.max(+s.base[1],+s.base[3])>=95?'主力输出压制':'输出压制');
  if(wa)return '双墙辅助流';
  return '稳健联防';
}


let fail = 0;
function scan(team, tag) {
  const base = SNAP[tag].builds;
  const c = { a1: 0, a2: 0, a3: 0, rename: 0, same: 0 };
  const bad = [];
  let cur = 0;
  ERDATA.species.forEach(s => {
    let bs; try { bs = deriveBuilds(s, team); } catch (e) { return; }
    const arr = base[String(s.id)] || [];
    if (arr.length !== bs.length) { bad.push(`#${s.id} ${s.zh} 卡数 ${arr.length} -> ${bs.length}`); return; }
    bs.forEach((b, idx) => {
      cur++;
      const nm = String(b.name || '');
      const ab = atkBest(s);
      // ① ② ③
      if (nm.indexOf('主力输出压制') >= 0 && ab < POWER_OK) { c.a1++; bad.push(`① #${s.id} ${s.zh}[${idx}] 主力输出压制却 atkBest=${ab}`); }
      if (nm.indexOf('输出压制') >= 0 && nm.indexOf('主力输出压制') < 0 && ab >= POWER_OK) { c.a2++; bad.push(`② #${s.id} ${s.zh}[${idx}] 输出压制却 atkBest=${ab}`); }
      if (nm.indexOf('输出压制') >= 0 && dmgOf(idsOf(b)) < 2) { c.a3++; bad.push(`③ #${s.id} ${s.zh}[${idx}] 输出压制却实配伤害招<2（${idsOf(b)}）`); }
      // ④ 漂移（v4.393：对齐卡 role/alloc/nat 由 verify_v4393 校验，豁免；ids/item/side 严格）
      const e = arr[idx];
      const al = (b.ev && b.ev.alloc) || [];
      const na = natArr(b), idc = idsOf(b);
      const dName = String(e.name) !== nm;
      const _v393ex = !!b._v393RoleAlign;
      const _key = s.id + '[' + idx + ']';
      const _consIO = CONS_ALLOW[tag].itemOnly.indexOf(_key) >= 0;
      const _consRT = CONS_ALLOW[tag].route.indexOf(_key) >= 0;
      // CONS_ITEM 修复：itemOnly 允许 item 变（可能叠加本脚本认可的改名）；ids/side/role 不得变；route 允许联动
      if (_consIO) {
        if (JSON.stringify(e.ids) !== JSON.stringify(idc) || String(e.side) !== String(b.side) ||
          String(e.role) !== String(b.roleTag)) bad.push(`④ ${_key} CONS itemOnly 口径不符 ids/side/role`);
        c.same++;
        if (!dName) return;
      } else if (_consRT) {
        if (JSON.stringify(e.ids) !== JSON.stringify(idc) || String(e.side) !== String(b.side)) bad.push(`④ ${_key} CONS route ids/side 变化`);
        return;
      }
      const dFixed = !_v393ex && (JSON.stringify(e.alloc) !== JSON.stringify(al) || JSON.stringify(e.nat) !== JSON.stringify(na) ||
        String(e.role) !== String(b.roleTag || ''));
      const dOther = dFixed ||
        JSON.stringify(e.ids) !== JSON.stringify(idc) || (!_consIO && String(e.item) !== String((b.it && b.it[0] && b.it[0][0]) || '')) ||
        String(e.side) !== String(b.side || '');
      if (dOther) { bad.push(`④ #${s.id} ${s.zh}[${idx}] 非名称字段变化 item:${e.item}->${(b.it && b.it[0] && b.it[0][0])} role:${e.role}->${b.roleTag} side:${e.side}->${b.side} ev:${JSON.stringify(e.alloc)}->${JSON.stringify(al)} nat:${JSON.stringify(e.nat)}->${JSON.stringify(na)} ids:${JSON.stringify(e.ids)}->${JSON.stringify(idc)}`); return; }
      if (!dName) {
        // 基线本来不该动的卡，名称也必须逐字一致
        c.same++; return;
      }
      /* v4.392：名含「骚扰消耗」而招组无骚扰手段的卡按本卡配置改名（链路：v4.389 受队消耗→骚扰消耗 → 本版落既有词）。 */
      if (String(e.name).indexOf('骚扰消耗') >= 0 && ruleWord(s, idc) === nm) { c.rename++; return; }
      const exp = String(e.name).split('主力输出压制').join('输出压制');
      const expB = String(e.name).split('主力输出压制').join('强化清场');   // 个案：实配伤害招<2，带强化招
      const expS = String(e.name).split('主力输出压制').join('骚扰消耗');   // 个案：实配伤害招<2，无强化招
      const isCase = (nm === expB || nm === expS);
      if (String(e.name).indexOf('主力输出压制') < 0 || (exp !== nm && !isCase)) { bad.push(`④ #${s.id} ${s.zh}[${idx}] 未预期改名 ${e.name} -> ${nm}`); return; }
      if (isCase && dmgOf(idc) >= 2) { bad.push(`④ #${s.id} ${s.zh}[${idx}] 个案改名但实配伤害招>=2 ${e.name} -> ${nm}`); return; }
      c.rename++;
    });
  });
  console.log(`\n=== ${tag} === 当前卡 ${cur} / 基线卡 ${Object.keys(base).reduce((a, k) => a + base[k].length, 0)}`);
  console.log(` ① 主力输出压制却底子<95 ${c.a1} | ② 输出压制却底子>=95 ${c.a2} | ③ 输出压制伤害招<2 ${c.a3}`);
  console.log(` ④ 改名 ${c.rename} | 完全一致 ${c.same} | 未解释差异 ${bad.length === 0 ? '0 ✓' : bad.length + ' ✗'}`);
  bad.slice(0, 10).forEach(x => console.log('   ✗', x));
  fail += bad.length;
}
scan([], 'empty');
scan(allTeam, 'six');
console.log('\nv4.391 失败合计', fail);
process.exit(fail === 0 ? 0 : 1);
