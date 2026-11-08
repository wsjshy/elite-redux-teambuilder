#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tools/probe_sp_abi_detail.py — 「宝可梦详情」特性块 UI 去重 + 特性详解 运行时探针

验证 v4.186 两项改动：
  A. 三项同名特性（全库 149 只）在详情页只显示 1 个徽标，标题不再写「N 选 1」；
  B. abiDesc() 对「数据层描述不足」的特性给出源码级「机制详解」，
     对「A+B」型复合特性自动展开子特性全文。

零第三方依赖（Python 标准库 + 本机 Chrome headless --dump-dom）。

用法:
    python tools/probe_sp_abi_detail.py
退出码: 0 = 全 PASS; 1 = 任一 FAIL。
"""
import json
import os
import re
import subprocess
import sys
import tempfile
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME_CANDIDATES = [
    r"C:\Users\22210\AppData\Local\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
]
MARK = "@@SPPROBE@@"

INJECT_JS = r"""
(function(){
  var DONE=false;
  function put(obj){
    if(DONE)return; DONE=true;
    var out=document.createElement('div');
    out.id='__probe_out';
    out.style.display='none';
    out.textContent='@@SPPROBE@@'+JSON.stringify(obj);
    document.body.appendChild(out);
  }
  var tries=0;
  var iv=setInterval(function(){
    tries++;
    var sp=0;
    try{ sp=(typeof ERDATA!=='undefined'&&ERDATA.species)?ERDATA.species.length:0; }catch(e){}
    if(sp>1000||tries>800){ clearInterval(iv); setTimeout(run, 700); }
  },100);

  function secByPrefix(pre){
    var secs=document.querySelectorAll('#spDetail .sec');
    for(var i=0;i<secs.length;i++){
      var h=secs[i].querySelector('h3');
      if(h && h.textContent.indexOf(pre)>=0) return secs[i];
    }
    return null;
  }

  function run(){
    var r={};
    r.g = {
      openSpById: typeof window.openSpById,
      openSp: typeof window.openSp,
      abiDesc: typeof window.abiDesc,
      abiCompositeBreak: typeof window.abiCompositeBreak,
      ABI_DETAIL: typeof window.ABI_DETAIL,
      speciesById: typeof window.speciesById,
      ERDATA: typeof window.ERDATA
    };
    try{
      // --- A. 三项同名物种（盾甲茧-原始回归 #2157，abiIds 439/439/439）---
      var sDup=null;
      try{ sDup=openSpById('2157') ; }catch(e){}
      r.dupFound=!!sDup;
      // openSpById 无返回值 → 直接从 ERDATA.species 取对象
      try{
        for(var q=0;q<ERDATA.species.length;q++){ if(String(ERDATA.species[q].id)==='2157'){ sDup=ERDATA.species[q]; break; } }
      }catch(e){}
      if(sDup){
        openSp(sDup);
        var abiSec=secByPrefix('特性（');
        var innSec=secByPrefix('天性（');
        r.dup_abiHead = abiSec? abiSec.querySelector('h3').textContent : null;
        r.dup_abiBtns = abiSec? Array.prototype.slice.call(abiSec.querySelectorAll('span.abi')).map(function(x){return x.textContent;}) : [];
        r.dup_innHead = innSec? innSec.querySelector('h3').textContent : null;
        r.dup_innBtns = innSec? Array.prototype.slice.call(innSec.querySelectorAll('span.abi')).map(function(x){return x.textContent;}) : [];
        r.dup_innIds  = sDup.innIds;
        // 点特性徽标取详情
        var btn=abiSec? abiSec.querySelector('span.abi') : null;
        if(btn){
          abiDesc(btn, '439');
          var d=document.getElementById('abiDesc');
          r.dup_descHtml = d? d.innerHTML : null;
        }
      }

      // --- B. 普通物种（3 个不同特性）标题仍应是「3 选 1」---
      var sNorm=null;
      try{
        var arr=ERDATA.species;
        for(var k=0;k<arr.length;k++){
          var ids=(arr[k].abiIds||[]).map(String);
          if(ids.length===3 && ids[0]!==ids[1] && ids[1]!==ids[2] && ids[0]!==ids[2]){ sNorm=arr[k]; break; }
        }
      }catch(e){}
      r.normFound=!!sNorm;
      if(sNorm){
        openSp(sNorm);
        var as2=secByPrefix('特性（');
        r.norm_id = sNorm.id; r.norm_zh = sNorm.zh;
        r.norm_abiHead = as2? as2.querySelector('h3').textContent : null;
        r.norm_abiBtns = as2? Array.prototype.slice.call(as2.querySelectorAll('span.abi')).map(function(x){return x.textContent;}) : [];
      }

      // --- C. 复合特性自动展开 ---
      r.fn_comp = (typeof abiCompositeBreak==='function');
      if(r.fn_comp){
        r.comp_467 = abiCompositeBreak('强夺+熔岩');
        r.comp_440 = abiCompositeBreak('变色+变换自如+毛皮大衣+冰鳞粉');
        r.comp_neg = abiCompositeBreak('彻底更改所有招式');
      }

      // --- D. ABI_DETAIL 表可用 ---
      r.detail_has439 = !!(typeof ABI_DETAIL!=='undefined' && ABI_DETAIL['439'] && ABI_DETAIL['439'].rows);
      r.detail_rows439 = (r.detail_has439 ? ABI_DETAIL['439'].rows.length : 0);
      r.has104 = (typeof ABI_DETAIL!=='undefined' && ABI_DETAIL['104']) ? (ABI_DETAIL['104'].head||'').slice(0,40) : 'NONE';
      try{ r.g104 = ('OK:' + glossify(ABI_DETAIL['104'].head)).slice(0, 60); }catch(eg104){ r.g104 = 'ERR:' + eg104.message; }
      try{
        abiDesc(null, '104');
        var dD3=document.getElementById('abiDesc');
        r.desc104 = dD3? dD3.innerHTML : null;
        r.len104 = (r.desc104 || '').length;
        r.hasMech = (r.desc104 || '').indexOf('机制详解') >= 0;
        r.tail104 = (r.desc104 || '').slice(-200);
        r.headPiece = (r.desc104 || '').slice(0, 260);
      }catch(eD3){ r.desc104 = 'ERR:' + eD3; r.len104 = -1; }
      try{
        abiDesc(null, '163');
        var dD4=document.getElementById('abiDesc');
        r.desc163 = dD4? dD4.innerHTML : null;
      }catch(eD4){ r.desc163 = 'ERR:' + eD4; }

      // --- G. 未实装招式提示（v4.188）---
      try{
        r.phCount = Object.keys(MV_PLACEHOLDER || {}).length;
        r.ph507 = (function(){ var m=MV[507]; return m? openMv(m) : null; })();
        r.phOpen = MV[507] ? $('#mvDetail') : null;
        r.desc507 = (function(){
          var box=document.getElementById('mvDetail');
          return box? box.innerHTML : null;
        })();
      }catch(eG){ r.desc507 = 'ERR:' + eG; }

      // --- F. 属性相性改写倍数（v4.187）---
      try{
        abiDesc(null, '285');
        var dF1=document.getElementById('abiDesc');
        r.desc285 = dF1? dF1.innerHTML : null;
      }catch(eF1){ r.desc285 = 'ERR:' + eF1; }
      try{
        abiDesc(null, '349');
        var dF2=document.getElementById('abiDesc');
        r.desc349 = dF2? dF2.innerHTML : null;
      }catch(eF2){ r.desc349 = 'ERR:' + eF2; }
      try{
        abiDesc(null, '86');
        var dF3=document.getElementById('abiDesc');
        r.desc86b = dF3? dF3.innerHTML : null;
      }catch(eF3){ r.desc86b = 'ERR:' + eF3; }

      // --- E. 入场类特性展开（#293 滚起来「入场释放变圆」/#320 鼓风「入场顺风」）---
      try{
        abiDesc(null, '293');
        var dE=document.getElementById('abiDesc');
        r.desc293 = dE? dE.innerHTML : null;
      }catch(eE){ r.desc293 = 'ERR:' + eE; }
      try{
        abiDesc(null, '320');
        var dE2=document.getElementById('abiDesc');
        r.desc320 = dE2? dE2.innerHTML : null;
      }catch(eE2){ r.desc320 = 'ERR:' + eE2; }
      // 反例：非入场类不应出现该块
      try{
        abiDesc(null, '86');
        var dE3=document.getElementById('abiDesc');
        r.desc86 = dE3? dE3.innerHTML : null;
      }catch(eE3){ r.desc86 = 'ERR:' + eE3; }
      // 触发型（#788 冰川暴怒「使用冰属性招式后触发一格50威力的暴风雪」）
      try{
        abiDesc(null, '788');
        var dE4=document.getElementById('abiDesc');
        r.desc788 = dE4? dE4.innerHTML : null;
      }catch(eE4){ r.desc788 = 'ERR:' + eE4; }
      // 源码级详解 #733 拳舞
      try{
        abiDesc(null, '733');
        var dE5=document.getElementById('abiDesc');
        r.desc733 = dE5? dE5.innerHTML : null;
      }catch(eE5){ r.desc733 = 'ERR:' + eE5; }

      put(r);
    }catch(e){ r.ERROR=String(e); r.stack=String(e&&e.stack||'').slice(0,500); put(r); }
  }
})();
"""


def find_chrome():
    for p in CHROME_CANDIDATES:
        if os.path.exists(p):
            return p
    raise RuntimeError("未找到 Chrome/Edge")


def guess_ctype(fp):
    if fp.endswith(".js"):
        return "application/javascript; charset=utf-8"
    if fp.endswith(".css"):
        return "text/css; charset=utf-8"
    if fp.endswith(".json"):
        return "application/json"
    if fp.endswith(".webp"):
        return "image/webp"
    return "application/octet-stream"


class H(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _send(self, code, body, ctype="text/html; charset=utf-8"):
        if isinstance(body, str):
            body = body.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = self.path.split("?")[0].split("#")[0]
        if path in ("/", "/index.html"):
            import io
            html = io.open(os.path.join(REPO, "index.html"), "r", encoding="utf-8", newline="").read()
            idx = html.find("<body")
            if idx < 0:
                self._send(500, "no <body>")
                return
            end = html.find(">", idx)
            injected = html[:end + 1] + "\n<script>\n" + INJECT_JS + "\n</script>" + html[end + 1:]
            self._send(200, injected)
            return
        fp = os.path.join(REPO, path.lstrip("/").replace("/", os.sep))
        if os.path.isfile(fp):
            self._send(200, open(fp, "rb").read(), guess_ctype(fp))
            return
        self._send(404, "not found")


def main():
    chrome = find_chrome()
    httpd = ThreadingHTTPServer(("127.0.0.1", 8791), H)
    httpd.daemon_threads = True
    threading.Thread(target=httpd.serve_forever, daemon=True).start()

    tmp = tempfile.mkdtemp(prefix="er_sp_")
    out_html = os.path.join(tmp, "dom.html")
    cmd = [chrome, "--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars",
           "--user-data-dir=" + os.path.join(tmp, "udd"),
           "--virtual-time-budget=30000", "--dump-dom", "http://127.0.0.1:8791/"]
    with open(out_html, "wb") as f:
        subprocess.run(cmd, stdout=f, stderr=subprocess.DEVNULL, timeout=120)

    dom = open(out_html, "r", encoding="utf-8", errors="replace").read()
    m = re.search(r'<div id="__probe_out"[^>]*>' + re.escape(MARK) + r'([^<]*)</div>', dom)
    if not m:
        # 兜底：直接找标记后的 JSON
        i = dom.rfind(MARK)
        if i < 0:
            print("FAIL 探针输出缺失（页面未跑到 finish）")
            return 1
        payload = dom[i + len(MARK):]
        payload = payload.split("<")[0]
    else:
        payload = m.group(1)
    data = json.loads(payload)

    if data.get("ERROR"):
        print("FAIL 页面内异常:", data["ERROR"])
        print((data.get("stack") or "")[:400])
        print("globals:", json.dumps(data.get("g"), ensure_ascii=False))
        return 1

    fails = []

    def ck(cond, name, detail=""):
        if cond:
            print("PASS %-46s %s" % (name, detail))
        else:
            print("FAIL %-46s %s" % (name, detail))
            fails.append(name)

    # A. 三同名去重
    h = data.get("dup_abiHead") or ""
    btns = data.get("dup_abiBtns") or []
    ck("唯一" in h, "A1 三同名标题含「唯一」", h)
    ck("3 选 1" not in h and "选 1" not in h, "A2 三同名标题不含「N 选 1」", h)
    ck(len(btns) == 1, "A3 三同名只渲染 1 个徽标", "n=%d %s" % (len(btns), btns))
    ck(btns and btns[0] == "天使暴怒", "A4 徽标名为规范中文「天使暴怒」", btns[0] if btns else "")
    ih = data.get("dup_innHead") or ""
    ck("固定 3 个" in ih, "A5 天性（三个不同）仍写「固定 3 个」", ih)

    # A6 详情里有源码级详解
    dh = data.get("dup_descHtml") or ""
    ck("机制详解（源码级）" in dh, "A6 详情含「机制详解（源码级）」")
    ck("撞击 Tackle" in dh and "毒针 Poison Sting" in dh, "A7 详解列出撞击/毒针具体数值")
    ck("40→100" in dh and "15→120" in dh, "A8 详解含威力改写数值")

    # B. 普通物种仍是 N 选 1
    nh = data.get("norm_abiHead") or ""
    nb = data.get("norm_abiBtns") or []
    ck("3 选 1" in nh, "B1 三不同特性仍写「3 选 1」", nh)
    ck(len(nb) == 3, "B2 三不同特性渲染 3 个徽标", "n=%d %s" % (len(nb), nb))

    # C. 复合特性拆解
    c467 = data.get("comp_467")
    c440 = data.get("comp_440")
    cneg = data.get("comp_neg")
    ck(isinstance(c467, list) and len(c467) == 2, "C1 「强夺+熔岩」拆成 2 项", str(c467)[:90])
    ck(isinstance(c440, list) and len(c440) == 4, "C2 「变色+变换自如+毛皮大衣+冰鳞粉」拆 4 项", str(c440)[:90])
    ck(cneg is None, "C3 非复合描述不误判（返回 null）", str(cneg))

    # D. ABI_DETAIL
    ck(data.get("detail_has439") is True, "D1 ABI_DETAIL 含 439 且有 rows")
    ck(data.get("detail_rows439", 0) >= 7, "D2 439 详解至少 7 行", str(data.get("detail_rows439")))
    d104 = data.get("desc104") or ""
    d163 = data.get("desc163") or ""
    ck("机制详解" in d104 and "breakable" in d104 and "207" in d104 and "先天槽同样穿透" in d104, "D3 破格详解：breakable 口径 + 行表格齐全", "len=%s" % data.get("len104"))
    ck("机制详解" in d163 and "207" in d163, "D4 涡轮火焰共用破格口径", d163[:60].replace("\n", " "))

    # E. 招式型特性自动展开
    d293 = data.get("desc293") or ""
    d320 = data.get("desc320") or ""
    d86 = data.get("desc86") or ""
    d788 = data.get("desc788") or ""
    d733 = data.get("desc733") or ""
    ck("关联招式" in d293 and "变圆" in d293, "E1 「入场释放变圆」附上招式效果", d293[:64].replace("\n", " "))
    ck("关联招式" in d320 and "顺风" in d320, "E2 「入场顺风」附上招式效果", d320[:64].replace("\n", " "))
    ck("关联招式" not in d86, "E3 非招式型特性不误挂该块", d86[:54].replace("\n", " "))
    ck("关联招式" in d788 and "暴风雪" in d788, "E4 「触发50威力暴风雪」附上招式效果", d788[:64].replace("\n", " "))
    ck("机制详解" in d733 and "跟舞" in d733, "E5 733 拳舞有源码级详解", d733[:64].replace("\n", " "))

    # F. 属性相性改写倍数
    d285 = data.get("desc285") or ""
    d349 = data.get("desc349") or ""
    d86b = data.get("desc86b") or ""
    ck("相性改写（源码倍率）" in d285 and "0.5 倍" in d285, "F1 285 地面冲击给出真实倍率 0.5", d285[:70].replace("\n", " "))
    ck("相性改写（源码倍率）" in d349 and "2.0 倍" in d349, "F2 349 电力过载给出 2.0", d349[:70].replace("\n", " "))
    ck("相性改写" not in d86b, "F3 非相性改写特性不误挂该块", d86b[:60].replace("\n", " "))

    # G. 未实装（EFFECT_PLACEHOLDER）招式提示
    phc = data.get("phCount")
    d507 = data.get("desc507") or ""
    ck(phc == 22, "G1 占位符招式表收录 22 条", "n=%s" % phc)
    ck("未实装" in d507, "G2 507 自由落体详情写明「未实装」", d507[:70].replace("\n", " "))
    ck("EFFECT_PLACEHOLDER" in d507 or "不会造成任何伤害" in d507, "G3 详情给出源码依据", d507[:70].replace("\n", " "))

    print()
    if fails:
        print("%d FAIL" % len(fails))
        return 1
    print("ALL PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
