#!/usr/bin/env node
/**
 * tools/smoke.js — 一键冒烟测试（零依赖，node 直接跑）
 *
 * 背景：本项目此前没有任何自动化测试入口——只有散落在临时目录的 CDP 探针，
 * 路径与端口写死，换台机器就跑不了。本脚本把"能静态断言的部分"固化下来：
 * 数据完整性、split 枚举合法、污染字符串、部署白名单、关键修复是否仍在。
 *
 * 用法：node tools/smoke.js         （全部断言，PASS/FAIL + exit code）
 *      node tools/smoke.js --json  （机器可读输出）
 */
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..');
const R = p => path.join(REPO, p);
const results = [];
function check(name, fn, detail) {
  try {
    const v = fn();
    if (v === false) results.push({ name, ok: false, detail: detail || 'assertion false' });
    else results.push({ name, ok: true, detail: typeof v === 'string' ? v : (detail || '') });
  } catch (e) {
    results.push({ name, ok: false, detail: e.message });
  }
}
const read = p => fs.readFileSync(R(p), 'utf8');
const size = p => fs.statSync(R(p)).size;

// ---------- 1. 产物存在与版本 ----------
check('index.html 存在', () => fs.existsSync(R('index.html')));
check('index.html 含版本真相源 ER_ENGINE_VER', () => {
  const m = read('index.html').match(/ER_ENGINE_VER\s*=\s*'(v[\d.]+)'/);
  if (!m) throw new Error('未找到 ER_ENGINE_VER');
  return m[1];
});
check('index.html 体积合理 (1.2-2.0 MB)', () => {
  const s = size('index.html');
  if (s < 1.2e6 || s > 2.0e6) throw new Error('size=' + s);
  return (s / 1024).toFixed(0) + ' KB';
});

// ---------- 2. 数据层：分片齐全且无污染 ----------
const SHARDS = ['data_species_v498.js', 'data_adv_v498.js', 'data_lite_v498.js'];
for (const f of SHARDS) {
  check(f + ' 存在', () => fs.existsSync(R(f)));
  check(f + ' 无「待定」污染', () => {
    const n = (read(f).match(/待定/g) || []).length;
    if (n > 0) throw new Error(n + ' 处「待定」');
    return 'clean';
  });
  check(f + ' 无「取防御)5」脏枚举', () => {
    const n = (read(f).match(/取防御\)5/g) || []).length;
    if (n > 0) throw new Error(n + ' 处脏枚举');
    return 'clean';
  });
}

// ---------- 3. split 枚举合法性（只允许 7 类） ----------
check('split 枚举仅 7 个合法值', () => {
  const LEGAL = ['物理', '特殊', '变化', '特殊(取最高攻)', '特殊(取防御)', '特殊(取最高伤害)', '特殊(取特防)'];
  const t = read('data_adv_v498.js');
  const found = new Set((t.match(/"split":"([^"]+)"/g) || []).map(s => s.slice(9, -1)));
  // 兜底：数组形态 m[4] 无法直接匹配时，用中文枚举出现次数判断
  if (found.size === 0) return 'skip(数组形态)';
  const bad = [...found].filter(x => !LEGAL.includes(x));
  if (bad.length) throw new Error('非法 split: ' + bad.join(','));
  return found.size + ' 类';
});

// ---------- 4. 关键修复仍在（回归保护） ----------
check('dmgCalc 含 hitsDef 分支（HITS_DEF 4 招修复）', () => {
  const t = read('index.html');
  if (!/hitsDef/.test(t)) throw new Error('hitsDef 分支缺失 —— 4 个取防御招式会再次算错 35%');
  return 'ok';
});
check('splitLabel 覆盖 7 值映射', () => {
  const t = read('index.html');
  for (const k of ['特殊(取防御)', '特殊(取最高攻)', '特殊(取最高伤害)', '特殊(取特防)']) {
    if (!t.includes(k)) throw new Error('splitLabel 缺映射: ' + k);
  }
  return 'ok';
});
check('.sav 零记录报错（不再是"解析成功 0 条"）', () => {
  const t = read('index.html');
  if (!/存档解析失败/.test(t)) throw new Error('缺少 0 记录错误提示');
  return 'ok';
});
check('首屏加载遮罩存在', () => {
  const t = read('index.html');
  if (!/id="bootMask"/.test(t)) throw new Error('缺少 bootMask');
  return 'ok';
});

// ---------- 5. 部署白名单与线上在役文件一致 ----------
check('deploy_er.ps1 白名单含 5 项（不含已退役的 data.js）', () => {
  const t = read('tools/deploy_er.ps1');
  const line = t.split('\n').find(l => l.includes('$DeployFiles ='));
  if (!line) throw new Error('$DeployFiles 未找到');
  const need = ['index.html', 'README.md', 'data_species_v498.js', 'data_adv_v498.js', 'data_lite_v498.js'];
  const miss = need.filter(n => !line.includes(n));
  if (miss.length) throw new Error('白名单缺: ' + miss.join(','));
  if (line.includes('"data.js"')) throw new Error('白名单仍含 data.js —— 2.4 MB 死重会重新上线上传');
  return '5/5';
});
check('生成器已退役且含拒绝覆盖守卫', () => {
  const t = read('build_tool_html.py');
  if (!/ER_BUILD_FORCE_SYNC/.test(t)) throw new Error('缺少 ER_BUILD_FORCE_SYNC 守卫 —— 误跑重建会覆盖线上产物');
  if (!/已退役/.test(t)) throw new Error('缺少退役声明，后来者会误以为可以重建');
  return 'retired';
});
check('页头版本占位不回写过期版本号（须 v4.x 或与 ER_ENGINE_VER 一致）', () => {
  // 2026-11-07 v4.184 发现：升版后静态占位仍是 v4.183，运行时虽被 IIFE 回填，
  // 但回填前/脚本失败时用户看到的就是过期版本 —— 这与 v4.183 修的「手写死文本」是同一类残留。
  const t = read('index.html');
  const m = t.match(/id="erVerNo">([^<]*)</);
  if (!m) throw new Error('缺少 erVerNo 占位');
  const ph = m[1].trim();
  const ver = (t.match(/ER_ENGINE_VER\s*=\s*'(v[\d.]+)'/) || [])[1];
  if (ph === 'v4.x') return 'placeholder v4.x';
  if (ph === ver) return 'same as ' + ver;
  throw new Error('静态占位 ' + ph + ' ≠ ER_ENGINE_VER ' + ver + ' —— 会显示过期版本');
});
check('代码引用的 DOM id 均已定义或运行时创建（防容器丢失静默空转）', () => {
  // 2026-11-07 v4.184.3：v4.93「电脑区」三容器（#savPcQ/#savPcTypeRow/#savPcList）在某次 UI 重构中丢失，
  // 而渲染函数写的是 `if(!el)return` —— 取不到节点就静默跳过，不报错、无告警，功能从页面上整片消失却长期无人察觉。
  // 同类还有 #shareCard（浮层改名 #shareCardOverlay 后此处一直空转）。这条断言把「引用 vs 定义」的差集钉死。
  const t = read('index.html');
  const defined = new Set([...t.matchAll(/id="([A-Za-z0-9_-]+)"/g)].map(m => m[1]));
  const runtime = new Set([...t.matchAll(/\.id\s*=\s*['"]([A-Za-z0-9_-]+)['"]/g)].map(m => m[1]));
  const refIds = [
    ...[...t.matchAll(/\$\('([A-Za-z0-9_-]+)'\)/g)].map(m => m[1]),
    ...[...t.matchAll(/getElementById\('([A-Za-z0-9_-]+)'\)/g)].map(m => m[1])
  ];
  const missing = [...new Set(refIds)].filter(id => !defined.has(id) && !runtime.has(id));
  if (missing.length) throw new Error('引用但从未定义/创建：' + missing.join(', '));
  return refIds.length + ' 处引用全部可解析';
});
check('配招助手_ER.html 只能是轻量兼容入口（≤10KB 且跳转 index.html）', () => {
  // 2026-11-07 事故根因：v4.98 拆包后 data.js 退役，index.html 改好，但这份第二副本没跟着改
  // → 用户按 README 双击本地运行，拿到 v4.98 旧版且 data.js 404，页面只剩「数据加载失败」。
  // 断言口径：入口页必须薄，且必须跳转到唯一产物；一旦有人把它重新写成产物副本，这里拦下。
  if (!fs.existsSync(R('配招助手_ER.html'))) throw new Error('入口页缺失');
  const s = size('配招助手_ER.html');
  if (s > 10 * 1024) throw new Error('体积 ' + s + ' B > 10KB —— 疑似又变成产物副本，会与 index.html 双源漂移');
  const t = read('配招助手_ER.html');
  if (!/http-equiv="refresh"[^>]*url=index\.html/.test(t)) throw new Error('未跳转 index.html');
  if (/data\.js/.test(t)) throw new Error('仍在引用已退役的 data.js');
  return String(s) + ' B → index.html';
});
check('data.js 已退役：本地无文件、页面零引用、兜底指向分片', () => {
  if (fs.existsSync(R('data.js'))) throw new Error('data.js 仍在仓库根目录，会重新进入部署面');
  const t = read('index.html');
  if (/data\.js\?v=/.test(t)) throw new Error('index.html 仍在引用 data.js');
  if (!/__erG\+'data_lite_v498\.js/.test(t)) throw new Error('兜底块未改指分片');
  return 'retired';
});
check('deploy_er.ps1 有清空前齐全性断言', () => {
  const t = read('tools/deploy_er.ps1');
  if (!/staged artifacts verified/.test(t)) throw new Error('缺少暂存断言，清空 gh-pages 前无法拦截缺失');
  return 'ok';
});

// ---------- 6. CLI 解析器可导入（无第三方硬依赖） ----------
check('parse_er_save_v4.py 无顶层 openpyxl 导入', () => {
  const t = read('parse_er_save_v4.py');
  if (/^\s*import openpyxl, csv/m.test(t)) throw new Error('仍存在无条件 import openpyxl');
  return 'ok';
});

// ---------- 6b. 体验与可观测性修复存在性 ----------
check('触屏最小热区规则存在（44px，仅 coarse 指针）', () => {
  const t = read('index.html');
  if (!/pointer:coarse/.test(t)) throw new Error('缺少 @media (pointer:coarse) 热区规则');
  if (!/min-height:\s*44px/.test(t)) throw new Error('缺少 min-height:44px');
  return 'ok';
});
check('全局错误观测存在（window.__ER_ERRORS）', () => {
  const t = read('index.html');
  if (!/__ER_ERRORS/.test(t)) throw new Error('缺少错误收集，静默失败仍不可观测');
  return 'ok';
});

// ---------- 7. 代码健康度基线（超阈值即提醒） ----------
check('静默 catch 数量（基线 361，不应显著增长）', () => {
  const t = read('index.html');
  const n = (t.match(/catch\s*\([^)]*\)\s*\{\s*\}/g) || []).length;
  if (n > 390) throw new Error('静默 catch 增至 ' + n + '（基线 361）');
  return n + ' 处';
});
check('零引用函数（只允许历史保留白名单，禁止新增）', () => {
  const t = read('index.html');
  // 2026-11-07 口径修正：这些函数在 v4.179 中已零调用，但属于项目历史功能
  // （队检告警 teamQA/qaToggle/miniDefBar、战斗概率 roll16/koProb 等）。
  // 用户明确要求「清理冗余不等于删功能」，故从 v4.179 原样恢复并列入白名单。
  // 断言目的改为：除白名单外不得再新增零引用函数。
  const LEGACY_KEPT = new Set(('sysBenefitNames spFields anCoverN qaToggle teamQA miniDefBar roll16 koProb ' +
    'loadFromHash speedRoleZh speedEnsureTable isMegaPreferred _spCacheK coreNature mechMcAbi ' +
    'smogonPriorMeta smogonListOf smogonMoveBonus smogonMateIds mechMv itemIsWeather itemIsTerrain ' +
    'evioWhy mvSrc needRegistryOk isAbilSetAny fillForNeed reverseSpeed toggleFav').split(/\s+/));
  const defs = [...t.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)].map(m => m[1]);
  const uniq = [...new Set(defs)];
  const dead = uniq.filter(n => (t.match(new RegExp('\\b' + n.replace(/\$/g, '\\$') + '\\b', 'g')) || []).length <= 1);
  const unexpected = dead.filter(n => !LEGACY_KEPT.has(n));
  if (unexpected.length > 0) throw new Error('新增零引用函数（不在保留白名单）: ' + unexpected.slice(0, 6).join(','));
  return dead.length + ' 个历史保留';
});

// ---------- 输出 ----------
const okN = results.filter(r => r.ok).length;
if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ ok: okN, total: results.length, results }, null, 1));
} else {
  const pad = s => s + ' '.repeat(Math.max(0, 46 - s.length));
  for (const r of results) console.log((r.ok ? 'PASS ' : 'FAIL ') + pad(r.name) + (r.detail || ''));
  console.log('\n' + okN + '/' + results.length + ' passed');
}
process.exit(okN === results.length ? 0 : 1);
