# v4.377：README 新增对外特性段落 + 截图
P = r"D:\game\elite-redux\README.md"
d = open(P, "rb").read()
print("CRLF", d.count(b"\r\n"), "bareLF", d.count(b"\n") - d.count(b"\r\n"))
nl_b = b"\r\n" if d.count(b"\r\n") else b"\n"

para = (
"- **修复巨钳螳螂三处判定缺陷：反伤误纳、狙击手误推、技术高手纳入评估**。有玩家对超级巨钳螳螂的默认「反伤后手流」提出质疑，审计后确认是三个独立引擎缺陷，全部修复：①反伤流不再用跨攻击类型的低门槛误纳高物攻手——物攻150的巨钳螳螂不再被塞进浪费物攻的物理反伤流，全库清掉113个误纳流派；②狙击手只在本流派真的带高暴击招时才推荐，不再因「能学」就误推；③技术高手现在会被真正评估——旧的威力硬门在加成前就把子弹拳过滤掉，引擎此前根本没评估过它。修复后巨钳螳螂收敛为单一顺风强化清场答案卡，配置完整、逻辑自洽。"
)
shot = "![超级巨钳螳螂 顺风强化清场答案卡](docs/shots/v4377_scizor_fix.png)"

anchor = "![小锻匠R 钉子减伤轴：死特性自动换成硬壳盔甲](docs/shots/v4376_dead_swap.png)".encode("utf-8")
assert d.count(anchor) == 1
pos = d.index(anchor) + len(anchor)
ins = nl_b + para.encode("utf-8") + nl_b + nl_b + shot.encode("utf-8")
d = d[:pos] + ins + d[pos:]
open(P, "wb").write(d)
print("done; CRLF", d.count(b"\r\n"), "bareLF", d.count(b"\n") - d.count(b"\r\n"))
