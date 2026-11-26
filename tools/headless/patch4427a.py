# -*- coding: utf-8 -*-
# v4.427 patch a：强化推队手单一真源（会强化 + 进攻型），mateRoleOf 与 sweep gate 同源
import io, sys
P = r"D:\game\elite-redux\index.html"
with io.open(P, "rb") as f:
    b = f.read()
def S(x): return x.replace('\n', '\r\n').encode('utf-8')

# ---- 1) 新增 isBoostSweeper（放在 mateRoleOf 之前的 v4.68p0 注释块之后）----
anchor1 = S("/* v4.68p0 构建期预计算强化角色表占位（构建时注入全库表；见构建尾段 _ER_BOOST_ROLE 预计算） */\n")
new1 = S(
"""/* v4.427 强化推队手单一真源：会强化招 **且** 是进攻型（atkBest≥95 且 spd≥70，与「输出」角色同源）。
   只有强化招却慢速中火力的（如引梦貘人 115/67、鼠霸王 113/54）不算推队手——
   开墙的核心不该被配一个「强化完也压不过对手」的队友，那属于角色错配。 */
function isBoostSweeper(t){
  if(!(_ER_BOOST_ROLE&&_ER_BOOST_ROLE[t.id]))return false;
  try{return atkBest(t)>=95&&spdOf(t)>=70}catch(eBs){return false}
}
""") + anchor1
if b.count(anchor1) != 1:
    print("anchor1", b.count(anchor1)); sys.exit(1)
b = b.replace(anchor1, new1)

# ---- 2) mateRoleOf：强化判定挂到 _off 上（顺序调整：先算 _off 再判强化）----
old2 = S(
"""  if(_ER_BOOST_ROLE&&_ER_BOOST_ROLE[t.id])out.push('强化');
  /* v4.35 P1-4：进攻力达标的队友可**兼任**『输出』位。""")
new2 = S(
"""  /* v4.35 P1-4：进攻力达标的队友可**兼任**『输出』位。""")
if b.count(old2) != 1:
    print("anchor2", b.count(old2)); sys.exit(1)
b = b.replace(old2, new2)

old3 = S(
"""  var _off=false;try{_off=(atkBest(t)>=95&&spdOf(t)>=70)}catch(eo){_off=false}
  if(_off)out.push('输出');""")
new3 = S(
"""  var _off=false;try{_off=(atkBest(t)>=95&&spdOf(t)>=70)}catch(eo){_off=false}
  /* v4.427：强化角色只给「进攻型 + 会强化」——强化完能推队才有意义；
     慢速中火力（引梦貘人 115/67）只保留 回复/状态/盾，不再占强化位（用户裁定：角色不能颠倒）。 */
  if(_off&&_ER_BOOST_ROLE&&_ER_BOOST_ROLE[t.id])out.push('强化');
  if(_off)out.push('输出');""")
if b.count(old3) != 1:
    print("anchor3", b.count(old3)); sys.exit(1)
b = b.replace(old3, new3)

# ---- 3) sweep gate 同源 ----
old4 = S(
"""   gate:function(t,cx){
     if(!(_ER_BOOST_ROLE&&_ER_BOOST_ROLE[t.id]))return '';
     var a=atkBest(t);
     if(a>=NEED_CFG.POWER_OK)return '强化招+力度 '+a+'（墙内强化推队）';
     if(a>=95)return '可强化输出（力度 '+a+'）';
     return ''},""")
new4 = S(
"""   gate:function(t,cx){
     if(!isBoostSweeper(t))return '';
     var a=atkBest(t);
     if(a>=NEED_CFG.POWER_OK)return '强化招+力度 '+a+'（墙内强化推队）';
     return '可强化输出（力度 '+a+'）'},""")
if b.count(old4) != 1:
    print("anchor4", b.count(old4)); sys.exit(1)
b = b.replace(old4, new4)

with io.open(P, "wb") as f:
    f.write(b)
print("patch4427a OK, bytes", len(b))
