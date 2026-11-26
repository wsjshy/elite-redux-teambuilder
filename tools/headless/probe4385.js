// v4.385 只读探针：EV/性格 与 卡名名实不符四档分账（六人队 allTeam + 空队 双口径）。
// 不改 index/文档/不提交。输出 out_v4385_probe.txt + _ev4385.json + _v4385_base_snapshot.json
const H = require('./harness.js');
const { ERDATA, deriveBuilds, learnOf, pvWeatherSpeedMul, bulkOf } = H;
const by = id => ERDATA.species.find(s => String(s.id) === String(id));
const allTeam = [by(26), by(65), by(96), by(80), by(37), by(208)];

// ---- 性格效果表（首选性格取 nat 首项；up/dn ∈ 攻/特攻/防/特防/速）----
const NAT_EFF = {
  '固执':{up:'攻',dn:'特攻'},'孤僻':{up:'攻',dn:'特攻'},'顽皮':{up:'攻',dn:'特攻'},'调皮':{up:'攻',dn:'特攻'},
  '内敛':{up:'特攻',dn:'攻'},'保守':{up:'特攻',dn:'攻'},'稳重':{up:'特攻',dn:'攻'},'马虎':{up:'特攻',dn:'攻'},'自大':{up:'特攻',dn:'攻'},
  '大胆':{up:'防',dn:'攻'},'乐天':{up:'防',dn:'攻'},'淘气':{up:'防',dn:'特攻'},'宽容':{up:'防',dn:'特攻'},
  '沉着':{up:'特防',dn:'攻'},'慎重':{up:'特防',dn:'特攻'},'温顺':{up:'特防',dn:'攻'},
  '勇敢':{up:'攻',dn:'速'},'冷静':{up:'特攻',dn:'速'},'悠闲':{up:'防',dn:'速'},'狂妄':{up:'特防',dn:'速'},
  '爽朗':{up:'速',dn:'特攻'},'开朗':{up:'速',dn:'特攻'},'胆小':{up:'速',dn:'攻'},'急躁':{up:'速',dn:'攻'},'天真':{up:'速',dn:'特攻'}
};
const SPEED_NATS = ['爽朗','开朗','胆小','急躁','天真'];
const BOOST_MV = [349,483,504,187,526];
const DEF_ROLE = ['肉盾','受队','联防','辅助'];
const DEF_NAME = /受队消耗|稳健联防|肉盾|减伤轴|联防|属性免疫/;
const HAZ_NAME = /钉子|墙/;
const SPACE_NAME = /空间/;

const evAlloc = b => (b.ev && b.ev.alloc) || [0,0,0,0,0,0];
const ev = (b,i) => +evAlloc(b)[i] || 0;
const primaryNat = b => String(b.nat||'').split(',')[0].trim();
const mvIds = b => (b.mv.main||[]).concat(b.mv.func||[]).map(x=>+x.id);

// 自有速度倍率来源（沿用 v4.382 verify_speedaxis 口径）
function speedSrc(s,b){
  const mv=mvIds(b);
  const wx=(pvWeatherSpeedMul(s)||1)>1;
  const light=(s.abis||[]).concat(s.inns||[]).indexOf('轻装')>=0;
  const scarf=String(((b.it||[])[0]||[])[0]||'').indexOf('讲究围巾')>=0;
  const tw=mv.indexOf(366)>=0;
  const boost=mv.some(id=>BOOST_MV.indexOf(id)>=0);
  return {wx,light,scarf,tw,boost,mult:wx||light||scarf||tw};
}

function bucketOf(s,b){
  const n=String(b.name||'');
  const a=evAlloc(b);
  const atk=ev(b,1),spa=ev(b,3),hp=ev(b,0),def=ev(b,2),sdf=ev(b,4),spd=ev(b,5);
  const bulkEV=hp+def+sdf;
  const src=speedSrc(s,b);
  const n0=primaryNat(b);
  const eff=NAT_EFF[n0]||null;
  const role=String(b.roleTag||'');
  const isDefName=DEF_NAME.test(n),isDefRole=DEF_ROLE.indexOf(role)>=0,isHaz=HAZ_NAME.test(n);
  const res={b1:false,b2Def:false,b2Haz:false,b3Down:false,b3DefSpd:false,b4:false,spaceExc:false,lightExc:false,srcExc:false,reasons:[]};

  // ① 速攻名 0 速 且无自有倍率来源
  if(/速攻/.test(n) && spd===0){
    if(src.mult){res.srcExc=true;}
    else{
      res.b1=true;
      res.reasons.push(`速攻名 速EV=0 无倍率来源(wx=${src.wx}/顺风=${src.tw}/轻装=${src.light}/围巾=${src.scarf})`);
    }
    if(src.light)res.lightExc=true;
  }

  // ② 防守身份名/防守role 满攻耐久不足；钉子/墙前缀进攻卡单列边界；空间例外单列
  if((atk>=252||spa>=252) && bulkEV<252){
    if(SPACE_NAME.test(n) && spd===0 && (atk>=252||spa>=252)){
      res.spaceExc=true;
    }else if(isDefName||isDefRole){
      res.b2Def=true;
      res.reasons.push(`防守身份(${isDefName?'名':'role'}) 攻EV=${atk}/特攻EV=${spa} 耐久EV=${bulkEV}<252`);
    }else if(isHaz){
      res.b2Haz=true;
      res.reasons.push(`钉子/墙前缀进攻(${role}) 攻EV=${atk}/特攻EV=${spa} 耐久EV=${bulkEV}<252`);
    }
  }

  // ③ 性格与主投资矛盾
  if(eff){
    const dnEV = eff.dn==='攻'?atk : eff.dn==='特攻'?spa : eff.dn==='防'?def : eff.dn==='特防'?sdf : spd;
    if(dnEV>=252){
      res.b3Down=true;
      res.reasons.push(`性格「${n0}」-${eff.dn} 但 ${eff.dn}EV=${dnEV} 满投`);
    }
    if((isDefName||isDefRole) && SPEED_NATS.indexOf(n0)>=0){
      res.b3DefSpd=true;
      res.reasons.push(`防守身份却挂加速性格「${n0}」`);
    }
  }

  // ④ EV 异常（>252 硬异常；总量 504/508 为模板留点常态，单列不判死）
  const sum=a.reduce((x,y)=>x+(+y||0),0);
  const over=a.filter(x=>(+x||0)>252);
  if(over.length){res.b4=true;res.reasons.push(`单项>252: [${a.join(',')}]`);}
  res.sum=sum;
  return res;
}

function snapshot(team){
  const out=[];
  for(const s of ERDATA.species){
    let bs;try{bs=deriveBuilds(s,team);}catch(e){continue;}
    for(const b of bs){
      out.push({id:s.id,zh:s.zh,name:String(b.name||''),side:String(b.side||''),roleTag:String(b.roleTag||''),
        nat:String(b.nat||''),alloc:evAlloc(b),tpl:b.ev&&b.ev.template,
        mv:mvIds(b),it0:((b.it||[])[0]||[])[0]||'',abi0:(b.abi||[])[0]?String(b.abi[0].n||''):''});
    }
  }
  return out;
}

function scan(team){
  const R={b1:[],b2Def:[],b2Haz:[],b3Down:[],b3DefSpd:[],b4:[],spaceExc:[],lightExc:[],srcExc:[],srcCat:{wx:0,tw:0,light:0,scarf:0},sumHist:{},total:0};
  for(const s of ERDATA.species){
    let bs;try{bs=deriveBuilds(s,team);}catch(e){continue;}
    for(const b of bs){
      R.total++;
      const r=bucketOf(s,b);
      const row={id:s.id,zh:s.zh,name:String(b.name||''),side:String(b.side||''),role:String(b.roleTag||''),
        nat:primaryNat(b),alloc:evAlloc(b),tpl:b.ev&&b.ev.template,reason:r.reasons.join('；')};
      R.sumHist[r.sum]=(R.sumHist[r.sum]||0)+1;
      if(r.b1)R.b1.push(row);
      if(r.b2Def)R.b2Def.push(row);
      if(r.b2Haz)R.b2Haz.push(row);
      if(r.b3Down)R.b3Down.push(row);
      if(r.b3DefSpd)R.b3DefSpd.push(row);
      if(r.b4)R.b4.push(row);
      if(r.spaceExc)R.spaceExc.push(row);
      if(r.lightExc)R.lightExc.push(row);
      if(r.srcExc){R.srcExc.push(row);const s2=speedSrc(s,b);if(s2.wx)R.srcCat.wx++;if(s2.tw)R.srcCat.tw++;if(s2.light)R.srcCat.light++;if(s2.scarf)R.srcCat.scarf++;}
    }
  }
  return R;
}

const six=scan(allTeam), emp=scan([]);
const snapSix=snapshot(allTeam), snapEmp=snapshot([]);

function markerCount(team){
  const m={v13Demoted:0,_v384Demoted:0,_v384BoostReplaced:0,_v384BoostEdgeKept:0};
  for(const s of ERDATA.species){let bs;try{bs=deriveBuilds(s,team);}catch(e){continue;}
    for(const b of bs){if(b.v13Demoted)m.v13Demoted++;if(b._v384Demoted)m._v384Demoted++;if(b._v384BoostReplaced)m._v384BoostReplaced++;if(b._v384BoostEdgeKept)m._v384BoostEdgeKept++;}}
  return m;
}
const mkSix=markerCount(allTeam), mkEmp=markerCount([]);

const fs=require('fs'),path=require('path'),dir=__dirname;
fs.writeFileSync(path.join(dir,'_v4385_base_snapshot.json'),JSON.stringify({six:snapSix,empty:snapEmp},null,1));
fs.writeFileSync(path.join(dir,'_ev4385.json'),JSON.stringify({
  six:{total:six.total,b1:six.b1,b2Def:six.b2Def,b2Haz:six.b2Haz,b3Down:six.b3Down,b3DefSpd:six.b3DefSpd,b4:six.b4,spaceExc:six.spaceExc,lightExc:six.lightExc,srcExc:six.srcExc,srcCat:six.srcCat,sumHist:six.sumHist,markers:mkSix},
  empty:{total:emp.total,b1:emp.b1,b2Def:emp.b2Def,b2Haz:emp.b2Haz,b3Down:emp.b3Down,b3DefSpd:emp.b3DefSpd,b4:emp.b4,spaceExc:emp.spaceExc,lightExc:emp.lightExc,srcExc:emp.srcExc,srcCat:emp.srcCat,sumHist:emp.sumHist,markers:mkEmp}
},null,1));

function show(tag,R){
  console.log(`\n===== ${tag}  流派总数=${R.total} =====`);
  console.log(`① 速攻名0速无源: ${R.b1.length}（有来源例外 ${R.srcExc.length} 分档 ${JSON.stringify(R.srcCat)}，其中轻装 ${R.lightExc.length}）`);
  console.log(`② 防守身份满攻耐久不足: ${R.b2Def.length}；钉子/墙前缀进攻(边界单列): ${R.b2Haz.length}；空间例外 ${R.spaceExc.length}`);
  console.log(`③ 性格减项满投矛盾: ${R.b3Down.length}；防守名挂加速性格: ${R.b3DefSpd.length}`);
  console.log(`④ EV 单项>252: ${R.b4.length}；总量分布 ${JSON.stringify(R.sumHist)}`);
  const head=(arr,k)=>arr.slice(0,k).forEach(r=>console.log(`   #${r.id} ${r.zh} [${r.name}] ${r.side}/${r.role} 性格=${r.nat} EV=[${r.alloc}] ${r.reason}`));
  console.log('  -- ②防守身份 样例 --'); head(R.b2Def,10);
  console.log('  -- ②钉子前缀进攻 样例 --'); head(R.b2Haz,10);
  console.log('  -- ③减项满投 样例 --'); head(R.b3Down,10);
  console.log('  -- ③防守名加速 样例 --'); head(R.b3DefSpd,10);
  console.log('  -- 空间例外 --'); head(R.spaceExc,10);
}
show('六人队 allTeam',six); show('空队',emp);
console.log('\nmarkers six=',JSON.stringify(mkSix),' empty=',JSON.stringify(mkEmp));
console.log('snapshot six=',snapSix.length,' empty=',snapEmp.length);
