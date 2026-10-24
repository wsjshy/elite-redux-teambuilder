var fs=require('fs');
var p='C:/temp/er-n542/index.html';
fs.copyFileSync('C:/temp/er-n540/index.html',p);
var c=fs.readFileSync(p,'utf8');

var re=/renderTm\(true\);renderSlots\(\);renderAnalyze\(\);saveTeam\(\);/;
var neu='try{renderTm(true)}catch(e){}try{renderSlots()}catch(e){}try{renderAnalyze()}catch(e){}saveTeam();';
if(!re.test(c)){console.log('CALLCHAIN NOT FOUND');process.exit(1)}
c=c.replace(re,neu);
fs.writeFileSync(p,c);
console.log('patched size='+fs.statSync(p).size);
