# -*- coding: utf-8 -*-
import io
P=r'D:\game\elite-redux\index.html'
txt=io.open(P,encoding='utf-8',newline='').read()
# 直接定位两条唯一插桩行，连同行尾CRLF删除
lines_to_remove=[
 "        try{globalThis._v9flip=(globalThis._v9flip||[]);globalThis._v9flip.push(String(s.id)+' '+_t.n+'→重评')}catch(_){}",
 "  try{globalThis._v9exit=(globalThis._v9exit||[]);globalThis._v9exit.push(b.abi&&b.abi[0]?b.abi[0].n:'?')}catch(_){}",
]
for ln in lines_to_remove:
    for term in ("\r\n","\n"):
        cand=ln+term
        if txt.count(cand)==1:
            txt=txt.replace(cand,"",1);print('removed',ln[:30]);break
    else:
        print('NOT FOUND',ln[:30])
# flip 块现在残留孤立的 { }，还原成单行
bad="      if(!_ids.some(_rule.check)){\r\n        b.abi=pickAbiFor(s,b.side,b.roleTag,{buildName:b.name,mvCtx:_ids});}"
good="      if(!_ids.some(_rule.check))b.abi=pickAbiFor(s,b.side,b.roleTag,{buildName:b.name,mvCtx:_ids});"
print('bad block',txt.count(bad))
if txt.count(bad)==1:txt=txt.replace(bad,good,1)
io.open(P,'w',encoding='utf-8',newline='').write(txt)
print('bytes',len(txt.encode('utf-8')))
