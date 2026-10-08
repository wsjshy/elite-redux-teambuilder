/* v4.5e：流派卡渲染面原文取证（道具行 / 盲点行 / 免疫警示 / 双刀补盲） */
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
const strip = s => String(s || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const CORES = ['妙蛙花', '护城龙', '凤王', '煤炭龟', '坚果哑铃', '霸王花', '大针蜂', '雷电云', '大嘴鸥'];
let R = []; const rec = (id, ok, msg) => R.push({ id, ok, msg });
console.log('== 流派卡渲染面原文（每卡：流派名｜道具行｜盲点行｜免疫/双刀） ==');
const mism = [];
CORES.forEach(nm => {
  const c = byZh(nm); if (!c) return;
  try { ctx.selectCore(c.id) } catch (e) { console.log(nm + ' THREW ' + e.message); return }
  const raw = reg.get('coreOut').innerHTML || '';
  const blocks = raw.split('<details class="big').slice(1);
  console.log('### ' + c.zh + '（#' + c.id + '）流派卡 ' + blocks.length + ' 张');
  blocks.forEach((bk, i) => {
    const sum = (bk.split('</summary>')[0] || '');
    const bn = (strip(sum).match(/推荐流派\s*\d+[：:]\s*([^（(]{1,24})/) || strip(sum).match(/流派\s*\d+[：:]\s*([^（(]{1,24})/) || [])[1] || '?';
    const side = (strip(sum).match(/^([^向]{1,8})向/) || [])[1] || '';
    const itRow = (bk.match(/<b>道具：<\/b>([\s\S]{0,400}?)<div class="sec"/) || bk.match(/<b>道具：<\/b>([\s\S]{0,400}?)<\/div>/) || [])[1] || '';
    const it = (itRow.match(/⭐([^<]+)</) || [])[1] || '(无)';
    const bl = (bk.match(/盲点属性（4 招均 ≤0\.5x）：([^<]+)</) || [])[1] || '(无盲点)';
    const imm = (bk.match(/特性免疫警示<\/span>\s*([^<]{0,80})/) || [])[1] || '(无)';
    const dual = (bk.match(/双刀补盲：([^<]{0,60})/) || [])[1] || '(无)';
    console.log('  [' + (i + 1) + '] ' + side + '向 「' + bn + '」｜道具行⭐=' + it + '｜盲点=' + bl + '｜免疫=' + imm.slice(0, 40) + '｜双刀补盲=' + dual);
    if (/围巾/.test(it)) mism.push(c.zh + '「' + bn + '」⭐' + it);
  });
  try {
    const planRaw = raw.split('队伍成员（需求驱动）')[1] || raw;
    console.log('    队伍行核心: ' + ((strip(raw).match(new RegExp(c.zh + '\\s*#\\d+\\s*核心[^配]{0,40}道具：\\s*⭐([^\\s（(]+)')) || [])[1] || '(未捕获)'));
  } catch (e) { }
});
console.log('== 判定 ==');
rec('E-流派卡锁招道具', mism.length === 0, mism.length ? '命中 ' + mism.length + '：' + mism.join(' || ') : '无');
console.log('total=' + R.length + ' PASS=' + R.filter(x => x.ok).length + ' FAIL=' + R.filter(x => !x.ok).length);
R.forEach(x => { if (!x.ok) console.log('  FAIL ' + x.id + ' | ' + x.msg) });
