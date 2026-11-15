# -*- coding: utf-8 -*-
"""v4.381 AGENTS.md 版本表新增一行：插在 v4.380 行之上。CRLF 文本级补丁，bareLF 保持 0。"""
import io, os

ROOT = r'D:\game\elite-redux'
P = os.path.join(ROOT, 'AGENTS.md')
txt = io.open(P, encoding='utf-8', newline='').read()

ANCHOR = '| v4.380 | 1,995,940 |'
assert txt.count(ANCHOR) == 1, txt.count(ANCHOR)

DESC = (
    '待线上核验（gh-pages 部署后逐字节回填 Length/SHA1；本版主题「顺风 366 纳入队伍级辅助收口，'
    '但只收脆皮 isGlassCannon：速≥100 且 bulkOf<270；中/高耐久进攻手保留不动」，是 v4.379 天气/场地、'
    'v4.380 钉子/空间/双墙同一条队伍级铁律的续推——用户追加决策：v4.380 刻意保留的顺风流重新审，'
    '探针先量化再改，不机械删）。探针量化（tools/headless/probe_tailwind_v4381.js；触发口径 side∈物理/特殊/双刀、'
    'role∈增伤/输出/强化、速≥100、非恶作剧之心、ownAutoSys 空、非 score99）：顺风 366 共 150 条 = 玻璃大炮 94 + '
    '耐久三角≥270 共 56；名以「顺风」开头 147 条。同份探针变化招频率台账：替身164(263)/剑舞14(191)/顺风366(150)/'
    '电磁波86(150)/冥想347(136)/诡计417(79)/自我激励526(52)/健美339(32)/催眠粉79(30)/守住182(19)，全为自我强化/'
    '自保/状态压制；接棒226/帮助270/广域防守469/快速防守501/交换场地502/治愈铃声215/芳香治疗312/新月舞461/'
    '治愈之愿361/临别礼物262/许愿类 本范围 0 条，0 条新类别，记入已扫清台账不再重扫。规则：触发条件在 '
    'v4.379/v4.380 同口径上再加 isGlassCannon(s)；顺风槽按 v4.380 补槽序替换（pivot 369/521 → 异属性、非蓄力、'
    '威力≥70、命中≥90 补盲 → 任意未用过非蓄力攻击招；排除两回合蓄力 566 与自爆·退场标签 '
    '{120,153,262,730,760}）；流派名去「顺风」前缀、desc 同步清理并记 nameMismatch；换招后无速度来源'
    '（无速度强化招 349/483/504/187/526 且速<110）的流派不删，why 注明「速度前提由队友顺风提供」。'
    '例外保留：耐久位 bulkOf≥270、恶作剧之心、ownAutoSys 非空、score99、role=肉盾/受队/联防/辅助、速<100。'
    '实现：finalizeBuildInPlace 内自包块紧接 v4.380 收尾锚点，前缀 _v11，收尾 catch(eV4381){eV4381.name}'
    '（非空 catch，静默 catch 仍 390 未增长）；per-build 标记 tailwindTeamRemoved/tailwindTeamNew/'
    'tailwindByTeammate 块首显式赋初值；未动 v4.380 三类规则与结构生成层。验证：gate 物种 1906、流派 4192'
    '（与 v4.380 完全一致，无增删）、empty 空、fatal 0、badMove 1（#862 历史遗留）、dup 0、itemsOver 0、'
    'defOrb 0、offHist 0:275/1:803/2:549/3:228/4:47/5:3/7:1 逐项同值；verify_v4381.js：脆皮顺风残留 0、'
    '耐久位非豁免保留 54（探针基线 56，差额 2 条 ownAutoSys 豁免 #2241 雨/#2587 晴）、豁免/范围外 160、'
    'v4.380 三类（钉子/空间/墙≥2）回归残留 0；改动 94 条、改名 91 条、注明队友顺风 43 条；玻璃被豁免 6 条'
    '（#142/#169/#198/#567/#1513 role=肉盾，#547 恶作剧之心）；6 段 node --check 全过；smoke 33/33；'
    '行尾 CRLF 22949 / bare LF 51；截图 docs/shots/v4381_*.png 待补）'
)

ROW = '| v4.381 | 2,002,166 | EA4167342172A1AA26930EAFD11945DF85E0F981 | ' + DESC + ' |'

new = txt.replace(ANCHOR, ROW + '\r\n' + ANCHOR, 1)
io.open(P, 'w', encoding='utf-8', newline='').write(new)
crlf = new.count('\r\n')
bare = new.count('\n') - crlf
print('AGENTS after CRLF', crlf, 'bareLF', bare)
print('row bytes', len(ROW.encode('utf-8')))
