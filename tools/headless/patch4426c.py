# -*- coding: utf-8 -*-
# v4.426 第三批：修复组合卡补全块对 EV 对象的空值误判（对象无 .length 导致速攻 EV 被耐久覆盖）
import io

PATH = r'D:\game\elite-redux\index.html'
t = io.open(PATH, encoding='utf-8', newline='').read()
old = "    if(!b.ev.length)b.ev=isTank?{alloc:[252,0,252,0,4,0],template:'耐久',summary:'HP252/物防252'}:{alloc:[0,252,0,0,4,252],template:'攻击集约',summary:'物攻252/速度252'};"
new = "    /* v4.426：EV 是对象不是数组，旧判据 !b.ev.length 对带 alloc 的对象恒真，会把高速开墙手 EV 误覆盖。\r\n       正确空判 = 无 alloc 且无 length（[] 与缺省才补，显式 EV 对象保留）。 */\r\n    if(!b.ev.alloc&&!b.ev.length)b.ev=isTank?{alloc:[252,0,252,0,4,0],template:'耐久',summary:'HP252/物防252'}:{alloc:[0,252,0,0,4,252],template:'攻击集约',summary:'物攻252/速度252'};"
old = old.replace('\n', '\r\n'); new = new.replace('\n', '\r\n')
assert t.count(old) == 1, 'anchor count=%d' % t.count(old)
t = t.replace(old, new)
io.open(PATH, 'w', encoding='utf-8', newline='').write(t)
print('OK EV empty-check fix; bytes', len(t.encode('utf-8')))
