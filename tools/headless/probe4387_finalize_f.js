const fs=require('fs'),path=require('path');
const dir=__dirname;
const jsonP=path.join(dir,'_ev4387.json');
const j=JSON.parse(fs.readFileSync(jsonP,'utf8'));
j.F={
  date:'v4.387 截图核验两处修复',
  dict:{
    added:32, note:'34 条中 1048/1053 分片无条目不补；968 无倍率保留原文并入字典',
    bannedTokensChecked:['源码','textproto','口径','实证','定稿','已废','本项目','模板旧文案','旧文案','【','→'],
    selfCheck:{
      '317':['35%','25%'],'582':['35%','25%'],
      '678':['×0.5','×2','只结算一次'],'948':['×0.5','×2','只结算一次']
    },
    abi3Kept:'ABI[id][3] 技术注记保留不动，字典覆盖仅作用于玩家可见层（abiDescZhOf 优先级：字典→ABI[3]→abiTags.nt）'
  },
  natFilter:{
    sharedFn:'keptNatList(bd.nat)（复用 v4.386 D-6 冲突归一规则：plus/neg 撞已保留项即丢弃）',
    sites:['详情 D-6 性格+原因','成员摘要性格行','详情卡性格字段'],
    note:'引擎 b.nat 数组不改；头部 nat[0] 选取逻辑不动。#1503[1] 内敛/慎重 → 内敛（慎重减特攻与内敛加特攻冲突）。',
    residual:'防守墙首项性格本身偏进攻（如 #66 固执/慎重/大胆、#70[0] 内敛/慎重/大胆）属引擎首推性格选择问题，不在本次展示层 why 区泄漏修复范围，留台账。'
  },
  rotom:{
    note:'改名 10 条记录（五形态 × 空队/六人队）；最终睡觉槽实测为 686 冰冰霜冻（部分形态 126 大字爆炎 / 247 暗影球），非 156；2 伤害招 + 特攻 EV252，主力输出压制冠名成立。',
    default1905:'#1905[0] 雪强化清场（进攻卡默认位），[1] 受队消耗；排序与锚定正常。'
  },
  gates:{
    gate:'1906/4205；empty 0；fatal 0；badMove 1；dup 0；itemsOver 0；defOrb 0；offHist 0:275/1:799/2:552/3:224/4:48/5:7/7:1',
    verifyDesc:'(a) 0 (b) 0 (c) 0 (d) 0',
    verifySleep:'不满足判据且未登记持有仍带睡觉 = 0',
    regressions:'verify_ev/boost/reduce/speedaxis/v4381/sash/default ALL PASS；零漂移非授权 0；静默 catch 390；bareLF index 51 不增',
    replay:'patch_v4387.py 从 6b7a42f 重放，index/lite SHA1 与工作树逐字节一致'
  },
  finalBytes:{
    index:{bytes:2043442,sha1:'FD4BB8F3F2A6C382F87AF9305575E7D2B41D584D',crlf:23462,bareLF:51},
    lite:{bytes:385739,sha1:'F06488048CEAD388F1050F2BB73BBA96EA9EF4B0',bareLF:21},
    adv:{bytes:575962,sha1:'0CA1813D01673712B015488087A9C9A64C15CBCD',bareLF:4},
    species:{bytes:1362446,sha1:'B0E4B6994721297C8DF78812B35CC45CFD7F9344',bareLF:1}
  }
};
fs.writeFileSync(jsonP,JSON.stringify(j,null,1),'utf8');

const txtP=path.join(dir,'out_v4387_probe.txt');
const lines=[];
lines.push('');
lines.push('## F. 截图核验两处修复（v4.387 收尾，未提交/未部署/未写正文文档）');
lines.push('');
lines.push('### F.1 问题1：并列说明被 scrubLeak 整句剥离 → 干净字典 ERDATA.abiDescZh');
lines.push('- 机制：渲染链 esc()→scrubLeak(mdInline())，规则 6b 剔除含「源码/口径/实证/…」分句；ABI[id][3] 技术注记保留不动，玩家可见幅度对照走字典覆盖（abiDescZhOf 优先级 字典→ABI[3]→abiTags.nt）。');
lines.push('- 新增干净字典条目 32 条：34 条中 1048/1053 分片无条目不补；968 无倍率保留原文并入字典。');
lines.push('- 触发词回避：不用 源码/textproto/口径/实证/定稿/已废/本项目/模板旧文案/旧文案/【/→；旧对照用「旧图鉴」，幅度口径用「游戏内实际结算」。');
lines.push('- 可见文本自检（scrub 后逐条，见 out_v4387_vis.txt）：317/582 同时含 35% 与 25%；678/948 含 ×0.5、×2、只结算一次；其余有源码倍率条目幅度 token 齐全；1048/1053 字典为空（台账留口）。');
lines.push('');
lines.push('### F.2 问题2：性格归一化复用至 why 区渲染');
lines.push('- 抽出共享函数 keptNatList(bd.nat)，规则与 v4.386 D-6 完全一致（以首项建 plus/neg 表，后续候选 plus 撞已保留 neg 或 neg 撞已保留 plus 即丢弃），三处渲染共用：详情 D-6、成员摘要性格行、详情卡性格字段；引擎 b.nat 数组不改。');
lines.push('- #1503[1] 属性免疫联防位：内敛/慎重 → 仅内敛（慎重减特攻与内敛加特攻冲突）。');
lines.push('- 残留留口：防守墙首项性格偏进攻（#66 固执/慎重/大胆、#70[0] 内敛/慎重/大胆、#1503[2] 固执/慎重）属引擎首推性格选择，非 why 区泄漏；本次展示层不重排。');
lines.push('');
lines.push('### F.3 顺带确认');
lines.push('- 洛托姆五形态改名 10 条记录（空队/六人队各 5）；最终睡觉槽实测 686 冰冰霜冻（1645[1] 为 126 大字爆炎、1646[1] 为 247 暗影球），非 156；2 伤害招 + 特攻 EV252，主力输出压制冠名成立。');
lines.push('- #1905[0] 雪强化清场（进攻卡默认位），[1] 受队消耗；默认排序与锚定正常。');
lines.push('');
lines.push('### F.4 门禁与复现');
lines.push('- gate 1906/4205；empty 0；fatal 0；badMove 1；dup 0；itemsOver 0；defOrb 0；offHist 0:275/1:799/2:552/3:224/4:48/5:7/7:1，与基线逐项一致。');
lines.push('- verify_desc：(a) 旧错值残留 0；(b) 倍率未写出 0；(c) 条目数差异 0；(d) 字典条目/幅度缺失 0。verify_sleep：不满足判据且未登记持有仍带睡觉 0。');
lines.push('- 七项回归 verify_ev/boost/reduce/speedaxis/v4381/sash/default ALL PASS；零漂移非授权 0；静默 catch 390（≤390）；bareLF index 51 不增。');
lines.push('- 补丁复现：patch_v4387.py 从 6b7a42f 基线重放，index/lite SHA1 与工作树逐字节一致。');
lines.push('');
lines.push('### F.5 最终字节 / SHA1');
lines.push('- index.html 2,043,442 B / FD4BB8F3F2A6C382F87AF9305575E7D2B41D584D / CRLF 23462 / bareLF 51。');
lines.push('- data_lite_v498.js 385,739 B / F06488048CEAD388F1050F2BB73BBA96EA9EF4B0 / bareLF 21。');
lines.push('- data_adv_v498.js 575,962 B / 0CA1813D01673712B015488087A9C9A64C15CBCD / bareLF 4。');
lines.push('- data_species_v498.js 1,362,446 B / B0E4B6994721297C8DF78812B35CC45CFD7F9344 / bareLF 1。');
fs.appendFileSync(txtP,lines.join('\n'),'utf8');
console.log('F 段证据已写入 _ev4387.json / out_v4387_probe.txt');
