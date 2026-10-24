var fs=require('fs');
var p='C:/temp/er-n548/index.html';
fs.copyFileSync('C:/temp/er-n546/index.html',p);
var c=fs.readFileSync(p,'utf8');
/* er-ready 后空闲预取 sets */
var anchor="function loadShowdownSets(cb){";
var prefetch=`/* er-ready 后空闲预取 sets（不阻塞首屏） */
if(document.addEventListener){document.addEventListener('er-ready',function(){setTimeout(function(){try{fetch('assets/showdown_sets_v496.json').then(function(r){return r.ok?r.json():null}).then(function(j){if(j)window._SH_CACHE=j}).catch(function(){})}catch(e){}},1500)})}
function loadShowdownSets(cb){`;
if(c.indexOf(anchor)<0){console.log('ANCHOR NOT FOUND');process.exit(1)}
c=c.replace(anchor,prefetch);
fs.writeFileSync(p,c);
console.log('patched size='+fs.statSync(p).size);
