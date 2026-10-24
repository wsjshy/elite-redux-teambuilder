var fs=require('fs');
var p='C:/temp/er-n556/index.html';
fs.copyFileSync('C:/temp/er-n554/index.html',p);
var c=fs.readFileSync(p,'utf8');

/* 1. speedEnsureTable 不缓存早退——er-ready 后强制重渲 */
var old1="function speedEnsureTable(){if(window._speedTableBuilt)return;var b=document.getElementById('spdTableBox');if(!b)return;speedRefreshTable();window._speedTableBuilt=true}";
var new1="function speedEnsureTable(){var b=document.getElementById('spdTableBox');if(!b)return;try{speedRefreshTable()}catch(e){}}";
if(c.indexOf(old1)<0){console.log('SPEED ENSURE NOT FOUND');process.exit(1)}
c=c.replace(old1,new1);

/* 2. er-ready 后清 _speedTableBuilt 并重渲当前 Tab */
var old2="document.addEventListener('er-ready',function(){\n  setTimeout(function(){switchTab(_currentTab)},50);\n});";
var new2="document.addEventListener('er-ready',function(){\n  window._speedTableBuilt=false;\n  setTimeout(function(){switchTab(_currentTab)},100);\n});";
if(c.indexOf(old2)<0){console.log('ER-READY LISTENER NOT FOUND');process.exit(1)}
c=c.replace(old2,new2);

/* 3. renderCore 入口加 species 就绪守卫 */
var old3=/function renderCore\(s\)\{[\s\S]{0,80}?if\(!s\)\{/;
var new3="function renderCore(s){\n  if(!window.__erReady){var _co=document.getElementById('coreOut');if(_co)_co.innerHTML='<div class=\"tip\">数据加载中…</div>';return}\n  if(!s){";
if(!old3.test(c)){console.log('RENDERCORE NOT FOUND');process.exit(1)}
c=c.replace(old3,new3);

fs.writeFileSync(p,c);
console.log('patched size='+fs.statSync(p).size);
