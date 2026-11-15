# -*- coding: utf-8 -*-
import io, os, hashlib
ROOT = r'D:\game\elite-redux'
ag = os.path.join(ROOT, 'AGENTS.md')
idx = os.path.join(ROOT, 'index.html')

d = open(idx, 'rb').read()
bytes_n = len(d)
sha = hashlib.sha1(d).hexdigest().upper()
t = d.decode('utf-8')
crlf = t.count('\r\n')
bare = t.count('\n') - crlf
print('index bytes', bytes_n, 'sha1', sha, 'CRLF', crlf, 'bareLF', bare)

row = (
 '| v4.382 | %s | %s | 待线上核验（本版主题「速度轴 self-centric + 空间/速攻互斥 + 顺风门控扩面不看 role + 速攻卡 EV 必须投速」，与 v4.379/v4.380/v4.381 队伍级铁律同线；先探针量化后改，不机械删）。'
 '基线（正式 harness.js 重跑，带队 fastTeam=[26 雷丘115,65 胡地120]、slowTeam=可学433 前3 低速、allTeam=[26,65,96,80,37,208]）：A0 无前缀纯速攻压制/速攻强化清场且自速<100 共 317（170 投速/147 零速）；A1 带体系前缀速攻且自速<100 共 374（钉子125/顺风39/雨36/晴34/场地31/空间27/雪26/沙19/免疫18/轻装16/精神场地1/薄雾场地1/接棒1）；B0 纯慢速重炮且自速>60 共 180；速度轴错配合计 871。'
 '规则①速度轴 key:\'speed\' 改 self-centric：新增 helper selfSpeedSource(s,p)——自速≥100 直过；否则折算 mul=天气提速特性 pvWeatherSpeedMul×1.5 × profile 自开顺风 fn.tw×2 × 轻装×2，有效速度 eff=round(spd×mul)≥100 才生成；队友高速只进 sc/drivenBy，不作生成条件；「空间」前缀与速攻语义互斥，pref===\'空间\' 不进速度轴。规则②慢速重炮 key:\'tr\' 只认 p.slow（≤60），队内空间手/低速个体只提分不作门控；空间来源（自学433 或队友空间手）仍保留为空间重炮的结构前提。规则③空间×速攻互斥：27 条前缀互斥卡拆分。规则④速攻卡 EV 必须真投速度：按最终实战招式复核速度来源，无任何当场生效来源（种族<100、无天气提速/实战顺风366/轻装/围巾/速度强化招 349/483/504/187/526）却仍冠速攻名 → 去速攻冠名（速攻强化清场→强化清场、速攻压制/轻装速攻流/速攻流→主力输出压制），记 v13Demoted/nameMismatch 并在招 why 注明；基础速度≥100、无倍率但 0 速投入且 ev.source 含「倍率」的，标 v13EvStale=true 并 why 注明（倍率收敛残留，EV 层结构性连带，本版不重排 EV/性格，登记 v4.383）。规则⑤顺风门控扩面：v4.381 的 role∈增伤/输出/强化白名单取消，凡 isGlassCannon（速≥100 且 bulkOf<270）且非恶作剧之心、非 ownAutoSys、非 score99 一律收 366，不看 role；耐久位 bulk≥270 带顺风仍属真·自有提速来源，保留不动；「顺风减伤轴」组合身份不归本版（v4.383 减伤轴处理），本版只拿掉顺风。补丁 C-c：evNatureLinkV437 顺风倍率由读名称前缀改为实战 main/func 含 366 判定（前缀可来自可学集误判）。'
 '探针结果（verify_speedaxis.js，带队跨队按 id+名去重）：①无来源速攻 spd<100=0；②纯慢速重炮 spd>60=0；③名含空间又含速攻=0；④速攻卡 0 速投入去重 143 = 倍率来源例外 97（天气提速/保留顺风/轻装/围巾）+ 倍率收敛残留 stale 39（登记 v4.383），无来源残留 0；降级命名 9 条（雪/沙/雨速攻强化清场→对应强化清场）。残留 A0 2 条均为轻装特性 ×2 合法（#106 飞腿郎87、#308 恰雷姆80，EV 252速）；A1 101 条前缀分布 顺风39/晴16/雨17/轻装16/沙6/雪6/场地1，全部自有倍率来源，verify① 无来源 0。顺风扩面（probe_tw_expand.js 旧 harness_old=v4.381 对比）：旧引擎玻璃带顺风 74 → 新引擎仅 1，本版收掉 73（肉盾56 + 轮转17）；唯一保留玻璃顺风 #547 风妖精（恶作剧之心豁免）；耐久位带顺风保留 319 条不动。流派总数归属（空队 harness 配对）：改名对 546（self 门重新识别速度身份，旧主力输出压制/增伤清场/强化清场/破盾 被正名为速攻身份，非真实增删）；真实新增 15（#103 椰蛋树 强化慢速重炮、#385 基拉祈 速攻强化清场、#521 高傲雉鸡 顺风速攻压制、#579 人造细胞卵 空间慢速重炮、#719 蒂安希 空间慢速重炮、#1651/#1652/#1654/#1657/#1660/#1664 阿尔宙斯六形态 顺风速攻强化清场、#2104 超级巨钳蟹 雨速攻强化清场、#2234 超级风速狗-洗翠 速攻压制、#2549 三首恶龙R 场地速攻强化清场、#2587 日月岩 顺风速攻强化清场）；真实移除 2（#103 椰蛋树 强化主力输出压制、强化稳健联防消耗，被强化慢速重炮替代）；净 +13。'
 '四轴只读登记（allTeam 六人队，本版不改引擎，留 v4.383）：增伤清场 97；减伤轴 1628（其中卡内特性不含任何减伤/免疫特性 DEF_ABI 白名单 1384，近似判据）；受队消耗 274；轮转补盲卡 223，其中 4 招 main 无 369/521 的 pivotNoPivot 85。'
 '门禁（gate.js 空队口径）：物种 1906、流派 4205（基线 v4.381 4192，净 +13，归属见上）、empty 空、fatal 空、badMove 1（#862 历史遗留 score99）、dup 0、itemsOver 0、defOrb 0；offHist 0:275 / 1:799(基线803,-4) / 2:552(基线549,+3) / 3:224(基线228,-4) / 4:48(基线47,+1) / 5:7(基线3,+4) / 7:1，漂移均由速度身份重排与新增/移除流派带来，无防守位宝珠/超 3 件回归。回归：verify_v4381.js 脆皮顺风残留 0、v4.380 钉子/空间/双墙残留 0；verify_sash.js bulk≥300 披带首位残留 0。实现锚点：selfSpeedSource 定义 15964 行；speed/tr 候选门 16150–16161；v4.382 收尾降级/标注块 14206–14244（catch(eV4382){eV4382.name} 非空，标记 v13SourceChecked/v13Demoted/v13EvStale 块首显式赋初值）；tailwind 实战招式判定 20717–20718；v4.381 顺风块门控 14101（已无 role 白名单）。静默 catch 仍 390 未增长；6 段 node --check 全过；smoke 33/33；行尾 CRLF %d / bare LF %d（基线 22994/51，bareLF 未增）。边界：墙类不再继续收口（单墙自身同吃减伤保留，仅双墙收一张）；玻璃大炮气势披带维持现状；不碰 master、不 merge/rebase。截图 docs/shots/v4382_*.png 待补） |\r\n'
) % (bytes_n, sha, crlf, bare)

t = io.open(ag, encoding='utf-8', newline='').read()
anchor = '| v4.381 | 2,005,705 |'
assert t.count(anchor) == 1
t = t.replace(anchor, row + anchor, 1)
io.open(ag, 'w', encoding='utf-8', newline='').write(t)
print('AGENTS v4.382 row inserted')
