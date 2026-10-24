var fs=require('fs');
var p='C:/temp/er-n544/index.html';
fs.copyFileSync('C:/temp/er-n542/index.html',p);
var c=fs.readFileSync(p,'utf8');

/* 1. 把 NATURES 字面量定义移到 var MV,ABI,ITM 之后（L881 附近），确保顶层脚本任何位置抛错前 NATURES 已声明 */
var natBlock=`var NATURES={
  '固执':['+攻击','-特攻'],'爽朗':['+速度','-特攻'],'胆小':['+速度','-攻击'],'内敛':['+特攻','-攻击'],
  '大胆':['+防御','-攻击'],'沉着':['+特防','-攻击'],'淘气':['+防御','-特攻'],'慎重':['+特防','-特攻'],
  '勇敢':['+攻击','-速度'],'冷静':['+特攻','-速度'],'悠闲':['+防御','-速度'],'狂妄':['+特防','-速度'],
  '怕寂寞':['+攻击','-防御'],'顽皮':['+攻击','-特防'],'急躁':['+速度','-防御'],'天真':['+速度','-特防'],
  '温和':['+特攻','-防御'],'马虎':['+特攻','-特防'],'温顺':['+特防','-防御'],'乐天':['+防御','-特防'],
  '认真':['全平衡'],'勤奋':['全平衡'],'坦率':['全平衡'],'害羞':['全平衡'],'浮躁':['全平衡']
};`;
/* 简化：只在锚点插入 NATURES，不删旧块（重复 var 非 strict 无害） */
var anchor='var MV={},ABI={},ITM={};';
if(c.indexOf(anchor)<0){console.log('ANCHOR NOT FOUND');process.exit(1)}
c=c.replace(anchor,anchor+'\n'+natBlock);
fs.writeFileSync(p,c);
console.log('patched size='+fs.statSync(p).size);
