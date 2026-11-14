// 探针：玻璃大炮（高速+低耐久+进攻）是否携带被动团队辅助钉子
const H = require('./harness.js');
const { ERDATA, deriveBuilds, MV } = H;

const HAZARD = [191, 390, 446, 564]; // 撒菱/毒菱/隐形岩/黏黏网
const BULK_MID = 270, SPEED_HIGH = 100;

function bst(s, i) { return s.base[i] || 0; }
function bulk(s) { return bst(s, 0) + bst(s, 2) + bst(s, 4); }
function isGlass(s) {
  const fast = bst(s, 5) >= SPEED_HIGH;
  const fragile = bulk(s) < BULK_MID;
  return fast && fragile;
}

const hits = [];
let totalGlass = 0;
ERDATA.species.forEach(function (s) {
  if (!isGlass(s)) return;
  totalGlass++;
  let bs;
  try { bs = deriveBuilds(s, []); } catch (e) { return; }
  bs.forEach(function (b) {
    const off = (b.roleTag === '输出' || b.roleTag === '强化');
    if (!off) return;
    const ids = (b.mv.main || []).map(function (x) { return x.id; });
    const haz = ids.filter(function (id) { return HAZARD.indexOf(id) > -1; });
    if (haz.length) {
      hits.push({
        id: s.id, zh: s.zh, name: b.name, role: b.roleTag,
        bulk: bulk(s), spe: bst(s, 5),
        haz: haz.map(function (id) { return MV[id][1]; }),
        moves: ids.map(function (id) { return MV[id] ? MV[id][1] : id; })
      });
    }
  });
});

console.log('玻璃大炮物种数:', totalGlass);
console.log('带钉子的玻璃大炮流派数:', hits.length);
hits.forEach(function (h) {
  console.log('#' + h.id, h.zh, '| bulk' + h.bulk, '速' + h.spe, '|', h.name,
    '| 钉子:', h.haz.join(','), '| 全招:', h.moves.join('/'));
});
