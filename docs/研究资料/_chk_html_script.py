# -*- coding: utf-8 -*-
r"""提取 配招助手_ER.html 内嵌 <script> 并逐个 `node --check`（引擎层语法校验）。
用法: python _chk_html_script.py [html路径]  （默认 D:\game\elite-redux\配招助手_ER.html）
输出: 每个 script 块的临时 .js 路径 + node --check 结果；全部通过 exit 0，否则 exit 1。
"""
import re, os, sys, subprocess, tempfile

BASE = r"D:\game\elite-redux"
HTML = sys.argv[1] if len(sys.argv) > 1 else os.path.join(BASE, "配招助手_ER.html")

txt = open(HTML, encoding="utf-8").read()
blocks = re.findall(r"<script[^>]*>(.*?)</script>", txt, re.S)
print("HTML:", HTML)
print("script 块数:", len(blocks))

tmp = tempfile.mkdtemp(prefix="er_js_")
bad = []
for i, b in enumerate(blocks):
    p = os.path.join(tmp, "script_%02d.js" % i)
    with open(p, "w", encoding="utf-8") as f:
        f.write(b)
    r = subprocess.run(["node", "--check", p], capture_output=True, text=True)
    ok = (r.returncode == 0)
    msg = "" if ok else ("\n" + ((r.stderr or r.stdout).strip()[:1000]))
    print("  [%s] script_%02d.js  %d chars  exit=%d%s" % (
        "OK" if ok else "FAIL", i, len(b), r.returncode, msg))
    if not ok:
        bad.append(i)

print("临时目录:", tmp)
print("==== node --check: %s ====" % ("全部通过 EXIT 0" if not bad else ("失败块 %s" % bad)))
sys.exit(1 if bad else 0)
