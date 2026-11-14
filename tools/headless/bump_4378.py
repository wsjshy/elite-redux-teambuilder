# -*- coding: utf-8 -*-
import sys

# index.html
P1 = r"D:\game\elite-redux\index.html"
with open(P1,"rb") as f: t=f.read().decode("utf-8")
o1="var ER_ENGINE_VER='v4.377';"
n1="var ER_ENGINE_VER='v4.378';"
assert t.count(o1)==1
t=t.replace(o1,n1)
with open(P1,"wb") as f: f.write(t.encode("utf-8"))
print("index.html -> v4.378")

# package.json
P2 = r"D:\game\elite-redux\package.json"
with open(P2,"rb") as f: t=f.read().decode("utf-8")
o2='"version": "4.377.0"'
n2='"version": "4.378.0"'
assert t.count(o2)==1
t=t.replace(o2,n2)
with open(P2,"wb") as f: f.write(t.encode("utf-8"))
print("package.json -> 4.378.0")
