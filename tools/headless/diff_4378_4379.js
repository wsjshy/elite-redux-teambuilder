const OLD = require('C:/temp/er4378/harness.js');
const NEW = require('./harness.js');
const oldMap = new Map(OLD.ERDATA.species.map(s=>[String(s.id),s]));
let totalOld=0,totalNew=0;
for (const s of NEW.ERDATA.species) {
  const id=String(s.id);
  const nb=NEW.deriveBuilds(s,[]); totalNew+=nb.length;
  const os=oldMap.get(id);
  const ob=OLD.deriveBuilds(os,[]); totalOld+=ob.length;
  if (nb.length!==ob.length) {
    console.log(`#${id} ${s.zh}: ${ob.length}→${nb.length}`);
    console.log("   旧:", ob.map(b=>b.name).join(' | '));
    console.log("   新:", nb.map(b=>b.name).join(' | '));
  }
}
console.log("\n总流派 旧:",totalOld," 新:",totalNew);
