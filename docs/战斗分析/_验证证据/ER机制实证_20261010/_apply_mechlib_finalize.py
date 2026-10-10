# -*- coding: utf-8 -*-
"""2026-10-10 ER 机制实证定稿：mech_lib_v412.json 中 20 处「待实测」标注转「已实证定稿」。
替换后做 json.loads 校验；不改任何数值/结构。"""
import io, json, sys

P = r"D:\game\elite-redux\nn_data\mech_lib_v412.json"
with io.open(P, "r", encoding="utf-8") as f:
    txt = f.read()

repls = [
    # 1. 宝石 note（L49）
    ('"note": "宝石 1.5 倍为官方口径，ER gameData desc 未载明宝石倍率，登记待实测"',
     '"note": "宝石 1.5 倍已实证定稿（2026-10-10，v2.65 双源：er-config ItemsList.textproto hold_effect_strength:50 + battle_util.c:6975-6977 MulModifier(1.0+gemParam)）；gameData desc 未载明倍率"'),
    # 2. 杂技 basis（L85）
    ('差异待游戏内真实验证（不阻塞交付）。',
     '已实证定稿（2026-10-10，v2.65：er-config MoveBehaviorConfigList.textproto:1083-1093 multiply:1.5 + MoveList.textproto:8533 power:75 + script_conditions.cc:145-150 条件=无道具）；官方 55×2 仅作语义参照。'),
    # 3. 蛮干 premise（L1580）
    ('登记为口径差待实测',
     '已实证定稿（2026-10-10，v2.65 源码 battle_scripts_1.s:6436-6448 + battle_script_commands.c:11852-11859：把对方 HP 削至与自身相同，保底 1；需自身 HP 低于对方）'),
    # 4. 蛮干 basis（L1635）
    ('登记为待实测口径差。',
     '已实证定稿（2026-10-10，v2.65 源码：削至同血；ER desc「低血线增力」为官方 RS/E 旧文本，数据滞后）。'),
    # 5. 17 项特性 basis 尾部（统一句式替换）
    ('差异登记为「ER 口径差（待游戏内实测）」',
     '已实证定稿（2026-10-10，v2.65 源码+数据双源，见 _验证证据/ER机制实证_20261010/特性组_B1-B17_证据_20261010.md）'),
    ('差异登记为「ER 特有效果（待游戏内实测）」',
     '已实证定稿（2026-10-10，v2.65 源码实装确认，见 _验证证据/ER机制实证_20261010/特性组_B1-B17_证据_20261010.md）'),
    ('登记为「ER 特有效果（待游戏内实测）」',
     '已实证定稿（2026-10-10，v2.65 源码实装确认，见 _验证证据/ER机制实证_20261010/特性组_B1-B17_证据_20261010.md）'),
    # 6. meta.calibrationNote 的 v4.12 历史注记（同一批条目，同步转定稿）
    ('（均待游戏内实测，逐条见 docs\\\\研究资料\\\\_v412_机制检索验证_20261010.md §1）',
     '（2026-10-10 ER 机制实证已全部转定稿，逐条见 docs\\\\研究资料\\\\_v412_机制检索验证_20261010.md §1 与 _验证证据\\\\ER机制实证_20261010\\\\特性组_B1-B17_证据_20261010.md）'),
]

count = 0
for old, new in repls:
    n = txt.count(old)
    if n == 0:
        print("MISS: " + old[:60])
        continue
    txt = txt.replace(old, new)
    count += n
    print("ok x%d: %s" % (n, old[:50]))

# 校验 JSON 合法性
data = json.loads(txt)
print("JSON valid; entries=%d" % len(data))

# 校验无残留「待游戏内实测」句式
left = [s for s in ("待游戏内实测", "登记待实测", "待实测再开") if s in txt]
print("residual markers:", left if left else "none")

if count >= 20 and not left:
    with io.open(P, "w", encoding="utf-8") as f:
        f.write(txt)
    print("written OK (%d replacements)" % count)
else:
    print("ABORT — not written (%d replacements, residual=%s)" % (count, left))
    sys.exit(1)
