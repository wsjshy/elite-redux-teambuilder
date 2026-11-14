// 交叉核验：用 harness 的 MV 表核对提取出的招族 id（英文名/类别/威力），确认映射正确
const fs = require('fs');
const H = require('./harness.js');
const { MV } = H;
const fam = JSON.parse(fs.readFileSync(__dirname + '/mv_fam_extract.json', 'utf8'));

Object.keys(fam).forEach(function (k) {
  console.log('==== ' + k + ' (' + fam[k].length + ') ====');
  const problems = [];
  fam[k].forEach(function (id) {
    const r = MV[id];
    if (!r) { problems.push('#' + id + ' 不存在'); return; }
    const cat = r[4], pow = r[5];
    const tag = (cat === '物理' || cat === '特殊') ? ('w' + pow) : '变化';
    console.log('#' + id, r[2], '[' + r[3] + '/' + cat + ' ' + tag + ']');
  });
  if (problems.length) console.log('问题:', problems.join('; '));
});
