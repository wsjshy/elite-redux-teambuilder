// verify_invariants.js —— 引擎「名实一致性」常驻不变量入口（v4.397 之后新增）
// 目的：把 v4.391/v4.392/v4.393/v4.395/v4.396 各自写的专项断言，收敛成一组可枚举的不变量。
// 以后加规则 = 在这里加一条 INV，而不是再加一个脚本 + 一个补丁块。
// 用法：node verify_invariants.js        （全 0 违规则 exit 0）
//       node verify_invariants.js --probe（只报告，不因违规 exit 非 0）
const H = require('./harness.js');
const { ERDATA, deriveBuilds, MV, NATURES } = H;

const by = id => ERDATA.species.find(s => String(s.id) === String(id));
const TEAM = [26, 65, 96, 80, 37, 208].map(by);

// ---- 全部 id 表从引擎真源读，不再手抄 ----
// engine_consts.js 解析 index.html 的 FUNC_MV / WEATHER_MV / _v395bSET / _v392STA / _v392WK / _v392BST。
// 引擎改了表，断言自动跟着变；解析失败会 throw，不会静默假绿。
const C = require('./engine_consts.js');
const G = C.FUNC_MV;              // 13 键（rec/boost/boostSpec/hazard/removal/speed/protect/pivot/wear/weather/wall/rainPerfect）
const STA = C.STA;                // [86,92,261,137,599]
const WEAK = C.WEAK;              // [73,282,269,46,18,525,114,499,317]
const WSET = C.WSET;              // 天气招 201/240/241/258/580/581/604/641/950
const SUN_ABI = C.SUN_ABI;        // [70,584,190,871]
const SNOW_ABI = C.SNOW_ABI;      // [117,666,929,291,348,870,493]
const RAIN_ABI = C.RAIN_ABI;      // [2,989,867,189]
const SAND_ABI = C.SAND_ABI;      // [45,604,245]
// chloroplast flag 只存在于游戏源码（abilities.cc），引擎没有顶层变量，故仍为字面量
const CHL_ABI = ['268', '366', '374'];
const POWER_OK = 95;
const SASH_ABI = /玻璃大炮/;
const PRANK = /恶作剧之心/;
const SLEEP = [156];
const BSTR = C.BSTR;

const idsOf = b => (b.mv.main || []).concat(b.mv.func || []).map(x => +x.id);
const abiIds = b => (b.abi || []).map(a => String(a.id == null ? '' : a.id)).filter(Boolean);
const abiNames = b => (b.abi || []).map(a => String(a.n || ''));
const natArr = b => (b.nat || []).map(x => Array.isArray(x) ? String(x[0]) : String(x));
const fireOf = s => Math.max(+s.base[1], +s.base[3]);
const inter = (ids, set) => ids.filter(x => set.indexOf(x) >= 0);
const NAT_I = { '攻击': 1, '防御': 2, '特攻': 3, '特防': 4, '速度': 5 };
const nIdx = t => { const m = String(t).match(/攻击|防御|特攻|特防|速度/); return m ? NAT_I[m[0]] : -1; };

// ---- 采集全部卡（一次 derive，供所有不变量共用）----
const cards = [];
for (const tag of ['six', 'empty']) {
  for (const s of ERDATA.species) {
    let bs; try { bs = deriveBuilds(s, tag === 'six' ? TEAM : []); } catch (e) { continue; }
    bs.forEach((b, i) => {
      cards.push({
        tag, s, i, b,
        zh: s.zh, id: String(s.id), name: String(b.name || ''),
        ids: idsOf(b), abiIds: abiIds(b), abiNames: abiNames(b),
        alloc: (b.ev && b.ev.alloc) || [], nat: natArr(b),
        role: String(b.roleTag || ''), side: String(b.side || ''),
        score: b.score, core: b.core, v396Keep: b._v396Keep,
      });
    });
  }
}

// ---- 不变量定义 ----
// def(id, name, fn, scope)：fn 返回非空字符串=违规；scope 可选，返回 true 表示该卡属于本条作用域，
// 用于给「子集作用域」的不变量报告适用卡数 —— 否则标记一旦丢失，断言会假装 0 违规。
const INV = [];
const def = (id, name, fn, scope) => INV.push({ id, name, fn, scope: scope || null });

def('INV01', '名含「强化清场」→ 必带强化招（FUNC_MV.boost 或 BSTR 名字）', c => {
  if (c.name.indexOf('强化清场') < 0) return null;
  const bySet = inter(c.ids, G.boost).length > 0;
  const byName = c.ids.some(id => { const m = MV[id]; return m && BSTR.test(String(m[1] || '')); });
  return (bySet || byName) ? null : '无强化招 ' + c.ids.join(',');
});

def('INV02', '名含「骚扰消耗」→ 必带骚扰手段（钉/状态/削弱）', c => {
  if (c.name.indexOf('骚扰消耗') < 0) return null;
  const h = inter(c.ids, G.hazard).length + inter(c.ids, STA).length + inter(c.ids, WEAK).length;
  return h ? null : '无骚扰手段 ' + c.ids.join(',');
});

def('INV03', '名含「双墙」→ 至少一面光墙113 或 反射壁115（v4.395b 口径，含重名保留豁免）', c => {
  if (c.name.indexOf('双墙') < 0) return null;
  if (c.b._v395NameKeep) return null;               // 同物种已有该词，保留原名
  return inter(c.ids, [113, 115]).length ? null : '无光墙/反射壁 ' + c.ids.join(',');
});

def('INV04', '名含「钉子」→ 必带钉（FUNC_MV.hazard）', c => {
  if (c.name.indexOf('钉子') < 0) return null;
  return inter(c.ids, G.hazard).length ? null : '无钉子 ' + c.ids.join(',');
});

def('INV05', '名含「主力输出压制」→ 底子火力 ≥ POWER_OK(95)', c => {
  if (c.name.indexOf('主力输出压制') < 0) return null;
  return fireOf(c.s) >= POWER_OK ? null : '火力 ' + fireOf(c.s);
});

def('INV06', '带日光束76/日光刃632 → 必须有晴源或 chloroplast（源码口径）', c => {
  const dep = inter(c.ids, [76, 632]);
  if (!dep.length) return null;
  if (c.v396Keep) return null;                                  // v4.396 登记的三类合法保留
  const sun = c.abiIds.some(x => SUN_ABI.indexOf(x) >= 0) || c.ids.indexOf(241) >= 0;
  const chl = c.abiIds.some(x => CHL_ABI.indexOf(x) >= 0);
  const co = [];
  try { (c.core || []).forEach(v => { if (/^\d+$/.test(String(v))) co.push(+v); }); } catch (e) { }
  const byCore = c.score === 99 && co.some(v => dep.indexOf(v) >= 0);
  return (sun || chl || byCore) ? null : '无晴源/chloroplast ' + dep.join(',');
});

def('INV07', '带极光幕657 → 必须有雪源', c => {
  if (c.ids.indexOf(657) < 0) return null;
  const snow = c.abiIds.some(x => SNOW_ABI.indexOf(x) >= 0) || c.ids.indexOf(258) >= 0;
  return snow ? null : '无雪源';
});

def('INV08', '手动天气招 → 仅「恶作剧之心」可留', c => {
  const wx = inter(c.ids, WSET);
  if (!wx.length) return null;
  return c.abiNames.some(n => PRANK.test(n)) ? null : '非恶作剧之心带天气招 ' + wx.join(',');
});

def('INV09', '名带天气前缀（晴/雨/沙/雪）→ 必须有对应天气源（含重名保留豁免）', c => {
  const m = c.name.match(/^(晴|雨|沙|雪)/);
  if (!m) return null;
  if (c.b._v395NameKeep) return null;               // v4.395b：同物种已有该词，保留原名
  const map = {
    '晴': { abi: SUN_ABI, mv: [241] },
    '雨': { abi: ['2', '989', '867', '189'], mv: [240] },
    '沙': { abi: ['45', '604', '245'], mv: [201] },
    '雪': { abi: SNOW_ABI, mv: [258] },
  }[m[1]];
  const has = c.abiIds.some(x => map.abi.indexOf(x) >= 0) || inter(c.ids, map.mv).length > 0;
  return has ? null : '前缀「' + m[1] + '」无来源';
});

def('INV10', '玻璃大炮不带睡觉156', c => {
  if (!c.abiNames.some(n => SASH_ABI.test(n))) return null;
  return inter(c.ids, SLEEP).length ? '带睡觉' : null;
});

def('INV11', 'v4.393 已对齐卡：名→roleTag 必须仍一致（强化清场→强化 / 输出压制→输出 / 轮转补盲→轮转）', c => {
  // 口径说明：流派名是战术标签（强化清场/输出压制/轮转补盲/受队消耗…），roleTag 是队伍角色（肉盾/输出/强化/轮转）。
  // 二者是不同层次，全库不构成同义映射。v4.393 只处理「肉盾 role + 攻击向名」这一种明显矛盾，并把重算后卡登记 _v393RoleAlign。
  // 本不变量因此只守护 v4.393 声明已对齐的那批卡：回归防护，防止后续补丁把它们改回去。
  if (!c.b._v393RoleAlign) return null;
  let want = null;
  if (c.name.indexOf('强化清场') >= 0) want = '强化';
  else if (c.name.indexOf('主力输出压制') >= 0 || c.name.indexOf('输出压制') >= 0) want = '输出';
  else if (c.name.indexOf('轮转补盲') >= 0) want = '轮转';
  if (!want) return null;
  return c.role === want ? null : 'rule=' + want + ' 实际=' + c.role;
}, c => !!c.b._v393RoleAlign);

def('INV12', '同一张卡内招式不得重复', c => {
  return c.ids.length === new Set(c.ids).size ? null : '重复 ' + c.ids.join(',');
});

def('INV13', 'v4.393 已对齐卡：性格×EV 零矛盾（减项不满投 / 正项不零投）', c => {
  // 与 INV11 同作用域：v4.393 只对「肉盾→攻击向名」重算 EV/性格并登记对齐卡。
  // 非攻击向卡的性格往往只为取减项（加特攻减攻击），正项零投是设计而非矛盾，故不纳入。
  if (!c.b._v393RoleAlign) return null;
  const pair = NATURES[String(c.nat[0] || '')];
  if (!pair) return null;
  const bI = nIdx(pair[0]), rI = nIdx(pair[1]);
  if (rI >= 0 && (+c.alloc[rI] || 0) >= 252) return '减项满投 ' + pair[1];
  if (bI >= 0 && (+c.alloc[bI] || 0) === 0) return '正项零投 ' + pair[0];
  return null;
}, c => !!c.b._v393RoleAlign);

// ---- v4.400：机制前缀名实（mechPrefix 按「物种能学」判前缀，前缀却贴在流派卡上 → 能学≠会带）----
// INV01 已覆盖「强化清场」形态；INV14 兜住「强化」前缀的其余全部形态
// （强化轮转补盲 / 强化受队消耗 / 强化稳健联防 / 强化主力输出压制 …）。
// 口径与 INV01 完全一致（FUNC_MV.boost ∪ BSTR 名字），避免同一指标两处矛盾。
def('INV14', '名含「强化」→ 必带强化招（覆盖非「强化清场」形态）', c => {
  if (c.name.indexOf('强化') < 0) return null;
  const bySet = inter(c.ids, G.boost).length > 0;
  const byName = c.ids.some(id => { const m = MV[id]; return m && BSTR.test(String(m[1] || '')); });
  return (bySet || byName) ? null : '名含强化但四招无强化招 ' + c.ids.join(',');
}, c => c.name.indexOf('强化') >= 0);

def('INV15', '名含「接棒」→ 必带接棒226 或换人招（FUNC_MV.pivot 369/521）', c => {
  if (c.name.indexOf('接棒') < 0) return null;
  const ok = c.ids.some(id => id === 226 || G.pivot.indexOf(id) >= 0);
  return ok ? null : '名含接棒但无接棒/换人招 ' + c.ids.join(',');
}, c => c.name.indexOf('接棒') >= 0);

// ---- 执行 ----
const probe = process.argv.indexOf('--probe') >= 0;
// 中文按 2 宽补齐（Node 的 console.log 不支持 %-58s 这类 printf 填充）
const pad = (s, n) => {
  let w = 0, out = String(s);
  for (const ch of out) w += /[\u2e80-\u9fff\u3000-\u303f\uff00-\uffef]/.test(ch) ? 2 : 1;
  while (w < n) { out += ' '; w++; }
  return out;
};
console.log('采集卡片 ' + cards.length + ' 张（six + empty）  不变量 ' + INV.length + ' 条');
console.log('');
let totalBad = 0;
const noScope = [];
for (const inv of INV) {
  const hits = [];
  let scopeN = 0;
  for (const c of cards) {
    if (inv.scope && !inv.scope(c)) continue;
    if (inv.scope) scopeN++;
    const v = inv.fn(c);
    if (v) hits.push(c);
  }
  if (inv.scope && scopeN === 0) noScope.push(inv.id + ' 适用 0 张');
  totalBad += hits.length;
  const sc = inv.scope ? ('[' + scopeN + ']') : '';
  console.log(inv.id + '  ' + pad(inv.name, 72) + ('适用' + sc).padEnd(12) + String(hits.length).padStart(5) + '  ' + (hits.length ? 'FAIL' : 'PASS'));
  hits.slice(0, 8).forEach(c => {
    const why = inv.fn(c);
    console.log('      [' + c.tag + '] #' + c.id + ' ' + c.zh + ' [' + c.i + '] ' + c.name + ' | ' + why + ' | abi ' + c.abiNames.join('|'));
  });
  if (hits.length > 8) console.log('      ... 共 ' + hits.length + ' 条');
}
console.log('');
console.log('=== 违规合计 ' + totalBad + ' ===');
if (noScope.length) { console.log('!! 作用域为空的断言（标记丢失）：' + noScope.join(' / ')); }
if (!probe) process.exit(totalBad === 0 && noScope.length === 0 ? 0 : 1);
