// 提取 HTML 内嵌 <script> 内容 → 供 node --check 校验
const fs = require('fs');
const html = fs.readFileSync('D:\\game\\elite-redux\\配招助手_ER.html', 'utf8');
const re = /<script[^>]*>([\s\S]*?)<\/script>/g;
let m, i = 0, out = [];
while ((m = re.exec(html))) {
  if (m[1].trim().length < 200) continue;
  i++;
  const p = 'D:\\game\\elite-redux\\_chk_script_' + i + '.js';
  fs.writeFileSync(p, m[1], 'utf8');
  out.push(p + ' bytes=' + m[1].length);
}
console.log(out.join('\n'));
