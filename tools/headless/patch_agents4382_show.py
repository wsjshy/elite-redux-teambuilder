# -*- coding: utf-8 -*-
import io, os, sys, hashlib
ROOT = r'D:\game\elite-redux'
p = os.path.join(ROOT, 'AGENTS.md')
with io.open(p, 'r', encoding='utf-8', newline='') as f:
    t = f.read()

pairs = [
    ("| v4.382 | 2,010,751 | A20D7676EAB3409231E28180D435DA04E68E7EE6 |",
     "| v4.382 | 2,010,920 | 63222DCEFEFB843438FDC6D7F788AB58E3B41A76 |"),
    ("行尾 CRLF 23052 / bare LF 51（基线 22994/51，bareLF 未增）",
     "行尾 CRLF 23053 / bare LF 51（基线 22994/51，bareLF 未增）"),
    ("不碰 master、不 merge/rebase。截图 docs/shots/v4382_*.png 待补）",
     "不碰 master、不 merge/rebase。展示层收尾（同版不升版）：卡名已不含速攻但文案残留速攻字样 872 张 = A EV模板名 731（展示标签 速攻→高速线，ev.template/evKind/EV 数值未动，5 处渲染点 + 分配依据文案）+ B 流派原始描述旧名 51（保留溯源，补「（历史名）」前缀）+ C why/评分轴文案 90（奇石权衡评分轴标签 50 / 慢速误投速修正 23 / 去速攻定位规则 4 / 速攻手 rationale 13，真实评分轴与规则说明保留不改）；纯展示，gate 1906/4205 与 offHist 逐项一致，bareLF 51 未增。截图 docs/shots/v4382_*.png 待补）"),
]
for i, (old, new) in enumerate(pairs, 1):
    if t.count(old) != 1:
        print('FAIL anchor', i, t.count(old)); sys.exit(1)
    t = t.replace(old, new, 1)

with io.open(p, 'w', encoding='utf-8', newline='') as f:
    f.write(t)
b = open(p, 'rb').read(); tt = b.decode('utf-8')
print('bytes', len(b), 'CRLF', tt.count('\r\n'), 'bareLF', tt.count('\n') - tt.count('\r\n'))
