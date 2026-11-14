# 字节级升版本号（index.html + package.json），不动行尾
def bump(path, old, new):
    d = open(path, "rb").read()
    b = old.encode("utf-8")
    assert d.count(b) == 1, path + " anchor count=" + str(d.count(b))
    d = d.replace(b, new.encode("utf-8"), 1)
    open(path, "wb").write(d)
    print("bumped", path, "->", new)

bump(r"D:\game\elite-redux\index.html",
     "var ER_ENGINE_VER='v4.375';", "var ER_ENGINE_VER='v4.376';")
bump(r"D:\game\elite-redux\package.json",
     '"version": "4.375.0"', '"version": "4.376.0"')
