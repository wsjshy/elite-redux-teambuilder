# -*- coding: utf-8 -*-
"""v4.385 后置最终化补丁：名字与 EV/性格不一致的卡，复用 buildEvs/buildNature 重算 EV+性格。
从 v4.384 基线 index.html 一步复现 v4.385 最终态。
规则：
  ② 防守身份（role∈肉盾/受队/联防/辅助 或 名含 受队消耗/稳健联防/肉盾/减伤/属性免疫）但攻/特攻 EV≥252 且耐久<252：
     - role 非防守（进攻/轮转/增伤/强化等）→ 本质名字错，记台账留 v4.386 改名，本版不动 EV/性格；
     - role 防守 → 复用 buildEvs/buildNature 重算耐久 EV + 防守性格（空间例外照旧）。
  ③ 性格减项被满投 252（或防守身份挂加速性格）→ 复用 buildEvs/buildNature 重算；重算后仍冲突则回退保留，单列拿不准。
  只改 ev.alloc 与 nat；招组/道具/特性/名字/候选/排序一律不动。
纪律：io.open newline=''；锚点唯一；自包 try/catch 非空；per-build 标记块首显式赋初值；幂等（合规卡不再算）。
用法：python patch_v4385.py [index路径] [package.json路径]（默认仓库内 index.html / package.json）。"""
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
"  }catch(eV4384){eV4384.name}\r\n"
"  return out;}\r\n"
)
block = (
"  }catch(eV4384){eV4384.name}\r\n"
"  /* v4.385 后置最终化（在 eX371 同玩法去重 / eX372 终门 / v383 / v384 收尾之后，输入为最终名的卡）：\r\n"
"     只对「名字与 EV/性格不一致」的卡复用 buildEvs/buildNature 重算 EV+性格；不动招组/道具/特性/名字/候选/排序。\r\n"
"     ② 防守身份进攻配置：role 进攻/轮转 → 台账留 v4.386 改名；role 防守 → 重算耐久。\r\n"
"     ③ 性格减项被满投 252（或防守身份挂加速性格）→ 重算；重算后仍冲突则回退保留，单列拿不准。自包作用域。 */\r\n"
"  try{\r\n"
"    var _v385DEF_ROLE={'肉盾':1,'受队':1,'联防':1,'辅助':1};\r\n"
"    var _v385DEF_NAME=/受队消耗|稳健联防|肉盾|减伤|属性免疫/;\r\n"
"    var _v385SPD_NAT={'爽朗':1,'开朗':1,'胆小':1,'急躁':1,'天真':1};\r\n"
"    function _v385Nat0(b){var n=b.nat;if(Array.isArray(n))return n[0]?String(n[0][0]||''):'';return String(n||'').split(',')[0].trim();}\r\n"
"    function _v385DnIdx(nat){var e=NATURES[nat];if(!e)return -1;var dn=String(e[1]||'');var m={'-攻击':1,'-特攻':3,'-防御':2,'-特防':4,'-速度':5};return Object.prototype.hasOwnProperty.call(m,dn)?m[dn]:-1;}\r\n"
"    function _v385Clash(b){var al=(b.ev&&b.ev.alloc)||[];var n0=_v385Nat0(b);var di=_v385DnIdx(n0);if(di<0)return false;return (+al[di]||0)>=252;}\r\n"
"    function _v385DefSpd(b){return _v385SPD_NAT[_v385Nat0(b)]?true:false;}\r\n"
"    out.forEach(function(b){\r\n"
"      if(!b||!b.name)return;\r\n"
"      var nm=String(b.name),role=String(b.roleTag||''),side=String(b.side||'');\r\n"
"      var al=(b.ev&&b.ev.alloc)||[];\r\n"
"      var offEv=Math.max(al[1]||0,al[3]||0),bulk=(al[0]||0)+(al[2]||0)+(al[4]||0);\r\n"
"      var isDefRole=_v385DEF_ROLE[role]?1:0,isDefName=_v385DEF_NAME.test(nm);\r\n"
"      if(b._v385StallLedger===undefined)b._v385StallLedger=null;\r\n"
"      if(b._v385EvNatureFixed===undefined)b._v385EvNatureFixed=false;\r\n"
"      if(b._v385Uncertain===undefined)b._v385Uncertain=null;\r\n"
"      if(b._v385OldNat===undefined)b._v385OldNat=null;\r\n"
"      if(b._v385NewNat===undefined)b._v385NewNat=null;\r\n"
"      if(b._v385OldAlloc===undefined)b._v385OldAlloc=null;\r\n"
"      if(b._v385NewAlloc===undefined)b._v385NewAlloc=null;\r\n"
"      /* ② 防守身份进攻配置：role 非防守 → 台账留 v4.386 改名，本版不动 EV/性格 */\r\n"
"      if((isDefName||isDefRole)&&offEv>=252&&bulk<252&&!isDefRole){\r\n"
"        b._v385StallLedger='防守名挂进攻配置(role='+role+')，留 v4.386 改名；本版不动 EV/性格';\r\n"
"        return;\r\n"
"      }\r\n"
"      /* ③ 性格×主投资矛盾（含防守身份挂加速性格；② role 防守进攻配置一并重算耐久） */\r\n"
"      var _forceDef=isDefRole&&offEv>=252&&bulk<252;\r\n"
"      var clash=_v385Clash(b)||(isDefRole&&_v385DefSpd(b))||_forceDef;\r\n"
"      if(!clash)return;\r\n"
"      var _oldNat=b.nat,_oldEv=b.ev;\r\n"
"      var _nn=null,_ee=null;\r\n"
"      try{_nn=buildNature(s,side,role,b);}catch(eN5){_nn=null;}\r\n"
"      try{_ee=buildEvs(s,side,role,nm,b);}catch(eE5){_ee=null;}\r\n"
"      if(Array.isArray(_nn)&&_nn.length&&_ee&&_ee.alloc){\r\n"
"        b.nat=_nn;b.ev=_ee;\r\n"
"        if(_v385Clash(b)||(isDefRole&&_v385DefSpd(b))){\r\n"
"          b.nat=_oldNat;b.ev=_oldEv;\r\n"
"          b._v385Uncertain='重算后性格/EV 仍矛盾，保留原配置待人工复核';\r\n"
"        }else{\r\n"
"          b._v385EvNatureFixed=true;\r\n"
"          b._v385OldNat=Array.isArray(_oldNat)&&_oldNat[0]?_oldNat[0][0]:'';\r\n"
"          b._v385NewNat=_nn[0][0];\r\n"
"          b._v385OldAlloc=(_oldEv&&_oldEv.alloc)?_oldEv.alloc.slice():[];\r\n"
"          b._v385NewAlloc=_ee.alloc.slice();\r\n"
"        }\r\n"
"      }else{\r\n"
"        b._v385Uncertain='重算未返回合法性格/EV，保留原配置';\r\n"
"      }\r\n"
"    });\r\n"
"  }catch(eV4385){eV4385.name}\r\n"
"  return out;}\r\n"
)
t = rep_once(anchor_ret, block, 'post-pass-v385')

# ---- 版本号：index 一处 ----
t = rep_once("ER_ENGINE_VER='v4.384'", "ER_ENGINE_VER='v4.385'", 'ver-index')
io.open(idx, 'w', encoding='utf-8', newline='').write(t)

pkg = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, 'package.json')
pt = io.open(pkg, encoding='utf-8', newline='').read()
if pt.count('"version": "4.384.0"') != 1:
    raise SystemExit('package 版本锚点计数 %d' % pt.count('"version": "4.384.0"'))
io.open(pkg, 'w', encoding='utf-8', newline='').write(pt.replace('"version": "4.384.0"', '"version": "4.385.0"', 1))

d = open(idx, 'rb').read(); tt = d.decode('utf-8')
print('bytes', len(d), 'sha1', hashlib.sha1(d).hexdigest().upper(),
      'CRLF', tt.count('\r\n'), 'bareLF', tt.count('\n') - tt.count('\r\n'))
