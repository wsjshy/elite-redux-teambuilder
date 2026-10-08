#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成 ER 配招助手单页 HTML（内嵌 ERDATA 数据，离线可用，响应式 PC/手机）
新增：招式多条件筛选 / 队伍构建器(联防+覆盖) / 特性反查 / 战术模板 / 存档CSV导入分析

精灵图：以相对路径 assets/sprites/sp<id>.png 引用（与 HTML 同目录，file:// 直接可显示），
        不再内嵌 base64（HTML 体积由 ~6.1MB 降至 ~1.3MB）；缺图时 onerror 隐藏 <img>，
        保留灰色占位框，不影响卡片布局与文字。
依赖：配招工具_data.js（数据源，本脚本只读）；assets/sprites/（由 assets/build_sprites.py 生成）"""
import os
import re

BASE = r'D:\game\elite-redux'
data_js = open(BASE + r'\配招工具_data.js', encoding='utf-8').read()

# ---- 剥离 data.js 内嵌的 base64 精灵图（只在本生成器内存中剥离，不改动 data.js 文件本体）----
# 改由 sprOf() 指向 assets/sprites/sp<id>.png 相对路径。
_sp_before = len(data_js.encode('utf-8'))
data_js = re.sub(r'"sprites"\s*:\s*\{[^{}]*\}', '"sprites":{}', data_js, count=1)
print('剥离内嵌 base64 精灵图：%.2f MB -> %.2f MB' % (_sp_before / 1048576.0, len(data_js.encode('utf-8')) / 1048576.0))

# ============ v4.3.1 EV-3：按 ER CanEvolve 口径派生「可进化」集合与族终态（构建期，只读 gameData） ============
# 依据 ER-source/src/battle_util.c:14520-14533 CanEvolve() 与 :14736-14739 Eviolite 门控：
#   存在 method≠0 且 method ∉ {EVO_MEGA_EVOLUTION, EVO_MOVE_MEGA_EVOLUTION, EVO_PRIMAL_REVERSION} → 可进化（享奇石）
# gameData 的 kd 即 method（evoKindT：0=EVO_LEVEL / 1=EVO_MEGA / 2=EVO_PRIMAL_REVERSION / 3=EVO_LEVEL_MALE / 4=EVO_LEVEL_FEMALE / 5=EVO_MOVE_MEGA）
#   ⇒ ER 口径等价于 kd ∈ {0,3,4}；数据层旧口径仅 kd==0（漏 3/4 性别分支进化，实测 13 只）
# 说明：只在本生成器内存中派生并追加到内嵌 ERDATA（不改 data.js / build_tool_data.py 本体）。
import json as _json
_gd = _json.load(open(BASE + r'\ER-source\gameDataV2.65beta.json', encoding='utf-8'))
_gsp = {str(s['id']): s for s in _gd['species']}
_EVO_OK = (0, 3, 4)


def _evos(_i):
    return _gsp.get(str(_i), {}).get('evolutions') or []


NONFINAL_ER = sorted([k for k in _gsp if any(int((e or {}).get('kd', -1)) in _EVO_OK for e in _evos(k))], key=lambda x: int(x))


def _final_of(_i, _seen=None):
    '''沿 kd∈{0,3,4} 链走到终态；分叉时取 BST 最高者（确定性）'''
    _seen = (_seen or set()) | {str(_i)}
    nxt = [str(e.get('in')) for e in _evos(_i)
           if int((e or {}).get('kd', -1)) in _EVO_OK and str(e.get('in')) in _gsp and str(e.get('in')) not in _seen]
    if not nxt:
        return str(_i)
    best = None
    for _n in nxt:
        _f = _final_of(_n, _seen)
        _b = sum(_gsp[_f].get('stats', {}).get('base') or [0])
        if best is None or _b > best[1]:
            best = (_f, _b)
    return best[0]


FINAL_OF = {}
for _i in NONFINAL_ER:
    _f = _final_of(_i)
    if _f != _i:
        FINAL_OF[_i] = _f
data_js = data_js.rstrip()
assert data_js.endswith(';'), 'data.js 结尾非 ;'
data_js += ('\nERDATA.nonFinalER=' + _json.dumps(NONFINAL_ER, separators=(',', ':')) + ';'
            + '\nERDATA.finalOf=' + _json.dumps(FINAL_OF, separators=(',', ':')) + ';')
print('EV-3 派生注入：nonFinalER=%d 只 / finalOf=%d 条（ER CanEvolve = kd∈{0,3,4}）' % (len(NONFINAL_ER), len(FINAL_OF)))

# ============ v4.5：威胁库「使用率先验」（只读 nn_data/chaos，注入内嵌 ERDATA） ============
# 源：Smogon chaos 2026-09（rating 0）raw.usage —— **原版（PS）使用率**，非 ER 使用率（ER 无对战统计 = 已知缺口）。
# 格式加权：gen3ou ×1.0（引擎同代：ER 为第三代内核）+ gen9nationaldex ×0.5（物种覆盖：含 Mega/后世代）。
# 物种映射：nn_data/species_map.json（ER id ↔ Showdown key，数据层产出，覆盖率 ~48.9%）。
_CHAOS = BASE + r'\nn_data\chaos\raw'
_USAGE_SRC = (('2026-09-gen3ou-0.json', 1.0, 'gen3ou'), ('2026-09-gen9nationaldex-0.json', 0.5, 'gen9nationaldex'))
_priors, _usrc = {}, []


def _usage_of(_fn, _w):
    _p = os.path.join(_CHAOS, _fn)
    if not os.path.exists(_p):
        print('使用率先验：缺少 %s → 跳过该源' % _fn)
        return None
    _d = _json.load(open(_p, encoding='utf-8'))
    _o = {}
    for _nm, _e in (_d.get('data') or {}).items():
        _u = _e.get('usage')
        if isinstance(_u, (int, float)) and _u > 0:
            _o[_nm] = float(_u) * _w
    return _o


for _fn, _w, _lab in _USAGE_SRC:
    _u = _usage_of(_fn, _w)
    if _u:
        _usrc.append({'file': _fn, 'format': _lab, 'weight': _w, 'species': len(_u)})
        for _k, _v in _u.items():
            _priors[_k] = _priors.get(_k, 0.0) + _v

USAGE_PRIOR, _ucov = {}, 0
try:
    _smap = _json.load(open(BASE + r'\nn_data\species_map.json', encoding='utf-8'))
except Exception as _e:                      # noqa: BLE001
    _smap = []
    print('使用率先验：species_map.json 读取失败（%s）→ 无先验' % _e)
for _r in _smap:
    _k = _r.get('showdown_key')
    if _k and _r.get('er_id', -1) > 0 and _priors.get(_k):
        USAGE_PRIOR[str(_r['er_id'])] = _priors[_k]
        _ucov += 1
_umax = max(USAGE_PRIOR.values()) if USAGE_PRIOR else 0.0
if _umax > 0:
    USAGE_PRIOR = {_k: round(_v / _umax, 4) for _k, _v in USAGE_PRIOR.items()}
USAGE_META = {'month': '2026-09', 'rating': 0, 'srcs': _usrc, 'coverage': _ucov,
              'note': '原版（Smogon/PS）使用率 ≠ ER 使用率；ER 无对战统计=已知缺口，仅作弱先验（权重上限 0.6，次排序）'}
data_js += ('\nERDATA.usagePrior=' + _json.dumps(USAGE_PRIOR, separators=(',', ':'), sort_keys=True) + ';'
            + '\nERDATA.usageMeta=' + _json.dumps(USAGE_META, ensure_ascii=False, separators=(',', ':')) + ';')
print('v4.5 使用率先验注入：源 %s / ER 命中 %d 只 / 归一化上限 %.4f' %
      ('+'.join([x['format'] for x in _usrc]) or '无', _ucov, _umax))

TEMPLATE = r'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ER 配招助手（Elite Redux v2.65）</title>
<style>
:root{
  --bg:#f5f6f8; --card:#fff; --line:#e0e3e8; --text:#23272f; --sub:#6b7280; --accent:#2563eb;
  --ok:#16a34a; --warn:#d97706; --bad:#dc2626;
}
*{box-sizing:border-box; margin:0; padding:0}
html{-webkit-text-size-adjust:100%; text-size-adjust:100%}
body{font-family:"Segoe UI","Microsoft YaHei","PingFang SC","Noto Sans CJK SC",system-ui,-apple-system,"Helvetica Neue",Arial,sans-serif; background:var(--bg); color:var(--text); font-size:14px}
header{background:var(--card); border-bottom:1px solid var(--line); padding:10px 16px; display:flex; align-items:center; gap:12px; flex-wrap:wrap; position:sticky; top:0; z-index:50}
header h1{font-size:17px; font-weight:700}
header .tag{font-size:12px; color:var(--sub)}
nav{display:flex; gap:4px; margin-left:auto; flex-wrap:wrap}
nav button{border:1px solid var(--line); background:var(--card); padding:6px 12px; border-radius:8px; cursor:pointer; font-size:13px}
nav button.active{background:var(--accent); color:#fff; border-color:var(--accent)}
main{max-width:1200px; margin:0 auto; padding:14px}
.tab{display:none}
.tab.active{display:block}
.t{display:inline-block; padding:1px 8px; border-radius:10px; font-size:12px; color:#fff; line-height:18px; margin-right:3px}
.t-一般{background:#a8a878}.t-格斗{background:#c03028}.t-火{background:#f08030}.t-冰{background:#98d8d8}.t-电{background:#f8d030;color:#403800}
.t-虫{background:#a8b820}.t-飞行{background:#a890f0}.t-钢{background:#b8b8d0;color:#403848}.t-草{background:#78c850}
.t-地面{background:#e0c068;color:#5a4a1a}.t-毒{background:#a040a0}.t-恶{background:#705848}.t-水{background:#6890f0}
.t-超能力{background:#f85888}.t-岩石{background:#b8a038}.t-龙{background:#7038f8}.t-幽灵{background:#705898}.t-妖精{background:#ee99ac}
.t-星晶{background:#b8a1c9}.t-无{background:#9e9e9e}.t-神秘{background:#b39ddb}
.split{display:inline-block; padding:1px 6px; border-radius:4px; font-size:11px}
.split-PHYSICAL{background:#fbe4dc;color:#a3431f}.split-SPECIAL{background:#dceef0;color:#1f6a6a}.split-STATUS{background:#eef0dc;color:#6a6a1f}
.bar{display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:12px}
.bar input[type=text]{flex:1; min-width:160px; padding:7px 10px; border:1px solid var(--line); border-radius:8px; font-size:13px}
.bar input[type=number]{width:64px; padding:6px 8px; border:1px solid var(--line); border-radius:8px; font-size:13px}
.bar select{padding:7px 8px; border:1px solid var(--line); border-radius:8px; background:var(--card)}
.chips{display:flex; flex-wrap:wrap; gap:4px}
.chips button{border:1px solid var(--line); background:var(--card); padding:2px 10px; border-radius:12px; cursor:pointer; font-size:12px}
.chips button.on{background:var(--accent); color:#fff; border-color:var(--accent)}
.grid{display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:8px}
.card{border:1px solid var(--line); background:var(--card); border-radius:10px; padding:10px; cursor:pointer; transition:box-shadow .15s}
.card:hover{box-shadow:0 2px 8px rgba(0,0,0,.1)}
.card .nm{font-weight:600; font-size:14px}
.card .en{font-size:11px; color:var(--sub)}
.card .bs{font-size:12px; color:var(--sub); margin-top:4px}
/* 精灵图：相对路径 assets/sprites/sp<id>.png；缺图时 <img> 被隐藏，仅剩灰色占位框（不破版） */
.spbox{background:#eceff3; border-radius:8px; display:flex; align-items:center; justify-content:center; overflow:hidden}
.spbox img{width:100%; height:100%; image-rendering:pixelated; display:block}
.spcard{width:64px; height:64px; margin:2px auto 6px}
.spinl{width:64px; height:64px; display:inline-block; vertical-align:middle; margin-right:8px}
.spslot{width:40px; height:40px; flex:0 0 40px; margin:0}
.drawer{position:fixed; top:0; right:0; width:min(520px,92vw); height:100%; background:var(--card); border-left:1px solid var(--line); box-shadow:-4px 0 16px rgba(0,0,0,.08); overflow-y:auto; padding:16px; z-index:60; transform:translateX(105%); transition:transform .2s}
.drawer.open{transform:translateX(0)}
.drawer .close{float:right; border:none; background:var(--line); width:28px; height:28px; border-radius:50%; cursor:pointer; font-size:14px}
.sec{margin:14px 0}
.sec h3{font-size:13px; color:var(--sub); margin-bottom:6px; border-bottom:1px solid var(--line); padding-bottom:4px}
.barstat{display:flex; align-items:center; gap:8px; margin:3px 0; font-size:12px}
.barstat .lb{width:34px; color:var(--sub)}
.barstat .tk{width:34px; text-align:right; font-weight:600}
.barstat .tr{flex:1; background:#eef0f4; border-radius:4px; height:10px; overflow:hidden}
.barstat .fl{height:100%; border-radius:4px}
.abi{display:inline-block; border:1px solid var(--line); padding:3px 10px; border-radius:14px; margin:2px 4px 2px 0; cursor:pointer; font-size:12px; background:#f8f9fb}
.abi:hover{background:#eef2ff}
.abid{font-size:12px; color:var(--sub); background:#f8f9fb; border-radius:8px; padding:8px; margin:6px 0; white-space:pre-wrap}
table{width:100%; border-collapse:collapse; font-size:13px}
th,td{border-bottom:1px solid var(--line); padding:5px 6px; text-align:left; white-space:nowrap}
th{color:var(--sub); font-weight:600; font-size:12px; position:sticky; top:0; background:var(--card)}
tr.mv{cursor:pointer}
tr.mv:hover{background:#f0f4ff}
.mvdesc{background:#f8f9fb; font-size:12px; color:var(--sub); white-space:pre-wrap; display:none}
tr.mv.open + .mvdesc{display:table-row}
.ktable{display:flex; gap:16px; flex-wrap:wrap}
.kgroup{flex:1; min-width:200px}
.kgroup .k2{background:#e8f5e9; border-radius:8px; padding:8px; margin-bottom:8px}
.kgroup .k05{background:#fff3e0; border-radius:8px; padding:8px; margin-bottom:8px}
.kgroup .k0{background:#fce4ec; border-radius:8px; padding:8px}
/* 队伍构建 */
.teamwrap{display:flex; gap:14px; flex-wrap:wrap; align-items:flex-start}
.teambox{flex:1; min-width:280px; background:var(--card); border:1px solid var(--line); border-radius:10px; padding:12px}
.slot{display:flex; align-items:center; gap:8px; border:1px solid var(--line); border-radius:8px; padding:6px 10px; margin-bottom:6px; background:#fafbfc}
.slot .nm{font-weight:600; flex:1}
.slot .x{background:none; border:none; color:var(--bad); cursor:pointer; font-size:16px; padding:0 4px}
.slot.empty{border-style:dashed; color:var(--sub); justify-content:center}
.slotinfo{font-size:11px; color:var(--sub)}
.btn{border:1px solid var(--line); background:var(--card); padding:6px 12px; border-radius:8px; cursor:pointer; font-size:13px}
.btn.primary{background:var(--accent); color:#fff; border-color:var(--accent)}
.btn-mini{border:1px solid var(--line); background:var(--card); padding:2px 10px; border-radius:10px; cursor:pointer; font-size:12px; vertical-align:middle}
.scroll{overflow-x:auto; -webkit-overflow-scrolling:touch}
.mini{font-size:12px}
.badge{display:inline-block; border-radius:10px; padding:1px 8px; font-size:12px; margin-right:4px}
.badge-weak{background:#fce4ec; color:#b71c1c}
.badge-res{background:#e8f5e9; color:#1b5e20}
.badge-imm{background:#e3f2fd; color:#0d47a1}
.badge-4x{background:#f9c74f; color:#7a4f01}
.badge-opt{background:#fff; border:1px dashed #d97706; color:#b45309}
.badge-add{background:#e0f2fe; color:#0369a1}
.badge-nt{background:#f3f4f6; color:#6b7280}
.badge-neu{background:#eef0f4; color:var(--sub)}
.badge-pick{background:#c8e6c9; border:1px solid #2e7d32; color:#1b5e20; cursor:pointer}
.badge-pickable{background:#fff; border:1px solid #2e7d32; color:#1b5e20; cursor:pointer; opacity:.75}
.badge-super{background:#e8f5e9; color:#1b5e20}
/* 规格 v1.0：待实测参数徽标 / 机制口径折叠块 / 选招依据 */
.badge-pend{background:#fff7e6; border:1px dashed #d97706; color:#b45309; font-size:11px}
.badge-warnimm{background:#fce4ec; border:1px solid #dc2626; color:#b71c1c; font-size:11px}
.rulebox{border:1px solid var(--line); background:var(--card); border-radius:8px; padding:8px 10px; margin:8px 0; font-size:12px}
.rulebox summary{cursor:pointer; font-weight:600; color:var(--accent)}
.whylist{font-size:11px; color:var(--sub); line-height:1.8; margin-top:4px}
.whylist b{color:var(--text)}
.badge-gap{background:#fff3e0; color:#b45309}
.badge-none{background:#fce4ec; color:#b71c1c}
.tplcard{border:1px solid var(--line); background:var(--card); border-radius:10px; padding:14px; margin-bottom:10px; cursor:pointer}
.tplcard.open{border-color:var(--accent)}
.tplcard h3{font-size:15px}
.tplcard .theme{color:var(--sub); font-size:12px; margin:4px 0}
.tip{background:#fff8e6; border-left:3px solid var(--warn); padding:8px 10px; margin:6px 0; font-size:12px; color:#7a5b1a; border-radius:4px}
textarea.savebox{width:100%; min-height:90px; font-family:Consolas,monospace; font-size:11px; border:1px solid var(--line); border-radius:8px; padding:8px; resize:vertical}
/* ===== v4.6 收尾：页内轻提示（替代原生 alert，不阻塞 JS 线程）===== */
#toastBox{position:fixed; left:50%; bottom:18px; transform:translateX(-50%); z-index:9999; display:flex; flex-direction:column; gap:6px; align-items:center; pointer-events:none}
.toastmsg{background:rgba(17,24,39,.94); color:#fff; border-radius:8px; padding:10px 14px; font-size:12.5px; line-height:1.5; max-width:min(92vw,560px); box-shadow:0 6px 18px rgba(0,0,0,.28); white-space:pre-wrap; word-break:break-word}
@media (max-width:640px){
  .grid{grid-template-columns:repeat(auto-fill,minmax(110px,1fr))}
  .spcard{width:56px; height:56px}
  nav{width:100%; margin-left:0}
  nav button{flex:1}
  header h1{font-size:15px}
  .drawer{width:100%}
}
/* ===== v4.6：移动端（窄屏 ≤480px = 手机竖版验收重点）=====
   ① 7 Tab 换行不溢出 ② 触控目标 ≥44px ③ 字体可读 ④ 卡片不横向溢出 */
@media (max-width:640px){
  body{font-size:14px}
  header h1{font-size:14px; line-height:1.4}
  header{padding:6px 8px; align-items:flex-start; flex-wrap:wrap}
  nav{width:100%; margin-left:0; flex-wrap:wrap; gap:4px}
  nav button{flex:1 1 30%; min-height:44px; font-size:13px; padding:0 6px}
  .btn,.btn-mini,.abi,details>summary,details.big>summary,.poolcard,label,input,select,textarea{min-height:44px}
  .abi{padding:10px 10px; line-height:1.15}
  .btn-mini{padding:10px 10px}
  details.big>summary{font-size:14px}
  .grid{grid-template-columns:repeat(auto-fill,minmax(96px,1fr)); gap:6px}
  .poolgrid{grid-template-columns:repeat(auto-fill,minmax(96px,1fr)); gap:6px}
  .spcard{width:56px; height:56px}
  .teamwrap{flex-direction:column}
  .teambox{width:100% !important; flex:1 1 auto !important}
  .drawer{width:100%}
  .sec,.tip,.ruleline,.needrow,.slotbody,.slothead,.poolcard{overflow-wrap:anywhere; word-break:break-word}
  .scroll,.mxlist{max-height:56vh}
  img{max-width:100%}
  /* v4.6-C：报告 §7b b5/b6/b7 三项必修（表格 overflow-wrap / 触控 ≥44px / 字号字体族） */
  th,td{white-space:normal; word-break:break-word}
  table{font-size:12px}
  nav button,.btn,.btn-mini,.chips button,.abi,details>summary,details.big>summary,.needcard>summary,
  .poolcard,.badge-pick,.badge-pickable,.poolbox .pin,.slot .x,.modal .close,button,label,input,select,textarea{min-height:44px}
  .modal .close{width:44px; height:44px; font-size:20px; line-height:1; padding:0}
  .chips button{padding:10px 12px}
  .slot .x{min-width:44px}
  tr.mv th,tr.mv td{padding:14px 8px}
  .whylist,.slotinfo,.ruleline,.tagline,.mcnm,.mcx,.mxmore,.poolrow,.split,.card .en,.savebox,.gl,
  .badge-pend,.badge-warnimm{font-size:12px}
  .spcard{width:88px; height:88px}
  #toastBox{left:8px; right:8px; transform:none; bottom:12px}
  .toastmsg{max-width:100%}
}
/* ===== v4.6 收尾：平板断点 641–1024px（PC 横版与手机竖版中间档）===== */
@media (min-width:641px) and (max-width:1024px){
  nav button{min-height:44px}
  .grid{grid-template-columns:repeat(auto-fill,minmax(104px,1fr))}
  .poolgrid{grid-template-columns:repeat(auto-fill,minmax(104px,1fr))}
  .scroll,.mxlist{max-height:64vh}
  .spcard{width:72px; height:72px}
  .teamwrap{flex-wrap:wrap}
  .modal .close{width:44px; height:44px}
}
/* ===== v4.x：词条 tooltip / 流派大卡片 / 列表 / 筛选 ===== */
.gl{border-bottom:1px dotted var(--accent); color:var(--accent); cursor:pointer; position:relative; white-space:nowrap}
.gl:hover::after{content:attr(data-g); position:absolute; left:0; top:135%; z-index:90; background:#111827; color:#fff; font-size:11px; line-height:1.55; padding:6px 8px; border-radius:6px; width:min(320px,72vw); white-space:normal; box-shadow:0 6px 18px rgba(0,0,0,.3); pointer-events:none}
details.big{border:1px solid var(--line); background:var(--card); border-radius:10px; margin:12px 0; padding:2px 12px}
details.big.rec{border-color:var(--accent); box-shadow:0 0 0 1px var(--accent) inset}
details.big>summary{cursor:pointer; padding:9px 0; list-style:none; font-size:15px; font-weight:600}
details.big>summary::-webkit-details-marker{display:none}
details.big>summary::before{content:"▸ "; color:var(--accent)}
details.big[open]>summary::before{content:"▾ "}
.bigsub{display:block; font-size:12px; color:var(--sub); font-weight:400; margin-top:3px; line-height:1.75}
.mxlist{max-height:340px; overflow:auto; border:1px solid var(--line); border-radius:8px; margin-top:6px}
.mxrow{padding:4px 8px; border-bottom:1px solid var(--line); cursor:pointer; font-size:12px; display:flex; gap:8px; align-items:center}
.mxrow:hover{background:#eef2ff}
.mxhd{padding:4px 8px; background:#f3f4f6; font-size:12px; font-weight:600; position:sticky; top:0}
.tagline{display:inline-block; font-size:11px; border:1px solid var(--line); border-radius:10px; padding:1px 7px; color:var(--sub); margin:0 4px 4px 0}
.abicol{display:flex; gap:10px; flex-wrap:wrap}
.abicol>div{flex:1; min-width:190px; border:1px solid var(--line); border-radius:8px; padding:8px}
.ruleline{font-size:11px; color:var(--sub); line-height:1.8; margin-top:6px; border-top:1px dashed var(--line); padding-top:4px}
/* ===== v4.6-B：我的宝可梦选择池（多图少文：精灵图为视觉主体） ===== */
.poolgrid{display:grid; grid-template-columns:repeat(auto-fill,minmax(104px,1fr)); gap:8px; margin-top:6px}
.poolcard{border:1px solid var(--line); border-radius:10px; background:var(--card); padding:6px 4px; text-align:center; cursor:pointer; position:relative; min-height:44px}
.poolcard:hover{border-color:var(--accent); background:#f7faff}
.poolcard .pn{font-size:12px; font-weight:600; margin-top:2px; line-height:1.3}
.poolcard .pl{font-size:11px; color:var(--sub); line-height:1.35}
.poolcard .ptag{display:inline-block; font-size:12px; border:1px solid var(--line); border-radius:8px; padding:0 5px; margin:1px 2px 0 0; color:var(--sub); max-width:92px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; vertical-align:bottom}
.poolcard .psrc{position:absolute; top:2px; left:4px; font-size:12px; color:var(--sub)}
.spmid{width:64px; height:64px; image-rendering:pixelated}
.spinl{image-rendering:pixelated; vertical-align:middle}
/* ===== v4.x UI 定稿：就地展开（克制格）/ 轻量居中 modal（词条）/ 图片优先的紧凑卡片网格 ===== */
.mxinline{margin:8px 0 12px; border:1px solid var(--accent); border-radius:10px; background:var(--card); padding:10px}
.mxhd2{font-size:13px; font-weight:600; margin-bottom:6px; display:flex; align-items:center; gap:8px; flex-wrap:wrap}
.mxhd2 .mini{font-weight:400}
.mxbuckets{margin:4px 0 8px}
.mxsec{margin:6px 0}
.mxsechd{font-size:12px; font-weight:600; color:var(--sub); margin:4px 0}
.mxgrid{display:flex; flex-wrap:wrap; gap:6px}
.mxc{width:76px; border:1px solid var(--line); border-radius:8px; padding:4px 2px; text-align:center; cursor:pointer; background:#fff}
.mxc:hover{background:#eef2ff; border-color:var(--accent)}
.mxc.imm{background:#e8f5e9}
.mxc img,.mcspr img{width:40px; height:40px; object-fit:contain; image-rendering:pixelated; display:block; margin:0 auto}
.mcnm{font-size:11px; line-height:1.3; margin-top:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap}
.mcx{font-size:11px; font-weight:700; color:var(--accent)}
.mxc.imm .mcx{color:#2e7d32}
.mxmore{width:76px; height:76px; font-size:11px; line-height:1.3}
.spthumb img{width:26px; height:26px; object-fit:contain; image-rendering:pixelated; vertical-align:middle}
/* 轻量居中 modal（带遮罩 + 关闭）：仅用于词条详情等确需浮层的内容 */
.modal{position:fixed; inset:0; background:rgba(15,23,42,.45); display:none; z-index:80; align-items:center; justify-content:center; padding:16px}
.modal.open{display:flex}
.modal .mbox{background:var(--card); max-width:660px; width:100%; max-height:82vh; overflow:auto; border-radius:12px; padding:14px 16px; box-shadow:0 20px 50px rgba(0,0,0,.35)}
.modal .mboxwide{max-width:820px}
.tplthumb{margin-top:4px}
.tplthumb img{width:30px; height:30px; object-fit:contain; image-rendering:pixelated; margin-right:3px; vertical-align:middle}
/* v4.2 完整队伍方案卡（槽位骨架；就地展开 <details>，不用抽屉/浮层） */
.tgrid{display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:8px}
.slotcard{border:1px solid var(--line); border-radius:10px; background:#fff; padding:6px 8px}
.slotcard>summary{cursor:pointer; font-size:13px; font-weight:600}
.slotcard>summary .badge{font-weight:700}
.slotbody{margin-top:4px; padding-top:4px; border-top:1px dashed var(--line)}
.needcard{border:1px solid var(--line); border-radius:10px; background:#fff; padding:6px 8px; margin-bottom:5px}
.needcard>summary{cursor:pointer; font-size:13px; font-weight:600}
.needrow{display:flex; align-items:center; gap:5px; flex-wrap:wrap; margin-top:4px}
.needrow .spinl{width:34px; height:34px}
.slothead{display:flex; align-items:center; gap:4px; flex-wrap:wrap; font-size:13px}
.slothead .spinl img{width:28px; height:28px; object-fit:contain; image-rendering:pixelated; vertical-align:middle}
.slotcard .abi{cursor:pointer}
/* V10 修复：备选池「展开全部候选 / 按名定位」（中间位次可见 —— 用户会专门查龙头地鼠在空间队的位次） */
.poolbox{margin-top:4px; display:flex; align-items:center; gap:4px; flex-wrap:wrap}
.poolbox .pin{font-size:11px; padding:2px 6px; border:1px solid var(--line); border-radius:6px; width:150px}
.poolscroll{max-height:220px; overflow:auto; border:1px dashed var(--line); border-radius:8px; margin-top:3px; padding:3px 5px; background:#fcfdff}
.poolrow{display:inline-flex; align-items:center; gap:3px; font-size:11px; color:var(--sub);
  border:1px solid var(--line); border-radius:6px; padding:1px 5px; margin:2px 3px 2px 0; white-space:nowrap}
.poolrow b{color:var(--accent)}
.poolrow img{width:24px; height:24px; object-fit:contain; image-rendering:pixelated; vertical-align:middle}
.poolrow.hit{border-color:var(--warn); background:#fff8e6}
.poolrow.hit b{color:#c62828}
.modal .mhd{display:flex; align-items:center; gap:8px; margin-bottom:6px}
.modal .mhd b{flex:1; font-size:14px}
.modal .close{border:none; background:var(--line); width:26px; height:26px; border-radius:50%; cursor:pointer}
details.inline{border:1px dashed var(--line); border-radius:8px; padding:2px 8px; margin:6px 0; background:#fff}
details.inline>summary{cursor:pointer; font-size:12px; color:var(--sub)}
</style>
</head>
<body>
<header>
  <h1>ER 配招助手</h1>
  <span class="tag">Elite Redux v2.65 · NextDex gameData + 汉化图鉴</span>
  <nav>
    <button data-tab="core" class="active">核心配队</button>
    <button data-tab="team">队伍构建</button>
    <button data-tab="poke">宝可梦</button>
    <button data-tab="move">招式反查</button>
    <button data-tab="type">属性克制</button>
    <button data-tab="abi">特性反查</button>
    <button data-tab="tpl">战术模板</button>
  </nav>
</header>
<main>
<!-- ===== 宝可梦 ===== -->
<section id="tab-poke" class="tab">
  <div class="bar">
    <input type="text" id="spSearch" placeholder="搜索：中文 / 英文 / 编号">
    <select id="spSort">
      <option value="id">编号</option><option value="bst">种族总值</option><option value="hp">HP</option>
      <option value="atk">攻击</option><option value="def">防御</option><option value="spa">特攻</option>
      <option value="spd">特防</option><option value="spe">速度</option>
    </select>
    <div class="chips" id="spTypeChips"></div>
  </div>
  <div class="grid" id="spGrid"></div>
  <div id="spMore" style="text-align:center;color:var(--sub);padding:10px"></div>
</section>
<!-- ===== 招式反查 ===== -->
<section id="tab-move" class="tab">
  <div class="bar">
    <input type="text" id="mvSearch" placeholder="搜索招式：中文 / 英文 / 编号">
    <select id="mvType"><option value="">全部属性</option></select>
    <select id="mvSplit"><option value="">全部分类</option><option value="物理">物理</option><option value="特殊">特殊</option><option value="变化">变化</option></select>
    <span class="mini">威力</span><input type="number" id="mvPowMin" placeholder="≥" min="0">
    <input type="number" id="mvPowMax" placeholder="≤" min="0">
    <span class="mini">PP</span><input type="number" id="mvPpMin" placeholder="≥" min="0">
    <span class="mini">先制</span><input type="number" id="mvPrMin" placeholder="≥" min="-10">
    <span class="mini" id="mvCount" style="color:var(--sub)"></span>
  </div>
  <div class="scroll"><table id="mvTable"><thead><tr><th>#</th><th>招式</th><th>属性</th><th>分类</th><th>威力</th><th>命中</th><th>PP</th><th>先制</th></tr></thead><tbody></tbody></table></div>
  <div class="modal" id="mvDrawer">
    <div class="mbox mboxwide">
      <div class="mhd"><b id="mvDrawerTitle">招式详情</b><button class="close" onclick="closeMv()">×</button></div>
      <div id="mvDetail"></div>
    </div>
  </div>
</section>
<!-- ===== 属性克制 ===== -->
<section id="tab-type" class="tab">
  <div class="sec"><h3>进攻视角：我选招式属性，打谁克制？</h3>
    <div class="chips" id="atkChips"></div>
    <div id="atkResult" class="ktable" style="margin-top:10px"></div>
  </div>
  <div class="sec"><h3>防守视角：我的宝可梦属性，怕谁？（可多选双属性）</h3>
    <div class="chips" id="defChips"></div>
    <div id="defResult" style="margin-top:10px"></div>
  </div>
</section>
<!-- ===== 队伍构建 ===== -->
<section id="tab-team" class="tab">
  <div class="bar">
    <input type="text" id="tmSearch" placeholder="搜索并点击入队（最多 6 只）">
    <select id="tmSort">
      <option value="id">编号</option><option value="bst">种族总值</option><option value="atk">攻击</option><option value="spe">速度</option>
    </select>
    <button class="btn" style="background:var(--warn);color:#fff" onclick="document.getElementById('savFile').click()">📂 解析存档 .sav</button>
    <input type="file" id="savFile" accept=".sav" hidden onchange="parseSavFile(this)">
    <button class="btn" onclick="toggleCsvPanel()">📥 粘贴 CSV</button>
  </div>
  <div class="sec" style="margin:6px 0">
    <div class="tmfilter">
      <span class="mini">属性：</span><div class="chips" id="tmTypeChips"></div>
      <span class="mini">定位：</span>
      <select id="tmRole"><option value="">全部</option><option value="物攻手">物攻手</option><option value="特攻手">特攻手</option><option value="盾">盾</option><option value="速攻">速攻</option><option value="空间向">空间向</option></select>
      <span class="mini">特性：</span><input type="text" id="tmAbi" placeholder="特性名模糊搜索">
      <button class="btn-mini" onclick="tmFilterReset()">清空筛选</button>
    </div>
  </div>
  <div id="csvPanel" style="display:none;margin-bottom:6px">
    <textarea class="savebox" id="saveCsv" placeholder="粘贴 存档解析（网页版）CSV 文本 → 点「导入」自动分析当前队伍…（更省事：直接点上方 📂 解析存档 选 .sav 文件）"></textarea>
    <div style="margin-top:4px"><button class="btn" onclick="importSaveBox()">导入</button> <span class="mini" style="color:var(--sub)">只认队伍行</span></div>
  </div>
  <div id="savParseOut" style="margin:6px 0"></div>
  <!-- v4.6-B：存档联动组队（我的宝可梦）—— 与下方全图鉴组队并列，不替换 -->
  <div class="sec" id="mySavCard" style="margin:6px 0">
    <h3>🎮 存档联动组队（我的宝可梦）<span class="mini" style="color:var(--sub);font-weight:400"> · 与下方「全图鉴组队」并列，互不替换</span></h3>
    <div class="mini" style="color:var(--sub)">① 点上方「📂 解析存档 .sav」选文件（或粘贴 CSV 导入）→ ② 下方出现你的队伍与箱子 ③ 点一只精灵 = 以它为核，走同一套需求驱动引擎出完整队伍方案</div>
    <div class="poolgrid" id="myPoolWrap"><div class="mini" style="color:var(--sub)">尚未解析存档 —— 解析后此处显示「我的宝可梦」选择池（精灵图 / 等级 / 特性 / 道具 / 末招）。</div></div>
    <div id="myTeamOut"></div>
  </div>
  <div class="teamwrap">
    <div class="teambox" style="flex:1.2">
      <div class="grid" id="tmGrid"></div>
      <div id="tmMore" style="text-align:center;color:var(--sub);padding:6px"></div>
    </div>
    <div class="teambox" style="flex:1">
      <div class="sec" style="margin-top:0"><h3>我的队伍（<span id="tmCount">0</span>/6）<button class="btn-mini" style="margin-left:8px" onclick="exportTeam()" title="复制当前队伍配置文本（含勾选特性模拟方案）">📋 导出配置</button></h3></div>
      <div id="tmSlots"></div>
      <div id="tmAnalyze"></div>
    </div>
  </div>
  <div id="ruleBoxTeam"></div>
</section>
<!-- ===== 特性反查 ===== -->
<section id="tab-abi" class="tab">
  <div class="bar">
    <input type="text" id="abiSearch" placeholder="搜索特性：中文 / 英文 / 描述关键词">
  </div>
  <div id="abiResult"></div>
</section>
<!-- ===== 战术模板 ===== -->
<section id="tab-tpl" class="tab">
  <div id="tplList"></div>
  <div class="tip" id="tplRuleTip">💡 ER 特化提示加载中…</div>
  <div id="ruleBoxTpl"></div>
</section>
<!-- ===== 核心配队 ===== -->
<section id="tab-core" class="tab active">
  <div class="bar">
    <input type="text" id="coreSearch" placeholder="搜索中文 / 英文 / 编号">
    <select id="coreSort">
      <option value="id">编号</option><option value="bst">种族总值</option><option value="spe">速度</option>
    </select>
    <select id="coreRole">
      <option value="">全部定位</option>
      <option value="设置手">天气/场地设置手</option>
      <option value="天气速攻">天气速攻</option>
      <option value="速攻手">速攻手</option>
      <option value="炮台">炮台</option>
      <option value="慢速炮台">慢速炮台(空间)</option>
      <option value="肉盾">肉盾</option>
      <option value="空间打手">空间打手</option>
      <option value="均衡">均衡/多功能</option>
    </select>
    <input type="text" id="coreMv" placeholder="可学招式名" style="width:150px">
    <input type="text" id="coreAbi" placeholder="特性名" style="width:130px">
    <button class="btn-mini" onclick="coreClear()">清空筛选</button>
    <label style="font-size:12px;white-space:nowrap;display:inline-flex;align-items:center;gap:2px"><input type="checkbox" id="coreFinal" checked onchange="coreFinalToggle()"> 仅最终形态 + 奇石优势</label>
  </div>
  <div class="chips" id="coreTypes"></div>
  <div class="grid" id="coreGrid"></div>
  <div id="coreMore" style="text-align:center;color:var(--sub);padding:10px"></div>
  <div id="coreOut"></div>
  <div id="ruleBoxCore"></div>
</section>
</main>
<script>
__ERDATA__
/* ============ 工具函数 ============ */
var $=function(id){return document.getElementById(id)};
var MV={},ABI={},ITM={};
ERDATA.moves.forEach(function(m){MV[m[0]]=m});
ERDATA.abilities.forEach(function(a){ABI[a[0]]=a});
ERDATA.items.forEach(function(i){ITM[i[0]]=i});
function tchip(t,on,fn){var b=document.createElement('button');b.textContent=t;if(on)b.className='on';b.onclick=fn;return b}
function tlabel(t){return '<span class="t t-'+t+'">'+t+'</span>'}
function splitLabel(s){var z={'PHYSICAL':'物理','SPECIAL':'特殊','STATUS':'变化','物理':'物理','特殊':'特殊','变化':'变化'};
  var zh=z[s]||s,cls={'物理':'PHYSICAL','特殊':'SPECIAL','变化':'STATUS'}[zh]||s;
  return '<span class="split split-'+cls+'">'+zh+'</span>'}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
/* 特性名 → id：先匹配特性表规范中文/英文名，再回退 ERDATA.abiAlias（419 条双图鉴译名别名，
   与 abiTagOf/NM2ID 同口径）。物种表沿用 v0.3 译名（如「水合」「鸟群」「华贵之鸟」）属别名型，
   不回退别名时该名称解析为 null（影响 abiDesc / coreAbiPick / coreIntensity / pickAbiFor 四处）。 */
function abiIdByZhOrEn(n){
  for(var k in ABI){if(ABI[k][2]===n||ABI[k][1]===n)return k}
  var al=ERDATA.abiAlias&&ERDATA.abiAlias[n];
  return (al===undefined||al===null)?null:(''+al);
}
function mvIdByZhOrEn(n){for(var k in MV){if(MV[k][1]===n||MV[k][2]===n)return k}return null}
function itemByZhOrEn(n){for(var k in ITM){if(ITM[k][2]===n||ITM[k][1]===n)return k}return null}
function tIdx(t){return ERDATA.types.indexOf(t)}
/* ============ 机制默认口径参数（WCONF / ABI_ATE） ============
   源：docs/战斗分析/_机制默认口径表.md「引擎参数汇总表」逐项照抄（v1.0，2026-10-06），
   并按用户指示「以 v2.65+ 源码为准」以 _验证证据/_源码考古_v265_20261006.md（在线官方仓 eliteredux-source
   upcoming 分支：Pin A=7d85acd5…@2026-03-28 = v2.65 时代、Pin B=910945b9…@2026-10-06 = 最新）落地。
   带「实证」标注者 = 双 pin 源码逐字取到；标「待实测」者仍按口径表默认值实现，
   UI 相应位置加徽标「待游戏内实测确认」，待游戏内证据再定稿。 */
var WCONF={
  manualDurTurns:8, abilityDurTurns:8, rockTurnsAbility:12, rockTurnsManual:12
    /*实证（v2.65 双 pin）：include/battle_util.h「WEATHER_DURATION 8 / WEATHER_DURATION_EXTENDED 12」；
      TryChangeBattleWeather 不区分来源（viaAbility 形参不参与倍率与时长）⇒ 手动/特性同档 8→12。
      原 manualDurTurns=5 / rockTurnsManual=8 系 changelog 口径——源码无 5 回合档，UI 标注「源码 v2.65 实证 8，changelog 记 5」*/,
  boost:0.5 /*天气增伤增量（UI/打分按 1+值 ⇒ ×1.5）：实证伤害段 WEATHER_*_TEMPORARY|*_PRIMAL 档 == UQ_4_12(1.5)*/,
  abilityBoost:0.5 /*v3.23 由 0.2 改 0.5（与 boost 同档）：实证 TryChangeBattleWeather 只写 sWeatherFlagsInfo[x][0]=TEMPORARY、
                      viaAbility 形参不参与倍率 ⇒ 特性天气同为 ×1.5，源码无「特性 20%」档；保留双键仅为兼容，
                      口径表原「按来源分档（手动 50%/特性 20%）」写法无源码支撑（按天气字段 *_PERMANENT=1.2 分档，v2.65 该档仅地图天气触及）*/,
  terrainBoost:1.3 /*实证定稿（v2.65 双 pin）：battle_config.h「B_TERRAIN_TYPE_BOOST = GEN_8 // In Gen8, damage is boosted by
                      30% instead of 50%」+ battle_util.c「if (terrainType == moveType) MUL_MODIFIER(&modifier, 1.3)」*/,
  terrainDurTurns:8, terrainExtenderTurns:12 /*实证（双 pin）：TERRAIN_DURATION 8 / TERRAIN_DURATION_EXTENDED 12
                      （battle_script_commands.c：持地形延展器取 EXTENDED，否则 DURATION）；原记 11 系笔误*/,
  tailwindTurns:4 /*实证（双 pin）：TAILWIND_DURATION=3，但 started.tailwind 于施放当回合置位、每回合开始
                     ZERO(gSideTimers[].started) ⇒ 当回合不递减 ⇒ 实际 4 个回合时段（与官方文案 4 turns 自洽）*/,
  autoTailwindTurns:4 /*v3.23 由 3 改 4：特性侧用 TAILWIND_DURATION_SHORT=3 + 同一 started 机制 ⇒ 实际亦 4 个回合时段，
                         与手动相同（差别不在时长）*/,
  lightClayTurns:null /*待实测（实证两条链路：招式壁类 SCREEN_DURATION 5 → 持 Light Clay SCREEN_DURATION_EXTENDED 8；
                         特性侧 North Wind 自动极光幕 SCREEN_DURATION_SHORT 3 → 持 Light Clay SCREEN_DURATION 5；
                         Light Wield 自动光墙属 v2.65 之后新增。另：特性「烟雾」用 ITEM_LIGHT_CLAY 与 HOLD_EFFECT 枚举比较，
                         疑永远取 SHORT —— 源码级疑瑕疵，未做游戏内验证）*/,
  trickroomTurns:5 /*待实测：官方文案 5；源码 TRICK_ROOM_DURATION=5 但同一「当回合不递减」机制 ⇒ 机械推算 6 个回合时段，
                      差 1 须游戏内实测裁定*/, trickroomPrio:-7 /*已按游戏数据核对：gameDataV2.65beta.json moves[433].prio=-7（源码树无优先级硬编码）*/,
  paraSpeed:0.5 /*实证：battle_config.h「B_PARALYSIS_SPEED GEN_7 // Speed is decreased by 50%」+ battle_main.c speed /= 2*/,
  paraFullChance:0.25 /*实证（v2.65）：battle_util.c CANCELLER_PARALYSED「Random() % 4」⇒ 25%；
                          v2.65 之后版本引入 Pokémon Champions 块（B_USE_CHAMPIONS_PARALYSIS，mod=8 ⇒ 12.5%），Pin A 无该配置块*/,
  hazardRules:{
    spikes:{maxLayers:3,dmg:[1/8,1/6,1/4],groundedOnly:true} /*考古修正：源码 (5-层)*2 → 除数 8/6/4（1/8,1/6,1/4）；口径表原记 3/16 系 Psypoke 讹误（源码+Bulbapedia+Serebii 三方一致，§10）*/,
    stealthRock:{layers:1,dmgByRockEff:[1/2,1/4,1/8,1/16,1/32]},
    toxicSpikes:{maxLayers:2,steelImmune:true,groundedPoisonAbsorbs:true},
    stickyWeb:{layers:1,speedStage:-1,immune:['飞行','飘浮','气球']}
  },
  defogRapidSpin:{rapidSpin:'self', defog:'both', defogEvasion:-1, walls:'foeOnly'} /*定稿（已按游戏源码核对 + 用户确认）：清除浓雾清双方钉子、墙仅对手侧、降闪避 1 级、不清地形场地（§9）*/,
  frostbite:{dmgFraction:1/16, spAtkMult:0.5, hailChanceMult:3} /*前两项实证（ENDTURN_FROSTBITE maxHP/16 + battle_util.c spAttack /= 2）；
                      hailChanceMult=3 转**待实测**：v2.65 双 pin 均**未找到**「雪天提高冻伤概率 ×3」（GetMoveEffectChance 全文只有
                      彩虹 ×2；唯一概率加成是特性 Cryomancy「*effectChance *= 5」）；旧版 2024-04 克隆有该逻辑 ⇒ 版本删除型变更，待游戏内确认（§8）*/,
  toxicTerrain:{exists:true, durTurns:8, dmgFraction:1/16, boost:1.3 /*定稿：用户游戏内确认毒招 +30%（= ×1.3）；源码 MUL_MODIFIER(...,1.3) 实证*/,
    spikesToToxicSpikes:false /*待实测（源码两 pin + v2.65 数据均未找到「撒菱→毒菱」实现，现值为 false 口径）*/,
    seed:'未收录' /*待实测：v2.65 数据表 929 条道具**无** Toxic Seed（源码有 HOLD_EFFECT_PARAM_TOXIC_TERRAIN 分支 → TryHandleSeed(SPDef+1)）*/},
  wxGrantOrder:'slow' /*天气归属（谁主导在场天气）——07 组队方法论 §1.2/§2.x + 研究资料 _03 §2.4 / _02 §6.3：
      两代机制**相反**、须实测 ⇒ 做成可配置参数（默认取现代口径，见下）。
      'slow' = modern：多个自动天气特性同时入场时，**慢者的特性后发动 → 慢者主导**（Koraidon 135 速先发、Kyogre 90 速后发动覆盖 → 雨）；
      'fast' = legacy（Smogon DP-era「Speed is critical in determining which weather will be in place」⇒ 快者主导）。
      ER 属第三代内核但有现代改动 ⇒ 【待实测】（未实测前配置为 'slow'，UI 标注徽标）*/
};
var ABI_ATE={
  multiplier:1.0 /*实证（v2.65 双 pin 逐字相同）：src/abilities.cc ATE_ABILITY 宏只有 onMoveType + onStab，**无 onOffensiveMultiplier**
                    ⇒ 宏族 ×1.0（旧版 17 条硬编码 ×1.1 已在 v2.65 重做中移除；且 ateBoost 标志在伤害主路径 0 消费者 →
                    数据文案「Normal moves become X. X moves are empowered.」亦不含数字）*/,
  specialBoost:{'96':1.1,'280':1.1,'659':1.1} /*三特例自身 onOffensiveMultiplier 乘 1.1（独立于 -ate 宏）：
                    Normalize(96，数据文案「get 1.1x boost, ignore resists」) / Crystallize(280，文案「get a 1.1x boost」) / Superconductor(659)*/,
  stabConvert:true /*实证定稿：宏内 .onStab = moveType == type 接入 StabMultiplierInHalves（3=×1.5 / 4=×2.0 Adaptability）
                      ⇒ 转换后计本系（v3.23 去徽标）*/,
  procChance:1.0
};
/* 转换属性招的实际输出倍率：宏族 ×1.0（无 10% 加成），仅三特例 ×1.1 */
function ateMulOf(id){var v=ABI_ATE.specialBoost[''+id];return (v===undefined?ABI_ATE.multiplier:v)}
/* 待实测参数清单——口径表 14 项 → 2026-10-06 源码考古 11 项 → 用户三项裁定 8 项 → 已按游戏源码核对后 5 项：
   ① v2.65+ 考古转定稿（去徽标）：manualDurTurns / rockTurnsManual（8→12，源码无 5 档）、terrainBoost、terrainExtenderTurns（12）、
      tailwindTurns（常量 3 ⇒ 实际 4 时段）、ABI_ATE.multiplier（1.0）/ stabConvert（.onStab 实证）；
   ② v2.65+ 考古**新增**待实测（挂徽标）：trickroomTurns（文案 5 / 推算 6，差 1）、frostbite.hailChanceMult（游戏源码中未见雪天 ×3）；
   ③ 持续待实测：lightClayTurns、toxicTerrain.spikesToToxicSpikes、toxicTerrain.seed。
   UI 徽标用 */
var WCONF_PEND={'WCONF.trickroomTurns':1,'WCONF.frostbite.hailChanceMult':1,'WCONF.lightClayTurns':1,
  'WCONF.toxicTerrain.spikesToToxicSpikes':1,'WCONF.toxicTerrain.seed':1,
  'WCONF.wxGrantOrder':1 /* v4.2 新增（用户指令「WCONF 补 wxGrantOrder」）：天气归属规则两代机制相反（快者/慢者主导），
     07 文档+研究资料 _03 §2.4 标【待实测】⇒ 按「待实测挂徽标」原则入清单（口径表原 5 项 → 6 项）*/};
function pendBadge(){return '<span class="badge badge-pend" title="该数值为口径表默认值，尚未经游戏内实测确认">待游戏内实测确认</span>'}
function pct(x){return Math.round(x*100)+'%'}
/* 分数显示（撒菱伤害表等整数倒数分数；避免 1/6 被 JS 打印成 0.16666666666666666） */
function fracTxt(v){return v?('1/'+Math.round(1/v)):''}
/* 天气属性增伤（只有雨/晴有伤害档；沙/雪 在 ER 是防御向） */
var WX_DMG={'雨':'水','晴':'火'};
/* 场地属性增伤 */
var TERRAIN_DMG={'电场':'电','精神场地':'超能力','青草场地':'草','剧毒场地':'毒'};
/* 雨/雪必中招（ER 官方：雨→打雷87/暴风542；雪→暴风雪59） */
var WX_NEVERMISS={'雨':[87,542],'雪':[59]};
/* 天气/场地数值文案（B10，全部读 WCONF） */
function wxNums(){
  return '手动天气 '+WCONF.manualDurTurns+' 回合（岩石 '+WCONF.rockTurnsManual+' 回合）· 特性天气 '+WCONF.abilityDurTurns+
    ' 回合（岩石 '+WCONF.rockTurnsAbility+' 回合）· 晴/雨增伤 ×'+(1+WCONF.boost)+'（已按游戏源码核对：不分手动/特性，单档）';
}
function terrainNums(){
  return '场地 '+WCONF.terrainDurTurns+' 回合（延展器 '+WCONF.terrainExtenderTurns+' 回合）· 场地属性增伤 ×'+WCONF.terrainBoost+'（已按游戏源码核对：B_TERRAIN_TYPE_BOOST=GEN_8）';
}
function wxGrantTxt(){
  return (WCONF.wxGrantOrder==='slow')
    ? '慢者后发动 ⇒ 慢者主导（现代口径：双方天气手同场时，速度慢者的特性最后发动、覆盖快者）'
    : '快者主导（旧口径：Speed is critical in determining which weather will be in place）';
}
/* 机制口径折叠块内容（B10：读 WCONF 汇总展示） */
function wxRuleHtml(){
  var rows=[
    ['天气·手动招式回合','WCONF.manualDurTurns',WCONF.manualDurTurns+' 回合（已按游戏源码核对 8，changelog 记 5）',''],
    ['天气·特性回合','WCONF.abilityDurTurns',WCONF.abilityDurTurns+' 回合',''],
    ['天气·岩石延长(特性)','WCONF.rockTurnsAbility',WCONF.rockTurnsAbility+' 回合',''],
    ['天气·岩石延长(手动)','WCONF.rockTurnsManual',WCONF.rockTurnsManual+' 回合（已按游戏源码核对：与特性同档 8→12；原记 5→8）',''],
    ['天气增伤(手动档)','WCONF.boost','+'+pct(WCONF.boost)+'（×'+(1+WCONF.boost)+'）',''],
    ['天气增伤(特性档·同档)','WCONF.abilityBoost','+'+pct(WCONF.abilityBoost)+'（×'+(1+WCONF.abilityBoost)+'，已按游戏源码核对：TryChangeBattleWeather 只写 TEMPORARY 档，无「特性 20%」档）',''],
    ['场地增伤','WCONF.terrainBoost','×'+WCONF.terrainBoost+'（已按游戏源码核对：B_TERRAIN_TYPE_BOOST=GEN_8）',''],
    ['场地回合','WCONF.terrainDurTurns',WCONF.terrainDurTurns+' 回合',''],
    ['场地延展器','WCONF.terrainExtenderTurns',WCONF.terrainExtenderTurns+' 回合（已按游戏源码核对：TERRAIN_DURATION 8/EXTENDED 12；原记 11）',''],
    ['顺风(手动)','WCONF.tailwindTurns',WCONF.tailwindTurns+' 回合（已按游戏源码核对：常量 3 + 当回合不递减 ⇒ 实际 4 个回合时段）',''],
    ['顺风(特性自动)','WCONF.autoTailwindTurns',WCONF.autoTailwindTurns+' 回合（已按游戏源码核对：SHORT=3，同上 ⇒ 实际 4 个回合时段，与手动相同）',''],
    ['光之黏土延展壁类','WCONF.lightClayTurns','待实测（已按游戏源码核对两条链路：招式壁类 5→8（持 Light Clay）／特性侧 North Wind 极光幕 3→5；Light Wield 属 v2.65 之后新增）','pend'],
    ['戏法空间','WCONF.trickroomTurns',WCONF.trickroomTurns+' 回合（官方文案 5；源码常量 5 + 当回合不递减 ⇒ 推算 6 个回合时段，差 1 待实测） / 先制 '+WCONF.trickroomPrio+'（已按游戏数据核对）','pend'],
    ['麻痹减速','WCONF.paraSpeed','×'+WCONF.paraSpeed+'（已按游戏源码核对：B_PARALYSIS_SPEED=GEN_7）',''],
    ['完全麻痹概率','WCONF.paraFullChance',pct(WCONF.paraFullChance)+'（已按游戏源码核对：Random()%4；后续版本 Champions 块改 12.5%）',''],
    ['撒菱','WCONF.hazardRules.spikes',WCONF.hazardRules.spikes.maxLayers+' 层 '+WCONF.hazardRules.spikes.dmg.map(fracTxt).join('→')+'（仅接地；2 层 1/6 系考古修正，原 3/16 为 Psypoke 讹误）',''],
    ['隐形岩','WCONF.hazardRules.stealthRock','单层 按岩石克制 '+WCONF.hazardRules.stealthRock.dmgByRockEff.join('/')+'（次序 bug 不计入：用户裁定「就算有 bug 也不应纳入考虑」，引擎不做任何次序判定/降权）',''],
    ['毒菱','WCONF.hazardRules.toxicSpikes',WCONF.hazardRules.toxicSpikes.maxLayers+' 层（钢免疫/接地毒系吸收）',''],
    ['黏黏网（粘网）','WCONF.hazardRules.stickyWeb','单层 换人 -1 速（飞行/飘浮/气球免疫）',''],
    ['除钉范围','WCONF.defogRapidSpin','高速旋转清自身侧 / 清除浓雾清双方钉子（已按游戏源码核对，不限场地）· 清除浓雾墙仅对手侧 · 降闪避 1 级（用户确认，定稿）',''],
    ['冻伤','WCONF.frostbite','每回合 '+fracTxt(WCONF.frostbite.dmgFraction)+' 最大HP + 特攻×'+WCONF.frostbite.spAtkMult+'（已按游戏源码核对）；冰雹触发×'+WCONF.frostbite.hailChanceMult+' 游戏源码中未见（旧版有/v2.65+ 仅 Cryomancy×5）','pend'],
    ['剧毒场地','WCONF.toxicTerrain','存在：'+WCONF.toxicTerrain.durTurns+' 回合 / 毒招 ×'+WCONF.toxicTerrain.boost+'（+'+pct(WCONF.toxicTerrain.boost-1)+'，用户确认，定稿） / 非毒钢接地每回合 '+fracTxt(WCONF.toxicTerrain.dmgFraction)+'（撒菱转毒菱：源码三处未找到实现'+pendBadge()+'；毒种子：'+WCONF.toxicTerrain.seed+'——v2.65 数据无该道具，源码有分支'+pendBadge()+'）',''],
    ['-ate 属性转换','ABI_ATE','倍率 ×'+ABI_ATE.multiplier+'（已按游戏源码核对：ATE_ABILITY 宏无 onOffensiveMultiplier；旧版 17 条硬编码 ×1.1 已移除） / 三特例 ×1.1：Normalize(96)/Crystallize(280)/Superconductor(659) / **来源属性 src**：皮肤系 6+1 条来源=一般（数据层 abiTags.conv），Crystallize 来源=岩石→冰、Superconductor 来源=钢→电（目标属性来自数据层；来源属性由 CONV_SRC 补登，命中优先） / 转换后按本系 ×1.6（.onStab 实证） / 触发率 '+ABI_ATE.procChance,''],
    ['天气归属（谁主导）','WCONF.wxGrantOrder',wxGrantTxt()+'（可配置参数：slow=现代 / fast=旧口径；两代机制相反，ER 属第三代内核但有现代改动 ⇒ 待实测）','pend'],
    ['威胁库使用率先验（弱先验）','使用率弱先验',threatPriorLine(),'']
  ];
  var h='<details class="rulebox"><summary>📐 机制口径（参数 ↔ 当前值；内部参数名供对照《机制默认口径表》）</summary><div class="scroll">'+
    '<table style="margin-top:2px"><thead><tr><th>机制</th><th>参数</th><th>当前值</th></tr></thead><tbody>';
  rows.forEach(function(r){
    h+='<tr><td>'+esc(r[0])+'</td><td style="font-size:11px;color:var(--sub)">'+esc(r[1])+'</td><td style="font-size:12px">'+r[2]+(r[3]==='pend'?pendBadge():'')+'</td></tr>';
  });
  h+='</tbody></table></div></div><div class="tip" style="font-size:11px">除钉 ID 勘误：229=高速旋转（清自身侧）/ 432=清除浓雾（清双方钉子、墙仅对手侧、降闪避 1 级）。考古勘误（2026-10-06）：撒菱 2 层 = 1/6（源码 (5-层)×2；原记 3/16 系 Psypoke 讹误）；场地属性增伤 ×1.3（源码 B_TERRAIN_TYPE_BOOST=GEN_8）。用户裁定（2026-10-06）定稿 3 项：剧毒场地毒招 +30%、清除浓雾降闪避 1 级、隐形岩次序 bug 不计入（引擎不做任何次序判定）。<b>v2.65+ 官方源码核对（2026-10-06，Pin A=7d85acd5@2026-03-28 / Pin B=910945b9@2026-10-06）</b>：天气回合 8/岩石 12（手动与特性同档；changelog 记「手动 5」与源码不符）、天气增伤**不分来源单档 ×1.5**（无「特性 20%」档）、场地倍率 ×1.3 与场地延展器 12 转定稿、顺风常量 3 ⇒ 实际 4 回合时段、-ate 宏族 **×1.0**（旧版 17 条 ×1.1 已移除；三特例 Normalize(96)/Crystallize(280)/Superconductor(659) 保留 ×1.1）、转换后计本系（.onStab）；新增 2 项待实测：戏法空间第 6 回合差、冻伤雪天 ×3 未找到。凡带「待游戏内实测确认」徽标者为默认口径、待实测定稿。</div></details>';
  return h;
}
/* 模板/提示文案口径修正（B8：删除写死的 20%/30%/8回合/无限天气旧文案）
   D3 修复（独立黑盒复验）：徽标只挂「待实测」参数（WCONF_PEND）——
   2026-10-06 考古收敛 11 项 → 用户三项裁定 8 项 → v3.23「以 v2.65+ 源码为准」后 = 5 项
   （trickroomTurns / frostbite.hailChanceMult / lightClayTurns / toxicTerrain 两项）；
   天气回合·增伤·场地倍率·顺风·-ate 已由 已按游戏源码核对定稿，故本函数不再挂徽标。 */
function wxTip(x){
  var s=String(x||'');
  s=s.replace(/ER 天气为无限回合（天气特性），但增伤从 50% 削到 20%/,
    'ER 天气 '+WCONF.abilityDurTurns+' 回合（带天气岩石 '+WCONF.rockTurnsAbility+' 回合）、手动天气招 '+WCONF.manualDurTurns+
    ' 回合，晴/雨增伤 ×'+(1+WCONF.boost)+'（已按游戏源码核对：不分手动/特性，无「特性 20%」档）');
  s=s.replace(/ER 晴增伤 20%/,'ER 晴天增伤 ×'+(1+WCONF.boost)+'（已按游戏源码核对，不分来源）');
  s=s.replace(/（ER 无限天气）/,'（天气 '+WCONF.abilityDurTurns+' 回合）');
  s=s.replace(/\+\s*30%(（ER 沿用）)?/g,'×'+WCONF.terrainBoost+'（已按游戏源码核对：B_TERRAIN_TYPE_BOOST=GEN_8）');
  s=s.replace(/顺风仅 4 回合/,'顺风 '+WCONF.tailwindTurns+' 回合（已按游戏源码核对：常量 3 ⇒ 实际 4 个回合时段）');
  return s;
}
/* ============ 规格 v1.0 引擎辅助（B3/B4/B5/B7/B9 共用） ============ */
/* B7：占位/无效物种护栏（base 六项全 0，如 id 2502 烈焰猴R-B） */
function isValidSp(s){
  if(!s)return false;
  if(''+s.id==='2502')return false;
  var sum=0,bs=s.base||[];for(var i=0;i<bs.length;i++)sum+=(bs[i]||0);
  return sum>0;
}
/* B5：-ate 属性转换特性（ERDATA.abiTags[*].conv；天性优先于可选池）
   注：用 abiTagOf（NM2ID，含 ERDATA.abiAlias 别名桥接）而非 abiIdByZhOrEn——
   物种表沿用 v0.3 译名（如水合=Hydrate 315、醉人=Intoxicate 325），纯规范名解析会漏（实测 27 条 conv 持有条目为别名型）。 */
/* v3.24 语义修正：conv **来源属性 src**。
   数据层 `ERDATA.abiTags[id].conv` 只给**目标**属性名，来源隐式为「一般」——对皮肤系（96/174/182/184/206/315/325）成立；
   但 280 Crystallize / 659 Superconductor 的真实来源并非一般系（gameData abilities 原文：
     280 "Rock-type moves become Ice" / 659 "Steel-type moves become Electric"），
   数据层已于 2026-10-07 00:24 补入这两条的**目标属性**（`280:{conv:'冰'}` / `659:{conv:'电'}`，仍无 src 字段）
   ⇒ 目标属性走数据层，**来源属性由引擎侧 CONV_SRC 补登**（键为特性 id；数据层 `配招工具_data.js` 只读，不在本文件改；
      名称经 NM2ID/abiAlias 桥接，如物种表译名「结晶」= 280）。
   CONV_SRC 命中优先于 abiTags.conv（否则 280 会退回 src='一般' → 复现「一般→冰」错判）。
   src 缺省 '一般' ⇒ 旧 7 条行为不变；`effMvType`/`convHit` 均按 src 判定来源属性。 */
var CONV_SRC={'280':{conv:'冰',src:'岩石'},'659':{conv:'电',src:'钢'}};
function convOf(s){
  if(!s)return null;
  var lists=[['天性',s.inns||[]],['可选',s.abis||[]]];
  for(var i=0;i<lists.length;i++){
    for(var j=0;j<lists[i][1].length;j++){
      var n=lists[i][1][j],id=NM2ID[n],ov=CONV_SRC[''+id];
      if(ov)return {type:ov.conv,src:ov.src,abi:n,scope:lists[i][0],id:''+id};
      var g=abiTagOf(n);
      if(g&&g.conv)return {type:g.conv,src:(g.src||'一般'),abi:n,scope:lists[i][0],id:''+(id===undefined?'' : id)};
    }
  }
  return null;
}
/* 招式有效属性（-ate：src 属性招 → 转换属性；src 缺省「一般」，见上 CONV_SRC） */
function effMvType(s,m,conv){return (conv&&m[3]===(conv.src||'一般'))?conv.type:m[3]}
/* conv 来源属性中文显示名（'一般' → 「一般属性招」；其余 → 「岩石系招」） */
function convSrcLabel(conv){var t=(conv&&conv.src)||'一般';return (t==='一般'?'一般属性招':(t+'系招'))}
/* B4：命中微调（acc==0 必中；<85 ×0.8；85~89 ×0.95） */
function hitAdjOf(m){
  var a=m[6];
  if(a===0)return {mul:1.05,why:'必中×1.05'};
  if(a&&a<85)return {mul:0.8,why:'命中'+a+'×0.8'};
  if(a>=85&&a<90)return {mul:0.95,why:'命中'+a+'×0.95'};
  return {mul:1,why:null};
}
/* 精灵自带天气/场地方案：特性档（天性固定生效）或手动档（可学设置招且体系匹配）→ 防"仅仅会学求雨"被误加权 */
function ownWxList(s,learn){
  var out=[],seen={};
  function push(sys,src){if(!sys||seen[sys+src])return;seen[sys+src]=1;out.push({sys:sys,src:src})}
  (s.inns||[]).forEach(function(n){var v=abiSetOf(n);if(v)push(v,'特性')});
  [[240,'雨'],[241,'晴'],[201,'沙'],[258,'雪'],[604,'电场'],[641,'精神场地'],[580,'青草场地'],[581,'薄雾场地']].forEach(function(p){
    if(learn.indexOf(p[0])>-1)push(p[1],'手动');
  });
  var sys=coreSys(s);
  return out.filter(function(o){return sys.indexOf(o.sys)>-1});
}
function wxConditionMet(s){return ownWxList(s,learnOf(s)).length>0}
/* B3：lDesc 代价标签（僵直/蓄力/反伤/必中/条件威力）→ {mul, tags[], note}；lDesc 缺失/空时 mul=1 与现状一致
   D4 修复（独立黑盒复验）：僵直判据原仅 /Needs recharging/i → 全库 1,032 招里只命中 63 破坏光线，
   漏掉同机制 8 招（416 终极冲击"needs to recharge"/439 岩石炮"recharges after hit"/
   307 爆炸烈焰·308 加农水炮·338 疯狂植物·722 流星突击·963 幽灵夜曲"Can only be used every-other turn"/
   723 无极光束"On the next turn, the user must rest"）。现按语义分两类：
   ① 僵直/间隔型（使用后歇一回合）→ 僵直×0.85；② 蓄力型（首回合蓄力、次回合命中）→ 蓄力×0.85（文案区分，避免误标）。
   注：/recharg/ 经全库扫描仅命中 63/416/439；/Charges?/ 单独不可用（撞击/闪焰冲锋/勇鸟猛攻等的
   修辞性 "charges" 会误判），故蓄力判据用「首回合 + 次回合」双条件短语。 */
function costOf(s,m,hasRec){
  var d=String((m&&m[10])||''),mul=1,tags=[],note='';
  if(/recharg|Can only be used every-?other turn|must rest/i.test(d)){mul*=0.85;tags.push('僵直×0.85');note='僵直：使用后需歇一回合（双打 AOE 更亏，慎配）'}
  else if(/on the first turn[^.]*(?:second|next)|Fires on second turn|and then attacks on the next turn/i.test(d)){mul*=0.85;tags.push('蓄力(2回合)×0.85');note='蓄力：首回合蓄力、次回合才命中（雨天/晴天等可即时发动的情形以游戏内实测为准）'}
  if(/recoil/i.test(d)){mul*=0.9;tags.push('反伤×0.9');if(!hasRec){mul*=0.9;tags.push('无回复再×0.9')}}
  if(/[Nn]ever misses/.test(d)){mul*=1.05;tags.push('必中×1.05')}
  if(/weather-?based|varies in power|depending on the weather/i.test(d)){
    var ok=s?wxConditionMet(s):false;
    if(ok)tags.push('条件威力(已满足)');
    else{mul*=0.7;tags.push('条件威力未满足×0.7')}
  }
  return {mul:mul,tags:tags,note:note};
}
/* B9 分层3 weatherAdj：天气/场地增伤
   v3.23（v2.65+ 已按游戏源码核对）：天气增伤**不按来源分档**——TryChangeBattleWeather 只写 TEMPORARY 槽（×1.5），
   viaAbility 形参不参与倍率 ⇒ 手动/特性同为 ×1.5（原「手动 ×1.5 / 特性 ×1.2」的分源写法已废）。 */
function weatherAdjOf(s,m,learn,conv){
  var ty=effMvType(s,m,conv),own=ownWxList(s,learn),best={mul:1,why:null};
  own.forEach(function(o){
    var bt=WX_DMG[o.sys];
    if(bt&&bt===ty){
      var v=(1+WCONF.boost);
      if(v>best.mul)best={mul:v,why:o.src+'天气('+o.sys+')增伤×'+v+'（v2.65 单档）'};
    }
    var tt=TERRAIN_DMG[o.sys];
    if(tt&&tt===ty){
      var tv=(o.sys==='剧毒场地'?WCONF.toxicTerrain.boost:WCONF.terrainBoost);
      if(tv>best.mul)best={mul:tv,why:o.sys+'属性增伤×'+tv+'（已按游戏源码核对）'};
    }
    if((WX_NEVERMISS[o.sys]||[]).indexOf(m[0]*1)>-1&&1.05>best.mul)best={mul:1.05,why:o.sys+'天必中×1.05'};
  });
  return best;
}
/* B9 分层3 abiAdj：① 精灵自身 out 特性（ABI_TAGS.out）对应侧 ×1.2；
   ② 免疫风险降权（规格原文「对手可能免疫属性（IMMUNE_RISK + 目标物种 abis/inns im）→ 该属性招 ×0.5 并警示」）——
      · 有目标且目标 im/hf 命中该属性 → ×0.5（规格字面口径，**本系也不豁免**）
      · 无目标（配招默认路径无对手信息）→ 保守降权 ×0.7 + 提示（存在可免疫该属性的常见特性才降）
      · **本系豁免（2026-10-06 用户裁决）**：isStab=true（本系含 -ate 转换后本系的主攻输出招）→ 不降权、保持 ×1，
        仅输出警示文案；非本系补盲招维持 ×0.7。
   注：特性名一律用 abiTagOf（别名桥接）——物种表别名型特性名实测 249 条 out 标签条目（如鸟群/华贵之鸟），
   纯规范名解析会漏。 */
function abiAdjOf(s,side,ty,names,targetNames,isStab){
  var best={mul:1,why:null,warn:null},hi=(s.base[1]>=s.base[3]?'物理':'特殊');
  names.forEach(function(n){
    var g=abiTagOf(n);
    if(!g||!g.out)return;
    var o=g.out,hit=false;
    if(o.type){var ts=(o.type instanceof Array)?o.type:[o.type];if(ts.indexOf(ty)>-1)hit=true}
    if(o.note&&/本系/.test(o.note))hit=true;
    if(o.stat){
      if(o.stat==='both')hit=true;
      else if(o.stat==='highest')hit=(side===hi||side==='双刀');
      else if(o.stat==='atk'&&(side==='物理'||side==='双刀'))hit=true;
      else if(o.stat==='spa'&&(side==='特殊'||side==='双刀'))hit=true;
    }
    if(hit&&best.mul<1.2)best={mul:1.2,why:n+'输出×1.2'+(o.cond?'('+o.cond+')':'')+(o.note?'('+o.note+')':''),warn:null};
  });
  if(IMMUNE_RISK[ty]&&IMMUNE_RISK[ty].length){
    best.warn=ty+'属性招可能被「'+IMMUNE_RISK[ty].slice(0,3).join('/')+'」等免疫特性废掉';
    if(targetNames&&targetNames.length){
      var hitAbi=[];
      targetNames.forEach(function(n){
        var g=abiTagOf(n);
        if(g&&((g.im&&g.im.indexOf(ty)>-1)||(g.hf&&g.hf.indexOf(ty)>-1)))hitAbi.push(n);
      });
      if(hitAbi.length){best.mul=Math.min(best.mul,0.5);best.warn='目标「'+hitAbi.join('/')+'」免疫/减半 '+ty+' 属性招 → ×0.5'}
    }else if(best.mul>0.7){
      /* 无明确对手：按规格 B9「对手可能免疫属性 → 该属性招降权并警示」做保守降权 ×0.7
         （存在可免疫该属性的常见特性才降，避免对无免疫风险的属性误伤）
         2026-10-06 用户裁决：**本系（含 -ate 转换后本系）主攻输出招豁免该 ×0.7 降权**（保持 ×1 打分），
         仅保留警示文案；非本系补盲招维持 ×0.7。有明确目标且目标真免疫时（上分支）本系招仍 ×0.5，不豁免。 */
      if(isStab){
        best.warn+='（本系主攻输出招，豁免无目标保守降权 ×0.7）';
      }else{
        best.mul=0.7;
        best.warn+='（无明确对手 → 保守降权 ×0.7）';
      }
    }
  }
  return best;
}
/* ============ Tab 切换 ============ */
/* ==================== v4.x 引擎 / UI 扩展层 ====================
   数据契约（数据层并行产出，缺失时优雅回退）：
   mvDescZh(dict id→中文desc) / abiDescZh(dict id→中文desc) / glossary(数组) /
   familyRoot(dict formId→rootId) / templates(≥18 套)。
   回退链：招式 desc → m[9]（英文官方）→ m[10]（ER lDesc）；特性 desc → 数据层 abilities[3]（已含中文）→ abiTags.nt；
   glossary → 引擎侧 GLOSS_FALLBACK；familyRoot → 名称启发式 famKeyHeur；templates → 引擎侧 TPL_EXTRA 兜底。 */
var V4FIELDS=(function(){
  var o={mvDescZh:false,abiDescZh:false,glossary:false,familyRoot:false,templates:0};
  try{
    o.mvDescZh=!!(ERDATA.mvDescZh&&Object.keys(ERDATA.mvDescZh).length);
    o.abiDescZh=!!(ERDATA.abiDescZh&&Object.keys(ERDATA.abiDescZh).length);
    o.glossary=!!(ERDATA.glossary&&ERDATA.glossary.length);
    o.familyRoot=!!(ERDATA.familyRoot&&Object.keys(ERDATA.familyRoot).length);
    o.templates=(ERDATA.templates||[]).length;
  }catch(e){}
  return o;
})();
function v4ContractNote(){
  var m=[];
  if(!V4FIELDS.mvDescZh)m.push('招式中文说明缺 → 回退英文原文');
  if(!V4FIELDS.abiDescZh)m.push('特性中文说明缺 → 回退游戏原文');
  if(!V4FIELDS.glossary)m.push('机制词条缺 → 使用内置词表');
  if(!V4FIELDS.familyRoot)m.push('进化家族缺 → 按名称归族');
  if(V4FIELDS.templates<18)m.push('战术模板 '+V4FIELDS.templates+' 套（<18）→ 使用内置模板');
  return m.length?('数据来源不全：'+m.join('；')):'数据来源完整（招式/特性中文说明、机制词条、进化家族、战术模板齐备）';
}
/* --- ①中文描述回退链 --- */
function mvDescOf(m){
  if(!m)return '';
  var z=ERDATA.mvDescZh?ERDATA.mvDescZh[''+m[0]]:null;
  if(z)return z;
  return m[9]||m[10]||'';
}
function abiDescZhOf(id){
  var z=ERDATA.abiDescZh?ERDATA.abiDescZh[''+id]:null;
  if(z)return z;
  var a=ABI[id];
  if(a&&a[3])return a[3];
  var g=ERDATA.abiTags[id];
  if(g&&g.nt)return g.nt;
  return '';
}
/* --- ③GLOSSARY 词条表（数据层缺 → 引擎侧兜底，全部来自口径表/源码考古口径） --- */
var GLOSS_FALLBACK=[
  {term:'天气',brief:'雨/晴/沙/雪：手动招与特性同档 8 回合（岩石 12）；晴/雨对本系对应属性增伤 ×1.5（已按游戏源码核对，不分来源）。部分招式在特定天气下必中或获得加成。'},
  {term:'场地',brief:'电气/精神/青草/薄雾/剧毒场地：8 回合（场地制造机 12）；对应属性增伤 ×1.3（已按游戏源码核对 B_TERRAIN_TYPE_BOOST=GEN_8）；接地宝可梦另有增益。'},
  {term:'剧毒场地',brief:'出场特性或招式制造，8 回合；毒/钢以外接地宝可梦每回合 1/16 最大HP 伤害；毒属性招式增伤 +30%（用户游戏内确认）。'},
  {term:'钉子',brief:'隐形岩（按岩石克制倍率 1/2~1/32）、撒菱（1/8→1/6→1/4，仅接地）、毒菱（2 层，毒/钢免疫）、黏黏网（换人 -1 速）。高速旋转清自身侧，清除浓雾清双方。'},
  {term:'强化',brief:'能力提升类招式（剑舞/诡计/生长/蝶舞等）。晴天「生长」攻击与特攻双倍提升。'},
  {term:'异常状态',brief:'剧毒（递增伤害）/麻痹（速度 ÷2、完全麻痹 25%）/冻伤（特攻 ×0.5、每回合 1/16）/灼伤/睡眠。'},
  {term:'冻伤',brief:'ER 以冻伤替代冰冻：特攻 ×0.5，每回合 1/16 最大HP 伤害；冰雹触发几率 ×3（待实测，v2.65+ 源码未见）。'},
  {term:'麻痹',brief:'速度 ×0.5；25% 概率完全无法行动（已按游戏源码核对）。'},
  {term:'剧毒',brief:'每回合伤害递增（1/16→2/16→…）；毒/钢属性免疫。'},
  {term:'先制',brief:'先制等级 +1～+7 决定同回合出手顺序；戏法空间内先制 -7 且更慢者先手。'},
  {term:'蓄力',brief:'间隔型招式：命中后下一回合无法行动（破坏光线/疯狂植物/爆炸烈焰等）。引擎按代价 ×0.85 计权。'},
  {term:'属性转换',brief:'-ate 家族特性：来源属性招式转为目标属性并按本系 STAB ×1.6 结算；280 结晶化（岩石→冰）、659 超导体（钢→电）为特例 +10%。'},
  {term:'本系',brief:'招式属性与自身属性一致 → STAB ×1.6；经 -ate 转换后的属性同样算本系。'},
  {term:'免疫',brief:'属性免疫或特性免疫（蓄电/引水/飘浮/储水等）使对应属性招完全无效；配招需保留补盲手段。'},
  {term:'天气手',brief:'持有出场设置天气/场地特性或可学对应天气招的宝可梦，为天气体系提供起手（核心自身非设置手时由队友提供）。'}
];
/* 数据层 glossary 实际形状：{key,term(英文名含括注),zh(中文名),body} —— 匹配键同时取 zh/term/name（中英双通）
   2026-10-07 用户裁定「隐形岩次序 bug 不入引擎」→ 词表中该条目同步排除（不展示、不挂提示） */
var GLOSS_EXCLUDE=/stealth rock bug|隐形岩[^]{0,16}(bug|疑似|失效|次序|顺序|非首铺|beta)/i;
function glossList(){
  var g=(ERDATA.glossary&&ERDATA.glossary.length)?ERDATA.glossary:GLOSS_FALLBACK;
  return g.filter(function(x){return !(x&&GLOSS_EXCLUDE.test(''+(x.key||'')+(x.term||'')+(x.zh||'')+(x.body||'')))});
}
function glossKeys(g){
  if(!g)return [];
  var a=[];
  if(typeof g.zh==='string'&&g.zh)a.push(g.zh);
  if(typeof g.name==='string'&&g.name)a.push(g.name);
  if(typeof g.term==='string'&&g.term){
    a.push(g.term);
    var s=g.term.replace(/\s*[（(].*$/,'').trim();
    if(s&&s!==g.term)a.push(s);
  }
  return a.filter(function(x){return x&&x.length>1});
}
function glossFind(term){
  var a=glossList(),i,k;
  for(i=0;i<a.length;i++){if(glossKeys(a[i]).indexOf(term)>-1)return a[i]}
  for(i=0;i<a.length;i++){var ks=glossKeys(a[i]);for(k=0;k<ks.length;k++){if(ks[k].indexOf(term)>-1||term.indexOf(ks[k])>-1)return a[i]}}
  return null;
}
function glossBrief(g){return playText(g?(g.brief||g.body||g.desc||g.detail||g.text||g.zh||''):'')}
/* v4.6 收尾②b：数据层词条正文（配招工具_data.js，只读）仍含旧版开发过程语 → 展示层统一「玩家化」过滤
   （不改数据源；仅在渲染/提示层重写为玩家话术，与引擎内文案同口径。词条正文中的参数符号保留：用户此前裁定参数需可溯源） */
var PLAY_TEXT_RE=[
  [/源码实证/g,'已按游戏源码核对'],
  [/数据表实证/g,'已按游戏数据核对'],
  [/源码未找到/g,'游戏源码中未见'],
  [/待游戏内截图校准/g,'待游戏内实测确认'],
  [/v2\.65\s*(?=已按游戏源码核对)/g,''],
  [/在线源码考古/g,'官方源码核对'],
  [/源码考古/g,'已按游戏源码核对']
];
function playText(s){
  if(s==null)return '';
  var t=String(s);
  for(var i=0;i<PLAY_TEXT_RE.length;i++)t=t.replace(PLAY_TEXT_RE[i][0],PLAY_TEXT_RE[i][1]);
  return t;
}
function glossTerms(){
  var out=[];
  glossList().forEach(function(g){
    glossKeys(g).forEach(function(k){
      if(/^[\x00-\x7F]+$/.test(k)){if(k.length>=4)out.push(k)}   /* 英文键需 ≥4 字符，避免 "Sun"/"Hail" 之类噪声 */
      else if(k.length>=2)out.push(k);                            /* 中文键需 ≥2 字，避免单字「雪/电」到处标蓝 */
    });
  });
  return out;
}
function escq(s){return esc(s).replace(/"/g,'&quot;')}
/* 内联 onclick 里的「JS 字符串字面量」安全构造器：
   · 先做 JS 转义（反斜杠 / 双引号），再整体过 escq 做 HTML 属性转义
   · 结果形如 &quot;叶绿素&quot;，浏览器解析属性后得到合法 JS："叶绿素"
   —— 直接 JSON.stringify 会产出裸双引号，截断 onclick="..." 属性（D1 阻塞级缺陷根因） */
function jsl(s){return escq('"'+String(s).replace(/\\/g,'\\\\').replace(/"/g,'\\"')+'"')}
/* 纯 CSS tooltip（data-g 属性 + :hover::after），不遮战斗视野、无 JS 弹层 */
function glossify(txt){
  var t=esc(txt||''),terms=glossTerms().slice().sort(function(a,b){return b.length-a.length});
  if(!terms.length)return t;
  var pat=terms.map(function(x){return String(x).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')});
  var re=new RegExp('('+pat.join('|')+')','g'),out=[],last=0,m;
  while((m=re.exec(t))!==null){
    out.push(t.slice(last,m.index));
    out.push('<span class="gl" data-g="'+escq(glossBrief(glossFind(m[1])))+'" onclick="glossClick('+jsl(m[1])+')">'+m[1]+'</span>');
    last=m.index+m[1].length;
  }
  out.push(t.slice(last));
  return out.join('');
}
function glossClick(term){
  var g=glossFind(term),d=$('glDetail');if(!d)return;
  var src=V4FIELDS.glossary?'机制词条表（来自游戏数据）':'引擎侧兜底词表（数据未提供词条）';
  var h='<h2>📖 '+esc(term)+'</h2><div class="mini" style="color:var(--sub);margin-bottom:6px">词条来源：'+esc(src)+'</div>';
  h+='<div class="sec"><div style="font-size:13px;line-height:1.95">'+glossify(glossBrief(g)||'（无释义）')+'</div></div>';
  var rel=[];
  if(term==='天气')rel=[['招式','大晴天'],['招式','求雨'],['招式','沙暴'],['招式','冰雹']];
  else if(term==='场地')rel=[['招式','电气场地'],['招式','精神场地'],['招式','青草场地'],['招式','薄雾场地']];
  else if(term==='钉子')rel=[['招式','隐形岩'],['招式','撒菱'],['招式','毒菱'],['招式','黏黏网'],['招式','高速旋转'],['招式','清除浓雾']];
  else if(term==='强化')rel=[['招式','剑舞'],['招式','诡计'],['招式','生长']];
  else if(term==='异常状态'||term==='剧毒')rel=[['招式','剧毒']];
  else if(term==='属性转换')rel=[['特性','结晶化'],['特性','超导体'],['特性','一般皮肤']];
  else if(term==='本系')rel=[['特性','结晶化'],['特性','水泡'],['特性','妖精皮肤']];
  if(rel.length){
    h+='<div class="sec"><h3>相关词条跳转</h3><div style="line-height:30px">'+rel.map(function(p){
      var act=p[0]==='招式'?'gotoMv':'gotoAbi';
      return '<span class="abi" onclick="closeGl();'+act+'('+jsl(p[1])+')">'+esc(p[1])+'</span>';
    }).join(' ')+'</div></div>';
  }
  h+='<div class="mini" style="color:var(--sub);margin-top:8px">轻量居中弹层（带遮罩，点遮罩或 × 关闭，Esc 亦可）；正文中带虚线下划线的机制词均可点击打开。</div>';
  d.innerHTML=h;
  var t=$('glTitle');if(t)t.textContent='📖 '+term;
  var m=$('glModal');if(m)m.classList.add('open');
}
function closeGl(){var m=$('glModal');if(m)m.classList.remove('open')}
/* --- ⑥-2 形态家族（familyRoot 缺失 → 名称启发式） --- */
function famKeyHeur(s){
  var zh=String(s.zh||'').replace(/[（(][^）)]*[）)]/g,'');
  zh=zh.replace(/^(超级|原始|究极)/,'').replace(/[-\s]*(灵兽|化身)形态$/,'').replace(/[-\s·]*(plus|PLUS)$/,'').replace(/[XYR]$/,'').replace(/[-\s]*(Mega|Redux)\s*[XYR]?$/i,'').trim();
  if(zh)return zh;
  var en=String(s.en||'').replace(/[^A-Za-z]/g,'').replace(/(Mega|Redux)[XYR]?$/i,'').toUpperCase();
  return en||('#'+s.id);
}
function famKey(s){
  if(ERDATA.familyRoot){var v=ERDATA.familyRoot[''+s.id];if(v!==undefined&&v!==null&&v!=='')return ''+v}
  return famKeyHeur(s);
}
/* --- 体系（天气/场地）辅助 --- */
var SYS_TXT={雨:'雨',晴:'晴',沙:'沙',冰雹:'雪',雪:'雪',电气场地:'电场',精神场地:'精神场地',青草场地:'青草场地',薄雾场地:'薄雾场地',剧毒场地:'剧毒场地'};
function spSys(s){return coreSys(s)}
function isAbilSet(s,sys){var hit=false;s.abis.concat(s.inns).forEach(function(n){if(abiSetOf(n)===sys)hit=true});return hit}
function isMvSet(s,sys){var hit=false;learnOf(s).forEach(function(id){if(WEATHER_MV[id]===sys)hit=true});return hit}
function isSetter(s,sys){return isAbilSet(s,sys)||isMvSet(s,sys)}
function sysSetterOf(s,sys){
  var ab=null,mv=null;
  s.abis.concat(s.inns).forEach(function(n){if(!ab&&abiSetOf(n)===sys)ab=n});
  learnOf(s).forEach(function(id){if(!mv&&WEATHER_MV[id]===sys)mv=MV[id]?MV[id][1]:id});
  if(ab)return {kind:'特性',name:ab};
  if(mv)return {kind:'招式',name:mv};
  return null;
}
function isWxSys(x){return Object.keys(SYS_SET).some(function(n){return SYS_SET[n]===x})}
function sysBenefitNames(sys){return Object.keys(SYS_MAP).filter(function(n){return SYS_MAP[n]===sys})}
function sysSetterName(s,sys){var nm='';s.abis.concat(s.inns).forEach(function(n){if(!nm&&abiSetOf(n)===sys)nm=n});return nm}
function tplSys(t){
  var out={},abis=(t.match&&t.match.abis)||[],mvs=(t.match&&t.match.moves)||[];
  abis.forEach(function(a){var v=abiSysOf(a);if(v)out[v]=1});
  mvs.forEach(function(n){var id=mvIdByZhOrEn(n);if(id!==null&&WEATHER_MV[id])out[WEATHER_MV[id]]=1});
  var txt=String(t.name||'')+String(t.theme||'');
  Object.keys(SYS_TXT).forEach(function(k){if(txt.indexOf(k)>-1)out[SYS_TXT[k]]=1});
  if(txt.indexOf('沙')>-1&&txt.indexOf('沙暴')>-1)out['沙']=1;
  return Object.keys(out);
}
/* 本系折算最高威力（力度指标，供模板权重与提示用） */
function bestPowOf(s,side,conv){
  var best=0;
  learnOf(s).forEach(function(id){
    var m=MV[id];if(!m||m[4]==='变化')return;
    var okSide=(side==='双刀')?true:(side==='物理'?m[4]==='物理':m[4]==='特殊');  /* 数据层 m[4] 为中文分类（物理/特殊/变化）；旧写法比 'PHYSICAL' 永不命中 */
    if(!okSide)return;
    var ty=effMvType(s,m,conv||convOf(s));
    var stab=(ty===s.t1||ty===s.t2)?1.6:1;
    var pw=(m[5]||0)*stab;
    if(pw>best)best=pw;
  });
  return best;
}
/* --- ⑧全局模糊搜索（中文/英文/编号/描述子串包含，多词空格 AND） --- */
function fzParts(q){return String(q||'').toLowerCase().trim().split(/\s+/).filter(Boolean)}
function fzAny(q,list){
  var parts=fzParts(q);
  if(!parts.length)return true;
  for(var i=0;i<parts.length;i++){
    var ok=false;
    for(var j=0;j<list.length;j++){var v=list[j];if(v===undefined||v===null)v='';if(String(v).toLowerCase().indexOf(parts[i])>-1){ok=true;break}}
    if(!ok)return false;
  }
  return true;
}
function spFields(s){return [s.id,s.zh,s.en,spBst(s)]}
/* --- ⑨克制格 → 受影响宝可梦列表（实际承受倍率 = 属性 × 天性 × ABI_TAGS im/hf/add） --- */
function mxBucket(v){
  if(v===0)return '0×（免疫）';
  if(v<0.5)return '0.25×';
  if(v<1)return '0.5×（抵抗）';
  if(v===1)return '1×（中性）';
  if(v<4)return v+'×（弱点）';
  return '4×（双弱点）';
}
var MX_ORDER=['0×（免疫）','0.25×','0.5×（抵抗）','1×（中性）','2×（弱点）','4×（双弱点）'];
/* 数据层预计算矩阵消费（并行协同契约）：ERDATA.matchupSp = {attTypeId:{spId:倍率}}，稀疏存储（未列出即 1×），
   已按天性 + ABI_TAGS im/hf/add 修正 ⇒ 有则直接用，无则回退本页实时计算（defCellTrio）。 */
function mxTypeKey(at){
  var T=ERDATA.types||[],i,x;
  for(i=0;i<T.length;i++){x=T[i];if(typeof x==='string'?x===at:(x&&(x.zh===at||x.name===at)))return i}
  return -1;
}
function mxSpPre(at){
  var M=ERDATA.matchupSp;if(!M||typeof M!=='object')return null;
  var ti=mxTypeKey(at),tk=[at,''+at];
  if(ti>-1){tk.push(ti);tk.push(''+ti)}
  var i,k,o;
  /* 形状 A（契约）：{攻属性:{spId:倍率}} 稀疏存储，未列出即 1× */
  for(i=0;i<tk.length;i++){
    o=M[tk[i]];
    if(o&&typeof o==='object'){
      var n=0;for(k in o){if(typeof o[k]==='number')n++}
      if(n>0)return function(s){var v=o[s.id]!==undefined?o[s.id]:o[''+s.id];return typeof v==='number'?v:1};
    }
  }
  /* 形状 B（容错）：{spId:{攻属性:倍率}} */
  var probe=null,c=0;
  for(k in M){var v2=M[k];if(v2&&typeof v2==='object'){c++;if(!probe)probe=v2}if(c>4)break}
  if(probe){
    var hit=false;for(i=0;i<tk.length;i++){if(typeof probe[tk[i]]==='number')hit=true}
    if(hit)return function(s){
      var r=M[s.id]!==undefined?M[s.id]:M[''+s.id];if(!r)return 1;
      for(var j=0;j<tk.length;j++){var v=r[tk[j]];if(typeof v==='number')return v}
      return 1;
    };
  }
  return null;
}
/* --- ⑨克制格「点格看人」：攻/防两视角逻辑不同（v4.x UI 定稿：就地内联展开 + 精灵图卡片网格，不用右侧抽屉） ---
   · 进攻视角（点攻击属性格）：按「实际承受倍率」分组列全图鉴宝可梦（服务「我这招打谁有效」）
   · 防守视角（点防守属性格）：列出「拥有该防守属性组合」的宝可梦（精灵图 + 次要属性），点卡跳详情看完整承受表
   · 倍率口径：ERDATA.matchupSp（数据层预计算）优先，缺失回退本页 defCellTrio（属性 × 天性 × ABI_TAGS） */
function mxRowsOf(at){
  var rows=[],counts={},pre=mxSpPre(at);
  ERDATA.species.forEach(function(s){
    if(!isValidSp(s))return;
    var tr=defCellTrio(s,at);
    var act=tr.pick?tr.opt:tr.inn,src='live';
    if(pre){
      var pv=pre(s);
      if(typeof pv==='number'&&isFinite(pv)){
        /* 矩阵口径 = 天性档；若当前队伍已为这只勾选了可选特性，则按 tr 的差值叠加（与 pickAbi 同口径） */
        var ratio=(tr.inn&&isFinite(tr.inn))?(tr.opt/tr.inn):1;
        act=(tr.pick&&isFinite(ratio))?Math.round(pv*ratio*100)/100:pv;
        src='pre';
      }
    }
    var b=mxBucket(act);
    counts[b]=(counts[b]||0)+1;
    rows.push({s:s,base:tr.base,inn:tr.inn,act:act,cap:!!tr.pick,b:b,src:src});
  });
  return {rows:rows,counts:counts,pre:!!pre};
}
function mxCard(s,right,tip){
  return '<div class="mxc'+(right===0?' imm':'')+'" onclick="openSpById(\''+s.id+'\')" title="'+escq(tip||('查看 '+s.zh+' 详情（含完整承受表）'))+'">'+
    sprRaw(s.id)+'<div class="mcnm">'+esc(s.zh)+'</div><div class="mcx">'+esc(right===undefined?'':''+right)+'</div></div>';
}
function openSpById(id){var s=speciesById(id);if(s)openSp(s)}
/* 进攻视角面板：按实际承受倍率分组（×1 默认折叠） */
function mxPanelAtk(at,showNeutral,all){
  var R=mxRowsOf(at),h='';
  h+='<div class="mxhd2">🔱 进攻视角：'+tlabel(at)+' 属性招式 → <b>打谁有效</b>（按实际承受倍率分组）'+
     '<span class="mini">倍率 = 属性 × 天性 × ABI_TAGS(im/hf/add)；来源：'+(R.pre?'数据层 matchupSp':'本页实时计算')+'；有效物种 '+R.rows.length+' 只</span></div>';
  h+='<div class="mxbuckets">'+MX_ORDER.filter(function(k){return R.counts[k]}).map(function(k){return '<span class="tagline">'+esc(k)+' '+R.counts[k]+'</span>'}).join(' ')+
     '<label class="mini" style="margin-left:8px"><input type="checkbox" '+(showNeutral?'checked':'')+' onclick="mxToggleNeutral(this.checked)"> 含 ×1（中性）</label></div>';
  MX_ORDER.forEach(function(k){
    if(!R.counts[k])return;
    if(k==='1×（中性）'&&!showNeutral)return;
    var list=R.rows.filter(function(r){return r.b===k});
    var cap=all?9999:60;
    h+='<div class="mxsec"><div class="mxsechd">'+esc(k)+'（'+R.counts[k]+'）</div><div class="mxgrid">';
    list.slice(0,cap).forEach(function(r){h+=mxCard(r.s,r.act+'×','属性 '+r.base+'× → 天性 '+r.inn+'× → 实际 '+r.act+'×'+(r.cap?'（含勾选特性）':'')+(r.src==='pre'?'（matchupSp）':''))});
    if(list.length>cap)h+='<button class="btn-mini mxmore" onclick="mxMore()">展开全部<br>'+list.length+' 只</button>';
    h+='</div></div>';
  });
  if(!showNeutral)h+='<div class="mini" style="color:var(--sub)">×1（中性）'+R.counts['1×（中性）']+' 只已折叠</div>';
  return h;
}
/* 防守视角数据源：单属性（'飞行'）→ t1/t2 含该属性；组合（'飞行+水'）→ 组合完全一致 */
function mxDefList(types){
  var want=types.split('+').sort();
  return ERDATA.species.filter(function(s){
    if(!isValidSp(s))return false;
    var pair=[s.t1];if(s.t2&&s.t2!==s.t1)pair.push(s.t2);
    pair=pair.sort();
    if(want.length===1)return pair.indexOf(want[0])>-1;
    return pair.join('+')===want.join('+');
  });
}
/* 防守视角面板：列出「拥有该防守属性组合」的宝可梦（不按倍率分组） */
function mxPanelDef(types,all){
  var list=mxDefList(types);
  var cap=all?9999:120,h='';
  h+='<div class="mxhd2">🛡 防守视角：'+types.split('+').map(function(t){return tlabel(t)}).join(' ') +' → <b>拥有该属性的宝可梦</b> '+list.length+' 只'+
     '<span class="mini">（点卡片跳详情看「该宝可梦完整承受表 + 天性修正」，本视角只列属性归属、不按倍率分组）</span></div>';
  if(!list.length){h+='<div class="mini" style="color:var(--sub)">无该属性组合的宝可梦</div>';return h}
  h+='<div class="mxgrid">';
  list.slice(0,cap).forEach(function(s){
    h+='<div class="mxc" onclick="openSpById(\''+s.id+'\')" title="'+escq(s.zh+' 属性 '+s.t1+(s.t2&&s.t2!==s.t1?'/'+s.t2:'')+' → 查看详情与完整承受表')+'">'+sprRaw(s.id)+
      '<div class="mcnm">'+esc(s.zh)+'</div><div class="mcx">'+esc(s.t1+(s.t2&&s.t2!==s.t1?'·'+s.t2:''))+'</div></div>';
  });
  if(list.length>cap)h+='<button class="btn-mini mxmore" onclick="mxMore()">展开全部<br>'+list.length+' 只</button>';
  return h+'</div>';
}
var _mx={at:null,view:'atk',neutral:false,all:false,node:null};
function mxInline(at,el,view){
  var host=(el&&el.closest)?el.closest('.kgroup'):null;
  if(!host)host=$('atkResult')||$('defResult');
  if(_mx.node&&_mx.node.parentNode)_mx.node.parentNode.removeChild(_mx.node);
  var same=(_mx.node&&_mx.at===at&&_mx.view===view&&_mx.host===host);
  _mx={at:at,view:view,neutral:false,all:false,node:null,host:host};
  if(same)return;                                   /* 再次点同一格 → 收起 */
  var box=document.createElement('div');box.className='mxinline';
  box.setAttribute('data-at',at);box.setAttribute('data-view',view);
  box.innerHTML=(view==='def'?mxPanelDef(at,false):mxPanelAtk(at,false,false))+
    '<div style="margin-top:8px"><button class="btn-mini" onclick="closeMx()">收起 ×</button></div>';
  host.parentNode.insertBefore(box,host.nextSibling);
  _mx.node=box;
}
function mxRe(){
  if(!_mx.node)return;
  _mx.node.innerHTML=(_mx.view==='def'?mxPanelDef(_mx.at,_mx.all):mxPanelAtk(_mx.at,_mx.neutral,_mx.all))+
    '<div style="margin-top:8px"><button class="btn-mini" onclick="closeMx()">收起 ×</button></div>';
}
function mxMore(){_mx.all=true;mxRe()}
function mxToggleNeutral(v){_mx.neutral=!!v;mxRe()}
function closeMx(){if(_mx.node&&_mx.node.parentNode)_mx.node.parentNode.removeChild(_mx.node);_mx.node=null;_mx.at=null}
/* 兼容旧断言/旧入口：openMxList 走就地展开（不再有右侧抽屉）；mxPanel 为纯面板 HTML 入口 */
function mxPanel(at,showNeutral,all){return mxPanelAtk(at,!!showNeutral,!!all)}
function openMxList(at,showNeutral,view){
  var anchor=[];
  if(view==='def'){document.querySelectorAll('#defResult span').forEach(function(sp){if(sp.textContent===at||sp.getAttribute('data-at')===at)anchor.push(sp)})}
  var el=anchor[0]||document.querySelector('#atkResult .kgroup')||document.querySelector('#defResult .kgroup');
  mxInline(at,el,view==='def'?'def':'atk');
}
/* --- ⑩队伍筛选辅助：定位标签 --- */
function spRoleTags(s){
  var b=s.base,t=[];
  if(b[1]>=110)t.push('物攻手');
  if(b[3]>=110)t.push('特攻手');
  if(b[2]+b[4]>=200)t.push('盾');
  if(b[5]>=110)t.push('速攻');
  if(b[5]<=45)t.push('空间向');
  return t;
}
/* --- ⑪特性标签解读（im/hf/add/out/def/conv/nt 逐标签） --- */
function abiTagLines(id){
  var g=ERDATA.abiTags[''+id];if(!g)return [];
  var L=[];
  if(g.im)L.push('免疫（im）：'+g.im.join('/')+' 属性招式完全无效');
  if(g.hf)L.push('减半（hf）：'+g.hf.join('/')+' 属性招式伤害 ×0.5');
  if(g.add)L.push('加属性（add）：视为额外属性 '+g.add.join('/')+'（影响本系 STAB 与弱点）');
  if(g.out){
    var o=g.out,s1=[];
    if(o.type)s1.push(o.type+' 系');
    if(o.mul)s1.push('×'+o.mul);
    if(o.cond)s1.push('（'+o.cond+'）');
    if(o.stat)s1.push('影响 '+o.stat);
    L.push('输出强化（out）：'+(s1.join(' ')||JSON.stringify(o)));
  }
  if(g.def)L.push('防御强化（def）：'+(typeof g.def==='string'?g.def:JSON.stringify(g.def)));
  if(g.conv){
    var cv=g.conv;
    L.push('属性转换（conv）：'+(typeof cv==='object'?((cv.src||'一般')+' 系招 → '+cv.conv+' 系'):(cv+'（来源 一般）'))+'，按本系 STAB ×1.6 结算');
  }
  if(g.nt)L.push('备注（nt）：'+g.nt);
  Object.keys(g).forEach(function(k){if(['im','hf','add','out','def','conv','nt'].indexOf(k)<0)L.push(k+'：'+JSON.stringify(g[k]))});
  return L;
}
/* v4.x B⑦：流派卡/配招依据的判定口径依据（单一真值源：WCONF / ABI_ATE / hitAdjOf / costOf / abiAdjOf） */
function coreRuleBrief(s,bd){
  var L=[],sys=coreSys(s);
  if(sys.length)L.push('体系 '+sys.join('/')+'：天气/场地 '+WCONF.abilityDurTurns+' 回合（岩石 '+WCONF.rockTurnsAbility+'）');
  L.push('天气增伤 ×'+(1+WCONF.boost)+'（手动/特性一致，已按游戏源码核对）');
  L.push('场地增伤 ×'+WCONF.terrainBoost+'（已按游戏源码核对）');
  L.push('命中 <85 ×0.8 / 85~89 ×0.95 / 必中 ×1.05；僵直·蓄力 ×0.85；反伤 ×0.9');
  L.push('无目标免疫风险：本系主攻豁免（仅警示）、非本系补盲 ×0.7；有目标真免疫 ×0.5');
  var cv=convOf(s);
  if(cv)L.push('-ate 属性转换：'+convSrcLabel(cv)+'→'+cv.type+'（按本系 STAB ×1.6，转换招 ×'+ateMulOf(cv.id)+'）');
  return L.join('　·　');
}
/* 队友行（整体列表 + 各流派列表共用） */
function tmRow(r){
  return '<tr><td><span class="spthumb">'+sprRaw(r.s.id)+'</span> <b>'+esc(r.s.zh)+'</b> <span style="font-size:11px;color:var(--sub)">#'+r.s.id+'</span></td><td>'+tlabel(r.s.t1)+(r.s.t2!==r.s.t1?' '+tlabel(r.s.t2):'')+'</td><td><b style="color:var(--accent)">+'+r.score+'</b></td><td style="font-size:12px">'+esc(r.why.join('；'))+'</td>'+
    '<td><button class="btn-mini" onclick="addToTeam(ERDATA.species.filter(function(x){return x.id==\''+r.s.id+'\'})[0],null);renderCore(coreSel)" title="加入队伍">➕</button> '+
    '<button class="btn-mini" onclick="openSp(ERDATA.species.filter(function(x){return x.id==\''+r.s.id+'\'})[0])" title="看详情">🔍</button></td></tr>';
}
function switchTab(name){
  document.querySelectorAll('nav button').forEach(function(b){b.classList.toggle('active',b.dataset.tab===name)});
  document.querySelectorAll('.tab').forEach(function(x){x.classList.toggle('active',x.id==='tab-'+name)});
  try{window.scrollTo(0,0)}catch(e){} /* v4.6-C：切 Tab 回顶（与 selectCore 行为一致） */
}
document.querySelectorAll('nav button').forEach(function(b){
  b.onclick=function(){switchTab(b.dataset.tab)};
});

/* ============ 宝可梦列表 ============ */
var spFilter={types:{}},spShown=0,spStep=120;
function renderSpChips(){
  var box=$('spTypeChips');box.innerHTML='';
  ERDATA.types.forEach(function(t){
    box.appendChild(tchip(t,!!spFilter.types[t],function(){
      spFilter.types[t]=!spFilter.types[t];
      if(!spFilter.types[t])delete spFilter.types[t];
      /* 交集筛选：宝可梦仅双属性，最多保留 2 个选中（超限时取消最早选的） */
      var on=ERDATA.types.filter(function(x){return spFilter.types[x]});
      if(on.length>2)delete spFilter.types[on[0]];
      renderSpChips();renderSp(true);
    }));
  });
}
(function(){
  renderSpChips();
  $('spSearch').oninput=function(){renderSp(true)};
  $('spSort').onchange=function(){renderSp(true)};
})();
renderSp(true);
function spMatch(s,q,sel,role,abi){
  /* v4.x C⑧：全局模糊搜索（中文/英文/编号/种族值子串，多词空格 AND）；E⑩：定位 + 特性筛选 */
  if(!fzAny(q,[s.id,s.zh,s.en,spBst(s)]))return false;
  if(sel&&sel.length){
    /* 交集：所有选中属性都必须命中（双属性宝可梦，最多选 2） */
    var hitAll=true;
    sel.forEach(function(t){if(s.t1!==t&&s.t2!==t)hitAll=false});
    if(!hitAll)return false;
  }
  if(role&&spRoleTags(s).indexOf(role)<0)return false;
  if(abi&&!fzAny(abi,s.abis.concat(s.inns)))return false;
  return true;
}
function spBst(s){return s.base[0]+s.base[1]+s.base[2]+s.base[3]+s.base[4]+s.base[5]}
function sortedSp(arr,k){
  var idx={hp:0,atk:1,def:2,spa:3,spd:4,spe:5};
  if(k==='id')arr.sort(function(a,b){return parseInt(a.id)-parseInt(b.id)});
  else if(k==='bst')arr.sort(function(a,b){return spBst(b)-spBst(a)});
  else arr.sort(function(a,b){return b.base[idx[k]]-a.base[idx[k]]});
  return arr;
}
function renderSp(reset){
  var q=$('spSearch').value.trim().toLowerCase();
  var sel=[];for(var t in spFilter.types)if(spFilter.types[t])sel.push(t);
  var arr=ERDATA.species.filter(function(s){return spMatch(s,q,sel)});
  arr=sortedSp(arr,$('spSort').value);
  if(reset){spShown=0;$('spGrid').innerHTML=''}
  var take=arr.slice(spShown,spShown+spStep);
  spShown+=take.length;
  take.forEach(function(s){
    var c=document.createElement('div');c.className='card';
    c.innerHTML=sprImg(s.id)+
      '<div class="nm">'+esc(s.zh)+'</div><div class="en">'+esc(s.en)+' #'+s.id+
      '</div><div style="margin-top:4px">'+tlabel(s.t1)+(s.t2!==s.t1?' '+tlabel(s.t2):'')+
      '</div><div class="bs">种族总值 '+spBst(s)+'</div>';
    c.onclick=function(){openSp(s)};
    $('spGrid').appendChild(c);
  });
  $('spMore').textContent=spShown<arr.length?('已显示 '+spShown+'/'+arr.length+'，滚动加载更多'):(arr.length?('共 '+arr.length+' 只'):'无匹配');
}
window.addEventListener('scroll',function(){
  if($('tab-poke').classList.contains('active')&&window.innerHeight+window.scrollY>document.body.scrollHeight-400)renderSp(false);
});

/* ============ 宝可梦详情 ============ */
/* v4.x UI 定稿（用户原则：二级内容默认就地/内联/紧凑卡片；确需浮层 → 居中轻量 modal，禁右侧抽屉）
   → 宝可梦详情 / 招式详情统一改为居中轻量 modal（遮罩 + 关闭按钮 + Esc） */
var spDrawer=document.createElement('div');spDrawer.id='spDrawer';spDrawer.className='modal';
spDrawer.innerHTML='<div class="mbox mboxwide"><div class="mhd"><b>宝可梦详情</b><button class="close" onclick="closeSp()">×</button></div><div id="spDetail"></div></div>';
spDrawer.onclick=function(ev){if(ev.target===spDrawer)closeSp()};
document.body.appendChild(spDrawer);
/* v4.x UI 定稿：词条详情用「轻量居中 modal（带遮罩 + 关闭 + Esc）」，克制格改「就地内联展开」（无右侧抽屉） */
var glModal=document.createElement('div');glModal.id='glModal';glModal.className='modal';
glModal.innerHTML='<div class="mbox" id="glBox"><div class="mhd"><b id="glTitle">词条</b><button class="close" onclick="closeGl()">×</button></div><div id="glDetail"></div></div>';
glModal.onclick=function(ev){if(ev.target===glModal)closeGl()};
document.body.appendChild(glModal);
if(document.addEventListener)document.addEventListener('keydown',function(ev){if(ev.key==='Escape'){closeGl();try{closeSp()}catch(e){}try{closeMv()}catch(e){}}});
function closeSp(){spDrawer.classList.remove('open')}
/* 精灵图：相对路径 assets/sprites/sp<id>.png（与 HTML 同目录，file:// 可显示）。
   缺图时 onerror 隐藏 <img>，外层 .spbox 的灰色占位框保留 → 不破版、不影响文字。 */
function sprOf(id){return 'assets/sprites/sp'+id+'.png'}
function sprImg(id,cls){
  return '<span class="spbox '+(cls||'spcard')+'"><img src="'+sprOf(id)+'" alt="" loading="lazy" decoding="async" onerror="this.hidden=true"></span>';
}
/* v4.x：裸精灵图（紧凑卡片网格用，无外层灰框）：<img class="mcspr" ...> */
function sprRaw(id,cls){
  return '<img class="'+(cls||'mcspr')+'" src="'+sprOf(id)+'" alt="" loading="lazy" decoding="async" onerror="this.hidden=true">';
}
function openSp(s){
  var base=s.base,names=['HP','攻击','防御','特攻','特防','速度'];
  var html='<h2>'+sprImg(s.id,'spinl')+esc(s.zh)+' <span style="font-size:13px;color:var(--sub)">'+esc(s.en)+' #'+s.id+'</span>'+
    ' <button class="btn-mini" style="margin-left:8px;background:var(--warn);color:#fff" onclick="closeSp();selectCore(\''+s.id+'\')" title="以它为核心生成组队建议（队友/配招/性格）">🤖 组队建议</button></h2>';
  html+='<div style="margin:6px 0">'+tlabel(s.t1)+(s.t2!==s.t1?' '+tlabel(s.t2):'')+'</div>';
  html+='<div class="sec"><h3>种族值（总值 '+spBst(s)+'）</h3>';
  var maxv=Math.max.apply(null,base.concat([1]));
  names.forEach(function(n,i){
    var pct=Math.round(base[i]/255*100);
    html+='<div class="barstat"><span class="lb">'+n+'</span><div class="tr"><div class="fl" style="width:'+pct+'%;background:hsl('+(210-i*20)+',70%,55%)"></div></div><span class="tk">'+base[i]+'</span></div>';
  });
  html+='</div>';
  html+='<div class="sec"><h3>特性（n 选 1，点击看描述）</h3>';
  s.abis.forEach(function(n){
    var id=abiIdByZhOrEn(n);
    html+='<span class="abi" onclick="abiDesc(this,'+id+')">'+esc(n)+'</span>';
  });
  html+='<div class="abid" id="abiDesc" style="display:none"></div></div>';
  html+='<div class="sec"><h3>天性（固定 3 个，点击看描述）</h3>';
  s.inns.forEach(function(n){
    var id=abiIdByZhOrEn(n);
    html+='<span class="abi abi-inn" onclick="abiDesc(this,'+id+',\'spInnDesc\')">'+esc(n)+'</span>';
  });
  html+='<div class="abid" id="spInnDesc" style="display:none"></div>'; /* A①：天性描述紧挂天性块内（勿落到特性块） */
  html+='<div class="mini" style="color:var(--sub);margin-top:4px">天性固定生效、不可更换；可选特性的免疫/减半与之叠加（B1）。</div>';
  html+='</div>';
  html+='<div class="sec"><h3>属性弱点与特性修正 <span style="font-weight:400;font-size:11px">（天性固定生效，可选=池内可换）</span></h3><div id="spWeakBox" style="font-size:12px;line-height:1.9"></div></div>';
  /* v432-1：非最终形态在此给出奇石权衡结论（否决者显示「为何没被推荐」） */
  try{
    if(!isFinalForm(s)&&famFinalOf(s)){
      var _ev=evioVeto(s);
      if(_ev){
        html+='<div class="tip" style="font-size:11px;margin-top:6px;border-color:var(--warn)">🪨 <b>奇石权衡否决</b>（不推荐带进化奇石）：'+esc(_ev.why)+'</div>';
      }else{
        var _ea=evioAdv(s);
        if(_ea)html+='<div class="tip" style="font-size:11px;margin-top:6px">🪨 <b>奇石权衡通过</b>：'+esc(_ea.why)+'</div>';
      }
    }
  }catch(eE){}
  html+='<div class="sec"><h3>可学招式 <span style="font-weight:400">'+s.lv.length+' 升级 + '+s.tut.length+' 教学</span></h3>';
  html+='<div class="bar"><input type="text" id="mvInSp" placeholder="筛招式名">'+
    '<select id="mvTypeSp"><option value="">全部属性</option></select>'+
    '<select id="mvSplitSp"><option value="">全部分类</option><option value="物理">物理</option><option value="特殊">特殊</option><option value="变化">变化</option></select></div>';
  html+='<div class="scroll"><table><thead><tr><th>获得</th><th>招式</th><th>属性</th><th>分类</th><th>威力</th><th>命中</th><th>PP</th><th>先制</th></tr></thead><tbody id="mvBodySp"></tbody></table></div>';
  html+='</div>';
  $('spDetail').innerHTML=html;
  var tySel=$('mvTypeSp');
  ERDATA.types.forEach(function(t){var o=document.createElement('option');o.value=t;o.textContent=t;tySel.appendChild(o)});
  $('mvInSp').oninput=function(){renderMvSp(s)};
  tySel.onchange=function(){renderMvSp(s)};
  $('mvSplitSp').onchange=function(){renderMvSp(s)};
  renderMvSp(s);
  /* 属性弱点 + 特性修正（天性口径；已勾选可选特性按勾选生效） */
  (function(){
    var t=effTypesOf(s);
    var baseCells={},innCells={},optCells={};
    ERDATA.types.forEach(function(at){
      var c=defCellTrio(s,at);
      baseCells[at]=c.base;innCells[at]=c.inn;optCells[at]=c.opt;
    });
    function fmt(cells){
      var wk=[],res=[],imm=[];
      ERDATA.types.forEach(function(at){var v=cells[at];
        if(v===0)imm.push(at);else if(v>1)wk.push(at+'×'+v);else if(v<1)res.push(at)});
      return {wk:wk,res:res,imm:imm};
    }
    var b=fmt(baseCells),n=fmt(innCells);
    var h='<b>基础属性：</b>'+((b.wk.length?'弱点 '+b.wk.map(tlabel).join(' '):'<span style="color:var(--ok)">无弱点</span>')+(b.res.length?'　抗 '+b.res.map(tlabel).join(' '):'')+(b.imm.length?'　免疫 '+b.imm.map(tlabel).join(' '):''));
    h+='<br><b>天性修正后：</b>'+((n.wk.length?'弱点 '+n.wk.map(tlabel).join(' '):'<span style="color:var(--ok)">无弱点</span>')+(n.res.length?'　抗 '+n.res.map(tlabel).join(' '):'')+(n.imm.length?'　<span style="color:#0d47a1">免疫 '+n.imm.map(tlabel).join(' ')+'</span>':''));
    var changed=[];
    ERDATA.types.forEach(function(at){if(innCells[at]!==baseCells[at])changed.push(tlabel(at)+' '+baseCells[at]+'→'+innCells[at])});
    if(changed.length)h+='<br><b>天性修正项：</b>'+changed.join('　');
    if(t.inn.length)h+='<br><b>天性附加属性：</b>'+t.inn.map(tlabel).join(' ');
    var optChg=[];
    ERDATA.types.forEach(function(at){if(optCells[at]<innCells[at])optChg.push(tlabel(at)+'→'+(optCells[at]===0?'免疫':optCells[at]+'x'))});
    var info=teamInfo[s.id]||{},pick=info.pick||null;
    if(pick){
      h+='<br><b>已勾选可选特性：</b>'+esc(pick)+(optChg.length?' —— '+optChg.join('　'):'（对弱点无额外改善）');
    }else if(optChg.length){
      h+='<br><b>可选特性可改善：</b>'+optChg.join('　')+'（队伍构建 Tab 点选特性即可模拟生效）';
    }
    $('spWeakBox').innerHTML=h;
  })();
  spDrawer.classList.add('open');
}
function abiDesc(el,id,box){
  /* v4.x A①：特性/天性共用——中文描述优先（abiDescZh → 数据层中文 → abiTags.nt），词条标蓝，可跳特性反查
     box：挂载容器 id —— 特性块用 'abiDesc'，天性块用 'spInnDesc'（描述须紧跟各自的 chip 行，互不串块） */
  var bid=box||'abiDesc';
  var d=$(bid);if(!d)d=$('abiDesc');
  if(!d)return;
  d.style.display='block';
  var other=$(bid==='abiDesc'?'spInnDesc':'abiDesc');
  if(other)other.style.display='none';
  var label=(el&&el.textContent)?el.textContent:'';
  if(id===null||id===undefined){d.innerHTML='<div style="font-size:12px">'+esc(label)+'（无描述：别名未收录）</div>';return}
  var a=ABI[id],zh=abiDescZhOf(id);
  var name=(a&&a[2])?a[2]:(label||('#'+id));
  var en=(a&&a[1]&&a[1]!==name)?('（'+a[1]+'）'):'';
  var h='<div style="margin-bottom:3px"><b>'+esc(name)+'</b>'+esc(en)+' <span class="badge badge-neu">#'+id+'</span>'+
    '<button class="btn-mini" style="margin-left:6px" onclick="gotoAbi('+jsl(name)+')">特性反查 →</button></div>';
  h+='<div style="font-size:12px;line-height:1.9">'+glossify(zh||'（无中文描述）')+'</div>';
  var tg=abiTagLines(id);
  if(tg.length)h+='<div class="ruleline">战斗意义：'+tg.map(function(x){return esc(x)}).join('；')+'</div>';
  d.innerHTML=h;
}
function renderMvSp(s){
  var q=$('mvInSp').value.trim(),ty=$('mvTypeSp').value,sp=$('mvSplitSp').value;
  var rows=[];
  s.lv.forEach(function(p){rows.push({way:'Lv'+p[0],mid:p[1],ord:p[0]})});
  s.tut.forEach(function(m){rows.push({way:'教学',mid:m,ord:999})});
  rows.sort(function(a,b){return a.ord-b.ord});
  var html='';
  rows.forEach(function(r){
    var m=MV[r.mid];if(!m)return;
    if(!fzAny(q,[m[0],m[1],m[2],mvDescOf(m)]))return;
    if(ty&&m[3]!==ty)return;
    if(sp&&m[4]!==sp)return;
    html+='<tr class="mv" onclick="mvRow(this)"><td>'+r.way+'</td><td>'+esc(m[1])+'</td><td>'+tlabel(m[3])+'</td><td>'+splitLabel(m[4])+'</td><td>'+(m[5]||'-')+'</td><td>'+(m[6]||'-')+'</td><td>'+m[7]+'</td><td>'+(m[8]||'')+'</td></tr>';
    html+='<tr class="mvdesc"><td colspan="8">'+glossify(mvDescOf(m))+'</td></tr>';
  });
  $('mvBodySp').innerHTML=html||'<tr><td colspan="8" style="color:var(--sub)">无匹配招式</td></tr>';
}
function mvRow(tr){tr.classList.toggle('open')}

/* ============ 招式反查（多条件筛选） ============ */
(function(){
  ERDATA.types.forEach(function(t){var o=document.createElement('option');o.value=t;o.textContent=t;$('mvType').appendChild(o)});
  ['mvSearch','mvType','mvSplit','mvPowMin','mvPowMax','mvPpMin','mvPrMin'].forEach(function(id){
    var el=$(id);el.oninput=renderMv;el.onchange=renderMv;
  });
})();
function renderMv(){
  var q=$('mvSearch').value.trim(),ty=$('mvType').value,sp=$('mvSplit').value;
  var pmin=$('mvPowMin').value===''?-1:parseInt($('mvPowMin').value),pmax=$('mvPowMax').value===''?-1:parseInt($('mvPowMax').value);
  var ppmin=$('mvPpMin').value===''?-1:parseInt($('mvPpMin').value),prmin=$('mvPrMin').value===''?-1:parseInt($('mvPrMin').value);
  var tb=$('mvTable').querySelector('tbody');tb.innerHTML='';
  var shown=0;
  ERDATA.moves.forEach(function(m){
    if(!fzAny(q,[m[0],m[1],m[2],mvDescOf(m),m[3],m[4]]))return;
    if(ty&&m[3]!==ty)return;
    if(sp&&m[4]!==sp)return;
    if(pmin>=0&&m[5]<pmin)return;
    if(pmax>=0&&m[5]>pmax)return;
    if(ppmin>=0&&m[7]<ppmin)return;
    if(prmin>=0&&m[8]<prmin)return;
    shown++;
    var tr=document.createElement('tr');tr.className='mv';
    tr.innerHTML='<td>'+m[0]+'</td><td>'+esc(m[1])+'</td><td>'+tlabel(m[3])+'</td><td>'+splitLabel(m[4])+'</td><td>'+(m[5]||'-')+'</td><td>'+(m[6]||'-')+'</td><td>'+m[7]+'</td><td>'+(m[8]||'')+'</td>';
    tr.onclick=function(){openMv(m)};
    tb.appendChild(tr);
  });
  var info=$('mvCount');
  if(info)info.textContent='命中 '+shown+' 条'+(q?('（模糊搜索："'+q+'"）'):'');
}
function closeMv(){$('mvDrawer').classList.remove('open')}
/* v4.x UI 定稿：招式详情改居中 modal → 遮罩点击关闭 */
(function(){var d=$('mvDrawer');if(d)d.onclick=function(ev){if(ev.target===d)closeMv()}})();
function openMv(m){
  var html='<h2>'+esc(m[1])+' <span style="font-size:13px;color:var(--sub)">'+esc(m[2])+' #'+m[0]+'</span></h2>';
  html+='<div style="margin:6px 0">'+tlabel(m[3])+' '+splitLabel(m[4])+
    ' 威力 <b>'+(m[5]||'-')+'</b> 命中 <b>'+(m[6]||'-')+'</b> PP <b>'+m[7]+'</b> 先制 <b>'+(m[8]||'0')+'</b></div>';
  if(ERDATA.movesNotes&&ERDATA.movesNotes[m[0]])html+='<div class="tip" style="background:#fff8e1;border-color:#f59e0b;color:#7c4a03">💡 '+esc(ERDATA.movesNotes[m[0]])+'</div>';
  /* v4.x A②：招式介绍中文优先（ERDATA.mvDescZh → 英文 desc m[9] → ER lDesc m[10]），机制词条标蓝可点 */
  html+='<div class="abid">'+glossify(mvDescOf(m))+'</div>';
  if(!V4FIELDS.mvDescZh)html+='<div class="mini" style="color:var(--sub)">招式中文说明暂缺，已回退游戏英文原文。</div>';
  /* B3：lDesc（第 [10] 下标）原文 + 代价标签（僵直/反伤/必中/条件威力） */
  var ld=String(m[10]||'');
  if(ld)html+='<div class="abid" style="border-left:3px solid var(--accent);padding-left:6px"><b style="font-size:12px">官方机制文本：</b>'+esc(ld)+'</div>';
  var cst=costOf(null,m,true);
  var mid=m[0]*1;
  var hz=[];FUNC_MV.hazard.forEach(function(x){if(x===mid)hz.push('钉子')});
  if(FUNC_MV.removal.indexOf(mid)>-1)hz.push(mid===229?'除钉·高速旋转（清自身侧）':'除钉·清除浓雾（清双方）');
  if(hz.length)html+='<div style="margin:4px 0;font-size:12px">机制标签：'+hz.map(function(x){return '<span class="abi">'+x+'</span>'}).join(' ')+'</div>';
  if(mid===432)html+='<div style="margin:4px 0;font-size:12px">除钉范围：清双方钉子（已按游戏源码核对）· 墙仅对手侧 · 降闪避 1 级（用户确认，定稿）</div>';
  if(cst.tags.length)html+='<div style="margin:4px 0;font-size:12px"><b>代价标签：</b>'+cst.tags.map(function(x){return '<span class="badge badge-pend">'+esc(x)+'</span>'}).join(' ')+
    (cst.note?'<div style="font-size:11px;color:var(--sub)">'+esc(cst.note)+'</div>':'')+'</div>';
  html+='<div class="sec"><h3>谁能学</h3><div id="mvLearners"></div></div>';
  var _mvt=$('mvDrawerTitle'); if(_mvt)_mvt.textContent=String(m[1]||'招式详情'); /* v4.6-C：弹窗标题显示所选招式名 */
  $('mvDetail').innerHTML=html;
  var box=$('mvLearners');
  var cnt=0;
  ERDATA.species.forEach(function(s){
    var lv=-1,isTut=false;
    s.lv.forEach(function(p){if(p[1]===m[0])lv=p[0]});
    if(s.tut.indexOf(m[0])>-1)isTut=true;
    if(lv>-1||isTut){
      var c=document.createElement('div');c.className='card';c.style.marginBottom='6px';
      c.innerHTML='<div class="nm">'+esc(s.zh)+'</div><div class="en">'+esc(s.en)+' #'+s.id+'</div>'+
        '<div style="margin-top:3px;font-size:12px">'+(lv>-1?'升级 Lv'+lv+' · ':'')+(isTut?'教学':'')+'</div>';
      c.onclick=function(){openSp(s);closeMv()};
      box.appendChild(c);cnt++;
    }
  });
  if(!cnt)box.innerHTML='<div style="color:var(--sub)">该招式没有宝可梦可学（可能仅限特定形态/事件）</div>';
  $('mvDrawer').classList.add('open');
}

/* ============ 属性克制 ============ */
(function(){
  ERDATA.types.forEach(function(t){
    $('atkChips').appendChild(tchip(t,false,function(){
      document.querySelectorAll('#atkChips button').forEach(function(x){x.classList.remove('on')});
      this.classList.add('on');renderAtk(t);
    }));
  });
  ERDATA.types.forEach(function(t){
    $('defChips').appendChild(tchip(t,false,function(){
      this.classList.toggle('on');renderDef();
    }));
  });
})();
function renderAtk(t){
  var i=tIdx(t),k=[],h=[],z=[];
  ERDATA.types.forEach(function(d,j){
    var v=ERDATA.matchup[j][i];
    if(v===2)k.push(d);else if(v===0.5||v===3)h.push(d);else if(v===0)z.push(d);
  });
  /* v4.x D⑨：克制格就地展开（无右侧抽屉）
     · 点「攻击属性」标题格 → 进攻视角：全图鉴按实际承受倍率分组
     · 点下方 2×/0.5×/0× 的属性 chip（防守属性）→ 防守视角：列出拥有该属性的宝可梦 */
  function atkCell(){return '<span style="cursor:pointer" onclick="mxInline(\''+t+'\',this,\'atk\')" title="进攻视角：点这里看全图鉴按实际承受倍率分组（'+t+' 属性招式打谁有效）">'+tlabel(t)+'</span>'}
  function cell(d){return '<span data-at="'+d+'" style="cursor:pointer" onclick="mxInline(\''+d+'\',this,\'def\')" title="防守视角：列出拥有「'+d+'」属性的宝可梦（点卡片跳详情看完整承受表）">'+tlabel(d)+'</span>'}
  var html='';
  html+='<div class="kgroup"><div class="k2" style="margin-bottom:4px"><b>进攻属性：</b> '+atkCell()+' <span class="mini" style="color:var(--sub)">（点它 → 全图鉴按承受倍率分组）</span></div>';
  html+='<div class="k2"><b>2× 克制：</b> '+(k.map(cell).join(' ')||'无')+'</div>';
  html+='<div class="k05"><b>0.5× 抵抗：</b> '+(h.map(cell).join(' ')||'无')+'</div>';
  html+='<div class="k0"><b>0× 无效：</b> '+(z.map(cell).join(' ')||'无')+'</div></div>';
  html+='<div class="mini" style="color:var(--sub);margin-top:4px">点属性 chip → <b>就地展开</b>（网格卡片 + 精灵图）：进攻属性=按实际承受倍率分组；防守属性=列出拥有该属性的宝可梦。再点同一格收起。</div>';
  $('atkResult').innerHTML=html;
}
function renderDef(){
  var sel=[];
  document.querySelectorAll('#defChips button').forEach(function(b){if(b.classList.contains('on'))sel.push(b.textContent)});
  if(!sel.length){$('defResult').innerHTML='<div style="color:var(--sub)">请选择 1-2 个属性</div>';return}
  var weak={},res={},imm={};
  ERDATA.types.forEach(function(at){
    var mult=1;
    sel.forEach(function(dt){
      var j=tIdx(dt),v=ERDATA.matchup[j][tIdx(at)];
      if(v===0)mult=0;else if(v===0.5||v===3)mult*=0.5;else if(v===2)mult*=2;
    });
    if(mult===0)imm[at]=true;else if(mult>1)weak[at]=mult;else if(mult<1)res[at]=mult;
  });
  /* 这里列出的 chip 是「攻击属性」→ 点它 = 进攻视角（列全图鉴按该属性的实际承受倍率分组）；
     另给「防守属性组合」自身一个格子 = 防守视角（列出拥有该组合的宝可梦） —— 两视角内容不同 */
  function cell(at,txt){return '<span data-at="'+at+'" style="cursor:pointer" onclick="mxInline(\''+at+'\',this,\'atk\')" title="进攻视角：'+at+' 属性招式打谁有效（全图鉴按实际承受倍率分组）">'+txt+'</span>'}
  var html='';
  html+='<div class="kgroup"><div class="k2" style="margin-bottom:4px"><b>防守属性组合：</b> <span style="cursor:pointer" onclick="mxInline(\''+sel.slice().sort().join('+')+'\',this,\'def\')" title="防守视角：列出拥有该属性组合的宝可梦">'+sel.map(tlabel).join(' + ')+'</span> <span class="mini" style="color:var(--sub)">（点它 → 列出拥有该属性的宝可梦；点下面各属性 → 进攻视角按倍率分组）</span></div>';
  if(Object.keys(weak).length)html+='<div class="k2"><b>弱点：</b> '+Object.keys(weak).map(function(t){return cell(t,tlabel(t)+' ×'+weak[t])}).join(' ')+'</div>';
  if(Object.keys(res).length)html+='<div class="k05"><b>抗性：</b> '+Object.keys(res).map(function(t){return cell(t,tlabel(t)+' ×'+res[t])}).join(' ')+'</div>';
  if(Object.keys(imm).length)html+='<div class="k0"><b>免疫：</b> '+Object.keys(imm).map(function(t){return cell(t,tlabel(t))}).join(' ')+'</div></div>';
  var extra='<div class="mini" style="color:var(--sub);margin-top:4px">点攻击属性（弱点/抗性/免疫）→ <b>进攻视角</b>：全图鉴按该属性的实际承受倍率分组；点上方「防守属性组合」→ <b>防守视角</b>：只列拥有该属性的宝可梦。均为就地展开。</div>';
  if(!Object.keys(weak).length&&!Object.keys(res).length&&!Object.keys(imm).length)html+='<div class="mini" style="color:var(--sub)">该组合无弱点、无抗性、无免疫（全 ×1）</div>';
  $('defResult').innerHTML=html+'</div>'+extra;
}

/* ============ 队伍构建器 ============ */
var team=[],teamInfo={}; /* team: species refs; teamInfo[id]: {fromSave, item, moves[4], pps[4]} */
var tmShown=0,tmStep=60,tmTypeSel=[];
function tmFilterReset(){
  tmTypeSel=[];
  document.querySelectorAll('#tmTypeChips button').forEach(function(b){b.classList.remove('on')});
  var r=$('tmRole');if(r)r.value='';
  var a=$('tmAbi');if(a)a.value='';
  renderTm(true);
}
(function(){
  $('tmSearch').oninput=function(){renderTm(true)};
  $('tmSort').onchange=function(){renderTm(true)};
  /* v4.x E⑩：属性 chips + 定位 + 特性搜索筛选 */
  (function(){
    var box=$('tmTypeChips');
    if(box){
      ERDATA.types.forEach(function(t){
        box.appendChild(tchip(t,false,function(){
          this.classList.toggle('on');
          tmTypeSel=[];
          box.querySelectorAll('button.on').forEach(function(b){tmTypeSel.push(b.textContent)});
          renderTm(true);
        }));
      });
    }
    var r=$('tmRole');if(r)r.onchange=function(){renderTm(true)};
    var a=$('tmAbi');if(a)a.oninput=function(){renderTm(true)};
  })();
  /* 首次渲染：候选卡片（含精灵图）与队伍槽位。原代码缺此初始化，
     导致「队伍构建」Tab 初次进入时候选列表与槽位均为空白，需先输入搜索词才出现。 */
  renderTm(true);renderSlots();
})();
function renderTm(reset){
  var q=$('tmSearch').value.trim();
  var role=$('tmRole')?$('tmRole').value:'';
  var abi=$('tmAbi')?$('tmAbi').value.trim():'';
  var arr=ERDATA.species.filter(function(s){return spMatch(s,q,tmTypeSel,role,abi)});
  arr=sortedSp(arr,$('tmSort').value);
  if(reset){tmShown=0;$('tmGrid').innerHTML=''}
  var take=arr.slice(tmShown,tmShown+tmStep);
  tmShown+=take.length;
  take.forEach(function(s){
    var inTeam=team.indexOf(s)>-1;
    var c=document.createElement('div');c.className='card';
    c.innerHTML=sprImg(s.id)+
      '<div class="nm">'+esc(s.zh)+'</div><div class="en">'+esc(s.en)+' #'+s.id+
      '</div><div style="margin-top:4px">'+tlabel(s.t1)+(s.t2!==s.t1?' '+tlabel(s.t2):'')+
      '</div><div class="bs">种族总值 '+spBst(s)+'</div>'+
      '<div style="margin-top:6px">'+(inTeam?'<span class="badge badge-res">已入队</span>':'<span class="badge badge-neu">＋ 入队</span>')+'</div>';
    c.onclick=function(){
      if(team.indexOf(s)>-1)return;
      addToTeam(s,null);
    };
    $('tmGrid').appendChild(c);
  });
  $('tmMore').textContent=tmShown<arr.length?('已显示 '+tmShown+'/'+arr.length+'，滚动加载更多'):(arr.length?('共 '+arr.length+' 只'):'无匹配');
}
window.addEventListener('scroll',function(){
  if($('tab-team').classList.contains('active')&&window.innerHeight+window.scrollY>document.body.scrollHeight-400)renderTm(false);
});
function addToTeam(s,info){
  if(!isValidSp(s))return; /* B7：无效/占位物种不进队伍（coreMatch 与导入路径统一过滤） */
  if(team.length>=6){toast('最多 6 只');return}
  if(team.indexOf(s)>-1)return;
  team.push(s);
  if(info)teamInfo[s.id]=info;else teamInfo[s.id]={fromSave:false};
  renderTm(true);renderSlots();renderAnalyze();
}
function removeFromTeam(s){
  var i=team.indexOf(s);
  if(i>-1){team.splice(i,1);delete teamInfo[s.id]}
  renderTm(true);renderSlots();renderAnalyze();
}
function renderSlots(){
  var html='';
  for(var i=0;i<6;i++){
    var s=team[i];
    if(s){
      var info=teamInfo[s.id]||{fromSave:false};
      html+='<div class="slot">'+sprImg(s.id,'spslot')+'<span class="nm">'+esc(s.zh)+'</span>'+tlabel(s.t1)+(s.t2!==s.t1?' '+tlabel(s.t2):'')+
        '<button class="x" onclick="removeFromTeamById('+s.id+')">×</button></div>';
      html+='<div style="padding:0 10px 4px">'+abiBadges(s)+'</div>';
      /* 可选特性点选模拟生效（单选） */
      if(s.abis&&s.abis.length){
        html+='<div style="padding:0 10px 2px;font-size:11px;color:var(--sub)">可选特性（<b style="color:#2e7d32">点选模拟生效</b>，单选）：</div><div style="padding:0 10px 6px;display:flex;flex-wrap:wrap;gap:4px">';
        for(var ai=0;ai<s.abis.length;ai++){
          var picked=info.pick===s.abis[ai];
          html+='<span class="badge '+(picked?'badge-pick':'badge-pickable')+'" onclick="pickAbi('+s.id+','+ai+')" title="点选后该成员防守评估与全队分析即时重算">'+esc(s.abis[ai])+(picked?' ✓':'')+'</span>';
        }
        html+='<span class="badge badge-neu" style="cursor:pointer" onclick="pickAbi('+s.id+',-1)" title="清除勾选">✕</span></div>';
      }
      if(info.fromSave){
        var mv=[],pps=info.moves||[];
        pps.forEach(function(p){mv.push('<span class="split split-STATUS">'+esc(p)+'</span>')});
        html+='<div class="slotinfo" style="padding:0 10px 6px">招式：'+(mv.join(' ')||'—')+
          (info.item?' · 道具 '+esc(info.item):'')+'</div>';
      }
    }else{
      html+='<div class="slot empty">空位</div>';
    }
  }
  $('tmCount').textContent=team.length;
  $('tmSlots').innerHTML=html;
}
function removeFromTeamById(id){
  for(var i=0;i<team.length;i++)if(team[i].id==id){removeFromTeam(team[i]);return}
}
/* 导出当前队伍配置文本（含勾选特性模拟方案） */
function exportTeam(){
  if(!team.length){toast('队伍为空，先加入或导入宝可梦');return}
  var lines=[];
  team.forEach(function(s){
    var info=teamInfo[s.id]||{};
    var pick=info.pick||'—';
    var mv=info.moves||[];
    var movesStr=mv.length?mv.join('/'):'—';
    var item=info.item?(' @'+info.item):'';
    var typesStr=s.t1+(s.t2&&s.t2!==s.t1?(' '+s.t2):'');
    lines.push(s.zh+' '+typesStr+' ['+pick+'] '+movesStr+item);
  });
  var txt=lines.join('\n');
  var ta=document.createElement('textarea');
  ta.value=txt;ta.style.position='fixed';ta.style.left='-9999px';
  document.body.appendChild(ta);ta.select();
  var ok=false;
  try{ok=document.execCommand('copy')}catch(e){}
  document.body.removeChild(ta);
  if(ok)toast('已复制队伍配置：\n\n'+txt);
  else{prompt('复制以下队伍配置文本：',txt)}
}
function pickAbi(id,idx){
  var s=null;
  team.forEach(function(x){if(x.id==id)s=x});
  if(!s)return;
  var info=teamInfo[s.id]=teamInfo[s.id]||{fromSave:false};
  if(idx===-1){info.pick=null}
  else{
    var n=s.abis[idx];
    if(!n)return;
    info.pick=(info.pick===n)?null:n;
  }
  renderSlots();renderAnalyze();
}
/* ============ 特性修正评估（v3：整体聚合——属性×天性×可选特性） ============ */
var IMMUNE_RISK={}; /* 属性 -> 常见免疫特性名（进攻警示用） */
ERDATA.abilities.forEach(function(a){
  var g=ERDATA.abiTags[a[0]];
  if(g&&g.im)g.im.forEach(function(t){(IMMUNE_RISK[t]=IMMUNE_RISK[t]||[]).push(a[2]||a[1])});
});
function abiTagOf(n){var id=NM2ID[n];return id?ERDATA.abiTags[id]:null}
/* 生效属性：基础属性 + 天性 add（固定）+ 可选池 add（仅提示） */
function effTypesOf(s){
  var base=[];if(s.t1&&s.t1!=='-')base.push(s.t1);if(s.t2&&s.t2!=='-'&&s.t2!==s.t1)base.push(s.t2);
  var inn=[],ab=[];
  s.inns.forEach(function(n){var g=abiTagOf(n);if(g&&g.add)g.add.forEach(function(x){if(base.indexOf(x)<0&&inn.indexOf(x)<0)inn.push(x)})});
  s.abis.forEach(function(n){var g=abiTagOf(n);if(g&&g.add)g.add.forEach(function(x){if(base.indexOf(x)<0&&inn.indexOf(x)<0&&ab.indexOf(x)<0)ab.push(x)})});
  return {base:base,inn:inn,ab:ab};
}
function defMult(types,at){
  var m=1;
  types.forEach(function(dt){var v=ERDATA.matchup[tIdx(dt)][tIdx(at)];
    if(v===0)m=0;else if(v===0.5||v===3)m*=0.5;else if(v===2)m*=2;});
  return m;
}
/* 倍率简写（格值显示用） */
function hb(x){return x>=4?'4x':(x>1?x+'x':(x<1?'抗':'-'))}
/* 免疫/减半集合：{属性: '天性'|'可选'} + 备注 + 物理减伤 */
function abiImHf(s){
  var im={},hf={},nt=[],phy=1;
  function apply(list,scope){
    list.forEach(function(n){
      var g=abiTagOf(n);if(!g)return;
      if(g.im)g.im.forEach(function(x){if(im[x]===undefined)im[x]=scope});
      if(g.hf)g.hf.forEach(function(x){if(hf[x]===undefined)hf[x]=scope});
      if(g.phy&&g.phy<1)phy=Math.min(phy,g.phy);
      if(g.nt)nt.push(n+'：'+g.nt);
    });
  }
  apply(s.inns,'天性');apply(s.abis,'可选');
  return {im:im,hf:hf,nt:nt,phy:phy};
}
/* 成员防守三口径：基础 / 天性修正（仅固定天性生效）/ 生效口径（勾选→按勾选特性；未勾选→可选池最优提示） */
function defCellTrio(s,at){
  var t=effTypesOf(s);
  var base=defMult(t.base,at);
  var inn=defMult(t.base.concat(t.inn),at);
  var ih=abiImHf(s);
  /* 天性口径：只应用固定天性（inns）的免疫/减半 */
  if(ih.im[at]==='天性')inn=0;
  else if(ih.hf[at]==='天性')inn*=0.5;
  /* 生效口径 */
  var opt,pick=null;
  var info=teamInfo[s.id];
  if(info&&info.pick)pick=info.pick;
  if(pick){
    /* B1：勾选可选特性只覆盖"同池其它可选特性"，不顶掉天性。
       生效口径 = base + 天性全部修正（im/hf/add 均生效）+ 勾选特性修正（叠加） */
    var tg=abiTagOf(pick);
    var extra=t.inn.slice();
    if(tg&&tg.add)tg.add.forEach(function(x){if(extra.indexOf(x)<0)extra.push(x)});
    opt=defMult(t.base.concat(extra),at);
    if(tg&&tg.im&&tg.im.indexOf(at)>-1)opt=0;
    else if(tg&&tg.hf&&tg.hf.indexOf(at)>-1)opt*=0.5;
    /* 天性 im/hf 仍生效（叠加，不顶替） */
    if(ih.im[at]==='天性')opt=0;
    else if(ih.hf[at]==='天性')opt*=0.5;
  }else{
    /* 未勾选：池内最优（仅提示，不默认生效） */
    opt=defMult(t.base.concat(t.inn).concat(t.ab),at);
    if(ih.im[at]!==undefined)opt=0;
    else{
      if(ih.hf[at]!==undefined)opt*=0.5;
      if(opt>0){
        var onlyIm=false,onlyHf=false;
        s.abis.forEach(function(n){
          var g=abiTagOf(n);if(!g)return;
          if(g.im&&g.im.indexOf(at)>-1)onlyIm=true;
          if(g.hf&&g.hf.indexOf(at)>-1)onlyHf=true;
        });
        if(onlyIm)opt=0;
        else if(onlyHf)opt=Math.min(opt,inn*0.5);
      }
    }
  }
  return {base:base,inn:inn,opt:opt,pick:pick};
}
/* 特性徽章 HTML（免疫/半伤/加属性/特殊备注） */
function abiBadges(s){
  var html='',im={},hf={},add={},nts=[];
  function scan(list,scope){
    list.forEach(function(n){
      var g=abiTagOf(n);if(!g)return;
      (g.im||[]).forEach(function(x){if(im[x]===undefined)im[x]=scope});
      (g.hf||[]).forEach(function(x){if(hf[x]===undefined)hf[x]=scope});
      (g.add||[]).forEach(function(x){if(add[x]===undefined)add[x]=scope});
      if(g.nt)nts.push('<span class="badge badge-nt">'+esc(n)+'</span>');
    });
  }
  scan(s.inns,'天性');scan(s.abis,'可选');
  for(var t in im)html+='<span class="badge '+(im[t]==='天性'?'badge-imm':'badge-opt')+'" title="免疫'+t+'属性招式">'+t+'免疫·'+im[t]+'</span>';
  for(var t in hf)html+='<span class="badge '+(hf[t]==='天性'?'badge-res':'badge-opt')+'" title="'+t+'属性伤害减半">'+t+'半伤·'+hf[t]+'</span>';
  for(var t in add)html+='<span class="badge '+(add[t]==='天性'?'badge-add':'badge-opt')+'" title="出场添加'+t+'属性">+'+t+'·'+add[t]+'</span>';
  html+=nts.join('');
  return html;
}
/* 列头短徽章：天性固定免疫 + 已勾选可选特性（显示"已选"） */
function rowAbiShort(s){
  var info=teamInfo[s.id]||{},pick=info.pick||null;
  var im={},add=effTypesOf(s).inn.slice();
  function apply(list,scope){
    list.forEach(function(n){
      var g=abiTagOf(n);if(!g)return;
      if(g.im)g.im.forEach(function(x){if(im[x]===undefined)im[x]=scope});
      if(g.add)g.add.forEach(function(x){if(add.indexOf(x)<0)add.push(x)});
    });
  }
  apply(s.inns,'天性');
  if(pick)apply([pick],'已选');
  var out=[];
  for(var t in im)out.push(t+'免'+(im[t]==='已选'?'·已选':''));
  if(add.length)out.push('+'+add.join('/'));
  return out.length?'<span style="font-size:10px;color:#0d47a1;font-weight:400">'+out.join(' ')+'</span>':'<span style="font-size:10px;color:var(--sub);font-weight:400">—</span>';
}
/* 防守剖面：返回 {type:{w,r,i,wo}} 及每只明细（三口径 + pick） */
function defProfiles(){
  var agg={};
  ERDATA.types.forEach(function(t){agg[t]={w:0,r:0,i:0,wo:0}});
  var per=[];
  team.forEach(function(s){
    var info=teamInfo[s.id]||{};
    var row={name:s.zh,types:[s.t1,s.t2],cells:{},cellsI:{},cellsO:{},ab:abiBadges(s),pick:info.pick||null};
    ERDATA.types.forEach(function(at){
      var c=defCellTrio(s,at);
      row.cells[at]=c.base;row.cellsI[at]=c.inn;row.cellsO[at]=c.opt;
      /* 队伍级统计口径：勾选了可选特性 → 按生效口径（模拟生效）；未勾选 → 天性口径 */
      var v=row.pick?c.opt:c.inn;
      if(v===0)agg[at].i++;
      else if(v>1)agg[at].w++;
      else if(v<1)agg[at].r++;
      if(c.opt<v)agg[at].wo++;
    });
    per.push(row);
  });
  return {agg:agg,per:per};
}
/* 进攻覆盖：每只招式池对 18 属性的最佳状态 super/neutral/resist/no */
function atkCovers(){
  var agg={};
  ERDATA.types.forEach(function(t){agg[t]={super:0,neutral:0,best:[],has:false}});
  var per=[];
  team.forEach(function(s){
    var row={name:s.zh,cells:{},best:{}};
    var seen={};
    s.lv.forEach(function(p){seen[p[1]]=true});
    s.tut.forEach(function(m){seen[m]=true});
    ERDATA.types.forEach(function(d){
      var best=null,st='no'; /* st: no/resist/neutral/super */
      for(var mid in seen){
        var m=MV[mid];if(!m)continue;
        var v=ERDATA.matchup[tIdx(d)][tIdx(m[3])];
        var rank=v===2?3:(v===1?2:(v===0?-1:1));
        if(rank>0&&(!best||rank>best.rank||(rank===best.rank&&m[5]>best.pow)))best={rank:rank,pow:m[5],name:m[1]};
      }
      if(!best){st='no';row.cells[d]='×';row.best[d]=null}
      else if(best.rank===3){st='super';row.cells[d]='S'+(best.pow||'');row.best[d]=best}
      else if(best.rank===2){st='neutral';row.cells[d]='○';row.best[d]=best}
      else {st='resist';row.cells[d]='△';row.best[d]=null}
      if(st==='super'){agg[d].super++;agg[d].has=true;agg[d].best.push(s.zh+':'+best.name)}
      else if(st==='neutral'){agg[d].neutral++;agg[d].has=true}
    });
    per.push(row);
  });
  return {agg:agg,per:per};
}
function renderAnalyze(){
  var box=$('tmAnalyze');
  if(!team.length){box.innerHTML='';return}
  var html='<div class="sec"><h3>防守剖面：每只被谁克制（行=攻击属性，列=队伍）</h3><div class="scroll">';
  var dp=defProfiles();
  html+='<div style="margin:4px 0;font-size:12px;color:var(--sub)">【特性修正已纳入】格值=基础→天性修正（天性固定生效）；"可选"=可选池可改善（未勾选不生效）。<b style="color:#2e7d32">队伍成员里点选可选特性可模拟生效，防守剖面与全队分析即时重算</b>。</div>';
  html+='<table><thead><tr><th>攻击属性</th>';
  team.forEach(function(s){html+='<th>'+esc(s.zh)+'<br>'+rowAbiShort(s)+'</th>'});
  html+='<th>弱×N</th><th>抗×N</th><th>免×N</th></tr></thead><tbody>';
  ERDATA.types.forEach(function(at){
    var a=dp.agg[at];
    html+='<tr><td>'+tlabel(at)+'</td>';
    dp.per.forEach(function(row){
      var b=row.cells[at],v=row.cellsI[at],o=row.cellsO[at],picked=row.pick;
      var cell;
      if(picked){
        /* 已勾选可选特性：展示勾选后实际值 */
        if(o===0)cell='<span class="badge badge-imm" title="已勾选 '+esc(picked)+' 生效">免·已选</span>';
        else if(o<1)cell='<span class="badge badge-res" title="已勾选 '+esc(picked)+'（基础 '+hb(b)+'）">抗·已选</span>';
        else if(o>1)cell='<span class="badge '+(o>=4?'badge-4x':'badge-weak')+'" title="已勾选 '+esc(picked)+'">'+hb(o)+'·已选</span>';
        else cell='<span class="badge badge-neu" title="已勾选 '+esc(picked)+'，此属性无影响">-·已选</span>';
      }
      else if(v===0&&b===0)cell='<span class="badge badge-imm">免</span>';
      else if(v===0)cell='<span class="badge badge-imm" title="基础 '+hb(b)+' → 天性特性免疫">免</span>';
      else if(b!==v||o<v){
        var hb2=b>=4?'4x':(b>1?b+'x':(b<1?'抗':'-'));
        var hv=v>=4?'4x':(v>1?v+'x':(v<1?'抗':'−'));
        var cls=v>=4?'badge-4x':(v>1?'badge-weak':(v<1?'badge-res':'badge-neu'));
        cell='<span class="badge '+cls+'" title="基础 '+hb2+' → 天性修正 '+hv+'">'+hb2+'→'+hv+'</span>';
        if(o<v)cell+='<span class="badge badge-opt" title="可选特性池可进一步改善，点选生效">→'+(o===0?'免':(o>1?o+'x':'抗'))+'可选</span>';
      }
      else if(b>1)cell='<span class="badge '+(b>=4?'badge-4x':'badge-weak')+'">'+b+'x</span>';
      else if(b<1)cell='<span class="badge badge-res">抗</span>';
      else cell='<span class="badge badge-neu">-</span>';
      html+='<td>'+cell+'</td>';
    });
    html+='<td'+(a.w>=2?' style="background:#fce4ec;font-weight:600"':'')+'>'+a.w+'</td><td>'+a.r+'</td><td>'+a.i+'</td></tr>';
  });
  html+='</tbody></table></div></div>';
  var warns=[];
  ERDATA.types.forEach(function(at){
    if(dp.agg[at].w>=2)warns.push(at+'×'+dp.agg[at].w);
  });
  if(warns.length)html+='<div class="tip">⚠️ 共同弱点（≥2 只弱，含天性修正口径）：'+warns.map(tlabel).join(' ')+' —— 容易被同一属性招式团灭，建议补免疫/抗性位。</div>';
  var noWeak=[];
  ERDATA.types.forEach(function(at){if(dp.agg[at].w===0)noWeak.push(at)});
  if(noWeak.length)html+='<div class="tip" style="background:#e8f5e9;border-color:var(--ok);color:#14532d">🛡️ 全队无弱点属性：'+noWeak.map(tlabel).join(' ')+' —— 这几种攻击对全队都打不出克制（可放心吃）。</div>';
  /* 进攻覆盖 */
  var ac=atkCovers();
  html+='<div class="sec"><h3>进攻覆盖：6 只招式池能打出的属性覆盖（S=克制，○=中性，△=仅抵抗，×=无法命中）</h3><div class="scroll">';
  html+='<table><thead><tr><th>防守属性</th>';
  team.forEach(function(s){html+='<th>'+esc(s.zh)+'</th>'});
  html+='<th>克制者</th></tr></thead><tbody>';
  var gaps=[],nos=[];
  ERDATA.types.forEach(function(d){
    var a=ac.agg[d];
    html+='<tr><td>'+tlabel(d)+'</td>';
    ac.per.forEach(function(row){
      var v=row.cells[d];
      var cls=v.indexOf('S')===0?'badge-super':(v==='○'?'badge-neu':(v==='△'?'badge-gap':'badge-none'));
      html+='<td><span class="badge '+cls+'">'+esc(v)+'</span></td>';
    });
    html+='<td>'+(a.super?('<span class="badge badge-super">'+a.super+'</span>'):(a.has?'<span class="badge badge-neu">仅中性</span>':'<span class="badge badge-none">无</span>'))+'</td></tr>';
    if(!a.super&&a.has)gaps.push(d);
    if(!a.has)nos.push(d);
  });
  html+='</tbody></table></div></div>';
  if(gaps.length)html+='<div class="tip">⚠️ 覆盖缺口（无人克制，仅中性）：'+gaps.map(tlabel).join(' ')+' —— 遇到这些属性的高耐久会很难突破。</div>';
  if(nos.length)html+='<div class="tip" style="background:#fce4ec;border-color:var(--bad);color:#7f1d1d">🚫 完全无法命中：'+nos.map(tlabel).join(' ')+' —— 必须补对应属性招式/宝可梦。</div>';
  /* 特性免疫警示（进攻侧：对手特性可能让本队招式无效） */
  var immWarn=[];
  ERDATA.types.forEach(function(d){
    if(ac.agg[d].has&&IMMUNE_RISK[d])immWarn.push(tlabel(d)+'（'+IMMUNE_RISK[d].slice(0,3).join('/')+'等）');
  });
  if(immWarn.length)html+='<div class="tip" style="background:#fff8e1;border-color:#f59e0b;color:#7c4a03">⚡ 特性免疫警示（配招时留意）：'+immWarn.map(function(x){return x}).join('　')+' —— 若对手带对应免疫特性，这些属性招会完全无效；多备打击面或特性穿透（如破格/兆级电压）。</div>';
  /* 队伍体检（存档当前配置级：定位/配招缺口/天气配套/补位建议） */
  html+='<div class="sec"><h3>🩺 队伍体检（当前 '+team.length+' 只 · 定位/配招/天气/补位）</h3>';
  var mvIdByName={};
  ERDATA.moves.forEach(function(m){mvIdByName[m[1]]=m[0]});
  var inTeam={};
  team.forEach(function(s){inTeam[s.id]=true});
  team.forEach(function(s){
    var prof=coreRole(s),info=teamInfo[s.id]||{};
    var cur=info.moves||[];
    var ids=cur.map(function(n){return mvIdByName[(n||'').trim()]}).filter(function(x){return x!==undefined});
    var has=function(arr){return arr.some(function(id){return ids.indexOf(id)>-1})};
    var stab=ids.some(function(id){var m=MV[id];return m&&m[4]!=='变化'&&(m[3]===s.t1||(s.t2&&m[3]===s.t2))});
    var rec=has(FUNC_MV.rec),boost=has(FUNC_MV.boost),prot=has(FUNC_MV.protect),haz=has(FUNC_MV.hazard),spd=has(FUNC_MV.speed);
    var miss=[];
    var r=prof.role;
    if(!stab)miss.push('本系输出');
    if(r.indexOf('攻')>-1&&!boost)miss.push('强化');
    if(r.indexOf('盾')>-1||r.indexOf('受')>-1||r.indexOf('肉盾')>-1){if(!rec)miss.push('回复')}
    if(r.indexOf('速攻')>-1&&!prot)miss.push('保命(守住/替身)');
    if(r.indexOf('设置手')>-1&&!hasAny(ids,WEATHER_MV?[201,240,241,258,604,641,580,581]:[]))miss.push('天气/场地招');
    var noted=ids.filter(function(id){return ERDATA.movesNotes&&ERDATA.movesNotes[id]}).slice(0,2);
    html+='<div style="border:1px solid var(--line);border-radius:8px;padding:8px;margin:6px 0;background:var(--card)">'+
      '<div><b>'+esc(s.zh)+'</b> <span style="font-size:11px;color:var(--sub)">#'+s.id+'</span> '+
      '<span class="abi">'+esc(prof.role)+'</span>'+(info.item?'<span style="font-size:11px;color:var(--sub)"> @'+esc(info.item)+'</span>':'')+'</div>';
    if(cur.length)html+='<div style="font-size:12px;margin:3px 0">当前 4 招：'+
      cur.map(function(n){return '<b>'+esc(n||'-')+'</b>'}).join(' / ')+
      (ids.length?' —— '+((stab?'✓本系':'✗本系输出')+' '+(rec?'✓回复':(r.indexOf('盾')>-1?'✗缺回复':''))+' '+(boost?'✓强化':(r.indexOf('攻')>-1?'✗缺强化':''))+' '+(prot?'✓保命':(r.indexOf('速攻')>-1?'✗缺保命':''))).split(' ').filter(function(x){return x}).join(' '):'')+'</div>';
    if(noted.length)html+='<div style="font-size:11px;color:var(--sub)">点评：'+noted.map(function(id){return esc(ERDATA.movesNotes[id])}).join('；')+'</div>';
    if(miss.length)html+='<div style="font-size:12px;color:#c62828">⚠ 建议补：'+esc(miss.join('、'))+'</div>';
    else html+='<div style="font-size:12px;color:#2e7d32">✓ 配置健康</div>';
    html+='</div>';
  });
  /* 天气配套检查 */
  var setter=team.filter(function(s){return s.abis.concat(s.inns).some(function(n){return abiSetOf(n)})});
  var booster=team.filter(function(s){var sw=['悠游自如','叶绿素','拨沙','拨雪','雨盘','太阳之力','沙之力','冰冻之躯'];return s.abis.concat(s.inns).some(function(n){return sw.some(function(w){return abiSame(n,w)})})});
  if(setter.length||booster.length){
    if(setter.length&&!booster.length)html+='<div class="tip" style="background:#fff8e1">🌤 天气提示：有设置手（'+setter.map(function(s){return esc(s.zh)}).join('/')+'）但队内无天气受益者，天气收益浪费——建议补'+setter.map(function(s){var sy=coreSys(s)[0];return sy==='雨'?'悠游自如/雨盘打手':(sy==='晴'?'叶绿素/太阳之力打手':(sy==='沙'?'拨沙/沙之力打手':(sy==='雪'?'拨雪/冰冻之躯打手':'该天气受益者')))})[0]+'。</div>';
    else if(!setter.length&&booster.length)html+='<div class="tip" style="background:#fff8e1">🌤 天气提示：队内有天气受益者（'+booster.map(function(s){return esc(s.zh)}).join('/')+'）但缺设置手——收益特性空转，建议补对应天气设置手。</div>';
    else html+='<div class="tip" style="background:#e8f5e9">🌤 天气体系配套 ✓（设置手 '+setter.map(function(s){return esc(s.zh)}).join('/')+' + 受益者 '+booster.map(function(s){return esc(s.zh)}).join('/')+'）</div>';
  }
  /* 补位建议：共同弱点免疫者 + 覆盖缺口本系者 */
  var needTypes=[];
  ERDATA.types.forEach(function(at){if(dp.agg[at].w>=2)needTypes.push(at)});
  var ac2=atkCovers();
  ac2.per.forEach(function(row){});
  ERDATA.types.forEach(function(d){if(!ac.agg[d].has)needTypes.push(d)});
  if(needTypes.length){
    var best=[];
    ERDATA.species.forEach(function(t){
      if(inTeam[t.id])return;
      if(!isFinalForm(t)&&!evioOk(t))return; /* v4.3.1：非最终形态若具奇石优势则计入推荐 */
      if(!isValidSp(t))return; /* B7：占位/无效物种过滤 */
      var sc=0,why=[];
      needTypes.forEach(function(w){
        var v=defCellTrio(t,w).inn;
        if(v===0){sc+=3;why.push('免疫'+w)}
        else if(v<1){sc+=2;why.push('抵抗'+w)}
      });
      ERDATA.types.forEach(function(d){
        if(!ac.agg[d].has&&d!=='星晶'&&d!=='无'&&d!=='神秘'){
          if(t.t1===d||t.t2===d){sc+=2;why.push('本系'+d+'补覆盖缺口')}
        }
      });
      if(sc>0)best.push({s:t,sc:sc,why:why});
    });
    best.sort(function(a,b){return b.sc-a.sc});
    if(best.length){
      html+='<div class="sec" style="margin-top:8px"><h3>🎯 补位建议（应对共同弱点/覆盖缺口）</h3><div class="scroll"><table><thead><tr><th>候选</th><th>属性</th><th>评分</th><th>理由</th><th></th></tr></thead><tbody>';
      best.slice(0,4).forEach(function(r){
        html+='<tr><td><b>'+esc(r.s.zh)+'</b> <span style="font-size:11px;color:var(--sub)">#'+r.s.id+'</span></td><td>'+tlabel(r.s.t1)+(r.s.t2!==r.s.t1?' '+tlabel(r.s.t2):'')+'</td><td><b style="color:var(--accent)">+'+r.sc+'</b></td><td style="font-size:12px">'+esc(r.why.join('；'))+'</td>'+
          '<td><button class="btn-mini" onclick="addToTeam(ERDATA.species.filter(function(x){return x.id==\''+r.s.id+'\'})[0],null);renderAnalyze()" title="加入队伍">➕</button> '+
          '<button class="btn-mini" onclick="openSp(ERDATA.species.filter(function(x){return x.id==\''+r.s.id+'\'})[0])" title="看详情">🔍</button></td></tr>';
      });
      html+='</tbody></table></div></div>';
    }
  }
  html+='</div>';
  box.innerHTML=html;
}

/* ============ 存档 CSV 导入 ============ */
function parseCsvRows(text){
  var rows=[],row=[],cur='',inQ=false;
  for(var i=0;i<text.length;i++){
    var ch=text[i];
    if(inQ){
      if(ch==='"'){if(text[i+1]==='"'){cur+='"';i++}else inQ=false}
      else cur+=ch;
    }else{
      if(ch==='"')inQ=true;
      else if(ch===','){row.push(cur);cur=''}
      else if(ch==='\n'||ch==='\r'){
        if(ch==='\r'&&text[i+1]==='\n')i++;
        row.push(cur);cur='';
        if(row.length>1||row[0]!==''){rows.push(row)}
        row=[];
      }
      else cur+=ch;
    }
  }
  if(cur!==''||row.length){row.push(cur);if(row.length>1||row[0]!=='')rows.push(row)}
  return rows;
}
/* ============ 存档 .sav 解析（JS 移植 v4.1，免命令行；与 parse_er_save_v4.py 同逻辑） ============ */
var OTID_BYTES=[0x80,0x19,0x47,0x64],MOVE_MASK=0x7FF,ITEM_MASK=0x1FF,PC_SIZE=52,PARTY_SIZE=76,PARTY_COUNT=6,BOX_CAP=30,SEC_SIZE=0x1000,SAV_SIZE=0x20000;
var ANCHORS={411:[1,1,'护城龙'],469:[4,1,'远古巨蜓'],741:[20,1,'花舞鸟'],1513:[26,28,'超级化石翼龙'],2232:[0,0,'土王Mega(队伍首条)']};
var ITEM_ZH_EXTRA={0:'无',79:'文柚果',273:'吃剩的东西',285:'讲究围巾',298:'湿润岩石',305:'黑色污泥',312:'凸凸头盔'};
function u16(b,o){return b[o]|(b[o+1]<<8)}
function u32(b,o){return (b[o]|(b[o+1]<<8)|(b[o+2]<<16)|(b[o+3]<<24))>>>0}
function bytesEq(b,o,arr){for(var i=0;i<arr.length;i++){if(b[o+i]!==arr[i])return false}return true}
function speciesById(id){var r=null;ERDATA.species.forEach(function(s){if(s.id==id)r=s});return r}
function itemById(id){for(var i=0;i<ERDATA.items.length;i++){if(ERDATA.items[i][0]==id)return ERDATA.items[i]}return null}
function scanRecords(d){var out=[],s=0;while(s+0x0E<=d.length){var found=-1;for(var j=s;j+4<=d.length;j++){if(bytesEq(d,j,OTID_BYTES)){found=j;break}}if(found<0)break;var spec=u16(d,found+0x0C);if(spec>=1&&spec<=4000){out.push([found,spec]);s=found+0x34}else{s=found+1}}return out}
function decodeRotation(d){var obs=[];for(var sec=0;sec<SAV_SIZE/SEC_SIZE;sec++){var base=sec*SEC_SIZE;if(base+0xFFC+4>d.length)continue;if(!bytesEq(d,base+0xFF8,[0x25,0x20,0x01,0x08]))continue;var lid=u32(d,base+0xFF4)&0xFF;if(lid<0x20)obs.push([sec,lid])}var K=null;if(obs.length){var cand=(((obs[0][1]-obs[0][0])%20)+20)%20;var votes=0;obs.forEach(function(o){if((((o[1]-o[0])%20)+20)%20===cand)votes++});if(votes>=Math.max(1,Math.floor(obs.length/2)))K=cand}var logMap={};if(K!==null){for(var s2=0;s2<SAV_SIZE/SEC_SIZE;s2++)logMap[s2]=(s2+K)%20}return {K:K,logMap:logMap}}
function slowLevel(exp5){var exp=exp5*32;if(exp<=0)return {lv:0,exp:0};var L=Math.round(Math.pow(exp/1.25,1/3));while(1.25*Math.pow(L+1,3)<=exp+31)L++;while(1.25*Math.pow(L,3)>exp+31)L--;return {lv:L,exp:exp}}
function findParty(recs,d){for(var i=0;i<recs.length-1;i++){if(recs[i+1][0]-recs[i][0]===PARTY_SIZE){var j=i;while(j+1<recs.length&&recs[j+1][0]-recs[j][0]===PARTY_SIZE)j++;var cnt=j-i+1;if(cnt>=PARTY_COUNT){var ok=0;for(var k=i;k<=Math.min(j,i+PARTY_COUNT-1);k++){var off=recs[k][0];if(off+0x39<d.length&&d[off+0x38]>=1&&d[off+0x38]<=100&&d[off+0x39]===0xFF)ok++}if(ok>=PARTY_COUNT-1)return {start:i,end:i+PARTY_COUNT-1}}}}return {start:null,end:null}}
function calcStat(base,ev,lv,nature,isHp){if(isHp)return Math.floor((2*base+Math.floor(ev/4))*lv/100)+lv+10;return Math.floor((Math.floor((2*base+Math.floor(ev/4))*lv/100)+5)*nature)}
function decode4(v04,v08,v0A,v0E){return [v04&MOVE_MASK,v08&MOVE_MASK,(((v0A&MOVE_MASK)&0x1F)<<5)|(v08>>11),v0E&MOVE_MASK]}
function natureProfile(stats,base,evs,lv){if(!stats)return '';var labels=['攻击','防御','速度','特攻','特防'];var bm={攻击:base[1],防御:base[2],特攻:base[3],特防:base[4],速度:base[5]};var em={攻击:evs[1],防御:evs[2],速度:evs[3],特攻:evs[4],特防:evs[5]};var dm={攻击:stats[2],防御:stats[3],速度:stats[4],特攻:stats[5],特防:stats[6]};var prof=[];labels.forEach(function(lab){var b=calcStat(bm[lab],em[lab],lv,1.0,false);var r=b?dm[lab]/b:1.0;prof.push(lab+'='+(r>=1.05?'+10%':(r<=0.95?'-10%':'1.0')))});return prof.join(' ')}
function mvCell(mid){if(!(mid>0))return '无';var m=MV[mid];return (m?m[1]:'#'+mid)+'(id='+mid+')'}
function itemOf(iid){if(!(iid>0))return '无';var g=itemById(iid);if(!g)return '待确认(0x'+iid.toString(16).toUpperCase()+')';return (ITEM_ZH_EXTRA[iid]||g[2]||g[1])+'('+g[1]+')'}
function recFields(d,off){var exp5=u16(d,off+0x06);var sl=slowLevel(exp5);var evs=[d[off+0x14],d[off+0x15],d[off+0x16],d[off+0x17],d[off+0x18],d[off+0x19]];var m4=decode4(u16(d,off+0x04),u16(d,off+0x08),u16(d,off+0x0A),u16(d,off+0x0E));var item=u16(d,off+0x10)&ITEM_MASK;var enc='';for(var i=0x22;i<0x2F;i++)enc+=('0'+d[off+i].toString(16)).slice(-2);return {lv:sl.lv,exp:sl.exp,evs:evs,moves4:m4,item:item,enc:enc,v12:u16(d,off+0x12)}}
function hexBytes(d,o,n){var s='';for(var i=0;i<n;i++)s+=('0'+d[o+i].toString(16)).slice(-2);return s}
function buildRowJs(src,pos,off,spec,lv,exp,evs,moves4,item,stats,pp,enc,extra12,otidHex){
  var sp=speciesById(spec),en=sp?sp.en:'#'+spec,base=sp?(sp.base||[0,0,0,0,0,0]):[0,0,0,0,0,0];
  var t1=sp?sp.t1:'',t2=sp?(sp.t2||''):'';
  var abis=sp?(sp.abis||[]):[],inns=sp?(sp.inns||[]):[];
  var ev_std=[evs[0],evs[1],evs[2],evs[4],evs[5],evs[3]];
  var m1=moves4[0],m2=moves4[1],m3=moves4[2],m4=moves4[3];
  var cur,mx,atk,dfn,spe,spa,sdf,cap='';
  if(stats){cur=stats[0];mx=stats[1];atk=stats[2];dfn=stats[3];spe=stats[4];spa=stats[5];sdf=stats[6]}
  else{cur=mx=calcStat(base[0],evs[0],lv,1,true);atk=calcStat(base[1],evs[1],lv,1);dfn=calcStat(base[2],evs[2],lv,1);spe=calcStat(base[5],evs[3],lv,1);spa=calcStat(base[3],evs[4],lv,1);sdf=calcStat(base[4],evs[5],lv,1);cap='(公式基准)'}
  var nprof=natureProfile(stats,base,evs,lv);
  var lup=(sp?(sp.lv||[]):[]).slice().sort(function(a,b){return a[0]-b[0]||a[1]-b[1]}).slice(0,8);
  var lv_up=lup.map(function(p){var m=MV[p[1]];return (m?m[1]:p[1])+'@'+p[0]}).join(' ');
  var nUp=(sp?(sp.lv||[]):[]).length,nTut=(sp?(sp.tut||[]):[]).length;
  return {来源:src,位置:pos,偏移:'0x'+off.toString(16).toUpperCase(),图鉴编号:spec,宝可梦:sp?sp.zh:en,英文名:en,等级:lv,EXP:exp,属性1:t1,属性2:t2,种族HP:base[0],种族攻击:base[1],种族防御:base[2],种族特攻:base[3],种族特防:base[4],种族速度:base[5],EV_HP:ev_std[0],EV_攻击:ev_std[1],EV_防御:ev_std[2],EV_特攻:ev_std[3],EV_特防:ev_std[4],EV_速度:ev_std[5],能力_当前HP:cur,能力_最大HP:mx,能力_攻击:atk,能力_防御:dfn,能力_速度:spe,能力_特攻:spa,能力_特防:sdf+cap,特性1:abis[0]||'',特性2:abis[1]||'',特性3:abis[2]||'',天生特性1:inns[0]||'',天生特性2:inns[1]||'',天生特性3:inns[2]||'',道具:itemOf(item),招式1:mvCell(m1),招式2:mvCell(m2),招式3:mvCell(m3),'招式4(末招)':mvCell(m4),PP1:pp?pp[0]:'',PP2:pp?pp[1]:'',PP3:pp?pp[2]:'',PP4:pp?pp[3]:'',可学_升级:nUp,可学_教学:nTut,可学_蛋:0,可学_TMHM:0,'升级招式(前8)':lv_up,天性画像:nprof,OTID:otidHex||'','+0x12(疑似第5招)':extra12?mvCell(extra12):'',加密块:enc||''};
}
function parseSavBytes(d){
  var recs=scanRecords(d);
  var rot=decodeRotation(d),K=rot.K,logMap=rot.logMap;
  var fp=findParty(recs,d),pStart=fp.start;
  if(pStart===null){pStart=Math.max(0,recs.length-6);fp.end=recs.length-1}
  var pEnd=fp.end;
  var party=recs.slice(pStart,pEnd+1);
  var pcSet={};party.forEach(function(r){pcSet[r[0]]=1});
  var pcRecs=recs.filter(function(r){return !pcSet[r[0]]});
  function classify(off){var lid=logMap[Math.floor(off/SEC_SIZE)];var rel=off%SEC_SIZE;if(lid===undefined)return ['未知',rel];if(lid===8||lid===9||lid===10)return ['G1',rel];if(lid===12)return ['SA',rel];if(lid===14)return ['SB',rel];if(lid===15||lid===16||lid===17)return ['G2',rel];return ['OTHER',rel]}
  var groups={G1:[],SA:[],SB:[],G2:[],OTHER:[]};
  pcRecs.forEach(function(r){var k=classify(r[0]);groups[k[0]].push([r[0],r[1],k[1],(K!==null?(Math.floor(r[0]/SEC_SIZE)+K)%20:null)])});
  var gnames=['G1','SA','SB','G2','OTHER'];
  gnames.forEach(function(g){groups[g].sort(function(a,b){return (a[3]||-1)-(b[3]||-1)||a[2]-b[2]})});
  var rows=[],anchorsOk=[],anchorsFail=[];
  party.forEach(function(r,i){var off=r[0],spec=r[1];if(off+PARTY_SIZE>d.length)return;var f=recFields(d,off);var stats=[];for(var k=0;k<7;k++)stats.push(u16(d,off+0x3A+2*k));var pp=[d[off+0x30],d[off+0x31],d[off+0x32],d[off+0x33]];rows.push(buildRowJs('队伍','队伍'+(i+1),off,spec,f.lv,f.exp,f.evs,f.moves4,f.item,stats,pp,f.enc,f.v12,hexBytes(d,off,4)))});
  var g1idx=0,g2idx=0;
  gnames.forEach(function(gn){groups[gn].forEach(function(r){var off=r[0],spec=r[1];if(off+PC_SIZE>d.length)return;var f=recFields(d,off);var src,pos;
    if(gn==='G1'){var box=Math.floor(g1idx/BOX_CAP)+1,slot=g1idx%BOX_CAP+1;g1idx++;if(box<=7){src='BOX'+box;pos='第'+slot+'格'}else{src='散落';pos='0x'+off.toString(16).toUpperCase()}}
    else if(gn==='SA'){src='特殊区(待锚)';pos='待锚A'}
    else if(gn==='SB'){src='特殊区(待锚)';pos='待锚B'}
    else if(gn==='G2'){var b2x,sl2;if(g2idx<150){b2x=20+Math.floor(g2idx/BOX_CAP);sl2=g2idx%BOX_CAP+1}else if(g2idx<176){b2x=25;sl2=g2idx-150+1}else{b2x=26;sl2=g2idx-176+1}g2idx++;src='BOX'+b2x;pos='第'+sl2+'格'}
    else{src='散落';pos='0x'+off.toString(16).toUpperCase()}
    rows.push(buildRowJs(src,pos,off,spec,f.lv,f.exp,f.evs,f.moves4,f.item,null,null,f.enc,f.v12,''));
  })});
  var special=rows.filter(function(r){return r.来源.indexOf('特殊区')>-1});
  var partyRows=rows.filter(function(r){return r.来源==='队伍'});
  var failHits={};
  Object.keys(ANCHORS).forEach(function(sp){var bx=ANCHORS[sp][0],slot=ANCHORS[sp][1],cn=ANCHORS[sp][2];var hits=rows.filter(function(r){return r.图鉴编号==sp});if(bx===0){var hit=hits[0];if(hit&&hit.来源==='队伍')anchorsOk.push(cn+' 队伍首条 ✓');else anchorsFail.push(cn+': '+(hit?(hit.来源+' '+hit.位置):'未找到'))}else{var hit=hits[0];if(hit&&hit.来源==='BOX'+bx&&hit.位置==='第'+slot+'格')anchorsOk.push(cn+' BOX'+bx+'第'+slot+'格 ✓');else anchorsFail.push(cn+': 期望BOX'+bx+'第'+slot+'格, 实际='+(hit?(hit.来源+' '+hit.位置):'缺失'))}});
  return {rows:rows,party:partyRows,summary:{total:rows.length,party:partyRows.length,pc:rows.length-partyRows.length,special:special.length,K:K,anchorsOk:anchorsOk,anchorsFail:anchorsFail}};
}
function rowsToCsv(rows){if(!rows.length)return '';var cols=Object.keys(rows[0]);var lines=[cols.join(',')];rows.forEach(function(r){lines.push(cols.map(function(c){var v=(r[c]===undefined||r[c]===null)?'':String(r[c]);if(/[",\n]/.test(v))v='"'+v.replace(/"/g,'""')+'"';return v}).join(','))});return lines.join('\n')}
var lastSavCsv='';
function parseSavFile(input){
  var f=input.files&&input.files[0];if(!f)return;
  var rd=new FileReader();
  rd.onload=function(){
    try{
      var arr=new Uint8Array(rd.result);
      var res=parseSavBytes(arr);
      lastSavCsv=rowsToCsv(res.rows);
      var html='<div class="sec" style="border-color:var(--accent);background:#eef6ff"><h3>📊 存档解析结果（'+esc(f.name)+'）</h3>'+
        '<div style="font-size:13px">总记录 <b>'+res.summary.total+'</b> | 队伍 <b>'+res.summary.party+'</b> | 电脑区 '+res.summary.pc+' | 特殊区 '+res.summary.special+' | 段轮换 K='+res.summary.K+'</div>'+
        '<div style="margin:4px 0">锚点：'+(res.summary.anchorsOk.length?res.summary.anchorsOk.map(function(a){return '<span style="color:#2e7d32">✓ '+esc(a)+'</span>'}).join(' '):'')+(res.summary.anchorsFail.length?' <span style="color:#c62828">✗ '+esc(res.summary.anchorsFail.join('；'))+'</span>':'')+'</div>'+
        '<div style="margin-top:6px"><button class="btn-mini" onclick="copySavCsv()">📋 复制 CSV</button> <button class="btn-mini" onclick="downloadSavCsv()">⬇ 下载 CSV</button>'+
        ' <span id="savImpNote" style="font-size:11px;color:var(--sub)">队伍 6 只已自动导入；全量 CSV 可复制/下载</span></div></div>';
      $('savParseOut').innerHTML=html;
      autoImportParty(res);
      SAV_ROWS=(res.rows||[]);renderMyPool(); /* v4.6-B：同一份解析结果喂给「我的宝可梦」选择池 */
    }catch(e){toast('解析失败: '+e.message)}
  };
  rd.readAsArrayBuffer(f);
  input.value='';
}
/* D2 修复（独立黑盒复验）：导入 .sav / 粘贴 CSV 前**清空既有队伍**——此前队伍已有成员时，
   导入成员在满 6 只后被静默丢弃（实测：先手工入队 3 只再导入，洛奇亚/鳃鱼龙丢失，而提示仍写"6 只已导入"）。
   现行为：清空 → 全量导入（≤6）→ 输出明确写「已清空原队伍 N 只、导入 M 只」。返回被清空数量。 */
function clearTeamForImport(){
  var n=team.length;
  if(n){team.length=0;Object.keys(teamInfo).forEach(function(k){delete teamInfo[k]})}
  return n;
}
function autoImportParty(res){
  var cleared=clearTeamForImport(),added=0;
  res.rows.forEach(function(r){
    if(r.来源!=='队伍')return;
    var s=speciesById(r.图鉴编号);if(!s)return;
    if(team.indexOf(s)>-1)return;
    if(team.length>=6)return;
    var info={fromSave:true,item:r.道具,moves:[],pps:[]};
    [r.招式1,r.招式2,r.招式3,r['招式4(末招)']].forEach(function(n){info.moves.push(String(n||'').replace(/\(id=\d+\)$/,''))});
    [r.PP1,r.PP2,r.PP3,r.PP4].forEach(function(p){info.pps.push(p)});
    addToTeam(s,info);added++;
  });
  if(added){renderTm(true);renderSlots();renderAnalyze()}
  var note=$('savImpNote');
  if(note)note.textContent=(cleared?('已清空原队伍 '+cleared+' 只 → '):'')+'已导入队伍 '+added+' 只；全量 CSV 可复制/下载';
  return {cleared:cleared,added:added};
}
/* ============ v4.6-B：存档联动组队（我的宝可梦 → 需求驱动引擎）============
   硬性约束：**不改存档解析逻辑** —— parseSavBytes/parseSavFile/autoImportParty 原样复用，
   本层只做「解析结果（行）→ 选择池 → 点选作核 → renderNeedPlan()」的 UI 接入与数据传递。 */
var SAV_ROWS=[];
function myPoolFromSav(rows){
  var out=[],seen={};
  (rows||[]).forEach(function(r){
    if(!r)return;
    var id=(r.图鉴编号===undefined||r.图鉴编号===null)?null:String(r.图鉴编号).trim();if(!id||id==='')return;
    var s=speciesById(id);if(!s||!isValidSp(s))return;
    if(seen[id])return;seen[id]=1;
    out.push({id:s.id,s:s,src:String(r.来源||''),level:r.等级,item:String(r.道具||''),abi:String(r.特性1||''),
      moves:[r.招式1,r.招式2,r.招式3,r['招式4(末招)']].map(function(x){return String(x||'').replace(/\(id=\d+\)$/,'')}).filter(function(x){return x})});
  });
  return out;
}
function shortTag(t){t=String(t||'');return t.length>7?t.slice(0,7)+'…':t}
function sprImgMid(id){return '<img class="spmid" src="'+sprOf(id)+'" alt="" loading="lazy" decoding="async" onerror="this.hidden=true">'}
function renderMyPool(){
  var w=$('myPoolWrap');if(!w)return;
  var list=myPoolFromSav(SAV_ROWS);
  if(!list.length){w.innerHTML='<div class="mini" style="color:var(--sub)">尚未解析存档 —— 点上方「📂 解析存档 .sav」选文件，或用 CSV 导入；解析后此处显示「我的宝可梦」选择池（精灵图 / 等级 / 特性 / 道具 / 末招）。</div>';return}
  w.innerHTML='<div class="mini" style="color:var(--sub);grid-column:1/-1">共 '+list.length+' 只（队伍优先、按存档顺序去重）—— 点卡片 = 以它为核出方案；悬停看招式/道具/特性明细</div>'+
    list.map(function(x){
      var last=x.moves.length?x.moves[x.moves.length-1]:'—';
      var t='招式：'+(x.moves.join(' / ')||'—')+'　道具：'+(x.item||'—')+'　特性：'+(x.abi||'—');
      return '<div class="poolcard" onclick="myCoreTeam('+x.id+')" title="'+escq(t)+'">'+
        '<span class="psrc">'+esc(String(x.src).indexOf('队伍')>-1?'队伍':'BOX')+'</span>'+sprImgMid(x.id)+
        '<div class="pn">'+esc(x.s.zh)+'</div>'+
        '<div class="pl">Lv.'+esc(String(x.level||'?'))+'</div>'+
        '<div><span class="ptag">'+esc(shortTag(x.item)||'无道具')+'</span><span class="ptag">'+esc(shortTag(x.abi)||'—')+'</span></div>'+
        '<div class="pl">末招 '+esc(shortTag(last))+'</div></div>';
    }).join('');
}
function myCoreTeam(id){
  var s=speciesById(id);if(!s){toast('该编号不在图鉴中');return}
  var o=$('myTeamOut');if(!o)return;
  o.innerHTML='<div class="sec" style="margin:8px 0"><h3>'+sprImg(s.id,'spinl')+esc(s.zh)+' <span style="font-size:12px;color:var(--sub)">#'+s.id+'</span> <span class="mini" style="color:var(--sub)">（核心来自存档 · 同一套需求驱动引擎）</span></h3></div>'+renderNeedPlan(s);
  try{o.scrollIntoView({behavior:'smooth',block:'start'})}catch(e){}
}
/* v4.6 收尾：页内轻提示（替代原生 alert —— 原生 alert 阻塞 JS 线程，历史 bu 事故同源） */
function toast(msg,ms){
  var box=document.getElementById('toastBox');
  if(!box){box=document.createElement('div');box.id='toastBox';document.body.appendChild(box)}
  var el=document.createElement('div');el.className='toastmsg';el.textContent=String(msg==null?'':msg);
  box.appendChild(el);
  setTimeout(function(){try{if(el.parentNode)el.parentNode.removeChild(el)}catch(e){}},ms||2800);
  return el;
}
function copySavCsv(){if(!lastSavCsv){toast('暂无解析结果');return}var ta=document.createElement('textarea');ta.value=lastSavCsv;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy')}catch(e){}document.body.removeChild(ta);toast('已复制 '+lastSavCsv.split('\n').length+' 行 CSV')}
function downloadSavCsv(){if(!lastSavCsv){toast('暂无解析结果');return}var blob=new Blob(['\ufeff'+lastSavCsv],{type:'text/csv;charset=utf-8'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='存档解析_网页版_'+new Date().toISOString().slice(0,10)+'.csv';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);document.body.removeChild(a)},500)}
function toggleCsvPanel(){var p=$('csvPanel');p.style.display=p.style.display==='none'?'block':'none'}
function importSaveBox(){
  var text=$('saveCsv').value;
  if(!text.trim()){toast('请先粘贴存档 CSV 文本');return}
  var rows=parseCsvRows(text);
  if(!rows.length){toast('CSV 解析为空');return}
  var hdr=rows[0],idx={};
  if(hdr.length&&hdr[0]&&hdr[0].charCodeAt(0)===0xFEFF)hdr[0]=hdr[0].slice(1);
  hdr.forEach(function(c,i){idx[c]=i});
  if(idx['来源']===undefined||idx['图鉴编号']===undefined){toast('表头不匹配，需要 存档解析（网页版）导出的 CSV（含 来源 / 图鉴编号 列）');return}
  var cleared=clearTeamForImport(); /* D2：导入前清空既有队伍，保证 6 只全导入 */
  var added=0;
  for(var i=1;i<rows.length;i++){
    var r=rows[i];
    if((r[idx['来源']]||'').indexOf('队伍')<0)continue;
    var spId=(r[idx['图鉴编号']]||'').trim();
    var s=null;
    ERDATA.species.forEach(function(x){if(x.id===spId)s=x});
    if(!s)continue;
    if(team.indexOf(s)>-1)continue;
    if(team.length>=6)break;
    var info={fromSave:true,item:r[idx['道具']]||'',moves:[],pps:[]};
    ['招式1','招式2','招式3','招式4(末招)'].forEach(function(n){if(idx[n]!==undefined)info.moves.push(r[idx[n]]||'')});
    ['PP1','PP2','PP3','PP4'].forEach(function(n){if(idx[n]!==undefined)info.pps.push(r[idx[n]]||'')});
    addToTeam(s,info);
    added++;
  }
  var objRows=[];for(var qi=1;qi<rows.length;qi++){var qr=rows[qi],qo={};for(var qc in idx){qo[qc]=qr[idx[qc]]}objRows.push(qo)}
  SAV_ROWS=objRows;renderMyPool(); /* v4.6-B：CSV 导入同样喂给选择池 */
  toast(added?((cleared?('已清空原队伍 '+cleared+' 只 → '):'')+'已导入 '+added+' 只队伍成员'):'未找到「来源=队伍」的行，或都已入队');
}

/* ============ 特性反查 ============ */
var NM2ID={};
ERDATA.abilities.forEach(function(a){NM2ID[a[1]]=a[0];if(a[2])NM2ID[a[2]]=a[0]});
ERDATA.abiAlias&&Object.keys(ERDATA.abiAlias).forEach(function(k){if(NM2ID[k]===undefined)NM2ID[k]=ERDATA.abiAlias[k]});
(function(){
  $('abiSearch').oninput=function(){renderAbi()};
  renderAbi();
})();
/* v4.x F⑪：特性持有者索引（懒构建，避免加载期依赖 NM2ID 定义顺序） */
var _abiOwners=null;
function abiOwners(){
  if(_abiOwners)return _abiOwners;
  var o={};
  ERDATA.species.forEach(function(s){
    if(!isValidSp(s))return;
    s.abis.forEach(function(n){var id=NM2ID[n];if(id===undefined||id===null)return;(o[id]=o[id]||{ab:[],inn:[]}).ab.push(s)});
    s.inns.forEach(function(n){var id=NM2ID[n];if(id===undefined||id===null)return;(o[id]=o[id]||{ab:[],inn:[]}).inn.push(s)});
  });
  _abiOwners=o;return o;
}
function abiOwnerCol(title,list){
  /* v4.x UI 定稿：持有者用「精灵图 + 中文名 + 属性徽标」紧凑卡片网格（图片优先、少文字），点卡片跳详情 */
  var h='<div><div style="font-weight:600;font-size:12px;margin-bottom:4px">'+esc(title)+' <b>'+list.length+'</b> 只</div>';
  if(!list.length)h+='<div class="mini" style="color:var(--sub)">（无）</div>';
  else{
    h+='<div class="mxgrid" style="max-height:260px;overflow:auto">';
    list.slice(0,60).forEach(function(s){
      h+='<div class="mxc" data-sid="'+s.id+'" onclick="openSpById(\''+s.id+'\')" title="'+escq(s.zh+' #'+s.id+' '+s.t1+(s.t2&&s.t2!==s.t1?'/'+s.t2:''))+'">'+
        sprRaw(s.id)+
        '<div class="mcnm">'+esc(s.zh)+'</div><div class="mcx">'+esc(s.t1+(s.t2&&s.t2!==s.t1?'·'+s.t2:''))+'</div></div>';
    });
    h+='</div>';
    if(list.length>60)h+='<div class="mini" style="color:var(--sub)">…共 '+list.length+' 只（仅列前 60）</div>';
  }
  return h+'</div>';
}
function renderAbi(){
  var q=$('abiSearch').value.trim();
  var box=$('abiResult');box.innerHTML='';
  var cnt=0,own=abiOwners();
  ERDATA.abilities.forEach(function(a){
    var zh=a[2]||'',en=a[1]||'',desc=abiDescZhOf(a[0]);
    if(a[0]==='0')return;
    if(!fzAny(q,[a[0],zh,en,desc]))return;
    if(cnt>=60)return;
    cnt++;
    var grp=own[a[0]]||{ab:[],inn:[]};
    var tl=[];
    try{tl=abiTagLines(a[0])}catch(e){tl=[];console.warn('abiTagLines('+a[0]+')',e)}
    var card=document.createElement('div');card.className='abicard';
    card.style.cssText='border:1px solid var(--line);background:var(--card);border-radius:10px;padding:10px;margin-bottom:8px;cursor:pointer';
    /* F⑪ 交互：标题行 + 「点击展开」提示均在 .abihd 内；整卡可点（含留白），详情区/按钮内点击不切换 */
    card.innerHTML='<div class="abihd" style="cursor:pointer"><b>'+esc(zh||en)+'</b> <span style="font-size:11px;color:var(--sub)">'+esc(en)+' #'+a[0]+'</span>'+
      '<span class="badge badge-res" style="float:right">可选 '+grp.ab.length+'</span><span class="badge badge-imm" style="float:right;margin-right:4px">天性 '+grp.inn.length+'</span>'+
      '<div class="mini" style="color:var(--sub);margin-top:4px;clear:both">'+esc(desc.slice(0,120))+(desc.length>120?'…':'')+' <span style="color:var(--accent)">（点击展开详情卡）</span></div></div>'+
      '<div class="abimain" style="display:none">'+
        '<div class="sec" style="margin:8px 0"><h3>中文描述</h3><div style="font-size:12px;line-height:1.95">'+glossify(desc||'（无中文描述）')+'</div></div>'+
        '<div class="sec" style="margin:8px 0"><h3>战斗意义（ABI_TAGS 标签解读）</h3><div style="font-size:12px;line-height:1.9">'+
          (tl.length?tl.map(function(x){return '• '+esc(x)}).join('<br>'):'<span style="color:var(--sub)">（ABI_TAGS 未登记标签）</span>')+'</div></div>'+
        '<div class="sec" style="margin:8px 0"><h3>持有者（分两列：可选池 / 天性固定）</h3><div class="abicol">'+
          abiOwnerCol('作为特性（可选池）',grp.ab)+abiOwnerCol('作为天性（固定）',grp.inn)+'</div></div>'+
      '</div>';
    card.onclick=function(ev){
      var t=ev&&ev.target;
      if(t&&t.closest&&(t.closest('.abimain')||t.closest('button')||t.closest('select')||t.closest('input')))return;
      abiToggle(card);
    };
    var hd=card.querySelector('.abihd');
    if(hd)hd.onclick=function(ev){ /* 兜底：即使事件委托失效，标题行本身也能切换 */
      var t=ev&&ev.target;
      if(t&&t.closest&&(t.closest('.abimain')||t.closest('button')))return;
      abiToggle(card);if(ev&&ev.stopPropagation)ev.stopPropagation();
    };
    card.querySelectorAll('.mxrow[data-sid]').forEach(function(el){
      el.onclick=function(){var s=speciesById(el.dataset.sid);if(s)openSp(s)};
    });
    box.appendChild(card);
  });
  /* 注意：这里必须用 DOM 追加（appendChild）而不是对容器 innerHTML 做自增重解析——重解析会重建
     全部子节点，把上面逐卡绑定的 card.onclick / hd.onclick / 持有者卡 onclick 全部丢掉
     （用户实测「点特性无效果」根因）。断言 verify_v4 会检查本函数内不出现自增重解析。 */
  if(!cnt)box.innerHTML='<div style="color:var(--sub)">无匹配特性</div>';
  else if(cnt>=60){
    var note=document.createElement('div');
    note.style.cssText='color:var(--sub);text-align:center;padding:8px';
    note.textContent='已显示前 60 个匹配，请细化关键词';
    box.appendChild(note);
  }
}
/* F⑪：特性详情卡展开/收起（返回展开态；force=true 展开 / false 收起） */
function abiToggle(card,force){
  if(!card)return false;
  var m=card.querySelector('.abimain');if(!m)return false;
  var open=(typeof force==='boolean')?force:(m.style.display==='none');
  m.style.display=open?'block':'none';
  var hd=card.querySelector('.abihd');if(hd)hd.classList[open?'add':'remove']('open');
  return open;
}
function gotoAbi(name){
  $('abiSearch').value=name;renderAbi();switchTab('abi');
}

/* ============ 战术模板 ============ */
/* v4.x G⑫：数据层 templates<18 时启用引擎侧兜底模板（新增 6 套，契约定为 6-8 套） */
var TPL_EXTRA=[
  {name:'毒钉受队',theme:'毒菱+隐形岩铺场 → 剧毒/冻伤双压 → 再生力轮转',roles:['毒菱手','撒菱/隐形岩手','物盾','特盾','回复手'],
   keys:[['招式','毒菱'],['招式','剧毒'],['招式','隐形岩'],['特性','再生力'],['特性','毒棘']],
   match:{abis:['再生力','毒棘','威吓','自然回复'],moves:['毒菱','剧毒','隐形岩','撒菱','自我再生','羽栖'],types:['毒','钢']},
   counters:{types:['钢','毒','地面'],abis:['飘浮','魔法反射','免疫']},
   flow:['毒菱起手（2 层）','钉子补伤害','剧毒/冻伤双压消耗','再生力轮转保血线'],
   tips:['毒/钢免疫毒菱 → 用撒菱/隐形岩补位','剧毒场地（毒招 +30%）可与毒菱联用','引擎侧兜底模板（数据层 templates<18）']},
  {name:'强化接力',theme:'接力棒传递强化级 → 高速清场手收头',roles:['强化手','接力手','清场手','钉子手','联防位'],
   keys:[['招式','剑舞'],['招式','接力棒'],['招式','诡计'],['特性','加速']],
   match:{abis:['加速','技术高手','威吓'],moves:['剑舞','接力棒','诡计','生长','蝶舞'],types:['一般']},
   counters:{types:['恶','幽灵'],abis:['挑拨','纯朴','结实']},
   flow:['强化手找机会堆级','接力棒把强化传给清场手','清场手高速收头','钉子手铺场压制换人'],
   tips:['纯朴/结实无视或抵抗强化 → 备高威力直伤','接力棒可能被先制打断','引擎侧兜底模板（数据层 templates<18）']},
  {name:'天气双核',theme:'双天气手互切 → 两套受益打手覆盖不同弱点',roles:['天气手 A','天气手 B','受益打手 ×2','稳场位'],
   keys:[['特性','降雨'],['特性','日照'],['招式','求雨'],['招式','大晴天']],
   match:{abis:['降雨','日照','悠游自如','叶绿素','扬沙','降雪'],moves:['求雨','大晴天','水炮','大字火','暴风'],types:['水','火']},
   counters:{types:['草','电'],abis:['无关天气','气闸','储水','引水']},
   flow:['按对手弱点切换天气','打手吃天气增伤 ×1.5','稳场位防对手覆盖天气'],
   tips:['无关天气/气闸会压制全部天气收益','双天气手注意覆盖顺序','引擎侧兜底模板（数据层 templates<18）']},
  {name:'场地控制',theme:'电气/精神场地覆盖 → 压制先制与异常状态',roles:['场地手','场地受益打手','除钉手','物盾'],
   keys:[['特性','电气制造者'],['特性','精神制造者'],['招式','电气场地'],['招式','精神场地']],
   match:{abis:['电气制造者','精神制造者','青草制造者','发电机','割草机'],moves:['电气场地','精神场地','青草场地','薄雾场地'],types:['电','超能力']},
   counters:{types:['地面','恶'],abis:['割草机','低能见度']},
   flow:['场地手开场设置场地','受益打手吃场地增伤 ×1.3','除钉手保场地','物盾顶对手反打'],
   tips:['地面系免疫电气场地增益','对手割草机可移除场地','引擎侧兜底模板（数据层 templates<18）']},
  {name:'吸血站场',theme:'大威力吸取招 + 回复 → 边打边回、站场不退',roles:['吸取打手','物盾','回复手','钉子手'],
   keys:[['招式','终极吸取'],['招式','寄生种子'],['招式','自我再生'],['特性','再生力']],
   match:{abis:['再生力','自然回复','威吓','储水'],moves:['终极吸取','寄生种子','自我再生','羽栖','剧毒'],types:['草','虫']},
   counters:{types:['火','毒'],abis:['魔法反射','结实','食草']},
   flow:['钉子/寄生种子先铺垫','吸取招边打边回血','血线危险时换人保命'],
   tips:['火/毒系不吃寄生种子','吸血效率受对手特防影响','引擎侧兜底模板（数据层 templates<18）']},
  {name:'双天气轮换',theme:'主天气 + 备天气轮换 → 视局势切换增伤与压制',roles:['主天气手','备天气手','受益打手 ×2','除钉手'],
   keys:[['特性','降雨'],['特性','扬沙'],['招式','求雨'],['招式','沙暴']],
   match:{abis:['降雨','扬沙','悠游自如','拨沙','沙之力'],moves:['求雨','沙暴','水炮','岩崩'],types:['水','岩石']},
   counters:{types:['格斗','草'],abis:['无关天气','气闸','储水']},
   flow:['开局按对手属性选主天气','中期换备天气打乱节奏','打手吃对应增伤 ×1.5'],
   tips:['天气 8 回合（岩石 12）需算好切换节奏','对手天气手在场时是覆盖战','引擎侧兜底模板（数据层 templates<18）']}
];
function tplAll(){
  var t=(ERDATA.templates||[]).slice();
  if(t.length<18)t=t.concat(TPL_EXTRA.slice(0,Math.max(0,18-t.length)));
  return t;
}
function tplDataCount(){return (ERDATA.templates||[]).length}
/* ==================================================================================
   v4.x 推荐评分体系化 —— 体系 → 维度 → 权重表（用户裁定：评分制本身是对的，但维度判断与加权
   系数需要合理；铁证：龙头地鼠速度 88 却被「戏法空间」推为首选）
   设计：
   · 每个体系一张「维度权重表」：{dim 维度名, w 权重, j(s,ctx) → {pts, txt}}
   · 总分 = Σ(pts × w)；why 逐维度列分（评分可解释）
   · v4.2（用户裁定 · 正向体系构建）：**取消 drop 硬排除**（原中速进空间队 = drop=true → 总分 −999）。
     现改为负分排后（如空间速度 >85 → −6），候选仍出现在推荐列表，只是排位靠后；
     `sysScore` 仍返回 drop 字段但恒为 false（兼容旧调用方/断言）。
   · ctx 可带 {learn, conv, sys, names, core, side, roleTag}，数据不足的维度判 0（模板场景无队伍）
   · 体系识别走 archOfTpl(t)（模板）/ archOfSp(s,side,roleTag)（精灵）；两者共用同一张表
   维度权重表逐项见交付报告《v4.x 推荐评分体系化》节。
   ================================================================================== */
function bstI(s,i){return (s.base&&s.base[i])||0}
function spdOf(s){return bstI(s,5)}
function atkBest(s){return Math.max(bstI(s,1),bstI(s,3))}
function bulkOf(s){return bstI(s,0)+bstI(s,2)+bstI(s,4)}
function isType(s,t){return s.t1===t||s.t2===t}
/* 注：mvIdByZhOrEn 返回**字符串** id（for..in 键），而 learnOf() 返回**数字**数组；
   必须统一为数字，否则 indexOf 恒为 -1（v4.x 修：archOfSp 的「空间/强化」判定与体系受益招维度都依赖它） */
function learnHasName(s,name,learn){var id=mvIdByZhOrEn(name);return id!==null&&(learn||learnOf(s)).indexOf(Number(id))>-1}
function countLearnNames(s,names,learn){var L=learn||learnOf(s),c=0;names.forEach(function(n){if(learnHasName(s,n,L))c++});return c}
/* 体系受益属性（本系高威力口径用） */
var SYS_TYPES={'晴':['火','草'],'雨':['水'],'沙':['岩石','钢','地面'],'雪':['冰'],
  '电场':['电'],'精神场地':['超能力'],'青草场地':['草'],'薄雾场地':['妖精','龙'],'场地':['电','超能力','草','妖精']};
/* 体系核心招（天气/场地受益招、空间受益招等） */
var SYS_MV_KEYS={'晴':['生长','日光束','喷射火焰','热风','大字火','喷火','热风'],
  '雨':['冲浪','水炮','打雷','暴风','热水','求雨'],
  '沙':['岩崩','尖石攻击','地震','隐形岩','铁头'],
  '雪':['暴风雪','冰冻光束','冰柱坠击','极光幕','冰息'],
  '空间':['陀螺球','重磅冲撞','地震','喷水'],
  '强化':['剑舞','龙之舞','诡计','蝶舞','破壳','自我激励','接棒','替身'],
  '吸血':['终极吸取','吸取拳','吸血','吸取之吻','吸取力量','寄生种子'],
  '顺风':['顺风','急速折返','伏特替换','神速','突袭'],
  '受':['隐形岩','撒菱','毒菱','剧毒','清除浓雾','羽栖','自我再生','高速旋转'],
  '双天气':['求雨','大晴天','沙暴','冰雹']};
/* 体系维度权重表 —— 每项：{dim, w, j(s,ctx) → {pts, txt} | null}（pts 已含「基础分」，w 用于对照报告） */
var SYS_DIMS={
/* ① 空间队：低速 + 超高力度（v4.2 正向化：速度 >85 不再硬排除，仅低分排后，候选仍出现在列表）*/
'空间':[
 {dim:'速度适配（越低越优）',w:2,j:function(s){var v=spdOf(s);
   if(v<=60)return{pts:6,t:'速度 '+v+'≤60：空间内先手（+6）'};
   if(v<=85)return{pts:3,t:'速度 '+v+'≤85：可进空间（+3）'};
   return{pts:-6,t:'速度 '+v+' 偏快，空间下收益低（−6，仍可入选低排位）'}}},
 {dim:'力度（物/特攻种族）',w:2,j:function(s){var a=atkBest(s);
   if(a>=130)return{pts:5,t:'力度 '+a+' 极高（+5）'};
   if(a>=110)return{pts:3,t:'力度 '+a+' 高（+3）'};
   if(a>=95)return{pts:1,t:'力度 '+a+' 中（+1）'};
   return{pts:-2,t:'力度 '+a+' 偏低（−2）'}}},
 {dim:'本系折算威力',w:1,j:function(s,c){var bp=Math.max(bestPowOf(s,'物理',c.conv),bestPowOf(s,'特殊',c.conv));
   if(bp>=150)return{pts:3,t:'本系折算威力 '+Math.round(bp)+'（+3）'};
   if(bp>=120)return{pts:2,t:'本系折算威力 '+Math.round(bp)+'（+2）'};
   if(bp>=100)return{pts:1,t:'本系折算威力 '+Math.round(bp)+'（+1）'};
   return null}},
 {dim:'空间受益要素（低速招/特性）',w:1,j:function(s,c){var p=0,tx=[];
   if(learnHasName(s,'陀螺球',c.learn)){p+=2;tx.push('陀螺球')}
   if(learnHasName(s,'重磅冲撞',c.learn)){p+=2;tx.push('重磅冲撞')}
   if(c.names.some(function(n){return ['慢出','迟钝','硬爪','大力士','瑜伽之力'].indexOf(n)>-1})){p+=2;tx.push('低速受益特性')}
   return p?{pts:Math.min(p,4),t:'空间受益要素 '+tx.join('/')+'（+'+Math.min(p,4)+'）'}:null}},
 {dim:'与队友速度互补',w:1,j:function(s,c){if(!c.core)return null;
   var d=Math.abs(spdOf(s)-spdOf(c.core));
   if(d>=25)return{pts:1,t:'与核心速度错峰 '+spdOf(s)+' vs '+spdOf(c.core)+'（+1）'};
   return null}}],
/* ②③ 晴/雨速攻：速度 + 本系高威力 + 天气受益特性/招 */
'晴':[
 {dim:'速度（速攻位）',w:1,j:function(s,c){if(!c.speedFocus)return null;var v=spdOf(s);
   if(v>=110)return{pts:5,t:'速度 '+v+'（+5）'};if(v>=95)return{pts:3,t:'速度 '+v+'（+3）'};
   if(v>=80)return{pts:1,t:'速度 '+v+'（+1）'};return{pts:-2,t:'速度 '+v+' 偏慢（−2）'}}},
 {dim:'体系受益特性 / 天气手',w:3,j:function(s,c){if(c.sys.indexOf('晴')<0)return null;
   return{pts:4,t:'晴体系受益（'+c.sys.join('/')+'）'}}},
 {dim:'出场开天气（设置手）',w:3,j:function(s,c){return isAbilSet(s,'晴')?{pts:4,t:'出场开晴（'+sysSetterName(s,'晴')+'）'}:(isMvSet(s,'晴')?{pts:2,t:'可学晴天招'} : null)}},
 {dim:'天气受益招/强化招',w:1,j:function(s,c){var n=countLearnNames(s,SYS_MV_KEYS['晴'],c.learn);return n?{pts:Math.min(n,3),t:'晴受益招 '+n+' 个（生长=晴双倍强化）'}:null}},
 {dim:'本系高威力（火/草）',w:1,j:function(s,c){if(!(isType(s,'火')||isType(s,'草')))return null;var bp=Math.max(bestPowOf(s,'物理',c.conv),bestPowOf(s,'特殊',c.conv));
   return bp>=120?{pts:2,t:'火/草本系折算 '+Math.round(bp)+'（+2）'}:(bp>=100?{pts:1,t:'火/草本系折算 '+Math.round(bp)+'（+1）'}:null)}},
 {dim:'力度门（速攻≥95）',w:2,j:function(s){var a=atkBest(s);return a>=110?{pts:2,t:'力度 '+a+'（+2）'}:(a<95?{pts:-3,t:'力度 '+a+' 不足（−3）'}:null)}}],
'雨':[
 {dim:'速度（速攻位）',w:1,j:function(s,c){if(!c.speedFocus)return null;var v=spdOf(s);
   if(v>=110)return{pts:5,t:'速度 '+v+'（+5）'};if(v>=95)return{pts:3,t:'速度 '+v+'（+3）'};
   if(v>=80)return{pts:1,t:'速度 '+v+'（+1）'};return{pts:-2,t:'速度 '+v+' 偏慢（−2）'}}},
 {dim:'体系受益特性（悠游自如/雨盘/干燥皮肤）',w:3,j:function(s,c){if(c.sys.indexOf('雨')<0)return null;return{pts:4,t:'雨体系受益（'+c.sys.join('/')+'）'}}},
 {dim:'出场开雨（设置手）',w:3,j:function(s,c){return isAbilSet(s,'雨')?{pts:4,t:'出场开雨（'+sysSetterName(s,'雨')+'）'}:(isMvSet(s,'雨')?{pts:2,t:'可学求雨'} : null)}},
 {dim:'天气受益招（水炮/冲浪/打雷/暴风）',w:1,j:function(s,c){var n=countLearnNames(s,SYS_MV_KEYS['雨'],c.learn);return n?{pts:Math.min(n,3),t:'雨受益招 '+n+' 个'}:null}},
 {dim:'本系高威力（水）',w:1,j:function(s,c){if(!isType(s,'水'))return null;var bp=Math.max(bestPowOf(s,'物理',c.conv),bestPowOf(s,'特殊',c.conv));
   return bp>=120?{pts:2,t:'水系本系折算 '+Math.round(bp)+'（+2）'}:(bp>=100?{pts:1,t:'水系本系折算 '+Math.round(bp)+'（+1）'}:null)}},
 {dim:'力度门（速攻≥95）',w:2,j:function(s){var a=atkBest(s);return a>=110?{pts:2,t:'力度 '+a+'（+2）'}:(a<95?{pts:-3,t:'力度 '+a+' 不足（−3）'}:null)}}],
/* ④ 沙暴：岩石/钢/地面本系 + 沙暴受益 + 低速站场 */
'沙':[
 {dim:'岩石/钢/地面本系',w:2,j:function(s){var hit=['岩石','钢','地面'].filter(function(t){return isType(s,t)});
   return hit.length?{pts:3*Math.min(hit.length,2),t:'沙暴友好属性 '+hit.join('/')+'（+'+3*Math.min(hit.length,2)+'）'}:null}},
 {dim:'沙暴受益特性（沙隐/沙之力/拨沙）',w:3,j:function(s,c){return c.sys.indexOf('沙')>-1?{pts:4,t:'沙体系受益（'+c.sys.join('/')+'）'}:(isAbilSet(s,'沙')?{pts:4,t:'出场开沙暴'}:(isMvSet(s,'沙')?{pts:2,t:'可学沙暴'}:null))}},
 {dim:'岩石系特防×1.5 受益',w:1,j:function(s){return isType(s,'岩石')?{pts:1,t:'岩石系沙暴特防×1.5（+1）'}:null}},
 {dim:'低速站场',w:1,j:function(s){var v=spdOf(s);if(v<=70)return{pts:2,t:'低速站场 '+v+'（+2）'};return v>=100?{pts:-2,t:'速度 '+v+' 偏快（−2）'}:null}},
 {dim:'力度/耐久',w:1,j:function(s){var a=atkBest(s);return a>=110?{pts:2,t:'力度 '+a+'（+2）'}:(bulkOf(s)>=300?{pts:2,t:'耐久三角 '+bulkOf(s)+'（+2）'}:null)}}],
/* ⑤ 雪天：冰系本系 + 雪隐/冰冻之躯 + 冰冻类招 + 耐久 */
'雪':[
 {dim:'冰系本系',w:2,j:function(s){return isType(s,'冰')?{pts:3,t:'冰系本系（+3）'}:null}},
 {dim:'雪天受益特性（雪隐/冰冻之躯/拨雪）',w:3,j:function(s,c){return c.sys.indexOf('雪')>-1?{pts:4,t:'雪体系受益（'+c.sys.join('/')+'）'}:(isAbilSet(s,'雪')?{pts:4,t:'出场开雪'}:(isMvSet(s,'雪')?{pts:2,t:'可学冰雹'}:null))}},
 {dim:'冰冻类招（暴风雪必中）',w:1,j:function(s,c){var n=countLearnNames(s,SYS_MV_KEYS['雪'],c.learn);return n?{pts:Math.min(n,3),t:'冰冻类招 '+n+' 个'}:null}},
 {dim:'耐久/极光幕',w:1,j:function(s,c){var p=0,tx=[];
   if(bulkOf(s)>=300){p+=2;tx.push('耐久三角 '+bulkOf(s))}
   if(learnHasName(s,'极光幕',c.learn)){p+=2;tx.push('极光幕')}
   return p?{pts:p,t:'雪天站场 '+tx.join('/')+'（+'+p+'）'}:null}}],
/* ⑥ 场地（电气/精神/青草/薄雾/场地控制）：场地手 + 场地受益 + 对应属性本系 */
'场地':[
 {dim:'场地设置手（出场开场地）',w:3,j:function(s){var hit=['电场','精神场地','青草场地','薄雾场地'].filter(function(x){return isAbilSet(s,x)});
   if(hit.length)return{pts:5,t:'出场开场地 '+hit.join('/')+'（+5）'};
   var mv=countLearnNames(s,['电气场地','精神场地','青草场地','薄雾场地'],null);
   return mv?{pts:2,t:'可学场地招'+mv+'个（+2）'}:null}},
 {dim:'场地受益特性',w:3,j:function(s,c){var hit=c.sys.filter(function(x){return x.indexOf('场地')>-1||x==='电场'});
   return hit.length?{pts:3,t:'场地受益（'+hit.join('/')+'）'}:null}},
 {dim:'场地受益属性本系',w:1,j:function(s){var hit=['电','超能力','草','妖精'].filter(function(t){return isType(s,t)});
   return hit.length?{pts:2,t:'场地受益属性 '+hit.join('/')+'（+2）'}:null}},
 {dim:'场地输出招',w:1,j:function(s,c){var n=countLearnNames(s,['十万伏特','精神强念','青草滑梯','魔法闪耀'],c.learn);return n?{pts:Math.min(n,2),t:'场地增伤招 '+n+' 个'}:null}}],
/* ⑦ 受队（钉子/毒钉/消耗）：耐久三角 + 回复 + 钉子/剧毒/除钉 + 联防 */
'受':[
 {dim:'耐久三角（HP+防+特防）',w:2,j:function(s){var b=bulkOf(s);
   if(b>=340)return{pts:5,t:'耐久三角 '+b+' 极高（+5）'};
   if(b>=300)return{pts:3,t:'耐久三角 '+b+'（+3）'};
   return b<280?{pts:-2,t:'耐久三角 '+b+' 偏脆（−2）'}:null}},
 {dim:'回复招（自我再生/羽栖等）',w:2,j:function(s,c){var n=countLearnNames(s,['自我再生','羽栖','光合作用','生蛋','喝牛奶'],c.learn);
   return n?{pts:3,t:'回复招 '+n+' 个（+3）'}:null}},
 {dim:'钉子/剧毒/除钉',w:1,j:function(s,c){var p=0,tx=[];
   if(hasAny(c.learn,FUNC_MV.hazard)){p+=2;tx.push('钉子')}
   if(c.learn.indexOf(92)>-1){p+=2;tx.push('剧毒')}
   if(hasAny(c.learn,FUNC_MV.removal)){p+=2;tx.push('除钉')}
   return p?{pts:p,t:'消耗组件 '+tx.join('/')+'（+'+p+'）'}:null}},
 {dim:'联防价值（免疫/抵抗模板弱点）',w:1,j:function(s,c){if(!c.counters||!c.counters.length)return null;var p=0,tx=[];
   c.counters.forEach(function(w){var v=defCellTrio(s,w).inn;if(v===0){p+=2;tx.push('免疫'+w)}else if(v<1){p+=1;tx.push('抵抗'+w)}});
   return p?{pts:Math.min(p,4),t:'联防 '+tx.join('、')+'（+'+Math.min(p,4)+'）'}:null}},
 {dim:'不推脆皮炮台',w:1,j:function(s){return atkBest(s)>=115&&bulkOf(s)<290?{pts:-2,t:'高攻但脆（受队不吃力度，−2）'}:null}}],
/* ⑧ 强化（清场轴/接力）：强化招 + 接力 + 清场速度 + 输出特性 + 先制 */
'强化':[
 {dim:'强化招数量',w:2,j:function(s,c){var n=countLearnNames(s,['剑舞','龙之舞','诡计','蝶舞','破壳','自我激励','生长','铁壁','健美','磨爪','腹鼓'],c.learn);
   return n?{pts:Math.min(n*2,6),t:'强化招 '+n+' 个（+'+Math.min(n*2,6)+'）'}:null}},
 {dim:'接力棒（接力体系）',w:1,j:function(s,c){return learnHasName(s,'接棒',c.learn)?{pts:2,t:'可学接棒（+2）'}:null}},
 {dim:'清场速度',w:2,j:function(s){var v=spdOf(s);
   if(v>=110)return{pts:4,t:'清场速度 '+v+'（+4）'};if(v>=95)return{pts:2,t:'速度 '+v+'（+2）'};
   return v<80?{pts:-2,t:'速度 '+v+' 偏慢（−2）'}:null}},
 {dim:'输出特性（ABI_TAGS out）',w:1,j:function(s,c){var o=[];
   c.names.forEach(function(n){var g=abiTagOf(n);if(g&&g.out)o.push(n)});
   return o.length?{pts:2,t:'输出特性 '+o.join('/')+'（+2）'}:null}},
 {dim:'先制/保命',w:1,j:function(s,c){var p=0,tx=[];
   if(hasAny(c.learn,[86,317,366,433])){p+=1;tx.push('先制/控速招')}
   if(learnHasName(s,'替身',c.learn)){p+=1;tx.push('替身')}
   return p?{pts:p,t:tx.join('/')+'（+'+p+'）'}:null}}],
/* ⑨ 吸血站场：吸取招 + 耐久 + 吸血/回复特性 */
'吸血':[
 {dim:'吸取招数量',w:2,j:function(s,c){var n=countLearnNames(s,SYS_MV_KEYS['吸血'],c.learn);
   return n?{pts:Math.min(n*2,6),t:'吸取招 '+n+' 个（+'+Math.min(n*2,6)+'）'}:null}},
 {dim:'耐久三角',w:2,j:function(s){var b=bulkOf(s);return b>=300?{pts:3,t:'耐久三角 '+b+'（+3）'}:null}},
 {dim:'吸血/回复特性',w:2,j:function(s,c){var hit=['再生力','毛皮大衣','多重鳞片','水泡','腐蚀','自然回复','食草'].filter(function(n){return c.names.indexOf(n)>-1});
   return hit.length?{pts:3,t:'站场特性 '+hit.join('/')+'（+3）'}:null}},
 {dim:'本系威力',w:1,j:function(s,c){var bp=Math.max(bestPowOf(s,'物理',c.conv),bestPowOf(s,'特殊',c.conv));
   return bp>=120?{pts:2,t:'本系折算 '+Math.round(bp)+'（+2）'}:null}}],
/* ⑩ 双天气（天气双核/双天气轮换）：两套天气手 + 两套受益者 */
'双天气':[
 {dim:'可开天气数（设置手）',w:3,j:function(s){var hit=['雨','晴','沙','雪'].filter(function(x){return isAbilSet(s,x)});
   if(hit.length)return{pts:4+Math.min(hit.length-1,1)*2,t:'出场开 '+hit.join('/')+'（+'+ (4+Math.min(hit.length-1,1)*2) +'）'};
   var n=['雨','晴','沙','雪'].filter(function(x){return isMvSet(s,x)}).length;
   return n?{pts:2,t:'可学天气招 '+n+' 套（+2）'}:null}},
 {dim:'体系受益（任一天气）',w:3,j:function(s,c){var hit=c.sys.filter(function(x){return ['晴','雨','沙','雪'].indexOf(x)>-1});
   return hit.length?{pts:3+(hit.length>1?2:0),t:'受益体系 '+hit.join('/')+(hit.length>1?'（双受益 +2）':'')}:null}},
 {dim:'属性本系匹配体系',w:1,j:function(s,c){var p=0;
   if((isType(s,'水')&&c.sys.indexOf('雨')>-1)||(isType(s,'火')&&c.sys.indexOf('晴')>-1)||(isType(s,'冰')&&c.sys.indexOf('雪')>-1)||(['岩石','钢','地面'].some(function(t){return isType(s,t)})&&c.sys.indexOf('沙')>-1))p+=2;
   return p?{pts:p,t:'本系匹配体系（+2）'}:null}}],
/* ⑪ 顺风游击：速度 + 恶作剧之心/疾风之翼 + 顺风/折返/先制 */
'顺风':[
 {dim:'速度',w:2,j:function(s){var v=spdOf(s);
   if(v>=110)return{pts:4,t:'速度 '+v+'（+4）'};return v>=95?{pts:2,t:'速度 '+v+'（+2）'}:null}},
 {dim:'顺风手特性',w:3,j:function(s,c){var hit=['恶作剧之心','疾风之翼','轻装'].filter(function(n){return c.names.indexOf(n)>-1});
   return hit.length?{pts:3,t:'顺风手特性 '+hit.join('/')+'（+3）'}:null}},
 {dim:'顺风/折返/先制招',w:1,j:function(s,c){var p=0,tx=[];
   if(learnHasName(s,'顺风',c.learn)){p+=2;tx.push('顺风')}
   if(hasAny(c.learn,FUNC_MV.pivot)){p+=2;tx.push('折返')}
   if(hasAny(c.learn,FUNC_MV.speed)){p+=1;tx.push('先制')}
   return p?{pts:Math.min(p,4),t:tx.join('/')+'（+'+Math.min(p,4)+'）'}:null}}],
/* ⑫ 通用兜底：无明确体系时的保守维度（沿用旧口径：受益 + 力度 + 联防） */
'通用':[
 {dim:'力度',w:1,j:function(s){var a=atkBest(s);if(a>=120)return{pts:3,t:'力度 '+a+'（+3）'};return a>=95?{pts:1,t:'力度 '+a+'（+1）'}:null}},
 {dim:'耐久',w:1,j:function(s){return bulkOf(s)>=300?{pts:2,t:'耐久三角 '+bulkOf(s)+'（+2）'}:null}},
 {dim:'输出特性',w:1,j:function(s,c){var o=[];c.names.forEach(function(n){var g=abiTagOf(n);if(g&&g.out)o.push(n)});
   return o.length?{pts:2,t:'输出特性 '+o.join('/')+'（+2）'}:null}}],
};
/* 共享维度：侧向分工（本方流派联防）—— 所有体系共用；模板场景无 side，判 0 不参与
   （物理侧看物防/威吓；特殊侧看特防——用户 ⑤ 反馈「推荐队友按流派区分」保留为固定维度） */
var SIDE_DIM={dim:'侧向分工（本方流派联防）',w:2,j:function(s,c){
  if(c.side==='物理'){
    if(bstI(s,2)>=110)return{pts:2,t:'物理联防（防御'+bstI(s,2)+'）'};
    if((c.names||[]).indexOf('威吓')>-1)return{pts:2,t:'威吓削物攻'};
    return null;
  }
  if(c.side==='特殊'){
    if(bstI(s,4)>=110)return{pts:2,t:'特殊联防（特防'+bstI(s,4)+'）'};
    return null;
  }
  return null;
}};
Object.keys(SYS_DIMS).forEach(function(a){SYS_DIMS[a].push(SIDE_DIM)});
/* 天气体系标签（v4.2 起**不再用于硬互斥**，仅用于体系识别/展示）：
   - 用户裁定（v4.2）：「推荐逻辑必须从反向淘汰个体改为正向体系构建」——对立的天气体系不再排除候选，
     由体系维度分自然排后（班吉拉斯/庞岩怪在纯晴队天气手/打手槽受益分低 → 排后，不硬剔除）。
   - 原 `wxSetOf` / `wxConflict` 两个函数已按裁定删除（调用点亦删）。 */
var WX_SYS=['晴','雨','沙','雪'];
/* 强化招：体系化招式权重（pickAttacks 打分用；值为乘数，1=中性） */
var SYS_MV_ADJ={
 '空间':{'陀螺球':1.25,'重磅冲撞':1.25,'地震':1.05},
 '晴':{'生长':1.15,'日光束':1.15,'喷射火焰':1.1,'热风':1.1,'大字火':1.1,'喷火':1.1},
 '雨':{'冲浪':1.15,'水炮':1.15,'打雷':1.15,'暴风':1.15,'热水':1.1},
 '沙':{'岩崩':1.1,'尖石攻击':1.1,'地震':1.1},
 '雪':{'暴风雪':1.2,'冰冻光束':1.1,'冰柱坠击':1.1},
 '强化':{'剑舞':1.1,'龙之舞':1.1,'诡计':1.1,'蝶舞':1.1},
 '吸血':{'终极吸取':1.15,'吸取拳':1.15,'吸血':1.15,'吸取之吻':1.15},
 '顺风':{'顺风':1.1,'神速':1.1,'突袭':1.1},
 '受':{'剧毒':1.15,'隐形岩':1.1,'撒菱':1.1,'毒菱':1.1}
};
/* 体系识别：模板 */
function archOfTpl(t){
  var n=String(t.name||'')+String(t.theme||'');
  if(/空间/.test(n))return '空间';
  if(/双天气|天气双核/.test(n))return '双天气';
  if(/顺风/.test(n))return '顺风';
  if(/受队|钉子|消耗队/.test(n))return '受';
  if(/吸血/.test(n))return '吸血';
  if(/强化/.test(n))return '强化';
  if(/场地/.test(n))return '场地';
  if(/沙暴|沙/.test(n))return '沙';
  if(/雪/.test(n))return '雪';
  if(/雨/.test(n))return '雨';
  if(/晴/.test(n))return '晴';
  return '通用';
}
/* 体系识别：精灵（核心配队队友推荐用；与模板共用同一张维度表） */
function archOfSp(s,side,roleTag){
  var learn=learnOf(s);
  if(learnHasName(s,'戏法空间',learn)||/空间/.test(roleTag||''))return '空间';
  var sys=coreSys(s),wx=sys.filter(function(x){return ['晴','雨','沙','雪'].indexOf(x)>-1});
  if(wx.length)return wx[0];
  if(sys.filter(function(x){return /场地/.test(x)}).length)return '场地';
  if(roleTag==='肉盾'||roleTag==='受队'||/肉盾/.test(coreRole(s).role))return '受';
  if(countLearnNames(s,['剑舞','龙之舞','诡计','蝶舞','破壳','自我激励','生长'],learn))return '强化';
  return '通用';
}
/* 体系打分：返回 {total, dims[], drop, dropWhy}；dims 逐维度列分（可解释）
   v4.2：drop 机制**已停用**（用户裁定：推荐逻辑改正向体系构建，不做反向淘汰）——
   字段保留但恒为 false，仅为兼容既有调用方/断言；不再有 −999 否决。 */
function sysScore(s,arch,ctx){
  ctx=ctx||{};
  if(!ctx.learn)ctx.learn=learnOf(s);
  if(!ctx.conv)ctx.conv=convOf(s);
  if(!ctx.sys)ctx.sys=spSys(s);
  if(!ctx.names)ctx.names=(s.abis||[]).concat(s.inns||[]);
  var tb=SYS_DIMS[arch]||SYS_DIMS['通用'],total=0,dims=[];
  tb.forEach(function(d){
    var r=null;try{r=d.j(s,ctx)}catch(e){r=null}
    if(!r)return;
    var pts=(r.pts||0)*(d.w||1);
    total+=pts;
    dims.push({dim:d.dim,w:d.w,pts:pts,txt:r.t,drop:false});
  });
  return {total:total,dims:dims,drop:false,dropWhy:'',arch:arch};
}
/* 体系 → 该体系维度权重表文本（写进模板卡/报告） */
function sysTable(arch){
  return (SYS_DIMS[arch]||SYS_DIMS['通用']).map(function(d){return {dim:d.dim,w:d.w,arch:arch}});
}
/* 维度判定口径文案（UI 表格第三列；与 SYS_DIMS 的 j() 实现一一对应） */
var SYS_DIM_RULE={
'空间':{'速度适配（越低越优）':'≤60 → +6；61~85 → +3；>85 → −6（低分排后，仍可入选）',
  '力度（物/特攻种族）':'≥130 → +5；≥110 → +3；≥95 → +1；<95 → −2',
  '本系折算威力':'≥150 → +3；≥120 → +2；≥100 → +1',
  '空间受益要素（低速招/特性）':'陀螺球/重磅冲撞 各 +2（上限 +4）；慢出/迟钝/硬爪/大力士 等 +2',
  '与队友速度互补':'与核心速度差 ≥25 → +1（有核心时才计入）'},
'晴':{'速度（速攻位）':'≥110 → +5；≥95 → +3；≥80 → +1；<80 → −2（仅速攻型模板）',
  '体系受益特性 / 天气手':'命中晴体系受益特性（叶绿素/太阳之力等）→ +4',
  '出场开天气（设置手）':'出场开晴 → +4；可学大晴天 → +2',
  '天气受益招/强化招':'生长/日光束/火招等，每个 +1（上限 +3；生长=晴双倍强化）',
  '本系高威力（火/草）':'火/草本系折算 ≥120 → +2；≥100 → +1',
  '力度门（速攻≥95）':'≥110 → +2；<95 → −3'},
'雨':{'速度（速攻位）':'≥110 → +5；≥95 → +3；≥80 → +1；<80 → −2（仅速攻型模板）',
  '体系受益特性（悠游自如/雨盘/干燥皮肤）':'命中雨体系受益特性 → +4',
  '出场开雨（设置手）':'出场开雨 → +4；可学求雨 → +2',
  '天气受益招（水炮/冲浪/打雷/暴风）':'每个 +1（上限 +3）',
  '本系高威力（水）':'水系本系折算 ≥120 → +2；≥100 → +1',
  '力度门（速攻≥95）':'≥110 → +2；<95 → −3'},
'沙':{'岩石/钢/地面本系':'每系 +3（上限 +6）',
  '沙暴受益特性（沙隐/沙之力/拨沙）':'受益/出场开沙暴 → +4；可学沙暴 → +2',
  '岩石系特防×1.5 受益':'岩石系 → +1',
  '低速站场':'≤70 → +2；≥100 → −2',
  '力度/耐久':'力度 ≥110 → +2；否则耐久三角 ≥300 → +2'},
'雪':{'冰系本系':'冰系 → +3',
  '雪天受益特性（雪隐/冰冻之躯/拨雪）':'受益/出场开雪 → +4；可学冰雹 → +2',
  '冰冻类招（暴风雪必中）':'暴风雪/冰冻光束/冰柱坠击 每个 +1（上限 +3）',
  '耐久/极光幕':'耐久三角 ≥300 → +2；可学极光幕 → +2'},
'场地':{'场地设置手（出场开场地）':'出场开场地 → +5；可学场地招 → +2',
  '场地受益特性':'发电机/电晶体/青草制造者 等 → +3',
  '场地受益属性本系':'电/超能力/草/妖精 → +2',
  '场地输出招':'十万伏特/精神强念/青草滑梯/魔法闪耀 每个 +1（上限 +2）'},
'受':{'耐久三角（HP+防+特防）':'≥340 → +5；≥300 → +3；<280 → −2',
  '回复招（自我再生/羽栖等）':'有回复招 → +3',
  '钉子/剧毒/除钉':'钉子/剧毒/除钉 各 +2',
  '联防价值（免疫/抵抗模板弱点）':'免疫弱点 +2、抵抗 +1（上限 +4）',
  '不推脆皮炮台':'力度 ≥115 且耐久三角 <290 → −2'},
'强化':{'强化招数量':'剑舞/龙舞/诡计/蝶舞/破壳 等，每个 +2（上限 +6）',
  '接力棒（接力体系）':'可学接棒 → +2',
  '清场速度':'≥110 → +4；≥95 → +2；<80 → −2',
  '输出特性（ABI_TAGS out）':'带 out 标签特性 → +2',
  '先制/保命':'先制/控速招 +1；替身 +1'},
'吸血':{'吸取招数量':'终极吸取/吸取拳/吸血/吸取之吻/吸取力量/寄生种子，每个 +2（上限 +6）',
  '耐久三角':'≥300 → +3',
  '吸血/回复特性':'再生力/毛皮大衣/多重鳞片/水泡/腐蚀 等 → +3',
  '本系威力':'本系折算 ≥120 → +2'},
'双天气':{'可开天气数（设置手）':'出场开 1 套 → +4；两套 → +6；可学天气招 → +2',
  '体系受益（任一天气）':'受益 1 套 → +3；双受益 → +5',
  '属性本系匹配体系':'水↔雨 / 火↔晴 / 冰↔雪 / 岩钢地↔沙 → +2'},
'顺风':{'速度':'≥110 → +4；≥95 → +2',
  '顺风手特性':'恶作剧之心/疾风之翼/轻装 → +3',
  '顺风/折返/先制招':'顺风/折返 各 +2、先制 +1（上限 +4）'},
'通用':{'力度':'≥120 → +3；≥95 → +1',
  '耐久':'耐久三角 ≥300 → +2',
  '输出特性':'带 out 标签特性 → +2'}
};
/* 共享维度判定口径（所有体系通用，见 SIDE_DIM） */
var SYS_RULE_SHARED={'侧向分工（本方流派联防）':'物理侧：防御 ≥110 → +2（或威吓 → +2）；特殊侧：特防 ≥110 → +2；模板场景无 side 不计入'};
function sysDimRule(arch,dim){
  var a=SYS_DIM_RULE[arch];
  return (a&&a[dim])||SYS_RULE_SHARED[dim]||'按维度权重表逐项判定（详见交付报告《v4.x 推荐评分体系化》）';
}
/* 体系化招式权重（1=中性） */
function sysMvAdj(s,id,arch){
  var t=SYS_MV_ADJ[arch];if(!t)return {mul:1,name:''};
  var nm=(MV[id]&&MV[id][1])||'';
  return t[nm]?{mul:t[nm],name:nm}:{mul:1,name:''};
}
/* v4.x G⑫ + 用户深度反馈：模板推荐评分 = 组件匹配 + 体系维度权重表（archOfTpl → SYS_DIMS）
   旧口径（SYS_MAP +3 / 出场开体系 +4 / 力度 +1~2 / 联防 +1~2）已并入各体系维度表；
   v4.2 起不再有 drop 硬排除（drop/dropWhy 字段保留但恒 false/空串，仅为兼容既有调用方与断言）。 */
function tplScore(s,t){
  var base=matchTpl(s,t);
  var why=base.abis.slice().concat(base.moves.map(function(x){return x+'可学'})).concat(base.types.map(function(x){return x+'系'}));
  var arch=archOfTpl(t),sys=tplSys(t).filter(function(x){return x!=='剧毒场地'});
  var speedFocus=/速攻|特攻|游击|输出/.test(String(t.name||'')+String(t.theme||''));
  var counters=(t.counters&&t.counters.types)||[];
  var ctx={conv:convOf(s),learn:learnOf(s),sys:spSys(s),names:(s.abis||[]).concat(s.inns||[]),speedFocus:speedFocus,counters:counters};
  var r=sysScore(s,arch,ctx);
  var score=base.score*1.0+r.total;   /* 组件匹配保留（小权重：可学招/属性命中）+ 体系维度总分 */
  r.dims.forEach(function(d){if(d.pts)why.push(d.txt)});
  return {score:score,why:why,abis:base.abis,moves:base.moves,types:base.types,sys:sys,arch:arch,dims:r.dims,drop:r.drop,dropWhy:r.dropWhy};
}
/* 模板匹配分：match.abis 特性（可选+天性命中均+2）/ match.moves 可学招（+1）/ match.types 属性（+1） */
function matchTpl(s,t){
  var m=t.match||{},score=0,abis=[],moves=[],types=[];
  (m.abis||[]).forEach(function(a){
    if(s.abis.indexOf(a)>-1||s.inns.indexOf(a)>-1){score+=2;abis.push(a)}
  });
  var seen={};
  s.lv.forEach(function(p){seen[p[1]]=true});
  s.tut.forEach(function(x){seen[x]=true});
  (m.moves||[]).forEach(function(n){
    var id=mvIdByZhOrEn(n);
    if(id!==null&&seen[id]){score+=1;moves.push(n)}
  });
  (m.types||[]).forEach(function(ty){
    if(s.t1===ty||s.t2===ty){score+=1;types.push(ty)}
  });
  return {score:score,abis:abis,moves:moves,types:types};
}
/* 模板推荐宝可梦 Top 6（v4.x：体系维度表打分 + 体系模板只推受益者/天气手 + 速攻力度门 + 家族去重） */
function tplRecs(t){
  if(t&&t._recs)return t._recs;   /* D5：模板卡缩略图与展开明细共用结果，按模板对象缓存（不依赖队伍） */
  var sys=tplSys(t).filter(function(x){return x!=='剧毒场地'});
  var arch=archOfTpl(t);
  /* v4.2（用户裁定 · 正向体系构建）：删「力度门」硬过滤、删 `wxConflict` 体系硬互斥、删 drop 排除、
     删 `score>0` 隐性门槛 —— 内部评分通道改为「体系主题榜 = 能为该体系作贡献者（受益特性 or 设置手）」，
     这是**正向主题定义**（谁进这个榜），而非反向剔除个体；非体系相关个体不进**体系主题榜**，
     但会在 `buildTeam` 的补盲/联防/功能槽位中被正常推荐（见 buildTeam）。 */
  function collect(){
    var out=[];
    ERDATA.species.forEach(function(s){
      if(!isFinalForm(s)&&!evioOk(s))return; /* v4.3.1：非最终形态若具奇石优势则计入推荐 */
      if(!isValidSp(s))return; /* B7：占位/无效物种（base 全 0，如 2502）过滤 */
      if(sys.length){
        var ben=sys.some(function(x){return spSys(s).indexOf(x)>-1||isSetter(s,x)});
        if(!ben)return; /* 体系主题榜正向定义：非本体系受益/设置手不进榜（非评分扣分） */
      }
      var r=tplScore(s,t);
      out.push({s:s,score:r.score,hits:r.why,sys:r.sys,arch:r.arch,dims:r.dims});
    });
    out.sort(function(a,b){return b.score-a.score});
    return out;
  }
  var raw=collect();
  /* ⑥-2 家族去重 + D8 名称前缀去重（阿尔宙斯多形态/银伴战兽多形态只留最高分） */
  var seen={},fin=[];
  raw.forEach(function(o){var k=famKey(o.s);if(seen[k])return;seen[k]=1;fin.push(o)});
  var seen2={},fin2=[];
  fin.forEach(function(o){
    var k=prefixKey(o.s);
    if(seen2[k]){if(seen2[k].collapsed===undefined)seen2[k].collapsed=1;seen2[k].collapsed++;return}
    seen2[k]=o;fin2.push(o);
  });
  var top=fin2.slice(0,6);
  /* 数组挂属性：把体系回传给 UI（不改函数签名/调用方，兼容既有断言）；v4.2 起无 drops（不再有排除面板） */
  top.arch=arch;
  t._recs=top;
  return top;
}
/* 当前队伍与模板体检 */
function tplAudit(t){
  var foundAbis=[],foundMoves=[],foundTypes=[];
  team.forEach(function(s){
    var m=matchTpl(s,t);
    foundAbis=foundAbis.concat(m.abis);
    foundMoves=foundMoves.concat(m.moves);
    foundTypes=foundTypes.concat(m.types);
  });
  var missing=[];
  (t.match&&t.match.abis||[]).forEach(function(a){if(foundAbis.indexOf(a)<0)missing.push('特性 '+a)});
  (t.match&&t.match.moves||[]).forEach(function(mv){if(foundMoves.indexOf(mv)<0)missing.push('招式 '+mv)});
  (t.match&&t.match.types||[]).forEach(function(ty){if(foundTypes.indexOf(ty)<0)missing.push('属性 '+ty)});
  var html='';
  if(missing.length)html+='<div class="tip" style="background:#fce4ec;border-color:var(--bad)">⚠️ 缺核心组件：'+esc(missing.join('，'))+' —— 补位后队伍才成型（可点上方推荐宝可梦入队）</div>';
  else html+='<div class="tip" style="background:#e8f5e9;border-color:var(--ok);color:#14532d">✅ 核心组件已覆盖，当前队伍符合该模板骨架</div>';
  return html;
}
/* 模板卡展开主体（动态渲染，含推荐/体检/天敌/流程） */
/* v4.3.1：模板道具「进化奇石」展示层过滤 —— 该模板推荐（tplRecs）里只要还有可进化形态，则奇石保留（有效）；
   全部为最终形态 → 返回 true（UI 标「不适用」，不展示为可选项）。数据层源修正登记待数据层。 */
function tplItemNoEvio(i){
  try{
    var t=tplAll()[i],recs=tplRecs(t)||[];
    if(!recs.length)return false;
    return recs.every(function(r){return isFinalForm(r.s)});
  }catch(e){return false}
}
function renderTplBody(i){
  var t=tplAll()[i],b=$('tplBody'+i);
  if(!b)return;
  var html='';
  html+='<div class="sec"><h3>核心组件（点击可跳转反查）</h3><div style="line-height:28px">';
  t.keys.forEach(function(k){
    var kind=k[0],name=k[1];
    if(kind==='特性')html+='<span class="abi" onclick="event.stopPropagation();gotoAbi('+jsl(name)+')">'+esc(name)+'</span>';
    else if(kind==='招式')html+='<span class="abi" onclick="event.stopPropagation();gotoMv('+jsl(name)+')">'+esc(name)+'</span>';
    else if(kind==='道具'){
      /* v4.3.1：数据层模板未限定道具（源 build_tool_data.py:556 [道具]进化奇石）→ 展示层按 ER 口径降级：
         奇石仅对「可进化」形态生效；该模板推荐全部为最终形态时标「不适用」，否则加限定说明 */
      var na=(name==='进化奇石')&&tplItemNoEvio(i);
      if(na)html+='<span class="abi" style="opacity:.55;text-decoration:line-through" title="进化奇石仅对未完全进化（CanEvolve）者生效；该模板推荐均为最终形态 → 不适用">'+esc(name)+'（不适用）</span>';
      else html+='<span class="abi" onclick="event.stopPropagation();gotoItem('+jsl(name)+')">'+esc(name)+'</span>'+
        (name==='进化奇石'?'<i style="font-size:10px;color:var(--sub)">（仅未完全进化者生效）</i>':'');
    }
  });
  html+='</div></div>';
  /* 开局流程 */
  if(t.flow&&t.flow.length){
    html+='<div class="sec"><h3>开局流程</h3><div style="font-size:12px;line-height:1.9">';
    /* B8：开局流程同样过 wxTip（流程文案含「场地内 +30%」等旧写死值，须改写为 WCONF 口径 + 待实测徽标） */
    t.flow.forEach(function(f,j){html+='<div>'+'<b style="color:var(--accent)">'+(j+1)+'.</b> '+wxTip(f)+'</div>'});
    html+='</div></div>';
  }
  /* 推荐宝可梦（v4.x 体系化：archOfTpl → 该体系「维度权重表」打分；drop 项单独列示） */
  var recs=tplRecs(t),tSys=tplSys(t).filter(function(x){return x!=='剧毒场地'}),tArch=recs.arch||archOfTpl(t);
  html+='<div class="sec"><h3>推荐宝可梦（按体系维度分 Top 6，点击入队）</h3>';
  html+='<div class="mini" style="color:var(--sub)">评分体系：<b>'+esc(tArch)+'</b> —— 维度权重表见下方「评分维度」；每只候选按维度逐项加减分（悬停看逐维度明细），家族去重保留最高形态。</div>';
  if(recs.length){
    html+='<div class="mxgrid">';
    recs.forEach(function(r){
      var main=(r.hits||[]).filter(function(x){return /（[+−]\d+）/.test(x)}).slice(0,3);
      html+='<div class="mxc" onclick="event.stopPropagation();tplAdd('+i+','+r.s.id+')" title="'+escq((r.hits||[]).slice(0,5).join('，'))+'">'+
        sprRaw(r.s.id)+
        '<div class="mcnm">'+esc(r.s.zh)+'</div><div class="mcx">'+r.score+'分'+(r.collapsed?(' · +'+r.collapsed+'形态'):'')+'</div>'+
        (main.length?'<div class="mcx" style="color:var(--sub);font-size:10px;line-height:1.3">'+esc(main[0])+'</div>':'')+'</div>';
    });
    html+='</div><div style="font-size:11px;color:var(--sub);margin-top:4px">卡片下小字=首要维度得分项；悬停看完整维度明细；点击卡片直接入队（最多 6 只）</div>';
  }else html+='<div class="tip">该模板核心组件在 ER 图鉴中暂无高匹配宝可梦</div>';
  /* v4.2：原「已排除（维度表硬否决）」红框已按用户裁定删除——推荐逻辑改正向体系构建，不再有排除面板 */
  html+='</div>';
  /* v4.2：该模板的完整队伍方案（槽位骨架 + 逐槽位正向评分 Top1-3；锚 = 本模板 Top1 候选） */
  if(recs.length)html+=renderNeedPlan(recs[0].s);
  /* 评分维度权重表（体系化：维度 / 权重 / 判定口径，可解释） */
  html+='<div class="sec"><h3>评分维度（'+esc(tArch)+' 体系维度权重表）</h3><div class="scroll"><table class="tbl" style="font-size:12px">'+
    '<thead><tr><th>维度</th><th>权重</th><th>判定口径</th></tr></thead><tbody>';
  sysTable(tArch).forEach(function(d){
    html+='<tr><td>'+esc(d.dim)+'</td><td>×'+d.w+'</td><td style="color:var(--sub);font-size:11px">'+esc(sysDimRule(tArch,d.dim))+'</td></tr>';
  });
  html+='</tbody></table></div>';
  html+='<details class="inline"><summary>前 3 名逐维度得分明细</summary>'+(recs.slice(0,3).map(function(r){
    return '<div style="font-size:11px;line-height:1.7;margin-top:4px"><b>'+esc(r.s.zh)+'（'+r.score+'分）</b><br>'+
      (r.dims||[]).filter(function(d){return d.pts}).map(function(d){return '· '+esc(d.txt)}).join('<br>')+'</div>';
  }).join('')||'<div style="color:var(--sub)">（无）</div>')+'</details>';
  html+='</div>';
  /* 当前队伍体检 */
  if(team.length)html+='<div class="sec"><h3>当前队伍体检</h3>'+tplAudit(t)+'</div>';
  /* 天敌警示 */
  if(t.counters){
    var c=t.counters;
    html+='<div class="sec"><h3>模板天敌警示</h3><div class="tip" style="background:#fff3e0;border-color:#d97706">怕属性：'+
      (c.types||[]).map(tlabel).join(' ')+'　｜　核心招式可能被特性免疫：'+esc((c.abis||[]).join('、')||'（无）')+
      '</div></div>';
  }
  /* ER 调整说明（B8：数值文案统一改读 WCONF，删除写死的 20%/30%/8回合/无限天气旧文案） */
  html+='<div class="sec"><h3>ER 调整说明</h3>'+
    '<div class="tip" style="background:#e3f2fd;border-color:var(--accent)"><b>机制数值（读 WCONF 口径表）：</b><br>'+wxNums()+'<br>'+terrainNums()+'</div>';
  t.tips.forEach(function(tp){html+='<div class="tip">'+wxTip(tp)+'</div>'});
  html+='</div>';
  b.innerHTML=html;
}
function renderTpl(){
  var box=$('tplList');var html='';
  var all=tplAll(),dn=tplDataCount();
  html+='<div class="tip">模板总数 <b>'+all.length+'</b>（数据层 '+dn+' 套'+(all.length>dn?(' + 引擎侧兜底 '+(all.length-dn)+' 套'):'')+'）· '+esc(v4ContractNote())+'</div>';
  all.forEach(function(t,i){
    var sys=tplSys(t).filter(function(x){return x!=='剧毒场地'});
    html+='<div class="tplcard" id="tpl'+i+'" onclick="toggleTpl('+i+')">';
    html+='<h3>'+esc(t.name)+'</h3><div class="theme">'+esc(t.theme)+'</div>';
    if(sys.length)html+='<div style="margin:2px 0">'+sys.map(function(x){return '<span class="tagline">体系 '+esc(x)+'</span>'}).join('')+(i>=dn?'<span class="tagline">引擎侧兜底</span>':'')+'</div>';
    else if(i>=dn)html+='<div style="margin:2px 0"><span class="tagline">引擎侧兜底</span></div>';
    html+='<div style="font-size:12px;color:var(--sub);margin-bottom:4px">角色分工：'+esc(t.roles.join(' · '))+'</div>';
    /* D5：模板卡带精灵图（延迟填充，避免首屏卡顿） */
    html+='<div class="tplthumb" id="tplThumb'+i+'"></div>';
    html+='<div id="tplBody'+i+'" style="display:none"></div>';
    html+='</div>';
  });
  box.innerHTML=html;
  /* D5：异步逐张填充 Top3 缩略图（不阻塞首屏渲染） */
  (function(){
    var q=all.map(function(t,i){return i});
    function step(){
      var i=q.shift();
      if(i===undefined)return;
      var el=$('tplThumb'+i);
      if(el){
        try{
          var rs=tplRecs(all[i]);
          if(rs.length)el.innerHTML=rs.slice(0,3).map(function(r){return sprRaw(r.s.id)}).join('')+
            '<span class="mini" style="color:var(--sub)">Top：'+rs.slice(0,3).map(function(r){return esc(r.s.zh)}).join(' / ')+'</span>';
        }catch(e){}
      }
      setTimeout(step,0);
    }
    setTimeout(step,0);
  })();
}
function toggleTpl(i){
  var c=$('tpl'+i),b=$('tplBody'+i);
  var open=b.style.display!=='none';
  if(!open)renderTplBody(i);
  b.style.display=open?'none':'block';
  c.classList.toggle('open',!open);
}
/* 模板推荐入队 + 刷新体检 */
function tplAdd(i,id){
  var s=null;
  ERDATA.species.forEach(function(x){if(x.id==id)s=x});
  if(!s)return;
  addToTeam(s,null);
  renderTplBody(i);
}
function gotoMv(name){
  $('mvSearch').value=name;renderMv();switchTab('move');
}
function gotoItem(name){
  var id=itemByZhOrEn(name),it=ITM[id];
  toast('【'+name+'】\n'+(it?it[3]||'(无描述)':'（未收录）'));
}

/* ============ 核心配队（选定核心 → 定位/配招/性格/队友） ============ */
var NATURES={
  '固执':['+攻击','-特攻'],'爽朗':['+速度','-特攻'],'胆小':['+速度','-攻击'],'内敛':['+特攻','-攻击'],
  '大胆':['+防御','-攻击'],'沉着':['+特防','-攻击'],'淘气':['+防御','-特攻'],'慎重':['+特防','-特攻'],
  '勇敢':['+攻击','-速度'],'冷静':['+特攻','-速度'],'悠闲':['+防御','-速度'],'狂妄':['+特防','-速度'],
  '怕寂寞':['+攻击','-防御'],'顽皮':['+攻击','-特防'],'急躁':['+速度','-防御'],'天真':['+速度','-特防'],
  '温和':['+特攻','-防御'],'马虎':['+特攻','-特防'],'温顺':['+特防','-防御'],'乐天':['+防御','-特防'],
  '认真':['全平衡'],'勤奋':['全平衡'],'坦率':['全平衡'],'害羞':['全平衡'],'浮躁':['全平衡']
};
var SYS_MAP={'降雨':'雨','雨幕':'雨','悠游自如':'雨','雨盘':'雨','干燥皮肤':'雨','日照':'晴','大叶子':'晴','叶绿素':'晴','太阳之力':'晴',
  '扬沙':'沙','拨沙':'沙','沙之力':'沙','沙隐':'沙','降雪':'雪','拨雪':'雪','冰冻之躯':'雪',
  '电气制造者':'电场','发电机':'电场','精神制造者':'精神场地','青草制造者':'青草场地','薄雾制造者':'薄雾场地'};
var SYS_SET={'降雨':'雨','雨幕':'雨','日照':'晴','扬沙':'沙','降雪':'雪','电气制造者':'电场','精神制造者':'精神场地','青草制造者':'青草场地','薄雾制造者':'薄雾场地'};
/* v4.2（用户指令「Toxic Surge(834) 补进 SYS_SET，若数据层字段已有则引擎消费」）：
   数据层 `ERDATA.sysSet`（天气/场地设置手 id 白名单）= [2,45,70,117,226,227,228,229,584,604,834,989]，
   其中 834 = Toxic Surge（毒沼制造者）⇒ 入场铺「剧毒场地」。
   07 方法论 §1.3 记「剧毒场地设置手 Toxic Surge(834) 不在 SYS_SET 9 条内」——本行即补登。
   其余新增 id（584/604/989）属 ER 新增设置手，其体系归属须读各自 desc 判定，不能仅凭 id 推断 ⇒ 不擅自补登。 */
(function(){
  try{ if((ERDATA.sysSet||[]).indexOf(834)>-1) SYS_SET['毒沼制造者']='剧毒场地'; }catch(e){}
})();
/* v4.2 修复（别名/英文感知的体系查表）：数据层物种表沿用 v0.3 译名，同一特性存在别名（如「干旱」= 日照/70，
   「水合」「鸟群」「华贵之鸟」等同理），直接 SYS_MAP[name] / SYS_SET[name] 会漏判 ⇒ 统一经 abiIdByZhOrEn
   归一为特性 id 后查「id 口径镜像表」。体系归属真值源仍是 SYS_MAP / SYS_SET，仅把"怎么查"改为别名安全。
   影响：coreSys / coreRole / isAbilSet / tplSys / sysSetterName / coreAbiPick 等（天气手识别不再漏「干旱」型天性）。*/
var SYS_ID_MAP=null,SET_ID_MAP=null,ABI_ID_CACHE={};
function abiIdC(n){
  if(Object.prototype.hasOwnProperty.call(ABI_ID_CACHE,n))return ABI_ID_CACHE[n];
  var id=abiIdByZhOrEn(n);ABI_ID_CACHE[n]=id;return id;
}
function sysIdMapsInit(){
  if(SYS_ID_MAP)return;
  SYS_ID_MAP={};SET_ID_MAP={};
  var n,i;
  for(n in SYS_MAP){i=abiIdC(n);if(i)SYS_ID_MAP[i]=SYS_MAP[n]}
  for(n in SYS_SET){i=abiIdC(n);if(i)SET_ID_MAP[i]=SYS_SET[n]}
}
function abiSysOf(n){sysIdMapsInit();var id=abiIdC(n),v=id?SYS_ID_MAP[id]:null;return v||SYS_MAP[n]||null}
function abiSetOf(n){sysIdMapsInit();var id=abiIdC(n),v=id?SET_ID_MAP[id]:null;return v||SYS_SET[n]||null}
function abiSame(a,b){if(a===b)return true;var ia=abiIdC(a),ib=abiIdC(b);return !!(ia&&ib&&ia===ib)}
function anyAbiId(s,n){return (s.abis||[]).concat(s.inns||[]).some(function(x){return abiSame(x,n)})}
var WEATHER_MV={240:'雨',241:'晴',201:'沙',258:'雪',604:'电场',641:'精神场地',580:'青草场地',581:'薄雾场地'};
var FUNC_MV={
  rec:[105,202,234,235,236,303,355,409],
  boost:[14,187,334,339,347,349,417,468,483,504,526],
  /* 强化招按物/特分侧：剑舞/腹鼓/铁壁/健美/龙舞/磨爪/破壳/自我激励=物理侧；冥想/诡计/蝶舞=特殊侧 */
  boostPhys:[14,187,334,339,349,468,504,526],
  boostSpec:[347,417,483],
  hazard:[191,390,446,564],   /* B6：补 564 黏黏网（Sticky Web，数据层中文名「黏黏网」，规格原文写「粘网」） */
  removal:[229,432],          /* B6：229=高速旋转（清自身侧）／432=清除浓雾（清双方钉子、墙仅对手侧、降闪避 1 级）——勿写反；权重 0（口径表未给权重，仅展示） */
  speed:[86,317,366,433],
  protect:[164,182],
  pivot:[369,521],
  wear:[73,92],
  weather:[201,240,241,258,580,581,604,641]
};
/* 功能招标签（pickFuncs / buildMoves 展示用） */
var MV_TAGS={weather:'天气',boost:'强化',hazard:'钉子',control:'控速',rec:'回复',protect:'保命',break:'破受',removal:'除钉',pivot:'游击',wear:'消耗'};
/* B9 分层3 funcAdj：功能招按定位权重（规格 v1.0 B9 权重表）；removal 口径表未给权重 → 0（仅展示不参与选择；2026-10-06 除钉范围定稿不改权重） */
function funcWeight(s,role,cat){
  var r=role||'',tags=coreTags(s);
  var W={weather:0,boost:0,hazard:0,control:0,rec:0,protect:0,break:0,removal:0,pivot:0,wear:0};
  if(r.indexOf('设置手')>-1){W.weather+=40;W.control+=25;W.hazard+=25;W.protect+=15;W.rec+=20}
  else if(r.indexOf('天气')>-1){W.weather+=40;W.boost+=30;W.control+=25;W.protect+=15;W.rec+=20}
  else if(r.indexOf('肉盾')>-1||r.indexOf('受')>-1){W.rec+=20;W.hazard+=25;W.protect+=15;W.control+=25}
  else if(r.indexOf('速攻')>-1){W.pivot+=20;W.control+=25;W.protect+=15;W.boost+=30}
  else{W.boost+=30;W.rec+=20;W.control+=25;W.protect+=15;W.hazard+=25}
  if(tags.indexOf('站场强化')>-1)W.boost+=30;
  if(tags.indexOf('破受清场')>-1)W.break+=20;
  if(tags.indexOf('铺场清场')>-1)W.hazard+=25;
  if(cat==='removal')W.removal=0;
  return W[cat]||0;
}
/* B9 分层2+3：功能招候选（按定位权重打分 + lDesc 代价），每类返回最优一条 */
function pickFuncs(s,role,side,used){
  var learn=learnOf(s),hasRec=hasAny(learn,FUNC_MV.rec),res={};
  var boostIds=(side==='特殊'?FUNC_MV.boostSpec:(side==='物理'?FUNC_MV.boostPhys:FUNC_MV.boost)).concat([504,526]);
  var cats={weather:FUNC_MV.weather,boost:boostIds,hazard:FUNC_MV.hazard,control:FUNC_MV.speed,rec:FUNC_MV.rec,
    protect:FUNC_MV.protect,break:[73,92,1025,432],removal:FUNC_MV.removal,pivot:FUNC_MV.pivot,wear:FUNC_MV.wear};
  Object.keys(cats).forEach(function(cat){
    var best=null;
    cats[cat].forEach(function(id){
      if(learn.indexOf(id)<0)return;
      if(used&&used.indexOf(id)>-1)return;
      var m=MV[id];if(!m)return;
      var w=funcWeight(s,role,cat),c=costOf(s,m,hasRec),sc=w*c.mul;
      var why=['定位权重 +'+w];
      if(cat==='weather'){
        var sy=WEATHER_MV[id];why.push((sy||'')+'天气/场地招');
        if(sy&&coreSys(s).indexOf(sy)<0){sc*=0.3;why.push('非本体系×0.3')}
      }
      if(cat==='removal')why.push('除钉：229 高速旋转清自身侧／432 清除浓雾清双方钉子+墙仅对手侧+降闪避 1 级（定稿：已按游戏源码核对 + 用户确认）');
      c.tags.forEach(function(x){why.push(x)});
      if(c.note)why.push(c.note);
      if(!best||sc>best.score)best={id:id,cat:cat,score:sc,why:why,w:w};
    });
    if(best)res[cat]=best;
  });
  return res;
}
var optFinalOnly=true; /* 全局开关：推荐与列表是否仅显示最终形态（默认开） */
function learnOf(s){var o={};s.lv.forEach(function(p){o[p[1]]=true});s.tut.forEach(function(m){o[m]=true});return Object.keys(o).map(Number)}
function hasMv(learn,ids){for(var i=0;i<ids.length;i++)if(learn.indexOf(ids[i])>-1)return ids[i];return null}
function coreSys(s){
  var sys={};
  s.abis.concat(s.inns).forEach(function(n){var v=abiSysOf(n);if(v)sys[v]=true});
  return Object.keys(sys);
}
function coreSide(s){var b=s.base;if(b[1]>b[3])return '物理';if(b[3]>b[1])return '特殊';return '双刀'}
function coreRole(s){
  var b=s.base,names=s.abis.concat(s.inns);
  var sys=coreSys(s),swift=['悠游自如','叶绿素','拨雪','拨沙'];
  /* 天气速攻只认天性（固定生效）；可选池的提速特性仅作潜力标签（v4.2：别名感知 abiSame） */
  var swiftInn=s.inns.some(function(n){return swift.some(function(w){return abiSame(n,w)})});
  var sysInn={};s.inns.forEach(function(n){var v=abiSysOf(n);if(v)sysInn[v]=true});
  var sysInnKeys=Object.keys(sysInn);
  if(swiftInn&&sysInnKeys.length)return {role:'天气速攻打手（'+sysInnKeys[0]+'）',desc:'天性自带天气提速：'+names.filter(function(x){return swift.some(function(w){return abiSame(x,w)})}).join('/')+'，速度翻倍压制'};
  var setNames=names.filter(function(n){return abiSetOf(n)});
  if(setNames.length)return {role:'天气/场地设置手（'+setNames.map(function(n){return abiSetOf(n)}).filter(function(v,i,a){return a.indexOf(v)===i}).join('+')+'）',desc:'可开局天气/场地：'+setNames.map(function(n){return abiSetOf(n)}).filter(function(v,i,a){return a.indexOf(v)===i}).join('/')+'，价值在体系而不在单打输出'};
  if(b[5]>=110&&(b[1]>=100||b[3]>=100))return {role:'速攻手',desc:'速度种族'+b[5]+'，先手压制型'};
  if((b[1]>=115||b[3]>=115)&&b[5]<80)return {role:'慢速炮台（可空间）',desc:'速度'+b[5]+'偏低，可配戏法空间/后手炮台'};
  if(b[0]+b[2]+b[4]>=300&&b[1]+b[3]<220)return {role:'肉盾',desc:'耐久'+b[0]+'/'+b[2]+'/'+b[4]+'，站场消耗型'};
  if(b[1]>=120||b[3]>=120)return {role:'炮台',desc:coreSide(s)+'输出核心'};
  if(b[5]<60&&(b[1]>=90||b[3]>=90))return {role:'空间打手',desc:'极低速+高攻，空间内先手'};
  return {role:'均衡/多功能',desc:'种族分布均衡，按配招决定定位'};
}
function coreAbiPick(s){
  var names=s.abis,out=[];
  names.forEach(function(n){
    var id=abiIdByZhOrEn(n),tag=id?ERDATA.abiTags[id]:null,sc=0,why=[];
    var sys=abiSysOf(n);
    if(sys){sc+=3;why.push('负责'+sys+'体系')}
    if(tag){
      if(tag.im){sc+=2;why.push('免疫'+tag.im.join('/'))}
      if(tag.hf){sc+=1;why.push('减半'+tag.hf.join('/'))}
      if(tag.add){sc+=2;why.push('附加属性/免疫')}
      if(tag.phy){sc+=1;why.push('物理减伤')}
      if(tag.nt){sc+=1;why.push('关键耐性')}
    }
    var r=coreRole(s).role;
    if(r.indexOf('攻')>-1&&tag&&tag.im){sc+=1;why.push('攻手自保')}
    if(r.indexOf('盾')>-1&&tag&&tag.hf){sc+=1;why.push('盾位减伤')}
    if(sc===0&&s.abis.length===1){sc=0;why.push('唯一可选')}
    out.push({n:n,sc:sc,why:why});
  });
  out.sort(function(a,b){return b.sc-a.sc});
  return out;
}
function coreTags(s){
  var tags=[],learn=learnOf(s),names=s.abis.concat(s.inns);
  var hasAny=function(ids){return ids.some(function(id){return learn.indexOf(id)>-1})};
  /* 可选池天气提速（非天性，标注为潜力转型方向） */
  var swift=['悠游自如','叶绿素','拨雪','拨沙'];
  if(s.abis.some(function(n){return swift.indexOf(n)>-1}))tags.push('天气速攻潜力(可选池)');
  if(hasAny(FUNC_MV.boost)&&(s.base[0]+s.base[2]+s.base[4]>=250||hasAny(FUNC_MV.rec)||hasAny(FUNC_MV.protect)||names.some(function(n){return /毛皮大衣|毛茸茸/.test(n)})))tags.push('站场强化');
  if(names.some(function(n){return /再生力|逃之夭夭/.test(n)}))tags.push('轮转肉盾');
  if((learn.indexOf(409)>-1||learn.indexOf(202)>-1||learn.indexOf(141)>-1)&&(s.base[1]>=100||s.base[3]>=100))tags.push('对攻吸血');
  if(names.some(function(n){return /穿刺|放血|流血/.test(n)}))tags.push('流血状态');
  var prioMv=[245,389,183,418,453,98,252];
  var pc=prioMv.filter(function(id){return learn.indexOf(id)>-1}).length;
  if(pc>=2&&s.base[5]<=100)tags.push('先制收割');
  if(names.some(function(n){return /不服输|自信过度|异兽提升|好胜/.test(n)}))tags.push('击杀强化');
  if((learn.indexOf(273)>-1||learn.indexOf(505)>-1)&&s.base[0]+s.base[2]+s.base[4]>=250)tags.push('祈愿队医');
  if(learn.indexOf(504)>-1&&(s.base[1]>=100||s.base[3]>=100))tags.push('破受清场');
  if(names.some(function(n){return /毛皮大衣|毛茸茸/.test(n)}))tags.push('超级物盾');
  if(names.some(function(n){return /轻装|预备行动/.test(n)}))tags.push('入场暴击');
  if(hasAny(FUNC_MV.hazard)||learn.indexOf(229)>-1)tags.push('铺场清场');
  return tags;
}
function coreIntensity(s){
  var out={mults:[],bestPow:[],boosts:[],phys:'',spec:'',shield:'',immun:[]},names=s.abis.concat(s.inns);
  names.forEach(function(n){
    var id=abiIdByZhOrEn(n),tag=id?ERDATA.abiTags[id]:null;
    if(tag&&tag.out)out.mults.push({n:n,o:tag.out});
    if(tag&&(tag.def||tag.phy))out.shield+=(out.shield?'、':'')+n;
  });
  var learn=learnOf(s),stabs=[];
  learn.forEach(function(id){
    var m=MV[id];if(!m||m[4]==='变化')return;
    if((m[3]===s.t1||m[3]===s.t2)&&(m[5]||0)>=60)stabs.push({id:id,pow:m[5],ty:m[3]});
  });
  stabs.sort(function(a,b){return b.pow-a.pow});
  out.bestPow=stabs.slice(0,2);
  FUNC_MV.boost.forEach(function(id){if(learn.indexOf(id)>-1&&MV[id])out.boosts.push(MV[id][1])});
  var b=s.base,hp=b[0];
  var phys=b[1]+b[2],spec=b[3]+b[4];
  var hasFur=names.some(function(n){return n.indexOf('毛皮大衣')>-1}),hasWool=names.some(function(n){return n.indexOf('毛茸茸')>-1});
  out.phys=(phys+hp>=300?'高物耐':(phys+hp>=230?'中物耐':'低物耐'))+(hasFur?'+毛皮大衣':(hasWool?'+毛茸茸':''));
  out.spec=(spec+hp>=300?'高特耐':(spec+hp>=230?'中特耐':'低特耐'));
  ERDATA.types.forEach(function(at){if(defCellTrio(s,at).inn===0)out.immun.push(at)});
  return out;
}
function coreComment(s){
  var p=coreRole(s),tags=coreTags(s),in0=coreIntensity(s),side=coreSide(s);
  var c=[p.role];
  if(tags.length)c.push('细分：'+tags.join('、'));
  if(in0.mults.length)c.push('强度：'+in0.mults.map(function(m){return m.n+(m.o.cond?'('+m.o.cond+')':'')+'×'+m.o.mul}).join('、'));
  if(in0.bestPow.length)c.push('本系最高威力 '+in0.bestPow[0].pow+'（'+in0.bestPow[0].ty+'）');
  c.push('耐久 '+in0.phys+' / '+in0.spec);
  var learn=learnOf(s);
  c.push(learn.some(function(id){return FUNC_MV.rec.indexOf(id)>-1})?'有回复':'⚠无回复');
  c.push(s.base[5]>=110?'速度'+s.base[5]+' 先手优势':(s.base[5]<60?'速度'+s.base[5]+' 极慢(空间向)':'速度'+s.base[5]+' 中速'));
  var wk=coreWeak(s);
  if(wk.length)c.push('怕 '+wk.join('/'));
  return c.join('。');
}
/* D1 修复注：coreComment / mkBuild.desc 的消费端均走 esc()（renderCore **L2127 / L2135**），
   故这两个「纯文本」字符串里**禁止**再拼 tlabel() 的 HTML —— 历史上在此拼过 tlabel，导致
   用户看到字面 `<span class="t t-草">草</span>`（独立黑盒复验 D1）。属性彩色 chip 只在未转义的
   innerHTML 路径使用（如 L2146 招式表 / L2106 头部 chips / renderDef 分组）。 */
function coreNature(s){
  var r=coreRole(s).role,side=coreSide(s);
  if(r.indexOf('速攻')>-1||r.indexOf('天气速攻')>-1)return side==='物理'?[['爽朗','+速度-特攻，先手压制'],['天真','+速度-特防']]:[['胆小','+速度-攻击，先手压制'],['急躁','+速度-防御']];
  if(r.indexOf('空间')>-1)return side==='物理'?[['勇敢','+攻击-速度，空间内先手'],['固执','+攻击-特攻']]:[['冷静','+特攻-速度，空间内先手'],['内敛','+特攻-攻击']];
  if(r.indexOf('慢速炮台')>-1)return side==='物理'?[['勇敢','+攻击-速度（配空间）'],['固执','+攻击-特攻']]:[['冷静','+特攻-速度（配空间）'],['内敛','+特攻-攻击']];
  if(r.indexOf('肉盾')>-1)return [['淘气','+防御-特攻（物盾）'],['慎重','+特防-特攻（特盾）'],['大胆','+防御-攻击']];
  if(r.indexOf('设置手')>-1)return [['慎重','+特防-特攻，站场保天气'],['沉着','+特防-攻击'],['大胆','+防御-攻击']];
  return side==='物理'?[['固执','+攻击-特攻'],['爽朗','+速度-特攻']]:[['内敛','+特攻-攻击'],['胆小','+速度-攻击']];
}
function coreItem(s){
  var r=coreRole(s).role,side=coreSide(s);
  if(r.indexOf('天气速攻')>-1)return side==='物理'?[['生命宝珠','1.3倍伤害换每回合1/10血，速攻手标准']]:[['生命宝珠','1.3倍伤害']];
  if(r.indexOf('设置手')>-1)return [['气势披带','保底开天气/场地'],['剩饭','站场续航']];
  if(r.indexOf('空间')>-1)return evioAdv(s)?[['进化奇石','双防×1.5（仅非最终形态生效）'],['生命宝珠','空间内高输出']]:[['剩饭','低速站场续航'],['生命宝珠','空间内高输出']];
  if(r.indexOf('肉盾')>-1)return [['剩饭','每回合1/16回血'],['凸凸头盔','物攻手碰瓷'],['文柚果','半血回1/4']];
  if(r.indexOf('速攻')>-1)return [['气势披带','防一击必杀反打'],['讲究围巾','速度再乘1.5']];
  return [['生命宝珠','输出最大化'],['剩饭','续航']];
}
/* 招式打击面：该招（含 -ate 转换后属性）对 18 实质属性≥2x 的克制集合（星晶/无/神秘 全中性除外） */
function atkCover(s,id){
  var m=MV[id];if(!m)return [];
  var ti=tIdx(effMvType(s,m,convOf(s)));if(ti<0)return [];
  var hit=[];
  ERDATA.types.forEach(function(t,di){
    if(t==='星晶'||t==='无'||t==='神秘')return;
    if(ERDATA.matchup[ti]&&ERDATA.matchup[ti][di]>=2)hit.push(t);
  });
  return hit;
}
/* B9 分层5：4 招对 21 属性取「最优倍率」（max）→ 盲点=全部 ≤0.5x 的属性 */
function setCoverProfile(s,ids,conv){
  var prof={};
  ERDATA.types.forEach(function(at){
    var mx=0;
    ids.forEach(function(id){
      var m=MV[id];if(!m)return;
      var ty=effMvType(s,m,conv);
      var v=ERDATA.matchup[tIdx(at)][tIdx(ty)];
      var val=(v===0?0:((v===0.5||v===3)?0.5:(v===2?2:1)));
      if(val>mx)mx=val;
    });
    prof[at]=mx;
  });
  return prof;
}
function blindList(prof){
  var out=[];ERDATA.types.forEach(function(at){if(prof[at]<1)out.push(at)});return out;
}
function whyHtml(why){
  if(!why||!why.length)return '';
  return why.map(function(x){return esc(x)}).join(' × ').replace(/ × ⚠/g,'　⚠');
}
/* ============ 分层配招引擎（规格 v1.0 B9） ============
  分层1 侧判定（v4.3：side 由 deriveBuilds/profileOf 的客观画像给出；双刀=破盾路线之一）
  分层2 候选池（侧过滤 + 攻击招 + lDesc 代价）
  分层3 多维打分 pow×stab×hit×prio×cover×weather×abi×cost（功能招见 pickFuncs）
  分层4 覆盖贪心（atkCover 维护已选覆盖、同覆盖降权 0.4、usedTy≥2 去重、首槽本系 +30）
  分层5 盲点检查（见 renderCore） */
/* ============ v4.5：招式/流派并入 P1–P5 原则推理层 ============
   与道具层（itemAxOf/P1–P5/itemScored）同构：招式类别 → **P1 四轴剖面** MV_AX，
   类别权重 = Σ_轴 DUTY[职责][轴] × MV_AX[类别][轴]（**不写死「角色→类别」映射**：
   同一类别在不同职责下权重不同，如 钉子 在受队 vs 速攻），主导轴 → 原则标签。
   why 统一「克制 X；代价 Y｜原则 P…」，与道具 46/46 同格式。 */
var MV_AX={
  attack :{burst:1.00,longevity:0.00,punish:0.20,tech:0.20},
  cover  :{burst:0.70,longevity:0.10,punish:0.30,tech:0.70},
  prio   :{burst:0.80,longevity:0.00,punish:0.70,tech:0.30},
  boost  :{burst:0.60,longevity:0.20,punish:0.10,tech:0.80},
  rec    :{burst:0.00,longevity:1.00,punish:0.10,tech:0.20},
  hazard :{burst:0.10,longevity:0.30,punish:0.70,tech:0.90},
  remove :{burst:0.00,longevity:0.60,punish:0.10,tech:0.80},
  speed  :{burst:0.25,longevity:0.30,punish:0.40,tech:1.00},
  weather:{burst:0.20,longevity:0.40,punish:0.00,tech:1.00},
  wear   :{burst:0.10,longevity:0.70,punish:0.80,tech:0.40},
  protect:{burst:0.10,longevity:0.60,punish:0.20,tech:0.60},
  /* pivot＝**带伤害的轮转**（伏特替换/急速折返等）：burst 高于纯技术招，longevity 低（换人即断，续航靠队友）；
     speed＝纯技术轴（电磁波/顺风/岩石封锁），无伤害 → burst 最低、tech 最高。二者此消彼长，由职责四轴自然分序 */
  pivot  :{burst:0.45,longevity:0.20,punish:0.40,tech:0.75}};
var MV_KIND_NAME={attack:'主攻输出',cover:'补盲',prio:'先制收残',boost:'强化',rec:'回复',hazard:'钉子',remove:'除钉',
  speed:'控速',weather:'天气/场地',wear:'消耗',protect:'保命',pivot:'轮转'};
var MV_COST={attack:'命中/PP 与被换人风险',cover:'专打盲点，遇非弱点属性收益低',prio:'威力偏低，只适合收残',
  boost:'强化回合先被打，需耐久或掩护',rec:'占招式位，不解决被秒',hazard:'铺场慢，怕除钉',remove:'占用输出位',
  speed:'依赖窗口/回合',weather:'窗口期外收益低',wear:'需连续回合兑现',protect:'被动，怕读招',pivot:'输出切走，节奏依赖队友'};
var AX_PRIN={burst:'P1',longevity:'P2',punish:'P3',tech:'P4'};
var MV_KIND_BY_FUNC={rec:'rec',boost:'boost',hazard:'hazard',removal:'remove',speed:'speed',protect:'protect',pivot:'pivot',wear:'wear',weather:'weather'};
function mvKindOf(id){
  var m=MV[id];if(!m)return 'attack';
  for(var k in MV_KIND_BY_FUNC){if(FUNC_MV[k]&&FUNC_MV[k].indexOf(id)>-1)return MV_KIND_BY_FUNC[k]}
  if((m[8]||0)>0)return 'prio';
  return 'attack';
}
function mvDutyAxes(tag,kind){
  var d=(typeof DUTY!=='undefined'&&DUTY[tag])?DUTY[tag]:((typeof DUTY!=='undefined'&&DUTY['输出'])?DUTY['输出']:{burst:1,longevity:0.3,punish:0.2,tech:0.4});
  var ax=MV_AX[kind]||MV_AX.attack,w=0,lead='burst',best=-1;
  ['burst','longevity','punish','tech'].forEach(function(k){
    var c=(d[k]||0)*(ax[k]||0);w+=c;if(c>best){best=c;lead=k}});
  return {w:Math.round(w*100)/100,lead:lead,axis:AX_PRIN[lead],ax:ax};
}
/* 原则标签集合：主导轴 + 显式补充（P5 协同 / P2 多功能 / P3 惩罚 / P4 环境）+ 兜底 */
function mvPrinSet(kind,tag,ex){
  ex=ex||{};var q=mvDutyAxes(tag,kind),p={};
  p[q.axis]=1;
  (ex.prin||[]).forEach(function(x){p[x]=1});
  if(kind==='weather'||kind==='speed')p.P4=1;
  if(ex.conv||ex.abi)p.P5=1;
  if((ex.cover||0)>=2)p.P2=1;
  if(kind==='hazard'||kind==='wear')p.P3=1;
  if(kind==='remove')p.P4=1;
  return {set:p,list:Object.keys(p).sort(),q:q};
}
function mvWhyStd(kind,tag,ex){
  ex=ex||{};var id=ex.id,m=(id!=null&&MV[id])?MV[id]:null,ps=mvPrinSet(kind,tag,ex),q=ps.q;
  var beat=ex.beat;
  if(!beat){
    if(kind==='attack')beat='主攻输出'+(m?('（威力 '+(m[5]||0)+'·'+(m[3]||'')+'）'):'');
    else if(kind==='cover')beat='补盲打击面'+(ex.tys&&ex.tys.length?('（'+ex.tys.join('/')+'）'):'');
    else if(kind==='prio')beat='先制收残（先制 +'+(ex.prio||(m?(m[8]||1):1))+'）';
    else beat=(MV_KIND_NAME[kind]||'功能')+'：兑现「'+tag+'」职责';
  }
  var cost=ex.cost||MV_COST[kind]||'占招式位';
  return '克制 '+beat+'；代价 '+cost+'｜原则 '+ps.list.join('/')+'（职责 '+tag+'：'+q.lead+' 主导，权重 '+q.w+'）';
}
function pickAttacks(s,side,n,role){
  var learn=learnOf(s),holes=coverHoles(s),conv=convOf(s),names=(s.abis||[]).concat(s.inns||[]);
  var hasRec=hasAny(learn,FUNC_MV.rec),cand=[];
  /* v4.x 体系化：配招打分同样接体系维度表（archOfSp）——空间队偏好陀螺球/重磅冲撞等低速受益招，
     晴/雨/沙/雪偏好各自受益招；权重表见 SYS_MV_ADJ，选招依据里逐条写明「体系加成 ×N（体系名）」 */
  var arch=archOfSp(s,side,role);
  learn.forEach(function(id){
    var m=MV[id];if(!m||m[4]==='变化')return;
    /* 分层2：按侧过滤攻击招（双刀=双侧全开，不再被种族高侧单边过滤） */
    if(side!=='双刀'&&m[4]!==(side==='物理'?'物理':'特殊'))return;
    var pow=m[5]||0;if(pow<55)return;
    var ty=effMvType(s,m,conv);
    var convHit=!!(conv&&m[3]===(conv.src||'一般'));
    var stab=(ty===s.t1||ty===s.t2)||(convHit&&ABI_ATE.stabConvert);
    /* B5 + v3.23：-ate 转换招输出倍率按特性取值（ateMulOf）——宏族 ×1.0（无 10% 加成）、三特例 ×1.1 */
    var ateMul=(convHit?ateMulOf(conv.id):1);
    var h=hitAdjOf(m),w=weatherAdjOf(s,m,learn,conv),a=abiAdjOf(s,side,ty,names,null,stab),c=costOf(s,m,hasRec);
    var cover=atkCover(s,id),covAdj=Math.min(1.5,1+0.05*cover.length),prio=m[8]||0;
    var sm=sysMvAdj(s,id,arch); /* 体系化招式权重（1=中性） */
    /* v4.5 原则层：招式类别（主攻/补盲/先制）× 职责四轴投影 → 类别权重（不写死角色→类别映射） */
    var holesHit=cover.filter(function(t){return holes.indexOf(t)>-1});
    var kind=(prio>0?'prio':(holesHit.length?'cover':'attack'));
    var pwv=mvDutyAxes(role||'输出',kind);
    /* 分层3：多维打分（各维度相乘；× 原则类别权重 0.85+0.30w ⇒ 同职责内按 P1 四轴动态微调） */
    var sc=pow*(stab?1.6:1)*h.mul*(prio>0?1.3:1)*covAdj*w.mul*a.mul*c.mul*ateMul*sm.mul*(0.85+0.30*pwv.w);
    var why=['威力'+pow];
    if(sm.mul!==1)why.push('体系加成 '+sm.name+' ×'+sm.mul+'（'+arch+'）');
    if(stab)why.push('本系×1.6'+(convHit?('（-ate 属性转换：'+((conv.src&&conv.src!=='一般')?(conv.src+'→'+conv.type+' '):'')+'×'+ateMul+' + 本系 STAB，已按游戏源码核对）'):''));
    if(h.why)why.push(h.why);
    if(prio>0)why.push('先制+'+prio+'×1.3');
    if(covAdj>1)why.push('打击面'+cover.length+'属性×'+covAdj.toFixed(2));
    if(w.why)why.push(w.why);
    if(a.why)why.push(a.why);
    c.tags.forEach(function(x){why.push(x)});
    if(a.warn)why.push('⚠'+a.warn);
    /* v4.5：统一「克制 X；代价 Y｜原则 P…」（与道具 46/46 同格式；每招必有原则标签） */
    why.push(mvWhyStd(kind,role||'输出',{id:id,tys:holesHit,cover:cover.length,prio:prio,
      conv:convHit,abi:!!(a&&a.why),prin:(stab?['P1']:(cover.length>=2?['P2']:[]))}));
    cand.push({id:id,ty:ty,rawTy:m[3],pow:pow,stab:stab,prio:prio,cover:cover,kind:kind,score:sc,why:why,cost:c,
      warn:a.warn,conv:convHit?conv:null});
  });
  cand.sort(function(a,b){return b.score-a.score});
  var out=[],covered={},usedTy={};
  /* 分层4：覆盖贪心（骨架保留）——力度 + 新增覆盖(40/个) + 命中本系盲点(25/个) + 首槽本系 30；同覆盖降权 novel 0.4 */
  for(var slot=0;slot<n;slot++){
    var best=null,bestV=-1;
    cand.forEach(function(c){
      if(out.some(function(x){return x.id===c.id}))return;
      var nv=0;c.cover.forEach(function(t){if(!covered[t])nv++});
      var hole=0;holes.forEach(function(t){if(c.cover.indexOf(t)>-1)hole++});
      var v=c.score*(nv>0?1:0.4)+nv*40+hole*25;
      if(slot===0&&c.stab)v+=30;
      if(v>bestV){best=c;bestV=v}
    });
    if(!best)break;
    out.push(best);best.cover.forEach(function(t){covered[t]=1});usedTy[best.ty]=(usedTy[best.ty]||0)+1;
  }
  /* 回填 1：高分不同属性招 */
  cand.forEach(function(c){
    if(out.length>=n)return;
    if(out.some(function(x){return x.id===c.id}))return;
    if(usedTy[c.ty]&&usedTy[c.ty]>=2)return;
    out.push(c);usedTy[c.ty]=(usedTy[c.ty]||0)+1;
  });
  /* 回填 2：允许同属性补齐攻击位 */
  cand.forEach(function(c){
    if(out.length>=n)return;
    if(out.some(function(x){return x.id===c.id}))return;
    out.push(c);
  });
  return out.slice(0,n);
}
/* ============ 流派引擎（v3.12）：同一宝可梦多流派，强化招与攻击招同侧匹配 ============ */
function stabBest(s,side){
  var learn=learnOf(s),best=null;
  learn.forEach(function(id){
    var m=MV[id];if(!m||m[4]==='变化')return;
    if(m[4]!==side)return;
    if(!(m[3]===s.t1||m[3]===s.t2))return;
    var pow=m[5]||0;if(pow<60)return;
    if(!best||pow>best.pow)best={id:id,pow:pow,ty:m[3]};
  });
  return best;
}
function buildMoves(s,side,roleTag){
  var learn=learnOf(s);
  var learnSet={};learn.forEach(function(x){learnSet[''+x]=1});
  function hasId(id){return !!learnSet[''+id]}   /* learnOf 返回数字 id，须按字符串比对（v4.x 修正） */
  var sys=coreSys(s);
  var selfSetter=sys.some(function(x){return isAbilSet(s,x)}); /* ⑥-4：核心自身是天气设置手才允许功能槽放天气招 */
  /* v4.3：强化招按**流派侧**（side 由 deriveBuilds 给出）：物理侧=物向强化、特殊侧=特向强化、
     双刀（=破盾路线之一，R07-35）优先双攻强化(破壳/自我激励)再全表
     ⑥-3 强化招感知天气：晴→生长（攻/特攻双倍）优先并可补光合作用；雨→特殊侧优先诡计、物理侧优先剑舞 */
  var boostIds=boostCandIds(s,side);   /* v45-2：候选序抽出为单一真值源（流派命名与配招对齐共用） */
  /* v4.5：功能招顺序由**原则投影**决定（类别权重 = Σ_轴 DUTY[职责][轴] × MV_AX[类别][轴]），
     —— 不再用 per-role 写死列表；除钉（remove）按 B6 口径固定末位（权重 0 → 仅展示不自动入槽），
     天气/场地招的入槽仍受**语义门**约束（仅核心自身为设置手，见下方 weather 分支） */
  var r=roleTag;
  /* 功能位候选序 = pickFuncs 的类别键（control=控速 / removal 仍为「仅展示」不入槽：B6 权重待实测→0）
     → 排序按**原则投影**（Σ 轴 DUTY[职责][轴] × MV_AX[类别][轴]），类别键经 FUNC_KIND 映射到招式类别 */
  var FUNC_KIND={boost:'boost',rec:'rec',hazard:'hazard',control:'speed',weather:'weather',wear:'wear',protect:'protect',pivot:'pivot'};
  var funcOrder=['boost','rec','hazard','control','weather','wear','protect','pivot'].filter(function(k){
    /* **语义门**（非权重）：天气/场地招仅在核心自身为设置手时可入功能槽（v4.x ⑥-4：体系核心不自带天气招，
       窗口由队友提供；此处保持原门控，不因原则投影而放宽） */
    return k!=='weather'||selfSetter;
  }).sort(function(a,b){
    return mvDutyAxes(r,FUNC_KIND[b]).w-mvDutyAxes(r,FUNC_KIND[a]).w;});
  /* **站场续航语义规则**（调序，非硬门）：强化/受队/肉盾打法的功能位第 2 位优先留给回复
     —— 依据 07 §4.5 配方（强化=强化+主攻+续航 / 受队=消耗·回复·钉子）；原则权重仍是主序 */
  if({'强化':1,'受队':1,'肉盾':1}[r]){
    var _i2=funcOrder.indexOf('rec');
    if(_i2>1){funcOrder.splice(_i2,1);funcOrder.splice(1,0,'rec')}
  }
  var slots=[],funcUsed=[];
  function push(cid,why,tag,kind,ex){
    var k=kind||mvKindOf(cid),w=(why||[]).slice();
    /* v4.5：why 去重——攻击槽在 pickAttacks 已写入统一「克制…｜原则…」，此处只补功能招的 */
    if(!w.some(function(x2){return /^克制 /.test(x2)}))
      w.push(mvWhyStd(k,r,(function(){var o=ex||{};o.id=cid;return o})()));
    slots.push({id:cid,tag:tag,why:w,kind:k,prin:mvDutyAxes(r,k).axis});
    funcUsed.push(cid);
  }
  /* 分层2：攻击招池（双刀=双侧全开，真混配） */
  var att=pickAttacks(s,side,4,r);
  /* 分层2+3：功能招池（定位权重 funcAdj + lDesc 代价；removal 权重 0 → 仅展示） */
  var funcs=pickFuncs(s,r,side,funcUsed);
  /* 输出/天气流：攻击位优先 2 个，防止功能招占满 4 槽把攻击挤出 */
  if(r!=='肉盾'&&r!=='受队'){
    var placed=0;
    att.forEach(function(c){
      if(placed<2&&funcUsed.indexOf(c.id)<0){push(c.id,c.why,(c.stab?'本系·':'')+(c.prio>0?'先制·':'')+(c.conv?'转换·':'')+'攻击',c.kind,{cover:c.cover.length,prio:c.prio,conv:!!c.conv});placed++}
    });
  }
  funcOrder.forEach(function(f){
    if(slots.length>=4)return;
    var id=null,why=[];
    if(f==='boost'){id=hasMv(learn,boostIds);if(id)why=['强化招（'+side+'侧优先）']}
    else if(funcs[f]){id=funcs[f].id;why=funcs[f].why}
    else if(f==='weather'){learn.forEach(function(x){if(!id&&WEATHER_MV[x]&&coreSys(s).indexOf(WEATHER_MV[x])>-1)id=x});if(id)why=['体系天气/场地招']}
    if(id&&funcUsed.indexOf(id)<0)push(id,why,MV_TAGS[f],FUNC_KIND[f]||mvKindOf(id));
  });
  /* 剩余攻击位填充 */
  att.forEach(function(c){
    if(slots.length>=4)return;
    if(funcUsed.indexOf(c.id)<0)push(c.id,c.why,(c.stab?'本系·':'')+(c.prio>0?'先制·':'')+(c.conv?'转换·':'')+'攻击',c.kind,{cover:c.cover.length,prio:c.prio,conv:!!c.conv});
  });
  var main=slots.slice(0,4);
  var backup=[];
  att.forEach(function(c){if(funcUsed.indexOf(c.id)<0)backup.push(c.id)});
  /* 备选：其余高分攻击招 + 剩余功能招（含除钉 229/432：权重 0 → 仅展示不自动入槽，B6） */
  FUNC_MV.rec.concat(boostIds,FUNC_MV.hazard,FUNC_MV.removal,FUNC_MV.speed,FUNC_MV.protect,FUNC_MV.pivot,FUNC_MV.wear).forEach(function(id){
    if(backup.length>=6)return;
    if(learn.indexOf(id)>-1&&funcUsed.indexOf(id)<0&&backup.indexOf(id)<0&&!main.some(function(x){return x.id===id}))backup.push(id);
  });
  return {main:main,backup:backup.slice(0,6),side:side,funcs:funcs,selfSetter:selfSetter,
    wxMv:main.some(function(x){return WEATHER_MV[x.id]!==undefined})};
}
function buildNature(s,side,roleTag){
  var b=s.base;
  if(roleTag==='肉盾'||roleTag==='受队'||roleTag==='强化')return [['淘气','+防御-特攻（物盾消耗）'],['慎重','+特防-特攻'],['大胆','+防御-攻击']];
  if(roleTag==='天气')return [['慎重','+特防-特攻，站场保天气'],['沉着','+特防-攻击']];
  if(b[5]>=110)return side==='物理'?[['爽朗','+速度-特攻，先手压制'],['固执','+攻击-特攻']]:[['胆小','+速度-攻击，先手压制'],['内敛','+特攻-攻击']];
  if(b[5]<60)return side==='物理'?[['勇敢','+攻击-速度（配空间）'],['固执','+攻击-特攻']]:[['冷静','+特攻-速度（配空间）'],['内敛','+特攻-攻击']];
  return side==='物理'?[['固执','+攻击-特攻'],['爽朗','+速度-特攻']]:[['内敛','+特攻-攻击'],['胆小','+速度-攻击']];
}
/* 天气/场地手道具（单一天气岩石优先；场地手=光之黏土+对应种子+地形延长器）——奇石分支与天气分支共用 */
/* v4.3.3：道具推荐 = 角色×流派×体系匹配（ITEM_POOL 驱动），返回「主推 + 2 备选」（2-3 项，主推在首位） */
/* ================= v4.4 原则驱动道具决策层（对位目标 + P1~P5 权衡） =================
   设计依据（用户第二轮方法论批评）：对战决策不是查表，而是「对位 + 原则权衡」。
   · **废除「角色 → 道具类别」写死映射**：角色只提供**四轴职责权重**（P1），由对位目标动态调制；
   · 每个候选道具登记 ax（轴贡献，属**道具语义**，与角色无关）/ cost（代价）/ syn（P5 协同判定）；
   · sc = Σ_k duty[k]×ax[k] + P2 多功能 + P3 punish 动态 + P4 环境 + P5 ER 协同（**零硬门**：不适用才不入候选）；
   · why = 「克制 X；代价 Y｜原则 P1/P4…」，可溯源、可复核。
   【威胁库 THREAT_LIB 结构】由 ERDATA（species/moves/abilities）+ 克制矩阵（matchupSp 同源）
   + ABI_TAGS **派生**，不手写具体名单；每类登记 deriv（可复算口径）/ evid（证据字段）/ rep（运行时算代表物种）。
   【v4.5 弱先验】ER 无对战统计（已知缺口）→ 引入 Smogon chaos 2026-09 **原版**使用率作**弱先验**
   （USAGE_PRIOR_W=0.6，只做同类威胁内的次排序；量级仍由代理口径「可学该机制/属性 × 种族力度」决定）；
   诚实标注：**原版（PS OU/ND）使用率 ≠ ER 使用率**。字段/来源见 ERDATA.usagePrior / ERDATA.usageMeta。 */
var THREAT_LIB=[
  {id:'HZ',   name:'钉子环境',      deriv:'可学入场钉子（FUNC_MV.hazard）者 / 有效物种占比', evid:'FUNC_MV.hazard ∩ learnOf'},
  {id:'HZR',  name:'除钉手段',      deriv:'可学除钉（FUNC_MV.removal）者占比',               evid:'FUNC_MV.removal ∩ learnOf'},
  {id:'BOOST',name:'强化怪',        deriv:'可学强化招（FUNC_MV.boost）且 BST≥500',          evid:'FUNC_MV.boost ∩ learnOf + BST'},
  {id:'PRIO', name:'先制/收残',     deriv:'持有先制度>0 招者占比',                          evid:'MV[..].prio'},
  {id:'PHYS', name:'物理压制手',    deriv:'物攻种族前 40（代理口径）',                       evid:'base[1] 降序'},
  {id:'SPEC', name:'特殊压制手',    deriv:'特攻种族前 40（代理口径）',                       evid:'base[3] 降序'},
  {id:'WX',   name:'天气/场地设置手',deriv:'SYS_SET 特性持有者',                            evid:'SYS_SET ∩ abilities'},
  {id:'IMM',  name:'免疫特性墙',    deriv:'ABI_TAGS.im 命中属性 → 该属性招无效',             evid:'ERDATA.abiTags[..].im'},
  {id:'TYPE', name:'属性压制手',    deriv:'该属性 STAB 招最高威力前 25（代理口径）',          evid:'MV pow×属性 ∩ learnOf'}
];
/* ============ v4.5：威胁库「使用率先验」（弱先验） ============
   源 = Smogon chaos 2026-09（rating 0）raw.usage，构建期由 build_tool_html.py 读 nn_data/chaos/ 注入 ERDATA.usagePrior
   格式加权 gen3ou×1.0 + gen9nationaldex×0.5；⚠ 原版（PS）使用率 ≠ ER 使用率（ER 无对战统计=已知缺口）
   用途：**只作次排序**（同类威胁里谁更常见）——上限 USAGE_PRIOR_W=0.6，改不了量级、只能改变近似并列者的顺序 */
var USAGE_PRIOR_W=0.6;
function usagePriorOf(s){var u=(ERDATA&&ERDATA.usagePrior)||{};return u[''+s.id]||0}
function usageMeta(){return (ERDATA&&ERDATA.usageMeta)||{srcs:[],coverage:0,month:'—',note:'nn_data/chaos 缺失 → 无先验（登记缺口）'}}
var USAGE_SRC_ZH={'gen3ou':'第三代 OU 使用率','gen9nationaldex':'第九代全国图鉴使用率'};
function threatPriorLine(){
  var m=usageMeta(),sr=(m.srcs||[]).map(function(x){return (USAGE_SRC_ZH[x.format]||'原版使用率')+'（权重 '+x.weight+'）'}).join(' + ');
  return '威胁先验：'+(sr||'无（缺口）')+'｜覆盖 '+m.coverage+' 只（'+m.month+'）｜**原版使用率 ≠ ER 使用率**，仅弱先验（ER 无对战统计=已知缺口）';
}
(function(){var ln=threatPriorLine(),src=(usageMeta().srcs||[]).map(function(x){return x.file}).join('+');
  THREAT_LIB.forEach(function(t){t.prior=ln;t.priorSrc=src||'none'})})();
var RESIST_BERRY={'火':105,'水':106,'电':107,'草':108,'冰':109,'格斗':110,'毒':111,'地面':112,'飞行':113,'超能':114,'虫':115,'岩石':116,'幽灵':117,'龙':118,'恶':119,'钢':120,'妖精':122,'一般':121};
var _thrMemo={},_spAllMemo=null,_medSpeMemo=null;
function spAll(){if(!_spAllMemo)_spAllMemo=ERDATA.species.filter(function(x){return isValidSp(x)});return _spAllMemo}
function medSpe(){if(_medSpeMemo===null){var a=spAll().map(function(x){return x.base[5]}).sort(function(x,y){return x-y});_medSpeMemo=a[Math.floor(a.length/2)]||80}return _medSpeMemo}
/* 可学某类招者的占比（代理口径：无使用率数据） */
function thrFrac(ids){
  var k='f'+ids.join(',');
  if(_thrMemo[k]!==undefined)return _thrMemo[k];
  var all=spAll(),hit=0;
  all.forEach(function(sp){var L=learnC(sp);for(var i=0;i<L.length;i++){if(ids.indexOf(L[i])>-1){hit++;return}}});
  return _thrMemo[k]=all.length?hit/all.length:0;
}
/* 代表物种（该威胁类别里最像"你要面对的东西"的前 n 只，按 BST/力度代理排序） */
function threatRep(t,type,n){
  var key=t+(type||'')+'/'+(n||6);
  if(_thrMemo[key])return _thrMemo[key];
  var all=spAll(),list=[],NN=(n||6);
  /* MV 字段布局：0 id / 1 zh / 2 en / 3 属性 / 4 类别 / 5 威力 / 6 命中 / 7 PP / 8 先制 / 9-10 desc */
  if(t==='PHYS')list=all.slice(0).sort(function(a,b){return b.base[1]-a.base[1]});
  else if(t==='SPEC')list=all.slice(0).sort(function(a,b){return b.base[3]-a.base[3]});
  else if(t==='HZ')list=all.filter(function(sp){var L=learnC(sp);return L.some(function(i){return FUNC_MV.hazard.indexOf(i)>-1})}).sort(function(a,b){return bstSum(b)-bstSum(a)});
  else if(t==='HZR')list=all.filter(function(sp){var L=learnC(sp);return L.some(function(i){return (FUNC_MV.removal||[]).indexOf(i)>-1})}).sort(function(a,b){return bstSum(b)-bstSum(a)});
  else if(t==='BOOST')list=all.filter(function(sp){return bstSum(sp)>=500&&learnC(sp).some(function(i){return FUNC_MV.boost.indexOf(i)>-1})}).sort(function(a,b){return bstSum(b)-bstSum(a)});
  else if(t==='PRIO')list=all.filter(function(sp){return learnC(sp).some(function(i){var m=MV[i];return m&&m[8]>0&&m[5]>0})}).sort(function(a,b){return bstSum(b)-bstSum(a)});
  else if(t==='WX')list=all.filter(function(sp){return (sp.abis||[]).concat(sp.inns||[]).some(function(n2){return !!SYS_SET[n2]})}).sort(function(a,b){return bstSum(b)-bstSum(a)});
  else if(t==='IMM')list=all.filter(function(sp){return (sp.abis||[]).concat(sp.inns||[]).some(function(n2){var g=abiTagOf(n2);return g&&g.im&&g.im.indexOf(type)>-1})});
  else if(t==='TYPE')list=all.filter(function(sp){
      if(sp.t1!==type&&sp.t2!==type)return false;
      return learnC(sp).some(function(i){var m=MV[i];return m&&m[3]===type&&(m[4]==='物理'||m[4]==='特殊')&&m[5]>=60});
    }).sort(function(a,b){return bstSum(b)-bstSum(a)});
  /* v4.5：弱先验只作**次排序**——主键仍是代理口径序（BST/力度/类别内序）；先验把近似并列者调序 */
  if(list.length>1){
    var _ord={};list.forEach(function(x,i){_ord[''+x.id]=i});
    list=list.slice(0).sort(function(a,b){
      var ka=(_ord[''+a.id]||0)*(1+USAGE_PRIOR_W*usagePriorOf(a));
      var kb=(_ord[''+b.id]||0)*(1+USAGE_PRIOR_W*usagePriorOf(b));
      return ka-kb;});
  }
  return _thrMemo[key]=list.slice(0,NN);
}
/* 对位目标：这只宝可梦（按角色）要解决哪几类威胁 —— 由属性克制 + 环境占比 + 数据派生 */
function oppTargets(s){
  var key='op'+s.id;
  if(_thrMemo[key])return _thrMemo[key];
  var T=effTypesOf(s).base,weak=[],quad=[];
  Object.keys(RESIST_BERRY).forEach(function(t){var m=defMult(T,t);if(m>=4)quad.push(t);else if(m>=2)weak.push(t)});
  weak=weak.concat(quad);
  var env={hazFrac:thrFrac(FUNC_MV.hazard),remFrac:thrFrac(FUNC_MV.removal||[]),
           boostFrac:thrFrac(FUNC_MV.boost),prioFrac:thrFrac((function(){var r=[];Object.keys(MV).forEach(function(i){var m=MV[i];if(m&&m[8]>0)r.push(+i)});return r})())};
  var syss=itemSysOf(s);
  var tg={weak:weak,quad:quad,hazWeak:itemRockWeak(s),env:env,sys:syss,sys0:syss[0]||'',
    outsped:(s.base[5]||0)<medSpe(),
    reps:{},targets:[]};
  weak.slice(0,3).forEach(function(t){tg.reps['TYPE'+t]=threatRep('TYPE',t,3)});
  tg.reps.PHYS=threatRep('PHYS',null,3);tg.reps.SPEC=threatRep('SPEC',null,3);
  tg.reps.HZ=threatRep('HZ',null,3);tg.reps.BOOST=threatRep('BOOST',null,3);
  /* 对位目标清单（供 why 与 UI 展示） */
  weak.slice(0,3).forEach(function(t){
    var r=tg.reps['TYPE'+t]||[];
    tg.targets.push({id:'TYPE'+t,name:t+'系压制手',rep:r.map(function(x){return x.zh}).slice(0,3).join('/'),counter:'抗'+t+'果 / 先手击杀 / 队友抗性'});
  });
  if(tg.hazWeak&&env.hazFrac>=0.25)tg.targets.push({id:'HZ',name:'钉子环境（入场掉血）',rep:(tg.reps.HZ||[]).map(function(x){return x.zh}).slice(0,3).join('/'),counter:'厚底靴 / 除钉队友'});
  if(s.base[5]<medSpe()&&s.base[1]>100)tg.targets.push({id:'PRIO',name:'被超速/先制收残',rep:(tg.reps.PHYS||[]).map(function(x){return x.zh}).slice(0,2).join('/'),counter:'先制招 / 控速道具 / 站场耐久'});
  return _thrMemo[key]=tg;
}
/* P1：四轴职责权重（角色给基线，**对位目标调制**，故不存在「天气手必=岩石」的写死映射） */
var DUTY={
  '输出':{burst:1.0,longevity:0.30,punish:0.20,tech:0.40},
  '均衡':{burst:0.8,longevity:0.50,punish:0.20,tech:0.50},
  '增伤':{burst:0.80,longevity:0.40,punish:0.20,tech:0.70},
  '强化':{burst:0.85,longevity:0.50,punish:0.20,tech:0.70},
  '轮转':{burst:0.60,longevity:0.40,punish:0.50,tech:0.80},
  '游击':{burst:0.60,longevity:0.40,punish:0.50,tech:0.80},
  '控速':{burst:0.50,longevity:0.70,punish:0.30,tech:0.80},
  '肉盾':{burst:0.20,longevity:1.00,punish:0.80,tech:0.60},
  '受队':{burst:0.15,longevity:1.00,punish:0.70,tech:0.80},
  '盾':{burst:0.20,longevity:1.00,punish:0.80,tech:0.60},
  '天气':{burst:0.45,longevity:0.70,punish:0.30,tech:0.90},
  '场地':{burst:0.45,longevity:0.70,punish:0.30,tech:0.90}
};
function itemDutyOf(tag,p,tg){
  var base=DUTY[tag]||DUTY['输出'],d={burst:base.burst,longevity:base.longevity,punish:base.punish,tech:base.tech};
  if(tg){
    if(tg.hazWeak&&tg.env.hazFrac>=0.25){d.tech+=0.30;d.longevity+=0.20}      /* P4 钉子环境 × 弱点 */
    if(tg.weak.length>=3)d.tech+=0.15;                                       /* 弱点面宽 → 要兜底 */
    if(tg.quad.length)d.tech+=0.25,d.longevity+=0.15;                        /* 4× 弱点 → 抗性果/续航 */
    if(tg.outsped&&['输出','增伤','轮转','游击'].indexOf(tag)>-1)d.burst+=0.20; /* 被超速 → 击杀线/先手 */
    if(tg.outsped&&['肉盾','受队','盾','控速'].indexOf(tag)>-1)d.longevity+=0.20;
    if(tg.env.boostFrac>=0.30&&tag==='强化')d.burst+=0.15;                    /* 强化环境军备竞赛 */
    if(tg.env.prioFrac>=0.30&&['肉盾','受队','盾'].indexOf(tag)>-1)d.longevity+=0.10;
  }
  if(p&&p.field&&p.field.length&&(tag==='天气'||tag==='场地'))d.tech+=0.30;    /* 体系窗口价值 */
  if(p&&p.fn&&p.fn.rec&&['肉盾','受队','盾'].indexOf(tag)>-1)d.longevity+=0.10;
  return d;
}
/* 轴贡献（道具语义，与角色无关）——按类别给默认，关键件显式覆写 */
/* 轴贡献（道具语义，与角色无关）——按类别默认，关键件显式覆写；负值=该道具自带的长期代价 */
var AX_BY_CLS={'输出':{burst:0.80,longevity:0,punish:0,tech:0.20},'防御续航':{burst:0,longevity:0.80,punish:0.20,tech:0.30},
  '天气场地':{burst:0.10,longevity:0.20,punish:0,tech:0.90},'控速机动':{burst:0.30,longevity:0.10,punish:0.30,tech:0.70},
  '钉子反钉':{burst:0,longevity:0.50,punish:0.10,tech:0.80},'减伤果':{burst:0,longevity:0.60,punish:0,tech:0.70},
  '香草':{burst:0.35,longevity:0.15,punish:0,tech:0.50},'奇石':{burst:0,longevity:1.00,punish:0.10,tech:0.30}};
var AX_OVR={'生命宝珠':{burst:1.00,longevity:-0.15,tech:0.20},'讲究头带':{burst:0.90,longevity:-0.10,tech:0.20},
  '讲究眼镜':{burst:0.90,longevity:-0.10,tech:0.20},'讲究围巾':{burst:0.70,longevity:-0.10,tech:0.90},
  '突击背心':{burst:0.45,longevity:0.60,tech:0.35},'剩饭':{longevity:1.00,tech:0.30},
  '黑色污泥':{longevity:1.00,tech:0.30},'文柚果':{longevity:0.70,tech:0.20},'凸凸头盔':{longevity:0.40,punish:1.00,tech:0.20},
  '红牌':{longevity:0.10,punish:1.00,tech:0.40},'逃脱按钮':{longevity:0.10,punish:0.60,tech:0.80},
  '弱点保险':{burst:0.70,tech:0.60},'气球':{tech:0.60},'厚底靴':{tech:0.80,longevity:0.50},'防尘护目镜':{tech:0.50},
  '炽热岩石':{tech:1.00,longevity:0.10},'潮湿岩石':{tech:1.00,longevity:0.10},'光滑岩石':{tech:1.00,longevity:0.10},
  '冰冷岩石':{tech:1.00,longevity:0.10},'光之黏土':{tech:1.00,longevity:0.10},'地形延长器':{tech:0.85,longevity:0.10},
  '电气种子':{tech:0.60,longevity:0.30},'青草种子':{tech:0.60,longevity:0.30},'薄雾种子':{tech:0.60,longevity:0.30},'精神种子':{tech:0.60,longevity:0.30},
  '星桃果':{burst:0.35,longevity:0.45,tech:0.30},'沙鳞果':{burst:0.35,longevity:0.45,tech:0.30},'嘉珍果':{burst:0.35,longevity:0.45,tech:0.30},
  '释陀果':{burst:0.35,longevity:0.45,tech:0.30},'木子果':{longevity:0.40,tech:0.30},'先制之爪':{burst:0.30,tech:0.50},'光粉':{tech:0.50},
  '气势披带':{tech:0.60,longevity:0.30},'节拍器':{burst:0.80},'达人带':{burst:0.75},'力量头带':{burst:0.60},'博识眼镜':{burst:0.60},
  '剧毒宝珠':{burst:0.35,longevity:-0.10,tech:0.60},'火焰宝珠':{burst:0.35,longevity:-0.10,tech:0.60},
  '进化奇石':{longevity:1.00,punish:0.10,tech:0.30},'属性宝石':{burst:0.70,tech:0.30},
  '广角镜':{tech:0.35},'对焦镜':{tech:0.30},'焦点镜片':{tech:0.40},'锐利之爪':{tech:0.40},
  '橙橙果':{longevity:0.45,tech:0.20},'属性减伤果':{longevity:0.60,tech:0.70},
  '白色香草':{burst:0.35,tech:0.40},'心灵香草':{longevity:0.30,tech:0.60},'力量香草':{burst:0.50,tech:0.50}};
function itemAxOf(pi){var o=AX_OVR[pi.zh];
  /* 命中覆写=**真覆写**：未列出的轴一律 0（否则会从类别默认白拿力度轴，如「气球」cls=输出 → burst 0.80） */
  if(o)return {burst:(o.burst||0),longevity:(o.longevity||0),punish:(o.punish||0),tech:(o.tech||0)};
  var b=AX_BY_CLS[pi.cls]||{burst:0,longevity:0,punish:0,tech:0};
  return {burst:b.burst,longevity:b.longevity,punish:b.punish,tech:b.tech}}
/* 代价（why 的「代价是什么」） */
var COST_OF={'生命宝珠':'每回合自伤 1/10，不适合站场消耗','讲究头带':'锁招，不能变招','讲究眼镜':'锁招，不能变招',
  '讲究围巾':'锁招，不能变招','突击背心':'只能出攻击招','弱点保险':'需要先被打到弱点，被动','气球':'一次性（被打即破）',
  '厚底靴':'占道具位但不增加输出','防尘护目镜':'只挡沙暴冰雹与粉末','炽热岩石':'只服务晴天窗口，不提升自身战力',
  '潮湿岩石':'只服务雨天窗口，不提升自身战力','光滑岩石':'只服务沙暴窗口，不提升自身战力','冰冷岩石':'只服务雪天窗口，不提升自身战力',
  '光之黏土':'只延长墙，不延长天气','地形延长器':'只延长场地','进化奇石':'只对非最终形态生效','文柚果':'一次性，半血才触发',
  '凸凸头盔':'需要被物攻手碰到','红牌':'一次性，且要被打中','逃脱按钮':'被打中才换人（可能被读）','属性宝石':'一次性',
  '属性减伤果':'一次性，只挡单一属性','剧毒宝珠':'每回合中毒损血','火焰宝珠':'每回合灼伤损血','气势披带':'仅满血生效',
  '星桃果':'残血才触发，随机性','沙鳞果':'残血才触发','嘉珍果':'残血才触发','释陀果':'残血才触发','木子果':'一次性，只解异常',
  '心灵香草':'一次性','白色香草':'一次性','力量香草':'一次性','电气种子':'需要场上已有电气场地','青草种子':'需要场上已有青草场地',
  '薄雾种子':'需要场上已有薄雾场地','精神种子':'需要场上已有精神场地','剩饭':'回复慢，不解决爆发','黑色污泥':'非毒系会反伤'};
function itemCostOf(pi){return COST_OF[pi.zh]||'占道具位，机会成本'}
/* 适用性闸（**不是否决**：只是这只宝可梦戴它无意义才不入候选） */
function itemApplies(zh,s,p,tg,effSys){
  if(zh==='进化奇石')return !!evioAdv(s);                          /* v4.3.1 门控：仅非最终形态且权衡通过 */
  if(zh==='黑色污泥')return s.t1==='毒'||s.t2==='毒';
  if(zh==='剧毒珠'||zh==='剧毒宝珠'||zh==='火焰宝珠')return abiMentions(s,/中毒时|灼伤时|异常状态时|陷入异常/);   /* 毒疗/毅力类协同（启发式，已登记） */
  if(/岩石$/.test(zh)&&WX_ROCK[effSys||tg.sys0]!==zh)return false; /* 天气岩石：按**队伍体系**（ctx.sys，v433-2）或本物种窗口判定 */
  if(zh==='光之黏土'||zh==='地形延长器')return tg.sys.some(itemIsExtendableTerrain);
  if(/种子$/.test(zh)){var need={'电气种子':'电场','青草种子':'青草场地','薄雾种子':'薄雾场地','精神种子':'精神场地'}[zh];return tg.sys.indexOf(need)>-1}
  if(zh==='讲究头带')return p.side!=='特殊';
  if(zh==='讲究眼镜')return p.side!=='物理';
  if(zh==='气球')return tg.weak.indexOf('地面')>-1||!(['飞行','电'].some(function(t){return s.t1===t||s.t2===t}));
  return true;
}
/* 特性描述文本（中文优先）——用于 P5 协同启发式判定 */
function abiTextOf(n){var id=abiIdByZhOrEn(n);return (id?abiDescZhOf(id):'')||''}
function abiMentions(s,re){return (s.abis||[]).concat(s.inns||[]).some(function(n){return re.test(abiTextOf(n))})}
function bstSum(sp){return (sp.base||[]).reduce(function(a,b){return a+(b||0)},0)}
function itemZhName(id,fb){var it=itemById(id);return (it&&it[2])||fb}
/* 该宝可梦的候选集：池内 + 动态件（宝石按**本系实际属性**、抗性果按**实际承受最大弱点**） */
function itemCandSet(s,tg){
  var out=[],gem=itemGemFor(s),berry=itemResistBerryFor(s,tg);
  ITEM_POOL.forEach(function(pi){
    if(pi.dynamic==='gem'){if(gem)out.push({zh:gem.zh,id:gem.id,cls:'输出',ax:itemAxOf({zh:'属性宝石',cls:'输出'}),note:gem.why})}
    else if(pi.dynamic==='resist'){if(berry)out.push({zh:berry.zh,id:berry.id,cls:'减伤果',ax:itemAxOf({zh:'属性减伤果',cls:'减伤果'}),note:berry.why})}
    else out.push({zh:pi.zh,id:pi.id,cls:pi.cls,ax:itemAxOf(pi),note:pi.why});
  });
  return out;
}
function itemResistBerryFor(s,tg){
  var t=(tg.quad[0]||tg.weak[0]);if(!t)return null;
  var id=RESIST_BERRY[t];if(!id)return null;
  return {id:id,zh:itemZhName(id,'防'+t+'果'),
    why:'对位最大弱点（'+t+'系 '+defMult(effTypesOf(s).base,t)+'×）：中该属性招减半（一次性）'};
}
/* P2~P5 打分 + why 组装（零硬门：适用即入候选，按原则排序） */
var EVIO_PRIORITY=2.0;   /* v4.3.2 裁定常量：奇石权衡通过 → 主推（非涌现排序，便于回归锚定） */
/* 职责载荷项（role payload）：某些职责的**兑现物**就是某类道具（控速=速度类），给显式常量而非靠轴涌现 */
var ROLE_PAYLOAD={控速:['讲究围巾','嘉珍果','先制之爪'],速攻:['讲究围巾','气势披带']},ROLE_PAYLOAD_BONUS=1.8;
var LOCK_ITEMS=['讲究围巾','讲究头带','讲究眼镜'];   /* v45-1b：锁招类（锁招=牺牲变招权） */
function itemScored(s,side,tag,ctx){
  var p=profileOf(s),tg=oppTargets(s),d=itemDutyOf(tag,p,tg),res=[],ev=null;
  try{ev=evioAdv(s)}catch(e){ev=null}
  var hazAct=tg.env.hazFrac>=0.25,boostAct=tg.env.boostFrac>=0.30;
  /* v433-2：队伍体系（ctx.sys）优先于本物种窗口——晴天队的「天气来源」位即便候选自身非设置手，也应取炽热岩石 */
  var effSys=(ctx&&(ctx.sys||ctx.sysKey))||tg.sys0||'';
  var setter=isSetterAny(s);
  var windowRole=(tag==='天气'||tag==='场地');   /* 窗口类道具的职责角色：只有这两类角色在"经营窗口" */
  var scarfRedundant=!tg.outsped;                /* 已比环境中位速度快 → 围巾收益减半（对位驱动） */
  itemCandSet(s,tg).forEach(function(c,i){
    if(!itemApplies(c.zh,s,p,tg,effSys))return;
    var ax={burst:c.ax.burst,longevity:c.ax.longevity,punish:c.ax.punish,tech:c.ax.tech},sc=0,ps=[],beats=[];
    /* P5 协同：设置手身上延长自己窗口的道具 = 同时服务「体系窗口 + 站场续航」（特性池 n 选 1 的二维决策） */
    var oneShot=itemOneShot(c.zh);
    if(scarfRedundant&&c.zh==='讲究围巾'){ax.burst*=0.5;ax.tech*=0.5}
    if(windowRole&&(setter||effSys)&&(WX_ROCK[effSys]===c.zh||c.zh==='光之黏土'||c.zh==='地形延长器'||/种子$/.test(c.zh))){
      ax.longevity=Math.max(ax.longevity,0.55);ps.push('P5');beats.push('延长自身开出的窗口（特性池 n 选 1：换特性也不失协同）');
    }
    /* 对位前提（P1）：弱点保险要「被打到弱点还能站住」才兑现 —— 脆皮收益减半（正向缩放，不是否决） */
    if(c.zh==='弱点保险'&&((p.du&&p.du.bulk)||0)<230&&((p.du&&p.du.bulk)||0)>0){
      ax.burst*=0.5;ax.tech*=0.5;beats.push('自身耐久偏低（肉盾口径 '+p.du.bulk+'）：被弱点命中后难站住 → 收益减半');}
    /* v45-1b：锁招道具 ↔ 盾/受职责冲突（需变招权与长线消耗）——按职责轴显式降权并写明（非硬门，仍列备选） */
    if(LOCK_ITEMS.indexOf(c.zh)>-1&&d.longevity>=0.90&&d.burst<=0.30){ax.burst*=0.5;ax.tech*=0.5;
      beats.push('锁招与「'+tag+'」职责冲突：盾/受需变招权与长线消耗')}
    ['burst','longevity','punish','tech'].forEach(function(k){sc+=(d[k]||0)*(ax[k]||0)});
    if(ax.burst>=0.5&&d.burst>=0.5)ps.push('P1');
    /* P2 role compression：需同时命中 ≥2 个**高权重**职责轴（d≥0.7）才算真压缩 */
    var need=['burst','longevity','punish','tech'].filter(function(k){return d[k]>=0.7&&(ax[k]||0)>=0.5});
    if(need.length>=2&&!oneShot){sc+=0.35*(need.length-1);ps.push('P2');beats.push('一件道具兼顾 '+need.length+' 项职责')}
    if(oneShot)sc-=0.15;                          /* 一次性道具的机会成本（不能指望第二次） */
    /* P1 直接体现：纯输出职责（d.burst≥0.9）的「主武器」必须提供力度；既无力度也非续航件者与职责不符 */
    if(d.burst>=0.9&&ax.burst>=0.8){sc+=0.45;ps.push('P1');beats.push('主武器：该职责的最大力度来源')}
    else if(d.burst>=0.9&&ax.burst<0.5&&ax.longevity<0.8){sc-=0.35;ps.push('P1');beats.push('与主职责不符（既无力度也非续航件）')}
    /* P3 punish 动态：随环境（钉/强化）与队伍联防需求（ctx.teamHaz）变化 */
    if(ax.punish>=0.5){var pf=(ctx&&ctx.teamHaz?1.25:1)*(0.8+(hazAct?0.30:0)+(boostAct?0.20:0));sc+=ax.punish*pf*0.22;ps.push('P3')}
    /* P4 环境感知（收益按该角色是否真需要"稳住入场/拉长窗口"缩放） */
    if(hazAct&&c.zh==='厚底靴'&&tg.hazWeak){sc+=0.60*Math.min(1,(d.longevity+d.tech)/1.6);ps.push('P4');beats.push('钉子环境：入场不掉血')}
    if(windowRole&&WX_ROCK[effSys]&&c.zh===WX_ROCK[effSys]){sc+=0.70;ps.push('P4');
      beats.push(effSys+'天气窗口延长至 '+WCONF.rockTurnsAbility+' 回合（8→12，考古实证）'+(effSys!==tg.sys0?'；按队伍体系取岩石（窗口由队友提供）':''))}
    if(windowRole&&c.zh==='光之黏土'&&tg.sys.some(itemIsExtendableTerrain)){sc+=0.60;ps.push('P4');beats.push('场地/墙回合延长（考古口径 12）')}
    if(windowRole&&c.zh==='地形延长器'){sc+=0.40;ps.push('P4');beats.push('场地延长至 '+WCONF.terrainExtenderTurns+' 回合（考古实证）')}
    if(c.zh==='防尘护目镜'&&(tg.sys.indexOf('沙')>-1||tg.sys.indexOf('雪')>-1)){sc+=0.30;ps.push('P4')}
    /* P5 ER 协同 */
    if(c.zh==='进化奇石'){
      /* v4.3.2 裁定：权衡通过的非最终形态以奇石为**主推**（EVIO_PRIORITY 是显式裁定常量，不是涌现排序） */
      sc+=EVIO_PRIORITY;ps.push('P5');
      var _fin=null;try{_fin=famFinalOf(s)}catch(e){_fin=null}
      beats.push('综合权衡通过：有效耐久（HP×双防）在奇石加成后超过同族终态'+(ev&&ev.why?'——'+ev.why:'')+(_fin&&_fin.zh?'（对照终态='+_fin.zh+'）':''));
    }
    /* 职责载荷：该职责的兑现物（控速 → 夺先手权道具） */
    if((ROLE_PAYLOAD[tag]||[]).indexOf(c.zh)>-1){sc+=ROLE_PAYLOAD_BONUS;ps.push('P5');beats.push('直接兑现「'+tag+'」职责：夺先手权（围巾=速度×1.5 常驻 / 嘉珍果=速度×2 一次 / 先制之爪=先制概率）')}
    if(c.zh==='黑色污泥'){sc+=0.40;ps.push('P5');beats.push('毒系专属续航')}
    if(c.zh==='剧毒珠'||c.zh==='剧毒宝珠'||c.zh==='火焰宝珠'){sc+=0.35;ps.push('P5');beats.push('特性异常联动（毒疗/毅力类）')}
    if(/宝石$/.test(c.zh)){sc+=0.40;ps.push('P5');beats.push('本系实际属性首击增伤')}
    if(c.id&&RESIST_BERRY_ALL[c.id]){sc+=0.35;ps.push('P5');beats.push('对准实际承受最大弱点')}
    if(/种子$/.test(c.zh)){sc+=0.25;ps.push('P5')}
    if(!ps.length)ps.push('P1');   /* 仅四轴命中 → 基线对位权重（P1）；prin 不允许空，保证 why 可溯源 */
    var bt=(beats.length?beats.join('；'):(c.note||''));
    var why='克制 '+(bt||'—')+'；代价 '+itemCostOf(c)+'｜原则 '+((ps.length?ps:['P1']).join('/'));
    res.push({zh:c.zh,id:c.id,sc:Math.round(sc*1000)/1000,why:why,ax:ax,prin:ps,i:i});
  });
  return res;
}
/* 一次性道具（不能指望第二次：宝石/抗性果/触发水果/披带/气球/香草/红牌/按钮/先制之爪） */
function itemOneShot(zh){
  if(/宝石$/.test(zh)||/果$/.test(zh))return true;
  return ['气势披带','气球','白色香草','心灵香草','力量香草','红牌','逃脱按钮','先制之爪'].indexOf(zh)>-1;
}
/* 反查：某道具 id 是否为抗性果（用于 P5 "对准实际弱点" 加分判定） */
var RESIST_BERRY_ALL=(function(){var o={};Object.keys(RESIST_BERRY).forEach(function(t){o[RESIST_BERRY[t]]=t});return o})();
/* 对位驱动的道具决策入口（替代「角色 → 道具类别」查表） */
function itemDecide(s,side,roleTag,ctx){
  var out=itemScored(s,side,roleTag||'输出',ctx);
  out.sort(function(a,b){return (b.sc-a.sc)||(a.i-b.i)});
  return out.slice(0,3);
}
function buildItem(s,side,roleTag,ctx){
  return itemDecide(s,side,roleTag,ctx).map(function(e){return [e.zh,e.why]});
}
function pickAbiFor(s,side,roleTag){
  var names=s.abis,out=[];
  names.forEach(function(n){
    var id=abiIdByZhOrEn(n),tag=id?ERDATA.abiTags[id]:null,sc=0,why=[];
    var sys=SYS_MAP[n];
    if(sys){sc+=3;why.push('负责'+sys+'体系')}
    if(tag){
      if(tag.out){sc+=3;why.push('输出×'+tag.out.mul+(tag.out.cond?'('+tag.out.cond+')':''))}
      if(tag.im){sc+=2;why.push('免疫'+tag.im.join('/'))}
      if(tag.hf){sc+=1;why.push('减半'+tag.hf.join('/'))}
      if(tag.add){sc+=2;why.push('附加属性/免疫')}
      if(tag.phy&&(roleTag==='肉盾'||roleTag==='受队'||roleTag==='强化')){sc+=1;why.push('物理减伤')}
      if(tag.nt){sc+=1;why.push('关键耐性')}
    }
    if(sc===0&&names.length===1){sc=0;why.push('唯一可选')}
    out.push({n:n,sc:sc,why:why});
  });
  out.sort(function(a,b){return b.sc-a.sc});
  return out;
}
function mkBuild(s,side,name,spBest,phBest,roleTagEx,itemTagEx,ctx){
  /* v4.3：roleTag 由流派对象显式给出（打法 tag）；未给出时回退旧式按流派名推断 */
  var roleTag=roleTagEx||(name.indexOf('肉盾')>-1?'肉盾':(name.indexOf('受队')>-1?'受队':(name.indexOf('天气')>-1?'天气':(name.indexOf('均衡')>-1?'均衡':'输出'))));
  var mv=buildMoves(s,side,roleTag);
  var best=side==='特殊'?spBest:phBest;
  var desc=name+'：'+(best?'本系最高 '+esc(MV[best.id][1])+'('+best.ty+' '+best.pow+')；':'')+
    (mv.main.some(function(x){return FUNC_MV.boost.indexOf(x.id)>-1})?'自带强化轴；':'')+
    (side!=='双刀'?(side==='物理'?'物理输出向':'特攻输出向'):'功能/耐久向');
  /* v4.3.3：道具角色可与招式角色分离（如「天气手槽」招式按输出侧走、道具走天气岩石） */
  return {name:name,side:side,roleTag:roleTag,itemTag:itemTagEx||roleTag,mv:mv,nat:buildNature(s,side,roleTag),it:buildItem(s,side,itemTagEx||roleTag,ctx),abi:pickAbiFor(s,side,roleTag),desc:desc};
}
/* ============ v4.3：战术流派动态推导（07 §4.6；取代 v4.2 的 genBuilds 固定枚举） ============
   三条红线（07 §4.6.0）：① 命名不得用物特二分（禁「物攻队/特攻队/双刀队」作流派名）
     ② 不得写死 18 个标签（体系是可用元素，不是队形）
     ③ 双刀只是「破盾路线」之一，不默认成为第三条流派（R07-35 互斥择优）
   输入 = 四张客观画像：输出 atkProfile / 耐久速度 duratProfile / 特性池 abiProfile / 功能招 funcProfile */
function atkProfile(s){
  var sp=stabBest(s,'特殊'),ph=stabBest(s,'物理'),side=coreSide(s),conv=convOf(s),L=learnC(s);
  return {side:side,sp:sp,ph:ph,power:atkBest(s),powBest:bestPowOf(s,side,conv),
    ok:atkBest(s)>=NEED_CFG.POWER_OK,
    mixed:(side==='双刀')||(!!sp&&!!ph&&sp.pow>=NEED_CFG.MIXED_OK&&ph.pow>=NEED_CFG.MIXED_OK),
    prio:hasAny(L,FUNC_MV.speed)};
}
function duratProfile(s){
  var spd=spdOf(s),bulk=bulkOf(s),b=s.base||[0,0,0,0,0,0];
  var pn=(b[0]||0)+(b[2]||0),sn=(b[0]||0)+(b[4]||0);
  /* v433-3：画像补 phys/spec（与 coreIntensity 同口径：物耐=HP+防御、特耐=HP+特防；≥300 高 / ≥230 中）
     —— 此前画像/需求 why 读 du.phys/du.spec 恒 undefined（键不存在）。 */
  return {spd:spd,bulk:bulk,fast:spd>=NEED_CFG.SPEED_HIGH,slow:spd<=NEED_CFG.SPEED_LOW,bulky:bulk>=NEED_CFG.BULK_HIGH,
    phys:(pn>=300?'高物耐':(pn>=230?'中物耐':'低物耐'))+'('+pn+')',
    spec:(sn>=300?'高特耐':(sn>=230?'中特耐':'低特耐'))+'('+sn+')'};
}
function abiProfile(s){
  var abis=(s.abis||[]).concat(s.inns||[]),im=[],hf=[],out=[],conv=[];
  abis.forEach(function(n){
    var tg=abiTagOf(n);if(!tg)return;
    if(tg.im&&tg.im.length)im.push(n);
    if(tg.hf&&tg.hf.length)hf.push(n);
    if(tg.out)out.push(n);
    if(tg.conv)conv.push(n);
  });
  return {names:abis,im:im,hf:hf,out:out,conv:conv,setter:isSetterAny(s),sys:coreSys(s)};
}
function funcProfile(s){
  var L=learnC(s);
  return {boost:hasAny(L,FUNC_MV.boost),pass:learnHasName(s,'接棒',L),haz:hasAny(L,FUNC_MV.hazard),
    rem:hasAny(L,FUNC_MV.removal),rec:hasAny(L,FUNC_MV.rec),pivot:hasAny(L,FUNC_MV.pivot),
    speed:hasAny(L,FUNC_MV.speed),wear:hasAny(L,FUNC_MV.wear),prot:hasAny(L,FUNC_MV.protect),
    weather:hasAny(L,FUNC_MV.weather),tr:learnHasName(s,'戏法空间',L),tw:learnHasName(s,'顺风',L),
    knock:learnHasName(s,'拍落',L),seed:learnHasName(s,'寄生种子',L)};
}
/* 五画像（07 §4.5.2）：输出 / 耐久 / 速度 / 特性池 / 功能招 + 角色四象限（R07-23） */
function profileOf(s){
  var atk=atkProfile(s),du=duratProfile(s),ab=abiProfile(s),fn=funcProfile(s);
  var role='速攻核心';
  if(du.bulk>=NEED_CFG.BULK_HIGH&&du.slow)role='受队核心';
  else if(fn.boost&&du.bulk>=NEED_CFG.BULK_MID&&!du.fast)role='强化核心';
  else if(du.bulk>=NEED_CFG.BULK_HIGH)role='肉盾核心';
  return {role:role,atk:atk,du:du,ab:ab,fn:fn,side:atk.side,field:ab.sys,
    fast:du.fast,slow:du.slow,bulky:du.bulky,mixed:atk.mixed,power:atk.power,ok:atk.ok,
    hasBoost:fn.boost,hasPass:fn.pass,pivots:fn.pivot,hazards:fn.haz,removal:fn.rem,rec:fn.rec,
    setter:ab.setter,conv:convOf(s),L:learnC(s)};
}
/* 机制前缀（07 §4.6.4：前缀只用机制名——天气/场地/空间/顺风/钉子/强化/接棒/免疫） */
function mechPrefix(p){
  var f=p.field||[],s=p.side;
  if(f.indexOf('晴')>-1)return '晴';
  if(f.indexOf('雨')>-1)return '雨';
  if(f.indexOf('沙')>-1)return '沙';
  if(f.indexOf('雪')>-1)return '雪';
  if(f.length)return '场地';
  if(p.fn.tr)return '空间';
  if(p.slow&&p.ok)return '空间';
  if(p.fn.tw)return '顺风';
  if(p.fn.haz)return '钉子';
  if(p.hasBoost)return '强化';
  if(p.hasPass)return '接棒';
  if(p.ab.im.length||p.ab.hf.length)return '免疫';
  return '';
}
/* 破盾路线互斥择优（R07-35）：强化 / 双刀 / 拍落削道具 / 消耗磨血 —— 只取 1 条，双刀不默认生成 */
function bestBreakingRoute(p){
  var cand=[],sc;
  if(p.hasBoost){sc=p.ok?3:2;cand.push({k:'强化',sc:sc+1})}
  if(p.mixed){sc=(p.atk.ph&&p.atk.sp)?3:2;cand.push({k:'双刀',sc:sc})}
  if(p.fn.knock){cand.push({k:'拍落削道具',sc:2})}
  if(p.bulky){cand.push({k:'消耗磨血',sc:p.du.bulk>=340?3:2})}
  if(!cand.length)return '';
  cand.sort(function(a,b){return b.sc-a.sc});
  return cand[0].k;
}
/* deriveBuilds(s,team)：核心（+可选队友）→ 2~4 条流派 {id,name,side,roleTag,basis≥2,plan,prio} */
/* v4.5：流派 why —— 与配招/道具同一原则层（mvWhyStd）；beat/cost 按**机制**（cand.key）登记，
   原则标签由职责四轴投影主导轴 + 显式补充（P5 协同/P2 多功能/P4 环境） */
var PLAY_KIND={speed:'attack',boost:'boost',tr:'attack',stall:'wear',pivot:'pivot',wx:'weather',imm:'protect',mix:'cover',main:'attack',def:'rec'};
var PLAY_WHY={
  speed:{beat:'超速环境（速度中位 '+medSpe()+'）先手压制、抢节奏',cost:'怕先制招与被耐久反打',prin:['P1','P4']},
  boost:{beat:'站场强化后一次清场（对位=逼换空档）',cost:'强化回合先被打，需耐久/掩护',prin:['P1']},
  tr   :{beat:'戏法空间内低速重炮先手（对位=高速队）',cost:'依赖空间窗口（'+WCONF.trickroomTurns+' 回合）与空间手存活',prin:['P1','P2']},
  stall:{beat:'钉子+回复双确认的长线消耗（对位=慢速队/换人成本）',cost:'主动节奏慢，怕高爆发与除钉',prin:['P3','P4']},
  pivot:{beat:'轮转保节奏、专打对位差（对位=换人博弈）',cost:'输出切走，依赖队友补刀',prin:['P2']},
  wx   :{beat:'体系窗口内增伤清场（×'+(1+WCONF.boost)+'，窗口 '+WCONF.manualDurTurns+' 回合）',cost:'窗口外收益回到基线',prin:['P4','P5']},
  imm  :{beat:'免疫/减伤轴吃对位（顶特定属性输出）',cost:'功能位占格、输出偏低',prin:['P2','P5']},
  mix  :{beat:'双刀破盾（双侧本系达标，打穿单侧盾）',cost:'努力值分散，单项力度不及专精',prin:['P1']},
  main :{beat:'本系最高威力主武器压制',cost:'单一输出轴，遇本系盲点需队友补',prin:['P1']},
  def  :{beat:'耐久+回复的稳健联防',cost:'缺乏主动压制力',prin:['P2','P3']}};
/* ===== v45 修复层（验证代理 v45-1/2/3；只改本文件，零扩面） =====
   v45-1：流派卡 × 队伍行 **同一道具口径**。此前流派卡把「打法 tag」直接当道具 tag →
          盾/受系核心的强化流派被推锁招道具（讲究围巾），与队伍行主推（剩饭/凸凸头盔/厚底靴）矛盾
          —— 属 v433-1 在流派卡侧的残留；现统一走 coreItemTagOf（与 itemTagOfCore 同判据）。 */
function boostCandIds(s,side){
  /* 强化招候选序（原 buildMoves 内联逻辑抽出）：侧过滤 + 天气感知（晴→生长/光合；雨→诡计/剑舞） */
  var learn=learnOf(s);function h(id){return learn.indexOf(id)>-1}
  var sys=coreSys(s);
  var ids=side==='双刀'?[504,526].concat(FUNC_MV.boost):((side==='特殊'?FUNC_MV.boostSpec:FUNC_MV.boostPhys).concat([504,526]));
  if(sys.indexOf('晴')>-1){var b2=[];if(h(74))b2.push(74);if(h(235))b2.push(235);if(b2.length)ids=b2.concat(ids)}
  if(sys.indexOf('雨')>-1){var b3=[];if(side==='特殊'&&h(417))b3.push(417);if(side==='物理'&&h(14))b3.push(14);if(b3.length)ids=b3.concat(ids)}
  return ids;
}
function coverMoveFor(s,side,blinds,conv,cur){
  /* v45-3：本侧可学、对**盲点**（防守属性）≥2x 的最高威力招；无则 null（不可学 → 允许保留盲点标注）
     matchup 口径：matchup[防守属性][攻击属性] = 该攻击属性打防守属性的倍率 */
  if(!blinds||!blinds.length)return null;
  var learn=learnOf(s),best=null;
  learn.forEach(function(id){
    var m=MV[id];if(!m||m[4]==='变化')return;
    if(side!=='双刀'&&m[4]!==(side==='物理'?'物理':'特殊'))return;
    var pow=m[5]||0;if(pow<60)return;
    if(cur.indexOf(id)>-1)return;
    var ty=effMvType(s,m,conv),ti=tIdx(ty);
    if(ti<0)return;
    var hit=blinds.filter(function(t){var di=tIdx(t);return di>-1&&ERDATA.matchup[di][ti]===2});
    if(!hit.length)return;
    var v=pow*hit.length;
    if(!best||v>best.v)best={id:id,ty:ty,hit:hit,pow:pow,v:v};
  });
  return best;
}
function deriveBuilds(s,team){
  var p=profileOf(s),arr=[],teamArr=[];
  (team||[]).forEach(function(x){var t=x&&x.s?x.s:x;if(t&&''+t.id!==''+s.id)teamArr.push(t)});
  var qs=[];teamArr.forEach(function(t){qs.push(profileOf(t))});
  var fastCount=(p.fast?1:0),slowCount=(p.slow?1:0),pivCount=(p.fn.pivot?1:0),immCount=0;
  var trSetter=p.fn.tr,setters=(p.setter?1:0),abusers=(p.field.length?1:0),hazRec=(p.fn.haz&&p.fn.rec);
  qs.forEach(function(q){
    if(q.fast)fastCount++;if(q.slow)slowCount++;if(q.fn.pivot)pivCount++;
    if(q.ab.im.length||q.ab.hf.length)immCount++;
    if(q.fn.tr)trSetter=true;if(q.setter)setters++;if(q.field.length)abusers++;
    if(!(q.fn.haz&&q.fn.rec))hazRec=true;
  });
  if(p.ab.im.length||p.ab.hf.length)immCount++;
  var pref=mechPrefix(p),cand=[];
  /* 破盾路线互斥择优（07 §4.6.3 ⑤；R07-35）——提前计算：⑥ 增伤轴 tag 要据此避重 */
  var route=bestBreakingRoute(p);
  /* ① 输出侧（R07-30）：高速个体 ≥2 且力度达标 */
  if(fastCount>=2&&p.ok)cand.push({key:'speed',base:(p.hasBoost?'速攻强化清场':'速攻压制'),tag:'输出',sc:6+fastCount,
    drivenBy:['速度 '+p.du.spd.toFixed(0)+'（≥'+NEED_CFG.SPEED_HIGH+' 高线）','高速个体 '+fastCount+' 只','力度 '+p.power+' 达标']});
  /* ② 强化侧（R07-31）：强化招命中且耐久够站场 */
  if(p.hasBoost&&p.du.bulk>=NEED_CFG.BULK_MID)cand.push({key:'boost',base:'强化清场',tag:'强化',sc:5+(p.bulky?2:1),
    drivenBy:['可学强化招','耐久三角 '+p.du.bulk+'（≥'+NEED_CFG.BULK_MID+' 可站场强化）']});
  /* ③ 空间侧（R07-32）：低速个体 ≥2 且队内有戏法空间 */
  if(slowCount>=2&&p.ok&&trSetter)cand.push({key:'tr',base:'慢速重炮',tag:'输出',sc:5+slowCount,
    drivenBy:['低速个体 '+slowCount+' 只（≤'+NEED_CFG.SPEED_LOW+'）','队内含戏法空间','力度 '+p.power+' 高']});
  /* ④ 消耗侧（R07-33）：耐久高 且 钉子+回复均命中 */
  if(p.bulky&&hazRec)cand.push({key:'stall',base:'受队消耗',tag:'受队',sc:5+(p.du.bulk>=340?2:1),
    drivenBy:['耐久三角 '+p.du.bulk+' 高','钉子+回复双确认']});
  /* ⑤ 节奏侧（R07-34）：轮转招命中 ≥2 只 */
  if(pivCount>=2)cand.push({key:'pivot',base:'轮转补盲',tag:'轮转',sc:4+pivCount,
    drivenBy:['轮转招持有者 '+pivCount+' 只']});
  /* ⑥ 机制侧：天气/场地增伤轴 */
  if(p.field.length&&(abusers||setters))cand.push({key:'wx',base:'增伤清场',tag:((p.fn.boost&&route!=='强化')?'强化':(route==='强化'?'增伤':'输出')),sc:5+(p.setter?1:0),  /* ↑ route=强化 时 ② 已占用强化轴 → 本轴改「输出」：两卡配招不再重复 */
    drivenBy:['体系 '+p.field.join('/'),p.setter?'自身为体系设置手':'队友体系受益 '+abusers+' 只']});
  /* ⑦ 防守侧：免疫/减伤 ≥2 只 */
  if(immCount>=2)cand.push({key:'imm',base:'减伤轴',tag:'肉盾',sc:4+immCount,
    drivenBy:['免疫/减伤特性持有者 '+immCount+' 只']});
  cand.sort(function(a,b){return b.sc-a.sc});
  cand=cand.slice(0,4);
  /* 破盾路线：互斥择优；命中「双刀」才生成双刀破盾流派（不默认第三条） */
  if(route==='双刀'&&cand.length<4)cand.push({key:'mix',base:'破盾',tag:'输出',sc:3,side:'双刀',
    drivenBy:['双侧本系达标（物 '+(p.atk.ph?p.atk.ph.pow:0)+' / 特 '+(p.atk.sp?p.atk.sp.pow:0)+'）','破盾路线择优=双刀']});
  /* 兜底（07 §4.6.4 ④）：不足 2 条 → 主力输出 + 主要防守手段 */
  if(cand.length<2){
    if(!cand.length||cand[0].key!=='speed')cand.push({key:'main',base:'主力输出压制',tag:'输出',sc:2,
      drivenBy:['力度 '+p.power+' / 本系最高折算威力 '+(p.atk.powBest||'—')]});
    if(cand.length<2)cand.push({key:'def',base:(p.fn.rec?'稳健联防消耗':'稳健联防'),tag:'肉盾',sc:1,
      drivenBy:['耐久三角 '+p.du.bulk,p.fn.rec?'自带回复手段':'靠队友回复']});
  }
  var spBest=stabBest(s,'特殊'),phBest=stabBest(s,'物理'),out=[];
  cand.forEach(function(c,i){
    var side=c.side||coreSide(s),nm=(pref?pref:'')+c.base,roleTag=c.tag;
    /* v4.3.3：自身即天气/场地设置手时，道具位按「天气」角色走（天气岩石/光之黏土等） */
    /* v45-1：道具 tag 改用**与队伍行同源的核心口径**（coreItemTagOf），不再用打法 tag
       —— 盾/受系核心的强化流派不再被推锁招道具；ctx 同源（体系窗口，v433-2） */
    var b=mkBuild(s,side,nm,spBest,phBest,roleTag,itemTagOfCoreProf(p,s),coreItemCtxOf(s));
    b.name=nm;b.side=side;b.roleTag=roleTag;
    var basis=[];
    if(p.atk.powBest)basis.push({k:'output',txt:'本系最高 '+(side==='特殊'?(p.atk.sp?MV[p.atk.sp.id][1]+'('+p.atk.sp.pow+')':''):(p.atk.ph?MV[p.atk.ph.id][1]+'('+p.atk.ph.pow+')':''))+'　力度 '+p.power});
    if(p.field.length)basis.push({k:'field',txt:'体系 '+p.field.join('/')+(p.setter?'（自身设置手）':'（队友提供窗口）')});
    if(p.hasBoost&&(roleTag==='强化'||c.key==='speed'))basis.push({k:'boost',txt:'强化路径：'+(p.fn.boost?'可学强化招（攻/特攻双倍型优先）':'无')});
    if(c.key==='tr')basis.push({k:'speed',txt:'速度 '+p.du.spd+' 低（空间内先手）'});
    if(c.key==='pivot')basis.push({k:'pivot',txt:'轮转招（急速折返/伏特替换）'});
    if(c.key==='stall')basis.push({k:'stall',txt:'耐久 '+p.du.bulk+' + 钉子/回复双确认'});
    if(c.key==='imm')basis.push({k:'abi',txt:'免疫/减伤特性：'+p.ab.im.concat(p.ab.hf).slice(0,3).join('/')});
    if(c.key==='mix')basis.push({k:'break',txt:'破盾路线择优 = 双刀（与强化/拍落/消耗互斥，只取 1 条）'});
    if(route&&c.key!=='mix')basis.push({k:'route',txt:'破盾路线择优 = '+route});
    if(p.atk.prio&&(c.key==='speed'||c.key==='main'))basis.push({k:'prio',txt:'自带先制招'});
    while(basis.length<2)basis.push({k:'role',txt:'定位：'+p.role+'（速度 '+p.du.spd+' / 耐久 '+p.du.bulk+'）'});
    b.basis=basis.slice(0,5);b.drivenBy=c.drivenBy||[];b.score=c.sc;b.prio=i+1;b.id='P'+(i+1);b.prof=p;
    /* v4.5：流派 why = 同一原则层格式（克制 X；代价 Y｜原则 P…） */
    var _pw=PLAY_WHY[c.key]||PLAY_WHY[(c.key==='wx'?'wx':(c.key==='mix'?'mix':'main'))];
    b.why=mvWhyStd(PLAY_KIND[c.key]||'attack',roleTag,{beat:_pw.beat,cost:_pw.cost,prin:_pw.prin});
    /* ---- v45-2：流派命名 × 实际招组对齐 ----
       触发：roleTag=强化 但 4 槽无强化招（如凤王「顺风强化清场」：可学强化仅冥想=特殊侧，物理侧无）
       ① 本侧有可学强化招 → 补入槽（替换末位功能槽）；② 无 → **改名不称「强化」**（增伤/主力）+ role 与 why 同步 */
    if(roleTag==='强化'){
      var _hasB=(b.mv.main||[]).some(function(sl){return (sl.kind||mvKindOf(sl.id))==='boost'});
      if(!_hasB){
        var _bid=hasMv(learnOf(s),boostCandIds(s,side));
        if(_bid){
          var _bi=b.mv.main.length-1;
          while(_bi>=0&&['cover','wear','speed','protect','rec','hazard','pivot'].indexOf(b.mv.main[_bi].kind)<0)_bi--;
          if(_bi<0)_bi=b.mv.main.length-1;
          b.mv.main[_bi]={id:_bid,kind:'boost',tag:'强化',
            why:['强化招（'+side+'侧优先）',mvWhyStd('boost',roleTag,{id:_bid,prin:['P1']})]};
          b.boostFixed=side;
        }else{
          var _nw=(p.field&&p.field.length?'增伤':'主力');
          if(nm.indexOf('强化')>-1)nm=nm.replace('强化',_nw); else _nw='强化';
          b.name=nm;b.desc=(b.desc||'').replace('强化',_nw);
          if(nm.indexOf('强化')<0){b.roleTag=roleTag=(p.field&&p.field.length?'增伤':'输出');
            b.basis=(b.basis||[]).map(function(x){return x.k==='boost'
              ?{k:'boost',txt:'本侧（'+side+'）无可用强化招 → 流派按「'+_nw+'」打法命名'}:x});
            var _pk=(p.field&&p.field.length)?'wx':'main';
            b.why=mvWhyStd(PLAY_KIND[_pk],roleTag,{beat:PLAY_WHY[_pk].beat,cost:PLAY_WHY[_pk].cost,prin:PLAY_WHY[_pk].prin});
            b.namedByMoves=true}
        }
      }
    }
    /* ---- v45-3：补盲驱动 ----
       卡面若将标注盲点，先尝试在槽内补「该盲点 ≥2x」的可学招（可学者补入；不可学 / 功能位不可让 → 保留标注并写明原因） */
    try{
      var _convB=convOf(s),_idsB=b.mv.main.map(function(sl){return sl.id});
      var _blB=blindList(setCoverProfile(s,_idsB,_convB));
      /* 补盲优先级（保留既有 UI 语义）：① 另一侧可覆盖 → 「双刀补盲」提示（不动槽）
                                    ② 否则同侧补入（可学才补；不可学 / 无空位 → 保留标注并写明原因） */
      var _altB=null;
      if(side!=='双刀'){try{var _aaB=pickAttacks(s,side==='物理'?'特殊':'物理',2,roleTag);
        if(_aaB.length)_altB=setCoverProfile(s,_aaB.map(function(x){return x.id}),_convB)}catch(eA){}}
      var _crossB=(_blB.length&&_altB)?_blB.filter(function(t){return _altB[t]>=1}):[];
      if(_crossB.length){b.crossCover=_crossB}
      else if(_blB.length){
        var _cvB=coverMoveFor(s,side,_blB,_convB,_idsB);
        if(_cvB){
          var _dB=-1;
          for(var _kB=b.mv.main.length-1;_kB>0;_kB--){
            if(['cover','wear','protect','hazard','speed','pivot'].indexOf(b.mv.main[_kB].kind)>-1){_dB=_kB;break}}
          if(_dB>-1){
            b.mv.main[_dB]={id:_cvB.id,kind:'cover',tag:'补盲',
              why:['威力'+_cvB.pow,'覆盖盲点 '+_cvB.hit.map(function(t){return tlabel(t)}).join('/')+'（×2 以上）',
                mvWhyStd('cover',roleTag,{id:_cvB.id,tys:_cvB.hit,cover:_cvB.hit.length,prin:['P2']})]};
            b.coverFixed={now:_cvB.id,tys:_cvB.hit};
          }else{
            /* 4 槽全为主攻/强化/回复（受保护职能）→ 不强行替换；记录「可换入的补盲招 + 将被放弃的招」供 UI 透明披露 */
            var _dl=-1;
            for(var _m2=b.mv.main.length-1;_m2>=0;_m2--){
              if(['rec','boost'].indexOf(b.mv.main[_m2].kind)>-1){_dl=b.mv.main[_m2].id;break}}
            b.blindNoRoom={id:_cvB.id,tys:_cvB.hit,drop:(_dl>-1?_dl:null)};
          }
        }
      }
    }catch(eB){}
    delete b.mv.funcs;
    out.push(b);
  });
  out.breakingRoute=route;
  return out;
}
function coreWeak(s){
  var wk=[];
  ERDATA.types.forEach(function(at){if(defCellTrio(s,at).inn>1)wk.push(at)});
  return wk;
}
function coverHoles(s){
  var ai=tIdx(s.t1),bi=tIdx(s.t2);
  var holes=[];
  ERDATA.types.forEach(function(t){
    if(t==='星晶'||t==='无'||t==='神秘')return;
    var ti=tIdx(t),v=ERDATA.matchup[ai][ti]*(bi>-1?ERDATA.matchup[bi][ti]:1);
    if(v<2)holes.push(t); /* 本系最多 1x 视为盲点 */
  });
  return holes;
}
function hasAny(learn,ids){return ids.some(function(id){return learn.indexOf(id)>-1})}
/* 最终形态判定（v4.3.1 拆分）：gameData evolutions 含 kd==0（普通进化）的为非最终；kd==1（Mega/道具）仍算最终。
   isFinalForm(s) = 纯物种属性（与 UI 开关无关）；isFinalSp(s) = 受 optFinalOnly 开关控制的历史语义（兼容旧调用方） */
/* EV-3：优先消费构建期按 ER CanEvolve（kd∈{0,3,4}）派生的 nonFinalER，回退数据层旧字段 nonFinal（kd==0） */
var _NF_ER=null;
function nonFinalSet(){
  if(!_NF_ER){var src=(ERDATA.nonFinalER&&ERDATA.nonFinalER.length)?ERDATA.nonFinalER:(ERDATA.nonFinal||[]);
    _NF_ER={};for(var i=0;i<src.length;i++)_NF_ER[''+src[i]]=1}
  return _NF_ER;
}
function isFinalForm(s){return !nonFinalSet()[''+s.id]}
function isFinalSp(s){return !optFinalOnly||isFinalForm(s)}
/* ============ v4.3.2 进化奇石「权衡模型」（用户裁定：反对僵硬规则） ============
   ① 奇石**仅对非最终形态生效**（双防 ×1.5），对最终形态完全无效 → 最终形态绝不推荐奇石（buildItem/coreItem 门控）。
   ② 非最终形态不再「双防一比就入选」，改为**综合价值权衡**（进化型可带别的道具，且 HP/速度/力度奇石都不加）：
        对照 A = 本形态 + 进化奇石（双防×1.5）
        对照 B = 同族最终形态 + 其最优道具（按 buildItem 既有逻辑取首位）→ itemGainOf() 折算道具增益
   ③ 四维（权重集中在 EVIO.TW；每维取相对比差 ∈[-1,1]）：
        d_bulk 有效耐久 = HP×DEF×SpD（A 双防×1.5；B 含道具 def/spdef 增益，如突击背心特防×1.5）
        d_out  输出     = 本系最高威力 stabBest(核心侧) × 对应攻种族（A 裸值；B 含道具 out 增益，如生命宝珠1.3/讲究系1.5）
        d_spe  速度线   = spdFit() 体系感知（空间→越低越优；晴/雨速攻→越高越优；其余弱权重）
        d_util 功能价值 = 特性标签（im2/hf1/out1/add1/def1/conv1/nt1）+ 功能招数 + 道具功能（头盔/披带）
        S = TW.bulk×d_bulk + TW.out×d_out + TW.spd×d_spe + TW.util×d_util
   ④ 入选**双门**（避免「刚超一点就入选」）：d_bulk > 0（奇石确实换来更高有效耐久）且 S ≥ EVIO.TRADE_MIN。
        未过门 → 不入选并给出权衡结论（evioVeto(s).why 列双方对比：奇石双防 vs 进化型+道具/速度/力度）；
        无同族终态可对照 → 保留绝对阈值兜底（BULK_MIN/ATK_MIN）。
   ⑤ 否决可见（v432-1）：evioVetoSummary(core) 汇总「有族且被否决」的非最终形态，在核心配队页渲染
        「🪨 奇石权衡否决 N 只」折叠块（低样式，不占主推荐位；每行=精灵图+名称+#id+对照终态与道具+有效耐久+S/d_bulk+ℹ️依据）；
        宝可梦详情页同步一行（否决=黄框「奇石权衡否决（不推荐带进化奇石）：why」／通过=「奇石权衡通过：why」）。
        权衡结果按「物种|体系|空间|侧」缓存（_evioMemo）；汇总按核心缓存（_evioVSum）。
   口径登记：itemGainOf 为**模型级近似**（非引擎数值）；体系上下文缺省时用候选自身体系/速度近似。 */
var EVIO={BULK_MULT:1.5,BULK_MIN:380,ATK_MIN:85,RATIO:1.0,RATIO_SOFT:0.92,PTS:2,
  TRADE_MIN:0.12,TW:{bulk:1.0,out:0.9,spd:0.7,util:0.5},SPD_FAST:['晴','雨'],SPD_SLOW_LEVEL:60};
function evioBulk(s){return bstI(s,0)+EVIO.BULK_MULT*bstI(s,2)+EVIO.BULK_MULT*bstI(s,4)}
function famFinalOf(s){
  /* EV-3：优先用构建期由 gameData 进化链派生的终态（覆盖 familyRoot 缺失的族，如煤炭龟→炎玄武） */
  var m=(ERDATA.finalOf||{})[''+s.id];
  if(m!==undefined&&m!==null){var g=spId2Obj(m);if(g&&''+g.id!==''+s.id)return g}
  var r=(ERDATA.familyRoot||{})[''+s.id];if(r===undefined||r===null)return null;var f=spId2Obj(r);return (f&&''+f.id!==''+s.id)?f:null}
/* ============ v4.3.3 道具池 ITEM_POOL（54 项，8 类；取代裸 10 项 ITEM_GAIN 评分） ============
   来源：内嵌 ERDATA.items（[id,en,zh,descEn]）；类别按数据层名称/描述/字段判定。
   数值口径：**一律考古实证**——天气岩石 = 延长天气至 WCONF.rockTurnsAbility/Manual（8→12 回合）；
             地形延长器 = WCONF.terrainExtenderTurns（12）；光之黏土/墙 = 考古口径 12。
   gain 为**模型级近似**（非引擎数值），仅供代价/收益折算与奇石权衡使用。类别依据见各行 why。
   roles = 适用打法 tag（天气/场地/强化/轮转/游击/控速/肉盾/受队/增伤/输出/均衡）；cond 为可选门槛（在 buildItem 内判定）。
   注：数据层 zh 缺失者（Weakness Policy#322 / Heavy-Duty Boots#352 / Bright Powder#240 /
       Terrain Extender#326 / 多数属性宝石）展示层用自拟中文，已登记待数据层补。 */
var ITEM_POOL=[
  /* ① 输出 */
  {id:301,zh:'生命宝珠',en:'Life Orb',cls:'输出',gain:{out:1.3},roles:['输出','均衡','增伤'],why:'1.3 倍伤害（每回合自伤 1/10）'},
  {id:247,zh:'讲究头带',en:'Choice Band',cls:'输出',gain:{out:1.5},roles:['输出'],why:'物攻×1.5（锁招）'},
  {id:286,zh:'讲究眼镜',en:'Choice Specs',cls:'输出',gain:{out:1.5},roles:['输出'],why:'特攻×1.5（锁招）'},
  {id:290,zh:'节拍器',en:'Metronome',cls:'输出',gain:{out:1.4},roles:['输出'],why:'连续使用同一招递增（约 ×1.4 上限）'},
  {id:293,zh:'达人带',en:'Expert Belt',cls:'输出',gain:{out:1.2},roles:['输出','均衡'],why:'效果绝佳时增伤 ×1.2'},
  {id:291,zh:'力量头带',en:'Muscle Band',cls:'输出',gain:{out:1.1},roles:['输出'],why:'物攻招小幅增伤'},
  {id:292,zh:'博识眼镜',en:'Wise Glasses',cls:'输出',gain:{out:1.1},roles:['输出'],why:'特攻招小幅增伤'},
  {id:323,zh:'突击背心',en:'Assault Vest',cls:'输出',gain:{spdef:1.5},roles:['输出','肉盾'],why:'特防×1.5（只能出攻击招）'},
  {id:302,zh:'剧毒宝珠',en:'Toxic Orb',cls:'输出',gain:{util:0.5},roles:['肉盾','强化'],why:'毒疗/毅力配合（每回合中毒）'},
  {id:303,zh:'火焰宝珠',en:'Flame Orb',cls:'输出',gain:{util:0.5},roles:['输出','肉盾'],why:'毅力/适应力配合（每回合灼伤）'},
  {id:322,zh:'弱点保险',en:'Weakness Policy',cls:'输出',gain:{util:0.5},roles:['强化','输出'],why:'被弱点命中时攻/特攻 +2（强化轴核心）'},
  {id:313,zh:'气球',en:'Air Balloon',cls:'输出',gain:{util:0.4},roles:['输出','轮转'],why:'免疫地面招（一次性）'},
  /* ② 防御续航 */
  {id:273,zh:'剩饭',en:'Leftovers',cls:'防御续航',gain:{def:1.06,spdef:1.06},roles:['肉盾','受队','均衡'],why:'每回合回 1/16'},
  {id:79,zh:'文柚果',en:'Sitrus Berry',cls:'防御续航',gain:{def:1.05,spdef:1.05},roles:['肉盾','受队'],why:'半血回 1/4'},
  {id:305,zh:'黑色污泥',en:'Black Sludge',cls:'防御续航',gain:{def:1.06,spdef:1.06},roles:['肉盾'],why:'毒系每回合回 1/16（非毒系反伤）'},
  {id:78,zh:'木子果',en:'Lum Berry',cls:'防御续航',gain:{util:0.5},roles:['肉盾','输出'],why:'解除一次异常状态'},
  {id:76,zh:'橙橙果',en:'Oran Berry',cls:'防御续航',gain:{def:1.02},roles:['肉盾'],why:'残血回 10 HP（一次性）'},
  {id:129,zh:'星桃果',en:'Starf Berry',cls:'防御续航',gain:{util:0.6},roles:['强化'],why:'残血随机大幅提升一项能力'},
  {id:125,zh:'沙鳞果',en:'Salac Berry',cls:'防御续航',gain:{spe:1.2,util:0.3},roles:['强化','输出'],why:'残血速度 +1（先手权）'},
  {id:130,zh:'释陀果',en:'Micle Berry',cls:'防御续航',gain:{util:0.4},roles:['控速','输出'],why:'残血命中率 +1'},
  {id:131,zh:'嘉珍果',en:'Custap Berry',cls:'防御续航',gain:{util:0.6},roles:['控速','肉盾'],why:'残血当回合先制'},
  {id:312,zh:'凸凸头盔',en:'Rocky Helmet',cls:'防御续航',gain:{util:1},roles:['肉盾','受队'],why:'物攻手碰瓷（1/6 反伤）'},
  {id:287,zh:'气势披带',en:'Focus Sash',cls:'防御续航',gain:{util:0.6},roles:["输出","强化","天气"],why:'满血时保底留 1 HP'},
  /* ③ 天气场地 */
  {id:297,zh:'炽热岩石',en:'Heat Rock',cls:'天气场地',gain:{util:0.8},roles:['天气'],why:'延长晴天（8→12 回合，考古实证）'},
  {id:298,zh:'潮湿岩石',en:'Damp Rock',cls:'天气场地',gain:{util:0.8},roles:['天气'],why:'延长雨天（8→12 回合，考古实证）'},
  {id:296,zh:'光滑岩石',en:'Smooth Rock',cls:'天气场地',gain:{util:0.8},roles:['天气'],why:'延长沙暴（8→12 回合，考古实证）'},
  {id:295,zh:'冰冷岩石',en:'Icy Rock',cls:'天气场地',gain:{util:0.8},roles:['天气'],why:'延长冰雹/雪（8→12 回合，考古实证）'},
  {id:294,zh:'光之黏土',en:'Light Clay',cls:'天气场地',gain:{util:0.8},roles:['场地'],why:'光墙/反射壁/极光幕回合延长（考古口径 12）'},
  {id:326,zh:'地形延长器',en:'Terrain Extender',cls:'天气场地',gain:{util:0.8},roles:['场地'],why:'场地延长至 12 回合（考古实证）'},
  {id:328,zh:'电气种子',en:'Electric Seed',cls:'天气场地',gain:{util:0.5},roles:['场地','增伤'],why:'电气场地上防御 +1（一次性）'},
  {id:331,zh:'青草种子',en:'Grassy Seed',cls:'天气场地',gain:{util:0.5},roles:['场地','增伤'],why:'青草场地上防御 +1（一次性）'},
  {id:330,zh:'薄雾种子',en:'Misty Seed',cls:'天气场地',gain:{util:0.5},roles:['场地'],why:'薄雾场地上特防 +1（一次性）'},
  {id:329,zh:'精神种子',en:'Psychic Seed',cls:'天气场地',gain:{util:0.5},roles:['场地'],why:'精神场地上特防 +1（一次性）'},
  /* ④ 控速机动 */
  {id:285,zh:'讲究围巾',en:'Choice Scarf',cls:'控速机动',gain:{out:1.5,spe:1.5},roles:['轮转','游击','输出','控速'],why:'速度×1.5 抢手权（锁招）'},
  {id:317,zh:'逃脱按钮',en:'Eject Button',cls:'控速机动',gain:{util:0.5},roles:['轮转','肉盾'],why:'被打即换人（保轮转节奏）'},
  {id:314,zh:'红牌',en:'Red Card',cls:'控速机动',gain:{util:0.5},roles:['肉盾','轮转'],why:'被击中时逼退对手'},
  {id:240,zh:'光粉',en:'Bright Powder',cls:'控速机动',gain:{util:0.4},roles:['肉盾'],why:'对手命中率下降'},
  {id:244,zh:'先制之爪',en:'Quick Claw',cls:'控速机动',gain:{util:0.5},roles:['控速','肉盾'],why:'概率先手'},
  {id:288,zh:'广角镜',en:'Wide Lens',cls:'控速机动',gain:{util:0.4},roles:['输出'],why:'命中率 ×1.1'},
  {id:289,zh:'对焦镜',en:'Zoom Lens',cls:'控速机动',gain:{util:0.3},roles:['肉盾'],why:'后手时命中率提升'},
  {id:256,zh:'焦点镜片',en:'Scope Lens',cls:'控速机动',gain:{util:0.3},roles:['输出'],why:'暴击率提升'},
  {id:275,zh:'锐利之爪',en:'Razor Claw',cls:'控速机动',gain:{util:0.3},roles:['输出'],why:'暴击率提升'},
  /* ⑤ 钉子反钉 */
  {id:352,zh:'厚底靴',en:'Heavy-Duty Boots',cls:'钉子反钉',gain:{util:0.8},roles:['轮转','肉盾','输出'],why:'入场免疫钉子（撒菱/隐形岩/毒菱/粘网）'},
  {id:324,zh:'防尘护目镜',en:'Safety Goggles',cls:'钉子反钉',gain:{util:0.6},roles:['天气','肉盾'],why:'免疫沙暴/冰雹伤害与粉末类招'},
  /* ⑥ 属性减伤果（联防兜底） */
  /* ⑥ 属性减伤果（**动态**：按该宝可梦实际承受的最大弱点解析——双属性/天性/-ate 转换一起算，P5） */
  {dynamic:'resist',ids:[105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,122,121],
   zh:'属性减伤果',en:'* Resist Berry',cls:'减伤果',gain:{util:0.4},roles:['肉盾','轮转'],
   why:'对准对位弱点的属性减伤果：中一次该属性伤害减半（一次性，按实际承受倍率选取）'},
  /* ⑦ 香草（一次性状态/能力管理） */
  {id:241,zh:'白色香草',en:'White Herb',cls:'香草',gain:{util:0.4},roles:['强化','输出'],why:'恢复被降低的能力（配合近身战/过热）'},
  {id:246,zh:'心灵香草',en:'Mental Herb',cls:'香草',gain:{util:0.4},roles:['肉盾','强化'],why:'解除一次着迷/挑衅/封锁'},
  {id:284,zh:'力量香草',en:'Power Herb',cls:'香草',gain:{util:0.4},roles:['输出','增伤'],why:'蓄力招当回合发动（一次性）'},
  /* ⑧ 奇石（仅非最终形态；判定沿用 EVIO 权衡模型） */
  {id:310,zh:'进化奇石',en:'Eviolite',cls:'奇石',gain:{def:1.5,spdef:1.5},roles:['肉盾','强化','输出'],why:'双防×1.5（仅非最终形态生效；是否推荐见奇石权衡）'},
  /* ⑨ 属性宝石（动态：按本系属性取对应宝石，ER 内 18 枚 #332-349） */
  {dynamic:'gem',ids:[332,333,334,335,336,337,338,339,340,341,342,343,344,345,346,347,348,349],zh:'属性宝石',en:'* Gem',cls:'输出',
   gain:{out:1.3,util:0.3},roles:['输出','增伤'],why:'同属性首击增伤 ×1.3（单次消耗）'}
];
var GEM_TYPE={'虫':332,'恶':333,'龙':334,'电':335,'妖精':336,'格斗':337,'火':338,'飞行':339,'幽灵':340,'草':341,'地面':342,'冰':343,'一般':344,'毒':345,'超能':346,'岩石':347,'钢':348,'水':349};
var WX_ROCK={'晴':'炽热岩石','雨':'潮湿岩石','沙':'光滑岩石','雪':'冰冷岩石'};
var TERRAIN_SEED={'电场':'电气种子','青草场地':'青草种子','薄雾场地':'薄雾种子','精神场地':'精神种子'};
var TERR_SYS=['电场','青草场地','薄雾场地','精神场地','剧毒场地'];
var WX_SYS=['晴','雨','沙','雪'];
/* 属性宝石池（zh→id 校验用）：ITEMS 内动态项不含固定 id */
var ITEM_POOL_GAIN={};ITEM_POOL.forEach(function(p){if(!p.dynamic)ITEM_POOL_GAIN[p.zh]=p.gain});
/* 兼容旧名（EVIO/奇石权衡仍调 itemGainOf）：池未收录者回退此表 */
var ITEM_GAIN_FALLBACK={'生命宝珠':{out:1.3},'讲究头带':{out:1.5},'讲究眼镜':{out:1.5},'讲究围巾':{out:1.5,spe:1.5},
  '突击背心':{spdef:1.5},'剩饭':{def:1.06,spdef:1.06},'文柚果':{def:1.05,spdef:1.05},
  '凸凸头盔':{util:1},'气势披带':{util:0.6},'进化奇石':{def:1.5,spdef:1.5}};
function itemGainOf(n){return ITEM_POOL_GAIN[n]||ITEM_GAIN_FALLBACK[n]||{}}
/* 该宝可梦可设置/受益的体系（设置手优先置前）——道具规则用 */
function itemSysOf(s){
  var sets=[],syss=[],i;
  try{syss=(coreSys(s)||[]).slice(0)}catch(e){syss=[]}
  (s.abis||[]).concat(s.inns||[]).forEach(function(n){
    var v=SYS_SET[n];if(v&&sets.indexOf(v)<0)sets.push(v);
    var m=SYS_MAP[n];if(m&&syss.indexOf(m)<0)syss.push(m);
  });
  for(i=sets.length-1;i>=0;i--){if(syss.indexOf(sets[i])<0)syss.unshift(sets[i])}
  return syss;
}
function itemGemFor(s){
  /* 标签用**纯属性名**（勿用 tlabel：它输出 <span class="t …"> 标签，会被当字面 HTML 渲染） */
  var order=[s.t1,s.t2],i;
  for(i=0;i<2;i++){var g=GEM_TYPE[order[i]];if(g)return {id:g,zh:'「'+order[i]+'」宝石',why:'同属性首击增伤 ×1.3（单次消耗）'}}
  return null;
}
function itemIsWeather(x){return WX_SYS.indexOf(x)>-1}
function itemIsTerrain(x){return TERR_SYS.indexOf(x)>-1}
/* 可被「光之黏土/地形延长器/种子」服务的场地（ER 无剧毒场地的延长道具与种子） */
function itemIsExtendableTerrain(x){return x!=='剧毒场地'&&TERR_SYS.indexOf(x)>-1}
/* 钉子弱侧近似（入场吃隐形岩 ≥2× 的常见类型）：用于厚底靴建议（模型级近似） */
function itemRockWeak(s){return ['飞行','虫','火','冰'].some(function(t){return s.t1===t||s.t2===t})}
/* EVIO 权衡模型（v4.3.2）的**对照基准**：同族终态取"耐久取向"最优道具（剩饭/黑泥/水果/头盔）。
   这里刻意不随展示层（buildItem 原则打分）漂移 —— 存量权衡需要一个稳定口径，否则 S 值每次调参都会变。 */
function itemTradeBaseFor(s,side,roleTag){
  var out=[];
  function put(zh){if(out.indexOf(zh)<0)out.push(zh)}
  if(evioAdv(s))return '进化奇石';
  if(s.t1==='毒'||s.t2==='毒')put('黑色污泥');
  put('剩饭');put('凸凸头盔');put('文柚果');
  return out[0]||'剩饭';
}
function itemBestFor(s,side,roleTag){return itemTradeBaseFor(s,side,roleTag)}
function effBulkOf(s,g){g=g||{};return (bstI(s,0)*(bstI(s,2)*(g.def||1))*(bstI(s,4)*(g.spdef||1)))/1000}
function outOf(s,side,g){
  g=g||{};var sd=side||coreSide(s),st=stabBest(s,sd),pw=st?st.pow:0;
  var at=sd==='特殊'?bstI(s,3):(sd==='物理'?bstI(s,1):Math.max(bstI(s,1),bstI(s,3)));
  return pw*at*(g.out||1);
}
function utilOf(s,g){
  g=g||{};var k=g.util||0;
  (s.abis||[]).concat(s.inns||[]).forEach(function(n){var t=abiTagOf(n);if(!t)return;
    if(t.im)k+=2;if(t.hf)k+=1;if(t.out)k+=1;if(t.add)k+=1;if(t.def)k+=1;if(t.conv)k+=1;if(t.nt)k+=1});
  var L=learnC(s);
  ['rec','hazard','speed','boost','weather','protect','pivot','wear'].forEach(function(c){
    if(FUNC_MV[c]&&hasAny(L,FUNC_MV[c]))k+=1});
  return k;
}
/* 速度维度：体系感知（空间→越低越优；晴/雨速攻→越高越优；其余弱权重） */
function spdFit(spd,space,sys){
  spd=spd||0;
  if(space)return Math.max(0,Math.min(1,(130-spd)/90));
  var fast=(sys||[]).some(function(x){return EVIO.SPD_FAST.indexOf(x)>-1});
  if(fast)return Math.max(0,Math.min(1,(spd-45)/85));
  return Math.max(0,Math.min(1,(spd-45)/215))*0.6;
}
function coreIsSpace(c){return !!c&&spdOf(c)<=EVIO.SPD_SLOW_LEVEL&&atkBest(c)>=90}
function relDiff(a,b){return (a-b)/Math.max(1,Math.abs(a),Math.abs(b))}
var _evioBusy=0;
function evioTrade(s,sys,space,side){
  if(!s||!isValidSp(s)||isFinalForm(s))return null;   /* 最终形态：奇石无效 */
  sys=sys||coreSys(s);space=(space===undefined)?coreIsSpace(s):!!space;side=side||coreSide(s);
  var f=famFinalOf(s),at=atkBest(s),be=+evioBulk(s).toFixed(1);
  if(!f){
    if(be>=EVIO.BULK_MIN&&at>=EVIO.ATK_MIN)
      return {pass:true,bulkE:be,fam:null,famId:null,famBulk:null,ratio:null,atk:at,S:null,d:null,itemB:null,
        why:'奇石加成后耐久（双防×1.5）'+be+'（≥'+EVIO.BULK_MIN+'）且输出 '+at+'（≥'+EVIO.ATK_MIN+'），达站场阈值（未收录同族终态，走绝对阈值）'};
    return {pass:false,bulkE:be,fam:null,famId:null,famBulk:null,ratio:null,atk:at,S:null,d:null,itemB:null,
      why:'奇石加成后耐久（双防×1.5）'+be+'／输出 '+at+' 未达绝对阈值（'+EVIO.BULK_MIN+'／'+EVIO.ATK_MIN+'），不推荐'};
  }
  /* B = 同族终态 + 其最优道具（buildItem 首位；F 为最终形态故其内部不走奇石分支，_evioBusy 兜底防重入） */
  _evioBusy=1;var itemB='';try{itemB=itemBestFor(f,side,'输出')}finally{_evioBusy=0}
  var gB=itemGainOf(itemB);
  var A={bulk:effBulkOf(s,{def:EVIO.BULK_MULT,spdef:EVIO.BULK_MULT}),out:outOf(s,side,null),spe:spdOf(s),util:utilOf(s,null)};
  var B={bulk:effBulkOf(f,gB),out:outOf(f,side,gB),spe:spdOf(f),util:utilOf(f,gB)};
  var d={bulk:+relDiff(A.bulk,B.bulk).toFixed(3),out:+relDiff(A.out,B.out).toFixed(3),
    spe:+(spdFit(A.spe,space,sys)-spdFit(B.spe,space,sys)).toFixed(3),
    util:+relDiff(A.util,B.util).toFixed(3)};
  var TW=EVIO.TW,S=+(TW.bulk*d.bulk+TW.out*d.out+TW.spd*d.spe+TW.util*d.util).toFixed(3);
  var fb=bulkOf(f),r=be/Math.max(1,fb),ratEff=+(A.bulk/Math.max(1,B.bulk)).toFixed(2);
  var pass=(d.bulk>0&&S>=EVIO.TRADE_MIN);
  var spdTxt=space?'空间体系：越低越优':'速攻/中性：越高越优';
  var cmp='奇石双防 X='+be+'（有效耐久 '+A.bulk.toFixed(0)+'）vs '+f.zh+'+'+itemB+'（有效耐久 '+B.bulk.toFixed(0)+'）：输出 '+A.out.toFixed(0)+
    ' vs '+B.out.toFixed(0)+'｜速度 '+A.spe+' vs '+B.spe+'（'+spdTxt+'）｜功能 '+A.util+' vs '+B.util;
  var why='奇石加成后耐久（双防×1.5）'+be+'（对终态裸耐久比值 '+r.toFixed(2)+'，含道具有效耐久比 '+ratEff+'）'+
    (pass?('—— 综合权衡后未进化+奇石更优（综合权衡 '+S+' ≥ '+EVIO.TRADE_MIN+'，耐久差 '+d.bulk+'）：'+cmp)
         :('—— 综合权衡未过门（综合权衡 '+S+' < '+EVIO.TRADE_MIN+' 或耐久差 '+d.bulk+' ≤ 0）：进化型凭道具/速度/力度反超 → 不推荐。'+cmp));
  return {pass:pass,bulkE:be,fam:f.zh,famId:f.id,famBulk:fb,ratio:+r.toFixed(2),atk:at,S:S,d:d,itemB:itemB,ratEff:ratEff,
    A:{bulk:+A.bulk.toFixed(1),out:+A.out.toFixed(1),spe:A.spe,util:A.util},
    B:{bulk:+B.bulk.toFixed(1),out:+B.out.toFixed(1),spe:B.spe,util:B.util},space:!!space,why:why};
}
/* v432-1：权衡结果按「物种|体系|空间|侧」缓存，避免渲染期重复计算（evioTrade 内部会为对照方跑 buildItem） */
var _evioMemo={};
function evioTradeM(s,sys,space,side){
  var k=(s&&s.id||'')+'|'+(sys||'')+'|'+(space===undefined||space===null?'':(space?1:0))+'|'+(side||'');
  if(Object.prototype.hasOwnProperty.call(_evioMemo,k))return _evioMemo[k];
  var t=evioTrade(s,sys,space,side);_evioMemo[k]=t;return t;
}
function evioAdv(s,sys,space,side){if(_evioBusy)return null;var t=evioTradeM(s,sys,space,side);return (t&&t.pass)?t:null}
function evioVeto(s,sys,space,side){if(_evioBusy)return null;var t=evioTradeM(s,sys,space,side);return (t&&!t.pass)?t:null}
/* v432-1：否决也要可见 —— 汇总「有族且经奇石权衡被否决」的非最终形态（按 S 升序，最典型的排前），
   供核心配队页/详情页渲染（低样式折叠块，不占主推荐位）。按核心上下文缓存。 */
var _evioVSum={};
function evioVetoSummary(core){
  if(!core)return {n:0,list:[]};
  var sys=coreSys(core),space=coreIsSpace(core),side=coreSide(core);
  var k=''+core.id+'|'+sys+'|'+(space?1:0)+'|'+side;
  if(_evioVSum[k])return _evioVSum[k];
  var list=[];
  for(var i=0;i<ERDATA.species.length;i++){
    var s=ERDATA.species[i];
    if(!isValidSp(s)||s.id==core.id)continue;
    if(isFinalForm(s))continue;
    if(!famFinalOf(s))continue;                 /* 仅「同族终态可对照」者才会出现「进化型反超」结论 */
    var t=evioVeto(s,sys,space,side);
    if(t)list.push({s:s,S:t.S,d:t.d,fam:t.fam,itemB:t.itemB,A:t.A,B:t.B,ratio:t.ratio,ratEff:t.ratEff,why:t.why});
  }
  list.sort(function(a,b){return (a.S===null?0:a.S)-(b.S===null?0:b.S)});
  var r={n:list.length,list:list};_evioVSum[k]=r;return r;
}
function evioOk(s,sys,space,side){return !!evioAdv(s,sys,space,side)}
function evioWhy(s,sys,space,side){var e=evioAdv(s,sys,space,side);return e?('进化奇石（非最终形态）—— '+e.why):''}
/* v4.3.1/4.3.2：候选池准入 = 最终形态 或 奇石权衡通过形态（替代原「非最终形态一律排除」） */
function poolOK(s){return isValidSp(s)&&(isFinalForm(s)||evioOk(s))}
function findTeammates(s,side,roleTag){
  /* v4.x B⑤/⑥：队友推荐按流派区分 + 体系匹配 + 家族去重
     side/roleTag 缺省时回落到核心自身判定（保持既有调用兼容） */
  side=side||coreSide(s);roleTag=roleTag||'输出';
  var weak=coreWeak(s),holes=coverHoles(s),sys=coreSys(s),learn=learnOf(s);
  var hasRec=hasAny(learn,FUNC_MV.rec),hasHaz=hasAny(learn,FUNC_MV.hazard),hasSpd=hasAny(learn,FUNC_MV.speed);
  var wxSys=sys.filter(isWxSys); /* 体系为天气/场地时需要天气手/受益者 */
  var needWx=wxSys.length>0;
  var coreWxKey=wxSys.filter(function(x){return WX_SYS.indexOf(x)>-1})[0]||''; /* 核心的天气键（判断对立天气，场地不冲突） */
  /* v4.2（用户裁定 · 正向体系构建）：**删除天气体系硬互斥**（原 wxConflict 直接排除「持有对立体系」的候选）。
     对立体系候选不再被剔除，而是由体系维度分自然排后（如班基拉斯/庞岩怪在纯晴队里：
     晴受益分低 → 排在受益者之后，但仍出现在推荐列表 / 槽位备选中）。
     因此本函数不再产出 wxDrops（UI 红框已删除）。 */
  var coreArch=archOfSp(s,side,roleTag); /* v4.x：核心所属体系 → 队友推荐走同一张维度权重表 */
  var recs=[];
  ERDATA.species.forEach(function(t){
    if(t.id==s.id)return;
    if(!isFinalSp(t))return; /* 非最终形态不计入推荐 */
    if(!isValidSp(t))return; /* B7：占位/无效物种过滤 */
    var sc=0,why=[];
    /* v4.x 体系化维度（archOfSp → SYS_DIMS，与模板推荐共用同一张维度权重表）：
       逐维度加减分并写入 why（可解释）；v4.2 起 sysScore 不再产生 drop（正向化，低分≠剔除） */
    var r4=sysScore(t,coreArch,{core:s,counters:weak,side:side});
    sc+=r4.total;
    r4.dims.filter(function(d){return d.pts}).slice(0,3).forEach(function(d){why.push(d.txt)});
    /* ① 联防：免疫/抵抗核心弱点（既有口径） */
    weak.forEach(function(w){
      var v=defCellTrio(t,w).inn;
      if(v===0){sc+=3;why.push('免疫你弱点的'+w)}
      else if(v<1){sc+=2;why.push('抵抗你弱点的'+w)}
    });
    /* ② 补盲：本系命中核心盲点 */
    if(t.t1&&holes.indexOf(t.t1)>-1){sc+=2;why.push('本系'+t.t1+'补你盲点')}
    if(t.t2&&t.t2!==t.t1&&holes.indexOf(t.t2)>-1){sc+=2;why.push('本系'+t.t2+'补你盲点')}
    /* ③ 体系契合（⑥-1，v4.2 正向化）：只做**加分**表达协同，不做对立体系降权/剔除；
       对立天气体系（晴↔雨/沙/雪 同槽互斥）仅作为排序键（fit=0 → 靠后但仍可见，见下方 sort） */
    var tsys=coreSys(t);
    var same=tsys.filter(function(x){return sys.indexOf(x)>-1});
    var fit=1;
    if(needWx){
      if(same.length){sc+=5;fit=2;why.push('同'+same.join('/')+'体系（受益 +5）')}
      else{
        var st=null;
        wxSys.forEach(function(x){if(!st&&isAbilSet(t,x))st={x:x,n:sysSetterOf(t,x)}});
        if(st){sc+=4;fit=2;why.push('可开'+st.x+'（'+(st.n?(st.n.kind+st.n.name):'天气/场地手')+' +4）')}
        else{
          /* 冲突天气：核心是天气体系而候选自带另一套「天气」（场地可与天气共存 → 不算冲突） */
          var clash=tsys.some(function(x){return WX_SYS.indexOf(x)>-1&&WX_SYS.indexOf(coreWxKey)>-1&&x!==coreWxKey});
          if(clash){fit=0;why.push('自带另一套天气体系（仅排序靠后，未剔除）')}
        }
      }
    }else if(tsys.length){sc+=2;why.push('可为你开'+tsys.join('/')+'（+2）')}
    /* ④ 侧向分工（⑤）：物理侧→物理联防/威吓；特殊侧→特殊联防；受队/肉盾→剧毒/钉子/回复 */
    if(side==='物理'){
      if(t.base[2]>=110){sc+=2;why.push('物理联防（防御'+t.base[2]+'）')}
      if(t.inns.indexOf('威吓')>-1||t.abis.indexOf('威吓')>-1){sc+=2;why.push('威吓削物攻')}
    }else if(side==='特殊'){
      if(t.base[4]>=110){sc+=2;why.push('特殊联防（特防'+t.base[4]+'）')}
    }else if(roleTag==='肉盾'||roleTag==='受队'){
      var tl0=learnOf(t);
      if(tl0.indexOf(92)>-1){sc+=1;why.push('剧毒消耗')}
      if(!hasHaz&&hasAny(tl0,FUNC_MV.hazard)){sc+=1;why.push('补钉子')}
      if(!hasRec&&hasAny(tl0,FUNC_MV.rec)){sc+=1;why.push('补回复')}
    }
    var tl=learnOf(t);
    if(!hasRec&&hasAny(tl,FUNC_MV.rec)){sc+=2;why.push('提供回复')}
    if(!hasHaz&&hasAny(tl,FUNC_MV.hazard)){sc+=2;why.push('提供钉子')}
    if(hasSpd&&!hasAny(tl,FUNC_MV.speed)){sc+=1;why.push('控速手')}
    if(side!=='物理'&&(t.inns.indexOf('威吓')>-1||t.abis.indexOf('威吓')>-1)){sc+=1;why.push('威吓削物攻')}
    /* ⑤ 同弱点惩罚（既有口径） */
    var dup=weak.filter(function(w){return defCellTrio(t,w).inn>1});
    if(dup.length){sc-=dup.length;why.push('同弱点'+dup.join('、'))}
    recs.push({s:t,score:sc,fit:fit,why:why}); /* v4.2：删除 `sc>0` 隐性门槛（不再有「反向淘汰」） */
  });
  /* v4.2 排序：体系契合优先（同体系受益/设置手 → 中立 → 对立天气排后），同档再按总分。
     对立体系只排后、不剔除（fit 仅作排序键，不参与分数） */
  recs.sort(function(a,b){return (b.fit-a.fit)||(b.score-a.score)});
  /* ⑥-2 家族去重：同一 familyRoot 只保留评分最高形态（班基拉斯/超级班基拉斯不并存）
     D8：再按「名称前缀」去重（阿尔宙斯-毒/幽灵/飞行… 同族不同 root，只留最高分形态），
     并把折叠形态数记在 r.collapsed 供 UI 折叠展示 */
  var seen={},fin=[];
  recs.forEach(function(r){var k=famKey(r.s);if(seen[k])return;seen[k]=1;fin.push(r)});
  var seen2={},fin2=[];
  fin.forEach(function(r){
    var k=prefixKey(r.s);
    if(seen2[k]){if(seen2[k].collapsed===undefined)seen2[k].collapsed=1;seen2[k].collapsed++;return}
    seen2[k]=r;fin2.push(r);
  });
  var top6=fin2.slice(0,6);
  try{top6.pool=fin2.length}catch(e){}
  return top6;
}
/* D8：名称前缀（形态折叠键）—— '阿尔宙斯-毒' → '阿尔宙斯'；'雷电云-灵兽形态' → '雷电云' */
function prefixKey(s){return String(s.zh||'').split(/[-（(·]/)[0]}
function mvSrc(s,id){
  var lv='-';
  s.lv.forEach(function(p){if(p[1]==id&&(lv==='-'||p[0]<lv))lv='Lv'+p[0]});
  if(lv==='-')lv='教学';
  return lv;
}
/* ==================================================================================
   v4.2 阶段 3：正向体系构建 buildTeam —— 槽位模型
   权威规格：docs\战斗分析\07_组队方法论.md（§2.0 骨架总表 / §3.1 D1–D18 / §3.2 槽位×维度矩阵 /
   §4.3 SLOT_TABLE / §4.4 buildTeam 契约）。

   用户裁定（方法论核心批评）：「配队是正向的，队伍 = 天气手 + 速攻核心 + 弱点补盲 + 联防 + 撒钉 +
   轮转的系统，不是 6 个强个体」「否定硬互斥剔除 / 硬排除 / 红框这类负向思维」。
   ⇒ 本层完全正向：**零硬门、零否决、得分恒 ≥ 0**。
      · 只保留「角色必要条件」= 这只能不能干这个槽位的活（设置手槽必须能开体系、物盾槽必须 base[def]≥100
        …），这属于**正向定位**，不是「不够强就剔除」；
      · 不达标者得 0 分 / 低分排后，**仍出现在该槽位的备选列表**（铁证：龙头地鼠速度 88 → 空间打手槽
        低速线 +0 → 排后但可见，不出现「硬排除」字样）；
      · 偏差登记 D-1：文档 §1.5/§4.4 把 `wxConflict` 列为「唯一硬门、保留」，**用户本轮明确要求移除硬互斥
        ⇒ 以用户指令为准**；`wxConflict/wxSetOf` 已删除，对立体系靠体系受益分自然排后（详见交付报告 §v4.2）。
   ================================================================================== */
/* 体系字段域（天气 4 + 场地 4 + 剧毒场地）：S-SET 门用它判定「是否体系设置手」 */
var FIELD_SYS=['雨','晴','沙','雪','电场','精神场地','青草场地','薄雾场地','剧毒场地'];
/* ============ v4.3 阈值（07 §4.5.2：必须可配置，禁止把魔数写进算法正文） ============ */
var NEED_CFG={SPEED_HIGH:100,SPEED_LOW:60,BULK_HIGH:300,BULK_MID:270,MIXED_OK:70,POWER_OK:95,
  MULTI_ROLE_BONUS:3,STOP_PRIORITY:1,MAX_TEAM:6,
  MULTI_MAX:2 /* 单只最多「顺带满足」的额外需求数——07 §4.5.3 未设上限；加此上限以保持 07 期望的 4~6 只队伍，
                 避免一只全能宝可梦一次清零十余条需求导致队伍缩到 2~3 只（实现口径已在交付报告登记） */};
/* NEED_EXAMPLES —— 07 §2「需求示例参考」（原 SLOT_TABLE 更名后的降级形态）
   定位（v4.3）：只记录「历史上常见于该体系的需求候选词」，仅作
     ① 冷启动的默认需求来源 ② 用户未指定核心时的兜底 ③ 打分时的体系常见度先验。
   ⚠️ 「Σ n == 6」只表示「若把该示例当作整队样板刚好 6 只」，**不是 buildTeam 的不变量**；
   引擎**不得**据此校验或补齐（v4.3 撤销量化配额）。真正的入口是 core → needList(core,cx)。 */
var NEED_EXAMPLES={
 '雨天速攻':[['S-SET',1],['S-SPD',2],['S-COVER',1],['S-WALL-S',1],['S-HAZ',1]],
 '晴天速攻':[['S-SET',1],['S-SPD',2],['S-BOOST',1],['S-COVER',1],['S-WALL-P',1]],
 '沙暴联防':[['S-SET',1],['S-SPD',1],['S-WALL-S',1],['S-HAZ',1],['S-PIVOT',1],['S-COVER',1]],
 '雪天堡垒':[['S-SET',1],['S-WALL-P',2],['S-ATK',1],['S-CLEAR',1],['S-COVER',1]],
 '电气场地速攻':[['S-SET',1],['S-ATK',2],['S-PIVOT',1],['S-WALL-S',1],['S-COVER',1]],
 '精神场地特攻':[['S-SET',1],['S-ATK',2],['S-WALL-S',1],['S-PRIO',1],['S-COVER',1]],
 '青草场地回复':[['S-SET',1],['S-SEED',1],['S-CLEAR',2],['S-WALL-P',1],['S-COVER',1]],
 '薄雾场地龙盾':[['S-SET',1],['S-WALL-S',2],['S-CLEAR',1],['S-WALL-P',1],['S-COVER',1]],
 '强化清场轴':[['S-ATK',2],['S-PIVOT',1],['S-WALL-P',1],['S-WALL-S',1],['S-PRIO',1]],
 '顺风游击':[['S-TW',1],['S-ATK',2],['S-PIVOT',1],['S-PRIO',1],['S-COVER',1]],
 '戏法空间':[['S-TRSET',2],['S-TRUSE',2],['S-BRK',1],['S-GLUE',1]],
 '钉子受队':[['S-HAZ',2],['S-WALL-P',1],['S-WALL-S',1],['S-SPIN',1],['S-CLEAR',1]],
 '毒钉受队':[['S-HAZ',1],['S-CLEAR',1],['S-WALL-P',1],['S-WALL-S',1],['S-SPIN',1],['S-GLUE',1]],
 '强化接力':[['S-BRK',1],['S-ATK',1],['S-PIVOT',1],['S-PRIO',1],['S-WALL-P',1],['S-WALL-S',1]],
 '天气双核':[['S-SET',1],['S-SPD',1],['S-BOOST',2],['S-WALL-S',1],['S-COVER',1]],
 '场地控制':[['S-SET',1],['S-ATK',2],['S-PRIO',1],['S-SET2',1],['S-COVER',1]],
 '吸血站场':[['S-SEED',1],['S-DRAIN',2],['S-WALL-P',1],['S-WALL-S',1],['S-COVER',1]],
 '双天气轮换':[['S-SET',1],['S-SET2',1],['S-ATK',2],['S-WALL-S',1],['S-ANTI',1]],
 '通用':[['S-ATK',3],['S-WALL-P',1],['S-WALL-S',1],['S-PIVOT',1]]
};
/* 设置手判定（v4.3 重登；07 §4.5.1 白名单符号）：
   持有「自动开体系」特性（天气/场地）者 → 返回其体系名，否则空串。
   与 isSetter(=自动特性 或 可学天气招) 区分：设置手槽是**二维决策**（选哪只 × 选哪个特性），
   先用 isSetterAny 筛「人有这本事」，再用 isAbilSet 判定「用哪个特性开」。 */
function isSetterAny(s){
  var hit='';
  (s.abis||[]).concat(s.inns||[]).forEach(function(n){if(!hit){var v=abiSetOf(n);if(v)hit=v}});
  return hit;
}
/* 需求定义表自检（R07-29 可执行性硬要求）：每条需求必须有 gate（求值器）与 dims（正向维度） */
function needRegistryOk(){
  return Object.keys(NEED_KINDS).every(function(k){
    var d=NEED_KINDS[k];
    return d&&typeof d.gate==='function'&&d.kind&&d.role&&d.dims&&d.dims.length>0;
  });
}

/* 需求定义表 NEED_KINDS（07 §4.5.1 / §4.5.4）——
   需求是**按核心动态实例化**的条目（不是固定槽位）：kind 只有 8 个家族，
   每个家族的可实例化条数/优先级随核心画像变化（见 needList）。
   求值器白名单（07 §4.5.1）：只用已验证存在的现有符号——
     属性数值 stats.base/bstI/bulkOf/spdOf/atkBest/stabBest/bestPowOf/defCellTrio/coreSide
     特性 s.abis∪s.inns/isAbilSet/isSetterAny/abiTagOf/SYS_MAP/SYS_SET
     招式（按 id）learnOf(s)/hasAny/FUNC_MV.*     招式（按名）learnHasName/countLearnNames/SYS_MV_KEYS['<主题>']
     体系 coreSys/archOfSp/SYS_DIMS（不得引用已删除的 wxConflict/wxSetOf）
   gate(t,cx,arg) 返回非空字符串 = 该候选**能承担**这条需求（正向定位，不是强度淘汰）。 */
var NEED_KINDS={
 out:{kind:'profile',label:function(){return '主力输出 / 第二攻手'},role:'承担主要输出：本系高威力 × 体系增伤',
   gate:function(t,cx){var a=atkBest(t),bp=Math.max(bestPowOf(t,'物理',convOf(t))||0,bestPowOf(t,'特殊',convOf(t))||0);
     if(a>=NEED_CFG.POWER_OK)return '力度 '+a+' 达标（≥'+NEED_CFG.POWER_OK+'）';
     if(bp>=110)return '本系折算威力 '+bp+'（可补输出）';
     return ''},
   dims:[['D4',2],['D14',1],['D2',1]]},
 wxsrc:{kind:'field',label:function(){return '需要天气/场地来源（设置手）'},role:'起手开窗口：自动天气/场地特性优先，其次可学对应天气招者作第二手',
   why:function(core,p,arg,cx){return '核心体系 '+(cx.sysKey||'—')+' 但核心自身非自动设置手'+(p.setter?'（注：核心自身可设置）':'')},
   gate:function(t,cx){var s=cx.sysKey;if(!s)return isSetterAny(t)?'可开'+isSetterAny(t):'';
     if(isAbilSet(t,s))return '自动开'+s+'（'+(sysSetterName(t,s)||'体系特性')+'）';
     if(hasAny(cx.L||learnC(t),FUNC_MV.weather))return '可学天气/场地招（第二手，非自动）';
     return ''},
   /* 核心自满足判定：只有「自动特性设置手」才算核心自己开了窗口；仅可学天气招不算 */
   selfGate:function(t,cx){var s=cx.sysKey;return (s&&isAbilSet(t,s))?('自动开'+s+'（'+(sysSetterName(t,s)||'体系特性')+'）'):''},
   dims:[['D1',6],['D7',1]]},
 wxabuse:{kind:'field',label:function(){return '体系受益位'},role:'窗口内受益：体系增伤/提速/回复特性，或体系受益招',
   why:function(core,p,arg,cx){return '体系 '+(cx.sysKey||p.field.join('/'))+' 已由核心/队友开启，需要受益者'+(p.field.length?'':'（窗口需队友提供）')},
   gate:function(t,cx){var s=cx.sysKey||(coreSys(t)[0]||'');if(!s)return '';
     var bn=(t.abis||[]).concat(t.inns||[]).filter(function(n){return SYS_MAP[n]===s});
     if(bn.length)return '体系受益特性：'+bn.join('/')+'（'+s+'）';
     var c=countLearnNames(t,SYS_MV_KEYS[s]||[],cx.L||learnC(t));
     if(c)return s+'受益招 '+c+' 个';
     return ''},
   dims:[['D13',3],['D1',2],['D4',1],['D2',1]]},
 wxreset:{kind:'field',label:function(){return '窗口复位 / 冗余位'},role:'防对手改天气/清场地：第二套体系或可再开窗口者',
   why:function(){return '窗口被对手顶掉时需要复位（第二套窗口/复位手段）'},
   gate:function(t,cx){var s=cx.sysKey||'';var any=isSetterAny(t);
     if(any&&any!==s)return '第二套体系设置手（'+any+'）可复位/轮换';
     if(hasAny(cx.L||learnC(t),FUNC_MV.weather))return '可学天气/场地招，可复位窗口';
     return ''},
   dims:[['D1',2],['D6',1],['D8',1]]},
 speed:{kind:'speed',label:function(){return '控速位'},role:'先制 / 顺风 / 戏法空间：改变出手顺序',
   why:function(core,p){return '核心速度 '+p.du.spd+'（'+(p.fast?'高速，先制收割':(p.slow?'低速，空间受益':'中速，靠顺风/先制'))+'）'},
   gate:function(t,cx){var L=cx.L||learnC(t);
     if(hasAny(L,FUNC_MV.speed))return '先制/控速招（'+MV[mvPick(L,FUNC_MV.speed)][1]+'）';
     if(learnHasName(t,'顺风',L))return '顺风（队伍提速）';
     if(learnHasName(t,'戏法空间',L))return '戏法空间（慢速反手）';
     return ''},
   dims:[['D2',2],['D3',2],['D8',2]]},
 cover:{kind:'coverage',label:function(arg){return '补盲点：'+arg},role:'对核心盲点属性的答案（克制招或抵抗承伤）',
   why:function(core,p,arg){return '核心对「'+arg+'」缺少高效手段（盲点）'},
   gate:function(t,cx,arg){if(!arg)return '';var L=cx.L||learnC(t);
     if(canHitSuper(t,arg,L))return '对 '+arg+' 有克制招';
     var trio=defCellTrio(t,arg);
     if(trio.inn<=0.5)return '抵抗/免疫 '+arg+'（替队吸收）';
     return ''},
   dims:[['D10',3],['D9',2],['D4',1]]},
 wallp:{kind:'profile',label:function(){return '物理联防位（物盾）'},role:'吃物理伤害、做物理侧联防',
   why:function(core,p){return '核心物理耐久 '+p.du.phys+'，需要物理侧联防'+(p.role==='肉盾核心'?'（肉盾核心需分担物理面）':'')},
   gate:function(t,cx){var d=bstI(t,2),b=bulkOf(t);
     if(d>=100&&b>=300)return '物防 '+d+' / 耐久 '+b+'（达物盾线）';
     if(d>=120)return '物防 '+d+' 高';
     return ''},
   dims:[['D6',2],['D9',2],['D11',2],['D7',1]]},
 walls:{kind:'profile',label:function(){return '特殊联防位（特盾）'},role:'吃特殊伤害、做特殊侧联防',
   why:function(core,p){return '核心特殊耐久 '+p.du.spec+'，需要特殊侧联防'},
   gate:function(t,cx){var d=bstI(t,4),b=bulkOf(t);
     if(d>=100&&b>=300)return '特防 '+d+' / 耐久 '+b+'（达特盾线）';
     if(d>=120)return '特防 '+d+' 高';
     return ''},
   dims:[['D6',2],['D9',2],['D11',2],['D7',1]]},
 haz:{kind:'function',label:function(){return '钉位（铺场）'},role:'撒菱/隐形岩/毒菱/黏黏网：持续消耗与破气腰',
   why:function(core,p){return '核心自身'+(p.fn.haz?'已具备':'不具备')+'铺钉手段'},
   gate:function(t,cx){var L=cx.L||learnC(t);if(!hasAny(L,FUNC_MV.hazard))return '';
     var ids=FUNC_MV.hazard.filter(function(x){return L.indexOf(x)>-1});
     return '钉子：'+ids.map(function(x){return MV[x][1]}).join('/')},
   dims:[['D8',2],['D6',1]]},
 clear:{kind:'function',label:function(){return '除钉位（清场）'},role:'高速旋转/清除浓雾：清掉己方钉子',
   why:function(core,p){return '核心自身'+(p.fn.rem?'已具备':'不具备')+'除钉手段'},
   gate:function(t,cx){var L=cx.L||learnC(t);if(!hasAny(L,FUNC_MV.removal))return '';
     var ids=FUNC_MV.removal.filter(function(x){return L.indexOf(x)>-1});
     return '除钉：'+ids.map(function(x){return MV[x][1]}).join('/')},
   dims:[['D8',2],['D6',1]]},
 rec:{kind:'function',label:function(){return '回复位 / 队医'},role:'稳定回复（或给队友回复）：续航站场',
   why:function(core,p){return '核心自身'+(p.fn.rec?'已具备':'不具备')+'稳定回复'},
   gate:function(t,cx){var L=cx.L||learnC(t);if(!hasAny(L,FUNC_MV.rec))return '';
     var ids=FUNC_MV.rec.filter(function(x){return L.indexOf(x)>-1});
     return '回复：'+ids.slice(0,2).map(function(x){return MV[x][1]}).join('/')},
   dims:[['D7',2],['D6',2],['D18',1]]},
 brk:{kind:'function',label:function(){return '破盾位'},role:'拍落/剧毒/挑拨：打开对手的城墙',
   why:function(core,p){return '核心力度 '+p.power+'，需要破受手段配合'},
   gate:function(t,cx){var L=cx.L||learnC(t);
     if(hasAny(L,FUNC_MV.wear))return '消耗手段：'+FUNC_MV.wear.filter(function(x){return L.indexOf(x)>-1}).map(function(x){return MV[x][1]}).join('/');
     if(learnHasName(t,'拍落',L))return '拍落（削道具破盾）';
     if(learnHasName(t,'挑拨',L))return '挑拨（封锁回复/强化）';
     return ''},
   dims:[['D4',2],['D8',2]]},
 pivot:{kind:'function',label:function(){return '轮转位（游走）'},role:'急速折返/伏特替换：保持节奏与先手换人',
   why:function(core,p){return '核心自身'+(p.fn.pivot?'已具备轮转招':'不具备轮转招')+'，需要轮转保持节奏'},
   gate:function(t,cx){var L=cx.L||learnC(t);if(!hasAny(L,FUNC_MV.pivot))return '';
     return '轮转：'+FUNC_MV.pivot.filter(function(x){return L.indexOf(x)>-1}).map(function(x){return MV[x][1]}).join('/')},
   dims:[['D8',2],['D6',1],['D18',1]]},
 sub:{kind:'function',label:function(){return '替身 / 掩护位'},role:'替身/守住：为强化手创造强化回合',
   why:function(){return '强化路线需要掩护（先替身再强化）'},
   gate:function(t,cx){var L=cx.L||learnC(t);
     if(L.indexOf(164)>-1)return '替身（强化掩护）';
     if(hasAny(L,FUNC_MV.protect))return '守住/保护（拖回合掩护）';
     return ''},
   dims:[['D6',2],['D8',1],['D17',1]]},
 pass:{kind:'function',label:function(){return '接棒位'},role:'接棒：把强化成果交接给队友',
   why:function(){return '强化轴需要接棒把成果传出去'},
   gate:function(t,cx){var L=cx.L||learnC(t);
     if(!learnHasName(t,'接棒',L))return '';
     if(hasAny(L,FUNC_MV.boost))return '接棒 + 自身强化招（可自强化后接棒）';
     return '接棒（接收队友强化成果）'},
   dims:[['D8',2],['D6',1]]},
 wear:{kind:'function',label:function(){return '消耗位'},role:'剧毒/寄生种子等：磨血消耗',
   why:function(){return '受队路线需要持续消耗手段'},
   gate:function(t,cx){var L=cx.L||learnC(t);
     if(hasAny(L,FUNC_MV.wear))return '消耗：'+FUNC_MV.wear.filter(function(x){return L.indexOf(x)>-1}).map(function(x){return MV[x][1]}).join('/');
     if(learnHasName(t,'寄生种子',L))return '寄生种子（吸血消耗）';
     return ''},
   dims:[['D6',2],['D7',2],['D9',1]]},
 drain:{kind:'function',label:function(){return '吸血站场位'},role:'吸血流（终极吸取/吸血）：边打边回',
   why:function(){return '耐久站场路线可用吸血维持血线'},
   gate:function(t,cx){var L=cx.L||learnC(t),c=countLearnNames(t,SYS_MV_KEYS['吸血']||[],L);
     if(c)return '吸血招 '+c+' 个';
     if(hasAny(L,FUNC_MV.rec))return '回复招可替代吸血';
     return ''},
   dims:[['D7',2],['D6',1],['D4',1]]},
 truse:{kind:'profile',label:function(){return '空间打手位（低速重炮）'},role:'空间内先手的低速高攻手（速度越低越先出手）',
   why:function(core,p){return '空间已由核心/队友提供；空间内需要低速高攻手先手清场（核心速度 '+p.du.spd+'）'},
   gate:function(t,cx){var a=atkBest(t);
     if(a>=NEED_CFG.POWER_OK)return '力度 '+a+'（≥'+NEED_CFG.POWER_OK+' 可作打手）';
     var bp=Math.max(bestPowOf(t,'物理',convOf(t))||0,bestPowOf(t,'特殊',convOf(t))||0);
     if(bp>=130)return '本系折算威力 '+bp;
     return ''},
   dims:[['D3',3],['D4',2],['D14',1],['D6',1]]},
 trset:{kind:'field',label:function(){return '空间手位'},role:'戏法空间：让低速重炮先手',
   why:function(core,p){return '核心速度 '+p.du.spd+'，空间内可先手'},
   gate:function(t,cx){var L=cx.L||learnC(t);
     if(learnHasName(t,'戏法空间',L))return '可学戏法空间（空间手）';
     if(bstI(t,5)<=60&&atkBest(t)>=95)return '低速高攻（空间受益者）';
     return ''},
   dims:[['D3',3],['D6',2],['D4',1]]},
 anti:{kind:'glue',label:function(){return '状态/异常吸收位'},role:'免疫异常或替队吃状态（低优先兜底）',
   why:function(){return '通用兜底：吸收异常/免疫特性'},
   gate:function(t,cx){var n=(t.abis||[]).concat(t.inns||[]),hit=[];
     n.forEach(function(x){var tg=abiTagOf(x);if(tg&&tg.im&&tg.im.length)hit.push(x)});
     if(hit.length)return '免疫特性：'+hit.join('/');
     return ''},
   dims:[['D11',2],['D6',1]]}
};
function mvPick(L,ids){for(var i=0;i<ids.length;i++){if(L.indexOf(ids[i])>-1)return ids[i]}return ids[0]}
function isAbilSetAny(s){return isSetterAny(s)}   /* v4.3：统一委托 isSetterAny（单一真值源） */
/* ③ D1–D18 正向维度（pts 恒 ≥ 0；不达标 = 0 分，不减分、不剔除） */
var SYS_DIM_LABEL={D1:'体系设置/受益契合',D2:'速度线',D3:'低速线（空间）',D4:'力度（物/特攻）',D5:'双刀',
 D6:'耐久三角',D7:'回复手段',D8:'功能招',D9:'覆盖队内弱点',D10:'补盲',D11:'免疫/减伤特性',D12:'不接地',
 D13:'体系受益招',D14:'本系折算威力',D15:'形态最终性',D16:'-ate 属性转换',D17:'道具契合',D18:'队内正交'};
function inFixed(s,n){return (s.inns||[]).indexOf(n)>-1}
var DIM_IMPL={
 'D1':function(s,cx){var sys=cx.sysKey;if(!sys)return null;
   var sn=sysSetterName(s,sys);
   if(sn)return{pts:4,txt:'体系设置手：'+sn+'（可开'+sys+'）',cert:inFixed(s,sn)?1:0.7};
   var bn=(s.abis||[]).concat(s.inns||[]).filter(function(n){return abiSysOf(n)===sys});
   if(bn.length)return{pts:2,txt:'体系受益特性：'+bn.join('/')+'（'+sys+'）',cert:bn.some(function(n){return inFixed(s,n)})?1:0.7};
   var mid=hasAny(cx.L||learnC(s),FUNC_MV.weather);
   if(mid&&WEATHER_MV[mid]===sys)return{pts:2,txt:'可学 '+MV[mid][1]+' 自行开'+sys+'（招式侧，无特性依赖）',cert:1};
   return{pts:0,txt:'无'+sys+'设置/受益特性（+0）'}},
 'D2':function(s){var v=spdOf(s);
   if(v>=110)return{pts:5,txt:'速度 '+v+' 高速（+5）'};
   if(v>=95)return{pts:3,txt:'速度 '+v+' 中高速（+3）'};
   if(v>=80)return{pts:1,txt:'速度 '+v+' 中速（+1）'};
   return{pts:0,txt:'速度 '+v+' 偏慢（+0）'}},
 'D3':function(s){var v=spdOf(s);
   if(v<=60)return{pts:6,txt:'速度 '+v+'≤60：空间内先手（+6）'};
   if(v<=85)return{pts:3,txt:'速度 '+v+'≤85：可进空间（+3）'};
   return{pts:0,txt:'速度 '+v+'：高于 85，空间下先手权归对手（+0，不剔除）'}},
 'D4':function(s){var a=atkBest(s);
   if(a>=130)return{pts:5,txt:'力度 '+a+' 极高（+5）'};
   if(a>=110)return{pts:3,txt:'力度 '+a+' 高（+3）'};
   if(a>=95)return{pts:1,txt:'力度 '+a+' 达标（+1）'};
   return{pts:0,txt:'力度 '+a+' 未达 95（+0）'}},
 'D5':function(s){var p=bstI(s,1),q=bstI(s,3);
   if(p>=90&&q>=90)return{pts:3,txt:'双刀：物攻 '+p+' / 特攻 '+q+'（+3）'};
   if(p>=70&&q>=70)return{pts:1,txt:'双刀潜质：物攻 '+p+' / 特攻 '+q+'（+1）'};
   return{pts:0,txt:'单侧输出（+0）'}},
 'D6':function(s){var b=bulkOf(s);
   if(b>=340)return{pts:5,txt:'耐久三角 '+b+' 极高（+5）'};
   if(b>=300)return{pts:3,txt:'耐久三角 '+b+' 达肉盾线（+3）'};
   if(b>=280)return{pts:1,txt:'耐久三角 '+b+' 偏耐久（+1）'};
   return{pts:0,txt:'耐久三角 '+b+'（+0）'}},
 'D7':function(s,cx){var L=cx.L||learnC(s),c=0;
   FUNC_MV.rec.forEach(function(id){if(L.indexOf(id)>-1)c++});
   if(!c)return{pts:0,txt:'无稳定回复招（+0）'};
   return{pts:Math.min(c,2)*2,txt:'回复手段 '+c+' 招（+'+Math.min(c,2)*2+'）'}},
 'D8':function(s,cx){var L=cx.L||learnC(s),cats=[FUNC_MV.hazard,FUNC_MV.pivot,FUNC_MV.speed,FUNC_MV.removal,FUNC_MV.protect,FUNC_MV.wear,FUNC_MV.weather],c=0;
   cats.forEach(function(a){if(hasAny(L,a))c++});
   if(!c)return{pts:0,txt:'无钉子/轮转/控速类功能招（+0）'};
   return{pts:Math.min(c,2)*2,txt:'功能招覆盖 '+c+' 类（+'+Math.min(c,2)*2+'）'}},
 'D9':function(s,cx){var need=cx.need||[],p=0,txt=[];
   need.forEach(function(t){var trio=defCellTrio(s,t);
     if(trio.inn===0){p+=3;txt.push('免疫'+t)}
     else if(trio.inn<=0.5){p+=2;txt.push('抵抗'+t)}});
   if(!p)return{pts:0,txt:'对队内弱点无免疫/抵抗（+0）'};
   return{pts:Math.min(p,6),txt:'替队吸收：'+txt.join('/')+'（+'+Math.min(p,6)+'）'}},
 'D10':function(s,cx){var holes=cx.holes||[],L=cx.L||learnC(s),hit=[];
   holes.forEach(function(t){if(canHitSuper(s,t,L))hit.push(t)});
   if(!hit.length)return{pts:0,txt:'对核心盲点无克制覆盖（+0）'};
   return{pts:Math.min(hit.length,3)*2,txt:'补核心盲点：'+hit.slice(0,3).join('/')+'（+'+Math.min(hit.length,3)*2+'）'}},
 'D11':function(s,cx){var p=0,txt='';
   (cx.names||(s.abis||[]).concat(s.inns||[])).forEach(function(n){
     var id=abiIdByZhOrEn(n),tg=id?ERDATA.abiTags[id]:null;if(!tg)return;
     if(tg.im&&!p){p=3;txt='免疫特性 '+n+'（'+tg.im.join('/')+'）'}
     else if(tg.hf&&p<2){p=2;txt='减伤特性 '+n+'（'+tg.hf.join('/')+'）'}});
   if(!txt)return{pts:0,txt:'无免疫/减伤特性（+0）'};
   return{pts:p,txt:txt+'（+'+p+'）'}},
 'D12':function(s,cx){var n=(cx.names||(s.abis||[]).concat(s.inns||[]));
   if(n.indexOf('飘浮')>-1)return{pts:2,txt:'飘浮：不吃地面钉子/地面招（+2）'};
   return{pts:0,txt:'接地（+0）'}},
 'D13':function(s,cx){var sys=cx.sysKey;if(!sys)return null;
   var c=countLearnNames(s,SYS_MV_KEYS[sys]||[],cx.L);
   if(!c)return{pts:0,txt:'未学'+sys+'受益招（+0）'};
   return{pts:Math.min(c,3),txt:sys+'受益招 '+c+' 个（+'+Math.min(c,3)+'）'}},
 'D14':function(s,cx){var conv=cx.conv,e=false;
   var bp=Math.max(bestPowOf(s,'物理',conv)||0,bestPowOf(s,'特殊',conv)||0);
   if(bp>=150)return{pts:3,txt:'本系折算威力 '+bp+'（+3）'};
   if(bp>=120)return{pts:2,txt:'本系折算威力 '+bp+'（+2）'};
   if(bp>=100)return{pts:1,txt:'本系折算威力 '+bp+'（+1）'};
   return{pts:0,txt:'本系折算威力 '+bp+'（+0）'}},
 'D15':function(s){var mega=/^超级/.test(String(s.zh||''));
   if(isFinalSp(s)&&!mega)return{pts:2,txt:'最终形态（+2）'};
   if(isFinalSp(s))return{pts:1,txt:'Mega/Redux 形态（+1）'};
   return{pts:0,txt:'非最终形态（+0）'}},
 'D16':function(s,cx){if(cx.conv)return{pts:2,txt:'-ate 属性转换：'+cx.conv.type+'（+2）'};
   return{pts:0,txt:'无 -ate 转换（+0）'}},
 'D17':function(s,cx){var sys=cx.sysKey;if(!sys)return null;
   if(isSetter(s,sys))return{pts:2,txt:'可持'+sys+'相关道具（岩石/延展器）延长窗口（+2）'};
   return{pts:0,txt:'无体系道具契合（+0）'}},
 'D18':function(s,cx){var team=cx.team||[];if(!team.length)return null;
   var mine=[s.t1,s.t2],p=0;
   team.forEach(function(m){var mt=[m.s.t1,m.s.t2];
     if(!mine.some(function(x){return mt.indexOf(x)>-1}))p++});
   if(!p)return{pts:0,txt:'属性与队内重叠（+0）'};
   return{pts:Math.min(p,2),txt:'属性与队内正交 '+p+' 只（+'+Math.min(p,2)+'）'}}
};
/* ④ 槽位评分：角色必要条件（正向定位）+ 维度加权分（×天性确定性系数） */
/* 需求实例化与打分（07 §4.5.1 / R07-27 / R07-29）
   · needScore：候选 s 对某条需求的正向得分 = Σ(维度分 × 权重) × 天性确定性
   · needSatisfied：候选是否「能承担」该需求（求值器判定，用于多功能计数与状态回写）
   · 零硬门：门（gate）只判「能不能干这个活」，不达标 = 不进该需求候选，但候选池全量可见 */
function needCtx(core,o){
  o=o||{};
  return {core:core,sysKey:o.sysKey||'',sysKey2:o.sysKey2||'',need:o.need||[],holes:o.holes||[],
    team:o.team||[],L:o.L,names:o.names,conv:o.conv};
}
function needScore(s,need,cx){
  var def=need&&need.def;if(!def)return null;
  var g='';try{g=def.gate(s,cx,need.arg)}catch(e){g=''}
  if(!g)return null;
  var total=0,cert=1,dims=[];
  (def.dims||[]).forEach(function(pair){
    var fn=DIM_IMPL[pair[0]];if(!fn)return;
    var r=null;try{r=fn(s,cx)}catch(e){r=null}
    if(!r||!r.pts)return;
    if(r.cert!==undefined)cert=Math.min(cert,r.cert);
    var pts=r.pts*(pair[1]||1);total+=pts;
    dims.push({id:pair[0],dim:SYS_DIM_LABEL[pair[0]]||pair[0],w:pair[1]||1,pts:pts,txt:r.txt});
  });
  /* v433-2：窗口来源需求（wxsrc）只认「自动特性设置手」为首选；仅可学天气/场地招者=第二手
     整体降权排后（仍是正向评分、不剔除：低分排后但可入选） */
  if(need.kind==='wxsrc'&&cx&&cx.sysKey&&!isAbilSet(s,cx.sysKey)){
    total*=0.72;
    dims.push({id:'X1',dim:'设置方式',w:1,pts:0,txt:'第二手：仅可学天气/场地招，非自动特性设置手 → 降权排后（不剔除）'});
  }
  dims.sort(function(a,b){return b.pts-a.pts});
  return {score:total*cert,raw:total,cert:cert,dims:dims,gate:(typeof g==='string'?g:def.role)};
}
function needSatisfied(s,need,cx){
  var def=need&&need.def;if(!def)return false;
  try{return !!def.gate(s,cx,need.arg)}catch(e){return false}
}
function countSatisfied(s,needs,cx){
  var k=0;(needs||[]).forEach(function(n){if(needSatisfied(s,n,cx))k++});
  return k;
}
/* ⑤ 体系识别：核心 → 模板（archOfSp 与 tplSys 双证据取最高分；无匹配 → 通用兜底骨架） */
/* ⑤ 体系识别（v4.3）：只认体系（客观天气/场地），**不选骨架/模板**
   模板（ERDATA.templates）降级为「数据层主题」，仅提供体系常见度先验与示例参考名 */
function sysForCore(s){
  var coreS=coreSys(s),sysKey='';
  for(var i=0;i<FIELD_SYS.length;i++){if(coreS.indexOf(FIELD_SYS[i])>-1){sysKey=FIELD_SYS[i];break}}
  var refName='';
  (ERDATA.templates||[]).forEach(function(t){
    if(refName)return;
    var ts=tplSys(t).filter(function(x){return x!=='剧毒场地'});
    if(sysKey&&ts.indexOf(sysKey)>-1)refName=t.name;
  });
  return {sysKey:sysKey,refName:refName,arch:archOfSp(s,coreSide(s),'')};
}
var _learnCache={};
function learnC(s){var k=''+s.id;if(!_learnCache[k])_learnCache[k]=learnOf(s);return _learnCache[k]}
var _finalPool=null;
function finalPool(){if(!_finalPool)_finalPool=ERDATA.species.filter(function(s){return poolOK(s)});return _finalPool}
function canHitSuper(s,t,learn){
  var L=learn||learnC(s),ti=tIdx(t);if(ti<0)return false;
  for(var i=0;i<L.length;i++){var m=MV[L[i]];if(!m||m[4]==='变化')continue;if(!m[5]||m[5]<60)continue;
    var ai=tIdx(m[3]);if(ai<0)continue;if(ERDATA.matchup[ai][ti]>=2)return true}
  return false;
}
/* 队内共同弱点：≥2 只共有、且无人抵抗的属性（D9/D10 的输入，逐槽位动态更新） */
function teamNeed(cx){
  var cnt={},res={};
  (cx.team||[]).forEach(function(m){
    coreWeak(m.s).forEach(function(t){cnt[t]=(cnt[t]||0)+1});
    ERDATA.types.forEach(function(t){if(defCellTrio(m.s,t).inn<=0.5)res[t]=1});
  });
  var out=[];Object.keys(cnt).forEach(function(t){if(cnt[t]>=2&&!res[t])out.push(t)});
  out.sort(function(a,b){return cnt[b]-cnt[a]});
  return out.slice(0,4);
}
/* 需求填充（v4.3）：把一条「需求」交给全图鉴正向评分，取最优填充者
   注意：这里**没有**任何硬排除/否决；池子是全量可见的（未命中的只是在该需求上拿不到分） */
function fillForNeed(need,cx0){
  var p=poolForNeed(cx0.core,cx0,need,(cx0.team||[]),cx0.used);
  return p.length?p[0]:null;
}
function teamFamKey(s){
  try{var fr=ERDATA.familyRoot&&ERDATA.familyRoot[''+s.id];if(fr)return 'r'+fr}catch(e){}
  return 'p'+prefixKey(s);
}
/* ============ ⑥ v4.3 需求驱动动态构建（07 §4.5；取代 v4.2 的 SLOT_TABLE 固定 6 槽骨架） ============
   流程：体系/画像识别 → needList（**动态**生成需求清单，条数与类型随核心变化）
        → 按优先级逐条需求、全图鉴正向评分（零硬门）取最优填充者
        → 多功能加分（R07-27：一只满足 k 条 open 需求 score += (k-1)×MULTI_ROLE_BONUS，并把已满足条目移出）
        → 满 6 只 / 需求清零 / 剩余最高优先级 < STOP_PRIORITY → 停（允许 <6 紧凑队，R07-28）
   ⚠️ 引擎不得以「Σ需求数 == 6」做校验或补齐（07 §2 降级说明）。 */
function needList(core,cx){
  cx=cx||{};
  var p=profileOf(core),needs=[],i=0,role=p.role;
  function add(k,prio,arg){
    var def=NEED_KINDS[k];if(!def||!prio)return null;
    if(arg===undefined)arg=null;   /* 归一化：否则 ''+null vs ''+undefined 比较失败，合并去重不生效 */
    /* R07-28 合并去重：同 kind + 同 arg 合并，取较高优先级 */
    for(var x=0;x<needs.length;x++){
      if(needs[x].kind===k&&(''+needs[x].arg)===''+arg){needs[x].priority=Math.max(needs[x].priority,prio);return needs[x]}
    }
    var n={id:'N-'+('0'+(++i)).slice(-2),kind:k,kindGroup:def.kind,
      label:(typeof def.label==='function'?def.label(arg,p):def.label),role:def.role,
      priority:prio,status:'open',satisfiedBy:[],arg:(arg==null?null:arg),def:def,
      why:(def.why?def.why(core,p,arg,cx):'')};
    needs.push(n);return n;
  }
  /* 点名类：核心盲点 → 答案（R07-26）。按「核心对该属性进攻倍率」升序，最难受的排前面 */
  var ai=tIdx(core.t1),bi=tIdx(core.t2);
  var holes=coverHoles(core).map(function(t){
    var ti=tIdx(t),v=ERDATA.matchup[ai][ti]*(bi>-1?ERDATA.matchup[bi][ti]:1);
    return {t:t,v:v};
  }).sort(function(a,b){return a.v-b.v}).slice(0,4);
  holes.forEach(function(h,ix){add('cover',ix<2?4:3,h.t)});
  /* 画像类（07 §4.5.3 四条核心配方；条数随核心变化，不是固定 6 项） */
  if(role==='速攻核心'){
    add('out',atkBest(core)>=110?2:4);
    add('speed',3);
    add('wallp',4);add('walls',3);
    add('haz',p.fn.haz?0:3);
  }else if(role==='肉盾核心'){
    add('haz',p.fn.haz?0:4);add('rec',p.fn.rec?0:4);add('brk',3);
    add('wallp',3);add('walls',3);add('pivot',p.fn.pivot?0:3);add('clear',p.fn.rem?0:2);
  }else if(role==='强化核心'){
    add('sub',4);add('pass',p.fn.pass?3:2);add('clear',p.fn.rem?0:3);
    add('wallp',3);add('walls',3);add('speed',2);
  }else{ /* 受队核心 */
    add('wear',4);add('rec',p.fn.rec?0:4);add('haz',p.fn.haz?0:4);add('clear',p.fn.rem?0:4);
    add('wallp',3);add('walls',3);
  }
  /* 窗口类（R07-25）：核心自带天气/场地/空间/顺风时，窗口来源与受益者成为独立需求 */
  if(p.field.length){
    add('wxsrc',p.setter?0:5);
    add('wxabuse',p.setter?3:4);
    add('wxreset',3);
  }
  if(p.fn.tr)add('trset',3);
  else if(p.slow&&p.ok)add('trset',4);   /* 低速重炮核心：空间由队友提供 */
  if(p.fn.tr||(p.slow&&p.ok))add('truse',3);  /* 空间打手位：低速加分、中速不达标低分但**不剔除**（零硬门） */
  /* 通用位（低优先，兜底） */
  add('haz',p.fn.haz?0:2);
  add('clear',p.fn.rem?0:2);
  add('speed',2);
  add('anti',1);
  /* 已满足条目置 satisfied（07 §4.5.3 applyExisting）——**收窄口径**（v4.3 实现决定，报告登记）：
     只有「功能类需求」（钉子/除钉/回复/轮转/消耗/替身/接棒…）+「体系受益位」+「自动特性设置手」
     会被核心自身消解；画像/补盲/联防/打手等**队位类需求永远留给队友**——
     否则一只全能核心会把需求清单一次清零，队伍缩到 2~3 只，与 07 §4.5.3 期望的 4~6 只、
     以及用户「天气手+核心+补盲+联防+撒钉+轮转」的队伍模型不符。 */
  needs.forEach(function(n){
    if(n.status!=='open')return;
    var def=n.def;
    var selfOK=(def.kind==='function')||n.kind==='wxabuse'||n.kind==='wxsrc';
    if(!selfOK)return;
    var loc=needCtx(core,{sysKey:cx.sysKey,holes:cx.holes||[],team:cx.team||[{s:core}],L:learnC(core),
      names:(core.abis||[]).concat(core.inns||[]),conv:convOf(core)});
    loc.need=teamNeed({team:[{s:core}]});
    var g='';try{g=(def.selfGate||def.gate)(core,loc,n.arg)}catch(e){g=''}
    if(g){n.status='satisfied';n.satisfiedBy=[core.zh||core.name||('#'+core.id)];n.byCore=true;n.note='核心自身即满足：'+g}
  });
  needs.sort(function(a,b){return b.priority-a.priority});
  return needs;
}
/* 一条需求的全量候选池（零硬门：gate 只判「能不能干这活」；排序按正向分 + 多功能加分） */
function poolForNeed(core,cx0,need,team,used){
  cx0=cx0||{};
  var out=[],open=(cx0.openNeeds&&cx0.openNeeds.length?cx0.openNeeds:[need]);
  finalPool().forEach(function(t){
    if(!isValidSp(t))return;                       /* B7 id 2502 护栏 */
    if(''+t.id===''+core.id)return;
    if(used&&used[''+t.id])return;
    var L=learnC(t);
    var loc=needCtx(core,{sysKey:cx0.sysKey,holes:cx0.holes||[],team:team||[{s:core}],L:L,
      names:(t.abis||[]).concat(t.inns||[]),conv:convOf(t)});
    loc.need=(cx0.needHoles||(cx0.need||[]));
    var r=needScore(t,need,loc);if(!r)return;
    var kRaw=countSatisfied(t,open,loc),k=Math.min(kRaw,1+NEED_CFG.MULTI_MAX);
    /* v4.3.1/4.3.2：奇石权衡通过形态加分 + why（配装含「进化奇石」；权衡上下文 = 核心体系/是否空间队/核心侧） */
    var ev=evioAdv(t,coreSys(core),coreIsSpace(core),coreSide(core));
    if(ev){r.dims=r.dims.concat([{id:'EV',dim:'进化奇石',w:1,pts:EVIO.PTS,txt:ev.why}]);
      r.dims.sort(function(a,b){return b.pts-a.pts});r.score=r.score+EVIO.PTS}
    out.push({s:t,score:r.score+(k-1)*NEED_CFG.MULTI_ROLE_BONUS,base:r.score,multi:k,multiRaw:kRaw,
      dims:r.dims,gate:r.gate,loc:loc,evio:ev||null});
  });
  out.sort(function(a,b){return (b.score-a.score)||(''+a.s.id<' '+b.s.id?-1:1)});
  return out;
}
/* buildTeamByNeeds(core,opts)：需求驱动 → 完整队伍方案（体系总览 + 需求清单 + 成员） */
function buildTeamByNeeds(core,opts){
  opts=opts||{};
  var sy=sysForCore(core),sysKey=sy.sysKey,prof=profileOf(core);
  var holes=coverHoles(core).slice(0,6);
  var base=cx0Of(core,sysKey,holes);
  var needs=needList(core,base);
  var team=[{s:core,core:true,need:null,score:null,dims:[],multi:0,gate:'核心',links:[]}];
  var used={},fam={};used[''+core.id]=1;fam[teamFamKey(core)]=1;
  var pools={},stopReason='',guard=0;
  while(team.length<NEED_CFG.MAX_TEAM&&guard++<24){
    var open=needs.filter(function(n){return n.status==='open'});
    if(!open.length){stopReason='STOP_ALL_NEEDS_MET';break}
    var need=open[0];
    if(need.priority<NEED_CFG.STOP_PRIORITY){stopReason='STOP_BELOW_PRIORITY';break}
    var ctx=base;ctx.openNeeds=open;ctx.used=used;ctx.need=teamNeed({team:team});
    var pool=poolForNeed(core,ctx,need,team,used);
    /* 形态去重（07 §4.5.4）：同 familyRoot 已在队中 → 不在该需求池中出现（保留最高分形态） */
    var pool2=pool.filter(function(x){return !fam[teamFamKey(x.s)]});
    pools[need.id]={need:need,list:pool2,all:pool};
    if(!pool2.length){
      if(pool.length){need.status='blocked';need.note='候选同族已在队中（形态去重）';continue}
      need.status='unmatched';need.note='全图鉴无正向候选';continue;
    }
    var pick=pool2[0];
    /* 多功能加分申报（R07-27）：该候选同时能满足的其它 open 需求 → 一并置 satisfied */
    var met=[];
    open.forEach(function(nd){
      if(nd===need)return;
      if(met.length>=NEED_CFG.MULTI_MAX)return;              /* 上限：见 NEED_CFG.MULTI_MAX 说明 */
      if(needSatisfied(pick.s,nd,pick.loc))met.push(nd);
    });
    need.status='satisfied';need.satisfiedBy=[pick.s.zh||pick.s.name];
    need.gateWhy=pick.gate;need.pickScore=pick.score;
    met.forEach(function(nd){
      nd.status='satisfied';nd.satisfiedBy=[pick.s.zh||pick.s.name];nd.byMulti=true;
      nd.note='由「'+(pick.s.zh||pick.s.name)+'」顺带满足（多功能 +'+((met.length)*NEED_CFG.MULTI_ROLE_BONUS)+'）';
    });
    var member={s:pick.s,core:false,need:need,score:pick.score,base:pick.base,multi:1+met.length,
      dims:pick.dims,gate:pick.gate,met:met.map(function(x){return x.label})};
    member.links=[];   /* links 在队伍定稿后统一生成（需要整队信息） */
    team.push(member);
    used[''+pick.s.id]=1;fam[teamFamKey(pick.s)]=1;
  }
  if(team.length>=NEED_CFG.MAX_TEAM)stopReason='STOP_SIZE_LIMIT';
  /* 联动（四源合成：体系受益 / 补盲 / 联防 / 接力） */
  team.forEach(function(m){
    if(m.core){m.links=[];return}
    m.links=linksFor(m.s,{core:core,prof:prof,team:team},m.need,sysKey);
  });
  var openLeft=needs.filter(function(n){return n.status==='open'||n.status==='unmatched'||n.status==='blocked'});
  var sat=needs.filter(function(n){return n.status==='satisfied'}).length;
  var audit={filled:team.length,total:needs.length,satisfied:sat,
    needCoverage:needs.length?Math.round(sat*100/needs.length):100,
    openNeeds:openLeft.map(function(n){return n.label+(n.note?'（'+n.note+'）':'')}),
    warnings:[]};
  if(team.length>=NEED_CFG.MAX_TEAM&&openLeft.length)
    audit.warnings.push('已满 6 只但仍有 '+openLeft.length+' 条需求未满足（仍输出，不自动补齐）');
  if(team.length<NEED_CFG.MAX_TEAM&&!openLeft.length)
    audit.warnings.push('需求已清零 → 输出 '+team.length+' 只紧凑队伍（不再为凑满 6 只而加人）');
  return {core:core,prof:prof,sysKey:sysKey,sys:sy,refName:sy.refName,arch:sy.arch,
    needs:needs,team:team,pools:pools,audit:audit,stopReason:stopReason,
    overview:teamOverview({core:core,prof:prof,sysKey:sysKey,team:team,needs:needs})};
}
/* 兼容别名（旧调用点/旧脚本）：buildTeam(s,opts) → 需求驱动版 */
function buildTeam(s,opts){return buildTeamByNeeds(s,opts)}
function cx0Of(core,sysKey,holes){
  return {core:core,sysKey:sysKey,holes:holes||[],team:[{s:core}],L:learnC(core),
    names:(core.abis||[]).concat(core.inns||[]),conv:convOf(core),need:teamNeed({team:[{s:core}]})};
}
/* 联动（v4.3 需求驱动版）：体系受益 / 补盲 / 联防 / 接力 四源合成 */
function linksFor(s,plan,need,sysKey){
  var out=[],L=learnC(s),core=plan.core;
  if(!core)return out;
  if(sysKey){
    var bn=(s.abis||[]).concat(s.inns||[]).filter(function(n){return SYS_MAP[n]===sysKey});
    if(bn.length)out.push({k:'sys',txt:'体系受益 '+bn.join('/')+'（'+sysKey+' 窗口内增益）'});
    else{
      var c=countLearnNames(s,(SYS_MV_KEYS[sysKey]||[]),L);
      if(c)out.push({k:'sys',txt:'可用 '+sysKey+' 受益招 '+c+' 个'});
      else{
        var any=isSetterAny(s);
        if(any&&any!==sysKey)out.push({k:'sys',txt:'自带 '+any+' 体系（可作第二窗口）'});
      }
    }
  }
  var hit=coverHoles(core).filter(function(t){return canHitSuper(s,t,L)});
  if(hit.length)out.push({k:'cover',txt:'补核心盲点：'+hit.slice(0,3).join('/')});
  var res=coreWeak(core).filter(function(t){return defCellTrio(s,t).inn<=0.5});
  if(res.length)out.push({k:'wall',txt:'替核心吸收：'+res.slice(0,3).join('/')});
  if(learnHasName(s,'接棒',L)&&hasAny(L,FUNC_MV.boost))out.push({k:'pass',txt:'可自强化后接棒传递'});
  else if(hasAny(L,FUNC_MV.rec))out.push({k:'rec',txt:'提供回复/续航'});
  else if(hasAny(L,FUNC_MV.pivot))out.push({k:'pivot',txt:'轮转保节奏'});
  if(need)out.push({k:'need',txt:'满足需求「'+need.label+'」：'+(need.gateWhy||'')});
  return out;
}
/* 体系总览（怎么启动 / 怎么受益 / 怎么轮转）——按需求与成员动态生成 */
function teamOverview(plan){
  var team=(plan&&plan.team)||[],sysKey=(plan&&plan.sysKey)||'',profs=[];
  team.forEach(function(m){profs.push(profileOf(m.s))});
  var setterIdx=-1,abuserIdx=-1,trIdx=-1;
  profs.forEach(function(p,ix){
    if(setterIdx<0&&p.setter&&(!sysKey||p.field.indexOf(sysKey)>-1))setterIdx=ix;
    if(abuserIdx<0&&sysKey&&((p.field.indexOf(sysKey)>-1)||countLearnNames(team[ix].s,(SYS_MV_KEYS[sysKey]||[]),learnC(team[ix].s))>0))abuserIdx=ix;
    if(trIdx<0&&p.fn.tr)trIdx=ix;
  });
  var nm=function(ix){return ix>=0&&team[ix]?(team[ix].s.zh||team[ix].s.name):'—'};
  var start=sysKey?('以 '+(team[0]?team[0].s.zh:'核心')+' 为核心；'+sysKey+' 窗口由 '+(setterIdx>=0?nm(setterIdx):'队友（可学 '+sysKey+' 招者）')+' 起手')
    :('以 '+(team[0]?team[0].s.zh:'核心')+' 为首发（无天气/场地依赖；靠先制与轮转抢节奏）');
  var benefit=sysKey?('窗口内受益者：'+(abuserIdx>=0?nm(abuserIdx):'待补')+'；体系增伤 ×1.5 / 场地 ×1.3（已按游戏源码核对）')
    :('输出靠本系高威力 × 强化/道具，防守靠免疫特性与联防');
  var rotate='轮转：'+(profs.some(function(p){return p.fn.pivot})?('游击手 '+nm(profs.findIndex(function(p){return p.fn.pivot}))+' 保节奏'):'无轮转招，靠先制与换人')
    +(trIdx>=0?('；空间手 '+nm(trIdx)+'（低速重炮先手）'):'');
  return {start:start,benefit:benefit,rotate:rotate};
}
/* V10 修复：备选池「展开全部候选 / 按名定位」——
   背景（验证代理 V10）：槽位卡备选区只渲染前 8 + 末 3，中间位次在 UI 不可见，
   用户会误判为「仍在剔除」（典型：空间队空间打手槽内的龙头地鼠 #530，排 622/1047、13 分）。
   池子按 plan 实例登记，点击时按需渲染（保持 DOM 轻量）。 */
var PLAN_POOLS={},PLAN_UID=0;
/* 池内筛选（纯函数，便于断言）：q 为空 = 全量（上限 400 行，保持 DOM 轻量）；
   q 非空 = 中文名/英文名/编号 子串包含（模糊命中），位次保留全池排名 */
function poolSel(uid,k,q){
  var P=(PLAN_POOLS[uid]||{})[k]||[],qq=(q==null?'':String(q)).trim(),rows=[];
  for(var i=0;i<P.length;i++){
    var r=P[i];
    if(qq){
      var ok=(String(r.zh).indexOf(qq)>=0)||(String(r.en||'').toLowerCase().indexOf(qq.toLowerCase())>=0)||(String(r.id)===qq);
      if(!ok)continue;
    }
    if(rows.length<400)rows.push(r);
  }
  return rows;
}
function poolHit(uid,k,q){
  var P=(PLAN_POOLS[uid]||{})[k]||[],qq=(q==null?'':String(q)).trim(),n=0;
  for(var i=0;i<P.length;i++){var r=P[i];
    if(String(r.zh).indexOf(qq)>=0||String(r.en||'').toLowerCase().indexOf(qq.toLowerCase())>=0||String(r.id)===qq)n++;}
  return n;
}
function poolRender(uid,k,q){
  var box=document.getElementById('pool_'+uid+'_'+k);if(!box)return;
  var P=(PLAN_POOLS[uid]||{})[k]||[],qq=(q==null?'':String(q)).trim(),rows=poolSel(uid,k,q),hit=poolHit(uid,k,q);
  if(!rows.length){box.innerHTML='<div class="tip" style="font-size:11px">该需求候选池内没有匹配「'+esc(qq)+'」的候选（池共 '+P.length+' 只）</div>';return}
  box.innerHTML='<div style="font-size:11px;color:var(--sub)">'+(qq?('按名定位「'+esc(qq)+'」：命中 '+hit+' 只（按维度分排序，位次保留全池排名）'):('全部候选 '+P.length+' 只（按维度分降序；<b>低分排后但均可入选，不剔除</b>）'))+'</div>'+
    '<div class="poolscroll">'+rows.map(function(r){
      return '<span class="poolrow'+(qq?' hit':'')+'" title="'+escq(r.zh)+' #'+r.id+'" onclick="selectCore('+r.id+')"><b>#'+r.i+'</b>'+sprRaw(r.id,'')+esc(r.zh)+' <i>'+esc(String(r.sc))+' 分</i></span>';
    }).join('')+'</div>';
}
function poolAll(uid,k){poolRender(uid,k,'')}
function poolFind(uid,k){var e=document.getElementById('pfin_'+uid+'_'+k);poolRender(uid,k,e?e.value:'')}
function spId2Obj(id){for(var i=0;i<ERDATA.species.length;i++){if(''+ERDATA.species[i].id===''+id)return ERDATA.species[i]}return null}
/* 需求方案卡（v4.3）：核心画像 → 队伍需求（动态） → 每需求的最优推荐与候选池 → 队伍成员
   —— 取代 v4.2 的「骨架/槽位卡」；不含任何固定槽位命名与「低排位示例」固定框架。 */
function roleTagOfNeed(need){
  var k=need?need.kind:'';
  if(['haz','clear','rec','wear','pivot','anti'].indexOf(k)>-1)return '肉盾';
  if(k==='sub'||k==='pass')return '强化';
  if(k==='wallp'||k==='walls'||k==='drain')return '肉盾';
  return '输出';
}
/* v4.3.3：道具角色（与招式角色分离）——天气来源槽 → 天气岩石；空间手 → 肉盾装；控速 → 控速装 */
function itemTagOfNeed(need){
  var k=need?need.kind:'';
  if(k==='wxsrc')return '天气';
  if(k==='trset')return '肉盾';
  if(k==='speed')return '控速';
  if(k==='sub'||k==='pass')return '强化';
  if(['haz','clear','rec','wear','pivot','anti','wallp','walls','drain'].indexOf(k)>-1)return '肉盾';
  return '输出';
}
/* v433-1：队伍行核心的 tag 不再写死「输出」——按核心实际画像（受/肉盾 → 肉盾；强化 → 强化；设置手 → 天气）出装 */
/* v45-1：核心的**道具 tag 判据**抽成公共函数（流派卡与队伍行同源，避免两处漂移） */
function roleTagOfProf(p){
  var r=(p&&p.role)||'';
  if(/受队|肉盾|盾/.test(r))return '肉盾';
  if(/强化/.test(r))return '强化';
  if(/空间|顺风|控速/.test(r))return '肉盾';
  return '输出';
}
/* 窗口类（天气/场地）设置手 → 道具走窗口延长件；**须真持有可开窗口**（sysKey 非空）才判「天气」
   —— 与队伍行 itemTagOfCore 判据逐字一致（如霸王花=剧毒场地设置手但 coreSys=[] → 仍按输出） */
function coreItemTagOf(p,s,sysKey){
  return (sysKey&&typeof isSetterAny==='function'&&isSetterAny(s))?'天气':roleTagOfProf(p);
}
function roleTagOfCore(plan,s){return roleTagOfProf(plan&&plan.prof)}
/* 流派卡用（无 plan 时以画像代替） */
function itemTagOfCoreProf(p,s){return coreItemTagOf(p,s,(coreItemCtxOf(s).sys||''))}
function coreItemCtxOf(s){var sy=(coreSys(s)||[]).filter(function(t){return isWxSys(t)})[0]||'';return sy?{sys:sy}:{}}
function itemTagOfCore(plan,s){
  if(plan&&plan.sysKey&&isSetterAny(s))return '天气';   /* 核心自身即设置手：走天气窗口装 */
  var t=roleTagOfCore(plan,s);
  return (t==='输出')?'输出':t;
}
/* 停止原因（内部枚举 → 玩家可读文案；枚举值本身仍是引擎契约，UI 不外露） */
function stopReasonZh(r){return ({STOP_ALL_NEEDS_MET:'需求已清零',STOP_BELOW_PRIORITY:'剩余需求优先级过低',STOP_SIZE_LIMIT:'已满 6 只'})[String(r||'')]||'—'}
function renderNeedPlan(s){
  var plan=null;
  try{plan=buildTeamByNeeds(s)}catch(e){return '<div class="sec"><h3>队伍构建方案</h3><div class="tip">方案生成失败：'+esc(''+e)+'</div></div>'}
  var h='<div class="sec" id="teamPlan"><h3>🧩 需求驱动队友（动态推导 · 队伍方案 · 默认展示）</h3>';
  h+='<div class="tip" style="background:#e8f5e9;border-color:var(--ok)"><b>体系总览</b><br>'+
    '· <b>怎么启动：</b>'+esc(plan.overview.start)+'<br>'+
    '· <b>怎么受益：</b>'+esc(plan.overview.benefit)+'<br>'+
    '· <b>怎么轮转：</b>'+esc(plan.overview.rotate)+'</div>';
  /* B⑥-4（v4.x 要求，v4.3 延续）：体系核心自身不是设置手时，天气/场地由队友提供 */
  if(plan.sysKey&&!isSetterAny(plan.core)){
    var wxn=plan.needs.filter(function(n){return n.kind==='wxsrc'})[0];
    var wt=wxn&&plan.pools[wxn.id]&&plan.pools[wxn.id].list[0];
    h+='<div class="tip" style="background:#fff8e1;border-color:var(--warn)"><b>天气/场地由队友提供</b>：推荐 '+
      esc(wt?wt.s.zh:'—')+(wt?('（'+(wt.gate||'')+'）'):'')+' 作为 '+esc(plan.sysKey)+' 体系手；'+
      '核心自身非设置手，配招功能槽不放天气招（把手位留给队友，核心专注输出/联防）。</div>';
  }
  h+='<details class="inline"><summary>📐 构建口径（需求驱动 · 动态推导）—— 展开看评分与终止规则</summary><div style="margin-top:4px">'+
    '<b>无固定骨架 / 无固定模板</b> —— 由核心画像动态生成需求清单（条数与类型随核心变化），'+
    '逐条需求在全图鉴做正向评分，选最优填充者；一只满足多条需求 = 多功能加分 <b>+(k−1)×'+NEED_CFG.MULTI_ROLE_BONUS+'</b>；'+
    '满 '+NEED_CFG.MAX_TEAM+' 只 / 需求清零 / 剩余最高优先级 &lt; '+NEED_CFG.STOP_PRIORITY+' → 立即停手（允许 &lt;'+NEED_CFG.MAX_TEAM+' 只紧凑队，不自动补齐）。'+
    '<b>零硬门</b>：候选池全量可见（含中间位次与低分），门只判「能不能干这个活」，不达标只是该需求上拿不到分、排在后面。</div></details>';
  var pr=plan.prof;
  var _sb=(pr.side==='特殊'?pr.atk.sp:pr.atk.ph)||pr.atk.sp||pr.atk.ph;
  h+='<div class="tip"><b>核心画像</b>（四画像推导）：'+esc(pr.role)+' · '+esc(pr.side)+'向 · 力度 '+pr.power+'（本系最高 '+esc(_sb?MV[_sb.id][1]+'('+_sb.pow+')':'—')+'）'+
    ' · 速度 '+pr.du.spd+' · 耐久 '+pr.du.bulk+'（物理 '+pr.du.phys+' / 特殊 '+pr.du.spec+'） · 体系 '+esc(plan.sysKey||'无')+
    (plan.refName?(' · 参考主题「'+esc(plan.refName)+'」（仅先验，不作战术队形）'):'')+'</div>';
  /* ① 需求清单 */
  var puid='nd'+(++PLAN_UID),ppool={};
  h+='<div class="sec" style="margin:8px 0"><h3>构建逻辑 · 队伍需求（'+plan.needs.length+' 条，随核心动态生成）</h3>';
  plan.needs.forEach(function(n,k){
    var st=n.status,badge='',cls='';
    if(st==='satisfied'){badge='<span class="badge">已满足</span>'+(n.byCore?'<span class="badge">核心自身</span>':'')+(n.byMulti?'<span class="badge">多功能</span>':'')}
    else if(st==='unmatched'){badge='<span class="badge" style="background:#ffe0b2">无候选</span>'}
    else if(st==='blocked'){badge='<span class="badge" style="background:#ffe0b2">同族已在队</span>'}
    else{badge='<span class="badge" style="background:#e0e0e0">未满足（低优先，未凑人）</span>'}
    h+='<details class="needcard"'+(k<2?' open':'')+'><summary><b>'+('\u2460\u2461\u2462\u2463\u2464\u2465\u2466\u2467'[k]||(k+1)+'.')+' '+esc(n.label)+'</b> '+
      '<span class="badge">优先级 '+n.priority+'</span>'+badge+
      (n.satisfiedBy.length?(' · <b>'+esc(n.satisfiedBy.join('+'))+'</b>'):'')+'</summary>';
    h+='<div style="font-size:11px;color:var(--sub);margin:2px 0">职责：'+esc(n.role)+(n.why?('　|　为什么需要：'+esc(n.why)):'')+(n.note?('　|　'+esc(n.note)):'')+'</div>';
    var pk=plan.pools[n.id],top=pk&&pk.list&&pk.list[0]?pk.list[0]:null;
    if(top){
      h+='<div class="needrow">'+sprImg(top.s.id,'spinl')+'<b>'+esc(top.s.zh)+'</b> <span style="color:var(--sub);font-size:11px">#'+top.s.id+'</span>'+
        ' <span class="badge">'+esc(String(Math.round(top.score*10)/10))+' 分</span>'+
        (top.multi>1?(' <span class="badge">多功能 ×'+top.multi+'（+'+((top.multi-1)*NEED_CFG.MULTI_ROLE_BONUS)+'）</span>'):'')+
        ' <button class="btn-mini" onclick="event.stopPropagation();addToTeam(spId2Obj('+top.s.id+'),null)" title="加入队伍构建">➕ 入队</button>'+
        ' <button class="btn-mini" onclick="event.stopPropagation();selectCore('+top.s.id+')" title="设为核心">🎯 核心</button>'+
        '<div style="font-size:11px;color:var(--sub)">推荐理由：'+esc(top.gate||'')+'；'+(top.dims||[]).slice(0,4).map(function(d){return esc(d.dim+' '+d.txt)}).join(' ｜ ')+
        '<br>合计 '+esc(String(Math.round(top.score*10)/10))+' 分（原始 '+esc(String(Math.round(top.base*10)/10))+' + 多功能 +'+((top.multi-1)*NEED_CFG.MULTI_ROLE_BONUS)+'）</div>'+
        (top.s.id!==undefined?needBuildHtml(top.s,roleTagOfNeed(n),itemTagOfNeed(n),{sys:plan.sysKey,need:n.kind}):'')+
        '</div>';
    }else{
      h+='<div class="mini" style="color:var(--sub)">'+(n.byCore?'核心自身已满足该需求':'全图鉴无正向候选（该需求上无候选拿到分）')+'</div>';
    }
    if(pk&&pk.list&&pk.list.length>1){
      h+='<div style="font-size:11px;color:var(--sub);margin-top:2px">备选（同一需求池内按正向分排序，共 '+pk.list.length+' 只；低分排后但均可入选）：'+
        pk.list.slice(1,7).map(function(x){return '<span class="abi" onclick="event.stopPropagation();selectCore('+x.s.id+')">'+esc(x.s.zh)+'('+esc(String(Math.round(x.score*10)/10))+')</span>'}).join(' ')+'</div>';
    }
    if(pk&&pk.list&&pk.list.length>8){
      h+='<div class="poolbox"><button class="btn-mini" onclick="event.stopPropagation();poolAll(\''+puid+'\','+k+')">展开全部候选（'+pk.list.length+' 只，含中间位次）</button>'+
        '<input class="pin" id="pfin_'+puid+'_'+k+'" placeholder="按名定位：名称/英文/编号" onclick="event.stopPropagation()">'+
        '<button class="btn-mini" onclick="event.stopPropagation();poolFind(\''+puid+'\','+k+')">🔍 定位</button></div>'+
        '<div id="pool_'+puid+'_'+k+'"></div>'+
        '<div class="tip" style="font-size:11px">候选池按维度分降序：<b>低分排后但均可入选，不剔除</b>（零硬门——'+
        '过门只判「能不能干这件事」，速度/耐久等维度只加减分，不做否决）。</div>';
    }
    h+='</details>';
    ppool[k]=(pk&&pk.list?pk.list:[]).map(function(x,ix){return {i:ix+1,id:x.s.id,zh:x.s.zh,en:x.s.en,sc:Math.round(x.score*10)/10}});
  });
  h+='</div>';
  PLAN_POOLS[puid]=ppool;
  /* ② 队伍成员（完整方案：配招/特性/道具/性格/职责/联动） */
  h+='<div class="sec" style="margin:8px 0"><h3>队伍方案（'+plan.team.length+' 只'+(plan.team.length<NEED_CFG.MAX_TEAM?'（需求已清零，紧凑队）':'')+'）</h3>';
  plan.team.forEach(function(m,ix){
    var L=m.links||[];
    h+='<div class="slotbody"><div class="slothead">'+sprImg(m.s.id,'spinl')+'<b>'+esc(m.s.zh)+'</b> <span style="color:var(--sub);font-size:11px">#'+m.s.id+'</span>'+
      (m.core?' <span class="badge">核心</span>':'')+(m.need?' <span class="badge">'+esc(m.need.label)+'</span>':'')+
      (m.score!=null?(' <span class="badge">'+esc(String(Math.round(m.score*10)/10))+' 分</span>'):'')+
      (m.multi>1?(' <span class="badge">多功能 ×'+m.multi+'</span>'):'')+
      ' <button class="btn-mini" onclick="event.stopPropagation();addToTeam(spId2Obj('+m.s.id+'),null)">➕ 入队</button>'+
      ' <button class="btn-mini" onclick="event.stopPropagation();selectCore('+m.s.id+')">🎯 设为核心</button></div>';
    if(L.length)h+='<div style="font-size:11px;margin:2px 0">↔ '+L.map(function(x){return esc(x.txt)}).join('；')+'</div>';
    h+=needBuildHtml(m.s,m.core?roleTagOfCore(plan,m.s):roleTagOfNeed(m.need),m.core?itemTagOfCore(plan,m.s):itemTagOfNeed(m.need),{sys:plan.sysKey,need:m.need&&m.need.kind});
    h+='</div>';
  });
  h+='</div>';
  var au=plan.audit;
  h+='<div class="tip" style="font-size:11px">体检：需求覆盖 '+au.needCoverage+'%（已满足 '+au.satisfied+'/'+au.total+'）· 队伍 '+au.filled+' 只 · 停止原因 '+esc(stopReasonZh(plan.stopReason))+
    (au.openNeeds.length?('<br>未满足需求：'+au.openNeeds.map(esc).join('；')):'')+
    (au.warnings.length?('<br>告警：'+au.warnings.map(esc).join('<br>告警：')):'')+'</div>';
  h+='</div>';
  /* v432-1：权衡否决可见（低样式折叠块，不占主推荐位） */
  try{
    var vs=evioVetoSummary(s);
    if(vs&&vs.n){
      h+='<details class="inline" style="margin-top:6px"><summary>🪨 奇石权衡否决 '+vs.n+' 只（进化型凭道具/速度/力度反超 → 不推荐）</summary>';
      h+='<div class="tip" style="font-size:11px">口径（奇石权衡模型）：A = 本形态+进化奇石（双防×1.5） vs B = 同族终态+其最优道具；'+
        '未过门（综合权衡未达阈值）即不推荐 —— <b>否决 ≠ 剔除</b>，候选池仍可查看全部名次。</div>';
      vs.list.forEach(function(x){
        h+='<div style="font-size:11px;margin:2px 0">'+sprImg(x.s.id,'spinl')+
          '<span class="abi" onclick="openSpById('+x.s.id+')">'+esc(x.s.zh)+'</span> <span style="color:var(--sub)">#'+x.s.id+'</span>：权衡否决 → <b>'+esc(x.fam)+'</b>+'+esc(x.itemB)+
          ' 更优（有效耐久 '+Math.round(x.A.bulk)+' vs '+Math.round(x.B.bulk)+'，综合权衡 '+x.S+'）'+
          ' <span style="color:var(--sub)" title="'+escq(x.why)+'">ℹ️ 依据</span></div>';
      });
      h+='<div class="tip" style="font-size:11px">共 '+vs.n+' 只，按 S 升序（越靠前 = 与同族终态+其道具的差距越大）；<b>全部列出、不隐藏中间位次</b>，折叠块默认收起、不占主推荐位。</div>';
      h+='</details>';
    }
  }catch(eV){}
  return h;
}
/* 成员/候选的配招建议块（招式/特性/道具可点击跳转） */
function needBuildHtml(sp,roleTag,itemTag,ctx){
  var b=null;
  try{b=mkBuild(sp,coreSide(sp),'队员配置',stabBest(sp,'特殊'),stabBest(sp,'物理'),roleTag||'输出',itemTag,ctx)}catch(e){return ''}
  var h='<div style="font-size:11px;margin:2px 0"><b>配招：</b>'+((b.mv.main||[]).map(function(m){
      var nm=MV[m.id]?MV[m.id][1]:String(m.id);
      return '<span class="abi" onclick="event.stopPropagation();gotoMv('+jsl(nm)+')" title="'+escq((m.why||[]).join('；'))+'">'+esc(nm)+'</span>';}).join(' '))+
    ((b.mv.backup||[]).length?('　<i style="color:var(--sub)">备选：</i>'+(b.mv.backup||[]).slice(0,3).map(function(id){
      var nm=MV[id]?MV[id][1]:String(id);
      return '<span class="abi" onclick="event.stopPropagation();gotoMv('+jsl(nm)+')">'+esc(nm)+'</span>';}).join(' ')):'')+'</div>';
  h+='<div style="font-size:11px;margin:2px 0"><b>特性：</b>'+(b.abi||[]).slice(0,2).map(function(a){
      return '<span class="abi" onclick="event.stopPropagation();gotoAbi('+jsl(a.n)+')" title="'+escq((a.why||[]).join('；'))+'">'+esc(a.n)+'</span>';}).join(' ')+
    '　<b>道具：</b>'+(b.it||[]).slice(0,3).map(function(x,i){
      return (i===0?('<b class="abi" style="border-color:var(--ok)" onclick="event.stopPropagation();gotoItem('+jsl(x[0])+')" title="主推：'+escq(x[1]+'')+'">⭐'+esc(x[0])+'</b>'):('<span class="abi" style="opacity:.85" onclick="event.stopPropagation();gotoItem('+jsl(x[0])+')" title="备选：'+escq(x[1]+'')+'">'+esc(x[0])+'</span><span style="font-size:10px;color:var(--sub)">备选</span>'))}).join(' ')+
    '　<b>性格：</b>'+esc((b.nat||[]).map(function(n){return n[0]}).join(' / '))+'</div>';
  return h;
}
function renderCore(s){
  if(!s){$('coreOut').innerHTML='<div class="tip">先在上方搜索并选定一只核心宝可梦</div>';$('ruleBoxCore').innerHTML=wxRuleHtml();return}
  if(!isValidSp(s)){$('coreOut').innerHTML='<div class="tip">该编号为占位/无效物种（种族值六项为 0），已过滤、不参与配队推荐。</div>';$('ruleBoxCore').innerHTML=wxRuleHtml();return}
  var prof=coreRole(s),side=coreSide(s),weak=coreWeak(s),recs=findTeammates(s,side);
  var note=null;
  ERDATA.coreNotes.forEach(function(n){if(n.id==s.id)note=n});
  var html='<div class="sec" style="margin-top:12px"><h2>'+sprImg(s.id,'spinl')+esc(s.zh)+' <span style="font-size:13px;color:var(--sub)">'+esc(s.en)+' #'+s.id+'</span>'+
    ' <button class="btn-mini" onclick="addToTeam(coreSel,null);renderCore(coreSel)" title="加入队伍构建">➕ 入队</button></h2>';
  html+='<div style="margin:4px 0">'+tlabel(s.t1)+(s.t2!==s.t1?' '+tlabel(s.t2):'')+'</div>';
  /* 人工分析（用户 分类.xlsx 命中） */
  if(note){
    html+='<div class="sec" style="border-color:var(--warn);background:#fff8e6"><h3>📌 你的人工分析（分类.xlsx）</h3>';
    if(note.cat)html+='<div><b>定位：</b>'+esc(note.cat)+'</div>';
    if(note.note)html+='<div style="margin:4px 0">'+esc(note.note)+'</div>';
    html+='<div class="scroll"><table style="margin-top:6px"><thead><tr><th></th><th>种族值/倍率</th><th>最高本系威力</th><th>强化/抗性手段</th></tr></thead><tbody>';
    if(note.atk.bst||note.atk.mul)html+='<tr><td><b>攻击性</b></td><td>'+esc(note.atk.bst)+(note.atk.mul?'（倍率 '+esc(note.atk.mul)+'）':'')+'</td><td>'+esc(note.atk.pow||'-')+'</td><td>'+esc(note.atk.boost||'-')+'</td></tr>';
    if(note.def.bst||note.def.mul)html+='<tr><td><b>防御性</b></td><td>'+esc(note.def.bst)+(note.def.mul?'（倍率 '+esc(note.def.mul)+'）':'')+'</td><td>-</td><td>'+esc(note.def.boost||'-')+(note.def.resist?'；抗性：'+esc(note.def.resist):'')+'</td></tr>';
    html+='</tbody></table></div>';
    if(note.remark)html+='<div style="margin-top:4px;font-size:12px;color:var(--sub)">备注：'+esc(note.remark)+'</div>';
    html+='<div style="font-size:11px;color:var(--sub);margin-top:4px">以下是引擎自动分析，供交叉参考</div></div>';
  }
  /* 定位 + 强度概要 */
  html+='<div class="sec"><h3>定位判断</h3><div class="tip" style="background:#e3f2fd;border-color:var(--accent)"><b>'+esc(prof.role)+'</b> —— '+esc(prof.desc)+'；种族 物攻'+s.base[1]+'/特攻'+s.base[3]+'/速度'+s.base[5]+'</div>'+
    '<div style="font-size:11px;color:var(--sub);margin-top:4px">耐久口径（口径实读）：物理耐久 = HP+物攻+防御、特殊耐久 = HP+特攻+特防；≥300 判肉盾、≥230 偏耐久、≥270 开肉盾流派。</div>';
  var tags=coreTags(s);
  if(tags.length)html+='<div style="margin-top:6px">细分定位：'+tags.map(function(t){return '<span class="abi">'+esc(t)+'</span>'}).join(' ')+'</div>';
  var in0=coreIntensity(s);
  html+='<div style="margin-top:6px;font-size:12px;color:var(--sub)">强度：'+(in0.mults.length?in0.mults.map(function(m){return esc(m.n)+(m.o.cond?'('+esc(m.o.cond)+')':'')+'×'+m.o.mul}).join('、'):'—')+
    '　本系最高威力 '+(in0.bestPow.length?in0.bestPow.map(function(x){return esc(MV[x.id][1])+'('+x.pow+')'}).join(' / '):'—')+
    '　耐久 '+esc(in0.phys)+' / '+esc(in0.spec)+'　'+esc(coreComment(s))+'</div></div>';
  /* 弱点 */
  html+='<div class="sec"><h3>弱点（天性口径）</h3><div>'+(weak.length?weak.map(tlabel).join(' '):'<span style="color:var(--ok)">无弱点</span>')+
    '　<span style="font-size:11px;color:var(--sub)">找队友时优先补这些</span></div></div>';
  /* 流派大卡片（v4.x B④）：大标题 + 一句话简介，点击展开详情（种族/强度/盲点/配招依据/本流派队友/机制口径） */
  var builds=deriveBuilds(s);
  var in0c=coreIntensity(s);
  builds.forEach(function(bd,i){
    var bSet=(bd.abi&&bd.abi[0]&&bd.abi[0].n)?bd.abi[0].n:'—';
    /* B9 分层5：盲点检查 —— ①4 招对 21 属性 max 倍率 <1 全列表 ②特性免疫警示 ③双刀补盲 */
    var convB=convOf(s);
    var profB=setCoverProfile(s,bd.mv.main.map(function(sl){return sl.id}),convB),blind=blindList(profB);
    var altProf=null;
    if(bd.side!=='双刀'){
      var altAtt=pickAttacks(s,bd.side==='物理'?'特殊':'物理',2,bd.roleTag);
      if(altAtt.length)altProf=setCoverProfile(s,altAtt.map(function(x){return x.id}),convB);
    }
    /* B⑤：本流派队友；B⑥-4：体系核心非设置手 → 天气由队友提供 */
    var tms=findTeammates(s,bd.side,bd.roleTag);
    var wxNeed=!!(bd.roleTag==='天气'&&!bd.mv.selfSetter);
    var setter=null;
    if(wxNeed){
      var pSys=coreSys(s).filter(isWxSys)[0];
      if(pSys){for(var q=0;q<tms.length;q++){if(isSetter(tms[q].s,pSys)){setter={x:pSys,s:tms[q].s,sc:tms[q].score};break}}}
    }
    html+='<details class="big'+(i===0?' rec':'')+'"'+(i===0?' open':'')+'>';
    html+='<summary>'+(i===0?'⭐ 推荐流派 ':'流派 ')+(i+1)+'：'+esc(bd.name)+
      '<span class="bigsub">'+esc(bd.side)+'向 · 推荐特性 '+esc(bSet)+' · 4 槽：'+bd.mv.main.map(function(sl){return esc(MV[sl.id]?MV[sl.id][1]:sl.id)}).join(' / ')+
      '<br>'+esc(bd.desc)+
      '<br><b>打法依据</b>（动态推导）：'+esc((bd.basis||[]).map(function(x){return x.txt}).join('；'))+
      (bd.why?('<br><b>打法原则</b>（P1–P5 同层）：'+esc(bd.why)):'')+
      ((bd.drivenBy||[]).length?('<br><b>触发依据</b>：'+esc(bd.drivenBy.join('；'))):'')+
      (bd.breakingRoute?('<br><b>破盾路线择优</b>：'+esc(bd.breakingRoute)+'（与强化/双刀/拍落/消耗互斥，只取 1 条）'):'')+
      '</span></summary>';
    /* 详情 ①：种族 / 强度概要 */
    html+='<div class="sec" style="margin:6px 0"><h3>种族 / 强度概要</h3><div style="font-size:12px;line-height:1.9">种族 物攻'+s.base[1]+'/特攻'+s.base[3]+'/物防'+s.base[2]+'/特防'+s.base[4]+'/速度'+s.base[5]+'（总值 '+spBst(s)+'）<br>'+
      '强度：'+(in0c.mults.length?in0c.mults.map(function(m){return esc(m.n)+(m.o.cond?'('+esc(m.o.cond)+')':'')+'×'+m.o.mul}).join('、'):'—')+
      '　本系最高威力 '+(in0c.bestPow.length?in0c.bestPow.map(function(x){return esc(MV[x.id][1])+'('+x.pow+')'}).join(' / '):'—')+
      '　耐久 '+esc(in0c.phys)+' / '+esc(in0c.spec)+'</div></div>';
    /* 详情 ②：特性（可点击 → 特性反查） */
    html+='<div style="margin:4px 0"><b style="font-size:12px">推荐特性（点击跳特性反查）：</b>';
    bd.abi.slice(0,2).forEach(function(a){
      html+='<span class="abi" onclick="gotoAbi('+jsl(a.n)+')" title="'+esc(a.why.join('；'))+'">'+esc(a.n)+'</span><span style="font-size:11px;color:var(--sub)"> '+(a.sc>0?('匹配'+a.sc):'')+'</span>　';
    });
    html+='<span style="font-size:11px;color:var(--sub)">其余：'+bd.abi.slice(2).map(function(a){return '<span class="abi" onclick="gotoAbi('+jsl(a.n)+')">'+esc(a.n)+'</span>'}).join(' / ')+'（当前默认生效=可选池第1个）</span></div>';
    /* 详情 ③：配招（招式名 → 招式反查详情；点评 → 词条标蓝） */
    html+='<div class="scroll"><table><thead><tr><th>槽</th><th>招式</th><th>属性</th><th>分类</th><th>威力</th><th>来源</th><th>定位</th><th>点评</th></tr></thead><tbody>';
    bd.mv.main.forEach(function(sl,j){
      var m=MV[sl.id];
      html+='<tr><td>'+(j+1)+'</td><td><b class="abi" onclick="gotoMv('+jsl(m[1])+')">'+esc(m[1])+'</b></td><td>'+tlabel(m[3])+'</td><td>'+splitLabel(m[4])+'</td><td>'+(m[5]||'-')+'</td><td>'+mvSrc(s,sl.id)+'</td><td>'+esc(sl.tag)+'</td><td style="font-size:11px;color:var(--sub)">'+(ERDATA.movesNotes&&ERDATA.movesNotes[sl.id]?glossify(ERDATA.movesNotes[sl.id]):'')+'</td></tr>';
    });
    html+='</tbody></table></div>';
    html+='<div style="font-size:12px;color:var(--sub);margin-top:4px">备选（点击看招式）：'+bd.mv.backup.map(function(id){return '<span class="abi" onclick="gotoMv('+jsl(MV[id]?MV[id][1]:String(id))+')">'+esc(MV[id]?MV[id][1]:id)+'</span>'}).join(' / ')+'</div>';
    /* v45-3：盲点提示 + 补盲结果/不可让位原因（透明化：可学者已补入，不可学或无空位才保留标注） */
    html+='<div style="margin-top:4px;font-size:12px">'+(blind.length
      ?'<span style="color:var(--warn)">⚠ 盲点属性（4 招均 ≤0.5x）：'+blind.map(tlabel).join('/')+'</span>'
        +(bd.blindNoRoom?('　<span style="color:var(--sub)">（本侧可学补盲招 '+esc(MV[bd.blindNoRoom.id]?MV[bd.blindNoRoom.id][1]:bd.blindNoRoom.id)+
          (bd.blindNoRoom.drop?('（可换入替代 '+esc(MV[bd.blindNoRoom.drop]?MV[bd.blindNoRoom.drop][1]:bd.blindNoRoom.drop)+'）'):'')+
          ' —— 当前保留主攻/强化/回复职能，未换）</span>'):'')
        +(bd.crossCover?('　<span style="color:var(--sub)">（本侧 ≤0.5x，另一侧流派有 ≥1x 覆盖 → 见下方「双刀补盲」）</span>'):'')
      :'<span style="color:var(--ok)">✓ 无盲点（21 属性均有 ≥1x 手段）</span>'
        +(bd.coverFixed?('　<span style="color:var(--sub)">（补盲：'+esc(MV[bd.coverFixed.now]?MV[bd.coverFixed.now][1]:bd.coverFixed.now)+
          ' 覆盖 '+bd.coverFixed.tys.map(tlabel).join('/')+'）</span>'):''))+'</div>';
    /* ① 特性免疫警示（IMMUNE_RISK = ABI_TAGS.im 反查的常见免疫特性） */
    var immWarn=[],immSeen={};
    function addImm(x){if(!immSeen[x]){immSeen[x]=1;immWarn.push(x)}}
    blind.forEach(function(t){if(IMMUNE_RISK[t]&&IMMUNE_RISK[t].length)addImm(tlabel(t)+'（'+IMMUNE_RISK[t].slice(0,3).join('/')+'）')});
    bd.mv.main.forEach(function(sl){
      var m=MV[sl.id];if(!m||m[4]==='变化')return;
      var t=effMvType(s,m,convB);
      if(IMMUNE_RISK[t]&&IMMUNE_RISK[t].length)addImm(esc(m[1])+'：'+tlabel(t)+'（'+IMMUNE_RISK[t].slice(0,3).join('/')+'）');
    });
    if(immWarn.length)html+='<div style="font-size:12px;margin-top:2px"><span class="badge badge-warnimm">特性免疫警示</span> 对手带对应免疫特性时下列属性招无效——需多备打击面或用特性穿透（破格/兆级电压）：'+immWarn.join('；')+'</div>';
    /* ② 双刀补盲提示 */
    if(altProf){
      var fixB=blind.filter(function(t){return altProf[t]>=1});
      if(fixB.length)html+='<div style="font-size:12px;margin-top:2px;color:var(--accent)">🔀 双刀补盲：'+fixB.map(tlabel).join('/')+' 可用'+(bd.side==='物理'?'特攻':'物攻')+'侧招式覆盖（另一侧流派已含）</div>';
    }
    /* 选招依据（每招权重构成，B9）+ B⑦ 判定口径依据 */
    html+='<div class="whylist">选招依据：'+bd.mv.main.map(function(sl,j){
      return '槽'+(j+1)+' <b>'+esc(MV[sl.id]?MV[sl.id][1]:'')+'</b> '+whyHtml(sl.why);
    }).join('　|　')+'</div>';
    html+='<div class="ruleline">判定口径：'+esc(coreRuleBrief(s,bd))+'</div>';
    /* 详情 ④：性格 + 道具（道具可点击 → 招式/道具反查） */
    html+='<div style="margin-top:6px;font-size:13px"><b>性格：</b>'+bd.nat.map(function(n){return '<span class="abi">'+esc(n[0])+'</span><span style="font-size:11px;color:var(--sub)"> '+esc(n[1])+'</span>'}).join('　')+
      '　　<b>道具：</b>'+bd.it.slice(0,3).map(function(x,i){return (i===0?'<b class="abi" style="border-color:var(--ok)" onclick="gotoItem('+jsl(x[0])+')" title="主推">⭐'+esc(x[0])+'</b>':'<span class="abi" style="opacity:.85" onclick="gotoItem('+jsl(x[0])+')">'+esc(x[0])+'</span><span style="font-size:10px;color:var(--sub)">备选</span>')+'<span style="font-size:11px;color:var(--sub)"> '+esc(x[1])+'</span>'}).join('　')+
      (bd.it.length>3?('　<i style="font-size:11px;color:var(--sub)">（另有 '+(bd.it.length-3)+' 项备选）</i>'):'')+'</div>';
    /* 详情 ⑤：本流派队友 Top3（B⑤ 按流派区分） */
    html+='<div class="sec" style="margin:8px 0"><h3>本流派队友（'+esc(bd.side)+'向 / '+esc(bd.roleTag)+'）</h3>';
    if(wxNeed)html+='<div class="tip" style="background:#e3f2fd;border-color:var(--accent)">🌤 天气/场地由队友提供：'+(setter?('推荐 '+esc(setter.s.zh)+'（'+esc(setter.x)+' 体系手，评分 +'+setter.sc+'）'):('暂无 '+esc(coreSys(s).filter(isWxSys).join('/'))+' 体系手可推荐'))+'。核心自身非设置手，故配招功能槽不放天气招（B⑥-4）。</div>';
    if(tms.length){
      html+='<div class="scroll"><table><thead><tr><th>队友</th><th>属性</th><th>评分</th><th>理由</th><th></th></tr></thead><tbody>';
      tms.slice(0,3).forEach(function(r){html+=tmRow(r)});
      html+='</tbody></table></div>';
    }else html+='<div class="mini" style="color:var(--sub)">该流派暂无高匹配队友</div>';
    html+='</div>';
    html+='</details>';
  });
  /* v4.3 队伍构建方案卡（需求驱动）：核心画像 → 队伍需求（动态） → 每需求最优推荐与全量候选 → 队伍成员（置于 Top6 表之前，作为主展示） */
  html+=renderNeedPlan(s);
  /* 队友（整体联防；各流派的差异化队友见上方流派卡内） */
  /* v4.6.1 ③ R1/R3：第二种队友来源（整体联防）→ 明确标签「体系补盲队友」，与「需求驱动队友」区分；**默认收起**（同屏视觉重复折叠其一，默认展示需求驱动） */
  html+='<details class="big subsec"><summary>🧩 体系补盲队友（整体联防 Top 6 · '+(optFinalOnly?'最终形态 + 奇石优势形态':'全图鉴')+' · '+(side)+'向优先 · 点击入队）</summary>';
  if(recs.length){
    html+='<div class="scroll"><table><thead><tr><th>队友</th><th>属性</th><th>评分</th><th>理由</th><th></th></tr></thead><tbody>';
    recs.forEach(function(r){html+=tmRow(r)});
    html+='</tbody></table></div>';
  }else html+='<div class="tip">暂无高匹配队友（试试换核心）</div>';
  html+='<div class="ruleline">队友口径（正向体系构建）：按流派侧向分流（物理侧→物防/威吓联防；特殊侧→特防联防；受队→剧毒/钉子/回复）+ 体系维度分（同一张维度权重表，逐维度列分可解释）+ 家族去重（同族只留最高形态，标注「+N形态」）+ 免疫/抵抗弱点 + 补盲。排序键：**体系契合优先**（同体系受益/设置手 → 中立/联防补盲 → 自带另一套天气者），对立天气体系只排序靠后、仍可见（候选池 '+((recs&&recs.pool)||'—')+' 只，全部参与打分）。</div>';
  html+='</details>';
  /* B10：天气/场地数值卡（全部读 WCONF，带待实测徽标） */
  var ownWx=ownWxList(s,learnOf(s)),cvCard=convOf(s);
  html+='<div class="sec"><h3>天气 / 场地数值（读 WCONF 口径表）</h3>'+
    '<div style="font-size:12px">'+wxNums()+'</div>'+
    '<div style="font-size:12px;margin-top:2px">'+terrainNums()+'</div>'+
    '<div style="font-size:12px;margin-top:2px">顺风 '+WCONF.tailwindTurns+' 回合（已按游戏源码核对：常量 3 ⇒ 实际 4 个回合时段；特性自动同）· 戏法空间 '+WCONF.trickroomTurns+' 回合'+pendBadge()+' / 先制 '+WCONF.trickroomPrio+'（已按游戏数据核对）· 麻痹减速 ×'+WCONF.paraSpeed+'（已按游戏源码核对）、完全麻痹 '+pct(WCONF.paraFullChance)+'（已按游戏源码核对；后续版本 12.5%）</div>'+
    '<div style="font-size:12px;margin-top:2px">天气归属（谁主导）：'+wxGrantTxt()+pendBadge()+'</div>'+
    '<div style="font-size:12px;margin-top:2px">除钉：229 高速旋转（清自身侧）/ 432 清除浓雾（清双方钉子、墙仅对手侧、降闪避 1 级）——已按游戏源码核对 + 用户确认（均不清场地）；黏黏网（564）→ 换人 -1 速（飞行/飘浮/气球免疫）</div>'+
    '<div style="font-size:12px;margin-top:2px">剧毒场地：'+WCONF.toxicTerrain.durTurns+' 回合 / 毒招 ×'+WCONF.toxicTerrain.boost+'（+'+pct(WCONF.toxicTerrain.boost-1)+'，用户确认） / 非毒钢接地每回合 '+fracTxt(WCONF.toxicTerrain.dmgFraction)+' 最大HP</div>'+
    (ownWx.length?'<div style="font-size:12px;margin-top:2px">本只体系：'+ownWx.map(function(o){return esc(o.sys)+'（'+esc(o.src)+'）'}).join(' / ')+'</div>':'')+
    (cvCard?'<div style="font-size:12px;margin-top:2px">-ate 属性转换：'+esc(cvCard.abi)+'（'+esc(cvCard.scope)+'）→ '+convSrcLabel(cvCard)+'转为 '+tlabel(cvCard.type)+'、按本系 ×1.6（.onStab 已按游戏源码核对）＋ 转换招 ×'+ateMulOf(cvCard.id)+(ateMulOf(cvCard.id)>1?'（三特例 ×1.1）':'（宏族 ×1.0，无 10% 加成）')+(cvCard.src&&cvCard.src!=='一般'?'（来源属性 '+cvCard.src+'→'+cvCard.type+'，非一般系来源）':'')+'</div>':'')+
    '<details class="inline"><summary>📐 判定口径：天气/场地回合与倍率读 WCONF（'+esc(v4ContractNote())+'）—— 展开看每招倍率构成</summary>'+
    '<div style="margin-top:4px">流派卡「选招依据 / 判定口径」两行给出每招倍率构成（pow×stab×hit×prio×cover×weather×func×abi）。</div></details>'+
    '</div>';
  html+='</div>';
  /* 注：机制口径折叠块由独立容器 #ruleBoxCore（L335）渲染 —— 不在此重复追加，避免出现两遍 */
  $('coreOut').innerHTML=html;
}
function coreFinalToggle(){optFinalOnly=$('coreFinal').checked;if(window.drawCoreList)window.drawCoreList();if(coreSel)renderCore(coreSel)}
var coreSel=null;
function selectCore(id){
  var s=ERDATA.species.filter(function(x){return x.id==id})[0];
  if(!s)return;
  coreSel=s;
  switchTab('core');
  renderCore(s);
  window.scrollTo(0,0);
}
(function(){
  var coreFilter={types:{}},coreRoleCache={};
  function coreRoleOf(s){var k=''+s.id;if(!coreRoleCache[k])coreRoleCache[k]=coreRole(s).role;return coreRoleCache[k]}
  function renderCoreTypes(){
    var box=$('coreTypes');box.innerHTML='';
    ERDATA.types.forEach(function(t){
      var b=tchip(t,!!coreFilter.types[t],function(){
        coreFilter.types[t]=!coreFilter.types[t];
        if(!coreFilter.types[t])delete coreFilter.types[t];
        /* 交集筛选：宝可梦仅双属性，最多保留 2 个选中 */
        var on=ERDATA.types.filter(function(x){return coreFilter.types[x]});
        if(on.length>2)delete coreFilter.types[on[0]];
        renderCoreTypes();draw();
      });
      box.appendChild(b);
    });
  }
  function coreClear(){
    coreFilter={types:{}};
    $('coreSearch').value='';$('coreRole').value='';$('coreMv').value='';$('coreAbi').value='';
    renderCoreTypes();draw();
  }
  window.coreClear=coreClear;
  function coreMatch(s){
    if(!isValidSp(s))return false; /* B7：占位/无效物种（base 全 0，如 2502）不进核心列表 */
    if(optFinalOnly&&!isFinalForm(s)&&!evioOk(s))return false; /* v4.3.1：奇石优势形态同样可选为核心 */
    /* C⑧：模糊搜索（中文/英文/编号子串包含；大小写与全半角不敏感） */
    if(!fzAny($('coreSearch').value.trim(),[''+s.id,s.zh,s.en]))return false;
    var selT=[];
    for(var t in coreFilter.types)if(coreFilter.types[t])selT.push(t);
    if(selT.length){var hitAll=true;selT.forEach(function(t){if(s.t1!==t&&s.t2!==t)hitAll=false});if(!hitAll)return false}
    var rv=$('coreRole').value;
    if(rv){var role=coreRoleOf(s);if(rv==='炮台'){if(role.indexOf('慢速')>-1||role.indexOf('炮台')<0)return false}else if(role.indexOf(rv)<0)return false}
    var mv=$('coreMv').value.trim().toLowerCase();
    if(mv){var learn=learnOf(s),hit=false;for(var i=0;i<learn.length;i++){var m=MV[learn[i]];if(m&&(m[1].toLowerCase().indexOf(mv)>-1||m[2].toLowerCase().indexOf(mv)>-1||(''+m[0]).indexOf(mv)>-1)){hit=true;break}}if(!hit)return false}
    var abi=$('coreAbi').value.trim().toLowerCase();
    if(abi){var names=s.abis.concat(s.inns);if(!names.some(function(n){return n.toLowerCase().indexOf(abi)>-1}))return false}
    return true;
  }
  function draw(){
    var arr=ERDATA.species.filter(coreMatch);
    arr=sortedSp(arr,$('coreSort').value);
    var box=$('coreGrid');box.innerHTML='';
    arr.slice(0,60).forEach(function(s){
      var c=document.createElement('div');c.className='card';
      c.innerHTML=sprImg(s.id)+
        '<div class="nm">'+esc(s.zh)+'</div><div class="en">'+esc(s.en)+' #'+s.id+'</div>'+
        '<div style="margin-top:4px">'+tlabel(s.t1)+(s.t2!==s.t1?' '+tlabel(s.t2):'')+'</div><div class="bs">种族总值 '+spBst(s)+'</div>'+
        '<div class="mini" style="color:var(--accent);margin-top:4px">点击生成组队建议</div>';
      c.onclick=function(){selectCore(this.dataset.id); };
      c.dataset.id=s.id;
      box.appendChild(c);
    });
    $('coreMore').textContent=arr.length>60?('共 '+arr.length+' 只，显示前 60（可缩小筛选）'):('共 '+arr.length+' 只');
  }
  window.drawCoreList=draw;
  $('coreSearch').oninput=draw;
  $('coreSort').onchange=draw;
  $('coreRole').onchange=draw;
  $('coreMv').oninput=draw;
  $('coreAbi').oninput=draw;
  renderCoreTypes();
  draw();
})();
/* ============ 规格 v1.0 初始化：机制口径折叠块 + ER 提示文案（全部读 WCONF） ============ */
function wxRuleRefHtml(){return '<div class="ruleline">📐 机制口径（参数 ↔ 当前值）：完整表在「核心配队」页统一展示（同一份内容不再三处重复）。<button class="btn-mini" style="margin-left:8px" onclick="gotoRule()">查看机制口径</button></div>'}
function gotoRule(){switchTab('core');var e=$('ruleBoxCore');if(!e)return;var d=e.querySelector?e.querySelector('details'):null;if(d)d.open=true;if(e.scrollIntoView)e.scrollIntoView({behavior:'smooth',block:'start'})}
function initRuleBoxes(){
  /* v4.6 收尾：口径表内容只注入一处（#ruleBoxCore = 默认入口页）；队伍页/模板页改为引用跳转，避免同内容三份重复展示 */
  var ec=$('ruleBoxCore');if(ec)ec.innerHTML=wxRuleHtml();
  var hr=wxRuleRefHtml();
  ['ruleBoxTeam','ruleBoxTpl'].forEach(function(id){var e=$(id);if(e)e.innerHTML=hr});
  var tipEl=$('tplRuleTip');
  if(tipEl)tipEl.innerHTML='<details class="inline"><summary>💡 ER 特化提示（读 WCONF 口径表 · 已按游戏源码核对）—— 展开看天气/冻伤/PP/词条说明</summary><div style="margin-top:4px">'+
    '天气 '+WCONF.abilityDurTurns+' 回合（岩石 '+WCONF.rockTurnsAbility+' 回合），手动招与特性同档；'+
    '晴/雨增伤 ×'+(1+WCONF.boost)+'（已按游戏源码核对：不分手动/特性，无「特性 20%」档）；'+
    '冻伤替代冰冻（每回合 '+fracTxt(WCONF.frostbite.dmgFraction)+' 最大HP + 特攻 ×'+WCONF.frostbite.spAtkMult+'，'+'冰雹触发 ×'+WCONF.frostbite.hailChanceMult+pendBadge()+' 游戏源码中未见）；'+
    '个体默认 31、Iron Pill 可把速度 IV 调 0（空间队）；所有招式 PP 全满；训练师全员 4 特性+道具。'+
    '<br>v4.x：'+esc(v4ContractNote())+'；词条解释（天气/场地/钉子/强化/异常/先制/蓄力/属性转换/冻伤/麻痹等）在正文中以虚线下划线标出，悬停看释义、点击开「词条卡片」（居中轻量 modal，带遮罩与关闭）。'+
    '<br>场地：'+terrainNums()+'；顺风 '+WCONF.tailwindTurns+' 回合 / 空间 '+WCONF.trickroomTurns+' 回合'+pendBadge()+WCONF.trickroomPrio+'</div></details>';
}
initRuleBoxes();
renderTpl();
renderMyPool();
</script>
</body>
</html>
'''

final = TEMPLATE.replace('__ERDATA__', data_js)
out = BASE + r'\配招助手_ER.html'
open(out, 'w', encoding='utf-8').write(final)
print('HTML bytes:', os.path.getsize(out))
print('written:', out)
