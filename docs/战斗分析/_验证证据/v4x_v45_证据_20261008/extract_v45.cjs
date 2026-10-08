const fs = require('fs');
const html = fs.readFileSync(process.argv[2], 'utf8');
const out = process.argv[3] || 'html_script_v45.js';
const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
let m, parts = [];
while ((m = re.exec(html)) !== null) { if (/\bsrc\s*=/i.test(m[1] || '')) continue; parts.push(m[2]); }
fs.writeFileSync(out, parts.join('\n;\n'), 'utf8');
console.log('blocks=' + parts.length + ' jsChars=' + parts.join('').length + ' lines=' + fs.readFileSync(out, 'utf8').split('\n').length + ' -> ' + out);
