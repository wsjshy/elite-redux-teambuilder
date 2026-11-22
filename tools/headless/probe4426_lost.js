// 核对失去墙卡的物种：是否仍有其他流派卡（不会出现无卡物种）
const fs = require('fs');
const before = JSON.parse(fs.readFileSync('baseline4426.json'));
const after = JSON.parse(fs.readFileSync('after4426.json'));
const H = require('./harness.js');
const { ERDATA } = H;

let lost = 0, zeroAfter = 0;
const lostList = [];
for (const id of Object.keys(before)) {
  const bHad = (before[id] || []).some(b => b.n === '双墙辅助流');
  const aHas = (after[id] || []).some(b => b.n === '双墙辅助流');
  if (bHad && !aHas) {
    lost++;
    const sp = ERDATA.species.find(s => String(s.id) === String(id));
    const nAfter = (after[id] || []).length;
    if (nAfter === 0) zeroAfter++;
    lostList.push({ id, zh: sp ? sp.zh : '', nAfter, names: (after[id] || []).map(b => b.n) });
  }
}
console.log('失去墙卡物种:', lost, '| 改后零卡物种:', zeroAfter);
console.log('\n明细（前 40）:');
lostList.slice(0, 40).forEach(x => console.log('#' + x.id, x.zh, '| 剩余卡', x.nAfter, '|', x.names.join(',')));
