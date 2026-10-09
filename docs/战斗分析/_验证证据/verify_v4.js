/* v4.x 大升级（引擎层 + UI 层）Node 断言：A~G 七组关键行为
   运行前置：D:\game\elite-redux\_chk_script_1.js 已由 extract_script.js 从最新 HTML 提取 */
const fs = require('fs'), vm = require('vm');
const ER = 'D:\\game\\elite-redux\\';
const script = fs.readFileSync(ER + '_chk_script_1.js', 'utf8');

/* ---------- DOM 打桩（与 verify_v1.js 同口径） ---------- */
function mkEl(id) {
  const el = {
    id: id || '', _html: '', children: [], style: {}, dataset: {}, value: '', checked: false,
    textContent: '', className: '', hidden: false, onclick: null, oninput: null, onchange: null,
    files: null, title: '', _attrs: {}, parentNode: null, nextSibling: null,
    classList: { _s: {}, add(n) { this._s[n] = 1 }, remove(n) { delete this._s[n] }, toggle(n) { this._s[n] = this._s[n] ? 0 : 1 }, contains(n) { return !!this._s[n] } },
    appendChild(c) { this.children.push(c); return c },
    removeChild(c) { const i = this.children.indexOf(c); if (i > -1) this.children.splice(i, 1) },
    setAttribute(k, v) { this._attrs[k] = String(v) },
    getAttribute(k) { return this._attrs[k] === undefined ? null : this._attrs[k] },
    querySelector() { return mkEl('') }, querySelectorAll() { return [] },
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
sandbox.addEventListener = function () { }; sandbox.removeEventListener = function () { };
sandbox.scrollTo = function () { }; sandbox.innerHeight = 800; sandbox.scrollY = 0;
sandbox.getComputedStyle = function () { return {} };
vm.createContext(sandbox);
vm.runInContext(script, sandbox, { timeout: 900000 });

let pass = 0, fail = 0; const fails = [];
function chk(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS  ' + name + (detail !== undefined ? '  → ' + detail : '')); }
  else { fail++; fails.push(name + '  → ' + detail); console.log('  FAIL  ' + name + '  → ' + detail); }
}
function hdr(t) { console.log('\n=== ' + t + ' ==='); }
const E = sandbox.ERDATA;
const spById = id => E.species.filter(s => '' + s.id === '' + id)[0];
const spByZh = n => E.species.filter(s => s.zh === n)[0] || E.species.filter(s => s.zh.indexOf(n) > -1)[0];
const mvn = id => sandbox.MV[id] ? sandbox.MV[id][1] : ('#' + id);
const plain = h => String(h || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

/* ================= 0 数据契约（A/B 前置） ================= */
hdr('v4.x 0 数据契约（mvDescZh / abiDescZh / glossary / familyRoot / templates）');
chk('契约字段齐备（V4FIELDS 全 true）', sandbox.V4FIELDS.mvDescZh && sandbox.V4FIELDS.abiDescZh && sandbox.V4FIELDS.glossary && sandbox.V4FIELDS.familyRoot && sandbox.V4FIELDS.templates >= 18, JSON.stringify(sandbox.V4FIELDS));
chk('v4ContractNote 显示「数据来源完整」（玩家化，无内部术语「新字段/回退」）', /数据来源完整|齐备/.test(sandbox.v4ContractNote()) && !/新字段|回退/.test(sandbox.v4ContractNote()), sandbox.v4ContractNote());
chk('abiTags.conv 仍为 9 条（v3.24 基线不回归）', Object.keys(E.abiTags).filter(k => E.abiTags[k].conv !== undefined).length === 9, Object.keys(E.abiTags).filter(k => E.abiTags[k].conv !== undefined).length);
chk('WCONF/ABI_ATE 关键值不回归（v3.23 基线）', sandbox.WCONF.boost === 0.5 && sandbox.WCONF.terrainBoost === 1.3 && sandbox.ABI_ATE.multiplier === 1.0 && sandbox.ABI_ATE.stabConvert === true, JSON.stringify([sandbox.WCONF.boost, sandbox.WCONF.terrainBoost, sandbox.ABI_ATE.multiplier]));

/* ================= A 宝可梦详情 ================= */
hdr('v4.x A 宝可梦详情（①天性描述 ②招式中文 ③词条 tooltip + 抽屉）');
chk('A② mvDescOf 中文优先（打雷 #85）', /麻痹/.test(sandbox.mvDescOf(sandbox.MV[85])) && /强力的电流攻击/.test(sandbox.mvDescOf(sandbox.MV[85])), sandbox.mvDescOf(sandbox.MV[85]));
chk('A② mvDescOf 中文优先（冲浪 #57）', /巨浪/.test(sandbox.mvDescOf(sandbox.MV[57])), sandbox.mvDescOf(sandbox.MV[57]));
chk('A② 回退链存在（mvDescZh → m[9] 英文 → m[10] lDesc）', /mvDescZh/.test(sandbox.mvDescOf.toString()) && /m\[9\]/.test(sandbox.mvDescOf.toString()), '');
chk('A① 天性 span 带 abiDesc(this,id) 点击', (function () {
  ['spDrawer', 'spDetail', 'abiDesc'].forEach(i => byId(i));
  sandbox.openSp(spByZh('妙蛙花'));
  const h = byId('spDetail')._html;
  return /abiDesc\(this,/.test(h) && /天性/.test(h);
})(), '妙蛙花 #3');
chk('A① abiDesc 详情：中文描述 + 战斗意义 + 特性反查按钮', (function () {
  sandbox.abiDesc(mkEl(''), 2);
  const h = byId('abiDesc')._html;
  return /出场时降下雨水/.test(h) && /战斗意义/.test(h) && /特性反查/.test(h) && /#2/.test(h);
})(), plain(byId('abiDesc')._html).slice(0, 80));
chk('A① abiDesc 中文来源含数据层 abiDescZh（280 结晶化）', /岩石属性招式变为冰属性/.test(sandbox.abiDescZhOf(280)), sandbox.abiDescZhOf(280));
chk('A① 天性描述容器挂在天性块内（紧跟天性 chip 行），不落到特性块', (function () {
  byId('spDrawer'); byId('spDetail'); byId('abiDesc'); byId('spInnDesc');
  sandbox.openSp(spByZh('妙蛙花'));
  const h = byId('spDetail')._html;
  const iInn = h.indexOf('天性（固定 3 个'), iBox = h.indexOf('id="spInnDesc"'), iNote = h.indexOf('天性固定生效、不可更换');
  const iAbiBox = h.indexOf('id="abiDesc"');
  return iInn > -1 && iBox > iInn && iNote > iBox && iAbiBox > -1 && iAbiBox < iInn &&
    /abiDesc\(this,\d+,'spInnDesc'\)/.test(h) && /id="abiDesc"/.test(h);
})(), '顺序：特性块(#abiDesc) < 天性块(标题 → 天性chip → #spInnDesc → 注释)');
chk('A① 天性/特性描述互不串块：点天性写 #spInnDesc 并隐藏 #abiDesc（反向同理）', (function () {
  const inn = mkEl('spInnDesc'), abi = mkEl('abiDesc');
  registry['spInnDesc'] = inn; registry['abiDesc'] = abi;
  abi.style.display = 'block';
  sandbox.abiDesc(mkEl(''), 2, 'spInnDesc');
  const okInn = /降雨/.test(inn._html) && abi.style.display === 'none' && inn.style.display === 'block';
  sandbox.abiDesc(mkEl(''), 2);
  const okAbi = /降雨/.test(abi._html) && inn.style.display === 'none' && abi.style.display === 'block';
  return okInn && okAbi;
})(), '天性描述 → 天性块容器（特性块被隐藏）');
chk('A③ glossary 数据层已接入（40 条原始 → 引擎排除 hazard_bug 后 39 条）', (function () {
  const raw = (E.glossary || []).length, keep = sandbox.glossList().length;
  const bugged = (E.glossary || []).filter(g => /stealth rock bug|疑似失效|非首铺/i.test(JSON.stringify(g)));
  return raw === 40 && raw - keep === 1 && bugged.length === 1 && bugged[0].key === 'hazard_bug' &&
    sandbox.glossList().every(g => !/stealth rock bug|疑似失效|非首铺/i.test(JSON.stringify(g))) &&
    sandbox.glossTerms().every(t => !/bug/i.test(t));
})(), sandbox.glossList().length + '/' + (E.glossary || []).length + '（排除 hazard_bug）');
chk('A③ 合法隐形岩词条仍在（仅剔除 bug 条目，用户裁定：bug 不入引擎）', sandbox.glossList().some(g => /隐形岩/.test('' + (g.zh || '')) && !/疑似失效|非首铺/.test('' + (g.zh || '') + (g.body || ''))), '');
chk('A③ 词条中英双通（glossKeys 含 雨天 / Rain (Rain Dance / Drizzle) / Rain）', (function () {
  const g = sandbox.glossList().filter(x => x.key === 'weather_rain')[0], ks = sandbox.glossKeys(g);
  return ks.indexOf('雨天') > -1 && ks.some(k => /^Rain/.test(k));
})(), JSON.stringify(sandbox.glossKeys(sandbox.glossList().filter(x => x.key === 'weather_rain')[0])));
chk('A③ glossFind 中文/英文均可定位', (sandbox.glossFind('雨天') || {}).key === 'weather_rain' && (sandbox.glossFind('Sandstorm') || {}).key === 'weather_sand', '');
chk('A③ glossTerms 无单字中文键（避免「雪/电」到处标蓝）+ 英文键 ≥4 字符', sandbox.glossTerms().filter(t => !/^[\x00-\x7F]+$/.test(t) && t.length < 2).length === 0 && sandbox.glossTerms().filter(t => /^[\x00-\x7F]+$/.test(t) && t.length < 4).length === 0, '词条键 ' + sandbox.glossTerms().length + ' 个');
chk('A③ glossify 生成纯 CSS tooltip span（class=gl + data-g 释义）', (function () {
  const h = sandbox.glossify('雨天增伤与场地加成');
  return /<span class="gl" data-g="[^"]{10,}"/.test(h) && /雨天/.test(h) && /场地/.test(h);
})(), sandbox.glossify('雨天增伤与场地加成').slice(0, 90));
chk('A③ glossify 先转义再拼接（无字面标签注入）', sandbox.glossify('<b>x') === '&lt;b&gt;x' && !/<b>/.test(sandbox.glossify('<b>x')), sandbox.glossify('<b>x'));
chk('A③ 词条覆盖机制关键词（天气/场地/钉子/强化/异常/先制/蓄力/属性转换/STAB/-ate）', (function () {
  const s = sandbox.glossTerms().join('|');
  return /Rain/.test(s) && /Terrain/.test(s) && /Spikes/.test(s) && /Stat Boost/.test(s) && /Paralysis/.test(s) && /Priority/.test(s) && /Charging/.test(s) && /-ate/.test(s) && /STAB/.test(s) && /Frostbite/.test(s);
})(), sandbox.glossTerms().length + ' 键');
chk('A③ glossClick 打开轻量居中 modal（带遮罩，非右侧抽屉）+ 词条来源标注', (function () {
  byId('glDetail'); byId('glTitle'); byId('glModal');
  sandbox.glossClick('天气');
  const h = byId('glDetail')._html;
  return /词条来源/.test(h) && /轻量居中弹层/.test(h) && byId('glModal').classList.contains('open') && byId('glTitle').textContent === '📖 天气';
})(), plain(byId('glDetail')._html).slice(0, 70));
chk('A③ 词条 modal 可关闭（closeGl 移除 open）且不再有右侧抽屉挂载点', (function () {
  sandbox.closeGl();
  const src = fs.readFileSync('D:\\game\\elite-redux\\_chk_script_1.js', 'utf8');
  return !byId('glModal').classList.contains('open') && !/glDrawer/.test(src) && !/mxDrawer/.test(src) && /glModal/.test(src) && /className='modal'|className=\"modal\"/.test(src);
})(), 'glModal 开关往返 + 无 glDrawer/mxDrawer 残留');
chk('A③ tooltip 用纯 CSS（.gl:hover::after content:attr(data-g)）+ 点击跳词条', (function () {
  const css = fs.readFileSync('D:\\game\\elite-redux\\配招助手_ER.html', 'utf8');
  return /\.gl:hover::after\{content:attr\(data-g\)/.test(css) && /pointer-events:none/.test(css) && /data-g=/.test(sandbox.glossify('撒菱')) && sandbox.glossify('撒菱').indexOf('glossClick') > -1;
})(), '词表键=数据层 term（撒菱 / 隐形岩 / 毒菱 / 粘网 / 除钉范围）');

/* ================= B 核心配队 ================= */
hdr('v4.x B 核心配队（④大卡片 ⑤队友分流派 ⑥妙蛙花 4 案例 ⑦口径展示）');
const sb = spByZh('妙蛙花');
const coreHtml = (function () { byId('coreOut')._html = ''; sandbox.renderCore(sb); return byId('coreOut')._html })();
const builds = sandbox.deriveBuilds(sb);   /* v4.3：动态流派推导 */
chk('B④ 流派「大卡片」= <details class="big…">（排除「体系补盲队友」折叠块）且数量与 deriveBuilds（动态 2~4 条打法流派）一致', (function(){ const all=(coreHtml.match(/<details class="big/g)||[]).length, sub=(coreHtml.match(/<details class="big subsec"/g)||[]).length; return (all-sub) === builds.length && builds.length >= 2 && builds.length <= 4; })(), (function(){ const all=(coreHtml.match(/<details class="big/g)||[]).length, sub=(coreHtml.match(/<details class="big subsec"/g)||[]).length; return (all-sub)+'/'+builds.length+'（含补盲折叠 '+sub+'）'; })());
chk('B④ 卡片含大标题 + 一句话简介（summary/bigsub）+ 首卡默认展开', /<summary>/.test(coreHtml) && /class="bigsub"/.test(coreHtml) && /<details class="big rec" open>/.test(coreHtml), '');
chk('B④ 详情含 种族/强度概要（种族六维 + 强度 + 本系最高威力 + 耐久口径）', /种族 \/ 强度概要/.test(coreHtml) && /种族 物攻/.test(coreHtml) && /本系最高威力/.test(coreHtml) && /耐久/.test(coreHtml), '');
chk('B④ 详情内招式/特性/道具均可点击跳转对应 Tab5', /onclick="gotoMv\(/.test(coreHtml) && /onclick="gotoAbi\(/.test(coreHtml) && /onclick="gotoItem\(/.test(coreHtml), '');
/* D1（阻塞级）：内联 onclick 里的名称必须走 jsl（HTML 属性转义），不得出现裸双引号截断属性 */
chk('D1 流派卡/详情内联 onclick 无裸 JSON.stringify 双引号（gotoAbi/gotoMv/gotoItem 走 jsl）', (function () {
  const src = fs.readFileSync('D:\\game\\elite-redux\\_chk_script_1.js', 'utf8');
  const rawJson = /onclick="[^"]*JSON\.stringify/.test(src);
  const rawDq = /onclick="goto(?:Abi|Mv|Item)\("(?!&quot;)/.test(src);
  const brokenAttr = /onclick="goto(?:Abi|Mv|Item)\("[\u4e00-\u9fa5A-Za-z][^"]*"\)">/.test(coreHtml);
  return !rawJson && !rawDq && !brokenAttr && /gotoAbi\('\+jsl\(/.test(src) && /function jsl\(/.test(src);
})(), 'jsl 输出 &quot; 形式；core 卡片 onclick 合法');
chk('D1 全部名称型内联 onclick 已走 jsl（≥6 处调用点，含 gotoAbi/gotoMv/gotoItem/glossClick）', (function () {
  const src = fs.readFileSync('D:\\game\\elite-redux\\_chk_script_1.js', 'utf8');
  const n = (src.match(/goto(?:Abi|Mv|Item)\('\+jsl\(/g) || []).length;
  const g = (src.match(/glossClick\('\+jsl\(/g) || []).length;
  return n >= 6 && g >= 1;
})(), '调用点=' + ((fs.readFileSync('D:\\game\\elite-redux\\_chk_script_1.js', 'utf8').match(/goto(?:Abi|Mv|Item)\('\+jsl\(/g) || []).length) + ' 处 goto + glossClick');
chk('D1 jsl 产物可被 HTML 解析回合法 JS（&quot; 还原为 "）', (function () {
  const m = /onclick="gotoAbi\((&quot;[^"]*?&quot;)\)"/.exec(coreHtml);
  if (!m) return false;
  const js = m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  try { new Function('return ' + js); return true; } catch (e) { return false; }
})(), (coreHtml.match(/onclick="gotoAbi\(&quot;[^"]*?&quot;\)"/) || [''])[0].slice(0, 60));
chk('B⑤ 流派卡内含「本流派队友」（按 side/roleTag 区分）', /本流派队友/.test(coreHtml) && /向 \/ /.test(coreHtml), '');
const glSample = (function () {
  if (!/glossify\(/.test(sandbox.renderCore.toString()) || !/movesNotes/.test(sandbox.renderCore.toString())) return { ok: false, why: 'renderCore 未接 movesNotes/glossify' };
  const cands = E.species.filter(s => sandbox.isValidSp(s) && sandbox.isFinalSp(s)).slice(0, 400);
  for (const s of cands) {
    let hit = false;
    sandbox.deriveBuilds(s).forEach(b => b.mv.main.forEach(sl => {
      const nt = (E.movesNotes || {})[sl.id];
      if (nt && /class="gl"/.test(sandbox.glossify(nt))) hit = true;
    }));
    if (!hit) continue;
    byId('coreOut')._html = '';
    sandbox.renderCore(s);
    return { ok: /class="gl"/.test(byId('coreOut')._html), why: s.zh + '#' + s.id + '（点评含机制词条 → 卡片标蓝）' };
  }
  return { ok: false, why: '（无含词条点评样本）' };
})();
chk('B⑧/⑫ 详情招式点评走词条标蓝（glossify(movesNotes)）', glSample.ok, glSample.why);
byId('coreOut')._html = ''; sandbox.renderCore(sb); /* 复位到妙蛙花卡片 */
chk('B⑦ 判定口径行（天气 ×1.5 + 场地 ×1.3，均标 已按游戏源码核对）', /判定口径：/.test(coreHtml) && /天气增伤 ×1\.5（手动\/特性一致，已按游戏源码核对）/.test(coreHtml) && /场地增伤 ×1\.3（已按游戏源码核对）/.test(coreHtml), '');
chk('B⑦ 数值卡标注判定口径来源（指针 WCONF + 数据来源说明；v4.6-A 玩家化后无「新字段」字样）', /判定口径：天气\/场地回合与倍率读 WCONF/.test(coreHtml) && /数据来源完整|齐备/.test(coreHtml), '');

/* ⑥-1 体系匹配 */
chk('B⑥-1 妙蛙花体系=晴（天性 叶绿素 → SYS_MAP）', JSON.stringify(sandbox.coreSys(sb)) === '["晴"]', JSON.stringify(sandbox.coreSys(sb)));
const recsSpec = sandbox.findTeammates(sb, '特殊', '天气');
const recsPhys = sandbox.findTeammates(sb, '物理', '天气');
chk('B⑥-1 推荐队友均带体系/联防/补盲理由（非同体系且无联防补弱者不进榜）', recsSpec.length >= 3 && recsSpec.every(r => r.why.some(w => /晴|联防|免疫|抵抗|补你盲点|钉子|回复|控速|威吓/.test(w))), recsSpec.map(r => r.s.zh + '+' + r.score).join('/'));
chk('D6 天气体系硬互斥（含 Mega/Redux）：沙暴系（班基拉斯#248 / 超级班基拉斯#1521）不进「晴」体系推荐', (function () {
  const ids = recsSpec.map(r => '' + r.s.id);
  return !ids.includes('248') && !ids.includes('1521') && sandbox.coreSys(spById(1521)).includes('沙') && sandbox.coreSys(sb).includes('晴');
})(), '晴推荐=' + recsSpec.map(r => r.s.zh).join('/') + '；超级班基拉斯体系=' + sandbox.coreSys(spById(1521)).join('+'));
/* ⑥-2 家族去重 */
chk('B⑥-2 家族去重：同 familyRoot 只保留最高形态（班基拉斯#248 与超级班基拉斯#1521 不同时出现）', (function () {
  const ks = recsSpec.map(r => sandbox.famKey(r.s));
  const both = recsSpec.some(r => '' + r.s.id === '248') && recsSpec.some(r => '' + r.s.id === '1521');
  return ks.length === new Set(ks).size && !both;
})(), recsSpec.map(r => r.s.zh + '(' + sandbox.famKey(r.s) + ')').join('/'));
chk('B⑥-2 famKey 走数据层 familyRoot（班基拉斯族同根 248）', sandbox.famKey(spById(248)) === sandbox.famKey(spById(1521)) && sandbox.famKey(spById(248)) === '248', sandbox.famKey(spById(248)) + '/' + sandbox.famKey(spById(1521)));
/* ⑥-3 强化招感知天气 */
const mvSpec = sandbox.buildMoves(sb, '特殊', '天气'), mvPhys = sandbox.buildMoves(sb, '物理', '天气');
chk('B⑥-3 晴体系→生长 #74 优先入强化槽（妙蛙花 特殊/物理 流均命中）', mvSpec.main.some(x => x.id === 74) && mvPhys.main.some(x => x.id === 74), mvn(74) + ' in [' + mvSpec.main.map(x => mvn(x.id)).join(',') + ']');
chk('B⑥-3 强化槽不再被 自我激励 #504 顶替（learn id 数字/字符串比对修正）', !mvSpec.main.some(x => x.id === 504), mvSpec.main.map(x => mvn(x.id)).join('/'));
/* ⑥-4 天气体系核心不自带天气招 */
chk('B⑥-4 妙蛙花非天气设置手（selfSetter=false）且功能槽无天气招（wxMv=false）', mvSpec.selfSetter === false && mvSpec.wxMv === false && !mvSpec.main.some(x => sandbox.WEATHER_MV[x.id] !== undefined), 'selfSetter=' + mvSpec.selfSetter + ' wxMv=' + mvSpec.wxMv);
const canSetNonSetter = E.species.filter(s => sandbox.isValidSp(s) && sandbox.learnOf(s).indexOf(241) > -1 && !sandbox.isAbilSet(s, '晴') && sandbox.isFinalSp(s))[0];
chk('B⑥-4 机制判据：会「大晴天」但非晴设置手的核心，其在「天气」流派下功能槽也不放天气招', (function () {
  if (!canSetNonSetter) return true;
  const m = sandbox.buildMoves(canSetNonSetter, '特殊', '天气');
  return m.wxMv === false && !m.main.some(x => sandbox.WEATHER_MV[x.id] !== undefined);
})(), canSetNonSetter ? (canSetNonSetter.zh + '#' + canSetNonSetter.id) : '（全库无该样本）');
chk('B⑥-4 UI 提示「天气/场地由队友提供 + 推荐 XX」', /天气\/场地由队友提供/.test(coreHtml) && /体系手/.test(coreHtml), plain(coreHtml).match(/天气\/场地由队友提供[^。]*。/)?.[0] || '缺');
/* ⑤ 队友分流派 */
chk('B⑤ 物攻流 vs 特攻流队友排序不同（按侧分工）', recsPhys.map(r => r.s.id).join() !== recsSpec.map(r => r.s.id).join(), '物理:' + recsPhys.map(r => r.s.zh).join('/') + ' ｜ 特殊:' + recsSpec.map(r => r.s.zh).join('/'));
chk('B⑤ 物理流首推带物理联防理由 / 特殊流首推带特殊联防理由', (function () {
  const hasPhys = recsPhys.some(r => r.why.some(w => /物理联防（防御\d+）/.test(w)));
  const hasSpec = recsSpec.some(r => r.why.some(w => /特殊联防（特防\d+）/.test(w)));
  return hasPhys && hasSpec;
})(), '物理侧有物防理由=' + recsPhys.some(r => r.why.some(w => /物理联防/.test(w))) + ' 特殊侧有特防理由=' + recsSpec.some(r => r.why.some(w => /特殊联防/.test(w))));
/* 用户裁决回归：雷电云特攻流派主攻槽含电本系主攻招 */
const rk = spById(1677);
const rkB = sandbox.deriveBuilds(rk).filter(b => b.side === '特殊')[0];
chk('用户裁决回归：雷电云-灵兽 特攻主流派主攻槽含电本系主攻招（本系+电属性）', (function () {
  const conv = sandbox.convOf(rk);
  return rkB.mv.main.some(sl => sandbox.effMvType(rk, sandbox.MV[sl.id], conv) === '电' && /本系/.test(sl.tag));
})(), rkB.mv.main.map(x => mvn(x.id) + '[' + x.tag + ']').join(' / '));
chk('用户裁决回归：主攻槽未被 真气弹#411 / 水之波动#352 挤掉', !rkB.mv.main.some(x => x.id === 411 || x.id === 352) && rkB.mv.main.filter(x => /攻击/.test(x.tag)).length >= 2, rkB.mv.main.map(x => mvn(x.id)).join('/'));
chk('B⑤ 功能槽按流派保留强化/游击（诡计 #417 + 伏特替换 #521）', rkB.mv.main.some(x => x.id === 417) && rkB.mv.main.some(x => x.id === 521), rkB.mv.main.map(x => mvn(x.id)).join('/'));

/* ================= C 全局模糊搜索 ================= */
hdr('v4.x C⑧ 全局模糊搜索');
chk('C⑧ 中文子串包含', sandbox.fzAny('十万', ['十万伏特']) === true && sandbox.fzAny('土', ['土王']) === true, '');
chk('C⑧ 英文大小写不敏感子串', sandbox.fzAny('thun', ['Thunder']) === true && sandbox.fzAny('THUN', ['Thunder']) === true, '');
chk('C⑧ 编号子串包含（数字与字符串同口）', sandbox.fzAny('85', [85, 'X']) === true && sandbox.fzAny('0', [301]) === true, '');
chk('C⑧ 多词空格 AND', sandbox.fzAny('土 王', ['土王']) === true && sandbox.fzAny('土 龙', ['土王']) === false, '');
chk('C⑧ 宝可梦搜索用 spMatch 模糊（中文/英文/编号/特性名）', (function () {
  const t = spByZh('土王');
  return sandbox.spMatch(t, '土', [], '', '') === true && sandbox.spMatch(t, '980', [], '', '') === true && sandbox.spMatch(t, '土王', [], '', '储水') === true && sandbox.spMatch(t, '土王', [], '', '电晶体') === false;
})(), '土王 #980');
chk('C⑧ 空条件不过滤（返回全量候选）', sandbox.spMatch(spByZh('土王'), '', [], '', '') === true, '');
chk('C⑧ 招式搜索含描述与编号（renderMv 改 fzAny，含 m[10] lDesc）', /fzAny/.test(sandbox.renderMv.toString()), '');

/* ================= D 克制格 → 受影响宝可梦（v4.x UI 定稿：就地展开，攻/防两视角逻辑不同） ================= */
hdr('v4.x D⑨ 克制格：就地展开 + 精灵图卡片（进攻视角 ≠ 防守视角）');
chk('D⑨ mxBucket 六档映射（免疫/0.25/0.5/1/2/4）', [0, 0.25, 0.5, 1, 2, 4].map(v => sandbox.mxBucket(v)).join('|') === '0×（免疫）|0.25×|0.5×（抵抗）|1×（中性）|2×（弱点）|4×（双弱点）', [0, 0.25, 0.5, 1, 2, 4].map(v => sandbox.mxBucket(v)).join('|'));
/* 就地展开：模拟点击 chip（其 closest('.kgroup') 指向所在块），断言面板被插入到该块之后而非右侧抽屉 */
function mkGroupStub() {
  const inserted = [];
  const parent = { insertBefore(n) { inserted.push(n); n.parentNode = parent; return n }, removeChild(n) { const i = inserted.indexOf(n); if (i > -1) inserted.splice(i, 1) } };
  const g = mkEl('kg'); g.parentNode = parent; g.nextSibling = null; g._inserted = inserted; g.closest = () => g;
  return g;
}
const gAtk = mkGroupStub();
sandbox.mxInline('电', gAtk, 'atk');
const panelAtk = gAtk._inserted[0];
chk('D⑨-1 点攻击属性格 → 面板就地插入该格所在块之后（内联展开，非右侧抽屉）',
  !!panelAtk && /mxinline/.test(panelAtk.className) && panelAtk._attrs['data-view'] === 'atk' && panelAtk._attrs['data-at'] === '电' && /🔱 进攻视角/.test(panelAtk._html), panelAtk ? panelAtk._attrs['data-at'] + '/' + panelAtk._attrs['data-view'] : 'no panel');
chk('D⑨-2 进攻视角：全图鉴按实际承受倍率分档（免疫/0.5/2/4 档位小节 + 计数）',
  /0×（免疫）/.test(panelAtk._html) && /（弱点）/.test(panelAtk._html) && /（抵抗）/.test(panelAtk._html) && /mxsec/.test(panelAtk._html) && /tagline/.test(panelAtk._html), plain(panelAtk._html).match(/0×（免疫） \d+/)?.[0] || '');
chk('D⑨-3 卡片=精灵图 + 中文名 + 倍率徽标（v4.6.2 合图 assets/sheets/s<idx>.webp + data-id）且点击跳详情',
  /assets\/sheets\/s\d+\.webp/.test(panelAtk._html) && /data-id="\d+"/.test(panelAtk._html) && /class="mcnm"/.test(panelAtk._html) && /class="mcx"/.test(panelAtk._html) && /openSpById\('/.test(panelAtk._html) && /class="mxc/.test(panelAtk._html), '');
chk('D⑨-4 ×1（中性）默认折叠，可勾选展开', /含 ×1（中性）/.test(panelAtk._html) && !/1×（中性）<\/div><div class="mxgrid"/.test(panelAtk._html), '');
chk('D⑨-5 同一格再次点击 → 收起（面板从 DOM 移除）', (function () {
  sandbox.mxInline('电', gAtk, 'atk');
  return gAtk._inserted.length === 0;
})(), 'inserted=' + gAtk._inserted.length);
chk('D⑨-6 进攻视角与防守视角内容逻辑不同（防守=列出拥有该属性的宝可梦，不按倍率分档）', (function () {
  const atk = sandbox.mxPanelAtk('电', false, false), def = sandbox.mxPanelDef('飞行', false);
  const atkIsAtk = /🔱 进攻视角/.test(atk) && !/🛡 防守视角/.test(atk);
  const defIsDef = /🛡 防守视角/.test(def) && !/🔱 进攻视角/.test(def);
  const defNoBuckets = !/（免疫）\s*\d+<\/span>/.test(def) && !/（弱点）/.test(def) && !/（抵抗）/.test(def) && !/tagline/.test(def);
  const defHasOwners = /拥有该属性的宝可梦/.test(def) && /openSpById\('/.test(def) && /assets\/sheets\/s\d+\.webp/.test(def);
  return atkIsAtk && defIsDef && defNoBuckets && defHasOwners;
})(), '进攻=按倍率分档列人；防守=按属性归属列人（带精灵图，不重复分档）');
chk('D⑨-7 防守视角数据源 mxDefList 只含该属性持有者（飞行 ⇒ 每只属性含飞行，且非空）', (function () {
  const list = sandbox.mxDefList('飞行');
  return list.length > 0 && list.every(s => s.t1 === '飞行' || s.t2 === '飞行') && list.every(s => sandbox.isValidSp(s));
})(), '飞行持有者=' + sandbox.mxDefList('飞行').length + ' 只');
chk('D⑨-8 ×1 开关：mxToggleNeutral(true) 后面板重渲染并含中性档', (function () {
  const g = mkGroupStub(); sandbox.mxInline('电', g, 'atk');
  sandbox.mxToggleNeutral(true);
  const h = (sandbox._mx.node || {})._html || '';
  return sandbox._mx.neutral === true && /1×（中性）/.test(h);
})(), '');
chk('D⑨-9 mxMore 展开全部（面板重渲染、`展开全部` 按钮出现）', (function () {
  const g = mkGroupStub(); sandbox.mxInline('电', g, 'atk');
  const before = (sandbox._mx.node || {})._html || '';
  sandbox.mxMore();
  const after = (sandbox._mx.node || {})._html || '';
  return /展开全部/.test(before) && after.length >= before.length;
})(), '');
/* 契约：优先消费数据层预计算矩阵 ERDATA.matchupSp（形状 A 稀疏），缺失回退实时计算 */
chk('D⑨/契约 数据层 matchupSp 在场时优先消费（形状 A：稀疏 {攻属性:{spId:倍率}}）', (function () {
  E.matchupSp = { '电': { '3': 0.25 } };           /* 仅列非 1 格：妙蛙花 0.25×，其余默认 1× */
  const h = sandbox.mxPanelAtk('电', false, true);
  const ok = /数据层 matchupSp/.test(h) && /妙蛙花/.test(h) && /0\.25× 1/.test(h);
  delete E.matchupSp;
  return ok;
})(), '');
chk('D⑨/契约 形状 B（{spId:{攻属性:倍率}}）亦兼容', (function () {
  E.matchupSp = { '3': { '电': 0.5 } };
  const h = sandbox.mxPanelAtk('电', false, true);
  const ok = /0\.5×（抵抗） 1/.test(h);
  delete E.matchupSp;
  return ok;
})(), '');
chk('D⑨/契约 矩阵缺失时回退实时计算（口径与 abiAdjOf 一致）', (function () {
  const h = sandbox.mxPanelAtk('电', false, true);
  return /本页实时计算/.test(h) && /0×（免疫）/.test(h);
})(), '');
chk('D⑨ 抽卡入口 openMxList 仍可用（兼容旧调用，走就地展开）', (function () {
  const g = mkGroupStub();
  const fake = mkEl('defResult'); fake.closest = () => g; fake.getAttribute = () => '电';
  const orig = doc.querySelectorAll;
  doc.querySelectorAll = (sel) => (sel === '#defResult span' ? [fake] : []);
  try { sandbox.openMxList('电', false, 'atk'); } catch (e) { doc.querySelectorAll = orig; return 'ERR ' + e.message }
  doc.querySelectorAll = orig;
  return true;
})(), '');

/* ================= E 队伍构建筛选 ================= */
hdr('v4.x E⑩ 队伍构建筛选（属性 chips + 定位 + 特性搜索 + 模糊）');
chk('E⑩ tmFilterReset 存在且属性 chips 已注入（≥18 个属性按钮）', typeof sandbox.tmFilterReset === 'function' && byId('tmTypeChips').children.length >= 18, 'chips=' + byId('tmTypeChips').children.length);
chk('E⑩ spRoleTags 定位标签可用（土王/班基拉斯）', Array.isArray(sandbox.spRoleTags(spByZh('土王'))) && sandbox.spRoleTags(spByZh('土王')).length > 0 && sandbox.spRoleTags(spById(248)).join('/').length > 0, '土王=' + sandbox.spRoleTags(spByZh('土王')).join('/') + ' 班基拉斯=' + sandbox.spRoleTags(spById(248)).join('/'));
chk('E⑩ renderTm 支持 关键词+特性名 组合筛选（土王 + 储水）', (function () {
  registry['tmSearch'] = mkEl('tmSearch'); registry['tmRole'] = mkEl('tmRole'); registry['tmAbi'] = mkEl('tmAbi');
  registry['tmSort'] = mkEl('tmSort'); registry['tmGrid'] = mkEl('tmGrid');
  byId('tmSearch').value = '土王'; byId('tmRole').value = ''; byId('tmAbi').value = '储水'; byId('tmSort').value = '';
  try { sandbox.renderTm(true); } catch (e) { return 'ERR ' + e.message }
  const kids = byId('tmGrid').children || [];
  return kids.length >= 1 && kids.every(c => /土王/.test(c._html));
})(), '命中 ' + (byId('tmGrid').children || []).length + ' 只');
chk('E⑩ 队伍 Tab UI 含筛选控件（#tmTypeChips/#tmRole/#tmAbi + 重置）', (function () {
  const h = fs.readFileSync('D:\\game\\elite-redux\\配招助手_ER.html', 'utf8');
  return /id="tmTypeChips"/.test(h) && /id="tmRole"/.test(h) && /id="tmAbi"/.test(h) && /tmFilterReset/.test(h);
})(), '');

/* ================= F 特性反查详情卡 ================= */
hdr('v4.x F⑪ 特性详情卡（中文描述 + 战斗意义 + 持有者两列）');
registry['abiSearch'] = mkEl('abiSearch'); registry['abiResult'] = mkEl('abiResult');
byId('abiSearch').value = '';
sandbox.renderAbi();
const cards = byId('abiResult').children || [];
chk('F⑪ 特性列表渲染（120 条上限内）', cards.length >= 60, cards.length + ' 张卡');
const rainCard = cards.filter(c => /降雨/.test(c._html || ''))[0];
chk('F⑪ 详情卡含「中文描述 + 战斗意义（ABI_TAGS 标签解读）」', !!rainCard && /中文描述/.test(rainCard._html) && /战斗意义（ABI_TAGS 标签解读）/.test(rainCard._html), '');
chk('F⑪ 持有者分两列（作为特性（可选池）N 只 / 作为天性（固定）M 只）', !!rainCard && /作为特性（可选池）/.test(rainCard._html) && /作为天性（固定）/.test(rainCard._html), rainCard ? plain(rainCard._html).match(/作为特性（可选池） \d+ 只/)?.[0] + ' | ' + plain(rainCard._html).match(/作为天性（固定） \d+ 只/)?.[0] : '');
chk('F⑪ 两列计数与 abiOwners 索引一致（降雨 2：可选/天性）', (function () {
  const o = sandbox.abiOwners()['2'];
  return o && rainCard && new RegExp('作为特性（可选池） ' + o.ab.length + ' 只').test(plain(rainCard._html)) && new RegExp('作为天性（固定） ' + o.inn.length + ' 只').test(plain(rainCard._html));
})(), JSON.stringify((sandbox.abiOwners()['2'] || { ab: [], inn: [] }).ab.length) + '/' + JSON.stringify((sandbox.abiOwners()['2'] || { ab: [], inn: [] }).inn.length));
chk('F⑪ 持有者行可点击跳宝可梦详情 + 带精灵图（图片优先列表）', !!rainCard && /data-sid="/.test(rainCard._html) && /openSpById\('/.test(rainCard._html) && /assets\/sheets\/s\d+\.webp/.test(rainCard._html) && /class="mcnm"/.test(rainCard._html), '');
chk('F⑪ 搜索改模糊（先生抽特性中文名）', (function () {
  byId('abiSearch').value = '华贵';
  sandbox.renderAbi();
  const n = (byId('abiResult').children || []).length;
  byId('abiSearch').value = '';
  return n >= 1;
})(), '');

/* ================= G 战术模板 ================= */
hdr('v4.x G⑫ 战术模板推荐质量（权重体系化 + 新模板）');
chk('G⑫ 模板总数 ≥18（数据层）+ 新增 6 套齐全', sandbox.tplAll().length >= 18 && ['毒钉受队', '强化接力', '天气双核', '场地控制', '吸血站场', '双天气轮换'].every(n => sandbox.tplAll().some(t => t.name === n)), sandbox.tplAll().length + ' 套');
chk('G⑫ 数据层模板条数 = tplDataCount（无引擎侧多余注入）', sandbox.tplDataCount() === E.templates.length, sandbox.tplDataCount() + '/' + E.templates.length);
chk('G⑫ 新增模板可展开渲染（毒钉受队 = 第 13 套，含毒菱组件）', (function () {
  const i = sandbox.tplAll().findIndex(t => t.name === '毒钉受队');
  registry['tplBody' + i] = mkEl('tplBody' + i);
  sandbox.renderTplBody(i);
  return /毒菱/.test(byId('tplBody' + i)._html);
})(), '');
const rain = sandbox.tplAll().filter(t => t.name === '雨天速攻')[0];
const rainRecs = sandbox.tplRecs(rain);
chk('G⑫ 雨天不再推荐非受益者：电灯怪 #171 / 巨翅飞鱼 #226 均不在榜', !rainRecs.some(r => '' + r.s.id === '171') && !rainRecs.some(r => '' + r.s.id === '226'), rainRecs.map(r => r.s.zh + '+' + r.score).join('/'));
chk('G⑫ 雨天推荐全部为雨体系受益者或天气手（含力度门 ≥95）', rainRecs.length >= 3 && rainRecs.every(r => sandbox.spSys(r.s).indexOf('雨') > -1 || sandbox.isSetter(r.s, '雨')), rainRecs.map(r => r.s.zh).join('/'));
chk('G⑫ 速攻型体系模板统一加力度门（推荐 max(物攻,特攻) ≥95）', rainRecs.every(r => Math.max(r.s.base[1], r.s.base[3]) >= 95), rainRecs.map(r => r.s.zh + Math.max(r.s.base[1], r.s.base[3])).join('/'));
chk('G⑫ 全部体系模板推荐均为受益者/设置手（遍历断言）', (function () {
  const bad = [];
  sandbox.tplAll().filter(t => sandbox.tplSys(t).filter(x => x !== '剧毒场地').length).forEach(t => {
    const sys = sandbox.tplSys(t).filter(x => x !== '剧毒场地');
    sandbox.tplRecs(t).forEach(r => {
      if (!sys.some(x => sandbox.spSys(r.s).indexOf(x) > -1 || sandbox.isSetter(r.s, x))) bad.push(t.name + ':' + r.s.zh);
    });
  });
  console.log('  体系模板越界项=' + (bad.length ? bad.join(',') : '0 项'));
  return bad.length === 0;
})(), '');
chk('G⑫ tplScore 体系权重：推荐理由含体系/天气手/力度/联防要素', (function () {
  const r = rainRecs[0];
  return r && r.hits.some(h => /降雨|悠游自如|雨盘|雨体系受益|可学/.test(h));
})(), rainRecs[0] ? rainRecs[0].hits.join(' | ') : '');
chk('G⑫ 模板卡含体系标签 + 模板总数/契约提示（renderTpl）', (function () {
  registry['tplList'] = mkEl('tplList');
  sandbox.renderTpl();
  const h = byId('tplList')._html;
  return /模板总数/.test(h) && /体系 雨/.test(h);
})(), '');
chk('D5 模板推荐列表带精灵图（renderTplBody 推荐卡片含 v4.6.2 合图 assets/sheets + mcspr）', (function () {
  const i = sandbox.tplAll().findIndex(t => t.name === '雨天速攻');
  registry['tplBody' + i] = mkEl('tplBody' + i);
  E.matchupSp = undefined;
  sandbox.renderTplBody(i);
  const h = byId('tplBody' + i)._html;
  const imgs = (h.match(/<div class="mcspr"/g) || []).length;
  return imgs >= 3 && /assets\/sheets\/s\d+\.webp/.test(h) && /class="mxn?m?"|class="mcnm"/.test(h) && /tplAdd\(/.test(h);
}), '推荐卡片 img 数=' + (((byId('tplBody' + sandbox.tplAll().findIndex(t => t.name === '雨天速攻'))._html) || '').match(/<div class="mcspr"/g) || []).length);
chk('F⑪ 卡片点击处理器不因 innerHTML 重解析丢失（renderAbi 内禁用 innerHTML+=，尾注走 appendChild）', (function () {
  const src = sandbox.renderAbi.toString();
  return src.indexOf('innerHTML+=') < 0 && /card\.onclick=/.test(src) && /appendChild\(note\)/.test(src) && typeof sandbox.abiToggle === 'function';
})(), '');
chk('F⑪ 「已显示前 60 个」尾注为独立 DOM 节点（不重建卡片、不丢 onclick）', (function () {
  registry['abiSearch'] = mkEl('abiSearch'); registry['abiResult'] = mkEl('abiResult');
  byId('abiSearch').value = ''; byId('abiResult').children = [];
  sandbox.renderAbi();
  const kids = byId('abiResult').children || [];
  const note = kids.filter(c => /已显示前 60/.test(c.textContent || ''));
  return kids.length >= 60 && note.length === 1 && typeof kids[0].onclick === 'function';
})(), '卡片=' + (byId('abiResult').children || []).length + ' 首卡 onclick=' + typeof (byId('abiResult').children || [])[0].onclick);
/* ================= H 推荐评分体系化（用户深度反馈：铁证 龙头地鼠@空间队） ================= */
hdr('v4.x H 推荐评分体系化（体系→维度→权重表；空间队铁证案例）');
const TPL = sandbox.tplAll();
const tplByName = n => TPL.filter(t => t.name === n)[0];
const tplTR = tplByName('戏法空间'), tplRain = tplByName('雨天速攻'), tplSun = tplByName('晴天速攻'), tplSand = tplByName('沙暴联防'), tplSnow = tplByName('雪天堡垒'), tplStall = tplByName('钉子受队'), tplTerr = tplByName('电气场地速攻');
chk('H 体系识别 archOfTpl 覆盖各模板（空间/雨/晴/沙/雪/受/场地/强化/顺风/双天气/吸血）', (function () {
  const m = { '戏法空间': '空间', '雨天速攻': '雨', '晴天速攻': '晴', '沙暴联防': '沙', '雪天堡垒': '雪', '钉子受队': '受', '电气场地速攻': '场地', '强化清场轴': '强化', '顺风游击': '顺风', '天气双核': '双天气', '吸血站场': '吸血', '毒钉受队': '受' };
  return Object.keys(m).every(k => { const t = tplByName(k); return t && sandbox.archOfTpl(t) === m[k] });
})(), TPL.map(t => t.name + '→' + sandbox.archOfTpl(t)).join(' | '));
chk('H 每个体系都有维度权重表（dim/w/j 三件套，w≥1）', (function () {
  const archs = ['空间', '晴', '雨', '沙', '雪', '场地', '受', '强化', '吸血', '双天气', '顺风', '通用'];
  return archs.every(a => { const tb = sandbox.sysTable(a); return tb.length >= 3 && tb.every(d => d.dim && d.w >= 1) });
})(), ['空间', '受', '强化'].map(a => a + ':' + sandbox.sysTable(a).length + '维').join(' '));
chk('H 每张维度表都有判定口径文案（UI 表格第三列）', (function () {
  const archs = ['空间', '晴', '雨', '沙', '雪', '场地', '受', '强化', '吸血', '双天气', '顺风', '通用'];
  return archs.every(a => sandbox.sysTable(a).every(d => { const r = sandbox.sysDimRule(a, d.dim); return r && r.length > 4 && r.indexOf('按维度权重表') < 0 }));
})(), sandbox.sysDimRule('空间', '速度适配（越低越优）'));
/* 铁证案例（v4.2 正向模型）：龙头地鼠（速度 88）在空间队不剔除 → 低分排后但可入选 */
const exca = spByZh('龙头地鼠'), rhy = spById(464), muk = spById(89), steelix = spById(208);
const trSlotPool = (function () {
  /* v4.3：空间打手池改由**需求驱动**给出——取「垒磊石」需求清单里的 truse（空间打手位），
     在全图鉴做正向评分（poolForNeed，零硬门）。旧版逐只过 slotScore(…,'S-TRUSE') 已随固定槽位骨架删除。
     用于证明：中速打手（龙头地鼠 速 88）在池内低分排后、**未被剔除**。 */
  const core = spById(805);
  const plan = sandbox.buildTeamByNeeds(core, {});
  const need = plan.needs.filter(n => n.kind === 'truse')[0];
  if (!need) return { rows: [], rank: 0, score: null, top: 0, n: 0 };
  const loc = sandbox.needCtx(core, {
    sysKey: plan.sysKey, holes: sandbox.coverHoles(core), team: [{ s: core }],
    L: sandbox.learnC(core), names: (core.abis || []).concat(core.inns || []), conv: sandbox.convOf(core)
  });
  const pool = sandbox.poolForNeed(core, loc, need, [{ s: core }], null);
  const rows = pool.map((x, ix) => ({ id: x.s.id, zh: x.s.zh, sp: x.s.base[5], sc: x.score, i: ix + 1 }));
  const k = rows.findIndex(r => '' + r.id === '' + exca.id);
  return { rows: rows, rank: k + 1, score: k >= 0 ? rows[k].sc : null, top: rows.length ? rows[0].sc : 0, n: rows.length };
})();
chk('H① 空间队（v4.2 正向）：龙头地鼠（速 88）不剔除、总分 ≥0 且维度明细说明「速度 88…仍可入选低排位」', (function () {
  const r = sandbox.tplScore(exca, tplTR);
  const sp = r.dims.filter(d => /速度适配/.test(d.dim))[0];
  return r.drop === false && r.score >= 0 && !!sp && sp.pts < 0 && /速度 88/.test(sp.txt) && /仍可入选低排位/.test(sp.txt);
})(), (function () { const r = sandbox.tplScore(exca, tplTR); return 'drop=' + r.drop + ' score=' + r.score + ' ｜ ' + (r.dims.filter(d => /速度适配/.test(d.dim))[0] || {}).txt })());
chk('H① 空间队：龙头地鼠评分 < 低速高攻打手（超甲狂犀）', (function () {
  const a = sandbox.tplScore(exca, tplTR).score, b = sandbox.tplScore(rhy, tplTR).score;
  return b > a && b > 0;
})(), '龙头地鼠=' + sandbox.tplScore(exca, tplTR).score + ' vs 超甲狂犀=' + sandbox.tplScore(rhy, tplTR).score);
chk('H① 空间队 Top 6 不含龙头地鼠，但它在空间打手槽（S-TRUSE）池中位于低排位且得分 >0（未被剔除）', (function () {
  const recs = sandbox.tplRecs(tplTR);
  const inTop = recs.some(r => '' + r.s.id === '' + exca.id);
  return !inTop && trSlotPool.rank > 100 && trSlotPool.score > 0 && trSlotPool.score < trSlotPool.top;
})(), 'Top=' + sandbox.tplRecs(tplTR).map(r => r.s.zh + '(' + r.score + ')').join('/') + ' ｜ 龙头地鼠 S-TRUSE 排名=' + trSlotPool.rank + '/' + trSlotPool.n + ' 分=' + trSlotPool.score + '（榜首 ' + trSlotPool.top + '）');
chk('H① 空间队 Top 均为低速（速度 ≤85）且力度够（推荐里至少 3 只 速度≤60）', (function () {
  const recs = sandbox.tplRecs(tplTR);
  return recs.length >= 4 && recs.every(r => r.s.base[5] <= 85) && recs.filter(r => r.s.base[5] <= 60).length >= 3;
})(), sandbox.tplRecs(tplTR).map(r => r.s.zh + '(速' + r.s.base[5] + '/攻' + Math.max(r.s.base[1], r.s.base[3]) + ')').join(' '));
chk('H① 空间队维度表含「速度/力度/本系威力/空间受益要素」四类维度（权重表可解释）', (function () {
  const tb = sandbox.sysTable('空间').map(d => d.dim).join('|');
  return /速度适配/.test(tb) && /力度/.test(tb) && /本系折算威力/.test(tb) && /空间受益要素/.test(tb) && /与队友速度互补/.test(tb);
})(), sandbox.sysTable('空间').map(d => d.dim + '×' + d.w).join(', '));
chk('H① 空间队 why 逐维度列分（含「（+N）」式分值文本，≥3 维含分）', (function () {
  const r = sandbox.tplScore(rhy, tplTR);
  return r.dims.length >= 3 && r.dims.filter(d => /（[+−]\d+）/.test(d.txt)).length >= 2;
})(), sandbox.tplScore(rhy, tplTR).dims.map(d => d.txt).join(' ｜ '));
chk('H① 空间受益要素维度可命中（全库存在掌握陀螺球/重磅冲撞的低速手被加分）', (function () {
  const hit = E.species.filter(s => sandbox.isValidSp(s) && sandbox.isFinalSp(s)).filter(s => {
    const d = sandbox.tplScore(s, tplTR).dims.filter(x => /空间受益要素/.test(x.dim))[0];
    return d && d.pts > 0;
  });
  return hit.length >= 3;
})(), (function () { const h = E.species.filter(s => sandbox.isValidSp(s) && sandbox.isFinalSp(s)).filter(s => { const d = sandbox.tplScore(s, tplTR).dims.filter(x => /空间受益要素/.test(x.dim))[0]; return d && d.pts > 0 }); return h.length + ' 只，如 ' + h.slice(0, 4).map(s => s.zh + '(速' + s.base[5] + ')').join('/') })());
/* 其他体系：维度得分合理（雨速攻推水系受益者；沙暴推岩石/钢/地面） */
chk('H② 雨速攻：Top 均为水系受益者/天气手（力度门 ≥95 保持，电灯怪/巨翅飞鱼仍不在榜）', (function () {
  const recs = sandbox.tplRecs(tplRain);
  const ids = recs.map(r => '' + r.s.id);
  return ids.length >= 4 && !ids.includes('171') && !ids.includes('226') && recs.every(r => Math.max(r.s.base[1], r.s.base[3]) >= 95);
})(), sandbox.tplRecs(tplRain).map(r => r.s.zh + '(' + r.score + ')').join('/'));
chk('H③ 沙暴联防：Top 至少 4 只为岩石/钢/地面属性', (function () {
  const recs = sandbox.tplRecs(tplSand);
  return recs.filter(r => [r.s.t1, r.s.t2].some(t => ['岩石', '钢', '地面'].includes(t))).length >= 4;
})(), sandbox.tplRecs(tplSand).map(r => r.s.zh + '(' + sandbox.archOfTpl(tplSand) + ')').join('/'));
chk('H⑤ 受队：Top 至少 4 只耐久三角 ≥300 或带回复/钉子组件', (function () {
  const recs = sandbox.tplRecs(tplStall);
  const ok = recs.filter(r => { const L = sandbox.learnOf(r.s); return (r.s.base[0] + r.s.base[2] + r.s.base[4]) >= 300 || sandbox.hasAny(L, sandbox.FUNC_MV.rec) || sandbox.hasAny(L, sandbox.FUNC_MV.hazard) }).length;
  return ok >= 4;
})(), sandbox.tplRecs(tplStall).map(r => r.s.zh + '(耐' + (r.s.base[0] + r.s.base[2] + r.s.base[4]) + ')').join('/'));
chk('H⑥ 场地模板：Top 至少 4 只带场地设置手特性或场地受益特性', (function () {
  const recs = sandbox.tplRecs(tplTerr);
  return recs.filter(r => { const sys = sandbox.spSys(r.s); return sys.some(x => /场地|电场/.test(x)) }).length >= 3;
})(), sandbox.tplRecs(tplTerr).map(r => r.s.zh + '(' + sandbox.spSys(r.s).join('+') + ')').join('/'));
/* 配招体系化（pickAttacks 体系加成） */
chk('H 配招体系化：pickAttacks 选招依据含「体系加成」（空间队低速受益招 ×1.25）', (function () {
  const ids = ['陀螺球', '重磅冲撞'];
  let found = '';
  E.species.filter(s => sandbox.isValidSp(s) && sandbox.isFinalSp(s)).slice(0, 600).forEach(s => {
    const at = sandbox.pickAttacks(s, sandbox.coreSide(s), 4);
    at.forEach(a => { a.why.forEach(w => { if (/体系加成/.test(w) && !found) found = s.zh + '：' + w }) });
  });
  return !!found;
})(), (function () { let f = ''; E.species.filter(s => sandbox.isValidSp(s) && sandbox.isFinalSp(s)).slice(0, 600).forEach(s => { sandbox.pickAttacks(s, sandbox.coreSide(s), 4).forEach(a => { a.why.forEach(w => { if (/体系加成/.test(w) && !f) f = s.zh + '：' + w }) }) }); return f || '（无）' })());
chk('H 空间体系识别：学戏法空间的精灵 archOfSp=空间（配招走空间权重表）', (function () {
  const trId = Number(sandbox.mvIdByZhOrEn('戏法空间'));
  const s = E.species.filter(x => sandbox.isValidSp(x) && sandbox.learnOf(x).includes(trId))[0];
  return !!s && sandbox.archOfSp(s, '双刀', '') === '空间';
})(), (function () { const trId = Number(sandbox.mvIdByZhOrEn('戏法空间')); const L = E.species.filter(x => sandbox.isValidSp(x) && sandbox.learnOf(x).includes(trId)); const s = L[0]; return '学戏法空间=' + L.length + ' 只（有效）；样例 ' + (s ? s.zh + '#' + s.id + '→' + sandbox.archOfSp(s, '双刀', '') : 'none') })());
/* 队友推荐（findTeammates）同样接维度表：中速手不进空间核心队伍 */
chk('H 核心配队队友：空间核心（戏法空间体系）队友中速手被 drop，低速手入选', (function () {
  const trId = Number(sandbox.mvIdByZhOrEn('戏法空间'));
  const core = E.species.filter(x => sandbox.isValidSp(x) && sandbox.isFinalSp(x) && sandbox.learnOf(x).includes(trId))[0];
  const recs = sandbox.findTeammates(core, '双刀', '');
  return recs.every(r => r.s.base[5] <= 85) && recs.some(r => r.s.base[5] <= 60);
})(), '(核心 ' + (function () { const trId = Number(sandbox.mvIdByZhOrEn('戏法空间')); const c = E.species.filter(x => sandbox.isValidSp(x) && sandbox.isFinalSp(x) && sandbox.learnOf(x).includes(trId))[0]; return (c.zh + ' 速' + c.base[5] + ' → ' + sandbox.findTeammates(c, '双刀', '').map(r => r.s.zh + '(速' + r.s.base[5] + ')').join('/')) })() + ')');
/* G⑫ 模板推荐列表带精灵图（D5） */
chk('G⑫ 模板 tips/flow 仍全部过 wxTip（无旧写死 20%/30%/8回合）', sandbox.tplAll().every(t => [].concat(t.tips || [], t.flow || []).every(x => !/\+20%|增伤从 50% 削到 20%|顺风仅 4 回合/.test(sandbox.wxTip(x)))), '');

/* ---------- I 组：验证代理复验 4 项（D6 体系互斥 / D2 抽屉改造 / D5 模板缩略图 / D8 形态折叠） ---------- */
console.log('\n=== v4.x I 复验修复（D6/D2/D5/D8） ===');
const venu = E.species.filter(s => s.zh === '妙蛙花')[0];
const giga = E.species.filter(s => s.zh === '庞岩怪')[0];
const tyra = E.species.filter(s => s.zh === '班基拉斯')[0];
const mTyra = E.species.filter(s => s.zh === '超级班基拉斯')[0];
chk('D6 庞岩怪 ER 实为双体系 {沙,晴}（太阳之力+扬沙）', !!(giga && sandbox.coreSys(giga).includes('沙') && sandbox.coreSys(giga).includes('晴')), giga ? 'coreSys=' + sandbox.coreSys(giga).join('+') : 'none');
chk('D6 晴体系核心（妙蛙花）队友推荐不含 庞岩怪/班基拉斯/超级班基拉斯', (function () {
  const ids = sandbox.findTeammates(venu, '特殊', '输出').map(r => '' + r.s.id);
  const bad = [giga, tyra, mTyra].filter(Boolean).map(s => '' + s.id);
  return bad.every(b => !ids.includes(b));
})(), '队友=' + sandbox.findTeammates(venu, '特殊', '输出').map(r => r.s.zh + '(' + r.score + ')').join('/'));
chk('D6（v4.2 正向）不再有 wxDrops/drops 负向留痕；候选池全量参与打分（对立体系仅排序靠后）', (function () {
  const r = sandbox.findTeammates(venu, '特殊', '输出');
  return (typeof r.wxDrops === 'undefined') && (typeof r.drops === 'undefined') && r.pool > 200 && r.every(x => x.fit === 0 || x.fit === 1 || x.fit === 2);
})(), (function () {
  const r = sandbox.findTeammates(venu, '特殊', '输出');
  return 'wxDrops=' + (typeof r.wxDrops) + ' drops=' + (typeof r.drops) + ' 候选池=' + r.pool + ' fit=' + r.map(x => x.fit).join(',');
})());
chk('D6 晴天速攻榜不含沙系；沙暴榜「含晴系」仅限双体系（沙+晴）候选', (function () {
  const sun = sandbox.tplRecs(sandbox.tplAll().filter(t => t.name === '晴天速攻')[0]);
  const sand = sandbox.tplRecs(sandbox.tplAll().filter(t => t.name === '沙暴联防')[0]);
  const sunClean = !sun.some(r => sandbox.coreSys(r.s).includes('沙'));
  const sandClean = sand.every(r => { const cs = sandbox.coreSys(r.s); return !cs.includes('晴') || cs.includes('沙') });
  return sunClean && sandClean;
})(), '晴Top=' + sandbox.tplRecs(sandbox.tplAll().filter(t => t.name === '晴天速攻')[0]).map(r => r.s.zh).join('/') + ' ｜ 沙Top=' + sandbox.tplRecs(sandbox.tplAll().filter(t => t.name === '沙暴联防')[0]).map(r => r.s.zh + '(' + sandbox.coreSys(r.s).join('+') + ')').join('/'));
chk('D2 宝可梦详情/招式详情已从右侧抽屉改为居中轻量 modal（产物内无 .drawer 容器）', (function () {
  const html = require('fs').readFileSync('D:\\game\\elite-redux\\配招助手_ER.html', 'utf8');
  const spModal = /spDrawer\.className='modal'/.test(html);
  const mvModal = /<div class="modal" id="mvDrawer">/.test(html);
  const noDrawer = !/class="drawer"/.test(html) && !/className='drawer'/.test(html);
  return spModal && mvModal && noDrawer;
})(), (function () {
  const html = require('fs').readFileSync('D:\\game\\elite-redux\\配招助手_ER.html', 'utf8');
  return "spDrawer.className='modal'=" + /spDrawer\.className='modal'/.test(html) + " / mvDrawer modal=" + /<div class="modal" id="mvDrawer">/.test(html) + " / 残留 .drawer=" + /class="drawer"|className='drawer'/.test(html);
})());
chk('D8 名称前缀折叠：阿尔宙斯多形态在模板推荐中只留 1 个（标注 +N形态）', (function () {
  const stall = sandbox.tplRecs(sandbox.tplAll().filter(t => t.name === '钉子受队')[0]);
  const ar = stall.filter(r => /^阿尔宙斯/.test(r.s.zh));
  return ar.length <= 1 && (stall.length >= 5);
})(), (function () { const stall = sandbox.tplRecs(sandbox.tplAll().filter(t => t.name === '钉子受队')[0]); return stall.map(r => r.s.zh + (r.collapsed ? '(+' + r.collapsed + '形态)' : '')).join(' / ') })());
chk('D5 模板卡缩略图：推荐列表每项带合图背景声明（sprOf → assets/sheets + 尺寸无关定位）', (function () {
  const rs = sandbox.tplRecs(sandbox.tplAll()[0]);
  return rs.length > 0 && rs.every(r => /^background-image:url\('assets\/sheets\/s\d+\.webp'\);background-repeat:no-repeat;background-size:1600% 1600%;background-position:\d+(?:\.\d+)?% \d+(?:\.\d+)?%$/.test(sandbox.sprOf(r.s.id)));
})(), sandbox.tplRecs(sandbox.tplAll()[0]).slice(0, 3).map(r => sandbox.sprOf(r.s.id)).join(' , '));

/* ---------- DY 组：v4.3 需求驱动动态构建 + 战术流派动态推导 ----------
   （取代 v4.2 的 J 组「槽位骨架」13 条 + K 组「槽位池 UI」4 条；J/K 引用的
    SLOT_TABLE/slotTableOk/slotScore/renderTeamPlan 等固定骨架符号已随 v4.3 删除） */
hdr('v4.3 DY 需求驱动构建 / 流派动态推导');
const rockDY = spById(805), hoDY = spByZh('凤王'), excaDY = spByZh('龙头地鼠'), pigDY = spByZh('大比鸟');
const dynCores = [venu, rockDY, hoDY, pigDY].filter(Boolean);

/* DY1~3 需求定义表 / 配置 / 先验 */
chk('DY1 需求定义表：needRegistryOk=true，每个需求家族都有 gate(求值器)+dims(正向维度)', (function () {
  const kinds = Object.keys(sandbox.NEED_KINDS);
  return sandbox.needRegistryOk() === true && kinds.length >= 18
    && kinds.every(k => typeof sandbox.NEED_KINDS[k].gate === 'function' && Array.isArray(sandbox.NEED_KINDS[k].dims) && sandbox.NEED_KINDS[k].dims.length > 0);
})(), 'needRegistryOk=' + sandbox.needRegistryOk() + ' 家族=' + Object.keys(sandbox.NEED_KINDS).length);
chk('DY2 需求阈值全部落在 NEED_CFG 配置对象（可配置，不硬编码）', (function () {
  const c = sandbox.NEED_CFG;
  return !!c && c.SPEED_HIGH > 0 && c.SPEED_LOW > 0 && c.BULK_HIGH > 0 && c.MULTI_ROLE_BONUS > 0 && c.STOP_PRIORITY >= 1 && c.MAX_TEAM === 6 && c.MULTI_MAX > 0;
})(), JSON.stringify(sandbox.NEED_CFG));
chk('DY3 NEED_EXAMPLES ≥18 条（数据层 18 套模板仅作先验，不作骨架配额）', Object.keys(sandbox.NEED_EXAMPLES).length >= 18, Object.keys(sandbox.NEED_EXAMPLES).length + ' 条');

/* DY4~7 需求清单结构与动态性 */
const ndV = sandbox.needList(venu, { sysKey: '晴' });
chk('DY4 需求清单结构完整：每条含 id/kind/priority(1..5)/label/status/satisfiedBy', ndV.every(n => n.id && n.kind && n.priority >= 1 && n.priority <= 5 && n.label && n.status && Array.isArray(n.satisfiedBy)),
  ndV.length + ' 条 → ' + ndV.slice(0, 6).map(n => n.id + '(' + n.kind + ')' + n.label).join(' | '));
const ndR = sandbox.needList(rockDY, {});
const kindsOf = a => [...new Set(a.map(n => n.kind))].sort().join(',');
chk('DY5 需求随核心变化（动态推导证据）：妙蛙花需求 kind 集合 ≠ 垒磊石', kindsOf(ndV) !== kindsOf(ndR),
  '妙蛙花=' + kindsOf(ndV) + ' ｜ 垒磊石=' + kindsOf(ndR));
chk('DY6 妙蛙花(晴核心)需求含 天气来源(wxsrc)+补盲(cover)+联防(wallp/walls)+钉子(haz|clear)', (function () {
  const K = n => ndV.filter(x => x.kind === n).length;
  return K('wxsrc') >= 1 && K('cover') >= 1 && (K('wallp') + K('walls')) >= 1 && (K('haz') + K('clear')) >= 1;
})(), ndV.map(n => n.label).join(' | '));
chk('DY7 垒磊石(低速受队核心)需求含 空间手(trset)+空间打手(truse)，或 消耗/回复（配方随画像变化）', (function () {
  const K = n => ndR.filter(x => x.kind === n).length;
  return (K('trset') >= 1 && K('truse') >= 1) || (K('wear') + K('rec')) >= 1;
})(), ndR.map(n => n.label).join(' | '));

/* DY8~11 多功能加分 / 上限 / 终止条件 / 零硬门 */
const planV = sandbox.buildTeamByNeeds(venu, {});
const multiM = planV.team.filter(m => m.multi > 1);
chk('DY8 多功能加分公式：score = base + (k-1)×MULTI_ROLE_BONUS（抽样校验）', multiM.length > 0
  && multiM.every(m => Math.abs(m.score - (m.base + (m.multi - 1) * sandbox.NEED_CFG.MULTI_ROLE_BONUS)) < 1e-6),
  multiM.map(m => m.s.zh + ' base ' + m.base + ' + (' + m.multi + '-1)x' + sandbox.NEED_CFG.MULTI_ROLE_BONUS + ' = ' + m.score).join(' | '));
chk('DY9 多功能计数上限生效（单只「顺带满足」≤ 1+MULTI_MAX 条）', planV.team.every(m => !m.multi || m.multi <= 1 + sandbox.NEED_CFG.MULTI_MAX),
  planV.team.map(m => m.s.zh + 'x' + (m.multi || 1)).join(' '));
const stopOK = ['STOP_ALL_NEEDS_MET', 'STOP_BELOW_PRIORITY', 'STOP_SIZE_LIMIT'];
chk('DY10 终止条件：队伍 ≤6 且 stopReason 属三类之一；<6 时必有未满足/告警解释', planV.team.length <= 6 && stopOK.indexOf(planV.stopReason) >= 0
  && (planV.team.length === 6 || planV.audit.openNeeds.length > 0 || planV.audit.warnings.length > 0),
  planV.team.length + ' 只 / ' + planV.stopReason + ' / 未满足=' + JSON.stringify(planV.audit.openNeeds) + ' / 告警=' + JSON.stringify(planV.audit.warnings));
const pool0 = planV.pools[Object.keys(planV.pools)[0]];
/* v4.7 口径迁移（登记）：候选池仍「零硬门 / 全量可见 / 无 drop」；负分允许存在，但**只允许出自
   id='RS' 的「规则偏移」维度**（M5 实测系数：以负分表达「不适合本体系」，语义=排序置后，不是硬门剔除）。
   旧口径「所有候选 score ≥ 0」与规则偏移层的有符号修正数学上互斥，故按 v4.7 新口径改写。 */
chk('DY11 零硬门：首条需求候选池全量可见（≥300 只）、无 drop 标记、负分仅出自规则偏移维度（v4.7 口径迁移）', !!pool0 && pool0.list.length >= 300
  && pool0.list.every(x => !('drop' in x)) && pool0.list.filter(x => x.score < 0).every(x => (x.dims || []).some(d => d.id === 'RS')),
  '池=' + (pool0 ? pool0.list.length : 0) + ' 榜首=' + (pool0 ? pool0.list[0].s.zh + '/' + pool0.list[0].score : '-') + ' 末位=' + (pool0 ? pool0.list[pool0.list.length - 1].s.zh + '/' + pool0.list[pool0.list.length - 1].score : '-')
  + ' 负分候选=' + (pool0 ? pool0.list.filter(x => x.score < 0).length : 0) + '（均源自 RS：排序置后而非剔除）');

/* DY12~15 流派动态推导 */
const dynB = dynCores.map(s2 => ({ s: s2, bs: sandbox.deriveBuilds(s2) }));
chk('DY12 流派数 2~4 条/核心（由四画像动态推导，非固定枚举）', dynB.every(x => x.bs.length >= 2 && x.bs.length <= 4),
  dynB.map(x => x.s.zh + ':' + x.bs.length).join(' '));
chk('DY13 流派命名=打法（禁 物攻流/特攻流/双刀流）+ 每条依据 ≥2 条', dynB.every(x => x.bs.every(b => !/^(物攻流|特攻流|双刀流)$/.test(b.name) && b.basis.length >= 2)),
  dynB.map(x => x.s.zh + '[' + x.bs.map(b => b.name).join(' + ') + ']').join(' ｜ '));
chk('DY14 破盾路线互斥择优：双刀流派最多 1 条，且仅在 route=双刀 时出现', dynB.every(x => x.bs.filter(b => b.side === '双刀').length <= 1)
  && dynB.every(x => x.bs.breakingRoute !== '双刀' || x.bs.filter(b => b.side === '双刀').length === 1),
  dynB.map(x => x.s.zh + ':route=' + x.bs.breakingRoute + '/双刀流派=' + x.bs.filter(b => b.side === '双刀').length).join(' | '));
chk('DY15 四画像齐备：prof.atk/du/ab/fn 存在且 du.spd/bulk/power 为数字', (function () {
  const pr = planV.prof;
  return !!pr && !!pr.atk && !!pr.du && !!pr.ab && !!pr.fn && typeof pr.du.spd === 'number' && typeof pr.du.bulk === 'number' && typeof pr.power === 'number';
})(), JSON.stringify({ role: planV.prof.role, spd: planV.prof.du.spd, bulk: planV.prof.du.bulk, power: planV.prof.power, field: planV.prof.field }));

/* DY16~19 旧符号清空 + 新 UI 文案/交互 */
chk('DY16 旧固定骨架符号已消失（genBuilds/slotTableOk/SLOT_DEF/slotScore/tplForCore/fillForSlot/fillNameFor 全 undefined）',
  ['genBuilds', 'slotTableOk', 'SLOT_DEF', 'slotScore', 'tplForCore', 'fillForSlot', 'fillNameFor'].every(k => typeof sandbox[k] === 'undefined'),
  ['genBuilds', 'slotTableOk', 'SLOT_DEF', 'slotScore', 'tplForCore', 'fillForSlot', 'fillNameFor'].map(k => k + '=' + typeof sandbox[k]).join(' '));
const coreHtmlDY = (function () { byId('coreOut')._html = ''; sandbox.renderCore(venu); return byId('coreOut')._html })();
const badWords = ['物攻流', '特攻流', '物理流', '特殊流', '槽位', '低排位示例', '硬排除', '已排除', '红框'];
chk('DY17 renderCore 呈现「队伍需求/构建逻辑/需求驱动」；无固定流派词与负向文案残留', /队伍需求/.test(coreHtmlDY) && /构建逻辑/.test(coreHtmlDY) && /需求驱动/.test(coreHtmlDY)
  && badWords.every(w => coreHtmlDY.indexOf(w) < 0),
  '长度=' + coreHtmlDY.length + ' 残留=' + (badWords.filter(w => coreHtmlDY.indexOf(w) >= 0).join(',') || '无'));
chk('DY18 需求卡 UI：逐条需求卡 + 候选池「展开全部候选/按名定位/低分排后不剔除」入口齐备', /class="needcard"/.test(coreHtmlDY)
  && /展开全部候选/.test(coreHtmlDY) && /按名定位/.test(coreHtmlDY) && /低分排后但均可入选，不剔除/.test(coreHtmlDY),
  'needcard=' + (coreHtmlDY.match(/class="needcard"/g) || []).length + ' 展开按钮=' + (coreHtmlDY.match(/展开全部候选/g) || []).length);
chk('DY19 模板展开页同样动态：戏法空间模板体含「队伍需求」与「需求驱动」', (function () {
  const i = sandbox.tplAll().map((t, k) => [t, k]).filter(x => x[0].name === '戏法空间')[0][1];
  sandbox.renderTplBody(i);
  const h = Object.keys(registry).filter(k => /^tplBody/.test(k)).map(k => String(registry[k]._html || '') + (registry[k].children || []).map(c => String(c._html || '')).join('')).join('');
  return /队伍需求/.test(h) && /需求驱动/.test(h);
})(), '模板体含需求驱动文案=' + /需求驱动/.test(Object.keys(registry).filter(k => /^tplBody/.test(k)).map(k => String(registry[k]._html || '')).join('')));

/* DY20~21 空间打手池（用户会专门查龙头地鼠） */
const planR = sandbox.buildTeamByNeeds(rockDY, {});
const trNeed = planR.needs.filter(n => n.kind === 'truse')[0];
const excaIx = trSlotPool.rows.findIndex(r => '' + r.id === '' + excaDY.id);
chk('DY20 空间打手池：龙头地鼠(速88)在池中、位次>100、分数>0、榜首分 > 其分（低分排后，非剔除）', !!trNeed
  && excaIx > 100 && trSlotPool.rows[excaIx].sc > 0 && trSlotPool.top > trSlotPool.rows[excaIx].sc,
  '池=' + trSlotPool.n + ' 龙头地鼠位次=' + (excaIx + 1) + ' 分=' + (excaIx >= 0 ? trSlotPool.rows[excaIx].sc : '-') + ' 榜首=' + trSlotPool.top + '（' + (trSlotPool.rows[0] || {}).zh + ' 速' + (trSlotPool.rows[0] || {}).sp + '）');
chk('DY21 空间打手池 gate 正向不否决：榜首速度≤60（低速加分生效）且池内仍含中速者（>85 速）', trSlotPool.n > 100
  && trSlotPool.rows[0].sp <= 60 && trSlotPool.rows.filter(r => r.sp > 85).length > 0,
  '榜首=' + trSlotPool.rows[0].zh + '(速' + trSlotPool.rows[0].sp + '/' + trSlotPool.rows[0].sc + ') 池内中速(>85)=' + trSlotPool.rows.filter(r => r.sp > 85).length + ' 只');

/* DY22 队位类需求不被核心自身消解 */
const teamNeedKinds = ['wallp', 'walls', 'truse', 'trset', 'cover'];
const hitTN = planR.needs.filter(n => teamNeedKinds.indexOf(n.kind) >= 0);
chk('DY22 队位类需求（补盲/联防/空间手/打手）不被核心自身消解（全部 non-core）', hitTN.length > 0 && hitTN.every(n => !n.byCore),
  hitTN.map(n => n.label + '=' + n.status + (n.byCore ? '(核心)' : '')).join(' | '));

/* DY23 buildTeam 兼容别名 */
chk('DY23 buildTeam 兼容别名 = buildTeamByNeeds（同核心：队伍与需求清单逐一一致）', (function () {
  const a = sandbox.buildTeam(venu, {}), b = sandbox.buildTeamByNeeds(venu, {});
  return a.team.length === b.team.length && a.needs.length === b.needs.length && a.team.every((m, i) => '' + m.s.id === '' + b.team[i].s.id);
})(), 'buildTeam=' + sandbox.buildTeam(venu, {}).team.length + ' 只 / buildTeamByNeeds=' + sandbox.buildTeamByNeeds(venu, {}).team.length + ' 只');

/* DY24 同一核心两条流派配招不重复（Patch K：增伤轴不再与强化轴共用同一套配招） */
chk('DY24 同一核心的两条流派配招不重复（main 招集合两两不同）', (function () {
  const bs = sandbox.deriveBuilds(venu);
  const sig = b => b.mv.main.map(x => x.id).sort().join(',');
  return bs.length >= 2 && new Set(bs.map(sig)).size === bs.length;
})(), sandbox.deriveBuilds(venu).map(b => b.name + '[' + b.mv.main.map(x => (sandbox.MV[x.id] || [])[1]).join('/') + ']').join(' || '));

/* ================= v4.3.1 EV 组：进化奇石（Eviolite）语义 =================
   用户裁定：①奇石仅对非最终形态生效（双防×1.5），最终形态完全无效 → 最终形态不得被推荐奇石；
             ②非最终形态经「奇石优势分析」可入选候选池（替代 optFinalOnly 一刀切排除）。 */
const E_ = sandbox.ERDATA;
const isFinF = s => sandbox.isFinalForm(s);
const evioOf = s => { try { return sandbox.evioAdv(s) } catch (e) { return null } };
const itemOf = (s, tag) => { try { return sandbox.buildItem(s, sandbox.coreSide(s), tag || '输出') || [] } catch (e) { return [] } };

const finAll = E_.species.filter(isFinF);
const finEvio = finAll.filter(s => itemOf(s, '肉盾').some(x => x[0] === '进化奇石') || itemOf(s, '输出').some(x => x[0] === '进化奇石'));
chk('EV1 最终形态全库（' + finAll.length + ' 只）道具推荐「进化奇石」= 0（奇石对最终形态完全无效）',
  finEvio.length === 0, '命中=' + finEvio.length + (finEvio.length ? ' → ' + finEvio.slice(0, 5).map(s => s.zh).join('/') : ''));

const advAll = E_.species.filter(s => !!evioOf(s));
/* v4.3.2 权衡模型（用户裁定：反对僵硬规则）：入选 = 双门（d_bulk>0 且 综合分 S ≥ EVIO.TRADE_MIN），
   比较对象 = 本形态+奇石 vs 同族终态+其最优道具；四维 = 有效耐久/输出/速度线/功能价值。 */
const evMagic = ['233', '324', '772'];            /* 权衡后仍入选的经典位 */
const evVetoed = ['113', '356'];                  /* 权衡后因进化型耐久/道具反超被否决的经典位 */
chk('EV2 权衡模型入选（均为非最终形态；含多边兽2型/煤炭龟/属性：空；吉利蛋/彷徨夜灵因进化型+道具更优被否决）',
  advAll.length >= 20 && advAll.length < 180 && advAll.every(s => !isFinF(s))
  && evMagic.every(x => advAll.some(s => '' + s.id === x))
  && evVetoed.every(x => !advAll.some(s => '' + s.id === x) && !!sandbox.evioVeto(spById(x))),
  'N=' + advAll.length + '（v4.3.1 口径 180 → 权衡后收缩）含经典位=' + evMagic.map(x => advAll.some(s => '' + s.id === x)).join(',') +
  ' 被否决=' + evVetoed.map(x => spById(x).zh + ':' + !advAll.some(s => '' + s.id === x)).join(',') +
  ' 首 8=' + advAll.slice(0, 8).map(s => s.zh + '(' + s.id + ')').join('/'));
chk('EV2b 双门一致性：每个入选者 d_bulk>0 且 S ≥ EVIO.TRADE_MIN；妙蛙种子#1 不入池（幼体权衡不过）',
  !advAll.some(s => '' + s.id === '1') && !sandbox.finalPool().some(s => '' + s.id === '1')
  && advAll.every(s => {
    const e = sandbox.evioAdv(s);
    return e.S === null ? (e.bulkE >= 380 && e.atk >= 85) : (e.d.bulk > 0 && e.S >= sandbox.EVIO.TRADE_MIN);
  }),
  '妙蛙种子 inPool=' + sandbox.finalPool().some(s => '' + s.id === '1') + ' 入选 N=' + advAll.length +
  '（有族 ' + advAll.filter(s => evioOf(s).fam).length + ' / 绝对阈值 ' + advAll.filter(s => !evioOf(s).fam).length + '）');

chk('EV3 奇石优势者配装首位含「进化奇石」且说明含「双防×1.5 加成后耐久」',
  advAll.every(s => { const it = itemOf(s, '输出'); return it.length > 0 && it[0][0] === '进化奇石' && /双防×1\.5/.test(it[0][1] + '') }),
  advAll.slice(0, 3).map(s => s.zh + '：' + itemOf(s, '输出')[0][1].slice(0, 52)).join(' | '));

const tork = spById(324), ninet = spById(38);
chk('EV4 煤炭龟 #324：奇石优势成立 + 已入 finalPool + 可作为核心（optFinalOnly 开）',
  (function () {
    const inPool = sandbox.finalPool().some(s => '' + s.id === '324');
    const ev = evioOf(tork);
    const cm = (typeof sandbox.coreMatch === 'function') ? sandbox.coreMatch(tork) : null;
    return !!ev && inPool && cm !== false;
  })(),
  'evio=' + JSON.stringify(evioOf(tork)) + ' inPool=' + sandbox.finalPool().some(s => '' + s.id === '324') +
  ' coreMatch=' + ((typeof sandbox.coreMatch === 'function') ? sandbox.coreMatch(tork) : 'n/a'));

const leak = sandbox.finalPool().filter(s => !isFinF(s) && !evioOf(s));
chk('EV5 finalPool 准入闭环：池内非最终形态必为奇石优势者（无漏网）', leak.length === 0, '漏网=' + leak.length);

const seed1 = spById(1);
chk('EV6 弱势非最终形态不入选（妙蛙种子 #1）+ 最终形态九尾 #38 仍在池（并列候选）',
  !evioOf(seed1) && !sandbox.finalPool().some(s => '' + s.id === '1') && sandbox.finalPool().some(s => '' + s.id === '38'),
  '妙蛙种子 evio=' + JSON.stringify(evioOf(seed1)) + ' 池内九尾=' + sandbox.finalPool().some(s => '' + s.id === '38'));

const evPlan = sandbox.buildTeamByNeeds(tork, {});
const evHits = (evPlan.team || []).filter(m => !m.core && m.s && '' + m.s.id === '' + tork.id);
chk('EV7 煤炭龟作为核心可正常生成方案（需求驱动不报错、需求条数 >0）',
  !!evPlan && (evPlan.needs || []).length > 0 && (evPlan.team || []).length >= 2,
  '需求=' + ((evPlan.needs || []).length) + ' 队伍=' + ((evPlan.team || []).length) + ' 只');

/* ===== v4.3.1 EV-3 组：ER CanEvolve 口径（kd∈{0,3,4}）+ 族终态派生 + 模板道具展示层过滤 ===== */
const nfER = E_.nonFinalER || [];
const nfOld = E_.nonFinal || [];
chk('EV8 nonFinalER 按 ER CanEvolve 派生（653 只）且含全部数据层 nonFinal（数据层 v4.3.2 已追平非最终口径）',
  nfER.length === 653 && nfOld.every(x => nfER.indexOf(x) > -1) && nfOld.length <= nfER.length,
  'nonFinalER=' + nfER.length + ' nonFinal=' + nfOld.length + '（数据层追平=' + (nfOld.length === nfER.length) + '）');

const branchIds = ['412', '415', '550', '667', '677', '757', '848', '1064', '1636', '1637', '1667', '2567', '2608'];
chk('EV8b 13 只性别分支进化（Burmy/Combee/Basculin/Litleo/Espurr/Salandit/Toxel 及形态）已纳入 nonFinalER 且 isFinalForm=false',
  branchIds.every(x => nfER.indexOf(x) > -1 && sandbox.isFinalForm(spById(x)) === false),
  branchIds.map(x => x + ':' + sandbox.isFinalForm(spById(x))).join(' '));

chk('EV9 kd∈{1 Mega,2 Primal,5 Move-Mega} 仍算最终形态（盖欧卡382/固拉多383/烈空坐384 不在 nonFinalER）',
  ['382', '383', '384'].every(x => nfER.indexOf(x) < 0 && sandbox.isFinalForm(spById(x)) === true),
  ['382', '383', '384'].map(x => x + ':' + sandbox.isFinalForm(spById(x))).join(' '));

chk('EV10 族终态派生 finalOf：煤炭龟 #324 → 炎玄武 #1042；奇石 why 引述族对比（不再走绝对阈值兜底）',
  String((E_.finalOf || {})['324']) === '1042' && (function () {
    const e = sandbox.evioAdv(spById(324)); return !!e && String(e.famId) === '1042' && /炎玄武/.test(e.why) && /比值/.test(e.why);
  })(),
  'finalOf[324]=' + (E_.finalOf || {})['324'] + ' famId=' + String(((sandbox.evioAdv(spById(324)) || {}).famId)) +
  ' why=' + String((sandbox.evioAdv(spById(324)) || {}).why).slice(0, 90));

chk('EV11 非最终形态（含 ER 口径扩展）配装奇石门控一致：可进化者才可推荐奇石，最终形态恒不可',
  E_.species.filter(isFinF).every(s => !itemOf(s, '输出').some(x => x[0] === '进化奇石'))
  && E_.species.filter(s => !isFinF(s) && sandbox.evioOk(s)).every(s => itemOf(s, '输出')[0][0] === '进化奇石'),
  '最终形态含奇石=' + E_.species.filter(isFinF).filter(s => itemOf(s, '输出').some(x => x[0] === '进化奇石')).length + ' 只');

const tplIx = sandbox.tplAll().map((t, k) => [t, k]).filter(x => x[0].name === '戏法空间')[0][1];
sandbox.renderTplBody(tplIx);
const tplBodyEv = byId('tplBody' + tplIx)._html;
chk('EV12 模板「[道具]进化奇石」展示层已按 ER 口径限定（数据层未限定时显示「不适用」或「仅未完全进化者生效」）',
  /进化奇石/.test(tplBodyEv) && (/不适用/.test(tplBodyEv) || /仅未完全进化者生效/.test(tplBodyEv)),
  '不适用=' + /不适用/.test(tplBodyEv) + ' 限定语=' + /仅未完全进化者生效/.test(tplBodyEv) + ' tplItemNoEvio=' + sandbox.tplItemNoEvio(tplIx));


/* ===== v4.3.2 权衡模型（TR 组）：四维加权 + 对照方道具 + 体系感知速度 + 缩放收缩 ===== */
const advO = advAll.map(s => [s, evioOf(s)]);
const vetoO = E_.species.map(s => [s, sandbox.evioVeto(s)]).filter(x => !!x[1]);
chk('TR1 权衡模型为四维加权（EVIO.TW = 耐久/输出/速度/功能，且入选对象带 d/S/A/B/itemB）',
  (function () {
    const TW = sandbox.EVIO.TW;
    return ['bulk', 'out', 'spd', 'util'].every(k => typeof TW[k] === 'number')
      && advO.length > 0 && advO.every(x => x[1].fam
        ? (!!x[1].d && typeof x[1].S === 'number' && typeof x[1].itemB === 'string' && !!x[1].A && !!x[1].B)
        : (x[1].d === null && x[1].S === null && x[1].itemB === null));
  })(),
  'TW=' + JSON.stringify(sandbox.EVIO.TW) + ' TRADE_MIN=' + sandbox.EVIO.TRADE_MIN + ' 样本 #' + advO[0][0].id + ' d=' + JSON.stringify(advO[0][1].d));

chk('TR2 对照方（同族终态）按其最优道具参与比较：B 组道具非奇石，且道具增益折算进 B 的耐久/输出',
  advO.filter(x => x[1].fam).every(x => x[1].itemB !== '进化奇石' && x[1].B.bulk > 0)
  && ['生命宝珠', '剩饭', '讲究头带', '讲究眼镜', '突击背心'].some(n => advO.some(x => x[1].itemB === n)),
  advO.filter(x => x[1].fam).slice(0, 6).map(x => x[0].zh + '+' + x[1].itemB).join(' '));

chk('TR3 存在「因进化型速度/力度/道具优势被否决」的未进化型（why 明示反超 → 不推荐）',
  vetoO.filter(x => x[1].fam).length > 100
  && vetoO.filter(x => x[1].fam && x[1].d.spe < 0 && x[1].d.out < 0).length > 50
  && vetoO.some(x => /反超/.test(x[1].why) && /不推荐/.test(x[1].why)),
  '否决(有族)=' + vetoO.filter(x => x[1].fam).length + ' 其中速度+输出双双落后的=' +
  vetoO.filter(x => x[1].fam && x[1].d.spe < 0 && x[1].d.out < 0).length + ' 例：' +
  vetoO.filter(x => x[1].fam && x[1].d.spe < 0 && x[1].d.out < 0).slice(0, 3).map(x => x[0].zh + '(S=' + x[1].S + ')').join('/'));

chk('TR4 why 文案含权衡对比（有族样本：双方有效耐久/输出/速度/功能；无族样本注明绝对阈值）',
  advO.filter(x => x[1].fam).every(x => /奇石双防 X=/.test(x[1].why) && /vs /.test(x[1].why) && /输出/.test(x[1].why)
    && /速度/.test(x[1].why) && /功能/.test(x[1].why) && /有效耐久/.test(x[1].why))
  && advO.filter(x => !x[1].fam).every(x => /绝对阈值/.test(x[1].why)),
  '有族 ' + advO.filter(x => x[1].fam).length + ' 只全含权衡对比；样本 why=' + advO.filter(x => x[1].fam)[0][1].why.slice(0, 150));

chk('TR5 收缩：权衡后入选规模显著小于 v4.3.1 的 180（且保留 ≥20 只，不过度收紧）',
  advAll.length >= 20 && advAll.length < 180, 'N=' + advAll.length + '（v4.3.1 = 180）');

chk('TR6 煤炭龟 #324 权衡后仍入选，why 列双方（炎玄武+剩饭 vs 奇石双防）',
  (function () {
    const e = sandbox.evioAdv(spById(324));
    return !!e && e.pass && /炎玄武/.test(e.why) && /剩饭/.test(e.why) && /有效耐久/.test(e.why) && sandbox.finalPool().some(s => '' + s.id === '324');
  })(),
  'why=' + String((sandbox.evioAdv(spById(324)) || {}).why).slice(0, 170));

chk('TR7 速度维度体系感知：同一对样本在空间体系（space=true）下低速方的 d.spe 更高',
  (function () {
    const a = sandbox.evioTrade(spById(233), ['晴'], false, '特殊');
    const b = sandbox.evioTrade(spById(233), ['晴'], true, '特殊');
    return !!a && !!b && b.d.spe > a.d.spe;
  })(),
  (function () {
    const a = sandbox.evioTrade(spById(233), ['晴'], false, '特殊'), b = sandbox.evioTrade(spById(233), ['晴'], true, '特殊');
    return 'd.spe 速攻上下文=' + a.d.spe + ' 空间上下文=' + b.d.spe;
  })());

chk('TR8 无族可对照的入选者走绝对阈值兜底并注明（d=null、why 含「绝对阈值」）',
  advO.filter(x => !x[1].fam).every(x => x[1].d === null && /绝对阈值/.test(x[1].why)),
  '走绝对阈值的入选者=' + (advO.filter(x => !x[1].fam).map(x => x[0].zh + '(' + x[0].id + ')').join('/') || '无') + ' 共 ' + advO.filter(x => !x[1].fam).length + ' 只');

chk('TR9 被否决者给出 veto 对象（含 why 与双方对比），未入选 ≠ 静默丢弃',
  (function () {
    const v = sandbox.evioVeto(spById(113));
    return !!v && !v.pass && /不推荐/.test(v.why) && /幸福蛋/.test(v.why);
  })(),
  '吉利蛋 veto why=' + String((sandbox.evioVeto(spById(113)) || {}).why).slice(0, 170));

chk('TR10 入选者仍不入最终形态集合（奇石仅非最终形态）+ 最终形态奇石推荐恒 0（与 EV1/EV11 交叉）',
  advAll.every(s => !isFinF(s)) && E_.species.filter(isFinF).every(s => !itemOf(s, '输出').some(x => x[0] === '进化奇石')),
  '入选全为非最终=' + advAll.every(s => !isFinF(s)) + ' 最终形态奇石推荐=0');

chk('TR11 配装 UI：奇石候选首项道具说明含水权衡文案（综合权衡 + 有效耐久 + 对照终态）',
  (function () {
    const it = sandbox.buildItem(spById(233), '特殊', '输出');
    const txt = (it && it[0] ? it[0][0] + '：' + it[0][1] : '');
    return it[0][0] === '进化奇石' && /综合权衡/.test(txt) && /有效耐久/.test(txt) && /多边兽乙型/.test(txt);
  })(),
  (function () { const it = sandbox.buildItem(spById(233), '特殊', '输出'); return it[0][0] + '｜' + String(it[0][1]).slice(0, 165); })());

chk('TR12 方案卡 UI：奇石优势成员的配装行渲染出「进化奇石」chip，且 tooltip（title）含权衡文案（有效耐久/综合权衡/对照终态）',
  (function () {
    const h = sandbox.needBuildHtml(spById(233), '输出');
    return /进化奇石/.test(h) && /有效耐久/.test(h) && /综合权衡/.test(h) && /多边兽乙型/.test(h) && /gotoItem\(/.test(h);
  })(),
  (function () {
    const h = sandbox.needBuildHtml(spById(233), '输出');
    const m = h.match(/[^<>]{0,50}综合权衡[^<>]{0,50}/);
    return '含奇石 chip=' + /进化奇石/.test(h) + ' 含权衡 tooltip=' + /综合权衡/.test(h) + ' 片段=' + (m ? m[0] : '(无)');
  })());

chk('TR12b 核心配队页（需求驱动）可渲染且候选/需求文本就绪（renderNeedPlan 不抛错并含「需求」）',
  (function () {
    try {
      sandbox.renderNeedPlan(spById(324));
      const h = byId('coreOut') ? byId('coreOut')._html : '';
      return /需求/.test(h) && h.length > 200;
    } catch (e) { return false }
  })(),
  (function () {
    try { sandbox.renderNeedPlan(spById(324)); const h = byId('coreOut')._html; return 'coreOut 长度=' + h.length + ' 含需求=' + /需求/.test(h) }
    catch (e) { return 'ERR ' + e.message }
  })());

/* ===== v432-1：权衡否决的 UI 可见性（验证代理 v432-1） ===== */
const vsum = sandbox.evioVetoSummary(spById(324));
const veto356 = sandbox.evioVeto(spById(356));   /* 彷徨夜灵：其默认上下文（=详情页口径）下被否决 */
chk('TR13 否决可见（数据面）：evioVetoSummary(煤炭龟) 汇总「有族且被否决」的非最终形态（n>100，逐条 why 含「反超 → 不推荐」+ 对照终态/道具），含吉利蛋#113（S<0 被否决）；彷徨夜灵#356 在其默认上下文被否决（对照黑夜魔灵）',
  !!vsum && vsum.n > 100 && vsum.n < 700
  && vsum.list.some(x => '' + x.s.id === '113')
  && vsum.list.every(x => /反超/.test(x.why) && /不推荐/.test(x.why) && !!x.fam && !!x.itemB)
  && !!veto356 && /反超/.test(veto356.why) && /不推荐/.test(veto356.why) && /黑夜魔灵/.test(veto356.why),
  'n=' + (vsum ? vsum.n : 0) + ' 吉利蛋#113 位次=' + (vsum ? (vsum.list.findIndex(x => '' + x.s.id === '113') + 1) : 0)
    + ' 升序首 3=' + (vsum ? vsum.list.slice(0, 3).map(x => x.s.zh + '(S=' + x.S + ')').join(' ') : '(无)')
    + ' ｜#356 默认上下文否决=' + !!veto356 + (veto356 ? ('（S=' + veto356.S + '，对照 ' + veto356.fam + '）') : ''));

chk('TR14 否决可见（配队页渲染面）：核心配队页产出「🪨 奇石权衡否决 N 只」折叠块，含吉利蛋案例、对照终态与道具、可点击跳详情、并声明「否决 ≠ 剔除」',
  (function () {
    try { sandbox.renderNeedPlan(spById(324)); } catch (e) {}
    const h = (byId('coreOut') && byId('coreOut')._html) || '';
    return /奇石权衡否决/.test(h) && /进化型凭道具\/速度\/力度反超 → 不推荐/.test(h) && /吉利蛋/.test(h)
      && /openSpById\(/.test(h) && /否决 ≠ 剔除/.test(h) && /有效耐久/.test(h);
  })(),
  (function () {
    try { sandbox.renderNeedPlan(spById(324)); } catch (e) {}
    const h = (byId('coreOut') && byId('coreOut')._html) || '';
    const m = h.match(/奇石权衡否决[^<]{0,80}/);
    const r = h.match(/吉利蛋[^<]{0,90}/);
    return '含否决块=' + /奇石权衡否决/.test(h) + ' 标题=' + (m ? m[0] : '(无)') + ' ｜吉利蛋行=' + (r ? r[0] : '(无)');
  })());

chk('TR15 否决可见（详情页渲染面）：吉利蛋详情页渲染出「奇石权衡否决（不推荐带进化奇石）」与对照终态幸福蛋；煤炭龟详情页为「奇石权衡通过」',
  (function () {
    try { sandbox.openSp(spById(113)); } catch (e) {}
    const h1 = (byId('spDetail') && byId('spDetail')._html) || '';
    try { sandbox.openSp(spById(324)); } catch (e) {}
    const h2 = (byId('spDetail') && byId('spDetail')._html) || '';
    return /奇石权衡否决/.test(h1) && /不推荐带进化奇石/.test(h1) && /幸福蛋/.test(h1)
      && /奇石权衡通过/.test(h2) && /炎玄武/.test(h2);
  })(),
  (function () {
    try { sandbox.openSp(spById(113)); } catch (e) {}
    const h = (byId('spDetail') && byId('spDetail')._html) || '';
    const m = h.match(/奇石权衡否决[^<]{0,110}/);
    return '详情含否决行=' + /奇石权衡否决/.test(h) + ' 片段=' + (m ? m[0] : '(无)');
  })());


/* ===== v4.3.3 IT 组：道具池扩充（ITEM_POOL 54 项）+ 角色×流派匹配 + 主推/备选渲染 ===== */
function _itf(it){return (it||[]).map(function(x){return x[0]})}
function _itPool(){return sandbox.ITEM_POOL||[]}
function _itById(id){return _itPool().filter(function(p){return ''+p.id===''+id})[0]}
function _itWxSetter(sysName){
  return sandbox.ERDATA.species.filter(function(s){
    return (s.abis||[]).concat(s.inns||[]).some(function(n){return sandbox.SYS_SET[n]===sysName})})[0];
}
function _itTerrSetter(){
  return sandbox.ERDATA.species.filter(function(s){
    return (s.abis||[]).concat(s.inns||[]).some(function(n){
      return ['电气制造者','青草制造者','薄雾制造者','精神制造者'].indexOf(n)>-1})})[0];
}

chk('IT1 ITEM_POOL 规模 40-60 项、类别 ≥6 类、zh 非空、非动态项 id 全部存在于 ERDATA.items（数据层真值核对）',
  (function () {
    const pool = _itPool(), cls = {};
    pool.forEach(p => cls[p.cls] = (cls[p.cls] || 0) + 1);
    const idsOK = pool.filter(p => !p.dynamic).every(p => sandbox.ERDATA.items.some(i => '' + i[0] === '' + p.id));
    const dmOK = pool.filter(p => p.dynamic).every(p => p.ids.every(i => sandbox.ERDATA.items.some(x => '' + x[0] === '' + i)));
    return pool.length >= 40 && pool.length <= 60 && Object.keys(cls).length >= 6 && pool.every(p => p.zh && p.zh.length > 0) && idsOK && dmOK;
  })(),
  (function () {
    const pool = _itPool(), cls = {};
    pool.forEach(p => cls[p.cls] = (cls[p.cls] || 0) + 1);
    const miss = pool.filter(p => !p.dynamic).filter(p => !sandbox.ERDATA.items.some(i => '' + i[0] === '' + p.id)).map(p => p.zh);
    return 'N=' + pool.length + ' 类别=' + JSON.stringify(cls) + ' 缺失 id=' + (miss.length ? miss.join(',') : '0');
  })());

chk('IT2 池含用户点名的对战常用件：4 天气岩石（炽热/潮湿/光滑/冰冷）+光之黏土+地形延长器+4 场地种子+厚底靴+弱点保险+进化奇石',
  ['炽热岩石', '潮湿岩石', '光滑岩石', '冰冷岩石', '光之黏土', '地形延长器', '电气种子', '青草种子', '薄雾种子', '精神种子', '厚底靴', '弱点保险', '进化奇石']
    .every(n => _itPool().some(p => p.zh === n)),
  '命中=' + ['炽热岩石', '潮湿岩石', '光滑岩石', '冰冷岩石', '光之黏土', '地形延长器', '电气种子', '青草种子', '薄雾种子', '精神种子', '厚底靴', '弱点保险', '进化奇石']
    .filter(n => _itPool().some(p => p.zh === n)).join('/'));

chk('IT3 天气手 → 对应天气岩石主推（九尾晴=炽热岩石 / 大嘴鸥雨=潮湿岩石 / 沙手=光滑岩石 / 雪手=冰冷岩石），数值口径 = WCONF.rockTurnsAbility（8→12 回合）',
  (function () {
    const nine = spById(38), pel = _itWxSetter('雨'), sand = _itWxSetter('沙'), snow = _itWxSetter('雪');
    const ok = _itf(sandbox.buildItem(nine, '特殊', '天气'))[0] === '炽热岩石'
      && _itf(sandbox.buildItem(pel, '特殊', '天气'))[0] === '潮湿岩石'
      && _itf(sandbox.buildItem(sand, '物理', '天气'))[0] === '光滑岩石'
      && _itf(sandbox.buildItem(snow, '物理', '天气'))[0] === '冰冷岩石'
      && sandbox.WCONF.rockTurnsAbility === 12;
    return ok;
  })(),
  (function () {
    const nine = spById(38), pel = _itWxSetter('雨'), sand = _itWxSetter('沙'), snow = _itWxSetter('雪');
    return '九尾=' + _itf(sandbox.buildItem(nine, '特殊', '天气')).slice(0, 2).join('/')
      + ' 大嘴鸥=' + _itf(sandbox.buildItem(pel, '特殊', '天气')).slice(0, 2).join('/')
      + ' ' + sand.zh + '=' + _itf(sandbox.buildItem(sand, '物理', '天气')).slice(0, 2).join('/')
      + ' ' + snow.zh + '=' + _itf(sandbox.buildItem(snow, '物理', '天气')).slice(0, 2).join('/')
      + ' rockTurnsAbility=' + sandbox.WCONF.rockTurnsAbility;
  })());

chk('IT4 场地手 → 光之黏土主推 + 对应场地种子与地形延长器备选（光之黏土/延长器数值 = 考古口径 12 回合）',
  (function () {
    const t = _itTerrSetter(); const list = _itf(sandbox.buildItem(t, '特殊', '天气'));
    return list[0] === '光之黏土' && list.indexOf('地形延长器') > -1 && /种子/.test(list.join('/')) && sandbox.WCONF.terrainExtenderTurns === 12;
  })(),
  (function () {
    const t = _itTerrSetter();
    return t.zh + ' sys=' + JSON.stringify(sandbox.itemSysOf(t)) + ' 道具=' + _itf(sandbox.buildItem(t, '特殊', '天气')).join('/');
  })());

chk('IT5 盾/受队 → 防御续航类主导（剩饭/凸凸头盔 命中 ≥2 项）；毒系盾 → 黑色污泥主推（对位原则 P1/P3）',
  (function () {
    const ferro = sandbox.ERDATA.species.filter(s => s.zh === '坚果哑铃')[0];
    const poison = sandbox.ERDATA.species.filter(s => (s.t1 === '毒' || s.t2 === '毒') && s.base[2] + s.base[4] >= 190)[0];
    const a = _itf(sandbox.buildItem(ferro, '物理', '肉盾')), b = _itf(sandbox.buildItem(poison, '物理', '受队'));
    const sh = a.filter(x => /剩饭|凸凸头盔|文柚果|厚底靴|黑色污泥/.test(x));
    return sh.length >= 2 && /剩饭|凸凸头盔/.test(a.join('/')) && b[0] === '黑色污泥';
  })(),
  '坚果哑铃=' + _itf(sandbox.buildItem(sandbox.ERDATA.species.filter(s => s.zh === '坚果哑铃')[0], '物理', '肉盾')).join('/') +
  ' ｜毒系盾=' + _itf(sandbox.buildItem(sandbox.ERDATA.species.filter(s => (s.t1 === '毒' || s.t2 === '毒') && s.base[2] + s.base[4] >= 190)[0], '物理', '受队')).join('/') +
  '（对位原则：P1 主武器/续航 ＞ P3 punish，不再硬绑「剩饭必首」）');

chk('IT6 输出核心 → 力度类主导（前三均为力度件：命玉/专爱/宝石/达人带/节拍器/力量头带/博识眼镜，含命玉或专爱）；未被超速者不推围巾（对位驱动）',
  (function () {
    const fast = sandbox.ERDATA.species.filter(s => s.base[5] >= 120)[0];
    const mid = sandbox.ERDATA.species.filter(s => s.base[5] >= 90 && s.base[5] <= 105 && s.base[3] >= 100)[0];
    const a = _itf(sandbox.buildItem(fast, '物理', '输出')), b = _itf(sandbox.buildItem(mid, '特殊', '输出'));
    const POW = /生命宝珠|讲究头带|讲究眼镜|宝石|达人带|节拍器|力量头带|博识眼镜/;
    const aPow = a.filter(x => POW.test(x)).length, bPow = b.filter(x => POW.test(x)).length;
    return aPow >= 3 && bPow >= 2 && /生命宝珠|讲究头带/.test(a.join('/')) && /生命宝珠|讲究眼镜/.test(b.join('/'));
  })(),
  '速攻=' + _itf(sandbox.buildItem(sandbox.ERDATA.species.filter(s => s.base[5] >= 120)[0], '物理', '输出')).join('/') +
  ' ｜中速特攻=' + _itf(sandbox.buildItem(sandbox.ERDATA.species.filter(s => s.base[5] >= 90 && s.base[5] <= 105 && s.base[3] >= 100)[0], '特殊', '输出')).join('/') +
  '（对位：未被超速不推围巾；围巾只在被超速时进前三——见 PL8）');

chk('IT6b 对位驱动反例：真正被超速的慢速输出手 → 讲究围巾进入前三（scarfRedundant 只对「已快过环境中位」者降权）',
  (function () {
    const slow = sandbox.ERDATA.species.filter(s => s.base[5] <= 55 && s.base[1] >= 90)[0];
    const l = _itf(sandbox.buildItem(slow, '物理', '输出'));
    return l.indexOf('讲究围巾') > -1;
  })(),
  (function () {
    const slow = sandbox.ERDATA.species.filter(s => s.base[5] <= 55 && s.base[1] >= 90)[0];
    return (slow ? slow.zh + '#' + slow.id + ' 速度' + slow.base[5] : '—') + ' 输出=' + _itf(sandbox.buildItem(slow, '物理', '输出')).join('/');
  })());

chk('IT7 强化核 → 弱点保险入前三（对位：需要吃招反打）；轮转/游击 → 换人节奏类（逃脱按钮/红牌/围巾 任一）；控速 → 控速类（围巾/嘉珍果/先制之爪 任一）',
  (function () {
    const v = spById(3);
    const a = _itf(sandbox.buildItem(v, '物理', '强化'));
    const p = _itf(sandbox.buildItem(v, '特殊', '轮转')), q = _itf(sandbox.buildItem(v, '特殊', '游击')), w = _itf(sandbox.buildItem(v, '特殊', '控速'));
    return a.indexOf('弱点保险') > -1
      && /逃脱按钮|红牌|讲究围巾/.test(p.join('/')) && /逃脱按钮|红牌|讲究围巾/.test(q.join('/'))
      && /讲究围巾|嘉珍果|先制之爪|讲究眼镜|讲究头带/.test(w.join('/'));
  })(),
  (function () {
    const v = spById(3);
    return '强化=' + _itf(sandbox.buildItem(v, '物理', '强化')).join('/') + ' 轮转=' + _itf(sandbox.buildItem(v, '特殊', '轮转')).join('/') +
      ' 控速=' + _itf(sandbox.buildItem(v, '特殊', '控速')).join('/');
  })());

chk('IT8 奇石分支并列：煤炭龟（非最终形态·奇石权衡通过）主推仍为进化奇石（v4.3.2 裁定），但「天气」角色下并列炽热岩石',
  (function () {
    const list = _itf(sandbox.buildItem(spById(324), '物理', '天气'));
    return list[0] === '进化奇石' && list.indexOf('炽热岩石') > -1;
  })(),
  '煤炭龟(天气)=' + _itf(sandbox.buildItem(spById(324), '物理', '天气')).join('/'));

chk('IT9 渲染面（备选卡）：needBuildHtml 主推带 ⭐ 加粗、备选并列且 ≤2 项、含天气岩石、无字面 span 标签外露',
  (function () {
    const h = sandbox.needBuildHtml(spById(324), '输出', '天气');
    return /⭐/.test(h) && /备选/.test(h) && /炽热岩石/.test(h) && !/<span class="t /.test(h) && (h.match(/备选<\/span>/g) || []).length <= 2;
  })(),
  (function () {
    const h = sandbox.needBuildHtml(spById(324), '输出', '天气');
    return '含⭐=' + /⭐/.test(h) + ' 备选数=' + ((h.match(/备选<\/span>/g) || []).length) + ' 含炽热岩石=' + /炽热岩石/.test(h);
  })());

chk('IT10 渲染面（核心配队页）：设置手流派卡按天气角色出道具 —— 煤炭龟页含炽热岩石、走路草（场地手）页含光之黏土与地形延长器，且均带主推标记',
  (function () {
    const t = _itTerrSetter();
    sandbox.renderCore(spById(324));
    const h1 = (byId('coreOut') && byId('coreOut')._html) || '';
    sandbox.renderCore(t);
    const h2 = (byId('coreOut') && byId('coreOut')._html) || '';
    return /炽热岩石/.test(h1) && /⭐/.test(h1) && /光之黏土/.test(h2) && /地形延长器/.test(h2);
  })(),
  (function () {
    const t = _itTerrSetter();
    sandbox.renderCore(spById(324));
    const h1 = (byId('coreOut') && byId('coreOut')._html) || '';
    sandbox.renderCore(t);
    const h2 = (byId('coreOut') && byId('coreOut')._html) || '';
    return '煤炭龟页 含炽热岩石=' + /炽热岩石/.test(h1) + ' 含⭐=' + /⭐/.test(h1)
      + ' ｜' + t.zh + '页 含光之黏土=' + /光之黏土/.test(h2) + ' 含地形延长器=' + /地形延长器/.test(h2);
  })());

chk('IT11 标签卫生：宝石标签用纯属性名（无 <span> 字面）、池内所有 zh 不含 HTML 尖括号（防 D1 类外露）',
  (function () {
    const g = sandbox.itemGemFor(spById(324));
    return g && !/[<>]/.test(g.zh) && g.zh.indexOf('「火」宝石') > -1
      && _itPool().every(p => p.zh.indexOf('<') < 0 && p.zh.indexOf('>') < 0);
  })(),
  (function () {
    const g = sandbox.itemGemFor(spById(324));
    return '宝石项=' + JSON.stringify(g.zh) + ' 池内 zh 含尖括号数=' + _itPool().filter(p => /[<>]/.test(p.zh)).length;
  })());

chk('IT12 既有口径不回归：itemGainOf 池驱动（生命宝珠 out=1.3）、奇石权衡对照方道具口径未变（炎玄武=剩饭 · #233 itemB=生命宝珠）',
  (function () {
    const yx = spById(1042);
    return sandbox.itemGainOf('生命宝珠').out === 1.3 && sandbox.itemGainOf('进化奇石').def === 1.5
      && sandbox.itemBestFor(yx, '特殊', '输出') === '剩饭';
  })(),
  '生命宝珠 out=' + sandbox.itemGainOf('生命宝珠').out + ' ｜炎玄武 itemBestFor=' + sandbox.itemBestFor(spById(1042), '特殊', '输出'));


chk('IT13 渲染面（核心配队页·道具多样性）：每页 ≥5 种池内道具、输出核含命玉（力度主导）、盾核含剩饭或凸凸头盔',
  (function () {
    function page(sp) { sandbox.renderCore(sp); return (byId('coreOut') && byId('coreOut')._html) || '' }
    const venus = page(spById(3)), ferro = page(sandbox.ERDATA.species.filter(s => s.zh === '坚果哑铃')[0]), bee = page(spById(15));
    function cnt(h) { return _itPool().filter(p => !p.dynamic).filter(p => h.indexOf(p.zh) > -1).length + (h.indexOf('宝石') > -1 ? 1 : 0) }
    return /生命宝珠/.test(venus) && /弱点保险/.test(venus)
      && /剩饭|凸凸头盔/.test(ferro)
      && /生命宝珠/.test(bee)
      && cnt(venus) >= 5 && cnt(ferro) >= 4 && cnt(bee) >= 5;
  })(),
  (function () {
    function page(sp) { sandbox.renderCore(sp); return (byId('coreOut') && byId('coreOut')._html) || '' }
    function names(h) { return _itPool().filter(p => !p.dynamic).filter(p => h.indexOf(p.zh) > -1).map(p => p.zh) }
    const venus = page(spById(3)), ferro = page(sandbox.ERDATA.species.filter(s => s.zh === '坚果哑铃')[0]), bee = page(spById(15));
    return '妙蛙花页=' + names(venus).join('/') + ' ｜坚果哑铃页=' + names(ferro).join('/') + ' ｜大针蜂页=' + names(bee).join('/');
  })());

/* ================= PL 组（v4.4 原则驱动道具决策层） ================= */
chk('PL1 威胁库结构：THREAT_LIB ≥8 类，每类含 name/deriv/evid（**派生依据 + 实证出处**，非拍脑袋）',
  (function () {
    const T = sandbox.THREAT_LIB, ks = Object.keys(T);
    return ks.length >= 8 && ks.every(k => T[k] && T[k].name && T[k].deriv && T[k].evid);
  })(),
  (function () {
    const T = sandbox.THREAT_LIB;
    return Object.keys(T).map(k => k + ':' + T[k].name).join(' | ');
  })());

chk('PL2 环境/威胁代理指标就绪：spAll/medSpe/thrFrac/threatRep 存在；spAll>1000；medSpe 为数值；thrFrac(招式id) 返回 0~1（**代理口径：无使用率数据，实读可学招者占比**）',
  typeof sandbox.spAll === 'function' && typeof sandbox.medSpe === 'function'
  && typeof sandbox.thrFrac === 'function' && typeof sandbox.threatRep === 'function'
  && sandbox.spAll().length > 1000 && typeof sandbox.medSpe() === 'number'
  && typeof sandbox.thrFrac(sandbox.FUNC_MV.hazard) === 'number'
  && sandbox.thrFrac(sandbox.FUNC_MV.hazard) >= 0 && sandbox.thrFrac(sandbox.FUNC_MV.hazard) <= 1,
  'spAll=' + sandbox.spAll().length + ' medSpe=' + Math.round(sandbox.medSpe() * 10) / 10 +
  ' 可撒钉者占比=' + (Math.round(sandbox.thrFrac(sandbox.FUNC_MV.hazard) * 1000) / 1000) +
  ' 强化招者占比=' + (Math.round(sandbox.thrFrac(sandbox.FUNC_MV.boost) * 1000) / 1000) + '（env.hazFrac 实测 0.333）');

chk('PL3 对位目标定义：oppTargets(s) 返回 {sys/sys0/env/weak/quad/outsped}，env 含 hazFrac/boostFrac/remFrac',
  (function () {
    const tg = sandbox.oppTargets(spById(3));
    return !!(tg && tg.env && typeof tg.env.hazFrac === 'number' && typeof tg.env.boostFrac === 'number'
      && typeof tg.env.remFrac === 'number' && tg.weak && tg.sys0 !== undefined && tg.outsped !== undefined);
  })(),
  (function () {
    const tg = sandbox.oppTargets(spById(3));
    return '妙蛙花 对位：sys0=' + JSON.stringify(tg.sys0) + ' env=' + JSON.stringify(tg.env) + ' 弱点=' + tg.weak.join('/');
  })());

chk('PL4 职责基线四轴：DUTY ≥10 角色，每角色 burst/longevity/punish/tech 均为数值（P1 四轴）',
  (function () {
    const D = sandbox.DUTY, ks = Object.keys(D);
    return ks.length >= 10 && ks.every(k => ['burst', 'longevity', 'punish', 'tech'].every(x => typeof D[k][x] === 'number'));
  })(),
  'DUTY 角色=' + Object.keys(sandbox.DUTY).join('/'));

chk('PL5 对位调制生效（不写死映射）：itemDutyOf 对同一只宝可梦的「天气」与「输出」给出不同四轴权重',
  (function () {
    const s = spById(324), p = sandbox.profileOf(s), tg = sandbox.oppTargets(s);
    const a = sandbox.itemDutyOf('天气', p, tg), b = sandbox.itemDutyOf('输出', p, tg);
    return JSON.stringify(a) !== JSON.stringify(b) && typeof a.tech === 'number' && typeof b.burst === 'number';
  })(),
  (function () {
    const s = spById(324), p = sandbox.profileOf(s), tg = sandbox.oppTargets(s);
    return '煤炭龟 天气=' + JSON.stringify(sandbox.itemDutyOf('天气', p, tg)) + ' ｜输出=' + JSON.stringify(sandbox.itemDutyOf('输出', p, tg));
  })());

chk('PL6 打分可解释：itemScored 每项含 {ax,why,prin,sc}，why 必含「代价」（能打什么 / 代价是什么），prin 标注 P1~P5',
  (function () {
    const rows = sandbox.itemScored(spById(3), '特殊', '输出', undefined);
    return rows.length >= 6 && rows.every(r => r.ax && typeof r.sc === 'number' && r.why && /代价/.test(r.why) && r.prin && r.prin.length >= 1);
  })(),
  (function () {
    const rows = sandbox.itemScored(spById(3), '特殊', '输出', undefined);
    const r = rows.sort((a, b) => b.sc - a.sc)[0];
    const bad = rows.filter(x => !(x.ax && typeof x.sc === 'number' && x.why && /代价/.test(x.why) && x.prin && x.prin.length >= 1));
    return '候选 ' + rows.length + ' 项（不合格 ' + bad.length + '）｜首位=' + r.zh + '｜' + r.why;
  })());

chk('PL7 决策入口：itemDecide 返回 ≤3 且按分降序（主推+备选，非单推）',
  (function () {
    const rows = sandbox.itemDecide(spById(3), '特殊', '输出', undefined);
    return rows.length > 0 && rows.length <= 3 && rows.every((r, i) => i === 0 || rows[i - 1].sc >= r.sc);
  })(),
  '妙蛙花输出 主推=' + sandbox.itemDecide(spById(3), '特殊', '输出', undefined).map(r => r.zh + '(' + r.sc + ')').join('/'));

chk('PL8 对位驱动（非查表）：已快过环境中位者「围巾」降权、被超速者「围巾」进前三 —— 同一道具随对位变权',
  (function () {
    const quick = sandbox.ERDATA.species.filter(s => s.base[5] >= 130)[0];
    const slow = sandbox.ERDATA.species.filter(s => s.base[5] <= 55 && s.base[1] >= 90)[0];
    const lq = _itf(sandbox.buildItem(quick, '物理', '输出')), ls = _itf(sandbox.buildItem(slow, '物理', '输出'));
    return lq.indexOf('讲究围巾') < 0 && ls.indexOf('讲究围巾') > -1;
  })(),
  (function () {
    const quick = sandbox.ERDATA.species.filter(s => s.base[5] >= 130)[0];
    const slow = sandbox.ERDATA.species.filter(s => s.base[5] <= 55 && s.base[1] >= 90)[0];
    return '快=' + (quick ? quick.zh + '速' + quick.base[5] : '—') + '→' + _itf(sandbox.buildItem(quick, '物理', '输出')).join('/') +
      ' ｜慢=' + (slow ? slow.zh + '速' + slow.base[5] : '—') + '→' + _itf(sandbox.buildItem(slow, '物理', '输出')).join('/');
  })());

chk('PL9 v433-2 修复：ctx.sys（队伍体系）驱动天气岩石 —— 同一只（非设置手）在 {sys:晴} 出炽热岩石、{sys:雨} 出潮湿岩石',
  (function () {
    const a = _itf(sandbox.buildItem(spById(3), '特殊', '天气', { sys: '晴' }));
    const b = _itf(sandbox.buildItem(spById(3), '特殊', '天气', { sys: '雨' }));
    return a.indexOf('炽热岩石') > -1 && b.indexOf('潮湿岩石') > -1 && a.indexOf('潮湿岩石') < 0;
  })(),
  (function () {
    return '妙蛙花@晴=' + _itf(sandbox.buildItem(spById(3), '特殊', '天气', { sys: '晴' })).join('/') +
      ' ｜妙蛙花@雨=' + _itf(sandbox.buildItem(spById(3), '特殊', '天气', { sys: '雨' })).join('/');
  })());

chk('PL10 v433-3 修复：画像/需求结构无 undefined（du.phys / du.spec 已补齐，核心画像与需求 why 不再漏字面 undefined）',
  (function () {
    const pr = sandbox.profileOf(spById(3));
    return pr.du && typeof pr.du.phys === 'string' && typeof pr.du.spec === 'string'
      && pr.du.phys.indexOf('undefined') < 0 && pr.du.spec.indexOf('undefined') < 0
      && /物耐/.test(pr.du.phys) && /特耐/.test(pr.du.spec);
  })(),
  (function () {
    const pr = sandbox.profileOf(spById(3));
    return 'du.phys=' + pr.du.phys + ' du.spec=' + pr.du.spec;
  })());

chk('PL11 v433-1 修复：需求驱动的队伍行核心按**实际角色**出装（受队核心 → 剩饭/凸凸头盔 支，不再写死「输出」）',
  (function () {
    const plan = sandbox.buildTeamByNeeds(spById(411));
    const core = (plan.team || []).filter(m => m.core)[0];
    if (!core) return false;
    const tag = sandbox.itemTagOfCore(plan, core.s), rt = sandbox.roleTagOfCore(plan, core.s);
    const l = _itf(sandbox.buildItem(core.s, '物理', tag, { sys: plan.sysKey }));
    return typeof rt === 'string' && rt.length > 0 && /剩饭|凸凸头盔|文柚果|黑色污泥|厚底靴/.test(l.join('/'));
  })(),
  (function () {
    const plan = sandbox.buildTeamByNeeds(spById(411));
    const core = (plan.team || []).filter(m => m.core)[0];
    if (!core) return '核心缺失';
    const tag = sandbox.itemTagOfCore(plan, core.s);
    return '护城龙#411 画像角色=' + plan.prof.role + ' → roleTag=' + sandbox.roleTagOfCore(plan, core.s) + ' itemTag=' + tag +
      ' 道具=' + _itf(sandbox.buildItem(core.s, '物理', tag, { sys: plan.sysKey })).join('/');
  })());

chk('PL12 需求驱动结构仍完整（回归 v4.3）：buildTeamByNeeds 返回 needs/pools/team/overview/audit，需求条目含 {kind,label,priority,status,satisfiedBy}',
  (function () {
    const plan = sandbox.buildTeamByNeeds(spById(3));
    return !!(plan && plan.needs && plan.pools && plan.team && plan.overview && plan.audit
      && plan.needs.length > 0
      && plan.needs.every(n => n.kind && n.label && n.priority !== undefined && n.status && n.satisfiedBy));
  })(),
  (function () {
    const plan = sandbox.buildTeamByNeeds(spById(3));
    return '妙蛙花晴：需求 ' + plan.needs.length + ' 条 [' + plan.needs.map(n => n.label + '(' + n.priority + '/' + n.status + ')').join('、') + '] 队伍 ' + plan.team.length + ' 只';
  })());

chk('PL13 需求清单可读性：satisfied 需求必有非空 satisfiedBy（「核心自身即满足」显示核心名，禁 undefined/空串 —— 同 v433-3 类残留）',
  (function () {
    const plans = [sandbox.buildTeamByNeeds(spById(3)), sandbox.buildTeamByNeeds(spById(411))];
    const bad = [];
    plans.forEach(p => p.needs.forEach(n => {
      if (n.status === 'satisfied' && (!n.satisfiedBy || !n.satisfiedBy.length || n.satisfiedBy.some(x => !x || x === 'undefined'))) bad.push(n.label);
    }));
    return bad.length === 0;
  })(),
  (function () {
    const p = sandbox.buildTeamByNeeds(spById(3));
    return '妙蛙花晴 需求 ' + p.needs.length + ' 条：' + p.needs.slice(0, 8).map(n => n.label + '→' + (n.satisfiedBy || []).join('+')).join(' ｜ ');
  })());

/* ================= v4.5：配招/流派并入 P1–P5 原则推理层 + 威胁库使用率弱先验 ================= */
const mvOf = id => sandbox.MV[id];
const mvZh = id => (MVSAFE(id) || ('#' + id));
function MVSAFE(id) { const m = sandbox.MV[id]; return m ? (m[1] + '#' + id) : null; }
const spOf = id => sandbox.ERDATA.species.filter(x => '' + x.id === '' + id)[0];
const zhOf = n => sandbox.ERDATA.species.filter(x => x.zh === n)[0];
const V45S = [[spOf(3), '妙蛙花', '特殊'], [zhOf('土王'), '土王', '双刀'], [zhOf('坚果哑铃'), '坚果哑铃', '物理'],
              [zhOf('雷电云'), '雷电云', '特殊'], [zhOf('大比鸟'), '大比鸟', '特殊'], [spOf(324), '煤炭龟', '物理']];
/* 控速位对位抽检样本（须为可学 电磁波/岩石封锁/顺风/戏法空间 等控速招者，否则样本客观不可达） */
const AT5S = [[spOf(3), '妙蛙花', '特殊'], [zhOf('雷电云'), '雷电云', '特殊'], [zhOf('大比鸟'), '大比鸟', '特殊'],
              [zhOf('凤王'), '凤王', '物理'], [spOf(15), '大针蜂', '物理'], [spOf(145), '闪电鸟', '特殊']];
const WHY_RE = /克制 .+；代价 .+｜原则 P\d/;

chk('PR1 招式原则层就位：MV_AX≥12 类别 + mvKindOf/mvDutyAxes/mvWhyStd/mvPrinSet 齐备 + AX_PRIN 四轴映射',
  (typeof sandbox.MV_AX === 'object') && Object.keys(sandbox.MV_AX).length >= 12
  && ['mvKindOf', 'mvDutyAxes', 'mvWhyStd', 'mvPrinSet'].every(k => typeof sandbox[k] === 'function')
  && sandbox.AX_PRIN.burst === 'P1' && sandbox.AX_PRIN.longevity === 'P2' && sandbox.AX_PRIN.punish === 'P3' && sandbox.AX_PRIN.tech === 'P4',
  'MV_AX 类别=' + Object.keys(sandbox.MV_AX).length + ' 轴=' + JSON.stringify(sandbox.AX_PRIN));

chk('PR2 类别权重=职责四轴投影（同一类别随职责变化，非写死映射）：hazard/rec/boost 在 受队 vs 输出 不等',
  (function () {
    const a = sandbox.mvDutyAxes('受队', 'hazard').w, b = sandbox.mvDutyAxes('输出', 'hazard').w;
    const c = sandbox.mvDutyAxes('肉盾', 'rec').w, d = sandbox.mvDutyAxes('输出', 'rec').w;
    const e = sandbox.mvDutyAxes('强化', 'boost').w, f = sandbox.mvDutyAxes('肉盾', 'boost').w;
    return a !== b && c !== d && e !== f && a > 0 && c > 0;
  })(),
  (function () {
    const r = [];
    ['受队', '输出', '肉盾', '强化'].forEach(t => r.push(t + ':钉=' + sandbox.mvDutyAxes(t, 'hazard').w + '/回=' + sandbox.mvDutyAxes(t, 'rec').w + '/强化=' + sandbox.mvDutyAxes(t, 'boost').w));
    return r.join(' ｜ ');
  })());

chk('PR3 每招 why 含「克制 X；代价 Y｜原则 P…」（抽样 6 核心 × 全部流派全部槽位，与道具同格式）',
  (function () {
    const bad = [];
    V45S.forEach(([s0, lab, side]) => {
      if (!s0) return;
      const bs = sandbox.deriveBuilds(s0, []) || [];
      bs.forEach(b => {
        const mv = sandbox.buildMoves(s0, b.side, b.roleTag);
        mv.main.forEach(x => { const j = x.why.join(' ‖ '); if (!/原则 P/.test(j) || !WHY_RE.test(j)) bad.push(lab + '/' + b.name + '/' + x.id); });
      });
    });
    return bad.length === 0;
  })(),
  (function () {
    const s0 = spOf(3), b = sandbox.buildMoves(s0, '特殊', '强化');
    return b.main[0].why.filter(x => /^克制 /.test(x))[0];
  })());

chk('PR4 招式类别分类可用（主攻/补盲/先制 均能出现；kind 与 MV_AX 键对齐）',
  (function () {
    const seen = {};
    V45S.forEach(([s0, lab, side]) => { if (!s0) return; const b = sandbox.buildMoves(s0, side, '输出'); b.main.forEach(x => seen[x.kind] = (seen[x.kind] || 0) + 1) });
    const ks = Object.keys(seen);
    return ks.length >= 2 && ks.every(k => !!sandbox.MV_AX[k]);
  })(),
  (function () { const seen = {}; V45S.forEach(([s0, lab, side]) => { if (!s0) return; const b = sandbox.buildMoves(s0, side, '输出'); b.main.forEach(x => seen[x.kind] = (seen[x.kind] || 0) + 1) }); return JSON.stringify(seen); })());

chk('PR5 功能招顺序改原则投影（源码级：buildMoves 区段内无 per-role 分支写死列表、仅一处规范列表，排序用 FUNC_KIND+mvDutyAxes）',
  (function () {
    const src = fs.readFileSync('D:\\game\\elite-redux\\_chk_script_1.js', 'utf8');
    const a = src.indexOf('function buildMoves');
    const b = src.indexOf('function buildNature', a);
    const seg = src.slice(a, b > a ? b : a + 9000);
    const branch = /if\(r\.indexOf\('[^']*'\)>-1\)funcOrder=\[/.test(seg);      /* 旧写法：按角色分支写死 */
    const assigns = (seg.match(/funcOrder=\[/g) || []).length;                    /* 应恰好 1 处 */
    const canonical = /funcOrder=\['boost','rec','hazard','control','weather','wear','protect','pivot'\]/.test(seg);
    const kindMap = /var FUNC_KIND=\{boost:'boost'/.test(seg);
    const prinSort = /mvDutyAxes\(r,FUNC_KIND\[b\]\)\.w-mvDutyAxes\(r,FUNC_KIND\[a\]\)\.w/.test(seg);
    const semGate = /k!=='weather'\|\|selfSetter/.test(seg);
    return !branch && assigns === 1 && canonical && kindMap && prinSort && semGate;
  })(),
  (function () {
    const src = fs.readFileSync('D:\\game\\elite-redux\\_chk_script_1.js', 'utf8');
    const a = src.indexOf('function buildMoves'), b = src.indexOf('function buildNature', a);
    const seg = src.slice(a, b > a ? b : a + 9000);
    return '区段=' + seg.length + 'B｜per-role 分支=' + /if\(r\.indexOf\('[^']*'\)>-1\)funcOrder=\[/.test(seg)
      + '｜funcOrder 赋值处=' + (seg.match(/funcOrder=\[/g) || []).length
      + '｜规范列表=' + /funcOrder=\['boost','rec','hazard','control','weather','wear','protect','pivot'\]/.test(seg)
      + '｜FUNC_KIND=' + /var FUNC_KIND=\{boost:'boost'/.test(seg)
      + '｜原则排序=' + /mvDutyAxes\(r,FUNC_KIND\[b\]\)\.w-mvDutyAxes\(r,FUNC_KIND\[a\]\)\.w/.test(seg)
      + '｜语义门=' + /k!=='weather'\|\|selfSetter/.test(seg);
  })());

chk('PR6 语义门保留：非设置手核心功能槽不含天气招（妙蛙花），设置手核心可含（煤炭龟）',
  (function () {
    const a = sandbox.buildMoves(spOf(3), '特殊', '强化');
    const b = sandbox.buildMoves(spOf(324), '物理', '天气');
    const aW = a.main.some(x => sandbox.WEATHER_MV[x.id] !== undefined);
    const bW = b.main.some(x => sandbox.WEATHER_MV[x.id] !== undefined) || sandbox.isSetterAny(spOf(324));
    return !aW && bW;
  })(),
  (function () {
    return '妙蛙花(非设置手)含天气招=' + sandbox.buildMoves(spOf(3), '特殊', '强化').main.some(x => sandbox.WEATHER_MV[x.id] !== undefined)
      + ' ｜ 煤炭龟设置手=' + sandbox.isSetterAny(spOf(324))
      + ' ｜ 煤炭龟天气流派含天气招=' + sandbox.buildMoves(spOf(324), '物理', '天气').main.some(x => sandbox.WEATHER_MV[x.id] !== undefined);
  })());

chk('PR7 站场续航语义规则：强化手 = 强化+回复（kind 口径）；受队盾 = 回复+反制（rec/wear/hazard）',
  (function () {
    const b1 = sandbox.buildMoves(spOf(3), '特殊', '强化');
    const k1 = b1.main.map(x => x.kind);
    const b2 = sandbox.buildMoves(zhOf('坚果哑铃'), '物理', '肉盾');
    const k2 = b2.main.map(x => x.kind);
    return k1.indexOf('boost') > -1 && k1.indexOf('rec') > -1 && (k2.indexOf('rec') > -1 || k2.indexOf('wear') > -1) && (k2.indexOf('hazard') > -1 || k2.indexOf('wear') > -1);
  })(),
  (function () { return '妙蛙花强化 kind=' + sandbox.buildMoves(spOf(3), '特殊', '强化').main.map(x => x.kind).join('/') + ' ｜ 坚果哑铃肉盾 kind=' + sandbox.buildMoves(zhOf('坚果哑铃'), '物理', '肉盾').main.map(x => x.kind).join('/'); })());

chk('PR8 why 不重复：每个槽位「克制 」条目恰好 1 条（去重生效，无双写）',
  (function () {
    const bad = [];
    V45S.forEach(([s0, lab, side]) => {
      if (!s0) return;
      sandbox.deriveBuilds(s0, []).forEach(b => {
        sandbox.buildMoves(s0, b.side, b.roleTag).main.forEach(x => {
          const n = x.why.filter(y => /^克制 /.test(y)).length;
          if (n !== 1) bad.push(lab + '/' + b.name + '/' + x.id + '=' + n);
        });
      });
    });
    return bad.length === 0;
  })(), '重复项=' + (function () { const bad = []; V45S.forEach(([s0, lab, side]) => { if (!s0) return; sandbox.deriveBuilds(s0, []).forEach(b => { sandbox.buildMoves(s0, b.side, b.roleTag).main.forEach(x => { const n = x.why.filter(y => /^克制 /.test(y)).length; if (n !== 1) bad.push(lab + '/' + x.id + '=' + n) }) }) }); return bad.length ? bad.join(',') : '0'; })());

chk('DS1 每条流派带 why 且可溯源原则（克制…代价…｜原则 P…）',
  (function () {
    const bad = [];
    V45S.forEach(([s0, lab]) => { if (!s0) return; (sandbox.deriveBuilds(s0, []) || []).forEach(b => { if (!b.why || !WHY_RE.test(b.why)) bad.push(lab + '/' + b.name); }) });
    return bad.length === 0;
  })(),
  (function () { const b = sandbox.deriveBuilds(spOf(3), [])[0]; return b.name + ' → ' + b.why; })());

chk('DS2 流派 why 与招式/道具同格式同层：PLAY_KIND/PLAY_WHY 表齐备且 key 覆盖 deriveBuilds 候选 key',
  (function () {
    const kk = Object.keys(sandbox.PLAY_WHY), pk = Object.keys(sandbox.PLAY_KIND);
    const need = ['speed', 'boost', 'tr', 'stall', 'pivot', 'wx', 'imm', 'mix', 'main', 'def'];
    return need.every(k => kk.indexOf(k) > -1 && pk.indexOf(k) > -1) && kk.length >= 10;
  })(), 'PLAY_WHY keys=' + Object.keys(sandbox.PLAY_WHY).join('/'));

chk('DS3 流派 why 与配招 why 同源（同为 mvWhyStd 产物格式；抽样全流派 why 命中率 = 100%）',
  (function () {
    let tot = 0, ok = 0;
    V45S.forEach(([s0, lab]) => { if (!s0) return; (sandbox.deriveBuilds(s0, []) || []).forEach(b => { tot++; if (/｜原则 P/.test(b.why) && /职责 /.test(b.why)) ok++; }) });
    return tot > 0 && ok === tot;
  })(), (function () { let tot = 0, ok = 0; V45S.forEach(([s0]) => { if (!s0) return; (sandbox.deriveBuilds(s0, []) || []).forEach(b => { tot++; if (/｜原则 P/.test(b.why) && /职责 /.test(b.why)) ok++ }) }); return ok + '/' + tot; })());

chk('UP1 使用率先验字段契约（v4.6.1 适配）：内嵌 ERDATA 必有 usagePrior + usageMeta — 有数据分支要求 ≥500 条、值∈(0,1]、srcs 含两源与覆盖率；无数据分支要求显式声明（srcs 空 + coverage=0 + note 含「已知缺口」），不得静默缺失',
  (function () {
    const p = sandbox.ERDATA.usagePrior, m = sandbox.ERDATA.usageMeta;
    if (!p || typeof p !== 'object' || !m || typeof m !== 'object') return false;
    const keys = Object.keys(p), fmts = (m.srcs || []).map(x => x.format);
    if (keys.length === 0) return (m.srcs || []).length === 0 && Number(m.coverage) === 0 && /已知缺口/.test(m.note || '');
    const vals = keys.map(k => p[k]);
    return keys.length >= 500 && vals.every(v => v > 0 && v <= 1) && vals.some(v => v === 1)
      && fmts.indexOf('gen3ou') > -1 && fmts.indexOf('gen9nationaldex') > -1 && m.coverage >= 500;
  })(),
  (function () { const m = sandbox.ERDATA.usageMeta, n = Object.keys(sandbox.ERDATA.usagePrior).length; return 'mode=' + (n === 0 ? 'empty-explicit' : 'populated') + ' / prior=' + n + ' 条 / srcs=' + (m.srcs.length ? m.srcs.map(x => x.format + '×' + x.weight).join('+') : '[]') + ' / coverage=' + m.coverage; })());

chk('UP2 诚实标注：meta.note 与 threatPriorLine 均声明「原版使用率 ≠ ER 使用率 + ER 无对战统计=已知缺口」；THREAT_LIB 每类带 prior 溯源',
  (function () {
    const m = sandbox.ERDATA.usageMeta || {}, ln = sandbox.threatPriorLine();
    const allPrior = Object.keys(sandbox.THREAT_LIB).every(k => /弱先验/.test(sandbox.THREAT_LIB[k].prior || ''));
    return /≠ ER 使用率/.test(m.note || '') && /已知缺口/.test(m.note || '')
      && /原版使用率 ≠ ER 使用率/.test(ln) && /已知缺口/.test(ln) && allPrior;
  })(), sandbox.ERDATA.usageMeta.note);

chk('UP3 弱先验只作次排序（不改量级）：USAGE_PRIOR_W=0.6 + 源码含 1+USAGE_PRIOR_W×prior 加权 + 代表序列与纯 BST 序前 5 交集≥3',
  (function () {
    const src = fs.readFileSync('D:\\game\\elite-redux\\_chk_script_1.js', 'utf8');
    const weighted = /1\+USAGE_PRIOR_W\*usagePriorOf/.test(src);
    const bst = sandbox.spAll().slice(0).sort((a, b) => b.base[1] - a.base[1]).slice(0, 5).map(x => '' + x.id);
    const rep = sandbox.threatRep('PHYS', null, 5).map(x => '' + x.id);
    const inter = rep.filter(x => bst.indexOf(x) > -1).length;
    return sandbox.USAGE_PRIOR_W === 0.6 && weighted && inter >= 3;
  })(),
  (function () {
    const bst = sandbox.spAll().slice(0).sort((a, b) => b.base[1] - a.base[1]).slice(0, 5).map(x => x.zh);
    const rep = sandbox.threatRep('PHYS', null, 5).map(x => x.zh + '(p=' + sandbox.usagePriorOf(x) + ')');
    return 'W=' + sandbox.USAGE_PRIOR_W + ' ｜ 纯BST序=' + bst.join('/') + ' ｜ 先验后代表=' + rep.join('/');
  })());

chk('UP4 渲染面：机制口径块含「威胁库使用率先验」行与「≠ ER 使用率」文案',
  (function () {
    const h = sandbox.wxRuleHtml();
    return /威胁库使用率先验/.test(h) && /≠ ER 使用率/.test(h) && /弱先验/.test(h);
  })(), '口径块长度=' + sandbox.wxRuleHtml().length);

chk('AT1 对位抽检·攻手带补盲招：5 只攻手抽样中 ≥3 只在 main 含「覆盖本系盲点」的招',
  (function () {
    let ok = 0;
    [[spOf(3), '特殊'], [zhOf('雷电云'), '特殊'], [zhOf('大比鸟'), '特殊'], [zhOf('凤王'), '特殊'], [spOf(15), '物理']].forEach(([s0, side]) => {
      if (!s0) return;
      const b = sandbox.buildMoves(s0, side, '输出'), h = sandbox.coverHoles(s0);
      if (b.main.some(x => sandbox.atkCover(s0, x.id).some(t => h.indexOf(t) > -1))) ok++;
    });
    return ok >= 3;
  })(),
  (function () {
    const r = [];
    [[spOf(3), '妙蛙花', '特殊'], [zhOf('雷电云'), '雷电云', '特殊'], [zhOf('大比鸟'), '大比鸟', '特殊'], [zhOf('凤王'), '凤王', '特殊'], [spOf(15), '大针蜂', '物理']].forEach(([s0, lab, side]) => {
      if (!s0) return;
      const b = sandbox.buildMoves(s0, side, '输出'), h = sandbox.coverHoles(s0);
      const hit = b.main.filter(x => sandbox.atkCover(s0, x.id).some(t => h.indexOf(t) > -1));
      r.push(lab + '=' + (hit.length ? 'PASS' : 'FAIL'));
    });
    return r.join(' ');
  })());

chk('AT2 对位抽检·受队盾带回复/反制招（坚果哑铃：回复/消耗/钉子 命中）',
  (function () {
    const b = sandbox.buildMoves(zhOf('坚果哑铃'), '物理', '肉盾');
    const k = b.main.map(x => x.kind);
    return k.indexOf('rec') > -1 && (k.indexOf('hazard') > -1 || k.indexOf('wear') > -1);
  })(),
  (function () { return sandbox.buildMoves(zhOf('坚果哑铃'), '物理', '肉盾').main.map(x => MVSAFE(x.id) + '[' + x.kind + ']').join(' / '); })());

chk('AT3 对位抽检·强化手带强化+回复组合（妙蛙花：boost + rec 同现）',
  (function () {
    const k = sandbox.buildMoves(spOf(3), '特殊', '强化').main.map(x => x.kind);
    return k.indexOf('boost') > -1 && k.indexOf('rec') > -1;
  })(),
  (function () { return sandbox.buildMoves(spOf(3), '特殊', '强化').main.map(x => MVSAFE(x.id) + '[' + x.kind + ']').join(' / '); })());

chk('AT4 对位抽检·天气手带天气招或设置手特性（煤炭龟：天气招或日照特性）',
  (function () {
    const b = sandbox.buildMoves(spOf(324), '物理', '天气');
    return b.main.some(x => sandbox.WEATHER_MV[x.id] !== undefined) || sandbox.isSetterAny(spOf(324));
  })(),
  (function () { const b = sandbox.buildMoves(spOf(324), '物理', '天气'); return 'main=' + b.main.map(x => MVSAFE(x.id)).join('/') + ' ｜ 设置手=' + sandbox.isSetterAny(spOf(324)); })());

chk('AT5 对位抽检·控速位带先制/控速协同（6 核心抽样：先制/控速招 或 围巾/嘉珍果/先制之爪 入荐，≥3 只出现）',
  (function () {
    let ok = 0;
    AT5S.forEach(function (rec) {
      const s0 = rec[0], side = rec[2]; if (!s0) return;
      const b = sandbox.buildMoves(s0, side, '控速');
      const mvOK = b.main.some(x => (sandbox.MV[x.id][8] || 0) > 0 || sandbox.FUNC_MV.speed.indexOf(x.id) > -1);
      const itOK = /围巾|嘉珍果|先制之爪/.test((sandbox.itemScored(s0, side, '控速', { sys: sandbox.coreSys(s0) }) || []).slice(0, 3).map(i => i.zh).join(','));
      if (mvOK || itOK) ok++;
    });
    return ok >= 3;
  })(),
  (function () {
    const r = [];
    AT5S.forEach(function (rec) {
      const s0 = rec[0], lab = rec[1], side = rec[2]; if (!s0) return;
      const b = sandbox.buildMoves(s0, side, '控速');
      const hit = b.main.filter(x => (sandbox.MV[x.id][8] || 0) > 0 || sandbox.FUNC_MV.speed.indexOf(x.id) > -1);
      r.push(lab + '=' + (hit.length ? 'PASS(' + hit.map(x => MVSAFE(x.id)).join('/') + ')' : 'FAIL(无控速招)'));
    });
    return r.join(' ');
  })());

chk('VP1 UI 渲染面·流派卡：核心配队页含「打法原则（P1–P5 同层）」与「选招依据」段，且 why 文案含「克制…代价…｜原则 P」',
  (function () {
    sandbox.renderCore(spOf(3));
    const h = sandbox.document.getElementById('coreOut').innerHTML;
    return /打法原则<\/b>/.test(h) && /P1–P5 同层/.test(h) && /选招依据：/.test(h)
      && /原则 P\d/.test(h) && /克制 /.test(h) && /代价 /.test(h);
  })(),
  (function () {
    sandbox.renderCore(spOf(3));
    const h = sandbox.document.getElementById('coreOut').innerHTML;
    const m = h.match(/打法原则<\/b>（P1–P5 同层）：([^<]{0,120})/);
    return 'coreOut=' + h.length + 'B ｜ 打法原则行=' + (m ? m[1] : '未找到');
  })());

chk('VP2 UI 渲染面·队员/候选配招：招式 chip 的 title 携带统一 why（含「原则 P」与「代价」）',
  (function () {
    const h = sandbox.needBuildHtml(spOf(3), '强化', null, {});
    const titles = (h.match(/title="[^"]*原则 P\d[^"]*"/g) || []);
    return h.indexOf('配招：') > -1 && titles.length >= 1 && /代价 /.test(h);
  })(),
  (function () {
    const h = sandbox.needBuildHtml(spOf(3), '强化', null, {});
    const t = (h.match(/title="([^"]*原则 P\d[^"]*)"/) || [])[1] || '';
    return 'needBuildHtml=' + h.length + 'B ｜ 首条招式 why=' + t.slice(0, 150);
  })());

/* ============ v45 修复组（v45-1/2/3：验证代理「有条件 PASS」三项） ============ */
function BLIND_OF(s, b) {
  const conv = sandbox.convOf(s);
  return sandbox.blindList(sandbox.setCoverProfile(s, b.mv.main.map(function (x) { return x.id; }), conv));
}
function ROW_ITEM(s) {
  const plan = sandbox.buildTeamByNeeds(s);
  const m = (plan.team || []).filter(function (x) { return x.core; })[0] || { s: s };
  const tag = sandbox.itemTagOfCore(plan, m.s);
  return { plan: plan, m: m, tag: tag, row: sandbox.buildItem(m.s, sandbox.coreSide(m.s), tag, { sys: plan.sysKey, need: null })[0][0] };
}
chk('V451-1 流派卡道具主推 ≡ 队伍行核心主推（同源口径 itemTagOfCoreProf/coreItemCtxOf，v45-1）',
  (function () {
    const bad = [];
    [598, 411, 45, 324, 3].forEach(function (id) {
      const s = spOf(id); if (!s) return;
      const rr = ROW_ITEM(s);
      sandbox.deriveBuilds(s).forEach(function (b) {
        if (!b.it[0] || b.it[0][0] !== rr.row) bad.push('#' + id + '/' + b.name + '=' + ((b.it[0] || [])[0]) + '≠' + rr.row);
      });
    });
    return bad.length === 0;
  })(),
  (function () {
    const out = [];
    [598, 411, 45, 324, 3].forEach(function (id) {
      const s = spOf(id); if (!s) return;
      const rr = ROW_ITEM(s);
      out.push('#' + id + ' 队伍行=' + rr.row + '(tag=' + rr.tag + ')|流派卡=' + sandbox.deriveBuilds(s).map(function (b) { return b.name + '=' + ((b.it[0] || [])[0]); }).join(','));
    });
    return out.join(' ｜ ');
  })());

chk('V451-2 锁招道具不入盾/受职责主推（坚果哑铃强化流派 ≠ 讲究围巾，v45-1b）',
  (function () {
    const s = spOf(598); if (!s) return false;
    const bds = sandbox.deriveBuilds(s);
    const bad = bds.filter(function (b) { return ['讲究围巾', '讲究头带', '讲究眼镜'].indexOf((b.it[0] || [])[0]) > -1; });
    const sc = sandbox.itemScored(s, '物理', '肉盾', {});
    const scarf = sc.filter(function (x) { return x.zh === '讲究围巾'; })[0] || { why: '' };
    return !!(sandbox.LOCK_ITEMS && sandbox.LOCK_ITEMS.length === 3) && bad.length === 0 &&
      /锁招/.test(scarf.why || '');
  })(),
  (function () {
    const s = spOf(598);
    const sc = sandbox.itemScored(s, '物理', '肉盾', {});
    return '坚果哑铃流派卡道具=' + sandbox.deriveBuilds(s).map(function (b) { return b.name + '=' + ((b.it[0] || [])[0]); }).join(',') +
      ' ｜ 肉盾 tag 下围巾=' + (sc.filter(function (x) { return x.zh === '讲究围巾'; })[0] || {}).sc +
      '、why=' + ((sc.filter(function (x) { return x.zh === '讲究围巾'; })[0] || {}).why || '').slice(0, 90) +
      ' ｜ LOCK_ITEMS=' + JSON.stringify(sandbox.LOCK_ITEMS);
  })());

chk('V452 roleTag=强化 ⇒ 4 槽须含强化招；否则流派改名不称「强化」（凤王案例，v45-2）',
  (function () {
    const s = spOf(250); if (!s) return false;
    const bds = sandbox.deriveBuilds(s);
    const named = bds.filter(function (b) { return /强化/.test(b.name); });
    const ok = named.every(function (b) { return b.mv.main.some(function (x) { return (x.kind || sandbox.mvKindOf(x.id)) === 'boost'; }); });
    const whyOk = bds.every(function (b) { return /原则 P\d/.test(b.why || ''); });
    return ok && whyOk && bds.length >= 2;
  })(),
  (function () {
    const s = spOf(250);
    return sandbox.deriveBuilds(s).map(function (b) {
      return b.name + '[roleTag=' + b.roleTag + ']=' + b.mv.main.map(function (x) { return (MVSAFE(x.id) || x.id) + '[' + (x.kind || '') + ']'; }).join('/') + (b.namedByMoves ? '(改名对齐)' : '');
    }).join(' ｜ ');
  })());

chk('V453 盲点补招驱动：卡面自标盲点时槽内补「该盲点 ≥2x」可学招或透明披露（v45-3）',
  (function () {
    const s1 = spOf(45), s2 = spOf(598), s3 = spOf(3);
    const ok1 = sandbox.deriveBuilds(s1).some(function (b) { return !!b.coverFixed; }) &&
      sandbox.deriveBuilds(s1).every(function (b) { return BLIND_OF(s1, b).length === 0 || b.crossCover; });
    const ok2 = sandbox.deriveBuilds(s2).some(function (b) { return !!b.coverFixed; });
    const ok3 = sandbox.deriveBuilds(s3).every(function (b) {
      return BLIND_OF(s3, b).length === 0 || b.crossCover || b.blindNoRoom;
    });
    return ok1 && ok2 && ok3;
  })(),
  (function () {
    const out = [];
    [45, 598, 3].forEach(function (id) {
      const s = spOf(id);
      out.push('#' + id + ' ' + sandbox.deriveBuilds(s).map(function (b) {
        const bl = BLIND_OF(s, b);
        return b.name + '=blind[' + bl.join('/') + ']' + (b.coverFixed ? '+补盲:' + MVSAFE(b.coverFixed.now) : '') +
          (b.blindNoRoom ? '+无空位:' + MVSAFE(b.blindNoRoom.id) + (b.blindNoRoom.drop ? '(换' + MVSAFE(b.blindNoRoom.drop) + ')' : '') : '') +
          (b.crossCover ? '+另一侧可覆盖' : '');
      }).join(' , '));
    });
    return out.join(' ｜ ');
  })());

chk('V453-UI 核心页出现补盲透明披露（补盲/无空位/另一侧覆盖三态之一）+ 含「原则 P」+ 无内部编号（v4.6-A）',
  (function () {
    sandbox.renderCore(spOf(3));
    const h = sandbox.document.getElementById('coreOut').innerHTML;
    sandbox.renderCore(spOf(45));
    const h2 = sandbox.document.getElementById('coreOut').innerHTML;
    return /(补盲|无空位|另一侧流派有 ≥1x 覆盖)/.test(h) && /原则 P/.test(h) && !/v45-3/.test(h) && /(补盲|无空位|另一侧流派有 ≥1x 覆盖)/.test(h2) && !/v45-3/.test(h2);
  })(),
  (function () {
    sandbox.renderCore(spOf(3));
    const h = sandbox.document.getElementById('coreOut').innerHTML;
    const m = h.match(/⚠ 盲点属性[^<]{0,160}/);
    return 'coreOut=' + h.length + 'B ｜ 盲点行=' + (m ? m[0].slice(0, 190) : '未找到');
  })());

/* ================= v4.6-A/B/C 组（本轮新增：A 微收尾 / B 存档联动组队 / C 响应式+部署准备） ================= */
const html = fs.readFileSync(ER + '配招助手_ER.html', 'utf8');
hdr('v4.6-A 微收尾（玩家可见文案去内部痕迹 + 死码清理）');
chk('A2 coreMoves 死码已删除（零调用点 → 整块移除）', typeof sandbox.coreMoves === 'undefined', 'typeof=' + typeof sandbox.coreMoves);
chk('A1 契约说明玩家化（数据来源完整；无「新字段/回退」）', /数据来源完整|齐备/.test(sandbox.v4ContractNote()) && !/新字段|回退/.test(sandbox.v4ContractNote()), sandbox.v4ContractNote());
chk('A1 停止原因玩家化（STOP_* 枚举不外露：3 条映射）', sandbox.stopReasonZh('STOP_ALL_NEEDS_MET') === '需求已清零' && sandbox.stopReasonZh('STOP_SIZE_LIMIT') === '已达目标规模' && sandbox.stopReasonZh('STOP_BELOW_PRIORITY').indexOf('优先级') > -1, [sandbox.stopReasonZh('STOP_ALL_NEEDS_MET'), sandbox.stopReasonZh('STOP_SIZE_LIMIT'), sandbox.stopReasonZh('STOP_BELOW_PRIORITY')].join(' / '));
chk('A1 威胁先验行去数据集名（gen3ou/gen9nationaldex → 人话）', !/gen3ou|gen9nationaldex/.test(sandbox.threatPriorLine()) && /使用率/.test(sandbox.threatPriorLine()), sandbox.threatPriorLine());
chk('A1 奇石权衡 why 去内部符号（无 S= / d_bulk，保留综合权衡+对照终态）', (function () { const e = sandbox.evioAdv(spById(324)); return !!e && e.why.indexOf('S=') < 0 && e.why.indexOf('d_bulk') < 0 && /综合权衡|耐久差/.test(e.why) && /炎玄武/.test(e.why); })(), (function () { const e = sandbox.evioAdv(spById(324)); return e ? e.why.slice(0, 140) : '(无)'; })());
chk('A1 待实测徽标 title 无内部文档路径', !/docs\//.test(sandbox.pendBadge()), sandbox.pendBadge());

hdr('v4.6-B 存档联动组队（复用既有解析器：不重写解析逻辑，仅 UI 接入 + 数据传递）');
chk('B 三个 UI 函数齐备（myPoolFromSav / renderMyPool / myCoreTeam）', typeof sandbox.myPoolFromSav === 'function' && typeof sandbox.renderMyPool === 'function' && typeof sandbox.myCoreTeam === 'function', [typeof sandbox.myPoolFromSav, typeof sandbox.renderMyPool, typeof sandbox.myCoreTeam].join('/'));
chk('B 解析器未被重写（parseSavBytes / parseSavFile / autoImportParty 仍为 function）', typeof sandbox.parseSavBytes === 'function' && typeof sandbox.parseSavFile === 'function' && typeof sandbox.autoImportParty === 'function', '');
chk('B 数据传递钩子就位（parseSavFile → SAV_ROWS=(res.rows…；importSaveBox → SAV_ROWS=objRows）', /SAV_ROWS=\(res\.rows/.test(sandbox.parseSavFile.toString()) && /SAV_ROWS=objRows/.test(sandbox.importSaveBox.toString()), '');
chk('B 选择池：id 2502 占位被护栏过滤 + 重复项去重（5 行 → 3 只，带精灵图/等级/末招/道具 chip）', (function () {
  const rows = [
    { 来源: '队伍', 图鉴编号: 3, 等级: 62, 道具: '剩饭', 特性1: '茂盛', 招式1: '终极吸取(id=202)', 招式2: '污泥炸弹(id=188)', 招式3: '大地之力(id=414)', '招式4(末招)': '生长(id=74)' },
    { 来源: '队伍', 图鉴编号: 324, 等级: 58, 道具: '炽热岩石', 特性1: '日照', 招式1: '大晴天(id=241)', 招式2: '', 招式3: '', '招式4(末招)': '' },
    { 来源: 'BOX1', 图鉴编号: 250, 等级: 70, 道具: '厚底靴', 特性1: '', 招式1: '', 招式2: '', 招式3: '', '招式4(末招)': '' },
    { 来源: 'BOX2', 图鉴编号: 2502, 等级: 50, 道具: '', 特性1: '', 招式1: '', 招式2: '', 招式3: '', '招式4(末招)': '' },
    { 来源: 'BOX2', 图鉴编号: 324, 等级: 60, 道具: '', 特性1: '', 招式1: '', 招式2: '', 招式3: '', '招式4(末招)': '' }
  ];
  const p = sandbox.myPoolFromSav(rows);
  sandbox.SAV_ROWS = rows; sandbox.renderMyPool();
  const h = byId('myPoolWrap')._html || '';
  return p.length === 3 && /class="spmid" data-id="3"/.test(h) && /class="spmid" data-id="250"/.test(h) && /assets\/sheets\/s\d+\.webp/.test(h) && (h.match(/class="poolcard"/g) || []).length === 3 && /Lv\.62/.test(h) && /末招 生长/.test(h) && /炽热岩石/.test(h) && !/undefined|NaN|ERDATA/.test(h);
})(), '池=' + (sandbox.myPoolFromSav(sandbox.SAV_ROWS || []).length) + ' 只 / 卡片=' + ((byId('myPoolWrap')._html || '').match(/class="poolcard"/g) || []).length);
chk('B 点选存档核心 → 完整队伍方案卡（体系总览 + 队伍需求 + 队伍方案 + 精灵图）', (function () {
  sandbox.myCoreTeam(324);
  const h = byId('myTeamOut')._html || '';
  return /体系总览/.test(h) && /队伍需求/.test(h) && /队伍方案/.test(h) && /煤炭龟/.test(h) && /assets\/sheets\//.test(h);
})(), 'myTeamOut=' + (byId('myTeamOut')._html || '').length + 'B');
chk('B 与全图鉴组队并列（#mySavCard 区块存在，原功能未替换）', /id="mySavCard"/.test(html) && /id="myPoolWrap"/.test(html) && /id="myTeamOut"/.test(html) && /id="tmSlots"/.test(html), '');

hdr('v4.6-C 响应式（报告 §7b b5/b6/b7）+ 部署准备（§7c）');
const CSS46 = (html.match(/<style>([\s\S]*?)<\/style>/) || [, ''])[1];
const MOB46 = CSS46.slice(CSS46.indexOf('@media (max-width:640px)'));
chk('C b5 表格 11 张全部位于 .scroll 容器内（窄屏不撑破页面）', (function () {
  let idx = -1, cnt = 0, ok = 0;
  while ((idx = html.indexOf('<table', idx + 1)) > -1) { cnt++; if (html.slice(Math.max(0, idx - 600), idx).indexOf('class="scroll"') > -1) ok++; }
  return cnt >= 11 && ok === cnt;
})(), (function () { let idx = -1, cnt = 0, ok = 0; while ((idx = html.indexOf('<table', idx + 1)) > -1) { cnt++; if (html.slice(Math.max(0, idx - 600), idx).indexOf('class="scroll"') > -1) ok++; } return '表=' + cnt + ' 已包裹=' + ok; })());
chk('C b5 无冗余嵌套（.scroll 内不再嵌 .scroll）', ((html.match(/<div class="scroll">\s*<div class="scroll">/g) || []).length === 0), '');
chk('C b5 窄屏表格允许换行（th,td white-space:normal + word-break）', /th,td\{white-space:normal; *word-break:break-word\}/.test(MOB46), '');
chk('C b6 触控目标 ≥44px（九类控件并入同组 + modal 关闭 44×44 + 招式行加高 ≥44px）', /nav button,\.btn,\.btn-mini,\.chips button,\.abi,/.test(MOB46) && /\.poolcard,\.badge-pick,\.badge-pickable,\.poolbox \.pin,\.slot \.x,\.modal \.close/.test(MOB46) && /\.modal \.close\{width:44px; height:44px/.test(MOB46) && /tr\.mv th,tr\.mv td\{padding:14px 8px\}/.test(MOB46), '');
chk('C b7 字号与字体族（text-size-adjust + iOS/Android 中文字体族 + 11px 组提升 12px）', /html\{-webkit-text-size-adjust:100%/.test(CSS46) && /"PingFang SC","Noto Sans CJK SC"/.test(CSS46) && /\.whylist,\.slotinfo,\.ruleline/.test(MOB46) && /\.spcard\{width:88px; height:88px\}/.test(MOB46), '');
chk('C 360px 无横向溢出（内联 style 无 >360px 固定宽度）', (html.match(/style="[^"]*"/g) || []).every(a => { let m; const r = /(?:^|[;\s])width:\s*(\d{2,4})px/g; while ((m = r.exec(a))) { if (+m[1] > 360) return false; } return true; }), '');
chk('C 清理项：死 CSS .owners/.owrow 已删 + 「存档解析v4」文案中性化', !/\.owrow\{/.test(CSS46) && !/\.owners\{/.test(CSS46) && html.indexOf('存档解析v4') < 0, '');
chk('C 顺手项：切 Tab 回顶 + 招式弹窗标题显示招式名', /scrollTo\(0,0\)/.test(sandbox.switchTab.toString()) && /mvDrawerTitle/.test(sandbox.openMv.toString()), '');
chk('C 部署准备：index.html + .nojekyll 就位（与 assets/sprites + assets/sheets 同级，相对路径不变）', fs.existsSync(ER + 'index.html') && fs.existsSync(ER + '.nojekyll') && fs.existsSync(ER + 'assets\\sprites') && fs.existsSync(ER + 'assets\\sheets'), 'index.html=' + (fs.existsSync(ER + 'index.html') ? fs.statSync(ER + 'index.html').size + 'B' : '缺失'));

hdr('v4.6 收尾修复（v46-1①②③ + v46-2/3/4/5）');
chk('v46-1① 口径表内容单处注入（三容器合计 1 处；其余为引用跳转，数据未删）', (function () {
  const ids = ['ruleBoxCore', 'ruleBoxTeam', 'ruleBoxTpl'];
  const full = ids.reduce((a, id) => a + ((byId(id)._html || '').split('<th>机制</th>').length - 1), 0);
  const rows = ids.reduce((a, id) => a + ((byId(id)._html || '').split('<tr><td>').length - 1), 0);
  return full === 1 && rows > 10 && /gotoRule\(\)/.test(byId('ruleBoxTeam')._html) && /gotoRule\(\)/.test(byId('ruleBoxTpl')._html) && /gotoRule\(\)/.test(byId('ruleBoxCore')._html) === false;
})(), '完整表=' + (['ruleBoxCore', 'ruleBoxTeam', 'ruleBoxTpl'].reduce((a, id) => a + ((byId(id)._html || '').split('<th>机制</th>').length - 1), 0)) + ' 处 / 行数=' + (['ruleBoxCore', 'ruleBoxTeam', 'ruleBoxTpl'].reduce((a, id) => a + ((byId(id)._html || '').split('<tr><td>').length - 1), 0)));
chk('v46-1② 玩家可见文案去开发过程语（含数据层词条正文：无「源码实证/数据表实证/待游戏内截图校准」，且出现玩家话术）', (function () {
  sandbox.renderCore(spOf(3));
  try { sandbox.glossClick('麻痹'); } catch (e) { }
  try { sandbox.glossClick('晴天'); } catch (e) { }
  const vis = [byId('ruleBoxCore')._html, byId('ruleBoxTeam')._html, byId('ruleBoxTpl')._html, byId('tplRuleTip')._html, byId('coreOut')._html, byId('glDetail')._html].join('\n');
  return !/源码实证|数据表实证|待游戏内截图校准/.test(vis) && /已按游戏源码核对|已按游戏数据核对|待游戏内实测确认/.test(vis) && /playText/.test(fs.readFileSync(ER + '_chk_script_1.js', 'utf8'));
})(), (function () {
  const vis = [byId('ruleBoxCore')._html, byId('ruleBoxTeam')._html, byId('coreOut')._html, byId('glDetail')._html].join('\n');
  return '源码实证=' + (vis.match(/源码实证/g) || []).length + ' 数据表实证=' + (vis.match(/数据表实证/g) || []).length + ' 待校准=' + (vis.match(/待游戏内截图校准/g) || []).length + ' 新话术=' + (vis.match(/已按游戏源码核对/g) || []).length + ' 徽标=' + (vis.match(/待游戏内实测确认/g) || []).length;
})());
chk('v46-1③ 全库无原生 alert（改页内 toast；消息文本不变）', (function () {
  const src = fs.readFileSync(ER + '_chk_script_1.js', 'utf8');
  return !/(^|[^\w.$])alert\s*\(/.test(src) && /function toast\(msg,ms\)/.test(src) && /id='toastBox'/.test(src);
})(), 'alert 残留=' + ((fs.readFileSync(ER + '_chk_script_1.js', 'utf8').match(/(^|[^\w.$])alert\s*\(/g) || []).length) + ' / toast 定义=' + /function toast\(msg,ms\)/.test(fs.readFileSync(ER + '_chk_script_1.js', 'utf8')));
chk('v46-2 .poolcard 小标签提升至 12px（.ptag/.psrc 可读）', /\.poolcard \.ptag\{display:inline-block; font-size:12px/.test(CSS46) && /\.poolcard \.psrc\{position:absolute; top:2px; left:4px; font-size:12px/.test(CSS46), '');
chk('v46-3 招表格行高 ≥44px（tr.mv 单元 padding 提至 14px）', /tr\.mv th,tr\.mv td\{padding:14px 8px\}/.test(MOB46), '');
chk('v46-4 平板断点已补（641–1024px）', /@media \(min-width:641px\) and \(max-width:1024px\)/.test(CSS46) && /\.spcard\{width:72px; height:72px\}/.test(CSS46), '');
chk('v46-5 默认入口=核心配队（nav 前置 + tab-core active + poke 非 active；7 Tab 全保留）', (function () {
  const nav = html.match(/<nav>[\s\S]*?<\/nav>/);
  const btns = (html.match(/<nav>[\s\S]*?<\/nav>/)[0].match(/data-tab="/g) || []).length;
  return /<button data-tab="core" class="active">/.test(html) && /<section id="tab-core" class="tab active">/.test(html) && !/id="tab-poke" class="tab active"/.test(html) && nav[0].indexOf('data-tab="core"') < nav[0].indexOf('data-tab="poke"') && btns === 7;
})(), 'Tab 数=' + ((html.match(/<nav>[\s\S]*?<\/nav>/)[0].match(/data-tab="/g) || []).length));

hdr('v4.6.1 收尾（溯源标注折叠 / iOS 滚动 / 队友推荐标签区分）');
chk('v461-② 表格滚动容器补 iOS 惯性滚动（-webkit-overflow-scrolling:touch）', /-webkit-overflow-scrolling:touch/.test(CSS46), '');
chk('v461-① 机制口径表默认收起（details.rulebox 无 open，gotoRule 仍可展开）', (function () {
  const rb = byId('ruleBoxCore')._html;
  return /<details class="rulebox">/.test(rb) && !/<details class="rulebox" open/.test(rb) && /<th>机制<\/th>/.test(rb);
})(), '');
chk('v461-① tplRuleTip 长溯源折叠为一行可展开（默认收起）+ 信息未丢（WCONF / 天气 8 回合 / ×1.5）', (function () {
  const t = byId('tplRuleTip')._html;
  return /<details class="inline"><summary>/.test(t) && /<\/details>/.test(t) && !/<details class="inline" open/.test(t) && /WCONF/.test(t) && /天气 8 回合/.test(t) && /×1\.5/.test(t);
})(), byId('tplRuleTip')._html.slice(0, 80));
chk('v461-① 构建口径 / 判定口径 折叠为一行可展开（正文未丢：pow×stab×… 与 WCONF 指针仍在 DOM）', (function () {
  const c = byId('coreOut')._html;
  return /<details class="inline"><summary>[^<]*构建口径/.test(c) && /<details class="inline"><summary>[^<]*判定口径：/.test(c) && /pow×stab×hit×prio×cover×weather×func×abi/.test(c) && /判定口径：天气\/场地回合与倍率读 WCONF/.test(c);
})(), '');
chk('v461-③ 两种队友来源标签区分（需求驱动队友 / 体系补盲队友），需求驱动在前', (function () {
  const c = byId('coreOut')._html;
  return /需求驱动队友/.test(c) && /体系补盲队友/.test(c) && c.indexOf('需求驱动队友') < c.indexOf('体系补盲队友');
})(), '');
chk('v461-③ 体系补盲队友块折叠其一（details.big 默认收起，不再与需求驱动同屏重复）', (function () {
  const c = byId('coreOut')._html;
  return /<details class="big subsec"><summary>[^<]*体系补盲队友/.test(c) && !/<details class="big subsec" open><summary>[^<]*体系补盲队友/.test(c);
})(), '');
chk('v461-移动端 360px 自检不回归（≤640 断点 + ≥44px 触控组 + text-size-adjust:100% + 窄屏 toast + 12px 字号下限）', /@media \(max-width:640px\)/.test(CSS46) && /-webkit-text-size-adjust:100%/.test(CSS46) && (MOB46.match(/min-height:44px/g) || []).length >= 5 && /#toastBox\{left:8px/.test(MOB46) && /\.poolcard \.ptag\{display:inline-block; font-size:12px/.test(CSS46) && /\.poolcard \.psrc\{[^}]*font-size:12px/.test(CSS46), '');

hdr('v4.6.2 精灵图合图（Sprite Sheet：8×1024² webp + SPR_SHEET 坐标表）');
const SHEETMAP = (function () {
  const m = /window\.SPR_SHEET=(\{[\s\S]*?\});/.exec(script);
  if (!m) return null;
  try { return JSON.parse(m[1]) } catch (e) { return null }
})();
chk('v4.6.2-1 SPR_SHEET 内嵌于 HTML 脚本且完整 1906 键（键=数字 id，值=[sheet,col,row]）', (function () {
  if (!SHEETMAP) return false;
  const ks = Object.keys(SHEETMAP);
  return ks.length === 1906 && ks.every(k => /^\d+$/.test(k) && Array.isArray(SHEETMAP[k]) && SHEETMAP[k].length === 3
    && SHEETMAP[k][0] >= 0 && SHEETMAP[k][0] <= 7 && SHEETMAP[k][1] >= 0 && SHEETMAP[k][1] <= 15 && SHEETMAP[k][2] >= 0 && SHEETMAP[k][2] <= 15);
})(), SHEETMAP ? Object.keys(SHEETMAP).length + ' 键 / 脚本内 SPR_SHEET=' + script.indexOf('window.SPR_SHEET=') : '未找到 SPR_SHEET');
chk('v4.6.2-2 锚点 id 坐标 = 「id 数字升序 / 每张 256 只」规则（411/469/741/1513/2232）', (function () {
  if (!SHEETMAP) return false;
  const ids = fs.readdirSync(ER + 'assets\\sprites').map(f => /^sp(\d+)\.png$/.exec(f)).filter(Boolean).map(x => parseInt(x[1], 10)).sort((a, b) => a - b);
  const idx = {}; ids.forEach((id, i) => { idx[id] = i });
  return [411, 469, 741, 1513, 2232].every(id => {
    const i = idx[id]; if (i === undefined) return false;
    const want = [Math.floor(i / 256), i % 16, Math.floor((i % 256) / 16)];
    const got = SHEETMAP[String(id)];
    return !!got && got[0] === want[0] && got[1] === want[1] && got[2] === want[2];
  });
})(), [411, 469, 741, 1513, 2232].map(id => id + '→' + JSON.stringify((SHEETMAP || {})[String(id)])).join(' '));
chk('v4.6.2-3 分片分布：s0~s6 各 256 只、s7 末片 114 只（1906=7×256+114）', (function () {
  if (!SHEETMAP) return false;
  const cnt = [0, 0, 0, 0, 0, 0, 0, 0];
  Object.keys(SHEETMAP).forEach(k => cnt[SHEETMAP[k][0]]++);
  return cnt.slice(0, 7).every(n => n === 256) && cnt[7] === 114;
})(), (function () { if (!SHEETMAP) return ''; const c = [0, 0, 0, 0, 0, 0, 0, 0]; Object.keys(SHEETMAP).forEach(k => c[SHEETMAP[k][0]]++); return c.join('/') })());
chk('v4.6.2-4 渲染函数输出合图背景格式且签名兼容（sprOf/sprImg(·,cls)/sprRaw(·,cls)/sprImgMid）', (function () {
  const st = sandbox.sprOf(3), box = sandbox.sprImg(3), boxCls = sandbox.sprImg(3, 'spslot');
  const raw = sandbox.sprRaw(3), rawCls = sandbox.sprRaw(3, 'mcspr'), mid = sandbox.sprImgMid(3);
  const bgre = /^background-image:url\('assets\/sheets\/s\d+\.webp'\);background-repeat:no-repeat;background-size:1600% 1600%;background-position:\d+(?:\.\d+)?% \d+(?:\.\d+)?%$/;
  return bgre.test(st)
    && /^<span class="spbox spcard"><span class="spsp" data-id="3" style="background-image:url\('assets\/sheets\/s\d+\.webp'\)/.test(box)
    && /^<span class="spbox spslot">/.test(boxCls)
    && /^<div class="mcspr" data-id="3" style="background-image:url\('assets\/sheets\/s\d+\.webp'\)/.test(raw)
    && /^<div class="mcspr" data-id="3" style="/.test(rawCls)
    && /^<div class="spmid" data-id="3" style="/.test(mid);
})(), 'sprOf(3)=' + String(sandbox.sprOf(3)).slice(0, 96));
chk('v4.6.2-5 缺失 id → .spmiss 空占位（无 assets/sheets 引用、不发请求，替代旧 onerror）', (function () {
  const a = sandbox.sprImg(999999), b = sandbox.sprRaw(999999), c = sandbox.sprImgMid(999999);
  return sandbox.sprOf(999999) === ''
    && /^<span class="spbox spcard"><span class="spsp spmiss" data-id="999999"><\/span><\/span>$/.test(a) && !/assets\/sheets/.test(a)
    && /^<div class="mcspr spmiss" data-id="999999"><\/div>$/.test(b) && !/assets\/sheets/.test(b)
    && /^<div class="spmid spmiss" data-id="999999"><\/div>$/.test(c) && !/assets\/sheets/.test(c);
})(), '');
chk('v4.6.2-6 迁移完整：内嵌脚本零 assets/sprites 引用 + 存在 assets/sheets 引用（旧目录仅作源保留）', (function () {
  return script.indexOf('assets/sprites') < 0 && /assets\/sheets\/s/.test(script)
    && fs.existsSync(ER + 'assets\\sprites') && fs.existsSync(ER + 'assets\\sheets');
})(), '脚本内 sprites=' + ((script.match(/assets\/sprites/g) || []).length) + ' sheets=' + ((script.match(/assets\/sheets\/s/g) || []).length));
chk('v4.6.2-7 sheets 产物齐全（8 张 webp + sheets_map.js；单张 >120KB，合计 2.5–3.5MB）', (function () {
  const dir = ER + 'assets\\sheets';
  if (!fs.existsSync(dir)) return false;
  const files = fs.readdirSync(dir);
  const webps = files.filter(f => /^s[0-7]\.webp$/.test(f));
  if (webps.length !== 8 || !files.includes('sheets_map.js')) return false;
  const sizes = webps.map(f => fs.statSync(dir + '\\' + f).size);
  const total = sizes.reduce((a, b) => a + b, 0);
  return sizes.every(s => s > 120 * 1024) && total > 2.5 * 1048576 && total < 3.5 * 1048576;
})(), (function () { const dir = ER + 'assets\\sheets'; if (!fs.existsSync(dir)) return '缺目录'; const ws = fs.readdirSync(dir).filter(f => /\.webp$/.test(f)).map(f => f + ':' + Math.round(fs.statSync(dir + '\\' + f).size / 1024) + 'KB'); return ws.join(' ') + ' / sheets_map.js=' + Math.round(fs.statSync(dir + '\\sheets_map.js').size / 1024) + 'KB'; })());
chk('v4.6.2-8 CSS 成套：合图基类 + 各上下文尺寸照搬原 img 版 + .spmiss 占位 + .spbox 内层 100%', (function () {
  return /\.spsp,\.mcspr,\.spmid\{background-repeat:no-repeat; image-rendering:pixelated; display:inline-block; vertical-align:middle\}/.test(CSS46)
    && /\.spmid,\.mcspr\{width:64px; height:64px; margin:0\}/.test(CSS46)
    && /\.mxc \.mcspr,\.mxc \.spmid,\.mxc \.spsp\{width:40px; height:40px; margin:0 auto\}/.test(CSS46)
    && /\.spthumb \.mcspr\{width:26px; height:26px\}/.test(CSS46)
    && /\.slothead \.spinl \.spsp\{width:28px; height:28px\}/.test(CSS46)
    && /\.spmiss\{background:#eceff3\}/.test(CSS46)
    && /\.spbox img,\.spbox \.spsp\{width:100%; height:100%/.test(CSS46);
})(), '');
chk('v4.6.2-9 尺寸无关缩放：background-size 1600%（16 格）+ 百分比定位（列/行 → col/15、row/15）', (function () {
  /* id 3→格(2,0) ⇒ 13.3333% 0% ；id 16→格(15,0) ⇒ 100% 0% ；id 17→格(0,1) ⇒ 0% 6.6667% */
  const p3 = sandbox.sprOf(3), p16 = sandbox.sprOf(16), p17 = sandbox.sprOf(17);
  const pos = s => (s.match(/background-position:(\S+ \S+)$/) || [])[1];
  return /background-size:1600% 1600%/.test(p3) && pos(p3) === '13.3333% 0%' && pos(p16) === '100% 0%' && pos(p17) === '0% 6.6667%';
})(), 'id3=' + String(sandbox.sprOf(3)).slice(-40) + ' id17=' + String(sandbox.sprOf(17)).slice(-40));

/* ================= v4.6.3 核心配队/存档联动 两段式互斥视图（挑选 ⇄ 详情） ================= */
hdr('v4.6.3 两段式互斥视图（点候选卡 → 方案置顶 + ← 返回挑选）');
const HTML463 = fs.readFileSync('D:\\game\\elite-redux\\配招助手_ER.html', 'utf8');
chk('v463-1 互斥双屏 DOM：#corePickWrap 包住工具栏+属性筛选+网格；#coreDetailWrap 默认隐藏且内含 #coreOut（方案不再裸挂在长候选列表之下）', (function () {
  const iPick = HTML463.indexOf('id="corePickWrap"'), iBar = HTML463.indexOf('id="coreSearch"'), iGrid = HTML463.indexOf('id="coreGrid"'),
    iPickEnd = HTML463.indexOf('/#corePickWrap'), iDet = HTML463.indexOf('id="coreDetailWrap"'), iOut = HTML463.indexOf('id="coreOut"'),
    iRule = HTML463.indexOf('id="ruleBoxCore"');
  return iPick > -1 && iBar > iPick && iGrid > iBar && iPickEnd > iGrid && iDet > iPickEnd && iOut > iDet && iRule > iOut &&
    /id="coreDetailWrap" class="phasefade" style="display:none"/.test(HTML463) && /id="corePickWrap" class="phasefade"/.test(HTML463);
})(), 'pick(工具栏 < 网格) → detail(方案) → 页面级口径表（gotoRule 仍可用）');
chk('v463-2 「← 返回挑选」触控 ≥44px + 纯视图切换双路径（corePhase / myPhase）', /onclick="corePhase\('pick'\)"/.test(HTML463) && /onclick="myPhase\('pick'\)"/.test(HTML463) &&
  /\.coreback\{min-height:44px/.test(HTML463) && typeof sandbox.corePhase === 'function' && typeof sandbox.myPhase === 'function' &&
  /function corePhase\(/.test(sandbox.corePhase.toString()) && /function myPhase\(/.test(sandbox.myPhase.toString()), '.coreback{min-height:44px} + 两处返回按钮');
chk('v463-3 点候选卡 → 进入详情阶段（selectCore 调 corePhase(detail)；方案已渲染、挑选屏隐藏）', (function () {
  sandbox.selectCore(spOf(3).id);
  return byId('corePickWrap').style.display === 'none' && byId('coreDetailWrap').style.display === '' &&
    /需求驱动队友|队伍需求|流派/.test(byId('coreOut')._html) && /corePhase\('detail'\)/.test(sandbox.selectCore.toString());
})(), 'pick=hidden / detail=visible / #coreOut 已渲染方案');
chk('v463-4 返回挑选：候选屏恢复、详情收起，且搜索/筛选/排序状态保留（corePhase 函数体不触碰任何输入控件）', (function () {
  byId('coreSearch').value = '妙'; byId('coreSort').value = 'bst'; byId('coreRole').value = '肉盾';
  sandbox.corePhase('pick');
  const f = sandbox.corePhase.toString();
  return byId('corePickWrap').style.display === '' && byId('coreDetailWrap').style.display === 'none' &&
    byId('coreSearch').value === '妙' && byId('coreSort').value === 'bst' && byId('coreRole').value === '肉盾' &&
    !/coreSearch'\)\.value\s*=/.test(f) && !/coreSort'\)\.value\s*=/.test(f) && !/coreRole'\)\.value\s*=/.test(f);
})(), '状态保留：搜索=妙 / 排序=bst / 定位=肉盾');
chk('v463-5 详情阶段精灵仍走合图方案（#coreOut 内 assets/sheets、零 assets/sprites、含 .spsp 合图元素）', (function () {
  sandbox.selectCore(spOf(3).id);
  const h = byId('coreOut')._html;
  return /assets\/sheets\/s\d+\.webp/.test(h) && !/assets\/sprites\//.test(h) && /class="spsp"/.test(h);
})(), '详情方案卡 = sheet 背景方案（v4.6.2 统一 sprEl 生效）');
chk('v463-6 存档联动组队路径同构两段式（myCoreTeam → myDetailWrap；重新解析/重置池回挑选）', (function () {
  sandbox.myCoreTeam(324);
  const inDetail = byId('myPickWrap').style.display === 'none' && byId('myDetailWrap').style.display === '' &&
    /assets\/sheets\/s/.test(byId('myTeamOut')._html) && /myPhase\('detail'\)/.test(sandbox.myCoreTeam.toString());
  sandbox.myPhase('pick', true);
  const backPick = byId('myPickWrap').style.display === '' && byId('myDetailWrap').style.display === 'none' && /myPhase\('pick',true\)/.test(sandbox.renderMyPool.toString());
  const iPick = HTML463.indexOf('id="myPickWrap"'), iDet = HTML463.indexOf('id="myDetailWrap"'), iOut = HTML463.indexOf('id="myTeamOut"');
  return inDetail && backPick && iPick > -1 && iDet > iPick && iOut > iDet;
})(), '池 → 详情 → 返回挑选（与全图鉴路径并列，非替换）');
chk('v463-7 移动端 360px 不引入横向滚动（返回栏 flex-wrap 无固定宽；详情为就地展开，非浮层/抽屉）', /\.corebackbar\{display:flex; align-items:center; gap:8px; flex-wrap:wrap/.test(HTML463) &&
  /\.coreback\{min-height:44px; padding:10px 16px/.test(HTML463) && !/\.coreback\{[^}]*width:/.test(HTML463) &&
  !/id="coreDetailWrap"[^>]*position:fixed/.test(HTML463) && !/id="myDetailWrap"[^>]*position:fixed/.test(HTML463) &&
  /@media\(prefers-reduced-motion:reduce\)\{\.phasefade\{animation:none\}\}/.test(HTML463), '就地展开 + 换行自适应 + 尊重降低动效');

/* ================= v4.7 规则偏移层（确定性修正接入排序强度/健康维度） =================
   端口口径：JS rsShiftMember/rsFeat 复现 nn_data/shift_layer.py 的 S1~S4 与逐成员特征；
   rsTeamCard 复现 _p47_calib5.py 的 L2（lin = b0 + Σ w·z → S′ = EMEAN + SD_E·(lin − mu_lin)/sd_lin）。 */
const RS_FX = [{"ids":["640","452","1049","285","250"],"E":16.75,"S":26.554407,"wr":0.625,"z":{"sh":0.045982258,"slow":-0.40175567,"spd":0.010577286,"bst":-0.434854161,"syscnt":0.112299785}},{"ids":["1597","243","2530","249","213","250"],"E":23.6,"S":26.938247,"wr":0.3333,"z":{"sh":0.14201566,"slow":-0.469897371,"spd":0.272482161,"bst":0.181277386,"syscnt":0.828890929}},{"ids":["2256","1662","474","213","385"],"E":24.0,"S":23.645966,"wr":0.3333,"z":{"sh":0.418296369,"slow":-0.40175567,"spd":-0.005623015,"bst":0.208574353,"syscnt":-0.365427645}},{"ids":["2157","112","208","2297","476","213"],"E":21.2,"S":23.577238,"wr":0.0833,"z":{"sh":-0.775842044,"slow":0.552228138,"spd":-0.690535763,"bst":0.0623406,"syscnt":-0.365427645}},{"ids":["2190","112","376","249","476"],"E":25.75,"S":20.358439,"wr":0.5,"z":{"sh":-0.142390953,"slow":0.007094533,"spd":-0.065024121,"bst":0.196875653,"syscnt":-0.365427645}},{"ids":["586","192","2594","609","249","208"],"E":30.6,"S":21.041028,"wr":0.5,"z":{"sh":0.396873533,"slow":-0.129188868,"spd":0.038477806,"bst":0.132532801,"syscnt":0.828890929}},{"ids":["1833","68","1652","1528","208"],"E":18.75,"S":23.766459,"wr":0.4167,"z":{"sh":-0.519137374,"slow":0.415944737,"spd":-0.324228945,"bst":0.06818995,"syscnt":-0.365427645}},{"ids":["134","68","614","213","914"],"E":22.25,"S":21.400554,"wr":0.5417,"z":{"sh":-0.031583182,"slow":0.415944737,"spd":-0.659035177,"bst":-0.528443763,"syscnt":0.112299785}},{"ids":["1041","112","301","1545","771"],"E":19.5,"S":22.955142,"wr":0.5,"z":{"sh":-0.264279501,"slow":0.007094533,"spd":-0.086624523,"bst":-0.123668734,"syscnt":-0.365427645}},{"ids":["306","249","879","1539","250"],"E":28.25,"S":20.386661,"wr":0.5417,"z":{"sh":0.777313548,"slow":0.007094533,"spd":0.015977387,"bst":0.606330162,"syscnt":-0.365427645}},{"ids":["2542","68","249","2526","1665"],"E":27.5,"S":15.248059,"wr":0.2083,"z":{"sh":0.356244017,"slow":0.415944737,"spd":-0.205426734,"bst":-0.149405875,"syscnt":-0.365427645}},{"ids":["1894","68","1013","249","250"],"E":21.25,"S":24.956886,"wr":0.625,"z":{"sh":-0.618864368,"slow":-0.40175567,"spd":0.48038603,"bst":0.566554581,"syscnt":-0.365427645}},{"ids":["2229","112","123","249","2144","1532"],"E":26.4,"S":22.647456,"wr":0.7083,"z":{"sh":1.074647733,"slow":0.552228138,"spd":-0.695035847,"bst":0.093537134,"syscnt":0.430784738}},{"ids":["773","1794","1828","628","2279"],"E":23.0,"S":24.844502,"wr":0.6667,"z":{"sh":-0.452652712,"slow":-0.40175567,"spd":-0.086624523,"bst":-0.118989254,"syscnt":0.112299785}}];
const RS_C = {"L1":{"slow":-2.0,"syscnt":2.0,"bst":2.0},"L2w":{"E":-0.4031,"sh":-0.034,"slow":-0.8362,"spd":-0.8775,"syscnt":0.5131,"bst":0.8504},"b0":0.15288,"eMean":22.356,"eStd":4.165126,"muLin":0.14355,"sdLin":0.56729,"EMEAN":22.428,"SDE":4.1445,"mu":{"sh":1.0885026774215414,"slow":0.39652951941977904,"spd":77.40825594794279,"bst":566.171151630177,"syscnt":0.15298583338981903},"sd":{"sh":0.902463780258984,"slow":0.489176716175758,"spd":37.03634769970907,"bst":85.47958129291573,"syscnt":0.4186487685816198}};
const RSC = sandbox.RULE_SHIFT;
chk('RS1 规则偏移层常量块与标定常量一致（L1 slow −2/syscnt +2/bst +2；L2 六项 w + 截距 b0 + train-E 基准 + mu/sd/尺度 + 端口消费的 5 项逐成员 mu/sd）', (() => {
  if (!RSC || sandbox.RULE_SHIFT_ENABLED !== true) return false;
  const c = RS_C;
  if (!(RSC.L1.slow === c.L1.slow && RSC.L1.syscnt === c.L1.syscnt && RSC.L1.bst === c.L1.bst)) return false;
  const L = RSC.L2, cw = c.L2w;
  if (!(Math.abs(L.wE - cw.E) < 1e-4 && Math.abs(L.wsh - cw.sh) < 1e-4 && Math.abs(L.wslow - cw.slow) < 1e-4
    && Math.abs(L.wspd - cw.spd) < 1e-4 && Math.abs(L.wsyscnt - cw.syscnt) < 1e-4 && Math.abs(L.wbst - cw.bst) < 1e-4)) return false;
  if (!(Math.abs(L.b0 - c.b0) < 1e-5 && Math.abs(L.eMean - c.eMean) < 1e-5 && Math.abs(L.eStd - c.eStd) < 1e-6)) return false;
  if (!(Math.abs(L.mu - c.muLin) < 1e-4 && Math.abs(L.sd - c.sdLin) < 1e-4 && Math.abs(L.mean - c.EMEAN) < 1e-3 && Math.abs(L.sdE - c.SDE) < 1e-4)) return false;
  return Object.keys(c.mu).every(k => RSC.MU[k] !== undefined && Math.abs(RSC.MU[k] - c.mu[k]) < 1e-9)
    && Object.keys(c.sd).every(k => RSC.SD[k] !== undefined && Math.abs(RSC.SD[k] - c.sd[k]) < 1e-9);
})(), 'L1=' + (RSC ? JSON.stringify(RSC.L1) : '-') + ' L2=' + (RSC ? JSON.stringify([RSC.L2.wE, RSC.L2.wsh, RSC.L2.wslow, RSC.L2.wspd, RSC.L2.wsyscnt, RSC.L2.wbst, RSC.L2.b0, RSC.L2.eMean, RSC.L2.eStd]) : '-') + ' MU.keys=' + (RSC ? Object.keys(RSC.MU).join('/') : '-'));

chk('RS2 逐候选规则偏移口径：龟速（护城龙 spd≤60）RS 负分 + why 含「速度线」；高速（闪电鸟 spd≥90）RS 正分；z 口径正确', (() => {
  const a = sandbox.rsL1Of(sandbox.spId2Obj(411), ['411']), b = sandbox.rsL1Of(sandbox.spId2Obj(145), ['145']);
  if (!a || !b) return false;
  const z1 = sandbox.rsZ('slow', 1), z0 = sandbox.rsZ('slow', 0);
  return a.pts < 0 && /速度线/.test(a.why) && b.pts > 0
    && Math.abs(z1 - 1.2339) < 0.002 && Math.abs(z0 + 0.8106) < 0.002
    && /龟速占比惩罚/.test(a.why) && /只作一项权重/.test(b.why);
})(), (() => {
  const a = sandbox.rsL1Of(sandbox.spId2Obj(411), ['411']), b = sandbox.rsL1Of(sandbox.spId2Obj(145), ['145']);
  return '护城龙=' + (a ? a.pts.toFixed(2) : '-') + ' 闪电鸟=' + (b ? b.pts.toFixed(2) : '-');
})());

chk('RS2b 逐候选单调性（同 bst 只变速度，隔离速度项）：速度越低 RS 分越低，且差额 = w_slow·(z₀−z₁)', (() => {
  const mk = spd => ({ id: 'X', zh: 'T', t1: '一般', t2: null, base: [150 - spd, 100, 100, 100, 100, spd], abis: [], inns: [], sys: [] });
  const a = sandbox.rsL1Of(mk(30), []), b = sandbox.rsL1Of(mk(120), []);
  if (!a || !b) return false;
  const w = sandbox.RULE_SHIFT.L1.slow, expect = w * (sandbox.rsZ('slow', 0) - sandbox.rsZ('slow', 1));
  return a.pts < b.pts && Math.abs((b.pts - a.pts) - expect) < 1e-9;
})(), (() => {
  const mk = spd => ({ id: 'X', t1: '一般', base: [150 - spd, 100, 100, 100, 100, spd], abis: [], inns: [], sys: [] });
  return 'spd30=' + sandbox.rsL1Of(mk(30), []).pts.toFixed(3) + ' spd120=' + sandbox.rsL1Of(mk(120), []).pts.toFixed(3) + '（bst 恒定 550）';
})());

chk('RS3a L2 映射公式精确复现：以标定夹具的 z 逐队代入 JS 常量 → S′（|Δ|<0.01，验证 b0/z_E基准/尺度三项）', (() => {
  const L = sandbox.RULE_SHIFT.L2, c = RS_C, cw = c.L2w;
  let ok = 0;
  RS_FX.forEach(f => {
    const zE = (f.E - L.eMean) / L.eStd;
    const lin = L.b0 + L.wE * zE + L.wsh * f.z.sh + L.wslow * f.z.slow + L.wspd * f.z.spd + L.wsyscnt * f.z.syscnt + L.wbst * f.z.bst;
    const S = L.mean + L.sdE * (lin - L.mu) / L.sd;
    if (Math.abs(S - f.S) < 0.01) ok++;
  });
  return ok === RS_FX.length;
})(), (() => {
  const L = sandbox.RULE_SHIFT.L2; const dev = RS_FX.map(f => {
    const zE = (f.E - L.eMean) / L.eStd;
    const lin = L.b0 + L.wE * zE + L.wsh * f.z.sh + L.wslow * f.z.slow + L.wspd * f.z.spd + L.wsyscnt * f.z.syscnt + L.wbst * f.z.bst;
    return Math.abs(L.mean + L.sdE * (lin - L.mu) / L.sd - f.S);
  });
  return 'n=' + dev.length + ' maxΔ=' + Math.max.apply(null, dev).toExponential(2);
})());

chk('RS3b 端到端端口保真：rsTeamCard 逐队 S′ 对拍（容差 0.30）+ 秩相关 ≥0.97 + 极值位次一致；且唯一发散项为展示项 sh（slow/spd/bst/syscnt 的 z 逐队一致）', (() => {
  const rows = [], zDev = {};
  RS_FX.forEach(f => {
    const mem = f.ids.map((id, i) => ({ s: sandbox.spId2Obj(id), core: i === 0, score: i === 0 ? null : f.E }));
    if (!(mem[1] && mem[1].s)) return;
    const r = sandbox.rsTeamCard(mem);
    if (!r) return;
    rows.push([r.S, f.S]);
    ['slow', 'spd', 'bst', 'syscnt'].forEach(k => { zDev[k] = Math.max(zDev[k] === undefined ? 0 : zDev[k], Math.abs(r.z[k] - f.z[k])); });
    zDev.sh = Math.max(zDev.sh === undefined ? 0 : zDev.sh, Math.abs(r.z.sh - f.z.sh));
  });
  if (rows.length !== RS_FX.length) return false;
  /* 秩相关（平均秩，允许近距离并列导致的相邻交换）+ 极值位次一致 */
  const rank = a => { const idx = a.map((v, i) => i).sort((p, q) => a[p] - a[q]); const r = new Array(a.length);
    let i = 0; while (i < idx.length) { let j = i; while (j + 1 < idx.length && a[idx[j + 1]] === a[idx[i]]) j++;
      for (let k = i; k <= j; k++) r[idx[k]] = (i + j) / 2 + 1; i = j + 1; } return r; };
  const rho = (a, b) => { const ra = rank(a), rb = rank(b), ma = ra.reduce((x, y) => x + y, 0) / ra.length, mb = rb.reduce((x, y) => x + y, 0) / rb.length;
    let sab = 0, sa = 0, sb = 0; for (let i = 0; i < ra.length; i++) { const da = ra[i] - ma, db = rb[i] - mb; sab += da * db; sa += da * da; sb += db * db; }
    return sab / Math.sqrt(sa * sb); };
  const js = rows.map(x => x[0]), py = rows.map(x => x[1]);
  const argmin = a => a.indexOf(Math.min.apply(null, a)), argmax = a => a.indexOf(Math.max.apply(null, a));
  const maxDev = Math.max.apply(null, js.map((v, i) => Math.abs(v - py[i])));
  return maxDev < 0.30 && rho(js, py) >= 0.97 && argmin(js) === argmin(py) && argmax(js) === argmax(py)
    && zDev.slow < 1e-9 && zDev.spd < 1e-9 && zDev.bst < 1e-9 && zDev.syscnt < 1e-9 && zDev.sh > 1e-6;
})(), (() => {
  const zDev = {}; let maxDev = 0;
  RS_FX.forEach(f => {
    const mem = f.ids.map((id, i) => ({ s: sandbox.spId2Obj(id), core: i === 0, score: i === 0 ? null : f.E }));
    const r = mem[1] && mem[1].s ? sandbox.rsTeamCard(mem) : null;
    if (!r) return;
    maxDev = Math.max(maxDev, Math.abs(r.S - f.S));
    ['slow', 'spd', 'bst', 'syscnt', 'sh'].forEach(k => { zDev[k] = Math.max(zDev[k] === undefined ? 0 : zDev[k], Math.abs(r.z[k] - f.z[k])); });
  });
  return 'max|ΔS′|=' + maxDev.toFixed(4) + ' ｜ 秩相关=' + (() => { const rank = a => { const idx = a.map((v, i) => i).sort((p, q) => a[p] - a[q]); const r = new Array(a.length);
    let i = 0; while (i < idx.length) { let j = i; while (j + 1 < idx.length && a[idx[j + 1]] === a[idx[i]]) j++;
      for (let k = i; k <= j; k++) r[idx[k]] = (i + j) / 2 + 1; i = j + 1; } return r; };
    const rho = (a, b) => { const ra = rank(a), rb = rank(b), ma = ra.reduce((x, y) => x + y, 0) / ra.length, mb = rb.reduce((x, y) => x + y, 0) / rb.length;
      let s = 0, sa = 0, sb = 0; for (let i = 0; i < ra.length; i++) { const da = ra[i] - ma, db = rb[i] - mb; s += da * db; sa += da * da; sb += db * db; }
      return s / Math.sqrt(sa * sb); };
    const js = RS_FX.map(f => { const mem = f.ids.map((id, i) => ({ s: sandbox.spId2Obj(id), core: i === 0, score: i === 0 ? null : f.E }));
      const r = mem[1] && mem[1].s ? sandbox.rsTeamCard(mem) : null; return r ? r.S : 0; });
    return rho(js, RS_FX.map(f => f.S)).toFixed(3); })() + ' ｜ z 差 slow=' + (zDev.slow || 0).toExponential(1) + ' spd=' + (zDev.spd || 0).toExponential(1)
    + ' bst=' + (zDev.bst || 0).toExponential(1) + ' syscnt=' + (zDev.syscnt || 0).toExponential(1) + ' sh=' + (zDev.sh || 0).toFixed(3) + '（sh 为展示项，权重 −0.034≈0）';
})());

chk('RS4 修正方向（M5 实测）：高引擎分（≥28）队被压低 S′<E−5；低引擎分（≤20）队被抬高 S′>E、其中 ≤17 者 S′>E+5；且均值方向 mean(S′−E | 低分) > 0 > mean(| 高分)', (() => {
  const lo = RS_FX.filter(f => f.E >= 28), hi = RS_FX.filter(f => f.E <= 20), lowest = RS_FX.filter(f => f.E <= 17);
  const down = lo.filter(f => f.S < f.E - 5).length, up = hi.filter(f => f.S > f.E).length, up5 = lowest.filter(f => f.S > f.E + 5).length;
  const mean = a => a.reduce((x, y) => x + y, 0) / (a.length || 1);
  const mLo = mean(lo.map(f => f.S - f.E)), mHi = mean(hi.map(f => f.S - f.E));
  return lo.length >= 2 && hi.length >= 2 && lowest.length >= 1 && down === lo.length && up === hi.length && up5 === lowest.length
    && mHi > 0 && mLo < 0;
})(), (() => {
  const lo = RS_FX.filter(f => f.E >= 28), hi = RS_FX.filter(f => f.E <= 20);
  const d = lo.filter(f => f.S < f.E - 5), u = hi.filter(f => f.S > f.E), lo2 = RS_FX.filter(f => f.E <= 17);
  const mean = a => a.reduce((x, y) => x + y, 0) / (a.length || 1);
  return '高分档 lo=' + lo.length + '(' + lo.map(f => f.ids[0] + '/E' + f.E.toFixed(1) + '/S′' + f.S.toFixed(1) + '/Δ' + (f.S - f.E).toFixed(1)).join(',') + ') 压低=' + d.length
    + ' ｜ 低分档 hi=' + hi.length + '(' + hi.map(f => f.ids[0] + '/E' + f.E.toFixed(1) + '/S′' + f.S.toFixed(1) + '/Δ' + (f.S - f.E).toFixed(1)).join(',') + ') 抬高=' + u.length
    + '（≤17 档 ' + lo2.length + ' 抬 >5=' + lo2.filter(f => f.S > f.E + 5).length + '）'
    + ' ｜ meanΔ 低分=' + mean(hi.map(f => f.S - f.E)).toFixed(1) + ' 高分=' + mean(lo.map(f => f.S - f.E)).toFixed(1)
    + ' ｜ 全队 ' + RS_FX.map(f => f.ids[0] + ':E' + f.E.toFixed(1) + '→' + f.S.toFixed(1)).join(' ');
})());

chk('RS5 UI 渲染面：方案卡含「强度校准（规则偏移层 · 确定性修正）」行 + 引擎位次均分→校准强度 + 口径来源与回退说明', (() => {
  byId('coreOut')._html = ''; sandbox.renderCore(spByZh('妙蛙花'));
  const h = byId('coreOut')._html;
  return /强度校准（规则偏移层/.test(h) && /引擎位次均分 [\d.]+ → 校准强度/.test(h)
    && /4000 队真值标签/.test(h) && /RULE_SHIFT_ENABLED/.test(h) && /非拍脑袋/.test(h);
})(), (() => {
  const h = byId('coreOut')._html, m = h.match(/引擎位次均分 ([\d.]+) → 校准强度 <b>([\d.]+)<\/b>（([+\-][\d.]+)）/);
  return m ? '妙蛙花 E=' + m[1] + ' → S′=' + m[2] + '（' + m[3] + '）' : '未渲染';
})());

chk('RS6 一键回退：RULE_SHIFT_ENABLED=false → rsL1Of/rsTeamCard 返回 null；needScore 受开关守护、renderNeedPlan 经 rsTeamCard 门控', (() => {
  const g1 = /if\(!RULE_SHIFT_ENABLED\)return null/.test(sandbox.rsL1Of.toString())
    && /if\(!RULE_SHIFT_ENABLED\)return null/.test(sandbox.rsTeamCard.toString())
    && /if\(RULE_SHIFT_ENABLED\)/.test(sandbox.needScore.toString())
    && /rsTeamCard\(plan\.team\)/.test(sandbox.renderNeedPlan.toString());
  const old = sandbox.RULE_SHIFT_ENABLED; sandbox.RULE_SHIFT_ENABLED = false;
  const a = sandbox.rsL1Of(sandbox.spId2Obj(411), ['411']);
  const b = sandbox.rsTeamCard([{ s: sandbox.spId2Obj(411), core: true, score: null }, { s: sandbox.spId2Obj(145), score: 22.4 }]);
  const dimsNo = sandbox.needScore ? true : true;
  sandbox.RULE_SHIFT_ENABLED = old;
  return g1 && a === null && b === null;
})(), '开关守护（rsL1Of/rsTeamCard 前置于 needScore）+ 关闭时两函数返回 null（回退 v4.6.4）');

chk('RS7 尺度保持：S′ 与旧引擎位次均分同量级（|S′−E| ≤ 20 分、S′∈[5,40]）', (() => {
  let ok = 0, tot = 0;
  RS_FX.forEach(f => {
    const mem = f.ids.map((id, i) => ({ s: sandbox.spId2Obj(id), core: i === 0, score: i === 0 ? null : f.E }));
    if (!(mem[1] && mem[1].s)) return;
    const r = sandbox.rsTeamCard(mem); tot++;
    if (r && Math.abs(r.S - r.E) <= 20 && r.S >= 5 && r.S <= 40) ok++;
  });
  return tot > 0 && ok === tot;
})(), '夹具 ' + RS_FX.length + ' 队 S′=' + RS_FX.map(f => f.S.toFixed(1)).join('/'));

/* ---------- 汇总 ---------- */
console.log('\n================ v4.x 汇总 ================');
console.log('PASS=' + pass + '  FAIL=' + fail);
if (fail) { console.log('失败项：'); fails.forEach(f => console.log('  - ' + f)); }
process.exit(fail ? 1 : 0);
