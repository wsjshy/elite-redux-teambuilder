/* v4.4 专项：原则层存在与打分可调 + why 格式 + v433-1/2/3 修复确认 + 对位合理性抽检 */
'use strict';
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync(process.argv[2], 'utf8');
const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi; let m, parts = [];
while ((m = re.exec(html)) !== null) { if (/\bsrc\s*=/i.test(m[1] || '')) continue; parts.push(m[2]); }
const js = parts.join('\n;\n'), L = js.split('\n');

/* ---------- Part A 原则层清单（源码存在性，不判实现优劣） ---------- */
console.log('===== Part A 原则层清单 =====');
const cnt = s => (js.match(new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
['THREAT_LIB', 'oppTargets', 'DUTY', 'itemScored', 'itemDecide', 'THREAT_ROLE', 'PRINCIPLE', 'P1', 'P2', 'P3', 'P4', 'P5'].forEach(k => console.log('  ' + k + ' × ' + cnt(k)));
['function itemScored', 'function itemDecide', 'var THREAT_LIB', 'THREAT_LIB=', 'function oppTargets', 'var DUTY', 'DUTY='].forEach(sig => {
  const i = L.findIndex(l => l.indexOf(sig) > -1);
  if (i > -1) console.log('  [行 ' + (i + 1) + '] ' + sig + ' → ' + L.slice(i, i + 3).join(' ⌷ ').slice(0, 240));
});
const pi = L.findIndex(l => /P1[:：]|'P1'|"P1"/.test(l));
if (pi > -1) console.log('  [行 ' + (pi + 1) + '] P1 行：' + L.slice(pi, pi + 6).join(' ⌷ ').slice(0, 420));

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

console.log('===== Part A2 类型与可调性 =====');
['THREAT_LIB', 'oppTargets', 'DUTY', 'itemScored', 'itemDecide'].forEach(k => console.log('  typeof ' + k + ' = ' + (typeof ctx[k])));
try {
  const L1 = ctx.THREAT_LIB; const arr = Array.isArray(L1) ? L1 : (L1 && L1.list) || null;
  console.log('  THREAT_LIB 条目=' + (arr ? arr.length : Object.keys(L1 || {}).length) + ' 例=' + JSON.stringify((arr ? arr.slice(0, 4) : L1)).slice(0, 320));
} catch (e) { console.log('  THREAT_LIB 读取异常 ' + e.message) }
try {
  const d = ctx.DUTY; const keys = d && Object.keys(d);
  console.log('  DUTY 键=' + (keys ? keys.length : 0) + ' → ' + (keys || []).slice(0, 10).join(',') + ' 例=' + JSON.stringify(keys ? d[keys[0]] : null).slice(0, 240));
} catch (e) { console.log('  DUTY 读取异常 ' + e.message) }
try {
  const s = f1(411); const o = ctx.oppTargets(s);
  console.log('  oppTargets(护城龙#411) = ' + JSON.stringify(o).slice(0, 360));
} catch (e) { console.log('  oppTargets 异常 ' + e.message) }
try {
  const s = f1(411); const r = ctx.itemScored(s, ctx.coreSide(s), '肉盾');
  console.log('  itemScored(护城龙,肉盾) = ' + JSON.stringify(r).slice(0, 700));
} catch (e) { console.log('  itemScored 异常 ' + e.message) }

console.log('===== Part B 卡面抽检 =====');
const CORES = ['妙蛙花', '护城龙', '凤王', '煤炭龟', '坚果哑铃', '霸王花', '大针蜂', '雷电云', '大嘴鸥'];
CORES.forEach(nm => {
  const c = byZh(nm); if (!c) { console.log('■' + nm + ' 未找到'); return }
  try { ctx.selectCore(c.id) } catch (e) { console.log('■' + nm + ' THREW ' + e.message); return }
  const raw = reg.get('coreOut').innerHTML || ''; const t = strip(raw);
  const undef = (t.match(/undefined/g) || []).length;
  const ban = /已排除|硬排除|体系互斥/.test(t);
  console.log('■' + c.zh + '#' + c.id + ' 字' + t.length + ' undefined=' + undef + ' 负向文案=' + (ban ? '有!' : '无'));
  // 每个「道具：」行 → 归属成员 + 主推
  let i = 0, rows = [];
  while ((i = t.indexOf('道具：', i)) > -1) {
    const back = t.slice(Math.max(0, i - 1200), i); const mm = back.match(/#(\d+)/g); const owner = mm ? mm[mm.length - 1] : '?';
    const fwd = t.slice(i, i + 150); const star = (fwd.match(/⭐([^\s]+)/) || [])[1] || '—';
    const alt = (fwd.match(/⭐[^\s]+ ([^\s]+) 备选/) || [])[1] || '';
    rows.push(owner + ':' + star + (alt ? '/' + alt : ''));
    i += 3;
  }
  console.log('   道具行×' + rows.length + ' → ' + rows.join(' | '));
  if (undef) { const k = t.indexOf('undefined'); console.log('   undefined 语境: …' + t.slice(Math.max(0, k - 70), k + 30) + '…') }
});
console.log('===== Part C 速度线/代价/窗口（定向） =====');
[[1677, '输出'], [1677, '控速'], [15, '输出'], [324, '天气'], [192, '天气'], [3, '输出'], [411, '肉盾']].forEach(kv => {
  const s = f1(kv[0]); if (!s) return;
  let r = 'ERR'; try { r = (ctx.itemDecide(s, ctx.coreSide(s), kv[1]) || []).map(e => e.zh + '(' + String(e.why || '').slice(0, 90) + ')').join(' ‖ ') } catch (e) { r = 'ERR:' + e.message }
  console.log('  ' + s.zh + '#' + s.id + ' 速' + (s.stats ? s.stats.spe : '?') + ' tag=' + kv[1] + ' → ' + r);
});
