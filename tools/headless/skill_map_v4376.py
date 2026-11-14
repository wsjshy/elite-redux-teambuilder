# engine-map.md 追加 v4.376 锚点（纯 LF）
P = r"C:\Users\22210\AppData\Local\Doubao\User Data\Default\.doubao\agent_mode\workspace\.user_skills\er-teambuilder-dev\references\engine-map.md"
d = open(P, "rb").read()

sec = """
## v4.376 防守死特性收口锚点（Grep 重取行号）

- 自包作用域块，插在唯一锚点 `}catch(eA9){eA9.name}` 之后（CRLF 区域）；变量前缀 `_D10`/`_d10`/`eD10`，独立 try/catch 防静默。
- `_d10IdOf(s,n)`：先查 s.abis/abiIds、再查 s.inns/innIds 把物种特性名解析为规范 id（天性也要查，#1001 灾祸之简在 inns）。
- `_D10_MAP`（常驻防守 id+优先级）：109 纯朴、75/4 盔甲、116 坚硬岩石、142 防尘、20 我行我素、7 柔软、107 危险预知、578 灾祸之简、144 再生力、165 芳香幕。
- 守卫链：score99 跳过 → abi 长度≥2 → why 含「此特性当前不生效」→ 防守流派（roleTag 肉盾/受队/联防/辅助 或 side 辅助）→ 选优先级最高的常驻防守备选交换，置 sc=1。
- 结果：9 流派/7 物种换特性，死特性标注 56→47，gate 其余指标零变化。
"""
d = d + sec.encode("utf-8")
open(P, "wb").write(d)
print("engine-map.md bareLF:", d.count(b"\n") - d.count(b"\r\n"))
