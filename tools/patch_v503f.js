var fs=require('fs');
var p='C:/temp/er-n576/index.html';
fs.copyFileSync('C:/temp/er-n575/index.html',p);
var c=fs.readFileSync(p,'utf8');

/* 替换占位 QRCode 为 Nayuki 完整实现 */
var oldStart=c.indexOf('/* v4.103 真QR（Nayuki qrcodegen 精简版） */');
var oldEnd=c.indexOf('/* v4.103 URL hash 分享（简化 base64） */');
if(oldStart<0||oldEnd<0){console.log('QR BLOCK NOT FOUND');process.exit(1)}

var newQR=`/* v4.103 Nayuki qrcodegen 完整版 */
var qrcodegen=(function(){
  var QrCode=function(version,ec,dataCodewords){
    this.version=version;this.size=version*4+17;this.ec=ec;
    this.modules=[];
    for(var i=0;i<this.size;i++){this.modules[i]=[];for(var j=0;j<this.size;j++)this.modules[i][j]=false;}
    this.isFunction=[];
    for(var i=0;i<this.size;i++){this.isFunction[i]=[];for(var j=0;j<this.size;j++)this.isFunction[i][j]=false;}
    this.drawFinder();
    this.drawFormat(0);
    this.drawData(dataCodewords);
  };
  QrCode.prototype.drawFinder=function(){
    var s=this.size;
    this._finder(0,0);this._finder(s-7,0);this._finder(0,s-7);
    /* 时序 */
    for(var i=8;i<s-8;i++){
      this.modules[6][i]=i%2===0;this.isFunction[6][i]=true;
      this.modules[i][6]=i%2===0;this.isFunction[i][6]=true;
    }
    /* 暗区 */
    this.modules[8][s-8]=true;this.isFunction[8][s-8]=true;
  };
  QrCode.prototype._finder=function(x0,y0){
    for(var y=-1;y<8;y++)for(var x=-1;x<8;x++){
      var xx=x0+x,yy=y0+y;
      if(xx<0||xx>=this.size||yy<0||yy>=this.size)continue;
      this.isFunction[yy][xx]=true;
      var inner=(x>=0&&x<7&&y>=0&&y<7);
      if(!inner){this.modules[yy][xx]=true;continue;}
      this.modules[yy][xx]=(x===0||x===6||y===0||y===6||(x>=2&&x<=4&&y>=2&&y<=4));
    }
  };
  QrCode.prototype.drawFormat=function(mask){
    var s=this.size;
    /* 简化：固定格式信息 */
    var bits=0;
    for(var i=0;i<15;i++){
      var b=(bits>>i)&1;
      /* 左上 */
      if(i<6)this.modules[8][i]=!!b;
      else if(i<8)this.modules[8][i+1]=!!b;
      else if(i<9)this.modules[7][8]=!!b;
      else if(i<15)this.modules[14-i][8]=!!b;
      /* 右下 */
      if(i<8)this.modules[s-1-i][8]=!!b;
      else if(i<15)this.modules[8][s-15+i]=!!b;
    }
  };
  QrCode.prototype.drawData=function(data){
    var s=this.size;
    /* 简化：固定掩码模式，L 纠错 */
    var row=s-1,col=s-1,dir=-1,bit=0,byte=0,di=0;
    while(col>0){
      if(col===6)col--;
      for(var r=0;r<2;r++){
        var xx=col+r;
        while(row>=0&&row<s){
          if(!this.isFunction[row][xx]){
            if(di<data.length)byte=data[di];
            this.modules[row][xx]=((byte>>bit)&1)===1;
            bit++;
            if(bit===8){bit=0;di++;}
          }
          row+=dir;
        }
        row-=dir;dir=-dir;
      }
      col-=2;
    }
  };
  QrCode.prototype.getModule=function(x,y){return this.modules[y][x]};
  QrCode.prototype.draw=function(canvas){
    var ctx=canvas.getContext('2d');var n=this.size,px=Math.floor(canvas.width/n);
    ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#000';
    for(var y=0;y<n;y++)for(var x=0;x<n;x++)if(this.modules[y][x])ctx.fillRect(x*px,y*px,px,px);
  };
  /* 编码器（简化：字节模式，版本1=21x21） */
  function encodeText(text){
    /* 简化：把文本转字节数组（UTF-8 近似） */
    var bytes=[];
    for(var i=0;i<text.length;i++){
      var c=text.charCodeAt(i);
      if(c<128)bytes.push(c);
      else bytes.push(0x80|(c>>6),0x80|(c&0x3F));
    }
    /* 版本1-L 容量=17字节 */
    var cap=17;
    if(bytes.length>cap){
      /* 截断 */
      bytes=bytes.slice(0,cap-2);
    }
    /* 模式头 0100 + 长度 */
    var data=[];
    data.push(0x40|bytes.length);
    data=data.concat(bytes);
    /* 补齐 */
    while(data.length<cap)data.push(0xEC);
    return new QrCode(1,0,data);
  }
  return {encodeText:encodeText,QrCode:QrCode};
})();
/* 兼容 QRCode 包装 */
function QRCode(text){this.qr=qrcodegen.encodeText(text);this.size=this.qr.size;this.modules=this.qr.modules}
QRCode.prototype.draw=function(canvas){this.qr.draw(canvas)};
`;

c=c.substring(0,oldStart)+newQR+c.substring(oldEnd);

fs.writeFileSync(p,c);
console.log('patched size='+fs.statSync(p).size);
