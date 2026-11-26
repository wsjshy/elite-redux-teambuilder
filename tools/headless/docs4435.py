# -*- coding: utf-8 -*-
"""v4.435 AGENTS 版本表回填（字节级、锚点唯一断言）。"""
import io, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
p = os.path.join(ROOT, 'AGENTS.md')
t = io.open(p, encoding='utf-8', newline='').read()

sha = 'F4D941DE298071213DD0F1B4D13D462B0DBA9DB5'
row = (
    '| v4.435 | 2153236 | `' + sha + '` | **全库门禁 badMove 唯一残留收口：#862 堵拦熊「毒疗站场流」硬灌自身学不到的剧毒92（v4.435，2026-11-26，长期授权自主迭代勘察选题）。**'
    '**根因**：MECH_BUILD.toxic_heal_item 在 L14988 无条件 `b.mv.main.push({id:92,...})`；同文件其余 4 处 92 push（先手挂状态/消耗/免疫换回合/耐久核配套）原本已带 `mechHasMv(s,92)` 门控，唯独本条漏门控。862 learnOf 共 52 招不含 92（FUNC_MV.wear=[73,92] 变化招），故该卡 main=[92,164,70,182] 中 92 为 learnset 外招式，触发 gate badMove。'
    '**修法（与其余 4 处同构，零数据层改动）**：push 处包 `if(mechHasMv(s,92))`；不补 learnset、不改推荐池/EV/性格/道具。'
    '**量化（基线 v4.434 → v4.435）**：gate species 1906 / total 4064 / dup 0 / empty [] / fatal [] / itemsOver 0 / defOrb 0 全部同基线；**badMove 1 → 0**（全库门禁此判据首次归零）；offHist 分布 `0:271-1:802-2:550-3:231-4:47-5:4-7:1` 与基线逐项一致，招式 id 序列/道具/其余 build 字段零漂移。862 改后 toxic_heal_item 卡 main=[164,70,704,818]（替身/怪力/补盲攻招自然补满四槽，无空槽、无第二张 badMove），其余 4 流派 bad=[]。'
    '**关键工程结论**：`tools/headless/harness.js` 是 `make_harness.py` 从 index.html 第 4 段脚本离线生成的引擎副本（不读源码），改完 index.html 必须重跑 `python tools/headless/make_harness.py` 重建 harness，否则 headless 门禁仍跑旧副本、badMove 不归零——本轮即踩此坑。'
    '**门禁**：6 段 node --check 6/6、smoke 34/34（本版本表行回填后）、verify_invariants 违规合计 7 全为 INV06 既有、INV17 0、LEGACY 71。index 2,153,236 B、CRLF 25115 / bareLF 0。正文 `docs/test-reports/v4435_badMove清零.md` |\n'
)

anchor = '| v4.434 | 2153217 |'
assert t.count(anchor) == 1, 'anchor not unique'
t = t.replace(anchor, row + anchor, 1)
io.open(p, 'w', encoding='utf-8', newline='').write(t)
print('AGENTS v4.435 row inserted; sha', sha)
