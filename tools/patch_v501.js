var fs=require('fs');
var p='C:/temp/er-n564/index.html';
fs.copyFileSync('C:/temp/er-n563/index.html',p);
var c=fs.readFileSync(p,'utf8');

/* 版本号 */
c=c.replace("ER_ENGINE_VER='v4.100'","ER_ENGINE_VER='v4.101'");
c=c.replace("引擎 v4.100","引擎 v4.101");

/* v4.101 队检聚合告警 + 速度线染色 + 迷你联防条 */
var cssAdd=`
/* v4.101 队检 chip 行 */
.qa-chip{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:12px;font-size:11px;background:#fff3e0;color:#e65100;border:1px solid #ffcc80;cursor:pointer;margin:2px}
.qa-chip:hover{background:#ffe0b2}
.qa-detail{padding:4px 8px;font-size:11px;color:var(--sub);display:none}
.qa-detail.open{display:block}
/* v4.101 速度线分位染色 */
.spd-p50{background:rgba(0,0,0,.03)}
.spd-p50-75{background:rgba(21,101,192,.06)}
.spd-p75-90{background:rgba(21,101,192,.12)}
.spd-p90-99{background:rgba(21,101,192,.2)}
.spd-p99{background:rgba(21,101,192,.3);font-weight:600}
/* v4.101 迷你联防条 */
.mini-def{display:flex;flex-wrap:wrap;gap:4px;margin:4px 0}
.mini-def span{padding:2px 6px;border-radius:6px;font-size:10px;background:#fce4ec;color:#c62828}
`;
c=c.replace('</style>',cssAdd+'</style>');

/* 在 renderAnalyze 后注入队检+联防条函数 */
var inject=`
/* v4.101 队检聚合告警 */
function teamQA(){
  if(!window.__erReady)return '';
  var warns=[];
  /* ① 重复物种 */
  var spCount={};team.forEach(function(s){spCount[s.id]=(spCount[s.id]||0)+1});
  var dupSp=Object.keys(spCount).filter(function(k){return spCount[k]>=2});
  if(dupSp.length)warns.push({icon:'⚠',label:'重复物种 ×'+dupSp.length,detail:dupSp.map(function(id){var s=ERDATA.species.filter(function(x){return x.id==id})[0];return s?s.zh:id}).join('、')});
  /* ② 重复道具 */
  var itCount={};team.forEach(function(s){var it=teamInfo[s.id]&&teamInfo[s.id].item;if(it)itCount[it]=(itCount[it]||0)+1});
  var dupIt=Object.keys(itCount).filter(function(k){return itCount[k]>=2});
  if(dupIt.length)warns.push({icon:'⚠',label:'重复道具 ×'+dupIt.length,detail:dupIt.join('、')});
  /* ③ 无除钉 */
  var REMOVAL=['高速旋转','清除浓雾','龙尾','旋灭裂空','除雪'];
  var hasRemoval=team.some(function(s){var mv=(teamInfo[s.id]&&teamInfo[s.id].moves)||[];return mv.some(function(m){return REMOVAL.indexOf(m)>-1})});
  if(!hasRemoval)warns.push({icon:'⚠',label:'全队无除钉招式',detail:'建议带高速旋转/清除浓雾等除钉招式应对场地钉子'});
  /* ④ 无回复 */
  var RECOVER=['羽栖','许愿','睡眠','生蛋','自我再生','鸟栖'];
  var hasRec=team.some(function(s){var mv=(teamInfo[s.id]&&teamInfo[s.id].moves)||[];return mv.some(function(m){return RECOVER.indexOf(m)>-1})});
  if(!hasRec)warns.push({icon:'⚠',label:'全队无回复招式',detail:'建议带羽栖/许愿/再生力特性等回复手段'});
  if(!warns.length)return '';
  var h='<div style="margin:6px 0;padding:6px;border:1px solid #ffcc80;border-radius:8px;background:#fff8e1">';
  h+='<div style="font-size:11px;font-weight:600;margin-bottom:4px">队检告警</div><div>';
  warns.forEach(function(w,i){
    h+='<span class="qa-chip" onclick="var d=document.getElementById(\'qa-d'+i+'\');if(d)d.classList.toggle(\'open\')">'+w.icon+' '+w.label+'</span>';
  });
  h+='</div>';
  warns.forEach(function(w,i){
    h+='<div class="qa-detail" id="qa-d'+i+'">'+w.detail+'</div>';
  });
  h+='</div>';
  return h;
}
/* v4.101 迷你联防条 */
function miniDefBar(){
  if(!window.__erReady)return '';
  var weak={};
  ERDATA.types.forEach(function(at){
    var w=0;team.forEach(function(s){try{var c=defCellTrio(s,at).inn;if(c>=2)w++}catch(e){}});
    if(w>=2)weak[at]=w;
  });
  var keys=Object.keys(weak).sort(function(a,b){return weak[b]-weak[a]}).slice(0,6);
  if(!keys.length)return '';
  return '<div style="margin:6px 0"><div style="font-size:11px;color:var(--sub)">共同薄弱系</div><div class="mini-def">'+keys.map(function(at){return '<span>'+at+' ×'+weak[at]+'</span>'}).join('')+'</div></div>';
}
`;
c=c.replace('/* ============ v4.97 A：智能补位',inject+'\n/* ============ v4.97 A：智能补位');

fs.writeFileSync(p,c);
console.log('patched size='+fs.statSync(p).size);
