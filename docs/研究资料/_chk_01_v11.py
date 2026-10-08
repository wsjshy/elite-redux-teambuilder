# -*- coding: utf-8 -*-
# 01 文档正文汉字统计（剔除表格行/代码块/引用行）+ 残留错误表述扫描
import re, io

p = r"D:\game\elite-redux\docs\战斗分析\01_属性克制体系.md"
s = io.open(p, encoding="utf-8").read()

# 剔除代码块
s = re.sub(r"```.*?```", "", s, flags=re.S)
# 剔除表格行（以 | 开头）
lines = [l for l in s.splitlines() if not l.strip().startswith("|")]
s = "\n".join(lines)
# 剔除引用行
s = re.sub(r"^>.*$", "", s, flags=re.M)
cjk = len(re.findall(r"[\u4e00-\u9fff]", s))
print("正文汉字数(剔表格/代码/引用):", cjk)

full = io.open(p, encoding="utf-8").read()
for pat in ["原版2x", "原版 2x", "原版分别为 2x", "非原版 2 倍", "ER 特例"]:
    n = len(re.findall(pat, full))
    print("残留[%s]: %d" % (pat, n))
# 特例相关措辞检查
print("含'与原版一致'次数:", len(re.findall("与原版一致", full)))
print("含'无差异'次数:", len(re.findall("无差异|无 ER 特例|逐格一致", full)))
