#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成 ER 配队配招数据三件套：
1. 招式表_可学总表.csv   — 每行 = 宝可梦×招式×获得方式（核心产物）
2. 招式表_招式数值.csv   — 每行一个招式（1032 条，含中文/属性/分类/威力/命中/PP/先制/描述）
3. 招式表_宝可梦基础.csv — 每行一个宝可梦（1907 条，种族/属性/特性）
数据源：gameDataV2.65beta.json（NextDex 官方）+ ER2.65beta版图鉴v0.3.xlsm（中文名）
"""
import json, csv, os, sys

BASE = r'D:\game\elite-redux'
GD = os.path.join(BASE, 'ER-source', 'gameDataV2.65beta.json')
XLSM = os.path.join(BASE, 'ER2.65简汉化', 'ER2.65beta版图鉴v0.3.xlsm')

gd = json.load(open(GD, encoding='utf-8'))
sp_map = {s['id']: s for s in gd['species']}
mv_map = {m['id']: m for m in gd['moves']}
ab_map = {a['id']: a for a in gd['abilities']}
it_map = {i['id']: i for i in gd['items']}

TYPE_ZH = ['一般', '格斗', '火', '冰', '电', '虫', '飞行', '钢', '草', '地面',
           '毒', '恶', '水', '超能', '岩石', '龙', '幽灵', '妖精', '神秘', '无', '星晶']
SPLIT_ZH = {0: '物理', 1: '特殊', 2: '变化', 3: '特殊(取最高攻)',
            4: '特殊(取防御)5: 待定', 5: '特殊(取最高伤害)', 6: '特殊(取特防)'}

# xlsm 中文名
import openpyxl
wb = openpyxl.load_workbook(XLSM, read_only=True, data_only=True)
dex_zh, abi_zh, mov_zh = {}, {}, {}
for r in wb['原始数据'].iter_rows(values_only=True):
    if r[1] is None:
        continue
    try:
        iid = int(r[1])
    except Exception:
        continue
    dex_zh[iid] = (str(r[2]) if r[2] else '', str(r[3]) if r[3] else '')
for r in wb['特性'].iter_rows(values_only=True):
    if r[0] is None:
        continue
    try:
        iid = int(r[0])
    except Exception:
        continue
    abi_zh[iid] = (str(r[2]) if r[2] else '', str(r[3]) if r[3] else '')
for r in wb['招式'].iter_rows(values_only=True):
    if r[0] is None:
        continue
    try:
        iid = int(r[0])
    except Exception:
        continue
    mov_zh[iid] = (str(r[2]) if r[2] else '', str(r[3]) if r[3] else '')
wb.close()

def sp_zh(sid):
    en, zh = dex_zh.get(sid, ('', ''))
    return zh or en or f'#{sid}'

def mv_zh(mid):
    en, zh = mov_zh.get(mid, ('', ''))
    return zh or en or f'#{mid}'

def ab_zh(aid):
    en, zh = abi_zh.get(aid, ('', ''))
    return zh or en or f'#{aid}'

def mv_info(mid):
    m = mv_map.get(mid)
    if not m:
        return {'id': mid, 'zh': mv_zh(mid), 'en': f'#{mid}', 'type': '', 'split': '',
                'pwr': '', 'acc': '', 'pp': '', 'prio': '', 'desc': ''}
    t = m.get('types') or [19]
    return {'id': mid, 'zh': mv_zh(mid), 'en': m.get('name', ''),
            'type': TYPE_ZH[t[0]] if 0 <= t[0] < len(TYPE_ZH) else '?',
            'split': SPLIT_ZH.get(m.get('split', -1), '?'),
            'pwr': m.get('pwr', ''), 'acc': m.get('acc', ''), 'pp': m.get('pp', ''),
            'prio': m.get('prio', ''), 'desc': m.get('desc', '')}

def get_move_ids(lst):
    """兼容 [id] 与 [{'id':..}] 两种结构"""
    out = []
    for x in lst or []:
        if isinstance(x, dict):
            out.append((x.get('id'), x.get('lv')))
        else:
            out.append((x, None))
    return out

# ============ 1. 可学总表 ============
rows = []
n_up = n_tut = n_egg = n_tm = 0
for sid in sorted(sp_map):
    if sid < 0:
        continue
    s = sp_map[sid]
    st = s.get('stats', {})
    base = st.get('base', [0]*6)
    ts = st.get('types', [19, 19])
    abis = st.get('abis', [])
    inns = st.get('inns', [])
    # 升级
    for mid, lv in get_move_ids(s.get('levelUpMoves')):
        info = mv_info(mid)
        rows.append([sid, sp_zh(sid), s.get('name', ''), TYPE_ZH[ts[0]] if ts and ts[0] < len(TYPE_ZH) else '',
                     TYPE_ZH[ts[1]] if len(ts) > 1 and ts[1] < len(TYPE_ZH) else '',
                     base[0], base[1], base[2], base[3], base[4], base[5],
                     ' / '.join(ab_zh(a) for a in abis[:3]), ' / '.join(ab_zh(a) for a in inns[:3]),
                     info['id'], info['zh'], info['en'], info['type'], info['split'],
                     info['pwr'], info['acc'], info['pp'], info['prio'],
                     '升级', lv if lv is not None else '', info['desc']])
        n_up += 1
    for mid, _ in get_move_ids(s.get('tutor')):
        info = mv_info(mid)
        rows.append([sid, sp_zh(sid), s.get('name', ''), TYPE_ZH[ts[0]] if ts and ts[0] < len(TYPE_ZH) else '',
                     TYPE_ZH[ts[1]] if len(ts) > 1 and ts[1] < len(TYPE_ZH) else '',
                     base[0], base[1], base[2], base[3], base[4], base[5],
                     ' / '.join(ab_zh(a) for a in abis[:3]), ' / '.join(ab_zh(a) for a in inns[:3]),
                     info['id'], info['zh'], info['en'], info['type'], info['split'],
                     info['pwr'], info['acc'], info['pp'], info['prio'],
                     '教学', '', info['desc']])
        n_tut += 1
    for mid, _ in get_move_ids(s.get('eggMoves')):
        info = mv_info(mid)
        rows.append([sid, sp_zh(sid), s.get('name', ''), TYPE_ZH[ts[0]] if ts and ts[0] < len(TYPE_ZH) else '',
                     TYPE_ZH[ts[1]] if len(ts) > 1 and ts[1] < len(TYPE_ZH) else '',
                     base[0], base[1], base[2], base[3], base[4], base[5],
                     ' / '.join(ab_zh(a) for a in abis[:3]), ' / '.join(ab_zh(a) for a in inns[:3]),
                     info['id'], info['zh'], info['en'], info['type'], info['split'],
                     info['pwr'], info['acc'], info['pp'], info['prio'],
                     '蛋', '', info['desc']])
        n_egg += 1
    for mid, _ in get_move_ids(s.get('TMHMMoves')):
        info = mv_info(mid)
        rows.append([sid, sp_zh(sid), s.get('name', ''), TYPE_ZH[ts[0]] if ts and ts[0] < len(TYPE_ZH) else '',
                     TYPE_ZH[ts[1]] if len(ts) > 1 and ts[1] < len(TYPE_ZH) else '',
                     base[0], base[1], base[2], base[3], base[4], base[5],
                     ' / '.join(ab_zh(a) for a in abis[:3]), ' / '.join(ab_zh(a) for a in inns[:3]),
                     info['id'], info['zh'], info['en'], info['type'], info['split'],
                     info['pwr'], info['acc'], info['pp'], info['prio'],
                     'TM/HM', '', info['desc']])
        n_tm += 1

HDR = ['宝可梦编号', '宝可梦中文', '宝可梦英文', '属性1', '属性2',
       '种族HP', '种族攻击', '种族防御', '种族特攻', '种族特防', '种族速度',
       '特性1-3', '天性1-3',
       '招式编号', '招式中文', '招式英文', '招式属性', '分类',
       '威力', '命中', 'PP', '先制', '获得方式', '等级', '招式描述']
out1 = os.path.join(BASE, '招式表_可学总表.csv')
with open(out1, 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.writer(f)
    w.writerow(HDR)
    w.writerows(rows)
print(f'可学总表: {len(rows)} 行 (升级{n_up}/教学{n_tut}/蛋{n_egg}/TMHM{n_tm}) -> {out1}')

# ============ 2. 招式数值表 ============
rows2 = []
for mid in sorted(mv_map):
    m = mv_map[mid]
    t = m.get('types') or [19]
    rows2.append([m['id'], mv_zh(m['id']), m.get('name', ''),
                  TYPE_ZH[t[0]] if 0 <= t[0] < len(TYPE_ZH) else '?',
                  SPLIT_ZH.get(m.get('split', -1), '?'),
                  m.get('pwr', ''), m.get('acc', ''), m.get('pp', ''),
                  m.get('prio', ''), m.get('chance', ''), m.get('desc', ''), m.get('lDesc', '')])
HDR2 = ['招式编号', '招式中文', '招式英文', '属性', '分类', '威力', '命中', 'PP', '先制', '附加几率', '描述', '详细描述']
out2 = os.path.join(BASE, '招式表_招式数值.csv')
with open(out2, 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.writer(f)
    w.writerow(HDR2)
    w.writerows(rows2)
print(f'招式数值: {len(rows2)} 行 -> {out2}')

# ============ 3. 宝可梦基础表 ============
rows3 = []
for sid in sorted(sp_map):
    if sid < 0:
        continue
    s = sp_map[sid]
    st = s.get('stats', {})
    base = st.get('base', [0]*6)
    ts = st.get('types', [19, 19])
    abis = st.get('abis', [])
    inns = st.get('inns', [])
    rows3.append([sid, sp_zh(sid), s.get('name', ''),
                  TYPE_ZH[ts[0]] if ts and ts[0] < len(TYPE_ZH) else '',
                  TYPE_ZH[ts[1]] if len(ts) > 1 and ts[1] < len(TYPE_ZH) else '',
                  base[0], base[1], base[2], base[3], base[4], base[5],
                  ' / '.join(ab_zh(a) for a in abis[:3]), ' / '.join(ab_zh(a) for a in inns[:3]),
                  len(s.get('levelUpMoves') or []), len(s.get('tutor') or []),
                  len(s.get('eggMoves') or []), len(s.get('TMHMMoves') or []),
                  s.get('dex', {}).get('desc', '')])
HDR3 = ['宝可梦编号', '宝可梦中文', '宝可梦英文', '属性1', '属性2',
        '种族HP', '种族攻击', '种族防御', '种族特攻', '种族特防', '种族速度',
        '特性1-3', '天性1-3', '升级招式数', '教学招式数', '蛋招式数', 'TMHM招式数', '图鉴描述']
out3 = os.path.join(BASE, '招式表_宝可梦基础.csv')
with open(out3, 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.writer(f)
    w.writerow(HDR3)
    w.writerows(rows3)
print(f'宝可梦基础: {len(rows3)} 行 -> {out3}')

# 统计输出
sp_counts = {}
for sid, *_ in rows:
    sp_counts[sid] = sp_counts.get(sid, 0) + 1
print(f'\n覆盖宝可梦: {len(sp_counts)} 只 | 平均每只可学 {len(rows)/max(1,len(sp_counts)):.1f} 招')
print('招式池最丰富的 5 只:')
for sid, n in sorted(sp_counts.items(), key=lambda x: -x[1])[:5]:
    print(f'  {sp_zh(sid)} ({sid}): {n} 招')
