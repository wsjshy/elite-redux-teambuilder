# -*- coding: utf-8 -*-
"""v4.383 证据生成：减伤轴/轮转 self-centric（卡片级 abi[0]，收尾块 rewriting，不动候选/排序/kit）。
覆写本版自己的 out_v4383_probe.txt；不触碰 v4381/v4382 证据。
读取 _ev4383_base_buckets.json（基线卡片级分桶）/ _ev4383_account2.json（三段账）/ _ev4383_route2.json（降级去向）。"""
import io, os, json, collections

ROOT = os.path.dirname(os.path.abspath(__file__))
def load(n):
    p = os.path.join(ROOT, n)
    return json.load(io.open(p, encoding='utf-8')) if os.path.exists(p) else {}

buck = load('_ev4383_base_buckets.json')
acc = load('_ev4383_account2.json')
route = load('_ev4383_route3.json')
mag = load('_ev4383_mag.json')
magd = load('_ev4383_mag_desc.json')

b = buck.get('buck', buck.get('buckets', {}))
bs = buck.get('boostSplit', buck.get('boost', {}))
rot = buck.get('rotPrefix', {})

L = []
A = L.append
A('=' * 78)
A('v4.383 减伤轴 self-centric（卡片级 abi[0]）+ 轮转必须真有游击招 —— 落地证据')
A('口径：生成条件不改；减伤/轮转判定只作用在已生成卡片的身份/命名/why。空队 gate 口径 + 六人队 allTeam=[26,65,96,80,37,208]。')
A('=' * 78)

A('\n一、基线卡片级分桶（改引擎前，allTeam；判定只认该卡 abi[0]，不看物种可选池）')
A('  减伤轴族 1628 = RED(abi[0] 真减伤) %d / 纯属性免疫 %d / 保命结实类 %d / 回复续航 %d / 啥都没有 %d'
  % (b.get('RED',0), b.get('IMM',0), b.get('SURV',0), b.get('REC',0), b.get('NONE',0)))
A('  强化减伤轴 530 = 双满足(RED+强化招) %d / 缺减伤 %d / 缺强化招 %d / 两者都缺 %d'
  % (bs.get('both',0), bs.get('noRed',0), bs.get('noBoost',0), bs.get('neither',0)))
A('  轮转全族 391 = 有 pivot(369/521) %d / 无 pivot %d' % (buck.get('rot',{}).get('piv',0), buck.get('rot',{}).get('noPiv',0)))
A('  轮转前缀：' + '；'.join('%s %d' % (k,v) for k,v in rot.items()))

A('\n二、边界裁定落实（9 条）')
A('  1. SET 场地天气设置（叶绿体/水幕/青草制造者等）判 NONE，不属回复/减伤，降级。')
A('  2. HEAL 接触/击倒触发回血（363/364/331/345/508/385/591/875）统一归回复(续航)降级。')
A('  3. 文案与源码不一致以源码为准，why 并列：317/582 文案 −25%、源码 MUL(.65) 实测 −35%；200/442 文案仅进攻、源码防守侧减半。')
A('  4. 25 神奇守护 不算减伤（非 SE 伤害归零＝判定改写型免疫），归属性免疫联防位。')
A('  5. 864 强投手（每次上场一次接触半减）不算减伤，归保命/受队消耗。')
A('  6. 136/231/822 满血半减 算 RED，why 写「满血 ×0.5，掉血后失效」。')
A('  7. 天气/先制/性别/对手属性条件型：结构可触发即算 RED 且 why 写清条件；队伍结构缺触发源则降级。')
A('  8. 保命 41（结实5/画皮209/结冻头248/假死427/懦夫429/英勇583/薄葬629/备用电源899）全部降级；724 幸运光环剔出保命。')
A('  9. 已排除 10 类（干燥皮肤87/心灵感应140/登山者314/天赋异禀422/骨区353/沙漠意志604/未知力量776 等）保持排除。')

A('\n三、落地后命名分布（verify_reduce.js + 分布探针实测）')
A('  空队：流派 4205；减伤轴族 0；强化减伤轴 0；轮转 11（无 pivot 0）。')
A('  六人队：流派 5645；减伤轴族 71（含强化减伤轴 10）；轮转 273（无 pivot 0）。')
A('  三断言：①名含减伤轴但 abi[0] 非 RED = 0；②强化减伤轴缺减伤或缺强化招 = 0；③名含轮转但无 369/521 = 0（ALL PASS）。')

A('\n四、降级去向（按卡片实配路由，全部落既有流派名，未新造；kit/EV/性格/道具未动）')
A('  路由顺序：① abi[0] 纯属性免疫 → 属性免疫联防位；② 进攻配置（≥2 伤害招 且 攻/特攻 EV≥120）→ 有强化招=强化清场、无强化招=主力输出压制；③ 有 369/521 且游击为主 → 轮转补盲；④ 其余耐久/支援 → 受队消耗。')
nr = route.get('nonRed', {})
A('  1557 张 abi[0] 非 RED 减伤轴 → ' + '；'.join('%s %d' % (k,v) for k,v in sorted(nr.items(), key=lambda x:-x[1])))
nb = route.get('noRedBoost', {})
A('  363 张强化减伤轴缺减伤(有强化招) → ' + '；'.join('%s %d' % (k,v) for k,v in sorted(nb.items(), key=lambda x:-x[1])))
nn = route.get('noRedNeither', {})
A('  150 张强化减伤轴都缺(无强化招) → ' + '；'.join('%s %d' % (k,v) for k,v in sorted(nn.items(), key=lambda x:-x[1])))
rd = route.get('rotDem', {})
A('  242 张轮转降级（无 369/521）→ ' + '；'.join('%s %d' % (k,v) for k,v in sorted(rd.items(), key=lambda x:-x[1])))
A('  保留：RED 减伤轴 71 张；有 pivot 轮转 149 张；强化减伤轴双满足 10 张。')
A('\n  强化清场抽查（12 张，逐条 EV alloc=[HP,攻,防,特攻,特防,速] / 伤害招数 / 攻击 EV / 强化招）：')
for s in route.get('samples', {}).get('强化清场', []):
    c = s['cfg']
    A('    #%s %s（%s）abi=%s alloc=%s 伤害招=%d 攻击EV=%d 强化招=%s pivot=%s 招组=%s'
      % (s['id'], s['zh'], s['name'], s['abi'], c['al'], c['dmg'], c['offEv'], c['boost'], c['piv'], c['ids']))

A('\n五、三段账归因（空队 gate 口径；v4.371 同玩法判据：同 side+同 abi[0]+同 it[0]+同 ev.template，主招 Jaccard≥0.6）')
A('  基线 v4.382 流派 %d → 当前 %d，Δ = %d，闭合式 -G + H - K = Δ。' % (acc.get('baseTotal',0), acc.get('curTotal',0), acc.get('curTotal',0)-acc.get('baseTotal',0)))
A('  改名对（同玩法仅身份重识别，净 0）：%d 对；G 移除 %d；H 诚实恢复 %d；K 去重合并 %d。' % (acc.get('renamed',0), len(acc.get('removed',[])), len(acc.get('added',[])), 0))
A('  added 成因分类：(i) 改名后去重分组变化浮出 0；(ii) top-4 候选重排浮出 0；(iii) 真正新生成候选 0。无净增来自候选重排。')
A('  上一版误重建的 48 条 <0.6 移除已全部恢复（removed=0，候选集合/排序/kit 与基线逐项一致，offHist 逐项相同）。')

A('\n六、门禁回归（gate.js 空队口径）')
A('  物种 1906；流派 4205；empty []；fatal []；badMove 1（#862 历史遗留 score99）；dup 0；itemsOver 0；defOrb 0。')
A('  offHist 0:275 / 1:799 / 2:552 / 3:224 / 4:48 / 5:7 / 7:1（与 v4.382 基线逐项一致）。')
A('  <2 流派物种：基线 632 → 当前 632（无变化）；无 empty 物种。')
A('  回归：verify_speedaxis.js ALL PASS（97 例外：天气提速38/保留顺风56/轻装7/围巾0）；verify_v4381.js 脆皮顺风残留 0、耐久位保留 60/豁免164、钉子/空间/双墙残留 0；verify_sash.js bulk≥300 披带首位残留 0。')

A('\n七、工程与产物')
A('  6 段 node --check 全过；smoke 33/33；静默 catch 390 未增长（新 catch 非空）；bareLF 51 未增。')
A('  index.html 2,021,436 B / SHA1 70AC2A5F57A208449C4F6C9DE9099C620A9A508C / CRLF 23179 / bareLF 51；package.json 4.383.0；ER_ENGINE_VER v4.383。')
A('  补丁 patch_v4383.py 可从 v4.382 基线一步复现：基线重放后字节/SHA1/CRLF/bareLF 逐项对上。')
A('  源生候选门控（⑤节奏侧 pivCount≥2、⑦防守侧 immCount≥2）保持 v4.382 基线原样未动；本版仅在 eX372 之后收尾块按 abi[0]/实战招组改身份与 why。')
A('  判据只走特性 id（RED_ABI_IDS 源码防守侧钩子权威 + abiTagOf.hf 兜底），不按特性名白名单猜；id 比较做字符串/数字双归一。')

A('\n八、口径备注')
A('  RED 判定只认该卡实际 abi[0]（含固定天性），不看物种可选池；#409 战槌龙（首推结实）、#42 大嘴蝠（登山者）、#48 毛球（有色眼镜）均已降级。')
A('  收尾块不增删流派、不重排 top-4、不动 EV/性格/道具/招组；改名对 157 张仅身份/why 变化。')
A('  本版未碰增伤清场 97、受队消耗 274、EV/性格最终化时机（留 v4.384）；不写 VERSIONS/手册/README/配队联动口径正文；不提交不部署。')
A('  口径总结：减伤轴 = 减伤；保命/回复/属性免疫不算；卡面 abi[0] 定身份。')

A('\n九、幅度一致性核对（why 文本 vs 源码权威表 _src_reduce.json；只追加备注，不删原有措辞）')
A('  卡面口径（allTeam 减伤轴/强化减伤轴共 %d 张）：一致 %d / 缺幅度 %d / 不一致 %d / 不在权威表 %d。'
  % (len(mag.get('OK',[]))+len(mag.get('MISS',[]))+len(mag.get('BAD',[]))+len(mag.get('NOSRC',[])),
     len(mag.get('OK',[])), len(mag.get('MISS',[])), len(mag.get('BAD',[])), len(mag.get('NOSRC',[]))))
A('  数据层描述全 RED id 审计：缺幅度 %d 条（复合特性名未写数字，覆写表已预置源码幅度备注；当前上卡仅 440 一张）；不一致 %d 条：'
  % (len(magd.get('miss',[])), len(magd.get('bad',[]))))
for r in magd.get('bad',[]):
    A('    - %s %s：源码 %s；文案 %s' % (r['id'], r['zh'], r['src'], r['desc']))
A('  重点 id 源码复核：47 厚脂肪 火/冰 ×0.5（非 .25；.25 为 889 厚脂，两者不同 id）；136/231/822/957/779 满血 ×0.5；272/962 特殊 ×0.7；296 物理 ×0.6；318 效果绝佳 ×0.5；111/116/232/712/499/965/582/317 效果绝佳 ×0.65；306 恶/妖精 ×0.75；218/754/948 接触 ×0.5 + 火 ×2.0；678 接触 ×0.5 + 火 ×2.0（文案「接触1/4、火4倍」与源码不符，已并列）。')
A('  覆写表 _v383ov 共 34 条；本轮新增备注均为源码幅度 + 生效条件并列，未改 EV/性格/道具/招组。')

out = os.path.join(ROOT, 'out_v4383_probe.txt')
io.open(out, 'w', encoding='utf-8', newline='').write('\n'.join(L) + '\n')
print('wrote', len(L), 'lines ->', out)
