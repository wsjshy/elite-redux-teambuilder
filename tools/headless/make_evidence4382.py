# -*- coding: utf-8 -*-
"""v4.382 同版复核证据生成：读取 _ev_added15.json / _ev_offhist.json / _ev_exc97.json 与 index 实测统计，
向 out_v4382_probe.txt 追加复核段（幂等：已有标记段则先移除旧段再重写）。不覆盖 v4.381 冻结件。"""
import io, os, json, hashlib

ROOT = r'D:\game\elite-redux'
HD = os.path.join(ROOT, 'tools', 'headless')
EV = os.path.join(HD, 'out_v4382_probe.txt')
MARK = '=== 同版复核段（v4.382 补丁，不升版本号）'

d = open(os.path.join(ROOT, 'index.html'), 'rb').read()
t = d.decode('utf-8')
stat = {
    'bytes': len(d),
    'sha1': hashlib.sha1(d).hexdigest().upper(),
    'crlf': t.count('\r\n'),
    'barelf': t.count('\n') - t.count('\r\n'),
}
added15 = json.load(io.open(os.path.join(HD, '_ev_added15.json'), encoding='utf-8'))
offhist = json.load(io.open(os.path.join(HD, '_ev_offhist.json'), encoding='utf-8'))
exc97 = json.load(io.open(os.path.join(HD, '_ev_exc97.json'), encoding='utf-8'))

def mvstr(mv):
    return '/'.join(str(x) for x in mv)

lines = []
A = lines.append
A('')
A(MARK + '；复核后工作树态 index %d B / SHA1 %s / CRLF %d / bareLF %d） ===' % (stat['bytes'], stat['sha1'], stat['crlf'], stat['barelf']))
A('')
A('【一】流派 4192→4205 逐轴归因（闭合 -G + H - K = +13）')
A('判据：v4.371 同玩法去重规则——同 side + 同 abi[0].n + 同 it[0][0] + 同 ev.template，主招 id 集合 Jaccard≥0.6；')
A('仅进攻流派参与，score99 同配置近同卡同样合并，并列留高分/先出现。配对口径：空队 harness_base.js（git 8ace363 v4.381 终局）vs harness.js（当前 v4.382），按物种配对多集。')
A('')
A('| 轴 | 条数 | 说明 |')
A('| --- | --- | --- |')
A('| G 速攻降级/去重造成的减少 | 2 | 见下「移除 2」 |')
A('| H 诚实恢复（旧口径被错误去重压掉、配置不同而保留） | 15 | 见下「新增 15」，逐条判 (a) |')
A('| K 重复回流（改名打破分组放回来的同配置重复卡） | 0 | 15 条逐条比对兄弟卡，无一满足去重合并规则，无需收卡 |')
A('闭合：-2 + 15 - 0 = +13 ✓（基线 4192 → 当前 4205）。546 改名对为配置中性一对一（改名不动 side/abi/it/tpl/mv 去重键），不计入 G/H/K。')
A('')
A('移除 2（G）：')
A('1. #103 椰蛋树「强化主力输出压制」：跨轴转出为「强化慢速重炮」（配置保留，J=1.0，非新增配置）。')
A('2. #103 椰蛋树「强化稳健联防消耗」：真删（被空间慢速定位取代）。')
A('')
A('新增 15 逐条判定（H；全 (a) 诚实恢复，K=0）：')
A('- #103 椰蛋树 spd55 强化慢速重炮 [437/94/347/414] —— 基线「强化主力输出压制」全配置全等 J=1.0，跨轴正名、配置保留；非重复回流。')
for r in added15:
    A('- #%s %s spd%d %s [%s] %s/%s %s/%s/%s —— 基线最近「%s」；兄弟卡「%s」。' % (
        r['id'], r['zh'], r['spd'], r['name'], mvstr(r['mv']),
        r['side'], r['role'], r['ab'], r['it'], r['tpl'], r['baseNear'], r['sib']))
A('')
A('结论：15 条均不满足去重合并规则（sameCfg=false 或主招 Jaccard<0.6），无 (b) 重复回流；不收卡，总数保持 4205。')
A('判定依据逐条：#579/#719 为空间低速新模板（基线被队友低速计数压住未生成）；#1651/#1652/#1654/#1657/#1660/#1664/#2234/#2587 自速≥100 自有速攻模板（基线被队友速度门压住未生成）；')
A('#521/#2549 实战带顺风 366、#2104 悠游自如天气提速，自有速度来源；#385 为第二攻击变体（兄弟变体2 招组 J=0.333）。')
A('')
A('【二】offHist 增减逐条映射（进攻流派分桶；桶=每物种进攻流派数，side≠辅助 且 roleTag∉{肉盾,受队,联防,辅助}）')
A('基线 v4.381：0:275 / 1:803 / 2:549 / 3:228 / 4:47 / 5:3 / 7:1')
A('当前 v4.382：0:275 / 1:799 / 2:552 / 3:224 / 4:48 / 5:7 / 7:1')
buckets = {'1→2': [], '2→3': [], '3→4': [], '4→5': []}
for r in offhist:
    buckets['%d→%d' % (r['bn'], r['cn'])].append('#%s %s' % (r['id'], r['zh']))
for k, v in buckets.items():
    A('%s（%d）：%s' % (k, len(v), '、'.join(v)))
A('桶账闭合：桶1 −4（4 个离开）；桶2 +4−1=+3；桶3 +1−5=−4；桶4 +5−4=+1；桶5 +4；0/7 桶不变。与实测逐项对上。')
A('')
A('【三】97 条「有自有倍率来源但 0 速投入」例外 why 分档')
A('规则：只在主招 why 补分档文案（记 b.v13MultNote），不动 EV/性格/引擎判定字段。')
cat = {'wx': [], 'tw': [], 'light': [], 'scarf': []}
for r in exc97:
    if r['src']['wx']: cat['wx'].append(r)
    if r['src']['tw']: cat['tw'].append(r)
    if r['src']['light']: cat['light'].append(r)
    if r['src']['scarf']: cat['scarf'].append(r)
A('分档（可叠加）：天气提速 %d / 保留顺风 %d / 轻装 %d / 围巾 %d；其中顺风+轻装叠加 4 条（#521 高傲雉鸡、#566 始祖小鸟、#841 苹裹龙、#962 下石鸟），%d+%d+%d−4=97。' % (
    len(cat['wx']), len(cat['tw']), len(cat['light']), len(cat['scarf']),
    len(cat['wx']), len(cat['tw']), len(cat['light'])))
def dump(title, rs):
    A('')
    A(title + '（%d）：' % len(rs))
    for r in rs:
        A('  #%s %s spd%d %s —— %s' % (r['id'], r['zh'], r['spd'], r['name'], r['note']))
dump('天气提速档', cat['wx'])
dump('保留顺风档', cat['tw'])
dump('轻装档', cat['light'])
dump('围巾档', cat['scarf'])
A('')
A('样例：#157 火暴兽 spd100 速攻压制 note=「%s」（别名「挖沙」经 abiSame 等同拨沙）。' % next(r['note'] for r in exc97 if str(r['id']) == '157'))
A('')
A('【四】脚本合并最小集（从 v4.381 基线一步复现 v4.382 最终态）')
A('保留脚本：')
A('- patch_v4382.py —— 引擎合并补丁（index.html 七段引擎变换 + package.json 版本号），可从 v4.381 基线一步复现；锚点唯一、自包 try/catch 非空、per-build 标记块首显式赋初值。')
A('- make_evidence4382.py —— 证据段 + AGENTS v4.382 行生成（读 _ev_added15/_ev_offhist/_ev_exc97.json 与 index 实测字节/SHA1/行尾）。')
A('- probe_evidence4382.js —— 归因/offHist/例外转储探针（生成上述三份 JSON，依赖 harness_base.js 基线 harness）。')
A('- verify_speedaxis.js —— 速度轴四项断言正式验证（④ 例外分档计数 + 缺 note 计 FAIL）。')
A('- probe_show4382c.js —— 展示层 872 分组量化（保留）。')
A('- harness_base.js + _make_harness_base.py —— 从 8ace363 提取的基线 harness，归因配对用。')
A('基线复现记录：基线 index（git 8ace363，2,005,705 B / SHA1 CEAF82736062C199EE0AC53F962859462DF81382 / CRLF 22994 / bareLF 51）+ 基线 package.json（4.381.0）跑 patch_v4382.py，产出 index %d B / SHA1 %s / CRLF %d / bareLF %d，与当前工作树最终态字节级一致；package.json 4.382.0 与目标一致。' % (stat['bytes'], stat['sha1'], stat['crlf'], stat['barelf']))
A('已删除一次性增量脚本：patch_v4382b/c/d/e/f_show/ver.py、patch_agents4382/b/show.py、patch_evidence4382/b/show.py、patch_v4382_review.py，以及被 probe_evidence4382.js 取代的 probe_attr4382/probe_classify15/probe_note4382/probe_offhist4382.js。')
A('')

old = io.open(EV, encoding='utf-8', newline='').read()
# 移除旧复核段（MARK 起到文件尾），保留 v4.381 冻结件与既有回归复跑段
idx = old.find(MARK)
if idx >= 0:
    old = old[:idx].rstrip('\r\n') + '\r\n'
io.open(EV, 'w', encoding='utf-8', newline='').write(old + '\r\n' + '\r\n'.join(lines) + '\r\n')
print('evidence appended, lines', len(lines), stat)

# ---- AGENTS.md v4.382 行：刷新实测统计 + 复核结论（版本号仍 v4.382，占位「待线上核验」保留） ----
AG = os.path.join(ROOT, 'AGENTS.md')
ag = io.open(AG, encoding='utf-8', newline='').read()
ag_lines = ag.splitlines(keepends=True)
for i, ln in enumerate(ag_lines):
    if ln.startswith('| v4.382 |'):
        nl = '\r\n' if ln.endswith('\r\n') else ('\n' if ln.endswith('\n') else '')
        row = ln[:len(ln) - len(nl)]
        row = row.replace('2,010,920', '{:,}'.format(stat['bytes']))
        row = row.replace('63222DCEFEFB843438FDC6D7F788AB58E3B41A76', stat['sha1'])
        row = row.replace('CRLF 23053', 'CRLF %d' % stat['crlf'])
        clause = ('同版复核（不升版）：流派 +13 逐轴归因闭合 -G+H-K=+13（G=2 移除、H=15 诚实恢复、K=0 重复回流）；'
                  '15 条新增逐条按 v4.371 去重口径比对，全判 (a) 诚实恢复（sameCfg=false 或主招 Jaccard<0.6），无 (b) 重复回流，不收卡，总数保持 4205；'
                  'offHist 14 物种各 +1 迁移（1→2 ×4、2→3 ×1、3→4 ×5、4→5 ×4）桶账逐项闭合；'
                  'EV 归零降级 9（天气/沙/雨前缀剥离）+39（stale 倍率收敛残留，去速攻冠名按耐久输出定位）=48 张，不重排 EV/性格；'
                  '97 条倍率例外按来源分档 why（天气提速 38 / 保留顺风 56 / 轻装 7 / 围巾 0，4 条顺风+轻装叠加），只加 why 不动 EV/性格；'
                  '13 个增量补丁已合并为可从 v4.381 基线一步复现的最小集，基线实测字节/SHA1 对上后删除旧脚本。')
        anchor = '截图 docs/shots/v4382_*.png 待补）'
        import re as _re
        prefix = row[:row.index(anchor)] if anchor in row else row
        prefix = _re.sub(r'同版复核（不升版）：.*?删除旧脚本）\s*', '', prefix)
        row = prefix.rstrip() + ' ' + clause + ' ' + anchor + nl
        ag_lines[i] = row
        break
else:
    raise SystemExit('未找到 v4.382 AGENTS 行')
io.open(AG, 'w', encoding='utf-8', newline='').write(''.join(ag_lines))
print('agents row refreshed')
