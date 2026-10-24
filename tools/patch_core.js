var fs=require('fs');
var p='C:/temp/er-n560/index.html';
fs.copyFileSync('C:/temp/er-n558/index.html',p);
var c=fs.readFileSync(p,'utf8');

/* 把核心配队 IIFE 包成 er-ready 后执行 */
var re1=/\(function\(\)\{\s*var coreFilter=\{types:\{\}\}/;
var neu1=`function _initCoreList(){
  if(window._coreListInit)return;window._coreListInit=true;
  (function(){
  var coreFilter={types:{}}`;
if(!re1.test(c)){console.log('CORE IIFE START NOT FOUND');process.exit(1)}
c=c.replace(re1,neu1);

/* IIFE 结束 })(); 后接 _initCoreList 调用 */
var re2=/\}\)\(\);\s*\/\* ============ 规格 v1\.0 初始化/;
var neu2=`})();
}
if(window.__erReady){_initCoreList()}else{document.addEventListener('er-ready',function(){setTimeout(_initCoreList,100)})}
/* ============ 规格 v1.0 初始化`;
if(!re2.test(c)){console.log('CORE IIFE END NOT FOUND');process.exit(1)}
c=c.replace(re2,neu2);

fs.writeFileSync(p,c);
console.log('patched size='+fs.statSync(p).size);
