/* =========================================================================
   v4.3.1 独立复验 · 进化奇石（Eviolite）纠偏专项探针  [自建 / 不依赖实施方 verify]
   用法: node probe_v431.cjs <html路径>
   只读 HTML 产物与内嵌脚本（不读 build_tool_*.py）
   判定项:
     Y1 载入；Y2 奇石语义函数面（EVIO/evioBulk/evioAdv/evioOk/evioWhy/poolOK）
     Y3 ①最终形态（妙蛙花/喷火龙 等）道具推荐不含「进化奇石」
     Y4 ②奇石优势形态（吉利蛋/多边兽2型/煤炭龟#324/彷徨夜灵/属性：空）入选池 + 配装含奇石 + why
     Y5 ③可进化分支形态（结草儿等）识别为非最终
     Y6 ④盖欧卡/固拉多/烈空坐仍为最终形态、不享奇石
     Y7 ⑤模板道具「进化奇石」对最终形态的不适用提示存在
     Y8 候选池：finalPool 含奇石优势非最终形态（纠偏生效面）
   ========================================================================= */
'use strict';
const fs = require('fs'), vm = require('vm');
const HTML = process.argv[2];
const html = fs.readFileSync(HTML, 'utf8');
const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
let m, parts = [];
while ((m = re.exec(html)) !== null) { if (/\bsrc\s*=/i.test(m[1] || '')) continue; parts.push(m[2]); }
const js = parts.join('\n;\n');
function mkEl(tag) {
  const e = {
    _tag: (tag || 'div').toLowerCase(), children: [], style: {}, dataset: {},
    value: '', checked: false, innerHTML: '', textContent: '', className: '', id: '',
    classList: { _s: new Set(), add() { for (const c of arguments) this._s.add(c); }, remove() { for (const c of arguments) this._s.delete(c); }, toggle(c, f) { if (f === undefined) f = !this._s.has(c); f ? this._s.add(c) : this._s.delete(c); return f; }, contains(c) { return this._s.has(c); } },
    appendChild(c) { this.children.push(c); this.innerHTML += (c && c.innerHTML !== undefined ? c.innerHTML : ''); return c; },
    removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c; },
    insertBefore(c) { this.children.push(c); this.innerHTML += (c && c.innerHTML !== undefined ? c.innerHTML : ''); return c; },
    querySelector() { return mkEl('div'); }, querySelectorAll() { return []; },
    setAttribute(k, v) { this['a_' + k] = v; }, getAttribute(k) { return this['a_' + k] === undefined ? null : this['a_' + k]; },
    removeAttribute() {}, addEventListener() {}, removeEventListener() {},
    focus() {}, blur() {}, click() {}, remove() {}, insertAdjacentHTML(p, h) { this.innerHTML += (h || ''); },
    scrollIntoView() {}, getBoundingClientRect() { return { top: 0, left: 0, width: 0, height: 0 }; },
    closest() { return null; }, contains() { return false; }, replaceWith() {}, after() {}, before() {}
  };
  return e;
}
const registry = new Map();
function getEl(id) { if (!registry.has(id)) { const e = mkEl('div'); e.id = id; registry.set(id, e); } return registry.get(id); }
const documentStub = {
  getElementById: getEl, createElement: (t) => mkEl(t), createTextNode: (t) => ({ textContent: t, innerHTML: t }),
  querySelector: () => mkEl('div'), querySelectorAll: () => [], addEventListener() {}, removeEventListener() {},
  body: mkEl('body'), documentElement: mkEl('html'), head: mkEl('head'), execCommand() {}, createDocumentFragment: () => mkEl('frag')
};
const ctx = {
  console, document: documentStub, alert() {}, setTimeout, clearTimeout, setInterval: () => 0, clearInterval() {},
  JSON, Math, Date, Object, Array, String, Number, Boolean, RegExp, Error, Map, Set, isFinite, isNaN, parseInt, parseFloat,
  encodeURIComponent, decodeURIComponent,
  Blob: function () {}, FileReader: function () {}, URL: { createObjectURL() { return ''; }, revokeObjectURL() {} },
  navigator: { userAgent: 'node-v4verify' }, location: { hash: '', href: '' }
};
ctx.window = ctx; ctx.globalThis = ctx;
ctx.window.addEventListener = function () {}; ctx.window.innerHeight = 900; ctx.window.scrollY = 0; ctx.addEventListener = function () {};
vm.createContext(ctx);
let loadErr = null;
try { vm.runInContext(js, ctx, { filename: 'html_script.js' }); } catch (e) { loadErr = e; }

const R = [];
function A(id, ok, detail) { R.push({ id: id, ok: !!ok, detail: detail || '' }); }
const SP = (ctx.ERDATA && ctx.ERDATA.species) || [];
const byZh = z => SP.filter(s => s.zh === z)[0];
const byId = i => SP.filter(s => +s.id === +i)[0];
const ctxOf = (needle, span) => { const out = []; let p = -1; while ((p = js.indexOf(needle, p + 1)) > -1 && out.length < 6) out.push(js.slice(Math.max(0, p - (span || 70)), p + (span || 70)).replace(/\s+/g, ' ')); return out; };
A('Y0-load', !loadErr, loadErr ? ('加载异常: ' + loadErr.message) : ('物种=' + SP.length + ' 条目 进化奇石id=' + (((ctx.ERDATA.items || []).filter(x => /进化奇石|Eviolite/i.test(x[1] + '|' + x[2]))[0] || ['?'])[0])));

/* ---------- Y2 语义函数面 ---------- */
const evFn = ['evioBulk', 'evioAdv', 'evioOk', 'evioWhy', 'poolOK', 'isFinalForm', 'famFinalOf', 'buildItem'];
const missFn = evFn.filter(n => typeof ctx[n] !== 'function');
const EV = ctx.EVIO || {};
A('Y2-evioliteApi', missFn.length === 0 && EV.BULK_MULT === 1.5 && EV.BULK_MIN === 380 && EV.ATK_MIN === 85,
  '缺函数=' + JSON.stringify(missFn) + ' EVIO=' + JSON.stringify(EV));

const itemNames = (s, side, tag) => { try { return (ctx.buildItem(s, side || ctx.coreSide(s), tag || '输出') || []).map(x => x[0]) } catch (e) { return ['ERR:' + e.message] } };
const hasEvio = arr => arr.indexOf('进化奇石') > -1;

/* ---------- Y3 ①最终形态不得推荐奇石 ---------- */
const finals = ['妙蛙花', '喷火龙', '超梦', '班基拉斯', '暴飞龙', '甲贺忍蛙'].map(byZh).filter(Boolean);
const fRows = finals.map(s => s.zh + '[final=' + ctx.isFinalForm(s) + ',evioOk=' + ctx.evioOk(s) + ',item=' + itemNames(s).join('/') + ']');
const fBad = finals.filter(s => !ctx.isFinalForm(s) || ctx.evioOk(s) || hasEvio(itemNames(s)));
A('Y3-finalNoEviolite', finals.length >= 4 && fBad.length === 0, fRows.join(' | '));

/* ---------- Y4 ②奇石优势形态 ---------- */
const evioNames = ['吉利蛋', '多边兽2型', '煤炭龟', '彷徨夜灵', '属性：空'];
const evioRows = [], evioMiss = [];
evioNames.forEach(z => {
  const s = byZh(z);
  if (!s) { evioMiss.push(z + '(物种名未命中)'); return }
  const a = ctx.evioAdv(s), items = itemNames(s);
  const okAdv = !!a, okPool = !!ctx.poolOK(s), okItem = hasEvio(items);
  const okWhy = !!a && /奇石加成后耐久/.test(a.why) && /(同族最终形态|达站场阈值)/.test(a.why);
  if (!(okAdv && okPool && okItem && okWhy)) evioMiss.push(z + '(adv=' + okAdv + ',poolOK=' + okPool + ',item=' + okItem + ',why=' + okWhy + ')');
  evioRows.push(z + '#' + s.id + '[bulkE=' + (a ? a.bulkE : '-') + ',fam=' + (a ? (a.fam || '未收录') : '-') + ',ratio=' + (a ? a.ratio : '-') + ',item=' + items[0] + ',why=' + (a ? String(a.why).slice(0, 46) : '-') + ']');
});
A('Y4-evioliteForms', evioMiss.length === 0, '不达标=' + JSON.stringify(evioMiss) + ' || ' + evioRows.join(' | '));

/* ---------- Y5 ③分支形态识别为非最终 ---------- */
const branches = ['结草儿', '刺尾虫', '独角虫'].map(byZh).filter(Boolean);
const bRows = branches.map(s => s.zh + '#' + s.id + '[isFinalForm=' + ctx.isFinalForm(s) + ',isFinalSp=' + ctx.isFinalSp(s) + ',evioOk=' + ctx.evioOk(s) + ',poolOK=' + ctx.poolOK(s) + ',famFinal=' + (() => { try { const f = ctx.famFinalOf(s); return f ? f.zh : 'null' } catch (e) { return 'ERR' } })() + ']');
const bBad = branches.filter(s => ctx.isFinalForm(s) === true);
A('Y5-branchNotFinal', branches.length >= 2 && bBad.length === 0, bRows.join(' | '));

/* ---------- Y6 ④传说最终形态 ---------- */
const legends = ['盖欧卡', '固拉多', '烈空坐'].map(byZh).filter(Boolean);
const lRows = legends.map(s => s.zh + '[final=' + ctx.isFinalForm(s) + ',evioAdv=' + (ctx.evioAdv(s) ? '非null' : 'null') + ',item0=' + itemNames(s)[0] + ']');
const lBad = legends.filter(s => !ctx.isFinalForm(s) || ctx.evioAdv(s) || hasEvio(itemNames(s)));
A('Y6-legendsFinal', legends.length === 3 && lBad.length === 0, lRows.join(' | '));

/* ---------- Y7 ⑤模板道具「进化奇石」不适用提示 ---------- */
let rendered = '';
const rNames = Object.keys(ctx).filter(k => /^render/.test(k) && typeof ctx[k] === 'function');
rNames.forEach(n => { [0, 1, 2].forEach(k => { try { const o = k === 0 ? ctx[n]() : (k === 1 ? ctx[n](byZh('妙蛙花')) : ctx[n](byZh('妙蛙花'), {})); if (typeof o === 'string') rendered += o } catch (e) { } }) });
registry.forEach(e => { rendered += (e.innerHTML || '') + (e.textContent || '') });
const jsNote = ctxOf('不适用', 80);
const jsHint = ctxOf('仅非最终形态生效', 80);
const rendNot = (rendered.match(/不适用/g) || []).length;
const rendEvio = (rendered.match(/进化奇石/g) || []).length;
const rendCtx = (() => { const p = rendered.indexOf('不适用'); return p < 0 ? '' : rendered.slice(Math.max(0, p - 160), p + 120).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ') })();
A('Y7-tplEvioliteNote', jsNote.length > 0 && rendNot > 0,
  'JS 内「不适用」出现=' + jsNote.length + ' 次;「仅非最终形态生效」=' + jsHint.length + ' 次 | 渲染面 不适用=' + rendNot + ' 次、进化奇石=' + rendEvio + ' 次 | 渲染上下文=' + rendCtx.slice(0, 200));

/* ---------- Y8 候选池纠偏生效面 ---------- */
const pool = (() => { try { return ctx.finalPool() } catch (e) { return [] } })();
const evioInPool = pool.filter(s => !ctx.isFinalForm(s) && ctx.evioOk(s));
const evioSample = evioInPool.slice(0, 8).map(s => s.zh + '#' + s.id + ':' + itemNames(s)[0]);
A('Y8-poolIncludesEvio', pool.length > 800 && evioInPool.length >= 3,
  'finalPool=' + pool.length + ' 其中奇石优势非最终形态=' + evioInPool.length + ' | 例: ' + evioSample.join(', '));

/* ---------- 报告 ---------- */
console.log('==== v4.3.1 进化奇石纠偏专项 ====');
const pass = R.filter(x => x.ok).length;
R.forEach(x => console.log((x.ok ? 'PASS ' : 'FAIL ') + x.id + ' | ' + x.detail));
console.log('total=' + R.length + ' PASS=' + pass + ' FAIL=' + (R.length - pass));
console.log('==== FACTS ====');
console.log('不适用(JS 上下文)=' + JSON.stringify(jsNote.slice(0, 3)));
console.log('属性：空 是否存在=' + !!byZh('属性：空') + ' / 未命中名=' + JSON.stringify(evioNames.filter(z => !byZh(z))));
console.log('煤炭龟 famFinalOf=' + (() => { const t = byZh('煤炭龟'); const f = ctx.famFinalOf(t); return f ? f.zh + '#' + f.id + ' bulk=' + ctx.bulkOf(f) : 'null' })() + ' | finalOf存在=' + !!(ctx.ERDATA.finalOf) + ' familyRoot存在=' + !!(ctx.ERDATA.familyRoot));
console.log('奇石优势池前 12=' + JSON.stringify(evioInPool.slice(0, 12).map(s => s.zh + '#' + s.id + '(ratio' + ctx.evioAdv(s).ratio + ')')));
