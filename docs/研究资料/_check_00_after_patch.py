# -*- coding: utf-8 -*-
r"""成品校验：确认 _00 资料汇编 的 4 处修正已生效、旧表述仅存于 F.2 的「原记录」列。"""
import io, sys

DOC = r"D:\game\elite-redux\docs\战斗分析\_00_资料汇编.md"
t = io.open(DOC, encoding="utf-8").read()

EXPECT = [
    ("原版标准表亦为 1 倍", 2, "A.3 正文 1 + F.2 行1 1"),
    ("与原版一致", 2, "E.1 正文 1 + F.2 行2 1"),
    ("硬编码 8 个名称", 1, "C.5 局限 5"),
    ("7 个名称", 1, "仅 F.2 行3 的「原记录」列"),
    ("非原版", 2, "仅 F.2 行1/行2 的「原记录」列"),
    ("HP+物攻+防御", 3, "C.6 强度行 1 + C.6 局限3 1 + F.2 行4 1"),
    ("HP+防` / `HP+特防` ≥300", 1, "仅 F.2 行4 的「原记录」列"),
    ("耐久评级口径含进攻项", 1, "C.6 局限 3"),
    ("F.2 修正记录", 1, "F 节新增"),
    ("修正 2026-10-06", 2, "C.5 局限5 / C.6 局限3"),
    ("2026-10-06 修正", 2, "A.3 正文 + E.1 实证取值（措辞为日期在前）"),
]
ok = True
for pat, exp, note in EXPECT:
    got = t.count(pat)
    flag = "OK " if got == exp else "!! "
    if got != exp:
        ok = False
    print(f"{flag}{pat!r:38s} 实读 {got} 期望 {exp}  （{note}）")

print("\n行数:", t.count("\n") + 1, "| 字节:", len(t.encode("utf-8")))
print("结论:", "全部符合预期" if ok else "存在偏差，需复查")
sys.exit(0 if ok else 1)
