# v4.377 升版本号（index.html ER_ENGINE_VER），字节级替换
P = r"D:\game\elite-redux\index.html"
d = open(P, "rb").read()
old = b"var ER_ENGINE_VER='v4.376';"
new = b"var ER_ENGINE_VER='v4.377';"
assert d.count(old) == 1, d.count(old)
d = d.replace(old, new, 1)
open(P, "wb").write(d)
print("done; CRLF:", d.count(b"\r\n"), "bareLF:", d.count(b"\n") - d.count(b"\r\n"))
