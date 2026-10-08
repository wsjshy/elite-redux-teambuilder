/* 裁决1（本系 STAB 豁免无目标 ×0.7）影响面：旧构建 vs 新构建逐只 genBuilds 对比
   用法：node _diff_stab.js > _diff_stab_log.txt     （结果 JSON 落 _diff_stab_out.txt） */
const fs = require('fs'), vm = require('vm');
const ER = 'D:\\game\\elite-redux\\';
const OLD = ER + 'docs\\战斗分析\\_验证证据\\_chk_script_1.js';   // 改动前归档脚本
const NEW = ER + '_chk_script_1.js';                                // 改动后提取脚本

function mkEl(id) {
  const el = {
    id: id || '', _html: '', children: [], style: {}, dataset: {}, value: '', checked: false,
    textContent: '', className: '', hidden: false, onclick: null, oninput: null, onchange: null,
    files: null, title: '',
    classList: { _s: {}, add(n) { this._s[n] = 1 }, remove(n) { delete this._s[n] }, toggle(n) { this._s[n] = this._s[n] ? 0 : 1 }, contains(n) { return !!this._s[n] } },
    appendChild(c) { this.children.push(c); return c }, removeChild() { },
    querySelector() { return mkEl('') }, querySelectorAll() { return [] },
    addEventListener() { }, removeEventListener() { }, click() { }, focus() { }, select() { }, closest() { return null }
  };
  Object.defineProperty(el, 'innerHTML', { get: () => el._html, set: v => { el._html = String(v) } });
  return el;
}
function boot(p) {
  const script = fs.readFileSync(p, 'utf8');
  const registry = {};
  const doc = {
    getElementById: id => (registry[id] || (registry[id] = mkEl(id))), createElement: () => mkEl(''), body: mkEl('body'),
    querySelector: () => null, querySelectorAll: () => [], addEventListener() { }, execCommand() { return true }
  };
  const sb = {
    console: { log() { }, error() { }, warn() { } }, setTimeout, clearTimeout, setInterval, clearInterval,
    Math, Date, JSON, Object, Array, String, Number, Boolean, RegExp, Error,
    document: doc, alert() { }, window: {}, navigator: { userAgent: 'node' }, location: { href: 'file:///x.html' },
    Uint8Array, Uint16Array, Uint32Array, DataView, ArrayBuffer, TextDecoder, TextEncoder,
    Blob: function () { }, URL: { createObjectURL() { return 'blob:x' }, revokeObjectURL() { } },
    FileReader: function () { }, localStorage: { getItem: () => null, setItem() { } }
  };
  sb.window = sb; sb.globalThis = sb; sb.addEventListener = function () { }; sb.removeEventListener = function () { };
  sb.scrollTo = function () { }; sb.innerHeight = 800; sb.scrollY = 0; sb.getComputedStyle = function () { return {} };
  vm.createContext(sb);
  vm.runInContext(script, sb, { timeout: 900000 });
  return sb;
}
const A = boot(OLD), B = boot(NEW);
const nonFinal = new Set(B.ERDATA.nonFinal.map(String));
const pool = B.ERDATA.species.filter(s => !nonFinal.has(String(s.id)) && (s.base || []).some(x => x > 0) && s.t1 !== '-');
const bById = {}; B.ERDATA.species.forEach(s => { bById['' + s.id] = s });
function sig(sb, sp) {
  try {
    const bs = sb.genBuilds(sp) || [];
    return bs.map(b => (b.name || '?') + '|' + (b.mv && b.mv.main ? b.mv.main.map(x => x.id).join('/') : '')).join(' && ');
  } catch (e) { return 'ERR:' + e.message }
}
function whyOf(sb, sp) {
  try {
    let hit = 0, tot = 0;
    (sb.genBuilds(sp) || []).forEach(b => (b.mv && b.mv.main ? b.mv.main : []).forEach(x => {
      tot++; const w = (x.why || []).join(' ');
      if (w.indexOf('豁免无目标保守降权') > -1) hit++;
    }));
    return { hit: hit, tot: tot };
  } catch (e) { return { hit: 0, tot: 0 } }
}
let changed = 0, same = 0, err = 0, exemptSpecies = 0, exemptSlots = 0, slots = 0;
const samples = [];
pool.forEach(sp => {
  const spA = A.ERDATA.species.filter(x => '' + x.id === '' + sp.id)[0];
  if (!spA) { err++; return; }
  const sa = sig(A, spA), sb2 = sig(B, sp);
  if (/^ERR/.test(sa) || /^ERR/.test(sb2)) { err++; return; }
  const w = whyOf(B, sp); slots += w.tot; exemptSlots += w.hit;
  if (w.hit > 0) exemptSpecies++;
  if (sa === sb2) same++; else {
    changed++;
    if (samples.length < 40) samples.push({ id: '' + sp.id, zh: sp.zh, before: sa, after: sb2 });
  }
});
const out = {
  pool: pool.length, changed: changed, same: same, err: err,
  exemptSpecies: exemptSpecies, exemptSlots: exemptSlots, totalSlots: slots, samples: samples
};
fs.writeFileSync(ER + '_diff_stab_out.txt', JSON.stringify(out, null, 1), 'utf8');
console.log('pool=' + pool.length + ' changed=' + changed + ' same=' + same + ' err=' + err);
console.log('豁免文案命中：' + exemptSpecies + ' 只 / 槽位 ' + exemptSlots + '/' + slots);
samples.slice(0, 12).forEach(s => console.log('  ' + s.zh + '(' + s.id + ')\n    旧: ' + s.before + '\n    新: ' + s.after));
