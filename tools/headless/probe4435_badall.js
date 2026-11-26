// v4.435 probe: enumerate every bad-move card tagged with mech rewrite + move id
const H = require('./harness.js');
const bad = [];
for (const s of H.ERDATA.species) {
  let bs; try { bs = H.deriveBuilds(s, []); } catch (e) { continue; }
  bs.forEach(b => {
    const L = H.learnOf(s);
    (b.mv.main || []).forEach(x => {
      if (L.indexOf(x.id) < 0) bad.push([s.id, s.zh, b.mechRw || '-', b.name, x.id]);
    });
  });
}
console.log('bad total', bad.length);
bad.forEach(x => console.log(x.join(' | ')));
