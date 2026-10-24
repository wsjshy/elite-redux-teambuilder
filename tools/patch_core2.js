var fs=require('fs');
var p='C:/temp/er-n562/index.html';
fs.copyFileSync('C:/temp/er-n560/index.html',p);
var c=fs.readFileSync(p,'utf8');

/* 在 er-ready 主监听里补 _initCoreList 调用（双保险） */
var re=/document\.addEventListener\('er-ready',function\(\)\{\s*window\._speedTableBuilt=false;\s*setTimeout\(function\(\)\{try\{speedRender\(true\)\}catch\(e\)\{\};switchTab\(_currentTab\)\},100\);\s*\}\);/;
var neu=`document.addEventListener('er-ready',function(){
  window._speedTableBuilt=false;
  setTimeout(function(){try{speedRender(true)}catch(e){};try{if(window._initCoreList)window._initCoreList()}catch(e){};switchTab(_currentTab)},100);
});`;
if(!re.test(c)){console.log('MAIN ER-READY LISTENER NOT FOUND');process.exit(1)}
c=c.replace(re,neu);

fs.writeFileSync(p,c);
console.log('patched size='+fs.statSync(p).size);
