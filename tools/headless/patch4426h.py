# -*- coding: utf-8 -*-
# v4.426 patch h：共用弱点替换的角色承继校验从「仅天气手」泛化到任意角色，杜绝挂名
import io, sys
P = r"D:\game\elite-redux\index.html"
with io.open(P, "rb") as f:
    b = f.read()

old = (
"      /* v4.35b 角色可承继校验：替换者承继不了原角色时按真实能力复判（防『天气手』挂名，验收④） */\r\n"
"      var _role2=_bsel.role;\r\n"
"      try{\r\n"
"        var _rr2=mateRoleOf(_bsel.c.s,wxSys)||[];\r\n"
"        if(_role2==='天气手'&&_rr2.indexOf('天气手')<0)_role2=_rr2[0]||'输出';\r\n"
"      }catch(er3b){}\r\n"
)

new = (
"      /* v4.426 角色可承继校验（泛化）：替换者承继不了原角色时，按其真实角色表取首位，杜绝任何挂名 */\r\n"
"      var _role2=_bsel.role;\r\n"
"      try{\r\n"
"        var _rr2=mateRoleOf(_bsel.c.s,wxSys)||[];\r\n"
"        if(_rr2.indexOf(_role2)<0)_role2=_rr2[0]||'输出';\r\n"
"      }catch(er3b){}\r\n"
)

ob = old.encode('utf-8'); nb = new.encode('utf-8')
n = b.count(ob)
if n != 1:
    print("ANCHOR COUNT =", n, "expected 1"); sys.exit(1)
b = b.replace(ob, nb)
with io.open(P, "wb") as f:
    f.write(b)
print("patch4426h OK, bytes", len(b))
