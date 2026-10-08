/* v4.6 口径修正复验：①队伍真值按前缀比对（道具名带英文后缀）②方案卡 why 结构实际形态
   用法: node probe_v46n.cjs <html路径> <sav路径> */
'use strict';
const fs = require('fs'); const vm = require('vm');
const HTML = process.argv[2], SAV = process.argv[3];
const html = fs.readFileSync(HTML, 'utf8');
const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi; let m, parts = [];
while ((m = re.exec(html)) !== null) { if (/\bsrc\s*=/i.test(m[1] || '')) continue; parts.push(m[2]) }
function mkEl(tag) {
  return { _tag: (tag || 'div').toLowerCase(), children: [], style: {}, dataset: {}, value: '', checked: false, innerHTML: '', textContent: '', className: '', id: '',
    classList: { _s: new Set(), add() { for (const c of arguments) this._s.add(c) }, remove() { for (const c of arguments) this._s.delete(c) }, toggle(c, f) { if (f === undefined) f = !this._s.has(c); f ? this._s.add(c) : this._s.delete(c); return f }, contains(c) { return this._s.has(c) } },
    appendChild(c) { this.children.push(c); return c }, removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c }, insertBefore(c) { this.children.push(c); return c },
    querySelector() { return mkEl('div') }, querySelectorAll() { return [] }, setAttribute(k, v) { this['a_' + k] = v }, getAttribute(k) { return this['a_' + k] === undefined ? null : this['a_' + k] }, removeAttribute() { },
    addEventListener() { }, removeEventListener() { }, focus() { }, blur() { }, click() { }, remove() { }, insertAdjacentHTML() { }, scrollIntoView() { }, getBoundingClientRect() { return { top: 0, left: 0, width: 0, height: 0 } }, closest() { return null }, contains() { return false }, replaceWith() { }, after() { }, before() { } };
}
const reg = new Map(); const getEl = (id) => { if (!reg.has(id)) { const e = mkEl('div'); e.id = id; reg.set(id, e) } return reg.get(id) };
const doc = { getElementById: getEl, createElement: (t) => mkEl(t), createTextNode: (t) => ({ textContent: t, innerHTML: t }), querySelector: () => mkEl('div'), querySelectorAll: () => [], addEventListener() { }, body: mkEl('body'), documentElement: mkEl('html'), head: mkEl('head'), execCommand() { }, createDocumentFragment: () => mkEl('frag') };
const ctx = { console, document: doc, alert() { }, setTimeout, clearTimeout, setInterval: () => 0, clearInterval() { }, JSON, Math, Date, Object, Array, String, Number, Boolean, RegExp, Error, Map, Set, isFinite, isNaN, parseInt, parseFloat, encodeURIComponent, decodeURIComponent, Blob: function () { }, FileReader: function () { }, URL: { createObjectURL() { return '' }, revokeObjectURL() { } }, navigator: { userAgent: 'node' }, location: { hash: '', href: '' } };
ctx.window = ctx; ctx.globalThis = ctx; ctx.window.addEventListener = function () { }; ctx.window.innerHeight = 900; ctx.addEventListener = function () { };
vm.createContext(ctx);
try { vm.runInContext(parts.join('\n;\n'), ctx, { filename: 'x.js' }) } catch (e) { console.log('加载异常 ' + e.message) }
const P = (s) => console.log(s);
let pass = 0, fail = 0; const A = (id, d, c, n) => { c ? pass++ : fail++; P('   [' + (c ? 'PASS' : 'FAIL') + '] ' + id + ' ' + d + (n ? ' | ' + String(n).slice(0, 200) : '')) };

P('== B4 修正口径：道具按「中文名前缀」比对（解析输出现含英文后缀）==');
const res = ctx.parseSavBytes(new Uint8Array(fs.readFileSync(SAV)));
ctx.SAV_ROWS = res.rows; ctx.renderMyPool();
const truth = [[2232, '黑色污泥', ['自我再生', '守住', '大地神力', '毒千针'], [5, 10, 10, 15]], [598, '吃剩的东西', null, null], [2667, '湿润岩石', null, null], [1677, '无', null, null], [249, '文柚果', null, null], [882, '讲究围巾', ['龙之牙', '咬碎', '砂之牙', '鳃咬'], null]];
res.party.forEach((r, i) => {
  const t = truth[i]; if (!t) return;
  const idOk = String(r.图鉴编号) === String(t[0]);
  const itOk = String(r.道具 || '') === t[1] || String(r.道具 || '').indexOf(t[1] + '(') === 0;
  let mvOk = true, ppOk = true;
  if (t[2]) { const mv = [r.招式1, r.招式2, r.招式3, r['招式4(末招)']].map(x => String(x || '').replace(/\(id=\d+\)$/, '')); mvOk = mv.join(',') === t[2].join(',') }
  if (t[3]) { ppOk = [r.PP1, r.PP2, r.PP3, r.PP4].map(Number).join(',') === t[3].join(',') }
  A('B4-' + (i + 1), '队伍#' + (i + 1) + ' #' + t[0] + ' 编号/道具' + (t[2] ? '/招式' : '') + (t[3] ? '/PP' : ''), idOk && itOk && mvOk && ppOk, 'id=' + r.图鉴编号 + ' item=' + r.道具 + (t[3] ? ' pp=' + [r.PP1, r.PP2, r.PP3, r.PP4].join('|') : ''));
});

P('\n== B16 修正口径：方案卡 why 结构实际形态 ==');
ctx.myCoreTeam('2232');
const out = getEl('myTeamOut').innerHTML;
['能打什么', '代价', '原则', '敌人', '威胁', '为什么', 'whylist', 'class="why"', '原则P', '原则 P'].forEach(t => P('   ' + t.padEnd(12) + ' = ' + (out.split(t).length - 1)));
const whys = out.match(/<div class="why"[^>]*>[\s\S]{0,300}?<\/div>/g) || out.match(/<div class="whylist"[^>]*>[\s\S]{0,300}?<\/div>/g) || [];
P('   why/whylist 块数 = ' + whys.length);
whys.slice(0, 3).forEach((w, i) => P('   样本' + (i + 1) + ' → ' + w.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 260)));
const txt = out.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
const pi = txt.indexOf('原则');
P('   文本中「原则」上下文 → ' + (pi > -1 ? txt.slice(Math.max(0, pi - 160), pi + 160) : '(未出现)'));
const di = txt.indexOf('代价');
P('   文本中「代价」上下文 → ' + (di > -1 ? txt.slice(Math.max(0, di - 140), di + 140) : '(未出现)'));
P('\n== 方案卡结构计数 ==');
['needcard', 'slotbody', '体系总览', '需求驱动', '零硬门', '候选池', '道具', '性格', '配招'].forEach(t => P('   ' + t.padEnd(10) + ' = ' + (out.split(t).length - 1)));
P('\n==== 口径修正复验小结 ====');
P('PASS=' + pass + ' FAIL=' + fail);
