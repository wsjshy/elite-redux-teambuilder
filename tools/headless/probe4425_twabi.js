// 找出 ER 中所有与顺风相关的特性（按描述文本），用于确定自动顺风手段清单
const H = require('./harness.js');
const { ERDATA } = H;
const hits = [];
for (const id of Object.keys(ERDATA.abilities)) {
  const a = ERDATA.abilities[id];
  if (!a) continue;
  const name = String(a[1] || ''), desc = String(a[3] || '');
  if (desc.indexOf('顺风') > -1 || name.indexOf('顺风') > -1)
    hits.push({ id, name, desc: desc.slice(0, 120) });
}
for (const h of hits) console.log(`${h.id}\t${h.name}\t${h.desc}`);
