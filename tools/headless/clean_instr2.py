# -*- coding: utf-8 -*-
import io
P=r'D:\game\elite-redux\index.html'
txt=io.open(P,encoding='utf-8',newline='').read()
# flip block
F1="      if(!_ids.some(_rule.check)){\r\n        try{globalThis._v9flip=(globalThis._v9flip||[]);globalThis._v9flip.push(String(s.id)+' '+_t.n+'→重评')}catch(_){}\r\n        b.abi=pickAbiFor(s,b.side,b.roleTag,{buildName:b.name,mvCtx:_ids});}"
F2="      if(!_ids.some(_rule.check))b.abi=pickAbiFor(s,b.side,b.roleTag,{buildName:b.name,mvCtx:_ids});"
print('F1',txt.count(F1));assert txt.count(F1)==1
txt=txt.replace(F1,F2,1)
# exit line
E1="  try{globalThis._v9exit=(globalThis._v9exit||[]);globalThis._v9exit.push(b.abi&&b.abi[0]?b.abi[0].n:'?')}catch(_){}\r\n"
print('E1',txt.count(E1));assert txt.count(E1)==1
txt=txt.replace(E1,"",1)
io.open(P,'w',encoding='utf-8',newline='').write(txt)
print('cleaned',len(txt.encode('utf-8')))
