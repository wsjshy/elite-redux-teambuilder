var fs=require('fs');
var p='C:/temp/er-n540/index.html';
fs.copyFileSync('C:/temp/er-n538/index.html',p);
var c=fs.readFileSync(p,'utf8');

var re=/function randomTeamGen\(\)\{\s*loadShowdownSets\(function\(sets\)\{ randomTeamGenImpl\(sets\) \}\);\s*\}/;
var neu=`function randomTeamGen(){
  if(!window.ERDATA||!ERDATA.species){
    var _b=document.createElement('div');_b.style.cssText='position:fixed;top:8px;left:50%;transform:translateX(-50%);padding:8px 18px;background:#2563eb;color:#fff;border-radius:8px;z-index:9999;font-size:12px';
    _b.textContent='数据分片加载中…请稍候片刻';
    document.body.appendChild(_b);setTimeout(function(){_b.remove()},1800);
    return;
  }
  loadShowdownSets(function(sets){ randomTeamGenImpl(sets) });
}`;
if(!re.test(c)){console.log('RANDOM NOT FOUND');process.exit(1)}
c=c.replace(re,neu);
fs.writeFileSync(p,c);
console.log('patched size='+fs.statSync(p).size);
