# 数据源调研：Pokémon Showdown 公开对战数据（replay / 日志 / 统计）可获得性、规模与质量

> 用途：为「用神经网络训练宝可梦配队/配招模型」评估训练数据可行性；重点评估 **2024–2026 现状** 与 **迁移到 Elite Redux（ER）改版的可用性**。
> 调研日期：2026-10-07（Asia/Shanghai）。方法：`general_search` + `web_fetch` **实际访问**；下表所有规模数字均标注来源 URL，凡访问失败均如实记录（见 §6）。
> 性质：原始调研稿（未消化进 AGENTS.md）。本文只读检索，未改动项目任何既有文件。

---

## 0. 结论先行（TL;DR）

1. **官方没有任何「一键批量下载」渠道。** Showdown 的 replay 只能通过公开 API 逐场获取：`https://replay.pokemonshowdown.com/<formatid>-<id>.json`（单场 JSON）与 `https://replay.pokemonshowdown.com/search.json?format=<fmt>&page=N`（列表）。官方仓库 README 只提供 sim 库 / 命令行 / 服务器 / WEB-API，**不托管 replay 语料**。["https://raw.githubusercontent.com/smogon/pokemon-showdown/master/README.md"]
2. **规模最实在、最省事的两个来源**：① **Smogon 月度 usage/chaos 统计**（`smogon.com/stats/`，2014-11 起逐月，2026-07 为最新；每格式一份 JSON 仅 0.6–7 MB，**无需解析**，天然是「配招/队友」监督信号）；② **社区已打包的 replay 语料**——Metamon（`jakegrigsby/metamon-parsed-replays` 5.3M 轨迹 / 28.5 GB；`metamon-raw-replays` 2.7M 场）与 PokéChamp（`milkkarten/pokechamp` 2.13M 行）已把下载/解析成本替你付掉。["https://www.smogon.com/stats/","https://huggingface.co/datasets/jakegrigsby/metamon-parsed-replays","https://huggingface.co/datasets/jakegrigsby/metamon-raw-replays","https://huggingface.co/datasets/milkkarten/pokechamp"]
3. **胜负标签天然可得且干净**：replay 日志末尾 `|win|<玩家名>` 即胜者，另一方即负者，可直接做二分类监督。["https://replay.pokemonshowdown.com/gen9ou-2688037817.json"]
4. **最大局限**：标准 replay **不保证完整配招/道具/特性/努力值**——只在「亮相（team preview）」暴露全部物种，招式/道具/特性仅在实战触发时才被揭示。想拿完整配招，要么用 **OTS（公开队伍表）格式**（VGC/Champions），要么用 **Smogon chaos JSON**（它直接把 moveset/teammate 分布统计好了）。["https://huggingface.co/datasets/cameronangliss/vgc-battle-logs","https://www.smogon.com/stats/2026-06/chaos/gen9nfe-1500.json"]
5. **对 ER 的迁移结论（关键）**：ER **没有** Showdown 环境、也没有任何 ER 原生对战语料（本轮检索未发现 ER 版 Showdown 服务器或 ER battle-log 数据集）。因此 Showdown/Smogon 数据对 ER **只能当「预训练 / 先验 / 方法论模板」**，不能当 ER 的 ground truth：ER 的 1907 物种 / 1034 特性 / 1032 招式 / 929 道具（见项目 `AGENTS.md`）中，**双特性体系（abis + inns/天性）与自创招式/特性在 Showdown 里基本不存在**，分布漂移很大。

---

## 1. 数据源清单（名称 / URL / 格式 / 规模 / 更新频率 / 获取方式）

### 1.0 总表

| # | 数据源 | URL | 格式 | 规模（有据） | 更新频率 | 获取方式 |
|---|--------|-----|------|--------------|----------|----------|
| 1 | Showdown Replay（单场 JSON） | `https://replay.pokemonshowdown.com/<formatid>-<id>.json` | JSON（含 battle log 文本） | 单场；`search.json` 每页约 50 条 | 实时（上传即得） | HTTP GET，逐场 |
| 2 | Showdown Replay 检索 API | `https://replay.pokemonshowdown.com/search.json?format=gen9ou&page=1` | JSON 数组 | 每页约 50 条；总量官方未公布 | 实时 | HTTP GET，分页 |
| 3 | Smogon 月度 usage（txt） | `https://www.smogon.com/stats/2026-07/gen9ou-0.txt` | 纯文本表 | gen9ou 当月 **654,262 场**；gen9zu 当月 5,773 场 | 每月（次月上/中旬） | HTTP GET，直接下载 |
| 4 | Smogon chaos 统计（JSON） | `https://www.smogon.com/stats/2026-07/chaos/gen9ou-1500.json` | JSON | 单文件 0.58–6.68 MB（见 §1.2） | 每月 | HTTP GET，直接下载 |
| 5 | 官方数据文件（dex/move/learnset） | `https://play.pokemonshowdown.com/data/` | `.js`（少量 `.json`） | `pokedex.json` 511.89 KiB / `moves.json` 254.88 KiB / `learnsets.json` 3.04 MiB / `teambuilder-tables.js` 15.03 MiB | 随游戏机制更新（2026-10-02 更新） | HTTP GET，直接下载 |
| 6 | 官方服务器仓库 | `https://github.com/smogon/pokemon-showdown` | JS 源码（MIT） | 仓库本体（无 replay 语料） | 持续 | git clone（**网页被 robots 拦，见 §6**） |
| 7 | Metamon 原始 replay | `https://huggingface.co/datasets/jakegrigsby/metamon-raw-replays` | Parquet | **1.83M 行**（HF 视图）/ README 述 **2.7M 场** | 不定期（v6 = 至 2026-05-19） | HF download |
| 8 | Metamon 解析轨迹 | `https://huggingface.co/datasets/jakegrigsby/metamon-parsed-replays` | tar.gz（内含 lz4 JSON） | **5.3M 轨迹 / 28.5 GB** | 不定期（v6） | HF download / `python -m metamon.data.download` |
| 9 | PokéChamp replay | `https://huggingface.co/datasets/milkkarten/pokechamp` | Parquet | **2.13M 行**（train 1.92M） | 2024–2025 存量 | HF download |
| 10 | VGC-Bench 日志 | `https://huggingface.co/datasets/cameronangliss/vgc-battle-logs` | JSON | **88,905 场 / 177,810 轨迹 / 1,474,324 转移 / 630 MB**（MIT） | 2026 Reg M-A/M-B 存量 | HF download（含爬取与转轨迹脚本） |
| 11 | Metamon 自对弈集 | `https://huggingface.co/datasets/jakegrigsby/metamon-parsed-pile` | tar.gz | pac-base 11M / pac-exploratory 7M / pac-tauros 4M 轨迹 | 不定期 | HF download |
| 12 | Metamon 队伍集 | `https://huggingface.co/datasets/jakegrigsby/metamon-teams` | Showdown 队伍文件 | 例 gl_05_26: gen3 107k / gen9 139k 队 | 不定期 | HF download |
| 13 | PokéAgent Challenge（聚合入口） | `https://pokeagent.github.io/track1.html` | 目录页 | 汇总上表 7/8/9 + `teams` + `usage-stats` | — | 目录页 / 各 HF 链接 |

> 备注：Showdown 全站 replay **总量官方未公布**。可核验的下界：Metamon-raw（2014–2025，除 VGC）1.8M + PokéChamp（2024–2025）2M ≈ **3.8M 场**已被第三方下载并托管；PokéAgent 页面口径为「**millions of competitive battles publicly available**」。["https://pokeagent.github.io/track1.html"]

---

### 1.1 Showdown Replay 数据（数据源 #1 / #2）

**URL 规律**：`https://replay.pokemonshowdown.com/<formatid>-<battleid>`，其中 `formatid` 形如 `gen9ou` / `gen9doublesou` / `gen9vgc2026regf` / `gen9championsou`；追加 `.json` 得到机器可读数据（如 `https://replay.pokemonshowdown.com/gen9ou-2688037817.json`）。列表页用 `search.json?format=<fmt>&page=<N>`。

**实测（2026-10-07，均成功）**：
- `GET …/search.json?format=gen9ou&page=1` 返回 **JSON 数组**（本页 50 条），每条字段：`uploadtime / id / format / players[2] / rating / private / password`。样例 id：`gen9ou-2694388090`。可确认对局实时产生（上传时间戳为 fetch 当时分钟级）。["https://replay.pokemonshowdown.com/search.json?format=gen9ou&page=1"]
- `GET …/gen9ou-2688037817.json` 返回单场完整对象，字段：`id / format / players[2] / log / uploadtime / views / formatid / rating / private / password`。**`log` 是完整对局协议文本**，含：
  - `|poke|p1|Zoroark-Hisui, F|` …（team preview：暴露全部物种）
  - `|teamsize|p1|4|`（队伍规模）
  - 逐回合 `|switch| / |move| / |-damage| / |-status| / |faint| / |-terastallize| / |-weather|`
  - `|win|darth xman|`（**胜者**）
  - `|player|p1|…|1401` 行内含**双方 Elo 评分**（rating 字段在未评分场为 null）
  ["https://replay.pokemonshowdown.com/gen9ou-2688037817.json"]
- 站内还可见 OTS/公开队伍表格式的 replay（如 `gen9doublesou-2574719492`、`gen9vgc2026regf-2606527445`），其回放页会**列出双方 6 只队伍**——这是「完整队伍」可得的例外情形。["https://replay.pokemonshowdown.com/gen9doublesou-2574719492"]

**格式与协议规范**：日志协议遵循服务器仓库的 `sim/SIM-PROTOCOL.md`；站点 API 见客户端仓库 `WEB-API.md`（服务器 README 明确指向：`pokemon-showdown-client: WEB-API.md`）。["https://raw.githubusercontent.com/smogon/pokemon-showdown/master/README.md"]

**含双方队伍与对局过程吗？**
- **对局过程：完整包含**（逐回合事件、换人、伤害、状态、Tera、天气/场地、回合数）。
- **队伍：部分包含**——team preview 暴露**全部物种**（标准单打 6 只 / 双打等按格式），但**招式/道具/特性只在实战触发时揭示**，努力值一般**不暴露**。完整配招仅在 **OTS 公开队伍表**格式可得。

**规模**：官方未公布总量。第三方已托管的存量见 §1.4（≈3.8M 场）。**注意**：replay 为玩家「自愿上传」，且会过期/可删除；搜索 API 只返回非 private 场次。

---

### 1.2 Smogon 月度统计（数据源 #3 / #4）

**索引页**：`https://www.smogon.com/stats/`（实测成功，含 `<link>` 目录列表）。**覆盖 2014-11 起逐月**，最新为 **2026-07**（目录 mtime `01-Aug-2026 13:17`，其 `chaos/` 子目录 mtime `23-Aug-2026 21:55`）。**截至 2026-10-07，2026-08 / 2026-09 尚未发布**（约 2 个月滞后）。["https://www.smogon.com/stats/"]

**月份目录结构**（实测 `https://www.smogon.com/stats/2026-07/`）：顶层为「每格式 × 每档位」的 `.txt`，另有 5 个子目录 `chaos/ leads/ metagame/ monotype/ moveset/`。["https://www.smogon.com/stats/2026-07/"]

**格式（tier）覆盖**：2026-07 目录含 **约 60 个格式族**，含 `gen1ou`…`gen9ou`（各代 OU）、`uu/nu/pu/zu/lc/ubers`、`gen9doublesou/doublesubers`、`gen9monotype`、`gen9nationaldex(+aaa/ubers/monotype/doubles/uu)`、`gen9almostanyability`、`gen9balancedhackmons`、`gen9vgc…/champions…`、`gen9anythinggoes`、`gen9cap`、`gen9zu` 等。["https://www.smogon.com/stats/2026-07/"]

**档位（cutoff）**：旧世代多为 `-0 / -1500 / -1630 / -1760`；Gen9 部分用新档位 `-0 / -1500 / -1695 / -1825`（如 gen9ou、gen9doublesou）。

**两种格式的实测内容**：

1. **usage `.txt`**（如 `…/2026-07/gen9ou-0.txt`）——纯文本表，头部含 **`Total battles: 654262`**、`Avg. weight/team: 1.000`，正文为 `Rank | Pokemon | Usage % | Raw | % | Real | %` 表（榜首 Great Tusk 28.18% / Raw 368,780）。另 `gen9zu-0.txt` 头部为 `Total battles: 5773`。**该 txt 只给物种使用率，不含招式/道具明细。**["https://www.smogon.com/stats/2026-07/gen9ou-0.txt"]

2. **chaos `.json`**（如 `…/2026-06/chaos/gen9nfe-1500.json`）——**结构实测**：
   ```
   {"info":{"metagame":"gen9nfe","cutoff":1500,"cutoff deviation":0,"team type":null,"number of battles":13},
    "data":{"Piloswine":{"Raw count":14,"Viability Ceiling":[...],
            "Abilities":{...},"Items":{...},"Spreads":{...},"Moves":{...},
            "Tera Types":{...},"Happiness":{...},"Teammates":{...},
            "Checks and Counters":{...},"usage":0.6157896}, ...}}
   ```
   **每只宝可梦都带 `Moves / Items / Abilities / Spreads(性格+努力)/ Teammates(队友共现)/ Tera Types` 的加权分布**——这正是「配招 / 配队」可用的**监督信号**；`"number of battles":13` 说明低档位样本很稀疏（该文件仅 13 场）。["https://www.smogon.com/stats/2026-06/chaos/gen9nfe-1500.json"]

**chaos 单文件体积（实测 `…/2026-07/chaos/` 目录）**：`gen3ou-0.json` 595,239 B(≈581 KiB)、`gen3ou-1500.json` 1,117,345 B(≈1.07 MiB)、`gen9ou-0.json` 2,888,425 B(≈2.75 MiB)、`gen9ou-1500.json` 5,328,097 B(**≈5.08 MiB**)、`gen9nationaldex-1500.json` 6,966,854 B(≈6.64 MiB)、`gen9championsvgc2026regmb-1500.json` 7,006,097 B(**≈6.68 MiB，最大**)。→ **单格式单档位 ≈ 0.6–7 MB**，全部下载也在百 MB 量级。["https://www.smogon.com/stats/2026-07/chaos/"]

**更新频率**：**每月**；目录创建日期基本落在**次月 1–3 日**（如 `2026-05/` 01-Jun-2026、`2026-06/` 01-Jul-2026、`2026-07/` 01-Aug-2026）。2024、2025 全年、2026 全年逐月均在。["https://www.smogon.com/stats/"]

> 结论：**chaos JSON = 现成的「配招/配队」监督信号**，无需解析对局，覆盖全部主要 tier；代价极低（MB 级、每月一份）。但它**是聚合统计，不是逐场数据**——没有对局时序、没有单场胜负标签。

---

### 1.3 官方仓库与官方数据（数据源 #5 / #6）

- **官方服务器仓库** `github.com/smogon/pokemon-showdown`（实测：**网页抓取被 robots.txt 拦截**，改用 raw README）：定位为 **MIT 授权的对战模拟器 + 命令行工具 + 网站服务器 + Web API**，模拟 **Gen1–Gen9** 单打/双打/三打。README 指向客户端仓库（含 `WEB-API.md`）与 **Dex 仓库** `https://github.com/Zarel/Pokemon-Showdown-Dex`。**README 未提及托管任何 replay 语料。**["https://raw.githubusercontent.com/smogon/pokemon-showdown/master/README.md"]
- **官方静态数据文件** `https://play.pokemonshowdown.com/data/`（实测成功，2026-10-02 更新）：目录含 `sets/`、`text/`，以及 `pokedex.json`(511.89 KiB) / `moves.json`(254.88 KiB) / `learnsets.json`(3.04 MiB) / `abilities.js`(25.81 KiB) / `items.js`(66.48 KiB) / `formats.js`(156.2 KiB) / `teambuilder-tables.js`(15.03 MiB) / `typechart.js` 等。**多为 `.js` 模块，少数 `.json`**。["https://play.pokemonshowdown.com/data/"]
- **官方是否提供大数据下载渠道（2024–2026 现状）**：**否。** 未发现官方「整月/整年 replay 打包下载」入口；公开 replay 只能经 §1.1 的逐场 JSON + search API 获取。PokéAgent 官方亦直言：第三方在 HF 维护 curated 数据集，是为了「**spare Showdown download requests**」——反证官方无批量通道、且不宜大量直连爬取。["https://pokeagent.github.io/track1.html"]

> 对 ER 的提示：官方 `/data/` 与 Dex 是**原版（Gen1–9）**数据，**不是 ER 数据**；ER 已有自己的权威数据源 `ER-source/gameDataV2.65beta.json`（见项目 `AGENTS.md`）。故官方数据文件对 ER 内容 **无直接价值**，仅可当 schema 参照。

---

### 1.4 社区大规模数据集（数据源 #7–#13）

**Metamon**（仓库 `UT-Austin-RPL/metamon`，论文 arXiv 2504.04395）：
- `jakegrigsby/metamon-raw-replays`：Parquet，**1.83M 行**，列 `id/format/players/log/uploadtime/formatid/rating`；README 述「**2.7M Battles**」的 curated replay 集，格式为 **Gen1–4 OU/NU/UU/Ubers + Gen9 OU**，持续更新（`v6` = 截至 **2026-05-19**）。["https://huggingface.co/datasets/jakegrigsby/metamon-raw-replays","https://raw.githubusercontent.com/UT-Austin-RPL/metamon/master/README.md"]
- `jakegrigsby/metamon-parsed-replays`：**总大小 28.5 GB**，7 个文件（`gen1ou…gen9ou.tar.gz` + `revealed_teams.tar.gz` + `replay_stats.tar.gz`）；README 述「**5.3M Trajectories**」（RL 可用轨迹）；文件名内嵌 **ELO 与 WIN/LOSS**（如 `gen1nu-2049363853_1022_…_02-01-2024_WIN.json.lz4`）；许可证 **cc-by-nc-4.0**。附 `revealed_teams`（**部分揭示**的队伍）与 `replay_stats`（队伍/阵容频率统计，用于 team prediction）。["https://huggingface.co/datasets/jakegrigsby/metamon-parsed-replays"]
- 自对弈集 `jakegrigsby/metamon-parsed-pile`：`pac-base` 11M / `pac-exploratory` 7M / `pac-tauros` 4M 轨迹（**非人类对局**，用于 RL 提升）。["https://raw.githubusercontent.com/UT-Austin-RPL/metamon/master/README.md"]
- 队伍集 `jakegrigsby/metamon-teams`：`competitive`(<30)、`gl_05_26`（gen3 107k / gen9 139k…）、`hl_05_26`（高分段子集）。["https://raw.githubusercontent.com/UT-Austin-RPL/metamon/master/README.md"]
- ⚠️ 口径存在**版本差异**：Metamon 官网（`metamon.tech`，经检索片段）述「**475k human demonstrations**」；PokéAgent 页述「**>3.5M 全对局轨迹**」；HF README 述「**5.3M 轨迹**」。三者对应不同版本/口径（v0 论文版 ≈1M numpy；v1–v6 逐步扩充并新增 Gen9）。引用时应带版本号。

**PokéChamp**（仓库 `sethkarten/pokechamp`，论文 arXiv 2503.04094）：
- `milkkarten/pokechamp`（实测成功）：**default 2.13M 行 / train 1.92M 行**；列 `text/month_year/gamemode/elo/battle_id`；size 标签 `1M-10M`。README 述「**over 3 million** competitive battles, filtered to **2 million clean**（1.9M train / 213K test）」，**37+ 格式（Gen1–9）**，**Elo 1000–1800+**，时间跨度 **2024–2025**。附 `battle_translate.py`（把 raw log 转训练数据）。["https://huggingface.co/datasets/milkkarten/pokechamp"]

**VGC-Bench**（论文 arXiv 2506.10326）：
- `cameronangliss/vgc-battle-logs`（实测成功）：**88,905 场日志**（从 Showdown replay 库爬得）→ **~177,810 轨迹**（每场 2 视角）→ **~1,474,324 转移**；**总大小 630 MB**；**MIT**；仅 **Gen9 Champions 4 个格式（Reg M-A / M-B，含 BO3）**，**全部为 OTS（公开队伍表）**，故**含完整队伍**。附 `scrape_logs.py / logs2trajs.py / pretrain.py`。旧 SV 日志归档在 `vgc-battle-logs-sv`。["https://huggingface.co/datasets/cameronangliss/vgc-battle-logs"]

**PokéAgent Challenge**（`pokeagent.github.io/track1.html`）：官方聚合页，明确「Showdown 让 **millions of competitive battles** 公开可得」，并维护 `pokechamp`(2M, 2024–2025) / `metamon-raw-replays`(1.8M, 2014–2025) / `metamon-parsed-replays`(>3.5M 轨迹) / `teams` / `usage-stats` 五个数据集入口；比赛已收官（NeurIPS 2025）。覆盖格式：Gen1OU–Gen4OU、Gen9OU、Gen9 VGC Reg I。["https://pokeagent.github.io/track1.html"]

---

## 2. 每个数据源可提取的训练信号

| 数据源 | 队伍(物种) | 完整配招 | 招式 | 道具 | 特性 | 对局时序 | 胜负标签 | 使用率/先验 |
|--------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Showdown replay JSON | ✅ preview 全暴露（OTS 含完整） | ⚠️ 仅 OTS | ⚠️ 仅已使用 | ⚠️ 仅已揭示 | ⚠️ 仅已触发 | ✅ 逐回合 | ✅ `\|win\|` | — |
| Metamon parsed-replays | ✅（+revealed_teams） | ⚠️ 预测补全 | ⚠️/✅ | ⚠️/✅ | ⚠️/✅ | ✅ 逐回合 | ✅ 路径含 WIN/LOSS | ✅ replay_stats |
| Metamon raw-replays | ✅ preview | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ✅ 原始 log | ✅（在 log 内） | — |
| PokéChamp | ✅ preview | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ✅ 原始 log（含 elo/month 元数据） | ✅（在 log 内） | ✅ 分档 elo |
| VGC-Bench | ✅ **OTS 完整** | ✅ **OTS 完整** | ✅ 完整 | ✅ 完整 | ✅ 完整 | ✅ 转轨迹(1.47M) | ⚠️（脚本可推） | — |
| Smogon chaos JSON | ✅ `Teammates` 权重 | ✅ `Moves`+`Items`+`Abilities`+`Spreads` 权重 | ✅ | ✅ | ✅ | ✖ | ✖ | ✅ `usage`/`Raw count` |
| Smogon usage txt | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✅ 物种使用率/档位 |
| 官方 `/data/` | ✖ | ✖ | ✖（招式字典） | ✖（道具字典） | ✖ | ✖ | ✖ | ✖（静态事实表） |

要点：
- **要「队伍特征 + 胜负标签 + 时序」→ 选 replay 语料**（Metamon / PokéChamp / VGC-Bench）。
- **要「招式/道具/特性/队友的监督分布」→ 选 Smogon chaos JSON**（现成、免解析）。
- **要「完整配招的监督信号」→ 只有两条路**：OTS 格式 replay（VGC-Bench），或 chaos JSON 的 `Moves/Items/Abilities/Spreads`。

---

## 3. 数据质量与解析成本

**3.1 胜负标签**：可直接用。日志末尾 `|win|<player>` 给出胜者，另一玩家即负者；Metamon 更把 WIN/LOSS 写进文件名。→ **干净的二分类监督**，无需额外标注。["https://replay.pokemonshowdown.com/gen9ou-2688037817.json","https://huggingface.co/datasets/jakegrigsby/metamon-parsed-replays"]

**3.2 可提取内容的边界**：
- ✅ 可得：双方物种（preview）、逐回合动作序列、已揭示的招式/道具/特性、Tera、天气/场地/钉子等状态、回合数、双方 Elo、胜者。
- ⚠️ 不可靠：完整 4 招 / 努力值 / 未触发的道具特性。**这是「配招监督」的主要缺口。** Metamon 用 `revealed_teams` + team-prediction 部分补全；VGC-Bench 靠 OTS 规避。

**3.3 解析成本**：**低——但应复用现成解析器，不要自写。**
- 日志是行式协议（`|move|`、`|-damage|`…），有规范 `sim/SIM-PROTOCOL.md`。["https://raw.githubusercontent.com/smogon/pokemon-showdown/master/README.md"]
- 现成工具：`metamon` 的 replay_parser、`poke-env`（学术工作通用 Python 接口）、`pokechamp` 的 `battle_translate.py`、VGC-Bench 的 `logs2trajs.py`。["https://huggingface.co/datasets/cameronangliss/vgc-battle-logs","https://pokeagent.github.io/track1.html"]

**3.4 已知陷阱**（来自 Metamon README 的「Server/Replay Sim2Sim Gap」）：
1. **观战者视角 ≠ 玩家视角**——replay 省略了服务器只发给玩家的信息，需重建/预测；Metamon 明言「replay 数据**最好当作预训练数据**（offline-to-online 微调的第一步）」。
2. 揭示不完整（§3.2）。
3. **协议跨代漂移**（Tera、Champions 等机制），解析器需分代处理。
4. private 场次不可见；replay 会过期/被删。
5. **直连爬取 API 不礼貌且有速率风险**——优先用 HF 镜像（PokéAgent 明确建议）。["https://raw.githubusercontent.com/UT-Austin-RPL/metamon/master/README.md","https://pokeagent.github.io/track1.html"]

---

## 4. 结论：2024–2026 哪个数据源最值得用作训练数据

**按「配队/配招神经网络」的目标，推荐优先级：**

1. **🥇 Smogon chaos JSON（首要，性价比之王）**：`smogon.com/stats/<YYYY-MM>/chaos/<fmt>-<cutoff>.json`。**直接是监督信号**（Moves/Items/Abilities/Spreads/Teammates 权重），**零解析成本**，**单文件 0.6–7 MB**，每月更新，2026-07 最新。适合训练「给定部分队伍 → 预测招式/道具/队友」的配队模型。
2. **🥈 若需「对局时序 + 胜负标签」**：优先 **VGC-Bench**（630 MB / 1.47M 转移 / MIT / OTS 含完整队伍，最小最快）→ 需要更大规模再上 **Metamon-parsed-replays**（28.5 GB / 5.3M 轨迹）或 **PokéChamp**（2.13M 行）。
3. **❌ 不要**自己直连 replay API 大规模爬取（无官方批量通道、速率风险、需自己解析）。

**规模 vs 获取成本对照**：
- chaos JSON：**分钟级、MB 级、免解析**（成本最低、信号密度最高）。
- VGC-Bench：**630 MB**，含爬取/转轨迹/预训练脚本。
- PokéChamp：**2.13M 行（HF 一见即下）**。
- Metamon-raw：**1.83M 行 / 2.7M 场**。
- Metamon-parsed：**28.5 GB / 5.3M 轨迹**（最重，但最「即训」）。
- 全站 API 爬取：**不推荐**。

---

## 5. ER（Elite Redux）迁移可用性专章（回答验收要求）

**5.1 前提事实：ER 无原生对战语料。**
- Elite Redux 是 GBA 改版（基版绿宝石 BPEE），**不在 Showdown 环境内**；本轮检索**未发现** ER 版 Showdown 服务器、亦未发现任何 ER battle-log 数据集（检索命中的 "Elite Redux" 均为 GBA 改版页面：`eliteredux.net`、`retro-games.org`、`pokeharbor.com` 等）。["https://eliteredux.net/game-gallery/"]
- 因此**不存在「ER 原版大规模对战数据」**；本文所有数据源都是**原版/官方 Showdown**数据。

**5.2 能迁移什么 / 不能迁移什么。**

| 维度 | Showdown/Smogon 原版数据 | 对 ER 的价值 |
|------|--------------------------|--------------|
| 方法论 / 架构 | 现成的配队模型、value net、行为克隆范式；开源解析器与训练脚本 | ✅ **直接可复用** |
| 监督信号「格式」 | Smogon chaos JSON 的 `Moves/Items/Abilities/Spreads/Teammates` 结构 | ✅ **可照搬 schema**，在 ER 侧用自有数据产出同类统计 |
| 物种 / 招式 / 道具先验 | Gen1–9 原版物种、招式、道具 | ⚠️ **仅有交集部分**可迁移；ER 自创内容不在其中 |
| 特性 | 原版特性；**ER 为「双特性体系」（abis 池 + 3 天性 inns）** | ❌ 基本不可迁移（ER 1034 特性多为自创/改版） |
| 对战时序 | 逐回合 replay | ⚠️ 可训练「通用战斗状态编码器」，但 ER 机制（双特性/自创招）会造成分布漂移 |
| 胜负标签 | ✅ 干净 | ✅ 可作通用「好队/好线」的预训练监督 |

**5.3 结论（原版数据迁移到 ER 的可用性）：有限，且是「预训练/先验/方法论」，不是 ER ground truth。**
- **可用的三条路**：
  1. **预训练 + 微调**：用 Metamon-parsed / PokéChamp 预训练一个**通用战斗状态/队伍组合编码器**，再用 ER 自有数据微调。
  2. **照搬 Smogon chaos 的监督 schema**：ER 侧已具备 `gameDataV2.65beta.json`（1907 物种/1034 特性/1032 招式/929 道具）与自建对战产物；按同一 JSON 结构产出一份 **ER chaos 统计**，即可复用配队模型的训练管线。
  3. **招式/道具字典仅作 schema 参照**（`play.pokemonshowdown.com/data/`），**不要当 ER 内容**。
- **不要做**：把 Showdown/Smogon 的 tier、使用率、胜率当 ER 的 ground truth（ER 的规则、特性、tier 与原版差异巨大）。
- **诚实缺口**：ER 若要有「配队/配招」的**自监督语料**，只能自建——即需要 **ER 可用的对战模拟环境或 ER 实机对局采集**（例如基于 ER gameData 的本地模拟器、或脚本化自对弈）。**本题的网络检索未能找到任何现成 ER 对战数据。**

> ⚠️ 未验证项（留待后续）：**是否存在 ER 的 Showdown fork/私服**（本轮仅常规网络检索，未穷尽 GitHub Issues/Discord）。若存在，它将是 ER 数据的**第一优先**来源——但在核实前不应假设其存在。

---

## 6. 访问记录（实测清单：URL / 结果 / 看到什么）

| # | URL | 结果 | 看到的要点 |
|---|-----|------|-----------|
| 1 | `https://replay.pokemonshowdown.com/search.json?format=gen9ou&page=1` | ✅ 成功 | JSON 数组 50 条；字段 uploadtime/id/format/players/rating/private/password；最新 id 时间戳为 fetch 当时 |
| 2 | `https://replay.pokemonshowdown.com/gen9ou-2688037817.json` | ✅ 成功 | 单场 JSON：id/format/players/log/uploadtime/views/formatid/rating/private/password；log 含 `\|poke\|`、逐回合、`\|win\|` |
| 3 | `https://www.smogon.com/stats/` | ✅ 成功（2026-10-07，禁用缓存） | 目录 2014-11 … **2026-07**（无 2026-08/09） |
| 4 | `https://www.smogon.com/stats/2026-07/` | ✅ 成功 | 约 60 格式族 × 多档位 `.txt` + 子目录 chaos/leads/metagame/monotype/moveset |
| 5 | `https://www.smogon.com/stats/2026-07/chaos/` | ✅ 成功 | 各格式 chaos JSON 及**字节大小**（0.58–6.68 MB） |
| 6 | `https://www.smogon.com/stats/2026-07/gen9ou-0.txt` | ✅ 成功 | `Total battles: 654262`；Rank/Pokemon/Usage %/Raw/%/Real/% 表 |
| 7 | `https://www.smogon.com/stats/2026-06/chaos/gen9nfe-1500.json` | ✅ 成功 | chaos JSON 完整结构（info/data；Moves/Items/Abilities/Spreads/Teammates…；`number of battles:13`） |
| 8 | `https://play.pokemonshowdown.com/data/` | ✅ 成功 | 官方数据目录（pokedex.json/moves.json/learnsets.json/…；2026-10-02 更新） |
| 9 | `https://raw.githubusercontent.com/smogon/pokemon-showdown/master/README.md` | ✅ 成功 | 服务器仓库定位（MIT、sim 库、Gen1–9、指向 WEB-API 与 Dex 仓库） |
| 10 | `https://github.com/smogon/pokemon-showdown` | ❌ **失败** | 被 robots.txt 拦截（"Only URLs from Search are allowed"）→ 改用 raw README |
| 11 | `https://huggingface.co/datasets/jakegrigsby/metamon-parsed-replays` | ✅ 成功 | 28.5 GB / 7 文件 / v6=至 2026-05-19 / WIN-LOSS 文件名 / cc-by-nc-4.0 |
| 12 | `https://huggingface.co/datasets/jakegrigsby/metamon-raw-replays` | ✅ 成功 | 1.83M 行 Parquet；列 id/format/players/log/uploadtime/formatid/rating |
| 13 | `https://huggingface.co/datasets/milkkarten/pokechamp` | ✅ 成功 | 2.13M 行（train 1.92M）/ 列含 gamemode,elo,month_year / README 述 3M→2M/37+ 格式/2024-2025 |
| 14 | `https://huggingface.co/datasets/cameronangliss/vgc-battle-logs` | ✅ 成功 | 88,905 场 / 177,810 轨迹 / 1,474,324 转移 / 630 MB / MIT / OTS |
| 15 | `https://pokeagent.github.io/track1.html` | ✅ 成功 | 数据集汇总表（pokechamp 2M、metamon-raw 1.8M、parsed >3.5M、teams、usage-stats）；"millions of battles" |
| 16 | `https://raw.githubusercontent.com/UT-Austin-RPL/metamon/master/README.md` | ✅ 成功 | 两数据集规模（2.7M 场 / 5.3M 轨迹）、自对弈集、队伍集、Sim2Sim Gap 说明 |
| 17 | `https://huggingface.co/api/datasets?search=metamon` | ❌ 失败 | HF JSON API 不可抓取 |
| 18 | `https://huggingface.co/datasets?search=pokemon+showdown` | ❌ 失败 | HF 搜索页不可抓取 → 改用 HF 数据集页直连 + `general_search` |
| 19 | `https://metamon.tech/` | ⚠️ 部分 | 返回体含超限图片告警、无正文；"475k demonstrations" 数字来自检索片段，非直接阅读 |
| 20 | `https://cdn.jsdelivr.net/gh/sethkarten/pokechamp@main/README.md` | ❌ 失败 | 单次抓取失败（PokéChamp 细节改由 #13 数据集页核实） |
| 21 | `general_search`（Elite Redux Showdown 服务器 / ER 对战数据） | ✅ 检索完成 | **未发现** ER Showdown 服务器或 ER battle-log 数据集 |

---

## 7. 未能验证 / 风险登记（诚实登记）

1. **GitHub 网页抓取被 robots 拦截**（#10）——已用 `raw.githubusercontent.com` 替代；`github.com` 上的目录浏览/Issue 未核。
2. **HF JSON API 与搜索页不可抓**（#17/#18）——已用具体数据集页替代；未穷举 HF 上全部相关数据集（可能还有小众 upload）。
3. **`metamon.tech` 未读到正文**（#19）——"475k" 来自检索片段，与 HF README 的 "5.3M" 存在版本口径差；引用需带版本号。
4. **Smogon `moveset/` 与 `metagame/` 子目录未打开**——仅确认目录存在；其 `.txt` 细分口径未核（预计 moveset 是按宝可梦的招式细分文本）。
5. **Showdown 全站 replay 总量未获官方数字**——只有第三方下界（≈3.8M 场）与「millions」口径。
6. **官方服务器仓库的 `test/` 样例 replay 未打开**——「是否有官方样例 replay」未核实。
7. **ER 是否有 Showdown fork/私服**——本轮常规检索**未发现**，但未穷尽（GitHub Issues/Discord 未查）；在核实前不假设存在。
8. **pkmn 生态（可能存在的 Smogon 统计 npm/镜像，如 `pkmn.github.io/smogon`）未实测**——仅作为潜在便利镜像提及，未验证。

---

## 8. 引用 URL 汇总

**官方 / 一手**
- https://replay.pokemonshowdown.com/
- https://replay.pokemonshowdown.com/search.json?format=gen9ou&page=1
- https://replay.pokemonshowdown.com/gen9ou-2688037817.json
- https://replay.pokemonshowdown.com/gen9doublesou-2574719492
- https://www.smogon.com/stats/
- https://www.smogon.com/stats/2026-07/
- https://www.smogon.com/stats/2026-07/chaos/
- https://www.smogon.com/stats/2026-07/gen9ou-0.txt
- https://www.smogon.com/stats/2026-06/chaos/gen9nfe-1500.json
- https://play.pokemonshowdown.com/data/
- https://raw.githubusercontent.com/smogon/pokemon-showdown/master/README.md
- https://github.com/smogon/pokemon-showdown（robots 拦截）
- https://github.com/Zarel/Pokemon-Showdown-Dex（README 引用）

**社区数据集 / 论文**
- https://huggingface.co/datasets/jakegrigsby/metamon-raw-replays
- https://huggingface.co/datasets/jakegrigsby/metamon-parsed-replays
- https://huggingface.co/datasets/jakegrigsby/metamon-parsed-pile
- https://huggingface.co/datasets/jakegrigsby/metamon-teams
- https://huggingface.co/datasets/milkkarten/pokechamp
- https://huggingface.co/datasets/cameronangliss/vgc-battle-logs
- https://pokeagent.github.io/track1.html
- https://raw.githubusercontent.com/UT-Austin-RPL/metamon/master/README.md
- https://github.com/UT-Austin-RPL/metamon
- https://github.com/sethkarten/pokechamp
- arXiv 2504.04395（Metamon）/ arXiv 2503.04094（PokéChamp）/ arXiv 2506.10326（VGC-Bench）/ arXiv 2603.15563（PokéAgent Challenge）

**ER 相关（检索结果，均非对战语料）**
- https://eliteredux.net/game-gallery/

---

*调研人：主 Agent ｜ 日期：2026-10-07 ｜ 性质：只读检索 + 本文件为唯一新增产物*
