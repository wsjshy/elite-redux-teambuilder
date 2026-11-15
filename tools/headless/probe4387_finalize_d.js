const fs=require('fs'),path=require('path');
const dir=__dirname;
const L=[];
L.push('');
L.push('## D 落地后复核（v4.387 引擎补丁已写入，当前引擎重推）');
L.push('');
L.push('### D 睡觉替换落地计数（empty / six 两口径对称）');
L.push('- 判据：bulk≥300，或（bulk≥270 且 min(Def,SpD)≥90 且无 4 倍弱点）；matchup 经 dec 归一（0→0、0.5/3→0.5、2→2、余 1），双类型乘积 ===4 记 4 倍。');
L.push('- 每侧：含睡觉 698（改前）；允许保留 242；不满足 456；落地替换 425；持有 31（受队消耗 26 记录/26 物种 + 食梦 5 记录/5 物种）。');
L.push('- 落地三桶（每侧）：真回复 224 / 补盲·本系 198 / 守住 3；两口径合计：真回复 448 / 补盲 396 / 守住 6，落地合计 850；持有合计 62（52 受队消耗记录/26 物种 + 10 食梦记录/5 物种）。');
L.push('- 守住 3 物种（两口径各 1，共 6 记录）：#265 刺尾虫、#266 甲壳茧、#831 毛辫羊；无可学严格自回血，补盲池无合格候选，落守住 182。');
L.push('- 持有 why：受队消耗「睡觉为本流派唯一回复来源，替换即失去 受队消耗 背书，本版保留」；食梦「食梦依赖睡眠来源，睡觉保留（本版不连食梦一并处理）」。');
L.push('- 回收一次流 32 记录/16 物种照常落地，换招 why 注明「回复由回收利用278承担」。');
L.push('- #1503 超级喷火龙Y：idx1 睡觉→355 羽栖；idx2 已带羽栖不动；270–299 披带/顺风分档未碰。');
L.push('');
L.push('### 落地后门禁 / 语法 / 零漂移 / 版本');
L.push('- gate：species 1906 / total 4205 / empty 0 / fatal 0 / badMove 1 / dup 0 / itemsOver 0 / defOrb 0；offHist 0:275 1:799 2:552 3:224 4:48 5:7 7:1，与基线逐项一致。');
L.push('- verify_desc：(a) 旧错值残留 0；(b) 有源码倍率条目未写出幅度 0；(c) 条目数差异 0（1034/929/1032/1906）。');
L.push('- verify_sleep：不满足判据且未登记持有仍带睡觉 = 0。');
L.push('- verify_ev / verify_boost / verify_reduce / verify_speedaxis / verify_v4381 / verify_sash / verify_default 全 PASS；零漂移比对：非授权漂移 0、条数差异 0，授权改名 10 条（洛托姆），授权换招按 _v387SleepSwap/_v386MvSwap 标记豁免 mv 比对。');
L.push('- smoke 33/33；6 段 node --check ALL OK；静默 catch 390（≤390）；bareLF 51 不增。');
L.push('- 版本三处 v4.387：ER_ENGINE_VER=v4.387；package.json 4.387.0；AGENTS.md 版本表 v4.387 行。');
L.push('- 补丁复现：patch_v4387.py 从 v4.386 基线 6b7a42f 重放，index 与 lite 分片 SHA1 与当前工作树逐字节一致。');
L.push('');
L.push('### 最终字节 / SHA1');
L.push('- index.html 2,043,221 B / SHA1 F34BF17F396C53387C63E50DA0EE2A3315E23887 / CRLF 23455 / bareLF 51。');
L.push('- data_lite_v498.js 382,638 B / SHA1 7CFAB0C16B520471C342CF259FE23BD9F0B6815C / bareLF 21。');
L.push('- data_adv_v498.js 575,962 B / SHA1 0CA1813D01673712B015488087A9C9A64C15CBCD / bareLF 4。');
L.push('- data_species_v498.js 1,362,446 B / SHA1 B0E4B6994721297C8DF78812B35CC45CFD7F9344 / bareLF 1。');

fs.appendFileSync(path.join(dir,'out_v4387_probe.txt'), L.join('\r\n')+'\r\n', 'utf8');

const jp=path.join(dir,'_ev4387.json');
const j=JSON.parse(fs.readFileSync(jp,'utf8'));
j.D=Object.assign({},j.D,{landing:{
  perSide:{allow:242,repl:456,land:425,keep:31,rec:224,cover:198,guard:3},
  total:{land:850,rec:448,cover:396,guard:6,keep:62,stallRecords:52,stallSpecies:26,dreamRecords:10,dreamSpecies:5},
  guardSpecies:['265','266','831'],
  index:{bytes:2043221,sha1:'F34BF17F396C53387C63E50DA0EE2A3315E23887',crlf:23455,bareLF:51},
  shards:{
    lite:{bytes:382638,sha1:'7CFAB0C16B520471C342CF259FE23BD9F0B6815C',bareLF:21},
    adv:{bytes:575962,sha1:'0CA1813D01673712B015488087A9C9A64C15CBCD',bareLF:4},
    species:{bytes:1362446,sha1:'B0E4B6994721297C8DF78812B35CC45CFD7F9344',bareLF:1}
  },
  replay:'patch_v4387.py 从 6b7a42f 基线逐字节重放一致'
}});
fs.writeFileSync(jp,JSON.stringify(j,null,1),'utf8');
console.log('D 落地证据已追加');
