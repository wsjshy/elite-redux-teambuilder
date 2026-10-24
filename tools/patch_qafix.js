var fs=require('fs');
var p='C:/temp/er-n565/index.html';
fs.copyFileSync('C:/temp/er-n564/index.html',p);
var c=fs.readFileSync(p,'utf8');

var oldLine="    h+='<span class=\"qa-chip\" onclick=\"var d=document.getElementById('qa-d'+i+'');if(d)d.classList.toggle('open')\">'+w.icon+' '+w.label+'</span>';";
var newLine="    h+='<span class=\"qa-chip\" data-idx=\"'+i+'\" onclick=\"qaToggle(this)\">'+w.icon+' '+w.label+'</span>';";
if(c.indexOf(oldLine)<0){console.log('QA CHIP LINE NOT FOUND');process.exit(1)}
c=c.replace(oldLine,newLine);

/* 注入 qaToggle 全局函数（在 teamQA 前） */
c=c.replace('/* v4.101 队检聚合告警 */\nfunction teamQA(){',
`/* v4.101 队检 chip 展开 */
function qaToggle(el){
  var i=el.getAttribute('data-idx');
  var d=document.getElementById('qa-d'+i);
  if(d)d.classList.toggle('open');
}
/* v4.101 队检聚合告警 */
function teamQA(){`);

fs.writeFileSync(p,c);
console.log('patched size='+fs.statSync(p).size);
