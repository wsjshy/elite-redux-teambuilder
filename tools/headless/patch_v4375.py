# v4.375 字节级补丁：补全 MV_FLAG 七招族 + famAbiRuleOf 接入 12 个增伤特性 + why 文案倍率
import io, os

P = r"D:\game\elite-redux\index.html"
d = open(P, "rb").read()

def counts(b):
    crlf = b.count(b"\r\n")
    bare = b.count(b"\n") - crlf
    return crlf, bare

print("before CRLF/bareLF:", counts(d))

# ---------- 1) MV_FLAG 插入 7 行（CRLF 区域）----------
flag_lines = [
    "  arrow:'625,775,777,779,783,784,791,795,796,797,799,803,805,807,813,816,833,962,1030',   /* FLAG arrowBased 箭类，19 条 */",
    "  horn:'30,31,32,64,65,224,398,427,529,532,647,781,793,809,884,890,917,948,986,987,992,995',   /* FLAG hornBased 角类，22 条 */",
    "  air:'13,16,17,18,19,59,139,177,181,196,211,239,257,311,314,318,366,403,413,466,536,542,572,584,613,742,780,839,920,921,922,923,973,976,983,1024',   /* FLAG airBased 空中/翼类，36 条 */",
    "  hammer:'21,152,359,452,628,655,656,830,859,896,900,926,927,928,929,930,931,932,933,934,935,936,937,938,939,940,941,942,943,944,952,1002',   /* FLAG hammerBased 锤类，32 条 */",
    "  throwing:'69,88,121,140,155,157,301,317,374,402,439,479,486,507,716,753,883,1013,1015,1016,1017,1018,1021',   /* FLAG throwingBased 投掷类，23 条 */",
    "  drill:'32,65,529,890,995',   /* FLAG drill 钻头类，5 条 */",
    "  light:'62,76,109,113,148,235,236,295,324,408,412,429,430,546,605,617,632,634,675,962,964',   /* FLAG light 光线类，21 条 */",
]
flag_block = ("\r\n").join(flag_lines) + "\r\n"

striker_anchor = ("  striker:'23,24,25,26,27,67,136,167,299,630,651,708,741,751,826,843,895',"
                  "   /* FLAG_STRIKER_BOOST 踢类，17 条 */\r\n};")
assert d.count(striker_anchor.encode("utf-8")) == 1, "striker anchor not unique"
d = d.replace(striker_anchor.encode("utf-8"),
              striker_anchor.replace("};", flag_block + "};").encode("utf-8"))

# ---------- 2) famAbiRuleOf 插入 12 个 case（bare LF 区域）----------
cases = [
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
cases_block = ("\n").join(cases) + "\n"
default_anchor = "    default:return null;\n  }\n}\nfunction pickAbiFor"
assert d.count(default_anchor.encode("utf-8")) == 1, "default anchor not unique"
d = d.replace(default_anchor.encode("utf-8"),
              (cases_block + default_anchor).encode("utf-8"))

# ---------- 3) why 文案倍率（CRLF 区域，单行替换）----------
why_old = "if(_pool.some(_fr.check)){sc+=1;why.push(_fr.label+'招 ×1.3：本流派实配招式命中该族群，特性直接增伤')}"
why_new = ("var _mul=_fr.mul||1.3;\r\n        if(_pool.some(_fr.check)){sc+=1;why.push(_fr.label+'招 ×'+_mul+'：本流派实配招式命中该族群，特性直接增伤')}")
assert d.count(why_old.encode("utf-8")) == 1, "why anchor not unique"
d = d.replace(why_old.encode("utf-8"), why_new.encode("utf-8"))

print("after CRLF/bareLF:", counts(d))
open(P, "wb").write(d)
print("written, new length:", len(d))
