#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tools/probe_abi_coldstart.py — 「特性反查」Tab 冷启动运行时探针

背景
----
用户实测：线上冷打开「特性反查」Tab，状态条显示「匹配 60 个特性 · 开关隐藏 0 个持有者条目」，
但每张特性卡的徽标「天性 0 / 可选 0」全为 0，展开后两列都是「（无）」。
手动把两个开关（仅最终形态 / Mega 形态优先）关再开一次，数字就正常了。

本探针零第三方依赖（仅 Python 标准库 + 本机已装的 Chrome），用 headless Chrome
--dump-dom 把页面跑完后抓 DOM，并在页面里注入一段记录器，拿到事件时序与逐卡数字。

用法
----
    # 本地（项目根起 http server，自动注入探针脚本）
    python tools/probe_abi_coldstart.py --url http://localhost:8000/

    # 线上（抓 live index.html，注入 <base> 指向线上，数据文件浏览器直连线上）
    python tools/probe_abi_coldstart.py --url https://wsjshy.github.io/elite-redux-teambuilder/

退出码: 0 = 全部断言 PASS; 1 = 任一 FAIL。

断言清单
--------
  A. 冷启动（不碰任何开关）状态条 #abiFiltStat 与首批卡片徽标不得全 0；
     具体：状态条不得含「隐藏 0 个持有者条目」且至少一张卡的「天性 N」或「可选 N」N>0。
  B. 冷启动态 == 手动 toggle 关再开后态（逐卡「天性/可选」数字完全一致）。
  C. _hidN（状态条里的「开关隐藏 N」）与逐卡数字自洽：开关全关时应能看到非 0 的隐藏数，
     开关全开时隐藏数应回到与冷启动一致。
  D. 时序证据：记录每次 renderAbi 调用时的 ERDATA.species.length 与 abiOwners() 键数，
     写入 DOM，由本脚本解析后打印（用于判定真因）。
"""
import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
import threading
import time
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from socketserver import TCPServer

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT_DIR = REPO   # overridden by --root
CHROME_CANDIDATES = [
    r"C:\Users\22210\AppData\Local\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
]

# ---------------------------------------------------------------------------
# 注入到页面里的记录器脚本。
# 设计要点：
#  - 尽早 hook renderAbi（轮询等它定义），记录每次调用时 species.length / owners 键数。
#  - 监听 er-ready / er-shard-* 事件，记录时序。
#  - 轮询到「species 就绪 + 卡片已渲染」后，先抓冷启动态，再程序化 toggle 两个开关，
#    抓 toggle 后态，把两份 JSON 写进 #__probe_out。
# ---------------------------------------------------------------------------
INJECT_JS = r"""
(function(){
  var LOG = [];
  function t(tag){ try{ var sl=(typeof ERDATA!=='undefined'&&ERDATA.species)?ERDATA.species.length:-1;
    LOG.push([Date.now(), tag, 'sp='+sl, 'rd='+(window.__erReady?'1':'0'), 'pend='+(window.__erPending)]); }catch(e){} }
  window.__PROBE_LOG = LOG;

  document.addEventListener('er-ready', function(){ t('EVT er-ready'); });
  document.addEventListener('er-shard-species', function(){ t('EVT er-shard-species'); });
  document.addEventListener('er-shard-adv', function(){ t('EVT er-shard-adv'); });

  // hook renderAbi
  (function(){
    var n=0;
    function poll(){
      n++;
      if (typeof renderAbi === 'function' && !renderAbi.__hooked) {
        var orig = renderAbi;
        window.renderAbi = function(){
          var sp=-1, ok=-1, cached=false;
          try{ sp=(typeof ERDATA!=='undefined'&&ERDATA.species)?ERDATA.species.length:-1; }catch(e){}
          try{ if(typeof abiOwners==='function'){ ok=Object.keys(abiOwners()).length; cached=!!window._abiOwners; } }catch(e){}
          t('CALL renderAbi #'+(window.__rc=(window.__rc||0)+1)+' ownersKeys='+ok+' cached='+cached);
          return orig.apply(this, arguments);
        };
        window.renderAbi.__hooked = true;
        t('HOOK renderAbi at poll#'+n);
      }
      if(n<400) setTimeout(poll, 30);
    }
    poll();
  })();

  function readState(tag){
    var stat = (document.getElementById('abiFiltStat')||{}).textContent || '';
    var cards = Array.prototype.slice.call(document.querySelectorAll('#abiResult .abicard')).slice(0,15);
    var sample = cards.map(function(c){
      var zh = (c.querySelector('.abihd b')||{}).textContent || '';
      var badges = Array.prototype.slice.call(c.querySelectorAll('.badge')).map(function(b){return b.textContent.trim();});
      return zh+' :: '+badges.join(' / ');
    });
    return { tag:tag, stat:stat, cardCount:cards.length, sample:sample };
  }

  function finish(){
    var cold = readState('COLD');
    var f = document.getElementById('abiFiltFinal');
    var m = document.getElementById('abiFiltMega');
    // toggle off
    f.checked=false; f.dispatchEvent(new Event('change'));
    m.checked=false; m.dispatchEvent(new Event('change'));
    setTimeout(function(){
      var off = readState('OFF');
      // toggle on
      f.checked=true; f.dispatchEvent(new Event('change'));
      m.checked=true; m.dispatchEvent(new Event('change'));
      setTimeout(function(){
        var on = readState('ON');
        var out = document.createElement('div');
        out.id = '__probe_out';
        out.style.display = 'none';
        out.textContent = '@@PROBE_JSON@@' + JSON.stringify({cold:cold, off:off, on:on, log:LOG});
        document.body.appendChild(out);
        t('PROBE DONE');
      }, 600);
    }, 600);
  }

  // poll for settle: species > 1000 and cards rendered
  var tries=0;
  var iv = setInterval(function(){
    tries++;
    var spReady=false, cards=0;
    try{ spReady = (typeof ERDATA!=='undefined'&&ERDATA.species&&ERDATA.species.length>1000); }catch(e){}
    try{ cards = document.querySelectorAll('#abiResult .abicard').length; }catch(e){}
    if((spReady && cards>0) || tries>400){
      clearInterval(iv);
      t('SETTLE tries='+tries+' cards='+cards);
      // small extra wait to be sure any late renderAbi finished
      setTimeout(finish, 800);
    }
  }, 100);
})();
"""

PROBE_MARK = "@@PROBE_JSON@@"


def find_chrome():
    for p in CHROME_CANDIDATES:
        if os.path.exists(p):
            return p
    raise RuntimeError("未找到 Chrome/Edge，已试过: " + ", ".join(CHROME_CANDIDATES))


# ---------------------------------------------------------------------------
# HTTP handler: 本地模式从项目根发文件，注入 index.html；
#               线上模式只发一页注入后的 HTML（<base> 指向线上，其余资源浏览器直连）。
# ---------------------------------------------------------------------------
class ProbeHandler(BaseHTTPRequestHandler):
    mode = "local"          # or "live"
    live_url = ""           # e.g. https://wsjshy.github.io/elite-redux-teambuilder/
    repo = ROOT_DIR
    delay_species = 0.0     # seconds to delay data_species_v498.js (repro race)
    empty_species = False   # serve empty JS for data_species (onload fires, ERDATA.species unset)

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
        if self.mode == "local":
            if path in ("/", "/index.html"):
                html = io_read(os.path.join(self.repo, "index.html"))
                injected = inject_local(html)
                self._send(200, injected)
                return
            fp = os.path.join(self.repo, path.lstrip("/").replace("/", os.sep))
            if os.path.isfile(fp):
                ctype = guess_ctype(fp)
                if self.empty_species and "data_species_v498" in path:
                    body = b"// probe: species intentionally empty\n"
                else:
                    body = open(fp, "rb").read()
                if self.delay_species and "data_species_v498" in path:
                    import time as _t
                    _t.sleep(self.delay_species)
                self._send(200, body, ctype)
                return
            self._send(404, "not found: " + path)
        else:
            # live mode: only serve the injected index.html at /
            if path in ("/", "/index.html"):
                html = fetch_live(self.live_url + "index.html")
                injected = inject_live(html, self.live_url)
                self._send(200, injected)
                return
            self._send(404, "probe live mode only serves /")


def io_read(p):
    import io
    return io.open(p, "r", encoding="utf-8", newline="").read()


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


def inject_local(html):
    # insert probe script right after <body ...>
    tag = "<body"
    idx = html.find(tag)
    if idx < 0:
        raise RuntimeError("index.html 找不到 <body>")
    end = html.find(">", idx)
    script = "<script>\n" + INJECT_JS + "\n</script>"
    return html[:end+1] + "\n" + script + html[end+1:]


def inject_live(html, live_url):
    # add <base href="live_url/"> right after <head ...>, then inject probe after <body>
    if not live_url.endswith("/"):
        live_url += "/"
    base = '<base href="' + live_url + '">'
    head_idx = html.lower().find("<head")
    if head_idx >= 0:
        gt = html.find(">", head_idx)
        html = html[:gt+1] + "\n" + base + html[gt+1:]
    return inject_local(html)


def fetch_live(url):
    req = urllib.request.Request(url, headers={"User-Agent": "probe/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        raw = r.read()
    return raw.decode("utf-8", "replace")


# ---------------------------------------------------------------------------
def run_server(mode, live_url, port=8765):
    ProbeHandler.mode = mode
    ProbeHandler.live_url = live_url
    httpd = ThreadingHTTPServer(("127.0.0.1", port), ProbeHandler)
    httpd.daemon_threads = True
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    return httpd


def chrome_dump(chrome, url, budget_ms=25000):
    tmp = tempfile.mkdtemp(prefix="erprobe_")
    user_data = os.path.join(tmp, "udd")
    out_html = os.path.join(tmp, "dom.html")
    cmd = [
        chrome,
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--hide-scrollbars",
        "--user-data-dir=" + user_data,
        "--virtual-time-budget=" + str(budget_ms),
        "--dump-dom",
        url,
    ]
    with open(out_html, "wb") as f:
        p = subprocess.run(cmd, stdout=f, stderr=subprocess.PIPE, timeout=90)
    if p.returncode != 0:
        sys.stderr.write("chrome stderr: " + p.stderr.decode("utf-8", "replace")[-2000:] + "\n")
    return out_html


def parse_probe_out(dom_path):
    with open(dom_path, "r", encoding="utf-8", errors="replace") as f:
        dom = f.read()
    # The marker also appears inside the injected <script> source. Find the
    # actual #__probe_out div (which we style display:none) by its id.
    m = re.search(r'id="__probe_out"[^>]*>(.*?)</div>', dom, re.S)
    if not m:
        return None, dom
    inner = m.group(1).strip()
    marker = PROBE_MARK
    i = inner.find(marker)
    if i < 0:
        return None, dom
    raw = inner[i+len(marker):].strip()
    try:
        data = json.loads(raw)
    except Exception as e:
        return {"_parse_error": str(e), "_raw": raw[:2000]}, dom
    return data, dom


def assert_results(data):
    """返回 (passed: bool, lines: [str])"""
    lines = []
    ok = True
    if data is None:
        return False, ["FAIL: 未在 dump 出的 DOM 里找到 #__probe_out —— 注入脚本未跑完或 settle 未触发"]
    if "_parse_error" in data:
        return False, ["FAIL: probe JSON 解析失败: " + data["_parse_error"], data.get("_raw", "")[:500]]

    cold = data.get("cold", {})
    off = data.get("off", {})
    on = data.get("on", {})
    log = data.get("log", [])

    lines.append("== 时序日志 (t_ms, event, speciesLen, erReady, erPending) ==")
    for row in log:
        lines.append("  " + " | ".join(str(x) for x in row))

    lines.append("")
    lines.append("== 冷启动态 ==")
    lines.append("  状态条: " + cold.get("stat", ""))
    lines.append("  卡片数: " + str(cold.get("cardCount", 0)))
    for s in cold.get("sample", []):
        lines.append("    - " + s)

    lines.append("")
    lines.append("== 开关全关后 ==")
    lines.append("  状态条: " + off.get("stat", ""))
    for s in off.get("sample", [])[:5]:
        lines.append("    - " + s)

    lines.append("")
    lines.append("== 开关全开后 ==")
    lines.append("  状态条: " + on.get("stat", ""))
    for s in on.get("sample", [])[:5]:
        lines.append("    - " + s)

    # ---- Assertion A: cold state not all-zero ----
    cold_stat = cold.get("stat", "")
    cold_sample = cold.get("sample", [])
    # parse "天性 N / 可选 N" from samples
    def card_sum(sample):
        tot_inn = 0
        tot_ab = 0
        for s in sample:
            m = re.findall(r"(天性|可选)\s*(\d+)", s)
            for k, v in m:
                if k == "天性":
                    tot_inn += int(v)
                else:
                    tot_ab += int(v)
        return tot_inn, tot_ab

    ci, ca = card_sum(cold_sample)
    lines.append("")
    lines.append("== 断言 ==")
    # A1: status bar must show more than 0 hidden AND matched
    m = re.search(r"匹配\s*(\d+)\s*个特性.*?隐藏\s*(\d+)\s*个", cold_stat)
    if not m:
        lines.append("  A1 FAIL: 状态条文案未匹配到「匹配 N 个特性 · 隐藏 M 个」: " + cold_stat)
        ok = False
    else:
        matched = int(m.group(1))
        hidden = int(m.group(2))
        lines.append("  A1: 冷启动 匹配=" + str(matched) + " 隐藏=" + str(hidden))
        if matched <= 0:
            lines.append("     FAIL: 匹配数 <= 0"); ok = False
    # A2: at least one card with 天性>0 or 可选>0
    lines.append("  A2: 冷启动前 15 卡 天性合计=" + str(ci) + " 可选合计=" + str(ca))
    if ci == 0 and ca == 0:
        lines.append("     FAIL: 冷启动所有卡片徽标全为 0（bug 复现）")
        ok = False

    # ---- Assertion B: cold == on (toggle off+on restores) ----
    cold_badges = [s.split("::", 1)[1].strip() if "::" in s else s for s in cold_sample]
    on_badges = [s.split("::", 1)[1].strip() if "::" in s else s for s in on.get("sample", [])]
    # compare up to min length
    cmp_n = min(len(cold_badges), len(on_badges))
    mismatches = 0
    for i in range(cmp_n):
        # extract just the badge numbers
        def nums(s):
            return tuple(re.findall(r"\d+", s))
        if nums(cold_badges[i]) != nums(on_badges[i]):
            mismatches += 1
            lines.append("  B 卡#" + str(i) + " 不一致: cold=[" + cold_badges[i] + "] on=[" + on_badges[i] + "]")
    if mismatches == 0 and cmp_n > 0:
        lines.append("  B: 冷启动态 == toggle 后态（前 " + str(cmp_n) + " 卡数字一致）PASS")
    else:
        if cmp_n == 0:
            lines.append("  B: 无可比卡片（样本为空）")
        # if cold was all-zero but on is non-zero, that's the bug: cold != on
        lines.append("     冷启动态与 toggle 后态有 " + str(mismatches) + " 处不一致")
        # If cold is all-zero (ci==0 and ca==0) but on is non-zero, that IS the bug -> fail A already
        oi, oa = card_sum(on.get("sample", []))
        if (ci == 0 and ca == 0) and (oi > 0 or oa > 0):
            lines.append("     => 这正是 bug：冷启动全 0，toggle 后才出数字")
        ok = False

    # ---- Assertion C: cold (switches ON) must show non-zero hidden; off must show 0 ----
    off_stat = off.get("stat", "")
    m2 = re.search(r"隐藏\s*(\d+)\s*个", off_stat)
    if m2:
        off_hidden = int(m2.group(1))
        lines.append("  C: 开关全关时隐藏=" + str(off_hidden) + "（应为 0：不过滤=不隐藏）")
        if off_hidden != 0:
            lines.append("     FAIL: 开关全关却隐藏 " + str(off_hidden) + " 个条目"); ok = False
    else:
        lines.append("  C: 状态条未匹配隐藏数: " + off_stat)
    # cold (switches ON) hidden should be > 0 (filters active)
    if m:
        lines.append("  C2: 冷启动（开关 ON）隐藏=" + str(hidden) + "（应 >0：过滤生效）")
        if hidden <= 0:
            lines.append("     FAIL: 开关 ON 却隐藏 0 个条目 —— 过滤未生效"); ok = False

    return ok, lines


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", required=True, help="目标 URL（本地 http://localhost:PORT/ 或线上 https://...）")
    ap.add_argument("--port", type=int, default=8765)
    ap.add_argument("--budget", type=int, default=25000, help="virtual-time-budget ms")
    ap.add_argument("--delay-species", type=float, default=0.0, help="seconds to delay data_species (race repro)")
    ap.add_argument("--empty-species", action="store_true", help="serve empty data_species.js (onload fires, ERDATA.species unset)")
    ap.add_argument("--root", default=None, help="serve files from this dir (default: repo root)")
    args = ap.parse_args()

    url = args.url.rstrip("/")
    is_live = url.startswith("https://") or (
        url.startswith("http://") and "localhost" not in url and "127." not in url
    )

    chrome = find_chrome()
    print("[probe] chrome =", chrome)
    print("[probe] target =", url)

    httpd = None
    if is_live:
        mode = "live"
        live_url = url + "/"
        httpd = run_server(mode, live_url, args.port)
        serve_url = "http://127.0.0.1:%d/" % args.port
        print("[probe] live mode: serving injected HTML at", serve_url, "(resources load from", live_url + ")")
    else:
        # local mode: always start our own injection server rooted at REPO
        mode = "local"
        live_url = ""
        global ROOT_DIR
        if args.root:
            ROOT_DIR = args.root
            ProbeHandler.repo = args.root
        ProbeHandler.delay_species = args.delay_species
        ProbeHandler.empty_species = args.empty_species
        httpd = run_server(mode, live_url, args.port)
        serve_url = "http://127.0.0.1:%d/" % args.port
        print("[probe] local mode: injection server at", serve_url, "root=", ProbeHandler.repo, "delay_species=", args.delay_species, "empty_species=", args.empty_species)

    print("[probe] chrome running (virtual-time-budget=%d ms)..." % args.budget)
    dom_path = chrome_dump(chrome, serve_url, args.budget)
    print("[probe] dom dumped to", dom_path)

    data, dom = parse_probe_out(dom_path)
    ok, lines = assert_results(data)
    print("\n".join(lines))
    print("")
    print("=" * 60)
    print("RESULT:", "PASS" if ok else "FAIL")
    print("=" * 60)

    if httpd:
        httpd.shutdown()
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
