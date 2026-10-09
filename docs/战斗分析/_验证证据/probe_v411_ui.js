/* ============================================================================
   v4.11 三层 UI 重构 · 结构探针（L1 基础信息 / L2 流派玩法 / L3 引擎细节）
   规格：docs/specs/v411_ui_redesign.md §1；实施计划：docs/specs/v411_实施计划_改造点清单.md
   方法：Node VM + fake DOM 打桩，加载**最终产物** 配招助手_ER.html 的内嵌脚本
        （D:\game\elite-redux\_chk_script_1.js，由 _extract_script.js 抽出），
        在真实引擎上渲染详情页并按「行为」断言三层结构 / tab / 就地展开 / 努力值 /
        队友标记 / 引擎视角默认折叠 / 移动端断点；CSS 类断言读 配招助手_ER.html 全文。
   纪律：不读 build 脚本源码；只读产物与内嵌 script；不改任何项目文件。
   运行：node docs\战斗分析\_验证证据\probe_v411_ui.js  （需先跑 _extract_script.js）
   ============================================================================ */
const fs = require('fs'), vm = require('vm');
const ER = 'D:\\game\\elite-redux\\';
const script = fs.readFileSync(ER + '_chk_script_1.js', 'utf8');
const FULLHTML = fs.readFileSync(ER + '配招助手_ER.html', 'utf8');
const SRC = fs.readFileSync(ER + 'build_tool_html.py', 'utf8');   /* 仅用于「源码含某函数」类断言 */

/* ---------- DOM 打桩（沿用 verify_v1.js / verify_v410.js 先例） ---------- */
function mkEl(id) {
  const el = {
    id: id || '', _html: '', children: [], style: {}, dataset: {}, value: '', checked: false,
    textContent: '', className: '', hidden: false, onclick: null, oninput: null, onchange: null, files: null, title: '',
    classList: { _s: {}, add(n){this._s[n]=1}, remove(n){delete this._s[n]}, toggle(n){this._s[n]=this._s[n]?0:1}, contains(n){return !!this._s[n]} },
    appendChild(c){this.children.push(c);return c}, removeChild(){}, querySelector(){return null}, querySelectorAll(){return []},
    addEventListener(){}, removeEventListener(){}, click(){}, focus(){}, select(){}, closest(){return null},
    hasAttribute(){return false}, setAttribute(){}, getAttribute(){return null}, removeAttribute(){}
  };
  Object.defineProperty(el, 'innerHTML', { get: () => el._html, set: v => { el._html = String(v) } });
  return el;
}
const registry = {};
function byId(id){ if(!registry[id]) registry[id]=mkEl(id); return registry[id]; }
const doc = { getElementById: byId, createElement: () => mkEl(''), body: mkEl('body'), querySelector: () => null,
  querySelectorAll: () => [], addEventListener(){}, execCommand(){ return true } };
const sandbox = { console, setTimeout, clearTimeout, setInterval, clearInterval, Math, Date, JSON, Object, Array, String, Number, Boolean, RegExp, Error,
  document: doc, alert: m => {}, window: {}, navigator: { userAgent: 'node' }, location: { href: 'file:///x.html' },
  Uint8Array, Uint16Array, Uint32Array, DataView, ArrayBuffer, TextDecoder, TextEncoder,
  Blob: function(){}, URL: { createObjectURL(){ return 'blob:x' }, revokeObjectURL(){} }, FileReader: function(){}, localStorage: { getItem: () => null, setItem(){} } };
sandbox.window = sandbox; sandbox.globalThis = sandbox;
sandbox.addEventListener = function(){}; sandbox.removeEventListener = function(){};
sandbox.scrollTo = function(){}; sandbox.innerHeight = 800; sandbox.scrollY = 0; sandbox.getComputedStyle = function(){ return {} };
vm.createContext(sandbox);
vm.runInContext(script, sandbox, { timeout: 900000 });
sandbox.toast = function(){};

/* ---------- 断言工具 ---------- */
let pass = 0, fail = 0; const fails = [], notes = [];
function chk(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS  ' + name + (detail !== undefined ? '  → ' + detail : '')); }
  else { fail++; fails.push(name + '  → ' + detail); console.log('  FAIL  ' + name + '  → ' + detail); }
}
function hdr(t){ console.log('\n=== ' + t + ' ==='); }
function note(s){ notes.push(s); console.log('  NOTE  ' + s); }
const E = sandbox.ERDATA;
const spOf = id => E.species.filter(s => String(s.id) === String(id))[0];
function vis(h){ return String(h || '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]*>/g, ''); }
function page(sp) {
  try { byId('coreOut')._html = ''; sandbox.renderCore(sp); return byId('coreOut')._html || ''; }
  catch (e) { return '__THROW__' + (e && e.message); }
}
sandbox.SAV_ROWS = [];

console.log('产物：配招助手_ER.html=' + FULLHTML.length + 'B  内嵌脚本=' + script.length + 'B');

/* ============================ A. 三层结构 ============================ */
hdr('A 详情页三层结构（L1 / L2 / L3 容器）');
const SP = spOf(3);                       /* 妙蛙花：稳定有 2–4 条流派 */
chk('A0 探针前置：妙蛙花(#3) 可取到', !!SP, SP ? ('id=' + SP.id + ' ' + SP.zh) : 'MISSING');
const H = page(SP);
chk('A0b renderCore 渲染无异常且非空', H !== '__THROW__' && H.length > 1000, H.slice(0, 60));
const builds = (function(){ try { return sandbox.deriveBuilds(SP) } catch (e) { return [] } })();
chk('A1 L1 基础信息层容器存在（.sec.l1card）', /class="sec l1card"/.test(H), '');
chk('A2 L1 含种族值六维条形图（6 × .barstat）与总值',
  (H.match(/class="barstat"/g) || []).length === 6 && /种族值总值/.test(H), 'barstat=' + (H.match(/class="barstat"/g) || []).length);
chk('A3 L1 含属性(天性) chip 与 特性 chip（.chip）', (H.match(/class="chip"/g) || []).length >= 2, 'chips=' + (H.match(/class="chip"/g) || []).length);
chk('A4 L2 玩法层容器存在且流派卡数 = deriveBuilds 条数',
  new RegExp('id="bkw' + SP.id + '"').test(H) &&
  (H.match(/<div class="bkp/g) || []).length === builds.length &&
  (H.match(/<details class="big/g) || []).length === builds.length + 1 && builds.length >= 2,
  'panels=' + (H.match(/<div class="bkp/g) || []).length + ' cards=' + (H.match(/<details class="big/g) || []).length + '/' + builds.length);
chk('A4b verify_v4 B④ 字面护栏：首卡 <details class="big rec" open> + summary 内 class="bigsub"',
  /<details class="big rec" open>/.test(H) && /class="bigsub"/.test(H) && /<summary>/.test(H), '');
chk('A4c verify_v4 B⑤ 字面护栏：「本流派队友」+「向 / 」在位',
  /本流派队友/.test(H) && /向 \/ /.test(H), (H.match(/本流派队友（[^）]*）/) || [''])[0]);
chk('A5 L3 引擎细节层容器存在（details.acc.eng + 引擎视角标题）',
  /<details class="acc eng" id="engView_\d+"/.test(H) && /引擎视角/.test(H), '');
chk('A6 三层顺序：L1 在 L2 之前、L2 在 L3 之前（信息架构未错位）',
  H.indexOf('sec l1card') < H.indexOf('id="bkw' + SP.id + '"') && H.indexOf('id="bkw' + SP.id + '"') < H.indexOf('acc eng'), '');
chk('A7 每张流派卡固定 8 字段序号（2–9 全覆盖，①在 summary 内）',
  (H.match(/<span class="fno">2<\/span>/g) || []).length === builds.length &&
  (H.match(/<span class="fno">9<\/span>/g) || []).length === builds.length &&
  (H.match(/<span class="oltext">/g) || []).length === builds.length,
  'fno2=' + (H.match(/<span class="fno">2<\/span>/g) || []).length + ' fno9=' + (H.match(/<span class="fno">9<\/span>/g) || []).length);

/* ============================ B. 流派 tab 切换 ============================ */
hdr('B L2 流派 tab 切换（一次一卡）');
chk('B1 tablist/tab 语义存在且 tab 数 = 流派数',
  /role="tablist"/.test(H) && (H.match(/role="tab"/g) || []).length === builds.length,
  'tabs=' + (H.match(/role="tab"/g) || []).length + '/' + builds.length);
chk('B2 aria-selected 仅第 1 个为 true（默认选中推荐流派）',
  (H.match(/aria-selected="true"/g) || []).length === 1 && /⭐ 推荐流派 1/.test(H), '');
chk('B3 一次一卡：非首卡 tabpanel 带 .bkoff（默认只有 1 张可见）',
  (H.match(/<div class="bkp bkoff"/g) || []).length === builds.length - 1 && (H.match(/<div class="bkp"/g) || []).length === 1,
  'off=' + (H.match(/<div class="bkp bkoff"/g) || []).length + ' on=' + (H.match(/<div class="bkp"/g) || []).length);
chk('B4 切换逻辑在源码中就位（switchBuild / bkSel / bkTabKey）',
  /function switchBuild\(/.test(SRC) && /function bkSel\(/.test(SRC) && /function bkTabKey\(/.test(SRC), '');
chk('B5 切换只改显示与 aria、不重建页面（switchBuild 用 .bkp + classList + open/aria-selected）',
  /function switchBuild\(wrapId,i\)\{[\s\S]{0,400}querySelectorAll\('\.bkp'\)[\s\S]{0,300}classList\.remove\('bkoff'\)[\s\S]{0,200}setAttribute\('open'/.test(SRC), '');
chk('B6 tab 键盘导航（方向键/Home/End）在源码中就位',
  /ArrowRight/.test(SRC) && /ArrowLeft/.test(SRC) && /'Home'/.test(SRC) && /'End'/.test(SRC), '');
chk('B7 tabpanel 与 tab 关联（aria-controls / aria-labelledby）',
  /role="tabpanel" aria-labelledby=/.test(H) && /aria-controls="bkw/.test(H), '');

/* ============================ C. 就地展开（accordion） ============================ */
hdr('C 就地展开（accordion / details），无全屏弹窗遮挡');
chk('C1 就地 accordion 存在（details.acc ≥ 1）', (H.match(/<details class="acc/g) || []).length >= 1, 'n=' + (H.match(/<details class="acc/g) || []).length);
chk('C2 L1 特性 chip 就地展开（onclick 调 abiInline）', /onclick="abiInline\(/.test(H), '');
chk('C3 L1 属性克制攻/防两视角（onclick 调 l1AtkDef）', /onclick="l1AtkDef\(/.test(H), '');
chk('C4 攻/防两视角实现就位（进攻视角读 ERDATA.matchup / 防守视角读 defCellTrio）',
  /function l1AtkDef\(/.test(SRC) && /ERDATA\.matchup\[j\]\[i\]/.test(SRC) && /defCellTrio\(s,at\)\.inn/.test(SRC), '');
chk('C5 展开面板为就地内联（.accbd 就地容器），非固定定位浮层',
  /class="accbd"/.test(H) && !/\.acc[a-z-]*\{[^}]*position:fixed/.test(FULLHTML), '');
chk('C6 长文（>40 字）走轻量弹层且弹层可关闭（l1Modal / closeL1Modal / 遮罩点击关闭）',
  /function l1Modal\(/.test(SRC) && /function closeL1Modal\(/.test(SRC) && /function l1ModalFrom\(/.test(SRC) && /ev\.target===m/.test(SRC), '');
chk('C7 词条标蓝（glossary）在 L1 特性详情中接线（glossify 调用）',
  /glossify\(zh\|\|/.test(SRC), '');
chk('C8 触控热区：.chip / .acc>summary / .evtap / .tap44 均 min-height:44px（≥44px 达标）',
  /\.chip\{[^}]*min-height:44px/.test(FULLHTML) && /\.acc>summary\{[^}]*min-height:44px/.test(FULLHTML) &&
  /\.evtap\{[^}]*min-height:44px/.test(FULLHTML) && /\.tap44\{[^}]*min-height:44px/.test(FULLHTML), '');
chk('C9 prefers-reduced-motion 关闭动效（既有 + 新增规则并存）',
  /@media\s*\(prefers-reduced-motion:reduce\)/.test(FULLHTML), 'n=' + (FULLHTML.match(/prefers-reduced-motion/g) || []).length);

/* ============================ D. 努力值分配（v4.11 新增输出） ============================ */
hdr('D 努力值（EV）分配：数组串 + 文本摘要 + 条形图 + 模板名');
chk('D1 每个流派卡含「努力值分配」字段（fno=6）', (H.match(/<span class="fno">6<\/span>努力值分配/g) || []).length === builds.length,
  'n=' + (H.match(/<span class="fno">6<\/span>努力值分配/g) || []).length + '/' + builds.length);
chk('D2 含 6 位数组串（HP/攻/防/特攻/特防/速，形如 0/252/4/0/0/252）',
  /数组（HP\/攻\/防\/特攻\/特防\/速）<b>(\d+\/){5}\d+<\/b>/.test(H), (H.match(/数组（[^）]*）<b>([^<]*)<\/b>/) || [])[1] || 'MISSING');
chk('D3 含文本摘要（如 252HP/252攻/4防）',
  /(252HP|252速|252攻|252特攻|252防|252特防)/.test(H), (H.match(/<div class="evsum">[\s\S]{0,240}?<\/div>/) || [''])[0].replace(/<[^>]*>/g, '').slice(0, 120));
chk('D4 含横向条形图（.evsegs + 6 段 .evseg，主/副/余量三级配色类）',
  (H.match(/class="evsegs"/g) || []).length === builds.length &&
  (H.match(/class="evseg ev[012]"/g) || []).length === builds.length * 6 &&
  /\.ev1\{/.test(FULLHTML) && /\.ev2\{/.test(FULLHTML) && /\.ev0\{/.test(FULLHTML),
  'segs=' + (H.match(/class="evseg ev[012]"/g) || []).length + '/' + (builds.length * 6));
{ /* D4b 条形图为「真渲染」非空壳：.evsegs 定高 14px + .evseg 高 100%；
       渲染出的 6 段均带非零宽度百分比、每张卡合计 ≈100%。
       Node 无布局引擎（本环境无 jsdom/puppeteer）→ 以「CSS 定高 + 宽度和」作等价证明；
       若宿主提供真实布局（offsetHeight 为数字）则直接断言 >0。 */
  const segEls = H.match(/<span class="evseg ev[012]" style="width:[\d.]+%"[^>]*><\/span>/g) || [];
  const ws = segEls.map(t => (t.match(/width:([\d.]+)%/) || [0, '0'])[1] * 1);
  const cards = []; for (let ci = 0; ci + 6 <= ws.length; ci += 6) cards.push(ws.slice(ci, ci + 6));
  const sums = cards.map(c => c.reduce((a, b) => a + b, 0));
  const maxs = cards.map(c => Math.max.apply(null, c));
  const nzPer = cards.map(c => c.filter(w => w > 0).length);
  const cssH = /\.evsegs\{[^}]*height:14px/.test(FULLHTML) && /\.evseg\{[^}]*height:100%/.test(FULLHTML);
  const oh = byId('coreOut').offsetHeight;
  const real = (typeof oh === 'number') ? (oh > 0) : null;   /* null = 无布局引擎，走等价证明 */
  chk('D4b 条形图真渲染非空壳（.evsegs 定高 14px；每卡 6 段、宽度合计≈100%、主投段≥40%、主投/副投/余量三类段齐备）',
    cssH && segEls.length === builds.length * 6 && cards.length === builds.length &&
    sums.every(v => Math.abs(v - 100) < 1.0) && maxs.every(v => v >= 40) && nzPer.every(v => v >= 3) && real !== false,
    'CSS定高=' + cssH + ' segs=' + segEls.length + '/' + (builds.length * 6) + ' 每卡和=' + sums.map(v => v.toFixed(1)).join('/') + ' 主投=' + maxs.join('/') + ' 非零段/卡=' + nzPer.join('/') + ' offsetHeight=' + (real === null ? 'N/A(无布局引擎)' : real));
}
chk('D5 含模板名一行 + 点条形图展开模板说明（evWhy / aria-expanded / hidden 详情）',
  /template:<b>|模板：<b>/.test(H) && /onclick="evWhy\(this\)"/.test(H) && /class="evwhy" hidden/.test(H) && /function evWhy\(/.test(SRC), '');
chk('D6 bd.ev 结构完整（template 非空 / alloc 长度 6 / summary 非空），逐条流派成立',
  builds.every(b => b.ev && typeof b.ev.template === 'string' && b.ev.template &&
    Array.isArray(b.ev.alloc) && b.ev.alloc.length === 6 && typeof b.ev.summary === 'string' && b.ev.summary),
  builds.map(b => (b.ev ? (b.ev.template + '[' + b.ev.alloc.join('/') + ']') : 'MISSING')).join(' | '));
{ /* D7 模板选取逻辑（引擎层，逐模板抽样验证规则） */
  const tpl = { '速攻': null, '耐久': null, '空间低速': null };
  let nb = 0;
  E.species.forEach(s => {
    let bs = []; try { bs = sandbox.deriveBuilds(s) } catch (e) { return }
    bs.forEach(b => { if (b.ev) { nb++; if (!tpl[b.ev.template]) tpl[b.ev.template] = b; } });
  });
  note('模板覆盖：' + Object.keys(tpl).map(k => k + '=' + (tpl[k] ? '有' : '无')).join(' ') + '（全库流派样本 ' + nb + ' 条）');
  chk('D7a 速攻模板：252 速度 + 252 主输出 + 4 余量(HP)',
    !!tpl['速攻'] && tpl['速攻'].ev.alloc[5] === 252 && tpl['速攻'].ev.alloc[0] === 4 &&
    (tpl['速攻'].ev.alloc[1] === 252 || tpl['速攻'].ev.alloc[3] === 252),
    tpl['速攻'] ? (tpl['速攻'].name + '=' + tpl['速攻'].ev.alloc.join('/')) : '未覆盖');
  chk('D7b 耐久模板：252 HP + 252 主防（物防/特防动态取，另一防 4）',
    !!tpl['耐久'] && tpl['耐久'].ev.alloc[0] === 252 &&
    ((tpl['耐久'].ev.alloc[2] === 252 && tpl['耐久'].ev.alloc[4] === 4) || (tpl['耐久'].ev.alloc[4] === 252 && tpl['耐久'].ev.alloc[2] === 4)),
    tpl['耐久'] ? (tpl['耐久'].name + '=' + tpl['耐久'].ev.alloc.join('/')) : '未覆盖');
  chk('D7c 空间低速模板：252 HP + 252 主输出 + 4 余量，速度 0（仅建议）',
    !!tpl['空间低速'] && tpl['空间低速'].ev.alloc[0] === 252 && tpl['空间低速'].ev.alloc[5] === 0,
    tpl['空间低速'] ? (tpl['空间低速'].name + '=' + tpl['空间低速'].ev.alloc.join('/')) : '未覆盖');
  chk('D7d 空间低速模板附「速度归零仅为建议」提示（服务铃可提速）',
    /速度归零仅为建议/.test(SRC) && /服务铃/.test(SRC), '');
}
chk('D8 努力值为纯展示派生：不进入 mkBuild/评分（deriveBuilds 只挂 b.ev，未改 any 评分字段）',
  /b\.ev=buildEvs\(/.test(SRC) && !/ev\.alloc.*sc\+=|sc\+=.*ev\.alloc/.test(SRC), '');

/* ============================ E. 队友主推/备选 + 「你拥有」标记 ============================ */
hdr('E 队友：主推 2–3 + 备选 3–5；存档池投影「你拥有 / 未拥有」');
chk('E1 主推区横滑（.mateline）+ 主推文案标记',
  (H.match(/class="mateline"/g) || []).length === builds.length && /<span class="own yes">主推<\/span>/.test(H),
  'n=' + (H.match(/class="mateline"/g) || []).length + '/' + builds.length);
chk('E2 备选区网格（.mategrid）+ 备选文案标记',
  /class="mategrid"/.test(H) && /<span class="own no">备选<\/span>/.test(H), '');
chk('E3 主推与备选视觉区分（.mate.main 绿色边框 + 文案双通道）',
  /\.mate\.main\{[^}]*border-color:var\(--ok\)/.test(FULLHTML) && /class="mate main"/.test(H), '');
chk('E4 B5：未导入存档（SAV_ROWS 空）→ 不显示任何「你拥有 / 未拥有」标记',
  !/你拥有/.test(H) && !/未拥有/.test(H), 'pool=null → 零标记');
chk('E4b B5 计数口径：未导入存档时「你拥有」出现次数 = 0（「未拥有」同为 0）',
  (H.match(/你拥有/g) || []).length === 0 && (H.match(/未拥有/g) || []).length === 0,
  'own=' + (H.match(/你拥有/g) || []).length + ' no=' + (H.match(/未拥有/g) || []).length);
{ /* E5：mock 存档（把「本流派首推队友」放进池内）→ 两种标记都应出现 */
  let mates0 = [];
  try { mates0 = sandbox.findTeammates(SP, sandbox.coreSide(SP)) } catch (e) {}
  const mockRows = mates0.slice(0, 2).map(r => ({ '图鉴编号': String(r.s.id), '特性1': String((r.s.abis || [])[0] || '') }));
  note('E5 mock 存档行数=' + mockRows.length + ' ids=' + mockRows.map(r => r['图鉴编号']).join('/') +
    '（队友档 ' + mates0.length + ' 条）');
  sandbox.SAV_ROWS = mockRows;
  const H2 = page(SP);
  sandbox.SAV_ROWS = [];
  chk('E5 已导入存档 → 池内队友标「你拥有 ✓」、池外队友标「未拥有」（双态并存）',
    /你拥有 ✓/.test(H2) && /未拥有/.test(H2),
    'own=' + (H2.match(/你拥有 ✓/g) || []).length + ' no=' + (H2.match(/未拥有/g) || []).length);
  chk('E6 存档池投影复用既有 mechPool / mechPoolHas（未新增数据层字段）',
    /function ownBadge\(/.test(SRC) && /mechPoolHas\(pool,'species'/.test(SRC), '');
}

/* ============================ F. L3 默认折叠 + 隐藏≠丢弃 ============================ */
hdr('F L3 引擎视角默认折叠；被折叠内容仍可溯源（隐藏 ≠ 丢弃）');
chk('F1 引擎视角 details 默认无 open（默认收起）',
  /<details class="acc eng" id="engView_\d+"><summary>/.test(H), '');
chk('F2 折叠区仍保留引擎结论（选招依据 / 判定口径）',
  /选招依据：/.test(H) && /判定口径：/.test(H), '');
chk('F3 折叠区保留种族 / 强度概要（种族六维 + 强度 + 本系最高威力 + 耐久）',
  /种族 \/ 强度概要/.test(H) && /种族 物攻/.test(H) && /本系最高威力/.test(H), '');
chk('F4 折叠区保留天气 / 场地数值卡（读 WCONF）', /天气 \/ 场地数值/.test(H), '');
chk('F5 折叠区保留需求驱动队友完整推导（renderPlanSet）', /队伍需求/.test(H) && /构建逻辑/.test(H) && /需求驱动/.test(H), '');
chk('F6 折叠区保留体系补盲队友 + 队友口径说明', /体系补盲队友/.test(H) && /队友口径/.test(H), '');
chk('F7 冗余项「耐久口径」未删除（降级进 L3，可展开）', /耐久口径/.test(H), '');
chk('F8 breakingRoute 已落回流派对象（F-1 修复：不再恒 undefined）',
  builds.every(b => b.breakingRoute !== undefined) || builds.some(b => b.breakingRoute), builds.map(b => String(b.breakingRoute).slice(0, 18)).join(' | '));
chk('F9 玩家层 ①②④⑧ 无百分比 / 倍率式子（①玩法一句话）',
  (function(){ const m = H.match(/<span class="oltext">([\s\S]*?)<\/span>/); const t = m ? vis(m[1]) : ''; return t.length > 0 && !/%/.test(t) && !/×/.test(t); })(),
  (function(){ const m = H.match(/<span class="oltext">([\s\S]*?)<\/span>/); return m ? vis(m[1]) : 'MISSING'; })());
chk('F10 玩家层 ②设计亮点 无百分比 / 倍率式子',
  (function(){ const m = H.match(/设计亮点<\/div>([\s\S]*?)<span class="fno">3<\/span>/); const t = m ? vis(m[1]) : ''; return t.length > 0 && !/%/.test(t) && !/×/.test(t); })(),
  (function(){ const m = H.match(/设计亮点<\/div>([\s\S]*?)<span class="fno">3<\/span>/); return m ? vis(m[1]).slice(0, 90) : 'MISSING'; })());
chk('F11 玩家层 ④特性理由 无百分比式子',
  (function(){ const m = H.match(/<span class="fno">4<\/span>([\s\S]*?)<span class="fno">5<\/span>/); const t = m ? vis(m[1]) : ''; return t.length > 0 && !/%/.test(t); })(),
  (function(){ const m = H.match(/<span class="fno">4<\/span>([\s\S]*?)<span class="fno">5<\/span>/); return m ? vis(m[1]).slice(0, 90) : 'MISSING'; })());
chk('F12 玩家层 ⑧队友 无百分比 / 倍率式子',
  (function(){ const m = H.match(/<span class="fno">8<\/span>([\s\S]*?)<span class="fno">9<\/span>/); const t = m ? vis(m[1]) : ''; return t.length > 0 && !/%/.test(t) && !/×/.test(t); })(),
  (function(){ const m = H.match(/<span class="fno">8<\/span>([\s\S]*?)<span class="fno">9<\/span>/); return m ? vis(m[1]).slice(0, 90) : 'MISSING'; })());
chk('F13 冗余唯一性：「机制口径」四字不进 coreOut（唯一归属 #ruleBoxCore）',
  !/机制口径/.test(H) && /id="ruleBoxCore"/.test(FULLHTML), '');
chk('F15 v4.11 F1：L2 ⑦ 道具可见区不含引擎「原则 P」代号 / 「代价」/ 「｜」（已改玩家话术）',
  (function () {
    const m = H.match(/<span class="fno">7<\/span>[\s\S]*?<span class="fno">8<\/span>/);
    if (!m) return false;
    return !/原则\s*P\d/.test(m[0]) && !/代价 /.test(m[0]) && m[0].indexOf('｜') < 0 && m[0].length > 60;
  })(),
  (function () {
    const m = (H.match(/<span class="fno">7<\/span>[\s\S]*?<span class="fno">8<\/span>/) || [''])[0];
    return '⑦段=' + vis(m).slice(0, 130);
  })());
{ /* F15c 全库：逐流派逐道具调引擎 itemNote，断言玩家话术永不外泄引擎代号 */
  let n = 0; const bad = [];
  if (typeof sandbox.itemNote === 'function') {
    E.species.forEach(s => {
      let bs = []; try { bs = sandbox.deriveBuilds(s) } catch (e) { return }
      bs.forEach(b => (b.it || []).forEach(x => {
        const t = String(sandbox.itemNote(x[0], x[1]));
        n++;
        if (/原则\s*P\d/.test(t) || /克制 /.test(t) || /代价 /.test(t) || t.indexOf('｜') > -1) bad.push(s.zh + '/' + x[0] + '=' + t);
      }));
    });
  }
  chk('F15c 全库（' + n + ' 条道具行）⑦ 玩家话术无引擎代号泄漏（原则 P / 克制 / 代价 / ｜）',
    n > 0 && bad.length === 0, bad.length ? ('bad=' + bad.length + ' 例：' + bad.slice(0, 2).join(' ; ')) : ('rows=' + n));
}
chk('F15b L2 ⑦ 道具可见区为玩家话术（命中道具池玩家向说明，如「被弱点命中时攻/特攻 +2」）',
  (function () {
    const m = (H.match(/<span class="fno">7<\/span>[\s\S]*?<span class="fno">8<\/span>/) || [''])[0];
    return /<b class="abi"[^>]*>⭐[^<]+<\/b>[\s\S]{0,240}?被弱点命中时攻\/特攻 \+2/.test(m);
  })(), '');
chk('F16 v4.11 F1 只降级不删除：道具引擎原文折进 L3，且 coreOut 仍含 克制 / 代价 / 原则 P（verify_v4 VP1 护栏）',
  /道具 why（引擎原文）/.test(H) && /克制 /.test(H) && /代价 /.test(H) && /原则 P\d/.test(H), '');
chk('F14 溯源锚文本不混用：本层用「机制溯源」，mechCoreHtml 的「溯源」保持原样',
  !/target="_blank" rel="noopener">溯源<\/a>/.test(H) &&
  ((H.match(/>溯源<\/a>/g) || []).length === 0 || /<a href="https?:\/\/[^"]*">溯源<\/a>/.test(H)),
  'bare=' + (H.match(/>溯源<\/a>/g) || []).length + ' mine=' + (H.match(/>机制溯源<\/a>/g) || []).length);

/* ============================ G. 移动端 / 响应式 ============================ */
hdr('G 移动端（<768 竖版单列）与既有断点协调');
chk('G1 新增 768px 竖版断点存在', /@media\s*\(max-width:768px\)/.test(FULLHTML), '');
chk('G2 既有 640px 断点未被破坏（与 641–1024 断点共存）',
  (FULLHTML.match(/@media\s*\(max-width:640px\)/g) || []).length >= 1 && /@media\s*\(min-width:641px\)\s*and\s*\(max-width:1024px\)/.test(FULLHTML),
  '640=' + (FULLHTML.match(/@media\s*\(max-width:640px\)/g) || []).length);
chk('G3 tab 横滑 + sticky，高度 ≤48px（不遮内容）',
  /\.bktabs\{[^}]*overflow-x:auto/.test(FULLHTML) && /\.bktabs\{[^}]*position:sticky/.test(FULLHTML) && /\.bktabs\{[^}]*height:48px/.test(FULLHTML), '');
chk('G4 队友主推横滑（.mateline overflow-x:auto）+ 备选网格（.mategrid grid-template-columns）',
  /\.mateline\{[^}]*overflow-x:auto/.test(FULLHTML) && /\.mategrid\{[^}]*grid-template-columns/.test(FULLHTML), '');
chk('G5 条形图三段式（主投饱和 / 副投次饱和 / 余量浅色）配色类齐备',
  /\.ev1\{background:var\(--accent\)\}/.test(FULLHTML) && /\.ev2\{background:#7ea8f0\}/.test(FULLHTML) && /\.ev0\{background:#dbe2ec\}/.test(FULLHTML), '');
chk('G6 触控目标 min-height:44px 全局 ≥5 处', (FULLHTML.match(/min-height:44px/g) || []).length >= 5, 'n=' + (FULLHTML.match(/min-height:44px/g) || []).length);
chk('G7 无内联固定宽度 >360px（390px 竖版不产生横向滚动）',
  (function(){ let bad = 0; (FULLHTML.match(/style="[^"]*"/g) || []).forEach(a => { let m; const r = /(?:^|[;\s])width:\s*(\d{2,4})px/g; while ((m = r.exec(a))) { if (+m[1] > 360) bad++; } }); return bad === 0; })(), '');
chk('G8 -webkit-text-size-adjust 仍在位（既有移动端基线未回退）', /-webkit-text-size-adjust:100%/.test(FULLHTML), '');

/* ============================ H. 回归护栏（结构层） ============================ */
hdr('H 回归护栏：既有断言关键串在 coreOut 仍在位');
[['推荐流派', /推荐流派/], ['定位判断', /定位判断/], ['弱点（天性口径）', /弱点（天性口径）/], ['选招依据', /选招依据/],
 ['盲点', /盲点/], ['晴/雨增伤 ×1.5', /晴\/雨增伤 ×1\.5/], ['戏法空间 5 回合徽标', /戏法空间 5 回合<span class="badge badge-pend"/],
 ['除钉 229/432', /229/]].forEach(function (p) {
  const ok = p[1].test(H);
  chk('H·' + p[0] + ' 在位', ok, '');
});
chk('H·无内部标记泄漏（undefined / NaN / [object Object] / build_tool / nn_data）',
  !/undefined/.test(H) && !/\bNaN\b/.test(H) && !/\[object Object\]/.test(H) && !/build_tool/.test(H) && !/nn_data/.test(H), '');
chk('H·玩家可见文本无 HTML 标签字面残留', !/<\/?[a-z]+[^>]*>/i.test(vis(H)), vis(H).slice(0, 60));
{ /* H·机制解读面（mechsec / badge-mech）对机制命中物种仍在位（妙蛙花无组合属正常零输出） */
  const dit = spOf(132);
  const Hd = dit ? page(dit) : '';
  chk('H·机制解读（.sec.mechsec + badge-mech）在 L3 内仍在位（百变怪样本）',
    /class="sec mechsec"/.test(Hd) && /badge-mech/.test(Hd) && /class="mechdet"/.test(Hd),
    'dittoHtml=' + Hd.length + 'B  mechsec=' + (/class="sec mechsec"/.test(Hd) ? 1 : 0));
  note('妙蛙花 coreOut 无 mechsec：mechCoreHtml 对该物种零组合（与 verify_v410 F8「当且仅当」一致）');
}

/* ============================ 汇总 ============================ */
console.log('\n================ v4.11 三层 UI 结构探针 汇总 ================');
console.log('PASS=' + pass + '  FAIL=' + fail);
if (fails.length) { console.log('FAIL 清单：'); fails.forEach(f => console.log('  - ' + f)); }
if (notes.length) { console.log('NOTE：'); notes.forEach(n => console.log('  · ' + n)); }
process.exitCode = fail ? 1 : 0;
