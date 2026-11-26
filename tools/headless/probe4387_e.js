// v4.387 E：定位 双墙辅助流 ↔ 属性免疫联防位 边界卡（只读）
const H = require('./harness.js');
const fs = require('fs'), path = require('path');
const { ERDATA, deriveBuilds, MV, _v383ImmAbi, abiTagOf } = H;
const dir = __dirname;
const by = id => ERDATA.species.find(s => String(s.id) === String(id));
const allTeam = [26, 65, 96, 80, 37, 208].map(by);

const WALL = { 113: '光墙', 115: '反射壁', 657: '极光幕' };
const TYPES = ERDATA.types || [];
const matchup = ERDATA.matchup || {};
const typeId = nm => TYPES.indexOf(nm);
const mvIds = b => (b.mv.main||[]).concat(b.mv.func||[]).map(x=>+x.id);
const mvZh = id => MV[id] ? (MV[id][1]||MV[id][2]||String(id)) : String(id);

function typeImmune(s) {
  const defIds = [...new Set([s.t1, s.t2].filter(t => t && t !== '-').map(typeId).filter(x => x >= 0))];
  const res = [];
  for (let a = 0; a < TYPES.length; a++) {
    const row = matchup[a]; if (!row) continue;
    for (const d of defIds) if (row[d] === 0) { res.push(TYPES[a]); break; }
  }
  return res;
}

function analyze(s, b) {
  const ids = mvIds(b);
  const walls = ids.filter(id => WALL[id]);
  const abi0 = b.abi && b.abi[0] ? b.abi[0] : null;
  const immAbi = abi0 ? !!_v383ImmAbi(abi0) : false;
  const immType = typeImmune(s);
  return { ids, walls, immAbi, immType, imm: immAbi || immType.length > 0, abi0: abi0 ? String(abi0.n) : '' };
}

function scan(team, tag) {
  const rows = [];
  ERDATA.species.forEach(s => {
    let bs; try { bs = deriveBuilds(s, team); } catch(e) { return; }
    bs.forEach((b, i) => {
      const an = analyze(s, b);
      rows.push({ tag, id: String(s.id), zh: s.zh, types: [s.t1, s.t2], idx: i,
        name: String(b.name||''), side: String(b.side||''), roleTag: String(b.roleTag||''),
        mv: an.ids.map(x=>x+':'+mvZh(x)), walls: an.walls.map(x=>x+':'+WALL[x]),
        immAbi: an.immAbi, immType: an.immType, imm: an.imm, abi0: an.abi0 });
    });
  });
  return rows;
}

const emptyRows = scan([], 'empty');
const sixRows = scan(allTeam, 'six');

function bucket(rows) {
  const wall = rows.filter(r => r.name === '双墙辅助流');
  const imm = rows.filter(r => r.name === '属性免疫联防位');
  const wallAlsoImm = wall.filter(r => r.imm);
  const immAlsoWall = imm.filter(r => r.walls.length > 0);
  return { total: rows.length, wall: wall.length, imm: imm.length, wallAlsoImm, immAlsoWall, wall, imm };
}

const res = { empty: bucket(emptyRows), six: bucket(sixRows) };
fs.writeFileSync(path.join(dir,'_ev4387_e.json'), JSON.stringify(res, null, 1));

for (const tag of ['empty','six']) {
  const r = res[tag];
  console.log(`[${tag}] 流派 ${r.total} | 双墙 ${r.wall.length} | 免疫 ${r.imm.length} | 双墙且具免疫 ${r.wallAlsoImm.length} | 免疫且带墙 ${r.immAlsoWall.length}`);
}
console.log('\n== 双墙但具免疫（引擎落双墙，用户口径可能落免疫）==');
res.empty.wallAlsoImm.forEach(r => console.log(`  #${r.id} ${r.zh}#${r.idx} ${r.name} | ${r.side}/${r.roleTag} | 墙 ${r.walls.join('/')} | 免疫特性 ${r.immAbi} 免疫属性 ${r.immType.join('/')} | 特性 ${r.abi0} | ${r.mv.join(' ')}`));
console.log('\n== 免疫但带墙（引擎落免疫，用户口径可能落双墙）==');
res.empty.immAlsoWall.forEach(r => console.log(`  #${r.id} ${r.zh}#${r.idx} ${r.name} | ${r.side}/${r.roleTag} | 墙 ${r.walls.join('/')} | 免疫特性 ${r.immAbi} 免疫属性 ${r.immType.join('/')} | 特性 ${r.abi0} | ${r.mv.join(' ')}`));
