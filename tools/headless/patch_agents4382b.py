# -*- coding: utf-8 -*-
import io, os, sys, hashlib
ROOT = r'D:\game\elite-redux'
ag = os.path.join(ROOT, 'AGENTS.md')
idx = os.path.join(ROOT, 'index.html')

d = open(idx, 'rb').read()
bn = len(d); sha = hashlib.sha1(d).hexdigest().upper()
t = d.decode('utf-8'); crlf = t.count('\r\n'); bare = t.count('\n') - t.count('\r\n')

with io.open(ag, 'r', encoding='utf-8', newline='') as f:
    a = f.read()

repl = [
    ("| 2,010,189 | 2DBF6AF02FB6F74C05CE210ABCA4136AE1E057F1 |",
     "| %s | %s |" % (format(bn, ','), sha)),
    ("基础速度≥100、无倍率但 0 速投入且 ev.source 含「倍率」的，标 v13EvStale=true 并 why 注明（倍率收敛残留，EV 层结构性连带，本版不重排 EV/性格，登记 v4.383）。",
     "基础速度≥100、无自有倍率但 0 速投入的（含 ev.source 倍率收敛残留与未带倍率标记两类），同样去速攻冠名降级为耐久输出定位，记 v13EvStale=true + v13Demoted 并 why 注明；本版不重排 EV/性格，EV 层结构性连带登记 v4.383。"),
    ("④速攻卡 0 速投入去重 143 = 倍率来源例外 97（天气提速/保留顺风/轻装/围巾）+ 倍率收敛残留 stale 39（登记 v4.383），无来源残留 0；降级命名 9 条（雪/沙/雨速攻强化清场→对应强化清场）。",
     "④速攻名 + 0 速投入 + 无自有倍率来源 = 0（PASS）；有倍率来源例外 97 条（天气提速/保留顺风/轻装/围巾，verify 逐条列来源名）；去重降级 52 张（强化清场 44 / 雪强化清场 3 / 主力输出压制 2 / 沙强化清场 1 / 雨强化清场 2），#6 喷火龙已由「速攻强化清场」降为「强化清场」、EV 252HP/252特攻/4特防/0 速。"),
    ("行尾 CRLF 23049 / bare LF 51",
     "行尾 CRLF %d / bare LF %d" % (crlf, bare)),
]

for old, new in repl:
    if a.count(old) != 1:
        print('FAIL count', a.count(old), old[:40]); sys.exit(1)
    a = a.replace(old, new, 1)

with io.open(ag, 'w', encoding='utf-8', newline='') as f:
    f.write(a)
print('AGENTS updated', 'bytes', os.path.getsize(ag), 'crlf', crlf, 'bare', bare)
