#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Pokémon Elite Redux v2.65 存档解析器 v2.0
=========================================
【已破译字段】(当前档验证)
  - 电脑区 52B记录: OTID@+0x00 | PID@+0x04 | EXP>>5(u16)@+0x06 | 物种(u16)@+0x0C
    | 最后学习招式(u16=id+0x5800)@+0x0E | 非招式@+0x10/+0x12 | EV 6B@+0x14(HP/攻/防/速/特攻/特防)
    | 单字节@+0x1A | 固定d5 d6 ff*5@+0x1B-0x21 | 加密块13B@+0x22 | 单字节@+0x2F | 槽属性@+0x30-0x33
  - 等级 = round((EXP/1.25)^(1/3))  (Slow组, 锚点验证)
  - 招式: 存档只持久化 0x0E(最后学习招式); 其余3招不在存档(游戏侧恢复)
  - 队伍区 76B×6 @ 活跃槽+0xE234之后
  - BOX映射: 锚点驱动 (BOX1-3满/BOX4起点=段2索引11/BOX8-11空/BOX20起点=段10/BOX26尾=段17)
【用法】python parse_er_save.py [sav] [out.csv]
"""
import struct, sys, csv, math

OTID = b'\x80\x19\x47\x64'
SPEC_LEARN = 2232  # 超级土王(队伍首条)

def scan_records(data):
    """扫描全部 OTID 52B 记录 -> [(偏移, 物种)]"""
    out = []
    s = 0
    while True:
        i = data.find(OTID, s)
        if i < 0: break
        if i+0x0E <= len(data):
            spec = struct.unpack_from('<H', data, i+0x0C)[0]
            if 1 <= spec <= 3000:
                out.append((i, spec))
                s = i + 0x34
                continue
        s = i + 1
    return out

def slow_level(exp5):
    exp = exp5 * 32
    if exp <= 0: return 0, exp
    L = round((exp / 1.25) ** (1/3))
    while int(1.25*(L+1)**3) <= exp + 31: L += 1
    while int(1.25*L**3) > exp + 31: L -= 1
    return L, exp

def load_dex(path):
    import openpyxl
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb['原始数据']
    dex = {}
    for r in ws.iter_rows(values_only=True):
        if r[0] is None or str(r[0]).strip() == '表格编号': continue
        try:
            iid = int(r[1]); en = str(r[2]) if r[2] else ''; cn = str(r[3]) if r[3] else ''
            dex[iid] = (en, cn)
        except Exception:
            pass
    return dex

def load_moves(path):
    """图鉴'招式'sheet: id -> (英文,中文)"""
    import openpyxl
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb['招式']
    mv = {}
    for r in ws.iter_rows(values_only=True):
        if r[0] is None or str(r[0]).strip() == '编号': continue
        try:
            mid = int(r[0]); en = str(r[2]) if r[2] else ''; cn = str(r[3]) if r[3] else ''
            mv[mid] = (en, cn)
        except Exception:
            pass
    return mv

def assign_box(seg_list, idx):
    """
    锚点驱动的箱号分配.
    seg_list: 按物理顺序的段列表, 每段=[(偏移,物种),...]
    idx: 全局记录序号(按段顺序)
    锚点: 段0起=BOX1槽1; 段1索引11=BOX4槽1; 段2索引0=BOX6槽8; 段3-5=BOX7;
          段6-8=BOX12-19(推测,标BOX?); 段9起=BOX20槽1; 段16=BOX26槽1-28
    """
    # 用累计格号(30/箱) 手工锚定
    box_table = []  # (box_label, slot_label, anchored)
    # 段0: 79条 = BOX1(30)+BOX2(30)+BOX3前19
    for i in range(79):
        b = i // 30 + 1; s = i % 30 + 1
        box_table.append((f'BOX{b}', f'第{s}格', True))
    # 段1: 78条 = BOX3后11(槽20-30) + BOX4(30) + BOX5(30) + BOX6前7
    # 段1 索引0-10 = BOX3 槽20-30
    for j in range(11):
        box_table.append(('BOX3', f'第{20+j}格', True))
    # 段1 索引11-40 = BOX4 槽1-30 (远古巨蜓@索引11 = BOX4槽1 ✓)
    for j in range(30):
        box_table.append(('BOX4', f'第{j+1}格', True))
    # 段1 索引41-70 = BOX5 槽1-30
    for j in range(30):
        box_table.append(('BOX5', f'第{j+1}格', True))
    # 段1 索引71-77 = BOX6 槽1-7
    for j in range(7):
        box_table.append(('BOX6', f'第{j+1}格', True))
    # 段2(24条) = BOX6 槽8-30 + BOX7 槽1
    for j in range(23):
        box_table.append(('BOX6', f'第{8+j}格', True))
    box_table.append(('BOX7', '第1格', True))
    # 段3(5)+段4(2)+段5(17) = BOX7 槽2-25
    for j in range(2, 26):
        box_table.append(('BOX7', f'第{j}格', True))
    # BOX8-11 空(跳过)
    # 段6(6)+段7(7)+段8(2) = BOX12-19 推测区 -> 标BOX?
    for j in range(15):
        box_table.append(('BOX?', f'待锚{j+1}', False))
    # 段9起 = BOX20 (花舞鸟@段9索引0 ✓)
    # 段9(4)=BOX20槽1-4; 段10(9)=BOX20槽5-13; 段11(9)=BOX20槽14-22
    for j in range(4):
        box_table.append(('BOX20', f'第{j+1}格', True))
    for j in range(9):
        box_table.append(('BOX20', f'第{5+j}格', True))
    for j in range(9):
        box_table.append(('BOX20', f'第{14+j}格', True))
    # 段12(33)=BOX20槽23-30+BOX21槽1-25
    for j in range(8):
        box_table.append(('BOX20', f'第{23+j}格', True))
    for j in range(25):
        box_table.append(('BOX21', f'第{j+1}格', True))
    # 段13(4)=BOX21槽26-29; 段14前1=BOX21槽30
    for j in range(4):
        box_table.append(('BOX21', f'第{26+j}格', True))
    box_table.append(('BOX21', '第30格', True))
    # 段14(73)=BOX22(30)+BOX23(30)+BOX24前12
    for j in range(30):
        box_table.append(('BOX22', f'第{j+1}格', True))
    for j in range(30):
        box_table.append(('BOX23', f'第{j+1}格', True))
    for j in range(12):
        box_table.append(('BOX24', f'第{j+1}格', True))
    # 段15(44)=BOX24槽13-30 + BOX25槽1-26
    for j in range(18):
        box_table.append(('BOX24', f'第{13+j}格', True))
    for j in range(26):
        box_table.append(('BOX25', f'第{j+1}格', True))
    # 段16(28)=BOX26槽1-28 (Mega化石翼龙@段16尾=槽28 ✓)
    for j in range(28):
        box_table.append(('BOX26', f'第{j+1}格', True))
    if idx < len(box_table):
        return box_table[idx]
    return ('未知', f'第{idx+1}条', False)

def parse(data, dex, moves, out_path):
    recs = scan_records(data)
    print(f'记录总数: {len(recs)}')
    # 锚定队伍区: 队伍首条 = 超级土王2232 (OTID + 76B)
    party_offs = []
    for off, spec in recs:
        if spec == SPEC_LEARN and 0xC000 <= off < 0x14000:
            party_offs.append(off)
    print(f'队伍锚(超级土王)候选: {[hex(o) for o in party_offs]}')
    party_off = party_offs[-1] if party_offs else (recs[-1][0])
    # 队伍6条 = party_off 起 76B 间隔
    party = [(party_off + i*0x4C) for i in range(6)]

    # 电脑记录 = 排除队伍区(0x10000+后半)的 OTID 记录, 按物理顺序
    pc_recs = [(off, spec) for off, spec in recs if off < 0x10000 or (off >= 0x14000)]
    # 排除散落记录(0xE00A处218) -> 单独标注
    stray = [(off, spec) for off, spec in recs if 0xD000 <= off < 0x10000 and spec != SPEC_LEARN]
    pc_main = [(off, spec) for off, spec in recs if off < 0xD000 or off >= 0x14000]
    pc_main.sort(key=lambda x: x[0])

    rows = [['来源','位置','宝可梦','图鉴编号','等级','EXP','EV_HP','EV_攻','EV_防','EV_速','EV_特攻','EV_特防',
             '招式(最后学习)','招式2','招式3','招式4']]

    def name_of(sp):
        en, cn = dex.get(sp, ('', ''))
        return cn or en or f'#{sp}'

    def mv_name(mid):
        en, cn = moves.get(mid, ('', ''))
        return cn or en or f'#{mid}'

    # 队伍
    for i, off in enumerate(party):
        if off+76 > len(data): continue
        rec = data[off:off+76]
        sp = struct.unpack_from('<H', rec, 0x0C)[0]
        exp5 = struct.unpack_from('<H', rec, 0x06)[0]
        lv, exp = slow_level(exp5)
        mv = struct.unpack_from('<H', rec, 0x0E)[0] - 0x5800
        rows.append(['队伍', f'队伍{i+1}', name_of(sp), sp, lv, exp, '', '', '', '', '', '',
                     mv_name(mv) if mv > 0 else '无', '存档未存', '存档未存', '存档未存'])

    # 电脑区(按物理顺序 + 锚点箱号)
    for idx, (off, spec) in enumerate(pc_main):
        rec = data[off:off+52]
        exp5 = struct.unpack_from('<H', rec, 0x06)[0]
        lv, exp = slow_level(exp5)
        ev = list(rec[0x14:0x1A])
        mv = struct.unpack_from('<H', rec, 0x0E)[0] - 0x5800
        box, slot, anchored = assign_box(None, idx)
        src = box if anchored else f'{box}(待锚)'
        rows.append([src, slot, name_of(spec), spec, lv, exp, ev[0], ev[1], ev[2], ev[3], ev[4], ev[5],
                     mv_name(mv) if 0 < mv < 2000 else '无', '存档未存', '存档未存', '存档未存'])

    # 散落记录
    for off, spec in stray:
        rec = data[off:off+52]
        exp5 = struct.unpack_from('<H', rec, 0x06)[0]
        lv, exp = slow_level(exp5)
        mv = struct.unpack_from('<H', rec, 0x0E)[0] - 0x5800
        rows.append(['散落', f'0x{off:X}', name_of(spec), spec, lv, exp, '', '', '', '', '', '',
                     mv_name(mv) if 0 < mv < 2000 else '无', '存档未存', '存档未存', '存档未存'])

    with open(out_path, 'w', encoding='utf-8-sig', newline='') as f:
        csv.writer(f).writerows(rows)
    print(f'完成: {len(rows)-1} 条 -> {out_path}')
    return rows

if __name__ == '__main__':
    sav = sys.argv[1] if len(sys.argv) > 1 else r'D:\mGBA-0.10.2-win64\ROM\elite redux\ER2.65简汉化\ERv2.65-beta2-debug汉化版.sav'
    out = sys.argv[2] if len(sys.argv) > 2 else r'D:\mGBA-0.10.2-win64\ROM\elite redux\存档解析_20261005.csv'
    xlsm = r'D:\mGBA-0.10.2-win64\ROM\elite redux\ER2.65简汉化\ER2.65beta版图鉴v0.3.xlsm'
    dex = load_dex(xlsm)
    moves = load_moves(xlsm)
    print(f'图鉴 {len(dex)} 条, 招式 {len(moves)} 条')
    rows = parse(open(sav,'rb').read(), dex, moves, out)
    print('\n锚点验证:')
    for r in rows[1:]:
        if r[2] in ('护城龙','河马兽','雷吉艾勒奇','裙儿小姐','幸福蛋','远古巨蜓','花舞鸟-热辣热辣风格','超级化石翼龙','超级土王'):
            print(f'  {r[0]} {r[1]}: {r[2]} Lv{r[4]} 招:{r[12]}')
