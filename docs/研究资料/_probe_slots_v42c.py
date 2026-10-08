# -*- coding: utf-8 -*-
"""查 405 / 367 / 5 / 159 特性名 + 庞岩怪/妙蛙花(X/Y) 双体系定位。只读。"""
import json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
d = json.load(open(r"D:\game\elite-redux\ER-source\gameDataV2.65beta.json", encoding='utf-8'))
ab = {a['id']: a['name'] for a in d['abilities']}
for i in (405, 367, 5, 159, 45, 70, 344, 47, 65):
    print(f"  id={i:<5} {ab.get(i)}")
print()
for s in d['species']:
    if s['name'] in ('Gigalith', 'Venusaur', 'Venusaur Mega', 'Venusaur Mega Y', 'Torkoal', 'Charizard Mega Y'):
        st = s.get('stats', {})
        if st.get('base') and sum(st['base']) > 0:
            print(f"{s['name']:<20} abis={[ab.get(x) for x in st['abis']]} | inns={[ab.get(x) for x in st['inns']]}")
