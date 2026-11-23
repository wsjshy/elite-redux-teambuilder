# -*- coding: utf-8 -*-
# v4.427 patch d：强化槽内择优——同角色候选取「强化后火力/速度」更高者
import io, sys
P = r"D:\game\elite-redux\index.html"
b = io.open(P, "rb").read()
def S(x): return x.replace('\n', '\r\n').encode('utf-8')

old = S(
"""        var val=rr.score+comboScoreOf(cg)+syn-cross;
        if(val>bstVal){bstVal=val;bst={r:rr,mi:mi,free:free,cg:cg}}""")
new = S(
"""        var val=rr.score+comboScoreOf(cg)+syn-cross;
        /* v4.427：强制「强化」槽内择优——强化推队手的价值就是强化后能把队伍推完，
           同角色候选取火力/速度更高者（+12/+6 封顶），避免 95/85 这类刚过门槛的顶掉真正能推队的。 */
        if(want==='强化'){
          try{val+=Math.min(12,Math.max(0,(atkBest(rr.s)-95)/6))+Math.min(6,Math.max(0,(spdOf(rr.s)-70)/10))}catch(evb){}
        }
        if(val>bstVal){bstVal=val;bst={r:rr,mi:mi,free:free,cg:cg}}""")
if b.count(old) != 1:
    print("anchor", b.count(old)); sys.exit(1)
b = b.replace(old, new)
io.open(P, "wb").write(b)
print("patch4427d OK", len(b))
