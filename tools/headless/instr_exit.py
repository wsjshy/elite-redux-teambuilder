# -*- coding: utf-8 -*-
import io
P=r'D:\game\elite-redux\index.html'
txt=io.open(P,encoding='utf-8',newline='').read()
# 在return b前加trace
OLD="  }catch(e){}\r\n  return b;\r\n}\r\n/* v4.45 C-1"
NEW="  }catch(e){}\r\n  try{globalThis._v9exit=(globalThis._v9exit||[]);globalThis._v9exit.push(b.abi&&b.abi[0]?b.abi[0].n:'?')}catch(_){}\r\n  return b;\r\n}\r\n/* v4.45 C-1"
assert txt.count(OLD)==1,txt.count(OLD)
txt=txt.replace(OLD,NEW,1)
io.open(P,'w',encoding='utf-8',newline='').write(txt)
print('ok')
