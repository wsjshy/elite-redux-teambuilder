// 追加 v4.386 落地段证据到 out_v4386_probe.txt（探针段已存在，本脚本只追加，不覆盖）。
const fs = require('fs'), path = require('path');
const dir = __dirname;
const R = JSON.parse(fs.readFileSync(path.join(dir, '_land4386.json'), 'utf8'));
const L = [];
const w = s => L.push(s);

w('');
w('## 七、落地段实测（patch_v4386.py 从 v4.385 基线逐字节复现；未写文档正文、未提交、未部署）');
w('');
w('后置最终化 pass 插在 `}catch(eV4385){eV4385.name}` 之后、`return out;}` 之前，自包 try/catch（catch eV4386）；pass 顺序：③ 改名 → ② 睡觉替换 → ① 排序；④ 为 anDetailHtml D-6 渲染行内 IIFE，引擎 nat 数组不改。per-build 标记（_v386Renamed/_v386OldName/_v386MvSwap/_v386Reordered/_v386LooseLedger）块首显式赋初值，幂等。');
w('');

// ①
w('### 7.1 ① 默认排序（strict 进攻卡移 [0]；白名单维持；loose 记台账）');
w('');
w('| 口径 | 重排移 [0] | loose 台账不重排 | 白名单维持 [0] |');
w('|---|---|---|---|');
w(`| 六人队 | ${R.six.reordered.length} | ${R.six.loose.length} | ${R.six.whitelist.length} |`);
w(`| 空队 | ${R.empty.reordered.length} | ${R.empty.loose.length} | ${R.empty.whitelist.length} |`);
w('');
w('白名单 13（mechRw 非空、机制卡即物种真实身份，维持 [0] 不动）：');
R.empty.whitelist.forEach(r => w(`- #${r.id} ${r.zh} [${r.name}] rw=${r.rw}`));
w('');
w('loose 台账（仅 loose 进攻卡、未过 strict 三条件门，本版不重排）：');
w('- 空队：');
R.empty.loose.forEach(r => w(`  - #${r.id} ${r.zh} [${r.name}] ${r.side}/${r.role}`));
w('- 六人队：');
R.six.loose.forEach(r => w(`  - #${r.id} ${r.zh} [${r.name}] ${r.side}/${r.role}`));
w('');
w('空队重排 93 条（strict 进攻卡 splice+unshift 到 [0]，被挤下的机制/防守卡保留为备选，不删不改内容）：');
w(R.empty.reordered.map(r => `#${r.id} ${r.zh}→[${r.name}/${r.role}/${r.side}]`).join('、'));
w('');

// ②
w('### 7.2 ② 睡觉 156 替换（玻璃大炮；先严格自回血 → 补盲伤害招 → 守住 182）');
w('');
w('| 落点 | 六人队 | 空队 |');
w('|---|---|---|');
w(`| 睡觉→严格自回血/吸血 | ${R.six.heal.length} | ${R.empty.heal.length} |`);
w(`| 睡觉→补盲伤害招 | ${R.six.cover.length} | ${R.empty.cover.length} |`);
w(`| 睡觉→守住 182 | ${R.six.protect.length} | ${R.empty.protect.length} |`);
w('');
w('66 档（无自回血）按流派名细分（空队口径）：' + Object.entries(R.empty.coverByType).map(([k, v]) => `${k} ${v}`).join(' / ') + '。');
w('与用户预估 双墙46/免疫18/回收1/扑壁1 的 1 条边界差：我方按卡面流派名确定性计数为 双墙45/免疫19/回收1/扑壁1；#125/#310/#311/#312/#1590/#2505 等物种同时各有一张双墙卡与一张免疫卡，分属不同配置，未为凑 46/18 硬塞。');
w('');
w('37 档自回血落点（空队，逐条）：');
R.empty.heal.forEach(r => w(`- #${r.id} ${r.zh} [${r.name}] ${r.swap}`));
w('');
w('66 档补盲落点（空队，逐条）：');
R.empty.cover.forEach(r => w(`- #${r.id} ${r.zh} [${r.name}] ${r.swap}`));
w('');

// ③
w('### 7.3 ③ 改名（只改 name；EV/性格/招组/道具/特性不动）');
w('');
w('已落地（按 side+role+alloc 身份门精确匹配目标卡，同物种其他同名变体不动）：');
[...R.empty.rename, ...R.six.rename].forEach(r => w(`- #${r.id} ${r.zh}：${r.old} → ${r.now}`));
w('');
w('受阻未改（速度轴硬门）：#1643–1647 洛托姆五形态 base spd=86>60，v4.382 规则「慢速重炮 spd>60=0」硬门禁；引擎既有慢速名族（慢速重炮/空间慢速重炮/场地慢速重炮…）基线全部 spd≤60，无合规既有名可换，本版保留「属性免疫联防位」，单独上报留后续。');
w('');
w('非目标同名变体（同物种肉盾/轮转变体，按设计保留旧名台账）：见 verify_default 输出「非目标同名变体保留旧名」清单。');
w('');

// ④
w('### 7.4 ④ 展示层矛盾性格归一过滤（仅渲染文本，引擎 b.nat 数组不改）');
w('');
w('过滤规则（anDetailHtml D-6 行内 IIFE）：以 nat[0] 为基准建 plus/neg stat 表；后续候选若其 plus stat 命中已保留 neg、或 neg stat 命中已保留 plus 则丢弃；中性性格无 plus/neg 不冲突可留。');
w(`- 空队矛盾性格卡：${R.empty.natClash} 条，过滤后每条至少剔除 1 个冲突候选（${R.empty.natAfterFilter} 条发生裁剪）；六人队 ${R.six.natClash} 条。`);
w('- #1503 超级喷火龙Y 防守卡 nat=[内敛(+特攻-攻击), 慎重(+特防-特攻)]：慎重减特攻与内敛加特攻冲突，过滤后详情 D-6 仅展示「内敛」；引擎 nat 数组仍为两项（快照 nat 字段零漂移可证）。');
w('');

// 验收
w('### 7.5 验收结果');
w('');
w('**verify_default.js 三断言（tools/headless/verify_default.js）**');
w('- ① 进攻身份物种（有 strict 进攻卡、非白名单）默认 [0] 为防守卡：0 PASS');
w('- ② 玻璃大炮含睡觉 156：0 PASS');
w('- ③ 目标身份卡旧名残留：0 PASS');
w('- ⑤ 快照零漂移：six 比对 5645 条 / 差异 0；empty 比对 4205 条 / 差异 0（未命中卡 alloc/nat/name/side/roleTag/tpl/mv/it0/abi0 全字段一致；改名物种豁免 name、换招物种豁免 mv，稳定签名多重集配对）。');
w('');
w('**gate（node tools/headless/gate.js）**：物种 1906 / 流派 4205（Δ=0）；empty []；fatal []；badMove 1（#862 机制保留）；dup 0；itemsOver 0；defOrb 0；offHist 0:275 / 1:799 / 2:552 / 3:224 / 4:48 / 5:7 / 7:1，与 v4.385 基线逐项一致。');
w('');
w('**六项回归**：verify_ev ALL PASS（①0 ②0 ③0 ④0 ⑤未命中差异 0；快照差异均为 v4.385 fixed 卡）；verify_boost ALL PASS；verify_reduce ALL PASS；verify_speedaxis ALL PASS（无来源速攻 0、慢速重炮>60 0、空间×速攻 0、缺 why 文案 0）；verify_v4381 exit 0；verify_sash exit 0（residue 0 / changed 84 / edge 68 / except 1）。');
w('');
w('**工程口径**：6 段内联脚本 node --check 全过；smoke 33/33；静默 catch 390（基线 390，未增长）；bareLF 51 不增；版本三处 v4.386（index ER_ENGINE_VER / package.json 4.386.0 / AGENTS.md 占位行）；<2 流派物种 632 不变。');
w('');
w('**最终 index.html**：2,037,115 B / SHA1 A9D5FFE42B4D4E4AC41C0C4F17D549BDDBFBE143 / CRLF 23404 / bareLF 51。');
w('');
w('### 7.6 边界与未决');
w('1. 五洛托姆（#1643–1647）改名受阻，留 v4.387 前复核：需另选既有非慢速重炮名或调整引擎速度轴口径。');
w('2. 66 档双墙/免疫 1 张边界卡按实测 45/19 落，未定位到用户 46/18 的分歧卡；计数口径为卡面流派名。');
w('3. 已知不动项：#110 双弹瓦斯双刀矛盾；#2215 结构性不可修；数据分片留 v4.387；近配置联防、跨流派消耗招重判留后续；#1503 bulk 272 非玻璃大炮，睡觉不在 ② 范围。');
w('4. 本步未写五份文档正文、未提交、未部署；AGENTS.md v4.386 行字节/SHA1 为占位，发布前回填。');

const fp = path.join(dir, 'out_v4386_probe.txt');
const prev = fs.readFileSync(fp, 'utf8');
fs.writeFileSync(fp, prev.replace(/\r?\n$/, '') + '\r\n' + L.join('\r\n') + '\r\n', 'utf8');
console.log('appended landing lines', L.length);
