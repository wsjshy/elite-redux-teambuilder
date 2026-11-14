# v4.377：回填 AGENTS.md 与 VERSIONS.md 的「待线上核验」为「线上一致」
sha7 = "c432155"

# 1) AGENTS.md
ap = r"D:\game\elite-redux\AGENTS.md"
d = open(ap, "rb").read()
old = "| v4.377 | 1,983,409 | 80E1CA6DB891BDA4F92D9DDAD714056CEADEB0A1 | 待线上核验（".encode("utf-8")
new = ("| v4.377 | 1,983,409 | 80E1CA6DB891BDA4F92D9DDAD714056CEADEB0A1 | 线上一致（gh-pages `" + sha7 + "`，逐字节核验；").encode("utf-8")
assert d.count(old) == 1
d = d.replace(old, new)
open(ap, "wb").write(d)
print("AGENTS backfilled; CRLF", d.count(b"\r\n"), "bareLF", d.count(b"\n") - d.count(b"\r\n"))

# 2) VERSIONS.md
vp = r"D:\game\elite-redux\docs\changelog\VERSIONS.md"
d = open(vp, "rb").read()
old2 = "`80E1CA6DB891BDA4F92D9DDAD714056CEADEB0A1`，待线上核验，".encode("utf-8")
new2 = ("`80E1CA6DB891BDA4F92D9DDAD714056CEADEB0A1`，线上一致（gh-pages `" + sha7 + "`，逐字节核验），").encode("utf-8")
assert d.count(old2) == 1
d = d.replace(old2, new2)
open(vp, "wb").write(d)
print("VERSIONS backfilled; CRLF", d.count(b"\r\n"), "bareLF", d.count(b"\n") - d.count(b"\r\n"))
