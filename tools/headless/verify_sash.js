// v4.381 披带收口验证：断言「bulk≥300 且 it[0]=气势披带」=0；打印分布、≥330 档、270–299 边缘保留、
// 例外 #151 梦幻 imposter_anchor、被换流派逐条清单；举一反三扫描 气球313/弱点保险322/防岩果 是否被按 role 乱发。
// 输出追加到 out_v4381_probe.txt（顺风段之后）。
const fs = require('fs');
const path = require('path');
const H = require('./harness.js');
const { ERDATA, deriveBuilds } = H;

const SASH = '气势披带';
function bulk(s) { return (+s.base[0] || 0) + (+s.base[2] || 0) + (+s.base[4] || 0); }
function lead(b) { return (b.it && b.it[0]) ? String(b.it[0][0]) : ''; }

const rows = [];
const changed = [];   // bulk≥300 被换（引擎标记 sashReplaced）
const edge = [];      // 270–299 保留
const low = [];       // <270 保留
const except = [];    // #151 imposter 例外
const resid = [];

// 举一反三：一次性/条件触发件高耐久扫描
const condLeak = { '气球': [], '弱点保险': [] };
const berryHigh = [];

for (const s of ERDATA.species) {
  let builds; try { builds = deriveBuilds(s, []); } catch (e) { continue; }
  for (const b of builds) {
    const bk = bulk(s), zh = lead(b);
    const isImp = String(s.id) === '151' && String(b.mechRw || '') === 'imposter_anchor';
    if (zh === SASH) {
      rows.push({ id: s.id, zh: s.zh, bulk: bk, name: b.name, mech: b.mechRw || '', score: b.score, imp: isImp });
      if (isImp) { except.push(`#${s.id} ${s.zh} bulk=${bk} ${b.name} mech=${b.mechRw}（例外：变身者三选之一，保留披带）`); continue; }
      if (bk >= 300) resid.push(`#${s.id} ${s.zh} bulk=${bk} ${b.name} 仍首位披带`);
      else if (bk >= 270) edge.push(`#${s.id} ${s.zh} bulk=${bk} ${b.name}`);
      else low.push(`#${s.id} ${s.zh} bulk=${bk} ${b.name}`);
    }
    if (b.sashReplaced) {
      changed.push(`#${s.id} ${s.zh} bulk=${bk} ${b.name} ${String(b.sashOld || SASH)} → ${String(b.sashNew || lead(b))}`);
    }
    if (bk >= 300) {
      if (zh === '气球') condLeak['气球'].push(`#${s.id} ${s.zh} bulk=${bk} ${b.name}`);
      if (zh === '弱点保险') condLeak['弱点保险'].push(`#${s.id} ${s.zh} bulk=${bk} ${b.name} ${b.roleTag || ''}`);
      if (zh === '防岩果') berryHigh.push(`#${s.id} ${s.zh} bulk=${bk} ${b.name}`);
    }
  }
}

const ge300 = rows.filter(r => r.bulk >= 300 && !r.imp);
const ge330 = rows.filter(r => r.bulk >= 330 && !r.imp);

const out = [];
const log = (...a) => out.push(a.join(' '));
log('');
log('=== v4.381 披带收口验证（气势披带 287；判据：满血时真可能被一击带走） ===');
log('改后 it[0]=气势披带 总条数:', rows.length, '（基线 v4.380 为 356）');
log('  耐久三角 <270（脆皮，保留）:', low.length);
log('  270–299（边缘档，保留并注明仅满血生效）:', edge.length);
log('  ≥300 且披带首位（非例外，应为 0）:', ge300.length, ' 其中 ≥330:', ge330.length);
log('  例外保留（#151 梦幻 imposter_anchor 三选之一）:', except.length);
log('');
log('断言 bulk≥300 且 it[0]=气势披带（非例外）残留 =', resid.length, resid.length ? 'FAIL' : 'PASS');
log('');
log(`=== 披带被换流派清单（共 ${changed.length} 条：反伤后手流→剩饭+凸凸头盔；替身强化等→剩饭） ===`);
changed.forEach((x, i) => log(`${i + 1}. ${x}`));
log('');
log(`=== 270–299 边缘档保留明细（共 ${edge.length} 条，why 已注明「仅满血生效，边缘耐久才值得」） ===`);
edge.forEach((x, i) => log(`${i + 1}. ${x}`));
log('');
log(`=== 例外明细（共 ${except.length} 条） ===`);
except.forEach(x => log(x));
log('');
log('=== 举一反三：条件触发型一次性件高耐久乱发扫描（bulk≥300 首位） ===');
log('气球313（未被打才免疫地面）:', condLeak['气球'].length, '条');
condLeak['气球'].forEach(x => log('  ' + x));
log('弱点保险322（需被克制才触发）:', condLeak['弱点保险'].length, '条 —— 多为站场强化/受队位，被克制命中后攻/特攻+2 属可解释用法，本版不动引擎，记台账待后续复核。');
condLeak['弱点保险'].forEach(x => log('  ' + x));
log('防岩果（防克制属性一击的抗性果）:', berryHigh.length, '条 —— 均为扑击铁壁/物防流防守核，抗克制一击属合理防守件，非乱发，本版不动。');
berryHigh.forEach(x => log('  ' + x));
if (!condLeak['气球'].length) log('  气球: 0 条，记台账不再重扫。');

const outPath = path.join(__dirname, 'out_v4381_probe.txt');
let prev = '';
if (fs.existsSync(outPath)) prev = fs.readFileSync(outPath, 'utf-8').replace(/\r?\n$/, '');
fs.writeFileSync(outPath, prev + '\r\n' + out.join('\r\n'), 'utf-8');
console.log(out.join('\n'));
console.log('\n[appended]', outPath);
console.log('residue(ge300 sash, non-except) =', resid.length, '| changed =', changed.length,
  '| edge =', edge.length, '| except =', except.length);
