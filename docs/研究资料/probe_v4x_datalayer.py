#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""v4.x 数据层升级探针（2026-10-07）

校验 build_tool_data.py 交付的 5 项数据契约，并核对既有无回归。
运行：python docs\\研究资料\\probe_v4x_datalayer.py
"""
import json, re, sys, csv as _csv
from collections import Counter

sys.stdout.reconfigure(encoding='utf-8')
BASE = r'D:\game\elite-redux'

GD = json.load(open(BASE + r'\ER-source\gameDataV2.65beta.json', encoding='utf-8'))
_txt = open(BASE + r'\配招工具_data.js', encoding='utf-8').read()
D = json.loads(_txt[_txt.index('= ') + 2:].rstrip().rstrip(';'))
HTML = open(BASE + r'\build_tool_html.py', encoding='utf-8').read()

PASS, FAIL = [], []
def ck(cond, label, detail=''):
    (PASS if cond else FAIL).append(label)
    print(('  [OK]  ' if cond else '  [FAIL]') + ' ' + label + (('  -> ' + str(detail)) if detail else ''))

print('=' * 78)
print('v4.x 数据层探针 |', BASE)
print('=' * 78)

mv_list, ab_list = D['moves'], D['abilities']
gd_mv = set(str(m['id']) for m in GD['moves'])
gd_ab = set(str(a['id']) for a in GD['abilities'])
mv_out = set(str(m[0]) for m in mv_list)
ab_out = set(str(a[0]) for a in ab_list)
ab_zh = set((a[2] or a[1]) for a in ab_list) | set(D['abiAlias'].keys())
mv_zh = set(m[1] for m in mv_list) | set(m[2] for m in mv_list)
it_zh = set(i[2] for i in D['items']) | set(i[1] for i in D['items'])

# ---------------------------------------------------------------- 新字段存在
print('\n[1] 新字段存在性')
for f in ('mvDescZh', 'abiDescZh', 'sysSet', 'familyRoot', 'glossary', 'matchupSp'):
    ck(f in D, 'ERDATA 含字段 ' + f)

# ---------------------------------------------------------------- 既有无回归
print('\n[2] 既有无回归（基线 species 1906 / items 929 / abilities 1034 / moves 1032 /'
      ' abiTags 107 / nonFinal 640 / types 21 / matchup 21x21）')
ck(len(D['species']) == 1906, 'species == 1906', len(D['species']))
ck(len(D['items']) == 929, 'items == 929', len(D['items']))
ck(len(ab_list) == 1034, 'abilities == 1034', len(ab_list))
ck(len(mv_list) == 1032, 'moves == 1032', len(mv_list))
ck(len(D['abiTags']) == 107, 'abiTags == 107', len(D['abiTags']))
ck(len(D['abiAlias']) == 419, 'abiAlias == 419', len(D['abiAlias']))
ck(len(D['movesNotes']) == 69, 'movesNotes == 69', len(D['movesNotes']))
ck(len(D['coreNotes']) == 44, 'coreNotes == 44', len(D['coreNotes']))
ck(len(D['nonFinal']) == 640, 'nonFinal == 640', len(D['nonFinal']))
ck(len(D['types']) == 21, 'types == 21', len(D['types']))
ck(len(D['matchup']) == 21 and all(len(r) == 21 for r in D['matchup']), 'matchup 21x21',
   [len(r) for r in D['matchup']])
ck(len(D['templates']) == 18, 'templates == 18', len(D['templates']))
ck(len(D['sprites']) == 1906, 'sprites == 1906', len(D['sprites']))

# ---------------------------------------------------------------- D1 翻译字典
print('\n[3] D1 中文描述字典 mvDescZh / abiDescZh')
mvz, abz = D['mvDescZh'], D['abiDescZh']
ck(300 <= len(mvz) + len(abz) <= 500, '覆盖总数落在 300~500', (len(mvz), len(abz), len(mvz) + len(abz)))
ck(set(mvz) <= gd_mv, 'mvDescZh 全部 id 存在于 gameData.moves', sorted(set(mvz) - gd_mv)[:8])
ck(set(mvz) <= mv_out, 'mvDescZh 全部 id 存在于 ERDATA.moves', sorted(set(mvz) - mv_out)[:8])
ck(set(abz) <= gd_ab, 'abiDescZh 全部 id 存在于 gameData.abilities', sorted(set(abz) - gd_ab)[:8])
ck(set(abz) <= ab_out, 'abiDescZh 全部 id 存在于 ERDATA.abilities', sorted(set(abz) - ab_out)[:8])
_latin_ok = re.compile(r'HP|Mega')   # 允许保留 HP / Mega 等通用专有写法
ck(all(v and not re.search(r'[A-Za-z]{4,}', _latin_ok.sub('', v)) for v in mvz.values()),
   'mvDescZh 无残留英文长词（HP/Mega 除外）')
ck(all(v and not re.search(r'[A-Za-z]{4,}', _latin_ok.sub('', v)) for v in abz.values()),
   'abiDescZh 无残留英文长词（HP/Mega 除外）')
ck(len(set(mvz.values())) > 200 and len(set(abz.values())) > 90, '译文非占位重复',
   (len(set(mvz.values())), len(set(abz.values()))))
# ABI_TAGS(107) / MOVES_NOTES(69) 必须 100% 落在译文字典内
ck(set(D['abiTags']) <= set(abz), 'ABI_TAGS(107) 全部有中文 desc',
   sorted(set(D['abiTags']) - set(abz))[:8])
ck(set(D['movesNotes']) <= set(mvz), 'MOVES_NOTES(69) 全部有中文 desc',
   sorted(set(D['movesNotes']) - set(mvz))[:8])

mv_by_id = {str(m[0]): m for m in mv_list}
ab_by_id = {str(a[0]): a for a in ab_list}
print('\n  -- 翻译抽样 3 条（中英对照）--')
for sid in ['85', '446', '240']:
    m = mv_by_id[sid]
    print('   [招式 id=%s] %s / %s' % (sid, m[1], m[2]))
    print('      EN(desc): %s' % m[9])
    print('      ZH      : %s' % mvz.get(sid, '(未覆盖)'))
gd_ab_by_id = {str(a['id']): a for a in GD['abilities']}
for sid in ['91', '169', '96']:
    a = ab_by_id[sid]
    print('   [特性 id=%s] %s / %s' % (sid, a[2], a[1]))
    print('      EN(desc): %s' % gd_ab_by_id[sid]['desc'].replace('\n', ' '))
    print('      ZH      : %s' % abz.get(sid, '(未覆盖)'))

# ---------------------------------------------------------------- D2 SYS_SET
print('\n[4] D2 SYS_SET 数据驱动（desc 正则派生）')
LEGACY9 = [2, 45, 70, 117, 226, 227, 228, 229, 834]
sysset = D['sysSet']
ck(isinstance(sysset, list) and all(isinstance(x, int) for x in sysset), 'sysSet 为 int id 列表', sysset)
ck(set(LEGACY9) <= set(sysset), '既有口径 9 个设置手全部命中', sorted(set(LEGACY9) - set(sysset)))
ck(set(str(x) for x in sysset) <= gd_ab, 'sysSet 全部 id 存在于 gameData.abilities')
ck(set(str(x) for x in sysset) <= ab_out, 'sysSet 全部 id 存在于 ERDATA.abilities')
_pats = {
    '雨': r'Summons? rain\b', '晴': r'Summons? sun\b', '沙': r'Summons? (a )?sand', '雪': r'Summons? hail',
    '电场': r'Casts Electric Terrain', '精神场地': r'Casts Psychic Terrain',
    '薄雾场地': r'Casts Misty Terrain', '青草场地': r'Casts Grassy Terrain',
    '剧毒场地': r'Toxic Terrain on entry',
}
_exp = set()
for a in GD['abilities']:
    d = a.get('desc') or ''
    if 'on entry' not in d.lower():
        continue
    for _s, _p in _pats.items():
        if re.search(_p, d, re.I):
            _exp.add(int(a['id'])); break
ck(set(sysset) == _exp, 'sysSet 与 desc 正则推导完全一致', sorted(set(sysset) ^ _exp))
print('  sysSet =', sorted(sysset))
print('  相对旧 9 条硬编码新增:', sorted(set(sysset) - set(LEGACY9)))
for i in sorted(sysset):
    print('    id %-4s %-16s %s' % (i, ab_by_id[str(i)][1], abz.get(str(i), '')))

print('\n  -- D2 顺带确认 SYS_MAP（受益者；源头在 build_tool_html.py，只读核对）--')
_m = re.search(r'var SYS_MAP\s*=\s*\{([^}]*)\}', HTML)
names = re.findall(r"'([^']+)'\s*:\s*'([^']+)'", _m.group(1)) if _m else []
ck(len(names) == 21, 'SYS_MAP 条目 == 21', len(names))
unres = [n for n, _s in names if n not in ab_zh]
ck(not unres, 'SYS_MAP 特性名全部可在 ERDATA 解析', unres)
_alias = {k: str(v) for k, v in D['abiAlias'].items()}
_byzh = {}
for a in ab_list:
    _byzh[a[2] or a[1]] = str(a[0])
for k, v in _alias.items():
    _byzh.setdefault(k, v)
_sysmap_ids = {}
for n, s in names:
    if n in _byzh:
        _sysmap_ids[_byzh[n]] = s
ck(len(_sysmap_ids) == 21, 'SYS_MAP 21 条全部解析到特性 id', len(_sysmap_ids))
_gap = sorted(set(str(i) for i in LEGACY9) - set(_sysmap_ids))
print('  ⚠ 旧 9 设置手中不在 SYS_MAP 的:', _gap,
      '（834 毒沼制造者；SYS_MAP 原文无「剧毒场地」体系 —— build_tool_html.py 只读，')
print('     属**既有**缺口而非本次回归；引擎层可按需把 剧毒场地/834 补进 SYS_MAP）')
ck(set(str(i) for i in [2, 45, 70, 117, 226, 227, 228, 229]) <= set(_sysmap_ids),
   '旧 9 中的天气/四场地设置手均在 SYS_MAP 内（受益者口径未回归）',
   sorted(set(str(i) for i in [2, 45, 70, 117, 226, 227, 228, 229]) - set(_sysmap_ids)))
print('  SYS_MAP 体系集合:', sorted(set(s for _, s in names)))
print('  新 3 设置手尚未进 SYS_MAP（信息项，引擎层可按需补）:',
      sorted(set(sysset) - set(LEGACY9)))

# ---------------------------------------------------------------- D3 familyRoot
print('\n[5] D3 FAMILY familyRoot 探针校验')
S = GD['species']
_fedges = []
for s in S:
    for e in (s.get('evolutions') or []):
        if (e or {}).get('kd') == 1:
            _fedges.append((int(s['id']), int(S[e['in']]['id'])))
_tgt = set(b for _, b in _fedges)
_src = set(a for a, b in _fedges)
fr = D['familyRoot']
ck(isinstance(fr, dict), 'familyRoot 为 dict')
ck(len(fr) == 534, 'familyRoot 条目 == 534（265 root + 269 形态）', len(fr))
ck(set(str(i) for i in _tgt) <= set(fr), '全部 kd==1 目标形态在表中', len(_tgt))
ck(all(int(fr[str(i)]) in _src for i in _tgt), '每个 Mega/Redux 形态有 root 且 root ∈ 来源基础物种')
ck(all(fr[k] == fr[fr[k]] for k in fr), '沿链上溯收敛（root 自映射，可反查）')
ck(len(set(fr.values())) == 265, 'distinct roots == 265', len(set(fr.values())))
ck(all(int(v) not in _tgt for v in fr.values()), '每个 root 自身非 kd==1 目标（链头基础形态）')
_all_sp = set(str(x['id']) for x in S)
ck(set(fr) <= _all_sp and set(fr.values()) <= _all_sp, 'familyRoot 键值均在 gameData.species 中',
   sorted((set(fr) | set(fr.values())) - _all_sp)[:8])
_er = set(str(x['id']) for x in D['species'])
ck(set(fr) <= _er and set(fr.values()) <= _er, 'familyRoot 键值均在 ERDATA.species 中',
   sorted((set(fr) | set(fr.values())) - _er)[:8])
_nm = {int(x['id']): x['name'] for x in S}
print('\n  -- FAMILY 校验输出（家族样例）--')
for i in [3, 6, 9, 1501, 2188, 2208]:
    if str(i) in fr:
        print('   %s(%s) -> root %s(%s)' % (i, _nm.get(i), fr[str(i)], _nm.get(int(fr[str(i)]))))
_c = Counter(fr.values())
print('  家族成员数 Top3（含 root）:', _c.most_common(3))
print('  root 家族数:', len(_c), '| Mega/Redux 形态数:', len(_tgt), '| kd==1 边数:', len(_fedges))

# ---------------------------------------------------------------- D4 glossary
print('\n[6] D4 GLOSSARY 机制词条')
g = D['glossary']
ck(isinstance(g, list) and len(g) == 40, 'glossary 条目 == 40', len(g))
ck(all({'key', 'term', 'zh', 'body'} <= set(x) for x in g), '每条含 key/term/zh/body')
ck(len(set(x['key'] for x in g)) == 40 and len(set(x['zh'] for x in g)) == 40, 'key / zh 唯一')
ck(all(x['body'].strip() for x in g), 'body 非空')
_tier = sum(1 for x in g if re.search(r'v2\.65|原版口径|待实测|changelog|招式数据|特性数据|数据实证|C 档', x['body']))
ck(_tier == 40, '每条 body 注明来源档位', _tier)
_wnum = sum(1 for x in g if re.search(r'WCONF|hazardRules|WEATHER_MV', x['body']))
print('  body 明确引用引擎参数名(WCONF/hazardRules/WEATHER_MV)的条目:', _wnum)
print('\n  -- GLOSSARY 40 条列表 --')
for i, x in enumerate(g, 1):
    print('  %2d. %-22s %-12s %s' % (i, x['key'], x['zh'], x['term']))

print('\n  -- CSV 第 10/11 列确认（D4 第一项，记录在案、不改结构）--')
_rows = list(_csv.reader(open(BASE + r'\招式表_招式数值.csv', encoding='utf-8-sig')))
_hdr = _rows[0]
_r1 = next(r for r in _rows if r and r[0] == '1')
print('  表头[9]/[10]/[11] =', repr(_hdr[9]), repr(_hdr[10]), repr(_hdr[11]))
print('  样例 id=1 第10列(简版英文 desc) =', repr(_r1[10]))
print('  样例 id=1 第11列(详细英文 lDesc) =', repr(_r1[11]))
ck('描述' in _hdr[10] and '详细' in _hdr[11], 'CSV 第10列=描述 / 第11列=详细描述')
_ok = 0
for r in _rows[1:60]:
    if len(r) > 11 and re.search(r'[A-Za-z]{3,}', r[10]) and re.search(r'[A-Za-z]{3,}', r[11]):
        _ok += 1
ck(_ok > 50, '前 59 行第10/11列均为英文文本', _ok)

# ---------------------------------------------------------------- D5 templates
print('\n[7] D5 模板扩充（12 → 18）')
TP = D['templates']
ck(len(TP) == 18 and 18 <= len(TP) <= 20, 'templates == 18', len(TP))
_base = ['雨天速攻', '晴天速攻', '沙暴联防', '雪天堡垒', '电气场地速攻', '精神场地特攻',
         '青草场地回复', '薄雾场地龙盾', '强化清场轴', '顺风游击', '戏法空间', '钉子受队']
ck(all(n in [t['name'] for t in TP] for n in _base), '既有 12 套全部保留')
_need = ['毒钉受队', '强化接力', '天气双核', '场地控制', '吸血站场', '双天气轮换']
ck(all(n in [t['name'] for t in TP] for n in _need), '6 套新增模板齐备')
_flds = {'name', 'theme', 'roles', 'keys', 'match', 'counters', 'flow', 'tips'}
ck(all(_flds <= set(t) for t in TP), '全部模板字段同构（name/theme/roles/keys/match/counters/flow/tips）')
ck(all(isinstance(t['match'], dict) and {'abis', 'moves', 'types'} <= set(t['match']) for t in TP),
   'match 结构一致（abis/moves/types）')
ck(all(t['keys'] and t['roles'] and t['flow'] and len(t['tips']) >= 3 for t in TP), '各字段非空 / tips ≥ 3')
_badname = []
for t in TP:
    for kind, n in t['keys']:
        pool = ab_zh if kind == '特性' else (mv_zh if kind == '招式' else it_zh)
        if n not in pool:
            _badname.append((t['name'], kind, n))
ck(not _badname, '全部模板 keys（特性/招式/道具名）可解析', _badname[:5])
_new = [t for t in TP if t['name'] in _need]
_badnum = []
for t in _new:
    for tip in t['tips']:
        if re.search(r'\d+\s*%|×\s*[\d.]+|[\d.]+\s*倍|[\d.]+\s*倍率', tip):
            _badnum.append((t['name'], tip))
ck(not _badnum, '新增 6 套 tips 未写死数值（无 %/×N/N倍 硬编码）', _badnum[:3])
_wref = sum(1 for t in _new for tip in t['tips'] if 'WCONF' in tip)
ck(_wref >= 6, '新增模板 tips 引用 WCONF 语义', _wref)
_tipnames = ['自信过度', '冰鳞粉', '火鳞粉', '不服输', '多重鳞片', '毛皮大衣', '腐蚀', '免疫', '再生力', '威吓']
_miss2 = [n for n in _tipnames if n not in ab_zh]
ck(not _miss2, '新增 tips 提及的特性名可解析', _miss2)
print('\n  -- 新增模板清单 --')
for t in _new:
    print('   * %-6s | %s' % (t['name'], t['theme']))
print('\n  -- 全部 18 套 --')
print('   ', ' / '.join(t['name'] for t in TP))

# ---------------------------------------------------------------- MATCHUP_SP
print('\n[8] MATCHUP_SP 预计算矩阵（{攻属性:{spId:倍率}} 稀疏；口径 = 天性档 defCellTrio(s,at).inn）')
MS = D.get('matchupSp')
TYPES = D['types']
MU = D['matchup']
TI = {t: i for i, t in enumerate(TYPES)}
SPD = {str(s['id']): s for s in D['species']}
TAGS = D['abiTags']
_NM = {}
for _a in D['abilities']:
    _NM[_a[1]] = _a[0]
    if _a[2]:
        _NM[_a[2]] = _a[0]
for _k, _v in (D.get('abiAlias') or {}).items():
    if _k not in _NM:
        _NM[_k] = str(_v)          # 别名值在 JSON 里是 int；引擎 JS 侧 obj[688] 等价 obj['688']

ck(isinstance(MS, dict) and len(MS) > 0, 'matchupSp 为 dict', len(MS) if isinstance(MS, dict) else type(MS))
ck(all(k in TYPES for k in MS), 'matchupSp 键均为 ERDATA.types 属性名')
ck(all(isinstance(v, dict) for v in MS.values()), 'matchupSp 值为 {spId:倍率}')
_bad_sp = [k for v in MS.values() for k in v if k not in SPD]
ck(not _bad_sp, 'matchupSp 的 spId 均存在于 species', len(_bad_sp))
_vals = set(x for v in MS.values() for x in v.values())
ck(_vals <= {0, 0.125, 0.25, 0.5, 2, 4}, '倍率档位 ⊆ {0,0.125,0.25,0.5,2,4}', sorted(_vals))
ck(1 not in _vals, '稀疏性：不存在倍率 = 1 的格（未列出即 1×）')
_cells = sum(len(v) for v in MS.values())
_sp_hit = len({k for v in MS.values() for k in v})
ck(_cells > 14000, '非 1 格数（规模）', _cells)
ck(_sp_hit > 1800, '有非 1 格的物种数', _sp_hit)
ck(len([x for x in _vals if x == 0]) == 1 and sum(1 for v in MS.values() for x in v.values() if x == 0) > 1000,
   '存在 0×（免疫）档', sum(1 for v in MS.values() for x in v.values() if x == 0))
ck(any(x == 4 for v in MS.values() for x in v.values()), '存在 4×（双弱点）档')
ck(any(x == 0.25 for v in MS.values() for x in v.values()), '存在 0.25× 档')
_allneu = [t for t in TYPES if t not in MS]
ck(set(_allneu) <= {'星晶', '无', '神秘'}, '缺失的攻击属性仅限全中性属性（星晶/无/神秘）', _allneu)

# —— 独立重算全量比对（不读 build_tool_data 的中间态，纯从 ERDATA 推）——
def _dec(c):
    return 0 if c == 0 else (2 if c == 2 else (0.5 if c in (0.5, 3) else 1))

def _mul(defs, at):
    m = 1
    for dt in defs:
        j = TI.get(dt)
        if j is None:
            continue
        v = _dec(MU[j][TI[at]])
        if v == 0:
            return 0
        m *= v
    return m

def _recompute():
    out = {}
    for at in TYPES:
        col = {}
        for s in D['species']:
            base = []
            for t in (s['t1'], s['t2']):
                if t and t != '-' and t not in base:
                    base.append(t)
            add, im, hf = [], False, False
            for n in s['inns']:
                aid = _NM.get(n)
                g = TAGS.get(aid) if aid else None
                if not g:
                    continue
                for x in (g.get('add') or []):
                    if x not in add:
                        add.append(x)
                if at in (g.get('im') or []):
                    im = True
                if at in (g.get('hf') or []):
                    hf = True
            v = _mul(base + [x for x in add if x not in base], at)
            if im:
                v = 0
            elif hf:
                v *= 0.5
            if v != 1:
                col[str(s['id'])] = v
        if col:
            out[at] = col
    return out

_RC = _recompute()
_diff = []
if MS is not None:
    for t in set(list(_RC) + list(MS)):
        a, b = _RC.get(t, {}), MS.get(t, {})
        for k in set(list(a) + list(b)):
            if a.get(k, 1) != b.get(k, 1):
                _diff.append((t, k, a.get(k, 1), b.get(k, 1)))
ck(not _diff, '独立重算 21×1906 全量比对一致（0 处不符）', _diff[:5])
print('    独立重算规模：%d 个攻击属性 / %d 格' % (len(_RC), sum(len(v) for v in _RC.values())))

# —— 抽样金标（人手从 21×21 表 + ABI_TAGS 推）——
_GOLD = {
    '980':  {'水': 0, '电': 0, '毒': 0.25, '格斗': 0.5, '虫': 0.5, '岩石': 0.5, '妖精': 0.5,
             '冰': 2, '地面': 2, '超能力': 2, '草': 1, '火': 1, '恶': 1},
    '642':  {'电': 0, '地面': 0, '冰': 2, '岩石': 2, '飞行': 0.5, '钢': 0.5, '草': 0.5, '格斗': 0.5,
             '毒': 1, '水': 1},
    '2667': {'电': 2, '地面': 0, '岩石': 2, '钢': 0.25, '火': 0.5, '水': 0.5, '虫': 0.5, '飞行': 0.5,
             '冰': 1, '草': 1, '一般': 1},
    '250':  {'地面': 0, '水': 2, '岩石': 2, '毒': 2, '虫': 0.25, '龙': 0, '恶': 0.5, '火': 0.5,
             '冰': 0.5, '草': 0.5, '妖精': 0.5, '格斗': 0.5, '电': 1},
    '34':   {'超能力': 2, '电': 0, '水': 2, '冰': 2, '地面': 2, '毒': 0.25, '格斗': 0.5, '虫': 0.5,
             '岩石': 0.5, '妖精': 0.5},   # 任务书预期「超 0.5」→ 真实数据为 2（无 ABI_TAGS 命中），见报告登记
    '2232': {'水': 0, '电': 0, '毒': 0.25, '冰': 2, '地面': 2},
    '130':  {'电': 4},                    # 暴鲤龙 水/飞行（无 add）→ 4×：与 Storming 的 2× 形成对照
    '2666': {'电': 2},                    # Breezing（同 Storming 配置）
}
_badg = []
for sid, exp in _GOLD.items():
    for t, want in exp.items():
        got = MS.get(t, {}).get(sid, 1)
        if got != want:
            _badg.append('%s %s: 期望 %s 实得 %s' % (sid, t, want, got))
ck(not _badg, '抽样金标 %d 项（土王/雷电云/Storming/凤王/尼多王/超级土王/暴鲤龙/Breezing）' %
   sum(len(v) for v in _GOLD.values()), _badg[:5])

# Storming「原 4 → 2」的对照：不用 add 时 = 4
_b4 = _mul(['水', '飞行'], '电')
ck(_b4 == 4 and MS.get('电', {}).get('2667') == 2,
   'Storming 电机理：水/飞行基础 = 4×，天性 add 电后 = 2×', (_b4, MS.get('电', {}).get('2667')))
_wf = [s for s in D['species'] if s['t1'] == '水' and s['t2'] == '飞行']
_wf4 = [str(s['id']) for s in _wf if MS.get('电', {}).get(str(s['id']), 1) == 4]
_wf2 = [str(s['id']) for s in _wf if MS.get('电', {}).get(str(s['id']), 1) == 2]
_p988 = [k for k, v in MS.get('电', {}).items() if v == 4]
ck(len(_wf) == 11 and len(_wf4) == 9 and sorted(_wf2) == ['2666', '2667'],
   '水/飞行 共 11 只：9 只电 = 4×（无 add）/ 仅 Storming·Breezing 2×',
   (len(_wf), len(_wf4), [SPD[k]['zh'] for k in _wf2]))
ck(len(_p988) > 0, '仍存在 电 = 4× 的物种（全库）', len(_p988))
print('\n  -- MATCHUP_SP 规模 --')
print('   攻击属性 %d 个（全中性 %s 不入表）| 非 1 格 %d | 有格物种 %d | 档位 %s'
      % (len(MS), '/'.join(_allneu), _cells, _sp_hit, sorted(_vals)))
print('   其中 0×（免疫）%d 格 / 0.125× %d 格 / 0.25× %d 格 / 0.5× %d 格 / 2× %d 格 / 4× %d 格'
      % tuple([sum(1 for v in MS.values() for x in v.values() if x == z) for z in (0, 0.125, 0.25, 0.5, 2, 4)]))
print('   -- 抽样（实际承受倍率）--')
for sid in ('980', '642', '2667', '250', '34'):
    print('   * %s %s(%s/%s) → %s' % (sid, SPD[sid]['zh'], SPD[sid]['t1'], SPD[sid]['t2'],
          ' '.join('%s=%s' % (t, MS.get(t, {}).get(sid, 1)) for t in TYPES if MS.get(t, {}).get(sid, 1) != 1)))

# ---------------------------------------------------------------- 汇总
print('\n' + '=' * 78)
print('探针结果: PASS %d / FAIL %d' % (len(PASS), len(FAIL)))
if FAIL:
    print('失败项:')
    for f in FAIL:
        print('  -', f)
else:
    print('全部通过 ✓')
print('=' * 78)
sys.exit(1 if FAIL else 0)
