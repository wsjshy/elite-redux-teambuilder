var fs=require('fs');
var p='C:/temp/er-n570/index.html';
fs.copyFileSync('C:/temp/er-n568/index.html',p);
var c=fs.readFileSync(p,'utf8');

/* 版本号 */
c=c.replace("ER_ENGINE_VER='v4.102'","ER_ENGINE_VER='v4.103'");
c=c.replace("引擎 v4.102","引擎 v4.103");

/* v4.103 16段乱数分布+多段KO概率+hash分享 */
c=c.replace("/* ===== v4.41：反查持有者",
`/* v4.103 16段乱数分布+多段KO概率 */
function roll16(lo,hi){
  if(hi<=lo)return [lo];
  var out=[],step=(hi-lo)/15;
  for(var i=0;i<16;i++)out.push(Math.round(lo+step*i));
  return out;
}
function koProb(dmgArr,hp,n){
  var p=dmgArr.filter(function(d){return d>=hp}).length/dmgArr.length;
  return {p16:p,pN:1-Math.pow(1-p,n)};
}
/* v4.103 URL hash 分享（简化 base64） */
function teamToHash(){
  try{
    var arr=team.map(function(s){return s?(''+s.id):''});
    return 'v2.1:'+btoa(encodeURIComponent(arr.join(',')));
  }catch(e){return ''}
}
function loadFromHash(h){
  try{
    if(!h||h.indexOf('v2.1:')!==0)return false;
    var raw=h.slice(5);
    var ids=decodeURIComponent(atob(raw)).split(',');
    for(var i=0;i<Math.min(6,ids.length);i++){
      if(!ids[i])continue;
      var sp=(ERDATA.species||[]).find(function(s){return ''+s.id===ids[i]});
      if(sp)team[i]=sp;
    }
    if(typeof renderAll==='function')renderAll();
    return true;
  }catch(e){return false}
}
/* ===== v4.41：反查持有者`);

fs.writeFileSync(p,c);
console.log('patched size='+fs.statSync(p).size);
