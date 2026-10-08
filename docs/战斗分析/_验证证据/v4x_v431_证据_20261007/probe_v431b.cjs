/* v4.3.1 ⑤ 定向复验 v2：模板道具「进化奇石」不适用提示
   修正记录（自纠 2）：v1 直接取 renderTplBody() 的返回值 → 该函数无 return（写 #tplBody<i>.innerHTML），
   必然取空；改为经 stub DOM 读取。另 tplAll 形态自适应（函数/数组/对象）。 */
'use strict';
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync(process.argv[2], 'utf8');
const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi; let m, parts = [];
while ((m = re.exec(html)) !== null) { if (/\bsrc\s*=/i.test(m[1] || '')) continue; parts.push(m[2]); }
function mkEl(t) {
  const e = {
    _tag: (t || 'div').toLowerCase(), children: [], style: {}, dataset: {}, value: '', checked: false, innerHTML: '', textContent: '', className: '', id: '',
    classList: { _s: new Set(), add() { for (const c of arguments) this._s.add(c) }, remove() { for (const c of arguments) this._s.delete(c) }, toggle(c, f) { if (f === undefined) f = !this._s.has(c); f ? this._s.add(c) : this._s.delete(c); return f }, contains(c) { return this._s.has(c) } },
    appendChild(c) { this.children.push(c); this.innerHTML += (c && c.innerHTML !== undefined ? c.innerHTML : ''); return c },
    removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c },
    insertBefore(c) { this.children.push(c); this.innerHTML += (c && c.innerHTML !== undefined ? c.innerHTML : ''); return c },
    querySelector: () => mkEl('div'), querySelectorAll: () => [],
    setAttribute(k, v) { this['a_' + k] = v }, getAttribute(k) { return this['a_' + k] === undefined ? null : this['a_' + k] },
    removeAttribute() { }, addEventListener() { }, removeEventListener() { }, focus() { }, blur() { }, click() { }, remove() { }, insertAdjacentHTML(p, h) { this.innerHTML += (h || '') },
    scrollIntoView() { }, getBoundingClientRect: () => ({ top: 0, left: 0, width: 0, height: 0 }), closest: () => null, contains: () => false, replaceWith() { }, after() { }, before() { }
  }; return e;
}
const reg = new Map(), getEl = id => { if (!reg.has(id)) { const e = mkEl('div'); e.id = id; reg.set(id, e) } return reg.get(id) };
const ctx = {
  console, alert() { }, setTimeout, clearTimeout, setInterval: () => 0, clearInterval() { }, JSON, Math, Date, Object, Array, String, Number, Boolean, RegExp, Error, Map, Set, isFinite, isNaN, parseInt, parseFloat, encodeURIComponent, decodeURIComponent,
  Blob: function () { }, FileReader: function () { }, URL: { createObjectURL: () => '', revokeObjectURL() { } }, navigator: { userAgent: 'v' }, location: { hash: '', href: '' },
  document: { getElementById: getEl, createElement: t => mkEl(t), createTextNode: t => ({ textContent: t, innerHTML: t }), querySelector: () => mkEl('div'), querySelectorAll: () => [], addEventListener() { }, body: mkEl('body'), documentElement: mkEl('html'), head: mkEl('head'), createDocumentFragment: () => mkEl('f') }
};
ctx.window = ctx; ctx.globalThis = ctx; ctx.window.addEventListener = function () { }; ctx.window.innerHeight = 900; ctx.window.scrollY = 0; ctx.addEventListener = function () { };
vm.createContext(ctx);
let err = null; try { vm.runInContext(parts.join('\n;\n'), ctx, { filename: 'html_script.js' }) } catch (e) { err = e }
const R = []; const A = (id, ok, d) => R.push({ id, ok: !!ok, detail: d || '' });
const T0 = ctx.tplAll; let diag = 'typeof=' + typeof T0 + ' isArray=' + Array.isArray(T0);
let raw = null, tpls = [];
try { raw = (typeof T0 === 'function') ? T0() : T0; } catch (e) { diag += ' callERR=' + e.message }
diag += ' retType=' + (Array.isArray(raw) ? 'array' : typeof raw);
if (Array.isArray(raw)) tpls = raw;
else if (raw && typeof raw === 'object') { const k = ['list', 'tpls', 'all', 'items', 'data'].filter(x => Array.isArray(raw[x]))[0]; if (k) { tpls = raw[k]; diag += ' via=' + k } else diag += ' keys=' + JSON.stringify(Object.keys(raw).slice(0, 8)) }
if (typeof T0 === 'function') diag += ' src=' + T0.toString().slice(0, 120).replace(/\s+/g, ' ');
A('Z0-load', !err && tpls.length > 0, (err ? err.message : 'ok') + ' | ' + diag + ' | 模板数=' + tpls.length);

const rows = [], noEvioTrue = [], noteHit = [], evioNoNote = [];
tpls.forEach((t, i) => {
  let na = null; try { na = ctx.tplItemNoEvio(i) } catch (e) { na = 'ERR:' + e.message }
  const el = getEl('tplBody' + i); el.innerHTML = '';
  try { ctx.renderTplBody(i) } catch (e) { }
  const body = el.innerHTML || '';
  const hasNote = /（不适用）/.test(body), hasEvio = /进化奇石/.test(body);
  rows.push((t.name || i) + '[noEvio=' + na + ',奇石=' + hasEvio + ',不适用=' + hasNote + ']');
  if (na === true) noEvioTrue.push(t.name || i);
  if (hasNote) noteHit.push((t.name || i) + '#' + i);
  if (hasEvio && !hasNote) evioNoNote.push(t.name || i);
});
A('Z1-noEvioFn', tpls.length >= 18 && noEvioTrue.length >= 1, 'tplItemNoEvio=true 的模板 ' + noEvioTrue.length + '/' + tpls.length + ' 个: ' + JSON.stringify(noEvioTrue));
A('Z2-noteRendered', noteHit.length >= 1 && evioNoNote.length >= 1,
  '渲染出「（不适用）」=' + noteHit.length + ' 个: ' + JSON.stringify(noteHit) + ' | 正常列奇石(带限定说明)=' + evioNoNote.length + ' 个: ' + JSON.stringify(evioNoNote.slice(0, 5)));
console.log('==== v4.3.1 ⑤ 定向复验 v2 ====');
R.forEach(x => console.log((x.ok ? 'PASS ' : 'FAIL ') + x.id + ' | ' + x.detail.slice(0, 1100)));
console.log('total=' + R.length + ' PASS=' + R.filter(x => x.ok).length + ' FAIL=' + R.filter(x => !x.ok).length);
console.log('逐模板=' + rows.join(' | '));
const t0 = noEvioTrue.length ? tpls.filter((t, i) => { try { return ctx.tplItemNoEvio(i) === true } catch (e) { return false } })[0] : null;
if (t0) {
  const i0 = tpls.indexOf(t0), el = getEl('tplBody' + i0); el.innerHTML = ''; try { ctx.renderTplBody(i0) } catch (e) { }
  const b = el.innerHTML, p = b.indexOf('不适用');
  console.log('SAMPLE[' + (t0.name || i0) + ']=' + b.slice(Math.max(0, p - 300), p + 80).replace(/\s+/g, ' '));
}
