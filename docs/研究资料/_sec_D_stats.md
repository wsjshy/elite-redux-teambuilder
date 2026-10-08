### D.1 数据规模总览（实读）

| 对象 | 数量 | 来源字段 |
|---|---|---|
| 物种（gameData.species） | 1907 | gameDataV2.65beta.json `species` |
| 物种（ERDATA.species） | 1906 | 配招工具_data.js `ERDATA.species` |
| 招式（gameData.moves / ERDATA.moves） | 1032 / 1032 | `moves` |
| 特性（gameData.abilities / ERDATA.abilities） | 1034 / 1034 | `abilities` |
| 道具（gameData.items / ERDATA.items） | 929 / 929 | `items` |
| 属性（gameData.typeT / ERDATA.types） | 21 / 21 | `typeT` / `types` |
| 特性效果标签 ABI_TAGS | 98 | build_tool_data.py `ABI_TAGS` = ERDATA.abiTags |
| 特性别名 ABI_ALIAS | 419 | ERDATA.abiAlias |
| 招式点评 MOVES_NOTES | 69 | ERDATA.movesNotes |
| 战术模板 TEMPLATES | 12 | ERDATA.templates |
| 人工分析 coreNotes | 44 | ERDATA.coreNotes |
| 非最终形态 nonFinal | 640 | ERDATA.nonFinal（= gameData 全表 kd==0 判定 640 条） |

### D.2 物种 1907 / 1906 的差异与「非最终形态」判定

- gameData.species 共 **1907** 条，ERDATA.species 共 **1906** 条。
- 仅存在于 gameData 的 id：`[-1]`（即 id=-1 的 `SPECIES_NONE` 占位，无中文名、种族全 0）。仅存在于 ERDATA 的 id：`[]`。
- 非最终判定（build_tool_data.py 第 105 行）：`NONFINAL = [str(s['id']) for s in GD['species'] if any((e or {}).get('kd') == 0 for e in (s.get('evolutions') or []))]`，即 *evolutions 中含 kd==0（普通进化）* → 非最终；kd==1（Mega/道具进化）仍算最终。结果 **640** 条，与 gameData 独立复算一致（640 条）。
- evolutions 条目 kd 直方图（全表）：{0: 699, 1: 287, 2: 18, 3: 15, 4: 15, 5: 1}；条目字段集合 = ['in','kd','rs']（in=进化方式/道具，rs=进化目标物种 id）。

### D.3 招式 1032 字段结构

- gameData.moves 每条字段：`id`, `name`, `NAME`, `sName`, `eff`, `pwr`, `types`, `acc`, `pp`, `chance`, `target`, `prio`, `split`, `flags`, `arg`, `desc`, `lDesc`, `usesHpType`
- ERDATA.moves 为 10 元数组，下标语义（build_tool_data.py 第 19-21 行注释 + 实读）：`[0]编号 [1]中文名 [2]英文名 [3]属性 [4]分类 [5]威力 [6]命中 [7]PP [8]先制 [9]官方描述`。
- 分类取值实读集合：`物理 / 特殊 / 变化`（对应 gameData `split` 0/1/2；ER 游戏内文本用中文）。
- ERDATA.moves 分类计数：{'物理': 470, '特殊': 254, '变化': 276, '特殊(取最高攻)': 26, '特殊(取防御)5: 待定': 4, '特殊(取最高伤害)': 1, '特殊(取特防)': 1}（含 id=0 的占位招式 `-`）。

### D.4 道具 929 与描述覆盖

- ERDATA.items 每条 = `[id, 英文名, 中文名, 描述]`；英文描述非空 **701** / 929，中文名非空 **165** / 929（id=0 为 `????????` 占位，描述 `?????`：1 条）。
- 中文名缺失项多为 ER 新增道具/邮件/钥匙类（源 `道具表_完整.csv` 未含官方译名，脚本回退英文名）。

### D.5 中文名与可学池规模（ERDATA 口径）

- 物种中文名 ≠ 英文名（即有真中文名）**1872** / 1906；特性中文名非空 **1029** / 1034；招式中文名 ≠ 英文名 **1009** / 1032。
- 口径说明：`build_tool_data.py` 第 20 行 `moves[r[0]] = [r[0], r[1] or r[2], …]`、第 31 行 `'zh': r[1] or r[2]` —— 两者**中文缺失时回退英文名**，故此处以「中文名 ≠ 英文名」判定真实中文覆盖；道具（zh = r[2] or ITEM_ZH_EXTRA，无英文回退）以非空判定。
- 可学池条目总数：升级 `lv` **40299** 条 + 教学 `tut` **72281** 条 = 112580 条（ERDATA 每只为 `lv=[[等级,招式id],…]` + `tut=[招式id,…]`）。

### D.6 gameData 招式数组的空字段实读（ER v2.65 教学池合并的证据）

- 有 levelUpMoves 的物种：**1905**；有 tutor 的物种：**1907**；
- 有 eggMoves 的物种：**0**；有 TMHMMoves 的物种：**0**（→ 全表为空）。
- 有 forms 的物种：**41**；有 SEnc 的物种：**144**（两者均为**非空**，与 eggMoves/TMHMMoves 的空表形成对比）。

### D.7 SYS_SET / SYS_MAP / WEATHER_MV / FUNC_MV（build_tool_html.py 第 1318-1335 行，脚本 re 实读）

- `SYS_SET`（判定「天气/场地设置手」，**9 条**）：`降雨`→雨；`雨幕`→雨；`日照`→晴；`扬沙`→沙；`降雪`→雪；`电气制造者`→电场；`精神制造者`→精神场地；`青草制造者`→青草场地；`薄雾制造者`→薄雾场地
- `SYS_MAP`（体系归类，**21 条**）：`降雨`→雨；`雨幕`→雨；`悠游自如`→雨；`雨盘`→雨；`干燥皮肤`→雨；`日照`→晴；`大叶子`→晴；`叶绿素`→晴；`太阳之力`→晴；`扬沙`→沙；`拨沙`→沙；`沙之力`→沙；`沙隐`→沙；`降雪`→雪；`拨雪`→雪；`冰冻之躯`→雪；`电气制造者`→电场；`发电机`→电场；`精神制造者`→精神场地；`青草制造者`→青草场地；`薄雾制造者`→薄雾场地
- `WEATHER_MV`（手动设置天气/场地招式 id→体系，**8 条**）：`240`→雨；`241`→晴；`201`→沙；`258`→雪；`604`→电场；`641`→精神场地；`580`→青草场地；`581`→薄雾场地

- `FUNC_MV`（功能招分类，**10 组**）：
  - `rec`（8 招）：ids [105, 202, 234, 235, 236, 303, 355, 409] = 自我再生/终极吸取/晨光/光合作用/月光/偷懒/羽栖/吸取拳
  - `boost`（11 招）：ids [14, 187, 334, 339, 347, 349, 417, 468, 483, 504, 526] = 剑舞/腹鼓/铁壁/健美/冥想/龙之舞/诡计/磨爪/蝶舞/破壳/自我激励
  - `boostPhys`（8 招）：ids [14, 187, 334, 339, 349, 468, 504, 526] = 剑舞/腹鼓/铁壁/健美/龙之舞/磨爪/破壳/自我激励
  - `boostSpec`（3 招）：ids [347, 417, 483] = 冥想/诡计/蝶舞
  - `hazard`（3 招）：ids [191, 390, 446] = 撒菱/毒菱/隐形岩
  - `speed`（4 招）：ids [86, 317, 366, 433] = 电磁波/岩石封锁/顺风/戏法空间
  - `protect`（2 招）：ids [164, 182] = 替身/守住
  - `pivot`（2 招）：ids [369, 521] = 急速折返/伏特替换
  - `wear`（2 招）：ids [73, 92] = 寄生种子/剧毒
  - `weather`（8 招）：ids [201, 240, 241, 258, 580, 581, 604, 641] = 沙暴/求雨/大晴天/冰雹/青草场地/薄雾场地/电气场地/精神场地
- 注：以上常量定义在 `build_tool_html.py`（非 build_tool_data.py），故 `_engine_literals.json` 中不存在；本源已单独落盘 `_js_consts.json`。

### D.8 克制表顺序差异线索（ERDATA.types vs gameData.typeT）

- gameData.typeT（21 项）：`['Normal', 'Fighting', 'Fire', 'Ice', 'Electric', 'Bug', 'Flying', 'Steel', 'Grass', 'Ground', 'Poison', 'Dark', 'Water', 'Psychic', 'Rock', 'Dragon', 'Ghost', 'Fairy', 'Mystery', 'None', 'Stellar']`
- ERDATA.types（21 项）：`['一般', '格斗', '火', '冰', '电', '虫', '飞行', '钢', '草', '地面', '毒', '恶', '水', '超能力', '岩石', '龙', '幽灵', '妖精', '星晶', '无', '神秘']`
- 逐位比对：idx 0-17 完全一致（一般/格斗/火/冰/电/虫/飞行/钢/草/地面/毒/恶/水/超能力/岩石/龙/幽灵/妖精）；
- **idx 18-20 排列不同**：gameData 为 `Mystery(18) / None(19) / Stellar(20)`，ERDATA 为 `星晶=Stellar(18) / 无=None(19) / 神秘=Mystery(20)`。
- 影响评估：matchup 中这三行/列全为 1（中性），且 `atkCover`/`coverHoles` 显式排除「星晶/无/神秘」，故对攻防计算无影响；但**跨表按 index 直连时不可混用**（需按名索引）。
- 数据源差异：ERDATA.matchup 来自汉化图鉴 `ER2.65beta版图鉴v0.3.xlsm` Sheet1（build_tool_data.py 第 54-72 行），后 3 属性为脚本补齐的全中性行列（第 74-90 行）。

### D.9 ⚠ 实读缺陷：matchup 末 3 行长度不齐（非严格方阵）

- 各行长度实读：`[21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 19, 20, 21]`（前 18 行 21 格；星晶行 19 格、无行 20 格、神秘行 21 格）。
- **成因**：`build_tool_data.py` 第 85-89 行先给已有 18 行 `extend([1]*len(extra_types))`（补齐到 21），再对每个 extra 类型 `matchup.append([1]*len(types))` —— 追加时 `types` 正在增长，故新行长度 = 19/20/21。
- **运行影响**：JS `defMult(types,at)` 读 `ERDATA.matchup[tIdx(防御)][tIdx(攻击)]`，越界得 `undefined`，三个分支均不命中 → 倍率保持 1。因这 3 属性本就是全中性，**当前结果正确**；但属隐性 bug，若日后要给 星晶/无/神秘 填非 1 值会静默失效。
- **下游同样绕过**：`atkCover`/`coverHoles` 显式 `if(t==='星晶'||t==='无'||t==='神秘')return;` 跳过这 3 属性。
