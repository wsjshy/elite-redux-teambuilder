# skill gates.md 追加 v4.376 死特性收口段落（纯 LF）
P = r"C:\Users\22210\AppData\Local\Doubao\User Data\Default\.doubao\agent_mode\workspace\.user_skills\er-teambuilder-dev\references\gates.md"
d = open(P, "rb").read()

sec = """
## 九、防守流派死特性收口（v4.376，已闭环）

- 触发：首推 abi[0].why 含「此特性当前不生效」。该字符串有 4 个产出点（eA5 通用、eA6 天气场地、eA7 雾、eA9 兜底），v4.375 全库共 **56 个**死特性保留流派。
- 范围纪律：只处理**防守流派**（roleTag 肉盾/受队/联防/辅助，或 side==='辅助'）；34 个进攻流派不动。22 个防守死流派中 **9 个可换（7 物种）、13 个无防守备选保留诚实文案**。
- 关键坑：解析备选特性 id 必须同时查 **s.abis/abiIds 和 s.inns/innIds**。#1001 古简蜗的常驻防守特性「灾祸之简」是天性（inns），初版探针只查 abis 漏报 2 条；引擎 `_d10IdOf` 两个池都查才正确命中。按名查能力表会因物种实际用名与规范名不一致而失败，禁止只靠名称。
- 常驻防守 id 集与优先级（_D10_MAP）：109 纯朴=1、75 硬壳盔甲/4 战斗盔甲=2、116 坚硬岩石=3、142 防尘=4、20 我行我素=5、7 柔软=6、107 危险预知=7、578 灾祸之简=8、144 再生力=9、165 芳香幕=10。
- 9 换法：#270/#271→我行我素、#519/#520→纯朴、#833→坚硬岩石、#1001 两流派→灾祸之简、#1045→防尘、#2640→硬壳盔甲。换后 sc=1，why 写「换成本流派常驻生效的防守特性」。
- 无回归：gate 物种1906/流派4328、dup0/fatal0/itemsOver0/defOrb0/badMove1、offHist 逐项与 v4.375 一致；死特性标注 56→47。
- 结构性不可修：#2215 超级炎武王三特性全为摔跤表演家963（仅对飞身重压560 生效），但 learnOf 不含560，同名无处可换，维持诚实标注，勿再查。
"""
d = d + sec.replace("\n", "\n").encode("utf-8")
open(P, "wb").write(d)
print("gates.md bareLF:", d.count(b"\n") - d.count(b"\r\n"))
