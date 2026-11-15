// v4.383 验证探针：减伤轴 self-centric（卡片级 abi[0]）+ 强化减伤轴双条件 + 轮转必须真有游击招。
// 三断言：①名含「减伤轴」但该卡 abi[0] 非 RED = 0；②名含「强化减伤轴」但 abi[0] 非 RED 或缺强化招 = 0；
//        ③名含「轮转」但 4 招无 369/521 = 0。
// 口径：空队（gate.js 口径）+ 六人队 allTeam，跨队按 物种id+流派名 去重；判定只走特性 id，不看物种可选池。
const H = require('./harness.js');
const { ERDATA, deriveBuilds, _v383Abi0, _v383RedAbi, FUNC_MV } = H;
const by = id => ERDATA.species.find(s => String(s.id) === String(id));
const allTeam = [by(26), by(65), by(96), by(80), by(37), by(208)];
const BOOST = (FUNC_MV ? FUNC_MV.boost : [14,187,334,339,347,349,417,468,483]).concat([504,526]);
const PIVOT = [369,521];

const A = [], B = [], C = [];
const seen = new Set();

function scan(team) {
  for (const s of ERDATA.species) {
    let bs; try { bs = deriveBuilds(s, team); } catch (e) { continue; }
    for (const b of bs) {
      const n = String(b.name || '');
      const ids = (b.mv.main || []).map(x => +x.id).concat((b.mv.func || []).map(x => +x.id));
      const a0 = _v383Abi0(b);
      const red = _v383RedAbi(a0);
      const boost = ids.some(id => BOOST.indexOf(id) >= 0);
      const piv = PIVOT.some(id => ids.indexOf(id) >= 0);
      const k = s.id + '|' + n;
      if (seen.has(k)) continue; seen.add(k);
      if (n.indexOf('减伤轴') >= 0 && !red)
        A.push({ id: s.id, zh: s.zh, name: n, abi: a0, ids });
      if (n.indexOf('强化减伤轴') >= 0 && (!red || !boost))
        B.push({ id: s.id, zh: s.zh, name: n, abi: a0, boost, ids });
      if (n.indexOf('轮转') >= 0 && !piv)
        C.push({ id: s.id, zh: s.zh, name: n, ids });
    }
  }
}
scan([]); scan(allTeam);

console.log('=== v4.383 减伤/轮转验证（卡片级 abi[0]，空队 + 六人队，跨队去重）===');
console.log('① 名含减伤轴 但 abi[0] 非 RED:', A.length, A.length === 0 ? 'PASS' : 'FAIL');
A.forEach(r => console.log('   FAIL #' + r.id, r.zh, r.name, 'abi=' + JSON.stringify(r.abi), JSON.stringify(r.ids)));
console.log('② 强化减伤轴 缺减伤或缺强化招:', B.length, B.length === 0 ? 'PASS' : 'FAIL');
B.forEach(r => console.log('   FAIL #' + r.id, r.zh, r.name, 'abi=' + JSON.stringify(r.abi), 'boost=' + r.boost, JSON.stringify(r.ids)));
console.log('③ 名含轮转 但无 369/521:', C.length, C.length === 0 ? 'PASS' : 'FAIL');
C.forEach(r => console.log('   FAIL #' + r.id, r.zh, r.name, JSON.stringify(r.ids)));

const fail = A.length + B.length + C.length;
console.log('\n=== 断言结果:', fail === 0 ? 'ALL PASS' : fail + ' 项 FAIL', '===');
process.exit(fail === 0 ? 0 : 1);
