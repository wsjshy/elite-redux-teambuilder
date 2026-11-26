// v4.396 专项断言：日光束 76 / 日光刃 632 「无晴源且无 chloroplast」全库清零
const HD = 'D:/game/elite-redux/tools/headless/';
const H = require(HD + 'harness.js');
const { ERDATA, deriveBuilds, MV } = H;
const fs = require('fs'), path = require('path');
const by = id => ERDATA.species.find(s => String(s.id) === String(id));
const team = [26, 65, 96, 80, 37, 208].map(by);
const SUN = ['70', '584', '190', '871'];          // 产生晴天的特性 id（引擎同口径）
const CHL = ['268', '366', '374'];                 // 源码 abilities.cc 带 chloroplast flag
const CHGN = /叶绿体|耀斑|巨大树叶|Mega Sol/;
const DEP = [76, 632];
const WSET = [201, 240, 241, 258, 580, 581, 604, 641, 950];
const nm = id => { const m = MV[+id]; return m ? (m[1] + '(' + id + ')') : String(id); };
const mvIds = b => (b.mv.main || []).concat(b.mv.func || []).map(x => +x.id);

const fails = [];
const stat = { tot: 0, noSrc: 0, keepChl: 0, keepSun: 0, keep99: 0, swapped: 0 };
const residual = [], whyBad = [], wsetBack = [], dupMv = [];

for (const tag of ['six', 'empty']) {
  for (const s of ERDATA.species) {
    let bs; try { bs = deriveBuilds(s, tag === 'six' ? team : []); } catch (e) { continue; }
    bs.forEach((b, i) => {
      const ids = mvIds(b);
      const whyTxt = [].concat(b.mv.main || [], b.mv.func || []).map(x => String((x.why || []).join('')));
      // ② 同一卡内 mv 不得重复
      if (ids.length !== new Set(ids).size) dupMv.push({ tag, id: s.id, i, name: b.name, ids: ids.join(',') });
      const hasDep = ids.includes(76) || ids.includes(632);
      if (!hasDep && !b._v396Keep && whyTxt.join('').indexOf('需蓄力一回合') < 0) return;
      if (hasDep) {
        stat.tot++;
        const abiIds = (b.abi || []).map(a => String(a.id == null ? '' : a.id)).filter(Boolean);
        const pool = [].concat(s.abis || [], s.inns || []).join('|');
        const hasChl = CHGN.test(pool) || abiIds.some(x => CHL.includes(x));
        const hasSun = abiIds.some(x => SUN.includes(x)) || ids.includes(241);
        if (hasChl) stat.keepChl++;
        else if (hasSun) stat.keepSun++;
        else if (b.score === 99 && coreHasDep(b, ids)) stat.keep99++;
        else { stat.noSrc++; residual.push({ tag, id: s.id, zh: s.zh, i, name: b.name, abi: (b.abi || []).map(a => a.n).join('|'), ids: ids.join(',') }); }
      } else {
        stat.swapped++;
        // ① 换招卡的 why 必须带口径说明
        if (whyTxt.join('').indexOf('需蓄力一回合') < 0) whyBad.push({ tag, id: s.id, i, name: b.name, why: whyTxt.join(' / ').slice(0, 90) });
      }
      // ③ 换招后不得补回天气招（只看新增槽位，原有天气招不算：如 #331 的沙暴是 v4.395 恶作剧之心豁免保留）
      if (wxBackOf(b)) wsetBack.push({ tag, id: s.id, i, name: b.name, ids: ids.join(',') });
    });
  }
}
function wxBackOf(b) { return false; }   // 占位：真正判定走 _v4396_hit.json 的 old/new 对照（见下方 ③）
// score99 的合法保留只有一个条件：机制核心 core 数组里点名的就是 76/632 本身（填充槽不算）
function coreHasDep(b, ids) {
  const co = [];
  try { (b.core || []).forEach(c => { if (/^\d+$/.test(String(c))) co.push(+c); }); } catch (e) { }
  return co.some(c => ids.includes(c) && (c === 76 || c === 632));
}

// ④ 零漂移：改前/改后全卡对照，只有 mv 变化，其余字段一字不动、卡数不变
const BEFORE = JSON.parse(fs.readFileSync(path.join(HD, '_v4396_before.json'), 'utf8'));
const AFTER = JSON.parse(fs.readFileSync(path.join(HD, '_v4396_after.json'), 'utf8'));
const sig = r => [r.side, r.role, JSON.stringify(r.alloc), JSON.stringify(r.nat), r.tpl, r.it, r.abi].join('|');
let drift = [], countOk = true, onlyMv = 0;
for (const tag of ['six', 'empty']) {
  if (BEFORE[tag].length !== AFTER[tag].length) { countOk = false; drift.push({ tag, why: '卡数变化 ' + BEFORE[tag].length + '→' + AFTER[tag].length }); }
  const bmap = new Map(); BEFORE[tag].forEach(r => { const k = r.id; if (!bmap.has(k)) bmap.set(k, []); bmap.get(k).push(r); });
  const amap = new Map(); AFTER[tag].forEach(r => { const k = r.id; if (!amap.has(k)) amap.set(k, []); amap.get(k).push(r); });
  for (const [k, bl] of bmap) {
    const al = amap.get(k) || []; const used = new Set();
    for (const br of bl) {
      const j = al.findIndex((ar, x) => !used.has(x) && sig(ar) === sig(br));
      if (j < 0) { drift.push({ tag, id: k, name: br.name, why: '非 mv 字段漂移（签名不一致）' }); continue; }
      used.add(j);
      if (JSON.stringify(br.mv) !== JSON.stringify(al[j].mv)) onlyMv++;
    }
    if (used.size !== al.length) al.forEach((ar, x) => { if (!used.has(x)) drift.push({ tag, id: k, name: ar.name, why: '多出未配对卡' }); });
  }
}

// ③ 新增槽位是否为天气招（原产招不算：v4.395 恶作剧之心豁免会保留既有天气招）
const HIT = JSON.parse(fs.readFileSync(path.join(HD, '_v4396_hit.json'), 'utf8'));
const seg = s => String(s || '').split('|').map(p => p.split(',').filter(Boolean).map(Number));
['six', 'empty'].forEach(t => {
  (HIT[t] || []).forEach(r => {
    const o = seg(r.oldMv), n = seg(r.newMv);
    const oSet = new Set(o.flat());
    const added = n.flat().filter(x => !oSet.has(x));
    if (added.some(x => WSET.includes(x))) wsetBack.push({ tag: t, id: r.id, i: r.i, name: r.name, add: added.join(',') });
  });
});

console.log('① 无晴源且无 chloroplast 仍带日光束/日光刃:', stat.noSrc, stat.noSrc === 0 ? 'PASS' : 'FAIL');
console.log('② 改前改后零漂移（只动 mv）:', drift.length, '条漂移 / 仅 mv 变化', onlyMv, '张', (drift.length === 0 && countOk && onlyMv === 153) ? 'PASS' : 'FAIL');
console.log('③ 换招卡 why 未带口径说明:', whyBad.length, whyBad.length === 0 ? 'PASS' : 'FAIL');
console.log('④ 换招后补回天气招:', wsetBack.length, wsetBack.length === 0 ? 'PASS' : 'FAIL');
console.log('⑤ 同卡内招式重复:', dupMv.length, dupMv.length === 0 ? 'PASS' : 'FAIL');
console.log('\n覆盖: 带 76/632 卡', stat.tot, '（chloroplast 保留', stat.keepChl, '/ 晴源保留', stat.keepSun, '/ score99 保留', stat.keep99, '）| 本版换招', stat.swapped, '张');
if (residual.length) { console.log('--- 残留 ---'); residual.slice(0, 20).forEach(r => console.log('  [' + r.tag + '] #' + r.id, r.zh, '[' + r.i + ']', r.name, '| abi', r.abi, '|', r.ids)); }
if (whyBad.length) { console.log('--- why 缺失 ---'); whyBad.slice(0, 10).forEach(r => console.log('  [' + r.tag + '] #' + r.id, '[' + r.i + ']', r.name, '|', r.why)); }
if (drift.length) { console.log('--- 漂移 ---'); drift.slice(0, 20).forEach(r => console.log('  [' + r.tag + '] #' + r.id, r.name, '|', r.why)); }
if (wsetBack.length) { console.log('--- 天气招回流 ---'); wsetBack.slice(0, 10).forEach(r => console.log('  [' + r.tag + '] #' + r.id, r.name, '|', r.ids)); }

const ok = stat.noSrc === 0 && drift.length === 0 && countOk && onlyMv === 153 && whyBad.length === 0 && wsetBack.length === 0 && dupMv.length === 0;
console.log('\n=== 断言结果:', ok ? 'ALL PASS' : 'FAIL', '===');
process.exit(ok ? 0 : 1);
