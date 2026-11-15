// v4.386 只读探针（不改 index/文档/不提交）
// ①进攻物种 [0] 被机制卡占住；②玻璃大炮含睡觉156 分严格自回血可学/不可学；③台账9条错名候选；④矛盾性格全库扫描。
const H = require('./harness.js');
const fs = require('fs'), path = require('path');
const { ERDATA, deriveBuilds, learnOf, MV, bulkOf, isGlassCannon, NATURES } = H;
const dir = __dirname;
const by = id => ERDATA.species.find(s => String(s.id) === String(id));
const allTeam = [26, 65, 96, 80, 37, 208].map(by);

const DEF_ROLE = { '肉盾': 1, '受队': 1, '联防': 1, '辅助': 1 };
const OFF_ROLE = { '输出': 1, '强化': 1, '增伤': 1 };
const OFF_SIDE = { '物理': 1, '特殊': 1, '双刀': 1 };
// 严格自回血/吸血（排除祈愿273 换场治疗、505 治愈波动/456 回复指令/719 生命水滴/629 花疗 团队治疗）
const REC_STRICT = {
  105:'自我再生', 234:'晨光', 235:'光合作用', 236:'月光', 355:'羽栖', 303:'偷懒', 135:'生蛋', 208:'喝牛奶',
  631:'吸取力量', 275:'扎根', 392:'水流环', 622:'集沙', 744:'丛林治疗', 915:'新月祈祷',
  202:'终极吸取', 409:'吸取拳', 532:'木角', 72:'超级吸取', 71:'吸取', 837:'智力汲取', 73:'寄生种子'
};
const SLEEP = 156;

const alloc = b => (b.ev && b.ev.alloc) || [0,0,0,0,0,0];
const nat0 = b => { const n=b.nat; return Array.isArray(n)?(n[0]?String(n[0][0]||''):''):String(n||'').split(',')[0].trim(); };
const natStr = b => Array.isArray(b.nat)?b.nat.map(p=>(p||[]).join(',')).join(','):String(b.nat||'');
const mvIds = b => (b.mv.main||[]).concat(b.mv.func||[]).map(x=>+x.id);
const dmg = ids => ids.filter(id=>MV[id]&&MV[id][4]!=='变化').length;
const stab = (s,ids) => ids.filter(id=>MV[id]&&MV[id][4]!=='变化'&&(s.t1===MV[id][3]||s.t2===MV[id][3])).length;
const offEv = a => Math.max(a[1]||0,a[3]||0);
const looseOff = b => OFF_SIDE[String(b.side)]&&OFF_ROLE[String(b.roleTag)];
const strictOff = (s,b)=>{const a=alloc(b),ids=mvIds(b);return looseOff(b)&&dmg(ids)>=2&&offEv(a)>=120&&stab(s,ids)>=1;};
const defBuild = b => DEF_ROLE[String(b.roleTag)]||String(b.side)==='辅助';
const offIdentity = s => (+s.base[5]||0)>=100||Math.max(+s.base[1]||0,+s.base[3]||0)>=110;

// 真机制身份白名单 rw（机制卡本身就是该物种定位）；其余防御性机制卡在进攻物种上属挤占候选
const TRUE_MECH_RW = { imposter_anchor: '变身者/变身复制流（机制即身份）', toxic_heal_item: '毒疗站场流（score99 机制保留）' };

function snapshot(team){
  const out=[];
  ERDATA.species.forEach(s=>{let bs;try{bs=deriveBuilds(s,team)}catch(e){return}
    bs.forEach(b=>out.push({id:String(s.id),zh:s.zh,name:String(b.name||''),side:String(b.side||''),roleTag:String(b.roleTag||''),
      nat:natStr(b),alloc:alloc(b),tpl:b.ev&&b.ev.template,mv:mvIds(b),it0:b.it&&b.it[0]?String(b.it[0][0]):'',abi0:b.abi&&b.abi[0]?String(b.abi[0].n):''}));
  });
  return out;
}

const R = { a1: { six:{}, empty:{} }, a2: { six:{}, empty:{} }, a3: [], a4: { total:0, rows:[] }, nameBySideRole:{} };

function scanA1(team,tag){
  const rows=[], wl=[], layers={ident:0,mechFirst:0,mechDef:0,mechDefIdent:0,mechDefIdentLoose:0,mechDefIdentStrict:0,normDefStrict:0};
  ERDATA.species.forEach(s=>{let bs;try{bs=deriveBuilds(s,team)}catch(e){return}
    if(!offIdentity(s))return; layers.ident++;
    const first=bs[0]; if(!first)return;
    const mech=!!first.mechRw;
    if(mech)layers.mechFirst++;
    const strict=bs.filter(b=>strictOff(s,b));
    if(defBuild(first)){
      if(mech){
        layers.mechDef++;
        layers.mechDefIdent++;
        const loose=bs.filter(looseOff);
        if(loose.length)layers.mechDefIdentLoose++;
        if(strict.length)layers.mechDefIdentStrict++;
        const rec={id:String(s.id),zh:s.zh,spd:s.base[5],atk:s.base[1],spa:s.base[3],rw:first.mechRw,score:first.score,
          first:{name:first.name,role:first.roleTag,side:first.side,nat:nat0(first),ev:alloc(first)},
          offLoose:loose.map(b=>({name:b.name,role:b.roleTag,side:b.side,ev:alloc(b)})),
          offStrict:strict.map(b=>({name:b.name,role:b.roleTag,side:b.side,ev:alloc(b)}))};
        if(TRUE_MECH_RW[first.mechRw])wl.push(Object.assign(rec,{whitelist:TRUE_MECH_RW[first.mechRw]})); else rows.push(rec);
      } else if(strict.length){ layers.normDefStrict++; }
    }
  });
  R.a1[tag]={layers, rows, whitelist:wl};
}
scanA1(allTeam,'six'); scanA1([],'empty');

function scanA2(team,tag){
  const rows=[];
  ERDATA.species.forEach(s=>{let bs;try{bs=deriveBuilds(s,team)}catch(e){return}
    bs.forEach(b=>{const ids=mvIds(b);if(!ids.includes(SLEEP)||!isGlassCannon(s))return;
      const cardRec=ids.filter(id=>REC_STRICT[id]);
      const learnRec=learnOf(s).filter(id=>REC_STRICT[id]);
      rows.push({id:String(s.id),zh:s.zh,spd:s.base[5],bulk:bulkOf(s),name:b.name,role:b.roleTag,side:b.side,ev:alloc(b),mv:ids,
        cardRec:cardRec.map(i=>i+':'+REC_STRICT[i]),learnRec:learnRec.map(i=>i+':'+REC_STRICT[i])});
    });
  });
  const rec=rows.filter(r=>r.learnRec.length), no=rows.filter(r=>!r.learnRec.length);
  const byName=a=>{const m={};a.forEach(r=>m[r.name]=(m[r.name]||0)+1);return m};
  R.a2[tag]={total:rows.length, recLearn:rec.length, noRec:no.length,
    noRecByType:byName(no), recByType:byName(rec), recRows:rec, noRecRows:no};
}
scanA2(allTeam,'six'); scanA2([],'empty');

// ③ 台账
const nameSet=new Set();
ERDATA.species.forEach(s=>{let bs;try{bs=deriveBuilds(s,[])}catch(e){return}bs.forEach(b=>nameSet.add(String(b.name||'')))});
ERDATA.species.forEach(s=>{let bs;try{bs=deriveBuilds(s,[])}catch(e){return}bs.forEach(b=>{const k=b.side+'/'+b.roleTag;(R.nameBySideRole[k]=R.nameBySideRole[k]||new Set()).add(String(b.name||''))})});
Object.keys(R.nameBySideRole).forEach(k=>R.nameBySideRole[k]=[...R.nameBySideRole[k]].sort());
const ledgerIds=[636,871,1643,1644,1645,1646,1647,2290,1729];
ledgerIds.forEach(id=>{const s=by(id);if(!s)return;let bs;try{bs=deriveBuilds(s,[])}catch(e){return}
  bs.forEach(b=>{
    const sameGroup=R.nameBySideRole[b.side+'/'+b.roleTag]||[];
    const sibling=bs.filter(x=>x!==b).map(x=>x.name);
    R.a3.push({id:String(s.id),zh:s.zh,t1:s.t1,t2:s.t2,base:s.base.slice(),name:b.name,side:b.side,role:b.roleTag,nat:nat0(b),ev:alloc(b),mv:mvIds(b),candidatesSameGroup:sameGroup,candidateSibling:[...new Set(sibling)]});
  });
});

// ④ 矛盾性格扫描
function natConflicts(s,bs){
  const out=[];
  bs.forEach(b=>{if(!Array.isArray(b.nat)||b.nat.length<2)return;
    const dirs=b.nat.map(p=>{const n=String(p[0]||'');const nm=(NATURES||{})[n];return{nat:n,plus:nm?nm[0]:'',neg:nm?nm[1]:''}});
    let conflict=false; const reasons=[];
    for(let i=0;i<dirs.length;i++)for(let j=i+1;j<dirs.length;j++){
      const A=dirs[i],B=dirs[j];
      if(A.plus&&B.neg&&A.plus.slice(1)===B.neg.slice(1)){conflict=true;reasons.push(A.nat+'+'+A.plus.slice(1)+' 与 '+B.nat+B.neg+' 矛盾');}
      if(B.plus&&A.neg&&B.plus.slice(1)===A.neg.slice(1)){conflict=true;reasons.push(B.nat+'+'+B.plus.slice(1)+' 与 '+A.nat+A.neg+' 矛盾');}
    }
    if(conflict)out.push({id:String(s.id),zh:s.zh,name:b.name,role:b.roleTag,side:b.side,nat:b.nat,conflict:reasons});
  });
  return out;
}
const allConflict=[];
ERDATA.species.forEach(s=>{let bs;try{bs=deriveBuilds(s,[])}catch(e){return}
  allConflict.push(...natConflicts(s,bs));});
// 真机制身份白名单（机制卡本身即物种定位，维持 [0]）
const trueMech=[];
ERDATA.species.forEach(s=>{let bs;try{bs=deriveBuilds(s,[])}catch(e){return}
  bs.forEach(b=>{if(TRUE_MECH_RW[b.mechRw])trueMech.push({id:String(s.id),zh:s.zh,name:b.name,rw:b.mechRw,score:b.score,reason:TRUE_MECH_RW[b.mechRw]});});});
R.trueMech=trueMech;
R.a4.total=allConflict.length; R.a4.rows=allConflict;
const s1503=by(1503); let b1503=[]; if(s1503){let bs;try{bs=deriveBuilds(s1503,[])}catch(e){bs=[]} b1503=bs.map(b=>({name:b.name,role:b.roleTag,side:b.side,natRaw:b.nat}));}
R.a4.sp1503=b1503;

fs.writeFileSync(path.join(dir,'_ev4386.json'),JSON.stringify(R,null,1));
const snapSix=snapshot(allTeam),snapEmp=snapshot([]);
fs.writeFileSync(path.join(dir,'_v4386_base_snapshot.json'),JSON.stringify({six:snapSix,empty:snapEmp},null,1));

console.log('snapshot six=',snapSix.length,'empty=',snapEmp.length);
console.log('① six layers',JSON.stringify(R.a1.six.layers),'rows',R.a1.six.rows.length,'wl',R.a1.six.whitelist.length);
console.log('① empty layers',JSON.stringify(R.a1.empty.layers),'rows',R.a1.empty.rows.length,'wl',R.a1.empty.whitelist.length);
console.log('② six total',R.a2.six.total,'recLearn',R.a2.six.recLearn,'noRec',R.a2.six.noRec,JSON.stringify(R.a2.six.noRecByType));
console.log('② empty total',R.a2.empty.total,'recLearn',R.a2.empty.recLearn,'noRec',R.a2.empty.noRec,JSON.stringify(R.a2.empty.noRecByType));
console.log('③ ledger rows',R.a3.length,'④ conflict total',R.a4.total);
