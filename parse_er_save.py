#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Pokémon Elite Redux v2.65 存档解析器 v3.1 (逻辑段驱动)
======================================================
【基版】绿宝石 BPEE (ROM头确认), mGBA .sav 原始闪存转储(131088B=0x20010)

【存档结构】(三轮探测确认)
  - 存档由 0x1000 物理段构成, 每段页脚 @+0xFF4: 逻辑段ID(u32) | @+0xFF8: magic 25 20 01 08
    | @+0xFFC: 计数器. 物理段与逻辑段存在轮换: 逻辑ID = (物理段号 + K) mod 20, K 每次保存可能变化
  - 已确认固定逻辑布局:
      逻辑段 2 +0x23C : 队伍区 (6 × 76B)
      逻辑段 8 +0x08  : 箱子1-7 网格起点 (30格/箱 × 52B, 连续排布)
      逻辑段12 +0x340 : 特殊存储区A (6条, 性质待游戏内确认)
      逻辑段14 +0xE00 : 特殊存储区B (9条, 性质待游戏内确认)
      逻辑段15 +0x424 : 箱子20-26 网格起点
      逻辑段 0        : 散落/杂项 (如 0xE00A 熔岩虫)
  - 因此解析必须: 先解码 K, 再把每条记录的物理偏移换算成逻辑段+段内偏移, 按逻辑布局分类
  - 记录跨越段边界时, 尾部会被该段页脚覆盖(表现为"固定D5 D6"区被破坏), 属正常现象

【记录结构】
  PC/箱子记录 52B:
    +0x00 OTID 80 19 47 64 | +0x04 PID(u32) | +0x06 EXP>>5(u16) | +0x08 u32(未知)
    | +0x0C 物种(u16) | +0x0E 最后学习招式(u16=id+0x5800) | +0x10 u16(非招式) | +0x12 u16(非招式)
    | +0x14..0x19 EV 6B(HP/攻/防/速/特攻/特防) | +0x1A 单字节 | +0x1B..0x21 固定 D5 D6 FF×5
    | +0x22..0x2E 加密块13B | +0x2F 单字节 | +0x30..0x33 槽属性4B
  队伍记录 76B = 52B + 24B:
    +0x34..0x37 u32 | +0x38 等级(byte) | +0x39 FF | +0x3A..0x45 6×u16(疑似HP现/满+4项能力, 未定序)
    | +0x46..0x47 2B | +0x48..0x4B u32

【用法】python parse_er_save.py [sav路径] [输出CSV] [输出JSON]
        不带参数则自动发现目录内最新 .sav 与 *图鉴*.xlsm
        特殊区箱号可用 box_override.json 人工指定: {"0x6340": {"box":"BOX12","slot":"第1格"}}
"""
import struct, sys, csv, math, json, os, glob, datetime

OTID = b'\x80\x19\x47\x64'
PC_SIZE = 52
PARTY_SIZE = 76
PARTY_COUNT = 6
BOX_CAP = 30
MOVE_BASE = 0x5800
SEC_SIZE = 0x1000
FOOTER_MAGIC = b'\x25\x20\x01\x08'

# 锚点: 物种 -> (箱号, 格号, 说明)
ANCHORS = {
    411:  (1, 1,   '护城龙'),
    469:  (4, 1,   '远古巨蜓'),
    741:  (20, 1,  '花舞鸟'),
    1513: (26, 28, '超级化石翼龙'),
    2232: (0, 0,   '超级土王(队伍首条)'),
}

def scan_records(data):
    """扫描全部 OTID 记录 -> [(偏移, 物种)] (按物理顺序)"""
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
    """
    解码物理段 -> 逻辑段 的轮换 K.
    逻辑ID = (物理段号 + K) mod 20. 用页脚[0xFF4: lid u32][0xFF8: magic] 一致求解.
    返回 (K, {物理段号: 逻辑ID}) 或 (None, {})
    """
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
        # 用第一个观测求 K, 再用多数一致校验
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
    L = round((exp / 1.25) ** (1/3))
    while int(1.25 * (L + 1) ** 3) <= exp + 31: L += 1
    while int(1.25 * L ** 3) > exp + 31: L -= 1
    return L, exp

def load_dex(path):
    import openpyxl
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    dex = {}
    for sheet in ('原始数据', '宝可梦', '图鉴'):
        try:
            ws = wb[sheet]
        except KeyError:
            continue
        for r in ws.iter_rows(values_only=True):
            if r[0] is None: continue
            try:
                iid = int(r[1]) if str(r[1]).strip().isdigit() else int(r[0])
                en = str(r[2]) if len(r) > 2 and r[2] else (str(r[1]) if len(r) > 1 and r[1] else '')
                cn = str(r[3]) if len(r) > 3 and r[3] else ''
                if iid > 0: dex[iid] = (en, cn)
            except Exception:
                pass
        if dex: break
    return dex

def load_moves(path):
    import openpyxl
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    mv = {}
    for sheet in ('招式', '技能', 'Moves'):
        try:
            ws = wb[sheet]
        except KeyError:
            continue
        for r in ws.iter_rows(values_only=True):
            if r[0] is None: continue
            try:
                mid = int(r[0])
                en = str(r[2]) if len(r) > 2 and r[2] else (str(r[1]) if len(r) > 1 and r[1] else '')
                cn = str(r[3]) if len(r) > 3 and r[3] else ''
                if mid > 0: mv[mid] = (en, cn)
            except Exception:
                pass
        if mv: break
    return mv

def find_party(recs, data):
    """找队伍区: 76B 间距的连续记录簇(等级字节+0x38 ∈[1,100] 且 +0x39==0xFF)"""
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

def logical_of(off, log_map):
    sec = off // SEC_SIZE
    lid = log_map.get(sec)
    return (lid, off % SEC_SIZE) if lid is not None else (None, off % SEC_SIZE)

def parse(data, dex, moves, out_csv, out_json, override=None):
    recs = scan_records(data)
    print(f'记录总数: {len(recs)}')

    K, log_map = decode_rotation(data)
    if K is None:
        print('[警告] 未能解码段轮换K, 退化为物理顺序索引箱号(可能不准确)')
    else:
        print(f'段轮换 K={K}: 物理段->逻辑段 已建立')

    # 队伍区
    p_start, p_end = find_party(recs, data)
    if p_start is None:
        print('[警告] 未找到队伍区(76B簇), 回退: 取记录尾部6条')
        p_start, p_end = max(0, len(recs) - 6), len(recs) - 1
    party = recs[p_start:p_end + 1]
    pc_recs = [r for r in recs if r not in set(party)]
    print(f'队伍区: idx{p_start}-{p_end} @0x{party[0][0]:X} ({len(party)}条)')

    # 逻辑分类
    def classify(off):
        lid, rel = logical_of(off, log_map)
        if lid is None:
            return ('未知', None, rel)
        if lid in (8, 9, 10):
            return ('G1', None, rel)          # 箱子1-7
        if lid == 12:
            return ('SA', '待锚A', rel)        # 特殊区A (6条)
        if lid == 14:
            return ('SB', '待锚B', rel)        # 特殊区B (9条)
        if lid in (15, 16, 17):
            return ('G2', None, rel)          # 箱子20-26
        return ('OTHER', None, rel)

    groups = {'G1': [], 'SA': [], 'SB': [], 'G2': [], 'OTHER': []}
    for off, spec in pc_recs:
        kind, tag, rel = classify(off)
        lid = (off // SEC_SIZE + K) % 20 if K is not None else None
        groups[kind].append((off, spec, tag, lid, rel))
    for g in groups.values():
        g.sort(key=lambda x: (x[3] or -1, x[4]))  # 按 (逻辑段ID, 段内偏移) 排序

    def name_of(sp):
        en, cn = dex.get(sp, ('', ''))
        return cn or en or f'#{sp}'

    def mv_name(mid):
        if mid <= 0: return '无'
        en, cn = moves.get(mid, ('', ''))
        return cn or en or f'#{mid}'

    rows = []
    anchors_ok, anchors_fail = [], []

    def add_row(src, pos, off, spec, lv, exp, ev, mv, extra=None, anchored=True):
        rows.append({
            '来源': src, '位置': pos, '宝可梦': name_of(spec), '图鉴编号': spec,
            '等级': lv, 'EXP': exp, '偏移': f'0x{off:X}',
            'EV_HP': ev[0], 'EV_攻': ev[1], 'EV_防': ev[2], 'EV_速': ev[3],
            'EV_特攻': ev[4], 'EV_特防': ev[5],
            '招式(最后学习)': mv_name(mv), '招式2': '存档未存', '招式3': '存档未存', '招式4': '存档未存',
            '额外': extra or '', '已锚定': anchored,
        })

    # 队伍
    for i, (off, spec) in enumerate(party):
        rec = data[off:off + PARTY_SIZE]
        if len(rec) < PARTY_SIZE: continue
        exp5 = struct.unpack_from('<H', rec, 0x06)[0]
        lv, exp = slow_level(exp5)
        ev = list(rec[0x14:0x1A])
        mv = struct.unpack_from('<H', rec, 0x0E)[0] - MOVE_BASE
        lvl_b = rec[0x38] if 0x39 <= len(rec) else 0
        stats = struct.unpack_from('<6H', rec, 0x3A)
        extra = f'等级字节={lvl_b} 能力6×u16={" ".join(str(s) for s in stats)} (疑似HP现/满+攻防特攻特防速, 未定序)'
        add_row('队伍', f'队伍{i+1}', off, spec, lv, exp, ev, mv, extra, True)

    # G1: 箱子1-7 (运行序号 -> 箱/格)
    g1_idx = 0
    for off, spec, tag, lid, rel in groups['G1']:
        box = g1_idx // BOX_CAP + 1
        slot = g1_idx % BOX_CAP + 1
        if box > 7:
            add_row('G1溢出', f'第{g1_idx+1}条', off, spec, *rec_fields(data, off),
                    anchored=False)
        else:
            rec_fields_res = rec_fields(data, off)
            add_row(f'BOX{box}', f'第{slot}格', off, spec, *rec_fields_res, True)
        g1_idx += 1

    # 特殊区A/B: 待锚 (支持 override 人工指定箱号)
    for off, spec, tag, lid, rel in groups['SA'] + groups['SB']:
        f = rec_fields(data, off)
        ov = (override or {}).get(f'0x{off:X}')
        if ov:
            box, slot = ov.get('box', tag), ov.get('slot', f'第{rel // 52 + 1}格')
            add_row(box, slot, off, spec, *f, anchored=True)
        else:
            add_row('特殊区(待锚)', tag, off, spec, *f, anchored=False)

    # G2: 箱子20-26
    g2_idx = 0
    for off, spec, tag, lid, rel in groups['G2']:
        f = rec_fields(data, off)
        if g2_idx < 150:
            box = 20 + g2_idx // BOX_CAP
            slot = g2_idx % BOX_CAP + 1
        elif g2_idx < 176:
            box, slot = 25, g2_idx - 150 + 1   # BOX25 槽1-26
        else:
            box, slot = 26, g2_idx - 176 + 1   # BOX26 槽1-28
        add_row(f'BOX{box}', f'第{slot}格', off, spec, *f, True)
        g2_idx += 1

    # OTHER: 散落
    for off, spec, tag, lid, rel in groups['OTHER']:
        f = rec_fields(data, off)
        add_row('散落', f'0x{off:X}', off, spec, *f, anchored=False)

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

    # 输出 CSV
    csv_cols = ['来源', '位置', '宝可梦', '图鉴编号', '等级', 'EXP', '偏移',
                'EV_HP', 'EV_攻', 'EV_防', 'EV_速', 'EV_特攻', 'EV_特防',
                '招式(最后学习)', '招式2', '招式3', '招式4', '额外']
    with open(out_csv, 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.DictWriter(f, fieldnames=csv_cols, extrasaction='ignore')
        w.writeheader()
        w.writerows(rows)

    # 输出 JSON
    special = [r for r in rows if r['来源'].startswith('特殊区')]
    summary = {
        'sav': os.path.basename(os.path.abspath(out_csv)).replace('.csv', ''),
        '总记录': len(rows), '队伍': len(party),
        '电脑区': len(rows) - len(party),
        '特殊区(待锚)': len(special),
        '图鉴词条': len(dex), '招式词条': len(moves),
        '段轮换K': K,
        '锚点验证': {'通过': [c for c, _ in anchors_ok], '失败': [f'{c}: {m}' for c, m in anchors_fail]},
    }
    json_out = {'summary': summary, 'records': rows}
    with open(out_json, 'w', encoding='utf-8') as f:
        json.dump(json_out, f, ensure_ascii=False, indent=1)

    print(f'\n完成: {len(rows)} 条 -> {out_csv}')
    print(f'      JSON -> {out_json}')
    print(f'\n摘要: 总{len(rows)} | 队伍{len(party)} | 电脑{len(rows)-len(party)} | 特殊区{len(special)}')
    print('锚点验证:')
    for c, _ in anchors_ok: print(f'  ✓ {c}')
    for c, m in anchors_fail: print(f'  ✗ {c}: {m}')
    if special:
        print(f'\n[提示] {len(special)} 条特殊区记录(逻辑段12/14, 疑似对战盒/特定存储, 箱号待游戏内确认)')
        print('       可在 box_override.json 中按偏移人工指定, 如 {"0x6340": {"box":"BOX12","slot":"第1格"}}')
    return json_out

def rec_fields(data, off):
    """提取记录公共字段: (等级, EXP, EV列表, 招式id)"""
    rec = data[off:off + PC_SIZE]
    exp5 = struct.unpack_from('<H', rec, 0x06)[0]
    lv, exp = slow_level(exp5)
    ev = list(rec[0x14:0x1A])
    mv = struct.unpack_from('<H', rec, 0x0E)[0] - MOVE_BASE
    return lv, exp, ev, mv

def auto_discover():
    """自动发现: 目录内主 .sav(排除测试档), 同目录 *图鉴*.xlsm"""
    here = os.path.dirname(os.path.abspath(__file__))
    TEST_MARK = ('_after', '_before', '_baseline', '_candy', '_stomp', 'now.')
    savs = []
    for root, _, files in os.walk(here):
        for f in files:
            if f.lower().endswith('.sav') and not any(m in f.lower() for m in TEST_MARK):
                savs.append(os.path.join(root, f))
    def key(p):
        b = os.path.basename(p).lower()
        return (0 if b.endswith('汉化版.sav') or 'debug.sav' in b else 1, -os.path.getmtime(p))
    savs.sort(key=key)
    sav = savs[0] if savs else None
    xlsm = None
    for pat in ('*图鉴*.xlsm', '*图鉴*.xlsx', '*.xlsm'):
        hits = glob.glob(os.path.join(here, pat))
        if hits:
            xlsm = max(hits, key=os.path.getmtime)
            break
    return sav, xlsm

def load_override(path):
    if path and os.path.exists(path):
        try:
            return json.load(open(path, encoding='utf-8'))
        except Exception as e:
            print(f'[警告] box_override.json 读取失败: {e}')
    return {}

if __name__ == '__main__':
    here = os.path.dirname(os.path.abspath(__file__))
    sav_def, xlsm_def = auto_discover()
    sav = sys.argv[1] if len(sys.argv) > 1 else sav_def
    out_csv = sys.argv[2] if len(sys.argv) > 2 else os.path.join(here, f'存档解析_{datetime.date.today():%Y%m%d}.csv')
    out_json = sys.argv[3] if len(sys.argv) > 3 else out_csv.replace('.csv', '.json')

    cand = []
    for d in (os.path.dirname(sav) if sav else here, here):
        for f in glob.glob(os.path.join(d, '*图鉴*.*')) + glob.glob(os.path.join(d, '*.xlsm')):
            if f.lower().endswith(('.xlsm', '.xlsx')) and '图鉴' in os.path.basename(f):
                cand.append(f)
    xlsm = xlsm_def if not cand else max(cand, key=os.path.getmtime)

    if not sav or not os.path.exists(sav):
        print('未找到 .sav 文件, 请指定: python parse_er_save.py <sav路径>')
        sys.exit(1)
    if not xlsm or not os.path.exists(xlsm):
        print('未找到 图鉴 xlsm, 请指定图鉴路径(或置于脚本同目录)')
        sys.exit(1)

    print(f'sav : {sav}')
    print(f'图鉴: {xlsm}')
    dex = load_dex(xlsm)
    moves = load_moves(xlsm)
    print(f'图鉴 {len(dex)} 条, 招式 {len(moves)} 条')

    override = load_override(os.path.join(here, 'box_override.json'))
    if override:
        print(f'应用人工箱号修正: {len(override)} 条')

    parse(open(sav, 'rb').read(), dex, moves, out_csv, out_json, override)
