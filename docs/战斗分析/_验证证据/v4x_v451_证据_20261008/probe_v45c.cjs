/* v4.5c：定案复核 —— 使用率标注渲染面 / 控速行精确抽取 / 同卡道具一致性 / 盲点案例 */
'use strict';
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync(process.argv[2], 'utf8');
const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi; let m, parts = [];
while ((m = re.exec(html)) !== null) { if (/\bsrc\s*=/i.test(m[1] || '')) continue; parts.push(m[2]); }
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
vm.runInContext(parts.join('\n;\n'), ctx, { filename: 'inline.js' });
const SP = (ctx.ERDATA && ctx.ERDATA.species) || [], MV = ctx.MV || {};
const byZh = n => SP.find(x => String(x.zh || '').indexOf(n) > -1);
const strip = s => String(s || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
let R = []; function rec(id, ok, msg) { R.push({ id: id, ok: ok, msg: msg }) }
const CORES = ['妙蛙花', '护城龙', '凤王', '煤炭龟', '坚果哑铃', '霸王花', '大针蜂', '雷电云', '大嘴鸥'];
console.log('== A. 使用率先验标注（渲染面：机制口径块 #ruleBoxCore） ==');
CORES.forEach(nm => {
  const c = byZh(nm); if (!c) return;
  try { ctx.selectCore(c.id) } catch (e) { return }
  const rb = strip((reg.get('ruleBoxCore') || {}).innerHTML || '');
  const hit = /威胁库使用率先验（v4\.5）/.test(rb), note = /原版使用率 ≠ ER 使用率/.test(rb), cov = /覆盖 751 只（2026-09）/.test(rb);
  if (nm === '妙蛙花') { rec('A-标注渲染面', hit && note && cov, '命中行=' + hit + '｜原版≠ER=' + note + '｜覆盖751=' + cov + '｜片段=' + (rb.match(/威胁库使用率先验（v4\.5）[^|]*\|[^|]*\|[^|]*\|/) || [''])[0].slice(0, 150)) }
  if (nm === '妙蛙花') console.log('  片段: ' + (rb.match(/威胁库使用率先验（v4\.5）.{0,160}/) || ['(无)'])[0]);
});
console.log('== B. 控速行（badge 需求标签）→ 成员 ⭐道具 ==');
let CTRL = [], badges = {};
CORES.forEach(nm => {
  const c = byZh(nm); if (!c) return;
  try { ctx.selectCore(c.id) } catch (e) { return }
  const raw = reg.get('coreOut').innerHTML || '';
  raw.split('<div class="slotbody">').slice(1).forEach(r => {
    const bd = []; const rx = /<span class="badge">([^<]*)<\/span>/g; let mm;
    while ((mm = rx.exec(r)) !== null) bd.push(mm[1]);
    bd.forEach(b => { badges[b] = (badges[b] || 0) + 1 });
    if (bd.some(b => /控速/.test(b))) {
      const wn = (r.match(/<b>([^<]*)<\/b>[\s\S]{0,140}?#(\d+)<\/span>/) || []);
      const it = (strip(r).match(/⭐([^\s（(]+)/) || [])[1] || '(无⭐)';
      CTRL.push({ core: c.zh, need: bd.filter(b => /控速/.test(b)).join(','), m: wn[1] || '?', id: wn[2] || '?', it: it });
      console.log('  [' + c.zh + '] 需求「' + bd.filter(b => /控速/.test(b)).join(',') + '」→ ' + wn[1] + '#' + wn[2] + ' ⭐' + it);
    }
  });
});
console.log('  需求 badge 词频 Top12: ' + Object.keys(badges).sort((a, b) => badges[b] - badges[a]).slice(0, 12).map(k => k + '×' + badges[k]).join(' '));
const okc = CTRL.filter(x => /围巾|嘉珍果|先制之爪/.test(x.it)).length;
rec('B-控速协同', CTRL.length > 0 && okc === CTRL.length, '控速行 ' + CTRL.length + ' 例，⭐围巾/嘉珍果/先制之爪 = ' + okc + (CTRL.length ? '｜明细 ' + CTRL.map(x => x.m + '→' + x.it).join(' / ') : ''));
console.log('== C. 同卡道具一致性：队伍行核心 ⭐ vs 流派卡 ⭐（各流派） ==');
CORES.forEach(nm => {
  const c = byZh(nm); if (!c) return;
  try { ctx.selectCore(c.id) } catch (e) { return }
  const raw = reg.get('coreOut').innerHTML || '';
  let coreIt = '';
  raw.split('<div class="slotbody">').slice(1).forEach(r => { if (/badge">核心</.test(r) && !coreIt) coreIt = (strip(r).match(/⭐([^\s（(]+)/) || [])[1] || '?' });
  let bs = [];
  try { bs = ctx.deriveBuilds(c).map(b => '「' + b.name + '」⭐' + ((b.it && b.it[0]) ? b.it[0][0] : '?')) } catch (e) { }
  const bad = bs.filter(x => /围巾/.test(x)).length;
  rec('C-' + c.zh + '-武器一致', bad === 0, '队伍行核心 ⭐' + coreIt + '｜流派卡 ' + bs.join(' ') + (bad ? '  ← 流派含锁招道具' : ''));
  console.log('  ' + c.zh + ': 队伍行核心 ⭐' + coreIt + '｜' + bs.join(' '));
});
console.log('== D. 盲点案例（霸王花/雷电云 全流派） ==');
['霸王花', '雷电云', '凤王'].forEach(nm => {
  const c = byZh(nm); if (!c) return;
  const bs = ctx.deriveBuilds(c);
  bs.forEach(b => {
    const slots = (b.mv.main || []).map(sl => { const d = MV[sl.id] || []; return (d[1] || sl.id) + '(' + (d[3] || '?') + ')' }).join(' ');
    console.log('  ' + c.zh + ' 「' + b.name + '」side=' + b.side + ' roleTag=' + b.roleTag + '：' + slots);
  });
  try { ctx.selectCore(c.id); const raw = reg.get('coreOut').innerHTML || ''; const t = strip(raw); console.log('    卡面盲点行: ' + ((t.match(/盲点属性（4 招均 ≤0\.5x）：[^⚠]{0,80}/) || ['(无)'])[0])) } catch (e) { }
});
console.log('== E. 汇总 ==');
console.log('total=' + R.length + ' PASS=' + R.filter(x => x.ok).length + ' FAIL=' + R.filter(x => !x.ok).length);
R.forEach(x => { if (!x.ok) console.log('  FAIL ' + x.id + ' | ' + x.msg) });
