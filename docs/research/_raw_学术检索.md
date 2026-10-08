# Pokémon 对战 AI / 配队 / 配招 —— 学术检索原始清单

> 检索日期：2026-10-07
> 用途：为「用神经网络拟合宝可梦配队决策」（目标环境：Pokémon Elite Redux，GBA 改版，无官方 Showdown 环境、规则差异大、玩家基数小）做前期调研
> 检索方式：`general_search` 多关键词并行检索（≤3 query/批）+ `web_fetch` 精读关键页面（arXiv 摘要页、pkmn.ai 项目目录、Foul Play 项目页）
> 收录原则：**每一条 URL 均来自实际检索/访问结果**；未能确证的条目标注「待核实」并说明
> 方法维度覆盖：强化学习（RL）、监督学习/模仿学习（IL）、进化/遗传算法（配队搜索）、Transformer/GNN 队伍表征、LLM Agent、minimax/MCTS 搜索

---

## 一、【学术论文】

### 1. Human-Level Competitive Pokémon via Scalable Offline Reinforcement Learning with Transformers
- **类型**：arXiv 预印本 / 会议论文（Reinforcement Learning Conference 2025）
- **URL**：https://arxiv.org/abs/2504.04395 ｜项目主页 https://metamon.tech/
- **一句话结论**：UT Austin（Jake Grigsby, Yuqi Xie, Justin Sasek, Steven Zheng, Yuke Zhu）从 Showdown 十余年公开 replay 中重建出超过 47.5 万条「第一人称视角」人类对局（附塑形奖励），按「模仿学习 → 离线 RL → 自对弈微调」三段式训练最大 2 亿参数的 Transformer，**不依赖任何显式搜索**，匿名排位打进 gen1–4 OU 前 10% 玩家。
- **对我们的参考价值**：这是「从 replay 直接拟合决策」最完整的范本——replay→状态重建→(观测, 动作, 奖励) 三元组的流水线可直接迁移；「先用序列模型学动作分布、再用 RL 微调」的两段式，恰好适合我们样本少、无法从头做自对弈的处境。

### 2. PokéChamp: an Expert-level Minimax Language Agent
- **类型**：会议论文（ICML 2025 Spotlight）
- **URL**：https://proceedings.mlr.press/v267/karten25a.html ｜代码 https://github.com/sethkarten/pokechamp
- **一句话结论**：Seth Karten / Andy Nguyen / Chi Jin（Princeton）用 LLM 替换 minimax 树搜索中的三个关键模块——对手动作采样、对手建模、价值函数估计——在 Showdown 上击败已有 LLM bot 与启发式 bot。
- **对我们的参考价值**：证明「不必端到端 RL」也能得到强决策：用预训练模型的先验知识 + 少量搜索即可。其「把对手隐藏队伍当成待估潜变量」的建模方式，对我们做对手预测/配队反制很有借鉴意义。

### 3. VGC-Bench: Towards Mastering Diverse Team Strategies in Competitive Pokémon
- **类型**：arXiv 预印本 / AAMAS 2026、（另有 Reinforcement Learning Journal 版本）
- **URL**：https://arxiv.org/abs/2506.10326 ｜代码 https://github.com/cameronangliss/VGC-Bench
- **一句话结论**：UT Austin（Cameron Angliss, Jiaxun Cui, Jiaheng Hu, Arrasy Rahman, Peter Stone）提出 VGC 双打基准，含 70 万+ 对战日志与 200K+ 推断队伍；策略网络用 **3 层 Transformer 编码器聚合 12 只宝可梦**（双方各 6 只）的招式/道具/特性嵌入，用 PPO + self-play / fictitious play / double oracle 训练。
- **对我们的参考价值**：**最直接可抄的「队伍级表征」架构**——把整队作为一组 token 过 Transformer 聚合，而非各只独立打分。这正是「神经网络拟合配队」最缺的那块：队伍（而非单体）的向量化。

### 4. The PokéAgent Challenge: Competitive and Long-Context Learning at Scale
- **类型**：arXiv 预印本 / 竞赛基准报告
- **URL**：https://arxiv.org/abs/2603.15563
- **一句话结论**：在 Showdown 上构建大规模决策基准（「对战」+「长上下文 RPG」两条赛道），扩展 Metamon 并发布 30 个覆盖不同水平段的 agent checkpoint 与 200K+ 队伍数据集。
- **参考价值**：若能跑通 Showdown，可直接把其 checkpoint 当预训练起点，省掉从零训练；其「从 replay 反推隐藏队伍」的做法对小玩家基数场景尤其实用。

### 5. POKÉLLMON: A Human-Parity Agent for Pokémon Battles with Large Language Models
- **类型**：arXiv 预印本
- **URL**：https://arxiv.org/abs/2402.01118
- **一句话结论**：首个在战术对战游戏中达到人类水平的 LLM agent，靠三项策略：in-context RL（用战斗文本反馈在线更新策略）、知识增强生成（检索外部知识抑制幻觉）、一致性机制。
- **参考价值**：「无梯度在线适应」路线——用少量历史对局做 in-context 更新即可，对没有十万级大盘数据的改版天然友好。

### 6. A Framework for Predicting the Impact of Game Balance Changes through Meta Discovery
- **类型**：arXiv 预印本（IEEE CoG 系）
- **URL**：https://arxiv.org/abs/2409.07340
- **一句话结论**：用「RL 对战 agent + 队伍生成器」预测 Showdown 平衡性改动的后果，对 meta 变化有高预测准确率；队伍生成器以「候选队伍 vs 大量人类队伍的自对弈胜率」为适应度。
- **参考价值**：其 team-builder 是配队搜索的标准范式（胜率作适应度）；对我们在改版里做「配队 → 平衡影响」验证有直接参考。

### 7. Teamwork under extreme uncertainty: AI for Pokémon ranks 33rd in the world
- **类型**：arXiv 预印本
- **URL**：https://arxiv.org/abs/2212.13338
- **一句话结论**：用**遗传算法**搜索队伍（适应度 = 候选队伍与大量人类队伍的自对弈胜率），配合启发式搜索，在 Gen7 Random Battles 打到世界第 33 名。
- **参考价值**：遗传算法 + 自对弈适应度是「配队搜索」最成熟的做法，特别契合我们离散、无梯度、候选空间大的场景。

### 8. A Self-Play Policy Optimization Approach to Battling Pokémon
- **类型**：会议论文（IEEE CoG 2019）
- **URL**：https://ieee-cog.org/2019/papers/paper_175.pdf
- **一句话结论**：在 gen7randombattle 上用自对弈策略优化训练，并给出明确的状态特征设计表（ability 238 维、moveset 4×731 维、lastmove、6 项连续数值）。
- **参考价值**：**现成的特征工程表**——招式/特性如何 one-hot、维度取多少，可照抄后改造。

### 9. Showdown AI Competition
- **类型**：会议论文（2017 IEEE Conference on Computational Intelligence and Games, CIG）
- **URL**：https://dl.acm.org/doi/10.1109/CIG.2017.8080435 ｜开放 PDF：https://game.engineering.nyu.edu/wp-content/uploads/2017/02/CIG_2017_paper_87-1.pdf
- **一句话结论**：S. Lee 与 J. Togelius 提出首个以 Pokémon 对战为题的 AI 竞赛，把「回合制 + 部分可观测 + 组队」确立为基准任务。
- **参考价值**：领域起点文献，说明评测范式（随机队伍 + 天梯胜率）自 2017 年已定型；其讨论中明确指出「宝可梦是新领域、训练数据稀缺」，与我们的困境一致。

### 10. VGC AI Competition - A New Model of Meta-Game Balance AI Competition
- **类型**：会议论文（IEEE CoG 2021）
- **URL**：https://ieee-cog.org/2021/assets/papers/paper_6.pdf
- **一句话结论**：把「meta-game 平衡」正式列为 AI 竞赛任务——AI 不仅对战，还要**选队伍、配招**；框架内含 Team Predictor（预测对手队伍）+ Selection Policy（据此选首发与后手）。
- **参考价值**：**把「配队」正式建模成待优化子问题**，与我们目标最接近；Team Predictor 的结构可直接参考。

### 11. PokeAI: A Goal-Generating, Battle-Optimizing Multi-agent System for Pokémon Red
- **类型**：arXiv 预印本
- **URL**：https://arxiv.org/abs/2506.23689
- **一句话结论**：多智能体系统（目标生成 + 战斗执行）在 Pokémon Red 场景 10 次实验平均胜率 80.8%，接近人类玩家水平。
- **参考价值**：证明「分层多 agent」架构可行，也提示在 GBA 类环境里做 AI 的现实路径（可对接我们自己的改版）。

### 12. PokaiTrainer: Scaling Equilibrium Search to Competitive Pokémon VGC
- **类型**：arXiv 预印本
- **URL**：https://arxiv.org/abs/2608.29197
- **一句话结论**：把均衡搜索扩展到 VGC，best-of-3 在 Showdown 天梯胜率 59%（对手均值约 1320 Elo），峰值进入该 format 前 500；论文强调「强度主要来自搜索，单靠策略网络连浅层启发式搜索都打不过」。
- **参考价值**：说明「搜索（均衡）+ 学到的价值网络」组合强于纯策略网络；我们若做配队评估器，价值估计的精度比策略的锐度更重要。

### 13. Large Language Models as Pokémon Battle Agents: Strategic Play and Content Generation
- **类型**：arXiv 预印本
- **URL**：https://arxiv.org/abs/2512.17308
- **一句话结论**：无需领域训练的 LLM 即可充当对手与内容生成器，并做了 30 人规模的人类对战体验实验。
- **参考价值**：若改版数据太少，零样本 LLM 可作为配队/对局的弱监督信号来源与冷启动方案。

### 14. Deep Reinforcement Learning for Pokemon Battling
- **类型**：课程项目论文（CS587）
- **URL**：https://kevin-ys-zhang.github.io/files/CS587_Project_Report.pdf
- **一句话结论**：实现并对比 REINFORCE / GIGA-WoLF / DQN / A2C 四种算法，DQN 大幅优于随机 agent；给出详细状态编码（招式基础威力、属性克制倍率、剩余数量等）。
- **参考价值**：**特征编码细节极其实用**（把属性克制写成 {0, 0.25, 0.5, 1, 2, 4}），是「轻量神经网络拟合决策」的现成模板。

### 15. Optimal Team Selection for Small-Scale Attrition Games Using a Hierarchical Intelligent Modeling Framework
- **类型**：课程项目（Stanford CS221 2018 poster）
- **URL**：https://web.stanford.edu/class/archive/cs/cs221/cs221.1192/2018/restricted/posters/karenl7/poster.pdf
- **一句话结论**：用 Q-learning + **遗传算法**联合求解小队最优选择，用 GA 处理组合爆炸、替代穷举。
- **参考价值**：「Q-learning 评估单体 + GA 搜组合」的分工清晰，可直接作为两阶段配队方案的骨架。

### 16. Learning Competitive Pokemon through Neural Network and Reinforcement Learning（Tse, Stanford CS230 2022）
- **类型**：课程项目（Stanford CS230）
- **URL**：http://cs230.stanford.edu/projects_spring_2022/reports/127608668.pdf
- **一句话结论**：先用 70 万条高排位 VGC 对战日志监督训练一个 6 层网络学状态嵌入，再把嵌入接到 DQN 做迁移；击败随机 / 最大伤害基线。
- **参考价值**：**最贴近我们目标的两段式流程**（监督预训练 → RL 微调）；并记录了重要教训——输入 4186 维直接训练会过拟合，改用第一层学到的 254 维嵌入才收敛。

### 17. Gotta Train 'Em All: Learning to Play Pokémon Showdown with Reinforcement Learning
- **类型**：课程项目（Stanford CS230 2018）
- **URL**：https://cs230.stanford.edu/projects_fall_2018/reports/12447633.pdf ｜代码 https://github.com/kvchen/showdown-rl
- **一句话结论**：用 PPO + 自定义 Gym 环境训练 gen1 random battle agent，3×512 全连接 + ReLU，并对无效动作做 logits 掩码。
- **参考价值**：明确点出「**无效动作掩码（invalid action masking）**」这一工程要点；也印证了「新领域训练数据稀缺，离线学习困难」——正是改版的处境。

### 18. XGBoost-Based Synergistic Partner Recommendation in Strategy Games
- **类型**：期刊论文（Applied and Computational Engineering）
- **URL**：https://ace.ewapub.com/article/view/27477.pdf
- **一句话结论**：用 XGBoost 做宝可梦配队协同推荐，融合数值种族值 + one-hot 属性 + **属性协同分**，AUC/精确率显著优于基线。
- **参考价值**：印证「属性协同特征」是配队最有效的显式特征之一；同时也说明**特征设计可能比模型容量更关键**（树模型也能配队）。

### 19. Team Recommendation for the Pokémon GO Game Using Optimization Approaches
- **类型**：会议论文（IEEE）— 「待核实」正式 DOI
- **URL**：https://xplorestaging.ieee.org/document/9291623/citations?tabFilter=papers （检索命中的镜像页；IEEE 正式 DOI 待确认）
- **一句话结论**：比较遗传算法（GA）、memetic 算法（MA）、迭代局部搜索（ILS）三种优化算法求解「最优队伍组合」，以时间与适应度为指标。
- **参考价值**：三种组合优化算法的横向比较，可直接指导我们选配队搜索算法。

### 20. Automatic Generation of High-Performance RL Environments
- **类型**：arXiv 预印本
- **URL**：https://arxiv.org/abs/2603.12145
- **一句话结论**：自动生成高性能 RL 环境，产出 PokeJAX——首个 GPU 并行宝可梦对战模拟器，比 Showdown 的 TypeScript 参考实现快约 22,320×。
- **参考价值**：若我们自建改版训练环境，说明「自建高速模拟器」是训练量的瓶颈突破口；也说明 Showdown 本身并非为 RL 设计。

### 21. Exploring the Integration of Large Language Models and Monte Carlo Tree Search in Team Formation for Turn-Based Games: a case-study with the VGC AI Competition（PokeHit）
- **类型**：论文/项目（2024）—「待核实」原文 URL
- **URL**：代码 https://github.com/Alfedi/PokeHit （经 pkmn.ai 项目目录索引；论文原文地址待核实）
- **一句话结论**：把 LLM 与 MCTS 结合，用于回合制游戏的**队伍组建**任务（VGC AI Competition 案例）。
- **参考价值**：目前少见的、明确以「队伍组建」为任务本身的 LLM+MCTS 工作，与我们的配队目标高度重合。

---

## 二、【课程项目 / 学术仓库】

### 1. hsahovic/poke-env
- **类型**：学术开源库（RL 框架）
- **URL**：https://github.com/hsahovic/poke-env ｜文档 https://poke-env.readthedocs.io/
- **一句话结论**：Haris Sahovic 开发的 Showdown Python RL 接口，是近年几乎全部学术工作的底座（Metamon、VGC-Bench、PokeAgent 均基于它），支持单/双打、Gen IV–IX、自对弈、动作掩码、自定义 teambuilder。
- **参考价值**：若走「用 Showdown 近似环境」路线，这是首选底座；其 **custom teambuilder 接口**可直接挂接我们的配队生成逻辑。

### 2. pmariglia/foul-play（前身 pmariglia/showdown）
- **类型**：学术开源仓库（搜索型 bot）
- **URL**：https://github.com/pmariglia/foul-play ｜项目说明 https://pmariglia.github.io/posts/foul-play/
- **一句话结论**：自研 Rust 引擎 poke-engine + 根并行 MCTS（用 DUCT 处理同时行动），gen9ou 达 1879 Elo / Top 100，gen9randombattle 88% GXE / Top 50，多个 format 登顶。
- **参考价值**：其「隐藏信息推理」章节（用伤害反推对方数值、用出手顺序反推速度、用天气持续回合反推道具）是**对手建模/配队反推的实用技巧库**。

### 3. UT-Austin-RPL/metamon
- **类型**：学术开源仓库
- **URL**：https://github.com/UT-Austin-RPL/metamon ｜ https://metamon.tech/
- **一句话结论**：上表论文 1 的官方实现，含 replay 重建流水线、47.5 万人类对局数据集与多种规模 checkpoint。
- **参考价值**：可直接复用其「replay → (obs, action, reward)」重建脚本思路，改造到我们自己的对局录像上。

### 4. sethkarten/pokechamp
- **类型**：学术开源仓库
- **URL**：https://github.com/sethkarten/pokechamp
- **一句话结论**：ICML 2025 Spotlight 论文官方仓库，LLM + minimax 对战 agent 实现。
- **参考价值**：提供「LLM 做对手建模 / 价值估计」的可读实现，可作为非 RL 路线的对照。

### 5. cameronangliss/VGC-Bench
- **类型**：学术开源仓库 + 数据集
- **URL**：https://github.com/cameronangliss/VGC-Bench
- **一句话结论**：VGC 基准官方实现，含 PPO + self-play / fictitious play / double oracle 训练代码、70 万对战日志与 200K+ 队伍数据集。
- **参考价值**：**队伍级 Transformer 编码器的参考实现**，我们的「队伍评估器」可借鉴其聚合方式。

### 6. kvchen/showdown-rl
- **类型**：课程项目开源仓库（Stanford CS230）
- **URL**：https://github.com/kvchen/showdown-rl
- **一句话结论**：PPO gen1 bot，含 gym-showdown 环境、代理服务器与 notebook。
- **参考价值**：工程结构清晰，适合快速理解「bot ↔ Showdown 服务器」如何对接。

### 7. alexzhang13/reward-shaping-rl
- **类型**：学术开源仓库
- **URL**：https://github.com/alexzhang13/reward-shaping-rl
- **一句话结论**：用 LLM 迭代生成奖励函数做 reward shaping 并应用于 Showdown，提升样本效率。
- **参考价值**：若我们做 RL，**奖励设计是最大难点**；用 LLM 生成中间奖励是一条省力替代路径。

### 8. caymansimpson/reuniclusVGC
- **类型**：学术开源仓库
- **URL**：https://github.com/caymansimpson/reuniclusVGC
- **一句话结论**：把 poke-env 的双打支持扩展到 Gen8 VGC，用小型 DQN 在固定队伍上训练，最终约等于 MaxDamagePlayer 水平。
- **参考价值**：双打（多目标、同时行动）的工程处理参考。

### 9. rameshvarun/showdownbot（Percymon）
- **类型**：学术开源仓库（首篇论文级 bot）
- **URL**：https://github.com/rameshvarun/showdownbot
- **一句话结论**：2014–2017，**首个被论文描述的竞技宝可梦 AI**；纯 depth-2 悲观序贯化 minimax + 手工估值函数，打 Gen6 Random Battle。
- **参考价值**：手工估值函数写法的「祖师爷」，可作为我们 baseline 估值函数的蓝本。

### 10. vasumv/pokemon_ai
- **类型**：学术开源仓库
- **URL**：https://github.com/vasumv/pokemon_ai
- **一句话结论**：2014–2016，depth-2 determinized minimax + alpha-beta + 手工估值；含较完整的**队伍预测**（从 Smogon 数据 + 天梯 replay 库做 Bayesian 推 moveset）。
- **参考价值**：对手建模经典实现（P(Move|Move)、P(Move|Species∧Move)），是「用统计反推配招」的入门范本。

### 11. pkmn.ai/projects（项目目录）
- **类型**：学术资源目录（策展型）
- **URL**：https://pkmn.ai/projects/
- **一句话结论**：系统性收录 2003–2025 年宝可梦 AI 项目，每条附论文标题、引擎、语言、平台与指标说明（含 IHTFP Abra、Metamon、Tse、alphaPoke、PokeHit、Percymon、SutadasutoIA、Bill's PC、Deep Red 等）。
- **参考价值**：**一次性的「文献地图」**，强烈建议作为后续综述的索引来源，避免重复检索。

### 12. Erdős Institute Data Science Boot Camp — Pokémon Battle AI（2024）
- **类型**：课程 / 训练营项目
- **URL**：https://www.erdosinstitute.org/_files/ugd/39bf20_ba8a68d365e0430da29b08fdf7d02475.pdf
- **一句话结论**：用神经网络预测对战结果，首版 NN 准确率 61%；随后发现模型**过度依赖双方剩余总 HP**，去偏后降到 55%。
- **参考价值**：一个诚实的「踩坑」记录——强特征（总 HP）会淹没细粒度配队信号，**提醒我们在特征里做去偏/归一化**。

### 13. Vanier College — Using an AI Model & A Neural Network to Predict Outcomes of Pokemon Battles（2021）
- **类型**：课程项目
- **URL**：https://gauss.vaniercollege.qc.ca/~iti/proj/2021/AK_pokemon.pdf
- **一句话结论**：假设「神经网络可判定最佳 3v3 队伍」，用神经网络预测对战结果作为队伍优劣代理。
- **参考价值**：小型课程项目的完整方法论，适合快速原型参考。

### 14. Stanford Compression Forum — Exploring AI and Statistical Physics with Pokémon（2024）
- **类型**：课程 / 工作坊项目
- **URL**：https://compression.stanford.edu/sites/g/files/sbiybj26591/files/media/file/shtem_2024_exploring_ai_and_statistical_physics_with_pokemon.pdf
- **一句话结论**：把宝可梦对战当作统计物理/RL 的玩具模型，并计划引入 PPO 提升训练效率。
- **参考价值**：提供「把配队当统计力学系统」的另一视角，启发有限但可拓宽思路。

### 15. OU Scanalizer — AI/ML teambuilding tool for SV OU（Smogon）
- **类型**：玩家社区 AI 工具（半学术）
- **URL**：https://www.smogon.com/forums/threads/wip-introducing-ou-scanalizer-ai-ml-teambuilding-tool-for-sv-ou.3788836/
- **一句话结论**：两个模型——6v6「两队→胜率」预测模型 +「1v1 单挑胜负」预测模型，用于评估队伍与给出替换建议。
- **参考价值**：**与「神经网络拟合配队决策」最接近的落地形态**：直接学「两队 → 胜率」映射，可作为我们评估器 head 的设计参考。

### 16. Jaxcalibur（Smogon）— Gen 9 Randbats bot
- **类型**：社区开源 bot（AlphaZero 式）
- **URL**：https://www.smogon.com/forums/threads/jaxcalibur-a-gen-9-randbats-bot-that-reached-1-on-the-ladder.3787537/
- **一句话结论**：自对弈 RL + pUCT 搜索（类 AlphaGo Zero），基于 poke-env + Jax，登顶 Gen9 Randbats 天梯。
- **参考价值**：证明「神经网络（策略+价值）+ 搜索」在宝可梦上可行，Jax 实现可供性能参考。

### 17. Nessie123（Smogon）— VGC Reg M-C bot
- **类型**：社区开源 bot
- **URL**：https://www.smogon.com/forums/threads/nessie123-an-ots-vgc-bot-that-topped-the-reg-m-c-bo3-ladder.3789213/
- **一句话结论**：约 150 万参数估值网络 + 自对弈（约 20 小时本机 + 云端算力），登顶 VGC Reg M-C Bo3 天梯。
- **参考价值**：给出「**1.5M 参数就够**」的现实规模参考，对算力有限的项目非常友好。

### 18. Oak / Safari（Smogon）— RBY AlphaZero 系
- **类型**：社区开源项目
- **URL**：https://www.smogon.com/forums/threads/stockfish-for-rby.3770936/
- **一句话结论**：小规模战斗网络（MLP，每秒几十万次推理）+ MCTS，网络含 policy head 预测招式；Safari 进一步扩展到不完全信息 MCTS。
- **参考价值**：「**MLP + 一热表格编码 + 价值/策略双头**」的极简架构，训练成本低，适合小改版冷启动。

### 19. Synedh/showdown-battle-bot
- **类型**：社区开源仓库（早期经典）
- **URL**：（经 pkmn.ai 项目目录与其他文献索引；仓库直链待核实）https://pkmn.ai/projects/
- **一句话结论**：2016–2023 的早期 Showdown bot，是 hsahovic 早期 RL bot 的直接灵感来源。
- **参考价值**：作为「早期基线实现」的参考，说明最小可用 bot 的构成。

### 20. Sutadasuto/SutadasutoIA（Expert System Suitable for RPGs, Case: Pokémon）
- **类型**：论文 + 开源仓库（专家系统）
- **URL**：（经 pkmn.ai 项目目录索引）https://pkmn.ai/projects/
- **一句话结论**：基于知识的专家系统，针对简化版 Gen6 BSS（无状态招式/EV/道具），用爬山算法在换人间优化队伍选择。
- **参考价值**：**「回合间用爬山算法迭代优化队伍」**的思路，正是配队从静态走向动态的雏形。

---

## 三、【未找到 / 待核实】

以下条目不硬凑，如实标注：

| 条目 | 状态 | 说明 |
| --- | --- | --- |
| `insunity/Pokemon-Showdown-bots`（2014 经典 bots 集，含 RL 示例） | **未找到** | 多轮检索（含 "insunity"、"insunity Pokemon-Showdown-bots" 等）均未命中该仓库或作者。2014 年前后最接近的「经典 bots 集」实为 `vasumv/pokemon_ai`（2014–2016，见【学术仓库】10）、`Synedh/showdown-battle-bot`（2016–2023，见 19）以及 Percymon `rameshvarun/showdownbot`（见 9）。用户给出的该线索**疑似记错**，建议复核来源。 |
| Berkeley CS188 的 Pokémon AI 课程项目 | **未找到** | 检索确认 CS188 官方课程项目是 **Pac-Man（吃豆人）** 系列（Project 1 搜索 / Project 2 多智能体搜索 / Project 3 强化学习 / Project 4 Ghostbusters），**并非宝可梦**。相关 URL：https://inst.eecs.berkeley.edu/~cs188/sp24/projects/ |
| `pmariglia/showdown` 仓库本体 | **待核实** | 该地址被早期论文（如 shatayu.co 的 Honors Project、toolerific 目录）引用为「Python 对战 bot，支持 Gen3–8，含 Safest / Nash-Equilibrium / Most Damage 等实现」；但作者当前主项目已迁移为 `pmariglia/foul-play`。旧仓库可访问性与是否已归档待核实。 |
| PokeHit 论文原文 URL | **待核实** | 论文标题《Exploring the Integration of Large Language Models and Monte Carlo Tree Search in Team Formation for Turn-Based Games: a case-study with the VGC AI Competition》经 pkmn.ai 目录索引；代码仓库 https://github.com/Alfedi/PokeHit 可访问，论文正式 URL 未确证。 |
| IEEE《Team Recommendation for the Pokémon GO Game Using Optimization Approaches》 | **待核实** | 检索仅命中 IEEE 镜像页（https://xplorestaging.ieee.org/document/9291623/...），正式 DOI/出版信息待确认。 |

---

## 四、对本项目的启示（小结）

结合 Elite Redux（GBA 改版、无官方 Showdown、规则差异大、玩家基数小）的具体处境：

1. **两条主路线都有成熟先例**：
   - **监督学习 / 模仿学习**（从 replay 拟合决策）：论文 1（Metamon）、16（Tse CS230）是最直接对标；
   - **强化学习 / 搜索**：论文 7（GA 配队）、12（均衡搜索）、仓库 2（Foul Play MCTS）、16/17（AlphaZero 式 bot）。

2. **配队（而非配招）的专门方法**：
   - 遗传算法 + 自对弈适应度（论文 7、15）是主流；
   - 论文 10 的「Team Predictor + Selection Policy」把配队形式化为独立子问题；
   - 最贴近「神经网络拟合配队」的落地形态是 **OU Scanalizer（仓库 15）** 的「两队→胜率」模型。

3. **最值得借鉴的架构**：**VGC-Bench（论文 3 / 仓库 5）的 Transformer 队伍编码器**——把整队 12 只作为 token 聚合，正好解决「队伍级向量化」问题。

4. **现成可抄的特征工程**：论文 8（IEEE CoG 2019 特征表）、论文 14（CS587 状态编码，属性克制写 {0, 0.25, 0.5, 1, 2, 4}）、论文 18（属性协同分）。

5. **必须警惕的坑**：论文 16 记录的「4186 维输入直接过拟合」、仓库 12 的「模型被剩余总 HP 主导」，都指向同一个教训——**改版场景下特征维度与去偏比模型容量更关键**。

6. **数据来源问题**：Showdown replay 是绝大多数论文的数据基础；改版无此资源，可考虑（a）用 LLM 零样本作弱监督（论文 13、5）；（b）自建高速模拟器（论文 20）；（c）in-context 在线适应（论文 5）；（d）从玩家对局录像自建 replay 流水线（复用仓库 3 的重建思路）。

---

*本清单所有条目均来自 2026-10-07 的实际检索结果；标注「待核实」的条目请在使用前二次确认。*
