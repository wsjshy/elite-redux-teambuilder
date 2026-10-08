# -*- coding: utf-8 -*-
"""一次性补丁：把交付报告中的行号更新为「终版核对值」，并追加 §5.6/§5.7 与 附录 A。
每处替换都打印命中数（应为 1），未命中即报错，避免静默漏改。
"""
import io, sys

P = r'D:\game\elite-redux\docs\战斗分析\_验证证据\_引擎升级B节_交付报告_20261006.md'
raw = io.open(P, 'rb').read()
crlf = b'\r\n' in raw
s = raw.decode('utf-8').replace('\r\n', '\n')

R = [
# ---- §1 头注 ----
("## 1. B1~B10 逐项完成情况（函数 / 行号）\n",
 "## 1. B1~B10 逐项完成情况（函数 / 行号）\n"
 "\n> **行号说明**：本节行号为实施期快照；收尾时 §1.12 的别名解析修复使 L400 之后代码整体下移（+2/+5），部分内层行号当时也为近似值。\n"
 "> 本次已按**脚本核对**更新为终版行号，权威对照表见 **附录 A**（脚本 `_行号核对_终版.py`，输出 `_行号核对_终版.txt`）。\n"),

# ---- B1 ----
("- 函数：`defCellTrio(s,at)` **L938-966**；本次新增分支 **L950-961**。",
 "- 函数：`defCellTrio(s,at)` **L943-971**；B1 勾选分支 **L955-966**（天性叠加判定 **L964-966**）。"),
("生效口径 = `base + 天性 add 属性（L954-955）+ 勾选特性 add/im/hf（L956-958）` 之后再叠加天性 im/hf（**L959-961**：`if(ih.im[at]==='天性')opt=0; else if(ih.hf[at]==='天性')opt*=0.5;`）。勾选只覆盖「同池其它可选特性」，不顶掉天性；未勾选分支（L962+）逻辑与改造前一致。",
 "生效口径 = `base + 天性 add 属性（L959-960）+ 勾选特性 add/im/hf（L960、L962-963）` 之后再叠加天性 im/hf（**L964-966**：`if(ih.im[at]==='天性')opt=0; else if(ih.hf[at]==='天性')opt*=0.5;`）。勾选只覆盖「同池其它可选特性」，不顶掉天性；未勾选分支（**L967+**）逻辑与改造前一致。"),

# ---- B2 ----
("`coreIntensity` **L1721** `var phys=b[1]+b[2],spec=b[3]+b[4];` + **L1723-1724** 判定式为",
 "`coreIntensity` **L1727** `var phys=b[1]+b[2],spec=b[3]+b[4];` + **L1729-1730** 判定式为"),
("`coreRole` L1657 肉盾角色用 `b[0]+b[2]+b[4]>=300`、`genBuilds` L2014 肉盾流派用 `>=270`。",
 "`coreRole` **L1663** 肉盾角色用 `b[0]+b[2]+b[4]>=300`、`genBuilds` **L2020** 肉盾流派用 `>=270`。"),
("`renderCore` **L2098** 增加", "`renderCore` **L2104** 增加"),

# ---- B3 ----
("- 新增 `costOf(s,m,hasRec)` **L428-441**：", "- 新增 `costOf(s,m,hasRec)` **L431-444**："),
("（`wxConditionMet` L427）", "（`wxConditionMet` **L429**）"),
("- 消费点：`pickAttacks` 分层3 **L1811/L1814**（`c.mul` 入乘积）、**L1822/L1824**（tags 进「选招依据」）；招式详情 `openMv` **L703-713** 展示",
 "- 消费点：`pickAttacks` 分层3 **L1817/L1820**（`c.mul` 入乘积）、**L1828**（tags 进「选招依据」）；招式详情 `openMv` **L702-712** 展示"),

# ---- B4 ----
("- 函数：`hitAdjOf(m)` **L409-415**。", "- 函数：`hitAdjOf(m)` **L411-417**。"),

# ---- B5 ----
("- `convOf(s)` **L395-405**（天性优先于可选池，返回 `{type,abi,scope}`）、`effMvType(s,m,conv)` **L407**",
 "- `convOf(s)` **L397-408**（天性优先于可选池，返回 `{type,abi,scope}`；**§1.12 起改用 `abiTagOf` 解析，兼容别名型译名**）、`effMvType(s,m,conv)` **L409**"),
("- 评分：`pickAttacks` **L1809-1810**（`convHit = conv && m[3]==='一般'`；`stab = 本系 || (convHit && ABI_ATE.stabConvert)` → ×1.6）、**L1814** 末尾 ×1.05。",
 "- 评分：`pickAttacks` **L1815-1816**（`convHit = conv && m[3]==='一般'`；`stab = 本系 || (convHit && ABI_ATE.stabConvert)` → ×1.6）、**L1820** 末尾 ×1.05。"),
("标 **「-ate 属性转换(倍率待实测)」**（L1816）", "标 **「-ate 属性转换(倍率待实测)」**（**L1822**）"),

# ---- B6 ----
("- `FUNC_MV` **L1578-1592**：`hazard` 补 **564 黏黏网**（现 4 招：191/390/446/564）；新增 **`removal=[229,432]`**",
 "- `FUNC_MV` **L1584-1598**：`hazard` 补 **564 黏黏网**（现 4 招：191/390/446/564，**L1590**）；新增 **`removal=[229,432]`**（**L1591**）"),
("- `MV_TAGS` **L1593** 增 `removal:'除钉'`；`funcWeight` **L1595-1609**：",
 "- `MV_TAGS` **L1599** 增 `removal:'除钉'`；`funcWeight` **L1601-1615**："),
("- UI：招式详情 `openMv` **L704-712** 用 `var mid=m[0]*1`", "- UI：招式详情 `openMv` **L712** 用 `var mid=m[0]*1`"),

# ---- B7 ----
("- 新增 `isValidSp(s)` **L388-393**：", "- 新增 `isValidSp(s)` **L388-393**（脚本核对：`isValidSp(` 共 7 处命中 = 1 定义 + 6 接入）："),
("统一接入 **6 处**：`addToTeam` **L817**、队伍体检补位建议 **L1196**、`tplRecs`（模板推荐）**L1459**、`findTeammates`（队友推荐）**L2045**、`coreMatch`（核心列表）**L2223**、`renderCore` 入口护栏 **L2077**",
 "统一接入 **6 处**：`addToTeam` **L822**、队伍体检补位建议 **L1201**、`tplRecs`（模板推荐）**L1464**、`findTeammates`（队友推荐）**L2051**、`coreMatch`（核心列表）**L2229**、`renderCore` 入口护栏 **L2083**"),

# ---- B8 ----
("消费点：战术模板卡 **L1525**（「机制数值（读 WCONF 口径表）」块）、`renderCore` 天气/场地数值卡 **L2177-2179**、机制口径折叠块 `initRuleBoxes()` **L2264-2275**",
 "消费点：战术模板卡 **L1531**（「机制数值（读 WCONF 口径表）」块）、`renderCore` 天气/场地数值卡 **L2182**、机制口径折叠块 `initRuleBoxes()` **L2270-2281**"),
("模板 **tips**（`renderTplBody` L1526 → `wxTip`）+ 模板 **flow／开局流程**（L1500 → 本次修正为 `wxTip(f)`",
 "模板 **tips**（`renderTplBody` **L1532** → `wxTip`）+ 模板 **flow／开局流程**（**L1506** → 本次修正为 `wxTip(f)`"),
("`wxTip` 重写规则 L376-385 覆盖", "`wxTip` 重写规则 **L376-385** 覆盖"),

# ---- B9 ----
("函数区间 **L1795-1903**（`atkCover` L1761-1770 / `setCoverProfile` L1772-1786 / `blindList` L1787-1789 / `whyHtml` L1790-1793 / `funcWeight` L1595-1609 / `pickFuncs` L1610+ / `weatherAdjOf` L442-464 / `abiAdjOf` L465-490）。",
 "函数区间 **L1806-1863**（`atkCover` **L1767** / `setCoverProfile` **L1778** / `blindList` **L1793** / `whyHtml` **L1796** / `funcWeight` **L1601** / `pickFuncs` **L1616** / `weatherAdjOf` **L444** / `abiAdjOf` **L470-498**）。"),
("`genBuilds` **L1993-2037**（`sideOK` 内联）+ `mkBuild`；双刀 **L2012-2014**",
 "`genBuilds` **L1999-2043**（`sideOK` 内联）+ `mkBuild`；双刀 **L2018-2019**"),
("| 分层2 候选池 | **L1802-1811** | 按侧过滤（`side!=='双刀'` 时只收对应分侧，L1806）",
 "| 分层2 候选池 | **L1811-1813** | 按侧过滤（**L1812**：`side!=='双刀'` 时只收对应分侧）"),
("| 分层3 多维打分 | **L1812-1825** |", "| 分层3 多维打分 | **L1815-1831**（score **L1820**） |"),
("| 分层4 覆盖贪心 | **L1828-1854** |", "| 分层4 覆盖贪心 | **L1833-1861**（v 值 **L1842**、首槽本系 +30 **L1843**、回填1 **L1850-1855**、回填2 **L1857-1861**） |"),
("| 分层5 盲点检查升级 | `blindList` + `renderCore` **L2127-2156** |", "| 分层5 盲点检查升级 | `blindList` **L1793** + `renderCore` **L2133-2157** |"),
("| 输出「选招依据」 | **L1815-1823**（数据）+ `whyHtml` |", "| 输出「选招依据」 | **L1821-1831**（数据）+ `whyHtml` **L1796** |"),

# ---- B10 ----
("- 天气/场地数值卡：`renderCore` **L2177-2179**、模板卡 **L1525**、口径折叠块 **L367**（`wxRuleHtml` 内）。",
 "- 天气/场地数值卡：`renderCore` **L2182**、模板卡 **L1531**、口径折叠块 **L367**（`wxRuleHtml` 内）。"),
("新增 CSS `.rulebox` / `.whylist` / `.badge-pend` / `.badge-warnimm` **L121-130**；`initRuleBoxes()` **L2264-2275** 三处注入",
 "新增 CSS `.rulebox` / `.whylist` / `.badge-pend` / `.badge-warnimm` **L121-130**（注释）；`initRuleBoxes()` **L2270-2281**（定义 L2270、调用 L2281）三处注入"),

# ---- §1.11 ----
("| `openMv` **L704-712** |", "| `openMv` **L712**（`var mid=m[0]*1`；标签体 L709-717） |"),
("规则块 **L361**、注释 **L1584**、**L2180**", "规则块 **L361**、注释 **L1590**、**L2186**"),
("| `renderTplBody` **L1500** |", "| `renderTplBody` **L1506** |"),
("bu 实测（重载 `?v=316` 后）", "bu 实测（重载 `?v=316` 后）"),

# ---- §1.12 修正自身行号 ----
("- `convOf`（B5，**L395-408**）", "- `convOf`（B5，**L397-408**）"),
("- `abiAdjOf`（B9 分层3，**L470-499**）", "- `abiAdjOf`（B9 分层3，**L470-498**）"),
("**未改动（属既有路径，改动面超出 B 节，登记待裁定，见 §5.7）**：`pickAbiFor` L1666、`coreIntensity` L1709、`buildMoves` L1968、详情抽屉 `abiDesc` L592。",
 "**未改动（属既有路径，改动面超出 B 节，登记待裁定，见 §5.7）**：`coreAbiPick` **L1671**、`coreIntensity` **L1714**、`pickAbiFor` **L1973**、详情抽屉特性 chip `abiDesc` **L597**（终版脚本核对：`abiIdByZhOrEn` 调用点 = L597 / L1671 / L1714 / L1973，共 4 处）。"),
]

for old, new in R:
    n = s.count(old)
    print(('OK  ' if n == 1 else 'WARN'), n, '|', old[:64].replace('\n', '\\n'))
    if n >= 1:
        s = s.replace(old, new, 1)

# ---- 追加 §5.6 / §5.7（插在 §6 复现路径之前）----
add = """### 5.6 C-3「雷电云天气体系」与数据事实不符（本次核查结论，**规格描述有误**）

规格 C-3 写「多流派渲染：…雷电云**天气体系**」，本次核查**不成立**，且**不生成天气体系流派是正确行为**：
- 官方数据：特性 **354 Weather Control** 的 lDesc = `Negates all weather based moves from enemies.`（**反制对方天气招式**，非布雨/布场特性）；`ERDATA.abilities[354] = ["354","Weather Control","天气掌控","对方天气相关招式无效"]`。
- 雷电云-灵兽（id **1677**）特性池：inns=`兆级电压 / 天气控制 / 蓄电`，abis=`电晶体 / 过载 / 海洋霸主` → 与 `SYS_MAP`（L1579-1581）/`SYS_SET`（L1582）**无任何命中** → `coreSys(1677) = []` → `genBuilds` 不出天气体系流派（实测 3 流派：输出/特殊、输出/物理、输出/双刀）。
- 对照（体系流派确实会开）：**鳃鱼龙**（abis 含「悠游自如」）→ `coreSys = ["雨"]` → 5 流派含「天气/物理」；**Storming**（天生 降雨）→ 天气设置手（雨）。
- 雷电云虽可学 **求雨（240）**，但无任何天气协同/设置特性，故不为其开天气体系流派 —— 符合规格 B9「**沿用 genBuilds 开流逻辑**」（开流条件要求特性侧 `sys.length > 0`）。
- 结论：规格 C-3 的该条应理解为「多流派渲染正常」，不应以「雷电云天气体系」为验收点；**未改代码**（若要求「会天气招即开体系流」，属开流规则变更，需另行对齐）。

### 5.7 特性名解析双轨（`ABI_ALIAS` 仅被 `NM2ID` 消费）—— 已修 B5/B9 路径，既有 4 处登记

- 现状：引擎有两套解析器 —— `abiTagOf(n)`（读 `NM2ID`，L1387-1389 把 `ERDATA.abiAlias` **419 条别名**并入）与 `abiIdByZhOrEn(n)`（L291，**仅比对特性表规范中/英文名**）。物种表沿用 v0.3 译名（「水合」「鸟群」「天气控制」「过载」「海洋霸主」…）属别名型 → 走 `abiIdByZhOrEn` 的调用点对这些名字解析为 **null**。
- 量化（bu 实读终版页面）：别名型名称**未解析的宝可梦 1,725 只 / 4,017 个名称槽位**（样例 妙蛙种子/妙蛙草/妙蛙花 各 1、小火龙/火恐龙/喷火龙 2~3）；其中 **conv 标签条目 27 条**、**out 标签条目 249 条**。
- **本次已修（属 B5/B9 规格要求未满足，非扩范围）**：`convOf`（**L397-408**）、`abiAdjOf`（**L470-498**）改用 `abiTagOf`；见 §1.12（断言 3 条 + bu 目视）。
- **登记未改（既有路径，改动会改变既有推荐结果，需先对齐）**：`coreAbiPick` **L1671**、`coreIntensity` **L1714**、`pickAbiFor` **L1973**、详情抽屉特性 chip 描述 `abiDesc` **L597**。
  影响：这 4 条路径对上述 1,725 只的**强度倍率（out/def/phy/nt）、特性评分、特性 chip 点击描述**会漏用别名型条目（如 雷电云「过载」=电力过载 349、「海洋霸主」=389 的标签不参与评分）。**建议**：把这 4 处统一改为 `abiTagOf`（一行改动 ×4），但会改变既有推荐输出，待用户确认后再做。

"""
anchor = "## 6. 复现路径（线性可重跑）"
assert anchor in s, '未找到 §6 锚点'
s = s.replace(anchor, add + anchor, 1)

# ---- 追加 附录 A ----
appendix = """
---

## 附录 A：终版行号对照（脚本核对，权威）

核对方式：`python docs\\战斗分析\\_验证证据\\_行号核对_终版.py` → 输出 `_行号核对_终版.txt`（源文件 `build_tool_html.py`，终版 **2,293 行 / 144,914 bytes**）。下列为脚本直接输出的起始行。

| 常量 / 函数 | 行 | 常量 / 函数 | 行 | 常量 / 函数 | 行 |
|---|---|---|---|---|---|
| `WCONF` | 299 | `isValidSp` | 388 | `coreRole` | 1651 |
| `ABI_ATE` | 318 | `convOf` | 397 | `coreTags` | 1690 |
| `WCONF_PEND` | 320 | `effMvType` | 409 | `coreIntensity` | 1711 |
| `pendBadge` | 324 | `hitAdjOf` | 411 | `atkCover` | 1767 |
| `pct` | 325 | `ownWxList` | 419 | `setCoverProfile` | 1778 |
| `TERRAIN_DMG` | 329 | `wxConditionMet` | 429 | `blindList` | 1793 |
| `WX_NEVERMISS` | 331 | `costOf` | 431 | `whyHtml` | 1796 |
| `wxNums` | 333 | `weatherAdjOf` | 444 | `pickAttacks` | 1806 |
| `terrainNums` | 337 | `abiAdjOf` | 470 | `buildMoves` | 1910 |
| `wxRuleHtml` | 341 | `openMv` | 702 | `coreAbiPick` | 1668 |
| `wxTip` | 376 | `addToTeam` | 821 | `pickAbiFor` | 1970 |
| `IMMUNE_RISK` | 905 | `abiTagOf` | 910 | `genBuilds` | 1999 |
| `defCellTrio` | 943 | `renderAnalyze` | 1075 | `findTeammates` | 2044 |
| `NM2ID` | 1387 | `tplRecs` | 1460 | `renderCore` | 2081 |
| `renderTplBody` | 1490 | `SYS_MAP` | 1579 | `initRuleBoxes` | 2270（调用 2281） |
| `SYS_SET` | 1582 | `FUNC_MV` | 1584 | `MV_TAGS` | 1599 |
| `funcWeight` | 1601 | `pickFuncs` | 1616 | `coreSys` | 1645 |

子锚点（脚本 + grep 核对）：B1 天性叠加 **L964-966**（勾选分支 L955-966）｜B3/B6 除钉标签 `var mid=m[0]*1` **L712**｜`FUNC_MV.hazard` **L1590**、`FUNC_MV.removal` **L1591**、removal 权重 0 **L1603**｜B8 tips 过 `wxTip` **L1532**、flow 过 `wxTip` **L1506**、模板「机制数值」块 **L1531**｜B9 分层2 侧过滤 **L1812**、分层3 `score` **L1820**、分层4 覆盖贪心 **L1835-1848**｜B10 天气数值卡 **L2182**、耐久口径文案 **L2104**、renderCore 入口护栏 **L2083**、机制口径折叠块 `details` **L367**｜`isValidSp(` 命中 7 处 = L388 / L822 / L1201 / L1464 / L2051 / L2083 / L2229｜`abiIdByZhOrEn(` 命中 4 处（+定义）= L597 / L1671 / L1714 / L1973｜`abiTagOf(` 调用 = L910 定义 + L958 / L1670 区（defCellTrio、三口径、反查）+ §1.12 新增 L402 / L474 / L482。
"""
if '## 附录 A：终版行号对照' not in s:
    s = s.rstrip('\n') + '\n' + appendix

out = s.replace('\n', '\r\n') if crlf else s
io.open(P, 'w', encoding='utf-8', newline='').write(out)
print('写入完成，CRLF =', crlf, '| 新字节 =', len(out.encode('utf-8')))
