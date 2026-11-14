// 玻璃大炮 × 先制/防速攻 全库探针
const fs = require('fs');
const H = require('./harness.js');
const { ERDATA, deriveBuilds, MV, learnOf } = H;

// 1) 解析源码 MoveList 拿先制
const txt = fs.readFileSync('D:/game/scratch/eliteredux-source/proto/MoveList.textproto', 'utf8');
const blocks = txt.split(/\moves \{/).slice(1);
const priByName = {};   // english name -> {pri, split, power, id}
for (const blk of blocks) {
  const body = blk.split(/\n\}/)[0];
  const name = (body.match(/name: "([^"]+)"/) || [])[1];
  const mpri = (body.match(/priority: (-?\d+)/) || [])[1];
  const split = (body.match(/split: (\w+)/) || [])[1];
  const pw = (body.match(/power: (\d+)/) || [])[1];
  if (mpri && +mpri > 0 && split && split !== 'STATUS') {
    priByName[name] = { pri: +mpri, split, power: pw ? +pw : 0 };
  }
}
// 2) 英文名 -> 引擎 id
const nameToId = {};
for (const id in MV) nameToId[MV[id][2]] = +id;
const priIds = {};       // engine id -> priority
const unmapped = [];
for (const nm in priByName) {
  if (nameToId[nm] != null) priIds[nameToId[nm]] = priByName[nm].pri;
  else unmapped.push(nm);
}
// 一般/特殊 类别名归一
function sideSplit(s) { return s === '物理' ? 'PHYSICAL' : (s === '特殊' ? 'SPECIAL' : s); }

// 3) 全库扫描
let withPriNotRun = [];   // 有真先制但没带
let noPri = [];           // 玻璃大炮且无任何先制
const seen = new Set();
for (const s of ERDATA.species) {
  let learn;
  try { learn = learnOf(s); } catch (e) { continue; }
  const priInLearn = learn.filter(id => priIds[id] != null)
    .filter(id => id !== 252 && id !== 364); // 排除击掌奇袭(首回合)/佯攻(破守)
  const b = s.base;
  const bulk = b[0] * (b[3] + b[5]) / 2;     // HP * (防+特防)/2
  const builds = deriveBuilds(s, []);
  builds.forEach(bd => {
    if (bd.side !== '物理' && bd.side !== '特殊') return;
    const key = s.id + '|' + bd.name;
    if (seen.has(key)) return; seen.add(key);
    const runIds = (bd.mv.main || []).map(x => x.id);
    const hasPri = runIds.some(id => priIds[id] != null);
    const rec = { sp: s.id, zh: s.zh, build: bd.name, side: bd.side, speed: b[6], bulk: Math.round(bulk), item: (bd.it[0]||[])[0], sub: runIds.indexOf(164)>-1 };
    if (priInLearn.length && !hasPri) {
      rec.priMoves = priInLearn.map(id => id + ':' + MV[id][1] + '(p' + priIds[id] + ',' + MV[id][3] + ',w' + MV[id][5] + ')');
      withPriNotRun.push(rec);
    } else if (!priInLearn.length && !hasPri) {
      noPri.push(rec);
    }
  });
}
const out = {
  sourcePriMoves: Object.keys(priByName).length,
  mappedPriIds: Object.keys(priIds).length,
  unmapped: unmapped,
  withPriNotRun_count: withPriNotRun.length,
  noPri_count: noPri.length,
  withPriNotRun: withPriNotRun.slice(0, 60),
  noPri_sample: noPri.slice(0, 40),
};
fs.writeFileSync('probe_glass.json', JSON.stringify(out, null, 1));
console.log('source priority moves', out.sourcePriMoves, 'mapped', out.mappedPriIds);
console.log('unmapped', unmapped.join(', ') || 'none');
console.log('glass cannon WITH priority but not run:', withPriNotRun.length);
console.log('glass cannon with NO priority:', noPri.length);
