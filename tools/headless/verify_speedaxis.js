// v4.382 验证探针（带队口径）：速度轴 self-centric + 空间/速攻互斥 + 顺风扩面 + EV×命名。
// 四项断言：①无前缀/任意速攻名 且无自身速度来源=0；②纯慢速重炮 且 spd>60=0；③名含空间又含速攻=0；
//          ④速攻名 + EV 速=0 + 无自有倍率来源 =0；有倍率来源的例外逐条带来源名打印（跨队按 id+名去重）。
const H = require('./harness.js');
const { ERDATA, deriveBuilds, learnOf, profileOf, pvWeatherSpeedMul, isGlassCannon, bulkOf } = H;
const by = id => ERDATA.species.find(s => String(s.id) === String(id));
const fastTeam = [by(26), by(65)];
const slowTeam = ERDATA.species.filter(s => (+s.base[5]) <= 60 && learnOf(s).indexOf(433) >= 0).slice(0, 3);
const allTeam = [by(26), by(65), by(96), by(80), by(37), by(208)];
const spd = s => +s.base[5] || 0;
const evSpd = b => +((b.ev && b.ev.alloc) || [])[5] || 0;
const BOOST = [349, 483, 504, 187, 526];

function srcOf(s, b) {
  const mv = (b.mv.main || []).concat(b.mv.func || []).map(x => +x.id);
  const wx = (pvWeatherSpeedMul(s) || 1) > 1;
  const light = (s.abis || []).concat(s.inns || []).indexOf('轻装') >= 0;
  const scarf = String(((b.it || [])[0] || [])[0] || '').indexOf('讲究围巾') >= 0;
  const twMv = mv.indexOf(366) >= 0;
  const boost = mv.some(id => BOOST.indexOf(id) >= 0);
  const mult = wx || twMv || light || scarf;
  return { wx, light, scarf, twMv, boost, mult, ok: (spd(s) >= 100) || mult || boost };
}

const A0 = [], B = [], C = [];
const dMap = new Map(), demoted = [];

function scan(team) {
  for (const s of ERDATA.species) {
    let bs; try { bs = deriveBuilds(s, team); } catch (e) { continue; }
    for (const b of bs) {
      const n = String(b.name || '');
      const src = srcOf(s, b);
      if (b.v13Demoted) demoted.push({ id: s.id, zh: s.zh, chg: b.v13Demoted });
      if (/速攻/.test(n)) {
        if (!src.ok) A0.push({ id: s.id, zh: s.zh, spd: spd(s), name: n });
        if (evSpd(b) === 0) {
          const k = s.id + '|' + n;
          if (!dMap.has(k)) dMap.set(k, { id: s.id, zh: s.zh, spd: spd(s), name: n, ev: String((b.ev || {}).summary || ''), src, stale: !!b.v13EvStale });
        }
      }
      if (n === '慢速重炮' && spd(s) > 60) B.push({ id: s.id, zh: s.zh, spd: spd(s), name: n });
      if (n.indexOf('空间') >= 0 && n.indexOf('速攻') >= 0) C.push({ id: s.id, zh: s.zh, spd: spd(s), name: n });
    }
  }
}
scan(fastTeam); scan(slowTeam);

const D = [...dMap.values()];
const dNoMult = D.filter(r => !r.src.mult);
const multExc = D.filter(r => r.src.mult);
const stale = D.filter(r => r.stale);
function srcLabel(src) {
  const a = [];
  if (src.wx) a.push('天气提速特性');
  if (src.twMv) a.push('保留顺风');
  if (src.light) a.push('轻装');
  if (src.scarf) a.push('讲究围巾');
  return a.join('/') || '无倍率';
}

// 四轴只读登记（六人队，本版不改引擎；口径对齐 probe_other_axes.js）
const DEF_ABI = ['多重鳞片','幻影防守','毛皮大衣','毛茸茸','厚脂肪','结实','坚硬岩石','战斗盔甲','硬壳盔甲','魔法防守','毒疗','自然回复','再生力','过滤','热交换'];
const axes = { wx: 0, imm: 0, immBad: 0, stall: 0, pivotPivot: 0, pivotNoPivot: 0 };
for (const s of ERDATA.species) {
  let bs; try { bs = deriveBuilds(s, allTeam); } catch (e) { continue; }
  for (const b of bs) {
    const n = String(b.name || '');
    if (/增伤清场/.test(n)) axes.wx++;
    if (/受队消耗/.test(n)) axes.stall++;
    if (n.indexOf('轮转补盲') >= 0) {
      axes.pivotPivot++;
      const ids = (b.mv.main || []).map(x => +x.id);
      if (ids.indexOf(369) < 0 && ids.indexOf(521) < 0) axes.pivotNoPivot++;
    }
    if (n.indexOf('减伤轴') >= 0) {
      axes.imm++;
      const abiNames = (b.abi || []).map(a => String(a.n));
      if (!abiNames.some(a => DEF_ABI.indexOf(a) >= 0)) axes.immBad++;
    }
  }
}

console.log('=== v4.382 速度轴验证（fastTeam+slowTeam 带队，跨队去重）===');
console.log('① 速攻名 且无自身速度来源:', A0.length, A0.length === 0 ? 'PASS' : 'FAIL');
A0.forEach(r => console.log('   FAIL #' + r.id, r.zh, 'spd=' + r.spd, r.name));
console.log('② 纯慢速重炮 且 spd>60:', B.length, B.length === 0 ? 'PASS' : 'FAIL');
B.forEach(r => console.log('   FAIL #' + r.id, r.zh, 'spd=' + r.spd, r.name));
console.log('③ 名含空间又含速攻:', C.length, C.length === 0 ? 'PASS' : 'FAIL');
C.forEach(r => console.log('   FAIL #' + r.id, r.zh, r.name));
console.log('④ 速攻卡 0 速投入(去重) 总数:', D.length);
console.log('   其中 无自有倍率来源(必须0):', dNoMult.length, dNoMult.length === 0 ? 'PASS' : 'FAIL');
dNoMult.forEach(r => console.log('   FAIL #' + r.id, r.zh, 'spd=' + r.spd, r.name));
console.log('   有倍率来源例外(天气提速/保留顺风/轻装/围巾):', multExc.length);
multExc.forEach(r => console.log('   EXC #' + r.id, r.zh, 'spd=' + r.spd, r.name, '[' + srcLabel(r.src) + ']'));
console.log('   基础速度≥100 倍率残留 EV 未投入(已降级, 登记 v4.383 EV 层):', stale.length);
stale.forEach(r => console.log('   STALE #' + r.id, r.zh, 'spd=' + r.spd, r.name));
console.log('\n降级命名清单(v13Demoted, 去重):', demoted.length);
const demSet = new Set(demoted.map(r => r.chg));
[...demSet].forEach(c => console.log('   ' + c));
console.log('\n四轴只读登记(六人队, 本版不改):', JSON.stringify(axes));

const fail = A0.length + B.length + C.length + dNoMult.length;
console.log('\n=== 断言结果:', fail === 0 ? 'ALL PASS' : fail + ' 项 FAIL', '===');
process.exit(fail === 0 ? 0 : 1);
