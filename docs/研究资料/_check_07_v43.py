# -*- coding: utf-8 -*-
"""v4.3 交付自检：验证 07_组队方法论.md 的两份新规格「可执行性」。
检查项：
  A 文件与字数（正文 CJK）
  B v4.2 骨架是否已「降级为需求示例参考」（标注存在性）
  C §4.5 需求清单生成规则：必备要素齐全
  D §4.6 战术流派推导规则：必备要素齐全（含「禁止物特二分」红线）
  E 规格中引用的引擎符号是否真实存在于 build_tool_html.py / build_tool_data.py
  F R07-01 ~ R07-36 规则编号完整性 + §4.5/§4.6 规则号归属
  G 伪代码块「可编译级自洽」近似检查：括号/大括号配平
  H 口径冲突：新增段落不得出现被口径表覆盖的旧值
  I 招式 id 锚点仍然正确（433 = Trick Room，220 ≠ Trick Room）
只读，不修改任何被测文件。
"""
import re, json, sys, io, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

ROOT = r"D:\game\elite-redux"
DOC  = os.path.join(ROOT, r"docs\战斗分析\07_组队方法论.md")
DRAFT= os.path.join(ROOT, r"docs\研究资料\_03_组队理论检索.md")
fail = []
def check(ok, label, detail=""):
    print(("  [OK]   " if ok else "  [FAIL] ") + label + (f"  — {detail}" if detail else ""))
    if not ok: fail.append(label)

txt = open(DOC, encoding='utf-8').read()

# ---------- A ----------
print("== A 文件与字数 ==")
check(os.path.isfile(DOC), "07 文件存在", DOC)
check(os.path.isfile(DRAFT), "_03 底稿存在", DRAFT)
cjk = len(re.findall(r'[\u4e00-\u9fff]', txt))
print(f"   总字符 {len(txt)}｜CJK 汉字 {cjk}")
check(cjk >= 5000, "正文 CJK ≥ 5000", f"实际 {cjk}")

# ---------- B ----------
print("\n== B 18×6 骨架已降级为「需求示例参考」 ==")
check("v4.3" in txt.split("\n")[0], "标题已标 v4.3", txt.split("\n")[0][:60])
check("降级说明" in txt, "存在「降级说明」段")
check("需求示例参考" in txt, "出现「需求示例参考」字样")
check("非定死模板" in txt, "出现「非定死模板」字样")
check("NEED_EXAMPLES" in txt, "出现 NEED_EXAMPLES（需求示例库键名）")
check("v4.2 → v4.3 修订说明" in txt, "存在「v4.2 → v4.3 修订说明」段")
# §2 标题本身已改
m_sec2 = re.search(r'^## 二、[^\n]*$', txt, re.M)
check(bool(m_sec2) and "降级" in m_sec2.group(0), "§2 标题已标注降级", m_sec2.group(0) if m_sec2 else "未找到")

# ---------- C ----------
print("\n== C §4.5 需求清单生成规则 必备要素 ==")
i45 = txt.find("### 4.5 需求清单生成规则")
i46 = txt.find("### 4.6 战术流派推导规则")
check(i45 > 0, "§4.5 存在")
check(i46 > i45 > 0, "§4.6 位于 §4.5 之后")
sec45 = txt[i45:i46] if i45 > 0 and i46 > i45 else ""
for kw, label in [("需求条目结构", "需求条目结构（{need, satisfy, priority}）"),
                  ("satisfy", "满足判定字段 satisfy"),
                  ("priority", "优先级字段"),
                  ("生成算法", "生成算法伪代码"),
                  ("profileOf", "核心画像函数 profileOf"),
                  ("多功能价值", "多功能价值加分"),
                  ("终止条件", "终止条件"),
                  ("STOP_ALL_NEEDS_MET", "「需求清零即停」终止码"),
                  ("允许 <6", "允许 <6 紧凑队")]:
    check(kw in sec45, label)
check("|team| ≤ 6" in sec45 or "len(team) >= 6" in sec45, "队伍规模上限约束")
# 四配方
for r in ["速攻核心", "肉盾核心", "强化核心", "受队核心"]:
    check(r in sec45, f"核心配方：{r}")

# ---------- D ----------
print("\n== D §4.6 战术流派推导规则 必备要素 ==")
sec46 = txt[i46:]
for kw, label in [("推导算法", "推导算法伪代码"),
                  ("命名规则", "命名规则"),
                  ("物特二分", "「禁止物特二分」红线"),
                  ("双刀", "双刀相关约束"),
                  ("破盾路线", "破盾路线概念"),
                  ("不默认", "「不默认生成」约束"),
                  ("2 ≤ 流派数 ≤ 4", "流派数量约束（2–4 条）")]:
    check(kw in sec46, label)
# 流派命名必须是打法而非物特：这些词只允许出现在「禁止…」语境里
for bad in ["物攻队", "特攻队"]:
    ok = True
    for m in re.finditer(re.escape(bad), sec46):
        win = sec46[max(0, m.start()-40):m.end()+40]
        if not re.search(r'禁止|不得|non-?compliant|红线|作为流派名', win):
            ok = False
    check(ok, f"「{bad}」仅出现在禁止语境，未被当作流派名")
for good in ["晴速攻强化清场", "空间慢速重炮", "钉子受队消耗", "游击轮转补盲", "强化接力轴", "双刀破盾"]:
    check(good in sec46, f"打法命名示例：{good}")

# ---------- E ----------
print("\n== E 规格引用的引擎符号真实性 ==")
html = open(os.path.join(ROOT, "build_tool_html.py"), encoding='utf-8').read()
data = open(os.path.join(ROOT, "build_tool_data.py"), encoding='utf-8').read()
blob = html + data
syms = ["spdOf", "bulkOf", "atkBest", "bestPowOf", "defCellTrio", "bstI",
        "isAbilSet", "abiTagOf", "learnOf", "learnHasName", "hasAny",
        "countLearnNames", "FUNC_MV", "SYS_MV_KEYS", "SYS_MAP", "SYS_SET",
        "coreSys", "archOfTpl", "archOfSp", "wxConflict", "wxSetOf", "SYS_DIMS",
        "isFinalSp", "isType", "WX_SYS", "WEATHER_MV", "SIDE_DIM"]
missing = [s for s in syms if s not in blob]
for s in syms:
    check(s in blob, f"符号 {s}", "html" if s in html else ("data" if s in data else "—"))
check(not missing, "全部引用符号存在", f"缺失 {missing}" if missing else "")
# v4.3 新增校准：这些是引擎真实符号，必须出现在文档（规格引用正确）
for s, where in [("stabBest", "特殊/物理最高威力"), ("coreSide", "物理/特殊/双刀判定"),
                 ("coreSys", "特性→体系键数组")]:
    check(s in html, f"引擎符号 {s} 真实存在（{where}）")
    check(s in txt, f"文档已引用 {s}（{where}）")
# 反面：文档不得「使用」不存在的符号（但在校正/禁止语境中点名是允许的）
for ghost, why in [("spaBest", "引擎无此符号，正确写法 stabBest(s,'特殊')"),
                   ("SYS_MV_KEYS.boost", "SYS_MV_KEYS 按主题名索引，无 boost 子键"),
                   ("fieldOf", "引擎无此符号，正确写法 coreSys(s)")]:
    bad = 0
    for m in re.finditer(re.escape(ghost), txt):
        win = txt[max(0, m.start()-60):m.end()+60]
        if not re.search(r'不存在|无此符号|不得凭空|正确写法|口径校正|禁止', win):
            bad += 1
    check(bad == 0, f"文档未使用不存在的符号「{ghost}」", f"违规出现 {bad} 次（{why}）")
# SYS_MV_KEYS 键真实性（定义处 or 使用处任一命中即可）
for key in ["晴", "雨", "雪", "强化", "受", "空间", "顺风", "吸血", "双天气", "沙"]:
    hit = (f"SYS_MV_KEYS['{key}']" in html) or (f"'{key}':[" in html) or (f"'{key}': [" in html)
    check(hit, f"SYS_MV_KEYS 键 {key} 真实存在")
print("   profileOf/genNeeds/derivePlaystyles/classifyRole 为本文自定义（非引擎符号，属规格）")

# ---------- F ----------
print("\n== F 规则编号完整性 ==")
r07 = set(int(x) for x in re.findall(r'R07-(\d{2})', txt))
print(f"   出现 R07 编号：{sorted(r07)}")
check(r07 >= set(range(1, 37)), "R07-01 ~ R07-36 全部出现",
      f"缺失 {sorted(set(range(1,37)) - r07)}" if set(range(1,37)) - r07 else "")
# 归属：4.5 段应含 23~29，4.6 段应含 30~36
seg45 = re.search(r'### 4\.5.*?(?=### 4\.6)', txt, re.S)
seg46 = re.search(r'### 4\.6.*?(?=\n## 五、)', txt, re.S)
s45 = set(int(x) for x in re.findall(r'R07-(\d{2})', seg45.group(0))) if seg45 else set()
s46 = set(int(x) for x in re.findall(r'R07-(\d{2})', seg46.group(0))) if seg46 else set()
check(set(range(23, 30)) <= s45, "§4.5 含 R07-23 ~ R07-29", f"实含 {sorted(s45)}")
check(set(range(30, 37)) <= s46, "§4.6 含 R07-30 ~ R07-36", f"实含 {sorted(s46)}")

# ---------- G ----------
print("\n== G 伪代码块括号配平（可编译级自洽的近似检查）==")
blocks = re.findall(r'```(?:json)?\n(.*?)```', txt, re.S)
print(f"   检出围栏代码块 {len(blocks)} 个")
bad = []
for bi, b in enumerate(blocks):
    # JSON 块与非 JSON 块都检查 () [] {} 配平
    for op, cl in (("{", "}"), ("(", ")"), ("[", "]")):
        if b.count(op) != b.count(cl):
            bad.append((bi, op, b.count(op), b.count(cl)))
check(not bad, "全部代码块括号配平", f"异常 {bad}" if bad else "")
# 关键伪代码必须含 function/return 结构
check("function genNeeds" in txt, "genNeeds 函数签名存在")
check("function shouldStop" in txt, "shouldStop 函数签名存在")
check("function derivePlaystyles" in txt, "derivePlaystyles 函数签名存在")
check("function profileOf" in txt, "profileOf 函数签名存在")

# ---------- H ----------
print("\n== H 口径冲突：新增段落不得含被覆盖旧值 ==")
newsec = txt[i45:txt.find("## 附：完成自检")] + "\n" + (txt[txt.find("## ⚠️ v4.2 → v4.3"):txt.find("### 1.2")])
for bad_s, why in [("增伤 20%", "天气增伤旧值，正确 ×1.5"),
                   ("×1.2", "天气增伤旧值，正确 ×1.5"),
                   ("龙系伤害减半", "薄雾场地已移除"),
                   ("无限持续", "天气持续旧值，正确 8/12")]:
    check(bad_s not in newsec, f"新增段未出现「{bad_s}」", why)
check("×1.5" in txt, "全文含正确天气增伤 ×1.5")
check("8 / 12" in txt or "8(12)" in txt or "8 回合" in txt, "含天气持续 8/12 口径")

# ---------- I ----------
print("\n== I 招式 id 锚点 ==")
d = json.load(open(os.path.join(ROOT, r"ER-source\gameDataV2.65beta.json"), encoding='utf-8'))
mov = {m['id']: m.get('name') for m in d.get('moves', [])}
check(mov.get(433) == 'Trick Room', "433 == Trick Room", str(mov.get(433)))
check(mov.get(220) != 'Trick Room', "220 != Trick Room", f"220={mov.get(220)}")
check('戏法空间(220)' not in txt and '"has":220' not in txt, "文档未把 220 当戏法空间")
check('433' in txt, "文档含 433 锚点")

# ---------- J ----------
print("\n== J 已删除符号与「零硬门」口径（v4.3 新增，防回归） ==")
check("function wxConflict" not in html and "function wxSetOf" not in html,
      "引擎确认已删除 wxConflict / wxSetOf（仅存注释）",
      "仍以 function 形式定义" if ("function wxConflict" in html or "function wxSetOf" in html) else "仅注释")
check("WX_SYS" in html, "引擎仍存 WX_SYS 常量")
for dead in ["wxConflict", "wxSetOf"]:
    bad = []
    for m in re.finditer(re.escape(dead), txt):
        win = txt[max(0, m.start()-70):m.end()+70]
        if not re.search(r'已删除|已不存在|仅存注释|更正|C14|不得|违规|删除|移除硬互斥|用户指令为准|D-1', win):
            bad.append(win.replace("\n", " "))
    check(not bad, f"「{dead}」在 07 中仅出现于「已删除/更正」语境",
          f"违规 {len(bad)} 处：{bad[:1]}" if bad else "")
check("零硬门" in txt, "文档出现「零硬门」表述")
check("不设硬门" in txt, "文档出现「不设硬门」表述")
# R07-03 不得再是「排除式」硬门
m3 = re.search(r'\| R07-03 \|[^\n]*\|', txt)
check(bool(m3) and "排除" in m3.group(0) and "不排除" in m3.group(0),
      "R07-03 已改判为「不排除、仅排序靠后」", m3.group(0)[:90] if m3 else "未找到 R07-03")
check("C14" in txt, "文档登记了冲突 C14")
# 防回归：正文不得再断言 Σ==6 为不变量，不得残留旧键名 SLOT_TABLE = {
check("SLOT_TABLE = {" not in txt, "旧键名 `SLOT_TABLE = {` 已更名为 NEED_EXAMPLES")
check("Σ slot.n == 6" not in txt and "assert sum(s.n" not in txt, "正文不再断言 `Σ slot.n == 6` 为不变量")
check("不再是架构不变量" in txt, "已显式声明「Σ n 不再是架构不变量」")
check("NEED_EXAMPLES = {" in txt, "§4.3 伪 JSON 已用 NEED_EXAMPLES 开场")
# 底稿已同步
check("C14" in open(DRAFT, encoding='utf-8').read(), "_03 台账已补 C14")

print("\n===== 自检结论 =====")
if fail:
    print(f"未通过 {len(fail)} 项：")
    for f in fail: print("  -", f)
else:
    print("全部自检项通过 ✅")
