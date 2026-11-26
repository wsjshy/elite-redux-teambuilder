const H = require('./harness.js');
const { ERDATA, deriveBuilds, learnOf, MV } = H;
const by = id => ERDATA.species.find(s => String(s.id) === String(id));
const allTeam = [26,65,96,80,37,208].map(by);
const R4386 = require('./_ev4386.json');
const ROWS = R4386.a2.six.noRecRows;
const WALL={113:'光墙',115:'反射壁',657:'极光幕'};
ROWS.forEach(r=>{
  const s=by(r.id); if(!s)return;
  const learn=learnOf(s)||[];
  const wlearn=learn.filter(id=>WALL[id]);
  let kit=[];
  try{deriveBuilds(s,allTeam).forEach(b=>{
    const m=[...(b.mv&&b.mv.main||[]).map(x=>+x.id),...(b.mv&&(b.mv.func||b.mv.funcs)||[]).map(x=>+x.id)];
    if(String(b.name)===r.name)kit=m;
  });}catch(e){}
  const wkit=kit.filter(id=>WALL[id]);
  if(wlearn.length||wkit.length) console.log(`#${r.id} ${r.zh} 名=${r.name} 学墙=${wlearn.map(id=>id+':'+WALL[id]).join('/')||'无'} kit墙=${wkit.map(id=>id+':'+WALL[id]).join('/')||'无'}`);
});
