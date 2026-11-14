# v4.377 补丁④：威力门之前先折算技术高手（≤60 威力招×1.5），让子弹拳等低威力先制招能进池
P = r"D:\game\elite-redux\index.html"
d = open(P, "rb").read()

old = "var pow=(mech.pow!==null)?mech.pow:(m[5]||0);if(pow<55)return;"
new = ("var pow=(mech.pow!==null)?mech.pow:(m[5]||0);"
       "try{var _tn377=(s.abis||[]).concat(s.inns||[]);"
       "if(_tn377.indexOf('技术高手')>-1&&(m[5]||0)>0&&(m[5]||0)<=60)pow*=1.5;}catch(eTn377){}"
       "if(pow<55)return;")
b = old.encode("utf-8")
assert d.count(b) == 1, d.count(b)
d = d.replace(b, new.encode("utf-8"), 1)
open(P, "wb").write(d)
print("CRLF:", d.count(b"\r\n"), "bareLF:", d.count(b"\n") - d.count(b"\r\n"))
