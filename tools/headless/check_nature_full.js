const H = require('./harness.js');
const { ERDATA, deriveBuilds } = H;

// 全循环内统计 Foul Play 流派性格（与渲染口径一致）
const natCount = {};
const bad = [];
for (const s of ERDATA.species) {
  let bs;
  try { bs = deriveBuilds(s, []); } catch (e) { continue; }
  for (const b of bs) {
    if (b.mechRw !== 'foul_play_atk') continue;
    const nat = b.nat[0][0];
    natCount[nat] = (natCount[nat]||0)+1;
    if (nat !== '大胆' && nat !== '悠闲')
      bad.push(`#${s.id} ${s.zh} nat=${nat} ev=[${b.ev.alloc.join(',')}]`);
  }
}
console.log("Foul Play 性格分布（全循环）:", JSON.stringify(natCount));
console.log("\n仍非大胆/悠闲的:", bad.length);
for (const x of bad) console.log(" ", x);
