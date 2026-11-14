# -*- coding: utf-8 -*-
PATH = r"D:\game\elite-redux\README.md"
with open(PATH,"rb") as f: t=f.read().decode("utf-8")
nl = "\r\n" if "\r\n" in t else "\n"

anchor = "![超级巨钳螳螂 顺风强化清场答案卡](docs/shots/v4377_scizor_fix.png)"
assert t.count(anchor)==1

bullet = [
"- **修复黑鲁加欺诈流误配：高速特殊攻击手不再被当成欺诈物反流**。有玩家对超级黑鲁加的默认「欺诈物反流」三问：欺诈流是什么、真存在吗、欺诈适合黑鲁加吗、黑鲁加不算肉盾。欺诈（Foul Play）是真实合法的恶系物理招，但它按**对方物攻**结算，正统用法是给不投资攻击的耐久防守宝可梦反制物攻手；用在特攻140、速度125、耐久三角仅255的黑鲁加身上当核心就是误配。修复：①新增高速攻击手硬门（最高攻击种族≥110且速度≥100即剔除），全库精确移除22个速攻手（耿鬼、超梦、黑鲁加、甲贺忍蛙、达克莱伊等），慢速高耐久宝可梦保留欺诈用法；②欺诈流性格不再被通用块从正确的「大胆」覆盖成无用的「固执」，保留的135个流派性格全部正确（大胆130/悠闲5）；③黑鲁加旧欺诈流的死特性太阳之力随流派移除自动消解，它收敛为单一晴增伤清场特殊流，太阳之力在大晴天加特殊招下才真正生效。",
"",
"![超级黑鲁加 晴增伤清场答案卡](docs/shots/v4378_houndoom_fix.png)",
]
insert = nl + nl.join(bullet)
t = t.replace(anchor, anchor + insert)

with open(PATH,"wb") as f: f.write(t.encode("utf-8"))
print("README updated, size", len(t.encode("utf-8")))
