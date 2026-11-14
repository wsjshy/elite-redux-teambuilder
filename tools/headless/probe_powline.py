P = r"D:\game\elite-redux\index.html"
d = open(P, "rb").read()
a = b"var pow=(mech.pow!==null)?mech.pow:(m[5]||0);if(pow<55)return;"
print("count:", d.count(a))
i = d.find(a)
j = d.find(b"\n", i)
print("line ending:", d[j-1:j+1])
