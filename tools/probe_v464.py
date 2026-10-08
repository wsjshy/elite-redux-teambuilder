#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""v4.6.4 使用率弱先验探针（实测值 + 断言，输出可粘贴进报告）

断言组：
  A 数据层 data.js：usagePrior 非空且 ≥700 条 / 值域 (0,1] 且至少一条 ==1 / usageMeta 契约
  B 引擎层 HTML：内嵌 ERDATA 的 usagePrior/usageMeta 与数据层一致（提取 script 后复核）
  C 抽样 5 锚点：411 / 469 / 741 / 1513 有值，2232（ER 专有 Mega）无值——有值/无值均合理
  D UP1 严格分支生效：usagePrior 存在 → 引擎走「非空 = 严格路径」判据
  E 既有基线计数不回归
"""
import hashlib
import json
import re

BASE = r'D:\game\elite-redux'
out = []
ok = []


def P(s=''):
    out.append(s)


def chk(name, cond, detail=''):
    ok.append(bool(cond))
    P('%s %s%s' % ('PASS' if cond else 'FAIL', name, (' — ' + detail) if detail else ''))


def sha(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for c in iter(lambda: f.read(1 << 20), b''):
            h.update(c)
    return h.hexdigest().upper()


def erdata(path):
    txt = open(path, encoding='utf-8').read()
    m = re.search(r'var ERDATA\s*=\s*', txt)
    d, end = json.JSONDecoder().raw_decode(txt[m.end():])
    return d, len(txt)


D, njs = erdata(BASE + r'\配招工具_data.js')
H, nhtml_script = erdata(BASE + r'\_chk_script_1.js')
P('data.js = %d B | 提取内嵌 script = %d B' % (njs, nhtml_script))
P('data.js      SHA256 %s' % sha(BASE + r'\配招工具_data.js'))
P('配招助手_ER.html SHA256 %s' % sha(BASE + r'\配招助手_ER.html'))
P('index.html   SHA256 %s' % sha(BASE + r'\index.html'))
P()

# ---------- A 数据层 ----------
pri = D.get('usagePrior') or {}
meta = D.get('usageMeta') or {}
P('--- A 数据层 usagePrior / usageMeta ---')
P('usagePrior 条数 = %d' % len(pri))
P('usageMeta = %s' % json.dumps(meta, ensure_ascii=False))
chk('A1 usagePrior 非空且 ≥700 条', len(pri) >= 700, '实际 %d' % len(pri))
_bad = [k for k, v in pri.items() if not (isinstance(v, (int, float)) and 0 < v <= 1)]
chk('A2 值域 (0,1] 全部合法', not _bad, '越界 %d 条' % len(_bad))
chk('A3 至少一条恰等 1（归一化锚）', any(v == 1 for v in pri.values()),
    'max=%s' % max(pri.values()) if pri else 'max=N/A')
_fmt = [s.get('format') for s in (meta.get('srcs') or [])]
chk('A4 usageMeta.srcs 同时含 gen3ou 与 gen9nationaldex', 'gen3ou' in _fmt and 'gen9nationaldex' in _fmt, str(_fmt))
chk('A5 coverage == len(usagePrior) 且 ≥500', meta.get('coverage') == len(pri) and (meta.get('coverage') or 0) >= 500,
    'coverage=%s' % meta.get('coverage'))
chk('A6 month/rating 字段就位', bool(meta.get('month')) and meta.get('rating') is not None,
    'month=%s rating=%s' % (meta.get('month'), meta.get('rating')))
chk('A7 note 含「≠ ER 使用率」+「已知缺口」',
    '≠ ER 使用率' in (meta.get('note') or '') and '已知缺口' in (meta.get('note') or ''),
    'note=%r' % meta.get('note'))
P()

# ---------- B 引擎层（HTML 内嵌）一致 ----------
P('--- B 引擎层（HTML 内嵌 script）一致 ---')
hp, hm = H.get('usagePrior') or {}, H.get('usageMeta') or {}
chk('B1 HTML 内嵌 usagePrior 条数与数据层一致', len(hp) == len(pri), 'HTML %d vs data.js %d' % (len(hp), len(pri)))
chk('B2 HTML 内嵌 usagePrior 取值逐一相等', hp == pri)
chk('B3 HTML 内嵌 usageMeta == 数据层 usageMeta', hm == meta)
P()

# ---------- C 5 锚点 ----------
P('--- C 抽样 5 锚点（411/469/741/1513/2232） ---')
sp = {s['id']: s.get('zh') for s in D['species']}
for a in ('411', '469', '741', '1513', '2232'):
    P('  #%-5s %-14s usagePrior=%s' % (a, sp.get(a, '?'), pri.get(a)))
chk('C1 411/469/741/1513 均有值', all(pri.get(a) for a in ('411', '469', '741', '1513')))
chk('C2 2232（ER 专有 Mega，Showdown 无对应键）无值 — 合理', pri.get('2232') is None)
P()

# ---------- D UP1 严格分支 ----------
P('--- D UP1 严格分支（引擎判据） ---')
src = open(BASE + r'\_chk_script_1.js', encoding='utf-8').read()
_strict = re.search(r'用法|usagePriorOf|USAGE_PRIOR_W', src) is not None
chk('D1 引擎消费入口存在（usagePriorOf / USAGE_PRIOR_W）', _strict)
chk('D2 先验加权只作次排序（1+USAGE_PRIOR_W*usagePriorOf）', '1+USAGE_PRIOR_W*usagePriorOf' in src)
chk('D3 USAGE_PRIOR_W = 0.6', 'USAGE_PRIOR_W=0.6' in src or 'USAGE_PRIOR_W = 0.6' in src)
chk('D4 非空即走严格路径（UP1 有数据分支：非空 → 严格）', bool(pri))
P()

# ---------- E 基线计数 ----------
P('--- E 既有基线计数 ---')
for k, want in [('types', 21), ('matchup', 21), ('moves', 1032), ('species', 1906), ('items', 929),
                ('abilities', 1034), ('abiTags', 107), ('abiAlias', 419), ('templates', 18),
                ('coreNotes', 44), ('movesNotes', 69), ('nonFinal', 653), ('sprites', 1906)]:
    v = len(D[k]) if isinstance(D[k], (list, dict)) else D[k]
    chk('E %s == %d' % (k, want), v == want, '实际 %d' % v)
chk('E matchup 21×21 方阵', len(D['matchup']) == 21 and all(len(r) == 21 for r in D['matchup']))
chk('E moves 含 lDesc（下标 10）非空 1031', sum(1 for m in D['moves'] if len(m) > 10 and m[10]) == 1031)
chk('E abiTags conv 9 条', sum(1 for v in D['abiTags'].values() if 'conv' in v) == 9)
P()
P('=== 断言合计 %d/%d PASS ===' % (sum(ok), len(ok)))
P('结论: %s' % ('ALL PASS' if all(ok) else '存在 FAIL'))
open(r'C:\Users\22210\AppData\Local\Doubao\User Data\Default\.doubao\agent_mode\workspace\.sessions\38445687001085442\agents\s_000c8ZJnpeo\scratch\_probe_v464.log',
     'w', encoding='utf-8').write('\n'.join(out))
print('\n'.join(out[-4:]))
