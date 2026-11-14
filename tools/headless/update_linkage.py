# 联动口径第二节表格追加 v4.375 招族行（bare LF 行尾）
P = r"D:\game\elite-redux\docs\dev\配队联动口径.md"
d = open(P, "rb").read()

anchor = "避免补字段牵动推荐链路 |\n\n".encode("utf-8")
assert d.count(anchor) == 1, "anchor not unique"

row = ("避免补字段牵动推荐链路 |\n"
"| 招族判定补全（v4.375）：箭/角/空/锤/投掷/钻头/光线七族 | MV_FLAG 旧表只覆盖拳/颚/波动/声音/舞蹈等，缺七族 → 依赖招族的增伤特性查不到招族会静默永不触发 | 按源码 pokemon.h 位域 + MoveList.textproto 把七族录入（arrow19/horn22/air36/hammer32/throwing23/drill5/light21），12 个增伤特性用物种实际用名接入同一判定；非增伤特性（形态/命中/吸收/受击/亲子/降防/烧伤）不接入，light 无 shard 内消费特性 | 实配含族群招 → +1 并显示真实倍率（默认1.3，灵魂粉碎者1.1/锤拳1.25/岩石载荷·恶作剧礼物1.5），无族群招 → 降权提示换特性；这 12 特性全库从未成为首推 abi[0]，门禁数字与基线一致（无回归），价值在数据完整性与安全网 |\n\n")

d = d.replace(anchor, row.encode("utf-8"))
open(P, "wb").write(d)
print("linkage doc updated, CRLF", d.count(b"\r\n"), "bareLF", d.count(b"\n") - d.count(b"\r\n"))
