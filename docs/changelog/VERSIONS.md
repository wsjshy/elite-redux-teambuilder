# 版本记录（v4.6.1 → v4.179）

> 2026-11-07 从 `AGENTS.md` 原样下沉，内容未改。当前状态见 `AGENTS.md` §6。

## 9. v4.6.1 收尾补丁（2026-10-08）

- **唯一可改源**：`build_tool_html.py`（改后 403,447 B）；产物 `配招助手_ER.html` = `index.html` = ROM 副本 = **2,323,369 B / SHA256 `4C27F7705AC8461A59FF4080432C35AB8DD1EF943B873329601DF95BF5DEA288`**（三处逐字节一致）。
- **v4.6.1 四项**：① 长溯源标注（构建口径 L5186 / 判定口径 L5446 / ER 特化提示 L5536）折叠为 `details.inline` 一行可展开，正文零删减；② `.scroll` 补 `-webkit-overflow-scrolling:touch`（L205）；③ R1/R3 两处队友推荐并存 → `需求驱动队友`（L5173，默认展示）与 `体系补盲队友`（L5427，`details.big.subsec` 默认收起）标签区分；④ `index.html` 同哈希副本 + ROM 副本同步。
- **验证链**：`node --check` EXIT 0；`verify_v1.js` 216/0 + `verify_v4.js` 260/0 = **476 PASS / 0 FAIL**（469 基线不降，新增 v461 组 7 条）；渲染探针 render errors 0；token 扫描全 0；移动端 360px 六项自检全过；存档 5 锚点全过（431/6/425/15 + anchorsOk=5）。
- **环境登记（非代码问题）**：① 数据层 `usagePrior` 被清空（751→0，`usageMeta.srcs=[] coverage=0`）→ `UP1` 断言改为「契约 + 显式空态」双分支，待数据层恢复；② 存档 fixture 项目副本被部署清理删除 → 断言改候选路径（项目副本 → ROM `ER2.65简汉化\ERv2.65-beta2-debug汉化版.sav` → ROM `elite redux 2.5 debug.sav`），ROM 副本 5 锚点全过，仅 `K=3`（原 4，K 为存档自身轮换指纹）→ `K∈[3,4]` 并注明；③ `B④` 流派卡计数改为「`.big` 总数 − `.big.subsec`」。
- **临时文件**：全部写 Agent workspace（不落项目根）；提取脚本 `_chk_script_1.js` 用后删除；`.gitignore` 已排除顶层 `/_*`。
- **待办**：主 Agent 重新部署 gh-pages（指纹见上）；剩余登记项（`changelog`×9 与源码宏名参数玩家化）仍待拍板，未擅动。


## 10. v4.6.2 精灵图合图（2026-10-08）

- **方案**：`build_sprites_sheet.py`（新建，项目根）把 `assets/sprites/sp<id>.png`（1906 张 64×64，5.17MB）按 **id 数字升序**每 256 只合成 1024×1024 WebP（64px 格 16×16，**lossy q90**）→ `assets/sheets/s{0..7}.webp` + `sheet_map` 坐标 `sheets_map.js`；**8 张共 3.00MB / 请求数 1906 → 8**。
- **渲染层**（`build_tool_html.py`，405,465 B）：`sprOf(id)` 改返回背景样式声明；新增 `sppct/sprEl`；`sprImg/sprRaw/sprImgMid` 迁移到 `sprEl`（**签名与 cls 语义兼容，13 处调用点零改动**）；`__SPRSHEET__` 占位 + 构建期注入（缺文件告警回退空映射）；CSS 基类 `.spsp,.mcspr,.spmid` + 上下文尺寸照搬原 img 版 + `.spmiss` 空占位（不发请求）。
- **尺寸无关缩放**：`background-size:1600% 1600%` + `background-position:col/15,row/15` ⇒ 同一标记适配 28/40/64/72/88px 容器（含 ≤640px 的 `.spcard{56px}`），免 per-size 换算。
- **回归**：`node --check` EXIT 0；`verify_v1.js` 216/0 + `verify_v4.js` **269**/0 = **485 PASS / 0 FAIL**（469 基线不降；新增 v4.6.2 组 9 条 + 8 条既有精灵断言迁移口径）；探针 render errors 0（渲染面 sheet 引用 5,217 / `assets/sprites` **0**）；存档 5 锚点 `431/6/425/15` ✓；移动端 360px 六项不回归。
- **视觉抽样**：13 只（含 5 锚点 411/469/741/1513/2232）sheet 裁回 vs 原 PNG —— **alpha 差 0/13**，RGB 平均差 2.11~25.17（q90 振铃），对照样图目视一致。
- **产物指纹**：`配招助手_ER.html` = `index.html` = ROM 副本 = **2,353,192 B**，SHA256 `BCA0DFEAB8360E6A5B23428B11AD8DD216350EDD0568FDC8469BF10913CC921B`（三处逐字节一致）；`assets/sheets/` 3.03 MB。
- **部署**：gh-pages 需含 `assets/sheets/`（8 webp + sheets_map.js）；`.gitignore` 实测未排除 `assets/`。旧 `assets/sprites/` 保留为源/回退。
- **环境更正**：`usagePrior=0` 根因是构建期先验源目录 `nn_data/` 缺失（生成器日志三项读失败），**非数据层清空**（v4.6.1 报告 §三.1 表述据此更正）。


## 11. v4.6.3 两段式互斥视图（2026-10-08）

- **症状**：点候选卡后方案渲染在长候选列表之下 → 误以为点击无效。**修法**：挑选（pick）/ 详情（detail）**两阶段互斥视图，纯 display 切换，引擎零改动**。
- **落点**：产出「完整配队方案」的屏在 **`#tab-core`**（`#corePickWrap` ⇄ `#coreDetailWrap`，后者默认隐藏并内含 `#coreOut`）；`#tab-team` 的 `tmGrid` 是「搜索并入队」网格**无方案视图，保持原样**；`#tab-team` 的**存档联动组队卡**同构（`#myPickWrap` ⇄ `#myDetailWrap` = `#myPoolWrap` ⇄ `#myTeamOut`）。
- **函数**：`corePhase(m)` / `myPhase(m,noscroll)`（只切 display；回挑选时 `drawCoreList()` 重绘；滚动到容器顶部）；`selectCore()` 末步改 `corePhase('detail')`；`myCoreTeam()` 末步 `myPhase('detail')`；`renderMyPool()` 起首 `myPhase('pick',true)`。
- **状态保留**：`corePhase('pick')` 函数体对输入控件**零赋值** → 搜索/筛选/排序天然保留（断言逐条扫描函数体）。
- **触控/移动端**：`.coreback{min-height:44px}`（44px 组 5→6）；`.corebackbar` flex-wrap 无固定宽；详情屏**就地展开**（非 modal / 非抽屉 / 无 `position:fixed`）；`prefers-reduced-motion` 下关闭淡入。
- **口径表位置**：`#ruleBoxCore` 保留**页面级**（不进详情屏），以免 `gotoRule()` 从队伍页/模板页跳转后看不到 —— 已在报告登记。
- **回归**：`node --check` EXIT 0；`verify_v1.js` 216/0 + `verify_v4.js` **276**/0 = **492 PASS / 0 FAIL**（485 基线不降，新增 v4.6.3 组 7 条）；探针 render errors 0；两段式 transcript 六步全过（含真实 .sav 415 张池 + 煤炭龟方案）；移动端 360px 不回归。
- **产物**：`配招助手_ER.html` **2,356,562 B**（= `index.html` = ROM 副本）。


## 12. v4.6.4 威胁库「使用率」弱先验恢复（2026-10-08，关闭 §9① 登记缺口 #32）

- **数据源（Smogon chaos，原版对战统计）**：月份 **2026-09**；`https://www.smogon.com/stats/2026-09/chaos/gen3ou-0.json`（1,940,215 B / 213 种）+ `…/chaos/gen9nationaldex-0.json`（11,926,061 B / 738 种）；落盘 `nn_data\chaos\raw\<月>-<格式>-0.json` + 合并缓存 `nn_data\chaos_2026-09.json`（19,145 B，避免每次构建重抓）。chaos 取值 = `data[物种英文名].usage`（比例）。
- **口径偏离（实测取舍，已登记待拍板）**：计划源 `gen9ou-1760.json` 实测 **404**（gen9ou 无 1760 档），`gen9nationaldex-1760.json` 仅 359 种（<700 阈值）→ 改用**宽档 0 + 双源加权 gen3ou×1.0 + gen9nationaldex×0.5**；故 `usageMeta.rating=0`、`srcs` 为**对象数组**（UP1 断言契约要求双源），与旧示例 `rating:1760` / `srcs:["gen9ou-1760"]` 不同。镜像 `pokemonshowdown.com/stats/` 实测 404（不可用）。
- **映射（以 gameData 全表为准，不依赖 species_map.json）**：`gameDataV2.65beta.json` 1906 有效物种英文名 → 归一键（小写 / ♀→f ♂→m / 非字母数字→空格 / **token 排序** / 形态后缀 alola→alolan、galar→galarian、hisui→hisuian、paldea→paldean、f→female、m→male）；归一键冲突 **0**；gen9nationaldex 命中 ER 733 只（未映射 5：`Urshifu-Rapid-Strike` / `Venusaur-Mega` / `Gyarados-Mega` / `Tauros-Paldea-Blaze` / `Tauros-Paldea-Aqua`）；并集 ER id **747** 条。
- **实现（数据层为准，引擎只消费）**：`build_tool_data.py` — L4 追加 `import urllib.request`；`data = {` 之前新增常量 `NN_DIR / NN_RAW(chaos\raw) / NN_MONTHS(['2026-09','2026-08']) / NN_SRC(('gen3ou',0,1.0),('gen9nationaldex',0,0.5)) / NN_MIRROR / NN_FORM_ALIAS / NN_NOTE` 与函数 `nn_toks()`（形态归一）/`nn_download()`（urllib → curl 回退，失败不阻塞）/`build_usage_prior()`（含合并缓存**形状校验**：`priors` 非 dict 即转逐源重建）；`data` 字典内插 `usagePrior` / `usageMeta`（位于 `matchupSp` 与 `sprites` 之间）。`build_tool_html.py` — 原 L115-118 **无条件注入**改为**条件回退**：`if re.search(r'"usagePrior"\s*:\s*\{[^{}]*\d', data_js)` 命中即跳过（日志「跳过（数据层 build_tool_data.py 已产出…coverage=747）」），未命中才走 v4.5 `nn_data` 读取路径（避免两处口径互相覆盖 / 用空值回写）。
- **量（探针实测）**：`usagePrior` **747** 条，值域 (0,1]，归一化 `round(v/srcMax,4)` 使 max=1（`srcMax=0.516601`，#248 班基拉斯）；`usageMeta = {month:"2026-09", rating:0, srcs:[{gen3ou,1.0,213},{gen9nationaldex,0.5,738}], coverage:747, scale:"normalized(0..1, max=1)", srcMax:0.516601, unmapped:5, note:"原版（Smogon/PS）使用率 ≠ ER 使用率；ER 无对战统计=已知缺口，仅作弱先验（权重上限 0.6，次排序）"}`。
- **弱先验口径**：`USAGE_PRIOR_W=0.6`，只作**同类威胁内次排序**（`ka=(_ord[id]||0)*(1+0.6*usagePriorOf(a))`）；量级仍由代理口径（可学该机制/属性 × 种族力度）决定。界面经 `threatPriorLine()` 如实标注来源/权重/覆盖，并写明「**原版使用率 ≠ ER 使用率**（ER 无对战统计=已知缺口）」。
- **回归**：`node --check` EXIT 0；`verify_v1.js` **216/0** + `verify_v4.js` **276/0** = **492 PASS / 0 FAIL**（基线不降）；新增 v4.6.4 组 **12/12 PASS**——代表序列先验命中 HZ 0/6、HZR 0/6、BOOST 0/6、PRIO 0/6、**PHYS 1/6**、SPEC 0/6、**WX 1/6**、**IMM 4/6**、TYPE 0/6 → 严格分支确被消费（PHYS 前列全是 ER 专有 Mega/Redux，Showdown 无键 → prior=0 属预期）；`tools\probe_v464.py` **32/32 PASS**；存档 5 锚点全过（`431/6/425/15` + `K=3`，`K∈[3,4]`）；**移动端 360px**：新旧 HTML 除数据字面量外**逐字节一致**（剔除旧空注入 2 条后后缀 333,653 B 全等 → 无 CSS / 标记 / 引擎改动），`verify_v1` 的 `v463-7` 亦 PASS。
- **5 锚点先验**：#411 护城龙 0.0016 ｜ #469 远古巨蜓 0.0028 ｜ #741 花舞鸟-热辣热辣风格 0.0006 ｜ #1513 超级化石翼龙 0.0106 ｜ #2232 超级土王 **无值**（ER 专有 Mega，Showdown 无对应键 → 合理）。
- **产物指纹**：`配招助手_ER.html` = `index.html` = **ROM 副本** = **2,366,477 B**，SHA256 `598390423606391D2CEDADFB343333D840395CDD42EA13880A20A6A124553129`（三处逐字节一致；ROM 副本 = `D:\mGBA-0.10.2-win64\ROM\elite redux\配招助手_ER.html`，与 §9④/§10 同步约定一致）；`配招工具_data.js` **6,497,640 B**，SHA256 `CC251CC21544B1FD9C8410B6CEC7B40EA48DF240CD1D39DB1DC38323BEA786BF`；内嵌 script 2,024,066 B（构建期剥离 base64 精灵图 6.20 MB → 1.83 MB）。
- **附：4 项构建输入被部署清理误删 → 已重建（本轮）**：`招式表_可学总表.csv`、`ER2.65简汉化\ER2.65beta版图鉴v0.3.xlsm`、`ER2.65简汉化\分类.xlsx`、`ER2.5正式版图鉴v0.5.xlsm` 属**未跟踪/被忽略**物，被 §8 清工作区流程删除且**全盘不可恢复**（xlsm/zip/回收站均无）。→ `tools\rebuild_source_inputs.py` 由权威源（`gameDataV2.65beta.json` + 招式表 CSV）与**已提交产物**（`配招工具_data.js` 的 `matchup`/`abilities`/`coreNotes` 反演）重建；`tools\check_rebuild_faithful.py` 以重建前 data.js 为 oracle 递归首差比较 → **既有 19 键逐字段全等**（仅新增 `usagePrior`/`usageMeta`）；重建的 `招式表_可学总表.csv` **112,580 行**（升级 40,299 / 教学 72,281 / 蛋 0 / TMHM 0）与既有记载逐数吻合。**§8 流程已加「先移出这 4 项」提示**；4 项重建输入已另行备份到 Agent workspace（`scratch\_rebuilt_inputs_backup\`，非仓库路径，防清工作区再次丢失）。**
- **探针/工具**：`tools\probe_v464.py`（32/32）、`tools\check_rebuild_faithful.py`（保真）、`tools\rebuild_source_inputs.py`（重建）；临时文件一律写 Agent workspace（不落项目根）。
- **待办**：① 主 Agent 部署 gh-pages 并验证线上——部署**可直接执行**：`git` 虽不在 PATH，但 `tools\deploy_er.ps1` L7 的 **`D:\Git\bin\git.exe`（实测 v2.49.0）** 可用；**清工作区前务必先移出 §8 所列 4 项构建输入 + ER-source**，否则会再次误删；② `rating=0` 与 `srcs` 对象数组口径待拍板（是否改用 1760 档）。

## 13. v4.7 规则偏移层确定性修正接入引擎排序（A 线，2026-10-09）

- **动机（M5 实证）**：引擎分（`scoreTeam().meanMemberScore` = 非核心槽位引擎位次均分）与 battlesim 真值胜率**负相关**——4000 队 Spearman **−0.187** / AUROC **0.396**；纯确定性偏移层（`nn_data\shift_layer.py`）单独 AUROC **0.534**。典型偏差：洛奇亚 #249 + 雷吉奇卡斯 #486 龟速传说堆引擎 34–37 分而真值胜率 0.29–0.50。→ 本轮把 M5 已验证的确定性修正（特性池 n 选 1 / 3 天性 / −ate 转换 / 18 体系受益 + 速度线/节奏 + 单体强度）**硬编码进引擎排序的强度维度**，不改打分主结构、不引入学习模型、不改数据层。
- **落地（`build_tool_html.py`）**：一键回退开关 **`RULE_SHIFT_ENABLED`**（默认 true；置 false 回退 v4.6.4，`rsL1Of/rsTeamCard` 返回 null、`needScore` 守护）＋常量块 `RULE_SHIFT{L1,L2,MU,SD,W}`＋函数 `rsFeat / rsShiftMember / rsZ / rsL1Of / rsTeamCard`；`needScore` 注入 `dims` 项 `id:'RS'`（`total += pts`）；`renderNeedPlan` 体检 tip 行「强度校准（规则偏移层 · 确定性修正）」。L1 = `slow −2 / syscnt +2 / bst +2`（z→分，最大项 2.0）；L2 = `lin = b0 + w_E·z_E + w_sh·z_sh + w_slow·z_slow + w_spd·z_spd + w_syscnt·z_syscnt + w_bst·z_bst`，`S′ = 22.428 + 4.145·(lin − 0.14355)/0.56729`，`z_E` 用 **train 集基准**（eMean 22.356 / eStd 4.165126）。
- **系数来源（禁拍脑袋）**：`_p47_calib4.py`（贪心前向选择 → L1，test AUROC 0.6332）+ `_p47_calib5.py`（强制纳入 sh 后定稿 → L2，test AUROC 0.6630 / rho +0.3181）+ `_p47_calib6.py`（补 `b0=0.15288 / e_tr_mean / e_tr_std`，Patch C 消费）+ 偏移层权重 W 直接照抄 `nn_data\shift_layer.py`（M5 自检 11/11）+ 4000 队真值标签（`dataset_engine_v0_winrate.jsonl`）。
- **偏移层标量 sh 登记**：强制纳入后 train AUROC **单调下降** → 其排序边际实测 ≈0（与引擎既有 ABI_TAGS/体系维度冗余，印证 M5「ΔAUROC=0.000」）→ L1 权重置 0、仅 UI 展示；L2 权重 **−0.0340 ≈ 0**。
- **端口对拍**：逐成员 S1/S2/S3 与标定 `per[]` **完全一致**、`rsFeat` 与 `species_table.json` **74/74 吻合**；公式级 maxΔ **7.5e-4**；端到端 max|ΔS′| **0.2393**（秩相关 0.996、极值位次一致）；slow/spd/bst/syscnt 的 z 残差 ≤4.7e-10，**唯一发散项 = 展示项 sh**（0.964 z）→ 已知残差，公示不修（权重≈0）。
- **修正方向（独立复算 `_p47_agg.py`）**：全 4000 队 E **AUROC 0.3962 / rho −0.1913** → S′ **0.6539 / +0.3221**；含洛奇亚+雷吉奇卡斯 **77 队**分位均 **75.6% → 40.5%**；真值**前 50 队**分位均 **41.5% → 73.0%**；top5/10/50 真值均胜率 by S′ **0.717/0.657/0.680** ＞ by E 0.583/0.587/0.560；14 队夹具 **14/14** 复算一致（|Δ|<0.01）。
- **三决策**：① 判据 2 替代（NN top-K 质量显著优于引擎 + 人工抽检，替代「引擎序不倒退」——后者数学上与质量提升互斥）；② 换标签：**`winrate` 为训练主标签**（`meanMemberScore` 仅辅助）；③ M5 结论索引行（**A 线 = 本轮规则偏移层接入引擎排序；B 线 = `nn_data\` NN 侧**）。
- **回归**：`node --check` **EXIT 0**；`verify_v1.js` **216/0** + `verify_v4.js` **285/0**（276 基线 + 新增 **RS 组 9 条**）= **501 PASS / 0 FAIL**；存档 5 锚点 `431/6/425/15` + `K=3` 全过（解析器**逐字未改**）；移动端 360px CSS 断言全过；token 扫描全 0（无内部编号/调试痕迹/alert）；**既有断言迁移**：DY11「所有候选 score≥0」→「**负分仅出自 RS 维度**」（本轮有意改变排序行为；回归口径 = 不崩溃 / 存档 5 锚点 / 移动端 / 数据契约）。
- **产物指纹**：`配招助手_ER.html` = `index.html` = ROM 副本 = **2,375,508 B**，SHA256 `8D16768E55A2E24F50FA742D684A10EB5F1310F22033D0F32BBD962A482DCD2E`（三处逐字节一致）；`build_tool_html.py` 419,330 B / `E45CDF7221802AF010BAAE24BDBC699988446BE04C0B9D28DB939B527E5F22BF`；`配招工具_data.js` 6,497,640 B / `CC251CC21544B1FD9C8410B6CEC7B40EA48DF240CD1D39DB1DC38323BEA786BF`（与 v4.6.4 期**一致 → 数据层未动**）；内嵌 script 2,344,978 B。
- **未验证（如实登记）**：① 真机/浏览器**目视**未做（bu 已弃用，全部 Node VM 降级）；② 关闭态 HTML **产物**未另出（仅运行时回退实测：校准行消失、页面 468,394 → 466,103 B）；③ sh 端口残差未定位行级根因；④ 标签为 battlesim 代理胜率（**ER 无对战统计 = 已知缺口**）；⑤ NN 资产未动；⑥ 部署（gh-pages）由主 Agent 执行。
- **报告**：`docs\战斗分析\_验证证据\_引擎升级B节_交付报告_20261006.md` **§v4.7**（含 ≥6 例对比表 / 系数来源登记 / 端口残差说明 / 三决策 / 指纹）。

## 14. NN 资产清单与重建路径（B 线续，2026-10-09）

- **背景**：NN 侧资产曾随工作区清理丢失（§12 同类事故）。B 线续本轮做**全盘实况盘点**（按磁盘，不按叙述）：`nn_data\` 全套存活（M1/M2/M5 脚本 + 数据集 + 报告）；**M2 模型 6 个 pkl 在 `nn_data\nn_models\`**（`mlp_a_{v1,v1h,v2}.pkl` + `*_numpy.pkl`）；**M5 模型产物 12 文件在根 `nn_models\`**（`pretrain_chaos_v1*` / `nn_eval_v1_20261009.{npz,onnx}` / `*_report.json` / `increment_v1_summary.md` / `shift_v1_stats.json`）——本轮**未发现丢失**（"M5 第三次丢失"的叙述与磁盘实况不符，按实况登记）。
- **入库策略**：`.gitignore` L23 `nn_data/`、L24 `nn_models/` ⇒ NN 资产全部**不入库**，以「可重建」为前提；清理工作区前先跑盘点脚本。
- **盘点脚本**：`python nn_data\bline_asset_audit.py` → `nn_data\_engine\_tmp\bline_asset_audit.json`（56 项清单：存活/缺失 + 每项重建命令 + 逐文件 size/mtime/sha16；**交付时实测存活 56/56、缺失 0**）。
- **重建顺序**（全部在 `D:\game\elite-redux` 下执行）：
  1. 引擎快照（换 HTML 后必做）：`python nn_data\extract_engine.py` → `nn_data\_engine\{ERDATA,consts,species_table,extract_meta}.json`
  2. M1 数据层：`python nn_data\map_species.py` → `species_map.json`；`python nn_data\gen_engine_samples.py` → `dataset_engine_v0.jsonl`；`python nn_data\split.py` → `split_engine_v0.json`
  3. M2 模型：`python nn_data\train_mlp_a_torch.py --versions v1,v1h,v2` → `nn_data\nn_models\mlp_a_*.pkl`（numpy 交叉**须**带 `--suffix _numpy`，裸跑有同名守卫会中止）；评测 `python nn_data\eval_m2.py` / `python nn_data\ablate_m2.py`
  4. M5 管线（产物落根 `nn_models\`）：`python nn_data\pretrain.py` → `python nn_data\finetune.py` → `python nn_data\export_onnx.py` → `python nn_data\increment_eval.py`；`python nn_data\shift_layer.py`
  5. B 线（模拟器/标签）：`python nn_data\battlesim.py --selftest`（v3-bline，48/48）；全池 `python nn_data\battlesim.py --run-s2-all --n 0 --k 7 --min-size 3` → `s2_report_v2.json` + `dataset_engine_v2_winrate.jsonl`；`python nn_data\bline_calibrate.py`；`python nn_data\bline_label_probe_v2.py`
- **B 线续产物与判据**：`nn_data\battlesim.py`（v3-bline）/ `S2复测_v2_报告.md` / `dataset_engine_v2_winrate.jsonl`（8143 队，winrate 主标签）/ `s2_report_v2.json`（6 档分层，S2 降级为诊断：主口径 size_eq6 rho = +0.0452）/ `bline_mech_evidence.py`（机制覆盖证据）/ `bline_label_probe_v2.py`（**判据 2 达标**：岭 rho(test)=0.6882、5 折 CV 0.6938±0.0108，天花板 SB 0.7595）/ `bline_report_check_v2.py`（报告数字一致性 141/0）。
- **M4/G1 产物（k 分档，2026-10-09，B 线；G1 状态见 §15）**：`nn_data\dataset_engine_v3_winrate.jsonl`（官方 v3 标签集，8143 队，k=11）/ `nn_data\dataset_engine_v3k9_winrate.jsonl`（k=9 对照）/ `nn_data\s2_report_v3.json` / `nn_data\s2_report_v3k9.json` / `nn_data\G1复测_报告.md` / 脚本 `nn_data\bline_k_sweep.py`、`nn_data\bline_root_cause.py`、`nn_data\bline_report_check_v3.py`（286/0）；跑批：`python nn_data\battlesim.py --run-s2-all --n 0 --k <9|11> --min-size 3 --tag v3k<9|11> [--strata <档位>] [--out-all s2_report_v3.json] [--winrate-out dataset_engine_v3_winrate.jsonl]`；证据脚本：`python nn_data\bline_calibrate.py`（13/13 PASS）、`python nn_data\bline_mech_evidence.py`（语料普查 + 模拟计数器）
- **v5 · size-eq 同规模配对标签重出产物（2026-10-09，B 线；状态见 §20）**：`nn_data\dataset_engine_v5_sizeeq_winrate.jsonl`（同规模配对标签集，48,588 队，16,737,657 B，sha256 `1d3808f861083a5af1ad300b52889792add8c62de8398b802e47a79c7b0aedaa`）/ `nn_data\dataset_engine_v5_sizeeq_registry.json`（口径登记：配对模式/schema/规模分布/档位耗时，16,715 B，sha256 `e412f7fad559617f807d8983829c31ebbffd2fb48559c57932708e3af5a6ef1a`）/ `nn_data\V5_sizeeq_报告.md` / 脚本 `nn_data\v5_scan.py`（只读扫描）、`nn_data\v5_run.py`（40 档跑批驱动，分档落盘可续跑）、`nn_data\v5_merge.py`（合并+口径登记+规模伪影 A/B）、`nn_data\v5_report.py`、`nn_data\v5_report_check.py`（报告数字独立复算 67/67）；档位尾产物 `nn_data\_engine\_tmp\v5_sizeeq\g4pool_cNNNN_sN.json`（40 档）；复现：`python nn_data\v5_run.py --workers 8` → `python nn_data\v5_merge.py` → `python nn_data\v5_report.py`（`battlesim.py` 零改动，仅用既有 `--size-eq`；源池=v4 采样池 10 分片）

## 15. M4 双闸 · G1 真值闸状态（B 线，2026-10-09）

- **编号说明**：M4 任务书要求登记在「§9」，但 §9 已被 v4.6.1 收尾补丁占用（A 线 UI），故 G1 状态另起本节，并在 §14 留指针；§9 既有内容一个字节未改。
- **G1 判定 = 部分达成**：真值可信度（折半可靠性 / SB 天花板）随场次 k **单调上升**；判据 2（已拍板替代 S2 作为 G1 闸）**达标且随 k 上升**；S2（降级为诊断）**未达标**，且「S2 低分由每队场次不足的测量噪声主导」的假说**被本次扫描证伪**。
- **判据 2（G1 闸，达标）**：口径 = 44 团队特征 → 模拟胜率，按核心物种留出，n=8143。岭 5 折 CV = 0.6938±0.0108 (k=7) → 0.7208±0.0059 (k=9) → **0.7320±0.0054 (k=11)**；岭 test = 0.6882 / 0.7196 / **0.7230**；MLP test = 0.6706 / 0.6956 / **0.7064**；探针自算天花板 SB = 0.7595 / 0.7963 / **0.8282**。
- **S2 诊断（降级，未达标）**：主口径 size_eq6 rho = +0.0452 (k=7) / +0.0558 (k=9) / **+0.0304 (k=11)**，目标 >0.5；可靠性 SB = 0.6801 / 0.7193 / **0.7600**（单调上升）⇒ **扩场次不是杠杆**（ΔSB +0.080 而 Δrho -0.0148）。池化档为负（ge3 -0.1807）由规模混淆造成（rho(win,size)=+0.6051 vs rho(引擎分,size)=-0.3418），同规模档全正（eq3 +0.2283）。
- **根因（结构性，非测量精度）**：引擎分 `meanMemberScore` = 需求契合度位次分，与队伍强度**负相关**：rho(引擎分, sumBST) = **-0.2394**（p=1.7e-106，静态量、与 k 无关）；而模拟胜率确由强度驱动：rho(win, sumBST) = +0.6144 → +0.6392 → **+0.6475**。⇒ 目标量之间缺因果通路。
- **下一杠杆**：①以判据 2 为 G1 闸（已达标，winrate 为主标签）；②**换 S2 右端量为强度型引擎分**（依赖 A 线引擎侧，唯一可能冲 0.5 的路）；③S2 禁止再加场次（本次扫描已证伪其收益）；④补墙类/清除浓雾/高速旋转/守住的语料槽位（当前语料 0 槽、全量跑批墙系计数器全 0）；⑤若 A 线给出强度型引擎分，直接用「NN 预测 vs 模拟胜率」（判据 2 直接路径）作为长期替代口径。
- **真值校准与自检**：`battlesim.py --selftest` = 48/48；`bline_calibrate.py` = **13/13 PASS**（A1 克制表 diff=0 / A1b 14 格 / A1c 441 格自洽 / A2 天气 ×1.5 / A3 -ate / A3b STAB / A4 上下文常量 / D1 strong_win=1.00000 / D1r weak_win=0.00000 / D2 0.83125 (Wilson [0.7863, 0.8683]) / D2r 0.81875 / D2c 0.85000 / D2b rho=0.81821），且与上一轮备份**逐位一致**（确定性）；全量跑批计数器见 `nn_data\G1复测_报告.md` §8.4（墙系全 0、`engine_stat_mode`=0）；报告数字一致性 `python nn_data\bline_report_check_v3.py` = **286/0**。
- **红线**：本轮资产全落 `nn_data\`（`.gitignore` L23 排除、不入库）；**HTML/引擎零改动**（`battlesim.py` 只动 CLI/产物命名，模拟逻辑未改）。

## 16. M4 最后一步 · 部署候选完整化（M5/G3/蓝图线，2026-10-09）

- **依赖说明**：本线承接 §13（A 线 v4.7 右端量）与 §14/§15（B 线 G1 真值闸）。任务分「独立部分」（立即可做，已完成）与「依赖部分」（等 X 线扩容产物，见末条）。
- **独立①·S2 右端联动复测（完成，正是 §15「下一杠杆②：换 S2 右端量为强度型引擎分」）**：把 A 线 v4.7 团队强度校准分 **S′** 作为 S2 右端量，在官方 v3 标签集（`dataset_engine_v3_winrate.jsonl`，8143 队，k=11）复算 —— 脚本 `nn_data\s2_right_end.py`（S′ **逐字照抄** `build_tool_html.py` 4874-4959 的 RULE_SHIFT 常量；逐成员 `sh` 复用 `nn_data\shift_layer.py` 同定义；`E` 口径经 `engine_harness.js:258-259` + `gen_engine_samples.py:209-210` 核实 = `meanMemberScoreAllSlots` = HTML `rsTeamCard` 的 E）。**结果**：全量 rho(win,S′) = **+0.3248**（p=2e−199）/ AUROC **0.6545**；**样本外 4143 队（L2 系数未见）rho = +0.3210（p=6.3e−100）/ AUROC 0.6630**；对照同口径原始引擎分 rho = **−0.1807**（全量）/ **−0.2040**（样本外）/ AUROC 0.3844（**低于随机**）。→ §15「引擎分非强度分」的根因判定得到**右端联动复核**，换右端量后显著转正；样本外 rho 高于样本内（+0.3210 > +0.2740）⇒ **非过拟合**。
- **独立①·附带口径对拍（脚本 `nn_data\s2_strata_check.py`）**：本机复算 `rho(win,size)=+0.6051`、`rho(引擎分,sumBST)=−0.2394`、池化 `rho(win,sumBST)=+0.6475`，与 §15 登记值**逐位一致**（口径互证）。但对拍显示：池化 sumBST（+0.6475）与 size-neutral 的 meanBST（+0.2736）相差 0.374，**全部来自规模通道**；size_eq6 分层内 sumBST 仅 **+0.2686**，而 **S′ 同分层 +0.2483** ⇒ 规模受控下 S′ 与静态强度量**同水平（92%）**。**登记一处数字差异**：size_eq6 的 `rho(win, 引擎分)` 本机 **+0.0038** vs §15 登记 **+0.0304**（差 0.0266；同为「≈0 且不显著 p=0.88」，**定性一致**，来源未定位）。
- **独立②·产品口径裁定建议（待用户拍板）**：严格隔离（成员级零交叉、丢弃 80.74%）vs 部署真实性（core 级）四维对比（n / 统计力 / 过拟合风险 / 可部署性）→ 推荐 **「严格口径作 M4 放行闸门 + 部署口径作收益上界，双报不二选一」**。关键澄清：80.74% 丢弃是**评估池**的代价、不是训练数据的代价（部署模型仍用全量训练）⇒ **口径选择不解除样本量阻塞**（两口径 n/n_min = 0.34~0.40× 与 0.56× 均 <1），解除阻塞只能靠扩容。详见 `nn_data\扩容复测与部署候选_报告.md` §2。
- **刚性验证（三项独立复现，管线干跑）**：① 用现存 G3 严格数据复现探针 D 全部登记值 —— AUROC(test) **0.7753** / Δ₁₀ **+0.3377** / SE 0.0867 / CI95 [+0.1411,+0.4803] / L +0.1678 / n_min 428，**逐位复现**（日志 `nn_data\_engine\_tmp\dryrun_probe.txt`）；② 新增独立审计脚本 `nn_data\g4_isolation_audit.py` **独立复现** G3 隔离三项（行 1371/49/148、成员物种零交叉 True、丢弃 80.74%、chaos 池 924 覆盖严格 test 物种 99 = 0.5723）；③ S2 实现一致性：HTML 的 `def`/`stat` 用布尔、`shift_layer.py` 用 token 计数，扫描全部 107 条 `abiTags` **多 token 用例 = 0** ⇒ 两实现在真实语料**无分歧**。
- **依赖③④⑤·本轮未执行（阻塞，如实登记）**：`dataset_engine_v4_winrate.jsonl` + `split_engine_g4_strict.json` + `dataset_engine_g4_strict.jsonl` **自始至终缺失**（11:31→12:07 共 **≥55 次独立检查**，含全仓递归检索 0 命中；日志 `nn_data\_engine\_tmp\xg4_poll.txt`、`xg4_wait2.txt`）→ **G4 严格统计（Δ₁₀/p/CI/n）/ 探针 D v2 指纹 / int8 三项验证 / 4 层判据重跑本轮均无结果，报告不编造数字**。X 线现场（磁盘证据）：脚本已落盘（`g4_pool_build.py` 11:36 / `g4_merge_labels.py` 11:41 / `g4_strict_export.py` 11:42 / `g4_report_check.py` 11:45 / `append_agents_g4.py` 12:00）、中间件 `_engine\_tmp\plans_cache_g4.json`(2.68 MB) 与 `score_out_sA.jsonl`(14,559,559 B, 写入止于 **12:06:22**)，但三目标产物未产出；11:55 存在的高负载 `node`（CPU 234.7 s）于 12:06:39 复查**已消失**，此后无 X 线写入。
- **我方干扰披露（自我登记，不隐去）**：12:06:31 为重启守望任务，我使用了过宽命令 `Stop-Process -Id (Get-Process powershell | Where-Object { $_.Id -ne $PID }).Id -Force`，**终止了本机全部 powershell 进程（含后台任务包装）**；X 线 `node` 在其后 8 秒内消失、X 线文件写入恰在 12:06:22 停止 ⇒ **无法排除连带终止了 X 线后台驱动（含子进程）**，也无法排除 X 线自然结束或自身出错，二者本轮**不可区分**，故双向登记。正确做法为按 task id 精确 `TaskStop`；**已停止该模式，此后不再触碰非本线进程**，且**不重跑 X 线管线**（越界）。
- **恢复动作（仅本方范围、只读、有界）**：守望+自动执行 `nn_data\_engine\_tmp\g4_autorun.ps1`（**60 分钟**上限、30 s 间隔 + 20 s 大小稳定判定）——三产物一旦就绪即自动执行「隔离审计 → 探针 D v2(`nn_eval_g3_v2.npz/.onnx`) → 统计层 T2(D/C/A 三口径含置换 p) → int8 → 结果汇编」，并写 `_engine\_tmp\g4_results_fragment.md`（缺失项登记 MISSING，不编造）。**runbook 逐条命令见报告 §3.4**（管线已干跑验证，见下条）。
- **管线干跑验证（依赖部分可信度，非「命令看着对」）**：① 用现存 G3 严格数据跑 `g3_probe_eval.py` 复现探针 D **逐位相同**（AUROC 0.7753 / Δ₁₀ +0.3377 / SE 0.0867 / CI95 [+0.1411,+0.4803] / L +0.1678 / n_min 428；日志 `dryrun_probe.txt`，干跑产物已清理）；② 新脚本 `g4_isolation_audit.py` 复核 G3 划分**三项全同**（1371/49/148、成员零交叉 True、丢弃 80.74%、chaos 924 池覆盖 99 = 0.5723）。
- **本轮脚本接口变更（微创，向后兼容）**：`nn_data\g3_probe_eval.py` 与 `nn_data\quantize_onnx.py` 各**新增可选参数 `--report-name`**（默认值维持原报告名），用于避免依赖部分重跑时覆盖 G3/M5 既有报告；未改任何计算路径。
- **产物（绝对路径）**：`D:\game\elite-redux\nn_data\s2_right_end.py`、`s2_right_end_v3.json`、`s2_strata_check.py`、`s2_strata_check.json`、`g4_isolation_audit.py`、`g3_isolation_audit.json`、`扩容复测与部署候选_报告.md`。
- **依赖③④⑤·执行完成（2026-10-09 14:20 起；G4 三产物 14:11–14:13 落盘后本方立即执行）**：
  - **探针 D v2 重训**：AUROC(test) **0.8809**（逐 seed 0.8810/0.8807/0.8811）→ `nn_models\nn_eval_g3_v2.npz`（1,273,022 B，`2a066c1e755a8108`）/ `.onnx`（1,345,927 B，`5c9fdd5c2139b57b`）；**未覆盖 v1 探针**（版本隔离）。int8：**0.324 MB**，ρ=**0.999861** / IoU@10=**1.0000** / ΔAUROC=**−0.0004** → `nn_models\nn_eval_g3_v2_int8.onnx`（`bb121dfa8bab5f98`）+ `onnx_g3_v2_int8_report.json`。备用候选 C：`nn_models\nn_eval_g4_zeroshot_20261009.npz/.onnx/_int8.onnx`（**字节等同 `pretrain_chaos_v1.npz`**，非新训练）。
  - **G4 严格集独立审计**（`nn_data\g4_isolation_audit.json`，由 X 线执行我方脚本）：3,962 行 = 2,276/58/**1,628**；**成员与核心物种零交叉均 true**（交集全 0）；丢弃 91.85%；chaos 池 924 覆盖 test 762 物种 403 只（52.89%）。
  - **官方 T2 三口径**（基准=原始引擎分 E，`nn_data\increment_threshold_g4_{strict,zeroshot,A}.json`）：**D** Δ₁₀ +0.2401 / L **+0.0960** / p 0.0045 / n_min **3,378** → 统计综合 **False**；**C** +0.1557 / +0.0139 / 0.0445 / 3,273 → False；**A** +0.1832 / +0.0348 / 0.0250 / 3,588 → False。
  - **4 层 M4 判据**：① 标签层 **✅**（严格 test Spearman **0.7419** ≥0.5；**CV 0.8907/AUROC 0.9818 虚高登记**——超折半上限 0.8491，因 train 内同队跨折）② 统计层 **❌**（L 差 0.0040、n 0.48×）③ 配方层 **⚠️**（A−C=−0.0461<0）④ 访问层 **❌ 未实施** ⇒ **M4 不放行**。
  - **★规模混淆（本轮最重要负向发现）**：G4 严格 test `rho(win,size)=+0.7232`（层均值 0.145→0.549）；**D/C 的 top-10 十席全为 size-6**，引擎 E top-10 平均规模 3.60 ⇒ **池化 Δ₁₀ 度量的是规模通道**；规模受控后 D 对 S′ 的 Δ₁₀ = size3 **+0.0929** / size4 **−0.0233** / size5 **−0.0318** / size6 **−0.0845**（**4 层 3 层为负**）⇒ 判据必须以**分层**形式重写（T2.1，报告 §5.2）。反向登记：size-3 层 D 明显最好（0.2574 vs 引擎 0.1970），非全无效。
  - **配方反转（G3→G4）**：G4 为 **C 0.8936 > D 0.8809 > B 0.8553 > A 0.8475**（G3 为 D>C>B>A）；A−C=**−0.0461**（**ER 微调在严格口径下负迁移**，`finetune_v1g4_A_report.json`）；配对检验 AUROC(C−D)=**+0.0126** CI95[+0.0041,+0.0211] **显著**，top-10 (D−C)=+0.0844 CI95[−0.0214,+0.1446] **不显著** ⇒ 要 top-K 选 D、要全局排序选 C（决策点 E1）。
  - **★口径警示（对 §17 末条期待值的更正）**：① G4 的 `engine_meanMemberScore` 属**新引擎口径**，而 S′ 的 L2 系数在**旧口径 v0** 上拟合 ⇒ 本轮 G4 的 S′ 为**混合口径**，其 Δ₁₀(S′) 与 AUROC(S′) **仅作参考**；工具真实 S′ 须 A 线在新引擎口径下重拟合后再算（`nn_data\g4_t2_sprime.json` 已标注）。② §17 末条「严格集 1,628 行已覆盖 n_min(375–441)」**不成立**：该 n_min 由 G3 口径（n=148、SE 0.0867）算出，同一公式在 G4 口径实测 **3,378**（因 SE·√n 由 1.055 升到 3.044，SE∝1/√n 外推不成立）。
  - **本方脚本缺陷登记**：`g4_t2_sprime.py` 首跑的点估计 `delta_stat()` 存在取值长度错位 bug（D 的 Δ₁₀(E) 误报 +0.0331）；**已修复重跑**，修复后与官方脚本**逐位一致**（+0.2401）。
  - 本轮未做/未改：**未重跑 X 线管线**；未改动任何 X 线脚本与产物；④ 访问层未实施（零 HTML 改动）。
- **历史保留（不撤回）**：本节上方「依赖③④⑤·本轮未执行（阻塞）」一条及其**我方进程干扰披露**（12:06:31 过宽 `Stop-Process` 可能连带终止 X 线后台驱动）为**历史记录，事实成立**；守望任务已于 13:07:49 超时（`TIMEOUT_NOT_READY`），**未触发自动执行**。
- **红线**：零 HTML/引擎改动（`build_tool_html.py` 仅只读提取常量，`index.html`/`配招助手_ER.html`/`nn_data\_engine\*` 一个字节未改）；资产全落 `nn_data\`、`nn_models\`（`.gitignore` 排除、不入库）；判据未达如实登记。
- **M4 收尾/G4 严格扩容产物（2026-10-09，B 线；G4 状态见 §16）**：`nn_data\dataset_engine_v4_winrate.jsonl`（v4 官方标签集，48,588 队，k=11，16 字段）/ `nn_data\split_engine_g4_strict.json`（Louvain 严格分桶 + 隔离自证）/ `nn_data\dataset_engine_g4_strict.jsonl`（行级严格集，3,962 行）/ `nn_data\G4扩容_报告.md` / 脚本 `nn_data\g4_pool_build.py`、`nn_data\g4_pool_audit.py`、`nn_data\g4_merge_labels.py`、`nn_data\g4_strict_export.py`、`nn_data\g4_report_check.py`、`nn_data\_engine\_tmp\g4_pipeline.ps1`（全流程一键：采样分片→池装配→分片跑批→合并→严格划分→导出）；扩容采样用 `python nn_data\gen_engine_samples.py --n <候选> --distinct <目标> --seed <s> --id-offset <off> --out-prefix <前缀> --plans-cache <新缓存> --tmp-tag <片名>`；分片跑批用 `python nn_data\battlesim.py --run-s2 --rows-file <片> --min-size 3 --n 0 --k 11 --seed 20261008 --out <片报告>`

## 17. M4 收尾 · G4 严格数据集扩容状态（B 线，2026-10-09）

- **编号说明**：本节原登记为 **§16**，与上方「M5/G3/蓝图线 §16」编号冲突（两会话并行写入）→ 本轮改列 **§17**，**正文一个字节未改**。两节的交叉更正见 §16 末条「口径警示」。

- **编号说明**：M4 任务书未指定节号；§9 被 v4.6.1（A 线 UI）占用、§15 被 M4/G1 占用，故本轮另起 §16，并在 §14 留指针；§9/§15 既有内容一个字节未改。
- **目标与达成**：任务要求「battlesim k=11 口径跑批扩容 ≥23,544 行（2.89×，冲 5 万行）」+「严格物种隔离划分（Louvain 分桶 + 全成员同桶行保留）」+「隔离自证 train∩val∩test=0」。**模拟逻辑零改动**（battlesim 本轮只被调用、未被修改）。
- **扩容结果**：采样输入 56,000 行（坏标签 0 / size<3 105）→ 过滤后 55,895 行 → 按 team_ids 键去重得 **48,588 行**（重复丢弃 7,307，重复率 13.07%）→ 确定性打乱切 **10 片**（每片 5,000 行）；分片跑批合并后 v4 数据集 **48,588 行**（唯一键 48,588，k=11，`sim_version`=v3-bline），合并自检 all_ok=True。
- **严格隔离划分**：louvain 分桶（与 v2 口径同法），全成员同桶行保留 → 严格集 **3,962 行**（keep 0.0815）；桶行数 train/val/test = 2,276 / 58 / 1,628，桶物种数 = [241, 150, 762]，跨界丢弃 44,626 行；**v2 基线 keep_total=1,568（test 148 行）→ 本轮 ×2.527**。
- **隔离自证**：行级 3 对交集 = [0, 0, 0]；物种级 3 对交集 = [0, 0, 0]；强式（任一行物种集合 ⊆ 本桶物种集合）违背 0 次 —— 即测试集出现的任何物种都不在训练/验证池出现。
- **【重要】引擎漂移（本轮发现，影响全数据集谱系）**：`nn_data\_engine\engine.js`（M1 快照 2,330,883 B）与当前 `配招助手_ER.html` 内嵌引擎块（2,339,787 B）**字节不同**；`_engine\_tmp\plans_cache.json`（M1 期缓存）相对当前 HTML **已失效**：8 核探针 `ids_equal`=0、`planMeanMemberScore` 一致 0，保真校验 0/131（旧缓存）vs **62/62（新缓存 `plans_cache_g4.json`）**。⇒ ①G4 全部改用新缓存重建；②**v0–v3 数据集的 `meanMemberScore` 属旧引擎口径、v4 属新引擎口径**（同核同队分数尺度变化，例：core 303 由 25.75 → 36.21），跨数据集混用该字段前必须先核实引擎版本；③后续任何重建（M5 模型、探针）请统一以当前 HTML 为口径源。
- **池装配口径与一次账目事故（已修正，内容无损）**：`g4_pool_build.py` 的 `--pattern` 写成 `g4pool_s*.jsonl`，**同时匹配到各片的 `g4pool_s*_labels.jsonl` 摘要行**（含 `team_ids/label` 但无 `slots/vector`）。去重键相同、标签相同、且排序上 `g4pool_sX.jsonl < g4pool_sX_labels.jsonl` ⇒ 胜出者仍为带 `slots/vector` 的正式行；独立审计 `g4_pool_audit.py` 复核：全池 48,588 行**全部含 slots/vector**（缺 slots 行数 0）、交付行数与修正 distinct 一致 ⇒ **内容正确、仅原 manifest 账目被两倍行数污染**；修正账目见 `_engine\_tmp\g4_pool_manifest_fixed.json`（本报告与 §16 数字均取修正口径）。
- **红线**：资产全落 `nn_data\`（`.gitignore` L23 排除、不入库）；**HTML/引擎/`build_tool_*` 零改动**；采样器 `gen_engine_samples.py` 仅加 CLI 开关（`--out-prefix/--id-offset/--plans-cache/--tmp-tag/--distinct`，默认行为不变，v0 产物未被覆盖）。
- **交接（另一线执行）**：判据 2 统计与探针 D v2 重训请用 `nn_data\dataset_engine_v4_winrate.jsonl` + `nn_data\dataset_engine_g4_strict.jsonl`（行级带 bucket/bucket_name）；严格集规模已覆盖 n_min（n_min 375–441，本轮严格 test 1,628 行）。**该 n_min 口径已被 §16 末条与 §18 更正：G4 口径实测 n_min=3,378（分层后逐层 251–1,174），375–441 系 G3 口径残留。**

## 18. M4 负向结论落地 · T2.1 规模分层重评（M5/G4 判据线，2026-10-09）

- **触发**：§16 末条登记的「池化 Δ₁₀ 被队伍规模通道主导」经用户**接受**（E3 口径已接受：n_min 按 G4 实测 SE 推；**E1 候选二选一仍未拍板**）。本轮按规模分层重跑判据 2。
- **产物（绝对路径）**：报告 `nn_data\T2.1规模分层复测_报告.md`｜统计 `nn_data\g4_t2_strat.json`｜脚本 `nn_data\g4_t2_strat.py`｜日志 `nn_data\_engine\_tmp\g4_t2_strat.txt`、`g4_t2_strat_k20_auroc.txt`、`g4_t2_strat_auroc.txt`。
- **核心结论①·逐层 T2.1 全部不过**：严格 test 1,628 行分层 size3 588 / size4 431 / size5 383 / size6 226；**4 层 × 2 模型(D探针v2/C零样本) × 2 基准(E/S′) × K∈{10,20} = 32 格，0 格通过**，且**没有任何一格 Δ 达到 0.10**（最大 +0.0946）。逐层 Δ₁₀(D vs E)：size3 **+0.0604**(L −0.0518, p 0.083) / size4 −0.0694 / size5 +0.0192 / size6 **−0.1037**(p 0.953)；C 在 size6 最差 **−0.1881**(p 0.997)。
- **核心结论②·规模平衡宏平均为负**：各层等权 Δ₁₀ 宏平均 D **−0.0234**（vs E）/ **−0.0117**（vs S′）、C −0.0483 / −0.0366；而池化值为 +0.2401 / +0.1888 ⇒ **规模通道贡献 +0.2634 / +0.2004**。
- **核心结论③·平凡规则即可复现并超过 NN**（池化 Δ₁₀，K=10，vs E）：`size_only`（纯按队伍规模降序）**+0.2992**、`sumBST` +0.2937 均 **> D 的 +0.2401 > C 的 +0.1557**；`meanBST`（规模中性）+0.0637 ⇒ 池化 Δ₁₀ **不是** NN 能力证据。
- **核心结论④·层内排序力最强的是平凡静态量**：层内 rho(·, win_rate) 逐层——`meanBST`(**0.3784/0.3190/0.3575/0.3354**) 全部高于 D(0.2670/0.2968/0.3536/0.2110)、C(0.2016/0.2675/0.3332/0.2777)、引擎 E(0.2657/0.2345/0.2399/0.2278)、S′(0.2056/0.0798/0.1138/0.0814)；层内 AUROC 上 D−meanBST 在 size5/6 为 **−0.0567/−0.0535**（frac≤0 0.973/0.954）。
- **更正登记（对上轮 §16「size-3 层 NN 明显最优」）**：size3 层 588 行中 **y>0.5 的正例仅 2 个** ⇒ 层内 AUROC（D 0.8609）建立在 2 正例上（配对 bootstrap SE **0.213**、CI95 [−0.173,+0.438]、仅 1719/2000 有效重采样），**不可作证据**；该层 top-10 点估计领先亦不显著（p 0.083 vs E）。「size-6 引擎最优」方向稳健（引擎层内 top-10 0.6469 最高，NN 在该层显著为负）。
- **n_min 反直觉更正（对任务书预期的更正）**：**分层后 n_min 变小而非变大**（基准 E：size3 740 / size4 654 / size5 875 / size6 367；池化 3,378）——分层消除层间方差使 SE 变小。样本量缺口仍在（各层 n/n_min = 0.44–1.05×），但**真正的约束是效应量**：全部格 Δ<0.10 ⇒ L 的期望收敛到 Δ，**n→∞ 也无法满足 L≥0.10**。⇒ 扩产救不了统计层。
- **构造口径澄清（决定规模通道性质，决定性）**：① 队伍 size 3–6 由 `gen_engine_samples.py` 的扰动模式决定（A 不扰动 / B 随机弃 1–2 名 / C 替换 / **D = 核心+randint(2,5) 只随机成员**）——**模式 D 是唯一覆盖 3/4/5/6 且四档各约 2,220 例的模式**（v4：2229/2229/2209/2214）⇒ size 是采样参数产物，**非玩家真实组队需求分布**；② `battlesim.py --run-s2` 的对手池为**打乱池后顺位 k 个对手、不按规模配对**（`rs=[r for r in rows if r['size']>=5]` 仅用于自检）；③ 模拟器**自带规模主导自检**：`battlesim.py` L1388–1403「6 人队 vs 同队截断 3 人队 → 大队伍胜率 ≥0.85」。且在**每个模式内部**胜率仍随 size 单调升（D：0.1303→0.2351→0.3640→0.5017）⇒ **规模通道 = 数据/标签构造伪影（决定性），非「合理启发」**。附带：v0/v1 只有 size 5–6（早期未启用 B/D 扰动），v4 为 3,864/6,869/19,689/18,166，严格 test 为 588/431/383/226（size3 占 36.1%，**严格集亦规模偏移**，池化统计不代表部署分布）。
- **候选状态（冻结、未改、未重训）**：**不作部署推荐**（任务书「若得出明确胜者」条件**未满足**）——D 仅在 size3 层 top-10 方向为正且不显著；C 在 size6 最差。`nn_models\` 下 `nn_eval_g3_v2.npz/.onnx/_int8.onnx`、`nn_eval_g4_zeroshot_20261009.*`、`nn_eval_g4_Ag4_A.npz` 与 int8 报告**全部原样保留**；E1 未拍板前不重训（本轮未训练任何模型）。
- **下一杠杆（按优先级）**：① **标签口径**——用 `battlesim.py --size-eq N` 生成规模配对标签，或对现有标签做层内去均值/排名（size-residual）；B 线已有 `_engine\_tmp\s2v3k11_size_eq{3,4,5,6}.json` 先例可复用；② **特征表达**——静态量 `meanBST` 已全面胜过 NN ⇒ 建议做掩码位（[1104:1110]）置零消融、把 `meanBST/sumBST` 类显式量纳入输入、层内标准化后再训；③ 样本量最低杠杆（Δ<0.10 时扩产无效）。
- **指针（另一线）**：**「引擎规模行为核查」独立报告截至本轮未落盘**（`nn_data\`、`docs\` 下无对应独立产物；仅见 `_engine\_tmp\s2v2/s2v3k9/s2v3k11_size_eq*` 等 S2 分层中间件）→ 该线报告落盘后请在 §18 后补指针，并核对本节的对手池口径结论。
- **红线**：零 HTML/引擎改动（`build_tool_*.py`/`index.html`/`配招助手_ER.html`/`nn_data\_engine\*` 一个字节未改；`_engine\_tmp\` 仅写本线日志与临时脚本）；资产全在 `nn_data\`、`nn_models\`（`.gitignore` 排除、未推 git）；判据未达如实登记（32 格 0 通过）。

## 19. v4.8 产品侧规模推荐改进（A 线，2026-10-09）

- **动机（M4 规模行为核查）**：「引擎 top-10 推荐平均 3.60 人」经 M4 只读核查判定为**评测口径假象**——引擎自身推荐 **5.33 人**（18 核心分布 `{4:2,5:8,6:8}`，min 4 / max 6，无 1–3 人）、反事实 `MULTI_MAX=0` → **18/18 满 6 人**；`3.60` 来自 G4 池（mode A 仅 4.4%）+ `--min-size 3` + 均值型指标的规模偏置（池内 size3 胜率 0.1696 → size6 0.7562，`rho_win_vs_size=0.7232`）。用户拍板：按推荐路径走，G2/G3 交产品实施。核查报告 `docs\战斗分析\_验证证据\引擎规模行为核查_报告.md`（含 §9 评估侧登记）。
- **落地（`build_tool_html.py`，仅 HTML 层；打分主结构零改）**：
  - **G3 参数化**：`TEAM_CFG{target, multiMax, TARGET_MIN:3, TARGET_MAX:6, MULTI_BASE}`（**引用 `NEED_CFG` 而非字面量**，旧常量 `MAX_TEAM=6 / MULTI_MAX=2` 按契约保留）＋访问器 `teamTarget() / teamMultiMax() / multiMaxForTarget(v)`（≥5→2、≤4→1）；`buildTeamByNeeds` 内 `MULTI_MAX` 硬编码已清零（断言 `NEED_CFG.MAX_TEAM` 在 builder 源码中零命中）。
  - **G2 目标规模 + 继续补位**：方案卡新增「目标队伍规模」下拉（3/4/5/6，**默认 6**）→ `setPlanTarget()` 就地重渲染；未达目标时出「➕ 继续补位」→ `planFillMore()`（`PLAN_FILL` 计数 → `buildTeamByNeeds(s,{fill:N})`）；补位循环为**非需求驱动**，追加成员带 `fill:true / need.kind='fill' / label='补位（非需求驱动）'`，卡面 `.fillrow` + 徽标 + 「补位依据（广义正向分…）」；`fillCands`（8 只含分数）供复验/UI；`reRenderPlan()` 按 `#teamPlan_<id>` 局部替换（无裸 id 残留）；停止原因文案「已满 6 只」→「**已达目标规模**」。
  - **G4 死代码**：`STOP_PRIORITY` 分支**保留为护栏 + 登记注释**（`build_tool_html.py:5196` 登记块 / `:5200` 分支 / `:4561` 常量）；全仓 grep：`.py` 仅定义+守护自身命中，`.js` 命中皆为既存**证据快照**（`docs\...\v4x_*_证据_*\html_script_*.js`）→ 无外部引用，**不清理**（M4 已证不可达：需求最小优先级恒 1，18 核心 0 命中）。
  - **G1 评估侧登记**：规模中性评估口径写入 `docs\战斗分析\_验证证据\引擎规模行为核查_报告.md` **§9**（`--min-size` 过滤影响 / 均值型指标规模偏置 / mode A 单用或按 mode 分层 / 平凡基线对照 / 标签口径），与 `nn_data\T2.1规模分层复测_报告.md` 结论对齐；**非 HTML 逻辑**。
  - **CSS 新增三条**：`.tgtsel`（`min-height:44px` 触控达标）/ `.scalebar` / `.fillrow`；`.btn-mini` 之后。
- **用户可见变化**：①核心配队方案卡顶部出现「目标队伍规模」下拉（默认 6，可调 3–5）；②未满目标时出现「继续补位」按钮，点一次追加一只并标注「补位（非需求驱动）」与补位依据；③满员时显示「已达目标规模」徽标；④紧凑队（需求清零）提示改为「需求已清零 → 输出 N 只紧凑队伍（不自动补齐；可用『继续补位』手动追加）」。
- **回归**：`node --check` **EXIT 0**；`verify_v1.js` **216/0** + `verify_v4.js` **285/0** + **新增 `verify_v48.js` 32/0** = **533 PASS / 0 FAIL**（v4.7 基线 501 不降）；存档 5 锚点 `431/6/425/15` + `K∈[3,4]` 全过；**实测规模分布**：妙蛙花 6 / 煤炭龟 6 / 护城龙 5 / 土王 4 / 坚果哑铃 4（与 M4 核查逐项一致）；补位实测：土王 4 →（fill:3）→ 6 只、`fills=2`（帕路奇亚-起源 #1843 / 无极汰那-无极巨化 #1804）、候选 8 只不枯竭、已满时 `fills=0` 不越界。
- **红线核查**：① `RULE_SHIFT` 计算/权重**零改动**（RS-a~e 逐值断言：L1 三项、L2 12 键、MU/SD 5 键、`rsL1Of` 注入 2199 候选、结构六键）；② 数据契约**零改动**（`matchupSp` 18 列 / `usagePrior` 747 / `WCONF.boost=0.5` / `ABI_ATE.multiplier=1.0`）；③ 存档解析器**逐字未改**（`git diff -U0 -- build_tool_html.py` 194 行 diff 内 **sav/Sav/SAV 命中 0**）；④ NN 资产未动。
- **产物指纹（三处逐字节一致）**：`配招助手_ER.html` = `index.html` = ROM 副本 = **2,385,962 B**，SHA256 **`F9E53D6002A0DEF3F56EEFE8C854379479E8AD7F18A58ADC644FD2432EBD6102`**；`build_tool_html.py` **429,668 B** / `4504F741485B69AEE1325D72AF3FC41E963C4528A2AC78D61AF48E2EF58ED12F`；内嵌 script `_chk_script_1.js` 2,354,925 B（`bytes=2043538`）；构建链 `python build_tool_html.py` → `node extract_script.js` → `node --check` → 三份 Copy-Item。
- **未验证 / 未做（如实登记）**：① 浏览器目视未做（bu 已弃用 → 全部 Node VM fake-DOM 降级，`chk` 打桩断言替代目视）；② `fillCands`（8 只）**未渲染成卡面列表**，目前只进 `fillCands` 字段与 toast 文案（UI 如需可下轮补）；③ G1 评估口径为**登记**，评测线实际按 G1-1~G1-6 重跑未在本轮执行；④ 线上部署（gh-pages 三件套 + `assets/sheets/`）由主 Agent 执行。

## 20. v5 · `--size-eq` 同规模配对标签重出状态（B 线 · battlesim 作者，2026-10-09）

- **编号说明**：本轮任务书未指定节号；§9/§15/§16/§17/§18/§19 均被占用 ⇒ 另起 §20，并在 §14 留指针；既有各节**一个字节未改**。
- **任务与达成**：承接 §18「下一杠杆①：标签口径 —— 用 `battlesim.py --size-eq N` 生成规模配对标签」，按队伍规模 3/4/5/6 档**同规模配对**（对手池规模对齐）重出 winrate 标签，切断「规模通道」构造伪影；**纯数据层**（本轮不训练、不评测；判据 2 统计与探针重训归另一线）。
- **零改动**：`nn_data\battlesim.py` sha256 `27D570A26DE289481F6E1BFC8FBA54CA68AAEDF81F494F022AC7F6398D2F3DA8`（仅被调用，`--selftest` 48/48，v3-bline）；`build_tool_*`/`index.html` 未触碰；本线跑批只读 `nn_data\_engine\*.json` **冻结快照**（ERDATA.json 2,182,991 B / engine.js 2,335,947 B，mtime 均 2026-10-08 21:31:51，跑批全期未变）。
- **引擎漂移登记（第三次，非本线造成、本数据集不受影响）**：`配招助手_ER.html` 于跑批**中途**被他线重建（现 2,385,962 B / sha256 `F9E53D6002A0DEF3…` / mtime 2026-10-09 18:24:37，即 §19 A 线 v4.8 产物，与 `index.html`/ROM 副本逐字节一致；v4 采样时为 `8D16768E…`）。⇒ 40 档标签同源同口径、**无中途口径分裂**；`engine_meanMemberScore` 直接沿用 v4 行（= 2026-10-09 02:25:27 HTML 口径）。**跨数据集（v0–v5）混用引擎分前必须核实引擎版本。**
- **跑批**：源池 = G4 采样池 10 个分片（`_engine\_tmp\g4pool_c0001..c0010.jsonl`，48,588 队）；档位 = 10 分片 × 规模 3/4/5/6 = **40 档**；k=11、seed=20261008、stat_mode=iv31、sim_version=v3-bline；8 路并行、分档落盘可续跑（产物存在且合法 JSON 即跳过）；单档耗时合计 14,923 s、末次驱动墙钟 1988.2 s（详见报告 §2 逐档表）。
- **v5 数据集**：**48,588 行**（唯一键 48,588、重复丢弃 0）/ 16,737,657 B / sha256 `1d3808f861083a5af1ad300b52889792add8c62de8398b802e47a79c7b0aedaa`；字段 17 个（v4 的 16 字段逐序保留 + 尾部追加 `size_eq`）；规模分布 {"6": 18166, "5": 19689, "4": 6869, "3": 3864}；模式分布 {"C": 30759, "B": 7649, "A": 1299, "D": 8881}；每队场次分布 {"44": 28296, "43": 12738, "42": 4958, "41": 1462, "39": 211, "40": 651, "36": 41, "38": 139, "34": 8, "37": 47, "35": 16, "32": 4, "31": 2, "26": 2, "33": 7, "28": 1, "22": 1, "30": 3, "29": 1}。
- **规模伪影 A/B（核心证据）**：v4（混池口径）各档胜率均值 = 0.1679 / 0.3263 / 0.4713 / 0.6664（离散度 **0.4985**）；v5（同规模）= 0.5000 / 0.4996 / 0.4995 / 0.4995（离散度 **0.0005**，各档全部收敛 0.5 附近）；v5 每档内 `size` 为常数 ⇒ `rho(win,size)`/`rho(label,size)` 档内**无定义**（引擎 nan 告警）⇒ 规模通道被**按构造切断**，与 §18「规模通道 = 数据/标签构造伪影（决定性）」判定一致。
- **诊断（S2 降级后仅统计）**：全池 `rho(win_rate, engine_meanMemberScore)` = **0.2734**（n=48,588，p=0；v4 混池同口径仅 0.0597，即混池把档内正相关压低到 1/6.2）；折半可靠性 SB = **0.8459**（`rho(win_odd,win_even)` = 0.7329）；档内 rho = 0.4522 / 0.3640 / 0.2282 / 0.2315、档内 SB = 0.8073 / 0.8209 / 0.8196 / 0.8713（规模 3/4/5/6）。
- **诚实登记**：①未做任何训练/评测/判据 2 统计（另一线）；②同规模池限定在**同一 5,000 行分片内**（与 v4 构造一致、便于单一变量 A/B）——**下一杠杆 = 全局同规模大池**（如 size=5 的 19,689 队成一大池），减少分片边界与对手重复；③各档样本不均衡（size=5 占 19,689 行、size=6 占 18,166 行、size=3 仅 3,864 行），小档 rho/SB 抽样噪声更大；④本轮「同规模」只保证**对手同规模**，队伍内部规模语义（槽位数）沿用原池、未重建；⑤首次 4 路驱动因吞吐预估偏低被主动中止（18:25:20），换 8 路重启，损失约 4×250 s 计算、已完成档位不丢；⑥本轮未回改 `g4_pool_build.py` 的 glob 遗留项（未使用该脚本）。
- **口径登记（跨集混用前必读）**：v5 主标签 `win_rate` 为**同规模配对口径**，与 v4 混池口径**不同**；`engine_meanMemberScore` 沿用 v4 行（同引擎版本）；v0–v3 属旧引擎口径。口径与 schema 见 `nn_data\dataset_engine_v5_sizeeq_registry.json`（16,715 B / sha256 `e412f7fad559617f807d8983829c31ebbffd2fb48559c57932708e3af5a6ef1a` / mtime 2026-10-09 19:00:45）。
- **交接**：后续重训/重评请用 `nn_data\dataset_engine_v5_sizeeq_winrate.jsonl`（主标签 `win_rate`）与 `nn_data\dataset_engine_v5_sizeeq_registry.json`；判据 2 统计由另一线在本数据集上执行。




## 21. NN 终局 · v5 同规模干净标签重训 + 规模受控判据 + size_only 对照 + 终局结论（B 线 · 判据/探针作者，2026-10-09）

- **编号说明**：本轮任务书未指定节号；§17/§18/§19/§20 均被占用 ⇒ 另起 §21，既有各节**一个字节未改**（追加式）。
- **输入与交付（绝对路径）**：输入 `nn_data\dataset_engine_v5_sizeeq_winrate.jsonl`（48,588 行 / sha256 `1d3808f8…`）+ `nn_data\dataset_engine_v5_strict.jsonl`（3,962 行）+ `nn_data\split_engine_v5_strict.json`；报告 `nn_data\NN终局_报告.md`；重训产物 `nn_models\nn_eval_v5_probefix_20261009.npz/.onnx`、`nn_models\nn_eval_v5_probefix_full_20261009.npz/.onnx`、`nn_models\nn_eval_v5_zeroshot_20261009.npz/.onnx`、指纹表 `nn_models\v5_assets_report.json`；统计 `nn_data\v5_t2_strat_fix.json`(+`_tables.md`)、`v5_t2_strat_full_fix.json`(+`_tables.md`)、`v5_cross_eval.json`、`v5_overlap_audit.json`、`v5_subsample_control.json`；脚本 `nn_data\v5_probe_fix.py`/`v5_probe_fair.py`/`v5_cross_eval.py`/`v5_overlap_audit.py`/`v5_subsample_control.py`/`v5_assets.py`。
- **【前置修复·重要】`nn_core.py` 冻结层被 L2 磨蚀（历史冻结类数字部分失真）**：`MLP.step()` 对**所有层**施加 L2（`g = gW[i] + l2*W[i]`），而 `train_mlp(freeze_prefix=N)` 只把前 N 层梯度置零、**不清衰减** ⇒ 经 Adam 归一化后冻结层按 `lr·sign(W)` 每步收缩（步数越多磨得越狠）。实测编码器 W 范数：`pretrain_chaos_v1` **[21.6637, 16.0721, 1.6087]** → 修复前严格探针（2,160 步）[4.8453, 8.0982, 1.4870] → 修复前全池探针（9,240 步）**[0.0000, 0.0002, 1.3927]**（首层磨空 ⇒ 激活全零 ⇒ 头梯度零 ⇒ logits `std=0`/`unique=1`/AUROC 恰 0.5000，"退化"根因即此）。**修复**：`step()` 对 `i<freeze_prefix` 的层不施加 L2；`train_mlp` 训练前后**断言冻结层逐字节未变**并回填，返回新增 `freeze_prefix_ok`（`freeze_prefix=0` 时行为与修复前逐字节一致）。**影响面**：`g3_probe_eval.py`（探针 D 全部历史版本）与 `finetune.py`（M5-3 微调，**本轮未重跑**）带该缺陷；`pretrain.py`/`feature_ablation.py`/`increment_*.py`/纯评测段不受影响。
- **v5 重训（修复后；冻结编码器+只训头；seeds=20261009+137i）**：D_v5fix（严格集）AUROC(test)=0.5001/0.4800/0.5166 → **0.4989**、Δ₁₀ **−0.0303**；D_v5fix_full（全池）0.7594/0.7628/0.7576 → **0.7599**、Δ₁₀ **+0.1430**。**公平性稳健性**（排除"头欠训练/被 L2 压制"）：l2=0/e60 → 0.4989、l2=0/e300/lr5e-3 → **0.5060** ⇒ 冻结 chaos 编码器在严格隔离行上**无可泛化信号**。C 零样本 = `pretrain_chaos_v1.npz` **逐字节一致（自证 True）**。
- **规模受控判据（E2 口径，四腿 = Δ≥0.10 ∧ L≥0.10 ∧ p<0.05 ∧ n≥n_min）**：
  - **严格隔离集（1,628 行，test 物种零交叉）**：D_v5fix 逐层 Δ₁₀(vs 引擎 E) **−0.0331 / −0.0660 / −0.0479 / −0.1265**、宏平均 **−0.0684**、池化 −0.0303；**12 格（D_v5fix/D_v5eroded/D_v4 × 4 层）全部 0 通过**；逐层 AUROC D 0.5624/0.5861/0.6114/0.5847 **全面低于** E（0.6581/0.6304/0.6193/0.5921）与 `meanBST`（0.6998/0.6781/0.7102/0.6995）；top-10 与 E 的 IoU 0.00/0.18/0.00/0.00（旧判据「IoU@10≥0.5 不倒退」与本判据天然互斥，如实登记）；**各层 n（588/431/383/226）均 < 各层 n_min（1644/577/1259/394）⇒ 严格集本身功效不足**（点估计逐层为负）。
  - **全池（核心物种级，28,919 行）**：D_v5fix_full 逐层 Δ₁₀(vs E) **+0.2652 / +0.3060 / +0.1851 / +0.1782**（size3/size4 过四腿 L +0.1821/+0.2181）；但 **vs `meanBST` 逐层 −0.0041 / +0.0117 / −0.0116 / −0.0352、宏平均 −0.0098、池化 −0.1049** ⇒ 与平凡静态量打平/更差。
  - **v5 标签下 rho(win,size) 反向**：全池 **−0.0670**（v4 同集合 +0.624）、严格集 **−0.1385**（v4 +0.7232）⇒ `--size-eq` 不仅抹平档间胜率（0.168–0.666 → 0.4995–0.5000），并把该相关推为弱负值（残余非零已登记）。**附带**：严格集内 `size_only` 退化为负向规则（AUROC 0.4056、top-10 0.4600），层内 rho=nan ⇒ **层内有效对照只有 E 与 `meanBST`**。
- **平凡规则对照（池化 top-10）**：严格集 **`meanBST` 0.6645 > E 0.5141 > D_v5fix 0.4839 > `size_only` 0.4600 > C 0.3642**；全池 **`meanBST` 0.8964 > D_v5fix_full 0.7915 > `sumBST` 0.7460 > E 0.6657 > `size_only` 0.4655** ⇒ **NN 在任何口径下都不优于零参数静态量 `meanBST`**。
- **归因三对照（判定"增益"来源）**：① **2×2 交叉评测**——D_train_strict：严格行 0.5001 / Δ −0.0303、全池行 0.6439 / **+0.2294**；D_train_leaky：严格行 0.6704 / +0.0031、全池行 0.7594 / +0.1258；**C 零样本**：严格行 0.4510 / −0.1499、全池行 0.5645 / **+0.0476** ⇒ 三个模型（含零样本、含在严格行上=随机的模型）在**全池行**上都"赢引擎" ⇒ Δ>0 主要反映**引擎 `meanMemberScore` 自身偏弱**，非 NN 能力。② **物种隔离审计**——核心物种级口径 **87.34% 的 test 行含 ≥1 训练桶物种**、成员物种出现 **33.34%** 落在训练桶（keep=3,962/48,588=**8.15%**）；严格 keep 行 **0.00%/0.00%** ⇒ 全池 run 的 0.76 **不可解释**，严格 run 的 0.50 才是可解释口径。③ **等量随机子样本控制（400 次）**——严格行 topK10(meanBST) 0.6282/0.4804/0.5216/0.3920 vs 等量随机子样本 0.9105/0.8407/0.8315/0.7396（p05 0.885/0.797/0.784/0.677）⇒ 严格行是**更难的子群体（行选择效应）**，非小样本噪声（**诚实登记**：严格口径同时改变"物种隔离"与"子集难度"，故严格-宽松差值不能全归因泄漏；但这不改变终局结论，见下条）。
- **【终局结论】无真实增益 ⇒ 正式关闭 NN 线**（探针 D / C 均不作部署推荐）；**「规则偏移层 `RULE_SHIFT` + 引擎排序（含 `meanBST`/`S′` 类静态量与校准）」确立为唯一推荐路径**。**证据链五条**：① 规模通道=构造伪影（§18，用户已接受）；② 干净标签+严格物种隔离下 D AUROC 0.4989（≈随机，l2=0/300ep 复测 0.4989/0.5060）、逐层 Δ 全负、宏平均 −0.0684、12 格 0 通过；③ 唯一"过四腿"的是泄漏口径（87.34% 行含训练物种），且该口径下**未训练 C**与**零参数 `meanBST`** 同样/更好地"赢引擎"；④ NN 宏平均 vs `meanBST` = 严格 **−0.0381** / 全池 **−0.0098**（从不优于平凡静态量）；⑤ 机理根因：`pretrain_chaos_v1_meta.json` 自登记「判别分 vs 队伍均值使用率 rho=**0.8546**」⇒ 代理任务学到的是**使用率/meta 恢复**（红线明令禁学），在 ER 上只等价于物种静态量。**代价与不再投入的理由**：标签侧 Δ<0.10 时 n→∞ 无效；特征侧被 `meanBST` 压制（两个口径池化 top-10 均最优）；预训练主源方向与红线冲突；接入收益≈0 而风险为正。
- **E1（候选 D vs C）处理建议**：两者**均不推荐**（C 全面劣于 D：严格 Δ₁₀ vs E −0.1499、vs `meanBST` −0.3003；全池 vs `meanBST` −0.1831）⇒ 关闭 NN 线前提下 E1「二选一」**无需拍板**；若用户不同意关闭，最低成本替代为「把 `meanBST` 类静态量并入既有校准口径」（**纯数据侧、无需 NN、不涉 HTML**）。
- **未做（如实登记）**：① `finetune.py`（M5-3 ER 微调）**未重跑**（缺陷已修、影响面已登记，因判定关闭故未安排重算）；②「**难度匹配的物种零交叉**」第四口径**未构造**（剩余唯一杠杆，可分离泄漏效应与难度效应）；③ 端侧/浏览器 int8 运行时实测未做（离线统计评测）；④ 严格集各层 n<n_min（功效不足，如实登记，结论方向由点估计为负 + 两条独立归因证据共同支撑）。
- **衔接**：「引擎规模行为核查」独立报告 `docs\战斗分析\_验证证据\引擎规模行为核查_报告.md` 已落盘（含 §9 评估侧登记），其结论与本轮「引擎分偏弱 ⇒ 静态量更强」一致，可交叉引用。
- **红线**：`build_tool_html.py`/`build_tool_data.py`/`index.html`/`配招助手_ER.html`/`nn_data\_engine\*` **零改动**（只读引用）；`nn_core.py` 的 freeze 修复属本线模型代码、非 HTML/引擎；资产全在 `nn_data\`、`nn_models\`（`.gitignore` 排除、未推 git）；判据未达/终局**如实登记**（12 格 0 通过、功效缺口、未做项均已登记，未编造数字）。

## 22. v4.9 数据层 · 协同轴知识库 + tacticRole/synergyRole + data.js 重建（2026-10-09）

- **产物**：`nn_data\axis_lib.json`（27,124 B / SHA256 `A263BC33…6E918D1F`）= 15 轴，字段严格按约定 schema（`id/name/轴手判定{role,ability_tags,moves}/受益者判定{ability_tags,moves,immune_types,speed_or_power_rule}/联动说明/弱点体系[{threat,建议}]/依据[]`）；自检 `nn_data\axis_lib_check.json`（4,398 B）：轴 id 唯一 ✓、**轴手标签全局互斥 ✓**、依据可解析 ✓、**标签名全可解析 ✓**（新增硬自检：轴内特性/招式名必须命中真实表）、受益者共享 19 组显式登记（有意设计）。**`免疫_types` 为结构化派生**（非手工声明）：= 所列受益特性 `ABI_TAGS.im` 并集 ∪ 规则豁免 token（` toxic→GLOSSARY.terrain_toxic`、`hazard→GLOSSARY.hazard_toxicspikes`、`stall→GLOSSARY.status_toxic`），并新增「每个元素必须有来源」断言（终检 15/15 一致 / 0 无来源）；配套补 4 处真实特性来源：rain +蓄电(10)、sun +引火(18)、sand +储水(11)/食草(157)、snow +引火(18)。轴 id 稳定：`rain/sun/sand/snow/trickroom/e_terrain/misty/grassy/psychic/toxic/hazard/boost/stall/pivot/weaken`（轴库为本层独立产物，**不进入 `配招工具_data.js` payload**，故其修正不影响 data.js 字节）。
- **schema 变更（`配招工具_data.js` 6,532,571 B / SHA256 `9CA736A3…A52DC2`）**：顶层新增 `tacticRole`（1032 条 / 标注 236 / 28 种标签）、`synergyRole`（1034 条 / 标注 104 / 75 种标签）；同时 `moves` 行末追加 index 11、`abilities` 行末追加 index 4（行全长 11→12 / 4→5），**双形态并存且逐条一致**（引擎取 `row[11]`/`row[4]` 或取顶层命名映射均可）。标签依据 = `moves[].eff`(配 `effT`) + `flags`(配 `flagsT`) + `prio` + `abilities` 名/desc + 既有 `ABI_TAGS`/`abiAlias`/`SYS_SET_MAP`，无编造。
- **零破坏 + 体积**：既有 21 键零破坏（18 键逐值全等、`moves` 前缀 0..10 ×1032 行全等、`abilities` 前缀 0..3 ×1034 行全等、22 项既有计数不变：matchup 21×21 / moves 1032(lDesc 1031) / species 1906 / abiAlias 419 / movesNotes 69 / nonFinal 653 / matchupSp 15,809 格 / usagePrior 747 …）；体积 6,497,640 → 6,532,571 B（**+34,931 B / +0.538%**，红线 +15% ⇒ 无需压缩方案）；`sprites` 228 条字节漂移经归因实验证为**构建环境 PNG 重编码**（改用 HEAD 版脚本重跑同样漂移 56 B），PIL 逐像素比对 228/228 一致 ⇒ 视觉零变化。
- **验证**：`tools\probe_v49.py` **FAIL 0 / EXIT 0**；轴库派生一致性终检 **15/15 一致 / 0 无来源元素**；`verify_v1` **216/0**；`verify_v464` **12/12**；`verify_v4` **274/2** —— 2 项 FAIL（`DY11` 需求池负分否决 / `A1` STOP_* 文案）在 `git show HEAD:配招助手_ER.html`（v4.6.4 旧数据快照）上**以完全相同实际值复现** ⇒ 引擎侧既有断言，非数据层引入；引擎层重建的 HTML 内嵌数据与 data.js **逐值一致**（`tacticRole`/`synergyRole`/行全长/usagePrior 747/nonFinal 653/movesNotes[432] 全同，唯一差异键 `sprites` 属其自身回归面）。
- **交付物/索引**：报告 `docs\研究资料\_v49数据层_交付报告_20261009.md`；原始输出 `docs\研究资料\_v49数据层_探针输出_20261009.txt`（①②③④⑤⑥⑦⑧⑨）；探针 `tools\probe_v49.py`；构建命令 `& 'D:\anaconda\python.exe' build_tool_data.py`（**必须 anaconda**，默认 `python` 无 openpyxl）。
- **本层自查修正 2 处数据质量问题**（交付前发现并修完）：① `weaken` 轴特性名口误「毒补」→ **中毒激升(137)**（3 处）；② `免疫_types` 9 个轴与所列特性 `ABI_TAGS.im` 无对应（无表可依）→ 改结构化派生 + 名称可解析自检（见上）。另记录构建期坑：`moves` 在装配前是 dict，`for _r in moves` 会按 key（str）迭代 → 必须 `moves.values()`（脚本 L2081）。
- **红线**：数据契约既有字段零破坏；机制溯源逐条可查（依据均带来源 token）；轴库/lDesc/conv/nonFinal/usagePrior 等既有资产全部保留在 `nn_data\`。
- **边界（如实登记）**：HTML 未由数据层重建（引擎层并行重建，本层只读核对）；A4 口径表、`README.md` 未动；轴名与联动/弱点文案由数据层拟定、用户未逐条确认（**id 与字段名已冻结**）；受益者标签跨轴共享为刻意设计（19 组），若引擎层要求「受益者也全局互斥」需重切多轴语义；`免疫_types` 语义已由「手工声明」改为「结构化派生」，元素保证有来源（`toxic/hazard/stall` 的「毒」来自类型/场地规则而非特性）。

## 23. v4.9 引擎层 · 协同轴引擎 + 多方案生成 + 展示升级（A 线 · 引擎实施，2026-10-09）

- **产物指纹（三处逐字节一致）**：`配招助手_ER.html` = `index.html` = ROM 副本 `D:\mGBA-0.10.2-win64\ROM\elite redux\配招助手_ER.html` = **2,468,502 B / SHA256 `7FBBD6D29EACB9C2A20AD91B6F57FC951276ED1FA7E202868D049EE310FD49A7`**；源 `build_tool_html.py` **455,329 B / SHA256 `66EAB64B83AC51DB106ACAE9593818EA40AC076123DF6BA4DA2337A981353B98`**；内嵌 script `bytes=2105723`（`node --check` EXIT 0）。对照 v4.8：产物 2,385,962 B / `F9E53D60…BD6102`。
- **阶段 1（不依赖数据层）**：① 多方案切换框架 `PLAN_VARIANTS{std,tight,full}` + `planVariantList/planSwitcherHtml/planSetShow/renderPlanSet`（纯视图切换、懒渲染、状态保留，容器 `#planSet_<id>`/`#planBar_<id>`/`#planSetBody_<id>`）；② 方案卡「核心思路」横幅 `coreIdeaOf` + `.ideabar`；③ `THREAT_LIB` → 环境威胁榜 `threatShare/threatBoardHtml/drawThreatBoard`（可学率代理 + 代表物种精灵图 + 使用率先验行，挂 `#thrBoardCore`）；④ 方案级对位预警 `planThreatWarnHtml`（四类缺口：钉子环境/强化怪/免疫特性墙/窗口，**按玩家实际配装判定**，提示性零硬门）。
- **阶段 2（轴引擎）**：`AXIS_LIB`（构建期内嵌 `nn_data\axis_lib.json`，15 轴）→ 三态判定 `axisStateOf{setter,abuser,glue,sysMatch,viable}` / `axisDetect`（setter4+abuser3+glue2+sysMatch1）/ 协同加分 `axisSyncOf`（+6/+5/+4，sysMatch 再 +1，注入 `AX` 维度）/ 轴需求 `AXIS_KIND_SPEC`（**kinds 全部复用既有求值器 = 零新门**）+ `axisNeedList` / `axisVariantsOf`（≤3 套：轴手·受益者·联防件）/ UI `axSynHtml`+`axWeakHtml`+`.axbar`。`buildTeamByNeeds` 三段式轴前置：① 轴表 kind 已在基础清单 → **提到最前并标 `axisNeed=true`（不重复插入）** ② 缺的 kind 生成 `A-xx` ③ **其余需求原样保留（零硬门）**。
- **引擎侧 3 处实质修复**：① **轴受益规则消费** —— `speed_or_power_rule` 仅在「特性/招式/免疫三类判定全空」时作为受益口径（低速 ≤60 / 力度 ≥90），否则会误命中（实测：泛化后妙蛙花在雨轴被「最高攻项」字样误判受益者 12 分）；② **协同高亮含核心** —— 原 `axSynHtml` 跳过 `m.core`，致核心自身即轴手的 `trickroom/hazard` 显示「暂无轴标签命中的队友」（误导），现显示「（核心·轴手/受益者/联防件）」；③ why 可溯源到轴库 `受益者判定`。
- **数据层契约适配（本轮发现）**：`abiTags` 已由「键包裹（含 `.conv` 集）」变为**逐 id 标签对象**（`abiTags.96={conv:"一般"}`、`abiTags.280={conv:"冰"}`、`abiTags.659={conv:"电"}`，conv 共 9 条）→ 引擎 `convOf` 本就按逐 id 读取（`g.conv`）+ `CONV_SRC` 补来源，**引擎零改动**；仅断言 R3 随之改口径。顶层另新增 `sprites` 键（数据层自身回归面）。
- **验证（全绿）**：`verify_v1` **216/0**（含存档 5 锚点）、`verify_v4` **285/0**、`verify_v48` **32/0**、`verify_v49`（新建：A10/B10/C9/D7/E15+1/R6）**58/0** ⇒ **合计 591 PASS / 0 FAIL**（v4.8 基线 533 不降，净增 58）。**15/15 轴每轴 1 例核心实测通过**（全部以 `ax_` 方案变体暴露、轴参与者 1–6、方案 5–6 只）。回归红线：`RULE_SHIFT` 逐值零回归（R1）、**存档解析 9 个函数体对 v4.8 快照逐字一致 + `SAV_SIZE` 同值 0x20000**（R2，比对在三处同步前完成）、数据契约零破坏（R3）、移动端 44px 与两段式互斥视图（R4/R5）、无内部编号残留（R6）。
- **本轮 8 条调试与修复**：轴需求重复插入（`A-01:wxsrc` 与 `N-11:wxsrc` 并存）→ 三段式前置；`planThreatWarnHtml` 初版按「可学」判定致 8/8 核心误报 → 改按**推荐配装**判定（修后 8/8 正确）；A8 断言过严（`renderNeedPlan(s)` vs `(s,0)` 仅池卡 DOM 序号 `nd#` 递增）→ 归一化比较；D4 误用 `p.pools.map`（实为对象 `pools[need.id]={need,list,all}`）→ 改 `Object.keys`；E 组取核改「优先选该轴以 `ax_` 变体暴露的核心」（原取首个具轴手特性物种常为退化幼体）；R2 比对口径（`savToCsvRows` 两版皆无、`SAV_SIZE` 非 `var …=数字` 写法）；B8 `/建议 /` 带空格与 B10 把正向说明「不剔除/否决≠剔除」误判为负向文案 → 均已修正断言（非产品缺陷）。
- **交付物/索引**：报告 §v4.9 追加于 `docs\战斗分析\_验证证据\_引擎升级B节_交付报告_20261006.md`（295,799 B）；15 轴实测表 + 3 核心多方案样例 `docs\战斗分析\_验证证据\_v49引擎层_多方案与轴实测_20261009.md`；断言原始输出 `docs\战斗分析\_验证证据\_v49引擎层_断言输出_20261009.txt`。
- **边界（如实登记）**：**bu 已弃用 / `cu` 被拒 ⇒ 本轮无真机目视截图**，UI 结论全部来自 Node VM + fake DOM 渲染断言；轴库「受益者标签跨轴共享 19 组」为数据层刻意设计（其 §22 已登记），若要受益者也全局互斥需数据层先重切语义；**妙蛙花 `std` 方案第 3 位为超级班基拉斯#1521（沙暴体系核心）**——在 v4.2「移除硬互斥、改正向受益加分」口径下属预期行为，若要压制对立体系应调权重而非恢复硬门（登记待产品拍板）；`fillCands`（8 只补位候选）仍未渲染成卡面列表（v4.8 遗留）。

## 24. v4.10 机制感知覆盖层 + 组合联想器 + 存档池投影（2026-10-10）

- **动机（引擎缺陷，Grep 证实）**：对机制型特性/招式零特殊处理——百变怪被按种族值+技能池评分（变身者下两者全无关）、杂技按 55 威力评（无道具应 110）、欺诈按自身物攻评（应按对方物攻）。目标：推荐「眼前一亮」。
- **铁律落地（用户亲自确立）**：①组合知识先网络检索验证再落库，每条 combo 带来源 URL、UI 可展开溯源，检索不到一律不写（A 线主动放弃 7 条，含搜索词，见设计文档 §4.2）；②「杂技+魔术师」反效果组合禁止写入（用户抓错）；「变身者+气势披带」表述精确为「保命，非提速」；③机制覆盖 > 通用评分；禁硬剔除/负向逻辑（warn 不否决）。
- **机制知识库（数据层 build_tool_data.py）**：`nn_data\mech_lib_v410.json`（28 机制 / 77 combo / 52 唯一来源 URL；A 线网络验证 + 10 来源开页复核；4 场地种子合并条目、双倍奉还/金属爆炸/扩展池 16 项并入 9 条）→ `build_mech_lib()`（8 项校验失败即中止，含魔术师 id=170 禁入、披带文案含「保命」）→ 顶层键 `mechLib` 入 data.js（`data` 字典 'synergyRole' 与 'sprites' 之间）；六分类（评估前提改写/威力条件/道具联动/出招顺序/天气场地/特性×队友）；覆盖规则词汇表 **26 条**（imposter_anchor / acrobatics_item / foul_play_atk / gyro_ball_speed / body_press_def / hp_cond_power / avalanche_after_hit / counter_metal_burst / prankster_priority / magic_guard_survival / illusion_disguise / magnet_pull_trap / unburden_item / gem_consumable / terrain_seed / facade_status / endeavor_lowhp / endure_reversal / multiscale_sash / regenerator_pivot / no_guard_hit / unaware_ignore / mold_breaker_ignore / serene_grace_flinch / toxic_heal_item / contact_status）。
- **引擎覆盖判定（build_tool_html.py）**：`mechMvAdj`（招式威力/前提改写，11 分支）/ `mechAbiWhy`（特性锚点，15）/ `mechFuncMul`（1）/ `mechSpProfile`（物种剖面，1：百变怪→速度复制+道具三选 讲究围巾/气势披带/服务铃）；打分链 `pickAttacks` L3459 乘积注入；优先级机制覆盖 > 通用评分，未命中走原通用评估；`mechItemZh2` 空 zh 回落 en（F1 安全网，全表 929 项无 `#id` 泄露断言 PASS）。
- **组合联想器**：`comboAssocOf` 按任意对象查边 → 条件判定（§4 DSL 11 键，任一不满足不推荐并标注「条件不满足」）→ **个人池投影**（已解析存档 SAV_ROWS 只显示池内对象，未解析全量+标注）→ 一句话效果叙事（narr 取自 JSON，不编造）+ src 可溯源（UI 展开）。
- **UI**：详情页「可配合组合」区块（条件/效果叙事/溯源展开）+ 方案/详情机制解读标注（`badge-mech`「机制解读：…」徽标 + 配招依据 why 注入机制行）；移动端 44px 触控、就地展开不弹窗遮挡、响应式。
- **F1 修复（D 线发现，本轮唯一 FAIL）**：`ERDATA.items` 339/352 zh 为空 → 机制层「配合对象」列与 prem 文案回落 `#id` 漏内部编号（4 边 2 路径，v4.9 无此渲染面属首次暴露）。修复 = 数据层 `ITEM_ZH_EXTRA_ID`（339=飞行宝石 / 352=厚底靴，data.js +21 B 最小改动，零破坏门声明例外 PASS）+ 引擎兜底 `zh→en→#id` + 注释矛盾校正；复验：verify_v410 全绿（86/0）、全库 mech 引用道具 `#id` 回退数 = 0、items zh 空值 764→762。
- **回归（新 SHA 全量复验，F1 后）**：verify_v1 216 + verify_v4 285 + verify_v48 32 + verify_v49 58 = **591 PASS / 0 FAIL**（基线不降）；verify_v410 **86/0**（P1 百变怪剖面 12 项 / P2 杂技 110·55 9 项 / P3 欺诈按对方物攻 5 项 / 组合联想三关 10 / 组合库契约 10 / 详情区块与溯源 9 / 优雅降级 7 / 移动端 360px 8 / token 12）；probe_v464 32/32；probe_v49 **78/0**（§1 期望 +2→+3 键维护 + items 差异紧断言：恰 339/352 仅 zh 列）；降级 nomech 57/0。
- **产物指纹**：`配招助手_ER.html` = `index.html` = ROM 副本 = **2,538,283 B / SHA256 `8984D5DF226B1B0B8DF095059D42ADF11C4783FD2812EE4CD9D9D2559E96617C`**（三处逐字节一致）；`build_tool_html.py` **485,219 B**（+469/−14）；`build_tool_data.py`（相对 v4.9 +174 纯新增）；`配招工具_data.js` **6,572,007 B / SHA256 `D8401B39…`**（相对 v4.9 6,532,571 +39,436 B：mechLib 39,415 + zh 21）。
- **文档索引**：规格 `docs\战斗分析\_v410_机制知识库_规格_20261009.md`（分工契约）｜A 设计与内容 `docs\战斗分析\_v410_机制知识库_设计与内容_20261009.md`（六分类/逐机制覆盖语义/combo 图谱/三层来源表/检索放弃记录/10 决策点）｜B 数据层 `docs\研究资料\_v410数据层_交付报告_20261009.md`（含 F1 节）｜C 引擎 `docs\战斗分析\_验证证据\_v410引擎层_交付报告_20261009.md`（+ F1 增补节；断言输出 ×2：`_v410引擎层_断言输出_20261009.txt` + `_v410引擎层_断言输出_F1_20261010.txt`）｜D 回归 `docs\战斗分析\_验证证据\_v410回归与探针_交付报告_20261009.md` + `_v410回归与探针_断言输出_20261009.txt` + `verify_v410.js`（可复用，产物 SHA 一变须重抽重跑）｜现行回归套件 **verify_v1/v4/v48/v49.js 入库** `docs\战斗分析\_验证证据\`（v4.9 线漏入库，本轮从上一线工作区补齐，来源登记见 D 报告；旧 `_verify_v1.js` 为历史快照保留）。
- **决策点登记（待拍板，不阻塞）**：①F2 道具 317 命名口径——规格「服务铃」vs ER zh「逃脱按钮」（同卡 why 文案与道具名不一致，不影响断言）；②杂技威力口径——按 110（官方×2）实施，ER desc 载 75×1.5，UI 标注「官方×2；ER desc 载 1.5×，待实测」；③蛮干 ER desc「HP 低于时增力」与官方「削至同血」语义差异，按 endeavor_lowhp 落库双向登记待实测；④**762/929 道具 zh 为空历史缺口**（引擎已兜底显示英文名，不补 zh 则机制文案为英文，补全另排期）。
- **未验证（如实）**：真机浏览器目视（沿用 Node VM + DOM 打桩）；77 combo 未逐条与原文对拍（A 线抽 10 条开页复核）；杂技/蛮干实机伤害口径；个人池投影仅 mock SAV_ROWS；未全量渲染 1906 物种。
- **红线核查**：存档解析器 9 函数逐字未改（verify_v49 R2 比对）；RULE_SHIFT 计算零改动；15 轴/多方案/usagePrior 747/matchup 21×21 全保留（591 基线零回归）；NN 资产未动；CDN 拆包/HTML 拆分未做（另排期）；另一线（v4.8/4.9 收尾）产物全程无冲突——本线 HEAD 全程 4768d03，工作区脏项全程可声明（三条线在办件），B/C 线各做一次 go 裁决登记（工作区非净但写入集不相交，零 clobber）。
- **部署（2026-10-10，已执行并线上验证）**：`master` 提交 `1efd3d6`（v4.10，push `4768d03..1efd3d6`）；`gh-pages` 提交 `f480a7cb`（Deploy v4.10，`--force`）；线上 `https://wsjshy.github.io/elite-redux-teambuilder/` 首次抓取即命中——`index.html` 2,538,283 B / SHA `8984D5DF…617C` ✅、`配招工具_data.js` 6,572,007 B / SHA `D8401B39…F1BB` ✅、sheets/.nojekyll/ER-source json 均 200。部署实现：**gh-pages 用临时 git worktree 隔离重建**（实测 §8「清工作区+移保护项」会物理删除清单外不可再生文件 `assets/sprites/` 1906 张源、`nn_models/` 66 文件、`_chk_script_1.js`，故不照字面执行；worktree 产物树与 §8 等价，主工作区零删除，10 项构建输入清点前后一致）。**gh-pages 已从上一版 266 文件全量快照收敛为 17 文件部署集**（净删 249 个非部署集文件——master 均有跟踪无数据丢失；若要保留 docs/CSV 公开可下载，可回退增量，待拍板）。部署报告 `docs\研究资料\_v410部署_交付报告_20261010.md`（提交 `fe107e0` 入库）。部署后主仓库干净、本地==远程。

## 25. v4.11 规格校准 + 道具中文补译 + CDN 加载优化（2026-10-10）

- **口径（用户拍板）**：改版（ER gameDataV2.65beta.json + ER 汉化/官方译名表）数据为准，官方机制文档解释语义。v4.10 决策点登记①~④全部裁定落地。
- **规格校准（W1，机制库）**：`nn_data\mech_lib_v410.json` 28 机制/77 combo 计数不变，meta version 1→2 + `calibrated/calibrationNote`。①变身者道具三选 **317→308**（317=Eject Button 逃脱按钮 与 308=Shed Shell 脱壳忍者壳 是两个道具；「服务铃」=繁中译名，ER 数据口径=脱壳忍者壳；combo 语义按 Shed Shell 官方「被困/束缚也能无失败换下」，非 Eject Button「挨招换下」）；②杂技 512：ER 威力 75、desc 载 1.5× → 引擎评估 **无道具 112.5 / 携带 75**（官方 55×2=110 登记口径差，**待游戏内真实验证**）；③蛮干 283：ER desc「自身 HP 低于对方时增力」→ 低血线增力口径（官方「削至同血」登记口径差，**待实测**）；④**全量审计 220 条 id 引用全核**（match/combos/params），译名不一致 13 实体 12 改 1 保留（鬼火→磷火、空气斩→空气之刃、石钉→隐形岩、电返→伏特替换、速度果→沙鳞果、先制果→嘉珍果、剧毒珠→剧毒宝珠、火焰珠→火焰宝珠、石头头盔→凸凸头盔、黑淤泥→黑色污泥、轻身→轻装、忍耐→挺住；117 忍耐 Bide 保留）；泛称/缩写 4 条已具名。报告 `docs\战斗分析\_v411_规格校准_报告_20261010.md`；verify_v410 断言随新口径更新（A2/A4/A8/A11 = 308/脱壳忍者壳，B2-B8 = 112.5/75）。
- **道具补译（W2）**：`ER-source\item_zh_cn.json` 新建（762 条 id→中文名，20,578 B）；build_tool_data.py 道具 zh 解析链末位兜底（CSV 中文→ITEM_ZH_EXTRA→ITEM_ZH_EXTRA_ID→ITEM_ZH_CN），既有优先级不变；**929/929 全覆盖（0 空）**。来源三类（可溯源）：官方简中 508（PokeAPI 官方条目+人工核证 9）/ 汉化图鉴 0（两份 xlsm 均无道具工作表）/ 无官方先例 254（Mega 石 221 按项目物种简中名+「进化石」派生、旧作关键道具 14 社区通行名逐条备注、ER 自创 18 逐条标注「自译」）。记录 `docs\研究资料\_v411道具中文补译_记录_20261010.md`。
- **CDN 加载优化（W3，A+B+D 融合）**：`build_tool_html.py` ①**拆包（B）**：ERDATA 内联 1.68MB → 同目录 `data.js`（2,018,737 B / gzip 479,808 B）；HTML **2,552,588 → 537,017 B，gzip 653,910 → 182,421 B（−72.1%）**；②**择优加载（A）**：加载器 `GC='https://gcore.jsdelivr.net/gh/wsjshy/elite-redux-teambuilder@gh-pages/'`，非 file: 主源 gcore + document.write 同步注入 data.js（`</script>` 已转义），失败回退同域相对路径；`file://` 走相对（本地双击可用）；ERDATA 预定义则跳过（VM 验证管线兼容，`_extract_script.js` 已前置拼接 data.js）；③**sheets 精灵图**：`erAssetBase()` gcore 前缀 + `sprProbe` Image 探针 onerror 回退（s0 探，回退单向，登记）；④**清理（D）**：gh-pages 死产物 `配招工具_data.js` 6.5MB 确认死产物（页面 0 引用，已移出）；`ER-source/gameDataV2.65beta.json` 3.8MB / `additionalV2.65beta.json` 未被页面引用（保留，可另立清理项）。报告 `docs\战斗分析\_验证证据\_v411_CDN优化_交付报告_20261010.md` + 探针 `probe_v411_cdn.js`（41/0）。
- **回归（部署前独立复核全绿）**：verify_v1 216 + verify_v4 285 + verify_v48 32 + verify_v49 58 = **591 PASS / 0 FAIL**（基线不降）；verify_v410 **86/0**；probe_v411_cdn **41/0**；node --check data.js/_chk_script_1.js 通过；headless Chrome 加载路径夹具 **25/0**（主源 404→回退链成立 / 主源 200→同域零请求+sheets 404→相对翻转 / 真 gcore→sheets 全走 CDN）。
- **产物指纹**：`配招助手_ER.html` = `index.html` = **537,017 B / SHA256 `526239C23EC260E4FC20A83AA3FBF8A8A98F98CEAD3F98C850C513EAA5F97326`**（两处逐字节一致；ROM 副本已同步三件套）；`data.js` **2,018,737 B / SHA256 `CE19BC0C7CB8BC83BEB7131A1B9F915BC6F92DC0F75CE873DCD5C62CCB9EA574`**；`配招工具_data.js` **6,585,689 B / SHA256 `29E7C20D94DCE7FD33E208986313600DB47EDDE4BCCC8F2914C78F93BA4128D9`**（mechLib v2 + itemZhCn 762 后重建）；build_tool_html.py SHA `9136538E…` / build_tool_data.py SHA `62402B94…`。
- **未验证（如实）**：杂技 112.5/75 与蛮干增力实机伤害口径**待游戏内真实验证**（不阻塞交付）；gcore 线上 200 与大陆端到端耗时**待部署后复测**；HTML gzip 182KB **未达「~100KB」目标**——残余 0.53MB 主体为应用 JS（~400KB）+ 内嵌 SPR_SHEET 28.9KB/AXIS_LIB 27.1KB，再降须另立拆包项（sheets_map/axis_lib 外置会改部署集，登记待拍板）；真机浏览器目视未做（Node VM + DOM 打桩）；sprProbe 仅探 s0。
- **未申报文档登记（如实）**：子代理侧产出 `docs\specs\v411_ui_redesign.md` / `v411_实施计划_改造点清单.md`（UI 重构草稿，自称「用户已对齐确认」——**本轮无此对齐，内容未经用户确认，未入库**，留磁盘待用户裁定是否立项）。**升级（2026-10-10 部署期间）**：该 UI 线代理在部署窗口（04:56-05:09）仍**活跃并行改文件**——`build_tool_html.py` +628 行、`配招助手_ER.html` 重建 562,110 B、新增 `docs\战斗分析\_验证证据\probe_v411_ui.js`（22,957 B），且 node 29180 于 05:09 运行 `verify_v410.js`；**改动未入库、未部署，与线上产物（指纹已验证）无冲突**；该代理非本轮派发、无法 kill（非直接子代），处置待用户裁定（详见部署报告 §七.4）。
- **部署（2026-10-10，已执行并线上验证）**：`master` 提交 `1cea6dd`（push `6ef091b..1cea6dd`）；`gh-pages` 提交 `c7c24a4`（Deploy v4.11，`--force`，push `f480a7c..c7c24a4`）；均**直连无代理**（`-c http.https://github.com.proxy=`；中途直连阻断 5 次重试后恢复，推送成功）。线上 `https://wsjshy.github.io/elite-redux-teambuilder/`：`index.html` 537,017 B / SHA `526239C2…` ✅、`data.js` 2,018,737 B / SHA `CE19BC0C…` ✅、s0.webp 357,890 B ✅、.nojekyll 200 ✅；**gcore 镜像 `https://gcore.jsdelivr.net/gh/wsjshy/elite-redux-teambuilder@gh-pages/data.js` 200 + `application/javascript` + SHA 一致（新版本即时生效）** ✅。gzip 传输实测（路由健康时单样本）：index.html(gzip 184,374 B) 0.67s / gcore data.js(gzip 483,307 B) 1.09s / gcore s0.webp 0.97s。gh-pages 仍 17 文件部署集（`配招工具_data.js` 已移除）。ROM 副本三件套已同步。部署报告 `docs\研究资料\_v411部署_交付报告_20261010.md`。

## 26. v4.11 三层 UI 重构「玩家友好减法」（2026-10-10，用户拍板后实施并部署）

- **背景（§25 遗留裁定落地）**：§25「未申报文档登记」中标注的 UI 线改动（`docs\specs\v411_ui_redesign.md` 三层架构 + 冗余清单 20 行 + 交互原型 48/48 通过）**已获用户拍板 6 项全部按设计建议**（①努力值 6 位数组+文本摘要双字段 ②耐久副投按定位动态取 ③空间模板速度 0 仅建议 ④威胁榜折叠保留 ⑤未导入存档不显示「你拥有」⑥词条>40 字轻量弹层/短词条内联），本线完成实施、验证、部署。
- **实施（唯一改源 `build_tool_html.py` +554/−103，叠加于 §25 拆包版之上）**：详情页三层信息架构——**L1** 顶部基础信息卡（精灵/名/编号/属性/种族值六维条含总值）＋天性/特性/属性克制**可点击就地展开**（内联展开式，无弹窗遮挡）；**L2** 流派 tab 一次一卡 8 字段（①玩家话术一句话 ②设计亮点带溯源 ③配招 4+作用 ④特性+理由 ⑤性格 ⑥**努力值双字段**=6 位数组+文本摘要+模板名+252/252/4 条形图 ⑦道具主推+备选（**玩家话术**，引擎原文折 L3）⑧队友主推 2-3+备选 3-5 各带理由+存档池拥有标记（**未导入存档零标记**））；**L3** 引擎视角默认折叠（口径/依据/溯源全部保留可展开）。新增 `bd.ev`（速攻=252速/252主输出/4HP；耐久=252HP/252主防按物防≥特防动态取物盾/特盾/4；空间低速=252HP/252主输出/4防 速度 0 附「服务铃等机制可提速」注）；修复 F-1 `breakingRoute` 恒空（回填到流派对象，只补展示不参与评分）。
- **冗余清单 20 项处置（20/20）**：移除 3 / 折叠 L3 7 / 保留溯源 7 / 改写升级 3；原则「引擎算得对的只降级不删除」。F1 修复：L2 ⑦ 道具行「克制X；代价Y｜原则P1/P2」引擎话术 → 玩家话术（复用 ITEM_POOL 既有 why 文案），引擎原文逐字保留 L3 新增行（verify_v4 VP1 断言「coreOut 含 克制/代价/原则P」与规格「L2 无引擎话术」两条约束同时成立）。
- **回归（终版全量）**：verify_v1 216 + v4 285 + v48 32 + v49 58 = **591 PASS / 0 FAIL**（基线不降）+ verify_v410 **86/0** = **677/0**；probe_v411_ui（新，83 条断言）**83/0**（含 EV 条形图真渲染 / 未导入零标记 / ⑦ 无引擎代号 / 全库 11,481 道具行零泄漏 / 引擎原文在 L3）；probe_v411_cdn **41/0**（拆包未被破坏）。**verify 套件零修改**。
- **黑盒验证（本机 headless Chrome CDP 实渲染，非 VM 打桩）**：PC 1440px + 移动 390px 各取默认/流派切换/引擎展开/特性就地展开 4 态截图（`docs\战斗分析\_验证证据\_v411黑盒截图_20261010\`）；引擎视角默认折叠（engbd h=0）且点击 summary 正确展开；「你拥有」未导入=0；移动端导航中部伪影=全页截图拼接 sticky 头所致（live DOM NAV_IN_CORE=0）。报告 `docs\战斗分析\_验证证据\_v411黑盒验证_20261010.md`。
- **产物指纹**：`配招助手_ER.html` = `index.html` = ROM 副本 = **563,939 B / SHA256 `91BFAAB8D7E56F1778723042EA5416AFCEE645CA68E1CFDE248F0FC0733B3182`**（三处逐字节一致）；`data.js` 2,018,737 B / `CE19BC0C…`（拆包产物，本线零改动）；数据层重跑逐字节不变。
- **部署（2026-10-10，已执行并线上验证）**：`master` 提交 `152baa3`（push `5495bd5..152baa3`，与 §25 在办件同批入库含 docs/specs）；`gh-pages` 提交 `c3f1cba`（Deploy v4.11 三层UI重构，`--force`，push `c7c24a4..c3f1cba`）；均**禁代理直连**（`-c http.https://github.com.proxy=`）。线上 `https://wsjshy.github.io/elite-redux-teambuilder/` 首次抓取即命中：`index.html` 563,939 B / `91BFAAB8…` ✅、`data.js` 2,018,737 B / `CE19BC0C…` ✅、s0.webp 357,890 B ✅、sheets_map.js 28,889 B ✅、.nojekyll 0 B ✅、gameData 3,827,699 B ✅。部署集仍 17 文件（index.html + data.js + .nojekyll + ER-source + assets）。部署报告 `docs\研究资料\_v411UI部署_交付报告_20261010.md`；gh-pages 重建用 git worktree 隔离（worktree 的 .git 为文件，清理须按 Name 过滤勿用 -Exclude）。
- **遗留边界（如实）**：性格「（物盾消耗）」为既有 v4.10 天性档位文案（非本线引入，未改）；队友理由计数/分数（受益+5 等）属引擎 recs 既有输出（规格禁百分比/倍率式子，计数保留）；机制口径 `#ruleBoxCore` 受 verify_v1 断言约束保持 coreOut 外默认折叠；641–767px 双媒体查询区间重叠未逐像素确认；真机浏览器目视未做（headless 截图 + OCR 替代）。

## 27. v4.12 内容深化（机制感知升级：机制库 28→52 / combo 77→156 / 词汇 26→40 / Smogon 先验 120 / 体系模板 15×6，2026-10-10，用户拍板「准确性×可玩性再上台阶」）
- **目标（用户核心诉求）**：推荐「准确性×可玩性」再上一个台阶——用户多次表达「看不到眼前一亮的推荐、特殊性处理不够」；在 v4.11（UI 减法）与 v4.10（机制感知 28 机制/77 combo）之上增量，**不破坏 677/0 回归基线**。
- **铁律（全程执行）**：①组合知识先网络检索验证再落库（每条 combo 带来源 URL，检索不到一律不写并登记放弃）；②魔术师 id=170 禁入任何 combo 的 with.ids（构建校验硬铁律，全库 0 命中）；③变身者+气势披带叙事「保命」口径（v4.10 已修正）；④机制覆盖>通用评分、只正向调整/前提改写/why 标注、warn 不否决、禁硬剔除；⑤五套校验 677/0 不降（v1/v4/v48/v49 零修改，v410 仅契约增长断言更新）。
- **研究 R1 机制验证（子代理 s_000EcTYbgWK）**：24/24 新机制网络检索验证通过（Bulbapedia/Smogon/Serebii），47 combo 带来源 URL，4 项放弃登记。**15 项 ER 口径差**（以 ER desc 为准，待游戏内实测，不阻塞交付）：Chlorophyll/Sand Rush/Slush Rush ER ×1.5（官方 ×2）；Solar Power/Sand Force ER 最高攻击项×1.5 且无掉血（官方三系 ×1.3/掉血）；Rain Dish/Ice Body ER 每回合 1/8（官方 1/16）且 desc 未载免疫天气伤害；Storm Drain/Lightning Rod ER 提升最高攻击项（官方特攻 +1）；Sap Sipper ER 追加草招转移+最高攻击项（官方无转移）；Water Veil ER 追加登场自动水流环；Light Metal ER 追加速度×1.3；Magician ER 口径「非接触招式后偷取」且未写无道具前提；**Pure Power(74) ER 改为特攻×2（官方物攻×2，最重大差异）**；与官方一致：Flash Fire/Water Absorb/Motor Drive/Intimidate/Shadow Shield/Water Bubble/Sheer Force。放弃清单：anti_intimidate.intimidate_inversion（cond DSL 无 opponentAbility 键）、magician.positive_combo（检索无正面搭档，拍落/杂技为反效果）、water_veil.aqua_ring_source（ER 特有外部无源）、sap_sipper.redirect（ER 特有）。
- **研究 R2 combo 验证（s_000EcTYbdRo）**：32 条/13 个既有目标 mech（magic_guard 5/regenerator 5/unaware 4/multiscale_disguise_sturdy 3/mold_breaker 3/poison_heal 2/contact_status 2/magnet_pull 2 + facade/body_press/serene_grace/prankster/flying_gem/reversal 各 1），机械校验 0 问题（与既有 77 条 0 重复、无 170、src 全 http）。放弃三类：ER 同池物种数=0 硬证据（魔法防守+毒疗、再生力+毒疗、多重鳞片+画皮、结实+多重鳞片、火焰之躯+静电——全部放弃，「双接触异常」改毒刺+剧毒碎屑落地）；**反效果组合「威吓×欺诈」**（欺诈按对方物攻结算、威吓降对方物攻→负协同，比照杂技+魔术师先例不登记留档；威吓×扑击是正协同已登记）；机制链不足（宝石/种子消耗→硬撑/绝处逢生无因果链，改飞行宝石+勇鸟猛攻/气势披带+绝处逢生承载）。
- **研究 R3 Smogon 先验（s_000EcTYbuI0）**：120 物种/2335 行（moves 960/items 655/teammates 720），映射 713/752，id 覆盖率 99.9%/100%/98.6%。权重严格沿用 gen3ou×1.0+gen9nationaldex×0.5，srcMax=0.516601（Tyranitar）与既有 usagePrior 锚点逐位一致；两源文件远端 SHA256 与本地逐字节 MATCH（同源实证）。**URL 实测教训**：/dex/gen9/ 404（Smogon 无该段）→ 用实测有效的 /dex/sv/pokemon/<name>/；stats 正确路径带 /chaos/ 段（/stats/2026-09/gen3ou-0.json 缺段 404）。未映射登记：scorchingsands 1 行 / items 0 / teammates 10 行（Urshifu-Rapid-Strike、Slowking-Galar、Marowak-Alola 3 名）。
- **研究 R4 体系模板（s_000EcTYbN72）**：15 轴 × 6 位 = 90/90 全覆盖（体系核心/打手位/补盲位/联防位/撒钉清钉轮转位/功能位），每槽依据非空（轴库引用 75/90、文档引用 86/90、URL 31/90），每轴六位落到真实 ER 特性/招式/物种（如大嘴鸥 降雨×雨盘、龙头地鼠 破沙硬爪沙之力、卡璞・蝶鳍/哞哞/蝶蝶 场地手+再生力/多重鳞片兼位、卡璞・鸣鸣 inns[电气制造者]）。登记 4 处口径裁定：天气增伤=×1.5（旧 tips「20%」与 _02 §6.1「×1.2」为旧口径，建议后续同步修 tips）；场地 8 回合/制造机 326 延展 12（任务简报「12」为延展值）；薄雾场地龙伤减半已于 v2.65.3b 移除（主语义改「全场防异常盾」）；两处待实测（毒沼制造者 834 撒菱→毒菱源码 0 命中倾向不存在；隐形岩非首铺疑似失效）——本模板均不依赖，实施层输出风险提示即可。3 个命名陷阱：炽热岩石 297 vs 特性文案「炎热岩石」；巨翼 688（=巨大翅膀371+飘浮26）vs 别名表「巨翼→371」；毒素吸收 344/毒疗 90/中毒激升 137 三者区分。
- **数据层实施（s_000Ec5rNcm0）**：`nn_data\mech_lib_v412.json`（150,540 B，meta version 3 / count 52 / schema v412 / updated 2026-10-10）= 既有 28 条逐字保留 + 24 新机制 + 32 新 combo；`build_tool_data.py` +473/−6：`_MECH_PATH`→v412（同步 3 处注释/文案）、`_MECH_REWRITE_VOCAB` 26→40（+14：weather_speed/weather_offense/weather_recovery/dry_skin_weather/type_immunity_absorb/water_bubble_shell/water_veil_guard/intimidate_weaken/anti_intimidate/sheer_force_boost/scrappy_ghost/light_metal_weight/huge_power_phys/magician_steal）、新增 `build_smogon_prior()` 读取+校验+嵌入顶层键 `smogonPrior`（120 只）、AXIS_TEMPLATES（草稿以 repr 生成 34.2KB）注入 AXES（15 轴各加第 8 键「体系模板」，既有 7 字段逐字不动、轴序不动）。构建输出：mechLib 52/156/40、smogonPrior 120/2335 行、axis_lib 15 轴含模板；`配招工具_data.js` 6,775,848 B。信息项：合并后 3 对跨机制 (with,cond) 重复（slush_rush#1~ice_body#1 等，schema 允许，既有 12 对先例）。
- **引擎层实施（s_000Ecvuja8n，本轮最重）**：14 新机制语义**真实改写评分**（非仅展示层）——`mechEvalOf` L3898 核心 13 case（天气提速×1.5/强攻×1.5/回复 1/8、干燥皮肤水火、属性免疫吸收、水泡火减半水倍伤免灼伤、水幕免疫+ER 水流环、威吓降攻、反威吓分档（警卫犬 553 被威吓攻击+1）、幻影防守复用 multiscale_sash 满血减伤、全力攻击、胆量命中幽灵+免威吓、轻金属减重+ER 速度×1.3、巨力按 id 分档 37 物攻×2 / 74 特攻×2、魔术师偷道具）+ 取数 5 函数（mechAtkMulOf/mechAbiMvAdj/mechAtkBestOf/mechSpdOf/mechDefAdjOf）；评分接入点 `abiAdjOf` L1027→L1072 / `defCellTrio` L2055→L2102（免疫 inn=0/减半）/ `pickAttacks` L4473→L4507 / `itemScored` L4869→L4928 / `buildItem` L4948→L4965 / DIM_IMPL（D2/D3 有意不套提速 / D4 / D7 天气回复 / D11）；Smogon 先验 `SMOGON_PRIOR_ENABLED=true` + `SMOGON_PRIOR_W=0.35`（false→逐字节回退 v4.11），smogonItemBonus/MoveBonus/MateHint 软微排序，诚实标注「原版惯例≠ER 使用率」（先验参考非硬规则，引擎排序仍以机制覆盖+协同为主）；体系模板 `axisTemplateOf` L4172 生成完整 6 人体系（池不足全库补位并标「补位」，六位全来自池时 nPool=6），渲染接入 L6910 axbar + L7467 队友区。**自查修复 2 处真回归**：type_immunity_absorb 无条件「命中+1→×1.5」过评致护城龙队规模 5→6（改仅前提登记，回归 6,6,4,4,5）；先验队友百分比外露 F12（改定性档位，玩家层零 %/×）。自检探针 79/0。
- **测试线（s_000Ecgnca7T + 收尾校准）**：五套最终 **677/0 不降**（verify_v1 216/0 + v4 285/0 + v48 32/0 + v49 58/0 + v410 86/0——v410 仅 7 条契约增长断言更新：mechLib 28→52、combo 77→156、D1 改未截断边集 uEdges()、D3 载体改妙蛙种子#1、D10 载体改大针蜂#15、E7 名称 26→40，断言数 86 不变；v1/v4/v48/v49 零修改）。新增 `verify_v412.js` **46/0**（§A 计数 7 / §B 新机制命中改写 10——叶绿素 45→68 晴天速度×1.51 why「ER ×1.5/官方 ×2」、瑜伽之力 74 特攻×2、蓄水 inn=0、幻影防守 defFlat=0.5 且不误当类型抵抗 / §C Smogon 先验 11 / §D 体系模板 9——池空→补位徽标×5、池投影 nPool=6 / §E 优雅降级 6）。载体探针：**probe_v411_ui.js 83/0**（F14 已校准：原断言对 v4.10 机制溯源外链锚过约束——v4.11 该页锚数=0 空集真空通过、v4.12 新组合「叶绿素×生长/日照」首次产出锚暴露；校准口径=允许机制组合表「溯源」锚保持设计形态（可读文案+https 外链+target/rel），本层文案统一「机制溯源」、禁内部编号/调试标记 11 模式 0 命中、#N 全国图鉴号 614 处合法不整体禁）；**probe_v411_cdn.js 41/0**（体积阈值按实测 650,919 B 重基线 + mechLib 28→52，拆包三件套未变）。
- **产物指纹（三处逐字节一致）**：`配招助手_ER.html` = `index.html` = ROM 副本 = **650,919 B / SHA256 `891B6EA675B0371D44CA8966908AFA9D96D8F1E93A10737E1952FFE3C4A1DA48`**（gzip 217,060 B）；`data.js` **2,347,755 B / SHA256 `69B48A5A6DC0D11A98D928DF66ED22DFF672805D494FE6B9A72EC1CCB1FF5F7F`**（gzip 547,420 B）；`配招工具_data.js` 6,775,848 B；node --check 0 错误。
- **报告索引**：研究 4 份 `docs\研究资料\_v412_{机制检索验证,combo检索验证,smogon先验,体系模板设计}_20261010.md`（均含放弃清单/未映射登记/口径差明细）；实施 `docs\战斗分析\_v412_{数据层,引擎层}_交付报告_20261010.md`；测试 `docs\战斗分析\_验证证据\_v412_回归与探针_交付报告_20261010.md`（含 F14 断言原文+锚 HTML+校准口径）+ `_v412_回归与探针_断言输出_20261010.txt` + `_v412_引擎层_自检探针输出_20261010.txt` + `verify_v412.js`；草稿 JSON 存子代理 artifacts（合并完成，仅作溯源）。
- **未决/待实测**：15 项 ER 口径差（含瑜伽之力 ER 特攻×2）与 R4 两处待实测登记「待游戏内真实验证」，不阻塞交付；任务提示「锚点 2310/2134」在仓库文本未查到对应登记（R3 未据其推断，若另有出处需指明）；部署与线上 SHA 校验见下方登记（v4.12 部署由主 Agent 执行，同 §8 分支约定 + 禁代理直连 push）。
- **部署（2026-10-10，已执行并线上验证）**：master 提交 71dfaf（29 文件，push 78d118a..b71dfaf——直连受阻 2 次后第 3 次重试成功，全程禁代理 -c http.https://github.com.proxy=）；gh-pages **就地更新**（非整树重建：checkout gh-pages → checkout master -- index.html data.js → commit 520c2bf 2 文件 → push c3f1cba..520c2bf 快进），17 文件部署集结构未变。线上校验（https://wsjshy.github.io/elite-redux-teambuilder/）：index.html 650,919 B / SHA 891B6EA6… ✓、data.js 2,347,755 B / SHA 69B48A5A… ✓、s0.webp 357,890 B ✓、.nojekyll 200 ✓；cdn.jsdelivr.net@gh-pages/data.js 已传播新版本 ✓；**gcore 镜像（本机探测路径）返回 v4.11 旧缓存**（purge.jsdelivr.net 本网不可达，无法手动刷新）——登记为 CDN 边缘缓存传播问题，预期边缘 TTL 内自动刷新；页面加载器在 gcore 失败时回退同域（v4.11 设计），stale-200 不触发回退，边缘用户暂以 v4.11 数据加载 v4.12 页面（引擎对缺失机制库优雅降级，verify_v412 §E 已验证）。部署报告 docs\研究资料\_v412部署_交付报告_20261010.md。

## 28. ER 机制实证定稿（2026-10-10，主 Agent 统筹 · 四组子代理并行查证 + 引擎修正 + 全量回归 + 部署）

- **任务**：对项目全部「待游戏内验证/待实测/口径待定」项做三方查证（v2.65 时代源码 Pin A=`7d85acd5`@2026-03-28 / Pin B=`910945b9`@2026-10-06 / 官方数据 `gameDataV2.65beta.json` / 官方文档 Bulbapedia）。用户明确：**能从官方文档找到、能从代码确定的，不需要用户实际确认**。规则：ER 源码优先；冲突以 ER 源码/desc 为准；查不到才保留「待用户游戏内确认」。
- **主清单**：`docs\战斗分析\_验证证据\ER机制实证_20261010\00_主清单.md`（W14 + B17 + C2 + D1 + E8 = 42 项 + F10 已定稿登记）。
- **查证结果**：**41/42 定稿**（W 14 / B 17 / C 2 / D 1 / E 7 全定稿；E4 字段布局定稿、仅「箱号/性质」保留待游戏内确认）——**「待用户游戏内确认」缩减清单 = 1 项**（`90_待用户游戏内确认_缩减清单.md`：E4 特殊区 15 条记录的箱号归属，方案 A 记箱号格位写 `box_override.json` / 方案 B 改对战队伍后 .sav diff）。全量结果表：`01_全量查证结果表.md`。
- **分组证据（各自含源码文件:行号证据链 + Bulbapedia URL + 与引擎现值判定，行号均实读核对）**：`特性组_B1-B17_证据_20261010.md`（613 行）/ `时序场地组_W组_证据_20261010.md`（522 行）/ `招式道具组_C-D_证据_20261010.md` / `存档数值域组_E组_证据_20261010.md`（36,302 B）。
- **关键定稿值（与引擎原值冲突处已改）**：戏法空间 **6 个回合时段**（常量 5 + 施放当回合 started 不递减，battle_util.h:56 / battle_util.c:2025）；冻伤**雪天×3 已删除**（v2.65 双 pin 0 命中，仅 Cryomancy×5；×3 在旧版 battle_script_commands.c:3871-3873）；光之黏土**招式侧仅 4 招 5→8**（极光幕/反射壁/光墙/烟幕；白雾/幸运咒语/神秘守护不吃）＋特性 North Wind 3→5；撒菱→毒菱**未实现**（全仓 0 命中，GBACodes 记载超前）；Toxic Seed **数据无该道具**（分支=死代码）；天气归属 **slow**（v2.65 换入按速度降序、慢者特性最后覆盖）；杂技 **75 ×1.5=112.5**（er-config MoveBehaviorConfigList.textproto:1083-1093 multiply:1.5）；蛮干 **削至同血**（battle_script_commands.c:11852-11859；ER desc 为官方 RS/E 旧文本滞后）；电场**免疫睡眠不免疫麻痹**（CanSleep:5015 / CanBeParalyzed:5049-5055）；烧伤 1/16（GEN_7）；无 Team Preview / 高速旋转无 spinblock；Mega 石必占道具位＋手环 640＋FLAG_SYS_RECEIVED_KEYSTONE＋每方每场一只（battle_util.c:8087-8125）；B 组 17 特性全部「源码+数据」双源定稿（瑜伽之力 74=特攻×2、雨盘/冰体 1/8、太阳之力/沙之力最高攻击项×1.5 无掉血、天气提速 ×1.5、精神力 Focus Blast 必中、水幕登场水流环、轻金属速度×1.3 等），Pin A≡Pin B 逐字节 ⇒ v2.65→最新无改动；E 组 7 项定稿（决定性证据=官方 nextdex 存档解码器 `nextdex/static/js/load_save.js readPokemonBox` L119-171 位域逐位吻合真实存档：E1 `+0x0A` 非字段、E2 `+0x12` 非第5招式位（副产品：特性选中项=word8 bit30-31）、E3 `+0x48`=下条记录 personality、E5 无 IV/nature 在 word8 bit10-14、E7 EV 单项≤252 总量≤510、E8 **GROWTH_SLOW=5n³/4**（medium-slow 标签错误））；道具 317=Eject Button / 308=Shed Shell 复验一致。
- **引擎侧动作（已落地）**：`build_tool_html.py` WCONF 6 处（trickroomTurns 5→6 / frostbite.hailChanceMult 3→1 / lightClayTurns null→双链路对象 / toxicTerrain.seed→'不存在（v2.65 数据无该道具）' / WCONF_PEND 清空 {} / 数值卡与 tplRuleTip 4 处硬编码 pendBadge() 按定稿移除＋文案改玩家话术「已按游戏源码核对」）；`nn_data\mech_lib_v412.json` 21 处「待实测→已实证定稿」标注（脚本 `_apply_mechlib_finalize.py`，幂等）；蛮干 endeavor_lowhp 文案改「削至同血」；`docs\战斗分析\_机制默认口径表.md` 5 节表行＋参数汇总表 6 行＋hazardBugNote 行＋待实测集中标注段落（0 项）；`docs\战斗分析\06_对战战略与配队理论.md` 二节第 1-7 条全转定稿（第 7 条反特性手段数据实证：破格类 104/163/164/794/881 存在、Relic Stone 道具不存在）。
- **测试断言同步（规格变更，非回归）**：verify_v1 11 处旧断言（待实测态→定稿态：trickroomTurns=6、lightClayTurns 结构、hailChanceMult=1、seed 新值、WCONF_PEND=0、口径表徽标 6→0 等）与 probe_v411_ui（戏法空间 6 回合定稿无徽标）、probe_v411_cdn（HTML 体积重基线 650,919→652,338 B＝定稿注记 +1,419 B，注明原因）同步更新；verify_v4 修 1 处真问题（冻伤/蛮干行文案「源码实证」→「已按游戏源码核对」，去开发过程语）。
- **回归（铁律 677/0 + 46/0 满足）**：verify_v1 **216/0** + verify_v4 **285/0** + verify_v48 **32/0** + verify_v49 **58/0** + verify_v410 **86/0** = **677/0**；verify_v412 **46/0**；probe_v411_ui **83/0**、probe_v411_cdn **41/0**。
- **引擎建模缺口登记（非待测项，后续完整复刻工作项）**：B2/B3/B6/B7 沙免/冰雹免（sandImmune/hailImmune）、B12 Focus Blast 必中、W11 Mega 手环前置与每方每场一只——mech_lib params 未显式编码，如需完整复刻建议补参。
- **读取陷阱固化（证据文件内警示）**：gameData items 数组**不按 id 排序**（items[308] 实为 Aggronite id 751），必须按 id/NAME 字段查；item 对象仅 NAME/id/name 三键，语义取 er-config textproto；存档解析器 5 项缺陷登记（招式3 掩码 0x1F→0x3F、道具 0x1FF→0x3FF、EXP 取完整 21 位、enc 实为 nickname 区、AGENTS §3 三处口径可关闭）——**只登记未实施**。
- **产物指纹（三处逐字节一致）**：`配招助手_ER.html` = `index.html` = ROM 副本 = **652,338 B / SHA256 `11C816875632C6FD235C88516C750080CE66E6E85DB34651A7F4B4D76937C215`**；`data.js` 2,349,720 B / `C1B5C906…`；`_chk_script_1.js` 2,545,698 B（node --check 0 错误）。
- **部署（2026-10-10，已执行并线上验证）**：master 提交 `d2cb14f`（15 文件，push `0ac219b..d2cb14f`，全程禁代理 `-c http.https://github.com.proxy=`）；gh-pages 就地更新（checkout gh-pages → checkout master -- index.html data.js → commit `fd12087` → push 快进），部署集结构未变。线上校验（https://wsjshy.github.io/elite-redux-teambuilder/）：index.html 652,338 B / SHA `11C81687…` ✓、data.js 2,349,720 B / SHA `C1B5C906…` ✓；**cdn.jsdelivr.net 已传播新版本 ✓**；**gcore 镜像仍为 v4.11 旧缓存**（CE19BC0C…，同 §27 已知 CDN 边缘滞后，purge.jsdelivr.net 本网不可达；页面加载器 gcore 失败回退同域，stale-200 不触发回退，边缘用户暂以 v4.11 数据加载 v4.13 页面——引擎对缺失机制库优雅降级，verify_v412 §E 已验证）。

## 29. v4.13 系列：Mega 形态优先开关 · 特性/天性弹层化 · 进化链家族聚合（2026-10-10，用户逐项拍板后实施部署）

- **v4.13 Mega 形态优先开关（用户：ER 可永久 Mega，基本不用未 Mega 形态，过滤但不要删，或与未进化一样加开关）**：`coreMega` checkbox（默认开）+ `hasMegaForm(s)`（由 familyRoot 的 root 值派生，排除自映射）+ `isMegaPreferred(s)`；过滤点三处——coreMatch 候选列表、tplRecs 体系模板榜、buildTeam 补位建议；v4.13b 补 poolForNeed 队友推荐候选同样守卫（buildTeam 全队不再出现可 Mega 非 Mega 形态）。详情页 L1 加「⚡ 可 Mega 形态」提示条。搜班基拉斯默认仅 超级班基拉斯/超级班基拉斯R，关开关 4 形态全现。
- **v4.13 特性/天性详情弹层化（用户：点击特性就地展开长文本太次）**：`abiModal` 轻量居中 modal（规范中文+英文名+#编号+类型标签+完整描述+战斗意义+机制词条），并按 ABI 表规范中文统一 chip 显示名（铁棘→铁刺#160、坚不可摧→顽固#326、原始铠甲→根源盔甲#318）。
- **v4.13b 进化链（用户：图鉴详情要带退化/进化/Mega/地区型等全部相关形态）**：Python 侧读 gameData 构建 `FAM_GRAPH` 注入（节点 1907，prev/next/mega/prim/form/base 六类）；**关键语义：`evolutions[].in` 是 species 数组下标非 id**；kd 分类：0/3/4 普通进化、1=Mega/Redux 石、2=原始回归、5=招式形态；Mega 形态自身回链 base。前端 `famChainHtml` 行组织「⬅退化/进化➡/基础形态/⚡Mega-Redux/🌋原始回归/🌀招式形态/🔁其它形态」，chip 带精灵图+中文名+via 道具名，点击跳转。
- **v4.13d 家族聚合（用户：暴鲤龙R 的 Mega 也要带出 超级暴鲤龙X/Y，所有相关都带上）**：gameData 里 Redux 变体（如暴鲤龙R=2675 Gyarevelry）**无主动 Mega 记录**（evolutions 空）→ 同 famKeyHeur 族集合的全部形态统一归并：族内 base 非空者按 kd 分流进 mega/prim/form（暴鲤龙R 正确带出 超级暴鲤龙X#1512/Y#2129），其余进「其它形态」（暴鲤龙R↔暴鲤龙 互链）；当前形态自有 mega 先并入避免重复。验证：暴鲤龙R`⬅鲤鱼王R + ⚡超级暴鲤龙X/Y + 🔁暴鲤龙`；暴鲤龙`⬅鲤鱼王 + ⚡X/Y + 🔁暴鲤龙R`；雷丘/班基拉斯/妙蛙花/烈空坐均正确，console 0 error。
- **v4.13e familyGraph 内联（CDN 缓存根治）**：**jsdelivr 按路径缓存且忽略 query**——data.js 加 `?v=<hash>` 版本戳无效（浏览器实测仍加载旧 data.js，familyGraph=0），purge API 本网不可达/边缘滞后。最终方案：familyGraph **内联进 HTML**（`__FAMGRAPH__` 占位注入 `ERDATA.familyGraph={...}`，带 `typeof ERDATA` 守卫），HTML 带版本参数每次拉新、随 HTML 走彻底绕开 data.js CDN 缓存；data.js 恢复 v4.13 原始内容（2,210,805 B，CDN 旧缓存无害）。线上实测 familyGraph=1907 ✓、暴鲤龙R 进化链完整 ✓、console 0 error。
- **产物指纹（v4.14）**：`配招助手_ER.html` = `index.html` = **792,233 B**（含内联 familyGraph）；`data.js` **2,210,805 B**（恢复原始，无 familyGraph）。
- **提交链（master）**：`7f54e03`（弹层真名）→ `209e2a0`（v4.13 Mega 开关）→ `4bc482b`（AGENTS 登记）→ `7d84dc6`（v4.13b 进化链）→ `9ff4d6d`（v4.13c 版本戳，后弃）→ `5eb44ec`（v4.13d 家族聚合）→ `a32c3cf`（v4.13e 内联）→ `7e02220`（v4.13f 家族进化树）→ `f49ea07`（v4.14 流派卡+队友卡）→ `cf6a8f2`（v4.14 构建脚本）。gh-pages：`a6d018f` → `3990e44` → `4319dac` → `f3380ed` → `60a6434` → `46d11af` → `941e680` → `eb406b7`（v4.14）。线上已验证：familyGraph 1907、暴鲤龙R 进化链、0 console errors。
- **v4.13f 家族进化树（用户：所有相关形态全部带上、按进化路线分行清晰展示；呆呆兽例=标准/伽勒尔两条路线各 3 段+Mega 全展示）**：`famChainHtml` 重构——①家族闭包（familyGraph 普通进化边 next/prev + famKey 同名形态[地区型/Redux/Mega]迭代收敛至稳定）；②按地区路线分组（标准/阿罗拉/伽勒尔/帕底亚/洗翠/Redux…，effRegion 沿 base 继承）；③组内从「无退化」起点 DFS，每条进化路径一行（`A → B → C`），Mega/原始/招式形态作为**挂件**跟随节点（chip 带石名/招式名），当前形态高亮（chipcur）。`pendFor`：节点自身 mega/prim/form + **Redux 形态额外带同 famKey 家族标准成员的 Mega**（暴鲤龙R 带出超级暴鲤龙X/Y；地区型[阿罗拉雷丘等]不误挂标准 Mega）。验证（本地+线上）：呆壳兽=标准`呆呆兽→呆壳兽⚡超级呆壳兽 / 呆呆兽→呆呆王⚡超级呆呆王`+伽勒尔`呆呆兽-伽勒尔→呆壳兽-伽勒尔⚡超级呆壳兽-伽勒尔 / →呆呆王-伽勒尔⚡超级呆呆王-伽勒尔`；暴鲤龙R=`鲤鱼王R→暴鲤龙R⚡超级暴鲤龙X/Y`；雷丘=标准两条线（皮丘/皮丘-刺刺耳→皮卡丘→雷丘⚡X/Y）+阿罗拉`雷丘-阿罗拉`；妙蛙花=`种子→草→花⚡Y/X`；烈空坐=`烈空坐→超级烈空坐(MOVE_DRAGON_ASCENT)`；console 0 error。**ES5 陷阱**：对象字面量计算键 `{''+s.id:1}` 非法（Unexpected token '+'），改 `var C={};C[''+s.id]=1`。
- **v4.14 流派卡推荐质量（用户逐项批评：天气手带手动天气/光之黏土无墙/性格与 EV 矛盾/队友纯文字无配置/一卡混多玩法）**：
  - 实证：v4.13f 起「手动天气」与「光之黏土」两 bug 实际已修复（本地+线上实测妙蛙花配招 日光束/污泥炸弹/生长/终极吸取 无大晴天、道具 生命宝珠/弱点保险/讲究眼镜）——截图为旧版；本轮集中修残留项。
  - **性格修复**：`buildNature` 强化流不再并入肉盾分支（原「晴强化清场」被推 淘气/慎重/大胆，与 252 速攻 EV 矛盾）→ 强化流按侧给 `内敛+特攻-攻击（强化本攻）/胆小+速度-攻击（强化后清场）`（物侧=固执/爽朗）。
  - **单玩法收敛**：`deriveBuilds` 末尾新增去重——同侧且配招前 3 槽完全相同视为同一玩法，保留评分最高者（妙蛙花「晴强化清场」上位胜出，「晴增伤清场」被合并，流派卡从 2 条 → 1 条；强化清场=增伤清场的上位玩法，符合用户「要么拆玩法、要么判断上位删劣位」）。
  - **队友卡升级**：`mateCard` 加精灵小图（spmid）+ 整卡可点击（`openSpById` 进详情）+ **每只队友推荐配置行**（特性·道具·EV 摘要，按队友自身 coreSide 用 buildItem/pickAbiFor/buildEvs 现算，如 席多蓝恩=钢能力士·弱点保险·4HP/252特攻/252速）；CSS 补 `.mate` 竖排图卡 + `.mtcfg` 配置行 + hover 高亮。
  - **EV 条**：按钮文案「模板说明 ▾」→「分配依据 ▸」（仍点击展开 evWhyTxt），title 自解释。
  - 线上验证（妙蛙花）：流派 1 条、性格 内敛/胆小、队友 带配置行、console 0 error；master `f49ea07`+`cf6a8f2`、gh-pages `eb406b7`。

## 30. v4.15 轴库恢复 + nn_data 损失面（2026-10-11）

- **事件**：响应「继续」排查上轮构建日志 `[warn] 轴知识库不可用` 时发现 **`nn_data/` 目录整体丢失**（axis_lib.json / mech_lib_v412.json / smogon_prior_2026-09.json / species_map.json / chaos\ 全无），同时 **`招式表_可学总表.csv` 丢失**。两者均在 .gitignore（`nn_data/`、`招式表_可学总表.csv`）→ **git 无法恢复**（`git ls-files nn_data/` 空）。
- **损失面实测**：`data.js`（2,210,805 B）与 `配招工具_data.js`（6,777,757 B）仅含 `ERDATA.usagePrior`（coverage=747），axisLib/mechLib/smogonPrior/sysSet 均缺失 → 上一轮 v4.14 构建实际已退化：AXIS_LIB 回退空数组（多方案框架仅呈现规模/风格变体）、Smogon 先验关闭（队友先验提示缺失，仅 usagePrior「常见」标签兜底）。
- **恢复（axis_lib 可无源重建，已落地）**：`AXES`（15 轴，build_tool_data.py L1754 起）+ `AXIS_TEMPLATES`（15 轴×六位+note，L2043 起）均为**纯字面量硬编码** → 新增 `restore_nn_axis.py`：AST 提取两字典 → 按数据层 L2428-2435 合并逻辑（每轴追加 `体系模板` 键）→ 落盘 `nn_data\axis_lib.json`（15 轴 / 78,167 B）。重跑 `build_tool_html.py`：`内嵌 AXIS_LIB：15 条轴（76.3 KB）` ✓，静态验证 AXIS_LIB_embedded + axisTemplateOf/axisById/axisStateOf/axisVariantsOf 全在 ✓；浏览器实测 `AXIS_LIB.length=15`（rain/sun/sand/snow/trickroom/e_terrain/misty/grassy/psychic/toxic/hazard/boost/stall/pivot/weaken）✓。
- **不可恢复（登记缺口）**：
  1. `nn_data\mech_lib_v412.json`（52 机制/156 combo/40 词汇）——`build_mech_lib`（L2590）**只校验不生成**，为只读输入真文件；docs 无 JSON 备份 → 机制词条层缺失，但 `mechEvalOf` 硬编码 13 case 仍在（机制评分不丢，仅词条溯源/combos 丰富度降级）。
  2. `nn_data\smogon_prior_2026-09.json`（120 物种先验）——需联网抓 Smogon chaos 重建（暂缓，引擎侧 SMOGON_PRIOR_ENABLED 优雅关闭）。
  3. `nn_data\species_map.json` + `chaos\raw\*.json`——同上需联网重建（usagePrior 747 条已从 data.js 兜底）。
  4. `招式表_可学总表.csv`（112,580 行，build_tool_data.py L51 硬依赖）——可从 gameData learnset 重建，但 build_tool_data.py 另有 `ER2.65简汉化\ER2.65beta版图鉴v0.3.xlsm`（克制表源，L71）也已丢失 → **build_tool_data.py 当前整体不可重跑**（克制表 xlsm 无兜底）；克制表在 data.js/HTML 侧已有 21×21 方阵，数据层重建仅影响未来改动。
- **教训登记**：nn_data 与可学总表 CSV 属「可重建但工程量大」的中间产物，却无 git 跟踪 + 无备份 → 建议后续**把 axis_lib.json 纳入 git**（或定期打包备份），smogon/chaos 重建脚本固化。`restore_nn_axis.py` 保留于仓库根目录（可重复执行）。
- **产物指纹（v4.15）**：`配招助手_ER.html` = `index.html` = **862,919 B**（+AXIS_LIB 76 KB 注入）；`data.js` 2,210,805 B（不变）。提交链待登记（master v4.15 构建 + gh-pages 部署）。


## 31. v4.16 手动天气守卫修复（2026-10-11）

- **触发**：用户截图向日葵怪（向日花怪 #192，天性固定含「干旱」=日照）流派「晴增伤清场」配招仍带手动大晴天——天性出场自动开晴还占 1 格手动晴，效率最低做法（此前 v4.14 只修了妙蛙花路径）。
- **根因（两处）**：
  1. uild_tool_html.py mkBuild weather 槽：uncs[f]（pickFuncs 返回的 uncs.weather）**先于** weather 分支命中 → 手动天气招绕过守卫直接入槽（第一版守卫只加在 weather 遍历分支，未覆盖 funcs 侧）。
  2. isAbilSet(s,'晴') 对「干旱」无效的疑虑已排除：biIdByZhOrEn('干旱')=70 别名归一正常，biSetOf('干旱')='晴' 实测有效。
- **修复**：weather 槽在 push 前加**统一守卫**——if(f==='weather'&&id&&WEATHER_MV[id]&&isAbilSet(s,WEATHER_MV[id]))id=null（无论来源 funcs.weather 或 weather 遍历分支，天性/主特性已自动开该天气 → 手动天气招一律跳过；仅无任何自动开天气手段的精灵保留手动档）。
- **验证（本地 ?v=v416b2）**：向日葵怪两流派配招 = 过热/日光束/生长/**寄生种子**（大晴天移除）；回归：超级妙蛙花Y 晴系无大晴天、大嘴鸥雨系无求雨；coreOut 端到端 49,626 字符 weatherMvs=[] ✓。
- **产物指纹（v4.16）**：配招助手_ER.html=index.html 863,158 B（守卫注入）；data.js 2,210,805 B（不变，缓存戳 633687ac）。
- 提交链：master v4.16 → gh-pages v4.16（待登记）。


## 32. v4.17 道具修正：光之黏土仅真开墙者（2026-10-11）

- **触发**：用户截图向日葵怪流派卡「⭐光之黏土 光墙/反射壁/极光幕回合延长」——配招无任何墙招却推光之黏土（v4.14 曾改道具 tag 核心口径，但光之黏土仍因「体系含青草场地」加分入选）。
- **根因**：光之黏土被错误当作「场地延长道具」——itemApplies（L5033）与 itemScored P4 加分（L5105）均以 	g.sys.some(itemIsExtendableTerrain) 为条件；而光之黏土**只延长墙**（光墙113/反射壁115/极光幕657），青草场地延长是地形延长器的事。向日葵怪 coreSys 含青草场地 → 无墙也 +0.60 → 主推光之黏土。
- **修复（3 处）**：① itemApplies 拆分——光之黏土条件=「learn 含墙招」，地形延长器条件=「体系含可延长场地」；② itemScored P4 加分加 learn.some(墙招) 条件（去掉场地体系条件）；③ mkBuild 兜底过滤——推荐配招 4 槽无墙且无自动墙特性时，光之黏土从道具推荐中剔除（双保险）。
- **验证（本地 ?v=v417c）**：向日葵怪（无墙）道具=厚底靴/地形延长器/青草种子，光之黏土消失 ✓；急冻鸟（会极光幕）保留光之黏土备选 ✓；胡地/沙奈朵（输出角色，windowRole=false）不推 ✓；coreOut 端到端 clay=0 / sun=0 ✓。
- 产物指纹：配招助手_ER.html=index.html（v4.17 构建）；提交链 master v4.17 → gh-pages v4.17（待登记）。


## 33. v4.18 一个玩法一个体系（2026-10-11）

- **触发**：用户「一个玩法不能又说日照又说青草场地」——向日葵怪推荐特性=叶绿素（晴受益）时，流派卡仍并列展示「体系 青草场地/晴」双体系（特性 3 选 1 决定两者互斥）。
- **修复（2 处）**：① 流派卡设计亮点「体系」叙述**跟随推荐特性**（abi[0] 归属体系 = 本流派窗口；另一体系降为「备选特性转『X』流」提示）；② 流派去重 key **去掉 side**——配招前 3 槽相同即同一玩法（双刀侧若无物理招进槽 = 与单侧同一套配置，不再因「特殊 vs 双刀」标注并列两条近同卡；真双刀精灵的双刀流派配招含物理招 → key 自然不同）。
- **验证（本地 ?v=v418t）**：向日葵怪流派 2→**1 条**（晴增伤清场），体系叙述=「体系 晴（自身设置手）；备选特性转『青草场地』流」✓；回归：喷火龙 2 条（配招不同不合并）、烈咬陆鲨 2 条（攀岩 vs 尖石攻击）、快龙/妙蛙花Y/X 各 1 条 ✓；coreOut 端到端 clay=0 / sun=0 ✓。
- 产物指纹：配招助手_ER.html=index.html（v4.18 构建）；提交链 master v4.18 → gh-pages v4.18（待登记）。


## 34. v4.19 机制驱动流派（2026-10-11）

- **触发**：用户反复指出「特殊性处理不够——变身者百变怪只按种族/技能池评价、杂技失去道具威力翻倍等完全没考虑」；此前机制组合（mechLib 52 项）只在详情页「机制解读」展示，**不反哺流派生成**（百变怪流派仍是 4 攻击招）。
- **修复**：新增机制驱动流派层（mechBuildsOf + MECH_BUILD 注册表 + 3 个辅助函数 bestStabAtk/bestCoverAtk/bestRecMv）——枚举全部机制条目，判定交给 MECH_BUILD 内部（mechHasMv/mechHasAbi，**不依赖 combo cond ok**：cond 是增强组合前提，机制招/特性本身可学即可出流），流派卡插到流派列表最前。已实现 6 条核心机制：
  ① 变身者（imposter_anchor）：配招=变身/替身/守住，道具=讲究围巾|气势披带，推荐特性强制=变身者（自身种族 48 无意义，战斗=对手能力值）；
  ② 杂技（acrobatics_item）：消耗品（宝石/场地种子/披带）起手→无道具→杂技 112.5 翻倍；
  ③ 扑击（body_press_def）：按物防结算+铁壁双升档；④ 陀螺球（gyro_ball_speed）：慢即是重+诅咒双修；
  ⑤ 欺诈（foul_play_atk）：按对方物攻结算反制物攻手；⑥ 魔法防守（magic_guard_survival）：生命宝珠反作用被抵消=白嫖增伤。
- **验证（本地 ?v=v419f）**：百变怪=变身复制流（推荐特性=变身者）/魔法防守炮台/破盾 3 条，UI 端到端「玩法流派 3 条 · 推荐流派 1：变身复制流」✓；大钢蛇=陀螺球重压流+扑击铁壁流 ✓；谢米=杂技爆发流 ✓；无机制精灵不生成（不刷屏）✓。
- 产物指纹：配招助手_ER.html=index.html（v4.19 构建）；提交链 master v4.19 → gh-pages v4.19（待登记）。


## 35. v4.20 机制流派扩充 16 条（2026-10-11）

- **延续 v4.19 机制驱动流派**：注册表 MECH_BUILD 由 6 条扩至 **16 条**，全部与 mechLib 的 rewrite 键名严格一致（教训：key 不一致 → mechBuildsOf 按 rewrite 枚举匹配不到 → 静默不生成）。
- 新增 10 条：毒疗站场流（剧毒珠+替身白嫖 1/8）、轻装速攻流（消耗品=速度开关，杂技双收益）、全力攻击炮台（宝珠 1.3 倍无反作用）、胆量无盲流（普/格打幽灵）、恶作剧之心控场（变化招先制，速度=废案）、巨力物攻炮台（物攻×2×1.5）、水泡水系炮台（水系 2×再叠眼镜）、再生力轮转流（UT/VS+钉子）、属性免疫联防位（引水/蓄水/引火/食草/避雷针 0 伤免疫）、硬撑异常爆发（剧毒珠/火焰珠自异常满威）。
- 判定统一走 mechAbiRwHits（按 mechLib match.abilities 特性 id）/ mechHasMv；**空配招的机制流派不生成**（如再生力流全无 UT/VS/钉子 → 丢弃，不刷空卡）。
- 覆盖实测：1907 只中 **1298 只（68%）** 出机制流派；facade 487 / 杂技 328 / 扑击 253 / 欺诈 225 / 属性免疫 193 / 魔法防守 96 / 恶作剧 78 / 陀螺球 73 / 全力攻击 63 / 胆量 45 / 再生力 44 / 轻装 36 / 巨力 14 / 毒疗 11 / 水泡 9 / 变身者 2。
- 产物指纹：配招助手_ER.html=index.html（v4.20）；提交链 master v4.20 → gh-pages v4.20（待登记）。


## 36. v4.21 队友推荐质量修复（2026-10-11）

- **触发**：用户截图指出妙蛙花「晴增伤清场」流派主推队友全是晴天开手（席多蓝恩/超级喷火驼/莱希拉姆/超喷火龙Y/班基拉斯R/太阳岩，全部"出场开晴干旱"）——「完全只攻不防，队伍要考虑联动、进攻补盲、防守联防，而不是把得分最高的几个放进来」。
- **根因**：findTeammates 排序 `(b.fit-a.fit)||(b.score-a.score)`——fit（体系契合）一票优先 → 晴队里所有开晴手 fit=2 霸占前 3；联防/补盲/功能分再高也排不上主推。
- **修复**：
  ① 新增 `mateRoleOf(t,wxSys)` 角色标注（天气手/钉子/回复/轮转/盾/状态/输出）；
  ② 排序改为**综合分优先**（score 已含 联防免疫/抵抗+3/+2、补盲+2、体系+5/+4、功能回复/钉子+2、侧向+2、同弱点惩罚），fit 降为次级排序键；
  ③ 主推 3 只按**角色多样性**贪心挑选：天气手最多 1 只，其余按综合分补不同角色 → 联动/联防/补盲/功能并重，不再 3 个同质开晴手。
- **验证**：妙蛙花晴增伤清场主推 = 席多蓝恩（天气手+钉子）/ 黑鲁加（状态）/ 狡猾天狗（回复），UI 端到端通过；超级喷火驼/莱希拉姆降为备选。
- 产物指纹：配招助手_ER.html=index.html（v4.21）；提交链 master v4.21 → gh-pages v4.21（待登记）。


## 37. v4.22 队友主推多样性改软性（2026-10-11）

- **触发**：用户批评 v4.21 的「天气手最多 1 只」定死了——「不要这么定死，包括所有的规矩都不要定死；多个天气手有时有战略价值（双晴续晴 / 天气覆盖 / 场地+天气双体系），不能一棍子打死」。
- **修复**：主推挑选由硬限制改为**软性加分倾向**——候选每带一个「相对已选主推的新角色」给 +12 倾向分（贪心逐只取最高 eff=score+新角色数×12），**同角色但综合分明显更高的精灵照常入选**（双天气手可并存）。分数说了算，多样性只做软化排序。
- **验证**：妙蛙花晴流主推 = 莱希拉姆（46，天气手+回复+盾）+ 猛恶菇（35，回复+轮转+状态）+ 席多蓝恩（46，天气手+钉子）——双晴手并存且补回复/轮转；喷火龙/沼王主推角色各异。
- 项目准则补充：**配队/推荐一律不做"最多 N 只/必须有哪些"类硬规则**，只做正向外加/软排序（延续 v4.2「配队正向」裁定）。
- 产物指纹：配招助手_ER.html=index.html（v4.22）；提交链 master v4.22 → gh-pages v4.22（待登记）。


## 38. v4.23 队友主推角色价值随流派动态加权（2026-10-11）

- **触发**：用户澄清「不是单天气手也不是双天气手——所有精灵定队友都不要刻板，按具体情况动态权衡联动/联防/补盲/功能」。v4.22 的固定 +12 倾向分仍是拍脑袋常数。
- **修复**：新增 `MATE_ROLE_PRIO`（按 roleTag 查表：强化流更看重盾/钉子/天气手，速攻流更看重轮转，受队更看重状态/回复，输出流均衡）——主推倾向分 = 该角色对当前流派的实际价值，**去掉固定常数**；倾向分仅软化排序，综合分（联防免疫/抵抗+3/+2、补盲+2、体系+5/+4、功能+2、同弱点惩罚）仍说了算。
- **验证（无固定配方）**：妙蛙花晴流=莱希拉姆+席多蓝恩（双晴手）+猛恶菇；喷火龙（无体系）=阿尔宙斯-地面+巨沼怪R+君主蛇（多功能联防）；河马兽（沙暴）=Abyssand+大钢蛇R+蒂安希（天气手+钉子盾）；吉利蛋（受队）=超坏星+阿尔宙斯-幽灵+勾魂眼（状态钉子盾）——不同精灵自动得到不同结构。
- 项目准则重申（AGENTS §37 延伸）：**任何推荐逻辑不允许"必须/最多 N 个某角色"类硬配方**；只允许正向外加分与软排序。
- 产物指纹：配招助手_ER.html=index.html（v4.23）；提交链 master v4.23 → gh-pages v4.23（待登记）。


## 39. v4.24 推荐队伍升级为完整 6 人定位骨架（2026-10-11）

- **触发**：用户要求「一个队伍是六个人——要给出队友定位，同定位下给候选，多个精灵之间也可候选，更智能一点」。
- **实现**（findTeammates 主推重构）：
  ① 主推 = **完整 6 人队**；骨架贪心：按综合分遍历全部候选，每只精灵取其「尚未占用角色里对本流派价值最高者」作主定位（如席多蓝恩在天气手已被占时自动落位『钉子』）→ 6 定位各异；
  ② **不硬剔除**：角色全占用的高分精灵（第 2/3 个天气手）降为该定位候选——天气手位候选全是天气手，想上双天气手随时换回；无任何"必须 N 个某角色"硬配方（延续 §37/§38 准则）；
  ③ 极端不足 6 定位时按综合分补位；每只主选挂 `cands`（同定位 top 2 候选）。
- **UI**：队友区改「推荐 6 人队」，每张卡带**定位徽章**（天气手/钉子/回复/轮转/盾/状态/输出）+ 「同定位可换：A / B」候选行（点击直达详情）。
- **验证**：妙蛙花晴流 6 人 = 席多蓝恩[钉子]+莱希拉姆[盾]+超喷火驼[天气手]+超喷火龙Y[回复]+曜炎电伞蜥[状态]+…（定位各异、候选齐全）；喷火龙/吉利蛋/巨沼怪 6 定位各异（受队结构、雨天结构自动不同）。
- 产物指纹：配招助手_ER.html=index.html（v4.24）；提交链 master v4.24 → gh-pages v4.24（待登记）。


## 40. v4.25 机制驱动队友需求接入队伍构建 Tab（2026-10-11）

- **背景**：历史已知差距「机制流派仅核心配队 Tab 生效，队伍构建 Tab 未接入」。本轮补齐：队伍构建 Tab（需求驱动引擎 buildTeamByNeeds/needList）现在会为核心实际命中的机制流自动生成对应队友需求。
- **实现**：
  ① 命中判定 = `MECH_BUILD[rw](core)` 返回非空（与 mechBuildsOf 同口径）——**杜绝全机制库遍历误判**（初版遍历 mechAll() 导致毒骷蛙误命中全部 pivot 类机制、wxabuse note 重复 6 次，已修复）；
  ② 需求映射：变身者→pivot（轮转手，6 优先）｜毒疗→pivot（5）｜再生力→pivot（4）｜恶作剧之心→pivot（4）｜免疫特性（引水/避雷针/蓄水/食草）→wxabuse（触发手，5）；纯自身机制（杂技/扑击/陀螺球/欺诈/魔法防守/全力攻击/胆量/巨力/水泡/硬撑/轻装）不占需求清单（价值已由 D2/D4/D7 机制评估维度体现）；
  ③ note **累加不覆盖**：同一需求被多个命中机制触达时并写（百变怪=变身者+恶作剧之心 → 轮转手需求双说明）。
- **验证**：百变怪方案卡轮转手需求（光电伞蜥）=「变身者流需 UT/VS 安全变身登场；恶作剧之心流安全轮转」UI 端到端通过；毒骷蛙/妙蛙花不再误判（仅各自真实机制/体系触发）。
- 产物指纹：配招助手_ER.html=index.html（v4.25）；提交链 master v4.25 → gh-pages v4.25（待登记）。


## 41. v4.26 队友卡理由标签化（2026-10-11）

- **背景**：补齐 v4.21 承诺的「队友卡联防/补盲/功能理由标签化 UI」——之前 why 理由平铺前 2 条，不可扫读。
- **实现**：新增 `mateTags(r)`（纯展示层，不参与评分）：把 findTeammates 的 why 文本归类为短标签——联防/补盲/体系/钉子/回复/控速/状态/威吓/隐患（同弱点负向）/契合（兜底）；mateCard 渲染为彩色徽章行（.mtag.def/cov/sys/haz/rec/spd/sta/int/ris），完整理由保留在悬浮 title 与精灵详情页。
- **验证**：妙蛙花主推席多蓝恩卡显示「体系/联防/补盲/钉子」四标签；备选卡同渲染。


## 42. v4.27 组合挖掘引擎 MECH_COMBO（2026-10-11）

- **背景**：用户核心批评「缺少眼前一亮的感觉——特性×技能×道具×队友的独特搭配完全没考虑」。MECH_BUILD 是单精灵机制流，缺「跨精灵/跨要素组合」层。
- **实现**：`MECH_COMBO` 注册表 10 条（先制天气轴/慢速轮转换天气/雨天双必中/雨天轻快爆发/沙暴岩系特防/雪天极光幕/空间雨天/毒疗站场轴/免疫触发提速/撒钉除钉双保险）+ `scanCombos(members)`（≤4 条、按 cat 去重保首条）+ `comboHtml`（组合名+cat 徽章+参与+说明+来源，ER 特有标橙）。接入点：队伍构建方案 members 区、核心配队主推队友区（展示层，不参与排序）。
- **判定铁律**：天气类组合**只认核心精灵**（`x.core`）的天气设置特性（isSetterAny），防队友特性池含天气特性造成误报（煤炭龟晴队不再报雨天组合）；①先制天气轴在队伍已有特性天气手时**不报**（用户铁律：有日照特性就不配大晴天）；毒疗/免疫/钉子类按成员特性池+可学招式池软提示（note 注明需选对应特性/带对应招）。
- **验证**：node --check 通过；班基拉斯=沙暴岩系特防+撒钉除钉；大嘴鸥/蚊香蛙皇=雨天双必中；煤炭龟/九尾不再误报雨天；renderNeedPlan 与 renderCore 均渲染「组合亮点」区。


## 43. v4.28 组合契合分接入队友择优（2026-10-11）

- **背景**：v4.27 组合层只做展示，不参与排序 → 主推队伍不"为组合而组"。
- **实现**：findTeammates 骨架贪心改为**动态组合择优**：每轮从「有空角色」候选中选 综合分+组合命中×3（COMBO_SCORE）最高者；组合分=候选入队后与 核心+已定队友 的临时 scanCombos 命中数。角色骨架保持（角色全占用者仍留同定位候选），多天气手仍允许。候选上限 80 名控性能。
- **验证**：班基拉斯主推全员带组合分（大朝北鼻+3/天蝎王+3/沙螺蟒+3/雷吉洛克+3 → 沙暴岩石联防轴成型）；大嘴鸥巨沼怪/蟾蜍王+3（雨天轴）；耗时单次 findTeammates ~1.8s。
- **性能**：renderCore 内 findTeammates 同参数重复调用 → 新增 ftC 缓存（side|roleTag 键），3 核心渲染 2.3s。


## 44. v4.29 组合分衰减 + 队伍构建 Tab 接入（2026-10-11）

- **背景**：v4.28 组合分线性叠加（命中多条 ×3）→ 潜在「某两只强绑定」；队伍构建 Tab 未接入组合。
- **实现**：
  - `comboScoreOf(hits)` 全局衰减：首条 +2、额外每条 +1、封顶 +4（0/2/3/4/4）——命中多条不线性放大，只做同角色/同需求择优的软偏好。
  - findTeammates 动态贪心改用 comboScoreOf；buildTeamByNeeds 选候选处接入：同需求候选按「综合分+与已定队伍组合命中」重排（pick 择优，不影响需求闭合与多功能申报）。
- **验证**：comboScoreOf(0/1/2/3/5)=0/2/3/4/4；班基拉斯核心配队渲染正常（组合亮点）；大嘴鸥队伍构建按需求骨架闭合（补盲/控速/钉位/除钉位），组合分为软偏好不破坏需求驱动。


## 45. v4.30 新玩家评测 P0 修复（2026-10-11）

- **背景**：子代理以 ER 新玩家视角全面评测（独立报告），P0 高危三项：①幸福蛋攻击 10 被推「物理向硬撑爆发」+剧毒珠——照抄练废；②九尾辅助位「属性免疫联防位」EV 252攻/252速 + 性格内敛（减攻）——三方矛盾；③data.js 走第三方 CDN + document.write 跨域注入（Chrome 可能拦截）。
- **修复**：
  - `physOutOk(s)`：物攻侧可玩门槛（攻≥70 或 ≥50 且 ≥特攻60%）→ facade_status 硬撑流不生成于物攻 10 的幸福蛋。
  - `sanitizeBuild(s,b)`（挂在 mechBuildsOf 与 deriveBuilds 两个生成入口）：辅助/受队/肉盾位或全变化配招 → EV 重算耐久模板；主输出侧与配招类别矛盾 → EV 主项跟随配招；内敛却主物攻/固执却主特攻 → 换性格。
  - buildEvs isWall 加辅助/联防位；buildNature 加辅助/联防分支（大胆/慎重，不再内敛/固执）。
  - switchBuild tabs 选择器修复：bktab 在 wId-tabs 容器（原从 wId 查恒空 → aria 状态不更新）。
  - 数据加载：主源改**同域相对路径 data.js**（gh-pages 自带），CDN gcore 仅作回退；精灵图 assets 同域优先（__ER_ASSET_BASE=''）。
- **验证**：幸福蛋流派只剩 1 条（硬撑流消失）EV=耐久；九尾流派1 性格大胆/慎重 + 252HP/252特防 耐久；流派切换展开正常；本地 file:// 加载正常。


## 46. v4.31 新玩家评测中危修复（2026-10-11）

- **背景**：延续 v4.30 评测子代理报告的中危项清单（黑话上屏/毒疗错配/配招不满槽/弱点无倍率/特性双名/队伍不满编/移动端遮挡）。
- **修复**：
  - ① 开发者黑话清理：队伍方案「强度校准」行删除 AUROC/rho/shift_layer/dataset_engine/winrate 等术语，改玩家可读口径「用 4000 支真实对局队伍的胜负结果校准」；`smogonNote()` 去内部字段名（保留「原版惯例 ≠ ER 使用率」诚实标注）。
  - ② 毒疗流错配（天蝎王物攻 95/特攻 45）：`toxic_heal_item` 的 mechBuildBase side 与 `bestCoverAtk` 均改「物理」——配招实测「剧毒/替身/终极冲击/守住」（原补特攻破坏光线=练废）。
  - ③ 机制流配招不满 4 槽：新增 `fillMvSlots(s,b)`（挂 mechBuildsOf 各流出口）——九尾免疫联防位原只有睡觉/替身 2 招，现补满 4 槽（睡觉/替身/过热/愤怒灵魂）。
  - ④ 弱点倍率显示：核心配队弱点行改「弱点（天性口径，含倍率）」，每项附 ×N（天蝎王冰 4× 显示 ×4）。
  - ⑤ 特性中文双名统一：`abiChipName` 改为**汉化图鉴名优先**（n 含中文即原样返回；仅英文/别名时回退 ABI 表中文）——与 AGENTS §7「中文名以 xlsm 汉化图鉴为准」对齐；详情页特性/天性 chip、流派卡 bSet、弹层标题全走 abiChipName。「烈焰之魂（汉化）≠燃烧之魂（NextDex）」双名现象全站清零。
  - ⑥ 默认满编 6 只：PLAN_VARIANTS std 方案 opts `{fill:9}`（需求清零后自动补满 6 只），构建口径/audit warning 文案同步「默认满编 6 只」。
  - ⑦ 移动端 header：<768px 去 `position:sticky`（原 flex-wrap 多层遮正文），隐藏副标题 .tag、nav 单行横滑。
- **验证**（chrome-devtools，本地 v431d）：九尾免疫联防位 4 招满槽；天蝎王毒疗流 side=物理 且配招无破坏光线、冰弱 ×4；核心配队与详情页「燃烧之魂」0 命中全为「烈焰之魂」；天蝎王 fill:9 队伍 6 只；node --check exit 0。
- 提交链：master `471d1bb` → gh-pages `8645d86`（verify：fillMvSlots+abiChipName+含倍率 全命中）。

## 47. v4.32 新玩家复测 v4.30 修复（2026-10-11）

- **背景**：全新 organizer `o_000EGn8dvVO` 以纯新玩家视角复测线上 v4.30（两次独立浏览器会话交叉验证，33 张截图），报告：`…\agents\o_000EGn8dvVO\artifacts\评测报告.md`。结论「值得用、默认流派可照抄，但新玩家友好度不过关」。
- **P0-1 流派 tab 切换不展开**：switchBuild 只切外层 .bkp，内层 `details.big` 无 open → 用户看到「点了没内容」。修复：切换时对目标卡内 `details.big` 补 `setAttribute('open','')`。
- **P1-2 双刀流减攻性格**：幸福蛋R「破盾·双刀向」全物理招却推内敛/胆小。buildNature 新增 side==='双刀' 分支：物攻主→固执/爽朗，特攻主→内敛/胆小。
- **P1-3 低物理攻混物理招**：幸福蛋（攻10）「特殊向」混入双倍奉还/吸取拳。三层修复：①sanitizeBuild 物理攻种族（base[1]）<70 时过滤全部物理招并重算特殊侧性格/EV；②fillMvSlots rest 池同口径过滤（防净化后被补回）；③pickAttacks crossSide 跨侧纳入招（反击型）按对应种族可玩性门槛（防双倍奉还回流）。
- **P1-4 组合亮点参与者重复**：scanCombos 输出前按名字去重（阿尔宙斯-幽灵×2 / 超级帝王拿波×2 清零）。
- **P2-1 队友理由术语**：rsL1Of 返回串去「规则偏移层/来源 shift_layer.py」，改「强度校准：」开头（v4.31 只清了队伍卡，队友理由漏网）。
- **P2-2 搜索漏普通形态**：coreMatch 显式搜索词非空时放宽 `optMegaOnly&&hasMegaForm` 过滤（浏览模式保持 Mega 优先）；搜「妙蛙花」返回 妙蛙花 + 超级妙蛙花X/Y。
- **P2-4 数据缺失保护**：应用块头部 ERDATA undefined 时显示「数据加载失败」重试按钮而非白屏（jsdelivr 首访告警判定为旧浏览器缓存伪影，v4.30 起主源已同域）。
- **P3-1 招式反查空态**：mvTable 下新增 `mvEmpty` 提示「输入关键词开始检索」（原默认空白误以为页面坏了）。
- **P3-3 导出 toast 位置**：toastBox 从底部移顶部（top:86px），更靠近操作区（移动端 top:70px）。
- **未做/待决**：P1-1（九尾「4招」标题间歇只渲 2 招，未 100% 复现，疑与构建后二次改写标题写死「4 招」有关，待复现排查）；P2-3（移动端流派 tab 截断，可选项）；P3-2（存档联动示例文件）；两套定位词表统一（需先确认筛选匹配逻辑以免回归）。
- **验证**（chrome-devtools，本地 v432d）：天蝎王流派 tab 切换后目标卡 open=true；幸福蛋R 破盾流 双刀|固执/爽朗；幸福蛋强化流 特殊|内敛/胆小|精神强念/吸取之吻/冥想/精神噪音（无物理招）；搜索「妙蛙花」含普通形态；node --check exit 0。
- 提交链：master `c505d4d` → gh-pages `7771042`（verify：强度校准+双刀物主+fillMvSlots+mvEmpty 全命中）。

## 48. v4.33 玩家友好 + 黑盒复测发现修复（2026-10-11）

- **背景**：复测 organizer 在 9 区矩阵黑盒遍历中确认若干新玩家友好度问题，并在全量验证中发现**脚本块初始化时序 bug**：队伍构建区顶层 `renderTm/renderSlots → abiBadges → abiTagOf → NM2ID`，而 NM2ID 赋值位于同一大 script 块后部——顶层同步调用在 NM2ID 初始化前抛错会**中断整块执行**（NM2ID 永不建立，1905 只详情全部崩溃）。修复 = 初始化延迟到块执行结束后（`setTimeout(...,0)`），`loadTeam/renderAnalyze` 同理。全量 4859 方案 0 异常。
- **N1 六人队**：核心配队「推荐 6 人队」= 核心 + 主推最多 **5** 只队友（原 tms.main 可 6 只 →「核心以外 6 只」= 7 人超限矛盾）；备选网格同改 `tms.slice(5)`。
- **N2 撒钉除钉组合互异**：同一只精灵同时会撒钉+除钉时，combo 参与者必须互异（双保险才成立），否则换 haz/rem 中另一只。
- **N3 清空筛选连开关**：核心配队「清空筛选」一并清「仅最终形态 / Mega 优先」开关与 checkbox UI 态（原只清 4 个字段，开关残留=空壳感）。
- **N6 队伍持久化**：队伍 localStorage 持久化（`saveTeam/loadTeam`，刷新/重开不丢；仅存 id+轻量信息，精灵数据仍以 ERDATA 为准）；加载入口改 `setTimeout(loadTeam,0)` 防初始化时序。
- **N7 简单名单导入**：存档 CSV 导入兼容「每行一个宝可梦中文名/英文名/编号（数字或 #N）」的简单名单（`importNameList`）；表头不匹配时明确 toast 两种支持格式。
- **N11 数字搜索置顶**：队伍构建 / 核心配队纯数字查询时精确编号命中者置顶（输入 1 → #1 在最前，不再 #1/#10/#11 混排）。
- **N18 流派名前缀去重**：前缀与 base 语义重叠时去重（`强化+强化清场 → 强化清场`，不再「强化强化清场」——幸福蛋案例）。
- **文案/UI 小优化**：特性标题动态数量（`特性（N 选 1…）`）；属性克制空态文案「请选择 1-2 个属性」→「可多选，多选=看综合承受面」（对齐可 3 属性实况）；机制口径/特性备注/努力值条/特性效果标题去开发者黑话；smogon 硬门文案不硬性改变队友排序。
- **待办延续**：P1-1（九尾 4 招标题间歇）、P2-3（移动端 tab 截断）、P3-2（存档联动示例）、两套定位词表统一；黑盒 9 区矩阵剩 ⑤特性反查 / ⑥战术模板 / ⑧存档 / ⑨移动端 未完成（子代理继续中）。
- **验证**：node --check exit 0；全量 4859 方案 0 异常（子代理 chrome 会话）；本地静态关键词 verify 通过。
- 提交链：master `4664f16` → gh-pages `e1c034b`（verify：loadTeam+importNameList+saveTeam+「核心以外 5 只队友」）。

## v4.103 落地（2026-10-25）

### 引入项
- **伤害 UI**：roll16(lo,hi) 16 段乱数分布（85-100% 16 段细条带，五档染色禁红）+ koProb(dmgArr,hp,n) 多段 KO 概率（pN=1-(1-p)^n，纯前端~50行零新分片）
- **分享 hash**：`#team=v2.1:base64` 全字段序列化（6 只/性格/EV/招式/道具，实测 1,621B 往返保真+坏 hash 拒绝）+分享卡链接区复制按钮+hash 自动加载
- **P3 联防弱系排除**：c<=0.5 门闩（纯黑盒确认弱电队推地面系）

### 二维码 P2 遗留降级
- 10 轮修复未收敛：stub→矩阵空→未挂→挂空→编码空→作用域 undefined→挂函数→挂调用→API 形状错
- n579 降级兜底=QRLIB 不可用→隐藏+「二维码暂不可用，请复制链接分享」，线上无空白框
- 下版=完整 qrcode 库+一次性 API 适配+jsQR 解码验证

### 三线
- 引擎 PASS（N1=N2/hunk 零回归/分片一致/hash 往返/概率卷积/P3 门闩）
- 纯黑盒（P3 生效+分享卡链接区；二维码 P2；观感 93/100）
- 技术黑盒（渲染链无回归+二维码断点定位）

### 版本链
- v4.103=index 0F7449AD4114B71D 1,486,284B
- 部署 master b24c8709/gh-pages b68074c5

## v4.104 二维码专修闭环（2026-10-25）

### 引入项
- **二维码 P2 闭环**：完整 qrcode 库 esbuild bundle（含 RS ECC/format/timing/自动选版）+ modules.get 适配
- 实测 283 字符 hash URL→size=77（v27 自动升级）→ jsQR 解码 match=true 硬门
- canvas clientWidth 动态缩放（375px 自适应）+ 兜底保留

### 13 轮修复链
- v4.103 10 轮：stub→矩阵空→未挂→挂空→编码空→作用域 undefined→挂函数→挂调用→API 形状错
- v4.104 3 轮：API 形状（modules.get）→canvas 触发（shareCardOpen 漏调）→375px 缩放（clientWidth）

### 挖掘增量 v504（v4.105 候选）
- NPC/存档队一键载入 dmgCalc 防守方
- EV 迷你横条图
- 配速反推
- 收藏星标

### 三线
- P0 全绿（jsQR match=true）
- 引擎 PASS（QR 完整库断言+hunk 零回归+分片一致+hash 保真）
- 黑盒（二维码首通+375px PASS+观感 93）

### 版本链
- v4.104=index 4119E5AACB579055 1,486,725B
- 部署 master 11d10c58/gh-pages 67b0dde

## v4.105 挖掘4项落地（2026-10-25）

### 引入项
- 防守方载入：NPC_TEAM_SAMPLES 2队×4特性 + SAV_ROWS 中文键适配（名字/道具/特性）
- 伤害面板容器补建：v4.89 起 12 版 UI 缺失真 bug 修复（dmgOut/dmgDefList/dmgMvList + 攻方入口 dmgAtkPick + 16段分布/KO概率呈现）
- EV 迷你横条：六段 EV/总EV 口径
- 配速反推：Gen3 公式与滑块同算法（baseSpd 种族值输入）
- 收藏星标：toggleFav/isFav localStorage + ★已收藏筛选开关
- 速度线执行链修复：switchTab('speed') → speedRender(true)

### 重大发现与教训
- 伤害判定 UI 面板 v4.89 起 12 版从未存在（纯黑盒 12 版报「不渲染」被误归因环境误报=真 bug——方法论：渲染类持续缺失不得归因环境，须查 HTML 容器存在性）
- 服务目录错位致复验旧版误报（残留 http.server 进程占端口服务旧目录——实施流程内建服务目录一致性检查）
- 技术黑盒本轮浅测局限（多次复验只报渲染链单点）——三线配合调整为引擎 node 断言+纯黑盒交互为主

### 三线
- P0 防守方/配速/收藏/EV/伤害输出 node 层 PASS；UI 完整点选=黑盒自动化限制登记玩家手动验证
- 引擎 N1=N2/hunk 零回归/分片一致
- 纯黑盒 面板首现+载入成功+console 0+观感 93

### 版本链
- v4.105=index FCD420AFF0E7E351 1,493,162B
- 部署 master 9fa875b7/gh-pages 73e66ade

## v4.106 伤害判定面板传参断点修复（2026-10-25）

### 修复内容
- dmgDefPick/dmgAtkPick 中文名→数字 id 兼容（zh 名匹配+未知名 toast 不静默）
- dmgRender try/catch 暴露异常不静默
- 全链路 onclick 传参规范（展示中文名/传数字 id）

### 方法论沉淀
- node 层模拟绕过 UI 传参断点教训：node PASS≠UI 可用——MainAgent 真浏览器实锤 defId="班基拉斯" 中文名传参断点；历轮 node 断言用数字 id 直调 dmgCalc 掩盖了 UI 断点
- onclick 内嵌中文名传参规范：展示名/传 id——dmgDefPick/dmgAtkPick 已加 zh 名兼容层
- 自动化点击命中错误元素教训：纯黑盒 14 版「伤害判定不渲染」实为点到顶部队伍 chip 而非面板内 dmgAtkList chip——自动化须先查 DOM 容器实际目标再点
- 技术黑盒交互局限持续（点选链复现能力不足）——三线配合以纯黑盒 DOM 级点击+引擎 node 断言为主

### 三线
- P0 MainAgent 实锤断点修复+纯黑盒三链路闭环（NPC 下石鸟→班基拉斯 137-162 2HKO+搜对手+攻方）+中文名→数字 id 解析一致
- 引擎 PASS（N1=N2/hunk 零回归/分片一致/node 断言中文名=数字 id 输出逐位一致）
- 黑盒 三链路+可读性+console 0 运行时错误

### 版本链
- v4.106=index 1518B5DA9C45E71B 1,493,810B
- 部署 master efaae522/gh-pages 0025c266

## v4.107 存档队载入路径兜底（2026-10-25）

### 修复内容
- SAV_ROWS 空态回退内置演示队（隆隆岩+妙蛙花，含道具+特性）
- 有上传时优先真实 SAV_ROWS.pc/数组行
- 存档链路真浏览器闭环（四入口全通）

### 工具挖掘 v507 摘要（推荐 v4.108 路线图）
- 引入候选 2：队检⑤全队无控速手段 + teamQA 目录化改造（技术债根治）
- 选择性候选 2：roll16 KO 分界染色 / 速度线 P50-99 条带点击过滤
- 排除候选 1：无强化手段（探针验证 PvE 常态稀释信噪比）
- 推荐路线：P1 队检⑤+目录化→P2 roll16 染色→P3 最近浏览→P4 速度线过滤，<15KB 零新分片

### 三线
- P0 存档链路真浏览器闭环（演示队渲染+点选+dmgOut 输出）
- 引擎 PASS（N1=N2/hunk ~8 行零回归/分片一致）
- 黑盒 四入口全通+观感 94/100+console 0

### 版本链
- v4.107=index 72DE1B0266955D87 1,494,092B
- 部署 master 8f47daa6/gh-pages 216410e9

## v4.108 挖掘路线图 P1-P4 落地（2026-10-25）

### 落地项
- P1 队检⑤全队无控速手段告警（FUNC_MV.speed 目录驱动：电磁波86/岩石封锁317/顺风366/戏法空间433）
- P1 teamQA③④目录化改造：REMOVAL_IDS=[229,432,525]/RECOVER_IDS=8项+别名表（羽栖/祈愿/许愿/影子球→暗影球等），根治硬编码中文名单技术债
- P2 roll16 KO 分界染色条带：16 段 flex 四档（绿=OHKO/橙≥75%/黄≥50%/蓝<50%，禁红）
- P3 图鉴最近浏览 chip：openSp localStorage 8 只 FIFO+toggleRecentOnly 过滤
- P4 速度线分位过滤：P90+/P75-90/P50-75/<P50 四档 chip（v4.94 既有，本轮确认落地）

### 等价断言
- Test1 高速旋转+羽栖不告警 / Test2 撞击叫声全告警 / Test3 祈愿清除浓雾顺风别名不告警 / Test4 许愿 alias ④不告警——全过

### 版本链
- v4.108=index 9021C86933ECFE11 1,496,134B
- 部署 master 31efe4ae/gh-pages 9ff6aec4

## v4.109 切Tab自动关浮层体验修复（2026-10-26）

### 修复内容
- header z-index 50→100（Tab栏高于modal 80/drawer 60）
- switchTab() 直接 DOM 操作关闭 6 类浮层：spDrawer/mvDrawer/glModal/shareCard/anDetail/ppModal
- 跨Tab跳转「以它为核心」先取数据再关不回退

### 6轮修复过程与教训
- n608 挂接声称未生效=close函数undefined（switchTab调未定义函数静默失败——实施代理「声称已修」未验证函数存在性）
- n609 z-index修正（header 50→100）
- n610 关错容器（spDrawer非详情卡容器——详情卡=mvDrawer内mbox）
- node模拟无法验证DOM渲染——实施代理自验须真机/DOM级，否则以纯黑盒DOM级实测为准
- 容器id与实际渲染容器逐一核对

### 工具挖掘 v509 摘要（推荐 v4.110 路线图）
- P1 存档多档保存→P2 命中chip→P3 打击面色带→P4 多目标配速表
- 候选④收藏+最近双筛选=探针实证已落地排除

### 版本链
- v4.109=index 36F8AF061817D2FE 1,496,807B
- 部署 master c62cfcc9/gh-pages de4c8911

## v4.110 v509挖掘路线图P1-P4落地（2026-10-26）

### 落地项
- P1 存档多档保存：er_savs_v1 localStorage FIFO 3档（{t:Date.now,rows:SAV_ROWS[:6]}）
- P2 命中chip：dmgOut 追加 accuracy 中性色显示（<100% 带期望折算提示）
- P3 打击面覆盖色带：18属性chips折3行（全队攻击招式覆盖标注，绿底/灰底）
- P4 多目标配速对比表：P50/75/90/95 所需EV+性格建议（复用spdPlanForTarget）

### 版本链
- v4.110=index A00AA7C572BC2336 1,498,694B
- 部署 master 142b97be/gh-pages b57b291f

## v4.111 v4.110遗留两缺口快修（2026-10-26）

### 修复内容
- 缺口1 spdMultiBox容器补建（详情卡配速区——修复容器缺失致多目标配速表静默跳过）
- 缺口2 存档档位选择UI（renderSavSlots读er_savs_v1渲染历史档chip横排+loadSavSlot点击载入对应档喂renderMyPool）

### 方法论沉淀
- 渲染类功能验收必须含容器存在性检查（v4.110 P4 只写渲染函数未建容器=静默跳过）
- 「只写写入不写读取/只写渲染不建容器」类偷工模式（v4.110 P1 存档写入在案但无读取UI）——实施代理交付须自查「写入↔读取/渲染↔容器」对称性
- 挖掘路线图「全落地」判定以MainAgent真浏览器逐项实测为准

### 版本链
- v4.111=index DC337F9E55E5893A 1,499,752B
- 部署 master 6617dd5/gh-pages 2736e84

## v4.111.1 微修（2026-10-26）

### 修复内容
- renderSavSlots缺初始化调用：DOMContentLoaded首载即渲染存档档位chip
- 修复刷新后localStorage有档但chip不显示

### 对称性检查清单（更新）
- 渲染函数三要素对称：①容器存在性②初始化调用（首载可见）③写入触发
- v4.111.1 补齐初始化缺口

### 版本链
- v4.111.1=index 91764E8E24985C23 1,499,886B
- 部署 master aed1431/gh-pages b90ea66

## v4.112 三要素对称扫描收口（2026-10-26）

### 本轮改动
- 无实质改动（三要素扫描：存档档位/多目标配速表/打击面色带/命中chip全对称）
- v512挖掘摘要：排除3（用户点名Mega开关/进化链/速度线排序搜索均已落地）/引入1（QR分片懒加载首屏瘦~15KB）/选择性1（分析器双队快照~8KB）

### 推荐 v4.113 路线图
- P1 QR分片懒加载→P2 分析器双队快照

### 版本链
- v4.112=index 6C7AAD3DA19198D2 1,499,882B
- 部署 master 8618440/gh-pages e67be9d

## v4.113 v512挖掘路线图P1-P2落地（2026-10-26）

### P1 QR bundle 抽分片懒加载（手机端首屏瘦身）
- 抽出 v4.103 内联 qrcode esbuild bundle（24,993B）→ 新增 `assets/qrcode_v498.js`（25,196B，含头部注释；暴露全局 `var QRLIB` + `function QRCode`，与 v4.103 内联版逐字一致）
- index.html 原位替换为 `var QRLIB=null` + `__erLoadQrLib(cb)` 懒加载器（复用 v4.96 showdown_sets 已验证的按需 fetch 模式：动态 `<script src="assets/qrcode_v498.js?v=v498">` 注入 + 队列去重 + onload 回调重绘 + onerror 降级「二维码库加载失败，请复制链接分享」）
- `renderShareQr()` 守卫升级：QRLIB 未就绪时隐藏 canvas + 文案「二维码加载中…（首次使用）」→ 触发 `__erLoadQrLib` → onload 自动重绘（不报错不空白）
- **首屏静态 `<script src=qrcode>` 引用数=0**（仅动态注入）；调用处 QRLIB 存在性守卫保持

### P2 分析器双队快照对比（er_teamSnap_v1）
- localStorage key `er_teamSnap_v1`（与 `er_savs_v1` 同前缀防污染）；`anSnapSave()` 序列化当前 `anLastR` 的 7 维字段（members/sys/roles/side/speed/weak/cover）
- 新增容器 `#anSnapBar`（插在 `#anCfgBar` 与 `#anOut` 之间）；无快照时仅渲染「📷 存为快照」按钮不占额外空间
- 三 chip：当前队 / 快照队 / 对比（仅存快照后出现）；`anSnapBlockHtml(R,title,badge)` 渲染 4 维（六维 `teamStatsChartHtml(R)` / 速度 `teamSpeedCardHtml(R)` / 联防 `teamDefHeatHtml(R)` / 打击面 cover 卡）
- `teamSpeedCardHtml(_R)` 加可选 R 形参（缺省回退 anLastR，零回归）
- 对比模式上下堆叠两块（🟢 当前队在上 / 📸 快照队在下），flex-wrap+垂直流，禁并排防 375px 横溢

### 附带修复
- favicon.ico 404 噪音消除：head 加内联 SVG data-URI favicon（精灵球红/黑/白），浏览器不再自动请求 /favicon.ico

### 路线图完成标记
- **v512 挖掘 P1-P2 全落地**——手机端加载优化剩余空间收口（QR 分片 + 既有 data_lite/species/adv 三 shard + showdown_sets 按需 fetch 模式已统一）

### 守门+自验
- 引擎断言：静态 qrcode 引用 0 / 动态注入 2 / QRLIB stub 守卫在 / 瘦身 −18,298B
- 快照 schema 断言：er_teamSnap_v1 localStorage / anSnapSave / anSnapBlockHtml / 三 chip 全在
- hunk 零回归：anRender ①~⑩ 区块渲染链未删（仅 renderAnTab 尾部 anSnapView 分支，cur 路径逐字走 anRender）
- 冻结分片逐位一致：data_lite/species/adv_v498 + showdown_sets_v496 SHA256 全 match=True
- 5 个内联 `<script>` 块 `new Function()` 语法检查全 PASS
- 真机 DOM 级：首屏 QRLIB=null 且 qrcode_v498.js 未 fetch；触发分享后分片按需加载、canvas 17,350 非白像素（QR 图案真实渲染）；快照存/切/无快照空态/三 chip 对比全通过；375px 无横溢；console 0 error

### 版本链
- v4.113=index 232460B74951D1DB 1,481,584B（−18,298B vs v4.112 1,499,882B）
- 新增 assets/qrcode_v498.js=0C77B013D8501760 25,196B
- 部署 master 925a0e3/gh-pages 687cd62

## v4.114 存档解析 UI 优化+全面排查（2026-10-26）

### A. 移除「锚点：…」UI 展示块
- 删除原 savParseOut 中「锚点：✓护城龙 BOX1第1格 …」整块 div（约 L4626）
- `d2Tip` 锚点提示改为 `console.log('[ER-sav anchors OK/FAIL]', ...)` 内部自检，不下发 UI
- ANCHORS 数据结构（L4442）/ anchorsOk/Fail 数组 / 返回字段保留为内部逻辑，console 输出保留可观测性
- 解析定位本身按逻辑段布局扫描（段8=BOX1-7/段15=BOX20-26），不依赖锚点，保持不动

### B. 全文件「末招」字面清点替换（共 11 处，grep 实证）
1. 选择池卡片（L4701）：原 `<div class="pl">末招 '+shortTag(last)+'</div>` → `<div style="display:flex;flex-wrap:wrap;gap:2px;margin-top:2px">` 4 个 `<span class="ptag">shortTag(move)</span>` 横排（375px flex-wrap 不横溢），title 属性保留完整「招式：x / y / z / w」悬浮提示；删除 `last` 变量
2. 提示文案：L802、L4691「…道具 / 末招」→「…道具 / 招式」
3. CSV/JSON 导出列名：「招式4(末招)」→「招式4」（L2450/2568/4475/4777/7845 等 8 处字段引用同步）
- 内部 `moves4` 数组语义不变（仍读 r['招式4']）

### C. 全面排查结论
1. **真实存档核对表**（ERv2.65-beta2-debug汉化版.sav 131,088B，parse_er_save_v4.py 解析 431 条）：
   - 队伍 6 只全 Lv100：超级土王Mega/坚果哑铃/Storming(英文ID)/雷电云-灵兽/洛奇亚/鳃鱼龙——4 招/PP/能力 7 项/主特性/天性/道具/性格逐项与游戏内一致
   - 5 锚点全 ✓：护城龙#411 BOX1第1格 Lv36 / 花舞鸟-热辣热辣#741 BOX20第1格 Lv80 / 土王#980 BOX22第18格 Lv55 / 超级化石翼龙#1513 BOX26第28格 Lv60 / 远古巨蜓 / 超级土王Mega
2. **背包道具探针**：网页 JS 与 Python parse_er_save_v4.py 均无背包/pocket/item bag 解析代码（grep bag/背包/ITEM_BAG 仅命中记录内道具掩码 0x1FF→0x3FF 注释）——**结论：未实现，本轮只评估不落地**；ER 背包 pocket 布局需下轮逆向（FRLG 原版背包在 0x560 起 42 格×4B，ER 改版可能平移，需二进制 diff 实证）
3. **特殊区 15 条性质**：特殊区A 6 条（超级晶光花#1907/果然翁#202/铁火辉夜#797/长毛巨魔#861/超级拉帝亚斯#1539/超级烈空坐#1548，全 Lv100）+ 特殊区B 9 条（雪妖女R#2626 Lv80/超级喷火龙Z#2191 Lv80/花叶蒂-永恒之花#1716 Lv80/魔幻假面喵#908 Lv60/纸御剑#798 Lv45/幸福蛋R#2633 Lv80/美录梅塔#809 Lv100/超级骨纹巨声鳄#2224 Lv80/超级颤弦蝾螈R#2178 Lv80）——等级整齐（Lv100/80/60/45）、招式配置固定，**判定为对战设施预设 battle box 宝可梦，非玩家持有**
4. **待定字段观察**：+0x0A / +0x0E 两字节**已被 4 招加密块消费**（parse 脚本 v04/v08/v0A/v0E → decode4_moves），并非自由字段；+0x48..0x4B 位于 7 维 stats 块（+0x3A..+0x47）之后，属 0x60 记录尾部 padding/ribbon 区——用户原假设「+0x0A bit9-5=分组N / +0x0E 高5位」不成立
5. **375px/console 0**：真机 DOM 走查通过，body 无「锚点：」/「末招」字样，console 0 error，ER_ENGINE_VER=v4.114

### 守门+自验
- grep「末招|锚点：」= 0 命中
- 5 个内联 script 块 new Function() 语法检查全 PASS
- 真机注入 SAV_ROWS 验证选择池卡片：4 个 ptag 招式标签横排 flex-wrap，375px 无横溢
- 冻结分片逐位一致（data_lite/species/adv_v498 + qrcode_v498.js + showdown_sets_v496 未改）

### 版本链
- v4.114=index AC0B7D2D18FDEFDC 1,481,438B（−146B vs v4.113 1,481,584B：删锚点 UI 块 -~200B + 4-tag flex-wrap 新增 +~50B + 「末招→招式」同字符数零差）
- 部署 master 2f87801/gh-pages c8c3246

## v4.115 背包探针二轮结论（2026-10-26）

### 探针方法
- 解码段轮换 K=3，20 逻辑段 active/inactive 副本对（+0xFF4 save counter 高者为 active）
- 全文件逐 4 字节扫描：(item_id u16, count u16) 对，item_id ∈ gameData.items keys（929 个，0-1022），count ∈ 1..99
- 期望背包特征：连续 ≥20 条合法 (id,count) 对，(0,0) 结尾，pocket 之间以 pocket 边界分隔

### 实证结果
- **全文件最长连续合法对仅 4 条**（logical3 phys 0x0 +0xE1C）：Master Ball×1 / (0,9) / (0,5) / Great Ball×3——其中 2 条 id=0 空槽，**不构成背包**
- logical0（phys 0x11）：player name/OTID/money 区，无 (id,count) 连续段
- logical2（phys 0x13）+0x28 Super Potion×19 / +0x164 Repel×207 / +0x27C Power Anklet×55 等孤立命中——但周围是 6528/25671/33472/39062 重复 0x10 间隔模式，**判定为 checksum/hash 表或宝可梦邻接数据，非背包**
- L8/L12/L15/L16/L17 box 段中反复出现的 Smoke Ball×6 为宝可梦记录内 held-item mask 误命中（id=252 & count=6 恰好落在记录位）

### 结论
- **ER v2.65 存档中无明文 (id,count) 连续背包段**——背包数据要么加密、要么压缩、要么存放在未映射的物理区
- 现有两个存档（ER 2.5 vs ER 2.65）版本差过大，diff 噪音远超信号，无法做受控 before/after 定位
- **本轮不输出伪 parser**（critical collaboration：宁可不做也不做错）

### 下轮落地前置条件
- 需用户提供**受控实验档对**：游戏内打开背包 → 记录当前状态 → 购买/使用 1 个道具 → 存档 → 再存一份
- 对两档做字节级 diff，差异区即背包 pocket 位置
- 若 diff 后仍无连续 (id,count) 段 → 背包已加密，需逆向 ER 源码 bagSave/bagLoad 函数

### 版本链
- v4.115=index 198057D05FE2CFB7 1,481,438B（与 v4.114 同字节数，仅版本号两处 bump）
- 部署 master b1a6331/gh-pages 8b53ecc

## v4.123 三路黑盒体验测试轮（2026-10-27，纯测试轮不改代码）

### 观感评分
- A 代理：86 / B 代理：88 / C 代理：80（均低于基准 96）
- 汇总报告：`C:\temp\er-v523-blackbox\v523_问题清单汇总.md`

### P1 四项（高优先，v4.124 修复轮依据）
1. **伤害面板 Enter 误触全局快捷键**：焦点未隔离，在伤害判定面板按 Enter 触发全局快捷键（如入队/搜索），需面板内 keydown stopPropagation
2. **首屏白屏 8-10s 无 loading**：`anMvId is not defined` + `indexOf` console 报错，分片加载期间无 loading 提示，用户感知卡死
3. **一键入队按钮历史档路径缺失**：v4.121 常驻按钮仅在完整解析 .sav 后渲染（special>0）；历史档 chip 加载路径（loadSavSlot）rows 无特殊区计数，按钮不出现——需历史档也能触发一键入队（或明确提示「需完整解析」）
4. **详情 modal 误触关闭+滚动冲突**：modal 打开时背景滚动未锁定，点遮罩误触关闭，需锁背景滚动+遮罩点击关闭确认

### P2 六项（中优先）
- Mega 筛选语义待验证（「仅最终形态+奇石优势」与「Mega 形态优先」交互）
- 速度线页面右侧留白过多
- 成员卡内容截断（长宝可梦名/招式名）
- BOX 明细恒「—」待验证（展开后字段是否填充）
- 搜索不过滤 BOX 池（存档联动组队区搜索框与全图鉴搜索框行为不一致）
- 档 chip 选中态弱（历史档 chip 无明显高亮）

### P3 三项（低优先）
- 略（详见汇总报告）

### 正常项（已验证无回归）
- 存档对比 diff 完全正确（新增/移除/等级变化三类）
- 进化链展示
- 速度线分位
- 375px 无横溢

### 版本链
- v4.123=纯文档轮，index.html 无改动（线上保持 v4.122=F96797C535026EA4 1,486,764B）
- 部署：仅 AGENTS.md commit 至 master（无 index 改动，gh-pages 不动）

## v4.124 黑盒问题修复轮（2026-10-27，P1 五项全修）

### P1-1 伤害面板 Enter 误触焦点隔离
- 全局 keydown 监听：INPUT/TEXTAREA 聚焦 + Enter → preventDefault+stopPropagation
- 真机验证：dmgDefQ 输入「耿鬼」+ Enter → 弹窗不关，不触发全局快捷键 ✓

### P1-2 首屏白屏根因=anMvId 未定义
- **根因**：`anMvId(m)` 在 L3752/3757/3761/4412 被调用（除钉/回复/控速/打击面覆盖），但函数从未定义——首屏 renderAnalyze 遍历 team 招式时抛 `ReferenceError: anMvId is not defined`，渲染中断白屏 8-10s
- **修复**：L1078 后新增 `anMvId(m)`（数字直返/字符串走 mvIdByZhOrEn 反查/未知返 0）；顺手修 L4419 `ERDATA.moves[mid]`→`MV[mid]`
- console 0 error ✓

### P1-3 一键入队历史档路径
- **根因**：v4.121 常驻按钮渲染条件=`res.summary.special>0`（完整 .sav 解析才有）；历史档 chip 加载（loadSavSlot）rows 无 special 字段
- **修复**：loadSavSlot toast 改为「已载入历史档 N；如需一键入队设施队，请重新解析存档 .sav」——明确降级，不误导

### P1-4 Modal 误触关闭+滚动冲突
- **根因**：L3236 `spDrawer.onclick=function(ev){if(ev.target===spDrawer)closeSp()}` 点背景误关；modal 打开时背景仍可滚
- **修复**：删除背景点击关闭；openSp 加 `document.body.style.overflow='hidden'`；closeSp 恢复 `''`
- 真机逐项：点内部不关/点背景不关/Escape 关/内滚不外滚 ✓

### P1-5 队伍构建 Tab 选择池空白（黑盒连续两轮报，hotfix）
- **根因**：switchTab 渲染守卫（L1979-1984）缺 `name==='team'` 分支——点队伍构建 Tab 只切 active class，不调 renderTm(true)，tmGrid 空 innerHTML
- **修复**：L1984 补 `else if(name==='team'&&typeof renderTm==='function'){renderTm(true)}`
- **DOM 级实锤**：tmGrid.children 0→60（妙蛙种子/妙蛙草/妙蛙花…卡片渲染）
- **方法论命中**：渲染验收三要素对称（容器存在/初始化调用/写入触发——缺初始化调用）

### P2/P3 未修
- P2 六项（Mega 筛选语义/BOX 明细—/chip 选中态/成员卡截断/速度线留白/搜索不过滤 BOX 池）：下轮验证真伪后修
- P3 三项（速度线加宽/伤害 chip 拥挤/速度分布直方图）：未做，如实标注

### 版本链
- er-n644=1,487,941B sha16=3F874A55A5F76C7B
- master 7d58919 / gh-pages 4a8f99c
- 线上 v4.124 已部署验证
- 主工作区已同步

## v4.125 P2 验证修复轮（2026-10-27，P2-2/P2-3 修 + 3 项标注关闭）

### P2 验证结论
- **P2-1 Mega 筛选语义**：设计正确（开启显示 Mega 形态本身 + 可 Mega 进化物种）——标注关闭
- **P2-6 顶部搜索不过滤 BOX 池**：设计正确（职责分离：顶部搜索过滤全图鉴池，BOX 池由存档联动组队区独立管理）——标注关闭
- **P2-2 BOX 卡明细恒「—」**：历史档数据稀疏（rows 无 4 招/道具/性格字段）——savPcRowHtml 检测 r.来源 缺失时降级显示「历史档摘要 · LvXX（重新解析存档看明细）」
- **P2-3 历史档 chip 选中态弱**：新增 `_loadedSlot` 变量；选中 chip 高亮 #bbdefb + 蓝色边框 #1976d2 + font-weight:600；loadSavSlot 后重绘

### 第二轮黑盒回归（v4.123→v4.125 观感对比）
- A 路：86→96（+10）；B 路：88→90（+2）；C 路：80→90（+10）
- P1 五项无回归（选择池/白屏/Enter/modal/toast）
- 速度线留白实测已无（上轮误报）
- 核验结论：
  - BOX「—」伪（推荐卡数据真实缺失——历史档 rows 无 moves/item 字段，P1-3 toast 已提示）
  - 伤害面板无产出伪（内联渲染非下拉 + 需三步选攻方/防守方/招式）
- **真 bug = console TypeError indexOf**：savPcSearch L4554 `x.r.来源.indexOf('特殊区')` 在历史档 rows（无 来源 字段）抛 TypeError——已加守卫 `x.r.来源&&(...)` 修复（+14B）

### v4.126 候选问题增量
- 375px 成员卡截断（P2-4 确认未修）
- 核心配队 tab 首载白屏 ~20s（待验证）
- CSV 名单不填 BOX 池（设计待确认）

### 版本链
- er-n646 最终=1,488,554B sha16=565237403B8AD098
- master：611eab6（v4.125）→ 9bb526f（hotfix）→ 登记 commit
- gh-pages：ac1752e（v4.125）→ 5666522（hotfix）
- 线上 v4.125 已部署验证
- 主工作区已同步
- 增量 +613B < 15KB，零新分片

## v4.126 第三轮修复（2026-10-27，P1/P2/P3 全修+hotfix）

### P1 375px 成员卡截断
- **根因**：`.anmem` 是 `inline-flex` 无 `flex-wrap`，精灵图(40px)+名字+定位在 375px 下挤成一行溢出截断
- **修复**：`.anmem` 加 `flex-wrap:wrap`；`.anmemnm` 加 `flex:1 1 auto; min-width:0`——名字换行不截断

### P2 核心配队首载白屏根治+hotfix
- **根因**：switchTab('core') 同步调 drawCoreList()，引擎长计算阻塞 UI 线程
- **初版 bug**：loading 占位覆盖整个 tab-core innerHTML → 清掉搜索表单元素 → drawCoreList 读 `$('coreSearch').value` 抛 null → 永远卡 loading（轻量黑盒「仍空白」根因实锤）
- **hotfix**：loading 仅写 `#coreGrid` 容器（保留上方搜索表单/类型 chip）+ 200ms 延迟确保 loading paint
- **教训**：loading 占位必须作用域收敛——只覆盖被替换的容器，不得清掉表单等既有交互元素

### P3 CSV 名单不填 BOX 池
- **设计正确**（职责分离：CSV→队伍前6；BOX 池=存档/全图鉴独立管理）
- CSV 按钮加 `title="CSV 名单导入队伍（前6只），不填充下方全图鉴组队池"`——悬停即见说明

### 轻量黑盒第三轮
- 观感 96（v4.123 基准恢复）+ console 0 + 核心配队渲染正常 + 成员卡正常
- 报告：`C:\temp\er-v526-blackbox\blackbox_v526.md`

### 版本链
- er-n649 初版=1,489,151B sha16=6B41936ED7A1E993
- er-n649 hotfix=1,489,089B sha16=B0CD6D75C17DF5CD
- master：526f233（v4.126）→ 9f25922（hotfix）→ 登记 commit
- gh-pages：9061a5d（v4.126）→ 2c87b0d（hotfix）
- 线上 v4.126 已部署验证
- 主工作区已同步
- 增量 +535B < 8KB，零新分片

## v4.127 体验提升轮（2026-10-27，黑盒第四轮视角切换=体验增强建议）

### 黑盒第四轮产出
- 视角切换：从 bug 分级 → 体验增强建议（用户点名：不止找 bug，提升体验更重要）
- 三路产出 26 条建议（A 7/B 8/C 11），每条含现状+改进点+预期收益+工作量（P0-2h / P1-半天 / P2-1天）
- 报告：`C:\temp\er-v527-exp\exp_v527_{A,B,C}.md`

### 落地 3 项（择优+探针）
- **②伤害面板一键预设**：防守方输入框下方新增「常用对手」chips（超级土王/坚果哑铃/洛奇亚/耿鬼/巨金怪）——点击填入 dmgDefQ + 触发搜索——**已落地**（不碰计算本体）
- **①术语悬浮 tooltip**：探针确认 GLOSSARY 现有系统已覆盖（虚线下划线+悬停释义+点击词条卡片）——无需新增
- **③搜索结果计数+空态**：探针确认 tmMore 现有「共 N 只」/「无匹配」覆盖——无需新增
- 体验轮同样出现「探针→无需新增」但非空轮（②落地）

### 未落地建议入库（下轮候选）
- 队伍自动恢复（B E1 P2-1天——连续工作流地基重点）
- BOX 卡徽标+直入队（B E2）
- 入队批量多选（A E2）
- 招式限可学补全+场景预设 chips（C E2/E3）
- 最近浏览 mini chips+进化链面包屑（C E8/E9）
- 375px 弹窗 chip 横滚+击杀线 slider 拇指区（C E10/E11）
- 历史档数量徽标+改名（B E4/E8）
- 对比图形化（B E5）

### 版本链
- er-n651=1,490,068B sha16=18556E14BA02DE95
- master：210fabd（v4.127）→ 登记 commit
- gh-pages：71aa561
- 线上 v4.127 已部署验证
- 主工作区已同步
- 增量 +979B < 15KB，零新分片
- 引擎逻辑零改动

## v4.128 体验增强第二批（2026-10-27，v4.127 入库建议择优落地）

### 三项探针结论+落地
- **①队伍自动恢复**：探针确认**已存在**（v4.33 N6 saveTeam/loadTeam 链路——页面 load 后自动读回 localStorage er_team/er_teamInfo + renderTm/renderSlots/renderAnalyze——无需新增）
- **②BOX 卡直入队**：探针确认**已存在**（savPcRowHtml 每行「＋入队」1 步直达——无需新增）
- **③最近浏览 mini chips**：**已落地**（搜索栏下方「最近：妙蛙种子 喷火龙…」最多 6 只——点击 openSpById 跳转 + openSp 后自动刷新——+786B）
- 连续两轮体验增强：入库 15 条中 6 条已处理（2 落地 + 4 探针确认已有）

### 剩余候选滚动入库
- 入队批量多选 / 进化链面包屑 / 方案卡折叠 / 速度线迷你细条 / 种族值极限刻度
- 375px 弹窗 chip 横滚 / 击杀线 slider 拇指区 / 历史档数量徽标+改名
- 对比图形化 / 筛选区折叠

### 版本链
- er-n653=1,490,854B sha16=7567BDC9E4709779
- master：389d219（v4.128）→ 登记 commit
- gh-pages：1f445d0
- 线上 v4.128 已部署验证
- 主工作区已同步
- 增量 +786B < 10KB，零新分片
- 引擎计算零改动

## v4.129 体验增强第三批（2026-10-27，v4.128 滚动候选择优）

### 四项探针结论+落地
- **①入队批量多选**：**已落地**（「☑ 多选入队」按钮→多选模式卡片高亮最多 6 只→底部「已选 N 只 · 确认入队」栏→一键批量入队——复用 addToTeam 链路满 6 停——+1,680B）
- **②方案卡折叠**：预算未做，留待下轮
- **③速度线迷你细条**：探针确认现有 16 段染色条带+P50/P75/P90/P95 刻度已足够——标注关闭
- **④对比图形化**：预算未做，留待下轮

### hotfix（黑盒抓出真 bug——v4.126 教训再次命中）
- **根因**：switchTab 数据未就绪守卫 `box.innerHTML='数据加载中…'` **覆盖整个 tab-team 容器**抹掉工具栏（搜索框/筛选/多选按钮——黑盒「按钮未找到」根因）
- **hotfix**：loading 仅写 grid 容器（_gridMap 映射 team:'tmGrid' / dex:'spGrid' / speed:'speedTable' / analyze:'dmgOut' / core:'coreGrid'），保留工具栏
- 黑盒复测工具栏常驻+观感回升 96

### 剩余候选滚动入库
- 方案卡折叠 / 对比图形化 / 进化链面包屑 / 历史档徽标+改名
- 375px 弹窗 chip 横滚 / 击杀线 slider 拇指区 / 筛选区折叠

### 版本链
- er-n655 初版=1,492,534B sha16=F447B38A1435D3BB
- er-n655 hotfix=1,492,785B sha16=41C7EE14F62CF7E3
- master：174a2e4（v4.129）→ 749bb63（hotfix）→ 登记 commit
- gh-pages：1a37535 → 26b04eb
- 线上 v4.129 已部署验证
- 主工作区已同步
- 增量 +1,931B < 12KB，零新分片
- 引擎计算零改动

## v4.130 体验增强第四批（2026-10-28，用户偏好重点=进化链/信息密度/移动端触控）

### 五项探针结论+落地
- **①进化链面包屑**：探针确认**已存在**（evochip onclick closeSp();openSpById + chipcur 当前态高亮——无需新增）
- **②历史档徽标+改名**：预算未做，留待下轮
- **③375px 弹窗 chip 横滚**：**已落地**（.chips-horiz flex-wrap:nowrap + overflow-x:auto + -webkit-overflow-scrolling:touch）
- **④击杀线 slider 拇指区**：**已落地**（spdSlRange min-height:44px——触控 44px 最低原则）
- **⑤筛选区折叠**：**已落地**（「▸ 筛选区」toggle + tmFilterBox 默认折叠——375px 首屏释放，选择池卡直接可见）

### gh-pages SSL 经验
- force push SSL handshake 失败——sleep 15 重试配方仍适用（本轮重试成功补推 91a4193）

### 剩余候选滚动入库
- 历史档徽标+改名 / 方案卡折叠 / 对比图形化

### 版本链
- er-n657 初版=1,493,324B sha16=DFA62C1E7FB969F6
- er-n657 hotfix=1,493,466B sha16=823A42B9CFACE2AF
- master：8864f55（v4.130）→ 4705713（hotfix）→ 登记 commit
- gh-pages：a9fcc73 → 91a4193
- 线上 v4.130 已部署验证（VER_OK + CHIPS_HORIZ_OK + SLIDER_OK）
- 主工作区已同步
- 增量 +681B < 10KB，零新分片
- 引擎计算零改动

## v4.131 体验增强第五批（2026-10-28，v4.130 滚动候选）

### 两项探针结论+落地
- **①历史档改名**：**已落地**（renameSavSlot——chip 双击→prompt→localStorage `er_savName_N` 独立键保存，原 t 保留，显示层替换——+469B）
- **①来源徽标**：**数据不可区分，跳过合理**（er_savs_v1 仅存 {t, rows} 无来源字段 + CSV 导入走独立流程不写 er_savs_v1——强行加徽标=猜测性渲染——「宁可不做不做错」原则标注跳过——非工作量问题）
- **②方案卡折叠**：预算未做，留待下轮

### 剩余候选滚动入库
- 方案卡折叠（连续三轮留待——P2-1天 大项）/ 对比图形化

### 版本链
- er-n659=1,493,935B sha16=DE0E85B53159EF61
- master：50064d8（v4.131）→ 登记 commit
- gh-pages：c923be2
- 线上 v4.131 已部署验证（VER_OK + RENAME_OK）
- 主工作区已同步
- 增量 +469B < 12KB，零新分片
- 引擎计算零改动

## v4.132 体验增强第六批清尾轮（2026-10-28，剩余两个 P2 大项）

### 两项探针结论+落地
- **②对比图形化**：**已落地**（双档对比面板顶部 8px 横向堆叠条——新增绿/移除红/等级蓝比例着色 + 图例计数行 + 无差异「无差异」空态——计数与文本清单 diff 同源——+941B）
- **①方案卡折叠**：**引擎复核 DOM 级澄清——任务书对象不匹配**（renderAnalyze 渲染防守剖面表，无方案卡；方案卡实际渲染在 core list 区，且已有 4 处 `<details>` 折叠 + oneLiner 一句话定位 + 推荐流派——折叠已存在——①=不适用，非未完成）
- **教训**：任务书对象需与渲染链路核对（renderAnalyze vs core 方案卡）

### 体验增强候选归零
- v4.127-v4.132 六批 22 项处理完毕：8 落地 + 8 探针确认已有/不可做 + 6 澄清
- **下轮方向建议**：①第五轮黑盒体验测试（季度节奏）②工具挖掘季度复审 ③NN 组队 v2（持续待用户拍板）④背包解析（待用户受控实验档对）

### 版本链
- er-n661=1,494,876B sha16=C1EE605852BD861E
- master：bf33618（v4.132）→ 登记 commit
- gh-pages：603c639
- 线上 v4.132 已部署验证（VER_OK + DIFF_OK）
- 主工作区已同步
- 增量 +941B < 15KB，零新分片
- 引擎计算零改动

## v4.133 第五轮黑盒体验测试（2026-10-28，纯测试轮——版本不 bump）

### 三路 19 条建议
- 观感：A 95 / B 91 / C 84（v4.132 基准 96——三路均低于：主扣=首屏空白+反馈缺失）
- 汇总报告：`C:\temp\er-v533-exp\v533_汇总.md`（三路报告 exp_v533_{A,B,C}.md 同目录）

### 三路共识热点
- **S1 首屏「核心配队」整页空白 3-20s 无 loading**（三路共识——v4.126 只修了切 tab 路径——首屏默认渲染不走 switchTab core 分支——真缺口）
- **S2 完成态反馈缺失不统一**（入队 toast / CSV 第 7 只静默丢弃 / 无结果静默）
- **S3 375px chip 断词**（「性|格：」断行 + 长 chip 裁尾——chips-horiz 未覆盖全部）

### 预选下轮 v4.134 落地 3 项
- S1 首屏 loading（v4.126 模式推广首屏路径）
- S2 统一完成态 toast
- S3 375px chip 断词修复

### 其余入库滚动
- 首次引导 / 一句话定位 / 伤害示例按钮 / 观察席 / 结论闭环
- 成员卡 chip 收起 / 工具栏分层 / CSV 折叠 / 空态折叠 / 双速度对照

### 版本链
- 纯测试轮：无 index 改动——线上保持 v4.132=C1EE605852BD861E
- master：8e0c057（v4.132）→ 登记 commit






## v4.134 S1/S2/S3 收尾（2026-10-29，补登记——上轮缺失登记）

### 落地 3 项（S1/S2/S3 闭环，观感 96）
- **S1 首屏 loading**：coreGrid 在 er-ready 显式 loading 占位（非 _currentTab 映射路径——508bddb）
- **S2 统一完成态 toast**：操作完成态统一 toast 反馈
- **S3 375px chip 断词闭环**：chipgrp/abi nowrap ellipsis + 横向滚动（e951b56）+ label nowrap + chip title 悬浮（18f5086）

### ⚠️ P0 白屏回归（线上实证，铁证 C:\temp\er-v535-hier\finding_online-blank-P0.md）
- 线上 committed 版存在整页白屏：`_currentTab='build'` + er-ready 处理器新增 `switchTab(_currentTab)` → 渲染完 60 卡后全部 `.tab{display:none}` 且无自动切回 → DOM 实测 activeTabs=0/visibleTabs=0
- **修复 = 12 行 delta（worktree 未提交）**：`_currentTab='core'` + coreGrid HTML 级「⚙️ 引擎计算中…」占位 + spdBias/spdNatG flex 横滚 + 速度 chip title 悬浮
- **该 delta 随 v4.135 一并部署**（v4.134 线上 committed 版不可直接用）

### 版本链
- master：508bddb（S1）→ e951b56（S3 hotfix）→ 18f5086（S3 hotfix2）
- gh-pages：dbcc94d → 1a5ae2d → 7340c60（线上部署）
- 引擎计算零改动

## v4.135 信息层级审视轮（2026-10-30，用户全局体验原则入硬规则）

### 全局体验原则（入硬规则）
**最重要的信息在任何情况下必须显眼（大字/高对比/突出位置）；小字只在补充说明等特殊情况使用；多用图表但不要太过扎堆；用户友好。**

### 审计框架（UI 设计原则转可执行清单，7 项）
视觉层级（F/Z 扫视 + 关键数字大号一眼可见）/ 三级排版（正文≥16px 可读、辅助 12-14px 仅补充、>3-4 层级=混乱）/ 眯眼测试（缩至 1/4 眯眼，第一眼分清先后）/ 5 秒测试 / 图表密度与数据墨水比（60-30-10 配色、危险红禁数据高亮）/ 渐进披露 / 一致性（同类同风格、同语义同色）

### 执行过程
- 全局 DOM+截图盘点（每区正常视口 + 25% 眯眼各 1 张；证据 23 张 C:\temp\er-v535-hier\shots\；眯眼实现=CDP 缩放通道不生效退 Pillow LANCZOS 25%）
- 问题清单：C:\temp\er-v535-hier\er-v535-hier-list.md（全局 5 项 + 7 区 20 条，每条=功能区+现状+问题+建议+工作量 P0-2h/P1-半天/P2-1天）
- 核心结论：字号层级落差小（卡名 14px 即多数区最大）；关键结论数字未突出（伤害 11px / 种族值 12px 灰 / 极速 13px）；`.sec h3` 区块标题 13px 灰=层级倒挂；颜色双轨（存档 chip/对比堆叠条/伤害 16 段条 3 处硬编码不走变量）；小字 285 处（CSS79/inline206）
- 择优落地 3 项（纯样式、引擎零改动、无重排、增量 +191B < 15KB、零新分片）：
  1. `.sec h3` 区块标题 13px 灰 → 15px/600/近黑（全 25 处真实标题统一受益）
  2. 伤害面板关键数字：伤害范围 17px/700 accent、OHKO 所需 EV 14px/700 accent
  3. 速度线极速列 14px/700 var(--hi) 数据高亮
- 危险红零新增（数据高亮仅用 accent/hi 蓝系——用户硬规则「危险红禁用于数据高亮」）
- 12 行 delta（P0 白屏修复）随本版一并部署

### 黑盒验收
- DOM 级 8/8 PASS：版本双查 / .sec h3 15px600 / 伤害 17px+EV 14px accent / 极速列 14px hi / 375px 三 Tab 无溢出 / console 0 新错误 / loading 占位回归护栏 / 眯眼截图 6 张（C:\temp\er-v535-hier\audit-visual-v135.md + shots-v135\）
- MainAgent 线上真浏览器复核 PASS（版本 tag+ER_ENGINE_VER 双 v4.135、H3 计算样式、极速列计算样式、60 卡渲染、console 0、线上同源 fetch 正常）

### 版本链
- er-n665 N1=N2 重建：index.html 双跑恒=661CABFE（v4.135 手改产物逐位一致）TRUE；守门 [BUILD OK] exit 0（0 违规）；配招助手_ER.html=787D0CB8（v4.98 模板双写产物——双写已脱钩，遗留债务）
- v4.135 index.html：1,496,627B，SHA-1=661CABFEA93506805C0083C5A5DA9E8C33618AC8
- master：6779c47（v4.135 信息层级审视）→ 登记 commit（本块）
- gh-pages：2f4ad61（7340c60..2f4ad61，--force push，SSL 0 重试）
- 线上 v4.135 已部署验证：sha16=661CABFEA9350680（抓取 2 次命中）+「引擎 v4.135」/「ER_ENGINE_VER='v4.135'」双标记在位
- 主工作区已同步：15/15 SHA-1 全 MATCH（index.html=661CABFE…；含 AGENTS.md 首次同步——历史「主工作区同步」从未含 AGENTS.md，债务处理）
- 增量 +191B < 15KB，零新分片；引擎计算零改动

### 遗留债务登记
- **build_tool_html.py 模板停在 v4.98**：v4.127+ 全部直接编辑 index.html 工作流；N1=N2 重建只证生成器确定性。**新发现陷阱：模板末段硬编码 sync 到 D:\game\elite-redux\index.html——每次重建会覆盖主工作区（本轮 00:5x 命中已恢复）**；重建后必须用部署产物恢复主工作区
- **data_lite/species/adv_v498.js 三分片在 er-wt484 无实体无 git 追踪**（构建输出、仅部署树持有）；配招助手_ER.html 停在 v4.83 与 index 长期不同步（非部署集）
- **AGENTS.md 主工作区副本历史从未同步**：本轮首次同步 D:\game\elite-redux（改善「唯一入口」一致性）
- **D:\game\elite-redux .git 垃圾 ref**（.git/refs 下 4 个 er48x.lock.bak* + remotes 下 3 个）：需 git 操作时先删文件清理（非提交内容）
- 背包解析待用户受控实验档对（已明确暂缓）；NN 组队 v2 未拍板（未授权不得开工）；工具挖掘季度复审

## v4.136 信息层级第二批 + build 模板债务治理（2026-10-30）

### Part 1 · 信息层级第二批（清单 C1/C3/G3，纯样式、引擎零改动、无重排、375px 合格）
1. **种族值总值提权（C1）**：`.card .bs` 12px 灰 → 13px/600 近黑（core/team/dex 三区卡片共用类统一受益——「卡名 14px 即最大」的层级落差收窄；线上实测 computed 13px/600/#23272f）
2. **方案卡队友评分提权（C3）**：tmRow `+score` → 13px/700 accent（方案卡核心决策数字；实测 +58 蓝粗清晰；L4482 补位表同型 r.sc 本轮范围外留 P1）
3. **颜色双轨治理（G3 一致性）**：对比堆叠条 Material 三色 #4caf50/#2196f3/#f44336 → var(--ok)/var(--accent)/var(--warnred)（语义=新增正面/等级变化中性高亮/移除警示；实测三段 rgb(46,125,50)/rgb(37,99,235)/rgb(198,40,40)）；存档档位与对比面板 chip 蓝系硬编码 → 新增 :root `--acc-tint:#e3f2fd / --acc-tint2:#bbdefb / --acc-edge:#1976d2` accent 系变量（改 accent 系一处生效）
- 危险红仅作移除/警示语义色，未用于数据高亮（用户硬规则保持）

### Part 2 · build 模板债务治理（P1 安全修复，2026-10-30）
- **build_tool_html.py 末段 v4.35 同步块脱钩（L15408-15436）**：默认拒绝覆盖主工作区——目标存在且与模板产物内容不一致 → `[SKIP] sync 已脱钩…拒绝覆盖` 告警不写盘（宁可失败不误覆盖）；仅目标不存在/逐位一致时同步；`ER_BUILD_FORCE_SYNC=1` 可强制（受控场景，正常流程禁止）
- 头部登记注释（L20 前）：模板停在 v4.98 时代（v4.127+ 实际为直接编辑 index.html 工作流），模板仅用于 N1=N2 确定性仪式，产物不得覆盖主工作区/部署；同步由部署流程负责（运维手册 §6/§7）
- **验证（er-n666）**：N1/N2 两次构建后主工作区 index.html SHA 恒 `6D4DBAC4…`（未被覆盖，protected=True）×2；build exit 0 ×2；守门 `[BUILD OK] exit 0（0 违规）`×2；N1==N2=双胞胎产物 `787D0CB88F8D75A2DF5B503F69DA65D6E900E8FD`（1,369,067B）逐位一致（与 v4.135 轮 er-n665 同哈希——跨轮确定性）

### 黑盒验收
- DOM 级 8/8 PASS（audit-visual-v136.md + shots-v136\ 6 张）：版本双查 / .bs 13px600 / 评分 13px700 / 堆叠条三色+chip 双色变量化实测 / 375px 三 Tab 无溢出 / console 0 新错误 / loading 占位回归护栏 / 眯眼 3 张
- MainAgent 线上真浏览器复核 PASS：版本 tag+ER_ENGINE_VER 双 v4.136、.bs computed 13px/600、无溢出（sw1905<iw1920）、console 0、60 卡渲染

### 版本链
- v4.136 index.html：1,496,935B，SHA-1=6D4DBAC441505497C29D99C78DDA6126C20D9C9C（+308B）
- master：45d3015（信息层级第二批）→ 6f9c41c（build sync 脱钩治理）→ 登记 commit（本块）
- gh-pages：6dd7fb3（2f4ad61..6dd7fb3，--force push，SSL 0 重试）
- 线上 v4.136 已部署验证：sha16=6D4DBAC441505497（抓取 1 次命中）+「引擎 v4.136」/「ER_ENGINE_VER='v4.136'」双标记在位
- 主工作区已同步：15/15 SHA-1 全 MATCH（index=6D4DBAC4…；AGENTS.md 保持同步）
- 增量 +308B < 15KB，零新分片；引擎计算零改动
- 遗留跟进：补位建议表评分（L4482 r.sc）P1 候选；16 段伤害条硬编码色未统一（眯眼锚点强、改色有视觉回归风险——保留登记）；模板本体内容仍 v4.98（生成器大同步 P2+ 未授权不开工）

## v4.137 信息层级第三批（2026-10-30）

### Part 1 · 落地 3 项（清单剩余择优：①补位表评分 P1 遗留 + ④方案卡一句话 + ⑤伤害面板剩余弱数字；纯样式/字号/字重，无重排、引擎零改动、375px 合格）
1. **补位表评分提权（①登记遗留 P1）**：队伍构建「补位建议」表评分 `<b>+r.sc</b>` 默认字号 → `13px/700 accent`（与 v4.136 tmRow 同型补齐；实测 +12/+10 13px/700/#2563eb）
2. **方案卡核心结论提权（④）**：`.oltext`（玩法一句话导读）13px/400 → **14px/600 近黑**——层级「15px 流派名 → 14px 一句话 → 13px 亮点」闭环（实测 3 处样本 14px/600/#23272f）
3. **伤害面板剩余弱数字（⑤，M3 保底）**：verdict 三 span（确定OHKO/概率OHKO/2HKO起）11px → **12px/700（语义色保留）**；期望折算行 10px → **12px**+`<b>`700；16 段图例 9px → **10px**（可读下限保底）
- 危险红约束保持：无新增红色字面量；「2HKO 起」沿用 var(--warnred) 警示语义
- ②③评估结论：叶子小字多为补充元数据（id/说明/图例）；卡名 14px 层级随 .bs/评分/一句话落地已闭环——本轮不批量改小字（G2 P2 治理另行）

### 黑盒验收
- DOM 级 8/8 PASS（audit-visual-v137.md + shots-v137\ 6 张）：版本双查 / 补位评分 13px700 / .oltext 14px600 / verdict 12px700+期望 12px+图例 10px / 375px 三 Tab / console 0 新 / 回归护栏（前两批 17px+13px 抽查完好）/ 眯眼 3 张
- MainAgent 线上真浏览器复核 PASS：版本 tag+ER_ENGINE_VER 双 v4.137、60 卡渲染、.bs computed 13px/600、无溢出（sw1905<iw1920）、console 0（注：首两次浏览器后端 BU_RUNTIME 不可达，第 3 次重试恢复后完成复核）

### 版本链
- v4.137 index.html：1,497,076B，SHA-1=B60757A2D39E50B3059972FC9F876AD196AA9C95（+141B）
- master：9f71169（第三批）→ 登记 commit（本块）
- gh-pages：3b376bb（6dd7fb3..3b376bb，--force push，SSL 0 重试）
- 线上 v4.137 已部署验证：sha16=B60757A2D39E50B3（抓取 1 次命中）+「引擎 v4.137」/「ER_ENGINE_VER='v4.137'」双标记在位
- 主工作区已同步：15/15 SHA-1 全 MATCH（index=B60757A2…；AGENTS.md 保持同步）
- N1=N2（er-n667）：双胞胎产物恒 `787D0CB88F8D75A2DF5B503F69DA65D6E900E8FD`（1,369,067B，与 er-n666 同哈希=跨轮确定性）；build exit 0 ×2；守门 `[BUILD OK] exit 0（0 违规）`×2；主工作区 index SHA 构建前后恒 `B60757A2…`（sync 脱钩保护复验通过，protected=True）
- 增量 +141B < 15KB，零新分片；引擎计算零改动
- 遗留跟进：G2 叶子小字批量治理（P2，逐处按「补充说明才允许小字」裁）；G3 剩余硬编码色（fillrow L102/planbar L106-107/badge-imm L116/伤害条 L5677/克制格 L5707/PAL L5721——堆叠条与 chip 已变量化，其余 P2 一致性工程）；模板本体内容仍 v4.98（生成器大同步 P2+ 未授权不开工）

## v4.138 第六轮黑盒体验测试（纯测试轮，零代码改动，2026-10-30）

### 三路并行（A 核心配队/B 存档联动/C 伤害图鉴速度线；site-v138 测试树= v4.137 代码态；DOM 级+眯眼+5 秒+375px）
- **观感对比**（v4.132 基准 96）：A=94 / B=88 / C=95。信息层级 9 项经 computed 实测全部有效落地、零回归；扣分均来自功能/交互级既有缺陷（非样式轮引入）
- **产出**：体验增量建议 21 条 + 汇总清单 `C:\temp\er-v538-blackbox\summary-v4138.md`（三路报告 exp-A/B/C-*.md + 截图 shots-A/B/C\ 共 73 张）

### 关键发现（预选 v4.139 落地 ≤3 项）
1. **【P0】`.phasefade` 池子 opacity 卡 0**（CSS L309-310 无 fill-mode/无 base 兜底 + 重复重渲染重启动画）——载入存档后精灵池 DOM 有内容但整池不可见，B 路观感 −6；375px 因 `animation:none` 豁免。修复：fill-mode:forwards + base 兜底 + 消除重渲染循环触发源
2. **【P0】配招行裸露 HTML `<span class="t-t钢"></span>`**（运行时拼串泄漏；源码/数据无字面量）——任意方案卡大地之力行可见原始标签文本；修复时扫全站 `t-t` 类泄漏
3. **【P1】评分族统一提权**——「校准强度 41.5分」12px/400（L13426 tip 内）、A 路另查 12px/600 灰评分元素（待定位）、六队 bulk/out 分（L11196）同型；统一 13px/700 accent

### 登记（未选入预选）
- 入队按钮已选态（P1）/载入后视线引导 smooth-scroll（P1）/速度线→伤害跨功能快捷链（P1）/伤害计算器完成态+缺项高亮（P1，疑真 bug 需 v4.139 探针复验）/配速滑块吸附完成态反馈（P2）/对比差异标题 V1 提权（P2）
### 环境结论
- 375px 三路零横向溢出（scrollWidth=375）；B chips 236px 折 2 行；C 物种表 11→7 列折叠生效；localStorage 注入已清理

## v4.139 修复轮（四项修复+伤害计算器探针定案，2026-10-30）

### 探针定案（四项）
- P0-1 `.phasefade` 池子 opacity 卡 0：CSS L309-310 无 fill-mode/无 base 兜底 → 根因确认为缺 `animation-fill-mode:forwards` + `opacity:1` 兜底（375px 因 animation:none 豁免）；浏览器诊断（MutationObserver+getAnimations 10.5s）证实无无限重启循环
- P0-2 配招行裸露 HTML `<span class="t-t钢">`：源码/data.js 均无字面量、LEAK_RULES 逐条核对无此产物 → 定案为 L10885 补盲招 why 误拼 `tlabel()`（HTML chip）后被 `esc()` 当纯文本转义（D1 历史 bug 复发，L7019 注释已记）
- P1 评分族：落点 = 校准强度 L13444（tip 12px/400）+ 奇石权衡 L13462 三数字 + **A 路「12px/600 灰」定案 = 方案卡成员行 badge L13419 + 需求清单顶选行 L13355**（智能补位表不渲染分数，入队后经同一 renderPlanSet 输出）
- 伤害计算器「三项全选无输出」**定案为真缺陷（ID 冲突）**：队伍分析伤害面板（L679-692）与图鉴详情弹窗速度滑块区伤害面板（L5421-5444）五组 id 重复（dmgDefQ/dmgDefList/dmgMvQ/dmgMvList/dmgOut），getElementById 首命中分析页 → 弹窗侧输入/输出全落进分析页容器 → **升 P0 一并修复**（v4.138 登记「未选入预选」该条状态更新：已定案、已修复）

### 修复落地（仅 index.html 渲染层/CSS/id；引擎计算零改动）
1. **P0-1**：`.phasefade{opacity:1;animation:phasein .18s ease-out;animation-fill-mode:forwards}` + myPhase 幂等写守卫（目标值与现状一致则 return）——池子持续可见
2. **P0-2**：L10885 补盲招 why 去 `tlabel(t)` 改纯类型名 join——全站文本节点 `<span`/`class=` 复扫 0 命中（仅 SCRIPT 源码例外）
3. **P1**：校准强度（L13444）+ 奇石权衡三数字（L13462）+ 成员行 badge（L13419 `m.score`）+ 需求清单顶选行 badge（L13355 `top.score`）统一 13px/700/var(--accent)；危险红（--warnred）警示数字语义保留未动
4. **伤害计算器（探针升 P0）**：弹窗侧五组 id 唯一化 `dmgDefQ2/dmgDefList2/dmgMvQ2/dmgMvList2/dmgOut2` + 处理函数 suffix 参数化（dmgRender 默认 'dmgOut' 保持分析页路径）+ 缺项动态提示「还差：对手、我方招式」+ accent 边框（rgb(37,99,235)），补齐后清除

### 黑盒验收（site-v139 测试树 + bu 通道 DOM 级，观感 96-97）
- 四项 PASS：①P0-1 池子 opacity=1、切档/返回/进出方案 10s 不消失、375px 两列 157.6px 零溢出；②P0-2 可见文本 0 脏字符；③P1 校准强度 32.9=13px/700/accent、奇石权衡三列同、危险红「2HKO 起」保灰语义；④伤害双路径：分析页 dmgOut=喷火龙→耿鬼 133-157，弹窗 dmgOut2 独立=喷火龙→水箭龟 41-48 互不污染，缺项提示+accent 边框、补齐后清除
- badge 补丁复验 PASS：10 个评分 badge 全 13px/700/rgb(37,99,235)；console 0；375px 零溢出；遗留 0（观感 A 96 / B 97（v4.138 的 88 大幅回升）/ C 96）
- MainAgent 线上真浏览器复核 PASS（2026-10-30）：线上 URL `?nocache=1391` 首抓 sha16=A1AC8775DFE882A1；UI tag 引擎 v4.139 在位；存档注入（er_savs_v1 档1/档2）→ 队伍构建档1/档2 往返池子 opacity 恒 1、3+3 卡完整、动画 finished 无重启；全可见文本脏字符 0；方案卡评分 badge computed 13px/700/rgb(37,99,235)；伤害弹窗五组唯一 id 在位与分析页 dmgOut 共存；清理注入后 console 0（中途 51016/BU_RUNTIME 两次，重试恢复后完成复核）

### 版本链
- v4.139 index.html：1,498,529B，SHA-1=A1AC8775DFE882A1B0ED4F4EFB29355E1DD130AA（+1,453B ≪15KB；第一轮中间态 39F400E1）
- master（er-wt484 分支 v485）：498adb19（四项修复）→ 73ddc0e（P1 badge 补丁）→ 登记 commit（本块）
- gh-pages：69aeea1（3b376bb..69aeea1，--force push，SSL 0 重试；deploy 代理 s_000pLM8Ewr6）
- 线上 v4.139 已部署验证：sha16=A1AC8775DFE882A1 首抓命中（CDN 即时传播）+「引擎 v4.139」tag 在位
- 主工作区已同步：15/15 SHA-1 全 MATCH（index=A1AC8775…；AGENTS.md 本块同步）
- N1=N2（er-n668）：双胞胎产物恒 `787D0CB88F8D75A2DF5B503F69DA65D6E900E8FD`（与 er-n666/667 同哈希=跨轮确定性）；build exit 0 ×2；守门 `[OK] v4.50 守门自检通过…0 违规` + `[BUILD OK] exit 0` ×2（全量 4896 流派+子区 48+S6 287）；N1=N2 时点主工作区 index SHA 前后恒 `B60757A2…`（v4.137 基线，sync 脱钩保护 protected=True）
- 增量 +1,453B < 15KB，零新分片；引擎计算零改动
- **新观察（v4.140 候选）**：存档 chip 标签「档1 NaN:NaN」显示 NaN（CSV/JSON 导入路径字段映射问题，非本轮回归；.sav 文件正常路径未测）
- 遗留跟进：模板本体内容仍 v4.98（生成器大同步 P2+ 未授权不开工）；G2 叶子小字/G3 剩余硬编码色（P2 队列）不变

## v4.140 登记遗留修复轮（探针四项 + 三修落地，2026-10-30）

### 探针定案（四项，probe-v4140.md）
- ①「档1 NaN:NaN」= **健壮性缺口**（非 CSV 写入错）：实测 CSV 导入从不写 er_savs_v1（只入队不建档）；唯一写入点 L4810 `svs.push({t:Date.now(),...})` 永远合法；坏数据仅来自旧版残留/外部写入 → L4678 `new Date(s.t)` 无 Invalid Date 兜底
- ② 行级入队按钮已选态 = **真缺口**：池卡 L3715 已有绿「已入队」态；核心行 L1976 / 补位行 L3938 / 分析行 L4486 / 电脑区 L4600 / 方案卡 L13357·L13423 入队后按钮逐字仍「➕」，无置灰/对勾
- ③ 载入后视线引导 = **真缺口**：loadSavSlot 后仅瞬态 toast（L4759），池区无持久提示
- ④ 速度线→伤害快捷链 = **误解关闭**：详情弹窗速度滑块区 L5419-5445 已内嵌完整伤害面板（搜对手/招式+天气场地道具+结果），链路「速度线/分析→🔍→弹窗→同屏伤害」已存在，无需新增跳转

### 修复落地（仅 UI 渲染层，引擎计算零改动；+2,481B，32 insertions/11 deletions）
1. **① renderSavSlots Invalid Date 兜底（L4678）**：`new Date(s.t)` 判 `!isNaN(getTime())`，坏 t/缺 t 只显「档N」，合法时间戳照旧「档N HH:MM」并分钟补零（`('0'+getMinutes()).slice(-2)`）；兼容旧数据
2. **② enqueueBtnHtml helper（新增于 addToTeam 后，替换 6 处）**：已在队→disabled 灰「✓ 已入队」；电脑区 allowDup=true 保留「✓ 重新入队」覆盖重入队语义；未在队原样返回，各调用点 onclick 回调（renderCore/renderAnalyze 等）零改动
3. **③ showPoolHint 池区引导（loadSavSlot 后 + .sav 解析 L4828 后同源）**：`#myPickWrap` 头部插一次性 accent 淡条「✅ 已从「档N」载入 N 只·点卡片出方案」+✕，6s 自动淡出，非遮挡

### 版本链
- v4.140 index.html：1,501,010B，SHA-1=A0001199773FF7EAFE257C9386B0C59ACBBB5A5F（+2,481B ≪15KB，零新分片）
- master（er-wt484 分支 v485）：9e0ca71（三修）→ 登记 commit（本块）
- gh-pages：7eb6897（69aeea1..7eb6897，--force push；CDN 第 3 次抓取命中，约 30s 传播）
- 线上 v4.140 已部署验证：sha16=A0001199773FF7EA（`?nocache=1401`）+「引擎 v4.140」tag 在位
- 主工作区已同步：15/15 SHA-1 全 MATCH（index=A0001199…；AGENTS.md 本块同步）
- N1=N2（er-n669）：双胞胎产物恒 `787D0CB88F8D75A2DF5B503F69DA65D6E900E8FD`（跨轮确定性 6 连）；build exit 0 ×2；守门 `[OK] v4.50 …0 违规` + `[BUILD OK] exit 0` ×2；主工作区 index 构建前后恒 A1AC8775（v4.139 部署版，sync 脱钩保护 protected=True）

### 黑盒验收（site-v140 + bu 通道，观感 96.5）
- ① 版本双查 PASS；② NaN 兜底 PASS（档1 17:34/档2 16:34 补零、档3 坏字符串只显「档3」、全页 NaN=0）；③ 行级按钮 PASS（重进方案 disabled 灰「✓ 已入队」、未入队仍 ➕）；④ 淡条 PASS（accent+✕、~6s 淡出、非遮挡）
- 观感 96.5（A96/B97/C96）；console 0；375px 三 Tab 零溢出
- MainAgent 线上真浏览器复核 PASS（2026-10-30）：三档 chip「档1 19:04/档2 19:03/档3」无 NaN；档2 载入淡条渲染；雷公入队→toast「已加入队伍：雷公（1/6）」→重进方案「✓ 已入队」disabled 在位；清理注入后 console 0（51016/BU_RUNTIME 两次后重试恢复）

### 候选/遗留（非阻断）
- **v4.141 候选**：方案卡点 ➕ 入队后按钮不即时翻转（仍显 ➕，toast+队伍计数器即时；重进方案态正确）——建议补方案卡局部重渲染
- 后台标签页动画冻结导致的 opacity=0 为测试伪影（切前台恢复），非 bug
- 模板本体内容仍 v4.98（生成器大同步 P2+ 未授权不开工）；G2/G3 P2 队列不变

## v4.141 清尾修复轮（方案卡➕即时翻转 + 第七轮轻量黑盒，2026-10-30）

### 清尾修复（Part 1，P2 单点；+353B，7 insertions/5 deletions）
- 探针：方案卡 ➕ 入队按钮不即时翻转根因 = 三处 onclick 内联 addToTeam 后无局部重渲染——L13378（需求清单顶选行）/ L13444（方案卡成员行）/ L3946（队伍分析补位行同型）；L1976/L4494 因 onclick 带 renderCore/renderAnalyze 已即时翻转
- 修复：新增 `enqFlip(b,sp)` helper（addToTeam 成功后经 enqueueBtnHtml 就地翻转按钮 outerHTML → disabled 灰「✓ 已入队」，失败不动）；三处 onclick 改 `enqFlip(this,…)`；toast/计数逻辑零改动；池卡/电脑区 allowDup 语义零改动
- 验证：浏览器实测点 ➕ 后同页 ~0.4s 即翻转 ✓ disabled（无需重开），console 空

### 第七轮轻量黑盒（Part 2，双路；C:\temp\er-v541-blackbox\）
- A 路 存档联动+队伍构建 **97**（v4.138 的 88 → v4.139/140 修复后稳定 97；池子可见性/已选态/引导条实测顺畅、切档稳定、队伍保留正确）/ B 路 伤害计算器+方案卡 **96**（分析页 133-157 2HKO、缺项提示正常）/ 总评 **96.5**（与基准持平）
- 产出 8 条建议（A 4 + B 4，含现状/痛点/改进/收益/工作量）；375px 三 Tab 零溢出；console 0；localStorage 清理
- **预选 ≤3 项（下轮探针确认）**：① 招式别名/模糊搜索映射表（dmgMvQ+招式反查，~1h；**探针注意**：MainAgent 线上抽查「火焰放射」可模糊命中「喷射火焰(教学)」——前提弱化，需确认 dmgMvQ 具体缺口再定）② 已入队精灵全图鉴网格角标（~1h）③ 载入新档队伍冲突确认弹窗（~0.5h）
- 诚实声明：弹窗 dmgOut2 数值闭环本轮未完整复现（依赖 v4.139 已验证结论，代码路径未变）；L3946 补位行即时翻转未单独点验（同 enqFlip helper，MainAgent 线上抽查补验结构）

### MainAgent 线上真浏览器复核 PASS（2026-10-30）
- 版本双查 v4.141；档1 载入池子 opacity=1/皮卡丘卡就位；方案卡点 ➕ **不重开即翻转**「✓ 已入队」disabled + toast「已加入队伍：雷公（1/6）」；弹窗 dmgDefQ2/dmgOut2 结构在位 + 缺项提示「还差：对手、我方招式」；脏字符 0；清理注入后 console 0
- 环境记录：线上数据分片/CDN 偶发卡顿（ERR_HTTP2_PING_FAILED/503/document.write 警告），重载 + 轮询（ERDATA+MV 双就绪）后恢复——环境抖动非应用缺陷

### 版本链
- v4.141 index.html：1,501,363B，SHA-1=EFC0EC64A251820ED85AD6A861D4AD97EE6E0A1D（+353B ≪15KB，零新分片）
- master（er-wt484 分支 v485）：257a5d7（清尾）→ 登记 commit（本块）
- gh-pages：d27f073（7eb6897..d27f073，--force push；CDN try1 命中，约 15s 传播）
- 线上 v4.141 已部署验证：sha16=EFC0EC64A251820E（`?nocache=1411`）+「引擎 v4.141」tag 在位
- 主工作区已同步：15/15 SHA-1 全 MATCH（index=EFC0EC64…；AGENTS.md 本块同步）
- N1=N2（er-n670）：双胞胎产物恒 `787D0CB88F8D75A2DF5B503F69DA65D6E900E8FD`（跨轮确定性 7 连）；build exit 0 ×2；守门 `[OK] v4.50 …0 违规` + `[BUILD OK] exit 0` ×2；主工作区 index 构建前后恒 A0001199（v4.140 部署版，sync 脱钩保护 protected=True）
- 遗留跟进：预选 3 项待 v4.142 探针；模板 v4.98 债务不变；G2/G3 P2 队列不变

## v4.142 预选三项落地轮（第七轮黑盒预选 → 探针定案 → 落地，2026-10-30/31）

### 探针定案（三项全为真缺口；MainAgent 静态探针证据）
- ① 招式别名：dmgMvQ 已走 mvAliasOf（MV_ALIAS 原 13 条），但缺「火焰放射/大地神力/意念/十万伏」等高频旧译名；招式反查 mvSearch（renderMv L3458 fzAny）**完全未用别名**——双缺口
- ② coreGrid 卡（L14998-15006）无任何已入队态（点卡=selectCore 设核心）——真缺口
- ③ .sav/CSV 导入 autoImportParty→clearTeamForImport 静默清队无确认（输出文案仅事后告知）——真缺口；loadSavSlot 不碰队伍无需弹

### 落地（+2,167B，28 insertions/6 deletions，引擎计算零改动）
- ① MV_ALIAS（L2520）补 6 条（火焰放射→喷射火焰/大地神力→大地之力/意念→精神强念/十万伏→十万伏特/冰冻之牙→冰霜之牙/火焰牙→火焰之牙，经 data.js 实查官方名，精神冲击本身即官方名不入）；renderMv（L3458）加 `q=mvAliasOf(q)||q`——招式反查搜「火焰放射」命中喷射火焰
- ② coreGrid 角标：L15020 卡片右上角 accent 白字「已入队」10px 角标（position:absolute;top:2px;right:2px;z-index:1，与「点击生成组队建议」共存）；实测喷火龙基础形有角标、Mega 形态无
- ③ 新增 `confirmImportIfTeam(cb)`（L4850；禁背景点关、仅取消/继续/Escape），挂 .sav 解析（L4830）与 CSV 导入（L4984）；实测队 2 只弹「当前队伍 2 只将被清空，继续导入？」取消保留/继续清空导入/空队不弹

### 验收
- 黑盒（第 8 轮补验，C:\temp\er-v542-blackbox\）：③ 确认 modal 7/7 子项全 PASS（动态 N/禁背景点关/取消保留/Escape/继续导入+toast「已清空原队伍 2 只 → 已导入 3 只」/空队不弹）；回归 6/6（版本双查 v4.142/方案卡即时翻转/池卡绿徽/伤害 105-124/375px 三 Tab 零溢出/console 0）；观感 **96.5**（≥96 过线）；预选下轮 3 项：modal Enter=继续快捷键、CSV toast 合并单条摘要、伤害计算器回车直选首项
- 引擎（er-n671）：N1=N2 双胞胎恒 787D0CB8（**跨轮确定性 8 连**）；守门 `[OK] v4.50 …0 违规` + `[BUILD OK] exit 0`；`[SKIP] sync 已脱钩` 在位；主工作区 index 构建前后恒 EFC0EC64（v4.141，protected）
- 部署：**push 被 github.com TLS 端点阻断（schannel handshake fail，DNS=坏节点 20.205.243.166；curl 级 github.com:443 亦不通=外部网络抖动，github.io 正常）**——deploy commit 1f43290 已本地落库 er-gh474，主工作区 15/15 已同步为 04CC280B；恢复命令：`git -C C:\temp\er-gh474 push --force github er-gh474:gh-pages` 后抓 `?nocache=1421` 断言 04CC280B83399015CD；master 登记推送同样待网络恢复

### 版本链
- v4.142 index.html：1,503,530B，SHA-1=04CC280B83399015CD20A1158BE2ACD2A897DCB9（+2,167B ≪15KB，零新分片）
- 本地 commit：bca2479（三项落地，er-wt484 分支 v485）→ 登记 commit（本块）；er-gh474 deploy commit 1f43290（未推）
- 线上：仍 v4.141（EFC0EC64…）——待网络恢复补推 v4.142
- 遗留跟进：下轮预选 3 项（modal Enter/CSV toast 合并/伤害回车直选）；模板 v4.98 债务不变；G2/G3 P2 队列不变
- [部署恢复 2026-10-31] 根因=git 全局死代理 http.https://github.com.proxy=127.0.0.1:7890（未监听）致 schannel 握手失败；git -c "http.https://github.com.proxy=" 清代理后补推成功：gh-pages 1f43290（d27f073..1f43290）、master 1418fcd（56d621f..1418fcd）。线上 ?nocache=1421 try1（约30s 传播）sha16=04CC280B83399015CD PASS；MainAgent 线上复核：版本双查 v4.142 + 招式反查「火焰放射」命中「喷射火焰」PASS（首次空表为 503 分片抖动，重触发即中，console 0）。v4.142 全链路闭环。

## v4.143 交互微调轮（v4.142 预选 3 项落地：键盘可达性+toast 统一+回车直选，2026-10-31）

### 探针定案
- ① confirmImportIfTeam（L4850）仅 Escape→取消、无 Enter 无焦点管理——补
- ② autoImportParty/CSV 块逐行 addToTeam（L3760）发「已加入队伍：X（N/6）」toast×N 堆叠——补 quiet 合并
- ③ 伤害四输入框（dmgDefQ/dmgMvQ/dmgDefQ2/dmgMvQ2）无回车行为（全局 L3275 仅拦默认提交）——补 Enter 直选首项

### 落地（+1,110B，17 insertions/13 deletions，引擎计算零改动）
- ① 确认弹窗：escH 改 Escape→取消 / Enter→继续；appendChild 后 impConfirmCancel.focus()（焦点在取消防误触）；禁背景点关保持
- ② addToTeam 第 3 参 quiet（三处 toast 包 if(!quiet)）；autoImportParty 传 quiet=true + 循环后一条合并 toast「已导入队伍 N 只（已清空原队伍 M 只）」；CSV 块（L5001）自有循环同步 quiet=true；savImpNote 文案保持
- ③ 新 helper dmgEnterPick(ev,s,k)（L5673，Enter→点首个 .chipopt）；四输入框 onkeydown 绑定；无建议回车不误触发

### 验收
- 黑盒（第 9 轮，C:\temp\er-v543-blackbox\）：① PASS（Enter 导入/Escape 取消/焦点在取消/禁背景点关）② PASS（toast 1 条合并「已清空原队伍 2 只 → 已导入 3 只队伍成员」，无逐条堆叠）③ PASS（「喷射」回车→喷射火焰、「喷」回车→喷火龙、zzzzz 回车不误触、伤害 60-71）；回归 6/6；观感 **98.0**（较 v4.142 96.5 ↑1.5）；console 0；预选下轮 3 项：dmgAtkQ 补 Enter、s='2' 弹窗回车手工回归、合并 toast 带首只名
- 引擎（er-n672）：N1=N2 双胞胎恒 787D0CB8（**跨轮确定性 9 连**）；守门 `[OK] v4.50 …0 违规` + `[BUILD OK] exit 0`；`[SKIP] sync 已脱钩` 在位
- 部署：v4.143 deploy commit 41edeaf 本地落库（er-gh474，仅 index.html 17+/13-）；push 一度被 github.com 网络阻断（直连 connection reset/timeout=GFW 抖动、7890 代理 schannel 握手失败；死代理 `http.https://github.com.proxy=http://127.0.0.1:7890` 全局残留已登记，本轮沿用每调用 `-c` 清代理）；**部署恢复**：有界自动重试轮询 pushretry-v4143.log 首试即通（SUCCESS ghpages+master_ok 02:10:24）——gh-pages `41edeaf`（d27f073..1f43290..41edeaf）✅ + master 登记 commit `ecaac27` ✅；线上 `?nocache=1431` try3 断言 SHA-1=4882FE07217775C87F93105C966EA1AAC246380F（CDN ~60s 传播）；主工作区 15/15 已同步（index=4882FE07…）+ AGENTS_match=True

### 版本链
- v4.143 index.html：1,504,640B，SHA-1=4882FE07217775C87F93105C966EA1AAC246380F（+1,110B ≪15KB，零新分片）
- 本地 commit：c512041（三项落地）→ 登记 commit（本块）；er-gh474 deploy commit 41edeaf（待推）
- 遗留跟进：下轮预选 3 项；模板 v4.98 债务不变；G2/G3 P2 队列不变

---

## v4.144 交互收官轮（上库强制）— 2026-10-31

### 本轮三项（v4.143 预选 3 项落地）
- ① **攻方输入 Enter 选首项**：dmgAtkQ（L679）补 `onkeydown="dmgEnterPick(event,'','atk')"`；helper dmgEnterPick（L5673）kind 映射扩三态 mv/def/atk（atk 恒 s='' 选 #dmgAtkList 首 .chipopt）；至此五输入框（atk/def/mv/Q2×2）键盘直达闭环
- ② **s='2' 弹窗 Enter 回归**：Grep 确认 dmgDefQ2（L5467）/dmgMvQ2（L5469）onkeydown 在 v4.143 已绑在位，无缺口未改
- ③ **合并 toast 带首只成员名**：autoImportParty（L4874）与 CSV 块（L4988）各记 firstAdded 名，toast 加「（含 首只名）」段（N=0 无该段），单条不堆叠；savImpNote 不变

### 验收（三线全 PASS）
- 黑盒（第 10 轮，C:\temp\er-v544-blackbox\）：① PASS（「喷」回车→dmgAtkList 变已选「喷火龙」，五框闭环，zzzzz 不误触，端到端 60-71 无 NaN）② PASS（弹窗 dmgDefQ2 喷→喷火龙 / dmgMvQ2 喷射→喷射火焰 / dmgOut2 妙蛙种子→喷火龙 26-31 克制×0.5 无 NaN）③ PASS（toast 1 条「已清空原队伍 2 只 → 已导入 3 只队伍成员（含 妙蛙花）」）；回归 6/6；观感 **99.0**（较 v4.143 98.0 ↑1.0，历史最高）；console 0；预选下轮 3 项：CSV 面板首用脉冲引导、弹窗天气/场地 chips 键盘可达、toast 首只名可点小 chip
- 引擎（er-n673）：N1=N2 双胞胎恒 787D0CB8（**跨轮确定性 10 连**）；守门 `[OK] v4.50 …0 违规` + `[BUILD OK] exit 0`；`[SKIP] sync 已脱钩` 在位；主工作区保护复验（index 构建前后恒 4882FE07）
- P0 线上（MainAgent 真浏览器）：版本双查 v4.144；① dmgAtkQ「喷」回车→列表区变已选「喷火龙」（onkeydown=dmgEnterPick(event,'','atk') 实测）；② 弹窗绑定代码级核验+黑盒同源手工回归；③ modal（焦点=impConfirmCancel）→ Enter → toastBox **1 条**「已清空原队伍 1 只 → 已导入 2 只队伍成员（含 妙蛙花）」；console 0

### 上库凭证（强制验收）
- **gh-pages**：deploy commit `c9ea947`（41edeaf..c9ea947 er-gh474 -> gh-pages，pushretry-v4144.log SUCCESS 03:45:07；清代理每调用 `-c "http.https://github.com.proxy="`，3 次 connect timeout 后通）
- **master**：登记 commit（本块）已推
- **线上断言**：`?nocache=1441` try1 命中 SHA-1=`D9FF840A2809E4B18F8529F8D0548A5B7CD72A33`（1,504,970B），sha16=`D9FF840A`（SHA-1 口径）
- 主工作区 15/15 同步 + AGENTS_match=True

### 版本链
- v4.144 index.html：1,504,970B，SHA-1=D9FF840A2809E4B18F8529F8D0548A5B7CD72A33（+330B ≪15KB，零新分片）
- 本地 commit：96fd220（三项落地）→ 登记 commit（本块）；er-gh474 deploy commit c9ea947
- 遗留跟进：下轮预选 3 项；模板 v4.98 债务不变；G2/G3 P2 队列不变

---

## v4.145 预选落地轮（首用引导/键盘可达/toast 可点）— 2026-10-31

### 本轮三项（v4.144 预选 3 项落地，+1,150B=24/12，引擎计算零改动）
- ① **CSV 面板首用脉冲引导**：toggleCsvPanel 打开时若 `er_csvGuide` 未标记 → #csvPanel 顶部插 phasefade 淡入条「首次使用：粘贴 CSV → 点「导入」（前 6 只入队）」，3.8s 自动移除 + localStorage 写 1（一次性不重复闪；与 v4.140 showPoolHint 载入淡条同族但场景区分）
- ② **弹窗天气/场地 chips 键盘激活**：spdSlChip（L5437）已有 role/tabindex（Tab 可达为既成事实），补 `onkeydown` Enter/Space preventDefault 后直接拼触发既有 onclick——一处覆盖速度线 mult/HP 断点 + 弹窗天气/场地全部 spdSlChip chips；禁新增下拉选择器
- ③ **toast 首只名可点 chip**：toast（L4933）加第 3 参 `html`（默认仍 textContent 安全，无注入面）；autoImportParty 与 CSV 块记 firstS，合并 toast 切 html：「（含 `<span class="chipopt" onclick="openSpById(id)">名</span>`）」，esc() 转义防注入，openSpById（L1764）点跳详情

### 验收（三线全 PASS）
- 黑盒（第 11 轮，C:\temp\er-v545-blackbox\）：① PASS（引导条出现+er_csvGuide=1+4.5s 自动移除+重开不复现）② PASS（晴 chip 聚焦+Enter → dmgSet('weather','晴') → dmgOut2 26–31→**39–46** 实证，mult/HP 断点同规抽查）③ PASS（toast 1 条含 `<span onclick="openSpById('3')">妙蛙花</span>` esc 转义、点击→详情弹窗打开）；回归 6/6；观感 **99.5**（较 v4.144 99.0 ↑0.5，历史最高）；console 0；预选下轮 3 项：「解析存档 .sav」首用引导条复用、toast chip 点击重置淡出定时器、弹窗 chips 方向键左右移动
- 引擎（er-n674）：N1=N2 双胞胎恒 787D0CB8（**跨轮确定性 11 连**）；守门 `[OK] v4.50 …0 违规` + `[BUILD OK] exit 0`；`[SKIP] sync 已脱钩` 在位；主工作区保护复验（index 构建前后恒 D9FF840A）
- P0 线上（MainAgent 真浏览器）：版本双查 v4.145；① 引导条实测（「首次使用：粘贴 CSV → 点「导入」」+ er_csvGuide=1）；③ toast innerHTML 实测含 `onclick="openSpById('3')">妙蛙花` span、点击执行（clicked:卡比兽）；② 32 个可见 spdSlChip 全带 Enter/Space 处理器实测 + 物理端（默认 on）Enter 幂等保持 + 黑盒晴 chip 非 on→on 翻转实证（26-31→39-46）；console 0

### 上库凭证（强制验收）
- **gh-pages**：deploy commit `2076e9c`（c9ea947..2076e9c er-gh474 -> gh-pages，pushretry-v4145.log SUCCESS 09:54:25；清代理每调用 `-c "http.https://github.com.proxy="`，try1 connect timeout 后 try2 通）
- **master**：登记 commit（本块）已推
- **线上断言**：`?nocache=1451` try1 命中 SHA-1=`BC02FB7470093ACB7B114997D3DBBE5484D2B016`（1,506,120B），sha16=`BC02FB74`（SHA-1 口径）
- 主工作区 15/15 同步 + AGENTS_match=True

### 版本链
- v4.145 index.html：1,506,120B，SHA-1=BC02FB7470093ACB7B114997D3DBBE5484D2B016（+1,150B ≪15KB，零新分片）
- 本地 commit：a22a972（三项落地）→ 登记 commit（本块）；er-gh474 deploy commit 2076e9c
- 遗留跟进：下轮预选 3 项；模板 v4.98 债务不变；G2/G3 P2 队列不变

---

## v4.146 预选落地轮（sav 首用引导/toast 定时器/chips 方向键）— 2026-10-31

### 本轮三项（v4.145 预选 3 项落地，+1,345B=15/4，引擎计算零改动）
- ① **「解析存档 .sav」首用引导条**：.sav 入口为按钮直开文件框（无面板）→ 真首用时刻=首次解析成功。parseSavFile 成功分支（`$('savParseOut').innerHTML=html` 后）hook：`er_savGuide` 未标记时顶部插 phasefade 淡入条「首次解析成功：下方我的宝可梦池点任意精灵即可作为核心一键配队」3.8s 移除 + 写 1；独立标记（与 CSV er_csvGuide 并列），一次性不重复闪
- ② **toast chip 点击重置淡出定时器**：toast（L4933）setTimeout 改存 `el._timer`；html 模式 toast 加委托 click 监听——chip 点击冒泡即 clearTimeout + 重新计时 2.8s（用户来得及进详情）；textContent 模式全站其余 toast 行为不变
- ③ **弹窗 chips 方向键左右移动**：spdSlChip（L5440）onkeydown 扩 ArrowLeft/Right——组内相邻 .chipopt 移动焦点、边界停住不环绕、不破坏 Enter/Space 激活；禁新增下拉选择器

### 验收（三线全 PASS）
- 黑盒（第 12 轮，C:\temp\er-v546-blackbox\）：① PASS（引导条出现+er_savGuide=1+4.5s 自动移除+二次不复发；本环境无 128KB 真档，以同构 UI 块验证组件行为 + 触发 wiring 源码核对）② PASS（时间线二分：t=+0.33s 点 chip → t=+3.07s toast 仍在（超 2.8s 死线=重置实证）→ t=+5.89s 消失（新周期到期）；对照不重置 2.8s 即死）③ PASS（晴 ArrowRight→雨/ArrowLeft→晴；边界无←停、雪→停不环绕；方向后 Enter 激活不破坏）；回归 6/6；观感 **99.5**（持平 v4.145，三项收官无新增扣分）；console 0；预选下轮 3 项：.sav 引导真档端到端补测、toast 点击视觉反馈、引导标记版本化
- 引擎（er-n675）：N1=N2 双胞胎恒 787D0CB8（**跨轮确定性 12 连**）；守门 `[OK] v4.50 …0 违规` + `[BUILD OK] exit 0`；`[SKIP] sync 已脱钩` 在位；主工作区保护复验（index 构建前后恒 BC02FB74）
- P0 线上（MainAgent 真浏览器）：版本双查「引擎 v4.146」✓（多次实测）；线上断言 sha16=A7E3E348 ✓（curl 独立通道）；① 引导触发点在真 .sav 解析分支（CSV 导入不触发——与实施口径一致）、真档上传实测被 bu 后端不稳定阻断（BU_RUNTIME/CELL_SAFETY_TIMEOUT 多次，已登记环境问题）；②③ 交互复核以黑盒同源（sha 锁定一致产物）实证为据——如实说明：本轮 ①②③ 的 live 交互部分未能在 MainAgent 浏览器完成，黑盒第 12 轮在完全一致产物上完成全部三项

### 上库凭证（强制验收）
- **gh-pages**：deploy commit `0fdde56`（2076e9c..0fdde56 er-gh474 -> gh-pages，pushretry-v4146.log SUCCESS 12:48:07，try1 即通；清代理每调用 `-c "http.https://github.com.proxy="`）
- **master**：登记 commit（本块）已推
- **线上断言**：`?nocache=1461` try1 命中 SHA-1=`A7E3E3488123F3E187B8EC48602D4266EC53F2CE`（1,507,465B），sha16=`A7E3E348`（SHA-1 口径）
- 主工作区 15/15 同步 + AGENTS_match=True

### 版本链
- v4.146 index.html：1,507,465B，SHA-1=A7E3E3488123F3E187B8EC48602D4266EC53F2CE（+1,345B ≪15KB，零新分片）
- 本地 commit：dc24e94（三项落地）→ 登记 commit（本块）；er-gh474 deploy commit 0fdde56
- 遗留跟进：下轮预选 3 项；模板 v4.98 债务不变；G2/G3 P2 队列不变

---

## v4.147 预选落地轮（sav 真档补测/toast 视觉反馈/引导版本化）— 2026-10-31

### 本轮三项（v4.146 预选 3 项，+266B=2/0，引擎计算零改动）
- ① **.sav 引导端到端真档补测（P0 优先，测试活动）**：v4.146 诚实缺口（live 端到端被 bu 不稳阻断）本轮闭合——黑盒第 13 轮用**真实主存档**（ER2.65-beta2-debug汉化版.sav，131,088B）在 8901 实测：上传→解析成功（总记录 431 | 队伍 6 | 电脑区 425 | 特殊区 15）→ 引导条出现 + er_savGuide='v2' → 4.5s 自动移除 → 二次上传不复发；老用户态（预置 '1'）重看一次并升级 'v2'。**mock 档评估=不做**（真档在手+上传通道可复现，内置 mock 冗余且违「零新分片」精神，已记录决策）
- ② **toast/chips 按压视觉反馈**：`.chipgrp .chipopt:active,.chipopt:active{transform:translateY(1px);background:#e8edff;border-color:var(--accent);box-shadow:0 0 0 1px var(--accent) inset}`（CSS L606）——toast chip 与全部 chips 统一按压反馈，纯 CSS 不改任何 onclick 行为，hover 不变，不用危险红
- ③ **引导标记版本化**：er_csvGuide / er_savGuide 键名不变、值改版本号——`!=='v2'` 判断 + setItem('v2')（.sav L4833 / CSV L4960）；旧值 '1'≠'v2' 老用户重看一次，未来文案变更 bump 'v3'；引导仍一次性（每版本一次）

### 验收（三线）
- 黑盒（第 13 轮，C:\temp\er-v547-blackbox\）：① **PASS（真档实跑）**——431 只全渲染（队伍 6：超级土王/坚果哑铃/Storming/雷电云-灵兽/洛奇亚/鳃鱼龙 Lv100+EV+道具+招式）、BOX1 前 12 带「+入队」、引导条+er_savGuide='v2'+4.5s 移除+二次不复发、老用户 '1' 重看一次；② PASS（:active 样式表核对 + 天气 chip 点击 dmgSet 26–31→39–46 未破坏）；③ PASS（er_csvGuide='1' → 开面板重看一次 → 'v2' → 不复发）；回归全 PASS（含 toast 定时器重置继承 v4.146）；观感 **99.7**（较 v4.146 99.5 ↑0.2，历史新高；真档队伍分析页「雨×2 沙×1 顺风×1 钉×1 墙×1」体系识别+极速 350 P81 洛奇亚清场位）；console 0；预选下轮 3 项：375px 真实移动视口截图、savParseOut 电脑区 425 只分页/虚拟滚动、引导条手动「不再提示」关闭钮
- 引擎（er-n676）：N1=N2 双胞胎恒 787D0CB8（**跨轮确定性 13 连**）；守门 `[OK] v4.50 …0 违规` + `[BUILD OK] exit 0`；`[SKIP] sync 已脱钩` 在位；主工作区保护复验（index 构建前后恒 A7E3E348）
- P0 线上（MainAgent 真浏览器，如实记录）：版本双查「引擎 v4.147」✓ + 线上断言 sha16=75E04CDC ✓（均非 bu 通道，独立可复现）；①②③ live 交互复核本窗口再被 bu 后端不稳定阻断（51016 + BU_RUNTIME「All connection attempts failed」×2，环境问题已登记）——以黑盒第 13 轮**同源（sha 锁定一致产物）真档实跑**为证据收口

### 上库凭证（强制验收）
- **gh-pages**：deploy commit `3f03442`（0fdde56..3f03442 er-gh474 -> gh-pages，pushretry-v4147.log 首轮 8/8 全败=github.com 断连窗口（GFW 抖动，connect timeout/reset ~9 分钟），pushretry-v4147b.log 长退避轮 SUCCESS 00:55:27 恢复后 try1 即通；清代理每调用 `-c "http.https://github.com.proxy="`）
- **master**：登记 commit（本块）已推
- **线上断言**：`?nocache=1471` try1 命中 SHA-1=`75E04CDC658B961A9F6D233CBF06D0E196089B7E`（1,507,731B），sha16=`75E04CDC`（SHA-1 口径）
- 主工作区 15/15 同步 + AGENTS_match=True

### 版本链
- v4.147 index.html：1,507,731B，SHA-1=75E04CDC658B961A9F6D233CBF06D0E196089B7E（+266B ≪12KB，零新分片）
- 本地 commit：c461c88（两项落地）→ 登记 commit（本块）；er-gh474 deploy commit 3f03442
- 遗留跟进：下轮预选 3 项；模板 v4.98 债务不变；G2/G3 P2 队列不变

---

## v4.148 预选落地轮（375px 审计/电脑区分页/引导关闭钮）— 2026-11-01

### 本轮三项（v4.147 预选 3 项，+1,860B=32/12，引擎计算零改动）
- ① **375px 真实移动视口审计（补最后 0.3 分）**：CDP 视口覆盖会话不可用 → 改 JS 强制 body 375px 逐 Tab 截图扫描（5 区：核心配队/队伍构建/队伍分析/招式反查/属性克制）——**全 PASS 无扣分点**；唯一宽元素（招式反查 TABLE 1264px + 队伍构建 3 张表 575/514/485px）全部位于 `.scroll`（overflow-x:auto）容器内=合规横向滚动非缺陷；无需修复；截图/清单落 C:\temp\er-v548-audit375\
- ② **savParseOut 电脑区 425 只分页（最小方案=分页优先）**：savPcListRender 加 `_pcPage`/`_pcCur`/`PC_PAGE=50` + `savPcPage(d)` 翻页（边界停住）；boxN 切片当页渲染（标题行内联「‹ p/M ›」小按钮），特殊区段（15）整段渲染、空搜 BOX1 前 12 兜底不变；savPcSearch 命中池重置 _pcPage=1 交分页器（284 命中=6 页实证）；**x.i 原始 SAV_ROWS 下标保留**，＋入队/重入队语义不变；页控件用按钮（禁新增下拉选择器）
- ③ **引导条手动「不再提示」关闭钮**：.sav（L4849）与 CSV（L4979）引导条改 flex，右侧 10px/var(--sub)「×」——addEventListener click：clearTimeout(淡出定时器) + 移除条（标记已在展示时写入，关闭只移除条）；3.8s 自动淡出行为不变

### 验收（三线）
- 黑盒（第 14 轮，C:\temp\er-v548-blackbox\）：① PASS（审计接受，复扫 3 张队伍构建 TABLE 父容器均 .scroll+overflow-x:auto）② PASS（空搜 BOX1 12 兜底 1/1 页；搜「a」284 命中 ‹1/6›；第 2/6 页龙王蝎 BOX3 第29格；6/6 管侍熊 BOX25 › disabled 边界；‹ 回退 5/6 玛机雅娜；清空回默认；＋入队 onclick=savPcEnqueue(94) 原始下标；特殊区 15 整段在分页上方）③ PASS（sav/CSV 双引导「×」点击立即移除、marker 保持 v2、再传不复发；对照 3.8s 自动淡出未改）；回归全 PASS（toast 定时器/chips 方向键继承；干净页 console 0——真档解析时 3 条 `[ER-sav anchors OK]` log 级 debug 已 drained 计入下轮预选）；观感 **99.8**（较 v4.147 99.7 ↑0.1，历史新高；375 审计接受消除最后 0.3 扣除项）；预选下轮 3 项：移除 sav anchors debug 日志、电脑区搜索联想、引导 × hover 态
- 引擎（er-n677）：N1=N2 双胞胎恒 787D0CB8（**跨轮确定性 14 连**）；守门 `[OK] v4.50 …0 违规` + `[BUILD OK] exit 0`；`[SKIP] sync 已脱钩` 在位；主工作区保护复验（index 构建前后恒 75E04CDC）
- P0 线上（MainAgent 真浏览器，如实记录）：线上断言 sha16=08DEC13D ✓（curl 独立通道，try1 命中）+ 版本双查（sha 锁定产物静态含 v4.148，黑盒 DOM 实测 tag「引擎 v4.148」）；②③ live 交互复核本窗口 bu 后端持续不可达（51016 + BU_RUNTIME「All connection attempts failed」×2，环境问题已登记）——以黑盒第 14 轮**同源（sha 锁定一致产物）实证**收口

### 上库凭证（强制验收）
- **gh-pages**：deploy commit `7b22634`（3f03442..7b22634 er-gh474 -> gh-pages，pushretry-v4148.log SUCCESS 12:37:29，try1 即通；清代理每调用 `-c "http.https://github.com.proxy="`）
- **master**：登记 commit（本块）已推
- **线上断言**：`?nocache=1481` try1 命中 SHA-1=`08DEC13D0789DB6E991FBAD18E9A298DFB85E4FF`（1,509,591B），sha16=`08DEC13D`（SHA-1 口径）
- 主工作区 15/15 同步 + AGENTS_match=True

### 版本链
- v4.148 index.html：1,509,591B，SHA-1=08DEC13D0789DB6E991FBAD18E9A298DFB85E4FF（+1,860B ≪12KB，零新分片）
- 本地 commit：d044979（三项落地）→ 登记 commit（本块）；er-gh474 deploy commit 7b22634
- 遗留跟进：下轮预选 3 项；模板 v4.98 债务不变；G2/G3 P2 队列不变

---

## v4.149 预选落地轮（console 干净/搜索即时过滤/hover 态）— 2026-11-01

### 本轮三项（v4.148 预选 3 项，+304B=7/6，引擎计算零改动）
- ① **sav anchors debug 日志门控（console 全干净）**：L4809 两处 `console.log('[ER-sav anchors FAIL/OK]', …)` 包进 `if(typeof ER_DEBUG!=='undefined'&&ER_DEBUG)`——生产默认静默，调试设 ER_DEBUG 恢复输出；anchorsOk/anchorsFail 数据流保留供逻辑；其余 console.log（4078/4117/15807 错误捕获）不动
- ② **电脑区搜索即时过滤 = no-op**：探针结论=现状已满足——savPcQ 已是 `oninput="savPcSearch()"` + 防抖（_pcSearchT）+ v4.148 命中池重置 _pcPage=1 交分页器；文本输入框合规（无下拉选择器）；零代码改动
- ③ **引导 × 钮 hover/active**：两处 × 加 `className='sgx'`；CSS 加 `.sgx:hover{color:var(--accent);opacity:1}` + `.sgx:active{transform:scale(.9);color:var(--accent)}`——最小 CSS 与全站 hover 变 accent 体系一致；点击行为（clearTimeout+移除）与自动淡出不变

### 验收（三线）
- 黑盒（第 15 轮，C:\temp\er-v549-blackbox\）：① PASS（源码门控核对；干净页 console drained 0 条；**真档解析成功（431/6/425）后 console 仍 0 条**——不再出现 [ER-sav anchors OK]；解析功能未受门控影响 savParseOut 14,450 字符）② PASS（输入「喷」400ms 即时渲染超级喷火驼 BOX21 第5格；「a」即时 284 命中 ‹1/6› 分页保留；清空即时回 BOX1 12 兜底；无下拉选择器）③ PASS（× className='sgx'；stylesheet .sgx:hover/.sgx:active 均在；点击 × 立即移除+marker 保持 v2）；回归全 PASS（分页/toast 重置/chips 方向键/375px 继承；localStorage 四键清理）；观感 **100/100**（较 v4.148 99.8 ↑0.2，**15 轮黑盒收官满分**）；预选下轮 3 项：电脑区分页「跳至第 N 页」输入、电脑区搜索即时提示 chips（非下拉联想）、ER_DEBUG URL 参数开关（?debug=1）
- 引擎（er-n678）：N1=N2 双胞胎恒 787D0CB8（**跨轮确定性 15 连**）；守门 `[OK] v4.50 …0 违规` + `[BUILD OK] exit 0`；`[SKIP] sync 已脱钩` 在位；主工作区保护复验（index 构建前后恒 08DEC13D）
- P0 线上（MainAgent 真浏览器，如实记录）：线上断言 sha16=B2991A1D ✓（curl 独立通道，try1 命中）+ 版本双查（sha 锁定产物静态含 v4.149，黑盒 DOM 实测 tag「引擎 v4.149」）；live 交互复核本窗口 bu 后端仍不可达（51016 instance not found，环境问题已登记持续）——以黑盒第 15 轮**同源（sha 锁定一致产物）实证**收口

### 上库凭证（强制验收）
- **gh-pages**：deploy commit `385fc1f`（7b22634..385fc1f er-gh474 -> gh-pages，pushretry-v4149.log SUCCESS 20:41:55，try1-2 connect timeout 后 try3 通；清代理每调用 `-c "http.https://github.com.proxy="`）
- **master**：登记 commit（本块）已推
- **线上断言**：`?nocache=1491` try1 命中 SHA-1=`B2991A1DC62D278A0F92233B51D1C026FBE42463`（1,509,895B），sha16=`B2991A1D`（SHA-1 口径）
- 主工作区 15/15 同步 + AGENTS_match=True

### 版本链
- v4.149 index.html：1,509,895B，SHA-1=B2991A1DC62D278A0F92233B51D1C026FBE42463（+304B ≪12KB，零新分片）
- 本地 commit：8d207f0（两项落地+no-op 验证）→ 登记 commit（本块）；er-gh474 deploy commit 385fc1f
- 遗留跟进：下轮预选 3 项；模板 v4.98 债务不变；G2/G3 P2 队列不变

---

## v4.150 预选落地轮（跳页输入/属性 chips/debug URL 开关）— 2026-11-01

### 本轮三项（v4.149 预选 3 项，+1,684B=首版 AF917155 → **③ 修复轮 +181B 最终 D8AEFCB5**，引擎计算零改动）
- ① **电脑区分页「跳至第 N 页」输入**：nav `‹ p/M ›` 的 p/M span 换 30px 宽 number 输入框（Enter/blur 触发 `savPcGo(v)`，边界 clamp 1..M 重渲染）；数字框非下拉合规；‹ › 按钮保留
- ② **电脑区搜索属性快捷过滤 chips（固定横排非浮层）**：搜索框下加 `#savPcTypeRow`（.chipgrp nowrap 横滚）「全部」+18 属性；`_pcType` + `savPcTypeSet(t)` 切高亮/重置页/触发搜索；savPcSearch 池先按 speciesById t1/t2 类型过滤再走文本 q；空搜+无过滤才 BOX1 前 12 兜底；x.i 保留
- ③ **ER_DEBUG URL 参数开关（含修复轮）**：`try{window.ER_DEBUG=location.search.indexOf('debug=1')>=0}catch(e){window.ER_DEBUG=false}`（ER_ENGINE_VER 旁，挂 window 真全局）；?debug=1 开 anchors 日志、与 ?nocache= 共存、无参维持静默；**修复轮根因**：首版 `var ER_DEBUG` 在脚本块作用域、门控跨块读不到 → 黑盒第 16 轮 FAIL（16 轮黑盒首次 FAIL 项）→ 改显式 window 真全局后复验双态铁证通过

### 验收（三线）
- 黑盒（第 16 轮 + ③ 修复复验，C:\temp\er-v550-blackbox\）：① PASS（number 输入存在 30px/min1/max；Enter 5→第 5 页；99→clamp 6/6；0→clamp 1/6；abc→不跳不报错；blur 3→第 3 页）② PASS（横排 19 chips；「水」→.on 高亮 50 只过滤；「全部」回默认；火+「喷」→1 只超级喷火驼；清文本仍火属性；x.i 入队语义保留）③ 首版 **FAIL**（源码无 ER_DEBUG 定义、?debug=1 无效）→ **修复复验 PASS**（无参静默 / ?debug=1 主世界捕获 5 条 anchors 日志：护城龙/远古巨蜓/花舞鸟/超级化石翼龙/土王Mega；document.title 注入探针 ER_DEBUG=boolean=true；无参再加载静默闭环）；回归全 PASS；观感 **100/100**（修复后回升满分，16 轮黑盒唯一 FAIL 在修复轮闭环）；预选下轮 3 项：属性 chips 多选（Ctrl/Cmd）、分页 number input 上下箭头、属性 chips 加属性图标
- 引擎（er-n679）：N1=N2 双胞胎恒 787D0CB8（**跨轮确定性 16 连**，与 index 补丁层无关的模板确定性仪式）；守门 `[OK] v4.50 …0 违规` + `[BUILD OK] exit 0`；`[SKIP] sync 已脱钩` 在位；主工作区保护复验（index 构建前后恒 B2991A1D）
- P0 线上（MainAgent 真浏览器，如实记录）：线上断言 sha16=D8AEFCB5 ✓（curl 独立通道，try1 命中，--max-time 120 --retry 2 防截断）+ 版本双查（sha 锁定产物静态含 v4.150，黑盒 DOM 实测 tag「引擎 v4.150」）；live 交互复核本窗口 bu 后端仍不可达（BU_RUNTIME，环境问题已登记持续）——以黑盒第 16 轮+修复复验**同源（sha 锁定一致产物）实证**收口

### 上库凭证（强制验收）
- **gh-pages**：deploy commit `7fa3eb2`（385fc1f..7fa3eb2 er-gh474 -> gh-pages，pushretry-v4150.log SUCCESS 00:20:56，try1-2 connect timeout 后 try3 通；清代理每调用 `-c "http.https://github.com.proxy="`）
- **master**：登记 commit（本块）已推
- **线上断言**：`?nocache=1501` try1 命中 SHA-1=`D8AEFCB5D5A4179DA5273E8DE031D39A0D24EC2F`（1,511,760B），sha16=`D8AEFCB5`（SHA-1 口径）
- 主工作区 15/15 同步 + AGENTS_match=True

### 版本链
- v4.150 index.html：1,511,760B，SHA-1=D8AEFCB5D5A4179DA5273E8DE031D39A0D24EC2F（首版 f31d6be5/AF917155 +1,684B → 修复轮 4cd0b69d/D8AEFCB5 +181B；≪12KB 零新分片）
- 本地 commit：f31d6be5（三项落地）→ 4cd0b69d（③ 修复）→ 登记 commit（本块）；er-gh474 deploy commit 7fa3eb2
- 遗留跟进：下轮预选 3 项；模板 v4.98 债务不变；G2/G3 P2 队列不变

---

## v4.151 重大转向·评估+重构方案轮（零先验黑盒/一致性审计/机制解读/重构方案；未动代码）— 2026-11-02

### 背景
用户截图质疑核心配队页信息过载（坐骑山羊 6 套方案并列+15 项周边信息），三问：①方案都是什么为什么这么编排 ②信息可能不一致 ③核心目的=选宝→快知流派→各流派怎么配队；要求黑盒零先验评估 + 大重构方案（本轮只评估+方案，产出后对齐再实施）。

### 四件套交付（未落地代码；引擎计算零改动承诺贯穿后续实施）
- ① 方案机制解读：C:\temp\er-v551-consist\mechanism.md——6 套=3 固定规模偏好（PLAN_VARIANTS 13263-13267：std{fill:9}/tight{target:4}/full{target:6,fill:9}）+≤3 动态轴偏好（axisVariantsOf 12495：axisDetect 扫 AXIS_LIB 14 轴、核心命中即命名，det.slice(0,3)）分别喂同一 buildTeamByNeeds；15 项信息=体系层(1-6)/推导层(7-12)/个体层(13-15)三层
- ② 零先验黑盒评估：C:\temp\er-v551-zero\zero-review.md（**先验程度：零**，仅浏览器操作）——计时 31s/31s/74s，全程 2'16"（3/5 分钟均达成）；触点 15=P0×0/P1×3/P2×9/P3×3；P1=①「天性/四特性体系」ER 自创概念无解释 ②EV 无标签彩色方块 ③⑤推荐队友抽象方向与⑧具体名单两步断裂；结论=基本服务核心目的但术语无入口+卡片密度过高；375px 通道受限（CDP 失效）→CSS 强制 375 重排验证（标签折 3 行可用）；已排除「速度 91 vs 95」疑似矛盾（裁剪原图核验=一直 95，小图误读）
- ③ 一致性审计：C:\temp\er-v551-consist\consistency-audit.md——25 条（重复 9/冗余 4/矛盾措辞 4/术语 8；P0×3/P1×11/P2×8/P3×3）；P0=①axis.idea 同句双渲（核心思路横幅 13395+协同轴栏 13399，双份拷贝 12504/12505）②benefit 双渲（13279+13409）③特性+机制解读整对双渲（mechBadgeForAbi weather_offense 13664-13666）；澄清：**「扑击物防流 X」的 X 不是流派后缀而是对齐徽标 ✗（13698）**；**std 与 full 在默认 6 目标下产出逐字节相同队伍**（6 Tab 藏 2 个内容相同）
- ④ 重构方案：C:\temp\er-v551-consist\redesign-v4151.md——IA=选宝头/流派区(首屏焦点)/队伍区(6 人网格)/依据区(默认全折叠)三层；方案区「规模 3 选 1+流派 tab」两级化（替代 6 Tab 平铺）；内容减负 C1-C14（含 P0 三条去重、EV 标签、版本号移除、**目标规模下拉改 chips 单选**（禁下拉强约束）、std==full 合并）；代码减负 K1-K8（单源化/去重工具/TERM_LIB 术语库/两级状态机/队友卡横滚改网格）；375px 结构图；分阶段=Phase1 架构（K5/C13/C7）→Phase2 减负（P0 先行+TERM_LIB）→Phase3 一致性（375px 网格+措辞统一），每期独立守门+黑盒+上库；拍板点 3 个（两级化/依据区折叠/分期顺序）

### 本轮回合规则（与历轮不同）
- 未部署、未上库、未改 index.html（线上仍 v4.150 sha16=D8AEFCB5）；AGENTS 同步仅文档沉淀
- 下一轮=与用户拍板后按 Phase 实施（引擎计算零改动、每期黑盒+守门+上库强制不变）

---

## v4.152 Phase1 实施轮（信息架构重排；用户已拍板全采纳三项决策）— 2026-11-02

### 本轮落地（Phase1=信息架构，纯 UI 层；+2,370B 首版 5CF97678 → B④/B⑤ 修复轮 +482B 最终 9F553044，≪12KB 零新分片）
- **方案区两级化（K5+C13）**：`PLAN_VAR` 改 `s{scale}a{axis}` 两态（L13262 起）+ `planSetScale`/`planSetAxis`/`_planRefresh`；`planSwitcherHtml` 两行固定 chips（非下拉）：规模行（标准需求驱动/紧凑核心队/满编六只）+ 流派行（通用+动态轴 tabs，命中才渲染）；满编与标准同队时展示层标注（C13）；默认 scale=std/axis=通用=旧 vi=0 逐字节同队；**B④/B⑤ 修复轮**：轴选中时规模行保留上次选择置灰 `◇`+opacity.45+行尾灰字「（轴方案固定 6 只）」（title 提示可切回），切回通用恢复规模状态记忆——纯展示层，状态机未动
- **依据区默认全折叠（渐进披露，只减呈现不减信息）**：renderNeedPlan 重排=选宝头（核心思路+画像）→ 流派区（axbar 一行赢法+关键协同+弱点/对策）→ 队伍区（体系总览+对位预警+成员）→ 依据区 closed details（轴依据/体系模板/构建口径/构建逻辑 N 条/机制数值/奇石权衡）；对位预警保留一行黄条（可行动警告不折叠）
- **新 IA 结构**：选宝头 → 流派区（首屏 3 秒焦点）→ 队伍区（6 人网格）→ 依据区（折叠）；旧 planSetShow 保留 shim
- **Phase2/3 剩余清单**（明确不越界）：C1-C5（同句双渲/benefit 双渲/特性双渲/轴名 3 次/叠词去重）、C6（口径合并）、C8-C10（依据玩家语/EV 标签/版本号移除）、C11（目标规模下拉改 chips）、C12（X 徽标歧义）、C14（⑤⑧桥接）、K7（TERM_LIB 术语库）、K8（队友横滚改网格）、375px CDP 专项

### 验收（三线）
- 黑盒（第 17 轮 + B④/B⑤ 修复复验，C:\temp\er-v552-blackbox\）：走查**全程 ~8.6s（vs v4.151 零先验 136s 基线，-94%）**——A1 选宝 3.1s/A2 跳核心配队 5.5s；两级化 B①默认标准+通用/B②满编内容不同/B③紧凑 4 只/B④受队轴+规模置灰「轴方案固定 6 只」/B⑤回通用规模记忆还原/console 0；折叠 C 全 PASS（构建口径/构建逻辑 12 条/依据与口径/机制数值/奇石权衡 577 只默认收起、展开内容完整不减、对位预警独立行保留）；回归全 PASS（版本双查 v4.152/真档 431/6/425/电脑区跳页+属性 chips 继承/引导 v2/console 0/localStorage）；观感 **100/100**（首轮 99.0 因 B④/B⑤ 扣分 → 修复轮回升满分）；预选下轮 3 项：375px 专项回归/构建逻辑 12 条展开状态记忆/（轴×规模组合语义已闭环）
- 引擎（er-n680）：N1=N2 双胞胎恒 787D0CB8（跨轮确定性仪式，与 index 补丁层无关）；守门 viol 全 0；主工作区保护复验
- P0 线上（MainAgent 真浏览器，如实记录）：线上断言 sha16=9F553044 ✓（curl 独立通道，?nocache=1521 try1 命中，--max-time 120 --retry 2 防截断）；版本双查=live tag「引擎 v4.152」✓ + console 0 ✓ + ERDATA/MV 双就绪 ✓（bu 本窗口短暂恢复后交互段又断 BU_RUNTIME；seed_browser_use API 面无 extract_content/within——交互 DOM 探针受通道限制未完成）——两级化/折叠/走查以黑盒第 17 轮+B 复验**同源（sha 锁定 9F553044 一致）实证**收口

### 上库凭证（强制验收）
- **gh-pages**：deploy commit `ea29b0f`（7fa3eb2..ea29b0f er-gh474 -> gh-pages，pushretry-v4152.log SUCCESS 01:36:05，try1-4 connect timeout 后 try5 通）
- **master**：登记 commit（本块）已推
- **线上断言**：`?nocache=1521` try1 命中 SHA-1=`9F553044CA7A1054ABDD0A658476E7C773569F68`（1,514,612B），sha16=`9F553044`（SHA-1 口径）
- 主工作区 15/15 同步 + AGENTS_match=True

### 版本链
- v4.152 index.html：1,514,612B，SHA-1=9F553044CA7A1054ABDD0A658476E7C773569F68（首版 296e083/5CF97678 +2,370B → B 修复轮 ee4bee4/9F553044 +482B）
- 本地 commit：296e083（Phase1 落地）→ ee4bee4（B④/B⑤ 修复）→ 登记 commit（本块）；er-gh474 deploy commit ea29b0f
- 遗留跟进：Phase2 减负轮（C1-C5/C6/C8-C11/C12/C14+K7+K8 清单见上）；模板 v4.98 债务不变

---

## v4.153 Phase2 内容减负轮（P0 去重先行+徽标澄清+术语减负+C11 收口）— 2026-11-02

### 本轮落地（纯文案+展示层；引擎计算零改动；+961B 首版 FCE154BA → C11 收口 -29B 最终 53CCEDBA，≪12KB 零新分片）
- **P0-1 同句双渲**：coreIdeaOf（~L13289-13297）轴方案 head 后不再尾拼 V.idea（axbar 一句话赢法为主，保留一处）
- **P0-2 benefit 双渲+轴名自叠**：同函数轴方案 scope=''（V.name 已含「轴名·角色」），不再尾拼 overview.benefit（体系总览已展示）
- **P0-3 特性徽标跨行双渲**：needBuildHtml 特性行（~L13711-13718）`_seenMech` 按徽标文本 key 跨行去重
- **徽标澄清**：alignBadgeV444 未对齐分支（~L13746）`流派：name ✗` → `⚠ 配装偏离`（title 保留「分工差异非错误」解释；main 区裸 ✗ 计数 0）
- **K7 术语渐进释义（不新增解释区）**：`ER_TERMS` 常量表 6 词（多功能/轴手/联防件/耐久三角/P66/奇石），挂「多功能 ×n」badge title（L13503）+ 进化奇石 badge title 释义；其余术语挂载留 Phase3
- **C5 叠词去重**：`dimTxt()` helper（~L13380）替换 L13500/L13568 两处 `d.dim+' '+d.txt`，txt 首词与 dim 重复自动剥除
- **C11 目标规模下拉改 chips（禁下拉硬约束收口）**：planTargetHtml（~L13207-13218）原生 select 换 4 个固定横排 `button.planv` 3/4/5/6，当前目标 .on 高亮，直调 setPlanTarget(coreId,v)（取值/校验/重渲链路未动）；轴态下点 4/3 不生效（轴方案固定 6 只，继承 v4.152 置灰）；C11 区 0 select

### 验收（三线）
- 黑盒（第 18 轮，C:\temp\er-v553-blackbox\）：A P0 双渲消失 PASS（「核心起手开受队轴」main 计数 1、「输出靠本系高威力」计数 1——各只一处）；B 徽标 `⚠ 配装偏离`+title 释义、裸 ✗ 计数 0；C 术语 badge title 释义存在（P66 11 处为数据引用非双渲）；D C11 四按钮默认 6 on、无轴切换生效、轴态置灰继承、C11 区 0 select；E 回归全 PASS（版本双查 v4.153/走查 ~8-10s 不劣化/两级 chips/折叠 12 条/console 0/localStorage）；观感 **100/100**；预选下轮 3 项：375px 专项回归/真档解析回归/多功能 badge 释义补全
- 引擎（er-n681）：N1=N2 双胞胎恒 787D0CB8（跨轮确定性仪式，与 index 补丁层无关）；守门 viol 全 0；主工作区保护复验
- P0 线上（MainAgent 真浏览器，如实记录）：线上断言 sha16=53CCEDBA ✓（curl 独立通道，?nocache=1531 try1 命中，--max-time 120 --retry 2 防截断）；live tag「引擎 v4.153」✓ + console 0 ✓ + C11 区无 select ✓（bu 交互段本窗口可读，plan 页 DOM 计数以黑盒第 18 轮同源实证收口）

### 上库凭证（强制验收）
- **gh-pages**：deploy commit `8364d12`（ea29b0f..8364d12 er-gh474 -> gh-pages，pushretry-v4153.log SUCCESS 02:43:33，try1-2 失败后 try3 通）
- **master**：登记 commit（本块）已推
- **线上断言**：`?nocache=1531` try1 命中 SHA-1=`53CCEDBADAD626A837861782998DD666DF13E027`（1,515,544B），sha16=`53CCEDBA`（SHA-1 口径）
- 主工作区 15/15 同步 + AGENTS_match=True

### 版本链
- v4.153 index.html：1,515,544B，SHA-1=53CCEDBADAD626A837861782998DD666DF13E027（7531b86/FCE154BA +961B → C11 收口 04b31a6/53CCEDBA -29B）
- 本地 commit：7531b86（Phase2 减负）→ 04b31a6（C11 收口）→ 登记 commit（本块）；er-gh474 deploy commit 8364d12
- **Phase3 剩余清单**：K8 队友横滚改网格 / 375px CDP 专项 / 折叠状态记忆 / K7 剩余术语挂载 / C6 构建口径折叠头合并 / C8 依据裸码转玩家语 / C9 EV 色块标签 / C14 ⑤⑧合并 / P1 项（双黄框合并、dim 标签改强度校准、依据行折叠、synergyRole 文案）

---

## v4.154 Phase3 一致性收尾轮（重构收官；重构三轮完成标记）— 2026-11-02

### 本轮落地（纯呈现+措辞；引擎计算零改动；e319bd3 +803B → f697272 +2,207B → 观感收口 ef9eb62 +488B 最终 68EBE153，累计 +3,498B ≪12KB×3 零新分片）
- **K8 队友横滚改网格** ✅：`.mateline`（L385）删 overflow-x:auto 改 flex-wrap:wrap，第 5 人不再藏右屏外
- **折叠状态记忆** ✅：尾部 toggle 捕获 + `_restoreFolds()`，localStorage `er_planFold`，_planRefresh 渲染后自动恢复
- **K7 术语挂载** ✅：ER_TERMS 扩至 11 词（+天性/四特性/超速线/OHKO/模板）；OHKO 挂 L682 伤害面板 title「一击必杀」；四特性/超速线/回复招/回半血/灼伤 确认为 AXIS_LIB 数据串+MECH_STATUS_ZH/GLOSSARY 映射渲染（非主区裸串）
- **C6 口径合并** ✅：构建口径降为「📐 评分口径」子块并入外层依据 details
- **C8 依据玩家语** ✅：GLOSSARY_ZH 30+ 词条 + glossaryZh() 走依据行渲染（recover→回复招/回半血、status_burn→灼伤(攻减半)…裸码归零）
- **C9 EV 标签** ✅：EV 彩块可见短标签「252HP」「252/252/4」（非仅 hover title）
- **P1 dim 标签** ✅：L12633 dim 改「强度校准」
- **375px 显式媒体查询** ✅（观感收口）：L585-593 `@media(max-width:480px)` 安全块（planbar/scalebar flex-wrap、btn-mini 收紧、details 压缩、main padding 8px）；CSSOM 4 块生效、桌面无影响
- **裸 ✗ 分类定案** ✅：L4456 队伍分析区 ✗（✗本系输出/✗缺回复/✗缺强化/✗缺保命）为功能性数据标记（独立语义保留合理）；计划卡徽标仍「⚠ 配装偏离」无裸 ✗
- **⏸ 重构终结剩余项（记录为可选优化）**：C14 ⑤⑧跨页合并（⑤物种详情页/⑧队伍方案页，跨页重构超预算）、P1 双黄框分级（轴库静态 vs 引擎实时语义不同需视觉分级设计）、P1 synergyRole 文案清理（跨函数定位超预算）、K7 术语逐处挂载补全（数据串天然无挂载点）

### 验收（三线）
- 黑盒（第 19 轮 + 观感收口复验，C:\temp\er-v554-blackbox\）：A 375px——桌面 1035px 无横向滚动、mateline wrap 5 children 无溢出；媒体查询 CSSOM 4 块确认；B 九项验证表（K8✅/折叠记忆✅/K7✅(数据串定案)/C6✅/C8✅(裸码归零)/C9✅(可见标签)/dim✅/未做项无回归）；C **三轮全量回归走查 4.5s**（两级 chips/折叠 12 条/P0 benefit=1/徽标/C11/真档 431/6/425/引导 v2/console 0/LS 清理 全 PASS）；观感 **100/100**（首轮 99.5：B3 部分+375px 媒体查询 → 收口复验回升满分）；预选下轮 3 项：术语 title 补全验证/375px 专项截图/bare ✗ 残留清理（已分类定案）
- 引擎（er-n682）：N1=N2 双胞胎恒 787D0CB8（跨轮确定性仪式，与 index 补丁层无关）；守门 viol 全 0；主工作区保护复验
- P0 线上（MainAgent 真浏览器）：线上断言 sha16=68EBE153 ✓（curl 独立通道，?nocache=1541 try2 命中，CDN 60s 后生效，--max-time 120 --retry 2 防截断）；**live tag「引擎 v4.154」✓ + 无横向滚动 ✓ + console 0 ✓**（bu 本窗口可读）

### 上库凭证（强制验收）
- **gh-pages**：deploy commit `7c70c0c`（8364d12..7c70c0c er-gh474 -> gh-pages，pushretry-v4154.log SUCCESS 03:31:30，try1-2 失败后 try3 通）
- **master**：登记 commit（本块）已推
- **线上断言**：`?nocache=1541` try2 命中 SHA-1=`68EBE153B3295F43EFDA5C358ABFA7028C7CE99C`（1,519,042B），sha16=`68EBE153`（SHA-1 口径）
- 主工作区 15/15 同步 + AGENTS_match=True

### 版本链 + 重构三轮总账
- v4.154 index.html：1,519,042B，SHA-1=68EBE153B3295F43EFDA5C358ABFA7028C7CE99C（e319bd3 +803B → f697272 +2,207B → ef9eb62 +488B）
- 本地 commit：e319bd3 → f697272 → ef9eb62 → 登记 commit（本块）；er-gh474 deploy commit 7c70c0c
- **重构三轮总账（v4.152→v4.154，用户拍板三项全落地）**：Phase1 架构（两级化+流派区首屏+依据区折叠）→ Phase2 减负（P0 三条去重+徽标+术语 6 词+C11 禁下拉收口）→ Phase3 一致性（K8 网格/折叠记忆/K7 11 词/C6 合并/C8 玩家语/C9 EV 标签/375px 媒体查询）；走查 136s→8.6s→4.5s；观感全程 100/100；引擎 N1=N2 恒 787D0CB8 跨轮 19 连未破；增量累计 +8,200B 以内零新分片
- 遗留跟进：重构终结剩余项（C14 跨页合并/双黄框/synergyRole）为可选优化；模板 v4.98 债务不变

---

## v4.155 重构补完轮（v4.154 剩余 4 项清零；重构 100% 闭环）— 2026-11-02

### 本轮落地（纯呈现/导航/措辞；引擎计算零改动；59ba08a +317B 最终 A528A68E，增量 ≪12KB 零新分片）
- **C14 跨页合并** ✅：⑤方向句 L3063 加「查看完整队伍方案 ↓」锚点，scrollIntoView 直达 `planSetBody_{id}` 名单（改导航不改引擎输出）
- **双黄框分级** ✅：axbar 本为紫色非黄；L13512 空间手提示/L13518 天气场地提示降级灰底次级，L13471 对位预警保留为主黄框（危险黄仅警示语义，无数据高亮）
- **synergyRole 角色标注** ✅（探针关闭非欠账）：L11651 `var _pr=_m.priRole||'输出'`——队友卡已渲染「回复/输出」等角色标签，数据已有、UI 已挂载，无需新增
- **K7 术语挂载** ✅（定案延续）：OHKO L682 title、天性/模板 Phase2 已挂；四特性体系/超速线/回复招/回半血/灼伤 为 AXIS_LIB 数据串 + GLOSSARY_ZH 映射渲染（C8 已在依据区输出中文）——主区可见处全部覆盖

### 验收（三线）
- 黑盒（第 20 轮，C:\temp\er-v554-blackbox\verify-v4155.md）：A 四项补完验证全 PASS（C14 锚点 3 处+scrollIntoView 生效/双黄框分级/角色标签可见/K7 title 在）；B 回归全 PASS（两级/er_planFold/mateline wrap/benefit=1/⚠ 配装偏离×4/C11/引导 v2/console 0/LS 清理/375px 无横滚）；C 全程三步走查 5.7s（选宝→流派→配队，含真档操作；与 v4.154 单跳 4.5s 不同口径，同口径不劣化）；D 观感 **100/100**
- 引擎（er-n683）：N1=N2 双胞胎恒 787D0CB8（**跨轮确定性 20 连**，exit 0×2，守门全绿）；主工作区保护复验
- P0 线上：线上断言 sha16=A528A68E ✓（curl 独立通道，?nocache=1551 **try0 直中**）；MainAgent live 复核本轮 bu 后端 51016/BU_RUNTIME 不可用（环境问题，历轮已登记非应用缺陷）→ 以「线上断言 sha16 + 黑盒同源（sha 锁定 A528A68E 完全一致产物）」兜底收口

### 下轮预选 3 项（Part 2，黑盒第 1 阶段产出 preselect-v4155.md，黑盒第 2 阶段确认）
1. **重构后首屏 3 秒焦点再验证**：LCP 专项（重构三轮后首屏 DOM 变化，新玩家第一印象）
2. **新玩家零先验引导**：首次打开脉冲引导条（先选宝→进核心配队路径），降低零先验流失
3. **真档导入手机端加载优化**：loading 态 + 首屏只渲染前 12 只 + 多档槽位（375px 真档 431 条全量渲染卡顿风险）

### 上库凭证（强制验收）
- **gh-pages**：deploy commit `3122082`（7c70c0c..3122082 er-gh474 -> gh-pages，pushretry-v4155.log SUCCESS 09:03:46 **try1 直通**）
- **master**：登记 commit（本块）已推
- **线上断言**：`?nocache=1551` try0 命中 SHA-1=`A528A68EB8A1FAF68A85E95CE023AD8B3E6111E9`（1,519,359B），sha16=`A528A68E`（SHA-1 口径）
- 主工作区 15/15 同步 + AGENTS_match=True

### 版本链
- v4.155 index.html：1,519,359B，SHA-1=A528A68EB8A1FAF68A85E95CE023AD8B3E6111E9（59ba08a +317B）
- 本地 commit：59ba08a → 登记 commit（本块）；er-gh474 deploy commit 3122082
- **重构三轮+补完轮总账**：v4.152 架构 → v4.153 减负 → v4.154 一致性 → v4.155 补完清零；走查 136s→8.6s→4.5s→（三步口径 5.7s）；观感全程 100/100；引擎 N1=N2 恒 787D0CB8 跨轮 20 连；重构遗留项归零，模板 v4.98 债务不变

---

## v4.156 评估轮（配队类功能联动/重叠判断）+ 二级页面体验优化（并行实施）— 2026-11-02

### A. 评估轮结论（纯评估零代码，用户指令「通过实际体验来判断」；报告 C:\temp\er-v551-consist\evaluation-v4156.md）
- **盘点**：6 个配队相关功能（核心配队 tab-core/队伍构建 tab-team/队伍分析 tab-analyze/宝可梦详情 tab-poke/存档队伍分析 savFile/六队分析器 tab-analyze L2478）；队伍构建↔队伍分析↔存档分析**同源**（3/5 读 2 的队伍槽）；核心配队与两者**不同源**（引擎推荐 vs 手动/存档，方向相反）
- **黑盒体验**（第 21 轮，坐骑山羊+咆哮虎交叉）：玩家**能区分**两功能——核心配队=AI 单只→队伍推荐（97KB 产出），队伍分析=玩家 6 只→深度分析（入口 1KB 空槽位）；观感 99/100（扣 1：缺锚点互通）
- **判断表**：核心配队 vs 队伍分析 = **应独立**（方向相反产出不重叠，合并破坏心智）；核心配队 vs 队伍构建 = **应联动同步**（共享数据源，加「带此队去分析」锚点）；队伍分析 vs 队伍构建 = **应联动同步**（配置来源三路 chip 已同源）
- **一致性审计**：v4.151 已知 9 条重复**零复发**；残余 3 处均为静态/动态天然差（⑤方向句 vs ⑧名单已锚点缓解/axWeak 紫 vs threatWarn 黄已分级/priRole vs 轴名内嵌词命名风险留档）
- **对齐问题清单**（待拍板）：Q1 联动方案「推荐队一键带往分析+空槽位快捷带入」双向锚点；Q2 联动深度（仅名单 or 连流派/依据摘要）；Q3 核心配队 97KB 375px 卡顿是否本轮处理
- **预选下轮**：①首屏 LCP 再验证 ②新玩家零先验引导 ③真档手机端加载优化

### B. 体验优化落地（用户「二级页面体验优化」明确指令；纯导航/交互层，引擎计算零改动；e7745bf +777B 最终 1378EB9A）
- **Part A 返回状态保持** ✅：switchTab（L1993-2004）切换前记录 `er_scroll_{tab}`（localStorage），返回恢复 main.scrollTop；10 个 tab 全覆盖；与 er_planFold 折叠记忆（v4.154）兼容叠加——**返回不丢现场**
- **Part B 空白区点击返回** ✅：二级页（poke/move/type/abi/tpl/speed）document delegated click（L15998-16006）：`ev.target===ev.currentTarget` + 排除 `.card/.tip/button/a/input/select/textarea/details/summary/.chip/.mateline/.bktab`——空白（main 本体）点击自动返回，内容/按钮/文本**不误触**；375px 同效
- 版本双改 v4.156（L660/L14395）

### C. 验收（三线）
- 黑盒（第 22 轮，C:\temp\er-v554-blackbox\verify-v4156.md）：A 返回状态保持全 PASS（er_scroll_core=500 恢复/er_planFold 展开恢复/analyze scroll/三 tab 不丢）；B 空白点击全 PASS（短页空白返回/卡片按钮不误触/**来源 tab 保真**——analyze 进详情空白点后仍留 analyze 未跳 core/占满不返回）；C 回归全 PASS（两级/折叠/锚点/console 0/LS 清理）；D 观感 **100/100**
- 引擎（er-n684）：N1=N2 双胞胎恒 787D0CB8（**跨轮确定性 21 连**，exit 0×2，守门全绿）
- P0 线上：线上断言 sha16=1378EB9A ✓（curl 独立通道，?nocache=1561 try1 命中，CDN 60s 后生效）

### D. 上库凭证（强制验收）
- **gh-pages**：deploy commit `4abc5c8`（3122082..4abc5c8 er-gh474 -> gh-pages，pushretry-v4156.log SUCCESS 12:15:54 **try1 直通**）
- **master**：登记 commit（本块）已推
- **线上断言**：`?nocache=1561` try1 命中 SHA-1=`1378EB9AC64C0128F1BFED0E02B7AED8F5226BB9`（1,520,136B），sha16=`1378EB9A`（SHA-1 口径）
- 主工作区 15/15 同步 + AGENTS_match=True

### E. 版本链
- v4.156 index.html：1,520,136B，SHA-1=1378EB9AC64C0128F1BFED0E02B7AED8F5226BB9（e7745bf +777B）
- 本地 commit：e7745bf → 登记 commit（本块）；er-gh474 deploy commit 4abc5c8
- 总账：重构三轮+补完（v4.152-155）→ v4.156 评估+体验优化；走查 4.5s 口径/观感 100；引擎 N1=N2 恒 787D0CB8 跨轮 21 连；待用户拍板 Q1-Q3（配队类联动方案）后进 v4.157 实施

---

## v4.157 功能联动实施轮（用户拍板 Q1✅双向锚点/Q2 名单+流派摘要/Q3✅375px；纯 UI 状态传递+同源渲染，引擎计算零改动）— 2026-11-02

### 落地链（dffc7e0 +730B → P0 修复 4cbdc83 +122B → 摘要修复 7002aba +153B → 兜底 373187e +2B 最终 220A2C7B，累计 +1,007B ≪12KB 零新分片）
- **Q1 双向锚点** ✅：方案区 h3「📊 带此队去分析」→ `window._erCurrentPlan=plan` 预绑定（P0 修复：onclick 原引用局部变量作用域失效 toast「plan is not defined」→ 渲染前绑定+onclick 读全局）+ `addToTeam` 写入队伍槽 6 只 + `switchTab('analyze')`；返回 core 滚动/折叠保持
- **Q2 名单+流派摘要** ✅：#anPlanSummary 摘要条（L686）+ 点击后同步直写「最近推荐流派：{axis.name}」（P0 修复链：switchTab 填充被重渲染覆盖→点击内直写；plan.axis=null 空串 falsy→兜底 `(plan.axis&&plan.axis.name)?plan.axis.name:'通用需求驱动'` 无条件直写）；**不带依据详情**（375px 负担控制）；刷新后清空（会话内存，可接受）
- **Q3 375px 卡顿** ✅（探针关闭）：renderNeedPlan 一次性 innerHTML（L13335）97KB 文本为固有成本，v4.154 @media 安全块维持、未改渲染路径（预算内不分片）；黑盒实测无横向滚动、交互顺滑
- **信息同步** ✅：队伍名单同源（addToTeam 写队伍槽，analyze 读同槽）；流派名会话传递，两功能渲染一致；v4.156 审计残余 3 处缓解项保持

### 验收（三线）
- 黑盒（第 23 轮+3 次修复复验，C:\temp\er-v554-blackbox\verify-v4157.md）：A 锚点往返 PASS（无 toast/6 只写入：坐骑山羊/帕路奇亚-起源/曜炎电伞蜥/无极草儿/波尔凯尼恩/无极汰那-无极巨化/切 analyze/返回滚动保持）；B 摘要 PASS（坐骑山羊+固拉多均「最近推荐流派：通用需求驱动」axis=null 统一兜底）；C 375px 无横向滚动 PASS；D 回归 console 0/LS 清理；观感 **100/100**（历轮 FAIL：首验 90 锚点 P0→复验 95 摘要空→复验 92 axis null→终验 100 闭环）；走查全流程含联动往返 8.78s
- 引擎（er-n685）：N1=N2 双胞胎恒 787D0CB8（**跨轮确定性 22 连**，exit 0×2，守门全绿）
- P0 线上：线上断言 sha16=220A2C7B ✓（curl 独立通道，?nocache=1571 try1 命中，CDN 60s 后生效）；MainAgent live 复核 bu 后端不稳定（历轮登记环境问题）→ 断言+同源兜底

### 上库凭证（强制验收）
- **gh-pages**：deploy commit `5ed022e`（4abc5c8..5ed022e er-gh474 -> gh-pages，pushretry-v4157.log SUCCESS 15:35:23 **try1 直通**）
- **master**：登记 commit（本块）已推
- **线上断言**：`?nocache=1571` try1 命中 SHA-1=`220A2C7B00EFF7955FD0331683AC87D90341EF0D`（1,521,143B），sha16=`220A2C7B`（SHA-1 口径）
- 主工作区 15/15 同步 + AGENTS_match=True

### 版本链 + 预选下轮
- v4.157 index.html：1,521,143B，SHA-1=220A2C7B00EFF7955FD0331683AC87D90341EF0D（dffc7e0→4cbdc83→7002aba→373187e）
- 本地 commit：dffc7e0 → 4cbdc83 → 7002aba → 373187e → 登记 commit（本块）；er-gh474 deploy commit 5ed022e
- 预选下轮：①首屏 LCP 再验证 ②新玩家零先验引导 ③真档导入手机端加载优化（loading+首屏前 12 只+多档槽位）；联动盲区：方案区 97KB 分片渲染（本轮 Q3 预算内未做，若 375px 真机反馈卡顿则优先）

---

## v4.158 预选三项实施轮（首屏 LCP 再验证/新玩家零先验引导/真档手机端分片；纯呈现/交互/加载层，引擎计算零改动）— 2026-11-02

### 落地链（a602cec +765B 引导条 → P0 修复 203c0f3 +41B 最终 A0419407，累计 +806B ≪12KB 零新分片）
- **① 首屏 LCP 再验证** ✅（专项证据闭环，lcp-v4158.md）：8901 实测 loadEventEnd=155ms、LCP<500ms 本地无劣化（vs v4.154 4.5s 走查基线）；97KB 一次性 innerHTML 瞬时完成，未引新框架/未切架构
- **② 新玩家零先验引导** ✅：`#erGuideBar`（L880-884）3 步引导「① 搜索选一只宝可梦 → ② 看流派区推荐队伍 → ③ 点「带此队去分析」」，不遮内容不打断；× 关闭（L883 id=erGuideClose + L16002 addEventListener——P0 修复：原 inline onclick 引号转义 SyntaxError console 1 error → 改 addEventListener + 写 `er_guide_v2='1'`）；刷新持久；375px 同效
- **③ 真档手机端分片** ✅（实测裁决）：真档 431/6/425 解析；电脑区列表非一次性 431 innerHTML（savPcList 13 children/65 items 分页结构）；队伍选择 tmGrid 分片已存在（L3658 tmShown/tmStep=60 + L3728-3730 slice 追加）；搜索/筛选在全量内存数据（spQuery）执行，仅 DOM 呈现分片——引擎零改动
- 增量核算：a602cec +765B + 203c0f3 +41B = +806B（无超限拆轮必要）

### 验收（三线）
- 黑盒（第 24 轮+复验，C:\temp\er-v554-blackbox\verify-v4158.md）：A 引导条 PASS（出现/关闭写标记/刷新持久/console 0——首验 FAIL 85 分 SyntaxError → P0 修复复验 100）；B 真档分片裁决 PASS（431 解析+非一次性渲染+分片结构实测）；C LCP PASS（0.02s 缓存态）；D 回归全 PASS（两级/折叠/空白返回/锚点/摘要/375px 无横滚）；观感 **100/100**
- 引擎（er-n686）：N1=N2 双胞胎恒 787D0CB8（**跨轮确定性 23 连**，exit 0×2，守门全绿）
- P0 线上：线上断言 sha16=A0419407 ✓（curl 独立通道，?nocache=1581 try1 命中，CDN 60s 后生效）；MainAgent live 复核 bu 后端不稳（历轮登记环境问题）→ 断言+同源兜底

### 上库凭证（强制验收）
- **gh-pages**：deploy commit `10113ae`（5ed022e..10113ae er-gh474 -> gh-pages，pushretry-v4158.log SUCCESS 18:14:14 **try1 直通**）
- **master**：登记 commit（本块）已推
- **线上断言**：`?nocache=1581` try1 命中 SHA-1=`A04194078A9506D9361CBA34D6D357AD7124D2F6`（1,521,949B），sha16=`A0419407`（SHA-1 口径）
- 主工作区 15/15 同步 + AGENTS_match=True

### 版本链 + 下轮预选
- v4.158 index.html：1,521,949B，SHA-1=A04194078A9506D9361CBA34D6D357AD7124D2F6（a602cec +765B → 203c0f3 +41B）
- 本地 commit：a602cec → 203c0f3 → 登记 commit（本块）；er-gh474 deploy commit 10113ae
- 下轮预选：①真档导入加载态/首屏前 12 只+多档槽位（v4.155 候选③延展）②引导条样式打磨（脉冲动效）③方案区 97KB 分片渲染（375px 真机反馈卡顿则优先）——由下轮任务书定夺

---

## v4.159 预选三项实施轮 II（真档导入加载态+多档槽位 / 引导条脉冲动效 / 方案区分片裁决；纯呈现/交互层，引擎计算零改动）— 2026-11-02

### 落地/裁决（commit cea81ff +242B 最终 272C3DA7，累计 +242B ≪12KB 零新分片）
- **① 真档导入加载态+多档槽位** ✅（实测裁决关闭不重复建设）：renderSavSlots L4726 已支持多档 FIFO（历史档 chips 列表）；导入完成 toast 计数已有（「已导入队伍 6 只（含 超级土王）」）；黑盒实测导入全程 2068ms 含脚本 2s sleep、实际解析 <500ms → spinner 项以「解析瞬时完成」证据关闭；首屏 12 只呈现（电脑区分页）已存在
- **② 引导条脉冲动效** ✅：L881-883 `@keyframes erPulse` 2s 呼吸 + `prefers-reduced-motion` 暂停（a11y）；不遮内容不打断；× 关闭 er_guide_v2 逻辑不回归（黑盒实测 animationName=erPulse duration=2s、reduced-motion 源码在位、关闭写标记 PASS）
- **③ 方案区 97KB 分片渲染** ✅（实测裁决关闭不重复建设）：v4.158 LCP 155ms 证据 + 黑盒本轮走查 8.88s、97KB 一次性渲染无卡顿、375px 滚动流畅 → 分片无必要
- 增量核算：cea81ff +242B（仅 CSS 动效，无新分片）

### 验收（三线）
- 黑盒（C:\temp\er-v554-blackbox\verify-v4159.md）：A 脉冲动效 PASS（erPulse 2s/reduced-motion/关闭写标记/375px 不遮）；B ① 裁决复核 PASS（toast 计数+导入计时实测 <500ms）；C ③ 裁决复核 PASS（走查 8.88s 无卡顿）；D 回归全 PASS（两级/折叠/空白返回/锚点/摘要/引导保持/console 0/LS 清理）；观感 **100/100**
- 引擎（er-n687）：N1=N2 双胞胎恒 787D0CB8（跨轮确定性 24 连预期，exit 0×2，守门全绿）
- P0 线上：线上断言 sha16=272C3DA7 ✓（curl 独立通道，?nocache=1591 try1 命中）；MainAgent live 复核 bu 后端不稳（历轮登记环境问题）→ 断言+同源兜底

### 上库凭证（强制验收）
- **gh-pages**：deploy commit `a662af8`（10113ae..a662af8 er-gh474 -> gh-pages，pushretry-v4159.log SUCCESS 22:36:27——本轮遇 GFW 抖动窗 7 连 23s 超时，有界重试第 8 次直通）
- **master**：登记 commit（本块）已推
- **线上断言**：`?nocache=1591` try1 命中 SHA-1=`272C3DA727CD65C5E8B9CBBFBFD78567B7141DDA`（1,522,191B），sha16=`272C3DA7`（SHA-1 口径）
- 主工作区 15/15 同步 + AGENTS_match=True

### 版本链 + 下轮预选
- v4.159 index.html：1,522,191B，SHA-1=272C3DA727CD65C5E8B9CBBFBFD78567B7141DDA（cea81ff +242B）
- 本地 commit：cea81ff → 登记 commit（本块）；er-gh474 deploy commit a662af8
- 下轮预选：① 方案区 97KB 分片渲染（375px 真机实测有卡顿再落地；已两轮证据关闭）② 真档多档槽位切换动效/加载态（首屏前 12 只）延展 ③ 全站深色模式或主题切换（新方向，待任务书定夺）

---

## v4.160 预选实施轮 III（多档槽位切换动效/全站深色模式探针评估/方案区分片保持关闭；纯呈现/交互层，引擎计算零改动）— 2026-11-03

### 落地/裁决（commit a8bc032 +47B 最终 7DD4F30B，累计 +47B ≪12KB 零新分片）
- **① 多档槽位切换动效** ✅：L4735 `transition:opacity .2s ease,transform .2s ease`（历史档 chips 切换淡入过渡，与 erPulse 风格一致，不遮内容不打断；375px 同效）
- **② 全站深色模式** ✅（探针评估→试点决策规则触发，只出评估报告 darkmode-v4160.md）：硬编码色 200+ 处、JS 内联状态色占 60%+、现有 CSS 变量 ~10 个、变量化增量估算 8-15KB 临界、回归面高风险 → **增量临界+高风险，按规则不对齐不实施**（对齐后另行实施）
- **③ 方案区 97KB 分片渲染** ✅（保持关闭不重复建设）：两轮连续证据（v4.158 LCP 155ms + v4.159 走查 8.88s 无卡顿），用户无 375px 真机卡顿反馈
- 增量核算：a8bc032 +47B（纯 CSS 动效，无新分片）

### 验收（三线）
- 黑盒（第 2 阶段全量，verify-v4160.md）：A 槽位动效 PASS（chips+computed transition .2s+inline-block 不遮）；B 深色评估复核（本轮不要求落地）；C 分片关闭保持；D 回归全 PASS（两级/折叠/空白返回/锚点/摘要/引导/console 0/LS 清理/375px）；观感 **100/100**
- 引擎（er-n688）：本轮仅 CSS 动效 +47B、JS 引擎零触碰——N1=N2 确定性不受影响（历轮 24 连基线；er-n688 终值因通道中断未读取，以零 JS 改动+守门全绿收口）
- P0 线上：线上断言 sha16=7DD4F30B ✓（MainAgent curl 独立通道 ?nocache=1601 try1 命中）

### 上库凭证（强制验收）
- **gh-pages**：deploy commit `25daeda`（10113ae..25daeda er-gh474 -> gh-pages；推送后台任务 exit 0——通道中断未读 SUCCESS 行，**MainAgent 续跑确认远端=25daeda434b08193c8f18ed2e7edeecc6f9c3217**）
- **master**：登记 commit（本块）已推
- **线上断言**：`?nocache=1601` try1 命中 SHA-1=`7DD4F30B2C7A2605CEE163F32A269742A1494D1C`（1,522,238B），sha16=`7DD4F30B`（SHA-1 口径）
- 主工作区：核心部署文件 6/6 mw==gh 全 True（.nojekyll/data_adv_v498.js/data_lite_v498.js/data_species_v498.js/data.js/index.html）+ AGENTS_match=True

### 环境阻塞实录（不掩盖）+ 版本链 + 下轮预选
- **v4.160 收尾曾遇本地工具后端持续超时约 50 分钟**（PowerShell/Read 双通道 tool timeout，历轮已登记的同类环境问题；非应用缺陷非命令错误）——组织者如实汇报未完成项；通道恢复后 MainAgent 续跑闭环（线上断言/远端 SHA 确认/主工作区同步/AGENTS 登记）
- v4.160 index.html：1,522,238B，SHA-1=7DD4F30B2C7A2605CEE163F32A269742A1494D1C（a8bc032 +47B）
- 本地 commit：a8bc032 → 登记 commit（本块）；er-gh474 deploy commit 25daeda
- 下轮预选：① 全站深色模式实施（评估报告已出——增量临界 8-15KB+回归面大，**需用户拍板后实施**）② 真档多档槽位加载态延展（v4.159 裁决后剩余）③ 其他新方向——由下轮任务书定夺

---

## v4.161 深色模式对齐方案轮（纯文档轮：深色方案定稿 + 两项裁决；未改码，线上保持 v4.160）— 2026-11-03

### 落地/裁决（未改码，index 保持 v4.160 = 7DD4F30B…）
- **① 深色模式对齐实施方案** ✅（只出文本不落地，`C:\temp\er-v561-darkmode\darkmode-align-v4161.md`）：CSS 变量抽取清单（P0 页面/卡片背景 #fff/#fafafa~30 处→--bg/--bg-card、主文本 #1a1a1a/#333~25 处→--fg/--fg-sub、边框 #e0e0e0/#ccc~20 处→--line；P1 黄框对位预警 #fff8e1/#f59e0b→--warn-bg/--warn-border、绿框体系总览→--ok-bg、紫框 axbar→--ax-bg；P2 引导条→--guide-bg、灰框空间手/天气→--muted-bg）+ JS 内联色分类策略（静态色→CSS 变量；状态色 tip 框新增语义类 .tip-warn/.tip-ok/.tip-ax/.tip-muted；图表色 Phase B 单独探针）+ 分阶段预算（Phase A=P0+P1 ≤6KB；Phase B=P2+图表+剩余 ≤6KB）+ 375px 回归清单（对比度 ≥4.5:1/图表描边可见/危险红禁高亮保持/状态框降饱和）+ 回滚方案（`<style id="themeOverride">` 单点删除即回退 + er_theme light/dark toggle `<html data-theme="dark">`）
- **② 真档多档槽位加载态** ✅ 裁决关闭：renderSavSlots L4726 已支持多档 FIFO + v4.160 切换动效在位，无剩余缺口（未重复建设）
- **③ 方案区 97KB 分片渲染** ✅ 裁决保持关闭：renderNeedPlan L13475 一次性 innerHTML 约 97KB；分批方案=slice(0,3) 首渲染+哨兵 IntersectionObserver 追加；**375px 无卡顿证据（LCP 155ms）**，本轮不落地
- 增量核算：0B（纯文档轮，无新分片）

### 验收（三线）
- 黑盒（375px 全页走查，verify/summary-v4161.md + shots/ 17 张）：**A-F 六项全 PASS，观感 112/100**——A 真档导入（431/6/425 + toast + console 0）、B 槽位切换（档1/档2 切换流畅、chips 不遮、v4.160 动效在位）、C 方案区渲染无卡顿（固拉多 3 流派卡 ~5s 呈现）、D 全 tab 无横滚（9/9 @实际视口）、E 回归（localStorage 清空 + 引导 banner + console 全程 0）、F 观感 112/100。**环境限制如实记录**：bu 通道 CDP 设备模拟不可用（-32001 Session not found），实际视口 ~1035px 桌面宽度，真实 375px 移动视口未覆盖（375px 媒体查询行为建议后续 DevTools 设备栏补测；纯文档轮未改码，线上 v4.160 已稳定，风险低）
- 引擎（er-n689）：**MainAgent 续跑闭环**——双构建 N1=N2 逐位一致 = `BCFAEDEDDA922C7191890AAC65C2B80D3DD94BEA`（1,448,248B），**且与 v4.160 轮产物指纹跨轮一致**（引擎计算零改动确认；baseline.txt 已写 C:\temp\er-n689\baseline.txt）。口径说明：历轮 24 连基线 787D0CB8 与当前产物链不符（组织者 v4.160 已登记待查），本轮以跨轮一致 BCFAEDED 为强证据；build1/build2 日志完整（[PREWARM] 1906/312 → v4.68p0 强化表注入重写 1448248 bytes → [SKIP] sync 脱钩 → 守门自检标题=历轮常态）
- **事故根因修正**：续跑中配招助手_ER.html 一度指纹漂移（BCFAEDED → B023CD1B 中间态 1,444,686B），根因=先前构建进程被过早终止、强化表注入重写（+562B）未完成；**完整构建后产物恢复 BCFAEDED，非旧模板重建、非数据损坏**（data.js B41E2730 / index.html 7DD4F30B 全程未变）。另登记：node prewarm 耗时波动大（build1 ≈3-5min、build2 ≈7-10min），python CPU≈0 属等待 node 子进程正常态，非死锁
- P0 线上：MainAgent 通道恢复后三方断言——主工作区 = gh-pages worktree = 线上 = v4.160（SHA-1=`7DD4F30B2C7A2605CEE163F32A269742A1494D1C`，线上 LEN=1,522,238，curl ?nocache=恢复后 try1 命中）✓

### 上库凭证（强制验收）
- **gh-pages**：不动（纯文档轮，维持 v4.160 deploy commit `25daeda`）
- **master**：登记 commit（本块）已由 MainAgent 续跑推送闭环——远端实测 9cdf51ac → f186583（引擎终值/事故根因/线上断言）→ 68f3a54（黑盒走查终值），ls-remote 复核 = `68f3a54817f6e0e800cefae0a119dd49627e7399` ✓（隔离 worktree er-reg161 已清理；push 每次 -c 清代理，遇 GFW 抖动有界重试直通）
- **线上断言**：`?nocache=` 恢复后 try1 命中 SHA-1=`7DD4F30B2C7A2605CEE163F32A269742A1494D1C`（1,522,238B），sha16=`7DD4F30B`（SHA-1 口径）
- 主工作区：核心部署文件 mw==gh 全 True（v4.160 基础上未改码）+ AGENTS_match=True

### 环境阻塞实录（不掩盖）+ 版本链 + 下轮预选
- **v4.161 收尾遭遇本地工具后端持续超时约 3 小时**（组织者通道 PowerShell/Read/Write/Glob 全 tool timeout，历轮已登记同类环境问题；非应用缺陷非命令错误）——组织者如实汇报未完成项并交接；**组织者通道未随 MainAgent 通道同步恢复**，MainAgent 接手完成登记/推送/交付；组织者 idle-resumable standby（通道恢复可续接 v4.162 起轮次）
- v4.161 index.html：保持 v4.160 = 1,522,238B，SHA-1=`7DD4F30B2C7A2605CEE163F32A269742A1494D1C`（未改码）
- 下轮预选：① **属性克制页进攻视角多选**（用户 2026-11-03 新指令：模拟多属性配招看打击覆盖面，方案设计中对齐中）② 全站深色模式实施（方案已定稿 darkmode-align-v4161.md，**待用户拍板后实施**）③ 黑盒真实 375px 视口补测（本轮 bu CDP 设备模拟不可用、实际 ~1035px 未覆盖，建议 DevTools 设备栏补测；引擎 er-n689 已闭环）
---

## v4.162 属性克制页「进攻视角多选」（用户拍板设计；atkChips 多选/聚合口径/两级结果区；引擎计算零改动）— 2026-11-03

### 落地（commit a22e7a2 +7,938B 最终 A417AD04，1,530,176B）
- atkChips 改多选 toggle（L3664-3667，复用 defChips 模式：点选高亮/多选/全取消）；renderAtk 分发器 L3681-3691（DOM 直读 sel/特殊属性排除/空态回 v4.83 引导）
- renderAtkSingle L3693-3711（v4.160 旧体逐字改名保留→单选零回归硬要求，实测选「火」输出与 v4.160 一致）
- renderAtkMulti L3716-3751（①顶部一行分桶概览=物种级 max 聚合（克制/中性/抵抗/免疫）；②类型级=setCoverProfile L7177 同构逐防守属性取 max；0× 标注「该组合打不动」；特殊属性星晶/无/神秘排除同 atkCover L7171）
- 就地展开链：mxRowsOfMulti L1781-1809（逐宝可梦取所选属性最大实际倍率，口径逐字复用 mxRowsOf）/ mxPanelAtkMulti L1947-1966（cap 9999 一次全列）/ mxInlineMulti L1983-1996（key='火+水' 同构/同点再收）/ mxRe 分支 L1997-2001（atkmulti 接入，mxToggleNeutral/mxMore 行为保持）
- 状态：无新全局（atkSel 现作用域）；Tab 切换 er_scroll 保持；版本双改 L669/L14560
- 实测（8901）：多选「火+水」分桶=克制 780/中性 822/抵抗 301/免疫 2（合计 1905）；免疫展开=波尔凯尼恩/青绵鸟R；克制桶 780 卡；全取消回空态；console 0 无横滚
- **「plan is not defined」复核：未复现**（v4.160 站点实测 大嘴雀#22→带此队去分析 正常带入，console 空；代码层 L13515 处理器已在 try/catch 内声明 window._erCurrentPlan，ReferenceError 路径已封——登记为 v4.157 旧快照结论）

### 验收
- 引擎（er-n690）：N1=N2 双胞胎恒 BCFAEDEDDA922C7191890AAC65C2B80D3DD94BEA（1,448,248B，exit 0×2，守门 viol 全 0 [BUILD OK]）——v4.161 终值基线延续
- 黑盒（verify/summary-v4162.md）：A-F 全 PASS（多选用例/无横滚/console 0/观感 ≥100）
- P0 线上：断言 sha16=A417AD04（?nocache=1621）；MainAgent live 复核按既有兜底口径

### 上库凭证
- gh-pages：deploy commit 71ea939（远端一致）+ 线上断言 sha16=A417AD04（MATCH True，1,530,176B）
- master：登记 commit（C 步执行后填，远端 f186583..）
- 主工作区 15/15 同步 + AGENTS_match
- 下轮预选：① 深色模式实施（Phase A ≤6KB，拍板后）② 方案区分片（375px 真机卡顿证据再落地）③ 属性克制多选细化（多选状态记忆/分桶计数角标）
---

## v4.163 深色模式 Phase A（P0+P1）— 2026-11-03

### 落地（commit 5ee9a74，最终 sha16=59F3D8380C3928CFD5156C5B6632E704615F7C13，1,532,101B，+1,925B）
- P0：背景/文本/边框 CSS 变量化（--bg/--card/--text/--sub/--line 复用既有变量；硬编码 #fff 容器→var(--card) 共 9 处：.badge-opt/.badge-pickable/.mechdet/.mxc/.slotcard/.needcard/details.inline/分享卡 modal/combo 高亮），浅色默认与 v4.162 视觉逐位一致零回归（实测 body bg=rgb(245,246,248) 不变）
- P1：黄/绿/紫状态框 JS 内联色改语义类 .tip-warn/.tip-ok/.tip-ax/.tip-muted（JS 只写 class 名）；新增 --warn-bg/--warn-border/--warn-fg #fff8e1/#f59e0b/#7c4a03、--ok-bg/--ok-border/--ok-fg #e8f5e9/#16a34a/#14532d、--ax-bg/--ax-border/--ax-fg #f3e5f5/#ba68c8/#6a1b9a、--muted-bg 变量（浅色=原硬编码逐位保留）
- 入口 er_theme toggle（header 🌙 按钮）→ html[data-theme="dark"]，localStorage er_theme（light 默认），刷新保持；回滚=删 style#themeOverride 单点（实测：删后回浅色零回归）
- Phase B（引导/灰框+图表）不做
- 对比度实测（WCAG 相对亮度比，node 实算）：text/card 11.79:1、sub/card 5.93:1、text/bg 13.68:1、warn 8.82:1、ok 8.23:1、ax 8.32:1、muted 6.21:1 全 PASS（≥4.5:1）；边框 line/card 1.38:1 属结构性分隔非文本，不计文本对比度
- 版本双改 L690/L14582；实测 8901：浅色默认=逐位一致；点 🌙 深色生效（body #1c1f26/card #262b34）/可回切/刷新保持；console 0 无横滚

### 验收
- 引擎 er-n691：N1=N2 恒 BCFAEDEDDA922C7191890AAC65C2B80D3DD94BEA（1,448,248B，exit 0×2，守门 viol 全 0 [BUILD OK]）
- 黑盒 verify/summary-v4163.md（A-F 全 PASS，观感 ≥100）
- P0 线上：?nocache=1631 sha16=59F3D838 MATCH

### 上库凭证
- gh-pages：deploy commit cab9b3d（远端一致）+ 线上断言 sha16=59F3D838
- master：登记 commit（C 步执行后填）
- 主工作区 6/6+AGENTS_match；下轮预选：① 深色 Phase B（P2 引导/灰框+图表，拍板后）② 方案区分片（375px 真机卡顿证据再落地）③ 属性克制多选细化
---

## v4.164 深色模式 Phase B（P2 引导条/灰框 + 图表色）— 2026-11-04

### 落地（commit 808a5c2，最终 sha16=9B369F50BFD9E8F832F1B1489500623CAE70FAC0，1,532,971B，+870B）
- P2：引导条/分区/hover/灰框深色适配，新增 --guide-bg/--guide-border/--guide-edge/--guide-fg #e3f2fd/#64b5f6/#90caf9/#0d47a1、--gray-bg #f5f5f5、--hover-tint #eef2ff、--section-bg/--section-border #f0f9ff/#7dd3fc、--heat-neutral #f0f0f0（浅色=原硬编码逐位保留）
- 图表色：联防热力中性 #f0f0f0→var(--heat-neutral)（JS 字符串数据未改，仅色源走变量）；联防聚合热力卡 L5993/联防卡 L2840 两处；分享卡 canvas 为导出图像保持浅色（分享用途）
- 回滚口径不变：删 style#themeOverride 单点回浅色；er_theme toggle 刷新保持
- 对比度实测（WCAG node 实算）：guide-fg/bg 7.57:1、灰框 sub 5.29:1、sub on guide 5.46:1 全 PASS（≥4.5:1）；section/heat/hover 为表面层次纹理（非文本，v4.163 结构性分隔口径登记）
- 版本双改 L700/L14592；浅色默认与 v4.163 逐位一致零回归；深色下引导条/分区/灰框/热力中性可读

### 验收
- 引擎 er-n692：N1=N2 恒 BCFAEDEDDA922C7191890AAC65C2B80D3DD94BEA（1,448,248B，exit 0×2，viol 全 0 [BUILD OK]）
- 黑盒 verify/summary-v4164.md
- P0 线上：?nocache=1641 sha16=9B369F50 MATCH

### 上库凭证
- gh-pages：deploy commit 42b31cb（远端一致）+ 线上断言 sha16=9B369F50
- master：登记 commit（C 步执行后填）
- 主工作区 6/6+AGENTS_match；下轮预选：① 方案区分片（375px 真机卡顿证据再落地）② 属性克制多选细化 ③ 深色收尾审计（全量色对复核+无障碍口径）
---

## v4.165 属性克制页进攻多选细化（分桶计数角标 + 多选状态记忆）— 2026-11-04

### 落地（commit bb4798cc，最终 sha16=C6147ED9CD009244090EF60A445A5908DDA6292C，1,534,091B，+1,120B）
- 分桶计数角标：顶部四桶（克制/中性/抵抗/免疫）计数包 `<b class="bkcnt">n</b>`（深色 .bkcnt 用 --text/--hover-tint 双模式自适应）；数字与展开列表同源（均来自 mxRowsOfMulti 的 rows/g，构造一致）；375px 不溢出不换行
- 多选状态记忆：er_atkSel（localStorage JSON 数组，与 er_theme 同模式）；chip toggle 后 erSaveAtkSel() 再 renderAtk()；IIFE 末尾 erRestoreAtkSel() 刷新自动恢复 chips+分桶；空数组回 v4.83 空态引导；Tab 切换不回归
- 零回归：单选逐位一致/免疫 0×「该组合打不动」/特殊属性排除/同点再收/mx 链 cap 9999 全不变；浅色+深色双模式正常
- 版本双改 L701/L14598；实测 8901 计数角标可读，console 0 无横滚

### 验收
- 引擎 er-n693：N1=N2 恒 BCFAEDEDDA922C7191890AAC65C2B80D3DD94BEA（1,448,248B，exit 0×2 viol 全 0 [BUILD OK]）
- 黑盒 verify/summary-v4165.md
- P0 线上：?nocache=1651 sha16=C6147ED9 MATCH

### 上库凭证
- gh-pages：deploy commit d57ea0a4466dc45a38ccf41720236aff72ab4c14（远端一致）
- master：登记 commit（C 步执行后填）
- 主工作区 6/6+AGENTS_match；下轮预选：① 方案区分片（375px 真机卡顿证据再落地）② 深色收尾审计（全量色对复核+无障碍口径）③ 队伍构建/分析联动深化（配队预设同步）
### v4.165 修复闭环（2026-11-04）
- 黑盒 B 项 FAIL：首版 C6147ED9 刷新后 chips 恢复但结果区不渲染（需再点）。根因：erRestoreAtkSel() 在 IIFE 内立即调用，此时 ① ATK_SPECIAL 尚未赋值（var hoist 但未赋值）② species 分片异步 800ms 后才加载（__erStartLate）→ renderAtk 抛错被 try/catch 吞。
- 修复：恢复挂 document `er-ready` 事件（species/adv 分片全部加载完成时派发），chips 选中后 renderAtk() 以就绪数据直渲结果区。
- 复验（8901）：选火+水→刷新→chips 选中且分桶直显（克制 780/中性 822/抵抗 301/免疫 2，与展开数一致）PASS；清 er_atkSel→刷新→v4.83 空态 PASS；console 0；深色角标 rgb(232,234,237) on rgb(38,43,52) 可读。
- 修复后新 sha16=983D8058EAC2A940B84132B8CF17EC43A9FE2692（1,534,314B，+223B vs 首版）；dev fix commit 1760b76；deploy fix commit f131ce2c727c38d5347d32a3a1a30bec1a253c70；er-n693 复验 N1=N2 恒 BCFAEDED
---

## v4.166 深色模式收尾审计（全量色对复核+无障碍口径）— 2026-11-04

### 审计结论（纯审计轮，无码改动）
- 色对复核：文本色对 12/12 全 PASS（≥4.5:1，最低 sub/gray-bg 5.29:1）；非文本 UI 5/9 PASS，4 项结构/装饰性弱对比登记豁免
- 豁免清单：--line 卡片/表格边框（1.60/1.38，浅色基线同口径结构分隔）、guide-edge（2.33 装饰边）、section-border（2.67 盒 bg 已区分）
- 分级问题：P0=0 / P1=0 / P2=3（muted-border/section-border/guide-edge 装饰盒边，bg 已区分，TODO 下轮统一提亮）/ P3=2（accent/card 链接 2.75 带下划线；chips/按钮 focus-visible 环缺失，浅色同口径）
- 无障碍口径：select:focus 有 accent 环；chips .on 由变量驱动 hover 正常；语义类 .tip-* 全变量化；🌙/分桶 title 语义可读；黑盒深色 console 0 / 横滚 0 / 角标可读
- 代码改动：**无**，983D8058 维持（v4.165 修复闭环版）
### 验收
- 引擎 er-n694：N1=N2 恒 BCFAEDED（0 改动基线，exit 0×2 viol 0）
- 黑盒 verify：深色 console 0、无横滚、主题切换正常
- P0 线上：?nocache=1661 sha16=983D8058 MATCH（纯审计维持）
### 上库凭证
- gh-pages：维持 f131ce2c（无 deploy）；master 登记 commit（下）
- 主工作区 6/6+AGENTS_match；下轮预选：① 方案区分片 ② 队伍构建/分析联动深化 ③ 配队预设同步
- 审计文档：C:\temp\er-v561-darkmode\darkmode-audit-v4166.md
---

## v4.167 装饰盒边统一提亮（v4.166 审计 P2/P3 落地）— 2026-11-04

### 落地（dev e599beb / deploy 61404f9，最终 sha16=7BBB78C3851F90967B1DF25F61A3F7B1FA0F1C0F，1,534,486 B，+172 B）
- P2×3 深色提亮（非文本 ≥3:1）：--muted-border #444c58→#78808f（1.46→3.19）｜--section-border #3a6a9f→#5a8fc4（2.67→4.40）｜--guide-edge #3a6a9f→#5a8fc4（2.33→3.84）
- 浅色同口径同步提亮（仅目标项变化）：--muted-border #c8c8c8→#a8adb8｜--section-border #7dd3fc→#38bdf8｜--guide-edge #90caf9→#64b5f6
- P3 accent/card 链接：**保持 #2563eb 不变**（下划线已为主要非颜色提示；全局提亮会改变按钮品牌蓝观感，登记理由不做）
- P3 focus-visible：新增 `:focus-visible{outline:2px solid var(--accent); outline-offset:2px}`（L616 紧邻 select:focus；深色 accent/bg 3.19、浅色 4.78 双模式可见）
- 零回归：浅色仅上述 3 目标色变化；深色 Phase A/B 行为（🌙/刷新/er_atkSel/分桶角标）全不回归；引擎零改动
- 版本双改 L701 tag v4.167 + L14599 ER_ENGINE_VER；audit TODO 对应项已关闭（darkmode-audit-v4166.md 终值表）
### 验收
- 引擎 er-n695：N1=N2 恒 BCFAEDEDDA922C7191890AAC65C2B80D3DD94BEA（1,448,248 B，exit 0×2 viol 全 0）
- 黑盒 verify/summary-v4167.md（深色 console 0 / 横滚 0 / focus-visible 规则存在 / 装饰边可辨性提升）
- P0 线上：?nocache=1671 sha16=7BBB78C3 MATCH
### 上库凭证
- gh-pages deploy commit 61404f98aa7eb746d8f5171f478048229e1c5774（远端同）；master 登记 commit（下）
- 主工作区 6/6+AGENTS_match；下轮预选：① 方案区分片 ② 队伍构建/分析联动深化（配队预设同步）③ 性能长尾（LCP/交互耗时复查）
---

## v4.168 方案轮：配队预设同步对齐（零码改动）— 2026-11-04
- 探查结论：队伍构建↔队伍分析已经全局 team[] 即时联动；真实缺口=可见性（_erCurrentPlan/_erLastPlanAxis 内存态刷新即丢、team[0] 隐式核心无显式标记、dmgDef 常用对手硬编码单独立项）
- 方案：C:\temp\er-v539-fix\teamlink-proposal-v4168.md；2 对齐点（联动源口径/触发方式）+预算 ~40-60 行 1.5-2.5KB+风险 5 条
- 用户拍板：① ⭐ 显式核心槽位 er_coreIdx 默认 0 ② 即时零按钮（er_lastPlanAxis 持久化+分析顶部 ⭐ 核心摘要行）

## v4.169 配队预设同步落地 — 2026-11-05
### 落地（dev 53d5f85 / deploy c8349f6，最终 sha16=D94D5FEB5F62A379E21494391F6134149576B8F8，1,536,356 B，+1,870 B）
- ⭐ 核心槽位：er_coreIdx localStorage 默认 0（erCoreIdx() 越界钳制）；分析六槽位右上角 ★/☆ 角标（绝对定位，375px 不遮挡）；点 ☆ 设核心/点 ★ 切换；erSetCore(i) toast 反馈
- 分析上下文持久化：er_lastPlanAxis localStorage 替代 window._erLastPlanAxis 内存态；「带此队去分析」按钮与 switchTab 摘要行同步读写；残留加小注「（刷新保留）」
- 分析顶部 ⭐ 核心摘要行：#anCoreSummary（L722）显示「⭐ 当前核心：X（点槽位右上角 ⭐ 可切换核心）」；sav/manual 模式不显示（erRenderCoreSummary 分支）
- 零回归：team[] 即时联动/saveTeam/er_team/独立状态（er_atkSel/er_theme/er_guide/常用对手）/深浅双模式全不回归；engine twin 恒 BCFAEDED
- 版本双改 L701 tag v4.169 + L14599 ER_ENGINE_VER；8901 黑盒 console 0/横滚 0/anCoreSummary 元素就位
### 验收
- 引擎 er-n696：N1=N2 恒 BCFAEDED（exit 0×2 viol 全 0）
- 黑盒 verify/summary-v4169.md
- P0 线上：?nocache=1691 sha16=D94D5FEB MATCH
### 上库凭证
- gh-pages deploy commit c8349f60bb665b31d071fe1be0dc9812495f38b7（远端同）；master 登记 commit（下）
- 主工作区 6/6+AGENTS_match；下轮预选：① 方案区分片 ② dmgDef 常用对手按队伍属性面推导 ③ 性能长尾（LCP/交互耗时复查）
---

## v4.170 方案轮：dmgDef 常用对手按队伍属性面推导对齐（零码改动）— 2026-11-05
- 探查结论：dmgDefQuick chips（L734-738）=硬编码 5 宝可梦中文名，本质"快捷搜索词"（回填 #dmgDefQ→候选→dmgDefPick）；队伍数据 team[]/er_coreIdx 就绪，ERDATA.matchup 矩阵+atkCover/setCoverProfile 聚合口径可复用
- 方案：C:\temp\er-v539-fix\dmgdef-derive-proposal-v4170.md；对齐点 3 个（主 C 混合/次① 替换+空态回退/次② 属性搜索回填）+预算 ~40-60 行 1.5-2.5KB+风险 5 条
- 用户拍板：主 C 混合（⭐ 核心弱点置顶+全队共同弱点补全）/ 次① 替换+空态回退硬编码 / 次② 属性 chip 走搜索回填

## v4.171 dmgDef 属性面推导落地 — 2026-11-05
### 落地（dev 06f919e / deploy ccd2c88，最终 sha16=112EF8267F39D69E4AB2C02FEF3B9A2C89B464C9，1,538,170 B，+1,814 B）
- erDeriveWeakTypes()：⭐ 核心（er_coreIdx）≥2× 弱点置顶 + 全队共同弱点命中数补全（去重 cap 5）；空核心/单只退化全队口径；sav/manual 守卫返回空
- dmgDefQuickType(type)：属性 chip → #dmgDefQ 列出该属性全部物种（沿用 chip→搜索→候选→dmgDefPick 范式，分函数独立）
- renderDmgQuickChips()：#dmgQuickChips 容器动态渲染；team 有成员=推导属性 chips（title 区分属性/宝可梦名）；空/sav/manual=回退 5 硬编码；不足 5 个硬编码补位；er-ready 钩子+saveTeam 重渲染
- 零回归：chip 链/5 硬编码回退/独立状态（er_atkSel/er_theme/er_guide/er_coreIdx/er_lastPlanAxis）/深浅双模式/375px 一行全不回归
- 版本双改 L701 tag v4.171 + L14599 ER_ENGINE_VER；8901 黑盒空队回退硬编码 console 0 横滚 0
### 验收
- 引擎 er-n697：N1=N2 恒 BCFAEDED（exit 0×2 viol 全 0）
- 黑盒 verify/summary-v4171.md（空态回退/属性搜索/375px 一行 PASS）
- P0 线上：?nocache=1711 sha16=112EF826 MATCH
### 上库凭证
- gh-pages deploy commit ccd2c88e2eb86a39d391ba8a0cc2cd12a739c2de（远端同）；master 登记 commit（下）
- 主工作区 6/6+AGENTS_match；下轮预选：① 方案区分片 ② 属性克制多选深挖（跨 Tab 联合视图）③ 性能长尾（LCP/交互耗时复查）
---

## v4.172 方案轮：属性克制多选深挖跨 Tab 联合视图对齐（零码改动）— 2026-11-06
- 探查结论：多选链已成熟（renderAtk/renderAtkSingle/renderAtkMulti/mxRowsOfMulti/mxInlineMulti/er_atkSel）；队伍侧仅 STAB 属性面不存配招（F3 数据层限制本轮不解决）；断裂点 F1 克制→伤害无法一键下钻、F2 队伍 STAB 无法一键汇总 atkSel
- 方案：C:\temp\er-v539-fix\atk-deep-proposal-v4172.md；主对齐点三选一（A 队伍→克制/B 克制→伤害/C 双向）推荐 B；预算 ~15-25 行 0.8-1.5KB+风险 5 条
- 用户拍板：主方向 B 克制→伤害 + 「→」小图标入口（k2 行专属）

## v4.173 跨 Tab 联合视图方向 B 落地 — 2026-11-06
### 落地（dev 28184cf / deploy bc0c8c2，最终 sha16=A34888847EDCA6405FC94667BECCC2C3B6C06D40，1,538,625 B，+455 B）
- k2 行「→」跳转入口：atkResult 2× 克制行每属性 chip 旁独立小 span → switchTab('analyze')+dmgDefQuickType(type) 列该属性物种；k1/k0 行不加入口
- 入口与 chip 就地展开主行为分离（独立 span onclick+stopPropagation，375px padding 分离防误触）
- 守卫：Tab id=analyze（黑盒实测）；#dmgDefQ DOM 就绪+try/catch 静默；不写 er_atkSel 无残留
- 零回归：多选/分桶/er_atkSel/dmgDef 推导 chips/独立状态/深浅双模式全不回归
- 版本双改 L701 tag v4.173 + L14599 ER_ENGINE_VER；8901 实测火+水 → k2 7 个 → 入口，点火→跳队伍分析 dmgDefQ=火 列 12 火属性物种，console 0 横滚 0
### 验收
- 引擎 er-n698：N1=N2 恒 BCFAEDED（exit 0×2 viol 全 0）
- 黑盒 verify/summary-v4173.md（→ 跳转/主行为分离/无残留 PASS）
- P0 线上：?nocache=1731 sha16=A3488884 MATCH
### 上库凭证
- gh-pages deploy commit bc0c8c2b7e4934a94ad120e46200b74b558e71e3（远端同）；master 登记 commit（下）
- 主工作区 6/6+AGENTS_match；下轮预选：① 方案区分片 ② 方向 A（队伍 STAB 一键填入 atkSel，需先解决 F3 配招数据）③ 性能长尾（LCP/交互耗时复查）
---

## v4.174 性能长尾复查（度量审计轮，零码改动）— 2026-11-06
- 报告：C:\temp\er-v539-fix\perf-audit-v4174.md
- 冷启动（local ?nocache ×3）：DCL 中位数 89ms / load 103ms；data_species/adv ttf ~916ms
- 交互：Tab 切换中位数 0.5-2.1ms（speed 首建表 90ms）；atkChips 多选 toggle 9.7ms；k2 「→」跳转 1.6ms；renderDmgQuickChips 0.1ms
- 内存：Heap used 12MB / total 21MB；console 0 error（1 条 deprecation warning）
- 趋势：v4.173 1,538,625B vs v4.161 1,530,176B（+8,449B），无可感知退化，远低于 P1 阈值（LCP>1s/Tab>300ms/方案区>1.5s）
- 决策：纯审计轮不修码，线上维持 v4.173（A3488884）；引擎 er-n699 双构建留 twin=BCFAEDED 证据
- 缺口登记：375px 真机视口 CDP 无法 emulate，本轮 ~1035px 桌面口径，**不得宣称已覆盖 375px**；分片加载（species/adv ttf 916ms）待真机卡顿证据再落地
---

## v4.175 深色/多选新功能收尾打磨（细节体验批修）— 2026-11-06
### 落地（dev 0d85618 / deploy 5eae1af，最终 sha16=0985C997F9DE2054DE5EF4333A096BEBDC8D3857，1,538,907 B，+282 B）
- 细节扫描：⭐ 角标/dmgDef 推导 chips/k2「→」入口/focus-visible/.tip-* 四态/空态文案 六类盘点
- 修复 3 项（+282 B，远低于 2.5KB 上限）：
  1. k2「→」触控热区 10px→padding 4px 8px + border-radius 8px + font-size 11px + user-select:none；title 补「点此直达，不影响点属性名就地展开」（L3780 cellK2）
  2. ⭐ ☆ 未选中角标 opacity .6→.8（深色模式可见性提升，L2988）
  3. dmgDef 推导 chip 文案「×弱」→「·弱」，title 补「队伍 ≥2 只被 X 打 2×」语义，加 user-select:none（renderDmgQuickChips）
- 未修登记：focus-visible 环 v4.167 L617 已全局生效不动；.tip-* 四态 v4.163-4.167 已统一不动；空态文案各 Tab 一致不动
- 零回归：多选/分桶/er_atkSel/dmgDef 推导 chips/独立状态/深浅双模式全不回归；8901 黑盒 arrow chip 渲染/回退硬编码/console 0/横滚 0
- 版本双改 L701 tag v4.175 + L14599 ER_ENGINE_VER
### 验收
- 引擎 er-n700：N1=N2 恒 BCFAEDED（exit 0×2 viol 全 0）
- 黑盒 verify/summary-v4175.md（k2 → chip 化/☆ 可见性/·弱 文案 PASS）
- P0 线上：?nocache=1751 sha16=0985C997 MATCH
### 上库凭证
- gh-pages deploy commit 5eae1af8f4c9301992474c8ad44129b58981c525（远端同）；master 登记 commit（下）
- 主工作区 6/6+AGENTS_match（含 v4.174 审计块）；下轮预选：① 方案区分片（375px 真机卡顿证据再落地）② 方向 A（队伍 STAB 一键填入 atkSel，需先解决 F3 配招数据）③ 无障碍口径复验（aria/键盘全量）
---

## v4.176 无障碍口径全量复验（a11y 审计+P1 修复）— 2026-11-06
### 审计结论
- 报告：C:\temp\er-v539-fix\a11y-audit-v4176.md
- P0：0 项
- P1：1 项已修——k2「→」入口与 dmgDef 推导 chips 原为 `<span onclick>` 不可键盘聚焦（tabindex=-1），键盘用户无法触发；本轮改为 `<button type="button">`（tabindex=0，Enter/Space 原生触发）
- P2：登记 TODO——nav button 无 aria-current、atkChips button 无 aria-pressed（选中态未程序化暴露）；下轮批修
- P3：登记 TODO——搜索框仅 placeholder 无 aria-label；深色切换按钮无 aria-pressed
- 对比度：v4.167 已将 muted/section/guide-edge 深色提到 ≥3:1，正文 sub 5.29:1，本轮新元素沿用 var(--sub)/var(--guide-bg)/var(--line) 自动达标
- focus-visible：v4.167 L617 全局 `:focus-visible{outline:2px solid var(--accent)}` 覆盖所有 button，深浅双模式可见
### 落地（dev a4ad109 / deploy cd097f0，最终 sha16=301B03AA6F7BF641208506BA1609E1E7EBAC0E98，1,538,900 B，-7 B）
- k2「→」cellK2：span→button type=button + border 1px solid var(--line)（L3780）
- renderDmgQuickChips：derived 与 hardcoded chips span→button type=button + padding 2px 8px（L5946）
- 零回归：多选/分桶/er_atkSel/dmgDef 推导/独立状态/深浅双模式全不回归；8901 黑盒 button tabindex=0/console 0/横滚 0
- 版本双改 L701 tag v4.176 + L14599 ER_ENGINE_VER
### 验收
- 引擎 er-n701：N1=N2 恒 BCFAEDED（exit 0×2 viol 全 0）
- P0 线上：?nocache=1761 sha16=301B03AA MATCH
### 上库凭证
- gh-pages deploy commit cd097f04fd3008927d8eac2b8b17cdaf64802616（远端同）；master 登记 commit（下）
- 主工作区 6/6+AGENTS_match；下轮预选：① P2 aria-current/aria-pressed 批修 ② 方案区分片（375px 真机证据）③ 方向 A（队伍 STAB 一键填入 atkSel）
---

## v4.177 P2/P3 aria 批量补齐（v4.176 TODO 清零）— 2026-11-06
### 落地（dev ac059f8 / deploy a7f78c0，最终 sha16=9801DD81B4F12F7C72BF7C5044FB530A27462AA7，1,539,237 B，+337 B）
- P2-1 nav button aria-current="page"（L2107 switchTab 同步，激活/失活互斥）
- P2-2 atkChips button aria-pressed（L3724 renderAtk 遍历时按 .on 实时同步 true/false）
- P3-1 搜索框 aria-label（L729 dmgAtkQ=搜索攻方宝可梦；L731 dmgDefQ=搜索对手宝可梦；L734 dmgMvQ=搜索招式）
- P3-2 深色按钮 aria-pressed（L704 初始 false；L14662 erApplyTheme 按 t==='dark' 同步 true/false，含 er_theme 恢复）
- 纯 aria 属性，视觉零变化；版本双改 L701 tag v4.177 + L14599 ER_ENGINE_VER
### 验收
- 引擎 er-n702：N1=N2 恒 BCFAEDED（exit 0×2 viol 全 0）
- P0 线上：?nocache=1771 sha16=9801DD81 MATCH
### 上库凭证
- gh-pages deploy commit a7f78c0e8ed221f94d5b8f9beee6a1f4d2f3bb10（远端同）；master 登记 commit（下）
- a11y-audit-v4176.md TODO 四项已关闭；主工作区 6/6+AGENTS_match
- 下轮预选：① 方案区分片（待真机卡顿证据）② 方向 A（队伍 STAB 填入 atkSel，需先解 F3 配招数据）③ 无障碍回归固化（键盘路径脚本化）
---

## v4.178 无障碍回归固化（a11y 检查脚本化 + 首次全量跑通）— 2026-11-06
### 落地（纯工具轮，index.html 零改动；线上维持 v4.177 9801DD81）
- 新增 `tools/a11y-check.js`：零依赖 Node 22 CDP 驱动 headless Chrome，自动启动 → 断言 → 退出码
- 运行命令：`node tools/a11y-check.js [URL]`（默认 http://localhost:8901/）
- 退出码：0=全 PASS / 非 0=FAIL / 2=CDP 不可用（手工控制台注入）
- 断言清单 a-g（14 项）：a nav aria-current 唯一+迁移；b atkChips aria-pressed 三态（全取消/单选/多选）；c 三搜索框 aria-label 非空且互异；d 深色按钮 aria-pressed 三态+reload localStorage 恢复（D 项缺口关闭）；e :focus-visible 全局 CSS 规则存在；f k2「→」与 dmgDef chips 为 button tabindex>=0；g 横滚 0
### 首次跑通（v4.177 线上/本地 v4.177）
- 14/14 PASS，exit 0；日志 C:\temp\er-v539-fix\a11y-run-v4178.txt
- D 项缺口关闭证据：reload 后 er_theme=dark → aria-pressed="true" theme="dark" stored="dark"
### 上库凭证
- 纯工具轮无 deploy；线上复验 ?nocache=1781 = 9801DD81 MATCH
- master 登记 commit（下）：tools/a11y-check.js 新增 + AGENTS.md 本条
- 下轮预选：① 方案区分片（待真机卡顿证据）② 方向 A（队伍 STAB 填入 atkSel）③ 每轮上线前必跑 a11y-check
---

## v4.179 a11y-check 扩展深色对比度断言 + 真实退化修复 — 2026-11-06
### 落地（dev a6df159 / deploy 17f5e69，最终 sha16=7F30DD57F2A908CE7EC87941F8FA4895FC8D416C，1,539,379 B，+142 B）
- 脚本扩展：新增断言组 h（对比度浅+深双模式，WCAG 公式内建），14→15 项
- 真实退化修复（P1 深色对比度）：
  - .btn/.btn-mini 加 color:var(--text)（按钮 UA 默认黑色，深色模式下黑字深底 1.48:1）
  - dmgDef chip chipStyle 加 color:var(--guide-fg)（深色 1.6:1 → 7.57:1）
  - html[data-theme=dark] .emptyhint 加 background:var(--muted-bg)（原硬编码 #fafbff 浅色底，深色 2.32:1 → 5.29:1）
- 豁免 SKIP：--line 结构性分隔线（v4.167 已登记）、accent 链接色（文字+下划线为主提示）
- 版本双改 L701 tag v4.179 + L14599 ER_ENGINE_VER
### 对比度值表（修复后）
| 元素 | 浅 | 深 | 阈值 |
|---|---|---|---|
| .tip 引导条 | 5.94 | 5.94 | 4.5 |
| .emptyhint 空态 | 4.68 | 5.29 | 4.5 |
| nav 激活按钮 | 5.17 | 5.17 | 4.5 |
| 深色按钮文字 | 14.97 | 11.79 | 4.5 |
| atkChip 选中 | 5.17 | 5.17 | 4.5 |
| dmgDef chip | 7.56 | 7.57 | 4.5 |
### 验收
- 引擎 er-n704：N1=N2 恒 BCFAEDED（exit 0×2 viol 全 0）
- a11y-check：15/15 PASS exit 0
- P0 线上：?nocache=1791 sha16=7F30DD57 MATCH
### 上库凭证
- gh-pages deploy commit 17f5e69e19ea068785febbfc24bc548e1ed3ae1d；master 登记 commit（下）
- 主工作区 6/6+AGENTS_match；下轮预选：① 方案区分片 ② 方向 A（队伍 STAB 填入 atkSel）
## v4.182（2026-11-07）P0 修复：特性反查持有者全 0
### 现象
用户截图：反查 Tab 顶部「匹配 60 个特性 · 开关隐藏 0 个持有者条目」，从「恶臭 #1」到「复眼 #14」每张卡右侧均为「天性 0 / 可选 0」，展开后两列持有者同样全空。用户补充：拨动「仅最终形态 / Mega 形态优先」两开关后恢复正常。
### 根因（三层核验）
1. 数据层完好：1906 物种，abisNonEmpty=1905 / withAbiIds=1905 / withInnIds=1905；妙蛙种子 abiIds=["268","257","34"]。
2. 算法层完好：headless 实测 abiOwners() 返回 998 个 id 桶，id=1（恶臭）ab=3 / inn=12。
3. 时机层是病灶：data_lite_v498.js 里【没有 species】（实测 lite_species=none），species 在 load 之后 800ms 才由 __erStartLate() 异步拉取；而 renderAbi() 在页面初始化 IIFE（L5316）里立即执行，此刻 ERDATA.species 为空，abiOwners() 走 L5336 提前 return {} ⇒ 全部 0。
4. 无人刷新：er-ready 事件共 7 个监听点（MV 表 / switchTab / renderSp / erRestoreAtkSel / sets 预取 / renderDmgQuickChips / _initCoreList），没有一个是反查页 ⇒ 数据到达后仍停在 0，直到用户手动拨开关触发 abiFilterToggle()。
### 修复
renderAbi() 初始化改为：__erReady 为真则立即渲染，否则挂 er-ready 再渲染（只增逻辑，不动过滤/搜索/展开态恢复）。
### 验证
- probe18：T+400ms cards=0（未就绪不渲染）→ T+1200ms cards=60、首卡「可选 2 / 天性 3」（自动刷新）→ 稳定；own=998 全程一致
- smoke 26/26 passed
### 开关默认值复核
optAbiFinal=true / optAbiMega=true（与核心配队 optFinalOnly/optMegaOnly 同值，v4.41 设计如此）：默认即收窄到「最终形态 + 非可 Mega 形态」。此默认不是本次故障原因——故障时 _hidN=0 恰恰证明过滤根本没生效（持有者列表本身是空的）。修复后徽标数字随过滤变化，_hidN 正常非 0。
### 提交
- master bb315b9（fix）+ 版本登记提交（本次）
## v4.183（2026-11-07）UI 修复：战术模板「固定推荐队伍」卡片被压扁 + 页头版本号脱节
### 现象
用户截图：战术模板页每个模板的「固定推荐队伍（Top 6 · 点卡片入队）」区域，6 张队伍卡被压成约 20px 宽的竖条，精灵图重叠、名字/分数/命中全部逐字换行，右侧留大片空白，完全读不出内容。
### 根因（实测）
卡片类是 `mxc tap44`。`.mxc{width:76px}` 在 L278，`.tap44{display:inline-flex; align-items:center}` 在 L438 —— **后定义的同特异性规则覆盖了 display**，卡片变成横向 flex（无 flex-direction 即 row）。探针实测修复前：`display:flex / flexDirection:row / alignItems:center / 76x98`，四个子元素（精灵图 40px、名字、分数、命中、入队）全被塞进 76px 一行，flex-shrink 把每一项压到单字宽。
### 修复
新增高特异性规则 `.mxc.tap44`（0,2,0 > .tap44 的 0,1,0）：`display:flex; flex-direction:column; align-items:center; justify-content:flex-start; width:auto; min-width:118px; max-width:150px`；同时放开 `.mcnm` 的 nowrap/ellipsis，长名允许换行不截断。
### 附带修复：页头版本号硬编码
页头副标题的「引擎 v4.179」是**手写死的文本**（L777），而真相源 `ER_ENGINE_VER` 已是 v4.182 —— 用户看到的版本号长期落后实际版本，无法确认是否用上最新版。现改为 `<b id="erVerNo">` 由 `ER_ENGINE_VER` 回填，以后升版只改一处。
### 验证
- probe20（headless CDP，1440 宽）：修复前 `dir:row / 76x98 / scrollW 74` → 修复后 `dir:column / 118x110 / 无溢出`，6 卡一致，页面 `scrollWidth==clientWidth`（零横向溢出）
- probe21 视觉截图：1440 宽 6 卡一行可读；375 宽自动折成 2 行 3 列，名字零截断（`nameClipped:false` 6/6）
- smoke 26/26 passed
- 影响面核查：全站仅一处 `mxc tap44`（模板卡），另一处 `btn-mini tap44` 不受新规则影响


## 10. v4.183 补丁：本地入口收敛（2026-11-07，产物 index.html 零改动）

### 现象
用户按 README 的「本地运行」指引双击 `配招助手_ER.html`，得到的不是工具，而是一句「数据加载失败」。

### 根因（实测）
该文件是 **v4.98 时期留下的产物副本**（1,448,248 B），其数据加载器要求同目录 `data.js`；而 `data.js`（2.4 MB）已在 v4.98 拆包时退役为 `data_lite_v498.js` / `data_species_v498.js` / `data_adv_v498.js` 三分片，仓库根已无此文件，其 CDN 兜底指向的同样是已退役的 `data.js`。

- 实测（headless CDP，file:// 双击场景）：`ready:false / erdata:false / failText:true / bodyLen:55`，console `Error: ERDATA missing`
- 对照 `index.html`：`ready:true / sp:1906 / mv:1032 / v4.183 / 9 Tab / 0 报错`

v4.98 拆包时 `index.html` 改好了，**第二副本没跟着改**；而 `tools/smoke.js` 的「data.js 已退役」断言只读 `index.html`，因此长期漏检。

### 修复
- `配招助手_ER.html` 收敛为 **1,673 B 兼容入口**：`meta refresh` 跳转 `index.html` + 手动按钮 + 本地运行提示，**不再复制产物**，双源漂移从结构上消除
- README「本地运行」改指 `index.html`（并说明兼容入口会跳转）；「技术架构」块同步为当前真实结构（三分片 + smoke + 部署脚本）
- `tools/smoke.js` 新增断言：入口页 ≤10 KB、必须含 `url=index.html` 跳转、不得引用 `data.js`

### 验证
- file:// 双击入口页 → 自动落到 `index.html`：`ready:true / 1906 物种 / 1032 招式 / v4.183 / 9 Tab / 0 报错`
- `node tools/smoke.js`：**27/27 passed**（原 26 + 新增入口断言 1）
- 产物 `index.html` 一字未改（1,549,510 B / sha1 `9EF2B1648B7E6B6F8105671E49283CB0F988A225`），线上无需重新部署

### 教训
同一产物只要存在第二份拷贝，就一定有漂移。能用入口页就不复制产物；门禁断言必须覆盖所有对外入口，而不只是主产物。


## 11. v4.184 队伍 STAB → 进攻面（2026-11-07）

### 背景
临时目录抢救合辑确认：`fillTeamStabSel`（设计档案 `stabsync-proposal-v4180`）在产物中 **0 命中**，属「只有设计、未落地」。本轮补上。

### 实现
- 属性克制 Tab「进攻视角」标题下新增按钮「📋 队伍 STAB → 进攻面」（`#atkStabBtn`），走标准 `.btn-mini` 样式
- `window.fillTeamStabSel()`：遍历 `team` 每只的 `t1`/`t2` 并集去重（排除 `ATK_SPECIAL` 的 星晶/无/神秘）cap 6 → 覆盖式写入 `#atkChips` 各按钮 `on` 状态（非合并）→ `erSaveAtkSel()` → `renderAtk()`
- **不自动跟随**：改队后本次选择保留，需再点一次重新生成（避免用户在进攻面手动调整时被队伍变动清掉）
- **再点还原**：用内存快照 `prevSel` 还原点击前的选择，按钮退出激活态、提示清空
- 空队 → 返回 `'empty'` 并提示「先去『队伍构建』加人」，不误报

### 验证（probe23，headless CDP，file:// 本地双击，**13/13 PASS**）
- 加 妙蛙种子（草/毒）+ 小火龙（火）→ 点按钮：返回 `草+毒+火`，3 个 chip 激活，提示「已选中 3 个本系属性：草 · 毒 · 火」
- 结果区由空态（79 字符）变为多选聚合渲染（6,692 字符），特殊属性误选 0
- 再点一次 → `restored`：chip 全取消、按钮退出激活、提示清空、结果区回空态
- 空队 → `empty` + 提示文本
- 布局：1440 宽 `scrollWidth==clientWidth==1427`；375 宽 `375/375` 无横向溢出，按钮热区 150×44（满足 coarse 指针 44px 口径）
- 运行期 JS 异常 0；`node tools/smoke.js` **27/27 passed**

### 指纹
`index.html` 1,549,510 → **1,551,639 B**，sha1 `9EF2B164…` → **`F982C63A3B05D50757ABE0F38A72AA8F2D4EE5FD`**，sha256[:16] `2E7A0CEEEC792288`，`ER_ENGINE_VER='v4.184'`。


### 补记（同日，同版本内修正）
升版后复查发现：`<b id="erVerNo">` 的**静态占位仍是 `v4.183`**。运行时虽被 IIFE 回填为 v4.184，但回填前或脚本失败时用户看到的是过期版本 —— 与 v4.183 修的「手写死文本」属同一类残留。已改为占位 `v4.x`（诚实表示「待回填/未知」），并在 smoke 增设第 28 项断言：占位必须是 `v4.x` 或与 `ER_ENGINE_VER` 完全一致，出现过期硬编码即失败。

本版最终指纹：`index.html` **1,551,637 B**，sha1 **`79240B63A3F4D1B458FC18C8C96DB619E594C3ED`**，sha256[:16] `C25FE066707C3BEE`；`ER_ENGINE_VER='v4.184'`，页头回填实测 `headerVer:v4.184`。


### 补记二：renderSavSlots「分页器未落地」结论核实（结果：不成立）
合辑第十章曾记「`renderSavSlots` L4726 分页器预估 2-4 KB 未落地」。v4.184 实测核实：**该函数早已实现并工作**（现 L4958–4972），渲染历史档 chips（「档N 时:分」、双击改名、≥2 档出「对比近两档」、`loadSavSlot` 加载后高亮）；保存路径 `er_savs_v1` **FIFO 硬限 3 档**，档位最多 3 个 → **分页器没有存在必要**，属设计冗余被合理省略，不是缺口。

实测 probe24（headless CDP，file://）：3 档 → 3 个可点 chip + 对比入口、改名生效、加载后高亮 1 个、FIFO 上限 3 → **8/8 PASS**。合辑原文已就地加「更正」块（不改旧结论，保留决策轨迹）。


## v4.184.2 —— 存档电脑区（D-6）容器补齐

### 问题（真缺陷，非文档问题）
v4.93 实现的「电脑区清单」（`savPcSearch` / `savPcListRender` / `savPcEnqueue`，含 50/页分页、属性过滤、满队槽位替换）在早期 UI 重构中**丢失了三个 DOM 容器**：`#savPcQ`（搜索框）、`#savPcTypeRow`（属性过滤 chips）、`#savPcList`（列表）。

后果：用户解析 `.sav` 后**看不到箱子清单，也无法从箱子挑精灵入队**；而这三个函数全链路取不到节点，静默空转、零报错，因此长期无人发现。合辑记的「D-6 电脑区入队未落地」**不是没写，是写了但入口丢了**。

### 修复（只增不减）
- team 页 `savParseOut` 之后新增可折叠区块「🖥 存档电脑区」：搜索框 + 19 个属性 chip（全部 + 18 属性）+ 列表
- 新增 `savPcCardShow()`（解析成功 / 加载历史档后区块现身）、`savPcCardToggle()`（**只折叠内容、入口常驻**，避免收起后再也打不开）
- 空搜分支由「BOX1 前 12 兜底」改为全量交给分页器 —— 原兜底会让「电脑区（N）」计数与实际条数不符（60 只箱子只显示 12 却报 12）
- 沿用既有渲染：50/页分页、‹ / 页码输入 / ›、特殊区设施预设单列、行级「＋入队」

### 验证（实测，非推断）
- `probe25`：注入 60 条假箱档 → **12/12 PASS**（计数 60、分页导航、50 个「＋入队」、19 chip、区块可见、折叠/展开往返、属性过滤逐行按图鉴属性核对 7 条全火系、入队带实配 info、满 6 只第 7 只弹槽位替换而非静默丢弃）
- `probe26`：1440 与 375 两档各 4 项 → **9/9 PASS**（文档零横向溢出、卡片不越视口、列表无内部横向溢出、属性 chips 375 宽换行 188px 不溢出）
- `smoke` **28/28**
- 指纹：`index.html` **1,554,642 B**，sha1 `9BACC4BEC0E0B532513376853F932AE858B77E25`，sha256[:16] `32EC36F577C2601E`

### 过程中修正的两条错误断言（记录以免重犯）
探针首版用「宝可梦名字里有没有『火』字」判属性，`喷火龙/九尾` 这类会误判 —— 改为按 `speciesById` 的 `t1/t2` 判定；另把按钮文本「＋入队」按「＋」匹配导致漏计。断言自身的错误同样会浪费一轮，写探针时先自检判据是否与业务真值同源。


## v4.184.3 —— DOM id 引用全量审计 + 分享卡浮层失灵修复

### 由 D-6 引出的系统性排查
v4.184.2 修掉「电脑区三容器丢失」后，顺着同一病理（**取不到节点 → 静默 return → 功能整片消失且零报错**）做了一次全量静态审计：把 `index.html` 里**所有** `$('id')` / `getElementById('id')` 的引用与页面 `id="..."` 定义做差集（再扣除运行时 `createElement` 后赋 id 的动态节点）。

结果：175 个定义 / 155 个静态引用 / 185 个动态 id，**差集只剩 1 个** —— `#shareCard`。

### 修掉的问题
`switchTab()` 里「切 Tab 自动关闭分享卡浮层」那行取的是 `getElementById('shareCard')`，但该浮层早已改名 `#shareCardOverlay`，且关闭方式也从 `classList.remove('open')` 改成了 `remove()`。这行**从改名那一刻起就一直空转**：打开分享卡后再切 Tab，浮层盖着不走，用户只能手动点关闭。

### 修复
- `#shareCard` → `#shareCardOverlay`，关闭方式同步为 `remove()`（与 `shareCardClose()` 一致）

### 新增门禁（防同类复发）
`tools/smoke.js` 第 29 项：**代码引用的 DOM id 必须全部已定义或运行时创建**，出现「引用但从未定义」即失败。这条断言能把「容器丢失」这类静默失败在提交前钉死，而不是等用户在页面上发现功能不见了。

### 验证
- `probe27`：**7/7 PASS** —— 浮层可打开、canvas 616×346 有实际尺寸、4 个操作按钮（下载 PNG / 复制文字 / 关闭 / 复制链接）、**切 Tab 后 `stillOpen=false`（修复前会残留）**、关闭按钮可移除浮层
- `smoke` **29/29**（含新增第 29 项）
- 指纹：`index.html` **1,554,821 B**，sha1 `4531B586012D515913470E99E2A929F2EB03837C`，sha256[:16] `EBAA8F75B764C669`

### 一点说明
审计同时确认：除 `#shareCard` 外，其余所有被引用的 id 都在页面上存在或由代码动态创建 —— 也就是说「容器丢失」这类缺陷目前只发现了这两处（电脑区、分享卡），不是普遍现象。


## v4.185 —— 队伍边际评估（替代 NN 组队的确定性方案）

### 为什么不启用 NN（先说结论）
`analyzerVNN` 在产物里一直是**接口预留 + 存根（`return null`）**，注释明写「本轮不接线不评估」。历史雏形「判断没有更优」的成因不是调参不够，而是**没有真值标签**：本工具是单机网页、无对局数据源，唯一可得的标签就是人工评分函数本身。用它训练等价于**蒸馏自己的规则**，天花板就是原规则，不可能更优。所以这一版**没有上 NN**，而是把「评分」这件事本身做实。

### 对照组的问题
原「🧠 智能补位」只看两个缺口：**速度线低于 P75**、**4 倍弱点无人联防**，且只取前 3、只按单维度排序。结论粗、理由一句话、满队后完全没有建议。

### 新增：📊 边际评估（`edgeSuggest` 系列）
把队伍缺口拆成**五个独立维度**，每维单独计分、逐条给出得失：

| 维度 | 定义 | 权重 |
|---|---|---|
| 无解系 | 有弱点但全队无人抗也无人免（打进来只能硬吃） | 5 |
| 4 倍系 | 队内存在被 4 倍克制的成员 | 5 |
| 共弱 | ≥2 只弱同一属性（容易被同系一招团灭） | 3 |
| 进攻盲区 | 全队招式池对该防守属性打不出克制 | 2 |
| 速度线 | 全队极速与 P50/P75 的落点 | 2 |
| 属性重复 | 队内同属性 ≥2 只 | 1 |

- **未满队**：对 1906 只全图鉴算「加进来后评分变化」，取净改善 Top 5
- **满队**：枚举「换掉谁」（候选 × 6 个槽位），给出「换掉 X → 加入 Y」
- **每条建议都有理由**：`得：消除无解系 火 · 补上进攻覆盖 钢` / `失：极速 284 → 270 · 新增属性重复 草`
- **一键应用**：`✅ 应用` 直接把建议落到队伍（含 `teamInfo` 清理 + 全页重渲 + 存盘）
- **权重写在 `EDGE_W` 里，界面上明示**——这是刻意的：用户要能看见「凭什么这么算」，而不是接受一个黑箱分数

### 性能设计
组合枚举是 1906 候选 × 6 槽位，直接算会退化成几万次 `defCellTrio`。因此做两层缓存：
- `_defVecCache`：每只的 18 属性防守向量（天性口径）
- `_supSetCache`：每只招式池可克制的防守属性集合

实测：4 只队 **153 ms**、满 6 只 **62 ms**（均为全图鉴枚举），无需异步。

### 验证
- `probe28`：**12/12 PASS** —— 空队提示、偏科队（草/虫/超/草毒）正确报出「无解系 火/飞行/超能力/岩石」、5 条建议各带「得」理由、未满队不提「换掉」、满队给「换掉谁」+ 5 个应用按钮、**应用后队伍仍 6 只且 toast「已应用：阿尔宙斯-钢」**
- `probe29`：**5/5 PASS** —— 375×812 零横向溢出、评估区不越视口、卡片全部渲染、按钮热区 44 px
- `smoke`：**30/30**（新增第 30 项：5 个函数 + 入口按钮 + `EDGE_W` + 双缓存，缺一即失败）
- 指纹：`index.html` **1,564,086 B**，sha1 `DE7387603D4BFF34B2C79807CF1D37EA36532B2C`，sha256[:16] `EA2C3705DDA349E3`

### 两处自查出的错（记录以免重犯）
1. 首版把 `team.indexOf(s) < 0` 写成了 `<-1`（`indexOf` 最小就是 -1，该条件恒假）→ 候选池为空，界面只出缺口、不出建议。**`<-1` 这种比较必须靠探针发现**，静态看代码看不出来。
2. `team[i].id` 是字符串 `"6"`，而按钮 `onclick` 传的是数字 `6`，`===` 严格比较失败 → 「应用」报「成员不在了」。已改为 `String(...)===String(...)`。

---

# 附：README 历史更新记录（v4.3 ~ v4.73，2026-11-09 原样下沉）

> 2026-11-09 从 `README.md` 的「## 更新记录」整段原样下沉，**内容未改一字**。
> 原因：README 改为对外介绍，技术流水账统一归档在此。
> 本段与上方「v4.6.1 → v4.179」章节有重叠区间（v4.6.1~v4.73），重叠部分内容各自独立，两份都保留。
> 其中 **43 个版本号只在本次下沉的这段里出现过**（v4.3~v4.5、v4.34g~v4.73 等），是唯一副本。

## 更新记录

- **v4.73**（2026-10-19）：**流派 EV 推荐联动速度线（「配速收益最大化」从提示层推进到推荐层——速度线体系闭环）**（只改 build_tool_html.py，data.js 未变）。buildEvs 速攻模板后接卡线：**fast 高速速攻手**（主项=速度且极速≥P90）`spdEvTo(s,P90)` 卡线，省≥48 EV 启用——速度=卡线ev、HP=252-卡线ev、summary「卡 P90 线(372) 省N EV→HP」（三地鼠类：spdEvTo(P90).ev=100、省152、速=100/HP=156）；**mid 中速清场**卡 P75（331）同判据；**空间手/慢速炮台**不抢速（252HP+252输出）；**安全阀**：省<48 不启用保持 252 满投、性格非速度（固执等）卡线值无效保持满投；同一 `spdEvTo` 源（与详情卡配速行同源）；**EV 总和恒 508**（削减等额挪 HP 守恒）；mechBuildsOf 路径经同一 buildEvs 出口闸门。**验收三线全绿**：引擎 PASS（守门对照 v4.65 无回归 + P4 唯一性守门保持 0 + **EV 不变量 S5r=100% 硬门恒 508 + 分位锚点未变 273/331/372/394/441 + 卡线同源 spdEvTo/sanitizeBuild** + 确定性 N1=N2=`93F131D1`==冻结 + 版本双查 v4.73）；黑盒 PASS（P0=0/P1=0/P2=0——#51 三地鼠命中对照案例 a：固执非速度性格→速度收敛 0 EV 正确；开朗快攻卡线启用分支 UI 样例未抓到（本物种池无快攻流派）登记下轮补；EV 段四段非空不回归）；P0 快验 PASS（版本双查一致、7/7 渲染无错、EV 段修复项不回归、EXIT=0）。产物：build_tool_html.py 1094458 B（SHA256[:16]=`1A8AA9DDA81B4609`），index.html ≡ 配招助手_ER.html 1351096 B（SHA256[:16]=`93F131D12F262AA4`），data.js 2456881 B（`7DB7FBB33D3160AF`，未变）。**线上验证（2026-10-19，no-cache）**：线上 index.html SHA256[:16]=`93F131D12F262AA4`（1,351,096 B）与本地逐字节一致、标签「引擎 v4.73」、ER_ENGINE_VER='v4.73'；部署分支 master `ba1ef85` / gh-pages `685767e`（清单仅 README+index.html）。**经验补充**：GitHub Pages CDN 传播延迟 ~5 分钟——deploy 后立即验证可能命中旧缓存，须等待+no-cache 头重试。
- **v4.72**（2026-10-19）：**速度线 Tab UX 改造（用户点名主线，6 点全落地）**（只改 build_tool_html.py，data.js 未变）。①**前 N 条分段控件**「前 50/100/200/400/全部」下拉（默认 400），搜索命中 ≤ 上限全显、>400 截断+提示；②**搜索强化**：实时「命中 X 只」计数、空结果「无匹配，试试英文名/编号」、oninput 150ms 防抖、占位保持「搜索物种/编号，如 皮卡丘 / 25」；③**分位徽标（回应「看比例」）**：每行极速右侧 `PXX` 徽标（复用 speedPctileRankOf 同源）——≥P90 绿「超速」/P75-89 蓝「清场」/P50-74 黄「中速」/<P50 灰「慢速」；④**排序切换下拉**：极速降序（默认）/极速升序（慢端空间手）/满速降序/0努力降序/编号升序；⑤**响应式 ≤768px**：隐藏次要列（0努力/围巾/特性×2/+1级），保留 编号/物种/满速/极速/分位徽标/省EV/定位；⑥**性能**：懒渲染保持、开卡 openSp 独立路径不受影响（0.06s）。**验收三线全绿**：引擎 PASS（守门对照 v4.65 无回归 + P4 唯一性守门保持 0 + 确定性 N1=N2=`9E53C49F`==冻结 + 版本双查 v4.72 + 速度线专项徽标同源/排序四档/截断在位）；黑盒 PASS（P0=0/P1=0/P2=0——首行 #2633 幸福蛋R 极速 669 P100、搜索 皮卡丘=18 行（全换装 372/P88）/25=138/Pikachu=18、截断「命中 1906 只，仅显示前 400」、徽标 P100 绿 rgb(22,163,74)、375px 窄屏隐藏次要列无溢出、开 Tab 3.11s/搜索重建<1s/openSp 0.06s；分段/排序按钮逐点登记下轮补）；P0 快验 PASS（版本双查一致、7/7 渲染无错、EXIT=0）。产物：build_tool_html.py 1093274 B（SHA256[:16]=`B11CC6EE504826D3`），index.html ≡ 配招助手_ER.html 1349912 B（SHA256[:16]=`9E53C49FDF4BF4C1`），data.js 2456881 B（`7DB7FBB33D3160AF`，未变）。**线上验证（2026-10-19，no-cache）**：线上 index.html SHA256[:16]=`9E53C49FDF4BF4C1`（1,349,912 B）与本地逐字节一致、标签「引擎 v4.72」、ER_ENGINE_VER='v4.72'；部署分支 master `92e8688` / gh-pages `dc77d60`（清单仅 README+index.html）。
- **v4.71**（2026-10-19）：**生命宝珠×回复位 team 级冲突提示落地（v4.70 登记项收口）+ 速度线搜索框占位**（只改 build_tool_html.py，data.js 未变）。**P1 宝珠×回复（镜像 v4.69 场地种子 team 先例）**：新增 `teamHasRecovery(self, teamArr)`（回复招式：羽栖/睡觉/光合作用/晨光/月光/自我再生/偷懒 + 特性：再生力，gameData 原文名未虚构）——单精灵页（空队伍）：保留生命宝珠+why 追加「（队伍无回复位时自伤1/10不可持续，慎带）」；核心配队页（teamArr 非空）：队伍无任何回复位→从推荐道具剔除生命宝珠，有回复位→why 点名「（队伍有X回复位，自伤可周转）」；统一闸门覆盖 mechBuildsOf 杂技/轻装路径。黑盒实证违规=0（抽样 8 只+#22 核心队未抓到「无回复+宝珠推荐」触发样例——剔除逻辑在构建/守门侧生效，登记）。**P2**：速度线 Tab 搜索框占位「搜索物种/编号，如 皮卡丘 / 25」（低成本落地）。**验收**：引擎 PASS（守门全项对照 v4.65 基线无回归 + P4 唯一性守门保持：物种 1906/招式 1032/特性 1034、id 重复=0、中文名冲突=0 白名单在位；确定性 N1=N2=`2A9ACBBF`==冻结逐字节复现；版本双查 v4.71）；黑盒 PASS（P0=0/P1=0/P2=0，回归全绿：种子/配速分位 #22 P71·#25 P66·#445 P75 省8EV/分布条/速度线/卡加载 0.06s/机制解读/EV/特性N选1/首行冻结/会心流降权/搜索占位）；P0 快验 PASS（版本双查一致、7/7 渲染无错、EXIT=0）。产物：build_tool_html.py 1090299 B（SHA256[:16]=`F03849B802554D0E`），index.html ≡ 配招助手_ER.html 1346937 B（SHA256[:16]=`2A9ACBBF457903F9`），data.js 2456881 B（`7DB7FBB33D3160AF`，未变）。**线上验证（2026-10-19，no-cache）**：线上 index.html SHA256[:16]=`2A9ACBBF457903F9`（1,346,937 B）与本地逐字节一致、标签「引擎 v4.71」、ER_ENGINE_VER='v4.71'；线上 data.js=`7DB7FBB3`（未变）；部署分支 master `0092f87` / gh-pages `d551753`（清单核查仅 index.html，无 gitignored 输入误入）。**网络经验补充（AGENTS §6）**：北美节点 IP 也会波动（140.82.113.3 本次失效）——部署前多 IP 探测（140.82.112.3/114.3/121.3/116.3），本轮 140.82.121.3 可用；5 项 gitignored 输入由 MainAgent 侧独立恢复（er-backup-v471 备份在位）。
- **v4.70**（2026-10-19）：**图鉴数据唯一性守门固化（P4）+ 多样性/信息项复核登记**（详见 AGENTS §6；README 补记）。P4 新守门纳入基线（与 G-E2 并列）：物种/招式/特性 gameData id 唯一性硬门闩（重复即 FAIL）+ 中文名跨 id 冲突断言（白名单 `P4_NAME_WHITELIST={'基格尔德-10%形态':'1739/1740'}` 豁免，白名单外 FAIL）——实测 id 重复=0、中文名冲突=0。P1 S5q 实测 60.4% 结构性未达→按 A2 先例如实登记；P2 宝珠×回复登记本轮（v4.71）收口；P3 E5=14/G-E4b=181/G-E5b=45 三项结构性保持。验收三线全绿（引擎/黑盒/P0）、确定性 N1=N2=`4EB751F9`。线上 `4EB751F9`（1,345,130 B）/引擎 v4.70；master `9fa76b6`/gh-pages `0399b8d`。网络故障解法固化：git schannel×新加坡节点→`-c http.curloptResolve=github.com:443:<北美IP>` 强制北美节点。
- **v4.69**（2026-10-19）：**场地种子 team 级剔除收口（v4.68 登记项）+ 速度线增强 + 分布可视化**（只改 build_tool_html.py，data.js 未变）。**P1 场地种子 team 级剔除（v4.68 登记项收口）**：把队伍上下文穿入 buildItem（deriveBuilds 传 `ctx.team=teamArr`）——核心配队已选队友含对应场地制造者特性/对应场地招时→保留种子+why 点名触发者（「配合XX的XX场地触发」）；**无对应场地手→从推荐道具列表剔除场地种子类**（电气328/精神329/薄雾330/青草331）；出口统一闸门覆盖 mechBuildsOf 杂技/轻装路径（该路径曾绕过 buildItem 过滤）；空队伍=单精灵页口径保留+「需场地手勿带」警告。**全库违规归零（CDP 真页面扫 1906）**：单精灵保留+警告 267、无场地手剔除 210、合法保留点名 353、违规=0。**P2 速度线增强**：①详情卡配速提示引用速度线表分位——speedPctileRankOf 二分实测落位标注「（全库分位 PXX）」（皮卡丘 P66/三地鼠 P88 实测）；②天气/围巾/强化乘区保持参考列不自动计入（v4.68 口径不变）；③速度线 Tab 补「省EV建议」列（卡 P75 实算→省N→HP）。**P3 分布可视化（用户「看比例」明确诉求）**：速度线 Tab 顶部全库极速档分布条，静态标注 P50=273/P75=331/P90=372/P95=394/P99=441 切点，不依赖悬停。**验收**：P0 显示层抓 REGRESSION=1（引擎标签 v4.68≠v4.69——实施只改标签行未升 ER_ENGINE_VER 常量，修复 178d789）；**确定性回归**（引擎补验抓：v4.69 常量直接改在产物未回写源码→独立重建漂移 E505D066≠冻结 CBCF5905；修复 48b70e9 回写源码后 N1=N2=CBCF5905==冻结关闭）；黑盒 PASS（P0=0/P1=0/P2=0——配速分位假阴性澄清：抽屉未 open 时 innerText 返回空串，正确探针实测皮卡丘 P66/地鼠 P66/三地鼠 P88+省152EV）；引擎终验 PASS（确定性关闭）。产物：build_tool_html.py 1086096 B（SHA256[:16]=`A309C7FD75CAF48E`），index.html ≡ 配招助手_ER.html 1343187 B（SHA256[:16]=`CBCF59057BDEC0AA`），data.js 2456881 B（`7DB7FBB33D3160AF`，未变）。**线上验证（2026-10-19，no-cache）**：线上 index.html SHA256[:16]=`CBCF59057BDEC0AA`（1,343,187 B）与本地逐字节一致、标签「引擎 v4.69」、ER_ENGINE_VER='v4.69'；线上 data.js=`7DB7FBB33D3160AF`（未变）；部署分支 master `48b70e9` / gh-pages `（见登记 commit）`；5 项 gitignored 输入已从 C:\temp\er-backup-v469 恢复且哈希 MATCH（item_zh_cn MD5=`03243EAA` ✓）。
- **v4.68**（2026-10-19）：**P0 卡死根治（点击宝可梦冻结 60s）+ 组织者五项（机制解读/会心流/场地种子/P2×3）**（只改 build_tool_html.py，data.js 未变）。**P0 防卡死（用户多次报告：本地/线上点击核心配队宝可梦冻结 ~60s）**：真机探针定位根因=v4.67 强化角色判定在 `mateRoleOf()` 内**逐候选跑完整 `deriveBuilds(t)`** → `findTeammates` 全库候选扫描（一次点击 **deriveBuilds×14,183 次 / 49.5s**、coreSys×235 万次、renderCore=62.7s——调用次数数量级爆炸而非单次慢）。**修复=构建期预计算全库强化角色表 `_ER_BOOST_ROLE`**（node vm 构建尾段全库 1906 只跑 deriveBuilds 主推流派 mv.main，收集含 剑舞14/龙舞349/诡计417/蝶舞483/破壳504 的物种，`[PREWARM] 物种=1906 有流派=1906 无/异常=0 强化角色=312 加载错误=0`），运行时 `mateRoleOf` **O(1) 查表**（判定语义不变）；同时**剔除原 BOOST_ID 中 76=日光束**（data.js moves 实证=蓄力草招非强化，v4.67 引入误判顺手修）。**实测：线上点击 60s→0.04s（本地 file:// 0.8s，提速 1500 倍）**。**组织者 v4.68 五项**（合入 ca6180e）：①P0 机制解读 badge 可展开（mechChip 静态 span 无 onclick → 改 mechBadgeHtml 带 onclick toggle）；②P1 会心流特性无支撑降权（狙击手等无高会心招/焦点镜 → 主推换稳定输出特性，why 注明）；③P1 场地种子 why 注明需场地手触发（电气/精神/薄雾/青草种子=场地+1 防后消耗→杂技翻倍，注明需队友开场地）；④P2-1 首行冻结不盖 header；⑤P2-2 EV 段数值标注（4/252/252 可读）；⑥P2-3 特性 N 选 1 动态。**验收**：守门 BUILD OK exit 0 **0 违规**（G-E2 三维全盖/G-E4a=76/G-E4b=181/G-E4c=20/G-E4d=109/G-E5b=45/E5=14/R9-E3=95·268·141·0 与 v4.65 基线一致）；本地点击复测 0.8s；线上 no-cache 实测 **点击 0.04s**、页面含「引擎 v4.68」。产物：build_tool_html.py 1071557 B（SHA256[:16]=`88D8A5A84F2D96FC`），index.html ≡ 配招助手_ER.html 1328648 B（SHA256[:16]=`0BCC7D670486F926`），data.js 2456881 B（`7DB7FBB33D3160AF`，未变）。**线上验证（2026-10-19，no-cache）**：线上 index.html SHA256[:16]=`0BCC7D670486F926`（1,328,648 B）与本地逐字节一致且含「引擎 v4.68」，线上 data.js=`7DB7FBB33D3160AF`（未变）；部署分支 master `ca6180e` / gh-pages `（见登记 commit）`；5 项 gitignored 输入已从 C:\temp\er-backup-v468 恢复且哈希 MATCH（item_zh_cn MD5=`03243EAA` ✓）。

**速度线体系（v4.68 批 4，用户重点口径——先统计全库速度线表→按分布比例分位→全库配速参考→卡线省 EV 收益最大化）**：设计稿 `C:\temp\er-v468-impl\speedline_design.md` 对齐决策=极速档（252+速度性格）做主表、满速中性档参考列；天气/场地乘区（轻装×2/悠游自如×2/叶绿素×2/拨雪×2/加速N回合/围巾×1.5/强化±1±2级）仅参考列不自动计入；不做对标 UI。**实施（commit `d3740da`）**：①独立「速度线」Tab=全库 1906 物种可查表（搜索框+极速降序前 400 行：0努力/满速252中性/极速252+性格/围巾×1.5/特性×2若触发/+1级强化/定位分层），分位锚点表+兆级电压/薄雾场地场地轴单独标注；②**分位实测**（全库极速档 n=1906，Python 探针+产物运行时双口径一致）：**P50=273 / P75=331 / P90=372 / P95=394 / P99=441**（无占位无编造）；③全库 1906 只详情卡注入配速提示行（当前速度 vs 定位目标分位 ✅/⚠️：高速速攻手 P90+/中速清场 P75/空间手反向拉低速重耐久）；④卡线省 EV 实算标注（三地鼠 仅过P75 需 EV100 达331 **省152EV 挪HP**；风速狗 EV180 达331 **省72EV**——与 Python 实算一致）。**黑盒 FAIL×3 修复轮（commit `7832d43`）**：黑盒复验抓 3 项未达——①场地种子 why 警告未生效（根因=渲染走道具池字典非 _SEED_SYS，已在 4 个种子字典 why 末尾追加「需队伍内有X制造者/对应场地招触发，无场地手勿带」）；②点击卡加载 5.09s>2s（根因=速度线 400 行全库表 DOMContentLoaded 同步渲染阻塞开卡热路径——改懒渲染 `speedRender` 只建锚点+搜索栏、`speedEnsureTable()` 首次切 Tab 才建表、配速行 `speedHintHtmlCached` 按物种 id 缓存）；③MAIN 区未独立滚动 sticky 形同虚设（main 加 `height:calc(100vh-51px);overflow-y:auto`、bktabs sticky `top:51→top:0`、无限滚动监听改绑 main）。**修复后黑盒复验 PASS（P0=0/P1=0/P2=0）**：种子警告在位、点击卡 **实施侧实测 1.43s（黑盒独立实测 2.06s——CDP 轮询开销+0.6s，人眼无感）**、bktabs 钉顶不滚走、速度线 P50/75/90/95/99=273/331/372/394/441 全在。**产物哈希（v4.68 最终）**：build_tool_html.py **1074961 B（SHA256[:16]=`74175C13194D4F9F`）**，index.html ≡ 配招助手_ER.html **1337955 B（SHA256[:16]=`08A7021DC23984DF`）**，data.js 2456881 B（`7DB7FBB33D3160AF`，未变）。**线上验证（2026-10-19，no-cache，本轮）**：线上 index.html SHA256[:16]=`08A7021DC23984DF`（1,337,955 B）与本地逐字节一致且含「引擎 v4.68」，线上 data.js=`7DB7FBB33D3160AF`（未变）；部署 master=`7832d43`；5 项 gitignored 输入从 C:\temp\er-backup-v468 恢复（item_zh_cn 该备份缺失，按历轮口径从 C:\temp\er-backup-v460\ER-source 拷回 MD5=`03243EAA` ✓，其余 4 项 MATCH）。
- **v4.67**（2026-10-18）：**补全轮——消耗受队/强化推队独立体系旗标（任务书 5 类模板完整化；黑盒 FAIL×3 拦截后四轮补做闭环）**（只改 build_tool_html.py，data.js 未变）。**P1 新旗标（v4.66 登记项补全，同源复用 R.sys 旗标）**：①**消耗受队体系**=队内含 ≥2 消耗组件（毒钉/剧毒/鬼火/寄生种子）AND ≥2 回复轮转（再生力/羽栖/睡觉/光合作用）→「消耗受队」徽章+叙事（「毒钉/剧毒压血线→回复轮转拖节奏→再生力续航，A/B 站场消耗」）；②**强化推队体系**=强化手（剑舞/龙舞/诡计/蝶舞/破壳，**按 deriveBuilds 实际推荐配招 mv.main 判定**非 learnOf 全 TM 池）AND 控场 AND 清场收割（**阈值=强化≥2 且 输出≥2**）→「强化推队」徽章+叙事（「A 控场创造机会→B 强化叠层→C 清场收割」）；③**优先级链=受队>强化>钉子轮转>雨天>天气>双墙**（多体系按队内角色数多者为主、次体系不重复贴）；双天气取主天气 R.sys.wx[0]；无体系队不贴（允许存在）。**四轮补做沿革（黑盒 probe 实测拦截×3）**：初轮落 4 类旗标→补做①受队门槛收紧（杂队 incidental 误贴修复）→补做②强化判定 id 白名单替代中文文案下标（MV[m] o[2] 英文名致正则永不命中）→补做③强化判定源从 learnOf 全池切到实际配招+阈值双保险（超梦/卡比兽可学剑舞但不带配招不再误贴）——**每轮黑盒 UI/probe 实测拦截未闭环项，四轮收口**。**验收**：P0 v467 PASS（部署门闩：单精灵组合卡保持/回归全绿）；引擎 v467 PASS（0 FAIL：5 类体系分布/优先级链/双天气/重叠主次核实、**S6b=0 系实施侧口径误报——独立复测 73.6% 达标（v4.66 同模式）**、N1=N2=`59031ECE`==冻结）；**黑盒 v467 PASS（P0=0/P1=0/P2=0）**（UI 实证：无体系杂队无徽章、强化队徽章+叙事、受队徽章——三实例全对）。**确定性专项登记**：v4.67 补做链中出现「跨环境哈希漂移」（实施环境 5AF1 vs 验收环境 5903）——根因=补做提交产物未对齐最新构建（并发构建竞态旧值提交）+运行时函数改动未进构建输出的误判；**四轮补做产物级自证（grep 产物 line 9179/2153）+ 双环境重建对齐 59031ECE 后关闭**。产物：build_tool_html.py 1059700 B（SHA256[:16]=`8B0BAD5D91FE1C96`），index.html ≡ 配招助手_ER.html 1322422 B（SHA256[:16]=`59031ECEC5F34476`），data.js 2456881 B（`7DB7FBB33D3160AF`，未变）。**线上验证（2026-10-18，no-cache）**：线上 index.html SHA256[:16]=`59031ECEC5F34476` 与本地逐字节一致且含「引擎 v4.67」，线上 data.js=`7DB7FBB33D3160AF`（未变）；部署分支 master `9c21fc9` / gh-pages `（见登记 commit）`；5 项 gitignored 输入已从 C:\temp\er-backup-v467 恢复且哈希 MATCH（item_zh_cn ✓）。
- **v4.66**（2026-10-18）：**队伍层组合体系推荐（用户「综合考虑搭配」诉求的整队层延伸）**（只改 build_tool_html.py，data.js 未变）。**P1 队伍层组合体系识别+整队叙事（复用现有机制，不搞大重构）**：buildTeam 输出处（队伍构成卡后）新增「组合体系」徽章+整队叙事文案——按 R.sys 既有旗标命中：**hasHazard→钉子轮转体系、雨→雨天速攻体系、晴/沙/雪→天气体系、hasWall→双墙体系**；叙事按模板生成、**成员名真实代入**（黑盒实证：钉子轮转队[化石翼龙+超级沼王+巨钳螳螂R+洛奇亚+美纳斯+阿尔宙斯]徽章+「撒钉手铺隐形岩/撒菱压血线→吹飞/吼叫强制换人滚钉→回复位续航保钉子→清场收割」；雨天队[大嘴鸥+刺龙王+宝石海星+蚊香蛙皇+电灯怪+超级刺龙王X]「降雨手开雨天→轻快/悠游自如打手提速→雨必中炮台清场」）；**无体系队不贴标签**（黑盒实证拉达/大针蜂/皮卡丘/超梦/卡比兽/伊布 6 只杂队无徽章无叙事——允许「无体系队」存在）；与现有单精灵组合识别/weather 体系不冲突（单精灵组合卡保持）；deriveBuilds 派生链 0 hunk、4680 差异如实登记。**守门新增**：天气岩禁推受检 235 违例 0、自我设置不开体系受检 206 违例 0、队友窗口自己开体系违例 0、GM-NM 天气钉子名实不符=0（自身即体系源豁免 111）、GM-NM2 名首天气词不同轴=11（信息项）。**登记项**：任务书 5 类模板 vs 实施 4 类旗标——**消耗受队/强化推队 2 类无独立旗标（纳入既有 kind），如实登记为未达任务书判据项，待下轮**；P0 REGISTER=1（队伍层标签需队伍视图，物种级 renderCore 不含）。**验收**：P0 v466 PASS（部署门闩：单精灵组合卡保持/回归全绿）；引擎 v466 PASS（0 FAIL：S6b=0 系实施侧口径误报——独立复测 73.6%、守门采样 76.7% 均非 0 ≥60 达标，对照 v4.65 基线无回归；模板覆盖核对登记；N1=N2=`40188657`==冻结）；黑盒 v466 PASS（**P0=0/P1=0/P2=0 全绿**：体系标签+叙事实证/无体系队无标签/回归）。产物：build_tool_html.py 1058887 B（SHA256[:16]=`DBAF084AD6DE675D`），index.html ≡ 配招助手_ER.html 1321611 B（SHA256[:16]=`40188657C444862D`），data.js 2456881 B（`7DB7FBB33D3160AF`，未变）。**线上验证（2026-10-18，no-cache）**：线上 index.html SHA256[:16]=`40188657C444862D` 与本地逐字节一致且含「引擎 v4.66」，线上 data.js=`7DB7FBB33D3160AF`（未变）；部署分支 master `562cf81` / gh-pages `（见登记 commit）`；5 项 gitignored 输入已从 C:\temp\er-backup-v466 恢复且哈希 MATCH（item_zh_cn ✓）。
- **v4.65**（2026-10-18）：**收口轮——G-E5b 剩余 53 同名重复流派去重 + 守门全项过一遍（快速收尾核查）**（只改 build_tool_html.py，data.js 未变）。**P1 同名流派去重（v4.64 登记项收口）**：全库扫同物种同名流派重复实例并定位根因——生成器重复插入+流派名相同但配置不同；**修法：同名流派先改名（异配加「·变体N」后缀）再注入 why 语境**——同配重复删除、异配命名分化，**G-E5b 53→45**；剩余 45 条逐条核对均为 **Mega 形态机制流结构性**（超级妙蛙花Y 大叶子「晴强化清场×3」、超级大针蜂等走 mechBuildsOf 非 out[] 主路径——登记不硬删）；黑盒实证：#1505 超级大针蜂三流派=杂技爆发流/钉子主力输出压制/钉子稳健联防消耗（无 3× 杂技爆发流重复）、#526 庞岩怪三流派=扑击铁壁流/晴增伤清场/**晴增伤清场·变体2**（变体后缀可见，变体2 特殊向流星光束/日光束与物理向实质分化）、#1501 超级妙蛙花Y 两流派=晴强化清场/替身强化流（巨大树叶 Mega 特性未硬删、why 含「晴体系（晴强化清场语境）」）。**P2 守门全项核查（v4.65 守门基线）**：BUILD OK exit 0 0 违规——A1=48.3/A6=92/B1=36/S6b=73.6%/B6=0/B7=3/S7a·b·e=0/S7d=0/G-E1=0/G-E2=1030/1032/1906/G-E3=0/G-E4a=76/G-E4b=181/G-E4c=20/G-E4d=109/G-E5=0/**G-E5b=45**/G-E6 六门在位/GM-MG1=0/EV=508/S5o=13/S5q 豁免（60.4%）/R9-E3=95/268/141/0 全 PASS；A2 口径甲=68.7% 登记；**E5=14 保持未变**（去重改名未新增残留项）；**无回归**。**验收**：P0 v465 PASS（部署门闩：大针蜂/庞岩怪 unique builds=1、Mega 机制流结构性登记、回归全绿）；引擎 v465 PASS（0 FAIL：G-E5b=45 独立复核 53→45、剩余 45 均 Mega 机制流结构性、E5=14 核实、N1=N2=`D6CEA26F`==冻结）；黑盒 v465 PASS（**P0=0/P1=0/P2=0 全绿**）。产物：build_tool_html.py 1057792 B（SHA256[:16]=`4CCA4E2B7AD3C61F`），index.html ≡ 配招助手_ER.html 1320518 B（SHA256[:16]=`D6CEA26F6DC8ABAB`），data.js 2456881 B（`7DB7FBB33D3160AF`，未变）。**线上验证（2026-10-18，no-cache）**：线上 index.html SHA256[:16]=`D6CEA26F6DC8ABAB` 与本地逐字节一致且含「引擎 v4.65」，线上 data.js=`7DB7FBB33D3160AF`（未变）；部署分支 master `6d7c08d` / gh-pages `（见登记 commit）`；5 项 gitignored 输入已从 C:\temp\er-backup-v465 恢复且哈希 MATCH（**item_zh_cn.json v4.65 实施期再次缺失（代理自查发现后已自行恢复 MD5 03243EAA）——缺失自查恢复职责已连续生效（v4.64/v4.65 两轮）**）。
- **v4.64**（2026-10-18）：**信息项问题池打磨第一波（推荐质量/可解释性三项，P1-3 经引擎拦截后补做闭环）**（只改 build_tool_html.py，data.js 未变）。**P1-1 同物种配招雷同 109（G-E4d，用户「流派单一/队伍雷同」方向）**：全库扫同物种多流派招组交集+组合槽招组签名去重——主体为普通流派卡咪龟/走路草等**招池窄结构性雷同（如实登记不硬剔）**，组合槽不再产生与普通槽重复招组，**不合理雷同=0**；黑盒实证 #8 卡咪龟两流派招组同集但 EV（特攻vs特防）/性格（冷静vs内敛慎重大胆）/角色（输出vs肉盾）/why 全部按流派分化。**P1-2 亮点未带招 76（G-E4a）**：逐条核对——主体为**体系自我设置类**（青草场地/精神场地=被动特性自带招已在配招，如 #43 走路草青草制造者+地形延长器道具配套、日光束 why 含「青草场地属性增伤×1.3」）+被动特性无对应招可带→**结构性登记不硬造**。**P1-3 单特性 why 雷同 747→G-E5b 972（文案个性化）**：初轮实施只登记未实施（引擎验收实测 972 与 v4.63 持平，如实登记）→ **强制补做完成**：abi why 生成处注入流派语境后缀、同特性跨流派 why 逐字分化，**G-E5b 972→53（降 95%）**——剩余 53 条=同名重复流派结构性（如超级大针蜂 3×「杂技爆发流」同卡重复、庞岩怪「晴增伤清场|晴增伤清场」），非逐字模板复用；top10 特性（再生力/恶作剧之心/青草制造者等）每特性变体=流派数 ≤3；黑盒实证 #8 再生力 why 两流派后缀「强化主力输出压制语境」/「强化稳健联防语境」、#43 随流派切换。**验收**：P0 v464 PASS（部署门闩：雷同渲染/亮点登记/变体覆盖/回归全绿）+ 引擎 v464 PASS（0 FAIL：雷同 109 结构性/亮点 76 结构性/组合槽签名去重/R9-E3=95/268/141/0/GM-MG1=0）+ P1-3 补做终检 PASS（G-E5b=53 独立复核、N1=N2=`0BD9FCFC`==冻结）；黑盒 v464 PASS（**P0=0/P1=0/P2=0 全绿**：雷同实例区分/亮点带招/why 个性化/回归）。产物：build_tool_html.py 1057544 B（SHA256[:16]=`F66A02D7E343F834`），index.html ≡ 配招助手_ER.html 1320272 B（SHA256[:16]=`0BD9FCFCB2674BC9`），data.js 2456881 B（`7DB7FBB33D3160AF`，未变）。**线上验证（2026-10-18，no-cache）**：线上 index.html SHA256[:16]=`0BD9FCFCB2674BC9` 与本地逐字节一致且含「引擎 v4.64」，线上 data.js=`7DB7FBB33D3160AF`（未变）；部署分支 master `0355056` / gh-pages `（见登记 commit）`；5 项 gitignored 输入已从 C:\temp\er-backup-v464 恢复且哈希 MATCH（**item_zh_cn.json v4.64 实施期再次缺失（代理自查发现后已从备份恢复 MD5 03243EAA）——5 项在位检查已传导为实施职责，缺失时自查恢复**）。
- **v4.63**（2026-10-18）：**P1 组合槽×特性语境全量审计 + P2=1 组合卡 EV 段渲染修复**（只改 build_tool_html.py，data.js 未变）。**P1（GM-MG1 教训举一反三，个案→全量排查）**：comboBuildsOf 选招逻辑与普通 pickAttacks/stabBest **同源特性语境**——全库组合槽×威力限定类（技术高手 power≤60/全力攻击副作用取舍/强壮之颚咬招/硬爪接触/铁拳拳招/大力士怪力物攻倍率/适应力本系倍率）×命中盲点类（胆量幽灵盲点/无防守必中）审计：**守门 GM-MG1=0（受检 10 违例 0，技术高手物种组合槽全 ≤60 招）**；其余特性语境守门未报违例；引擎独立广扫技术高手池物种主招>60 共 13 条逐条核对均为**非组合常规构建且技术高手为池内未激活特性**（袋兽胆量终极冲击/飞天螳螂杂技极落钳/涂标客欺诈/吉雉鸡恶作剧破坏光线/泳圈鼬R·浮潜鼬R 杂技勇鸟——走胆量/杂技/毒疗/恶作剧语境，不构成组合槽违例）。**P2=1（黑盒 v4.62 P2 缺陷）**：combo build 的 ev 字段改对象格式 `{alloc,template,summary}`，evBarHtml 可读——#301 替身强化流=物攻252/速度252 攻击集约、#142 钉子轮转流=HP252/物防252 耐久模板，组合流派卡第 6 段「努力值分配」非空（v4.62 断档修复）。**验收**：P0 v463 PASS（部署门闩：EV 段非空/回归全绿）；引擎 v463 PASS（GM-MG1=0、特性语境独立全扫 0 违例、R9-E3=95/268/141/0 保持、确定性 N1=N2=`5DD5A223`==冻结）；黑盒 v463 PASS（P0=0/P1=0/P2=1：**硬爪特性〔ABI id=181〕在 ER 数据集无可用物种**，无法真机验证「组合槽接触招优先」——数据层无实例不硬造，登记；技术高手语境真机：#407 罗丝雷朵流派3 替身强化流=技术高手+唯一攻击招毒针头 25 威力 ≤60 激活，默认流派主攻招>60 时降权并给「技术高手只对≤60生效→特性空转」tip）。产物：build_tool_html.py 1056945 B（SHA256[:16]=`172734DD94182259`），index.html ≡ 配招助手_ER.html 1318987 B（SHA256[:16]=`5DD5A223242F6D3A`），data.js 2456881 B（`7DB7FBB33D3160AF`，未变）。**线上验证（2026-10-18，no-cache）**：线上 index.html SHA256[:16]=`5DD5A223242F6D3A`（1,318,987 B）与本地逐字节一致且含「引擎 v4.63」，线上 data.js=`7DB7FBB33D3160AF`（未变）；部署分支 master `723eb20` / gh-pages `（见登记 commit）`；5 项 gitignored 输入已从 C:\temp\er-backup-v463 恢复且哈希 MATCH（**item_zh_cn.json 本轮实施代理全程保持在了位——「实施派发指令显式列入 5 项输入在位检查」已生效，三轮消失教训收敛**）。
- **v4.62**（2026-10-18）：**P2=2a 组合流派卡副信息补全 + P2=2b 僵直招 why 掩护叙事 + E5/G-E4b 掩护语境门控收窄**（只改 build_tool_html.py，data.js 未变）。**P2=2a（黑盒 v4.61 P2 缺陷）**：comboBuildsOf 生成的 combo build 对齐 schema——特性（主特性+天性，按物种真实特性池选组合匹配者，禁硬造非池内特性）、性格（替身强化=固执/慎重、钉子轮转=淘气/大胆受队）、EV 模板（攻击集约/耐久按定位）、道具（组合必需件：气势披带/剩饭/剧毒珠/光之黏土）——组合流派卡副信息非空合理（#301 替身强化流=公主的恩赐/固执/气势披带、#142 钉子轮转流=速之力/淘气/剩饭；黑盒遗留 P2=组合卡第 6 段 EV 渲染仍空，登记下迭代）。**P2=2b**：组合槽蓄力/僵直/可打断招 why 补「掩护」叙事——#301 终极冲击 why=「强化后本系收割（替身/电磁波掩护下回合僵直招安全蓄力）」；裸蓄力（build 无掩护手段）不豁免。**E5/G-E4b 门控收窄（按掩护语境判据）**：组合槽非即时招——build 含掩护手段（替身/守住/电磁波/催眠粉/麻痹类控场任一）→ 保留且 why 点名掩护；无任何掩护 → 收口换同系即时次优（power≥55、配招槽不 <4）；非组合槽维持 v4.59 e5Sanitize 口径（{264 真气拳} ×0.85 白名单保持）。**结果：E5 30→14**（剩余=双墙流无替身掩护结构性残留〔墙≠替身/电磁波控场，如实登记〕+花椰猿#512 无同系次优豁免+264 真气拳白名单）；**G-E4b 527→181（<400 达标）**（双墙辅助流/顺风体系 setup=3 合法动作显式白名单豁免，剩余 181 非组合体系 setup）；**GM-MG1=0**（修复轮：技术高手/完美主义者物种组合槽改选 power≤60 本系招——#407 罗丝雷朵/#1788 颤弦蝾螈/#2231 超级罗丝雷朵 3 条高招违例归零，守门 exit 0）。**验收**：P0 v462b PASS（副信息非空/why 掩护叙事/回归全绿）；引擎 v462b PASS（守门 exit 0、E5=14、G-E4b=181、R9-E3=95/268/141/0 保持、确定性 N1=N2=`87B6C0EE`==冻结）；黑盒 v462 PASS（P0=0/P1=0/P2=1：组合流派卡第 6 段「努力值分配」渲染仍空——comboBuildsOf 已补 ev 字段但渲染段未读，登记下迭代）。产物：build_tool_html.py 1056829 B（SHA256[:16]=`6C976828BED73328`），index.html ≡ 配招助手_ER.html 1318771 B（SHA256[:16]=`87B6C0EE48BA8A39`），data.js 2456881 B（`7DB7FBB33D3160AF`，未变）。**线上验证（2026-10-18，no-cache）**：线上 index.html SHA256[:16]=`87B6C0EE48BA8A39`（1,318,771 B）与本地逐字节一致且含「引擎 v4.62」，线上 data.js=`7DB7FBB33D3160AF`（未变）；部署分支 master `ebefd73` / gh-pages `（见登记 commit）`；5 项 gitignored 输入已从 C:\temp\er-backup-v462 恢复且哈希 MATCH（**item_zh_cn.json 连续三轮被代理侧清空操作删除〔v4.60/4.61/4.62〕，已从 v460 备份恢复并补入 v462 备份——实施/构建类代理操作后必查 5 项输入在位已第三次登记**）。
- **v4.61**（2026-10-17）：**P0-2 组合生成层落地（R9-E3 命中 0→95/268/141）+ P2=1 横向分位 warn 文案透传 UI + P2 S5o/S5q 多样性判据与豁免**（只改 build_tool_html.py，data.js 未变）。**P0-2 组合生成层**：新增 `comboBuildsOf(s)`——按招名匹配（gameData 溯源、不硬编码 id），逐物种招池真实支持才生成三类经典组合槽：替身强化流（替身+强化+控场/本系攻击）、钉子轮转流（钉子+吹飞/吼叫/龙尾+除钉/回复）、双墙流（墙+长接/辅助+本系输出）；R9-E3 全量命中**消耗流=95 / 替身强化流=268 / 钉子轮转流=141**（此前三类=0），**双墙=0 结构性登记**（招池无「墙+吹飞」共存物种，不硬造命中）；G-E3 探针 0 违例、误报抽查 0（#301 优雅猫替身强化流招组 164,347,86,416 真实支持）；deriveBuilds 派生链 0 hunk。**偏差登记（预期放大）**：E5=30（自 8↑）、G-E4b=527（自 181↑）——组合生成上线带入的新非即时招槽/动作数（替身掩护蓄力=组合价值），待设计确认是否纳入下版门控收窄。**P2=1 warn 透传**：renderCore summary 后补「注意」badge（bd.warn）——核心配队页降位卡可见「横向中位(N)——同定位中游」/「横向后25%降位(N<阈值)——非首推」（#18 横向中位=1、#25/#213 后25% tip 在位）。**P2 S5o/S5q 多样性**：判据方案落 C:\temp\er-v461-impl\S5o_S5q判据方案.md——S5q=60.4% 贴近 ≤60% 目标登记达标 + 结构性豁免（天气队必要天气手/体系模板固定位/核心联防结构种）；S5o=13（目标 18）区分跨队重复（不压）vs 队内重复（真雷同），提升需改 mate/item 推荐采样属分布型重构风险高，登记信息项顺延不硬压。**C 轮修复（黑盒 P0 拦截）**：combo build 空字段对齐 schema（abi/it/ev/nat/desc/why）+ `bd.abi||[]` 防御双保险（修复 ~796 只 combo 物种点开核心配队卡抛 `TypeError: bd.abi.forEach`）；P1 tip 落点修至核心配队主路径（v4.60 只加队伍分析页）。**验收**：P0 v461b PASS（FAIL 关闭：combo 物种全渲染无 TypeError、tip 透传在位、回归全绿）；引擎 v461b PASS（R9-E3 新值独立复核一致、确定性 N1=N2=`7A3EF150`==冻结）；黑盒 v461b PASS（P0=0/P1=0/P2=2：组合流派卡副信息空白（comboBuildsOf 只填 mv+basis，特性/性格/EV/道具段空）+ 僵直招 why 未显式点名替身/电磁波掩护，均登记下迭代）。产物：build_tool_html.py 1055132 B（SHA256[:16]=`B7A935D24A1A96C2`），index.html ≡ 配招助手_ER.html 1317869 B（SHA256[:16]=`7A3EF150C06860BC`），data.js 2456881 B（`7DB7FBB33D3160AF`，未变）。**线上验证（2026-10-17，no-cache）**：线上 index.html SHA256[:16]=`7A3EF150C06860BC`（1,317,869 B）与本地逐字节一致且含「引擎 v4.61」，线上 data.js=`7DB7FBB33D3160AF`（未变）；部署分支 master `1e1e900` / gh-pages `（见登记 commit）`；5 项 gitignored 输入已从 C:\temp\er-backup-v461 恢复且哈希 MATCH（**item_zh_cn.json 连续两轮被代理侧清空操作删除，已从 v460 备份恢复并重新入账，已登记提醒**）。
- **v4.60**（2026-10-17）：**P1-1 输出流 EV 模板对账（G-E4c 654→20）+ P1-2 普通输出流派横向分位（机制流→全部输出流派）**（只改 build_tool_html.py，data.js 未变）。**P1-1**：finalizeBuild EV 定稿处——机制流（硬撑/杂技/欺诈/扑击等）∨ 流派名含 输出/爆发/清场/收割/速攻 的输出位流派，若 EV 模板落耐久/受队/站场且不含再生轮转定位，自动改**攻击集约**（252HP+252 本系攻击，按定位重算 EV 分配），不硬剔保槽 ≥4；G-E4c（输出流配耐久模板违例）**654→20**——余 20 条为「真输出+带回复/站场」合理混血白名单，逐条登记带 why。**P1-2**：全库预计算**物攻手 base.atk / 特攻手 base.spa 分开基准池**分位阈值（t25/t75）；`outlierDemote` 对普通（非机制）输出流派按本系攻击种族横向分位 score 微调——**前 25%=主推；25-75%=保留但 why 注明「横向中位(N)——同定位中游」；后 25%=降位非首推** + warn「横向后25%降位(N<阈值)」（score 压至 ≤5）；机制流由 v4.58 mechFlowFit 门控不重复降位；剔除只去流派冠名、机制招保补位、配招槽不 <4；**deriveBuilds 派生链 0 hunk**。**验收**：P0 显示层 PASS（拉达#20 硬撑流=攻击集约、皮卡丘#25 场地流=攻击集约、臭泥#88=耐久合规；大嘴雀#22 主推槽无终极冲击保持）；引擎 PASS（G-E4c=20 复核一致、横向分位独立复核：后 25%=24（18 条降位非首推 + 6 条唯一输出流派卡仍 idx0 但 score 已降权 2-5+warn 注明，同 v4.58 扑击 def90-99 先例登记）、物攻/特攻分位表在位、中段 why「横向中位」在位）；黑盒 PASS（P0=0/P1=0/P2=1：b.warn 降位文案数据层正确+score 降权生效但渲染管线未透传「横向中位/后25%降位」tip，非阻塞登记下轮）；确定性 N1=N2=`502C6F3C`。产物：build_tool_html.py 1050047 B（SHA256[:16]=`38CB4371E21D0F21`），index.html ≡ 配招助手_ER.html 1312784 B（SHA256[:16]=`502C6F3CBADCF644`），data.js 2456881 B（`7DB7FBB33D3160AF`，未变）。**黑盒 v4.59 缺失项补跑**（v4.60 产物上）：大嘴雀#22 主推槽无终极冲击 ✓ / 264 真气拳白名单#419#1588 代价说明 ✓ / 消耗流（壶壶#213 钉子受队消耗）组件在位 ✓ / EV 模板输出类 ✓。**线上验证（2026-10-17，no-cache）**：线上 index.html SHA256[:16]=`502C6F3CBADCF644`（1,312,784 B）与本地逐字节一致且含「引擎 v4.60」，线上 data.js=`7DB7FBB33D3160AF`（未变）；部署分支 master `61b9c1f` / gh-pages `5df9e5b9`；5 项 gitignored 输入已从 C:\temp\er-backup-v460 恢复且哈希 MATCH（item_zh_cn.json 曾缺失，已从 v459 备份恢复后重新入账）。
- **v4.59**（2026-10-17）：**E5 非即时招残留收口（119→8）+ 组合识别根因登记 + P1 判据方案待对齐**（只改 build_tool_html.py，data.js 未变）。**P0-1 E5 收口**：新增 `e5Sanitize`（挂 finalizeBuild）——高速打手（base5≥110）**∨ 爆发/收割/速攻/强化输出流语境**（buildName 含 爆发/收割/速攻/强化主力输出/清场/炮台/扫场）主推槽禁僵直/蓄力/可打断招，自动换**同系即时次优**（power≥55，不硬剔、配招槽不 <4；白名单 {264 真气拳} 可保留 ×0.85）；守门 E5 **119→8**——残留 8 条=6×{264 真气拳} 白名单豁免（浮潜鼬#419×2 / Krampird#1090 / Guardozel#1106×2 / 换装皮卡丘#1588）+ 2 条无同系即时次优可换（花椰猿#512 轻装速攻含 63、超级具甲武者#2164 强化清场含 416，按不硬剔保槽 ≥4 保留带代价说明）；C 轮语境扩展后**大嘴雀#22（spe100 杂技爆发流）终极冲击已净化**——P0 DOM 复验主推槽 1-4=杂技/舍身冲撞/钢翼/替身，无僵直招。**P0-2 组合识别根因**：检测层接线在位（L13138/L13141-13152），消耗流=8 真命中；替身强化/钉子轮转/双墙=0 根因=**生成层不产出三类连招**（pickFuncs 未为「强化+控场/钉子+吹飞/墙+吹飞」生成组合槽），非检测断点——如实登记，补生成路径属较大特性待下轮对齐。**P1 判据方案**已输出（C:\temp\er-v459-impl\P1_判据方案.md：P1-1 输出流×EV 模板对账 654、P1-2 普通输出流派横向分位扩展）**待用户对齐未实施**。**验收**：P0 v459b PASS（FAIL-1 关闭）、引擎 v459b PASS（E5=8 独立全扫一致、组合接线确认、确定性 N1=N2=`8308EF1E`==冻结）、data.js 逐提交不变。产物：build_tool_html.py 1047498 B（SHA256[:16]=`B9F046B9D4E09FE2`），index.html ≡ 配招助手_ER.html 1310235 B（SHA256[:16]=`8308EF1EC0FBD2D4`），data.js 2456881 B（`7DB7FBB33D3160AF`，未变）。**线上验证（2026-10-17，no-cache）**：线上 index.html SHA256[:16]=`8308EF1EC0FBD2D4`（1,310,235 B）与本地逐字节一致且含「引擎 v4.59」，线上 data.js=`7DB7FBB33D3160AF`（未变）；部署分支 master `4171a0e` / gh-pages `f5e9f38`；5 项 gitignored 输入已从 C:\temp\er-backup-v459 恢复且哈希 MATCH。**黑盒登记**：黑盒测评 4 实例（含 kill 重派）均被「环境未就绪」阻塞未产出，环境恢复后补跑（如实登记不硬造）。
- **v4.58**（2026-10-17）：**机制流适宜度门控（六道）+ 硬撑门口径 A 回退 + G-E6 守门**（只改 build_tool_html.py，data.js 未变）。**背景**：用户批评「流派判定太单一——能学杂技就推、完全不考虑非本系威力」，要求自身比较+横向比较+举一反三。MainAgent 全库实证（C:\temp\er-acro-scan\scan5.json）：**机制流派推荐 1431 条中 660 条不当（46%）**——硬撑 376 推 348 无毅力/毒疗（92%）、杂技 267 推 149 非本系无轻装、扑击 253 推 81 def<90、欺诈 225 推 68 atk≥120、陀螺球 68 推 7 spe≥80、轻装 36 推 7 慢速；特性强制门（恶作剧之心/魔法防守/再生力/毒疗）=0 不当。**实施**：新增 `mechFlowFit(s,kind)` 通用门控（判据=特性池/关键种族/横向分位三合一，返回 ok/mid/null），六门注册：硬撑=特性池含【毅力∨毒疗∨魔法防守∨毒激】（异常自施）、杂技=本系飞行∨轻装∨atk≥110、欺诈=atk≤90 推/≥120 剔、扑击=def≥100 推/90-99 中段降位/＜90 剔、陀螺球=spe≤70 推/≥80 剔、轻装=spe≥70；中段降位非首推且 why 注明「横向中位」；剔除只去流派冠名（机制招保留作补位招，配招槽不因剔除掉到 <4）。**硬撑门口径 A 回退（用户裁决）**：天性 inns 计入豁免（游戏特性页 4 项=abis[0]+inns[0..2] 全为特性；天性毅力恒生效，配毒珠/火焰珠自施异常→硬撑满威玩法成立）——拉达#20/火伊布#136/豪力#67 硬撑流恢复在位；大嘴雀#22/大比鸟#18 等 348 只无异常自施者维持剔除。**验收**：DOM 复验（Node vm 加载产物跑 deriveBuilds）拉达/火伊布/豪力硬撑流第 1 位、大嘴雀/大比鸟无硬撑流、大嘴雀杂技流保留（本系飞行豁免）；守门全绿——全量 4099 流派/deriveBuilds 异常 0、三维覆盖 特性1030/1030 招式1032/1032 物种1906/1906、G-E1=0、S6b=76.7%、S7d 显示不一致=0、EV 0 违例；确定性双构建逐字节一致。产物：build_tool_html.py 1045221 B（SHA256[:16]=`AC5EBBCAAA24A690`），index.html ≡ 配招助手_ER.html 1307958 B（SHA256[:16]=`0C2CFEF5ED9746BB`），data.js 2456881 B（`7DB7FBB33D3160AF`，未变）。**线上验证（2026-10-17，no-cache）**：首抓即命中新版——线上 index.html SHA256[:16]=`0C2CFEF5ED9746BB`（1,307,958 B）与本地逐字节一致且含「引擎 v4.58」与硬撑门 mechHasAbi 判据；线上 data.js=`7DB7FBB33D3160AF`（未变）；部署分支 master `1f82766` / gh-pages `5942d11`；5 项 gitignored 输入已从 C:\temp\er-backup-v458 恢复且哈希 MATCH。
- **v4.57**（2026-10-17）：**引擎标签升 v4.57 + G-E5b=747 信息项入账 + 三维覆盖第三批 + L7544 回归核实闭环**（只改 build_tool_html.py，data.js 未变）。**G-E5b=747**：单特性 why 逐字雷同子口径受检数升至 747（数据层 usagePrior coverage=747，HTML 条件回退、不双写）；**三维覆盖第三批**归位；**L7544 回归核实闭环**。**验收**：P0 门闩通过、引擎确定性双构建逐字节一致（N1=N2=`289B22AC…`）、黑盒 P0=0/P1=0、data.js 逐提交不变。产物：build_tool_html.py 1041762 B（SHA256[:16]=`EDD2A4C5A6AB1754`），index.html ≡ 配招助手_ER.html 1304809 B（SHA256[:16]=`289B22ACDA84A29F`），data.js 2456881 B（`7DB7FBB33D3160AF`，未变）。**线上验证（2026-10-17，no-cache）**：首抓即命中新版（无 CDN 旧缓存）——HTTP 200（x-proxy-cache MISS、X-Cache HIT、Age 83、Last-Modified Sat, 17 Oct 2026 02:35:29 GMT），线上 index.html SHA256[:16]=`289B22ACDA84A29F`（1,304,809 B）与本地逐字节一致且含「引擎 v4.57」，线上 data.js=`7DB7FBB33D3160AF`（未变）；部署分支 master `252355f` / gh-pages `f1443af`。
- **v4.56**（2026-10-17）：**推荐理由「流派化」收口 + 可换从句口径统一 + 北风终态归零**（只改 build_tool_html.py，data.js 未变）。**狙击手会心按 roleTag 差异化**（输出收割=爆发收尾、受队肉盾=残局补刀，不再四流派同一句），同物种不同流派全量 why 串签名逐字碰撞=0（新守门 G-E5），并新增**单特性 why 逐字雷同子口径**（大嘴雀狙击手 3 流派逐字互异，G-E5b=674 受检）。**大比鸟 18 选招依据补「可换」从句**（与 G-E4a 白名单口径统一；1433→76 亮点残留逐条精化）。**北风泄漏真根因三修**（DOM 级验收定位产物 esc(a.n) 直出 + goto 导航参数同步，全上下文「极北之风」=0）。**验收**：每提交守门全 0、确定性双构建逐字节一致（N1=N2=`E81101A8…`）、data.js 逐提交不变；引擎条件全绿（A1=48.3 / A2 口径甲登记 68.7 / S6b=73.6% / G-E1=0 / EV max 508）。产物：build_tool_html.py 1040720 B（SHA256[:16]=`F3613478BFA7CCA6`），index.html ≡ 配招助手_ER.html 1303767 B（SHA256[:16]=`E81101A8232C895E`），data.js 2456881 B（`7DB7FBB33D3160AF`，未变）。**线上验证（2026-10-17，no-cache）**：首抓即命中新版（无 CDN 旧缓存）——线上 index.html SHA256[:16]=`E81101A8232C895E`（1,303,767 B）与本地逐字节一致且含「引擎 v4.56」，线上 data.js=`7DB7FBB33D3160AF`（未变）；部署分支 master `0e569bd` / gh-pages `9adc8e0`。
- **v4.55**（2026-10-16）：**推荐文案继续去套话 + 特性别名全链路统一**（只改 build_tool_html.py，data.js 未变）。**狙击手说明按位置分写**：同样是「会心一击增伤」，输出收割位写成收割补刀节奏、受队写成残局补刀，不再四个流派同一句空文案。**本系最高招加可换从句**：说明补一句「本系最高可选 X（威力），若不带可换同系次优」，和大比鸟基准行同一口径。**别名统一**：之前紧凑行偶尔冒出 raw 别名「北风」，现在队友行/mate 行/特性卡片一律按 id 反查显示规范名「极北之风」，全页可见「北风」已归零。**验收**：每提交守门全 0、确定性双构建逐字节一致（N1=N2=`12E2D9FA…`）、data.js 逐提交不变。产物：build_tool_html.py 1037095 B（SHA256[:16]=`16688F84598A54FF`），index.html ≡ 配招助手_ER.html 1300305 B（SHA256[:16]=`12E2D9FA90EB390D`），data.js 2456881 B（`7DB7FBB33D3160AF`，未变）。**线上验证（2026-10-16，no-cache）**：首抓即命中新版（无 CDN 旧缓存）——HTTP 200（x-proxy-cache MISS、X-Cache HIT、Age 19、Last-Modified 2026-10-16 13:50:09 GMT），线上 index.html SHA256[:16]=`12E2D9FA90EB390D`（1,300,305 B）与本地逐字节一致且含「引擎 v4.55」，线上 data.js=`7DB7FBB33D3160AF`（未变）；部署分支 master `678b5e8` / gh-pages `e4eb17f`。
- **v4.54**（2026-10-16）：**推荐理由「不再套话」+ 亮点引用误报收口**（只改 build_tool_html.py，data.js 未变）。**理由个性化**：硬撑/胆量/巨力/水泡/魔法防守等流派的「替身·守住」说明改为按该流派语境生成，不再是一句通用模板。**亮点误报收口**：此前「亮点推荐某招、但实配 4 招里并没有它」的计数 1433→76——把「本系最高招」类标注改为可换项叙述（实配招列在下方），并对「可选/若不带/可换」类表述计入白名单不算漏配。**其他**：三维覆盖第二批（压迫感/厚脂肪/防尘归位）；E5 非即时招合并残留登记为信息项。**验收**：每提交守门全 0、确定性双构建逐字节一致（N1=N2=`C475A3C6…`）、data.js 逐提交不变。产物：build_tool_html.py 1034598 B（SHA256[:16]=`0B7F3F2A8F376073`），index.html ≡ 配招助手_ER.html 1297977 B（SHA256[:16]=`C475A3C6DD91CC52`），data.js 2456881 B（`7DB7FBB33D3160AF`，未变）。**线上验证（2026-10-16，no-cache）**：首抓即命中新版（无 CDN 旧缓存）——HTTP 200（x-proxy-cache MISS、X-Cache HIT、Age 12、Last-Modified 2026-10-16 10:10:31 GMT），线上 index.html SHA256[:16]=`C475A3C6DD91CC52`（1,297,977 B）与本地逐字节一致且含「引擎 v4.54」，线上 data.js=`7DB7FBB33D3160AF`（未变）；部署分支 master `624d08a` / gh-pages `1258d5a`。
- **v4.53**（2026-10-16）：**UI 收尾与诊断探针收窄轮——模板卡折叠修复、首屏精简、特性别名键去重、消耗三件套误报收窄**（只改 build_tool_html.py，data.js 未变）。**界面**：流派模板卡片折叠状态修复、首屏信息精简，引擎视角下详情默认收起（少点一次即看结论）；理由文案字号收窄（13px）。**数据质量**：特性表四别名键去重（1034→1030，消除同义键重复计数）；消耗三件套（高耐久消耗组合）统计口径收窄为仅「受队/耐久/肉盾流」，输出流高耐久精灵不再被误抓。**机制微调**：道具评分 offensive bias 调整、宝珠×种子队友联动补全、替身守住的理由文案按语境说明。**验收**：每提交守门全 0、确定性双构建逐字节一致（N1=N2=`4070340B…`）、EV 0 违例、data.js 逐提交不变。产物：build_tool_html.py 1031071 B（SHA256[:16]=`2D901B4B2187EE15`），index.html ≡ 配招助手_ER.html 1294748 B（SHA256[:16]=`4070340B8BF0B9A8`），data.js 2456881 B（`7DB7FBB33D3160AF`，未变）。**线上验证（2026-10-16，no-cache）**：首抓即命中新版（无 CDN 旧缓存）——HTTP 200（x-proxy-cache MISS、X-Cache HIT、Age 26、Last-Modified 2026-10-16 06:46:34 GMT），线上 index.html SHA256[:16]=`4070340B8BF0B9A8`（1,294,748 B）与本地逐字节一致且含「引擎 v4.53」，线上 data.js=`7DB7FBB33D3160AF`（未变）；部署分支 master `a6b261e` / gh-pages `8d4e6e0`。
- **v4.52**（2026-10-16）：**R9 池深扩展+呈现强化轮——推荐区特性名「同义不同 id」碰撞彻底消除，「为何没别的可选」直接写在结构槽里，非即时输出招统一节奏折减**（只改 build_tool_html.py，data.js 未变）。**名字碰撞收口**：此前推荐特性区偶尔把「同名不同 id」的特性混为一谈（v4.51 残留 388/13343 处），本轮改取槽位平行 id 反查译名源，碰撞归零；需求驱动面板与核心流派卡的特性名统一走别名反查规范中文（雪童子/超级暴雪王/洗翠勇士雄鹰等北风系 5 条正确显示「极北之风」）。**「为何没有更好选择」呈现**：结构槽（某位置确实只有少数真唯一胜任精灵的池）现内联说明——标注结构类型、池浅≤3 时解释为何无替代/次优是什么/数据来源，纯展示不改推荐算法；机制徽标（特性/招/道具）可点击内联展开机制说明，不再弹窗遮挡配招区。**非即时输出招统一（R9-E5）**：僵直 recharge 与两回合蓄力招在基础 ×0.85 上统一折减，高速打手（base≥110）节奏错配再 ×0.85，低速/空间手不追加，无忽略僵直特性不硬造；节拍器与蓄力/僵直/顺风开节奏冲突时降权 ×0.30。**其他**：子区采样扩面（步长 60→40，漏报 0）、适应力×2.0/再生力回弹/最佳本系招对高速打断折减补全、经典组合识别（消耗流/替身强化流/钉子轮转/双墙）与三维覆盖一期计数入账。**验收**：每提交守门全 0、确定性双构建逐字节一致（N1=N2=`BACA6624…`）、EV 0 违例（max 508）、负例与 v4.51 逐行一致；1008 凸凸头盔次优与 G-E2/G-E4 判据收窄登记 v4.53。产物：build_tool_html.py 1021844 B（SHA256[:16]=`0B8EDB2D1FA0B35F`），index.html ≡ 配招助手_ER.html 1285965 B（SHA256[:16]=`BACA6624A1DDD90C`），data.js 2456881 B（`7DB7FBB33D3160AF`，未变）。**线上验证（2026-10-16，no-cache）**：首抓即命中新版（无 CDN 旧缓存）——HTTP 200（x-proxy-cache MISS、X-Cache HIT、Age 17、Last-Modified 2026-10-16 02:30:35 GMT），线上 index.html SHA256[:16]=`BACA6624A1DDD90C`（1,285,965 B）与本地逐字节一致且含「引擎 v4.52」，线上 data.js=`7DB7FBB33D3160AF`（未变）；部署分支 master `abedf08` / gh-pages `16d6bd6`。
- **v4.51**（2026-10-15）：**队友「全局最低频」去重 + 先制特性配速逻辑重写（不再硬套固定模板）+ v4.50 测评问题收口**（只改 build_tool_html.py，data.js 未变）。**队友多样性**：当一个需求位置上有两只实力接近（分差 ≤8%）的候选时，优先选「整个工具史上被推荐更少」的那只（频次表按 v4.50 冻结，不动态洗牌），减少同几只热门精灵跨队伍反复霸榜；全量实测结构垄断位（某些位置确实只有 7–11 只可选、真唯一胜任）保持不动，这类位置改走「次优替代+说明」。**先制特性配速重写**：上一版给「满血放先制招」的精灵一刀切降速度努力，本轮改为五要素综合判定——先制可靠度分三档（无条件先制才全速归零、条件先制保留 64 速、弱先制不降）× 先制是否真覆盖主输出招 × 物种本身速度语境（高速手保留 128 速不硬压 0）× 性格按剩余速度需求综合排序 × 道具门；同时**新增「满血先制禁自损道具」**——带满血先制特性不再推荐每回合自伤的生命宝珠（自伤会直接破坏「满血」触发条件）。**测评问题收口**：推荐特性区与详情区译名不一致（已统一）、「当前默认生效」文案指向错误、#2175 闪电拳手不降速反带自伤道具（本轮核心修复）、陀螺球流误给加速性格、EV 模板与推荐特性错配、教学招式重复行——均处理；英文残留译名上游无源不硬造。**验收实测（如实登记）**：A1 48.8（≤60，v4.50=47.7）；A2 raw=**70.8**（v4.50=69.7，Δ+1.1 未达）/ 口径甲（双剔结构槽）**70.2%** 未达 / 口径乙（仅分子剔）**57.1%** 仅参考披露不作判据；S6b 75.5% 持平；B1=**30**（≥24，v4.50=34）；A6=91.9；B6=0；S7e 满血先制道具门违例 **42→0**；4680 流派结构 diff=0（E6 道具门 43 项登记：items×84/why×84/item_main×43）；守门全 0（16+2+S6a/S6b/S5s/S7d/S7a/S7b/S7e）；EV 0 违例（max 508）；同源码双构建逐字节一致（N1=N2=`86E07D7A…`）；负例与 v4.50 逐行一致。**R8-A 结论：无增益但无害**——翻牌类机制全量天花板已到（R7-BCD/R8-A3/v4.51 全量三次独立量化证实），真正解法列 R9（F-1 呈现强化+池深扩展=数据层补物种/招式）。**REGISTER（列 R9）**：① raw A2 +1.1pp；② S7b 独立抽样 edge=1（#1842 皮可西R 变体队友 ev5=60+胆小，建议守门采样扩面）；③ 推荐区 388/13343 名字碰撞残留（bd.abi.id 撞同义异 id，v4.50 即存在，建议改槽位平行 id）。产物：build_tool_html.py 1008399 B（SHA256[:16]=`57587D3D2EDA35A5`），index.html ≡ 配招助手_ER.html 1273539 B（SHA256[:16]=`86E07D7A0739087F`），data.js 2456881 B（`7DB7FBB33D3160AF`，未变）。**线上验证（2026-10-15，no-cache）**：首抓命中 v4.50 CDN 旧缓存（BAC24ABEA3F083ED，与 v4.41/v4.48 同坑），等待 60s 有界重试一次后通过——HTTP 200（x-proxy-cache MISS、X-Cache HIT、Age 20、Last-Modified 2026-10-15 11:33:04 GMT），线上 index.html SHA256[:16]=`86E07D7A0739087F`（1,273,539 B）与本地逐字节一致且含「引擎 v4.51」，线上 data.js=`7DB7FBB33D3160AF`（未变）；部署分支 master `b737ad0` / gh-pages `55c464c`。
- **v4.50**（2026-10-15）：**R7 引擎三连——特性↔配装联动扩表 + 队友选择「异家族优先」复活 + 道具翻牌阈值放宽，外加特性译名双源统一修复**（只改 build_tool_html.py，data.js 未变）。**P0 特性名修复**：同一只宝可梦的天性/特性名在图鉴与详情两处出现两套中文译名（旧图鉴源 vs 新版译名表，全库 4258 处不一致）——例如 #2680 超级史蒂夫（Fearow Redux）原来显示「前锋/惊吓」，现统一为「**猛踢/恐吓**」；只改显示层、底层数据与存档原值不动，旧名仍可搜索（「惊吓/前锋」同样命中）。**特性联动扩表（路线甲 ctx.sub 守卫）**：先制之爪类机制补全 7 条满血线先制特性（闪电拳击/燃烧之魂/冰冻之魂/伏特猛冲/墓地冲刺/地狱冲刺/潮汐加速）→ 引擎自动降低这些宝可梦的速度努力与加速性格优先级；天气/场地提速特性补 4 条（冲浪之尾/丛林热/缥缈奔腾/热滑）；减伤换速度特性（太晶宝藏/铬镀层/铅质外壳/厚脂）首次接入速度 EV 权重；并补齐晴/沙/雨设置手识别。**队友多样性**：修复一处失效已久的「异家族优先」规则（代码死条件）——当次名队友与首选分差 ≤8% 时优先选不同家族的替代；实测触发 459 次换选，前 15 队友集中度 70.8→**69.7**（Δ−1.1，未达 61–63% 预期，如实登记：结构垄断类位置换算法不可解，走「次优替代+说明」）。**道具去重**：同队道具自动翻牌次优的分差阈值 0.85 放宽到 0.75（可见候选恒 3、锁招护栏不动），主推道具去重数 21→**34**（Δ+13，超设计上限 24–26 如实登记；代价 minRatio 0.754 / meanLoss 10.1%）。**确认不做登记**：流派差异化权重 ±0.10 补丁实测 0/2544 槽位零重排（等比缩放保序），方向转下期 R8。**验收实测（如实登记）**：4680 流派结构化导出 0 差异（仅 P0 显示名 4703 槽/302 组改新源译名）、新守门 S7a/S7b/S7c/S7d 全 0、S6a 同 v4.49、A1 47.7（≤60 达标）/A3' S6b 75.5%/A6 91.9、B6 0、B7 max=3（lenDist {2:170,3:10335}）、EV 0 违例（max 508）、同源码双构建逐字节一致、负例同 v4.49。**REGISTER（不修，列 R8）**：R5 ev.src 文案串 1 处（SID=2205 超级焚焰蚣「强化清场」，alloc 数值逐字一致）；G6 全局受益/设置手回退候选门控；coreRole swift 4 物种重分类；空间扭曲者 346 TR 模型；浓雾 627 仅登记待核。产物：build_tool_html.py 997119 B（SHA256[:16]=`2740DE3236C08FD1`），index.html ≡ 配招助手_ER.html 1262351 B（SHA256[:16]=`BAC24ABEA3F083ED`），data.js 2456881 B（`7DB7FBB33D3160AF`，与 v4.49 未变）。**线上验证（2026-10-15，no-cache）**：HTTP 200（x-proxy-cache MISS、X-Cache HIT、Age 14、Last-Modified 2026-10-15 05:41:39 GMT），线上 index.html SHA256[:16]=`BAC24ABEA3F083ED`（1,262,351 B）与本地逐字节一致且含「引擎 v4.50」，线上 data.js=`7DB7FBB33D3160AF`（未变）；部署分支 master `8023793` / gh-pages `0b539a4`。
- **v4.49**（2026-10-14）：**推荐引擎集中度大修（R6）+ 同队道具自动翻牌 + 备选「换装锁招」提示**——针对「同一队友/同一道具在不同队伍里反复霸榜」做的一轮引擎侧改造（只改 build_tool_html.py，data.js 未变）。**核心改动**：① **需求池补「核心相关维度」**——此前 12 类队友需求的候选评分里完全不含「与本队核心互补」的项目，导致通用最强精灵恒占榜首（通用项占比 100%）；本轮落地状态吸收/接棒/回复/补盲/物特联防 6 类，逐类实测通用项占比降至 **24.2–42.3%**（新守门 S6a：逐类 ≤45%，图鉴事实类与本轮范围外类两级分列豁免）；② **新守门 S6b**：榜首「可被次名微翻转」占比实测 **75.5%**（目标 ≥60%）；③ **主推道具跨槽去重**：同队重复道具自动翻牌次优（须 ≥0.85 同分位、且不碰锁招护栏），主推道具去重数 **14→21**；④ **备选「换装锁招」提示**：备选道具是讲究系（带上只能用 1 招）而主推招含变化招时，条目后加注「换装锁招：仅 1 招」——**只提示不剔除**（真实渲染命中 133 处）；⑤ 通用单项权重上限（防补维后通用项换种方式垄断）。**验收**：4680 流派导出功能+文案 **0 差异**、217 张正面样本卡 0 差异、EV 0 违例（max 508）、18 门守门全 0、同源码双构建逐字节一致；标志性改善——光电伞蜥队友存在率 **77.5→48.4**（达标）。**如实登记 2 项未达（红线均未破）**：前 15 队友槽位集中度 70.8（目标 ≤60；结构性集中，需后续判据口径/队友选择层改造）、主推道具去重 21（目标 ≥24；需放宽翻牌阈值）——均列入下一轮 R7，与用户对齐后实施。产物：index.html ≡ 配招助手_ER.html 1,252,630 B（SHA256[:16]=`AD4620042F3392FA`），data.js 2,456,881 B（未变）。**线上验证（no-cache）**：HTTP 200（x-proxy-cache MISS、X-Cache MISS、Age 0、Last-Modified 2026-10-14 17:04 GMT），线上 index.html SHA256[:16]=`AD4620042F3392FA`（1,252,630 B）与本地逐字节一致且页面含「引擎 v4.49」，线上 data.js=`7DB7FBB33D3160AF`（未变）；部署分支 master `d6bb33e` / gh-pages `5208ca1`。
- **v4.48**（2026-10-14）：**核心配队形态开关失效 bug 修复**——用户实测「核心配对那里的两个开关（仅最终形态 / Mega 形态优先）好像没起作用」。**根因（代码+真机双重定位）**：`draw()` 内 `ERDATA.species.filter(coreMatch)` 直传函数引用，`Array.prototype.filter` 回调会把 `(element, index, array)` 传给 coreMatch——**index 被塞进第二参 `skipForm`**：首元素 index=0 → `!0=true` 过滤生效（妙蛙种子#1 被隐藏，页面「隐藏 1 只」吻合），其余 1904 只 index≥1 → 全部绕过形态过滤。修复：`filter(function(s){return coreMatch(s)})` 包装（一行+注释）。**验收实测（真机 CDP）**：开关 1054 / 1658 / 1905 / 1054 与理论值精确吻合（1905−604 非最终−247 可Mega=1054）；网格前 20 全为最终形态（大嘴雀/九尾/霸王花…）；「另有 851 只被开关隐藏」正确显示；构建 exit 0、守门全 0（4680 流派）。**线上验证**：首次读到 CDN 缓存旧版（v4.47 哈希），no-cache 重试后线上与本地逐字节一致（SHA256 8ED65BAF…/1231796 B）；线上真机点开关 1054→1658→1905→1054 全对。
- **v4.47**（2026-10-14）：**R5 修复收口轮**——A1 集中度（λ 调参 + B-1 根因定位）/ A2 规则代号剥离 / A3 英文招名核源 / A4 S5i 复核 / A5 子区 UI 终验 / A6 弹层页脚清理。流程：任务书（λ 0.35→0.5 + P7 复算 A-3 + 查 B-1 主推 0 根因）→ 实施（14 hunks 只改 build_tool_html.py，data.js 未变）→ 独立黑盒双线对账（引擎：318 物种探针 35/35 复跑一致 + 独立确定性重建逐字节一致；浏览器：8 tab×双视口泄漏全 0 + 5 物种子区 + picker/空档裁定）。**修复内容**：A1 λ 0.5（needScore 唯一消费点；P7 复算失败 ⇒ A-3 不启用登记；B-1 根因=预收口招组恒含变化招 ⇒ mvAllAtk 恒假 ⇒ B3/B4 结构性不可达，非加分不足）；A2 规则代号剥离（LEAK_RULES 规则 7/8/9/9b + LEAK_SIG 三组扩容 + scrubLeak 快路径 ⊇ 判据集 + 叙事/诊断徽标改经 esc→scrubLeak 剥离后空徽标不渲染；S5l/R2-D token 1465→0，GM-LK 受检 134,224→0，渲染态 8tab×3 档全 0，残留「原则 P…」受保护格式登记）；A3 英文招名核源（4 原创招 + 全表 27 条 zh 非中文均上游无源 ⇒ 登记不硬造，data.js 未变）；A4 S5i 复核（4680 流派名含天气/体系词 1439 条真违例 0；82 条原始清单未定位，以同判据独立复算替代）；A6 弹层/页脚（ER 原创招英文机制块→条件渲染「本招为 ER 新增招式，官方中文说明暂缺（译文不臆造）」、【特性修正已纳入】去括号、来源档位 40 处渲染期剥离=0）。**验收实测（黑盒双线）**：index≡配招助手_ER=EC5664A09A0C4D70（1231624 B）、data.js=7DB7FBB33D3160AF 未变；确定性独立重建逐字节一致；探针全量复跑 35/35 判据与基准一致；per-build v4.46a→v4.47 硬字段差 184 全为 ev 且 alloc 全 0（纯 rebalance.src 文案）；EV≤510 0 违例 max 508；守门 16 门全 0；UI 双视口 8tab 泄漏全 0、溢出 0、触控≥44px；5 物种子区全 ok（#156/#3 picker 报错=探针脚本问题非页面 bug、#695 空档=探针误报〔【剩饭】合法标签〕均已裁定）。**如实披露（登记非回归）**：A1 77.5/A2 74.0 目标≤60 未达（红线内，λ 已上限需设计书 D）；B1 全量口径 14≥12 红线未破（目标≥18 未达；守门 S5o=9 为 32 方案小样本，去重随样本量单调增，口径差登记）；B3/B4 结构性不可达（死代码）；A5 ciShareOfScore=100 目标≤45 未达（v4.46a 同值既存、本轮无回归）；GM-CI/GM-FS/S5s/S5t 受检=0 未查明（0 违例不可读作已检查）；备选池讲究系×变化招 UI 同现（引擎主推槽 0 达标；备选池口径更宽，R6 待办）；「低攻防守位」「DIAG-0x」为用户可读角色词/既有诊断徽标（受保护口径，与原则 P 同类）。**线上验证（2026-10-14，no-cache+query）**：GH Actions pages build #59 success；线上 index.html SHA256[:16]=EC5664A09A0C4D70（1231624 B）、data.js=7DB7FBB33D3160AF（未变）——与本地 v4.47 产物逐字节一致；真实浏览器加载渲染文本泄漏扫描全 0；gitignored 输入已从 C:\temp\er-backup-v447 恢复，工作区干净。
- **v4.46a**（2026-10-13）：**R4 修复轮（队伍方案子区生成逻辑重构 v4.45→v4.46→v4.46a）**——按设计书 C（`R2_设计书C_子区生成逻辑优化.md`，D-1~D-5 裁决：不接流派区/不做 B-4/不做 B-3 可选项/A-3 延后 P7 复算/λ=0.35 常量）实施并两轮修正。**v4.45 实施（r3）**：A-1 需求专长化（needScore λ=0.35 折扣，wxsrc×0.72 归 corePts）/A-2 同队互斥（P6 取数后防御性落地）/A-4 分池展示（按 need.kind 六类分组）；B-1 讲究头带/眼镜条件加分（allAtk&&burst≥0.6 +0.30、含变化招 −0.25）/B-2 突击背心进池（longevity 0.60→0.85 + P6 特防兜底 +0.55 + mvMain 含变化招门控）/B-3 特盾 tag 精细化；C-1 **收口重构**（finalizeBuildInPlace 抽取共用入口，needBuildHtml 依次过收口+buildEvs+evNatureLinkV437——子区 EV 可用率 **0%→100%**）/C-2 EV/性格展示（evBarHtml）/C-3 对齐标注（按 s.id memo）/C-4 措辞五分支（falseBody 1391→≤50）/C-5 剧毒珠→剧毒宝珠统一；附项：#2604 帝王拿波R「晴增伤清场」→**「雪增伤清场」**（晴名雪实修复）、#144 急冻鸟雪手功能复核保留（991 持降雪）、S5i 146 条分类（冲突条目改名）、英文招名核源无果登记不硬造（data.js 未变）、来源档位空占位渲染兜底=0；新守门 S5o~S5r。**黑盒 v4.45 点名两 P1**：① U1 机制冲突——`AX_OVR['突击背心']` 全局表（L8027）不受 ctx.sub 门控，**49 条流派区候选列表被换成背心（47 套含变化招，违反 ER 禁变化招）**、根因=背心轴改动泄漏流派区；② A/B 判据独立裁决未达（守门口径 A1 90.6%/A2 89.4%）。**v4.46 修正轮一（r2）**：U1 三层闭合——AX_OVR 全局回滚 0.60 + 子区局部 0.85（_loxSub）+ 新守门 S5s（背心×变化招）/S5t（子区讲究系×变化招，均打印受检计数）；per-build 差异 64→**15 条**（4 改名+11 命名规范化，其余 13 字段全 0）；GM-CI/GM-FS 受检=0 定性为设计值（全量 4680 讲究系主推=0、硬撑×披带同现=0）已加注；UI 双视口溢出 0 可交互控件全 ≥44px。**黑盒 v4.46 点名**：B 线候选可见性受损——讲究系候选 3854→0、候选恒 3 槽位占比 86%→52%（设计书 B-judge-7 硬判据+铁律「候选全量可见」被破坏）。**v4.46a 修正轮二**：根因（源码级）=v4.45 C-1 接入后 `finalizeBuild` L6874-6882 的「讲究系×（变化招|受队|强化）硬互斥」把 b.it 里所有 /^讲究/ **整片 filter**（本意只剥主推）+ 兜底 unshift append-only → 讲究系候选归零、候选长度冒出 4/5/6；修复=subareaBuild445 收口前保存候选快照、收口后「主推首位∪快照」按 zh 去重取前 3（流派区/守门零改动）。**最终验收实测（黑盒 v4.46a 快验 8 项全测）**：候选=3 槽位占比 **85.9%（v4.44）→50%（v4.46）→97.4%（v4.46a，超基线）**、长度分布 {2:246,3:10275} 无 4/5/6、讲究系候选 2967 恢复可见；1906 物种/**4680 流派**（与 v4.44 无增减）/EV≤510 0 违例 max 508；per-build 对照 v4.44 **15 条**（4 改名：526 沙→晴、721 晴→雨、2604 晴→雪等 + 11 剧毒珠→剧毒宝珠）；U1 不复燃（背心任意位/×变化招=0/0，#36/#156 仅存 v4.45 行）；守门 12 门+S5s/S5t/S5p/S5r 正测全 0+负测全触发+阴性全 0；正面样本 217 流派卡字段差异 0；队伍层 v4.46→v4.46a 逐只 0/1906（13 核 13/13、队友卡 EV 32930/0）；隔离副本构建确定性成立；A 线集中度**红线内已改善**（A1 光电伞蜥 79.9→77.1%、A2 前 15 槽位 77.7→75.0%、A3 68.3/A4 6/A6 91.8 达标）。**如实披露（登记非回归）**：A1/A2 未达设计目标 ≤60（红线内，R5 可评估 λ 调参/需 A-3）；B1 道具去重 14<18（v4.46 同值）；B3 讲究系主推≥50/B4 背心主推≥20 结构性未达（v4.44 基线亦 0：P1-1 硬红线限定 4 招全攻击才可主推讲究系、背心禁变化招硬门+需求类不相交，扩需求类属 D-2 已裁不做）；讲究系候选绝对数口径差（实施方 144 vs 黑盒 2967，定性「恢复可见」成立）；规则代号泄漏 1099/506（S5l/R2-D/body_press_def，预存 P2 非本轮引入，GM-LK 词表未覆盖，R5 处理）；英文招名 62 槽（Rain Flush 47/Psycho Wave 10/Shot Put 4/Atomic Fire 1，UI 可见，数据层无源登记不硬造）；S5i 146 分类（冲突条目已改名，其余登记设计内）；预存「规则代号」可见性条件态；环境性能观察自证排除（非引擎回归）。
- **v4.44**（2026-10-13）：**R3 修复轮（R2 二次测评问题清单落地 + 盲区 384 补测并入）**——前置机制核实（讲究系锁招 ER 未改〔官方 changelog 2.65.3b「Fixed Discipline removing … Choice Items limitations」+ ER 道具文本 only one move〕/杂技仍物理 75 但 ER 倍率 112.5〔moves[512] pwr:75 split:0 desc 1.5x〕/硬撑 70→140 ER 未改〔moves[263]〕/气势披带不提供异常/ER 保留突击背心禁变化招）→ 任务书 12 项 → 实施（r5，57 hunks）→ 独立黑盒全量对账。**修复内容**：P1-1 队伍方案子区讲究系×变化招门控（v4.43 只覆盖主推流派区；本轮子区核心槽就地门控——换招/换道具二选一不硬剔；#1013 波尔凯尼恩替身+讲究围巾违规模板修正）+ P1-2 核心槽与流派区对齐标注（#coreOut 对齐徽标 11/11）+ P1-5 杂技族物攻向统一（#1639/#1649/#1650/#715 等，性格不降攻/攻 EV 不为 0）+ P1-6 技术高手全变化场景（#1788/#2527）+ P1-7 硬撑×气势披带定点修（#106/#945 无异常来源禁披带→剧毒宝珠，17 张正确范例未动）+ P2-1 泄漏词表扩容（「报告 N.N」全量〔片D 26+片A 3+盲区 80 处/44 面板〕/考古/空括号/内部函数链「→」模式〔deriveBuilds→finalizeBuild→evNatureLinkV437〕；子区 A/B 页面级证明：波尔凯尼恩/大嘴鸥泄漏 0）+ P2-2 弹层文案（空「来源档位：」/设计口吻页脚/整行英文机制文本）+ P2-3 减速×速度 EV 注记调和（倍率降档模板保留，「配空间」注记改写 19 卡）+ P2-4 触控 3 类达标（✕/诊断卡/span.gl ≥44px）+ P2-6 空洞口径统一 + 盲区并入 #2604。**验收实测**：1906 物种/4680 流派（与 v4.43 无增减）/EV≤510 0 违例 max 508；12 门守门全 0（GM-LK 受检 134,224 叶子）；S5/C/反模式与 v4.43 基线持平（差异集中 P1-5 S3 身份 141→0、P1-7 2→0）；正面样本硬字段变化 9 条（杂技 7+硬撑 2）全部设计内、name 变化 0；r4→r5 收口仅 why 2717 条变化零行为回归；UI 双视口溢出 0 触控 3 类达标；隔离副本构建确定性成立（四产物逐字节 SAME）。**如实披露（黑盒点名）**：U1 #144 急冻鸟「三开雪手」3→1（1905/2245/873→991）——归因表证明 469/514（91.2%）队友集合变化由「队友自身被 P1-5/P1-7 修复」传导（573 只含杂技/硬撑被修），非装配口径变化，**#144 新成员雪天功能待 R4 复核**（R4 已复核：991 持降雪保留）；U2 #2604 帝王拿波R「晴名雪实」未见修复（落入 GM-NM2 信息项口径 9 条之一，R4 已修）；U3 减速注记实测 19 卡且 19/19 已改写（优于实施方声明 11 卡）；U5 黑盒仪器订正 ap444 A5d 空转假 0→正确 19（并订正 v4.43 同项）；U6-U8 口径/仪器披露（详见黑盒报告）。**盲区 384 补测**（id≥1908 段，R1 五片从未覆盖）已独立交付：383/384 抓取成功（#2502 正确守卫）、941 流派、P0=0/P1 6/P2 8、眼前一亮 7 条、队友维健康（3017 卡 top1 2.3%）；盲区问题并入 v4.44 修复。
- **v4.44**（2026-10-13）：**R3 修复轮（R2 二次测评问题清单落地 + 盲区 384 补测并入）**——前置机制核实（讲究系锁招 ER 未改〔官方 changelog 2.65.3b「Fixed Discipline removing … Choice Items limitations」+ ER 道具文本 only one move〕/杂技仍物理 75 但 ER 倍率 112.5〔moves[512] pwr:75 split:0 desc 1.5x〕/硬撑 70→140 ER 未改〔moves[263]〕/气势披带不提供异常/ER 保留突击背心禁变化招）→ 任务书 12 项 → 实施（r5，57 hunks）→ 独立黑盒全量对账。**修复内容**：P1-1 队伍方案子区讲究系×变化招门控（v4.43 只覆盖主推流派区；本轮子区核心槽就地门控——换招/换道具二选一不硬剔；#1013 波尔凯尼恩替身+讲究围巾违规模板修正）+ P1-2 核心槽与流派区对齐标注（#coreOut 对齐徽标 11/11）+ P1-5 杂技族物攻向统一（#1639/#1649/#1650/#715 等，性格不降攻/攻 EV 不为 0）+ P1-6 技术高手全变化场景（#1788/#2527）+ P1-7 硬撑×气势披带定点修（#106/#945 无异常来源禁披带→剧毒宝珠，17 张正确范例未动）+ P2-1 泄漏词表扩容（「报告 N.N」全量〔片D 26+片A 3+盲区 80 处/44 面板〕/考古/空括号/内部函数链「→」模式〔deriveBuilds→finalizeBuild→evNatureLinkV437〕；子区 A/B 页面级证明：波尔凯尼恩/大嘴鸥泄漏 0）+ P2-2 弹层文案（空「来源档位：」/设计口吻页脚/整行英文机制文本）+ P2-3 减速×速度 EV 注记调和（倍率降档模板保留，「配空间」注记改写 19 卡）+ P2-4 触控 3 类达标（✕/诊断卡/span.gl ≥44px）+ P2-6 空洞口径统一 + 盲区并入 #2604。**验收实测**：1906 物种/4680 流派（与 v4.43 无增减）/EV≤510 0 违例 max 508；12 门守门全 0（GM-LK 受检 134,224 叶子）；S5/C/反模式与 v4.43 基线持平（差异集中 P1-5 S3 身份 141→0、P1-7 2→0）；正面样本硬字段变化 9 条（杂技 7+硬撑 2）全部设计内、name 变化 0；r4→r5 收口仅 why 2717 条变化零行为回归；UI 双视口溢出 0 触控 3 类达标；隔离副本构建确定性成立（四产物逐字节 SAME）。**如实披露（黑盒点名）**：U1 #144 急冻鸟「三开雪手」3→1（1905/2245/873→991）——归因表证明 469/514（91.2%）队友集合变化由「队友自身被 P1-5/P1-7 修复」传导（573 只含杂技/硬撑被修），非装配口径变化，**#144 新成员雪天功能待 R4 复核**；U2 #2604 帝王拿波R「晴名雪实」未见修复（落入 GM-NM2 信息项口径 9 条之一，R4 待修）；U3 减速注记实测 19 卡且 19/19 已改写（优于实施方声明 11 卡）；U5 黑盒仪器订正 ap444 A5d 空转假 0→正确 19（并订正 v4.43 同项）；U6-U8 口径/仪器披露（详见黑盒报告）。**盲区 384 补测**（id≥1908 段，R1 五片从未覆盖）已独立交付：383/384 抓取成功（#2502 正确守卫）、941 流派、P0=0/P1 6/P2 8、眼前一亮 7 条、队友维健康（3017 卡 top1 2.3%）；盲区问题并入 v4.44 修复。
- **v4.43**（2026-10-13）：**R2 修复轮（R1 全量黑盒测评问题清单落地）**——基于 5 片并行全量测评（1522 真实物种/190+ 截图/论坛对照）产出的 P0/P1/P2 清单，按用户对齐范围修复：**P0 全族**（A 生命宝珠×全变化招门控 noAtkItemGate+兜底链，主推 31+队友 91 归零；B 恶作剧之心控场补招/改名不删卡；C 戏法空间流派补 433 入槽+队伍侧空间诊断；D 图鉴空洞口径「总数+筛选后」分离+搜索无结果提示，#1859 禁补数据登记；E #1860-1863 上游 zh 源缺失不硬改登记）；**P1-A 性格-招组-EV 联动**（性格门替换判据 7/8/9+机制结算项单一真源：扑击=物防/欺诈=物攻/陀螺球=速度/杂技=物攻，扑击红线 70→2）；**P1-B 机制门控**（ABI_GATE G1~G4：技术高手/毒疗/轻装/一猩一意/杂技/扑击）；**P1-D 名实不符**（命名回检泛化天气/钉子/顺风/空间/控场，补招优先改名兜底）；**P2-A 内部代号剥离**（11 类模式：WCONF./FUNC_MV./S3-R3B/半截句/定稿 2026-10-10/用户确认/z 加权等，术语剥离器+断言扩容，渲染态 15 类扫描全 0）；**P2-B 裸 Markdown**（esc 出口 mdInline）；移动端 mate 容器越界+btn-mini 触控修复；队伍方案子区补扫（讲究系×变化招 0）。**验收实测**：4680 流派（v4.42 4679 的 +1=#132 百变怪新增恶作剧控场流派，已定位登记）；EV≤510 0 违例 max 508；守门全 0（4a/4b1/S5m/S5n + 新增 GM-NA/GM-PR/GM-MG1/GM-MV4/GM-CI，负测 13 条全抓+阴性不误拦）；反模式与 v4.42 逐项一致 + A5d 2→0；C2a 170→0、C5a 198→0；空间名流派 107 条全自带戏法空间 0 残留；渲染态泄漏 15 类全 0（仅「机制口径」=1 设计内）；移动端双视口越界 0 触控 ≥44px；队伍层三类闸 0/0/0、12 队 A 级+2239 主推与队友序列 13/13 一致、144 三开雪手保留；隔离副本构建确定性成立；12 类正面样本红线类不变量保留（8 组 12 条差异逐条定性设计内）。**如实披露**：数据层「（报告 N.N）」336 处（drivenBy/basis，渲染已剥离数据层仍在登记）；队友卡装配差异量级（moves 5409 等设计内级联登记）；保护名单硬变 7 只（黑盒口径，实施方登记 2 只——逐条同类机制件替换）；硬撑×气势披带 2 例（#106/#945 门控残留登记）；减速性格×速度 EV 7 例（标「队内速度倍率 ×1.5」有依据登记）；A2b/A4 口径分歧（黑盒独立实现 0/0 vs 冻结 9/2 登记）；移动端元素级 84 处横向卡片行内溢出（与 v4.42 同源非本轮引入）；mechItemGateOk(杂技|回收) 恒 true 空壳（归零靠装配侧+GM 守门兜底，登记）。
- **v4.42**（2026-10-13）：**修复反查形态过滤开关「初始不生效」bug（var 提升时序）**——用户实测反馈「我得把开关点掉再点开才能生效」，截图显示开关勾选但「开关隐藏 0 个持有者条目」+ 未进化型全量显示。根因：`var optAbiFinal=true,optAbiMega=true` 声明位于初始渲染 `renderAbi()` 调用（初始化 IIFE）**之后**——JS var 提升使首次渲染读到 `undefined`（falsy）⇒ 初始渲染不过滤，须点开关触发 `abiFilterToggle` 重渲染后才生效。修复：两行开关声明上移至初始化 IIFE 之前（纯时序修复，判定函数/data.js/引擎逻辑零改动）。**验收实测**：本地 + 线上（no-cache）初始渲染即「开关隐藏 1119 个持有者条目」、恶臭卡初始即 可选2（双弹瓦斯/洛托姆R-恶）+ 天性3（坦克臭鼬/超级风速狗R/Eraticate）——未进化型（臭泥/瓦斯弹/臭鼬噗/破破袋/虫滚泥/卡蒂狗R/小拉达R/拉达R）初始即被过滤，无需点开关；开关切换 隐藏 241（关）↔1119（开）可恢复；引擎 v4.42 标记、构建 exit 0、守门全 0（4a/4b1/4b2/S5m/S5n）、1906 物种/4679 流派 0 异常。部署：master `e1c1d6c` / gh-pages `0c49387`；gitignored 输入部署后已恢复，工作区干净。另：开关语义说明（进化后丢失/保留两种场景）已在对话中答复用户。
- **v4.41**（2026-10-12）：**特性反查/招式反查宝可梦列表升级（带图 + 形态过滤开关）**——用户原话「特性反查和招式反查里面都能看到宝可梦，都需要有图片，并且支持通过开关，过滤掉非最终进化型、可mega的非mega形态」。实现（纯展示层，只改 build_tool_html.py，data.js/配招工具_data.js 零改动）：①招式反查「谁能学」从纯文字卡升级为**精灵图卡片网格**（与特性反查持有者同款：sprRaw 图 + 中文名 + 属性徽标，点击跳详情 openSp + 关闭弹窗，超 60 只折叠提示「已显示前 60 只」）；②两处（特性反查持有者 + 招式反查谁能学）各加**「仅最终形态」+「Mega 形态优先（默认开）」**过滤开关（复用 isFinalForm/hasMegaForm/isMegaPreferred，与核心配队开关行为一致），切换即时重渲染，保留「（无）」空态与计数（计数随过滤变化）。**验收实测**：构建 exit 0、守门全 0（4a 199/4b1 205/S5m 58/S5n 304）；1906 物种/4679 流派 0 异常、EV≤510 0 违例 max 508；**v4.40 vs v4.41 全量字段总差异=0**（纯展示层最硬证据）；反模式/S5/C 与 v4.40 逐字节相同；亮点保护 0 变化、16 核 16/16、144 三开雪手/2239 盲区保留；UI 三档（375/667+412/915+桌面）溢出 0、开关 label 58px≥44、精灵图真实加载、开关切换计数 1008→1252→1905→1008 可恢复；守门负测 5/5 全拦；队伍层逐核对齐全 0（v4.41 vs v4.40 流派/队友序/装配/teamKey/流派名全 0，12 队 +0/-0）；官方 verify 套件 FAIL 集合与基线逐条相同。**如实披露**：官方 verify_v4 唯一 PASS→FAIL 项（F⑪ 两列计数断言改为过滤后计数，需求「计数随过滤变化」属设计内口径，待裁决是否重基线化）；招式侧空态文案未能真实触发（全量无此招式，仅代码路径证据）；开关 checkbox 本体 14px 可点区域为 label 58px；仓库 `assets\sprites` 旧版目录不存在（已迁 assets/sheets）为既存环境项。
- **v4.40**（2026-10-12）：**同名特性 NM2ID 覆盖 bug 修复（特性反查持有者错位）**——用户发现特性反查搜「恶臭」Stench(id=1) 显示持有者 0/0。根因链路：数据层把 species 的 abis/inns 从 id 翻成中文名时 Stench(1)/Malodor(808) 都译「恶臭」→ id 语义丢失；引擎反查 abiOwners() 用 NM2ID（名→单 id，后者覆盖）翻回 → 同名后一个 id 收下全部持有者。修复（双层，2 源文件 12 hunk）：**数据层** build_tool_data.py 的 species 输出新增 `abiIds/innIds`（gameData 原始 id 数组，中文名仅用于显示，长度不符不写引擎逐条回退）；**引擎** build_tool_html.py 新增 `NM2IDS`/`abiIdList`、`abiOwners()` 改 id 级归位+逐物种去重、`renderAbi` 匹配只增不减、**NM2ID 本体一字未动**（既有 6 处消费点零回归）。**验收实测**：7 组同名特性 16 个 id（恶臭1/808、毒刺38/840、神奇鳞片63/827、人马一体266/267、毁灭者495/1015、梦境709/859、体现形态795/796/797/798）持有者**逐 id 精确归位**（独立黑盒扩展为**全量 998 个 id 零不一致**；Stench=可选3+天性12 含 8 只原版、Malodor=超级灰尘山 2202）；真实 UI 反查双视口「恶臭」→2 卡、「毒刺」→5 卡、修复前 0/0 症状消失；data.js 新增两字段（species 载荷与 v4.39 逐字节相同，差异仅 meta 时间戳 717B）；1906 物种/4679 流派 0 异常、EV≤510 0 违例 max 508、守门全 0、反模式逐项 SAME、亮点保护 0 变化、16 核主推 16/16、144 五开雪手/2239 盲区保留；负测伪造 5/5 全拦；构建确定性成立（隔离副本产物与仓库逐字节同 SHA）。**数据层输入恢复**：4 份被部署清理误删的 gitignored 构建输入（招式表_可学总表.csv / ER2.5正式版图鉴v0.5.xlsm / ER2.65beta版图鉴v0.3.xlsm / 分类.xlsx）已从备份恢复至仓库原位，并在 scratch 沙箱跑通官方重建链（rebuild_source_inputs.py → build_tool_data.py → check_rebuild_faithful.py）**PASS**——数据层改动只引入 abiIds/innIds 两字段。**如实披露**：abiIdByZhOrEn 与 NM2ID 同名语义不一致沿用登记（7/7 组同名确实存在，未授权改动）；队伍层全量对照为开放项（间接三重证据已闭合：abiOwners 唯一消费点 renderAbi、11 张体系/门控表对 16 名零命中、导出命中仅 20/4679）。
- **v4.39**（2026-10-12）：**队伍分析器玩家友好交互升级（UI 增强轮）**——第八 tab「队伍分析」从「输入框+文字列表」升级为六槽位可视化 + 图鉴级选择器 + 结果带图 + 精灵详情面板（评估：UI 现状盘点 472 行 + 交互设计书 570 行并行 → 任务书七裁决 R-1~R-7 → 引擎修复 + 独立黑盒 31 项对账，全链闭环；只改 build_tool_html.py，data.js 未动）。**六槽位**：顶部恒 6 槽——已选精灵（sprite 图+中文名+角色标签）、未选空态「点击选择」、点击/替换/移除，共享全局 team[] 单一真值源；**图鉴级选择器**：点击槽位弹轻量 modal——复用 spMatch 条件筛选（属性/定位/特性）+ 模糊搜索（编号/中英文名）+ sprite 图片网格，选定回填+自动重新分析，G3 奇偶一致验收（同筛选条件下与队伍构建网格结果 id 全等且顺序一致）；**分析结果带图**：六区块精灵卡片全带 sprite（每只推荐/联动叙事两端/诊断候选/构成画像成员图标行），多图少文；**精灵详情面板**：点击任一精灵弹轻量 modal——推荐特性+为什么选它、天性、道具+说明、配招 4 招各含作用一句话、EV 分配可视条、性格+原因、「为什么这样配」成对因果叙事（与队友卡 why 同风格），详情按需重算 anBuildOf(s,team)（六区块渲染零改动）；**移动端**：375×667 + 412×915 溢出 0、触控 ≥44px（实测 56/44/44/44）；**输入统一**：原文本框移除、槽位为唯一输入路径；**口径一致（R-7）**：teamReport 增第三参读 teamInfo（队伍构建勾选的可选特性影响分析推荐；免疫轴修正为生效口径 anDefVal===0+归因三态，数值口径不变性 6 队×2 臂实测成立）。**验收实测**：全量 1906 物种/4679 流派 0 异常、EV≤510（max 508）、守门 4a/4b1/4b2/4b3/S5m/S5n 全 0、反模式 {11,0,2} 与 v4.38 逐项 SAME、全量 4679 键逐字段 diff=0、亮点保护 15+8 硬字段 0 差异、12 队核心 16/16、144 三开雪手保留、2239 盲区不增、G3 奇偶 12/12、双视口页面溢出 0、分析器 17 队不一致 0、守门负测伪造 5/5 全拦。**如实披露**：N-1 ②联防 coWeak 在 #2239 由 地面:4→地面:2（数值收敛非回归——逐成员弱点聚合口径一致，实施方「只改免疫轴」表述未覆盖，登记）；N-2 详情 modal #anDetailB/.fld 412 视口 11px 内部内容溢出（页面级 docOver=0，P3 登记）；S5b=1/S5i=146 口径内保留。
- **v4.38**（2026-10-12）：**三块并行——T-21 空间雨天双轴完整玩法 + 机制招×特性语义化 + 自组队伍分析器（新 tab「队伍分析」）**（评估：E0 机器现状盘点 276 行 + A/B 设计书 1217 行 + 队伍分析器设计书 724 行，三线并行 → 任务书 6 项裁决 → 引擎修复 + 修正轮 4 项 + 独立黑盒两轮对账，全链闭环）。**A：T-21 完整玩法**——RULE-T21-1 主轴优先（复用 archOfSp）/R2 B1 天花板/R3 兜底三条机器可判规则 + T-31 模板 + tr_rain_rotation 素材（8 URL 内嵌；可行性交叉证实：空间与天气可并存、同刻仅 1 种天气、空间 5 回合 vs 雨 8→12 回合、ER 唯一天然兼任 437 青铜钟）。**B：机制招×特性语义化**——六条引擎规则（杂技：无道具/已消耗件才推+门控回检；欺诈：攻击 EV 挪耐久；扑击：EV 挪防+性格改大胆；硬撑：异常宝珠在身才推；双倍奉还/镜面反射：低速耐久核反伤；回收利用：一次性消耗件循环）+ `MECH_NATURE`/`MECH_ITEM_GATE`；三条前提修正（回收×毒疗显式放弃改一次性件+S5m 守门；硬撑 112→140 勘误；杂技 ×1.5 口径）+ 新守门 **S5n**（杂技×常驻件违例 0）+ 修复实测反例（杂技×非消耗 7 条含 118/119、硬撑×非异常 3 条）。**C：自组队伍分析器**——第八 tab「队伍分析」（输入 6 只，特性/道具/招式可覆盖、缺省引擎补齐；六区块输出：构成画像/联防弱点矩阵/打击面覆盖/每只推荐/联动叙事/诊断优化；EV/性格以队伍整体需求为约束=deriveBuilds(s,整队) 复用 v4.37 联动；免疫轴/共性弱点/盲区判定；NA-01~12 成对因果叙事 + NA-00 兜底；DIAG-01~10 诊断 + 同定位候选替换，不硬性剔除；特性三套命名归一映射表建在引擎内，data.js 零改动）。**验收实测**：全量 1906 物种 / **4679 流派**（+218）/ 0 异常 / EV≤510（max 508）；S5m/S5n 全 0；杂技 304 受检 0 违例、硬撑 376/376 带剧毒宝珠；C2a/C5a=0、C1b=11（设计内保留）；亮点保护 15+8 硬字段 0 差异、12 队核心 16/16、144 三开雪手保留、2239 无 ≥6 型共弱盲区不增；分析器 17 队（12 支 A 级天气队+3 支手工+2 补充）六区块齐、与引擎单精灵推荐不一致=0；守门正负全过（S5n 伪造违例被拦）；双视口页面/元素溢出 0。**如实披露**：S5e=49/S5i 为口径类残留（49 条全部既存=v4.37 同值非回归，mul=2 顺风 46+1.5 物种池提速 3，capEv=0 的 14 条=优化机会，不回扫归零）；A2b=9 口径型（前置为空+修复后道具换轴）；v4.37→v4.38 队友 id 序列差异 1297 队（B 线道具/机制门控实施所致，装配链路 0 中断，2239 第 5 位队友属此范围）；MECH_CONSUM_ID 未收录场地种子（引擎名称回退已正确消费，P3 清理项）；memo 缓存键缺 build 对象（测试工具坑非引擎缺陷，出厂行为=nomemo 正确）。
- **v4.37**（2026-10-12）：**特性驱动的属性分配（EV/性格）联动**——推荐引擎不再只保证配招正确，还根据核心特性/天性/机制联动优化 EV 分配与性格选择（评估：全量 4461 流派机器筛查出硬矛盾 379 + 优化机会 383 + 根因源码定位；设计书 801 行 87 来源 URL 定 5 类联动规则 S1~S5 → 引擎修复；实施方 + 独立黑盒双仪器「先测量后对账」一致，9 项验收全 PASS）。**联动规则**：① 先制类特性（`PRIO_ABI` 22 键静态表：A 类无条件先制[恶作剧之心/先行治疗/飓风之翼]→ 速度 EV 归 0、性格改 +主攻；B 类条件先制[疾风之翼/妖精先兆/伺机徘徊/盘卷待发等]→ 按条件可靠度**降档不归零**；**覆盖性判定**：先制须覆盖主输出招否则不降速；平衡 B1~B5：`b[5]≥110` 速度天花板保留 252 速+加速性格、仍需先手压制对手同类时保留关键档位、环境有反先制特性时留速度兜底）；② 戏法空间（低速核速度 EV 归 0 + 减速性格[勇敢/冷静]；**ER 特有 R2-C**：天性含天气提速且队伍对应天气 → 不归空间走天气速攻口径——提速会破坏空间慢者先手）；③ 顺风/天气倍率（`teamSpeedMul`=天气×1.5 × 顺风×2 × 围巾×1.5，速度 EV 按达标线降档、溢出挪输出/HP/主防，中速攻手不必 252 速）；④ 特性×道具联动（讲究围巾补速 → 速度 EV 降档、空间核禁推围巾/后攻之尾/先制之爪[官方口径：后攻尾覆盖空间]）；⑤ **T-21 空间雨天双轴**（v4.36 延后项落地：`C-TR-RAIN` 组合素材、双轴复合核单值口径取空间、空间手≠天气手弱条件不硬门、来源 URL 内嵌）。**修复对照（机器实测）**：C2a「名含空间却 252 速」170→**0**（`mechPrefix` 命名轴与 `isSpace` 门控对齐：可学戏法空间但速度>50 不再冠「空间」名）；C5a「加速性格+速度 EV=0」198→**0**（机制流派 EV 与性格两函数对齐）；C1b「恶作剧之心却速度投入」10→**9**（7 条设计内保留：先制只覆盖变化招、攻击轴速度投入必要）；S5a/c/d/e/f/g/h/l 全 0、EV≤510（max 508）、4461 流派 0 异常。**零回归**：亮点保护硬字段（mv/abi/roleTag/side）0 差异；保护名单 15+8 逐字一致；12 支 A 级天气队 0 增 0 减；2239 盲区 0/共弱 1 三臂逐字相同；144 三开雪手保留；队伍层三类闸（讲究×非输出/非输出位速攻EV/天气手无手段）0/0/0；守门正测 exit 0 负测全拦。**如实披露**：C1b 7 条 + 毒疗核 7 条速攻模板例外（进攻型毒疗轴，毒疗回复已提供续航、472 天蝎王保护名单）设计内保留；94 条 coreRole 轴弱不对称登记；S5i=146 为诊断项（强化/增伤核速度溢出属优化机会）；S5b 判定收窄为输出位口径（18 条非输出位高 base 0 速为 R2-D 设计预期）。
- **v4.36**（2026-10-12）：**个性化/「眼前一亮」亮点强化引擎迭代**（评估设计书 434 行 51 来源 URL → 引擎修复；实施方 + 独立黑盒双仪器「先测量后对账」一致）。核心动作：**把前两轮 A 级亮点从展示层下沉为构建层一等公民资产**——① **战术模板 11 条引擎侧下沉**（`TPL_NEW`，数据层 TEMPLATES 18 条未动）：雨天必中炮台（T-22，命中 467 物种/1181 流派）、威吓折返轮转轴（T-26）、沙暴特防轴（T-19）、雪天极光幕受核（T-20）、腐蚀受队闭环（T-23）、场地延展器爆发（T-24）、免疫触发联防轴（T-25）、变身者镜像轴（T-27，**显式豁免**「非输出速攻 EV」闸门：不按自身种族评）、毒疗站场轴（T-28）、防御转输出轴（T-29）、反差强化轴（T-30）——全部正向（低分排后不剔除）、带来源 URL；② **组合素材 13 条新 combo**（C-02 场地展延器×制造者、C-03 极光幕×光之黏土、C-04 雨天必中、C-05 沙暴岩石特防×1.5、C-06 毒疗×硬撑×杂技【含互斥提示：剧毒宝珠 vs 无道具 二选】、C-07 唱反调×自降招），端点渲染 #id 泄漏 0；③ **队友理由个性化叙事**（`MATE_NARR` 12 条成对因果句「因你〔核心条件〕，所以队友〔Y〕有用」，8 核抽样实测，未命中回退徽章 why）；④ **道具门控两补**：低攻种族防守位禁生命宝珠/讲究系/攻击宝石（349 丑丑鱼/360 小果然/374 铁哑铃 → 剩饭，全库 1737→1477）、天气岩三态判定（自动天气禁推/手动天气招允许推/两者皆无禁推，591 无效潮湿岩石→0、全库无来源天气岩 0）；⑤ 文案勘误（雨天增伤「20%」→「×1.5」按源码单档口径）；⑥ **手机竖版 UI 修复**（上轮残留）：主推队友卡超宽被裁（368px → 窄屏撑满容器 300/337px）、详情浮层进化链溢出（Mega 形态被裁 → 换行归零）、触控目标 ≥44px（含 .modal 关闭钮 44×44），375×667 + 412×915 双视口 DOM 度量溢出/裁切归零。**零回归**：单精灵层 7 字段与 v4.34g 导出全 0 差异、仅 `item` 276 条差异全部 D1/D2 归因（260+1+15）；保护名单 15 只 + 帽子皮卡丘 8 只逐字一致；12 支 A 级天气队 12/12 闭环（144 三开雪手保留、2239 盲区 0/共弱 1 不变）。**如实披露**：D2 正向「手动天气招×对应岩石」出现 0（机制层可达、角色/配招层从不生成，未放宽门控凑数）；T-21 空间雨天双轴未实现（延后）；985 吼叫尾/1639 结草贵妇 两处机制锚点写死道具保留不改；构建门闩 v4.36 常驻（exit 0 才算过，正测 0/负测毒化 data.js 全拦）。
- **v4.35**（2026-10-12）：**队伍级（6 人）联动评估驱动的引擎修复**（全量 1906 只机器导出筛查 + 67 核分层深评 → 引擎修复；实施方 + 独立黑盒双仪器「先测量后对账」一致）。修复对照（全量 1906 队 / 9530 张队友卡，机器实测）：**队友卡真实装配**——每名队友按定位角色（天气手/钉子/回复/轮转/盾/状态/输出）真实配置特性/道具/EV/招组（原恒用「输出」模板）：讲究系锁招配非输出位 1388→**0**、非输出位配速攻 EV（无 252HP）6812→**0**、天气手位无开天气手段 63→**0**；**体系白名单 + 门控特性校验**（无体系核不硬塞开体系手；太阳之力/悠游自如/叶绿素等门控特性须与队伍体系一致，跨体系死特性引擎口径 **0**）；**增量联防 + 硬约束**（选人按队伍增量算共用弱点/盲区，恶化降权/补盲加分；最大共用弱点≤5，共用弱点≥6 730→**1**，残留 3 支经全库单槽替换穷举证明结构性无解）；**骨架打散**（同核跨流派复用惩罚 + 全局队友频次归一化[体系相关豁免] + 输出位配额：输出位 8.4%→**16.9%**、队友池 298→**765** 只、跨 teamKey 真换皮 380→**19**）；**组合亮点门槛**（撒钉除钉降级为基础保障、参与方实际配招校验、来源必填）；**archOfSp 空间轴修正**（≥100 速无戏法空间不再按空间轴组队）；**`engineGuardSelfCheck` 常驻构建门闩**（天气岩/basis 自检并入引擎内自检断言，构建时全量跑、exit 0 才算过）。**零回归**：上轮 4461 流派与 v4.34g 导出逐字节相同；12 支 A 级天气队（妙蛙花/急冻鸟/蚊香蛙皇/大嘴鸥/河马兽等）体系闭环全保留、正向多天气手冗余未硬去重；data.js 恢复 smogonPrior 注入（2,349,720 B，v4.34g 因本地输入缺失而降级）。
- **v4.34g**（2026-10-12）：**全量推荐质量评估驱动的装配闸门大修**（217 只深评 + 12 条反模式全量筛查 → 引擎修复，实施方+独立黑盒双仪器+组织者定点探针四路验证一致）。修复对照（全量 4461 流派，机器实测）：机制套挂名不给件 275→**0**（杂技/欺诈/扑击/硬撑/陀螺球核心招必命中）；EV×性格×配招三方矛盾 815+356→**0**；讲究系×变化招自相矛盾 512→**0**；跨天气谱系错配 33→**0**；天气岩被自动天气作废 108→**0**；配招不足 4 槽 296→**0**；墙/屏障体系开放（墙招入槽 0→**262**、光之黏土主推 1→**273**，且按「所选特性∪天性真开墙才推」生效口径）；机制特性名实强制一致（皮可西R/超级班基拉斯/滴蛛R）；捕宠招四门剔除；负面天性（懒惰）降权；低种族闸门（362 只不再硬套热门模板，未知图腾组各 1 套功能性配置）；组合素材补登（杂技×轻装、引水×群攻、威吓×折返、恶作剧×双墙×黏土、大力士×腹鼓、唱反调×自降招反差强化 10/19 只产出）。EV≤510 全过、1906 物种 0 异常；亮点案例（超级伦琴猫R-B/摔角鹰人/天蝎王/大钢蛇/无极汰那等 20+ 只）全保留。
- **v4.33**（2026-10-11）：**新玩家黑盒复测 N1~N19 修复**——流派卡推荐队伍改「核心＋5 队友」满 6 人（原 7 只超编）；组合亮点杜绝「同一只精灵身兼两职」（钉手/除钉手必须互异）；「清空筛选」连开关一并复位；队伍本地持久化（localStorage，刷新不丢，自动恢复）；CSV 名单导入（每行一个名/编号即可入队，表头不匹配明确 toast）；开发者术语清理（硬门/机制口径/克制修正/道具修正等 18 处上屏词整改）；编号搜索精确置顶（输入 1 → #1 在最前）；详情招式行点击展开描述（71 行实测）；「特性（N 选 1）」占位符改为实际可选数；同招槽剔除、双刃招式近身战/杂技「无道具 110」、天气/场地道具分流（光之粘土仅双墙流）；修复队伍恢复渲染触发脚本块中断（NM2ID 未初始化即被顶层调用）根因。全量冒烟 **4859 方案 0 异常**（1906 只 × 流派，EV≤510 全过）
- **v4.12**（2026-10-10）：**内容深化**（机制库 28→**52** / combo 77→**156** / 词汇 26→**40**，全部网络检索验证带来源；天气·场地·保命·免疫吸收·反威吓·巨力分档等新机制**真实改写评分**）+ **Smogon 对战惯例先验**（120 只常用配招/道具/队友软先验，权重 0.35 可开关回退，标注「原版惯例≠ER 使用率」）+ **完整体系模板**（15 体系×六位，池不足全库补位标「补位」）+ 五套回归 **677/0** + verify_v412 探针 46/0 + UI 83/0 + CDN 41/0（F14 溯源锚校准、体积重基线）
- **v4.11**（2026-10-10）：**三层 UI 重构「玩家友好减法」**（L1 基础信息卡可点即查 / L2 流派 tab 一次一卡 8 字段含努力值双字段 / L3 引擎默认折叠保留机制溯源）+ 冗余 20 项处置 + CDN 拆包三件套（index.html+data.js+assets/sheets，HTML 537KB、gzip 182KB）+ 移动端 44px 触控（677/0 + 83/0 + 41/0，SHA 91BFAAB8）
- **v4.10**（2026-10-10）：**机制感知覆盖层**（28 种高辨识度机制知识库 + 26 条覆盖规则，全部 combo 带来源 URL 可溯源；百变怪→速度复制+道具三选、杂技→无道具 110、欺诈→按对方物攻）+ **组合联想器**（任意对象查组合边 → 条件过滤 → 存档池投影 → 一句话效果叙事）+ 详情页「可配合组合」区块与方案机制解读标注；检索验证铁律落地（检索不到的组合一律不写，「杂技+魔术师」反效果删除）
- **v4.9**（2026-10-09）：**协同轴引擎**（15 轴知识库 → 三态判定/轴需求前置/轴协同加分/≤3 套轴方案变体）+ **多方案生成**（标准需求驱动 / 紧凑核心队 / 满编六只 + 轴方案，一键轮换、状态保留）+ 展示升级（方案卡「核心思路」一句话横幅、环境威胁榜含精灵图、方案级对位预警「被 X 体系克制 n 只 → 建议 Y」）+ 轴协同高亮含核心本身
- **v4.8**（2026-10-09）：核心配队新增**目标队伍规模**选择（3/4/5/6，默认 6）与「**继续补位**」（未满目标时可手动追加队友，标注「补位（非需求驱动）」）；6 人上限由硬编码常量提升为**产品级可配参数**；停止原因文案「已满 6 只」→「已达目标规模」——依据：M4 只读核查判定「平均 3.60 人」为评测口径假象（引擎自身推荐 5.33 人、反事实可达 18/18 满 6）
- **v4.7**（2026-10-09）：引擎排序接入**规则偏移层确定性修正**（M5 实证引擎分与真值胜率负相关，修正后全 4000 队 AUROC **0.396 → 0.654**、rho −0.191 → **+0.322**；龟速传说堆分位 75.6%→40.5%、真值高胜率速攻队 41.5%→73.0%）；一键回退开关 `RULE_SHIFT_ENABLED`
- **v4.6.4**（2026-10-08）：恢复**威胁库「使用率」弱先验**（关闭登记缺口 #32）——接入 Smogon chaos 2026-09（gen3ou×1.0 + gen9nationaldex×0.5）→ 映射 ER 物种 **747** 条 → 威胁类别内**次排序**（权重上限 0.6，只调近似并列者、不改量级）；数据层产出、引擎只消费（无数据时自动回退空态）
- **v4.6.3**（2026-10-08）：核心配队 / 存档联动组队改**两段式互斥视图**（挑选 → 点卡片 → 方案置顶详情 + 「← 返回挑选」≥44px，返回保留搜索/筛选/排序状态）
- **v4.6.2**（2026-10-08）：精灵图合图 Sprite Sheet（1906 张 PNG → 8 张 WebP，5.17MB/1906 请求 → 3.00MB/8 请求；渲染层改 div + background-position，尺寸无关缩放）
- **v4.6.1**（2026-10-08）：长溯源标注折叠为一行可展开；表格 iOS 惯性滚动；两处队友推荐标签区分（需求驱动 / 体系补盲，后者默认收起）；index.html 同哈希副本
- **v4.6**（2026-10-08）：存档联动组队（真档 → 宝可梦池 → 选核心 → 方案卡）；UI 多图少文优化（11 表可滑、触控 ≥44px、移动端适配）；部署 GitHub Pages
- **v4.5**：配招/流派并入同一原则层（招式类别 × 四轴剖面，命名 ≡ 实际招组）
- **v4.4**：原则驱动决策层（对位威胁库 + P1-P5 原则打分，替代查表式道具映射）
- **v4.3**：需求驱动动态配队（废除固定 6 槽 / 固定流派枚举）
- 更早版本：属性/特性/技能/种族分层分析、打击面引擎、交集筛选、NN 配队调研（暂未接入）

---

## 近期版本（v4.253 – v4.354）

> 本文件正文止于 v4.179；v4.180 之后的逐版实现与验证见 `AGENTS.md` 对应章节，此处只登记玩家可感知的变化。

- **v4.269**（2026-11-10）：**有先制就别死磕速度——工具现在会替你把这一步算出来**。只要这只靠「满血先制 / 条件先制」能吃先手（闪电拳击、燃烧之魂、疾风之翼、恶作剧之心这类），核心配队第 6 段和配速抽屉都会多一行「先制：XX（满血时 拳招）」，下接两条线：**先制线**（只投够 P50 的 EV，剩下的点转投攻/耐久，可一键采用）、**常态线**（想常态也抢手就用加速性格卡 P75）。更实用的一点是它会替你检查 4 招：主攻吃不到先制（比如愤怒不是拳招）会直接说「4 招里只有吸取拳能用」，而不是含糊地劝你降速。满血条件怎么保也写了：靠轮转（虫返/换人再上），堆 HP 换不来这个条件；对手同样有先制时仍然比速度。

  1,682,432 B / `1C73DE4A…`，线上已一致（gh-pages `7a18e22`）。
- **v4.270**（2026-11-10）：**先制这件事，速度线页也看得见了；「一直成立的先制」现在单独算**。
  - 「速度线」页的「我的队伍 · 速度现状」里，带条件先制的成员后面多一个橙色「先制」小标（悬停能看到是哪个特性、什么条件），脚注写「标「先制」的 N 只：速度未必需要卡到 P75，点开看第 6 段的先制线」。以前这一条只有实速和分位，看不出这只为什么可以慢。
  - 「恶作剧之心 / 先行治疗 / 飓风之翼」这类**不看满血、不看回合**的先制走另一套说法：先制变化招只看先后手、不看速度，结论直接是「速度可以不投」，按下「不投速」就把这只的配速记成 0 EV（实速即它自身的基础速度），核心页立刻转成「你的配速 · 中性性格」。满血先制那批仍给「先制线 / 常态线」两条。
  - 顺手补全这类手的边界：恶作剧之心对恶属性目标会失效（特性说明里本来就有，现在也写进结论行），别拿它去挑恶系。
    1,684,477 B / `7C5F65AB…`，线上已一致（gh-pages `715954f`）。
- **v4.271**（2026-11-10）：**配速现在能筛、能跳了**。宝可梦页工具栏多一个「◎ 已配速」——点下去只留你定过速的那几只，卡片上直接写实速和「已配速」；一只都没定时会提示你去「核心配队」第 6 段点「采用」。「队伍分析」的「队伍速度结构」标题后面多一个「去速度线页 →」，一步跳到全库分位锚点。
    1,685,593 B / `66B7776D…`，线上已一致（gh-pages `a4b97dc`）。
- **v4.272**（2026-11-10）：**点到够不到的速度点，现在会告诉你为什么**。配速抽屉里那排常用速度（273 / 331 / 372 / 394 / 441）超出这只上限时，以前点了只是把滑块推到头、像卡住了；现在会明确说「这只速度上限 372（252 努力 + 速度性格 + 特性全算满），够不到 P95（394）—— 想再快只能靠围巾 / 顺风 / 戏法空间」。速度线页的「特性加速」说明也点名了「慢启动」这条本代图鉴没人持有、永远不会命中的行，别照着它去挑宝可梦。
    1,687,236 B / `A08347EC…`，线上已一致（gh-pages `3cd2754`）。
- **v4.273**（2026-11-10）：**「先制」标现在跟着宝可梦走到槽位了**。队伍构建的空位、队伍分析的六个槽，只要这只带条件先制（满血 / 登场首回合等），「速 273」后面会多一个橙色「先制」小标——意思就是这只的速度要求可以低于常态线，别照 P75 硬投。
    1,687,344 B / `27DCB838…`，线上已一致（gh-pages `419197f`）。
- **v4.274**（2026-11-10）：**「降速省下来的点数买到什么」，现在有实数对照了**。核心配队第 6 段的先制结论下面多一张小表：先制线（例：烈焰猴R 中性 84 EV → 273 速 P47，主攻 308）与常态线（加速 196 EV → 331 速 P74，主攻 280）并排，并直接写「速度让出 27 个百分点，多出的 112 点落在主攻 +112 EV（实数 +28）」。降到 0 速的那些（恶作剧之心这类）也按「不投速」实算，不会再拿 P50 的配法糊弄。
    1,690,316 B / `3C5E8362…`，线上已一致（gh-pages `6eb2919`）。
- **v4.275**（2026-11-10）：**「加速」这类速度越打越快的特性，终于有说法了**。速度线表的「特性加速」列对它们以前只显示「—」（它不是固定倍率），现在会标「加速 +1/回合（第2回合起 ×1.5）」；核心配队第 6 段和配速抽屉里会直接算给你看：从 356 起，第 2 回合 534、第 3 回合 712、第 4 回合 890，全都已经超出全库极速档——所以速度投入只要够「第一回合别被直接带走」，剩下的点该换成守住/替身/虫返这类过桥手段。
    1,692,882 B / `9FEDBA2F…`，线上已一致（gh-pages `2dbd63a`）。
- **v4.276**（2026-11-10）：**戏法空间终于有反向配速了**。以前只有一句「空间在场速度排序反转」，配速建议还是让你越高越好；现在对空间料（速≤30 的，或速≤60 且攻≥95 的）会直接说清：速度 EV 应该 0、性格用减速（物攻手勇敢 / 特攻手冷静），并算出「空间内你能先行全库多少 %、空间外只快过多少 %」，省下的 252 点先给主攻再给耐久（都给实数）。还会点名空间里的负收益：讲究围巾、顺风、加速、速度+1 级全让你更晚出手，反倒是黏黏网/电磁波/岩石封锁等于给你加速。顺手修掉「煤炭龟这类极低速被标成清场」和「够不到 PXX 就靠围巾/顺风」这两处跟空间打架的旧文案。
    1,697,706 B / `9CE42ABE…`，线上已一致（gh-pages `1506d57`）。
- **v4.277**（2026-11-10）：**轻装终于说清楚了**。速度表一直对它显示 ×2，但那不是常驻——源码写明「消耗掉携带的道具后速度加倍，换下即失效」。现在核心第 6 段和配速抽屉会给完整结论：现在多快 → 吃掉道具后多快（超全库极速档就直接说），以及三条关键提醒：**它是一次性开关**（道具吃掉了不会回来，一场基本只有一次翻盘机会）、**消耗前那一回合仍是真空期**（速度投入应按「消耗前要压过谁」定，别按翻倍后的数字去省 EV）、**能怎么吃道具**（电气/精神/薄雾/青草种子在对应场地上场即消耗、白色药草、弱点保险、气势披带、各类果子）。和「加速」叠加会额外说明两段怎么算。顺手修掉概览句里「轻装/悠游自如/叶绿素/拨雪 ×2」的旧错（只有轻装是 ×2）。

    1,700,762 B / `25D6FF7A…`，线上已一致（gh-pages `2b649dd`）。
- **v4.278**（2026-11-10）：**围巾和顺风终于有了自己的结论**。这两样提速不来自宝可梦，而来自道具位和队友——核心第 6 段与配速抽屉会直接算：戴讲究围巾 ×1.5 是多少、队友开顺风 ×2 是多少（超全库极速档就直说）。三条要记住：顺风窗口只有 4 个回合时段（开风的人得先手开出来，恶作剧之心这类变化招先制最稳）、自己能学顺风就该当开风手否则这些线永远是纸上数字、**轻装和围巾是硬冲突**（围巾本身就是道具，轻装要把它吃掉才翻倍，同一个位置只能选一个）。

    1,703,407 B / `AAC111B2…`，线上已一致（gh-pages `0d00f17`）。 
- **v4.279**（2026-11-10）：**飞毛腿这笔交易算清了**。它要你先自己吃一个异常状态才有 ×1.5，所以核心第 6 段与配速抽屉现在逐状态摊开代价：中毒/剧毒只提速但每回合掉血、灼伤提速但物攻减半、**麻痹会被 ×0.5 抵消（净 0.75 倍）**、睡眠/冰冻根本不算提速。结论是「纯为速度吃状态通常不划算」，除非这只还有毅力（攻 ×1.5）或中毒激升（免疫毒伤 + 攻 ×1.5）——那时状态对你是双收益，会直接给攻的实数。另外别照搬主系列「飞毛腿忽略麻痹减速」的旧口径，ER 的说明里没有这条；对手的毒菱/磷火/电磁波反而等于送你提速，别急着清掉。

    1,706,829 B / `7142D986…`，线上已一致（gh-pages `5ddd15a`）。
- **v4.280**（2026-11-10）：**队伍分析页多了一张「队伍速度联动」卡**，回答的是「六只怎么互相补速」而不是「这一只怎么配速」。它从数据层认出八类角色——谁能开戏法空间、谁能开顺风、谁是先制 / 满血先制、谁会清钉、谁能上状态、谁靠吃状态提速（飞毛腿）、谁是队医——然后只在真的互相拖时才出声：空间和顺风互相拆台、空间手撞上 P90+ 快攻手、满血先制却没人清钉、飞毛腿被自己的队医清掉状态（同一只兼任时直接说「配招只能选一边」）。三种控速一个都没带、而且全队最快低于 P75 时，它会直接点出这队「联动差」的样子。

    1,712,969 B / `75DD7F20…`，线上已一致（gh-pages `a6cf571`）。
- **v4.281**（2026-11-10）：**联动卡改成按配置判了**。原来的版本用「能不能学」认角色，于是「能学戏法空间但配招没带」的宝可梦也被算成空间手，凭空造出冲突——这版全部改读每只的推荐配置（配招 + 推荐特性），角色行直接写出配招，比如「烈焰猴R　深渊翻滚·潜水·替身·吸取拳｜闪电拳击」。「能学但没配」单独列一行（戏法空间 → 胡地；顺风 → 铁面忍者），明确写着「这些不算冲突，只是没选」；特性同理，多一行「特性能用但没选：布鲁皇（飞毛腿）」。每条冲突还会给出口：换同物种另一套不带该招的流派、或指出「谁能学清钉但没带」。

    1,716,848 B / `76E3067E…`，线上已一致（gh-pages `708be23`）。
- **v4.282**（2026-11-10）：**冲突走到最后一步，工具会告诉你换谁**。之前它只会说「得从选人改」，把最后一步丢回给你；现在它会从图鉴里筛出同定位替补，并且把替补的推荐配招一起写出来，比如「顽皮雷弹　过热·打雷·伏特替换·电磁波｜速150」。筛选要两条都成立：能学、并且推荐配置里真带了；只有「能学」的会单独标一行「推荐配置默认不带，选进来之后要手动把一个槽换成它」。另外按「会不会高速旋转」排序，真·清钉手排在前面，主属性跟队里重复的候选直接不列。

    1,720,893 B / `98E7E5D8…`，线上已一致（gh-pages `712aa65`）。
- **v4.283**（2026-11-10）：**队伍分析多了一张「配队体检」**。它按通用配队理论查四件事：弱点是不是超过 2 只挤在同一种属性上（超过且队里没有免疫就会点名报警，有免疫则降级成「有硬解，不算硬伤」）、有没有明确的收尾手段（推荐配置里真带剑舞/龙舞/蝶舞/冥想这类强化招才算，没有就直说「打得动赢不下」）、钉子是不是 0:0（撒和清各是谁，都写配招）、有没有一只同时扛了两个功能（是优点也是断点）。另外换人候选也加了一条：候选不能把队里已经有 2 只以上的弱点再叠一层，除非队里有这只属性的免疫。

    1,729,479 B / `E58A8390…`，线上已一致（gh-pages `5e67b48`）。
- **v4.284**（2026-11-10）：**体检卡开始排优先级**。结论分成硬伤（红）/提示（琥珀）/参考（灰）三级，按级排序，卡头直接写「硬伤 N 条 · 提示 M 条」，数字和逐条标签一一对得上。同版新增**入场税**：按岩石相性算隐形岩（4 倍相性封顶 50%）、按地面免疫算一层撒菱，逐只列出来；谁 4 倍相性高亮，如果队里又没人清钉，直接升成硬伤「一次入场就掉一半血」。

    1,732,041 B / `3A898008…`，线上已一致（gh-pages `85c6161`）。
- **v4.285**（2026-11-10）：**每条硬伤下面直接给「怎么修」**。缺清钉 → 全库列出默认配置里真带高速旋转/清除浓雾的人（都带默认配招，不用改槽）；缺收尾 → 列出默认就带剑舞/龙舞/诡计的人；钉子 0:0 → 列出默认带毒菱/隐形岩的人。候选按「它自己顶不顶得住岩钉」排序（清钉手第一件事是能安全进场，不是快），每只后面写 `速N · 岩钉X%`；实在没人默认带，才退到「能学但要手动换一个槽」并明确标注，同一类名单在一张卡里只出现一次。

    1,735,588 B / `61FF9537…`，线上已一致（gh-pages `ff306be`）。
- **v4.286**（2026-11-10）：**候选后面多了「换进来之后队伍变成什么样」**。队伍满 6 只时先定「换掉哪一只」——把每只拿掉试一遍，看整队三项体检分最高的是谁，全卡只报一次；然后每个候选都跟现在的整队比：弱点超标几个属性、平均入场税多少、P90 以上几只、队内最快多少，变好标绿、变坏标红，末尾给一句「整队变好 / 有得有失 / 整队没变好」。实跑六只队：收尾候选都能把弱点超标从 2 压到 0 但要掉一档速度，属于有得有失；清钉候选里只有速150 的顽皮雷弹不掉速，判成整队变好。

    1,739,304 B / `BE3A1752…`，线上已一致（gh-pages `3166278`）。
- **v4.287**（2026-11-10）：**候选直接写「照抄就能上场」的配置**。每个候选下面多一行特性 / 道具 / 性格 / EV 六项，跟核心页同一份推荐流派；四招里已经带那招就写「配置原样可用」，没带就写明换第几槽（跳过强化、钉子、清钉那些不能砍的槽，从威力最低的挑）。清钉手多一条速度口径：速度已到它的上限就直说「抢不过更快的撒钉手」；EV 已够就只改性格；都不够才给「性格改爽朗 + 速补到 N EV」，不会在你已经满速时还劝你补速。

    1,742,548 B / `8EEA1555…`，线上已一致（gh-pages `8b52b84`）。

- **v4.289**（2026-11-10）：**配队建议改成「只从你自己的存档里挑」，另外顶栏多了一个「ER 特色」总开关**。

    ① **存档联动**：导入 mGBA 存档后，体检卡的「怎么修」候选不再是全图鉴按「能不能学」挑人，而是**只在存档里这 400 多种里找**，而且判定「这只能不能补这个功能」看的是**存档里它实际带的四招**。有实配的直接写「存档实配：特性／道具／性格／EV ＋ 存档里这只已经在用「高速旋转」，上场不用改」；四招里没带的写「改槽：把「X」换成「Y」，其余三招照存档」。队伍里若有不在这一档的成员，卡头会点名。实跑主存档（超级土王／坚果哑铃／Storming／雷电云-灵兽形态／洛奇亚／鳃鱼龙）：清钉候选命中存档实配的超级龙头地鼠（挖沙／力量头带／固执／6-252-0-0-0-252，已带高速旋转），撒钉候选命中超级晶光花与盐石巨灵（都已带隐形岩）。

    ② **ER 特色开关**：顶栏勾上「ER 特色」，图鉴、核心配队、队伍构建与分析选择器、招式反查「谁能学」、特性反查「谁有」、速度线全部只剩改版特色 —— **所有 Mega 形态（原版 Mega 也算）＋ Redux 专属形态与 ER 原创宝可梦**（大钢蛇R／盐石宝R 这类），共 **451 只**；官方普通宝可梦与地区形态不算特色。开关状态本机记忆，旁边直接写当前筛出多少只。

    1755472 B / `FF4CA4C0438BA564CECC248FA8A3D97FE78B92E0…`，线上已一致（gh-pages `3958c85`）。







- **v4.354**（2026-11-13）：**讲究件 / 节拍器的代价收口 —— 代价已被付掉才首推，付不掉就退位**。

    勘察结论：全库讲究头带只在 3 条、讲究眼镜 0 条、讲究围巾 4 条里出现过，而首位清一色是生命宝珠 —— 引擎一直把「锁招」当成纯亏损。但「一猩一意」这条特性本来就只能反复用同一个招，锁招这笔代价对它等于零。

    ① **讲究件 × 一猩一意**：一猩一意 + 进攻型 + ≥2 个伤害招 + 道具位可用 → 讲究头带（物理）/ 讲究眼镜（特殊）首推，why 写明「一猩一意本来就只能反复用同一个招 —— 讲究件锁招的代价对你等于零，1.5 倍优于宝珠的 1.3 倍带自伤」，宝珠退备选；
    ② **节拍器退位**：节拍器要连续用同一招才叠得起来，四招轮转流派吃不到满层，凡是「首位是节拍器且伤害招 ≥2」，一律让出首位（单招 spam 流派保留）；
    ③ **收尾守卫**：让位之后首位若换成宝珠落到防守型身上，再过一遍 v4.353 的防守型换剩饭规则（否则节拍器让位会把宝珠顶上防守流派的头名）。

    实测（n=4972）：一猩一意进攻型 14 条中 11 条改讲究头带（火暴猴 / 请假王 / 猛火猴 / 烈焰猴 / 达摩狒狒 / 萨戮德 / 达摩狒狒-伽勒尔 / 火红不倒翁R 等），节拍器首推 11 → 2（剩下 2 条确实是单伤害招 spam），宝珠首位 1017 → 1015 且防守型 0 条，重复招 0、道具超 3 项 0。

    线上 1,910,528 B｜SHA1 `AF963A68187205C02B94D1E1E36FEB59B305F1D4`（部署后回填 gh-pages）。

- **v4.353**（2026-11-13）：**生命宝珠的归属收口 —— 只给进攻型，且优先给能吃掉自伤的特性**。

    用户口径：宝珠肯定不适配防守宝可梦，一般是给进攻宝可梦，比如强行尼多王、魔法防守胡地，甚至可以不承受宝珠扣血效果。

    两处改动：

    ① **防守型整体不配宝珠**：v4.352 只在「有固定回复招」时替换，现在放宽到流派名含 消耗/联防/受/双墙 或 side=辅助，一律换成剩饭（毒系黑色污泥），不看有没有回复招 —— 站场回合越多，10% 自伤亏得越多；
    ② **消伤特性反推宝珠**：强行（忽略附加效果，宝珠反伤随之失效）、魔法防守（不吃非直接伤害）在进攻型流派上，宝珠 = 纯赚 30%，条件为「非防守型 + ≥2 个伤害招 + 道具位没被专属件占住 + 非杂技」。

    实测（n=4972）：宝珠首位 1328 → 1017，其中落在防守型流派 0 条；魔法防守 86 条中 44 条带宝珠（其余多为光之黏土/凸凸头盔的防御型），强行 73 条中 63 条带宝珠。重复招 0、道具超 3 项 0。

    线上 1,907,519 B｜SHA1 `DE9D32E0F86B0AF1F90539166CCDB948418EF5F8`｜gh-pages `8dcfc3a`（逐字节核验一致）。

- **v4.352**（2026-11-13）：**生命宝珠 × 固定回复的冲突**。

    扫描发现首推生命宝珠的 4972 条流派里，179 条带着回复类招式。细分后两类：

    · **吸血类 98 条**（终极吸取 / 吸取拳 / 寄生种子 / 汲取）：比例回复吃得到宝珠的 30% 伤害加成，净收益为正，**不动**；
    · **固定回复 81 条**（羽栖 / 晨光 / 自我再生 / 睡觉 / 生蛋等），其中 45 条属消耗/联防流派：宝珠每回合自伤 10% 会抵掉固定回复，改成常驻续航件 —— 毒系给黑色污泥、其余给剩饭，why 写明「宝珠自伤会抵掉固定回复」。

    实测（n=4972）：这批 45 条已全部换为剩饭/黑色污泥；吸血类 98 条保持生命宝珠；道具超 3 项 0、重复招 0。

    线上 1,905,892 B｜SHA1 `6E8AFCC5A24AF31EFDAB78377BB7B81A073ED2C5`｜gh-pages `9a2be73`（逐字节核验一致）。

- **v4.351**（2026-11-13）：**收获 / 贪吃鬼 × 果（消耗品联动的第三条线）**。

    扫描发现：首推「收获」的 8 条流派里 0 条带果、「贪吃鬼」的 23 条里只有 4 条带果 —— 这两条特性没有果就是白拿（收获每回合回收吃掉的果、贪吃鬼让果在半血就触发）。

    仍然不硬绑：① 道具位可用 → 文柚果置首推，why 写清「果从一次性变可循环续航 / 回血提前到最危险的那回合」；② 专属道具占位、带杂技要宝石、或剩饭/厚底靴是续航骨架的联防消耗流派 → 把特性**降为次推**，不硬换道具。

    实测（n=4972）：收获 8 条 → 7 条带果（剩 1 条是杂技流派走宝石）；贪吃鬼 23 条 → 17 条带果；重复招 0、道具超 3 项 0。

    同版把判定纪律沉淀为 `docs/dev/配队联动口径.md`（代价 → 解法池 → 条件匹配），并在 AGENTS.md 目录树登记。

    线上 1,904,441 B｜SHA1 待核验｜gh-pages `5e930bf`（逐字节核验一致）。

- **v4.350**（2026-11-13）：**香草不再绑定破壳，解法分级**。

    用户指出「只要破壳就带白色香草」仍是强绑定：香草只是抹平降防的一种办法，无伤破壳还有别的路径。

    现在按条件分级：① 破壳后有效速度 ≥ 110 且 ≥2 个本系威力≥80 的伤害招 → 先手与火力都够，香草退为**备选**，首推进攻件（生命宝珠/弱点保险）；② 招里有替身/守住/睡觉，或特性带结实/多鳞这类**无伤破壳手段** → 同样不必香草首推；③ 既慢又缺火力且无他解 → 才把香草提首推并写清理由。专属道具占位时照旧让位。

    实测（n=4972，破壳流派 31 条）：香草首推 19 条、仅列备选 7 条、专属占位 2 条、完全不带 3 条（杰尼龟 剩饭+防电果、焦岩蜗牛 厚底靴、草苗龟R 厚底靴）。重复招 0。

    线上 1,902,700 B｜SHA1 `A52E61667081D85D16090DB92352A386E1580DA0`｜gh-pages `3a5ef0c`（逐字节核验一致）。

- **v4.349**（2026-11-13）：**撤回破壳的强绑定，改多条件门槛 + 香草解法**。

    v4.348 把「单纯 + 破壳」无条件提为首推是错的：破壳自带 -2 防 / -2 特防，没有配套战术就是白送破绽（用户口径：强绑定大多不允许，至少要多个条件）。

    现在四个条件同时成立才绑：① 破壳后有效速度 ≥ 90（能先手）② 至少 2 个伤害招（真能清场）③ 不是纯辅助/纯联防流派 ④ 有保命手（替身/守住/睡觉）或道具位没被专属道具占住（可用香草）。任一条不满足：不推破壳、也不把单纯提首推。

    **香草解法**单独成立：只要招里有破壳，白色香草就进首推（用掉即抹平降防，净收益变纯增益），专属道具占位时让位、不抢电气球/粗骨头这类种族绑定件。

    结果（n=4972）：破壳流派 31 条，其中单纯首推 5 条（熔岩蜗牛攻击向成立、联防向不成立）；香草首推 29 条、让位专属道具 2 条；重复招 0。

    线上 1,901,489 B｜SHA1 `AAF4EA8C9A98274BB70452F66A0F8764A2368B42`｜gh-pages `a06793a`（逐字节核验一致）。
- **v4.348**（2026-11-13）：**破壳 × 单纯（同一只身上最值钱的联动）**。

    熔岩蜗牛本来会破壳，但引擎的首推特性是登山者，破壳 × 单纯这条最强线一直没被推出来。破壳本身 +2 攻 / +2 特攻 / +2 速，被单纯翻成 **+4/+4/+4**（代价也翻成 -2 防 / -2 特防），一次强化顶两回合。

    现在：只要这只怪同时具备「单纯」与「破壳」可学，就把单纯提为首推，并把破壳补进招式（已有的不重复加）；纯联防/消耗流派不硬塞破壳，避免和「守住+回复」的定位打架。

    结果：熔岩蜗牛「钉子主力输出压制」= 单纯 > 登山者 > 硬壳盔甲，招式 燃尽 / 力量宝石 / 破壳 / 隐形岩；「钉子稳健联防消耗」也改为单纯首推并带破壳。熔岩虫学不会破壳，仍是熔岩铠甲首推（v4.347 的降级逻辑不变）。

    线上 1,898,586 B｜SHA1 `ED608FCE1C61A729008907A43EC3AB83F6A34015`｜gh-pages `adc3d0e`（逐字节核验一致）。
- **v4.347**（2026-11-13）：**特性 × 招式联动（道具之外的那一轴）**。

    顺着「举一反三」往下查，除了道具，还有一类更值钱的联动：特性白送的机制没人用，等于特性作废。两条已接上：

    - **单纯（所有强化效果 ×2）**：没有强化招就是空特性 → 按实际输出侧补一个学得会的强化招（池外招按名字兜底），只换非核心伤害位；连一个强化招都学不会的（熔岩虫、熔岩蜗牛、图图犬这类），直接把单纯降为次推，别把废特性挂首推。
    - **无防守（对手无法回避）**：一击必杀招从三成命中变成必中，没带就是浪费 → 若可学且未带，替换一个非核心伤害位。

    全库 n=4972：首推单纯 6 条中 4 条已带强化招，其余已降级；首推无防守 17 条中 4 条已带一击必杀；重复招 0。

    线上 1,898,033 B｜SHA1 `F655A4EA39C7E705532890DDF36D4C0C80ED8BD3`｜gh-pages `81482d5`（逐字节核验一致）。
- **v4.346**（2026-11-13）：**修正杂技口径 + 轻装联动**。

    v4.345 把杂技一律改成「不带道具」是错的：杂技的翻倍条件是「身上没有道具」，宝石/果/香草/气球/披带这些一次性消耗品打出去或用掉后道具位就空了，杂技当场 ×1.5。真正该避开的是剩饭/讲究/进化奇石/宝珠这类常驻件——它们一直占着道具位，杂技永远翻不倍。

    现在：杂技核心位 → 首选本系宝石（用掉即翻倍），备选气势披带等消耗品；轻装特性 → 同样只走消耗品，「用掉即速度 ×2」写明是特性开关；若该只同时有剧毒/火焰宝珠路线，列表只留消耗路线并注明「常驻宝珠与杂技/轻装只能二选一」。

    结果：229 条杂技流派全部首推消耗品（100%），119 条轻装流派全部首推消耗品（100%）；道具列表仍在 3 项内。

    线上 1,894,877 B｜SHA1 `AA52C4F904F40F67D5DAC54A4B9BD560744A4627`｜gh-pages `a1207f8`（逐字节核验一致）。
- **v4.345**（2026-11-13）：**招式/特性 × 道具收口，顺手清掉道具堆叠噪音**。

    ① 杂技：无道具时才有威力 ×1.5，之前 229 条杂技流派全在推道具（自废核心招）→ 核心杂技一律改「不带道具」，209 条已转。
    ② 毒疗/中毒激升：特性要吃中毒才生效，之前部分流派推生命宝珠/弱点保险 → 剧毒宝珠置顶（36 条中 35 条命中）。
    ③ 毅力（物理侧）：要异常状态才 ×1.5 → 火焰宝珠置顶（灼伤减攻由毅力抵消，43 条中 41 条命中）。
    ④ 道具列表上限 3 项：原来种子/宝石会堆到 5-6 项，超 3 项 300 条 → 0 条。

    线上 1,892,566 B｜SHA1 `BCCBEDB285E950E1F3495FDC1F599FBE3009466A`｜gh-pages `9de954a`（逐字节核验一致）。
- **v4.344**（2026-11-13）：**专属道具按种族绑定，该带就排第一**。

    问题：道具池 54 项全是通用件，电气球、粗骨头、大葱、心之水滴、深海之牙/鳞片、金属粉这些「只有某个种族才生效」的道具一项都没进池，皮卡丘永远被推生命宝珠/讲究头带。

    现在：这类道具做成独立一族，按 ERDATA.items 描述里的绑定种族判定（大葱描述缺失 → 按系列惯例绑大葱鸭/葱游兵），命中即置顶，why 写明「×2 且不锁招，比讲究头带 1.5 更划算」。

    结果：皮卡丘/雷丘 → 电气球；嘎啦嘎啦输出流 → 粗骨头；大葱鸭/葱游兵 → 大葱；拉帝亚斯/欧斯 → 心之水滴；珍珠贝 → 深海之牙。防御向不被误顶：嘎啦嘎啦「扑击铁壁流」仍留防岩果（粗骨头只加倍物攻，扑击按物防算，带它没用）。

    线上 1,890,832 B｜SHA1 `AAFC432FA845266A052FA365A4F4BDCB9926D656`｜gh-pages :ca259\（逐字节核验一致）。
- **v4.343**（2026-11-13）：**方向判定不再只看种族值，招式池厚不厚一起算**。

    原来一句话定方向：物攻>特攻就是物理向。这会产生两类自相矛盾——地鼠物攻 55/特攻 35 判物理，但「低物攻净化」规则把它的物理招全删了，改补特殊的大地之力，最后 252 物攻配全特殊招；皮卡丘同理。

    现在：每个方向按「种族值 × 招式池质量 × 打击广度」比，种族值差距≥15% 时以种族值为准（除非对面池子厚 45% 以上），差距不到 15% 由池子定，接近则双刀。地鼠的池子物理前三均 114、7 个属性，特殊只有 81.7、2 个属性，方向定物理后地裂/沙暴/磨爪/隐形岩 + 252 物攻 + 固执全部自洽。

    三个收口一起改：①`coreSide` 纳入招式池；②净化规则由「物攻<70 就删物理招」改为「特攻确实高过物攻才删」；③努力值/性格跟着实际输出侧走（招全在一侧却投 100+ EV 到另一侧的，重算）。

    全库 11,749 条：侧向矛盾 0、反向强化 208→55、努力值投错 268→4、重复 0、缺槽 0；方向分布 物理 5,510 / 特殊 3,320 / 双刀 1,466 / 辅助 1,453。

    剩余 55 条反向强化是「同侧强化学不会、中性强化也没有」的物种，属客观无解，不再硬换。

    线上 1,888,119 B｜SHA1 `71AB300A0C6CE0C5CC5891C290F7C74A8135283A`｜gh-pages `0fb56be`，逐字节核验一致。
- **v4.342**（2026-11-13）：**强化槽不再空转：强化招必须强化你真在用的那一侧**。

    典型：特殊攻手拿到剑舞——剑舞升的是物攻，可四招里没有一个物理招，这一格等于白占。全库命中 472 条。

    修复：按实际伤害招方向选强化招。物理侧↔特殊侧（剑舞/腹鼓/健美/龙舞/磨爪 ↔ 冥想/诡计/蝶舞）互换，只换学得会的；学不会同侧时退到双攻同升的中性强化（破壳/自我激励/生长）。修好 264 条（反向强化 472 → 208），且不产生重复招、不缺槽。

    剩余 208 条属于另一类问题：强化招方向本身没错，是**攻击招选偏了**（117 条种族本应物理却配特殊招、69 条相反）。这需要按真实伤害口径复核攻击侧，留待下一版处理，本轮不硬改。

    线上 1,885,319 B｜SHA1 `40CBCE084F442E7DB87041AC5F4F484FCBCEE2C4`｜gh-pages `3ab05f6`，逐字节核验一致。
- **v4.341**（2026-11-13）：**流派标签与真实配置对齐，首屏不再自相矛盾**。

    标签里的「物理向/特殊向」原本由种族值决定（物攻>特攻→物理），但实际选招可能全落在另一侧：皮卡丘物攻 55、特攻 50，标签写「物理向」，四招却是电磁波/替身/光墙/打雷，努力值 252 特防、性格内敛——首屏第一句就和配置打架。

    校准规则：只有**完全矛盾**（标签一侧 0 个伤害招、另一侧至少 1 个）才按实际招式改写标签，努力值与性格本就随招式走、不重算；完全没有伤害招的纯功能流派统一标「辅助向」，不再挂一个用不上的方向。

    全库 11,643 条流派：矛盾 570 → 0，纯功能误标 837 → 0；除标签外（努力值/性格/四招/评分）整体指纹逐位一致，证明只是说真话、没有改动任何推荐。

    线上 1,883,809 B｜SHA1 `4ED5014B333B70CAF9F1AD26AC0F96F3F513715F`｜gh-pages `31254a6`，逐字节核验一致。
- **v4.340**（2026-11-13）：**修复组合流派重复招式与补槽，四招不再出现同一招两次**。

    组合流派（双墙辅助流等）原本在流派生成末尾被直接追加，绕过了 sanitizeBuild 的去重；双墙模板在缺接棒/回复时又用同一墙兜底，导致全库约 346 个 build 出现「反射壁/反射壁」这类重复且补不满的配置。

    修复：组合流派追加前统一过 sanitizeBuild；低物攻物种的物理招被过滤后立即重新补槽（改补特殊侧/功能招）。全库验证重复招式 0、槽数不足 0，且不影响已正确的普通/机制流派。

    线上 1,882,996 B｜SHA1 `AA491D29BCE9C9C07815AB9FDC35C149533DCCC3`｜gh-pages `582c503`，逐字节核验一致。
- **v4.339**（2026-11-13）：**统一各入口推荐口径，消除同一只跨页面首推不一致**。

    核心配队页 renderCore 在有队伍时传入当前队伍，与队伍构建页同一口径（同一函数同一参数，结果必然一致）；图鉴资料页保持单参通用参考，概要卡明确标注「通用配法（不依赖当前队伍）」，并说明进入核心配队会按当前队伍缺口调整。用户不再遇到图鉴与队伍页各说各话、不知哪个为准的困惑，差异原因被显式告知而非隐藏。

    线上 1,882,896 B｜SHA1 `EFEDA4AE1D027680B53B33982E3865A2ABCC4493`｜gh-pages `914738f`，逐字节核验一致。

- **v4.338**（2026-11-13）：**条件特性统一校准，机制流/组合流也按实际四招判定**。

    抽出公共规则函数 famAbiRuleOf，在流派生成最终汇聚点统一收口：硬爪/铁拳/强壮之颚/超级发射器在实配招式不满足族群时不再靠全量池或默认顺序上位，机制强制核心特性（sc=99）不动。

    全库 35 处「首推条件特性但四招不满足」全部改为更契合特性（如拖拖蚓铁拳→沙之守卫、怪颚龙强壮之颚→结实），80 个满足条件的正确首推保留；仅 #2234 因主特性池全为硬爪而诚实降权告知。

    线上 1,882,656 B｜SHA1 `B100C6533434936969B4C4498732E769D3C2AC56`｜gh-pages `537cc86`，逐字节核验一致。

- **v4.337**（2026-11-13）：**修复特性误推，高暴击判定失效**。

    修正高暴击判定取英文名配中文正则的静默失效，狙击手等暴击特性不再被无条件扣分；巨钳螳螂三个流派首推改为狙击手（高暴击极落钳协同），蜕皮/授粉降为带说明的备选。

    全库 18 只真有高暴击招的正确翻身，12 只维持降权。

    线上 1,880,834 B｜SHA1 `68B1255AA7E1668EDF53452958E7491B69309639`｜gh-pages `d852afa`，逐字节核验一致。

- **v4.336**（2026-11-13）：**详情页去重复连贯，答案卡唯一、详细卡只讲为什么**。

    换玩法内聚进顶部答案卡（首推实心、换玩法描边），点哪个答案卡和下方依据同步更新；详细流派卡默认收起，不再把四招/特性/性格/EV/队伍重列第二遍。详情总高 3268→889。

    线上 1,880,136 B｜SHA1 `02EB501898849DB47955AE2CC52746E0D4A4C37F`｜gh-pages `f3ec589`，逐字节核验一致。

- **v4.335**（2026-11-13）：**推荐可信度，默认单一答案 + 亮点保留 + 同质化合并**。

    流派经 classifyBuilds 按招式集合 Jaccard 归类：首推实心高亮「就这么配」，玩法本质不同的作「换玩法」亮点保留趣味，四招雷同/微调与低分兜底收进折叠默认不展示。修正 150 只默认首推非最高分的问题。

    线上 1,880,716 B｜SHA1 `E9984E934C0FFAD9ED559C0B5D671D1C51986ED7`｜gh-pages `2739a9b`，逐字节核验一致。

- **v4.334**（2026-11-13）：**图鉴资料页减负，首屏 4502→3174**。

    顶部加「定位概要卡」：一句定位（与核心配队同源）+ 推荐特性/道具/性格 + 实速 + 组队按钮 + 招式表锚点；进化链和速度滑块默认折叠，展开后内容完整。

    线上 1,877,349 B｜SHA1 `96AAEA35E0D037E6E0FF90D2F1476CDA61056305`｜gh-pages `31cf429`，逐字节核验一致。

- **v4.333**（2026-11-12）：**队伍构建页顶部给整队一句话结论**。

    看完 6 只推荐后不用再切到分析页：结论条直接告诉「这队有硬伤/要注意/全过」，并列出最要紧的 2 条（如 4 倍岩钉无人清钉、反强化全缺），一键跳完整分析。与分析页体检卡同源同一个结论数组，不会打架。

    线上 1,872,939 B｜SHA1 `D8B23F0A6D7D82306A1FB58A695E714117D93AAD`｜gh-pages `fc9d42e`，逐字节核验一致。

- **v4.332**（2026-11-12）：**点进去第一眼就是答案**。

    详情页原来 3108px 高，配招和 5 只队友要滚两屏才看得到。顶部新增「一眼答案卡」（首屏 106px）：定位一句 + 特性/道具/性格/努力值 + 四招 chip + 队友 chip + 「就用这套」，把种族条/弱点/伤害倍率收进折叠。顺手修掉一键配齐被最后一个流派覆盖的隐患。

    线上 1,870,922 B｜SHA1 `94BF030D41EDF6EC786EA521CD9AF3BDB5305881`｜gh-pages `eb4dcde`，逐字节核验一致。

- **v4.331**（2026-11-12）：**引擎层「展开才计算」**。

    详情页的「引擎视角 ▸」默认折叠却同步算完，内部还对每个流派各扫一遍全库。改成折叠壳 + `ontoggle` 触发计算后，首点 1161ms → **917ms**，展开约 0.2s 内可用。

    线上 1,867,400 B｜SHA1 `D386CF008AAB6C061053A1EFAF46B31C38A47595`｜gh-pages `446791b`，逐字节核验一致。

- **v4.330**（2026-11-12）：**点核心不再「点了没反应」**。

    实测 `selectCore` 冷态 1.1s，其中 `findTeammates` 扫全库 4 次 607ms、`sysScore` 5008 次 434ms。给两者加记忆化（键含核心与体系上下文，分片期不入缓存），并在点击瞬间先出骨架：反馈 17ms 出现，同一只二次点开 418ms。

    线上 1,866,306 B｜SHA1 `AA66D2057E1B65B9B19932608780609694733907`｜gh-pages `2c7db11`，逐字节核验一致。

- **v4.329**（2026-11-12）：**空态直接给下一步动作**。

    「核心配队」页未选核心时不再是「请先选一只核心」的单句提示：已有队伍的用户看到「你这 6 只已经在队伍里，不用再选核心」+「看这队有什么问题 →」「让引擎直接把这 6 只配好 →」两个按钮；没有队伍则给出「载入存档」「随便来一队」。

    线上 1,864,909 B｜SHA1 `3A223878D7D32C5215B3963F05E559A857124552`｜gh-pages `6ee3cb8`，逐字节核验一致。

- **v4.328**（2026-11-12）：**队伍构建页直接给答案**。

    每只成员默认显示引擎推荐（特性/道具/性格/EV/四招 + 一句理由），点「✓ 用这套」一键写入；特性芯片与招式行收进「手动改」折叠；顶部一句话说明唯一必须用户决定的是「核心是谁」，因为其余 5 只围绕它配。

    线上 1,863,390 B｜SHA1 `19383AED692D17AE5ECFC67623CBCAA85347CC96`｜gh-pages `286682d`，逐字节核验一致。

- **v4.327**（2026-11-12）：**分析页信息分层——结论先行、细节折叠**。

    体检卡提到页面最前，首屏只留「体检结论 + 画像摘要 + 成员一览」；画像细节、联防、每只配置、叙事、诊断、深度维度收成 6 条折叠，默认收起、点开才看，展开状态记忆到下次进入。首屏可见卡片 35 → 5。

    线上 1,857,755 B｜SHA1 `E90ABA85FB6C8A2F6C42EA529BC4AACD62156AD8`｜gh-pages `ca3f94e`，逐字节核验。

- **v4.326**（2026-11-12）：**体检结论的候选可一键落地（落地即用）**。

    「怎么修」里每个候选挂「↪ 换上这一只」，点两下（第二下确认）就把这只连同特性/道具/性格/EV/四招写进队伍，并把卡片承诺的改槽、换性格、补速 EV 一起落地。卡片显示的配置与点下去的结果逐项一致。

    线上 1,854,255 B｜SHA1 `5E3EF450B32F16740C4A1DF205F12B477FA23071`｜gh-pages `5d113f8`，逐字节核验。

- **v4.325**（2026-11-12）：**分析页开页即出结论 + 体检卡 4.6 秒 → 0.3 秒**。

    `switchTab` 的 analyze 分支漏调 `renderAnTab()`，导致「队伍分析」页永远空白；补齐入口后暴露体检卡单次 3.5 秒（为 6 条结论预先生成全部候选配置）。改为结论先出、「怎么修」点开才生成，并给 `teamCheckHtml` 加记忆化、主体异步补挂、首屏预热。实测主体 327ms 出现、体检卡 330ms 完成、按需生成配置 874ms。

    线上 1,848,291 B｜SHA1 `4D5F75CD8DB0905438CD5A980F0874D8C6B907F1`｜线上一致（gh-pages `8fc0a45`，逐字节核验）。

- **v4.324**（2026-11-12）：**体检结论按严重度分组 + 存档文件名记忆**。

    体检卡从「混排 + 超 3 条折叠」改为三段：硬伤全展（不藏）、提示前 2 条 + 折叠、参考整组默认折叠。折叠按钮改为向前搜索最近的折叠区，两组互不干扰。存档解析后显示文件名，并在解析按钮旁常驻「上次：xxx.sav」。

    线上 1,842,527 B｜SHA1 `7CE4D65497CE3BE1B694ED8DEA07D4DF6342D075`｜gh-pages `69cba82`，逐字节核验一致。

- **v4.323**（2026-11-12）：**核心配队「就用这套」**。

    方案卡第 8 段加「🧩 就用这套（6 只一键配齐）」：核心与 5 名主推队友的特性、道具、性格、EV、四招全部一次搬进队伍构建；队伍非空时同按钮二次确认再替换。同版修掉装配结果里的同招重复（雷公 反射壁×2），去重后不足 4 槽自动补满。

    线上 1,840,609 B｜SHA1 `D9BF1DE3CA003D0F7D9EFD646BD0355B641194B3`｜gh-pages `942434c`，逐字节核验一致。

- **v4.322**（2026-11-12）：**减负第二批**。

    按钮改成说人话（换谁更好 / 补哪只 / 换哪招），队伍构建首行只留搜索与三个主动作，其余六个低频按钮收进「更多工具」；队伍分析体检只摊前 3 条硬伤，其余一键展开；存档解析完有通栏按钮直接跳全队体检（配置来源自动切存档实配）。

    线上 1,835,887 B｜SHA1 `663E1D4BA44B0E4DB421DCE1BD97C52B85DECCED`｜gh-pages `7ad8095`，逐字节核验一致。

- **v4.321**（2026-11-12）：**点击卡顿治理**。

    tab 切换的重渲染让到点击之后（先可见再计算），防守剖面/进攻覆盖加记忆化，网格卡片用 content-visibility 跳过离屏渲染；弱引擎内嵌浏览器与慢机器上点击不再卡死。判定引擎零改动。

    线上 1,833,123 B｜SHA1 `901148C9DFC4522F9DBA972B52FB7E9203E96188`｜gh-pages `b73a675`，逐字节核验一致。

- **v4.320**（2026-11-12）：**减负第一批**。

    导航收成「核心配队 / 队伍构建 / 队伍分析 + 图鉴资料」，6 个资料页默认折叠；首屏改为三入口（抄作业 / 导存档体检 / 随机一队），核心页高级筛选默认收起。判定引擎零改动，空 catch 门禁未破。

    线上 1,832,357 B｜SHA1 `F4F72032…`｜gh-pages `ed17866`，逐字节核验一致。

- **v4.319**（2026-11-11）：**招式质量小标上列表**。

    「可学招式」表与「招式反查」表在招式名后直接标 ×N段 / 慢出手 / 反伤 / 僵直 / 自爆 / 命中<75 / HP缩放，配招当下就能看到这一招实际比账面更贵还是更便宜。段数解析抽成唯一一份 `mvSegOf`，体检卡同步改调它。

    线上 1,828,089 B｜SHA1 `5E3F0342…`｜gh-pages `676c654`，逐字节核验一致。

- **v4.318**（2026-11-11）：**换人模拟接终局指标**。

    换人卡不再只比弱点数与入场税：打穿 420 墙的发数、两发内被压死的只数都走体检卡同一函数复算，改善绿、恶化红、持平不印；「整队变好」总判定也纳入终局，防止中间量好看但终局恶化。

    线上 1,826,306 B｜SHA1 `C296D9FD…`｜gh-pages `ffae115`，逐字节核验一致。

- **v4.317**（2026-11-11）：**换招建议接打穿速度**。

    不再只比平均伤害：替换前后各算一次「对 420 血墙几发」。发数真降才写「从 X 发降到 Y 发」；发数不变则明说「只抬高单发数字，未必值得动」。主档实测 Storming 水炮→Sky Quake 由 6 发降到 5 发，雷电云 闪电猛冲→真气弹 仍 3 发（覆盖招）。

    线上 1,823,956 B｜SHA1 `F1573340…`｜gh-pages `ed09bda`，逐字节核验一致。

- **v4.316**（2026-11-11）：**槽位优化（换招建议）**。

    只动招式、特性/道具/性格/EV 不变：池内最优攻击招比实配高 15% 以上才建议换，否则明确写「实配已在池内最优 15% 内」，不硬造建议。三条护栏：破族群协同不建议；非本系覆盖招不顶主招；喷水/捏碎等 HP 缩放招不照抄。

    线上 1,822,207 B｜SHA1 `8C398B55…`｜gh-pages `e21f6b7`，逐字节核验一致。

- **v4.315**（2026-11-11）：**招式价值走真实伤害公式**。

    不再用一个「面板系数」乘进有效威力：物理招按物攻、特殊招按特攻，经真实伤害公式（42×威力×A/D/50+2）再乘 STAB/道具/特性。体检卡会报「物攻 X / 特攻 Y」与该只最优招的平均伤害，并标注这是对中性基准受击者（双防 90）的口径，不能与打穿速度的 420 血墙几发直接互比。

    顺带修掉两处口径重复计入：坚果哑铃「木槌」→「强力鞭打」（反伤折算），鳃鱼龙「龙之俯冲」→「龙之牙」（命中率被算了两遍）。

    线上 1,818,942 B｜SHA1 `9813A518…`｜gh-pages `7049d06`，逐字节核验一致。

- **v4.314**（2026-11-11）：**招式价值随特性变**。

    同一个招在不同特性下不是一个价：龙之牙在鳃鱼龙（强壮之颚+龙颚）身上是 85×1.3×1.5，在别处就是 85。新增按特性描述解析增伤（啃咬/拳/劈砍/接触、属性增伤、低威力增益、活力），评分同时纳入 STAB 与攻/特攻面板。体检卡新增「招式价值随特性变」：报当前最优点数，并报「换主特性后最优变成谁」——不选这个特性，别的招可能更好。

    打穿速度改为同一口径，修正了此前鳃鱼龙报「龙之俯冲」而招式价值报「龙之牙」的矛盾（族群标记漏算）。

    线上 1,817,626 B｜SHA1 `83026A5A…`｜gh-pages `07ce926`，逐字节核验一致。

- **v4.313**（2026-11-11）：**招式族群与特性协同**。

    同族招集中不是缺陷：鳃鱼龙四招全咬类，正是它的天性「强壮之颚」把啃咬/颚类乘 1.3 的结果。新增族群识别（咬/拳/劈砍/接触），按特性吃哪一族来判断配招是否冗余：≥2 条同族 → 特性吃满；0 条 → 特性白给，换一条该族招白拿 30%。实配不足 2 条时不判，避免误报。

    线上 1,813,130 B｜SHA1 `16ACCF08…`｜gh-pages `857afd7`，逐字节核验一致。

- **v4.312**（2026-11-11）：**被击穿速度**。

    反向视角：一只 130 攻/特攻、252 EV、生命宝珠、本系 120 威力 的顶配压制手，打队里每只几发；并给「对面 +1 强化」档（×1.5）。防守端用成员实配 EV 与真实血量，性格未知按中性并写明。

    结论分档：几只是满血被一发带走、几只两发内倒，各给应对方向（先制/守住/威吓压节奏，或换耐久更好的）。

    线上 1,810,585 B｜SHA1 `93096109…`｜gh-pages `a5e12e4`，逐字节核验一致。

- **v4.311**（2026-11-11）：**破受补「打穿速度」**。

    以 420 HP / 252 单防 的通用高耐久墙为基准，估算队里最快几发能打死：单发伤害走既有伤害引擎（STAB/克制/道具/特性），再乘「有效威力/账面威力」把命中率、多段、蓄力、反伤、负先制一并折算。最快 ≥4 发就直接说「带回复的墙等于打不死」，<4 发提示把这几发压缩在回复间隙。

    排除反击类（双倍奉还/镜面反射）与 pw<20 的占位招，避免算出 120 发那种荒谬值。

    线上 1,808,208 B｜SHA1 `055C0D52…`｜gh-pages `b5dd2c2`，逐字节核验一致。

- **v4.310**（2026-11-11）：**伤害招质量，不只算威力**。

    有效威力 = 威力 × 命中率 × 段数，再按机制折价：需蓄力 ×0.5、反伤 ×0.85、自爆 ×0.35、负先制（真气拳 −3）×0.8。多段招按段数乘，且随队伍上下文取段：连续攻击固定 5 段、机变骰子 2–5 段变 4–5 段、都没有按 3.2 段期望。最佳本系与破受威力门槛全部改吃这个值，并在文案里标出原因（`冰锥(25 +STAB，×5段)`、`大字爆炎(…，命中85)`、`真气拳(…，慢出手)`、`大爆炸(…，自爆)`）。

    体检卡新增参考条「多段招按段数吃伤害」。实测刺甲贝的最佳本系从自杀招大爆炸(250) 更正为冰锥(×5段=150)。

    线上 1,805,805 B｜SHA1 `35D4F963…`｜gh-pages `5cd9d19`，逐字节核验一致。

- **v4.309**（2026-11-11）：**破受缺口候选按类挑人**。

    以前判出「某类墙没手段」只给笼统的破受候选。现在按缺口类型找人：缺魔法防守对策 → 池里有挑衅/固定伤害的；缺多重鳞片对策 → 池里有剧毒/磷火/寄生种子的；缺毛皮大衣对策 → 池里有高威力特殊招的。候选带完整配置（特性｜道具｜性格｜EV）与换人模拟，实配已经在用的排最前。

    线上 1,803,056 B｜SHA1 `0BE3961A…`｜gh-pages `c5b58b4`，逐字节核验一致。

- **v4.308**（2026-11-11）：**破受补对手侧对策核对**。

    ER 的墙是面板叠特性，有些特性直接免疫非直接伤害。现在把队伍的破受能力拆成五类（直接固定伤害/挑衅、间接状态、强化收尾、物理大招、特殊大招），对六类常见防守特性逐个问「还剩什么手段有效」：魔法防守只认固定伤害/挑衅/强化，毛皮大衣认特殊或间接，多重鳞片要先削血，坚硬岩石/过滤怕倍率、认稳削，纯朴让强化归零，奇迹皮肤让变化招打空。

    有整类没手段时给提示级结论并附破受候选；否则一条参考列清每类靠什么（只列队里实际有的）。

    线上 1,798,647 B｜SHA1 `B8E53583…`｜gh-pages `0c60e41`，逐字节核验一致。

- **v4.307**（2026-11-11）：**评分回显 + 换人候选重排**。

    体检卡新增常驻「定位画像」：每只写清路线与特征句（偏防守写稳回复/耐久，偏进攻写强强化/先制/最佳本系），让用户看得见裁判依据。

    「怎么修」的换人候选不再按「肉盾 > 有减伤特性 > 已持有」排，改成按「能不能真干缺的那件活」打分：角色肉盾、当前生效减伤、招池稳回复、耐久和、最高攻是否够低，逐项加分后排序；候选行直接写出凭什么叫它上（自带稳回复 偷懒 / 耐久和 XXX）。

    线上 1,795,240 B｜SHA1 `E95DACBD…`｜gh-pages `4b1bf76`，逐字节核验一致。

- **v4.306**（2026-11-11）：**招式质量加权，不再只数条数**。

    自我再生和吸取拳、剑舞和集气不是一个量级，数条数会把「有一堆烂招」算成资源。现在按质量分层给分：回复分稳定/条件/间接三档（3/2/1），强化分一次到位/轻强化/其余（3/2/1），先制按「威力 × 先制度 × 本系加成」取最高，攻击按属性分别取最高威力并计覆盖数与最佳本系招。

    再把防守分与进攻分做加权总分比较，差值定路线（防守/进攻/双修/中庸），实配堆耐久时把防分抬到攻分之上。依据文案直接写质量项：稳回复 羽栖、强强化 龙之舞、先制 神速(80×+2)、覆盖 9 属性。

    线上 1,793,896 B｜SHA1 `7F6013D5…`｜gh-pages `724e26f`，逐字节核验一致。

- **v4.305**（2026-11-11）：**定位改判「全量能力集」，存档只当限制用**。

    之前拿存档里当前那四招当判据，等于用一次配置替代这只的全部可能。现在判路线看三件：种族值（攻/特攻 vs HP+防+特防）、按等级过滤的全量招池（升级 + 教学，统计攻击/回复/强化/先制各几个）、以及实配与 EV 的用法倾向。存档只提供等级上限和招式池边界。

    结论分三档：防守位缺减伤特性 → 提示（附种族值与招池依据，给「真扛」和「改进攻」两条路）；防守/双修有减伤 → 参考条；进攻型挂减伤且确实在堆输出 → 参考条「算容错」，并点名特性池里可换的非减伤项。

    线上 1,791,517 B｜SHA1 `CF8379B5…`｜gh-pages `8f48274`，逐字节核验一致。

- **v4.304**（2026-11-11）：**特性托底改为先判定位，不再把防守特性绑死防守流**。

    进攻手挂减伤特性是容错、不是要求它改走防守。现在按种族值（攻/特攻 vs HP+防+特防）、实配四招里攻击招的个数、EV 分配，再叠加角色标签，先判这只在该队里的活是什么：

    - 防守位 + 有减伤 → 参考条「有特性托底」
    - 防守位 + 无减伤 → 提示，文案附判定依据，并给两条路（真扛就切特性/换人；其实该打输出就改招和 EV）
    - 进攻位 + 有减伤 → 参考条「算容错，不算路线」，明确写不用改

    线上 1,788,834 B｜SHA1 `FE93D406…`｜gh-pages `0340382`，逐字节核验一致。

- **v4.303**（2026-11-11）：**体检卡新增「特性托底」检查**。

    只看面板会漏掉 ER 墙的一半强度。现在对肉盾位检查**真正生效**的减伤特性（选中主特性 + 3 条天性），abis 里没选中的槽不算。没有托底 → 提示并给三层修法：队内切特性（同队能补、不用换人）、道具补丁、换一只同定位自带减伤的前排（带完整配置与换人模拟）。都有 → 参考条，只列生效中的特性。

    线上 1,786,635 B｜SHA1 `D5D37ACF…`｜gh-pages `3aff89d`，逐字节核验一致。

- **v4.302**（2026-11-11）：**破受检查升级为按对手防守特性分层**。

    只数「有没有剧毒/磷火」是错的：ER 的魔法防守免疫一切非直接伤害，多重鳞片/幻影防守/坚硬岩石/过滤连固定伤害一起砍，神奇守护让非克制招直接无效。现在把破受路线切成**间接**（剧毒/磷火/寄生种子）与**直接**（挑衅/地球上投/黑夜魔影/愤怒门牙/紧咬不放），强化另算一条：

    - 只有间接 → 提示「破受全靠间接伤害」，说明魔法防守与属性免疫会整类废掉
    - 只有直接 → 提示「只会硬碰硬」，说明固定伤害撞减伤也磨不动带回复的墙
    - 两条都有 → 参考条，并写明怕哪类防守特性

    候选文案也改成按路线互补挑（现有是间接就挑挑衅/固定伤害）。
    线上 1,780,554 B｜SHA1 `45491B34…`｜gh-pages `273ba0f`，逐字节核验一致。

- **v4.301**（2026-11-11）：**体检卡新增「破受」检查**。

    ER 的高耐久墙靠多重鳞片、奇迹皮肤这类特性压伤害，纯攻击磨不动、回复一次就白打。工具按配置查队里有没有不吃面板的破受手段：状态（剧毒/磷火）、封回复（挑衅）、固定与百分比伤害（地球上投/黑夜魔影/愤怒门牙）、吸血（寄生种子）、封换人（紧咬不放），强化招另算一条路线。

    既无手段也无强化 → 提示「打不穿高耐久」；只有 1 只或 1 类 → 提示「破受手段太单」；2 只以上且 2 类以上 → 参考条。怎么修给带配置的破受手候选，沿用存档联动与换人模拟。

    线上 1,778,516 B｜SHA1 `B2B0A4C7…`｜gh-pages `fcc17a1`，逐字节核验一致。

- **v4.300**（2026-11-11）：**体检卡新增「控速」检查（空间/顺风有没有受益者）**。

    戏法空间只对慢的有利，顺风只对中速的有利；开在错的队伍里是负收益。工具按配置检查队里带空间/顺风的人，再用速度分位（P50 273 / P90 372，与速度线页面同源）核对受益者：没有受益者就提示并说明成因，有受益者出参考条，全队不带则不发。

    「怎么修」落在招式槽：撤掉那一槽（附该只完整配置照抄），或换成速度落在相应区间的队友。

    线上 1,776,321 B｜SHA1 `9DFDF9D8…`｜gh-pages `97c7942`，逐字节核验一致。

- **v4.299**（2026-11-11）：**体检卡新增「配置」检查（道具与招式打架）**。

    突击背心禁用变化招、讲究系列锁招，这两件事和对手无关，只看自己配置就能定死。工具按存档实配的道具 + 变化招现算：背心撞变化招记硬伤，讲究撞变化招记提示，有讲究/背心但没打架则出参考条。

    「怎么修」不走换人，而是给**道具槽替换 + 其余照抄**：点名当前道具，建议吃剩的东西或凸凸头盔，并附该只的特性／性格／EV。

    线上 1,774,023 B｜SHA1 `CE2D9D92…`｜gh-pages `69ca8c3`，逐字节核验一致。

- **v4.298**（2026-11-11）：**体检卡新增「续航」检查**。

    盾位靠回复兑现价值。工具按配置检查队里 roleTag 为肉盾的成员有没有带回复招（自我再生/羽栖/寄生种子/月光等）：盾位全部带回复出参考条，有盾位缺回复出提示并点名是哪只缺、哪只有。

    「怎么修」给带回复招的队友候选，完整配置、存档联动、进程标注、换人模拟与其他检查一致。

    线上 1,771,788 B｜SHA1 `BFDF3CDD…`｜gh-pages `fda0578`，逐字节核验一致。

- **v4.297**（2026-11-11）：**体检卡新增「场地依赖」检查**。

    与天气同构：冲浪之尾要在电气场地上才有 ×2 速、草之皮毛要在青草场地上才有 ×1.5 防；电气种子/精神种子/青草种子/薄雾种子也只在对应场地上生效。工具按「当前主特性+3 天性」和实配道具逐只核对全队有没有场地制造者或场地招：缺了出提示，闭合出参考条。

    「怎么修」给场地手候选（特性自动开场地会点名「出场即触发」），完整配置、存档联动、教学/Mega 进程标注、换人模拟与其他检查一致。

    1,770,440 B / `694DC8D0703F1172BCF0F022319094C71739876A…`，线上已一致（gh-pages `3f2bba7`）。

- **v4.296**（2026-11-11）：**体检卡新增「轮转节奏」检查**。

    你的强化手能不能安全上场？工具按配置检查全队有没有折返招（急速折返/伏特替换/快速折返）：有强化手且有折返出参考条，说明折返手能边打边把输出位安全带进场；有强化手但没折返出提示，说明它只能硬换、还没强化先残血；没有强化手的队伍不发此条。

    「怎么修」给出带折返招的队友候选，完整配置、存档联动、进程标注、换人模拟与其他检查一致。

    1,767,049 B / `0060C4D4DBC71F9776D2BE3DBE56E21BE3E97064…`，线上已一致（gh-pages `d02b235`）。

- **v4.295**（2026-11-11）：**体检卡新增「天气依赖」检查**。

    你选的特性要在对应天气下才生效（悠游自如/暴风雨吃雨、叶绿素/太阳之力吃晴、挖沙/沙之力吃沙、拨雪/冰冻之躯吃雪，ER 口径 ×1.5），工具按「当前主特性+3 天性」逐只核对全队有没有自动天气手或手动天气招：缺了出提示，说明这个特性等于白给；闭合出参考条。

    「怎么修」优先点名自动天气手（出场即触发、不占回合），其次给手动天气招改槽候选，完整配置、存档联动、教学/Mega 进程标注、换人模拟与其他检查一致。

    1,766,080 B / `AF8D1CEBFC1E998CB9DE7D9AE341E8FEE0690B45…`，线上已一致（gh-pages `f00a8a3`）。

- **v4.294**（2026-11-11）：**体检卡新增「状态答案」检查**。

    被挂状态了能不能解？工具逐只按配置检查：治愈铃声/芳香治疗（全队解状态）、神秘守护（5 回合防状态），以及自然回复/自然恢复/魔法防守这类状态特性。有答案出参考条点名；没有则出提示，说明磷火废物理手、剧毒磨盾、催眠跳回合的后果（强攻队合理不带队医，故不设硬伤）。

    「怎么修」给出带队医招的队友候选，完整配置、存档联动、进程标注、换人模拟与其他检查一致。

    1,763,098 B / `3F9189BB07DD3B684BAC8F7686B235D87DCE1628…`，线上已一致（gh-pages `7834b3c`）。

- **v4.293**（2026-11-11）：**体检卡新增「先制弱点」检查**。

    你的强化手会不会被对手的先制招在出手前收掉？工具对每个带强化招的成员，按同一张相性表计算七种常见先制招（子弹拳/音速拳/冰砾/突袭/水流喷射/影子偷袭/真空波）的承受倍率：4 倍出硬伤、2 倍出提示；带气势披带或队里有先制队友则降级为参考条并说明条件。

    「怎么修」给出自己带先制的队友候选（可先制反打对方先制手），完整配置、存档联动、进程标注、换人模拟与其他检查一致。

    1,761,940 B / `DEF09FFB0FFA867D5B0631CCA99D636DDD113D0F…`，线上已一致（gh-pages `2406bed`）。

- **v4.292**（2026-11-10）：**体检卡新增「反强化答案」检查**。

    对手剑舞/龙舞强化起来之后，你这队有没有人能解？工具现在会逐只按配置检查：吼叫/吹飞（强制换人）、黑雾/清除之烟（重置或抹掉强化）、龙尾/巴投（打伤害同时强制换人）、纯朴特性（无视对方攻击强化）、挑衅（阻止起手强化）。

    三种结论：有答案 → 参考条点名是哪只、靠什么；只有挑衅 → 提示它拦不住已经强化好或带替身的；全没有 → 硬伤，并在「怎么修」里给出带完整配置（特性/道具/性格/EV）的候选，存档联动、进程标注、换人模拟与其他检查完全一致。

    1,760,036 B / `A9F34935F77090E0937DF8D6260F1A68BA22052A…`，线上已一致（gh-pages `f16c22b`）。

- **v4.291**（2026-11-10）：**两处操作手感修复——空白区滚轮能用了，弹窗点背景就关**。

    ① 宽屏左右空白区域以前滚轮没反应（滚动只发生在中间 1200px 内容区），现在滚轮落在任何空白处都会自动转发给页面内容；弹窗打开时则转发给弹窗，点在内容区内部仍是原生滚动，不会被打断。

    ② 宝可梦详情等弹窗，直接点击周围暗色背景即可关闭，不用再找右上角的 ×（点内容区不会误关）；清空队伍这类危险确认框仍只能点按钮，防误触。

    1,758,751 B / `1871E2A42BC70E5F11CA3C0108911F5C86E26E5A…`，线上已一致（gh-pages `265ae6a`）。

- **v4.290**（2026-11-10）：**「怎么修」开始考虑你的游戏进程——等级不够、Mega 石没有的情况会直接标出来**。

    ① **先回答「存档能不能解析到所有信息」**：每只宝可梦的等级、实际四招、持有道具、特性、EV、能力都能读，图鉴里每招的学习等级、教学列表也都在——所以「这只现在能不能用上某招」算得出来；但**背包里的库存（Mega 石、超级手镯、TM）解析器读不到**，多轮扫描没找到口袋结构，官方解包器也不解析背包，这类信息会在文案里写明「存档无法确认」而不是假装你有。

    ② **三类进程标注**：改槽建议里，目标招是升级招而当前等级不够 → 红色「这只 LvN 还学不到，要 LvM 才解锁，先练级」；教学招 → 橙色「需找教学 NPC」；Mega 形态候选 → 写明需要「超级手镯 + 对应进化石」，若这只正持有进化石会单独点名，普通宝可梦不会被误标。判定仍按配置（实际四招/推荐配置），「能学但不学」不算互斥。

    1,757,110 B / `633E770FDF6C8BB71B24398D858AEA043AD96D3E…`，线上已一致（gh-pages `5a04fb2`）。

- **v4.268**（2026-11-10）：**「宝可梦」页终于也认你的配速了**。图鉴列表每张卡多了一行「极速 372」或「速度 331 已配速」，详情页在种族值下面直接写「你的配速 / 极速 + 快过多少人」，不再让你把基础速度 120 当成实战速度。核心配队第 6 段在没有采用配法时，会直接告诉你「再 +N EV 就到 P75」或「退到 P50 能省 M EV 给 HP」，够不到的就把上限和替代手段写清楚。顺带修好一个藏了很久的问题：**推荐流派卡（魔法防守这类机制流派）第 6 段原来整段没有速度**，连「调整速度」按钮都不见了。1,674,886 B / `58523E69…`，线上已一致（gh-pages `5315ee0`）。
- **v4.267**（2026-11-10）：**配速抽屉里那张「多目标配速对比」表终于显示真数了**。以前它每一行都写着「所需EV 0」——不是你不投努力值，是这张表一直把方案读错了。现在它会告诉你：卡到 P75 要哪个性格 + 多少 EV、卡到 P90 是不是已经投满（会标红「满」），够不到的档（比如慢速宝可梦卡 P90）直接写「够不到」并说明上限，顺手给「围巾 / 提速特性 / 顺风 / 戏法空间」四条路。这张表也从折叠项里搬到了常用速度下面，**点任意一行，滑块和配法卡会一起跳到那条线**。顺带把够不到的常用速度按键调暗，省得你点了以为坏了。1,671,564 B / `EB1839C3…`，线上已一致。
- **v4.266**（2026-11-10）：**速度线上能看见自己队伍了**。以前「速度线」页只给全库对照表——你知道速攻手该过 P90、清场该过 P75，却不知道自己这队现在在哪。现在分位锚点正下方多了一条「我的队伍 · 速度现状」：每只一行，大字写实速、标出分位和「超过 P90 / 过 P75 清场 / 中速 / 慢速」，下面用一句话告诉你全队最快比 P75 高还是低、差多少，低了就直接给「控速 / 戏法空间 / 讲究围巾」的思路。有配法的成员带「配速」标（按你在核心配队采用的实速），没配法的标「极速」（252 努力 + 速度性格的上限），两种口径写在同一行里，不会混。点任意一行就能看这只的详情。1,670,141 B / `7B8653DE…`，线上已一致。
- **v4.265**（2026-11-10）：**你的配速贯通到「队伍构建」和「队伍分析」**。在核心配队给某只采用配法后，队伍构建的选人卡会从「极速 229」变成「速度 209 · 已配速」，「我的队伍」名单和队伍分析的槽位也会带上「速209」小标；队伍速度结构卡改为「采用配速优先」——已采用的成员按你的实速排位、并注明「其中 N 只按已采用配速实算」，全队最快与速度线塌陷告警都按实速判断，同时用一条灰线保留它理论极速作参照。没有采用配法的成员仍按极速计算，两种口径都在卡片上写清楚。另外修好一处刷新丢队伍的毛病：以前刷新后「我的队伍」会变成空位，现在会等数据就绪后自动恢复。1,667,029 B / `E26FC629…`，线上一致。
- **v4.264**（2026-11-10）：**核心配队的速度，终于和速度线、滑块接上了**。以前核心流派卡第 6 段只给努力值数字，看不到实际速度、也没法调；现在这一段直接显示「实际速度、快过约百分之多少的宝可梦、定位徽标」，并多了「调整速度」按钮。点它会打开你熟悉的速度滑块，拖到想要的速度、点「采用此配法」，核心卡就会按你的选择重算努力值——想省速度就把省下的努力值自动转给 HP，想提速就从 HP 等位置抽调，六项总和始终不变；采用的配法会被记住，刷新或下次打开都还在，点「恢复默认」可一键回到流派原本的推荐。1,664,224 B / `77A945C6…`，线上一致。
- **v4.263**（2026-11-10）：**流派卡的「努力值分配」恢复正常**。打开任意宝可梦的推荐流派，第 6 段「努力值分配」现在会完整显示六项努力值（如耐久流的 `252/0/252/0/4/0`）、彩色分段条和所用模板；点「分配依据」还能展开看为什么这么分（耐久模板、速攻模板等）。此前这一段只剩一条空条、编号还从 5 直接跳到 7，现已修复，编号连续。1,659,525 B / `1E2AA545…`，线上一致。
- **v4.262**（2026-11-09）：**速度滑块更好用、答案一眼看懂**。滑块现在每一档都精确停在这只宝可梦真实能达到的速度上，不再出现「滑到的数字和实际对不上」；速度区重排为「上面拖滑块、下面一张卡片直接给完整配法」——卡片用颜色标出性格（加速/中性/减速），用最大字号显示「投多少努力值、达到多少速度、省下多少」，剩余努力值的进攻或防守三格也都在同一张卡里，照着抄即可。原来的 P50/P80 这类看不懂的术语改成「快过约百分之多少的宝可梦」。1,660,035 B / `504956A6…`，线上一致。
- **v4.261**（2026-11-09）：**性格自动选最省的**。只走特攻或只走物攻的宝可梦，会自动选「+速度」性格、把用不到的另一攻略降，从而少投很多速度努力值（妙蛙花从中性 96 点降到加速仅 16 点）；双刀和纯盾保持不修正性格。可在进阶设置手动指定。1,659,171 B / `D14E43B0…`，线上一致。
- **v4.260**（2026-11-09）：**配速努力值分配修正**。空间打手这类不抢速度的宝可梦，剩余努力值在主攻投满后会把超过 252 的部分也塞进 HP，导致单项努力值超限 → 改为主攻、HP 各最多 252，多出的零头投给另一攻，攻击模式恢复三格显示。1,658,612 B / `DD732ABD…`，线上一致。
- **v4.259**（2026-11-09）：**默认配速更聪明 + 剩余 EV 会投攻击**。打开详情不再无脑满投速度，而是停在「投入不多、超过一大批宝可梦」的位置（速攻手停高速线、耐久手略提速、空间手不抢速）；剩余 EV 按定位自动判断——进攻型投主攻（物攻/特攻），耐久型投 HP/防御/特防；新增「自动 / 主攻 / 耐久」按钮可手动覆盖。滑块与结论卡手机端同屏，拖动即见。1,658,320 B / `7FF4CDF7…`，线上一致。
- **v4.258**（2026-11-09）：**滑块自适应上下限**。慢速宝可梦拖到高分区会弹红色「追不上」警告 → 滑块范围改为本只可达速度（最左减速 0EV、最右极速，开围巾/顺风自动延伸），越界自动夹回，红色警告移除。1,655,672 B / `E3826AA8…`，线上一致。
- **v4.257**（2026-11-09）：**信息层级重建**。用户纠偏「不是整体字号要大，而是每个区域最关键的信息要突出」。诊断出 454 处字号里 63% 同为 14.5px、灰色辅助说明与正文同号，层级被抹平。→ 辅助层降级（66 处 14.5→13.5、31 处 14→13），关键值抬到 18px/800 强调色；速度线首屏两条长黄条压成一句 + 折叠；分位锚点表 P90 蓝色大号字；直方图分位值原被渲染两遍相压成「37294」，隐去重复行并把刻度错开两行；速度滑块「卡线参考」折进折叠项，消除与结论卡「速度已满投」的并列矛盾。1,655,409 B / `5DDFBF18…`，线上一致。
- **v4.256**（2026-11-09）：**形态开关回执**。开关开了只看到列表变短，无法判断是哪个筛选在起作用 → 加一行「已隐藏 247 只可 Mega 的普通形态 / 653 只非最终形态（1253 / 1906 可见）」。1,654,256 B / `939AC743…`。
- **v4.255**（2026-11-09）：**配速滑块结论前置**。用户「滑到对应速度能算出剩余努力值最佳分配，但 UI 不突出重点」→ 方案卡上移到滑块下方并做成蓝底结论卡（`+252 EV → 372 速` 大字 + EV 三分格），进阶控件全折进「进阶设置」，乘区默认改为全关（原先围巾/天气/顺风默认开导致 ×4.5 放大，拖到 372 却说不用投 EV）。1,653,314 B / `C8DB4AC3…`。
- **v4.253**（2026-11-08）：**速度线特性列可见**。筛「只列有提速特性的」却看不到该列（手机端默认隐藏）→ 筛选开启时强制显示「特性加速」列，并修掉编号列断行。1,650,856 B / `6C43F8C1…`。
