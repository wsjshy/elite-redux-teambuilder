# -*- coding: utf-8 -*-
import io
P=r'C:\Users\22210\AppData\Local\Doubao\User Data\Default\.doubao\agent_mode\workspace\.user_skills\er-teambuilder-dev\references\engine-map.md'
t=io.open(P,encoding='utf-8',newline='').read()
sec=(
"\n## v4.379 新增锚点（行号会微移，用 Grep 重取）\n"
"- 生产块在 `finalizeBuildInPlace` 内（evNatureLinkV437 之后，自包 try/catch `catch(eV4379)`，变量前缀 `_v9`）。触发：side∈{物理,特殊,双刀}、role∈{增伤,输出,强化}、速≥100、非恶作剧之心、ownAutoSys 为空。\n"
"- 8 招 setup 集 new Set([240,241,201,258,580,581,604,641])；SOLAR 集 {76,632}；CHARGE_REG 排除蓄力；WXWORDS 描述过滤；hasConstantPart 混合放行。\n"
"- 依赖函数：pickAttacks（补槽富对象）、pickAbiFor（候选 {n,id,sc,why}）、abiSysOf/abiSetOf/abiSetExt、famAbiRuleOf、ownAutoSys、mvKindOf。\n"
"- 新增流派标记：b.weatherSelfRemoved、b.abiSwappedForWeather、b.namedByMoves、b.nameMismatch。\n"
"- 关键坑：18029 setter 门仅 MECH_COMBO 展示；能力按 id 取描述（abiSysOf 有 102 个未分类）；v4.338 条件特性校准块（16107–16117）会把无 famAbiRule 协同的新特性打回，故选特性要选真协同或无 famAbiRule 的中性常驻。\n"
"- 代表：#1520 燃烧512、#229 熔岩357、#2672 埋伏435。harness_dbg 已导出 famAbiRuleOf。\n"
)
t=t+sec
io.open(P,'w',encoding='utf-8',newline='').write(t)
print('appended, CRLF',t.count('\r\n'),'bareLF',t.count('\n')-t.count('\r\n'))
