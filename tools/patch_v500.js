var fs=require('fs');
var p='C:/temp/er-n563/index.html';
fs.copyFileSync('C:/temp/er-n562/index.html',p);
var c=fs.readFileSync(p,'utf8');

/* 版本号 */
c=c.replace("ER_ENGINE_VER='v4.99'","ER_ENGINE_VER='v4.100'");
c=c.replace("引擎 v4.99","引擎 v4.100");

/* v4.100 观感收尾：统一色板+密度+微交互 */
var cssAdd=`
/* v4.100 观感收尾：语义色统一+微交互规范 */
:root{
  --ok:#2e7d32;       /* 成功：入队/生成 */
  --warn:#ed6c02;     /* 警示：警告/冲突 */
  --danger:#c62828;   /* 危险：删除/清空 */
  --hi:#1565c0;       /* 数据高亮：主蓝 */
  --hi2:#6a1b9a;      /* 次高亮：紫 */
}
.btn,.badge,.chip,.slot{
  cursor:pointer;
  transition:transform .15s ease, box-shadow .15s ease, background .15s ease;
}
.btn:hover,.badge:hover,.chip:hover{
  box-shadow:0 2px 6px rgba(0,0,0,.12);
}
.btn:active,.chip:active{
  transform:translateY(1px);
  box-shadow:0 1px 2px rgba(0,0,0,.1);
}
.slot{padding:6px 8px;margin-bottom:6px}
.tab{padding:10px 12px}
`;
c=c.replace('</style>',cssAdd+'</style>');

fs.writeFileSync(p,c);
console.log('patched size='+fs.statSync(p).size);
