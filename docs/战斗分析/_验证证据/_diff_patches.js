/* 本轮 3 补丁的「输出变化项」对比：在同一沙箱内切换 旧/新 口径，
   统计配招/评估输出发生变化的宝可梦，并给出样例列表（供交付报告 §1.13 / §1.14）。
   · 补丁 1（特性名解析统一）：旧口径 = ERDATA.abiAlias 清空（abiIdByZhOrEn 回退失效；
     abiTagOf/NM2ID 不受影响，故等价于修改前的「4 处 null 解析」状态）。
   · 补丁 2（无对手免疫降权 ×0.7）：旧口径 = IMMUNE_RISK 清空（等价于「仅警示、不加惩罚」）。 */
const fs = require('fs'), vm = require('vm');
const ER = 'D:\\game\\elite-redux\\';
const script = fs.readFileSync(ER + '_chk_script_1.js', 'utf8');

function mkEl(id) {
  const el = {
    id: id || '', _html: '', children: [], style: {}, dataset: {}, value: '', checked: false,
    textContent: '', className: '', hidden: false, onclick: null, oninput: null, onchange: null,
    files: null, title: '',
    classList: { _s: {}, add(n) { this._s[n] = 1 }, remove(n) { delete this._s[n] }, toggle(n) { this._s[n] = this._s[n] ? 0 : 1 }, contains(n) { return !!this._s[n] } },
    appendChild(c) { this.children.push(c); return c },
    removeChild() { }, querySelector() { return mkEl('') }, querySelectorAll() { return [] },
    addEventListener() { }, removeEventListener() { }, click() { }, focus() { }, select() { }, closest() { return null }
  };
  Object.defineProperty(el, 'innerHTML', { get: () => el._html, set: v => { el._html = String(v) } });
  return el;
}
const registry = {};
function byId(id) { if (!registry[id]) registry[id] = mkEl(id); return registry[id]; }
const doc = {
  getElementById: byId, createElement: () => mkEl(''), body: mkEl('body'),
  querySelector: () => null, querySelectorAll: () => [], addEventListener() { }, execCommand() { return true }
};
const sandbox = {
  console, setTimeout, clearTimeout, setInterval, clearInterval, Math, Date, JSON, Object, Array, String, Number, Boolean, RegExp, Error,
  document: doc, alert: () => { }, window: {}, navigator: { userAgent: 'node' }, location: { href: 'file:///x.html' },
  Uint8Array, Uint16Array, Uint32Array, DataView, ArrayBuffer, TextDecoder, TextEncoder,
  Blob: function () { }, URL: { createObjectURL() { return 'blob:x' }, revokeObjectURL() { } },
  FileReader: function () { }, localStorage: { getItem: () => null, setItem() { } }
};
sandbox.window = sandbox; sandbox.globalThis = sandbox;
sandbox.addEventListener = () => { }; sandbox.removeEventListener = () => { }; sandbox.scrollTo = () => { };
sandbox.innerHeight = 800; sandbox.scrollY = 0; sandbox.getComputedStyle = () => ({});
vm.createContext(sandbox);
vm.runInContext(script, sandbox, { timeout: 900000 });

const E = sandbox.ERDATA;
const ALIAS_BACKUP = E.abiAlias;
const RISK_BACKUP = sandbox.IMMUNE_RISK;
const POOL = E.species.filter(s => sandbox.isValidSp(s) && sandbox.isFinalSp(s));   // 与推荐聚合同口径
console.log('对比样本：最终形态 ' + POOL.length + ' 只\n');

/* 抓取一只宝可梦的「可观察输出」：3 个调用点 + 流派配招 + 选招依据 */
function snap(s) {
  const builds = sandbox.genBuilds(s).map(b => ({
    name: b.name, side: b.side, abi: b.abi, nat: b.nat, it: b.it,
    mv: b.mv.main.map(x => x.id).join('>'),
    main: b.mv.main.map(x => ({ id: x.id, why: (x.why || []).join(';') }))
  }));
  const ci = sandbox.coreIntensity(s);
  const cp = sandbox.coreAbiPick(s);
  const pa = sandbox.pickAbiFor(s, '特殊', '炮台');
  return {
    builds: builds,
    key: JSON.stringify(builds.map(b => [b.name, b.abi, b.nat, b.it, b.mv])),
    mults: ci.mults.map(m => m.n + '×' + (m.o && m.o.mul)).join(','),
    shield: ci.shield,
    cp: cp.map(x => x.n + ':' + x.sc).join('|'),
    pa: pa.map(x => x.n + ':' + x.sc + '[' + x.why.join(',') + ']').join('|'),
    why: builds.map(b => b.main.map(m => sandbox.MV[m.id][1] + '{' + m.why + '}').join(' + ')).join(' || ')
  };
}

function run(label) {
  const out = {};
  POOL.forEach(s => { out[s.id] = snap(s); });
  console.log('已抓取：' + label + '（' + Object.keys(out).length + ' 只）');
  return out;
}

function cmp(name, A, B, fields) {
  const changed = [];
  POOL.forEach(s => {
    const a = A[s.id], b = B[s.id];
    const da = [], db = [];
    fields.forEach(f => {
      if (a[f] !== b[f]) { da.push(f + '=' + String(a[f]).slice(0, 150)); db.push(f + '=' + String(b[f]).slice(0, 150)); }
    });
    if (da.length) changed.push({ zh: s.zh, id: s.id, a: da, b: db });
  });
  console.log('\n===== ' + name + '：变化 ' + changed.length + ' / ' + POOL.length + ' 只 =====');
  changed.slice(0, 12).forEach(c => {
    console.log('  · ' + c.zh + ' #' + c.id);
    c.a.forEach((x, i) => console.log('      旧  ' + x));
    c.b.forEach((x, i) => console.log('      新  ' + x));
  });
  if (changed.length > 12) console.log('  …（其余 ' + (changed.length - 12) + ' 只略，全量见 _diff_patches_out.txt）');
  return changed;
}

/* ---- 现行（新）口径全量快照 ---- */
const NEW = run('新口径');

/* ---- 补丁 1：旧口径 = 无别名回退 ---- */
E.abiAlias = {};
const OLD_ALIAS = run('旧别名口径（abiAlias 清空）');
const chgAlias = cmp('补丁1 特性名解析统一', OLD_ALIAS, NEW, ['key', 'mults', 'shield', 'cp', 'pa']);

/* ---- 补丁 2：旧口径 = IMMUNE_RISK 清空（无免疫惩罚） ---- */
E.abiAlias = ALIAS_BACKUP;
sandbox.IMMUNE_RISK = {};
const OLD_RISK = run('旧免疫口径（IMMUNE_RISK 清空）');
const chgRisk = cmp('补丁2 无对手免疫降权 ×0.7', OLD_RISK, NEW, ['key']);

/* ---- 选招依据（why）变化面：含 ×0.7 文案的招式数 ---- */
sandbox.IMMUNE_RISK = RISK_BACKUP;
let whyHit = 0, whySp = 0;
POOL.forEach(s => {
  const sn = snap(s);
  if (/保守降权/.test(sn.why)) { whyHit++; }
  if (/保守降权/.test(sn.why) || /output|输出×/.test(sn.why)) whySp++;
});
console.log('\n===== 选招依据「保守降权 ×0.7」文案命中：' + whyHit + ' 只（最终形态） =====');

fs.writeFileSync(ER + '_diff_patches_out.txt', JSON.stringify({
  pool: POOL.length,
  aliasChanged: chgAlias.map(c => ({ zh: c.zh, id: c.id, a: c.a, b: c.b })),
  riskChanged: chgRisk.map(c => ({ zh: c.zh, id: c.id, a: c.a, b: c.b })),
  whyPendHit: whyHit
}, null, 1), 'utf8');
console.log('已写出：' + ER + '_diff_patches_out.txt');
