// v4.387 verify_desc：(a) 34 条旧错值残留=0；(b) 有源码伤害倍率条目未写出幅度=0（968 等无倍率走登记表排除）；
// (c) 条目数不变；(d) 32 条玩家可读干净文案在 abiDescZh 字典有条目，经 scrub 后可见且含幅度 token（1048/1053 分片无条目不补）。
const H = require('./harness.js');
const ERDATA = H.ERDATA;
const scrub = t => H.scrubLeak ? H.scrubLeak(H.mdInline(String(t == null ? '' : t))) : String(t == null ? '' : t);

const AB = ERDATA.abilities || [];
const by = id => AB.find(a => String(a[0]) === String(id));

// (a) 旧错值残留：逐条给出必须消失的旧文案片段
const OLD_WRONG = {
  '317': ['25%'], '582': ['25%'],
  '817': ['减半', '50%'],
  '678': ['1/4', '4 倍', '4倍'],
  '1004': ['10%', '20%'],
  '773': ['5回合', '5 回合'],
  '200': ['1.3倍', '1.3 倍'],
  '829': ['1.3倍', '1.3 倍'],
};
// (b) 有源码伤害倍率的条目：描述必须写出的幅度 token（缺一即判未写幅度）
const MAG = {
  '317': ['.65'], '582': ['.65'], '442': ['1.5', '0.5'], '440': ['0.5'],
  '499': ['0.65'], '524': ['1.3', '0.5'], '613': ['0.5'], '664': ['2.0', '0.5'],
  '671': ['0.85', '0.25'], '678': ['0.5', '2.0'], '682': ['0.5'], '726': ['1.3', '0.5'],
  '741': ['0.7'], '773': ['0.5'], '779': ['0.5'], '817': ['0.8'],
  '881': ['1.2', '0.5'], '900': ['0.5'], '925': ['0.5'], '932': ['0.65'],
  '936': ['0.5'], '948': ['0.5', '2.0'], '954': ['0.5'], '962': ['0.7'],
  '970': ['0.8'], '997': ['0.8'], '1004': ['0.7', '0.85'], '1010': ['0.5'], '1032': ['1.2', '0.5'],
};
// 无倍率可补 / 整句重写无倍率：登记表排除 (b)
const EXCLUDE_MAG = { '968': '仅暴击免疫，无伤害倍率', '200': 'ATE 无威力倍率', '829': 'ATE 无威力倍率', '1048': '分片未登记', '1053': '分片未登记' };

let fail = 0;
const aBad = [], bBad = [];

// 旧错值若仍出现，只能出现在「并列注记」里（紧邻 图鉴/旧文案/标称/残留/假设/原版/不符 等对照标记），
// 不得作为当前生效幅度。命中且无对照标记才算残留。
const NOTE_MARK = /图鉴|旧文案|标称|残留|假设|原版|与源码不符|不符|均错|与源码/;
Object.entries(OLD_WRONG).forEach(([id, frags]) => {
  const e = by(id); if (!e) { aBad.push(id + '(条目缺失)'); return; }
  const desc = String(e[3] || '');
  frags.forEach(f => {
    const i = desc.indexOf(f);
    if (i < 0) return;
    const win = desc.slice(Math.max(0, i - 24), i + f.length + 16);
    if (!NOTE_MARK.test(win)) aBad.push(id + ' 正文仍含旧错值「' + f + '」（无对照注记）');
  });
});

Object.entries(MAG).forEach(([id, toks]) => {
  const e = by(id); if (!e) { bBad.push(id + '(条目缺失)'); return; }
  const desc = String(e[3] || '');
  toks.forEach(t => { if (desc.indexOf(t) < 0) bBad.push(id + ' 缺幅度 token「' + t + '」'); });
});

// (d) 干净字典可见文案：有条目 + scrub 后含幅度 token；200/829/968 仅要求有条目。
const DICT_MAG = {
  '317': ['35%', '25%'], '582': ['35%', '25%'], '442': ['1.5', '0.5'], '440': ['0.5'],
  '499': ['0.65', '35%'], '524': ['1.3', '0.5'], '613': ['0.5'], '664': ['2.0', '0.5'],
  '671': ['八成五', '四分之一'], '678': ['×0.5', '×2', '只结算一次'], '682': ['0.5'],
  '726': ['1.3', '0.5'], '741': ['0.7', '30%'], '773': ['0.5'], '779': ['0.5'],
  '817': ['0.8', '20%'], '881': ['1.2', '0.5'], '900': ['0.5'], '925': ['0.5'],
  '932': ['0.65', '35%'], '936': ['0.5'], '948': ['×0.5', '×2', '只结算一次'],
  '954': ['0.5'], '962': ['0.7', '30%'], '970': ['0.8', '20%'], '997': ['0.8', '20%'],
  '1004': ['0.7', '0.85'], '1010': ['0.5'], '1032': ['1.2', '0.5'],
};
const DICT_ENTRY_ONLY = { '200': 1, '829': 1, '968': 1 };
const DICT_IDS = Object.keys(DICT_MAG).concat(Object.keys(DICT_ENTRY_ONLY));
const dict = ERDATA.abiDescZh || {};
const dBad = [], dLeak = [];
const BANNED = /源码|textproto|口径|实证|定稿|已废|已废弃|本项目|模板旧文案|旧文案|【|→/;
DICT_IDS.forEach(id => {
  const z = dict[id];
  if (z == null || z === '') { dBad.push(id + '(字典缺条目)'); return; }
  if (BANNED.test(String(z))) dLeak.push(id + ' 仍含剥离触发词');
  const vis = scrub(z);
  if (!vis.trim()) dBad.push(id + ' scrub 后可见文本为空');
  (DICT_MAG[id] || []).forEach(t => { if (vis.indexOf(t) < 0) dBad.push(id + ' 可见文本缺幅度 token「' + t + '」'); });
});

const counts = { abilities: AB.length, items: (ERDATA.items || []).length, moves: (ERDATA.moves || []).length, species: (ERDATA.species || []).length };
const EXPECT = { abilities: 1034, items: 929, moves: 1032, species: 1906 };
const cBad = Object.keys(EXPECT).filter(k => counts[k] !== EXPECT[k]);

console.log('条目数', JSON.stringify(counts), '期望', JSON.stringify(EXPECT));
console.log('(a) 旧错值残留:', aBad.length === 0 ? '0 ✓' : aBad.length + ' 条 ✗');
aBad.forEach(x => console.log('   ✗', x));
console.log('(b) 倍率未写出:', bBad.length === 0 ? '0 ✓' : bBad.length + ' 条 ✗');
bBad.forEach(x => console.log('   ✗', x));
console.log('(c) 条目数差异:', cBad.length === 0 ? '0 ✓' : cBad.length + ' 项 ✗');
cBad.forEach(k => console.log('   ✗', k, counts[k], '!=', EXPECT[k]));
console.log('(d) 字典条目/幅度缺失:', (dBad.length + dLeak.length) === 0 ? '0 ✓' : (dBad.length + dLeak.length) + ' 条 ✗');
dBad.forEach(x => console.log('   ✗', x));
dLeak.forEach(x => console.log('   ✗', x));

// 台账登记：968 保留原文；1048/1053 分片无条目
const e968 = by('968');
console.log('台账 968 保留原文:', e968 ? String(e968[3]) : '缺失');
console.log('台账 1048 分片无条目:', !by('1048'), '；1053 分片无条目:', !by('1053'));

fail = aBad.length + bBad.length + cBad.length + dBad.length + dLeak.length;
process.exit(fail === 0 ? 0 : 1);
