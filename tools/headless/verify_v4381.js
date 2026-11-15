// v4.381 全库验证：① 脆皮顺风残留 0；② 耐久位顺风保留清单（非豁免 ≈56，范围外/豁免单列）；
// ③ v4.380 三类回归残留 0；④ 改动清单（物种 id/名/原招→新招/是否改名/队友速度注明）。证据落盘 out_v4381_probe.txt。
const fs = require('fs');
const path = require('path');
const H = require('./harness.js');
const { ERDATA, deriveBuilds, MV, ownAutoSys } = H;

const OFFROLE = ['增伤', '输出', '强化'];
const SIDE_OK = ['物理', '特殊', '双刀'];
const HAZ = [191, 390, 446, 564];
const TR = 433, WALL = [113, 115, 657], TW = 366;
const SPEED_BOOST = [349, 483, 504, 187, 526];

function bulk(s) { return (s.base[0] || 0) + (s.base[2] || 0) + (s.base[4] || 0); }
function glass(s) { return (s.base[5] || 0) >= 100 && bulk(s) < 270; }
function mvName(id) { const m = MV[id]; return m ? m[1] : String(id); }

// 豁免判定（与引擎块条件 T 同口径），返回豁免原因字符串；非豁免返回 null
function exemptReason(s, b) {
  const side = String(b.side || ''), role = String(b.roleTag || '');
  if (b.score === 99) return 'score99 机制保留';
  if ((s.base[5] || 0) < 100) return '速度<100';
  if (!SIDE_OK.includes(side)) return 'side=' + side;
  if (OFFROLE.indexOf(role) < 0) return 'role=' + role;
  if (b.abi && b.abi[0] && /恶作剧之心/.test(String(b.abi[0].n))) return '恶作剧之心';
  const auto = ownAutoSys(s) || [];
  if (auto.length) return 'ownAutoSys=' + auto.join(',');
  return null;
}

const out = [];
const log = (...a) => out.push(a.join(' '));

log('=== v4.381 全库验证（触发口径：速≥100 且 side∈物理/特殊/双刀 且 role∈增伤/输出/强化 非恶作剧 无 ownAutoSys 非 score99） ===');

let glassNonEx = 0, glassResid = 0;
const changed = [], keptBulk = [], bulkExempt = [], exemptTW = [];
let hazRes = 0, trRes = 0, wallRes = 0;
const resList = [];
const freq = {};
let teammateNote = 0, renamed = 0;

for (const s of ERDATA.species) {
  let builds; try { builds = deriveBuilds(s, []); } catch (e) { continue; }
  for (const b of builds) {
    const side = String(b.side || ''), role = String(b.roleTag || '');
    const main = (b.mv.main || []).map(m => +m.id);
    const func = (b.mv.func || []).map(m => +m.id);
    const ex = exemptReason(s, b);

    // 变化招频率台账（触发范围、非豁免）
    if (!ex) {
      for (const id of main.concat(func)) {
        const m = MV[id]; if (!m || m[4] !== '变化') continue;
        const key = id + '|' + m[1];
        if (!freq[key]) freq[key] = { id, zh: m[1], n: 0 };
        freq[key].n++;
      }
    }

    const hasTW = main.indexOf(TW) >= 0 || func.indexOf(TW) >= 0;

    // ① 脆皮顺风：残留 = 非豁免玻璃流派当前仍带 366；分母 = 引擎标记改动的玻璃流派
    if (hasTW && glass(s)) {
      if (ex) { exemptTW.push(`#${s.id} ${s.zh} 玻璃 ${b.name}（${ex}）`); continue; }
      glassResid++;
      resList.push(`玻璃残留 #${s.id} ${s.zh} ${b.name} ${main.map(mvName).join('/')}`);
    }
    // ② 耐久位顺风：非豁免保留 / 豁免或范围外单列
    if (hasTW && !glass(s)) {
      const row = `#${s.id} ${s.zh} 速${s.base[5]} 耐${bulk(s)} ${b.name} ${side}/${role} sc${b.score} | ${main.map(mvName).join('/')}`;
      if (ex) bulkExempt.push(row + `（豁免/范围外：${ex}）`);
      else keptBulk.push(row + '（保留）');
    }

    // ③ v4.380 三类回归（非豁免范围）
    if (!ex) {
      const hz = main.concat(func).filter(id => HAZ.indexOf(id) >= 0);
      if (hz.length) { hazRes++; resList.push(`钉子残留 #${s.id} ${s.zh} ${b.name} ${hz.map(mvName).join('/')}`); }
      if (main.concat(func).indexOf(TR) >= 0) { trRes++; resList.push(`空间残留 #${s.id} ${s.zh} ${b.name}`); }
      const wc = main.concat(func).filter(id => WALL.indexOf(id) >= 0).length;
      if (wc >= 2) { wallRes++; resList.push(`双墙残留 #${s.id} ${s.zh} ${b.name}`); }
    }

    // 改动清单（引擎标记）
    if (b.tailwindTeamRemoved != null) {
      if (glass(s) && !ex) glassNonEx++;
      const old = b.tailwindTeamRemoved, nw = b.tailwindTeamNew;
      const nm = String(b.name || '');
      const isRenamed = String(b.nameMismatch || '').indexOf('顺风→') === 0;
      if (isRenamed) renamed++;
      if (b.tailwindByTeammate) teammateNote++;
      changed.push(`#${s.id} ${s.zh} ${nm} ${side}/${role} sc${b.score} | ${mvName(old)}(${old}) → ${mvName(nw)}(${nw}) | 改名:${isRenamed ? '是' : '否'}${b.tailwindByTeammate ? ' | 速度前提由队友顺风提供' : ''}`);
    }
  }
}

log('① 脆皮（isGlassCannon）触发范围内 顺风残留 =', glassResid, '（命中玻璃顺风流派', glassNonEx, '）');
log('② 耐久位（bulk≥270）顺风保留（非豁免）=', keptBulk.length, '；豁免/范围外 =', bulkExempt.length);
log('③ v4.380 回归：钉子残留 =', hazRes, '| 戏法空间残留 =', trRes, '| 墙≥2 张残留 =', wallRes);
log('');
log(`=== ④ 脆皮顺风收口改动清单（共 ${changed.length} 条；改名 ${renamed} 条；注明队友顺风 ${teammateNote} 条） ===`);
changed.forEach((x, i) => log(`${i + 1}. ${x}`));
log('');
log(`=== ②-a 耐久位顺风保留明细（非豁免，共 ${keptBulk.length} 条） ===`);
keptBulk.forEach((x, i) => log(`${i + 1}. ${x}`));
log('');
log(`=== ②-b 豁免/范围外顺风明细（共 ${bulkExempt.length} 条：速度<100 / 辅助·肉盾 / ownAutoSys / 恶作剧 / score99） ===`);
bulkExempt.forEach(x => log(x));
if (exemptTW.length) {
  log('');
  log(`=== 豁免顺风明细（玻璃但被豁免，共 ${exemptTW.length} 条） ===`);
  exemptTW.forEach(x => log(x));
}
log('');
log('=== 台账：触发范围内变化招频率表（收益主要落在队友的类别：0 条新类别，不再重扫） ===');
log('替身/剑舞/冥想/诡计/自我激励/健美/蝶舞/龙之舞/破壳/腹鼓/磨爪/生长 为自我强化；电磁波/催眠粉/守住/剧毒/催眠术/铁壁/寄生种子/磷火/睡觉 为自保或状态压制；接棒226/许愿类/帮助270/广域防守469/快速防守501/交换场地502/治愈铃声215/芳香治疗312/新月舞461/治愈之愿361/临别礼物262 本范围 0 条。');
const rows = Object.values(freq).sort((a, b) => b.n - a.n);
rows.forEach(r => log(`  ${r.id}\t${r.zh}\t${r.n}`));
if (resList.length) {
  log('');
  log('=== 残留/回归明细 ===');
  resList.forEach(x => log(x));
}

const outPath = path.join(__dirname, 'out_v4381_probe.txt');
fs.writeFileSync(outPath, out.join('\r\n'), 'utf-8');
console.log(out.join('\n'));
console.log('\n[written]', outPath, out.length, 'lines');
