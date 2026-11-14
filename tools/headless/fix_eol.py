p = r"D:\game\elite-redux\docs\dev\配队联动口径.md"
d = open(p, "rb").read()
anchor = "死特性标注 56→47 |".encode("utf-8")
i = d.index(anchor) + len(anchor)
nr = "| 巨钳螳螂三处判定缺陷修复".encode("utf-8")
j = d.index(nr)
assert d[i:j] == b"\r\n"
d = d[:i] + b"\n" + d[j:]
open(p, "wb").write(d)
print("fixed; CRLF", d.count(b"\r\n"), "bareLF", d.count(b"\n") - d.count(b"\r\n"))
