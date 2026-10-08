# -*- coding: utf-8 -*-
r"""C.1 数据层探针 —— 引擎升级规格 v1.0 A 节（A1 matchup 方阵 / A2 lDesc / A3 conv）
来源：D:\game\elite-redux\配招工具_data.js（正则 `var ERDATA = (.*);` re.S + json.loads）
不做 build_tool_html.py / HTML 生成，仅校验数据层产物。
"""
import json, re, os, sys
import openpyxl

BASE = r"D:\game\elite-redux"
SRC = os.path.join(BASE, "配招工具_data.js")

fail = []
def check(name, cond, detail=""):
    print(("  [PASS] " if cond else "  [FAIL] ") + name + (("  " + detail) if detail else ""))
    if not cond:
        fail.append(name)

def extract_erd(txt):
    """定位 `var ERDATA =` 后用 raw_decode 精确解析（HTML 内嵌 JSON 后可能还有其它语句）"""
    m = re.search(r"var ERDATA\s*=\s*", txt)
    if not m:
        return None
    return json.JSONDecoder().raw_decode(txt[m.end():].lstrip())[0]

def extract_erd_raw(txt):
    """同上，但返回 JSON 原文切片（用于 data.js 与 HTML 的逐字节一致性校验）"""
    m = re.search(r"var ERDATA\s*=\s*", txt)
    if not m:
        return None
    s = txt[m.end():].lstrip()
    obj, end = json.JSONDecoder().raw_decode(s)
    return s[:end]

with open(SRC, "r", encoding="utf-8") as f:
    txt = f.read()
erd = extract_erd(txt)
assert erd, "ERDATA 未匹配到"
print("ERDATA 顶层键:", list(erd.keys()))
print("配招工具_data.js 大小: %d bytes" % os.path.getsize(SRC))

# ---------------- A1: matchup 21x21 方阵 ----------------
print("\n=== A1 matchup 方阵 ===")
mu = erd["matchup"]
types = erd["types"]
print("types(%d): %s" % (len(types), types))
rowlens = [len(r) for r in mu]
print("matchup 行数:", len(mu), "| 每行长度:", rowlens)
check("len(matchup)==21", len(mu) == 21, "实际 %d" % len(mu))
check("每行 len==21", all(len(r) == 21 for r in mu), "row lens=%s" % rowlens)
check("types 21 且与权威顺序一致",
      types == ['一般', '格斗', '火', '冰', '电', '虫', '飞行', '钢', '草', '地面',
                '毒', '恶', '水', '超能力', '岩石', '龙', '幽灵', '妖精', '星晶', '无', '神秘'])
print("末 3 行(星晶/无/神秘):")
for i in (18, 19, 20):
    print("   %s: %s" % (types[i], mu[i]))
check("星晶行全 1", mu[18] == [1] * 21)
check("无行全 1", mu[19] == [1] * 21)
check("神秘行全 1", mu[20] == [1] * 21)

# 独立重建期望方阵（xlsm 18x18 + 新属性全 1），逐格比对，证明"只修形状不改值"
wb = openpyxl.load_workbook(BASE + r"\ER2.65简汉化\ER2.65beta版图鉴v0.3.xlsm", read_only=True, data_only=True)
grid = list(wb["Sheet1"].iter_rows(values_only=True))
atk = [str(c) for c in grid[1][2:] if c is not None]
src = {}
for row in grid[2:]:
    dn = str(row[1]) if row[1] else ""
    if not dn or dn == "None":
        continue
    src[dn] = {atk[j]: int(c if c is not None else 1) for j, c in enumerate(row[2:2 + len(atk)])}
EXP = [[src.get(d, {}).get(a, 1) for a in types] for d in types]
diff = [(r, c, mu[r][c], EXP[r][c]) for r in range(21) for c in range(21) if mu[r][c] != EXP[r][c]]
print("与 xlsm 重建方阵逐格差异数:", len(diff), diff[:5])
check("矩阵值与 xlsm 真值逐格一致(仅修形状)", len(diff) == 0)
# 语义抽样：行=防守，列=进攻
def cell(d, a):
    return mu[types.index(d)][types.index(a)]
print("语义抽样: 一般防/幽灵攻=%s(期望0) 地面防/电攻=%s(期望0) 火防/水攻=%s(期望2)" % (
    cell("一般", "幽灵"), cell("地面", "电"), cell("火", "水")))
check("语义抽样 行=防守/列=进攻", cell("一般", "幽灵") == 0 and cell("地面", "电") == 0 and cell("火", "水") == 2)

# ---------------- A2: moves lDesc ----------------
print("\n=== A2 moves lDesc ===")
mv = erd["moves"]
print("moves 条数:", len(mv), "| moves[1] =", mv[1])
check("moves 条数不变(1032)", len(mv) == 1032, "实际 %d" % len(mv))
check("每条含 lDesc 位(len==11)", all(len(m) == 11 for m in mv),
      "长度集合=%s" % sorted(set(len(m) for m in mv)))
n_ld = sum(1 for m in mv if m[10])
print("lDesc 非空条数:", n_ld, "/", len(mv))
check("lDesc 非空 >100", n_ld > 100, "实际 %d" % n_ld)
kws = ["recharge", "recoil", "Never misses", "never misses"]
for k in kws:
    c = sum(1 for m in mv if k in m[10])
    print("   关键词 '%s' 命中 %d 条" % (k, c))
check("含 'recharge'", any("recharge" in m[10] for m in mv))
check("含 'recoil'", any("recoil" in m[10] for m in mv))
check("含 'Never misses'", any("Never misses" in m[10] for m in mv))
# 保留原 desc（index 9）不变：抽样
smp = [m for m in mv if m[0] in ("38", "344", "394", "143")]
for m in smp:
    print("   样本 id=%s %s | desc[9]=%r | lDesc[10]=%r" % (m[0], m[1], m[9][:40], m[10][:70]))
n_desc = sum(1 for m in mv if m[9])
print("desc 非空条数(原字段保留):", n_desc)
check("原 desc 字段保留(条数>0)", n_desc > 0, "实际 %d" % n_desc)

# ---------------- A3: abiTags conv ----------------
print("\n=== A3 abiTags conv ===")
at = erd["abiTags"]
EXP_CONV = {"96": "一般", "174": "冰", "182": "妖精", "184": "飞行", "206": "电",
            "315": "水", "325": "毒", "280": "冰", "659": "电"}
got = {k: at[k].get("conv") for k in EXP_CONV if k in at}
n_conv = sum(1 for v in at.values() if isinstance(v, dict) and "conv" in v)
cv_map = {k: v["conv"] for k, v in at.items() if isinstance(v, dict) and "conv" in v}
print("abiTags 条数:", len(at), "| conv 条目:", n_conv)
print("  9 条 conv 实测:", cv_map)
check("abiTags 含 9 条 conv 且值正确", got == EXP_CONV, "实际 %s" % got)
check("conv 总数恰 9", n_conv == 9, "实际 %d" % n_conv)
check("conv 键集 == 96/174/182/184/206/315/325/280/659",
      set(cv_map) == set(EXP_CONV), "实际 %s" % sorted(cv_map))
for k in EXP_CONV:
    print("    id=%s keys=%s" % (k, list(at.get(k, {}).keys())))
check("conv 条目不夹带 im/hf/add/out/def",
      all(set(at[k].keys()) == {"conv"} for k in EXP_CONV))
check("abiTags 总数 98+9=107", len(at) == 107, "实际 %d" % len(at))
# 取证留痕：280/659 的来源属性非「一般」（岩石→冰 / 钢→电），依据
# ER-source\gameDataV2.65beta.json abilities[280]/[659] 描述（逐字）：
#   [280] Crystallize    "Rock-type moves become Ice and get a 1.1x boost."
#   [659] Superconductor "Steel-type moves become Electric and get a 1.1x boost."
# conv 仅存「目标属性」，未存来源 —— 引擎 effMvType 以 m[3]==='一般' 为转换条件
# （build_tool_html.py:460），故这两条会被引擎按「一般源」消费（见报告"残留风险"栏）。
print("   来源属性核验: 280=岩石→冰(conv=冰) / 659=钢→电(conv=电)  [gameData abilities 描述实证]")

# ---------------- MOVES_NOTES 432 文案勘误（源码考古 §6 定稿）----------------
print("\n=== MOVES_NOTES '432' 文案 ===")
EXP432 = '清除浓雾：清双方钉子、墙仅对手侧（源码实证）；降闪避1级待实测'
note432 = erd["movesNotes"].get("432", "")
print("data.js  movesNotes['432'] =", repr(note432))
check("432 与定稿文案逐字一致", note432 == EXP432, note432)
check("432 含'清双方钉子'", "清双方钉子" in note432)
check("432 含'墙仅对手侧'", "墙仅对手侧" in note432)
check("432 含'源码实证'", "源码实证" in note432)
check("432 含'降闪避1级待实测'", "降闪避1级待实测" in note432)
check("432 已去掉旧文案'清对方全场钉子'", "清对方全场钉子" not in note432)
check("432 已去掉旧措辞'原版GenVI+'", "原版GenVI+" not in note432)

# ---- 同一文案须出现在 HTML 内嵌 ERDATA（引擎层产物一致性）----
HTML = BASE + r"\配招助手_ER.html"
htm = open(HTML, encoding="utf-8").read()
erd_html = extract_erd(htm)
print("HTML 大小: %d bytes | 内嵌 ERDATA: %s" % (len(htm.encode("utf-8")), "OK" if erd_html else "未解析到"))
check("HTML 内嵌 ERDATA 可解析", isinstance(erd_html, dict))
nh = (erd_html or {}).get("movesNotes", {}).get("432", "")
print("HTML     movesNotes['432'] =", repr(nh))
check("HTML 内嵌 432 == 新文案", nh == EXP432, nh)
_muh = (erd_html or {}).get("matchup", [])
check("HTML 内嵌 matchup 仍 21x21", len(_muh) == 21 and all(len(r) == 21 for r in _muh),
      "%dx%s" % (len(_muh), len(_muh[0]) if _muh else "-"))
_cvh = {k: v["conv"] for k, v in (erd_html or {}).get("abiTags", {}).items()
        if isinstance(v, dict) and "conv" in v}
print("HTML     conv 条目:", len(_cvh), "|", _cvh)
check("HTML 内嵌 conv 恰 9 条", len(_cvh) == 9, "实际 %d" % len(_cvh))
check("HTML 内嵌 conv 与 data.js 逐条一致", _cvh == cv_map, "HTML=%s" % _cvh)
_rawA, _rawB = extract_erd_raw(txt), extract_erd_raw(htm)
_d_sp = len(json.dumps(erd.get("sprites"), ensure_ascii=False, separators=(",", ":")))
_h_sp = len(json.dumps((erd_html or {}).get("sprites"), ensure_ascii=False, separators=(",", ":")))
print("ERDATA 原文长度: data.js=%s | HTML=%s | 差 %d"
      % (len(_rawA or ""), len(_rawB or ""), len(_rawA or "") - len(_rawB or "")))
print("sprites 字段长度(紧凑序列化): data.js=%d | HTML=%d | 差 %d" % (_d_sp, _h_sp, _d_sp - _h_sp))
print("（HTML 侧精灵图被 build_tool_html.py L16 剥离 = 设计行为，非缺陷）")
_a = json.dumps({k: v for k, v in erd.items() if k != "sprites"}, ensure_ascii=False)
_b = json.dumps({k: v for k, v in (erd_html or {}).items() if k != "sprites"}, ensure_ascii=False)
check("HTML 内嵌 ERDATA 除 sprites 外与 data.js 逐字节一致", _a == _b,
      "lenA=%d lenB=%d" % (len(_a), len(_b)))
check("两处差量恰为 sprites 差量（无其它改动）",
      (len(_rawA or "") - len(_rawB or "")) == (_d_sp - _h_sp),
      "原文差=%d sprites差=%d" % (len(_rawA or "") - len(_rawB or ""), _d_sp - _h_sp))
_difk = [k for k in sorted(set(erd) | set(erd_html or {}))
         if erd.get(k) != (erd_html or {}).get(k)]
print("两处 ERDATA 差异字段:", _difk, "| HTML sprites 值:", repr((erd_html or {}).get("sprites"))[:40])
check("两处 ERDATA 唯一差异字段 = sprites", _difk == ["sprites"], "差异字段=%s" % _difk)
check("HTML 侧 sprites 已清空（设计行为）", not (erd_html or {}).get("sprites"))

# ---------------- NONFINAL 判据（ER CanEvolve = kd∈{0,3,4}）----------------
print("\n=== NONFINAL（进化奇石口径）===")
nf = erd["nonFinal"]
nfset = set(str(x) for x in nf)
print("nonFinal 条数:", len(nf))
NEW13 = ["412", "415", "550", "667", "677", "757", "848", "1064", "1636", "1637", "1667", "2567", "2608"]
_zh = {str(s["id"]): s.get("zh") for s in erd["species"]}
_miss13 = [i for i in NEW13 if i not in nfset]
for i in NEW13:
    print("    + %-5s %s" % (i, _zh.get(i, "?")))
check("13 只分支进化形态已计入 nonFinal", not _miss13, "缺 %s" % _miss13)
_fin3 = sorted({"382", "383", "384"} & nfset)
check("Mega/Primal/招式进化仍算最终形态（382/383/384 不在 nonFinal）", not _fin3, "实际交集 %s" % _fin3)
_mner = re.search(r"ERDATA\.nonFinalER\s*=\s*(\[[^\]]*\])", htm)
if _mner:
    _ner = set(str(x) for x in json.loads(_mner.group(1)))
    print("HTML ERDATA.nonFinalER 条数:", len(_ner))
    check("数据层 nonFinal == 引擎派生 nonFinalER", _ner == nfset,
          "data=%d html=%d 差异=%s" % (len(nfset), len(_ner), sorted(nfset ^ _ner)[:8]))
else:
    print("  [WARN] HTML 未找到 ERDATA.nonFinalER 注入")

# ---------------- 模板「进化奇石」限定文案 ----------------
print("\n=== 模板 戏法空间 / 进化奇石限定 ===")
_tp = [t for t in erd["templates"] if t["name"] == "戏法空间"][0]
_hit = [x for x in _tp["tips"] if "仅未完全进化者生效" in x]
print("tips 命中:", _hit)
check("戏法空间 tips 含「仅未完全进化者生效」限定", bool(_hit))
check("模板 keys 名称未被追加限定语（仍可命中名称表）",
      any(list(k) == ["道具", "进化奇石"] for k in _tp["keys"]),
      "keys=%s" % [list(k) for k in _tp["keys"]])
_htp = [t for t in (erd_html or {}).get("templates", []) if t["name"] == "戏法空间"]
check("HTML 内嵌模板同样含该限定",
      bool(_htp) and any("仅未完全进化者生效" in x for x in _htp[0]["tips"]))

# ---------------- 无回归计数 ----------------
print("\n=== 无回归计数 ===")
EXPECT = {"species": 1906, "items": 929, "abilities": 1034, "moves": 1032,
          "abiTags": 107, "abiAlias": 419, "templates": 18, "coreNotes": 44,
          "movesNotes": 69, "nonFinal": 653, "types": 21}
for k, v in EXPECT.items():
    got = len(erd[k])
    print("   %-11s = %d (期望 %d)" % (k, got, v))
    check("无回归 %s==%d" % (k, v), got == v, "实际 %d" % got)

print("\n==== 结果: %s ====" % ("全部通过" if not fail else ("失败 %d 项: %s" % (len(fail), fail))))
sys.exit(1 if fail else 0)
