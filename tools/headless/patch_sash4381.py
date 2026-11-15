# -*- coding: utf-8 -*-
"""v4.381 并入：气势披带(287) 死绑高耐久收口。
判据：披带价值 = 满血时真可能被一击带走。bulk≥300 不作首位，改续航件；270–299 边缘档保留并注明；
bulk<270 不动。例外：#151 梦幻 imposter_anchor（三选之一，披带仅保命备选）。
门控落点：① counter_mirror 显式 it 赋值；② 组合流派兜底 it 赋值；③ itemApplies 表级门控；
④ finalize 末尾中央兜底块（覆盖其余一切入口，幂等）。文本级补丁（io.open newline=''，新增行 CRLF）。"""
import io, os, hashlib

ROOT = r'D:\game\elite-redux'
P = os.path.join(ROOT, 'index.html')
txt = io.open(P, encoding='utf-8', newline='').read()

def counts(s):
    crlf = s.count('\r\n')
    bare = s.count('\n') - crlf
    return crlf, bare

print('before CRLF/bareLF:', counts(txt))

# ① counter_mirror（反伤后手流）显式派发点按耐久分档
OLD_CM = "    b.it=[['气势披带','吃下致命一击仍能反伤一次（反伤流标准配置）'],['剩饭','站场续航（耐久核的主食）'],['防岩果','防被克制属性一击带走']];"
NEW_CM = ("    var _v12cmBulk=(bb[0]||0)+(bb[2]||0)+(bb[4]||0);\r\n"
          "    if(_v12cmBulk>=300){\r\n"
          "      b.it=[['剩饭','站场续航（耐久核主食；披带仅满血抗一击，高耐久不必赌一次保命）'],['凸凸头盔','物攻手碰瓷反伤（耐久核站场反伤配套）'],['防岩果','防被克制属性一击带走']];\r\n"
          "    }else if(_v12cmBulk>=270){\r\n"
          "      b.it=[['气势披带','吃下致命一击仍能反伤一次；仅满血生效，边缘耐久才值得'],['剩饭','站场续航（耐久核的主食）'],['防岩果','防被克制属性一击带走']];\r\n"
          "    }else{\r\n"
          "      b.it=[['气势披带','吃下致命一击仍能反伤一次（反伤流标准配置）'],['剩饭','站场续航（耐久核的主食）'],['防岩果','防被克制属性一击带走']];\r\n"
          "    }")
assert txt.count(OLD_CM) == 1, ('CM', txt.count(OLD_CM))
txt = txt.replace(OLD_CM, NEW_CM, 1)

# ② 组合流派兜底（替身强化等非 tank）按耐久分档
OLD_FB = "    if(!b.it.length)b.it=isTank?[['剩饭','站场续航保钉子/墙']]:[['气势披带','替身/强化保命一回合']];"
NEW_FB = ("    if(!b.it.length){var _v12fbBulk=0;try{_v12fbBulk=bulkOf(s)||0}catch(eV12f){_v12fbBulk=(+(s.base||[])[0]||0)+(+(s.base||[])[2]||0)+(+(s.base||[])[4]||0)};\r\n"
          "      if(isTank)b.it=[['剩饭','站场续航保钉子/墙']];\r\n"
          "      else if(_v12fbBulk>=300)b.it=[['剩饭','站场续航（高耐久不必赌满血一次保命）']];\r\n"
          "      else if(_v12fbBulk>=270)b.it=[['气势披带','替身/强化保命一回合；仅满血生效，边缘耐久才值得']];\r\n"
          "      else b.it=[['气势披带','替身/强化保命一回合']];\r\n"
          "    }")
assert txt.count(OLD_FB) == 1, ('FB', txt.count(OLD_FB))
txt = txt.replace(OLD_FB, NEW_FB, 1)

# ③ itemApplies 表级门控：bulk≥300 不进披带候选池（imposter 三选走 buildItem 置顶，不经此门）
OLD_AP = "  if(zh==='气球')return tg.weak.indexOf('地面')>-1||!(['飞行','电'].some(function(t){return s.t1===t||s.t2===t}));"
NEW_AP = ("  if(zh==='气势披带'){var _v12apBulk=0;try{_v12apBulk=bulkOf(s)||0}catch(eV12a){_v12apBulk=0};if(_v12apBulk>=300)return false;}\r\n"
          + OLD_AP)
assert txt.count(OLD_AP) == 1, ('AP', txt.count(OLD_AP))
txt = txt.replace(OLD_AP, NEW_AP, 1)

# ④ finalize 末尾中央兜底块：覆盖其余一切派发入口，幂等
ANCHOR = "      }catch(eV4381){eV4381.name}"
assert txt.count(ANCHOR) == 1, ('ANCHOR', txt.count(ANCHOR))

block = r'''      /* v4.381 披带收口（与顺风收口同版）：气势披带价值 = 满血时真可能被一击带走。
         bulk≥300 真肉盾不作首位 → 反伤后手流给 剩饭+凸凸头盔，其余（替身强化等）给 剩饭；
         270–299 边缘档保留，why 注明仅满血生效；bulk<270 不动。例外 #151 梦幻 imposter_anchor
         （变身者道具三选：围巾/披带/脱壳壳，披带只作保命备选）。中央兜底，覆盖全部派发入口。 */
      try{
        var _v12bulk=0;try{_v12bulk=bulkOf(s)||0}catch(eV12b){_v12bulk=(+(s.base||[])[0]||0)+(+(s.base||[])[2]||0)+(+(s.base||[])[4]||0)}
        var _v12it=b.it||[];
        if(b.sashReplaced===undefined)b.sashReplaced=null;
        if(b.sashOld===undefined)b.sashOld=null;
        if(b.sashNew===undefined)b.sashNew=null;
        if(b.sashEdgeKept===undefined)b.sashEdgeKept=false;
        var _v12lead=_v12it[0]?String(_v12it[0][0]):'';
        var _v12Imp=String(s.id)==='151'&&String(b.mechRw||'')==='imposter_anchor';
        if(_v12lead==='气势披带'&&!_v12Imp){
          if(_v12bulk>=300){
            var _v12Counter=/反伤/.test(String(b.name||''))||String(b.mechRw||'')==='counter_mirror';
            var _v12rest=_v12Counter?['剩饭','站场续航（耐久核主食；披带仅满血抗一击，高耐久不必赌一次保命）']:['剩饭','站场续航（高耐久不必赌满血一次保命，改续航件）'];
            var _v12helm=_v12Counter?['凸凸头盔','物攻手碰瓷反伤（耐久核站场反伤配套）']:null;
            var _v12rest2=_v12it.filter(function(x){return String(x[0])!=='气势披带'&&String(x[0])!=='剩饭'});
            var _v12new=[_v12rest];
            if(_v12helm)_v12new.push(_v12helm);
            _v12rest2.forEach(function(x){_v12new.push(x)});
            b.it=_v12new.slice(0,3);
            b.sashReplaced=true;b.sashOld='气势披带';b.sashNew=String(b.it[0][0]);
          }else if(_v12bulk>=270){
            var _v12why=String(_v12it[0][1]||'');
            if(_v12why.indexOf('仅满血生效')<0)_v12it[0][1]=_v12why+'；仅满血生效，边缘耐久才值得';
            b.sashEdgeKept=true;
          }
        }
      }catch(eV4381b){eV4381b.name}'''

block = block.replace('\n', '\r\n')
txt = txt.replace(ANCHOR, ANCHOR + '\r\n' + block, 1)

print('after CRLF/bareLF:', counts(txt))
io.open(P, 'w', encoding='utf-8', newline='').write(txt)
print('index.html new bytes:', len(txt.encode('utf-8')))
print('index.html SHA1:', hashlib.sha1(open(P, 'rb').read()).hexdigest().upper())
