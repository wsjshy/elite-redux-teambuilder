# 从 MoveEnum.proto + MoveList.textproto 提取缺失招族的数字 id 列表
import re, io, json, os

SRC = r"D:\game\scratch\eliteredux-source"
ENUM_P = os.path.join(SRC, "proto", "MoveEnum.proto")
LIST_P = os.path.join(SRC, "proto", "MoveList.textproto")

# 1) enum name -> numeric id
enum_id = {}
with io.open(ENUM_P, "r", encoding="utf-8") as f:
    for line in f:
        m = re.match(r"\s*(MOVE_\w+)\s*=\s*(\d+)\s*;", line)
        if m:
            enum_id[m.group(1)] = int(m.group(2))
print("enum 条目数:", len(enum_id))

# 2) parse move blocks
FAM_FIELDS = ["arrow", "horn", "air", "hammer", "throwing", "drill", "light"]
fam = {k: [] for k in FAM_FIELDS}

with io.open(LIST_P, "r", encoding="utf-8") as f:
    text = f.read()

# split into top-level "moves { ... }" blocks (brace balanced)
blocks = []
i = 0
n = len(text)
while i < n:
    idx = text.find("moves {", i)
    if idx < 0:
        break
    # find matching closing brace
    depth = 0
    j = text.find("{", idx)
    k = j
    while k < n:
        if text[k] == "{":
            depth += 1
        elif text[k] == "}":
            depth -= 1
            if depth == 0:
                break
        k += 1
    blocks.append(text[j + 1:k])
    i = k + 1

print("moves 块数:", len(blocks))

moves_seen = 0
for blk in blocks:
    mid_m = re.search(r"^\s*id:\s*(MOVE_\w+)\s*$", blk, re.M)
    if not mid_m:
        continue  # first placeholder block (no id)
    enum_name = mid_m.group(1)
    if enum_name not in enum_id:
        print("!! enum 未找到:", enum_name)
        continue
    num = enum_id[enum_name]
    moves_seen += 1
    for fld in FAM_FIELDS:
        if re.search(r"^\s*" + fld + r":\s*true\s*$", blk, re.M):
            fam[fld].append(num)

print("有 id 的 moves 数:", moves_seen)
for k in FAM_FIELDS:
    fam[k].sort()
    print(k, len(fam[k]), "->", ",".join(str(x) for x in fam[k]))

with io.open(os.path.join(os.path.dirname(__file__), "mv_fam_extract.json"), "w", encoding="utf-8") as f:
    json.dump(fam, f, ensure_ascii=False, indent=1)
