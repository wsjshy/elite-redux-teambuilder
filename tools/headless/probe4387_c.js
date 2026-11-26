// v4.387 C：洛托姆五形态按招组定名复核 + 全库同规则扫描（只读）
const H = require('./harness.js');
const fs = require('fs'), path = require('path');
const { ERDATA, deriveBuilds, MV } = H;
const dir = __dirname;
const by = id => ERDATA.species.find(s => String(s.id) === String(id));
const allTeam = [26, 65, 96, 80, 37, 208].map(by);

const HAZARD = { 191: '撒菱', 390: '毒菱', 446: '隐形岩', 564: '黏黏网' };
const alloc = b => (b.ev && b.ev.alloc) || [0,0,0,0,0,0];
const natStr = b => Array.isArray(b.nat) ? b.nat.map(p=>(p||[]).join(',')).join(',') : String(b.nat||'');
const mvIds = b => (b.mv.main||[]).concat(b.mv.func||[]).map(x=>+x.id);
const dmg = ids => ids.filter(id=>MV[id]&&MV[id][4]!=='变化').length;
const mvZh = id => MV[id] ? (MV[id][1]||MV[id][2]||String(id)) : String(id);
const offEv = a => Math.max(a[1]||0, a[3]||0);

// 类型免疫：锚点已核 matchup[defTypeId][atkTypeId]===0（幽灵[def]行 一般/格斗 列=0）
const matchup = ERDATA.matchup || {};
const TYPES = ERDATA.types || [];
const typeId = nm => TYPES.indexOf(nm);
function hasImmune(s) {
  const defIds = [...new Set([s.t1, s.t2].filter(Boolean).map(typeId).filter(x => x >= 0))];
  const immune = [];
  for (let a = 0; a < TYPES.length; a++) {
    for (const d of defIds) { const row = matchup[d]; if (row && row[a] === 0) { immune.push(TYPES[a]); break; } }
  }
  return [...new Set(immune)];
}

function predict(s, b) {
  const ids = mvIds(b), a = alloc(b);
  const haz = ids.filter(id => HAZARD[id]);
  const d = dmg(ids), oe = offEv(a);
  const immune = hasImmune(s);
  let rule = null, why = '';
  if (haz.length) { rule = '钉子主力输出压制'; why = '带钉子招 ' + haz.map(id=>id+HAZARD[id]).join('/'); }
  else if (d >= 2 && oe >= 120) { rule = '主力输出压制'; why = '伤害招 ' + d + ' 个、进攻EV ' + oe; }
  else if (immune.length && d < 2 && oe < 120) { rule = '属性免疫联防位'; why = '免疫 ' + immune.join('/') + '，伤害招 ' + d + '，进攻EV ' + oe; }
  else if (immune.length) { rule = '(无规则命中)'; why = '有免疫 ' + immune.join('/') + ' 但伤害招 ' + d + '、进攻EV ' + oe + '（进攻意图，不归联防）'; }
  else { rule = '(无规则命中)'; why = '伤害招 ' + d + '、进攻EV ' + oe + '、免疫 ' + immune.join('/'); }
  return { rule, why, haz, dmg: d, offEv: oe, immune };
}

// 1) 洛托姆五形态（双口径）
const rotom = [1643,1644,1645,1646,1647];
const rotomOut = {};
for (const id of rotom) {
  const s = by(id);
  const variants = [];
  for (const [tag, team] of [['six', allTeam], ['empty', []]]) {
    let bs; try { bs = deriveBuilds(s, team); } catch(e) { variants.push({tag, err: String(e)}); continue; }
    bs.forEach((b, i) => {
      const ids = mvIds(b), pr = predict(s, b);
      variants.push({ tag, idx: i, name: String(b.name||''), side: String(b.side||''), roleTag: String(b.roleTag||''),
        alloc: alloc(b), nat: natStr(b), mv: ids.map(x=>x+':'+mvZh(x)), score: b.score,
        abi0: b.abi&&b.abi[0]?String(b.abi[0].n):'', it0: b.it&&b.it[0]?String(b.it[0][0]):'',
        predict: pr.rule, why: pr.why });
    });
  }
  rotomOut[id] = { zh: s.zh, en: s.en, types: [s.t1, s.t2], variants };
}

// 2) 全库扫描：仅当当前名属三桶之一、且规则预测为另一桶时才报（主题流派名不参与改名比对）
const B_HAZ = '钉子主力输出压制', B_OFF = '主力输出压制', B_IMM = '属性免疫联防位';
function bucketOf(name) {
  if (name.includes('钉子') && name.includes('主力输出压制')) return B_HAZ;
  if (name.includes('主力输出压制')) return B_OFF;
  if (name.includes('属性免疫联防')) return B_IMM;
  return null;
}
const mismatches = [];
ERDATA.species.forEach(s => {
  let bs; try { bs = deriveBuilds(s, []); } catch(e) { return; }
  bs.forEach((b, i) => {
    const cur = String(b.name||'');
    const pr = predict(s, b);
    const curBucket = bucketOf(cur);
    const predBucket = [B_HAZ, B_OFF, B_IMM].includes(pr.rule) ? pr.rule : null;
    if (!curBucket || !predBucket || curBucket === predBucket) return;
    mismatches.push({ id: String(s.id), zh: s.zh, idx: i, cur, predict: pr.rule, why: pr.why,
      side: String(b.side||''), roleTag: String(b.roleTag||''), mv: mvIds(b).map(x=>x+':'+mvZh(x)) });
  });
});

const breakdown = {};
mismatches.forEach(m => { const k = m.cur + ' → ' + m.predict; breakdown[k] = (breakdown[k]||0)+1; });
const out = { rotom: rotomOut, mismatchCount: mismatches.length, breakdown, mismatches: mismatches };
fs.writeFileSync(path.join(dir,'_ev4387_c.json'), JSON.stringify(out, null, 1));

for (const id of rotom) {
  const r = rotomOut[id];
  console.log('====', id, r.zh, r.types.join('/'));
  r.variants.forEach(v => {
    if (v.err) { console.log('  err', v.err); return; }
    console.log(`  [${v.tag}#${v.idx}] ${v.name} | ${v.side}/${v.roleTag} | EV[${v.alloc}] | ${v.mv.join(' ')} | 预测=${v.predict} | ${v.why}`);
  });
}
console.log('\n全库规则不一致候选:', mismatches.length);
console.log('方向分布:', JSON.stringify(breakdown));
mismatches.slice(0, 25).forEach(m => console.log(`  #${m.id} ${m.zh}#${m.idx} 现「${m.cur}」→ ${m.predict} | ${m.why} | ${m.mv.join(' ')}`));
