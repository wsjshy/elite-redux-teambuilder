# v4.376 引擎补丁：在 eA9 后插入自包作用域的防守死特性收口块（CRLF 区域）
P = r"D:\game\elite-redux\index.html"
d = open(P, "rb").read()
anchor = "}catch(eA9){eA9.name}\r\n"
assert d.count(anchor.encode("utf-8")) == 1, "anchor not unique"

block = """  /* v4.376 防守流派死特性收口：防守/受队/联防/辅助流派若主推特性被前序批次判定「当前不生效」，
     且备选里有「常驻防守能力」（不依赖天气/场地/指定招），直接换成它——减负，不让用户自己挑。
     自包作用域独立 try/catch；只处理结构上已确认的死特性，不碰 score99 与进攻流派。 */
  try{
    var _D10_MAP={109:1,75:2,4:2,116:3,142:4,20:5,7:6,107:7,578:8,144:9,165:10};
    var _D10_ROLES=['肉盾','受队','联防','辅助'];
    function _d10IdOf(s,n){
      var ab=(s&&s.abis)||[],ai=(s&&s.abiIds)||[];
      for(var i=0;i<ab.length;i++){if(ab[i]===n)return ai[i]?+ai[i]:null;}
      var ib=(s&&s.inns)||[],ii=(s&&s.innIds)||[];
      for(var j=0;j<ib.length;j++){if(ib[j]===n)return ii[j]?+ii[j]:null;}
      return null;
    }
    out.forEach(function(b){
      try{
        if(b.score===99)return;
        if(!b.abi||b.abi.length<2||!b.abi[0])return;
        var a0=b.abi[0];
        if(!a0.why||JSON.stringify(a0.why).indexOf('此特性当前不生效')<0)return;
        var isDef=(b.side==='辅助')||(_D10_ROLES.indexOf(b.roleTag)>=0);
        if(!isDef)return;
        var bestI=-1,bestRank=999;
        for(var k=1;k<b.abi.length;k++){
          var aid=_d10IdOf(s,b.abi[k].n);
          if(aid==null||!_D10_MAP.hasOwnProperty(aid))continue;
          var rk=_D10_MAP[aid];
          if(rk<bestRank){bestRank=rk;bestI=k;}
        }
        if(bestI<0)return;
        var dead=a0,nm=b.abi[bestI].n;
        var dn=dead.n;try{dn=abiDispName(dead.n)}catch(eD10){dn=dead.n}
        b.abi[0]=b.abi[bestI];b.abi[bestI]=dead;
        b.abi[0].sc=1;
        b.abi[0].why=[nm+'：原'+dn+'在本流派拿不到触发条件，换成本流派常驻生效的防守特性'];
      }catch(eD10b){eD10b.name}
    });
  }catch(eD10){eD10.name}
"""
block_crlf = block.replace("\n", "\r\n").encode("utf-8")
d = d.replace(anchor.encode("utf-8"), anchor.encode("utf-8") + block_crlf, 1)
open(P, "wb").write(d)
print("patched. CRLF:", d.count(b"\r\n"), "bareLF:", d.count(b"\n") - d.count(b"\r\n"))
