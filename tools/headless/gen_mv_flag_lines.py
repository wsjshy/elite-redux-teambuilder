# 生成最终 MV_FLAG 新增行（只保留 shard 内 id <= 1031），并打印每条供核对
import io, json, os

with io.open(os.path.join(os.path.dirname(__file__), "mv_fam_extract.json"), "r", encoding="utf-8") as f:
    fam = json.load(f)

SHARD_MAX = 1031
# 顺序与注释
META = [
    ("arrow", "箭族", "FLAG arrowBased 箭类"),
    ("horn", "角/钻族", "FLAG hornBased 角类"),
    ("air", "空/翼族", "FLAG airBased 空中/翼类"),
    ("hammer", "锤族", "FLAG hammerBased 锤类"),
    ("throwing", "投掷族", "FLAG throwingBased 投掷类"),
    ("drill", "钻头族", "FLAG drill 钻头类"),
    ("light", "光线族", "FLAG light 光线类"),
]
final = {}
for key, zh, comment in META:
    ids = sorted(i for i in fam[key] if i <= SHARD_MAX)
    final[key] = ids
    s = ",".join(str(i) for i in ids)
    print("  %s:'%s',   /* %s，%d 条 */" % (key, s, comment, len(ids)))

with io.open(os.path.join(os.path.dirname(__file__), "mv_fam_final.json"), "w", encoding="utf-8") as f:
    json.dump(final, f, ensure_ascii=False, indent=1)
