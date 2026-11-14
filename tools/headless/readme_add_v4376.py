# README 追加 v4.376 特性段落与截图（纯 LF）
P = r"D:\game\elite-redux\README.md"
d = open(P, "rb").read()

anchor = "![喷火龙答案卡：巨翼特性按招族判定](docs/shots/v4375_mvflag.png)\n\n---\n"
assert d.count(anchor.encode("utf-8")) == 1

block = (
"- **防守流派死特性自动换常驻防守特性**。受队、联防、辅助流里，首推特性要是触发不了（比如肉盾的「叶绿素」要晴天、小锻匠R 的「水栖居民」要水系伤害招，可这套配招里都没有），等于白占一个槽。旧版只老实标注「当前不生效」，要你自己去备选里挑；现在工具直接帮你换好——只要备选里有不依赖天气、场地、指定招式、常驻就生效的防守特性（纯朴、硬壳盔甲、坚硬岩石、防尘、我行我素、灾祸之简等），就自动换成它并写明原因。没有合适的防守备选就不硬凑、保留诚实标注，进攻流派也不处理。本版共 9 个防守流派（7 只宝可梦）换成常驻防守特性，其余全库推荐不变。\n\n"
"![小锻匠R 钉子减伤轴：死特性自动换成硬壳盔甲](docs/shots/v4376_dead_swap.png)\n\n"
)
d = d.replace(anchor.encode("utf-8"),
              anchor.replace("\n\n---\n", "\n").encode("utf-8") + block.encode("utf-8") + b"---\n", 1)
open(P, "wb").write(d)
print("done. CRLF:", d.count(b"\r\n"), "bareLF:", d.count(b"\n") - d.count(b"\r\n"))
