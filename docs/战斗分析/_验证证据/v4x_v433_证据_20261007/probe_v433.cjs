/* v4.3.3 道具推荐多样化专项（Node 降级路径） Z0–Z4 + 抽检数据源 */
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
const f1 = id => SP.find(x => String(x.id) === String(id));
const byZh = n => SP.find(x => x.zh === n);
const strip = s => String(s || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const side = s => { try { return ctx.coreSide(s) } catch (e) { return '物理' } };
const BI = (s, tag, sd) => { try { return ctx.buildItem(s, sd || side(s), tag) || [] } catch (e) { return 'ERR:' + e.message } };
const top = (s, tag, sd) => { const r = BI(s, tag, sd); return Array.isArray(r) && r[0] ? r[0][0] : String(r) };
const has = (s, tag, name, sd) => { const r = BI(s, tag, sd); return Array.isArray(r) && r.some(x => x[0] === name) };

/* Z1 ITEM_POOL 规模与分组 */
const IP = ctx.ITEM_POOL || [];
const cls = {}; IP.forEach(p => { cls[p.cls] = (cls[p.cls] || 0) + 1 });
const badField = IP.filter(p => (!p.id && !p.dynamic) || !p.zh || !p.cls || !p.gain || !p.roles || !p.why);
A('Z1-itemPool', IP.length >= 40 && Object.keys(cls).length >= 8 && badField.length === 0,
  '项数=' + IP.length + '（含动态属性宝石 ' + (IP.filter(p => p.dynamic).length) + ' 项，映射 18 枚宝石）｜类别=' + Object.keys(cls).length + ' 类 ' + JSON.stringify(cls) + '｜字段缺失=' + badField.length +
  '｜WX_ROCK=' + JSON.stringify(ctx.WX_ROCK) + '｜TERRAIN_SEED=' + JSON.stringify(ctx.TERRAIN_SEED));

/* Z2 场景化道具（API 主推） */
const wxCases = [];
['晴', '雨', '沙', '雪'].forEach(w => {
  const rock = (ctx.WX_ROCK || {})[w];
  const s = SP.find(x => { try { return (ctx.itemSysOf(x) || []).indexOf(w) > -1 && ctx.isSetterAny(x) } catch (e) { return false } });
  if (!s) { wxCases.push(w + ':无设置手'); return }
  const r = BI(s, '天气', side(s));
  const names = Array.isArray(r) ? r.map(x => x[0]) : [String(r)];
  wxCases.push(w + '→' + (s.zh || s.id) + '#' + s.id + ':' + names.join('>') + (names.indexOf(rock) === 0 ? '[主推✓]' : (names.indexOf(rock) > 0 ? '[备选✓]' : '[缺✗]')));
});
const wxOk = wxCases.every(x => x.indexOf('✓]') > -1);
A('Z2a-weatherRocks', wxOk, wxCases.join(' ｜ '));
const terrS = SP.find(x => { try { return (ctx.itemSysOf(x) || []).some(y => (ctx.TERR_SYS || []).indexOf(y) > -1) } catch (e) { return false } });
A('Z2b-terrainClay', !!terrS && has(terrS, '场地', '光之黏土'), (terrS ? terrS.zh + '#' + terrS.id : '?') + ' 场地手→' + JSON.stringify((BI(terrS, '场地')).map(x => x[0])));
const t411 = f1(411);
A('Z2c-shieldItems', !!t411 && top(t411, '受队') === '剩饭' && has(t411, '受队', '凸凸头盔'), '护城龙#411 受队→' + JSON.stringify(BI(t411, '受队').map(x => x[0])));
const poison = SP.find(x => (x.t1 === '毒' || x.t2 === '毒') && x.base && x.base[0] >= 60);
A('Z2d-slitItem', !!poison && top(poison, '肉盾') === '黑色污泥', (poison ? poison.zh + '#' + poison.id : '?') + ' 肉盾→' + JSON.stringify(BI(poison, '肉盾').map(x => x[0])));
const fast = SP.find(x => x.base && x.base[5] >= 110 && x.base[1] >= x.base[3]);
A('Z2e-outItem', !!fast && top(fast, '输出') === '生命宝珠', (fast ? fast.zh + '#' + fast.id + '(速' + fast.base[5] + ')' : '?') + ' 输出→' + JSON.stringify(BI(fast, '输出').map(x => x[0])));
const midP = SP.find(x => x.base && x.base[5] >= 60 && x.base[5] < 110 && x.base[1] > x.base[3]);
const midS = SP.find(x => x.base && x.base[5] >= 60 && x.base[5] < 110 && x.base[3] > x.base[1]);
A('Z2f-choiceItems', !!midP && has(midP, '输出', '讲究头带') && !!midS && has(midS, '输出', '讲究眼镜'),
  (midP ? midP.zh + '（物）→' + JSON.stringify(BI(midP, '输出').map(x => x[0])) : '?') + ' ｜ ' + (midS ? midS.zh + '（特）→' + JSON.stringify(BI(midS, '输出').map(x => x[0])) : '?'));
const any1 = SP.find(x => x.base && x.base[5] >= 60 && x.base[5] < 110);
A('Z2g-boostItem', !!any1 && top(any1, '强化') === '弱点保险', (any1 ? any1.zh : '?') + ' 强化→' + JSON.stringify(BI(any1, '强化').map(x => x[0])));
A('Z2h-scarfItem', !!any1 && top(any1, '游击') === '讲究围巾', (any1 ? any1.zh : '?') + ' 游击→' + JSON.stringify(BI(any1, '游击').map(x => x[0])));
/* v4.3.3：应当出现奇石的是**通过权衡的非最终形态**（动态取，不写死示例——妙蛙草在 v4.3.2 权衡后已否决） */
const evioPassers = SP.filter(x => { try { return !ctx.isFinalForm(x) && !!ctx.evioAdv(x) } catch (e) { return false } });
const s2 = evioPassers[0];
A('Z2i-evioliteNonFinal', !!s2 && top(s2, '输出') === '进化奇石',
  '通过权衡的非最终形态=' + evioPassers.length + ' 只｜取例 ' + (s2 ? s2.zh + '#' + s2.id : '?') + ' 输出→' + JSON.stringify((BI(s2, '输出') || []).map(x => x[0])) +
  '｜对照（已被权衡否决、不再推奇石）：妙蛙草#2→' + JSON.stringify((BI(f1(2), '输出') || []).map(x => x[0])) + ' evioAdv=' + (function () { try { return !!ctx.evioAdv(f1(2)) } catch (e) { return 'ERR' } })());
const t3 = f1(3);
const gemName = t3 ? '「' + t3.t1 + '」宝石' : '?';
A('Z2j-gemItem', !!t3 && has(t3, '增伤', gemName), (t3 ? t3.zh + '#' + t3.id + '(草)' : '?') + ' 增伤→' + JSON.stringify(BI(t3, '增伤').map(x => x[0])) + '｜期望 ' + gemName);
const tennis = (function () { try { return ctx.itemGemFor(f1(3)) } catch (e) { return 'ERR' } })();
const gsub = (function () { const r = BI(f1(3), '增伤'); return Array.isArray(r) ? r.some(x => /宝石/.test(String(x[0]))) : false })();
A('Z2k-gemSanity', gsub && t3 && (t3.t1 === '草' || t3.t2 === '草'), '宝石项=' + JSON.stringify(tennis) + '｜含宝石=' + gsub);

/* Z3 渲染面（真实 UI 出口：18 模板 body + 方案卡 + render* 函数） */
const tpls = (() => { try { const r = ctx.tplAll(); return Array.isArray(r) ? r : [] } catch (e) { return [] } })();
const rn = Object.keys(ctx).filter(k => /^render/i.test(k) && typeof ctx[k] === 'function');
rn.forEach(n => { try { ctx[n]() } catch (e) { } ; try { ctx[n](f1(3)) } catch (e) { } ; try { ctx[n]({}) } catch (e) { } });
tpls.forEach((t, i) => { try { ctx.renderTplBody(i) } catch (e) { } });
const CORES = [3, 411, 250, 6, 248, 324, 18].map(f1).filter(Boolean);
let planHtml = '';
CORES.forEach(c => { try { planHtml += (ctx.renderNeedPlan(c) || '') } catch (e) { } });
const dom = [...reg.values()].map(e => e.innerHTML || '').join('\n') + '\n' + planHtml;
const cnt = s => (dom.match(new RegExp(String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
const NEED = ['炽热岩石', '潮湿岩石', '光滑岩石', '冰冷岩石', '剩饭', '凸凸头盔', '黑色污泥', '生命宝珠', '讲究头带', '讲究眼镜', '讲究围巾', '弱点保险', '光之黏土', '进化奇石'];
const cnts = NEED.map(n => n + '=' + cnt(n));
A('Z3-renderSurface', NEED.every(n => cnt(n) >= 1), '渲染面 chars=' + dom.length + '（含 ' + CORES.length + ' 张方案卡）｜' + cnts.join(' '));

console.log('==== v4.3.3 道具多样化专项 ====');
R.forEach(x => console.log((x.ok ? 'PASS ' : 'FAIL ') + x.id + ' | ' + String(x.detail).slice(0, 1000)));
console.log('total=' + R.length + ' PASS=' + R.filter(x => x.ok).length + ' FAIL=' + R.filter(x => !x.ok).length);

/* Z4 抽检数据源（逐核心定格：画像/体系/需求/槽位四要素） */
console.log('==== CORE-DUMP ====');
CORES.forEach(c => {
  let plan = null, bs = null;
  try { plan = ctx.buildTeamByNeeds(c) } catch (e) { console.log('[' + c.zh + '#' + c.id + '] buildERR=' + e.message); return }
  try { bs = ctx.deriveBuilds(c, plan.team) } catch (e) { bs = [] }
  console.log('[' + c.zh + '#' + c.id + '] 体系=' + plan.sysKey + '|画像=' + (plan.prof ? plan.prof.role + '/' + plan.prof.side + '/力度' + plan.prof.power + '/速' + plan.prof.du.spd : '?') +
    '|需求=' + plan.needs.length + '|入队=' + plan.team.length + '|stop=' + plan.stopReason);
  console.log('  流派=' + (bs || []).map(b => b.name).join(' / '));
  console.log('  需求=' + plan.needs.map(n => n.label + '[' + n.status + (n.satisfiedBy && n.satisfiedBy.length ? ':' + n.satisfiedBy.join('+') : '') + ']').join(' ; ').slice(0, 700));
  plan.team.forEach(m => {
    const tag = m.need ? (function () { try { return ctx.itemTagOfNeed(m.need) } catch (e) { return '输出' } })() : '输出';
    const rt = m.need ? (function () { try { return ctx.roleTagOfNeed(m.need) } catch (e) { return '输出' } })() : '输出';
    let nb = ''; try { nb = strip(ctx.needBuildHtml(m.s, rt, tag)).slice(0, 300) } catch (e) { nb = 'ERR:' + e.message }
    let it = ''; try { it = BI(m.s, tag).map(x => x[0]).join('/') } catch (e) { it = 'ERR' }
    console.log('   → ' + (m.core ? '[核心]' : (m.need ? m.need.label : '-')) + ' | ' + m.s.zh + '#' + m.s.id + ' | 道具=' + it + ' | ' + nb);
  });
});
