# -*- coding: utf-8 -*-
import re, subprocess, os, tempfile

PATH = r"D:\game\elite-redux\index.html"
with open(PATH,"rb") as f: html=f.read().decode("utf-8")

blocks = re.findall(r"<script>(.*?)</script>", html, flags=re.S)
print("script blocks:", len(blocks))
tmpdir = r"C:\temp\er-deploy\jscheck"
os.makedirs(tmpdir, exist_ok=True)
allok = True
for i, blk in enumerate(blocks):
    p = os.path.join(tmpdir, "blk_%d.js" % i)
    with open(p,"wb") as f: f.write(blk.encode("utf-8"))
    r = subprocess.run(["node","--check",p], capture_output=True, text=True)
    status = "OK" if r.returncode==0 else "FAIL"
    if r.returncode != 0:
        allok = False
        print("block",i,status, r.stderr[:500])
    else:
        print("block",i,status, len(blk),"chars")
print("ALL OK" if allok else "HAS FAILURE")
