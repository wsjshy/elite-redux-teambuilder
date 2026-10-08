# -*- coding: utf-8 -*-
"""v4.2 槽位探针（第 3 版）：补齐「电场设置手」与「雨幕」的英文名锚点。只读。"""
import json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
P = r"D:\game\elite-redux\ER-source\gameDataV2.65beta.json"
d = json.load(open(P, encoding='utf-8'))
abilities = d['abilities']

print("== 名字/描述含 Electric 的特性 ==")
for a in abilities:
    nm, ds = a.get('name', ''), a.get('desc', '')
    if 'Electric' in nm or 'Electric' in ds and 'Terrain' in ds:
        print(f"  id={a['id']:<5} {nm:<26} :: {ds[:80]}")

print("\n== 描述含 'terrain' 的特性（全部）==")
for a in abilities:
    ds = a.get('desc', '')
    if 'terrain' in ds.lower() and ('Summon' in ds or 'sets' in ds or 'on entry' in ds):
        print(f"  id={a['id']:<5} {a.get('name',''):<28} :: {ds[:90]}")

print("\n== 描述含 'rain on entry'/'Summons rain' 的特性 ==")
for a in abilities:
    ds = a.get('desc', '')
    if 'rain' in ds.lower() and ('summon' in ds.lower() or 'on entry' in ds.lower()):
        print(f"  id={a['id']:<5} {a.get('name',''):<28} :: {ds[:90]}")

print("\n== 名字含 Surge 的特性 ==")
for a in abilities:
    if 'Surge' in a.get('name', ''):
        print(f"  id={a['id']:<5} {a.get('name',''):<28} :: {a.get('desc','')[:80]}")
