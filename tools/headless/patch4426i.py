# -*- coding: utf-8 -*-
# v4.426 patch i：_forceSweep 用「真墙手」判定（113+115 或 雪特性657），避免盖欧卡这类学了657却开不了雪的物种误触发
import io, sys
P = r"D:\game\elite-redux\index.html"
with io.open(P, "rb") as f:
    b = f.read()

old = (
"    /* v4.426：核心会开墙且尚无强化角色 → 第 4 槽强制「强化」（窗口兑现者），\r\n"
"       与 _forceOut 同型，仅在有候选时收窄角色，无候选则回退不阻断。 */\r\n"
"    var _forceSweep=(hasAny(learnC(s),FUNC_MV.wall)&&mainPicks.length===3&&!byRole['强化']);\r\n"
)

new = (
"    /* v4.426：核心为「真墙手」且尚无强化角色 → 第 4 槽强制「强化」（窗口兑现者）。\r\n"
"       真墙手口径与 comboBuildsOf 完全一致：同时会113+115，或会657且自带雪系特性；\r\n"
"       仅学657却无雪源（如盖欧卡）时极光幕是死招，不触发。 */\r\n"
"    var _fsLearn=learnC(s);\r\n"
"    var _fsDual=(_fsLearn.indexOf(113)>-1&&_fsLearn.indexOf(115)>-1);\r\n"
"    var _fsSnowIds=[117,666,929,291,348,870,493],_fsSnow=false;\r\n"
"    try{(s.abis||[]).concat(s.inns||[]).forEach(function(n){\r\n"
"      if(_fsSnow)return;var _id=abiIdByZhOrEn(n);\r\n"
"      if(_id!==null&&_fsSnowIds.indexOf(+_id)>-1)_fsSnow=true;});}catch(eFs){}\r\n"
"    var _fsVeil=(_fsLearn.indexOf(657)>-1&&_fsSnow);\r\n"
"    var _forceSweep=((_fsDual||_fsVeil)&&mainPicks.length===3&&!byRole['强化']);\r\n"
)

ob = old.encode('utf-8'); nb = new.encode('utf-8')
n = b.count(ob)
if n != 1:
    print("ANCHOR COUNT =", n, "expected 1"); sys.exit(1)
b = b.replace(ob, nb)
with io.open(P, "wb") as f:
    f.write(b)
print("patch4426i OK, bytes", len(b))
