# v4.377：在 VERSIONS.md 末尾追加玩家可感知条目
P = r"D:\game\elite-redux\docs\changelog\VERSIONS.md"
d = open(P, "rb").read()
print("CRLF", d.count(b"\r\n"), "bareLF", d.count(b"\n") - d.count(b"\r\n"))
nl = "\r\n" if d.count(b"\r\n") else "\n"
nl_b = b"\r\n" if d.count(b"\r\n") else b"\n"

entry = (
"- **v4.377**（2026-11-15）：**修复超级巨钳螳螂 #1518 三处真实判定缺陷——反伤流误纳高物攻手、狙击手按全学习集误推、技术高手被威力硬门在评估前剔除**。"
"用户对默认「反伤后手流」（狙击手+气势披带+固执，252HP/252防，双倍奉还/守住/钢翼/彗星拳）提出三点质疑，审计后确认是三个独立引擎缺陷，全部修复。||"
"缺陷①反伤资格门用 OR 跨攻击种族：物理双倍奉还只应看物攻、镜面反射只应看特攻，物攻150的巨钳螳螂仅因特攻65<70就混入物理反伤流，浪费150物攻。全库113个流派被误纳（卡比兽、怪力、隆隆岩、超甲狂犀、武道熊师等）。修复：资格门按主招分侧判定。||"
"缺陷②会心流特性按全学习集而非流派实际招式判定：只要物种能学高暴击招就推狙击手，哪怕本流派没带。全库17个首推会心流特性里16个误推。修复：改用流派实际招式。||"
"缺陷③技术高手被 <55 威力硬门在选招前直接剔除：子弹拳（40威力，技术高手加成后60）在加成前就被过滤，引擎从未真正评估——证实用户质疑：不是评估后判定收益不足，而是根本没评估。修复：威力门之前先折算技术高手。||"
"关键发现：ER 数据招式威力与原版不同（碎岩 ER 基础60、劈瓦85），22处配招变化经逐招核对有效威力均正确，无弱招换强招回归。"
"1,983,409 B / `80E1CA6DB891BDA4F92D9DDAD714056CEADEB0A1`，待线上核验，物种 1906、流派 4215（4328-113）、fatal0 / dup0 / itemsOver0 / defOrb0 / badMove1，offHist 加权求和差恰好113与删除反伤流闭合，6 段语法 OK、smoke 33/33、浏览器实测 #1518 答案卡（截图 docs/shots/v4377_scizor_fix.png）、行尾 CRLF 22684 / bare LF 51。"
)
lines = entry.split("||")
block = nl.join(lines)
if not d.endswith(nl_b):
    d = d + nl_b
d = d + nl_b + block.encode("utf-8") + nl_b
open(P, "wb").write(d)
print("appended; CRLF", d.count(b"\r\n"), "bareLF", d.count(b"\n") - d.count(b"\r\n"))
