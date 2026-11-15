const OLD = require('C:/temp/er4378/harness.js');
const NEW = require('./harness.js');
const { MV } = NEW;
for (const tid of ['947','1120','542','1817']) {
  const s = OLD.ERDATA.species.find(x=>String(x.id)===tid);
  console.log(`\n===== #${tid} ${s.zh} base=${JSON.stringify(s.base)} abis=${JSON.stringify(s.abis)}`);
  for (const b of OLD.deriveBuilds(s,[])) {
    console.log(`  [${b.name}] ${b.side}/${b.roleTag} 特性=${b.abi[0].n}`);
    console.log(`     ${b.mv.main.map(m=>MV[m.id]?MV[m.id][1]:('?'+m.id)).join('/')}`);
  }
}
