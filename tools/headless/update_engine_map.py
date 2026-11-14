# 更新 engine-map 第52行：MV_FLAG 缺口已在 v4.375 闭合
P = r"C:\Users\22210\AppData\Local\Doubao\User Data\Default\.doubao\agent_mode\workspace\.user_skills\er-teambuilder-dev\references\engine-map.md"
d = open(P, "rb").read()

old = ("- 招式 flag 表 `MV_FLAG`（v4.233）只有 11 类：`jaw/sound/reckless/sheer/field/dance/bone/launcher/keen/fist/striker`；"
"**缺 hammer/horn/arrow/air/light/kick**，谓词型特性（60+）落规则前必须先补表，否则 `mvHasFlag` 恒 false → 静默「永不触发」。")
new = ("- 招式 flag 表 `MV_FLAG`（v4.375 起 18 类）：原 11 类 `jaw/sound/reckless/sheer/field/dance/bone/launcher/keen/fist/striker`，"
"**v4.375 已补 7 类 `arrow/horn/air/hammer/throwing/drill/light`**（数据来自 pokemon.h 位域 + MoveList.textproto，与 shard 取交集）；"
"12 个增伤特性已接入 famAbiRuleOf（用物种实际用名，非能力表规范名），why 文案读规则 mul 显示真实倍率。注意这 12 特性全库从未成为首推 abi[0]，故门禁数字不变。")
assert d.count(old.encode("utf-8")) == 1, "engine-map old text not unique"
d = d.replace(old.encode("utf-8"), new.encode("utf-8"))
open(P, "wb").write(d)
print("engine-map updated, CRLF", d.count(b"\r\n"), "bareLF", d.count(b"\n") - d.count(b"\r\n"))
