# -*- coding: utf-8 -*-
import io
def rd(p): return io.open(p, encoding='utf-8').read()
def wr(p, s): io.open(p, 'w', encoding='utf-8', newline='').write(s)

p = r"D:\game\elite-redux\AGENTS.md"
s = rd(p)
old_h = "| v4.427 | 2137932 | `EF49FE4AD7DF455E79C3666F9CD8B8414F1E735E` |"
new_h = "| v4.427 | 2138357 | `C3DB5645DA5069489E46EBD5D02672C9E85694D4` |"
assert s.count(old_h) == 1
s = s.replace(old_h, new_h)
assert s.count("**补丁（patch4427 a–c）**") == 1
s = s.replace("**补丁（patch4427 a–c）**", "**补丁（patch4427 a–d）**")
old_c = "③ 强化角色表补冥想 347，312→598 项（新增 286 个会话想的物种）。"
new_c = ("③ 强化角色表补冥想 347，312→598 项（新增 286 个会冥想的物种）；"
         "④ 强化槽内择优——`_scan4426` 在 `want==='强化'` 时按「火力 +12 / 速度 +6」封顶加权，"
         "避免刚过门槛的 95/85 顶掉真正能推队的（实测 #1507 核心的强化位由 爱管侍-雌性 95/85 → 超梦 154/130，"
         "引梦貘人核心由 阿尔宙斯-格斗 120/120 → 奈克洛兹玛-拂晓之翼 157/77）。")
assert s.count(old_c) == 1
s = s.replace(old_c, new_c)
wr(p, s)
print('AGENTS backfill ok', len(s))
