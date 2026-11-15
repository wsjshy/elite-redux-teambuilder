# -*- coding: utf-8 -*-
import io, os, hashlib
ROOT = r'D:\game\elite-redux'
ev = os.path.join(ROOT, 'tools', 'headless', 'out_v4382_probe.txt')
idx = os.path.join(ROOT, 'index.html')
d = open(idx, 'rb').read()
bytes_n = len(d)
sha = hashlib.sha1(d).hexdigest().upper()
t = d.decode('utf-8')
crlf = t.count('\r\n'); bare = t.count('\n') - crlf

block = """
===== 门禁对照（gate.js 空队口径，v4.381 基线 → v4.382）=====
指标            v4.381 基线        v4.382 实测        差额
物种            1906               1906               0
流派总数        4192               4205               +13（归属见下）
empty           []                 []                 0
fatal           []                 []                 0
badMove         1 (#862)           1 (#862)           0
dup             0                  0                  0
itemsOver       0                  0                  0
defOrb          0                  0                  0
offHist 0       275                275                0
offHist 1       803                799                -4
offHist 2       549                552                +3
offHist 3       228                224                -4
offHist 4       47                 48                 +1
offHist 5       3                  7                  +4
offHist 7       1                  1                  0

===== 流派总数 +13 逐条归属（空队 harness_old=v4.381 vs harness.js=v4.382，按物种配对）=====
改名对（同物种一对一，self 门重新识别速度身份，非真实增删）: 546
真实新增: 15
  #103 椰蛋树(55) 强化慢速重炮
  #385 基拉祈(100) 速攻强化清场
  #521 高傲雉鸡(93) 顺风速攻压制
  #579 人造细胞卵(30) 空间慢速重炮
  #719 蒂安希(50) 空间慢速重炮
  #1651 阿尔宙斯-飞行(120) 顺风速攻强化清场
  #1652 阿尔宙斯-毒(120) 顺风速攻强化清场
  #1654 阿尔宙斯-岩石(120) 顺风速攻强化清场
  #1657 阿尔宙斯-钢(120) 顺风速攻强化清场
  #1660 阿尔宙斯-草(120) 顺风速攻强化清场
  #1664 阿尔宙斯-龙(120) 顺风速攻强化清场
  #2104 超级巨钳蟹(85) 雨速攻强化清场
  #2234 超级风速狗-洗翠(140) 速攻压制
  #2549 三首恶龙R(70) 场地速攻强化清场
  #2587 日月岩(120) 顺风速攻强化清场
真实移除: 2
  #103 椰蛋树(55) 强化主力输出压制 → 强化慢速重炮
  #103 椰蛋树(55) 强化稳健联防消耗 → 强化慢速重炮
净: 15 - 2 = +13

===== 四段结论数字 =====
① 速度轴 self-centric：基线错配 871（A0 317 + A1 374 + B0 180）。收口后残留 A0=2（#106 飞腿郎87 / #308 恰雷姆80，均轻装特性×2 有效速度达标，合法例外）；A1=101（顺风39/晴16/雨17/轻装16/沙6/雪6/场地1，全部自有倍率来源，verify① 无来源 0）；B0=0。
② 空间×速攻互斥：基线 27 条「空间+速攻」前缀互斥 → 残留 0（verify③）。
③ 顺风扩面（role 无关）：旧引擎玻璃带顺风 74 → 新引擎 1，收掉 73（肉盾56 + 轮转17）；唯一保留 #547 风妖精（恶作剧之心豁免）；耐久位 bulk≥270 带顺风保留 319 条不动（真·自有提速来源）。
④ EV×命名：速攻卡 0 速投入去重 143 = 倍率来源例外 97 + 倍率收敛残留 stale 39；无来源残留 0；降级命名 9 条（雪/沙/雨速攻强化清场→对应强化清场）。stale 39 根因：EV 结算时 366 仍在招中（v4.381/v4.382 后置块才剥离），×2 速度收敛导致速度 EV 归零，剥离后 stale 残留；彻底修复需把 EV 最终化移到后置块之后（连带性格对齐与 ftC 队友挑选模板重排），属 EV 层结构性连带，本版只标 v13EvStale + why 注明，登记 v4.383。

===== 四轴只读登记（allTeam=[26,65,96,80,37,208]，本版不改引擎，留 v4.383）=====
增伤清场 wx: 97
减伤轴 imm: 1628（其中卡内特性不含减伤/免疫特性 DEF_ABI 白名单: 1384，近似判据）
受队消耗 stall: 274
轮转补盲 pivot: 223（其中 main 无 369/521 的 pivotNoPivot: 85）

===== 回归与行尾 =====
verify_v4381.js：脆皮顺风残留 0；v4.380 钉子/戏法空间/墙≥2 回归残留 0。
verify_sash.js：bulk≥300 披带首位（非例外）残留 0；披带首位 272 = <270 203 + 边缘 68 + 例外 1。
check_syntax.py：6 段 node --check 全过。
smoke.js：33/33；静默 catch 390（未增长，上限 390 顶格）。
index.html：字节 %d；SHA1 %s；CRLF %d；bare LF %d（基线 v4.381：2,005,705 / CEAF82736062C199EE0AC53F962859462DF81382 / CRLF 22994 / bare LF 51；bareLF 未增）。
AGENTS.md：CRLF / bare LF 0。
""" % (bytes_n, sha, crlf, bare)

with io.open(ev, 'a', encoding='utf-8', newline='') as f:
    f.write(block)
print('evidence appended:', ev, 'bytes', os.path.getsize(ev))
