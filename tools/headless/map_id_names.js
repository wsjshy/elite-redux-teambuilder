// 从物种数据反查 12 个能力 id 实际使用的所有中文名（平行 abis/abiIds、inns/innIds）
const H = require('./harness.js');
const { ERDATA } = H;
const ids = [371, 390, 470, 472, 601, 751, 845, 645, 449, 941, 931, 985];
const idToNames = {};
ids.forEach(function (id) { idToNames[id] = {}; });

ERDATA.species.forEach(function (s) {
  function pair(names, pids) {
    if (!names || !pids) return;
    names.forEach(function (nm, i) {
      const pid = Number(pids[i]);
      if (pid in idToNames) idToNames[pid][nm] = true;
    });
  }
  pair(s.abis, s.abiIds);
  pair(s.inns, s.innIds);
});

// 能力表规范名
const abById = {};
ERDATA.abilities.forEach(function (a) { abById[Number(a[0])] = a; });

ids.forEach(function (id) {
  const used = Object.keys(idToNames[id]);
  const canon = abById[id] ? abById[id][2] : '?';
  console.log('id=' + id, '规范名="' + canon + '" 实际物种用名:', JSON.stringify(used));
});
