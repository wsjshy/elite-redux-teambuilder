var fs=require('fs');
var p='C:/temp/er-n558/index.html';
fs.copyFileSync('C:/temp/er-n556/index.html',p);
var c=fs.readFileSync(p,'utf8');

/* 1. speedRender 开头加 species 就绪守卫 */
var re1=/function speedRender\(\)\{try\{var q=speedPctiles\(\);/;
var neu1=`function speedRender(){if(!window.__erReady||!ERDATA.species||!ERDATA.species.length){var _sb=document.getElementById('speedBox');if(_sb)_sb.innerHTML='<div class="tip">数据加载中…</div>';return}try{var q=speedPctiles();`;
if(!re1.test(c)){console.log('SPEEDRENDER GUARD NOT FOUND');process.exit(1)}
c=c.replace(re1,neu1);

/* 2. er-ready 监听里补 speedRender(true) */
var re2=/document\.addEventListener\('er-ready',function\(\)\{\n  window\._speedTableBuilt=false;\n  setTimeout\(function\(\)\{switchTab\(_currentTab\)\},100\);\n\}\);/;
var neu2=`document.addEventListener('er-ready',function(){
  window._speedTableBuilt=false;
  setTimeout(function(){try{speedRender(true)}catch(e){};switchTab(_currentTab)},100);
});`;
if(!re2.test(c)){console.log('ER-READY LISTENER NOT FOUND');process.exit(1)}
c=c.replace(re2,neu2);

fs.writeFileSync(p,c);
console.log('patched size='+fs.statSync(p).size);
