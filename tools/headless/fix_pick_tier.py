# -*- coding: utf-8 -*-
import io
P=r'D:\game\elite-redux\index.html'
txt=io.open(P,encoding='utf-8',newline='').read()
OLD=("""                var _v9pick=null;
                globalThis._v9trace=[];
                for(var _v9r=0;_v9rank&&_v9r<_v9rank.length;_v9r++){var _c=_v9rank[_v9r];
                  var _v9g1=abiSysOf(_c.n),_v9g2=abiSetOf(_c.n),_v9g3=abiSetExt(_c.n),_v9g4=_v9badAbi(_c.id);
                  globalThis._v9trace.push(_c.n+' id'+_c.id+' sys='+_v9g1+' set='+_v9g2+' ext='+_v9g3+' bad='+_v9g4);
                  if(_v9g1||_v9g2||_v9g3)continue;
                  if(_v9g4)continue;_v9pick=_c;break}""").replace('\n','\r\n')
NEW=("""                var _v9pick=null,_v9syn=null,_v9neu=null,_v9fids=_v9main.map(function(x){return +x.id});
                for(var _v9r=0;_v9rank&&_v9r<_v9rank.length;_v9r++){var _c=_v9rank[_v9r];
                  if(abiSysOf(_c.n)||abiSetOf(_c.n)||abiSetExt(_c.n))continue;
                  if(_v9badAbi(_c.id))continue;
                  var _v9rule=null;try{_v9rule=famAbiRuleOf(_c.n)}catch(e5){_v9rule=null}
                  if(_v9rule){if(_v9fids.some(_v9rule.check)&&!_v9syn)_v9syn=_c}
                  else{if(!_v9neu)_v9neu=_c}}
                _v9pick=_v9syn||_v9neu;""").replace('\n','\r\n')
assert txt.count(OLD)==1,txt.count(OLD)
txt=txt.replace(OLD,NEW,1)
io.open(P,'w',encoding='utf-8',newline='').write(txt)
print('replaced, bytes',len(txt.encode('utf-8')))
