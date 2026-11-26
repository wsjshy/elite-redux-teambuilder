const H = require('./harness.js');
const { ABI } = H;
// 找冰冻皮肤、干燥皮肤的 id
['冰冻皮肤', '干燥皮肤', '降雪', '雪怒', '圣代', '北极光', '极北之风', '熔核'].forEach(n => {
  let id = null;
  for (const k in ABI) { if (ABI[k][2] === n || ABI[k][1] === n) { id = k; break; } }
  console.log(n, '-> id', id, id ? ABI[id] : '');
});
console.log('\n雪id集内容:');
[117, 666, 929, 291, 348, 870, 493].forEach(id => console.log(id, ABI[id] && ABI[id][2], ABI[id] && ABI[id][1]));
