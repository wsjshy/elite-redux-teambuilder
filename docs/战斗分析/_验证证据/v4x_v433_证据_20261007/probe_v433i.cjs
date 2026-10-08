/* v4.3.3 合理性定位：buildItem 签名/tag 映射 + 方案卡渲染面的天气岩石与角色道具 */
'use strict';
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync(process.argv[2], 'utf8');
const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi; let m, parts = [];
while ((m = re.exec(html)) !== null) { if (/\bsrc\s*=/i.test(m[1] || '')) continue; parts.push(m[2]); }
const joined = parts.join('\n;\n');
const freshLines = joined.split('\n');
const bi = freshLines.findIndex(l => /^function buildItem\b/.test(l));
console.log('-- buildItem 定义行=' + (bi + 1) + ' 源（前 1500 字）');
console.log(freshLines.slice(bi, bi + 26).join('\n').slice(0, 1500));
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
vm.runInContext(joined, ctx, { filename: 'inline.js' });
const SP = (ctx.ERDATA && ctx.ERDATA.species) || [];
const f1 = id => SP.find(x => String(x.id) === String(id));
const strip = s => String(s || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
console.log('-- tag 直调对照（sets: side=coreSide(s)）');
[[192, '天气'], [324, '天气'], [3, '输出'], [411, '肉盾'], [411, '输出'], [112, '输出'], [112, '肉盾'], [249, '肉盾'], [192, '场地']].forEach(kv => {
  const s = f1(kv[0]); if (!s) return;
  let r = 'ERR'; try { r = (ctx.buildItem(s, ctx.coreSide(s), kv[1]) || []).map(x => x[0]).join('/') } catch (e) { r = 'ERR:' + e.message }
  console.log('   ' + s.zh + '#' + s.id + ' tag=' + kv[1] + ' → ' + r);
});
console.log('-- 方案卡文本（真实 selectCore 渲染）');
[3, 248, 131, 279, 411, 324].forEach(cid => {
  const c = f1(cid); if (!c) { console.log('   #' + cid + ' 不存在'); return }
  try { ctx.selectCore(cid) } catch (e) { console.log('   [' + c.zh + '] THREW ' + e.message); return }
  const t = strip(reg.get('coreOut').innerHTML);
  const rocks = ['炽热岩石', '潮湿岩石', '光滑岩石', '冰冷岩石'];
  const rc = rocks.map(x => x + '×' + ((t.match(new RegExp(x, 'g')) || []).length));
  console.log('   ■' + c.zh + '#' + cid + ' 体系提示=' + (/天气\/场地由队友提供/.test(t) ? '队友提供' : '—') + ' | ' + rc.join(' ') + ' | 光之黏土×' + ((t.match(/光之黏土/g) || []).length));
  rocks.forEach(x => { let i = 0, n = 0; while ((i = t.indexOf(x, i)) > -1 && n < 2) { console.log('      ' + x + ' 语境: …' + t.slice(Math.max(0, i - 70), i + 40) + '…'); i += x.length; n++ } });
  const seg = t.slice(t.indexOf('队伍方案'), t.indexOf('队伍方案') + 520);
  console.log('      队伍首段: ' + seg);
});
