# -*- coding: utf-8 -*-
"""
build_sprites.py —— 为配招助手生成全量精灵图资源（阶段 1）

输入：
  ER-source/nextdex/static/sprites/*.png                      （精灵源，7672 张）
  ER-source/gameDataV2.65beta.json  ->  species（1907 条，权威物种清单）

输出：
  assets/sprites/sp<id>.png       每个物种 id 一张「正面普通」PNG
  assets/sprites_map.csv          映射记录（id,name,NAME,sprite,layer）
  assets/sprites_report.md        统计与缺失清单

匹配策略（按序，先精确后剥离，绝不对基础名做盲目正则剥离）：
  L1  NAME 字段精确（SPECIES_xxx -> XXX.png）  ← 权威键，NextDex 同源同命名
  L2  name 归一后精确（NFKD 去音标 / ♀♂ / . ' : - 空格 归一）
  L3  归一名按 token 由长到短取前缀命中（形态后缀剥离），再尝试补形态词变体
  L4  去连字符/去空格等极端变体

用法： python build_sprites.py
"""
import json
import os
import re
import shutil
import sys
import time
import unicodedata

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # D:\game\elite-redux
SPR_SRC = os.path.join(BASE, 'ER-source', 'nextdex', 'static', 'sprites')
GD_PATH = os.path.join(BASE, 'ER-source', 'gameDataV2.65beta.json')
OUT_DIR = os.path.join(BASE, 'assets', 'sprites')
MAP_CSV = os.path.join(BASE, 'assets', 'sprites_map.csv')
REPORT_MD = os.path.join(BASE, 'assets', 'sprites_report.md')

# ---------------------------------------------------------------- 归一化
_PUNCT_SUB = {
    '\u2640': 'F',   # ♀
    '\u2642': 'M',   # ♂
    '\u2019': '',    # ’
    '\u2018': '',
    "'": '',
    '.': '',
    ':': '',
    ';': '',
    '\u2013': '_',   # –
    '\u2014': '_',   # —
    '-': '_',
    ' ': '_',
    '/': '_',
    '\u00b7': '_',
}


def norm_name(x):
    """物种 name -> 归一键（大写、下划线分词、去音标与特殊标点）"""
    x = x.replace('SPECIES_', '')
    for a, b in _PUNCT_SUB.items():
        x = x.replace(a, b)
    x = unicodedata.normalize('NFKD', x)
    x = ''.join(c for c in x if not unicodedata.combining(c))  # 去音标 é->e
    x = x.upper()
    x = re.sub(r'[^A-Z0-9]+', '_', x)
    return x.strip('_')


# ---------------------------------------------------------------- 建立索引
def build_index():
    """返回 {归一文件名: 真实文件名}，只保留「正面普通」图（排除 _BACK / _SHINY）"""
    idx = {}
    for f in os.listdir(SPR_SRC):
        if not f.lower().endswith('.png'):
            continue
        stem = f[:-4]
        up = stem.upper()
        if '_BACK' in up or '_SHINY' in up:
            continue
        idx[up] = stem
    return idx


# ---------------------------------------------------------------- 匹配
def candidates(s, idx):
    """按 L1..L4 顺序产出候选键"""
    name = (s.get('name') or '').strip().replace('?', '')
    # L1：NAME 字段（权威）
    nm = (s.get('NAME') or '').replace('SPECIES_', '').upper()
    if nm and nm != 'NONE':
        yield 'L1', nm
    # L2：name 归一整名
    n = norm_name(s['name']) if name else ''
    if n:
        yield 'L2', n
        toks = n.split('_')
        # L3：由长到短取前缀（形态后缀剥离），再补 _MASK / _CLOAK 等常见补语
        for i in range(len(toks) - 1, 0, -1):
            base = '_'.join(toks[:i])
            yield 'L3', base
            for extra in ('MASK', 'CLOAK', 'FORM', 'MODE', 'STYLE'):
                yield 'L3', '%s_%s' % (base, extra)
        # L4：极端变体
        yield 'L4', n.replace('_', '')
        if n.startswith('MR_'):
            yield 'L4', 'MR' + n[3:]


def main():
    if not os.path.isdir(SPR_SRC):
        print('精灵源目录不存在:', SPR_SRC)
        return 1
    if not os.path.isfile(GD_PATH):
        print('gameData 不存在:', GD_PATH)
        return 1

    with open(GD_PATH, encoding='utf-8') as fp:
        gd = json.load(fp)
    species = gd['species']

    idx = build_index()
    # 归一 -> 真实文件（用于 L2/L4 这类非原始大小写的键）
    idx_norm = {norm_name(k): v for k, v in idx.items()}

    os.makedirs(OUT_DIR, exist_ok=True)

    rows = []
    missing = []
    layer_count = {}
    used_files = set()

    for s in species:
        sid = s['id']
        if sid is None or int(sid) <= 0:
            missing.append((sid, s.get('name'), s.get('NAME'), '虚拟/占位物种（name 为 ?，无精灵）'))
            continue
        hit = None
        layer = None
        for ly, key in candidates(s, idx):
            if not key:
                continue
            real = idx.get(key) or idx_norm.get(key)
            if real:
                hit, layer = real, ly
                break
        if not hit:
            missing.append((sid, s.get('name'), s.get('NAME'), '四层策略均未命中'))
            continue
        used_files.add(hit)
        layer_count[layer] = layer_count.get(layer, 0) + 1
        dst = os.path.join(OUT_DIR, 'sp%d.png' % int(sid))
        src = os.path.join(SPR_SRC, hit + '.png')
        if (not os.path.exists(dst)) or os.path.getsize(dst) != os.path.getsize(src) \
                or os.path.getmtime(dst) < os.path.getmtime(src):
            shutil.copy2(src, dst)
        rows.append((int(sid), s.get('name'), s.get('NAME'), hit, layer))

    # 清理：删掉不在本次映射中的 sp*.png（历史残留）
    keep = set('sp%d.png' % r[0] for r in rows)
    removed = []
    for f in os.listdir(OUT_DIR):
        if re.fullmatch(r'sp-?\d+\.png', f) and f not in keep:
            os.remove(os.path.join(OUT_DIR, f))
            removed.append(f)

    rows.sort(key=lambda r: r[0])
    with open(MAP_CSV, 'w', encoding='utf-8-sig', newline='') as fp:
        fp.write('id,name,NAME,sprite_file,layer\n')
        for r in rows:
            fp.write('%d,"%s",%s,%s,%s\n' % (r[0], (r[1] or '').replace('"', '""'), r[2], r[3], r[4]))

    files = [f for f in os.listdir(OUT_DIR) if f.lower().endswith('.png')]
    total = sum(os.path.getsize(os.path.join(OUT_DIR, f)) for f in files)

    lines = []
    lines.append('# 精灵图资源报告（阶段 1）\n')
    lines.append('- 生成时间：%s' % time.strftime('%Y-%m-%d %H:%M:%S'))
    lines.append('- 输出目录：`%s`' % OUT_DIR)
    lines.append('- 权威物种清单：`%s`（%d 条）' % (GD_PATH, len(species)))
    lines.append('- 精灵源：`%s`' % SPR_SRC)
    lines.append('- **输出文件数：%d**，合计 **%.2f MB**' % (len(files), total / 1048576.0))
    lines.append('- 映射层命中分布：%s' % ', '.join('%s=%d' % (k, v) for k, v in sorted(layer_count.items())))
    lines.append('- 历史残留清理：%d 个' % len(removed))
    lines.append('\n## 缺失清单（%d）\n' % len(missing))
    if not missing:
        lines.append('无。\n')
    else:
        lines.append('| id | name | NAME | 原因 |')
        lines.append('| --- | --- | --- | --- |')
        for m in missing:
            lines.append('| %s | %s | %s | %s |' % (m[0], m[1], m[2], m[3]))
        lines.append('')
    with open(REPORT_MD, 'w', encoding='utf-8') as fp:
        fp.write('\n'.join(lines) + '\n')

    print('输出文件数: %d' % len(files))
    print('总体积: %.2f MB' % (total / 1048576.0))
    print('映射命中层分布:', dict(sorted(layer_count.items())))
    print('缺失: %d 条' % len(missing))
    for m in missing:
        print('   MISS', m)
    print('未使用的源图(非 back/shiny 但无物种):', len(set(idx.values()) - used_files))
    return 0


if __name__ == '__main__':
    sys.exit(main())
