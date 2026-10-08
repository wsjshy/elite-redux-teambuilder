# -*- coding: utf-8 -*-
r"""从 build_tool_data.py 抽取内嵌字面量（ABI_TAGS/TEMPLATES/CLS_MAP/MOVES_NOTES/ITEM_ZH_EXTRA），
用 ast.parse 解析整个源文件（正确处理注释），不执行该文件（避免触发构建写盘）。
输出：D:\game\elite-redux\docs\研究资料\_engine_literals.json
"""
import ast, json, os

BASE = r"D:\game\elite-redux"
SRC = os.path.join(BASE, "build_tool_data.py")
OUT = os.path.join(BASE, "docs", "研究资料", "_engine_literals.json")

src = open(SRC, "r", encoding="utf-8").read()
tree = ast.parse(src)

names = {"ABI_TAGS", "TEMPLATES", "CLS_MAP", "MOVES_NOTES", "ITEM_ZH_EXTRA", "ABI_ALIAS", "SYS_SET", "SYS_MAP"}
found = {}
for node in tree.body:
    if isinstance(node, ast.Assign):
        for t in node.targets:
            if isinstance(t, ast.Name) and t.id in names:
                try:
                    found[t.id] = ast.literal_eval(node.value)
                except Exception as e:
                    print(f"{t.id}: literal_eval 失败 {e}")
                    found[t.id] = f"<<NOT LITERAL: {type(node.value).__name__}>>"

for k, v in found.items():
    if isinstance(v, (dict, list)):
        print(f"{k}: {type(v).__name__} len={len(v)}")
    else:
        print(f"{k}: {v}")

with open(OUT, "w", encoding="utf-8") as f:
    json.dump(found, f, ensure_ascii=False, indent=1)
print("wrote", OUT)

at = found.get("ABI_TAGS", {})
if isinstance(at, dict):
    keys = {}
    for k, v in at.items():
        for kk in v.keys():
            keys[kk] = keys.get(kk, 0) + 1
    print("ABI_TAGS 标签键分布:", keys, "| 条目数:", len(at))
    print("ids:", ",".join(sorted(at.keys(), key=lambda x: int(x))))

tn = found.get("MOVES_NOTES", {})
if isinstance(tn, dict):
    print("MOVES_NOTES 条目数:", len(tn))
    print("ids:", ",".join(sorted(tn.keys(), key=lambda x: int(x))))
