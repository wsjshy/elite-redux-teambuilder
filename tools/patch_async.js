var fs=require('fs');
var p='C:/temp/er-n534/index.html';
fs.copyFileSync('C:/temp/er-n532/index.html',p);
var c=fs.readFileSync(p,'utf8');

/* 1. 同步 document.write 三片 → 改回异步（DOMContentLoaded 并行），loaded 后 dispatch er-ready */
var syncRe=/document\.write\('<scr'\+'ipt src="data_species_v498\.js\?v=v498"><\\\/scr'\+'ipt>'\);\s*\n\s*document\.write\('<scr'\+'ipt src="data_adv_v498\.js\?v=v498"><\\\/scr'\+'ipt>'\);/;
if(!syncRe.test(c)){console.log('SYNC CALL NOT FOUND');process.exit(1)}
c=c.replace(syncRe,`window.__erPending=2;window.__erReady=false;
  function __erShardDone(){window.__erPending--;if(window.__erPending<=0){window.__erReady=true;document.dispatchEvent(new Event('er-ready'))}}
  __loadShard('species','data_species_v498.js?v=v498');__loadShard('adv','data_adv_v498.js?v=v498');
  var _origOnload=window.__loadShard;
  /* wrap: onload→__erShardDone */`);
/* 改 __loadShard 的 onload 调用 __erShardDone */
c=c.replace(/s\.onload=function\(\)\{window\.__ER_SHARDS\[name\]=true;document\.dispatchEvent\(new Event\('er-shard-'\+name\)\);\}/,
  "s.onload=function(){window.__ER_SHARDS[name]=true;document.dispatchEvent(new Event('er-shard-'+name));if(window.__erShardDone)__erShardDone();}");

/* 2. L2997 renderSp(true) 顶层调用 → 数据就绪后触发 */
c=c.replace(/\nrenderSp\(true\);/,
  "\nif(window.ERDATA&&ERDATA.species){renderSp(true);}else{document.addEventListener('er-ready',function(){renderSp(true);});}");

fs.writeFileSync(p,c);
console.log('patched, size='+fs.statSync(p).size);
