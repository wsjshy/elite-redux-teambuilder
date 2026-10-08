/* v4.3.3 结构证据：流派块命名 + 全卡道具块（按角色）+ chips 可点击处理器 + 词条/天性 */
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
const SP = (ctx.ERDATA && ctx.ERDATA.species) || [];
const f1 = id => SP.find(x => String(x.id) === String(id));
const strip = s => String(s || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const BAN = ['物攻流', '特攻流', '双刀流', '均衡全能'];
[3, 411, 250, 6, 324, 18, 248, 131].forEach(cid => {
  const c = f1(cid); if (!c) return;
  try { ctx.selectCore(cid) } catch (e) { console.log('[' + c.zh + '] THREW ' + e.message); return }
  const raw = reg.get('coreOut').innerHTML || '';
  const t = strip(raw);
  const li = t.indexOf('推荐流派');
  const li2 = li > -1 ? li : t.indexOf('流派');
  const seg = li2 > -1 ? t.slice(li2, li2 + 300) : '（无流派块）';
  const banHit = BAN.filter(x => t.indexOf(x) > -1);
  const items = [];
  let i = 0; while ((i = t.indexOf('道具：', i)) > -1) { items.push(t.slice(i, i + 76).replace(/\s+/g, ' ')); i += 3 }
  console.log('■' + c.zh + '#' + cid + ' 卡片' + t.length + '字 | 禁用流派词命中=' + (banHit.length ? banHit.join(',') : '0'));
  console.log('   流派: ' + seg);
  console.log('   道具块×' + items.length + ': ' + items.slice(0, 4).join(' || '));
  console.log('   结构: 配招：×' + ((t.match(/配招：/g) || []).length) + ' 天性×' + ((t.match(/天性/g) || []).length) + ' 词条×' + ((t.match(/词条/g) || []).length) +
    ' | onclick: gotoMv×' + ((raw.match(/gotoMv\(/g) || []).length) + ' gotoAbi×' + ((raw.match(/gotoAbi\(/g) || []).length) + ' gotoItem×' + ((raw.match(/gotoItem\(/g) || []).length) + ' gotoTerm×' + ((raw.match(/gotoTerm\(/g) || []).length) +
    ' | 精灵图 img×' + ((raw.match(/<img/g) || []).length) + ' | 已排除/硬排除文案=' + (/已排除|硬排除|体系互斥/.test(t) ? '有!' : '无'));
});
