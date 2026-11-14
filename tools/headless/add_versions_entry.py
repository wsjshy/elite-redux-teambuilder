# VERSIONS.md 追加 v4.375 条目（CRLF）
P = r"D:\game\elite-redux\docs\changelog\VERSIONS.md"
d = open(P, "rb").read()

paras = [
"- **v4.375**（2026-11-15）：**补全 MV_FLAG 缺失招族——arrow/horn/air/hammer/throwing/drill/light 七族入表，依赖招族判定的特性不再因 flag 缺项而静默「永不触发」**。",
"    源码考古：include\\abilities.hh 的 MoveFlag 枚举只有 7 项（PUNCH/KICK/SOUND/MEGA_LAUNCHER/DANCE/KEEN_EDGE/BONE），真正承载更多招族的是 include\\pokemon.h 战斗招结构体的位域布尔（arrowBased/hornBased/airBased/hammerBased/throwingBased/drill/light），位域在 proto\\MoveList.textproto 以 snake_case 提供，招式 id 见 MoveEnum.proto。",
"    从 MoveList.textproto 解析 1041 个有 id 招式按位域归集，再与引擎 MV 表（shard 仅含 id 0–1031 连续 1032 条）取交集，MV_FLAG 新增 7 键：arrow 19、horn 22、air 36、hammer 32、throwing 23、drill 5、light 21。",
"    famAbiRuleOf 接入 12 个真正的增伤特性（用物种实际用名而非能力表规范名）：巨翼→air、强大之角→horn、弓箭手→arrow、超级重击者→hammer、神话之箭→arrow、能量角→horn、穿刺者→horn、灵魂粉碎者→hammer（mul1.1）、岩石载荷→岩石/投掷（mul1.5）、恶作剧礼物→冰/投掷（mul1.5）、锤拳→拳/锤（mul1.25）、巨型钻头→horn/drill。非增伤特性（形态/命中/吸收/受击/亲子/降防/烧伤）不接入；light 无 shard 内消费特性（Photokinesis1063/Photon Burst1064 超 shard 上限）。",
"    why 文案原硬编码 ×1.3 改为读取规则 mul（默认 1.3），1.1/1.25/1.5 特性文案准确，现有 1.3 特性文案不变。",
"    关键发现：全库扫描确认这 12 个特性从未成为任何流派的首推 abi[0]，总为次位选项，故门禁数字与基线完全一致（无回归）；补丁价值在数据完整性（MV_FLAG 成为源码招族的完整镜像）与未来安全网。",
"    1,981,187 B / `7A4EC47F9E44F851525E2A977D9F00F5F5BA7223`，待线上核验，物种 1906、流派 4328、fatal0 / dup0 / itemsOver0 / defOrb0 / badMove1（#862 历史遗留），offHist 与基线逐项一致，6 段语法 OK、smoke 33/33、行尾 CRLF 22647 / bare LF 51。",
]
block = "\r\n\r\n".join(paras) + "\r\n"
if not d.endswith(b"\r\n"):
    d += b"\r\n"
d += block.encode("utf-8")
open(P, "wb").write(d)
print("VERSIONS appended, CRLF", d.count(b"\r\n"), "bareLF", d.count(b"\n") - d.count(b"\r\n"))
