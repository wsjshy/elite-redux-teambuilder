# -*- coding: utf-8 -*-
"""v4.380 回填：AGENTS.md 版本行与 VERSIONS.md 条目的「线上核验」结果。"""
import io, sys

AG = r'D:\game\elite-redux\AGENTS.md'
VS = r'D:\game\elite-redux\docs\changelog\VERSIONS.md'
SHA = '5A5ECBA8A0327683933C9497874DD0345BE67BED'
LEN = '1,995,940'
GHP = 'c859913'

with io.open(AG, 'r', encoding='utf-8', newline='') as f:
    ag = f.read()
old = '| v4.380 | 1,995,940 | %s | 待线上核验（本版主题' % SHA
if old not in ag:
    print('AGENTS anchor miss'); sys.exit(1)
new = ('| v4.380 | 1,995,940 | %s | 线上一致（gh-pages `%s`，逐字节核验 Length=%s / SHA1=%s；本版主题'
       % (SHA, GHP, LEN, SHA))
ag2 = ag.replace(old, new, 1)
with io.open(AG, 'w', encoding='utf-8', newline='') as f:
    f.write(ag2)
print('AGENTS ok; crlf=%d bare=%d' % (ag2.count('\r\n'), ag2.count('\n') - ag2.count('\r\n')))

with io.open(VS, 'r', encoding='utf-8', newline='') as f:
    vs = f.read()
vold = 'index.html 1,995,940 B / SHA1 %s。截图' % SHA
if vold not in vs:
    print('VERSIONS anchor miss'); sys.exit(1)
vnew = ('index.html 1,995,940 B / SHA1 %s，线上一致（gh-pages `%s`，逐字节核验 Length=%s / SHA1=%s）。截图'
        % (SHA, GHP, LEN, SHA))
vs2 = vs.replace(vold, vnew, 1)
with io.open(VS, 'w', encoding='utf-8', newline='') as f:
    f.write(vs2)
print('VERSIONS ok; crlf=%d bare=%d' % (vs2.count('\r\n'), vs2.count('\n') - vs2.count('\r\n')))
