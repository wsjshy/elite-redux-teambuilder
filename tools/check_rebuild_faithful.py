#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""重建保真校验：比较两份 配招工具_data.js 的 ERDATA 字面量。

用法：python tools\\check_rebuild_faithful.py <oracle.js> <new.js> [忽略键,忽略键...]
默认忽略 usagePrior,usageMeta（v4.6.4 新增字段）。
输出：键集差异、逐键是否一致、首个差异路径与取值、两份文件的 SHA256 与字节数。
"""
import hashlib
import json
import sys


def load(path):
    txt = open(path, encoding='utf-8').read()
    i = txt.index('var ERDATA = ') + len('var ERDATA = ')
    d, end = json.JSONDecoder().raw_decode(txt[i:])
    return d, txt, len(txt[i:i + end])


def first_diff(a, b, path='$'):
    if type(a) is not type(b):
        return '%s: 类型 %s vs %s' % (path, type(a).__name__, type(b).__name__)
    if isinstance(a, dict):
        ka, kb = list(a.keys()), list(b.keys())
        if ka != kb:
            miss = [k for k in kb if k not in a][:6]
            extra = [k for k in ka if k not in b][:6]
            order_same = sorted(ka) == sorted(kb)
            return '%s: 键集/序不同 缺=%s 多=%s 同集不同序=%s' % (path, miss, extra, order_same)
        for k in ka:
            r = first_diff(a[k], b[k], '%s.%s' % (path, k))
            if r:
                return r
        return None
    if isinstance(a, list):
        if len(a) != len(b):
            return '%s: 长度 %d vs %d' % (path, len(a), len(b))
        for i, (x, y) in enumerate(zip(a, b)):
            r = first_diff(x, y, '%s[%d]' % (path, i))
            if r:
                return r
        return None
    if a != b:
        ra, rb = repr(a)[:90], repr(b)[:90]
        return '%s: %s  vs  %s' % (path, ra, rb)
    return None


def sha(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest().upper()


if __name__ == '__main__':
    pa, pb = sys.argv[1], sys.argv[2]
    ign = set(sys.argv[3].split(',')) if len(sys.argv) > 3 else {'usagePrior', 'usageMeta'}
    A, ta, la = load(pa)
    B, tb, lb = load(pb)
    print('A(oracle) = %s\n  file=%d B  literal=%d B  SHA256=%s' % (pa, len(ta.encode('utf-8')), la, sha(pa)))
    print('B(new)    = %s\n  file=%d B  literal=%d B  SHA256=%s' % (pb, len(tb.encode('utf-8')), lb, sha(pb)))
    added = [k for k in B if k not in A]
    removed = [k for k in A if k not in B]
    print('\n新增键: %s\n移除键: %s' % (added, removed))
    print('B 顶层键顺序: %s' % list(B.keys()))
    bad = 0
    for k in A:
        if k in ign:
            continue
        if k not in B:
            print('  ✗ %-12s 新文件缺失' % k)
            bad += 1
            continue
        d = first_diff(A[k], B[k], '$.' + k)
        if d:
            print('  ✗ %-12s %s' % (k, d))
            bad += 1
        else:
            print('  ✓ %-12s 一致' % k)
    for k in added:
        v = B[k]
        n = len(v) if isinstance(v, (list, dict)) else v
        print('  ＋ %-12s 新增（%s=%s）' % (k, type(v).__name__, n))
    print('\n结论: %s' % ('PASS —— 除新增键外逐字段一致（重建保真）' if bad == 0 else 'FAIL —— %d 个键不一致' % bad))
    sys.exit(0 if bad == 0 else 1)
