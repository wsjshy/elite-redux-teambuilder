# -*- coding: utf-8 -*-
"""v4.2 组队方法论 · 槽位候选空间探针（定稿，只读，不写入任何数据）
用途：量化 ER「4 特性机制（abis 池 n 选 1 ∪ inns 天性 ×3）」下设置手槽候选空间。
数据源：D:\\game\\elite-redux\\ER-source\\gameDataV2.65beta.json（只读）
锚点（英文名 ↔ id，来源：本文件顶部注释 + AGENTS.md:212 + _00_资料汇编.md:113）
  Drizzle=2（中文别名「降雨」「雨幕」，同一条）、Drought=70、Sand Stream=45、Snow Warning=117、
  Electro Surge=226、Psychic Surge=227、Misty Surge=228、Grassy Surge=229、Toxic Surge=834
  另外：Storm Cloud=989 亦「出场降雨 8 回合」，但不在引擎 SYS_SET（9 条）内 —— 备查项
"""
import json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

P = r"D:\game\elite-redux\ER-source\gameDataV2.65beta.json"
d = json.load(open(P, encoding='utf-8'))
species = d['species']

SYS = {
    '雨': 2, '晴': 70, '沙': 45, '雪': 117,
    '电场': 226, '精神场地': 227, '青草场地': 229, '薄雾场地': 228, '剧毒场地': 834,
}

def valid(s):
    st = s.get('stats', {})
    return bool(st.get('base')) and sum(st['base']) > 0

def boxes(ids):
    ids = set(ids); ab = set(); inn = set()
    for s in species:
        if not valid(s):
            continue
        st = s['stats']
        if ids & set(st.get('abis', [])): ab.add(s['name'])
        if ids & set(st.get('inns', [])): inn.add(s['name'])
    return ab, inn

total = sum(1 for s in species if valid(s))
print(f"有效物种（种族非全 0）= {total} / {len(species)}\n")
print(f"{'体系':<10}{'设置手特性id':<12}{'abis池可达':<12}{'inns天性可达':<14}{'并集':<8}{'占有效物种':<10}{'示例(并集前4)'}")
store = {}
for name, aid in SYS.items():
    ab, inn = boxes([aid])
    uni = ab | inn
    store[name] = (ab, inn, uni)
    print(f"{name:<10}{aid:<14}{len(ab):<13}{len(inn):<15}{len(uni):<9}{len(uni)/total:<11.1%}"
          f"{', '.join(sorted(uni)[:4])}")

for label, ids in (("气候4系", [2, 70, 45, 117]),
                   ("场地5系(含剧毒)", [226, 227, 229, 228, 834])):
    ab, inn = boxes(ids); uni = ab | inn
    print(f"\n[{label}] 并集={len(uni)}（{len(uni)/total:.1%}）"
          f"｜仅 abis 可战前切换={len(ab - inn)}｜含 inns 锁死={len(inn)}")

ab, inn = boxes([2, 70, 45, 117, 226, 227, 229, 228])
uni = ab | inn
print(f"\n[引擎 SYS_SET 8 条去重后] 并集可达={len(uni)}（{len(uni)/total:.1%}）"
      f"｜仅 abis={len(ab-inn)}｜含 inns={len(inn)}")

# 抽查一个已知样本：庞岩怪（wxConflict 案例，天性=太阳之力+扬沙）
for s in species:
    if s['name'] in ('Gigalith',) and valid(s):
        st = s['stats']
        print(f"\n抽查 {s['name']}: abis={st['abis']} inns={st['inns']}（扬沙45 在 inns? {45 in st['inns']}）")
        break
