var fs=require('fs');
var p='C:/temp/er-n568/index.html';
fs.copyFileSync('C:/temp/er-n567/index.html',p);
var c=fs.readFileSync(p,'utf8');

/* 版本号 */
c=c.replace("ER_ENGINE_VER='v4.101'","ER_ENGINE_VER='v4.102'");
c=c.replace("引擎 v4.101","引擎 v4.102");

/* 队检招式名对齐 */
c=c.replace("var REMOVAL=['高速旋转','清除浓雾','龙尾','旋灭裂空','除雪'];",
  "var REMOVAL=['高速旋转','清除浓雾','龙尾']; /* v4.102 对齐 data.js 真名：旋灭裂空/除雪 无对应招式已移除 */");
c=c.replace("var RECOVER=['羽栖','许愿','睡眠','生蛋','自我再生','鸟栖'];",
  "var RECOVER=['羽栖','祈愿','睡觉','生蛋','自我再生','月光']; /* v4.102 对齐 data.js 真名：许愿→祈愿/睡眠→睡觉/鸟栖→羽栖 移除/新增月光 */");

/* 耐久叙事：补位理由追加 */
var old="if(d.spdGap&&sp>d.mx){why='补速线：队伍极速 '+d.mx+' 低于 P75（'+d.q.P75+'）；推荐 '+s.zh+' 极速 '+sp+' 可压该段';return {s:s,why:why,val:sp}}";
var neu="if(d.spdGap&&sp>d.mx){why='补速线：队伍极速 '+d.mx+' 低于 P75（'+d.q.P75+'）；推荐 '+s.zh+' 极速 '+sp+' 可压该段';if(d.noResistWeak.length)why+='；同时可联防 '+d.noResistWeak.join('/');return {s:s,why:why,val:sp}}";
if(c.indexOf(old)<0){console.log('SMART SUGGEST NOT FOUND');process.exit(1)}
c=c.replace(old,neu);

fs.writeFileSync(p,c);
console.log('patched size='+fs.statSync(p).size);
