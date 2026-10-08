/* v4.5d：控速位成员配招 / 流派卡道具 why / 队伍行与流派卡道具差异明细 */
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
const mvName = id => { const d = MV[id] || []; return (d[1] || id) };
console.log('== 控速位成员配招（大嘴鸥 / 霸王花 / 坚果哑铃） ==');
['大嘴鸥', '霸王花', '坚果哑铃'].forEach(nm => {
  const c = byZh(nm); if (!c) return;
  try { ctx.selectCore(c.id) } catch (e) { return }
  const raw = reg.get('coreOut').innerHTML || '';
  raw.split('<div class="slotbody">').slice(1).forEach(r => {
    const bd = []; const rx = /<span class="badge">([^<]*)<\/span>/g; let mm;
    while ((mm = rx.exec(r)) !== null) bd.push(mm[1]);
    if (!bd.some(b => /控速/.test(b))) return;
    const t = strip(r);
    console.log('  [' + c.zh + '] 需求=' + bd.join(',') + '\n     全文: ' + t.slice(0, 420));
  });
});
console.log('== 流派卡道具 why（护城龙 / 坚果哑铃 / 霸王花） ==');
['护城龙', '坚果哑铃', '霸王花'].forEach(nm => {
  const c = byZh(nm); if (!c) return;
  try { ctx.selectCore(c.id) } catch (e) { return }
  const raw = reg.get('coreOut').innerHTML || '';
  let i = 0;
  raw.split('<div class="slotbody">').slice(1).forEach(r => {
    const bd = []; const rx = /<span class="badge">([^<]*)<\/span>/g; let mm;
    while ((mm = rx.exec(r)) !== null) bd.push(mm[1]);
    if (/核心/.test(bd.join(',')) || /围巾|头盔|厚底靴|宝珠/.test(strip(r))) {
      if (i++ > 14) return;
      const t = strip(r);
      console.log('  [' + c.zh + '] ' + t.slice(0, 300));
    }
  });
  console.log('  --- ' + c.zh + ' 流派卡渲染（打法原则/道具行） ---');
  const t2 = strip(raw);
  const rows = t2.split(/打法原则（P1–P5 同层）：/).slice(1);
  rows.forEach((x, k) => { console.log('    流派' + (k + 1) + ' 原则: ' + x.slice(0, 120)); const it = x.match(/道具[：:]\s*([^｜]{0,90})/); if (it) console.log('        道具行: ' + it[1]) });
});
