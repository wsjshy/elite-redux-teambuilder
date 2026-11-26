const H = require('./harness.js');
const { ERDATA, MV } = H;
const TEAM = [26, 65, 96, 80, 37, 208].map(id => ERDATA.species.find(s => String(s.id) === String(id)));
for (const tid of [163, 482]) {
  const s = ERDATA.species.find(x => String(x.id) === String(tid));
  const L = H.learnOf(s);
  console.log('\n===== #' + tid, s.zh, 'learn113', L.indexOf(113) >= 0, 'learn115', L.indexOf(115) >= 0);
  for (const [tag, team] of [['empty', []], ['six', TEAM]]) {
    const bs = H.deriveBuilds(s, team);
    console.log('--- tag', tag);
    bs.forEach((b, i) => {
      if (b.name.indexOf('双墙') < 0) return;
      const ids = (b.mv.main || []).concat(b.mv.func || []).map(x => +x.id);
      console.log(' [' + i + ']', b.name, 'fast', b._fastScreen,
        ids.map(id => id + ':' + (MV[id] || [])[1]).join(','));
    });
  }
}
