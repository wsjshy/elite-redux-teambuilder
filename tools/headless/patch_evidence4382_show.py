# -*- coding: utf-8 -*-
import io, os
ROOT = r'D:\game\elite-redux'
p = os.path.join(ROOT, 'tools', 'headless', 'out_v4382_probe.txt')
with io.open(p, 'r', encoding='utf-8', newline='') as f:
    t = f.read()

section = (
"\n===== 展示层收尾（补丁 f_show：卡名不含「速攻」但文案残留「速攻」字样，纯展示不改引擎）=====\n"
"探针 probe_show4382c.js（allTeam=[26,65,96,80,37,208] 带队；口径：流派名不含「速攻」，但 ev.template / desc / why 文案含「速攻」）。\n"
"总命中 872 张，分三组（互斥，按来源字段归类）：\n"
"  A. EV 模板名「速攻」渲染上屏：731（引擎 ev.template 原值即字符串「速攻」；全库模板=速攻 共 1164，其中 433 张卡名仍冠速攻、731 张已不冠速攻）。上屏位置：③典型用法「模板「速攻」」、候选列表 EV 行、努力值分配条、努力值弹层正文/标题、分配依据文案。\n"
"     处置：纯展示映射 helper evTplDisp(t)：速攻→高速线；引擎 ev.template 字段、evKind、EV alloc/数值一律未动。分配依据文案「速攻模板：252 速度抢线…」→「高速线模板：252 速度抢线…」（evWhyTxt 的 key 分支仍按引擎原值 t==='速攻' 匹配，未改判据）。\n"
"  B. 流派原始描述 desc 保留旧名（v13Demoted 降级卡）：51，全部带 v13Demoted 标记（无漏标）。\n"
"     旧名前缀分布：速攻强化清场 44 / 雪速攻强化清场 2 / 雨速攻强化清场 2 / 速攻压制 2 / 沙速攻强化清场 1。\n"
"     处置：溯源行保留不改写，渲染处补「（历史名）」前缀（流派原始描述（历史名）：…），避免被当成现值。\n"
"  C. why / 道具 why / 警告 文案含「速攻」：90，保留不改（真实评分轴 / 修正说明 / 规则 rationale，非现值冠名），细分：\n"
"     C1 奇石权衡评分轴标签「（速攻/中性：越高越优）」50；\n"
"     C2 慢速/空间误投速 EV 修正 why「命名是慢速/空间却按速攻投了 252 速度 EV…已改空间低速」23；\n"
"     C3 去速攻定位规则 why「自身无当场生效速度来源…→ 不作速攻定位」4；\n"
"     C4 速攻手规则 rationale「速攻手回合金贵…」13（天气/场地 4 + 撒钉 9）。\n"
"  C 组未动引擎文案；真实速度线描述（速度 Pxx 节奏等）原样保留，不为避讳字样删有用信息。\n"
"\n"
"样例复核：\n"
"  #57 火暴猴（95 速）：卡名「强化轮转补盲」，引擎 ev.template=速攻（字段未动），EV 4/252/0/0/0/252；③典型用法展示「模板「高速线」· 速度 P66 节奏」，不再出现速攻字样。\n"
"  #6 喷火龙：卡名「强化清场」，desc 旧名「速攻强化清场：…」，引擎层展示「流派原始描述（历史名）：速攻强化清场：…」。\n"
"\n"
"展示补丁前后门禁对照（纯展示，引擎字段零改动）：\n"
"  改前：2,010,751 B / SHA1 A20D7676EAB3409231E28180D435DA04E68E7EE6 / CRLF 23052 / bare LF 51。\n"
"  改后：2,010,920 B / SHA1 63222DCEFEFB843438FDC6D7F788AB58E3B41A76 / CRLF 23053（+1，展示 helper 行）/ bare LF 51（未增）。\n"
"  gate.js 空队口径逐项与改前一致：物种 1906 / 流派 4205 / empty [] / fatal [] / badMove 1 / dup 0 / itemsOver 0 / defOrb 0；offHist 0:275 / 1:799 / 2:552 / 3:224 / 4:48 / 5:7 / 7:1，无漂移。\n"
"  check_syntax.py 6 段全过；smoke.js 33/33；静默 catch 390（顶格未增长）；verify_speedaxis.js 四项断言 ALL PASS（97 倍率例外逐条带来源名）；verify_v4381.js / verify_sash.js 残留 0。\n"
)

if '展示层收尾（补丁 f_show' in t:
    print('section already present'); raise SystemExit(0)
t = t.rstrip('\n') + section
with io.open(p, 'w', encoding='utf-8', newline='') as f:
    f.write(t)
b = open(p, 'rb').read(); tt = b.decode('utf-8')
print('bytes', len(b), 'CRLF', tt.count('\r\n'), 'bareLF', tt.count('\n') - tt.count('\r\n'))
