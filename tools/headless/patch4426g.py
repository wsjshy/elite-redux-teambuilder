# -*- coding: utf-8 -*-
# v4.426 patch g：findTeammates 答案卡强制角色（强化/输出）改全池硬扫描，保证强化手落可见 5 槽
import io, sys
P = r"D:\game\elite-redux\index.html"
with io.open(P, "rb") as f:
    b = f.read()

old = (
"    var _best=null,_bestVal=-1e9;\r\n"
"    for(var _mi=0;_mi<fin2.length&&_mi<80;_mi++){\r\n"
"      if(takenIdx[_mi])continue;\r\n"
"      var _r=fin2[_mi];\r\n"
"      var _roles=mateRoleOf(_r.s,wxSys);\r\n"
"      var _free=_roles.filter(function(x){return !byRole[x]});\r\n"
"      if(_forceOut){var _fo=_free.filter(function(x){return x==='输出'});if(_fo.length)_free=_fo}\r\n"
"      if(_forceSweep){var _fs=_free.filter(function(x){return x==='强化'});if(_fs.length)_free=_fs}\r\n"
"      if(!_free.length)continue; /* 角色全占用 → 留给同定位候选 */\r\n"
"      var _cg=0;\r\n"
"      try{\r\n"
"        var _tm=[{s:s,core:1}].concat(mainPicks.map(function(p){return {s:p.s}}), [{s:_r.s}]);\r\n"
"        _cg=scanCombos(_tm).length;\r\n"
"      }catch(ecg){_cg=0}\r\n"
"      /* v4.35 P1-1 增量联防校验：新增「共用弱点(≥2人弱) / 盲区」→ 降权；补掉 → 加分（正向打分，不剔除） */\r\n"
"      var _tal1=_tmTally(_members.concat([_r.s]));\r\n"
"      var _dSw=_teamSw(_tal1)-_sw0,_dBl=_teamBlind(_tal1)-_bl0;\r\n"
"      var _syn=-(2.2*Math.max(0,_dSw))-(1.6*Math.max(0,_dBl))+(3.0*Math.max(0,-_dSw))+(2.0*Math.max(0,-_dBl));\r\n"
"      /* v4.35 P1-2 同核心跨流派队友复用惩罚（AP5 换皮治理：同核不同流派不再机械共用同一支队） */\r\n"
"      var _cross=((_usedByCore[_r.s.id]&&_usedByCore[_r.s.id]!==_thisKey)?_USED_PEN:0);\r\n"
"      var _val=_r.score+comboScoreOf(_cg)+_syn-_cross;\r\n"
"      if(_val>_bestVal){_bestVal=_val;_best={r:_r,mi:_mi,free:_free,cg:_cg}}\r\n"
"    }\r\n"
"    if(!_best)break;\r\n"
"    var _freeB=_best.free;\r\n"
"    _freeB.sort(function(a,b){return ((_prio[b]||1)-(_prio[a]||1))});\r\n"
"    var _pri=_freeB[0];\r\n"
"    try{_best.r.priRole=_pri}catch(e9){}\r\n"
"    try{_best.r.comboGain=_best.cg}catch(ecg2){}\r\n"
"    byRole[_pri]=1;takenIdx[_best.mi]=1;\r\n"
"    mainPicks.push(_best.r);\r\n"
"  }\r\n"
)

new = (
"    /* v4.426：强制角色（强化/输出）改为全池硬扫描——只接受带该「空闲角色」的候选，保证可见 5 格内\r\n"
"       真有窗口兑现者（强化手常因综合分排在 top80 之外，旧软收窄会落空）；全池无候选才回退常规贪心。 */\r\n"
"    var _wantRole=_forceSweep?'强化':(_forceOut?'输出':'');\r\n"
"    function _scan4426(want,cap){\r\n"
"      var bst=null,bstVal=-1e9;\r\n"
"      for(var mi=0;mi<fin2.length&&mi<cap;mi++){\r\n"
"        if(takenIdx[mi])continue;\r\n"
"        var rr=fin2[mi];\r\n"
"        var roles=mateRoleOf(rr.s,wxSys);\r\n"
"        var free=roles.filter(function(x){return !byRole[x]});\r\n"
"        if(want){\r\n"
"          var fw=free.filter(function(x){return x===want});\r\n"
"          if(!fw.length)continue; /* 强制槽：无该空闲角色直接跳过 → 硬落位 */\r\n"
"          free=fw;\r\n"
"        }\r\n"
"        if(!free.length)continue; /* 角色全占用 → 留给同定位候选 */\r\n"
"        var cg=0;\r\n"
"        try{\r\n"
"          var tm=[{s:s,core:1}].concat(mainPicks.map(function(p){return {s:p.s}}), [{s:rr.s}]);\r\n"
"          cg=scanCombos(tm).length;\r\n"
"        }catch(ecg){cg=0}\r\n"
"        /* v4.35 P1-1 增量联防校验：新增「共用弱点(≥2人弱) / 盲区」→ 降权；补掉 → 加分（正向打分，不剔除） */\r\n"
"        var tal1=_tmTally(_members.concat([rr.s]));\r\n"
"        var dSw=_teamSw(tal1)-_sw0,dBl=_teamBlind(tal1)-_bl0;\r\n"
"        var syn=-(2.2*Math.max(0,dSw))-(1.6*Math.max(0,dBl))+(3.0*Math.max(0,-dSw))+(2.0*Math.max(0,-dBl));\r\n"
"        /* v4.35 P1-2 同核心跨流派队友复用惩罚（AP5 换皮治理：同核不同流派不再机械共用同一支队） */\r\n"
"        var cross=((_usedByCore[rr.s.id]&&_usedByCore[rr.s.id]!==_thisKey)?_USED_PEN:0);\r\n"
"        var val=rr.score+comboScoreOf(cg)+syn-cross;\r\n"
"        if(val>bstVal){bstVal=val;bst={r:rr,mi:mi,free:free,cg:cg}}\r\n"
"      }\r\n"
"      return bst;\r\n"
"    }\r\n"
"    var _best=_wantRole?_scan4426(_wantRole,fin2.length):null;\r\n"
"    if(!_best)_best=_scan4426('',80);\r\n"
"    if(!_best)break;\r\n"
"    var _freeB=_best.free;\r\n"
"    _freeB.sort(function(a,b){return ((_prio[b]||1)-(_prio[a]||1))});\r\n"
"    var _pri=_freeB[0];\r\n"
"    try{_best.r.priRole=_pri}catch(e9){}\r\n"
"    try{_best.r.comboGain=_best.cg}catch(ecg2){}\r\n"
"    byRole[_pri]=1;takenIdx[_best.mi]=1;\r\n"
"    mainPicks.push(_best.r);\r\n"
"  }\r\n"
)

n = b.count(old.encode('utf-8'))
if n != 1:
    print("ANCHOR COUNT =", n, "expected 1"); sys.exit(1)
b = b.replace(old.encode('utf-8'), new.encode('utf-8'))
with io.open(P, "wb") as f:
    f.write(b)
print("patch4426g OK, bytes", len(b))
