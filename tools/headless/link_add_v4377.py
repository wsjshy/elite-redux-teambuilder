# v4.377：配队联动口径表新增 v4.377 判定行（落在第二节表格内）
P = r"D:\game\elite-redux\docs\dev\配队联动口径.md"
d = open(P, "rb").read()
print("CRLF", d.count(b"\r\n"), "bareLF", d.count(b"\n") - d.count(b"\r\n"))
nl_b = b"\r\n" if d.count(b"\r\n") else b"\n"

row = (
"| 巨钳螳螂三处判定缺陷修复（v4.377）：反伤分侧门、会心实际招式、技术高手威力折算 | "
"①反伤资格门旧用 OR 跨攻击种族（Atk<70||SpA<70），高物攻手因特攻低被误纳物理反伤流；②会心流特性按全学习集 learnOf 判定，能学≠会带，没带高暴击招也推狙击手；③技术高手被 <55 威力硬门在选招前剔除，威力折算前子弹拳（40）已被过滤，引擎从未评估 | "
"①物理双倍奉还68只看物攻、镜面反射243只看特攻、金属爆炸368保留OR；②会心降权与狙击手why改用流派实际招式 ctx.mvCtx，无ctx回退learnOf；③威力门之前先折算技术高手（含该天性且招基础威力1-60→pow×1.5）再过<55门 | "
"全库113个误纳反伤流派清除（流派4328→4215），17个首推会心流特性里16个误推纠正，66个技术高手物种的低威力招进入评估；22处配招变化逐招核对有效威力（ER威力与原版不同：碎岩ER基础60、劈瓦85）全部正确，无弱招换强招回归；offHist加权求和差恰好113闭合，无额外回归 |"
)

# 锚点：v4.376 行末尾（表格最后一行），在其后插入新行
anchor = "门禁流派数/dup/fatal/defOrb/offHist 全部不变，死特性标注 56→47 |".encode("utf-8")
assert d.count(anchor) == 1
pos = d.index(anchor) + len(anchor)
d = d[:pos] + nl_b + row.encode("utf-8") + d[pos:]
open(P, "wb").write(d)
print("done; CRLF", d.count(b"\r\n"), "bareLF", d.count(b"\n") - d.count(b"\r\n"))
