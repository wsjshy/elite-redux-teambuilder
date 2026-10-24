var fs=require('fs');
var p='C:/temp/er-n579/index.html';
fs.copyFileSync('C:/temp/er-n578/index.html',p);
var c=fs.readFileSync(p,'utf8');

/* 修复：QRLIB 应是调用返回的对象，不是函数 */
c=c.replace("var QRLIB=(function(){return (()=>{var __ret;",
  "var QRLIB=(function(){var __bundle=(()=>{var __ret;");
/* 末尾 */
c=c.replace("__ret=Nn;return __ret;})();})();",
  "__ret=Nn;return __ret;})();return __bundle();})();");

/* renderShareQr 加降级兜底 */
c=c.replace("function renderShareQr(){\n  try{\n    var hash=teamToHash();\n    var fullUrl=location.origin+location.pathname+'#team='+hash;\n    var hl=document.getElementById('shareHashLink');if(hl)hl.textContent=fullUrl;\n    var qc=document.getElementById('shareQr');\n    if(qc){\n      var qr=new QRCode(fullUrl);\n      qr.draw(qc);\n    }\n  }catch(e){console.log('QR err',e)}\n}",
`function renderShareQr(){
  try{
    var hash=teamToHash();
    var fullUrl=location.origin+location.pathname+'#team='+hash;
    var hl=document.getElementById('shareHashLink');if(hl)hl.textContent=fullUrl;
    var qc=document.getElementById('shareQr');
    if(qc){
      if(!QRLIB||typeof QRLIB.create!=='function'){
        qc.style.display='none';
        var hint=qc.nextElementSibling;
        if(hint)hint.textContent='二维码暂不可用，请复制链接分享';
        return;
      }
      var qr=new QRCode(fullUrl);
      qr.draw(qc);
    }
  }catch(e){
    console.log('QR err',e);
    var qc2=document.getElementById('shareQr');
    if(qc2){qc2.style.display='none';var hint=qc2.nextElementSibling;if(hint)hint.textContent='二维码暂不可用，请复制链接分享'}
  }
}`);

fs.writeFileSync(p,c);
console.log('patched size='+fs.statSync(p).size);
