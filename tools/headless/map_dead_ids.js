// 把死特性名映射到能力 id，并确认命中的是哪张 _A9 表
const H = require("./harness.js");
const ERDATA = H.ERDATA;
const A9ids = {
  T: [306,336,337,281,278,713,757,432,466,883,881,449,941,478,1009,659],
  G: [177,351,362,430,522,946],
  M: [960,963,500,830,786,327,631,776],
  W: [122,984,548,549],
  X: [252,166,544,891],
};
const allA9 = [].concat(A9ids.T, A9ids.G, A9ids.M, A9ids.W, A9ids.X);
const deadNames = ["狙击手","速度之力","雨盘","叶绿素","沙之力","超幸运","神枪手","沙隐","受热激升","草之皮毛","不仁不义","白茫茫","水栖居民","摔跤表演家","太阳之力"];
deadNames.forEach(function (nm) {
  const ab = ERDATA.abilities.find((a) => a[2] === nm || a[1] === nm);
  if (!ab) { console.log(nm, "-> ability table not found"); return; }
  const id = +ab[0];
  let rule = "NOT in _A9";
  Object.keys(A9ids).forEach((k) => { if (A9ids[k].indexOf(id) >= 0) rule = "_A9_" + k; });
  console.log(nm + " id=" + id + " en=" + ab[1] + " | " + rule);
});
