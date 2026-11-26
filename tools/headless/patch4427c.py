# -*- coding: utf-8 -*-
# v4.427 patch c：强化角色表补「冥想347」（修胡地这类以冥想为核心强化招被漏判）
import io, json, re, sys
P = r"D:\game\elite-redux\index.html"
with io.open(P, "rb") as f:
    b = f.read()
def S(x): return x.replace('\n', '\r\n').encode('utf-8')

pairs = json.load(io.open(r"D:\game\elite-redux\tools\headless\boost4427b.json", encoding='utf-8'))
tbl = "{" + ",".join('"%d":true' % k for k, v in pairs if v) + "}"
NEWLINE = ("/* v4.68p0 构建期预计算强化角色表占位（构建时注入全库表；见构建尾段 _ER_BOOST_ROLE 预计算）\n"
           "   v4.427：判据补「冥想347」——原表只认「主推流派 mv.main 含强化招」，主推流派是冥想型时被漏判\n"
           "   （超级胡地 base 175/150、会 347 冥想 + 417 阴谋，却不在表内 → 无法当强化推队手）。312→598 项。 */\n"
           "var _ER_BOOST_ROLE=" + tbl + ";\n")
pos = b.find(S("/* v4.68p0 构建期预计算强化角色表占位"))
if pos < 0:
    print("head not found"); sys.exit(1)
m = re.search(rb"var _ER_BOOST_ROLE=\{[^\r\n]*\};\r\n", b[pos:])
if not m:
    print("tbl not found"); sys.exit(1)
b = b[:pos] + S(NEWLINE) + b[pos + m.end():]

old2 = S("     改构建期预计算全库强化角色表 _ER_BOOST_ROLE（同判据：主推流派 mv.main 含剑舞/龙舞/诡计/蝶舞/破壳，剔除 76=日光束 误判），运行时 O(1) 查表。 */")
new2 = S("     改构建期预计算全库强化角色表 _ER_BOOST_ROLE（判据：主推流派 mv.main 含剑舞/龙舞/诡计/蝶舞/破壳，剔除 76=日光束 误判；\n"
         "     v4.427 补「冥想347」——冥想是最常见特攻强化招，漏了它会把胡地这类真强化手判成非强化），运行时 O(1) 查表。 */")
if b.count(old2) != 1:
    print("comment anchor", b.count(old2)); sys.exit(1)
b = b.replace(old2, new2)

with io.open(P, "wb") as f:
    f.write(b)
print("patch4427c OK, bytes", len(b))
