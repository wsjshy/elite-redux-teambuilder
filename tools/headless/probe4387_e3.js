// v4.387 E3：66 台账内，物种池层面交叉 墙招可学 / 免疫特性
const H = require('./harness.js');
const fs = require('fs'), path = require('path');
const { ERDATA, deriveBuilds, learnOf, MV, abiTagOf } = H;
const dir = __dirname;
const R4386 = JSON.parse(fs.readFileSync(path.join(dir,'_ev4386.json'),'utf8'));
const ROWS = R4386.a2.six.noRecRows;
const WALL={113:'光墙',115:'反射壁',657:'极光幕'};
const by=id=>ERDATA.species.find(s=>String(s.id)===String(id));

function abiNames(s){return (s.abis||[]).concat(s.inns||[]).map(x=>String(x));}
function immAbis(s){return abiNames(s).filter(n=>{const t=abiTagOf(n);return t&&t.im&&t.im.length;});}

console.log('== 19 免疫卡：物种是否可学墙招 / 免疫特性池 ==');
ROWS.filter(r=>r.name==='属性免疫联防位').forEach(r=>{
  const s=by(r.id); if(!s){console.log(r.id,'物种缺失');return;}
  const walls=learnOf(s).filter(id=>WALL[id]);
  const im=immAbis(s);
  console.log(`#${r.id} ${r.zh} [${s.t1}/${s.t2}] 墙招=${walls.map(x=>x+':'+WALL[x]).join('/')||'无'} 免疫特性池=${im.join('/')||'无'} 首推=${r.abi0||''}`);
});
console.log('\n== 45 双墙卡：物种免疫特性池（首推外的可选免疫特性）==');
ROWS.filter(r=>r.name==='双墙辅助流').forEach(r=>{
  const s=by(r.id); if(!s)return;
  const im=immAbis(s);
  if(im.length)console.log(`#${r.id} ${r.zh} [${s.t1}/${s.t2}] 免疫特性池=${im.join('/')} 首推=${r.abi0||''}`);
});
