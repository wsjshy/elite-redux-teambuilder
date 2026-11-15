const H = require('./harness_dbg.js');
const { ERDATA, MV } = H;
for (const tid of ['1043','1542']) {
  const s = ERDATA.species.find(x=>String(x.id)===tid);
  console.log(`\n===== #${tid} ${s.zh} base=${JSON.stringify(s.base)} abis=${JSON.stringify(s.abis)}`);
  const bs = H.deriveBuilds(s,[]);
  for (const b of bs) {
    console.log(`  [${b.name}] side=${b.side} role=${b.roleTag} 特性=${b.abi[0].n} 道具=${b.it[0][0]}`);
    console.log(`     main=${b.mv.main.map(x=>MV[x.id][1]).join('/')} func=${(b.mv.func||[]).map(x=>MV[x.id][1]).join('/')}`);
    console.log(`     EV=${b.ev.template} weatherSelfRemoved=${b.weatherSelfRemoved} abiSwapped=${b.abiSwappedForWeather}`);
  }
}
