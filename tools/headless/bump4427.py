# -*- coding: utf-8 -*-
import io, sys
def w(p, s, nl=None):
    io.open(p, 'w', encoding='utf-8', newline=nl or '').write(s)

# 1) index.html ER_ENGINE_VER
p = r"D:\game\elite-redux\index.html"
b = io.open(p, 'rb').read()
o = b"var ER_ENGINE_VER='v4.426';"
assert b.count(o) == 1, b.count(o)
b = b.replace(o, b"var ER_ENGINE_VER='v4.427';")
io.open(p, 'wb').write(b)
print('index ver ok', len(b))

# 2) package.json
p2 = r"D:\game\elite-redux\package.json"
s = io.open(p2, encoding='utf-8').read()
assert s.count('"version": "4.426.0"') == 1
s = s.replace('"version": "4.426.0"', '"version": "4.427.0"')
w(p2, s)
print('pkg ok')
