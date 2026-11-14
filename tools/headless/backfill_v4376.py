# 回填 AGENTS.md 与 VERSIONS.md 的线上核验状态（保持各自行尾）
def replace(path, old, new):
    d = open(path, "rb").read()
    b = old.encode("utf-8")
    assert d.count(b) == 1, path + " count=" + str(d.count(b))
    d = d.replace(b, new.encode("utf-8"), 1)
    open(path, "wb").write(d)
    print("backfilled", path)

# AGENTS.md（CRLF 文件，替换不影响行尾）
replace(r"D:\game\elite-redux\AGENTS.md",
        "| v4.376 | 1,983,077 | 7EC8F0213B978538CA9CB6B0D67C63D42EC738BF | 待线上核验（本版主题",
        "| v4.376 | 1,983,077 | 7EC8F0213B978538CA9CB6B0D67C63D42EC738BF | 线上一致（gh-pages `d8480f7`，逐字节核验；本版主题")

# VERSIONS.md（CRLF 文件）
replace(r"D:\game\elite-redux\docs\changelog\VERSIONS.md",
        "1,983,077 B / `7EC8F0213B978538CA9CB6B0D67C63D42EC738BF`，待线上核验，",
        "1,983,077 B / `7EC8F0213B978538CA9CB6B0D67C63D42EC738BF`，线上一致（gh-pages `d8480f7`，逐字节核验），")
