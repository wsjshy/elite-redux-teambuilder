/* v4.4 结构计数 + 原则常量清单 + 慢速围巾观察 */
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
const SP = (ctx.ERDATA && ctx.ERDATA.species) || [];
const byZh = n => SP.find(x => String(x.zh || '').indexOf(n) > -1);
const strip = s => String(s || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
console.log('== 原则常量（可调性：顶层 var + 函数 = 可被页面/控制台覆写） ==');
[['DUTY', 'object'], ['AX_BY_CLS', 'object'], ['AX_OVR', 'object'], ['COST_OF', 'object'], ['ROLE_PAYLOAD', 'object'], ['EVIO_PRIORITY', 'number'], ['ROLE_PAYLOAD_BONUS', 'number'], ['THREAT_LIB', 'object'], ['itemDutyOf', 'function'], ['itemScored', 'function'], ['itemDecide', 'function'], ['oppTargets', 'function']].forEach(x => console.log('  ' + x[0] + ' = ' + typeof ctx[x[0]] + (x[1] ? '（期望 ' + x[1] + '）' : '')));
console.log('  DUTY 轴：' + Object.keys(ctx.DUTY['输出']).join('/') + ' | ROLE_PAYLOAD 键=' + Object.keys(ctx.ROLE_PAYLOAD).join(',') + ' | EVIO_PRIORITY=' + ctx.EVIO_PRIORITY + ' | PAYLOAD_BONUS=' + ctx.ROLE_PAYLOAD_BONUS);
console.log('  ITEM_POOL=' + (ctx.ITEM_POOL || []).length + ' 类=' + Object.keys((ctx.ITEM_POOL || []).reduce(function (a, x) { a[x.cls] = 1; return a }, {})).length);
console.log('  原则常量在源码中的出现: P1×' + (js.match(/P1/g) || []).length + ' P2×' + (js.match(/P2/g) || []).length + ' P3×' + (js.match(/P3/g) || []).length + ' P4×' + (js.match(/P4/g) || []).length + ' P5×' + (js.match(/P5/g) || []).length);
console.log('== 慢速围巾观察（速度线口径） ==');
[[76, '隆隆岩'], [771, '拳海参'], [112, '钻角犀兽'], [249, '洛奇亚']].forEach(kv => {
  const s = f1z(kv[0]); if (!s) { console.log('  #' + kv[0] + ' 未找到'); return }
  const tg = ctx.oppTargets(s);
  let a = 'ERR', b = 'ERR';
  try { a = (ctx.itemDecide(s, ctx.coreSide(s), '输出') || []).map(e => e.zh + '(' + e.sc + ')').join(' > ') } catch (e) { }
  try { b = (ctx.itemDecide(s, ctx.coreSide(s), '控速') || []).map(e => e.zh + '(' + e.sc + ')').join(' > ') } catch (e) { }
  console.log('  ' + s.zh + '#' + s.id + ' 速' + s.base[5] + ' outsped=' + tg.outsped + ' | 输出→ ' + a + ' | 控速→ ' + b);
});
function f1z(id) { return SP.find(x => String(x.id) === String(id)) }
console.log('== 结构计数（3 核心） ==');
['妙蛙花', '护城龙', '大嘴鸥'].forEach(nm => {
  const c = byZh(nm); ctx.selectCore(c.id);
  const raw = reg.get('coreOut').innerHTML || '', t = strip(raw);
  console.log('  ' + c.zh + ': 配招：×' + ((t.match(/配招：/g) || []).length) + ' 特性：×' + ((t.match(/特性：/g) || []).length) + ' 性格：×' + ((t.match(/性格：/g) || []).length) +
    ' img×' + ((raw.match(/<img/g) || []).length) + ' gotoItem×' + ((raw.match(/gotoItem\(/g) || []).length) + ' 字' + t.length);
});
