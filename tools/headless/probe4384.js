// v4.384 只读探针（返工版）：增伤清场 / 受队消耗 self-centric 分账 + 弱点保险 322 复核（不改引擎/文档）
const fs = require('fs');
const H = require('./harness.js');
const { ERDATA, deriveBuilds, bulkOf, ownAutoSys, abiImHf, _abEnt, NM2ID, MV } = H;

const allTeam = [26,65,96,80,37,208].map(id => ERDATA.species.find(s => String(s.id)===String(id)));

// ---- 从 index.html 源码取引擎真值集合（不手抄 id）----
const src = fs.readFileSync(__dirname+'/../../index.html','utf8');
function arrOf(key){ const m=src.match(new RegExp(key+'\\s*:\\s*\\[([^\\]]*)\\]')); if(!m)return[]; return m[1].split(',').map(x=>parseInt(x.trim(),10)).filter(n=>!isNaN(n)); }
const FUNC = {
  rec: arrOf('rec'), wear: arrOf('wear'), protect: arrOf('protect'),
  hazard: arrOf('hazard'), removal: arrOf('removal'), pivot: arrOf('pivot'),
  boost: arrOf('boost'), weather: arrOf('weather')
};
const REC_EXT = (src.match(/FUNC_MV_REC_EXT=\[([^\]]*)\]/)||[])[1].split(',').map(x=>parseInt(x.trim(),10)).filter(n=>!isNaN(n));
const TC_REC_B_NAMES = (src.match(/TC_REC_B=\[([^\]]*)\]/)||[])[1].split(',').map(x=>x.replace(/["']/g,'').trim()).filter(Boolean);
const zh2id={}; Object.keys(MV).forEach(id=>{const r=MV[id]; if(r&&r[1])zh2id[r[1]]=+id;});
const REC_DRAIN = TC_REC_B_NAMES.map(n=>zh2id[n]).filter(id=>id!==undefined && id!==73); // 73 寄生种子归消耗侧，不进回复侧
const REC_MV = [...new Set([...FUNC.rec, ...REC_EXT, ...REC_DRAIN])];
const WEAR_MV = [...new Set([...FUNC.wear, 261,174,227])]; // 73 寄生种子/92 剧毒 + 261 磷火/174 诅咒/227 再来一次（改动 A 补入）
const PROTECT_MV = FUNC.protect;                 // 164 替身 / 182 守住
const HAZ_MV = FUNC.hazard, REM_MV = FUNC.removal;
const CLEANSE_MV = [114,18,46];                  // 黑雾 / 吹飞 / 吼叫（破强化逼换，防守向）
const BOOST = FUNC.boost;
const DEF_MV = [...new Set([...PROTECT_MV, ...REC_MV, ...WEAR_MV, ...HAZ_MV, ...REM_MV, ...CLEANSE_MV])];

const REC_ABI = { '144':'再生力', '90':'毒疗' };
const REC_ITEM = ['剩饭','黑色污泥'];

// ---- (c) 体系加成按 id 语义分档（abiTags cond 字段 + AXIS_LIB 受益者判定 + 描述原文复核）----
const SYS_COND = { 晴:['晴天'], 雨:['雨天'], 沙:['沙暴'], 雪:['冰雹'], 场地:['青草场地'], 精神场地:['精神场地'], 薄雾场地:['薄雾场地'], 电场:['电气场地'] };
const SYS_WORD = { 晴:/晴天|日照|大太阳/, 雨:/雨/, 沙:/沙暴|沙/, 雪:/冰雹|雪/, 场地:/场地/, 精神场地:/精神场地/, 薄雾场地:/薄雾场地/, 电场:/电气场地|电场/ };
// 进攻/速度加成（计入 c）：tagless 但已人工核实的提速/攻特攻倍率
const OFF_EATER = {
  晴:['34','94','380','268','122','862'],
  雨:['33'],
  沙:['146','159'],
  雪:['202','862'],
  场地:['182','477'],
  精神场地:[], 薄雾场地:['182'], 电场:['477']
};
// 防御/耐久加成（场地/天气内防特防×1.5，不计进攻加成）
const DEF_EATER = ['179','984','1018'];
// 明确非进攻：免疫 / 回血回复 / 闪避 / 减伤 / 天气场地手 / 免疫后条件增伤
const NON_EATER = {
  '11':'免疫·水+回血','114':'免疫·水+条件攻升','10':'免疫·电+回血','31':'免疫·电+条件攻升',
  '87':'免疫·水+回血','157':'免疫·草+条件攻升','18':'免疫·火+条件火招增伤','26':'免疫·地面+飞行招增伤',
  '78':'免疫·电+条件提速','422':'免疫·恶幽灵虫','44':'雨天回血','115':'冰雹回血','41':'水环回血+免灼伤',
  '591':'场地回合末回血','8':'沙暴闪避','81':'冰雹闪避','987':'雨天闪避','47':'火/冰减伤',
  '136':'满血减伤','231':'满血减伤','169':'接触减伤','218':'接触减伤+火弱点','547':'异常免疫+幽灵减半',
  '2':'降雨(天气手)','45':'扬沙(天气手)','117':'降雪(天气手)','229':'青草制造者(场地手)','227':'精神制造者(场地手)',
  '228':'薄雾制造者(场地手)','226':'电气制造者(场地手)','348':'入场极光幕(防守向)',
  '70':'日照(天气手)','93':'雨天清异常(非进攻)','142':'免疫天气伤害+减伤','585':'晴天反先制+物减','903':'沙暴队友免疫+回合末回血',
  '53':'场地清除手','102':'晴天清异常(非进攻)','482':'沙暴反先制+特减'
};
function tagOf(id){ return ERDATA.abiTags[id]||null; }

function kitIds(b){ const ids=[]; (b.mv&&b.mv.main||[]).forEach(m=>ids.push(+m.id)); (b.mv&&b.mv.func||[]).forEach(m=>ids.push(+m.id)); return ids; }
function dmgCount(ids){ return ids.filter(id=>{const r=MV[id]; return r && r[4]!=='变化';}).length; }
function offEvAlloc(a){ a=a||[0,0,0,0,0,0]; return Math.max(a[1]||0,a[3]||0); }
function offEv(b){ const a=b.ev&&(b.ev.alloc||b.ev)||[0,0,0,0,0,0]; return offEvAlloc(a); }
function hasBoost(ids){ return BOOST.some(id=>ids.indexOf(id)>=0); }
function descOf(id){ const e=_abEnt(String(id)); return e?String(e[3]||''):''; }
function abiName(id){ const e=_abEnt(String(id)); return e?e[2]:('#'+id); }
function selfAbiIds(s){ return (s.abiIds||[]).concat(s.innIds||[]).map(String); }
function mvZh(id){ const r=MV[id]; return r?r[1]:('?' + id); }

function prefixOf(name){
  const order=['精神场地','薄雾场地','场地','电场','晴','雨','沙','雪'];
  for(const p of order){ if(name.indexOf(p)>=0) return p; }
  return '无';
}

// (c) 单特性语义判定：先 abiTags cond 命中本体系 → 进攻/防御；再人工表；其余按描述
function cVerdict(id, pre){
  const tag=tagOf(id);
  const conds=SYS_COND[pre]||[];
  if((OFF_EATER[pre]||[]).indexOf(id)>=0) return {v:'进攻/速度加成', note:'id 命中进攻/速度加成集'};
  if(DEF_EATER.indexOf(id)>=0) return {v:'防御/耐久加成', note:'天气/场地内防或特防×1.5，非进攻增益'};
  if(NON_EATER[id]) return {v:NON_EATER[id].split('·')[0], note:NON_EATER[id]};
  if(tag){
    if(tag.out && tag.out.cond && conds.indexOf(tag.out.cond)>=0) return {v:'进攻/速度加成', note:'abiTags out cond='+tag.out.cond+' mul='+tag.out.mul};
    if(tag.def && tag.def.cond && conds.indexOf(tag.def.cond)>=0) return {v:'防御/耐久加成', note:'abiTags def cond='+tag.def.cond+' mul='+tag.def.mul};
    if(tag.im) return {v:'免疫', note:'abiTags im='+tag.im.join('/')};
    if(tag.out && tag.out.cond) return {v:'类型增伤(非体系)', note:'abiTags out cond='+tag.out.cond+'（非本体系）'};
    if(tag.conv) return {v:'类型转换(通用)', note:'conv='+tag.conv+'（通用，非体系）'};
  }
  return {v:'待复核', note:'无 abiTags，需人工读描述'};
}
function mentionsSys(id, pre){ const d=descOf(id); const w=SYS_WORD[pre]; return w?w.test(d):false; }

function wxSource(s,b){
  const ids=kitIds(b); const pre=prefixOf(String(b.name||''));
  let a=false, aHow=[];
  const auto=ownAutoSys(s)||[];
  if(auto.length){ a=true; aHow.push('自动体系:'+auto.join('/')); }
  selfAbiIds(s).forEach(id=>{ const d=descOf(id); if(/出场时(降下|制造|呼风|放晴|扬起|飘雪|展开)|制造.{0,4}场地|视为在大晴天/.test(d)){ a=true; aHow.push('特性'+id+'自动'); } });
  const setter=(FUNC.weather.filter(w=>{ if(pre==='晴')return w===241; if(pre==='雨')return w===240; if(pre==='沙')return w===201; if(pre==='雪')return w===258; if(pre==='场地')return [580,581,604,641].indexOf(w)>=0; if(pre==='精神场地')return w===641; if(pre==='薄雾场地')return w===581; if(pre==='电场')return w===604; return false; }));
  const bHit=setter.filter(id=>ids.indexOf(id)>=0);
  const hasB=bHit.length>0;
  let c=false, cHow=[], cRows=[];
  selfAbiIds(s).forEach(id=>{
    const inTable=(OFF_EATER[pre]||[]).indexOf(id)>=0||DEF_EATER.indexOf(id)>=0||!!NON_EATER[id];
    if(!mentionsSys(id,pre) && !inTable) return; // 非体系相关特性不进 (c) 复核桶
    const v=cVerdict(id,pre);
    cRows.push({id, name:abiName(id), v:v.v, note:v.note, desc:descOf(id).slice(0,80)});
    if(v.v==='进攻/速度加成'){ c=true; cHow.push('特性'+id+'('+abiName(id)+')进攻加成'); }
  });
  const rc=recConsume(s,b,ids);
  return { pre, a, b:hasB, c, source:a||hasB||c, how:[...aHow, hasB?('自带招'+bHit.join('/')):'', ...cHow].filter(Boolean), cRows, rec:rc.rec, cons:rc.cons };
}

// 抗性：特性免疫 + 物种属性抗性/免疫
function resistInfo(s){
  const im={}; try{ const h=abiImHf(s); Object.assign(im,h.im||{}); }catch(e){}
  const tnames=ERDATA.types;
  const t1=tnames.indexOf(s.t1), t2=tnames.indexOf(s.t2);
  const res=new Set(), imm=new Set();
  for(let at=0; at<21; at++){
    let mul=1;
    if(t1>=0) mul*=ERDATA.matchup[at][t1];
    if(t2>=0 && t2!==t1) mul*=ERDATA.matchup[at][t2];
    if(mul===0) imm.add(tnames[at]); else if(mul<=0.5) res.add(tnames[at]);
  }
  Object.keys(im).forEach(k=>imm.add(k));
  return {imm:[...imm], res:[...res]};
}

function recConsume(s,b,ids){
  const it0=(b.it&&b.it[0]&&b.it[0][0])||'';
  const abiIds=selfAbiIds(s);
  const rec=REC_ITEM.some(n=>it0.indexOf(n)>=0)||abiIds.some(id=>REC_ABI[id])||REC_MV.some(id=>ids.indexOf(id)>=0);
  const cons=WEAR_MV.concat(PROTECT_MV).some(id=>ids.indexOf(id)>=0);
  return {rec, cons, it0};
}
function stabDmgCount(s, ids){ const stab=new Set([s.t1,s.t2]); return ids.map(id=>MV[id]).filter(r=>r&&r[4]!=='变化'&&stab.has(r[3])).length; }
function offGate(s, ids, ev){ return dmgCount(ids)>=2 && offEvAlloc(ev)>=120 && stabDmgCount(s,ids)>=1; }

function stallSource(s,b){
  const ids=kitIds(b);
  const rc=recConsume(s,b,ids);
  const aAbi=selfAbiIds(s).filter(id=>REC_ABI[id]);
  const aMv=REC_MV.filter(id=>ids.indexOf(id)>=0);
  const A=rc.rec;
  const bulk=bulkOf(s);
  const bWear=WEAR_MV.filter(id=>ids.indexOf(id)>=0);
  const bProt=PROTECT_MV.filter(id=>ids.indexOf(id)>=0);
  const B=bulk>=300 && (bWear.length>0||bProt.length>0);
  return { A, B, neither:!(A||B), bulk, aItem:rc.it0, aAbi:aAbi.map(id=>REC_ABI[id]),
    aMv:aMv.map(id=>id+':'+mvZh(id)), bWear:bWear.map(id=>id+':'+mvZh(id)), bProt:bProt.map(id=>id+':'+mvZh(id)),
    how:[rc.it0?'道具'+rc.it0:'', ...aAbi.map(id=>'特性'+REC_ABI[id]), ...aMv.map(id=>'回复招'+mvZh(id)), ...bWear.map(id=>'消耗招'+mvZh(id)), ...bProt.map(id=>'保命招'+mvZh(id))].filter(Boolean) };
}

// v4.384 确定性路由（改动 B：进攻名只由实配背书；不满足进攻门的耐久/支援卡落受队消耗或联防，禁止叫输出/清场）
function routeNeither(s,row,speciesBuildCount){
  const ids=row.ids, ev=row.ev; const dm=dmgCount(ids), oe=offEvAlloc(ev), hb=hasBoost(ids), sd=stabDmgCount(s,ids);
  const defMv=DEF_MV.filter(id=>ids.indexOf(id)>=0);
  const {imm,res}=resistInfo(s);
  const hasResist=imm.length>0||res.length>0;
  const off=offGate(s,ids,ev);
  // 规则1：免疫/抗性 + ≥1 防守向招 → 稳健联防
  if(hasResist && defMv.length>0) return {land:'稳健联防', why:'抗性/免疫 + 防守向招('+defMv.map(mvZh).join('/')+')', sole:false};
  // 规则2：进攻门（≥2 非变化伤害招 且 攻/特攻 EV≥120 且 ≥1 本系/加成招）→ 强化清场 / 主力输出压制
  if(off) return {land:hb?'强化清场':'主力输出压制', why:'伤害招'+dm+' 本系'+sd+' 攻EV'+oe+(hb?' 有强化招':' 无强化招'), sole:false};
  // 规则3：既不满足 A/B 又不满足进攻门 → 一律稳健联防（既不满足消耗条件，不得再叫受队消耗）
  if(hasResist) return {land:'稳健联防', why:'非进攻配置，有抗性', sole:false};
  return {land:'稳健联防', why:'非进攻配置，耐久/防守站位（改名不删流派，不造空物种）', sole:false};
}

function scan(team,label){
  const wx=[], stall=[], pol322=[];
  const buildCount={};
  for(const s of ERDATA.species){
    let bs; try{bs=deriveBuilds(s,team)}catch(e){bs=[]}
    buildCount[String(s.id)]=bs.length;
    bs.forEach(b=>{
      const n=String(b.name||'');
      if(/增伤清场/.test(n)){ const r=wxSource(s,b); wx.push({id:s.id,zh:s.zh,name:n,role:b.roleTag,side:b.side,ev:b.ev&&b.ev.alloc,ids:kitIds(b),...r}); }
      if(/受队消耗/.test(n)){ const r=stallSource(s,b); stall.push({id:s.id,zh:s.zh,name:n,role:b.roleTag,side:b.side,ev:b.ev&&b.ev.alloc,ids:kitIds(b),cons:WEAR_MV.concat(PROTECT_MV).some(id=>kitIds(b).indexOf(id)>=0),...r}); }
      const it0=(b.it&&b.it[0]&&b.it[0][0])||'';
      if(it0.indexOf('弱点保险')>=0){ pol322.push({id:s.id,zh:s.zh,name:n,bulk:bulkOf(s),it:b.it&&b.it.map(x=>x[0]),ev:b.ev&&b.ev.alloc,role:b.roleTag}); }
    });
  }
  stall.forEach(r=>{ const sp=ERDATA.species.find(x=>String(x.id)===String(r.id)); r.route=routeNeither(sp,r,buildCount[String(r.id)]); });
  return {label,wx,stall,pol322};
}

const six=scan(allTeam,'六人队 allTeam=[26,65,96,80,37,208]');
const empty=scan([],'空队对照');

function wxSum(rows){
  const a=rows.filter(r=>r.a).length, b=rows.filter(r=>r.b).length, c=rows.filter(r=>r.c).length;
  const src=rows.filter(r=>r.source).length, nos=rows.filter(r=>!r.source);
  const land={}; nos.forEach(r=>{const k=rehearseOld(r); land[k]=(land[k]||0)+1;});
  const pre={}; rows.forEach(r=>pre[r.pre]=(pre[r.pre]||0)+1);
  // (c) 复核分档计数
  const verd={}; rows.forEach(r=>r.cRows.forEach(x=>verd[x.v]=(verd[x.v]||0)+1));
  return {total:rows.length,a,b,c,src,nos:nos.length,land,pre,verd};
}
function rehearseOld(r){ const s=ERDATA.species.find(x=>String(x.id)===String(r.id)); const off=offGate(s,r.ids,r.ev), hb=hasBoost(r.ids); if(off)return hb?'强化清场':'主力输出压制'; return '稳健联防'; }
function stallSum(rows){
  const A=rows.filter(r=>r.A).length, B=rows.filter(r=>r.B).length, both=rows.filter(r=>r.A&&r.B).length;
  const nei=rows.filter(r=>r.neither);
  const land={}; nei.forEach(r=>{const k=r.route.land; land[k]=(land[k]||0)+1;});
  return {total:rows.length,A,B,both,neither:nei.length,land};
}

const out=[];
out.push('=== v4.384 只读探针（返工版；未改引擎/文档；harness = v4.383 终局）===');
out.push('');
out.push('## 引擎真值招集（取自 index.html FUNC_MV / FUNC_MV_REC_EXT / TC_REC_B，id→名逐条列示）');
out.push('REC_MV 回复: '+REC_MV.map(id=>id+':'+mvZh(id)).join(' / '));
out.push('WEAR_MV 消耗: '+WEAR_MV.map(id=>id+':'+mvZh(id)).join(' / '));
out.push('PROTECT_MV 保命: '+PROTECT_MV.map(id=>id+':'+mvZh(id)).join(' / '));
out.push('HAZ_MV 钉子: '+HAZ_MV.map(id=>id+':'+mvZh(id)).join(' / '));
out.push('REM_MV 除钉: '+REM_MV.map(id=>id+':'+mvZh(id)).join(' / '));
out.push('BOOST 强化: '+BOOST.map(id=>id+':'+mvZh(id)).join(' / '));
out.push('注: 73 寄生种子归 WEAR 消耗侧（引擎 MV 标签=消耗/破受），不进 REC 回复侧；吸血招 202 终极吸取/409 吸取拳等在 REC_DRAIN。');
out.push('');
out.push('## 判据取舍说明');
out.push('口径：修复验收=六人队 allTeam=[26,65,96,80,37,208]；回归对照=空队 []，两份分列。');
out.push('探针一 (c)「吃到体系加成」按 id 语义复核，不做关键词黑名单兜底：先查 abiTags[id].out/def.cond 是否命中本体系条件词（晴天/雨天/沙暴/冰雹/青草场地/精神场地/薄雾场地/电气场地）；命中 out=进攻/速度加成(计 c)，命中 def=防御/耐久加成(不计进攻)；tag.im=属性免疫；再人工表覆盖 tagless 已知条目。通用类型增伤（猛火/猛草/适应力/皮肤等条件为 <1/3血 或无体系条件）不计入体系加成。雪隐8/沙隐8/雨幕987 属闪避，单列不计 c；冰冻之躯115/雨盘44 等回血单列；厚脂肪47 等减伤单列。');
out.push('探针二 (A) 回复手段：道具剩饭/黑色污泥，或特性 144 再生力/90 毒疗，或招组含 REC_MV 回复/吸血招。(B) 高耐久：bulkOf>=300 且招组含 WEAR_MV 消耗招(73 寄生种子/92 剧毒/261 磷火/174 诅咒/227 再来一次) 或 PROTECT_MV 保命招(164 替身/182 守住)。');
out.push('探针二 新路由（A、B 都不满足，裁定 3：既不满足消耗条件不得再叫受队消耗）：①免疫/抗性+≥1 防守向招→稳健联防；②进攻门三条件同时成立：≥2 非变化伤害招 且 攻/特攻 EV≥120 且 ≥1 本系/加成伤害招 → 有强化招落强化清场、无落主力输出压制；③不满足进攻门一律稳健联防（改名不删流派，不造空物种，唯一流派同样改落联防）。禁止把 252HP、伤害招不足/无本系的卡叫输出/清场。');
out.push('改动 A：261 磷火/174 诅咒/227 再来一次 已补进消耗招集；全库六人队命中 29/27/0，全部落在欺诈物反流/陀螺球重压流等其他流派名，受队消耗子集影响 0 条；跨流派名重判留 v4.385，本版不改欺诈反流/陀螺球命名。');
out.push('');
for(const R of [six,empty]){
  const w=wxSum(R.wx), st=stallSum(R.stall);
  out.push('## '+R.label);
  out.push('探针一 增伤清场 总数 '+w.total+'；自身有来源(去重) '+w.src+'；完全无来源 '+w.nos);
  out.push('  分条件(可重叠)：(a)自动体系 '+w.a+'；(b)自带开体系招 '+w.b+'；(c)特性/属性进攻或速度加成 '+w.c);
  out.push('  (c) 特性语义分档(命中条目次，可重叠): '+JSON.stringify(w.verd));
  out.push('  前缀分布: '+JSON.stringify(w.pre));
  out.push('  无来源预演落点(旧伤害路由): '+JSON.stringify(w.land));
  out.push('探针二 受队消耗 总数 '+st.total+'；(A)回复手段 '+st.A+'；(B)高耐久+消耗/保命招 '+st.B+'；A∩B '+st.both+'；两者都不满足 '+st.neither);
  out.push('  都不满足新路由落点: '+JSON.stringify(st.land));
  const p3=R.pol322;
  const g300=p3.filter(x=>x.bulk>=300), edge=p3.filter(x=>x.bulk>=270&&x.bulk<300);
  out.push('探针三 弱点保险322 首位 总数 '+p3.length+'；bulk>=300: '+g300.length+'（断言目标 0）；270-299 区间: '+edge.length);
  out.push('');
}

// 探针一 逐条（六人队）
out.push('=== 探针一 逐条：增伤清场（六人队）===');
six.wx.forEach(r=>out.push(`[${r.source?'有来源':'无来源'}|${r.pre}] #${r.id} ${r.zh} ${r.name} ${r.side}/${r.role} a=${r.a} b=${r.b} c=${r.c} EV=${JSON.stringify(r.ev)} ids=${r.ids.join('/')} ${r.how.join(';')}`));

// (c) 复核样本：旧描述兜底可能误判的非进攻特性逐条摘录
out.push('');
out.push('=== 探针一 (c) 特性语义复核样本（六人队，非进攻/速度加成逐条摘录描述）===');
const cSample={};
six.wx.forEach(r=>r.cRows.forEach(x=>{ if(x.v!=='进攻/速度加成'){ const k=x.id; if(!cSample[k])cSample[k]={id:x.id,name:x.name,v:x.v,note:x.note,desc:x.desc,cards:[]}; cSample[k].cards.push('#'+r.id+' '+r.zh); }}));
Object.values(cSample).forEach(x=>out.push(`${x.id} ${x.name} [${x.v}] ${x.note}｜描述: ${x.desc}｜命中卡: ${x.cards.slice(0,6).join('、')}`));

// 探针二 逐条：都不满足（六人队）新路由
out.push('');
out.push('=== 探针二 逐条：受队消耗 都不满足（六人队）新路由 ===');
six.stall.filter(r=>r.neither).forEach(r=>out.push(`#${r.id} ${r.zh} ${r.name} ${r.side}/${r.role} bulk=${r.bulk} EV=${JSON.stringify(r.ev)} ids=${r.ids.join('/')} → ${r.route.land}（${r.route.why}）`));

// 探针三 逐条（六人队）
out.push('');
out.push('=== 探针三 逐条：弱点保险322 首位（六人队）===');
six.pol322.forEach(r=>out.push(`bulk=${r.bulk} #${r.id} ${r.zh} ${r.name} ${r.role} it=${JSON.stringify(r.it)} EV=${JSON.stringify(r.ev)}`));

fs.writeFileSync(__dirname+'/out_v4384_probe.txt', out.join('\r\n'), 'utf8');
fs.writeFileSync(__dirname+'/_ev4384.json', JSON.stringify({
  sets:{REC_MV,WEAR_MV,PROTECT_MV,HAZ_MV,REM_MV,BOOST,REC_DRAIN},
  six:{wx:wxSum(six.wx),stall:stallSum(six.stall),wxRows:six.wx,stallRows:six.stall,pol322:six.pol322},
  empty:{wx:wxSum(empty.wx),stall:stallSum(empty.stall),wxRows:empty.wx,stallRows:empty.stall,pol322:empty.pol322}
}, null, 1), 'utf8');
console.log(out.join('\n'));
console.log('\n[written] out_v4384_probe.txt / _ev4384.json');
