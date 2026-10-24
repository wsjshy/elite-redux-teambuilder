var fs=require('fs');
var p='C:/temp/er-n578/index.html';
fs.copyFileSync('C:/temp/er-n577/index.html',p);
var c=fs.readFileSync(p,'utf8');

/* 修复 QRLIB 挂载：bundle 是 IIFE 无返回，需让它返回 Nn */
c=c.replace("var QRLIB=(function(){$=this;return (()=>{",
  "var QRLIB=(function(){return (()=>{var __ret;");
/* 末尾 Nn() 改为赋值 */
c=c.replace("Nn();})();\n;})();",
  "__ret=Nn;return __ret;})();})();");

fs.writeFileSync(p,c);
console.log('patched size='+fs.statSync(p).size);
