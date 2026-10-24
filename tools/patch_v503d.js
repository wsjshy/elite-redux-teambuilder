var fs=require('fs');
var p='C:/temp/er-n574/index.html';
fs.copyFileSync('C:/temp/er-n572/index.html',p);
var c=fs.readFileSync(p,'utf8');

/* 分享卡弹窗追加 hash 链接区 + 二维码区 */
var old="'<button class=\"btn-mini\" onclick=\"shareCardClose()\">关闭</button></div></div></div>';";
var neu="'<button class=\"btn-mini\" onclick=\"shareCardClose()\">关闭</button></div>'+\n    '<div style=\"margin-top:10px;padding-top:10px;border-top:1px solid #e0e6ef\">'+\n    '<div style=\"font-size:12px;color:#546e7a;margin-bottom:4px\">🔗 链接分享（含队伍全字段）</div>'+\n    '<div id=\"shareHashLink\" style=\"font-size:11px;color:#00897b;word-break:break-all;max-height:40px;overflow:auto\"></div>'+\n    '<button class=\"btn-mini\" style=\"margin-top:6px\" onclick=\"shareHashCopy()\">📋 复制链接</button>'+\n    '<div style=\"margin-top:10px;display:flex;align-items:center;gap:10px;flex-wrap:wrap\">'+\n    '<canvas id=\"shareQr\" width=\"120\" height=\"120\" style=\"border:1px solid #e0e6ef;border-radius:6px\"></canvas>'+\n    '<div style=\"font-size:11px;color:#78909c\">扫码即可在手机端打开本队伍</div></div></div></div></div>';";
if(c.indexOf(old)<0){console.log('SHARE CARD NOT FOUND');process.exit(1)}
c=c.replace(old,neu);

/* shareCardDraw 末尾追加 hash+QR 渲染 */
c=c.replace("document.body.insertAdjacentHTML('beforeend',h);\n  shareCardDraw();",
`document.body.insertAdjacentHTML('beforeend',h);
  shareCardDraw();
  /* v4.103 hash 链接 + QR */
  var hash=teamToHash();
  var fullUrl=location.origin+location.pathname+'#team='+hash;
  var hl=document.getElementById('shareHashLink');if(hl)hl.textContent=fullUrl;
  try{var qr=new QRCode(fullUrl);var qc=document.getElementById('shareQr');if(qc)qr.draw(qc)}catch(e){}
});`);

/* 追加 shareHashCopy 函数 */
c=c.replace("function shareCardClose(){var o=document.getElementById('shareCardOverlay');if(o)o.remove()}",
`function shareHashCopy(){
  var hl=document.getElementById('shareHashLink');if(!hl)return;
  var url=hl.textContent;
  if(navigator.clipboard)navigator.clipboard.writeText(url).then(function(){toast('链接已复制')});
  else toast('请手动复制');
}
function shareCardClose(){var o=document.getElementById('shareCardOverlay');if(o)o.remove()}`);

/* er-ready 后检测 hash 自动加载 */
c=c.replace("window.addEventListener('er-ready',function(){",
`window.addEventListener('er-ready',function(){
  /* v4.103 hash 自动加载 */
  try{
    if(location.hash&&location.hash.indexOf('#team=v2.1:')===0){
      loadFromHash(location.hash.slice(6));
      toast('已从链接恢复队伍');
    }
  }catch(e){}
`);

fs.writeFileSync(p,c);
console.log('patched size='+fs.statSync(p).size);
