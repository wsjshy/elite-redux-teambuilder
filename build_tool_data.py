#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成交互配招工具数据（紧凑 JSON，内嵌 HTML）v2 —— 增加战术模板 + 名称校验"""
import csv, json, openpyxl, re, os, base64, io, urllib.request
from PIL import Image

BASE = r'D:\game\elite-redux'

# 属性名归一化：汉化图鉴用语差异 → 克制表标准名
TYPE_ALIAS = {'超能': '超能力'}
def norm_type(t):
    return TYPE_ALIAS.get(t, t)

# 1. 招式数值表
moves = {}
for r in csv.reader(open(BASE + r'\招式表_招式数值.csv', encoding='utf-8-sig')):
    if r[0] == '招式编号':
        continue
    # CSV 列：0编号 1中文 2英文 3属性 4分类 5威力 6命中 7PP 8先制 9附加 10描述 11详细
    # 输出列表下标：0..8 同 CSV，9=desc(简版)，10=lDesc(详细描述，A2 新增；= gameData moves.lDesc)
    moves[r[0]] = [r[0], r[1] or r[2], r[2], norm_type(r[3]), r[4],
                   int(r[5] or 0), int(r[6] or 0), int(r[7] or 0), int(r[8] or 0), r[10] or '',
                   (r[11] if len(r) > 11 else '') or '']
_n_ldesc = sum(1 for m in moves.values() if m[10])
print('moves:', len(moves), '| lDesc 非空:', _n_ldesc)
assert _n_ldesc > 100, ('lDesc 非空过少', _n_ldesc)
for _kw in ('recharge', 'recoil', 'Never misses'):
    assert any(_kw in m[10] for m in moves.values()), ('lDesc 缺关键文本', _kw)

# D4 确认（v4.x 数据层，记录在案、不改结构）：招式表 CSV 第 10 列（0-based）=**英文简版描述 desc**、
#   第 11 列=**英文详细描述 lDesc**。实证样例（id=1 拍击）：
#   "1,拍击,Pound,一般,物理,40,100,20,0,0,"Pounds the foe with forelegs or tail.","A physical attack delivered with a long tail or a foreleg, etc.""
#   输出 moves 列表下标：9=desc、10=lDesc（见上）；与 D1 的 mvDescZh 中文翻译源一致（都取 gameData moves.desc）。

# 2. 宝可梦基础 + 可学招式
species = {}
for r in csv.reader(open(BASE + r'\招式表_宝可梦基础.csv', encoding='utf-8-sig')):
    if r[0] == '宝可梦编号':
        continue
    # 0编号 1中文 2英文 3属性1 4属性2 5-10种族HP/攻/防/特攻/特防/速 11特性1-3 12天性1-3
    species[r[0]] = {
        'id': r[0], 'zh': r[1] or r[2], 'en': r[2], 't1': norm_type(r[3]), 't2': norm_type(r[4]),
        'base': [int(r[i] or 0) for i in range(5, 11)],
        'abis': [x.strip() for x in re.split(r'[/｜|,，]', r[11]) if r[11] and x.strip()],
        'inns': [x.strip() for x in re.split(r'[/｜|,，]', r[12]) if r[12] and x.strip()],
        'lv': [], 'tut': []
    }
print('species:', len(species))

# 3. 可学总表填充
for r in csv.reader(open(BASE + r'\招式表_可学总表.csv', encoding='utf-8-sig')):
    if r[0] == '宝可梦编号':
        continue
    sid, mid, lv, way = r[0], r[13], r[23], r[22]
    if sid not in species:
        continue
    if way == '升级':
        species[sid]['lv'].append([int(lv or 0), mid])
    else:
        species[sid]['tut'].append(mid)

for s in species.values():
    s['lv'].sort()

# 4. 克制表（xlsm Sheet1）—— A1 方阵修复（引擎升级规格 v1.0）
#    权威 21 属性顺序先定死（与 ERDATA.types 既定序一致），按 21 列逐格填：
#    xlsm 缺格填 1；克制表未收录的新属性行（星晶/无/神秘）全 1 → 恒为 21×21 方阵。
#    语义不变：行=防守、列=进攻、0/1/2/3 编码（0=免疫，2=2x，3=0.5x）。
TYPE_ORDER = ['一般', '格斗', '火', '冰', '电', '虫', '飞行', '钢', '草', '地面',
              '毒', '恶', '水', '超能力', '岩石', '龙', '幽灵', '妖精', '星晶', '无', '神秘']
wb = openpyxl.load_workbook(BASE + r'\ER2.65简汉化\ER2.65beta版图鉴v0.3.xlsm', read_only=True, data_only=True)
ws = wb['Sheet1']
grid = list(ws.iter_rows(values_only=True))
atk_hdr = [norm_type(str(c)) for c in grid[1][2:] if c is not None]   # 克制表列头（18 属性）
xlsm_matchup = {}   # 防守属性 -> {攻击属性: 编码}
for row in grid[2:]:
    defname = norm_type(str(row[1])) if row[1] else ''
    if not defname or defname == 'None':
        continue
    cells = {}
    for j, c in enumerate(row[2:2 + len(atk_hdr)]):
        cells[atk_hdr[j]] = int(c if c is not None else 1)
    xlsm_matchup[defname] = cells
types = list(TYPE_ORDER)
matchup = []
for dt in TYPE_ORDER:
    cells = xlsm_matchup.get(dt)
    if cells is None:                                  # 新属性行（星晶/无/神秘）→ 全中性 1
        matchup.append([1] * len(TYPE_ORDER))
    else:                                              # 按 21 列逐格取值（xlsm 缺格填 1）
        matchup.append([cells.get(at, 1) for at in TYPE_ORDER])
_used_types = set()
for s in species.values():
    _used_types.update([t for t in (s['t1'], s['t2']) if t])
for m in moves.values():
    if m[3]:
        _used_types.add(m[3])
_off = sorted(t for t in _used_types if t not in types)
if _off:
    print('警告: 属性不在权威 21 表内（未入方阵）:', _off)
print('types:', len(types), types)
assert len(matchup) == 21 and all(len(r) == 21 for r in matchup), 'matchup 非 21x21 方阵'
assert len(types) == 21, ('types 非 21', len(types))

# 5. 道具表
items = []
ITEM_ZH_EXTRA = {'Electric Seed': '电气种子', 'Psychic Seed': '精神种子', 'Grassy Seed': '青草种子',
                 'Misty Seed': '薄雾种子', 'Electric Gem': '电气宝石', 'Psychic Gem': '精神宝石'}
# F1 修复（v4.10）：道具表历史缺中文名（929 条中 766 条 zh 为空，历史既有缺口，不在本轮范围），
# mechLib「配合对象」列与 premise 文案对空 zh 会回落到内部编号（#339 / #352）。此处按**道具 id**
# 补 2 条 mechLib 实际引用的缺口；上面按英文名的 ITEM_ZH_EXTRA 保持原样。
ITEM_ZH_EXTRA_ID = {339: '飞行宝石', 352: '厚底靴'}
# v4.11 道具中文补译：ER-source\item_zh_cn.json 覆盖 762 条历史缺失中文名的道具
# （官方简中译名 508 + Mega 石按项目物种简中名派生 221 + 关键道具/ER 自创 33；逐条分类与
#  口径见 docs\研究资料\_v411道具中文补译_记录_20261010.md 与 ER-source\item_zh_cn.json）。
# 仅作**解析链末位兜底**：CSV 中文名 → ITEM_ZH_EXTRA(英文名) → ITEM_ZH_EXTRA_ID(id)
# → ITEM_ZH_CN(id)，既有优先级与行为不变；文件缺失时自动跳过。
try:
    with open(BASE + r'\ER-source\item_zh_cn.json', encoding='utf-8') as _f:
        ITEM_ZH_CN = json.load(_f)
except Exception as _e:
    print('警告: ER-source\\item_zh_cn.json 读取失败，道具中文补译（v4.11）已跳过:', _e)
    ITEM_ZH_CN = {}
print('itemZhCn:', len(ITEM_ZH_CN))
for r in csv.reader(open(BASE + r'\道具表_完整.csv', encoding='utf-8-sig')):
    if r[0] == '道具id':
        continue
    zh = r[2] or ITEM_ZH_EXTRA.get(r[1], '')
    if not zh and r[0].strip().isdigit():
        zh = ITEM_ZH_EXTRA_ID.get(int(r[0]), '')
    if not zh:
        zh = ITEM_ZH_CN.get(str(r[0]).strip(), '')
    items.append([r[0], r[1], zh, r[3]])
print('items:', len(items), '| zh 空:', sum(1 for _it in items if not _it[2]))

# 6. 特性表（合并 v0.3 + v0.5 两图鉴中文名：v0.3 有 1030 条含闪电之躯/毛茸茸，v0.5 有 791 条含 ER 特有中文名）
GD = json.load(open(BASE + r'\ER-source\gameDataV2.65beta.json', encoding='utf-8'))
# 非最终形态：按 ER CanEvolve 口径（ER-source\src\battle_util.c:14520-14533 —— 只要存在
# 「非 Mega / 非招式 Mega / 非原始回归」的进化手段即算可进化）。gameData evolutions 的 kd 映射：
#   kd=0 等级进化(699 条) / kd=3、kd=4 等级或性别分支进化(各 15 条) → 真实进化 ⇒ 计入非最终形态
#   kd=1 Mega 石(287 条) / kd=2 原始回归宝珠(18 条) / kd=5 招式进化(1 条) → CanEvolve 显式排除 ⇒ 仍算最终形态
# （盖欧卡382=kd2、固拉多383=kd2、烈空坐384=kd5 ⇒ 三者仍算最终形态；口径与 build_tool_html.py:31 _EVO_OK 一致）
NONFINAL = [str(s['id']) for s in GD['species']
            if any((e or {}).get('kd') in (0, 3, 4) for e in (s.get('evolutions') or []))]
print('nonFinal:', len(NONFINAL))
gd_abi = {a['id']: a for a in GD['abilities']}
def load_abi_zh(path):
    wb2 = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws2 = wb2['特性']
    out = {}
    for row in ws2.iter_rows(values_only=True):
        if row[0] is None or str(row[0]).isdigit() is False:
            continue
        aid = int(row[0])
        cn = row[3] if len(row) > 3 and row[3] else ''
        cdesc = ''
        if len(row) > 5 and row[5]:
            cdesc = str(row[5])
            if len(row) > 7 and row[7] and str(row[7]).strip() and str(row[7]) != str(row[5]):
                cdesc += '\n' + str(row[7])
        out[aid] = [str(cn).strip(), str(cdesc).strip()]
    return out
abi_zh = load_abi_zh(BASE + r'\ER2.65简汉化\ER2.65beta版图鉴v0.3.xlsm')
abi_zh5 = load_abi_zh(BASE + r'\ER2.5正式版图鉴v0.5.xlsm')
# 合并：v0.5（正式版）优先，v0.3 补缺；v0.3 的不同译名作为别名（ABI_ALIAS）
ABI_ALIAS = {}
for aid, v in abi_zh5.items():
    if not v[0]:
        continue
    if aid not in abi_zh or not abi_zh[aid][0]:
        abi_zh[aid] = v
    elif abi_zh[aid][0] != v[0]:
        ABI_ALIAS[abi_zh[aid][0]] = aid
        abi_zh[aid] = v
abilities = []
for aid, a in sorted(gd_abi.items()):
    zh, cdesc = abi_zh.get(aid, ['', ''])
    desc = cdesc or a.get('desc', '')
    abilities.append([str(aid), a['name'], zh, desc])
print('abilities:', len(abilities), '| aliases:', len(ABI_ALIAS))

# 6b. 特性效果标签（人工核对：扫描 1034 特性描述 + 游戏内验证）
# 键=gameData id；im=完全免疫属性；hf=伤害减半属性；add=出场添加属性；phy=物理伤害系数；
# out=输出倍率（对招式威力/能力，含 type 属性限定与 cond 条件）；def=全局减伤倍率；nt=备注
ABI_TAGS = {
  # —— 完全免疫（对战常用 + ER 特有）——
  '10':  {'im': ['电']},                # 蓄电 Volt Absorb
  '11':  {'im': ['水']},                # 储水 Water Absorb
  '18':  {'im': ['火']},                # 引火 Flash Fire
  '26':  {'im': ['地面']},              # 飘浮 Levitate
  '31':  {'im': ['电']},                # 避雷针 Lightning Rod
  '78':  {'im': ['电']},                # 电气引擎 Motor Drive
  '87':  {'im': ['水'], 'nt': '免疫水，但火伤害 1.25x'},   # 干燥皮肤 Dry Skin
  '114': {'im': ['水']},                # 引水 Storm Drain
  '154': {'im': ['恶']},                # 正义之心 Justified
  '157': {'im': ['草']},                # 食草 Sap Sipper
  '282': {'im': ['飞行']},              # 空气动力学 Aerodynamics
  '314': {'im': ['岩石']},              # 登山者 Mountaineer
  '446': {'im': ['火']},                # 好烤的身体 Well Baked Body
  '665': {'im': ['火', '水']},          # 元素漩涡 Elemental Vortex
  '746': {'im': ['水', '地面']},        # 荒芜太阳 Desolate Sun（水无效+食土）
  '869': {'im': ['火']},                # 灼日 Blistering Sun
  '871': {'im': ['水', '火']},          # 火焰形态 Fire Aspect（水无效+吸火）
  '422': {'im': ['恶', '幽灵', '虫']},  # 天赋异禀 Gifted Mind
  '511': {'im': ['地面']},              # 念动力 Telekinetic
  # —— 出场添加属性（多属性组合）——
  '847': {'add': ['电']},               # ★闪电之躯 Lightning Born（Storming 天性）
  '312': {'im': ['地面'], 'add': ['龙']},      # 龙飞 Dragonfly
  '715': {'im': ['地面'], 'add': ['超能力']},  # 悬浮 Hover
  '843': {'im': ['地面'], 'add': ['妖精']},    # 妖精飞行 Fey Flight
  '606': {'im': ['地面']},              # 空中飞人 Aerialist
  '688': {'im': ['地面']},              # 威严之翼 Imposing Wings
  # —— 伤害减半 ——
  '47':  {'hf': ['火', '冰']},          # 厚脂肪 Thick Fat
  '85':  {'hf': ['火']},                # 耐火 Heatproof
  '17':  {'hf': ['毒']},                # 免疫 Immunity
  '134': {'hf': ['幽灵', '恶']},        # 重金属 Heavy Metal
  '199': {'hf': ['火'], 'out': {'mul': 2.0, 'type': '水'}},   # 水泡 Water Bubble：水伤×2+火伤减半
  '303': {'hf': ['岩石'], 'out': {'mul': 1.2, 'type': '岩石'}},  # 化石 Fossilized
  '337': {'hf': ['草'], 'out': {'mul': 1.2, 'type': '草'}},   # 原木 Raw Wood
  '342': {'hf': ['火'], 'cond': '草属性时'},   # 海草 Seaweed
  '547': {'hf': ['幽灵']},              # 净化之盐 Purifying Salt
  '764': {'hf': ['火'], 'out': {'mul': 1.25, 'type': ['水', '冰']}},  # 深度冻结 Deep Freeze
  '855': {'hf': ['毒']},                # 超净 Hyper Cleanse
  '904': {'hf': ['水', '地面']},        # 坚实基础 Strong Foundation
  # —— 全局减伤（def）——
  '136': {'def': 0.5, 'cond': '满血时'},        # 多重鳞片 Multiscale（洛奇亚天性）
  '231': {'def': 0.5, 'cond': '满血时'},        # 影盾 Shadow Shield
  '246': {'def': 0.5, 'cond': '特殊招式'},      # 冰鳞 Ice Scales
  '571': {'def': 0.5, 'cond': '特殊招式'},      # 火鳞 Fire Scales
  '873': {'def': 0.5, 'cond': '特殊招式'},      # 冰羽 Ice Plumes
  '957': {'def': 0.5, 'cond': '满血时'},        # 脑质 Brain Mass
  '539': {'def': 0.6, 'cond': '特殊招式，速度-10%'},  # 铬镀层 Chrome Coat
  '705': {'def': 0.6, 'cond': '全伤害，速度-20%'},    # 太晶宝藏 Terastal Treasure
  '63':  {'def': 0.67, 'stat': 'def', 'cond': '异常状态时'},  # 神秘鳞片 Marvel Scale：防御1.5
  '179': {'def': 0.67, 'stat': 'def', 'cond': '青草场地'},   # 草皮 Grass Pelt
  '984': {'def': 0.67, 'stat': 'spd', 'cond': '青草场地'},   # 花项链 Flower Necklace
  '1018': {'def': 0.67, 'stat': 'spd', 'cond': '冰雹'},      # 雪怪 Abominable Monster
  # —— 输出倍率（out）——
  '37':  {'out': {'mul': 2.0, 'stat': 'atk', 'note': '大力士：物攻×2（原始能力）'}},   # Huge Power
  '74':  {'out': {'mul': 2.0, 'stat': 'spa', 'note': '瑜珈之力：特攻×2'}},             # Pure Power
  '301': {'out': {'mul': 2.0, 'stat': 'spa', 'note': '神秘力量：特攻×2'}},             # Cryptic Power
  '91':  {'out': {'mul': 1.33, 'note': '适应力：本系加成 1.5→2'}},                     # Adaptability
  '287': {'out': {'mul': 1.5, 'note': '神秘之力：全部招式获得本系加成'}},              # Mystic Power
  '101': {'out': {'mul': 1.5, 'cond': '威力≤60'}},                                     # 技术高手 Technician
  '110': {'out': {'mul': 2.0, 'cond': '被抵抗时'}},                                    # 有色眼镜 Tinted Lens
  '262': {'out': {'mul': 1.5, 'type': '电'}},                                          # 电晶体 Transistor（雷电云）
  '263': {'out': {'mul': 1.5, 'type': '龙'}},                                          # 龙颚 Dragon's Maw
  '449': {'out': {'mul': 1.5, 'type': '岩石'}},                                        # 岩石装载 Rocky Payload
  '512': {'out': {'mul': 1.5, 'type': '火'}},                                          # 燃烧 Combustion
  '713': {'out': {'mul': 1.5, 'type': '水'}},                                          # 水栖 Aquatic Dweller
  '62':  {'out': {'mul': 1.5, 'stat': 'atk', 'cond': '异常状态'}},                     # 毅力 Guts
  '137': {'out': {'mul': 1.5, 'stat': 'atk', 'cond': '中毒'}},                         # 毒补 Toxic Boost
  '255': {'out': {'mul': 1.5, 'stat': 'atk', 'cond': '限定首招'}},                     # 大猩猩战术 Gorilla Tactics
  '323': {'out': {'mul': 1.5, 'stat': 'spa', 'note': '威严之鸟：特攻×1.5'}},           # Majestic Bird
  '94':  {'out': {'mul': 1.5, 'stat': 'highest', 'cond': '晴天'}},                     # 太阳之力 Solar Power
  '159': {'out': {'mul': 1.5, 'stat': 'highest', 'cond': '沙暴'}},                     # 沙之力 Sand Force
  '269': {'out': {'mul': 1.5, 'stat': 'highest', 'cond': '冰雹'}},                     # 暴雪之力 Whiteout
  '935': {'out': {'mul': 1.5, 'stat': 'highest', 'cond': '雨天'}},                     # ★狂怒风暴 Raging Storm（洛奇亚）
  '198': {'out': {'mul': 2.0, 'cond': '对手换入时'}},                                  # 蹲守 Stakeout
  '557': {'out': {'mul': 2.0, 'cond': '出场首回合'}},                                  # 预备行动 Readied Action（入场暴击）
  '599': {'out': {'mul': 1.5, 'stat': 'atk', 'note': '死亡之力：物攻×1.5'}},           # Dead Power
  '703': {'out': {'mul': 1.5, 'stat': 'both', 'cond': '异常状态'}},                    # Rage Point
  '65':  {'out': {'mul': 1.5, 'type': '草', 'cond': '<1/3血'}},                        # 茂盛 Overgrow
  '66':  {'out': {'mul': 1.5, 'type': '火', 'cond': '<1/3血'}},                        # 猛火 Blaze
  '67':  {'out': {'mul': 1.5, 'type': '水', 'cond': '<1/3血'}},                        # 激流 Torrent
  '68':  {'out': {'mul': 1.5, 'type': '虫', 'cond': '<1/3血'}},                        # 虫之预感 Swarm
  '1025': {'out': {'mul': 1.5, 'type': '恶', 'cond': '<1/3血'}},                       # 邪恶能量 Foul Energy
  '276': {'out': {'mul': 1.5, 'type': '幽灵', 'cond': '<1/3血'}},                      # 复仇 Vengeance
  '509': {'out': {'mul': 1.5, 'type': '格斗', 'cond': '<1/3血'}},                      # 格斗家 Fighter
  '322': {'out': {'mul': 1.5, 'type': '电', 'cond': '<1/3血'}},                        # 短路 Short Circuit
  '343': {'out': {'mul': 1.5, 'type': '超能力', 'cond': '<1/3血'}},                    # 超能力之心 Psychic Mind
  '359': {'out': {'mul': 1.5, 'type': '飞行', 'cond': '<1/3血'}},                      # 鸟群 Flock
  '299': {'out': {'mul': 1.5, 'type': '地面', 'cond': '<1/3血'}},                      # 扎根 Earthbound
  '617': {'out': {'mul': 1.5, 'type': '岩石', 'cond': '<1/3血'}},                      # 钢铁意志 Rockhard Will
  '385': {'out': {'mul': 1.2, 'cond': '接触招式', 'note': '吸血 1/2 伤害'}},            # 诺斯费拉图 Nosferatu
  '731': {'out': {'mul': 1.5, 'cond': '暴击', 'note': '暴击并施加流血'}},               # To The Bone
  '365': {'out': {'mul': 1.5, 'type': ['妖精', '恶'], 'note': '妖/恶获得本系'}},        # Lunar Eclipse
  '32':  {'nt': '天恩：追加效果概率翻倍'},
  # —— 物理减伤 / 特殊提示 ——
  '218': {'phy': 0.5, 'nt': '毛茸茸：接触物攻伤害减半，但火伤害翻倍'},  # Fluffy
  '169': {'phy': 0.5, 'nt': '毛皮大衣：所有物理伤害减半'},              # Fur Coat
  '5':   {'nt': '结实：满血不被一击必杀'},
  '25':  {'nt': '神奇守护：仅效果绝佳招式能命中'},
  # —— ER v0.5 译名变体（双图鉴体系互认补丁）——
  '2':   {'nt': '雨幕：出场降雨（v0.5 译名=Drizzle）'},   # 雨幕 Rain Veil
  '34':  {'nt': '大叶子：晴天速度×1.5（v0.5 译名=叶绿素）'}, # Big Leaf
  '444': {'im': ['水'], 'nt': '蒸发：被水招命中无伤并布雾'},  # Evaporate
  '477': {'nt': '发电机：电场/进场充电（电场受益，非设置）'},   # Generator
  '717': {'nt': '野火：进场释放火旋持续灼烧'},                 # Wildfire
  # —— 属性转换 conv（-ate 类：一般属性招式转为指定属性；倍率待游戏内实测）——
  '96':  {'conv': '一般'},   # Normalize 一般化
  '174': {'conv': '冰'},     # Refrigerate 冰冻化
  '182': {'conv': '妖精'},   # Pixilate 妖精化
  '184': {'conv': '飞行'},   # Aerilate 飞行化
  '206': {'conv': '电'},     # Galvanize 电气化
  '315': {'conv': '水'},     # Hydrate 水化
  '325': {'conv': '毒'},     # Intoxicate 毒化
  # 以下 2 条为「特例」（v2.65 考古 §2：自有 onOffensiveMultiplier 乘 1.1，与 -ate 宏无关），
  # 且**来源属性不是 一般** —— conv 值仍按既有格式填「转换后的属性中文名」
  # （来源依据：ER-source\gameDataV2.65beta.json abilities[280]/[659] 描述，逐字见行末注释）
  '280': {'conv': '冰'},     # Crystallize 晶化：**岩石系**招 → 冰（gameData[280]："Rock-type moves become Ice and get a 1.1x boost."）
  '659': {'conv': '电'},     # Superconductor 超导：**钢系**招 → 电（gameData[659]："Steel-type moves become Electric and get a 1.1x boost."）
}

# 6c. MATCHUP_SP 预计算矩阵（v4.x 数据层；克制页「点格看人」数据源）
#   语义：每只宝可梦对 21 攻击属性的**实际承受倍率**
#         = 基础属性克制表（防守属性 × 攻击属性，21×21 方阵）
#           × 天性(inns) 的 ABI_TAGS 修正：im→0（免疫优先）、hf→×0.5、add→并入防守属性列表后再查表
#   口径：与引擎 `defCellTrio(s,at).inn`「天性档」逐字一致（abiAdjOf / IMMUNE_RISK 同源）。
#         可选特性(abis) **不入矩阵** —— 引擎在渲染时按用户勾选叠加差值（见 build_tool_html.py
#         mxSpPre/openMxList 契约注释：「矩阵口径 = 天性档」）。
#   存储：{攻击属性名: {物种id: 倍率}}，**稀疏**（只存 ≠1 的格；未列出即 ×1，控制体积）
#   档位：固定 {0, 0.25, 0.5, 1, 2, 4}（克制表码 0/1/2/3 → 0/1/2/0.5 后逐属性相乘）
_ABI_NM2ID = {}
for _a in abilities:                 # 同引擎 NM2ID：先英文名、再中文名（后者覆盖），别名仅在缺位时补
    _ABI_NM2ID[_a[1]] = _a[0]
    if _a[2]:
        _ABI_NM2ID[_a[2]] = _a[0]
for _k, _v in ABI_ALIAS.items():     # 注意：ABI_ALIAS 的值在 JSON 里是 int，须与 abilities 的字符串 id 对齐
    if _k not in _ABI_NM2ID:
        _ABI_NM2ID[_k] = str(_v)

def _abi_tag_of(name):
    _aid = _ABI_NM2ID.get(name)
    return ABI_TAGS.get(_aid) if _aid is not None else None

_TIDX = {t: i for i, t in enumerate(types)}

def _mx_decode(code):
    if code == 0:
        return 0
    if code == 2:
        return 2
    if code in (0.5, 3):
        return 0.5
    return 1

def _mx_def_mult(def_types, at):
    m = 1
    for _dt in def_types:
        _j = _TIDX.get(_dt)
        if _j is None:               # 防守属性不在 21 表内 → 中性（防越界）
            continue
        v = _mx_decode(matchup[_j][_TIDX[at]])
        if v == 0:
            return 0                 # 属性免疫：短路（与引擎 defMult 同语义）
        m *= v
    return m

def _mx_inn_mods(sp, at):
    """返回 (add 属性列表, im?, hf?)：只取天性 inns 的 ABI_TAGS 修正（可选特性不入矩阵）"""
    add, im, hf = [], False, False
    for _n in sp['inns']:
        g = _abi_tag_of(_n)
        if not g:
            continue
        for _x in (g.get('add') or []):
            if _x not in add:
                add.append(_x)
        if at in (g.get('im') or []):
            im = True
        if at in (g.get('hf') or []):
            hf = True
    return add, im, hf

MATCHUP_SP = {}
for _at in types:
    _col = {}
    for _sid, _sp in species.items():
        _base = []
        for _t in (_sp['t1'], _sp['t2']):
            if _t and _t != '-' and _t not in _base:
                _base.append(_t)
        _add, _im, _hf = _mx_inn_mods(_sp, _at)
        _defs = _base + [_x for _x in _add if _x not in _base]
        _v = _mx_def_mult(_defs, _at)
        if _im:
            _v = 0
        elif _hf:
            _v *= 0.5
        if _v != 1:
            _col[_sid] = _v
    if _col:                          # 全 1 的攻击属性（星晶/无/神秘等）不入表 → 保持稀疏
        MATCHUP_SP[_at] = _col

_mx_cells = sum(len(v) for v in MATCHUP_SP.values())
_mx_sp_hit = len({sid for v in MATCHUP_SP.values() for sid in v})
_mx_vals = sorted({x for v in MATCHUP_SP.values() for x in v.values()})
# 檔位说明：常规为 {0, 0.25, 0.5, 2, 4}；**0.125** 仅出现在「基础双属性 + 天性 add 属性」三方均抵抗时
#   （0.5×0.5×0.5）——引擎 defMult 同样产出 0.125，且 mxBucket 把它归入「0.25×」档，
#   故此处**保留精确值**（与引擎逐值一致，避免下采样失真），档位集对消费端仍是 {0,0.25,0.5,1,2,4}。
_mx_125 = sum(1 for v in MATCHUP_SP.values() for x in v.values() if x == 0.125)
assert set(_mx_vals) <= {0, 0.125, 0.25, 0.5, 2, 4}, ('matchupSp 出现 1 或非法档位', _mx_vals)
print('matchupSp:', len(MATCHUP_SP), '个攻击属性 |', _mx_cells, '个非 1 格 |',
      _mx_sp_hit, '只有格物种 | 档位', _mx_vals, '| 其中 0.125 格', _mx_125)

# 7. 战术模板（ER 定制，参考官方 FAQ/Full Features 与通用对战体系；match=推荐宝可梦匹配权重，
#     counters=模板天敌（怕的属性+会被其免疫的核心招属性），flow=开局流程）
TEMPLATES = [
  {
    "name": "雨天速攻",
    "theme": "降雨开局 → 悠游自如翻倍速 → 必中暴风/打雷 + 水系爆发",
    "roles": ["天气设置者", "悠游打手 ×2~3", "水电补盲", "联防位"],
    "keys": [
      ["特性", "降雨"], ["特性", "悠游自如"], ["特性", "雨盘"],
      ["招式", "暴风"], ["招式", "打雷"], ["招式", "水炮"], ["招式", "冲浪"],
      ["道具", "潮湿岩石"]
    ],
    "match": {"abis": ["降雨", "悠游自如", "雨盘"], "moves": ["暴风", "打雷", "水炮", "冲浪", "热水"], "types": ["水"]},
    "counters": {"types": ["电", "草"], "abis": ["蓄电", "避雷针", "电气引擎", "储水", "引水", "食草"]},
    "flow": ["降雨特性手开局（潮湿岩石）→ 天气落地", "悠游打手先读上场，暴风/打雷必中压制", "水电双修补盲（水炮+打雷覆盖草/龙）", "联防位挡电系反扑"],
    "tips": [
      "ER 天气为无限回合（天气特性），但增伤从 50% 削到 20% —— 雨天核心价值是「暴风/打雷必中 + 悠游自如提速」，不是无脑水系威力",
      "降雨特性开局即触发；雨盘+剩饭可组半受",
      "提防晴天手反压（对手 4 特性可能自带日照）"
    ]
  },
  {
    "name": "晴天速攻",
    "theme": "日照开局 → 叶绿素翻倍速 → 日光束免蓄力 + 火系爆发",
    "roles": ["天气设置者", "叶绿素打手 ×2", "火系爆破", "联防位"],
    "keys": [
      ["特性", "日照"], ["特性", "叶绿素"], ["特性", "太阳之力"],
      ["招式", "日光束"], ["招式", "喷火"], ["招式", "热风"],
      ["道具", "炽热岩石"]
    ],
    "match": {"abis": ["日照", "叶绿素", "太阳之力"], "moves": ["日光束", "喷火", "热风", "喷射火焰"], "types": ["火", "草"]},
    "counters": {"types": ["水", "岩石", "地面"], "abis": ["引水", "储水", "干燥皮肤", "引火", "火焰之躯"]},
    "flow": ["日照手开局（炽热岩石）", "叶绿素打手先手火招/日光束压制", "太阳之力炮台跟进（注意每回合掉血，配回复）", "水/岩反压时换入联防位"],
    "tips": [
      "ER 晴增伤 20%；日光束晴天下无需蓄力",
      "太阳之力特攻+1.5 但每回合掉血，配剩饭/文柚果",
      "注意对手雨/沙反压"
    ]
  },
  {
    "name": "沙暴联防",
    "theme": "扬沙开局 → 挖沙提速 / 沙之力增伤 → 岩崩地震压制",
    "roles": ["天气设置者", "挖沙打手", "岩石系特防受益者", "钉子手"],
    "keys": [
      ["特性", "扬沙"], ["特性", "拨沙"], ["特性", "沙之力"], ["特性", "沙隐"],
      ["招式", "地震"], ["招式", "岩崩"], ["招式", "隐形岩"],
      ["道具", "光滑岩石"]
    ],
    "match": {"abis": ["扬沙", "拨沙", "沙之力", "沙隐"], "moves": ["地震", "岩崩", "隐形岩", "尖石攻击"], "types": ["岩石", "地面", "钢"]},
    "counters": {"types": ["水", "草", "格斗"], "abis": ["引水", "储水", "干燥皮肤", "食草", "飘浮"]},
    "flow": ["扬沙手开局（光滑岩石）", "钉子手铺隐形岩/撒菱", "挖沙打手先手地震/岩崩", "沙隐+岩石特防受益者轮转"],
    "tips": [
      "沙暴给岩石系特防 +50%（持续削非岩/地/钢系血）",
      "沙隐+沙暴闪避流适合受队；挖沙速度翻倍适合攻队",
      "注意沙暴不会因对方换宠结束（ER 无限天气）"
    ]
  },
  {
    "name": "雪天堡垒",
    "theme": "降雪开局 → 极光幕双减伤 → 冰系防御+50% → 暴风雪必中",
    "roles": ["天气设置者", "冰系肉盾", "极光幕辅助", "冰/地/钢打手"],
    "keys": [
      ["特性", "降雪"], ["特性", "拨雪"], ["特性", "冰冻之躯"],
      ["招式", "极光幕"], ["招式", "暴风雪"],
      ["道具", "冰冷岩石"]
    ],
    "match": {"abis": ["降雪", "拨雪", "冰冻之躯"], "moves": ["极光幕", "暴风雪", "冰柱坠击", "冰冻光束"], "types": ["冰", "地面", "钢"]},
    "counters": {"types": ["火", "格斗", "钢", "岩石"], "abis": ["引火", "耐火", "厚脂肪"]},
    "flow": ["降雪手开局（冰冷岩石）", "极光幕双墙落地", "冰系肉盾顶脸消耗（冻伤压特攻）", "冰/钢/地打手清场"],
    "tips": [
      "ER 雪天给冰系防御 +50%（比原版更强，冰系肉盾可行）",
      "冻伤替代冰冻：1/16 掉血 + 特攻减半 —— 冰系招式附带价值",
      "极光幕=反射壁+光墙合一，雪天受队核心"
    ]
  },
  {
    "name": "电气场地速攻",
    "theme": "电气制造者开局 → 电伤提升 + 防睡 → 电晶体高速压制",
    "roles": ["电场设置者", "电系打手 ×2", "飞行/飘浮联防", "地面免疫位"],
    "keys": [
      ["特性", "电气制造者"], ["招式", "十万伏特"], ["招式", "打雷"], ["招式", "闪电猛冲"],
      ["道具", "电气种子"]
    ],
    "match": {"abis": ["电气制造者", "电晶体", "蓄电", "电气引擎", "避雷针"], "moves": ["十万伏特", "打雷", "闪电猛冲", "伏特替换", "电网"], "types": ["电"]},
    "counters": {"types": ["地面"], "abis": ["飘浮", "飞行", "电磁浮游", "蓄电", "避雷针"]},
    "flow": ["电场手开局（电气种子）", "电系打手先手压制（电场内电招+30%）", "伏特替换游击骗联防", "飘浮/飞行位免疫地面反扑"],
    "tips": [
      "电场内电属性招式威力 +30%（ER 沿用）；全队免疫睡眠——防催眠向",
      "电场 + 电气引擎 = 白嫖提速，电晶体打手必配",
      "地面系是最大天敌：队伍至少 1 个飘浮/飞行/电场飞行特性"
    ]
  },
  {
    "name": "精神场地特攻",
    "theme": "精神制造者开局 → 超能伤提升 + 防先制 → 超能力炮台碾压",
    "roles": ["场地设置者", "超能力炮台 ×2", "联防位", "先制反制位"],
    "keys": [
      ["特性", "精神制造者"], ["招式", "精神强念"], ["招式", "预知未来"], ["招式", "精神冲击"],
      ["道具", "精神种子"]
    ],
    "match": {"abis": ["精神制造者", "超能皮肤"], "moves": ["精神强念", "预知未来", "精神冲击", "魔法闪耀"], "types": ["超能力", "妖精"]},
    "counters": {"types": ["恶", "幽灵", "钢"], "abis": ["恶作剧之心", "不服输"]},
    "flow": ["精神制造者开局（精神种子）", "超能炮台输出（场地内 +30%）", "场地防先制——恶系偷袭/突袭无效", "恶/幽灵反压时换联防位"],
    "tips": [
      "精神场地内超能力招 +30%，且全队免疫先制招式——克制偷袭/突袭/神速",
      "恶/幽灵系免疫超能力——队伍需恶/钢/妖精打击面",
      "场地会被对手场地覆盖，注意反场地手"
    ]
  },
  {
    "name": "青草场地回复",
    "theme": "草场制造者开局 → 草伤提升 + 场地每回合回复 → 种子受队",
    "roles": ["场地设置者", "草系消耗", "寄生种子手", "回复轮转"],
    "keys": [
      ["特性", "青草制造者"], ["招式", "飞叶快刀"], ["招式", "寄生种子"], ["招式", "终极吸取"],
      ["道具", "青草种子"]
    ],
    "match": {"abis": ["青草制造者", "食草"], "moves": ["飞叶快刀", "寄生种子", "终极吸取", "青草滑梯", "光合作用"], "types": ["草"]},
    "counters": {"types": ["火", "冰", "飞行", "毒"], "abis": ["引火", "食草", "毒疗"]},
    "flow": ["草场手开局（青草种子）", "寄生种子+场地回复磨血", "草系消耗招压制水/地/岩", "回复位轮转保血线"],
    "tips": [
      "草场地内草招 +30%，全队每回合回复 1/16（剩饭叠加）",
      "寄生种子+场地回复 = 双吸血受队核心",
      "青草滑梯在场地内必先制——强力补刀"
    ]
  },
  {
    "name": "薄雾场地龙盾",
    "theme": "薄雾制造者开局 → 全队防异常 + 龙伤减半 → 龙系站场",
    "roles": ["场地设置者", "龙系肉盾 ×2", "异常免疫核心", "物特双防轮转"],
    "keys": [
      ["特性", "薄雾制造者"], ["招式", "龙之波动"], ["招式", "龙之俯冲"], ["招式", "鳞片噪音"],
      ["道具", "薄雾种子"]
    ],
    "match": {"abis": ["薄雾制造者", "多重鳞片"], "moves": ["龙之波动", "龙之俯冲", "鳞片噪音", "龙尾"], "types": ["龙", "妖精"]},
    "counters": {"types": ["冰", "妖精", "龙"], "abis": ["冰冻之躯", "妖精皮肤"]},
    "flow": ["薄雾制造者开局（薄雾种子）", "龙系肉盾站场（场地内龙伤减半）", "全队免疫异常——免疫剧毒/麻痹/睡眠消耗", "对冰/妖反压用钢/火补位"],
    "tips": [
      "薄雾场地内龙系伤害减半，全队免疫异常状态——受队最强后盾",
      "注意：对手带雾场手覆盖会失去防异常",
      "龙系招式被妖/钢抵抗——需火/钢/毒补打击面"
    ]
  },
  {
    "name": "强化清场轴",
    "theme": "剑舞/龙舞/诡计强化 → 联防轮转保强化 → 一击清场",
    "roles": ["强化打手 ×2", "强化时机手", "联防轮转", "威慑位"],
    "keys": [
      ["招式", "剑舞"], ["招式", "龙之舞"], ["招式", "诡计"], ["招式", "破壳"],
      ["道具", "气势披带"]
    ],
    "match": {"abis": ["大力士", "胆量", "瑜伽之力", "硬爪"], "moves": ["剑舞", "龙之舞", "诡计", "破壳", "自我激励"], "types": ["一般", "格斗", "龙", "超能力"]},
    "counters": {"types": ["格斗", "妖精", "幽灵"], "abis": ["威吓", "压迫感", "结实"]},
    "flow": ["联防轮转磨出强化时机（对手弱宠在场）", "强化一次（剑舞/诡计）→ 保持血线", "先制补刀手压场（对手反强化）", "强化成型后清场"],
    "tips": [
      "ER 个体默认 31：强化后能力提升收益最大化",
      "防威吓：优先强化物攻手可选「不服输/自信过度」特性",
      "气势披带+强化=保底一回合成型；注意怕先制击杀"
    ]
  },
  {
    "name": "顺风游击",
    "theme": "恶作剧之心顺风 → 全队翻倍速 → 急速折返/伏特替换轮转压场",
    "roles": ["顺风手（恶作剧之心）", "高速打手 ×2", "折返轮转位", "先制收割位"],
    "keys": [
      ["特性", "恶作剧之心"], ["招式", "顺风"], ["招式", "急速折返"], ["招式", "伏特替换"],
      ["道具", "气势披带"]
    ],
    "match": {"abis": ["恶作剧之心", "疾风之翼", "轻装"], "moves": ["顺风", "急速折返", "伏特替换", "神速", "突袭"], "types": ["飞行", "电"]},
    "counters": {"types": ["岩石", "电"], "abis": ["蓄电", "避雷针", "飘浮"]},
    "flow": ["恶作剧之心顺风手开局（先制顺风）", "高速打手压场", "折返招边打边换（骗联防读）", "残局先制招收割"],
    "tips": [
      "恶作剧之心=变化招必先制，顺风手最稳（防拍落注意）",
      "急速折返/伏特替换=无损换人+压场轮转，配合顺风节奏",
      "顺风仅 4 回合，注意续顺风窗口"
    ]
  },
  {
    "name": "戏法空间",
    "theme": "空间手开戏法空间 → 低速高攻手先手爆发",
    "roles": ["空间手（超低速）", "低速打手 ×2~3", "联防位", "速度 0 铁壁"],
    "keys": [
      ["特性", "迟钝"], ["特性", "硬爪"], ["特性", "大力士"],
      ["招式", "戏法空间"], ["招式", "喷水"], ["招式", "重磅冲撞"], ["招式", "地震"],
      ["道具", "进化奇石"]
    ],
    "match": {"abis": ["迟钝", "硬爪", "大力士", "慢出"], "moves": ["戏法空间", "喷水", "重磅冲撞", "地震", "陀螺球"], "types": ["钢", "水", "地面", "格斗"]},
    "counters": {"types": ["格斗", "幽灵"], "abis": ["恶作剧之心", "抢先手"]},
    "flow": ["空间手开戏法空间（0速IV+减速性格）", "低速炮台在空间内先手爆发", "空间回合内稳住别被压血", "空间结束后二次开空间或转联防"],
    "tips": [
      "ER 个体默认 31 且可用 Iron Pill 把速度 IV 调 0 —— 空间队门槛极低",
      "空间手要尽量慢（0 速 IV + 减速性格 + 低速种族）",
      "防先制：空间内先制招式仍先手，注意对手拍落/偷袭",
      "进化奇石（双防 ×1.5，仅未完全进化者生效）—— 最终形态不适用，该位须为可进化形态"
    ]
  },
  {
    "name": "钉子受队",
    "theme": "隐形岩/撒菱/毒菱铺场 → 威吓/再生力轮转 → 剧毒/冻伤消耗",
    "roles": ["钉子手 ×2", "物盾", "特盾", "清除浓雾手", "再生力轮转"],
    "keys": [
      ["特性", "再生力"], ["特性", "威吓"], ["特性", "结实"], ["特性", "自然回复"],
      ["招式", "隐形岩"], ["招式", "撒菱"], ["招式", "毒菱"], ["招式", "清除浓雾"],
      ["招式", "剧毒"], ["招式", "羽栖"], ["招式", "自我再生"],
      ["道具", "剩饭"], ["道具", "凸凸头盔"], ["道具", "黑色污泥"]
    ],
    "match": {"abis": ["再生力", "威吓", "结实", "自然回复", "储水"], "moves": ["隐形岩", "撒菱", "毒菱", "清除浓雾", "剧毒", "羽栖", "自我再生"], "types": ["钢", "毒", "水"]},
    "counters": {"types": ["格斗", "地面"], "abis": ["破格", "魔法反射", "飘浮"]},
    "flow": ["钉子手铺场（隐形岩优先）", "威吓/头盔物盾顶物攻手", "特盾顶特攻手，剧毒/冻伤消耗", "清除浓雾反拆对方钉子", "再生力轮转保血线"],
    "tips": [
      "ER 训练师全带道具+4 特性，钉子+剧毒消耗比纯对攻更稳",
      "凸凸头盔+威吓=物攻手克星；再生力轮转回血",
      "冻伤（特攻减半）配合剧毒可双压物特两端"
    ]
  },
  {
    "name": "毒钉受队",
    "theme": "毒菱铺场 + 剧毒消耗 → 钢/毒豁免规避 → 再生力轮转逼换",
    "roles": ["毒菱手", "剧毒消耗手", "物盾", "特盾", "清除浓雾手"],
    "keys": [
      ["招式", "毒菱"], ["招式", "剧毒"], ["招式", "撒菱"], ["招式", "隐形岩"], ["招式", "清除浓雾"],
      ["招式", "自我再生"], ["招式", "羽栖"],
      ["特性", "再生力"], ["特性", "腐蚀"], ["特性", "免疫"],
      ["道具", "剩饭"], ["道具", "黑色污泥"]
    ],
    "match": {"abis": ["再生力", "腐蚀", "免疫", "威吓", "自然回复"], "moves": ["毒菱", "剧毒", "撒菱", "隐形岩", "清除浓雾", "自我再生"], "types": ["毒", "钢", "水"]},
    "counters": {"types": ["钢", "毒", "地面"], "abis": ["免疫", "飘浮", "毒疗"]},
    "flow": ["毒菱手开场先铺毒菱（对无钢/毒队伍立即压制）", "剧毒 + 自我再生/羽栖消耗站场", "物盾挡物攻、特盾挡特攻，逼换叠毒", "清除浓雾反拆对手钉子（对手侧墙 + 降闪避）", "再生力轮转保血线，拖垮对手输出"],
    "tips": [
      "毒菱层数与豁免规则读引擎参数 WCONF.hazardRules.toxicSpikes（maxLayers / steelImmune / groundedPoisonAbsorbs），本卡不写死数值",
      "撒菱与隐形岩伤害分别读 WCONF.hazardRules.spikes.dmg[] 与 WCONF.hazardRules.stealthRock.dmgByRockEff[]，勿按固定数值理解",
      "清除浓雾的拆除范围按 WCONF.defogRapidSpin 语义（双方钉子 / 仅对手侧墙 / 不清场地地形）",
      "隐形岩存在「非首铺疑似失效」的 Beta2 报告（C 档待实测），铺钉前先用撒菱/毒菱探路"
    ]
  },
  {
    "name": "强化接力",
    "theme": "剑舞/龙舞/蝶舞堆强化 → 接棒传递 → 高速打手一击清场",
    "roles": ["强化手（接力）", "接棒目标打手", "先制收割位", "掩护位"],
    "keys": [
      ["招式", "剑舞"], ["招式", "龙之舞"], ["招式", "蝶舞"], ["招式", "接棒"], ["招式", "替身"], ["招式", "挑衅"],
      ["特性", "技术高手"], ["特性", "多重鳞片"], ["特性", "恶作剧之心"],
      ["道具", "气势披带"], ["道具", "剩饭"]
    ],
    "match": {"abis": ["技术高手", "多重鳞片", "恶作剧之心", "不屈之心"], "moves": ["剑舞", "龙之舞", "蝶舞", "接棒", "替身", "挑衅"], "types": ["一般", "格斗", "龙", "虫"]},
    "counters": {"types": ["恶", "幽灵"], "abis": ["威吓", "迟钝", "压迫感"]},
    "flow": ["掩护位先手替身/挑衅，堵住对手拍落与挑衅", "强化手在安全回合堆强化（剑舞/龙之舞/蝶舞）", "接棒把能力等级传给高速打手", "接力目标上场后一击清场；残局用先制收割"],
    "tips": [
      "接棒传递的能力等级按强化招加成档（引擎 WCONF 强化倍率档）结算，勿按固定等级理解",
      "替身消耗按自身最大 HP 比例结算（招式自带比例），注意血线与强化回合的取舍",
      "防威吓：接力目标若被威吓会损失刚叠好的物攻等级，优先选「不服输/自信过度」等反降能力特性"
    ]
  },
  {
    "name": "天气双核",
    "theme": "天气手开局 → 提速核先手 + 增伤核爆破 → 双线压制",
    "roles": ["天气设置者", "提速核（悠游/叶绿素）", "增伤核（太阳之力/沙之力/暴雪之力）", "联防位"],
    "keys": [
      ["特性", "降雨"], ["特性", "悠游自如"], ["特性", "雨盘"], ["特性", "叶绿素"], ["特性", "太阳之力"],
      ["招式", "水炮"], ["招式", "冲浪"], ["招式", "暴风"], ["招式", "打雷"], ["招式", "日光束"],
      ["道具", "潮湿岩石"], ["道具", "炽热岩石"]
    ],
    "match": {"abis": ["降雨", "悠游自如", "雨盘", "太阳之力", "叶绿素"], "moves": ["水炮", "冲浪", "暴风", "打雷", "日光束"], "types": ["水", "草", "火"]},
    "counters": {"types": ["电", "草", "水"], "abis": ["蓄电", "避雷针", "储水", "引水", "食草"]},
    "flow": ["天气手开场（带对应天气岩石延长）", "提速核先手读场，增伤核后排待机", "两核轮流上场，按天气窗口错峰施压", "天气被覆盖时先转联防位，等天气手二次上场抢回"],
    "tips": [
      "天气增伤不再分「手动/特性」两档，统一读引擎参数 WCONF.weatherBoostByFlag（TEMPORARY|PRIMAL 档）",
      "天气持续回合与岩石延长读 WCONF.manualDurTurns / abilityDurTurns / rockTurnsManual / rockTurnsAbility",
      "「特性天气额外增伤」的旧口径（WCONF.abilityBoost）已废弃，勿据此算伤害"
    ]
  },
  {
    "name": "场地控制",
    "theme": "场地制造者铺场 → 场地增伤 + 反先制/防睡 → 场地窗口内控节奏",
    "roles": ["场地设置者", "场地受益打手", "反先制位", "第二场地手"],
    "keys": [
      ["特性", "电气制造者"], ["特性", "精神制造者"], ["特性", "青草制造者"], ["特性", "薄雾制造者"],
      ["招式", "电气场地"], ["招式", "精神场地"], ["招式", "青草场地"], ["招式", "薄雾场地"],
      ["招式", "十万伏特"], ["招式", "精神强念"], ["招式", "青草滑梯"],
      ["道具", "电气种子"], ["道具", "精神种子"]
    ],
    "match": {"abis": ["电气制造者", "精神制造者", "青草制造者", "薄雾制造者"], "moves": ["电气场地", "精神场地", "青草场地", "薄雾场地", "十万伏特", "精神强念", "青草滑梯"], "types": ["电", "超能力", "草", "妖精"]},
    "counters": {"types": ["地面", "恶", "幽灵"], "abis": ["飘浮", "蓄电", "引火"]},
    "flow": ["场地手开局铺对应场地（配对应种子一次性提防）", "场地内打手吃增伤；精神场地封锁对手先制招式", "电气场地防睡、薄雾场地防异常", "被对手覆盖场地时立刻换第二场地手反制"],
    "tips": [
      "场地增伤与持续回合读引擎参数 WCONF.terrainBoost / terrainDurTurns / terrainExtenderTurns，本卡不写死数值",
      "精神场地反先制为场地固有语义；薄雾场地只防异常——「龙系伤害减半」已移除，勿再按旧文案组队",
      "场地可被对手场地招/特性覆盖：队伍必须备第 2 场地手抢回控制权"
    ]
  },
  {
    "name": "吸血站场",
    "theme": "吸取类招式回血 + 寄生种子/剩饭叠加 → 耐久站场滚雪球",
    "roles": ["吸血打手 ×2", "寄生种子手", "物盾", "特盾"],
    "keys": [
      ["招式", "终极吸取"], ["招式", "吸取拳"], ["招式", "吸血"], ["招式", "吸取之吻"], ["招式", "吸取力量"],
      ["招式", "寄生种子"], ["招式", "自我再生"], ["招式", "羽栖"],
      ["特性", "毛皮大衣"], ["特性", "多重鳞片"], ["特性", "再生力"],
      ["道具", "剩饭"], ["道具", "黑色污泥"]
    ],
    "match": {"abis": ["毛皮大衣", "多重鳞片", "再生力", "水泡", "腐蚀"], "moves": ["终极吸取", "吸取拳", "吸血", "吸取之吻", "吸取力量", "寄生种子", "自我再生"], "types": ["草", "格斗", "虫", "水", "毒"]},
    "counters": {"types": ["火", "冰", "飞行"], "abis": ["引火", "食草", "威吓"]},
    "flow": ["寄生种子手先铺种子，制造固定回血 + 削血", "吸血打手站场边打边回，维持血线", "按对手攻击类型轮转物盾/特盾顶场", "剩饭/黑色污泥叠加种子与场地回复，滚雪球"],
    "tips": [
      "吸取类招式的回复按「造成伤害的比例」结算（招式自带比例），勿与剩饭/黑色污泥的固定回复混算",
      "道具 → 特性 → 种子/场地的回复在同一回合末按引擎结算流水线依次生效，参数读 WCONF 对应档位",
      "毛皮大衣 / 多重鳞片 / 冰鳞粉等减伤特性按 WCONF 全局减伤档（def / phy / hf），与吸血形成双保险",
      "吸血类打手怕高威力先制与爆发：留一格联防位挡对手的清场招"
    ]
  },
  {
    "name": "双天气轮换",
    "theme": "两套天气设置者轮换 → 针对对手天气反制 → 天气窗口错峰压制",
    "roles": ["天气手 A", "天气手 B", "天气受益打手", "联防位"],
    "keys": [
      ["特性", "降雨"], ["特性", "日照"], ["特性", "扬沙"], ["特性", "降雪"],
      ["招式", "求雨"], ["招式", "大晴天"], ["招式", "水炮"], ["招式", "热风"], ["招式", "日光束"],
      ["道具", "潮湿岩石"], ["道具", "炽热岩石"]
    ],
    "match": {"abis": ["降雨", "日照", "扬沙", "降雪"], "moves": ["求雨", "大晴天", "水炮", "热风", "日光束"], "types": ["水", "火", "草"]},
    "counters": {"types": ["电", "岩石", "草"], "abis": ["蓄电", "储水", "引水", "引火"]},
    "flow": ["首发天气手 A 铺天气，吃对应增伤窗口", "对手用天气手/天气招覆盖时，换天气手 B 抢回", "两套天气错峰：A 挡水队、B 挡草/冰队", "受益打手只在己方天气窗口内输出，窗口外转联防"],
    "tips": [
      "手动天气与特性天气的时长/倍率同档，统一读 WCONF.manualDurTurns / abilityDurTurns 与 WCONF.weatherBoostByFlag，不需两套算法",
      "两名天气手都需带对应天气岩石：延长档读 WCONF.rockTurnsManual / rockTurnsAbility",
      "天气招式（求雨/大晴天/沙暴/冰雹）由 WEATHER_MV 映射体系，换场时按体系切换受益特性",
      "注意「雨天火系减半」与「晴天水系减半」的反向压制：双天气正好互解"
    ]
  }
]

# 名称命中校验（确保模板可点击跳转；abi_by_zh 并入 ABI_ALIAS 别名）
abi_by_zh = {a[2] or a[1]: a for a in abilities}
for _al, _aid in ABI_ALIAS.items():
    if _al not in abi_by_zh:
        _hit = next((a for a in abilities if a[0] == str(_aid)), None)
        if _hit:
            abi_by_zh[_al] = _hit
abi_by_en = {a[1]: a for a in abilities}
mv_by_zh = {m[1]: m for m in moves.values()}
mv_by_en = {m[2]: m for m in moves.values()}
it_by_zh = {i[2]: i for i in items}
it_by_en = {i[1]: i for i in items}
miss = []
for tpl in TEMPLATES:
    for kind, name in tpl['keys']:
        hit = False
        if kind == '特性':
            hit = name in abi_by_zh or name in abi_by_en
        elif kind == '招式':
            hit = name in mv_by_zh or name in mv_by_en
        elif kind == '道具':
            hit = name in it_by_zh or name in it_by_en
        if not hit:
            miss.append((tpl['name'], kind, name))
print('\n模板名称未命中:')
for x in miss:
    print(' ', x)
if not miss:
    print('  全部命中 ✓')

# 7b. 人工分析（用户 分类.xlsx → 形态 id 映射，嵌入 coreNotes）
#     映射依据 gameData 中文名（探针核对 45/45 候选；玉米暴君 gameData 无此名，跳过待用户确认）
CLS_MAP = {
  'mega长耳兔':1541,'滴蛛霸plus':752,'mega拉帝亚斯':1539,'信使鸟snow':225,'mega老翁龙':1887,
  'mega美纳斯':2101,'爆肌蚊':794,'mega耿鬼':1509,'mega沙奈朵R':2672,'噬沙堡爷plus':770,
  '穿着熊plus':760,'mega蜥蜴王':1522,'mega大嘴娃':1527,'mega妙蛙花Y':1501,'mega妙蛙花X':2188,
  '大食花R':2293,'mega帝王拿波R':2176,'mega七夕青鸟':1533,'mega大比鸟':1506,
  'mega双倍多多冰':2268,'胖甜妮plus':685,'mega炽焰咆啸虎':2219,'芳香精plus':683,'mega怪力':2103,
  '帝牙卢卡':483,'mega姆克鹰':1893,'mega君主蛇':2214,'mega喷火龙X':1502,'mega喷火龙Y':1503,
  'mega喷火龙Z':2191,'mega土王':2232,'mega路卡利欧X':1543,'mega路卡利欧Z':2159,'mega暴飞龙':1537,
  'mega快龙Y':1880,'mega七夕青鸟R':2303,'mega土龙结结':1079,'mega皮卡丘':2208,'mega水箭龟X':2189,
  'mega水箭龟Y':1504,'mega喷火驼':1532,'mega浮潜鼬':419,'mega水晶灯火灵R':2279,'mega龙头地鼠':1881,
}
CORE_NOTES = []
wb_cls = openpyxl.load_workbook(BASE + r'\ER2.65简汉化\分类.xlsx', read_only=True, data_only=True)
ws_cls = wb_cls['Sheet1']
skip = []
for row in ws_cls.iter_rows(values_only=True):
    name = str(row[0] or '').strip()
    if not name or name == 'name':
        continue
    sid = CLS_MAP.get(name)
    if sid is None:
        skip.append(name)
        continue
    def cell(i):
        v = row[i] if i < len(row) else None
        return str(v).strip() if v is not None else ''
    CORE_NOTES.append({
        'id': sid, 'name': name, 'cat': cell(1), 'note': cell(3),
        'atk': {'bst': cell(4), 'mul': cell(5), 'pow': cell(6), 'boost': cell(7)},
        'def': {'bst': cell(8), 'mul': cell(9), 'boost': cell(10), 'resist': cell(11)},
        'remark': cell(12),
    })
print('\ncoreNotes:', len(CORE_NOTES), '| 未匹配:', skip)

# 8. 招式点评（id → 中文点评；覆盖对战关键机制招，配招推荐/招式反查共用）
MOVES_NOTES = {
    '14':  '物攻+2，物理输出核心的强化起点，配合速度强化/空间更稳',
    '187': '物攻拉满但扣半血，需配合回复/替身站场，适合腹鼓+神速/先制收割',
    '334': '物防+2，物盾强化站场的防御基石',
    '339': '物攻物防+1，攻防一体的站场强化',
    '347': '特攻特防+1，特攻炮台站场强化',
    '349': '物攻速度+1，物理速攻最经典强化，强化一次即可推队',
    '417': '特攻+2，特攻手性价比最高的强化',
    '483': '特攻特防速度+1，顶级三围强化，蝶舞一次压全场',
    '504': '攻/特攻/速+2 但防/特防-1，一击清场型强化，需空间/先制配合',
    '73':  '寄生种子：每回合吸对方血+回复自身，受队/消耗队核心',
    '92':  '剧毒：受队核心，磨血+拖回合，配合保护/回复极强',
    '105': '自我再生：稳定回半血，受队/肉盾续航基石',
    '202': '终极吸取：输出+吸血兼顾，草系站场回复',
    '234': '晨光：晴天回2/3血，雨天仅1/4，晴队肉盾回复',
    '235': '光合作用：晴天回2/3血，晴队核心回复',
    '236': '月光：晴天回2/3血，晴队/月夜回复',
    '355': '羽栖：回半血但当回合失去飞行属性（地面招生效），飞行系注意走位',
    '409': '吸取拳：吸血+物攻双收益，物攻手续航',
    '164': '替身：挡状态/控血线，配合强化/受队',
    '182': '守住：先制+4 拖回合、试招、配合钉子/剧毒消耗',
    '191': '撒菱：物攻钉子，压换人血线',
    '390': '毒菱：中毒钉子，压受队',
    '446': '隐形岩：换人必吃+破气势披带，全队钉子首选',
    '564': '粘网：降对方速度，高速队克星、慢速队福音',
    '86':  '电磁波：麻痹控速+随机废速攻手，泛用控速',
    '433': '戏法空间：慢速队核心（先制-7），空间内慢速炮台反超',
    '366': '顺风：全队速度翻倍4回合，快攻体系发动机',
    '201': '沙暴：沙队核心，配合沙之力/沙隐/拨沙',
    '240': '求雨：雨队核心，配合悠游自如/雨盘/打雷暴风雨必中',
    '241': '大晴天：晴队核心，配合叶绿素/太阳之力/光合作用',
    '258': '冰雹：雪队核心，配合拨雪/冰冻之躯/暴风雪必中',
    '245': '神速：先制+2 稳定先手，配合强化/腹鼓清场',
    '389': '突袭：恶系先制，先手秒脆皮/残血收割',
    '183': '音速拳：格斗先制补刀，格斗系收割',
    '418': '子弹拳：钢系先制补刀，钢系收割',
    '453': '水流喷射：水系先制补刀，水系收割',
    '252': '击掌奇袭：首回合必定先手+畏缩，双打/破强化核心',
    '369': '急速折返：无损游击换人，保持节奏',
    '521': '伏特替换：电系游击，配合飘浮/电免更稳',
    '269': '挑衅：封对方变化招（回复/强化/钉子），破受队关键',
    '282': '拍落：打落道具+恶系压制，泛用物理招',
    '261': '鬼火：烧伤废物攻手，物盾联防核心',
    '56':  '水炮：水系特攻核弹，雨天再×1.5',
    '57':  '冲浪：水系AOE，雨天强力',
    '58':  '冰冻光束：冰系特攻泛用打击面',
    '59':  '暴风雪：冰系AOE，冰雹/雪天必中',
    '85':  '十万伏特：电系特攻泛用，打击面最广之一',
    '87':  '打雷：电系高威力，雨天必中',
    '126': '大字爆炎：火系特攻核弹，命中不稳',
    '542': '暴风雨：飞行系特攻AOE，雨天必中',
    '89':  '地震：地面系物理AOE，泛用度顶级',
    '414': '大地之力：地面系特攻，泛用',
    '434': '龙星群：龙系特攻核弹，用后特攻-2',
    '394': '闪焰冲锋：火系物攻核弹，反弹1/3伤害',
    '413': '勇鸟猛攻：飞行系物攻核弹，反弹1/3伤害',
    '586': '爆音波：无差别AOE核弹，音系特色',
    '444': '尖石攻击：岩石系高威力，命中不稳',
    '441': '垃圾射击：毒系物攻高威力',
    '200': '逆鳞：龙系物攻核弹，连续攻击后混乱',
    '63':  '破坏光线：一般系核弹，僵直一回合',
    '416': '终极冲击：一般系物攻核弹，僵直一回合',
    '432': '清除浓雾：清双方钉子、墙仅对手侧（源码实证）；降闪避1级待实测',
    '229': '高速旋转：清自身钉子+提速，扫钉位必备',
    '226': '接棒：把自身强化/替身传给队友，强化体系核心',
    '361': '治愈之愿：牺牲自己换队友满血，队医/残局反打',
    '114': '黑雾：清对方全部能力变化，破强化',
    '18':  '吹飞：强制换人（速度慢者先手），破强化+消耗',
    '46':  '吼叫：强制换人（速度慢者先手），破强化',
    '137': '蛇瞪眼：麻痹控速，慢速肉盾的控场技',
}

# 9. 中文描述字典（D1｜v4.x 数据层）
#    mvDescZh / abiDescZh：dict id(字符串) → 中文 desc。
#    **翻译口径**：逐条基于 gameData 英文 desc 原文（moves.desc / abilities.desc）翻译，禁止凭空编造；
#    专业术语沿用官方汉化习惯（recharge=僵直、recoil=反伤、Never misses=必中、frostbite=冻伤、
#    STAB=本系加成、hazard=钉子、priority=先制、restore/recover=回复）。未覆盖条目**不输出**，
#    引擎层回退英文（见 build_tool_html.py 的降级读取）。
#    覆盖池 = ABI_TAGS 全部特性 + MOVES_NOTES 全部招式 + 战术模板涉及招式 + 对战常用招式
#    （威力≥100 攻击招 + 功能招 + 全部天气/场地招）。建立期会再次校验 id 是否存在于 gameData。
ABI_DESC_ZH = {
    '2': '出场时降下雨水，持续8回合。',
    # —— 天气/场地设置手补译（D2 SYS_SET 命中的 id 全部有中文 desc，便于引擎层直接渲染）——
    '45': '出场时掀起沙暴，持续8回合。',
    '70': '出场时召唤晴天，持续8回合。',
    '117': '出场时降下冰雹，持续8回合。',
    '226': '出场时展开电气场地，持续8回合。',
    '227': '出场时展开精神场地，持续8回合。',
    '228': '出场时展开薄雾场地，持续8回合。',
    '229': '出场时展开青草场地，持续8回合。',
    '584': '出场时召唤晴天；晴天下自身物攻×1.33。',
    '604': '出场时掀起沙暴；沙暴中地面属性招式可命中飞行中的对手。',
    '834': '出场时展开剧毒场地。',
    '989': '出场时降下雨水，持续8回合；自身获得电属性本系加成。',
    '5': '满血时不会被一击必杀，保留1点HP。',
    '10': '受到电属性招式攻击时，回复最大HP的25%。',
    '11': '受到水属性招式攻击时，回复最大HP的25%。',
    '17': '不会中毒；受到毒属性招式的伤害减半。',
    '18': '受到火属性招式攻击后，自身火属性招式威力×1.5。',
    '25': '仅会被效果绝佳的攻击或间接伤害命中。',
    '26': '免疫地面属性招式；自身飞行属性招式威力×1.25。',
    '31': '吸引电属性招式并将其吸收，随后提升自身最高攻击项。',
    '32': '自身招式的追加效果触发概率翻倍。',
    '34': '晴天时自身速度×1.5。',
    '37': '自身物攻×2（作用于实际能力值，非种族值）。',
    '47': '受到火属性与冰属性招式的伤害减半。',
    '62': '处于异常状态时，物攻×1.5。',
    '63': '处于异常状态时，防御×1.5。',
    '65': '草属性招式威力×1.2；HP低于1/3时×1.5。',
    '66': '火属性招式威力×1.2；HP低于1/3时×1.5。',
    '67': '水属性招式威力×1.2；HP低于1/3时×1.5。',
    '68': '虫属性招式威力×1.2；HP低于1/3时×1.5。',
    '74': '自身特攻×2（作用于实际能力值，非种族值）。',
    '78': '受到电属性招式攻击时不受伤，改为提升速度。',
    '85': '受到火属性招式的伤害减半；不受烧伤伤害。',
    '87': '水属性招式与雨天回复HP；受火属性招式与晴天伤害增加。',
    '91': '本系加成由×1.5提升至×2。',
    '94': '晴天时最高攻击项×1.5。',
    '96': '自身招式变为一般属性并获得×1.1加成；可无视属性抗性，但不能无视属性免疫。',
    '101': '威力≤60的招式威力×1.5。',
    '110': '被抵抗的攻击伤害×2。',
    '114': '吸引水属性招式并将其吸收，随后提升自身最高攻击项。',
    '134': '受到幽灵与恶属性招式的伤害减半。',
    '136': '满血时受到的攻击伤害减半。',
    '137': '中毒时物攻×1.5；不受中毒状态伤害。',
    '154': '受到恶属性招式攻击时不受伤，改为提升物攻。',
    '157': '吸引草属性招式并将其吸收，随后提升自身最高攻击项。',
    '159': '沙暴时最高攻击项×1.5。',
    '169': '受到物理招式的伤害减半（并非防御×2）。',
    '174': '一般属性招式变为冰属性，并获得加成。',
    '179': '青草场地中防御×1.5。',
    '182': '一般属性招式变为妖精属性，并获得加成。',
    '184': '一般属性招式变为飞行属性，并获得加成。',
    '198': '对当回合换入的对手造成双倍伤害。',
    '199': '受到火属性伤害减半；自身水属性伤害×2；不会陷入烧伤。',
    '206': '一般属性招式变为电属性，并获得加成。',
    '218': '受到接触招式的伤害减半，但受到火属性伤害×2。',
    '231': '满血时受到的攻击伤害减半。',
    '246': '受到特殊招式的伤害减半（并非特防×2）。',
    '255': '自身物攻×1.5，但只能使用首次选定的招式。',
    '262': '电属性招式威力×1.5。',
    '263': '龙属性招式威力×1.5。',
    '269': '冰雹时最高攻击项×1.5。',
    '276': '幽灵属性招式威力×1.2；HP低于1/3时×1.5。',
    '280': '岩石属性招式变为冰属性并获得×1.1加成。',
    '282': '受到飞行属性招式攻击时不受伤，改为提升速度。',
    '287': '全部招式获得×1.5的本系加成。',
    '299': '地面属性招式威力×1.2；HP低于1/3时×1.5。',
    '301': '自身特攻×2（作用于实际能力值，非种族值）。',
    '303': '受到岩石属性招式的伤害减半；自身岩石属性招式威力×1.2。',
    '312': '出场时追加龙属性；免疫地面属性攻击。',
    '314': '免疫岩石属性攻击与隐形岩伤害。',
    '315': '一般属性招式变为水属性，并获得加成。',
    '322': '电属性招式威力×1.2；HP低于1/3时×1.5。',
    '323': '自身特攻×1.5（作用于实际能力值，非种族值）。',
    '325': '一般属性招式变为毒属性，并获得加成。',
    '337': '受到草属性招式的伤害减半；自身草属性招式威力×1.2。',
    '342': '自身为草属性时受到火属性伤害减半；自身草属性对火属性伤害×2。',
    '343': '超能力属性招式威力×1.2；HP低于1/3时×1.5。',
    '359': '飞行属性招式威力×1.2；HP低于1/3时×1.5。',
    '365': '妖精与恶属性招式获得本系加成；催眠术命中×1.5。',
    '385': '接触招式伤害+20%，并回复造成伤害的1/2。',
    '422': '消除超能力弱点；变化招式必定命中。',
    '444': '被水属性招式命中时不受伤害，并布下白雾。',
    '446': '受到火属性招式攻击时不受伤，改为大幅提升防御。',
    '449': '岩石属性招式与投掷类招式威力×1.5。',
    '477': '出场时或电气场地生效时蓄电一次。',
    '509': '格斗属性招式威力×1.2；HP低于1/3时×1.5。',
    '511': '出场时对自身施放念力。',
    '512': '火属性招式威力×1.5。',
    '539': '受到的特殊伤害减少40%，但速度降低10%。',
    '547': '免疫异常状态；受到幽灵属性伤害减半。',
    '557': '出场首回合的攻击伤害×2。',
    '571': '受到特殊招式的伤害减半（并非特防×2）。',
    '599': '物攻×1.5；使用接触招式时有20%概率施加诅咒。',
    '606': '飘浮＋鸟群：免疫地面攻击，飞行属性招式威力提升。',
    '617': '岩石属性招式威力×1.2；HP低于1/3时×1.5。',
    '659': '钢属性招式变为电属性并获得×1.1加成。',
    '665': '引火＋储水：吸收火属性与水属性招式。',
    '688': '巨翼＋飘浮：免疫地面属性攻击。',
    '703': '处于异常状态时伤害×1.5；被击中要害时提升攻击项。',
    '705': '受到的伤害减少40%，但速度降低20%。',
    '713': '水生＋水属性招式威力×1.5。',
    '715': '出场时追加超能力属性；免疫地面属性攻击。',
    '717': '出场时以火焰旋涡攻击对手。',
    '731': '击中要害时伤害×1.5，并造成流血。',
    '746': '荒芜大地＋食土：水属性无效，并免疫地面属性。',
    '764': '水、冰属性招式威力×1.25；受到火属性伤害减半。',
    '843': '追加妖精属性并获得飘浮（免疫地面攻击）。',
    '847': '出场时追加电属性。',
    '855': '免疫异常状态；受到毒属性伤害减半。',
    '869': '荒芜大地＋吹风：水属性无效，出场展开顺风。',
    '871': '吸收火属性招式，且自身火属性攻击必定造成烧伤。',
    '873': '受到特殊招式的伤害减半（并非特防×2）。',
    '904': '受到水、地面属性伤害减半，且不会被强制换下。',
    '935': '雨天时最高攻击项×1.5。',
    '957': '满血时受到的伤害减半。',
    '984': '青草场地中特防×1.5。',
    '1018': '冰雹时特防×1.5。',
    '1025': '恶属性招式威力×1.2；HP低于1/3时×1.5。',
}

MV_DESC_ZH = {
    '11': '用巨大而有力的钳子夹住对手。',
    '12': '用钳子发动的强力攻击，击中要害率较高。',
    '14': '战斗之舞，大幅提升自身物攻。',
    '18': '用狂风将对手吹走，结束战斗。',
    '19': '第一回合飞上高空，下一回合发动攻击。',
    '26': '强力飞踢；若未命中，自己会受到伤害。',
    '37': '连续2~3回合乱打，之后自身陷入混乱。',
    '38': '舍身冲撞，自身也会受到反伤。',
    '46': '使对手逃走，结束战斗。',
    '53': '强力的火焰攻击，可能使对手陷入烧伤。',
    '56': '以高压水柱猛烈冲击对手。',
    '57': '掀起巨浪，砸向对手。',
    '58': '向对手发射冰冻光束，可能造成冻伤。',
    '59': '以暴风雪袭击对手，可能造成冻伤。',
    '63': '威力强大，但下一回合自身无法行动。',
    '66': '鲁莽的舍身摔技，自身也会受到反伤。',
    '70': '强力猛撞攻击，会降低自身防御。',
    '73': '在对手身上种下种子，每回合吸取其HP。',
    '75': '以锋利叶片切斩双方对手，必定击中要害。',
    '76': '第一回合吸收阳光，下一回合发动攻击。',
    '80': '连续2~3回合乱舞花瓣，之后自身陷入混乱。',
    '85': '强力的电流攻击，可能使对手陷入麻痹。',
    '86': '以微弱电流使对手陷入麻痹。',
    '87': '落雷攻击，可能使对手陷入麻痹。',
    '89': '强烈地震，但对飞行中的对手无效。',
    '90': '威力极强的攻击，可击中双方对手。',
    '91': '第一回合钻入地下，下一回合发动攻击。',
    '92': '以剧毒使对手中剧毒，伤害逐回合加剧。',
    '94': '强力超能力攻击，可能降低对手特防。',
    '99': '连续2~3回合乱打，之后自身陷入混乱。',
    '105': '回复自身最大HP的一半。',
    '114': '制造黑雾，消除场上全部能力变化。',
    '120': '造成巨大伤害，但自身会倒下。',
    '121': '将蛋用力掷向对手。',
    '126': '烧尽一切的大字爆炎，可能造成烧伤。',
    '130': '第一回合缩头蓄力，下一回合发动攻击。',
    '136': '跳跃膝撞；若未命中，自己会受到伤害。',
    '137': '以恐怖的眼神使对手陷入麻痹。',
    '138': '对睡眠中的对手造成伤害，并吸取其中一半。',
    '143': '第一回合寻找弱点，下一回合发动猛烈攻击。',
    '152': '用巨钳锤击对手，击中要害率较高。',
    '153': '造成巨大伤害，但自身会倒下。',
    '157': '投掷巨大岩石，可能使对手畏缩。',
    '164': '消耗自身最大HP的1/4，制造替身。',
    '171': '以恐怖噩梦折磨对手，造成大伤害。',
    '177': '发射真空气流，击中要害率较高。',
    '182': '回避所有攻击，连续使用可能失败。',
    '183': '以极快的速度先手出拳。',
    '187': '牺牲HP，将物攻提升至最大。',
    '190': '喷射墨块攻击，并降低对手命中。',
    '191': '在对手场上布下尖刺，伤害换入的对手。',
    '192': '威力强大且必定造成麻痹，但命中率较低。',
    '200': '连续2~3回合乱打，之后自身陷入混乱。',
    '201': '掀起持续数回合的沙暴。',
    '202': '攻击并吸取所造成伤害的一半。',
    '206': '攻击后必定给对手留下至少1点HP。',
    '216': '稳定而强力的一般属性攻击。',
    '221': '神秘的火属性攻击，可能造成烧伤。',
    '223': '威力强大且必定造成混乱，但命中率较低。',
    '224': '以突出的角发动猛烈冲撞。',
    '226': '换下自身，同时将能力变化等效果传递给队友。',
    '229': '清除部分钉子，并提升自身1级速度。',
    '233': '必定后手行动，但攻击必定命中。',
    '234': '回复HP，回复量随天气变化。',
    '235': '回复HP，回复量随天气变化。',
    '236': '回复HP，回复量随天气变化。',
    '240': '在5回合内提升水属性招式威力。',
    '241': '在5回合内提升火属性招式威力。',
    '245': '速度极快且威力强大的攻击。',
    '248': '积蓄力量，2回合后发动攻击。',
    '252': '首回合必定先手，使对手畏缩。',
    '253': '连续2~3回合大闹，之后自身陷入混乱。',
    '255': '吐出蓄积的力量，造成巨大伤害。',
    '257': '向对手呼出炽热气息，可能造成烧伤。',
    '258': '召唤冰雹，每回合袭击全场。',
    '261': '以鬼火使对手陷入烧伤。',
    '264': '强力蓄力拳；若在蓄力中被击中，威力下降。',
    '269': '挑衅对手，使其只能使用攻击招式。',
    '276': '大幅提升自身力量，但会降低自身能力。',
    '282': '打落对手的持有道具，使其无法使用。',
    '284': '自身HP越高，造成的伤害越大。',
    '291': '第一回合潜入水中，下一回合发动攻击。',
    '295': '以光芒爆发攻击，可能降低对手特防。',
    '296': '以绒毛团攻击，可能降低对手特攻。',
    '303': '偷懒休息，回复最大HP的一半。',
    '307': '威力强大，但下一回合无法使用。',
    '308': '威力强大，但下一回合无法使用。',
    '315': '全力攻击，但会大幅降低自身特攻。',
    '317': '以岩石困住对手，并降低其速度。',
    '323': '自身HP越高，造成的伤害越大。',
    '329': '对水属性效果绝佳，并有20%概率造成冻伤。',
    '334': '硬化身体表面，大幅提升自身防御。',
    '338': '威力强大，但下一回合无法使用。',
    '339': '锻炼身体，同时提升物攻与防御。',
    '340': '第一回合跳起，下一回合落下攻击，可能造成麻痹。',
    '344': '舍身电击冲撞，自身会受到少量反伤。',
    '347': '集中精神，提升特攻与特防。',
    '349': '神秘的舞蹈，提升物攻与速度。',
    '353': '积蓄力量，2回合后以强光发动攻击。',
    '354': '全力攻击，但会大幅降低自身特攻。',
    '355': '落地休息，回复最大HP的一半。',
    '358': '对睡眠中的对手威力大增，但会将其唤醒。',
    '359': '挥拳猛击，同时降低自身速度。',
    '360': '高速旋转攻击，对手速度越快伤害越高。',
    '361': '自身倒下，为接替上场的队友回复HP并治愈异常。',
    '366': '刮起狂风，提升全队速度。',
    '369': '攻击后，与待命的队友交换下场。',
    '370': '近身缠斗、放弃防守，会降低自身防御项。',
    '387': '只有在已使用过其他全部招式后才能使用。',
    '389': '若对手准备攻击则必定先手，否则失败。',
    '390': '在对手场上布下毒菱，使换入的对手中毒。',
    '394': '炽热冲撞，可能造成烧伤，自身也会受到反伤。',
    '406': '生成冲击波攻击对手。',
    '407': '以威势撞向对手，自身也会受到反伤。',
    '409': '出拳攻击，并吸取所造成伤害的一半。',
    '411': '以全力发动攻击，可能降低对手特防。',
    '413': '低空俯冲撞击对手，自身也会受到反伤。',
    '414': '使地面喷发力量，可能降低对手特防。',
    '416': '威力强大，但下一回合自身无法行动。',
    '417': '动起坏脑筋，大幅提升自身特攻。',
    '418': '以子弹般的速度先手出拳。',
    '431': '猛冲攻击，可能使对手陷入混乱。',
    '432': '清除障碍物，并降低对手闪避。',
    '433': '在5回合内，速度越慢的宝可梦越先行动。',
    '434': '召唤流星砸向对手，大幅降低自身特攻。',
    '437': '卷起叶片风暴，大幅降低自身特攻。',
    '438': '用藤蔓或触手猛烈抽打对手。',
    '439': '威力强大，但下一回合自身无法行动。',
    '441': '向对手喷射污物，可能使其中毒。',
    '444': '以尖锐岩石刺击对手，击中要害率较高。',
    '446': '布下漂浮的岩石，伤害换入的对手。',
    '449': '属性随所持石板的种类变化。',
    '452': '以身体猛撞对手，自身也会受到反伤。',
    '453': '以高速冲向对手，必定先手。',
    '454': '指挥手下群起攻击对手，击中要害率较高。',
    '457': '舍身头锤，自身会受到严重反伤。',
    '460': '撕裂对手与其周围的空间，击中要害率较高。',
    '462': '碾碎已行动过的对手，并使其特性失效。',
    '463': '以火焰旋涡困住对手2~5回合。',
    '465': '释放冲击波，大幅降低对手特防。',
    '467': '第一回合消失，下一回合发动攻击，并无视守住。',
    '468': '磨利爪子，提升自身物攻与命中。',
    '473': '以超能力波发动物理伤害的攻击。',
    '483': '跳起美丽的蝶舞，提升特攻、特防与速度。',
    '484': '自身越重，造成的伤害越大。',
    '503': '喷射沸水，可能造成烧伤。',
    '504': '打碎外壳，提升攻击项，但降低防御项。',
    '517': '威力强大且必定造成烧伤，但命中率较低。',
    '521': '攻击后，与待命的队友交换下场。',
    '525': '将对手击飞，拉出其后备宝可梦。',
    '526': '鼓舞自身，提升物攻与特攻。',
    '527': '以电网缠住对手，降低其速度。',
    '540': '以超能力波发动物理伤害的攻击。',
    '542': '以狂风困住对手，可能使其陷入混乱。',
    '543': '以护毛猛冲对手，自身会受到少量反伤。',
    '545': '以赤红火焰灼烧周围的一切。',
    '546': '属性随使用者变化。',
    '547': '以古老的歌声攻击，可能使对手入睡。',
    '550': '以强力雷电攻击，可能造成麻痹。',
    '551': '以蓝色火焰包裹对手，可能造成烧伤。',
    '553': '威力强大的2回合招式，可能造成麻痹。',
    '554': '威力强大的2回合招式，可能造成烧伤。',
    '556': '使巨大冰柱砸向对手，可能使其畏缩。',
    '557': '威力极强，但会降低自身防御、特防与速度。',
    '558': '召唤巨大火球，与雷电配合时威力提升。',
    '559': '召唤巨大雷电，与火焰配合时威力提升。',
    '560': '可同时造成格斗与飞行属性伤害。',
    '562': '大声打嗝攻击，需先吃下树果才能使用。',
    '564': '布下黏网，降低换入对手的速度。',
    '572': '卷起激烈的花瓣暴风雪攻击全场。',
    '580': '地面在8回合内变为草地，并回复HP。',
    '581': '地面在8回合内被薄雾覆盖，防止异常状态。',
    '586': '攻击周围的一切，随后自身受到反伤。',
    '591': '卷起钻石风暴，可能提升自身防御。',
    '592': '以高温蒸汽包裹对手，可能造成烧伤。',
    '593': '利用异次元洞攻击，无法被回避。',
    '604': '地面在8回合内带电，防止睡眠。',
    '605': '放射强光，对全场对手造成伤害。',
    '610': '攻击后必定给对手留下至少1点HP。',
    '616': '汇聚大地之力，攻击全体对手。',
    '617': '发射巨大的光之束，自身也会受到反伤。',
    '618': '以蓝色光束攻击双方对手。',
    '619': '以可怕的石刃攻击双方对手。',
    '620': '强力攻击，但会降低自身防御项。',
    '621': '利用异次元洞攻击，无法被回避。',
    '627': '以气泡歌唱攻击全场，并治愈被命中者的烧伤。',
    '628': '挥拳猛击，造成稳定而可观的伤害。',
    '632': '第一回合蓄力，下一回合以光刃斩击。',
    '641': '地面在8回合内变得奇异，封锁先制招式。',
    '645': '燃尽自身，使用后失去火属性。',
    '649': '以神秘之舞攻击，属性与自身第一属性一致。',
    '650': '以射线攻击，使已行动过的对手特性失效。',
    '653': '加热鸟喙发动攻击，接触者会被烧伤。',
    '654': '以鳞片摩擦发出巨响攻击，降低自身防御。',
    '655': '以整个身体如锤子般砸向对手。',
    '657': '在5回合内削弱所受的攻击，仅在冰雹天可用。',
    '658': '布下甲壳陷阱，受到物理攻击时引爆。',
    '659': '强力光束，大幅降低自身特攻。',
    '665': '高威力激光，下一回合无法使用。',
    '667': '以太阳之力猛击，无视对手特性。',
    '668': '以月亮之力发射光束，无视对手特性。',
    '672': '属性随所持记忆碟变化。',
    '673': '引爆自身头部，对周围一切造成伤害。',
    '674': '以电拳攻击，使同回合的一般属性招式变为电属性。',
    '675': '以自身较高的攻击项决定物理或特殊分类。',
    '679': '稳定而强力的电属性攻击，取自身较高的攻击项。',
    '685': '长出巨大茎秆、散播种子，每回合吸取对手HP。',
    '686': '以寒气结晶攻击，并消除全部能力变化。',
    '687': '以芳香旋风包裹对手，并治愈全队的异常状态。',
    '688': '稳定而强力的一般属性攻击，取自身较高的攻击项。',
    '690': '发射强力光束，对Mega形态的对手造成双倍伤害。',
    '707': '以捕兽夹困住对手4~5回合。',
    '708': '向对手发射火球，可能造成烧伤。',
    '709': '以剑刃般攻击，对Mega形态的对手造成双倍伤害。',
    '710': '自身防御越高，造成的伤害越大。',
    '711': '攻击并提升速度，属性为电或恶。',
    '722': '以粗壮的大葱攻击，下一回合无法使用。',
    '723': '无极汰那的最强招式，下一回合需休息。',
    '724': '从身体发射钢之光束，自身也会受到反伤。',
    '728': '2回合招式，第一回合提升特攻后再攻击。',
    '729': '自动采用物理或特殊中更有效的一种，可能使对手中毒。',
    '730': '攻击全场后自身倒下，薄雾场地下威力提升。',
    '731': '贴地滑行攻击，青草场地下必定先手。',
    '737': '操控对手的道具发动攻击，对手无道具时失败。',
    '748': '自身HP越高，造成的伤害越大。',
    '752': '投掷裹挟暴风雪的冰枪攻击对手。',
    '753': '释放大量幽灵攻击双方对手。',
    '754': '以超能力攻击，并削减对手上一招式的PP。',
    '755': '在水中发动致命翻滚，并无视对手的能力变化。',
    '756': '对龙属性造成双倍伤害，击中要害率较高。',
    '758': '以巨浪舍身冲撞，承受33%反伤。',
    '759': '从上方以强力电流攻击，并将对手击落地面。',
    '760': '造成巨大特殊伤害，但自身会倒下。',
    '767': '连续2~3回合乱打，之后自身陷入混乱。',
    '771': '强力的魔法光束，可能降低自身特攻。',
    '774': '向对手投掷山岩，可能使其畏缩。',
    '780': '蓄力未完成。',
    '804': '蓄力未完成。',
    '807': '蓄力未完成。',
    '817': '使巨大的星星砸向对手，可能使其畏缩。',
    '818': '潜入暗影，随后发动攻击。',
    '820': '如流星般撞击对手，承受33%反伤。',
    '822': '释放能量波攻击对手。',
    '824': '以全身猛撞对手，同时降低自身防御与特防。',
    '827': '以超能力击碎对手的精神，可能使其陷入混乱。',
    '836': '借自然之力猛攻，降低自身物攻与防御。',
    '838': '借助超能力冲锋，承受33%反伤。',
    '853': '以异界灵魂攻击对手，大幅降低自身特攻。',
    '856': '射出自身装甲，降低自身防御项。',
    '859': '对钢属性效果绝佳，无法连续使用。',
    '865': '以剧毒旋转攻击，30%概率使对手中毒。',
    '872': '冲向对手攻击，本回合内自身受到的伤害翻倍。',
    '878': '以双腿发力猛烈旋转攻击，大幅降低自身速度。',
    '883': '投掷大量金币攻击，并降低自身特攻。',
    '886': '引发远古爆炸，对弱点目标伤害提升。',
    '887': '以未来之力高速攻击，对弱点目标伤害提升。',
    '890': '以旋转的尖刺贯穿对手，可穿透守住。',
    '893': '借满月之灵发动攻击，无法连续使用。',
    '894': '孤注一掷的猛踢，可能使对手陷入混乱。',
    '900': '以藤蔓缠绕的棍棒攻击对手，属性随面具变化。',
    '901': '第一回合蓄电并提升特攻，下一回合发射；雨天可立即发射。',
    '911': '以带电的身躯撞击对手，未命中时自身承受50%HP反伤。',
    '914': '以浸毒的锁链攻击，可能使对手陷入剧毒。',
    '916': '以叶绿素之力猛攻对手，自身承受50%最大HP反伤。',
    '920': '以狂暴的烈风攻击对手，并展开顺风。',
    '921': '以雷鸣暴风袭击对手，并降下雨水。',
    '922': '以灼热的风沙攻击对手，并掀起沙暴。',
    '923': '以爱恨之风攻击对手，并展开妖精场地。',
    '927': '猛击对手的腿部，必定造成麻痹。',
    '929': '来自远古的沉重一击，行动较慢但威力强大。',
    '938': '撞击对手，并将自身的异常状态转移给对方。',
    '939': '将身体的一部分化为锤子砸向对手，承受33%反伤。',
    '941': '如熔岩之锤砸击对手，并降低自身速度。',
    '942': '以幻象猛击对手，并在数回合后追加一次攻击。',
    '944': '以甲虫状的锤子攻击，可能使对手陷入混乱。',
    '956': '以獠牙撕咬对手，并降低其速度。',
    '961': '以晶石之雨攻击双方对手，取自身较高的攻击项。',
    '963': '未实装。',
    '973': '以强劲的烈风攻击对手，但会降低自身速度。',
    '974': '以恐怖的虚空吞噬对手，可能降低其特防。',
    '975': '释放内在的黑暗造成大伤害，之后自身失去恶属性。',
    '983': '以刺骨的寒风袭击双方对手，可能使其畏缩。',
    '988': '第一回合潜入毒池，下一回合发动攻击，可能使对手中毒。',
    '1000': '借蓝色满月之灵发动攻击，无法连续使用。',
    '1002': '对水属性效果绝佳，无法连续使用。',
    '1006': '在8回合内提升毒属性招式威力，并对场上宝可梦造成伤害。',
    '1007': '以狂风袭击双方对手。',
    '1012': '以震碎大地的力量冲锋，承受33%反伤。',
    '1025': '舍身能量球攻击，承受50%反伤。',
    '1026': '舍身能量球攻击，承受50%反伤。',
    '1027': '以倾盆大雨猛烈攻击，并降低自身防御。',
}

# 9b. SYS_SET 数据驱动（D2｜v4.x 数据层）
#     天气/场地「设置手」特性 id 列表，由 gameData abilities desc 正则派生（不再硬编码中文名映射）。
#     口径 =「进场即召唤天气/场地」：desc 含 "Summon(s) rain/sun/sand/hail on entry"、
#     "Casts <Electric|Psychic|Misty|Grassy> Terrain on entry"、"sets Toxic Terrain on entry"。
#     ⚠ 与旧硬编码 SYS_SET（build_tool_html.py，9 条中文名）对照：既有 9 条全部命中；
#       数据驱动另补 3 条同族设置手 —— 584 Orichalcum Pulse(晴)、604 Desert Spirit(沙)、
#       989 Storm Cloud(雨)（其 desc 确为 "Summons … on entry"，属同族口径内新增）。
#       体系名映射不变：降雨/雨幕→雨、日照→晴、扬沙→沙、降雪→雪、
#       226-229→电场/精神场地/薄雾场地/青草场地、834→剧毒场地。
SYS_SET_PATTERNS = [
    (re.compile(r'Summons? rain\b', re.I), '雨'),
    (re.compile(r'Summons? sun\b', re.I), '晴'),
    (re.compile(r'Summons? (a )?sand', re.I), '沙'),
    (re.compile(r'Summons? hail', re.I), '雪'),
    (re.compile(r'Casts Electric Terrain', re.I), '电场'),
    (re.compile(r'Casts Psychic Terrain', re.I), '精神场地'),
    (re.compile(r'Casts Misty Terrain', re.I), '薄雾场地'),
    (re.compile(r'Casts Grassy Terrain', re.I), '青草场地'),
    (re.compile(r'Toxic Terrain on entry', re.I), '剧毒场地'),
]
SYS_SET_MAP = {}   # id(int) -> 体系名（派生结果，供探针/排错）
for _a in GD['abilities']:
    _d = _a.get('desc') or ''
    if 'on entry' not in _d.lower():
        continue
    for _pat, _sys in SYS_SET_PATTERNS:
        if _pat.search(_d):
            SYS_SET_MAP[_a['id']] = _sys
            break
SYS_SET = sorted(SYS_SET_MAP)   # 兼容 id 列表（ERDATA.sysSet）
print('sysSet:', len(SYS_SET), SYS_SET, '|', {k: SYS_SET_MAP[k] for k in SYS_SET})

# 9c. FAMILY 形态家族表（D3｜v4.x 数据层）
#     familyRoot：dict formId → rootId（字符串 id，与 ERDATA.species.id 字符串口径一致）。
#     来源：gameData species 的 evolutions 中 kd==1（EVO_MEGA_EVOLUTION = Mega/Redux 道具进化）条目。
#     ⚠ 字段语义勘误（实证）：evolutions[].in 是 **species 数组下标**、不是物种 id ——
#       Venusaur {kd:1, rs:"ITEM_VENUSAURITE", in:1119} → GD['species'][1119] = 'Venusaur Mega Y'(id 1501)。
#     rootId = 链头基础形态（沿进化链上溯到「不再是 kd==1 目标」的物种）；root 自身也入表（self-map）。
#     同一 Mega 形态被多个基础形态指向时（如 9 个 Pikachu 形态 → Pikachu Mega 2208），
#     取**最小基础 id** 为 root（确定性；该形态的其它基础形态仍各自 self-map）。
_FAM_EDGES = []                       # (base_id, mega_id)
for _s in GD['species']:
    for _e in (_s.get('evolutions') or []):
        if (_e or {}).get('kd') == 1:
            _FAM_EDGES.append((int(_s['id']), int(GD['species'][_e['in']]['id'])))
_FAM_PARENT = {}
for _a, _b in _FAM_EDGES:
    if _b not in _FAM_PARENT or _a < _FAM_PARENT[_b]:
        _FAM_PARENT[_b] = _a
def _fam_root(x):
    _seen = set()
    while x in _FAM_PARENT and x not in _seen:
        _seen.add(x); x = _FAM_PARENT[x]
    return x
FAMILY_ROOT = {}
for _x in set([a for a, _ in _FAM_EDGES]) | set([b for _, b in _FAM_EDGES]):
    FAMILY_ROOT[str(_x)] = str(_fam_root(_x))
assert all(FAMILY_ROOT[r] == r for r in set(FAMILY_ROOT.values())), 'familyRoot: root 未自映射'
print('familyRoot:', len(FAMILY_ROOT), '| 家族根(基础物种):', len(set(FAMILY_ROOT.values())),
      '| Mega/Redux 形态:', len(set(b for _, b in _FAM_EDGES)))

# 9d. GLOSSARY 机制词条（D4｜v4.x 数据层）
#     40 条机制词条；body = 定义 + ER 口径数值，数值严格取自
#     docs\战斗分析\_机制默认口径表.md「引擎参数汇总表」+「考古修订 v2.65（2026-10-06）」节，
#     每条以【…】标注来源档位（v2.65 源码实证 / 原版口径 / 待实测）。禁编造。
GLOSSARY = [
    {"key": "weather_rain", "term": "Rain (Rain Dance / Drizzle)", "zh": "雨天",
     "body": "水属性招式威力×1.5（+50%）、火属性×0.5。ER v2.65 按天气标记分档：TEMPORARY|PRIMAL=×1.5、PERMANENT=×1.2（WCONF.weatherBoostByFlag）；手动天气只写 TEMPORARY 槽 ⇒ 手动与特性同档 ×1.5，「特性+20%」旧口径已废（WCONF.abilityBoost 废弃）。持续 8 回合（WCONF.manualDurTurns / abilityDurTurns），持天气岩石延长至 12（WCONF.rockTurnsManual / rockTurnsAbility）。暴风、打雷等招在雨天下必中。【来源档位：v2.65 源码实证】"},
    {"key": "weather_sun", "term": "Sun (Sunny Day / Drought)", "zh": "晴天",
     "body": "火属性招式威力×1.5、水属性×0.5（WCONF.weatherBoostByFlag，手动=特性同档）。日光束/日光刃在晴天下无需蓄力。持续 8 回合（WCONF.manualDurTurns / abilityDurTurns）、岩石延长 12 回合（WCONF.rockTurnsManual / rockTurnsAbility）。太阳之力94：晴天下最高攻击项×1.5，但每回合掉血。【来源档位：v2.65 源码实证】"},
    {"key": "weather_sand", "term": "Sandstorm", "zh": "沙暴",
     "body": "回合末对非岩/地/钢属性宝可梦造成 1/16 伤害；岩石属性宝可梦特防×1.5。持续 8 回合、岩石延长 12 回合（WCONF.manualDurTurns / abilityDurTurns / rockTurnsManual / rockTurnsAbility）。拨沙受益者在沙暴中速度×2。【来源档位：回合数与分档 v2.65 源码实证；岩石特防×1.5 属原版口径，未列入 v2.65 实证清单】"},
    {"key": "weather_hail", "term": "Hail / Snow", "zh": "冰雹（雪天）",
     "body": "冰属性宝可梦防御×1.5（源码 S9）；暴风雪必中；回合末对非冰系造成 1/16 伤害。持续 8 回合、岩石延长 12 回合（WCONF.manualDurTurns / rockTurnsManual）。【来源档位：v2.65 源码实证】"},
    {"key": "weather_manual", "term": "Manual Weather Moves", "zh": "手动天气招式",
     "body": "求雨240 / 大晴天241 / 沙暴201 / 冰雹258。基础 8 回合 —— v2.65 源码常量 WEATHER_DURATION = 8（WCONF.manualDurTurns），**无 5 回合档**（changelog v1.5「still 5 turns」与之冲突，已登记，取源码）。增伤与特性同档（WCONF.weatherBoostByFlag）。【来源档位：v2.65 源码实证】"},
    {"key": "weather_ability", "term": "Weather Abilities", "zh": "特性天气",
     "body": "降雨2 / 日照70 / 扬沙45 / 降雪117，出场即触发。持续 8 回合（WCONF.abilityDurTurns）；viaAbility 形参不影响时长与倍率（WCONF.abilityBoost 已废弃）。【来源档位：v2.65 源码实证】"},
    {"key": "weather_rock", "term": "Weather Rocks", "zh": "天气岩石",
     "body": "湿润岩石298 / 炽热岩石297 / 沙沙岩石296 / 冰冷岩石295：天气 8 → 12 回合（WCONF.rockTurnsManual / rockTurnsAbility，源码 WEATHER_DURATION_EXTENDED = 12）。原版「手动 5→8」口径已废。【来源档位：v2.65 源码实证】"},
    {"key": "terrain_boost", "term": "Terrain Boost", "zh": "场地增伤",
     "body": "场地内对应属性招式威力×1.3（+30%）（WCONF.terrainBoost）。来源 B_TERRAIN_TYPE_BOOST = GEN_8 + 伤害段 MUL_MODIFIER(&modifier, 1.3)，含剧毒场地。本项目模板旧文案「+30%」数值正确。【来源档位：v2.65 源码实证，定稿】"},
    {"key": "terrain_dur", "term": "Terrain Duration", "zh": "场地持续",
     "body": "8 回合（WCONF.terrainDurTurns，源码 TERRAIN_DURATION = 8）；持场地延展器 12 回合（WCONF.terrainExtenderTurns，TERRAIN_DURATION_EXTENDED = 12，即 +4）。【来源档位：v2.65 源码实证】"},
    {"key": "terrain_extender", "term": "Terrain Extender", "zh": "场地延展器",
     "body": "道具326。场地 8 → 12 回合（+4）（WCONF.terrainExtenderTurns）。初版口径 11（+3，按原版百科类推）已废。【来源档位：v2.65 源码实证】"},
    {"key": "terrain_electric", "term": "Electric Terrain", "zh": "电气场地",
     "body": "电属性招式×1.3（WCONF.terrainBoost）；场上宝可梦免疫睡眠。【来源档位：v2.65 源码实证】"},
    {"key": "terrain_psychic", "term": "Psychic Terrain", "zh": "精神场地",
     "body": "超能力属性招式×1.3（WCONF.terrainBoost）；场地内先制招式失效（克制偷袭/突袭）。【来源档位：v2.65 源码实证】"},
    {"key": "terrain_grassy", "term": "Grassy Terrain", "zh": "青草场地",
     "body": "草属性招式×1.3（WCONF.terrainBoost）；场上宝可梦每回合回复 HP。青草滑梯在场地内必定先手。【来源档位：增伤 v2.65 源码实证；回合末回复量属原版口径】"},
    {"key": "terrain_misty", "term": "Misty Terrain", "zh": "薄雾场地",
     "body": "妖精属性招式增伤（同场地档 WCONF.terrainBoost）；全队免疫异常状态；「龙系伤害减半」已在 v2.65.3b 移除。【来源档位：增伤 v2.65 源码实证；龙伤减半移除见 官方 changelog v2.65.3b】"},
    {"key": "terrain_toxic", "term": "Toxic Terrain", "zh": "剧毒场地",
     "body": "毒属性招式×1.3（WCONF.toxicTerrain.boost / WCONF.terrainBoost）；回合末对场上宝可梦造成 1/16 伤害（WCONF.toxicTerrain.dmgFraction）；豁免为「毒或钢属性全类型豁免（不看接地）」（WCONF.toxicTerrain.immunity）。持续 8 回合、延展器 12（WCONF.toxicTerrain.durTurns）。设置手：毒沼制造者 834 Toxic Surge。【来源档位：v2.65 源码实证】"},
    {"key": "hazard_spikes", "term": "Spikes", "zh": "撒菱",
     "body": "最多 3 层；换入伤害 1/8（1层）·1/6（2层）·1/4（3层），仅对「接地」宝可梦生效（WCONF.hazardRules.spikes = {maxLayers:3, dmg:[1/8,1/6,1/4], groundedOnly:true}）。源码 spikesDmg=(5-层数)*2、maxHP/spikesDmg。【来源档位：v2.65 源码实证 S10】"},
    {"key": "hazard_stealthrock", "term": "Stealth Rock", "zh": "隐形岩",
     "body": "单层；伤害按岩石对目标的克制倍率：4×弱点 1/2、2×弱点 1/4、中性 1/8、2×抵抗 1/16、4×抵抗 1/32（WCONF.hazardRules.stealthRock.dmgByRockEff）。【来源档位：Psypoke / 原版口径；ER 未另给数值】"},
    {"key": "hazard_toxicspikes", "term": "Toxic Spikes", "zh": "毒菱",
     "body": "最多 2 层：1 层中毒、2 层剧毒；钢属性免疫、接地毒属性宝可梦可吸收全部层数（WCONF.hazardRules.toxicSpikes = {maxLayers:2, steelImmune:true, groundedPoisonAbsorbs:true}）。【来源档位：原版口径】"},
    {"key": "hazard_stickyweb", "term": "Sticky Web", "zh": "粘网",
     "body": "单层；换入者速度 −1 级；飞行属性 / 飘浮 / 气球持有者免疫（WCONF.hazardRules.stickyWeb）。【来源档位：原版口径】"},
    {"key": "hazard_clear", "term": "Hazard Removal", "zh": "除钉范围",
     "body": "高速旋转229：清**自身侧**全部钉子，并提升自身速度+1。清除浓雾432：清**双方**钉子，墙类（反射壁/光墙/白雾/极光幕/神秘守护/黑雾）**仅对手侧**，并降低目标闪避 1 级；**不清场地地形**（WCONF.defogRapidSpin）。【来源档位：v2.65 源码实证】"},
    {"key": "status_para", "term": "Paralysis", "zh": "麻痹",
     "body": "速度×0.5（WCONF.paraSpeed，源码整除以 2）；每回合 25% 概率完全无法行动（WCONF.paraFullChance，Random()%4==0）。电属性宝可梦免疫麻痹。12.5%（Pokémon Champions 口径）属 v2.65 之后版本，本表不采用。【来源档位：v2.65 源码实证】"},
    {"key": "status_frostbite", "term": "Frostbite", "zh": "冻伤",
     "body": "每回合末受到 1/16 最大 HP 伤害（WCONF.frostbite.dmgFraction），且特攻×0.5（WCONF.frostbite.spAtkMult）；替代原版「冰冻」。「冰雹中触发概率×3」两 pin 均未找到 ⇒ 退回待实测（WCONF.frostbite.hailChanceMult 待实测；唯一确证的概率加成是 Cryomancy ×5）。【来源档位：1/16 与特攻减半 v2.65 源码实证；hail×3 待实测】"},
    {"key": "status_burn", "term": "Burn", "zh": "烧伤",
     "body": "每回合末受到 1/16 最大 HP 伤害，且物攻×0.5。【来源档位：原版口径】"},
    {"key": "status_toxic", "term": "Badly Poisoned", "zh": "剧毒",
     "body": "每回合末伤害逐回合递增（1/16 → 2/16 → …），直至换下。【来源档位：原版口径】"},
    {"key": "status_sleep", "term": "Sleep", "zh": "睡眠",
     "body": "若干回合内无法行动；被击中不会醒来，需自然醒或特定招式唤醒。【来源档位：原版口径】"},
    {"key": "boost_dance", "term": "Stat Boost Moves", "zh": "强化招式",
     "body": "剑舞14 物攻+2 / 龙之舞349 物攻+速度+1 / 蝶舞483 特攻+特防+速度+1 / 诡计417 特攻+2 / 破壳504 攻·特攻·速+2 但防·特防−1。ER 个体默认满值，强化后收益最大化。【来源档位：招式数据】"},
    {"key": "priority", "term": "Priority", "zh": "先制",
     "body": "先制度高者先行动；恶作剧之心给变化招式 +1 先制；击掌奇袭252 首回合必定先手并造成畏缩。空间（戏法空间）内先制招式仍照常先手。【来源档位：招式/特性数据】"},
    {"key": "trickroom", "term": "Trick Room", "zh": "戏法空间",
     "body": "5 回合内速度越慢者越先行动；先制 −7（WCONF.trickroomPrio，数据驱动 gameData.moves[433].prio）。**实际回合数存疑**：文案/数据均写 5，但源码 TRICK_ROOM_DURATION 5 + 施放回合不递减 ⇒ 机械推算 6 个回合时段，冲突未消除（WCONF.trickroomTurns 待实测）。【来源档位：先制属数据实证；回合数待实测】"},
    {"key": "tailwind", "term": "Tailwind", "zh": "顺风",
     "body": "全队速度×2，持续 4 个回合时段（WCONF.tailwindTurns = 3 + 施放当回合不递减）。自动顺风（Air Blower / North Wind 等）常量同为 3（WCONF.autoTailwindTurns）⇒ 实际同为 4 时段，与手动的差别不在时长。【来源档位：v2.65 源码实证】"},
    {"key": "charge", "term": "Charging Moves", "zh": "蓄力招式",
     "body": "两回合招：第一回合蓄力、下一回合发动（日光束76/日光刃632、飞空19、挖洞91、潜水291、神鸟猛攻143 等）。晴天（日光束/日光刃）或雨天（如部分电招）可免蓄力。【来源档位：招式数据】"},
    {"key": "recharge", "term": "Recharge", "zh": "僵直（再蓄力）",
     "body": "破坏光线63 / 终极冲击416 / 爆裂燃烧307 / 水炮308 / 疯狂植物338 等：使用后下一回合自身无法行动。【来源档位：招式数据】"},
    {"key": "recoil", "term": "Recoil", "zh": "反伤",
     "body": "闪焰冲锋394 / 勇鸟猛攻413 / 舍身冲撞38 等反弹造成伤害的 1/3；部分招式 1/4（伏特攻击344）或 1/2（双刃头锤457 / 破灭之光617 等）。【来源档位：招式数据】"},
    {"key": "ate", "term": "-ate Abilities", "zh": "-ate 属性转换",
     "body": "一般属性招式转为指定属性（Pixilate182→妖精 / Refrigerate174→冰 / Aerilate184→飞行 / Galvanize206→电 / Hydrate315→水 / Intoxicate325→毒 / Normalize96→一般）。宏族**×1.0**（WCONF.ABI_ATE.multiplier，10% 加成已移除）；转换后招式获得 STAB ×1.5（吃适应力可达 ×2.0，WCONF.stabConvert=true）。特例 ×1.1：Normalize96 / Crystallize280（岩石→冰） / Superconductor659（钢→电）（WCONF.ABI_ATE.specialMultiplier）。家族 Pin A 25 / Pin B 27 条。【来源档位：v2.65 源码实证】"},
    {"key": "stab", "term": "STAB", "zh": "本系加成",
     "body": "招式属性与自身属性一致时威力 ×1.5；适应力91 提升至 ×2.0。Relic Stone 特性在场时 STAB 被压成 ×1.0。【来源档位：v2.65 源码实证（StabMultiplierInHalves：3=×1.5、4=×2.0）】"},
    {"key": "relic_stone", "term": "Relic Stone", "zh": "圣石（STAB 压制）",
     "body": "该特性（或宝可梦）在场时，场上 STAB 计算被压成 ×1.0（源码返回 2）。【来源档位：v2.65 源码实证 S3】"},
    {"key": "recover", "term": "Recovery Moves", "zh": "回复类招式",
     "body": "自我再生105 / 偷懒303 / 羽栖355 / 终极吸取202 等回复最大 HP 的一半；晨光234 / 光合作用235 / 月光236 回复量随天气变化（晴天最高约 2/3）。【来源档位：回复半血与天气依赖属原版口径】"},
    {"key": "weatherball", "term": "Weather Ball", "zh": "天气球",
     "body": "天气生效时改变属性（随天气）并威力翻倍。【来源档位：原版口径；ER 未单独实证】"},
    {"key": "intimidate_guard", "term": "Intimidate Immunity", "zh": "防威吓",
     "body": "不被威吓降低物攻的特性：不服输（被降能力时反升物攻2级）、自信过度153、胆量 等。【来源档位：特性数据】"},
    {"key": "weather_double", "term": "Weather Double Boost", "zh": "天气增伤翻倍",
     "body": "该特性（S2）使天气增伤叠加为 ×1.5 × ×1.5 = ×2.25（在 WCONF.weatherBoostByFlag 之上再乘），并可使雨天火属性从 ×0.5 变为 ×1.5。【来源档位：v2.65 源码实证 S2】"},
    {"key": "hazard_bug", "term": "Stealth Rock Bug (Beta2)", "zh": "隐形岩非首铺疑似失效",
     "body": "v2.65 Beta2 社区报告：隐形岩若不是首个布下的钉子疑似失效（其它钉子正常）。无源码/官方结论 ⇒ 引擎判钉时不假设隐形岩必然生效，输出风险提示。【来源档位：C 档待实测】"},
]

print('glossary:', len(GLOSSARY))

# 输出
# 精灵图嵌入（NextDex 本地精灵，gameData NAME -> sprites/*.png，量化压缩后 base64）
def load_sprites():
    try:
        gd = json.load(open(BASE + r'\ER-source\gameDataV2.65beta.json', encoding='utf-8'))
    except Exception as e:
        print('精灵源 gameData 读取失败:', e); return {}
    spr_dir = BASE + r'\ER-source\nextdex\static\sprites'
    if not os.path.isdir(spr_dir):
        print('精灵目录不存在:', spr_dir); return {}
    sprites, miss = {}, 0
    for s in gd.get('species', []):
        sid = str(s.get('id'))
        nm = (s.get('NAME') or '').replace('SPECIES_', '')
        p = os.path.join(spr_dir, nm + '.png')
        if not os.path.exists(p):
            miss += 1; continue
        try:
            im = Image.open(p).convert('RGBA')
            q = im.quantize(colors=256, method=Image.Quantize.FASTOCTREE)
            buf = io.BytesIO()
            q.save(buf, 'PNG', optimize=True)
            sprites[sid] = 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()
        except Exception as e:
            miss += 1
    print('sprites 嵌入:', len(sprites), '缺失:', miss)
    return sprites

# v4.x：中文描述字典仅输出「已翻译且 id 确实存在」的条目（未覆盖条目不输出，引擎回退英文）
MV_DESC_ZH = {k: v for k, v in MV_DESC_ZH.items() if k in moves}
_gd_abi_ids = set(str(a['id']) for a in GD['abilities'])
ABI_DESC_ZH = {k: v for k, v in ABI_DESC_ZH.items() if k in _gd_abi_ids}
print('\nmvDescZh:', len(MV_DESC_ZH), '/', len(moves), '| abiDescZh:', len(ABI_DESC_ZH), '/', len(abilities))

# ============ v4.6.4：威胁库「使用率」弱先验数据源（抓取 → 缓存 → 英名归一映射 → ERDATA） ============
# 归属：**数据层**（本文件）负责抓取 / 落盘缓存 / 映射；引擎层（build_tool_html.py）只消费 ERDATA.usagePrior，
#       数据层缺失时才回退它自己的 nn_data 读取或显式空态（登记缺口 #32：ER 无对战统计）。
# 源：Smogon chaos（https://www.smogon.com/stats/<月>/chaos/<格式>-<档>.json）——**原版（PS）使用率**，非 ER 使用率。
# 口径：ER 为第三代内核 → gen3ou 权重 1.0（同代手感）+ gen9nationaldex 权重 0.5（物种覆盖：含 Mega / 后世代）；
#       月份 2026-09 优先、不可达回溯 2026-08；评分档 0（全档 —— 1760 档仅 ~359 只不足以覆盖 ≥700）。
#       命中缓存即不重抓（nn_data/chaos/raw/<月>-<格式>-<档>.json，合并结果 nn_data/chaos_<月>.json）。
# 映射：以 gameData 全表英文 name 为准做「归一键」（小写 / 去标点 / 词序无关 / 形态后缀归一），不依赖 species_map.json。
NN_DIR = BASE + r'\nn_data'
NN_RAW = os.path.join(NN_DIR, 'chaos', 'raw')
NN_MONTHS = ['2026-09', '2026-08']                           # 优先月 → 回溯月
NN_SRC = (('gen3ou', 0, 1.0), ('gen9nationaldex', 0, 0.5))   # (格式, 评分档, 权重)
NN_MIRROR = 'https://pokemonshowdown.com/stats/%s/chaos/%s-%d.json'
NN_FORM_ALIAS = {'alola': 'alolan', 'galar': 'galarian', 'hisui': 'hisuian', 'paldea': 'paldean',
                 'f': 'female', 'm': 'male'}
NN_NOTE = ('原版（Smogon/PS）使用率 ≠ ER 使用率；ER 无对战统计=已知缺口，'
           '仅作弱先验（权重上限 0.6，次排序）')


def nn_toks(s):
    """归一键：小写 / 去标点 / 词序无关 / 形态后缀归一（'Charizard-Mega-X' ≡ 'Charizard Mega X'）"""
    s = (s or '').lower().replace('\u2640', 'f').replace('\u2642', 'm')
    s = re.sub(r'[^a-z0-9]+', ' ', s)
    return tuple(sorted(NN_FORM_ALIAS.get(x, x) for x in s.split() if x))


def nn_download(url, dest):
    """下载 chaos json → dest（urllib 优先，失败退 curl.exe）；失败返回 False，不阻塞构建"""
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    for how in ('urllib', 'curl'):
        try:
            if how == 'urllib':
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (er-tool build)'})
                with urllib.request.urlopen(req, timeout=60) as r:
                    body = r.read()
                open(dest, 'wb').write(body)
            else:
                import subprocess
                if subprocess.call(['curl.exe', '-s', '--max-time', '600', '-o', dest, url]) != 0:
                    continue
            if os.path.exists(dest) and os.path.getsize(dest) > 1000:
                return True
            print('  使用率先验：%s 下载结果异常（%s）' % (url, how))
        except Exception as e:                               # noqa: BLE001
            print('  使用率先验：%s 下载失败（%s: %s）' % (url, how, e))
    return False


def build_usage_prior():
    """→ (usagePrior{er_id: 0..1}, usageMeta)。无数据时返回 ({}, 显式空态 meta)，供引擎空态分支断言。"""
    merged = None
    for mon in NN_MONTHS:                                    # ① 合并缓存命中 → 不联网
        cp = os.path.join(NN_DIR, 'chaos_%s.json' % mon)
        if os.path.exists(cp):
            try:
                _c = json.load(open(cp, encoding='utf-8'))
                if isinstance(_c.get('priors'), dict) and _c['priors']:   # 形状校验（防止被同名异物覆盖）
                    merged = _c
                    print('使用率先验：合并缓存命中 %s（chaos 名 %d 个）' % (cp, len(_c['priors'])))
                    break
                print('使用率先验：合并缓存结构不符（无 priors）→ 视为无效，转逐源重建：%s' % cp)
            except Exception as e:                           # noqa: BLE001
                print('使用率先验：合并缓存损坏（%s）→ 重抓' % e)
    if merged is None:                                       # ② 逐源取数（原始缓存优先，缺失才下载）
        for mon in NN_MONTHS:
            got, priors = [], {}
            for fmt, cut, w in NN_SRC:
                fn = '%s-%s-%d.json' % (mon, fmt, cut)
                p = os.path.join(NN_RAW, fn)
                if not os.path.exists(p):
                    url = 'https://www.smogon.com/stats/%s/chaos/%s-%d.json' % (mon, fmt, cut)
                    if not (nn_download(url, p) or nn_download(NN_MIRROR % (mon, fmt, cut), p)):
                        print('  使用率先验：缺少 %s（Smogon / PS 镜像均不可达）' % fn)
                        continue
                try:
                    d = json.load(open(p, encoding='utf-8'))
                except Exception as e:                       # noqa: BLE001
                    print('  使用率先验：%s 解析失败（%s）' % (fn, e))
                    continue
                n = 0
                for nm, e in (d.get('data') or {}).items():
                    u = e.get('usage')
                    if isinstance(u, (int, float)) and u > 0:
                        priors[nm] = priors.get(nm, 0.0) + float(u) * w
                        n += 1
                got.append({'file': fn, 'format': fmt, 'weight': w, 'species': n})
            if got:
                merged = {'month': mon, 'rating': 0, 'srcs': got, 'priors': priors}
                os.makedirs(NN_DIR, exist_ok=True)
                json.dump(merged, open(os.path.join(NN_DIR, 'chaos_%s.json' % mon), 'w', encoding='utf-8'),
                          ensure_ascii=False, separators=(',', ':'))
                print('使用率先验：落盘 nn_data/chaos_%s.json（源 %s）' %
                      (mon, '+'.join(x['format'] for x in got)))
                break
    if not merged or not merged.get('priors'):               # ③ 无数据 → 显式空态
        return {}, {'month': NN_MONTHS[0], 'rating': 0, 'srcs': [], 'coverage': 0, 'note': NN_NOTE}

    er_key = {}                                              # ④ 英名归一 → ER species id（gameData 全表）
    for s in GD['species']:
        if (s.get('id') or 0) < 1:
            continue
        k = nn_toks(s.get('name'))
        if k and k not in er_key:
            er_key[k] = s['id']
    prior, nomap = {}, 0
    for nm, v in merged['priors'].items():
        sid = er_key.get(nn_toks(nm))
        if sid is None:
            nomap += 1
            continue
        prior[str(sid)] = prior.get(str(sid), 0.0) + v
    mx = max(prior.values()) if prior else 0.0
    if mx > 0:                                               # 归一化 0..1（max=1）→ 引擎 1+0.6×prior 只作次排序
        prior = {k: round(v / mx, 4) for k, v in prior.items()}
    meta = {'month': merged['month'], 'rating': merged.get('rating', 0), 'srcs': merged['srcs'],
            'coverage': len(prior), 'note': NN_NOTE, 'scale': 'normalized(0..1, max=1)',
            'srcMax': round(mx, 6), 'unmapped': nomap}
    print('使用率先验：月 %s / 源 %s / ER 命中 %d 只 / 归一化上限 %.6f / chaos 名未映射 %d' %
          (meta['month'], '+'.join(x['format'] for x in meta['srcs']), len(prior), mx, nomap))
    return prior, meta


USAGE_PRIOR, USAGE_META = build_usage_prior()


# 15. 战术/协同角色（tacticRole / synergyRole）+ 协同轴知识库（v4.9 数据层）
#   契约（引擎层并行消费，字段名冻结）：
#     ERDATA.tacticRole:  {moveId(str): [角色…]}  招式战术角色（多标签；空数组=未标注）
#     ERDATA.synergyRole: {abiId(str):  [角色…]}  特性协同角色（多标签）
#     moves 行末追加第 12 列（index 11）= 同一份 tacticRole；abilities 行末追加第 5 列（index 4）= synergyRole
#       （既有位置契约 0..10 / 0..3 一字不动；引擎只按固定下标读旧列，追加列不改变旧语义）
#     nn_data\axis_lib.json: 协同轴知识库（15 轴，字段：id/name/轴手判定/受益者判定/联动说明/弱点体系/依据）
#   依据纪律：每条规则与每条「依据」都必须落到真实存在的表 —— gameData effT/flagsT/prio、ABI_TAGS、
#     SYS_SET_MAP、GLOSSARY、引擎 FUNC_MV、克制表 matchup、核心分类(分类.xlsx)、TEMPLATES；禁机制猜测。
_GD_MV = {str(m['id']): m for m in GD['moves']}


def _eff_of(m):
    e = m.get('eff') or 0
    return GD['effT'][e] if 0 <= e < len(GD['effT']) else ''


# 15a. 功能招 id 清单 —— 与引擎 build_tool_html.py::FUNC_MV（L3135-3147）逐条一致；改此表必须同步引擎
FUNC_MV_DATA = {
    'rec': [105, 202, 234, 235, 236, 303, 355, 409],
    'boost': [14, 187, 334, 339, 347, 349, 417, 468, 483, 504, 526],
    'boostPhys': [14, 187, 334, 339, 349, 468, 504, 526],
    'boostSpec': [347, 417, 483],
    'hazard': [191, 390, 446, 564],
    'removal': [229, 432],
    'speed': [86, 317, 366, 433],
    'protect': [164, 182],
    'pivot': [369, 521],
    'wear': [73, 92],
    'weather': [201, 240, 241, 258, 580, 581, 604, 641],
    'break': [73, 92, 1025, 432],
}
_HZ, _BPHY, _BSPEC = FUNC_MV_DATA['hazard'], FUNC_MV_DATA['boostPhys'], FUNC_MV_DATA['boostSpec']
_REC, _WEA, _PROT = FUNC_MV_DATA['rec'], FUNC_MV_DATA['weather'], FUNC_MV_DATA['protect']
_PIV, _WEAR, _BREAK, _SPD = FUNC_MV_DATA['pivot'], FUNC_MV_DATA['wear'], FUNC_MV_DATA['break'], FUNC_MV_DATA['speed']
_WX_MV = (201, 240, 241, 258)          # 天气招；FUNC_MV.weather 其余 4 条为场地招


def _mv_roles(mid, m):
    """招式战术角色（逐条可溯源：id 清单 / gameData effT 效果名 / flagsT 旗标 / prio 先制字段）"""
    R, eff = [], _eff_of(m)
    prio, flags = (m.get('prio') or 0), (m.get('flags') or [])
    if mid in _HZ: R.append('撒钉')
    if mid == 229: R.append('除钉·自身侧')          # GLOSSARY.hazard_clear：229 清自身侧
    if mid == 432: R.append('除钉·双方')            # GLOSSARY.hazard_clear：432 清双方（墙仅对手侧）
    if eff in ('Haze', 'Clear Smog'): R.append('破强化·清能力')
    if eff in ('Roar', 'Noble Roar', 'Hit Switch Target'): R.append('逼换·吹飞')
    if mid in _BPHY: R.append('强化·物攻')
    elif mid in _BSPEC: R.append('强化·特攻')
    if mid in _REC: R.append('回复')
    if mid in _WEA: R.append('天气设置' if mid in _WX_MV else '场地设置')
    if mid in _PROT: R.append('保命')
    if mid in _PIV: R.append('游击')
    if mid in _WEAR: R.append('消耗')
    if mid in _BREAK: R.append('破受')              # 引擎 FUNC_MV.break 同表
    if mid in _SPD:
        R.append('控速')
        if mid == 433: R.append('低速轴核心')        # 戏法空间（gameData prio=-7）
        if mid == 366: R.append('顺风')
    if prio > 0: R.append('先制')
    if eff == 'Sucker Punch': R.append('先制反击')
    if 8 in flags: R.append('反伤')                 # flagsT[8]='Causes Recoil'
    if eff == 'Recharge': R.append('僵直')
    if eff in ('Multi Hit', 'Double Hit', 'Triple Kick'): R.append('连击')
    if eff in ('Trap', 'Mean Look'): R.append('束缚·困住')
    if eff == 'Absorb': R.append('吸血站场')
    if eff in ('Explosion', 'Memento'): R.append('自爆·退场')
    if eff == 'Remove Terrain No Fail': R.append('清场地')
    if eff == 'Follow Me': R.append('双打·掩护')
    if eff in ('Wish', 'Healing Wish') or mid in (505, 629): R.append('队医')
    return R


TACTIC_ROLE = {}
for _mid, _m in _GD_MV.items():
    if _mid in moves:
        TACTIC_ROLE[_mid] = _mv_roles(int(_mid), _m)
for _mid in moves:
    TACTIC_ROLE.setdefault(_mid, [])

# 15b. 特性协同角色 synergyRole
#   来源三路：① ABI_TAGS（im/hf/def/conv/out 实测标签）② SYS_SET_MAP（出场设天气/场地特性）
#             ③ gameData abilities.desc 英语原文正则（与既有 SYS_SET_PATTERNS 同法；例：悠游自如 desc
#                'This Pokémon's Speed gets a 1.5x boost if rain is active' → ER 口径 ×1.5，非 ×2）
_SPEED_DESC = [(r'Speed gets a ([\d.]+)x boost if rain is active', '雨天速度位'),
               (r'Speed gets a ([\d.]+)x boost if sun is active', '晴天速度位'),
               (r'Speed gets a ([\d.]+)x boost in a sandstorm', '沙暴速度位'),
               (r'Speed gets a ([\d.]+)x boost in hail', '雪天速度位')]
_DESC_ABI = [(r'Heals 1/3 of max HP upon switching out', '轮转·再生'),
             (r'Traps opposing Steel-types', '捕钢陷阱'),
             (r"Opponents can't be switched out", '踩影陷阱'),
             (r"Enemies can't flee", '沙穴陷阱'),
             (r'Status moves have \+1 priority', '先制变化招'),
             (r'Only damaged by attacks', '免疫·非攻击伤害'),
             (r"Ignores foes' stat changes", '反强化·纯朴'),
             (r"Lowers foes' Atk by one stage on entry", '出场降攻·威吓'),
             (r'Lowers all foes. Speed', '降速·棉絮')]
_CONV_SRC = {'280': '岩石', '659': '钢'}   # 特例源属性（其余 -ate 类源属性=一般；v2.65 考古 §2）


def _ab_roles(aid, a):
    R, t, d = [], (ABI_TAGS.get(aid) or {}), (a.get('desc') or '')
    _sysn = SYS_SET_MAP.get(int(aid))
    if _sysn:
        R.append(('天气手·' if _sysn in ('雨', '晴', '沙', '雪') else '场手·') + _sysn)
    if t.get('conv'):
        R.append('转换位·%s（源%s）' % (t['conv'], _CONV_SRC.get(aid, '一般')))
    _ims = t.get('im') or []
    for _ty in _ims: R.append('免疫·' + _ty)
    if '水' in _ims: R.append('雨天免疫位')
    if '火' in _ims: R.append('晴天免疫位')
    if '地面' in _ims: R.append('地面免疫位')
    for _ty in (t.get('hf') or []): R.append('减伤·' + _ty)
    if isinstance(t.get('def'), (int, float)):
        _cd = t.get('cond') or ''
        for _kw, _tag in (('特殊招式', '减伤·特殊'), ('满血', '减伤·满血'), ('青草场地', '场地受益·青草场地'),
                          ('冰雹', '天气受益·冰雹'), ('异常状态', '异常受益')):
            if _kw in _cd:
                R.append(_tag); break
    _o = t.get('out') or {}
    if (_o.get('cond') or '') in ('雨天', '晴天', '沙暴', '冰雹'):
        R.append('天气受益·' + _o['cond'])
    if _o.get('type'):
        R.append('输出位·' + ('、'.join(_o['type']) if isinstance(_o['type'], list) else _o['type']))
    for _pat, _tag in _SPEED_DESC:
        _mm = re.search(_pat, d)
        if _mm: R.append('%s（×%s）' % (_tag, _mm.group(1)))
    for _pat, _tag in _DESC_ABI:
        if re.search(_pat, d): R.append(_tag)
    return R


SYNERGY_ROLE = {}
_ABI_BY_ID = {str(x['id']): x for x in GD['abilities']}
for _aid in _ABI_BY_ID:
    SYNERGY_ROLE[_aid] = _ab_roles(_aid, _ABI_BY_ID[_aid])
for _r in abilities:
    SYNERGY_ROLE.setdefault(_r[0], [])

# 角色列追加（位置契约：moves 0..10 不变 → 新列 index 11；abilities 0..3 不变 → 新列 index 4）
for _r in moves.values():
    _r.append(TACTIC_ROLE.get(_r[0], []))
for _r in abilities:
    _r.append(SYNERGY_ROLE.get(_r[0], []))
print('tacticRole: %d 条 / 已标注 %d 条 | synergyRole: %d 条 / 已标注 %d 条' %
      (len(TACTIC_ROLE), sum(1 for v in TACTIC_ROLE.values() if v),
       len(SYNERGY_ROLE), sum(1 for v in SYNERGY_ROLE.values() if v)))

# 15c. 协同轴知识库（12–15 轴；引擎层按 id/字段名消费）
#   字段：id, name, 轴手判定{role, ability_tags, moves}, 受益者判定{ability_tags, moves, immune_types,
#         speed_or_power_rule}, 联动说明, 弱点体系[{threat, 建议}], 依据[溯源]
#   标签口径：ability_tags / moves 均为**中文名**（与 SYS_SET「特性名→体系」TEMPLATES「(特性|招式,名)」惯例一致，
#     引擎既有 name→id 解析器可直接消费）；「依据」里给出对应的 gameData/表 id 供核对。
AXES = [
    {
        'id': 'rain', 'name': '雨天',
        '轴手判定': {'role': '天气设置者（出场降雨 / 手动求雨）',
                     'ability_tags': ['降雨', '积雨云'], 'moves': ['求雨']},
        '受益者判定': {'ability_tags': ['悠游自如', '暴风雨', '储水', '引水', '干燥皮肤', '蒸发', '蓄电'],
                       'moves': ['打雷', '暴风', '水炮', '冲浪'],
                       'immune_types': ['水', '电'],
                       'speed_or_power_rule': '速度×1.5（悠游自如33）；最高攻项×1.5（暴风雨935）；水招×1.5、火招×0.5'},
        '联动说明': '天气手降雨2/积雨云989 → 8 回合窗口（岩石延长 12）；与晴天轴互斥（改天气）；水免/电免特性是雨天内战与防电的联防位；对应 TEMPLATES[雨天速攻] / TEMPLATES[天气双核]。',
        '弱点体系': [
            {'threat': '对手改天气（晴天轴：水招×0.5、火招×1.5）', '建议': '双天气轮换或手动求雨240 续场（GLOSSARY.weather_manual）'},
            {'threat': '草 / 电属性攻击（克制表：水 2× 被 草 / 电）', '建议': '食草157 / 蓄电10 补位（ABI_TAGS），配地面或飞行联防'},
            {'threat': '除钉与对手换场（Remove Terrain No Fail 4 招）', '建议': '配清除浓雾432 手（GLOSSARY.hazard_clear），窗口内不盲目铺钉'}],
        '依据': ["GLOSSARY.weather_rain：水×1.5、火×0.5；持续 8 回合、岩石延长 12【v2.65 源码实证】",
                 "SYS_SET_MAP：降雨2 / 积雨云989；FUNC_MV.weather 求雨240",
                 "abilities[33] 悠游自如 desc：'Speed gets a 1.5x boost if rain is active'（ER 口径 ×1.5，非 ×2）",
                 "ABI_TAGS[935] 暴风雨 out{cond:雨天}；ABI_TAGS[87] 干燥皮肤 im[水]；ABI_TAGS[114] 引水 im[水]",
                 "TEMPLATES[雨天速攻] / TEMPLATES[天气双核]"],
    },
    {
        'id': 'sun', 'name': '晴天',
        '轴手判定': {'role': '天气设置者（出场日照 / 手动大晴天）',
                     'ability_tags': ['日照', '绯红脉动'], 'moves': ['大晴天']},
        '受益者判定': {'ability_tags': ['叶绿素', '太阳之力', '猛火', '适应力', '引火'],
                       'moves': ['日光束', '大字爆炎', '闪焰冲锋'],
                       'immune_types': ['火', '水'],
                       'speed_or_power_rule': '速度×1.5（叶绿素34）；最高攻项×1.5（太阳之力94，每回合掉血）；火招×1.5、水招×0.5'},
        '联动说明': '日照70 / 绯红脉动584（晴天下自身攻击×1.33）→ 8 回合；日光束/日光刃免蓄力（GLOSSARY.charge）；与雨天轴互斥；对应 TEMPLATES[晴天速攻]。',
        '弱点体系': [
            {'threat': '水 / 地面 / 岩石属性攻击（克制表：火 2× 被 水 / 地面 / 岩石）', '建议': '水免 / 草免位（ABI_TAGS[11]/[114]/[157]）'},
            {'threat': '对手改天气（雨天轴：火招×0.5）', '建议': '天气手轮换（TEMPLATES[双天气轮换]）'},
            {'threat': '沙暴体系（岩石特防×1.5，GLOSSARY.weather_sand）', '建议': '带格斗 / 水补盲'}],
        '依据': ["GLOSSARY.weather_sun：火×1.5、水×0.5、日光束免蓄力【v2.65 源码实证】",
                 "SYS_SET_MAP：日照70 / 绯红脉动584；FUNC_MV.weather 大晴天241",
                 "abilities[34] 叶绿素 desc：'Speed gets a 1.5x boost if sun is active'",
                 "ABI_TAGS[94] 太阳之力 out{cond:晴天}；ABI_TAGS[66] 猛火 out{type:火,cond:<1/3血}",
                 "TEMPLATES[晴天速攻]"],
    },
    {
        'id': 'sand', 'name': '沙暴',
        '轴手判定': {'role': '天气设置者（出场扬沙 / 手动沙暴）',
                     'ability_tags': ['扬沙', '沙漠意志'], 'moves': ['沙暴']},
        '受益者判定': {'ability_tags': ['拨沙', '沙之力', '可憎怪物', '储水', '食草'],
                       'moves': ['岩崩', '地震'],
                       'immune_types': ['水', '草'],
                       'speed_or_power_rule': '速度×1.5（拨沙146）；最高攻项×1.5（沙之力159）；岩石特防×1.5（原版口径，未列入 v2.65 实证清单）'},
        '联动说明': '沙暴回合末对非岩 / 地 / 钢造成 1/16；沙漠意志604 另使地面招可打飞空；与「岩石特防×1.5」构成耐久核心；对应 TEMPLATES[沙暴联防]。',
        '弱点体系': [
            {'threat': '水 / 草 / 格斗属性攻击（克制表：岩石 2× 被 水 / 草 / 格斗）', '建议': '水免 / 草免位（ABI_TAGS[87]/[157]）'},
            {'threat': '沙暴不伤岩 / 地 / 钢 → 对手同类体系免疫消耗', '建议': '带高威力覆盖招而非依赖沙暴消耗'},
            {'threat': '天气被覆盖（雨天 / 晴天轴）', '建议': '手动沙暴201 续场（FUNC_MV.weather）'}],
        '依据': ["GLOSSARY.weather_sand：回合末 1/16、岩石特防×1.5（原版口径）；持续 8 / 岩石 12",
                 "SYS_SET_MAP：扬沙45 / 沙漠意志604；FUNC_MV.weather 沙暴201",
                 "abilities[146] 拨沙 desc：'Speed gets a 1.5x boost in a sandstorm'",
                 "ABI_TAGS[159] 沙之力 out{cond:沙暴}",
                 "TEMPLATES[沙暴联防]"],
    },
    {
        'id': 'snow', 'name': '雪天',
        '轴手判定': {'role': '天气设置者（出场降雪 / 手动冰雹）',
                     'ability_tags': ['降雪'], 'moves': ['冰雹']},
        '受益者判定': {'ability_tags': ['拨雪', '冰天雪地', '可憎怪物', '厚脂肪', '引火'],
                       'moves': ['暴风雪', '极光幕'],
                       'immune_types': ['火'],
                       'speed_or_power_rule': '速度×1.5（拨雪202，另免疫冰雹伤害）；冰招×1.5（冰天雪地269）；冰系防御×1.5（源码 S9）'},
        '联动说明': '降雪117 → 8 回合；暴风雪必中（GLOSSARY.weather_hail）；极光幕需雪天；冰系防御 +50%（源码 S9）；对应 TEMPLATES[雪天堡垒]。',
        '弱点体系': [
            {'threat': '火 / 格斗 / 岩石 / 钢属性攻击（克制表：冰 2× 被 火 / 格斗 / 岩石 / 钢）', '建议': '引火18 / 焦香之躯446 / 灼日869 火免位（ABI_TAGS）'},
            {'threat': '对手改天气 → 极光幕与冰系防御加成失效', '建议': '手动冰雹258 续场（FUNC_MV.weather）'},
            {'threat': '岩石 / 钢属性物攻强压', '建议': '厚脂肪47 减伤位 + 物盾（核心分类[超级物盾]）'}],
        '依据': ["GLOSSARY.weather_hail：冰系防御×1.5（源码 S9）、暴风雪必中、回合末 1/16【v2.65 源码实证】",
                 "SYS_SET_MAP：降雪117；FUNC_MV.weather 冰雹258",
                 "abilities[202] 拨雪 desc：'Speed gets a 1.5x boost in hail'（另免疫冰雹伤害）",
                 "ABI_TAGS[269] 冰天雪地 out{cond:冰雹}；ABI_TAGS[1018] 可憎怪物 def{spd,cond:冰雹}",
                 "TEMPLATES[雪天堡垒]"],
    },
    {
        'id': 'trickroom', 'name': '戏法空间（低速轴）',
        '轴手判定': {'role': '空间手（超低速宝可梦）', 'ability_tags': [], 'moves': ['戏法空间']},
        '受益者判定': {'ability_tags': [], 'moves': ['破壳', '腹鼓'],
                       'immune_types': [],
                       'speed_or_power_rule': '速度反转（慢者先手）；戏法空间 prio −7（gameData.moves[433].prio）；回合数待实测（TRICK_ROOM_DURATION=5 与施放回合不递减冲突）'},
        '联动说明': '空间手开局 → 5 回合窗口（实测存疑，GLOSSARY.trickroom）→ 低速高攻手先手；与强化轴叠加（慢速强化手在空间内先强化后出手）；受益者为「低速打手」类型判定，非特性判定，故 ability_tags 留空。',
        '弱点体系': [
            {'threat': '空间回合有限且回合数存疑', '建议': '带第二空间手，或准备空间外战术'},
            {'threat': '先制招式在空间内仍照常先手', '建议': '配精神场地641（GLOSSARY.terrain_psychic：场地内先制失效）'},
            {'threat': '挑衅 / 封印封空间', '建议': '带替身164 或恶免 / 高速压制的队友（FUNC_MV.protect）'}],
        '依据': ["GLOSSARY.trickroom：5 回合、prio −7（数据驱动 gameData.moves[433].prio）【回合数待实测】",
                 "FUNC_MV.speed 含 433 戏法空间（build_tool_html.py L3143）",
                 "GLOSSARY.terrain_psychic：场地内先制招式失效【v2.65 源码实证】",
                 "核心分类(分类.xlsx)：慢速打手 2 只",
                 "TEMPLATES[戏法空间]"],
    },
    {
        'id': 'e_terrain', 'name': '电气场地',
        '轴手判定': {'role': '场地设置者（电气制造者 / 电动场地招）',
                     'ability_tags': ['电气制造者'], 'moves': ['电气场地']},
        '受益者判定': {'ability_tags': ['电晶体', '蓄电', '避雷针', '电气引擎', '飘浮'],
                       'moves': ['十万伏特', '伏特替换', '迅雷'],
                       'immune_types': ['地面'],
                       'speed_or_power_rule': '电招×1.3（GLOSSARY.terrain_boost）；接地免疫睡眠'},
        '联动说明': '电气制造者226 → 8 回合（场地延展器 12）；电免特性（蓄电10 / 避雷针31 / 电气引擎78）既是受益也是内战联防；飘浮26 补地面弱点；对应 TEMPLATES[电气场地速攻] / TEMPLATES[场地控制]。',
        '弱点体系': [
            {'threat': '地面属性攻击（克制表：电 2× 被 地面，且电招对地面无效）', '建议': '飘浮26 / 隔空取物511 / 巨翼688 地面免位（ABI_TAGS）'},
            {'threat': '对手改场地或清场地（Remove Terrain No Fail 4 招）', '建议': '双场手或手动电气场地604 续场'},
            {'threat': '草 / 龙属性打电系核心', '建议': '带冰 / 妖精补盲'}],
        '依据': ["GLOSSARY.terrain_electric：电×1.3、场上免疫睡眠【v2.65 源码实证】",
                 "GLOSSARY.terrain_boost / terrain_dur / terrain_extender：×1.3、8 回合、延展器 12",
                 "SYS_SET_MAP：电气制造者226；FUNC_MV.weather 电气场地604",
                 "ABI_TAGS[262] 电晶体 out{type:电}；ABI_TAGS[10] 蓄电 im[电]；ABI_TAGS[26] 飘浮 im[地面]",
                 "TEMPLATES[电气场地速攻] / TEMPLATES[场地控制]"],
    },
    {
        'id': 'misty', 'name': '薄雾场地',
        '轴手判定': {'role': '场地设置者（薄雾制造者 / 薄雾场地招）',
                     'ability_tags': ['薄雾制造者'], 'moves': ['薄雾场地']},
        '受益者判定': {'ability_tags': ['妖精皮肤'],
                       'moves': ['魔法闪耀', '嬉闹'],
                       'immune_types': [],
                       'speed_or_power_rule': '妖精招×1.3（同场地档 GLOSSARY.terrain_boost）；接地全队免疫异常状态'},
        '联动说明': '薄雾制造者228 → 8 回合；全队防异常，对削弱轴 / 剧毒轴是硬反制；**龙伤减半已在 v2.65.3b 移除，不得按原版口径引用**（GLOSSARY.terrain_misty）；对应 TEMPLATES[薄雾场地龙盾]。',
        '弱点体系': [
            {'threat': '钢 / 毒属性（克制表：妖精 2× 被 毒，妖精招被钢抵抗）', '建议': '带地面 / 火补盲打钢'},
            {'threat': '对手改场地 / 清场地', '建议': '第二场地手或手动薄雾场地581'},
            {'threat': '毒属性攻击（克制表：妖精 2× 被 毒）', '建议': '钢 / 毒耐药位（ABI_TAGS[17]/[855] 减伤毒）'}],
        '依据': ["GLOSSARY.terrain_misty：妖精增伤（同场地档）、全队免疫异常；龙伤减半已在 v2.65.3b 移除",
                 "SYS_SET_MAP：薄雾制造者228；FUNC_MV.weather 薄雾场地581",
                 "ABI_TAGS[182] 妖精皮肤 conv[妖精]",
                 "TEMPLATES[薄雾场地龙盾]"],
    },
    {
        'id': 'grassy', 'name': '青草场地',
        '轴手判定': {'role': '场地设置者（青草制造者 / 青草场地招）',
                     'ability_tags': ['青草制造者'], 'moves': ['青草场地']},
        '受益者判定': {'ability_tags': ['草之毛皮', '花项链', '食草'],
                       'moves': ['终极吸取', '寄生种子'],
                       'immune_types': ['草'],
                       'speed_or_power_rule': '草招×1.3；场上每回合回复（回复量属原版口径）；青草场地内防御 / 特防×1.5（ABI_TAGS[179]/[984]）'},
        '联动说明': '青草制造者229 → 8 回合；地面回复 + 寄生种子 / 吸血类招式叠加站场（TEMPLATES[青草场地回复] / TEMPLATES[吸血站场]）。',
        '弱点体系': [
            {'threat': '火 / 冰 / 毒 / 飞行 / 虫属性攻击（克制表：草 2× 被 火 / 冰 / 毒 / 飞行 / 虫）', '建议': '厚脂肪47 / 耐热85 减伤位'},
            {'threat': '对手改场地 / 清场地', '建议': '第二场地手或手动青草场地580'},
            {'threat': '飞行 / 飘浮不受地面系效果，草招对飞行减半', '建议': '带岩石 / 电补盲'}],
        '依据': ["GLOSSARY.terrain_grassy：草×1.3、回合末回复（原版口径）",
                 "GLOSSARY.terrain_dur / terrain_extender：8 回合、延展器 12",
                 "SYS_SET_MAP：青草制造者229；FUNC_MV.weather 青草场地580",
                 "ABI_TAGS[179] 草之毛皮 def{def,cond:青草场地}；ABI_TAGS[984] 花项链 def{spd,cond:青草场地}",
                 "TEMPLATES[青草场地回复]"],
    },
    {
        'id': 'psychic', 'name': '精神场地',
        '轴手判定': {'role': '场地设置者（精神制造者 / 精神场地招）',
                     'ability_tags': ['精神制造者'], 'moves': ['精神场地']},
        '受益者判定': {'ability_tags': ['天才思想'],
                       'moves': ['精神强念'],
                       'immune_types': ['恶'],
                       'speed_or_power_rule': '超能招×1.3；接地免疫对手先制招式'},
        '联动说明': '精神制造者227 → 8 回合；反先制（克制突袭389 / 先制收割），对先制流是硬反制；与戏法空间轴可叠加（空间内先制仍先手 → 精神场地封之）；对应 TEMPLATES[精神场地特攻]。',
        '弱点体系': [
            {'threat': '恶 / 幽灵 / 虫属性攻击（克制表：超能力 2× 被 恶 / 幽灵 / 虫）', '建议': '天才思想422 免疫恶 / 幽灵 / 虫（ABI_TAGS）'},
            {'threat': '对手改场地 / 清场地', '建议': '第二场地手或手动精神场地641'},
            {'threat': '钢属性（超能招被钢抵抗）', '建议': '带格斗 / 火 / 地面补盲'}],
        '依据': ["GLOSSARY.terrain_psychic：超能×1.3、场地内先制招式失效【v2.65 源码实证】",
                 "SYS_SET_MAP：精神制造者227；FUNC_MV.weather 精神场地641",
                 "ABI_TAGS[422] 天才思想 im[恶,幽灵,虫]",
                 "TEMPLATES[精神场地特攻]"],
    },
    {
        'id': 'toxic', 'name': '剧毒场地',
        '轴手判定': {'role': '场地设置者（毒沼制造者；剧毒场地招）',
                     'ability_tags': ['毒沼制造者'], 'moves': []},
        '受益者判定': {'ability_tags': [],
                       'moves': ['剧毒', '毒液陷阱'],
                       'immune_types': ['毒'],
                       'speed_or_power_rule': '毒招×1.3；回合末对非毒 / 钢接地者 1/16（豁免不看接地）'},
        '联动说明': '毒沼制造者834 → 8 回合；伤害只作用于「非毒 / 钢」，故毒 / 钢核心零成本；与钉轴 / 受队轴叠加消耗（TEMPLATES[毒钉受队]）；剧毒场地招为 data 侧 gameData effT[Toxic Terrain]（moves[1006]，中文名缺失）。',
        '弱点体系': [
            {'threat': '钢 / 毒属性核心完全豁免场地伤害', '建议': '带非毒 / 钢的高威力打手'},
            {'threat': '对手改场地 / 清场地', '建议': '第二场地手或手动设置（FUNC_MV.weather 无剧毒场地招 → 依赖特性）'},
            {'threat': '对手回复轮转抵消 1/16', '建议': '叠加剧毒92（FUNC_MV.wear）放大递增伤害'}],
        '依据': ["GLOSSARY.terrain_toxic：毒×1.3、回合末 1/16、豁免「毒或钢全类型（不看接地）」、8 / 12 回合【v2.65 源码实证】",
                 "SYS_SET_MAP：毒沼制造者834；gameData effT[Toxic Terrain] → moves[1006]",
                 "核心分类(分类.xlsx)：剧毒场地 1 只",
                 "TEMPLATES[毒钉受队]"],
    },
    {
        'id': 'hazard', 'name': '钉轴（撒钉循环）',
        '轴手判定': {'role': '钉子手（撒菱 / 毒菱 / 隐形岩 / 黏黏网）',
                     'ability_tags': [], 'moves': ['撒菱', '毒菱', '隐形岩', '黏黏网']},
        '受益者判定': {'ability_tags': ['魔法防守', '再生力'],
                       'moves': ['剧毒', '寄生种子', '清除浓雾', '高速旋转'],
                       'immune_types': ['毒'],
                       'speed_or_power_rule': '换入伤害：撒菱 1/8·1/6·1/4（仅接地）／隐形岩按岩石克制 1/32–1/2／毒菱 中毒·剧毒／黏黏网 速度−1'},
        '联动说明': '钉子手 = FUNC_MV.hazard {191,390,446,564}；轮转逼换（游击369/521）+ 消耗（剧毒92/寄生种子73）放大钉子收益；魔法防守98 免疫钉子伤害、再生力144 换下回复 1/3，是钉轴的两个受益位；对应 TEMPLATES[钉子受队]。',
        '弱点体系': [
            {'threat': '除钉（高速旋转229 清自身侧 / 清除浓雾432 清双方）', '建议': '配幽灵 / 反清场位，降低被清场后重建成本（GLOSSARY.hazard_clear）'},
            {'threat': '对手钢 / 毒免毒菱、飞行 / 飘浮免黏黏网，且撒菱仅对落地者生效', '建议': '以隐形岩446 覆盖全属性（GLOSSARY.hazard_toxicspikes / hazard_stickyweb）'},
            {'threat': '隐形岩非首铺疑似失效（v2.65 Beta2 社区报告，无源码结论）', '建议': '引擎输出风险提示，不假设隐形岩必然生效（GLOSSARY.hazard_bug）'}],
        '依据': ["GLOSSARY.hazard_spikes / hazard_stealthrock / hazard_toxicspikes / hazard_stickyweb（数值与豁免）",
                 "GLOSSARY.hazard_clear：229 清自身侧 / 432 清双方、墙仅对手侧、降闪避 1 级【v2.65 源码实证】",
                 "FUNC_MV.hazard = [191,390,446,564]（build_tool_html.py L3141，引擎逐条消费）",
                 "abilities[98] 魔法防守 desc：'Only damaged by attacks'（免疫入场陷阱 / 天气伤害）；abilities[144] 再生力 desc：换下回复 1/3",
                 "TEMPLATES[钉子受队] / TEMPLATES[毒钉受队]"],
    },
    {
        'id': 'boost', 'name': '强化轴（站场强化）',
        '轴手判定': {'role': '强化手（剑舞 / 龙舞 / 诡计 / 蝶舞 / 腹鼓 / 破壳）',
                     'ability_tags': [], 'moves': ['剑舞', '龙之舞', '诡计', '蝶舞', '腹鼓', '破壳']},
        '受益者判定': {'ability_tags': ['多重鳞片', '幻影防守', '毛皮大衣', '毛茸茸', '适应力'],
                       'moves': ['守住', '替身', '自我再生'],
                       'immune_types': [],
                       'speed_or_power_rule': '剑舞+2 物攻 / 龙舞 攻速+1 / 蝶舞 特攻特防速+1 / 诡计 特攻+2 / 破壳 攻特攻速+2 但防特防−1（GLOSSARY.boost_dance）'},
        '联动说明': '强化手 = FUNC_MV.boost {14,187,334,339,347,349,417,468,483,504,526}（引擎 funcWeight「站场强化」权重 30/35）；减伤 / 回复特性提供强化窗口；与戏法空间轴叠加；对应 TEMPLATES[强化清场轴] / TEMPLATES[强化接力]。',
        '弱点体系': [
            {'threat': '清能力 / 逼换（黑雾114、清除之烟499、吼叫46、吹飞18、龙尾525）', '建议': '替身164 规避逼换（FUNC_MV.protect）'},
            {'threat': '先制收割（子弹拳418 / 突袭389 / 神速245）', '建议': '精神场地641 或高耐久强化（GLOSSARY.terrain_psychic）'},
            {'threat': '威吓 / 降能力（abilities[22] 出场降攻 1 级）', '建议': '不服输类被降反升（GLOSSARY.intimidate_guard）'}],
        '依据': ["GLOSSARY.boost_dance：剑舞14 / 龙之舞349 / 蝶舞483 / 诡计417 / 破壳504 数值【招式数据】",
                 "FUNC_MV.boost / boostPhys / boostSpec（build_tool_html.py L3137-3140）",
                 "ABI_TAGS[136] 多重鳞片 def{满血}；ABI_TAGS[169] 毛皮大衣 phy 0.5；ABI_TAGS[91] 适应力 out 1.33",
                 "核心分类(分类.xlsx)：站场强化 8 只",
                 "TEMPLATES[强化清场轴] / TEMPLATES[强化接力]"],
    },
    {
        'id': 'stall', 'name': '受队轴（回复+消耗）',
        '轴手判定': {'role': '受队核心（物盾 / 特盾 / 回复手）',
                     'ability_tags': ['多重鳞片', '毛皮大衣', '毛茸茸', '洁净之盐'],
                     'moves': ['自我再生', '羽栖', '偷懒', '睡觉']},
        '受益者判定': {'ability_tags': ['魔法防守', '纯朴'],
                       'moves': ['撒菱', '隐形岩', '清除浓雾', '高速旋转'],
                       'immune_types': ['毒'],
                       'speed_or_power_rule': '回复半血（自我再生105 / 偷懒303 / 羽栖355）；剧毒递增 1/16→2/16（GLOSSARY.status_toxic）；烧伤 / 冻伤回合末 1/16 且能力减半'},
        '联动说明': '受队 = 回复（FUNC_MV.rec）+ 消耗（剧毒92 / 寄生种子73，标签见 weaken / hazard 轴）+ 钉子（FUNC_MV.hazard）三件套；轮转由 pivot 轴的再生力144（换下回复 1/3）支撑，属跨轴联动；对应 TEMPLATES[钉子受队] / TEMPLATES[毒钉受队] / TEMPLATES[吸血站场]。',
        '弱点体系': [
            {'threat': '破受（Psycho Wave 1025 / 清除浓雾432 兼破受，FUNC_MV.break）', '建议': '再生力144 轮转换挡'},
            {'threat': '强化手推队（强化轴）', '建议': '黑雾114 / 清除之烟499 / 逼换 18·46（FUNC_MV 破强化）'},
            {'threat': '对手剧毒92 消耗自身', '建议': '钢 / 毒耐药位（ABI_TAGS[17]/[855] 减伤毒）+ 治愈铃声215 / 芳香治疗312 队医位'}],
        '依据': ["GLOSSARY.recover：回复半血；晨光234 / 光合作用235 / 月光236 随天气变化（原版口径）",
                 "GLOSSARY.status_toxic / status_burn / status_frostbite（数值与能力减半）",
                 "FUNC_MV.rec / wear / hazard / break（build_tool_html.py L3135-3146）",
                 "abilities[144] 再生力 desc：'Heals 1/3 of max HP upon switching out'",
                 "核心分类(分类.xlsx)：轮转肉盾 2 只 / 超级物盾 1 只；TEMPLATES[钉子受队]"],
    },
    {
        'id': 'pivot', 'name': '轮转轴（游击 / 折返）',
        '轴手判定': {'role': '折返手（急速折返 / 伏特替换 / 顺风手）',
                     'ability_tags': ['恶作剧之心', '再生力'], 'moves': ['急速折返', '伏特替换']},
        '受益者判定': {'ability_tags': ['飘浮', '隔空取物', '巨翼', '威吓'],
                       'moves': ['顺风', '戏法空间'],
                       'immune_types': ['地面'],
                       'speed_or_power_rule': '折返换人保节奏（FUNC_MV.pivot 369/521）；再生力144 换下回复 1/3；顺风366 全队速度×2（4 回合时段）'},
        '联动说明': '轮转 = 折返（369/521）+ 换人受益特性（再生力144）+ 换人惩罚风险（蹲守198 对手换入时×2）；顺风 / 空间是轮转轴的控速分支（GLOSSARY.tailwind）；对应 TEMPLATES[顺风游击]。',
        '弱点体系': [
            {'threat': '换人惩罚：蹲守198（对手换入时伤害×2）', '建议': '避免无意义折返，或先手压制后再轮转（ABI_TAGS[198]）'},
            {'threat': '束缚 / 陷阱特性（踩影23 / 沙穴71 / 磁力42）阻止换人', '建议': '幽灵属性位（abilities[23] desc：幽灵免疫）+ 逃脱按键 / 换人招'},
            {'threat': '钉子惩罚换入（钉轴）', '建议': '清除浓雾432 / 高速旋转229 先清场（FUNC_MV.removal）'}],
        '依据': ["FUNC_MV.pivot = [369,521]（build_tool_html.py L3145）",
                 "GLOSSARY.tailwind：全队速度×2、4 回合时段【v2.65 源码实证】",
                 "abilities[144] 再生力 desc：'Heals 1/3 of max HP upon switching out'",
                 "ABI_TAGS[198] 蹲守 out{mul:2,cond:对手换入时}；abilities[23] 踩影 / abilities[71] 沙穴 / abilities[42] 磁力 desc",
                 "TEMPLATES[顺风游击]"],
    },
    {
        'id': 'weaken', 'name': '削弱轴（威吓 / 降能力 / 异常）',
        '轴手判定': {'role': '削弱手（威吓 / 降能力 / 异常状态铺场）',
                     'ability_tags': ['威吓', '棉絮'],
                     'moves': ['电磁波', '磷火', '剧毒', '岩石封锁', '毒液陷阱', '大蛇瞪眼']},
        '受益者判定': {'ability_tags': ['毅力', '中毒激升', '魔法防守', '纯朴'],
                       'moves': ['黑雾', '清除之烟'],
                       'immune_types': [],
                       'speed_or_power_rule': '威吓22 出场降攻 1 级；麻痹速度×0.5、烧伤物攻×0.5、冻伤特攻×0.5、剧毒伤害递增（GLOSSARY.status_*）'},
        '联动说明': '削弱轴 = 异常状态（电磁波86 / 磷火261 / 剧毒92）+ 降能力（岩石封锁317 速度−1 / 毒液陷阱599 降攻特攻速）+ 威吓22；受益者多为吃异常的「毅力62 / 中毒激升137」或无视变化 / 非攻击伤害的「纯朴109 / 魔法防守98」；与受队轴叠加消耗。',
        '弱点体系': [
            {'threat': '薄雾场地（接地全队免疫异常，GLOSSARY.terrain_misty）', '建议': '改场地或改走降能力路线'},
            {'threat': '魔法防守98（免疫异常与天气等非攻击伤害）', '建议': '改用降能力与直接输出压制'},
            {'threat': '防威吓特性（不服输 / 自信过度153，被降反升）', '建议': '不依赖威吓循环，改为直接输出（GLOSSARY.intimidate_guard）'}],
        '依据': ["GLOSSARY.status_para / status_burn / status_frostbite / status_toxic（数值与能力减半）【v2.65 源码实证】",
                 "abilities[22] 威吓 desc：'Lowers foes' Atk by one stage on entry'；abilities[238] 棉絮 desc：受击降对手速度",
                 "FUNC_MV.speed 含 电磁波86 / 岩石封锁317；MOVES_NOTES[92] 剧毒 / MOVES_NOTES[86] 电磁波",
                 "GLOSSARY.intimidate_guard：防威吓（不服输 / 自信过度153 / 胆量）",
                 "ABI_TAGS[62] 毅力 out{cond:异常状态}；ABI_TAGS[137] 中毒激升 out{cond:中毒}"],
    },
]

# 15d. 轴库自检（唯一性 + 溯源可解析）→ 结果落 nn_data\axis_lib_check.json，探针亦复核
def _axis_check(_axes):
    _ids = [a['id'] for a in _axes]
    _owner, _conf = {}, []
    for a in _axes:
        for t in a['轴手判定']['ability_tags'] + a['轴手判定']['moves']:
            if t in _owner and _owner[t] != a['id']:
                _conf.append({'tag': t, 'axes': [_owner[t], a['id']]})
            _owner.setdefault(t, a['id'])
    _shared = {}
    for a in _axes:
        for t in a['受益者判定']['ability_tags'] + a['受益者判定']['moves'] + a['受益者判定']['immune_types']:
            _shared.setdefault(t, []).append(a['id'])
    _gk = {g['key'] for g in GLOSSARY}
    _tn = {t.get('name') for t in TEMPLATES}
    _abids = {r[0] for r in abilities}
    _bad = []
    for a in _axes:
        for s in a['依据']:
            if not re.search(r'(克制表|GLOSSARY\.|ABI_TAGS\[|SYS_SET_MAP|abilities\[|FUNC_MV\.|MOVES_NOTES\[|TEMPLATES\[|gameData\.|核心分类)', s):
                _bad.append({'axis': a['id'], 'why': '无来源 token', 'src': s})
            for m2 in re.finditer(r'ABI_TAGS\[(\d+)\]', s):
                if m2.group(1) not in ABI_TAGS: _bad.append({'axis': a['id'], 'why': 'ABI_TAGS 无此 id', 'src': m2.group(0)})
            for m2 in re.finditer(r'abilities\[(\d+)\]', s):
                if m2.group(1) not in _abids: _bad.append({'axis': a['id'], 'why': 'abilities 无此 id', 'src': m2.group(0)})
            for m2 in re.finditer(r'GLOSSARY\.(\w+)', s):
                if m2.group(1) not in _gk: _bad.append({'axis': a['id'], 'why': 'GLOSSARY 无此 key', 'src': m2.group(0)})
            for m2 in re.finditer(r'FUNC_MV\.(\w+)', s):
                if m2.group(1) not in FUNC_MV_DATA: _bad.append({'axis': a['id'], 'why': 'FUNC_MV 无此类别', 'src': m2.group(0)})
            for m2 in re.finditer(r'TEMPLATES\[([^\]]+)\]', s):
                if m2.group(1) not in _tn: _bad.append({'axis': a['id'], 'why': 'TEMPLATES 无此模板', 'src': m2.group(0)})
            for m2 in re.finditer(r'MOVES_NOTES\[(\d+)\]', s):
                if m2.group(1) not in MOVES_NOTES: _bad.append({'axis': a['id'], 'why': 'MOVES_NOTES 无此 id', 'src': m2.group(0)})
            for m2 in re.finditer(r'gameData\.moves\[(\d+)\]', s):
                if m2.group(1) not in _GD_MV: _bad.append({'axis': a['id'], 'why': 'gameData.moves 无此 id', 'src': m2.group(0)})
    return {
        'axes': len(_axes), 'ids': _ids,
        'axis_id_unique': len(set(_ids)) == len(_ids), 'axis_id_dups': sorted({x for x in _ids if _ids.count(x) > 1}),
        'setter_tag_conflicts': _conf, 'setter_tags_disjoint': len(_conf) == 0,
        'beneficiary_tags_shared': {k: v for k, v in _shared.items() if len(v) > 1},
        '依据来源无法解析': _bad, '依据可解析': len(_bad) == 0,
        '名称无法解析': _unres, '名称全可解析': len(_unres) == 0,
        '免疫档派生': _imm_audit,
        'tacticRole_标注条数': sum(1 for v in TACTIC_ROLE.values() if v),
        'synergyRole_标注条数': sum(1 for v in SYNERGY_ROLE.values() if v),
    }


# 15e. 受益者「免伤档」结构化派生（零编造）= 所列受益特性 ABI_TAGS.im 并集 ∪ 场地/类型规则豁免（_IMM_RULE，token 自检）
#      + 轴内标签名可解析自检（特性名 / 招式名必须命中真实表；防「毒补」类口误）
_IMM_RULE = {
    'toxic': {'毒': 'GLOSSARY.terrain_toxic（毒 / 钢属性豁免剧毒场地回合末伤害）'},
    'hazard': {'毒': 'GLOSSARY.hazard_toxicspikes（毒属性不可中毒菱）'},
    'stall': {'毒': 'GLOSSARY.status_toxic（毒属性不会陷入中毒 / 剧毒）'},
}
_AB_BY = {}
for _r in abilities:
    _AB_BY.setdefault(_r[2], _r[0])
for _zh, _ids in (ABI_ALIAS or {}).items():
    for _i in (_ids if isinstance(_ids, list) else [_ids]):
        _AB_BY.setdefault(_zh, str(_i))
_MV_BY = {}
for _r in moves.values():
    _MV_BY.setdefault(_r[1], _r[0])
_ABN = {_r[0]: _r[2] for _r in abilities}
_unres, _imm_audit = [], {}
for _a in AXES:
    _bids = []
    for _t in _a['轴手判定']['ability_tags'] + _a['受益者判定']['ability_tags']:
        if not _AB_BY.get(_t):
            _unres.append({'axis': _a['id'], 'kind': '特性名', 'name': _t})
        elif _t in _a['受益者判定']['ability_tags']:
            _bids.append(_AB_BY[_t])
    for _t in _a['轴手判定']['moves'] + _a['受益者判定']['moves']:
        if not _MV_BY.get(_t):
            _unres.append({'axis': _a['id'], 'kind': '招式名', 'name': _t})
    _by_ab = {}
    for _i in _bids:
        for _x in (ABI_TAGS.get(_i) or {}).get('im') or []:
            _by_ab.setdefault(_x, []).append('%s(%s)' % (_ABN.get(_i, '?'), _i))
    _rule = dict(_IMM_RULE.get(_a['id']) or {})
    _all = [t for t in TYPE_ORDER if t in _by_ab or t in _rule]
    _a['受益者判定']['immune_types'] = _all
    _imm_audit[_a['id']] = {'派生 immune_types': _all, '特性 im 来源': _by_ab, '规则豁免来源': _rule}


_AXLIB = BASE + r'\nn_data\axis_lib.json'
_AXCHK = BASE + r'\nn_data\axis_lib_check.json'
open(_AXLIB, 'w', encoding='utf-8').write(json.dumps(AXES, ensure_ascii=False, indent=1))
_AXC = _axis_check(AXES)
open(_AXCHK, 'w', encoding='utf-8').write(json.dumps(_AXC, ensure_ascii=False, indent=1))
print('axis_lib: %d 轴 | id 唯一 %s | 轴手标签互斥 %s | 依据可解析 %s | 名称全可解析 %s | 受益者共享标签 %d 组' %
      (_AXC['axes'], _AXC['axis_id_unique'], _AXC['setter_tags_disjoint'], _AXC['依据可解析'],
       _AXC['名称全可解析'], len(_AXC['beneficiary_tags_shared'])))
if not (_AXC['axis_id_unique'] and _AXC['setter_tags_disjoint'] and _AXC['依据可解析'] and _AXC['名称全可解析']):
    print('!! 轴库自检未通过：', json.dumps(_AXC, ensure_ascii=False)[:1500])
assert 12 <= len(AXES) <= 15, ('轴数越界', len(AXES))
assert len({a['id'] for a in AXES}) == len(AXES), '轴 id 重复'
assert _AXC['名称全可解析'], ('轴库标签名无法解析', _AXC['名称无法解析'])
assert [a['id'] for a in AXES] and all(k in AXES[0] for k in ('轴手判定', '受益者判定', '联动说明', '弱点体系', '依据'))


# 15f. v4.10 机制知识库（mechLib）——A 线内容产物在构建期读取并嵌入 ERDATA 顶层键
#   契约（引擎层 C 消费，字段名冻结；规格 docs\战斗分析\_v410_机制知识库_规格_20261009.md §2）：
#     ERDATA.mechLib = {'meta': {version,count,updated,schema}, 'mechs': [ … ]}
#     每条 mech = {id, zh, en, kind, match, cat, rewrite, params, premise, impact, combos[], basis, src}
#     combos[] 每条 = {with:{kind,ids[]}, cond:{…§4 DSL…}, effect, narr, src, note?}
#   纪律（规格 §2/§3/§4/§5 铁律；任一项不过 → 抛错中止构建，禁静默放行）：
#     ① meta.count == 条目数；② id 全库唯一；③ rewrite ∈ 覆盖词汇表（§3，26 项）；
#     ④ match 至少一个非空键，且 id 按**各自集合**核对存在（moves/abilities/items/species 四者 ID 空间独立）；
#     ⑤ 每条 combo 必带 with/cond/narr/src；with.kind 枚举内、with.ids 可在对应集合解析；
#     ⑥ cond 键 ∈ DSL 白名单（§4），cond 内 id 引用与枚举值合法；
#     ⑦ 魔术师(Magician id=170) 禁入任何 combo；⑧「变身者+气势披带」叙事须为「保命」口径（非提速）。
#   注：内容产物 nn_data\mech_lib_v410.json 为**只读输入**，本函数不写任何 nn_data 文件（参照 axis_lib 先例的
#       「读取 → 校验 → 嵌入 → 汇总打印」，但校验结果只打印、不落盘）。
_MECH_PATH = BASE + r'\nn_data\mech_lib_v410.json'
_MECH_REWRITE_VOCAB = frozenset((
    'imposter_anchor', 'foul_play_atk', 'body_press_def', 'gyro_ball_speed', 'hp_cond_power',
    'avalanche_after_hit', 'acrobatics_item', 'counter_metal_burst', 'prankster_priority',
    'magic_guard_survival', 'illusion_disguise', 'magnet_pull_trap', 'unburden_item',
    'gem_consumable', 'terrain_seed', 'facade_status', 'endeavor_lowhp', 'endure_reversal',
    'multiscale_sash', 'regenerator_pivot', 'no_guard_hit', 'unaware_ignore', 'mold_breaker_ignore',
    'serene_grace_flinch', 'toxic_heal_item', 'contact_status',
))
_MECH_CATS = frozenset(('eval_rewrite', 'power_cond', 'item_link', 'priority', 'weather_terrain', 'teammate'))
_MECH_MATCH_KEYS = ('moves', 'abilities', 'items', 'species')          # match 的四个键（复数）
_MECH_ENTITY_KINDS = ('move', 'ability', 'item', 'species')            # kind / with.kind（单数）
_MECH_KIND2MATCH = {'move': 'moves', 'ability': 'abilities', 'item': 'items', 'species': 'species'}
_MECH_COND_KEYS = frozenset((
    'noItem', 'consumableItem', 'item', 'ability', 'move', 'terrain', 'weather',
    'status', 'lowHp', 'teammateAbility', 'opponentType'))
_MECH_COND_IDSPACE = {'item': 'items', 'ability': 'abilities', 'move': 'moves', 'teammateAbility': 'abilities'}
_MECH_COND_BOOL = ('noItem', 'consumableItem', 'lowHp')                # 条件值为 true
_MECH_TERRAINS = frozenset(('electric', 'psychic', 'misty', 'grassy'))
_MECH_WEATHERS = frozenset(('sun', 'rain', 'sand', 'snow'))
_MECH_STATUSES = frozenset(('burn', 'poison', 'paralysis', 'sleep'))
_MECH_OPP_TYPES = frozenset((
    'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground',
    'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'))
_MECH_FORBIDDEN_ABI = ('170',)                                        # 魔术师 Magician：规格 §1/§5 禁入任何 combo
_MECH_IDSPACE = {                                                      # 四个独立 ID 空间（字符串化核对）
    'moves': set(moves.keys()),
    'abilities': {r[0] for r in abilities},
    'items': {r[0] for r in items},
    'species': set(species.keys()),
}


def build_mech_lib():
    """读取 nn_data\mech_lib_v410.json → 校验（§2 schema + §3 词汇 + §4 DSL + 铁律）→ 返回 mechLib 对象。
    任一项校验不过即 raise（禁静默放行）。只读输入，不写 nn_data。"""
    if not os.path.exists(_MECH_PATH):
        raise AssertionError('mechLib 内容产物缺失：%s' % _MECH_PATH)
    raw = json.load(open(_MECH_PATH, encoding='utf-8'))

    def _bad(msg, ctx=None):
        raise AssertionError('mechLib 校验失败：%s%s' %
                             (msg, (' | ' + json.dumps(ctx, ensure_ascii=False)) if ctx else ''))

    def _want_ids(ids, space, ctx, label):
        if not isinstance(ids, list) or not ids:
            _bad('%s 非非空列表' % label, ctx)
        for _i in ids:
            if str(_i) not in _MECH_IDSPACE[space]:
                _bad('%s 在 %s 空间不存在：%r' % (label, space, _i), ctx)

    lib = raw.get('mechLib')
    if not isinstance(lib, dict):
        _bad('mech_lib_v410.json 顶层缺 mechLib 对象')
    meta = lib.get('meta') or {}
    mechs = lib.get('mechs')
    if not isinstance(mechs, list) or not mechs:
        _bad('mechs 非非空列表')
    if meta.get('count') != len(mechs):                                 # ① 条目数 == meta.count
        _bad('meta.count(%r) != 实际条目数(%d)' % (meta.get('count'), len(mechs)))
    _ids = [m.get('id') for m in mechs]
    if any(not _i for _i in _ids) or len(set(_ids)) != len(_ids):       # ② id 全库唯一
        _bad('id 缺失或重复', sorted({x for x in _ids if _ids.count(x) > 1}))

    n_combo = 0
    for m in mechs:
        _mid = m['id']
        for _k in ('id', 'zh', 'en', 'kind', 'match', 'cat', 'rewrite', 'premise', 'impact', 'combos', 'basis', 'src'):
            if _k not in m:
                _bad('缺字段 %s' % _k, {'id': _mid})
        if 'params' in m and not isinstance(m['params'], dict):
            _bad('params 非对象', {'id': _mid})
        for _k in ('zh', 'en', 'premise'):
            if not (isinstance(m[_k], str) and m[_k].strip()):
                _bad('%s 为空' % _k, {'id': _mid})
        if not isinstance(m['impact'], dict) or not m['impact']:
            _bad('impact 非对象或空', {'id': _mid})
        if m['kind'] not in _MECH_ENTITY_KINDS:
            _bad('kind 非法：%r' % m['kind'], {'id': _mid})
        if m['cat'] not in _MECH_CATS:
            _bad('cat 非法（六分类之外）：%r' % m['cat'], {'id': _mid})
        if m['rewrite'] not in _MECH_REWRITE_VOCAB:                     # ③ rewrite ∈ §3 词汇表
            _bad('rewrite 不在 §3 词汇表：%r' % m['rewrite'], {'id': _mid})
        _match = m['match']
        if not isinstance(_match, dict) or not _match:
            _bad('match 非对象或空', {'id': _mid})
        for _k in _match:
            if _k not in _MECH_MATCH_KEYS:
                _bad('match 非法键：%r' % _k, {'id': _mid})
        if not any(_match.get(_k) for _k in _MECH_MATCH_KEYS):
            _bad('match 至少一个非空键（moves/abilities/items/species）', {'id': _mid})
        for _k in _MECH_MATCH_KEYS:                                     # ④ match id 按各自集合核对
            if _match.get(_k):
                _want_ids(_match[_k], _k, {'id': _mid}, 'match.%s' % _k)
        if not (isinstance(m['basis'], str) and m['basis'].strip()):
            _bad('basis 为空', {'id': _mid})
        if not (isinstance(m['src'], str) and m['src'].startswith('http')):
            _bad('src 非法（须为 URL）', {'id': _mid})
        if not isinstance(m['combos'], list) or not m['combos']:
            _bad('combos 非非空列表', {'id': _mid})
        for _ci, _c in enumerate(m['combos']):                          # ⑤ 每条 combo 必带 with/cond/narr/src
            _ctx = {'id': _mid, 'combo': _ci}
            for _k in ('with', 'cond', 'narr', 'src'):
                if _k not in _c:
                    _bad('combo 缺字段 %s' % _k, _ctx)
            _w = _c['with']
            if not isinstance(_w, dict) or _w.get('kind') not in _MECH_ENTITY_KINDS:
                _bad('with.kind 非法：%r' % (_w.get('kind') if isinstance(_w, dict) else _w), _ctx)
            _want_ids(_w.get('ids'), _MECH_KIND2MATCH[_w['kind']], _ctx, 'with.ids')
            if _w['kind'] == 'ability':                                 # ⑦ 魔术师(170) 禁入任何 combo
                for _i in _w['ids']:
                    if str(_i) in _MECH_FORBIDDEN_ABI:
                        _bad('禁入组合：魔术师(%s) 出现在 with.ids' % _i, _ctx)
            _cond = _c['cond']
            if not isinstance(_cond, dict) or not _cond:
                _bad('cond 非对象或空', _ctx)
            for _ck, _cv in _cond.items():                              # ⑥ cond DSL 白名单 + 值合法
                if _ck not in _MECH_COND_KEYS:
                    _bad('cond 非法键：%r' % _ck, _ctx)
                if _ck in _MECH_COND_IDSPACE:
                    _want_ids(_cv, _MECH_COND_IDSPACE[_ck], _ctx, 'cond.%s' % _ck)
                elif _ck in _MECH_COND_BOOL:
                    if _cv is not True:
                        _bad('cond.%s 应为 true，实际 %r' % (_ck, _cv), _ctx)
                elif _ck == 'terrain' and _cv not in _MECH_TERRAINS:
                    _bad('cond.terrain 非法：%r' % _cv, _ctx)
                elif _ck == 'weather' and _cv not in _MECH_WEATHERS:
                    _bad('cond.weather 非法：%r' % _cv, _ctx)
                elif _ck == 'status' and _cv not in _MECH_STATUSES:
                    _bad('cond.status 非法：%r' % _cv, _ctx)
                elif _ck == 'opponentType' and (not isinstance(_cv, list) or not _cv or any(
                        (not isinstance(x, str)) or (x.lower() not in _MECH_OPP_TYPES) for x in _cv)):
                    _bad('cond.opponentType 非法：%r' % _cv, _ctx)
            if not (isinstance(_c['narr'], str) and _c['narr'].strip()):
                _bad('narr 为空', _ctx)
            if not (isinstance(_c['src'], str) and _c['src'].startswith('http')):
                _bad('combo.src 非法（须为 URL）', _ctx)
            n_combo += 1
        if m['rewrite'] == 'imposter_anchor':                           # ⑧ 变身者口径铁律
            for _c in m['combos']:
                if _c['with'].get('kind') == 'item' and '287' in [str(x) for x in _c['with']['ids']]:
                    if '保命' not in ((_c.get('effect') or '') + (_c.get('narr') or '')):
                        _bad('变身者+气势披带(287) 叙事须为「保命」口径', {'id': _mid})
    print('mechLib: %d 条机制 | %d 条 combo | rewrite 词汇表 %d 项 | 校验(条目数/词汇/ID空间/组合必填/铁律) 全通过 | %s'
          % (len(mechs), n_combo, len(_MECH_REWRITE_VOCAB), _MECH_PATH))
    return lib


MECH_LIB = build_mech_lib()

data = {
    'types': types,
    'matchup': matchup,
    'moves': list(moves.values()),
    'species': list(species.values()),
    'items': items,
    'abilities': abilities,
    'abiTags': ABI_TAGS,
    'abiAlias': ABI_ALIAS,
    'templates': TEMPLATES,
    'coreNotes': CORE_NOTES,
    'movesNotes': MOVES_NOTES,
    'nonFinal': NONFINAL,
    'mvDescZh': MV_DESC_ZH,
    'abiDescZh': ABI_DESC_ZH,
    'sysSet': SYS_SET,
    'familyRoot': FAMILY_ROOT,
    'glossary': GLOSSARY,
    'matchupSp': MATCHUP_SP,
    'usagePrior': USAGE_PRIOR,
    'usageMeta': USAGE_META,
    'tacticRole': TACTIC_ROLE,
    'synergyRole': SYNERGY_ROLE,
    'mechLib': MECH_LIB,
    'sprites': load_sprites(),
}
js = 'var ERDATA = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';'
open(BASE + r'\配招工具_data.js', 'w', encoding='utf-8').write(js)
print('\ndata.js bytes:', len(js.encode('utf-8')))
print('items:', len(items), 'templates:', len(TEMPLATES))
print('新字段自检: mvDescZh', len(data['mvDescZh']), '| abiDescZh', len(data['abiDescZh']),
      '| sysSet', len(data['sysSet']), '| familyRoot', len(data['familyRoot']),
      '| glossary', len(data['glossary']),
      '| matchupSp', len(data['matchupSp']), '属性/', sum(len(v) for v in data['matchupSp'].values()), '格')
print('v4.9 自检: tacticRole', len(data['tacticRole']), '(标注', sum(1 for v in data['tacticRole'].values() if v), ')',
      '| synergyRole', len(data['synergyRole']), '(标注', sum(1 for v in data['synergyRole'].values() if v), ')',
      '| moves 行末列', len(data['moves'][0]), '| abilities 行末列', len(data['abilities'][0]),
      '| axis_lib', _AXC['axes'], '轴 →', _AXLIB)
print('v4.10 自检: mechLib', len(data['mechLib']['mechs']), '条机制 |',
      sum(len(m['combos']) for m in data['mechLib']['mechs']), '条 combo | meta.count',
      data['mechLib']['meta']['count'], '| schema', data['mechLib']['meta']['schema'])
