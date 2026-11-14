# -*- coding: utf-8 -*-
PATH = r"D:\game\elite-redux\docs\dev\配队联动口径.md"
with open(PATH,"rb") as f: t=f.read().decode("utf-8")
nl = "\r\n" if "\r\n" in t else "\n"

# 锚点：v4.377 行开头（整行唯一）
anchor_start = "| 巨钳螳螂三处判定缺陷修复（v4.377）"
idx = t.find(anchor_start)
assert idx>=0
# 找到该行结尾
end = t.find(nl, idx)
assert end>idx

row = ("| 黑鲁加欺诈流误配修复（v4.378）：速攻手资格门、欺诈性格、死特性 | "
"欺诈（Foul Play #492）按对方物攻结算，本是给不投资攻击的耐久防守宝可梦反制物攻手的 niche 招；旧资格门 mechFlowFit 只看物攻、不看特攻/速度/耐久，高速特殊攻击手（特攻140/速125/耐久三角255 的黑鲁加）被误纳且因机制流派 unshift 到最前成默认；通用性格块还把正确的大胆覆盖成对欺诈无用的固执 | "
"①新增高速攻击手硬门：max(Atk,SpA)≥110 且 Spe≥100 直接剔除（用最高攻击种族才能抓住特殊攻击手），慢速高耐久宝可梦保守保留；②通用性格块新增 Foul Play 分支（非空间大胆/空间悠闲）与应用门，新增标记变量必须在每条流派开头重置（_has492=false），否则成隐式全局污染后续物种；③物理欺诈流的死特性太阳之力随流派移除自动消解，晴特殊流里它才正确生效 | "
"全库精确移除 22 个速攻手（耿鬼/超梦/黑鲁加/甲贺忍蛙/达克莱伊等，流派4215→4193），保留的 135 个欺诈流派性格全部正确（大胆130/悠闲5，修复前固执106/勇敢27）；过程中抓到并修复自引入的 _has492 变量泄漏；无空物种、dup/fatal/defOrb 全 0 |")

t = t[:end] + nl + row + t[end:]
with open(PATH,"wb") as f: f.write(t.encode("utf-8"))
print("link-doc updated, size", len(t.encode("utf-8")))
