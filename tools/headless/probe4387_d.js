// v4.387 D：睡觉 156 新判据全库分档（只读）。
// 允许 = bulk≥300，或（bulk≥270 且 min(Def,SpD)≥90 且无 4 倍弱点）。独立招位判据，不与披带/顺风分档混用。
const H = require('./harness.js');
const fs = require('fs'), path = require('path');
const { ERDATA, deriveBuilds, learnOf, MV, bulkOf } = H;
const dir = __dirname;
const by = id => ERDATA.species.find(s => String(s.id) === String(id));
const allTeam = [26, 65, 96, 80, 37, 208].map(by);

const SLEEP = 156;
const REC_STRICT = {
  105:'自我再生', 234:'晨光', 235:'光合作用', 236:'月光', 355:'羽栖', 303:'偷懒', 135:'生蛋', 208:'喝牛奶',
  631:'吸取力量', 275:'扎根', 392:'水流环', 622:'集沙', 744:'丛林治疗', 915:'新月祈祷',
  202:'终极吸取', 409:'吸取拳', 532:'木角', 72:'超级吸取', 71:'吸取', 837:'智力汲取', 73:'寄生种子'
};
const TYPES = ERDATA.types || [];
const matchup = ERDATA.matchup || {};
const typeId = nm => TYPES.indexOf(nm);

const alloc = b => (b.ev && b.ev.alloc) || [0,0,0,0,0,0];
const natStr = b => Array.isArray(b.nat) ? b.nat.map(p=>(p||[]).join(',')).join(',') : String(b.nat||'');
const mvIds = b => (b.mv.main||[]).concat(b.mv.func||[]).map(x=>+x.id);
const mvZh = id => MV[id] ? (MV[id][1]||MV[id][2]||String(id)) : String(id);

function dec(v) { return v === 0 ? 0 : (v === 0.5 || v === 3 ? 0.5 : (v === 2 ? 2 : 1)); }
function fourWeak(s) {
  const defIds = [...new Set([s.t1, s.t2].filter(t => t && t !== '-').map(typeId).filter(x => x >= 0))];
  const res = [];
  for (let a = 0; a < TYPES.length; a++) {
    let eff = 1;
    for (const d of defIds) { const row = matchup[d]; eff *= dec(row && row[a] != null ? row[a] : 1); }
    if (eff === 4) res.push(TYPES[a]);
  }
  return res;
}

function judge(s) {
  const base = s.base || [0,0,0,0,0,0];
  const bulk = base[0] + base[2] + base[4];
  const def = base[2], spd = base[4];
  const fw = fourWeak(s);
  const allow = bulk >= 300 || (bulk >= 270 && Math.min(def, spd) >= 90 && fw.length === 0);
  return { bulk, def, spd, fourx: fw, allow };
}

function scan(team, tag) {
  const rows = [];
  ERDATA.species.forEach(s => {
    let bs; try { bs = deriveBuilds(s, team); } catch(e) { return; }
    bs.forEach((b, i) => {
      const ids = mvIds(b);
      if (!ids.includes(SLEEP)) return;
      const j = judge(s);
      const rec = (learnOf(s) || []).filter(id => REC_STRICT[id]);
      rows.push({
        tag, id: String(s.id), zh: s.zh, types: [s.t1, s.t2], idx: i,
        name: String(b.name||''), side: String(b.side||''), roleTag: String(b.roleTag||''),
        alloc: alloc(b), nat: natStr(b), mv: ids.map(x=>x+':'+mvZh(x)),
        bulk: j.bulk, def: j.def, spd: j.spd, fourx: j.fourx, allow: j.allow,
        recovery: rec.map(id=>id+':'+REC_STRICT[id]), hasRec: rec.length > 0,
      });
    });
  });
  return rows;
}

const emptyRows = scan([], 'empty');
const sixRows = scan(allTeam, 'six');

function split(rows) {
  const allow = rows.filter(r => r.allow);
  const repl = rows.filter(r => !r.allow);
  return {
    total: rows.length, allow: allow.length, replace: repl.length,
    replHasRec: repl.filter(r => r.hasRec).length,
    replNoRec: repl.filter(r => !r.hasRec).length,
    allowHasRec: allow.filter(r => r.hasRec).length,
    allowNoRec: allow.filter(r => !r.hasRec).length,
    replaceRows: repl, allowRows: allow,
  };
}

const res = { empty: split(emptyRows), six: split(sixRows) };

// #1503 专核
const s1503 = by('1503');
let r1503 = null;
if (s1503) {
  const j = judge(s1503);
  let bs; try { bs = deriveBuilds(s1503, []); } catch(e) { bs = []; }
  r1503 = { id: '1503', zh: s1503.zh, types: [s1503.t1, s1503.t2], base: s1503.base, ...j,
    builds: bs.map((b,i)=>({ idx:i, name:String(b.name||''), mv:mvIds(b).map(x=>x+':'+mvZh(x)), hasSleep: mvIds(b).includes(SLEEP) })) };
}
res.r1503 = r1503;

fs.writeFileSync(path.join(dir,'_ev4387_d.json'), JSON.stringify(res, null, 1));

for (const tag of ['empty','six']) {
  const r = res[tag];
  console.log(`[${tag}] 含睡觉 ${r.total} | 允许保留 ${r.allow}（有回复 ${r.allowHasRec}/无 ${r.allowNoRec}）| 须替换 ${r.replace}（有回复 ${r.replHasRec}/无 ${r.replNoRec}）`);
}
console.log('\n须替换样例（empty 前 10）:');
res.empty.replaceRows.slice(0,10).forEach(r => console.log(`  #${r.id} ${r.zh}#${r.idx} ${r.name} | ${r.side}/${r.roleTag} | bulk ${r.bulk} D${r.def}/SpD${r.spd} | 4x ${r.fourx.join('/')||'无'} | 回复 ${r.recovery.join('/')||'无'} | ${r.mv.join(' ')}`));
console.log('\n#1503:', JSON.stringify(r1503, null, 1));
