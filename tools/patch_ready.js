var fs=require('fs');
var p='C:/temp/er-n550/index.html';
fs.copyFileSync('C:/temp/er-n548/index.html',p);
var c=fs.readFileSync(p,'utf8');
var old="s.onload=function(){window.__ER_SHARDS[name]=true;document.dispatchEvent(new Event('er-shard-'+name));if(window.__erShardDone)__erShardDone();};";
var neu="s.onload=function(){window.__ER_SHARDS[name]=true;document.dispatchEvent(new Event('er-shard-'+name));if(window.__erPending!==undefined&&window.__erShardDone)window.__erShardDone();};";
if(c.indexOf(old)<0){console.log('ONLOAD NOT FOUND');process.exit(1)}
c=c.replace(old,neu);
/* 把 __erShardDone 挂到 window */
var old2="function __erShardDone(){window.__erPending--;if(window.__erPending<=0){window.__erReady=true;document.dispatchEvent(new Event('er-ready'))}}";
var neu2="window.__erShardDone=function(){window.__erPending--;if(window.__erPending<=0){window.__erReady=true;document.dispatchEvent(new Event('er-ready'))}}";
if(c.indexOf(old2)<0){console.log('DISPATCH NOT FOUND');process.exit(1)}
c=c.replace(old2,neu2);
fs.writeFileSync(p,c);
console.log('patched size='+fs.statSync(p).size);
