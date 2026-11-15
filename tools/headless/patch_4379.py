# -*- coding: utf-8 -*-
import io, os
ROOT = r'D:\game\elite-redux'
P = os.path.join(ROOT, 'index.html')
txt = io.open(P, encoding='utf-8', newline='').read()

def counts(s):
    crlf = s.count('\r\n')
    bare = s.count('\n') - crlf
    return crlf, bare
print('before CRLF/bareLF:', counts(txt))

ANCHOR = "      try{evNatureLinkV437(s,b)}catch(e5){}   /* v4.37：S1~S4 联动权威收口（道具/配招已定稿；幂等） */"
assert txt.count(ANCHOR) == 1, txt.count(ANCHOR)

block = r'''      /* v4.379 队伍级辅助铁律：速攻手（速≥100）的进攻流派不手动开天气/场地——
         队伍级辅助由队友提供；无队友提供则不依赖该体系（去手动招→补攻击/补盲→换常驻特性→去体系名）。
         例外：恶作剧之心（变化招先制，不占正常回合）；自身特性即自动开体系者（无需手动，本就不会进此分支）。 */
      try{
        var _v9sp=+((s.base||[])[5]||0),_v9side=String(b.side||''),_v9role=String(b.roleTag||'');
        var _v9off=(_v9side==='物理'||_v9side==='特殊'||_v9side==='双刀')&&(_v9role==='增伤'||_v9role==='输出');
        var _v9prank=!!(b.abi&&b.abi[0]&&/恶作剧之心/.test(b.abi[0].n));
        var _v9auto=[];try{_v9auto=ownAutoSys(s)||[]}catch(eV9a){_v9auto=[]}
        if(_v9sp>=100&&_v9off&&!_v9prank&&!_v9auto.length){
          var _v9main=b.mv.main,_v9wi=-1;
          for(var _v9w=0;_v9w<_v9main.length;_v9w++){
            var _v9id=+_v9main[_v9w].id;
            if(_v9id===240||_v9id===241||_v9id===201||_v9id===258||_v9id===580||_v9id===581||_v9id===604||_v9id===641){_v9wi=_v9w;break}
          }
          if(_v9wi>-1){
            var _v9used={};_v9main.forEach(function(x){_v9used[''+x.id]=1});
            var _v9ty={};_v9main.forEach(function(x){var _m=MV[x.id];if(_m)_v9ty[_m[3]]=1});
            var _v9sd=(_v9side==='双刀')?'双刀':((_v9side==='物理')?'物理':'特殊');
            var _v9pool=[];try{_v9pool=pickAttacks(s,_v9sd,40,_v9role)}catch(eV9p){_v9pool=[]}
            var _v9charge=/飞翔|挖洞|潜水|日光束|弹跳|自由落体|破坏光线|终极冲击|蓄力|影子之力/,_v9rep=null;
            for(var _v9i=0;_v9i<_v9pool.length;_v9i++){var _v9o=_v9pool[_v9i];
              if(!_v9o||_v9used[''+_v9o.id]||_v9ty[_v9o.ty])continue;
              var _v9m=MV[_v9o.id];if(!_v9m)continue;
              if((+_v9m[5]||0)>=70&&(+_v9m[6]||0)>=90&&!_v9charge.test(_v9m[1])){_v9rep=_v9o;break}}
            if(!_v9rep)for(var _v9j=0;_v9j<_v9pool.length;_v9j++){var _v9o2=_v9pool[_v9j];
              if(!_v9o2||_v9used[''+_v9o2.id])continue;
              var _v9m2=MV[_v9o2.id];if(_v9m2&&!_v9charge.test(_v9m2[1])){_v9rep=_v9o2;break}}
            if(_v9rep){
              _v9main[_v9wi]={id:+_v9rep.id,kind:mvKindOf(+_v9rep.id),tag:'补盲',
                why:['速攻手回合金贵：不手动开天气/场地（队伍级辅助交队友，无队友则不依赖该体系），此槽改补攻击/补盲招']};
              b.weatherSelfRemoved=true;
            }
            if(b.abi&&b.abi[0]){
              var _v9abn=String(b.abi[0].n),_v9dep=null,_v9set=null,_v9sete=null;
              try{_v9dep=abiSysOf(_v9abn)}catch(eV9d){}
              try{_v9set=abiSetOf(_v9abn)}catch(eV9s){}
              try{_v9sete=abiSetExt(_v9abn)}catch(eV9se){}
              if(_v9dep&&!_v9set&&!_v9sete){
                var _v9rank=[];try{_v9rank=pickAbiFor(s,_v9side,_v9role,{})}catch(eV9ab){_v9rank=[]}
                var _v9pick=null;
                for(var _v9k=0;_v9k<_v9rank.length;_v9k++){var _v9c=_v9rank[_v9k],_v9d2=null,_v9s2=null,_v9se2=null;
                  try{_v9d2=abiSysOf(_v9c.n)}catch(e1){}
                  try{_v9s2=abiSetOf(_v9c.n)}catch(e2){}
                  try{_v9se2=abiSetExt(_v9c.n)}catch(e3){}
                  if(!_v9d2&&!_v9s2&&!_v9se2){_v9pick=_v9c;break}}
                if(_v9pick){
                  b.abi[0]={n:_v9pick.n,id:_v9pick.id,sc:_v9pick.sc,
                    why:['无队友提供'+_v9dep+'体系 → 原「'+_v9abn+'」依赖该体系会空转，换常驻特性「'+_v9pick.n+'」']};
                  b.abiSwappedForWeather=_v9abn;
                }
              }
            }
            var _v9nm=String(b.name||''),_v9ch=_v9nm.charAt(0);
            if('雨晴沙雪'.indexOf(_v9ch)>-1){
              b.name=_v9nm.replace(_v9ch,'');
              b.desc=String(b.desc||'').replace(_v9ch+'天','');
              b.namedByMoves=true;b.nameMismatch=_v9ch+'→（去体系前缀，不手动开）';
            }
          }
        }
      }catch(eV4379){eV4379.name}'''
block = block.replace('\n', '\r\n')
new = txt.replace(ANCHOR, ANCHOR + '\r\n' + block, 1)
print('after CRLF/bareLF:', counts(new))
io.open(P, 'w', encoding='utf-8', newline='').write(new)
print('new bytes:', len(new.encode('utf-8')))
