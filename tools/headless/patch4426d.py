# -*- coding: utf-8 -*-
# v4.426 第四批：修正极光幕路径——雪源必须在卡内自洽（雪特性显式带/无特性则带冰雹258），
# 否则 v4.395b 会把 657 判死招。整段替换 comboBuildsOf 墙块。
import io

PATH = r'D:\game\elite-redux\index.html'
t = io.open(PATH, encoding='utf-8', newline='').read()
orig_len = len(t.encode('utf-8'))

def C(s):
    return s.replace('\r\n', '\n').replace('\n', '\r\n')

old = """    /* v4.426 双墙流（真双墙准入）：需同时会光墙113+反射壁115，或雪天极光幕657；
       玻璃大炮=高速开墙配置（满速/胆小），耐久种=耐久开墙配置（防御性格/耐久EV）；统一光之黏土。
       旧模板「学到任一面墙即生成、只带一面、剩饭、对坦克一律淘气」属名实不符，整段替换。 */
    var _wlLearn=learnOf(s)||[];
    var _wl113=_wlLearn.indexOf(113)>-1,_wl115=_wlLearn.indexOf(115)>-1;
    var _wlSnowIds=[117,666,929,291,348,870,493];
    var _wlSnowAbi=(s.abis||[]).concat(s.inns||[]).some(function(n){
      var _id=null;try{_id=abiIdByZhOrEn(n)}catch(eW){}
      return _id!==null&&_wlSnowIds.indexOf(+_id)>-1;});
    var _wlSnowOk=_wlSnowAbi||_wlLearn.indexOf(258)>-1;
    var _wlVeil=_wlLearn.indexOf(657)>-1&&_wlSnowOk;
    var _wlDual=_wl113&&_wl115;
    var _wlPass=_mvNameAll(s,['接棒','接力',' Baton'])[0];
    if(_wlVeil||_wlDual){
      var _wlGc=isGlassCannon(s),_wlSide=coreSide(s);
      var _wlWallIds=_wlVeil?[657]:[113,115];
      var _wlUsed={};_wlWallIds.forEach(function(id){_wlUsed[id]=1});
      function _wlPick(seq){
        var o=[];
        for(var _i=0;_i<seq.length;_i++){
          var id=seq[_i];
          if(id==null||_wlUsed[id]||_wlLearn.indexOf(id)<0)continue;
          _wlUsed[id]=1;o.push(id);
          if(o.length>=4-_wlWallIds.length)break;
        }
        return o;
      }
      var _wlSeq=_wlGc?[269,86,164,stabId,rec,_wlPass]
                      :[rec,stabId,269,86,164,_wlPass];
      var _wlRest=_wlPick(_wlSeq);
      /* 兜底：功能槽不足时从学习集补任意未用招（优先攻击招，再变化招） */
      if(_wlRest.length<4-_wlWallIds.length){
        var _wlAtt=[],_wlSt=[];
        _wlLearn.forEach(function(id){
          if(_wlUsed[id]||isBannedBattleMv(id))return;
          var m=MV[id];if(!m)return;
          if(m[4]!=='变化')_wlAtt.push(id);else _wlSt.push(id);});
        _wlRest=_wlRest.concat(_wlPick(_wlAtt)).concat(_wlPick(_wlSt));
      }
      var _wlMain=[];
      _wlWallIds.forEach(function(id){_wlMain.push({id:id,kind:'wall',tag:'墙',
        why:['双墙体系减伤窗口（光之黏土 5→8 回合；极光幕需雪天）']});});
      _wlRest.forEach(function(id){
        var _k=mvKindOf(id);
        _wlMain.push({id:id,kind:_k,tag:_k==='rec'?'续航':(_k==='attack'?'补位':'功能'),
          why:[_wlGc?'高速开墙：先于对手布双墙，随后交强化手推队':'耐久开墙：站场布双墙，墙内安全强化']});});
      var _wlNat=_wlGc?'胆小':(_wlSide==='特殊'?'大胆':'淘气');
      var _wlEv=_wlGc?(_wlSide==='特殊'?[4,0,0,252,0,252]:[4,252,0,0,0,252])
                      :[252,0,252,0,4,0];
      var _wlTpl=_wlGc?'速攻':'耐久';
      res.push({name:'双墙辅助流',roleTag:'受队',side:_wlSide,score:3,breakingRoute:'组合',
        _fastScreen:_wlGc,   /* v4.426：玻璃大炮高速开墙手哨兵，下游保留速攻 EV/性格，不强制耐久模板 */
        mv:{main:_wlMain},
        nat:[[_wlNat,_wlGc?'高速开墙手：满速先手布双墙':'耐久开墙手：防御向性格站场']],
        ev:{alloc:_wlEv,template:_wlTpl,summary:_wlGc?('速度252/'+(_wlSide==='特殊'?'特攻252':'物攻252')):'HP252/物防252'},
        it:[['光之黏土','光墙/反射壁/极光幕回合延长（5→8，与双墙成套）']],
        basis:[{k:'combo',txt:'组合 双墙：先手布双墙→墙内强化手安全强化→推队'}]});
    }
"""

new = """    /* v4.426 双墙流（真双墙准入）。两条合法路径，且雪源必须在卡内自洽：
       ① 极光幕657：有雪系特性（id 集）→ 显式带该特性；否则必须同时带冰雹258 召唤雪天。
       ② 普通双墙：同时会光墙113+反射壁115。
       玻璃大炮=高速开墙（满速/胆小），耐久种=耐久开墙（防御性格/耐久EV）；统一光之黏土。
       旧模板「学到任一面墙即生成、只带一面、剩饭、对坦克一律淘气」属名实不符，整段替换。 */
    var _wlLearn=learnOf(s)||[];
    var _wl113=_wlLearn.indexOf(113)>-1,_wl115=_wlLearn.indexOf(115)>-1;
    var _wlSnowIds=[117,666,929,291,348,870,493];
    var _wlSnowName=null;
    (s.abis||[]).concat(s.inns||[]).forEach(function(n){
      if(_wlSnowName)return;var _id=null;try{_id=abiIdByZhOrEn(n)}catch(eW){}
      if(_id!==null&&_wlSnowIds.indexOf(+_id)>-1)_wlSnowName=n;});
    var _wlHail=_wlLearn.indexOf(258)>-1;
    var _wlVeil=_wlLearn.indexOf(657)>-1&&(_wlSnowName!==null||_wlHail);
    var _wlDual=_wl113&&_wl115;
    var _wlPass=_mvNameAll(s,['接棒','接力',' Baton'])[0];
    if(_wlVeil||_wlDual){
      var _wlGc=isGlassCannon(s),_wlSide=coreSide(s);
      /* 墙/雪源槽：雪特性极光幕=[657]；无特性则 [657,258]；普通双墙=[113,115] */
      var _wlWallIds=_wlVeil?(_wlSnowName!==null?[657]:[657,258]):[113,115];
      var _wlUsed={};_wlWallIds.forEach(function(id){_wlUsed[id]=1});
      function _wlPick(seq){
        var o=[];
        for(var _i=0;_i<seq.length;_i++){
          var id=seq[_i];
          if(id==null||_wlUsed[id]||_wlLearn.indexOf(id)<0)continue;
          _wlUsed[id]=1;o.push(id);
          if(o.length>=4-_wlWallIds.length)break;
        }
        return o;
      }
      var _wlSeq=_wlGc?[269,86,164,stabId,rec,_wlPass]
                      :[rec,stabId,269,86,164,_wlPass];
      var _wlRest=_wlPick(_wlSeq);
      /* 兜底：功能槽不足时从学习集补任意未用招（优先攻击招，再变化招） */
      if(_wlRest.length<4-_wlWallIds.length){
        var _wlAtt=[],_wlSt=[];
        _wlLearn.forEach(function(id){
          if(_wlUsed[id]||isBannedBattleMv(id))return;
          var m=MV[id];if(!m)return;
          if(m[4]!=='变化')_wlAtt.push(id);else _wlSt.push(id);});
        _wlRest=_wlRest.concat(_wlPick(_wlAtt)).concat(_wlPick(_wlSt));
      }
      var _wlMain=[];
      _wlWallIds.forEach(function(id){
        if(id===258){
          _wlMain.push({id:258,kind:'weather',tag:'开雪',
            why:['冰雹召唤雪天，极光幕657仅在雪天生效（与极光幕成套携带）']});
        }else if(id===657){
          _wlMain.push({id:657,kind:'wall',tag:'墙',
            why:['极光幕：雪天同时减半物理/特殊伤害（光之黏土 5→8 回合）']});
        }else{
          _wlMain.push({id:id,kind:'wall',tag:'墙',
            why:['双墙体系减伤窗口（光之黏土 5→8 回合）']});
        }});
      _wlRest.forEach(function(id){
        var _k=mvKindOf(id);
        _wlMain.push({id:id,kind:_k,tag:_k==='rec'?'续航':(_k==='attack'?'补位':'功能'),
          why:[_wlGc?'高速开墙：先于对手布墙，随后交强化手推队':'耐久开墙：站场布墙，墙内安全强化']});});
      var _wlNat=_wlGc?'胆小':(_wlSide==='特殊'?'大胆':'淘气');
      var _wlEv=_wlGc?(_wlSide==='特殊'?[4,0,0,252,0,252]:[4,252,0,0,0,252])
                      :[252,0,252,0,4,0];
      var _wlTpl=_wlGc?'速攻':'耐久';
      /* 雪特性路径显式带特性，保证 v4.395b 雪判据命中；其余路径 abi 留空由补全块填 */
      var _wlAbi=null;
      if(_wlVeil&&_wlSnowName!==null){
        var _sid=+abiIdByZhOrEn(_wlSnowName);
        _wlAbi=[{id:_sid,n:_wlSnowName,why:['自带雪源，极光幕无需冰雹即可生效']}];
      }
      res.push({name:'双墙辅助流',roleTag:'受队',side:_wlSide,score:3,breakingRoute:'组合',
        _fastScreen:_wlGc,   /* v4.426：玻璃大炮高速开墙手哨兵，下游保留速攻 EV/性格，不强制耐久模板 */
        abi:_wlAbi,
        mv:{main:_wlMain},
        nat:[[_wlNat,_wlGc?'高速开墙手：满速先手布墙':'耐久开墙手：防御向性格站场']],
        ev:{alloc:_wlEv,template:_wlTpl,summary:_wlGc?('速度252/'+(_wlSide==='特殊'?'特攻252':'物攻252')):'HP252/物防252'},
        it:[['光之黏土','光墙/反射壁/极光幕回合延长（5→8，与双墙成套）']],
        basis:[{k:'combo',txt:'组合 双墙：先手布墙→墙内强化手安全强化→推队'}]});
    }
"""

old = C(old); new = C(new)
assert t.count(old) == 1, 'anchor count=%d' % t.count(old)
t = t.replace(old, new)
io.open(PATH, 'w', encoding='utf-8', newline='').write(t)
new_len = len(t.encode('utf-8'))
print('OK wall block rewrite; bytes %d -> %d (delta %+d)' % (orig_len, new_len, new_len - orig_len))
