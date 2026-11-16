# -*- coding: utf-8 -*-
# v4.388 收口版：仅抬高版本号字符串，不动任何判定逻辑/分片/nat。
import io, os, sys

root = r"D:\game\elite-redux"

# 1) index.html：只替换 ER_ENGINE_VER 真值串（历史注释里的 v4.387 不动）
idx = os.path.join(root, "index.html")
with io.open(idx, "r", encoding="utf-8", newline="") as f:
    t = f.read()
old_ver = "var ER_ENGINE_VER='v4.387';"
new_ver = "var ER_ENGINE_VER='v4.388';"
assert t.count(old_ver) == 1, f"ER_ENGINE_VER 锚点命中 {t.count(old_ver)}"
t = t.replace(old_ver, new_ver)
with io.open(idx, "w", encoding="utf-8", newline="") as f:
    f.write(t)

# 2) package.json
pkg = os.path.join(root, "package.json")
with io.open(pkg, "r", encoding="utf-8", newline="") as f:
    p = f.read()
old_pkg = '"version": "4.387.0"'
new_pkg = '"version": "4.388.0"'
assert p.count(old_pkg) == 1, f"package version 锚点命中 {p.count(old_pkg)}"
p = p.replace(old_pkg, new_pkg)
with io.open(pkg, "w", encoding="utf-8", newline="") as f:
    f.write(p)

# 3) AGENTS.md 版本表：在 v4.387 行前插一行 v4.388 占位（指纹待发布链回填；正文由文档代理写）
ag = os.path.join(root, "AGENTS.md")
with io.open(ag, "r", encoding="utf-8", newline="") as f:
    a = f.read()
anchor = "| v4.387 |"
assert a.count(anchor) == 1, f"AGENTS v4.387 行锚点命中 {a.count(anchor)}"
row = ("| v4.388 | 待回填 | 待回填 | 收口版：只读量化 + 版本抬高；未改判定逻辑、未改分片、未开 nat 口子。"
       "指纹/线上核验待发布链回填；正文见 docs/test-reports/v4388_主线收口报告.md。 |\r\n")
a = a.replace(anchor, row + anchor)
with io.open(ag, "w", encoding="utf-8", newline="") as f:
    f.write(a)

print("bump v4.388 done")
