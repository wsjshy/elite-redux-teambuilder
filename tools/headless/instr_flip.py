# -*- coding: utf-8 -*-
import io
P=r'D:\game\elite-redux\index.html'
txt=io.open(P,encoding='utf-8',newline='').read()
OLD="      if(!_ids.some(_rule.check))b.abi=pickAbiFor(s,b.side,b.roleTag,{buildName:b.name,mvCtx:_ids});"
NEW="""      if(!_ids.some(_rule.check)){
        try{globalThis._v9flip=(globalThis._v9flip||[]);globalThis._v9flip.push(String(s.id)+' '+_t.n+'→重评')}catch(_){}
        b.abi=pickAbiFor(s,b.side,b.roleTag,{buildName:b.name,mvCtx:_ids});}"""
assert txt.count(OLD)==1,txt.count(OLD)
txt=txt.replace(OLD,NEW,1)
io.open(P,'w',encoding='utf-8',newline='').write(txt)
print('ok')
