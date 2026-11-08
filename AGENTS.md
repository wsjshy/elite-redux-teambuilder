# AGENTS.md — Elite Redux 存档解析项目（唯一入口）

> 本项目 = Pokémon Elite Redux（GBA 改版，基版绿宝石 BPEE）的 .sav 存档解析工具链。
> 本文档是唯一入口/目录/准则：新接手者先读本文，即可掌握全貌。
> 开发流程准则：**设计 → 对齐 → 实施 → 测试 → 回归**；改动后先自测再交付。

> **版本真相源（2026-11-07 登记）**：`index.html` 的 `ER_ENGINE_VER` 是唯一版本依据（当前 **v4.179**，与线上逐字节一致）。
> 本文 §6 与历史版本块（已下沉 docs/changelog/VERSIONS.md）均为记录性文字，不作为版本依据；出现不一致以 `index.html` 为准。
> `build_tool_html.py` **已退役**（2026-11-07 登记）：停在 **v4.136**，v4.137–v4.179 共 43 个版本无脚本源，为直接编辑产物演进，**重建会把线上退回 v4.98**。文件尾有 `ER_BUILD_FORCE_SYNC` 拒绝覆盖守卫（正常运行 SKIP），`tools/smoke.js` 亦断言该守卫存在。
> 数据改动必须同时同步 **CSV 源 / `data_*_v498.js` 三个分片** 两处——页面实际加载的是分片。
> （2026-11-07 数据源合一：`data.js` 已退役归档至 `archive/data.js.v4.179_full_snapshot`；实测与三分片 26/27 键完全等价、唯一多出的空 `sprites` 页面零引用。）
> 部署脚本 `tools/deploy_er.ps1` 的 `$DeployFiles` 白名单必须与线上在役文件一致（当前 5 项，含 3 个 v498 分片、**不含 data.js**），清空 gh-pages 前有齐全性断言。

## 1. 一句话能力

解析 mGBA .sav → 宝可梦全息清单 CSV+JSON：物种（中/英/编号）/等级/EXP/种族值/属性/EV/
能力值（队伍 7 项直读含特防；盒子公式基准）/特性×3+天生特性×3/道具/**完整 4 招式+PP**/可学招式池
（升级·教学·蛋·TMHM），跨存档轮换鲁棒，5 锚点自检，4 招解码 10 截图+2 换招实验铁证。

## 2. 目录与文件索引

```
D:\game\elite-redux\
├── AGENTS.md                        ← 本文档（唯一入口）
├── parse_er_save_v4.py              ← v4.1 解析器（现行，4招完整解码）
├── build_movesets.py                ← 招式表生成器（gameData+xlsm → 可学总表/招式数值/宝可梦基础 3 CSV）
├── build_item_table.py              ← 道具表生成器（官方 item_descriptions.h → 道具官方描述 + 官方译名中文）
├── build_tool_data.py               ← ★配招工具数据生成器 v4.x（21属性克制表/招式/特性/道具/**18战术模板**(v4.x: 12→18，新增 毒钉受队/强化接力/天气双核/场地控制/吸血站场/双天气轮换；新套 tips 参数化引用 WCONF 语义，不写死数值)**/**ABI_TAGS ~95条(im·hf·add·out输出倍率·def减伤·v0.5变体补丁)**/**MOVES_NOTES 60+条招式点评**/**ABI_ALIAS 419条**/**coreNotes 44条人工分析**/**nonFinal 640只非最终形态(evolutions kd==0)** + **v4.x 数据层 D1~D5：mvDescZh 291条 + abiDescZh 118条中文 desc（源=gameData 英文 desc 原文，未覆盖不输出、引擎回退英文） + sysSet 12条（desc 正则派生，非硬编码） + familyRoot 534条（265 root + 269 Mega/Redux 形态，kd==1 evolutions 链） + glossary 40条（定义 + ER 口径数值 + 来源档位） + 模板 12→18**；**v4.x 追加项 MATCHUP_SP：`matchupSp` = {攻属性:{spId:倍率}} 实际承受倍率预计算矩阵（天性档 im→0 短路/hf→×0.5/add→并表重查；稀疏只存≠1 格）18属性/15,809格/1,904物种** → 配招工具_data.js）
├── build_tool_html.py               ← ★配招助手 HTML 生成器 v3.24（7 Tab + 存档联动 + **特性修正三口径评估** + **模板推荐/体检/天敌/流程** + **核心配队(定位细分/强度倍率/**多流派配招引擎**/性格/道具/队友/简评)** + **队伍体检报告** + **人工分析44条置顶** + **内嵌 JS 存档解析器(v4.1 移植，选 .sav 即解析免命令行)** + **清爽 UI v3.9** + **核心配队多维筛选 v3.10** + **推荐仅最终形态 v3.11** + **非最终形态开关 v3.12** + **打击面贪心 + 双刀输出 + 交集属性筛选 + 流派卡盲点检查 v3.13** + **精灵图相对路径 v3.15** + **引擎升级规格 v1.0 B 节 v3.17：分层1-5 配招引擎(侧判定/候选池/多维打分/覆盖贪心/盲点+双刀补盲+选招依据) + WCONF/ABI_ATE 天气场地参数化(含待实测徽标) + 机制口径折叠块 + -ate 属性转换 + lDesc 代价标签 + 除钉 229/432 + 2502 护栏 + B1 勾选不丢天性** + **v3.18 收尾 3 补丁：特性名解析统一(abiIdByZhOrEn 加 abiAlias 回退，4 处既有路径全通) + abiAdjOf 无对手保守降权 ×0.7 + 21×21 克制表 UI 逐格复核(0 差异)** + **v3.19 两裁决：本系(含 -ate 转换后本系)主攻招豁免无目标 ×0.7(非本系补盲招维持 ×0.7、有目标真免疫本系仍 ×0.5) + cap 语义确认** + **v3.20 D 节修复(独立黑盒复验)：D1 简评/流派标题纯文本化(禁在 esc 消费端拼 tlabel) + D2 导入前清空队伍(不再满 6 静默丢弃) + D3 徽标严格只挂 WCONF_PEND 14 项(删 +50%/+20% 误挂、补表内 7 行欠挂) + D4 僵直关键词补全(9 招)+蓄力独立标签(4 招)** + **v3.21 考古修正(依据 _源码考古_20261006.md)：WCONF.terrainBoost 1.5→1.3(源码 battle_config.h「B_TERRAIN_TYPE_BOOST=GEN_8」取 1.3 分支，仍留待实测徽标并标注「源码 1.3」) + 撒菱 2 层 3/16→1/6(源码 (5-层)×2；3/16 系 Psypoke 讹误) + WCONF_PEND 14→11 项(paraSpeed/paraFullChance/ABI_ATE.multiplier 转源码实证去徽标；defogRapidSpin 收窄为 defogEvasion 子项；ABI_ATE.stabConvert 保留并注「旧版源码无此机制」) + fracTxt() 分数显示(1/6 不再打印浮点串) + 除钉范围行转实证(仅 432 保留降闪避徽标)** + **v3.22 用户三项裁定(2026-10-06)：剧毒场地毒招 +30% 定稿(用户游戏内确认，去徽标) + 隐形岩次序 bug 从引擎移除(WCONF.hazardBugNote 整键删除 + UI 风险文案删除，引擎不做任何次序判定/降权) + 清除浓雾降闪避 1 级定稿(补 walls:foeOnly，除钉行全定稿去徽标)；WCONF_PEND 11→8 项；断言 183**) + **v3.23 「以 2.65+ 源码为准」落地（依据 _源码考古_v265_20261006.md：官方仓 eliteredux-source upcoming 分支在线抓取，Pin A=7d85acd5@2026-03-28 = v2.65 时代 / Pin B=910945b9@2026-10-06 = 最新）：①ABI_ATE.multiplier 1.1→1.0（ATE_ABILITY 宏只有 onMoveType+onStab，无 onOffensiveMultiplier）+ 新增 specialBoost{96 Normalize/280 Crystallize/659 Superconductor ×1.1} + ateMulOf(id) + pickAttacks 打分 *ateMul（原 ×1.05 已废）+ convOf 返回 id；②天气增伤取消分源单档 ×1.5（abilityBoost 0.2→0.5；TryChangeBattleWeather 只写 TEMPORARY 槽，viaAbility 不参与倍率，源码无「特性 20%」档）；③天气回合 5→8、岩石 8→12（WEATHER_DURATION 8/EXTENDED 12，手动与特性同档；UI 注「v2.65 实证 8，changelog 记 5」）；④terrainBoost ×1.3 与 terrainExtenderTurns 11→12 转定稿去徽标（B_TERRAIN_TYPE_BOOST=GEN_8）；⑤麻痹 ÷2+25% 定稿保持，冻伤 hailChanceMult ×3 转待实测（两 pin 均未找到，仅 Cryomancy×5）；⑥顺风 tailwindTurns 4 定稿（常量 3 + 当回合不递减 ⇒ 实际 4 时段，autoTailwindTurns 3→4）、戏法空间保留徽标（文案 5 vs 推算 6）、先制 -7 数据表实证；⑦WCONF_PEND 8→5 项（trickroomTurns/frostbite.hailChanceMult/lightClayTurns/toxicTerrain×2）；口径表脚注补 v2.65+ 考古段（Pin SHA/8·12/单档 1.5/-ate ×1.0）；断言 201**) + **v3.24 conv 来源属性 src 语义修正（依据数据层 A 登记的残留问题 + _源码考古_v265 §2）：新增引擎侧 CONV_SRC {280:{conv:'冰',src:'岩石'},659:{conv:'电',src:'钢'}} + convOf 返回 src（CONV_SRC 命中优先于数据层 abiTags.conv，否则 280 会退回 src='一般' 复现「一般→冰」错判）+ effMvType/convHit 门槛改 m[3]===(conv.src||'一般') + 新增 convSrcLabel（一般属性招/岩石系招）+ pickAttacks why 记「岩石→冰 ×1.1 + 本系 STAB」+ renderCore 数值卡「岩石系招转为 冰」+ 口径表 -ate 行补「来源属性 src」；数据层 2026-10-07 00:24 已补 280/659 目标属性（无 src 字段，abiTags.conv 7→9 条）；断言 216**） → 配招助手_ER.html + 同目录 data.js（v4.11 拆包：数据外置，HTML gzip 182KB），精灵图外置 assets\sheets（非 file: 下 gcore CDN 择优加载失败回退）)
├── parse_er_save.py                 ← v3.1 旧版（逻辑段驱动，保留作对照）
├── parse_er_save_v2_backup.py       ← v2 旧版备份（已弃用）
├── box_override.json                ← 可选人工箱号修正（特殊区默认段内顺序标注，此文件可覆盖指定箱号）
├── 存档解析v4_20261006.csv/.json    ← v4.1 最新产物（431条，53列）
├── 存档解析_20261006.csv/.json      ← v3.1 旧产物（19列，历史对照）
├── 配招助手_ER.html                 ← 配招配队工具**旧产物（v4.98，1,448,248 B，落后 81 个版本）**；主入口已改为 index.html（v4.179）。此副本与 index.html 的同步方向待定，不要拿它当基准
├── ~~data.js~~                       ← **已退役**（v4.179 数据源合一）：与三分片逐键等价（26/27 键 diff=0，唯一多出的 `sprites` 是空对象且页面零引用）后删除，归档于 `archive/data.js.v4.179_full_snapshot`（2,456,845 B）。运行时分片改为 `data_lite_v498.js` / `data_species_v498.js` / `data_adv_v498.js`，**不得回归**
├── 配招工具_data.js                 ← **构建链输入（6,884,918 B），浏览器不加载、不部署**；被 `tools\rebuild_source_inputs.py` / `check_rebuild_faithful.py` / `probe_v464.py` / `probe_v49.py` 引用，是三分片能重建的依据，**勿删**
├── nn_data\mech_lib_v412.json              ← ★v4.12 机制知识库（52 机制 / 156 combo / 40 词汇，meta version3 / schema v412 / updated 2026-10-10；既有 28 条逐字保留 + 24 新机制 + 32 新 combo，全部带来源 URL）
├── nn_data\smogon_prior_2026-09.json       ← ★v4.12 Smogon 标准对战先验（120 物种 / 2335 行，gen3ou×1.0 + gen9nationaldex×0.5，srcMax=0.516601 与既有 usagePrior 锚点逐位一致；引擎 SMOGON_PRIOR_ENABLED 开关消费、置 false 逐字节回退 v4.11）
├── nn_data\axis_lib.json                   ← ★15 协同轴知识库（v4.9 七字段逐字不动 + v4.12 每轴新增「体系模板」键：六位完整体系设计 15 轴×6 位=90/90）
├── docs\research\                    ← ★研究 / 清理 / 验证合辑（2026-11-07 起）
│   ├── nn_data备份说明_20261107.md    ← nn_data/ 打包入库的理由、包内清单、还原与更新步骤、sha256
│   ├── B类目录内容抢救合辑_20261107.md ← C:\temp 121 个 `er-*` 目录内容按机制整合（120.5 KB：九章正文 + 121 目录映射表 + 判废清单 + 删前口径）
│   ├── temp顶层逐项判定_20261107.csv   ← C:\temp 顶层 1023 项逐行判定（名称/类型/大小/类别/判定/依据）
│   ├── temp顶层清理执行_20261107.md    ← 清理执行记录（删 1022 项 / 释放 936.8 MB / 剩余 3 项 + nn_data 未入库发现）
│   ├── 回归与未决验证_20261107.md / teamqa接入_20261107.md ← 队检告警接入与回归验证记录（v4.182）
│   └── 特性反查冷启动全0_20261108.md ← 特性反查 Tab 冷启动「天性0/可选0」根因链（c87828c 快照复现：能力表已到 / species 分片未到 + 无补渲入口）+ c21e9f7「以 ERDATA.species.length 为就绪判据」加固 + 探针 A/B/C 复跑口径
├── docs\                           ← ★战斗分析文档体系（2026-10-06 新增，配招引擎升级依据）
│   ├── 战斗分析\01_属性克制体系.md   ← ★机制分析：21×21克制表全表/火打地面=1x裁定/12条规则
│   ├── 战斗分析\02_特性体系.md      ← 4特性机制(abis+inns)/ABI_TAGS 98条/14条规则
│   ├── 战斗分析\03_技能体系.md      ← 招式池1032/配招逻辑实读/lDesc缺失/17条规则
│   ├── 战斗分析\04_种族与能力体系.md ← 种族/IV=0口径/耐久口径勘误/18条规则
│   ├── 战斗分析\05_道具与天气场地.md ← 道具929/天气20%口径冲突登记/16条规则
│   ├── 战斗分析\06_对战战略与配队理论.md ← ★压轴：组队/联防/节奏/24条规则
│   ├── 战斗分析\07_组队方法论.md      ← ★v4.3 需求驱动动态构建：**需求清单生成规则(§4.5)** + **战术流派推导规则(§4.6)** / 36 条 R07 / **零硬门**(C14，`wxConflict` 已按裁定删除，见引擎偏差登记 D-1)；18 体系×6 槽骨架**已降级为「需求示例参考」**(`NEED_EXAMPLES`，非定死模板)；核心画像 `profileOf` / 需求生成 `genNeeds` / 终止 `shouldStop`(允许 <6 紧凑队) / 流派 `derivePlaystyles`(打法命名，禁止物特二分)
│   ├── 战斗分析\_00_资料汇编.md     ← 共用事实底稿（matchup/ABI_TAGS/引擎现状实读/6事实证据链）
│   ├── 战斗分析\_编写规范.md        ← 六篇文档编写标准（规则格式/术语统一/自检清单）
│   ├── 战斗分析\_99_交叉验证报告_20261006.md ← ★独立交叉验证（URL实测100%/P0-P2修复清单/C1-C5冲突表）
│   ├── 战斗分析\_引擎升级规格_v1.0.md / _机制默认口径表.md ← ★引擎升级规格(A 数据层/B 引擎层/C 验证/D 交付) + 参数真值源
│   ├── 战斗分析\_验证证据\_引擎升级B节_交付报告_20261006.md ← ★B 节交付报告（B1~B10 函数行号 / WCONF 落地清单 / C 节逐项结果 / 收尾 3 补丁 §1.13~1.15 / **v3.19 两裁决 §1.16 + §3.6 验证表** / 偏离登记 / 附录 A 终版行号续 / **§8 考古修正（4 处改动 + 行号 + 徽标归属 + 验证）**）
│   ├── 战斗分析\_验证证据\_Node断言输出_169PASS.txt / _Node断言输出_176PASS.txt / _Node断言输出_183PASS.txt / _Node断言输出_201PASS.txt / _Node断言输出_216PASS.txt / _v324_abiTags探针_9条_20261007.txt / _verify_v1.js / _bu浏览器实测记录_20261006.md / _源码考古_20261006.md / _源码考古_v265_20261006.md / _考古修正_场地数值卡1.3_20261006.png / _用户三项裁定_口径表定稿_20261006.png / _v323_口径表_天气8回合单档1.5_场地1.3_ate1.0_20261006.png / _v323_核心配队_选招依据_ate×1_20261006.png / _v324_ate来源属性_岩石转冰_20261007.png ← ★验证证据（**PASS=216/FAIL=0** 全量输出（含 D1~D4 + 考古修正 + 三项裁定 + v2.65+ 考古落地 + v3.24 conv 来源属性断言组）+ 断言脚本 v3.24 + abiTags 探针（conv 9 条 / 无 src）+ bu 原始输出含 §9 三补丁 / §10 两裁决 / §11 D 节修复复验 / §12 考古修正抽查 / §14 v3.23 复验 / §15 v3.24 复验；考古依据（旧版 master 快照 + v2.65 upcoming 双 pin）与证据图见本行末五项）
│   ├── 战斗分析\_验证证据\_独立黑盒复验_20261006.md / _独立黑盒复验_简评span外露_20261006.png ← ★独立黑盒复验报告（9 测试点通过 + D1~D5 清单 + 未覆盖边界 6 条；D1 截图证据）
│   ├── 战斗分析\_验证证据\_probe_recharge.js / _probe_recharge2.js / *_out.txt ← D4 全库 lDesc 关键词扫描探针（僵直组 9 招 / 蓄力组 4 招 / 修辞性 charge 8 招排除依据）
│   ├── 战斗分析\_验证证据\_diff_patches.js / _diff_patches_out.txt / _diff_patches_log.txt ← 收尾补丁影响面（别名变化 206/1265、降权变化 540/1265、×0.7 文案 1047 只）
│   ├── 战斗分析\_验证证据\_diff_stab.js / _diff_stab_out.txt / _diff_stab_log.txt / _diff_stab_scope.js / _diff_stab_scope.txt ← ★裁决1 影响面（旧/新双沙箱逐只 genBuilds：changed 435 / same 830 / err 0；变化但无豁免文案=0；豁免 735 只 2033 槽）
│   └── 战斗分析\_验证证据\_行号核对_终版.py / _行号核对_终版.txt ← 行号权威核对（v3.19 源 2,310 行；abiAdjOf L476 / 豁免分支 L506-511 / 调用点 L1834）
│   └── 研究资料\_01_ER资料检索.md/_02_对战理论检索.md/_03_组队理论检索.md ← 网络学习底稿（44+真实URL，Smogon/官方站/Reddit）+ 组队方法论专项（槽位配额/天气队骨架/TR结构/ER特性池，含逐条 URL 核验记录与冲突台账 **C1~C14**）+ **§13 v4.3 追加**（需求驱动动态构建：关键反证「不需物/特盾、只需对特定威胁的反制」§13.1 / 核＝自足中心 / 一只能担多职＋**<6 只收尾合规** §13.6 / 流派光谱 §13.7 / ER 多特性 §13.8 / 「positionless」术语来源诚实登记 §13.9）
│   └── research\NN配队调研.md / NN配队方案.md / _raw_学术检索.md / _raw_开源检索.md / _raw_数据源调研.md ← ★NN 配队神经网络探索（2026-10-07，**调研未接入、不改既有代码**）：外部研究/项目/数据源三通道清单（Metamon/VGC-Bench/OU Scanalizer/Laplace 等，URL 实测）+ 可执行方案（可行性=端到端当前不可行、NN 打分器+规则搜索为低风险路线；特征 184 维/只、队伍 1,184 维；MLP 31 万参数起步；数据路径 c 引擎蒸馏→b 自建模拟→a 原版先验；TeamState/TeamEvaluator 接口蓝图 + 影子模式 + feature flag 回退）；**v2 用户裁定 2026-10-07**：原版迁移升级为「预训练主源 + 规则偏移层」（§4.3：ER 特殊内容不学习、由已验证规则引擎确定性修正=百分百正确；负迁移三缓解）
│   ├── nn_data\ ← ★NN M1 数据层（2026-10-08 完成，3 子代理并行；只读红线=不改既有产物）：download_chaos.py（Smogon chaos 2026-09 最新月 4 格式五分布族零缺失）+ map_species.py（species_map 1907 条全覆盖，覆盖率 48.87%，未映射分类：自创316/形态308/未入样349）+ battlesim.py（89KB，四模式，规则全部带来源注释，R9 可复现性已修，6v6≈7.6ms）+ gen_engine_samples.py（10k 行 dataset_engine_v0.jsonl）+ split.py（train1381/val1700/test6919 防泄漏）+ shift_layer.py（v2 骨架 4 修正函数自检 PASS）+ engine_harness.js（共享 harness，HTML 快照指纹 sha256 2dae8721）+ M1_汇总报告.md；**口径整改 v1.0→v1.1**：engine_score=needCoverage 饱和退化（10k 样本 99.94%=100）→ 改 meanMemberScore（引擎位次分，40/40 迁移等价）；**里程碑未达标登记**：S2 Spearman=0.187<0.5（引擎分为需求契合分非强度分，信号缺因果通路；杠杆=扩机制覆盖/换标签，是 M5 质量门，不影响 M1 蒸馏数据）；M2 建议：T1 评估器直接可用该数据集
│   ├── nn_data\nn_models\ ← ★NN M2 训练与评测（2026-10-08 完成）：features.py（184/只 1184/队，35 项自检 PASS，AST 级防泄漏）+ features_cache.npz + train.py + mlp_a_v1（sklearn MLPRegressor，1.35MB joblib + 4.26MB weights.json JSON 登记格式，<5MB）+ eval.py（--all 可复现）+ m2_metrics.json + M2_评测报告.md；**六项评测 ①②③⑤ 未达标、⑥ 登记通过**；**§5 gate 判定=增量倒退 → 暂不接入（M3 不开启）**（独立复核逐位一致：test Spearman 0.1306、IoU@10=0.0、引擎/NN top-10 标签均值 37.570 vs 26.565）；**决定性口径缺陷**：训练/测试掩码块恒全 1（未见过缺槽队伍）而引擎常态 18/24 核为 5 员队 → z 值爆炸预测越界 → ③ 不可作判据（非否定非支持）；**M5 杠杆清单**：①变槽位支持 ②标签换强度分（现=需求契合度位次分，与胜率 rho=0.187）③降容量/强正则（诊断性 Ridge α=1000 val Sp 0.3004>交付 MLP 0.2249）④输出校准（偏置 −1.83）⑤扩数据（train 仅 1381）⑥特征裁维（12 组候选）
│   ├── nn_data\M2评测_重建报告.md / train_mlp_a.py / train_mlp_a_torch.py / eval_m2.py / ablate_m2.py ← ★**NN M2 口径修正重建（2026-10-09，主 Agent；红线=只动 nn_data\ 与 nn_data\nn_models\，未改 build_tool_*.py / HTML / 引擎快照）**：**① 掩码块恒 1 根因核实=旧语料级缺陷**（旧 train 仅 1381 行且全为 6 员满员队 → 掩码列方差 0 → z 爆炸越界）；当前 `features.py` 掩码由槽位真实占用计算、与 G1 非零槽位一致率 **1.0**（未写死）→ 新增 `assert_mask_nondegenerate()` 硬校验（掩码恒定/全 0/任 split 无缺槽/与 G1 不一致即 AssertionError，**PASS**）防复发；**② 标签饱和**由 M1 v1.1 meanMemberScore 解决，并经软/硬标签同阈值对照复现验证（v1 软=饱和 **0**，v1h 硬=饱和 **98/2416**）；**③ 按 §3.2 重训 MLP-A**（1184→256→128→1，BCE，AdamW 1e-3 warmup500→cosine 1e-4，wd 1e-4，batch 256，patience 10，按物种划分；**主实现 PyTorch 2.14.1+cpu**，另附 numpy 手写实现独立交叉校验，两实现 AUROC/Spearman/裁判一致到 0.01 内）；**④ 判据 1 达标**（T1 AUROC test **0.9160** ≥0.75）；**⑤ 判据 2 未达标**（IoU@10 **0.3688** micro / 0.3849 macro <0.5；差异样本 Δ(NN−引擎) **−0.1182** p=0.0056 **劣化**）→ **M2 里程碑未达标、§5 gate=不接入**；**天花板实验**（5 种标签口径 × 2 框架 + 全局池化 + 多种子集成）→ **IoU@10 上限 ≈0.47（numpy）/≈0.42（PyTorch），结构性低于 0.5**；**消融** 3 种子 ×12 组 **0/12** 达 0.01 阈值（单种子假信号 `G2a +0.0117 KEEP` 已撤销为 +0.0029 噪声）；**⑥ 换标签杠杆 v2（winrate 代理）验证有效**：裁判 Δ **+0.2248**（p=3.5e-20）、top-10 增量 +0.1836、胜率 Spearman **0.6025** / AUROC **0.7780** ⇒ **反转引擎序才能提升 top-K 质量**，与「IoU 不倒退」互斥；**⑦ 防泄漏量化**：test 行成员物种被 train 见过比例 **0.9972**（98.55% 全见过）、特征新异度 0.00048 → **test 指标偏乐观**，分层 Δ 仅 0.0089 且新异度中位数≈0（切不出「未见」样本）不作反证；**⑧ 模型**：`nn_models\mlp_a_{v1,v1h,v2}.pkl`（各 **1,355,817/819/837 B ≈1.36 MB**，336,385 参数，`version=mlp_a_m2_20261009`，`framework=pytorch 2.14.1+cpu`）+ `_numpy` 等价校验副本；**⑨ 划分偏离登记**：§3.2 写 80/10/10，实际沿用 M1 的 **0.70/0.10/0.20**（8467/1117/2416，为与 M1/S2/winrate 保持同一批行）；**⑩ 环境观测**：运行期 `nn_data\` 与根 `nn_models\` 出现另一条并行管线产物（pretrain/finetune/ONNX/M5 报告，00:22–00:31），本段未触碰；本段输入（X.npy/labels/split/winrate）时间戳 2026-10-08 22:15–23:55 未被改动；**⑪ 交付自检（机器校验，非目检）**：`_engine\_tmp\check_report_consistency.py` 从指标 JSON/磁盘模型重新导出报告全部关键数字并比对（**229 项 / 0 失败**，含消融表 12 组×6 格×2 实现逐单元格）+ `verifier-hub` 格式与占位符审计 PASS；自检另**发现并修复两处自身缺陷**：训练报告 JSON 的 `model_path` 旧名自引用（`_torch.pkl`；numpy 报告更误指主模型文件名）、numpy 副本缺 `config.framework`（已回填，权重/前向逐位一致，副本现 1,355,881/883/901 B）；并给 `train_mlp_a.py` 补 `--suffix` + **同名冲突预检**（原先裸跑会静默覆盖 PyTorch 主模型，属红线级隐患，已实测中止）
│   └── 研究资料\_probe_slots_v42.py / _probe_slots_v42b.py / _probe_slots_v42c.py / _check_07_v42.py ← ★v4.2 槽位探针（设置手槽候选空间量化，只读 gameData，天气/场地 9 系逐一计数）+ 07 交付自检（Σ槽位=6 / 引擎符号存在性 / 招式 id 锚点，全部通过）
│   └── 研究资料\_check_07_v43.py ← ★v4.3 07 交付自检（10 组 A~J：字数 / 骨架降级标注 / §4.5 需求规格 / §4.6 流派规格 / **引擎符号真实性 27 个 + 3 个已删符号防回归** / R07-01~36 / 伪代码括号配平 / 口径旧值 / 招式 id / **零硬门 C14**；**全部通过**）
│   └── 研究资料\probe_v4x_datalayer.py / _v4x数据层_探针输出_20261007.txt / _mvabi_worksheet.txt ← ★v4.x 数据层（D1~D5 + MATCHUP_SP）探针（**PASS 81 / FAIL 0**，8 节：新字段存在性 / 既有无回归 / D1 覆盖+抽样 / D2 sysSet+正则一致性+SYS_MAP / D3 家族 / D4 glossary+CSV列 / D5 模板 / **§8 MATCHUP_SP：结构+稀疏性+规模+独立重算 21×1906 全量比对+64 项抽样金标+Storming 4→2 机理**）+ 原始输出 + D1 翻译工作表（107+291 条 id↔英文 desc）
│   └── 研究资料\_v4x数据层_交付报告_20261007.md ← ★v4.x 数据层（D1~D5 + MATCHUP_SP）交付报告（契约表 / 翻译抽样中英对照 / FAMILY 校验输出 / GLOSSARY 40 条清单 / 新模板清单 / **§10 MATCHUP_SP：语义·规模·稀疏存储·抽样校验·引擎消费契约** / 无回归基线 / 端到端核验 / 未验证登记）
├── assets\                          ← ★精灵图资源（v3.15 新增，唯一被 HTML 依赖的外部目录）
│   ├── sprites\sp<id>.png           ← 1906 张正面普通精灵图（64×64 RGBA，5.17MB；sp1.png/2232.png…）
│   ├── build_sprites.py             ← ★精灵图生成器（gameData NAME → sp<id>.png，四层匹配，可重复运行）
│   ├── sprites_map.csv              ← 映射记录（id,name,NAME,sprite_file,layer）
│   └── sprites_report.md            ← 统计与缺失清单（缺失仅 SPECIES_NONE 占位）
├── tools\probe_abi_coldstart.py       ← 特性反查冷启动探针（零依赖，headless Chrome --virtual-time-budget + --dump-dom；断言 A 冷启动不得全 0 / B 冷启动态==toggle 后态逐卡一致 / C _hidN 自洽；--root 指任意快照目录做 before/after 对拍；exit 0=PASS）
├── 招式表_特性.csv                  ← ★特性中文新源（999 条 BOM；data.js↔gameData 反推，与网页同源；xlsm 已丢失）
├── 招式表_可学总表.csv              ← ★配招核心数据：112,580 行（宝可梦×招式×获得方式，含种族/特性/招式数值）
├── 招式表_招式数值.csv              ← 1,032 招全数值（中文/属性/分类/威力/命中/PP/先制/描述）
├── 招式表_宝可梦基础.csv            ← 1,906 只基础（种族/属性/特性/可学招式计数）
├── 道具表_完整.csv                  ← ★929 道具（英文名/中文官方译名/官方描述，描述源=官方仓库 item_descriptions.h）
├── 道具表_官方描述.csv              ← 解析中间产物（746 条官方描述）
├── ER-source\                       ← 权威数据源 + 源码参考
│   ├── gameDataV2.65beta.json       ← ★NextDex 官方 v2.65beta 数据(物种1907/特性1034/招式1032/道具929)
│   ├── item_zh_cn.json              ← ★v4.11 道具中文补译（762 条 id→官方简中译名，build_tool_data.py 解析链末位兜底合并，929/929 全覆盖）
│   ├── additionalV2.65beta.json     ← 附加数据(173B, 未细看)
│   ├── nextdex\                     ← ★NextDex 仓库稀疏克隆(load_save.js=官方存档解包器参考; moves.ts=图鉴解析器)
│   ├── src/data, include/constants  ← 官方仓库稀疏克隆(master 2024-04, 旧版仅参考)
│   └── *.h 参考文件(旧版)
├── ER2.65简汉化\
│   ├── ERv2.65-beta2-debug汉化版.sav ← 当前主存档（131088B）
│   ├── ERv2.65-beta2-debug汉化版.gba ← ROM（标题 POKEMON EMER / 码 BPEE）
│   ├── ER2.65beta版图鉴v0.3.xlsm     ← 汉化图鉴（仅特性表+属性克制 Sheet1；编号列=gameData id；**2026-10-10 已丢失，勿依赖**）
│   └── *_baseline_*.sav / *_after_candy.sav / *_after_stomp.sav ← 测试档（自动排除）
├── elite redux 2.5 debug.sav/.gba   ← ER2.5 旧版存档/ROM（结构同源，可交叉验证）
├── 特性.xlsx / 图鉴.xlsx / ER2.5正式版图鉴v0.5.xlsm ← 参考表（脚本不依赖；图鉴.xlsx 搬迁时丢失，勿依赖）
├── 存档解析v4_YYYYMMDD.csv/.json    ← ★解析器最新产物（431条，44列；特殊区按段内顺序标注）
```


**docs/ 文档地图（2026-11-08 评审，326 文件 / 36.54 MB）**：四类身份，别混着读——
① **活文档**（必读）：`战斗分析/01~07` 六篇 + `_编写规范` + `_99_交叉验证报告` + `_引擎升级规格_v1.0` + `_机制默认口径表` + `changelog/VERSIONS.md` + `research/`；
② **生成物**（**勿手改**，改了下一次重跑就没了）：`战斗分析/_00_资料汇编.md`；
③ **生成链**（**勿删**）：`研究资料/_00_skeleton.md`（模板，含 A/B/C/D/E/F 六占位符）+ 8 份 `_sec_*.md`（数据分节）+ `_assemble_00.py`（拼装）+ `_build_secs.py`（从 data.js/gameData 实读生成分节）+ `_erd_slim.json`；
④ **过程档案**（追溯才查，非必读）：`_v49/_v4x/_v410/_v411/_v412` 交付报告 + `changelog/STATE_snapshot_v4.55_v4.82.md` + `_验证证据/`（32 MB 截图与脚本副本）。
**实测：完全重复仅 3 组 / 0.01 MB，无可安全删除的冗余**；《_00_资料汇编》跑 `_assemble_00.py` 重生成与现有文件 sha256 一致（未手改）。详见 `docs/research/文档评审_20261108.md`。
⚠️ **写进 `_00_skeleton.md` 的文本不得含 `{{X}}` 字面** —— 拼装脚本会把任何 `{{A}}`/`{{B1}}` 当占位符替换（本轮踩过：警告文案里写 `{{A}}`，产物从 80,517 B 胀到 96,503 B）。

## 3. 存档格式核心结论（v4.1 实证修订版，三档互证+10 截图+2 换招实验）

- **物理段轮换**：0x20 物理段 × 0x1000B；每段页脚 `+0xFF4` 逻辑段ID、`+0xFF8` magic `25 20 01 08`。
  逻辑段ID = (物理段号 + K) mod 20，K 随保存变化（实测 4/5/6/10/12）。**禁止硬编码物理偏移**。
- **固定逻辑布局**：逻辑段2+0x23C=队伍(6×76B)；段8+0x08=箱子1-7网格(52B×30)；段12+0x340=特殊区A(6条)；
  段14+0xE00=特殊区B(9条)；段15+0x424=箱子20-26网格；段0=散落。**队伍76B 与 盒子52B 前 52B 同布局**（+0x30 起分叉）。
- **记录结构（队伍 76B / 盒子 52B 通用，实证+NextDex load_save.js 位语义，v4.2 定稿）**：
  - +0x00..0x03 **OTID**(4B, 全档 80 19 47 64) | +0x04..0x05 **招式1 id(&0x7FF)** | +0x06..0x07 **EXP>>5(u16)**
  - +0x08..0x09 **招式2 id(&0x7FF) + 招式3 id%32(高5位)** | +0x0A..0x0B **招式3 id>>5(低6位&0x3F) + friendship(bit6-9低4位) + event/alpha(高位)**
  - +0x0C..0x0D 物种=gameData id(u16) | +0x0E..0x0F **招式4/末招 id(&0x7FF) + 标志(高5位)**
  - +0x10..0x11 = word8 低16位：**道具 id(&0x3FF, bit0-9) + 性格(bit10-14, natureT id) + isEgg(bit15)**
  - +0x12..0x13 = word8 高16位：**语言(3) + 出生等级(7) + 闪光(2) + maxShiny(2) + 特性选中项(bit14-15, abis 索引)**
  - +0x14..0x19 **EV u8×6(HP/攻/防/速/特攻/特防)** | +0x1B D5 固定 | +0x1C D6 | +0x1D..0x21 FF×5
  - +0x22..0x2E **nickname 区**（实证非性格/个体；个体=0 口径不变）| +0x2F 单字节
  - 队伍附加：+0x30..0x33 **PP×4(当前值)** | +0x34..0x37 00×4 | +0x38 等级(byte, 0x64=100)
    | +0x39 FF | +0x3A..0x47 **能力 7×u16 = (当前HP, 最大HP, 攻, 防, 速, 特攻, 特防)** | +0x48..0x4B u32(下条 personality)
  - 盒子 52B：+0x30..0x33 槽属性(非PP)；无能力区（公式基准+性格修正 v4.2 并入）
- **招式 4 槽完整解码（换招实验铁证：坚果铁壁→陀螺球、雷电云伏特替换→十万伏特）**：
  - 招式1 = `+0x04 & 0x7FF`（105=自我再生、887=闪电猛冲等全命中）
  - 招式2 = `+0x08 & 0x7FF`（182=守住、951=神秘之舞、56=水炮全命中）
  - 招式3 = `((+0x0A & 0x3F) << 5) | (+0x08 >> 11)`（8/8 真值命中：616/334/360/56/521/85/355/794）
    - 语义：+0x08 高5位 = 招式3 id mod 32；+0x0A 低6位 = 招式3 id>>5（**掩码 0x3F 支持 id≥1024**，v4.2 修正）
  - 招式4(末招) = `+0x0E & 0x7FF`（895=毒千针、981=极速摇摆、596=尖刺防守全命中）
  - **存档招式 id = gameData moves id（官方序）**；汉化名注意：794=Tectonic Fangs=砂之牙、770=Draconic Fangs=龙之牙、980=Esper Waltz=超能华尔兹、982=Hex Trot=巫术疾走
- **道具 = `+0x10..0x11 & 0x3FF`**（items id，0=无；9 只真值全对：305 黑色污泥/312 凸凸头盔/273 剩饭/298 湿润岩石/0 无/79 文柚果/0 无/285 讲究围巾；**掩码 0x3FF 支持 id≥512**，v4.2 修正）
- **性格直读（v4.2，load_save.js word8 bit10-14）**：`nature = (+0x10 >> 10) & 0x1F` → natureT[nature]（实档 25 种全出现；土王/护城龙=8=淘气 ✓，鳃鱼龙=3=固执 +攻 与物理鳃咬吻合）。
  盒子能力公式并入性格修正（护城龙 防 137×1.1=**150 精确命中游戏实际值**，原 ±10% 偏差消除）。
- **能力值**：队伍 +0x3A..0x47 **7 项直读（含特防，不再公式重建）**；盒子公式基准+性格修正（IV=0 口径）。
  Slow 组 Lv=round((EXP/1.25)^(1/3))，EXP=u16<<5，Lv100↔1,249,984。
- **个体值机制（2026-10-06 用户澄清+公式实证）**：ER 个体默认满值、可用道具改成 0，**但能力公式无个体项**——
  公式 IV=0 口径与全部真值吻合（护城龙 Lv36 盒子 4/6 项全等、差项恰为性格 ±10%；队伍 6 只 Lv100 直读/公式
  全在 0.89~1.10 性格修正区间；IV=31 口径全部失配 0.59~0.99）。**个体不影响能力计算**，解析器 IV=0 正确。
- **特性体系（v4.2 直读选中项）**：游戏特性页 4 项 = **当前生效特性（abis[选中项]）+ inns[0..2]（3 个固定天性）**。
  `abilityNum = (+0x12 >> 14) & 0x3` → abis[abilityNum]（load_save.js word8 bit30-31；实档 6/6 命中：
  土王0=奇迹皮肤/坚果1=粗糙皮肤/Storming2=引水/雷电云1=过载/洛奇亚2=暴风雨/鳃鱼龙1=悠游自如；覆盖原 abis[0] 假设）。
  inns = 固定 3 天性。abis/inns id = gameData id。
- **游戏内验证样本**（用户截图真值）：土王Mega=Clodsire Mega(id 2232) 能力 402/402/326/282/55/175/257、
  特性页 奇迹皮肤/毒沼制造者/储水/毒刺 = abis[0]147 + inns 834/11/840、道具黑色污泥(305)、PP 5/10/10/15、
  4招 自我再生/守住/大地神力/毒千针(105/182/616/895)；护城龙= Bastiodon(411) 4招 守住/十万马力/铁头/尖刺防守
  (182/630/442/596)、道具凸凸头盔(312)；花舞鸟 4招 超能华尔兹/火之舞/巫术疾走/极速摇摆(980/552/982/981)。
- **权威数据源**：`gameDataV2.65beta.json`（NextDex 官方 forwardfeed/ER-nextdex，raw URL 见 Skill）；
  物种 id = 存档物种字段 = 图鉴编号列（三者一致）。NextDex 仓库 `static/js/load_save.js` 为标准绿宝石
  盒子解包器（ER 改版布局不同，仅参照位语义）；`src/moves.ts` 为图鉴解析器。
  中文名：**物种/招式 取自根目录 `招式表_宝可梦基础.csv`/`招式表_招式数值.csv`（与 build_tool_data.py 网页数据同源；
  图鉴.xlsx 搬迁丢失后不再依赖 xlsm 物种/招式表）**；特性取自 xlsm 特性表（v0.3 1030 条），
  xlsm 未收录的补 ABI_ZH_EXTRA（如 834=毒沼制造者）。v0.3/v0.5 xlsm 实测均只有「特性」表+克制矩阵，无物种/招式中文表。

## 4. 锚点表（解析器自检）

护城龙#411=BOX1槽1 | 远古巨蜓#469=BOX4槽1 | 花舞鸟#741=BOX20槽1 |
超级化石翼龙#1513=BOX26槽28 | 超级土王#2232=队伍首条。（v4 全过）

## 5. 使用方式

```bash
cd "D:\game\elite-redux"
python parse_er_save_v4.py                       # 自动发现主存档+权威数据+图鉴
python parse_er_save_v4.py <sav> [out.csv] [out.json]
```

输出：CSV(utf-8-sig, 53列) + JSON(summary+records)。特殊区（SA/SB）默认按**代码段内顺序**标注
（特殊区A 第1-6条 / 特殊区B 第1-9条，箱号归属用户已认可重要性低；`box_override.json` 可人工指定箱号，可选）。
依赖：gameDataV2.65beta.json（ER-source\ 下）；中文源=根目录招式表 CSV（物种/招式/**特性** `招式表_特性.csv`，xlsm 已丢失不再依赖），缺失时回退英文。

## 6. 当前状态（2026-11-07，v4.185）

- **版本**：`index.html` = v4.183（`ER_ENGINE_VER`，2026-11-07），已部署到 gh-pages 且与线上逐字节一致（基线见 §8）。
- **分支收敛（2026-11-07）**：`master` 与 `audit-20261107` 自分叉点 `dbc3f54`（v4.159）合并为 `3d3cf0c`，**master 自此为唯一主战场**；`release/v4.181` 固定该版本供回溯。旧链 5 个提交（`a324503`…`c1746b6`）完整保留在 `master-legacy-20261107`，未删除任何内容。
- **数据**：`data_*_v498.js` 三个分片是页面唯一数据源（lite 380 KB → species 1.36 MB → adv 576 KB，合计 2.32 MB）。`data.js` 已于 2026-11-07 退役归档至 `archive/`。
- **生成器**：`build_tool_html.py` 已退役（停在 v4.136，v4.137–v4.179 共 43 版无脚本源），误跑会因 `ER_BUILD_FORCE_SYNC` 守卫 SKIP 而非覆盖。
- **护栏**：`node tools/smoke.js` 26 项静态断言（数据完整性 / split 枚举 / 部署白名单 / 生成器退役 / data.js 退役 / 关键修复存在性 / 代码健康基线）。
- **2026-11-07 评估轮修复**：① `dmgCalc` 补 `hitsDef` 分支 + `splitLabel` 7 值 —— 精神冲击 / 精神击破 / 神秘之剑 / 魔法叶 4 招原先按特防结算，现按物防（31-37 → 48-57 等）；② 存档 0 记录改报错终止；③ 部署白名单 3→5 项（原白名单缺 3 个线上现役分片，下次部署会让线上 404）；④ 曾删 29 个零引用函数，复核后按「清理冗余不删功能」口径**全部恢复**（它们在 v4.179 里本就没被调用，但含 v4.101 队检告警 / 战斗概率 / Smogon 先验等历史功能组）；⑤ 首屏遮罩 / 触屏 44px 热区 / `window.__ER_ERRORS` 错误观测。
- **v4.182 特性反查持有者全 0（P0，用户实测「关掉再打开就正常」）**：`data_lite_v498.js` 不含 species（实测 `lite_species=none`），species 在 load 后 800ms 才由 `__erStartLate()` 异步到达；而 `renderAbi()` 在页面初始化 IIFE（L5316）立即执行，此刻 `ERDATA.species` 为空 → `abiOwners()` 走 L5336 提前 `return {}` ⇒ 每卡「天性 0 / 可选 0」。`er-ready` 的 7 个监听点（MV 表 / switchTab / renderSp / erRestoreAtkSel / sets 预取 / renderDmgQuickChips / _initCoreList）**没有一个是反查页** ⇒ 数据到了也不刷新，只能靠手动拨开关触发 `abiFilterToggle()`。修复：`__erReady` 为真则立即渲染，否则挂 `er-ready` 再渲染。probe18 实测 T+400ms 无卡 → T+1200ms 自动出 60 卡、首卡「可选 2 / 天性 3」。**教训：任何「懒构建索引 + 页面初始化即渲染」的列表，都必须确认数据分片到达后有重渲入口。**
- **v4.183 战术模板队伍卡被压扁（UI 可用性，用户截图「完全看不到」）**：卡片类是 `mxc tap44`，而 `.mxc{width:76px}` 写在 L278、`.tap44{display:inline-flex; align-items:center}` 写在 L438 —— **后定义同特异性规则覆盖 display**，卡片变成横向 flex（无 flex-direction 即 row），精灵图/名字/分数/命中/入队 4 个块被塞进 76px 一行，flex-shrink 把每项压到单字宽，视觉上只剩竖排碎字。修复：新增高特异性 `.mxc.tap44`（0,2,0）显式 `flex-direction:column` 并放宽到 `min-width:118px`。实测 probe20 修复前 `dir:row/76x98` → 修复后 `dir:column/118x110`，probe21 视觉截图 1440 六卡一行、375 折两行且名字零截断。**教训：①给组件加「通用热区/触控类」（tap44 这类）时，它自带的 display 会覆盖组件自身的 display，必须用更高特异性把布局属性钉回去；②页面视觉畸形先量 computedStyle（display/flex-direction），不要先怀疑数据。**
- **v4.183 页头版本号脱节**：页头副标题「引擎 v4.179」是**手写死文本**（原 L777），真相源 `ER_ENGINE_VER` 早已 v4.182 —— 用户看到的版本长期落后，无法判断自己是否用上最新版。现改为 `<b id="erVerNo">` 由 `ER_ENGINE_VER` 回填。**教训：任何对用户可见的版本文本都不得硬编码，必须从唯一真相源渲染；升版只改 `ER_ENGINE_VER` 一处。**
- **C:\temp 临时工作区抢救与清理（2026-11-07，B 类 121 个 `er-*` 目录 / 2.39 GB）**：先抢救后删除。**抢救成果** = `docs/research/B类目录内容抢救合辑_20261107.md`（120.5 KB）：按机制分九章（伤害引擎与对拍 / 配速与 EV / 六队分析器与队伍联动 / 特性语义与筛选开关 / 工具挖掘 v500~v518 / UI 与可访问性 / 存档与拆包 / 版本演进时间线 72 行 + 20 条未决 / 勘遗），另有 121 目录全量映射表、判废清单、删前执行口径。验收：来源 165 组「目录/文件」引用全可回溯、落地状态标 44【已实现】/9【未实现（仅设计）】/3【状态未知】、乱码与占位符 0。**实际删除 120 个、保守留 `er-deploy-dryrun`**（部署 `-DryRun` 依赖它），0 失败。三条长期结论已归档：①**生成器冻结在 v4.98 而产物已到 v4.183**——在生成器里查不到 ≠ 功能没实现，判定实现状态只能查 `index.html`；②**NN 组队 v2 仍是 `analyzerVNN(){return null}` 存根**（只有设计）；③`fillTeamStabSel`（队伍 STAB→进攻面按钮）已于 **v4.184 落地**；`renderSavSlots` 分页器经 v4.184 实测确认**不需要实现**（`renderSavSlots()` 早在产物 L4958–4972 实现并工作：档位 chips / 改名 / 两档对比 / 加载高亮，且 `er_savs_v1` FIFO 硬限 3 档 → 分页器无意义），原「未落地」结论已就地更正。
- **本地入口双源漂移事故（2026-11-07，v4.183 补丁，产物 `index.html` 零改动）**：README 教用户「双击 `配招助手_ER.html` 本地运行」，而该文件是 **v4.98 旧产物副本**（1,448,248 B），其加载器依赖已在 v4.98 退役的 `data.js`——仓库根已无此文件、CDN 兜底指向的也是它，实测本地双击直接落到「数据加载失败」（console `Error: ERDATA missing`，`failText:true`，bodyLen=55）。根因：v4.98 拆包时 `index.html` 改指三分片，**第二副本没跟着改**；而 `tools/smoke.js` 的「data.js 已退役」断言只读 `index.html`，漏检第二副本。修法：`配招助手_ER.html` 收敛为 **1.7 KB 兼容入口**（`meta refresh` → `index.html`），彻底消除双源；README 的「本地运行」与「技术架构」同步改为 `index.html` + 三分片；smoke 新增第 27 项断言（入口页 ≤10 KB、必须跳转、不得引用 `data.js`）。教训：**同一产物只要存在第二份拷贝，就一定有漂移**——能用入口页就不复制产物；门禁断言必须覆盖所有对外入口，而不只是主产物。验证：file:// 双击入口页 → 自动跳 `index.html` → `ready:true / 1906 物种 / 1032 招式 / v4.183 / 9 Tab / 0 报错`；smoke **27/27**。
- **v4.184 队伍 STAB → 进攻面（2026-11-07）**：补上合辑确认「只有设计、未落地」的 `fillTeamStabSel`（设计档案 `stabsync-proposal-v4180`，此前产物 **0 命中**）。属性克制 Tab「进攻视角」标题下新增「📋 队伍 STAB → 进攻面」按钮（`#atkStabBtn`，标准 `.btn-mini`）。口径：遍历 `team` 每只 `t1`/`t2` 并集去重（排除 `ATK_SPECIAL` 的 星晶/无/神秘）cap 6 → **覆盖式**写入 `#atkChips` 的 `on` → `erSaveAtkSel()` → `renderAtk()`；**不自动跟随**（改队后本次选择保留）；**再点一次**用内存快照 `prevSel` 还原并退出激活态；空队返回 `'empty'` 并提示去队伍构建加人，不误报。验证：probe23（headless CDP，file:// 双击）**13/13**；smoke **27/27**；1440 与 375 双宽度零横向溢出（`1427/1427`、`375/375`），375 宽按钮热区 150×44。产物 `index.html` 1,551,639 B / sha1 `F982C63A…` / `ER_ENGINE_VER='v4.184'`。
- **v4.185 队伍边际评估（2026-11-07）**：用户问「NN 组队雏形要不要启用」。结论是不启用 —— `analyzerVNN` 只是 `return null` 存根、无调用方，产物里 `mlp`/`sigmoid`/`softmax`/`trainNN` **0 命中**，单机工具没有对局数据源，用人工评分函数当标签训练等于蒸馏自身。改为确定性六维边际评估（无解系 5 / 4 倍系 5 / 共弱 3 / 进攻盲区 2 / 速度线 2 / 属性重复 1），未满队算 1906 只净改善 Top5、满队算换人枚举，每条给「得 / 失」理由并可一键应用。实测 4 只队 177 ms、满 6 只 64 ms（线上）。自写 bug 两处已修：`indexOf(x)<-1` 恒假（候选池全空，同类 6 处）、`team[i].id` 是字符串而 `onclick` 传数字（`===` 必失败 → 改 `String()` 归一）。详见 `VERSIONS.md` v4.185 章。
- **C:\temp 顶层逐项判定与清理（2026-11-07，1023 项 / 999.6 MB → 3 项 / 62.8 MB）**：前两轮只遍历 `er-*` **目录**，`er-*.html`/`er-online-*` 这类 **419 个文件（88.9 MB）从未进入清理范围**，实际清点 1023 项。判定口径三条（可复原 / 可重建 / 无独有内容），逐行落在 `docs/research/temp顶层逐项判定_20261107.csv`。执行：**attempted=1022 / failed=0 / 释放 936.8 MB**，只剩 `ghpages-leak-backup-20261107`（51.7 MB 回滚安全网）+ `er-deploy-dryrun`（部署 DryRun 依赖）+ `elite-redux-v411-prototype` 本体（0.4 MB）。两个「看起来很大」的目录真相：`elite-redux-v411-prototype` 500.7 MB 里 **99.9% 是 Chrome 渲染缓存**（`_shots` 5711 文件仅 12 张 png、`_v411test` 是 8 套 CDP profile），真材料只有 `v411_prototype.html` + `SELFCHECK.md` + `_harness`；`v449_det` 是 v4.49 构建确定性三次对拍，其 `nn_data` 与仓库 `nn_data/` **8 文件 hash 全同**，删之无损。
- **发现：`nn_data/` 未入库（13.55 MB，风险未闭环）**：`.gitignore:26 nn_data/` 让它不在任何提交里，而 `restore_nn_axis.py` 文件头自己记着「nn_data/ 目录丢失（.gitignore 忽略，无法 git 恢复）」——**已经丢过一次**。内容为 Smogon 官方月度统计（`chaos/raw` Gen3 OU 213 species 1.89 MB + Gen9 National Dex 738 species 11.65 MB）+ 派生先验（`smogon_prior` / `_oracle_usagePrior`）+ 轴库 `axis_lib` + 机制库 `mech_lib_v412`。`axis_lib` 有脚本可重建，**`chaos/raw` 两份原始统计无法重建**（依赖 smogon.com 历史月份仍在线）。清理时那份同源副本已随 `v449_det` 删除，**现在全机只剩仓库根这一份**。**已于同日打包入库**：`nn_data_v2026-09.tar.gz`（4,367,341 B / 4.17 MB，sha256 `49207CBC4DAC44289164D431FE3DB286AB9D987A65CC246337C44B3F8804777D`，压缩率 69%），解压往返实测 8/8 sha256 一致；`tools/smoke.js` 新增第 31 项硬门禁「备份包在位」（不存在或 <3 MB 即 FAIL，防截断防误删）。还原与更新方式见 `docs/research/nn_data备份说明_20261107.md`。
- **NN 结论修正（口径更准，不是推翻）**：v4.185 章写的是「无对局数据源」。核实后更精确：**有使用率先验**（Smogon chaos 的 usage/moves/items/abilities/teammates，且代码已在用 `smogonPriorOf` / `smogonMoveBonus` / `smogonMateIds`），**缺胜负标签**（chaos 里没有 winrate，注释提到的 `dataset_engine_v0_winrate.jsonl` 全盘搜不到、从未存在）。所以「对手会带什么」能做且已做，「这支队多强」做不了 —— 与 v4.185 的结论一致。
- **docs 评审（2026-11-08）**：用户提「文档肯定也有冗余，要具体深入内容判断」。实测 326 文件 / 36.54 MB，**完全重复仅 3 组 0.01 MB**，没有可安全删除的冗余；真正的问题是 83 份 md 没有地图。评审中差点误删 `_sec_*.md`（8 份）与 `_00_skeleton.md`，核实后发现它们是 `_00_资料汇编.md` 的**生成源**（`_build_secs.py` 生成分节 → `_assemble_00.py` 拼装模板），删了构建链就断。实际修的是产物缺「生成物」标记：改模板加警告 + 重跑（顺手踩了 `{{A}}` 被当占位符替换的坑，产物一度胀到 96,503 B，已修回 80,938 B）。另清掉 `.gitignore` 末行孤立「顺风」；核实 `ghpages-backup-20261107` **远端早已存在**（本地=远端=80e14f8），旧记录「仅本地未推」作废。
- **存档资产（不入库，`.gitignore:3 *.sav`）**：共 2 份，各 131,088 B，**内容不同** ——
  `D:\mGBA-0.10.2-win64\ROM\elite redux\elite redux 2.5 debug.sav`（sha256 `C99CDDED…`，2026-01-01）；
  `D:\mGBA-0.10.2-win64\ROM\elite redux\ER2.65简汉化\ERv2.65-beta2-debug汉化版.sav`（`F4D29E4A…`，2026-10-06）。
  本地第二份在 `archive/saves/`（同样被 `*.sav` 忽略）。**风险：存档只在本地同一块硬盘，无异地备份 —— 硬盘故障或误删即永久丢失，且 git 历史里从未有过存档，无法恢复。**
- **已知风险**：CDN 兜底依赖 jsDelivr，大陆实测三个分片全部 25 s 超时 —— 可靠性靠部署前断言，不要指望线上拉 CDN 救命。
## 7. 项目准则

- 内容数据（图鉴ID/物种/种族/特性/招式/道具）以 gameDataV2.65beta.json 为权威（NextDex 官方源）；
  中文名以根目录招式表 CSV 为准（物种/招式/特性三表，与 build_tool_data.py 网页数据同源；特性表由 data.js↔gameData 反推，
  xlsm 已丢失勿再依赖），表未收录时补 ABI_ZH_EXTRA / 回退英文。
- 新增字段/机制：先设计→对齐→实施→用三个轮换档回归测试→更新本文档与 Skill references。
- 测试档（_baseline/_after_candy/_after_stomp）保留，勿删；解析器自动排除。
- 官方 GitHub 仓库 master(2024-04) 太旧无 v2.65 高编号物种，仅作参考；权威数据一律走 NextDex gameData。
- **README 是对外重要介绍，每次版本迭代须同步更新**（功能清单/快速开始/更新记录/数据源版权）；仓库主页靠 README 呈现，缺它 GitHub 显示占位简介。
- **长时任务纪律（2026-10-14 卡死 10h 教训，登记防再犯）**：任何浏览器/CDP/长时探针步骤必须带硬超时（单步 ≤60s）与看门狗（长任务无输出 >12min 杀掉重试一次，严禁无限等待）；chrome-devtools MCP 偶发挂死属已知环境项——退化路径：产物文件哈希等价 + headless CLI（`--headless=new --user-data-dir=<临时> --dump-dom`）+ 本地真实浏览器验证（历轮已多次登记同款，v4.40/v4.41 均有先例）；组织者发现子代理挂起于永不返回的调用时，**终止并重建该子代理优先于反复唤醒**（本次：子代理等 headless Chrome/CDP 调用 10h 不回、组织者 trajectory 零写入且唤醒无效）；**关键结论先落盘再汇报**——本次全部验证证据（探针 35/35、8tab 扫描、子区裁定）已落盘故可无损继承，未落盘的「E1 设计书报告」只能按产物重建。
- **防卡死体系（2026-10-17 建，主代理强制准则；含 legacy-route 故障整晚卡死教训）**——三层四段，组织者每轮派发子代理时原文附上：
  - **卡死事件库（根因归纳）**：E1 主机级负载卡死（构建进程残留占满 CPU，v4.52 C5c 后 60min 无响应需重启主机）；E2 **legacy-route 工具路由故障**（本地执行工具全拒、非执行工具正常；子代理层 101min/2h+/整晚多次、MainAgent 侧 35min；有 25-35min 窗口模式但**不能依赖窗口**）；E3 无看门狗（卡死子代理上报 parent 后无人巡检处理 → 部署链整晚静默，用户次日发现）；E4 **组织者/子代理执行通道「环境未就绪」故障**（幂等间歇：v4.58 C6 阻塞 30min、v4.59 黑盒 4 实例连续阻塞；子代理层执行工具全拒、组织者侧可能正常）→ 应对=立即 kill 重派新会话路由，仍失败 → **MainAgent 按 §7 E4 接管执行**（v4.58 已固化先例：MainAgent 侧完成 C6 改码+部署+登记全链），受影响的测评/黑盒如实登记「环境恢复后补跑」，不静默不硬造。v4.86 案例（2026-10-23）：新派实例 5 连挂 40+ 分钟（冒烟×2/P0/引擎/黑盒）、组织者侧与既有存活实例正常 → **降级=主代理直验 P0 + 既有 IDLE_RESUMABLE 实施实例代验引擎 N2/黑盒真机**（独立性如实标注，§6 v4.86 轮登记）；**新派实例连挂时立即停止空派**（避免浪费轮次），优先复用既有存活实例承接并主代理直验兜底。
  - **L0 负载闸门**：重负载（构建/全量探针/双构建/部署）前必查 `Get-CimInstance Win32_Processor | Select LoadPercentage` 与残留构建进程（`Get-CimInstance Win32_Process | Where { $_.CommandLine -match 'build_tool_html' }`）；CPU>85% 或有残留构建进程 → **禁止启动新构建**，先杀残再动；全局构建互斥：构建锁 `C:\temp\er-build.lock`（含 PID），锁存在且进程活着即拒绝并发构建。
  - **L1 执行纪律**：构建前台同步 + 硬超时（单命令 ≤300s，超时 TaskStop + 杀 python 构建进程 + 立即上报）；**禁 run_in_background 静默轮询**（必须后台时 TaskOutput 每 60s 轮询 + 总超时 ≤20min + 超时杀进程）；每次构建记录时间戳/exit/产物哈希 → `C:\temp\er-build-log.txt`（事后可审计卡死点）。
  - **L2 看门狗（核心）**：组织者每 15min 巡检全部存活子代理（peek/消息探活）；连续 3 次巡检（45min）无进度推进（summary 版本号不变/无新输出）→ 判卡死；**legacy-route 故障 → 立即 kill 该子代理 + 重派（新会话路由重置），禁止等窗口**（101min/整晚两次教训）；主机级无响应 → 查负载 → 杀残留 python 构建进程 → 仍不行上报 MainAgent（由 MainAgent 决定是否请用户重启，杀进程优先于重启）；静默等待（上报后无动作）→ kill 重派或直接接管。**MainAgent 收到组织者故障上报当轮处理，不留过夜**；夜间长任务组织者每 30min 里程碑回报。
  - **L3 恢复自动化**：新子代理首步**通道自检**（PowerShell Get-Date + Read 各一次，失败立即换代理，不静默等待）；卡死自动诊断快照（CPU/内存/进程 top5/python 构建进程列表）→ `C:\temp\er-hang-diag-<ts>.txt`；构建前自动清理残留（按 CommandLine 精确匹配 `build_tool_html`，不误杀用户其他 python）。
  - **L4 上报契约**：子代理遇超时/路由错误/负载异常 → **立即上报不静默**；组织者收到上报 15min 内处理（kill/重派/接管/上报 MainAgent）；关键结论先落盘再汇报（可无损继承，杜绝"卡死即丢"）。
- **纯黑盒可用性测试方法论（2026-10-22 v4.83 轮沉淀）**：①判据两层面=「流派本身在环境中的合理性」vs「推荐细节错误（道具/特性/EV 自洽性）」，流派存在性讨论不混入 bug 分级，「推荐道具矛盾/流派单一」按 P2 级候选；②**汇总评级=可用性（底线）30%+效果 30%+视觉体验一致性 40%**（视觉美观度=配色和谐/色彩语义（红=警示/蓝=信息/绿=正面）/字体层级/卡片与区块质感/图标装饰/布局平衡；一致性=组件跨页面同款同风格/间距节奏/术语统一/颜色语义跨页一致/交互模式（点击+悬浮双模式全局统一）/Tab 间视觉语言；用户体验=信息密度/首屏聚焦/滚动负担/空态加载态设计/操作反馈/清爽优雅/规范逐项），每模块输出「视觉亮点+视觉问题清单（按页面 Tab 定位）+一致性违例清单」，评级直接支撑下一轮方向决策（不能只列 Bug）；③**溢出检查必须覆盖表格/tab 条等内部容器**（v4.83 先例：速度线 794px 表未被 scrollW 主容器检查抓到）；④UI 反馈完备性入判据（入队/导出/空态/加载态无明确反馈即 P2）；⑤console error/network 4xx/5xx/资源加载失败=纯黑盒边界内唯一白盒观测项，禁读脚本/断点/源码；⑥新派子代理先最小冒烟验证执行通道再派正式任务（v4.83 6 实例「环境未就绪」先例，见本 §7 E4）。
- **视觉语义统一经验（2026-10-23 v4.84 轮沉淀）**：①**红色三级语义分层**=阻断/错误（`--bad` 深红实心，负面状态标签 .mtag.sta）｜警示/失败（`--warnred:#c62828` + ⚠/✗ 图标，速度塌陷/建议补/诊断失败三处统一变量）｜数据高亮（浅红底 #ffcdd2/#fce4ec + 深红字 #b71c1c，联防热力/弱点 badge，无图标非错误）——**警示红与数据高亮红必须可辨**（用户 P2-6 登记项）；②**搜索命中/当前选中等信息态一律蓝（--acc）**，不用红（.poolrow.hit 黄底红字→浅蓝底 var(--acc) 先例）；③**条形图色板分工**=速度类蓝系（定位时序感，分布条渐变/结构卡蓝条+分位徽章四档）+多物种对比 6 色（六维图 PAL 每只一色跨只区分）——同语义同色、不同语义可区分，图例注明色板语义（用户 P2-4 定案）；④**术语口径统一**「种族值（总值 N）」（跨页面同一概念同一命名，详情卡 h3 为基准，P2-5 先例）；⑤**Redux 形态家族补充守卫**=自身已带 mega/prim/form 记录即跳过标准族归并（防标准 Mega 双区重复，P1-3 先例），无形态记录才归并标准族（暴鲤龙R→Mega X/Y v4.13d 意图）；⑥详情卡按钮类 CTA **不得嵌 h2 标题行**（「标题含按钮文字但内容未切换」误导态先例，P1-1），独立 CTA+统一入口函数（gotoCoreFromSp 带 try-catch 兜底）。
- **Redux 归并设计废弃（2026-10-23 v4.85 轮沉淀）**：v4.13d 起把标准族 Mega 归并给无 Mega 的 Redux 形态（暴鲤龙R#2675 被挂标准超级暴鲤龙X/Y）造成跨区同名重复；v4.84 P1-3 仅加 `_own` 守卫（自身有形态记录即跳过补充）未根除无记录者的归并，v4.85 整段删除该 `pendFor` 归并分支。**经验：跨区形态引用须以 gameData evolutions 真实数据为准，Redux 形态区只显示自己 FG 的 mega/prim/form，禁止从标准族补充**（无 Mega 的 Redux 形态即不显示 Mega，不靠标准族补全；v4.13d 归并设计自此废弃）。
- **测试方法论教训——真实浏览器渲染后视觉/布局测量必做（2026-10-23 v4.85 轮，用户点名批评）**：v4.84 三线验收只看 DOM 结构与文本、未做真实浏览器渲染后视觉/布局测量，导致 sprEl 缺 `>` 的 flex 挤压视觉崩坏（全站精灵图宽 0、卡片精灵名截断）测不出来——**静态 DOM「元素在、文本对」≠视觉正常**。**v4.85 起验收必须含真实浏览器渲染后**：①精灵图可见性测量（`.spsp` offsetWidth>0、64×64 实际渲染像素非 0）；②卡片布局测量（`.nm` 父级宽度/文本换行/名字不截断）；③375px 无横向溢出——**静态 DOM 核验不算数**。附 sprEl 根因：v4.84 P1-2 改造时把 `(st?' style="'+st+'"':'')` 误写为缺 `>`（正确=`(st?' style="'+st+'">':'')`），style 未闭合吞掉后续 DOM 触发 flex 挤压，一行修复。

## 8. GitHub 部署（2026-10-08 起）

- **仓库**：`github.com/wsjshy/elite-redux-teambuilder`（公开）；远程名 `github`。**当前本机无 git 代理**（2026-11-07 实测 `http.proxy` 为空，fetch/push 均直连成功）；若出现「push TLS 握手失败但 curl 直连正常」，那是残留死代理，先 `git config --get http.proxy` 查，再用 `git -c http.proxy= push` 绕过。
- **分支策略（2026-11-07 用户定调，长期有效）**：**`master` 是唯一主战场**——所有开发、修复、文档更新都在 master 上提交，不再另开长期工作分支。**每次上库前必须先用分支固定当前状态**：`git branch release/<版本号> <commit>` 并随同 push（首个：`release/v4.181` → `3d3cf0c`）。固定分支**只读**，不再往里提交，用于回答「线上当时到底是哪份代码」。部署仍从 master 取产物，不直接从固定分支部署。
- **分支约定（防混淆）**：`master`=开发分支（源码+docs+数据 json）；`gh-pages`=部署分支（**仅** 23 项：`index.html` + `README.md` + 三片 `data_*_v498.js` + `assets/` 14 项 + `.nojekyll` + `ER-source` 三 json）。**data.js 已于 v4.179 数据源合一退役，不得回归**。部署清单与 `tools\deploy_er.ps1` 的 `$ExpectedFiles` 逐项一致。
- **一键部署（2026-11-07 重写，默认零删除）**：`tools\deploy_er.ps1` 默认**增量**——只覆盖那 23 项，线上其余文件一律保留；`-DryRun` 只暂存+断言+打印清单不推送；`-Clean` 才清空重建（执行前打印将删除的条目数）。关键前提：脚本先 `fetch github` 再 `checkout -B gh-pages github/gh-pages` **强制对齐远端 tip**——本地 `gh-pages` 曾落后远端 118 个提交（树里只有 19 个文件），不对齐则「增量」照样会删掉线上 116 个文件。推送改为普通 `push`（对齐后必然 fast-forward），被拒即中止，**不再 `--force`**。
- **禁止 `git add --all`（2026-11-07 真实事故，必读）**：切到 gh-pages 后工作区仍残留 audit 分支的**未跟踪文件**（Excel 图鉴、`nn_data/` 训练集、版本快照、`__wtest*.tmp`），而 gh-pages 分支没有 `.gitignore` → `add --all` 把它们一并推到了公开站点（实测误推 26 个文件 / 51.67 MB）。脚本已改为只 `add` 明确的那 23 项；备份留痕 `C:\temp\ghpages-leak-backup-20261107`。
- **历史备份保留策略**：线上曾在 140 个文件中囤了 116 个历史快照（`index.html.v*` / `README.md.fill*` / `index.v*.html`）与 `data.js`。**已于 2026-11-07 清理完毕**：逐个文件名在 `index.html` / `README.md` / 三分片中等 0 命中，`data.js` 的 21 处提及全为注释且运行时零请求 ⇒ 一次性删除 117 个文件、释放 138.10 MB，线上树 **140 → 23**（`gh-pages` `7801ab3 → da08331`）。删除为普通提交、git 历史完整保留，任意文件可 `git show <旧提交>:<文件名>` 取回；备份分支 `ghpages-backup-20261107`（`80e14f8`，部署前线上快照）**已推远端**。今后增量部署仍不删任何在役文件，但**不再囤积快照**。
- **部署 URL（手机访问）**：`https://wsjshy.github.io/elite-redux-teambuilder/`。**2026-11-07 线上基线**：`index.html` 1,547,092 B / sha1 `DE7AB3B29710D2876E7EAF75D491B4FF94C274CF`（v4.181，与本地逐字节一致）+ 三分片 379,679 / 1,362,446 / 575,962 B + `assets/` 14 项 + `ER-source` 3 json + `.nojekyll`；gh-pages 树 **140 文件**（其中 117 个是历史快照 `index.html.v*` / `index.v*.html` / `README.md.fill*`，增量模式按设计保留不删）。大陆网络首次打开约 **24.5 秒**（三分片合计 2.32 MB）；`data.js` 仍在线（2,456,881 B，增量模式保留，页面已不引用）。
- **更新流程（2026-11-07 起以增量部署为主，孤儿重建已弃用）**：改产物 → `node tools/smoke.js`（26 项门禁）→ 提交到开发分支并 push → `tools\deploy_er.ps1`（默认增量，自动对齐远端 tip）→ 部署后必验（见下条）。**孤儿重建不再手动执行**：它必然清空 gh-pages、删掉约 116 个历史快照；且必须先把 4 项脱跟踪构建输入（`招式表_可学总表.csv` / `ER2.65简汉化\*.xlsx` / `ER2.5正式版图鉴v0.5.xlsm`）移出工作区，否则会被 `add --all` 推到线上——这正是 2026-11-07 误推事故的成因。
- **部署后必验（2026-10-10 教训，防"推了没生效"）**：① `git status`/`git ls-tree` 确认 **gh-pages 上无子模块 gitlink（160000）**——`ER-source/nextdex` 曾致 Pages 构建连续 4 次失败（`No url found for submodule path` exit 128），修复=`git rm --cached ER-source/nextdex`；② 部署文件提取一律 **Python 二进制 `git show master:<file>` 写盘**，禁止 PS `>` 重定向（UTF-16/BOM/编码破坏）；③ push 后查 Actions `pages build and deployment` run **conclusion=success**（API：`/actions/runs?per_page=5`），failure 时线上停留在最后成功版本；④ `curl` 线上 index.html 校验目标标记（如 `四特性体系`）与字节数 = 本地；⑤ **`git ls-tree -r --name-only gh-pages` 必须只含部署清单内的文件**——不得出现 `*.xlsm` / `*.xlsx` / `nn_data/*` / `index.html.v*` / `__wtest*`（2026-11-07 误推 26 个文件 / 51.67 MB 的教训），发现即 `git rm --cached` 后重推。
- **部署硬前提**：HTML 与 `assets\sheets` 必须同目录（相对路径引用）；`.gitignore` 排除清单见文件本身（.gba/.sav/.ss*/ER2.65简汉化/ER-source 除两 json 外全部/nn_data/nn_models/顶层 `/_*` 探针/大 CSV/xlsx/**assets/sprites/**——旧精灵图源本地保留供 build_sprites_sheet.py 重跑，不入库）。
- **ER-source 内嵌仓库处理**：官方克隆的 `ER-source\.git` 已改名 `.git.bak`（防 gitlink 吞文件）；恢复上游关联时改回 `.git` 即可，数据文件零改动。


## 9. 历史版本记录（v4.6.1 → v4.179）

已整体下沉至 [`docs/changelog/VERSIONS.md`](docs/changelog/VERSIONS.md)（2,141 行，逐字保留）。
v4.55 / v4.82 两轮的历史状态快照另存于 [`docs/changelog/STATE_snapshot_v4.55_v4.82.md`](docs/changelog/STATE_snapshot_v4.55_v4.82.md)。

- 追溯某版改了什么 → 搜 `VERSIONS.md`
- 看当前状态 → 本文 §6

## v4.184.2（存档电脑区 / D-6 容器补齐）

**症状**：解析 `.sav` 后，队伍页只能看到「我的宝可梦」池（点卡片=选核心出方案），**没有任何地方能从箱子挑精灵直接入队**。

**根因**：D-6 的渲染/搜索/入队/分页代码自 v4.93 起就在（`savPcSearch` L4901、`savPcListRender` L4875、`savPcEnqueue` L4915、满队 `savPcSlotPick`），但承载它们的三个容器 `#savPcQ` / `#savPcTypeRow` / `#savPcList` 在早期 UI 重构中丢失。`$('savPcList')` 恒为 null → 所有写入静默跳过 → 功能在页面上不可达，且**不产生任何报错**。

**教训（可复用）**：判断「某个功能是否落地」不能只看函数与调用点存在 —— 必须确认**承载它的 DOM 容器也在**。`el.innerHTML=...` 前有 `if(!el)return` 这类防御写法，会把「容器丢失」变成永久静默失败，`smoke` 与探针都抓不到。新增门禁：自本次起，任何 UI 区块都必须能在黑盒探针里断言「容器存在 + 写入后 innerHTML 非空」。

**修法**：补齐三容器 + 可折叠区块（`savPcCardShow` / `savPcCardToggle`，入口常驻避免收起后打不开）；空搜兜底从「BOX1 前 12」改全量交分页器（原兜底会让计数与实际条数不符）。

**验证**：`probe25` 12/12、`probe26` 9/9（1440+375 零溢出）、`smoke` 28/28。指纹 `1,554,642 B` / sha1 `9BACC4BE…` / sha256[:16] `32EC36F577C2601E`。

**同时**：合辑「`renderSavSlots` 分页器未落地」与「D-6 电脑区入队未落地」两条经实测**均不成立**，已就地加更正块（保留原结论，不改写轨迹）。

## v4.184.3（DOM id 引用审计 + 分享卡浮层失灵）

**检查手段（可复用）**：把 `index.html` 全部 `$('id')` / `getElementById('id')` 引用与页面 `id="..."` 定义做差集，扣掉运行时 `createElement` 赋 id 的动态节点。175 定义 / 155 静态引用 / 185 动态，差集只剩 `#shareCard` 一个。

**修掉**：`switchTab()` 的「切 Tab 关闭分享卡」取的是旧 id `shareCard`，而浮层早已改名 `#shareCardOverlay`、关闭方式也改成 `remove()`。该行从改名起一直空转 —— 打开分享卡后切 Tab，浮层盖着不走。

**门禁**：`smoke` 第 29 项「代码引用的 DOM id 必须全部已定义或运行时创建」，把这类静默失败挡在提交前。

**验证**：`probe27` 7/7（含 `stillOpen=false`）、`smoke` 29/29。指纹 `1,554,821 B` / sha1 `4531B586…` / sha256[:16] `EBAA8F75B764C669`。

**结论**：容器丢失类缺陷目前只此两处，不是普遍现象 —— 但「`if(!el)return` + 空 catch」这套写法会持续把新问题藏起来，改动 UI 结构时必须同步改引用。

## v4.185（队伍边际评估 —— 为什么不上 NN）

**结论先行**：`analyzerVNN` 始终是存根（`return null`）。不做 NN 的理由不是工程量，是**没有真值标签** —— 单机工具唯一的标签是人工评分函数本身，用它训练等于蒸馏自己的规则，天花板就是原规则。历史雏形「判断没有更优」正是这个成因，不是模型不够大。

**做了什么**：`📊 边际评估`（`edgeSuggest` / `edgeApply` / `edgeVector` / `edgeScore` / `edgeDiff`）。把缺口拆成无解系(5) / 4倍系(5) / 共弱(3) / 进攻盲区(2) / 速度线(2) / 属性重复(1) 五维，**每维单独计分**、逐条给「得/失」理由；未满队算「加谁」，满队枚举「换谁」；一键应用。权重写在 `EDGE_W` 并显示在界面上。

**性能**：1906 × 6 组合若不缓存会退化成几万次 `defCellTrio`。加 `_defVecCache`（18 属性防守向量）+ `_supSetCache`（可克制集合）后：4 只队 153 ms、满队 62 ms。

**验证**：`probe28` 12/12、`probe29` 5/5（375 零溢出、热区 44px）、`smoke` 30/30（新增第 30 项锁 5 函数+入口+权重+双缓存）。指纹 `1,564,086 B` / sha1 `DE738760…` / sha256[:16] `EA2C3705DDA349E3`。

**两个自己写错的 bug（探针才抓得到）**：
1. `indexOf(s) < 0` 写成 `<-1` —— 恒假，候选池空，界面只有缺口没有建议。
2. `team[i].id` 是字符串而按钮传数字，`===` 比较失败 → 应用报「成员不在了」。改用 `String()` 归一。

## v4.185 补记：核 blob 字节不能用 `git show > file`

部署后核对「gh-pages 里的 index.html 与本地是否同一份」时，`& git show gh-pages:index.html > $tmp` 在 PowerShell 下会因输出编码重写字节：本次得到 **1,564,247 B**，比真实 blob 多 **161 B**，足以误判成「线上与本地不一致」。

**正确口径（已实测）**：
1. `git cat-file -s <rev>:<path>` 取真实字节数
2. `git rev-parse <rev>:<path>` 取 blob 对象 hash，两侧相同即**逐字节相同**（本次 `master:index.html` 与 `gh-pages:index.html` 同为 `68dbfec9…`）
3. 线上另用 `curl` + `Get-FileHash -Algorithm SHA1` 校验文件 sha1（本次 `DE738760…` / 1,564,086 B，与本地一致）

注意区分两种 hash：`rev-parse <rev>:<path>` 给的是 **git blob 对象 hash**（sha1 of "blob\0<size>\0<content>"），不等于文件的 sha1。

## v4.185 补记：特性反查冷启动全 0 —— 从「信事件」改「信数据」

**定性（与 §6 v4.182 条的关系）**：§6 已登记 v4.182 那次 P0（`bb315b9`，`__erReady` 为真即渲染、否则挂 `er-ready`）。本次 `c21e9f7`（分支 `fix/abi-coldstart-20261108`，基于 master `23abb80`；`index.html` +16/-2 行，1,564,086 → 1,565,045 B，**两个开关默认值一个未动**）是**同一指纹的加固**：门控改 `_abiBoot()`，以 `ERDATA.species.length` 为就绪判据，同时监听 `er-shard-species` 与 `er-ready`，数据到位后补渲并失效 `_abiOwners` 缓存。加固理由：`er-ready` 在 species 分片 `onerror` 路径（L1067 尾）也会照发（置 `window.__ER_PARTIAL=true`），旧逻辑会在物种缺失下画出 60 张「0/0」误导卡。

**验证**：`tools/probe_abi_coldstart.py`（零依赖 headless Chrome；断言 A 冷启动不得全 0 / B 冷启动态==toggle 后态逐卡一致 / C `_hidN` 自洽）当前树实跑 `RESULT: PASS` exit 0——冷启动状态条「匹配 60 个特性 · 开关隐藏 1119 个持有者条目」、15 卡天性合计 138 / 可选合计 85、开关全关隐藏 0 / 全开 1119、冷启动态==toggle 后态 PASS；`node tools/smoke.js` **31/31** exit 0。历史快照对拍：before（`c87828c`）冷启动 15 卡全 0 / 隐藏 0，toggle 后隐藏 1119。

**运维结论（重要）**：线上**已经包含** `bb315b9`（`gh-pages:index.html` 与 `master:index.html` 同一 blob `68dbfec9…` / 1,564,086 B；线上三次抓取 sha1 均 `DE738760…`）——用户截图要么是 2026-11-07 20:56 部署之前的，要么是浏览器缓存了旧 `index.html`。**如仍见全 0，先让用户硬刷新（Ctrl+F5），不要直接当代码 bug 重开工单。**

**与既有文档的差异（已在新报告内指出，未改原文）**：`docs/research/技术债定级_20261108.md` L66-71 猜的「事件错过→永不渲染」被推翻——状态条文案只由 `renderAbi()` L5712 写入，渲染确实发生过，真因是「在 species 分片到达前渲染 + 无补渲入口」。详见 `docs/research/特性反查冷启动全0_20261108.md`（含「上线核验（待回填）」占位，部署后回填三方字节/sha1/`ER_ENGINE_VER`）。

## v4.186 补记：特性块同名去重 + 特性描述深化

**用户现场**：宝可梦详情弹层「特性（3 选 1，点击看描述）」下画了三个一模一样的「天使暴怒」按钮；且该特性只写「彻底更改所有招式」。要求同名不重复、「三选一」字样去掉、并把这类一句话特性深入代码解析清楚。

**去重**：`s.abis`/`s.inns` 三槽可能在显示层撞成同名（全库 **149 只**物种三槽同 id，如 `#493 阿尔宙斯 121/121/121`、`#2157 盾甲茧-原始回归 439/439/439`）。渲染时按显示名去重，只剩 1 个 → `特性（唯一：X，点击看描述）`；3 个不同 → 仍 `3 选 1`。数据真值一个字没动。

**描述增强三类**（宁可少显示也不挂错）：
- A+B 复合型 **54 条**：`abiCompositeBreak()` 拆开子特性并列全文（子项名差 1 字时走 `abiFuzzyId`，要求同长度/仅差 1 字/全库唯一三条同时满足）；
- 入场释放型 **55 条**：从「入场时释放 XX」取招式名 → `mvIdByZhOrEn` 命中 → 附招式属性与效果原文；
- 手工源码详解 **2 条**：`ABI_DETAIL` 收 439 天使暴怒、369 坏朋友。

**「天使暴怒」实证**：数据层与 `abilities.h` 都只有一句 `Drastically alters all of the users moves.`，真实机制在 `src/battle_util.c` L8978 —— 只强化 **7 个招式**（撞击 40→100 + encore/disable、毒针 15→120 + 打钢改效果绝佳、电网 55→155 + 速度清零/无法逃走 + 打地面改效果绝佳、咬虫 60→140 + 吃道具、吐丝布四钉、变硬除防御外全能力+1、铁壁获一次挡威力≠0 招式护盾），其余招式完全不变。「彻底更改所有招式」是**失实描述**。

**红线（本轮踩过又推翻）**：`eliteredux-source` 是 master 分支，**数值与 2.65 发行版不同**。曾判 26 条「中文描述数字与源码不符」为数据错误，核到 `ER-source/gameDataV2.65beta.json` 后全部推翻（173 强壮之颚 1.3 vs 1.5、233 脑核之力 1.35 vs 1.25、159 沙之力攻击 1.5x vs 岩地钢 1.3x、106 引爆 100BP 爆炸 vs 反伤 1/4）。**数值只认 ROM 官方文本，源码只解释机制结构**；找不到源码常量的（`#733 拳舞`、`#788 冰川暴怒`）**不写推测**。

**验证**：`tools/probe_sp_abi_detail.py`（新增，零依赖 headless Chrome）19 项断言全 PASS；`tools/smoke.js` 31/31；`node --check` 主 script 通过。
**踩坑**：首版补丁字符串续接多写一个 `'`，整段主 script 语法中断（所有函数 undefined），`smoke.js` 仍 31/31 —— **smoke 不检查 JS 语法，是已知盲区**，建议后续把 `node --check` 纳入门禁。

**产物**：分支 `fix/abi-dedup-detail-20261108`（`7aa75e3` → `e144e11` → `7cb4d09`），线上 `gh-pages@f3bef1a`，`index.html` 1,565,045 → 1,571,658 B。详见 `docs/research/特性描述深化_20261108.md`。

## v4.187 补记（2026-11-08）：相性改写摊开 + 全量普查结论

**① 修正一处线上错误文案**：163 涡轮火焰 / 164 兆级电压原先写「加属性没有代码支撑」。后续在上游 `upcoming` 分支的 `src/abilities.cc` 看到 `Impl<ABILITY_TURBOBLAZE>` 有 `.onEntry = AddBattlerType(battler, TYPE_FIRE)` + `.addsType = TYPE_FIRE`，说明**写了一半**。实测：`AddBattlerType` 在 **master 全仓 0 命中**、在 **upcoming 22 命中** → 加属性是**下一版才实装**，2.65 里不生效。文案已改为双版本口径（`f2510f8`）。

**② 新增「相性改写（源码倍率）」块**：数据层对这类特性只写「可以命中」「效果绝佳」，不给倍率，玩家极易算错。源码 `src/battle_util.c:15186` `MulByTypeEffectiveness` 里倍率是写死的，已把 9 条摊到详情里（`ABI_TYPE_MOD`）：
96 一般皮肤 → 强制 1.0；113 胆量 → 0 改 1.0；457 幻痛 → 0 改 1.0；**285 地面冲击 → 0 改 0.5（抵抗，不是正常伤害）**；**349 电力过载 → 2.0**；357 熔岩 → 2.0；467 岩浆吞噬者 → 2.0；212 腐蚀 → 0 改 2.0；328 压倒 → 0 改 1.0。

**③ 全量特性普查（618 条）**：用 `include/constants/abilities.h` 的 `#define ABILITY_XXX <id>` 做 id→常量映射（**数据层英文名是压缩过的**，`WandrngSprit`/`CuriusMedicn` 推不出常量名，第一版按英文名推得 441 条假「零命中」）。结论：**618/618 有引用，616 条在效果文件里有实现**；例外仅 **#180 共生**（只在 AI 判断）、**#600 龙族拳手**（只有声明与文本）。`battle_util.c` 命中数中位数仅 **2** → 绝大多数是表驱动或单点判定，**逐条自动写效果摘要被证伪**（只有 34 条关键行带注释）。

**④ 新增文档**：`docs/research/ER通用机制与源码口径_20261108.md` —— 伤害公式链（`DoMoveDamageCalcInternal`）、相性改写全表（含 6 条不属于任何特性的全局规则，如**强风天气把飞行系受到的克制压回 1.0**）、能力等级倍率表（标准 Gen3 未魔改）、993 个 `EFFECT_` 的招式分派机制、ER 独有 Monotype Champ 修正、618 条覆盖台账。

**验证**：`tools/probe_sp_abi_detail.py` 26 项断言 ALL PASS（新增 F1~F3 覆盖相性改写块）；`tools/smoke.js` 32/32；`node --check` 通过。线上 `gh-pages@698856c`，`index.html` 1,575,991 B / SHA1 `53FA74AE…`（163/164 修正版），随后 v4.187 到 1,577,659 B。

**踩坑（本轮最贵的一次）**：用 `s.replace('**','')` 想去掉 markdown 加粗，结果**全局替换 675 处**、改动 662 行，把 `AXIS_LIB` 数据和注释里的合法 `**` 一起删了。已 `git checkout -- index.html` 全量回滚后重打补丁（只改 23 行）。**教训：单文件大产物上做全局字符串替换前，必须先 `count()` 并和预期数量对账，数量差一个量级就停下。**
