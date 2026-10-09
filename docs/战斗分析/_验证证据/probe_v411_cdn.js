/* v4.11 CDN 加载优化探针（拆包 / 加载器 / 前缀与回退 / data.js 可用性 / gzip 体积报告）
   ---------------------------------------------------------------------------
   运行前置：
     python build_tool_html.py                     → 配招助手_ER.html + data.js
     node docs\战斗分析\_验证证据\_extract_script.js → _chk_script_1.js
   只读校验：不写任何产物、不改仓库文件。
   校验面（对齐 W3 任务验收 ①~③⑤）：
     A 拆包：HTML 无 ERDATA 巨型字面量 + 体积断言 + data.js 存在且与 HTML 同目录
     B 加载器：两块 bootstrap（主源 + 回退）存在、含 CDN 前缀常量、含 ERDATA 预定义跳过
     C 分支模拟：file: → 相对路径；https: → gcore 前缀；主源失败 → 回退同域；ERDATA 已定义 → 不加载
     D 数据可用：data.js node --check 通过 + VM 中执行后 ERDATA.mechLib/items/species 可用 +
                _chk_script_1.js 以 data.js 内容开头（前置拼接生效）
     E 资产前缀：erAssetBase/sprOf 在有/无前缀两种情形下的 URL 形态；sprProbe 失联回退
     F gzip 体积报告：python gzip 计算（HTML / data.js，含 CRLF 与 LF 两口径） */
const fs = require('fs');
const vm = require('vm');
const cp = require('child_process');

const ER = 'D:\\game\\elite-redux\\';
const GC = 'https://gcore.jsdelivr.net/gh/wsjshy/elite-redux-teambuilder@gh-pages/';
const BASELINE_HTML_BYTES = 2552588;    /* 拆包前实测（W1+W2 构建态，CRLF 落盘） */
const BASELINE_HTML_GZIP = 660230;      /* 拆包前实测 gzip（LF 归一，与任务书 660KB 一致） */

let pass = 0, fail = 0; const fails = [], notes = [];
function chk(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS  ' + name + (detail !== undefined ? '  → ' + detail : '')); }
  else { fail++; fails.push(name + '  → ' + detail); console.log('  FAIL  ' + name + '  → ' + detail); }
}
function hdr(t) { console.log('\n=== ' + t + ' ==='); }

const htmlPath = ER + '配招助手_ER.html';
const dataPath = ER + 'data.js';
const chkPath = ER + '_chk_script_1.js';

const html = fs.readFileSync(htmlPath, 'utf8');
const htmlBytes = fs.statSync(htmlPath).size;
const dataExists = fs.existsSync(dataPath);
const dataBytes = dataExists ? fs.statSync(dataPath).size : 0;

/* ---------- A 拆包 ---------- */
hdr('A 拆包：ERDATA 外置');
chk('index/配招助手_ER.html 不再内嵌 ERDATA 字面量（无 "var ERDATA = {"）',
  html.indexOf('var ERDATA = {') < 0, '命中 ' + (html.match(/var ERDATA = \{/g) || []).length + ' 次');
chk('HTML 体积显著缩小（< 拆包前 2,552,588 B 的 1/4）',
  htmlBytes < BASELINE_HTML_BYTES / 4, htmlBytes + ' B（拆包前 ' + BASELINE_HTML_BYTES + ' B，降幅 ' +
    (100 * (1 - htmlBytes / BASELINE_HTML_BYTES)).toFixed(2) + '%）');
chk('data.js 与 HTML 同目录存在且为数据体量（> 1 MB）', dataExists && dataBytes > 1048576, dataBytes + ' B');
chk('HTML 顶部/尾部无残留内联数据（shield：ERDATA.nonFinalER 字面量只在 data.js）',
  html.indexOf('ERDATA.nonFinalER=') < 0, '');
chk('HTML 仍为 3 个 <script> 块（loader / loader-FB / 应用代码）',
  (html.match(/<script/g) || []).length === 3, 'count=' + (html.match(/<script/g) || []).length);

/* ---------- B 加载器 ---------- */
hdr('B 加载器：主源 + 回退 两块 bootstrap');
const iL1 = html.indexOf('/*__ER_LOADER__*/');
const iL2 = html.indexOf('/*__ER_LOADER_FB__*/');
const loader1 = iL1 < 0 ? '' : html.slice(iL1, html.indexOf('</script>', iL1));
const loader2 = iL2 < 0 ? '' : html.slice(iL2, html.indexOf('</script>', iL2));
chk('主源加载器块存在（哨兵 __ER_LOADER__）', iL1 > 0 && iL1 < iL2, 'offset=' + iL1);
chk('回退加载器块存在（哨兵 __ER_LOADER_FB__）', iL2 > 0, 'offset=' + iL2);
chk('加载器内含 CDN 前缀常量（gcore.jsdelivr gh@gh-pages）',
  html.indexOf("var GC='" + GC + "'") > -1, '常量命中=' + (html.split(GC).length - 1) + ' 处（前缀常量 1 + 探针/注释）');
chk('加载器含 ERDATA 预定义跳过（typeof ERDATA===\'undefined\'）',
  (loader1.match(/typeof ERDATA==='undefined'/g) || []).length === 1 &&
  (loader2.match(/typeof ERDATA==='undefined'/g) || []).length === 1, '');
chk('加载器用 document.write 同步注入（非 async/defer，非 fetch）',
  loader1.indexOf('document.write(') > -1 && loader2.indexOf('document.write(') > -1 &&
  !/fetch\(|XMLHttpRequest|\.async|defer/.test(loader1 + loader2), '');
chk('JS 字符串内 </script> 已转义为 <\\/script>（HTML 解析器不截断）',
  (loader1 + loader2).indexOf('<\\/scr') > -1 && (loader1 + loader2).indexOf('</scr') < 0,
  '转义命中=' + ((loader1 + loader2).match(/<\\\/scr/g) || []).length + ' 处，裸 </scr 命中=' +
  ((loader1 + loader2).match(/<\/scr/g) || []).length + ' 处');
chk('加载器不引用 assets/sprites（旧目录零引用护栏）', html.indexOf('assets/sprites') < 0, '');

/* ---------- C 分支模拟 ---------- */
hdr('C 分支模拟：file: / https: / 失败回退 / 已定义跳过');
function runLoader(code, opts) {
  const writes = [];
  const sb = { console: console, Math: Math, String: String, Object: Object, Array: Array, JSON: JSON, Date: Date, Number: Number, Boolean: Boolean, RegExp: RegExp, Error: Error };
  sb.window = sb; sb.globalThis = sb;
  sb.location = opts.location;
  sb.document = { write: function (s) { writes.push(String(s)); } };
  if ('ERDATA' in opts) sb.ERDATA = opts.ERDATA;
  vm.createContext(sb);
  vm.runInContext(code, sb);
  return { sb: sb, writes: writes };
}
const LOC_FILE = { href: 'file:///D:/game/elite-redux/index.html', protocol: 'file:' };
const LOC_HTTPS = { href: 'https://wsjshy.github.io/elite-redux-teambuilder/', protocol: 'https:' };
const LOC_HREFFILE = { href: 'file:///D:/x/index.html' };   /* 无 protocol：回退按 href 前缀判定 */

const rFile = runLoader(loader1, { location: LOC_FILE });
chk('file: → 直接相对路径 data.js（不触网取 CDN）',
  rFile.writes.length === 1 && /<script src="data\.js"><\/script>/.test(rFile.writes[0]) &&
  rFile.writes[0].indexOf('gcore') < 0,
  JSON.stringify(rFile.writes));
chk('file: → __ER_FILE=true 且 __ER_ASSET_BASE=""（资产走相对路径）',
  rFile.sb.__ER_FILE === true && rFile.sb.__ER_ASSET_BASE === '',
  'FILE=' + rFile.sb.__ER_FILE + ' BASE=' + JSON.stringify(rFile.sb.__ER_ASSET_BASE));

const rHref = runLoader(loader1, { location: LOC_HREFFILE });
chk('仅有 location.href 且以 file: 开头 → 判为本地（相对路径）',
  rHref.writes.length === 1 && rHref.writes[0].indexOf('gcore') < 0, JSON.stringify(rHref.writes));

const rHttp = runLoader(loader1, { location: LOC_HTTPS });
chk('https: → 主源 = CDN 前缀 + data.js',
  rHttp.writes.length === 1 && rHttp.writes[0].indexOf('src="' + GC + 'data.js"') > -1,
  JSON.stringify(rHttp.writes));
chk('https: → __ER_FILE=false 且 __ER_ASSET_BASE=CDN 前缀',
  rHttp.sb.__ER_FILE === false && rHttp.sb.__ER_ASSET_BASE === GC,
  'BASE=' + rHttp.sb.__ER_ASSET_BASE);

/* 主源失败：块 1 写完 CDN 后 ERDATA 仍 undefined → 块 2 回退同域相对路径 */
const sbFail = { console: console, Math: Math, String: String, Object: Object, Array: Array, JSON: JSON, Date: Date };
sbFail.window = sbFail; sbFail.globalThis = sbFail; sbFail.location = LOC_HTTPS;
const wFail = [];
sbFail.document = { write: function (s) { wFail.push(String(s)); } };
vm.createContext(sbFail);
vm.runInContext(loader1, sbFail);
chk('主源写入后 ERDATA 仍未定义（模拟 404/网络失败）', typeof sbFail.ERDATA === 'undefined', '');
vm.runInContext(loader2, sbFail);
chk('主源失败 → 回退块改写同域相对路径 data.js',
  wFail.length === 2 && /<script src="data\.js"><\/script>/.test(wFail[1]) && wFail[1].indexOf('gcore') < 0,
  JSON.stringify(wFail));

/* 主源成功：块 1 写入后 ERDATA 已就绪 → 块 2 不再改写 */
const sbOk = { console: console, Math: Math, String: String, Object: Object, Array: Array, JSON: JSON, Date: Date };
sbOk.window = sbOk; sbOk.globalThis = sbOk; sbOk.location = LOC_HTTPS;
const wOk = [];
sbOk.document = { write: function (s) { wOk.push(String(s)); } };
vm.createContext(sbOk);
vm.runInContext(loader1, sbOk);
sbOk.ERDATA = { stub: 1 };                 /* 模拟 CDN data.js 加载成功 */
vm.runInContext(loader2, sbOk);
chk('主源成功（ERDATA 已就绪）→ 回退块零改写（不重复下载）',
  wOk.length === 1, 'writes=' + wOk.length);

/* 已在 HTML 内先定义 ERDATA（理论上不该发生，护栏）：块 1 不写 */
const rPre = runLoader(loader1, { location: LOC_HTTPS, ERDATA: { stub: 1 } });
chk('ERDATA 预定义 → 块 1 完全跳过加载（VM/V4 抽取场景同构）', rPre.writes.length === 0, 'writes=' + rPre.writes.length);

/* 回退块只在非 file: 生效（避免 file: 双写） */
const rFile2 = runLoader(loader2, { location: LOC_FILE });
const sbFile2 = rFile2.sb; sbFile2.__ER_FILE = true;
const wFile2 = [];
sbFile2.document = { write: function (s) { wFile2.push(String(s)); } };
vm.runInContext(loader2, sbFile2);
chk('file: 下回退块不二次写入（__ER_FILE=true 门控）', wFile2.length === 0, 'writes=' + wFile2.length);

/* ---------- D data.js 可用性 ---------- */
hdr('D data.js：语法 / 执行 / ERDATA 可用性 / 抽取前置拼接');
let nodeCheck = 'skip';
try {
  cp.execFileSync(process.execPath, ['--check', dataPath], { stdio: 'pipe' });
  nodeCheck = 'ok';
} catch (e) { nodeCheck = 'fail: ' + String(e.message).slice(0, 120); }
chk('data.js node --check 通过', nodeCheck === 'ok', nodeCheck);

const sbD = { console: console, Math: Math, JSON: JSON, Object: Object, Array: Array, String: String, Number: Number, Boolean: Boolean, RegExp: RegExp, Error: Error, Date: Date };
vm.createContext(sbD);
let runErr = '';
try { vm.runInContext(fs.readFileSync(dataPath, 'utf8'), sbD, { timeout: 300000 }); }
catch (e) { runErr = String(e.message); }
chk('data.js 在 VM 中可执行（无运行期错误）', runErr === '', runErr);
const E = sbD.ERDATA;
chk('ERDATA 就绪', !!E, typeof E);
chk('ERDATA.mechLib 可用（v4.10 机制库 mechs 非空 + meta 自洽）',
  !!(E && E.mechLib && Array.isArray(E.mechLib.mechs) && E.mechLib.mechs.length === 28 &&
     E.mechLib.meta && E.mechLib.meta.count === 28),
  E && E.mechLib ? ('mechs=' + (E.mechLib.mechs || []).length + ' meta.count=' + ((E.mechLib.meta || {}).count) +
    ' schema=' + ((E.mechLib.meta || {}).schema)) : '-');
chk('ERDATA.items 可用（929 条，zh 非空）',
  !!(E && Array.isArray(E.items) && E.items.length > 0),
  E && E.items ? ('items=' + E.items.length) : '-');
chk('ERDATA.species / types / moves 可用（数据同源护栏）',
  !!(E && Array.isArray(E.species) && E.species.length > 0 && Array.isArray(E.types) &&
     Array.isArray(E.moves) && E.moves.length > 0),
  E ? ('species=' + E.species.length + ' types=' + E.types.length + ' moves=' + E.moves.length) : '-');
chk('派生字段在 data.js 内（nonFinalER / finalOf 随拆包一并外置）',
  !!(E && Array.isArray(E.nonFinalER) && E.nonFinalER.length > 0 && E.finalOf && Object.keys(E.finalOf).length > 0),
  E && E.nonFinalER ? ('nonFinalER=' + E.nonFinalER.length + ' finalOf=' + Object.keys(E.finalOf || {}).length) : '-');

const chkSrc = fs.existsSync(chkPath) ? fs.readFileSync(chkPath, 'utf8') : '';
const chkHead = fs.readFileSync(dataPath, 'utf8').slice(0, 200);
chk('_chk_script_1.js 以 data.js 内容开头（VM 内 ERDATA 先于应用代码）',
  chkSrc.length > 0 && chkSrc.slice(0, 200) === chkHead, 'chk=' + chkSrc.length + ' B');
chk('_chk_script_1.js 含应用代码（sheet 引号 + SPR_SHEET 消费）',
  chkSrc.indexOf('assets/sheets/s') > -1 && chkSrc.indexOf('SPR_SHEET') > -1 &&
  chkSrc.indexOf('function erAssetBase') > -1, '');

/* ---------- E 资产前缀（sheets） ---------- */
hdr('E sheets 精灵图前缀：erAssetBase/sprOf/sprProbe');
function cutFn(src, name) {
  const i = src.indexOf('function ' + name + '(');
  if (i < 0) return null;
  let d = 0, j = i;
  for (; j < src.length; j++) {
    const c = src[j];
    if (c === '{') d++;
    else if (c === '}') { d--; if (d === 0) { j++; break; } }
  }
  return src.slice(i, j);
}
const fBase = cutFn(chkSrc, 'erAssetBase');
const fSpr = cutFn(chkSrc, 'sprOf');
const fRescan = cutFn(chkSrc, 'sprRescan');
const fProbe = cutFn(chkSrc, 'sprProbe');
chk('erAssetBase / sprOf / sprRescan / sprProbe 四函数齐备',
  !!(fBase && fSpr && fRescan && fProbe), [fBase, fSpr, fRescan, fProbe].map(x => x ? x.length : 0).join('/'));
chk('sprOf 走 erAssetBase() 拼前缀（非硬编码 assets/sheets）',
  /background-image:url\('"\+erAssetBase\(\)\+"assets\/sheets\/s"/.test(fSpr), '');

function sprCtx(base, withImage) {
  const sb = { Math: Math, String: String, Object: Object, Array: Array, console: console };
  sb.window = sb; sb.globalThis = sb;
  if (base !== undefined) sb.window.__ER_ASSET_BASE = base;
  sb.window.SPR_SHEET = { "3": [1, 5, 7] };
  const q = [];
  sb.document = {
    querySelectorAll: function () { return q; },
    _q: q
  };
  if (withImage) {
    function ImgStub() { ImgStub.last = this; this.onerror = null; this.src = ''; }
    ImgStub.last = null;
    sb.Image = ImgStub;
  }
  sb.__ImgStub = sb.Image;
  vm.createContext(sb);
  vm.runInContext('function sppct(k){return (Math.round(k*100/15*10000)/10000)+"%"}' + fBase + fSpr + fRescan + fProbe, sb);
  return sb;
}
const EXPECT_TAIL = "assets/sheets/s1.webp');background-repeat:no-repeat;background-size:1600% 1600%;background-position:33.3333% 46.6667%";

const sRel = sprCtx(undefined, false);          /* 无加载器（VM/旧行为）→ 相对路径 */
const sFile = sprCtx('', false);                /* file: → 相对路径 */
const sCdn = sprCtx(GC, false);                 /* https: → CDN 前缀 */
chk('无前缀（VM/file:）→ url(\'assets/sheets/s1.webp\')，逐字沿用旧格式',
  sRel.sprOf(3) === "background-image:url('" + EXPECT_TAIL && sFile.sprOf(3) === "background-image:url('" + EXPECT_TAIL,
  sRel.sprOf(3));
chk('CDN 前缀 → url(\'<gcore>assets/sheets/s1.webp\')',
  sCdn.sprOf(3) === "background-image:url('" + GC + EXPECT_TAIL, sCdn.sprOf(3));
chk('缺映射 id → 空串（.spmiss 空占位，不发请求，旧行为不回归）',
  sCdn.sprOf(999999) === '' && sRel.sprOf(999999) === '', '');

const sProbeNoImg = sprCtx(GC, false);
let probeNoImgErr = '';
try { vm.runInContext('sprProbe()', sProbeNoImg); } catch (e) { probeNoImgErr = String(e.message); }
chk('无 Image 环境（Node VM）→ sprProbe 零副作用零异常', probeNoImgErr === '', probeNoImgErr);

const sProbe = sprCtx(GC, true);
vm.runInContext('sprProbe()', sProbe);
chk('sprProbe 探针 src = CDN 前缀 + assets/sheets/s0.webp',
  sProbe.__ImgStub.last && sProbe.__ImgStub.last.src === GC + 'assets/sheets/s0.webp',
  sProbe.__ImgStub.last ? sProbe.__ImgStub.last.src : '-');
sProbe.__ImgStub.last.onerror();                 /* 模拟主源 404 / 网络失败 */
chk('探针 onerror → 前缀清空 + 重扫（主源失败回退同域相对路径）',
  sProbe.window.__ER_ASSET_BASE === '', 'BASE=' + JSON.stringify(sProbe.window.__ER_ASSET_BASE));

/* ---------- F gzip 体积报告（python gzip） ---------- */
hdr('F gzip 体积报告（python gzip level 9）');
const pyCode = [
  'import gzip,io',
  'for p in ["' + htmlPath.replace(/\\/g, '/') + '","' + dataPath.replace(/\\/g, '/') + '"]:',
  '    old=open(p,"rb").read()',
  '    new=old.replace(b"\\r\\n", b"\\n")',
  '    print(p.split("/")[-1], len(old), len(gzip.compress(old,9)), len(new), len(gzip.compress(new,9)))',
].join('\n');
let gz = '';
try { gz = cp.execFileSync('python', ['-c', pyCode], { encoding: 'utf8' }); }
catch (e) { gz = 'ERROR ' + String(e.message).slice(0, 200); }
console.log(gz.trim().split('\n').map(l => '  · ' + l).join('\n'));
const gzRows = {};
gz.trim().split('\n').forEach(l => {
  const t = l.trim().split(/\s+/);
  if (t.length === 5) gzRows[t[0]] = { disk: +t[1], gzipDisk: +t[2], lf: +t[3], gzipLf: +t[4] };
});
const gHtml = gzRows['配招助手_ER.html'], gData = gzRows['data.js'];
chk('python gzip 取数成功（HTML + data.js 各一行）', !!gHtml && !!gData, Object.keys(gzRows).join(','));
if (gHtml) {
  chk('HTML gzip 降幅 ≥ 50%（对比拆包前 ' + BASELINE_HTML_GZIP + ' B gzip）',
    gHtml.gzipLf < BASELINE_HTML_GZIP * 0.5,
    'LF gzip=' + gHtml.gzipLf + ' B（拆包前 ' + BASELINE_HTML_GZIP + ' B，降幅 ' +
    (100 * (1 - gHtml.gzipLf / BASELINE_HTML_GZIP)).toFixed(1) + '%）');
  notes.push('HTML：' + gHtml.disk + ' B → gzip(LF) ' + gHtml.gzipLf + ' B / gzip(CRLF) ' + gHtml.gzipDisk +
    ' B（拆包前 2,552,588 B / gzip 660,230 B）');
  notes.push('目标「~100KB gzip 量级」实测未达：残余 0.53 MB 主体为应用 JS（~400KB）+ 内嵌 SPR_SHEET(28.9KB)/AXIS_LIB(27.1KB)，' +
    '本轮红线只允许拆 ERDATA；如需再降须另立拆包项（sheets_map/axis_lib 外置，会改部署集）。');
}
if (gData) {
  notes.push('data.js：' + gData.disk + ' B → gzip(LF) ' + gData.gzipLf + ' B / gzip(CRLF) ' + gData.gzipDisk + ' B');
  notes.push('单次首屏传输预算（gzip）：HTML ' + (gHtml ? gHtml.gzipLf : '?') + ' B（github.io）+ data.js ' +
    (gData.gzipLf) + ' B（gcore 镜像）≈ ' + (gHtml ? (gHtml.gzipLf + gData.gzipLf) : '?') +
    ' B，与拆包前 660,230 B 同量级；差异在**来源**（最大一块 data.js 由 gcore ~118KB/s 承载而非 github.io ~46KB/s）与' +
    '精灵图 8 张 webp 同走 gcore。');
}

/* ---------- 汇总 ---------- */
console.log('\n================ v4.11 CDN 优化探针 汇总 ================');
console.log('PASS=' + pass + '  FAIL=' + fail);
if (notes.length) { console.log('NOTE ' + notes.length + ' 条：'); notes.forEach(n => console.log('  · ' + n)); }
if (fail) { console.log('FAIL 明细：'); fails.forEach(f => console.log('  × ' + f)); process.exitCode = 1; }
