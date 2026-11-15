# -*- coding: utf-8 -*-
import io, os
ROOT = r'D:\game\elite-redux'
idx = os.path.join(ROOT, 'index.html')
t = io.open(idx, encoding='utf-8', newline='').read()
old = "ER_ENGINE_VER='v4.381'"
new = "ER_ENGINE_VER='v4.382'"
assert t.count(old) == 1, t.count(old)
io.open(idx, 'w', encoding='utf-8', newline='').write(t.replace(old, new, 1))

pkg = os.path.join(ROOT, 'package.json')
p = io.open(pkg, encoding='utf-8', newline='').read()
o2 = '"version": "4.381.0"'
n2 = '"version": "4.382.0"'
assert p.count(o2) == 1
io.open(pkg, 'w', encoding='utf-8', newline='').write(p.replace(o2, n2, 1))
print('version bumped v4.382 / 4.382.0')
