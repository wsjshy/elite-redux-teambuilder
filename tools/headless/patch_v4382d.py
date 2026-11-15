# -*- coding: utf-8 -*-
import io, os, sys, hashlib
ROOT = r'D:\game\elite-redux'
idx = os.path.join(ROOT, 'index.html')

with io.open(idx, 'r', encoding='utf-8', newline='') as f:
    t = f.read()

NL = '\r\n'

# 1) 注释头更新：stale 不再只标注，同样去速攻冠名
old_head = ("         · 基础速度≥100 但 EV 0 投入且无倍率：倍率收敛残留（顺风前缀后置剥离所致），本版不重排 EV/性格，why 注明；" + NL +
            "         · 有倍率来源（天气提速/保留顺风/轻装/围巾）的速度收敛卡属既定模板，保留并登记为例外。 */")
new_head = ("         · 基础速度≥100 但 EV 0 投入且无自有倍率：倍率收敛残留（顺风/天气前缀后置剥离所致），本版不重排 EV/性格，" + NL +
            "           同样去速攻冠名（按耐久输出定位），why 注明；" + NL +
            "         · 仍保留自有倍率来源（天气提速/保留顺风/轻装/围巾）的速度收敛卡属既定模板，保留并登记为例外。 */")
if old_head not in t:
    print('FAIL head anchor not found'); sys.exit(1)
t = t.replace(old_head, new_head, 1)

# 2) stale 分支：只标注 → 同时改名降级（沿用同一映射表）
old_stale = ("          }else if(!_v13Mult&&_v13sp>=100&&+((b.ev||{}).alloc||[])[5]===0){" + NL +
             "            var _v13src=String((b.ev||{}).source||'');" + NL +
             "            if(_v13src.indexOf('倍率')>=0){" + NL +
             "              b.v13EvStale=true;" + NL +
             "              var _v13why2='速度 EV 未投入（倍率收敛模板残留：顺风/天气前缀后置剥离所致）；本版未重排 EV/性格，速度线可在详情页速度滑块手动调整';" + NL +
             "              (b.mv.main||[]).forEach(function(x){if(x&&x.why)x.why=x.why.concat([_v13why2])});" + NL +
             "            }" + NL +
             "          }")
new_stale = ("          }else if(!_v13Mult&&_v13sp>=100&&+((b.ev||{}).alloc||[])[5]===0){" + NL +
             "            var _v13src=String((b.ev||{}).source||'');" + NL +
             "            if(_v13src.indexOf('倍率')>=0){" + NL +
             "              b.v13EvStale=true;" + NL +
             "              var _v13New2=_v13nm.replace(/速攻强化清场/,'强化清场').replace(/速攻压制/,'主力输出压制').replace(/轻装速攻流/,'主力输出压制').replace(/速攻流/,'主力输出压制');" + NL +
             "              if(_v13New2!==_v13nm){" + NL +
             "                b.name=_v13New2;b.v13Demoted=_v13nm+'→'+_v13New2;" + NL +
             "                b.nameMismatch=(b.nameMismatch?b.nameMismatch+'；':'')+'原速度依赖已移除（顺风/天气/轻装来源已不在实战招组内）→ 按耐久输出定位，不再冠速度名';" + NL +
             "              }" + NL +
             "              var _v13why2='原速度依赖已移除（顺风/天气/轻装来源已不在实战招组内），本卡按耐久输出定位，不再冠速度名；速度 EV 未投入（倍率收敛模板残留），本版未重排 EV/性格，速度线可在详情页速度滑块手动调整';" + NL +
             "              (b.mv.main||[]).forEach(function(x){if(x&&x.why)x.why=x.why.concat([_v13why2])});" + NL +
             "            }" + NL +
             "          }")
if old_stale not in t:
    print('FAIL stale anchor not found'); sys.exit(1)
t = t.replace(old_stale, new_stale, 1)

with io.open(idx, 'w', encoding='utf-8', newline='') as f:
    f.write(t)

d = open(idx, 'rb').read()
tt = d.decode('utf-8')
print('bytes', len(d), 'sha1', hashlib.sha1(d).hexdigest().upper(),
      'CRLF', tt.count('\r\n'), 'bareLF', tt.count('\n') - tt.count('\r\n'))
