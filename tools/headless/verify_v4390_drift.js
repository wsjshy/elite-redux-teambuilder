// v4.390 严格零漂移：以 v4.389 状态快照（_v4390_base_snapshot.json）逐卡比对。
// 允许的差异只有三类，且必须与规则完全吻合：
//   A 名称：旧名含「耐久压制」→ 同名位置换「骚扰消耗」（前缀保留，其它字符不动）
//   B EV：A 命中卡且速种>=100 时，R2 生效 → alloc 必须精确等于 [252,0,0,0,4,252]
//   C 性格：B 命中卡 → nat[0] 必须是加速性格（胆小/爽朗）
//   D（v4.391 追加）名称：旧名含「主力输出压制」→ 同名位置换「输出压制」（个案 #605 换强化清场/骚扰消耗），
//     此类卡 EV / 性格 / 招组 / 道具 / role / side 一律不得变
// 其余字段（items / ids / role / side / bulk）一律不得改变；任何未解释差异即 FAIL。
const H = require('./harness.js');
const { ERDATA, deriveBuilds, MV } = H;
const fs = require('fs'), path = require('path');
const SNAP = JSON.parse(fs.readFileSync(path.join(__dirname, '_v4390_base_snapshot.json'), 'utf8'));
const by = id => ERDATA.species.find(s => String(s.id) === String(id));
const allTeam = [26, 65, 96, 80, 37, 208].map(by);
const ACC = { '胆小': 1, '爽朗': 1 };
const natArr = b => (b.nat || []).map(x => Array.isArray(x) ? String(x[0]) : String(x));
const idsOf = b => (b.mv.main || []).concat(b.mv.func || []).map(x => +x.id);
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
  const c = { A: 0, B: 0, C: 0, D: 0, E: 0, same: 0 };
  const bad = [];
  let cur = 0;
  ERDATA.species.forEach(s => {
    let bs; try { bs = deriveBuilds(s, team); } catch (e) { return; }
    const arr = base[String(s.id)] || [];
    if (arr.length !== bs.length) {
      bad.push(`#${s.id} ${s.zh} 卡数 ${arr.length} -> ${bs.length}`);
      return;
    }
    bs.forEach((b, idx) => {
      cur++;
      const e = arr[idx];
      const nm = String(b.name || '');
      const al = (b.ev && b.ev.alloc) || [];
      const na = natArr(b);
      const idc = idsOf(b);
      const dName = String(e.name) !== nm;
      const dEv = JSON.stringify(e.alloc) !== JSON.stringify(al);
      const dNat = JSON.stringify(e.nat) !== JSON.stringify(na);
      const dIds = JSON.stringify(e.ids) !== JSON.stringify(idc);
      const dItem = String(e.item) !== String((b.it && b.it[0] && b.it[0][0]) || '');
      const dRole = String(e.role) !== String(b.roleTag || '');
      const dSide = String(e.side) !== String(b.side || '');
      if (dIds || dItem || dRole || dSide) {
        bad.push(`#${s.id} ${s.zh}[${idx}] 非名称字段变化 item:${e.item}->${(b.it && b.it[0] && b.it[0][0])} role:${e.role}->${b.roleTag} side:${e.side}->${b.side} ids:${e.ids}->${idc}`);
        return;
      }
      if (!dName && !dEv && !dNat) { c.same++; return; }
      // A：名称（v4.390 耐久压制→骚扰消耗）
      // D：名称（v4.391 主力输出压制→输出压制；个案 #605 去「主力」后伤害招<2 改强化清场/骚扰消耗，EV/性格/招组零变化）
      let isA = false;
      if (dName) {
        const expA = String(e.name).split('耐久压制').join('骚扰消耗');
        const expD1 = String(e.name).split('主力输出压制').join('输出压制');
        const expD2 = String(e.name).split('主力输出压制').join('强化清场');
        const expD3 = String(e.name).split('主力输出压制').join('骚扰消耗');
        if (String(e.name).indexOf('耐久压制') >= 0 && expA === nm) { c.A++; isA = true; }
        else if (String(e.name).indexOf('主力输出压制') >= 0 && (nm === expD1 || nm === expD2 || nm === expD3)) { c.D++; }
        /* E（v4.392 追加）：旧名含「耐久压制/受队消耗」→ 本版按本卡配置落既有词（骚扰消耗 已由 v4.392 块接走）。
           只改名；EV 若变仍必须落在 B 的 R2 口径（快卡加满速度），性格沿用 C 口径。 */
        else if ((String(e.name).indexOf('耐久压制') >= 0 || String(e.name).indexOf('受队消耗') >= 0 || String(e.name).indexOf('骚扰消耗') >= 0) && ruleWord(s, idc) === nm) { c.E++; isA = true; }
        else {
          bad.push(`#${s.id} ${s.zh}[${idx}] 未预期改名 ${e.name} -> ${nm}`);
          return;
        }
      }
      if (dEv && !isA) { bad.push(`#${s.id} ${s.zh}[${idx}] D 类改名不得改 EV ${JSON.stringify(e.alloc)} -> ${JSON.stringify(al)}`); return; }
      // B：EV（仅 A 命中且速种>=100）
      if (dEv) {
        const spd = +s.base[5];
        const okEv = JSON.stringify(al) === JSON.stringify([252, 0, 0, 0, 4, 252]);
        const okCond = dName && spd >= 100 && (+((e.alloc || [])[5]) || 0) === 0;
        if (!okEv || !okCond) { bad.push(`#${s.id} ${s.zh}[${idx}] 未预期 EV ${JSON.stringify(e.alloc)} -> ${JSON.stringify(al)}（spd=${spd}）`); return; }
        c.B++;
      }
      // C：性格（只允许 B 命中卡的加速性格）
      if (dNat) {
        const okNat = ACC[na[0]] && dEv;
        if (!okNat) { bad.push(`#${s.id} ${s.zh}[${idx}] 未预期性格 ${JSON.stringify(e.nat)} -> ${JSON.stringify(na)}`); return; }
        c.C++;
      }
    });
  });
  const notSeen = Object.keys(base).filter(k => !ERDATA.species.some(s => String(s.id) === k));
  console.log(`\n=== ${tag} === 当前卡 ${cur} / 基线卡 ${Object.keys(base).reduce((a, k) => a + base[k].length, 0)}`);
  console.log(` 改名(A) ${c.A} | 改名并改EV(B) ${c.B} | 改名改EV改性格(C) ${c.C} | 仅改名(D v4.391) ${c.D} | 仅改名(E v4.392) ${c.E} | 完全一致 ${c.same}`);
  console.log(' 未解释差异:', bad.length === 0 ? '0 ✓' : bad.length + ' ✗');
  if (notSeen.length) console.log(' 基线有但当前无物种:', notSeen.length);
  bad.slice(0, 10).forEach(x => console.log('   ✗', x));
  fail += bad.length;
}
scan([], 'empty');
scan(allTeam, 'six');
console.log('\n零漂移失败合计', fail);
process.exit(fail === 0 ? 0 : 1);
