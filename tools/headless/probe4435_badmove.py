# -*- coding: utf-8 -*-
# v4.435 probe: 调查唯一 badMove 基线 #862 招 92 是否真不在 learnset（lv/tut/进化链）
import json, re, io, sys, os

root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sp_txt = open(os.path.join(root, "data_species_v498.js"), encoding="utf-8").read()
sp = json.loads(sp_txt.split("=", 1)[1].rstrip(";"))
lite = open(os.path.join(root, "data_lite_v498.js"), encoding="utf-8").read()

by = {x["id"]: x for x in sp}
target = by.get("862")
if not target:
    print("862 not found"); sys.exit(0)
print("862", target["zh"], target["en"], target["t1"], target["t2"], "base", target["base"])
lv = [m for _, m in target["lv"]]
tut = target["tut"]
print("lv moves:", lv)
print("tut moves:", tut)
print("92 in lv:", "92" in lv, " 92 in tut:", "92" in tut)

# move 92 name
i = lite.find('"92"')
print("move92 record:", lite[i:i+240] if i >= 0 else "NA")

# evolve chain: search any species whose lv/tut / pre-evo references 862; data has no preevo field here
# List other species mentioning Obstagoon en / 堵拦熊 zh to find preevolution
for x in sp:
    if "Linoone" in x["en"] or "蛇纹熊" in x["zh"] or "直冲熊" in x["zh"]:
        lv2 = [mm for _, mm in x["lv"]]
        print("related", x["id"], x["zh"], x["en"], "92 in lv:", "92" in lv2, "92 in tut:", "92" in x["tut"])

# Is 92 perhaps an ER-redux-only move absent from MV table entirely?
mm = re.search(r'"92"\s*:', lite)
print("92 exists in MV table:", bool(mm))
