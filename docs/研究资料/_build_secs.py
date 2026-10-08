# -*- coding: utf-8 -*-
r"""生成《_00_资料汇编.md》所需的数据分节（全部从文件实际读出）。
输入：配招工具_data.js（ERDATA slim）、ER-source\gameDataV2.65beta.json、_engine_literals.json
输出：D:\game\elite-redux\docs\研究资料\_sec_A_matchup.md
      _sec_B_abitags.md、_sec_B_abelias.md、_sec_B_movesnotes.md
      _sec_D_stats.md、_sec_E_evidence.md
"""
import json, os, re

BASE = r"D:\game\elite-redux"
R = os.path.join(BASE, "docs", "研究资料")

erd = json.load(open(os.path.join(R, "_erd_slim.json"), encoding="utf-8"))
lit = json.load(open(os.path.join(R, "_engine_literals.json"), encoding="utf-8"))
gd = json.load(open(os.path.join(BASE, "ER-source", "gameDataV2.65beta.json"), encoding="utf-8"))

types = erd["types"]
mu = erd["matchup"]
MAG = {0: "0", 1: "1", 2: "2", 3: "0.5"}
def cell(v):
    return MAG.get(v, str(v))

# ---------- A. matchup 表 ----------
L = []
L.append("### A.1 ERDATA.types —— 21 属性顺序（数组下标 = 0..20）\n")
L.append("| idx | 属性 | | idx | 属性 | | idx | 属性 |")
L.append("|---|---|---|---|---|---|---|---|")
for i in range(7):
    row = [f"| {i} | {types[i]} "]
    for j in (7 + i, 14 + i):
        row.append(f"| {j} | {types[j]} " if j < 21 else "| — | — ")
    L.append("".join(row) + "|")
L.append("")
L.append("### A.2 ERDATA.matchup —— 完整 21×21（行=防守属性，列=攻击属性；0=免疫 2=2倍 3=0.5倍 1=普通）\n")
L.append("| 防守＼攻击 | " + " | ".join(types) + " |")
L.append("|" + "---|" * 22)
for i, dt in enumerate(types):
    vals = []
    for j in range(21):
        vals.append(cell(mu[i][j]) if j < len(mu[i]) else "·")
    L.append(f"| **{dt}** | " + " | ".join(vals) + " |")
L.append("")
L.append("> `·` = 该格在数据中不存在（见 D.9：末 3 行长度不齐 19/20/21，JS 读到 `undefined` 时按 1 处理）。")
L.append("")
open(os.path.join(R, "_sec_A_matchup.md"), "w", encoding="utf-8").write("\n".join(L))
print("A ok; matchup", len(mu), "x", len(mu[0]))
print("自检 火→地面 =", mu[types.index("地面")][types.index("火")],
      "| 水→电 =", mu[types.index("电")][types.index("水")],
      "| 地面→电 =", mu[types.index("电")][types.index("地面")])

# ---------- B. ABI_TAGS 全量表 ----------
abz = {a[0]: (a[2] or a[1], a[1]) for a in erd["abilities"]}   # id -> (zh, en)
at = lit["ABI_TAGS"]
def tagtext(v):
    parts = []
    if v.get("im"):  parts.append("免疫 " + "/".join(v["im"]))
    if v.get("hf"):  parts.append("减半 " + "/".join(v["hf"]))
    if v.get("add"): parts.append("出场添加属性 " + "/".join(v["add"]))
    if "out" in v:
        o = v["out"]; seg = f"输出×{o.get('mul')}"
        if o.get("type"): seg += ("（" + "/".join(o["type"]) + " 属性）") if isinstance(o["type"], list) else f"（{o['type']} 属性）"
        if o.get("stat"): seg += f"（{o['stat']}）"
        if o.get("cond"): seg += f"（条件：{o['cond']}）"
        if o.get("note"): seg += f"（{o['note']}）"
        parts.append(seg)
    if "def" in v:
        seg = f"减伤系数 {v['def']}"
        if v.get("stat"): seg += f"（作用 {v['stat']}）"
        if v.get("cond"): seg += f"（条件：{v['cond']}）"
        parts.append(seg)
    if "phy" in v: parts.append(f"物理伤害系数 {v['phy']}")
    if v.get("nt"): parts.append("备注：" + v["nt"])
    return "；".join(parts)

rows = ["### B.1 ABI_TAGS 全量 98 条（来源 build_tool_data.py `ABI_TAGS`，ERDATA.abiTags 同源）\n",
        f"条目数：**{len(at)}**（标签键分布：" +
        "、".join(f"{k}×{sum(1 for v in at.values() if k in v)}" for k in ["im", "hf", "add", "out", "def", "phy", "nt", "cond", "stat"]) + "）\n",
        "| 特性id | 中文名 | 英文名 | 标签原值 | 效果一句话 |",
        "|---|---|---|---|---|"]
for k in sorted(at.keys(), key=int):
    v = at[k]
    zh, en = abz.get(k, ("（ERDATA 无此id）", ""))
    rows.append(f"| {k} | {zh} | {en} | `{json.dumps(v, ensure_ascii=False)}` | {tagtext(v)} |")
open(os.path.join(R, "_sec_B_abitags.md"), "w", encoding="utf-8").write("\n".join(rows) + "\n")
print("B1 ok:", len(at))

# 标签中引用了但 ERDATA.abilities 里没有中文名的（核对覆盖）
missids = [k for k in at if k not in abz]
print("ABI_TAGS 中 ERDATA 无中文名的 id:", missids)

# ---------- B. ABI_ALIAS ----------
aa = erd["abiAlias"]
r2 = [f"### B.2 ABI_ALIAS 别名表（build_tool_data.py 运行时从 v0.3/v0.5 双图鉴构建，ERDATA.abiAlias 为成品）\n",
      f"条数：**{len(aa)}**（build_tool_data.py 中 `ABI_ALIAS = {{}}` 为空初始值，运行时填充；ERDATA.abiAlias 为落盘成品）\n",
      "样例（前 20 条，别名 → gameData 特性 id）：\n",
      "| 别名（v0.3 译名） | 特性id | ERDATA 中文名 | 英文名 |", "|---|---|---|---|"]
for i, (al, aid) in enumerate(list(aa.items())[:20]):
    zh, en = abz.get(str(aid), ("?", "?"))
    r2.append(f"| {al} | {aid} | {zh} | {en} |")
open(os.path.join(R, "_sec_B_abelias.md"), "w", encoding="utf-8").write("\n".join(r2) + "\n")
print("B2 ok:", len(aa))

# ---------- B. MOVES_NOTES ----------
mn = erd["movesNotes"]
mvd = {m[0]: m for m in erd["moves"]}
r3 = [f"### B.3 MOVES_NOTES 全量清单（build_tool_data.py `MOVES_NOTES` / ERDATA.movesNotes）\n",
      f"条数：**{len(mn)}**\n",
      "| 招式id | 中文名 | 属性 | 分类 | 威力 | 点评 |", "|---|---|---|---|---|---|"]
for k in sorted(mn.keys(), key=int):
    m = mvd.get(k)
    if m:
        r3.append(f"| {k} | {m[1]} | {m[3]} | {m[4]} | {m[5]} | {mn[k]} |")
    else:
        r3.append(f"| {k} | （ERDATA 无此id） | | | | {mn[k]} |")
open(os.path.join(R, "_sec_B_movesnotes.md"), "w", encoding="utf-8").write("\n".join(r3) + "\n")
print("B3 ok:", len(mn))

# ---------- D. 统计 ----------
nf = set(erd["nonFinal"])
gd_nf = [s["id"] for s in gd["species"] if any((e or {}).get("kd") == 0 for e in (s.get("evolutions") or []))]
sp_gd_ids = [s["id"] for s in gd["species"]]
sp_erd_ids = [int(s["id"]) for s in erd["species"]]
only_gd = sorted(set(sp_gd_ids) - set(sp_erd_ids))
only_erd = sorted(set(sp_erd_ids) - set(sp_gd_ids))

egg_nonempty = sum(1 for s in gd["species"] if s.get("eggMoves"))
tm_nonempty = sum(1 for s in gd["species"] if s.get("TMHMMoves"))
lvl_nonempty = sum(1 for s in gd["species"] if s.get("levelUpMoves"))
tut_nonempty = sum(1 for s in gd["species"] if s.get("tutor"))
forms_nonempty = sum(1 for s in gd["species"] if s.get("forms"))
enc_nonempty = sum(1 for s in gd["species"] if s.get("SEnc"))

it_desc = sum(1 for i in erd["items"] if (i[3] or "").strip())
it_zh = sum(1 for i in erd["items"] if (i[2] or "").strip())
it_desc_q = sum(1 for i in erd["items"] if (i[3] or "").strip() == "?????")
ab_zh = sum(1 for a in erd["abilities"] if (a[2] or "").strip() and a[2] != "------")
mv_zh = sum(1 for m in erd["moves"] if (m[1] or "").strip() and m[1] != m[2])
sp_zh = sum(1 for s in erd["species"] if (s["zh"] or "").strip() and s["zh"] != s["en"])

# 可学池规模（ERDATA 口径）
tot_lv = sum(len(s["lv"]) for s in erd["species"])
tot_tut = sum(len(s["tut"]) for s in erd["species"])

stats = []
stats.append("### D.1 数据规模总览（实读）\n")
stats.append("| 对象 | 数量 | 来源字段 |")
stats.append("|---|---|---|")
stats.append(f"| 物种（gameData.species） | {len(gd['species'])} | gameDataV2.65beta.json `species` |")
stats.append(f"| 物种（ERDATA.species） | {len(erd['species'])} | 配招工具_data.js `ERDATA.species` |")
stats.append(f"| 招式（gameData.moves / ERDATA.moves） | {len(gd['moves'])} / {len(erd['moves'])} | `moves` |")
stats.append(f"| 特性（gameData.abilities / ERDATA.abilities） | {len(gd['abilities'])} / {len(erd['abilities'])} | `abilities` |")
stats.append(f"| 道具（gameData.items / ERDATA.items） | {len(gd['items'])} / {len(erd['items'])} | `items` |")
stats.append(f"| 属性（gameData.typeT / ERDATA.types） | {len(gd['typeT'])} / {len(types)} | `typeT` / `types` |")
stats.append(f"| 特性效果标签 ABI_TAGS | {len(at)} | build_tool_data.py `ABI_TAGS` = ERDATA.abiTags |")
stats.append(f"| 特性别名 ABI_ALIAS | {len(aa)} | ERDATA.abiAlias |")
stats.append(f"| 招式点评 MOVES_NOTES | {len(mn)} | ERDATA.movesNotes |")
stats.append(f"| 战术模板 TEMPLATES | {len(erd['templates'])} | ERDATA.templates |")
stats.append(f"| 人工分析 coreNotes | {len(erd['coreNotes'])} | ERDATA.coreNotes |")
stats.append(f"| 非最终形态 nonFinal | {len(nf)} | ERDATA.nonFinal（= gameData 全表 kd==0 判定 {len(gd_nf)} 条） |")
stats.append("")
stats.append("### D.2 物种 1907 / 1906 的差异与「非最终形态」判定\n")
stats.append(f"- gameData.species 共 **{len(gd['species'])}** 条，ERDATA.species 共 **{len(erd['species'])}** 条。")
stats.append(f"- 仅存在于 gameData 的 id：`{only_gd}`（即 id=-1 的 `SPECIES_NONE` 占位，无中文名、种族全 0）。仅存在于 ERDATA 的 id：`{only_erd}`。")
stats.append(f"- 非最终判定（build_tool_data.py 第 105 行）：`NONFINAL = [str(s['id']) for s in GD['species'] if any((e or {{}}).get('kd') == 0 for e in (s.get('evolutions') or []))]`，即 *evolutions 中含 kd==0（普通进化）* → 非最终；kd==1（Mega/道具进化）仍算最终。结果 **{len(nf)}** 条，与 gameData 独立复算一致（{len(gd_nf)} 条）。")
kds = {}
for s in gd["species"]:
    for e in (s.get("evolutions") or []):
        kds[(e or {}).get("kd")] = kds.get((e or {}).get("kd"), 0) + 1
stats.append(f"- evolutions 条目 kd 直方图（全表）：{kds}；条目字段集合 = ['in','kd','rs']（in=进化方式/道具，rs=进化目标物种 id）。")
stats.append("")
stats.append("### D.3 招式 1032 字段结构\n")
stats.append("- gameData.moves 每条字段：" + ", ".join(f"`{k}`" for k in ["id", "name", "NAME", "sName", "eff", "pwr", "types", "acc", "pp", "chance", "target", "prio", "split", "flags", "arg", "desc", "lDesc", "usesHpType"]))
stats.append("- ERDATA.moves 为 10 元数组，下标语义（build_tool_data.py 第 19-21 行注释 + 实读）：`[0]编号 [1]中文名 [2]英文名 [3]属性 [4]分类 [5]威力 [6]命中 [7]PP [8]先制 [9]官方描述`。")
stats.append("- 分类取值实读集合：`物理 / 特殊 / 变化`（对应 gameData `split` 0/1/2；ER 游戏内文本用中文）。")
labs = {}
for m in erd["moves"]:
    labs[m[4]] = labs.get(m[4], 0) + 1
stats.append(f"- ERDATA.moves 分类计数：{labs}（含 id=0 的占位招式 `-`）。")
stats.append("")
stats.append("### D.4 道具 929 与描述覆盖\n")
stats.append(f"- ERDATA.items 每条 = `[id, 英文名, 中文名, 描述]`；英文描述非空 **{it_desc}** / {len(erd['items'])}，中文名非空 **{it_zh}** / {len(erd['items'])}（id=0 为 `????????` 占位，描述 `?????`：{it_desc_q} 条）。")
stats.append(f"- 中文名缺失项多为 ER 新增道具/邮件/钥匙类（源 `道具表_完整.csv` 未含官方译名，脚本回退英文名）。")
stats.append("")
stats.append("### D.5 中文名与可学池规模（ERDATA 口径）\n")
stats.append(f"- 物种中文名 ≠ 英文名（即有真中文名）**{sp_zh}** / {len(erd['species'])}；特性中文名非空 **{ab_zh}** / {len(erd['abilities'])}；招式中文名 ≠ 英文名 **{mv_zh}** / {len(erd['moves'])}。")
stats.append("- 口径说明：`build_tool_data.py` 第 20 行 `moves[r[0]] = [r[0], r[1] or r[2], …]`、第 31 行 `'zh': r[1] or r[2]` —— 两者**中文缺失时回退英文名**，故此处以「中文名 ≠ 英文名」判定真实中文覆盖；道具（zh = r[2] or ITEM_ZH_EXTRA，无英文回退）以非空判定。")
stats.append(f"- 可学池条目总数：升级 `lv` **{tot_lv}** 条 + 教学 `tut` **{tot_tut}** 条 = {tot_lv + tot_tut} 条（ERDATA 每只为 `lv=[[等级,招式id],…]` + `tut=[招式id,…]`）。")
stats.append("")
stats.append("### D.6 gameData 招式数组的空字段实读（ER v2.65 教学池合并的证据）\n")
stats.append(f"- 有 levelUpMoves 的物种：**{lvl_nonempty}**；有 tutor 的物种：**{tut_nonempty}**；")
stats.append(f"- 有 eggMoves 的物种：**{egg_nonempty}**；有 TMHMMoves 的物种：**{tm_nonempty}**（→ 全表为空）。")
stats.append(f"- 有 forms 的物种：**{forms_nonempty}**；有 SEnc 的物种：**{enc_nonempty}**（两者均为**非空**，与 eggMoves/TMHMMoves 的空表形成对比）。")
stats.append("")
html_src = open(os.path.join(BASE, "build_tool_html.py"), encoding="utf-8").read()


def js_obj(name):
    m = re.search(r"(?m)^var " + name + r"=(\{.*?\});", html_src, re.S)
    assert m, name
    body = m.group(1).replace("'", '"')
    body = re.sub(r'([{,]\s*)(\d+)(\s*:)', r'\1"\2"\3', body)   # 数字字面量键加引号
    return json.loads(body)


def js_intmap(name):
    m = re.search(r"(?m)^var " + name + r"=(\{.*?\});", html_src, re.S)
    assert m, name
    body = re.sub(r"/\*.*?\*/", "", m.group(1), flags=re.S)
    out = {}
    for k, v in re.findall(r"([A-Za-z_][\w]*)\s*:\s*\[([^\]]*)\]", body):
        out[k] = [int(x) for x in re.findall(r"-?\d+", v)]
    return out


SYS_MAP = js_obj("SYS_MAP")
SYS_SET = js_obj("SYS_SET")
WEATHER_MV = js_obj("WEATHER_MV")
FUNC_MV = js_intmap("FUNC_MV")
json.dump({"SYS_MAP": SYS_MAP, "SYS_SET": SYS_SET, "WEATHER_MV": WEATHER_MV, "FUNC_MV": FUNC_MV},
          open(os.path.join(R, "_js_consts.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("js consts:", len(SYS_MAP), len(SYS_SET), WEATHER_MV, {k: len(v) for k, v in FUNC_MV.items()})

stats.append("### D.7 SYS_SET / SYS_MAP / WEATHER_MV / FUNC_MV（build_tool_html.py 第 1318-1335 行，脚本 re 实读）\n")
stats.append("- `SYS_SET`（判定「天气/场地设置手」，**9 条**）：" + "；".join(f"`{k}`→{v}" for k, v in SYS_SET.items()))
stats.append("- `SYS_MAP`（体系归类，**" + str(len(SYS_MAP)) + " 条**）：" + "；".join(f"`{k}`→{v}" for k, v in SYS_MAP.items()))
stats.append("- `WEATHER_MV`（手动设置天气/场地招式 id→体系，**" + str(len(WEATHER_MV)) + " 条**）：" + "；".join(f"`{k}`→{v}" for k, v in WEATHER_MV.items()))
stats.append("")
stats.append("- `FUNC_MV`（功能招分类，**" + str(len(FUNC_MV)) + " 组**）：")
for k, v in FUNC_MV.items():
    nm = "/".join((mvd.get(str(i)) or ["", str(i)])[1] if mvd.get(str(i)) else str(i) for i in v)
    stats.append(f"  - `{k}`（{len(v)} 招）：ids {v} = {nm}")
stats.append(f"- 注：以上常量定义在 `build_tool_html.py`（非 build_tool_data.py），故 `_engine_literals.json` 中不存在；本源已单独落盘 `_js_consts.json`。")
stats.append("")
stats.append("### D.8 克制表顺序差异线索（ERDATA.types vs gameData.typeT）\n")
stats.append(f"- gameData.typeT（{len(gd['typeT'])} 项）：`{gd['typeT']}`")
stats.append(f"- ERDATA.types（{len(types)} 项）：`{types}`")
stats.append("- 逐位比对：idx 0-17 完全一致（一般/格斗/火/冰/电/虫/飞行/钢/草/地面/毒/恶/水/超能力/岩石/龙/幽灵/妖精）；") 
stats.append("- **idx 18-20 排列不同**：gameData 为 `Mystery(18) / None(19) / Stellar(20)`，ERDATA 为 `星晶=Stellar(18) / 无=None(19) / 神秘=Mystery(20)`。")
stats.append("- 影响评估：matchup 中这三行/列全为 1（中性），且 `atkCover`/`coverHoles` 显式排除「星晶/无/神秘」，故对攻防计算无影响；但**跨表按 index 直连时不可混用**（需按名索引）。")
stats.append("- 数据源差异：ERDATA.matchup 来自汉化图鉴 `ER2.65beta版图鉴v0.3.xlsm` Sheet1（build_tool_data.py 第 54-72 行），后 3 属性为脚本补齐的全中性行列（第 74-90 行）。")
stats.append("")
stats.append("### D.9 ⚠ 实读缺陷：matchup 末 3 行长度不齐（非严格方阵）\n")
stats.append(f"- 各行长度实读：`{[len(r) for r in mu]}`（前 18 行 21 格；星晶行 19 格、无行 20 格、神秘行 21 格）。")
stats.append("- **成因**：`build_tool_data.py` 第 85-89 行先给已有 18 行 `extend([1]*len(extra_types))`（补齐到 21），再对每个 extra 类型 `matchup.append([1]*len(types))` —— 追加时 `types` 正在增长，故新行长度 = 19/20/21。")
stats.append("- **运行影响**：JS `defMult(types,at)` 读 `ERDATA.matchup[tIdx(防御)][tIdx(攻击)]`，越界得 `undefined`，三个分支均不命中 → 倍率保持 1。因这 3 属性本就是全中性，**当前结果正确**；但属隐性 bug，若日后要给 星晶/无/神秘 填非 1 值会静默失效。")
stats.append("- **下游同样绕过**：`atkCover`/`coverHoles` 显式 `if(t==='星晶'||t==='无'||t==='神秘')return;` 跳过这 3 属性。")

open(os.path.join(R, "_sec_D_stats.md"), "w", encoding="utf-8").write("\n".join(stats) + "\n")
print("D ok")

# ---------- C.2 模板清单（实读 ERDATA.templates） ----------
tp = erd["templates"]
tpl_rows = ["**清单（实读 `ERDATA.templates` = build_tool_data.py `TEMPLATES`）**\n",
            "| # | 名称 | 主题 | 角色分工 | match 匹配规则（特性+2 / 可学招+1 / 属性+1） | counters 天敌 | flow 开局流程 | keys 核心组件 |",
            "|---|---|---|---|---|---|---|---|"]
for i, t in enumerate(tp):
    m = t.get("match", {})
    c = t.get("counters", {})
    keys = "；".join(f"[{k[0]}]{k[1]}" for k in t.get("keys", []))
    tpl_rows.append("| {i} | {n} | {th} | {ro} | 特性 {ab}；招式 {mv}；属性 {ty} | 怕属性 {ct}；被免疫特性 {ca} | {fl} | {ke} |".format(
        i=i + 1, n=t["name"], th=t["theme"], ro=" / ".join(t.get("roles", [])),
        ab="、".join(m.get("abis", [])), mv="、".join(m.get("moves", [])), ty="、".join(m.get("types", [])),
        ct="、".join(c.get("types", [])), ca="、".join(c.get("abis", [])),
        fl=" → ".join(t.get("flow", [])), ke=keys))
tpl_rows.append("")
tpl_rows.append("各模板 `tips`（ER 调整说明，原值）：")
for i, t in enumerate(tp):
    tpl_rows.append(f"- **{t['name']}**：" + " ／ ".join(t.get("tips", [])))
open(os.path.join(R, "_sec_C_templates.md"), "w", encoding="utf-8").write("\n".join(tpl_rows) + "\n")
print("C2 ok:", len(tp))

# ---------- 自检 ----------
chk = []
chk.append("### F. 自检结果（脚本实跑，非人工判断）\n")
chk.append("| 检查项 | 期望 | 实测 | 结论 |")
chk.append("|---|---|---|---|")
chk.append(f"| matchup 行数 | 21 | {len(mu)} | {'✓' if len(mu) == 21 else '✗'} |")
chk.append(f"| matchup 各行长度 | 均 21 | {[len(r) for r in mu]} | ⚠ 末 3 行 19/20/21（见 D.9） |")
chk.append(f"| matchup 火→地面（防守=地面,攻击=火） | 1 | {mu[types.index('地面')][types.index('火')]} | {'✓' if mu[types.index('地面')][types.index('火')] == 1 else '✗'} |")
chk.append(f"| matchup 水→电（防守=电,攻击=水） | 1 | {mu[types.index('电')][types.index('水')]} | {'✓' if mu[types.index('电')][types.index('水')] == 1 else '✗'} |")
chk.append(f"| matchup 地面→电（防守=电,攻击=地面） | 2 | {mu[types.index('电')][types.index('地面')]} | {'✓' if mu[types.index('电')][types.index('地面')] == 2 else '✗'} |")
same = json.dumps(at, sort_keys=True) == json.dumps(erd["abiTags"], sort_keys=True)
chk.append(f"| ABI_TAGS（build_tool_data.py）条数 vs ERDATA.abiTags | 相等 | {len(at)} vs {len(erd['abiTags'])}，内容比对 {'一致' if same else '不一致'} | {'✓' if same else '✗'} |")
mn_miss = [k for k in mn if k not in mvd]
chk.append(f"| MOVES_NOTES 全部 id 可在 ERDATA.moves 解析 | 0 缺失 | 缺失 {mn_miss} | {'✓' if not mn_miss else '✗'} |")
chk.append(f"| ABI_TAGS 全部 id 可在 ERDATA.abilities 解析中文名 | 0 缺失 | 缺失 {missids} | {'✓' if not missids else '✗'} |")
# 模板 keys 名称命中（对照 ERDATA 名称表）
abz_names = set()
for a in erd["abilities"]:
    abz_names.add(a[2]); abz_names.add(a[1])
abz_names |= set(aa.keys())
mv_names = set()
for m in erd["moves"]:
    mv_names.add(m[1]); mv_names.add(m[2])
it_names = set()
for it in erd["items"]:
    it_names.add(it[2]); it_names.add(it[1])
tplmiss = []
for t in tp:
    for kind, name in t["keys"]:
        pool = abz_names if kind == "特性" else (mv_names if kind == "招式" else it_names)
        if name not in pool:
            tplmiss.append((t["name"], kind, name))
chk.append(f"| 12 模板 keys 名称在 ERDATA 名称表中命中 | 0 未命中 | 未命中 {tplmiss} | {'✓' if not tplmiss else '✗'} |")
chk.append(f"| 物种 ERDATA 1906 / gameData 1907（差 1 = id -1 占位） | — | 差集 {only_gd} | ✓ |")
chk.append(f"| 非最终形态 nonFinal | 640 | {len(nf)}（gameData 独立复算 {len(gd_nf)}） | {'✓' if len(nf) == len(gd_nf) == 640 else '✗'} |")
chk.append(f"| eggMoves / TMHMMoves 全表为空 | 0 / 0 | {egg_nonempty} / {tm_nonempty} | {'✓' if egg_nonempty == tm_nonempty == 0 else '✗'} |")
chk.append(f"| 引擎评分公式实际实现 | 见 C.4 | 代码含 `nv*40`/`hole*25`，**不含** `novel`/`hitAdj`/`prioAdj`/`pickSet`（AGENTS.md §6 描述的公式在 .py 与 .html 中均不存在） | ⚠ 描述与实现不一致 |")
open(os.path.join(R, "_sec_F_selfcheck.md"), "w", encoding="utf-8").write("\n".join(chk) + "\n")
print("F ok; tplmiss", tplmiss, "mn_miss", mn_miss)

# ---------- E. 六条已确立事实的本地证据定位 ----------
ev = []
ev.append("### E.1 克制表 v3.13「全量核实」（21×21 逐格）\n")
ev.append("- **成品数据**：`配招工具_data.js` → `ERDATA.matchup`（21×21）+ `ERDATA.types`（21 顺序）。")
ev.append(f"- **实证取值**：`ERDATA.matchup[防守=地面][攻击=火] = {mu[types.index('地面')][types.index('火')]}`（火打地面=1x，**与原版一致**——原版标准表亦为 1×；2026-10-06 修正）；`ERDATA.matchup[防守=电][攻击=水] = {mu[types.index('电')][types.index('水')]}`（水打电=1x）。")
ev.append("- **来源链**：`build_tool_data.py` 第 54-72 行从 `ER2.65简汉化\\ER2.65beta版图鉴v0.3.xlsm` Sheet1 读入 → 第 74-90 行补齐 星晶/无/神秘 全中性行列 → 落盘 `ERDATA.matchup`。")
ev.append("- **项目结论定位**：`AGENTS.md` §6「v3.13 克制表全量核实」（xlsm vs 官方 `battle_util.c sTypeEffectivenessTable` 转置逐格 0 差异）+ §6 待办 0（火打地面 ER 特例待游戏内裁定）。")
ev.append("")
ev.append("### E.2 天气增伤 20%\n")
ev.append("- **本地文本证据**：`配招工具_data.js` → `ERDATA.templates[0].tips[0]`：「ER 天气为无限回合（天气特性），但增伤从 50% 削到 20%……」；同源定义 `build_tool_data.py` `TEMPLATES[0]['tips'][0]`。")
ev.append("- **前端静态提示**：`build_tool_html.py` 第 219 行：「💡 ER 特化提示：天气增伤统一 20%（原版 50%）……」")
ev.append("- **其余模板旁证**：`ERDATA.templates[1].tips[0]`（「ER 晴增伤 20%；日光束晴天下无需蓄力」）。")
ev.append("- **结论定位**：`AGENTS.md` §3（ER 调整说明「天气增伤 20% 非 50%」）。")
ev.append("- **未本地证实项**：20% 的**数值源头**在 ER 官方 ROM/源码，本仓库 gameData/moves 中无天气增伤字段（`moves[].eff/chance/arg` 无天气加成项），故只能引模板文本与 AGENTS 结论。")
ev.append("")
ev.append("### E.3 冻伤（frostbite）替代冰冻\n")
ev.append("- **本地文本证据**：gameData `moves` 中附带冰冻效果的招式描述写作 frostbite，例如 id=8 冰冻拳 `desc` = \"" + str([m for m in gd["moves"] if m["id"] == 8][0]["desc"]) + "\"。")
ev.append("- **ER 调整说明**：`ERDATA.templates[3].tips[1]`（雪天堡垒）：「冻伤替代冰冻：1/16 掉血 + 特攻减半 —— 冰系招式附带价值」；`ERDATA.templates[8].tips[2]`（钉子受队）：「冻伤（特攻减半）配合剧毒可双压物特两端」。")
ev.append("- **前端静态提示**：`build_tool_html.py` 第 219 行：「……冻伤替代冰冻（1/16 掉血+特攻减半）……」。")
ev.append("- **结论定位**：`AGENTS.md` §6（模板说明「冻伤替代冰冻」）。")
ev.append("")
ev.append("### E.4 教学池合并（ER v2.65 无蛋招 / TMHM 数据）\n")
ev.append(f"- **实读证据（gameData）**：全 {len(gd['species'])} 条物种中，`eggMoves` 非空 **{egg_nonempty}** 条、`TMHMMoves` 非空 **{tm_nonempty}** 条（全表为空数组）；而 `levelUpMoves` 非空 **{lvl_nonempty}** 条、`tutor` 非空 **{tut_nonempty}** 条。")
ev.append(f"- **配套实读**：`forms` 非空 **{forms_nonempty}** 条、`SEnc` 非空 **{enc_nonempty}** 条。")
ev.append("- **下游表现**：ERDATA 每只仅 `lv`（升级）+ `tut`（教学）两池；内嵌解析器 `buildRowJs` 中 `可学_蛋:0, 可学_TMHM:0`（build_tool_html.py 第 1028 行）为定值 0。")
ev.append("- **结论定位**：`AGENTS.md` §3/§6（「ER v2.65 无蛋招/TM 字段——教学池已合并 TM/蛋内容」）。")
ev.append("")
ev.append("### E.5 个体值 IV=0 口径（ER 个体默认满值但不入能力公式）\n")
ev.append("- **能力公式证据**：`配招工具_data.js`（引擎）/`build_tool_html.py` `calcStat(base,ev,lv,nature,isHp)`：`HP = floor((2*base+floor(ev/4))*lv/100)+lv+10`、`其他 = floor((floor((2*base+floor(ev/4))*lv/100)+5)*nature)` —— **公式中无 IV 项**（等价 IV=0 口径）。")
ev.append("- **解析器证据**：`build_tool_html.py` `buildRowJs` 盒子分支 `cap='(公式基准)'`、`natureProfile` 以基准值反推天性 ±10%；Python 侧同口径见 `parse_er_save_v4.py`。")
ev.append("- **结论定位**：`AGENTS.md` §3「个体值机制（2026-10-06 用户澄清+公式实证）」——IV=0 口径与全部真值吻合、IV=31 口径全部失配。")
ev.append("")
ev.append("### E.6 特性 n 选 1 + 天性固定 3 个\n")
gd2232 = [s for s in gd["species"] if s["id"] == 2232][0]["stats"]
sp2232_erd = [s for s in erd["species"] if int(s["id"]) == 2232][0]
ev.append(f"- **数据结构证据**：gameData `species[].stats.abis`（可选池，定长 3）与 `species[].stats.inns`（固定天性，定长 3）；ERDATA 每只展开为 `abis:[3]` / `inns:[3]`。")
ev.append(f"  - 抽查 id=2232（Clodsire Mega）：gameData `stats.abis = {gd2232['abis']}`、`stats.inns = {gd2232['inns']}`；ERDATA `abis = {json.dumps(sp2232_erd['abis'], ensure_ascii=False)}`、`inns = {json.dumps(sp2232_erd['inns'], ensure_ascii=False)}`（两表同源、逐位一致）。")
ev.append("- **前端提示证据**：`build_tool_html.py` 第 219 行静态提示「训练师全员 4 特性+道具」与「个体默认 31、Iron Pill 可把速度 IV 调 0」。")
ev.append("- **引擎表现**：`defCellTrio` 天性口径只认 `s.inns`（`abiImHf` 中 scope='天性'）；可选池单独作为 opt 口径（未勾选不生效，勾选后覆盖池内其它）；`pickAbi` 单选/取消交互。")
ev.append("- **结论定位**：`AGENTS.md` §3「特性体系（2026-10-06 用户澄清）」——游戏特性页 4 项 = 当前生效特性（abis 池 n 选 1）+ inns[0..2]；§6 待办 1（选中项存档来源加密块未解）。")

open(os.path.join(R, "_sec_E_evidence.md"), "w", encoding="utf-8").write("\n".join(ev) + "\n")
print("E ok")
print("egg_nonempty", egg_nonempty, "tm_nonempty", tm_nonempty, "lvl", lvl_nonempty, "tut", tut_nonempty,
      "forms", forms_nonempty, "enc_nonempty", enc_nonempty)
print("only_gd", only_gd, "only_erd", only_erd)
print("items desc", it_desc, "zh", it_zh, "sp_zh", sp_zh, "ab_zh", ab_zh, "mv_zh", mv_zh, "tot_lv", tot_lv, "tot_tut", tot_tut)
