# v4.377：向 skill references 追加 v4.377 结论（engine-map.md / gates.md）
base = r"C:\Users\22210\AppData\Local\Doubao\User Data\Default\.doubao\agent_mode\workspace\.user_skills\er-teambuilder-dev\references"

# ---- engine-map.md：新增 v4.377 锚点 ----
em = base + r"\engine-map.md"
d = open(em, "rb").read()
nl = b"\n"
em_add = """
## v4.377 新增锚点（Grep 重取行号）

- 反伤资格门分侧（counter_mirror，约 index 14361）：旧 `(Atk<70||SpA<70)` OR 跨攻击种族误纳高物攻手；改为按主招分侧——`mv0===68`（物理双倍奉还）查 Atk<70、`mv0===243`（镜面反射）查 SpA<70、`mv0===368`（金属爆炸）保留 OR。
- 会心流判定实际招式：会心降权检查与狙击手 why 两处旧用 `learnOf(s)`（全学习集），改用 `ctx.mvCtx`（流派实际招式），无 ctx 回退 learnOf。
- 技术高手威力折算（选招威力门之前）：物种含技术高手（inn id 101）且招基础威力 1–60 → `pow*1.5`，变量前缀 `_tn377`、catch `eTn377`，再过 `<55` 硬门。旧引擎在折算前就 `if(pow<55)return`，子弹拳（id418，40→60）从未被评估。
- 关键：ER 招式威力与原版不同，以数据 why 里的有效威力为准。碎岩 249 ER 基础 60（非原版40）、劈瓦 280 ER 基础 85（非原版75）、居合劈 15 基础 60；小偷/咬住为非先制招。
- #1518 修复后仅 1 流派「顺风强化清场」：近身战370/钢翼211/剑舞14/顺风366，首推蜕皮（狙击手 sc=-3）、首道具厚底靴、EV[252,252,4,0,0,0]固执；子弹拳在候选池（评分239.47）但默认四招不含（钢翼261.36更高、顺风已解决速度）。
"""
if not d.endswith(nl):
    d = d + nl
d = d + em_add.encode("utf-8")
open(em, "wb").write(d)
print("engine-map lines now", d.count(nl))

# ---- gates.md：新增 v4.377 门禁台账 ----
gm = base + r"\gates.md"
d = open(gm, "rb").read()
gm_add = """
## 九、v4.377 巨钳螳螂三处判定缺陷（别再重扫）

- 反伤分侧门：全库 113 个误纳反伤流派清除（95 物理 Counter + 18 Mirror Coat），流派总数 4328→4215。offHist 0:275/1:789/2:555/3:235/4:48/5:3/7:1，加权求和差恰好 113，与删除反伤流闭合，无额外回归。
- 会心实际招式：17 个首推会心流特性里 16 个误推纠正（大针蜂/大嘴雀/乌鸦头头/扒手猫等）。
- 技术高手威力折算：66 个技术高手物种的 37–54 威力招（×1.5 后可过 55 线）进入评估；22 处配招变化逐招核对有效威力全部正确，无弱招换强招回归。
- 门禁基线（v4.377）：物种 1906 / 流派 4215，empty 空、fatal 0、badMove 1、dup 0、itemsOver 0、defOrb 0。
- 口径：ER 威力与原版不同（碎岩 ER 基础60、劈瓦85），以数据 why 为准；子弹拳进池但默认不选（数据驱动，顺风已解决速度），不强制塞先制招。
"""
if not d.endswith(nl):
    d = d + nl
d = d + gm_add.encode("utf-8")
open(gm, "wb").write(d)
print("gates lines now", d.count(nl))
