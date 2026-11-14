# -*- coding: utf-8 -*-
import sys
PATH = r"D:\game\elite-redux\index.html"
with open(PATH,"rb") as f: text=f.read().decode("utf-8")

old="var _md=mainDirOf(b),_physN=0,_specN=0,_has704=false,_has512=false,_has360=false;"
new="var _md=mainDirOf(b),_physN=0,_specN=0,_has704=false,_has512=false,_has360=false,_has492=false;"
n=text.count(old)
if n!=1:
    print("FAIL count",n); sys.exit(1)
text=text.replace(old,new)
with open(PATH,"wb") as f: f.write(text.encode("utf-8"))
print("fixed, size", len(text.encode("utf-8")))
