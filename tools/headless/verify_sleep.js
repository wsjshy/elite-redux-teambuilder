// v4.387 verify_sleep：不满足睡觉判据且未登记持有 = 0；统计真回复/补盲/守住三桶与持有条数。
const H = require('./harness.js');
const { ERDATA, deriveBuilds, learnOf, MV, bulkOf } = H;
const by = id => ERDATA.species.find(s => String(s.id) === String(id));
const allTeam = [26, 65, 96, 80, 37, 208].map(by);

const TYPES = ERDATA.types || [], matchup = ERDATA.matchup || {};
const typeId = n => TYPES.indexOf(n);
function dec(v) { return v === 0 ? 0 : (v === 0.5 || v === 3 ? 0.5 : (v === 2 ? 2 : 1)); }
function fourx(s) {
  const ds = [...new Set([s.t1, s.t2].filter(t => t && t !== '-').map(typeId).filter(x => x >= 0))];
  const res = [];
  for (let a = 0; a < TYPES.length; a++) { let eff = 1; ds.forEach(d => { const row = matchup[d]; eff *= dec(row && row[a] != null ? row[a] : 1); }); if (eff === 4) res.push(TYPES[a]); }
  return res;
}
function allowOf(s) {
  const bulk = +s.base[0] + (+s.base[2]) + (+s.base[4]);
  return bulk >= 300 || (bulk >= 270 && Math.min(+s.base[2], +s.base[4]) >= 90 && fourx(s).length === 0);
}
const DREAM = { '96': 1, '517': 1, '518': 1, '574': 1, '575': 1 };
const STALL = { '95': 1, '221': 1, '246': 1, '247': 1, '304': 1, '305': 1, '410': 1, '443': 1, '444': 1, '445': 1, '473': 1, '551': 1, '552': 1, '553': 1, '696': 1, '697': 1, '698': 1, '699': 1, '776': 1, '782': 1, '878': 1, '879': 1, '880': 1, '882': 1, '1038': 1, '1894': 1 };
const ids = b => (b.mv.main || []).concat(b.mv.func || []).map(x => +x.id);

let sleepTotal = 0, allow = 0, repl = 0, keepStall = 0, keepDream = 0;
let swapRec = 0, swapCover = 0, swapGuard = 0;
const bad = [];

function scan(team, tag) {
  ERDATA.species.forEach(s => {
    let bs; try { bs = deriveBuilds(s, team); } catch (e) { return; }
    bs.forEach(b => {
      const kit = ids(b);
      if (kit.indexOf(156) < 0) return;
      sleepTotal++;
      if (allowOf(s)) { allow++; return; }
      repl++;
      const isDream = DREAM[String(s.id)] && kit.indexOf(138) >= 0;
      const isStall = STALL[String(s.id)] && /受队消耗|骚扰消耗|耐久压制/.test(String(b.name || ''));
      if (isDream) { keepDream++; return; }
      if (isStall) { keepStall++; return; }
      bad.push(`${tag} #${s.id} ${s.zh} ${b.name} 不满足判据但仍带睡觉且未登记持有`);
    });
  });
  // 换招桶统计（标记在最终卡上）
  ERDATA.species.forEach(s => {
    let bs; try { bs = deriveBuilds(s, team); } catch (e) { return; }
    bs.forEach(b => {
      const m = b._v387SleepSwap;
      if (!m) return;
      if (/→182/.test(m)) swapGuard++;
      else if (/^sleep→105|^sleep→355|^sleep→234|^sleep→235|^sleep→236|^sleep→303|^sleep→135|^sleep→208|^sleep→631|^sleep→275|^sleep→392|^sleep→622|^sleep→744|^sleep→915|^sleep→202|^sleep→409|^sleep→532|^sleep→72|^sleep→71|^sleep→837|^sleep→73/.test(m)) swapRec++;
      else swapCover++;
    });
  });
}
scan([], 'empty');
scan(allTeam, 'six');

console.log('含睡觉总记录', sleepTotal);
console.log('允许保留', allow, '| 不满足', repl);
console.log('持有：受队消耗', keepStall, '| 食梦', keepDream, '| 持有合计', keepStall + keepDream);
console.log('D 换招桶：真回复', swapRec, '| 补盲/本系', swapCover, '| 守住', swapGuard);
console.log('断言：不满足判据且未登记持有仍带睡觉 =', bad.length === 0 ? '0 ✓' : bad.length + ' ✗');
bad.slice(0, 20).forEach(x => console.log('   ✗', x));

// #1503 专核
const s1503 = by('1503');
let bs1503 = []; try { bs1503 = deriveBuilds(s1503, []); } catch (e) {}
console.log('\n#1503 构建：');
bs1503.forEach((b, i) => console.log(`  [${i}] ${b.name} | ${ids(b).join('/')} | swap=${b._v387SleepSwap || '—'}`));

process.exit(bad.length === 0 ? 0 : 1);
