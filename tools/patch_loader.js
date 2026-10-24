var fs=require('fs');
var p='C:/temp/er-n528/index.html';
var c=fs.readFileSync(p,'utf8');
var re=/document\.write\('<scr'\+'ipt src="data\.js\?v=785e3502"><\\\/scr'\+'ipt>'\);/;
if(!re.test(c)){console.log('NOT FOUND');process.exit(1)}
var repl=`document.write('<scr'+'ipt src="data_lite_v498.js?v=v498"><\\/scr'+'ipt>');
  window.__ER_SHARDS={species:false,adv:false,fail:{}};
  function __loadShard(name,url){
    var s=document.createElement('script');s.src=url;s.async=true;
    s.onload=function(){window.__ER_SHARDS[name]=true;document.dispatchEvent(new Event('er-shard-'+name));};
    s.onerror=function(){window.__ER_SHARDS.fail[name]=true;var b=document.createElement('div');b.style.cssText='position:fixed;bottom:8px;left:8px;right:8px;padding:10px;background:#fde;color:#900;border-radius:8px;z-index:9999;font-size:12px';b.innerHTML='数据分片 '+name+' 加载失败 <button onclick="location.reload()" style="margin-left:8px;padding:4px 12px">重试</button>';document.body.appendChild(b);};
    document.head.appendChild(s);
  }
  window.addEventListener('DOMContentLoaded',function(){__loadShard('species','data_species_v498.js?v=v498');__loadShard('adv','data_adv_v498.js?v=v498');});`;
c=c.replace(re,repl);
fs.writeFileSync(p,c);
console.log('patched size='+fs.statSync(p).size);
