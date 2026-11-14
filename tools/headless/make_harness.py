# -*- coding: utf-8 -*-
"""从 index.html + 三个数据分片生成 node 无头 harness（tools/headless/harness.js）。
只用于离线门禁/审计，不参与部署（deploy 白名单不含 tools/headless）。"""
import re, io, os

ROOT = r'D:\game\elite-redux'
html = io.open(os.path.join(ROOT, 'index.html'), encoding='utf-8', newline='').read()
blocks = re.findall(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)(?<!\\)</script>', html, flags=re.S)
b4 = blocks[4]
# 中和顶层自动 UI 初始化（函数定义全部保留）
b4 = b4.replace('if(window.ERDATA&&ERDATA.species){renderSp(true);}',
                'if(window.ERDATA&&ERDATA.species){0;}', 1)
b4 = b4.replace('if(window.__erReady){_initCoreList()}', 'if(false){0}', 1)
b4 = b4.replace('initRuleBoxes();', '0;', 1)

lite = io.open(os.path.join(ROOT, 'data_lite_v498.js'), encoding='utf-8', newline='').read()
spd = io.open(os.path.join(ROOT, 'data_species_v498.js'), encoding='utf-8', newline='').read()
adv = io.open(os.path.join(ROOT, 'data_adv_v498.js'), encoding='utf-8', newline='').read()

STUB = r"""
/* ===== 无头环境桩（node 专用，浏览器不加载） ===== */
var _any=new Proxy(function(){}, {get:function(t,k){if(k===Symbol.toPrimitive)return function(){return ''};return _any;},apply:function(){return _any;},set:function(){return true;}});
var window=new Proxy({},{get:function(t,k){if(k in t)return t[k];return _any;},set:function(t,k,v){t[k]=v;return true;}});
var document=window;var navigator=window;var localStorage=window;var location=window;
globalThis.window=window;globalThis.document=document;globalThis.navigator=navigator;
function erRestoreAtkSel(){};function drawCoreList(){};
"""

EXPORT = r"""
;module.exports={ERDATA:ERDATA,deriveBuilds:deriveBuilds,classifyBuilds:classifyBuilds,
  learnOf:learnOf,MV:MV,ITM:ITM,sideDisp:sideDisp};
"""

out = STUB + '\n' + lite + '\n' + spd + '\n' + adv + '\n' + b4 + EXPORT
io.open(os.path.join(ROOT, 'tools', 'headless', 'harness.js'), 'w', encoding='utf-8', newline='').write(out)
print('harness bytes', len(out.encode('utf-8')))
