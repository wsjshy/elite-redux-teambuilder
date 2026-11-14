# v4.377 字节级补丁：①反伤流资格按主招分侧 ②会心判定改用流派实际招式
P = r"D:\game\elite-redux\index.html"
d = open(P, "rb").read()

def rep(old, new, label):
    global d
    b = old.encode("utf-8")
    assert d.count(b) == 1, label + " count=" + str(d.count(b))
    d = d.replace(b, new.encode("utf-8"), 1)
    print("patched:", label)

# ① 反伤流资格：物理 Counter 看物攻、镜面反射看特攻、金属爆炸保留 OR
rep(
    "if(!((bb[1]||0)<70||(bb[3]||0)<70))return null;",
    "if(mv0===68){if(!((bb[1]||0)<70))return null;}else if(mv0===243){if(!((bb[3]||0)<70))return null;}else if(!((bb[1]||0)<70||(bb[3]||0)<70))return null;",
    "counter gate stat-specific",
)

# ② 会心流降权判定：用流派实际招式（ctx.mvCtx），缺省回退全学习集
rep(
    "if(_CRIT_ABI.indexOf(n)>-1){var _tl=learnOf(s);",
    "if(_CRIT_ABI.indexOf(n)>-1){var _tl=(ctx&&ctx.mvCtx&&ctx.mvCtx.length)?ctx.mvCtx:learnOf(s);",
    "crit penalty pool actual moves",
)

# ③ 狙击手 why 高会心招清单：同样用实际招式
rep(
    "var _critMvs=learnOf(s).filter(function(m){return isHighCritMove(m)})",
    "var _critMvs=((ctx&&ctx.mvCtx&&ctx.mvCtx.length)?ctx.mvCtx:learnOf(s)).filter(function(m){return isHighCritMove(m)})",
    "crit why pool actual moves",
)

open(P, "wb").write(d)
print("CRLF:", d.count(b"\r\n"), "bareLF:", d.count(b"\n") - d.count(b"\r\n"))
