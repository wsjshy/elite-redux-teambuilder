# -*- coding: utf-8 -*-
# v4.426 第五批：收紧极光幕准入（仅雪系特性），并让 v4.395b ① 放行合法极光幕卡
import io

PATH = r'D:\game\elite-redux\index.html'
t = io.open(PATH, encoding='utf-8', newline='').read()
orig_len = len(t.encode('utf-8'))

def C(s):
    return s.replace('\r\n', '\n').replace('\n', '\r\n')

def patch(old, new, label):
    global t
    old = C(old); new = C(new)
    n = t.count(old)
    assert n == 1, 'ANCHOR FAIL [%s] count=%d' % (label, n)
    t = t.replace(old, new)
    print('OK', label)

# A. 收紧 veil 门
patch("""    var _wlHail=_wlLearn.indexOf(258)>-1;
    var _wlVeil=_wlLearn.indexOf(657)>-1&&(_wlSnowName!==null||_wlHail);""",
"""    /* v4.426：极光幕只在雪天生效；引擎 v4.395 会清掉非雪系手的手动冰雹258，
       故仅当物种自带雪系特性时才走极光幕（无特性则冰雹被清、657 成死招）。 */
    var _wlVeil=_wlLearn.indexOf(657)>-1&&_wlSnowName!==null;""",
'veil gate')

# B. wallIds 简化
patch("""      var _wlWallIds=_wlVeil?(_wlSnowName!==null?[657]:[657,258]):[113,115];""",
"""      var _wlWallIds=_wlVeil?[657]:[113,115];""",
'wallIds')

# C. v4.395b ① 放行极光幕
patch("""        if(_nm.indexOf('双墙')>-1&&_ids.indexOf(113)<0&&_ids.indexOf(115)<0){""",
"""        if(_nm.indexOf('双墙')>-1&&_ids.indexOf(113)<0&&_ids.indexOf(115)<0&&_ids.indexOf(657)<0){""",
'v4395b 1 guard')

io.open(PATH, 'w', encoding='utf-8', newline='').write(t)
new_len = len(t.encode('utf-8'))
print('bytes %d -> %d (delta %+d)' % (orig_len, new_len, new_len - orig_len))
