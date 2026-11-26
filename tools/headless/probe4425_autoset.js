// 列出 ER 中所有「出场/入场自动设置场地」的特性（按描述正则），作为统一门控的豁免真源
const H = require('./harness.js');
const { ERDATA } = H;
const re = /(出场|入场|上场).{0,12}(顺风|戏法空间|光墙|反射壁|极光幕|求雨|大晴天|沙暴|冰雹|青草场地|薄雾场地|电气场地|精神场地)/;
const rows = [];
for (const id of Object.keys(ERDATA.abilities)) {
  const a = ERDATA.abilities[id];
  if (!a) continue;
  const name = String(a[2] || a[1] || ''), desc = String(a[3] || '');
  if (re.test(desc)) rows.push({ id, name, desc: desc.slice(0, 90) });
}
rows.forEach(r => console.log(`${r.id}\t${r.name}\t${r.desc}`));
console.log('--- 自动设置特性总数:', rows.length);
// 各有多少物种持有（含天性池）
const byName = {};
rows.forEach(r => { byName[r.name] = 0; });
for (const s of ERDATA.species) {
  const all = (s.abis || []).concat(s.inns || []);
  Object.keys(byName).forEach(n => { if (all.indexOf(n) > -1) byName[n]++; });
}
console.log('--- 持有物种数:');
Object.keys(byName).forEach(n => console.log(`${n}: ${byName[n]}`));
