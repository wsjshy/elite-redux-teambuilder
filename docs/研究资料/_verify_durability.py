# -*- coding: utf-8 -*-
r"""复算耐久口径（用于修正 _00 C.6）。
数据：招式表_宝可梦基础.csv（1906 行），脚本实读，自动识别列名。
对照代码口径：build_tool_html.py L1448-1452
  var b=s.base,hp=b[0];
  var phys=b[1]+b[2], spec=b[3]+b[4];      # phys=物攻+防御, spec=特攻+特防
  out.phys=(phys+hp>=300?'高物耐':(phys+hp>=230?'中物耐':'低物耐'))   # 即 HP+物攻+防御
  out.spec=(spec+hp>=300?'高特耐':(spec+hp>=230?'中特耐':'低特耐'))   # 即 HP+特攻+特防
"""
import csv, os

CSV = r"D:\game\elite-redux\招式表_宝可梦基础.csv"
rows = list(csv.reader(open(CSV, encoding="utf-8-sig")))
hdr = [h.strip() for h in rows[0]]
print("列名:", hdr)

def find(*keys, exclude=()):
    for i, h in enumerate(hdr):
        if all(k in h for k in keys) and not any(e in h for e in exclude):
            return i
    return None

iHP = find("HP")
iAtk = find("攻", exclude=("特攻",))
iDef = find("防", exclude=("特防",))
iSpa = find("特攻")
iSpd = find("特防")
print("列索引 HP/攻/防/特攻/特防 =", iHP, iAtk, iDef, iSpa, iSpd)
assert None not in (iHP, iAtk, iDef, iSpa, iSpd), "列识别失败"

data = [r for r in rows[1:] if len(r) > max(iHP, iAtk, iDef, iSpa, iSpd)]
n = len(data)
print("样本行数:", n)

def cnt(fn, thr):
    return sum(1 for r in data if fn(r) >= thr)

HP = lambda r: int(r[iHP]); A = lambda r: int(r[iAtk]); D = lambda r: int(r[iDef])
SA = lambda r: int(r[iSpa]); SD = lambda r: int(r[iSpd])

res = {
    "HP+防":                lambda r: HP(r) + D(r),
    "HP+攻+防":             lambda r: HP(r) + A(r) + D(r),
    "HP+特防":              lambda r: HP(r) + SD(r),
    "HP+特攻+特防":         lambda r: HP(r) + SA(r) + SD(r),
    "HP+防+特防":           lambda r: HP(r) + D(r) + SD(r),
    "BST(6)":               lambda r: HP(r) + A(r) + D(r) + SA(r) + SD(r),
}
for name, fn in res.items():
    print(f"{name:14s} >=300:{cnt(fn,300):5d}  >=270:{cnt(fn,270):5d}  >=230:{cnt(fn,230):5d}")

# 落在"代码口径高物耐 但 HP+防<300"的差距规模
hi_phys = sum(1 for r in data if res["HP+攻+防"](r) >= 300)
hi_hpd = sum(1 for r in data if res["HP+防"](r) >= 300)
diff = sum(1 for r in data if res["HP+攻+防"](r) >= 300 and res["HP+防"](r) < 300)
print(f"\n高物耐(代码口径 HP+攻+防>=300) = {hi_phys}；HP+防>=300 = {hi_hpd}；两者差 = {diff}（攻击项抬升）")

# 反例：攻击项把"并不耐打"的个体推过 300 的样本（低级例证，供文档说明口径影响）
samples = [r for r in data if res["HP+攻+防"](r) >= 300 and res["HP+防"](r) < 230][:5]
print("样本（攻项抬升过线者，最多5条）:")
for r in samples:
    print("  ", r[1] if len(r) > 1 else "?", "HP", HP(r), "攻", A(r), "防", D(r),
          "→ HP+防 =", HP(r)+D(r), "；HP+攻+防 =", HP(r)+A(r)+D(r))
