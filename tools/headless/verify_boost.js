// v4.384 验证探针：增伤清场无来源归门 + 受队消耗 neither 退出 + 弱点保险高耐久撤首位。
// 五断言：
// ① 名含体系前缀但自身无来源（无自动体系 / 无自带开体系招 / 无体系进攻加成）= 0；
// ② 名含「受队消耗」但既不满足 A(回复) 也不满足 B(高耐久+消耗/保命) = 0；
// ③ 六人队 bulk≥300 首位弱点保险 322 = 0；
// ④ 空队 bulk≥300 首位弱点保险 322 = 0；
// ⑤ 本版被降级改名到进攻名（强化清场/主力输出压制）的卡必须过三条件进攻门；无进攻门者不得落进攻名。
// 口径：空队（gate.js）+ 六人队 allTeam=[26,65,96,80,37,208]，跨队按 物种id+流派名 去重。
const H = require('./harness.js');
const { ERDATA, deriveBuilds, ownAutoSys, bulkOf, _abEnt, MV } = H;
const by = id => ERDATA.species.find(s => String(s.id) === String(id));
const allTeam = [by(26), by(65), by(96), by(80), by(37), by(208)];

const BOOST = [14,187,334,339,347,349,417,468,483,504,526];
const SETUP = [240,241,201,258,580,581,604,641];
const REC_MV=[105,202,234,235,236,303,355,409,156,215,361,456,505,532,631,72,71];
const WEAR_MV=[73,92,261,174,227];
const PROT_MV=[164,182];
const REC_ITEM=['剩饭','黑色污泥'];
const REC_ABI={'144':1,'90':1};
const PRE=['精神场地','薄雾场地','场地','电场','晴','雨','沙','雪'];
const SETTER={晴:[241],雨:[240],沙:[201],雪:[258],场地:[580,581,604,641],精神场地:[641],薄雾场地:[581],电场:[604]};
const SYS_COND={晴:['晴天'],雨:['雨天'],沙:['沙暴'],雪:['冰雹'],场地:['青草场地'],精神场地:['精神场地'],薄雾场地:['薄雾场地'],电场:['电气场地']};
const OFF_EATER={晴:['34','94','380','268','122','862'],雨:['33'],沙:['146','159'],雪:['202','862'],场地:['182','477'],精神场地:[],薄雾场地:['182'],电场:['477']};

function kitIds(b){const ids=[];(b.mv.main||[]).forEach(m=>ids.push(+m.id));(b.mv.func||[]).forEach(m=>ids.push(+m.id));return ids;}
function abiIds(s){return (s.abiIds||[]).concat(s.innIds||[]).map(String);}
function prefixOf(n){for(const p of PRE){if(n.indexOf(p)>=0)return p}return '';}
function autoSrc(s){
  if((ownAutoSys(s)||[]).length)return true;
  const re=/出场时(降下|制造|呼风|放晴|扬起|飘雪|展开)|制造.{0,4}场地|视为在大晴天/;
  return abiIds(s).some(id=>{const e=_abEnt(id);return e&&re.test(String(e[3]||''));});
}
function cSrc(s,pre){
  const conds=SYS_COND[pre]||[];
  return abiIds(s).some(id=>{
    if((OFF_EATER[pre]||[]).indexOf(id)>=0)return true;
    const g=ERDATA.abiTags[id];
    return g&&g.out&&g.out.cond&&conds.indexOf(g.out.cond)>=0;
  });
}
function dmgCount(ids){return ids.filter(id=>{const r=MV[id];return r&&r[4]!=='变化'}).length;}
function stabCount(s,ids){const st=new Set([s.t1,s.t2]);return ids.filter(id=>{const r=MV[id];return r&&r[4]!=='变化'&&st.has(r[3])}).length;}
function offEv(b){const a=b.ev&&(b.ev.alloc||b.ev)||[0,0,0,0,0,0];return Math.max(a[1]||0,a[3]||0);}
function offGate(s,b,ids){return dmgCount(ids)>=2&&offEv(b)>=120&&stabCount(s,ids)>=1;}

const A=[], B=[], C6=[], CE=[], E=[];

function scan(team, lab){
  for(const s of ERDATA.species){
    let bs; try{bs=deriveBuilds(s,team);}catch(e){continue;}
    for(const b of bs){
      const n=String(b.name||''); const ids=kitIds(b); const bulk=bulkOf(s);
      const it0=b.it&&b.it[0]?String(b.it[0][0]):'';
      // ① 体系前缀无来源
      const pre=prefixOf(n);
      if(pre&&n.indexOf('增伤清场')>=0){
        const hasSetup=(SETTER[pre]||[]).some(id=>ids.indexOf(id)>=0);
        const source=autoSrc(s)||hasSetup||cSrc(s,pre);
        if(!source)A.push({id:s.id,zh:s.zh,name:n,pre,ids});
      }
      // ② 受队消耗 neither
      const A_=REC_ITEM.some(x=>it0.indexOf(x)>=0)||abiIds(s).some(id=>REC_ABI[id])||REC_MV.some(id=>ids.indexOf(id)>=0);
      const B_=bulk>=300&&(WEAR_MV.some(id=>ids.indexOf(id)>=0)||PROT_MV.some(id=>ids.indexOf(id)>=0));
      if(n.indexOf('受队消耗')>=0&&!(A_||B_))B.push({id:s.id,zh:s.zh,name:n,bulk,ids});
      // ③④ 322 bulk≥300 首位
      if(it0==='弱点保险'&&bulk>=300){ (lab==='six'?C6:CE).push({id:s.id,zh:s.zh,name:n,bulk}); }
      // ⑤ 本版降级到进攻名必须过门
      if(b._v384Demoted&&(n==='强化清场'||n==='主力输出压制')){
        if(!offGate(s,b,ids))E.push({id:s.id,zh:s.zh,name:n,dmg:dmgCount(ids),stab:stabCount(s,ids),offEv:offEv(b),ids});
      }
    }
  }
}
scan(allTeam,'six'); scan([],'empty');

console.log('=== v4.384 收口验证（空队 + 六人队，跨队去重）===');
console.log('① 体系前缀增伤清场 但自身无来源:', A.length, A.length===0?'PASS':'FAIL');
A.forEach(r=>console.log('   FAIL #'+r.id,r.zh,r.name,'pre='+r.pre,JSON.stringify(r.ids)));
console.log('② 名含受队消耗 但 neither(无回复 且 非高耐久+消耗/保命):', B.length, B.length===0?'PASS':'FAIL');
B.forEach(r=>console.log('   FAIL #'+r.id,r.zh,r.name,'bulk='+r.bulk,JSON.stringify(r.ids)));
console.log('③ 六人队 bulk≥300 首位弱点保险:', C6.length, C6.length===0?'PASS':'FAIL');
C6.forEach(r=>console.log('   FAIL #'+r.id,r.zh,r.name,'bulk='+r.bulk));
console.log('④ 空队 bulk≥300 首位弱点保险:', CE.length, CE.length===0?'PASS':'FAIL');
CE.forEach(r=>console.log('   FAIL #'+r.id,r.zh,r.name,'bulk='+r.bulk));
console.log('⑤ 本版降级落进攻名但未过三条件门:', E.length, E.length===0?'PASS':'FAIL');
E.forEach(r=>console.log('   FAIL #'+r.id,r.zh,r.name,'dmg='+r.dmg,'stab='+r.stab,'offEv='+r.offEv,JSON.stringify(r.ids)));

const fail=A.length+B.length+C6.length+CE.length+E.length;
console.log('\n=== 断言结果:', fail===0?'ALL PASS':fail+' 项 FAIL','===');
process.exit(fail===0?0:1);
