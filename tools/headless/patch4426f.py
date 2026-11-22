# -*- coding: utf-8 -*-
# v4.426 第六批：两个旧改名块（v4.392/v4.394）的单墙卡不再冠名双墙，改稳健联防
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

patch("""      else if(_v392wa)_v392t='双墙辅助流';""",
"""      else if(_v392wa){
        /* v4.426：单墙卡不冠名双墙，改稳健联防（真双墙=113+115 或 657） */
        var _v392nw=_v392ids.filter(function(id){return id===113||id===115}).length;
        _v392t=(_v392nw>=2||_v392ids.indexOf(657)>=0)?'双墙辅助流':'稳健联防';
      }""",
'v392 rename')

patch("""      else if(_wa)_t='双墙辅助流';""",
"""      else if(_wa){
        /* v4.426：单墙卡不冠名双墙，改稳健联防（真双墙=113+115 或 657） */
        var _v394nw=_ids.filter(function(id){return id===113||id===115}).length;
        _t=(_v394nw>=2||_ids.indexOf(657)>=0)?'双墙辅助流':'稳健联防';
      }""",
'v394 rename')

io.open(PATH, 'w', encoding='utf-8', newline='').write(t)
new_len = len(t.encode('utf-8'))
print('bytes %d -> %d (delta %+d)' % (orig_len, new_len, new_len - orig_len))
