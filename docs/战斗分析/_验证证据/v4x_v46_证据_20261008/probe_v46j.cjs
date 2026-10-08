/* v4.6 专项：A 清理核查 + C 前端优化核查 + 移动端适配静态复核（按检视报告 §7 口径）
   用法: node probe_v46j.cjs <html路径> */
'use strict';
const fs = require('fs');
const F = process.argv[2];
const html = fs.readFileSync(F, 'utf8');
const lines = html.split('\n');
const cnt = (t) => { let n = 0, q = -1; while ((q = html.indexOf(t, q + 1)) > -1) n++; return n };
const st = lines.findIndex(l => l.trim() === '<style>'), se = lines.findIndex(l => l.trim() === '</style>');
const styleLines = lines.slice(st, se + 1);
const P = (s) => console.log(s);

P('================ A. 清理核查（玩家可见文案 / 死代码 / 调试残留）================');
P('-- A1 内部编号与开发过程语（全库原始子串计数；历史报告点名项）--');
['v45-3', 'v4.5.1', 'v4.4', 'v4.3.2', 'WCONF.', 'docs/战斗分析', 'changelog', '数据契约', '源码未找到', '待游戏内截图校准', '源码实证', '源码考古', 'ABI_ATE', '参数</th>', 'genBuilds'].forEach(t => P('   ' + JSON.stringify(t).padEnd(22) + ' = ' + cnt(t)));
P('-- A2 死函数 coreMoves --');
P('   coreMoves 出现 = ' + cnt('coreMoves') + (cnt('coreMoves') === 0 ? '  ✔ 已删零调用' : '  ✘ 仍有残留'));
P('   sysBenefitNames=' + cnt('sysBenefitNames') + ' spFields=' + cnt('spFields') + ' anyAbiId=' + cnt('anyAbiId') + ' coreNature=' + cnt('coreNature') + ' itemIsWeather=' + cnt('itemIsWeather') + ' evioWhy=' + cnt('evioWhy') + ' needRegistryOk=' + cnt('needRegistryOk') + ' fillForNeed=' + cnt('fillForNeed') + ' isAbilSetAny=' + cnt('isAbilSetAny') + '（保留项）');
P('-- A3 调试残留 --');
['console.', 'console.warn', 'console.log', 'debugger', 'TODO', 'FIXME', 'alert('].forEach(t => P('   ' + t.padEnd(16) + ' = ' + cnt(t)));
P('-- A4 旧规则/提示文案 --');
['ruleBoxTeam', 'ruleBoxCore', 'ruleBoxTpl', 'initRuleBoxes', 'tplRuleTip', 'mvDrawerTitle'].forEach(t => P('   ' + t.padEnd(16) + ' = ' + cnt(t)));
const tri = html.indexOf('id="tplRuleTip"');
if (tri > -1) { const seg = html.slice(tri, tri + 420).replace(/\s+/g, ' '); P('   #tplRuleTip 原文 → ' + seg.slice(0, 300)); }

P('\n================ C-1. 表格 / 滚动包裹（手机横向溢出）================');
const tbl = [];
lines.forEach((l, i) => { if (/<table/.test(l)) tbl.push(i + 1) });
P('   <table 出现 = ' + tbl.length + ' 处 @ ' + tbl.join(','));
P('   class="scroll" 出现 = ' + cnt('class="scroll"') + ' | 内联 overflow-x:auto = ' + cnt('overflow-x:auto'));
let wrapped = 0;
tbl.forEach(ln => { const pre = lines[ln - 2] || '', cur = lines[ln - 1] || ''; const ok = /class="scroll"|overflow-x:auto/.test(cur) || /class="scroll"|overflow-x:auto/.test(pre); if (ok) wrapped++; P('     L' + ln + ' → ' + (ok ? '✔ 已包裹/内联' : '✘ 未包裹') + '  前置: ' + pre.trim().slice(0, 70)); });
P('   ⇒ ' + wrapped + '/' + tbl.length + ' 已包裹' + (wrapped === tbl.length ? '  ✔ 全绿' : '  ✘ 仍有未包裹'));
P('   th,td 声明 → ' + ((styleLines.find(l => /^th,td\{/.test(l.trim())) || '(未找到)').trim()));

P('\n================ C-2. 媒体查询 / 响应式骨架 =================');
styleLines.forEach((l, i) => { if (/@media/.test(l)) P('   L' + (st + i + 1) + ' ' + l.trim()) });
P('   viewport meta = ' + (/<meta name="viewport"[^>]*>/.exec(html) || ['(缺失)'])[0]);
P('   <body 字号声明 → ' + ((styleLines.find(l => /^body\{/.test(l.trim())) || '').trim().slice(0, 160)));
const mt = /body\{[^}]*font-size:\s*([0-9]+px)/.exec(html); P('   body font-size = ' + (mt ? mt[1] : '?'));
P('   font-family 行 → ' + ((styleLines.find(l => /font-family/.test(l)) || '').trim()));
P('   PingFang = ' + cnt('PingFang') + ' | Noto = ' + cnt('Noto') + ' | text-size-adjust = ' + cnt('text-size-adjust'));
P('   布局类新声明：');
styleLines.forEach((l, i) => { if (/poolgrid|poolcard|spmid|^\.grid|^header\{|^nav\{|^nav button\{/.test(l.trim())) P('     L' + (st + i + 1) + ' ' + l.trim().slice(0, 150)) });

P('\n================ C-3. 触控目标 ≥44px（声明值重算）================');
const SEL = ['nav button', '.chips button', '.btn', '.btn-mini', '.abi', '.slot .x', '.card', '.mxc', '.tplcard', '.poolcard', '.needcard>summary',
  'details.big>summary', '.poolbox .pin', '.badge-pick', '.badge-pickable', '.modal .close', 'th,td', '.mnb', '.tabbar button'];
const at = (sel) => {
  for (let i = st; i <= se; i++) {
    const s = lines[i].trim(); const idx = s.indexOf(sel); if (idx < 0) continue;
    const after = s[idx + sel.length]; if (after && ' {,:'.indexOf(after) < 0) continue;
    return { line: i + 1, decl: s.slice(s.indexOf('{') + 1, s.lastIndexOf('}')).trim() };
  }
  return null;
};
const vert = (d) => {
  let pt = /padding-top\s*:\s*([0-9.]+)px/.exec(d), pb = /padding-bottom\s*:\s*([0-9.]+)px/.exec(d);
  if (pt || pb) return (+(pt ? pt[1] : 0)) + (+(pb ? pb[1] : 0));
  const ps = /(?:^|;)\s*padding\s*:\s*([0-9.]+)px(?:\s+([0-9.]+)px)?(?:\s+([0-9.]+)px)?(?:\s+([0-9.]+)px)?/.exec(d);
  if (!ps) return 0;
  const v = [ps[1], ps[2], ps[3], ps[4]].filter(x => x !== undefined).map(Number);
  if (v.length === 1) return v[0] * 2; if (v.length === 2) return v[0] * 2; if (v.length === 3) return v[0] * 2; return v[0] + v[2];
};
SEL.forEach(sel => {
  const r = at(sel); if (!r) { P('   (未找到) ' + sel); return }
  const d = r.decl, fs2 = +((/font-size\s*:\s*([0-9.]+)px/.exec(d) || [])[1] || 14);
  const mh = /min-height\s*:\s*([0-9.]+)px/.exec(d), hh = /height\s*:\s*([0-9.]+)px/.exec(d);
  const h = mh ? +mh[1] : (hh ? +hh[1] : vert(d) + 1.2 * fs2);
  const tag = /^\.card$|^\.mxc$|^\.tplcard$|^\.poolcard$/.test(sel) ? '（含图，实际更高）' : '';
  P('   ' + (h >= 44 ? 'OK  ' : 'FAIL') + ' ' + sel.padEnd(20) + ' L' + String(r.line).padEnd(5) + ' ≈' + Math.round(h) + 'px ' + tag + ' | ' + d.slice(0, 88));
});

P('\n================ C-4. 字号 ≥12px 核查 =================');
const small = [];
styleLines.forEach((l, i) => { const m = /font-size\s*:\s*(1[0-1]|[0-9])px/.exec(l); if (m) small.push('L' + (st + i + 1) + ':' + m[1] + 'px') });
P('   <12px 声明 = ' + small.length + (small.length ? ' → ' + small.join(' | ') : '  ✔ 全绿（无 <12px）'));

P('\n================ C-5. 关键控件 / 新结构存在性 =================');
['id="myPoolWrap"', 'id="myTeamOut"', '存档联动组队', 'onclick="myCoreTeam(', 'class="poolgrid"', 'class="poolcard"', 'class="psrc"', 'class="ptag"', 'class="spmid"', 'class="spinel"', 'renderMyPool', 'myPoolFromSav', 'SOV_ROWS'].forEach(t => P('   ' + t.padEnd(26) + ' = ' + cnt(t)));
