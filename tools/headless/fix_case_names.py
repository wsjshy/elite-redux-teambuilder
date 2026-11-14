# 修正 famAbiRuleOf 12 个 case 的名字：能力表规范名 → 物种实际用名
P = r"D:\game\elite-redux\index.html"
d = open(P, "rb").read()

def counts(b):
    crlf = b.count(b"\r\n")
    return crlf, b.count(b"\n") - crlf
print("before:", counts(d))

old_cases = [
    "    case '巨大翅膀':return {label:'空/翼',check:function(m){return mvHasFlag(m,'air')}};",
    "    case '大角':return {label:'角/钻',check:function(m){return mvHasFlag(m,'horn')}};",
    "    case '弓手':return {label:'箭',check:function(m){return mvHasFlag(m,'arrow')}};",
    "    case '大锤':return {label:'锤',check:function(m){return mvHasFlag(m,'hammer')}};",
    "    case '神秘箭矢':return {label:'箭',check:function(m){return mvHasFlag(m,'arrow')}};",
    "    case '能量之角':return {label:'角/钻',check:function(m){return mvHasFlag(m,'horn')}};",
    "    case '穿刺者':return {label:'角/钻',check:function(m){return mvHasFlag(m,'horn')}};",
    "    case '灵魂锤击':return {mul:1.1,label:'锤',check:function(m){return mvHasFlag(m,'hammer')}};",
    "    case '搬岩':return {mul:1.5,label:'岩石/投掷',check:function(m){var r=MV[m];return !!r&&(r[3]==='岩石'||mvHasFlag(m,'throwing'))}};",
    "    case '恶作剧礼物':return {mul:1.5,label:'冰/投掷',check:function(m){var r=MV[m];return !!r&&(r[3]==='冰'||mvHasFlag(m,'throwing'))}};",
    "    case '锤拳':return {mul:1.25,label:'拳/锤',check:function(m){return mvHasFlag(m,'fist')||mvHasFlag(m,'hammer')}};",
    "    case '巨型钻头':return {label:'角/钻头',check:function(m){return mvHasFlag(m,'horn')||mvHasFlag(m,'drill')}};",
]
new_cases = [
    "    case '巨翼':return {label:'空/翼',check:function(m){return mvHasFlag(m,'air')}};",
    "    case '强大之角':return {label:'角/钻',check:function(m){return mvHasFlag(m,'horn')}};",
    "    case '弓箭手':return {label:'箭',check:function(m){return mvHasFlag(m,'arrow')}};",
    "    case '超级重击者':return {label:'锤',check:function(m){return mvHasFlag(m,'hammer')}};",
    "    case '神话之箭':return {label:'箭',check:function(m){return mvHasFlag(m,'arrow')}};",
    "    case '能量角':return {label:'角/钻',check:function(m){return mvHasFlag(m,'horn')}};",
    "    case '穿刺者':return {label:'角/钻',check:function(m){return mvHasFlag(m,'horn')}};",
    "    case '灵魂粉碎者':return {mul:1.1,label:'锤',check:function(m){return mvHasFlag(m,'hammer')}};",
    "    case '岩石载荷':return {mul:1.5,label:'岩石/投掷',check:function(m){var r=MV[m];return !!r&&(r[3]==='岩石'||mvHasFlag(m,'throwing'))}};",
    "    case '恶作剧礼物':return {mul:1.5,label:'冰/投掷',check:function(m){var r=MV[m];return !!r&&(r[3]==='冰'||mvHasFlag(m,'throwing'))}};",
    "    case '锤拳':return {mul:1.25,label:'拳/锤',check:function(m){return mvHasFlag(m,'fist')||mvHasFlag(m,'hammer')}};",
    "    case '巨型钻头':return {label:'角/钻头',check:function(m){return mvHasFlag(m,'horn')||mvHasFlag(m,'drill')}};",
]
old_block = ("\n").join(old_cases)
new_block = ("\n").join(new_cases)
assert d.count(old_block.encode("utf-8")) == 1, "old block not unique"
d = d.replace(old_block.encode("utf-8"), new_block.encode("utf-8"))
print("after:", counts(d))
open(P, "wb").write(d)
print("length:", len(d))
