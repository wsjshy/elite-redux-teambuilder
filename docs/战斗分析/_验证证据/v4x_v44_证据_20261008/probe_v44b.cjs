/* v4.4 对位合理性抽检：卡面逐成员（道具+why title）+ 定向决策核验 + 可调性实证 */
'use strict';
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync(process.argv[2], 'utf8');
const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi; let m, parts = [];
while ((m = re.exec(html)) !== null) { if (/\bsrc\s*=/i.test(m[1] || '')) continue; parts.push(m[2]); }
const js = parts.join('\n;\n'), L = js.split('\n');
const show = (sig, n) => { const i = L.findIndex(l => l.indexOf(sig) > -1); return i > -1 ? '[L' + (i + 1) + '] ' + L.slice(i, i + (n || 4)).join(' ⌷ ').slice(0, 460) : '(未找到 ' + sig + ')' };
console.log('===== tag 来源 =====');
['function roleTagOfCore', 'function itemTagOfCore', 'function roleTagOfNeed', 'function itemTagOfNeed'].forEach(s => console.log(show(s, 6)));
console.log(show('h+=needBuildHtml(m.s', 3));

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
const f1 = id => SP.find(x => String(x.id) === String(id));
const strip = s => String(s || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const spe = s => (s.base && s.base[5] !== undefined ? s.base[5] : '?');

console.log('===== 定向决策核验 =====');
const t3 = (s, tag, c) => { try { return (ctx.itemDecide(s, ctx.coreSide(s), tag, c) || []).map(e => e.zh + '(' + e.sc + ')').join(' > ') } catch (e) { return 'ERR:' + e.message } };
const hz = byZh('护城龙'), kt = byZh('煤炭龟'), rx = byZh('向日花怪'), dy = byZh('雷电云'), dsn = byZh('大针蜂'), fw = byZh('凤王');
console.log('  护城龙#411 肉盾 → ' + t3(hz, '肉盾'));
console.log('  护城龙#411 输出 → ' + t3(hz, '输出'));
console.log('  oppTargets(护城龙).outsped=' + ctx.oppTargets(hz).outsped + ' weak=' + ctx.oppTargets(hz).weak.join('/') + ' quad=' + ctx.oppTargets(hz).quad.join('/') + ' hazWeak=' + ctx.oppTargets(hz).hazWeak + ' 速=' + spe(hz));
console.log('  煤炭龟#324 天气{sys:晴} → ' + t3(kt, '天气', { sys: '晴' }));
console.log('  煤炭龟#324 天气{sys:""} → ' + t3(kt, '天气', {}));
console.log('  向日花怪#192 天气{sys:晴} → ' + t3(rx, '天气', { sys: '晴' }));
console.log('  向日花怪#192 天气{sys:青草场地} → ' + t3(rx, '天气', { sys: '青草场地' }));
console.log('  雷电云#642(速' + spe(dy || {}) + ') 输出 → ' + t3(dy, '输出') + '  outsped=' + ctx.oppTargets(dy).outsped);
console.log('  雷电云-灵兽#1677(速' + spe(f1(1677) || {}) + ') 输出 → ' + t3(f1(1677), '输出'));
console.log('  大针蜂#15(速' + spe(dsn || {}) + ') 输出 → ' + t3(dsn, '输出'));
console.log('  凤王#250 强化 → ' + t3(fw, '强化'));
console.log('  -- 可调性实证：修改 DUTY 常量后重排（P1 权重表可调）--');
const before = t3(hz, '肉盾');
ctx.DUTY['肉盾'].tech = 0.0; ctx.DUTY['肉盾'].punish = 0.0;
const after = t3(hz, '肉盾');
console.log('   改前 肉盾 → ' + before);
console.log('   改后(tech=0,punish=0) 肉盾 → ' + after);
ctx.DUTY['肉盾'].tech = 0.60; ctx.DUTY['肉盾'].punish = 0.80;

console.log('===== 卡面逐成员（道具 + why title 对齐） =====');
['妙蛙花', '护城龙', '凤王', '煤炭龟', '坚果哑铃', '霸王花', '大针蜂', '雷电云', '大嘴鸥'].forEach(nm => {
  const c = byZh(nm); if (!c) { console.log('■' + nm + ' 未找到'); return }
  try { ctx.selectCore(c.id) } catch (e) { console.log('■' + nm + ' THREW ' + e.message); return }
  const raw = reg.get('coreOut').innerHTML || '', t = strip(raw);
  const li = t.indexOf('推荐流派');
  const flow = li > -1 ? t.slice(li, li + 90).replace(/\s+/g, ' ') : '—';
  const whys = []; const rw = /title="主推：([^"]*)"/g; let mm2;
  while ((mm2 = rw.exec(raw)) !== null) whys.push(mm2[1]);
  let i = 0, k = 0, rows = [];
  while ((i = t.indexOf('道具：', i)) > -1) {
    const back = t.slice(Math.max(0, i - 1500), i); const ms = back.match(/#(\d+)/g); const owner = ms ? ms[ms.length - 1] : '?';
    const fwd = t.slice(i, i + 150); const star = (fwd.match(/⭐([^\s]+)/) || [])[1] || '—';
    const alt = (fwd.match(/⭐[^\s]+ ([^\s]+) 备选/) || [])[1] || '';
    rows.push({ owner: owner, star: star, alt: alt, why: whys[k] || '' }); k++; i += 3;
  }
  console.log('■' + c.zh + '#' + c.id + ' 速' + spe(c) + ' 字' + t.length + ' undefined=' + ((t.match(/undefined/g) || []).length) + ' 负向=' + (/已排除|硬排除|体系互斥/.test(t) ? '有!' : '无'));
  console.log('   流派: ' + flow);
  rows.forEach(r => console.log('   ' + r.owner.padEnd(6) + ' ⭐' + r.star + (r.alt ? ' /备选 ' + r.alt : '') + '  ← ' + String(r.why).slice(0, 116)));
});
