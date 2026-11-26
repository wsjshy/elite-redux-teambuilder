// engine_consts.js —— 从 index.html 直接读引擎真源，供 verify 脚本使用
//
// 为什么要有这个文件：
//   v4.397 把引擎里 31 处手抄的 id 表收回 FUNC_MV 单一真源。但 tools/headless 下的
//   verify 脚本仍各自手抄一份（实测墙表被 15 个脚本抄、钉子表 13 个）——引擎表一变，
//   断言不会跟着变，就会「假绿」。本文件让断言直接引用引擎真源，而不是复制它。
//
// 用法：
//   const C = require('./engine_consts.js');
//   C.FUNC_MV.wall          // [113,115,657]
//   C.WEATHER_SET['晴']     // [70,584,190,871]
//   C.STA                   // [86,92,261,137,599]
//
// 解析失败一律 throw —— 静默返回空表会让所有断言假绿。
const fs = require('fs');
const path = require('path');

const IDX = path.join(__dirname, '..', '..', 'index.html');
const src = fs.readFileSync(IDX, 'utf8');

function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n\r]*/g, '');
}

// 从 `名称=` 之后抓一个配平的 { } 或 [ ] 或 /regex/
function grabBalanced(name, open, close) {
  const re = new RegExp(name + '\\s*=\\s*' + open.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const m = re.exec(src);
  if (!m) throw new Error('engine_consts: 找不到 ' + name + ' = ' + open + ' 的定义');
  let i = m.index + m[0].length - 1, depth = 0, j = i;
  for (; j < src.length; j++) {
    const ch = src[j];
    if (ch === open) depth++;
    else if (ch === close) { depth--; if (depth === 0) break; }
  }
  if (depth !== 0) throw new Error('engine_consts: ' + name + ' 的括号未配平');
  return src.slice(i, j + 1);
}

function evalLiteral(text, name) {
  let v;
  try {
    v = new Function('return (' + stripComments(text) + ');')();
  } catch (e) {
    throw new Error('engine_consts: 解析 ' + name + ' 失败 —— ' + e.message);
  }
  if (v === null || typeof v !== 'object') throw new Error('engine_consts: ' + name + ' 解析结果不是对象');
  return v;
}

function grabObj(name) {
  return evalLiteral(grabBalanced(name, '{', '}'), name);
}

function grabArr(name) {
  return evalLiteral(grabBalanced(name, '[', ']'), name);
}

function grabRegex(name) {
  // 正则字面量不能按括号配对：从 `名称=/` 后开始逐个字符找未转义的结束斜杠
  const re = new RegExp(name + '\\s*=\\s*/');
  const m = re.exec(src);
  if (!m) throw new Error('engine_consts: 找不到 ' + name + ' = /…/ 的定义');
  const start = m.index + m[0].length;
  let j = start, esc = false;
  for (; j < src.length; j++) {
    const ch = src[j];
    if (esc) { esc = false; continue; }
    if (ch === '\\') { esc = true; continue; }
    if (ch === '/') break;
  }
  const body = src.slice(start, j);
  if (!body) throw new Error('engine_consts: ' + name + ' 正则体为空');
  return new RegExp(body);
}

const FUNC_MV = grabObj('FUNC_MV');
const WEATHER_MV = grabObj('WEATHER_MV');
const WEATHER_MV_ID = grabObj('_v395bWK');     // 晴→241 雨→240 沙→201 雪→258
const WEATHER_SET = grabObj('_v395bSET');       // 产生各天气的特性 id
const STA = grabArr('_v392STA');
const WEAK = grabArr('_v392WK');
const BSTR = grabRegex('_v392BST');

// 完整性自检：13 键缺一即 throw（v4.397 收口后的键集）
const NEED = ['rec', 'boost', 'boostPhys', 'boostSpec', 'hazard', 'removal', 'speed',
              'protect', 'pivot', 'wear', 'weather', 'wall', 'rainPerfect'];
const missing = NEED.filter(k => !Array.isArray(FUNC_MV[k]));
if (missing.length) throw new Error('engine_consts: FUNC_MV 缺键 ' + missing.join(','));
if (!WEATHER_SET['晴'] || !WEATHER_SET['雪']) throw new Error('engine_consts: WEATHER_SET 缺晴/雪');

module.exports = {
  FUNC_MV, WEATHER_MV, WEATHER_MV_ID, WEATHER_SET, STA, WEAK, BSTR,
  // 常用派生
  SUN_ABI: WEATHER_SET['晴'].map(String),
  RAIN_ABI: WEATHER_SET['雨'].map(String),
  SAND_ABI: WEATHER_SET['沙'].map(String),
  SNOW_ABI: WEATHER_SET['雪'].map(String),
  HAZ: FUNC_MV.hazard,
  WALL: FUNC_MV.wall,
  WSET: Object.keys(WEATHER_MV).map(Number),
};
