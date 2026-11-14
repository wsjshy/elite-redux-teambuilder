# 更新 gates.md：谓词招族已在 v4.375 落地
P = r"C:\Users\22210\AppData\Local\Doubao\User Data\Default\.doubao\agent_mode\workspace\.user_skills\er-teambuilder-dev\references\gates.md"
d = open(P, "rb").read()

old = ("- 谓词/flag 招族（60+ 特性）**暂不落**：`MV_FLAG` 只有 `jaw/sound/reckless/sheer/field/dance/bone/launcher/keen/fist/striker`，"
"缺 `hammer/horn/arrow/air/light/kick`，硬落会静默「永不触发」。")
new = ("- 谓词/flag 招族（v4.375 已落）：`MV_FLAG` 已补 `arrow/horn/air/hammer/throwing/drill/light` 七族，"
"12 个增伤特性接入 famAbiRuleOf（物种实际用名），why 读 mul 显示真实倍率；这 12 特性全库从未成为首推，门禁数字不变（无回归）。")
assert d.count(old.encode("utf-8")) == 1, "gates old text not unique"
d = d.replace(old.encode("utf-8"), new.encode("utf-8"))
open(P, "wb").write(d)
print("gates updated, CRLF", d.count(b"\r\n"), "bareLF", d.count(b"\n") - d.count(b"\r\n"))
