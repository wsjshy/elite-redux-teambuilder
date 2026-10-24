var fs=require('fs');
var p='C:/temp/er-n546/index.html';
fs.copyFileSync('C:/temp/er-n544/index.html',p);
var c=fs.readFileSync(p,'utf8');
var old="fetch('assets/showdown_sets_v496.json').then(function(r){return r.json()}).then(function(j){window._SH_CACHE=j;cb(j)}).catch(function(){window._SH_CACHE=null;cb(null)});";
var neu="fetch('assets/showdown_sets_v496.json').then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}).then(function(j){window._SH_CACHE=j;cb(j)}).catch(function(e){window._SH_CACHE=null;try{toast('官方模板加载失败，已回退纯随机：'+(e&&e.message||e))}catch(_){}cb(null)});";
if(c.indexOf(old)<0){console.log('FETCH NOT FOUND');process.exit(1)}
c=c.replace(old,neu);
fs.writeFileSync(p,c);
console.log('patched size='+fs.statSync(p).size);
