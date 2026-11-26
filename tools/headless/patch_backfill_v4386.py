# -*- coding: utf-8 -*-
# v4.386 发布后回填：AGENTS.md 版本行 + VERSIONS.md 条目「线上一致」结论。
# 仅改两处文字，不动引擎/文档正文；io.open newline='' 保持 CRLF 不污染行尾。
import io, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

BYTES = "2,038,174"
SHA1 = "EB68926FFB52B4381AFD37115568BA2E28A50DBE"
GH = "f24e900"
DATE = "2026-11-16"

agents_path = os.path.join(ROOT, "AGENTS.md")
old_a = "| v4.386 | 待回填 | 待回填 | 占位行：发布前回填字节/SHA1。"
new_a = ("| v4.386 | " + BYTES + " | " + SHA1 +
         " | 线上一致（gh-pages `" + GH + "`，逐字节核验 Length=" + BYTES +
         " / SHA1 " + SHA1 + "；" + DATE + "）。")

ver_path = os.path.join(ROOT, "docs", "changelog", "VERSIONS.md")
old_v = "index.html " + BYTES + " B / SHA1 " + SHA1 + "。截图"
new_v = ("index.html " + BYTES + " B / SHA1 " + SHA1 + "，线上一致（gh-pages `" + GH +
         "`，逐字节核验 Length=" + BYTES + " / SHA1 " + SHA1 + "；" + DATE + "）。截图")

for path, old, new in ((agents_path, old_a, new_a), (ver_path, old_v, new_v)):
    text = io.open(path, encoding="utf-8", newline="").read()
    n = text.count(old)
    if n != 1:
        sys.exit("锚点计数异常 %s: %d" % (path, n))
    io.open(path, "w", encoding="utf-8", newline="").write(text.replace(old, new, 1))
    print("backfilled", os.path.relpath(path, ROOT))

# 行尾复核
for path in (agents_path, ver_path):
    raw = open(path, "rb").read()
    t = raw.decode("utf-8")
    print(os.path.relpath(path, ROOT), "CRLF", t.count("\r\n"), "bareLF", t.count("\n") - t.count("\r\n"))
