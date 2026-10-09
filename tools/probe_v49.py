# -*- coding: utf-8 -*-
"""v4.9 数据层探针：schema / 契约零破坏 / 唯一性 / 体积 / 既有计数 实测

用法：
  python tools\probe_v49.py --pre <v4.6.4 备份 data.js> [--head <同环境 HEAD 脚本重跑产物>]
说明：
  --pre  用于既有计数零回归比对；sprites 字节会因构建环境（PIL/zlib）重编码而漂移，
         该漂移已由 --head（同环境、改动前脚本重跑）证伪归属（见 _v49_delta_proof.py），
         且 228 条漂移经 PIL 逐像素比对为“像素完全一致”。
  --head 提供时额外断言：sprites 与 v4.9 产物逐字节相同（同环境确定性）。
输出：每条 PASS/FAIL + 实际值；有 FAIL 时退出码 1。
"""
import json
import re
import sys

BASE = r'D:\game\elite-redux'
WS = r'C:\Users\22210\AppData\Local\Doubao\User Data\Default\.doubao\agent_mode\workspace\.sessions\38445687001085442\agents\s_000c8ZJnpeo\scratch'
PRE = WS + r'\_pre_v49_data.js'
HEAD = None
argv = sys.argv[1:]
for i, a in enumerate(argv):
    if a == '--pre' and i + 1 < len(argv):
        PRE = argv[i + 1]
    if a == '--head' and i + 1 < len(argv):
        HEAD = argv[i + 1]

FAIL = []


def ck(name, got, want=None, ok=None):
    if ok is None:
        ok = (got == want)
    print('%s %-58s 实际=%s%s' % ('PASS' if ok else 'FAIL', name,
                                  json.dumps(got, ensure_ascii=False)[:200],
                                  ('' if want is None else '  期望=%s' % json.dumps(want, ensure_ascii=False)[:100])))
    if not ok:
        FAIL.append(name)
    return ok


def load(path):
    txt = open(path, encoding='utf-8').read()
    cur = json.JSONDecoder().raw_decode(txt[re.search(r'var ERDATA\s*=\s*', txt).end():])[0]
    return txt, cur


print('=== 0. 载入 ===')
tN, D = load(BASE + r'\配招工具_data.js')
tP, O = load(PRE)
H = load(HEAD)[1] if HEAD else None
print('v4.9 data.js %d B | v4.6.4 备份 %d B | 同环境 HEAD 基线 %s' % (
    len(tN.encode('utf-8')), len(tP.encode('utf-8')),
    ('%d B' % len(open(HEAD, encoding='utf-8').read().encode('utf-8'))) if HEAD else '(未提供)'))

print('\n=== 1. 顶层 schema：仅 +2 新键 ===')
ck('顶层键数', len(D), len(O) + 2)
ck('新增键恰为 tacticRole/synergyRole', sorted(set(D) - set(O)), ['synergyRole', 'tacticRole'])
ck('无既有键丢失', sorted(set(O) - set(D)), [])
_eq = [k for k in O if k not in ('moves', 'abilities', 'sprites')
       and json.dumps(D[k], ensure_ascii=False, sort_keys=True) != json.dumps(O[k], ensure_ascii=False, sort_keys=True)]
ck('其余 18 既有键逐键逐值全等', _eq, [])
_d = [k for k in O if json.dumps(D[k], ensure_ascii=False, sort_keys=True) != json.dumps(O[k], ensure_ascii=False, sort_keys=True)]
ck('全部差异键 ⊆ {moves,abilities,sprites}（新键除外）', sorted(set(_d) - {'moves', 'abilities', 'sprites'}), [])

print('\n=== 2. 计数零回归（v4.6.4 基线）===')
cnt = lambda o: {'types': len(o['types']), 'matchup': len(o['matchup']), 'matchupRowLen': sorted({len(r) for r in o['matchup']}),
                 'moves': len(o['moves']), 'species': len(o['species']), 'items': len(o['items']), 'abilities': len(o['abilities']),
                 'abiTags': len(o['abiTags']), 'abiAlias': len(o['abiAlias']), 'templates': len(o['templates']),
                 'coreNotes': len(o['coreNotes']), 'movesNotes': len(o['movesNotes']), 'nonFinal': len(o['nonFinal']),
                 'mvDescZh': len(o['mvDescZh']), 'abiDescZh': len(o['abiDescZh']), 'sysSet': len(o['sysSet']),
                 'familyRoot': len(o['familyRoot']), 'glossary': len(o['glossary']),
                 'matchupSpAttr': len(o['matchupSp']), 'matchupSpCells': sum(len(v) for v in o['matchupSp'].values()),
                 'usagePrior': len(o['usagePrior']), 'sprites': len(o['sprites'])}
cN, cP = cnt(D), cnt(O)
for k in sorted(cP):
    ck('计数 %s' % k, cN[k], cP[k])
ck('matchup 21×21 方阵', [cN['matchup'], cN['matchupRowLen']], [21, [21]])
ck('moves lDesc 非空', sum(1 for r in D['moves'] if r[10]), 1031)
ck('nonFinal（Eviolite 扩展基线）', cN['nonFinal'], 653)
ck('usagePrior（弱先验）', cN['usagePrior'], 747)
ck('usageMeta.month', D['usageMeta'].get('month'), '2026-09')
ck('abiTags conv 条数（-ate 9 条）', sum(1 for v in D['abiTags'].values() if v.get('conv')), 9)

print('\n=== 3. 位置契约：行前缀零改动 + 行末新列 ===')
om = {r[0]: r for r in O['moves']}
oa = {r[0]: r for r in O['abilities']}
ck('moves 行全长', sorted({len(r) for r in D['moves']}), [12])
ck('abilities 行全长', sorted({len(r) for r in D['abilities']}), [5])
bad_m = [r[0] for r in D['moves'] if r[0] not in om or r[0:11] != om[r[0]]]
bad_a = [r[0] for r in D['abilities'] if r[0] not in oa or r[0:4] != oa[r[0]]]
ck('moves 全 1032 行前缀 0..10 与旧版全等', len(bad_m), 0)
ck('abilities 全 1034 行前缀 0..3 与旧版全等', len(bad_a), 0)
ck('行末列类型均为 list', [sorted({type(r[11]).__name__ for r in D['moves']}),
                            sorted({type(r[4]).__name__ for r in D['abilities']})], [['list'], ['list']])
ck('行末列 == 同名顶层映射（moves）', sum(1 for r in D['moves'] if r[11] != D['tacticRole'].get(r[0])), 0)
ck('行末列 == 同名顶层映射（abilities）', sum(1 for r in D['abilities'] if r[4] != D['synergyRole'].get(r[0])), 0)

print('\n=== 4. tacticRole / synergyRole 结构与抽样 ===')
ck('tacticRole 条数', len(D['tacticRole']), 1032)
ck('synergyRole 条数', len(D['synergyRole']), 1034)
ck('tacticRole 键 == moves id 集', sorted(D['tacticRole']) == sorted(r[0] for r in D['moves']), True)
ck('synergyRole 键 == abilities id 集', sorted(D['synergyRole']) == sorted(r[0] for r in D['abilities']), True)
n_t = sum(1 for v in D['tacticRole'].values() if v)
n_s = sum(1 for v in D['synergyRole'].values() if v)
ck('tacticRole 已标注条数 == 236', n_t, 236)
ck('synergyRole 已标注条数 == 104', n_s, 104)
ck('值全为 str 列表', [sorted({type(x).__name__ for v in D['tacticRole'].values() for x in v}),
                        sorted({type(x).__name__ for v in D['synergyRole'].values() for x in v})], [['str'], ['str']])
mvn = {r[0]: r[1] for r in D['moves']}
abn = {r[0]: r[2] for r in D['abilities']}
print('  — 招式抽样 —')
for mid in ('191', '390', '446', '564', '229', '432', '14', '349', '417', '504', '240', '433', '366', '92', '73',
            '164', '369', '202', '63', '389', '182', '987'):
    print('    %-5s %-14s %s' % (mid, mvn.get(mid, '?'), json.dumps(D['tacticRole'].get(mid), ensure_ascii=False)))
print('  — 特性抽样 —')
for aid in ('2', '989', '70', '45', '117', '226', '834', '33', '34', '146', '202', '42', '23', '71', '144',
            '96', '280', '659', '182', '98', '109', '22', '158', '94', '935', '11', '26'):
    print('    %-5s %-14s %s' % (aid, abn.get(aid, '?'), json.dumps(D['synergyRole'].get(aid), ensure_ascii=False)))
ck('悠游自如33 == 雨天速度位（×1.5）', D['synergyRole'].get('33'), ['雨天速度位（×1.5）'])
ck('磁力42 == 捕钢陷阱', D['synergyRole'].get('42'), ['捕钢陷阱'])
ck('一般皮肤96 == 转换位·一般（源一般）', D['synergyRole'].get('96'), ['转换位·一般（源一般）'])
ck('结晶化280 == 转换位·冰（源岩石）', D['synergyRole'].get('280'), ['转换位·冰（源岩石）'])
ck('超导体659 == 转换位·电（源钢）', D['synergyRole'].get('659'), ['转换位·电（源钢）'])
ck('撒菱191 == 撒钉', D['tacticRole'].get('191'), ['撒钉'])
ck('剑舞14 == 强化·物攻', D['tacticRole'].get('14'), ['强化·物攻'])
ck('戏法空间433 含 低速轴核心', '低速轴核心' in (D['tacticRole'].get('433') or []), True)
ck('清除浓雾432 含 除钉·双方', '除钉·双方' in (D['tacticRole'].get('432') or []), True)
ck('高速旋转229 含 除钉·自身侧', '除钉·自身侧' in (D['tacticRole'].get('229') or []), True)
_t, _s = {}, {}
for v in D['tacticRole'].values():
    for x in v:
        _t[x] = _t.get(x, 0) + 1
for v in D['synergyRole'].values():
    for x in v:
        _s[x] = _s.get(x, 0) + 1
print('  tacticRole 标签（%d 种）: %s' % (len(_t), json.dumps(_t, ensure_ascii=False)))
print('  synergyRole 标签（%d 种）: %s' % (len(_s), json.dumps(_s, ensure_ascii=False)))

print('\n=== 5. axis_lib.json（引擎消费契约）===')
AX = json.load(open(BASE + r'\nn_data\axis_lib.json', encoding='utf-8'))
CH = json.load(open(BASE + r'\nn_data\axis_lib_check.json', encoding='utf-8'))
ck('axis_lib 为 JSON 数组', type(AX).__name__, 'list')
ck('轴数 ∈ [12,15]', len(AX), ok=(12 <= len(AX) <= 15))
ck('轴 id 唯一', len({a['id'] for a in AX}), len(AX))
SC = {'id', 'name', '轴手判定', '受益者判定', '联动说明', '弱点体系', '依据'}
ck('每轴字段集 == schema', sorted({k for a in AX for k in a}), sorted(SC))
ck('轴手判定字段集', sorted({k for a in AX for k in a['轴手判定']}), ['ability_tags', 'moves', 'role'])
ck('受益者判定字段集', sorted({k for a in AX for k in a['受益者判定']}), ['ability_tags', 'immune_types', 'moves', 'speed_or_power_rule'])
ck('弱点体系元素字段集', sorted({k for a in AX for w in a['弱点体系'] for k in w}), ['threat', '建议'])
print('  轴 id/名: %s' % ' / '.join('%s=%s' % (a['id'], a['name']) for a in AX))
for a in AX:
    print('    %-10s 轴手(特性%d|招%d) 受益(特性%d|招%d|免伤%s) 弱点%d 依据%d' % (
        a['id'], len(a['轴手判定']['ability_tags']), len(a['轴手判定']['moves']),
        len(a['受益者判定']['ability_tags']), len(a['受益者判定']['moves']),
        json.dumps(a['受益者判定']['immune_types'], ensure_ascii=False), len(a['弱点体系']), len(a['依据'])))
ck('check: 轴手标签全局互斥', CH['setter_tags_disjoint'], True)
ck('check: 冲突列表为空', CH['setter_tag_conflicts'], [])
ck('check: 依据来源全可解析（无编造）', CH['依据可解析'], True)
print('  受益者共享标签（跨轴，已登记 %d 组）: %s' % (len(CH['beneficiary_tags_shared']),
                                                    json.dumps(CH['beneficiary_tags_shared'], ensure_ascii=False)))
_bad = [s for a in AX for s in a['依据'] if not re.search(
    r'(克制表|GLOSSARY\.|ABI_TAGS\[|SYS_SET_MAP|abilities\[|FUNC_MV\.|MOVES_NOTES\[|TEMPLATES\[|gameData\.|核心分类)', s)]
ck('每条依据均带可查来源 token', len(_bad), 0)

print('\n=== 6. 体积（红线 +15%）===')
bN, bP = len(tN.encode('utf-8')), len(tP.encode('utf-8'))
print('对比 v4.6.4 备份：%d B → %d B（Δ%+d B / %+.3f%%）| 红线 %d B' % (bP, bN, bN - bP, (bN - bP) * 100.0 / bP, int(bP * 1.15)))
ck('相对备份增量 < 15%', (bN - bP) * 100.0 / bP < 15, True)
if HEAD:
    bH = len(open(HEAD, encoding='utf-8').read().encode('utf-8'))
    print('对比同环境 HEAD 基线：%d B → %d B（Δ%+d B / %+.3f%%；其中 sprites 环境漂移 %+d B）'
          % (bH, bN, bN - bH, (bN - bH) * 100.0 / bH, bH - bP))
    print('axis_lib.json %d B（独立文件，不占 data.js payload）' % len(open(BASE + r'\nn_data\axis_lib.json', 'rb').read()))

print('\n=== 7. 同环境确定性与 sprites ===')
ck('sprites 键集与旧版一致', sorted(D['sprites']) == sorted(O['sprites']), True)
ck('sprites 空值数（“缺失 1”为既有）', [sum(1 for v in D['sprites'].values() if not v),
                                            sum(1 for v in O['sprites'].values() if not v)], [0, 0])
if H:
    nd = len([k for k in D['sprites'] if D['sprites'][k] != H['sprites'].get(k)])
    ck('同环境 HEAD 基线：sprites 逐字节相同（漂移=0）', nd, 0)
    ck('同环境 HEAD 基线：sprites 键集相同', sorted(D['sprites']) == sorted(H['sprites']), True)
ck('usageMeta 逐值一致', D['usageMeta'], O['usageMeta'])
ck('abiTags[96/280/659] conv 保持', [D['abiTags'][k].get('conv') for k in ('96', '280', '659')], ['一般', '冰', '电'])
ck('movesNotes[432] 保持考古定稿文案', D['movesNotes'].get('432'),
   '清除浓雾：清双方钉子、墙仅对手侧（源码实证）；降闪避1级待实测')

print('\n=== 结果 ===')
print('FAIL %d 项：%s' % (len(FAIL), json.dumps(FAIL, ensure_ascii=False)))
sys.exit(1 if FAIL else 0)
