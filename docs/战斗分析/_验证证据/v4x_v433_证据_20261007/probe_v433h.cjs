/* v4.3.3 抽检地面真值：真实冷启动 → selectCore → coreOut 卡片文本（用户所见） */
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
const strip = s => String(s || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
console.log('预热后 pickAbiFor=' + typeof ctx.pickAbiFor + ' | needBuildHtml(向日花怪,输出,天气)=' + (function () { try { return (ctx.buildItem(f1(192), ctx.coreSide(f1(192)), '天气') || []).map(x => x[0]).join('/') } catch (e) { return 'ERR' } })());
[3, 411, 250, 6, 324, 18].forEach(cid => {
  const c = f1(cid); if (!c) return;
  try { ctx.selectCore(cid) } catch (e) { console.log('[' + c.zh + '] selectCore THREW ' + e.message); return }
  const raw = reg.get('coreOut').innerHTML || '';
  const t = strip(raw);
  const CARD = ['炽热岩石', '潮湿岩石', '光滑岩石', '冰冷岩石', '剩饭', '凸凸头盔', '黑色污泥', '生命宝珠', '讲究头带', '讲究眼镜', '讲究围巾', '弱点保险', '光之黏土', '进化奇石', '电气种子', '青草种子'];
  const cc = CARD.filter(x => t.indexOf(x) > -1).map(x => x + '×' + (t.match(new RegExp(x, 'g')) || []).length);
  const ui = t.indexOf('队伍方案');
  console.log('■■ [' + c.zh + '#' + cid + '] 卡片 ' + raw.length + 'B/' + t.length + '字 | undefined×' + ((t.match(/undefined/g) || []).length) + ' | 卡片内道具: ' + cc.join(' '));
  const imgIdx = t.indexOf('核心画像');
  console.log('   画像: ' + t.slice(imgIdx, imgIdx + 150));
  const us = []; let i = 0;
  while ((i = t.indexOf('undefined', i)) > -1) { us.push(t.slice(Math.max(0, i - 26), i + 9)); i += 9 }
  console.log('   undefined语境: ' + (us.length ? us.join(' ／ ') : '（无）'));
  console.log('   队伍段: ' + t.slice(ui, ui + 1150));
});
