# 确认每个锚点所在行的行尾类型
P = r"D:\game\elite-redux\index.html"
d = open(P, "rb").read()
anchors = [
    b"if(!((bb[1]||0)<70||(bb[3]||0)<70))return null;",
    "var _CRIT_ABI=['狙击手','超幸运','锋锐','怒气冲天','连胜'];if(_CRIT_ABI.indexOf(n)>-1){var _tl=learnOf(s);".encode("utf-8"),
    "var _critMvs=learnOf(s).filter(function(m){return isHighCritMove(m)}).map(function(m){return MV[m][1]});".encode("utf-8"),
]
for a in anchors:
    i = d.find(a)
    # find next newline
    j = d.find(b"\n", i)
    ending = d[j-1:j+1]
    print("anchor", a[:30], "-> line ending:", ending)
