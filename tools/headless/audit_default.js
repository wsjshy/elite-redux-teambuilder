// 并列机制首推审计：默认(首个 score99)若为非本系机制，而另有本系机制 score99，则可疑。
// node tools/headless/audit_default.js
const H = require('./harness.js');
const { ERDATA, deriveBuilds, classifyBuilds, MV } = H;

function anchorId(b) {
  if (b.core && b.core.length) return b.core[0];
  return (b.mv.main || []).map(x => x.id)[0];
}
function isStab(s, id) {
  const r = MV[id];
  if (!r) return false;
  return r[3] === s.t1 || (s.t2 && r[3] === s.t2);
}

const flagged = [];
for (const s of ERDATA.species) {
  let bs;
  try { bs = deriveBuilds(s, []); } catch (e) { continue; }
  const mech = bs.filter(b => b.score === 99);
  if (mech.length < 2) continue;
  const c = classifyBuilds(s, bs);
  const def = c.top;
  if (def.score !== 99) continue;
  const defStab = isStab(s, anchorId(def));
  const stabAlt = mech.find(b => b !== def && isStab(s, anchorId(b)));
  if (!defStab && stabAlt) {
    flagged.push({ id: s.id, zh: s.zh, def: def.name, defAnchor: (MV[anchorId(def)] || [])[1],
      stabAlt: stabAlt.name, stabAnchor: (MV[anchorId(stabAlt)] || [])[1] });
  }
}
console.log('suspect non-stab defaults:', flagged.length);
for (const f of flagged.slice(0, 50)) console.log(JSON.stringify(f));
