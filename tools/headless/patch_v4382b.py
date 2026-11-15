# -*- coding: utf-8 -*-
"""v4.382 补丁 C：速度轴 self-centric 收尾块（无来源速攻去冠名；倍率残留 EV 标注例外）。"""
import io, os

ROOT = r'D:\game\elite-redux'
idx = os.path.join(ROOT, 'index.html')
txt = io.open(idx, encoding='utf-8', newline='').read()

anchor = "      }catch(eV4381b){eV4381b.name}\r\n    }\r\n"
if txt.count(anchor) != 1:
    raise SystemExit('锚点计数 %d' % txt.count(anchor))

block = (
"      }catch(eV4381b){eV4381b.name}\r\n"
"      /* v4.382 速度轴 self-centric 收尾：按最终实战招式复核自身速度来源。\r\n"
"         · 无任何当场生效速度来源（种族<100、无天气提速特性、实战无顺风366、无轻装、无讲究围巾、无速度型强化招）\r\n"
"           却仍冠「速攻」名 → 去速攻冠名，改输出/清场定位；\r\n"
"         · 基础速度≥100 但 EV 0 投入且无倍率：倍率收敛残留（顺风前缀后置剥离所致），本版不重排 EV/性格，why 注明；\r\n"
"         · 有倍率来源（天气提速/保留顺风/轻装/围巾）的速度收敛卡属既定模板，保留并登记为例外。 */\r\n"
"      try{\r\n"
"        var _v13sp=+((s.base||[])[5]||0);\r\n"
"        if(b.v13SourceChecked===undefined)b.v13SourceChecked=false;\r\n"
"        if(b.v13Demoted===undefined)b.v13Demoted=null;\r\n"
"        if(b.v13EvStale===undefined)b.v13EvStale=false;\r\n"
"        var _v13mv=(b.mv.main||[]).concat(b.mv.func||[]).map(function(x){return +x.id});\r\n"
"        var _v13Wx=1;try{_v13Wx=pvWeatherSpeedMul(s)||1}catch(eV13w){_v13Wx=1}\r\n"
"        var _v13Light=((s.abis||[]).indexOf('轻装')>-1)||((s.inns||[]).indexOf('轻装')>-1);\r\n"
"        var _v13Scarf=String(itemMainZh(b)).indexOf('讲究围巾')>-1;\r\n"
"        var _v13TwMv=_v13mv.indexOf(366)>=0;\r\n"
"        var _v13Boost=_v13mv.some(function(id){return [349,483,504,187,526].indexOf(id)>=0});\r\n"
"        var _v13Mult=(_v13Wx>1)||_v13TwMv||_v13Light||_v13Scarf;\r\n"
"        var _v13SrcOk=(_v13sp>=100)||_v13Mult||_v13Boost;\r\n"
"        var _v13nm=String(b.name||'');\r\n"
"        if(/速攻/.test(_v13nm)){\r\n"
"          if(!_v13SrcOk){\r\n"
"            var _v13New=_v13nm.replace(/速攻强化清场/,'强化清场').replace(/速攻压制/,'主力输出压制').replace(/轻装速攻流/,'主力输出压制').replace(/速攻流/,'主力输出压制');\r\n"
"            if(_v13New!==_v13nm){\r\n"
"              b.name=_v13New;b.v13Demoted=_v13nm+'→'+_v13New;\r\n"
"              b.nameMismatch=(b.nameMismatch?b.nameMismatch+'；':'')+'无自身当场生效速度来源 → 去速攻冠名（改输出/清场定位）';\r\n"
"              var _v13why='自身无当场生效速度来源（速度种族<100、无天气提速/顺风/轻装/围巾/速度强化招）→ 不作速攻定位';\r\n"
"              (b.mv.main||[]).forEach(function(x){if(x&&x.why)x.why=x.why.concat([_v13why])});\r\n"
"            }\r\n"
"          }else if(!_v13Mult&&_v13sp>=100&&+((b.ev||{}).alloc||[])[5]===0){\r\n"
"            var _v13src=String((b.ev||{}).source||'');\r\n"
"            if(_v13src.indexOf('倍率')>=0){\r\n"
"              b.v13EvStale=true;\r\n"
"              var _v13why2='速度 EV 未投入（倍率收敛模板残留：顺风/天气前缀后置剥离所致）；本版未重排 EV/性格，速度线可在详情页速度滑块手动调整';\r\n"
"              (b.mv.main||[]).forEach(function(x){if(x&&x.why)x.why=x.why.concat([_v13why2])});\r\n"
"            }\r\n"
"          }\r\n"
"        }\r\n"
"        b.v13SourceChecked=true;\r\n"
"      }catch(eV4382){eV4382.name}\r\n"
"    }\r\n"
)
txt = txt.replace(anchor, block, 1)
io.open(idx, 'w', encoding='utf-8', newline='').write(txt)
print('patch v4382 C applied OK')
