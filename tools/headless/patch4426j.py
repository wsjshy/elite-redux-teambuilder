# -*- coding: utf-8 -*-
# v4.426 patch j：移除 patch4426i 新增的静默 catch（abiIdByZhOrEn 本身安全返回 null，无需 try），守 390 上限
import io, sys
P = r"D:\game\elite-redux\index.html"
with io.open(P, "rb") as f:
    b = f.read()

old = (
"    var _fsSnowIds=[117,666,929,291,348,870,493],_fsSnow=false;\r\n"
"    try{(s.abis||[]).concat(s.inns||[]).forEach(function(n){\r\n"
"      if(_fsSnow)return;var _id=abiIdByZhOrEn(n);\r\n"
"      if(_id!==null&&_fsSnowIds.indexOf(+_id)>-1)_fsSnow=true;});}catch(eFs){}\r\n"
)

new = (
"    var _fsSnowIds=[117,666,929,291,348,870,493],_fsSnow=false;\r\n"
"    (s.abis||[]).concat(s.inns||[]).forEach(function(n){\r\n"
"      if(_fsSnow)return;var _id=abiIdByZhOrEn(n);\r\n"
"      if(_id!==null&&_fsSnowIds.indexOf(+_id)>-1)_fsSnow=true;});\r\n"
)

ob = old.encode('utf-8'); nb = new.encode('utf-8')
n = b.count(ob)
if n != 1:
    print("ANCHOR COUNT =", n, "expected 1"); sys.exit(1)
b = b.replace(ob, nb)
with io.open(P, "wb") as f:
    f.write(b)
print("patch4426j OK, bytes", len(b))
