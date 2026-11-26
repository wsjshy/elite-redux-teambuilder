# -*- coding: utf-8 -*-
"""v4.435 README / VERSIONS 文档同步（字节级，锚点唯一断言）。"""
import io, os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ---------- README：插在 v4.434 小节之前 ----------
readme = os.path.join(ROOT, 'README.md')
t = io.open(readme, encoding='utf-8', newline='').read()

rm_row = (
    '### 门禁清零：不再给学不到剧毒的宝可梦硬塞剧毒（v4.435）\n\n'
    '堵拦熊（#862，恶/一般，物攻 95）的「毒疗站场流」之前会固定带上剧毒（92），'
    '但堵拦熊的可学招式池里**根本没有剧毒**——这是全库门禁「招式必须在可学池内」检查剩下的最后一条。\n\n'
    '引擎里同类招式推送原本已有「先查会不会学」的门控，唯独这一条漏了；本版把它补齐：'
    '只有物种真的能学剧毒才带上，否则由替身、怪力和补盲攻击招自然补满四槽。'
    '不改动可学招式表，也不改推荐的道具、性格和努力值。\n\n'
    '门禁结果：物种 1906 / 方案 4064，重复 0、空方案 0、致命错误 0，**招式越界 badMove 1 → 0**；'
    '进攻招分布与上一版逐项一致，招式序列、道具和其余配置零漂移。\n\n'
)
anchor_rm = '### 晴天标签说实话：没真开晴天，就提示要蓄力（v4.434）'
assert t.count(anchor_rm) == 1
t = t.replace(anchor_rm, rm_row + anchor_rm, 1)
io.open(readme, 'w', encoding='utf-8', newline='').write(t)
print('README v4.435 section inserted')

# ---------- VERSIONS：追加到文件末尾 ----------
ver = os.path.join(ROOT, 'docs', 'changelog', 'VERSIONS.md')
v = io.open(ver, encoding='utf-8', newline='').read()

v_row = (
    '\n## v4.435 · badMove 门禁清零：#862 毒疗流不再硬灌学不到的剧毒92（2026-11-26）\n\n'
    '- 起因：全库门禁 badMove 唯一残留——#862 堵拦熊 toxic_heal_item「毒疗站场流」卡 main=[92,164,70,182]，'
    '92 剧毒不在 learnOf（52 招）内；FUNC_MV.wear=[73,92]。\n'
    '- 根因：MECH_BUILD.toxic_heal_item L14988 无条件 push 92；同文件其余 4 处 92 push 已带 `mechHasMv(s,92)` 门控，本条漏门控。\n'
    '- 修法：push 处包 `if(mechHasMv(s,92))`，与其余 4 处同构；不补 learnset、不动推荐池 / EV / 性格 / 道具。\n'
    '- 量化：gate species 1906 / total 4064 / dup 0 / empty [] / fatal [] / itemsOver 0 / defOrb 0 同基线；badMove 1 → 0；'
    'offHist `0:271-1:802-2:550-3:231-4:47-5:4-7:1` 逐项一致；862 改后 toxic_heal_item main=[164,70,704,818]，其余 4 流派 bad=[]。\n'
    '- 工程结论：`tools/headless/harness.js` 是 `make_harness.py` 从 index.html 第 4 段离线生成的副本，改完 index.html 必须重建 harness，否则 headless 门禁跑旧副本。\n'
    '- 门禁：6 段 node --check 6/6、smoke 34/34、verify_invariants 违规 7 全为 INV06 既有、INV17 0、LEGACY 71。index 2,153,236 B / CRLF 25115 / bareLF 0 / SHA1 `F4D941DE298071213DD0F1B4D13D462B0DBA9DB5`。\n'
    '- 正文 `docs/test-reports/v4435_badMove清零.md`。\n'
)
v = v.rstrip('\r\n') + '\r\n' + v_row
io.open(ver, 'w', encoding='utf-8', newline='').write(v)
print('VERSIONS v4.435 entry appended')
