/* v4.3.3 内容合理性抽检证据源（Node 降级）：逐核心 → 需求 gate 自述 + 槽位四要素（道具/配招含属性与本系/特性/性格） */
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
console.log('load=' + (err ? 'ERR:' + err.message : 'ok'));
const SP = (ctx.ERDATA && ctx.ERDATA.species) || [];
const f1 = id => SP.find(x => String(x.id) === String(id));
const strip = s => String(s || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const MV = (ctx.ERDATA && ctx.ERDATA.moves) || [];
const TY = {}; MV.forEach(r => { if (r && r[1]) TY[r[1]] = r[3] });
const side = s => { try { return ctx.coreSide(s) } catch (e) { return '物理' } };
const BI = (s, tag, sd) => { try { return (ctx.buildItem(s, sd || side(s), tag) || []).map(x => x[0]).join('/') } catch (e) { return 'ERR' } };
const CORES = [3, 411, 250, 6, 324, 18].map(f1).filter(Boolean);
console.log('==== CORE-AUDIT ====');
CORES.forEach(c => {
  let plan = null, bs = [];
  try { plan = ctx.buildTeamByNeeds(c) } catch (e) { console.log('[' + c.zh + '] ERR ' + e.message); return }
  try { bs = ctx.deriveBuilds(c, plan.team) } catch (e) { bs = [] }
  console.log('■■ [' + c.zh + '#' + c.id + '] 属性=' + c.t1 + '/' + c.t2 + ' 体系=' + (plan.sysKey || '无') + ' 画像=' + (plan.prof ? plan.prof.role + '·' + plan.prof.side + '·力度' + plan.prof.power + '·速' + plan.prof.du.spd : '?') + ' 需求=' + plan.needs.length + ' 入队=' + plan.team.length + ' stop=' + plan.stopReason);
  console.log('   体系总览: 启动=' + strip(plan.overview.start).slice(0, 120) + ' | 受益=' + strip(plan.overview.benefit).slice(0, 120) + ' | 轮转=' + strip(plan.overview.rotate).slice(0, 120));
  console.log('   流派: ' + bs.map(b => b.name).join(' / '));
  plan.needs.forEach(n => {
    const pk = plan.pools[n.id];
    const t0 = pk && pk.list && pk.list[0];
    console.log('   ·' + n.label + ' [' + n.status + '] why=' + strip(n.why).slice(0, 90) + ' | 首选=' + (t0 ? t0.s.zh + '#' + t0.s.id + ' 分' + Math.round(t0.score * 10) / 10 + ' gate=' + strip(t0.gate) : (n.byCore ? '（核心自身）' : '（无）')) + (n.satisfiedBy && n.satisfiedBy.length ? ' | 入队=' + n.satisfiedBy.join('+') : ''));
  });
  plan.team.forEach(mm => {
    if (mm.core) return;
    const tag = (function () { try { return ctx.itemTagOfNeed(mm.need) } catch (e) { return '输出' } })();
    const rt = (function () { try { return ctx.roleTagOfNeed(mm.need) } catch (e) { return '输出' } })();
    let txt = ''; try { txt = strip(ctx.needBuildHtml(mm.s, rt, tag)) } catch (e) { txt = 'ERR' }
    const mvSeg = (txt.split('配招：')[1] || '').split('备选')[0].trim();
    const abSeg = (txt.split('特性：')[1] || '').split('道具：')[0].trim();
    const natSeg = (txt.split('性格：')[1] || '').trim();
    const withTy = mvSeg.split(/\s+/).filter(Boolean).map(nm => nm + '(' + (TY[nm] || '?') + (TY[nm] && (TY[nm] === mm.s.t1 || TY[nm] === mm.s.t2) ? '★本系' : '') + ')').join(' ');
    console.log('   → ' + mm.need.label + ' | ' + mm.s.zh + '#' + mm.s.id + '(' + mm.s.t1 + '/' + mm.s.t2 + ') gate=' + strip(mm.gate) + ' | 道具=' + BI(mm.s, tag) + ' | 配招=' + withTy + ' | 特性=' + abSeg + ' | 性格=' + natSeg);
  });
});
