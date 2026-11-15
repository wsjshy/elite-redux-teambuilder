# -*- coding: utf-8 -*-
import io
P=r'D:\game\elite-redux\index.html'
t=io.open(P,encoding='utf-8',newline='').read()
old="var ER_ENGINE_VER='v4.378';"
new="var ER_ENGINE_VER='v4.379';"
assert t.count(old)==1
t=t.replace(old,new,1)
io.open(P,'w',encoding='utf-8',newline='').write(t)
print('version bumped, bytes',len(t.encode('utf-8')))
