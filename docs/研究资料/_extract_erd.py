# -*- coding: utf-8 -*-
r"""从 配招工具_data.js 提取 ERDATA（网页内嵌数据），输出精简 JSON 供资料汇编核对。
来源：D:\game\elite-redux\配招工具_data.js（正则 var ERDATA = (.*); 用 re.S）
输出：D:\game\elite-redux\docs\研究资料\_erd_slim.json
"""
import json, re, os

BASE = r"D:\game\elite-redux"
SRC = os.path.join(BASE, "配招工具_data.js")
OUT = os.path.join(BASE, "docs", "研究资料", "_erd_slim.json")

with open(SRC, "r", encoding="utf-8") as f:
    txt = f.read()

m = re.search(r"var ERDATA\s*=\s*(.*);", txt, re.S)
assert m, "ERDATA 未匹配到"
erd = json.loads(m.group(1))

print("top-level keys:", list(erd.keys()))
for k, v in erd.items():
    if isinstance(v, dict):
        print(f"  {k}: dict len={len(v)}")
    elif isinstance(v, list):
        print(f"  {k}: list len={len(v)}")
    else:
        print(f"  {k}: {type(v).__name__} {str(v)[:80]}")

slim = {k: v for k, v in erd.items() if k != "sprites"}
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(slim, f, ensure_ascii=False)
print("wrote", OUT)

sp = slim["species"]
print("species[0]:", json.dumps(sp[0], ensure_ascii=False)[:700])
print("species[-1]:", json.dumps(sp[-1], ensure_ascii=False)[:300])
print("species keys:", list(sp[0].keys()))

mv = slim["moves"]
print("moves len:", len(mv), "| moves[1]:", json.dumps(mv[1], ensure_ascii=False)[:300])

it = slim["items"]
print("items len:", len(it), "| items[0]:", json.dumps(it[0], ensure_ascii=False)[:300])
print("items[1]:", json.dumps(it[1], ensure_ascii=False)[:300])

ab = slim["abilities"]
print("abilities len:", len(ab), "| abilities[0]:", json.dumps(ab[0], ensure_ascii=False)[:300])

at = slim["abiTags"]
ak = list(at.keys())[:3]
print("abiTags len:", len(at), "| sample:", json.dumps({k: at[k] for k in ak}, ensure_ascii=False)[:400])
aa = slim["abiAlias"]
print("abiAlias len:", len(aa), "| sample:", json.dumps(dict(list(aa.items())[:5]), ensure_ascii=False)[:300])

tp = slim["templates"]
print("templates len:", len(tp), "| templates[0]:", json.dumps(tp[0], ensure_ascii=False)[:600])

cn = slim["coreNotes"]
print("coreNotes len:", len(cn), "| coreNotes[0]:", json.dumps(cn[0], ensure_ascii=False)[:400])

mn = slim["movesNotes"]
print("movesNotes len:", len(mn), "| sample:", json.dumps(dict(list(mn.items())[:3]), ensure_ascii=False)[:300])

print("nonFinal len:", len(slim["nonFinal"]), "| head:", slim["nonFinal"][:6])
print("types:", json.dumps(slim["types"], ensure_ascii=False))
mu = slim["matchup"]
print("matchup dims:", len(mu), "x", len(mu[0]))
