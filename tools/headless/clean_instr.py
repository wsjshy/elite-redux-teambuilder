# -*- coding: utf-8 -*-
import io
P=r'D:\game\elite-redux\index.html'
txt=io.open(P,encoding='utf-8',newline='').read()
# 1. flip instrumentation
FLIP_OLD=("""      if(!_ids.some(_rule.check)){
        try{globalThis._v9flip=(globalThis._v9flip||[]);globalThis._v9flip.push(String(s.id)+' '+_t.n+'→重评')}catch(_){}
        b.abi=pickAbiFor(s,b.side,b.roleTag,{buildName:b.name,mvCtx:_ids});}""").replace('\n','\r\n')
FLIP_NEW="      if(!_ids.some(_rule.check))b.abi=pickAbiFor(s,b.side,b.roleTag,{buildName:b.name,mvCtx:_ids});"
print('flip count',txt.count(FLIP_OLD))
assert txt.count(FLIP_OLD)==1
txt=txt.replace(FLIP_OLD,FLIP_NEW,1)
# 2. exit instrumentation
EXIT_OLD="  }catch(e){}\r\n  try{globalThis._v9exit=(globalThis._v9exit||[]);globalThis._v9exit.push(b.abi&&b.abi[0]?b.abi[0].n:'?')}catch(_){}\r\n  return b;\r\n}"
EXIT_NEW="  }catch(e){}\r\n  return b;\r\n}"
print('exit count',txt.count(EXIT_OLD))
assert txt.count(EXIT_OLD)==1
txt=txt.replace(EXIT_OLD,EXIT_NEW,1)
io.open(P,'w',encoding='utf-8',newline='').write(txt)
print('cleaned bytes',len(txt.encode('utf-8')))
