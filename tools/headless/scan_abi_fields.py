# 扫描 abilities.cc：每个 Ability Impl 块引用了哪些招族 bitfield
import re, io, os, json

SRC = r"D:\game\scratch\eliteredux-source"
AB = os.path.join(SRC, "src", "abilities.cc")
ENUM = os.path.join(SRC, "proto", "AbilityEnum.proto")

# ability enum -> numeric id
ab_id = {}
with io.open(ENUM, "r", encoding="utf-8") as f:
    for line in f:
        m = re.match(r"\s*(ABILITY_\w+)\s*=\s*(\d+)\s*;", line)
        if m:
            ab_id[m.group(1)] = int(m.group(2))

FIELDS = ["arrowBased", "hornBased", "airBased", "hammerBased", "throwingBased", "drill", "light"]
# also track MoveFlag references
MOVEFLAGS = ["MOVE_FLAG_PUNCH", "MOVE_FLAG_KICK", "MOVE_FLAG_SOUND", "MOVE_FLAG_MEGA_LAUNCHER",
             "MOVE_FLAG_DANCE", "MOVE_FLAG_KEEN_EDGE", "MOVE_FLAG_BONE"]

with io.open(AB, "r", encoding="utf-8") as f:
    text = f.read()

# split into "template <>\nconstexpr Ability Impl<ABILITY_X> = { ... };" blocks
# find each Impl<...> start and its matching brace
result = {}
for m in re.finditer(r"Impl<(ABILITY_\w+)>\s*=", text):
    name = m.group(1)
    start = text.find("{", m.end())
    depth = 0
    k = start
    while k < len(text):
        if text[k] == "{":
            depth += 1
        elif text[k] == "}":
            depth -= 1
            if depth == 0:
                break
        k += 1
    body = text[start:k]
    hits = [fld for fld in FIELDS if re.search(r"\." + fld + r"\b", body)]
    # follow delegated Impl references (onOffensiveMultiplier = Impl<ABILITY_Y>.xxx)
    deleg = re.findall(r"Impl<(ABILITY_\w+)>", body)
    mf = [fl for fl in MOVEFLAGS if fl in body]
    if hits or mf:
        result[name] = {"id": ab_id.get(name), "fields": hits, "moveflags": mf, "deleg": deleg}

# only keep abilities whose id <= 1033 (in shards)
in_shard = {k: v for k, v in result.items() if v["id"] is not None and v["id"] <= 1033}

by_field = {fld: [] for fld in FIELDS}
for name, v in in_shard.items():
    for fld in v["fields"]:
        by_field[fld].append((v["id"], name))

for fld in FIELDS:
    lst = sorted(set(by_field[fld]))
    print("=== " + fld + " (" + str(len(lst)) + " shard abilities) ===")
    for aid, nm in lst:
        print("  ", aid, nm)

with io.open(os.path.join(os.path.dirname(__file__), "abi_field_map.json"), "w", encoding="utf-8") as f:
    json.dump({k: v for k, v in in_shard.items()}, f, ensure_ascii=False, indent=1)
