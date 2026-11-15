# -*- coding: utf-8 -*-
"""v4.382 合并引擎补丁：从 v4.381 基线 index.html 一步复现 v4.382 最终态。
合并自原增量链：A selfSpeedSource helper + speed/tr self-centric 门控 + B 顺风去 role 白名单
→ v13 收尾降级/标注块 → 顺风倍率按实战 366 判定 → stale 分支改名降级 → 去 ev.source 前置门
→ 展示层模板标签速攻→高速线/历史名前缀 → 例外卡分档 why 文案 → 版本号。
纪律：io.open newline=''；锚点唯一；自包 try/catch 非空；per-build 标记块首显式赋初值。
用法：python patch_v4382.py [index路径] [package.json路径]（默认仓库内 index.html / package.json）。"""
import io, os, sys, hashlib

ROOT = r'D:\game\elite-redux'
idx = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'index.html')
t = io.open(idx, encoding='utf-8', newline='').read()

def rep_once(old, new, tag):
    n = t.count(old)
    if n != 1:
        raise SystemExit('锚点不唯一(%d): %s' % (n, tag))
    return t.replace(old, new, 1)

# ---- A0: selfSpeedSource helper（插在 mechPrefix 函数闭合之后） ----
anchor_helper = (
"  if(p.ab.im.length||p.ab.hf.length)return '免疫';\r\n"
"  return '';\r\n"
"}\r\n"
)
helper_new = anchor_helper + (
"/* v4.382：速度轴 self-centric 判据——本物种自身当场生效速度来源，折算有效速度 ≥ SPEED_HIGH(100)。\r\n"
"   ① 种族速度 ≥100；② 自有提速体系：天气提速特性 ×1.5（与 EV 层 pvWeatherSpeedMul 同口径）/ 自开顺风 ×2 /\r\n"
"   轻装消耗后 ×2。队友高速、队友开天气不计入本判据（只进 sc/drivenBy）。 */\r\n"
"function selfSpeedSource(s,p){\r\n"
"  var spd=(p&&p.du&&p.du.spd!=null)?p.du.spd:spdOf(s);\r\n"
"  var mul=1,notes=[];\r\n"
"  if(spd>=NEED_CFG.SPEED_HIGH)return {ok:true,mul:1,eff:spd,notes:['种族速度 '+spd+' ≥'+NEED_CFG.SPEED_HIGH]};\r\n"
"  try{var _wm=pvWeatherSpeedMul(s)||1;if(_wm>1){mul*=_wm;notes.push('天气提速特性 ×'+_wm)}}catch(eSs1){eSs1.name}\r\n"
"  if(p&&p.fn&&p.fn.tw){mul*=2;notes.push('自开顺风 ×2')}\r\n"
"  var _lb=((s.abis||[]).indexOf('轻装')>-1)||((s.inns||[]).indexOf('轻装')>-1);\r\n"
"  if(_lb){mul*=2;notes.push('轻装消耗后 ×2')}\r\n"
"  var eff=Math.round(spd*mul);\r\n"
"  return {ok:eff>=NEED_CFG.SPEED_HIGH,mul:mul,eff:eff,notes:notes};\r\n"
"}\r\n"
)
t = rep_once(anchor_helper, helper_new, 'helper')

# ---- A1: 速度轴门控改 self-centric + 空间前缀互斥 ----
old_speed = (
"  /* ① 输出侧（R07-30）：高速个体 ≥2 且力度达标 */\r\n"
"  if(fastCount>=2&&p.ok)cand.push({key:'speed',base:(p.hasBoost?'速攻强化清场':'速攻压制'),tag:'输出',sc:6+fastCount,\r\n"
"    drivenBy:['速度 '+p.du.spd.toFixed(0)+'（≥'+NEED_CFG.SPEED_HIGH+' 高线）','高速个体 '+fastCount+' 只','力度 '+p.power+' 达标']});\r\n"
)
new_speed = (
"  /* ① 输出侧（R07-30，v4.382 self-centric）：本物种自身具备当场生效速度来源（折算有效速度 ≥100）才生成；\r\n"
"     队友高速只进 sc/drivenBy，不作生成条件；「空间」前缀与速攻语义互斥，空间核不进速度轴。 */\r\n"
"  var _v13ss=null;try{_v13ss=selfSpeedSource(s,p)}catch(eV13s){_v13ss={ok:false,eff:p.du.spd||0,notes:[]}}\r\n"
"  if(_v13ss.ok&&p.ok&&pref!=='空间')cand.push({key:'speed',base:(p.hasBoost?'速攻强化清场':'速攻压制'),tag:'输出',sc:6+fastCount,\r\n"
"    drivenBy:['自身有效速度 '+_v13ss.eff+'（≥'+NEED_CFG.SPEED_HIGH+' 高线）'+(_v13ss.notes&&_v13ss.notes.length?'，'+_v13ss.notes.join('/'):''),'队内高速 '+fastCount+' 只','力度 '+p.power+' 达标']});\r\n"
)
t = rep_once(old_speed, new_speed, 'speed-cand')

# ---- A2: tr 慢速重炮门控只认自身低速 ----
old_tr = (
"  /* ③ 空间侧（R07-32）：低速个体 ≥2 且队内有戏法空间 */\r\n"
"  if(slowCount>=2&&p.ok&&trSetter)cand.push({key:'tr',base:'慢速重炮',tag:'输出',sc:5+slowCount,\r\n"
"    drivenBy:['低速个体 '+slowCount+' 只（≤'+NEED_CFG.SPEED_LOW+'）','队内含戏法空间','力度 '+p.power+' 高']});\r\n"
)
new_tr = (
"  /* ③ 空间侧（R07-32，v4.382 self-centric）：只认自身低速（≤60）；队内空间手/低速个体只提分，不作生成条件 */\r\n"
"  if(p.slow&&p.ok&&trSetter)cand.push({key:'tr',base:'慢速重炮',tag:'输出',sc:5+slowCount,\r\n"
"    drivenBy:['自身速度 '+p.du.spd+'（≤'+NEED_CFG.SPEED_LOW+' 低速）','队内含戏法空间','力度 '+p.power+' 高']});\r\n"
)
t = rep_once(old_tr, new_tr, 'tr-cand')

# ---- B: 顺风收口 role 无关 ----
old_off = "        var _v11off=(_v11side==='物理'||_v11side==='特殊'||_v11side==='双刀')&&(_v11role==='增伤'||_v11role==='输出'||_v11role==='强化');\r\n"
t = rep_once(old_off, "", 'v11off-decl')
old_cond = "        if(b.score!==99&&_v11sp>=100&&_v11off&&!_v11prank&&!_v11auto.length&&isGlassCannon(s)){"
new_cond = "        if(b.score!==99&&_v11sp>=100&&!_v11prank&&!_v11auto.length&&isGlassCannon(s)){"
t = rep_once(old_cond, new_cond, 'v11off-cond')

# ---- C: v13 收尾降级/标注块 ----
anchor = "      }catch(eV4381b){eV4381b.name}\r\n    }\r\n"
if t.count(anchor) != 1:
    raise SystemExit('锚点计数 %d' % t.count(anchor))
block = (
"      }catch(eV4381b){eV4381b.name}\r\n"
"      /* v4.382 速度轴 self-centric 收尾：按最终实战招式复核自身速度来源。\r\n"
"         · 无任何当场生效速度来源（种族<100、无天气提速特性、实战无顺风366、无轻装、无讲究围巾、无速度型强化招）\r\n"
"           却仍冠「速攻」名 → 去速攻冠名，改输出/清场定位；\r\n"
"         · 基础速度≥100 但 EV 0 投入且无自有倍率：倍率收敛残留（顺风/天气前缀后置剥离所致），本版不重排 EV/性格，\r\n"
"           同样去速攻冠名（按耐久输出定位），why 注明；\r\n"
"         · 仍保留自有倍率来源（天气提速/保留顺风/轻装/围巾）的速度收敛卡属既定模板，保留并登记为例外。 */\r\n"
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
"            b.v13EvStale=true;\r\n"
"            var _v13New2=_v13nm.replace(/速攻强化清场/,'强化清场').replace(/速攻压制/,'主力输出压制').replace(/轻装速攻流/,'主力输出压制').replace(/速攻流/,'主力输出压制');\r\n"
"            if(_v13New2!==_v13nm){\r\n"
"              b.name=_v13New2;b.v13Demoted=_v13nm+'→'+_v13New2;\r\n"
"              b.nameMismatch=(b.nameMismatch?b.nameMismatch+'；':'')+'原速度依赖已移除（顺风/天气/轻装来源已不在实战招组内）→ 按耐久输出定位，不再冠速度名';\r\n"
"            }\r\n"
"            var _v13why2='原速度依赖已移除（顺风/天气/轻装来源已不在实战招组内），本卡按耐久输出定位，不再冠速度名；速度 EV 未投入，本版未重排 EV/性格，速度线可在详情页速度滑块手动调整';\r\n"
"            (b.mv.main||[]).forEach(function(x){if(x&&x.why)x.why=x.why.concat([_v13why2])});\r\n"
"          }else if(_v13Mult&&+((b.ev||{}).alloc||[])[5]===0){\r\n"
"            /* v4.382 复核：有自有倍率来源但速度 EV=0 的速攻例外卡，按来源分档写明提速来源与失效条件；\r\n"
"               只补 why 文案，不改 EV/性格/判定字段。来源档：天气提速特性 / 保留顺风 / 轻装 / 讲究围巾。 */\r\n"
"            var _v13note=[];\r\n"
"            if(_v13Wx>1){\r\n"
"              var _wxNames=[];\r\n"
"              try{var _wxPool=((s.inns||[]).concat(s.abis||[]));var _wxl=['悠游自如','叶绿素','拨沙','拨雪'];\r\n"
"                _wxPool.forEach(function(pn){for(var wi=0;wi<_wxl.length;wi++){var hit=false;\r\n"
"                  try{hit=abiSame(pn,_wxl[wi])}catch(eWx0){hit=String(pn)===_wxl[wi]}\r\n"
"                  if(hit){var pns=String(pn&&pn.n?pn.n:pn);if(_wxNames.indexOf(pns)<0)_wxNames.push(pns);break;}}});\r\n"
"              }catch(eWx1){eWx1.name}\r\n"
"              _v13note.push('速度来自天气提速特性「'+(_wxNames.join('、')||'叶绿素/悠游自如/拨沙/拨雪')+'」（天气在场 ×1.5），故本卡不投速度；若天气不在场需自行补速');\r\n"
"            }\r\n"
"            if(_v13TwMv)_v13note.push('速度来自本卡保留的顺风(366)提速 ×2，故本卡不投速度；顺风回合结束后需自行补速');\r\n"
"            if(_v13Light)_v13note.push('速度来自轻装特性（道具消耗后速度 ×2），故本卡不投速度；轻装未触发（道具未消耗/被移除）时需自行补速');\r\n"
"            if(_v13Scarf)_v13note.push('速度来自讲究围巾 ×1.5，故本卡不投速度；摘下围巾后需自行补速');\r\n"
"            if(_v13note.length){\r\n"
"              b.v13MultNote=_v13note.join('；');\r\n"
"              (b.mv.main||[]).forEach(function(x){if(x&&x.why)x.why=x.why.concat([b.v13MultNote])});\r\n"
"            }\r\n"
"          }\r\n"
"        }\r\n"
"        b.v13SourceChecked=true;\r\n"
"      }catch(eV4382){eV4382.name}\r\n"
"    }\r\n"
)
t = t.replace(anchor, block, 1)

# ---- C-c: 顺风倍率按实战招式(366)判定，不读名称前缀 ----
old = "  var tailwind=/顺风/.test(name+roleTag);\r\n"
new = ("  var _twMv4382=(b.mv.main||[]).concat(b.mv.func||[]).some(function(x){return +x.id===366});\r\n"
       "  var tailwind=_twMv4382;   /* v4.382：顺风倍率按实战招式判定，不再读名称前缀（前缀可来自可学集误判） */\r\n")
t = rep_once(old, new, 'tailwind-mv')

# ---- F_show: 展示层模板标签 / 旧名溯源前缀（纯展示） ----
pairs = [
    ("function evWhyTxt(t){",
     "function evTplDisp(t){return t==='速攻'?'高速线':String(t||'');}\r\nfunction evWhyTxt(t){"),
    ("if(t==='速攻')return '速攻模板：252 速度抢线",
     "if(t==='速攻')return '高速线模板：252 速度抢线"),
    ("'（'+esc(b.evTpl||'')+'）　性格：'",
     "'（'+esc(evTplDisp(b.evTpl||''))+'）　性格：'"),
    ("((bd.ev&&bd.ev.template)?(' · 模板「'+bd.ev.template+'」'):'')",
     "((bd.ev&&bd.ev.template)?(' · 模板「'+evTplDisp(bd.ev.template)+'」'):'')"),
    ("<b>'+esc(ev.template)+'</b></div>'",
     "<b>'+esc(evTplDisp(ev.template))+'</b></div>'"),
    ("<b>'+esc(bd.ev.template)+'</b>　<span class=\"dim\">'+esc(bd.ev.summary)+'</span>",
     "<b>'+esc(evTplDisp(bd.ev.template))+'</b>　<span class=\"dim\">'+esc(bd.ev.summary)+'</span>"),
    ("l1Modal('努力值 · '+bd.ev.template,full);",
     "l1Modal('努力值 · '+evTplDisp(bd.ev.template),full);"),
    ("'<br><span class=\"dim\">流派原始描述：'+esc(bd.desc)+'</span></div>';",
     "'<br><span class=\"dim\">流派原始描述'+(bd.v13Demoted?'（历史名）':'')+'：'+esc(bd.desc)+'</span></div>';"),
]
for i, (old, new) in enumerate(pairs, 1):
    t = rep_once(old, new, 'f_show-%d' % i)

# ---- 版本号三处：index 一处 + package.json 一处 ----
t = rep_once("ER_ENGINE_VER='v4.381'", "ER_ENGINE_VER='v4.382'", 'ver-index')
io.open(idx, 'w', encoding='utf-8', newline='').write(t)

pkg = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, 'package.json')
pt = io.open(pkg, encoding='utf-8', newline='').read()
if pt.count('"version": "4.381.0"') != 1:
    raise SystemExit('package 版本锚点计数 %d' % pt.count('"version": "4.381.0"'))
io.open(pkg, 'w', encoding='utf-8', newline='').write(pt.replace('"version": "4.381.0"', '"version": "4.382.0"', 1))

d = open(idx, 'rb').read(); tt = d.decode('utf-8')
print('bytes', len(d), 'sha1', hashlib.sha1(d).hexdigest().upper(),
      'CRLF', tt.count('\r\n'), 'bareLF', tt.count('\n') - tt.count('\r\n'))
