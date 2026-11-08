#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tools/probe_sp_abi_detail.py — 「宝可梦详情」特性块 UI 去重 + 特性详解 运行时探针

验证 v4.186 两项改动：
  A. 三项同名特性（全库 149 只）在详情页只显示 1 个徽标，标题不再写「N 选 1」；
  B. abiDesc() 对「数据层描述不足」的特性给出源码级「机制详解」，
     对「A+B」型复合特性自动展开子特性全文。

零第三方依赖（Python 标准库 + 本机 Chrome headless --dump-dom）。

用法:
    python tools/probe_sp_abi_detail.py
退出码: 0 = 全 PASS; 1 = 任一 FAIL。
"""
import json
import os
import re
import subprocess
import sys
import tempfile
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME_CANDIDATES = [
    r"C:\Users\22210\AppData\Local\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
]
MARK = "@@SPPROBE@@"

INJECT_JS = r"""
(function(){
  var DONE=false;
  function put(obj){
    if(DONE)return; DONE=true;
    var out=document.createElement('div');
    out.id='__probe_out';
    out.style.display='none';
    out.textContent='@@SPPROBE@@'+JSON.stringify(obj);
    document.body.appendChild(out);
  }
  var tries=0;
  var iv=setInterval(function(){
    tries++;
    var sp=0;
    try{ sp=(typeof ERDATA!=='undefined'&&ERDATA.species)?ERDATA.species.length:0; }catch(e){}
    if(sp>1000||tries>800){ clearInterval(iv); setTimeout(run, 700); }
  },100);

  function secByPrefix(pre){
    var secs=document.querySelectorAll('#spDetail .sec');
    for(var i=0;i<secs.length;i++){
      var h=secs[i].querySelector('h3');
      if(h && h.textContent.indexOf(pre)>=0) return secs[i];
    }
    return null;
  }

  function run(){
    var r={};
    r.g = {
      openSpById: typeof window.openSpById,
      openSp: typeof window.openSp,
      abiDesc: typeof window.abiDesc,
      abiCompositeBreak: typeof window.abiCompositeBreak,
      ABI_DETAIL: typeof window.ABI_DETAIL,
      speciesById: typeof window.speciesById,
      ERDATA: typeof window.ERDATA
    };
    try{
      // --- A. 三项同名物种（盾甲茧-原始回归 #2157，abiIds 439/439/439）---
      var sDup=null;
      try{ sDup=openSpById('2157') ; }catch(e){}
      r.dupFound=!!sDup;
      // openSpById 无返回值 → 直接从 ERDATA.species 取对象
      try{
        for(var q=0;q<ERDATA.species.length;q++){ if(String(ERDATA.species[q].id)==='2157'){ sDup=ERDATA.species[q]; break; } }
      }catch(e){}
      if(sDup){
        openSp(sDup);
        var abiSec=secByPrefix('特性（');
        var innSec=secByPrefix('天性（');
        r.dup_abiHead = abiSec? abiSec.querySelector('h3').textContent : null;
        r.dup_abiBtns = abiSec? Array.prototype.slice.call(abiSec.querySelectorAll('span.abi')).map(function(x){return x.textContent;}) : [];
        r.dup_innHead = innSec? innSec.querySelector('h3').textContent : null;
        r.dup_innBtns = innSec? Array.prototype.slice.call(innSec.querySelectorAll('span.abi')).map(function(x){return x.textContent;}) : [];
        r.dup_innIds  = sDup.innIds;
        // 点特性徽标取详情
        var btn=abiSec? abiSec.querySelector('span.abi') : null;
        if(btn){
          abiDesc(btn, '439');
          var d=document.getElementById('abiDesc');
          r.dup_descHtml = d? d.innerHTML : null;
        }
      }

      // --- B. 普通物种（3 个不同特性）标题仍应是「3 选 1」---
      var sNorm=null;
      try{
        var arr=ERDATA.species;
        for(var k=0;k<arr.length;k++){
          var ids=(arr[k].abiIds||[]).map(String);
          if(ids.length===3 && ids[0]!==ids[1] && ids[1]!==ids[2] && ids[0]!==ids[2]){ sNorm=arr[k]; break; }
        }
      }catch(e){}
      r.normFound=!!sNorm;
      if(sNorm){
        openSp(sNorm);
        var as2=secByPrefix('特性（');
        r.norm_id = sNorm.id; r.norm_zh = sNorm.zh;
        r.norm_abiHead = as2? as2.querySelector('h3').textContent : null;
        r.norm_abiBtns = as2? Array.prototype.slice.call(as2.querySelectorAll('span.abi')).map(function(x){return x.textContent;}) : [];
      }

      // --- C. 复合特性自动展开 ---
      r.fn_comp = (typeof abiCompositeBreak==='function');
      if(r.fn_comp){
        r.comp_467 = abiCompositeBreak('强夺+熔岩');
        r.comp_440 = abiCompositeBreak('变色+变换自如+毛皮大衣+冰鳞粉');
        r.comp_neg = abiCompositeBreak('彻底更改所有招式');
      }

      // --- D. ABI_DETAIL 表可用 ---
      r.detail_has439 = !!(typeof ABI_DETAIL!=='undefined' && ABI_DETAIL['439'] && ABI_DETAIL['439'].rows);
      r.detail_rows439 = (r.detail_has439 ? ABI_DETAIL['439'].rows.length : 0);
      r.has104 = (typeof ABI_DETAIL!=='undefined' && ABI_DETAIL['104']) ? (ABI_DETAIL['104'].head||'').slice(0,40) : 'NONE';
      try{ r.g104 = ('OK:' + glossify(ABI_DETAIL['104'].head)).slice(0, 60); }catch(eg104){ r.g104 = 'ERR:' + eg104.message; }
      try{
        abiDesc(null, '104');
        var dD3=document.getElementById('abiDesc');
        r.desc104 = dD3? dD3.innerHTML : null;
        r.len104 = (r.desc104 || '').length;
        r.hasMech = (r.desc104 || '').indexOf('机制详解') >= 0;
        r.tail104 = (r.desc104 || '').slice(-200);
        r.headPiece = (r.desc104 || '').slice(0, 260);
      }catch(eD3){ r.desc104 = 'ERR:' + eD3; r.len104 = -1; }
      try{
        abiDesc(null, '163');
        var dD4=document.getElementById('abiDesc');
        r.desc163 = dD4? dD4.innerHTML : null;
      }catch(eD4){ r.desc163 = 'ERR:' + eD4; }

      // --- G. 未实装招式提示（v4.188）---
      try{
        r.phCount = Object.keys(MV_PLACEHOLDER || {}).length;
        r.ph507 = (function(){ var m=MV[507]; return m? openMv(m) : null; })();
        r.phOpen = MV[507] ? $('#mvDetail') : null;
        r.desc507 = (function(){
          var box=document.getElementById('mvDetail');
          return box? box.innerHTML : null;
        })();
      }catch(eG){ r.desc507 = 'ERR:' + eG; }

      // --- F. 属性相性改写倍数（v4.187）---
      try{
        abiDesc(null, '285');
        var dF1=document.getElementById('abiDesc');
        r.desc285 = dF1? dF1.innerHTML : null;
      }catch(eF1){ r.desc285 = 'ERR:' + eF1; }
      try{
        abiDesc(null, '349');
        var dF2=document.getElementById('abiDesc');
        r.desc349 = dF2? dF2.innerHTML : null;
      }catch(eF2){ r.desc349 = 'ERR:' + eF2; }
      try{
        r.tmCount = Object.keys(ABI_TYPE_MOD || {}).length;
        r.teTest = (function(){
          var out={}, SP=ERDATA.species||[];
          function pickGround(abName){
            for(var i=0;i<SP.length;i++){
              var sp=SP[i], ins=(sp.inns||[]);
              if(ins.indexOf('地面冲击')<0) continue;
              var ts=[sp.t1,sp.t2].filter(function(x){return x&&x!=='-'});
              if(ts.indexOf('地面')>=0) return sp;
            }
            return null;
          }
          function pickElec(abName){
            for(var i=0;i<SP.length;i++){
              var sp=SP[i], ins=(sp.inns||[]);
              if(ins.indexOf(abName)<0) continue;
              var ts=[sp.t1,sp.t2].filter(function(x){return x&&x!=='-'});
              if(ts.indexOf('电')>=0) return sp;
            }
            return null;
          }
          function plainGround(){
            for(var i=0;i<SP.length;i++){
              var sp=SP[i], ts=[sp.t1,sp.t2].filter(function(x){return x&&x!=='-'});
              if(ts.indexOf('地面')<0) continue;
              if((sp.inns||[]).indexOf('地面冲击')>=0) continue;
              return sp;
            }
            return null;
          }
          function plainElec(){
            for(var i=0;i<SP.length;i++){
              var sp=SP[i], ts=[sp.t1,sp.t2].filter(function(x){return x&&x!=='-'});
              if(ts.indexOf('电')<0) continue;
              var ins=sp.inns||[];
              if(ins.indexOf('电力过载')>=0||ins.indexOf('腐化')>=0) continue;
              return sp;
            }
            return null;
          }
          var gs=pickGround(), pg=plainGround(), oc=pickElec('电力过载'), pe=plainElec();
          if(pg) out.gsBase=defCellTrio(pg,'电').inn;
          /* 直接测规则函数（这些特性在库里几乎无持有者，没法靠真实物种测） */
          out.fnGS0=abiTeApplyOne('无',   '电','地面',0,['地面']);
          out.tagPatchN = Object.keys(ABI_TAG_PATCH||{}).length;
  out.tagBlubber = (function(){var g=abiTagOf('厚脂');return g&&g.hfMul?JSON.stringify(g.hfMul):'NONE';})();
  out.hfMulFire = (function(){return _hfMulOf(abiTagOf('厚脂'),'火');})();
  out.hfMulLava = (function(){return _hfMulOf(abiTagOf('熔岩铠甲'),'水');})();
  out.hfMulPlain = (function(){return _hfMulOf(abiTagOf('厚脂肪'),'火');})();
  out.mvTeHit   = (function(){return abiTeApplyOne('天使暴怒','毒','钢',0,['毒'],'毒针');})();
  out.mvTeMiss  = (function(){return abiTeApplyOne('天使暴怒','毒','钢',0,['毒'],'污泥炸弹');})();
  out.mvTeNoMv  = (function(){return abiTeApplyOne('天使暴怒','毒','钢',0,['毒']);})();
  out.floorZero = (function(){return abiTeApplyOne('一般皮肤','一般','幽灵',0,['一般']);})();
  out.floorHalf = (function(){return abiTeApplyOne('一般皮肤','一般','钢',0.5,['一般']);})();
  /* v4.212：dmgCalc 接入 ABI_DMG_ALL / ABI_DMG_COND（非属性减伤） */
  out.dmgAbiMul = (function(){
    var sD=null,sA=null,mv=null;
    ERDATA.species.forEach(function(x){if(!sD&&(x.abis||[]).indexOf('多重鳞片')>-1)sD=x});
    ERDATA.species.forEach(function(x){if(!sA&&+x.base[1]>100)sA=x});
    for(var id in MV){var m=MV[id];if(m&&m[4]==='物理'&&+m[5]>=80&&m[1]&&m[1]!=='-'){mv=id;break}}
    if(!sD||!sA||!mv)return null;
    var r=dmgCalc({sA:sA,sD:sD,moveId:mv,evA:0,evD:0,natA:'',natD:'',itemA:'',weather:'',terrain:'',crit:false});
    return r?r.abiMul:null;
  })();
  out.dmgAbiFur = (function(){
    var sD=null,sA=null,mv=null;
    ERDATA.species.forEach(function(x){if(!sD&&(x.abis||[]).indexOf('毛皮大衣')>-1)sD=x});
    ERDATA.species.forEach(function(x){if(!sA&&+x.base[1]>100)sA=x});
    for(var id in MV){var m=MV[id];if(m&&m[4]==='物理'&&+m[5]>=80&&m[1]&&m[1]!=='-'){mv=id;break}}
    if(!sD||!sA||!mv)return null;
    var r=dmgCalc({sA:sA,sD:sD,moveId:mv,evA:0,evD:0,natA:'',natD:'',itemA:'',weather:'',terrain:'',crit:false});
    return r?r.abiMul:null;
  })();
  /* v4.215：ABI_ATK_MOD 进攻侧属性增伤 */
  out.atkModN = Object.keys(ABI_ATK_MOD||{}).length;
  out.atkWater = (function(){return dmgAtkAbiMul({inns:[],abis:['水泡']},'水').mul;})();
  out.atkWaterMiss = (function(){return dmgAtkAbiMul({inns:[],abis:['水泡']},'火').mul;})();
  out.atkLevitate = (function(){return dmgAtkAbiMul({inns:[],abis:['飘浮']},'飞行').mul;})();
  /* v4.224：接触招式判定（源码 FLAG_MAKES_CONTACT）+ 超净属性修正 */
  out.contactN = Object.keys(MV_CONTACT||{}).length;
  out.contact21 = mvIsContact(21);            /* 摔打：接触 */
  out.contact85 = mvIsContact(85);            /* 十万伏特：非接触 */
  out.mrPunch = (function(){                 /* 毛茸茸 + 一般接触招 -> 0.5 */
    return dmgDefAbiMul({inns:['毛茸茸'],abis:[]},null,'一般',true,{moveId:1},1).mul;
  })();
  out.mrFireContact = (function(){           /* 毛茸茸 + 火焰拳（火·接触）-> 2.0*0.5 = 1 */
    return dmgDefAbiMul({inns:['毛茸茸'],abis:[]},null,'火',true,{moveId:7},1).mul;
  })();
  out.mrFireNoContact = (function(){         /* 毛茸茸 + 喷射火焰（火·非接触）-> 2 */
    return dmgDefAbiMul({inns:['毛茸茸'],abis:[]},null,'火',false,{moveId:53},1).mul;
  })();
  /* v4.227：防守侧条件型相性改写 5 条 + 进攻侧雾眼 */
  out.teDefCondN = Object.keys(ABI_TE_DEF_COND||{}).length;
  /* 注意：太晶甲壳 / 神奇守护在数据层挂在 inns（天性）上，不是 abis —— 查找必须两边都查 */
  function _teHolder(n){
    var s=null;
    ERDATA.species.forEach(function(x){
      if(s)return;
      if((x.abis||[]).indexOf(n)>-1||(x.inns||[]).indexOf(n)>-1)s=x;
    });
    return s;
  }
  out.teraFight = (function(){               /* 太晶甲壳：格斗 2.0 -> 0.5 */
    var s=_teHolder('太晶甲壳');
    if(!s)return null;return defCellTrio(s,'格斗').opt;
  })();
  out.teraImmun = (function(){              /* 太晶甲壳：免疫属性 0 不动 */
    var s=_teHolder('太晶甲壳');
    if(!s)return null;return defCellTrio(s,'幽灵').opt;
  })();
  out.wgWater = (function(){                /* 神奇守护：水 1.0 -> 0 */
    var s=_teHolder('神奇守护');
    if(!s)return null;return defCellTrio(s,'水').opt;
  })();
  out.wgFire = (function(){                 /* 神奇守护：火 2.0 保留 */
    var s=_teHolder('神奇守护');
    if(!s)return null;return defCellTrio(s,'火').opt;
  })();
  out.fogDef = (function(){                 /* 雾眼：幽灵招 无雾 / 雾天 */
    var s=null;ERDATA.species.forEach(function(x){if(!s&&((x.abis||[]).indexOf('雾眼')>-1||(x.inns||[]).indexOf('雾眼')>-1))s=x});
    if(!s)return null;return [defCellTrio(s,'幽灵').opt,defCellTrio(s,'幽灵',undefined,'雾').opt].join('/');
  })();
  /* v4.232：招 flag 静态表 */
  out.mvFlagCounts = (function(){
    var o={};Object.keys(MV_FLAG||{}).forEach(function(k){o[k]=MV_FLAG[k].split(',').length});return JSON.stringify(o);
  })();
  out.flagAtk = (function(){
    var r=[];
    function one(nm,k,want){
      var id=MV_FLAG[k].split(',')[0];
      var hit=dmgAtkAbiMul({inns:[nm],abis:[]},'一般','',parseInt(id,10)).mul;
      var miss=dmgAtkAbiMul({inns:[nm],abis:[]},'一般','',0).mul;
      r.push(hit+'/'+miss);
    }
    one('强壮之颚','jaw','1.3/1');
    one('庞克摇滚','sound','1.3/1');
    one('舍身','reckless','1.2/1');
    one('强行','sheer','1.3/1');
    one('超级发射器','launcher','1.3/1');
    one('铁拳','fist','1.3/1');
    one('锐利之刃','keen','1.3/1');
    one('猛踢','striker','1.3/1');
    return r.join('|');
  })();
  /* v4.234：继承型「倍率 + 扩类」三特性 */
  out.inherAtk = (function(){
    function c(abil,id,mt){ return dmgAtkAbiMul({inns:[abil],abis:[]},mt,'',id).mul; }
    function findId(pred){
      var out=0;
      Object.keys(ERDATA.moves).forEach(function(k){
        var m=ERDATA.moves[k]; if(!out && +m[5]>0 && pred(m,+k)) out=+k;
      });
      return out;
    }
    var grass=findId(function(m,k){return m[3]==='草' && !mvHasFlag(k,'keen')});
    var fire=findId(function(m,k){return m[3]==='火' && !mvHasFlag(k,'keen')});
    var dance=findId(function(m,k){return mvHasFlag(k,'dance') && !mvHasFlag(k,'striker')});
    var laun=parseInt(MV_FLAG['launcher'].split(',')[0],10);
    var lmv=ERDATA.moves[laun];
    return [c('栗子斧',grass,'草'), c('栗子斧',fire,'火'), c('后街男孩',dance,'草'), c('枪手',laun,lmv[3])].join('/');
  })();
  out.punkDef = (function(){
    var id=parseInt(MV_FLAG['sound'].split(',')[0],10);
    var a=dmgDefAbiMul({inns:['庞克摇滚'],abis:[]},{inns:[],abis:[]},'一般',false,{moveId:id},1).mul;
    var b=dmgDefAbiMul({inns:['庞克摇滚'],abis:[]},{inns:[],abis:[]},'一般',false,{moveId:0},1).mul;
    return a+'/'+b;
  })();
  out.darkAura = dmgAtkAbiMul({inns:['暗黑气场'],abis:[]},'恶','').mul;
  out.fairyAura = dmgAtkAbiMul({inns:['妖精气场'],abis:[]},'妖精','').mul;
  out.antarctic = dmgAtkAbiMul({inns:['南极鸟'],abis:[]},'冰','').mul;
  out.fogAtk = (function(){                 /* 雾眼进攻侧：无雾 1 / 雾天 1.5 */
    var a=dmgAtkAbiMul({inns:['雾眼'],abis:[]},'幽灵','').mul;
    var b=dmgAtkAbiMul({inns:['雾眼'],abis:[]},'幽灵','雾').mul;
    return [a,b].join('/');
  })();
  out.saltMul = (function(){                 /* 超净：幽灵招 0.5 / 毒招 1 */
    var g=dmgDefAbiMul({inns:['超净'],abis:[]},null,'幽灵',false,{moveId:247},1).mul;
    var p=dmgDefAbiMul({inns:['超净'],abis:[]},null,'毒',false,{moveId:92},1).mul;
    return [g,p].join('/');
  })();
  out.spdAbi = (function(){                  /* v4.235 速度特性：源码 .onStat(STAT_SPEED) 口径 */
    function pick(n){
      var r=null;
      ERDATA.species.forEach(function(x){
        var pool=[].concat(x.abis||[],x.inns||[]);
        if(!r && pool.indexOf(n)>-1) r=x;
      });
      return r;
    }
    var names=['悠游自如','叶绿素','拨雪','飞毛腿','轻装','轻金属'];
    var o=[];
    names.forEach(function(n){
      var sp=pick(n); if(!sp){o.push(n+':NO');return;}
      var r=spdSpeedAbiOf(sp);
      o.push(n+'='+(r?(r.mul+':'+Math.floor(spdMaxOf(sp)*r.mul)):'NONE'));
    });
    return o.join('/')+'|N='+SPD_ABI.length;
  })();
  out.atkKind = (function(){                 /* v4.236 进攻侧条件型增伤 10 条（已剔 ALLY_ONLY） */
    function findMv(pred){
      var id=0;
      Object.keys(ERDATA.moves).forEach(function(k){
        var m=ERDATA.moves[k];
        if(!id && +m[5]>0 && pred(m,+k)) id=+k;
      });
      return id;
    }
    var physC=findMv(function(m,k){return m[4]==='物理'&&mvIsContact(k)});
    var physN=findMv(function(m,k){return m[4]==='物理'&&!mvIsContact(k)});
    var spec =findMv(function(m,k){return (m[4]==='特殊'||m[4]==='特殊(取防御)')});
    var low  =findMv(function(m,k){return +m[5]<=60 && +m[5]>0});
    var high =findMv(function(m,k){return +m[5]>60});
    var snd  =findMv(function(m,k){return mvHasFlag(k,'sound')});
    function c(abil,mvId,ex){
      var m=ERDATA.moves[mvId];
      var ctx={isPhys:m[4]==='物理',spec:(m[4]==='特殊'||m[4]==='特殊(取防御)'),
               pow:+m[5],contact:mvIsContact(mvId),eff:2,crit:false};
      if(ex)for(var k in ex)ctx[k]=ex[k];
      return dmgAtkAbiMul({abis:[abil],inns:[]},m[3],'',mvId,ctx).mul;
    }
    return [
      'N='+Object.keys(ABI_ATK_KIND).length,
      '无ALLYONLY='+((ABI_ATK_KIND['能量点']===undefined&&ABI_ATK_KIND['蓄电池']===undefined)?'OK':'BAD'),
      '活力='+c('活力',low),
      '远隔P='+c('远隔',physC), '远隔NP='+c('远隔',physN), '远隔S='+c('远隔',spec),
      '猩P='+c('一猩一意',physC), '猩S='+c('一猩一意',spec),
      '钳P='+c('毒焰钳',physC), '钳S='+c('毒焰钳',spec),
      '贤S='+c('贤者之力',spec), '贤P='+c('贤者之力',physC),
      '技低='+c('技术高手',low), '技高='+c('技术高手',high),
      '胸C='+c('健壮胸肌',physC), '胸N='+c('健壮胸肌',physN),
      '核SE='+c('脑核之力',low), '核N='+c('脑核之力',low,{eff:1}),
      '狙C='+c('狙击手',low,{crit:true}), '狙N='+c('狙击手',low),
      '声S='+c('湿润之声',snd), '声N='+c('湿润之声',high)
    ].join(' ');
  })();
  out.dmgAbiNone = (function(){
    var sD=null,sA=null,mv=null;
    ERDATA.species.forEach(function(x){
      if(!sD && (x.abis||[]).length && !(x.abis||[]).some(function(n){return ABI_DMG_ALL[n]!==undefined||ABI_DMG_COND[n]!==undefined}))sD=x;
    });
    ERDATA.species.forEach(function(x){if(!sA&&+x.base[1]>100)sA=x});
    for(var id in MV){var m=MV[id];if(m&&m[4]==='物理'&&+m[5]>=80&&m[1]&&m[1]!=='-'){mv=id;break}}
    if(!sD||!sA||!mv)return null;
    var r=dmgCalc({sA:sA,sD:sD,moveId:mv,evA:0,evD:0,natA:'',natD:'',itemA:'',weather:'',terrain:'',crit:false});
    return r?r.abiMul:null;
  })();
          /* v4.196：统一求值口 coverMultOf —— 模拟「带某特性的宝可梦，某属性招打某属性」 */
          out.cmBase = coverMultOf({inns:[],t1:'地面',t2:'-'},'电','地面');
          out.dmgN   = Object.keys(ABI_DMG_MOD||{}).length;
          out.dmgAll = Object.keys(ABI_DMG_ALL||{}).length;
          out.dmgFat = (function(){var v=ABI_DMG_MOD['厚脂肪'];return v?(v[0].t.join('/')+'|'+v[0].mul):'NONE';})();
          out.dmgBlub= (function(){var v=ABI_DMG_MOD['厚脂'];return v?(v[0].t.join('/')+'|'+v[0].mul):'NONE';})();
          out.dmgArmor=(function(){var v=ABI_DMG_ALL['战斗盔甲'];return v===undefined?'NONE':''+v;})();
          out.dmgText=(function(){
            try{
              var src=String(abiDesc);
              return (/受到伤害倍率/.test(src) && /ABI_DMG_MOD/.test(src) && /ABI_DMG_ALL/.test(src))?'OK':'MISS';
            }catch(e){ return 'ERR:'+e.message; }
          })();
          out.tblKey=(function(){try{return (ABI_DMG_MOD['厚脂肪']?'HIT':'MISS');}catch(e){return 'ERR:'+e.message;}})();
out.dmgCond  = Object.keys(ABI_DMG_COND||{}).length;
out.dmgCondFlu = (function(){try{
  var r=ABI_DMG_COND['毛茸茸']||[];
  if(r.length!==2)return 'N='+r.length;
  var has2=r.some(function(x){return x.mul===2.0}), has05=r.some(function(x){return x.mul===0.5&&/接触/.test(x.when)});
  return (has2&&has05)?'OK':'MISS '+JSON.stringify(r);
}catch(e){return 'ERR:'+e.message;}})();
out.dmgCondRender = (function(){try{
  var d=document.createElement('div');d.id='abiDescProbeCond';document.body.appendChild(d);
  abiDesc(d,'218','abiDescProbeCond');
  var h=d.innerHTML||'';
  var ok=(h.indexOf('条件：')>=0)&&(h.indexOf('接触招式')>=0);
  document.body.removeChild(d);
  return ok?'OK':'NO '+h.replace(/<[^>]+>/g,'').slice(0,90);
}catch(e){return 'ERR:'+e.message;}})();
          out.dmgReal=(function(){
            try{
              var d=document.createElement('div'); d.id='abiDesc'; document.body.appendChild(d);
              var el=document.createElement('span'); el.textContent='厚脂肪';
              var got=document.getElementById('abiDesc');
              if(!got)return 'NO_CONTAINER';
              abiDesc(el,'47','abiDesc');
              var t=got.innerHTML||'';
              return t?(/受到伤害倍率/.test(t)?'OK':('NOHDR:'+t.slice(0,100))):'EMPTY';
            }catch(e){ return 'ERR:'+e.message; }
          })();
          out.abi47name=(function(){try{return (ABI['47']&&ABI['47'][2])||'NONE';}catch(e){return 'ERR';}})();
          out.cmGS   = coverMultOf({inns:['地面冲击'],t1:'地面',t2:'-'},'电','地面');
          out.cmCO   = coverMultOf({inns:['腐蚀'],t1:'毒',t2:'-'},'毒','钢');
          out.cmCO0  = coverMultOf({inns:[],t1:'毒',t2:'-'},'毒','钢');
          out.cmDual = coverMultOf({inns:['腐蚀'],t1:'毒',t2:'钢'},'毒','钢') * coverMultOf({inns:['腐蚀'],t1:'毒',t2:'钢'},'钢','钢');
          out.cmSrc  = (function(){ try{ var f=coverMultOf.toString(); return /abiTeApplyOne/.test(f); }catch(e){ return false; } })();
          out.tagTummy = (function(){var g=abiTagOf('胃痛');return g&&g.hf?g.hf.join('/'):'NONE';})();
          out.tagBubble= (function(){var g=abiTagOf('火焰泡泡');return g&&g.hf?g.hf.join('/'):'NONE';})();
          out.tagIron  = (function(){var g=abiTagOf('钢铁巨人');return g&&g.hf?g.hf.join('/'):'NONE';})();
          out.tagResv  = (function(){var g=abiTagOf('蓄水器');return g&&g.im?g.im.join('/'):'NONE';})();
          out.tagWing  = (function(){var g=abiTagOf('幸运之翼');return g&&g.im?g.im.join('/'):'NONE';})();
          out.tagPoison = (function(){var g=abiTagOf('毒素吸收');return g&&g.im?g.im.join('/'):'NONE';})();
          out.tagIce    = (function(){var g=abiTagOf('引冰');return g&&g.im?g.im.join('/'):'NONE';})();
          out.tagRock   = (function(){var g=abiTagOf('熔核');return g&&g.im?g.im.join('/'):'NONE';})();
          out.tagWater  = (function(){var g=abiTagOf('引水');return g&&g.im?g.im.join('/'):'NONE';})();
          out.tagFire   = (function(){var g=abiTagOf('引火');return g&&g.im?g.im.join('/'):'NONE';})();
          out.fnGS =abiTeApplyOne('地面冲击','电','地面',0,['地面']);
          out.fnOC0=abiTeApplyOne('无',   '电','电',0.5,['电']);
          out.fnOC =abiTeApplyOne('电力过载','电','电',0.5,['电']);
          out.fnCO0=abiTeApplyOne('无',   '毒','钢',0,['钢']);
          out.fnCO =abiTeApplyOne('腐蚀','毒','钢',0,['钢']);
          out.fnSCR=abiTeApplyOne('胆量','一般','幽灵',0,['幽灵']);
          out.fnDual=abiTeApplyOne('腐蚀','毒','钢',0,['钢','水']);
          out.fnPyro=abiTeApplyOne('火岩浆流','火','岩石',0.5,['岩石']);
          out.fnNF =abiTeApplyOne('一般皮肤','一般','岩石',0.5,['一般']);
          out.fnSelf=abiTeApplyOne('龙族皮肤','龙','妖精',0,['妖精']);
          out.fnSelf2=abiTeApplyOne('龙族皮肤','龙','妖精',0,['龙']);
          out.coverHas = (function(){
            try{ return typeof setCoverProfile==='function'; }catch(e){ return false; }
          })();
          if(gs){ out.gsSp=gs.zh; out.gsAb=defCellTrio(gs,'电').inn; }
          if(pe) out.ocBase=defCellTrio(pe,'电').inn;
          if(oc){ out.ocSp=oc.zh; out.ocAb=defCellTrio(oc,'电').inn; }
          return out;
        })();
        abiDesc(null, '635');
        var dF3=document.getElementById('abiDesc');
        r.desc635 = dF3? dF3.innerHTML : null;
        abiDesc(null, '774');
        var dF4=document.getElementById('abiDesc');
        r.desc774 = dF4? dF4.innerHTML : null;
      }catch(eF3){ r.desc635 = 'ERR:' + eF3; r.desc774 = 'ERR:' + eF3; }
      try{
        abiDesc(null, '86');
        var dF3=document.getElementById('abiDesc');
        r.desc86b = dF3? dF3.innerHTML : null;
      }catch(eF3){ r.desc86b = 'ERR:' + eF3; }

      // --- E. 入场类特性展开（#293 滚起来「入场释放变圆」/#320 鼓风「入场顺风」）---
      try{
        abiDesc(null, '293');
        var dE=document.getElementById('abiDesc');
        r.desc293 = dE? dE.innerHTML : null;
      }catch(eE){ r.desc293 = 'ERR:' + eE; }
      try{
        abiDesc(null, '320');
        var dE2=document.getElementById('abiDesc');
        r.desc320 = dE2? dE2.innerHTML : null;
      }catch(eE2){ r.desc320 = 'ERR:' + eE2; }
      // 反例：非入场类不应出现该块
      try{
        abiDesc(null, '86');
        var dE3=document.getElementById('abiDesc');
        r.desc86 = dE3? dE3.innerHTML : null;
      }catch(eE3){ r.desc86 = 'ERR:' + eE3; }
      // 触发型（#788 冰川暴怒「使用冰属性招式后触发一格50威力的暴风雪」）
      try{
        abiDesc(null, '788');
        var dE4=document.getElementById('abiDesc');
        r.desc788 = dE4? dE4.innerHTML : null;
      }catch(eE4){ r.desc788 = 'ERR:' + eE4; }
      // 源码级详解 #733 拳舞
      try{
        abiDesc(null, '733');
        var dE5=document.getElementById('abiDesc');
        r.desc733 = dE5? dE5.innerHTML : null;
      }catch(eE5){ r.desc733 = 'ERR:' + eE5; }

      put(r);
    }catch(e){ r.ERROR=String(e); r.stack=String(e&&e.stack||'').slice(0,500); put(r); }
  }
})();
"""


def find_chrome():
    for p in CHROME_CANDIDATES:
        if os.path.exists(p):
            return p
    raise RuntimeError("未找到 Chrome/Edge")


def guess_ctype(fp):
    if fp.endswith(".js"):
        return "application/javascript; charset=utf-8"
    if fp.endswith(".css"):
        return "text/css; charset=utf-8"
    if fp.endswith(".json"):
        return "application/json"
    if fp.endswith(".webp"):
        return "image/webp"
    return "application/octet-stream"


class H(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _send(self, code, body, ctype="text/html; charset=utf-8"):
        if isinstance(body, str):
            body = body.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = self.path.split("?")[0].split("#")[0]
        if path in ("/", "/index.html"):
            import io
            html = io.open(os.path.join(REPO, "index.html"), "r", encoding="utf-8", newline="").read()
            idx = html.find("<body")
            if idx < 0:
                self._send(500, "no <body>")
                return
            end = html.find(">", idx)
            injected = html[:end + 1] + "\n<script>\n" + INJECT_JS + "\n</script>" + html[end + 1:]
            self._send(200, injected)
            return
        fp = os.path.join(REPO, path.lstrip("/").replace("/", os.sep))
        if os.path.isfile(fp):
            self._send(200, open(fp, "rb").read(), guess_ctype(fp))
            return
        self._send(404, "not found")


def main():
    chrome = find_chrome()
    httpd = ThreadingHTTPServer(("127.0.0.1", 8791), H)
    httpd.daemon_threads = True
    threading.Thread(target=httpd.serve_forever, daemon=True).start()

    tmp = tempfile.mkdtemp(prefix="er_sp_")
    out_html = os.path.join(tmp, "dom.html")
    cmd = [chrome, "--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars",
           "--user-data-dir=" + os.path.join(tmp, "udd"),
           "--virtual-time-budget=30000", "--dump-dom", "http://127.0.0.1:8791/"]
    with open(out_html, "wb") as f:
        subprocess.run(cmd, stdout=f, stderr=subprocess.DEVNULL, timeout=120)

    dom = open(out_html, "r", encoding="utf-8", errors="replace").read()
    m = re.search(r'<div id="__probe_out"[^>]*>' + re.escape(MARK) + r'([^<]*)</div>', dom)
    if not m:
        # 兜底：直接找标记后的 JSON
        i = dom.rfind(MARK)
        if i < 0:
            print("FAIL 探针输出缺失（页面未跑到 finish）")
            return 1
        payload = dom[i + len(MARK):]
        payload = payload.split("<")[0]
    else:
        payload = m.group(1)
    data = json.loads(payload)

    if data.get("ERROR"):
        print("FAIL 页面内异常:", data["ERROR"])
        print((data.get("stack") or "")[:400])
        print("globals:", json.dumps(data.get("g"), ensure_ascii=False))
        return 1

    fails = []

    def ck(cond, name, detail=""):
        if cond:
            print("PASS %-46s %s" % (name, detail))
        else:
            print("FAIL %-46s %s" % (name, detail))
            fails.append(name)

    # A. 三同名去重
    h = data.get("dup_abiHead") or ""
    btns = data.get("dup_abiBtns") or []
    ck("唯一" in h, "A1 三同名标题含「唯一」", h)
    ck("3 选 1" not in h and "选 1" not in h, "A2 三同名标题不含「N 选 1」", h)
    ck(len(btns) == 1, "A3 三同名只渲染 1 个徽标", "n=%d %s" % (len(btns), btns))
    ck(btns and btns[0] == "天使暴怒", "A4 徽标名为规范中文「天使暴怒」", btns[0] if btns else "")
    ih = data.get("dup_innHead") or ""
    ck("固定 3 个" in ih, "A5 天性（三个不同）仍写「固定 3 个」", ih)

    # A6 详情里有源码级详解
    dh = data.get("dup_descHtml") or ""
    ck("机制详解（源码级）" in dh, "A6 详情含「机制详解（源码级）」")
    ck("撞击 Tackle" in dh and "毒针 Poison Sting" in dh, "A7 详解列出撞击/毒针具体数值")
    ck("40→100" in dh and "15→120" in dh, "A8 详解含威力改写数值")

    # B. 普通物种仍是 N 选 1
    nh = data.get("norm_abiHead") or ""
    nb = data.get("norm_abiBtns") or []
    ck("3 选 1" in nh, "B1 三不同特性仍写「3 选 1」", nh)
    ck(len(nb) == 3, "B2 三不同特性渲染 3 个徽标", "n=%d %s" % (len(nb), nb))

    # C. 复合特性拆解
    c467 = data.get("comp_467")
    c440 = data.get("comp_440")
    cneg = data.get("comp_neg")
    ck(isinstance(c467, list) and len(c467) == 2, "C1 「强夺+熔岩」拆成 2 项", str(c467)[:90])
    ck(isinstance(c440, list) and len(c440) == 4, "C2 「变色+变换自如+毛皮大衣+冰鳞粉」拆 4 项", str(c440)[:90])
    ck(cneg is None, "C3 非复合描述不误判（返回 null）", str(cneg))

    # D. ABI_DETAIL
    ck(data.get("detail_has439") is True, "D1 ABI_DETAIL 含 439 且有 rows")
    ck(data.get("detail_rows439", 0) >= 7, "D2 439 详解至少 7 行", str(data.get("detail_rows439")))
    d104 = data.get("desc104") or ""
    d163 = data.get("desc163") or ""
    ck("机制详解" in d104 and "breakable" in d104 and "207" in d104 and "先天槽同样穿透" in d104, "D3 破格详解：breakable 口径 + 行表格齐全", "len=%s" % data.get("len104"))
    ck("机制详解" in d163 and "207" in d163, "D4 涡轮火焰共用破格口径", d163[:60].replace("\n", " "))
    # F5. 相性改写全量（22 条，v4.192）
    tmCnt = data.get("tmCount")
    d635 = data.get("desc635") or ""
    d774 = data.get("desc774") or ""
    ck(tmCnt == 22, "F5 ABI_TYPE_MOD 全量 22 条", "count=%s" % tmCnt)
    ck(("2.0 倍" in d635), "F6 火岩浆流两条判定串联", d635[:60])
    ck(("不标记" in d774), "F7 腐化思维只改倍率不标记", d774[:60])
    # F8. 特性改写相性进了计算（v4.193）
    tt = data.get("teTest") or {}
    ck(tt.get("gsBase") == 0, "F8 无特性时电打地面仍是免疫 0", "base=%s" % tt.get("gsBase"))
    ck(tt.get("ocBase") == 0.5, "F10 无特性时电打电是抗性 0.5", "base=%s" % tt.get("ocBase"))



    # E. 招式型特性自动展开
    d293 = data.get("desc293") or ""
    d320 = data.get("desc320") or ""
    d86 = data.get("desc86") or ""
    d788 = data.get("desc788") or ""
    d733 = data.get("desc733") or ""
    ck("关联招式" in d293 and "变圆" in d293, "E1 「入场释放变圆」附上招式效果", d293[:64].replace("\n", " "))
    ck(tt.get("fnGS0") == 0, "F12 函数级：无特性电打地面 0", "v=%s" % tt.get("fnGS0"))
    ck(tt.get("fnGS") == 0.5, "F13 函数级：地面冲击 0->0.5", "v=%s" % tt.get("fnGS"))
    ck(tt.get("fnOC0") == 0.5, "F14 函数级：无特性电打电 0.5", "v=%s" % tt.get("fnOC0"))
    ck(tt.get("fnOC") == 2.0, "F15 函数级：电力过载 0.5->2.0", "v=%s" % tt.get("fnOC"))
    ck(tt.get("fnCO0") == 0, "F16 函数级：无特性毒打钢 0", "v=%s" % tt.get("fnCO0"))
    ck(tt.get("fnCO") == 2.0, "F17 函数级：腐蚀 0->2.0", "v=%s" % tt.get("fnCO"))
    ck(tt.get("fnSCR") == 1.0, "F18 函数级：胆量 幽灵免疫->1.0", "v=%s" % tt.get("fnSCR"))
    ck(tt.get("fnDual") == 2.0, "F19 腐蚀对钢那一半生效", "v=%s" % tt.get("fnDual"))
    ck(tt.get("fnNF") == 1.0, "F21 一般皮肤把抗性 0.5 抬到 1.0", "v=%s" % tt.get("fnNF"))
    ck(tt.get("fnSelf") == 0, "F22 龙族皮肤非龙系自身不触发", "v=%s" % tt.get("fnSelf"))
    ck(tt.get("fnSelf2") == 1.0, "F23 龙族皮肤自身为龙才触发", "v=%s" % tt.get("fnSelf2"))
    ck(tt.get("coverHas") is True, "F24 打击面 setCoverProfile 已接入", "v=%s" % tt.get("coverHas"))
    ck(tt.get("fnPyro") == 2.0, "F20 火岩浆流 火打岩石 2.0", "v=%s" % tt.get("fnPyro"))
    ck(tt.get("tagPatchN") == 11, "F25 特性补丁 11 条（7 免疫 + 4 减半）", "n=%s" % tt.get("tagPatchN"))
    ck('0.25' in (tt.get("tagBlubber") or ''), "F51 厚脂 hfMul 火=0.25", "%s" % tt.get("tagBlubber"))
    ck(tt.get("hfMulFire") == 0.25, "F52 _hfMulOf 厚脂火 0.25", "v=%s" % tt.get("hfMulFire"))
    ck(tt.get("hfMulLava") == 0.7, "F53 _hfMulOf 熔岩铠甲水 0.7", "v=%s" % tt.get("hfMulLava"))
    ck(tt.get("hfMulPlain") == 0.5, "F54 无自定义倍率回退 0.5", "v=%s" % tt.get("hfMulPlain"))
    ck(tt.get("mvTeHit") == 2.0, "F55 天使暴怒对毒针改写为 2.0", "v=%s" % tt.get("mvTeHit"))
    ck(tt.get("mvTeMiss") == 0, "F56 天使暴怒对其他毒招不生效", "v=%s" % tt.get("mvTeMiss"))
    ck(tt.get("mvTeNoMv") == 0, "F57 未传招式名时不擅自改写", "v=%s" % tt.get("mvTeNoMv"))
    ck(tt.get("floorZero") == 1.0, "F58 一般皮肤把无效(0)抬到 1.0", "v=%s" % tt.get("floorZero"))
    ck(tt.get("floorHalf") == 1.0, "F59 一般皮肤把抵抗(0.5)抬到 1.0", "v=%s" % tt.get("floorHalf"))
    ck(tt.get("dmgAbiMul") == 0.5, "F60 dmgCalc 计入多重鳞片满血 ×0.5", "v=%s" % tt.get("dmgAbiMul"))
    ck(tt.get("dmgAbiFur") == 0.5, "F61 dmgCalc 计入毛皮大衣物理 ×0.5", "v=%s" % tt.get("dmgAbiFur"))
    ck(tt.get("dmgAbiNone") == 1, "F62 dmgCalc 无减伤特性时不误乘", "v=%s" % tt.get("dmgAbiNone"))
    ck(tt.get("atkModN") == 25, "F63 ABI_ATK_MOD 25 条（13 有物种 + 12 备查）", "n=%s" % tt.get("atkModN"))
    ck(tt.get("atkWater") == 2.0, "F64 水泡·水属性招 ×2", "v=%s" % tt.get("atkWater"))
    ck(tt.get("atkWaterMiss") == 1, "F65 水泡·非水属性招不增伤", "v=%s" % tt.get("atkWaterMiss"))
    ck(tt.get("atkLevitate") == 1.25, "F66 飘浮·飞行招 ×1.25", "v=%s" % tt.get("atkLevitate"))
    ck(tt.get("contactN") == 318, "F67 接触招式表 318 条（源码 FLAG_MAKES_CONTACT）", "n=%s" % tt.get("contactN"))
    ck(tt.get("contact21") is True and tt.get("contact85") is False, "F68 摔打接触 / 十万伏特非接触", "%s/%s" % (tt.get("contact21"), tt.get("contact85")))
    ck(tt.get("mrPunch") == 0.5, "F69 毛茸茸·一般接触招 ×0.5", "v=%s" % tt.get("mrPunch"))
    ck(tt.get("mrFireContact") == 1, "F70 毛茸茸·火接触招 火×2 与接触×0.5 抵消为 1", "v=%s" % tt.get("mrFireContact"))
    ck(tt.get("mrFireNoContact") == 2, "F71 毛茸茸·火非接触招 ×2", "v=%s" % tt.get("mrFireNoContact"))
    ck(tt.get("saltMul") == "0.5/1", "F72 超净 幽灵×0.5、毒×1（原误登记毒）", "%s" % tt.get("saltMul"))
    ck(tt.get("teDefCondN") == 5, "F73 防守侧条件型相性改写 5 条", "n=%s" % tt.get("teDefCondN"))
    ck(tt.get("teraFight") == 0.5, "F74 太晶甲壳 格斗 2.0 压到 0.5", "v=%s" % tt.get("teraFight"))
    ck(tt.get("teraImmun") == 0, "F75 太晶甲壳 免疫属性 0 不动", "v=%s" % tt.get("teraImmun"))
    ck(tt.get("wgWater") == 0, "F76 神奇守护 非绝佳 1.0 归零", "v=%s" % tt.get("wgWater"))
    ck(tt.get("wgFire") == 2, "F77 神奇守护 效果绝佳 2.0 保留", "v=%s" % tt.get("wgFire"))
    ck(tt.get("fogDef") == "1/0.5", "F78 雾眼 防守侧 无雾1/雾天0.5", "%s" % tt.get("fogDef"))
    ck(tt.get("fogAtk") == "1/1.5", "F79 雾眼 进攻侧 无雾1/雾天1.5", "%s" % tt.get("fogAtk"))
    ck(tt.get("darkAura") == 1.33, "F80 暗黑气场 恶招 ×1.33", "v=%s" % tt.get("darkAura"))
    ck(tt.get("fairyAura") == 1.33, "F81 妖精气场 妖精招 ×1.33", "v=%s" % tt.get("fairyAura"))
    ck(tt.get("antarctic") == 1.3, "F82 南极鸟 冰招 ×1.3", "v=%s" % tt.get("antarctic"))
    ck(tt.get("mvFlagCounts") == '{"jaw":25,"sound":36,"reckless":18,"sheer":255,"field":15,"dance":11,"bone":5,"launcher":78,"keen":47,"fist":31,"striker":17}', "F83 招 flag 表 11 类全量", "%s" % tt.get("mvFlagCounts"))
    ck(tt.get("flagAtk") == "1.3/1|1.3/1|1.2/1|1.3/1|1.3/1|1.3/1|1.3/1|1.3/1", "F84 八个 flag 型特性 命中 flag 时增伤、无招时不增", "%s" % tt.get("flagAtk"))
    ck(tt.get("punkDef") == "0.5/1", "F85 庞克摇滚 防守侧 声音招 ×0.5", "%s" % tt.get("punkDef"))
    ck(tt.get("inherAtk") == "1.3/1/1.3/1.3", "F86 栗子斧(草招∪锐利)/后街男孩(舞蹈∪踢)/枪手(波动) 扩类后仍 ×1.3，非触发招不增", "%s" % tt.get("inherAtk"))
    ck(tt.get("atkKind") == "N=10 无ALLYONLY=OK 活力=1.4 远隔P=1.2 远隔NP=1.2 远隔S=1 猩P=1.5 猩S=1 钳P=1.2 钳S=1 贤S=1.5 贤P=1 技低=1.5 技高=1 胸C=1.3 胸N=1 核SE=1.35 核N=1 狙C=1.5 狙N=1 声S=1.2 声N=1",
       "F89 进攻侧条件型增伤 10 条：物理/特殊/威力≤60/接触/相性≥2/会心/声音 逐项判定正确，且已剔除 APPLY_ON_ALLY_ONLY", "%s" % tt.get("atkKind"))
    ck((tt.get("spdAbi") or "").endswith("|N=14"), "F87 SPD_ABI 收录 14 条速度修正特性（源码 .onStat 口径）", "%s" % tt.get("spdAbi"))
    ck("悠游自如=1.5:" in (tt.get("spdAbi") or "") and "轻装=2:" in (tt.get("spdAbi") or ""), "F88 天气类 ×1.5 与轻装 ×2 倍率区分正确（18.21 曾误写全线 ×2）", "%s" % tt.get("spdAbi"))
    ck(tt.get("tagPoison") == "毒", "F26 毒素吸收补为免疫毒", "%s" % tt.get("tagPoison"))
    ck(tt.get("tagIce") == "冰", "F27 引冰补为免疫冰", "%s" % tt.get("tagIce"))
    ck(tt.get("tagRock") == "岩石", "F28 熔核补为免疫岩石", "%s" % tt.get("tagRock"))
    ck(tt.get("tagWater") == "水", "F29 引水原有免疫水未被破坏", "%s" % tt.get("tagWater"))
    ck(tt.get("tagFire") == "火", "F30 引火原有免疫火未被破坏", "%s" % tt.get("tagFire"))


    ck("关联招式" in d320 and "顺风" in d320, "E2 「入场顺风」附上招式效果", d320[:64].replace("\n", " "))
    ck(tt.get("tagTummy") == "火/冰", "F31 胃痛(厚脂肪+腐蚀)继承火冰减半", "%s" % tt.get("tagTummy"))
    ck(tt.get("tagBubble") == "火", "F32 火焰泡泡(水泡+燃烧之魂)继承火减半", "%s" % tt.get("tagBubble"))
    ck(tt.get("tagIron") == "火", "F33 钢铁巨人(耐热+重型坦克)继承火减半", "%s" % tt.get("tagIron"))
    ck(tt.get("tagResv") == "水", "F34 蓄水器(储水+引水)继承水免疫", "%s" % tt.get("tagResv"))
    ck(tt.get("tagWing") == "地面", "F35 幸运之翼(天恩+巨翼)继承地面免疫", "%s" % tt.get("tagWing"))

    ck("关联招式" not in d86, "E3 非招式型特性不误挂该块", d86[:54].replace("\n", " "))
    ck(tt.get("cmBase") == 0, "F36 coverMultOf 无特性 电打地面=0", "%s" % tt.get("cmBase"))
    ck(tt.get("cmGS") == 0.5, "F37 coverMultOf 地面冲击 电打地面=0.5", "%s" % tt.get("cmGS"))
    ck(tt.get("cmCO0") == 0 and tt.get("cmCO") == 2, "F38 coverMultOf 腐蚀 毒打钢 0->2", "%s->%s" % (tt.get("cmCO0"), tt.get("cmCO")))
    ck(tt.get("cmSrc") is True, "F39 coverMultOf 内部确实走 abiTeApplyOne", "%s" % tt.get("cmSrc"))

    ck("关联招式" in d788 and "暴风雪" in d788, "E4 「触发50威力暴风雪」附上招式效果", d788[:64].replace("\n", " "))
    ck(tt.get("dmgN") == 15, "F40 防御伤害倍率表 15 条", "n=%s" % tt.get("dmgN"))
    ck(tt.get("dmgAll") == 11, "F41 无条件全伤害表 11 条", "n=%s" % tt.get("dmgAll"))
    ck(tt.get("dmgFat") == "火/冰|0.5", "F42 厚脂肪 火/冰 x0.5", "%s" % tt.get("dmgFat"))
    ck(tt.get("dmgBlub") == "火/冰|0.25", "F43 厚脂 火/冰 x0.25", "%s" % tt.get("dmgBlub"))
    ck(tt.get("dmgArmor") == "0.8", "F44 战斗盔甲 全伤害 x0.8", "%s" % tt.get("dmgArmor"))

    ck("机制详解" in d733 and "跟舞" in d733, "E5 733 拳舞有源码级详解", d733[:64].replace("\n", " "))
    ck(tt.get("dmgText") == "OK", "F45 特性详情已接入「受到伤害倍率」渲染", "%s" % tt.get("dmgText"))
    ck(tt.get("tblKey") == "HIT", "F46 中文名可正确索引到倍率表", "%s" % tt.get("tblKey"))
    ck(tt.get("dmgReal") == "OK", "F47 厚脂肪详情实渲染出火/冰减伤", "%s" % tt.get("dmgReal"))
    ck(tt.get("dmgCond") == 32, "F48 条件型减伤表 32 条(30 常量 + 树皮/羽衣独立键)", "n=%s" % tt.get("dmgCond"))
    ck(tt.get("dmgCondFlu") == "OK", "F49 毛茸茸条件表含 火x2.0 与 接触x0.5", "%s" % tt.get("dmgCondFlu"))
    ck(tt.get("dmgCondRender") == "OK", "F50 毛茸茸详情实渲染出条件型减伤", "%s" % tt.get("dmgCondRender"))


    # F. 属性相性改写倍数
    d285 = data.get("desc285") or ""
    d349 = data.get("desc349") or ""
    d86b = data.get("desc86b") or ""
    ck("相性改写（源码倍率）" in d285 and "0.5 倍" in d285, "F1 285 地面冲击给出真实倍率 0.5", d285[:70].replace("\n", " "))
    ck("相性改写（源码倍率）" in d349 and "2.0 倍" in d349, "F2 349 电力过载给出 2.0", d349[:70].replace("\n", " "))
    ck("相性改写" not in d86b, "F3 非相性改写特性不误挂该块", d86b[:60].replace("\n", " "))

    # G. 未实装（EFFECT_PLACEHOLDER）招式提示
    phc = data.get("phCount")
    d507 = data.get("desc507") or ""
    ck(phc == 22, "G1 占位符招式表收录 22 条", "n=%s" % phc)
    ck("未实装" in d507, "G2 507 自由落体详情写明「未实装」", d507[:70].replace("\n", " "))
    ck("EFFECT_PLACEHOLDER" in d507 or "不会造成任何伤害" in d507, "G3 详情给出源码依据", d507[:70].replace("\n", " "))

    print()
    if fails:
        print("%d FAIL" % len(fails))
        return 1
    print("ALL PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
