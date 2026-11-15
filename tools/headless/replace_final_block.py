# -*- coding: utf-8 -*-
import io, os
P = r'D:\game\elite-redux\index.html'
txt = io.open(P, encoding='utf-8', newline='').read()
def counts(s):
    c=s.count('\r\n');return c,s.count('\n')-c
print('before:', counts(txt))
START="      /* v4.379 队伍级辅助铁律：速攻手（速≥100）的进攻流派不手动开天气/场地——"
END="      }catch(eV4379){eV4379.name}"
si=txt.index(START); ei=txt.index(END, si)+len(END)
assert txt.count(START)==1 and txt.count(END)==1
newblock = r'''      /* v4.379 队伍级辅助铁律：速攻手（速≥100）的进攻流派不手动开天气/场地——
         队伍级辅助由队友提供；无队友提供则不依赖该体系（去手动招→补攻击/补盲→换常驻特性→去体系名）。
         例外：恶作剧之心（变化招先制，不占正常回合）；自身特性即自动开体系者（无需手动）。
         同时替换残留晴免蓄力招（日光束/日光刃），并按特性描述（非仅靠体系表）识别天气依赖。 */
      try{
        var _v9sp=+((s.base||[])[5]||0),_v9side=String(b.side||''),_v9role=String(b.roleTag||'');
        var _v9off=(_v9side==='物理'||_v9side==='特殊'||_v9side==='双刀')&&(_v9role==='增伤'||_v9role==='输出'||_v9role==='强化');
        var _v9prank=!!(b.abi&&b.abi[0]&&/恶作剧之心/.test(b.abi[0].n));
        var _v9auto=[];try{_v9auto=ownAutoSys(s)||[]}catch(eV9a){_v9auto=[]}
        if(_v9sp>=100&&_v9off&&!_v9prank&&!_v9auto.length){
          var _v9main=b.mv.main,_v9wi=-1,_v9setupId=null;
          for(var _v9w=0;_v9w<_v9main.length;_v9w++){var _v9id=+_v9main[_v9w].id;
            if(_v9id===240||_v9id===241||_v9id===201||_v9id===258||_v9id===580||_v9id===581||_v9id===604||_v9id===641){_v9wi=_v9w;_v9setupId=_v9id;break}}
          if(_v9wi>-1){
            var _v9sd=(_v9side==='双刀')?'双刀':((_v9side==='物理')?'物理':'特殊');
            var _v9pool=[];try{_v9pool=pickAttacks(s,_v9sd,40,_v9role)}catch(eV9p){_v9pool=[]}
            var _v9used={};_v9main.forEach(function(x){_v9used[''+x.id]=1});
            var _v9ty={};_v9main.forEach(function(x){var _m=MV[x.id];if(_m)_v9ty[_m[3]]=1});
            var _v9charge=/飞翔|挖洞|潜水|日光束|弹跳|自由落体|破坏光线|终极冲击|蓄力|影子之力/;
            function _v9pickOne(){var _r=null;
              for(var _i=0;_i<_v9pool.length;_i++){var _o=_v9pool[_i];
                if(!_o||_v9used[''+_o.id]||_v9ty[_o.ty])continue;var _M=MV[_o.id];
                if(_M&&(+_M[5]||0)>=70&&(+_M[6]||0)>=90&&!_v9charge.test(_M[1])){_r=_o;break}}
              if(!_r)for(var _j=0;_j<_v9pool.length;_j++){var _o2=_v9pool[_j];
                if(!_o2||_v9used[''+_o2.id])continue;var _M2=MV[_o2.id];
                if(_M2&&!_v9charge.test(_M2[1])){_r=_o2;break}}
              return _r}
            function _v9fill(_idx){var _r=_v9pickOne();
              if(_r){_v9main[_idx]={id:+_r.id,kind:mvKindOf(+_r.id),tag:'补盲',
                why:['速攻手回合金贵：不手动开天气/场地（队伍级辅助交队友，无队友则不依赖），此槽改补攻击/补盲']};
                _v9used[''+_r.id]=1;_v9ty[_r.ty]=1;return true}
              return false}
            _v9fill(_v9wi);b.weatherSelfRemoved=true;
            for(var _v9k=0;_v9k<_v9main.length;_v9k++){var _v9sid=+_v9main[_v9k].id;
              if(_v9sid===76||_v9sid===632){_v9fill(_v9k)}}
            var _v9words={240:['雨'],241:['晴'],201:['沙'],258:['雪','冰雹'],580:['场地'],581:['场地'],604:['场地'],641:['场地']};
            function _v9abiInfo(_id){return ERDATA.abilities[_id]}
            function _v9constPart(_d){return /对方无法.*先制|免疫|反弹|抵挡|出场时|入场时|吸引|替身/.test(_d)}
            function _v9wxDep(_id){var _a=_v9abiInfo(_id);if(!_a)return false;var _d=String(_a[3]||'');
              for(var _n=0;_n<(_v9words[_v9setupId]||[]).length;_n++){var _w=_v9words[_v9setupId][_n];
                if(_d.indexOf(_w)>-1&&/(提升|提高|增至|×|倍|回复|治愈|闪避|速度|威力|能力|伤害|减半|招式)/.test(_d)){
                  if(_v9constPart(_d))return false;return true}}
              return false}
            function _v9badAbi(_id){var _a=_v9abiInfo(_id);if(!_a)return false;var _d=String(_a[3]||'');
              if(/双打/.test(_d)&&/同伴/.test(_d))return true;return _v9wxDep(_id)}
            if(b.abi&&b.abi[0]){
              var _v9abn=String(b.abi[0].n),_v9abid=b.abi[0].id;
              var _v9dep=null,_v9set=null,_v9sete=null;
              try{_v9dep=abiSysOf(_v9abn)}catch(e1){}
              try{_v9set=abiSetOf(_v9abn)}catch(e2){}
              try{_v9sete=abiSetExt(_v9abn)}catch(e3){}
              if((_v9dep&&!_v9set&&!_v9sete)||_v9wxDep(_v9abid)){
                var _v9rank=[];try{_v9rank=pickAbiFor(s,_v9side,_v9role,{})}catch(e4){_v9rank=[]}
                var _v9pick=null;
                for(var _v9r=0;_v9rank&&_v9r<_v9rank.length;_v9r++){var _c=_v9rank[_v9r];
                  if(abiSysOf(_c.n)||abiSetOf(_c.n)||abiSetExt(_c.n))continue;
                  if(_v9badAbi(_c.id))continue;_v9pick=_c;break}
                if(_v9pick){
                  b.abi[0]={n:_v9pick.n,id:_v9pick.id,sc:_v9pick.sc,
                    why:['无队友提供天气/场地 → 原「'+_v9abn+'」依赖该体系会空转，换常驻特性「'+_v9pick.n+'」'];
                  b.abiSwappedForWeather=_v9abn}
              }
            }
            var _v9nm=String(b.name||''),_v9ch=_v9nm.charAt(0);
            if('雨晴沙雪'.indexOf(_v9ch)>-1){
              b.name=_v9nm.replace(_v9ch,'');
              b.desc=String(b.desc||'').replace(_v9ch+'天','');
              b.namedByMoves=true;b.nameMismatch=_v9ch+'→（去体系前缀，不手动开）'}
          }
        }
      }catch(eV4379){eV4379.name}'''
newblock=newblock.replace('\n','\r\n')
txt2=txt[:si]+newblock+txt[ei:]
print('after:', counts(txt2))
io.open(P,'w',encoding='utf-8',newline='').write(txt2)
print('bytes:', len(txt2.encode('utf-8')))
