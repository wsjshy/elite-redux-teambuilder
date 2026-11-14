p = r"D:\game\elite-redux\docs\dev\配队联动口径.md"
d = open(p, "rb").read()
anchor = "死特性标注 56→47 |".encode("utf-8")
i = d.index(anchor) + len(anchor)
nr = "| 巨钳螳螂三处判定缺陷修复".encode("utf-8")
j = d.index(nr)
print("terminator between rows (v4376->new):", d[i:j])
k = d.index(b"\n", j)
print("new row ending bytes:", d[k-1:k+1])
# 检查表格其余行（v4.375 行）用什么行尾
a4375 = "| 招族判定补全（v4.375）".encode("utf-8")
m = d.index(a4375)
n = d.index(b"\n", m)
print("v4375 row ending:", d[n-1:n+1])
