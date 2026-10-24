var fs=require('fs');
var p='C:/temp/er-n538/index.html';
fs.copyFileSync('C:/temp/er-n536/index.html',p);
var c=fs.readFileSync(p,'utf8');

/* L882: moves 在 adv 片（延迟），包裹到 er-ready */
var old='ERDATA.moves.forEach(function(m){MV[m[0]]=m});';
var neu='if(ERDATA.moves){ERDATA.moves.forEach(function(m){MV[m[0]]=m});}else{document.addEventListener(\'er-ready\',function(){ERDATA.moves.forEach(function(m){MV[m[0]]=m});});}';
if(c.indexOf(old)<0){console.log('MOVES INIT NOT FOUND');process.exit(1)}
c=c.replace(old,neu);

fs.writeFileSync(p,c);
console.log('patched, size='+fs.statSync(p).size);
