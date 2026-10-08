# -*- coding: utf-8 -*-
"""v4.6.2 精灵图合图（Sprite Sheet）

assets/sprites/sp<id>.png（1906 张，统一 64×64）→ assets/sheets/s{0..7}.webp + sheets_map.js
- 按 id **数字升序**（勿按字符串，否则 sp10 会排在 sp9 前）
- 每 256 只一张 1024×1024 sheet（64px 格，16×16）
- WebP lossy quality 90（带 alpha）
- sheets_map.js：window.SPR_SHEET = {"<id>": [sheetIdx, col, row], ...}

只读 assets/sprites/，只写 assets/sheets/。可重复执行（覆盖输出）。
"""
import io
import json
import os
import re
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'assets', 'sprites')
OUT = os.path.join(ROOT, 'assets', 'sheets')
CELL = 64
COLS = ROWS = 16
PER = COLS * ROWS          # 256
QUALITY = 90
ANCHORS = [411, 469, 741, 1513, 2232]   # 回归锚点 id（应与 verify 断言一致）


def main():
    if not os.path.isdir(SRC):
        print('[ERR] 源目录不存在: ' + SRC)
        return 2
    files = {}
    for fn in os.listdir(SRC):
        m = re.fullmatch(r'sp(\d+)\.png', fn)
        if m:
            files[int(m.group(1))] = fn
    if not files:
        print('[ERR] 未找到 sp<id>.png')
        return 2
    ids = sorted(files)                      # 数字升序
    os.makedirs(OUT, exist_ok=True)
    nsheets = (len(ids) + PER - 1) // PER
    mapping = {}
    total = 0
    sizes = []
    for si in range(nsheets):
        chunk = ids[si * PER:(si + 1) * PER]
        sheet = Image.new('RGBA', (COLS * CELL, ROWS * CELL), (0, 0, 0, 0))
        for k, sid in enumerate(chunk):
            col, row = k % COLS, k // COLS
            with Image.open(os.path.join(SRC, files[sid])) as im:
                im = im.convert('RGBA')
                if im.size != (CELL, CELL):
                    print('  [warn] sp%d 尺寸 %s ≠ 64×64 → 最近邻缩放' % (sid, im.size))
                    im = im.resize((CELL, CELL), Image.NEAREST)
                sheet.paste(im, (col * CELL, row * CELL))
            mapping[str(sid)] = [si, col, row]
        p = os.path.join(OUT, 's%d.webp' % si)
        sheet.save(p, 'WEBP', quality=QUALITY, method=6)
        sz = os.path.getsize(p)
        total += sz
        sizes.append((si, len(chunk), sz))
        print('s%d.webp  %3d 只  %7.1f KB' % (si, len(chunk), sz / 1024.0))

    js = 'window.SPR_SHEET=' + json.dumps(mapping, separators=(',', ':'), ensure_ascii=False) + ';\n'
    mp = os.path.join(OUT, 'sheets_map.js')
    io.open(mp, 'w', encoding='utf-8', newline='\n').write(js)

    print('---')
    print('sheets=%d  ids=%d  总大小=%.2f MB  sheets_map.js=%.1f KB'
          % (nsheets, len(ids), total / 1048576.0, os.path.getsize(mp) / 1024.0))
    print('id 区间：%d … %d（数字升序首/末）' % (ids[0], ids[-1]))

    # 抽样校验：锚点 id 从 sheet 裁回与原图比对（lossy → 允许小幅差异）
    bad = 0
    for sid in ANCHORS:
        if str(sid) not in mapping:
            print('  [miss] 锚点 id %d 不在映射中' % sid)
            bad += 1
            continue
        si, col, row = mapping[str(sid)]
        with Image.open(os.path.join(OUT, 's%d.webp' % si)) as sh:
            sh = sh.convert('RGBA')
            crop = sh.crop((col * CELL, row * CELL, col * CELL + CELL, row * CELL + CELL))
        with Image.open(os.path.join(SRC, files[sid])) as orig:
            orig = orig.convert('RGBA')
        diff = 0
        a, b = crop.load(), orig.load()
        for y in range(CELL):
            for x in range(CELL):
                pa, pb = a[x, y], b[x, y]
                if pa[3] or pb[3]:
                    diff = max(diff, max(abs(pa[i] - pb[i]) for i in range(4)))
        print('  锚点 #%d → s%d[%d,%d]  最大像素差=%d %s' % (sid, si, col, row, diff, 'OK' if diff <= 24 else '⚠偏大'))
        if diff > 24:
            bad += 1
    print('抽样校验：%d/%d 通过' % (len(ANCHORS) - bad, len(ANCHORS)))
    return 0


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    raise SystemExit(main())
