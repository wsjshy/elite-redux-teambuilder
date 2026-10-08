#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Pokémon Elite Redux v2.65 存档解析器 v4.1 (4招完整解码版)
=========================================================
【v4.1 相对 v4.0 的实证修正 (2026-10-06, 三档互证+10张游戏截图+2次换招实验)】
  - 4 招式槽位完整解码 (换招实验铁证):
      +0x04 低11位 = 招式1 id        (105 Recover / 887 Electro Drift ... 全命中)
      +0x08 低11位 = 招式2 id        (182 Protect / 951 Mystic Dance ... 全命中)
      +0x08 高5位  = 招式3 id mod 32 (8/8 命中: 616%32=8, 360%32=8, 56%32=24, 85%32=21, 355%32=3, 794%32=26 ...)
      +0x0A 低11位 bit4-0 = 招式3 id>>5 (8/8 命中)
      +0x0A 低11位 bit9-5 = 招式3 分组N (语义待定, 不影响id)
      → 招式3 id = ((+0x0A & 0x7FF) & 0x1F) << 5 | (+0x08 >> 11)
      +0x0E 低11位 = 招式4 (末招) id
      +0x12 低11位 = 疑似第5招式位 (6只全为合法gameData招式id: 442/482/290/186, 语义待定)
  - 道具 = +0x10..0x11 & 0x1FF (items id, 0=无; 9只真值全对: 305/312/273/298/0/79/0/285)
  - 能力 7×u16 @ +0x3A..0x47 = (当前HP, 最大HP, 攻, 防, 速, 特攻, 特防) — 特防直读, 不再公式重建
  - +0x04..0x07 = 招式1(u16低11位) + EXP>>5(u16) 复合字段 (非 PID)
  - PP ×4 = +0x30..0x33 (当前值, 队伍区; 8只截图全对)
  - 特性页 = abis[0] (主特性) + inns[0..2] (3天生), gameData id
  - 可学招式池 = 升级(含等级)/教学/蛋/TMHM 四类
  - 中文名 = xlsm 汉化图鉴 (编号列 = gameData id), 缺失回退英文

【用法】python parse_er_save_v4.py [sav路径] [输出CSV] [输出JSON]
        自动发现: 目录内主 .sav + ER-source/gameDataV2.65beta.json + *图鉴*.xlsm
"""
import struct, sys, csv, math, json, os, glob, datetime

OTID = b'\x80\x19\x47\x64'
PC_SIZE = 52
PARTY_SIZE = 76
PARTY_COUNT = 6
BOX_CAP = 30
SEC_SIZE = 0x1000
FOOTER_MAGIC = b'\x25\x20\x01\x08'
MOVE_MASK = 0x7FF          # 招式 id 低11位掩码
ITEM_MASK = 0x1FF          # 道具 id 低9位掩码
GDATA_NAME = 'gameDataV2.65beta.json'
GDATA_DIRS = ['ER-source', os.curdir]

# 锚点: 物种 -> (箱号, 格号, 说明)  0箱号=队伍
ANCHORS = {
    411:  (1, 1,   '护城龙'),
    469:  (4, 1,   '远古巨蜓'),
    741:  (20, 1,  '花舞鸟'),
    1513: (26, 28, '超级化石翼龙'),
    2232: (0, 0,   '土王Mega(队伍首条)'),
}

TYPE_ZH = ['一般', '格斗', '火', '冰', '电', '虫', '飞行', '钢', '草', '地面',
           '毒', '恶', '水', '超能', '岩石', '龙', '幽灵', '妖精', '神秘', '无', '星晶']

ITEM_ZH = {
    0: '无', 79: '文柚果', 273: '吃剩的东西', 285: '讲究围巾', 298: '湿润岩石',
    305: '黑色污泥', 312: '凸凸头盔',
}

# xlsm 未收录但游戏内确认的汉化名 (特性)
ABI_ZH_EXTRA = {834: '毒沼制造者'}

def scan_records(data):
    out = []
    s = 0
    while True:
        i = data.find(OTID, s)
        if i < 0: break
        if i + 0x0E <= len(data):
            spec = struct.unpack_from('<H', data, i + 0x0C)[0]
            if 1 <= spec <= 4000:
                out.append((i, spec))
                s = i + 0x34
                continue
        s = i + 1
    return out

def decode_rotation(data):
    obs = []
    for sec in range(0, 0x20000 // SEC_SIZE):
        base = sec * SEC_SIZE
        if base + 0xFFC + 4 > len(data): continue
        if data[base + 0xFF8:base + 0xFFC] != FOOTER_MAGIC: continue
        lid = struct.unpack_from('<I', data, base + 0xFF4)[0] & 0xFF
        if lid < 0x20:
            obs.append((sec, lid))
    K = None
    if obs:
        cand = (obs[0][1] - obs[0][0]) % 20
        votes = sum(1 for sec, lid in obs if (lid - sec) % 20 == cand)
        if votes >= max(1, len(obs) // 2):
            K = cand
    log_map = {}
    if K is not None:
        for sec in range(0, 0x20000 // SEC_SIZE):
            log_map[sec] = (sec + K) % 20
    return K, log_map

def slow_level(exp5):
    exp = exp5 * 32
    if exp <= 0: return 0, exp
    L = round((exp / 1.25) ** (1 / 3))
    while int(1.25 * (L + 1) ** 3) <= exp + 31: L += 1
    while int(1.25 * L ** 3) > exp + 31: L -= 1
    return L, exp

def find_party(recs, data):
    for i in range(len(recs) - 1):
        if recs[i + 1][0] - recs[i][0] == PARTY_SIZE:
            j = i
            while j + 1 < len(recs) and recs[j + 1][0] - recs[j][0] == PARTY_SIZE:
                j += 1
            count = j - i + 1
            if count >= PARTY_COUNT:
                ok = 0
                for k in range(i, min(j + 1, i + PARTY_COUNT)):
                    off, _ = recs[k]
                    if off + 0x39 < len(data) and 1 <= data[off + 0x38] <= 100 and data[off + 0x39] == 0xFF:
                        ok += 1
                if ok >= PARTY_COUNT - 1:
                    return i, i + PARTY_COUNT - 1
    return None, None

def stat(base, ev, lv, nature=1.0, is_hp=False):
    """宝可梦能力公式 (ER, IV=0 口径已验证; 仅盒子区基准用, 队伍区7项直读)"""
    if is_hp:
        return math.floor((2 * base + math.floor(ev / 4)) * lv / 100) + lv + 10
    return math.floor((math.floor((2 * base + math.floor(ev / 4)) * lv / 100) + 5) * nature)

def decode4_moves(v04, v08, v0A, v0E):
    """4 招式槽解码 (换招实验+10截图铁证)
    m1 = +0x04 & 0x7FF; m2 = +0x08 & 0x7FF
    m3 = ((+0x0A & 0x7FF) & 0x1F) << 5 | (+0x08 >> 11)
    m4 = +0x0E & 0x7FF
    """
    m1 = v04 & MOVE_MASK
    m2 = v08 & MOVE_MASK
    m3 = ((v0A & MOVE_MASK) & 0x1F) << 5 | (v08 >> 11)
    m4 = v0E & MOVE_MASK
    return m1, m2, m3, m4

def load_gamedata(base_dir, sav=None):
    cand_dirs = []
    for d in (base_dir, os.getcwd()):
        for sub in ('', 'ER-source'):
            cand_dirs.append(os.path.join(d, sub))
    if sav:
        cand_dirs.append(os.path.join(os.path.dirname(sav), 'ER-source'))
        cand_dirs.append(os.path.dirname(sav))
    for cand in cand_dirs:
        p = os.path.join(cand, GDATA_NAME)
        if os.path.exists(p):
            with open(p, encoding='utf-8') as f:
                gd = json.load(f)
            species = {s['id']: s for s in gd['species']}
            abilities = {a['id']: a for a in gd['abilities']}
            moves = {m['id']: m for m in gd['moves']}
            items = {i['id']: i for i in gd['items']}
            types = gd['typeT']
            print(f'[权威数据] {GDATA_NAME} ({p}): 物种{len(species)} 特性{len(abilities)} 招式{len(moves)} 道具{len(items)}')
            return species, abilities, moves, items, types
    return None, None, None, None, None

def load_zh(path):
    """从 xlsm 提取中文名: (物种id->zh, 特性id->zh, 招式id->zh)"""
    import openpyxl
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    dex_zh, abi_zh, mov_zh = {}, {}, {}
    ws = wb['原始数据']
    for r in ws.iter_rows(values_only=True):
        if r[1] is None: continue
        try:
            iid = int(r[1]); en = str(r[2]); zh = str(r[3])
        except Exception:
            continue
        if iid > 0: dex_zh[iid] = (en, zh)
    ws = wb['特性']
    for r in ws.iter_rows(values_only=True):
        if r[0] is None: continue
        try:
            iid = int(r[0])
        except Exception:
            continue
        abi_zh[iid] = (str(r[2]), str(r[3]) if r[3] else '')
    ws = wb['招式']
    for r in ws.iter_rows(values_only=True):
        if r[0] is None: continue
        try:
            iid = int(r[0])
        except Exception:
            continue
        mov_zh[iid] = (str(r[2]), str(r[3]) if r[3] else '')
    wb.close()
    return dex_zh, abi_zh, mov_zh

def nature_profile(stats, base, evs, lv):
    """从直读能力(7项含特防)反推天性修正画像 (仅队伍)"""
    if not stats:
        return ''
    labels = ['攻击', '防御', '速度', '特攻', '特防']
    prof = []
    ev_map = {'攻击': evs[1], '防御': evs[2], '速度': evs[3], '特攻': evs[4], '特防': evs[5]}
    base_map = {'攻击': base[1], '防御': base[2], '特攻': base[3], '特防': base[4], '速度': base[5]}
    direct = {'攻击': stats[2], '防御': stats[3], '速度': stats[4], '特攻': stats[5], '特防': stats[6]}
    for lab in labels:
        b = stat(base_map[lab], ev_map[lab], lv)  # 修正1.0 基准
        r = direct[lab] / b if b else 1.0
        if r >= 1.05:
            prof.append(f'{lab}=+10%')
        elif r <= 0.95:
            prof.append(f'{lab}=-10%')
        else:
            prof.append(f'{lab}=1.0')
    return ' '.join(prof)

def logical_of(off, log_map):
    sec = off // SEC_SIZE
    lid = log_map.get(sec)
    return (lid, off % SEC_SIZE) if lid is not None else (None, off % SEC_SIZE)

def parse(data, gd, zh, out_csv, out_json, override=None):
    species, abilities, moves, items, types = gd
    dex_zh, abi_zh, mov_zh = zh
    recs = scan_records(data)
    print(f'记录总数: {len(recs)}')
    K, log_map = decode_rotation(data)
    if K is None:
        print('[警告] 未解码段轮换K')
    else:
        print(f'段轮换 K={K}')

    p_start, p_end = find_party(recs, data)
    if p_start is None:
        p_start, p_end = max(0, len(recs) - 6), len(recs) - 1
    party = recs[p_start:p_end + 1]
    pc_recs = [r for r in recs if r not in set(party)]
    print(f'队伍区: idx{p_start}-{p_end} ({len(party)}条)')

    def classify(off):
        lid, rel = logical_of(off, log_map)
        if lid is None:
            return ('未知', None, rel)
        if lid in (8, 9, 10):
            return ('G1', None, rel)
        if lid == 12:
            return ('SA', '待锚A', rel)
        if lid == 14:
            return ('SB', '待锚B', rel)
        if lid in (15, 16, 17):
            return ('G2', None, rel)
        return ('OTHER', None, rel)

    groups = {'G1': [], 'SA': [], 'SB': [], 'G2': [], 'OTHER': []}
    for off, spec in pc_recs:
        kind, tag, rel = classify(off)
        lid = (off // SEC_SIZE + K) % 20 if K is not None else None
        groups[kind].append((off, spec, tag, lid, rel))
    for g in groups.values():
        g.sort(key=lambda x: (x[3] or -1, x[4]))

    def zh_of(sp, en):
        return dex_zh.get(sp, (en, ''))[1] or en
    def abi_of(aid):
        g = abilities.get(aid)
        en = g['name'] if g else f'#{aid}'
        zh = ABI_ZH_EXTRA.get(aid) or abi_zh.get(aid, (en, ''))[1] or en
        return zh
    def mv_of(mid):
        g = moves.get(mid)
        en = g['name'] if g else f'#{mid}'
        return mov_zh.get(mid, (en, ''))[1] or en
    def mv_cell(mid):
        return f'{mv_of(mid)}(id={mid})' if mid > 0 else '无'
    def item_of(iid):
        if iid <= 0: return '无'
        g = items.get(iid)
        if not g:
            return f'待确认(0x{iid:X})'
        en = g['name']
        return f'{ITEM_ZH.get(iid, en)}({en})'

    rows = []
    anchors_ok, anchors_fail = [], []

    def build_row(src, pos, off, spec, lv, exp, evs, moves4, item,
                  stats=None, pp=None, enc=None, extra12=0, otid_hex=''):
        sp = species.get(spec)
        en = sp['name'] if sp else f'#{spec}'
        base = sp['stats']['base'] if sp else [0]*6
        t1, t2 = '', ''
        if sp:
            ts = sp['stats']['types']
            t1 = TYPE_ZH[ts[0]] if ts and ts[0] < len(TYPE_ZH) else ''
            t2 = TYPE_ZH[ts[1]] if len(ts) > 1 and ts[1] < len(TYPE_ZH) else ''
        abis = sp['stats']['abis'] if sp else []
        inns = sp['stats']['inns'] if sp else []
        ev_std = [evs[0], evs[1], evs[2], evs[4], evs[5], evs[3]]  # 存档序->标准序
        m1, m2, m3, m4 = moves4
        # 能力: 队伍 7 项直读; 盒子公式基准
        if stats:
            cur, mx, atk, dfn, spe, spa, sdf = stats
            cap_note = ''
        else:
            cur = mx = stat(base[0], evs[0], lv, is_hp=True)
            atk = stat(base[1], evs[1], lv)
            dfn = stat(base[2], evs[2], lv)
            spe = stat(base[5], evs[3], lv)
            spa = stat(base[3], evs[4], lv)
            sdf = stat(base[4], evs[5], lv)
            cap_note = '(公式基准)'
        nprof = nature_profile(stats, base, evs, lv)
        lup = sp['levelUpMoves'] if sp else []
        lv_up = ' '.join(f'{mv_of(m["id"])}@{m["lv"]}' for m in sorted(lup, key=lambda m: (m['lv'], m['id']))[:8])
        n_up, n_tut = len(lup), len(sp['tutor']) if sp else 0
        n_egg, n_tm = len(sp['eggMoves']) if sp else 0, len(sp['TMHMMoves']) if sp else 0
        rows.append({
            '来源': src, '位置': pos, '偏移': f'0x{off:X}',
            '图鉴编号': spec, '宝可梦': zh_of(spec, en), '英文名': en,
            '等级': lv, 'EXP': exp,
            '属性1': t1, '属性2': t2,
            '种族HP': base[0], '种族攻击': base[1], '种族防御': base[2],
            '种族特攻': base[3], '种族特防': base[4], '种族速度': base[5],
            'EV_HP': ev_std[0], 'EV_攻击': ev_std[1], 'EV_防御': ev_std[2],
            'EV_特攻': ev_std[3], 'EV_特防': ev_std[4], 'EV_速度': ev_std[5],
            '能力_当前HP': cur, '能力_最大HP': mx, '能力_攻击': atk, '能力_防御': dfn,
            '能力_速度': spe, '能力_特攻': spa, '能力_特防': f'{sdf}{cap_note}',
            '特性1': abi_of(abis[0]) if abis else '', '特性2': abi_of(abis[1]) if len(abis) > 1 else '',
            '特性3': abi_of(abis[2]) if len(abis) > 2 else '',
            '天生特性1': abi_of(inns[0]) if inns else '', '天生特性2': abi_of(inns[1]) if len(inns) > 1 else '',
            '天生特性3': abi_of(inns[2]) if len(inns) > 2 else '',
            '道具': item_of(item),
            '招式1': mv_cell(m1), '招式2': mv_cell(m2), '招式3': mv_cell(m3), '招式4(末招)': mv_cell(m4),
            'PP1': pp[0] if pp else '', 'PP2': pp[1] if pp else '', 'PP3': pp[2] if pp else '', 'PP4': pp[3] if pp else '',
            '可学_升级': n_up, '可学_教学': n_tut, '可学_蛋': n_egg, '可学_TMHM': n_tm,
            '升级招式(前8)': lv_up,
            '天性画像': nprof,
            'OTID': otid_hex or '',
            '+0x12(疑似第5招)': mv_cell(extra12) if extra12 else '',
            '加密块': enc or '',
        })

    # 队伍
    for i, (off, spec) in enumerate(party):
        rec = data[off:off + PARTY_SIZE]
        if len(rec) < PARTY_SIZE: continue
        exp5 = struct.unpack_from('<H', rec, 0x06)[0]
        lv, exp = slow_level(exp5)
        evs = list(rec[0x14:0x1A])
        v04 = struct.unpack_from('<H', rec, 0x04)[0]
        v08 = struct.unpack_from('<H', rec, 0x08)[0]
        v0A = struct.unpack_from('<H', rec, 0x0A)[0]
        v0E = struct.unpack_from('<H', rec, 0x0E)[0]
        v12 = struct.unpack_from('<H', rec, 0x12)[0]
        moves4 = decode4_moves(v04, v08, v0A, v0E)
        item = struct.unpack_from('<H', rec, 0x10)[0] & ITEM_MASK
        pp = list(rec[0x30:0x34])
        stats = struct.unpack_from('<7H', rec, 0x3A)
        enc = rec[0x22:0x2F].hex()
        otid_hex = rec[0:4].hex()
        build_row('队伍', f'队伍{i+1}', off, spec, lv, exp, evs, moves4, item,
                  stats=stats, pp=pp, enc=enc, extra12=v12, otid_hex=otid_hex)

    # G1 箱子1-7
    g1_idx = 0
    for off, spec, tag, lid, rel in groups['G1']:
        box = g1_idx // BOX_CAP + 1
        slot = g1_idx % BOX_CAP + 1
        if box <= 7:
            f = rec_fields(data, off)
            build_row(f'BOX{box}', f'第{slot}格', off, spec, f[0], f[1], f[2], f[3], f[4], enc=f[5], extra12=f[6])
        g1_idx += 1

    # 特殊区 A/B
    for off, spec, tag, lid, rel in groups['SA'] + groups['SB']:
        f = rec_fields(data, off)
        ov = (override or {}).get(f'0x{off:X}')
        if ov:
            build_row(ov.get('box', tag), ov.get('slot', f'第{rel // 52 + 1}格'), off, spec, f[0], f[1], f[2], f[3], f[4], enc=f[5], extra12=f[6])
        else:
            build_row('特殊区(待锚)', tag, off, spec, f[0], f[1], f[2], f[3], f[4], enc=f[5], extra12=f[6])

    # G2 箱子20-26
    g2_idx = 0
    for off, spec, tag, lid, rel in groups['G2']:
        f = rec_fields(data, off)
        if g2_idx < 150:
            box = 20 + g2_idx // BOX_CAP
            slot = g2_idx % BOX_CAP + 1
        elif g2_idx < 176:
            box, slot = 25, g2_idx - 150 + 1
        else:
            box, slot = 26, g2_idx - 176 + 1
        build_row(f'BOX{box}', f'第{slot}格', off, spec, f[0], f[1], f[2], f[3], f[4], enc=f[5], extra12=f[6])
        g2_idx += 1

    # OTHER
    for off, spec, tag, lid, rel in groups['OTHER']:
        f = rec_fields(data, off)
        build_row('散落', f'0x{off:X}', off, spec, f[0], f[1], f[2], f[3], f[4], enc=f[5], extra12=f[6])

    # 锚点验证
    for spec, (bx, slot, cn) in ANCHORS.items():
        hits = [r for r in rows if r['图鉴编号'] == spec]
        if bx == 0:
            hit = hits[0] if hits else None
            if hit and hit['来源'] == '队伍':
                anchors_ok.append((cn, '队伍首条 ✓'))
            else:
                anchors_fail.append((cn, '未在队伍'))
        else:
            hit = hits[0] if hits else None
            if hit and hit['来源'] == f'BOX{bx}' and hit['位置'] == f'第{slot}格':
                anchors_ok.append((cn, f'BOX{bx}第{slot}格 ✓'))
            else:
                anchors_fail.append((cn, f'期望BOX{bx}第{slot}格, 实际={hit["来源"]} {hit["位置"] if hit else "缺失"}'))

    csv_cols = list(rows[0].keys())
    with open(out_csv, 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.DictWriter(f, fieldnames=csv_cols, extrasaction='ignore')
        w.writeheader()
        w.writerows(rows)

    special = [r for r in rows if r['来源'].startswith('特殊区')]
    summary = {
        'sav': os.path.basename(os.path.abspath(out_csv)).replace('.csv', ''),
        '解析器': 'v4.1 (4招完整解码)',
        '权威数据': GDATA_NAME,
        '总记录': len(rows), '队伍': len(party), '电脑区': len(rows) - len(party),
        '特殊区(待锚)': len(special), '段轮换K': K,
        '锚点验证': {'通过': [c for c, _ in anchors_ok], '失败': [f'{c}: {m}' for c, m in anchors_fail]},
        '说明': ('4招式槽: +0x04=招式1, +0x08=招式2(+招式3 mod32 高位), +0x0A=招式3 id>>5(低位), +0x0E=招式4(末招); '
                 '道具=+0x10&0x1FF; 能力=队伍+0x3A..0x47 7×u16直读(含特防); PP=+0x30..0x33; '
                 '特性页=特性1(abis[0])+天生特性1-3(inns); 盒子能力为公式基准。'),
    }
    with open(out_json, 'w', encoding='utf-8') as f:
        json.dump({'summary': summary, 'records': rows}, f, ensure_ascii=False, indent=1)
    json_out = {'summary': summary, 'records': rows}

    print(f'\n完成: {len(rows)} 条 -> {out_csv}')
    print(f'摘要: 总{len(rows)} | 队伍{len(party)} | 电脑{len(rows)-len(party)} | 特殊区{len(special)}')
    print('锚点验证:')
    for c, _ in anchors_ok: print(f'  ✓ {c}')
    for c, m in anchors_fail: print(f'  ✗ {c}: {m}')
    return json_out

def rec_fields(data, off):
    rec = data[off:off + PC_SIZE]
    exp5 = struct.unpack_from('<H', rec, 0x06)[0]
    lv, exp = slow_level(exp5)
    evs = list(rec[0x14:0x1A])
    v04 = struct.unpack_from('<H', rec, 0x04)[0]
    v08 = struct.unpack_from('<H', rec, 0x08)[0]
    v0A = struct.unpack_from('<H', rec, 0x0A)[0]
    v0E = struct.unpack_from('<H', rec, 0x0E)[0]
    v12 = struct.unpack_from('<H', rec, 0x12)[0]
    moves4 = decode4_moves(v04, v08, v0A, v0E)
    item = struct.unpack_from('<H', rec, 0x10)[0] & ITEM_MASK
    enc = rec[0x22:0x2F].hex()
    return lv, exp, evs, moves4, item, enc, v12

def auto_discover(here):
    TEST_MARK = ('_after', '_before', '_baseline', '_candy', '_stomp', 'now.')
    roots = []
    for d in (os.getcwd(), here, r'D:\mGBA-0.10.2-win64\ROM\elite redux'):
        if d not in roots:
            roots.append(d)
    savs = []
    for root in roots:
        for r2, _, files in os.walk(root):
            for f in files:
                if f.lower().endswith('.sav') and not any(m in f.lower() for m in TEST_MARK):
                    savs.append(os.path.join(r2, f))
    def key(p):
        b = os.path.basename(p).lower()
        return (0 if b.endswith('汉化版.sav') or 'debug.sav' in b else 1, -os.path.getmtime(p))
    savs.sort(key=key)
    sav = savs[0] if savs else None
    xlsm = None
    for root in roots:
        for pat in ('*图鉴*.xlsm', '*图鉴*.xlsx', '*.xlsm'):
            hits = glob.glob(os.path.join(root, pat))
            if hits:
                xlsm = max(hits, key=os.path.getmtime)
                break
        if xlsm:
            break
    return sav, xlsm

if __name__ == '__main__':
    here = os.path.dirname(os.path.abspath(__file__))
    sav_def, xlsm_def = auto_discover(here)
    sav = sys.argv[1] if len(sys.argv) > 1 else sav_def
    out_csv = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.getcwd(), f'存档解析v4_{datetime.date.today():%Y%m%d}.csv')
    out_json = sys.argv[3] if len(sys.argv) > 3 else out_csv.replace('.csv', '.json')

    gd = load_gamedata(here, sav)
    if not gd[0]:
        print(f'未找到 {GDATA_NAME} (应在存档目录/脚本目录的 ER-source\\ 下, 或当前工作目录)')
        sys.exit(1)

    xlsm = xlsm_def
    if not xlsm or not os.path.exists(xlsm):
        print('未找到图鉴 xlsm, 中文名将回退英文')
        zh = ({}, {}, {})
    else:
        print(f'图鉴(中文名): {xlsm}')
        zh = load_zh(xlsm)
        print(f'  物种中文 {len(zh[0])} 特性中文 {len(zh[1])} 招式中文 {len(zh[2])}')

    if not sav or not os.path.exists(sav):
        print('未找到 .sav 文件, 请指定: python parse_er_save_v4.py <sav路径>')
        sys.exit(1)
    print(f'sav: {sav}')

    override = {}
    ovp = os.path.join(here, 'box_override.json')
    if os.path.exists(ovp):
        try:
            override = json.load(open(ovp, encoding='utf-8'))
            print(f'应用人工箱号修正: {len(override)} 条')
        except Exception as e:
            print(f'[警告] box_override.json 读取失败: {e}')

    parse(open(sav, 'rb').read(), gd, zh, out_csv, out_json, override)
