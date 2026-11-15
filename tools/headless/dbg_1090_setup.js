const OLD = require('C:/temp/er4378/harness.js');
const NEW = require('./harness.js');
const { MV } = NEW;
const s=OLD.ERDATA.species.find(x=>String(x.id)==='1090');
for(const b of OLD.deriveBuilds(s,[])){
  console.log(`[${b.name}] ${b.side}/${b.roleTag} 特性=${b.abi[0].n} id=${b.abi[0].id}`);
  console.log('  ',b.mv.main.map(m=>MV[m.id]?MV[m.id][1]+'('+m.id+')':m.id).join('/'));
}
