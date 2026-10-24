var fs=require('fs');
var p='C:/temp/er-n536/index.html';
fs.copyFileSync('C:/temp/er-n534/index.html',p);
var c=fs.readFileSync(p,'utf8');

/* 把立即 __loadShard 调用推迟到 window load 后 800ms */
var re=/__loadShard\('species','data_species_v498\.js\?v=v498'\);__loadShard\('adv','data_adv_v498\.js\?v=v498'\);/;
if(!re.test(c)){console.log('CALL NOT FOUND');process.exit(1)}
c=c.replace(re,`function __erStartLate(){setTimeout(function(){__loadShard('species','data_species_v498.js?v=v498');__loadShard('adv','data_adv_v498.js?v=v498');},800);}
  if(document.readyState==='complete'){__erStartLate();}else{window.addEventListener('load',__erStartLate);}`);

fs.writeFileSync(p,c);
console.log('patched, size='+fs.statSync(p).size);
