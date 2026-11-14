const H = require("./harness.js");
const s = H.ERDATA.species.find((x) => +x.id === 1788);
const bs = H.deriveBuilds(s, []);
bs.forEach(function (b) {
  if ((b.mv.main || []).some((x) => x.id === 10000) || b.name.indexOf("强化") >= 0) {
    console.log("== " + b.name + " role=" + b.roleTag);
    b.mv.main.forEach((x) => console.log("  " + H.MV[x.id][1] + " id=" + x.id + " why=" + JSON.stringify(x.why)));
    console.log("  items:", JSON.stringify(b.it));
  }
});
