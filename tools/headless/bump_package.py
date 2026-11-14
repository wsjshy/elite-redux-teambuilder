# 升 package.json 版本（字节级，保持格式）
P = r"D:\game\elite-redux\package.json"
d = open(P, "rb").read()
old = b'"version": "4.374.0"'
new = b'"version": "4.375.0"'
assert d.count(old) == 1, "package version anchor not unique"
open(P, "wb").write(d.replace(old, new))
print("package.json bumped")
