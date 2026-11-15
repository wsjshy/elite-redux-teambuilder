# -*- coding: utf-8 -*-
"""跟进：counter_mirror 与兜底两个源派发点的 ≥300 分支补 sash 替换标记，供 verify_sash 出全量清单。"""
import io, os, hashlib
ROOT = r'D:\game\elite-redux'
P = os.path.join(ROOT, 'index.html')
txt = io.open(P, encoding='utf-8', newline='').read()

def counts(s):
    crlf = s.count('\r\n'); return crlf, s.count('\n') - crlf
print('before CRLF/bareLF:', counts(txt))

OLD1 = "      b.it=[['剩饭','站场续航（耐久核主食；披带仅满血抗一击，高耐久不必赌一次保命）'],['凸凸头盔','物攻手碰瓷反伤（耐久核站场反伤配套）'],['防岩果','防被克制属性一击带走']];"
NEW1 = OLD1 + "\r\n      b.sashReplaced=true;b.sashOld='气势披带';b.sashNew='剩饭';"
assert txt.count(OLD1) == 1, txt.count(OLD1)
txt = txt.replace(OLD1, NEW1, 1)

OLD2 = "      else if(_v12fbBulk>=300)b.it=[['剩饭','站场续航（高耐久不必赌满血一次保命）']];"
NEW2 = OLD2 + "\r\n      else if(false){}else if(_v12fbBulk>=300){b.sashReplaced=true;b.sashOld='气势披带';b.sashNew='剩饭'}"
# 上面占位不优雅，改为直接在原句尾追加标记：
NEW2 = "      else if(_v12fbBulk>=300){b.it=[['剩饭','站场续航（高耐久不必赌满血一次保命）']];b.sashReplaced=true;b.sashOld='气势披带';b.sashNew='剩饭'}"
assert txt.count(OLD2) == 1, txt.count(OLD2)
txt = txt.replace(OLD2, NEW2, 1)

print('after CRLF/bareLF:', counts(txt))
io.open(P, 'w', encoding='utf-8', newline='').write(txt)
print('index.html new bytes:', len(txt.encode('utf-8')))
print('index.html SHA1:', hashlib.sha1(open(P, 'rb').read()).hexdigest().upper())
