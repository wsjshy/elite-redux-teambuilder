# -*- coding: utf-8 -*-
import io
# AGENTS.md
A=r'D:\game\elite-redux\AGENTS.md'
ta=io.open(A,encoding='utf-8',newline='').read()
olda="| v4.379 | 1,989,476 | D92D220FD9B2241FBB1BD564B5BE7981B0E4B7F6 | 待线上核验（"
newa="| v4.379 | 1,989,476 | D92D220FD9B2241FBB1BD564B5BE7981B0E4B7F6 | 线上一致（gh-pages `433f644`，逐字节核验 Length=1,989,476 / SHA1=D92D220FD9B2241FBB1BD564B5BE7981B0E4B7F6；"
assert ta.count(olda)==1,ta.count(olda)
ta=ta.replace(olda,newa,1)
io.open(A,'w',encoding='utf-8',newline='').write(ta)
print('AGENTS backfilled, CRLF',ta.count('\r\n'),'bareLF',ta.count('\n')-ta.count('\r\n'))

# VERSIONS.md
V=r'D:\game\elite-redux\docs\changelog\VERSIONS.md'
tv=io.open(V,encoding='utf-8',newline='').read()
oldv="1,989,476 B / `D92D220FD9B2241FBB1BD564B5BE7981B0E4B7F6`，待线上核验，"
newv="1,989,476 B / `D92D220FD9B2241FBB1BD564B5BE7981B0E4B7F6`，线上一致（gh-pages `433f644`，逐字节核验 Length=1,989,476 / SHA1=D92D220FD9B2241FBB1BD564B5BE7981B0E4B7F6），"
assert tv.count(oldv)==1,tv.count(oldv)
tv=tv.replace(oldv,newv,1)
io.open(V,'w',encoding='utf-8',newline='').write(tv)
print('VERSIONS backfilled, CRLF',tv.count('\r\n'),'bareLF',tv.count('\n')-tv.count('\r\n'))
