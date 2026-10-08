# 开源工具与社区项目检索：Pokémon Showdown / 宝可梦对战领域

> 用途：为「用神经网络拟合宝可梦配队决策」项目（Elite Redux 配队工具 NN 增强）做前期调研。
> 检索日期：2026-10-07
> 检索方式：`general_search` 多关键词并行检索 + 通过 GitHub REST API（`api.github.com/repos/...`、`.../search/repositories`）逐条核验仓库存在性与 star/forks/最近推送时间。
> 数据口径：下文 star / forks / 「最近推送」均为 **2026-10-07（北京时间）经 GitHub REST API 实测返回**，非估算、非编造。GitHub 网页对自动抓取有 robots.txt 限制，故以官方 API 为准。
> 标注约定：凡未取得可靠来源的字段，一律标注「待核实」，不臆测。

---

## 一、对战 Bot

### 1. pmariglia/foul-play（原 pmariglia/showdown）
- **名称**：Foul Play（旧仓库名 `showdown`，已重命名）
- **类型**：对战 Bot / 搜索型 Agent（MCTS）
- **URL**：https://github.com/pmariglia/foul-play （旧地址 https://github.com/pmariglia/showdown 会 301 跳转）
- **一句话结论**：384★ / 223 fork，Python + Rust，最近推送 2026-10-05；自研 `poke-engine` 引擎 + 并行化 DUCT-MCTS 搜索，在 Gen1–8 单打与 Random Battles 长期保持高排名，是当前公认最强开源搜索型 Bot 之一。
- **对我们的参考价值**：①「对手未知信息 → 概率化确定化（determinization）」的整套做法，可直接迁移到 ER 的「特性池 n 选 1 / 3 固定天性」推断——因为 ER 的候选空间虽与官方不同，但同样是有限离散分布，非常适合用使用率/先验分布做加权采样。②其 `StateMutator`（可逆状态指令）架构说明「高效状态回滚」是搜索式配队评估的性能命门，若我们未来在配队侧做「多组合试算」，可直接借鉴。

### 2. hsahovic/poke-env
- **名称**：poke-env
- **类型**：RL / 规则 Bot 的 Python 接口与环境（Agent 训练框架）
- **URL**：https://github.com/hsahovic/poke-env （文档 https://poke-env.readthedocs.io/ ）
- **一句话结论**：524★ / 147 fork，Python，最近推送 2026-10-06，仍在活跃维护（PyPI 最新 0.12.0，2026-03-10 发布）；是绝大多数学术向宝可梦 AI 的公共底座，内置 RandomPlayer / MaxBasePowerPlayer / SimpleHeuristicsPlayer 三种基线，并支持自定义 Teambuilder 与 Stable-Baselines3 动作掩码。
- **对我们的参考价值**：①「**自定义 teambuilder**」是官方文档里的显式扩展点：把 ER 的规则校验（21 属性、-ate 转换、天性锁定）包成 poke-env 的 teambuilder，即可复用整套自对弈数据管线，无需自己造环境。②它把 Showdown 协议解析成结构化 `Battle` 对象，这份「状态 → 向量」的字段清单可作我们 NN 特征工程的参照基线。

### 3. pkmn/engine（libpkmn）
- **名称**：pkmn/engine（C/JS/Zig 多语言对战模拟内核，libpkmn）
- **类型**：高性能对战模拟引擎
- **URL**：https://github.com/pkmn/engine
- **一句话结论**：377★ / 14 fork，Zig（Python/C/JS 绑定），最近推送 **2026-10-07**（当天仍在提交）；定位为「最小、完整、面向性能优化的宝可梦对战模拟引擎」。
- **对我们的参考价值**：①自对弈/搜索的数据吞吐瓶颈几乎全在模拟器。官方 Showdown 单线程约 2 万步/秒量级，而同类引擎宣称快约 1000×（见下方 Oak 条目与其引用），这意味着「百万级 MCTS 迭代」从不可行变为数秒级。②若我们后续要做配队组合的大规模试算（评估 18 战术流派 × 特性组合的胜率），这是唯一现实可行的加速底座。**注意**：它只实现官方世代机制，ER 的特性池/21 属性/-ate 等自定义规则需自行移植，工作量待评估。

### 4. pokemon-labs/oak（Smogon 帖中写为 lab-oak/oak）
- **名称**：Oak
- **类型**：对战 + 配队 NN 训练工具包（RBY 完美信息搜索）
- **URL**：https://github.com/pokemon-labs/oak （帖内旧链 `lab-oak/oak` 会跳转）
- **一句话结论**：6★ / 1 fork，C++（Python 训练脚本），最近推送 2026-10-06；「Python package for perfect-info search in Pokemon RBY OU」，提供快速模拟器 + Exp3/UCB 搜索 + 小型 NN 值/策略头 + 自对弈数据生成 + **PPO 队伍构建**。
- **对我们的参考价值**：**本清单里与「神经网络拟合配队决策」最贴近的一个**。①它明确把「队伍构建」当作 RL 问题（先用 rollout 生成队伍作为噪声，再用 PPO 学 build network），并已在小域（1v1）验证可行——这正是我们想要的「用 NN 生成/评分队伍」的可运行范例。②它给出 NN 输入编码（one-hot 表格编码 → MLP → 值 + policy head）与数据压缩方案（5000 万局面约 3GB），可直接对照我们的特征与存储设计。③它坦诚「配队部分潜力有限（无搜索、仅 policy rollout）」，这提示我们：纯生成式配队弱，**「生成 + 搜索评估」混合**更可能是正确路线。

### 5. pmariglia/poke-engine
- **名称**：poke-engine
- **类型**：对战搜索引擎（Foul Play 的引擎，正在 Rust 重写）
- **URL**：https://github.com/pmariglia/poke-engine
- **一句话结论**：52★ / 28 fork，Rust，最近推送 2026-10-05；支持在宝可梦状态树上搜索（StateMutator 可逆指令架构）。
- **对我们的参考价值**：适合作为「配队评估器」的思路来源——把一套配队视为初始状态，用搜索跑 N 局得胜率作为 fitness，是「NN 推荐 + 搜索验证」闭环里验证器部分的现成参考实现。

### 6. sethkarten/pokechamp
- **名称**：PokéChamp
- **类型**：LLM + minimax 对战 Agent
- **URL**：https://github.com/sethkarten/pokechamp （论文 https://arxiv.org/html/2503.04094v1 ）
- **一句话结论**：185★ / 32 fork，Python，最近推送 2026-03-11；ICML 2025 spotlight 论文官方仓库，用 LLM 替换 minimax 的三个模块（动作采样、对手建模、价值函数），Gen9 OU 下对最强规则 Bot 胜率 84%、对前代 LLM Bot 76%。
- **对我们的参考价值**：①它用 Showdown 统计（招式池、EV、道具使用率）做**隐藏信息先验**——与 ER「特性池 n 选 1」的先验建模同构，方法论可直接抄。②它展示了「用外部知识约束搜索空间」的工程化写法，可指导我们把 18 战术流派模板作为搜索剪枝的先验。

### 7. UT-Austin-RPL/metamon
- **名称**：Metamon
- **类型**：离线 RL / Transformer 对战 Agent + 数据集平台
- **URL**：https://github.com/UT-Austin-RPL/metamon （项目页 https://metamon.tech/ ，论文 arXiv:2504.04395）
- **一句话结论**：142★ / 36 fork，Python，最近推送 2026-07-23；把 Showdown 十年级别的人类回放**重建为第一人称视角**离线 RL 数据集（47.5 万+ 演示），训练最大 2 亿参数 Transformer actor-critic，在 Gen1–4 OU 打进活跃玩家前 10%。
- **对我们的参考价值**：①**「观众视角回放 → 第一人称可训练轨迹」的重建管线**是数据侧最值得复用的资产；我们若想从 ER 对战录像里学配队偏好，同样面临「回放不含决策者私有信息」的问题，其解法可直接借鉴。②它证明「无搜索、纯序列模型」也能达到人类水平，对我们的 NN 路线是强正例。

### 8. cameronangliss/vgc-bench
- **名称**：VGC-Bench
- **类型**：多智能体 RL 基准 + 人类对局数据集（VGC 双打）
- **URL**：https://github.com/cameronangliss/vgc-bench （数据集 https://huggingface.co/datasets/cameronangliss/vgc-battle-logs ）
- **一句话结论**：53★ / 19 fork，Python，最近推送 2026-07-25；基于 poke-env + PettingZoo，提供 70 万+ VGC 对局日志与 11 种基线（启发式 / LLM / 行为克隆 / 自对弈 / fictitious play / double oracle），论文明确指出**团队配置空间约 10^139**、且「单一队伍设定下很强、扩展到多队伍就退化」。
- **对我们的参考价值**：①它把「**配队泛化**」正式定义为一个评测维度（cross-play 未见队伍、可被利用性 exploitability），这正是「NN 配队决策」要回答的核心问题，评测协议可直接搬运。②其论文的「未来方向」明确列出 **Team Building**（用强 Agent 评估候选队伍并提供奖励信号）与**对手建模**，与我们项目目标几乎逐条对应。

### 9. leolellisr/poke_RL
- **名称**：poke_RL
- **类型**：RL 教学/实验代码库
- **URL**：https://github.com/leolellisr/poke_RL
- **一句话结论**：17★ / 3 fork，Jupyter Notebook，最近推送 2024-11-29；收录传统 RL 与深度 RL 方法在 Showdown 上的实现。
- **对我们的参考价值**：适合作为「快速复现 + 对照实验」的入门代码库，可用来在我们自建环境上做算法选型的小规模 A/B，而不必从头写训练循环。

### 10. MatteoH2O1999/alphaPoke
- **名称**：alphaPoke
- **类型**：RL 对战 Bot
- **URL**：https://github.com/MatteoH2O1999/alphaPoke
- **一句话结论**：9★ / 0 fork，Python，最近推送 2024-08-19；「A pokémon showdown battle-bot project based on reinforcement learning techniques」。
- **参考价值**：中小体量 RL bot 的完整工程样例，可对照其状态/动作空间设计；活跃度一般，仅作参考不作依赖。

### 11. dramamine/leftovers-again
- **名称**：leftovers-again
- **类型**：对战 Bot 客户端平台
- **URL**：https://github.com/dramamine/leftovers-again
- **一句话结论**：77★ / 18 fork，JavaScript，最近推送 2021-02-27（**已基本停更**）；「Pokemon Showdown - AI/Bot Client Platform」。
- **参考价值**：其「Bot 平台化」（多策略插件式挂载）的架构对我们要做的多 Agent 并行测试有借鉴意义；但代码老旧，不建议直接作为依赖。

### 12. rameshvarun/showdownbot
- **名称**：showdownbot
- **类型**：对战 AI（历史项目）
- **URL**：https://github.com/rameshvarun/showdownbot
- **一句话结论**：71★ / 27 fork，JavaScript，**已 archive（2023-04-22 最后推送）**；早期经典 Showdown 对战 AI。
- **参考价值**：仅作算法史与思路参考（启发式评估函数写法），不适合作为活跃依赖。

### 13. spktrm/meloetta
- **名称**：meloetta
- **类型**：对战客户端 + RL 库
- **URL**：https://github.com/spktrm/meloetta
- **一句话结论**：18★ / 1 fork，JavaScript/Python，**已 archive（2023-07-09 最后推送）**；「A Pokémon Battle Client and Reinforcement Learning Library ... written in Python」。
- **参考价值**：与 poke-env 类似定位的历史替代品，可用于交叉验证 API 设计；已归档，不作依赖。

### 14. ⚠️ insunity/Pokemon-Showdown-bots（**经核实不存在**）
- **名称**：insunity/Pokemon-Showdown-bots
- **类型**：—
- **URL**：https://github.com/insunity/Pokemon-Showdown-bots
- **一句话结论**：**GitHub API 返回 404（Not Found）**；用户 `Insunity`（Insan Sharif）账号存在，但 `public_repos = 1` 且其中**不含**该仓库名。推断：仓库从未公开、已删除或已改名——**本条目无法核实，建议从候选清单移除**。
- **参考价值**：无（不可访问）。若原任务中该名称来自某处二手引用，建议回溯其出处。

---

## 二、配队 / 配招推荐工具

### 1. smogon/pokemon-showdown（官方模拟器与数据核心）
- **名称**：Pokémon Showdown 服务端
- **类型**：官方对战模拟器 + 数据/校验核心
- **URL**：https://github.com/smogon/pokemon-showdown （命令行文档 https://mintlify.wiki/smogon/pokemon-showdown/cli/overview ）
- **一句话结论**：**5936★ / 3548 fork**，TypeScript，最近推送 **2026-10-07**（当天仍在提交）；提供 CLI：`simulate-battle`、`generate-team`、`validate-team`、`export-team`、`pack-team`、`start`（服务器）。是全生态的「单一事实源」。
- **对我们的参考价值**：①`validate-team` 是**现成的合法性校验范式**——ER 的规则（特性池 n 选 1、3 固定天性、21 属性、-ate）本质是一套自定义 validator，其「规则即数据 + 可插拔 format 定义」的写法值得照搬。②`pack-team` / `export-team` 定义了队伍文本的 **packed / JSON / teambuilder 三种序列化**，我们的配队工具若要导出/导入，应直接兼容该格式以便复用生态工具。③`simulate-battle` 的 stdin/stdout 设计便于被 Python 子进程调用，是「快速搭一个 ER 规则模拟器」的低成本起点。

### 2. smogon/damage-calc
- **名称**：Smogon Damage Calculator
- **类型**：官方伤害计算器（库 + Web）
- **URL**：https://github.com/smogon/damage-calc
- **一句话结论**：539★ / 504 fork，TypeScript，最近推送 2026-10-05；「Pokemon games damage calculator」，并支持 one-vs-all / all-vs-one 批量计算。
- **对我们的参考价值**：①配招推荐的核心打分函数（伤害区间、OHKO/2HKO 判定）可直接复用它，避免自研伤害公式出错；②其「批量计算」模式正是「某个宝可梦 vs 全队」类型的配招可行性扫描，UI 上也有现成交互可借鉴。

### 3. pkmn/smogon
- **名称**：pkmn/smogon
- **类型**：Smogon 数据分析 / 使用率数据的类型化封装
- **URL**：https://github.com/pkmn/smogon （数据站点 https://pkmn.github.io/smogon 、https://data.pkmn.cc ）
- **一句话结论**：50★ / 11 fork，TypeScript，最近推送 2026-10-06；「Wrapper around Smogon's analyses and usage statistics」，把 Smogon 分析页与使用率统计转成结构化 JSON。
- **对我们的参考价值**：①这是**「推荐逻辑」最需要的数据源接口**：招式的使用率、常见搭配（teammates）、克制关系（counters）都已在结构化数据里，我们的配招/配队推荐不必从零爬取。②它输出的 JSON 形态可直接作为 NN 的输入特征或规则引擎的权重表。

### 4. pkmn/randbats
- **名称**：pkmn/randbats
- **类型**：Random Battle 套装数据自动生成
- **URL**：https://github.com/pkmn/randbats （数据 https://data.pkmn.cc/randbats/ ）
- **一句话结论**：50★ / 15 fork，JavaScript，最近推送 **2026-10-07**；每小时同步 Showdown 子模块，为每种 Random Battle 格式**生成 10 万支队伍**并聚合出「每个宝可梦的可选招式/道具/特性及其出现概率」，输出到 `data.pkmn.cc`。
- **对我们的参考价值**：**方法学上极度对口**——它的核心就是「用大量采样把『随机池』变成**概率分布表**」。ER 的「特性池 n 选 1」完全可以用同一套 pipeline 处理：采样 → 统计各特性/天性的边际与联合分布 → 作为推荐与推断的先验。其数据还被 Showdown 伤害计算器、Showdex、Randbats Tooltip 消费，说明该 schema 已被生态验证。

### 5. doshidak/showdex
- **名称**：Showdex
- **类型**：Showdown 浏览器扩展（内嵌伤害计算器 + 套装推断）
- **URL**：https://github.com/doshidak/showdex （论坛主帖 https://www.smogon.com/forums/threads/showdex-an-auto-updating-damage-calculator-built-into-showdown.3707265/ ）
- **一句话结论**：207★ / 58 fork，TypeScript（React），最近推送 2026-09-14；Chrome 商店约 8 万用户、4.8 分；把伤害计算器直接嵌进对战界面并**随对战自动同步**，还内置 Smogon 页面/套装、特性/道具/招式说明。
- **对我们的参考价值**：**UI 展示的第一借鉴对象**。①它解决的核心体验问题是「对局中即时看到计算结果而不打断操作」——我们的配队工具同样要避免全屏弹窗，其「面板 / 战斗覆盖层（Battle Overlay）双模式」与移动端适配做法值得直接参考。②它有「自动换组（Auto-set switcher）」：当对手露出新招式/道具，就切换到包含该信息的可能套装——这与 ER「特性池 n 选 1」下**逐步收窄候选特性**的交互逻辑完全同构。③注意其已知短板：官方 issue 里用户反馈「感应不到的隐含信息（如未吃命玉伤害却没换掉命玉套装）」，提示我们做推断时要显式处理**隐含否定信息**。

### 6. Swepps/pokeautobuilder
- **名称**：pokeautobuilder
- **类型**：参数化自动配队工具
- **URL**：https://github.com/Swepps/pokeautobuilder
- **一句话结论**：10★ / 2 fork，C#，最近推送 2026-08-31；「A Pokémon team builder which can suggest you a team from a pool of Pokémon based on user-defined parameters」。
- **对我们的参考价值**：与「从候选池 + 用户约束出发给出队伍」的产品形态高度一致，可参考其**约束→候选→推荐**的参数建模方式（我们可用它对照 18 战术流派模板的约束表达）。

### 7. ensinho/pokemonTeamBuilder
- **名称**：pokemonTeamBuilder
- **类型**：Web 配队工具（含实时属性覆盖计算）
- **URL**：https://github.com/ensinho/pokemonTeamBuilder
- **一句话结论**：10★ / 2 fork，JavaScript（React + Firebase），最近推送 **2026-10-07**；「Fast Pokémon team builder with real-time type-coverage math, a full Pokédex with encounter maps ... and Showdown export」。
- **对我们的参考价值**：**「属性覆盖实时计算 + Showdown 导出」正是配队工具 UI 的最小可用闭环**；ER 有 21 个属性体系，其覆盖矩阵的交互呈现方式可直接借鉴。

### 8. DigitalFlow/Pokemon-Team-Builder
- **名称**：Pokemon Team Builder
- **类型**：基于 Smogon 数据的配队建议工具
- **URL**：https://github.com/DigitalFlow/Pokemon-Team-Builder
- **一句话结论**：6★ / 0 fork，C#，最后推送 2016-11-27（**长期停更**）；「Tool for making suggestions on pokemon to use for your team based on Pokemon GL and Smogon data」。
- **参考价值**：早期「用使用率/搭配数据做推荐」的实现样本，逻辑（协同度、覆盖补盲）对今天的设计仍有参考意义；代码老旧，仅作思路来源。

### 9. Geyserexe/BuilderBot
- **名称**：BuilderBot
- **类型**：特定格式自动构建队伍
- **URL**：https://github.com/Geyserexe/BuilderBot
- **一句话结论**：3★ / 2 fork，JavaScript，最近推送 2026-05-06；「A program to build teams for Pokemon Showdown in the gen8nationaldexag / gen8anythinggoes / gen7anythinggoes formats」。
- **参考价值**：「针对某一特殊规则集自动构建队伍」的小型完整案例——与我们要为 ER 单独定制规则集的处境相似，可参考它如何把格式规则编码进构建逻辑。

### 10. lambjw/BuilderAnalyzer
- **名称**：BuilderAnalyzer
- **类型**：队伍分析器
- **URL**：https://github.com/lambjw/BuilderAnalyzer
- **一句话结论**：3★ / 2 fork，JavaScript，最后推送 2020-01-05（**停更**）；「Analyzes Team Builders from Pokemon Showdown」。
- **参考价值**：**「队伍评分/评估」**这一子问题的早期实现，可用于对照我们要给配队打的分数维度（覆盖、速度线、抗性分布等）。

### 11. Smogon Dex 在线战略页（网站资源，非公开仓库）
- **名称**：Smogon Dex / Strategy Pokédex
- **类型**：配招/配队知识库（网站）
- **URL**：https://www.smogon.com/dex/ 、https://dev.smogon.com/
- **一句话结论**：Smogon 官方文档明确说明「Dex 中的 moveset 信息被玩家在组队时使用，也作为伤害计算器的输入」；但文档中提到的 `smogon/dex` 仓库经 API 查证**返回 404（不可公开访问）**，公开可用的结构化替代是 `pkmn/smogon`。
- **参考价值**：作为**「推荐逻辑的权威知识来源」**与文案/依据展示的引用源；但工程上应以 `pkmn/smogon` 的结构化数据为准。

---

## 三、数据分析项目

### 1. Smogon 使用率与 moveset 统计（官方数据发布）
- **名称**：Smogon Usage Stats / Moveset Stats
- **类型**：统计数据源（文本，月度发布）
- **URL**：https://www.smogon.com/stats/ （示例：https://www.smogon.com/stats/2025-09/moveset/gen3ou-1500.txt ）
- **一句话结论**：按月发布各分级的 usage / moveset / leads / metagame 统计，含招式使用率、性格与努力值分布、常见队友、克制表等（2025-09 仍正常更新）。
- **对我们的参考价值**：**配招推荐最直接的先验数据**，且其「按 Elo 分档（1500/1760 等）」的切分方式提示我们：不同水平玩家的配队偏好不同，NN 若要拟合「人类配队决策」，应把玩家水平作为条件变量而非混杂因子。

### 2. Metamon 回放数据集（Hugging Face）
- **名称**：metamon-parsed-replays / metamon-raw-replays
- **类型**：回放解析数据集（离线 RL 轨迹）
- **URL**：https://huggingface.co/datasets/jakegrigsby/metamon-parsed-replays 、https://huggingface.co/datasets/jakegrigsby/metamon-raw-replays
- **一句话结论**：`parsed-replays` 体积约 25.5GB、7 个分片（gen1–4 OU + gen9 OU + 队伍/统计元数据），由 Metamon 把 Showdown 观众视角回放**重建为第一人称轨迹**；另有 `revealed_teams`（每局被揭示的队伍）与 `replay_stats`（用于队伍预测的统计）。
- **对我们的参考价值**：①`revealed_teams` + `replay_stats` 正是**「从对战反推队伍构成」**的数据形态，与 ER 下「从对战反推对手特性/天性配置」是同一类问题。②它的「可配置观测空间/动作空间/奖励函数」接口设计，允许把同一份回放映射成不同特征，对我们的特征工程迭代很友好。

### 3. PokéChamp 回放数据集（Hugging Face）
- **名称**：pokechamp-replays
- **类型**：多格式回放数据集
- **URL**：https://huggingface.co/datasets/ （数据集名 `pokechamp-replays`；索引见 https://pokeagent.github.io/track1.html ）
- **一句话结论**：约 200 万局，覆盖 39+ 格式（Gen1–9 OU、Gen9 VGC 等），时间跨度 2024–2025；配套工具可从回放重建其 LLM Agent 的 prompt 与决策。
- **参考价值**：**「决策 + 理由」配对数据**的稀缺样本——若我们要做可解释的配队/配招推荐（给用户讲清「为什么推荐这套」），这类带推理链的数据比纯动作数据更有价值。

### 4. VGC-Bench 对局日志数据集
- **名称**：vgc-battle-logs
- **类型**：人类对局数据集（Open Team Sheet）
- **URL**：https://huggingface.co/datasets/cameronangliss/vgc-battle-logs
- **一句话结论**：70 万+ 条 OTS 开启的 VGC 对局日志；因为是 OTS，队伍信息基本公开，可较精确地反推状态-动作对。
- **参考价值**：**「队伍信息基本已知」的对局数据**，适合验证「给定双方队伍时，预测下一步决策」的模型；可作为我们做配队决策模型的干净起点。

### 5. akira399/poke-rag
- **名称**：poke-rag
- **类型**：RAG 知识库问答系统
- **URL**：https://github.com/akira399/poke-rag
- **一句话结论**：31★ / 0 fork，Python，最近推送 2026-09-13；「RAG-based Pokemon competitive knowledge base QA system (dex/moves/abilities/items/type chart/meta/damage)」，数据来自 PokeAPI、Pokémon Showdown 与 Smogon。
- **对我们的参考价值**：①它是**「把 dex + 使用率 + 克制表 + 伤害统一成可检索知识库」**的现成范式，我们的规则/知识引擎若要做自然语言问答或解释生成，可直接对照其数据组织。②三个数据源（PokeAPI / Showdown / Smogon）的整合方式，与我们 ER 数据（图鉴 xlsx + 存档解析 + 招式表 CSV）的多源合并问题同构。

### 6. drewsungg/mcpkmn-showdown
- **名称**：mcpkmn-showdown
- **类型**：MCP 数据查询服务（面向 LLM）
- **URL**：https://github.com/drewsungg/mcpkmn-showdown
- **一句话结论**：5★ / 2 fork，Python，最近推送 2026-02-23；Pokémon Showdown 的 Model Context Protocol 服务，提供宝可梦数据查询工具；数据源为 Showdown `pokedex.json` / `moves_showdown.json` / `abilities_full.json` / `items.json` / `typechart.json`，并随包发布、无外部 API 依赖（路线图含 Smogon 使用率查询）。
- **对我们的参考价值**：①**「纯本地静态数据 + 无外部依赖」的打包方式**，正适合 ER 这种规则与官方差异大、不能在线查询的场景。②MCP 形态意味着我们的配队工具若要对 AI 助手开放，可直接照此封装。

### 7. travishn/pokemon-showdown-scraper
- **名称**：pokemon-showdown-scraper
- **类型**：数据抓取脚本
- **URL**：https://github.com/travishn/pokemon-showdown-scraper
- **一句话结论**：6★ / 1 fork，Python，最后推送 2019-12-23（**停更**）；用 Selenium 从 Showdown 抓取数据。
- **参考价值**：仅作「历史上如何抓取 Showdown 数据」的参考；现有官方 API/静态 JSON 更可取，不建议复用其 Selenium 方案。

### 8. ivanlonel/showdown_dex
- **名称**：showdown_dex
- **类型**：数据入库（Postgres）
- **URL**：https://github.com/ivanlonel/showdown_dex
- **一句话结论**：2★ / 1 fork，PLpgSQL，**已 archive（2023-03-24 最后推送）**；把 Showdown 图鉴数据整理进 Postgres。
- **参考价值**：若我们想把 ER 图鉴/招式表做成可 SQL 查询的关系库，可参考其表结构设计；已归档，仅作结构参考。

### 9. Fascetta/FDS-Pokemon-Battles-prediction-2025
- **名称**：FDS-Pokemon-Battles-prediction-2025
- **类型**：胜负预测模型（特征工程 + 分类）
- **URL**：https://github.com/Fascetta/FDS-Pokemon-Battles-prediction-2025
- **一句话结论**：2★ / 0 fork，Jupyter Notebook，最近推送 2025-11-16；用 Showdown 数据（Gen1 OU）从初始队伍对位与逐回合时间线做特征工程，预测对局胜负。
- **参考价值**：**「队伍构成 → 胜负」的直接建模**，与配队评分目标最接近；其从「初始队伍对位」出发的特征思路，可启发我们把配队打分写成「对位关系」的函数。

### 10. pkmn.ai/projects（项目索引，含多代 Bot 与预测系统）
- **名称**：pkmn.ai Projects
- **类型**：社区项目索引 / 技术综述
- **URL**：https://pkmn.ai/projects/
- **一句话结论**：系统性整理了 Foul Play、CynthiAI、SutadasutoIA、Pokemon Battle Predictor / Future Sight AI 等项目的引擎、语言、许可与算法（例：Pokemon Battle Predictor 用 6815 维输入向量训练价值网络 + 分解式策略网络，并用使用率掩码约束招式选择）。
- **参考价值**：**做技术选型时的最佳总览**；其中「分解式策略网络（先预测换人/出招，再预测具体招式/换上哪只）+ 使用率掩码」的建模手法，可直接用于我们的配招推荐——先判定「该不该换」，再在合法招式集合上输出分布。

---

## 四、社区资源

### 1. Smogon Forums —— PsyMew（LLM 对战 Bot，2026）
- **名称**：PsyMew - Open Source AI Battle Bot Project
- **类型**：论坛讨论帖（含项目说明与设计讨论）
- **URL**：https://www.smogon.com/forums/threads/psymew-open-source-ai-battle-bot-project.3781351/
- **一句话结论**：2026-04 发帖，Foul Play 的 fork，把决策引擎换成 LLM（Gemini 2.5 Pro / Claude Sonnet 4）+ 保留 poke-engine MCTS 兜底；帖内与作者讨论了「把 MCTS 的边际 UCB 统计喂给 LLM」等具体改进。
- **参考价值**：**「搜索统计 → LLM/可解释推荐」的信息流设计**值得借鉴：若我们的配队工具要给出「为什么推荐」，可把规则引擎/搜索的中间量（威胁评估、胜率估计）显式暴露给解释模块。注：作者仓库 `professor-conifer/PsyMew` 经 API 查证**当前无公开仓库（404）**，仅帖内可确认项目存在——**待核实**。

### 2. Smogon Forums —— Jaxcalibur（达到天梯第 1 的 Randbats Bot，2026）
- **名称**：Jaxcalibur: A Gen 9 Randbats bot that reached #1 on the ladder
- **类型**：论坛讨论帖（含大量技术问答）
- **URL**：https://www.smogon.com/forums/threads/jaxcalibur-a-gen-9-randbats-bot-that-reached-1-on-the-ladder.3787537/
- **一句话结论**：2026-08 发帖；NN + 自对弈 RL + pUCT（类似 AlphaGo Zero），基于 poke-env + JAX 自研引擎，峰值 Elo 2557 / GXE 95.3；作者最终**决定不公开代码与权重**（出于天梯公平性考虑）。
- **参考价值**：帖内作者回答了若干**极具体、可迁移**的问题：①加入「预测对手下一步」的辅助任务使训练效率约提升 3×；②搜索时 16–32 个「世界」是折中值；③对手只露出 1–2 只时不搜索反而更好；④用自对弈胜率发现引擎 bug（如 Truant 实现错误）。这些「训练目标 + 超参 + 信息量不足时退化为启发式」的经验，对我们设计 NN 增强的配队/对局决策很直接。

### 3. Smogon Forums —— Laplace（打进前 500 的 Randbats Bot，2026）
- **名称**：Laplace, a new randbats bot that hit top 500
- **类型**：论坛讨论帖（项目分享）
- **URL**：https://www.smogon.com/forums/threads/laplace-a-new-randbats-bot-that-hit-top-500.3785303/
- **一句话结论**：2026-07 发帖；MCTS 搜索为主 + 368 个手工特征训练的价值网络（自对弈胜率预测，约 70% 准确率）仅在约 5–10% 的回合作为 tie-breaker 使用。
- **参考价值**：**「搜索为主 + NN 只做少量关键决策」的混合架构**——对我们是很务实的路线：先用现有规则引擎/18 流派模板跑通，再把 NN 用在模板难以覆盖的少数场景，而不是一上来端到端替换。

### 4. Smogon Forums —— Oak /「Stockfish for RBY」（2026）
- **名称**：Stockfish for RBY（Oak 项目发布帖）
- **类型**：论坛技术长帖（含方法论）
- **URL**：https://www.smogon.com/forums/threads/stockfish-for-rby.3770936/
- **一句话结论**：2026-05 发帖；介绍 Oak 工具包的设计取舍：为何不用 Showdown 做模拟器（太慢）、为何用 Exp3 而非 UCB（UCB 不收敛到低可利用性策略）、NN 值函数为何用小型 CPU 网络、以及数据生成格式（3 值目标 + 2 策略目标，5000 万局面约 3GB）。
- **参考价值**：**本清单里方法论信息密度最高的一篇**。尤其「同时搜索双方动作的 MCTS 是不 sound 的，需要 Exp3 这类对抗性算法才收敛到均衡」——这直接影响我们若要用搜索评估配队组合时的算法选择；另外其「配队部分潜力有限（仅 policy rollout、无搜索）」的坦率评估，是我们的重要风险提示。

### 5. Smogon Forums —— OU Scanalizer（AI/ML 配队工具，2026）
- **名称**：[WIP] Introducing OU Scanalizer - AI/ML teambuilding tool for SV OU
- **类型**：论坛讨论帖（配队工具）
- **URL**：https://www.smogon.com/forums/threads/wip-introducing-ou-scanalizer-ai-ml-teambuilding-tool-for-sv-ou.3788836/
- **一句话结论**：2026-09 仍在更新（WIP）；用 AI/ML 做 SV OU 的配队分析（含「寻找可替换的相似宝可梦」等能力）。
- **参考价值**：**与我们的产品形态最接近的社区同类项目**，可直接观察玩家对「AI 配队建议」的真实反馈与质疑点（例如相似宝可梦替换的合理性），用于校准我们的推荐可信度设计。

### 6. Smogon Forums —— Showdex 主帖
- **名称**：Showdex - An Auto-Updating Damage Calculator Built into Showdown!
- **类型**：论坛主帖（工具发布 + 长期更新日志）
- **URL**：https://www.smogon.com/forums/threads/showdex-an-auto-updating-damage-calculator-built-into-showdown.3707265/
- **一句话结论**：持续更新的长帖，含各版本功能说明（自动同步、Randbats 可用池展示、移动端适配、Battle Overlay 模式等）与用户反馈。
- **参考价值**：**UI/UX 需求的真实语料库**——用户在帖内反复提出「不要遮挡战斗场地」「移动端要能开合」「自动换组要锁定」等诉求，与我们在 ER 配队工具上「避免全屏弹窗、响应式适配」的原则高度一致，可直接作为设计验收清单的来源。

### 7. Smogon Forums —— Nessie123（OTS VGC Bot，2026）
- **名称**：Nessie123: An OTS VGC bot that topped the Reg M-C Bo3 ladder
- **类型**：论坛讨论帖
- **URL**：https://www.smogon.com/forums/threads/nessie123-an-ots-vgc-bot-that-topped-the-reg-m-c-bo3-ladder.3789213/
- **一句话结论**：2026-10-03 发帖；一个在 OpenAI Team Sheet（信息近乎公开）规则下登顶 Bo3 天梯的 VGC Bot；帖内争议集中在「强 Bot 公开是否破坏竞技生态」。
- **参考价值**：①佐证「**OTS/信息越公开，Bot 越强**」这一规律——对 ER 而言，若我们的工具明确展示「对方已知/未知信息」，其推断难度会显著低于纯隐藏信息场景。②其关于公开强 Bot 的伦理与检测讨论，可作我们决定「是否公开自研模型权重」时的参考先例。

### 8. Smogon Forums —— An OU Bot（2015，历史帖）
- **名称**：An OU Bot
- **类型**：论坛历史帖（早期 ML 尝试）
- **URL**：https://www.smogon.com/forums/threads/an-ou-bot.3529338/
- **一句话结论**：2015 年的早期讨论，作者自述用浏览器自动化喂神经网络，并列出其手工加入的「限制列表（restriction lists）」（如已在雨天则禁用 Rain Dance、对方已有岩钉则禁用 Stealth Rock 等）。
- **参考价值**：**「动作掩码 / 非法与次优动作过滤」的最早实践之一**，而且作者的过滤器不只过滤机制非法动作，还过滤「几乎总是糟糕」的动作——这正是我们把 ER 的 18 战术流派规则转成**动作先验/掩码**时可复用的思想。

### 9. PokéAgent Challenge（NeurIPS 2025 竞赛 → 长期基准）
- **名称**：The PokéAgent Challenge
- **类型**：竞赛 / 长期基准与数据索引
- **URL**：https://pokeagent.github.io/track1.html 、https://pokeagentchallenge.com
- **一句话结论**：2025 年 NeurIPS 竞赛赛道（Track 1 竞技对战，支持 Gen1–4 OU、Gen9 OU、Gen9 VGC），提供统一评测服务器、组织方基线（Metamon / PokéChamp 系列）、以及公开数据集索引（pokechamp 2M、metamon-raw-replays 1.8M、teams、usage-stats 等）。
- **参考价值**：**数据与评测的「集散地」**——若我们未来要把 ER 配队决策也纳入可比较的评测框架，这里的「数据集 + 基线 + 评测协议」三件套是最值得对标的模板。

### 10. Reddit 相关讨论
- **状态**：**未找到（本轮检索无有效产出）**。
- **说明**：以 `site:reddit.com` 定向限定检索「pokemon showdown battle bot AI machine learning」等关键词，两次均**返回空结果**，搜索引擎未能给出可确认的 Reddit 帖子链接。为避免编造，此处不列具体条目。
- **建议**：如需 Reddit 语料，建议后续改用浏览器直接访问 r/stunfisk、r/pokemonshowdown 并按其站内搜索检索（本轮工具链无稳定 Reddit 抓取能力）。

---

## 五、检索说明与未核实项（诚实记录）

| 项 | 结论 | 依据 |
|---|---|---|
| `insunity/Pokemon-Showdown-bots` | **不存在 / 不可访问** | GitHub API `/repos/insunity/Pokemon-Showdown-bots` → **404**；用户 `Insunity` 存在但仅 1 个公开仓库且不含该名 |
| `professor-conifer/PsyMew` | **不可访问** | GitHub API → **404**；`/users/professor-conifer/repos` → **空数组**（无公开仓库）。项目仅在 Smogon 帖中存在 |
| `smogon/dex` | **不可访问** | GitHub API → **404**；Smogon 官方文档虽提及该仓库，但当前非公开。结构化替代用 `pkmn/smogon` |
| `github.com/lab-oak/oak` | 已重定向 | API 解析为 **`pokemon-labs/oak`**（Smogon 帖写的是旧地址） |
| `jakegrigsby/metamon` / `metamon-org/metamon` | **不是 GitHub 仓库** | 前者是 **Hugging Face 数据集 ID**；真正的代码仓库是 **`UT-Austin-RPL/metamon`** |
| Reddit 专题 | **未找到** | 两次 `site:reddit.com` 定向检索均返回空 |
| PokeJAX | **待核实** | 仅见于 arXiv 论文（其自述为 GPU 并行模拟器），本轮未定位到可核验的公开仓库 |
| `pmariglia/showdown` | 已改名 | 301 → **`pmariglia/foul-play`**（star/活跃度以新地址为准） |

> 方法论备注：GitHub 网页直连被 robots.txt 拒绝，因此本清单所有 star / forks / 最近推送时间均取自 **GitHub REST API 的真实返回值**，可复现核验；未采用任何第三方猜测值。

---

## 六、对本项目的三条最直接结论（摘要）

1. **「搜索 + NN」混合优于纯端到端**：Laplace（NN 仅做 5–10% 的 tie-breaker 即进前 500）与 Oak（NN 值/策略头服务于搜索）都指向同一结论。对 ER 配队，先用现有规则引擎 + 18 战术流派模板做候选生成与硬性筛选，再用 NN 做排序/打分，是风险最低的落地路径。
2. **数据管线的关键资产是「不确定性先验」而非「动作标签」**：`pkmn/randbats`（采样 10 万队伍→概率表）、`pkmn/smogon`（结构化使用率）、Metamon 的 `revealed_teams`/`replay_stats`，共同给出「把有限候选池变成概率分布」的成熟范式——这正是 ER「特性池 n 选 1 / 3 固定天性」最需要的能力。
3. **UI 借鉴 Showdex 而非官方 Teambuilder**：Showdex 的「自动同步 + 自动收窄套装 + 面板/覆盖层双模式 + 移动端适配」已在 8 万用户量级验证，且其暴露出的「隐含否定信息未处理」缺陷，恰好是我们做 ER 特性推断时应显式解决的对比案例。
