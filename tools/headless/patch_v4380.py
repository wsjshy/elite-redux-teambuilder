# -*- coding: utf-8 -*-
"""v4.380 引擎补丁：速攻手队伍级辅助铁律扩到 钉子/戏法空间/双墙。
文本级补丁（io.open newline=''，新增行 CRLF），锚点 = v4.379 生产块收尾。"""
import io, os, hashlib

ROOT = r'D:\game\elite-redux'
P = os.path.join(ROOT, 'index.html')
txt = io.open(P, encoding='utf-8', newline='').read()

def counts(s):
    crlf = s.count('\r\n')
    bare = s.count('\n') - crlf
    return crlf, bare

print('before CRLF/bareLF:', counts(txt))

ANCHOR = "      }catch(eV4379){eV4379.name}"
assert txt.count(ANCHOR) == 1, txt.count(ANCHOR)

block = r'''      /* v4.380 队伍级辅助铁律（钉子/戏法空间/墙，与 v4.379 同构）：速≥100 的进攻流派不自己花回合
         铺钉/开空间；队伍级辅助交队友，无队友则不依赖该体系（去钉子/空间招→补攻击/补盲/游击）。
         墙：单张自身同吃减伤，属保命手段保留并注明；同流派 ≥2 张只留第一张，其余按补槽池替换。
         例外：恶作剧之心（变化招先制）；自身特性自动开体系者；score99 机制保留流派。 */
      try{
        var _v10sp=+((s.base||[])[5]||0),_v10side=String(b.side||''),_v10role=String(b.roleTag||'');
        var _v10off=(_v10side==='物理'||_v10side==='特殊'||_v10side==='双刀')&&(_v10role==='增伤'||_v10role==='输出'||_v10role==='强化');
        var _v10prank=!!(b.abi&&b.abi[0]&&/恶作剧之心/.test(b.abi[0].n));
        var _v10auto=[];try{_v10auto=ownAutoSys(s)||[]}catch(eV10a){_v10auto=[]}
        /* v4.378 教训：per-build 标记变量块开头显式赋初值（undefined 守卫，不覆盖前序块已写值） */
        if(b.hazTeamRemoved===undefined)b.hazTeamRemoved=null;
        if(b.hazTeamNew===undefined)b.hazTeamNew=null;
        if(b.trSelfRemoved===undefined)b.trSelfRemoved=null;
        if(b.trSelfNew===undefined)b.trSelfNew=null;
        if(b.wallSelfKept===undefined)b.wallSelfKept=false;
        if(b.wallTeamRemoved===undefined)b.wallTeamRemoved=null;
        if(b.wallTeamNew===undefined)b.wallTeamNew=null;
        if(b.score!==99&&_v10sp>=100&&_v10off&&!_v10prank&&!_v10auto.length){
          var _v10main=b.mv.main||[];
          var _v10HAZ=[191,390,446,564],_v10TR=433,_v10WALL=[113,115,657],_v10PIV=[369,521];
          var _v10TWO=[566];   /* 两回合蓄力（潜灵奇袭 Phantom Force），不进速攻手补槽 */
          var _v10sd=(_v10side==='双刀')?'双刀':((_v10side==='物理')?'物理':'特殊');
          var _v10pool=[];try{_v10pool=pickAttacks(s,_v10sd,40,_v10role)}catch(eV10p){_v10pool=[]}
          var _v10used={};_v10main.forEach(function(x){_v10used[''+x.id]=1});
          var _v10ty={};_v10main.forEach(function(x){var _m=MV[x.id];if(_m)_v10ty[_m[3]]=1});
          var _v10charge=/飞翔|挖洞|潜水|日光束|弹跳|自由落体|破坏光线|终极冲击|蓄力|影子之力|潜灵奇袭/;
          var _v10vanish=/vanishes|next turn|recharg|must rest/i;
          function _v10isCharge(id,_m){
            if(_v10TWO.indexOf(+id)>-1)return true;
            if(!_m)return false;
            return _v10charge.test(_m[1])||_v10vanish.test(String(_m[10]||''));
          }
          function _v10pickOne(){
            var _r=null;
            for(var _i=0;_i<_v10pool.length;_i++){var _o=_v10pool[_i];
              if(!_o||_v10used[''+_o.id]||_v10PIV.indexOf(+_o.id)<0)continue;_r=_o;break}
            if(!_r)for(var _i2=0;_i2<_v10pool.length;_i2++){var _o2=_v10pool[_i2];
              if(!_o2||_v10used[''+_o2.id]||_v10ty[_o2.ty])continue;var _M2=MV[_o2.id];
              if(_M2&&(+_M2[5]||0)>=70&&(+_M2[6]||0)>=90&&!_v10isCharge(_o2.id,_M2)){_r=_o2;break}}
            if(!_r)for(var _j=0;_j<_v10pool.length;_j++){var _o3=_v10pool[_j];
              if(!_o3||_v10used[''+_o3.id])continue;var _M3=MV[_o3.id];
              if(_M3&&!_v10isCharge(_o3.id,_M3)){_r=_o3;break}}
            return _r}
          function _v10fill(_idx,_why){
            var _r=_v10pickOne();
            if(_r){_v10main[_idx]={id:+_r.id,kind:mvKindOf(+_r.id),tag:'补盲',why:[_why]};
              _v10used[''+_r.id]=1;_v10ty[_r.ty]=1;return _r}
            return null}
          /* ① 钉子（main 槽） */
          for(var _v10h=0;_v10h<_v10main.length;_v10h++){
            var _v10hid=+_v10main[_v10h].id;
            if(_v10HAZ.indexOf(_v10hid)>-1){
              var _rh=_v10fill(_v10h,'速攻手回合金贵，撒钉交给队友 → 换补盲/游击');
              if(_rh){b.hazTeamRemoved=_v10hid;b.hazTeamNew=+_rh.id}
            }
          }
          /* ① 钉子（func 槽，可能 undefined）：移除并向 main 补一条攻击招 */
          var _v10func=b.mv.func||[];
          for(var _v10f=_v10func.length-1;_v10f>=0;_v10f--){
            var _v10fid=+_v10func[_v10f].id;
            if(_v10HAZ.indexOf(_v10fid)>-1){
              _v10func.splice(_v10f,1);
              var _v10rf=_v10pickOne();
              if(_v10rf){_v10main.push({id:+_v10rf.id,kind:mvKindOf(+_v10rf.id),tag:'补盲',why:['速攻手回合金贵，撒钉交给队友 → 换补盲/游击']});
                _v10used[''+_v10rf.id]=1;_v10ty[_v10rf.ty]=1;b.hazTeamRemoved=_v10fid;b.hazTeamNew=+_v10rf.id}
            }
          }
          /* ② 戏法空间 433（补槽池为攻击招，天然排除 433 本身） */
          for(var _v10t=0;_v10t<_v10main.length;_v10t++){
            var _v10tid=+_v10main[_v10t].id;
            if(_v10tid===_v10TR){
              var _rt=_v10fill(_v10t,'速度种族≥100 开戏法空间＝自己先变最后出手，负收益 → 换补盲');
              if(_rt){b.trSelfRemoved=_v10tid;b.trSelfNew=+_rt.id}
            }
          }
          /* ③ 墙：第一张保留并注明保命；其余按补槽池替换 */
          var _v10wallSeen=0;
          for(var _v10w=0;_v10w<_v10main.length;_v10w++){
            var _v10wid=+_v10main[_v10w].id;
            if(_v10WALL.indexOf(_v10wid)>-1){
              _v10wallSeen++;
              if(_v10wallSeen===1){
                var _vw=_v10main[_v10w];_vw.why=(_vw.why||[]).concat(['自身同吃减伤，保留作保命']);
                b.wallSelfKept=true;
              }else{
                var _rw=_v10fill(_v10w,'同流派已带保命墙，第二张墙属队伍级辅助 → 换补盲/游击');
                if(_rw){b.wallSelfKept=true;b.wallTeamRemoved=_v10wid;b.wallTeamNew=+_rw.id}
              }
            }
          }
          /* ④ 去「钉子」冠名前缀（仅在钉子已被移除时）；desc 同步清理 */
          if(b.hazTeamRemoved!=null){
            var _v10nm=String(b.name||'');
            if(_v10nm.indexOf('钉子')===0){
              b.name=_v10nm.slice(2);
              b.desc=String(b.desc||'').replace('钉子','');
              b.namedByMoves=true;b.nameMismatch='钉子→（去队伍级辅助前缀，不自己铺钉）';
            }
          }
        }
      }catch(eV4380){eV4380.name}'''

block = block.replace('\n', '\r\n')
new = txt.replace(ANCHOR, ANCHOR + '\r\n' + block, 1)

# 版本号：index.html
o1 = "var ER_ENGINE_VER='v4.379';"
n1 = "var ER_ENGINE_VER='v4.380';"
assert new.count(o1) == 1, new.count(o1)
new = new.replace(o1, n1, 1)

print('after CRLF/bareLF:', counts(new))
io.open(P, 'w', encoding='utf-8', newline='').write(new)
print('index.html new bytes:', len(new.encode('utf-8')))
print('index.html SHA1:', hashlib.sha1(open(P, 'rb').read()).hexdigest().upper())

# package.json
PJ = os.path.join(ROOT, 'package.json')
pj = io.open(PJ, encoding='utf-8', newline='').read()
o2 = '"version": "4.379.0"'
n2 = '"version": "4.380.0"'
assert pj.count(o2) == 1, pj.count(o2)
pj = pj.replace(o2, n2, 1)
io.open(PJ, 'w', encoding='utf-8', newline='').write(pj)
print('package.json -> 4.380.0')
