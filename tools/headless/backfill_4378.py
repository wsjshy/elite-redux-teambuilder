# -*- coding: utf-8 -*-

# AGENTS.md
P1 = r"D:\game\elite-redux\AGENTS.md"
with open(P1,"rb") as f: t=f.read().decode("utf-8")
o1="| v4.378 | 1,983,792 | 75D9FC0595379218D096D0D64555410947591F87 | 待线上核验（本版主题"
n1="| v4.378 | 1,983,792 | 75D9FC0595379218D096D0D64555410947591F87 | 线上一致（gh-pages `84c402e`，逐字节核验 Length=1,983,792 / SHA1=75D9FC0595379218D096D0D64555410947591F87；本版主题"
assert t.count(o1)==1
t=t.replace(o1,n1)
with open(P1,"wb") as f: f.write(t.encode("utf-8"))
print("AGENTS backfilled")

# VERSIONS.md
P2 = r"D:\game\elite-redux\docs\changelog\VERSIONS.md"
with open(P2,"rb") as f: t=f.read().decode("utf-8")
o2="，待线上核验，物种 1906、流派 4193"
n2="，线上一致（gh-pages `84c402e`，逐字节核验 Length=1,983,792 / SHA1=75D9FC0595379218D096D0D64555410947591F87），物种 1906、流派 4193"
assert t.count(o2)==1
t=t.replace(o2,n2)
with open(P2,"wb") as f: f.write(t.encode("utf-8"))
print("VERSIONS backfilled")
