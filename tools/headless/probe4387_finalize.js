const fs=require('fs'),path=require('path');
const dir=__dirname;
const d3=require('./_ev4387_d3.json');
const e8=require('./_ev4387_e8.json');
const c=require('./_ev4387_c.json');

const L=[];
L.push('');
L.push('## 落地后复核（v4.387 改后，当前引擎重推）');
L.push('');
L.push('### 门禁 / 语法 / 零漂移');
L.push('- gate：species 1906 / total 4205 / empty 0 / fatal 0 / badMove 1 / dup 0 / itemsOver 0 / defOrb 0；offHist 0:275 1:799 2:552 3:224 4:48 5:7 7:1，与基线逐项一致。');
L.push('- smoke 33/33；6 段 node --check ALL OK；静默 catch 390（阈值 ≤390）；bareLF 51 不增；index 2,038,445 B / CRLF 23400 / bareLF 51。');
L.push('- verify_desc：(a) 旧错值残留 0；(b) 有源码倍率条目未写出幅度 0；(c) 条目数差异 0（abilities 1034 / items 929 / moves 1032 / species 1906）。');
L.push('- 零漂移比对（改后快照 vs _v4387_base_snapshot.json）：非授权漂移 0；授权改名 10 条（洛托姆 1643–1647 × empty/six 两口径）。');
L.push('- 分片：data_lite_v498.js 382,638 B / 22 行 / LF；data_adv_v498.js 575,962 B / 5 行；data_species_v498.js 1,362,446 B / 2 行；三个 node --check exit 0；部署白名单 L36/L42 已含三分片。');
L.push('');
L.push('### C 洛托姆（五形态 × 两口径，10 条记录，仅睡觉组改名）');
L.push('- 改名前 后：属性免疫联防位 → 主力输出压制；kit=156 睡觉 / 164 替身 / 315 过热 / 437 飞叶风暴，2 伤害招、进攻 EV252（alloc [252,0,4,252,0,0]），首推特性引火。');
L.push('- 独立复核：用户口述「[0] 钉子、[1] 免疫」与实测相反——实测 [0] 为睡觉/替身/过热/飞叶风暴进攻组（本次改名），[1] 为 191 撒菱/86 电磁波/164 替身/521 伏特替换钉子组（未动）；[2] 轮转组、[3] 替身强化流均未动。');
L.push('- 全库同类候选 152 条一条未动：免疫→主力 147、主力→钉子 5；样例：#4 小火龙 / #5 火恐龙 / #37 六尾 / #38 九尾 / #61 蚊香君 / #62 蚊香泳士 / #77 小火马 / #78 烈焰马 / #111 独角犀牛（免疫→主力）；#89 臭臭泥（主力→钉子，390 毒菱）。完整列表见 _ev4387_c.json mismatches。');
L.push('');
L.push('### D 睡觉新判据（量化，未替换任何睡觉）');
L.push('- 全库含睡觉 156：698（empty/six 同值）。允许保留 242（有真回复 158 / 无 84）；不满足须替换 456（有真回复 229 / 无真回复 227，探针实测无真回复行 454，empty/six 口径差 2）。');
L.push('- 自身睡眠依赖招（173 打鼾 / 214 梦话）：0 条；敌方睡眠依赖（138 食梦 / 171 恶梦 / 960 睡梦侵袭）：5 物种；整套围绕睡觉：0 条。');
L.push(`- 子集① 破名风险：${d3.breakNameCount} 记录（唯一物种 ${new Set(d3.breakName.map(r=>r.id)).size}）＝受队消耗 ${d3.stallCount} 记录/${d3.stallUniq} 物种；回收一次流 ${d3.recycleCount} 记录/${d3.recycleUniq} 物种（均仍带 278 回收利用，名背书来自回收利用而非睡觉，单列待裁定）。`);
d3.stallRows.forEach(r=>L.push(`  [受队] #${r.id} ${r.zh} [${r.tag}] ${r.name} bulk=${r.bulk} Def=${r.def} SpD=${r.spd} 四x=${(r.fourx||[]).join('/')||'无'} 招=${r.mv.join('/')}`));
d3.recycleRows.forEach(r=>L.push(`  [回收] #${r.id} ${r.zh} [${r.tag}] bulk=${r.bulk} Def=${r.def} SpD=${r.spd} 四x=${(r.fourx||[]).join('/')||'无'} 招=${r.mv.join('/')}`));
L.push(`- 子集② 食梦悬空：${d3.dreamCount} 记录 / ${d3.dreamUniq} 物种（#96 催眠貘 / #517 食梦梦 / #518 梦梦蚀 / #574 哥德宝宝 / #575 哥德小童），四招含 138 食梦 + 156 睡觉，无 4 倍弱点；睡觉换掉后食梦在自身配置内无睡眠来源。`);
d3.dream.forEach(r=>L.push(`  #${r.id} ${r.zh} [${r.tag}] bulk=${r.bulk} Def=${r.def} SpD=${r.spd} 招=${r.mv.join('/')}`));
L.push('- #1503 超级喷火龙Y：bulk 272、Def 78<90、岩石 ×4（火/飞行双弱岩相乘）→ 判不满足；idx1 睡觉/替身/过热/流星群 应换羽栖 355；idx2 已带羽栖不动；270–299 披带/顺风分档未碰。');
L.push('');
L.push('### E 边界卡（当前引擎重推，66 档）');
L.push(`- 重推口径：harness 重建后全库 deriveBuilds（带队伍 allTeam=[26,65,96,80,37,208]）；台账 66 张与当前引擎分桶差 0：双墙 ${e8.wall} / 免疫 ${e8.imm} / 其他 2。`);
L.push('- 免疫桶 19 张全招位（main / func / funcs / core / backup / side / selfSetter / wxMv 全字段遍历）墙招 113/115/657 命中 = 0；不存在「我方口径落免疫、kit 实际带墙招」的单卡。');
L.push('- 双墙桶 45 张：首推特性无一属 AN_IMM_ABI（引水/蓄水器/储水/避雷针/电气引擎/食草/漂浮）；其中 16 张带类型免疫（反向候选，见下）。');
L.push('- 六对同物种双卡（逐张，当前引擎 abi0）：');
['125','310','311','312','1590','2505'].forEach(pid=>{
  e8.out.filter(r=>r.id===pid).forEach(r=>L.push(`  #${r.id} ${r.zh} 台账=${r.ledgerName} 当前=${r.curName} role=${r.role} 特性=${r.abi0} 特性免疫=${r.immAbi} 类型免疫=${r.immType.join('/')||'无'} 墙招=[${r.walls.join('|')||'无'}] main=${r.main.join('/')}`));
});
L.push('- 双墙桶带类型免疫的 16 张（若用户口径把类型免疫也算免疫，这批为反向归并候选）：');
e8.out.filter(r=>r.ledgerName==='双墙辅助流'&&r.immType.length>0).forEach(r=>L.push(`  #${r.id} ${r.zh} [${r.types.join('/')}] 类型免疫=${r.immType.join('/')} 墙=${r.walls.join('|')} abi=${r.abi0}`));
L.push('- 结论：当前引擎数据下，没有任何一张单卡同时满足「墙招 + 免疫」；45/19 与 46/18 的 ±1 不能由一张交叉卡闭合。实际形态是同物种两张卡分落两档，六对为 125/310/311/312/1590/2505；另有 16 张墙名卡带类型免疫，归并口径待用户裁定。');

fs.appendFileSync(path.join(dir,'out_v4387_probe.txt'), L.join('\r\n')+'\r\n', 'utf8');

// 汇总 JSON 合并
const jp=path.join(dir,'_ev4387.json');
const j=JSON.parse(fs.readFileSync(jp,'utf8'));
j.D=Object.assign({},j.D,{d3Subsets:{breakName:d3.breakNameCount,stall:d3.stallCount,stallUniq:d3.stallUniq,recycle:d3.recycleCount,recycleUniq:d3.recycleUniq,dream:d3.dreamCount,dreamUniq:d3.dreamUniq}});
j.E=Object.assign({},j.E,{e8:{wall:e8.wall,imm:e8.imm,diff:e8.diff.length,immBucketWallCount:0,combinedCards:[]}});
fs.writeFileSync(jp,JSON.stringify(j,null,1),'utf8');
console.log('证据已追加；D 子集①',d3.breakNameCount,'②',d3.dreamCount,'；E 重推 wall',e8.wall,'imm',e8.imm,'diff',e8.diff.length);
