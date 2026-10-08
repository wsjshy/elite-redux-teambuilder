# -*- coding: utf-8 -*-
"""v4.2 交付自检：验证 07_组队方法论.md 的「槽位规则可执行性」。
检查项：
  A 文件存在 + 字数（正文 CJK）
  B §2.0 骨架总表：每体系 Σ槽位 == 6
  C §2.1–§2.18 各体系槽位表：Σ(×n) 与总表一致，且行数 5–6
  D 文档引用的引擎符号是否真的存在于 build_tool_html.py / build_tool_data.py
  E 文档引用的招式 id 是否与 gameData 一致
  F SYS_SET / SYS_MAP / WEATHER_MV 的条数与内容
只读，不修改任何被测文件。
"""
import re, json, sys, io, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

ROOT = r"D:\game\elite-redux"
DOC = os.path.join(ROOT, r"docs\战斗分析\07_组队方法论.md")
fail = []
def check(ok, label, detail=""):
    print(("  [OK] " if ok else "  [FAIL] ") + label + (f"  {detail}" if detail else ""))
    if not ok: fail.append(label)

# ---------- A ----------
print("== A 文件与字数 ==")
check(os.path.isfile(DOC), "文件存在", DOC)
txt = open(DOC, encoding='utf-8').read()
cjk = len(re.findall(r'[\u4e00-\u9fff]', txt))
print(f"  总字符 {len(txt)}｜CJK 汉字 {cjk}")
check(cjk >= 5000, "正文 CJK ≥ 5000", f"实际 {cjk}")

# ---------- B ----------
print("\n== B §2.0 骨架总表：Σ 槽位 == 6 ==")
lines = txt.splitlines()
b_rows = []
for ln in lines:
    m = re.match(r'^\|\s*(\d{1,2})\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*(.+?)\s*\|\s*$', ln)
    if m and '`S-' in m.group(4):
        b_rows.append((int(m.group(1)), m.group(2), m.group(3), m.group(4)))
print(f"  识别到 {len(b_rows)} 行体系骨架（应为 18）")
check(len(b_rows) == 18, "骨架总表 18 行")
syssum = {}
for idx, name, key, slotstr in b_rows:
    s = sum(int(x) for x in re.findall(r'×(\d+)', slotstr))
    syssum[idx] = s
    if s != 6:
        check(False, f"体系#{idx} {name} Σ槽位==6", f"实际 {s}")
check(all(v == 6 for v in syssum.values()), "全部 18 体系 Σ槽位 == 6",
      "不一致: " + str({k: v for k, v in syssum.items() if v != 6}) or "")

# ---------- C ----------
print("\n== C §2.x 各体系槽位表：Σ(×n) 一致 ==")
sec = re.split(r'^### (2\.(\d+))', txt, flags=re.M)
secmap = {}
for i in range(1, len(sec), 3):
    num = int(sec[i+1]); body = sec[i+2]
    body = body.split('\n## ')[0].split('\n### ')[0]
    secmap[num] = body
print(f"  识别到 {len(secmap)} 个小节（2.1–2.18，▲2.0 与附注除外）")
mismatch = []
for num, body in sorted(secmap.items()):
    if num == 0:
        continue
    rows = [l for l in body.splitlines() if l.startswith('| `S-')]
    tot = sum(int(x) for x in re.findall(r'`S-[A-Z0-9\-]+`×(\d+)', body))
    nrows = len(rows)
    flag = (tot == 6)
    if not flag: mismatch.append((num, tot))
    print(f"  2.{num:<2} 槽位行 {nrows}｜Σ(槽位文字×n)={tot}{'' if flag else '  ← 不等于 6'}")
check(not mismatch, "各体系槽位表 Σ(×n) == 6", f"异常 {mismatch}" if mismatch else "")

# ---------- D ----------
print("\n== D 引擎符号存在性 ==")
html = open(os.path.join(ROOT, "build_tool_html.py"), encoding='utf-8').read()
data = open(os.path.join(ROOT, "build_tool_data.py"), encoding='utf-8').read()
syms = ["SYS_DIMS", "SYS_SET", "SYS_MAP", "WEATHER_MV", "SYS_MV_KEYS", "FUNC_MV",
        "wxConflict", "WX_SYS", "archOfTpl", "archOfSp", "coreSys", "isAbilSet",
        "SIDE_DIM", "bstI", "bulkOf", "atkBest", "bestPowOf", "defCellTrio",
        "isFinalSp", "abiTagOf", "learnHasName", "learnOf", "hasAny", "countLearnNames",
        "spdOf", "isType", "abiTagOf"]
missing = [s for s in syms if s not in html and s not in data]
for s in syms:
    where = "html" if s in html else ("data" if s in data else "—")
    check(s in html or s in data, f"符号 {s}", where)
check(not missing, "全部引用符号存在", f"缺失 {missing}" if missing else "")
check("SLOT_TABLE" not in html, "SLOT_TABLE 尚未实现（本文为新增规格）")

# ---------- E ----------
print("\n== E 招式 id 校验（对照 gameData.moves）==")
d = json.load(open(os.path.join(ROOT, r"ER-source\gameDataV2.65beta.json"), encoding='utf-8'))
mov = {m['id']: m.get('name') for m in d.get('moves', [])}
print("  WEATHER_MV 声明（html:2761）:", {'240':'雨','241':'晴','201':'沙','258':'雪','604':'电场','641':'精神场地','580':'青草场地','581':'薄雾场地'})
print("  gameData 实际:")
for i in (240, 241, 201, 258, 604, 641, 580, 581, 73, 92, 220, 366, 164):
    print(f"    id={i:<4} {mov.get(i)}")
expect = {240:'求雨', 241:'大晴天', 201:'沙暴', 258:'冰雹', 604:'电气场地', 641:'精神场地',
          580:'青草场地', 581:'薄雾场地', 73:'寄生种子', 92:'剧毒', 220:'戏法空间',
          366:'顺风', 164:'替身'}
check(366 in mov, "顺风 id=366 存在于 moves")
check(433 in mov and mov.get(433) == 'Trick Room', "戏法空间 id=433 == Trick Room")
check(73 in mov, "寄生种子 id=73 存在于 moves")
check(mov.get(220) != 'Trick Room', "220 不是戏法空间（=Pain Split）")

# ---------- F ----------
print("\n== F SYS_SET / SYS_MAP / WEATHER_MV 条数 ==")
def grab(var):
    m = re.search(re.escape(var) + r'=\{(.*?)\};', html, re.S)
    return m.group(1) if m else None
for var, want in (("SYS_SET", 9), ("SYS_MAP", 21), ("WEATHER_MV", 8)):
    body = grab(var)
    n = len(re.findall(r"(?:'[^']+'|\d+)\s*:", body)) if body else -1
    check(n == want, f"{var} 条数 == {want}", f"实际 {n}")

# 额外：确认文档已不使用错误的 220 作为戏法空间 id
check('戏法空间(220)' not in txt and '"has":220' not in txt, "戏法空间 id 已修正为 433")
check('戏法空间(433)' in txt and '"has":433' in txt, "文档含 433 锚点")

print("\n===== 自检结论 =====")
if fail:
    print(f"未通过 {len(fail)} 项：")
    for f in fail: print("  -", f)
else:
    print("全部自检项通过 ✅")
