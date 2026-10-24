var fs=require('fs');
var p='C:/temp/er-n554/index.html';
fs.copyFileSync('C:/temp/er-n552/index.html',p);
var c=fs.readFileSync(p,'utf8');

/* 1. switchTab 加 er-ready 守卫 + 各 Tab 渲染触发 */
var old=/function switchTab\(name\)\{[\s\S]*?\n\}/;
var neu=`var _currentTab='build';
function switchTab(name){
  _currentTab=name;
  document.querySelectorAll('nav button').forEach(function(b){b.classList.toggle('active',b.dataset.tab===name)});
  document.querySelectorAll('.tab').forEach(function(x){x.classList.toggle('active',x.id==='tab-'+name)});
  try{var _m=document.querySelector('main');if(_m)_m.scrollTop=0;else window.scrollTo(0,0)}catch(e){}
  /* v4.99 Tab 渲染链守卫：数据未就绪→显示 loading；就绪后自动渲染该 Tab */
  if(!window.__erReady){
    var box=document.getElementById('tab-'+name);
    if(box)box.innerHTML='<div style="padding:40px;text-align:center;color:var(--sub)">数据加载中…</div>';
    return;
  }
  try{
    if(name==='speed'){speedEnsureTable()}
    else if(name==='core'&&window.drawCoreList){drawCoreList()}
    else if(name==='analyze'){renderAnalyze()}
    else if(name==='dex'&&typeof renderSp==='function'){renderSp(true)}
  }catch(e){console.warn('tab render fail',name,e)}
}
document.addEventListener('er-ready',function(){
  setTimeout(function(){switchTab(_currentTab)},50);
});`;
if(!old.test(c)){console.log('SWITCHTAB NOT FOUND');process.exit(1)}
c=c.replace(old,neu);

/* 2. 版本号 */
c=c.replace("ER_ENGINE_VER='v4.99'","ER_ENGINE_VER='v4.99'");

/* 3. CSS 观感：卡片圆角+轻阴影（在 </style> 前注入） */
var cssAdd=`
/* v4.99 观感：卡片圆角+轻阴影 */
.slot,.badge,.tab,.card,[class*=box]{}
.btn{border-radius:8px;box-shadow:0 1px 2px rgba(0,0,0,.08)}
.slot{border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,.06)}
`;
c=c.replace('</style>',cssAdd+'</style>');

fs.writeFileSync(p,c);
console.log('patched size='+fs.statSync(p).size);
