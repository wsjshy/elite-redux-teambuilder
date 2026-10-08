/* v4.5b：FAIL 复核 —— 原则行容错匹配 / 盲点提示 / 凤王强化流派深挖 / 控速行精确抽取 */
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
const strip = s => String(s || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const BST = /剑舞|生长|龙之舞|蝶舞|破壳|冥想|诡计|健美|集气|铁壁|磨爪|巨大化|岩石打磨|咒语|舞|增幅/;
let R = []; function rec(id, ok, msg) { R.push({ id: id, ok: ok, msg: msg }) }
const CORES = ['妙蛙花', '护城龙', '凤王', '煤炭龟', '坚果哑铃', '霸王花', '大针蜂', '雷电云', '大嘴鸥'];
console.log('== B1 复核：流派「打法原则」行（容错：标签被空格拆断） ==');
CORES.forEach(nm => {
  const c = byZh(nm); if (!c) return;
  try { ctx.selectCore(c.id) } catch (e) { console.log('  ' + nm + ' THREW'); return }
  const raw = reg.get('coreOut').innerHTML || '';
  const prin = (raw.match(/<b>打法原则<\/b>（P1–P5 同层）：/g) || []).length;
  const prin2 = (strip(raw).match(/打法原则\s*（P1–P5 同层）：/g) || []).length;
  const names = (raw.match(/(?:⭐ 推荐流派 |流派 )\d：([^<]*)</g) || []).length;
  const blind = (raw.match(/盲点属性（4 招均 ≤0\.5x）/g) || []).length;
  const noblind = (raw.match(/无盲点（21 属性均有 ≥1x 手段）/g) || []).length;
  const mixfix = (raw.match(/双刀补盲：/g) || []).length;
  const immw = (raw.match(/特性免疫警示/g) || []).length;
  const srcRow = (raw.match(/选招依据：/g) || []).length;
  const basis = (raw.match(/打法依据<\/b>（动态推导）：/g) || []).length;
  rec('B1-' + c.zh, prin === names && names >= 1, '「打法原则」行=' + prin + '（容错=' + prin2 + '）流派数=' + names + '｜打法依据=' + basis + '｜选招依据=' + srcRow + '｜盲点行=' + blind + '｜无盲点行=' + noblind + '｜双刀补盲=' + mixfix + '｜免疫警示=' + immw);
  console.log('  ' + c.zh + ': 打法原则行=' + prin + '(容错' + prin2 + ') 流派=' + names + '｜依据' + basis + '｜盲点' + blind + '/无盲点' + noblind + '/双刀补盲' + mixfix + '/免疫' + immw);
});
console.log('== C4 复核：凤王「强化」流派深挖 ==');
const F = byZh('凤王');
try {
  const bs = ctx.deriveBuilds(F);
  bs.forEach((b, i) => {
    const slots = (b.mv.main || []).map(sl => { const d = MV[sl.id] || []; return (d[1] || sl.id) + '[tag:' + sl.tag + '|ty:' + d[3] + '|pow:' + (d[5] || 0) + ']' }).join(' ');
    console.log('  流派' + (i + 1) + '「' + b.name + '」side=' + b.side + ' roleTag=' + b.roleTag + ' route=' + (b.route || '-'));
    console.log('     slots: ' + slots);
    console.log('     why: ' + String(b.why || '').slice(0, 200));
    console.log('     basis: ' + ((b.basis || []).map(x => x.txt).join('；')).slice(0, 220));
    console.log('     drivenBy: ' + ((b.drivenBy || []).join('；') || '无').slice(0, 200));
  });
} catch (e) { console.log('  deriveBuilds THREW ' + e.message) }
const learn = (function () { try { return ctx.learnOf(F) || [] } catch (e) { return [] } })();
const lb = learn.filter(id => { const d = MV[id] || []; return BST.test(d[1] || '') });
console.log('  凤王可学「强化类」候选=' + (lb.map(id => MV[id][1]).join('/') || '无'));
console.log('  凤王特性池=' + ((F.abis || []).join('/')) + '｜天性池=' + ((F.inns || []).join('/')));
try {
  const b0 = ctx.deriveBuilds(F)[0];
  const pick = ctx.pickAttacks(F, '物理', 4, b0.roleTag);
  console.log('  物理攻击池Top6=' + pick.slice(0, 6).map(x => (MV[x.id] ? MV[x.id][1] : x.id) + '(' + x.kind + ')').join(','));
} catch (e) { console.log('  pickAttacks THREW ' + e.message) }
console.log('== D2 复核：控速行精确抽取（只看行首需求标签含「控速」的行） ==');
let CTRL = [];
CORES.forEach(nm => {
  const c = byZh(nm); if (!c) return;
  try { ctx.selectCore(c.id) } catch (e) { return }
  const raw = reg.get('coreOut').innerHTML || '';
  raw.split('<div class="slotbody">').slice(1).forEach(r => {
    const hd = r.match(/<b>([^<]{1,40})<\/b>/);
    const label = hd ? hd[1] : '';
    if (!/控速/.test(label)) return;
    const wn = (r.match(/<b>([^<]*)<\/b>[\s\S]{0,120}?#(\d+)<\/span>/) || []);
    const it = (strip(r).match(/⭐([^\s（(]+)/) || [])[1] || '(无⭐)';
    CTRL.push({ core: c.zh, label: label, m: wn[1] || '?', id: wn[2] || '?', it: it });
    console.log('  [' + c.zh + '] 行「' + label + '」→ ' + wn[1] + '#' + wn[2] + ' ⭐' + it);
  });
});
const ok = CTRL.filter(x => /围巾|嘉珍果|先制之爪/.test(x.it)).length;
rec('D2-控速协同', CTRL.length > 0 && ok === CTRL.length, '控速行 ' + CTRL.length + ' 例，⭐围巾/嘉珍果/先制之爪 = ' + ok);
CTRL.forEach(x => { if (!/围巾|嘉珍果|先制之爪/.test(x.it)) console.log('     ⚠ ' + x.core + ' → ' + x.m + ' ⭐' + x.it) });
console.log('== E2 汇总 ==');
console.log('total=' + R.length + ' PASS=' + R.filter(x => x.ok).length + ' FAIL=' + R.filter(x => !x.ok).length);
R.forEach(x => { if (!x.ok) console.log('  FAIL ' + x.id + ' | ' + x.msg) });
