// 查关键招式：子弹拳/彗星拳/钢翼/极落钳/暗袭要害/十字剪/双倍奉还，及 Scizor 能否学
const H = require("./harness.js");
const s = H.ERDATA.species.find((x) => +x.id === 1518);
const learn = H.learnOf(s);
["子弹拳","彗星拳","钢翼","极落钳","暗袭要害","十字剪","双倍奉还","急速折返","蛮力","铁头"]
.forEach(function (nm) {
  const m = Object.values(H.MV).find((x) => x && x[1] === nm);
  if (!m) { console.log(nm, "not in MV"); return; }
  console.log(nm + " id=" + m[0] + " " + m[3] + "/" + m[4] + " pow=" + m[5] + " hit=" + m[6] + " prio=" + m[8] + " learnable=" + (learn.indexOf(+m[0]) >= 0) + " tag=" + m[11]);
});
// 技术高手规则：找引擎里 Technician 判定
console.log("\nTechnician id=101; Sniper id=97");
