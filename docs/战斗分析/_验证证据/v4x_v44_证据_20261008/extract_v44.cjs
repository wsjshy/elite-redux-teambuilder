const fs=require('fs');
const html=fs.readFileSync(process.argv[2],'utf8');
const re=/<script\b([^>]*)>([\s\S]*?)<\/script>/gi;let m,parts=[];
while((m=re.exec(html))!==null){if(/\bsrc\s*=/i.test(m[1]||''))continue;parts.push(m[2]);}
fs.writeFileSync('html_script_v44.js',parts.join('\n;\n'),'utf8');
console.log('blocks='+parts.length+' jsChars='+parts.join('\n;\n').length+' lines='+parts.join('\n;\n').split('\n').length);
