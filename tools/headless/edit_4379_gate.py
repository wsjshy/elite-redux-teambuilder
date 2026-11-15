# -*- coding: utf-8 -*-
import io, os
P = r'D:\game\elite-redux\index.html'
txt = io.open(P, encoding='utf-8', newline='').read()
def counts(s):
    c=s.count('\r\n'); return c, s.count('\n')-c
print('before:', counts(txt))
OLD = "var _v9off=(_v9side==='物理'||_v9side==='特殊'||_v9side==='双刀')&&(_v9role==='增伤'||_v9role==='输出');"
NEW = "var _v9off=(_v9side==='物理'||_v9side==='特殊'||_v9side==='双刀')&&(_v9role==='增伤'||_v9role==='输出'||_v9role==='强化');"
assert txt.count(OLD)==1, txt.count(OLD)
txt=txt.replace(OLD,NEW,1)
print('after:', counts(txt))
io.open(P,'w',encoding='utf-8',newline='').write(txt)
print('bytes:', len(txt.encode('utf-8')))
