const OLD = require('C:/temp/er-deploy/harness_old.js');
const NEW = require('./harness.js');

function countMap(H) {
  const m = {};
  for (const s of H.ERDATA.species) {
    let n;
    try { n = H.deriveBuilds(s, []).length; } catch (e) { n = -1; }
    m[s.id] = n;
  }
  return m;
}
const a = countMap(OLD), b = countMap(NEW);
let diffs = [];
for (const id of Object.keys(b)) {
  if (a[id] !== b[id]) {
    const sp = NEW.ERDATA.species.find(x => String(x.id) === String(id));
    diffs.push({ id, zh: sp && sp.zh, old: a[id], neu: b[id] });
  }
}
console.log("build count 变化的物种数:", diffs.length);
for (const d of diffs) console.log(`#${d.id} ${d.zh}: ${d.old} -> ${d.neu}`);
