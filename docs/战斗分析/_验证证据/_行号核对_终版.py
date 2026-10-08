# -*- coding: utf-8 -*-
"""行号核对（终版）：扫描 build_tool_html.py，输出交付报告所引用的全部代码锚点的**真实行号**。
用途：§1 B1~B10 的行号为实施期快照，本脚本输出收尾终版行号，供报告「附录 A」核对。
只读，不修改任何文件。
"""
import io, re

SRC = r'D:\game\elite-redux\build_tool_html.py'
with io.open(SRC, 'r', encoding='utf-8', errors='replace') as f:
    lines = f.read().split('\n')

def find(pat, regex=False, nth=1):
    hits = []
    for i, ln in enumerate(lines, 1):
        if (re.search(pat, ln) if regex else (pat in ln)):
            hits.append(i)
    return hits[:nth], len(hits)

# 名称 -> 匹配模式（默认子串匹配）
ANCHORS = [
    ('WCONF', 'var WCONF={'), ('ABI_ATE', 'var ABI_ATE={'), ('WCONF_PEND', 'var WCONF_PEND={'),
    ('pendBadge()', 'function pendBadge('), ('pct()', 'function pct('),
    ('TERRAIN_DMG', 'var TERRAIN_DMG='), ('WX_NEVERMISS', 'var WX_NEVERMISS='),
    ('wxNums()', 'function wxNums('), ('terrainNums()', 'function terrainNums('),
    ('wxRuleHtml()', 'function wxRuleHtml('), ('wxTip()', 'function wxTip('),
    ('isValidSp()', 'function isValidSp('), ('convOf()', 'function convOf('),
    ('effMvType()', 'function effMvType('), ('hitAdjOf()', 'function hitAdjOf('),
    ('ownWxList()', 'function ownWxList('), ('wxConditionMet()', 'function wxConditionMet('),
    ('costOf()', 'function costOf('), ('weatherAdjOf()', 'function weatherAdjOf('),
    ('abiAdjOf()', 'function abiAdjOf('), ('openMv()', 'function openMv('),
    ('addToTeam()', 'function addToTeam('), ('IMMUNE_RISK', 'var IMMUNE_RISK='),
    ('abiTagOf()', 'function abiTagOf('), ('defCellTrio()', 'function defCellTrio('),
    ('renderAnalyze()', 'function renderAnalyze('), ('NM2ID', 'var NM2ID={'),
    ('tplRecs()', 'function tplRecs('), ('renderTplBody()', 'function renderTplBody('),
    ('SYS_MAP', 'var SYS_MAP={'), ('SYS_SET', 'var SYS_SET={'), ('FUNC_MV', 'var FUNC_MV={'),
    ('MV_TAGS', 'var MV_TAGS={'), ('funcWeight()', 'function funcWeight('),
    ('pickFuncs()', 'function pickFuncs('), ('coreSys()', 'function coreSys('),
    ('coreRole()', 'function coreRole('), ('coreTags()', 'function coreTags('),
    ('coreIntensity()', 'function coreIntensity('), ('atkCover()', 'function atkCover('),
    ('setCoverProfile()', 'function setCoverProfile('), ('blindList()', 'function blindList('),
    ('whyHtml()', 'function whyHtml('), ('pickAttacks()', 'function pickAttacks('),
    ('buildMoves()', 'function buildMoves('), ('genBuilds()', 'function genBuilds('),
    ('findTeammates()', 'function findTeammates('), ('renderCore()', 'function renderCore('),
    ('initRuleBoxes()', 'function initRuleBoxes('),
    ('abiIdByZhOrEn()', 'function abiIdByZhOrEn('), ('renderAtk()', 'function renderAtk('),
    ('renderDef()', 'function renderDef('), ('openSp()', 'function openSp('),
    ('coreAbiPick()', 'function coreAbiPick('), ('pickAbiFor()', 'function pickAbiFor('),
    ('defMult()', 'function defMult('),
]
SUB = [
    ('B1 勾选分支（天性 im 叠加）', "if(ih.im[at]==='天性')opt=0"),
    ('B3/B6 除钉标签（mid=m[0]*1）', 'var mid=m[0]*1'),
    ('B6 FUNC_MV.hazard 行', 'hazard:[191'),
    ('B6 FUNC_MV.removal 行', 'removal:[229'),
    ('B6 removal 权重 0', 'removal:0'),
    ('B8 tips 过 wxTip', 'wxTip(tp)'),
    ('B8 flow 过 wxTip', 'wxTip(f)'),
    ('B8 机制数值块（模板）', '机制数值'),
    ('B9 分层2 侧过滤', "if(side!=='双刀'&&m[4]!=="),
    ('B9 分层3 打分 sc=', 'var sc=pow*('),
    ('B9 分层4 覆盖贪心（atkCover 调用）', 'atkCover(s,id)'),
    ('B9 分层4 首槽本系 +30', '首槽本系'),
    ('B9 分层5 盲点（renderCore 内）', 'blindList('),
    ('B10 天气数值卡（renderCore 内）', '天气 / 场地数值'),
    ('B2 耐久口径文案（renderCore 内）', '耐久口径'),
    ('B2 耐久定义（coreIntensity 内）', 'var phys=b[1]+b[2]'),
    ('B7 renderCore 入口护栏', '占位/无效物种'),
    ('补丁1 别名回退（abiIdByZhOrEn 内）', 'ERDATA.abiAlias&&ERDATA.abiAlias[n]'),
    ('补丁2 无对手降权 0.7（abiAdjOf 内）', 'best.mul=0.7'),
    ('补丁2 降权提示文案', '无明确对手，按规格 B9 保守降权 ×0.7'),
    ('补丁1 abiDesc 调用点', 'var id=abiIdByZhOrEn(n)'),
    ('克制表 UI 分组标记（renderAtk）', "class=\"k2\""),
]
print('=== A. 顶层锚点（函数/常量起始行） ===')
for name, pat in ANCHORS:
    hit, total = find(pat)
    print('%-22s %s%s' % (name, ('L%d' % hit[0]) if hit else '（未找到）', ('  ← 命中 %d 处!' % total) if total > 1 else ''))
print()
print('=== B. 子锚点（行内特征） ===')
for name, pat in SUB:
    hit, total = find(pat)
    print('%-34s %s%s' % (name, ('L%d' % hit[0]) if hit else '（未找到）', ('  ← 命中 %d 处' % total) if total > 1 else ''))
print()
print('=== C. isValidSp 全部接入点 ===')
hit, total = find('isValidSp(', nth=99)
print('共 %d 处：%s' % (total, ', '.join('L%d' % h for h in hit)))
print()
print('=== D. abiIdByZhOrEn / abiTagOf 全部调用点（补丁 1 影响面） ===')
for pat in ('abiIdByZhOrEn(', 'abiTagOf('):
    hit, total = find(pat, nth=99)
    print('%-18s 共 %d 处：%s' % (pat, total, ', '.join('L%d' % h for h in hit)))
print()
print('源文件行数 =', len(lines))
