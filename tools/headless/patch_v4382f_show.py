# -*- coding: utf-8 -*-
# v4.382 展示层收尾：模板「速攻」标签 / 旧名溯源行前缀（纯展示，不动 ev.template 字段 / evKind / EV 数值）
import io, os, sys, hashlib
ROOT = r'D:\game\elite-redux'
idx = os.path.join(ROOT, 'index.html')
with io.open(idx, 'r', encoding='utf-8', newline='') as f:
    t = f.read()

pairs = [
    # 1) 展示层模板名归一 helper（引擎字段 ev.template 原值不动，仅渲染层把「速攻」显示为「高速线」）
    ("function evWhyTxt(t){",
     "function evTplDisp(t){return t==='速攻'?'高速线':String(t||'');}\r\nfunction evWhyTxt(t){"),
    # 2) 模板分配依据文案：速攻模板 → 高速线模板（key 分支仍按引擎原值 t==='速攻' 匹配）
    ("if(t==='速攻')return '速攻模板：252 速度抢线",
     "if(t==='速攻')return '高速线模板：252 速度抢线"),
    # 3) 候选列表 EV 行模板标签
    ("'（'+esc(b.evTpl||'')+'）　性格：'",
     "'（'+esc(evTplDisp(b.evTpl||''))+'）　性格：'"),
    # 4) ③ 典型用法 模板标签
    ("((bd.ev&&bd.ev.template)?(' · 模板「'+bd.ev.template+'」'):'')",
     "((bd.ev&&bd.ev.template)?(' · 模板「'+evTplDisp(bd.ev.template)+'」'):'')"),
    # 5) 努力值分配条 模板名
    ("<b>'+esc(ev.template)+'</b></div>'",
     "<b>'+esc(evTplDisp(ev.template))+'</b></div>'"),
    # 6) 努力值弹层正文 模板名
    ("<b>'+esc(bd.ev.template)+'</b>　<span class=\"dim\">'+esc(bd.ev.summary)+'</span>",
     "<b>'+esc(evTplDisp(bd.ev.template))+'</b>　<span class=\"dim\">'+esc(bd.ev.summary)+'</span>"),
    # 7) 努力值弹层标题 模板名
    ("l1Modal('努力值 · '+bd.ev.template,full);",
     "l1Modal('努力值 · '+evTplDisp(bd.ev.template),full);"),
    # 8) 引擎层「流派原始描述」旧名溯源行：带 v13Demoted 标记时补「（历史名）」前缀，避免被当成现值
    ("'<br><span class=\"dim\">流派原始描述：'+esc(bd.desc)+'</span></div>';",
     "'<br><span class=\"dim\">流派原始描述'+(bd.v13Demoted?'（历史名）':'')+'：'+esc(bd.desc)+'</span></div>';"),
]

for i, (old, new) in enumerate(pairs, 1):
    if t.count(old) != 1:
        print('FAIL anchor', i, 'count=', t.count(old)); sys.exit(1)
    t = t.replace(old, new, 1)

with io.open(idx, 'w', encoding='utf-8', newline='') as f:
    f.write(t)
d = open(idx, 'rb').read(); tt = d.decode('utf-8')
print('bytes', len(d), 'sha1', hashlib.sha1(d).hexdigest().upper(),
      'CRLF', tt.count('\r\n'), 'bareLF', tt.count('\n') - tt.count('\r\n'))
