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

## v4.188（2026-11-08）· 22 个「有名字有威力、但源码里没效果」的招式

**起因**：全量覆盖做到招式侧时追问「950 个招式里有多少是源码里根本没实现的」。

**证据链**（三步闭合）：
1. `src/data/battle_moves.h` 里 **22 个招式**的 `effect` 是 `EFFECT_PLACEHOLDER`。
2. `data/battle_scripts_1.s:232` 把 `EFFECT_PLACEHOLDER` 分派到同文件 L3291 `BattleScript_EffectPlaceholder`，
   脚本只有六行：`attackcanceler / attackstring / pppreduce / pause 5 / printstring STRINGID_NOTDONEYET / goto MoveEnd`
   —— **照常扣 PP、提示「还没做好」、不产生任何效果**。
3. `src/battle_script_commands.c:13329` 把它们排除出挥指随机池（`sForbiddenMoves`），作者自己也不让这些招被抽到。

**最坑的点**：数据层给它们写了完整的名字、属性、威力、命中、英文描述，界面上与正常招式毫无区别。
`#658 陷阱甲壳` 150 威力、`#939 暗影之锤` 120 威力、`#944 甲壳虫狂欢` 120 威力、`#927 腿骨捶打` 120 威力。

**两类**：`#927~945` 共 14 个是 ER 新增招（预留没写完）；`#502 交换场地 / #507 自由落体 / #658 陷阱甲壳 /
#698 茶会 / #738 腐蚀气体 / #913 快手还击` 是**正统作品有功能、ER 里被降级成占位符**。

**落地**：`MV_PLACEHOLDER` 表 + `mvPhTag()`；三处渲染点都挂「未实装」红标
（招式反查表 / 物种详情招式表 / 招式详情弹层），详情弹层给出源码依据。

**门禁**：探针新增 G 组 3 条（G1 收录 22 条 / G2 507 详情写明未实装 / G3 给出源码依据），探针 26 → **29** 项。

**版本**：1,577,659 → **1,578,721 B**，commit `b076369`，部署 `gh-pages@92bc1bc`，
线上 SHA1 `130E80195BD17E14C97EA71AA26FC6834B75B3E3` 与本地一致。

**踩坑（重要）**：`patch_ph.py` 第一版 anchor 用了 `'</td>'`，实际文件是 `</td><td>`（少一个引号），`count=0` 早退；
但**前两步的替换已在内存里、只是没写盘** → 第二次只补后两步时 `mvPhTag` 未定义，页面直接抛 `ReferenceError`。
教训：**多锚点补丁必须一次事务写完，不能拆成多次补跑**；探针的「页面内异常」断言正好抓住了这种半成品状态。

## v4.189（2026-11-08）· 口径更正：master 不是当前分支，163/164 加属性其实已实装

**起因**：查 `#788 冰川暴怒` 能否补详解时，发现它的常量在 master 里**根本不存在**，
顺手核对后发现一个会推翻大量既有结论的事实。

### 两条分支到底哪条对应玩家在玩的版本

| 分支 | 最后提交 | 特性定义数 |
|---|---|---|
| `master` | **2025-06-04** | **618 条 `#define`**（id 0–617，末条 `ABILITY_ROCKHARD_WILL 617`，`ABILITIES_COUNT=618`） |
| `upcoming` | **2026-11-07** | **1073 个 `Impl<ABILITY_>` 名字** |

游戏数据层 `ERDATA.abilities` 有 **1034 条**（id 0–1033，连续无缺口）。
**1034 只对得上 upcoming，对不上 618** → 之前「master = 2.65 发行版对应代码」的口径是错的，
**master 是一年前的旧分支**。

判据不要用「哪个源文件大 / 是不是 C++」，用**提交日期 + 数据层条目数**交叉。

### 直接后果：163 涡轮火焰 / 164 兆级电压的结论原来写反了

旧文案写「`AddBattlerType` 在 master 全仓 0 命中 → 2.65 里不生效，是下一版预留」。
真相是 `src/abilities.cc:2256` 有完整实现，`AddBattlerType`（`:227`）把属性写进 **`type3` 第三属性槽**：

```cpp
static int AddBattlerType(u8 battler, Type type) {
    CHECK_NOT(IS_BATTLER_OF_TYPE(battler, type))   // 本来就是这个属性 → 不加
    gBattleMons[battler].type3 = type;             // 叠加出第三个属性，不是替换
    ...
}
```

页面文案已改为「入场时把属性写进第三属性槽，是叠加出第三个属性，不是替换原属性；
本来已经是该属性时不触发」，`head` 也从「给自己招式加属性」改成「给自己追加属性」（原来这句本身就说错了）。

### 416 个超出 master 的 id 怎么查

upcoming 把常量头文件改成**生成式**（有 `.github/workflows/regenerate-ability-files.yml`），
`include/constants/abilities.h` 在它树里**整个不存在**，没法按 id 查 → **改按英文名匹配 `Impl<ABILITY_>`**。
台账 `docs/research/特性覆盖台账_20261108.json`（1034 条）：

| 可查方式 | 条数 |
|---|---|
| master（id 0–617） | 618 |
| upcoming 按英文名匹配 | **397**（占超出部分的 95.4%） |
| 两个分支都没有 | **19** |
| **可查率** | **1015 / 1034 = 98.2%** |

19 条无源样本：`#628 Pretty Privilege`、`#629 Shallow Grave`、`#642 Jackhammer`、
`#653 Rest in Peace`、`#675 Max Acceleration`、`#688 Imposing Wings`、`#708 Megabite`、
`#751 Energy Horns`、`#752 Rising Dough`、`#756 Twinkle Toes` 等。

### 顺带修掉一个真实缺陷：版本号漏改

`ER_ENGINE_VER` 还停在 **v4.187** —— v4.188 那轮加了功能却**没改版本常量**，
用户看到的页头版本一直是旧的。本轮一并改为 **v4.189**。

### 落地

| 项 | 值 |
|---|---|
| 体积 | 1,578,721 → **1,578,729 B** |
| commit | **`e8089b4`**（index.html + 两份 doc）、台账单独一个 commit |
| 部署 | `gh-pages@ebfd370` |
| 线上核验 | 1,578,729 B / SHA1 `21B33084BF7FD3FEFB86B8FB1F750C86A75664D4`，与本地双一致 |
| 门禁 | smoke **32/32**、probe **29 项 ALL PASS**、`node --check` 通过 |

**踩坑**：改 163/164 时用「行区间」切锚点，`iend` 写成 `strip()=='}'`，
但 163 块结尾其实是 `},`（带逗号），结果把 164 块一起吞进替换范围，`node --check` 报
`'164':{ Unexpected string`。回滚（`git checkout -- index.html`）后改为
`iend` 分别取 `},`（163）与 `}`（164），一次通过。
**教训：行区间切锚点要先确认边界行的真实结尾字符（`,` / `}` / `},`）。**

## v4.190（2026-11-08）· 破格穿透：白名单表已废弃，改成特性自带 breakable 标志

上一轮定了「upcoming 才是当前分支」，本轮就用它把之前基于 master 的结论逐条复核。
天气（结论仍成立）之后，破格这条彻底翻了。

### 判据换了

| 项 | 旧分支 master（2025-06） | 当前 branch upcoming（2026-11） |
|---|---|---|
| 机制 | 中心白名单表 `sAbilitiesAffectedByMoldBreaker` | **特性结构体自带 `.breakable` 标志** |
| 表是否存在 | 有，108 条 | **整个符号全仓 0 命中** |
| 规模 | 108 | **207**（占 1034 的 20%，旧版约 1/6） |

`src/battle_util.c:9369` `IsSuppressed`：

```c
if ((checkMoldBreaker && battler != gBattlerAttacker && gHitMarker & HITMARKER_MOLD_BREAKER
     && gAbilities[ability].breakable) || ...)
    return !DoesBattlerHaveAbilityShield(battler);
```

**四个条件缺一不可**：调用方要求检查 / 出招方不是被打的一方 / 本回合命中标记带破格 / 目标特性 `.breakable`。

### 一条对配招真正有用的新边界

`return !DoesBattlerHaveAbilityShield(battler)` ——
**对手带 Ability Shield（特性护盾）时，破格直接穿不进去**。
这是打破格队唯一不靠特性、纯靠道具的反制。

### 不可被破的

破格三兄弟（`MOLD_BREAKER` / `TURBOBLAZE` / `TERAVOLT`）在 `abilities.cc` 里用 `.onMoldBreaker`
（声明「我是破格系」），**不是** `.breakable`（「我可被破」）→ 彼此穿不进去。同类还有 `BLIND_RAGE` / `OVERRULE`。

### 复核过程中确认「没变」的一条

天气「ER 无水火属性加成」**在当前分支依然成立**：
`CalcMoveBasePowerAfterModifiers` 全文只有 134 行，函数体里唯一天气判断是
`EFFECT_SOLARBEAM` 在恶劣天气减半（`:7137`）；全文件「WEATHER 与 MulModifier 相邻」仅 1 处。
所以「别为雨天堆水招」这条配招建议继续有效。

### 一个无法用源码验证的边界（已如实写进页面）

招式占位符名单来自 `battle_moves.h`，而当前分支的 `src/data/` **整层 gitignore**（数据由
`tools/codegen` 的 Kotlin 生成器产出），**招名逐个核对不了**。
占位符机制本身仍在（`EFFECT_PLACEHOLDER` 在 `battle_script_commands.c` / `battle_ai_attack.c` / `pokemon.c` 都有），
所以页面警示框补了一句「名单取自 2.65 招式数据表，新版数据表由工具生成、无法逐个核对招名」。

### 落地

| 项 | 值 |
|---|---|
| 体积 | 1,578,729 → **1,579,375 B** |
| commit | **`85a79c8`**（index.html + probe + 文档） |
| 部署 | `gh-pages@72269d0` |
| 门禁 | smoke 32/32、probe 29 项 ALL PASS（D3/D4 断言从「白名单」改为 `breakable` + `207`）、`node --check` 通过 |

**顺手修掉文档结构问题**：`ER通用机制与源码口径` 原本有两个「## 六」、两个「## 七」，且天气章物理位置在 Monotype 之前。
按物理出现顺序重编为 **〇→十二**，顺带把唯一一处交叉引用「见第五节」改成「见第六节」，
标题里的「全量特性普查结论（618 条）」也改为「（游戏内 1034 条，旧分支仅覆盖 618）」。

## v4.192（2026-11-08）· 相性改写全量 22 条 + Hell 难度改倍率

按新口径（upcoming）继续复核「相性改写」这批特性，**又发现一处机制搬家**：

| | 旧分支 master | 当前分支 upcoming |
|---|---|---|
| 写法 | `MulByTypeEffectiveness` 里 19 个 `else if` | **每个特性自己的 `.onTypeEffectiveness` 钩子** |
| 函数体积 | 带全部特性分支 | **只剩 45 行、0 个 `ABILITY_`** |
| 特性数 | 19 | **25** |

当前分支的调用形式：

```c
ON_ABILITY(battlerAtk, FALSE, gAbilities[ability].onTypeEffectiveness,
    if (gAbilities[ability].onTypeEffectiveness(battlerAtk, defType, move, moveType, &mod)) {
        abilityModified = TRUE; break;
    })
```

### 落地：从 9 条补到 22 条

`ABI_TYPE_MOD` 原来只有 9 条，实际 `abilities.cc` 里带 `.onTypeEffectiveness` 的有 25 个 `Impl<>` 块。
其中 `EARTH_WIRE` / `OVERCLOCK` / `SOUR_APPLE` **在数据层 1034 条里对不上名字**
（代码里有、游戏里还没有）→ 只上 **22 条**。

新增 13 条：413 龙族皮肤 / 439 天使暴怒 / 535 心眼 / 635 火岩浆流 / 694 失控之怒 /
716 腐化 / 725 垃圾堆 / 760 酸性粘液 / 765 灵魂吞噬 / 774 腐化思维 / 841 龙之威仪 /
954 胃痛 / 1003 猛禽。

**一个必须分清的对照**：

| 特性 | 电 打 地面 | 倍率 |
|---|---|---|
| 285 地面冲击 | 本来 0 | **0.5** |
| `EARTH_WIRE`（未上线） | 本来 0 | **2.0** |

同一个相性组合，两个特性给出相反答案。

### 意外挖到的通用机制：Hell 难度会改相性倍率

`src/pokemon.c:6377`：`isHellMode()` = 存档里 `gameDifficulty == DIFFICULTY_HELL` —— **玩家自己选的难度档**。

`src/battle_util.c:8038`：

```c
// Super-effective damage is reduced from 2x to 1.5x, and 4x to 2x
if (isHellMode() && HELL_MODE_TYPE_EFFECTIVENESS_CHANGE) {
    case UQ_4_12(2.0): modifier = UQ_4_12(1.5); break;
    case UQ_4_12(4.0): modifier = UQ_4_12(2.5); break;
}
```

| 相性 | 标准 | Hell |
|---|---|---|
| 效果绝佳 2× | 2.0 | **1.5** |
| 双重 4× | 4.0 | **2.5** |

**注释写「4x to 2x」，代码实际 2.5 —— 注释与实现不一致，按代码为准。**

附带：Hell 下退缩对玩家侧概率归零（`battle_script_commands.c:3102`）；
Hell 训练师战敌方最多额外带 3 个特性（`pokemon.c:6323` + `HELL_MODE_EXTRA_ABILITIES 3`）。

**这条以前完全没写过，对配招影响很直接：Hell 难度下堆相性收益从 100% 降到 50%。**

### 落地

| 项 | 值 |
|---|---|
| 体积 | 1,579,375 → **1,581,257 B** |
| commit | **`b7b98c3`**（index.html + probe + 文档，3 files / 141 insertions） |
| 部署 | `gh-pages@d67f7e2` |
| 门禁 | smoke 32/32、probe **32 项** ALL PASS（新增 F5/F6/F7 三条确认 22 条与两条关键实现） |

页面相性改写卡片里也补了 Hell 提示，并把「依据」行号从旧分支的 `:15186` 更正为当前分支的 `:7947`。

## v4.193（2026-11-08）· 相性改写特性接进打击面计算（攻击方口径）

用户要求：拆出来的机制不能只写在详情卡片里，**配招时就必须算对** ——
「自己特性可能导致电反而克制地面系而不是免疫」。这轮把它接进计算。

### 第一版接错了，记下来

`src/battle_util.c:7947` 的 `ON_ABILITY(battlerAtk, ...)` —— 第一个参数是**遍历谁的特性**。
传的是 `battlerAtk`（**攻击方**）。所以「地面冲击」「腐蚀」「胆量」的真实语义是：

> **我自己出招时**，我的电招打地面不再无效（0 → 0.5）、毒招能打钢（0 → 2.0）、普通招能打幽灵（0 → 1.0）。

**不是**「别人打我时我怎么样」。第一版把它接进防守口径 `defCellTrio`，
意思变成「带地面冲击的宝可梦被电打只吃 0.5×」—— 完全反了，已回滚。

### 正确接入点

| 计算点 | 语义 | 是否接 |
|---|---|---|
| `setCoverProfile(s, ids, conv)` | 打击面模拟，`s` = **攻击方** | **已接** |
| `defCellTrio(s, at)` | 防守口径，`s` = 被攻击方 | **不接（语义不符）** |

**关键细节**：规则作用在「单个防守属性的倍率」上，不是最终乘积。
源码 `MulByTypeEffectiveness` 是对 type1/type2/type3 **各调一次**再 `MulModifier` 相乘；
若作用在乘积上，双属性会被改错。

### 三种改写模式（照源码 CHECK 条件）

| 模式 | 源码条件 | 特性 |
|---|---|---|
| `force` | 无 `CHECK_NOT(*mod)` | 腐蚀 / 电力过载 / 熔岩 / 火岩浆流 |
| `zero` | `CHECK_NOT(*mod)`，仅原本为 0 | 胆量 / 地面冲击 / 压倒 / 幻痛 |
| `floor` | `*mod` 且 `*mod < 1.0` | 一般皮肤（0.5→1.0）/ 腐化思维 |

**「一般皮肤」是把 0.5 的抗性抬到 1.0，不是只改免疫** —— 容易误判，探针专门锁了这条。

### 门禁

- smoke 新增「零引用函数」门禁抓到两个垃圾：`abiTeHas`（写了没用）、`defMultAb`（错误设计的残留），均已删。
- probe 新增 F12–F24 共 12 条，直接测 `abiTeApplyOne`，覆盖 force/zero/floor、selfType 前提、
  以及「打击面已接入」。F21 一开始断言写错（以为一般皮肤不改 0.5），按源码修正为 0.5→1.0。
- 一个诚实说明：这些特性在游戏数据库里**几乎没有持有者**（「地面冲击」全库只出现 1 次），
  所以没法用真实物种验证，只能函数级验证。

### 还没接的点（明确记账）

- `renderAtk`（属性页进攻相性格）
- 伤害预测链里的相性段
- `天使暴怒` 属招式级（只对「毒针」），`MOVE_TE_CALC` 已登记但暂无 UI 消费点

### 落地

| 项 | 值 |
|---|---|
| 体积 | 1,581,257 → **1,584,334 B** |
| commit | **`36dafb2`**（3 files / 216 insertions / 22 deletions） |
| 线上 | 1,584,334 B / SHA1 `C7F95F54…` **实测双一致** |

（部署 hash 不再手写：`ls-remote` 拿到的 gh-pages ref 与部署脚本输出对不上，
且其 commit message 是历史遗留的「Deploy: v4.181」，不能当版本判据。判据只用线上字节 + SHA1。）

## v4.194 / v4.195（2026-11-08）· 免疫与减半类特性的全量缺口

用户追问「引水特性在属性克制那里倍率就变了，还有其他的」。顺着查下去发现
`ERDATA.abiTags` 只有 **107 条**（全库 1034 个特性，覆盖 ≈10%），两个真实缺口：

### v4.194：7 个免疫特性根本没登记

**判据**：免疫类特性在源码里用 `.onAbsorb` 钩子实现 ——
`CHECK(moveType == TYPE_X)` 后返回 `ABSORB_RESULT_HEAL` / `ABSORB_RESULT_STAT`。
全量提取 `src/abilities.cc` 得 **23 个** `.onAbsorb` 特性。

其中 7 个在 `abiTags` 里**完全没登记**，工具把「免疫」算成了「正常吃伤害」：

| 特性 | id | 免疫 | 源码行 |
|---|---|---|---|
| 毒素吸收 | 344 | 毒 | `:4446` |
| 引冰 | 379 | 冰 | `:4823` |
| 食土 | 450 | 地面 | `:5880` |
| 蓄水器 | 749 | 水 | `:9290` |
| 散热器 | 865 | 火 | `:10565` |
| 闪电形态 | 868 | 电 | `:10587` |
| 熔核 | 870 | **岩石** | `:10734` |

**「熔核」免疫岩石很反直觉，但源码确为 `CHECK(moveType == TYPE_ROCK)`，照源码走。**

**「乘风」(`WIND_RIDER`) 排除**：它判的是 `gBattleMoves[move].airBased`（风系招式而非属性），
无法用属性表达。

修法：新增 `ABI_TAG_PATCH` 表，在 `abiTagOf` 里与原生 `abiTags` 合并后返回。

### v4.195：复合特性不继承基础标签（更系统性）

数据层描述形如「厚脂肪 + 腐蚀.」，但 `abiTags` **不会**把基础特性的 `im`/`hf` 带上来。
89 个可解析的复合特性里，**8 个因此丢掉了免疫/减半**：

| 复合特性 | = A + B | 丢失 |
|---|---|---|
| 火焰泡泡 | 水泡 + 燃烧之魂 | 火 减半 |
| 钢铁巨人 | 耐热 + 重型坦克 | 火 减半 |
| 蓄水器 | 储水 + 引水 | 水 免疫 |
| 幸运之翼 | 天恩 + 巨翼 | 地面 免疫 |
| 天使之翼 | 棱镜鳞片 + 巨翼 | 地面 免疫 |
| 胃痛 | 厚脂肪 + 腐蚀 | 火/冰 减半 |
| 热熵 | 热交换 + 耐热 | 火 减半 |
| 毁灭者 | 耐热 + 战斗盔甲 | 火 减半 |

修法：`abiTagOf(n, dep)` 递归解析描述里的 `A + B`，合并 `im`/`hf`/`add`，
**深度上限 2 层防循环**，结果进 `ABI_TAG_CACHE`。带 `dep` 的缓存键单独前缀，
避免浅层结果污染深层。

### 顺带盘清的四类机制（别再混为一谈）

| 类别 | 钩子 | 作用对象 | 可否用属性表达 |
|---|---|---|---|
| 免疫 / 吸收 | `.onAbsorb` | 单招命中前 | 能（`CHECK(moveType == TYPE_X)`） |
| 相性改写 | `.onTypeEffectiveness` | 逐防守属性 | 能 |
| 相性改写（后置） | `.onAfterTypeEffectiveness` | 最终乘积 | 部分（多带条件） |
| **减伤** | `.onDefensiveMultiplier` + `RESISTANCE(x)` | **伤害倍率** | **部分** |

**减伤 ≠ 相性**。`.onDefensiveMultiplier` 有 **108 个**特性在用，但倍率五花八门：
×0.25 / ×0.5 / ×0.65 / ×0.7 / ×0.75 / ×0.8 / ×0.9 / ×1.25 / ×2.0。
**只有严格 ×0.5 且无本体属性前提的 20 个能并进 `hf`**，其余混进相性表会失真。

### 门禁

- smoke 32/32；probe 扩到 **48 项**（F25–F35）。
- F31–F35 专测复合继承：胃痛→火/冰、火焰泡泡→火、钢铁巨人→火、蓄水器→水、幸运之翼→地面。
- F29/F30 是回归锁：确认「引水」「引火」原有 `im` 没被补丁表覆盖破坏。

### 还没接

- `.onAfterTypeEffectiveness` 15 个里带条件的：`TERA_SHELL` 太晶甲壳（满血时 2×→0.5×）、
  `SOOTHSAYER` 占卜大师（限时 5 回合）、`FOGGY_EYE` 雾眼（雾天幽灵封顶 0.5×）、
  `STEELWORKER` 钢能力者（需本体钢属性）、`WONDER_GUARD` 奇异守护。
- 非 ×0.5 的减伤倍率。

### 落地

| 项 | v4.194 | v4.195 |
|---|---|---|
| 体积 | 1,584,334 → 1,585,481 B | → **1,586,942 B** |
| commit | `fb5db6d` | **`ad97e49`** |
| 线上 | 已核验 | **1,586,942 B / SHA1 `645B8348…` 双一致** |

## v4.196（2026-11-08）· 工具内相性计算接入点全量盘点

用户要求「不止属性克制，工具的其他地方也都要考虑到」。全扫 `index.html`，
把所有涉及相性/伤害的调用点列出来逐项判过。

### 全量分布

| 函数 | 调用点数 | 语义 | 处理 |
|---|---|---|---|
| `defCellTrio(s,at,pickOv)` | **30** | 防守口径，`s` = 被攻击方 | 已接（走 `abiImHf` → `abiTagOf`） |
| `setCoverProfile(s,ids,conv)` | **6** | 打击面，`s` = 攻击方 | 已接（v4.193） |
| `defMult(types,at)` | 4 内层 + **2 绕过** | 纯属性乘积 | 2 处绕过已改 |
| `ERDATA.matchup` 直查 | **16** | — | 3 处已改，其余纯属性维度不接 |

### 改了哪 5 处

| 位置 | 用途 | 原算法 |
|---|---|---|
| 抗性果推荐（弱点判定） | 挑 2×/4× 弱点 | `defMult(effTypesOf(s).base,t)` ← **绕过了 `defCellTrio`** |
| 抗性果推荐（文案倍率） | 显示给用户的倍率 | 同上 |
| `coverHoles` 盲点计算 | 本系最多 1× 视为盲点 | `matchup[ai][ti]` |
| `canHitSuper(s,t,learn)` | 能否打出超效 | `matchup[ai][ti]>=2` |
| 核心盲点排序 | 按难受程度排序 | `matchup[ai][ti]` |

### 顺带发现的真实缺陷：`matchup` 索引方向反了

`ERDATA.matchup` 布局是 **`[防守属性][攻击属性]`**。实测：

```
matchup[地面][电] = 0      ← 电打地面无效
matchup[电][地面] = 2      ← 地面打电克制
matchup[钢][毒]   = 0      ← 毒打钢无效
matchup[毒][钢]   = 1
```

上述三处写的是 `matchup[攻击][防守]`，**方向是反的** —— 算出来的是
「目标属性招式打自己」。v4.196 统一改走 `coverMultOf`，方向一并修正。

**这会改变「盲点计算」「canHitSuper」「核心盲点排序」的结果**，属于修 bug 不是改需求。

### 新增统一求值口 `coverMultOf(s,atkTy,defTy)`

**约定：凡是「某只宝可梦的某属性招式打某属性」，一律走 `coverMultOf`，
不要再直接查 `ERDATA.matchup`。** 纯属性维度（属性页、`_supSetCache` 等）照旧直查。

### 踩坑：插入位置插进了函数体内

第一次插入 `coverMultOf` 时，用「找 `function abiTeApplyOne(` → 找下一个
`strip()=='}'`」定位结尾 —— 那个 `}` 是 **`for` 循环的右括号**，不是函数结尾，
于是 `coverMultOf` 被塞进 `abiTeApplyOne` 体内，probe 全崩
（`ReferenceError: coverMultOf is not defined`，连带 32 项 FAIL）。

**正确做法**：用「函数结尾的语义特征行」定位 —— `abiTeApplyOne` 的结尾是
`'  return out;'` 且下一行 `'}'`，两个条件同时成立才算函数结束。

### 门禁

smoke 32/32；probe 扩到 **52 项**。新增 F36–F39 专测 `coverMultOf`：
无特性电打地面=0、地面冲击=0.5、腐蚀毒打钢 0→2、内部确实走 `abiTeApplyOne`。

### 落地

| 项 | 值 |
|---|---|
| 体积 | 1,586,942 → **1,587,914 B** |
| commit | **`629a883`** |
| 线上 | 1,587,914 B / SHA1 `CA99285B…` **双实测一致** |

## v4.197（2026-11-08）· 防御侧伤害倍率单独建表

第 2 块：非 ×0.5 的伤害倍率。`.onDefensiveMultiplier` 有 108 个特性在用，
但**它乘的是伤害，不是相性表** —— 这是本轮最关键的认知。

### 三分类

| 类 | 含义 | 条数 | 能否静态表达 |
|---|---|---|---|
| A | 固定属性 → 固定倍率 | **15** | 能 → `ABI_DMG_MOD` |
| B | 不分属性，对所有伤害一个倍率 | **11** | 能 → `ABI_DMG_ALL` |
| C | 条件型（分段/满血/天气/物理特殊/会心/攻方属性） | **34** | 不能 |

**A 类不全是减伤**：`干燥皮肤` ×1.25、`液化` ×2.0、`毛茸茸` ×2.0、`极致蓬松` ×2.0
是**增伤**（自找弱点）。`厚脂`（`THICK_BLUBBER`）×0.25 与 `厚脂肪`（`THICK_FAT`）
×0.5 是**两个不同特性**。

### 工具里怎么显示

`abiDesc` 新增一块「受到伤害倍率」，明确注明「与属性相的 0.5× / 2× 不是一回事」。
文案按倍率自动分流：`<0.5` → 强减伤；`<1` → 减伤；`>1` → 增伤，是弱点。

**`defCellTrio` 不接减伤倍率** —— 它返回相性值，塞 ×0.7 进去会破坏
「0.5 的整数倍」这个语义。两者必须分开。

### 解析踩坑（三次误判）

1. **把 `.onOffensiveMultiplier` 也抓了** —— `FOSSILIZED` 看似「岩石 ×0.5 又 ×1.2」矛盾，
   实际前者挨打减半、后者自己打岩石招加伤。只解析 `.onDefensiveMultiplier` 段才对。
2. **漏掉 `if` 前的条件** —— 第一版把 `FILTER` / `MULTISCALE` / `FUR_COAT` / `BAD_OMEN`
   全归成「无条件全伤害」。
3. **if/else 分段被当成两条独立规则** —— `BARK_SKIN` / `FEATHERCOAT` 的
   `MUL(.7)` / `MUL(.85)` 在 if 与 else 分支里。
   **判据：一段内恰好 1 条规则才进 A/B，多于 1 条整体归 C。**

### 门禁

smoke 32/32；probe 加到 **58 项**。新增 F40–F47。
**F47 是本轮最有价值的一条** —— 前面几条只证明「表建对了」，
F47 才证明「用户真的能在页面上看到」（`abiDesc` 实渲染出减伤条目）。

### 落地

| 项 | 值 |
|---|---|
| 体积 | 1,587,914 → **1,590,052 B** |
| commit | **`2e52784`** / 文档 `995d126` |

## v4.206 ~ v4.210（2026-11-08）· 打击面补口径 + 全局字号

### v4.206 · 打击面只算天性
`setCoverProfile` 写 `var abn=(s&&s.inns)?s.inns.slice():[]` —— **只天性**，
而 `defCellTrio` 早就支持「勾选可选特性」。两边口径不一致的后果很具体：

| 特性 | 物种数 | 天性数 | 说明 |
|---|---|---|---|
| 一般皮肤 | 14 | **0** | 全可选 ⇒ 修前打击面 100% 不算 |
| 胆量 | 49 | 19 | 30 个物种可选态漏算 |
| 腐蚀 | 35 | 14 | 21 个漏算 |
| 幻痛 | 14 | 9 | 5 个漏算 |

修：读 `teamInfo[s.id].pick` 并进 `abn`。

### v4.207 · `mode:'floor'` 抬不动「无效」
接完 pick 实测「一般皮肤 + 小拉达 + 拍击打幽灵」**仍是 0**。查规则：

```js
'一般皮肤':[{atk:['一般'],mul:1.0,mode:'floor'}]
else if(r.mode==='floor'){if(out>0&&out<r.mul)out=r.mul;}   // ← out>0 卡死
```

`out>0` 把无效（0）排除在外，于是「把无效变成 1×」永远做不到。
源码 `if (*mod < 1.0) *mod = 1.0` 是**低于 1.0 一律抬，含 0**。
去掉 `out>0` 后：拍击打幽灵 `0→1.0`、一般打钢 `0.5→1.0`。

**这条正是用户那句话的字面实现**：「配招时要考虑自己特性可能导致电反而克地面而不是免疫」。
「地面冲击」让电打地面 0→0.5，走的也是这条链路。

### v4.208 / v4.209 · 全局字号 + 层级
421 处 `font-size` 全是硬编码 px。统一 ×1.08：

```python
pat = re.compile(r'font-size:\s*(\d+(?:\.\d+)?)px')
s2 = pat.sub(lambda m: 'font-size:%gpx' % (round(float(m.group(1))*1.08*2)/2.0), s)
```

**必须用 `sub` 回调，不能用连续 `replace`** —— 后者 `11px→12px` 之后 `12px→13px` 会再命中，字号一路飙。

层级：中文名(19+) > 种族值数字(19 主色) > CTA(13.5 主色加粗) > 类型 chip > 英文名(11)。
「种族值」原先有**三份模板**（宝可梦页 / anp 选择器 / 队伍构建页），只有最后一份是强样式
`种族值 <b style="font-size:17.5px">`，前两份是一整句同字号 —— **本次统一为强样式**。

### v4.210 · 减伤倍率说明精确化
原文案「（与属性相的 0.5×/2× 不是一回事）」对厚脂这类**按属性**减半的特性已不成立
（它们确实进弱点表）。改为「标了属性的条目同时计入上图弱点倍率，不分属性的是纯减伤」。

### 覆盖率复核（v4.210 时点）
用「`Impl<ABILITY_X> = {` + 括号配平」重扫源码，去重后 **40 个**特性挂
`onTypeEffectiveness` / `onAfterTypeEffectiveness`：

- **`onTypeEffectiveness`（改相性倍率）23 个** → `ABI_TE_CALC` 覆盖 21 个。
  缺的 3 个是 `EARTH_WIRE` / `OVERCLOCK` / `SOUR_APPLE`，**数据层 1034 条里根本没有这三个**
  （工具无物种携带 ⇒ 登记了也没消费点），不补。
- **`onAfterTypeEffectiveness`（改伤害，非相性）17 个** → 不进相性表，只在详情卡展示。

**扫描正则的坑**：`Impl<ABILITY_X>` 在文件里也会以 `Impl<ABILITY_X>.onDefender` 形式被引用，
所以必须写成 `Impl<ABILITY_X>\s*=\s*\{`，否则配平从引用点开始、块体串位（第一版就是这么误判
「粗糙皮肤」有龙属性相性规则的）。

### 已确认不接的点（不是漏装）
- `renderAtk` 属性克制页进攻视角：**纯属性维度，没有宝可梦主体** ⇒ 不该接。
- `ABI_DMG_ALL`(11) / `ABI_DMG_COND`(32)：不分属性 / 依赖战斗状态 ⇒ 只在详情卡。

## v4.202 ~ v4.205（2026-11-08）· 机制真正接进计算 + 走查修布局

### v4.202 · 队伍构建说明块被压成 106px
`#myPoolWrap` 是 `display:grid; repeat(auto-fill,minmax(104px,1fr))`，
空态那句说明 `<div class="mini">` 是 grid 的第一个 item、没跨列 ⇒ 被塞进 106px，
文字逐字换行。渲染态（`renderMyPool` 有数据时）早就写了 `grid-column:1/-1`，
**只有静态 HTML（L957）和空态分支（L5821）漏了**。
→ 两处补 `grid-column:1/-1`。

教训：grid 容器里放「整行提示」必须显式跨列；
同一句文案存在「静态 HTML / 空态 / 有数据态」三个副本时，改一处必然漏另两处。

### v4.203 · 速度分布图改成真直方图
原 `speedDistBarHtml` 只输出一根 `linear-gradient` 色条 + 5 根 1px 分位竖线，
**看不出分布形态**。改为 24 桶直方图（柱高 = 该速度区间的物种数）+ 2px 分位竖线。
柱高归一化到 `bmax`，竖线位置仍按 `(v-mn)/span`。

### v4.204 · 4 条减半特性此前全站没接
把三张表的每个键喂给 `abiTagOf()` 做对账，A 表 15 条有 **4 条返回 NULL**：
`厚脂`(#889, 火冰 ×0.25) / `熔岩铠甲`(水冰 ×0.7) / `遇水凝固`(水 ×0.5) / `黑暗亲和`(恶妖精 ×0.75)。
玩家带着它们查弱点，表里仍按原始相性算。

**但不能直接补进 `ABI_TAG_PATCH`** —— `defCellTrio` 里所有 hf 分支写死 `*=0.5`，
会把 ×0.25 算成 ×0.5。加一层 `hfMul`：
- `ABI_TAG_PATCH` 支持 `hfMul:{火:0.25,冰:0.25}`
- `abiTagOf` 合并进返回对象
- `abiImHf` 汇总（取最严）
- `_hfMulOf(g,at)`：有自定义用自定义，**没有回退 0.5**
- `defCellTrio` 5 处 `*0.5` 全部改走它

实测：草苗龟(草系,遇水凝固) 水 opt `0.5→0.25`；幕下力士R(火系,熔岩铠甲) 冰 opt `0.25→0.175`。
**这次没有新增任何展示，只是让 40+ 处 `defCellTrio` 调用点拿到正确数值。**

**分层原则**（写死，避免以后又把条件型硬塞进来）：
| 层 | 字段 | 进 defCellTrio |
|---|---|---|
| 属性免疫/属性和减半 | `im`/`hf`/`hfMul` | 是 |
| 不分属性减伤 | `def`/`phy` | 否 |
| 条件型减伤 | `cond` | 否 |

B 表 11 条、C 表 32 条 `abiTagOf` 返回 NULL **不是漏装，是本来就不该进**。

### v4.205 · `MOVE_TE_CALC` 有表无消费点
`MOVE_TE_CALC={'天使暴怒':[{move:'毒针',…}]}` 早就登记了，但 `abiTeApplyOne`
只读 `ABI_TE_CALC` ⇒ **这条规则永远不生效**。
修法：`abiTeApplyOne` 加第 6 参 `mvName`，命中则把 `MOVE_TE_CALC[name]`
里 `move===mvName` 的条目并入评估；`setCoverProfile` 传 `m[1]`（招式中文名）。

实测：`毒针→2.0` / `污泥炸弹→0`（不生效）/ 不传招式名`→0`（保守不擅自改写）。
probe F55–F57 固化这三条。

## v4.199 / v4.201（2026-11-08）· 条件型减伤表 + `RESISTANCE` 死分量

### v4.199 · `ABI_DMG_COND`（32 键）
`.onDefensiveMultiplier` 的三分类落地：
- **A 表 `ABI_DMG_MOD` 15 条**（固定属性倍率，`{t:[属性],mul}`）
- **B 表 `ABI_DMG_ALL` 11 条**（不分属性，值是倍率）
- **C 表 `ABI_DMG_COND` 32 键**（`[{mul,when,note?}]`，条件写在 `when`）

判据：`Impl<ABILITY_X>` 块内 `.onDefensiveMultiplier` 段
**恰好 1 条规则**才进 A/B；**多于 1 条**整体进 C。
例：`FLUFFY` 毛茸茸段内「火 ×2 + 接触 ×0.5」两条 → 进 C，两条并列。

对账教训：`dmg_mod3.py` 报 A 类 18 条，实为 15 —— 差的 3 条
（`FLUFFY` / `FLUFFIEST` / `LIQUIFIED`）是**增伤**，被当减伤过滤。
若只信分类脚本会漏装。

### v4.201 · `RESISTANCE(x)` 不是 ×x²
`src/abilities.cc:133-138` 里 `RESISTANCE(val)` 同时往 `resistance` 与 `modifier`
两个累乘器各乘一次 val，看似 ×x²。但 `battle_util.c:7041-7070`
的 `CalculateAbilityMultipliers(..., u16* resistanceMultiplier)` **只 `return multiplier`**，
而唯一调用方 `CalcFinalDmg:7597-7612` 传进去的是 `u16 ignored`，**声明后从未读取**。
⇒ `resistance` 分量为死写，`RESISTANCE(x)` 净效果 = ×x。

数据层「极致蓬松 4 倍 / 毛茸茸 2 倍」是旧公式遗留文案。
数值照源码写 ×2.0，另加一行浅色注解说明差异。

`master` 分支无 `onDefensiveMultiplier` / `CalculateAbilityMultipliers` 任何定义，
这套钩子是 upcoming 独有；数据层 1034 条特性同源 ⇒ 按 upcoming 判正确。

### 门禁盲区
- `esc()` = `scrubLeak(mdInline(...))`，`scrubLeak` 触发正则含 **`源码` / `口径` /
  `v\d.\d` / `[A-Z][A-Z0-9]*_[A-Z0-9_]+` / `L\d{2,5}` / `→` / `【` / 空括号** 等，
  命中即**整句剥空**。玩家可见文案不得出现这些词；手写常量注解应绕开 `esc` 直接拼接。
- `smoke.js` 只编译不执行、`probe` 断言在函数级 ⇒ **DOM 空表 + 控制台无报错**这类问题
  全绿也发现不了。只能靠真实渲染走查（`%TEMP%\cdp_shot.py` 逐 tab 截图、
  `%TEMP%\shot_cond.py` 定点渲染详情卡片）。

## v4.198（2026-11-08）· 界面可读性整改

用户反馈「字体太小、重点不明确」。查下来是两件事叠在一起。

### 字号：基础 14px，但子元素全在 10-12px

改前分布：`10px` 57 处 / `11px` 168 处 / `12px` 110 处 / `13px` 49 处。
`body` 是 14px 但真铺满屏的标签注释全在 10-12px，观感就是「小」。
无 `font:` 简写，可安全批量处理。

**抬升表：8/9→11、10→12、11→12.5、12→13.5、13→14、14→15、15→16.5、16→17.5、17→18、20→22。**

**关键：必须用占位符分批替换。**
直接顺序替换会连锁 —— 先 `12.5→13` 再 `12→13`，刚生成的 12.5 被下一条规则再吃一次，
最后全塌成 13px，**比改之前更不分明**。第一版就是这么错的，回退重做。
正确做法：每个原值先换成唯一占位 `\x00FS{i}\x00`，全打完标记再统一还原。

### 重点不明确 ≠ 字号问题，是权重分配问题

卡片里 `.nm`（物种名）13.5px、`.mini`（点击提示）13.5px **完全同级**，
而 `.bs`（种族值行）反而 14px/600 更重 —— 主次是反的。

| 元素 | 改前 | 改后 |
|---|---|---|
| `.nm` 物种名 | 13.5px/600 | **17px/700** |
| `.en` 英文名 | 12.5px | **11.5px/opacity .7** |
| `.bs` 种族值行 | 14px/600/主色 | **12.5px/400/次色** |
| 种族值数字 | 混在文字里 | **单独 16px/主色** |
| `.mini` 提示语 | 13.5px | **12px/opacity .75** |

**把视觉重量从「标签行」转到「物种名 + 关键数字」。**

### 修掉：唯一特性被渲染成「1 选 1」

用户最早就提「只有一个特性就别显示三选一」。之前只修了一半 ——
去重逻辑合并了 chip，但标题仍走 `(_abUq?1:abiN)+' 选 1'`，于是渲染成
「特性（1 选 1）：」。两处都改成唯一时不出「N 选 1」字样。

### 修掉：招式反查是空表（真 bug）

`ERDATA.moves` 在异步分片 `data_adv_v498.js` 里，而 `renderMv()` 在 IIFE 初始化时
就调了、外面套 `try/catch` —— 数据没到就抛错、被静默吞掉，之后**无人重渲**，永远空表。

分片加载器有 `er-shard-adv` / `er-ready` 事件，补监听即可。修完 1032 条全部渲染。

**这类 bug 的特征：DOM 空、无报错、smoke + probe 全绿。**
只能靠真实渲染走查。本轮补了 CDP 截图工具 `%TEMP%\cdp_shot.py`
（`--remote-debugging-port` + `Page.captureScreenshot`），可逐 tab 截图。

### 落地

| 项 | 值 |
|---|---|
| 体积 | 1,590,052 → **1,591,201 B** |
| commit | **`0e3629b`** / 文档 `db24b56` |


## v4.211 ~ v4.213（2026-11-08）· 伤害判定接入非属性减伤

### v4.211 先加后撤：干燥皮肤火 ×1.25 不归 `ABI_TAG_PATCH`

`ABI_DMG_MOD` 15 条全量对账（`tools/../chk_dmgmod_all.py`）显示 `干燥皮肤`(#87，17 物种) 只有 `{im:['水']}`，「火 ×1.25」看起来丢了。补进 `ABI_TAG_PATCH` 后实测蘑蘑菇 #285 火 `opt=3.125`，即 `2×1.25×1.25` —— **乘了两次**。

根因：`defCellTrio` L5118-5125 的 `mechRw` 机制层早已处理：

```js
var ma=mechDefAdjOf(s,at);
if(ma.imm){inn=0;opt=0} else if(ma.hf){inn*=0.5;opt*=0.5}
if(ma.down>1&&opt>0)opt*=ma.down;        // 干燥皮肤火 ×1.25
```

`mechEvalOf` 对干燥皮肤返回 `defImm=['水']` + `defDown=['火']`。撤销补丁、改成注释留痕。撤销后蘑蘑菇 #285：火 `base=2 inn=2 opt=2.5`、水 `base=0.5 inn=0 opt=0`，正确。

**硬规则**：`mechRw` 机制层与 `ABI_TAG_PATCH` 是并行两条路，同一特性同一属性只能出现在一边。改 `ABI_TAG_PATCH` 前必须先跑 `mechDefAdjOf` 看 `defImm/defHf/defDown`。

审计（8 条常见减半特性）：`厚脂肪/耐热/原木/免疫/深度冻结/重金属/坚实基础` 全部为空 → 无重叠；**`超净` 返回 `defImm=['水']`，但 `ABI_DMG_MOD` 登记「毒 ×0.5」—— 两边矛盾，待核查（非本次引入）**；`干燥皮肤` 归 `mechRw`。

### v4.212 `dmgCalc` 接入非属性减伤

`dmgCalc` 此前只用 `defCellTrio(...).opt` 拿属性相性，`ABI_DMG_ALL`(11 条不分属性) 与 `ABI_DMG_COND`(32 条条件型) **完全没进伤害** —— 多重鳞片满血 ×0.5、毛皮大衣物理 ×0.5 在 OHKO 判定里不存在，伤害偏高。

新增三函数（紧贴 `dmgCalc` 前）：
- `dmgDefAbis(sD)`：`inns` + `teamInfo[id].pick` + 可选池 `abis`（并入池对齐 `defCellTrio` 的 `opt` 口径）
- `dmgCondHit(when,sD,sA,mType,isPhys,o,eff)`：只认静态可判定条件（物理/特殊、满血恒真、效果绝佳→`eff>=2`、会心→`o.crit`、沙暴/冰雹→`o.weather`、攻方是X属性→`sA.t1/t2`）；**认不出的条件返回 false，宁可不计不误乘**
- `dmgDefAbiMul(...)` → `{mul,hits}`

接入点在 `mod*=eff` 之后；返回值加 `abiMul`/`abiHit`，原字段不动。

实测：水跃鱼(多重鳞片) `abiMul=0.5` `hits=["多重鳞片×0.5(满血时)"]`；小海狮(毛皮大衣) `0.5` `["毛皮大衣×0.5(物理招式)"]`；超级布里卡隆(脑容量) `0.5`。

### v4.213 伤害面板显示减伤原因

`dmgRender` 伤害行末尾追加 `· 特性减伤 ×0.5`（accent 加粗，title 悬停 = `abiHit.join('；')`），`abiMul===1` 时整段不渲染。

**踩坑**：第一版用 `escAttr(...)`，项目里没这个函数（只有 `esc`），整段在 `try{}` 里被吞成静默无输出。改 `esc`。

### probe F60–F62

F60 多重鳞片 0.5 / F61 毛皮大衣 0.5 / F62 无减伤特性物种 `abiMul===1`（防汇总逻辑误乘）。

### 本批提交与验证

`73202f1`(v4.211 撤销) → `b4d7984`(v4.212+v4.213)。`index.html` = **1,599,660 B / `ER_ENGINE_VER='v4.213'` / SHA1 `F4F630A5BB36B8B837EB36B45E8764CAC51C431D` / 线上 VERIFIED-MATCH**。`node --check` 0、smoke 32/32、probe 72 项 ALL PASS。

### 仍未接的点（明确记账）

- `dmgCalc` 的 `eff=defCellTrio(sD,mType,null)` 传 `null` → 伤害判定不认防御方勾选的可选特性（`opt` 已含可选池最优，与勾选口径仍有差）。
- 攻击方增伤特性（技术高手/强颚等）未进 `dmgCalc`。
- `.onAfterTypeEffectiveness` 里依赖战斗状态的（`TERA_SHELL` 满血 2×→0.5×、`SOOTHSAYER` 5 回合递减、`FOGGY_EYE` 雾天封顶、`STEELWORKER` 需本体钢属性、`WONDER_GUARD`）静态表只能标注不能算。

---


## v4.214 ~ v4.216（2026-11-08）· 伤害链路三层接入收口

### v4.214 `dmgCalc` 统一 pick 口径

原 `defCellTrio(sD,mType,null)` 显式声明「没有勾选」，跳过 `teamInfo` 分支。改成 `defCellTrio(sD,mType)`（第三参省略）后走全局 `teamInfo`，与属性克制页/弱点表/打击面完全同一套口径。`sD` 通常不在 `teamInfo` 里，多数情况行为不变。

### v4.215 `ABI_ATK_MOD`（16 条）：源码 `.onOffensiveMultiplier` 的纯属性增伤

**关键发现**：`abilities.cc` 里 `.onBasePower` / `.onModifyDamage` **一个都没有**。统计全部 `.onXxx`：

| 钩子 | 次数 |
|---|---|
| `onOffensiveMultiplier` | **311** |
| `onEntry` | 310 |
| `onAttacker` | 169 |
| `onDefensiveMultiplier` | 153 |
| `onDefender` | 151 |

`onOffensiveMultiplier` 才是攻击侧主通道。按 `Impl<ABILITY_X>\s*=\s*\{` + 配平取 1071 块，含该钩子的 **186 个**（其余 125 个是 `Impl<X>.onOffensiveMultiplier` 别名，78 条链如 `MINUS→PLUS`、`TOUGH_CLAWS→BIG_PECKS`）。

按「函数体只有一条 `if (moveType == TYPE_X) MUL(y)`」筛出 16 条，全部登记：

`飘浮`飞行1.25(158物种)｜`水泡`水2.0(11)｜`电晶体`电1.5(17)｜`龙颚`龙1.5(20)｜`原木`草1.2(15)｜`燃烧`火1.5(4)｜`钢之意志`钢1.3｜`发电细胞`电1.25｜`化石化`岩石1.2｜`黑暗亲和`恶1.25｜`电力爆发`电1.35｜`沙暴恐惧`地面1.2｜`地狱愤怒`火1.35｜`飞空助力`飞行1.3｜`水栖栖息者`水1.5｜`厄运冲击`恶1.35（后 10 条物种 0，登记备查）

**与 `ABI_DMG_MOD` 是两条独立维度，可以同时出现在同一个特性上**：原木（防守草×0.5 / 进攻草×1.2）、化石化（岩石×0.5 / ×1.2）、黑暗亲和（恶妖精×0.75 / 恶×1.25）。

新函数 `dmgAtkAbis(sA)` / `dmgAtkAbiMul(sA,mType)`。

**坑**：`inns` 必须算。实测「飘浮」在巴大蝶的 `inns` 里不在 `abis` 里（158 物种），只读 `abis` 会全漏。

### v4.216 面板同时显示减伤与增伤

`28–33（克制 ×0.5 · 本系×1.5 · 特性减伤 ×0.5 · 特性增伤 ×2）` —— 减伤蓝 `var(--accent)`、增伤绿 `var(--ok)`，`title` 悬停显示明细。实测溜溜糖球(水泡,攀瀑) 打 角金鱼。

### 一次伤害的完整修正链

```
1. 克制倍率  eff   = defCellTrio(sD,mType).opt   ← 相性 + im/hf/hfMul + mechRw
2. 防守减伤  abiMul= dmgDefAbiMul(...)           ← ABI_DMG_ALL(11) + ABI_DMG_COND(32)
3. 进攻增伤  atkMul= dmgAtkAbiMul(sA,mType)      ← ABI_ATK_MOD(16)
4. 天气/场地/道具/会心
5. STAB ×1.5（含 -ate 转换）
```

### probe F63–F66

`ABI_ATK_MOD` 16 条 / 水泡·水 ×2 / 水泡·非水不增伤 / 飘浮·飞行 ×1.25。

### 本批提交与验证

`d22b9f5`。`index.html` = **1,602,649 B / `ER_ENGINE_VER='v4.216'` / SHA1 `86969BEF42E8E2F67FEB5D9277B6F364B309E263` / 线上 VERIFIED-MATCH**。`node --check` 0、smoke 32/32、probe 77 项 ALL PASS。

### 仍未接（明确记账）

- `.onOffensiveMultiplier` 剩下 **170 个带条件的**（需状态/HP/回合/队友/天气/招式 flag），静态表算不了，只在详情卡展示。
- `ABI_DMG_COND` 里依赖战斗计数的条件（如「本场还没消耗完」）`dmgCondHit` 一律不计。

---

## v4.217 / v4.218（2026-11-08）· 速度线页从「只能看」改成可交互 速度线页从「只能看」改成可交互（v4.217 / v4.218）

### v4.217 / v4.218（2026-11-08）· 速度线页从「只能看」改成可交互.1 问题

用户贴了全库速度分布页的截图，原话：「**继续，这个就只能看吗，详细信息完全看不到**」。

诊断结果：

- 速度表渲染在 `speedRenderTable()`（L6955），每行是纯 `<tr><td>…</td>…</tr>`，**没有任何交互**；
- 页面外壳 `speedRender()`（L7007）只生成筛选 chip 和 `#spdTableBox` 容器；
- 直方图 `speedDistBarHtml()`（L6291）的 24 根柱子是纯 `div`，同样不可点。

而**完整的物种详情弹层其实早就存在**：`openSp(s)`（L3526）里有种族值条形图（含总值）、配速提示 `speedHintHtmlCached(s)`、超速滑块 `speedSliderHtml(s)`、进化链 `famChainHtml(s)`、特性区（同名去重 + 点击看描述）、天性区，以及 `gotoCoreFromSp()` 主 CTA。快捷入口 `openSpById(id)` 在 L1940。

**所以不是缺功能，是缺入口。**

### v4.217 / v4.218（2026-11-08）· 速度线页从「只能看」改成可交互.2 v4.217：表格整行可点

`speedRenderTable` 的行改为：

```js
h+='<tr style="cursor:pointer" onclick="openSpById(\''+s.id+'\')" title="点击查看 '+esc(s.zh)+' 的完整详情（种族值 / 特性 / 天性 / 配速建议 / 进化链）">'+
  '<td>'+s.id+'</td>'+
  '<td><span style="color:var(--accent);font-weight:700;border-bottom:1px dashed currentColor">'+esc(s.zh)+'</span></td>'+…
```

整行可点 + 物种名 accent 主色 + 虚线下划线做可点暗示。

实测（CDP，端口 9393）：点第一行 → 弹出「宝可梦详情 / 幸福蛋R Blissey Redux #2633 / 格斗 / 种族值 550 / 配速 极速 669 P100 / 超速滑块 / ER 修正乘区」。

### v4.217 / v4.218（2026-11-08）· 速度线页从「只能看」改成可交互.3 v4.218：直方图柱子可点 → 区间筛选

光能点开详情仍然不够 —— 直方图本身是「这个速度区间有多少只」，点它最自然的动作是**看这些是哪几只**。

- 每根柱子加 `onclick="speedPickBin(i,lo,hi)"`、`cursor:pointer`、`title="极速 lo–hi：N 只（点击只看这些）"`；
- `speedPickBin(i,lo,hi)` 写 `window._spdFilter.bin` + `window._spdBinRange={lo,hi}`，再 `speedRender(true)` 整页重渲染；`i<0` 或重复点同一根 = 取消；
- `speedRenderTable` 的过滤链里加一条：`f.bin!==undefined` 时按 `spdMaxOf(s)` 落在 `[lo,hi]` 内才保留；
- 选中的柱子用 `var(--ok,#2e7d32)` 绿色 + 不透明高亮，其余仍为 `var(--accent)` 半透明；
- 直方图下方出现「已选中极速区间 365–388：下方表格只列这些宝可梦」+「取消区间筛选」按钮。

实测：点第 12 根柱子 → 表格 401 行 → **138 行**，区间文字 `365–388`，首行 `806 砰头小丑 极速 388`（正好落在区间内）。

### v4.217 / v4.218（2026-11-08）· 速度线页从「只能看」改成可交互.4 踩坑：python 补丁里用 `rfind('return h}', start, end)` 永远找不到

给 `speedDistBarHtml` 末尾插一行时，先按括号配平算出函数体结束位置 `end`（指向 `return h}` 的那个 `}`），再 `s.rfind('return h}', m.end(), end)` —— 返回 -1。

原因：`rfind` 的 `end` 参数是**开区间**，而 `'return h}'` 的最后一个字符就是 `end` 所指的那个 `}`，整串落在窗口外。

改用 `s.rfind('return h', m.end(), end)`（去掉右花括号）才对。

**这一次失败把 `index.html` 写坏了**（插到了 `function speedDistBarHtml()` 与 `{` 之间），`node --check` 报 `SyntaxError: Unexpected token 'var'`，smoke 掉到 31/32（`openSpById` 等全部 undefined）。用 `git checkout -- index.html` 回滚到已提交的 v4.217 后重做。

**教训**：补丁脚本的每一处 `rep()` 都要 `count==1` 校验并**先计算后写盘**，写盘放在最后一步；失败时文件保持原样。

### v4.217 / v4.218（2026-11-08）· 速度线页从「只能看」改成可交互.5 未做

- 表格里「定位」（速攻 / 空间 / 清场）目前只是徽标文字，没有说明点进去看含义。
- 「+1级强化」「特性×2」两列是纯参考乘区，也没有解释入口（顶部 tip 已整段说明，但列内无 tooltip）。

---

## v4.219（2026-11-08）· 速度表列义 tooltip + 定位筛选 chip 速度表列义 tooltip + 定位筛选 chip（v4.219）

18.19 把表格改成可点了，但**每一列的数字是什么仍然没有解释入口** —— 用户看到的 `546 / 609 / 669 / 913 / — / 1003` 六个数字只能靠顶部那段长 tip 去猜。

### v4.219（2026-11-08）· 速度表列义 tooltip + 定位筛选 chip.1 11 列表头全部加 `title`

| 列 | tooltip 内容 |
|---|---|
| `#` | 全库编号 |
| `物种` | 点击任意一行 → 打开完整详情 |
| `0努力` | 速度 EV 全不投的实速：`floor((2×种族速度+31+0/4+5)×性格1.0)` |
| `满速252中性` | 252 EV + 中性性格（不加速也不减速）的实速 |
| `极速252+性格` | 252 EV + 加速性格（+10%）—— **本表排序与分位都以这一列为准** |
| `围巾×1.5` | 讲究围巾 ×1.5（占道具位，不与特性乘区叠加） |
| `特性×2` | 天气/低血加速特性 ×2 后的实速（轻装 / 悠游自如 / 叶绿素 / 拨雪）；无此类特性显示 `—` |
| `+1级强化` | 速度 +1 级（高速移动 / 龙舞等）×1.5；不计入主表 |
| `分位` | 全库极速档排名分位 |
| `省EV建议` | 只求卡过 P50/P75 线时所需的最小速度 EV，省下的可挪去 HP |
| `定位` | 速攻：速≥100 且攻≥90｜空间：速≤60 且攻≥95｜清场：其余 |

同时给「分位」单元格也加了行级 `title`（`全库极速档排名：P94（数值越大越快，P90+ = 顶级速攻线）`）。

### v4.219（2026-11-08）· 速度表列义 tooltip + 定位筛选 chip.2 「定位」列从死文字改成可点 chip

原来三格只是「速攻 / 空间 / 清场」字符串。现在每格是一个带 `onclick` 的 span，点击直接调用已有的 `speedToggleFilter('role', …)` —— 与顶部筛选行是**同一个入口**，不加第二套口径：

```js
'<td><span onclick="event.stopPropagation();speedToggleFilter(\'role\',\''+
   (role==='fast'?'fast':(role==='space'?'space':'clear'))+'\')" '+
   'title="速攻：速≥100 且攻≥90｜空间：速≤60 且攻≥95｜清场：其余。点击按此定位筛选全表" '+
   'style="cursor:pointer;color:var(--accent);border-bottom:1px dashed currentColor;font-weight:600">'+
   (role==='fast'?'速攻':(role==='space'?'空间':'清场'))+'</span></td>'
```

**`event.stopPropagation()` 是必需的** —— 整行有 `onclick="openSpById(...)"`，不阻止冒泡会「点定位 chip 同时弹出详情弹层」。

### v4.219（2026-11-08）· 速度表列义 tooltip + 定位筛选 chip.3 实测

`role` 全库分布：**速攻 495 / 空间 258 / 清场 1153**（合计 1906，与 `n=1906` 一致）。

- 表头 `title` 覆盖 **11/11**；
- 表格内可点定位 chip **400 个**（当前显示 400 行）；
- 点「速攻」→ `window._spdFilter={"role":"fast"}`、chip 变绿、**未弹详情层**（`stopPropagation` 生效）；
- 点「空间」→ 表格 **259 行**（258 + 表头），逐行定位均为「空间」。

⚠ 一个容易误判的现象：点「速攻」后行数仍是 401，看起来像「筛选没生效」—— 实际是速攻有 495 只，超过「前 400」的显示上限，截断后仍是 400 行。**验证筛选是否生效要看 `filter state` 和 chip 高亮，不能只看行数。**

---

## v4.220 ~ v4.222（2026-11-08）· 可学招式表接入招式完整详情 可学招式表 → 招式完整详情（v4.220 ~ v4.222）

### v4.220 ~ v4.222（2026-11-08）· 可学招式表接入招式完整详情.1 起点：先确认「哪些表真的点不动」

用户「详细信息看不到」的诉求顺着查，先把同类表格全过一遍，避免改错对象：

| 表 | 位置 | 原先状态 |
|---|---|---|
| 速度线表 | `speedRenderTable` L6955 | 纯只读 → **v4.217/.218/.219 已修** |
| 招式反查表 | `renderMv` L3879 / `#mvTable` | **本来就整行可点**：`tr.onclick=function(){openMv(m)}`（L3897） |
| 特性反查卡 | `renderAbi` L6126 / `.abicard` | **本来就整卡可点**：`abiToggle(card)` |
| 物种可学招式表 | `renderMvSp(s)` L3846 / `#mvBodySp` | **只能点行展开一句描述**（`mvRow(this)`），没有完整详情入口 |

**所以真正缺入口的是第 4 张 —— 在宝可梦详情里看到「这只能不能学摔打」，想知道摔打到底是什么，点不进去。**

### v4.220 ~ v4.222（2026-11-08）· 可学招式表接入招式完整详情.2 v4.220 招式名可点

`renderMvSp` 的行渲染里，招式名列改为可点（整行仍保留「展开描述」，两种交互不冲突）：

```js
window._mvById=window._mvById||{};window._mvById[''+m[0]]=m;
html+='<tr class="mv" onclick="mvRow(this)"><td>'+r.way+'</td>'+
  '<td><span onclick="event.stopPropagation();openMvById(\''+m[0]+'\')" '+
  'title="点击查看 '+esc(m[1])+' 的完整详情（威力/命中/PP/先制/中文说明/机制提示/代价标签）" '+
  'style="cursor:pointer;color:var(--accent);font-weight:600;border-bottom:1px dashed currentColor">'+esc(m[1])+'</span>'+
  mvPhTag(m[0])+'</td>…';
```

新增 `openMvById(id)`：从 `window._mvById` 回查同一个对象，取不到就扫 `ERDATA.moves` 兜底 —— **不复制字段，详情视图与反查页共用同一份数据**。

### v4.220 ~ v4.222（2026-11-08）· 可学招式表接入招式完整详情.3 v4.221 z-index 抬高

招式详情的容器 `#mvDrawer` 与宝可梦详情的 `#spDrawer` **都是 `.modal`（z-index:80）**。`spDrawer` 是 `document.body.appendChild` 动态创建的，在 DOM 中更靠后 → 同层级时盖住 `mvDrawer`。

招式是比物种更深的一层，单独抬高：

```css
#mvDrawer{z-index:90}
```

### v4.220 ~ v4.222（2026-11-08）· 可学招式表接入招式完整详情.4 v4.222 真正的坑：mvDrawer 在 tab-mv 容器内

抬了 z-index 还是看不见。实测 `getComputedStyle(#mvDrawer).display === 'flex'`，但 `getBoundingClientRect()` **全是 0**：

```
rect={"x":0,"y":0,"width":0,"height":0,...}
```

**`display:flex` 却没有布局尺寸 = 祖先不渲染。** `#mvDrawer` 静态定义在「招式反查」tab 的容器里（L884），而 `openSp` 是从「宝可梦」tab 打开的 —— 当前 active tab 是 `core`，`tab-mv` 是 `display:none`，`position:fixed` 也不会让它在隐藏祖先下渲染。

修法：打开时先把它挂到 `body`（与 `spDrawer` 一致）：

```js
try{document.body.appendChild($('mvDrawer'))}catch(eMvMove){}
$('mvDrawer').classList.add('open');
```

修后 `rect = {0,0,1170,808}`、内层 `.mbox` 宽 820 ✓。

**这个坑的通用形态**：单文件 HTML 里弹层定义在某个 tab 容器内 → 从别的 tab 调用时「逻辑成功、视觉全无」，且 `display` 检查会骗人，必须看 `getBoundingClientRect()`。

### v4.220 ~ v4.222（2026-11-08）· 可学招式表接入招式完整详情.5 实测

皮卡丘（`openSpById('25')`）：
- `#mvBodySp` 120 行、**60 个可点招式名**（另一半是 `mvdesc` 描述行）；
- 点「摔打」→ `#mvDrawer` 显示，内容：`摔打 Slam #21 / 一般 / 物理 / 威力 95 / 命中 100 / PP 10 / 先制 0` + 英文原文 + 「本招为 ER 新增招式，官方中文说明暂缺」+ 「谁能学 共 51 只」精灵图卡网格 + 两个形态筛选开关；
- 叠在宝可梦详情之上可见（z 90 > 80）。

---

## v4.223 ~ v4.226（2026-11-08）· 超净属性修正 + 接触招式表 + ABI_DMG_MOD 接入 三个「已知但未修」的真实错误（v4.223 ~ v4.226）

这三条都是**工具现在算错**，不是覆盖面不足，所以优先于任何新增。

### v4.223 ~ v4.226（2026-11-08）· 超净属性修正 + 接触招式表 + ABI_DMG_MOD 接入.1 超净：属性登记错了（v4.223）

**症状**：`ABI_DMG_MOD` 里 `'超净':[{t:["毒"],mul:0.5}]`，但台账记录 `mechDefAdjOf` 对某只超净持有者返回 `defImm=['水']` —— 看起来两边矛盾。

**先拆矛盾再动手**：

| 疑问 | 结论 |
|---|---|
| 超净真的免水吗 | **不是**。卡比兽R #2677 的 `abis=["污泥浆","储水","超净"]`，「免水」来自**储水**，不是超净 |
| 超净真的减毒吗 | **不是**。源码 `if (moveType == TYPE_GHOST) RESISTANCE(.5)` |

源码（`src/abilities.cc:6980`）：

```cpp
constexpr Ability Impl<ABILITY_PURIFYING_SALT> = {
    .onDefensiveMultiplier =
        +[](ON_DEFENSIVE_MULTIPLIER) {
            if (moveType == TYPE_GHOST) RESISTANCE(.5);
        },
    .onStatusImmune = +[](ON_STATUS_IMMUNE) -> int {
        CHECK(status & CHECK_STATUS1)
        return TRUE;
    },
    .breakable = TRUE,
    .removesStatusOnImmunity = TRUE,
};
```

**口径**：幽灵招 ×0.5（`.onDefensiveMultiplier`）+ 免疫全部状态 + 免疫时清除已有状态。

**教训**：`mechDefAdjOf` 评估的是「这只**特性池**里有哪些机制」，不是「某个特性本身」。把整个池的结果归因到单条特性会得出假矛盾 —— 先看 `inns` / `abis` 再下结论。

### v4.223 ~ v4.226（2026-11-08）· 超净属性修正 + 接触招式表 + ABI_DMG_MOD 接入.2 接触招式：数据层没有这个信息（v4.224）

**症状**：`ABI_DMG_COND` 里 `毛茸茸` / `极致蓬松` / `液化` 都登记了 `{mul:0.5, when:'接触招式'}`，但 `dmgCondHit` 最后是 `return false; /* 认不出的条件不计 */` —— **这三条的 ×0.5 从来没生效过**。

**为什么认不出**：`ABI_DMG_COND` 的条件只有 `物理招式` / `特殊招式` / `满血时` / `效果绝佳` / `会心` / `沙暴` / `冰雹` / `攻方是X属性`，没有「接触」。而**「接触」≠「物理」**——特殊招里也有接触的。

**数据层能用吗**：不能。实测 `ERDATA.moves` 的 ldesc 里 `contact` 字样只有 **8 条**、edesc 只有 5 条，而物理招有 469 个没有该字样。项目里 `L10921` 那处 `(m[10]||'').indexOf('contact')>-1`（硬爪判定）命中率极低，是**隐性失效**。

**正确来源**：源码 `battle_moves_master.h` 每招的 `.flags`：

```cpp
[MOVE_POUND] =
{
    .effect = EFFECT_HIT,
    ...
    .flags = FLAG_MAKES_CONTACT | FLAG_PROTECT_AFFECTED | ...,
    .split = SPLIT_PHYSICAL,
},
```

提取方法（`%TEMP%\extract_contact.py`）：
1. `moves_master.h` 抓 `#define MOVE_(\w+) (\d+)` → 950 个 id
2. `battle_moves_master.h` 按 `[MOVE_XXX] = {` 分块 → 950 块
3. 块内含 `FLAG_MAKES_CONTACT` 即接触 → **318 条**

内联进页面为 `var MV_CONTACT={1:1,2:1,...}`，配 `mvIsContact(id)`。

**验证**：拍击 1 / 空手劈 2 / 飞翔 19 / 摔打 21 / 撞击 33 / 火焰拳 7 / 连续拳 4 / 百万吨重拳 5 全部接触；十万伏特 85 / 精神强念 94 / 旋风刀 13 / 起风 16 / 吹飞 18 全部非接触 ✓

同时补上「X属性招式」条件（此前 `毛茸茸` 的 `when='火属性招式（这是增伤，自找弱点）'` 也认不出）：

```js
if(/接触招式/.test(when))return mvIsContact(o&&o.moveId);
if(/(\S+?)属性招式/.test(when)){
  var mt=when.match(/(\S+?)属性招式/)[1];
  return mType===mt;                       /* 招式属性（非攻方属性） */
}
```

**实测毛茸茸（卡蒂狗 #58，`inns` 第三条）**：

| 招式 | 判定 | abiMul |
|---|---|---|
| 火焰拳（火·接触） | 火×2 + 接触×0.5 | **1.0** |
| 拍击（一般·接触） | 接触×0.5 | 0.5 |
| 连续拳（一般·接触） | 接触×0.5 | 0.5 |
| 喷射火焰（火·非接触） | 火×2 | 2.0 |
| 十万伏特 / 精神强念 | — | 1.0 |

**这是源码 `RESISTANCE(2.0)` 与 `MUL(0.5)` 叠加的真实结果** —— 火属性接触招净 1 倍，不是 2 倍也不是 0.5 倍。

### v4.223 ~ v4.226（2026-11-08）· 超净属性修正 + 接触招式表 + ABI_DMG_MOD 接入.3 ABI_DMG_MOD 整表没进伤害计算（v4.225）

**症状**：F72 断言「超净 幽灵 ×0.5」失败，返回 1。查下去发现 **`ABI_DMG_MOD`（15 条按属性的固定受伤倍率）全文件只有 1 处读取点**：L3791 的详情卡渲染。`dmgDefAbiMul` 只读 `ABI_DMG_ALL`（11 条不分属性）+ `ABI_DMG_COND`（32 条条件型）。

**也就是说 15 条「某属性打过来固定 ×N」的特性从来没算进伤害。**

接入时必须排除两类重复乘（这是 v4.211 干燥皮肤 `2×1.25×1.25=3.125` 的同型陷阱）：

```js
var dmr=(typeof ABI_DMG_MOD!=='undefined')?ABI_DMG_MOD[n]:null;
if(dmr&&!(ABI_TAG_PATCH&&ABI_TAG_PATCH[n])&&n!=='干燥皮肤'){
  dmr.forEach(function(x){
    if(!x.t||x.t.indexOf(mType)<0)return;
    m*=x.mul;hit.push(n+'·'+mType+'×'+x.mul);
  });
}
```

| 排除项 | 原因 |
|---|---|
| `ABI_TAG_PATCH` 里已登记的 11 条（厚脂 / 熔岩铠甲 / 遇水凝固 / 黑暗亲和 / 毒素吸收 / 引冰 / 食土 / 蓄水器 / 散热器 / 闪电形态 / 熔核） | 相性层 `defCellTrio` 已经把 `opt()` 乘过 |
| `干燥皮肤` | `mechRw` 机制层 `ma.down` 已把 `opt` 乘了 ×1.25 |

**其余 10 条**（超净 / 免疫 / 化石化 / 厚脂肪 / 原木 / 坚实基础 / 洁净之盐 / 深度冻结 / 耐热 / 重金属）机制层实测为空，安全接入。

**实测**：

| 特性 | 招式 | 结果 |
|---|---|---|
| 超净 | 暗影球（幽灵） | 0.5 |
| 超净 | 剧毒（毒） | 1（修正前会误算 0.5） |
| 免疫 | 剧毒（毒） | 0.5 |
| 厚脂肪 | 火焰拳（火） | 0.5 |
| 原木 | 能量球（草） | 0.5 |
| 坚实基础 | 水枪（水） | 0.5 |
| 洁净之盐 | 暗影球（幽灵） | 0.5 |
| 深度冻结 | 火焰拳（火） | 0.5 |
| 耐热 | 火焰拳（火） | 0.5 |
| 重金属 | 暗影球（幽灵） | 0.5 |
| 厚脂 / 熔岩铠甲 / 遇水凝固 / 黑暗亲和 / 干燥皮肤 | — | **全部 1**（正确排除） |

### v4.223 ~ v4.226（2026-11-08）· 超净属性修正 + 接触招式表 + ABI_DMG_MOD 接入.4 详情卡文案改口（v4.226）

原句「标了属性的条目同时计入上图弱点倍率」是错的 —— 能改相性图的是 `ABI_TAG_PATCH`（另一批特性），`ABI_DMG_MOD` 只进伤害判定。改成：

> 🛡 受到伤害倍率（源码 .onDefensiveMultiplier；这些倍率已计入伤害判定，但**不改**上图属性克制倍率——能改相性的是另一批「相性改写」特性）

### v4.223 ~ v4.226（2026-11-08）· 超净属性修正 + 接触招式表 + ABI_DMG_MOD 接入.5 断言（F67 ~ F72，probe 共 83 项）

| 断言 | 内容 |
|---|---|
| F67 | 接触招式表 318 条 |
| F68 | 摔打接触 / 十万伏特非接触 |
| F69 | 毛茸茸·一般接触招 ×0.5 |
| F70 | 毛茸茸·火接触招抵消为 1 |
| F71 | 毛茸茸·火非接触招 ×2 |
| F72 | 超净 幽灵×0.5、毒×1 |

---



---

## v4.227 ~ v4.229（2026-11-08）· 防守侧条件型相性改写五条 + 进攻侧雾眼

> 详细版见 `docs/research/ER通用机制与源码口径_20261108.md` 的 **18.23**。

### 做了什么

源码 `.onAfterTypeEffectiveness` 上还有一类特性是 **`APPLY_ON_TARGET`** ——
**防守方特性改写「自己受到的相性」**，方向与 18.18 的 `ABI_TE_CALC`（攻方改写守方）相反，
不能混表。这五条还全都带前置条件：

| 特性 | 源码 | 行为 |
|---|---|---|
| 太晶甲壳 #607 | `abilities.cc:7754` | HP 全满时 `*mod >= 1.0 → 0.5` |
| 占卜大师 #773 | `abilities.cc:9504` | 入场 4 回合内 `*mod >= 1.0 → 0.5` |
| 雾眼 #967 | `abilities.cc:11539` | 雾天幽灵招：防守侧封顶 0.5 / 进攻侧 ×1.5 |
| 钢能力者 #200 | `abilities.cc:2725` | 自身含钢时 恶/幽灵 `*mod /= 2` |
| 神奇守护 #25 | `abilities.cc:769` | `*mod < 2.0 → 0` |

新建 `ABI_TE_DEF_COND`（5 条）+ `abiTeDefCondOf(s,at,cur,wx)`，三种 `mode`：
`cap`（压到）/ `mul`（乘以）/ `zeroIfNotSE`（非绝佳归零）。
`need` 五种：`maxhp` / `turn4` / `fog` / `selfSteel` / `se`。

`defCellTrio(s,at,pickOv)` 加**第四参 `wx`**（天气，可选，不传即不计 → 20 多个既有调用点不受影响），
改写插在 `mechRw` 后、只动 `opt` 不动 `inn`，返回多一个 `teWhys`。

进攻侧新建 `ABI_ATK_COND`（1 条：雾眼雾天幽灵 ×1.5），`dmgAtkAbiMul(sA,mType,wx)` 加第三参，
`dmgCalc` 传 `(o&&o.weather)||''`。

详情卡 `abiDesc` 新增「✨ 相性改写」区块，把「什么条件下才改倍率」写明白。

### 实测

- 太晶甲壳 · 太乐巴戈斯 #1024：格斗 2→**0.5**、火/水/一般 1→**0.5**、幽灵 0→0（免疫不动）
- 神奇守护 · 脱壳忍者 #292：火 2→**2**、幽灵 2→**2**、水 1→**0**、格斗/一般 0→0
- 雾眼 · 超级龟足巨铠 #1886：幽灵招 无雾 1 / 雾天 **0.5**；进攻侧 1 / **1.5**
- 占卜大师、钢能力者：**数据层持有者 = 0**，登记备查

### 又踩一次同一个坑

断言里查 `abis` 找太晶甲壳/神奇守护返回 null，误判补丁没生效。
**它们挂在 `inns`（天性）上**。`abis` 和 `inns` 必须都查 ——
18.22 已经因为「飘浮 158 物种全在 `inns`」吃过一次，本段又吃一次。

### 反证数据层

钢能力者文案「钢属性招式威力 1.3 倍」是错的。
`ATE_ABILITY` 宏（`abilities.cc:295`）只有 `.onMoveType`（一般→钢）+ `.onStab`（转换后计本系），
**没有 `.onOffensiveMultiplier`**。真实收益是「一般招变钢 + 吃钢本系 ×1.5」。
而防守侧那条（恶/幽灵 ×0.5）数据层完全没写，是本段补的。

### 门禁

语法 `node --check` = 0 ｜ `smoke.js` 32/32 ｜ `probe_sp_abi_detail.py` **90 项 ALL PASS**（新增 F73~F79）

### 版本

`v4.227`（防守侧表）→ `v4.228`（进攻侧雾眼）→ `v4.229`（详情卡区块），1,615,736 B。

---

## v4.230 / v4.231（2026-11-08）· 进攻侧纯属性增伤 16 → 25 条

> 详细版见 `docs/research/ER通用机制与源码口径_20261108.md` 的 **18.24**。

### 起点

18.23 顺带发现 `ABI_ATK_MOD` 只有 16 条，而源码挂 `.onOffensiveMultiplier` 的块有 **131 个**。
全量提取后：真正 `MUL()` 增伤 **90** 个 / `-ate` 转换 4 个 / 改能力项 2 个 / 其余 announce 35 个。

90 个里「看起来只靠 moveType」的有 72 个，但其中 45 个实际依赖招 flag / 物理特殊 / 目标状态 / 场地 / 天气。
把 `weather`/`terrain`/`hp`/`state`/`status`/`party`/`flag`/`moveflag`/`split`/`aura`/`target` 全部排除后，
**真正纯属性只剩 27 条**。

### 补的 9 条

| 特性 | 属性 | 倍率 | 持有者 |
|---|---|---|---|
| 暗黑气场 | 恶 | 1.33 | 12 |
| 妖精气场 | 妖精 | 1.33 | 14 |
| 南极鸟 | 飞行/冰 | 1.3 | 10 |
| 深度冻结 | 冰/水 | 1.25 | 6 |
| 战争贩子 | 格斗/岩石/钢 | 1.3 | 1 |
| 恶作剧礼物 | 冰 | 1.5 | 1 |
| 停电 | 电 | 2.0 | 1 |
| 搬岩 | 岩石 | 1.5 | 0（备查） |
| 等离子灯 | 电/火 | 1.2 | 0（备查） |

净结果：`ABI_ATK_MOD` **16 → 25** 条，「有物种持有」**6 → 13** 条。

### 两个源码细节

**暗黑气场 / 妖精气场是 `APPLY_ON_ANY`** —— 场上任何人（含对手）的属性招都吃这个加成，且
`if (IsAbilityOnField(... auraBreak ...)) MUL(.75) else MUL(1.33)`。
工具按「持有者 = 我方出战术」静态近似处理，详情卡注明前提。

**深度冻结两条钩子各自独立**：
进攻 `.onOffensiveMultiplier` 冰/水 ×1.25（本段补）、防守 `.onDefensiveMultiplier` ×0.5（早就有）。
不能因为防守侧有就以为整个特性有了。

### 未接的 45 条：不是漏接，是静态算不了

依赖招 flag / `IS_MOVE_PHYSICAL` / 目标状态 / 己方状态 / 场上他人 / 回合 / 场地 / 天气。
但这批里 **招 flag 类其实可以静态化**（与 18.22 的 `FLAG_MAKES_CONTACT` 同源，能从 `battle_moves_master.h` 逐招提取）：
强颚 `FLAG_STRONG_JAW_BOOST` ×1.3、尖锐之牙 `MOVE_FLAG_KEEN_EDGE` ×1.3、
场地探索者 `FLAG_FIELD_BASED` ×1.5、朋克摇滚 `FLAG_SOUND` ×1.3 等 —— 这是下一批。

### 实测

17/17 全对（暗黑气场恶 1.33 / 火 1；妖精气场妖精 1.33 / 恶 1；南极鸟冰·飞行 1.3 / 火 1；
深度冻结冰·水 1.25 / 火 1；战争贩子格斗·钢 1.3 / 火 1；恶作剧礼物冰 1.5 / 火 1；停电电 2 / 水 1）。

### 门禁

语法 0 ｜ `smoke.js` 32/32 ｜ `probe_sp_abi_detail.py` **93 项 ALL PASS**（新增 F80~F82，F63 改 25 条）

### 工具教训（第二次踩）

改 probe 断言用了 PowerShell `Set-Content -Encoding UTF8`，整个文件换行符被统一重写，
git diff 显示 719 insertions / 698 deletions。功能没坏但污染了 diff。
**改文件一律用 Python `io.open(..., newline='')`。**

### 版本

`v4.230`（+3 条）→ `v4.231`（+6 条），1,617,232 B，线上 SHA1 `25F90113E2036ED0D57063AA26A3AF8AE1529199`（VERIFIED-MATCH）。


---

## v4.232 ～ v4.235：招 flag 静态化 + `.onModifyMoveFlags` + 速度列

### v4.232 招 flag 进进攻乘区（124 只物种首次计入）

`battle_moves_master.h` 每个招式块都有 `.flags`，能逐招提取（与 18.22 的 `FLAG_MAKES_CONTACT` 同源）。
7 类首批：`jaw` 25 / `sound` 36 / `reckless` 18 / `sheer` 255 / `field` 15 / `dance` 11 / `bone` 5。

实现：内联 `MV_FLAG`（纯 id 逗号串）+ `mvHasFlag(id,k)`；
`ABI_FLAG_ATK`（5 条）；`dmgAtkAbiMul` 加第四参 `mvId`；`dmgCondHit` 加四条分支；
`ABI_DMG_COND` 增 `'庞克摇滚':[{mul:0.5,when:'声音招式'}]`。

**实测**：咬住#44→1.3 / 叫声#45→1.3 / 飞踢#26→1.2 / 火焰拳#7→1.3；防守侧声音招 0.5。

### v4.233 重扫 flag 全量：7 类 → 11 类（456 招）

18.25 的方法有个根本错误：**拿着猜到的特性名去反查 flag**，等于先猜答案再验题。
改为**先把 `battle_moves_master.h` 里出现的全部 32 个 flag 常量列全**，再逐个找谁吃它。

补出 4 类：

| flag | 招数 | 特性 | 中文 | 倍率 | 持有者 |
|---|---|---|---|---|---|
| `FLAG_MEGA_LAUNCHER_BOOST` | 78 | MEGA_LAUNCHER L2417 | 超级发射器 | ×1.3 | 38 |
| `FLAG_KEEN_EDGE_BOOST` | 47 | KEEN_EDGE L3662 | 锐利之刃 | ×1.3 | 0 |
| `FLAG_IRON_FIST_BOOST` | 31 | IRON_FIST L1503 | 铁拳 | ×1.3 | 47 |
| `FLAG_STRIKER_BOOST` | 17 | STRIKER L4619 | 猛踢 | ×1.3 | 0 |

**同时修正一个错常量名**：`FLAG_RECKLESS` 实为 **`FLAG_RECKLESS_BOOST`**（18.25 是子串凑巧命中）。

三个薄壳 `IsMegaLauncherBoosted` / `IsIronFistBoosted` / `IsStrikerBoosted` 都在
`battle_util.c:9491-9499`，走 `DoesMoveMatchFlag`。

**实测端到端**：`dmgCalc` 超级发射器 + 水枪 lo=38 hi=45 vs 无特性 lo=29 hi=35，比率 1.286（×1.3 取整损耗）。

### v4.234 `.onModifyMoveFlags`：特性把招「当成」某一类

`include/abilities.hh:125` 有 7 个抽象 `MoveFlag`；`DoesMoveMatchFlag`（`abilities.cc:331`）
先查原始 `FLAG_*`，没命中再问各特性自己的 `onModifyMoveFlags` —— **是 `or` 关系，不是叠加**。

12 个带该钩子的特性里只有 3 个同时带 `onOffensiveMultiplier`：

- `GUNMAN` **枪手** L9602：`= MEGA_LAUNCHER` ×1.3
- `BACKSTREET_BOY` **后街男孩** L11670：`= STRIKER` ×1.3，额外把 `FLAG_DANCE` 算踢类
- `CHESTNUT_AXE` **栗子斧** L11809：`= KEEN_EDGE` ×1.3，额外把**所有草属性**招算锐利

其余 9 个只是「把类别借给别人的特性」，工具不模拟场上他人特性 → 不接。

实现：`ABI_FLAG_ATK` 的 `k` 改数组形式 + 可选 `t` 属性，`ok` 置真后**只乘一次**（精确对应 `or`）。

### v4.235 速度线页「特性×2」整列 `—`

用户贴图说「这个就只能看吗，详细信息完全看不到」。三层原因：

**① 只查 `s.abis` 不查 `s.inns`（第 4 次踩）**——古代活性 16 只全部在 `inns` 里，一只都看不到；
悠游自如 inns=7 / 叶绿素 inns=10 / 飞毛腿 inns=13 同样被漏。

**② 倍率写死 ×2，源码里只有轻装是真 ×2**

```cpp
// L868  SWIFT_SWIM   雨天  *stat *= 1.5
// L876  CHLOROPHYLL  晴天  *stat *= 1.5
// L2752 SLUSH_RUSH   冰雹  *stat *= 1.5
// L1450 UNBURDEN 轻装        *stat *= 2   ← 唯一
```

**③ 名单只覆盖 4 个，源码实际 14 个**

新建 `SPD_ABI`（14 条，每条带源码行号）+ `spdSpeedAbiOf(s)`（`abis`+`inns` 合并查、
加速项优先、多加速取最高、全无加速才返回减速项）。
配套修三处硬编码 ×2：`spdWeatherVal`、`spdModMul`（有效速度轴实算卡）、详情弹窗 chip（`天气×2` → `特性×`+动态倍率）。

列名 `特性×2` → **`特性加速`**；单元格从光秃数字改成「大号数值 + 小字『特性名 ×倍率（条件）』」。

**实测**：飞腿郎轻装 ×2 = 600 / 雄伟牙古代活性 450 / 哥达鸭悠游自如 442 / 小拉达飞毛腿 400。
页面渲染：敏捷虫 → `854 轻装 ×2（消耗掉道具后）`；帕路奇亚-起源形态 → `624 悠游自如 ×1.5（雨天）`。

同时验证整行点击链路：`spDrawer` 1487×1108、内层 `.mbox` 820×909，含种族值条/配速建议/
超速滑块/多目标配速对比表 —— **弹层是通的，「看不到」真正原因是那一列本身没有可读信息**。

### 门禁

语法 0 ｜ `smoke.js` 32/32 ｜ `probe_sp_abi_detail.py` **112 项 ALL PASS**（新增 F87/F88）

### 踩坑（v4.235）

`s.find` 返回 -1 后切片：`s[:i]` 退化成 `s[:-1]`、`s[j:]` 从中间切走，文件被写成 2,460,187 B；
`node --check` 仍返回 0，是 `smoke.js` 掉到 29/32 才暴露。回滚后改用带 `<td class="` 前缀的精确锚点。
**任何按位置切片的补丁必须先 `if i < 0: raise`，替换前 `print(repr(old))` 核长度。**

### 版本

| 版本 | 字节 | SHA1 | 状态 |
|---|---|---|---|
| v4.232 | 1,620,439 | `379B88940B860FF6E327A888BE0E847DCDEB2E18` | VERIFIED-MATCH |
| v4.233 | 1,621,893 | `C4BF136C815387BF64A400118F1DDE3FBC7300AA` | VERIFIED-MATCH |
| v4.234 | 1,622,799 | `E192962D86FE818CC4A02B2EA0780252BA29A884` | VERIFIED-MATCH |
| v4.235 | 1,625,196 | `E7B1F91B1E3C8F73A02FAECBD9E5225A6BD7B645` | VERIFIED-MATCH |
| v4.236 | 1,629,493 | `CFB2D212AF0272D74A840A9B925615802B2486F9` | VERIFIED-MATCH |

### 仍是「静态算不了」的

约 45 条 `.onOffensiveMultiplier` 依赖 `IS_MOVE_PHYSICAL`/目标状态/己方状态/场上他人/回合/场地/天气。
`FLAG_WEATHER_BASED`（14 招）只被 `DELTA_STREAM` 的 `.onImmune` 使用，是免疫判定不是增伤 → 证伪，不接。
`Dual Shadow`（恶/电 ×1.35）数据层无中文名，跳过。
暗黑/妖精气场是 `APPLY_ON_ANY`，工具近似为「只算自己」，`auraBreak → ×0.75` 未建模。


---

## v4.236：进攻侧条件型增伤 —— 18.24 判「算不了」的那批，一半能算

### 结论先行

18.24 把 63 条 `MUL()` 一块标注为「静态算不了」。实际其中一大批的条件**不依赖战斗进程**，
只依赖「这一招是什么」：物理/特殊、基础威力、是否接触、是否声音、相性是否≥2、是否会心。
这六个都能从 `ERDATA.moves[id][3][4][5]` + `MV_CONTACT` + `MV_FLAG` + `defCellTrio().opt` + `o.crit` 读出来。

### 关键：先查作用域，再看倍率

`.onOffensiveMultiplier` 有姊妹字段 `.onOffensiveMultiplierFor`：

```cpp
// include/abilities.hh:148-149
APPLY_ON_ALLY      = 1 << 0,                            // 同伴，含自己
APPLY_ON_ALLY_ONLY = APPLY_ON_ALLY | APPLY_IGNORE_SELF,  // 同伴，排除自己
```

全量扫只有 3+3+2：`ALLY_ONLY` = `BATTERY` 蓄电池 / `POWER_SPOT` 能量点 / `MOSH_PIT`；
`ANY` = `DARK_AURA` / `FAIRY_AURA` / `PIXIE_POWER`（命中非伤害）；`ALLY` = `STEELY_SPIRIT` / `AIRBORNE`。

**`能量点` 源码是 `{ MUL(1.3); }`，看上去最该接，但紧跟 `APPLY_ON_ALLY_ONLY`** —— 只给同伴，
持有者自己一点不加。单打视角接进来等于白送 30% 伤害。`蓄电池` 同理。**这两条已撤回。**

### 接入 10 条（覆盖 214 只物种）

| 特性 | 倍率 | 条件 | 持有者 | 源码判定 |
|---|---|---|---|---|
| 活力 HUSTLE | ×1.4 | 无条件 | 37 | `MUL(1.4)` |
| 远隔 LONG_REACH | ×1.2 | 物理招 | 43 | `IS_MOVE_PHYSICAL` |
| 毒焰钳 VENOBLAZE_PINCERS | ×1.2 | 物理招 | 2 | `IS_MOVE_PHYSICAL` |
| 一猩一意 GORILLA_TACTICS | ×1.5 | 物理招 | 14 | `IS_MOVE_PHYSICAL` |
| 贤者之力 SAGE_POWER | ×1.5 | 特殊招 | 10 | `IS_MOVE_SPECIAL` |
| 技术高手 TECHNICIAN | ×1.5 | 威力≤60 | 66 | `basePower <= 60` |
| 健壮胸肌 BIG_PECKS | ×1.3 | 接触招式 | 27 | `IsMoveMakingContact` |
| 脑核之力 NEUROFORCE | ×1.35 | 相性≥2.0 | 14 | `>= GetSuperEffectiveMult()` |
| 狙击手 SNIPER | ×1.5 | 会心时 | 35 | `if (isCrit)` |
| 湿润之声 LIQUID_VOICE | ×1.2 | 声音招式 | 8 | `IsSoundMove` |

**技术高手 66 只**：配招门控里一直写着「威力≤60 ×1.5」，但实际伤害计算里从来没查过它 ——
典型的「文档写了、代码没做」。这一版补上。

### 实现

```js
var ABI_ATK_KIND={ '活力':{mul:1.4,need:'',src:'…'} … };   // 10 条
function abiAtkKindOk(need,ctx,mvId){ … }   // need: ''/phys/spec/pow60/contact/se/crit/sound
function dmgAtkAbiMul(sA,mType,wx,mvId,ctx)  // 第五参 ctx（v4.236 新增）
```

`dmgCalc` 传 `{isPhys, spec:(split==='特殊'||split==='特殊(取防御)'), pow:bp, contact:mvIsContact(...), eff:eff, crit:!!o.crit}`。
**`spec` 必须带 `'特殊(取防御)'`** —— ER split 是 7 值枚举，漏掉会少算精神冲击/精神击破/神秘之剑/魔法叶 4 招。

### 实测（全对）

活力 1.4 ｜ 技术高手[40]=1.5 [85]=1 ｜ 一猩一意[物理]=1.5 [特殊]=1 ｜ 贤者之力[特殊]=1.5 [物理]=1 ｜
远隔[物理接触]=1.2 [物理非接触]=1.2 [特殊]=1 ｜ 健壮胸肌[接触]=1.3 [非接触]=1 ｜
脑核之力[相性2]=1.35 [相性1]=1 ｜ 狙击手[会心]=1.5 [普通]=1 ｜ 湿润之声[声音]=1.2 [非声音]=1

**误判记录**：首轮用「水枪 #55」当物理招代表，`一猩一意`/`远隔`/`毒焰钳` 全返回 1，看着像 bug。
实际水枪在 ER 是**特殊招**（`属性水 特殊 威力40`）。换 `#1 拍击` / `#6 聚宝盆` / `#13 旋风刀` 后全对。
**探针挑代表招式必须读 `mv[4]`，不能按名字猜。**

### 详情卡「⚔ 进攻增伤」

`abiDesc` 在「🛡 受到伤害倍率」之后插入「⚔ 进攻增伤」区块，统一读 `ABI_ATK_MOD` / `ABI_ATK_COND` /
`ABI_FLAG_ATK` / `ABI_ATK_KIND`。文案明确写「只放大**自己打出去**的伤害，与上面的减伤方向相反」——
同卡上两组倍率方向相反，不点明会被误读。

**踩坑**：`src` 最初写 `'IS_MOVE_PHYSICAL'` / `'basePower<=60'` 这种源码原文，渲染出来全是空括号 `（）`。
`esc()` 内部走 `scrubLeak`，命中 `[A-Z][A-Z0-9]*_[A-Z0-9_]+` 就整段清空。改中文描述后正常。
**凡是要进 `esc()` 的字符串，不能带大写+下划线的标识符。**

### 顺带证伪：两条死代码

`MEGA_DRILL`（`if (gBattleMoves[move].drill)`）与 `PHOTOKINESIS`（`.light`）：
`include/pokemon.h:289` 有 `u8 drill:1;` 字段声明，但全仓 `.drill = TRUE` / `.light` **零赋值**，
分支永不触发。两条特性数据层也无持有者。**按源码判定为死代码，不接。**

### 门禁

语法 0 ｜ `smoke.js` 32/32 ｜ `probe_sp_abi_detail.py` **113 项 ALL PASS**（新增 F89）

```
F89: N=10 无ALLYONLY=OK 活力=1.4 远隔P=1.2 远隔NP=1.2 远隔S=1 猩P=1.5 猩S=1 钳P=1.2 钳S=1
     贤S=1.5 贤P=1 技低=1.5 技高=1 胸C=1.3 胸N=1 核SE=1.35 核N=1 狙C=1.5 狙N=1 声S=1.2 声N=1
```

### 版本

`v4.236`，1,629,493 B，`CFB2D212AF0272D74A840A9B925615802B2486F9`（VERIFIED-MATCH），commit `01e2b7e`。

### 仍未接（真算不了）

毅力/决心/中毒激升（需自身异常）｜蹲守（目标首回合）｜幻影（illusion）｜分析（回合顺序）
｜复仇者（side timer）｜好胜（双方性别）｜公主的恩赐（目标降能力）｜无精打采（slowStartTimer）
｜超级狙击手（转调+额外队列）｜武术 `MARTIAL_ARTS`（数据层无中文名）


---

## v4.237：状态型进攻增伤 + 修掉 `surviveSolve` 断链

### A. 状态型进攻增伤（毅力 / 决心 / 中毒激升，47 只物种）

18.29 把这三条归入「静态算不了」，理由是「需自身异常状态，工具无此输入」。查源码后发现只对一半 ——
条件确实需要状态，但**函数名骗人**：

```cpp
// src/battle_util.c:9362
int HasAnyStatusOrAbility(int battler) {
    if (gBattleMons[battler].status1 && STATUS1_ANY) return TRUE;
    if (IsComatose(battler)) return TRUE;
    if (IsBloodStainAffected(battler)) return TRUE;
    return FALSE;
}
```

名字里有 Ability，**实际跟特性毫无关系**：任意异常 / 梦游 / 血染。

| 特性 | 条件 | 倍率 | 持有者 |
|---|---|---|---|
| 毅力 GUTS | `HasAnyStatusOrAbility` + 物理 | ×1.5 | 38 |
| 决心 DETERMINATION | `HasAnyStatusOrAbility` + 特殊 | ×1.5 | 5 |
| 中毒激升 TOXIC_BOOST | `status1 & STATUS1_POISON_ANY` + 物理 | ×1.5 | 4 |

**输入面**：`dmgCalc` 加 `o.stA`，三档 `''` / `'any'`（任意异常）/ `'poison'`（中毒或剧毒）。
UI 在伤害面板加 chip 行 `攻方状态：无 / 异常 / 中毒`。

**新增 need 分支**：`stPhys` / `stSpec` / `poison`。前两个只判 `ctx.stA` 非空（中毒也是异常），
`poison` 才做严格等值。

**最关键的一格**：`中毒激升 × 物理 × 异常 = 1` —— 如果 `poison` 分支也写成「非空即触发」，
玩家选「异常」就会白拿 1.5，而那实际只是灼伤。

### B. `surviveSolve` 断链（既有 bug，从 v4.95 一直坏到现在）

**现象**：CDP 里调 `dmgRender('dmgOut2')`，拿到 `渲染错误: surviveSolve is not defined`，每次必现。

**定位**：`grep surviveSolve index.html` 只有 **2 处命中，全是调用点**：

```js
/* v4.95 A：防守向反推（同输入面，反向解「扛 N 下」） */
var sv1=surviveSolve(o,1),sv2=surviveSolve(o,2);
```

`function surviveSolve` / `surviveSolve=` 搜索均 0 命中。`dmgRender` 整体包在 `try{}catch{}`，
`ReferenceError` 被兜成「渲染错误」，**整个伤害判定面板（OHKO 判定 / 命中期望 / 16 段分布 / 耐久反推）全部不显示**。

这就是「🛡 耐久反推 · 扛 N 下」从用户视角从未出现过的真实原因 —— 不是算得不对，是整块渲染挂在最后一步。

**重建**：`ohkoSolveEv` 是攻方向反解（扫 `evA` 到 `r.lo>=hpD`），守方向对称扫 (HP EV, 防御 EV)。

两个必须记住的点：

1. **`dmgCalc` 的 `evD` 是一个数字，只作用于 `dIdx`（由物理/特殊决定物防还是特防），不影响 HP。**
   HP 必须另按 `dmgStatOf(bstI(sD,0), hpEv, 31, 0, '')` 算。
2. 外层 `hpEv` 递增 + 内层 `break` + 外层 `break`，拿「第一个 HP 档里最小防御投入」，
   不要收集全部解再排序（64×64=4096 次 `dmgCalc` 会卡）。

**复核**：波波拍击 → 小拉达（伤害 58–68 / HP 96），扛 1 下 `hpEv0/defEv0` ✓；
扛 2 下 `hpEv0/defEv196`（max 降到 46，46×2=92<96）✓。

**误判记录**：首轮用「拍击 → 耿鬼」测，返回 `HP+0 / 物防+0` 看着像没算。
实际拍击对幽灵相性 ×0，伤害恒 0，一行 EV 都不用给 —— 是正确解。换一般系打普通系才看得出门槛。

### 门禁

语法 0 ｜ `smoke.js` 32/32 ｜ `probe_sp_abi_detail.py` **115 项 ALL PASS**（F89 改 N=13，新增 F90）

```
F90: 毅力P0=1 毅力P1=1.5 毅力P毒=1.5 毅力S1=1 决心S0=1 决心S1=1.5 决心P1=1
     中毒P0=1 中毒P1=1 中毒P毒=1.5 中毒S毒=1
```

### 版本

`v4.237`，1,632,482 B。
