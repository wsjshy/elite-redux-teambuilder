# 探测插入锚点的行尾与唯一性
P = r"D:\game\elite-redux\index.html"
d = open(P, "rb").read()
anchor = "}catch(eA9){eA9.name}"
print("anchor count:", d.count(anchor.encode("utf-8")))
i = d.find(anchor.encode("utf-8"))
seg = d[i : i + len(anchor) + 4]
print("bytes after anchor:", seg)
# 该位置行尾：看 anchor 后紧跟的是 \r\n 还是 \n
j = i + len(anchor)
print("next bytes:", d[j:j+2], "CRLF?" , d[j:j+2] == b"\r\n", "bareLF?", d[j:j+1] == b"\n")
# 统计当前 CRLF / bareLF
print("CRLF:", d.count(b"\r\n"), "bareLF:", d.count(b"\n") - d.count(b"\r\n"))
