# -*- coding: utf-8 -*-
"""v4.389 消耗类卡片一致性收口：字节级补丁（index.html）
R1 名称分流 / R2 骚扰消耗加满速度 / R3 零伤害招防守卡性格选侧。
只改 name / ev / nat，不动招组、道具、特性、候选、排序。
"""
import io, sys, hashlib

P = r'D:\game\elite-redux\index.html'
raw = io.open(P, 'r', encoding='utf-8', newline='').read()
before_len = len(raw.encode('utf-8'))
before_sha = hashlib.sha1(raw.encode('utf-8')).hexdigest().upper()

def must(old, new, tag):
    global raw
    n = raw.count(old)
    if n != 1:
        print('FAIL [%s] 命中 %d 次（要求 1）' % (tag, n)); sys.exit(1)
    raw = raw.replace(old, new, 1)
    print('OK   [%s]' % tag)

# ---- 1. 正则扩新名（两处：防守身份判定 / 睡觉持有判据） ----
must("var _v385DEF_NAME=/受队消耗|稳健联防|肉盾|减伤|属性免疫/;",
     "var _v385DEF_NAME=/受队消耗|骚扰消耗|耐久压制|稳健联防|肉盾|减伤|属性免疫/;",
     "R1-a _v385DEF_NAME 扩名")

must("var isStall=_v387STALL[String(s.id)]&&/受队消耗/.test(String(b.name||''));",
     "var isStall=_v387STALL[String(s.id)]&&/受队消耗|骚扰消耗|耐久压制/.test(String(b.name||''));",
     "R1-b 睡觉持有判据扩名")

# ---- 2. 收尾链最后一层插入 R1/R2/R3 ----
BLOCK = r'''  /* v4.389 消耗类卡片一致性收口（v4.388 收口后首个破例：修 #1509 超级耿鬼Y 引出的兜底路由事实错误）。
     R1 名称分流：名含「受队消耗」只保留 bulk≥BULK_HIGH，或 bulk≥BULK_MID 且有真回复（回血招/回复特性，道具不算）；
        不够格按实配伤害招条数分流：≤1 条 → 骚扰消耗；≥2 条 → 耐久压制。保留原前缀（如「顺风」）与 roleTag/side。
     R2 速度：名含「骚扰消耗」且基础速度≥SPEED_HIGH 而速度 EV 为 0 → EV 改 252HP/4特防/252速 + 加速性格。
     R3 性格：防守身份卡且实配零伤害招 → nat[0] 换实际投资项（特防向沉着/慎重，防御向大胆/淘气），EV 不动。
     本块是整条收尾链最后一层：只写 name/ev/nat，不动招组/道具/特性/候选/排序。自包作用域。 */
  try{
    var _v389REC_MV={105:1,202:1,234:1,235:1,236:1,303:1,355:1,409:1,156:1,456:1,532:1,631:1,72:1,71:1,837:1,73:1,135:1,208:1,275:1,392:1,622:1,744:1,915:1};
    var _v389REC_ABI={'144':1,'90':1};
    var _v389DEF_ROLE={'肉盾':1,'受队':1,'联防':1,'辅助':1};
    var _v389DEF_NAME=/受队消耗|骚扰消耗|耐久压制|稳健联防|肉盾|减伤|属性免疫/;
    function _v389Nat0(b){var n=b.nat;if(Array.isArray(n))return n[0]?String(n[0][0]||''):'';return String(n||'').split(',')[0].trim();}
    function _v389SetNat(b,name,why){
      if(!b.nat||!b.nat.length)b.nat=[];
      if(_v389Nat0(b)===name)return false;
      var hit=-1,i,e,n0;
      for(i=0;i<b.nat.length;i++){e=b.nat[i];n0=Array.isArray(e)?String(e[0]):String(e);if(n0===name){hit=i;break;}}
      if(hit>0){var keep=b.nat[hit];b.nat.splice(hit,1);b.nat.unshift(keep);return true;}
      b.nat.unshift([name,why||'']);
      if(b.nat.length>3)b.nat=b.nat.slice(0,3);
      return true;
    }
    out.forEach(function(b){
      if(!b||!b.name||!b.mv)return;
      if(b._v389Rename===undefined)b._v389Rename=null;
      if(b._v389Ev===undefined)b._v389Ev=null;
      if(b._v389Nat===undefined)b._v389Nat=null;
      var _nm=String(b.name);
      var _ids=(b.mv.main||[]).concat(b.mv.func||[]).map(function(x){return +x.id;});
      var _dmg=_ids.filter(function(id){var r=MV[id];return r&&r[4]!=='变化';}).length;
      var _bulk=(+s.base[0])+(+s.base[2])+(+s.base[4]);
      var _spd=+s.base[5],_atk=+s.base[1],_spa=+s.base[3];
      var _abiIds=(b.abi||[]).map(function(a){return +a.id;});
      var _rec=_ids.some(function(id){return _v389REC_MV[id];})||_abiIds.some(function(id){return _v389REC_ABI[String(id)];});
      var _hitR2=false;
      /* ---- R1 名称分流 ---- */
      if(_nm.indexOf('受队消耗')>=0){
        var _keepStall=(_bulk>=NEED_CFG.BULK_HIGH)||(_bulk>=NEED_CFG.BULK_MID&&_rec);
        if(!_keepStall){
          var _newNm=_nm.replace('受队消耗',(_dmg<=1?'骚扰消耗':'耐久压制'));
          b.name=_newNm;
          b._v389Rename=_nm+'→'+_newNm+'（bulk '+_bulk+( _rec?'，有真回复':'，无真回复')+'，实配伤害招 '+_dmg+' 条）';
          _nm=_newNm;
        }
      }
      /* ---- R2 骚扰消耗加满速度 ---- */
      if(_nm.indexOf('骚扰消耗')>=0&&_spd>=NEED_CFG.SPEED_HIGH){
        var _al=(b.ev&&b.ev.alloc)||[];
        if((+_al[5]||0)===0){
          var _old=(+_al[0]||0)+'/'+(+_al[1]||0)+'/'+(+_al[2]||0)+'/'+(+_al[3]||0)+'/'+(+_al[4]||0)+'/'+(+_al[5]||0);
          b.ev=b.ev||{};b.ev.alloc=[252,0,0,0,4,252];b.ev.summary='252HP / 4特防 / 252速';
          b._v389Ev=_old+'→252/0/0/0/4/252';
          var _acc=(_atk>_spa?'爽朗':'胆小');
          if(_v389SetNat(b,_acc,'+速度-'+(_atk>_spa?'攻击':'特攻')+'（骚扰消耗：速度种族 '+_spd+'，先手撒状态/封锁优先，速度 EV 拉满）'))b._v389Nat=b.nat[0][0];
          _hitR2=true;
        }
      }
      /* ---- R3 零伤害招防守卡性格选侧（R2 命中者已定加速性格，跳过） ---- */
      if(!_hitR2&&_dmg===0){
        var _role=String(b.roleTag||'');
        if(_v389DEF_ROLE[_role]||_v389DEF_NAME.test(_nm)){
          var _a2=(b.ev&&b.ev.alloc)||[];
          var _dv=+(_a2[2]||0),_sv=+(_a2[4]||0),_av=+(_a2[1]||0),_as=+(_a2[3]||0);
          var _cutAtk=(_av<=_as);   /* 减项必须落在低投入的一侧，避免「减攻但攻 EV 满投」自相矛盾 */
          var _tn='',_why='';
          if(_sv>_dv){
            _tn=(_cutAtk?'沉着':'慎重');
            _why='+特防-'+(_cutAtk?'攻击':'特攻')+'（实配零伤害招、特防 EV '+_sv+' 为主投资项：性格正项给真实投资项，减项避开已投资项）';
          }else if(_dv>_sv){
            _tn=(_cutAtk?'大胆':'淘气');
            _why='+防御-'+(_cutAtk?'攻击':'特攻')+'（实配零伤害招、防御 EV '+_dv+' 为主投资项：性格正项给真实投资项，减项避开已投资项）';
          }
          if(_tn&&_v389SetNat(b,_tn,_why))b._v389Nat=b.nat[0][0];
        }
      }
    });
  }catch(eV4389){eV4389.name}
'''

BLOCK = BLOCK.replace('\n', '\r\n')   # 文件是 CRLF，插入块必须同源，否则 bare LF 破基线

must("  }catch(eV4387D){eV4387D.name}\r\n  return out;}",
     "  }catch(eV4387D){eV4387D.name}\r\n" + BLOCK + "  return out;}",
     "R1/R2/R3 收尾块插入")

io.open(P, 'w', encoding='utf-8', newline='').write(raw)
after_len = len(raw.encode('utf-8'))
print('bytes %d -> %d (Δ%+d)' % (before_len, after_len, after_len - before_len))
print('sha1 before', before_sha)
print('sha1 after ', hashlib.sha1(raw.encode('utf-8')).hexdigest().upper())
crlf = raw.count('\r\n'); lf = raw.count('\n') - crlf
print('CRLF %d / bare LF %d' % (crlf, lf))
