# -*- coding: utf-8 -*-
"""v4.381 引擎补丁：顺风(366) 纳入收口，但只收脆皮（isGlassCannon：速≥100 且 bulkOf<270）。
中/高耐久进攻手保留不动。文本级补丁（io.open newline=''，新增行 CRLF），锚点 = v4.380 生产块收尾。"""
import io, os, hashlib

ROOT = r'D:\game\elite-redux'
P = os.path.join(ROOT, 'index.html')
txt = io.open(P, encoding='utf-8', newline='').read()

def counts(s):
    crlf = s.count('\r\n')
    bare = s.count('\n') - crlf
    return crlf, bare

print('before CRLF/bareLF:', counts(txt))

ANCHOR = "      }catch(eV4380){eV4380.name}"
assert txt.count(ANCHOR) == 1, txt.count(ANCHOR)

block = r'''      /* v4.381 队伍级辅助铁律（顺风 366，与 v4.379/v4.380 同构）：只收脆皮（isGlassCannon：速≥100
         且耐久三角<270）。脆皮回合金贵，不自己花回合开顺风，速度由队友顺风/耐久位补足；中/高耐久
         进攻手（bulkOf≥270）扛得住开顺风那一回合，保留不动。例外：恶作剧之心；自身特性自动开体系；
         score99 机制保留流派。换招后无速度来源（无速度强化招且速度种族<110）的流派不删，why 注明
         速度前提由队友顺风提供。 */
      try{
        var _v11sp=+((s.base||[])[5]||0),_v11side=String(b.side||''),_v11role=String(b.roleTag||'');
        var _v11off=(_v11side==='物理'||_v11side==='特殊'||_v11side==='双刀')&&(_v11role==='增伤'||_v11role==='输出'||_v11role==='强化');
        var _v11prank=!!(b.abi&&b.abi[0]&&/恶作剧之心/.test(b.abi[0].n));
        var _v11auto=[];try{_v11auto=ownAutoSys(s)||[]}catch(eV11a){_v11auto=[]}
        /* v4.378 教训：per-build 标记变量块开头显式赋初值（undefined 守卫，不覆盖前序块已写值） */
        if(b.tailwindTeamRemoved===undefined)b.tailwindTeamRemoved=null;
        if(b.tailwindTeamNew===undefined)b.tailwindTeamNew=null;
        if(b.tailwindByTeammate===undefined)b.tailwindByTeammate=false;
        if(b.score!==99&&_v11sp>=100&&_v11off&&!_v11prank&&!_v11auto.length&&isGlassCannon(s)){
          var _v11main=b.mv.main||[];
          var _v11TW=366,_v11PIV=[369,521];
          var _v11TWO=[566];   /* 两回合蓄力（潜灵奇袭 Phantom Force），不进速攻手补槽 */
          var _v11FAINT=[120,153,262,730,760];   /* 自爆·退场标签：换上去即倒下，不进速攻手补槽 */
          var _v11BOOST=[349,483,504,187,526];   /* 龙之舞/蝶舞/破壳/腹鼓/自我激励：速度型强化招 */
          var _v11sd=(_v11side==='双刀')?'双刀':((_v11side==='物理')?'物理':'特殊');
          var _v11pool=[];try{_v11pool=pickAttacks(s,_v11sd,40,_v11role)}catch(eV11p){_v11pool=[]}
          var _v11func0=b.mv.func||[];
          var _v11used={};_v11main.concat(_v11func0).forEach(function(x){_v11used[''+x.id]=1});
          var _v11ty={};_v11main.concat(_v11func0).forEach(function(x){var _m=MV[x.id];if(_m)_v11ty[_m[3]]=1});
          var _v11charge=/飞翔|挖洞|潜水|日光束|弹跳|自由落体|破坏光线|终极冲击|蓄力|影子之力|潜灵奇袭/;
          var _v11vanish=/vanishes|next turn|recharg|must rest/i;
          function _v11isCharge(id,_m){
            if(_v11TWO.indexOf(+id)>-1)return true;
            if(_v11FAINT.indexOf(+id)>-1)return true;
            if(!_m)return false;
            var _tg=_m[11]||[];
            if(Array.isArray(_tg)&&_tg.indexOf('自爆·退场')>=0)return true;
            return _v11charge.test(_m[1])||_v11vanish.test(String(_m[10]||''));
          }
          function _v11pickOne(){
            var _r=null;
            for(var _i=0;_i<_v11pool.length;_i++){var _o=_v11pool[_i];
              if(!_o||_v11used[''+_o.id]||_v11PIV.indexOf(+_o.id)<0)continue;_r=_o;break}
            if(!_r)for(var _i2=0;_i2<_v11pool.length;_i2++){var _o2=_v11pool[_i2];
              if(!_o2||_v11used[''+_o2.id]||_v11ty[_o2.ty])continue;var _M2=MV[_o2.id];
              if(_M2&&(+_M2[5]||0)>=70&&(+_M2[6]||0)>=90&&!_v11isCharge(_o2.id,_M2)){_r=_o2;break}}
            if(!_r)for(var _j=0;_j<_v11pool.length;_j++){var _o3=_v11pool[_j];
              if(!_o3||_v11used[''+_o3.id])continue;var _M3=MV[_o3.id];
              if(_M3&&!_v11isCharge(_o3.id,_M3)){_r=_o3;break}}
            return _r}
          function _v11fill(_idx,_why){
            var _r=_v11pickOne();
            if(_r){_v11main[_idx]={id:+_r.id,kind:mvKindOf(+_r.id),tag:'补盲',why:[_why]};
              _v11used[''+_r.id]=1;_v11ty[_r.ty]=1;return _r}
            return null}
          /* 顺风（main 槽） */
          var _v11repIdx=-1;
          for(var _v11h=0;_v11h<_v11main.length;_v11h++){
            var _v11hid=+_v11main[_v11h].id;
            if(_v11hid===_v11TW){
              var _rh=_v11fill(_v11h,'脆皮不自己花回合开顺风，速度由队友顺风/耐久位补足 → 换补盲/游击');
              if(_rh){b.tailwindTeamRemoved=_v11TW;b.tailwindTeamNew=+_rh.id;_v11repIdx=_v11h}
            }
          }
          /* 顺风（func 槽，可能 undefined）：移除并向 main 补一条攻击招 */
          var _v11func=b.mv.func||[];
          for(var _v11f=_v11func.length-1;_v11f>=0;_v11f--){
            var _v11fid=+_v11func[_v11f].id;
            if(_v11fid===_v11TW){
              _v11func.splice(_v11f,1);
              var _v11rf=_v11pickOne();
              if(_v11rf){_v11main.push({id:+_v11rf.id,kind:mvKindOf(+_v11rf.id),tag:'补盲',why:['脆皮不自己花回合开顺风，速度由队友顺风/耐久位补足 → 换补盲/游击']});
                _v11used[''+_v11rf.id]=1;_v11ty[_v11rf.ty]=1;b.tailwindTeamRemoved=_v11fid;b.tailwindTeamNew=+_v11rf.id;_v11repIdx=_v11main.length-1}
            }
          }
          /* 速度来源核查：无速度型强化招且速度种族<110 → 注明速度前提由队友顺风提供（流派保留，不删） */
          var _v11hasBoost=_v11main.some(function(x){return _v11BOOST.indexOf(+x.id)>-1});
          if(b.tailwindTeamRemoved!=null&&!_v11hasBoost&&_v11sp<110){
            b.tailwindByTeammate=true;
            if(_v11repIdx>=0){var _vw2=_v11main[_v11repIdx];if(_vw2)_vw2.why=(_vw2.why||[]).concat(['速度前提由队友顺风提供（自身无速度强化招、速度种族<110）'])}
          }
          /* 去「顺风」冠名前缀（仅在顺风已被移除时）；desc 同步清理 */
          if(b.tailwindTeamRemoved!=null){
            var _v11nm=String(b.name||'');
            if(_v11nm.indexOf('顺风')===0){
              b.name=_v11nm.slice(2);
              b.desc=String(b.desc||'').replace('顺风','');
              b.namedByMoves=true;b.nameMismatch='顺风→（去队伍级辅助前缀，不自己开顺风）';
            }
          }
        }
      }catch(eV4381){eV4381.name}'''

block = block.replace('\n', '\r\n')
new = txt.replace(ANCHOR, ANCHOR + '\r\n' + block, 1)

# 版本号：index.html
o1 = "var ER_ENGINE_VER='v4.380';"
n1 = "var ER_ENGINE_VER='v4.381';"
assert new.count(o1) == 1, new.count(o1)
new = new.replace(o1, n1, 1)

print('after CRLF/bareLF:', counts(new))
io.open(P, 'w', encoding='utf-8', newline='').write(new)
print('index.html new bytes:', len(new.encode('utf-8')))
print('index.html SHA1:', hashlib.sha1(open(P, 'rb').read()).hexdigest().upper())

# package.json
PJ = os.path.join(ROOT, 'package.json')
pj = io.open(PJ, encoding='utf-8', newline='').read()
o2 = '"version": "4.380.0"'
n2 = '"version": "4.381.0"'
assert pj.count(o2) == 1, pj.count(o2)
pj = pj.replace(o2, n2, 1)
io.open(PJ, 'w', encoding='utf-8', newline='').write(pj)
print('package.json -> 4.381.0')
