// v4.386 ⑤ 展示层锚定复核：复刻 renderCore 的 _mainReps/_foldReps/_mergeFroms 构造，
// 套用补丁里的锚定规则，确认锚定后 showList[0] === 引擎 builds[0]。
const H = require('./harness.js');
const { ERDATA, deriveBuilds, classifyBuilds } = H;
const by = id => ERDATA.species.find(s => String(s.id) === String(id));
const TEAM = [by(26), by(65), by(96), by(80), by(37), by(208)];

function buildLists(s, bs) {
  const cl = classifyBuilds(s, bs);
  const main = [], fold = [], merged = [];
  cl.groups.forEach((g, gi) => {
    for (let mi = 1; mi < g.members.length; mi++) merged.push(g.members[mi]);
    if (gi === 0) { main.push(g.rep); return; }
    const fk = g.rep._candKey === 'main' || g.rep._candKey === 'def';
    if (fk) fold.push(g.rep); else main.push(g.rep);
  });
  return { main, fold, merged, show: main.concat(fold).concat(merged) };
}
function anchor(bs, main, fold, merged) {
  const eng = bs && bs[0]; if (!eng) return;
  const mi = main.indexOf(eng);
  if (mi === 0) return;
  if (mi > 0) { main.splice(mi, 1); main.unshift(eng); }
  else {
    const fi = fold.indexOf(eng);
    if (fi >= 0) { fold.splice(fi, 1); main.unshift(eng); }
    else { const gi = merged.indexOf(eng); if (gi >= 0) { merged.splice(gi, 1); main.unshift(eng); } }
  }
}

let before = 0, after = 0, total = 0;
const misAfter = [];
[['six', TEAM], ['empty', []]].forEach(([tag, team]) => {
  ERDATA.species.forEach(s => {
    let bs; try { bs = deriveBuilds(s, team); } catch (e) { return; }
    if (!bs.length) return;
    total++;
    const L = buildLists(s, bs);
    if (L.show[0] !== bs[0]) before++;
    anchor(bs, L.main, L.fold, L.merged);
    const show = L.main.concat(L.fold, L.merged);
    if (show[0] !== bs[0]) { after++; misAfter.push({ tag, id: s.id, zh: s.zh, eng: bs[0].name, first: show[0] && show[0].name }); }
  });
});
console.log('total species-build scans:', total);
console.log('before anchor showList[0]!==eng[0]:', before);
console.log('after  anchor showList[0]!==eng[0]:', after);
misAfter.slice(0, 20).forEach(r => console.log('  MISS', r.tag, '#' + r.id, r.zh, 'eng=' + r.eng, 'first=' + r.first));
