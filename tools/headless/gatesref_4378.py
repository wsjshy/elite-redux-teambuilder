# -*- coding: utf-8 -*-
PATH = r"C:\Users\22210\AppData\Local\Doubao\User Data\Default\.doubao\agent_mode\workspace\.user_skills\er-teambuilder-dev\references\gates.md"
with open(PATH,"rb") as f: t=f.read().decode("utf-8")
nl = "\r\n" if "\r\n" in t else "\n"

block = [
"## 九、Foul Play（欺诈 #492）资格门与变量泄漏（v4.378）",
"",
"- 欺诈是恶系物理招（威力95），**按对方物攻结算**，正统用法给不投资攻击的耐久防守宝可梦反制物攻手；不是给高速特殊攻击手的核心招。",
"- 旧 mechFlowFit 的 foul_play_atk 分支只看物攻、不看特攻/速度/耐久，且机制流派被 `_deriveBuildsCore` 里 `out.unshift` 无条件插到最前 → 一旦存活即默认 builds[0]。",
"- 收口规则（已验证）：`max(Atk,SpA)>=110 && Spe>=100` 直接 return null，精确移除 22 个速攻手；慢速高耐久（Spe<100）保守保留。全库流派 4215→4193，无空物种。",
"- 性格：通用性格块 evNatureLinkV437 会把机制层正确的「大胆」覆盖成「固执」（+攻对欺诈无用）；补 Foul Play 分支（非空间大胆/空间悠闲）+ `_mechBad` 应用门。门控后 135 个保留流派 = 大胆130/悠闲5。",
"- **变量泄漏教训（关键）**：新增标记变量 `_has492` 必须在每条流派开头的 `var ...=false` 声明里显式重置；漏写会成隐式全局，被前一条 Foul Play 置 true 后污染后续无关物种（全循环内 #1532 超级喷火驼被误判、丢变体，单独运行却正常）。任何新增 per-build 标记变量都要在声明行重置。",
"- 死特性：太阳之力在物理欺诈流（无大晴天、只加特殊招）是死特性，随欺诈流移除自动消解；保留的晴特殊流里它才正确生效，无需单独换特性。",
]
if not t.endswith(nl): t += nl
t += nl + nl.join(block) + nl
with open(PATH,"wb") as f: f.write(t.encode("utf-8"))
print("gates.md updated, size", len(t.encode("utf-8")))
