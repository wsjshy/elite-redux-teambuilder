// 验证：玻璃大炮流派新配招（原名单 + 新名 + 新招），检查是否有空槽/重复
const H = require('./harness.js');
const { ERDATA, deriveBuilds, MV } = H;
const BULK_MID = 270, SPEED_HIGH = 100;
function bst(s, i) { return s.base[i] || 0; }
function bulk(s) { return bst(s, 0) + bst(s, 2) + bst(s, 4); }
function isGlass(s) { return bst(s, 5) >= SPEED_HIGH && bulk(s) < BULK_MID; }

let problems = 0, shown = 0;
ERDATA.species.forEach(function (s) {
  if (!isGlass(s)) return;
  let bs; try { bs = deriveBuilds(s, []); } catch (e) { return; }
  bs.forEach(function (b) {
    if (b.roleTag !== '输出' && b.roleTag !== '强化') return;
    const ids = (b.mv.main || []).map(x => x.id);
    const uniq = new Set(ids);
    const bad = ids.length !== 4 || uniq.size !== ids.length;
    if (bad) problems++;
    if (shown < 40 || bad) {
      console.log('#' + s.id, s.zh, '|', b.name, '|',
        ids.map(id => MV[id] ? MV[id][1] : id).join('/'), bad ? '  <<<问题' : '');
      shown++;
    }
  });
});
console.log('--- 空槽/重复问题数:', problems);
