# -*- coding: utf-8 -*-
"""v4.380：AGENTS.md 版本表新增一行（待线上核验占位）。文本级补丁，CRLF 守卫。"""
import io, os, hashlib

ROOT = r'D:\game\elite-redux'
AG = os.path.join(ROOT, 'AGENTS.md')
IDX = os.path.join(ROOT, 'index.html')

idx = io.open(IDX, encoding='utf-8', newline='').read()
bytes_n = len(idx.encode('utf-8'))
sha1 = hashlib.sha1(open(IDX, 'rb').read()).hexdigest().upper()
crlf = idx.count('\r\n')
bare = idx.count('\n') - crlf
print('index bytes', bytes_n, 'sha1', sha1, 'CRLF', crlf, 'bareLF', bare)

ag = io.open(AG, encoding='utf-8', newline='').read()
before = (ag.count('\r\n'), ag.count('\n') - ag.count('\r\n'))

ANCHOR = '| v4.379 |'
assert ag.count(ANCHOR) == 1, ag.count(ANCHOR)

row = ('| v4.380 | ' + format(bytes_n, ',') + ' | ' + sha1 + ' | 待线上核验'
       '（主题：队伍级辅助铁律扩面——速≥100 进攻流派不自己铺钉/开戏法空间/堆双墙，钉子与空间交队友，'
       '单张墙自身同吃减伤保留保命；物种 1906 / 流派 4192；收口 钉子 26、空间 12、墙 3'
       '（#615 几何雪花第二张墙替换，#1576 魔墙人偶-伽勒尔 / #2242 超级急冻鸟单张保留注明保命）；'
       'gate 与 v4.379 基线逐项一致：badMove1、dup0、itemsOver0、defOrb0、fatal0、empty 空；'
       '行尾 CRLF ' + str(crlf) + ' / bare LF ' + str(bare) + '） |')

ag2 = ag.replace(ANCHOR, row + '\r\n' + ANCHOR, 1)
after = (ag2.count('\r\n'), ag2.count('\n') - ag2.count('\r\n'))
print('AGENTS before CRLF/bareLF:', before, 'after:', after)
assert after[1] == before[1] == 0
io.open(AG, 'w', encoding='utf-8', newline='').write(ag2)
print('AGENTS.md row inserted')
