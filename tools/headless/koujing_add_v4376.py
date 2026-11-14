# 联动口径表追加 v4.376 行（表格区用 bare LF）
P = r"D:\game\elite-redux\docs\dev\配队联动口径.md"
d = open(P, "rb").read()

anchor = "数据完整性与安全网 |\n"
assert d.count(anchor.encode("utf-8")) == 1

row = (
"| 防守流派死特性自动换常驻防守特性（v4.376） | 受队/联防/辅助流派的首推特性拿不到触发条件（如叶绿素要晴天、水栖居民要水系伤害招）＝死特性白占槽，旧版只标注、要用户自己挑 | "
"只处理防守流派（肉盾/受队/联防/辅助，或 side 辅助）；按 s.abiIds/innIds 对齐解析备选（含天性，不依赖按名查能力表），命中「常驻防守特性」（纯朴/硬壳盔甲·战斗盔甲/坚硬岩石/防尘/我行我素/柔软/危险预知/灾祸之简/再生力/芳香幕）即换；无防守备选不硬凑，保留诚实文案；进攻流派不处理 | "
"全库 56 死特性流派中 22 个防守流派：9 个换（7 物种，#270/#271→我行我素、#519/#520→纯朴、#833→坚硬岩石、#1001 两流派→灾祸之简、#1045→防尘、#2640→硬壳盔甲）、13 个保留；34 个进攻流派不动；门禁流派数/dup/fatal/defOrb/offHist 全部不变，死特性标注 56→47 |"
)
d = d.replace(anchor.encode("utf-8"), anchor.encode("utf-8") + row.encode("utf-8") + b"\n", 1)
open(P, "wb").write(d)
print("done. CRLF:", d.count(b"\r\n"), "bareLF:", d.count(b"\n") - d.count(b"\r\n"))
