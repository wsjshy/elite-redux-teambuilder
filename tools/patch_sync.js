var fs=require('fs');
var p='C:/temp/er-n532/index.html';
fs.copyFileSync('C:/temp/er-n530/index.html',p);
var c=fs.readFileSync(p,'utf8');
/* 把异步 __loadShard 调用改为同步 document.write */
var re=/window\.addEventListener\('DOMContentLoaded',function\(\)\{__loadShard\('species','data_species_v498\.js\?v=v498'\);__loadShard\('adv','data_adv_v498\.js\?v=v498'\);\}\);/;
var repl=`document.write('<scr'+'ipt src="data_species_v498.js?v=v498"><\\/scr'+'ipt>');
  document.write('<scr'+'ipt src="data_adv_v498.js?v=v498"><\\/scr'+'ipt>');`;
if(!re.test(c)){console.log('ASYNC CALL NOT FOUND');process.exit(1)}
c=c.replace(re,repl);
fs.writeFileSync(p,c);
console.log('patched sync, size='+fs.statSync(p).size);
