const H = require('./harness.js');
const { ERDATA, deriveBuilds, learnOf, MV } = H;
ERDATA.species.forEach(function (s) {
  const learn = learnOf(s) || [];
  let bs; try { bs = deriveBuilds(s, []); } catch (e) { return; }
  bs.forEach(function (b) {
    (b.mv.main || []).forEach(function (sl) {
      if (learn.indexOf(sl.id) < 0) {
        console.log('#' + s.id, s.zh, '|', b.name, '| 不可学招 id', sl.id, MV[sl.id] ? MV[sl.id][1] : '');
      }
    });
  });
});
