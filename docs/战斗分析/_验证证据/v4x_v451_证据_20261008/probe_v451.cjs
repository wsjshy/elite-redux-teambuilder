/* v4.5.1 修复版收口复验：①流派卡道具≡队伍行(MISMATCH) ②凤王命名/强化流派可行性 ③盲点补招驱动 */
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
const SP = (ctx.ERDATA && ctx.ERDATA.species) || [], MV = ctx.MV || {};
const byZh = n => SP.find(x => String(x.zh || '').indexOf(n) > -1);
const strip = s => String(s || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
let R = []; const rec = (id, ok, msg) => R.push({ id, ok, msg });
const BROWS = ['妙蛙花', '护城龙', '凤王', '煤炭龟', '坚果哑铃', '霸王花', '大针蜂', '雷电云', '大嘴鸥'];
/* 渲染面抽取：流派卡主推（title 恰为「主推」）/ 成员行主推（title 以「主推：」开头） */
const cardMain = blk => { const i = blk.indexOf('gotoItem(&quot;'); let out = []; let s = blk; let p = 0; while ((p = s.indexOf(')" title="主推"', p)) > -1) { const st = s.lastIndexOf('gotoItem(&quot;', p); if (st > -1) out.push(s.slice(st + 15, s.indexOf('&quot;', st + 15))); p += 5 } return out };
const slotMain = slot => { const p = slot.indexOf('title="主推：'); if (p < 0) return '(无)'; const st = slot.lastIndexOf('gotoItem(&quot;', p); return st > -1 ? slot.slice(st + 15, slot.indexOf('&quot;', st + 15)) : '(无)' };
console.log('== A. v45-1：流派卡主推 ≡ 队伍行核心主推（MISMATCH） ==');
let MIS = [];
BROWS.forEach(nm => {
  const c = byZh(nm); if (!c) return;
  try { ctx.selectCore(c.id) } catch (e) { console.log(nm + ' THREW'); return }
  const raw = reg.get('coreOut').innerHTML || '';
  const cards = raw.split('<details class="big').slice(1);
  const cardItems = cards.map(b => cardMain(b)[0] || '(无)');
  let coreItem = '(未捕获)';
  raw.split('<div class="slotbody">').slice(1).forEach(sl => { const hd = sl.slice(0, 400); if (/badge">核心</.test(hd) && new RegExp('<' + 'b>' + c.zh).test(hd.replace(/<span[^>]*>/g, '')) || (hd.indexOf('<b>' + c.zh + '</b>') > -1 && hd.indexOf('核心') > -1)) { if (coreItem === '(未捕获)') coreItem = slotMain(sl) } });
  const bad = cardItems.filter(x => x !== coreItem && x !== '(无)');
  if (bad.length) MIS.push(c.zh + ' 流派卡' + JSON.stringify(cardItems) + ' vs 队伍行 ' + coreItem);
  console.log('  ' + c.zh + '：流派卡 ' + JSON.stringify(cardItems) + ' ｜队伍行核心 ⭐' + coreItem + (bad.length ? '  ← MISMATCH' : '  ✓'));
});
rec('A-道具一致性', MIS.length === 0, 'MISMATCH=' + MIS.length + (MIS.length ? '｜' + MIS.join(' || ') : ''));
console.log('== B. v45-2：凤王命名 + 全局「强化」流派必须含强化招 ==');
const KIND_BOOST = /剑舞|龙之舞|冥想|生长|破壳|诡计|健美|铁壁|巨大化|磨爪|蝶舞|咒语|集气|变圆|岩石打磨/;
BROWS.forEach(nm => {
  const c = byZh(nm); if (!c) return;
  let bs = []; try { bs = ctx.deriveBuilds(c) } catch (e) { }
  const names = bs.map(b => b.name);
  bs.forEach(b => {
    const mvs = (b.mv.main || []).map(sl => (MV[sl.id] || [])[1] || sl.id);
    const hasBoost = mvs.some(x => KIND_BOOST.test(x));
    const claim = /强化/.test(b.name) || b.roleTag === '强化';
    if (claim && !hasBoost) rec('B-' + c.zh + '-强化流派有强化招', false, '「' + b.name + '」roleTag=' + b.roleTag + ' 4 槽=' + mvs.join('/') + ' 无强化招');
    console.log('  ' + c.zh + ' 「' + b.name + '」roleTag=' + b.roleTag + ' 4 槽=' + mvs.join('/') + '｜含强化招=' + hasBoost);
  });
  if (!bs.some(b => true)) console.log('  ' + c.zh + ' deriveBuilds 空');
  if (nm === '凤王') rec('B-凤王-命名不含强化', !names.some(n => /强化/.test(n)), '流派名=' + JSON.stringify(names));
});
const allNames = []; BROWS.forEach(nm => { const c = byZh(nm); if (!c) return; try { ctx.deriveBuilds(c).forEach(b => allNames.push(b.name)) } catch (e) { } });
const banned = allNames.filter(n => /物攻流|特攻流|双刀流|均衡全能/.test(n));
rec('B-禁用词', banned.length === 0, '禁用词命中=' + banned.length + '｜共 ' + allNames.length + ' 个流派名');
console.log('  禁用词命中=' + banned.length + '｜流派名全集(' + allNames.length + ')=' + JSON.stringify(Array.from(new Set(allNames))));
console.log('== C. v45-3：盲点行 + 补招驱动披露 ==');
BROWS.forEach(nm => {
  const c = byZh(nm); if (!c) return;
  try { ctx.selectCore(c.id) } catch (e) { return }
  const raw = reg.get('coreOut').innerHTML || '';
  const bl = []; let p = -1; while ((p = raw.indexOf('盲点属性（4 招均 ≤0.5x）', p + 1)) > -1) bl.push(strip(raw.slice(p, p + 60)).slice(0, 30));
  const fix = []; let q = -1; while ((q = raw.indexOf('可换入', q + 1)) > -1) fix.push(strip(raw.slice(q, q + 90)));
  const fix2 = []; let r2 = -1; while ((r2 = raw.indexOf('双刀补盲', r2 + 1)) > -1) fix2.push(strip(raw.slice(r2, r2 + 80)));
  console.log('  ' + c.zh + '：盲点行 ' + bl.length + (bl.length ? ' → ' + bl.join(' | ') : '') + '｜换招披露 ' + fix.length + (fix.length ? ' → ' + fix[0] : '') + '｜双刀补盲 ' + fix2.length);
  if (nm === '妙蛙花') rec('C-妙蛙花-换招披露', fix.length > 0, fix.length ? fix[0] : '未见「可换入」类披露');
  if (nm === '霸王花') rec('C-霸王花-盲点消解', bl.length === 0, '盲点行=' + bl.length + (bl.length ? ' → ' + bl[0] : ''));
  if (nm === '坚果哑铃') rec('C-坚果哑铃-盲点消解', bl.length === 0, '盲点行=' + bl.length + (bl.length ? ' → ' + bl[0] : ''));
});
console.log('== D. 回归：使用率标注 / 控速位 ==');
BROWS.forEach(nm => {
  const c = byZh(nm); if (!c) return;
  try { ctx.selectCore(c.id) } catch (e) { return }
  const rb = strip((reg.get('ruleBoxCore') || {}).innerHTML || '');
  if (nm === '妙蛙花') rec('D-使用率标注', /威胁库使用率先验（v4\.5）/.test(rb) && /原版使用率 ≠ ER 使用率/.test(rb), 'ruleBoxCore 命中');
  const raw = reg.get('coreOut').innerHTML || '';
  let ctrl = 0; raw.split('<div class="slotbody">').slice(1).forEach(sl => { const bd = []; let p = -1; while ((p = sl.indexOf('<span class="badge">', p + 1)) > -1) bd.push(sl.slice(p + 20, sl.indexOf('</span>', p))); if (bd.some(b => /控速/.test(b))) ctrl++ });
  if (ctrl) console.log('  ' + c.zh + ' 控速位需求行 ' + ctrl + ' 条');
});
console.log('== 汇总 ==');
console.log('total=' + R.length + ' PASS=' + R.filter(x => x.ok).length + ' FAIL=' + R.filter(x => !x.ok).length);
R.forEach(x => console.log('  ' + (x.ok ? 'PASS ' : 'FAIL ') + x.id + ' | ' + x.msg));
