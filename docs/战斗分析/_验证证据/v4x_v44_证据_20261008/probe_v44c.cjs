/* v4.4 结构级抽取：队伍方案行 → 成员 → ⭐主推道具 + 其自身 why（严格同一标记内配对） */
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
const byZh = n => SP.find(x => String(x.zh || '').indexOf(n) > -1);
const unesc = s => String(s || '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"');
let PSTAT = { rows: 0, ok: 0, noWhy: 0 };

['妙蛙花', '护城龙', '凤王', '煤炭龟', '坚果哑铃', '霸王花', '大针蜂', '雷电云', '大嘴鸥'].forEach(nm => {
  const c = byZh(nm); if (!c) { console.log('■' + nm + ' 未找到'); return }
  try { ctx.selectCore(c.id) } catch (e) { console.log('■' + nm + ' THREW ' + e.message); return }
  const raw = reg.get('coreOut').innerHTML || '';
  const seg = raw.split('<div class="slotbody">').slice(1);
  console.log('■核心 ' + c.zh + '#' + c.id + ' 速' + c.base[5] + '（队伍行 ' + seg.length + ' 条）');
  seg.forEach(r => {
    const hd = r.match(/<b>([^<]*)<\/b>[\s\S]{0,80}?#(\d+)<\/span>/);
    const isCore = /badge">核心</.test(r);
    const items = []; const rx = /title="(主推|备选)：([^"]*)"[^>]*>([^<]{1,30})</g; let mm;
    while ((mm = rx.exec(r)) !== null) items.push({ kind: mm[1], item: mm[3].replace(/^⭐/, '').trim(), why: unesc(mm[2]) });
    const first = items.filter(x => x.kind === '主推')[0] || items[0];
    if (!first) return;
    PSTAT.rows++; if (/｜原则 P/.test(first.why)) PSTAT.ok++; else PSTAT.noWhy++;
    const alts = items.filter(x => x.kind === '备选').map(x => x.item).slice(0, 2).join(' / ');
    console.log('   ' + (hd ? hd[1] : '?') + '#' + (hd ? hd[2] : '?') + (isCore ? '[核心]' : '') +
      ' ⭐' + first.item + (alts ? '（备选 ' + alts + '）' : '') +
      '\n        why: ' + first.why.slice(0, 150));
  });
});
console.log('== why 溯源统计：队伍行 ' + PSTAT.rows + ' 条，含「｜原则 P…」 ' + PSTAT.ok + ' 条，缺 ' + PSTAT.noWhy + ' 条 ==');
