# -*- coding: utf-8 -*-
"""v4.435 线上核验回填：AGENTS.md + VERSIONS.md（锚点唯一断言）。"""
import io, os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SHA = 'F4D941DE298071213DD0F1B4D13D462B0DBA9DB5'
GH = '0dfd2aa'

p = os.path.join(ROOT, 'AGENTS.md')
t = io.open(p, encoding='utf-8', newline='').read()
old = 'index 2,153,236 B、CRLF 25115 / bareLF 0。正文'
new = '线上一致（gh-pages `' + GH + '`，逐字节核验 Length 2,153,236 / SHA1 ' + SHA + '；CRLF 25115 / bareLF 0）。正文'
assert t.count(old) == 1, 'AGENTS anchor'
io.open(p, 'w', encoding='utf-8', newline='').write(t.replace(old, new, 1))

v = os.path.join(ROOT, 'docs', 'changelog', 'VERSIONS.md')
x = io.open(v, encoding='utf-8', newline='').read()
old2 = 'index 2,153,236 B / CRLF 25115 / bareLF 0 / SHA1 `' + SHA + '`。'
new2 = '线上一致（gh-pages `' + GH + '`，逐字节核验 Length 2,153,236 / SHA1 ' + SHA + '；CRLF 25115 / bareLF 0）。'
assert x.count(old2) == 1, 'VERSIONS anchor'
io.open(v, 'w', encoding='utf-8', newline='').write(x.replace(old2, new2, 1))
print('backfill done; gh-pages', GH)
