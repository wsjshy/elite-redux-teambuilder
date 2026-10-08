# -*- coding: utf-8 -*-
r"""枚举 gameDataV2.65beta.json 的顶层结构、计数与样本字段。
来源：D:\game\elite-redux\ER-source\gameDataV2.65beta.json
输出：D:\game\elite-redux\docs\研究资料\_gd_probe.txt
"""
import json, os, io, sys

BASE = r"D:\game\elite-redux"
SRC = os.path.join(BASE, "ER-source", "gameDataV2.65beta.json")
OUT = os.path.join(BASE, "docs", "研究资料", "_gd_probe.txt")

with open(SRC, "r", encoding="utf-8") as f:
    gd = json.load(f)

lines = []
def P(*a):
    s = " ".join(str(x) for x in a)
    lines.append(s)

P("== top-level keys ==")
for k, v in gd.items():
    if isinstance(v, list):
        P(f"  {k}: list len={len(v)}")
    elif isinstance(v, dict):
        P(f"  {k}: dict len={len(v)}  keys(sample)={list(v.keys())[:6]}")
    else:
        P(f"  {k}: {type(v).__name__} = {str(v)[:200]}")

P("")
P("== species[0] full ==")
P(json.dumps(gd["species"][0], ensure_ascii=False, indent=1))
P("")
P("== species keys union (first 50 species) ==")
ks = set()
for s in gd["species"][:50]:
    ks |= set(s.keys())
P(sorted(ks))

P("")
P("== a mega form sample (id 2232 if exists) ==")
dic = {s.get("id"): s for s in gd["species"]}
for i in (2232, 1541, 411):
    if i in dic:
        P(f"-- id {i} --")
        P(json.dumps(dic[i], ensure_ascii=False, indent=1)[:2500])

P("")
P("== abilities[0..3] ==")
P(json.dumps(gd["abilities"][:4], ensure_ascii=False, indent=1)[:1500])
P("== abilities keys union ==")
ks2 = set()
for a in gd["abilities"][:50]:
    ks2 |= set(a.keys())
P(sorted(ks2))

P("")
P("== moves sample (find id 1 & 85) ==")
md = {m.get("id"): m for m in gd["moves"]}
for i in (1, 85):
    if i in md:
        P(json.dumps(md[i], ensure_ascii=False, indent=1)[:1200])
P("== moves keys union ==")
ks3 = set()
for m in gd["moves"][:100]:
    ks3 |= set(m.keys())
P(sorted(ks3))

P("")
P("== items sample + keys ==")
P(json.dumps(gd["items"][:3], ensure_ascii=False, indent=1)[:1200])
ks4 = set()
for m in gd["items"][:100]:
    ks4 |= set(m.keys())
P(sorted(ks4))

P("")
P("== typeT ==")
tt = gd.get("typeT")
P(json.dumps(tt, ensure_ascii=False)[:2000] if tt is not None else "None")

P("")
P("== counts ==")
P("species:", len(gd["species"]), "| moves:", len(gd["moves"]),
  "| abilities:", len(gd["abilities"]), "| items:", len(gd["items"]))

# 非最终形态判定统计（kd==0）
nf = [s["id"] for s in gd["species"] if any((e or {}).get("kd") == 0 for e in (s.get("evolutions") or []))]
P("nonFinal(kd==0):", len(nf))
kds = {}
for s in gd["species"]:
    for e in (s.get("evolutions") or []):
        kds[(e or {}).get("kd")] = kds.get((e or {}).get("kd"), 0) + 1
P("evolution kd histogram:", kds)
evrs = set()
for s in gd["species"]:
    for e in (s.get("evolutions") or []):
        evrs |= set((e or {}).keys())
P("evolution entry keys union:", sorted(evrs))

with open(OUT, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))
print("wrote", OUT, "lines:", len(lines))
