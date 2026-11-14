// 名实相符审计：流派名里的机制关键词，主招里必须真有对应招。
// node tools/headless/audit_name.js
const H = require('./harness.js');
const { ERDATA, deriveBuilds, MV } = H;

// 关键词 -> 主招中文名里应出现的词（或之一）
const KW = [
  ['杂技', ['杂技']],
  ['扑击', ['扑击']],
  ['陀螺球', ['陀螺球']],
  ['欺诈', ['欺诈']],
  ['硬撑', ['硬撑']],
  ['替身', ['替身']],
  ['剑舞', ['剑舞']],
  ['诡计', ['诡计']],
  ['空间', ['戏法空间']],
  ['顺风', ['顺风']],
  ['双墙', ['光墙', '反射壁']],
  ['钉子', ['隐形岩', '撒菱', '毒菱', '飞菱', '黏黏网']],
  ['打嗝', ['打嗝']],
  ['变身', ['变身']],
  ['铁壁', ['铁壁']],
  ['诅咒', ['诅咒']],
];

const hits = [];
for (const s of ERDATA.species) {
  let bs;
  try { bs = deriveBuilds(s, []); } catch (e) { continue; }
  for (const b of bs) {
    const mainNames = (b.mv.main || []).map(x => (MV[x.id] || [])[1] || '');
    for (const [kw, need] of KW) {
      if (b.name.indexOf(kw) >= 0) {
        const ok = need.some(n => mainNames.some(mn => mn.indexOf(n) >= 0));
        if (!ok) hits.push({ id: s.id, zh: s.zh, name: b.name, kw, main: mainNames });
      }
    }
  }
}
console.log('name-mismatch hits:', hits.length);
for (const h of hits.slice(0, 60)) console.log(JSON.stringify(h, null, 0));
