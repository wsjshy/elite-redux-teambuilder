// 提取 HTML 内嵌 <script> 内容 → 供 node --check 校验
// v4.11：ERDATA 已拆包到同目录 data.js。为复现浏览器执行序（ERDATA 先于应用代码就绪），
//        抽出应用脚本时把 data.js 内容**前置拼接**；两个 bootstrap 加载器块（哨兵 __ER_LOADER__ /
//        __ER_LOADER_FB__，其体内是 document.write 注入逻辑）跳过 —— 它们在 VM 里无 document.write、
//        也无网络，属加载路径专属代码，由 probe_v411_cdn.js 单独机器校验。
const fs = require('fs');
const ER = 'D:\\game\\elite-redux\\';
const html = fs.readFileSync(ER + '配招助手_ER.html', 'utf8');
const re = /<script[^>]*>([\s\S]*?)<\/script>/g;
const pre = fs.readFileSync(ER + 'data.js', 'utf8');   // v4.11 外置数据（ERDATA 字面量 + 派生字段）
let m, i = 0, out = [];
while ((m = re.exec(html))) {
  const body = m[1];
  if (/__ER_LOADER__|__ER_LOADER_FB__/.test(body)) continue;   // v4.11：加载器块不入 VM
  if (body.trim().length < 200) continue;
  i++;
  const p = ER + '_chk_script_' + i + '.js';
  fs.writeFileSync(p, pre + '\n' + body, 'utf8');
  out.push(p + ' bytes=' + (pre.length + 1 + body.length) + ' (prepended data.js ' + pre.length + ' + app script ' + body.length + ')');
}
console.log(out.join('\n'));
