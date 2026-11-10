# AGENTS.md — Elite Redux 存档解析项目（唯一入口）

> 本项目 = Pokémon Elite Redux（GBA 改版，基版绿宝石 BPEE）的 .sav 存档解析工具链。
> 本文档是唯一入口/目录/准则：新接手者先读本文，即可掌握全貌。
> 开发流程准则：**设计 → 对齐 → 实施 → 测试 → 回归**；改动后先自测再交付。

> **版本真相源（2026-11-07 登记）**：`index.html` 的 `ER_ENGINE_VER` 是唯一版本依据（当前 **v4.255**，与线上逐字节一致）。
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
├── 配招助手_ER.html                 ← **兼容跳转页（1,673 B）**：`<meta refresh>` 自动跳 index.html，防老链接 404；带 `noindex`，不承载任何功能（详见 docs/dev/仓库与分支说明.md §3）
├── ~~data.js~~                       ← **已退役**（v4.179 数据源合一）：与三分片逐键等价（26/27 键 diff=0，唯一多出的 `sprites` 是空对象且页面零引用）后删除，归档于 `archive/data.js.v4.179_full_snapshot`（2,456,845 B）。运行时分片改为 `data_lite_v498.js` / `data_species_v498.js` / `data_adv_v498.js`，**不得回归**
├── 配招工具_data.js                 ← **构建链输入（6,884,918 B），浏览器不加载、不部署**；被 `tools\rebuild_source_inputs.py` / `check_rebuild_faithful.py` / `probe_v464.py` / `probe_v49.py` 引用，是三分片能重建的依据，**勿删**
├── nn_data\mech_lib_v412.json              ← ★v4.12 机制知识库（52 机制 / 156 combo / 40 词汇，meta version3 / schema v412 / updated 2026-10-10；既有 28 条逐字保留 + 24 新机制 + 32 新 combo，全部带来源 URL）
├── nn_data\smogon_prior_2026-09.json       ← ★v4.12 Smogon 标准对战先验（120 物种 / 2335 行，gen3ou×1.0 + gen9nationaldex×0.5，srcMax=0.516601 与既有 usagePrior 锚点逐位一致；引擎 SMOGON_PRIOR_ENABLED 开关消费、置 false 逐字节回退 v4.11）
├── nn_data\axis_lib.json                   ← ★15 协同轴知识库（v4.9 七字段逐字不动 + v4.12 每轴新增「体系模板」键：六位完整体系设计 15 轴×6 位=90/90）
├── docs\dev\仓库与分支说明.md         ← ★**仓库结构内部口径**：master/gh-pages 两条线的关系（「线上正常但首页显示旧提交」的成因）、分支清单与能否删、两个 HTML 入口、运行时文件 vs 本地源料、75 MB 体量构成、版本号三处同步护栏
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

## v4.240（2026-11-09）· 两处 UI 缺陷修复 + 功能清单与使用手册交付

### 一、六槽位名字被截断（真缺陷）

**现象**：队伍分析页 `#anSlots` 六列布局下，物种名被压成一个字——「大嘴雀」显示成「大」、「水箭龟」显示成「水…」。

**根因**：`.slot .nm{font-weight:600; flex:1}`。6 列 grid 每列 183px，`.nm` 的 `flex:1`（即 `flex:1 1 0%`）在空间不足时收缩到接近 0。

**修法**：

```css
.anslots .slot .nm{flex:0 0 auto; white-space:nowrap; font-size:15px}
.anslots .slot .roltag{font-size:12.5px; opacity:.9}
.anslots .slot{align-content:flex-start}
@media (max-width:900px){.anslots{grid-template-columns:repeat(3,minmax(0,1fr))}}
```

**中途踩坑**：第一版把 `grid-template-columns` 从 `repeat(6,minmax(0,1fr))` 改成 `repeat(auto-fit,minmax(196px,1fr))`，结果 1131px 宽下算出**单列**（6 个槽位竖排），名字虽然完整但布局塌了。回退为固定 6 列 + 窄屏 3 列。

**验证**：改后 `gridTemplateColumns` 实测 `183.525px × 6`，六个槽位名字全部完整（`大嘴雀 / 小拉达 / 胡地 / 耿鬼 / 水箭龟 / 妙蛙花`）。

### 二、边际评估建议缺「换入谁」（真缺陷）

**现象**：满队时 `📊 边际评估` 列出 5 条建议，全部显示「换掉 耿鬼 净改善 +25」，看不出要换成谁。

**根因**：`edgeSuggest` 里

```js
var d=edgeDiff(base,r.to), fromTxt=r.drop?('换掉 '+esc(r.drop.zh)):('加入 '+esc(r.cand.zh));
```

`r.cand` 存在且参与 `edgeApply(r.cand.id, ...)`，但**文案里漏了它**。

**修法**：

```js
fromTxt = r.drop
  ? ('换掉 '+esc(r.drop.zh)+' <span style="color:var(--accent)">→ 换入 '+esc(r.cand.zh)+'</span>')
  : ('加入 '+esc(r.cand.zh))
```

**验证**：改后显示 `换掉 耿鬼 → 换入 大嘴娃 / 锁圈儿 / 玛机雅娜 / 小锻匠 / 巧锻匠`，各带 `净改善 +25`。

**注意这不是第二个 bug**：5 条候选的「得/失」完全一样（都是「去掉属性重复 毒 + 新增无解系 飞行/恶/岩石 + 新增共弱 恶/超能力/幽灵」）是**必然结果**——这 5 个候选属性组合相同（都含钢系），缺口收益必然相同，差异在招式池与特性，工具不展开到那一层。这一点已写进手册 §4.2 与排查表。

### 三、功能清单与使用手册交付

**位置**：`docs/manual/功能清单与使用手册.md`（69,452 B / 979 行 / 21 张配图）

**双用途**：对外是使用手册（每节「▸ 怎么用」+ 截图）；对内是开发排查清单（每节「▸ 内部实现 / ▸ 源码判定 / ▸ 排查清单」+ §13 排查总表）。

**章节结构**：0 怎么读 / 1 全局框架 / 2 数据层与源码为准原则 / 3 核心配队 / 4 队伍构建 / 5 队伍分析 / 6 宝可梦 / 7 招式反查 / 8 属性克制 / 9 特性反查 / 10 战术模板 / 11 速度线 / 12 覆盖台账 / 13 排查总表 / 14 门禁与部署 / 15 限制与踩坑 / 附 目录约定。

**README 式要点**：

- §8 集中回答「特性怎么改属性克制表」——归零 / 封顶 / 改向三类，附太晶甲壳（封顶 0.5，不是 ×0.5）、神奇守护（归零，仅 ≥2.0 可打进）、雾眼（同时改守方 + 攻方两个方向）、胆量、腐蚀。
- §12 覆盖台账：已接入 15 条进攻侧 + 14 条速度 + 6 类相性改写 + 招式 456 标记 / 318 接触；未接入 12 项逐条给原因；已证伪 7 条判法。
- §13 排查总表：20 行「现象 → 先查函数 → 再查表」。
- §15 踩坑：`abiDesc` 第三参必须是容器 id、`#anSlots`/`#anOut`/`#ruleBoxTeam` 不调渲染函数则塌陷、`captureBeyondViewport` 深位置截出空白、`esc()`/`scrubLeak` 清空说明文本等。

**截图素材**：`docs/manual/img/` 共 43 张 PNG（整页 9 Tab × 2、元素级裁剪、详情弹层 4 屏、特性卡 2 张、槽位 / 边际评估 / 分析输出）。手册引用其中 21 张，其余为冗余备份（含 `abi_3/4`、`team_5`、`analyze_2/3`、`sp_5` 等早期失败或重复版，**未删除**）。

**未纳入部署**：`deploy_er.ps1` 白名单仍是 23 文件，不含 `docs` 与 `tools`。手册通过 GitHub 仓库直接阅读（相对路径 `img/` 在仓库页可正常渲染），不占站点。

### 四、验证

| 门禁 | 结果 |
|---|---|
| 语法（`extract_js` → `node --check`） | 0 |
| `node tools\smoke.js` | 32/32 passed |
| `python -X utf8 tools\probe_sp_abi_detail.py` | 117 项 ALL PASS |
| 线上 SHA1 | `7B6F7ACDD5CD68749D4249A3FA89892C4960800A` / 1,634,950 B —— **VERIFIED-MATCH**（gh-pages `e404c62..da5b627`） |

### 五、方法论沉淀：截图采集本身就是验证手段

这两个缺陷都不是读代码读出来的，是**为了给手册配图去截图时**发现的：

1. 截 `#anSlots` 元素图 → 肉眼看到名字只剩一个字 → 反查 `.slot .nm` 的 `flex:1`。
2. 截 `#ruleBoxTeam` 元素图 → 肉眼看到 5 条建议一模一样 → 反查 `fromTxt` 漏了 `r.cand`。

**结论**：给大工具做「功能清单」时，逐块元素级截图不只是为了配图，它等价于一次**逐功能可视走查**——比只看 `innerText` 更容易发现布局塌陷与文案缺失。这条经验已并入 §15.2。
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

## v4.241（2026-11-09）· 角色定位卡「现算击杀线」补 stA/tgt

### 一、缺陷：5 条进攻侧特性在推荐详情里静默失效

**现象**：队伍分析页点任意精灵 → 弹出「推荐详情」→ ② 核心机制里的**现算击杀线**数字偏低。
不报错、不空白，只是少算了倍率——所以不会有人主动怀疑。

**根因**：`roleCard5Html` 里

```js
dmgRes=dmgCalc({sA:s,sD:tgt,moveId:mv0,evA:evA,evD:0,natA:natA5,natD:'',itemA:itemA,weather:'',terrain:'',crit:false});
```

`dmgCalc` 的参数表里有 `stA`（攻方状态）和 `tgt`（目标状态）两个维度，但**这个调用点建得比这两个维度早**，v4.237 / v4.238 把维度加进 `dmgCalc` 时，只回补了伤害面板与 `ohkoSolveEv` / `surviveSolve` 两处复算点，**没人回头改这里**。

后果：毅力（×1.5）/ 决心（×1.5）/ 中毒激升（×1.5）/ 蹲守（×2.0）/ 分析（×1.3）五条**全部不生效**。

**修法**：按该只「推荐特性」自身的 `need` 决定情景，再传进 `dmgCalc`：

```js
var _stA='',_tgt='',abiNote='';
var _a0=bd.abi&&bd.abi[0];
var _nm=(_a0&&_a0.id!=null&&typeof ABI!=='undefined'&&ABI[_a0.id])?(ABI[_a0.id][2]||''):((_a0&&_a0.n)?_a0.n:'');
var _kd=_nm?ABI_ATK_KIND[_nm]:null;
if(_kd){
  if(_kd.need==='poison'){_stA='poison';abiNote='自身中毒'}
  else if(_kd.need==='stPhys'||_kd.need==='stSpec'){_stA='any';abiNote='自身有异常'}
  else if(_kd.need==='tgtNew'){_tgt='new';abiNote='对手刚上场'}
  else if(_kd.need==='tgtMoved'){_tgt='moved';abiNote='对手已先行动'}
}
```

**同时补 UI 前提标注**：击杀线后面加 `（按「自身有异常」前提）` 灰字。静态假设必须显式标注为前提，否则用户会把条件值当成无条件值。

### 二、取值口径（与伤害面板 chip 完全一致）

| 维度 | 合法值 |
|---|---|
| `stA` | `''` / `'any'`（任意异常） / `'poison'`（中毒·剧毒） |
| `tgt` | `''` / `'new'`（对手刚上场） / `'moved'`（对手本回合已先行动） |

注意是 `'any'` 不是 `'status'`——手册 §5.5 的注释此前写错，已一并修正。

### 三、验证（CDP 实测，非推断）

| 特性 | 实例 | 旧（不传参数） | 新（传参数） | 倍率 |
|---|---|---|---|---|
| 毅力 | 腕力#66 「吸取拳」→ 幸福蛋 | 775–912 | **1163–1368** | ×1.5 |
| 决心 | 傲骨燕#276 「勇鸟猛攻」 | 130–153 | 前提标注「自身有异常」 | ×1.5 |
| 中毒激升 | 猫鼬斩#335 | 395–465 | 前提标注「自身中毒」 | ×1.5 |
| 蹲守 | 狡小狐#827 「欺诈」→ 果然翁 | 226–267 | **453–534** | ×2.0 |
| 分析 | 小磁怪#81 | 1107–1302 | 前提标注「对手已先行动」 | ×1.3 |

UI 显示值与手算值 `一致=YES`（逐条比对 `roleCard5Html` 输出里的 `<b>lo–hi</b>` 与带参 `dmgCalc` 的返回值）。

### 四、全文件 `dmgCalc(` 调用点普查（本次一并做完）

| 行 | 调用点 | 参数状态 |
|---|---|---|
| 7138 | 伤害面板 `dmgRender` | 完整（含 `stA` / `tgt`） |
| 6981 | `ohkoSolveEv` | 完整（v4.238 补） |
| 7003 | `surviveSolve` | 完整（v4.238 补） |
| 3251 | `roleCard5Html` | **缺 `stA` / `tgt` → 本次修** |

**方法论**：给 `dmgCalc` 新增参数后，必须**全文件正则重扫所有 `dmgCalc({` 调用点**逐个人工核对，不能只改当时想到的那几处。手抄参数表是这类静默错误的温床。

另：`tgt` / `stA` **不该扩散到属性克制表、打击面**——那两处是纯类型相性查询，不产生伤害数字。真正需要这两个维度的只有「会产生伤害数字」的地方，现已全部覆盖。

### 五、验证结果

| 门禁 | 结果 |
|---|---|
| 语法 | 0 |
| `node tools\smoke.js` | 32/32 passed |
| `python -X utf8 tools\probe_sp_abi_detail.py` | 117 项 ALL PASS |
| 线上 SHA1 | `02FB9539E67D641EC2D2B79DBDE6A07D3709095A` / 1,636,126 B —— **VERIFIED-MATCH**（gh-pages `da5b627..db7eecc`） |


## v4.242（2026-11-09）· 雾天体系补齐 + 17 条特性表别名失配修正

**起因**：v4.241 之后按手册 §15.5 待核项推进「全量覆盖」，顺着 `defCellTrio(s,at,pickOv,wx)` 第四参 `wx` 只有 1/31 处传参的线索，查到「雾天」这条天气轴在工具里整条不存在。

**一、雾天（fog）在 ER 里是真实可达天气，不是死代码**

源码实证（`git grep` 于 `$env:TEMP\ERrepo` 的 `FETCH_HEAD`）：

| 证据 | 位置 | 结论 |
|---|---|---|
| `WEATHER_FOG_HORIZONTAL=6` | `include/constants/weather.h:10` | 雾天常量存在（`FOG_DIAGONAL=9` 才是 Unused） |
| `WEATHER_FOG_ANY = (PERMANENT\|TEMPORARY)` | `include/constants/battle.h:439` | 雾天判定宏 |
| `case MOVE_EERIE_FOG:` 与 `MOVE_SUNNY_DAY/RAIN_DANCE/SANDSTORM/HAIL` 同列 | `src/battle_script_commands.c:943`（`NoTargetPresent`） | **玩家可主动用「诡异浓雾」造雾** |
| `gBattleWeather = WEATHER_FOG_PERMANENT` | `src/battle_util.c:4438-4443` | 雾天走永久档 |
| 数据层 #950「诡异浓雾」Eerie Fog | `配招工具_data.js` | 幽灵·变化·PP10，**225 只可学** |
| 伤害段无雾天增幅 | `battle_util.c` 伤害链 | 只有晴→火/雨→水 ×1.5、场地 ×1.3、薄雾→龙 ×0.5；**雾天不加乘** |

**二、源码里有整套雾天特性体系（15 个 `Impl<ABILITY_*>` 块含 `WEATHER_FOG*`）**

逐个核真（`src/abilities.cc`）：

| 特性 | id | 物种表名 | 入口 | 雾天效果 | 本版接入 |
|---|---|---|---|---|---|
| LOW_VISIBILITY | 619 | 低能见度 | `.onEntry` L7875 | 出场设雾天（8 回合，烟雾球 12） | 否（`SYS_SET` 见下） |
| FOG_MACHINE | 905 | 造雾机 | `.onDefender` L11081 | **受到攻击时**设雾天 | 否 |
| ECTOPLASM | 621 | **灵质** | `.onStat` L7897 | 最高攻项 ×1.5 | **是（伤害 ×1.5）** |
| ETHEREAL_RUSH | 627 | **飘渺冲刺** | `.onStat` L7951 | 速度 ×1.5 | 是（`SPD_ABI` 早已有，但键名错，见第三节） |
| ECHOLOCATION | 947 | **（0 只持有）** | `.onOffensiveMultiplier` L11466 | 全招 ×1.2 + 必定命中 | 否（无持有者） |
| FOGGY_EYE | 967 | 雾眼 | `.onOffensiveMultiplier/.onAfterTypeEffectiveness` L11539 | 幽灵招攻 ×1.5；目标侧封顶 0.5 | 早已接，但**触发条件一直拿不到雾** |
| GREATER_SPIRIT | — | — | `.onEntry` L7927 | 雾天出场最高能力 +1 | 否（回合内增益） |
| PEACEFUL_REST / WHITE_NOISE | — | — | `.onEndTurn` L8235 | 雾天每回合回复 | 否（回合） |
| SMOKEY_MANEUVERS | — | — | `.onAccuracy` L8255 | 雾天目标命中 /1.25 | 否（命中） |
| MADNESS_ENHANCEMENT | — | — | `.onEntry/.onWeather` L10016 | 雾天进入 ENRAGED（防御 ×0.8） | 否 |
| SOUL_TAP | — | — | `.onEndTurn` L10028 | 雾天每回合吸血 | 否（回合） |
| SURPRISE | — | — | `.onPreemptAction` L10451 | 雾天抢动 | 否（回合） |
| RECURRING_NIGHTMARE | — | — | `.onRevive` L7964 | 雾天复活 | 否 |
| TOXIC_BOOST / SCHOOLING / OVERRULE | — | — | — | 块内 `WEATHER_FOG` 属别处调用/引用，**非雾天判定（假阳性）** | 不接 |

**三、本版实际改动（5 处雾天 + 17 条别名）**

雾天口径补齐：

1. 伤害面板天气 chip 加「雾」（`speedSliderHtml`，原只有 无/晴/雨/沙/雪）
2. `WEATHER_MV` 加 `950:'雾'`
3. `ownWxList` 的招式→天气映射加 `[950,'雾']`
4. `SYS_TXT` 加 `雾:'雾'`
5. `ABI_ATK_COND` 加 `'灵质':[{mul:1.5,need:'fog'}]`（原写成「流质」，见下）

**别名失配修正（本版最重要的发现）**：所有以**中文特性名**作键的表（`ABI_ATK_MOD` / `ABI_ATK_COND` / `ABI_FLAG_ATK` / `ABI_TE_DEF_COND` / `ABI_IM_HF` 等）键名必须用**【物种表口径】**（`ERDATA.species` 的 `abis` / `inns` 实际值），**不能用数据层 `ABI[x][2]`**。两处存在别名差，键写数据层名即**静默永不命中**（不报错、不空白，只是特性从不生效）。

CDP 全表普查（键名 vs 物种表实际名）命中 **19 条失配**，其中 2 条无持有者不修，**17 条全部修正**：

| id | 原键（数据层） | 改为（物种表） | 持有者 | 效果 |
|---|---|---|---|---|
| 621 | 流质 | **灵质** | 9 | 雾天最高攻项 ×1.5 |
| 252 | 钢之意志 | 钢魂 | 12 | 钢招 ×1.3 |
| 281 | 发电细胞 | 电细胞 | 31 | 电招 ×1.25 |
| 303 | 化石化 | 化石 | 19 | 受岩石 ×0.5 / 岩招 ×1.2 |
| 306 | 黑暗亲和 | 夜行 | 48 | 受恶·妖精 ×0.75 / 恶招 ×1.25 |
| 336 | 电力爆发 | 电爆 | 22 | 电招 ×1.35 |
| 431 | 沙暴恐惧 | 沙丘恐惧 | 3 | 沙暴天 ×0.65 / 地面招 ×1.2 |
| 432 | 地狱愤怒 | 地狱之怒 | 2 | 火招 ×1.35 |
| 544 | 飞空助力 | 空中 | 7 | 飞行招 ×1.3 |
| 713 | 水栖栖息者 | 水栖居民 | 3 | 水招 ×1.5 |
| 757 | 厄运冲击 | 末日爆裂 | 1 | 恶招 ×1.35 |
| 449 | 搬岩 | 岩石载荷 | 6 | 岩石招 ×1.5 |
| 271 | 锐利之刃 | 锐利刀刃 | 54 | keen flag ×1.3 |
| 361 | 猛踢 | 前锋 | 33 | striker flag ×1.3 |
| 360 | 大牙狸之佑 | 旷野探险家 | 29 | field flag ×1.5 |
| 773 | 占卜大师 | 预言家 | 1 | 入场 4 回合内 ≥1.0 压到 0.5 |
| 200 | 钢能力者 | 钢能力士 | 31 | 自身含钢时恶/幽灵 ×0.5 |

不修 2 条：**947 Echolocation（回声定位，0 只持有）**、**466（等离子灯，0 只持有）** —— 接了也无意义，登记不接。

**四、为什么没有接 `SYS_SET`（雾天体系轴）**

`SYS_SET`（`var SYS_SET={'降雨':'雨',…}`，9 条）决定 `abiSetOf`→`coreSys`→`coreRole`→`coreAbiPick`，直接影响推荐特性与配招。要接雾天需加 `'低能见度':'雾','造雾机':'雾'`，但源码 8290-8294 行原有注释已明示：

> **不接入全局 SYS_MAP/SYS_SET** —— 实测（4680 导出 diff）它们经 coreAbiPick 的 sys 打分与 coreRole 流入 deriveBuilds 个体流派，改了 雷鸟龙/伦琴猫R-B 等的推荐特性与配招，违反路线甲 4680 零变化红线。… 627 缥缈奔腾(浓雾)：引擎无雾体系位，同登记待核。

⇒ 本版**保持保守**：雾天作为**手动可选天气**打通（伤害面板 chip + 招式反查 + 相性改写 + 攻击侧增伤），**不改 `SYS_SET`**，推荐结果零变化。雾天队识别列入后续（需先跑 4680 导出 diff 评估影响面）。

**五、验证（全部实测，非推断）**

| 项 | 结果 |
|---|---|
| 语法门禁 | `node --check` = 0 |
| `tools/smoke.js` | **32/32 passed** |
| `tools/probe_sp_abi_detail.py` | **ALL PASS**（F84 期望同步为物种表口径） |
| 雾眼相性 | 无天气 `val=1` → 雾天 `val=0.5`（`whys=["雾眼：封顶 ×0.5"]`） |
| 雾眼伤害面板 | 耿鬼→超级龟足巨铠 幽灵招：**117–138（×1）→ 58–69（×0.5）** |
| 天气 chip | `speedSliderHtml` 输出串**含雾=true**，点「雾」后 `__spdSl.weather='雾'` |
| 灵质 | 幽灵招·雾=`1.5`，无天气=`1` |
| 钢魂/电细胞/夜行/电爆/地狱之怒/空中/末日爆裂 | `1.3/1.25/1.25/1.35/1.35/1.3/1.35` 全部命中 |
| 化石/水栖居民/岩石载荷/沙丘恐惧 | `1.2/1.5/1.5/1.2` 全部命中 |
| 锐利刀刃/前锋/旷野探险家 | flag 命中 `1.3/1.3/1.5`，未命中 `1` |
| 钢能力士（铁哑铃 #374） | 恶=`0.5`、幽灵=`0.5` |
| 预言家（妖火红狐-牵绊变身 #1863） | 效果绝佳 `=0.5` |

产物：`index.html` **1,637,718 B / SHA1 `2F14150D22A57BA5952B60D1AE40F0184392E164`**。

**六、方法论沉淀（本版最重要的一条）**

> **凡是「以中文特性名作键」的查找表，必须用物种表口径核对键名，不能信数据层文案。**
> 数据层 `ERDATA.abilities[x][2]` 与物种表 `abis`/`inns` 存在别名差（流质/灵质、缥缈奔腾/飘渺冲刺、锐利之刃/锐利刀刃…）。
> 这类错误的表现是**完全静默** —— 不抛异常、不显示空白，只是特性从来不参与计算。唯一可靠的发现方式是
> **把表键逐个拿去和全库物种的 `abis`/`inns` 实际取值求差集**（本版用 CDP 跑了一遍，19 条）。
> 修完必须同步所有引用该键的测试脚本（`probe_sp_abi_detail.py` F84 即因此 FAIL 后同步）。


## v4.243（2026-11-09）· 全表别名普查：再修 32 条 + 速度线比对改为别名安全

**起因**：v4.242 修完 17 条后顺着同一思路做「**全量普查**」——枚举文件里**所有**以中文特性名作键（或 `.zh` 字段）的查找表，逐键与全库物种 `abis`/`inns` 实际取值求差集。结果又查出 **32 条有持有者的失配**，比 v4.242 那批更多。

**一、根因：两个前提被证实**

1. **消费点全是「直接索引」**，不是「先归一化再查」：
   `ABI_DMG_MOD[name]` / `ABI_DMG_ALL[name]` / `ABI_DMG_COND[n]` / `ABI_TE_CALC[name]` / `ABI_TAG_PATCH[n]`，其中 `name`/`n` 直接来自 `dmgDefAbis(sD)` 与 `abiTeDefCondOf` 里的 `s.abis` / `s.inns` **原始值**（物种表口径，无任何归一）。
2. 文件里另有一套 `AN_ALIAS_EXT` + `abiIdByZhOrEn` + `NM2ID` 的**别名桥**（`abiSame` / `anyAbiId` / `anAbiHit` 可用），但**这几张表完全不经过它**。表里写的是「abilities 表规范名」，物种表里存的是「ER 译名」，两者错位即静默永不命中。

**二、速度线是真 bug，且性质更严重**

`spdSpeedAbiOf` 原文：

```js
SPD_ABI.forEach(function(r){
  if(r.zh!==a)return;   // ← 严格全等，别名桥被绕过
```

`SPD_ABI` 是**数组**（`{zh:'拨沙',mul:1.5,...}`），比对用 `r.zh !== a` 严格全等。三条错名因此从未命中：

| 原 `zh` | 物种表真名 | id | 持有者 | 效果 | 修前 |
|---|---|---|---|---|---|
| 拨沙 | **挖沙** | 146 | **27** | 沙暴速度 ×1.5 | 0 命中 |
| 缥缈奔腾 | **飘渺冲刺** | 627 | **14** | 雾天速度 ×1.5 | 0 命中 |
| 铅质外壳 | **铅衣** | 296 | **25** | 速度 ×0.9（**减速**） | 0 命中 |

> 「铅衣 ×0.9」漏接的后果比提速更严重 —— 速度线会把 25 只重甲物种的实速**算高**，导致「能超速」的误判。

**三、本版修正 32 条（合计 30 个键位，覆盖 400+ 只物种）**

替换策略：**定位每个表定义块（`var NAME={` 到配对 `}`，括号计数法），只在块内替换**，避免误伤轴库文案区（如 L1103 里也含「洁净之盐 547」这类说明文字）。

| 表 | 原键（数据层名） | 改为（物种表名） | id | 持有 |
|---|---|---|---|---|
| ABI_DMG_MOD | 洁净之盐 | 净化之盐 | 547 | 3 |
| ABI_TAG_PATCH | 毒素吸收 / 引冰 / 蓄水器 | 毒吸收 / 冰露 / 水库 | 344/379/749 | 25/13/2 |
| ABI_DMG_ALL | 北极毛皮 / 棱镜毛皮 | 极地毛发 / 棱彩毛发 | 392/440 | 2/3 |
| ABI_DMG_COND | 雪之精神 | 圣诞精神 | 283 | 4 |
| ABI_DMG_COND | 合金外壳 | 铬涂层 | 539 | 7 |
| ABI_DMG_COND | 猎龙者 | 屠龙者 | 313 | 6 |
| ABI_DMG_COND | 妖精猎者 | 妖精猎人 | 442 | 5 |
| ABI_DMG_COND | 铅质外壳 | 铅衣 | 296 | 25 |
| ABI_DMG_COND | 永冻层 | 永冻土 | 317 | 25 |
| ABI_DMG_COND | 根源盔甲 | 原始铠甲 | 318 | **39** |
| ABI_DMG_COND | 沙漠守护 | 沙之守卫 | 482 | 16 |
| ABI_DMG_COND | 慢出 | 后攻 | 100 | 23 |
| ABI_DMG_COND | 晒太阳 | 沐日 | 585 | 10 |
| ABI_DMG_COND | 极致蓬松 | 最毛茸茸 | 678 | 6 |
| ABI_TE_CALC | 失控之怒 | 盲目狂怒 | 694 | 3 |
| ABI_TE_CALC | 酸性粘液 | 酸性黏液 | 760 | 1 |
| ABI_TE_CALC | 地面冲击 | 大地冲击 | 285 | **27** |
| ABI_TE_CALC | 压倒 | 压制 | 328 | 25 |
| ABI_TE_CALC | 电力过载 | 过载 | 349 | **27** |
| ABI_TE_CALC | 腐化 | 堕落 | 716 | 1 |
| ABI_TE_CALC | 熔岩 | 熔解 | 357 | **27** |
| ABI_TE_CALC | 岩浆吞噬者 | 岩浆食者 | 467 | 1 |
| ABI_TE_CALC | 龙族皮肤 | 龙化 | 413 | 5 |
| ABI_TE_CALC | 灵魂吞噬 | 灵魂吞噬者 | 765 | 3 |
| ABI_TE_CALC | 火岩浆流 | 火山碎屑流 | 635 | 1 |
| ABI_TE_CALC | 腐化思维 | 扭曲心灵 | 774 | 1 |
| SPD_ABI | 拨沙 / 缥缈奔腾 / 铅质外壳 | 挖沙 / 飘渺冲刺 / 铅衣 | 146/627/296 | 27/14/25 |

另把 `spdSpeedAbiOf` 的 `r.zh!==a` 改为 `abiSame(r.zh,a)`（别名感知），**表内已是正确名 + 比对别名安全 = 双保险**。

**不修（0 持有）**：守护者外套 #838、龙之威仪 #841、慢启动 #112、等离子灯 #466、回声定位 #947。
**无法修（数据层无中文名）**：`INSECTEATER`、`树皮`（`abiIdC` 反查不到 id）；`Rock Armor` #1031（物种表名就是 `#1031` 占位）。

**四、最关键的发现：探针和表用同一个错名会互相印证**

同步探针时发现：`tools/probe_sp_abi_detail.py` 里 F13/F15/F20/F22/F23/F26/F27/F37 共 **8 条断言用的正是旧键名**。把表改对之后，探针立刻 **7 FAIL**（`v=0` / `v=0.5` / `NONE`）。

**这意味着 v4.243 之前，探针一直是「全绿」的 —— 因为它和表抄的是同一个错名，两边一起错、互相证明对方正确。** 这类门禁的假阴性极难发现：语法过、smoke 过、probe 过，但功能从没生效。

> **门禁的设计原则补充**：断言里引用的名字**必须从数据源取**（物种表 `abis`/`inns`），不能手抄被测表的键；否则门禁只是在验证「表能自己读自己」。

**五、验证**

| 项 | 结果 |
|---|---|
| 语法门禁 | `node --check` = 0 |
| `tools/smoke.js` | **32/32 passed** |
| `tools/probe_sp_abi_detail.py` | **ALL PASS**（同步 8 处键名后） |
| `SPD_ABI` 全库命中分布 | 挖沙 **25** / 铅衣 **23** / 飘渺冲刺 **14**（修前各 0）；仅「慢启动」0 持有未命中 |
| 穿山鼠 #27（挖沙） | `spdSpeedAbiOf` → 挖沙 ×1.5 |
| 烛光灵 #607（飘渺冲刺） | → 飘渺冲刺 ×1.5 |
| 佛烈托斯 #205（铅衣） | → 铅衣 ×0.9 |
| `ABI_TE_CALC` | 过载 0.5→**2.0**、火山碎屑流 0.5→**2.0**、龙化 0.5→0.5（非龙自身不触发，正确） |
| `ABI_TAG_PATCH` | 毒吸收 im=毒、冰露 im=冰、水库 im=水（旧名全部 NONE） |
| `ABI_DMG_COND` 11 条 | 圣诞精神 冰雹 0.5 / 铬涂层 特殊 0.6 / 屠龙者 攻方龙 0.5 / 妖精猎人 0.5 / 铅衣 物理 0.6 / 永冻土 绝佳 0.65 / 原始铠甲 绝佳 0.5 / 沙之守卫 沙暴特殊 0.5 / 后攻 后手 0.7 / 沐日 晴天 0.5 / 最毛茸茸 火 ×2 |
| 旧名残留扫描 | **无残留**（29 张表键位全部替换，无重复键） |

产物：`index.html` **1,637,979 B / SHA1 `D9446B1DC662FCB74B3CA97FDDE1CC2FCE016B5F`**。

**六、方法论（v4.242 那条的加强版）**

> **别名普查要「表驱动」而不是「补丁驱动」。** v4.242 是按「发现一条修一条」修了 17 条；v4.243 改为
> **枚举全部以中文名作键的表 → 逐键与物种表求差集 → 一次性收口**，又查出 32 条。
> 只要表还在用 `TBL[中文名]` 直接索引，这个普查就该在每次新增表时跑一遍。


## v4.244（2026-11-09）· AXIS_LIB 8 条别名修正 + IMMUNE_RISK 物种表口径化（并纠正 v4.243 的一条错误结论）

### A. 先纠正 v4.243 写进文档的一条错判

v4.243 手册 §15.5 记过「`SYS_SET` 里「日照」应为「干旱」（25 只持有），未改 —— 需先跑 4680 导出 diff」。**这条是错的，已删改。**

`sysIdMapsInit()` 的写法是：
```js
for(n in SYS_SET){i=abiIdC(n);if(i)SET_ID_MAP[i]=SYS_SET[n]}
```
即键先经 `abiIdC` 转成 **id**，再以 **id 为键**存表。`abiIdC('日照')=70` → `SET_ID_MAP['70']='晴'`；物种表的「干旱」同样反查 70 ⇒ `abiSetOf('干旱')` 命中。
CDP 实测：`abiSetOf('日照')`=`abiSetOf('干旱')`=`'晴'`；全库 **23** 只「干旱」物种（不是文档写的 25）`coreSys` **全部**含「晴」。

**方法论（本段最大收获）**：同样是「以中文特性名作键」，**有没有走 id 桥，结论完全相反**：

| 消费模式 | 代码特征 | 别名差是否算缺陷 |
|---|---|---|
| A 直接索引 | `TBL[名称]`，名称直接来自 `s.abis`/`s.inns` | **算**（静默永不命中） |
| B id 桥 | `sysIdMapsInit()` 先经 `abiIdC` 转 id 级映射 | **不算**（两边反查同一 id） |

排查口诀：**看到「某特性写了却不生效」，第一步不是改表，而是先看消费点有没有 `abiIdC`。**

### B. AXIS_LIB 8 条别名修正（零风险，已 diff 验证）

`axisStateOf` 的 `spHasAbiName` 内部是 `names.indexOf(n)>-1`，**严格匹配、不走 `abiSame`** ⇒ `AXIS_LIB` 里 `轴手判定.ability_tags` / `受益者判定.ability_tags` 必须与物种表一致。普查出 15 条 MISS，本轮修 8 条（其余 0 持有或属 `immune_types` 语义）：

| 轴 | 字段 | 原写 | 改为 | id | 持有 |
|---|---|---|---|---|---|
| sun | 轴手 | 日照 | 干旱 | 70 | 23 |
| sand | 轴手 | 沙漠意志 | 沙漠之魂 | 604 | 1 |
| sand | 受益 | 拨沙 | 挖沙 | 146 | 27 |
| snow | 受益 | 冰天雪地 | 白茫茫 | 269 | 26 |
| stall | 轴手 | 洁净之盐 | 净化之盐 | 547 | 3 |
| pivot | 受益 | 隔空取物 | 念动力 | 511 | 6 |
| grassy | 受益 | 草之毛皮 | 草之皮毛 | 179 | 27 |
| psychic | 受益 | 天才思想 | 天赋异禀 | 422 | 6 |

**为什么要先 diff**：`axisStateOf` → `viable` → `axisDetect` → `axisSyncOf`（`needScore` 的 AX 维度加分）→ `deriveBuilds`，改名字会改推荐。用内存模拟（原地改 `AXIS_LIB` 数组后重跑全库）测出：
- `axisDetect`：**2 / 1905** 变化（仅冷水猴R #2519、冷水猿R #2520 新增 `pivot`）
- `deriveBuilds` / `coreAbiPick`：**0 / 1905**
⇒ 可安全落地。落盘后实测与模拟一致。

### C. IMMUNE_RISK：一张表两个口径（本轮最重要的缺陷）

```js
var IMMUNE_RISK={};
ERDATA.abilities.forEach(function(a){
  var g=ERDATA.abiTags[a[0]];
  if(g&&g.im)g.im.forEach(function(t){(IMMUNE_RISK[t]=IMMUNE_RISK[t]||[]).push(a[2]||a[1])});
});
```

**构建用 `a[2]`（数据层 `ERDATA.abilities[id][2]` 中文名），唯一的结构化消费点 `axisStateOf` 却用物种表名严格比对** ⇒ 别名差让「轴联防件」判定静默失效，**同时文案也显示错名**（用户在免疫警示里看到「焦香之躯」，而游戏里叫「好烤的身体」）。

普查 `IMMUNE_RISK` 30 条里 **12 条 MISS**，其中 3 条是此前从未列入任何清单的新发现：`巨翼`→**威严之翼**、`空气动力`→**空气动力学**(282)、`登山`→**登山者**(314)。

修法（`er-ready` 后重映射为物种表口径）：
```js
function ___immRiskRemap(){
  if(!window.ERDATA||!ERDATA.species||!ERDATA.species.length)return false;
  var id2={};  // abiIds/abis 同索引取物种表真名
  ERDATA.species.forEach(function(x){ ... });
  Object.keys(IMMUNE_RISK).forEach(function(t){
    IMMUNE_RISK[t]=IMMUNE_RISK[t].map(function(nm){var id=abiIdC(nm);return (id&&id2[id])?id2[id]:nm});
  });
}
if(document.addEventListener){document.addEventListener('er-ready',___immRiskRemap);}
```

修正后：`火=引火/好烤的身体/元素漩涡/灼日/火焰形态`、`地面=飘浮/龙飞/念动力/空中飞人/威严之翼/悬浮/终结烈日/妖精飞行`、`飞行=空气动力学`、`岩石=登山者`。
影响面（与 v4.243 基线逐项比对）：`builds` **0/1905**、`abi` **0/1905**、`axes` **69/1905**（其中主轴变化 44 只，如凤王 #250 `rain`→`pivot`）。轴排序变化来自 `glue` 加分修正，属**预期修正**而非回归。

### D. 踩坑：`ERDATA.species` 是分片异步，顶层访问会整段中断

第一版把 `AB_ZH_BY_ID` 就地构建（直接 `ERDATA.species.forEach`），结果**语法 0、smoke 32/32 全绿，但 probe 报 `Cannot read properties of undefined (reading '|变色')`、CDP 里 `ER_ENGINE_VER` 变成 `undefined`**。

根因：数据层是 `document.write` 注入的 `data_lite_v498.js`（只带 `abilities`/`moves`），**`species` 由 `__ER_SHARDS` 分片异步补**。4875 行执行时 `ERDATA.species` 尚不存在 → `forEach` 抛错 → **整段顶层脚本中断**，后面所有定义（含 `ER_ENGINE_VER`、各特性表）全没执行。

**识别信号**：`ER_ENGINE_VER === undefined`（而不是旧版本号）。看到这个就先查是不是某处顶层访问了未就绪的分片数据。
**正确写法**：像 L1120 的 `ERDATA.moves` 那样，`if(数据存在){就地做}else{document.addEventListener('er-ready',…)}`。

### E. 验证

语法 0 / smoke 32-32 / probe 117 ALL PASS。CDP：`VER=v4.244`、`erReady=true`、`species=1906`（过滤后 1905）、`___immRiskRemap()` 可重跑返回 true、免疫警示文案实测 `火（引火/好烤的身体/元素漩涡）`。
与 v4.243 基线逐项比对：`builds` 0/1905、`abi` 0/1905、`axes` 69/1905。
## v4.245（2026-11-09）· 特性反查卡补「计算倍率」区（全量覆盖真正露到 UI）

### A. 发现的缺口：`renderAbi` 根本没用 `abiDesc`

`abi` Tab 的卡片由 `renderAbi()`（L6289）渲染，三块内容：中文描述 / 特性效果（战斗意义） / 持有者两列。

其中「特性效果」调的是 `abiTagLines(id)`（L2157），**只读 `ERDATA.abiTags`** —— 数据层标签表。拿「雾眼 #967」实测：该卡展开后这一块只打印 **「（ABI_TAGS 未登记标签）」**。

而同一个文件里 `abiDesc()`（L3793-3902）是个**很完整**的详情渲染器，会渲染六类内容：

| 区块 | 来源表 | 钩子 |
|---|---|---|
| 受到伤害倍率 | `ABI_DMG_MOD` / `ABI_DMG_ALL` / `ABI_DMG_COND` | `.onDefensiveMultiplier` |
| 相性改写 | `ABI_TE_DEF_COND` | `.onAfterTypeEffectiveness` |
| 进攻增伤 | `ABI_ATK_MOD` / `ABI_ATK_COND` / `ABI_FLAG_ATK` / `ABI_ATK_KIND` | `.onOffensiveMultiplier` |
| 关联招式 | `abiCleanMvName` → `MV` | — |
| 叠加特性 | `abiCompositeBreak` | — |
| 机制详解 | `ABI_DETAIL` | — |

**结论：`abiDesc` 服务的是「宝可梦详情弹层里的特性块」，`abi` Tab 那条路径完全没接它。** 两个入口，一个满配一个空壳。

`abiTagLines` 返回空时的文案「（ABI_TAGS 未登记标签）」更糟 —— 它让玩家以为「这个特性没有效果数据」，实际上数据一直在，只是这条渲染路径看不见。

### B. 修法：新增 `abiSrcBrief(id)`，8 张计算表折成一行行摘要

不改 `abiDesc`（130 行、多处调用，动它风险大），改为新写一个**只输出文本摘要**的函数，挂在卡片里当独立区块。

两处配套：

1. **`abiZhSp(id)`** —— 特性 id → **物种表口径**中文名。判定表的键一律是物种表名，而 `ABI[id][2]` 是数据层名，两者有别名差。用**懒建全局 `AB_ZH_SP`**：首次调用时才扫 `ERDATA.species`，因为 `species` 是分片异步补的，**不能写在顶层执行**（这正是 v4.244 踩过的坑，见该章 D 节）。
2. **`abiSrcBrief(id)`** —— 把 `ABI_ATK_MOD` / `ABI_ATK_COND` / `ABI_FLAG_ATK` / `ABI_ATK_KIND` / `ABI_DMG_MOD` / `ABI_DMG_ALL` / `ABI_DMG_COND` / `ABI_TE_DEF_COND` 八张表折成「打出去 · / 承受 · / 改相性 ·」三类前缀的行。

`renderAbi` 卡片插在第 3 块「特性效果（战斗意义）」之后，标题「**计算倍率（工具真正计入伤害的部分）**」；空态文案改成实话：**「不在计算类判定表中：属速度 / 回合 / 命中 / 换场类效果，不产生伤害倍率；速度类见「速度线」页」**。

### C. 踩到的两个坑

**① `esc()` 内部走 `scrubLeak()`，会整段清空。**
`esc(s) = scrubLeak(mdInline(String(s)))...`，而 `scrubLeak` 的触发集合含 `源码` / `→` / `口径` / `实证` / `定稿` / `本项目` / `【` / 空括号 / `L\d{2,5}` 等，命中即把整串剥掉。
⇒ `abiSrcBrief` 返回的文本**必须避开这些词**，改用「封顶 ×0.5」「归零（只有效果绝佳才打得进来）」这类说法。区块标题走 HTML 拼接（不过 `esc`），可以写「源码」以外的话。

**② `ABI_ATK_COND` 的元素可以没有 `t` 字段。**
`{'灵质':[{mul:1.5,need:'fog'}]}` —— 无 `t` 表示**不分属性**。直接 `x.t.join('/')` 抛错，被外层 `try{}catch{}` 吞掉，导致整条返回空数组（第一版实测 `灵质` / `回声定位` 都是 `[]`）。
⇒ 统一写成 `(x.t ? x.t.join('/')+'招' : '所有招')`。修后实测：`灵质 → ["打出去 · 所有招 ×1.5（雾天）"]`、`回声定位 → ["打出去 · 所有招 ×1.2（雾天）"]`。

### D. 全表普查：8 张计算表只剩 4 处失配，全是 0 持有或占位名

对八张表逐键与全库 `abis`/`inns` 求差集（`audit_245.py`）：

| 表 | 键数 | 失配 | 明细 |
|---|---|---|---|
| `ABI_ATK_MOD` | 25 | 1 | 等离子灯 #466（物种表无此 id，持 0 只） |
| `ABI_ATK_COND` | 3 | 1 | 回声定位 #947（持 0 只） |
| `ABI_FLAG_ATK` | 12 | **0** | 全命中 |
| `ABI_ATK_KIND` | 15 | **0** | 全命中 |
| `ABI_DMG_MOD` | 15 | **0** | 全命中 |
| `ABI_DMG_ALL` | 11 | 1 | `Rock Armor` #1031（物种表名就是 `#1031` 占位） |
| `ABI_DMG_COND` | 32 | 3 | 守护者外套 #838 / `INSECTEATER` / `树皮`（均持 0 只） |
| `ABI_TE_DEF_COND` | 5 | **0** | 全命中 |

⇒ v4.242 / v4.243 两轮 49 条别名修正已经把表键修干净了，**本轮零别名修复**。

**顺带纠正一次自己的误判**：抽查时把「狙击手」当成 `#68`，实测 `abiZhSp(68)` = **虫之预感**、`abiIdC('狙击手')` = **97**。是我用例 id 写错，不是缺陷。`ABI_ATK_KIND` 的 15 键全命中可以印证。

### E. 覆盖率口径：10.5% 是正确答案，不是覆盖不足

`abiSrcBrief` 全库统计：

| 口径 | 条数 | 占比 |
|---|---|---|
| 全部特性 | 1033 | 100% |
| 有「计算倍率」 | 108 | 10.5% |
| 有持有者（998 条）中有计算倍率 | 105 | 10.5% |

其余约 92% 属**回合类 / 命中类 / 换场类 / 状态类**，源码里没有 `.onOffensiveMultiplier` / `.onDefensiveMultiplier` / `.onAfterTypeEffectiveness` 三个钩子，**本来就不产生伤害倍率**，硬塞进倍率表反而是错的。

⇒ **判断一条特性该不该有计算倍率，看这三个钩子，不看数据层文案是否有数字。**

### F. 验证

| 门禁 | 结果 |
|---|---|
| 语法（`extract_js.py` → `node --check`） | 0 |
| `node tools\smoke.js` | **32/32** |
| `python -X utf8 tools\probe_sp_abi_detail.py` | **ALL PASS** |
| CDP `ER_ENGINE_VER` | **v4.245**（不是 `undefined`） |
| CDP `__erReady` / `species` | `true` / 1906 |

**端到端实测（雾眼卡展开，65px → 501px）**：

```
计算倍率（工具真正计入伤害的部分）
• 打出去 · 幽灵招 ×1.5（雾天）
• 改相性 · 雾天，对 幽灵招 封顶 ×0.5
```

前一版（v4.244）同一位置只显示「（ABI_TAGS 未登记标签）」。

**版本**：`1,643,331 B` / `A34241DF68C497A9D9025A99A032B2947B21C130`

---

## v4.246（2026-11-09）· 推荐卡「② 核心机制」补特性计算倍率（同一函数三处口径统一）

### A. 起点是一次覆盖率审计

对 15 个 UI 渲染函数逐个扫「是否引用了 8 张计算表」，结果：

| 函数 | 行 | 计算表 |
|---|---|---|
| `abiDesc` | 3850 | **8 张全有** |
| `renderAbi` | 6346 | `abiSrcBrief`（v4.245 补的） |
| `roleCard5Html` | 3295 | 仅 `ABI_ATK_KIND`（**且不是为了展示**） |
| `deriveBuilds` / `coreAbiPick` / `renderCore` / `renderAnTab` / `speedSliderHtml` / `dmgRender` | — | **0** |

`roleCard5Html` 里的 `ABI_ATK_KIND` 出现在 L3316-3322，用途是**推断前提状态**：`need==='poison'` → `_stA='poison'`、`need==='tgtMoved'` → `_tgt='moved'`，再传给 `dmgCalc`。**只影响算，不影响显示。**

⇒ 用户「拆解出的结论要在工具各个地方体现」这句话，在推荐卡这一格是空的：卡片写着「特性「分析」」，却不说它乘了多少。

### B. 改法（一处，最小）

`roleCard5Html` 的「② 核心机制」里，特性名拼接处：

```js
if(_abN)mechBits.push('特性「'+String(_abN)+'」'+(_br.length?(...):''));
```

改为先取 `_br = abiSrcBrief(_ab0.id)`，有值就在特性名后追加 `<span style="font-size:12.5px;color:var(--sub)">（前 2 条；超过 2 条写「等 N 条」）</span>`。

**为什么复用 `abiSrcBrief` 而不是新写一套**：三处（`abiDesc` / `renderAbi` / `roleCard5Html`）共用同一批表 + 同一个函数，**口径不可能分裂**。若各写一份，迟早出现「这页说 ×1.5、那页说 ×1.3」。

**为什么只取前 2 条**：`② 核心机制` 后面还紧跟现算击杀线，塞满会挤掉真正要看的伤害数字（用户明确抱怨过字号小、重点不突出）。

### C. 实测（`verify_246.py`，逐只渲染 ② 段）

| 只 | 推荐特性 | ② 段实测 |
|---|---|---|
| 小磁怪 #81 | #148 分析 | `特性「分析」（打出去 · 目标已行动时 ×1.3）` ✅ |
| 小拉达 #19 | #55 活力 | `特性「活力」（打出去 · 无条件 ×1.4）` ✅ |
| 大嘴雀 #22 | #177 疾风之翼 | `特性「疾风之翼」`（无灰字，正确 —— 回合类） |
| 胡地 #65 | #287 奇迹力量 | 同上 |
| 耿鬼 #94 | #276 猛鬼 | 同上 |
| 水箭龟 #9 | #144 再生力 | 同上 |

6 只里 2 只带倍率、4 只不带，**没有一只报错**，`roleCard5Html` 返回长度正常（`htmlLen=793`）。

### D. 配套配图重拍：`analyze_reccard.png`

原图是 v4.241 拍的（592×637），当时还没有这段灰字。已用 v4.246 重拍为 **684×474**，同一案例（小磁怪 #81 → 浩大鲸 `1107–1302` + `（按「对手已先行动」前提）` + 确定 OHKO），**新增可见「特性「分析」（打出去 · 目标已行动时 ×1.3）」**。

**截图踩坑（记下来免得再试）**：
- `--window-size` 在 `--headless=new` 下**不可靠**（同一 profile 二次启动实测视口塌成 593 宽）。改用 **`Emulation.setDeviceMetricsOverride(width, height, deviceScaleFactor, mobile)`** 固定视口，实测稳定 1400×1100 / dpr 1.25。
- `#anDetail` 的祖先链是 `DIV.lmod open` → `MAIN`（1200×1049）→ `BODY`，**没有 `.mbox`**（`.mbox.mboxwide` 那次量到 0×0）。按 `.mbox` 裁剪会直接返回 null。
- 裁「玩法流派 + 角色定位」的正确做法：取 `.andethead` 的 `top/left` 作左上角，取 `#anDetail` 内**所有元素的最大 `right`** 作右边界（`.fld` 只有 635 宽，长文字会溢出到 ~1034，按 `.fld.right` 裁会把行尾切掉）。

### E. 验证

| 门禁 | 结果 |
|---|---|
| 语法 | 0 |
| `node tools\smoke.js` | **32/32** |
| `python -X utf8 tools\probe_sp_abi_detail.py` | **ALL PASS** |
| CDP `ER_ENGINE_VER` | **v4.246** |

**版本**：`1,643,573 B` / `0D6BC67C88307CF14F4A9B4D1FD94CBF989BE174`

---

## v4.247（2026-11-09）· 核心配队页特性 chip 下补「⚔ 伤害倍率」

### A. 为什么是这一格

v4.246 修的是「队伍分析 → 推荐详情 → ② 核心机制」，那是**第三步**才看得到的地方。但用户最常打开的是**第一步**：核心配队页（`renderCore`，L16228-16559，25,436 字符，是全部未接面里最大的一块）。

那一格长这样（L16267-16274）：

```js
s.abis.map(function(n,ai){ return '<button class="chip" onclick="abiModal(...)">'+特性中文名+'</button>' })
```

**只有名字。** 想知道「分析」乘多少，得点开 modal 翻到底 —— 正是用户说的「这个就只能看吗，详细信息完全看不到」的同一个病。

### B. 改法：加一个只在有货时才出现的块

在 `abi4rule`（四特性体系说明）之后插入 `_brBox`，遍历 `s.abis` + `s.inns`，逐个调 `abiSrcBrief(id)`，把 8 张表折叠结果摊成一行行。

**取 id 的优先级**是 `s.abiIds[下标]` → `abiIdC(名)`。前者最稳（`abiIds` 与 `abis` 同索引对齐），后者只在 `abiIds` 缺失时兜底。

**为什么天性也要列**：`inns` 是**固定全部拥有、真叠加**，它的倍率一定生效 —— 不列等于漏掉一半信息。实测小磁怪 #81 天性「过滤」`承受 · 效果绝佳时 ×0.65`，这条对配招的影响不比特性小。

### C. 修文案前先发现的问题（重要）

第一版跑通后实测 `#22 大嘴雀` 显示「狙击手 ×1.5」，但它的**推荐特性是疾风之翼**。

原因是块里遍历 `s.abis` **全部 3 个**（因为 n 选 1，三个都可能是玩家选的那个），而第一版文案只写 `（特性）` —— 会被读成「三个都生效、还能叠加」。

改成按槽位数分两种文案：

| 情况 | 文案 |
|---|---|
| `abiN > 1` | `（特性，N 选 1 生效）` |
| `abiN == 1` | `（特性）` |
| 天性（任意个数） | `（天性，N 个固定全部拥有）` |

底部说明也补了一句「天性固定全部拥有，命中即叠加」，把「特性比大小、天性真叠加」这个区别钉死。

### D. 实测（`verify_247.py`，逐只 `selectCore` 后读块）

| 只 | 块内容 |
|---|---|
| #81 小磁怪 | 分析（特性，3 选 1）：打出去 · 目标已行动时 ×1.3 / 过滤（天性，3 个固定全部拥有）：承受 · 效果绝佳时 ×0.65 |
| #22 大嘴雀 | 狙击手（特性）×1.5 会心时 / 健壮胸肌（天性）×1.3 接触招式 |
| #9 水箭龟 | 消防员（特性）承受 · 攻方是火属性 ×0.5 / 超级发射器（天性）×1.3 波动/弹类 |
| #94 耿鬼 | 飘浮（天性）×1.25 飞行招 / **流质（天性）×1.5（雾天）** |
| #65 胡地 | **（无倍率块）** —— 正确，它的特性天性都不产生倍率 |
| #62 | 铁拳（特性）×1.3 拳类 |

**#94 的「流质」是 v4.242 修过的那条别名（`流质→灵质621`）** —— 这里显示的是**物种表口径**名，倍率也正确（`×1.5（雾天）`），说明那条修正一路走到 UI 都通。

### E. 配图与踩坑

新增 `docs/manual/img/core_abi_mul.png`（67,737 B，1155×379），拍的是 #81 卡片的 chip 区 + 倍率块。

**裁剪踩的坑**：`#coreOut` 是 1131×2675 的长容器，直接按容器裁会得到一张没人看得清的长图。正确做法是**用块内元素自身定位**：`.chiprow`（认 `innerText` 含「特性」的那个）的 `top` 往上 58px 作顶，`tip` 的 `bottom` 往后再留 78px 作底。

**第一次裁出来底部被切**，因为我对 `tip` 的 `getBoundingClientRect().bottom` 加了 20px，但实际那两行 + 底部说明 + padding 共比 rect 高出一截。**加够 78px 才完整** —— 这类「按 rect 精确算反而切边」的情况，留固定冗余比推公式稳。

### F. 验证

| 门禁 | 结果 |
|---|---|
| 语法 | **0** |
| `node tools\smoke.js` | **32/32** |
| `python -X utf8 tools\probe_sp_abi_detail.py` | **ALL PASS** |
| CDP `ER_ENGINE_VER` | **v4.247** / `erReady=true` / `species=1906` |

**版本**：`1,645,148 B` / `5874E58C2515596D195A1F795DF423223B15F7D8`

---

## v4.248（2026-11-09）· 伤害面板「倍率分解」行（明细从 title 提到明面）

### A. 审计表里那个「0」要重读

v4.246 / v4.247 的审计表把 `dmgRender` 标成「计算表 0 引用」。**这个结论对，但结论对不代表功能缺。**

重读 L7260-7266 会发现伤害行早就有这两个 span：

```js
(r.abiMul&&r.abiMul!==1?(' · <span title="'+esc(r.abiHit.join('；'))+'">特性减伤 ×'+r.abiMul+'</span>'):'')+
(r.atkMul&&r.atkMul!==1?(' · <span title="'+esc(r.atkHit.join('；'))+'">特性增伤 ×'+r.atkMul+'</span>'):'')+
```

**倍率一直在算、一直在显示。** 缺的是**依据**：`atkHit` / `abiHit`（哪条特性、什么条件判出来的）被塞进了 `title` —— 要鼠标悬停才看得到。

**这和「特性 chip 只有名字」是同一个病，只是藏得更深。** 用户看得到 `特性增伤 ×1.5`，看不到「凭什么是 1.5」。所以这一轮不动 `dmgCalc`，只把已有的 `hits` 数组提到明面。

### B. 加的那一行

在伤害行之后、命中率之前插入一个 `box.innerHTML+=` 块，内容是：

```
倍率分解　克制 ×1　·　特性增伤 ×1.5［贤者之力×1.5(特殊招)］　·　生命宝珠 ×1.3　·　随机 0.85–1.00
```

组成：`克制 ×eff` + `本系 ×1.5`（有 STAB 才出现）+ `特性增伤/减伤 ×N［hits 明细］` + 天气（晴→火 / 雨→水）+ 场地（电气→电 / 青草→草 / 精神→超能力 / 薄雾→龙守方 ×0.5）+ 道具（生命宝珠 ×1.3 / 讲究头带·眼镜 ×1.5，按 `mv[4]` 分物特）+ `会心 ×2` + `随机 0.85–1.00`。

**`dmgCalc` 一行没改。** 全部取它已返回的 `eff/stab/atkMul/atkHit/abiMul/abiHit`，天气场地道具暴击从 `__spdSl` 现读。

**为什么用中文全角方括号 `［］` 包明细**：`hits` 的元素本身带英文括号（`贤者之力×1.5(特殊招)`），如果外层再用 `()` 会套成 `((...))` 难读；而 `［］` 也避开了 `esc → scrubLeak` 的空括号触发规则。

### C. 实测（`verify_248b.py`）

| 场景 | 输出 |
|---|---|
| 猴怪 #55「贤者之力」十万伏特 → 小拉达 | `克制 ×1 · 特性增伤 ×1.5［贤者之力×1.5(特殊招)］ · 随机 0.85–1.00` |
| 同上 + 生命宝珠 + 会心 | `克制 ×1 · 特性增伤 ×1.5［…］ · 生命宝珠 ×1.3 · 会心 ×2 · 随机 0.85–1.00` |
| 同上 + 雨天 | **天气项不出现** —— 招式是电属性，雨天只加乘水属性，正确 |

`atkHit` 的原始格式是 `特性名×倍率(条件)`，实测样本 `贤者之力×1.5(特殊招)` 与 `dmgAtkAbiMul` L6942 的 `hit.push(n+'×'+kd.mul+'('+_kl+')')` 完全对上。

### D. 截图踩坑（第三次踩同一类）

`#dmgOut2` 在详情弹层里，打开后 `getBoundingClientRect().y = 1424` —— **在 1100 高的视口之外**，直接按 rect 裁得到一张纯白图（141×12）。

正确做法：先 `b.scrollIntoView({block:'center'})`，等 1.2s 再重新取 rect。**取 rect 的时机必须在滚动之后**，用滚动前的坐标裁必然空。

另外 `#dmgOut`（主页面那个）在 speed Tab 下 `getBoundingClientRect()` 全是 0 —— 它所在区域不渲染。**测这块只能用详情弹层的 `#dmgOut2`**（`openSpById(55)` 之后）。

配图 `docs/manual/img/dmg_break.png`（787×165）。

### E. 验证

| 门禁 | 结果 |
|---|---|
| 语法 | **0** |
| `node tools\smoke.js` | **32/32** |
| `python -X utf8 tools\probe_sp_abi_detail.py` | **ALL PASS** |
| CDP `ER_ENGINE_VER` | **v4.248** |

**版本**：`1,647,140 B` / `99660D4FC378BF9B31577F6AF21D70A926E5AD1D`

---

## v4.249（2026-11-09）· 「Mega形态」开关语义反了 —— 开着却专门保留该滤掉的

### A. 用户报的现象

手机端截图（宝可梦 Tab）：「Mega形态」chip 亮着（蓝色＝已激活），下面照样列出妙蛙花 / 喷火龙 / 水箭龟 —— **这三只全都带 Mega**，用户的原意是「把有 Mega 形态的非 Mega 宝可梦筛掉」。

用户的判定很直接：喷火龙有 Mega，它就不该出现在这个列表里。

### B. 先证伪了最容易想到的那个解释

第一个怀疑是我上一轮反复踩过的**分片异步**：`hasMegaSet()` 懒建 `_HASMEGA` 并缓存，如果首次调用早于 `ERDATA.familyRoot`（分片数据）到位，就会把空集**永久缓存**，`hasMegaForm()` 恒 false，过滤静默失效。

CDP 实测（`diag_mega.py`）：

| 项 | 值 |
|---|---|
| `ERDATA.familyRoot` | **534 keys**，样本 `3->3, 6->6, 9->9` |
| `_HASMEGA` | **247 条**（`3,6,9,12,15,18,24,26,28,31,34,36…`） |
| `hasMegaForm(喷火龙 #6)` | **true** |
| `optMegaOnly` | **true** |

**⇒ 缓存没坏、数据没坏、核心配队页的过滤是对的。** 我原本的猜测不成立。

### C. 真正的根因：两套同名开关，语义相反

用户截图那个页面不是核心配队页，是**宝可梦 Tab**，它的过滤走的是另一条线 `spMatch`（L3513）：

```js
if(fOpt.mega&&!(isMegaForm(s)||hasMegaForm(s)))return false;   // 旧
```

读法：开关打开时，**保留**「本身是 Mega」**或**「可 Mega 的非 Mega」的 —— 即 `hasMegaForm` 为 true 的**被专门保留**。

而 `hasMegaForm(s)` 的语义恰恰是「**这只自身不是 Mega、但族群有 Mega**」（`_HASMEGA[族群根 id]`）。于是：

| 页面 | 代码 | 对 `hasMegaForm` 的处理 | 结果 |
|---|---|---|---|
| 核心配队 | `coreMatch` L16681 | `…&&hasMegaForm(s)&&!_q → return false` | **排除** ✅ 对 |
| 宝可梦 Tab | `spMatch` L3513 | `!(isMegaForm\|\|hasMegaForm) → return false` | **保留** ❌ 反了 |
| 招式反查「谁能学」 | `lkKeep` L6320 | `megaOnly&&hasMegaForm(s) → return false` | **排除** ✅ 对 |

**同一个名词，三种消费点，只有宝可梦 Tab 这一个把谓词用反了。** 所以喷火龙 (#6，`isMegaForm=false`、`hasMegaForm=true`) 正好命中旧式里那个「或」的右半边，被留下来。

### D. 修法与验证

```js
if(fOpt.mega&&hasMegaForm(s))return false;   // 新：与核心配队页同口径
```

chip 文案 `Mega形态` → `Mega 形态优先`，与核心配队页 `Mega 形态优先（过滤可 Mega 的非 Mega）` 对齐（`tchip(t,on,fn)` 不支持 title，短文案即可）。

实测（`verify_249.py`）：

| 开关 | 列表总数 | 其中「可 Mega 的普通形态」 |
|---|---|---|
| 关（`fOpt.mega=0`） | 1906 | 247 |
| 开（`fOpt.mega=1`） | **1659** | **0** |

`spMatch(喷火龙 #6)`：关 → `true`，开 → `false`。

1906 − 247 = 1659，**数字自洽**。列表实际文本也核了：开启后 `妙蛙种子 / 妙蛙草 / 小火龙`，`妙蛙花 #3` 不出现在前 160 字内。

### E. 顺手补的防御

虽然实测 `_HASMEGA` 是正常的 247 条，但「空集永久缓存」这个风险在结构上是存在的（和 v4.244 的 `IMMUNE_RISK` 同类）。改成：

- `familyRoot` 为空时**不写缓存**（`if(!Object.keys(fr0).length)return {}`）
- 首次调用时登记一次 `er-ready` 监听，数据齐了把 `_HASMEGA` 置 null 重建

这样即便某个环境里首次调用真的早于分片，也会在数据到位后自愈，而不是永久错下去。

**这是防御性改动，不是本轮故障的原因** —— 别把两件事混成一件。

### F. 验证与版本

| 门禁 | 结果 |
|---|---|
| 语法 | **0** |
| `node tools\smoke.js` | **32/32** |
| `python -X utf8 tools\probe_sp_abi_detail.py` | **ALL PASS** |
| CDP `ER_ENGINE_VER` | **v4.249** |

**版本**：`1,647,902 B`

配图 `docs/manual/img/poke_mega_on.png` / `poke_mega_off.png`（手机视口 430 宽对拍）。

---

## v4.250（2026-11-09）· 配速滑块补「为什么是这个速度」+ 分支清理

### A. 缺的那一行

`speedSliderHtml` 的「ER修正乘区」那排 chip 一直是：

```
围巾×1.5   特性×1.5   顺风×2
```

`特性×1.5` 这一格**只有倍率，没有名字、没有条件**。而 `spdSpeedAbiOf(s)` 返回的对象本来就带全了：

```js
{zh:'轻装', mul:2, cond:'item', label:'消耗掉道具后', src:'UNBURDEN L1450'}
```

**信息在数据里，只是没接到界面上** —— 这和 v4.247「特性 chip 只有名字」是同一个病的反面（那是有名字没数值，这是有数值没名字）。

**还有一个更容易误导的：轻装 ×2 要真消耗掉道具才生效。** 用户看到「特性×2」会默认整局 ×2，实际能不能用取决于有没有吃道具。这类条件不写出来，配速结论就是错的。

### B. 改法

新增 `spdAbiWhyHtml(s)`，在 chip 行下方追加一行灰字：

```
提速来自 轻装 ×2（消耗掉道具后） · 要真的把道具消耗掉才生效，不是常驻
```

- 无特性 → 返回空串，整行不出现（不占位）
- `cond==='item'` → 追加橙字警告
- `cond==='turn5'` → 追加「只在出场前 5 回合，之后恢复原速」
- 减速特性 → 输出「减速来自 …」

**`SPD_ABI` 表没动。** 这轮只补展示，不改任何速度算法。

实测四只（`verify_250.py`）：

| 宝可梦 | 输出 |
|---|---|
| 飞腿郎 #106「轻装」 | 提速来自 轻装 ×2（消耗掉道具后） · 要真的把道具消耗掉才生效，不是常驻 |
| 烛光灵 #607「飘渺冲刺」 | 提速来自 飘渺冲刺 ×1.5（雾天） |
| 哥达鸭 #55「悠游自如」 | 提速来自 悠游自如 ×1.5（雨天） |
| 慢启动 | 无持有者（`abiIdC('慢启动')`=112，实测 0 只） |

配图 `docs/manual/img/spd_why.png`。

### C. 顺带做的源码对账

用 `audit_spd_abi.py` 扫 `er_abilities.cc` 全部 `Impl<ABILITY_*>`，筛 `.onStat` + `STAT_SPEED` 的乘区走法，得 **17 条**，与 `SPD_ABI` 14 条对比：

| 差异 | 结论 |
|---|---|
| `LEAD_COAT` 源码 `*stat *= .9` | 表内 `铅衣 0.9` **一致** |
| `TERASTAL_TREASURE` 源码 `*= .8` | 表内 `0.8` **一致** |
| `THERMAL_SLIDE` 源码 `*= 1.5`（晴**或**雪） | **表内没有** |
| `JUNGLE_FEVER` 源码 `*= 1.5`（青草场地） | **表内没有** |
| `THICK_BLUBBER` 源码 `*= .5` | **表内没有** |
| `SOUL_HARVEST` `onStat` 只加不完全属性 | 非速度乘区，正确排除 |
| `RUN_AWAY` `.onStatLowered`（被降时 +2 级） | 非乘区，正确排除 |

**⇒ 发现 3 条漏项。** 这一轮**没有补进 `SPD_ABI`** —— 因为补了就立刻改速度线页面和配速方案的结果（会影响 227 只「只列有提速特性的」名单），必须先建基线做前后对比，不能顺手塞。**记为下一轮待办。**

### D. 分支清理（同日）

用户看到 GitHub 上 17 个分支，问有没有冗余。实测结论：

| 类别 | 数量 | 处置 |
|---|---|---|
| 已完全合入 master（`ahead=0`） | 13 | 删 |
| 内容全在 gh-pages（部署产物快照） | 2 | 删 |
| **有独有补丁** | **1** | **保留** |
| master / gh-pages | 2 | 保留 |

保留的是 `master-legacy-20261107`：`git cherry` 显示 5 条全是 `+`，它是**另一条演进路线**（AGENTS 曾被拆到 28 KB，后来又合回 220 KB）。产物留在 master，路线没继续 —— 删了追溯不到当初的决策顺序，所以留着。

本地另有 15 个从未推送的残留分支（`er475`~`er485`、`v485` 等）同批清理。

台账：`docs/research/分支清理台账_20261109.md`（含每个分支的 SHA，可 `git push github <SHA>:refs/heads/<name>` 恢复）。

### E. 一条流程修正 —— master 积压 100 个提交

用户问「为啥仓库最近更新是两天前，但部署页面没问题」。根因不是故障：

- `gh-pages` 每次 deploy 都推 → 页面总是最新
- `master` 一直没跟上 → 落后 `fix/abi-dedup-detail-20261108` **100 个提交**

GitHub 首页默认显示 master，所以看起来「停滞」。

**⇒ 收尾动作固定为：deploy 成功后推进远端 master。**

```powershell
& 'D:\Git\bin\git.exe' push github <当前分支>:master
```

**不要用 `checkout master` 再 merge 的方式** —— 工作区的 `index.html` 会被换成 master 那份旧版，之后一跑 deploy 就把旧版推上去了。用远端推送，本地不动。

### F. 验证与版本

| 门禁 | 结果 |
|---|---|
| 语法 | **0** |
| `node tools\smoke.js` | **32/32** |
| `python -X utf8 tools\probe_sp_abi_detail.py` | **ALL PASS** |
| CDP `ER_ENGINE_VER` | **v4.250** |

---

### 版本

| 版本 | 字节 | SHA1 | 状态 |
| v4.266 | 1,670,141 | 7B8653DE766BFE279E8CBAD85AE48242A3B7C700 | 线上一致（gh-pages 0a7f3a4 + 745b38a 触发重建，逐字节核验） |
| v4.267 | 1,671,564 | EB1839C32518D2411440BAAE7F30E1F5A30D07F2 | 线上一致（gh-pages c055e84 + 08c7af7 触发重建，逐字节核验） |
| v4.268 | 1,674,886 | 58523E697CF83B7FA0F889B639E3320CBA0E1552 | 线上一致（gh-pages `5315ee0`，逐字节核验；commit `b0f3249`） |
| v4.269 | 1,682,432 | 1C73DE4A5235B20768666129049E6A95ABB5E36D | 线上一致（gh-pages `7a18e22`，逐字节核验；commit `0328edf`） |
| v4.270 | 1,684,477 | 7C5F65AB5C7BBA98A249756C0F15CF41012B8117 | 线上一致（gh-pages `715954f`，逐字节核验；commit `5b9a2dc`） |
| v4.271 | 1,685,593 | 66B7776D92D76874E95F3DCCE63319B2645A2735 | 线上一致（gh-pages `a4b97dc`，逐字节核验；commit `1a7c53c`） |
| v4.272 | 1,687,236 | A08347ECEBD11F09DF089C6430FD0352D6095A67 | 线上一致（gh-pages `3cd2754`，逐字节核验；commit `990b3de`） |
| v4.273 | 1,687,344 | 27DCB83853902CB2EF84014679B44FA734599DCA | 线上一致（gh-pages `419197f`，逐字节核验；commit `b938f16`） |
| v4.274 | 1,690,316 | 3C5E8362673686245975968633638B506E9679FC | 线上一致（gh-pages `6eb2919`，逐字节核验；commit `7c84425`） |
| v4.275 | 1,692,882 | 9FEDBA2F8D77EC1F7A78AEFCC45EB50F6803DB18 | 待部署（加速这类回合累积型增速） |
| v4.265 | 1,667,029 | E26FC629007C009ECA51ED3F10CC31DCACE2EC73 | 线上一致（gh-pages a7f67f2，逐字节核验） |
| v4.264 | 1,664,224 | 77A945C686E24B2548792EDA7DBCC6646ABED7BE | 线上一致（gh-pages dd6fb6e，逐字节核验） |
| v4.263 | 1,659,525 | 1E2AA5454F75BCFDB227BD1B35540FF920CFD929 | 线上一致（gh-pages ab2c072 / master fc089ba） |
| v4.262 | 1,660,035 | 504956A68A78EFAF48BB06D14935B73BED891E28 | 线上一致 |
| v4.261 | 1,659,171 | D14E43B035FA0C68C52631320F9BB383734CE1D9 | 线上一致 |
| v4.260 | 1,658,612 | DD732ABDEBC006B70D93BC5A60DFA0DB1761C9EC | 线上一致 |
| v4.259 | 1,658,320 | 7FF4CDF71FC7FA43174DB601710375DB657A8EE6 | 线上一致 |
| v4.258 | 1,655,672 | E3826AA883153492AA971E7724FF8BADB6BA50D2 | 线上一致 |
| v4.257 | 1,655,409 | 5DDFBF18B79FE554B5F879706D0769055C997635 | 线上一致 |
| v4.256 | 1,654,256 | 939AC7438828F4BCD85B6528985CADDE239E4D40 | 线上一致 |
| v4.255 | 1,653,314 | C8DB4AC3079238B68FAEBF425723B914E3CEAEC0 | 线上一致 |
| v4.254 | 1,651,034 | 74D63C242CA6E5AA737A6DE8DE55299FAAF1A162 | 待部署 |
| v4.253 | 1,650,856 | 6C43F8C1FB531670F7F0328DDEF798C46FD02270 | VERIFIED-MATCH |
| v4.249 | 1,647,902 | A045F0FD0FD6707135257D6D9F13C9AB0971C86E | VERIFIED-MATCH |
| v4.252 | 1,649,690 | 5860F39804E8720AD9F62459ACE254A0C5A96653 | VERIFIED-MATCH |
| v4.251 | 1,649,100 | 6607A3FA52E3962EE8A2D3FAC47CBFB4560179FB | VERIFIED-MATCH |
| v4.248 | 1,647,140 | `99660D4FC378BF9B31577F6AF21D70A926E5AD1D` | VERIFIED-MATCH |
| v4.247 | 1,645,148 | `5874E58C2515596D195A1F795DF423223B15F7D8` | VERIFIED-MATCH |
| v4.246 | 1,643,573 | `0D6BC67C88307CF14F4A9B4D1FD94CBF989BE174` | VERIFIED-MATCH |
| v4.245 | 1,643,331 | `A34241DF68C497A9D9025A99A032B2947B21C130` | VERIFIED-MATCH |
| v4.244 | 1,639,431 | `A9313394B21567C3FC34BE5FFA1D0C353AB693FA` | VERIFIED-MATCH |
|---|---|---|---|
| v4.232 | 1,620,439 | `379B88940B860FF6E327A888BE0E847DCDEB2E18` | VERIFIED-MATCH |
| v4.233 | 1,621,893 | `C4BF136C815387BF64A400118F1DDE3FBC7300AA` | VERIFIED-MATCH |
| v4.234 | 1,622,799 | `E192962D86FE818CC4A02B2EA0780252BA29A884` | VERIFIED-MATCH |
| v4.235 | 1,625,196 | `E7B1F91B1E3C8F73A02FAECBD9E5225A6BD7B645` | VERIFIED-MATCH |
| v4.236 | 1,629,493 | `CFB2D212AF0272D74A840A9B925615802B2486F9` | VERIFIED-MATCH |
| v4.237 | 1,632,482 | `19B43716E8FF0EF828D9625D25B3CEAC8E1C94B8` | VERIFIED-MATCH |
| v4.238 | 1,633,724 | `E0C6F14072B268EE3BE386B690CB343A82EEBA06` | VERIFIED-MATCH |
| v4.239 | 1,634,630 | `425BAE9519F143C9643AD9592B8271046AA6486A` | VERIFIED-MATCH |
| v4.240 | 1,634,950 | `7B6F7ACDD5CD68749D4249A3FA89892C4960800A` | VERIFIED-MATCH |
| v4.241 | 1,636,126 | `02FB9539E67D641EC2D2B79DBDE6A07D3709095A` | VERIFIED-MATCH |
| v4.242 | 1,637,718 | `2F14150D22A57BA5952B60D1AE40F0184392E164` | VERIFIED-MATCH |
| v4.243 | 1,637,979 | `D9446B1DC662FCB74B3CA97FDDE1CC2FCE016B5F` | VERIFIED-MATCH |

### 仍是「静态算不了」的

约 45 条 `.onOffensiveMultiplier` 依赖 `IS_MOVE_PHYSICAL`/目标状态/己方状态/场上他人/回合/场地/天气。
`FLAG_WEATHER_BASED`（14 招）只被 `DELTA_STREAM` 的 `.onImmune` 使用，是免疫判定不是增伤 → 证伪，不接。
`Dual Shadow`（恶/电 ×1.35）数据层无中文名，跳过。
暗黑/妖精气场是 `APPLY_ON_ANY`，工具近似为「只算自己」，`auraBreak → ×0.75` 未建模。


---

### G. README 重构（同日）—— 对外介绍与技术记录分离

用户指出「README 太过于技术了，README 是对外的，要绚丽生动一些，展现自己的功能；技术相关的用其他文档跟踪」。

量化后确认问题规模：README 114,323 B / 134 行，其中「## 更新记录」一段占 **106,475 B（93%）**，是 v4.3~v4.73 的技术流水账（每版都带 SHA256、字节数、守门数字、临时目录路径）。

**处置顺序：先保全，再重写。**

| 步骤 | 动作 | 校验 |
|---|---|---|
| 1 | 把「## 更新记录」**整段原样**（一字未改）下沉到 `docs/changelog/VERSIONS.md` 末尾，加独立章节标题与来源说明 | 断言 `hist in target` 逐字节包含 |
| 2 | 比对版本覆盖：README 有 54 个版本条目，VERSIONS.md 原有 32 个章节，**43 个只在 README 有**（v4.3/v4.4/v4.5/v4.6/v4.34g/v4.35~v4.73 等） | 43 个版本号逐个断言 `count > 0`，缺失=0 |
| 3 | 重写 README：8,143 B → 最终 7,9xx B，208 行，12 张真实截图 | 12 张图 `Test-Path` 全 OK |

`VERSIONS.md` 336,880 B → **443,874 B**（+106,994 B）。

**新 README 的取舍口径：**

- **留**：它解决什么问题（痛点描述）、九个工作台一句话定位、「源码为准」这个核心差异点、功能细节（每个配一张真实截图 + 读法）、快速开始、数据来源、文档指针
- **删**：所有 SHA256 / 字节数 / 守门数字 / 临时目录 / 构建脚本名 / 分片文件名 / 部署分支操作 / 逐版实现细节
- **保留的少量技术词只有两处**：`ER_ENGINE_VER`（解释页头版本号来源，证明版本号不是手写）、`配招助手_ER.html` 是跳转页（回答"两个 html 什么关系"这个高频疑问）

**`配招助手_ER.html` 的定性（用户问过）：** 1,673 B 的 meta-refresh 跳转页，不是第二份程序。历史上是旧版同哈希副本，v4.246 前后收敛为跳转入口（见 `stale-entry-alias-dual-source-drift` 经验）。README 里明确写出这点，避免用户以为是两个不同工具。

**部署影响：** `README.md` 在 `deploy_er.ps1` 的 5 文件白名单内（`index.html` / `README.md` / 三个 data 分片），所以 README 改动需要过一次 deploy 才能同步到 gh-pages。


## v4.251（2026-11-09）· SPD_ABI 补齐三条源码已确认漏项

### A. 这次补的是什么

`SPD_ABI`（速度修正特性表）此前是 14 条。源码 `src/abilities.cc` 里已确认存在三条会改速度、但表里没有的特性：

| id | 英文 | 中文 | 倍率 | 源码条件 | 源码行 |
|---|---|---|---|---|---|
| 862 | Thermal Slide | 热滑 | ×1.5 | 晴天**或**雪天 | L10521 |
| 1027 | Jungle Fever | 丛林热 | ×1.5 | 青草场地 | L12688 |
| 889 | Thick Blubber | 厚脂 | ×0.5 | 始终减速 | L10915 |

三条的持有者是：

- 热滑：`2176 超级帝王拿波R`、`2604 帝王拿波R`
- 丛林热：`2655 伦琴猫R-B`、`2656 超级伦琴猫R-B`
- 厚脂：`2282 Rexcadrill`

### B. 一个差点判错的细节：热滑和厚脂在天性里

抓持有者时先写 `s.abiIds.indexOf('862')`，返回 0 命中，几乎要判定「源码有、数据层无拥有者」。逐条 dump 才看清：

```js
2176 超级帝王拿波R  abis=["霜焰","霜焰","霜焰"]  abiIds=["475","475","475"]
                    inns=["亲子爱","热力占卜","热滑"]
2282 Rexcadrill      abis=["硬爪","极地毛发","松散岩石"]  abiIds=["181","392","405"]
                    inns=["#1031","厚脂","龙颚"]
```

**热滑和厚脂是「天性（inns）」，不是「特性（abis）」。** 而 `spdSpeedAbiOf` 池化的是 `[].concat(s.abis, s.inns)`，所以表里加了就能命中；只有按 `abiIds` 单独查会漏掉。

三个字段口径务必分清：`abis`/`inns` 是中文名数组，`abiIds`/`innIds` 是 id 字符串数组。写 `abids`（小写）会得到 `undefined` → 空集，本轮连中两次，先得出 442 条「零持有」、再得出 241 条，都是假数字。

### C. 补表和 cond

新增三行（`SPD_ABI` 14 → 17）：

```js
{zh:'热滑',   mul:1.5, cond:'sunhail', label:'晴天或雪天（二者其一）', src:'THERMAL_SLIDE L10521'},
{zh:'丛林热', mul:1.5, cond:'grassy',  label:'青草场地',              src:'JUNGLE_FEVER L12688'},
{zh:'厚脂',   mul:0.5, cond:'always',  label:'始终',                  src:'THICK_BLUBBER L10915'}
```

`cond` 只驱动 `spdAbiWhyHtml` 的条件文案，不参与计算；`spdSpeedAbiOf` 的逻辑始终是「按 `abiSame` 命中 → `mul>1` 归 up 取最大、否则归 dn 取最小 → 加速项优先」。所以新增 `sunhail` / `grassy` 两个取值不会影响任何数值，只是让条件说明不被硬编码成单一场景（原有 `terrain` 的 label 写死「电气场地」，丛林热不能复用）。

### D. 影响面：实测零回归

| | 补表前 | 补表后 |
|---|---|---|
| `spdSpeedAbiOf` 命中数 | 288 | **293** |
| 新增 | — | 2176 热滑×1.5 / 2604 热滑×1.5 / 2655 丛林热×1.5 / 2656 丛林热×1.5 / 2282 厚脂×0.5 |
| 删除 | — | **0** |
| 判定变化 | — | **0** |

纯增量：没有一只宝可梦的既有判定被改动。基线导出 → 补表 → 再导出 → 逐 id 比对（`spd_baseline.json` ↔ 实时），ADDED 5 / REMOVED 0 / CHANGED 0。

实算值验证：热滑 ×1.5 → 595、丛林热 ×1.5 → 568、厚脂 ×0.5 → 136。

### E. 门禁同步

`tools/probe_sp_abi_detail.py` 里 `F87` 原断言写死 `N=14`，补表后必然失败。改为 `N=17`，并新增 `F92` 校验三条的倍率与存在性；同时把 `spdAbi` 采样名单从 6 条扩到 9 条，否则新增项不会被采集到，断言会假失败。

### F. 遗留

- `SPD_ABI` 里的「慢启动 ×0.5」持有者为 **0 只**（数据层没有宝可梦带它），是永不触发的僵尸行。保留是因为源码确实有 `SLOW_START`，删掉会丢「源码有而数据没有」这条信息；未加标注。
- 数据层 1034 条特性里有 **35 条无任何拥有者**（按 `abiIds`/`innIds` 口径）。其中 `#1031 Rock Armor` 甚至没有中文名，出现在 `2282 Rexcadrill` 的 `inns` 里时是字面 `"#1031"`。

### 门禁

语法 0 ｜ smoke 32/32 ｜ probe ALL PASS（118 项）｜ 名单 288→293，ADDED 5 / REMOVED 0 / CHANGED 0

### 版本

`v4.251`，1,649,100 B。

## v4.252（2026-11-09）· 「有实现、没投放」的 35 条特性，让界面自己说出来

### A. 问题

特性反查页每张卡都挂着「可选 N / 天性 N」两个徽标。有 35 条特性这两个数字都是 **0** —— 源码里有完整 `Impl<ABILITY_X>`，但物种表没把它分配给任何物种。

玩家的第一反应是「工具坏了」或者「我搜错了」。实际上数据没毛病，缺的是**解释**：卡片只是沉默地显示 0，不说为什么。

### B. 修法：一个红标 + 一段话

标题行加红标「本作无人拥有」，展开后持有者区给一段解释：

> 本作没有任何宝可梦拥有这个特性。源码里有它的实现，但没有分配给任何物种，所以配队、特性反查、速度线、伤害面板都不会出现它。

**关键是判断必须用过滤前的数据**：

```js
var _g0=own[a[0]]||{ab:[],inn:[]};
var _zeroAll=(_g0.ab.length===0&&_g0.inn.length===0);
```

`renderAbi` 里 `optAbiFinal` / `optAbiMega` 两个开关会过滤持有者。如果拿过滤后的 `grp` 判断，用户一开「仅最终形态」，某些原本有人的特性会临时变成 0 只，被误标成「本作无人拥有」——那是用户自己开出来的，不是数据事实。**判断口径和展示口径必须分开。**

### C. 顺带清掉手册里的一段技术口径

手册 §9.3 原来写的是：

```
❌ 按英文名匹配 s.abis → 永远 0 只
✅ 按 id 匹配 s.abiIds / s.innIds
```

这是排查用的口径，不是给玩家看的。改成玩家语言 + 新配图 `abi_zero.png`，讲清楚红标什么意思、这 35 条为什么存在。技术口径移到 dev 文档的「零持有特性」一节，含 35 条清单和 `_zeroAll` 判定的坑。

### D. 门禁

语法 0 ｜ smoke 32/32 ｜ probe ALL PASS（118 项）

实测：搜「回声定位」→ 标题行出现「本作无人拥有」，展开后解释文案完整，`hasZeroHint=true`。非零持有特性不受影响（`_zeroAll` 为 false 时整段不生成）。

### 版本

`v4.252`，1,649,690 B，`5860F39804E8720AD9F62459ACE254A0C5A96653`。

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

`v4.237`，1,632,482 B，`19B43716E8FF0EF828D9625D25B3CEAC8E1C94B8`（VERIFIED-MATCH），commit `e56011b`。


---

## v4.238：全文件断链扫描 + 目标状态型增伤（蹲守/分析）

### A. 「有调用点、无定义」全量扫描（`surviveSolve` 之后的排查）

`node --check` 查不出这种问题（语法完全合法），`smoke.js` 也未必覆盖到那条路径，
所以做了一次全文件扫描：

1. `extract_js.py` 取纯 JS。
2. 正则抓定义（`function X` / `var|let|const X` / `window.X=` / `X = function(`）+ 函数与箭头函数参数。
3. 正则抓调用 `(?<![\w$.])X\s*\(`，差集 + 剔 JS 内建 → 82 个候选。
4. **关键：把候选丢进真实浏览器逐个 `typeof eval(X)`** —— 字符串/URL/注释/CSS 里的名字
   静态看着像调用，运行时都是 undefined 的假阳性，只有运行时判定才准。

**结果**：82 个候选去掉假阳性后只剩 `QRCode`，继续追发现是按需加载 ——
`assets/qrcode_v498.js` 分片里确实有 `var QRLIB=…` 与 `function QRCode(text)`，
端到端实测首次 `undefined`（走加载分支）→ 分片加载后 `create=function` / `QRCode=function`，
canvas 暗像素 7024 / ratio 0.488。**不是断链。**

**结论：`surviveSolve` 是全文件唯一一处真断链，已在 v4.237 修复。**

### B. 顺带修掉「复算点不同步」

`ohkoSolveEv` / `surviveSolve` 构造 `dmgCalc` 参数时是**逐项手抄**的：

```js
dmgCalc({sA:o.sA,sD:o.sD,moveId:o.moveId,evA:ev,evD:o.evD,natA:o.natA,
         natD:o.natD,itemA:o.itemA,weather:o.weather,terrain:o.terrain,crit:o.crit});
```

`stA`（v4.237 加）与 `tgt`（v4.238 加）都没抄进去 → 反推时特性增伤不生效，
出现「已判定确定 OHKO、同时又说即使 +252 攻击也无法 OHKO」的自相矛盾。两处都补齐。

修后实测（探探鼠 #504 → 小拉达，拍击）：

| 目标状态 | 伤害 | 结论 | OHKO 反推 | 耐久反推 |
|---|---|---|---|---|
| 站场已久 | 68–81 | 2HKO | 即使 +252 攻击也无法 OHKO | 扛1下 HP+0/物防+0 |
| 刚入场（蹲守 ×2） | 137–162 | 确定 OHKO | 最低攻端 EV = 0 | 扛1下 HP+40/物防+236；扛2下 252/252 也必死 |
| 已先行动（分析 ×1.3） | 89–105 | 概率 OHKO(44%) | 最低攻端 EV = 44 | 扛1下 HP+0/物防+44 |

### C. 目标状态型增伤：蹲守 / 分析（35 只物种）

```cpp
// abilities.cc:2702  STAKEOUT 蹲守
if (gVolatileStructs[target].isFirstTurn == 2) MUL(2.0);

// abilities.cc:2109  ANALYTIC 分析
if (GetBattlerTurnOrderNum(target) < gCurrentTurnActionNumber
    && gBattleMoves[move].effect != EFFECT_FUTURE_SIGHT) MUL(1.3);
```

**共同点：条件完全在对手侧**（对手的 `isFirstTurn` / 对手本回合行动序号），
与攻方自身属性、异常都无关。所以做成与「攻方状态」并列的第二组 chip「目标状态」。

**三档互斥**（换上场的回合不会再行动）：`站场已久''` / `刚入场'new'` / `本回合已先行动'moved'`。

`ABI_ATK_KIND` 13 → **15 条**，新增 need 枚举 `tgtNew` / `tgtMoved`；
`abiAtkKindOk` 加两分支只读 `ctx.tgt`；`dmgCalc` ctx 透传 `tgt`；
`dmgRender` 的 `o` 带 `tgt:__spdSl.tgt||''`；`__spdSl` 初始化补 `stA:''` / `tgt:''`。

**覆盖**：蹲守 11 只（可选 5 + 天性 6）、分析 24 只（可选 14 + 天性 10）。

### D. 确认「不接」两条

`无精打采` #394（Lethargy）与 `慢启动` #112（Slow Start）源码已读清：

```cpp
// LETHARGY：onEntry 置 slowStartTimer=5；onOffensiveMultiplier 按 timer 递减
case 0: case 1: MUL(.2);  case 2: MUL(.4);  case 3: MUL(.6);  case 4: MUL(.8);  /* 5 → ×1 */
// SLOW_START：onEntry 置 5；onStat 对 ATK/SPATK/SPEED 各 *stat /= 2
```

但**两者在数据层持有者都是 0**（可选 0 / 天性 0），接进来没有任何物种受影响，故不接。

### 门禁

语法 0 ｜ `smoke.js` 32/32 ｜ `probe_sp_abi_detail.py` **116 项 ALL PASS**（F89 改 N=15，新增 F91）

```
F91: 蹲守N=1 蹲守New=2 蹲守Mov=1 分析N=1 分析New=1 分析Mov=1.3
```

### 版本

`v4.238`，1,633,724 B，`E0C6F14072B268EE3BE386B690CB343A82EEBA06`（VERIFIED-MATCH），commit `c5fb687`。


---

## v4.239：速度线页「详细信息看不到」的可见性改造

### 用户诉求

用户贴速度线页截图，说「**这个就只能看吗，详细信息完全看不到**」。
截图里「特性×2」列每一行都是 `—`（dash）—— 用户看不出到底有没有提速特性、是什么特性、什么条件。
同一句话用户此前已发过一次，说明 v4.235 做的「点行弹详情」提示不够。

### 黑盒先证功能是好的

先实测再动手：`#spdTableBox` 第一行 `onclick="openSpById('2633')"`，
点下去 `#spDrawer` `display=flex / z-index=80 / rect={0,0,1487,1008}`，
内含「种族值 → 配速 → 特性（3 选 1）」全部内容。**功能正常，问题是用户不知道能点。**

另外一个事实：`特性×2` 是旧表头，v4.235 已改成「特性加速」。用户看的是旧版页面。

### 三处改动

1. **表格上方加醒目提示条**（蓝色左边框 + 浅蓝底）：
   「💡 点表格任意一行 → 打开这只的完整详情（种族值 / 特性 3 选 1 与源码级效果 / 天性 / 配速建议 / 进化链）」，
   并说明「特性加速」列按源码 `.onStat(STAT_SPEED)` 实算（14 条 SPD_ABI）。

2. **新增筛选 chip「只列有提速特性的」**——这才是根治「整列全是 —」的关键。
   数据层 `if(f.abi==='1'&&!spdSpeedAbiOf(s))return false;`。
   实测筛出 **227 只**，每行直接显示「实速 + 特性名 ×倍率（触发条件）」：

   | 物种 | 特性加速列 |
   |---|---|
   | 敏捷虫 617 | 854 · 轻装 ×2（消耗掉道具后） |
   | 帕路奇亚-起源形态 1843 | 624 · 悠游自如 ×1.5（雨天） |
   | 振翼发 987 | 607 · 古代活性 ×1.5（晴天（或携带驱劲能量×1.3）） |
   | 密勒顿 1008 | 607 · 冲浪之尾 ×1.5（电气场地） |
   | 冰砌鹅-解冻头 1799 | 607 · 悠游自如 ×1.5（雨天） |
   | 大针蜂R 2516 | 607 · 拨雪 ×1.5（冰雹/雪天） |

3. **无提速特性时，`—` 下面补一行 11px 小字「无提速特性」**，不再是一个光秃秃的破折号。

### 踩坑

- 第一次 CDP 实测抓 `document.querySelectorAll('table tr')` 抓到了 1460 行的**招式反查表**（页面默认 Tab），
  误以为点行没反应。**必须直接锚 `#spdTableBox` 再取 `tbody tr`。**
- 提示条文案里含 `SPD_ABI` / `STAT_SPEED` 这类「大写+下划线」标识符，
  经 `h+=` 直拼 DOM 不经 `esc()`，所以能正常显示；若走 `esc()` 会被 `scrubLeak` 整段清空。

### 门禁

语法 0 ｜ smoke 32/32 ｜ probe ALL PASS ｜ 线上 SHA1 与本地逐字节一致（`diff=0`）

### 版本

`v4.239`，1,634,630 B，`425BAE9519F143C9643AD9592B8271046AA6486A`（VERIFIED-MATCH），commit `fed867a`。

## v4.253 速度线「特性加速」列在手机端被藏起来（A~E）

### A. 现象与定性
用户手机截图里「只列有提速特性的」已勾上、名单也确实只剩 293 只，但**截图中找不到「特性加速」列**。
诊断口径：`thead th` 全部 11 列都在 DOM 里、`tableW == boxW == 390`（无横向溢出），
真正的差别是 **4 列带 `.spd-hide-sm`**：`0努力 / 围巾×1.5 / 特性加速 / +1级强化`，
CSS 在 `@media(max-width:768px)` 里把它们 `display:none`。
**这是一个真实的可读性缺陷**：筛选的唯一目的就是「看谁有提速特性、为什么」，而这一列恰好被收起。

### B. 修法
`speedRenderTable()` 里新增

```js
var _showAbiCol=(f.abi==='1');
```

表头与单元格 class 从固定 `spd-hide-sm` 改为 `'+(_showAbiCol?'':'spd-hide-sm')+'`。
桌面端（>768px）原本就不隐藏，行为不变；移动端只在勾了筛选时展开该列。
顺带把 `th` 的 `title` 里残留的 `.onStat(STAT_SPEED)` 一起去掉（对外不讲技术词）。

### C. 二次修复：编号列被压成一字一行
加了那一列后窄屏每列更窄，`#` 列出现 `2633 → 2 / 6 / 3 / 3` 竖排。加一条 CSS：

```css
.spdtbl th:first-child,.spdtbl td:first-child{white-space:nowrap;font-size:12.5px;width:1%}
```

注意：`@media` 块里有全局 `th,td{white-space:normal}`，但 `.spdtbl td:first-child` 特异性更高，
不会被打回。改完必须**新开 CDP 会话**验证，否则读到的是缓存里的旧 CSS（本次踩坑一次：
`verify_253.py` 用旧 `user-data-dir` 截出来的图仍是断行，`check_nowrap.py` 换新 UD 才读到 `nowrap`）。

### D. 提示条文案
`「特性加速」列按源码 <b>.onStat(STAT_SPEED)</b> 实算（14 条 SPD_ABI）`
→ `「特性加速」列按源码逐条实算（共 17 条速度特性）`。
v4.251 补表后条数已变 17，旧文案两个问题：数字过期 + 技术标识符面向玩家无意义。

### E. 验收证据
| 项 | 结果 |
|---|---|
| 未筛选（手机 430 宽） | `特性加速` td `display:none`、宽 0 —— 保持原行为 |
| 勾筛选 | `display:table-cell`、宽 89px、`window._spdFilter={"abi":"1"}`、tbody 293 行 |
| 编号列 | `whiteSpace:nowrap`、宽 39px、`innerText="2633"` 单行 |
| 表格溢出 | `tableW 390 / boxW 390 / overflow 0` |
| 门禁 | smoke 32/32、`probe_sp_abi_detail.py` ALL PASS |
| 配图 | `docs/manual/img/speed_2.png` 重拍 391,794 B（293 只 + 特性加速列可见 + 编号单行） |

---

## v4.254 poke 页「Mega 形态优先」文案不说明行为（A~C）

### A. 用户报告
用户在手机截图里指出：这个按钮开着，喷火龙还在；他理解成「筛掉有 Mega 形态的非 Mega 宝可梦」。
表述本身是对的 —— **这正是该开关的真实行为**，问题出在两处：

1. **文案没说清**：poke 页按钮只有「Mega 形态优先」五个字，读起来像「排序优先级」而不是「隐藏」。
   核心配队页的 `#coreMega` 早就写全了：`Mega 形态优先（过滤可 Mega 的非 Mega）`。
2. **用户看到的可能是旧缓存**：v4.249 之前 `spMatch` 的谓词是反的（`!(isMegaForm||hasMegaForm)`
   = 只留 Mega 系），开启后普通形态反而被**专门保留**。v4.249 已修，但旧页缓存会让用户继续看到错的行为。

### B. 实测证据（v4.253 代码，430×932 手机视口）
```
before: fOpt = {"mega":0,"final":0}      普通喷火龙在列表里（开关关，符合预期）
click : Mega 形态优先
after : fOpt = {"mega":true}             可见含「喷火龙」文本 = ["超级喷火龙Y","超级喷火龙X"]
普通喷火龙是否还在 = 0
```
数据侧同样自洽：`hasMegaForm(喷火龙#6)=true`、`hasMegaForm(超级喷火龙X#1502)=false`、`_HASMEGA` 共 247 条。
→ **过滤逻辑没有问题，纯粹是文案没有把「隐藏」说出来。**

### C. 修法
poke 页 chip 文案改为 `Mega 形态优先（隐藏可 Mega 的普通形态）`，与核心配队页口径一致。
版本 v4.253 → v4.254（字节数恰好不变 1,651,034，因为改的是文案不是版本号长度）。

> 附带确认：**搜索词非空时该过滤会豁免**（`coreMatch` 里 `&&!_q`）—— 这是刻意设计，
> 让「搜喷火龙」能直接搜到普通形态。用户若在搜索框里看到普通喷火龙，那不是 bug。

---

## v4.255 配速滑块「看不懂」：真凶是乘区默认全开（A~F）

### A. 用户原话
「我之前的想法是滑到对应速度，可以自行算出剩余努力值的最佳分配，但当前我看不明白，一个是功能一个是重点我根本抓不住，UI 不突出重点。」

### B. 诊断
`spdBulkAlloc` 这个「剩余 EV 最佳分配」**早就在算**，只是被埋了：

1. **输出只有一行 13.5px 灰字**：`剩余 256 EV → HP 112 / 防 144 / 特防 0（均衡…）`。
2. **30+ 个 chip 全展开排在结论之前**：乘区 3 + 耐久 bias 3 + 性格 4 + 击杀线 4 + HP 断点 4 + 伤害面板（天气 6 / 场地 5 / 道具 4 / 攻方状态 3 / 目标状态 3 / 暴击 1）+ 搜对手 / 搜招式两个输入框。结论被挤到屏幕外。
3. **最致命的一条**：`__spdSl` 里 `scarf/wx/tailwind` **默认全是 true**，三者相乘 ×1.5×1.5×2 = **×4.5**。
   于是 `Te = ceil(T/M)` 把目标 372 折成原始 83 速，`spdPlanForTarget` 返回 `0 EV → 276 速`，
   再乘回去显示「乘区后有效 1242」。**拖到 372 却告诉你不用投 EV，还多出 1242 速** —— 这不是排布问题，是算错。

### C. 修法
| 改动 | 说明 |
|---|---|
| 乘区默认 `false` | 按裸速算；勾哪项才乘哪项。文案改「默认关；勾上才按『有围巾 / 有天气 / 有顺风』重算」 |
| 结论卡前置 | 蓝底 `.spdmain`：`目标 P88 · 372　加速性格` / `+252 EV → 372 速` / `速度已满投`，23px 粗体 |
| EV 三分格 | `.ev3`：三列等宽，大字=投入 EV，小字=分配后实际值（HP/防御/特防） |
| 进阶项折叠 | 乘区 / 性格 / 耐久偏置 / 击杀线 / HP 断点 / 伤害判定全部塞进 `<details class="spdadv">`，默认收起（39 个 chip） |
| 大字语义修正 | 滑块上方大数字 = **目标速度 T**（拖动即变），不再显示方案值（原来拖动时数字不动，很反直觉） |
| 建议加速性格 | 加 `_accPl.ev < main.ev` 条件，两者同为 0EV 时不再出现这条无信息量提示 |
| 去 emoji | `🎚` / `🎯` 在手机字体下渲染成方框 |

### D. 验收（胡地 #65，极速 372，430×932 手机视口）
```
初始 P88 ：目标 P88 · 372 加速性格 | +252 EV → 372 速 | 速度已满投 |
           剩余 256 EV：+112 HP 279 / +144 防御 162 / +0 特防 226
P50 273  ：中性性格 +0 EV → 276 速 | 省 252 EV 挪耐久
P90 372  ：加速性格 +252 EV → 372 速
P99 441  ：⚠️ 需原始 441，极速 372 仍差 69 → 开围巾×1.5 / 顺风×2 / 换高速手
大字     ：跟随目标值变化（372 → 441）
进阶折叠  ：open=false，展开后 39 个 chip 全在
```
EV 守恒核对：`252 + 112 + 144 + 0 = 508` ✅

### E. 踩坑
- **跨行锚点在 CRLF 下必失败**：`patch_255a.py` 用两行组合锚点 `count=0`，改单行锚点后成功。`index.html` 是 CRLF/LF 混合。
- **同 `user-data-dir` 会读到缓存旧 JS**：`verify_255.py` 复用 `cdp_ud_9366` 时仍显示 ×4.5 旧结果，换 `cdp_ud_<port>_<timestamp>` 才拿到新值。**验证前必须换新目录**。
- `python -c` 内联含引号在 PowerShell 里必炸，一律写独立 `.py`。

### F. 文档同步
手册「第 2 屏」整节重写：三步读法、两个真实例子（P90 / P50）、进阶设置分组表、乘区默认关的原因说明；新配图 `docs/manual/img/spd_target.png`（317,489 B）替换过期的 `sp_2.png` 引用。

---

## v4.256 筛选开关「开了看不出效果」→ poke 页加生效回执

### A. 用户报的现象
「这个按钮开启之后，喷火龙还是有，它有 mega 形态就不应该在这里显示。」

### B. 实测：逻辑本来就是对的
用 CDP `Input.dispatchTouchEvent` 打**真实触摸**（不是 `el.click()`），430×932 手机视口：

| 状态 | `fOpt` | 喷火龙在列表 |
|---|---|---|
| 纯照 | `{"mega":0,"final":0}` | 1 次 |
| 点「Mega 形态优先」 | `{"mega":true,"final":0}` | **0 次** |
| 再点「仅最终形态」 | `{"mega":true,"final":true}` | **0 次** |

`spMatch` L3534 `if(fOpt.mega&&hasMegaForm(s))return false;` 语义正确：`hasMegaForm` = 「这只自身不是 Mega、但族群有 Mega」。

**用户截图里的按钮写着「Mega形态」五个字** —— v4.254 已改成「Mega 形态优先（隐藏可 Mega 的普通形态）」。也就是说**截图来自更早的版本**（v4.249 之前 `spMatch` 那条谓词是反的，`!(isMegaForm||hasMegaForm)` 会把「有 Mega 的普通形态」专门保留）。

### C. 真问题：开关没有回执
点完之后列表只是「变少了」，用户无法判断是这个开关起作用、还是搜索/别的筛选在起作用。所以加一行状态回执：

```
筛选已生效　已隐藏 247 只「有 Mega 但本身不是 Mega」的普通形态（如喷火龙、超梦只剩超级形态）
　　　　　　已隐藏 653 只非最终形态（1253 / 1906 可见）
```

- 关态时这行**完全不显示**（不占版面）。
- 数字实时算：`Object.keys(hasMegaSet()).length` = 247；`Object.keys(nonFinalSet()).length` = 653。

### D. 踩坑：静默 catch 基线
首版用了 3 个 `try{}catch(e){}` 兜底，直接把 `tools/smoke.js` 的「静默 catch ≤ 390」顶到 **393 → 门禁红**。

改成**单一就绪守卫**（`window.ERDATA && ERDATA.species.length>0`），不吞异常也不增计数：

```js
var _rdy=(window.ERDATA&&ERDATA.species&&ERDATA.species.length>0);
if(_rdy&&fOpt.mega){ ... }
if(_rdy&&fOpt.final){ ... }
```

### E. 判定
`renderSpFormChips()` 在 IIFE 里**立即调用**（L3514），此时数据分片可能还没到 —— 直接访问 `ERDATA.species` 会 TypeError。这就是必须加就绪守卫而不是裸 `try` 的原因。

### F. 验收
- `node --check` 0
- `smoke` 33/33（含新增的版本三处同步项）
- `probe_sp_abi_detail.py` ALL PASS
- 手机视口实拍：两个 chip 开启后列表首屏为 大嘴雀 / 九尾 / 霸王花，喷火龙/妙蛙花/水箭龟全部消失

---

## v4.257 — 信息层级重建（辅助降级 / 焦点抬升 / 直方图刻度）

**用户原话（对 v4.256 之后"整体字号上调"的纠偏）**：「我的意思倒不是整体字号要多大，而是在一个地方，最关键的信息要突出，不管是字体大小还是颜色，只要能突出重要信息即可。」

### A. 意图修正（这一条比改动本身重要）
上一轮把全部字号 +1px（13.5→14.5），属于「整体调大」，治不了「抓不住重点」。层级不是靠全局尺寸，而是靠**同一区域内的对比**：结论大且有色、辅助小而灰。本轮据此重建三档：
| 档位 | 尺寸 | 字重 / 颜色 | 用途 |
|---|---|---|---|
| 结论 | 18–24px | 800 / `--accent` | 一眼要看到的那个数（EV 方案、伤害区间、分位锚点、推荐分） |
| 正文 | 14–14.5px | 400 | 叙述与字段 |
| 辅助 | 13–13.5px | 400 / `--sub` | 单位、口径、括号补充、表格脚注 |

### B. 诊断（`diag_hierarchy.py` 实测，改前）
- 454 处 `font-size`：14.5px **286 处（63%）**、14px 65、15px 50 —— 单一尺寸占绝对多数，先天无层级。
- 含 `font-size` 的 `style` 串 302 条，其中 **(字号, 字重, 颜色)** 分布最高三项：`14.5px / 无 / 无` 109 条、`14.5px / 无 / --sub` 62 条、`14px / 无 / --sub` 30 条 —— 即**灰色辅助说明与正文同号**，层级被抹平。
- `font-weight` 全库仅 89 处设置，其中 800 仅 2 处；结论级（19/23/24px）合计仅 12 处。

### C. 改动清单
1. **辅助层降级**：`style` 内含 `color:var(--sub)` 时 —— `14.5px→13.5px`（66 处）、`14px→13px`（31 处）；关键值三件套 `15px;font-weight:700;color:var(--accent)` → `18px;800`（6 处）。全部**同位长替换**，字节数不变，便于校验。
2. **速度线首屏**：静态引导条（L1022）由两段长黄条压成**一句 + `<details>` 折叠**；动态引导条（`speedRender` 内的「配速目标分层」）整体折进 `<details class="spdadv">`。
3. **分位锚点表**：数值由表格默认字号抬到 `16px/700`，**P90 单列抬到 `18px/800` + 强调色**（P90 是速攻主目标线）。
4. **直方图刻度重叠真因**：分位值被**渲染两遍** —— 上方 flex 标签行（`P50 273 P75 331 …`）与竖线标签行同时存在，390px 内相互挤压成「37294」。修法：flex 行 `display:none`（竖线标签已承载同一信息）+ 容器 `margin:20px → 42px` 容纳 `-36px` 交错刻度。
5. **速度滑块**：`speedHintHtml` 的「卡线参考（若只求过 P75）」原与结论卡「速度已满投」**并列出两套矛盾口径**（同一屏说"满投"又说"省 152 EV"），折进 `<details>`；「目标速度」标签由两行压成一行。

### D. 关键踩坑：index.html 是**纯 CRLF** 文件
历次「多行锚点 `count==0`」（`patch_255a.py` / `patch_hist_tick.py` / `patch_hist_tick2.py` / `patch_256.py`）的**真正原因**在此，不是「CRLF/LF 混合」：
- `io.open(P, encoding='utf-8', errors='ignore')` 默认 `newline=None` → universal newlines 把 `\r\n` 压成 `\n`，读入后 `len(s.encode())` 比磁盘少 **17710 字节**（=回车的个数）。
- 源码里写的多行锚点用 `\n` 拼接，与文件里的 `\r\n` 永不相等 → 必然 0 命中。
- **正确姿势**（本轮所有 patch 均按此执行）：
  `raw = io.open(P,'rb').read(); s = raw.decode('utf-8','surrogateescape')`（读）
  `io.open(P,'wb').write(s.encode('utf-8','surrogateescape'))`（写）
  并先做 `assert s.encode(...) == raw` 的 round-trip 预检。`surrogateescape` 保证非法字节不丢，`wb` 避免换行重写。

### E. 门禁
`node --check` 0 · smoke **33/33**（含版本三处同步）· `check_overflow_font.py` 9 Tab 全 `docOverflow=0` / 越界元素 0 · `probe_sp_abi_detail.py` ALL PASS。

### F. 版本账
| 项 | 值 |
|---|---|
| 字节 | 1,655,409 |
| SHA1 | 5DDFBF18B79FE554B5F879706D0769055C997635 |
| commit | `1c6946c` |
| 分支 | `fix/abi-dedup-detail-20261108` |

### G. 遗留
- `15px + color:var(--sub)` 仍有 4 处（辅助层未纳入首轮映射），下轮统一。
- 宝可梦网格页 `font_poke` 类配图在辅助降级前后尺寸一致（241,359 B），说明该页灰色辅助较少，层级对比主要来自卡片自身的 19px 种族值。

## v4.258 — 速度滑块自适应上下限（移除红色不可达警告）

**用户原话（附椰蛋树 #103 截图，目标速度拖到 262）**：「不要有这种，自适应上下限。」

### A. 问题定位
截图里红色块：「⚠ 已到本只上限：目标 P42 需原始速度 262，即使加速+252 极速 229 仍差 33 点……」。
根因在滑块的**语义**：`<input type="range" min=0 max=99>` 的位置 p 经 `T=spdPctileVal(p)` 映射到**全库分位速度**，全 1906 只共用同一刻度。慢速宝可梦（椰蛋树极速 229）把滑块拖到高分区（P42=262）时，目标天然超出自身极速，只能再弹一条警告——用户得先理解「分位 / 乘区 / 原始速度」才知道怎么收场。

### B. 改法：把滑块刻度换成「本只可达区间」
新增三个函数（位于 `__spdSl` 状态前）：
```javascript
spdSliderBounds(s,M)     // {lo: 减速0EV= floor((2b+36)*0.9), hi: floor(极速 vMax × M)}
spdSliderPosToVal(s,p,M) // 位置0-99 -> 区间内线性速度（p=0→lo, p=99→hi）
spdSliderValToPos(s,T,M) // 速度 -> 位置（反算，夹 0-99）
```
- `speedSliderHtml`：默认 `__spdSl.p=99`（目标=极速，与旧版默认目标一致），不再用 `speedPctileRankOf`。
- `spdSliderRender`：`T=spdSliderPosToVal(...)` 取代 `spdPctileVal(p)`；`Te=ceil(T/M)` 仍是乘区下的**原始实速目标**，`spdPlanForTarget` 口径不变。
- 因 `T∈[lo,hi]`、`Te≤vMax`，plans 恒非空、main 恒存在；下限提示、canFix 三元、红色警告整段移除（保留 `if(!main)` 极简兜底，理论不可达）。
- 性格建议 `spdNatAdvice` 改喂**目标速度真实分位** `spdRankOfVal(T)`（滑块 p 已不是分位，不能再直接用 p>=90）。
- 全库分位锚点（P50…P99）点击改走 `spdSliderSetVal(速度)`：超出本只区间即夹到 lo/hi，不再产生警告。
- 乘区切换 `spdTgl`：先记当前 T，切换 M 后用 `ValToPos` 反算，保持目标速度不跳变（离散位置舍入误差实测 ≤1）。

### C. 验证（`verify_258.py`，椰蛋树 b=55）
| 项 | 实测 | 预期 |
|---|---|---|
| bounds M=1 | {lo:131, hi:229} | floor(146*.9)=131 / floor(209*1.1)=229 |
| 默认 p / T | 99 / 229 | 极速 |
| warnred（默认、p=0、围巾） | 全 0 | 无警告 |
| setVal999 / setVal1 | 夹回 229 / 131 | 边界夹回 |
| 围巾 bounds | {131, 343} | floor(229*1.5)=343 |
| 围巾切换 T | 230（舍入 +1） | 保持 229 附近 |

### D. 门禁
`node --check` 0 · smoke **33/33** · probe ALL PASS · 9 Tab 零横向溢出。

### E. 版本账
| 项 | 值 |
|---|---|
| 字节 | 1,655,672 |
| SHA1 | E3826AA883153492AA971E7724FF8BADB6BA50D2 |
| commit | `29d8e76` |
| gh-pages | `ae9a407` |

### F. 遗留
- 乘区切换的 ±1 速度舍入是 0–99 离散位置的固有现象，不影响可达性；若要完全消除需把滑块粒度改到 1（min/max 用真实速度），改动较大，暂不动。
- 多目标配速对比表（`spdMultiBox`）仍用全库分位目标，未受影响。

## v4.259 — 最大收益默认速度 + 剩余 EV 攻击/耐久智能分配

**用户原话**：「速度这里，初始应该是最大收益的速度值，用相对少的努力值使得超过了相对多的速度线，然后剩余努力值不止是推荐防守端呀，有些宝可梦明显更适合速攻吧，除非我主动要求。」

### A. 上一版的两个问题
1. 默认 `p=99`＝极速满投 252，没有「性价比」概念：尾部 EV 只换来很少的分位。
2. 剩余 EV 固定走 `spdBulkAlloc`（仅 HP/防御/特防），高速脆皮攻击手也被堆耐久，违背定位。

### B. 算法选型：先证伪两条纯数学路线，再回到对战先验
原型阶段实测了 4 种方案（脚本 `proto_259` ~ `proto4_259`）：
- **gain/ev 性价比最大化**：分母主导，系统性选低 EV、低分位（胡地只到 P65，速攻手目标过低）→ 证伪。
- **几何 knee（离首末对角线最大距离）**：对阶梯状分位曲线不稳定，班基拉斯异常落到 P8、space 手被算成接近满投 → 证伪。
- **L-method 两段线性拟合**：修正了班基拉斯，但对无明显肘部的平滑曲线整体 EV 又偏高。
- **固定全库锚点（P90/P75）**：不考虑个体差异，妙蛙花到 P50 要 212 EV，根本不省。

**结论**：离散分位曲线没有客观唯一拐点，纯几何/纯性价比都不稳。最终采用**角色先验 + 个体最小 EV**。

### C. 落地函数（均在 `spdSliderBounds` 前）
```javascript
spdDefaultTarget(s)   // 角色锚点目标速度（见下表），用最小 EV 达成
spdIsOffensive(s)     // fast/space 或 攻>=110 或 特攻>=110
spdMainKind(s)        // 特攻>物攻 ? '特攻' : '物攻'
spdAtkAlloc(R,s,mk)   // 进攻分配：主攻 min(R,252)，余量给 HP
```
角色 → 默认目标（`spdDefaultTarget`）：
| 角色 | 目标分位 | 达不到时 |
|---|---|---|
| fast（速攻） | P80 | 退 P65，再退极速 |
| mid（清场/耐久） | P25 | 退 P15，再退 0 |
| space（空间） | 减速 0EV | — |

### D. 手动覆盖（对应「除非我主动要求」）
首屏新增「剩余 EV」模式按钮组（不用下拉）：**自动 / 主攻 / 耐久**，状态存 `__spdSl.allocMode`（默认 auto）。
- auto：`spdIsOffensive` 为真→主攻，否则耐久。
- 主攻 / 耐久：强制对应分配，立即重渲染。

### E. 信息层级（回应「抓不住重点」）
- 弹层精简：CTA 冗余说明删除；与滑块重复的静态配速提示 `speedHintHtmlCached` 默认折叠（函数保留不删）。
- 模式按钮文字缩短为单行（自动/主攻/耐久）。
- 手机视口（412×915）实测：滑块 + 核心结论卡（目标 P、性格、+EV→速度）**同屏**，拖动即见，无需先滚动。

### F. 实测（节选）
| 宝可梦 | 角色 | 默认目标 | 速度EV | 剩余去向 |
|---|---|---|---|---|
| 胡地 #65 | fast | 349（P81） | 168 | 特攻 252 + HP 88 |
| 妙蛙花 #3 | mid | 220（P25） | 96（加速性格16） | 耐久 |
| 椰蛋树 #103 | space | 131（P1） | 0 | 特攻 252 + HP 256 |
模式切换：胡地 auto→耐久（HP/防/特防三分格）、→主攻（特攻+HP）均正确。

### G. 门禁与版本
`node --check` 0 · smoke **33/33** · probe ALL PASS · 9 Tab 零溢出。
字节 1,658,320 · SHA1 `7FF4CDF71FC7FA43174DB601710375DB657A8EE6` · commit `96c6e20` · gh-pages `0c697eb` · 线上逐字节一致。

## v4.260 — 攻击分配单项 EV 钳制（修复 HP 超 252）

**触发**：v4.259 上线后做全量健壮性巡检（1906 只），发现 456 只进攻型宝可梦的剩余分配里 HP 单项超过 252 上限。

### A. 根因
v4.259 的 `spdAtkAlloc` 只对主攻做了 `Math.min(R,252)`，HP 直接取 `R - atkEv`，没有 252 钳制。当剩余 R>504（典型为空间手 main.ev=0、R=508）：主攻 252 后 HP=256，违规。

### B. 修复
`spdAtkAlloc` 改为逐项钳制，返回三项：
```javascript
atkEv=min(R,252); R-=atkEv; hpEv=min(R,252); R-=hpEv;
return {hp:hpEv, atk:atkEv, sub:R, idx, subIdx}  // 零头（0-4）投另一攻
```
渲染攻击分支由两格改为三格（主攻 / HP / 另一攻），与耐久三格视觉一致，所有单项 ≤252 且总和=R。

### C. 验证
- 全量巡检（`audit_259.py`，1906 只）：修复后**异常 0**（角色分布 fast 495 / mid 1153 / space 258；进攻 1053 / 耐久 853）。
- 实拍椰蛋树 #103：特攻 252（349）/ HP 252（394）/ 物攻 4（227）。
- 门禁：`node --check` 0 · smoke **33/33** · probe ALL PASS。
- 部署：commit `991c0af` · gh-pages `5fe5361` · 线上逐字节一致（边缘缓存约 5 分钟后刷新，已确认）。

### D. 经验
新增分配逻辑后，单测/手工抽样（当时只看了胡地、妙蛙花、椰蛋树首屏）不足以覆盖边界；**全量枚举 + 不变量断言（单项≤252、总和=R、目标在 bounds 内）**才能抓到只在 R 取极值时出现的违规。巡检脚本保留在 `%TEMP%/audit_259.py`，后续改分配应重跑。

## v4.261 — 单攻手默认加速性格（当前目标下最省 EV）

**背景**：v4.259 让默认目标更合理，但默认性格仍偏保守。妙蛙花默认目标 220 时，系统给中性 +96 EV，而「胆小（+速-物攻）」只需 16 EV，却只作为一条灰色「建议加速」提示——默认方案没真正做到「相对少的努力值」。

### A. 性格代价的关键认知
加速性格（胆小/开朗/急躁/天真）会把另一项 ×0.9，但可选择降哪一项：
- 纯特攻手：选「胆小」降物攻，若物攻本就不用，代价极小。
- 纯物攻手：选「开朗」降特攻，同理。
- 双刀（两攻都要用）：降任一主攻都伤，不能默认加速。

### B. 落地
新增静态判定 `spdIsSingleAttacker(s)`：主攻（`spdMainKind`）≥70 且另一攻 < 主攻−15（单攻倾向、排除纯盾）。
渲染中在 `adv` 基础上增加动态覆盖（`natOv` 手动/乘区/空间优先不覆盖）：
```
if(!natOv && M===1 && role!=='space' && spdIsSingleAttacker(s)){
  若当前目标下「加速 plan.ev < 中性 plan.ev」→ adv='加速'
}
```
- 动态比较针对**当前滑块目标**，用户拖到加速不省 EV 的目标时自动回到中性。
- 原「建议加速」提示在 main 已加速时自动不显示。

### C. 全量调研与验证
- 三轮只读调研（`survey_nature*.py`、`dryrun_nature.py`）：975 只默认加速、931 只保持中性（双刀 366 + 纯盾/低攻等）。
- 实测：妙蛙花 220 中性96→加速16（省80）；胡地 349 仅加速可达 168；大针蜂省124；水箭龟/皮卡丘/雷珠（双刀）保持中性。
- 全量巡检（1906）**0 异常**；`node --check` 0 · smoke **33/33** · probe ALL PASS。
- commit（feat）· gh-pages `cd2afbe` · 线上逐字节一致。

### D. 经验
「默认最省」不仅是目标速度的选择，**性格修正是第二个 EV 杠杆**；但性格带代价，必须先判定被降项是否可牺牲（单攻 vs 双刀、主攻够格），并把最终决策与当前目标的真实 EV 差挂钩，而非无脑加速。

## v4.262 — 速度滑块吸附真实配法点 + 速度区重点突出重构

**背景**：速度区有两个长期痛点。① 滑块 100 档是「线性映射」，拖到的大数字和真实阶梯速度（每 4 EV 才跳一点、还有性格 ×1.1/0.9）对不上；② 玩家看不懂——P50/P81/P88 技术术语外露、同一个速度数字重复出现、真正能照抄的结论（性格+速度 EV+剩余分配）被拆成好几块还夹着灰色干扰，没有唯一焦点。

### A. 先定位「函数 undefined」真因：是语法错误，不是执行上下文
排查初期 CDP 报 `speedRole/spdSliderPosToVal/spdReachPoints is not defined`，但 `ERDATA` 可访问。关键推理：ERDATA 由独立加载器脚本注入，而所有速度函数都在主 script 内；若主 script 整体解析失败，正好「ERDATA 在、所有函数 undefined」。逐块 `node --check` 内联脚本，仅主逻辑块失败：`spdSliderPosToVal` 与 `spdSliderValToPos` 各**缺一个最外层右括号**（`Math.max(` 未闭合）。补齐两个 `)` 后 6 块内联脚本全部可编译，CDP 卡点闭环。**教训：浏览器里整段函数 undefined，先怀疑脚本解析失败，用 vm/node --check 逐块验证，而不是怀疑调用上下文。**

### B. 核心架构：从「速度值集合」改为「配法点」
旧 `spdReachPoints` 枚举三性格 [1.1,1.0,0.9] 的所有速度值去重，只存数字；render 又用 `spdPlanForTarget` 重新算最省配法，两步口径不一致，导致「目标 272、方案实速 276」乃至最大差 109 的跳动（减速性格独有的低速点，非空间手根本不会采用）。

新设计让 `spdReachPoints(s)` 直接返回**配法点数组** `[{nat,ev,val,saved}]`：
- 按角色收敛性格集合：空间手 `[减速,中性]`，其余 `[中性,加速]`——排除该角色永远不会用的另一极端性格。
- 枚举性格×EV（0..252 step4），对每个实速 `val` 只保留 **EV 最省**的那条配法（含 saved=252−ev）。
- 严格递增、无重复。render 默认直接取当前滑块位置对应的配法点作为 `main`，**方案实速构造上精确等于刻度（d=0）**，不再二次枚举。
- 手动性格（`natOv`）时才回到 `spdPlanForTarget` 按指定性格算（用户主动选择，允许略超）。

这一改动同时**更优地替代了两个旧函数**并予以删除：`spdNatAdvice`（固定 rank≥90 才加速的硬阈值）与 `spdIsSingleAttacker`（v4.261 单攻手加速）——「每个速度点取最省 EV 性格」天然涵盖了它们的判定，且更原则化（性格切换点由真实 EV 代价决定，而非人工分位线）。删除后 smoke 零引用函数仍为 27，未新增。

### C. 速度区重点突出 UI 重构（保留全部元素 id 与计算逻辑）
1. **输入区弱化**（浅灰底圆角容器）：顶部一句玩家语言引导「拖动滑块选目标速度，立刻给出最省努力值的性格、速度投入，以及剩余努力值的最佳分配」；目标速度降为 28px 输入回显；滑块保留 44px 热区；两端标「慢/快」真实值；分位行改口径「快过约 X% 的宝可梦」；「常用速度」去掉 P 标签只显数值（P 术语移入 title）。
2. **答案卡 `.spdAnswer` 成为唯一视觉焦点**：渐变蓝底+左侧 5px accent 边；顶部彩色性格 badge（加速=accent 蓝、中性=灰、减速=紫）+「最省努力值的配法」；核心行用「30px `+EV` → 36px `速度`（accent、最大字号）」；绿色「省 N EV」；分隔线后标注剩余 EV 的进攻/防守定位，**三格 `.ev3` 内嵌同一张卡**（进攻=主攻/HP/另一攻，防守=HP/防御/特防）。
3. 移除「其他性格也能到」「建议加速」两条冗余灰提示（配法点已自动选最省），减少干扰。

### D. 全量验证
- 数学：1906 只 × 100 档 = **190,600 个可选位置全部精确等于真实配法点速度（d=0）**，零非真实点、零往返错位；点严格递增、EV 全部合法（0..252、4 的倍数）。
- 实拍三类：胡地（进攻三格 特攻+252/HP+88/物攻+0）、椰蛋树（空间减速 +0EV→131、进攻三格）、吉利蛋（防守三格 HP+80/防御+252/特防+0，实数与公式逐项吻合）。
- `node --check` 6 块全过 · smoke **33/33**（静默 catch 正好 390 未超阈）· probe **ALL PASS**。

### E. 经验
离散阶梯曲线上「滑块刻度」必须直接绑定「一个确定的配法」，而不是先给一个速度值、再用另一套口径反推配法——两步口径不一致正是错位与跳动的根源。视觉上一个区域只允许一个焦点：输入控件弱化、最终可照抄的结论用字号+颜色+底色做强，技术术语要么玩家化、要么收进进阶/title。

## v4.263 — 修复跨脚本同名函数覆盖，恢复流派卡第 6 段「努力值分配」

**背景**：以真实用户视角走查全部 9 个 Tab。在详情页「玩法流派」卡（9 个编号段）中发现编号跳过 6——第 6 段「努力值分配」没有按设计渲染，只剩一条 8px、六段全 0 的空条。这是一处**静默失效**：界面不报错、门禁全绿，但用户拿不到努力值分配的可视化与「分配依据」。

### A. 根因：两个同名 `evBarHtml` 分属不同经典脚本，后者覆盖前者
- 块 4（主逻辑，原 index.html 约 15857 行）定义 `function evBarHtml(bd)`：入参是流派构建对象，生成完整 `.fld` 卡片——编号 6、数值串（`alloc.join('/')`）、模板名、彩色分段条 `.evsegs`、可展开的「分配依据」（`evWhy`）。
- 块 5（v4.105 独立脚本，原约 17592 行）又定义 `function evBarHtml(evs)`：入参是 `{hp,atk,def,spa,spd,spe}` 对象，只生成一条 8px 迷你条。
- 两者都是**普通 `<script>`（非 module）**，顶层函数声明都会挂到同一个全局对象；后执行的块 5 覆盖块 4 的全局绑定。三个调用点（块 4 内）全部传 `bd`/`b`，但生效函数读的是 `bd.hp/bd.atk...`（这些键不存在，真实数据在 `bd.ev.alloc`），于是六段全 0。
- 块 5 内对该函数**零调用**，全工程也没有任何地方传 `{hp,atk,...}` 对象——它是纯僵尸重复定义，唯一作用就是遮蔽真函数。

### B. 修复与全量审计
- 删除块 5 中零调用的僵尸 `evBarHtml(evs)`（594 字节），块 4 富卡片随即在全部三个调用点恢复。
- 写脚本枚举全部 `function NAME(` 声明并做花括号深度分析（跳过字符串/模板/注释）：其余 9 组同名（`pct/push/add/put/cell/apply/scan/pos/A`）均在嵌套作用域（深度 1–4），局部隔离、无害；唯一顶层 `pct` 仅一处。**删除后已无任何顶层跨块覆盖。**
- 零引用函数仍为 27，与 smoke `LEGACY_KEPT` 白名单逐名吻合（历史保留，非新问题），未新增死代码。

### C. 验证
- 重新提取 6 块全部 `node --check` 通过；smoke **33/33**、probe **ALL PASS**。
- 实拍班基拉斯「扑击物防流」：第 6 段显示数值 `252/0/252/0/4/0`、模板「耐久」、彩色分段（HP 252 / 防 252）；点「分配依据」正确展开「耐久模板：252 HP + 252 主防 + 4 余量……」。编号 5 性格 → 6 努力值分配 → 7 道具连续。

### D. 经验
- 单文件多 `<script>` 块虽便于隔离功能，但经典脚本的顶层函数共享全局，**同名即覆盖且无任何报错**；新增独立脚本块时，函数名要带模块前缀，避免通用名。
- 「编号/序列跳过」是可直接观察的静默失效信号，值得在走查时专门核对。
- 排查此类问题用「提取各块 → 括号深度判作用域 → 全局覆盖模拟（vm 连跑两块）」即可闭环，不必依赖能访问页面全局的调试通道。

## v4.264 — 速度配法单一真源，打通核心配队与速度线/滑块

**背景**：用户反馈「核心配队、队伍构建、宝可梦这些之间的联动太差，核心配队这里的速度，没和前面的速度线、速度滑块对接上」。静态阅读三个 Tab 后确认这是**两套互不相通的口径**：速度滑块是看完即走的独立计算器，不持久化、不回写；核心流派卡的速度是固定模板，只显示努力值数字，不显示实速、分位，也没有调整入口。

### A. 三个断点（根因）
1. **速度滑块是单一内存态、不持久化、不回写**：`__spdSl` 是全局单例，每次 `speedSliderHtml` 构建都重置 `s/allocMode/p`；结论只渲染进详情 `.spdAnswer`/`#spdPlanBox`，不写 localStorage、不绑队伍、不改流派对象。
2. **核心流派卡速度是固定模板**：`mkBuild` 生成的流派自带固定 `bd.ev.alloc`（速度在 index 5）、`bd.nat`、`bd.ev.template/summary`；`buildEvs` 虽已用 `spdEvTo` 卡 P90/P75 速度线，但卡片只显示 EV 数字，**无实速、无分位、无调整入口**。
3. **两个详情面需区分**：`openSp`（精灵抽屉）含速度滑块、种族条、特性、弱点、可学招式，不含 9 段流派卡；9 段流派卡只在 `renderCore`。

### B. 设计：单一真源 + 显式采用 + 渲染副本
- 每只宝可梦可采用一套速度配法，localStorage 持久化（key `er_spdPlan_v1`，值 `{[id]:{nat,ev,val,p,natOv}}`），核心/队伍/分析同读一个真源。
- 用显式「采用此配法」按钮提交，避免仅打开抽屉就静默改核心；滑块打开即定位到已采用配法。
- 沿用 `buildEvs` 已验证的「降速省 EV→HP」口径，**只在渲染时对 alloc 做副本调整、不改缓存 bd**，保证幂等低风险。

### C. 实现（5 锚点）
- 新增存储模块：`spdPlanStore/spdPlanWrite/spdPlanGet/spdPlanSave/spdPlanClear/spdPlanAdopt/spdPlanReset/spdAdjustFromCore/spdClearFromCore`。
- `speedSliderHtml` 读 `spdPlanGet`，有采用则恢复 `p/natOv`；答案卡加「采用此配法」，已采用时显示「恢复默认配速」+「已采用此配法」。
- `mkBuild` 返回对象首加 `spId:String(s.id)`，让 build 自描述物种。
- 重写 `evBarHtml`：无配法时用 `dmgStatOf` 算实速、`spdRankOfVal` 算分位、`_spdBadge` 出徽标，始终显示「速度 实速 快过约X% 徽标 调整速度」；有配法时渲染副本 alloc 并高亮「你的配速」。
- **双向重分配**：采用更慢配法（diff>0）省下的 EV 转入 HP；采用更快配法（diff<0）先从 HP 抽调、不足再按 EV 从小到大抽其他项，**总 EV 恒为 508、单项不超 252**；采用时散文摘要按调整后 alloc 重新生成，避免与数值串不一致。

### D. 门禁与一次返工
- 首版补丁新增 6 个空 `catch(e){}`，smoke 静默 catch 计数从 390 涨到 396、越过硬阈值（n>390 fail）。重构为读写收敛（`spdPlanStore`/`spdPlanWrite` 非空 catch 回退）+ 去掉防御性外层 try，空 catch 回到正好 390。
- 重新提取 6 块全部 `node --check` 通过；smoke **33/33**、probe **ALL PASS**。
- 自写 VM 功能测试 `test_264_spdlink.js`（真实提取函数 + 桩依赖）**24/24**，覆盖存储读写/清除、adopt 触发 renderCore+toast、默认卡实速/分位/调整入口、采用后 alloc 调整、提速抽调与总 EV 守恒、摘要一致、损坏 JSON 回退。
- 真实浏览器端到端：椰蛋树核心卡第 6 段「速度 144 快过约 2% P2慢速 调整速度」→ 打开抽屉改中性极速 209 → 采用后核心卡高亮「你的配速 · 中性性格 · 提速抽调192 EV」、alloc `4/0/0/252/0/252`；重载后配法仍保留；「恢复默认」回到流派默认（144/60 EV）。

### E. 边界与取舍
- 滑块/配法的 `nat` 是**类别名**（加速/中性/减速），不是具体性格；核心卡性格段 `bd.nat` 才是具体名，本次未重写具体性格，只在速度块内标注类别。
- 点超出物种上限的常用速度会被钳制到最近可达点（空间定位物种的滑块只含中性/减速组，极速即中性 209）；这是既有夹取口径，未加回自适应上下限。
- 队伍分析 Tab（属性克制/打击面）与队伍速度卡（极速档结构）无消费速度 EV 的自然钩子，本次不强行接入，保持各自语义。

### F. 经验
- 「看完即走」的计算器与「写进方案」的配置要显式区分：用一个持久化真源 + 显式采用按钮，既能联动又避免静默改数据。
- 渲染期对数据做副本调整、不回写缓存，是低风险联动的稳妥做法；但要把同一卡片内的数值串、散文摘要、分段条全部对齐，否则会出现自相矛盾。
- 重分配逻辑必须双向且守恒（总 EV 恒定、单项 ≤252），只考虑「省」不考虑「加」会在提速时让总量越界。



## v4.265 — 队伍构建 / 队伍分析同读一套配速（联动第二程）

### A. 断点（三处消费方各算各的）
- `renderTm`（队伍构建选人卡）：只有精灵图/名/属性/种族值，**无速度、无 EV**，速度线索为零。
- `teamSpeedCardHtml`（队伍分析·队伍速度结构卡）：只用 `spdMaxOf(s)`（理论极速）与 `speedPctileRankOf`，与「已采用配法」完全无关；脚注还硬编码 331/372。
- `renderAnSlots`（队伍分析槽位卡）：只有图/名/角色标签，不体现已配速。
- 队伍分析主表（`renderAnalyze`）是属性克制/打击面，无速度语义钩子 —— 不动。

### B. 设计取舍：不偷偷换算法
- 未采用配法的成员仍走**极速档**，已采用的成员走**采用实速**；两者都显式标注（卡面文案 极速 / 速度 + 「已配速」徽标；灰线=该只极速，仅作参照；卡头注明「其中 N 只按已采用配速实算」）。
- 不做「猜测式统一」：不能让没采用配法的成员突然按某个隐含分配算速度，那会让用户无法解释结论。

### C. 实现（5 锚点 + 1 修复）
- 辅助函数（紧跟 `spdPlanClear`）：`spdPlanOf(s)` / `spdViewValOf(s)`（有配法返 `+pl.val`，否则 `spdMaxOf(s)`）/ `spdCardSpeedHtml(s)`（「速度/极速 + 大字数值 + 快过约X% + 已配速徽标」）。
- B `renderTm` 选人卡：种族值 div 后插入 `spdCardSpeedHtml(s)+`。
- C `teamSpeedCardHtml` 行循环：`var pl=spdPlanOf(s); var v=pl?(+pl.val):spdMaxOf(s); var p=spdRankOfVal(v);`，统计 `adoptedN`；已采用时多画一条 `#9e9e9e` 灰线标该只极速，并在数值旁加「配速」徽标。
- C2 卡头/脚注：标题改「队伍速度结构（全库分位 · 采用配速优先）」，头部加「，其中 N 只按已采用配速实算」，全队最快按 `v` 判定；脚注去掉硬编码 331/372。
- D `renderAnSlots`：加 `var _pl=spdPlanOf(s);`，追加 `速N` 小徽标（title 写明「已采用配速：类别性格 · 实速 N（核心配队第 6 段可改）」）。
- D2 `renderSlots`（我的队伍名单）：同口径 `速N` 徽标，三处消费点视觉一致。
- G（顺带修复真实缺陷）`loadTeam` 就绪重试：该函数在脚本块末 `setTimeout(loadTeam,0)` 调用，而物种数据是异步分片；数据未就绪时 `speciesById` 全空 → 队伍被静默清空且无人重试（表现：刷新后「我的队伍 0/6」，配法也失去挂靠）。改为与首屏遮罩同口径的就绪判定（`ERDATA.species.length>1000`），未就绪时 `setTimeout(loadTeam,500)` 重试，上限 40 次/约 20 秒。

### D. 返工与教训（CRLF 多行锚点）
- 首版补丁用普通 `str.replace` 匹配多行锚点 → **0 命中**（文件 CRLF + 少量孤立 LF，脚本按 LF 拼锚点），B 处 `anchor count=0` 直接 abort（写盘前断言生效，文件未被改动）。
- 改为把锚点逐行 `re.escape` 后用 `\r?\n` 连接成正则、以函数式 `re.sub(lambda m: new, ...)` 替换（避开替换串的转义解释），5 处全命中，len delta +1458。

### E. 门禁、测试与端到端
- 6 块 `node --check` 全过；smoke **33/33**（未新增空 `catch(e){}`，静默 catch 仍为 390；重试用 `setTimeout(loadTeam,500)` 函数引用，不引入 try/catch）；probe **ALL PASS**；版本三处同步（`ER_ENGINE_VER='v4.265'`、package `4.265.0`、版本表插行）。
- 自写 `test_265_teamlink.js`（真实提取函数 + 桩依赖）**20/20**：无配法走极速口径 / 有配法显示实速与「已配速」/ 卡标题体现采用优先 / 无采用不出现灰线 / 已采用出现灰线 / 全队最快按实速判定（哥达鸭 200 而非极速 269）/ 两只均采用时「其中 2 只」/ 塌陷告警按实速触发 / 空队返回空串 / 损坏 JSON 回退 / loadTeam 未就绪不清空且安排 500ms 重试 / 就绪后正常恢复。`test_264_spdlink.js` 回归 **24/24**。
- 浏览器端到端：队伍构建卡片「极速 207」→ 核心配队椰蛋树第 6 段点「调整速度」→ P50(273) 钳制为中性极速 209 → 采用 → 回队伍构建卡片变「速度 209 快过约19% 已配速」、我的队伍名单「速209」→ 队伍分析槽位「速209」、速度结构卡「全队最快=椰蛋树 209 · P19，其中 1 只按已采用配速实算」+「配速」徽标 + 灰线参照 + 塌陷告警；**重载后队伍与配法均恢复**（G 修复前为 0/6）。

### F. 边界
- 存档方案面（`renderPlanSet` / `myCoreTeam`）与存档导入（sav 源自带真实 EV/性格）本次未接同一配法：sav 源有权威 EV，强行套用会造成口径冲突，属可选项非缺陷。
- 点超出物种上限的常用速度仍钳制到最近可达点（未加回自适应上下限）。
- 队伍速度卡的灰线/徽标信息密度需现场观察，若过密优先收「灰线图例」而非删徽标。

## v4.266 — 速度线页接入「我的队伍速度现状」（联动第三程）

### A. 断点
- 「速度线」是用户**定目标**的地方（tip 原话：「速攻手卡过 P90、清场卡过 P75」），但它只给全库分位与全库表，**看不到自己队员现在在哪**；而队员速度只散落在队伍构建卡 / 队伍分析速度结构卡里。定目标与看现状分在两个页面，用户得自己记数字来回切。
- 抽屉里的「多目标配速对比表」(`#spdMultiBox`, v4.110 P4) 是**单只**视角，仍回答不了「我这 6 只整体够不够快」。

### B. 设计：现状贴着锚点放
- 新增 `teamSpeedStripHtml()`，插在 `speedDistBarHtml()` 之后、筛选与全库表之前 —— 让「全库锚点 → 我的队伍现状」连成一段，先用眼睛比出差距，再去筛表找替代。
- 每行：精灵图 + 名 + **大字实速** + 分位 + 口径标记（「配速」橙标 / 「极速」灰字）+ 结论标签（超 P90 绿 / 过 P75 黄 / 中速 / 慢速）。
- 底部一行结论按**全队最快**给出：高于 P75 写「已有清场级先手」并给差值，低于 P75 用告警色给「控速 / 戏法空间 / 讲究围巾先想一遍」。
- 口径说明固定一行小灰字：标「配速」=核心配队第 6 段采用的实速；标「极速」=未采用，按 252 努力 + 速度性格的理论上限 —— **同一行里两种口径并存且各自标注**，不混算。
- 每行 `onclick="openSpById(id)"`，点开即详情（复用既有入口，无需额外弹层）。

### C. 实现（2 锚点 + 1 文案）
- `teamSpeedStripHtml` 定义插在 `spdCardSpeedHtml` 之前（同属配速消费函数族）。
- `speedRender` 在 `h+=speedDistBarHtml();` 之后插一行 `h+=teamSpeedStripHtml();`。
- 页首 tip 补一句指向新条（原来只说「看极速列定目标」，读完不知道去哪核对现状）。
- 依赖全部是既有全局：`speedPctiles` / `spdPlanOf` / `spdMaxOf` / `spdRankOfVal` / `sprEl` / `openSpById`，无新存储、无新状态。

### D. 刷新时机（无需额外事件）
- `switchTab('speed')` 每次进入都调 `speedRender(true)` 整页重建（壳重建、400 行表懒建），所以核心配队里刚采用的配速，切到速度线页即是最新值，不需要配法变更事件反向推送。

### E. 门禁与测试
- 6 块 `node --check` 全过；smoke **33/33**（无新增空 catch，仍 390）；probe **ALL PASS**；版本三处同步（`ER_ENGINE_VER='v4.266'`、package `4.266.0`、版本表插行）。
- `test_266_strip.js` **16/16**：空队只给组队引导不出幽灵行 / 无配法全走极速且不出现配速标记 / 头部不写「其中 N 只」 / 显示成员数 / 有配法显示采用实速与配速标记 / 头部注明「其中 1 只」 / 未采用仍标极速 / 全队最快按实速取（60 而非极速 209）/ 低于 P75 给控速提醒 / 过高给正向结论 / 超 P90 标签 / 损坏 JSON 回退极速。
- `test_265_teamlink.js` **20/20** 回归不降。
- 浏览器端到端：v4.266 首屏 → 速度线页「我的队伍 · 速度现状（1 只，其中 1 只按采用配速）」椰蛋树 209 P19 配速 慢速 + 告警「比 P75 低 122」；再加入哥达鸭（未采用）后变「2 只，其中 1 只」并正确混排「209 P19 配速 / 295 P56 极速」，全队最快改判为哥达鸭 295。

### G. 部署侧踩坑（本版新增）
- 推送 gh-pages `0a7f3a4`（树内 index.html = 1,670,141 B 已核对无误）后，公开 URL 连续约 30 分钟仍返回 v4.265（1,667,029 B / `E26FC629…`）：响应头 `Last-Modified: 01:13:47`（v4.265 部署时刻）、`Cache-Control: max-age=600`、`X-Cache: HIT`。
- 判定顺序：① `git ls-tree -l github/gh-pages index.html` 确认分支产物字节正确 → ② 反复 cache-buster / no-cache 头 / 先推 master 全部无效（query 参数不能穿透 GitHub 边缘缓存，且 `Age` 归零后内容仍旧 = 源站未重建）→ ③ 用 `git commit-tree` 造一个**同 tree、仅换父提交**的空提交推到 gh-pages，立即触发重新构建，150 秒后线上即为新版。
- 教训：**「分支产物对」不等于「站点已部署」**。`Invoke-WebRequest` 存盘比 Length+SHA1 只能证明收到的字节，不能证明是本次推送的构建；`Age` 归零而内容不变，说明是构建队列空转而不是缓存过期。

### F. 边界
- 分位锚点本身是「极速档」定义，采用更低配速的成员落在锚点下方是**正确结果**，不是缺陷；因此卡片不提示「你退步了」，只给「差多少 → 用什么补」的建议（空间/围巾/控速）。
- 存档导入源（自带真实 EV）仍不并入这套配法，保持口径分离。

## v4.267 — 多目标配速表「从摆设变成真数据」（联动第三程补丁）

### A. 断点：滑块与速度线之间的那张表是坏的
- 抽屉里 `#spdMultiBox`「多目标配速对比」（v4.110 P4 上线）本该回答「卡到 P75 要投多少 EV」，实际**每一行永远显示「0 EV」、性格列空白**。
- 根因：`spdPlanForTarget(s,target)` 返回的是**方案数组** `[{nat,ev,val,saved},…]`（同一目标可由多种性格达成），而渲染代码写成 `plan.ev` / `plan.nat` 当**单个对象**读 → 全部 `undefined` → `||0` 兜成 0。这是「读错返回形状」，不是数据缺失。
- 顺带两个体验问题：① 该表被放在「进阶设置（一般不用动）」折叠里，默认看不见；② 「常用速度」芯片对够不到的档位照点（钳制到上限），用户看不出为什么点了没反应。

### B. 做法
- 新增 `spdMultiPick(plans)`：从方案数组里取**所需 EV 最小**的一条，EV 相同时优先「中性」性格（不牺牲其他属性）。抽成独立函数便于单测。
- 每行渲染为「目标 / 速度线 / 性格 / 所需EV」；EV 用满 252 时标红「满」；够不到的档位保留灰行并写「够不到」，表下方一句「这只上限 N，够不到 P50/P95 —— 想卡线只能靠围巾 / 提速特性 / 顺风，或改用戏法空间」。
- 每行可点：`onclick="spdSliderSetVal(该线数值)"` → 滑块与答案卡即时重算（实测 349 → 331，答案卡同步变「加速 · +100 EV · 331 速」）。
- 容器从「进阶设置」里**挪到常用速度芯片正下方**常驻，先看成本再拖滑块。
- 「常用速度」芯片对够不到的档位压暗（`opacity:.42`），title 写明「这只上限 N，够不到 P95（394）——点了只会到上限」。

### C. 门禁与测试
- 6 块 `node --check` 全过；smoke **33/33**（仍 390 静默 catch）；`test_267_multibox.js` **13/13**：足够快时每行给真实方案、P50 取 0 EV 中性（而非 112 EV 减速）、P75 取加速 100 EV、够不到返回 null 不伪造 0、慢速四档全判够不到、空输入不炸。
- 浏览器实测：胡地表 `P50 中性 0 / P75 加速 100 / P90 加速 252 满 / P95 够不到`，点 P75 行滑块 349→331；波尔凯尼恩（上限 262）四档全「够不到」并给出围巾/空间提示。

### D. 教训
- **表格类 UI 要拿真实数据源核对一次**：当 `plan.ev||0` 这类兜底存在时，读错形状会退化成「全 0」这种看似合理的值，不报错、不空白，能瞒过很久（本表自 v4.110 起一直显示 0）。
- 排查手法：先用 node 沙箱打印目标函数的**真实返回形状**（`JSON.stringify` 一行就暴露数组 vs 对象），再回头改渲染。

## v4.268 — 把「宝可梦」页与详情页接进同一套配速（附机制流派 spId 断链修复）

### A. 断点
- 用户点名「核心配队、队伍构建、**宝可梦**这些之间的联动太差」：前几版打通了核心/队伍构建/队伍分析/速度线，**宝可梦页一件没接**——列表卡只有种族值与总值，详情页只有基础种族值（速度 120），看不出这只现在实际跑多少、有没有采用配速。
- 排查中还发现一个**更严重的隐性断链**：核心配队的**推荐流派首卡**第 6 段没有速度行、没有「调整速度」、也没有配速徽标。根因是机制流派（`MECH_BUILD[rw](s)` 构造的对象）**从不带 `spId`**，而 `evBarHtml` 用 `bd.spId` 解析物种 → `sp` 为 null → 整段速度 UI 被静默跳过。普通流派由 `mkBuild` 生成（带 `spId`）所以显示正常，机制流派（魔法防守、大力士等）全部中招，而推荐流派首卡常常正是机制流派。

### B. 做法
- 新增 `spdNatCatOf(natName)`：把具体性格名翻成「加速 / 中性 / 减速」类别（读 `NATURES` 的 +/− 速度项），供跨页比较同一口径。
- 新增 `spdCoreLineHint(sp,curEv,natName)`：以当前实速为锚，找**最近一条在上的速度线**与**最近一条在下的速度线**，用 `spdPlanForTarget` 的**同性格类别方案**算差值——同类别可达就写「再 +N EV 到 P75（331）」「退到 P50（273）可省 M EV 给 HP」；只能靠换性格就写「要换加速性格 + N EV」；全不可达就写「这只上限 N，够不到 P50（273）——围巾 / 顺风 / 戏法空间」。**不做自适应上下限，也不伪造可达性。**
- 新增 `spdDetailSpeedHtml(s)`：详情页种族值条形图下方一行实速条——「你的配速 331 / 极速 372 + 分位 + 口径说明」，把「基础速度 120」与「实际跑 331」分开，避免误读。
- 三处消费：宝可梦页列表卡 `spdCardSpeedHtml(s)`（与队伍构建同一函数，页间口径完全一致）；详情页实速条；核心第 6 段未采用配法时追加卡线建议。
- 修复 `mechBuildsOf`：`MECH_BUILD` 造出对象后补 `spId`（`if(b&&!b.spId)b.spId=String(s.id)`），一处修复让所有机制流派流派卡恢复速度行 / 卡线 / 调整入口。

### C. 门禁与测试
- 语法 6 块全过；smoke 33/33（版本三处同步已回填）；probe ALL PASS；`test_268_dexlink.js` **26/26**（性格类别映射、方案类别挑选、胡地 349→P90 差 84 / 退 P75 省 68、椰蛋树 base55 判「够不到 P50、上限 229」不伪造、减速性格不炸、详情条 极速/你的配速 两态）。
- 旧 `test_264_spdlink.js` 沙箱补 `spdCoreLineHint / speedPctiles / NATURES` 桩后 **24/24**（evBarHtml 新增调用不影响既有断言）。
- 浏览器端到端：胡地推荐流派（机制流派）第 6 段 = 「速度 372 / P88清场 / 调整速度 / 卡线：这只上限 372，够不到 P95 · 退到 P75 可省 152 EV」；采用 P75 后宝可梦页卡变「速度 331 快过约74% 已配速」，详情变「你的配速 331 / P74中速 / 已采用」。

### D. 教训
- **同一个渲染函数的输入契约要靠「谁构造了这个对象」兜住**：`evBarHtml` 依赖 `bd.spId`，但流派 build 有两个构造者（`mkBuild` 带、`MECH_BUILD` 不带），症状只在机制流派的卡上出现——按流派逐个点过去才看得到，靠单测（喂标准对象）永远发现不了。修法是在**构造侧**补齐字段，而不是在渲染侧兜底猜物种。

## v4.269（2026-11-10）：先制感知——「有先制就可以少投速度」接进速度决策

### A. 需求
- 用户原话要点：一只宝可梦有条件先制（先制特性/先制招能当核心手段）时，可以**降低速度要求**——烈焰猴R 满血拳招 +1，那就可以固执而不是爽朗；同时要判断「耐久是否有必要」「常态速度还要不要优势」；他倾向靠轮转保持满血，本身速攻模板耐久不重要，最后可能选「固执 + 252 物攻 / 252 速」。并要求结合一切特性，不止这一个例子。
- 由此要回答的两问：① 满血条件保得住吗 → 靠轮转（虫返/换人再上），**堆 HP 换不来**；② 252 全投耐久算不算一个选择 → 只在「需要一个具体承伤基准」时成立，不是为保先制。

### B. 做法
- **不新建先制表**：仓里早有 `PRIO_ABI`（T-1，cls A无条件/B条件/C反先制/D增伤/E概率 + scope + cond）、`pvScopeCovers`、`prioAbiProfile(s,b)`（返回 `{items,cls,actual,coverMain}`）、`prioCov`、`hasFullHpPrio`。第一版我另造了一份同名 `PRIO_ABI`，被后定义覆盖 → 命中全空；改为**全部复用**。
- 新增 `prioCondZh(c)`（fullHp→满血时 / firstTurn→登场首回合 / firstUse→每次上场首次 / oppHpBelowHalf→对手半血以下 / fog→雾中）与 `prioDecisionOf(s,b)`（薄封装：取 A/B 中最高优先的一条，给出 `{ok,cls,actual,cover,name,scope,cond}`）。
- **sub:1 守卫的处理**：277/351/560 这批满血先制在 T-1 带 `sub:1`，按 v4.50 路线甲「只在子区路径登记」，core 路径 `prioAbiProfile` 会跳过 → 判定为空。这里只取「有没有先制」给用户看、与评分无关，所以空结果时用 `{...b, _r450_subOnly:true}` 副本再问一次；**评分路径零改动**。
- 新增 `prioAdviceHtml(s,b,curEv,natName)`：
  - 主攻吃得到先制 → 「覆盖 N/4 招（最高「真气拳」150）」+ **先制线**（中性性格够到 P50 的 EV，省下的点转投攻/耐久）+ **常态线**（加速性格卡 P75），两条都带「采用」芯片；
  - 主攻吃不到但有拳招 → 明说「主攻「愤怒」吃不到，4 招里只有「吸取拳」（75）能吃到」，并给「把它顶成主攻就能按先制配速」的线；
  - 4 招全都不吃 → 「先制现在完全用不上，速度要求不降」，不给降速方案；
  - 特性没选它（只有天性/备选） → 「拿不到先制，速度按常态算」。
- 采用态不丢推理：`curEv` 对上哪条线就打「← 你现在的配速」；先制段与 `spdCoreLineHint` **二选一**（同一屏不报两套同样的数字）。
- 消费点：核心第 6 段（`evBarHtml`，排在速度数字后、卡线前）；配速抽屉（`speedSliderHtml` 里 `#spdPrioBox`，用 `deriveBuilds(s)[0]` 与核心同源）。`spdHintAdopt` 采用后同步把抽屉滑块推到该线。

### C. 门禁与测试
- 语法 6 块全过；smoke 33/33；probe ALL PASS；`test_269_prio.js` **29/29**（新建，桩 `prioAbiProfile`，覆盖 A/B/C/空/异常、覆盖/不覆盖/4 招无用、采用与够不到、卡线芯片）；`test_268_dexlink.js` 26/26、`test_264_spdlink.js` 24/24（补 `spdHintChip/prioAdviceHtml` 桩）、`test_265` 20/20、`test_266` 16/16、`test_267` 13/13。
- 浏览器端到端（烈焰猴R #2601）：核心第 6 段 = 「速度 315 / P66 / 先制：闪电拳手（满血时 拳招）—— 主攻「愤怒」吃不到，4 招里只有「吸取拳」… · 先制线：中性 84 EV 273（P50）· 常态线：加速 196 EV 331（P75）· 满血靠轮转保…」；切流派 2（主攻真气拳）= 「覆盖 2/4 招（最高「真气拳」150）」；抽屉 `#spdPrioBox` 同文案，点「采用」→ localStorage `2601:nat=中性,ev=84,val=273`、滑块同步到 273。

### D. 教训
- **同名重定义会被后面的定义静默吃掉**：`var PRIO_ABI` 在文件里出现两次时，JS 不报错、只是先定义的那份永远读不到；表现为「函数跑通了但字段全 undefined」。新增全局表前先 `Select-String` 同名，或直接复用。
- **两套汉化数据的同一个特性可能不同名**：`_erd_slim.json` #277 = 「闪电拳击」，而流派卡 `bd.abi[0].n` = 「闪电拳手」。凡是「按中文名反查 id」的地方都要按 id 兜底。
- **只给「不满足」不够，要给「怎么才能满足」**：用户最容易卡在「我有先制但主攻不是拳招」这一步，一句「只有吸取拳能吃到，把它顶上来」比一句「不降速」有用得多。

## v4.270（2026-11-10）：先制延伸到速度线页 + A 类（无条件先制）单独措辞

### A. 需求
- v4.269 只解决了「核心第 6 段 / 配速抽屉」；用户在多页之间看速度时，速度线页的「我的队伍 · 速度现状」仍只有实速 + 分位，看不出「这只为什么可以慢」。
- 另外 A 类先制（158 恶作剧之心 / 205 先行治疗 / 946 飓风之翼）**不依赖满血、不依赖回合**，跟 B 类（fullHp / firstTurn / firstUse）不是一回事：变化招先制只看先后手，速度可以完全不投。

### B. 做法
- 新增 `teamPrioMark(s)`：数据层判定（`prioDecisionOf(s,{_r450_subOnly:true})`，不看配招），命中就给橙色「先制」小标，标题里带特性名与条件。
- `teamSpeedStripHtml` 行内挂标 + 脚注「标「先制」的 N 只：带条件先制…速度未必需要卡到 P75」。判定用 `{_r450_subOnly:true}` 是为了让 277/351/560 这批 `sub:1` 的满血先制也能被识别（与核心第 6 段同一招法）。
- `prioAdviceHtml` 增加 A 类分支：
  - `noNeed = clsA && (scope==='变化'||scope==='回复')`：不再讲「主攻吃不到 / 把它顶成主攻」（变化招没有主攻这回事），改为「这套里有 N 个变化招（「替身」）吃得到先制，而变化招只看先后手、不看速度」；
  - 先制线改成「速度可以不投（这 252 点留给耐久/输出更值）」，芯片 `spdHintAdopt(s.id,0,…)`；采用后打「← 你现在的配速」；
  - A 类不再给「常态线」（不投速与「再投 196 EV 抢 P75」同屏会自相矛盾），改为一句边界说明；恶作剧之心追加「但对恶属性目标会失效」。
- `spdHintAdopt` 支持 `val=0`：`pl={nat:'中性',ev:0,val:dmgStatOf(bstI(s,5),0,31,5,'')}`，走同一条 `spdPlanSave` + 滑块同步；toast 分两种文案（+N EV / 速度不投）。

### C. 门禁与测试
- 语法 6 块全过；smoke 33/33；probe ALL PASS；`test_269_prio.js` 扩到 **37/37**（A 类三条 + 4 招无变化招 + val=0 采用）；`test_266_strip.js` 扩到 **21/21**（先制标、只标一只、脚注统计、全队无先制不出脚注）；268/264/265/267 分别 26/24/20/13 全过。
- 浏览器端到端：速度线页注入 2601/103/55 → 「烈焰猴R 273 P47 配速 中速 先制」+ 脚注「标「先制」的 1 只…」；梦妖魔切到恶作剧之心 → 「先制：恶作剧之心（无条件 变化招）—— 这套里有 3 个变化招（「替身」）吃得到先制… 先制线：速度可以不投…」；点「不投速」→ `er_spdPlan_v1.429 = {nat:'中性',ev:0,val:256}`，核心页头转「你的配速 · 中性性格」。

### D. 教训
- **改一段 JS 时先确认该区域的换行风格**：v4.269 整段替换进去的是 LF，而文件其余是 CRLF，锚点按 CRLF 写就必然 `count==0`；打 `repr()` 看到 `\n` 才知道要换锚点。
- **HTML 属性里塞中文标题容易漏括号**：`title="'+esc(...+'：这只…先制线">先制</span>'` 少了一个 `)`，`node --check` 直接报 `missing ) after argument list`；把 esc 的参数用 `)+'"'` 收口即可。
- **同一套结论换场景就要换措辞**：变化招场景照抄攻击招的「把它顶成主攻」是错的——用户会照着找「主攻」而找不到。

## v4.271（2026-11-10）：把「配速」变成可筛选、可跳转的入口

### A. 需求
- 配速体系铺开后，两个收口缺口：① 宝可梦页只能逐张卡看「已配速」，没法「把我定过速的那几只挑出来」；② 「队伍分析」的速度结构卡讲完全库分位，却没有去「速度线」页的入口，用户只能自己切 Tab。

### B. 做法
- 宝可梦页工具栏新增 `◎ 已配速`（`#planOnlyBtn` → `togglePlanOnly()`），沿用既有 `_favOnly / _recentOnly` 的开关范式；过滤条件 `spdPlanOf(s)` 非空，`renderSp` 里一行接进过滤链。
- `#spMore` 尾部追加「仅已配速：N 只，点卡片看你的配速或去核心配队定一条」——空结果时用户能看懂下一步去哪。
- 队伍分析「队伍速度结构」标题后挂 `去速度线页 →`（`switchTab('speed')`），把「看全库分位」这件事一步接上。

### C. 门禁与测试
- 语法 6 块全过；smoke 33/33。
- 浏览器端到端：宝可梦页点「◎ 已配速」→ 网格只剩 胡地/椰蛋树/烈焰猴R 三张（localStorage 里正好三条配法），`#spMore` 写「共 3 只 … 仅已配速：3 只」；队伍分析点「去速度线页 →」→ 落到「全库速度分位锚点」页。

### D. 教训
- 新开关直接复用同类既有开关的写法（`window._xxxOnly` + 按钮高亮 + `renderSp(true)`），不另造状态管理；这样「清空筛选 / 切 Tab / 滚动加载」都不用跟着改。
- 空结果必须给下一步（本例：去核心第 6 段点「采用」），否则用户会以为筛选坏了。

## v4.272（2026-11-10）：三个收口——够不到的芯片会说话、琴无人持有的行点名、字号回辅助类

### A. 需求
- 遗留三项（用户已明确「存档导入不用了」）：① 常用速度芯片（P50/P75/P90/P95/P99）超过本只上限时，点了只是把滑块推到头，静默钳制；② `SPD_ABI` 里躺着本代图鉴零持有者的行；③ 抽屉标题里的英文名/编号用内联 `15px + color:var(--sub)`，没走辅助类。

### B. 做法
- 新增 `spdSliderSetChip(v,lab)`：`v > spdMaxOf(s)` 时先钳到上限、再 toast 说明「这只速度上限 N（252 EV + 速度性格 + 特性全算满），够不到 P95（394）—— 想再快只能靠围巾 / 顺风 / 戏法空间」；够得到则原样 `spdSliderSetVal(v)`。芯片 onclick 从 `spdSliderSetVal` 换成它。
- 新增 `spdAbiNoHolders()`：把 `SPD_ABI` 17 条逐条拿去和全库 `abis/inns` 比（`abiSame` 别名感知），收集零命中项并缓存；速度线页「特性加速」列的口径说明尾部点名「其中「慢启动」在本代图鉴暂无任何持有者（保留只为机制备案，永远不会命中——别按它去挑宝可梦）」。实测只有慢启动（ability 112，src `SLOW_START`）一条。
- 新增 CSS `.mute15{font-size:15px;color:var(--sub)}`，把宝可梦详情抽屉 / 招式抽屉两处内联 span 换成 `class="mute15"`（视觉零变化，样式只剩一处真源）。

### C. 门禁与测试
- 语法 6 块全过；smoke 33/33（新增的两处 catch 都写了非空体，静默 catch 仍是 390）；probe ALL PASS。
- 浏览器端到端：胡地抽屉点 P95 → toast「这只速度上限 372…够不到 P95（394）—— 想再快只能靠围巾 / 顺风 / 戏法空间」，滑块停 372（pos 99）；卡璞・鸣鸣（上限 394）点 P95 不触发提示、正常吸附。速度线页口径说明出现「其中「慢启动」…暂无任何持有者」。

### D. 教训
- 控件「压暗 + title」只能解释「为什么点不动」，不能解释「点了会发生什么」；钳制类交互要补一次即时文案，否则用户把「到头了」当成卡顿。
- 静态表里的零命中行要**动态算**而不是手写清单：表会加，持有者会变，`spdAbiNoHolders()` 每次从 EREADATA 现算并缓存即可。

## v4.273（2026-11-10）：先制标铺到槽位

### A. 需求
- v4.270 的「先制」标只出现在速度线页的队伍条；用户在「队伍构建」槽位和「队伍分析」六队槽位里看到的仍只有「速 273」，看不到「这只其实有先制、速度要求可以低于常态线」。同一结论换页面就消失。

### B. 做法
- 两处槽位 HTML 在「速 N」徽标后直接接 `teamPrioMark(s)`（同一函数、同一数据判定 `prioDecisionOf(s,{_r450_subOnly:true})`），title 仍写「这只的速度要求可以低于常态线，点开看先制线」。
- 不加任何新状态：池里没有先制特性的宝可梦自然不出现标，不改变布局宽度（12px 小标，跟在速徽标同一行）。

### C. 门禁与测试
- 语法 6 块全过；smoke 33/33；probe ALL PASS。
- 浏览器端到端（临时把 2601 烈焰猴R 塞进队伍后还原）：队伍构建槽位 `烈焰猴R 水 格斗 速273 先制 ×`；队伍分析槽位 `烈焰猴R 输出 速273 先制 ☆ ×`；椰蛋树 / 哥达鸭无标（无先制特性）。

### D. 教训
- 「结论落点」要按用户实际停留的页面铺：速度线页是图，槽位才是他配队时一直盯着的卡。
- patch 锚点别带上行尾（该文件 CRLF/LF 混杂）；REPL 用不含换行的唯一子串 + `count==1` 断言最稳。

## v4.274（2026-11-10）：把「省下来的速度 EV」摊成实数

### A. 需求
- 先制线以前只说「速度可以不投 / 省下 168 点转投攻或耐久」，但没回答「投过去到底买到什么」。用户实际决策就是「降速 vs 常态」两案二选一，缺一张能横向比的实数表。

### B. 做法
- 新增 `prioEvTradeHtml(s,evA,natA,evB,natB)`：用 `spdAtkAlloc` / `spdBulkAlloc` 同一套分配器，把先制线与常态线两案各算成「实速（含加速 ×1.1 / 减速 ×0.9 性格修正）+ 分位 + HP 实数 + 主攻实数」。
- 结论文案不用写死「HP +N」，而是按真实差额生成「速度让出 N 个百分点（P74→P47），多出的 112 点落在：主攻 +112 EV（实数 +28）」。
- A 类（恶作剧之心这类无条件先制变化招）对照卡的先制线按 **0 EV** 算，不能拿 P50 的配法冒充「不投速」。

### C. 门禁与测试
- 语法 6 块全过；smoke 33/33；静默 catch 仍 390；probe ALL PASS。
- 实跑：烈焰猴R（#2601）→「先制线 中性 84 EV → 273 速（P47）｜HP 293（+0 EV）· 主攻 308（+168 EV）」对「常态线 加速 196 EV → 331 速（P74）｜HP 293 · 主攻 280（+56 EV）」，结论「让出 27 个百分点，112 点落在主攻 +112 EV（实数 +28）」。梦妖魔（恶作剧之心）→「先制线 中性 0 EV → 256 速（P41）· 主攻 319（+252）」对「常态线 加速 180 EV → 331 速（P74）· 主攻 274（+72）」。

### D. 教训
- `dmgStatOf(base,ev,iv,stIdx,nn)` 的 `nn` 必须是**真实性格名**（NATURES 的键，如「爽朗」），喂「加速/中性」这类类别会静默返回 ×1，算出来的实速永远差 10%——本轮第一次就是这样把 331 算成 301。
- 对照类 UI 的结论句要由数据生成，不要预设「省下来的点都去 HP」；分配器优先拉满主攻时那句话就是错的。
- 「不投速」的对照必须是 0 EV，用 P50 目标反算出来的 68 EV 是另一条线，混用会自相矛盾。

## v4.275（2026-11-10）：回合累积型增速（加速）单独成类

### A. 需求
- 速度体系里只有两类：SPD_ABI 的「静态倍率」（悠游自如 ×1.5、轻装 ×2…）和围巾/顺风的外部乘区。**加速（Speed Boost, ability #3）** 是第三类：每回合结束 +1 级、入场当回合不触发（源码 desc：「Raises own Speed by one stage after every turn」）。
- 后果：速度线表「特性加速」列对它显示「—」（它不是固定倍率），用户会以为工具没识别；而配速结论其实完全不同——不必按 P75 满投，第 2 回合起自己就超过极速。
- 全库 **53 只**持有（abis 或 inns 命中，例：雷吉艾勒奇 894 / 超级多龙巴鲁托 2263 / 铁面忍者 291 / 雷布 135 / 火稚鸡 255）。

### B. 做法
- 新增 `SPD_RAMP`（目前一条：加速）+ `spdRampOf(s)`（`abiSame` 别名感知、abis 与 inns 都查）+ `spdRampHtml(s,baseVal)`；等级倍率表 `_spdRampLv=[1.5,2,2.5,3,3.5,4]`。
- 文案给三档实算：从当前实速 X 起 → 第 2 回合 ×1.5、第 3 回合 ×2、第 4 回合 ×2.5，超出 P99 就直说「已超出全库极速档 P99 441」，不硬套分位。
- 落点两处：核心第 6 段速度行下方（与先制结论并列）、配速抽屉（`#spdPrioBox` 里紧接先制结论）。速度线表该列命中时显示 `第2回合速度 + 加速 +1/回合（第2回合起 ×1.5）`。
- 与先制联动：这只同时有先制时补一句「你还有先制，第一回合本来就能先手」——先制管第一回合，加速管第二回合之后，两者叠起来速度投入可以只留过桥线。

### C. 门禁与测试
- 语法 6 块全过；smoke 33/33；静默 catch 仍 390；probe ALL PASS。
- 实跑：速度线表空搜索前 400 行里 3 只加速物种都显示「加速 +1/回合（第2回合起 ×1.5）」；铁面忍者（#291）核心第 6 段读到「从 356 起 → 第2回合 534（已超出全库极速档 P99 441）· 第3回合 712 · 第4回合 890」+ 结论「不必按 P75 拼满，把点位换成守住/替身/虫返过桥」。

### D. 教训
- 「速度修正」不是单一维度：静态倍率、回合累积、外部乘区（围巾/顺风/空间）各自要自己的结论口径；把它们塞进一张倍率表，零命中就会被误读成「工具没识别」。
- 分位标签对超出全库上限的数值没有意义（534 会算出 P100 却看不出「已经没人跟得上」），直接用「超出 P99 N」更准确。
- 建议文案不能和当前配置打架：这只已经投到 P85 时写「不必按 P75 满投」会显得自相矛盾，改成「速度投入只需要够到第一回合别被带走」。
