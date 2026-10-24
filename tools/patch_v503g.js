var fs=require('fs');
var p='C:/temp/er-n577/index.html';
fs.copyFileSync('C:/temp/er-n576/index.html',p);
var c=fs.readFileSync(p,'utf8');

/* 替换占位 QRCode 为 qrcode bundle */
var oldStart=c.indexOf('/* v4.103 Nayuki qrcodegen 完整版 */');
var oldEnd=c.indexOf('/* v4.103 URL hash 分享（简化 base64） */');
if(oldStart<0||oldEnd<0){console.log('QR BLOCK NOT FOUND');process.exit(1)}

var bundle=fs.readFileSync('C:/temp/er-v491-impl/qr_bundle.js','utf8');
var newQR=`/* v4.103 qrcode.js 完整版（esbuild bundle） */
var QRLIB=(function(){$=this;return ${bundle};})();
/* 兼容 QRCode 包装 */
function QRCode(text){this.qr=QRLIB.create(text,{errorCorrectionLevel:'L'});this.size=this.qr.modules.size;this.modules=this.qr.modules}
QRCode.prototype.draw=function(canvas){
  var ctx=canvas.getContext('2d');var n=this.size,px=Math.floor(canvas.width/n);
  ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='#000';
  for(var y=0;y<n;y++)for(var x=0;x<n;x++)if(this.modules.get(x,y))ctx.fillRect(x*px,y*px,px,px);
};
`;

c=c.substring(0,oldStart)+newQR+c.substring(oldEnd);

fs.writeFileSync(p,c);
console.log('patched size='+fs.statSync(p).size);
