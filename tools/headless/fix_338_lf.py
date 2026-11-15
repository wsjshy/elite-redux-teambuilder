# -*- coding: utf-8 -*-
import io
P=r'D:\game\elite-redux\index.html'
t=io.open(P,encoding='utf-8',newline='').read()
# 当前块（注意16115行尾是bareLF）
cur="      if(!_ids.some(_rule.check)){\n        b.abi=pickAbiFor(s,b.side,b.roleTag,{buildName:b.name,mvCtx:_ids});}"
# 先试bareLF，再试CRLF
good="      if(!_ids.some(_rule.check))b.abi=pickAbiFor(s,b.side,b.roleTag,{buildName:b.name,mvCtx:_ids});"
print('cur count',t.count(cur))
if t.count(cur)==1:
    t=t.replace(cur,good,1)
    io.open(P,'w',encoding='utf-8',newline='').write(t)
    print('fixed')
else:
    # 检查实际字节
    i=t.index("if(!_ids.some(_rule.check))")
    print(repr(t[i-6:i+120]))
