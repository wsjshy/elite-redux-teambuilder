# -*- coding: utf-8 -*-
import io
P=r'D:\game\elite-redux\index.html'
txt=io.open(P,encoding='utf-8',newline='').read()
bad="      if(!_ids.some(_rule.check)){\r\n        b.abi=pickAbiFor(s,b.side,b.roleTag,{buildName:b.name,mvCtx:_ids});}"
good="      if(!_ids.some(_rule.check))b.abi=pickAbiFor(s,b.side,b.roleTag,{buildName:b.name,mvCtx:_ids});"
print(txt.count(bad))
if txt.count(bad)==1:
    txt=txt.replace(bad,good,1)
    io.open(P,'w',encoding='utf-8',newline='').write(txt)
    print('cleaned',len(txt.encode('utf-8')))
