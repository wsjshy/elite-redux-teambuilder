# -*- coding: utf-8 -*-
"""v4.386 后置 pass：① strict 进攻卡移 [0]（白名单/loose 台账）；② 睡觉 156 替换（37 自回血 / 66 补盲或守住）；
③ 9 条错名改既有流派名（只改名）；④ 展示层 D-6 性格候选按首项归一过滤（引擎 nat 数组不改）；
⑤ 展示层默认首卡/首 tab 锚定引擎 builds[0]（只动展示列表顺序，不动引擎 out 与卡内容）。
从 v4.385 基线 index.html 一步复现 v4.386 最终态。
纪律：io.open newline=''；锚点唯一；自包 try/catch 非空；per-build 标记块首显式赋初值；幂等；
只在 ① 动数组顺序、② 动睡觉槽招式、③ 动 name、④ 动展示渲染文本；EV/性格/道具/特性/候选不重算。
用法：python patch_v4386.py [index路径] [package.json路径]。"""
import io, os, sys, hashlib

ROOT = r'D:\game\elite-redux'
idx = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'index.html')
t = io.open(idx, encoding='utf-8', newline='').read()

def rep_once(old, new, tag):
    n = t.count(old)
    if n != 1:
        raise SystemExit('锚点不唯一(%d): %s' % (n, tag))
    return t.replace(old, new, 1)

# ---------- ①②③ 引擎后置 pass（插在 eV4385 catch 之后、return out 之前） ----------
anchor_ret = (
"  }catch(eV4385){eV4385.name}\r\n"
"  return out;}\r\n"
)
L = []
L.append("  }catch(eV4385){eV4385.name}\r\n")
L.append("  /* v4.386 后置 pass（在 eX371 同玩法去重 / eX372 终门 / v383 / v384 / v385 收尾之后，输入为最终名的卡）：\r\n")
L.append("     ① 进攻身份物种存在过 strict 三条件门的进攻卡时，把该进攻卡移到 builds[0]；被挤下的机制/防守卡保留为备选，不删不改内容；\r\n")
L.append("        白名单 rw（imposter_anchor / toxic_heal_item）维持 [0]；只有 loose 进攻卡、未过 strict 门的物种记台账不重排。\r\n")
L.append("     ② 玻璃大炮（速≥100 且 bulk<270）卡面含睡觉 156：可学严格自回血 → 换自回血；无可学自回血 → 换可学补盲伤害招（异属性优先，按引擎评分取最高），无合格补盲再用守住 182。\r\n")
L.append("     ③ 9 条错名改既有流派名，只改 name；EV/性格/招组/道具/特性不动。自包作用域。 */\r\n")
L.append("  try{\r\n")
L.append("    var _v386DEF_ROLE={'肉盾':1,'受队':1,'联防':1,'辅助':1};\r\n")
L.append("    var _v386OFF_ROLE={'输出':1,'强化':1,'增伤':1};\r\n")
L.append("    var _v386OFF_SIDE={'物理':1,'特殊':1,'双刀':1};\r\n")
L.append("    var _v386TRUE_RW={'imposter_anchor':1,'toxic_heal_item':1};\r\n")
L.append("    var _v386REC={105:1,234:1,235:1,236:1,355:1,303:1,135:1,208:1,631:1,275:1,392:1,622:1,744:1,915:1,202:1,409:1,532:1,72:1,71:1,837:1,73:1};\r\n")
L.append("    var _v386REC_PREF=[105,355,234,235,236,303,135,208,631,275,392,622,744,915,202,409,532,72,71,837,73];\r\n")
L.append("    /* 1643-1647 洛托姆五形态 spd=86>60，撞 v4.382「慢速重炮 spd>60=0」硬门，本版不改名单独上报；其余按既有身份门改名 */\r\n")
L.append("    var _v386RENAMES={'636':['属性免疫联防位','慢速重炮','辅助','辅助',[252,0,4,252,0,0]],'871':['属性免疫联防位','慢速重炮','辅助','辅助',[252,0,4,252,0,0]],'2290':['钉子破盾','钉子主力输出压制','双刀','输出',[4,0,0,252,0,252]],'1729':['稳健联防','速攻压制','物理','输出',[4,252,0,0,0,252]]};\r\n")
L.append("    function _v386MvIds(b){return (b.mv.main||[]).concat(b.mv.func||[]).map(function(x){return +x.id});}\r\n")
L.append("    function _v386DmgN(ids){return ids.filter(function(id){return MV[id]&&MV[id][4]!=='变化'}).length;}\r\n")
L.append("    function _v386StabN(s,ids){return ids.filter(function(id){var m=MV[id];return m&&m[4]!=='变化'&&(s.t1===m[3]||s.t2===m[3])}).length;}\r\n")
L.append("    function _v386OffEv(a){return Math.max(a[1]||0,a[3]||0);}\r\n")
L.append("    function _v386LooseOff(b){return _v386OFF_SIDE[String(b.side)]&&_v386OFF_ROLE[String(b.roleTag)];}\r\n")
L.append("    function _v386Strict(s,b){var a=(b.ev&&b.ev.alloc)||[],ids=_v386MvIds(b);return _v386LooseOff(b)&&_v386DmgN(ids)>=2&&_v386OffEv(a)>=120&&_v386StabN(s,ids)>=1;}\r\n")
L.append("    function _v386Def(b){return _v386DEF_ROLE[String(b.roleTag)]||String(b.side)==='辅助';}\r\n")
L.append("    function _v386Ident(s){return (+s.base[5]||0)>=100||Math.max(+s.base[1]||0,+s.base[3]||0)>=110;}\r\n")
# ③ 改名
L.append("    /* ③ 改名：只改 name，其余字段不动；per-build 标记显式重置 */\r\n")
L.append("    out.forEach(function(b){\r\n")
L.append("      if(!b||!b.name)return;\r\n")
L.append("      var rid=_v386RENAMES[String(s.id)];\r\n")
L.append("      if(!rid)return;\r\n")
L.append("      if(b._v386Renamed===undefined)b._v386Renamed=null;\r\n")
L.append("      if(b._v386OldName===undefined)b._v386OldName=null;\r\n")
L.append("      var _ra=(b.ev&&b.ev.alloc)||[];\r\n")
L.append("      var _raOk=rid[4].length===_ra.length&&rid[4].every(function(v,i){return (+_ra[i]||0)===v;});\r\n")
L.append("      if(String(b.name)===rid[0]&&String(b.side)===rid[2]&&String(b.roleTag)===rid[3]&&_raOk){b._v386OldName=String(b.name);b.name=rid[1];b._v386Renamed=rid[1];}\r\n")
L.append("    });\r\n")
# ② 睡觉替换
L.append("    /* ② 睡觉 156 替换：先可学严格自回血，再补盲伤害招，最后守住 182 */\r\n")
L.append("    out.forEach(function(b){\r\n")
L.append("      if(!b||!b.mv)return;\r\n")
L.append("      var ids=_v386MvIds(b);\r\n")
L.append("      if(ids.indexOf(156)<0)return;\r\n")
L.append("      if(!isGlassCannon(s))return;\r\n")
L.append("      if(b._v386MvSwap===undefined)b._v386MvSwap=null;\r\n")
L.append("      var kit={};ids.forEach(function(id){kit[''+id]=1});\r\n")
L.append("      var learn=learnOf(s);\r\n")
L.append("      var heal=null;\r\n")
L.append("      for(var pi=0;pi<_v386REC_PREF.length;pi++){var hid=_v386REC_PREF[pi];if(learn.indexOf(hid)>-1&&!kit[''+hid]){heal=hid;break;}}\r\n")
L.append("      var main=b.mv.main||[],func=b.mv.func||[],slotArr=null,slotIdx=-1;\r\n")
L.append("      var mi=main.findIndex(function(x){return +x.id===156});\r\n")
L.append("      if(mi>=0){slotArr=main;slotIdx=mi;}else{var fi=func.findIndex(function(x){return +x.id===156});if(fi>=0){slotArr=func;slotIdx=fi;}}\r\n")
L.append("      if(!slotArr)return;\r\n")
L.append("      if(heal!=null){\r\n")
L.append("        var hm=MV[heal];\r\n")
L.append("        var hvamp=hm&&hm[4]!=='变化';\r\n")
L.append("        slotArr[slotIdx]={id:heal,kind:hvamp?hm[4]:'rec',tag:hvamp?'吸血':'回复',why:['可学自回血 '+hm[1]+' 替代睡觉156：站场续航（'+(hvamp?('威力'+(hm[5]||0)):'变化招')+'，命中'+(hm[6]||0)+'）']};\r\n")
L.append("        b._v386MvSwap='sleep→'+heal+' '+hm[1];\r\n")
L.append("        return;\r\n")
L.append("      }\r\n")
L.append("      var effSide=String(b.side);\r\n")
L.append("      if(!_v386OFF_SIDE[effSide]){var ph=0,sp=0;ids.forEach(function(id){var m=MV[id];if(!m)return;if(m[4]==='物理')ph++;else if(m[4]==='特殊')sp++;});effSide=ph>=sp?'物理':'特殊';}\r\n")
L.append("      var pool=[];\r\n")
L.append("      try{pool=_pickAttacksCore(s,effSide,4,String(b.roleTag||'输出'))||[];}catch(eP){pool=[];}\r\n")
L.append("      var cand=pool.filter(function(c){return c&&!kit[''+c.id];});\r\n")
L.append("      cand.sort(function(a,c2){return c2.score-a.score;});\r\n")
L.append("      var cover=cand.filter(function(c){return !c.stab;});\r\n")
L.append("      var pick=cover[0]||cand[0]||null;\r\n")
L.append("      if(pick){\r\n")
L.append("        slotArr[slotIdx]={id:pick.id,kind:pick.stab?'attack':'cover',tag:pick.stab?'本系':'补盲',why:(pick.why||[]).slice()};\r\n")
L.append("        b._v386MvSwap='sleep→'+pick.id+' '+MV[pick.id][1];\r\n")
L.append("      }else{\r\n")
L.append("        slotArr[slotIdx]={id:182,kind:'变化',tag:'保命',why:['守住182：无可学补盲伤害招，保命挡一击（替代睡觉156）']};\r\n")
L.append("        b._v386MvSwap='sleep→182 守住';\r\n")
L.append("      }\r\n")
L.append("    });\r\n")
# ① 排序
L.append("    /* ① 排序：strict 进攻卡移 [0]；白名单不动；仅 loose 记台账 */\r\n")
L.append("    if(_v386Ident(s)){\r\n")
L.append("      var first=out[0];\r\n")
L.append("      var strict=out.filter(function(b){return _v386Strict(s,b);});\r\n")
L.append("      if(_v386Def(first)&&strict.length){\r\n")
L.append("        if(!_v386TRUE_RW[first.mechRw]){\r\n")
L.append("          var lead=strict[0],ix=out.indexOf(lead);\r\n")
L.append("          if(ix>0){out.splice(ix,1);out.unshift(lead);if(lead._v386Reordered===undefined)lead._v386Reordered=true;}\r\n")
L.append("        }\r\n")
L.append("      }else if(_v386Def(first)&&out.some(_v386LooseOff)&&!strict.length){\r\n")
L.append("        if(first._v386LooseLedger===undefined)first._v386LooseLedger='仅 loose 进攻卡、未过 strict 三条件门，本版不重排';\r\n")
L.append("      }\r\n")
L.append("    }\r\n")
L.append("  }catch(eV4386){eV4386.name}\r\n")
L.append("  return out;}\r\n")
block = ''.join(L)
t = rep_once(anchor_ret, block, 'post-pass-v386')

# ---------- ④ 展示层：D-6 性格候选按首项归一过滤（不改引擎 nat 数组） ----------
anchor_nat = (
"  h+='<div class=\"fld\"><div class=\"fhd\"><span class=\"fno\">5</span>性格 + 原因</div><div>'+\r\n"
"    ((((bd.nat||[]).length))?(bd.nat.map(function(n){return '<span class=\"abi\">'+esc(n[0])+'</span><span class=\"dim\"> '+esc(n[1])+'</span>'}).join('　')):'<span class=\"dim\">—</span>')+'</div></div>';\r\n"
)
nat_block = (
"  h+='<div class=\"fld\"><div class=\"fhd\"><span class=\"fno\">5</span>性格 + 原因</div><div>'+\r\n"
"    (function(){\r\n"
"      var _v386nat=bd.nat||[],_v386kept=[],_v386plus={},_v386neg={};\r\n"
"      _v386nat.forEach(function(n){\r\n"
"        var _nm=String((n&&n[0])||''),_e=(typeof NATURES!=='undefined'&&NATURES[_nm])||null;\r\n"
"        var _p=_e?String(_e[0]||''):'',_d=_e?String(_e[1]||''):'';\r\n"
"        if(!_v386kept.length){_v386kept.push(n);if(_p)_v386plus[_p.slice(1)]=1;if(_d)_v386neg[_d.slice(1)]=1;return;}\r\n"
"        var _clash=(_p&&_v386neg[_p.slice(1)])||(_d&&_v386plus[_d.slice(1)]);\r\n"
"        if(!_clash){_v386kept.push(n);if(_p)_v386plus[_p.slice(1)]=1;if(_d)_v386neg[_d.slice(1)]=1;}\r\n"
"      });\r\n"
"      return _v386kept.length?_v386kept.map(function(n){return '<span class=\"abi\">'+esc(n[0])+'</span><span class=\"dim\"> '+esc(n[1])+'</span>'}).join('　'):'<span class=\"dim\">—</span>';\r\n"
"    })()+'</div></div>';\r\n"
)
t = rep_once(anchor_nat, nat_block, 'nat-filter-v386')

# ---------- ⑤ 展示层：默认首卡/首 tab 锚定引擎 builds[0]（不动引擎 out 顺序与卡内容） ----------
anchor_show = "  var showList=_mainReps.concat(_foldReps).concat(_mergeFroms);"
show_block = (
"  var showList=_mainReps.concat(_foldReps).concat(_mergeFroms);\r\n"
"  /* v4.386 ⑤ 展示层默认位锚定：classifyBuilds 内部按 score 降序分组的结果保留，但默认首卡/首 tab 锚定引擎 builds[0]\r\n"
"     （① 后置 pass 已把 strict 进攻卡移到 out[0]；白名单机制卡引擎 [0] 本就是机制卡，身份不变）。\r\n"
"     引擎首卡若落在兜底/合并区，提到主推荐首位；其余卡仍在换玩法/兜底区，不删不藏。仅动展示列表顺序，不动卡内容。 */\r\n"
"  try{(function(){\r\n"
"    var _v386eng=builds&&builds[0];if(!_v386eng)return;\r\n"
"    var _v386mi=_mainReps.indexOf(_v386eng);\r\n"
"    if(_v386mi===0)return;\r\n"
"    if(_v386mi>0){_mainReps.splice(_v386mi,1);_mainReps.unshift(_v386eng);}\r\n"
"    else{\r\n"
"      var _v386fi=_foldReps.indexOf(_v386eng);\r\n"
"      if(_v386fi>=0){_foldReps.splice(_v386fi,1);_mainReps.unshift(_v386eng);}\r\n"
"      else{var _v386gi=_mergeFroms.indexOf(_v386eng);if(_v386gi>=0){_mergeFroms.splice(_v386gi,1);_mainReps.unshift(_v386eng);}}\r\n"
"    }\r\n"
"    showList=_mainReps.concat(_foldReps).concat(_mergeFroms);\r\n"
"  })();}catch(eV386d){eV386d.name}"
)
t = rep_once(anchor_show, show_block, 'show-anchor-v386')

# ---------- 版本号：index / package ----------
t = rep_once("ER_ENGINE_VER='v4.385'", "ER_ENGINE_VER='v4.386'", 'ver-index')
io.open(idx, 'w', encoding='utf-8', newline='').write(t)

pkg = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, 'package.json')
pt = io.open(pkg, encoding='utf-8', newline='').read()
if pt.count('"version": "4.385.0"') != 1:
    raise SystemExit('package 版本锚点计数 %d' % pt.count('"version": "4.385.0"'))
io.open(pkg, 'w', encoding='utf-8', newline='').write(pt.replace('"version": "4.385.0"', '"version": "4.386.0"', 1))

# ---------- AGENTS.md 版本表占位行（字节/SHA1 发布前回填；smoke 三处同步需要） ----------
ag = os.path.join(ROOT, 'AGENTS.md')
at = io.open(ag, encoding='utf-8', newline='').read()
ag_anchor = '| v4.385 | 2,030,138 |'
if at.count(ag_anchor) != 1:
    raise SystemExit('AGENTS v4.385 行锚点计数 %d' % at.count(ag_anchor))
ag_row = ('| v4.386 | 待回填 | 待回填 | 占位行：发布前回填字节/SHA1。'
          '①strict 进攻卡移 [0]（白名单 13 维持；仅 loose 记台账）；②玻璃大炮睡觉 156 替换（可学自回血 / 补盲 / 守住182）；'
          '③9 条错名改既有流派名；④D-6 性格候选按首项归一过滤（仅展示层，引擎 nat 不改）；⑤展示层默认首卡锚定引擎 builds[0]（仅展示顺序）。门禁与快照比对见 out_v4386_probe.txt。 |\r\n')
at = at.replace(ag_anchor, ag_row + ag_anchor, 1)
io.open(ag, 'w', encoding='utf-8', newline='').write(at)

d = open(idx, 'rb').read(); tt = d.decode('utf-8')
print('bytes', len(d), 'sha1', hashlib.sha1(d).hexdigest().upper(),
      'CRLF', tt.count('\r\n'), 'bareLF', tt.count('\n') - tt.count('\r\n'))
