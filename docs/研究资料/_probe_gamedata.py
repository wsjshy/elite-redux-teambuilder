# -*- coding: utf-8 -*-
"""探针：探查 gameDataV2.65beta.json 的物种结构与精灵图映射可行性"""
import json, os, re, sys

BASE = r'D:\game\elite-redux'
gd_path = os.path.join(BASE, 'ER-source', 'gameDataV2.65beta.json')
gd = json.load(open(gd_path, encoding='utf-8'))
print('gameData 顶层键:', list(gd.keys()) if isinstance(gd, dict) else type(gd))

species = gd.get('species') if isinstance(gd, dict) else None
if species is None:
    # 尝试常见键
    for k in ('pokemon', 'mons', 'dex'):
        if k in gd:
            species = gd[k]; print('用键', k); break
print('物种数:', len(species))
s0 = species[0]
print('物种样例键:', list(s0.keys()))
print('物种样例(截断):', json.dumps(s0, ensure_ascii=False)[:600])

# 关键物种抽查
for sid in ('1', '411', '741', '1677', '2232', '1907'):
    hit = [s for s in species if str(s.get('id')) == sid]
    if hit:
        s = hit[0]
        st = s.get('stats', {})
        print(sid, '->', s.get('name'), '| types=', st.get('types') if isinstance(st, dict) else s.get('types'),
              '| abis=', st.get('abis') if isinstance(st, dict) else s.get('abis'),
              '| inns=', st.get('inns') if isinstance(st, dict) else s.get('inns'),
              '| evolutions=', s.get('evolutions'))
    else:
        print(sid, '未找到')

# 精灵文件名与物种英文名匹配率粗测
sprites_dir = os.path.join(BASE, 'ER-source', 'nextdex', 'static', 'sprites')
files = set(f[:-4].upper() for f in os.listdir(sprites_dir) if f.endswith('.png') and '_BACK' not in f and '_SHINY' not in f)
def base_name(s):
    nm = (s.get('name') or '').strip()
    # 尝试去掉形态后缀（Mega/Redux/Plus/X/Y 等常见形式）
    return re.sub(r'(?i)\s*(mega|redux|plus|snow|santa|prime|delta|galar|alolan|hisuian|paldean|origin|primal|complete|10|50|power_construct|zen|darmanitan|eternamax|gmax|spiky|east|west|rainy|sunny|snowy|normal|mow|heat|frost|wash|fan|sky|speed|defense|attack|white|black|therian|incarnate|terastal|eternal|star|dusk|dawn|midday|midnight|bloodmoon|low|high|neutral|aria|pirouette|pirouette)\s*$', '', nm)
matched = 0; missing = []
for s in species:
    nm = s.get('name') or ''
    bn = base_name(s).upper().replace(' ', '_')
    if bn in files:
        matched += 1
    else:
        missing.append((s.get('id'), nm))
print('直接匹配(基础名):', matched, '/', len(species))
print('未匹配样例(前30):', missing[:30])
