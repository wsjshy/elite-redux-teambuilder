### E.1 克制表 v3.13「全量核实」（21×21 逐格）

- **成品数据**：`配招工具_data.js` → `ERDATA.matchup`（21×21）+ `ERDATA.types`（21 顺序）。
- **实证取值**：`ERDATA.matchup[防守=地面][攻击=火] = 1`（火打地面=1x，**与原版一致**——原版标准表亦为 1×；2026-10-06 修正）；`ERDATA.matchup[防守=电][攻击=水] = 1`（水打电=1x）。
- **来源链**：`build_tool_data.py` 第 54-72 行从 `ER2.65简汉化\ER2.65beta版图鉴v0.3.xlsm` Sheet1 读入 → 第 74-90 行补齐 星晶/无/神秘 全中性行列 → 落盘 `ERDATA.matchup`。
- **项目结论定位**：`AGENTS.md` §6「v3.13 克制表全量核实」（xlsm vs 官方 `battle_util.c sTypeEffectivenessTable` 转置逐格 0 差异）+ §6 待办 0（火打地面 ER 特例待游戏内裁定）。

### E.2 天气增伤 20%

- **本地文本证据**：`配招工具_data.js` → `ERDATA.templates[0].tips[0]`：「ER 天气为无限回合（天气特性），但增伤从 50% 削到 20%……」；同源定义 `build_tool_data.py` `TEMPLATES[0]['tips'][0]`。
- **前端静态提示**：`build_tool_html.py` 第 219 行：「💡 ER 特化提示：天气增伤统一 20%（原版 50%）……」
- **其余模板旁证**：`ERDATA.templates[1].tips[0]`（「ER 晴增伤 20%；日光束晴天下无需蓄力」）。
- **结论定位**：`AGENTS.md` §3（ER 调整说明「天气增伤 20% 非 50%」）。
- **未本地证实项**：20% 的**数值源头**在 ER 官方 ROM/源码，本仓库 gameData/moves 中无天气增伤字段（`moves[].eff/chance/arg` 无天气加成项），故只能引模板文本与 AGENTS 结论。

### E.3 冻伤（frostbite）替代冰冻

- **本地文本证据**：gameData `moves` 中附带冰冻效果的招式描述写作 frostbite，例如 id=8 冰冻拳 `desc` = "An icy punch that may leave the foe with frostbite."。
- **ER 调整说明**：`ERDATA.templates[3].tips[1]`（雪天堡垒）：「冻伤替代冰冻：1/16 掉血 + 特攻减半 —— 冰系招式附带价值」；`ERDATA.templates[8].tips[2]`（钉子受队）：「冻伤（特攻减半）配合剧毒可双压物特两端」。
- **前端静态提示**：`build_tool_html.py` 第 219 行：「……冻伤替代冰冻（1/16 掉血+特攻减半）……」。
- **结论定位**：`AGENTS.md` §6（模板说明「冻伤替代冰冻」）。

### E.4 教学池合并（ER v2.65 无蛋招 / TMHM 数据）

- **实读证据（gameData）**：全 1907 条物种中，`eggMoves` 非空 **0** 条、`TMHMMoves` 非空 **0** 条（全表为空数组）；而 `levelUpMoves` 非空 **1905** 条、`tutor` 非空 **1907** 条。
- **配套实读**：`forms` 非空 **41** 条、`SEnc` 非空 **144** 条。
- **下游表现**：ERDATA 每只仅 `lv`（升级）+ `tut`（教学）两池；内嵌解析器 `buildRowJs` 中 `可学_蛋:0, 可学_TMHM:0`（build_tool_html.py 第 1028 行）为定值 0。
- **结论定位**：`AGENTS.md` §3/§6（「ER v2.65 无蛋招/TM 字段——教学池已合并 TM/蛋内容」）。

### E.5 个体值 IV=0 口径（ER 个体默认满值但不入能力公式）

- **能力公式证据**：`配招工具_data.js`（引擎）/`build_tool_html.py` `calcStat(base,ev,lv,nature,isHp)`：`HP = floor((2*base+floor(ev/4))*lv/100)+lv+10`、`其他 = floor((floor((2*base+floor(ev/4))*lv/100)+5)*nature)` —— **公式中无 IV 项**（等价 IV=0 口径）。
- **解析器证据**：`build_tool_html.py` `buildRowJs` 盒子分支 `cap='(公式基准)'`、`natureProfile` 以基准值反推天性 ±10%；Python 侧同口径见 `parse_er_save_v4.py`。
- **结论定位**：`AGENTS.md` §3「个体值机制（2026-10-06 用户澄清+公式实证）」——IV=0 口径与全部真值吻合、IV=31 口径全部失配。

### E.6 特性 n 选 1 + 天性固定 3 个

- **数据结构证据**：gameData `species[].stats.abis`（可选池，定长 3）与 `species[].stats.inns`（固定天性，定长 3）；ERDATA 每只展开为 `abis:[3]` / `inns:[3]`。
  - 抽查 id=2232（Clodsire Mega）：gameData `stats.abis = [147, 109, 402]`、`stats.inns = [834, 11, 840]`；ERDATA `abis = ["奇迹皮肤", "纯朴", "毒棘"]`、`inns = ["毒沼制造者", "储水", "毒刺"]`（两表同源、逐位一致）。
- **前端提示证据**：`build_tool_html.py` 第 219 行静态提示「训练师全员 4 特性+道具」与「个体默认 31、Iron Pill 可把速度 IV 调 0」。
- **引擎表现**：`defCellTrio` 天性口径只认 `s.inns`（`abiImHf` 中 scope='天性'）；可选池单独作为 opt 口径（未勾选不生效，勾选后覆盖池内其它）；`pickAbi` 单选/取消交互。
- **结论定位**：`AGENTS.md` §3「特性体系（2026-10-06 用户澄清）」——游戏特性页 4 项 = 当前生效特性（abis 池 n 选 1）+ inns[0..2]；§6 待办 1（选中项存档来源加密块未解）。
