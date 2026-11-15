# -*- coding: utf-8 -*-
"""v4.382 根因修复：evNatureLinkV437 的顺风倍率按实战招式(366)判定，不再读名称前缀。
名称前缀来自可学集（mechPrefix p.fn.tw），卡内未带顺风时 ×2 收敛属误判。"""
import io, os
ROOT = r'D:\game\elite-redux'
idx = os.path.join(ROOT, 'index.html')
txt = io.open(idx, encoding='utf-8', newline='').read()

old = "  var tailwind=/顺风/.test(name+roleTag);\r\n"
new = ("  var _twMv4382=(b.mv.main||[]).concat(b.mv.func||[]).some(function(x){return +x.id===366});\r\n"
       "  var tailwind=_twMv4382;   /* v4.382：顺风倍率按实战招式判定，不再读名称前缀（前缀可来自可学集误判） */\r\n")
if txt.count(old) != 1:
    raise SystemExit('锚点计数 %d' % txt.count(old))
txt = txt.replace(old, new, 1)
io.open(idx, 'w', encoding='utf-8', newline='').write(txt)
print('patch v4382c OK')
