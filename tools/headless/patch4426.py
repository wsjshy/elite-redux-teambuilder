# -*- coding: utf-8 -*-
# v4.426 字节级补丁：双墙流真双墙准入 + 强化推队手保证 + 版本号
import io

PATH = r'D:\game\elite-redux\index.html'
t = io.open(PATH, encoding='utf-8', newline='').read()
orig_len = len(t.encode('utf-8'))

def C(s):
    return s.replace('\r\n', '\n').replace('\n', '\r\n')

def patch(old, new, label, count=1):
    global t
    old = C(old); new = C(new)
    n = t.count(old)
    assert n == count, 'ANCHOR FAIL [%s] count=%d' % (label, n)
    t = t.replace(old, new)
    print('OK', label)

# ============ 1. comboBuildsOf 墙块重写 ============
old1 = """    /* 双墙流：反射壁/光墙 + 长接/接力 + 本系输出 */
    var wall=_mvNameAll(s,['反射壁','光墙'])[0];
    var pass=_mvNameAll(s,['接棒','接力',' Baton'])[0];
    if(wall&&stabId){
      res.push({name:'双墙辅助流',roleTag:'受队',side:coreSide(s),score:3,breakingRoute:'组合',
        mv:{main:[{id:wall,kind:'wall',tag:'墙',why:['反射壁/光墙减伤窗口']},
                 {id:pass||wall,kind:'support',tag:'辅助',why:[pass?'接棒传递强化窗口':'双墙后转输出']},
                 {id:stabId,kind:'attack',tag:'本系',why:['墙内本系安全输出']},
                 {id:rec||wall,kind:'rec',tag:'续航',why:['站场保墙']}]},
        basis:[{k:'combo',txt:'组合 双墙：开墙减伤→安全输出/接棒传递'}]});
    }
"""

new1 = """    /* v4.426 双墙流（真双墙准入）：需同时会光墙113+反射壁115，或雪天极光幕657；
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
        mv:{main:_wlMain},
        nat:[[_wlNat,_wlGc?'高速开墙手：满速先手布双墙':'耐久开墙手：防御向性格站场']],
        ev:{alloc:_wlEv,template:_wlTpl,summary:_wlGc?('速度252/'+(_wlSide==='特殊'?'特攻252':'物攻252')):'HP252/物防252'},
        it:[['光之黏土','光墙/反射壁/极光幕回合延长（5→8，与双墙成套）']],
        basis:[{k:'combo',txt:'组合 双墙：先手布双墙→墙内强化手安全强化→推队'}]});
    }
"""
patch(old1, new1, 'comboBuildsOf wall block')

# ============ 2. NEED_KINDS 新增 sweep（接在 fill 之后） ============
old2 = """   dims:[['D6',2],['D4',2],['D2',2],['D11',1],['D8',1],['D9',1],['D14',1],['D1',1]]}
};
"""
new2 = """   dims:[['D6',2],['D4',2],['D2',2],['D11',1],['D8',1],['D9',1],['D14',1],['D1',1]]},
 /* v4.426：双墙核心的窗口受益者——带强化招的进攻手，墙内安全强化后推队。
    复用构建期 _ER_BOOST_ROLE（与 mateRoleOf 同源），不另立判据。 */
 sweep:{kind:'profile',label:function(){return '强化推队手（墙窗口受益者）'},role:'带强化招的进攻手：墙内安全强化后推队',
   why:function(){return '双墙开墙核心需要强化手兑现窗口价值'},
   gate:function(t,cx){
     if(!(_ER_BOOST_ROLE&&_ER_BOOST_ROLE[t.id]))return '';
     var a=atkBest(t);
     if(a>=NEED_CFG.POWER_OK)return '强化招+力度 '+a+'（墙内强化推队）';
     if(a>=95)return '可强化输出（力度 '+a+'）';
     return ''},
   dims:[['D4',3],['D2',2],['D6',1]]}
};
"""
patch(old2, new2, 'NEED_KINDS sweep')

# ============ 3. needList 核心会开墙时加 sweep ============
old3 = """  if(p.fn.tr)add('trset',3);
  else if(p.slow&&p.ok)add('trset',4);   /* 低速重炮核心：空间由队友提供 */
  if(p.fn.tr||(p.slow&&p.ok))add('truse',3);  /* 空间打手位：低速加分、中速不达标低分但**不剔除**（零硬门） */
"""
new3 = """  if(p.fn.tr)add('trset',3);
  else if(p.slow&&p.ok)add('trset',4);   /* 低速重炮核心：空间由队友提供 */
  if(p.fn.tr||(p.slow&&p.ok))add('truse',3);  /* 空间打手位：低速加分、中速不达标低分但**不剔除**（零硬门） */
  /* v4.426：核心会开墙（光墙/反射壁/极光幕）→ 必须有强化推队手继承窗口 */
  if(hasAny(learnC(core),FUNC_MV.wall))add('sweep',5);
"""
patch(old3, new3, 'needList sweep')

# ============ 4. 答案卡骨架强制强化槽 ============
old4 = """    var _forceOut=(mainPicks.length===4&&!_coreOff&&!byRole['输出']);
    var _best=null,_bestVal=-1e9;
"""
new4 = """    var _forceOut=(mainPicks.length===4&&!_coreOff&&!byRole['输出']);
    /* v4.426：核心会开墙且尚无强化角色 → 第 4 槽强制「强化」（窗口兑现者），
       与 _forceOut 同型，仅在有候选时收窄角色，无候选则回退不阻断。 */
    var _forceSweep=(hasAny(learnC(s),FUNC_MV.wall)&&mainPicks.length===3&&!byRole['强化']);
    var _best=null,_bestVal=-1e9;
"""
patch(old4, new4, 'forceSweep flag')

old5 = """      if(_forceOut){var _fo=_free.filter(function(x){return x==='输出'});if(_fo.length)_free=_fo}
      if(!_free.length)continue; /* 角色全占用 → 留给同定位候选 */
"""
new5 = """      if(_forceOut){var _fo=_free.filter(function(x){return x==='输出'});if(_fo.length)_free=_fo}
      if(_forceSweep){var _fs=_free.filter(function(x){return x==='强化'});if(_fs.length)_free=_fs}
      if(!_free.length)continue; /* 角色全占用 → 留给同定位候选 */
"""
patch(old5, new5, 'forceSweep filter')

# ============ 5. 版本号（index.html 内仅 ER_ENGINE_VER；标题不含版本，footer 读该变量） ============
patch("var ER_ENGINE_VER='v4.425';", "var ER_ENGINE_VER='v4.426';", 'ER_ENGINE_VER')

io.open(PATH, 'w', encoding='utf-8', newline='').write(t)
new_len = len(t.encode('utf-8'))
print('index bytes %d -> %d (delta %+d)' % (orig_len, new_len, new_len - orig_len))
