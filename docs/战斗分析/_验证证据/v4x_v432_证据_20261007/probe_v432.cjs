/* v4.3.2 奇石权衡模型专项（Node 降级路径，bu 弃用） Z0–Z6 */
'use strict';
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync(process.argv[2], 'utf8');
const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi; let m, parts = [];
while ((m = re.exec(html)) !== null) { if (/\bsrc\s*=/i.test(m[1] || '')) continue; parts.push(m[2]); }
function mkEl(t) {
  return {
    _tag: (t || 'div').toLowerCase(), children: [], style: {}, dataset: {}, value: '', checked: false, innerHTML: '', textContent: '', className: '', id: '',
    classList: { _s: new Set(), add() { for (const c of arguments) this._s.add(c) }, remove() { for (const c of arguments) this._s.delete(c) }, toggle(c, f) { if (f === undefined) f = !this._s.has(c); f ? this._s.add(c) : this._s.delete(c); return f }, contains(c) { return this._s.has(c) } },
    appendChild(c) { this.children.push(c); this.innerHTML += (c && c.innerHTML !== undefined ? c.innerHTML : ''); return c },
    removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c },
    insertBefore(c) { this.children.push(c); this.innerHTML += (c && c.innerHTML !== undefined ? c.innerHTML : ''); return c },
    querySelector: () => mkEl('div'), querySelectorAll: () => [],
    setAttribute(k, v) { this['a_' + k] = v }, getAttribute(k) { return this['a_' + k] === undefined ? null : this['a_' + k] },
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
ctx.window = ctx; ctx.globalThis = ctx; ctx.window.addEventListener = function () { }; ctx.window.innerHeight = 900; ctx.window.scrollY = 0; ctx.addEventListener = function () { };
vm.createContext(ctx);
let err = null; try { vm.runInContext(parts.join('\n;\n'), ctx, { filename: 'html_script.js' }) } catch (e) { err = e }
const R = []; const A = (id, ok, d) => R.push({ id, ok: !!ok, detail: d || '' });
A('Z0-load', !err, err ? err.message : 'ok');
const SP = (ctx.ERDATA && ctx.ERDATA.species) || [];
const byId = id => SP.find(x => String(x.id) === String(id));
const T = s => { try { return ctx.evioTrade(s) } catch (e) { return 'ERR:' + e.message } };
const fmt = t => t && t.pass !== undefined ? ('pass=' + t.pass + ',S=' + t.S + ',d=' + JSON.stringify(t.d) + ',bulkE=' + t.bulkE + ',fam=' + t.fam + ',itemB=' + t.itemB + ',A.bulk=' + (t.A && t.A.bulk) + ',B.bulk=' + (t.B && t.B.bulk)) : String(t);

/* Z1 模型与权重存在性 */
const fns = ['evioTrade', 'evioVeto', 'evioAdv', 'evioOk', 'evioWhy', 'poolOK', 'effBulkOf', 'relDiff', 'famFinalOf', 'itemGainOf', 'spdFit'];
const miss = fns.filter(k => typeof ctx[k] !== 'function');
const E = ctx.EVIO || {};
A('Z1-tradeModel', miss.length === 0 && E.TRADE_MIN === 0.12 && E.TW && E.TW.bulk === 1 && E.TW.out === 0.9 && E.TW.spd === 0.7 && E.TW.util === 0.5,
  '缺函数=' + JSON.stringify(miss) + ' TRADE_MIN=' + E.TRADE_MIN + ' TW=' + JSON.stringify(E.TW) + ' BULK_MULT=' + E.BULK_MULT + ' SPD_SLOW_LEVEL=' + E.SPD_SLOW_LEVEL);

/* Z2 三个定案物种（用户铁证） */
const S113 = byId(113), S356 = byId(356), S324 = byId(324);
const t113 = T(S113), t356 = T(S356), t324 = T(S324);
A('Z2a-K113-veto', S113 && t113 && t113.pass === false && /反超/.test(t113.why) && /不推荐/.test(t113.why) && ctx.evioOk(S113) === false && !!ctx.evioVeto(S113),
  '吉利蛋#' + (S113 && S113.id) + ' ' + fmt(t113) + ' || why=' + (t113 && t113.why || ''));
A('Z2b-K356-veto', S356 && t356 && t356.pass === false && /反超/.test(t356.why),
  '彷徨夜灵#' + (S356 && S356.id) + ' ' + fmt(t356) + ' || why=' + (t356 && t356.why || ''));
A('Z2c-K324-pass', S324 && t324 && t324.pass === true && t324.A.bulk > t324.B.bulk && /奇石更优/.test(t324.why),
  '煤炭龟#' + (S324 && S324.id) + ' ' + fmt(t324) + ' || why=' + (t324 && t324.why || ''));

/* Z3 全池：入选者双门 + 否决原因分布 */
let pass = 0, viol = [], veto = 0, vetoSpdOut = 0, vetoUtil = 0, vetoBulkNoGain = 0, nullT = 0, passFam = 0, passAbs = 0, violAbs = [];
SP.forEach(s => {
  const t = T(s); if (t === null || typeof t === 'string') { if (t === null) nullT++; return }
  if (t.pass) {
    pass++;
    if (t.d) { passFam++; if (!(t.d.bulk > 0 && t.S >= E.TRADE_MIN)) viol.push(s.id + '(' + JSON.stringify(t.d) + ',S=' + t.S + ')'); }
    else { passAbs++; if (!(t.bulkE >= E.BULK_MIN && t.atk >= E.ATK_MIN)) violAbs.push(s.id + '(bulkE=' + t.bulkE + ',atk=' + t.atk + ')'); }
  }
  else { veto++; if (t.d && t.d.spe < 0 && t.d.out < 0) vetoSpdOut++; if (t.d && t.d.util < 0) vetoUtil++; if (t.d && t.d.bulk <= 0) vetoBulkNoGain++; }
});
A('Z3a-doubleGate', pass >= 1 && viol.length === 0 && violAbs.length === 0,
  '入选=' + pass + '（家族权衡分支=' + passFam + ' / 绝对阈值兜底分支=' + passAbs + '）违规=' + viol.length + ' ' + JSON.stringify(viol.slice(0, 3)) + ' 兜底违规=' + violAbs.length + ' ' + JSON.stringify(violAbs.slice(0, 3)));
A('Z3b-vetoCases', vetoSpdOut >= 1 && veto >= 1,
  '否决总数=' + veto + '｜速度+输出双落后=' + vetoSpdOut + '（实施方报 347）｜功能(util)落后=' + vetoUtil + '｜耐久无增益(d_bulk≤0)=' + vetoBulkNoGain + '｜终态无家族记录(null)=' + nullT);

/* Z4 UI 渲染面：否决版权衡文案 / 负向残留文案 */
const tpls = (() => { try { const r = ctx.tplAll(); return Array.isArray(r) ? r : [] } catch (e) { return [] } })();
const rn = Object.keys(ctx).filter(k => /^render/i.test(k) && typeof ctx[k] === 'function');
rn.forEach(n => { try { ctx[n]() } catch (e) { } ; try { ctx[n](byId(1)) } catch (e) { } ; try { ctx[n]({}) } catch (e) { } });
tpls.forEach((t, i) => { try { ctx.renderTplBody(i) } catch (e) { } });
const dom = [...reg.values()].map(e => e.innerHTML || '').join('\n');
const cnt = s => (dom.match(new RegExp(s, 'g')) || []).length;
A('Z4a-vetoWhyInUI', cnt('反超') >= 1, '渲染面(rn=' + rn.length + ',tpl=' + tpls.length + ',chars=' + dom.length + ')：「反超」=' + cnt('反超') + ' 「进化型凭道具」=' + cnt('进化型凭道具') + ' 「未过门」=' + cnt('未过门'));
A('Z4b-noNegText', cnt('硬排除') === 0 && cnt('已排除') === 0 && cnt('体系互斥') === 0, '负向残留：硬排除=' + cnt('硬排除') + ' 已排除=' + cnt('已排除') + ' 体系互斥=' + cnt('体系互斥') + '｜对照 进化奇石=' + cnt('进化奇石'));
/* Z5 静态可达性：evioVeto/evioWhy 的 UI 调用点
   口径校准：`evioVeto(` 全 JS 出现 2 次 = 1 处注释（L3107 文档块）+ 1 处定义（L3183）；`evioWhy(` 1 次 = 仅定义
   → UI 调用点均为 0（判定依据：出现数 - 1 注释 - 1 定义） */
const jsAll = parts.join('\n;\n');
const occ = s => (jsAll.split(s).length - 1);
A('Z5-evioVetoReach', occ('evioVeto(') === 2 && occ('evioWhy(') === 1,
  '源码出现：evioVeto( =' + occ('evioVeto(') + '（注释1+定义1 → UI 调用点 0）｜evioWhy( =' + occ('evioWhy(') + '（仅定义 → UI 调用点 0）｜evioAdv( =' + occ('evioAdv(') + '｜渲染面「奇石加成后耐久」=' + cnt('奇石加成后耐久') + '「奇石更优」=' + cnt('奇石更优') + '「反超」=' + cnt('反超'));
const vet = ctx.evioVeto(S113);
console.log('==== v4.3.2 奇石权衡模型专项 ====');
R.forEach(x => console.log((x.ok ? 'PASS ' : 'FAIL ') + x.id + ' | ' + String(x.detail).slice(0, 900)));
console.log('total=' + R.length + ' PASS=' + R.filter(x => x.ok).length + ' FAIL=' + R.filter(x => !x.ok).length);
console.log('SAMPLE-veto-why=' + (vet && vet.why));
const s1 = SP.filter(s => { const t = T(s); return t && t.pass === false && t.d && t.d.spe < 0 && t.d.out < 0 }).slice(0, 3);
console.log('SAMPLE-veto-spd/out=' + s1.map(s => s.zh + '#' + s.id + ' ' + JSON.stringify(T(s).d)).join(' | '));
