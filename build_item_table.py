#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""道具表 v2：英文名→官方中文名映射（键=英文名，避免 id 冲突），修重复，输出完整表"""
import json, csv

BASE = r'D:\game\elite-redux'
GD = json.load(open(BASE + r'\ER-source\gameDataV2.65beta.json', encoding='utf-8'))
items = {i['id']: i['name'] for i in GD['items']}

# 重复 id 检查
from collections import Counter
names = Counter(items.values())
dups = {n: c for n, c in names.items() if c > 1}
print('gameData 重复 name:', dups)

# 英文名 -> 官方中文名（人工维护，宝可梦官方译名；有把握项）
ITEM_ZH_EN = {
    # 回复/药剂/增强
    'Potion': '伤药', 'Super Potion': '好伤药', 'Hyper Potion': '厉害伤药', 'Max Potion': '全满药',
    'Full Restore': '全复药', 'Antidote': '解毒药', 'Awakening': '清醒药', 'Burn Heal': '灼伤药',
    'Ice Heal': '解冻药', 'Paralyze Heal': '解麻药', 'Full Heal': '万灵药', 'Revive': '活力块',
    'Max Revive': '全满活力块', 'Rare Candy': '神奇糖果', 'PP Up': 'PP提升剂', 'PP Max': 'PP极限提升剂',
    'HP Up': 'HP增强剂', 'Protein': '攻击增强剂', 'Iron': '防御增强剂', 'Calcium': '特攻增强剂',
    'Zinc': '特防增强剂', 'Carbos': '速度增强剂',
    # 精灵球
    'Master Ball': '大师球', 'Ultra Ball': '高级球', 'Great Ball': '超级球', 'Poké Ball': '精灵球',
    'Poke Ball': '精灵球',
    # 进化石
    'Fire Stone': '火之石', 'Water Stone': '水之石', 'Thunder Stone': '雷之石', 'Leaf Stone': '叶之石',
    'Moon Stone': '月之石', 'Sun Stone': '太阳石', 'Dawn Stone': '觉醒石', 'Dusk Stone': '暗之石',
    'Shiny Stone': '光之石', 'Ice Stone': '冰之石',
    # 对战持有道具（核心）
    'Leftovers': '剩饭', 'Black Sludge': '黑色污泥', 'Rocky Helmet': '凸凸头盔',
    'Choice Scarf': '讲究围巾', 'Choice Band': '讲究头带', 'Choice Specs': '讲究眼镜',
    'Eviolite': '进化奇石', 'Life Orb': '生命宝珠', 'Focus Sash': '气势披带', 'Focus Band': '气势头带',
    'Assault Vest': '突击背心', 'Damp Rock': '潮湿岩石', 'Heat Rock': '炽热岩石', 'Icy Rock': '冰冷岩石',
    'Smooth Rock': '光滑岩石', 'Red Card': '红牌', 'Eject Button': '逃脱按钮', 'Air Balloon': '气球',
    'Mental Herb': '心灵香草', 'White Herb': '白色香草', 'Power Herb': '力量香草',
    "King's Rock": '王者之证', 'Razor Claw': '锐利之爪', 'Scope Lens': '焦点镜片', 'Wide Lens': '广角镜',
    'Zoom Lens': '对焦镜', 'Muscle Band': '力量头带', 'Wise Glasses': '博识眼镜', 'Expert Belt': '达人带',
    'Metronome': '节拍器', 'Shell Bell': '贝壳之铃', 'Big Root': '巨大根茎', 'Black Glasses': '黑色眼镜',
    'Magnet': '磁铁', 'Never-Melt Ice': '不融冰', 'Charcoal': '木炭', 'Mystic Water': '神秘水滴',
    'Miracle Seed': '奇迹种子', 'Soft Sand': '柔软沙子', 'Sharp Beak': '锐利鸟嘴', 'Poison Barb': '毒针',
    'Dragon Fang': '龙之牙', 'Silk Scarf': '丝绸围巾', 'Silver Powder': '银粉', 'Twisted Spoon': '扭曲勺子',
    'Spell Tag': '灵界之布', 'Flame Orb': '火焰宝珠', 'Toxic Orb': '剧毒宝珠', 'Light Clay': '光之黏土',
    'Grip Claw': '紧握之爪', 'Binding Band': '缠绕绷带', 'Ring Target': '靶环', 'Safety Goggles': '防尘护目镜',
    'Sticky Barb': '粘性针', 'Shed Shell': '脱壳忍者壳', 'Quick Claw': '先制之爪', 'Lax Incense': '悠闲熏香',
    'Full Incense': '满腹熏香', 'Sea Incense': '海潮熏香', 'Luck Incense': '幸运熏香', 'Odd Incense': '奇异熏香',
    'Rock Incense': '岩石熏香', 'Wave Incense': '水波熏香', 'Rose Incense': '花朵熏香',
    'Lucky Egg': '幸运蛋', 'Amulet Coin': '护身金币', 'Soothe Bell': '安抚之铃', 'Cleanse Tag': '清净熏香',
    'Smoke Ball': '烟雾球', 'Everstone': '不变之石', 'Exp Share': '学习装置', 'Quick Powder': '极速粉末',
    'King\'s Rock': '王者之证',
    # 树果（对战常用，官方译名）
    'Sitrus Berry': '文柚果', 'Oran Berry': '橙橙果', 'Cheri Berry': '樱子果', 'Chesto Berry': '零余果',
    'Pecha Berry': '桃桃果', 'Rawst Berry': '莓莓果', 'Aspear Berry': '利木果', 'Leppa Berry': '苹野果',
    'Persim Berry': '柿仔果', 'Lum Berry': '木子果', 'Figy Berry': '茄番果', 'Wiki Berry': '异奇果',
    'Mago Berry': '蔓莓果', 'Aguav Berry': '乐芭果', 'Iapapa Berry': '哈密果',
    'Liechi Berry': '枝荔果', 'Ganlon Berry': '龙晴果', 'Salac Berry': '沙鳞果', 'Petaya Berry': '龙火果',
    'Apicot Berry': '杏仔果', 'Lansat Berry': '灯浆果', 'Starf Berry': '星桃果',
    'Kee Berry': '刺耳果', 'Maranga Berry': '茸丹果', 'Custap Berry': '嘉珍果', 'Jaboca Berry': '奇秘果',
    'Rowap Berry': '神秘果', 'Enigma Berry': '谜芝果', 'Micle Berry': '释陀果',
    'Occa Berry': '防焰果', 'Passho Berry': '防水果', 'Wacan Berry': '防电果', 'Rindo Berry': '防草果',
    'Yache Berry': '防冰果', 'Chople Berry': '防斗果', 'Kebia Berry': '防毒果', 'Shuca Berry': '防地果',
    'Coba Berry': '防飞果', 'Payapa Berry': '防超果', 'Tanga Berry': '防虫果', 'Charti Berry': '防岩果',
    'Kasib Berry': '防鬼果', 'Haban Berry': '防龙果', 'Colbur Berry': '防恶果', 'Babiri Berry': '防钢果',
    'Chilan Berry': '防普果', 'Roseli Berry': '防妖果',
    # 其他
    'Ability Capsule': '特性胶囊', 'Ability Patch': '特性补丁', 'Gold Bottle Cap': '金色王冠',
    'Bottle Cap': '银色王冠', 'Mint': '薄荷', 'Nature Mint': '薄荷', 'Adamant Mint': '固执薄荷',
    'Inexplicable Disk': '不明圆盘',
    # gameData 名称变体（无空格）
    'Never-MeltIce': '不融冰', 'Exp. Share': '学习装置', 'AbilityPatch': '特性补丁',
    'GldBottleCap': '金色王冠', 'AbilityCapsule': '特性胶囊', 'BottleCap': '银色王冠',
    'Mint': '薄荷', 'AdamantMint': '固执薄荷', 'InscrutableDisk': '不明圆盘', 'Exp. Charm': '经验护符',
}

# 用英文名匹配（大小写/空格容错）
def norm(s):
    return (s or '').strip().lower().replace('é', 'e')

item_by_norm = {norm(i['name']): i['id'] for i in GD['items']}
miss_zh = [en for en in ITEM_ZH_EN if norm(en) not in item_by_norm]
print(f'中文映射未命中 {len(miss_zh)} 个: {miss_zh[:20]}')

# 读官方描述
desc_map = {}
for r in list(csv.reader(open(BASE + r'\道具表_官方描述.csv', encoding='utf-8-sig')))[1:]:
    iid = int(r[0])
    # 重复 id 取第一条
    if iid not in desc_map:
        desc_map[iid] = r[2]

final = []
for iid in sorted(items):
    name = items[iid]
    zh = ITEM_ZH_EN.get(name, '') or ITEM_ZH_EN.get(name.replace('Poké', 'Poke'), '')
    desc = desc_map.get(iid, '')
    final.append([iid, name, zh, desc])

with open(BASE + r'\道具表_完整.csv', 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.writer(f)
    w.writerow(['道具id', '英文名', '中文名(官方译名)', '官方描述'])
    w.writerows(final)

zh_cnt = sum(1 for r in final if r[2])
desc_cnt = sum(1 for r in final if r[3])
print(f'\n道具表_完整.csv: {len(final)} 行 | 中文 {zh_cnt} | 官方描述 {desc_cnt}')

# 抽查
print('\n=== 关键道具抽查（英文名匹配）===')
for nm in ('Sitrus Berry', 'Life Orb', 'Focus Sash', 'Leftovers', 'Choice Scarf', 'Rocky Helmet', 'Black Sludge', 'Damp Rock', 'Eviolite'):
    for r in final:
        if r[1] == nm:
            print(f'  {r[0]} {r[1]} | {r[2]} | {r[3][:70]}')
            break
