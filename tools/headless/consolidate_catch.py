# -*- coding: utf-8 -*-
import io
P=r'D:\game\elite-redux\index.html'
t=io.open(P,encoding='utf-8',newline='').read()
old=("              try{_v9dep=abiSysOf(_v9abn)}catch(e1){}\r\n"
     "              try{_v9set=abiSetOf(_v9abn)}catch(e2){}\r\n"
     "              try{_v9sete=abiSetExt(_v9abn)}catch(e3){}")
new="              try{_v9dep=abiSysOf(_v9abn);_v9set=abiSetOf(_v9abn);_v9sete=abiSetExt(_v9abn)}catch(e1){}"
print('count',t.count(old))
assert t.count(old)==1
t=t.replace(old,new,1)
io.open(P,'w',encoding='utf-8',newline='').write(t)
print('consolidated, bytes',len(t.encode('utf-8')))
