/* v4.5 专项：原则层并入配招/流派 —— 结构清单 + 卡面一体化 + 使用率先验 + 对位抽检（配招/流派维度） */
'use strict';
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync(process.argv[2], 'utf8');
const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi; let m, parts = [];
while ((m = re.exec(html)) !== null) { if (/\bsrc\s*=/i.test(m[1] || '')) continue; parts.push(m[2]); }
const js = parts.join('\n;\n');
function mkEl(t) {
  return {
    _tag: (t || 'div').toLowerCase(), children: [], style: {}, dataset: {}, value: '', checked: false, innerHTML: '', textContent: '', className: '', id: '',
    classList: { _s: new Set(), add() { for (const c of arguments) this._s.add(c) }, remove() { for (const c of arguments) this._s.delete(c) }, toggle(c, f) { if (f === undefined) f = !this._s.has(c); f ? this._s.add(c) : this._s.delete(c); return f }, contains(c) { return this._s.has(c) } },
    appendChild(c) { this.children.push(c); this.innerHTML += (c && c.innerHTML !== undefined ? c.innerHTML : ''); return c }, removeChild() { }, insertBefore(c) { this.children.push(c); this.innerHTML += (c && c.innerHTML !== undefined ? c.innerHTML : ''); return c },
    querySelector: () => mkEl('div'), querySelectorAll: () => [], setAttribute(k, v) { this['a_' + k] = v }, getAttribute(k) { return this['a_' + k] === undefined ? null : this['a_' + k] },
    removeAttribute() { }, addEventListener() { }, removeEventListener() { }, focus() { }, blur() { }, click() { }, remove() { }, insertAdjacentHTML(p, h) { this.innerHTML += (h || '') },
    scrollIntoView() { }, getBoundingClientRect: () => ({ top: 0, left: 0, width: 0, height: 0 }), closest: () => null, contains: () => false, replaceWith() { }, after() { }, before() { }
  };
}
const reg = new Map(), getEl = id => { if (!reg.has(id)) { const e = mkEl('div'); e.id = id; reg.set(id, e) } return reg.get(id) };
const ctx = {
  console, alert() { }, setTimeout, clearTimeout, setInterval: () => 0, clearInterval() { }, JSON, Math, Date, Object, Array, String, Number, Boolean, RegExp, Error, Map, Set, isFinite, isNaN, parseInt, parseFloat, encodeURIComponent, decodeURIComponent,
  Blob: function () { }, FileReader: function () { }, URL: { createObjectURL: () => '', revokeObjectURL() { } }, navigator: { userAgent: 'v' }, location: { hash: '', href: '' },
  document: { getElementById: getEl, createElement: t => mkEl(t), createTextNode: t => ({ textContent: t, innerHTML: t }), querySelector: () => mkEl('div'), querySelectorAll: () => [], addEventListener() { }, body: mkEl('body'), documentElement: mkEl('html'), head: mkEl('head'), createDocumentFragment: () => mkEl('f') }
};
ctx.window = ctx; ctx.globalThis = ctx; ctx.window.addEventListener = function () { }; ctx.window.innerHeight = 900; ctx.window.scrollY = 0; ctx.scrollTo = function () { }; ctx.addEventListener = function () { };
vm.createContext(ctx);
vm.runInContext(js, ctx, { filename: 'inline.js' });
const SP = (ctx.ERDATA && ctx.ERDATA.species) || [], MV = ctx.MV || {};
const byZh = n => SP.find(x => String(x.zh || '').indexOf(n) > -1);
const unesc = s => String(s || '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"');
const strip = s => String(s || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const has = (t, rx) => rx.test(t);
let R = [];
function rec(id, ok, msg) { R.push({ id: id, ok: ok, msg: msg }); }
try { rec('V1-MVstruct', !!MV[85], 'MV[85]=' + JSON.stringify(MV[85])) } catch (e) { rec('V1-MVstruct', false, e.message) }

console.log('== A. 原则层并入结构（配招/流派/先验） ==');
[['usagePriorOf', 'function'], ['mvWhyStd', 'function'], ['mvPrinSet', 'function'], ['mvKindOf', 'function'], ['USAGE_PRIOR_W', 'number']].forEach(x => {
  const t = typeof ctx[x[0]]; rec('A-' + x[0], t === x[1], 'typeof=' + t + '（期望 ' + x[1] + '）');
  console.log('  ' + x[0] + ' = ' + t + (x[1] && t !== x[1] ? '（期望 ' + x[1] + '）' : ''));
});
const UP = (ctx.ERDATA && ctx.ERDATA.usagePrior) || {}, UM = (ctx.ERDATA && ctx.ERDATA.usageMeta) || null;
rec('A-usagePrior', Object.keys(UP).length > 500, 'ERDATA.usagePrior 条目=' + Object.keys(UP).length);
rec('A-usageMeta', !!UM, 'usageMeta=' + JSON.stringify(UM).slice(0, 200));
rec('A-PLAY_WHY', !!ctx.PLAY_WHY, 'PLAY_WHY 键=' + Object.keys(ctx.PLAY_WHY || {}).join(',') + ' | PLAY_KIND=' + JSON.stringify(ctx.PLAY_KIND || {}));
console.log('  ERDATA.usagePrior 条目=' + Object.keys(UP).length + ' 样例#248=' + UP['248'] + ' #530=' + UP['530'] + ' #411=' + UP['411']);
console.log('  usageMeta=' + JSON.stringify(UM).slice(0, 260));
console.log('  USAGE_PRIOR_W=' + ctx.USAGE_PRIOR_W + ' | PLAY_WHY 键=' + Object.keys(ctx.PLAY_WHY || {}).join(',') + ' | PLAY_KIND=' + JSON.stringify(ctx.PLAY_KIND || {}));
console.log('  源码注释「原版（PS OU/ND）使用率 ≠ ER 使用率」出现=' + ((js.match(/原版（PS OU\/ND）使用率 ≠ ER 使用率/g) || []).length) + '；渲染面文案出现=');
const CORES = ['妙蛙花', '护城龙', '凤王', '煤炭龟', '坚果哑铃', '霸王花', '大针蜂', '雷电云', '大嘴鸥'];
const REC = /自我再生|光合作用|鸟栖|生蛋|寄生种子|终极吸取|吸取拳|木角|吸取之吻|痛平分|睡眠|月光|晨光|喝牛奶|回复|再生|吸血|寄生|软糖|许愿|治愈之愿|光合/;
const BST = /剑舞|生长|龙之舞|蝶舞|破壳|冥想|诡计|健美|集气|铁壁|磨爪|巨大化|岩石打磨|咒语|舞|增幅/;
const WXABI = /干旱|降雨|降雪|扬沙|日照|沙暴|细雨|冰雹|雪隐/;
const WXMV = /晴天|求雨|大晴天|沙暴|冰雹|雪天|下雨/;
const FDB = /物攻流|特攻流|双刀流|均衡全能/;
let CARD = {}, CTRL = [];
console.log('== B. 卡面一体化（9 核心） ==');
CORES.forEach(nm => {
  const c = byZh(nm); if (!c) { console.log('  ' + nm + ' 未找到'); return }
  let raw = '';
  try { ctx.selectCore(c.id); raw = reg.get('coreOut').innerHTML || '' } catch (e) { console.log('  ' + nm + ' THREW ' + e.message); return }
  const t = strip(raw);
  const prin = (t.match(/打法原则（P1–P5 同层）：/g) || []).length;
  const prinAny = (t.match(/｜原则 P/g) || []).length;
  const titles = []; const rx = /title="([^"]*)"/g; let mm;
  while ((mm = rx.exec(raw)) !== null) titles.push(unesc(mm[1]));
  const mvTitle = titles.filter(x => /克制 /.test(x) && /｜原则 P/.test(x));
  const mvChip = titles.filter(x => /克制 /.test(x));
  const usageTxt = (t.match(/原版使用率 ≠ ER 使用率/g) || []).length + (t.match(/原版（PS OU\/ND）使用率 ≠ ER 使用率/g) || []).length;
  const names = []; const rn = /(⭐ 推荐流派 |流派 )(\d)：([^<]+)</g; let nn;
  while ((nn = rn.exec(raw)) !== null) names.push(nn[3]);
  const slots = (t.match(/4 槽：/g) || []).length;
  const fdb = (t.match(FDB) || []).length;
  const selWhy = (t.match(/选招依据：/g) || []).length;
  CARD[c.zh] = { prin: prin, prinAny: prinAny, mvChip: mvChip.length, mvTitle: mvTitle.length, usageTxt: usageTxt, names: names, slots: slots, raw: raw, t: t };
  rec('B-' + c.zh + '-流派原则行', prin >= 1 && prin === names.length, '打法原则行=' + prin + ' 流派数=' + names.length + '（' + names.join('/') + '）');
  rec('B-' + c.zh + '-流派命名', names.length >= 1 && fdb === 0, '命名=' + names.join(' / ') + ' 禁用词=' + fdb);
  rec('B-' + c.zh + '-招式/特性chip带why', mvTitle.length >= 1, '带「克制…｜原则 P」title 的 chip=' + mvTitle.length + ' / 含「克制」title=' + mvChip.length);
  rec('B-' + c.zh + '-4槽行', slots >= 1, '「4 槽：」=' + slots);
  console.log('  ' + c.zh + '#' + c.id + ': 打法原则行=' + prin + '(流派' + names.length + ')｜why含原则=' + prinAny + '｜chip(title含克制)=' + mvChip.length + '(含原则' + mvTitle.length + ')｜原版≠ER 标注=' + usageTxt + '｜4槽行=' + slots + '｜选招依据=' + selWhy + '｜禁用词=' + fdb);
  if (prin !== names.length) console.log('     ⚠ 原则行数与流派数不等');
  console.log('     流派名: ' + names.join(' / '));
});
console.log('== C. 对位抽检（配招/流派维度）—— 9 核心 ==');
const RUB = { '护城龙': 'R1盾', '坚果哑铃': 'R1盾', '大针蜂': 'R2攻手', '雷电云': 'R2攻手', '霸王花': 'R2攻手', '妙蛙花': 'R3强化', '凤王': 'R3强化', '煤炭龟': 'R4天气', '大嘴鸥': 'R4天气' };
CORES.forEach(nm => {
  const c = byZh(nm); if (!c) return;
  let b0 = null, all = null;
  try { all = ctx.deriveBuilds(c); b0 = all[0] } catch (e) { console.log('  ' + nm + ' deriveBuilds THREW ' + e.message); return }
  const slots = (b0.mv && b0.mv.main) || [];
  const mv = slots.map(sl => { const d = MV[sl.id] || []; return { id: sl.id, n: d[1], ty: d[3], cls: d[4], pow: d[5] || 0, prio: d[8] || 0, tag: sl.tag } });
  const moves = mv.map(x => x.n).join('/');
  const offMv = mv.filter(x => x.cls !== '变化' && x.pow > 0);
  const coverMv = offMv.filter(x => x.ty !== c.t1 && x.ty !== c.t2);
  const recMv = mv.filter(x => REC.test(x.n));
  const bstMv = mv.filter(x => BST.test(x.n));
  const prioMv = mv.filter(x => x.prio >= 1);
  const abis = ((b0.abi || []).map(a => a.n)).join('/');
  const wx = (WXABI.test(abis) ? '特性:' + (b0.abi || []).filter(a => WXABI.test(a.n)).map(a => a.n).join(',') : '') + (mv.some(x => WXMV.test(x.n)) ? '|招:' + mv.filter(x => WXMV.test(x.n)).map(x => x.n).join(',') : '');
  const it0 = (b0.it && b0.it[0]) ? b0.it[0][0] : '';
  const whyOk = /^克制 /.test(b0.why || '') && /｜原则 P/.test(b0.why || '');
  const key = RUB[c.zh] || '';
  let v = false, det = '';
  if (key === 'R1盾') { v = recMv.length > 0 || mv.some(x => /螺旋球|铁头|剧毒|毒针|尖刺防守|双刃头锤|重踏|地震|威吓/.test(x.n)); det = '回复招=' + (recMv.map(x => x.n).join(',') || '无') + '｜tag=' + mv.map(x => x.tag).join('/') }
  if (key === 'R2攻手') { v = coverMv.length > 0; det = '非本系攻击招(补盲)=' + (coverMv.map(x => x.n + '(' + x.ty + ')').join(',') || '无') + '｜本系=' + c.t1 + '/' + c.t2 }
  if (key === 'R3强化') { v = bstMv.length > 0 && recMv.length > 0; det = '强化招=' + (bstMv.map(x => x.n).join(',') || '无') + '｜回复招=' + (recMv.map(x => x.n).join(',') || '无') }
  if (key === 'R4天气') { v = wx.length > 0; det = '天气来源=' + (wx || '无') + '｜特性=' + abis }
  const vtag = key ? (key + ' ' + (v ? 'PASS' : 'FAIL') + ' ' + det) : '（其他）';
  if (key) rec('C-' + c.zh + '-' + key, v, det);
  rec('C-' + c.zh + '-流派why原则', whyOk, 'why=' + String(b0.why || '').slice(0, 120));
  console.log('  ' + c.zh + ' 流派1「' + b0.name + '」side=' + b0.side + ' roleTag=' + b0.roleTag + '｜⭐道具=' + it0);
  console.log('     4 槽: ' + mv.map(x => x.n + '[' + x.tag + ']').join(' '));
  console.log('     ' + vtag);
  console.log('     流派 why: ' + String(b0.why || '').slice(0, 170));
  console.log('     先制招=' + (prioMv.map(x => x.n + '+' + x.prio).join(',') || '无') + '｜备选流派=' + (all.slice(1).map(x => x.name).join('/') || '无'));
});
console.log('== D. 控速位（跨卡扫描：需求行「控速」→ 成员 ⭐道具 + 其先制招） ==');
CORES.forEach(nm => {
  const c = byZh(nm); if (!c || !CARD[c.zh]) return;
  const segs = CARD[c.zh].raw.split('<div class="slotbody">').slice(1);
  segs.forEach(r => {
    const txt = strip(r);
    if (!/控速/.test(txt)) return;
    const hd = r.match(/<b>([^<]*)<\/b>[\s\S]{0,80}?#(\d+)<\/span>/);
    const it = (txt.match(/⭐([^\s（(]+)/) || [])[1] || '(无⭐)';
    let prio = '';
    try { const sp2 = byZh(hd ? hd[1] : ''); if (sp2) { const b2 = ctx.deriveBuilds(sp2)[0]; prio = ((b2.mv.main || []).map(sl => { const d = MV[sl.id] || []; return (d[8] || 0) >= 1 ? d[1] + '+' + d[8] : '' }).filter(Boolean)).join(',') || '无先制' } } catch (e) { prio = 'ERR' }
    CTRL.push({ core: c.zh, m: hd ? hd[1] : '?', it: it, prio: prio });
    console.log('  [' + c.zh + '] ' + (hd ? hd[1] : '?') + '#' + (hd ? hd[2] : '?') + ' ⭐' + it + '｜先制招=' + prio);
  });
});
const ctrlOk = CTRL.filter(x => /围巾|嘉珍果|先制之爪/.test(x.it) || x.prio !== '无先制').length;
rec('D-控速协同', CTRL.length > 0 && ctrlOk === CTRL.length, '控速位 ' + CTRL.length + ' 例，围巾/嘉珍果/先制之爪 或 自带先制招 = ' + ctrlOk);
console.log('== E. 汇总 ==');
console.log('total=' + R.length + ' PASS=' + R.filter(x => x.ok).length + ' FAIL=' + R.filter(x => !x.ok).length);
R.forEach(x => { if (!x.ok) console.log('  FAIL ' + x.id + ' | ' + x.msg) });
