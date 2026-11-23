# -*- coding: utf-8 -*-
# v4.427 patch b：双墙辅助流准入排除玻璃大炮（删除 GC 高速开墙路径）+ 回退 _fastScreen 哨兵
import io, sys
P = r"D:\game\elite-redux\index.html"
with io.open(P, "rb") as f:
    b = f.read()
def S(x): return x.replace('\n', '\r\n').encode('utf-8')

START = S("    /* v4.426 双墙流（真双墙准入）。两条合法路径，且雪源必须在卡内自洽：\n")
END = S("\n  }catch(e){}\n  /* v4.62 A：组合流派卡副信息补全")
i = b.find(START)
if i < 0:
    print("START not found"); sys.exit(1)
if b.count(START) != 1:
    print("START count", b.count(START)); sys.exit(1)
j = b.find(END, i)
if j < 0:
    print("END not found"); sys.exit(1)

NEW = S(
"""    /* v4.427 双墙流（真双墙准入 + 辅助定位准入）。两条合法路径，且雪源必须在卡内自洽：
       ① 极光幕657：自带雪系特性（id 集）→ 显式带该特性；
       ② 普通双墙：同时会光墙113+反射壁115。
       **玻璃大炮不开墙**（v4.427，用户裁定）：它的速度与火力本身就是推队资本，占两格开墙等于自废一半战力；
       开墙该由耐久/辅助型承担（与钉子流既有 !isGlassCannon 同一纪律）。玻璃大炮的正确位置是强化推队手，
       墙由队友给它开——v4.426 的「GC 高速开墙」配置属角色颠倒，整段删除。
       统一光之黏土（5→8 回合）。 */
    var _wlLearn=learnOf(s)||[];
    var _wl113=_wlLearn.indexOf(113)>-1,_wl115=_wlLearn.indexOf(115)>-1;
    var _wlSnowIds=[117,666,929,291,348,870,493];
    var _wlSnowName=null;
    (s.abis||[]).concat(s.inns||[]).forEach(function(n){
      if(_wlSnowName)return;var _id=null;try{_id=abiIdByZhOrEn(n)}catch(eW){}
      if(_id!==null&&_wlSnowIds.indexOf(+_id)>-1)_wlSnowName=n;});
    /* 极光幕只在雪天生效；引擎 v4.395 会清掉非雪系手的手动冰雹258，
       故仅当物种自带雪系特性时才走极光幕（无特性则冰雹被清、657 成死招）。 */
    var _wlVeil=_wlLearn.indexOf(657)>-1&&_wlSnowName!==null;
    var _wlDual=_wl113&&_wl115;
    var _wlPass=_mvNameAll(s,['接棒','接力',' Baton'])[0];
    if(!isGlassCannon(s)&&(_wlVeil||_wlDual)){
      var _wlSide=coreSide(s);
      /* 墙/雪源槽：雪特性极光幕=[657]；普通双墙=[113,115] */
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
      var _wlRest=_wlPick([rec,stabId,269,86,164,_wlPass]);
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
        if(id===657){
          _wlMain.push({id:657,kind:'wall',tag:'墙',
            why:['极光幕：雪天同时减半物理/特殊伤害（光之黏土 5→8 回合）']});
        }else{
          _wlMain.push({id:id,kind:'wall',tag:'墙',
            why:['双墙体系减伤窗口（光之黏土 5→8 回合）']});
        }});
      _wlRest.forEach(function(id){
        var _k=mvKindOf(id);
        _wlMain.push({id:id,kind:_k,tag:_k==='rec'?'续航':(_k==='attack'?'补位':'功能'),
          why:['耐久开墙：站场布墙，墙内安全强化']});});
      var _wlNat=(_wlSide==='特殊'?'大胆':'淘气');
      var _wlEv=[252,0,252,0,4,0];
      /* 雪特性路径显式带特性，保证 v4.395b 雪判据命中；其余路径 abi 留空由补全块填 */
      var _wlAbi=null;
      if(_wlVeil&&_wlSnowName!==null){
        var _sid=+abiIdByZhOrEn(_wlSnowName);
        _wlAbi=[{id:_sid,n:_wlSnowName,why:['自带雪源，极光幕无需冰雹即可生效']}];
      }
      res.push({name:'双墙辅助流',roleTag:'受队',side:_wlSide,score:3,breakingRoute:'组合',
        abi:_wlAbi,
        mv:{main:_wlMain},
        nat:[[_wlNat,'耐久开墙手：防御向性格站场布墙']],
        ev:{alloc:_wlEv,template:'耐久',summary:'HP252/物防252'},
        it:[['光之黏土','光墙/反射壁/极光幕回合延长（5→8，与双墙成套）']],
        basis:[{k:'combo',txt:'组合 双墙：耐久手站场布墙→墙内强化手安全强化→推队'}]});
    }""")

b = b[:i] + NEW + b[j:]

# ---- 回退 4 处 _fastScreen 哨兵（v4.426 新增，GC 路径删除后成死条件）----
reps = [
 (S("""    var wall=(tag==='肉盾'||tag==='受队'||tag==='辅助'||tag==='联防'||side==='辅助');
    if(b._fastScreen){
      /* v4.426：高速玻璃大炮开墙手保留速攻 EV/性格，不强制耐久分配 */
    }else if(wall||!atkAny){"""),
  S("""    var wall=(tag==='肉盾'||tag==='受队'||tag==='辅助'||tag==='联防'||side==='辅助');
    if(wall||!atkAny){""")),
 (S("      else if(_p===0&&_q===0&&!b._fastScreen)b.side='辅助';"),
  S("      else if(_p===0&&_q===0)b.side='辅助';")),
 (S("      if(b._fastScreen)return;   /* v4.426：高速开墙手 EV/性格已正确，跳过防守身份重算 */\n"),
  S("")),
 (S("      if(!_hitR2&&_dmg===0&&!b._fastScreen){"),
  S("      if(!_hitR2&&_dmg===0){")) ]
for o, n in reps:
    c = b.count(o)
    if c != 1:
        print("fastScreen anchor count", c, o[:60]); sys.exit(1)
    b = b.replace(o, n)

with io.open(P, "wb") as f:
    f.write(b)
print("patch4427b OK, bytes", len(b))
