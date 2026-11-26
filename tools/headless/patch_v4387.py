# -*- coding: utf-8 -*-
"""v4.387 落地补丁（从 v4.386 终局一步复现）：
  ① data_lite_v498.js abilities 31 条描述按三方对照重写（968 保留原文；1048/1053 分片无条目不补）；
  ② index.html _v383ov 34 条统一为「源码幅度 + 生效条件」，加一行 v4.383 兼容说明；
  ③ C 洛托姆五形态睡觉组 kit={156,164,315,437} 现名「属性免疫联防位」→「主力输出压制」（空队/六人队共 10 条记录）；
  ④ D 睡觉 156 新判据落地：不满足 bulk/双防/无4倍判据且未登记持有 → 换真回复/补盲/守住；受队消耗 26 物种与食梦 5 物种持有保留。
  ①b ERDATA.abiDescZh 干净字典补 32 条玩家可读文案（1048/1053 无条目不补；968 保留原文），覆盖被 scrubLeak 剥离的并列幅度；ABI[id][3] 技术注记保留不动。
  ②b 抽出共享 keptNatList 性格冲突归一函数，详情 D-6 / 成员摘要 / 详情卡三处渲染共用 v4.386 同一套规则。
纪律：io.open newline=''；锚点唯一；自包 try/catch；幂等；只改描述/覆写文案/卡名/睡觉槽招位，不动 EV/性格/道具/特性与条目数。
用法：python patch_v4387.py [index路径] [lite分片路径]。"""
import io, os, re, sys, hashlib

ROOT = r'D:\game\elite-redux'
idx = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'index.html')
lite = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, 'data_lite_v498.js')

# ---------- ① 分片 abilities 描述 ----------
# 纪律：引擎 abiTagOf 按描述首行的「+」拆分复合特性并递归取子特性标签（index L5638）。
#   - 复合特性（旧描述含 +）：首行拆分原样保留，幅度/三方注记以字面 \n 落到第二行，不得改动子名；
#   - 非复合：整句按「原措辞 + 源码幅度并列」重写。
# 968 保留原文；1048/1053 分片无条目不补。
DESC_FULL = {
'317': '受到效果绝佳的攻击时受伤减少 35%（源码 MUL(.65) 即 −35%；图鉴 25% 与源码不符；textproto −35% 与源码一致）',
'582': '受到效果绝佳的攻击时受伤减少 35%（源码委托永冻层 MUL(.65) 即 −35%；图鉴 25% 与源码不符；textproto −35% 一致）',
'200': '一般属性招式变为钢属性并获得钢本系加成；自身为钢属性时，恶/幽灵招式伤害减半。（图鉴「钢招威力1.3倍」为原版 Steelworker 文案残留，ER 源码与 textproto 均无钢招威力倍率）',
'440': '变色+变换自如+毛皮大衣+冰鳞粉；受到所有招式伤害 ×0.5（源码 MUL(.5) 全招减半；textproto 列名组合未量化）',
'671': '对手攻击取最低随机数（受伤 ×0.85，源码 battle_util.c L7910）；击中要害时受伤 ×0.25（1/4，源码 abilities.cc L8466）。textproto「min roll 85% / crit 1/4」与源码一致',
'678': '接触类招式受伤 ×0.5；火属性招式 ×2.0（弱点）。源码 RESISTANCE 的 resistance 半程被 &ignored 丢弃、只结算 modifier 一次；textproto 标称「接触 1/4、火 4 倍」对应两个半程都生效的假设，与源码不符',
'773': '入场后特性计数 4（回合末递减）；生效期间效果绝佳招受伤 ×0.5。入场当回合计入、回合末递减，覆盖 4 回合（入场回合+后续 3 回合）；textproto 标称 3 回合、图鉴 5 回合均与源码计数 4 不符；若入场时机不计首回合，实际覆盖回合数以实战为准',
'817': '在雾中陷入愤怒；愤怒状态下受伤 ×0.8（−20%），非愤怒状态无减伤。图鉴「减半/降低50%」与源码不符；textproto −20% 与源码一致',
'932': '第一次受到攻击受伤 ×0.65（−35%，一次性），并降低对手攻击（textproto −35% 与源码一致）',
'936': '主宰+厚脂肪；火/冰受伤 ×0.5（源码委托厚脂肪）',
'1004': '被抵抗（效果不佳）时受伤 ×0.7（−30%）；其余情况 ×0.85（−15%）。图鉴「所有 −10%、被抵抗 −20%」条件与幅度均错；textproto 15%/30% 与源码一致',
}
# 复合特性：首行拆分保留，第二行注记（字面 \n）。
DESC_NOTE = {
'442': '防守侧：受到妖精属性攻击伤害 ×0.5（textproto 进攻1.5/防守0.5 与源码一致；图鉴漏记防守侧）',
'499': '效果绝佳攻击受伤 ×0.65（−35%），命中提升（源码委托 Filter；textproto 列名组合）',
'524': '声音招进攻 ×1.3、防守声音招 ×0.5（源码委托庞克摇滚；textproto 列名组合）',
'613': '物理招受伤 ×0.5，仅受攻击伤害（源码委托毛皮大衣；textproto 列名组合）',
'664': '水招 ×2.0、火受伤 ×0.5、先制（源码委托水泡；textproto 列名组合）',
'682': '火/冰受伤 ×0.5，麻痹免疫（源码委托耐热；textproto 列名组合）',
'726': '一般招变毒并获毒本系；声音招进攻 ×1.3、防守 ×0.5（源码委托庞克摇滚）',
'741': '未出手前受伤 ×0.7（−30%），雨天提速（源码委托慢出）',
'779': '满血受伤 ×0.5（掉血后失效），接触中毒（源码委托多重鳞片）',
'829': '无视大多数增伤或连击特性；一般招变钢并获钢本系；自身为钢属性时恶/幽灵减半，否则获钢本系加成。源码 ATE 无钢招威力倍率；图鉴未写倍率',
'881': '岩系进攻 ×1.2、防守 ×0.5；岩石招破特性（源码委托化石）',
'900': '沙暴中受伤 ×0.5、沙暴增伤、免疫沙暴（源码委托沙之守卫）',
'925': '特殊招受伤 ×0.5（源码委托冰鳞粉）',
'948': '接触招受伤 ×0.5、火招 ×2.0（弱点）。源码毛茸茸接触 ×0.5、火 ×2，RESISTANCE 只结算 modifier 一次；textproto 仅列组合名',
'954': '火/冰受伤 ×0.5，可使毒/钢属性中毒（源码委托厚脂肪）',
'962': '受伤 ×0.7（−30%），飘浮（源码委托棱镜鳞片）',
'970': '受伤 ×0.8（−20%），加钢属性，暴击免疫（源码委托战斗盔甲）',
'997': '受伤 ×0.8（−20%），暴击免疫（源码委托战斗盔甲）',
'1010': '火/冰受伤 ×0.5（源码委托耐热）',
'1032': '进攻 ×1.2、防守 ×0.5（中文名待补，本版不动译名）',
}

# ---------- ①b 玩家可读干净文案字典 ERDATA.abiDescZh ----------
# 纪律：展示链 esc()→scrubLeak(mdInline()) 会整句剔除含「源码/口径/实证/…」的分句；
#   ABI[id][3] 技术注记保留不动（开发侧），玩家可见幅度对照走本字典覆盖。
#   禁用触发词：源码/textproto/口径/实证/定稿/已废/本项目/模板旧文案/旧文案/【/→；
#   旧对照一律用「旧图鉴」，幅度口径用「游戏内实际结算」。1048/1053 分片无条目不补；968 无倍率保留原文。
DICT_ZH = {
'317': '受到效果绝佳的攻击时受伤减少 35%（旧图鉴写 25%，以游戏内实际结算为准）',
'582': '受到效果绝佳的攻击时受伤减少 35%（委托永冻层；旧图鉴写 25%，以游戏内实际结算为准）',
'200': '一般属性招式变为钢属性并获得钢本系加成；自身为钢属性时，恶/幽灵招式伤害减半（旧图鉴的「钢招威力 1.3 倍」不存在于本作）',
'442': '对妖精属性招式进攻威力 ×1.5；受到妖精属性攻击伤害 ×0.5',
'440': '受到所有招式伤害 ×0.5（复合：变色 + 变换自如 + 毛皮大衣 + 冰鳞粉）',
'499': '受到效果绝佳攻击时受伤 ×0.65（减少 35%），命中提升',
'524': '声音类招式进攻威力 ×1.3；受到声音类招式攻击 ×0.5',
'613': '受到物理招式伤害 ×0.5；仅受攻击伤害',
'664': '水属性招式威力 ×2.0；受到火属性攻击 ×0.5；先制',
'671': '对手攻击取最低随机数，受伤约为八成五；击中要害时受伤为四分之一',
'678': '接触类招式受伤 ×0.5；火属性招式受伤 ×2（旧图鉴写接触四分之一、火 4 倍；游戏内实际只结算一次）',
'682': '受到火/冰属性攻击 ×0.5；免疫麻痹',
'726': '一般属性招式变为毒属性并获毒本系；声音招进攻 ×1.3、防守 ×0.5',
'741': '未出手前受伤 ×0.7（减少 30%）；雨天提速',
'773': '入场后计数 4（回合末递减）；生效期间受到效果绝佳招式伤害 ×0.5。入场当回合计入、回合末递减，覆盖 4 回合；若入场时机不计首回合，实际覆盖回合数以实战为准',
'779': '满血时受伤 ×0.5（掉血后失效）；接触时使对手中毒',
'817': '陷入愤怒状态时受伤 ×0.8（减少 20%）；非愤怒状态无减伤（旧图鉴写减半，与游戏内实际结算不符）',
'829': '无视大多数增伤或连击特性；一般招变钢并获钢本系；自身为钢属性时恶/幽灵伤害减半，否则获钢本系加成。本作无钢招威力倍率',
'881': '岩石属性招式进攻 ×1.2；受到岩石属性攻击 ×0.5；岩石招可破对手特性',
'900': '沙暴中受伤 ×0.5；沙暴下增伤；免疫沙暴伤害',
'925': '受到特殊招式伤害 ×0.5',
'932': '第一次受到攻击受伤 ×0.65（减少 35%，一次性），并降低对手攻击',
'936': '受到火/冰属性攻击 ×0.5（委托厚脂肪）',
'948': '接触招式受伤 ×0.5；火属性招式受伤 ×2（旧图鉴写接触四分之一、火 4 倍；游戏内实际只结算一次）',
'954': '受到火/冰属性攻击 ×0.5；可使毒/钢属性中毒',
'962': '受伤 ×0.7（减少 30%）；免疫地面属性',
'970': '受伤 ×0.8（减少 20%）；自身加钢属性；暴击免疫',
'997': '受伤 ×0.8（减少 20%）；暴击免疫',
'1004': '被抵抗（效果不佳）时受伤 ×0.7（减少 30%）；其余情况 ×0.85（减少 15%）。旧图鉴幅度与条件均不符游戏内实际结算',
'1010': '受到火/冰属性攻击 ×0.5',
'1032': '进攻威力 ×1.2；防守受伤 ×0.5（中文名待补）',
'968': '硬壳盔甲 + 毒刺：暴击免疫；接触时使对手中毒',
}

def _js_str(s):
    return '"' + s.replace('\\', '\\\\').replace('"', '\\"') + '"'

lt = io.open(lite, encoding='utf-8', newline='').read()
a_key = 'ERDATA["abilities"]=['
ai = lt.find(a_key)
if ai < 0:
    raise SystemExit('abilities 数组锚点未找到')
seg_end = lt.find('];', ai)
seg = lt[ai:seg_end]
seg_new = seg
changed = []
ALL = list(DESC_FULL) + list(DESC_NOTE)
for aid in ALL:
    m = re.search(r'(\["' + re.escape(aid) + r'","[^"]*","[^"]*",")(.*?)(",\[\]\])', seg_new)
    if not m:
        raise SystemExit('能力条目锚点未找到: ' + aid)
    old = m.group(2)
    if aid in DESC_FULL:
        newdesc = DESC_FULL[aid]
    else:
        first = old.split('\\n')[0]
        newdesc = first + '\\n' + DESC_NOTE[aid]
    if old == newdesc:
        continue
    seg_new = seg_new[:m.start(2)] + newdesc + seg_new[m.end(2):]
    changed.append(aid)
lt = lt[:ai] + seg_new + lt[seg_end:]

# ①b 干净字典合并（幂等：已存在的键不重复插入）
di = lt.find('ERDATA["abiDescZh"]={')
if di < 0:
    raise SystemExit('abiDescZh 字典锚点未找到')
dj = lt.find('};', di)
dict_seg = lt[di:dj]
dict_ins = []
for _k, _v in DICT_ZH.items():
    if ('"' + _k + '":') in dict_seg:
        continue
    dict_ins.append('"' + _k + '":' + _js_str(_v))
if dict_ins:
    lt = lt[:di + len('ERDATA["abiDescZh"]={')] + ','.join(dict_ins) + ',' + lt[di + len('ERDATA["abiDescZh"]={'):dj] + lt[dj:]
io.open(lite, 'w', encoding='utf-8', newline='').write(lt)
print('分片描述改动条数:', len(changed), '->', ','.join(changed))
print('干净字典新增条目:', len(dict_ins))

# ---------- ② index _v383ov 覆写表 ----------
t = io.open(idx, encoding='utf-8', newline='').read()

OV = {
'317': '效果绝佳攻击受伤 ×0.65（−35%，效果绝佳时）',
'582': '委托永冻层：效果绝佳攻击受伤 ×0.65（−35%）',
'200': '一般招变钢并获钢本系；自身钢属性时恶/幽灵 ×0.5；ER 无钢招威力倍率',
'442': '对妖精进攻 ×1.5；受妖精攻击 ×0.5',
'440': '受伤 ×0.5（全招；复合变色+变换自如+毛皮大衣+冰鳞粉）',
'499': '效果绝佳招受伤 ×0.65（−35%）；命中提升',
'524': '声音招进攻 ×1.3、防守声音招 ×0.5',
'613': '物理受伤 ×0.5；魔法防守',
'664': '水招 ×2.0；火受伤 ×0.5；先制',
'671': '对手攻击取最低随机数 ×0.85；暴击受伤 ×0.25（1/4）',
'678': '接触招 ×0.5；火招 ×2.0（弱点；resistance 半程被 ignored 丢弃，只结算一次）',
'682': '火/冰受伤 ×0.5；麻痹免疫',
'726': '一般招变毒并获毒本系；声音招进攻 ×1.3、防守 ×0.5',
'741': '未出手前受伤 ×0.7（−30%）；雨天提速',
'773': '计数 4（回合末递减）；mod≥1.0 时受伤 ×0.5',
'779': '满血受伤 ×0.5；接触中毒',
'817': '愤怒状态受伤 ×0.8（−20%）；非愤怒无减伤',
'829': '无视增伤/连击特性；一般招变钢+钢本系；自身钢时恶/幽灵 ×0.5',
'881': '岩系进攻 ×1.2、防守 ×0.5；岩石招破特性',
'900': '沙暴中受伤 ×0.5；沙暴增伤；沙暴免疫',
'925': '特殊招受伤 ×0.5',
'932': '首次受击 ×0.65（−35%，一次性）；降对手攻',
'936': '火/冰受伤 ×0.5',
'948': '接触招 ×0.5；火招 ×2.0（弱点；resistance 半程被 ignored 丢弃）',
'954': '火/冰受伤 ×0.5；毒/钢可中毒',
'962': '受伤 ×0.7（−30%）；飘浮',
'968': '仅暴击免疫，无伤害倍率；接触中毒',
'970': '受伤 ×0.8（−20%）；加钢属性；暴击免疫',
'997': '受伤 ×0.8（−20%）；暴击免疫',
'1004': '被抵抗招 ×0.7（−30%）；其余 ×0.85（−15%）',
'1010': '火/冰受伤 ×0.5',
'1032': '进攻 ×1.2、防守 ×0.5',
'1048': '对虫进攻 ×1.5；受虫攻击 ×0.5（分片未登记，台账）',
'1053': '火/冰受伤 ×0.5（分片未登记，台账）',
}

ov_start = t.find('var _v383ov={')
if ov_start < 0:
    raise SystemExit('_v383ov 起始锚点未找到')
ov_end = t.find('};', ov_start)
if ov_end < 0:
    raise SystemExit('_v383ov 结束锚点未找到')
ov_end += 2

def js_str(s):
    return '"' + s.replace('\\', '\\\\').replace('"', '\\"') + '"'

new_block = 'var _v383ov={' + ','.join("'" + k + "':" + js_str(v) for k, v in OV.items()) + '};'
compat = ('  /* v4.383 曾按旧文案并列注记，v4.387 起图鉴与卡面统一按源码幅度+生效条件。 */\r\n')
t = t[:ov_start] + compat + '  ' + new_block + t[ov_end:]

# ---------- ②b 问题2：性格冲突归一过滤函数复用（详情 D-6 / 成员摘要 / 详情卡三处共用） ----------
anchor_nat = 'function anBuildOf(s,team){'
if t.count(anchor_nat) != 1:
    raise SystemExit('anBuildOf 锚点计数 %d' % t.count(anchor_nat))
helper = (
'/* v4.387 问题2：性格候选冲突归一（复用 v4.386 D-6 同一套规则），供详情 D-6 / 成员摘要 / 详情卡三处渲染共用；引擎 b.nat 数组不改。 */\r\n'
'function keptNatList(nat){\r\n'
'  try{\r\n'
'    var list=nat||[],kept=[],plus={},neg={};\r\n'
'    list.forEach(function(n){\r\n'
'      var nm=String((n&&n[0])||""),e=(typeof NATURES!=="undefined"&&NATURES[nm])||null;\r\n'
'      var p=e?String(e[0]||""):"",d=e?String(e[1]||""):"";\r\n'
'      if(!kept.length){kept.push(n);if(p)plus[p.slice(1)]=1;if(d)neg[d.slice(1)]=1;return;}\r\n'
'      var clash=(p&&neg[p.slice(1)])||(d&&plus[d.slice(1)]);\r\n'
'      if(!clash){kept.push(n);if(p)plus[p.slice(1)]=1;if(d)neg[d.slice(1)]=1;}\r\n'
'    });\r\n'
'    return kept;\r\n'
'  }catch(eKN){return nat||[];}\r\n'
'}\r\n'
)
t = t.replace(anchor_nat, helper + anchor_nat, 1)

# R1：详情 D-6 行内 IIFE → 共用 keptNatList（原 v4.386 规则原样抽出，不写第二份）
r1_old = """  h+='<div class="fld"><div class="fhd"><span class="fno">5</span>性格 + 原因</div><div>'+
    (function(){
      var _v386nat=bd.nat||[],_v386kept=[],_v386plus={},_v386neg={};
      _v386nat.forEach(function(n){
        var _nm=String((n&&n[0])||''),_e=(typeof NATURES!=='undefined'&&NATURES[_nm])||null;
        var _p=_e?String(_e[0]||''):'',_d=_e?String(_e[1]||''):'';
        if(!_v386kept.length){_v386kept.push(n);if(_p)_v386plus[_p.slice(1)]=1;if(_d)_v386neg[_d.slice(1)]=1;return;}
        var _clash=(_p&&_v386neg[_p.slice(1)])||(_d&&_v386plus[_d.slice(1)]);
        if(!_clash){_v386kept.push(n);if(_p)_v386plus[_p.slice(1)]=1;if(_d)_v386neg[_d.slice(1)]=1;}
      });
      return _v386kept.length?_v386kept.map(function(n){return '<span class="abi">'+esc(n[0])+'</span><span class="dim"> '+esc(n[1])+'</span>'}).join('　'):'<span class="dim">—</span>';
    })()+'</div></div>';""".replace('\n', '\r\n')
r1_new = """  h+='<div class="fld"><div class="fhd"><span class="fno">5</span>性格 + 原因</div><div>'+
    (function(){
      var _v387kept=keptNatList(bd.nat);
      return _v387kept.length?_v387kept.map(function(n){return '<span class="abi">'+esc(n[0])+'</span><span class="dim"> '+esc(n[1])+'</span>'}).join('　'):'<span class="dim">—</span>';
    })()+'</div></div>';""".replace('\n', '\r\n')
if t.count(r1_old) != 1:
    raise SystemExit('R1 D-6 IIFE 锚点计数 %d' % t.count(r1_old))
t = t.replace(r1_old, r1_new, 1)

# R2：成员摘要性格行（20866 附近）
r2_old = "'　<b>性格：</b>'+esc((b.nat||[]).map(function(n){return n[0]}).join(' / '))+"
r2_new = "'　<b>性格：</b>'+esc(keptNatList(b.nat).map(function(n){return n[0]}).join(' / '))+"
if t.count(r2_old) != 1:
    raise SystemExit('R2 成员摘要性格锚点计数 %d' % t.count(r2_old))
t = t.replace(r2_old, r2_new, 1)

# R3：详情卡性格字段（22208 附近）
r3_old = """html+='<div class="fld"><div class="fhd"><span class="fno">5</span>性格</div><div>'+bd.nat.map(function(n){
      return '<span class="abi" onclick="natModalZh('+jsl(n[0])+')">'+esc(n[0])+'</span><span class="dim"> '+esc(n[1])+'</span>';
    }).join('　')+'</div></div>';""".replace('\n', '\r\n')
r3_new = """html+='<div class="fld"><div class="fhd"><span class="fno">5</span>性格</div><div>'+keptNatList(bd.nat).map(function(n){
      return '<span class="abi" onclick="natModalZh('+jsl(n[0])+')">'+esc(n[0])+'</span><span class="dim"> '+esc(n[1])+'</span>';
    }).join('　')+'</div></div>';""".replace('\n', '\r\n')
if t.count(r3_old) != 1:
    raise SystemExit('R3 详情卡性格锚点计数 %d' % t.count(r3_old))
t = t.replace(r3_old, r3_new, 1)

# ---------- ③ C 洛托姆睡觉组改名（插在 eV4386 catch 之后、return out 之前） ----------
anchor_ret = "  }catch(eV4386){eV4386.name}\r\n  return out;}\r\n"
if t.count(anchor_ret) != 1:
    raise SystemExit('v4386 return 锚点计数 %d' % t.count(anchor_ret))
L = []
L.append("  }catch(eV4386){eV4386.name}\r\n")
L.append("  /* v4.387 C：洛托姆五形态(1643-1647)睡觉组 kit={156,164,315,437}（2 伤害招、进攻 EV252）按招组落主力输出压制；\r\n")
L.append("     钉子组不动；全库其余候选一条不改。只改 name，EV/性格/招组/道具/特性不动。自包作用域。 */\r\n")
L.append("  try{\r\n")
L.append("    var _v387ROT={'1643':1,'1644':1,'1645':1,'1646':1,'1647':1};\r\n")
L.append("    var _v387KIT=[156,164,315,437];\r\n")
L.append("    out.forEach(function(b){\r\n")
L.append("      if(!b||!b.name)return;\r\n")
L.append("      if(!_v387ROT[String(s.id)])return;\r\n")
L.append("      var ids=(b.mv.main||[]).concat(b.mv.func||[]).map(function(x){return +x.id});\r\n")
L.append("      var kitOk=_v387KIT.every(function(id){return ids.indexOf(id)>=0})&&ids.length===4;\r\n")
L.append("      if(kitOk&&String(b.name)==='属性免疫联防位'){b._v387OldName=String(b.name);b.name='主力输出压制';b._v387Renamed='主力输出压制';}\r\n")
L.append("    });\r\n")
L.append("  }catch(eV4387){eV4387.name}\r\n")
# ---------- ④ D 睡觉 156 新判据落地（插在 C catch 之后、return out 之前） ----------
L.append("  /* v4.387 D：睡觉 156 新判据（独立招位判据，不与披带/顺风速度档混用）。\r\n")
L.append("     允许 = bulk≥300，或（bulk≥270 且 min(Def,SpD)≥90 且无 4 倍弱点）。\r\n")
L.append("     落地集合 = 不满足判据且未登记持有：有可学严格自回血 → 换真回复；否则补盲伤害招（不重复、评分最高）；无合格补盲 → 守住182。\r\n")
L.append("     持有不动：受队消耗·bulk<300·除睡觉外无真回复（26 物种）；食梦依赖睡眠来源（5 物种）。回收一次流照常落地，why 注明回复由回收利用278承担。自包作用域。 */\r\n")
L.append("  try{\r\n")
L.append("    var _v387DREC={105:1,234:1,235:1,236:1,355:1,303:1,135:1,208:1,631:1,275:1,392:1,622:1,744:1,915:1,202:1,409:1,532:1,72:1,71:1,837:1,73:1};\r\n")
L.append("    var _v387DREC_PREF=[105,355,234,235,236,303,135,208,631,275,392,622,744,915,202,409,532,72,71,837,73];\r\n")
L.append("    var _v387DREAM={'96':1,'517':1,'518':1,'574':1,'575':1};\r\n")
L.append("    var _v387STALL={'95':1,'221':1,'246':1,'247':1,'304':1,'305':1,'410':1,'443':1,'444':1,'445':1,'473':1,'551':1,'552':1,'553':1,'696':1,'697':1,'698':1,'699':1,'776':1,'782':1,'878':1,'879':1,'880':1,'882':1,'1038':1,'1894':1};\r\n")
L.append("    var _v387DT=ERDATA.types||[],_v387DM=ERDATA.matchup||{};\r\n")
L.append("    function _v387Dec(v){return v===0?0:(v===0.5||v===3?0.5:(v===2?2:1));}\r\n")
L.append("    function _v3874x(s){var ds=[...new Set([s.t1,s.t2].filter(function(x){return x&&x!=='-';}).map(function(x){return _v387DT.indexOf(x);}).filter(function(x){return x>=0;}))];var res=[];for(var a=0;a<_v387DT.length;a++){var eff=1;ds.forEach(function(d){var row=_v387DM[d];eff*=_v387Dec(row&&row[a]!=null?row[a]:1);});if(eff===4)res.push(_v387DT[a]);}return res;}\r\n")
L.append("    function _v387Allow(s){var b=+s.base[0]+(+s.base[2])+(+s.base[4]),def=+s.base[2],spd=+s.base[4];return b>=300||(b>=270&&Math.min(def,spd)>=90&&_v3874x(s).length===0);}\r\n")
L.append("    function _v387Ids(b){return (b.mv.main||[]).concat(b.mv.func||[]).map(function(x){return +x.id;});}\r\n")
L.append("    out.forEach(function(b){\r\n")
L.append("      if(!b||!b.mv)return;\r\n")
L.append("      var ids=_v387Ids(b);\r\n")
L.append("      if(ids.indexOf(156)<0)return;\r\n")
L.append("      if(_v387Allow(s))return;\r\n")
L.append("      var main=b.mv.main||[],func=b.mv.func||[],slotArr=null,slotIdx=-1;\r\n")
L.append("      var mi=main.findIndex(function(x){return +x.id===156;});\r\n")
L.append("      if(mi>=0){slotArr=main;slotIdx=mi;}else{var fi=func.findIndex(function(x){return +x.id===156;});if(fi>=0){slotArr=func;slotIdx=fi;}}\r\n")
L.append("      if(!slotArr)return;\r\n")
L.append("      var slot=slotArr[slotIdx];\r\n")
L.append("      var isDream=_v387DREAM[String(s.id)]&&ids.indexOf(138)>=0;\r\n")
L.append("      var isStall=_v387STALL[String(s.id)]&&/受队消耗/.test(String(b.name||''));\r\n")
L.append("      if(isDream){slot.why=(slot.why||[]).concat(['食梦依赖睡眠来源，睡觉保留（本版不连食梦一并处理）']);b._v387SleepKeep='dream';return;}\r\n")
L.append("      if(isStall){slot.why=(slot.why||[]).concat(['睡觉为本流派唯一回复来源，替换即失去 受队消耗 背书，本版保留']);b._v387SleepKeep='stall';return;}\r\n")
L.append("      var kit={};ids.forEach(function(id){kit[''+id]=1;});\r\n")
L.append("      var learn=learnOf(s)||[];\r\n")
L.append("      var heal=null;\r\n")
L.append("      for(var pi=0;pi<_v387DREC_PREF.length;pi++){var hid=_v387DREC_PREF[pi];if(learn.indexOf(hid)>-1&&!kit[''+hid]){heal=hid;break;}}\r\n")
L.append("      var recycle=ids.indexOf(278)>=0;\r\n")
L.append("      var recNote=recycle?['回复由回收利用278承担']:[];\r\n")
L.append("      if(heal!=null){\r\n")
L.append("        var hm=MV[heal];var hvamp=hm&&hm[4]!=='变化';\r\n")
L.append("        slotArr[slotIdx]={id:heal,kind:hvamp?hm[4]:'rec',tag:hvamp?'吸血':'回复',why:(['可学自回血 '+hm[1]+' 替代睡觉156：站场续航（'+(hvamp?('威力'+(hm[5]||0)):'变化招')+'，命中'+(hm[6]||0)+'）']).concat(recNote)};\r\n")
L.append("        b._v387SleepSwap='sleep→'+heal+' '+hm[1];return;\r\n")
L.append("      }\r\n")
L.append("      var effSide=String(b.side);\r\n")
L.append("      if(!{'物理':1,'特殊':1,'双刀':1}[effSide]){var ph=0,sp=0;ids.forEach(function(id){var m=MV[id];if(!m)return;if(m[4]==='物理')ph++;else if(m[4]==='特殊')sp++;});effSide=ph>=sp?'物理':'特殊';}\r\n")
L.append("      var pool=[];try{pool=_pickAttacksCore(s,effSide,4,String(b.roleTag||'输出'))||[];}catch(eP){pool=[];}\r\n")
L.append("      var cand=pool.filter(function(c){return c&&!kit[''+c.id];});\r\n")
L.append("      cand.sort(function(a,c2){return c2.score-a.score;});\r\n")
L.append("      var cover=cand.filter(function(c){return !c.stab;});\r\n")
L.append("      var pick=cover[0]||cand[0]||null;\r\n")
L.append("      if(pick){\r\n")
L.append("        slotArr[slotIdx]={id:pick.id,kind:pick.stab?'attack':'cover',tag:pick.stab?'本系':'补盲',why:(pick.why||[]).slice().concat(recNote)};\r\n")
L.append("        b._v387SleepSwap='sleep→'+pick.id+' '+MV[pick.id][1];\r\n")
L.append("      }else{\r\n")
L.append("        slotArr[slotIdx]={id:182,kind:'变化',tag:'保命',why:(['守住182：无可学补盲伤害招，保命挡一击（替代睡觉156）']).concat(recNote)};\r\n")
L.append("        b._v387SleepSwap='sleep→182 守住';\r\n")
L.append("      }\r\n")
L.append("    });\r\n")
L.append("  }catch(eV4387D){eV4387D.name}\r\n")
L.append("  return out;}\r\n")
t = t.replace(anchor_ret, ''.join(L), 1)

# ---------- ⑤ 版本号三处：index 引擎版本 ----------
ver_old = "var ER_ENGINE_VER='v4.386';"
if t.count(ver_old) != 1:
    raise SystemExit('ER_ENGINE_VER 锚点计数 %d' % t.count(ver_old))
t = t.replace(ver_old, "var ER_ENGINE_VER='v4.387';", 1)

io.open(idx, 'w', encoding='utf-8', newline='').write(t)

d = open(idx, 'rb').read(); tt = d.decode('utf-8')
print('index bytes', len(d), 'sha1', hashlib.sha1(d).hexdigest().upper(),
      'CRLF', tt.count('\r\n'), 'bareLF', tt.count('\n') - tt.count('\r\n'))
