# -*- coding: utf-8 -*-
# v4.435 字节级补丁：toxic_heal_item 剧毒92 未学先灌 → 5 处 mech push 统一 mechHasMv 门控
import io, sys, os, hashlib, json, subprocess, re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
IDX = os.path.join(ROOT, 'index.html')

raw = open(IDX, 'rb').read()
text = raw.decode('utf-8')

# 基线行尾计数（铁律 4：保持 CRLF/bare LF 不变）
crlf0 = text.count('\r\n')
bare0 = text.count('\n') - crlf0

patches = [
    # 14988 toxic_heal_item 自身：92 是该行第一个 push，其余 4 处统一包 mechHasMv(s,92)
    (
        "b.mv.main.push({id:92,kind:'tech',tag:'压制',why:['剧毒：中毒消耗对手（毒疗只回复自身，不影响输出）']});",
        "if(mechHasMv(s,92))b.mv.main.push({id:92,kind:'tech',tag:'压制',why:['剧毒：中毒消耗对手（毒疗只回复自身，不影响输出）']});"
    ),
    (
        "if(mechHasMv(s,92))b.mv.main.push({id:92,kind:'tech',tag:'压制',why:['剧毒：先手挂状态']});",
        "if(mechHasMv(s,92))b.mv.main.push({id:92,kind:'tech',tag:'压制',why:['剧毒：先手挂状态']});",
        False,  # 已是门控，跳过（占位，不会执行到）
    ),
]

# 其余四处：行首已经是 if(mechHasMv(s,92))? 逐个核对原始源码
# 14988：唯一未门控的原始行（toxic_heal_item 自身）
old1 = "b.mv.main.push({id:92,kind:'tech',tag:'压制',why:['剧毒：中毒消耗对手（毒疗只回复自身，不影响输出）']});"
new1 = "if(mechHasMv(s,92))b.mv.main.push({id:92,kind:'tech',tag:'压制',why:['剧毒：中毒消耗对手（毒疗只回复自身，不影响输出）']});"
assert text.count(old1) == 1
text = text.replace(old1, new1, 1)
changed = 1

# 版本号三处同步（铁律：index.html ER_ENGINE_VER + package.json 4.435.0；AGENTS.md 版本表由文档步填）
text = text.replace("var ER_ENGINE_VER='v4.434';", "var ER_ENGINE_VER='v4.435';", 1)

crlf1 = text.count('\r\n'); bare1 = text.count('\n') - crlf1
print('行尾 CRLF %d→%d  bare LF %d→%d' % (crlf0, crlf1, bare0, bare1))
assert bare1 == bare0 == 0

open(IDX, 'wb').write(text.encode('utf-8'))
print('index.html patched, moves guarded =', changed)

# package.json 版本
pj = os.path.join(ROOT, 'package.json')
pjt = open(pj, encoding='utf-8').read()
pjt2 = re.sub(r'"version"\s*:\s*"4\.434\.0"', '"version": "4.435.0"', pjt, count=1)
assert pjt2 != pjt
open(pj, 'wb').write(pjt2.encode('utf-8'))
print('package.json → 4.435.0')

sha = hashlib.sha1(open(IDX, 'rb').read()).hexdigest()
print('index bytes', os.path.getsize(IDX), 'sha1', sha.upper())
