# -*- coding: utf-8 -*-
import io
P=r'D:\game\elite-redux\index.html'
txt=io.open(P,encoding='utf-8',newline='').read()
OLD="""                for(var _v9r=0;_v9rank&&_v9r<_v9rank.length;_v9r++){var _c=_v9rank[_v9r];
                  if(abiSysOf(_c.n)||abiSetOf(_c.n)||abiSetExt(_c.n))continue;
                  if(_v9badAbi(_c.id))continue;_v9pick=_c;break}"""
NEW="""                globalThis._v9trace=[];
                for(var _v9r=0;_v9rank&&_v9r<_v9rank.length;_v9r++){var _c=_v9rank[_v9r];
                  var _v9g1=abiSysOf(_c.n),_v9g2=abiSetOf(_c.n),_v9g3=abiSetExt(_c.n),_v9g4=_v9badAbi(_c.id);
                  globalThis._v9trace.push(_c.n+' id'+_c.id+' sys='+_v9g1+' set='+_v9g2+' ext='+_v9g3+' bad='+_v9g4);
                  if(_v9g1||_v9g2||_v9g3)continue;
                  if(_v9g4)continue;_v9pick=_c;break}"""
assert txt.count(OLD)==1
txt=txt.replace(OLD,NEW,1)
io.open(P,'w',encoding='utf-8',newline='').write(txt)
print('instrumented')
