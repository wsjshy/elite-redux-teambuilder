// v4.388 收口版 只读量化：防守身份卡 nat[0] 指向进攻侧
const fs = require('fs'), path = require('path');
const H = require('./harness.js');
const { ERDATA, deriveBuilds, NATURES } = H;

// 判据：进攻侧 = 首选性格加成项 ∈ {攻击, 特攻, 速度}；防守侧 = 加成 ∈ {防御, 特防}；全平衡单列。
const OFF_PLUS = ['攻击', '特攻', '速度'];
const DEF_ROLES = ['肉盾', '受队', '联防', '辅助'];

function natureOf(nm) { return NATURES[String(nm)] || null; }
function plusOf(nm) { const e = natureOf(nm); return e ? String(e[0] || '').slice(1) : ''; }
function minusOf(nm) { const e = natureOf(nm); return e ? String(e[1] || '').slice(1) : ''; }
function isDefensive(b) {
  return DEF_ROLES.indexOf(b.roleTag) >= 0 || b.side === '辅助';
}
function isOffNature(nm) { return OFF_PLUS.indexOf(plusOf(nm)) >= 0; }

const byId = id => ERDATA.species.find(s => String(s.id) === String(id));
const allTeam = [26, 65, 96, 80, 37, 208].map(byId);

const STAT_NM = ['HP', '攻击', '防御', '特攻', '特防', '速度'];
// 用户点名性格集合（慢吞吞未在 NATURES 表内，近似 冷静 +特攻-速度）
const NAMED = ['固执', '爽朗', '内敛', '胆小', '天真', '马虎'];
function evOf(alloc, stat) { const i = STAT_NM.indexOf(stat); return i >= 0 ? (+alloc[i] || 0) : 0; }

function bucketsOf(h) {
  const alloc = h.alloc || [];
  const namedSet = NAMED.indexOf(h.nat[0]) >= 0;
  const cutDef = OFF_PLUS.indexOf(h.plus) >= 0 && ['防御', '特防'].indexOf(h.minus) >= 0;
  const investsOff = OFF_PLUS.indexOf(h.plus) >= 0 && evOf(alloc, h.plus) > 4;
  const dropsInvestedDef = ['防御', '特防'].indexOf(h.minus) >= 0 && evOf(alloc, h.minus) > 4;
  return { namedSet, cutDef, investsOff, dropsInvestedDef };
}

function scan(team, tag) {
  const hits = [];
  let defTotal = 0;
  ERDATA.species.forEach(s => {
    let bs;
    try { bs = deriveBuilds(s, team) || []; } catch (e) { return; }
    bs.forEach((b, i) => {
      if (!isDefensive(b)) return;
      defTotal++;
      const nat = (b.nat || []).map(n => n[0]);
      const first = nat[0];
      if (first && isOffNature(first)) {
        const rec = {
          id: String(s.id), zh: s.zh, idx: i, name: b.name,
          role: b.roleTag, side: b.side,
          nat: nat, plus: plusOf(first), minus: minusOf(first),
          alloc: (b.ev && b.ev.alloc) || b.ev || []
        };
        Object.assign(rec, bucketsOf(rec));
        hits.push(rec);
      }
    });
  });
  const cnt = f => hits.filter(f).length;
  return {
    tag, defTotal, count: hits.length, hits,
    byBucket: {
      'B1_broad_plus攻特攻速度': hits.length,
      'B2_namedSet_六性格': cnt(h => h.namedSet),
      'B3_offPlus_minus防特防': cnt(h => h.cutDef),
      'B4_plus项EV>4真投资进攻': cnt(h => h.investsOff),
      'B5_minus项EV>4削到已投资防': cnt(h => h.dropsInvestedDef),
      'B4andB5_进攻投资且削防投资': cnt(h => h.investsOff && h.dropsInvestedDef)
    }
  };
}

const six = scan(allTeam, 'six');
const empty = scan([], 'empty');

// 点名三张是否在内
const watch = [
  { id: '66', note: '腕力' },
  { id: '70', note: '口呆花' },
  { id: '1503', note: '超级喷火龙Y [2]' }
];
function watchHit(res, id) { return res.hits.filter(h => h.id === id); }

const lines = [];
lines.push('v4.388 防守身份卡 nat[0] 进攻侧扫描（只读，未改引擎/分片）');
lines.push('判据：防守身份 = role ∈ {肉盾,受队,联防,辅助} 或 side=辅助；进攻侧性格 = 加成项 ∈ {攻击,特攻,速度}。');
lines.push('NATURES 对照表：');
Object.keys(NATURES).forEach(nm => {
  const e = NATURES[nm];
  const cls = OFF_PLUS.indexOf(String(e[0]).slice(1)) >= 0 ? '进攻' : (String(e[0]) === '全平衡' ? '平衡' : '防守');
  lines.push(`  ${nm}: ${e[0]}/${e[1]} [${cls}]`);
});
lines.push('');
[six, empty].forEach(res => {
  lines.push(`=== ${res.tag}：防守身份卡 ${res.defTotal} 张，nat[0] 进攻侧 ${res.count} 张 ===`);
  lines.push('分桶：' + Object.entries(res.byBucket).map(([k, v]) => `${k}=${v}`).join('；'));
  res.hits.forEach(h => {
    lines.push(`#${h.id} ${h.zh}[${h.idx}] ${h.name} | role=${h.role} side=${h.side} | nat=${h.nat.join('/')}（${h.plus}/${h.minus}） | alloc=${JSON.stringify(h.alloc)}`);
  });
  lines.push('');
});
lines.push('=== 点名核对 ===');
watch.forEach(w => {
  lines.push(`#${w.id} ${w.note}：six=${watchHit(six, w.id).length} 条；empty=${watchHit(empty, w.id).length} 条`);
  watchHit(six, w.id).forEach(h => lines.push(`  six: ${h.name} nat=${h.nat.join('/')} alloc=${JSON.stringify(h.alloc)}`));
  watchHit(empty, w.id).forEach(h => lines.push(`  empty: ${h.name} nat=${h.nat.join('/')} alloc=${JSON.stringify(h.alloc)}`));
});

fs.writeFileSync(path.join(__dirname, 'out_v4388_nat.txt'), lines.join('\n'), 'utf8');
fs.writeFileSync(path.join(__dirname, '_ev4388_nat.json'), JSON.stringify({
  criteria: { defRoles: DEF_ROLES, offPlus: OFF_PLUS, note: '进攻侧=加成攻击/特攻/速度；防守侧=加成防御/特防；全平衡不计' },
  natures: NATURES, six, empty, watch
}, null, 1), 'utf8');

console.log(lines.join('\n'));
