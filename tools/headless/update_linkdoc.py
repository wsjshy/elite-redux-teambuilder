# -*- coding: utf-8 -*-
import io
P=r'D:\game\elite-redux\docs\dev\配队联动口径.md'
t=io.open(P,encoding='utf-8',newline='').read()
# 定位 v4.378 行（以其结尾标记为锚），在其后插入 v4.379 行；沿用该行行尾
marker="保留的 135 个欺诈流派性格全部正确（大胆130/悠闲5，修复前固执106/勇敢27）；过程中抓到并修复自引入的 _has492 变量泄漏；无空物种、dup/fatal/defOrb 全 0 |"
assert t.count(marker)==1,t.count(marker)
# 确定该行结尾
i=t.index(marker)+len(marker)
# 向后找换行符
if t[i:i+2]=='\r\n': nl='\r\n'
elif t[i:i+1]=='\n': nl='\n'
else: nl='\n'
row=(
"| 速攻手移除队伍级天气/场地开启招（v4.379）：手动开体系收口、SOLAR 蓄力招替换、天气依赖特性换常驻 | 玻璃大炮/速攻手回合金贵，天气/场地是队伍级辅助，自己花回合开等于浪费输出回合；没有队友提供就不依赖该体系，而非手动开。架构澄清：18029 setter 门仅在 MECH_COMBO 展示、build 生成路径不按队友 setter 移除手动招，本版让答案卡对齐 B⑥-4 原则 | 门控 side∈{物理,特殊,双刀} 且 role∈{增伤,输出,强化}、速≥100、非恶作剧之心、ownAutoSys 为空：①setup 招（8 招 id 集）从 pickAttacks 补槽，优先异属性/非蓄力/威力≥70/命中≥90；②第二遍替换 SOLAR 集{76 日光束,632 日光刃}；③换特性（abiSysOf 非空且非设置手，或描述含天气词+增益词），候选取 pickAbiFor 第一个无体系/设置且非坏的；④hasConstantPart 混合放行（反先制/入场极光幕/免疫/替身等常驻效果不判死）；⑤名首∈雨晴沙雪去前缀 | 全库 40 条速攻流派收口（32 速攻+8 强化遗漏），换出常驻特性 25 条（#1520 燃烧 id512、#229 熔岩 id357、#2672 埋伏 id435）；不变的均为常驻特性（大地束缚/速度之力/穿透/龙颚/破格/魔法防守/北风）或无好备选（#1090 拨雪）；能力按 id 取描述（102 个 abiSysOf 未分类，如雪隐/暴风雨）；流派 4193→4192（#947 同玩法合并），残留天气招 0，EV/性格沿用速攻模板，无回归 |"
)
t=t[:i]+nl+row+t[i:]
io.open(P,'w',encoding='utf-8',newline='').write(t)
print('inserted with nl',repr(nl),'CRLF',t.count('\r\n'),'bareLF',t.count('\n')-t.count('\r\n'))
