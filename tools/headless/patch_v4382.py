# -*- coding: utf-8 -*-
"""v4.382 文本级补丁（A: 速度轴/tr 轴 self-centric + 空间×速攻互斥；B: 顺风收口 role 无关）。
纪律：io.open newline=''，新增行 \r\n；锚点唯一；自包 try/catch 非空。"""
import io, os, sys

ROOT = r'D:\game\elite-redux'
idx = os.path.join(ROOT, 'index.html')
txt = io.open(idx, encoding='utf-8', newline='').read()

def rep_once(old, new, tag):
    n = txt.count(old)
    if n != 1:
        raise SystemExit('锚点不唯一(%d): %s' % (n, tag))
    return txt.replace(old, new, 1)

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
"  try{var _wm=pvWeatherSpeedMul(s)||1;if(_wm>1){mul*=_wm;notes.push('天气提速特性 ×'+_wm)}}catch(eSs1){}\r\n"
"  if(p&&p.fn&&p.fn.tw){mul*=2;notes.push('自开顺风 ×2')}\r\n"
"  var _lb=((s.abis||[]).indexOf('轻装')>-1)||((s.inns||[]).indexOf('轻装')>-1);\r\n"
"  if(_lb){mul*=2;notes.push('轻装消耗后 ×2')}\r\n"
"  var eff=Math.round(spd*mul);\r\n"
"  return {ok:eff>=NEED_CFG.SPEED_HIGH,mul:mul,eff:eff,notes:notes};\r\n"
"}\r\n"
)
txt = rep_once(anchor_helper, helper_new, 'helper')

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
txt = rep_once(old_speed, new_speed, 'speed-cand')

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
txt = rep_once(old_tr, new_tr, 'tr-cand')

# ---- B: 顺风收口 role 无关（去掉进攻 role 白名单；肉盾/受队/联防/辅助玻璃一并收） ----
old_off = "        var _v11off=(_v11side==='物理'||_v11side==='特殊'||_v11side==='双刀')&&(_v11role==='增伤'||_v11role==='输出'||_v11role==='强化');\r\n"
txt = rep_once(old_off, "", 'v11off-decl')
old_cond = "        if(b.score!==99&&_v11sp>=100&&_v11off&&!_v11prank&&!_v11auto.length&&isGlassCannon(s)){"
new_cond = "        if(b.score!==99&&_v11sp>=100&&!_v11prank&&!_v11auto.length&&isGlassCannon(s)){"
txt = rep_once(old_cond, new_cond, 'v11off-cond')

io.open(idx, 'w', encoding='utf-8', newline='').write(txt)
print('patch v4382 A+B applied OK')
