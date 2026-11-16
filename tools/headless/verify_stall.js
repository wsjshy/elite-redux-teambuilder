// v4.389 verify_stall：受队消耗/骚扰消耗/耐久压制 名实一致 + 零伤害卡性格选侧 + 零漂移
// 断言①受队消耗且(bulk<270 或无真回复)=0 ②骚扰消耗/耐久压制却(bulk≥300 且有真回复)=0
//      ③零伤害招防守卡 nat[0] 进攻项=0 ④骚扰消耗且速种≥100 且速EV=0 =0 ⑤未命中卡快照差异=0
const H = require('./harness.js');
const { ERDATA, deriveBuilds, MV } = H;
const by = id => ERDATA.species.find(s => String(s.id) === String(id));
const allTeam = [26, 65, 96, 80, 37, 208].map(by);
const fs = require('fs');
const path = require('path');

// 与引擎 _v389REC_MV / _v389REC_ABI 同源：回血招（不含治疗队友类 215/361/505）与回复特性
const REC_MV = { 105: 1, 202: 1, 234: 1, 235: 1, 236: 1, 303: 1, 355: 1, 409: 1, 156: 1, 456: 1, 532: 1, 631: 1, 72: 1, 71: 1, 837: 1, 73: 1, 135: 1, 208: 1, 275: 1, 392: 1, 622: 1, 744: 1, 915: 1 };
const REC_ABI = { '144': 1, '90': 1 };
const ACC = { '胆小': 1, '爽朗': 1, '天真': 1, '急躁': 1, '开朗': 1 };
// 「进攻项」= 正项加在 物攻/特攻 的性格（+速 类不计入：骚扰消耗靠先手，加速性格是对的）
const OFF_NAT = { '固执': 1, '内敛': 1, '勇敢': 1, '马虎': 1, '顽皮': 1, '冷静': 1 };
const DEF_ROLE = { '肉盾': 1, '受队': 1, '联防': 1, '辅助': 1 };
const DEF_NAME = /受队消耗|骚扰消耗|耐久压制|稳健联防|肉盾|减伤|属性免疫/;
const ids = b => (b.mv.main || []).concat(b.mv.func || []).map(x => +x.id);
const dmgOf = b => ids(b).filter(id => { const r = MV[id]; return r && r[4] !== '变化'; }).length;
const nat0 = b => { const n = b.nat; if (Array.isArray(n)) return n[0] ? String(n[0][0] || '') : ''; return String(n || '').split(',')[0].trim(); };
const bulkOf = s => (+s.base[0]) + (+s.base[2]) + (+s.base[4]);

const SNAP = JSON.parse(fs.readFileSync(path.join(__dirname, '_v4389_base_snapshot.json'), 'utf8'));
const snapKeys = (tag) => {
  const seen = {}, r1 = {}, r2 = {}, r3 = {};
  (SNAP[tag].builds[Object.keys(SNAP[tag].builds)[0]] || []).forEach(() => {});
  Object.keys(SNAP[tag].builds).forEach(sid => {
    SNAP[tag].builds[sid].forEach(e => {
      const k = e.id + '#' + e.idx;
      seen[k] = e;
      if (e.origStall) r1[k] = 1;
    });
  });
  (SNAP[tag].r2 || []).forEach(e => { r2[e.id + '#' + e.idx] = e.target || 1; });
  (SNAP[tag].r3 || []).forEach(e => { r3[e.id + '#' + e.idx] = e.target || 1; });
  return { seen, r1, r2, r3 };
};

let fail = 0;
function scan(team, tag) {
  const SK = snapKeys(tag);
  let stall = 0, harass = 0, tank = 0, r2hit = 0, r3hit = 0, other = 0;
  const b1 = [], b2 = [], b3 = [], b4 = [], b5 = [];
  ERDATA.species.forEach(s => {
    let bs; try { bs = deriveBuilds(s, team); } catch (e) { return; }
    bs.forEach((b, idx) => {
      const nm = String(b.name || '');
      const kit = ids(b);
      const dmg = dmgOf(b);
      const bulk = bulkOf(s);
      const spd = +s.base[5];
      const abiIds = (b.abi || []).map(a => +a.id);
      const rec = kit.some(id => REC_MV[id]) || abiIds.some(id => REC_ABI[String(id)]);
      const al = (b.ev && b.ev.alloc) || [];
      const isStall = nm.indexOf('受队消耗') >= 0, isH = nm.indexOf('骚扰消耗') >= 0, isT = nm.indexOf('耐久压制') >= 0;
      if (isStall) {
        stall++;
        if (!(bulk >= 300 || (bulk >= 270 && rec))) b1.push(`${tag} #${s.id} ${s.zh} ${nm} bulk=${bulk} rec=${rec} dmg=${dmg}`);
      }
      if (isH || isT) {
        if (isH) harass++; else tank++;
        if (bulk >= 300 && rec) b2.push(`${tag} #${s.id} ${s.zh} ${nm} bulk=${bulk}`);
      }
      // ③ 零伤害招防守卡 nat[0] 进攻项
      if (dmg === 0 && (DEF_ROLE[String(b.roleTag || '')] || DEF_NAME.test(nm))) {
        const n0 = nat0(b);
        if (OFF_NAT[n0]) b3.push(`${tag} #${s.id} ${s.zh} ${nm} nat0=${n0} alloc=${JSON.stringify(al)}`);
      }
      // ④ 骚扰消耗快卡 0 速
      if (isH && spd >= 100) {
        if ((+al[5] || 0) === 0) b4.push(`${tag} #${s.id} ${s.zh} ${nm} spd=${spd} alloc=${JSON.stringify(al)}`);
        else r2hit++;
      }
      if (dmg === 0 && (DEF_ROLE[String(b.roleTag || '')] || DEF_NAME.test(nm)) && !OFF_NAT[nat0(b)]) r3hit++;
      // ⑤ 零漂移：未命中（非 r1/r2/r3）的卡 name/alloc/nat 必须与快照一致
      const k = String(s.id) + '#' + idx;
      const e = SK.seen[k];
      if (!e) { other++; return; }
      if (SK.r1[k] || SK.r2[k] || SK.r3[k]) return;
      other++;
      const diffName = (String(e.name) !== nm);
      const diffEv = JSON.stringify(e.alloc) !== JSON.stringify(al);
      const diffNat = JSON.stringify(e.nat) !== JSON.stringify((b.nat || []).map(x => Array.isArray(x) ? String(x[0]) : String(x)));
      if (diffName || diffEv || diffNat) b5.push(`${tag} #${s.id} ${s.zh}[${idx}] name:${e.name}→${nm} ev:${JSON.stringify(e.alloc)}→${JSON.stringify(al)} nat:${JSON.stringify(e.nat)}→${JSON.stringify((b.nat || []).map(x => Array.isArray(x) ? String(x[0]) : String(x)))}`);
    });
  });
  console.log(`\n=== ${tag} ===`);
  console.log(` 受队消耗 ${stall} | 骚扰消耗 ${harass} | 耐久压制 ${tank} | 未命中卡 ${other}`);
  console.log(' ① 受队消耗但(bulk<270 或无真回复):', b1.length === 0 ? '0 ✓' : b1.length + ' ✗');
  console.log(' ② 骚扰消耗/耐久压制却(bulk≥300 且有真回复):', b2.length === 0 ? '0 ✓' : b2.length + ' ✗');
  console.log(' ③ 零伤害招防守卡 nat[0] 进攻项:', b3.length === 0 ? '0 ✓' : b3.length + ' ✗');
  console.log(' ④ 骚扰消耗且速种≥100 且速EV=0:', b4.length === 0 ? '0 ✓' : b4.length + ' ✗', `（已加满速度 ${r2hit}）`);
  console.log(' ⑤ 未命中卡快照差异:', b5.length === 0 ? '0 ✓' : b5.length + ' ✗');
  [b1, b2, b3, b4, b5].forEach(arr => arr.slice(0, 6).forEach(x => console.log('   ✗', x)));
  fail += b1.length + b2.length + b3.length + b4.length + b5.length;
}

scan([], 'empty');
scan(allTeam, 'six');

// 个案专核
const dump = id => {
  const s = by(id);
  const bs = deriveBuilds(s, allTeam);
  console.log(`\n#${id} ${s.zh} 六人队：`);
  bs.forEach((b, i) => console.log(`  [${i}] ${b.name} | nat0=${nat0(b)} | ev=${JSON.stringify(b.ev && b.ev.alloc)} | ${(b.mv.main || []).map(x => (MV[x.id] ? MV[x.id][1] : x.id)).join('/')} | 道具 ${(b.it && b.it[0] && b.it[0][0]) || '—'}`));
};
[1509, 94, 65].forEach(dump);

console.log('\n断言合计失败', fail);
process.exit(fail === 0 ? 0 : 1);
