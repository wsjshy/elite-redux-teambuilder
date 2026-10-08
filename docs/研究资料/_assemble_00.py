# -*- coding: utf-8 -*-
r"""把 _00_skeleton.md 的占位符替换为 _sec_*.md 内容，产出最终《_00_资料汇编.md》。
输出：D:\game\elite-redux\docs\战斗分析\_00_资料汇编.md
"""
import os

R = r"D:\game\elite-redux\docs\研究资料"
OUT = r"D:\game\elite-redux\docs\战斗分析\_00_资料汇编.md"

skel = open(os.path.join(R, "_00_skeleton.md"), encoding="utf-8").read()
mapping = {
    "{{A}}": "_sec_A_matchup.md",
    "{{B1}}": "_sec_B_abitags.md",
    "{{B2}}": "_sec_B_abelias.md",
    "{{B3}}": "_sec_B_movesnotes.md",
    "{{C2}}": "_sec_C_templates.md",
    "{{D}}": "_sec_D_stats.md",
    "{{E}}": "_sec_E_evidence.md",
    "{{F}}": "_sec_F_selfcheck.md",
}
for ph, fn in mapping.items():
    body = open(os.path.join(R, fn), encoding="utf-8").read().rstrip("\n")
    assert ph in skel, "占位符缺失: " + ph
    skel = skel.replace(ph, body)

left = [t for t in ("{{A}}", "{{B1}}", "{{B2}}", "{{B3}}", "{{C2}}", "{{D}}", "{{E}}", "{{F}}") if t in skel]
assert not left, "未替换占位符: " + str(left)

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8", newline="\n") as f:
    f.write(skel.rstrip("\n") + "\n")

print("wrote", OUT)
print("bytes:", os.path.getsize(OUT))
txt = open(OUT, encoding="utf-8").read()
print("lines:", txt.count("\n") + 1)
for sec in ["## A.", "## B.", "## C.", "## D.", "## E.", "## F."]:
    print(f"  {sec} present:", sec in txt)
