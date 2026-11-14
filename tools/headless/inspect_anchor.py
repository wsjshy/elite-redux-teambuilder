# 查看 coreIdeaOf 行尾与插入锚点
P = r"D:\game\elite-redux\docs\dev\配队联动口径.md"
d = open(P, "rb").read()
i = d.find("coreIdeaOf".encode("utf-8"))
sec3 = "## 三".encode("utf-8")
j = d.find(sec3, i)
print(repr(d[j - 45:j]))
