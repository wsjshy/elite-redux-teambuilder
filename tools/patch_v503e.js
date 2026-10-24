var fs=require('fs');
var p='C:/temp/er-n575/index.html';
fs.copyFileSync('C:/temp/er-n574/index.html',p);
var c=fs.readFileSync(p,'utf8');

/* 在 shareCardDraw 末尾追加 QR 渲染 */
c=c.replace("function shareCardClose(){var o=document.getElementById('shareCardOverlay');if(o)o.remove()}",
`/* v4.103 QR 渲染 */
function renderShareQr(){
  try{
    var hash=teamToHash();
    var fullUrl=location.origin+location.pathname+'#team='+hash;
    var hl=document.getElementById('shareHashLink');if(hl)hl.textContent=fullUrl;
    var qc=document.getElementById('shareQr');
    if(qc){
      var qr=new QRCode(fullUrl);
      qr.draw(qc);
    }
  }catch(e){console.log('QR err',e)}
}
function shareCardClose(){var o=document.getElementById('shareCardOverlay');if(o)o.remove()}`);

/* shareCardOpen 末尾调用 renderShareQr */
c=c.replace("document.body.insertAdjacentHTML('beforeend',h);\n  shareCardDraw();",
`document.body.insertAdjacentHTML('beforeend',h);
  shareCardDraw();
  renderShareQr();`);

fs.writeFileSync(p,c);
console.log('patched size='+fs.statSync(p).size);
