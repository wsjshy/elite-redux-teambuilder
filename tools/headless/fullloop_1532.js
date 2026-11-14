const NEW = require('./harness.js');
let seen = 0;
for (const s of NEW.ERDATA.species) {
  let bs;
  try { bs = NEW.deriveBuilds(s, []); } catch (e) { continue; }
  if (String(s.id) === '1532') {
    console.log("FULL-LOOP #1532 count:", bs.length);
    for (const b of bs)
      console.log(`  [${b.name}] nat=${b.nat[0][0]} side=${b.side} role=${b.roleTag} moves=${b.mv.main.map(x=>x.id).join('/')}`);
  }
  seen++;
}
