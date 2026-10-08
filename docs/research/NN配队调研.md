# NN配队调研 —— 「神经网络拟合宝可梦配队决策」已有研究/项目/数据源清单

> 用途：为 Elite Redux 配队工具探索「用神经网络拟合配队决策」提供**外部证据底座**（研究 / 项目 / 数据源三通道）。本文件是**调研结论文档**；原始明细与检索执行记录见 `_raw_学术检索.md` / `_raw_开源检索.md` / `_raw_数据源调研.md`（同目录）。
> 执行日期：**2026-10-07** ｜ 通道：学术检索 / 开源检索 / 数据源检索（三路并行，general_search + web_fetch 实际核验）
> 编写原则：① 只登记**实际检索到并（尽量）核验过**的 URL，禁止编造；② 待核实/未验证项如实标注（见 §7）；③ 本文件只读检索，**未改动工程任何既有文件**。
> 结论落地文档：`NN配队方案.md`（可行性结论 + 特征工程 + 架构 + 数据管线 + 评估 + 接入蓝图）。

---

## 0. 结论先行（TL;DR）

1. **「从对局数据学配队/配招」在官方环境已有成熟范本**：Metamon（2 亿参数 Transformer，从 47.5 万场 Showdown replay 重建训练，打进 Gen1–4 OU 前 10%）、VGC-Bench（Transformer 队伍编码器）、PokéChamp（LLM + minimax）。**路线是通的，工具链（poke-env / metamon 解析器 / HuggingFace 数据集）现成可复用。**
2. **但 ER 是 GBA 改版、无 Showdown 环境、无任何 ER 原生对战语料**（本轮检索未发现 ER 版 Showdown 服务器或 ER battle-log 数据集）。因此：**端到端 NN 配队在 ER 上当前不可行；「NN 做评估/打分器、规则引擎继续做搜索」的部分可行方案是唯一低风险路线**（Laplace / Oak / OU Scanalizer 三个社区先例均指向「搜索为主 + NN 辅助」）。
3. **数据侧最务实的三个现成资源**：① Smogon chaos JSON（每月、MB 级、免解析的「招式/道具/特性/队友」监督分布，2026-07 为最新月）；② VGC-Bench（630 MB / 147 万转移 / MIT / OTS 含完整队伍）；③ Metamon-parsed（28.5 GB / 5.3M 轨迹）。它们只能当 ER 的**预训练/先验/方法论模板**，不能当 ER 的 ground truth。

---

## 1. 领域里程碑总览（精选 12 条）

| # | 项目/论文 | 类型 | 一句话结论 | 与「NN 拟合配队」的距离 |
|---|---|---|---|---|
| 1 | **Metamon**（arXiv 2504.04395） | 学术·论文+开源 | 从 47.5 万场人类 replay 重建离线 RL 轨迹，2 亿参数 Transformer，无显式搜索打进 Gen1–4 OU 前 10% | ★★★★★ 从 replay 学配队/配招决策的最完整范本 |
| 2 | **VGC-Bench**（arXiv 2506.10326） | 学术·论文+开源 | 3 层 Transformer 编码器聚合 12 只宝可梦的招式/道具/特性嵌入；PPO + self-play；70 万+ 对局日志 | ★★★★★ 队伍级表征架构直接可借鉴 |
| 3 | **OU Scanalizer**（Smogon 论坛） | 社区·AI 配队工具 | 两个模型：「两队→胜率」+「1v1 单挑胜负」，用于评估队伍与替换建议 | ★★★★★ 与「NN 评估配队」产品形态最接近 |
| 4 | **PokéChamp**（ICML 2025 Spotlight） | 学术·论文+开源 | LLM 替换 minimax 的对手建模/动作采样/价值估计三模块 | ★★★★ 「LLM 先验 + 少量搜索」路线 |
| 5 | **GA + 自对弈配队**（arXiv 2212.13338） | 学术·论文 | 遗传算法搜队伍，适应度=与大量人类队伍自对弈胜率，Gen7 Random Battles 世界第 33 | ★★★★ 配队搜索的标准范式（无梯度场景） |
| 6 | **VGC AI Competition**（IEEE CoG 2021） | 学术·论文 | 把「选队伍、配招」正式建模为独立子问题（Team Predictor + Selection Policy） | ★★★★ 「配队是独立任务」的领域承认 |
| 7 | **CS230 2022（Tse）** | 学术·课程项目 | 70 万条 VGC 日志监督预训练 6 层网络 → DQN 迁移；4186 维输入过拟合，改 254 维嵌入收敛 | ★★★★ 监督→RL 微调路径 + 特征维度教训 |
| 8 | **Laplace**（Smogon 论坛，2026） | 社区·Bot | MCTS 为主 + 368 维手工特征价值网络，仅作 5–10% 回合 tie-breaker 即进 Randbats 前 500 | ★★★★ 「搜索为主、NN 少量辅助」实证 |
| 9 | **Oak / Stockfish for RBY**（Smogon 论坛） | 社区·开源 | 快速模拟 + 小型 NN 值/策略头 + 自对弈 + PPO 队伍构建 | ★★★★ 离「NN 拟合配队决策」最近的社区实现 |
| 10 | **Nessie123**（Smogon 论坛，2026） | 社区·Bot | 约 150 万参数估值网络 + 自对弈，登顶 OTS VGC Bo3 天梯 | ★★★ 「1.5M 参数就够」的规模参考 |
| 11 | **Jaxcalibur**（Smogon 论坛，2026） | 社区·Bot | NN + 自对弈 RL + pUCT 登顶 Gen9 Randbats；「预测对手下一步」辅助任务训练效率约 3× | ★★★ 自对弈工程细节 |
| 12 | **pkmn/randbats**（pkmn 生态） | 开源·数据方法 | 每小时采样 10 万支队伍，把随机池变成招式/道具/特性概率表 | ★★★★ 「采样→概率分布表」方法学与 ER 特性池 n 选 1 同构 |

---

## 2. 学术 / 论文（详细）

### 2.1 从 replay 学习（监督 / 离线 RL / 模仿学习）——本方向主干

**① Metamon: Human-Level Competitive Pokémon via Scalable Offline RL with Transformers**
- URL：https://arxiv.org/abs/2504.04395 ｜ https://metamon.tech/ ｜ https://github.com/UT-Austin-RPL/metamon
- 结论：UT Austin，从 Showdown 十余年 replay 重建 **47.5 万条「第一人称」人类对局**，按「模仿学习 → 离线 RL → 自对弈微调」训练最大 2 亿参数 Transformer，无显式搜索，匿名排位进 Gen1–4 OU 前 10%。
- 对我们：**replay→状态重建→(obs, action, reward) 流水线可直接迁移**（数据源侧已有现成解析产物：metamon-parsed-replays 28.5GB/5.3M 轨迹）；两段式训练（先模仿后 RL）契合我们样本少的处境。

**② VGC-Bench: Towards Mastering Diverse Team Strategies in Competitive Pokémon**
- URL：https://arxiv.org/abs/2506.10326 ｜ https://github.com/cameronangliss/vgc-bench
- 结论：UT Austin，VGC 基准（70 万+ 对战日志、200K+ 队伍）；策略网络用 **3 层 Transformer 编码器聚合 12 只宝可梦**的招式/道具/特性嵌入，PPO + self-play / fictitious play / double oracle。
- 对我们：**队伍级表征的参考实现**——把整队当一组 token 聚合，正是「NN 拟合配队」缺的那块；其数据（vgc-battle-logs，OTS 含完整队伍，MIT）是 3 个社区数据集中许可证最宽松、规模最合适的。

**③ PokéAgent Challenge（NeurIPS 2025 → 长期基准）**
- URL：https://arxiv.org/abs/2603.15563 ｜ https://pokeagent.github.io/track1.html
- 结论：基于 Showdown 的大规模决策基准，扩展 Metamon，发布 30 个水平梯度 checkpoint 与 200K+ 队伍数据集；官方维护公开数据集索引（pokechamp 2M / metamon-raw 1.8M / teams / usage-stats）。
- 对我们：**数据集 + 基线 + 评测协议三件套的最值得对标模板**；checkpoint 可作预训练起点。

**④ CS230 2022（Tse）：Learning Competitive Pokemon through NN and RL**
- URL：http://cs230.stanford.edu/projects_spring_2022/reports/127608668.pdf
- 结论：先用 **70 万条高排位 VGC 日志**监督训练 6 层网络学状态嵌入，再接到 DQN 迁移；击败随机/最大伤害基线。关键记录：**输入 4186 维直接过拟合，改用 254 维嵌入才收敛**。
- 对我们：监督预训练→RL 微调路径；**「特征维度压不下去→过拟合」是改版小样本场景的第一风险**，方案文档据此设计特征组与降维。

**⑤ CS230 2018（Chen）：Gotta Train 'Em All**
- URL：https://cs230.stanford.edu/projects_fall_2018/reports/12447633.pdf ｜ https://github.com/kvchen/showdown-rl
- 结论：PPO + 自定义 Gym 环境训练 gen1 bot，3×512 FC + ReLU，**无效动作 logits 掩码**。
- 对我们：无效动作掩码是工程要点（配招候选池按规则引擎的合法招式过滤后，NN 只在这些合法招上输出分布）。

**⑥ Erdős Institute 2024：Pokémon Battle AI**
- URL：https://www.erdosinstitute.org/_files/ugd/39bf20_ba8a68d365e0430da29b08fdf7d02475.pdf
- 结论：NN 预测对战结果首版 61% 准确率，**发现模型过度依赖双方剩余总 HP，去偏后降到 55%**。
- 对我们：特征去偏的诚实踩坑记录——改版场景下要防「HP/等级等混杂变量主导」。

**⑦ Vanier College 2021：AI Model & NN to Predict Outcomes of Pokemon Battles**
- URL：https://gauss.vaniercollege.qc.ca/~iti/proj/2021/AK_pokemon.pdf
- 结论：以「NN 判定最佳 3v3 队伍」为假设，用预测对战结果作队伍优劣代理。
- 对我们：小型课程项目完整方法论，适合快速原型（证明「队伍→胜率」可学）。

### 2.2 配队 / 配招的专门方法

**⑧ GA + 自对弈配队：AI for Pokémon ranks 33rd in the world**
- URL：https://arxiv.org/abs/2212.13338
- 结论：**遗传算法**搜索队伍（适应度 = 与大量人类队伍自对弈胜率）+ 启发式搜索，Gen7 Random Battles 世界第 33 名。
- 对我们：**GA + 自对弈适应度是配队搜索最成熟做法**，契合我们离散、无梯度、候选空间大的场景（1906 物种组合空间极大，GA 是穷举的替代）。

**⑨ VGC AI Competition：A New Model of Meta-Game Balance AI Competition**
- URL：https://ieee-cog.org/2021/assets/papers/paper_6.pdf
- 结论：把「meta-game 平衡」列为竞赛任务——AI 不仅要对战，还要**选队伍、配招**；含 Team Predictor + Selection Policy。
- 对我们：**把配队形式化为独立子问题**，与我们的目标定义一致。

**⑩ Optimal Team Selection for Small-Scale Attrition Games（Stanford CS221 2018）**
- URL：https://web.stanford.edu/class/archive/cs/cs221/cs221.1192/2018/restricted/posters/karenl7/poster.pdf
- 结论：Q-learning + 遗传算法联合求解小队最优选择，**GA 处理组合爆炸替代穷举**。
- 对我们：「Q-learning 评估单体 + GA 搜组合」分工清晰，可作两阶段配队骨架。

**⑪ XGBoost-Based Synergistic Partner Recommendation in Strategy Games**
- URL：https://ace.ewapub.com/article/view/27477.pdf
- 结论：XGBoost 做配队协同推荐，融合种族值 + one-hot 属性 + **属性协同分**，AUC 显著优于基线。
- 对我们：印证**属性协同特征最有效**；同时说明**特征设计可能比模型容量更关键**（树模型路线也是候选）。

**⑫ IEEE CoG 2019：A Self-Play Policy Optimization Approach to Battling Pokémon**
- URL：https://ieee-cog.org/2019/papers/paper_175.pdf
- 结论：gen7randombattle 自对弈策略优化，给出明确特征表（**ability 238 维、moveset 4×731 维、lastmove、6 项数值**）。
- 对我们：现成特征工程表，招式/特性 one-hot 维度可照抄改造（但对 ER 的 1034 特性需聚合，见方案文档 §2）。

**⑬ Showdown AI Competition（IEEE CIG 2017，S. Lee & J. Togelius）**
- URL：https://dl.acm.org/doi/10.1109/CIG.2017.8080435 ｜ 开放 PDF https://game.engineering.nyu.edu/wp-content/uploads/2017/02/CIG_2017_paper_87-1.pdf
- 结论：领域起点，确立「回合制 + 部分可观测 + 组队」基准；文中明言「宝可梦是新领域、训练数据稀缺」。
- 对我们：与我们的困境（无 ER 数据）一致，佐证先建数据再谈模型。

### 2.3 LLM 路线（数据稀缺时的替代信号源）

**⑭ POKÉLLMON: A Human-Parity Agent with LLMs**
- URL：https://arxiv.org/abs/2402.01118
- 结论：首个战术对战达人类水平的 LLM agent：in-context RL（战斗文本反馈在线更新）+ 知识增强生成 + 一致性机制。
- 对我们：「无梯度在线适应」用少量历史对局即可更新，对没有大盘数据的改版天然友好。

**⑮ PokéChamp: an Expert-level Minimax Language Agent**
- URL：https://proceedings.mlr.press/v267/karten25a.html ｜ https://github.com/sethkarten/pokechamp
- 结论：Princeton，用 LLM 替换 minimax 三模块，Gen9 OU 对最强规则 Bot 胜率 84%。
- 对我们：「不必端到端 RL」——预训练先验 + 少量搜索即可；对手隐藏队伍当待估潜变量的建模对配队反制有用。

**⑯ LLM as Pokémon Battle Agents（arXiv 2512.17308）**
- URL：https://arxiv.org/abs/2512.17308
- 结论：无需领域训练的 LLM 可当对手与内容生成器，含 30 人人类对战体验实验。
- 对我们：数据太少时，零样本 LLM 可作弱监督信号与冷启动方案（人工评审后的低质标签也优于无标签）。

**⑰ PokeHit: LLMs + MCTS in Team Formation（论文 URL 待核实，仓库可达）**
- URL：https://github.com/Alfedi/PokeHit
- 结论：LLM + MCTS 用于回合制游戏的**队伍组建**（VGC AI Competition 案例）。
- 对我们：少见的以「队伍组建」为任务本身的 LLM+MCTS 工作。

### 2.4 其他（模拟器加速 / 平衡性 / 均衡搜索）

**⑱ Automatic Generation of High-Performance RL Environments（PokeJAX）**
- URL：https://arxiv.org/abs/2603.12145
- 结论：GPU 并行宝可梦模拟器，比 Showdown TS 参考快约 **22,320×**。
- 对我们：说明自建高速模拟器是训练量瓶颈的突破口；ER 若走合成数据路线，模拟器性能是第一工程约束。

**⑲ A Framework for Predicting Game Balance Changes through Meta Discovery**
- URL：https://arxiv.org/abs/2409.07340
- 结论：RL 对战 agent + 队伍生成器预测 Showdown 平衡性改动后果（胜率作适应度）。
- 对我们：胜率作适应度是配队搜索的标准范式，可用于改版平衡验证。

**⑳ PokaiTrainer: Scaling Equilibrium Search to VGC**
- URL：https://arxiv.org/abs/2608.29197
- 结论：均衡搜索 Bo3 天梯胜率 59%，**强调强度主要来自搜索，纯策略网络连浅层启发式都打不过**。
- 对我们：强力佐证「搜索为主、NN 辅助」——价值估计精度比策略锐度更重要。

**㉑ PokeAI: Multi-agent System for Pokémon Red**
- URL：https://arxiv.org/abs/2506.23689
- 结论：多智能体系统（目标生成 + 战斗执行）在 Pokémon Red 平均胜率 80.8%。
- 对我们：证明分层多 agent 架构可行，提示 GBA 类环境的现实路径（ER 同为 GBA 基版）。

**㉒ Deep RL for Pokemon Battling（CS587）**
- URL：https://kevin-ys-zhang.github.io/files/CS587_Project_Report.pdf
- 结论：对比 REINFORCE / GIGA-WoLF / DQN / A2C，DQN 大幅优于随机 agent；属性克制写成 {0, 0.25, 0.5, 1, 2, 4}。
- 对我们：特征编码极实用（克制倍率离散化），轻量网络现成模板。

---

## 3. 开源项目 / 工具（详细）

### 3.1 对战 Bot 与模拟引擎（关系「自我对弈 / 数据生成」可行性）

| 项目 | URL | 结论 | 对我们的价值 |
|---|---|---|---|
| **pmariglia/foul-play**（原 showdown，301 跳转） | https://github.com/pmariglia/foul-play | 384★，Rust 引擎 poke-engine + 并行 DUCT-MCTS，Gen1–8 单打与 Randbats 长期高排名，公认最强开源搜索型 Bot | 对手未知信息→概率化确定化可迁移到 ER「特性池 n 选 1 / 3 天性」推断；StateMutator 高效回滚是搜索试算的性能命门 |
| **hsahovic/poke-env** | https://github.com/hsahovic/poke-env | 524★，学术向宝可梦 AI 公共底座，内置三种基线玩家，支持自对弈/动作掩码/custom teambuilder | **「自定义 teambuilder」是官方扩展点**——把 ER 规则校验包成 teambuilder 即可复用整套自对弈数据管线 |
| **pkmn/engine（libpkmn）** | https://github.com/pkmn/engine | 377★，Zig（含 C/Python/JS 绑定），比 Showdown 快约 1000× | 大规模胜率试算的唯一现实加速底座；但只实现官方机制，ER 自定义规则需移植 |
| **pokemon-labs/oak** | https://github.com/pokemon-labs/oak | 快速模拟 + Exp3/UCB 搜索 + 小型 NN 值/策略头 + 自对弈数据生成 + **PPO 队伍构建** | **离「NN 拟合配队决策」最近的实现**；自述配队部分「无搜索、仅 policy rollout 潜力有限」→ 佐证「生成 + 搜索评估」混合路线 |
| **sethkarten/pokechamp** | https://github.com/sethkarten/pokechamp | 185★，ICML 2025 官方实现，LLM+minimax | 用 Showdown 统计做隐藏信息先验，与 ER「特性池 n 选 1」先验建模同构 |
| **UT-Austin-RPL/metamon** | https://github.com/UT-Austin-RPL/metamon | 142★，离线 RL/Transformer + 数据集平台 | 「观众视角回放→第一人称可训练轨迹」重建管线是数据侧最值得复用的资产 |
| **cameronangliss/vgc-bench** | https://github.com/cameronangliss/vgc-bench | 53★，多智能体 RL 基准；明确指出**队伍配置空间约 10^139**、单队很强但多队退化 | 「配队泛化」正式评测维度（cross-play 未见队伍 / exploitability）；其未来方向明确列出 Team Building |
| **kvchen/showdown-rl** | https://github.com/kvchen/showdown-rl | PPO gen1 bot，gym 环境 | 工程结构清晰，适合理解「bot↔Showdown 服务器」对接 |
| **alexzhang13/reward-shaping-rl** | https://github.com/alexzhang13/reward-shaping-rl | LLM 迭代生成奖励函数做 reward shaping | 若做 RL，奖励设计是最大难点，这是省力替代路径 |
| **rameshvarun/showdownbot** | https://github.com/rameshvarun/showdownbot | 71★，已归档，首个被论文描述的竞技宝可梦 AI（depth-2 minimax + 手工估值） | 手工估值函数写法的「祖师爷」 |
| **vasumv/pokemon_ai** | https://github.com/vasumv/pokemon_ai | depth-2 determinized minimax + alpha-beta；含较完整**队伍预测**（Smogon + 天梯 replay 贝叶斯推 moveset） | 对手建模经典实现（P(Move|Move)、P(Move|Species∧Move)） |
| **leolellisr/poke_RL** | https://github.com/leolellisr/poke_RL | 17★，传统+深度 RL 实现合集 | 快速复现做算法选型小 A/B |
| **MatteoH2O1999/alphaPoke** | https://github.com/MatteoH2O1999/alphaPoke | 9★，RL bot 完整工程样例 | 工程样例参考 |
| **dramamine/leftovers-again** | https://github.com/dramamine/leftovers-again | 77★，2021 后停更；「Bot 平台化」多策略插件挂载 | 多 Agent 并行测试架构借鉴 |
| ⚠️ **insunity/Pokemon-Showdown-bots** | https://github.com/insunity/Pokemon-Showdown-bots | **经核实不存在**：GitHub API 404，用户无同名仓库 | 从候选清单移除（线索疑似记错） |

### 3.2 配队 / 配招推荐工具（关系「推荐逻辑与 UI」借鉴）

| 项目 | URL | 结论 | 对我们的价值 |
|---|---|---|---|
| **smogon/pokemon-showdown（官方）** | https://github.com/smogon/pokemon-showdown | 5936★，官方模拟器；CLI 提供 `simulate-battle` / `generate-team` / `validate-team` / `export-team` / `pack-team` | `validate-team` 是合法性校验范式（ER 的「特性池 n 选 1 / 3 天性 / 21 属性 / -ate」本质是一套自定义 validator）；`pack-team` 队伍序列化格式应兼容以便复用生态 |
| **smogon/damage-calc** | https://github.com/smogon/damage-calc | 539★，官方伤害计算器（one-vs-all / all-vs-one 批量） | 配招推荐核心打分函数（伤害区间、OHKO/2HKO）直接复用，避免自研公式出错 |
| **pkmn/smogon** | https://github.com/pkmn/smogon | 50★，Smogon 分析/使用率类型化封装（JSON） | 推荐逻辑最需要的数据源接口——招式使用率、teammates、counters 已结构化 |
| **pkmn/randbats** | https://github.com/pkmn/randbats ｜ 数据 https://data.pkmn.cc/randbats/ | 50★，每小时为每种 randbats 格式采样 10 万支队伍，聚合出招式/道具/特性出现概率 | **方法学极度对口**：用大量采样把随机池变成概率分布表；ER「特性池 n 选 1」可用同一 pipeline |
| **doshidak/showdex** | https://github.com/doshidak/showdex | 207★，Chrome 扩展约 8 万用户，内嵌伤害计算器 + 套装推断 | **UI 第一借鉴对象**：「面板/覆盖层双模式 + 移动端适配」对应我们「禁止全屏弹窗、响应式」原则；其「自动换组」（对手露新信息→切换到可能套装）与 ER 下「逐步收窄候选特性」交互同构 |
| **ensinho/pokemonTeamBuilder** | https://github.com/ensinho/pokemonTeamBuilder | 10★，实时属性覆盖计算 + Showdown 导出 | 配队工具 UI 最小可用闭环（ER 21 属性覆盖矩阵可借鉴） |
| **Swepps/pokeautobuilder** | https://github.com/Swepps/pokeautobuilder | 10★，C#，从候选池按参数推荐队伍 | 可对照 18 流派模板的约束表达 |
| **Geyserexe/BuilderBot** | https://github.com/Geyserexe/BuilderBot | 3★，针对特殊规则集自动构建队伍 | 与「为 ER 单独定制规则集」处境相似 |
| **DigitalFlow/Pokemon-Team-Builder** | https://github.com/DigitalFlow/Pokemon-Team-Builder | 6★，2016 后停更；按 Smogon 使用率/搭配做推荐 | 早期实现样本（协同度、补盲） |
| **lambjw/BuilderAnalyzer** | https://github.com/lambjw/BuilderAnalyzer | 3★，2020 后停更；队伍评分/评估 | 打分维度对照 |
| ⚠️ **smogon/dex** | （官方文档提及） | GitHub API 查证 404 非公开 | 公开结构化替代用 `pkmn/smogon` |

### 3.3 数据分析 / 知识库项目

| 项目 | URL | 结论 | 对我们的价值 |
|---|---|---|---|
| **Smogon 使用率与 Moveset 统计（官方数据发布）** | https://www.smogon.com/stats/ | 按月发布 usage / moveset / leads 统计，含招式使用率、性格努力值分布、常见队友 | 配招推荐最直接的先验数据；**按 Elo 分档**提示：NN 拟合人类配队决策时应把玩家水平当条件变量而非混杂因子 |
| **Metamon 回放数据集（HF）** | https://huggingface.co/datasets/jakegrigsby/metamon-parsed-replays ＋ https://huggingface.co/datasets/jakegrigsby/metamon-raw-replays | parsed 28.5GB/5.3M 轨迹；含 `revealed_teams` 与 `replay_stats` | 「从对战反推队伍构成」的数据形态，与 ER 反推对手特性/天性配置同类 |
| **akira399/poke-rag** | https://github.com/akira399/poke-rag | 31★，RAG 知识库问答（PokeAPI + Showdown + Smogon） | 「多源→可检索知识库」现成范式，与 ER 图鉴 xlsx + 存档解析 + 招式 CSV 多源合并同构 |
| **drewsungg/mcpkmn-showdown** | https://github.com/drewsungg/mcpkmn-showdown | 5★，MCP 数据查询服务，随包发布静态 JSON 无外部 API 依赖 | 正适合 ER 这种「规则与官方差异大、不能在线查询」的场景 |
| **Fascetta/FDS-Pokemon-Battles-prediction-2025** | https://github.com/Fascetta/FDS-Pokemon-Battles-prediction-2025 | 2★，从初始队伍对位与时间线特征预测胜负 | 「队伍构成→胜负」直接建模，与配队评分目标最近 |
| **pkmn.ai/projects（项目索引）** | https://pkmn.ai/projects/ | 系统性收录 2003–2025 年宝可梦 AI 项目（论文/引擎/语言/指标） | **一次性的「文献地图」**，后续综述索引；其中「分解式策略网络 + 使用率掩码」可用于配招推荐 |
| **travishn/pokemon-showdown-scraper** | https://github.com/travishn/pokemon-showdown-scraper | 6★，2019 停更，Selenium 抓取已过时 | 反例：走官方 API / 静态 JSON / HF 镜像 |

### 3.4 社区资源（Smogon 论坛，2025–2026 一线实践）

| 帖 | URL | 关键信息 |
|---|---|---|
| **Laplace（Randbats 前 500）** | https://www.smogon.com/forums/threads/laplace-a-new-randbats-bot-that-hit-top-500.3785303/ | MCTS 为主 + 368 维手工特征价值网络（自对弈胜率预测约 70% 准确率）**仅作 5–10% 回合 tie-breaker** → 「规则/搜索为主、NN 补模板覆盖不到的场景」路线实证 |
| **Jaxcalibur（Randbats 天梯第 1）** | https://www.smogon.com/forums/threads/jaxcalibur-a-gen-9-randbats-bot-that-reached-1-on-the-ladder.3787537/ | NN + 自对弈 RL + pUCT，峰值 Elo 2557；①「预测对手下一步」辅助任务训练效率约 3×；②搜索 16–32 个「世界」是折中值；③对手只露 1–2 只时不搜索更优；④用自对弈胜率发现引擎 bug。最终**未开源** |
| **Oak /「Stockfish for RBY」** | https://www.smogon.com/forums/threads/stockfish-for-rby.3770936/ | 为何不用 Showdown 做模拟器（太慢）、为何用 Exp3 而非 UCB（不收敛到低可利用性策略）、5000 万局面约 3GB；**同时搜索双方动作的 MCTS 不 sound** 直接影响我们搜索评估配队组合的算法选择 |
| **OU Scanalizer（AI/ML 配队工具 WIP）** | https://www.smogon.com/forums/threads/wip-introducing-ou-scanalizer-ai-ml-teambuilding-tool-for-sv-ou.3788836/ | 两个模型：「两队→胜率」+「1v1 单挑胜负」；含「寻找可替换的相似宝可梦」→ 与我们产品形态最接近，可观察玩家对 AI 配队建议的真实质疑点 |
| **Showdex 主帖** | https://www.smogon.com/forums/threads/showdex-an-auto-updating-damage-calculator-built-into-showdown.3707265/ | 用户反复要求「不要遮挡战斗场地」「移动端能开合」「自动换组要锁定」——与我们在 ER 配队工具的原则一致，可作设计验收清单来源 |
| **Nessie123（OTS VGC Bot）** | https://www.smogon.com/forums/threads/nessie123-an-ots-vgc-bot-that-topped-the-reg-m-c-bo3-ladder.3789213/ | 约 150 万参数估值网络 + 自对弈登顶 Bo3；佐证「信息越公开 Bot 越强」→ ER 工具应明确区分「对方已知/未知信息」 |
| **PsyMew（LLM Bot，2026）** | https://www.smogon.com/forums/threads/psymew-open-source-ai-battle-bot-project.3781351/ | Foul Play 的 fork，LLM 决策 + MCTS 兜底；「搜索统计→可解释推荐」信息流设计。⚠️ 作者仓库 `professor-conifer/PsyMew` API 404，仅帖内可确认，待核实 |
| **An OU Bot（2015 历史帖）** | https://www.smogon.com/forums/threads/an-ou-bot.3529338/ | 手工「限制列表」（已有雨天禁 Rain Dance 等）→ 动作掩码/次优动作过滤的最早实践之一；ER 的 18 战术流派规则可转成动作先验/掩码 |
| **Reddit（r/stunfisk 等）** | — | 两次 `site:reddit.com` 定向检索均返回空，无可确认帖子；**不列条目**，如需建议直接用浏览器站内搜索 |

---

## 4. 数据源（详细）—— 官方 / 社区 / 学术三分类

> 完整实测记录（16 成功 / 5 失败，含访问内容）见 `_raw_数据源调研.md` §6。以下只列结论与关键数字。

### 4.1 官方

| 数据源 | URL | 规模/频率 | 结论 |
|---|---|---|---|
| **Showdown Replay（单场 JSON）** | `https://replay.pokemonshowdown.com/<formatid>-<id>.json` | 单场；实时上传 | 含完整对局 log（逐回合）+ `\|win\|` 胜者标签 + 双方 Elo；**team preview 暴露全部物种，但招式/道具/特性只在触发时揭示** |
| **Showdown Replay 检索 API** | `https://replay.pokemonshowdown.com/search.json?format=gen9ou&page=1` | 每页约 50 条 | 可逐场下载，**无官方批量打包渠道**（PokéAgent 官方明言第三方维护 HF 镜像是为 sparing Showdown download requests） |
| **Smogon 月度 usage（txt）** | `https://www.smogon.com/stats/2026-07/gen9ou-0.txt` | gen9ou 当月 **654,262 场**；每月更新（2026-07 为最新） | 纯文本表，仅物种使用率 |
| **Smogon chaos 统计（JSON）** | `https://www.smogon.com/stats/2026-07/chaos/gen9ou-1500.json` | 单文件 **0.58–6.68 MB**；每月 | **每只宝可梦带 `Moves/Items/Abilities/Spreads/Teammates/Tera Types` 加权分布**——现成「配招/配队」监督信号，免解析 |
| **官方静态数据** | `https://play.pokemonshowdown.com/data/` | 随机制更新（2026-10-02） | pokedex/moves/learnsets 等；**是原版数据，不是 ER 数据**，仅可作 schema 参照 |

### 4.2 社区 / 学术数据集（2024–2026）

| 数据集 | URL | 规模（实测） | 许可证/口径 | 信号 |
|---|---|---|---|---|
| **Metamon raw-replays** | https://huggingface.co/datasets/jakegrigsby/metamon-raw-replays | **1.83M 行** Parquet（README 述 2.7M 场），v6=至 2026-05-19 | — | 队伍(物种)+时序+胜负（在 log 内） |
| **Metamon parsed-replays** | https://huggingface.co/datasets/jakegrigsby/metamon-parsed-replays | **28.5 GB / 5.3M 轨迹**（文件名内嵌 ELO 与 WIN/LOSS） | **cc-by-nc-4.0（非商用！）** | 第一人称轨迹；附 revealed_teams + replay_stats |
| **PokéChamp replay** | https://huggingface.co/datasets/milkkarten/pokechamp | **2.13M 行**（train 1.92M），2024–2025，37+ 格式，Elo 1000–1800+ | — | 原始 log + elo/month 元数据 |
| **VGC-Bench 日志** | https://huggingface.co/datasets/cameronangliss/vgc-battle-logs | **88,905 场 / 177,810 轨迹 / 1,474,324 转移 / 630 MB** | **MIT（最宽松）** | **OTS 含完整队伍**（唯一配招全监督源）+ 转轨迹脚本 logs2trajs.py |
| **Metamon 自对弈集** | https://huggingface.co/datasets/jakegrigsby/metamon-parsed-pile | pac-base 11M / pac-exploratory 7M / pac-tauros 4M 轨迹 | cc-by-nc | 非人类对局，RL 提升用 |
| **Metamon 队伍集** | https://huggingface.co/datasets/jakegrigsby/metamon-teams | gen3 107k / gen9 139k 队（gl_05_26） | — | Showdown 队伍文件 |
| **PokéAgent 聚合入口** | https://pokeagent.github.io/track1.html | 汇总以上 + teams + usage-stats | — | 数据集索引 + 官方基线 + 评测协议 |

⚠️ **口径差异登记**：Metamon 官网述「475k human demonstrations」（v0 论文版）、PokéAgent 页述「>3.5M 全对局轨迹」、HF README 述「5.3M 轨迹」——三者对应不同版本；引用需带版本号。

### 4.3 数据可得性结论（2024–2026）

- **配队/配招监督信号**：🥇 **Smogon chaos JSON**（性价比之王：MB 级、免解析、每月、含 Moves/Items/Abilities/Spreads/Teammates 权重分布）。
- **对局时序 + 胜负标签**：🥈 **VGC-Bench**（630MB / 147 万转移 / MIT / OTS 完整队伍，最小最快）→ 更大规模上 **Metamon-parsed**（28.5GB / 5.3M 轨迹）或 **PokéChamp**（2.13M 行）。
- **不要**：自己直连 replay API 大规模爬取（无官方批量通道、速率风险、需自己解析）。
- **胜负标签**：天然干净（replay 末尾 `|win|<玩家名>`；Metamon 更把 WIN/LOSS 写进文件名）。
- **最大缺口**：标准 replay 不保证完整配招/道具/努力值——完整配招只有 OTS 格式（VGC-Bench）或 chaos JSON 聚合可得。

---

## 5. ER 改版特殊性判断（关键）

### 5.1 事实前提（本轮检索确认）

- ER 是 GBA 改版（基版绿宝石 BPEE），**不在 Showdown 环境内**；本轮检索**未发现** ER 版 Showdown 服务器，也未发现任何 ER battle-log 数据集（命中的 "Elite Redux" 均为 GBA 改版页面，如 https://eliteredux.net/game-gallery/）。
- 因此**不存在「ER 原版大规模对战数据」**；§4 所有数据源都是原版/官方 Showdown 数据。
- ⚠️ 未验证项：**是否存在 ER 的 Showdown fork/私服**（未穷尽 GitHub Issues/Discord）；若存在将是 ER 数据的第一优先来源，但在核实前不假设。

### 5.2 能迁移 / 不能迁移

| 维度 | Showdown/Smogon 原版数据 | 对 ER 的价值 |
|---|---|---|
| 方法论 / 架构 / 解析器 / 训练脚本 | 现成 | ✅ 直接可复用 |
| 监督信号「格式」（chaos JSON 结构） | Moves/Items/Abilities/Spreads/Teammates | ✅ 可照搬 schema，在 ER 侧用自有数据产出同类统计 |
| 物种 / 招式 / 道具先验 | Gen1–9 原版 | ⚠️ 仅交集部分可迁移（ER 1907 物种含原版 + 大量自创）；ER 自创内容不在其中 |
| 特性 | 原版特性；**ER 为双特性体系（abis 池 + 3 天性 inns），1034 特性多为自创/改版** | ❌ 基本不可迁移（这是最大分布漂移源） |
| 对战时序 | 逐回合 replay | ⚠️ 可训练「通用战斗状态编码器」，但 ER 机制（双特性/自创招）造成分布漂移 |
| 胜负标签 | ✅ 干净 | ✅ 可作通用「好队/好线」预训练监督 |

### 5.3 结论（诚实）

**端到端 NN 配队在「无数据改版」上：当前不可行（作为唯一路径）；部分可行（作为增强组件，配队搜索仍由规则引擎做）。** 依据：
1. ER 无原生语料（§5.1）→ 监督/模仿学习无直接数据；
2. 原版数据可作预训练/先验，但双特性体系、自创招式/特性导致分布漂移大（§5.2）——把 Showdown 数据当 ER ground truth 是错误用法；
3. 社区一线实践（Laplace：NN 仅做 5–10% tie-breaker；Oak：纯 policy rollout 配队弱；PokaiTrainer：纯策略网络打不过浅层启发式）一致指向**「规则/搜索为主 + NN 辅助」**；
4. 因此可执行路线排序：**c) NN 打分器 + 规则搜索（v0）→ b) 合成数据自建 ER 模拟（v1，需先建 ER battlesim）→ a) 原版迁移预训练（全程，作为先验）**。细节见 `NN配队方案.md`。

---

## 6. 混合架构先例汇总（「规则引擎 + NN 增强」）

| 先例 | 混合方式 | 对我们「规则引擎 v4.3 + NN」的借鉴 |
|---|---|---|
| **Laplace** | MCTS 为主 + NN 价值网仅 5–10% 回合 tie-breaker | 规则引擎产候选 → NN 只在「难分」时裁决 |
| **Oak** | 搜索评估 + NN policy 生成队伍 + PPO 构建 | 生成与评估解耦，评估用模拟胜率 |
| **OU Scanalizer** | 「两队→胜率」NN 做队伍替换建议 | 与我们的「队伍体检 + 位次分数」衔接最自然：NN 学引擎打分，再迭代改进 |
| **PokéChamp** | LLM 先验 + minimax 搜索 | 外部知识（统计/流派模板）约束搜索空间 |
| **Showdex** | 规则计算器 + 概率套装推断（UI 层混合） | 交互层「逐步收窄候选」先例 |
| **pkmn/randbats** | 采样 → 概率分布表（数据层） | ER 特性池 n 选 1 的先验生成方法 |

---

## 7. 未验证 / 风险登记（诚实登记）

| 项 | 状态 | 说明 |
|---|---|---|
| `insunity/Pokemon-Showdown-bots` | ❌ 不存在 | GitHub API 404；用户仅 1 个公开仓库且不含该名（学术与开源两路独立核验一致） |
| Berkeley CS188「Pokémon 项目」 | ❌ 不成立 | CS188 官方项目是 Pac-Man，非宝可梦 |
| `pmariglia/showdown` 旧仓库 | ⚠️ 已迁移 | 作者主项目为 `pmariglia/foul-play`，旧地址 301 跳转 |
| PokeHit 论文原文 URL | ⚠️ 待核实 | 仓库 https://github.com/Alfedi/PokeHit 可达，论文正式地址未确证 |
| IEEE《Team Recommendation for Pokémon GO》 | ⚠️ 待核实 | 仅命中镜像页，正式 DOI 未确证 |
| `professor-conifer/PsyMew` | ❌ 404 | 仅 Smogon 帖内可确认，作者无公开仓库 |
| `smogon/dex` | ❌ 404 | 官方文档提及但非公开；替代用 `pkmn/smogon` |
| PokeJAX 公开仓库 | ⚠️ 待核实 | 仅见于论文，未定位到可核验仓库 |
| Reddit 语料 | ⚠️ 未获取 | 两次定向检索空；Smogon 论坛已提供足够社区证据 |
| ER 是否有 Showdown fork/私服 | ⚠️ 未穷尽 | 常规检索未发现，GitHub Issues/Discord 未查 |
| `metamon.tech` 正文 | ⚠️ 部分 | "475k demonstrations" 来自检索片段，与 HF README "5.3M" 存在版本口径差 |
| Showdown 全站 replay 总量 | ⚠️ 无官方数字 | 第三方下界 ≈3.8M 场（Metamon 1.8M + PokéChamp 2M） |

---

## 8. 参考价值速查（对本项目五条主线）

1. **数据管线**：复用 Metamon 的 replay→轨迹重建思路（仓库 3 / 数据集 §4.2）+ poke-env 的 custom teambuilder 扩展点（§3.1）——为将来 ER 采集自有对局做准备；当前先用 Smogon chaos JSON 学「配招/队友分布」先验（§4.1）。
2. **队伍表征**：VGC-Bench 的 Transformer 队伍编码器（§2.1-②）是「整队 12 只当 token」的直接范本；v0 用 MLP 拼接 6×150 维特征即可起步。
3. **配队搜索**：GA + 自对弈适应度（§2.2-⑧⑩）是 ER 1906 物种组合爆炸的标准解法；「生成 + 搜索评估」优于纯生成（Oak 自述，§3.1）。
4. **架构取舍**：Nessie123 的 1.5M 参数估值网络（§3.4）与 Laplace 的「NN 少量介入」（§3.4）为「轻量模型 + 规则引擎辅助」提供实证；Metamon 式 2 亿参数大模型需要百万级数据，ER 场景不现实。
5. **UI/UX**：Showdex（§3.2）「面板/覆盖层双模式 + 自动收窄套装 + 移动端适配」与我们在 ER 配队工具上「禁止全屏弹窗、响应式」的原则一致，可作验收清单来源。
