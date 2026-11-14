# v4.375 升版：index.html 的 ER_ENGINE_VER（字节级，保持行尾）
P = r"D:\game\elite-redux\index.html"
d = open(P, "rb").read()
old = b"var ER_ENGINE_VER='v4.374'"
new = b"var ER_ENGINE_VER='v4.375'"
assert d.count(old) == 1, "version anchor not unique"
d = d.replace(old, new)
crlf = d.count(b"\r\n")
print("CRLF", crlf, "bareLF", d.count(b"\n") - crlf)
open(P, "wb").write(d)
print("index length:", len(d))
