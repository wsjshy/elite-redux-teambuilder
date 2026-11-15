# -*- coding: utf-8 -*-
"""v4.384 合并引擎补丁：增伤清场无来源归门 + 受队消耗 neither 退出 + 弱点保险高耐久撤首位。
从 v4.383 基线 index.html 一步复现 v4.384 最终态。
规则：
  ① 裸名「增伤清场」且自身无体系来源（无自动体系 / 无自带开体系招）→ 按三条件进攻门归一：
     非变化伤害招≥2 且 攻/特攻 EV≥120 且 ≥1 本系/加成招；过门有强化招→强化清场，过门无强化招→主力输出压制；否则稳健联防。
  ② 名含「受队消耗」且既不满足 A(回复: 剩饭/黑色污泥、再生力144/毒疗90、回复/吸血招) 也不满足
     B(bulk≥300 且含消耗/保命招) → 改判稳健联防，不得既不满足又仍叫受队消耗。
  ③ 弱点保险 322：bulk≥300 首位撤位换续航件（反伤后手流→剩饭+凸凸头盔；替身/耐久强化流→剩饭；其余→剩饭）；
     270–299 保留并 why 注明「仅在被克制命中时生效」。
  只改 name / why / it 首位与标记；不增删流派、不重排 top-4、不动 EV/性格/招组。
纪律：io.open newline=''；锚点唯一；自包 try/catch 非空；per-build 标记块首显式赋初值。
用法：python patch_v4384.py [index路径] [package.json路径]（默认仓库内 index.html / package.json）。"""
import io, os, sys, hashlib

ROOT = r'D:\game\elite-redux'
idx = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'index.html')
t = io.open(idx, encoding='utf-8', newline='').read()

def rep_once(old, new, tag):
    n = t.count(old)
    if n != 1:
        raise SystemExit('锚点不唯一(%d): %s' % (n, tag))
    return t.replace(old, new, 1)

anchor_ret = (
"  }catch(eV4383){eV4383.name}\r\n"
"  return out;}\r\n"
)
block = (
"  }catch(eV4383){eV4383.name}\r\n"
"  /* v4.384 收尾：增伤清场无来源归门 / 受队消耗 neither 退出 / 弱点保险高耐久撤首位。\r\n"
"     只改 name / why / it 首位与标记；不增删流派、不重排 top-4、不动 EV/性格/招组。自包作用域。 */\r\n"
"  try{\r\n"
"    var _v384recMv=[105,202,234,235,236,303,355,409,156,215,361,456,505,532,631,72,71];\r\n"
"    var _v384wearMv=[73,92,261,174,227];\r\n"
"    var _v384protMv=[164,182];\r\n"
"    var _v384boostMv=FUNC_MV.boost.concat([504,526]);\r\n"
"    var _v384setup=[240,241,201,258,580,581,604,641];\r\n"
"    var _v384recItem=['剩饭','黑色污泥'];\r\n"
"    var _v384recAbi={'144':1,'90':1};\r\n"
"    var _v384pre=['精神场地','薄雾场地','场地','电场','晴','雨','沙','雪'];\r\n"
"    function _v384kit(b){var ids=[];(b.mv.main||[]).forEach(function(x){ids.push(+x.id)});(b.mv.func||[]).forEach(function(x){ids.push(+x.id)});return ids}\r\n"
"    function _v384AbiIds(s){return (s.abiIds||[]).concat(s.innIds||[]).map(String)}\r\n"
"    function _v384Prefix(n){for(var i=0;i<_v384pre.length;i++){if(n.indexOf(_v384pre[i])>=0)return _v384pre[i]}return ''}\r\n"
"    function _v384Auto(s){\r\n"
"      if((ownAutoSys(s)||[]).length)return true;\r\n"
"      var re=/出场时(降下|制造|呼风|放晴|扬起|飘雪|展开)|制造.{0,4}场地|视为在大晴天/;\r\n"
"      var ids=_v384AbiIds(s);\r\n"
"      for(var k=0;k<ids.length;k++){var e=_abEnt(ids[k]);if(e&&re.test(String(e[3]||'')))return true}\r\n"
"      return false;\r\n"
"    }\r\n"
"    out.forEach(function(b){\r\n"
"      if(!b||!b.name)return;\r\n"
"      var ids=_v384kit(b);\r\n"
"      var al=(b.ev&&b.ev.alloc)||[];\r\n"
"      var offEv=Math.max(al[1]||0,al[3]||0);\r\n"
"      var dmg=ids.filter(function(id){var r=MV[id];return r&&r[4]!=='变化'}).length;\r\n"
"      var stabT={};if(s.t1)stabT[s.t1]=1;if(s.t2)stabT[s.t2]=1;\r\n"
"      var stab=ids.filter(function(id){var r=MV[id];return r&&r[4]!=='变化'&&stabT[r[3]]}).length;\r\n"
"      var boost=_v384boostMv.some(function(id){return ids.indexOf(id)>=0});\r\n"
"      var bulk=bulkOf(s);\r\n"
"      var nm=String(b.name);\r\n"
"      var it0=b.it&&b.it[0]?String(b.it[0][0]):'';\r\n"
"      var A=_v384recItem.some(function(n){return it0.indexOf(n)>=0})||_v384AbiIds(s).some(function(id){return _v384recAbi[id]})||_v384recMv.some(function(id){return ids.indexOf(id)>=0});\r\n"
"      var B=bulk>=300&&(_v384wearMv.some(function(id){return ids.indexOf(id)>=0})||_v384protMv.some(function(id){return ids.indexOf(id)>=0}));\r\n"
"      if(b._v384BoostReplaced===undefined)b._v384BoostReplaced=null;\r\n"
"      if(b._v384BoostOld===undefined)b._v384BoostOld=null;\r\n"
"      if(b._v384BoostNew===undefined)b._v384BoostNew=null;\r\n"
"      if(b._v384BoostEdgeKept===undefined)b._v384BoostEdgeKept=false;\r\n"
"      /* ③ 弱点保险 322：bulk≥300 撤首位换续航件；270–299 保留并 why 注明 */\r\n"
"      if(it0==='弱点保险'){\r\n"
"        if(bulk>=300){\r\n"
"          var _ctr=/反伤/.test(nm)||String(b.mechRw||'')==='counter_mirror';\r\n"
"          var _rest=_ctr?['剩饭','站场续航（耐久核主食；弱点保险仅被克制命中才翻双攻，高耐久不必赌一次触发）']:['剩饭','站场续航（高耐久被克制命中后翻双攻收益不如直接续航）'];\r\n"
"          var _helm=_ctr?['凸凸头盔','物攻手碰瓷反伤（耐久核站场反伤配套）']:null;\r\n"
"          var _rest2=(b.it||[]).filter(function(x){return String(x[0])!=='弱点保险'&&String(x[0])!=='剩饭'});\r\n"
"          var _nw=[_rest]; if(_helm)_nw.push(_helm); _rest2.forEach(function(x){_nw.push(x)});\r\n"
"          b.it=_nw.slice(0,3);\r\n"
"          b._v384BoostReplaced=true;b._v384BoostOld='弱点保险';b._v384BoostNew=String(b.it[0][0]);\r\n"
"        }else if(bulk>=270){\r\n"
"          var _why=String((b.it&&b.it[0]&&b.it[0][1])||'');\r\n"
"          if(_why.indexOf('仅在被克制命中时生效')<0)b.it[0][1]=_why+'；仅在被克制命中时生效';\r\n"
"          b._v384BoostEdgeKept=true;\r\n"
"        }\r\n"
"      }\r\n"
"      /* ② 受队消耗 neither：无回复且非高耐久+消耗/保命 → 退出受队消耗，归稳健联防 */\r\n"
"      if(nm.indexOf('受队消耗')>=0&&!(A||B)){\r\n"
"        b.name='稳健联防';\r\n"
"        b._v384Demoted=nm+'→稳健联防';\r\n"
"        b.nameMismatch=(b.nameMismatch?b.nameMismatch+'；':'')+'无回复手段且非高耐久+消耗/保命配置 → 退出受队消耗，按耐久配置归联防';\r\n"
"        nm=b.name;\r\n"
"      }\r\n"
"      /* ① 裸名增伤清场且自身无体系来源 → 按三条件进攻门归一 */\r\n"
"      if(nm.indexOf('增伤清场')>=0&&!_v384Prefix(nm)){\r\n"
"        var hasSetup=_v384setup.some(function(id){return ids.indexOf(id)>=0});\r\n"
"        if(!_v384Auto(s)&&!hasSetup){\r\n"
"          var gate=dmg>=2&&offEv>=120&&stab>=1;\r\n"
"          var target=gate?(boost?'强化清场':'主力输出压制'):'稳健联防';\r\n"
"          b.name=target;\r\n"
"          b._v384Demoted=(b._v384Demoted||'增伤清场')+'→'+target;\r\n"
"          b.nameMismatch=(b.nameMismatch?b.nameMismatch+'；':'')+'自身无自动体系/自带开体系招/体系加成，去增伤清场冠名，按三条件进攻门落既有流派';\r\n"
"        }\r\n"
"      }\r\n"
"    });\r\n"
"  }catch(eV4384){eV4384.name}\r\n"
"  return out;}\r\n"
)
t = rep_once(anchor_ret, block, 'post-pass-v384')

# ---- 版本号：index 一处 ----
t = rep_once("ER_ENGINE_VER='v4.383'", "ER_ENGINE_VER='v4.384'", 'ver-index')
io.open(idx, 'w', encoding='utf-8', newline='').write(t)

pkg = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, 'package.json')
pt = io.open(pkg, encoding='utf-8', newline='').read()
if pt.count('"version": "4.383.0"') != 1:
    raise SystemExit('package 版本锚点计数 %d' % pt.count('"version": "4.383.0"'))
io.open(pkg, 'w', encoding='utf-8', newline='').write(pt.replace('"version": "4.383.0"', '"version": "4.384.0"', 1))

d = open(idx, 'rb').read(); tt = d.decode('utf-8')
print('bytes', len(d), 'sha1', hashlib.sha1(d).hexdigest().upper(),
      'CRLF', tt.count('\r\n'), 'bareLF', tt.count('\n') - tt.count('\r\n'))
