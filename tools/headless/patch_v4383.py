# -*- coding: utf-8 -*-
"""v4.383 合并引擎补丁：减伤轴/轮转 self-centric（收尾块 rewriting，不动候选集合/排序/kit）。
从 v4.382 基线 index.html 一步复现 v4.383 最终态。
规则：
  ① 减伤轴判定只认该卡实际 abi[0]（含固定天性），不看物种可选特性池：abi[0] 属真减伤 id 集才保留减伤轴冠名；
     纯属性免疫/保命/回复/无特性一律降级到既有流派名。
  ② 凡卡名含「轮转」，4 招必须真含 369/521；无 pivot 降级到既有流派名。
  ③ 强化减伤轴必须 abi[0] 是 RED 且有强化招；缺强化招降纯「减伤轴」，缺减伤按招组落强化/输出名。
  ④ 只改名/降级与补 why 文案；候选是否生成、是否入选 top-4、EV/性格/道具/招组一律不动。
纪律：io.open newline=''；锚点唯一；自包 try/catch 非空；per-build 标记块首显式赋初值。
用法：python patch_v4383.py [index路径] [package.json路径]（默认仓库内 index.html / package.json）。"""
import io, os, sys, hashlib

ROOT = r'D:\game\elite-redux'
idx = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'index.html')
t = io.open(idx, encoding='utf-8', newline='').read()

def rep_once(old, new, tag):
    n = t.count(old)
    if n != 1:
        raise SystemExit('锚点不唯一(%d): %s' % (n, tag))
    return t.replace(old, new, 1)

RED_IDS = [4,17,40,47,75,79,85,100,111,116,134,136,142,169,195,199,200,218,231,232,244,246,272,283,296,303,306,311,313,317,318,337,342,392,399,431,440,442,445,482,499,524,526,539,547,571,582,585,613,660,664,671,678,682,705,709,712,726,741,753,754,759,764,773,779,804,805,817,822,829,838,855,860,873,881,889,900,904,922,925,932,936,944,948,954,957,962,965,968,970,986,997,1004,1010,1021,1022,1031,1032,1048,1053]
RED_LIT = ','.join(str(x) for x in RED_IDS)

# ---- A: RED/保命/回复 id 集 + 卡片级 abi[0] 判定 helper（插在 abiImHf 闭合之后） ----
anchor_hf = (
"  apply(s.inns,'天性');apply(s.abis,'可选');\r\n"
"  return {im:im,hf:hf,hfMul:hfMul,nt:nt,phy:phy};\r\n"
"}\r\n"
)
helper_new = anchor_hf + (
"/* v4.383：减伤轴 self-centric 权威判据（判据只走特性 id，不按特性名白名单猜；只认该卡实际 abi[0]，不看物种可选池）。\r\n"
"   RED_ABI_IDS：源码 .onDefensiveMultiplier / .onAfterTypeEffectiveness 防守侧真减伤 id 集\r\n"
"   （多重鳞片/幻影防守/毛皮大衣/毛茸茸/厚脂肪/坚硬岩石/过滤/水泡/热交换等逐条源码核实）。\r\n"
"   已排除：纯属性免疫（独立「属性免疫联防位」流派）；结实/画皮/复活类一次性保命；\r\n"
"   再生/毒疗/自然回复类续航；神奇守护(25，非 SE 招伤害归零＝判定改写型免疫)；强投手(864，每次上场一次接触半减)。\r\n"
"   标签 HF（abiTagOf.hf，复合特性递归合并）作为兜底。 */\r\n"
"var RED_ABI_IDS=new Set([" + RED_LIT + "]);\r\n"
"var SURV_ABI_IDS=new Set([5,209,248,427,429,583,629,899,864]);\r\n"
"var REC_ABI_IDS=new Set([30,44,61,82,90,93,102,115,131,139,144,247,307,333,415,566,875,886,890,991]);\r\n"
"var REC_DESC_RE=/回复最大HP|每回合回复|回复造成伤害|吸取.*HP|回复1\\/|治愈自身|治愈异常|替换下场时,治愈|下场时回复|回复2\\/3|回复1\\/4|回复1\\/8|回复1\\/16|回复1\\/3/;\r\n"
"function _v383Abi0(b){var a=b&&b.abi&&b.abi[0];if(!a)return{n:'',id:''};var id=String(a.id||NM2ID[a.n]||'');return{n:a.n,id:id}}\r\n"
"function _v383RedAbi(a){if(!a||!a.id)return false;if(RED_ABI_IDS.has(a.id)||RED_ABI_IDS.has(+a.id))return true;var tg=abiTagOf(a.n);return !!(tg&&tg.hf&&tg.hf.length)}\r\n"
"function _v383ImmAbi(a){if(!a)return false;var tg=abiTagOf(a.n);return !!(tg&&tg.im&&tg.im.length)}\r\n"
"function _v383SurvAbi(a){return !!(a&&a.id&&(SURV_ABI_IDS.has(a.id)||SURV_ABI_IDS.has(+a.id)))}\r\n"
"function _v383RecAbi(a){if(!a||!a.id)return false;if(REC_ABI_IDS.has(a.id)||REC_ABI_IDS.has(+a.id))return true;var e=_abEnt(a.id);return !!(e&&REC_DESC_RE.test(String(e[3]||'')))}\r\n"
)
t = rep_once(anchor_hf, helper_new, 'helper-hf')

# ---- E: 收尾降级/写实 why 块（插在 eX372 之后、return out 之前）。只改身份/命名/why，不动候选与 kit。 ----
anchor_ret = (
"  }catch(eX372){eX372.name}\r\n"
"  return out;}\r\n"
)
block = (
"  }catch(eX372){eX372.name}\r\n"
"  /* v4.383 减伤轴/轮转 self-centric 收尾：对已生成流派按「该卡实际 abi[0] + 实战招组」复核冠名。\r\n"
"     · 名含「减伤轴」但 abi[0] 非 RED → 降级：纯属性免疫→属性免疫联防位；保命/回复→受队消耗；其余按招组落强化清场/轮转补盲/主力输出压制/受队消耗；\r\n"
"     · 「强化减伤轴」缺强化招 → 降纯「减伤轴」；\r\n"
"     · 名含「轮转」但 4 招无 369/521 → 降级到非轮转既有名；\r\n"
"     · 保留的减伤轴：why 写实（特性 id + 描述 + 源码幅度/生效条件；文案与源码不一致并列写明）。\r\n"
"     本块不增删流派、不重排 top-4、不动 EV/性格/道具/招组。 */\r\n"
"  try{\r\n"
"    var _v383boostIds=FUNC_MV.boost.concat([504,526]);\r\n"
"    var _v383pivIds=[369,521];\r\n"
"    var _v383ov={'317':'文案「效果绝佳 −25%」/ 源码 MUL(.65) 实测 −35%（效果绝佳时）',\r\n"
"      '582':'文案「效果绝佳 −25%」/ 源码 MUL(.65) 实测 −35%（效果绝佳时）',\r\n"
"      '200':'文案仅写钢招威力 1.3 倍；源码防守侧：自身含钢属性时恶/幽灵招 ×0.5',\r\n"
"      '442':'文案仅写进攻 +50%；源码防守侧：受妖精属性招 ×0.5',\r\n"
"      '440':'源码防守侧 MUL(.5)：受到所有招式伤害 ×0.5（复合：变色+变换自如+毛皮大衣+冰鳞粉）',\r\n"
"      '499':'源码防守侧：效果绝佳招 MUL(.65)（−35%）',\r\n"
"      '524':'源码防守侧：声音类招 MUL(.5)（×0.5）',\r\n"
"      '613':'源码防守侧：物理招 MUL(.5)（×0.5）',\r\n"
"      '664':'源码防守侧：火招 RESISTANCE(.5)（×0.5）',\r\n"
"      '671':'源码防守侧：击中要害时 MUL(.25)（×1/4）',\r\n"
"      '678':'源码防守侧：接触招 MUL(.5)、火招 RESISTANCE(2.0)（×2 弱点）；文案「接触1/4、火4倍」与源码不符',\r\n"
"      '682':'源码防守侧：火招 RESISTANCE(.5)（×0.5）',\r\n"
"      '726':'源码防守侧：声音类招 MUL(.5)（×0.5）',\r\n"
"      '741':'源码防守侧：本回合未出手前 MUL(.7)（−30%）',\r\n"
"      '773':'源码防守侧：特性生效期间效果绝佳招 ×0.5',\r\n"
"      '779':'源码防守侧：HP 全满时 MUL(.5)（掉血后失效）',\r\n"
"      '817':'源码防守侧：愤怒状态 MUL(.8)（−20%）；文案「减半/降低50%」与源码不符',\r\n"
"      '829':'源码防守侧：自身含钢属性时恶/幽灵招 ×0.5',\r\n"
"      '881':'源码防守侧：岩石招 RESISTANCE(.5)（×0.5）',\r\n"
"      '900':'源码防守侧：沙暴下特殊招 MUL(.5)（×0.5）',\r\n"
"      '925':'源码防守侧：特殊招 MUL(.5)（×0.5）',\r\n"
"      '932':'源码防守侧：第一次受到攻击 MUL(.65)（−35%，一次性）',\r\n"
"      '936':'源码防守侧：火/冰招 RESISTANCE(.5)（×0.5）',\r\n"
"      '948':'源码防守侧：接触招 MUL(.5)、火招 RESISTANCE(2.0)（×2 弱点）',\r\n"
"      '954':'源码防守侧：火/冰招 RESISTANCE(.5)（×0.5）',\r\n"
"      '962':'源码防守侧：特殊招 MUL(.7)（−30%）',\r\n"
"      '968':'源码防守侧：MUL(.8)（−20%）+ 免疫击中要害',\r\n"
"      '970':'源码防守侧：MUL(.8)（−20%）+ 免疫击中要害',\r\n"
"      '997':'源码防守侧：MUL(.8)（−20%）+ 免疫击中要害',\r\n"
"      '1004':'源码防守侧：被抵抗招 MUL(.7)（−30%）、其余 MUL(.85)（−15%）；文案「10%/20%」条件与幅度均不符',\r\n"
"      '1010':'源码防守侧：火招 RESISTANCE(.5)（×0.5）',\r\n"
"      '1032':'源码防守侧：草招 RESISTANCE(.5)（×0.5）',\r\n"
"      '1048':'源码防守侧：攻击方为虫属性时 MUL(.5)（×0.5）',\r\n"
"      '1053':'源码防守侧：火招 RESISTANCE(.5)（×0.5）'};\r\n"
"    out.forEach(function(b){\r\n"
"      if(!b||!b.name)return;\r\n"
"      var _v383mv=(b.mv.main||[]).map(function(x){return +x.id}).concat((b.mv.func||[]).map(function(x){return +x.id}));\r\n"
"      var _v383a0=_v383Abi0(b);\r\n"
"      var _v383red=_v383RedAbi(_v383a0),_v383imm=_v383ImmAbi(_v383a0),_v383sur=_v383SurvAbi(_v383a0),_v383rec=_v383RecAbi(_v383a0);\r\n"
"      var _v383boost=_v383mv.some(function(id){return _v383boostIds.indexOf(id)>=0});\r\n"
"      var _v383piv=_v383pivIds.some(function(id){return _v383mv.indexOf(id)>=0});\r\n"
"      var _v383al=(b.ev&&b.ev.alloc)||[];\r\n"
"      var _v383offEv=Math.max(_v383al[1]||0,_v383al[3]||0);\r\n"
"      var _v383dmg=_v383mv.filter(function(id){var r=MV[id];return r&&r[4]!=='变化'}).length;\r\n"
"      var _v383off=_v383dmg>=2&&_v383offEv>=120;\r\n"
"      var _v383nm=String(b.name);\r\n"
"      function _v383route(){\r\n"
"        if(_v383imm)return '属性免疫联防位';\r\n"
"        if(_v383off)return _v383boost?'强化清场':'主力输出压制';\r\n"
"        if(_v383piv)return '轮转补盲';\r\n"
"        return '受队消耗';\r\n"
"      }\r\n"
"      /* 轮转族：无 pivot 一律去轮转冠名 */\r\n"
"      if(_v383nm.indexOf('轮转')>=0&&!_v383piv){\r\n"
"        var _v383t=_v383route();\r\n"
"        b.name=_v383t;b.v383Demoted=_v383nm+'→'+_v383t;\r\n"
"        b.nameMismatch=(b.nameMismatch?b.nameMismatch+'；':'')+'无急速折返369/伏特替换521 游击招 → 去轮转冠名（按招组落既有流派）';\r\n"
"        _v383nm=_v383t;\r\n"
"      }\r\n"
"      /* 减伤轴族：只认 abi[0] 是否 RED */\r\n"
"      if(_v383nm.indexOf('减伤轴')>=0){\r\n"
"        if(_v383red){\r\n"
"          if(_v383nm.indexOf('强化减伤轴')>=0&&!_v383boost){\r\n"
"            var _v383fix=_v383nm.replace('强化减伤轴','减伤轴');\r\n"
"            b.name=_v383fix;b.v383Demoted=_v383nm+'→'+_v383fix;\r\n"
"            b.nameMismatch=(b.nameMismatch?b.nameMismatch+'；':'')+'缺强化招 → 降纯减伤轴';\r\n"
"            _v383nm=_v383fix;\r\n"
"          }\r\n"
"          /* why 写实：特性 id + 描述 + 源码幅度/生效条件；不一致并列写明 */\r\n"
"          var _v383re=_abEnt(_v383a0.id);\r\n"
"          var _v383why='自身减伤特性「'+_v383a0.n+'」('+_v383a0.id+')：'+(_v383re?String(_v383re[3]||'').split('\\n')[0]:'');\r\n"
"          if(_v383ov[_v383a0.id])_v383why+='；'+_v383ov[_v383a0.id];\r\n"
"          if(b.abi&&b.abi[0]&&b.abi[0].why&&b.abi[0].why.indexOf(_v383why)<0)b.abi[0].why.push(_v383why);\r\n"
"          (b.mv.main||[]).forEach(function(x){if(x&&x.why&&x.why.indexOf(_v383why)<0)x.why.push(_v383why)});\r\n"
"        }else{\r\n"
"          var _v383t2=_v383route();\r\n"
"          b.name=_v383t2;b.v383Demoted=_v383nm+'→'+_v383t2;\r\n"
"          b.nameMismatch=(b.nameMismatch?b.nameMismatch+'；':'')+'首推特性非真减伤（免疫/保命/回复/无特性）→ 去减伤轴冠名，按招组落既有流派';\r\n"
"        }\r\n"
"      }\r\n"
"    });\r\n"
"  }catch(eV4383){eV4383.name}\r\n"
"  return out;}\r\n"
)
t = rep_once(anchor_ret, block, 'post-pass')

# ---- 版本号：index 一处 ----
t = rep_once("ER_ENGINE_VER='v4.382'", "ER_ENGINE_VER='v4.383'", 'ver-index')
io.open(idx, 'w', encoding='utf-8', newline='').write(t)

pkg = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, 'package.json')
pt = io.open(pkg, encoding='utf-8', newline='').read()
if pt.count('"version": "4.382.0"') != 1:
    raise SystemExit('package 版本锚点计数 %d' % pt.count('"version": "4.382.0"'))
io.open(pkg, 'w', encoding='utf-8', newline='').write(pt.replace('"version": "4.382.0"', '"version": "4.383.0"', 1))

d = open(idx, 'rb').read(); tt = d.decode('utf-8')
print('bytes', len(d), 'sha1', hashlib.sha1(d).hexdigest().upper(),
      'CRLF', tt.count('\r\n'), 'bareLF', tt.count('\n') - tt.count('\r\n'))
