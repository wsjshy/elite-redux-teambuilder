/* 裁决1 影响面分类：changed 中「有豁免文案」vs「无豁免文案但配招变化」二类，后者逐例列出（间接效应核查） */
const fs = require('fs'), vm = require('vm');
const ER = 'D:\\game\\elite-redux\\';
const OLD = ER + 'docs\\战斗分析\\_验证证据\\_chk_script_1.js', NEW = ER + '_chk_script_1.js';
function mkEl(id) {
  const el = {
    id: id || '', _html: '', children: [], style: {}, dataset: {}, value: '', checked: false,
    textContent: '', className: '', hidden: false, files: null, title: '',
    classList: { _s: {}, add(n) { this._s[n] = 1 }, remove(n) { delete this._s[n] }, toggle(n) { this._s[n] = this._s[n] ? 0 : 1 }, contains(n) { return !!this._s[n] } },
    appendChild(c) { this.children.push(c); return c }, removeChild() { },
    querySelector() { return mkEl('') }, querySelectorAll() { return [] },
    addEventListener() { }, removeEventListener() { }, click() { }, focus() { }, select() { }, closest() { return null }
  };
  Object.defineProperty(el, 'innerHTML', { get: () => el._html, set: v => { el._html = String(v) } });
  return el;
}
function boot(p) {
  const script = fs.readFileSync(p, 'utf8'), registry = {};
  const doc = { getElementById: id => (registry[id] || (registry[id] = mkEl(id))), createElement: () => mkEl(''), body: mkEl('body'), querySelector: () => null, querySelectorAll: () => [], addEventListener() { }, execCommand() { return true } };
  const sb = {
    console: { log() { }, error() { }, warn() { } }, setTimeout, clearTimeout, setInterval, clearInterval,
    Math, Date, JSON, Object, Array, String, Number, Boolean, RegExp, Error, document: doc, alert() { },
    window: {}, navigator: { userAgent: 'node' }, location: { href: 'file:///x.html' },
    Uint8Array, Uint16Array, Uint32Array, DataView, ArrayBuffer, TextDecoder, TextEncoder,
    Blob: function () { }, URL: { createObjectURL() { return 'blob:x' }, revokeObjectURL() { } },
    FileReader: function () { }, localStorage: { getItem: () => null, setItem() { } }
  };
  sb.window = sb; sb.globalThis = sb; sb.addEventListener = function () { }; sb.removeEventListener = function () { };
  sb.scrollTo = function () { }; sb.innerHeight = 800; sb.scrollY = 0; sb.getComputedStyle = function () { return {} };
  vm.createContext(sb); vm.runInContext(script, sb, { timeout: 900000 }); return sb;
}
const A = boot(OLD), B = boot(NEW);
const nonFinal = new Set(B.ERDATA.nonFinal.map(String));
const pool = B.ERDATA.species.filter(s => !nonFinal.has(String(s.id)) && (s.base || []).some(x => x > 0) && s.t1 !== '-');
const mvN = id => (B.MV[id] ? B.MV[id][1] : '#' + id);
function sig(sb, sp) {
  try { return (sb.genBuilds(sp) || []).map(b => (b.name || '?') + '|' + (b.mv.main ? b.mv.main.map(x => x.id).join('/') : '')).join(' && ') } catch (e) { return 'ERR' }
}
function hit(sb, sp) {
  try {
    let h = 0; (sb.genBuilds(sp) || []).forEach(b => b.mv.main.forEach(x => { if ((x.why || []).join(' ').indexOf('豁免无目标保守降权') > -1) h++ }));
    return h;
  } catch (e) { return -1 }
}
let withNote = 0, withoutNote = 0, unchangedWithNote = 0; const wo = [];
pool.forEach(sp => {
  const a = A.ERDATA.species.filter(x => '' + x.id === '' + sp.id)[0]; if (!a) return;
  const sa = sig(A, a), sb2 = sig(B, sp);
  if (/^ERR/.test(sa) || /^ERR/.test(sb2)) return;
  const h = hit(B, sp), ch = sa !== sb2;
  if (ch && h > 0) withNote++;
  else if (ch && h === 0) { withoutNote++; if (wo.length < 10) wo.push({ zh: sp.zh, id: '' + sp.id, before: sa, after: sb2 }); }
  else if (!ch && h > 0) unchangedWithNote++;
});
console.log('pool=' + pool.length);
console.log('变化且有豁免文案 = ' + withNote);
console.log('变化但无豁免文案（间接/无关效应核查）= ' + withoutNote);
console.log('未变化但有豁免文案（仅 why 文案新增）= ' + unchangedWithNote);
wo.forEach(s => console.log('  [无文案] ' + s.zh + '(' + s.id + ')\n    旧: ' + s.before + '\n    新: ' + s.after));
