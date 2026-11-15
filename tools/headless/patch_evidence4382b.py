# -*- coding: utf-8 -*-
import io, os, hashlib
ROOT = r'D:\game\elite-redux'
ev = os.path.join(ROOT, 'tools', 'headless', 'out_v4382_probe.txt')
idx = os.path.join(ROOT, 'index.html')
d = open(idx, 'rb').read(); t = d.decode('utf-8')
bn = len(d); sha = hashlib.sha1(d).hexdigest().upper()
crlf = t.count('\r\n'); bare = t.count('\n') - crlf

block = """
===== EV×命名收口补充（补丁 d/e：stale 零速速攻卡同样改名降级，不只标注）=====
规则④最终口径：凡流派名含「速攻」且 EV 速度投入=0、无自有倍率来源（天气提速/实战顺风366/轻装/围巾）→ 一律去速攻冠名，按耐久输出定位；
不重排 EV/性格/队友模板（高代价路径，本版不碰）。仍保留自有倍率来源的 97 条为例外（上清单逐条带来源名）。

#6 喷火龙（最终，fast/all 两队一致）：
  卡名「强化清场」（原「速攻强化清场」已降级）；EV=[252HP,0攻,0防,252特攻,4特防,0速]；main=315/542/434/164；不再是「速攻强化清场 + 0 速」。

降级卡片去重统计（fastTeam/slowTeam/allTeam 三队，按 id+变更名去重）：共 52 张。
  新名分布：强化清场 44 | 雪强化清场 3 | 主力输出压制 2 | 沙强化清场 1 | 雨强化清场 2。
  映射表沿用既有：速攻强化清场→强化清场；速攻压制/轻装速攻流/速攻流→主力输出压制；前缀（雪/沙/雨）随冠名保留。
  其中含速度强化招（龙舞349/腹鼓187）的 2 张（#2160 超级死灵暴龙X、#2664 Kilozuna Mega）按规则一并降级为强化清场，EV 未动。

===== 流派总数归属（空队 harness 配对，v4.381=4192 → v4.382=4205，改名不改数）=====
改名对 546（self 门重新识别速度身份，非真实增删）；真实新增 15；真实移除 2（#103 椰蛋树两张旧卡被「强化慢速重炮」替代）；净 +13。
15 新增均复核有自有速度来源（种族≥100 或自有天气/顺风/轻装/围巾/速度强化招）。

===== 顺风扩面（role 无关，fastTeam 带队）=====
旧引擎玻璃带顺风 74 → 新引擎 1，收掉 73（肉盾 56 + 轮转 17）；唯一保留 #547 风妖精（恶作剧之心豁免）；耐久位 bulk≥270 带顺风保留 319 条不动。

===== 门禁对照（gate.js 空队口径，v4.381 基线 → v4.382 实测）=====
物种 1906 / 流派 4205 / empty [] / fatal [] / badMove 1(#862) / dup 0 / itemsOver 0 / defOrb 0。
offHist 0:275 / 1:799(-4) / 2:552(+3) / 3:224(-4) / 4:48(+1) / 5:7(+4) / 7:1；漂移均由速度身份重排与新增/移除流派带来，无防守位宝珠/超 3 件回归。

===== 四轴只读登记（allTeam=[26,65,96,80,37,208]，本版不改引擎，留 v4.383）=====
增伤清场 97；减伤轴 1628（卡内特性不含减伤/免疫 DEF_ABI 白名单 1384，近似判据）；受队消耗 274；轮转补盲 223（main 无 369/521 的 pivotNoPivot 85）。

===== 回归与行尾 =====
verify_v4381.js：脆皮顺风残留 0；v4.380 钉子/戏法空间/墙≥2 残留 0。
verify_sash.js：bulk≥300 披带首位（非例外）残留 0；披带首位 272 = <270 203 + 边缘 68 + 例外 1。
check_syntax.py 6 段全过；smoke.js 33/33；静默 catch 390（顶格未增长）。
index.html：字节 %d；SHA1 %s；CRLF %d；bare LF %d（基线 v4.381：2,005,705 / CEAF82736062C199EE0AC53F962859462DF81382 / CRLF 22994 / bare LF 51；bareLF 未增）。
AGENTS.md CRLF / bare LF 0。
""" % (bn, sha, crlf, bare)

with io.open(ev, 'a', encoding='utf-8', newline='') as f:
    f.write(block)
print('appended', os.path.getsize(ev))
