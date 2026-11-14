# 回填：AGENTS.md 与 VERSIONS.md 的「待线上核验」改为「线上一致」
# AGENTS.md（CRLF）
AP = r"D:\game\elite-redux\AGENTS.md"
a = open(AP, "rb").read()
old_a = "| 7A4EC47F9E44F851525E2A977D9F00F5F5BA7223 | 待线上核验（本版主题".encode("utf-8")
new_a = "| 7A4EC47F9E44F851525E2A977D9F00F5F5BA7223 | 线上一致（gh-pages `8acbe64`，逐字节核验；本版主题".encode("utf-8")
assert a.count(old_a) == 1, "AGENTS backfill anchor not unique"
a = a.replace(old_a, new_a)
open(AP, "wb").write(a)
print("AGENTS backfilled, CRLF", a.count(b"\r\n"), "bareLF", a.count(b"\n") - a.count(b"\r\n"))

# VERSIONS.md（CRLF）
VP = r"D:\game\elite-redux\docs\changelog\VERSIONS.md"
v = open(VP, "rb").read()
old_v = "`7A4EC47F9E44F851525E2A977D9F00F5F5BA7223`，待线上核验，物种 1906".encode("utf-8")
new_v = "`7A4EC47F9E44F851525E2A977D9F00F5F5BA7223`，线上一致（gh-pages `8acbe64`，逐字节核验），物种 1906".encode("utf-8")
assert v.count(old_v) == 1, "VERSIONS backfill anchor not unique"
v = v.replace(old_v, new_v)
open(VP, "wb").write(v)
print("VERSIONS backfilled, CRLF", v.count(b"\r\n"), "bareLF", v.count(b"\n") - v.count(b"\r\n"))
