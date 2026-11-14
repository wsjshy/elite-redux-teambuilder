# 探针：确认两个目标区域的行尾与精确文本
P = r"D:\game\elite-redux\index.html"
d = open(P, "rb").read()
g1 = b"if(!((bb[1]||0)<70||(bb[3]||0)<70))return null;"
print("gate1 count:", d.count(g1))
i = d.find(g1)
print("gate1 preceding 2 bytes:", d[i-2:i])
g2 = "var _CRIT_ABI=['狙击手','超幸运','锋锐','怒气冲天','连胜'];if(_CRIT_ABI.indexOf(n)>-1){var _tl=learnOf(s);".encode("utf-8")
print("gate2 count:", d.count(g2))
g3 = "var _critMvs=learnOf(s).filter(function(m){return isHighCritMove(m)}).map(function(m){return MV[m][1]});".encode("utf-8")
print("gate3 count:", d.count(g3))
print("CRLF:", d.count(b"\r\n"), "bareLF:", d.count(b"\n") - d.count(b"\r\n"))
