# 提取 index.html 全部内联 <script> 块并逐段 node --check
import re, subprocess, os, tempfile

P = r"D:\game\elite-redux\index.html"
html = open(P, "rb").read().decode("utf-8")

# 只取无 src 的内联脚本
blocks = re.findall(r"<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>", html, flags=re.S | re.I)
print("内联脚本块数:", len(blocks))

tmpdir = tempfile.mkdtemp(prefix="ercheck_")
all_ok = True
for i, code in enumerate(blocks):
    f = os.path.join(tmpdir, "seg_%d.js" % i)
    open(f, "w", encoding="utf-8", newline="").write(code)
    r = subprocess.run(["node", "--check", f], capture_output=True, text=True)
    status = "OK" if r.returncode == 0 else "FAIL"
    if r.returncode != 0:
        all_ok = False
        print("段", i, status, r.stderr[:800])
    else:
        print("段", i, status, "(%d chars)" % len(code))
print("RESULT:", "ALL PASS" if all_ok else "HAS FAILURE")
