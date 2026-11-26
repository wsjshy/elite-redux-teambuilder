const j = require('./_ev4388_nat.json');
const b = j.six.hits.filter(h => h.investsOff);
console.log('B4 six', b.length);
b.slice(0, 15).forEach(h => console.log(`#${h.id} ${h.zh}[${h.idx}] ${h.name} ${h.role}/${h.side} nat=${h.nat.join('/')} alloc=${JSON.stringify(h.alloc)}`));
console.log('--- named six ---');
['66', '70', '1503'].forEach(id => j.six.hits.filter(h => h.id === id).forEach(h =>
  console.log(`#${id} ${h.name} nat=${h.nat.join('/')} alloc=${JSON.stringify(h.alloc)} ${JSON.stringify({ named: h.namedSet, cutDef: h.cutDef, invOff: h.investsOff, dropDef: h.dropsInvestedDef })}`)));
console.log('--- named empty ---');
['66', '70', '1503'].forEach(id => j.empty.hits.filter(h => h.id === id).forEach(h =>
  console.log(`#${id} ${h.name} nat=${h.nat.join('/')} alloc=${JSON.stringify(h.alloc)}`)));
