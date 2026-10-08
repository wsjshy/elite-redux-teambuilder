# 配招助手 v4.6C 页面全量检视与 UI 优化报告

> **检视对象**：`D:\game\elite-redux\配招助手_ER.html`
> **基准**：2,323,395 B / 5,325 行（行号均指该 HTML 文件自身行号）/ mtime 2026-10-08 10:03:28 / SHA256 `68267F09A0BD6A5124EAD553CEC78741E74E810D40773AB0C5D104938ED7ED0`
> **检视方式**（独立、只读）：Node VM 渲染（自建 DOM stub + `vm` 沙箱加载内嵌 script，实际调用 `renderSp/renderMv/renderAtk/renderDef/renderTm/renderAbi/renderTpl/renderTplBody/renderCore/renderNeedPlan/selectCore/initRuleBoxes` 等入口并取渲染面 innerHTML）+ 静态代码审查（HTML 标记、`<style>` L7–197、内嵌 script）。
> **纪律声明**：**未读** `build_tool_html.py` / `build_tool_data.py` 实现源码；**未依赖**实施方自报测试；**未改动**任何既有项目文件（本报告为新增产出）。行号/类名/控件 id 依据一律取自本基准版本。
> **玩家友好总原则（2026-10-08 更正）**：**多图少文** —— 卡片以**精灵图为视觉主体**，文字精简为「结论 + 要点」，详情折叠展开。（此前任务书中的「少图多文」为笔误，本报告已按更正口径执行；T1 相关建议已同步改写。）
> **部署前提（追加）**：v4.6 完成后将部署 **GitHub Pages 供手机访问** → 相对路径扫描与响应式适配准则逐项核对见 **§7 部署硬前提核对**（作为部署前必须核对项）。
> **行号提示**：本版内嵌 script 共 4,983 行；HTML 行号 = script 行号 + 342（script 起始于 HTML L343 `<script>` 之后）。本报告统一用 **HTML 行号**。

---

## 0. 页面骨架（检视基线）

| 项 | 实测 | 依据 |
|---|---|---|
| `<style>` 块 | L7–197（191 行，含注释） | — |
| 断点 | **仅 1 条**：`@media (max-width:640px)` L119–126 | — |
| 导航 | `<nav>` L203–211，7 个 `<button data-tab=…>` | L204–210 |
| Tab 内容区 | 7 个 `<section class="tab">`：`tab-poke` L215 / `tab-move` L229 / `tab-type` L249 / `tab-team` L260 / `tab-abi` L298 / `tab-tpl` L305 / `tab-core` L311 | — |
| Tab 切换 | `switchTab(name)` L1074–1077（仅切 `.active`） | — |
| 默认 Tab | **「宝可梦」**（L215 `class="tab active"`、L204 nav `active`） | — |
| 渲染入口 | 15 个 `render*`：`renderSpChips` L1084 / `renderSp` L1124 / `renderMvSp` L1277 / `renderMv` L1303 / `renderAtk` L1382 / `renderDef` L1401 / `renderTm` L1460 / `renderSlots` L1501 / `renderAnalyze` L1742 / `renderAbi` L2101 / `renderTplBody` L2647 / `renderTpl` L2720 / `renderNeedPlan` L4953 / `renderCore` L5078 / `renderCoreTypes` L5246 | — |
| 顶层函数 | **314** 个 | 静态 |
| 表格 | **11** 张 `<table>`（L240/495/1214/1748/1792/1884/2693/5092/5153/5198/5210） | 静态 |
| 弹层体系 | `.modal`（居中轻量 modal）L163–166；`#mvDrawer` L241（招式详情）；词条 modal 动态建于 L1155 | — |
| 图片策略 | 精灵图相对路径 `assets/sprites/sp<id>.png`，缺图隐藏不破版（注释 L44–46）；尺寸 24–64px | — |

**结构结论**：7 Tab 骨架清晰、id 命名规范、`render*` 分工明确；主要问题集中在 **文案面向开发者**、**同类交互两套实现**、**表格响应式缺口**、**同一内容多处重复渲染**、**一处 Tab 内三套队友推荐并存**，以及一批**迁移残留的死 CSS / 死函数 / 死 id**。

---

## 1. 全局发现项

| ID | 级别 | 位置（行/类/id） | 现象（实测证据） | 建议 |
|---|---|---|---|---|
| **G1** | **中** | 生成 L494；注入 `initRuleBoxes()` L5308；容器 `#ruleBoxTeam`(由 L295 挂载) / `#ruleBoxCore` / `#ruleBoxTpl`(L308) | **同一张机制口径表被注入 3 个 Tab**：实测三容器 innerHTML **均为 6,167 字符且内容相同**（标题「📐 机制口径（WCONF / ABI_ATE · 源：docs/战斗分析/_机制默认口径表.md）」+ 三列表格）。合计重复渲染 ≈ 18.5k 字符 | **保留 1 处**（建议放「核心配队」或改为全局统一入口），另 2 处改为一行摘要 + 「查看机制口径」链接（点击切到该 Tab 并展开）；或保留 3 处但共享一次渲染结果 |
| **G2** | **中** | L494 标题与"参数"列；`#tplRuleTip` L307（赋值 L5308 区） | **面向玩家的文案里出现内部符号与开发过程语**：①标题印 `WCONF / ABI_ATE` 与内部文档路径 `docs/战斗分析/_机制默认口径表.md`；②"参数"列印变量名 `WCONF.manualDurTurns`、`WCONF.abilityBoost`；③"当前值"列写「8 回合（**v2.65 源码实证** 8，**changelog 记 5**）」；④`#tplRuleTip`（实测 **618 字符**）含「读 **WCONF** 口径表 · **v2.65+ 源码考古**」「**源码未找到**」「**待游戏内截图校准**」「**v4.x：数据契约：新字段齐备**」。全库计数：`源码实证` 63 / `源码考古` 7 / `数据契约` 3 / `源码未找到` 3 / `待游戏内截图校准` 3 / `docs/战斗分析` 3 | 玩家面重写为「效果 / 数值 / 依据（源码 · 口径表 · 待实测）」三列；把"源码考古 / changelog / 数据契约 / 源码未找到"这类过程语收进「开发者说明」折叠区或删除；`docs/…` 路径不面向玩家。**「待实测」徽标本身保留**（见 §4 硬约束） |
| **G3** | **中** | `th,td{white-space:nowrap}` L64；`main{max-width:1200px}` L20；11 张表 | **11 张表中仅 3 张有横向滚动容器**，且实现两种：`class="scroll"`（L86）包裹 → L494→L495（机制口径表）、L1745→L1748（防守剖面）、L1791→L1792（进攻覆盖）；L2693 用内联 `style="overflow-x:auto"`；**其余 7 张无包裹**：`#mvTable` L240（8 列）、L1214 获得招式表、L1884 补位建议表、L5092 核心画像表、L5153 配招表、L5198 / L5210 队友表 | 全部表格统一包 `.scroll`；移动端补 `th,td{white-space:normal;word-break:break-word}`（或仅放宽关键列）；L2693 的内联写法改回 `.scroll` 类，统一口径 |
| **G4** | 低 | `@media` L119–126；`nav` L17 / `header` L14 | 断点只有 1 条（≤640px），**641–1024（平板/窄窗）无任何适配**；≤640 时 `nav{width:100%}` + `nav button{flex:1}`（L122–123）7 个按钮靠 `flex-wrap` 折行，`header{position:sticky}`（L14）叠加后占屏较高 | 补 641–1024 断点；≤640 时 nav 改横向滚动（`overflow-x:auto;flex-wrap:nowrap;white-space:nowrap`）或图标化；压缩 sticky 区高度（h1 已降至 15px，可再隐藏副标题 `.tag` L16） |
| **G5** | 低 | `.card` L39 / `.tplcard` L109 / `.needcard` L175 / `.slot` L78 / `.teambox` L77 / `.mxc` L153 | 同类卡片**圆角已基本统一**（10px / 8px 两档），但内边距档位偏多：14 / 12 / 10 / 8 / 6 / 4 / 3 / 2px 并存 | 抽出间距/圆角 token（`--pad-1..3`、`--radius-1..2`），只改数值不改结构 |
| **G6** | 低 | `<style>` 全块；`.badge-*` L88–102、L107–108 | **颜色 token 覆盖不足**：硬编码 hex **105 处 / 唯一 66 个**，而 `var(--…)` 用 92 次、`:root` 仅 9 个变量（L8–11）；`rgba()` 5 处、`!important` **0**（良好）。66 个唯一色中约 20 个为属性色（必要），其余语义色（`#f8f9fb #eef2ff #f0f4ff #fce4ec #e8f5e9 #fff8e6 #f3f4f6 #111827` 等）建议提取。另**"强调"徽标 6 种并存**：`.badge-pick` L97 / `.badge-opt` L93 / `.badge-pend` L101 / `.badge-warnimm` L102 / `.badge-super` L99 / `.badge-4x` L92 | 加背景/悬浮/成功/警示/中性 5 类语义变量；徽标语义归并并在样式注释里固化用法（避免新手加样式时再分叉） |
| **G7** | 低 | `switchTab()` L1074–1077；对照 `selectCore()` L5239 | `switchTab` 只 toggle `.active`：**不重置滚动位置、不写 URL hash、无过渡**。从长页（核心配队单只详情实测渲染 **422,653 字符**）底部切 Tab 会停在页面中部；而 `selectCore` 自带 `window.scrollTo(0,0)` → 行为不一致 | `switchTab` 内加 `window.scrollTo(0,0)`（或按 Tab 记忆滚动位置）；可选加 `location.hash` 同步（可分享/浏览器回退） |
| **G8** | 低 | nav L203–211；默认 active L215/L204；存档按钮 L266 | **首要入口未突出**：默认 Tab 是「宝可梦」；「核心配队」在 nav **末位**；用户明确的「存档联动（B 功能）」入口 `📂 解析存档 .sav`（L266，`--warn` 橙底）**埋在「队伍构建」Tab 的 `.bar` 内**。附：`#savFile` L267 `hidden` + 内联 `display:none` 重复，可只留 `hidden` | ①「核心配队」提到 nav 第 1–2 位并设默认 active；②「📂 解析存档」提升为 header 级全局按钮（B 功能上线时一并做）；③清理 `#savFile` 的重复隐藏写法 |
| **G9** | 低 | L280（`#saveCsv` placeholder）、L2044（alert 文案）、L2776 等 | **旧管线/内部编号进入用户可见文案**：`存档解析v4` ×2（「粘贴 存档解析v4 CSV 文本」「需要 存档解析v4 的 CSV」）→ 建议改「导入存档解析 CSV（含 来源 / 图鉴编号 列）」；`v45-3` ×3（已记于复验报告 §15 的 v451-1，本文不重复计） | 统一改写为玩家语言 |
| **G10** | 信息 | 模板 18 名（`#tplList` L306 渲染）vs 流派 18 名（核心配队流派卡） | **两套并列的"打法式"命名**：模板 = 雨天速攻/晴天速攻/沙暴联防/雪天堡垒/电气场地速攻/精神场地特攻/青草场地回复/薄雾场地龙盾/强化清场轴/顺风游击/戏法空间/钉子受队/毒钉受队/强化接力/天气双核/场地控制/吸血站场/双天气轮换；流派 = 晴强化清场/晴增伤清场/钉子强化清场… | 在「战术模板」Tab 顶部加一句关系说明（模板 = 现成骨架；流派 = 按核心动态推导），或统一词汇。**两者内容本身均合规，建议保留** |
| **G11** | **中** | `gotoItem()` L2776 | **道具跳转用原生 `alert()`**：`alert('【'+name+'】\n'+(it?it[3]||'(无描述)':'（未收录）'))`。而词条详情走 `.modal`（L1155 + `.mbox` L165）、招式详情走 `#mvDrawer`（L241）。`gotoItem/gotoAbi/gotoMv` 各 **6 次**出现（含定义，即约 5 处 chip 调用点）→ 玩家在流派卡/配招表里点**道具** chip 与点招式/特性 chip 的反馈形式完全不同 | 改为复用 `.modal`：标题=道具中文名，正文=英文名 + `ITM[id][3]` 效果描述；顺带解决「无描述/未收录」的空态提示 |
| **G12** | 信息 | L2113 | 调试残留扫描：`console.*` **仅 1 处**且为 `console.warn`（`abiTagLines()` try/catch 守卫）；`debugger` **0**；`TODO/FIXME` **0**（早先计数 4 为招式英文描述 "Hack…" 误命中）→ **无调试残留，无需清理** | 保留 |

---

## 2. 逐 Tab 发现项

### T1「宝可梦」`#tab-poke` L215–227
| 级别 | 位置 | 现象 | 建议 |
|---|---|---|---|
| 低 | `#spSearch` L217 / `#spSort` L218 / `#spTypeChips` L223 | 只有搜索 + 排序 + 属性 chips，**无定位/特性筛选**（`#tmRole`/`#tmAbi` 在队伍构建 Tab、`#coreRole`/`#coreMv`/`#coreAbi`/`#coreFinal`/`#coreTypes` 在核心配队 Tab 已有同类控件） | 复用同一批筛选控件（同构、减负）；或明确「宝可梦 Tab = 全图鉴浏览，筛选在配队 Tab」的定位说明 |
| 低 | `.card`/`.nm`/`.en`/`.bs` L39–43 | 卡片 = 精灵图（`.spcard` 64px）+ 中/英名 + 种族总值，方向与「**多图少文**」一致；但**图偏小、要点偏少**（缺"属性/定位"两个结论性要点） | 保持图为主体：`.spcard` 64px → 移动端可放大至 88–112px（`.spcard`/`.spbox` L45–47）；文字只留**结论性要点**（属性徽标 `tlabel()` L353 + 定位/特性一行），其余一律进详情（`openSp()` L1141 区）折叠 |
| 信息 | `#spMore` L226/L1141 | 文案「已显示 N/M，滚动加载更多」✓ 清晰；但样式用内联 `style="text-align:center;color:var(--sub);padding:10px"`，与 L287/L335 三处重复 | 抽 `.morehint` 类（3 处共用） |
| 保留 | `.gl` L128–129 + 词条 modal L1155 | 词条标蓝 + 悬浮 tooltip + 点击开居中 modal（`.gl:hover::after` 用 `data-g`）——用户硬约束 | **保留** |

### T2「招式反查」`#tab-move` L229–247
| 级别 | 位置 | 现象 | 建议 |
|---|---|---|---|
| 低 | `#mvDrawerTitle` L244 | 该 id 全文件**仅出现 1 次**（仅标记处）→ **弹窗标题恒为「招式详情」，不显示所选招式名** | 渲染详情时写入 `$('mvDrawerTitle').textContent = 招式中文名`（1 行） |
| 中 | `#mvTable` L240 | 8 列（#/招式/属性/分类/威力/命中/PP/先制）+ 全局 `white-space:nowrap`，**未包 `.scroll`** → 窄屏溢出（同 G3） | 见 G3 统一处理 |
| 低 | `.bar` L230–239 | 4 个 `number` 输入（`#mvPowMin/Max`、`#mvPpMin`、`#mvPrMin`）+ 2 select + 搜索 + 计数同排 | 4 个数值框收进「高级筛选」`<details>`（与"减负"一致） |
| 保留 | `tr.mv` + `.mvdesc` L66–69；`.split` L30 + `splitLabel()` L354 | 行点击就地展开描述（`tr.mv.open + .mvdesc{display:table-row}`）✓；分类徽标由 `splitLabel` 输出 `split-PHYSICAL/SPECIAL/STATUS`，**运行时拼接、在用** | **保留** |

### T3「属性克制」`#tab-type` L249–258
| 级别 | 位置 | 现象 | 建议 |
|---|---|---|---|
| 低 | `.sec` L250 / L254 | 两个视角块共用 `.sec`（仅 `--line` 下边框），**无更强分隔**；两块之间缺少"作用域"提示 | 加分组标题底色或 `<hr>`；在块首注明「进攻=打出去 / 防守=被打」 |
| 信息 | 与 T4 `renderAnalyze()` L1742/L1748/L1792 重叠 | 队伍构建 Tab 也输出「防守剖面 / 进攻覆盖」矩阵 → 与本 Tab 主题部分重叠，但口径不同（队伍级 vs 全局） | **登记不动**；建议在队伍构建那两个表头注明「队伍级口径（仅当前 6 只）」 |
| 保留 | `.mxinline` L146、`.mxgrid/.mxc/.mcx/.mcnm` L152–159、`.ktable/.kgroup/.k2/.k05/.k0` L70–74 | 克制格**就地展开**（非右抽屉）+ 按实际承受倍率分组（免/0.5/1/2/4）+ 精灵图 + 倍率徽标 + 攻/防两视角内容不同 —— 用户已验收 | **保留** |

### T4「队伍构建」`#tab-team` L260–296
| 级别 | 位置 | 现象 | 建议 |
|---|---|---|---|
| 中 | L266 `📂 解析存档 .sav`、L268 `📥 粘贴 CSV` | 存档联动入口在 Tab 内 `.bar`，与「首要入口」定位不符（同 G8②） | 提升为 header 全局入口；本 Tab 保留"分析当前队伍"结果区 |
| 中 | `alert()` L2003 / L2033 / L2034 / L2038 / L2040 / L2044 / L2062 | 解析/导入全路径用**原生 alert**（失败原因、行数回执）→ 与 `.modal` 体系不一致、阻塞、无法选中复制 | 失败改内联 `.tip`（或 toast）；成功回执改结果区内的状态行 |
| 低 | `#csvPanel` L279–282 / `#saveCsv` L280 | 文案「更省事：直接点上方 📂 解析存档 选 .sav 文件」偏口语但可懂；`存档解析v4` 需改（G9） | 文案统一 |
| 低 | `#tmSlots` L291 / `exportTeam()` L1555 | 槽位 `.slot` L78–81 + `.slot.empty` L81 ✓；导出用 `alert('已复制队伍配置：…')` 弹全文（长文本不适） | 改为轻提示 + 结果区预览 |
| 保留 | `.teamwrap/.teambox` L76–77（min-width 280px 自适应堆叠）、`.tmfilter` L271–278、`#tmAnalyze`（含 `#ruleBoxTeam`）、`.savebox` L114、`.poolbox/.poolrow` L183–191 | 双栏布局、货架筛选、防守剖面/进攻覆盖、导出 —— 硬约束 | **保留** |

### T5「特性反查」`#tab-abi` L298–303
| 级别 | 位置 | 现象 | 建议 |
|---|---|---|---|
| 低 | `.owners` L115、`.abicard.open .owners` L116、`.owrow` L117、`.owrow:hover` L118 | 这 **4 条样式在整份文件中零引用**（持有者区块已改用 `.abicol` L142–143 + `abiOwnerCol()`，渲染面实测 L2125「持有者（分两列：可选池 / 天性固定）」）→ 迁移残留 | 删除这 4 条；**保留** `.abicard`（L2114 `card.className='abicard'` 在用） |
| 保留 | `renderAbi()` L2101、`.abid` L62、`.abicol` L142–143 | 卡片点击 → 详情卡（中文描述 + 战斗意义 + 持有者两列）—— 硬约束 | **保留** |
| 待核 | 持有者条目点击行为 | `.owrow` 死样式后，持有者条目的点击跳转实现位置未逐项核（本次未取到证据） | 列入"登记不动"，交主 Agent/实施方确认是否已有「点击持有者 → 图鉴」 |

### T6「战术模板」`#tab-tpl` L305–309
| 级别 | 位置 | 现象 | 建议 |
|---|---|---|---|
| **中** | `renderTplBody()` L2647 → L2675「推荐宝可梦（按体系维度分 Top 6，点击入队）」+ L2691 `renderNeedPlan(recs[0].s)` | **同一模板卡内两套候选推荐并存**（体系维度 Top6 + 需求驱动方案卡），口径不同、按钮同为入队 | 二者择一为主展示，另一降为折叠「另一种口径」；或在两处标题里写明差异（详见 M6 登记与复核） |
| **中** | `#tplRuleTip` L307（实测 618 字符） | 文案含内部符号与开发过程语（G2 ④，原文已列） | 玩家面重写；过程语进「开发者说明」折叠区 |
| 低 | `.tplcard` L109–112（click + `.open`）vs `<details class="big">` L130–135 | **两种展开机制并存**：模板卡用 click 切类，流派卡用原生 `<details>`（实测模板区 `details` 数 = 0）→ 键盘可达性/一致性差异 | 模板卡改用 `<details class="big">`（改动小、获得原生键盘与展开语义） |
| 保留 | `#tplList` + 18 张 `.tplcard`（实测 18） | 模板 18 套可见、命名=打法 —— 硬约束 | **保留** |

### T7「核心配队」`#tab-core` L311–…
| 级别 | 位置 | 现象（实测） | 建议 |
|---|---|---|---|
| **中** | `renderCore` L5078 → L5206 `renderNeedPlan(s)`；L5208/L5210「推荐队友（…Top 6，…点击入队）」；流派卡内「本流派队友（…）」 | **同一 Tab 三处队友推荐**：①各流派卡内差异化队友（实测标题「本流派队友（特殊向 / 强化）」「本流派队友（特殊向 / 增伤）」）②方案卡（**15 个 `.needcard` + 6 个 `.slotbody` 成员**）③整体 Top 6 表（实测 6 行：席多蓝恩#485 / 莱希拉姆#643 / 超级喷火驼#1532 / 超级喷火龙Y#1503 / 班基拉斯R#2561 / 太阳岩#338）。**口径不一致**：方案卡「体系总览」推荐天气手「向日花怪（自动开晴（干旱））」，而 Top6 首位是「席多蓝恩 #485 +46」→ 同页两个"第一推荐" | **登记不动（硬约束）**，建议二选一后再合并：把 Top6 降级为方案卡内「其他候选（整体联防口径）」折叠区，或保留 Top6 但在表头注明「整体评分，非按需求逐槽填充」 |
| **中** | `#coreOut` | 单只核心渲染 **422,653 字符**（2 张流派卡 `details.big` + 15 需求卡 + 6 成员 + Top6 表 + 口径表）；文档总量 2,323,395 B | 流派卡默认仅首张展开（现 `.rec` 已 `open` ✓）；对流派卡内 chip/候选做「展开全部」渐进披露；候选池 `.poolscroll`（L185，max-height 220px）已折叠 ✓ 沿用 |
| 低 | `#coreMore` L335/L5296 | 文案「共 N 只，显示前 60（可缩小筛选）」✓ 清楚；样式内联（同 T1 的 `.morehint` 建议） | 抽类 |
| 保留 | 筛选组 `#coreSearch/#coreSort/#coreRole/#coreMv/#coreAbi/#coreFinal/#coreTypes` L313–335；`details.big` L130–135（首张 `.rec` 高亮 + open）；`.bigsub` L136；配招表 L5153；对位 `why`（`title`）；词条联动 | 需求驱动 / 对位抽检 why / 词条悬浮 / 详情卡 / 就地展开 —— 硬约束 | **保留** |

---

## 3. 死代码 / 残留清单（默认只登记，不擅自删除）

### 3.1 死 CSS（**零引用，建议删除** —— 共 15 条声明块）

| 类 | 行 | 说明 |
|---|---|---|
| `.drawer` / `.drawer.open` / `.drawer .close` | L50 / L51 / L52 | 右抽屉体系已被「就地展开 + 居中 modal」取代（同文件 L145 注释即写该定稿） |
| `.mxlist` / `.mxrow` / `.mxrow:hover` / `.mxhd` | L137 / L138 / L139 / L140 | 旧抽屉式列表样式，现用 `.mxinline/.mxgrid/.mxc`（L146–159） |
| `.tgrid` | L170 | v4.2 卡片演进残留（现用 `.needcard`/`.slotbody`/`.slothead` L174–181） |
| `.slotcard` / `.slotcard>summary` / `.slotcard>summary .badge` | L171 / L172 / L173 | 同上 |
| `.owners` / `.abicard.open .owners` / `.owrow` / `.owrow:hover` | L115 / L116 / L117 / L118 | 持有者列表旧样式，现用 `.abicol` |

> 判定方法：对每个类名在 `<style>` 块之外做**原始子串搜索**（本文件内类名均由字面字符串写出，无 `'t-'+x` 式拼接——已用 `'t-'`/`'split-'`/`'badge-'` 等拼接模式搜索验证为 0），零出现者判死。见 §7 自纠：**首次扫描的"79 个零引用类"为误报**，已修正。

### 3.2 死 JS 函数（**零引用**，314 个顶层函数中的 11 个）

| 函数 | 行 | 备注 |
|---|---|---|
| `sysBenefitNames()` | L834 | 未见引用 |
| `spFields()` | L871 | 未见引用 |
| `anyAbiId()` | L2819 | 未见引用 |
| `coreNature()` | L2989 | 未见引用 |
| `coreMoves()` | L3183 | 未见引用 |
| `itemIsWeather()` | L4053 | 未见引用（另有 `WX_SYS` 承载同义判断） |
| `itemIsTerrain()` | L4054 | 同上 |
| `evioWhy()` | L4158 | 未见引用（与既往 Z5 口径一致：渲染面理由由「未过门/反超/进化型凭道具」承载） |
| `needRegistryOk()` | L4319 | 未见引用 |
| `isAbilSetAny()` | L4480 | **建议保留**：定义为 `isSetterAny` 的兼容壳，带明确意图注释「v4.3：统一委托 isSetterAny（单一真值源）」 |
| `fillForNeed()` | L4649 | 未见引用 |

> 建议：**先登记**。除 `isAbilSetAny` 外，其余可删；但需实施方确认无分支/规划调用（`function` 声明可能被将来代码或字符串方式调用）。

### 3.3 死 DOM id（零引用）

| id | 行 | 影响 |
|---|---|---|
| `#glBox` | L1156（词条 modal 内包装 div，动态 innerHTML） | 无害（仅标记） |
| `#teamPlan` | L4956（方案卡容器标记，实际写入 `#coreOut`） | 无害（仅标记） |
| **`#mvDrawerTitle`** | L244 | **用户可见**：标题不随招式变化 → 建议按 T2 修复 |

### 3.4 非死但易误判（**保留**，勿清理）

- `.t-一般/.t-格斗/…/.t-星晶/.t-无/.t-神秘`（L24–28）：属性数组实测含 **星晶 / 无 / 神秘**（`ERDATA.types` 20 项）→ 全部在用；生成器 `tlabel()` L353 运行时拼接 `class="t t-"+t`。
- `.split-PHYSICAL/SPECIAL/STATUS`（L30）：由 `splitLabel()` L354–356 运行时拼接。
- `tlabel()` 的**禁用路径注释**（L2987 / L4048，说明"历史上曾把标签当字面 HTML 渲染"的 D1 缺陷）：属防御性说明，**保留**，勿当"过期注释"清理。

---

## 4. 硬约束保留清单（本期一律不动）

| 功能 | 位置依据 | 状态 |
|---|---|---|
| 词条标蓝 + 悬浮 tooltip + 点击词条详情（居中 modal） | `.gl` L128–129、`class="gl"` 生成点 L777、modal L1155、`.modal/.mbox` L163–166 | 保留 ✓ |
| 招式中文描述 / 天性可点击看描述 / 特性详情卡（中文描述 + 战斗意义 + 持有者两列） | `renderMvSp` L1277、L2125 持有者两列、`abiOwnerCol()` | 保留 ✓ |
| 流派卡大卡片 + 点击展开（含招式/特性/道具 chip 跳转） | `details.big` L130–135、`gotoMv/gotoAbi/gotoItem` 各约 5 调用点 | 保留 ✓（道具跳转形式另见 G11 建议） |
| 克制页点击 → **就地展开**（非右抽屉）+ 倍率分组 + 精灵图 + 徽标 | `.mxinline` L146、`.mxgrid/.mxc` L152–159、`.ktable` L70–74 | 保留 ✓ |
| 攻 / 防两视角内容不同 | `renderAtk` L1382 / `renderDef` L1401、L250/L254 标题 | 保留 ✓ |
| 需求驱动构建逻辑（方案卡 / 零硬门 / 紧凑队） | `renderNeedPlan` L4953、`buildTeamByNeeds` | 保留 ✓ |
| 对位抽检 `why`（「能打什么｜代价｜原则 P…」） | `.abi` chip `title`、`.whylist` L105 | 保留 ✓ |
| 使用率先验标注（「原版使用率 ≠ ER 使用率」） | L494 区 `ERDATA.usageMeta` 行、`usagePrior` 7 处 | 保留 ✓ |
| 模板 18 套 + 流派命名=打法（18 名，禁物/特二分） | `renderTpl` L2720、流派卡 summary | 保留 ✓ |
| 存档解析 + 5 锚点口径 | `parseSavFile` L267、`#savParseOut` L283、`importSaveBox()` L2038 区 | 保留 ✓ |
| 「待实测」徽标（诚实性资产） | `pendBadge()` L442（7 处调用）、`.badge-pend` L101 | 保留 ✓（仅建议去掉其 `title` 内的文档路径） |

---

## 5. 登记不动（交主 Agent 复核，本期不动）

| 编号 | 事项 | 依据 | 为什么不动 |
|---|---|---|---|
| **R1** | 核心配队 Tab 内 **三处队友推荐并存**（流派卡内队友 / 方案卡 6 成员 / 整体 Top6 表），且"第一推荐"不一致（向日花怪 vs 席多蓝恩 +46） | T7 实测；L5206/L5208 | 三者口径不同（流派内差异化 / 需求驱动 / 整体联防），**合并属产品决策**；用户硬约束要求"明确要过的功能一律保留" |
| **R2** | 「推荐队友 Top6」(核心配队 L5208) 与「推荐宝可梦 Top6」(战术模板 L2675) **两处同构列表、术语不统一** | T6/T7 | 同上，先统一术语再谈合并 |
| **R3** | 战术模板 Tab 内 **Top6 + 方案卡** 并存 | `renderTplBody` L2675/L2691 | 同 R1 |
| **R4** | 机制口径表 3 处重复（G1） | `#ruleBoxTeam/#ruleBoxCore/#ruleBoxTpl` 均 6,167 字符 | 若用户认为"每个 Tab 都能就地查口径"有价值 → 保留；建议由主 Agent 定 |
| **R5** | 属性克制（全局属性表）与队伍构建的「防守剖面/进攻覆盖」（队伍级矩阵）主题重叠 | T3/L1742 区 | 口径不同，非重复 |
| **R6** | 死函数 11 个（§3.2） | 静态零引用 | 可能是将来分支预留；删除属"确定冗余"才做 |
| **R7** | 特性反查「持有者条目点击跳转」实现位置 | 本次未取证 | **未核实前不评价**（列入待核） |

---

## 6. 改动清单建议（供实施代理执行）

> 全部为**表现层/文案层**改动，不触数据层与构建管线；建议按 P1 → P3 顺序执行，每项后跑一次 `node --check` + 现有断言（基线 289 不降）+ 目视 7 Tab。**P1-D 为 2026-10-08 追加的部署前置项（GitHub Pages / 手机）**。

### P1（中级别，建议本轮或下轮修）

| # | 位置 | 动作 | 验收点 |
|---|---|---|---|
| P1-1 | L494 标题与「参数」列；`#tplRuleTip` L307 | 玩家化改写：去 `WCONF/ABI_ATE`、去 `docs/…` 路径；"参数"列改为人话（如"天气回合数"）；「源码实证 / changelog 记 / 数据契约 / 源码未找到 / 待游戏内截图校准」收进「开发者说明」折叠区 | 7 Tab 内不再出现 `WCONF.`、`docs/战斗分析`、`changelog`、`数据契约` 字样；`pendBadge` title 无路径 |
| P1-2 | `initRuleBoxes()` L5308 区 + `#ruleBoxTeam/#ruleBoxCore/#ruleBoxTpl` | 3 份 → 1 份主展示 + 2 处一行摘要/链接（或共享渲染） | 同一口径表页面内只渲染 1 次完整表 |
| P1-3 | 11 张表（L240/1214/1884/5092/5153/5198/5210 未包；L2693 内联写法） | 统一包 `.scroll`；补移动端 `th,td{white-space:normal;word-break:break-word}` | 640px 宽下 7 Tab 无页面级横向滚动 |
| P1-4 | `gotoItem()` L2776 | 原生 alert → 复用 `.modal`（标题=道具名，正文=英文名 + 效果描述） | 点道具 chip 出现居中 modal，与词条/招式一致 |
| P1-5 | nav L203–211 + 默认 active L215/L204 | 「核心配队」前置并设默认；`#savFile` 去掉重复 `display:none` | 打开页面即见核心配队；nav 顺序变化 |
| P1-6 | 队伍构建 `alert()` L2003/2033/2034/2038/2040/2044/2062 | 失败 → 内联 `.tip`/toast；成功 → 结果区状态行 | 上述路径不再阻塞弹窗 |
| P1-7 | `#mvDrawerTitle` L244 | 打开详情时写入招式名 | 标题显示所选招式中文名 |

### P1-D（部署前置 · 2026-10-08 追加，详见 §7）

| # | 位置 | 动作 | 验收点 |
|---|---|---|---|
| P1-D1 | 部署目录（不在 HTML 内） | 复制 `配招助手_ER.html` → `index.html`（与 `assets/sprites/` **同级**）；新增空 `.nojekyll` | 打开站点根 URL 直达应用；无 Jekyll 处理 |
| P1-D2 | 同 P1-3（手机必修） | 11 张表统一包 `.scroll`；≤640 内 `th,td{white-space:normal;word-break:break-word}` | 360px 宽下无页面级横向滚动（§7 b5） |
| P1-D3 | `nav button` L18 / `.btn` L83 / `.btn-mini` L85 / `.chips button` L36 / `.abi` L60 / `.slot .x` L80 / `tr.mv`(`th,td` L64) / `.modal .close` L194 / `.badge-pick·.badge-pickable` L97–98 / `.poolbox .pin` L184 | ≤640 媒体查询内提尺寸：`min-height:44px`（可折中 ≥40px）+ 加大 `padding`；`.modal .close` → 40×40px | 触控目标 ≥44px（§7 b6） |
| P1-D4 | `body` L11 `font-family` / `html` / §7 b7 的 15 处 11px | 字体族补 `"PingFang SC","Noto Sans CJK SC"`；加 `html{-webkit-text-size-adjust:100%}`；≤640 内把 `.whylist/.slotinfo/.ruleline/.tagline/.mcnm` 11px → ≥12px | iOS/Android 中文正常字形；横竖切换不缩放；要点文字可读 |
| P1-D5 | img 模板 3 处未带 lazy/onerror（§7 a8） | 统一 `<img … loading="lazy" decoding="async" onerror="this.hidden=true">` | 移动端流量与缺图兜底一致（低） |

### P2（低级别，可并入同一轮）

| # | 位置 | 动作 |
|---|---|---|
| P2-1 | §3.1 十五条死 CSS（L50–52 / L115–118 / L137–140 / L170–173） | 删除；删后跑一次视觉回归（7 Tab 目视 + `details/summary`/表格/徽标） |
| P2-2 | §3.2 死函数（除 `isAbilSetAny`） | 登记后由实施方确认再删 |
| P2-3 | `switchTab()` L1074–1077 | 加 `window.scrollTo(0,0)`（或记忆滚动）；可选 hash 同步 |
| P2-4 | `@media` L119–126 / `nav` L17 | 补 641–1024 断点；≤640 nav 横向滚动/图标化；压缩 sticky 高度 |
| P2-5 | `.tplcard` L109–112 | 改用 `<details class="big">`，与流派卡统一展开语义 |
| P2-6 | `#spTypeChips` 区（宝可梦 Tab） | 增加定位/特性筛选（复用核心配队那一组） |
| P2-7 | `#tmMore/#spMore/#coreMore` L226/287/335 | 抽 `.morehint` 类替代三处内联样式 |
| P2-8 | 文案：L280、L2044 | `存档解析v4` → 中性表述 |

### P3（视觉规范，可选）

| # | 位置 | 动作 |
|---|---|---|
| P3-1 | `<style>` 全块（105 处 hex / 66 唯一） | 提语义变量（背景/悬浮/成功/警示/中性）；保留属性色硬编码 |
| P3-2 | `.card/.tplcard/.needcard/.slot/.teambox/.mxc` | 间距/圆角 token 化（圆角已基本统一） |
| P3-3 | `.badge-pick/.badge-opt/.badge-pend/.badge-warnimm/.badge-super/.badge-4x` | 归并"强调"语义并在样式注释固化用法 |
| P3-4 | 属性克制 L250/L254 | 加分组视觉分隔 + 作用域提示 |
| P3-5 | 战术模板 Tab 顶部 | 加「模板 vs 流派」一句关系说明（G10） |

---

## 7. 部署硬前提核对（GitHub Pages / 手机竖版访问）

> 追加需求（2026-10-08）：v4.6 完成后将部署 GitHub Pages 供手机访问。本节为**部署前必须核对项**，结论全部来自只读实测（探针 `probe_v46h.cjs` / `probe_v46i.cjs`，日志同名 `.log`；PowerShell 目录/体积实测）。

### 7.1 （a）相对路径与资源引用 —— 全库扫描

| # | 核对项 | 实测（同一基准版本） | 判定 |
|---|---|---|---|
| a1 | 资源路径构造点 | `function sprOf(id){return 'assets/sprites/sp'+id+'.png'}`（L1163 区，**唯一定义**） | ✅ 纯相对路径 |
| a2 | `src="…"` 使用点 | 仅 2 处：L1165 `sprImg()`、L1169 `sprRaw()`，均 `<img src="'+sprOf(id)+'" …>`（无写死的 `src="assets…"`，计数 0） | ✅ |
| a3 | 绝对路径 / 盘符 | `C:\` = 0、`D:\` = 0、`../` = 0、`file://` = **1（仅注释 L1161「与 HTML 同目录，file:// 可显示」）** | ✅ 引用侧无绝对路径 |
| a4 | 外链依赖 | `http://` = 0、`https://` = 0（**零外链**：无 CDN、无字体、无外链图） | ✅ 离线可用 |
| a5 | CSS 资源 | `url(` = 0（无背景图/字体引用）；`href="` = 0（无 `<link>`；唯一 `a.href=` 为 CSV 导出用的 `URL.createObjectURL` blob，L2034 区） | ✅ |
| a6 | 与图库同目录 | `D:\game\elite-redux\配招助手_ER.html` ↔ `D:\game\elite-redux\assets\sprites\`（现存 1906 个 png） | ✅ 同目录树成立 |
| a7 | 图片覆盖 | `ERDATA.species` = 1906 条 / 唯一 id 1906 ↔ 目录内 png 1906 → **缺图 0、孤儿 0** | ✅ 无成片空框 |
| a8 | 图片健壮性 | img 模板 5 处；带 `loading="lazy"` 2、带 `onerror="this.hidden=true"` 2 → 懒加载 + 缺图自动隐藏（不破版） | ✅（另 3 处未带 lazy/onerror，建议统一 → 低） |
| a9 | 体积 | 图库 5.2 MB（1906 张，均 2,844 B，最大 sp1028.png 6.9 KB）+ HTML 2,323,395 B = **合计 ≈7.4 MB** | ✅ Pages 友好；首屏成本主要是 2.3 MB HTML，图由 lazy 摊开 |

**结论：路径与资源侧全绿 —— 不改一行代码即可部署**。唯一附带项：a8 的 3 处 `<img` 未带 `loading="lazy"`/`onerror`（低，建议统一写法）。

### 7.2 （b）响应式适配准则逐项核对

| # | 准则 | 实测依据 | 判定 |
|---|---|---|---|
| b1 | viewport meta（**移动端前提**） | `<meta name="viewport" content="width=device-width, initial-scale=1">` L5 | ✅ |
| b2 | 媒体查询 | 仅 1 条 `@media (max-width:640px)` L119–126（内含 `header{position:static}`、`main{padding:10px}`、`.grid{minmax(110px,1fr)}`、nav `width:100%`）；**无 641–1024 档**（平板/窄窗不单独适配） | ⚠ 低（有断点但只有一档） |
| b3 | 弹性/自适应布局 | `flex-wrap`：`.bar` L14 / `.chips` L36 / `.teamwrap` L70 / `.abicol` L76 / `.needrow` L181 / `.slothead` L74 / `.poolbox` L183；grid `auto-fill minmax()` L38（≤640 降 110px） | ✅ PC/手机双端骨架成立 |
| b4 | 360px 窄屏下 7 Tab 可用性 | 内容宽 ≈332px：卡片网格 2 列 ✅；`.teamwrap`（min-width 280px）/`.abicol`（190px）自动堆叠 ✅；`.mxc` 76px → 4/行 ✅；`.modal .mbox{width:100%}`+`.modal{padding:16px}` ✅；nav 7 按钮 `flex:1`+`flex-wrap` → 折 2 行 ✅ **可用**；但 sticky header 折行后 ≈90–100px 占屏 | ⚠ 可用但偏挤 |
| b5 | **卡片/表格溢出** | 卡片 ✅；**8/11 张表未包 `.scroll`**（仅 3 张已包 + 1 张内联 `overflow-x:auto`），叠加 `th,td{white-space:nowrap}` L64 → 招式反查主表（L240，8 列）、配招表（L5153）、推荐队友 Top6 表（L5198/L5210）在 360px 下**撑破容器 → 页面级横向滚动** | ❌ **手机端主要不可用点**（= §1 G3） |
| b6 | **触控目标 ≥44px** | 声明值 + 1.2×字号估算：`nav button` L18（padding 6px 12px / 13px）≈**28px**、`.chips button` L36 ≈**18px**、`.btn` L83 ≈**28px**、`.btn-mini` L85 ≈**18px**、`.abi` chip L60 ≈**20px**、`.slot .x` 删除 L80 ≈**19px**、`tr.mv` 行（`th,td` L64 padding 5px 6px + 13px）≈**26px**【招式反查主点击目标】、`.badge-pick`/`.badge-pickable` L97/L98 ≈**16px**、`.modal .close` L194 **26×26px**、`.poolbox .pin` L184 ≈**17px**、`.needcard>summary` L176 ≈**16px**、`details.big>summary` L132 ≈**36px**（紧）。**达标者**：`.card`（含 64px 图）≈120px、`.mxc`（含 40px 图）≈62px、`.tplcard` ≈60px | ❌ **普遍不达标（9 类控件）** |
| b7 | 字体可读性 | `body` 14px ✅；**15 处 11px**：L29 `.split`、L42 `.card .en`、L82 `.slotinfo`、L101 `.badge-pend`、L102 `.badge-warnimm`、L105 `.whylist`、L114 `.savebox`、L129 `.gl`(tooltip)、L141 `.tagline`、L144 `.ruleline`、L157 `.mcnm`、L158 `.mcx`、L160 `.mxmore`、L184 `.poolbox .pin`、L186 `.poolrow`；`-webkit-text-size-adjust` **= 0**（iOS 横竖切换可能自动缩放）；`font-family:"Segoe UI","Microsoft YaHei",system-ui` → **未声明 iOS/Android 中文字体** | ⚠ 需补（见 P1-D3） |

**结论：布局骨架（弹性/网格/堆叠/viewport）达标，可支撑手机访问；三项不达标** —— ①表格横向溢出（b5，**部署前建议必修**）②触控目标（b6）③字号与字体族（b7）。

### 7.3 （c）部署准备建议（仅目录/文件，不改代码）

| # | 项 | 实测 | 建议 |
|---|---|---|---|
| c1 | 入口文件 | `D:\game\elite-redux` 下**无 `index.html`**（现有 assets / docs / ER-source / ER2.65简汉化 / nn_data / nn_models） | Pages 项目站点默认入口为 `index.html`；现文件名「配招助手_ER.html」为**中文**，直接访问的 URL 会编码成 `%E9%85%8D%E6%8B%9B…` 长串，且微信/内嵌浏览器对中文路径处理不稳 → **复制一份为 `index.html`**（原文件可保留） |
| c2 | Jekyll | **无 `.nojekyll`** | 默认走 Jekyll：会遍历 1906 张图 + 2.3 MB HTML，构建慢，且 `_` 前缀文件被忽略 → **添加空 `.nojekyll`** |
| c3 | 目录结构 | 本地已满足「HTML 与 `assets/sprites/` 同级」 | 部署时**保持同一层级**（勿把 HTML 单独放进子目录，否则相对路径全断） |
| c4 | 缓存 | `sprOf()` 生成的图片 URL 无版本参数（`?v=`） | 换图后受 Pages CDN 缓存影响 → 必要时加版本参数（低） |
| c5 | 404（可选） | 无 `404.html` | 需要更友好的错误页可加（可选） |

**部署判定：路径与资源侧无阻塞（结论：可部署）；上面 c1/c2 为"部署即应做"的准备动作，b5/b6 为手机体验必修项。**

---

## 8. 自纠披露（检视方法层面）

1. **首次静态扫描误报"79 个零引用 CSS 类"**：原因是正则要求类名前有 `.`（只匹配 `<style>` 内的定义），而 HTML 里类名出现在 `class="…"` 中；同时该文件内类名均由**字面字符串**写出（`'t-'`/`'split-'`/`'badge-'` 等拼接模式搜索均为 0），因此改用"`<style>` 块外原始子串计数"后，真死类仅剩 §3.1 的 6 组 15 条。**该误报未进入结论**。
2. **`.t-*` / `.split-*` 一度被判"零引用"**：经 `tlabel()` L353、`splitLabel()` L354 与属性数组（含 星晶/无/神秘）复核，确认在用 → 已列入 §3.4「非死但易误判」。
3. **表格 `.scroll` 包裹的初次判定过严**：同一行内找不到 `class="scroll"` 即判未包裹，导致 L495/L1748/L1792 三张被误判；复核其前置行 L494/L1745/L1791 后修正为 **3 张已包裹 + 1 张内联 overflow + 7 张未包裹**。
4. **属性 chip 输出为空不作结论**：`#spTypeChips` 在自建 stub 中 innerHTML 为空，但该处由 `createElement/appendChild` 构建 → 属 stub 局限，未据此判定缺陷。
5. **未取证项显式登记**：R7（持有者条目点击跳转）本次未取证，仅登记，不给结论。
6. **尺寸估算探针的 padding 双值解析 bug（已手工修正）**：`probe_v46i.cjs` 首版把 `padding:6px 12px` 当成"上下各 3px"（应上下各 6px），使 `nav button`/`.btn`/`.card`/`.tplcard` 等估高整体偏小（如 `nav button` 被算成 22px，实际 ≈27.6px；`.card` 被算成 37px，实际含 64px 精灵图 ≈120px）。§7 b6 采用的是**按声明值手工重算**的结果；未修正的原始输出保留在 `probe_v46i.log` 中，仅作过程留痕。
7. **图库体积/覆盖的取值口径**：`ERDATA.species` 取 VM 内实测条数（1906），与磁盘 png 数比对；VM 加载期因 stub 缺 `document` 抛过一次异常（`querySelectorAll`），但数据对象已就绪，不影响 a6/a7 结论（已由两路独立测量互证：species 1906 ↔ png 1906）。

---

## 9. 检视结论

- **无「阻塞」级问题**；页面骨架、硬约束功能、命名与 id 规范度整体良好（`!important` 0、`debugger`/`console.log`/`TODO` 0）。
- **中级别 6 项**：G1 口径表重复注入 / G2 玩家可见文案含内部符号与开发过程语 / G3 表格响应式缺口（8/11 未包裹 + 仅 1 条断点） / G11 道具跳转用原生 alert / T6-2 战术模板两套推荐并存（并入 R3）/ T7 核心配队三处队友推荐与口径不一致（并入 R1）——其中 **R1/R3 已按硬约束登记不动**，其余 4 项可直接实施。
- **低级别 9 项**、**信息级 5 项**；死代码 3 类（CSS 15 条 / JS 11 个 / id 3 个）附精确行号，除 `#mvDrawerTitle` 外均无用户可见影响。
- **玩家友好口径更正**：原则为「**多图少文**」（精灵图为卡片视觉主体，文字精简为结论 + 要点，详情折叠）；原任务书「少图多文」系笔误，本报告已全文更正（T1 建议同步改写）。
- **部署硬前提（§7）**：**相对路径与资源侧全绿**（唯一定义 `sprOf()` → `assets/sprites/sp<id>.png`；无外链 / 无盘符 / 无 `url()` / 无 `href`；图库 1906/1906 无缺图；合计 7.4 MB）→ **可部署**；响应式骨架达标，但 **b5 表格横向溢出（手机必修）**、**b6 触控目标普遍 <44px**、**b7 字号/字体族** 三项需补；部署准备需补 `index.html` 与 `.nojekyll`（c1/c2）→ 已列为 §6 的 **P1-D1…D5**。
- 报告与证据：本文件 + 探针日志 `probe_v46a–i.log`（会话工作区 `scratch\v4verify\`）。

> **后续**：实施代理按 §6 清单执行后，本代理可按新 SHA 重跑同一套探针（`probe_v46a–i.cjs`，SHA 一变即须重跑）复核，并核对 P1-1/P1-3/P1-4 与 P1-D1…D5 的验收点。

> **闭环状态（2026-10-08 12:3x 复核，基准 SHA `1C841B4F…FBC7` / 2,332,615 B / v4.6.1 收尾版）—— 检视清单已全部处理或明确登记**：`index.html`（同哈希）+ `.nojekyll` 就位；11/11 表格包 `.scroll` + 移动端换行与 12px 表内字号；移动端 ≤640 与**平板 641–1024 两档断点**（触控 ≥44px、批量 12px、`.spcard` 88/72px 多图少文、中文字体族）；**口径表由三处重复收敛为核心页 1 处完整表 + 队伍/模板页 2 处引用行（带「查看机制口径」跳转）**；**原生 `alert` 全部替换为 toast 轻提示**；**默认入口改为「核心配队」**（7 Tab 全留）；10px 声明清零、`tr.mv` 行高 ≥44px。逐项证据与判定见 `_v4独立复验_20261007.md` **§16（v4.6）、§17（v4.6.1 收口）**；R1/R3 仍登记待主 Agent 拍板。

---
*检视基准 SHA：`68267F09A0BD6A5124EAD5532CEC78741E74E810D40773AB0C5D104938ED7ED0`（2,323,395 B / 5,325 行）。若产物 SHA 变更，本报告的行号与计数须整体重取。*
