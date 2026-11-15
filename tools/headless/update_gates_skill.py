# -*- coding: utf-8 -*-
import io
P=r'C:\Users\22210\AppData\Local\Doubao\User Data\Default\.doubao\agent_mode\workspace\.user_skills\er-teambuilder-dev\references\gates.md'
t=io.open(P,encoding='utf-8',newline='').read()
sec=(
"\n## 十、速攻手队伍级天气/场地收口（v4.379，别再重扫）\n"
"- 原则：速攻手/玻璃大炮回合金贵，天气/场地是队伍级辅助，应由队友提供；没有队友就不依赖，而不是自己花回合开。例外：恶作剧之心（变化招先制）、自身特性自动开（ownAutoSys 非空）。\n"
"- 探针：进攻流派手动带 8 招（240/241/201/258/580/581/604/641）125 条，速≥100 非恶作剧 32 条；门控扩到 role=强化 后 +8，目标 40。func 槽 0。\n"
"- 架构坑：18029 行 setter 门在 MECH_COMBO 仅展示、build 生成路径不按队友 setter 移除手动招（实测带#37 六尾黑鲁加仍带大晴天）；本版让答案卡对齐 B⑥-4 原则。\n"
"- 规则（side∈物理/特殊/双刀 且 role∈增伤/输出/强化、速≥100、非恶作剧、ownAutoSys 空）：①setup 招从 pickAttacks 补槽，优先异属性/非蓄力 CHARGE_REG/威力≥70/命中≥90；②第二遍替换 SOLAR 集{76,632}；③换特性（abiSysOf 非空且非设置手，或描述含天气词+增益词），候选取 pickAbiFor 第一个无体系/设置且非坏的；④hasConstantPart 混合放行（反先制/入场极光幕/免疫/替身等常驻不判死）；⑤名首∈雨晴沙雪去前缀。\n"
"- 能力按 id 取描述：102 个 abiSysOf 未分类（雪隐 id81、暴风雨 id935），展示名与规范名常不一致（空中飞人=606、水合=315、炮术=377、压制=328）。\n"
"- 结果：40 流派收口，换出常驻特性 25 条（#1520 燃烧512、#229 熔岩357、#2672 埋伏435），不变的均为常驻或无好备选（#1090 拨雪）；EV/性格沿用速攻模板。\n"
"- 门禁基线（v4.379）：物种 1906 / 流派 4192（#947 同玩法合并 2→1），empty 空、fatal0、badMove1、dup0、itemsOver0、defOrb0、速攻残留天气招 0（verify_prod_zero.js）。\n"
)
t=t+sec
io.open(P,'w',encoding='utf-8',newline='').write(t)
print('appended, CRLF',t.count('\r\n'),'bareLF',t.count('\n')-t.count('\r\n'))
