# README 追加 v4.375 特性段落与截图（bare LF）
P = r"D:\game\elite-redux\README.md"
d = open(P, "rb").read()

anchor = "![急速折返招式弹层](docs/shots/v374_mvmodal.png)\n\n---\n".encode("utf-8")
assert d.count(anchor) == 1, "readme anchor not unique"

new = ("![急速折返招式弹层](docs/shots/v374_mvmodal.png)\n\n"
"- **招族判定补全：箭/角/空/锤/投掷/钻头/光线七族入表**。有些特性只对特定招族的招式增伤（如巨翼强化空中招、强大之角强化角类招、超级重击者强化锤类招），旧的招族表缺了这七族，相关特性理论上会「永不触发」。现在按游戏源码把七族全部补齐，12 个对应增伤特性也接入同一判定：实配有对应招族就加一分、显示真实倍率（多数 1.3，灵魂粉碎者 1.1、锤拳 1.25、岩石载荷/恶作剧礼物 1.5），没有就降权提示换特性。\n\n"
"![喷火龙答案卡：巨翼特性按招族判定](docs/shots/v4375_mvflag.png)\n\n"
"---\n")

d = d.replace(anchor, new.encode("utf-8"))
open(P, "wb").write(d)
print("README updated, CRLF", d.count(b"\r\n"), "bareLF", d.count(b"\n") - d.count(b"\r\n"))
