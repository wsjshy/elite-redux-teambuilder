# -*- coding: utf-8 -*-
import io
P=r'D:\game\elite-redux\index.html'
txt=io.open(P,encoding='utf-8',newline='').read()
BAD="换常驻特性「'+_v9pick.n+'」'];"
GOOD="换常驻特性「'+_v9pick.n+'」'];"
assert txt.count(BAD)==1,txt.count(BAD)
txt=txt.replace(BAD,GOOD,1)
io.open(P,'w',encoding='utf-8',newline='').write(txt)
print('fixed, bytes',len(txt.encode('utf-8')))
