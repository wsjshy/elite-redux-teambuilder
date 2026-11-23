# -*- coding: utf-8 -*-
import io
def rd(p): return io.open(p, encoding='utf-8').read()
def wr(p, s, nl=''): io.open(p, 'w', encoding='utf-8', newline=nl).write(s)

# 1) AGENTS 行末补线上状态
p = r"D:\game\elite-redux\AGENTS.md"
s = rd(p)
old = "正文 `docs/test-reports/v4427_角色分工对调.md` |"
new = ("**已发布 gh-pages `77e18b3`（`f272cb9..77e18b3` 增量零删除），线上逐字节 MATCH"
       "（index 2,138,357 `C3DB5645`，三个 data 分片同前）**。正文 `docs/test-reports/v4427_角色分工对调.md` |")
assert s.count(old) == 1, s.count(old)
s = s.replace(old, new)
wr(p, s)
print('AGENTS online ok', len(s))

# 2) gates.md 追加三十六节（LF）
gp = r"C:\Users\22210\AppData\Local\Doubao\User Data\Default\.doubao\agent_mode\workspace\.user_skills\er-teambuilder-dev\references\gates.md"
g = io.open(gp, 'rb').read()
SEC = (
"## 三十六、v4.427 角色分工对调（玻璃大炮不开墙 + 强化手须进攻型）\n\n"
"- **诱因**：v4.426 上线后用户带截图否定答案卡组合「引梦貘人 #97（115/67 慢速辅助）当强化手 + 超级胡地 #1507（175/150 玻璃大炮）当双墙辅助手」，"
"判为角色颠倒、「反过来还差不多」。这是「职责建模」主题的第二次连续投诉（v4.426 是双墙名实，v4.427 是分工方向）。\n"
"- **根因（三条，均取证）**：① 双墙卡准入缺「辅助定位」门——钉子流早有 `&&!isGlassCannon`，墙流反在 v4.426 专为玻璃大炮加「GC 高速开墙」分支；"
"② `mateRoleOf` 的「强化」角色只看 `_ER_BOOST_ROLE` 不看进攻力，慢速中火力（115/67、113/54）照样占强化位；"
"③ `_ER_BOOST_ROLE` 判据只含 剑舞/龙舞/诡计/蝶舞/破壳，**漏冥想 347** → 会 347+417 的超级胡地不在表内，最像强化手的反而拿不到强化角色。\n"
"- **改法（patch4427 a–d）**：a 新增单一真源 `isBoostSweeper(t)=会强化 && atkBest≥95 && spd≥70`（与「输出」角色 `_off` 同源），"
"mateRoleOf 强化判定与 NEED_KINDS `sweep` gate 两处同源；b 墙块准入 `!isGlassCannon(s)`，删除 GC 高速开墙分支与 `_fastScreen` 哨兵（含四处放行回退）；"
"c 强化角色表补冥想 347（312→598 项）；d `_scan4426` 在 `want==='强化'` 时按火力/速度封顶加权（+12/+6）。\n"
"- **量化对账（v4.426→v4.427）**：双墙卡 352→278 张（移除 74、零新增；GC 70 物种→0，非 GC 195 全保留）；"
"全库卡数 4138→4064（净减 74，74 个物种各少 1 张墙卡、仍有余卡，零卡物种 0）；强化角色池 312→329（最低 atk 95 / 最低速 70）。\n"
"- **行为验证（引擎直读 + CDP 一致）**：#1507 卡 3 张（输出/输出/强化），双墙辅助流消失，角色「回复/强化/输出」，答案卡强化位 超梦 154/130；"
"#97 角色「回复/状态」，仍保留「双墙辅助流[受队]」，答案卡强化位 奈克洛兹玛-拂晓之翼 157/77（改前 阿尔宙斯-格斗 120/120、更早为 鼠霸王 113/54）。\n"
"- **门禁**：smoke 34/34（静默 catch 391→390，经 `catch(evb){val+=0}` 收回阈值）；verify_invariants 除 3 条 v4.425 既存 INV06 历史 FAIL（#1817/#986 日光刃无晴源，与本任务无关）外全 PASS，"
"INV03 真双墙 0 违规、INV13 性格×EV 零矛盾、INV14 名含强化→必带强化招 2999 张 0 违规；CDP 375 sw=cw=375 零横滚。\n"
"- **字节**：2,134,359→**2,138,357 B（净增 3,998）**，上限 2,202,009 余约 63KB。\n"
"- **发布**：gh-pages **`77e18b3`**（`f272cb9..77e18b3` 增量零删除），线上逐字节 MATCH（index 2,138,357 `C3DB5645`）。"
"正文 docs/test-reports/v4427_角色分工对调.md；截图 docs/shots/v4427_alakazam_1300.png / v4427_hypno_1300.png / v4427_hypno_375.png。\n"
"- **遗留**：破壳/龙舞类慢速强化手（太古盔甲 125/45、铁螯龙虾 120/55）在「进攻型」门下不再计强化角色，属有意取舍——它们的强化依赖多次叠层或香草一波，不属「墙内单次强化即推队」模型；若需覆盖应另立「提速型强化」子类，不放大本门。\n"
)
old_tail = "正文 docs/test-reports/v4426_双墙名实修复.md；截图 docs/shots/v4426_wall_*.png。\n"
ob = old_tail.encode('utf-8')
assert g.count(ob) == 1, g.count(ob)
g = g + SEC.encode('utf-8')
io.open(gp, 'wb').write(g)
cnt = g.count("## 三十六、v4.427 角色分工对调".encode('utf-8'))
print('gates ok', len(g), 'sec count', cnt)
