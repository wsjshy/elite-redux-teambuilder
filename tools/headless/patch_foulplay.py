# -*- coding: utf-8 -*-
import io, sys

PATH = r"D:\game\elite-redux\index.html"
with open(PATH, "rb") as f:
    raw = f.read()
text = raw.decode("utf-8")

def C(s):
    # 多行块统一成 CRLF
    return s.replace("\n", "\r\n")

patches = []

# 补丁1：Foul Play 资格门——高速攻击手剔除
patches.append((
C("""  if(kind==='foul_play_atk'){ /* 欺诈：按对方物攻结算，自身 atk≤90 才推；atk≥120 剔除 */
    if(atk<=90)return 'ok'; if(atk<120)return 'mid'; return null;
  }"""),
C("""  if(kind==='foul_play_atk'){ /* 欺诈：按对方物攻结算，自身物攻零收益；高速攻击手（最高攻≥110且速≥100）有自己的强力输出，不作欺诈核心 */
    var _fpSpa=b[3]||0;
    if(Math.max(atk,_fpSpa)>=110&&spe>=100)return null;
    if(atk<=90)return 'ok'; if(atk<120)return 'mid'; return null;
  }""")
))

# 补丁2：通用性格块增加 _has492 检测
patches.append((
"if(+sl.id===704)_has704=true;if(+sl.id===512)_has512=true;if(+sl.id===360)_has360=true});",
"if(+sl.id===704)_has704=true;if(+sl.id===512)_has512=true;if(+sl.id===360)_has360=true;if(+sl.id===492)_has492=true});"
))

# 补丁3：通用性格块增加 Foul Play 分支
patches.append((
C("""  if(_has704&&_physN>0){want=isSp?'悠闲':'大胆';wantWhy='扑击按自身物防结算 → 性格取加防御'+(isSp?'（空间/低速轴 → 加防减速）':'')}
  else if(isSp){want=(side==='特殊')?'冷静':'勇敢';wantWhy='速度非核心价值（空间核）：性格取减速项换输出'}"""),
C("""  if(_has704&&_physN>0){want=isSp?'悠闲':'大胆';wantWhy='扑击按自身物防结算 → 性格取加防御'+(isSp?'（空间/低速轴 → 加防减速）':'')}
  else if(_has492&&_physN>0){want=isSp?'悠闲':'大胆';wantWhy='欺诈按对方物攻结算，自身物攻零收益 → 性格加防御减攻击'}
  else if(isSp){want=(side==='特殊')?'冷静':'勇敢';wantWhy='速度非核心价值（空间核）：性格取减速项换输出'}""")
))

# 补丁4：应用门 _mechBad 纳入 Foul Play
patches.append((
C("""    var _mechBad=(_has704&&_curPos!=='+防御')||(_has512&&_md==='特殊'&&_physN>0&&side==='特殊')||
                 (_has360&&((+ev[5])||0)>0);"""),
C("""    var _mechBad=(_has704&&_curPos!=='+防御')||(_has492&&_curPos!=='+防御')||(_has512&&_md==='特殊'&&_physN>0&&side==='特殊')||
                 (_has360&&((+ev[5])||0)>0);""")
))

for i,(old,new) in enumerate(patches,1):
    n = text.count(old)
    if n != 1:
        print("PATCH %d FAIL: count=%d" % (i,n)); sys.exit(1)
    text = text.replace(old,new)
    print("patch %d applied" % i)

with open(PATH, "wb") as f:
    f.write(text.encode("utf-8"))
print("done, new size:", len(text.encode("utf-8")))
