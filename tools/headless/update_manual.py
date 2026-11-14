# 手册：升顶部版本 + 插入 3.13 节（bare LF 文件）
P = r"D:\game\elite-redux\docs\manual\功能清单与使用手册.md"
d = open(P, "rb").read()

# 1) 顶部版本
old_ver = "引擎版本 **v4.374**".encode("utf-8")
new_ver = "引擎版本 **v4.375**".encode("utf-8")
assert d.count(old_ver) == 1
d = d.replace(old_ver, new_ver)

# 2) 插入 3.13 节
anchor = "![急速折返招式弹层](../shots/v374_mvmodal.png)\n\n---\n\n## 4. 队伍构建".encode("utf-8")
assert d.count(anchor) == 1, "manual anchor not unique"

section = """![急速折返招式弹层](../shots/v374_mvmodal.png)

### 3.13 招族判定补全：箭/角/空/锤/投掷/钻头/光线七族入表（v4.375）

**有些特性只对特定「招族」的招式增伤。** 比如「巨翼」强化空中/翼类招、「强大之角」强化角类招、「超级重击者」强化锤类招。这类判定依赖一张招式招族表（MV_FLAG），旧表只覆盖了拳/颚/波动/声音/舞蹈等少数族，缺了箭、角、空、锤、投掷、钻头、光线这七族——理论上相关特性会因为查不到招族而「永不触发」。

**现在七族全部补齐。** 工具按游戏源码里每个招式的招族标记，把箭（19 招）、角（22 招）、空（36 招）、锤（32 招）、投掷（23 招）、钻头（5 招）、光线（21 招）全部录入，12 个对应增伤特性也接入了同一套判定：实配招式里有对应招族就加一分并说明倍率，没有就降权提示换特性。

**倍率文案也更诚实。** 多数特性是 1.3 倍，但「灵魂粉碎者」是 1.1 倍、「锤拳」是 1.25 倍、「岩石载荷」「恶作剧礼物」是 1.5 倍，答案卡现在会显示各自真实倍率，不再一律写 1.3。

![喷火龙答案卡：巨翼特性按招族判定](../shots/v4375_mvflag.png)

---

## 4. 队伍构建"""

d = d.replace(anchor, section.encode("utf-8"))
open(P, "wb").write(d)
print("manual updated, CRLF", d.count(b"\r\n"), "bareLF", d.count(b"\n") - d.count(b"\r\n"))
