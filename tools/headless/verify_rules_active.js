// 验证新 MV_FLAG 键与 famAbiRuleOf 规则确实生效
const H = require('./harness.js');
const { ERDATA, deriveBuilds, MV_FLAG, pickAttacks } = H;

console.log('MV_FLAG 键数:', Object.keys(MV_FLAG).length, '| 新键:',
  ['arrow', 'horn', 'air', 'hammer', 'throwing', 'drill', 'light'].filter(function (k) { return k in MV_FLAG; }).join(','));

// 通过全局 famAbiRuleOf（在 harness 里被导出了吗？）；直接 require 后用 eval 拿不到，改用 ERDATA 找物种实测
const abById = {};
ERDATA.abilities.forEach(function (a) { abById[Number(a[0])] = a; });

// 找一个带「大角」(390) 的物种，看其流派 abi why 是否出现族群增伤
function speciesWith(abiId) {
  for (const s of ERDATA.species) {
    if ((s.abiIds || []).map(Number).indexOf(abiId) >= 0) return s;
  }
  return null;
}

[390, 472, 470, 371].forEach(function (aid) {
  const s = speciesWith(aid);
  if (!s) { console.log('未找到带', aid, '的物种'); return; }
  const bs = deriveBuilds(s, []);
  const ab = abById[aid];
  console.log('\n== 特性', ab[2], '(' + ab[1] + ') 示例物种 #' + s.id, s.zh, '流派数', bs.length);
  bs.forEach(function (b) {
    const hit = (b.abi || []).filter(function (x) { return x.n === ab[2]; });
    hit.forEach(function (x) {
      console.log('  流派「' + b.name + '」sc=' + x.sc);
      (x.why || []).forEach(function (w) { if (/招 ×|族群|不触发/.test(w)) console.log('    why:', w); });
    });
  });
});
