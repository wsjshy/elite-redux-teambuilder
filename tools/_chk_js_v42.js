// v4.2 JS 解析器实测：读真实 .sav → parseSavBytes → 验证性格/特性选中项/能力/掩码
const fs = require('fs'), vm = require('vm');
const ctx = { console, Buffer };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('D:/game/elite-redux/data.js', 'utf8'), ctx);

const html = fs.readFileSync('D:/game/elite-redux/配招助手_ER.html', 'utf8');
const start = html.indexOf('/* ============ 存档 .sav 解析');
const end = html.indexOf('function parseSavFile', start);
if (start < 0 || end < 0) { console.log('解析器块未找到'); process.exit(1); }
let code = html.slice(start, end);
vm.runInContext('var MV={},ABI={},ITM={};' + code, ctx);

const savPath = 'D:/mGBA-0.10.2-win64/ROM/elite redux/ER2.65简汉化/ERv2.65-beta2-debug汉化版.sav';
const arr = new Uint8Array(fs.readFileSync(savPath));
ctx.savArr = arr;
const res = vm.runInContext('parseSavBytes(savArr)', ctx);
console.log('summary: 总', res.summary.total, '队伍', res.summary.party, '电脑', res.summary.pc, '特殊区', res.summary.special, 'K=', res.summary.K);
console.log('锚点:', res.summary.anchorsOk.length, '过 /', res.summary.anchorsFail.length, 'fail', res.summary.anchorsFail.length ? res.summary.anchorsFail : '');

// 护城龙 BOX1 槽1
const hu = res.rows.filter(r => r.宝可梦 === '护城龙' && r.来源 === 'BOX1' && r.位置 === '第1格')[0];
if (hu) {
  console.log('\n护城龙 BOX1槽1: 性格=', hu['性格'], '| 特性1=', hu['特性1'], '(idx', hu['特性选中索引'], ') | 防=', hu['能力_防御'], '| 4招=', hu['招式1'], hu['招式2'], hu['招式3'], hu['招式4(末招)']);
  console.log('  期望: 性格=淘气(Impish), 特性1=战斗盔甲(idx0), 防=150, 招=守住/十万马力/铁头/尖刺防守');
}
// 队伍 6 只
console.log('\n队伍 6 只:');
res.party.forEach(r => console.log(' ', r.宝可梦, '| 性格=', r['性格'], '| 特性1=', r['特性1'], '(idx', r['特性选中索引'], ') | 招式3=', r['招式3']));
// 特殊区 15 条标注
const sp = res.rows.filter(r => r.来源.indexOf('特殊区') > -1);
console.log('\n特殊区条数:', sp.length, '首条:', sp[0] ? (sp[0].来源 + ' ' + sp[0].位置 + ' ' + sp[0].宝可梦 + ' 性格=' + sp[0]['性格']) : '无');
// 性格分布
const nats = {};
res.rows.forEach(r => { if (r['性格']) nats[r['性格']] = (nats[r['性格']] || 0) + 1; });
console.log('性格去重:', Object.keys(nats).length, '非空:', res.rows.filter(r => r['性格']).length, '/', res.rows.length);
// 招式3 抽样（掩码验证）
console.log('\n招式3 抽样:', res.rows.slice(0, 6).map(r => r.宝可梦 + ': ' + r['招式3']).join(' | '));
