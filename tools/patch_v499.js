var fs=require('fs');
var p='C:/temp/er-n552/index.html';
fs.copyFileSync('C:/temp/er-n550/index.html',p);
var c=fs.readFileSync(p,'utf8');
/* v4.99: 候选排序权重=缺口匹配度优先 */
var re=/picks=picks\.slice\(0,3\);[\s\S]*?if\(!picks\.length\)picks=fast\.slice\(0,3\);/;
var neu=`/* v4.99 排序：缺口匹配度优先 */
  if(d.spdGap){
    picks.sort(function(a,b){return (b.val||0)-(a.val||0)});
  }else if(d.noResistWeak.length){
    picks.sort(function(a,b){return (a.val||0)-(b.val||0)});
  }
  picks=picks.slice(0,3);
  if(!picks.length)picks=fast.slice(0,3);`;
if(!re.test(c)){console.log('PICKS REGEX NOT FOUND');process.exit(1)}
c=c.replace(re,neu);
/* 版本号 */
c=c.replace("ER_ENGINE_VER='v4.98'","ER_ENGINE_VER='v4.99'");
c=c.replace("引擎 v4.98","引擎 v4.99");
fs.writeFileSync(p,c);
console.log('patched size='+fs.statSync(p).size);
