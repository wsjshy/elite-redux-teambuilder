// v4.387 E4：当前引擎 66 无回复睡觉卡，与 v4386 台账比对名称/招组漂移
const H = require('./harness.js');
const fs = require('fs'), path = require('path');
const { ERDATA, deriveBuilds, learnOf, MV, bulkOf, isGlassCannon } = H;
const dir = __dirname;
const by=id=>ERDATA.species.find(s=>String(s.id)===String(id));
const allTeam=[26,65,96,80,37,208].map(by);
const REC={105:1,234:1,235:1,236:1,355:1,303:1,135:1,208:1,631:1,275:1,392:1,622:1,744:1,915:1,202:1,409:1,532:1,72:1,71:1,837:1,73:1};
const mvIds=b=>(b.mv.main||[]).concat(b.mv.func||[]).map(x=>+x.id);
const old=JSON.parse(fs.readFileSync(path.join(dir,'_ev4386.json'),'utf8')).a2.six.noRecRows;
const oldMap={};old.forEach(r=>{(oldMap[r.id+'|'+r.name]=r);});

const cur=[];
ERDATA.species.forEach(s=>{let bs;try{bs=deriveBuilds(s,allTeam)}catch(e){return}
  bs.forEach(b=>{const ids=mvIds(b);if(!ids.includes(156)||!isGlassCannon(s))return;
    if(learnOf(s).some(id=>REC[id]))return;
    cur.push({id:String(s.id),zh:s.zh,name:String(b.name||''),role:String(b.roleTag||''),side:String(b.side||''),mv:ids});
  });
});
const byName={};cur.forEach(r=>byName[r.name]=(byName[r.name]||0)+1);
console.log('当前 noRec',cur.length,JSON.stringify(byName));
console.log('\n== 台账有、当前无（id|name）==');
Object.keys(oldMap).forEach(k=>{if(!cur.some(r=>r.id+'|'+r.name===k)){const o=oldMap[k];console.log(k,o.zh,o.mv.join(','));}});
console.log('\n== 当前有、台账无 ==');
cur.forEach(r=>{if(!oldMap[r.id+'|'+r.name])console.log(r.id,r.zh,r.name,r.role+'/'+r.side,r.mv.map(x=>x+':'+(MV[x]?MV[x][1]:x)).join(' '));});
console.log('\n== 同 id 不同名（台账名 → 当前名）==');
cur.forEach(r=>{const o=old.find(x=>x.id===r.id);if(o&&o.name!==r.name)console.log(`#${r.id} ${r.zh} 台账[${o.name}] → 当前[${r.name}] ${r.role}/${r.side} | ${r.mv.map(x=>x+':'+(MV[x]?MV[x][1]:x)).join(' ')}`);});
