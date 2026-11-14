# -*- coding: utf-8 -*-
PATH = r"C:\Users\22210\AppData\Local\Doubao\User Data\Default\.doubao\agent_mode\workspace\.user_skills\er-teambuilder-dev\references\engine-map.md"
with open(PATH,"rb") as f: t=f.read().decode("utf-8")
nl = "\r\n" if "\r\n" in t else "\n"

block = [
"## v4.378 新增锚点（Foul Play 门控，Grep 重取行号）",
"",
"- `mechFlowFit` 的 foul_play_atk 分支：新增 `_fpSpa=b[3]`（特攻）与速攻手硬门 `if(Math.max(atk,_fpSpa)>=110 && spe>=100) return null;`。",
"- `MECH_BUILD.foul_play_atk`：evKind='physdef'，core=[492]；机制流派在 `_deriveBuildsCore` 被 `out.unshift` 插到最前（存活即默认）。",
"- `evNatureLinkV437` 通用性格块：声明行 `var ... _has360=false,_has492=false;`（**必须含 _has492=false 重置**）；计数行检测 `_has492`；新增 Foul Play 分支 `else if(_has492&&_physN>0){want=isSp?'悠闲':'大胆'}`；应用门 `_mechBad` 加 `(_has492&&_curPos!=='+防御')`。",
"- 关键 id：欺诈 492（恶/物/95，按对方物攻）；过热 315、日食 975、诡计 417、大晴天 241；太阳之力 94。",
"- 代表物种：#1520 超级黑鲁加（修复后仅 1 流派晴增伤清场，太阳之力+弱点保险+胆小，EV[4,0,0,252,0,252]）。",
]
if not t.endswith(nl): t += nl
t += nl + nl.join(block) + nl
with open(PATH,"wb") as f: f.write(t.encode("utf-8"))
print("engine-map.md updated, size", len(t.encode("utf-8")))
