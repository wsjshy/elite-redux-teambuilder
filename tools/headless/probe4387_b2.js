const fs = require('fs'), path = require('path');
const dir = __dirname, root = path.dirname(path.dirname(dir));
for (const f of ['data_lite_v498.js', 'data_adv_v498.js', 'data_species_v498.js']) {
  const t = fs.readFileSync(path.join(root, f), 'utf8');
  for (const id of ['1048', '1053']) {
    let i = t.indexOf('"' + id + '"');
    while (i >= 0) {
      console.log(f, id, '@', i, '::', t.slice(Math.max(0, i - 60), i + 120).replace(/\s+/g, ' '));
      i = t.indexOf('"' + id + '"', i + 1);
    }
  }
}
// adv 各顶层键
const adv = fs.readFileSync(path.join(root, 'data_adv_v498.js'), 'utf8');
const keys = [...adv.matchAll(/ERDATA\["(\w+)"\]/g)].map(m => m[1]);
console.log('adv keys:', [...new Set(keys)].join(','));
const lite = fs.readFileSync(path.join(root, 'data_lite_v498.js'), 'utf8');
const lkeys = [...lite.matchAll(/ERDATA\["(\w+)"\]/g)].map(m => m[1]);
console.log('lite keys:', [...new Set(lkeys)].join(','));
