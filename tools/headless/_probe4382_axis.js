// 只读基数登记（v4.381 不改引擎）：为 v4.382 速度轴 self-centric 收口摸底。
// 空队 deriveBuilds(s,[])：teamArr 为空，fastCount/slowCount 仅计自身；队友计数轴需带队探针，
// 此处先登记空队下各类速度轴流派条数与自身速度分布，行号锚点见 out 文件备注。
const fs = require('fs');
const path = require('path');
const H = require('./harness.js');
const { ERDATA, deriveBuilds } = H;

const spd = s => +s.base[5] || 0;
const bins = { speedPush: [], speedBoost: [], slowBoom: [], spaceSweep: [] };
for (const s of ERDATA.species) {
  let builds; try { builds = deriveBuilds(s, []); } catch (e) { continue; }
  for (const b of builds) {
    const n = String(b.name || '');
    if (/^速攻压制/.test(n)) bins.speedPush.push({ id: s.id, zh: s.zh, spd: spd(s), name: n });
    else if (/^速攻强化清场/.test(n)) bins.speedBoost.push({ id: s.id, zh: s.zh, spd: spd(s), name: n });
    else if (/^慢速重炮/.test(n)) bins.slowBoom.push({ id: s.id, zh: s.zh, spd: spd(s), name: n });
    else if (/空间速攻/.test(n)) bins.spaceSweep.push({ id: s.id, zh: s.zh, spd: spd(s), name: n });
  }
}
const low = a => a.filter(x => x.spd < 100).length;
const over = a => a.filter(x => x.spd > 60).length;
const out = [];
const log = (...x) => out.push(x.join(' '));
log('');
log('=== 附：v4.382 速度轴只读基数（空队 harness，未改引擎；锚点 index.html 16084/16087/16097/16103） ===');
log('fastCount/slowCount 初值=自身 fast/slow，再累加队友 qs（16087）；speed 门 fastCount>=2（16097）、tr 门 slowCount>=2 && trSetter（16103）。');
log('空队下队友计数=0，故队友互投缺陷需带队探针复现；以下为自身速度分布基线。');
log('速攻压制（前缀）:', bins.speedPush.length, '其中自身速<100:', low(bins.speedPush));
log('速攻强化清场（前缀）:', bins.speedBoost.length, '其中自身速<100:', low(bins.speedBoost));
log('慢速重炮（前缀）:', bins.slowBoom.length, '其中自身速>60:', over(bins.slowBoom));
log('空间速攻（名含）:', bins.spaceSweep.length);
[['speedPush', bins.speedPush], ['speedBoost', bins.speedBoost], ['slowBoom', bins.slowBoom], ['spaceSweep', bins.spaceSweep]].forEach(([k, a]) => {
  const sus = a.filter(x => (k === 'slowBoom' ? x.spd > 60 : x.spd < 100));
  if (sus.length) { log(`  可疑(${k}):`); sus.forEach(x => log(`    #${x.id} ${x.zh} spd=${x.spd} ${x.name}`)); }
});
log('台账：本版（v4.381）不动 _deriveBuildsCore 速度轴；队友计数轴基数待 v4.382 带队探针补齐。');

const outPath = path.join(__dirname, 'out_v4381_probe.txt');
let prev = fs.readFileSync(outPath, 'utf-8').replace(/\r?\n$/, '');
fs.writeFileSync(outPath, prev + '\r\n' + out.join('\r\n'), 'utf-8');
console.log(out.join('\n'));
