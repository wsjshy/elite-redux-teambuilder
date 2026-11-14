// 全库量化：走到 eA9 最终分支（死特性保留、未换）的所有流派
const H = require("./harness.js");
const ERDATA = H.ERDATA;
const DEAD = "此特性当前不生效";
const rows = [];
ERDATA.species.forEach(function (s) {
  let builds = [];
  try {
    builds = H.deriveBuilds(s, []);
  } catch (e) {
    return;
  }
  builds.forEach(function (b) {
    const a0 = b.abi && b.abi[0];
    if (!a0 || !a0.why) return;
    const why = JSON.stringify(a0.why);
    if (why.indexOf(DEAD) < 0) return;
    const alts = (b.abi || []).slice(1).map((a) => a.n + "(sc" + a.sc + ")");
    rows.push({
      id: s.id,
      zh: s.zh,
      build: b.name,
      side: b.side,
      role: b.roleTag,
      score: b.score,
      dead: a0.n,
      alts: alts,
    });
  });
});
console.log("TOTAL dead-retained builds:", rows.length);
rows.forEach(function (r) {
  console.log(
    "#" + r.id + " " + r.zh + " | " + r.build + " | " + r.side + "/" + r.role + " | dead=" + r.dead +
    " | alts: " + r.alts.join(", ")
  );
});
