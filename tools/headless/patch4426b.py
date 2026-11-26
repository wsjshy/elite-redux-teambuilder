# -*- coding: utf-8 -*-
# v4.426 第二批：给高速开墙卡加 _fastScreen 哨兵，并让下游强制耐久/性格/侧写步骤放行
import io

PATH = r'D:\game\elite-redux\index.html'
t = io.open(PATH, encoding='utf-8', newline='').read()
orig_len = len(t.encode('utf-8'))

def C(s):
    return s.replace('\r\n', '\n').replace('\n', '\r\n')

def patch(old, new, label, count=1):
    global t
    old = C(old); new = C(new)
    n = t.count(old)
    assert n == count, 'ANCHOR FAIL [%s] count=%d' % (label, n)
    t = t.replace(old, new)
    print('OK', label)

# 0. 卡片对象加哨兵
old0 = """      res.push({name:'双墙辅助流',roleTag:'受队',side:_wlSide,score:3,breakingRoute:'组合',
        mv:{main:_wlMain},"""
new0 = """      res.push({name:'双墙辅助流',roleTag:'受队',side:_wlSide,score:3,breakingRoute:'组合',
        _fastScreen:_wlGc,   /* v4.426：玻璃大炮高速开墙手哨兵，下游保留速攻 EV/性格，不强制耐久模板 */
        mv:{main:_wlMain},"""
patch(old0, new0, 'add sentinel')

# 1. sanitizeBuild 强制耐久 EV 放行
old1 = """    var wall=(tag==='肉盾'||tag==='受队'||tag==='辅助'||tag==='联防'||side==='辅助');
    if(wall||!atkAny){
      b.ev=evDuraAlloc(s);"""
new1 = """    var wall=(tag==='肉盾'||tag==='受队'||tag==='辅助'||tag==='联防'||side==='辅助');
    if(b._fastScreen){
      /* v4.426：高速玻璃大炮开墙手保留速攻 EV/性格，不强制耐久分配 */
    }else if(wall||!atkAny){
      b.ev=evDuraAlloc(s);"""
patch(old1, new1, 'sanitize EV guard')

# 2. v4.385 后置最终化循环跳过
old2 = """    out.forEach(function(b){
      if(!b||!b.name)return;
      var nm=String(b.name),role=String(b.roleTag||''),side=String(b.side||'');
      var al=(b.ev&&b.ev.alloc)||[];
      var offEv=Math.max(al[1]||0,al[3]||0),bulk=(al[0]||0)+(al[2]||0)+(al[4]||0);"""
new2 = """    out.forEach(function(b){
      if(!b||!b.name)return;
      if(b._fastScreen)return;   /* v4.426：高速开墙手 EV/性格已正确，跳过防守身份重算 */
      var nm=String(b.name),role=String(b.roleTag||''),side=String(b.side||'');
      var al=(b.ev&&b.ev.alloc)||[];
      var offEv=Math.max(al[1]||0,al[3]||0),bulk=(al[0]||0)+(al[2]||0)+(al[4]||0);"""
patch(old2, new2, 'v4385 skip')

# 3. side 校准保留
old3 = """      else if(_p===0&&_q===0)b.side='辅助';
    });
  }catch(eSd){eSd.name}"""
new3 = """      else if(_p===0&&_q===0&&!b._fastScreen)b.side='辅助';
    });
  }catch(eSd){eSd.name}"""
patch(old3, new3, 'side guard')

# 4. R3 性格重写跳过
old4 = """      /* ---- R3 零伤害招防守卡性格选侧（R2 命中者已定加速性格，跳过） ---- */
      if(!_hitR2&&_dmg===0){"""
new4 = """      /* ---- R3 零伤害招防守卡性格选侧（R2 命中者已定加速性格，跳过；v4.426 高速开墙手跳过） ---- */
      if(!_hitR2&&_dmg===0&&!b._fastScreen){"""
patch(old4, new4, 'R3 guard')

io.open(PATH, 'w', encoding='utf-8', newline='').write(t)
new_len = len(t.encode('utf-8'))
print('index bytes %d -> %d (delta %+d)' % (orig_len, new_len, new_len - orig_len))
