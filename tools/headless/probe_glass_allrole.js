// 扩展探针：玻璃大炮物种的【任意角色】流派是否仍带钉子
const H = require('./harness.js');
const { ERDATA, deriveBuilds, MV } = H;
const HAZARD = [191, 390, 446, 564];
function bst(s, i) { return s.base[i] || 0; }
function bulk(s) { return bst(s, 0) + bst(s, 2) + bst(s, 4); }
function isGlass(s) { return bst(s, 5) >= 100 && bulk(s) < 270; }

const hits = [];
ERDATA.species.forEach(function (s) {
  if (!isGlass(s)) return;
  let bs; try { bs = deriveBuilds(s, []); } catch (e) { return; }
  bs.forEach(function (b) {
    const ids = (b.mv.main || []).map(x => x.id);
    const haz = ids.filter(id => HAZARD.indexOf(id) > -1);
    if (haz.length) hits.push({ id: s.id, zh: s.zh, name: b.name, role: b.roleTag, mech: !!b.mechRw, haz: haz.map(id => MV[id][1]) });
  });
});
console.log('玻璃大炮物种仍带钉子的【任意角色】流派数:', hits.length);
const byRole = {};
hits.forEach(h => { byRole[h.role] = (byRole[h.role] || 0) + 1; });
console.log('按角色分布:', JSON.stringify(byRole));
hits.slice(0, 50).forEach(h => console.log('#' + h.id, h.zh, '|', h.name, '| role', h.role, '| mech', h.mech, '|', h.haz.join(',')));
