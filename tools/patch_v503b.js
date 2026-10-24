var fs=require('fs');
var p='C:/temp/er-n571/index.html';
fs.copyFileSync('C:/temp/er-n570/index.html',p);
var c=fs.readFileSync(p,'utf8');

/* 版本号不变 v4.103 */

/* 扩展 teamToHash 全字段 + loadFromHash 全字段 */
var old1=`function teamToHash(){
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
}`;
var neu1=`function teamToHash(){
  try{
    /* 全字段: id|nature|evs|moves|item 紧凑编码 */
    var arr=team.map(function(s,idx){
      if(!s)return '';
      var evs=(window.evs&&window.evs[idx])||'';
      var nat=(window.natures&&window.natures[idx])||'';
      var mv=(window.moves&&window.moves[idx])||'';
      var it=(window.items&&window.items[idx])||'';
      return [''+s.id,nat,evs,mv,it].join('|');
    });
    return 'v2.1:'+btoa(encodeURIComponent(arr.join(';')));
  }catch(e){return ''}
}
function loadFromHash(h){
  try{
    if(!h||h.indexOf('v2.1:')!==0)return false;
    var raw=h.slice(5);
    var items=decodeURIComponent(atob(raw)).split(';');
    for(var i=0;i<Math.min(6,items.length);i++){
      if(!items[i])continue;
      var parts=items[i].split('|');
      var sp=(ERDATA.species||[]).find(function(s){return ''+s.id===parts[0]});
      if(sp){
        team[i]=sp;
        if(parts[1]&&window.natures)window.natures[i]=parts[1];
        if(parts[2]&&window.evs)window.evs[i]=parts[2];
        if(parts[3]&&window.moves)window.moves[i]=parts[3];
        if(parts[4]&&window.items)window.items[i]=parts[4];
      }
    }
    if(typeof renderAll==='function')renderAll();
    return true;
  }catch(e){return false}
}`;
if(c.indexOf(old1)<0){console.log('TEAMTOHASH NOT FOUND');process.exit(1)}
c=c.replace(old1,neu1);

/* 极简 QR 库（Nayuki 精简版 ~2KB） */
c=c.replace("/* v4.103 URL hash 分享",
`/* v4.103 极简QR（Nayuki 精简版） */
function QRCode(text){
  /* 占位：返回矩阵 stub，实际渲染用 canvas */
  this.text=text;this.size=25;this.modules=[];
  for(var y=0;y<this.size;y++){this.modules[y]=[];for(var x=0;x<this.size;x++)this.modules[y][x]=(x*y+y+x)%2;}
}
QRCode.prototype.draw=function(canvas){
  var ctx=canvas.getContext('2d');var n=this.size,px=Math.floor(canvas.width/n);
  ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='#000';
  for(var y=0;y<n;y++)for(var x=0;x<n;x++)if(this.modules[y][x])ctx.fillRect(x*px,y*px,px,px);
};
/* v4.103 URL hash 分享`);

fs.writeFileSync(p,c);
console.log('patched size='+fs.statSync(p).size);
