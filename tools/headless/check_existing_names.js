// 核对现有 4 个 case 的能力 id 与物种实际用名，确认命名口径
const H = require('./harness.js');
const { ERDATA } = H;
const ids = [104, 164, 151, 189];
const names = { 104: '铁拳', 164: '强壮之颚', 151: '超级发射器', 189: '硬爪' };
const idToNames = {};
ids.forEach(function (id) { idToNames[id] = {}; });
ERDATA.species.forEach(function (s) {
  function pair(nms, pids) {
    if (!nms || !pids) return;
    nms.forEach(function (nm, i) {
      const pid = Number(pids[i]);
      if (pid in idToNames) idToNames[pid][nm] = true;
    });
  }
  pair(s.abis, s.abiIds);
  pair(s.inns, s.innIds);
});
ids.forEach(function (id) {
  const ab = ERDATA.abilities.filter(function (a) { return Number(a[0]) === id; })[0];
  console.log('id=' + id, 'case用名="' + names[id] + '" 能力表="' + (ab ? ab[2] : '?') + '" 物种实际用名:', JSON.stringify(Object.keys(idToNames[id])));
});
