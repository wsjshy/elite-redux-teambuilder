/* v4.3.3 忠实冷启动：加载后不做任何预热，直接走真实入口 selectCore → 检查方案卡内容 */
'use strict';
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync(process.argv[2], 'utf8');
const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi; let m, parts = [];
while ((m = re.exec(html)) !== null) { if (/\bsrc\s*=/i.test(m[1] || '')) continue; parts.push(m[2]); }
const joined = parts.join('\n;\n');
fs.writeFileSync(process.argv[3], joined, 'utf8');
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
let loadErr = null; try { vm.runInContext(joined, ctx, { filename: 'inline.js' }) } catch (e) { loadErr = e }
console.log('loadErr=' + (loadErr ? loadErr.message + ' @ ' + String(loadErr.stack).split('\n')[1] : '（无）'));
const SP = (ctx.ERDATA && ctx.ERDATA.species) || [];
const f1 = id => SP.find(x => String(x.id) === String(id));
console.log('-- 加载后（零预热）: typeof pickAbiFor=' + typeof ctx.pickAbiFor + ' | needBuildHtml(向日花怪,天气,天气).len=' + (function () { try { return String(ctx.needBuildHtml(f1(192), '天气', '天气') || '').length } catch (e) { return -1 } })());
console.log('-- 载入时已渲染的容器: ' + [...reg.keys()].filter(k => (reg.get(k).innerHTML || '').length > 200).map(k => k + '(' + reg.get(k).innerHTML.length + ')').join(' '));
console.log('-- 真实入口 selectCore(3)：');
try { ctx.selectCore(3) } catch (e) { console.log('   THREW ' + e.message) }
['coreOut', 'teamOut', 'tplOut'].forEach(id => {
  if (!reg.has(id)) { console.log('   #' + id + ' 未注册'); return }
  const s = reg.get(id).innerHTML || '';
  console.log('   #' + id + ' len=' + s.length + ' | 队伍构建方案=' + /队伍构建方案/.test(s) + ' | 配招：×' + ((s.match(/配招：/g) || []).length) + ' | ⭐×' + ((s.match(/⭐/g) || []).length) + ' | 特性：×' + ((s.match(/特性：/g) || []).length) + ' | 炽热岩石=' + /炽热岩石/.test(s) + ' | 进化奇石×' + ((s.match(/进化奇石/g) || []).length) + ' | undefined×' + ((s.match(/undefined/g) || []).length));
});
console.log('-- 其后 renderNeedPlan(妙蛙花) 复核: 配招：×' + ((ctx.renderNeedPlan(f1(3)).match(/配招：/g) || []).length));
console.log('-- 模板路径 renderTpl() → 检查模板体是否含道具行：');
try { ctx.renderTpl() } catch (e) { console.log('   renderTpl THREW ' + e.message) }
const tb = ['tplBody0', 'tplBody1', 'tplBody10'].filter(id => reg.has(id));
console.log('   注册的 tplBody: ' + [...reg.keys()].filter(k => /^tplBody/.test(k)).length + ' 个; 抽样 ' + tb.map(id => id + ':配招×' + ((reg.get(id).innerHTML.match(/配招：/g) || []).length) + ',⭐×' + ((reg.get(id).innerHTML.match(/⭐/g) || []).length)).join(' | '));
