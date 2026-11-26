# -*- coding: utf-8 -*-
"""临时：从 git HEAD(v4.382) 取 index.html 块4，生成 harness_base.js 供 v4.383 前后配对归因。
数据分片与当前一致。本脚本收尾清理。"""
import re, io, os, subprocess
ROOT = r'D:\game\elite-redux'
git = r'D:\Git\bin\git.exe'
html = subprocess.check_output([git, 'show', 'HEAD:index.html'], cwd=ROOT).decode('utf-8')
blocks = re.findall(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)(?<!\\)</script>', html, flags=re.S)
b4 = blocks[4]
b4 = b4.replace('if(window.ERDATA&&ERDATA.species){renderSp(true);}',
                'if(window.ERDATA&&ERDATA.species){0;}', 1)
b4 = b4.replace('if(window.__erReady){_initCoreList()}', 'if(false){0}', 1)
b4 = b4.replace('initRuleBoxes();', '0;', 1)
lite = io.open(os.path.join(ROOT, 'data_lite_v498.js'), encoding='utf-8', newline='').read()
spd = io.open(os.path.join(ROOT, 'data_species_v498.js'), encoding='utf-8', newline='').read()
adv = io.open(os.path.join(ROOT, 'data_adv_v498.js'), encoding='utf-8', newline='').read()
STUB = r"""
var _any=new Proxy(function(){}, {get:function(t,k){if(k===Symbol.toPrimitive)return function(){return ''};return _any;},apply:function(){return _any;},set:function(){return true;}});
var window=new Proxy({},{get:function(t,k){if(k in t)return t[k];return _any;},set:function(t,k,v){t[k]=v;}});
var document=window;var navigator=window;var localStorage=window;var location=window;
globalThis.window=window;globalThis.document=document;globalThis.navigator=navigator;
function erRestoreAtkSel(){};function drawCoreList(){};
"""
EXPORT = r"""
;module.exports={ERDATA:ERDATA,deriveBuilds:deriveBuilds,classifyBuilds:classifyBuilds,
  learnOf:learnOf,MV:MV,ITM:ITM,sideDisp:sideDisp,MV_FLAG:MV_FLAG,pickAttacks:pickAttacks,
  ownAutoSys:ownAutoSys,profileOf:profileOf,spdOf:spdOf,bulkOf:bulkOf,
  pvWeatherSpeedMul:pvWeatherSpeedMul,mechPrefix:mechPrefix,isGlassCannon:isGlassCannon,
  abiTagOf:abiTagOf,abiImHf:abiImHf,NM2ID:NM2ID,_abEnt:_abEnt};
"""
out = STUB + '\n' + lite + '\n' + spd + '\n' + adv + '\n' + b4 + EXPORT
io.open(os.path.join(ROOT, 'tools', 'headless', 'harness_base.js'), 'w', encoding='utf-8', newline='').write(out)
print('base harness bytes', len(out.encode('utf-8')))
