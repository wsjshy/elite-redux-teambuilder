/* ============================================================================
   v4.12 引擎层 · 自检探针（本线自写，不改既有 verify 脚本）
   目标：抽查 ① 14 项新增 rewrite 的**评估改写真实生效**（非只加 why）、
        ② SMOGON_PRIOR_ENABLED 开关与消费、③ 体系模板六位生成、优雅降级与开关回退。
   方法：与 verify_v410.js 同口径 —— Node VM + fake DOM，加载最终产物抽出脚本
        （D:\game\elite-redux\_chk_script_1.js，由 _extract_script.js 从 配招助手_ER.html 抽出）。
   纪律：只读产物；不改任何项目文件（_chk_script_1.js 由 _extract_script.js 生成）。
   运行：node docs\战斗分析\_验证证据\_v412_引擎层_自检探针_20261010.js
   ============================================================================ */
const fs = require('fs'), vm = require('vm');
const ER = 'D:\\game\\elite-redux\\';
const script = fs.readFileSync(ER + '_chk_script_1.js', 'utf8');

function mkEl(id) {
  const el = {
    id: id || '', _html: '', children: [], style: {}, dataset: {}, value: '', checked: false,
    textContent: '', className: '', hidden: false, onclick: null, oninput: null, onchange: null, files: null, title: '',
    classList: { _s: {}, add(n){this._s[n]=1}, remove(n){delete this._s[n]}, toggle(n){this._s[n]=this._s[n]?0:1}, contains(n){return !!this._s[n]} },
    appendChild(c){this.children.push(c);return c}, removeChild(){}, querySelector(){return mkEl('')}, querySelectorAll(){return []},
    addEventListener(){}, removeEventListener(){}, click(){}, focus(){}, select(){}, closest(){return null}
  };
  Object.defineProperty(el, 'innerHTML', { get: () => el._html, set: v => { el._html = String(v) } });
  return el;
}
const registry = {};
function byId(id){ if(!registry[id]) registry[id]=mkEl(id); return registry[id]; }
const doc = { getElementById: byId, createElement: () => mkEl(''), body: mkEl('body'), querySelector: () => null,
  querySelectorAll: () => [], addEventListener(){}, execCommand(){ return true } };
const sandbox = { console, setTimeout, clearTimeout, setInterval, clearInterval, Math, Date, JSON, Object, Array, String, Number, Boolean, RegExp, Error,
  document: doc, alert: m => {}, window: {}, navigator: { userAgent: 'node' }, location: { href: 'file:///x.html' },
  Uint8Array, Uint16Array, Uint32Array, DataView, ArrayBuffer, TextDecoder, TextEncoder,
  Blob: function(){}, URL: { createObjectURL(){ return 'blob:x' }, revokeObjectURL(){} }, FileReader: function(){}, localStorage: { getItem: () => null, setItem(){} } };
sandbox.window = sandbox; sandbox.globalThis = sandbox;
sandbox.addEventListener = function(){}; sandbox.removeEventListener = function(){};
sandbox.scrollTo = function(){}; sandbox.innerHeight = 800; sandbox.scrollY = 0; sandbox.getComputedStyle = function(){ return {} };
vm.createContext(sandbox);
vm.runInContext(script, sandbox, { timeout: 900000 });
sandbox.toast = function(){};

let pass = 0, fail = 0; const fails = [];
function chk(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS  ' + name + (detail !== undefined ? '  → ' + detail : '')); }
  else { fail++; fails.push(name + '  → ' + detail); console.log('  FAIL  ' + name + '  → ' + detail); }
}
function hdr(t){ console.log('\n=== ' + t + ' ==='); }
const E = sandbox.ERDATA;
const MV = sandbox.MV;
function clearMemo(){ ['_MEV_MEMO','_MECH_MEMO','_MV_SEC'].forEach(k=>{ if(sandbox[k]) Object.keys(sandbox[k]).forEach(x=>delete sandbox[k][x]) }); }
function abiZh(id){ const a=E.abilities.filter(x=>String(x[0])===String(id))[0]; return a?a[2]:''; }
function spWithAbi(id){
  const all=E.species.filter(s=>{ try{ return sandbox.mechAbiIdList(s).indexOf(String(id))>-1 }catch(e){ return false } });
  const fin=all.filter(s=>{ try{ return sandbox.isFinalSp(s)&&sandbox.isValidSp(s) }catch(e){ return true } });
  return (fin.length?fin:all)[0]||null;
}
function mvSecAny(){ for(const k in MV){ const r=sandbox.mvSecEffect(MV[k]); if(r) return {id:k,mv:MV[k],r:r} } return null; }
function mvOfTy(ty){ for(const k in MV){ if(MV[k][3]===ty) return MV[k] } return null; }

console.log('mechAll=' + sandbox.mechAll().length + '  mechOn=' + sandbox.mechOn());
console.log('MECH_EVAL_ON=' + sandbox.MECH_EVAL_ON + '  SMOGON_PRIOR_ENABLED=' + sandbox.SMOGON_PRIOR_ENABLED + '  SMOGON_PRIOR_W=' + sandbox.SMOGON_PRIOR_W);

/* =========================================================
   §0 前置：数据与开关
   ========================================================= */
hdr('§0 前置：mechLib v412 / 词汇表 40 项 / 开关存在');
chk('0-1 mechLib 已内嵌且 52 条（v4.12 契约增长 28→52）', sandbox.mechAll().length === 52, 'mechs=' + sandbox.mechAll().length);
const NEW_RW=['weather_speed','weather_offense','weather_recovery','dry_skin_weather','type_immunity_absorb','water_bubble_shell',
 'water_veil_guard','intimidate_weaken','anti_intimidate','multiscale_sash','sheer_force_boost','scrappy_ghost','light_metal_weight','huge_power_phys','magician_steal'];
const RWZH=sandbox.MECH_RW_ZH;
chk('0-2 MECH_RW_ZH 含全部 14 项新增 rewrite 中文名', NEW_RW.every(k=>!!RWZH[k]), NEW_RW.map(k=>(RWZH[k]?'ok':'MISSING')+':'+k).join(' '));
chk('0-3 词汇表规模 ≥ 40（26 既有 + 14 新增）', Object.keys(RWZH).length >= 40, 'keys=' + Object.keys(RWZH).length);
chk('0-4 MECH_EVAL_ON / SMOGON_PRIOR_ENABLED 默认 true、权重 0.35', sandbox.MECH_EVAL_ON===true && sandbox.SMOGON_PRIOR_ENABLED===true && Math.abs(sandbox.SMOGON_PRIOR_W-0.35)<1e-9, '');

/* =========================================================
   §A ① weather_speed：叶绿素 34 晴天速度 ×1.5（评分维度真实改写）
   ========================================================= */
hdr('§A ① weather_speed（叶绿素 34 / 拨沙 146 / 拨雪 202）');
const sp34=spWithAbi(34), sp146=spWithAbi(146), sp202=spWithAbi(202);
chk('A1 命中测试物种（叶绿素/拨沙/拨雪）', !!sp34&&!!sp146&&!!sp202, [sp34&&sp34.zh, sp146&&sp146.zh, sp202&&sp202.zh].join('/'));
if(sp34){
  const base=sandbox.spdOf(sp34);
  const sunny=sandbox.mechSpdOf(sp34,{sysKey:'晴'});
  const dry=sandbox.mechSpdOf(sp34,{sysKey:''});
  chk('A2 晴天队：速度评估 = 基础×1.5（ER 口径；官方 ×2）', sunny===Math.round(base*1.5)&&base>0, 'base='+base+' → sunny='+sunny+'（×'+(sunny/base).toFixed(2)+'）');
  chk('A3 无该体系：速度评估不改写（前提未改，仍表列值）', dry===base, 'dry='+dry);
  const d2s=sandbox.DIM_IMPL.D2(sp34,{sysKey:'晴'}), d2d=sandbox.DIM_IMPL.D2(sp34,{sysKey:''});
  chk('A4 D2 速度维度输出含机制评估改写标注', /机制评估改写/.test(d2s.txt)&&/×1\.5/.test(d2s.txt), d2s.txt.slice(0,150));
  chk('A5 D2 无体系时保持原口径文案（零影响）', !/机制评估改写/.test(d2d.txt), d2d.txt);
  const me=sandbox.mechEvalOf(sp34,{sysKey:'晴'});
  chk('A6 mechEvalOf.spdMul=1.5 且 why 含 ER 口径/官方差异', me.spdMul===1.5 && /ER/.test(me.whys.join(' ')) && /官方 ×2/.test(me.whys.join(' ')), me.whys[0]&&me.whys[0].slice(0,120));
}
if(sp146){ const b=sandbox.spdOf(sp146); chk('A7 拨沙 146：沙暴速度 ×1.5', sandbox.mechSpdOf(sp146,{sysKey:'沙'})===Math.round(b*1.5), 'base='+b); }
if(sp202){ const b=sandbox.spdOf(sp202); chk('A8 拨雪 202：冰雹速度 ×1.5', sandbox.mechSpdOf(sp202,{sysKey:'雪'})===Math.round(b*1.5), 'base='+b); }

/* =========================================================
   §B ① weather_offense / weather_recovery
   ========================================================= */
hdr('§B ① weather_offense（太阳之力 94 / 沙之力 159）+ weather_recovery（雨盘 44 / 冰体 115）');
const sp94=spWithAbi(94), sp159=spWithAbi(159), sp44=spWithAbi(44), sp115=spWithAbi(115);
chk('B1 命中测试物种', !!sp94&&!!sp159&&!!sp44&&!!sp115, [sp94&&sp94.zh, sp159&&sp159.zh, sp44&&sp44.zh, sp115&&sp115.zh].join('/'));
if(sp94){
  const b=sandbox.atkBest(sp94), hi=(sp94.base[1]>=sp94.base[3]?'物理':'特殊');
  const me=sandbox.mechEvalOf(sp94,{sysKey:'晴'}), b4=sandbox.DIM_IMPL.D4(sp94,{sysKey:'晴'}), b4d=sandbox.DIM_IMPL.D4(sp94,{sysKey:''});
  chk('B2 太阳之力 94：晴天最高攻击项 ×1.5（ER 口径）', me.atkMul[hi]===1.5, 'hi='+hi+' atkMul='+JSON.stringify(me.atkMul));
  chk('B3 mechAtkBestOf 力度改写 = round(最高项×1.5)', sandbox.mechAtkBestOf(sp94,{sysKey:'晴'})===Math.max(b,Math.round((hi==='物理'?sp94.base[1]:sp94.base[3])*1.5)), 'base='+b+' → '+sandbox.mechAtkBestOf(sp94,{sysKey:'晴'}));
  chk('B4 D4 力度维度含机制改写 + ER/官方差异登记', /机制评估改写/.test(b4.txt)&&/官方/.test(b4.txt)&&/差异登记/.test(b4.txt), b4.txt.slice(0,180));
  chk('B5 D4 无体系时保持原口径（零影响）', !/机制评估改写/.test(b4d.txt), b4d.txt);
}
if(sp159){ const hi=(sp159.base[1]>=sp159.base[3]?'物理':'特殊'); const me=sandbox.mechEvalOf(sp159,{sysKey:'沙'});
  chk('B6 沙之力 159：沙暴最高攻击项 ×1.5 + 官方差异登记', me.atkMul[hi]===1.5&&/地面·岩石·钢/.test(me.whys.join(' ')), me.atkMul[hi]); }
if(sp44){ const me=sandbox.mechEvalOf(sp44,{sysKey:'雨'}), d7=sandbox.DIM_IMPL.D7(sp44,{sysKey:'雨',L:sandbox.learnC(sp44)});
  chk('B7 雨盘 44：雨天每回合 1/8 回复 → 续航维度改写（ER 1/8 / 官方 1/16；无回复招也计入）', me.healFrac>=0.125&&me.recWhys.some(r=>/雨盘/.test(r))&&/官方 1\/16/.test(me.recWhys.join(' '))&&d7.pts>=2&&/机制每回合/.test(d7.txt), 'healFrac='+me.healFrac+' pt7='+d7.pts+' txt='+d7.txt.slice(0,110)); }
if(sp115){ const me=sandbox.mechEvalOf(sp115,{sysKey:'雪'}); chk('B8 冰体 115：冰雹每回合 1/8 回复', me.healFrac===0.125, 'healFrac='+me.healFrac); }

/* =========================================================
   §C ① dry_skin_weather（87）
   ========================================================= */
hdr('§C ① dry_skin_weather（干燥皮肤 87）');
const sp87=spWithAbi(87);
chk('C1 命中测试物种（干燥皮肤 87）', !!sp87, sp87&&sp87.zh);
if(sp87){
  const me=sandbox.mechEvalOf(sp87,{sysKey:'雨'}), a=sandbox.mechDefAdjOf(sp87,'水'), b=sandbox.mechDefAdjOf(sp87,'火');
  const tri=sandbox.defCellTrio(sp87,'水'), triF=sandbox.defCellTrio(sp87,'火');
  chk('C2 对水免疫：defImm 含水 + defCellTrio(水).inn = 0（防御匹配真实改写）', me.defImm.indexOf('水')>-1 && a.imm===true && tri.inn===0, 'inn='+tri.inn);
  chk('C3 对火降权：defDown 含火 + 生效口径 opt ×1.25（不扣分、inn 不动）', me.defDown.indexOf('火')>-1 && b.down===1.25, 'opt='+triF.opt);
  chk('C4 雨天回血：healFrac=0.125（雨回合回血）', me.healFrac===0.125, 'healFrac='+me.healFrac);
  chk('C5 why 登记 ER desc 未量化 + 官方 1/4·1.25·1/8·1/8（差异登记）', /Water\/Rain heals\. Fire\/Sun hurts\./.test(me.whys.join(' '))&&/差异登记/.test(me.whys.join(' ')), (me.defWhys[0]||'').slice(0,120));
  const meS=sandbox.mechEvalOf(sp87,{sysKey:'晴'});
  chk('C6 晴天掉血：负向前提只登记（why 标注），不改写评估数值', /晴天每回合掉 1\/8/.test(meS.whys.join(' '))&&meS.healFrac===0, 'healFrac='+meS.healFrac);
}

/* =========================================================
   §D ① type_immunity_absorb（114/18/11/157/31/78）+ 水泡 199 + 水幕 41
   ========================================================= */
hdr('§D ① type_immunity_absorb（引水114/引火18/蓄水11/食草157/避雷针31/电力引擎78）');
const SP={}; [114,18,11,157,31,78].forEach(id=>SP[id]=spWithAbi(id));
chk('D1 六个属性吸收特性均命中测试物种', [114,18,11,157,31,78].every(id=>!!SP[id]), [114,18,11,157,31,78].map(id=>id+':'+(SP[id]?SP[id].zh:'MISSING')).join(' '));
if(SP[11]){ const t=sandbox.defCellTrio(SP[11],'水'), me=sandbox.mechEvalOf(SP[11],{}); const hi=(SP[11].base[1]>=SP[11].base[3]?'物理':'特殊');
  chk('D2 蓄水 11：**对水免疫**入防御匹配（defCellTrio(水).inn=0）＝真实生效；受击回血只作前提登记（healFrac 不写、不过评）',
    t.inn===0&&/受水招命中后回复 25%/.test(me.whys.join(' '))&&me.healFrac===0, 'inn='+t.inn+' healFrac='+me.healFrac); }
if(SP[18]){ const t=sandbox.defCellTrio(SP[18],'火'), me=sandbox.mechEvalOf(SP[18],{});
  chk('D3 引火 18：对火免疫 inn=0（真实生效）＋「自身火招威力 ×1.5」作受击触发前提登记（不写 mvTypeMul，避免对未受击对局过评）',
    t.inn===0&&me.mvTypeMul['火']===undefined&&/自身火招威力 ×1.5/.test(me.whys.join(' '))&&/前提增益，不计入基础力度/.test(me.whys.join(' ')), 'inn='+t.inn+' fireMul='+me.mvTypeMul['火']); }
if(SP[114]){ const t=sandbox.defCellTrio(SP[114],'水'), me=sandbox.mechEvalOf(SP[114],{}); const hi=(SP[114].base[1]>=SP[114].base[3]?'物理':'特殊');
  chk('D4 引水 114：对水免疫 inn=0＋命中后最高攻项 +1 作前提登记＋ER/官方差异登记（基础力度不变）',
    t.inn===0&&me.atkMul[hi]===1&&/前提增益，不计入基础力度/.test(me.whys.join(' '))&&/官方 特攻 \+1/.test(me.whys.join(' ')), 'hi='+hi+' atkMul='+me.atkMul[hi]); }
if(SP[157]){ const t=sandbox.defCellTrio(SP[157],'草'), me=sandbox.mechEvalOf(SP[157],{}); const hi=(SP[157].base[1]>=SP[157].base[3]?'物理':'特殊');
  chk('D5 食草 157：对草免疫 inn=0＋命中后 +1 作前提登记＋追加草招转移登记', t.inn===0&&me.atkMul[hi]===1&&/Redirects Grass moves/.test(me.whys.join(' ')), 'hi='+hi); }
if(SP[31]){ const t=sandbox.defCellTrio(SP[31],'电'), me=sandbox.mechEvalOf(SP[31],{}); const hi=(SP[31].base[1]>=SP[31].base[3]?'物理':'特殊');
  chk('D6 避雷针 31：对电免疫 inn=0＋命中后最高攻项 +1 作前提登记（ER；官方特攻+1）', t.inn===0&&me.atkMul[hi]===1, 'hi='+hi); }
if(SP[78]){ const t=sandbox.defCellTrio(SP[78],'电'), me=sandbox.mechEvalOf(SP[78],{});
  chk('D7 电气引擎 78：对电免疫 inn=0（真实生效）＋速度+1 只作前提登记（spdMul 不改写）', t.inn===0&&me.spdMul===1&&/不计入基础速度评估/.test(me.whys.join(' ')), 'inn='+t.inn+' spdMul='+me.spdMul); }
const sp199=spWithAbi(199), sp41=spWithAbi(41);
if(sp199){ const me=sandbox.mechEvalOf(sp199,{}); const hi2=(sp199.base[1]>=sp199.base[3]?'物理':'特殊');
  const t=sandbox.defCellTrio(sp199,'火');
  chk('D8 水泡 199：水招 ×2 且受火减半（ER 与官方一致）', me.mvTypeMul['水']===2&&me.defHf.indexOf('火')>-1&&t.inn<=0.25&&/与官方一致/.test(me.whys.join(' ')), 'waterMul='+me.mvTypeMul['水']+' 火 inn='+t.inn); }
if(sp41){ const me=sandbox.mechEvalOf(sp41,{}), d7=sandbox.DIM_IMPL.D7(sp41,{sysKey:'',L:sandbox.learnC(sp41)});
  chk('D9 水幕 41：免灼伤 + ER 特有登场水流环（1/16 → 续航维度）', me.healFrac>0&&/ER 特有/.test(me.whys.join(' ')), 'healFrac='+me.healFrac+' pt7='+d7.pts); }

/* =========================================================
   §E ① intimidate / anti_intimidate / multiscale_sash / sheer_force / scrappy / light_metal / huge_power / magician
   ========================================================= */
hdr('§E ① 威吓/反威吓/满血减伤/全力攻击/胆量/轻金属/巨力/魔术师');
const sp22=spWithAbi(22), sp553=spWithAbi(553), sp39=spWithAbi(39), sp231=spWithAbi(231), sp125=spWithAbi(125),
      sp113=spWithAbi(113), sp135=spWithAbi(135), sp37=spWithAbi(37), sp74=spWithAbi(74), sp170=spWithAbi(170);
chk('E1 命中测试物种', [sp22,sp553,sp231,sp125,sp113,sp135,sp37,sp74,sp170].every(x=>!!x),
  [22,553,231,125,113,135,37,74,170].map(id=>{const s=spWithAbi(id);return id+':'+(s?s.zh:'MISSING')}).join(' '));
if(sp22){ const me=sandbox.mechEvalOf(sp22,{}), d11=sandbox.DIM_IMPL.D11(sp22,{});
  chk('E2 威吓 22：physWane=1（防御/站场增益）→ D11 免疫/减伤维度加分', me.physWane===1&&d11.pts>=2&&/威吓/.test(d11.txt), 'pt11='+d11.pts+' '+d11.txt); }
if(sp553){ const me=sandbox.mechEvalOf(sp553,{}), hi=(sp553.base[1]>=sp553.base[3]?'物理':'特殊');
  chk('E3 警卫犬 553（反威吓按 id 分档）：被威吓攻击 +1（×1.5）', me.atkMul[hi]===1.5&&me.vsIntim>=1&&/警卫犬/.test(me.whys.join(' ')), 'hi='+hi); }
if(sp39){ const me=sandbox.mechEvalOf(sp39,{});
  chk('E4 反威吓（非 553 档）：免疫威吓 → 对抗威吓评估（vsIntim≥1、无攻击改写）', me.vsIntim>=1&&me.atkMul['物理']===1&&me.atkMul['特殊']===1, JSON.stringify(me.atkMul)); }
if(sp231){ const me=sandbox.mechEvalOf(sp231,{}), d11=sandbox.DIM_IMPL.D11(sp231,{});
  const t=sandbox.defCellTrio(sp231,'火');
  chk('E5 幻影防守 231：复用 multiscale_sash 满血减伤语义（defFlat=0.5 → D11；不误当作类型抵抗）', me.defFlat===0.5&&d11.pts>=2&&/满血受击减伤/.test(d11.txt)&&t.inn===sandbox.defMult(sandbox.effTypesOf(sp231).base.concat(sandbox.effTypesOf(sp231).inn),'火'), 'pt11='+d11.pts); }
if(sp125){ const sec=mvSecAny();
  chk('E6 副效果识别：move 数据无结构化标志 → desc 文本正则可识别', !!sec, sec?(('#'+sec.id)+' '+sec.mv[1]+' pct='+sec.r.pct+' kw='+sec.r.kw):'NONE');
  const adj=sec?sandbox.mechAbiMvAdj(sp125,sec.mv,{side:'物理'}):null;
  chk('E7 全力攻击 125：带副效果招 ×1.3（招式级实现）', !!adj&&adj.mul===1.3&&/全力攻击/.test(adj.why.join(' ')), adj?('mul='+adj.mul+' '+adj.why[0]):'NONE'); }
if(sp113){ const gm=mvOfTy('一般'); const adj=gm?sandbox.mechAbiMvAdj(sp113,gm,{side:'物理'}):null; const me=sandbox.mechEvalOf(sp113,{});
  chk('E8 胆量 113：一般/格斗招可命中幽灵（破除免疫）+ 免疫威吓', !!adj&&adj.mul===1.1&&me.scrappy===1&&me.vsIntim>=1, adj?('mul='+adj.mul+' '+adj.why[0]):'NONE'); }
if(sp135){ const b=sandbox.spdOf(sp135), me=sandbox.mechEvalOf(sp135,{});
  chk('E9 轻金属 135：速度 ×1.3（ER 特有）+ 体重减半（防御维度）', sandbox.mechSpdOf(sp135,{})===Math.round(b*1.3)&&me.weightHalf===1&&/ER desc 追加|ER 特有/.test(me.whys.join(' ')), 'base='+b); }
if(sp37){ const me=sandbox.mechEvalOf(sp37,{}), adj=sandbox.mechAtkMulOf(sp37,'物理',null,{});
  const mcHP=sandbox.mechAll().filter(m=>m.rewrite==='huge_power_phys')[0];
  const lst=sandbox.mechMcAbiList(sp37,mcHP);
  chk('E10 大力士 37：物攻 ×2（ER 与官方一致）→ 攻击评估改写；按 id 分档只走 37 支（不进 74 特攻支）', me.atkMul['物理']===2&&adj.mul===2&&lst.indexOf(37)>-1&&lst.indexOf(74)<0&&me.atkWhys.some(w=>/物攻 ×2/.test(w)), 'phyMul='+me.atkMul['物理']+' mechAtkMul='+adj.mul+' pool='+JSON.stringify(lst)); }
if(sp74){ const me=sandbox.mechEvalOf(sp74,{}), mcHP=sandbox.mechAll().filter(m=>m.rewrite==='huge_power_phys')[0];
  const lst=sandbox.mechMcAbiList(sp74,mcHP), adjS=sandbox.mechAtkMulOf(sp74,'特殊',null,{});
  chk('E11 瑜伽之力 74：ER **特攻** ×2（官方物攻 ×2，差异登记）→ 攻击维度改写（按 id 分档）', lst.indexOf(74)>-1&&me.atkMul['特殊']===2&&adjS.mul===2&&/差异登记/.test(me.atkWhys.join(' ')), 'pool='+JSON.stringify(lst)+' spaMul='+me.atkMul['特殊']+' 分档支='+(lst.indexOf(37)>-1?'37+74 并集':'74')); }
if(sp170){ const me=sandbox.mechEvalOf(sp170,{}), li=sandbox.buildItem(sp170,'物理','输出',null);
  chk('E12 魔术师 170：道具位评估改写 + why（非接触招式后偷取 / 官方自身无道具+命中）', me.itemAudit.length>0&&/偷取/.test(me.itemAudit[0])&&li.length>0&&/道具位评估改写/.test(li[0][1]), li[0][1].slice(-90)); }

/* =========================================================
   §F ① 机制覆盖通用评分（abiAdjOf 接入点）+ 回归（非机制物种零影响）
   ========================================================= */
hdr('§F ① 机制覆盖通用评分（abiAdjOf 接入点）与零影响回归');
if(sp37){
  const names=(sp37.abis||[]).concat(sp37.inns||[]);
  const r=sandbox.abiAdjOf(sp37,'物理','一般',names,null,true);
  chk('F1 大力士 37 本系物攻：abiAdjOf.mul 由通用 ×1.2 覆盖为 ×2（机制覆盖 > 通用评分）', r.mul===2&&/机制覆盖通用评分/.test(String(r.why))&&r.mechMul===2, 'mul='+r.mul);
}
(function(){
  const nonMech=E.species.filter(s=>{ try{
      if(!sandbox.isFinalSp(s)||!sandbox.isValidSp(s))return false;
      const me=sandbox.mechEvalOf(s,{});
      return me.whys.length===0;
    }catch(e){return false} })[0];
  chk('F2 存在「无任何机制命中」的物种（回归基线样本）', !!nonMech, nonMech&&nonMech.zh);
  if(nonMech){
    const me=sandbox.mechEvalOf(nonMech,{});
    const neutral = me.spdMul===1&&me.healFrac===0&&me.defFlat===1&&me.atkMul['物理']===1&&me.atkMul['特殊']===1
      &&me.defImm.length===0&&me.defHf.length===0&&me.defDown.length===0&&me.vsIntim===0&&me.physWane===0&&me.weightHalf===0;
    chk('F3 非机制物种：mechEvalOf 全中性（零影响）', neutral, JSON.stringify({spd:me.spdMul,atk:me.atkMul,hf:me.defFlat}));
    const b=sandbox.defCellTrio(nonMech,'火');
    chk('F4 非机制物种：defCellTrio 与基础属性倍率一致（未改写）', b.inn===sandbox.defMult(sandbox.effTypesOf(nonMech).base.concat(sandbox.effTypesOf(nonMech).inn),'火'), 'inn='+b.inn);
  }
})();

/* =========================================================
   §G 优雅降级与一键开关
   ========================================================= */
hdr('§G 优雅降级：mechLib 缺失 / MECH_EVAL_ON=false');
(function(){
  if(!sp34) return;
  const base=sandbox.spdOf(sp34);
  const saved=sandbox.ERDATA.mechLib;
  try{
    sandbox.ERDATA.mechLib=null; clearMemo();
    chk('G1 mechLib 缺失 → mechOn()=false', sandbox.mechOn()===false, '');
    chk('G2 mechLib 缺失 → mechSpdOf 返回表列速度（零影响）', sandbox.mechSpdOf(sp34,{sysKey:'晴'})===base, 'v='+sandbox.mechSpdOf(sp34,{sysKey:'晴'}));
    const m=sandbox.mechEvalOf(sp34,{sysKey:'晴'});
    chk('G3 mechLib 缺失 → mechEvalOf 全中性', m.spdMul===1&&m.whys.length===0, '');
  }finally{ sandbox.ERDATA.mechLib=saved; clearMemo(); }
})();
(function(){
  if(!sp34) return;
  const base=sandbox.spdOf(sp34);
  try{
    sandbox.MECH_EVAL_ON=false; clearMemo();
    chk('G4 MECH_EVAL_ON=false → 评分改写层全关（mechSpdOf 返回表列速度）', sandbox.mechSpdOf(sp34,{sysKey:'晴'})===base, 'v='+sandbox.mechSpdOf(sp34,{sysKey:'晴'}));
    chk('G5 MECH_EVAL_ON=false → why 标注层仍在（mechAbiWhy 非空）', sandbox.mechAbiWhy(sp34).length>0, 'n='+sandbox.mechAbiWhy(sp34).length);
  }finally{ sandbox.MECH_EVAL_ON=true; clearMemo(); }
})();

/* =========================================================
   §H ② Smogon 先验：注入/消费/开关回退
   ========================================================= */
hdr('§H ② SMOGON_PRIOR：注入 120 物种 + 软消费 + 开关回退');
chk('H1 ERDATA.smogonPrior 已注入且 species 数 = 120', !!E.smogonPrior && Object.keys(E.smogonPrior.species||{}).length===120, 'n='+(E.smogonPrior?Object.keys(E.smogonPrior.species||{}).length:'none'));
chk('H2 smogonOn()=true（开关 true 且数据在）', sandbox.smogonOn()===true, '');
chk('H3 职责分界文案：smogonPrior 管配招/道具/队友、usagePrior 管物种常见度', /usagePrior/.test(sandbox.smogonNote())&&/smogonPrior/.test(sandbox.smogonNote()), sandbox.smogonNote());
const sp248=sandbox.spId2Obj(248);
chk('H4 smogonPriorOf(248) 存在（班基拉斯，先验物种样例）', !!sandbox.smogonPriorOf(248), sp248&&sp248.zh);
(function(){
  const sp=sandbox.smogonPriorOf(248); if(!sp) return;
  const mv0=(sp.moves||[])[0], it0=(sp.items||[])[0], tm0=(sp.teammates||[])[0];
  chk('H5 moves/items/teammates 三路取数可用', sandbox.smogonPct(sp,'moves',mv0.id)===+mv0.percent && sandbox.smogonPct(sp,'items',it0.id)===+it0.percent && (sp.teammates||[]).length>0,
    'mv='+mv0.id+':'+mv0.percent+' it='+it0.id+':'+it0.percent+' mates='+(sp.teammates||[]).length);
  chk('H6 道具先验：软优先权重 ≤ SMOGON_PRIOR_W×0.30（并列微排序，不动机制主导）', sandbox.smogonItemBonus(sp248,it0.id)>0&&sandbox.smogonItemBonus(sp248,it0.id)<=sandbox.SMOGON_PRIOR_W*0.30+1e-9,
    'bonus='+sandbox.smogonItemBonus(sp248,it0.id).toFixed(4)+' / 上限='+(sandbox.SMOGON_PRIOR_W*0.30).toFixed(4));
  chk('H7 配招先验：常见招小权重加成 ≤ SMOGON_PRIOR_W×0.10', sandbox.smogonMoveBonus(sp248,mv0.id)>0&&sandbox.smogonMoveBonus(sp248,mv0.id)<=sandbox.SMOGON_PRIOR_W*0.10+1e-9,
    'bonus='+sandbox.smogonMoveBonus(sp248,mv0.id).toFixed(4));
  chk('H8 队友先验：smogonMateIds 映射到 ER 物种 id，且 smogonMateHtml 含诚实标注', sandbox.smogonMateIds(sp248).length>0 &&
    /原版惯例 ≠ ER 使用率/.test(sandbox.smogonMateHtml(sp248,[])) && /队友先验/.test(sandbox.smogonMateHtml(sp248,[])),
    'mates='+sandbox.smogonMateIds(sp248).length);
  chk('H9 非先验物种（如 132 百变怪）零影响', sandbox.smogonRankOK===undefined ? (sandbox.smogonItemBonus(sandbox.spId2Obj(132),286)===0&&sandbox.smogonMoveBonus(sandbox.spId2Obj(132),33)===0&&sandbox.smogonMateIds(sandbox.spId2Obj(132)).length===0) : false, '');
  try{
    sandbox.SMOGON_PRIOR_ENABLED=false;
    const off = sandbox.smogonOn()===false && sandbox.smogonItemBonus(sp248,it0.id)===0 && sandbox.smogonMoveBonus(sp248,mv0.id)===0
      && sandbox.smogonMateIds(sp248).length===0 && sandbox.smogonMateHtml(sp248,[])==='' && sandbox.smogonMoveWhy(sp248,mv0.id)==='';
    chk('H10 SMOGON_PRIOR_ENABLED=false → 全部消费函数返回空/原行为（逐字节回退 v4.11）', off, '');
  }finally{ sandbox.SMOGON_PRIOR_ENABLED=true; }
})();
(function(){
  /* 道具排序软优先不影响机制主导：候选首位仍为机制得分最高者（抽样：班基拉斯 输出） */
  const a=sandbox.itemDecide(sp248,'物理','输出',null);
  chk('H11 道具推荐首位存在且 why 可溯源（软优先只微调、不改候选集）', a.length>=1&&/克制/.test(a[0].why)&&/代价/.test(a[0].why), a[0]?a[0].zh+' sc='+a[0].sc:'none');
  /* 开关关：同物种道具首位与开时一致（微排序不改变榜首） */
  const b0=a[0].zh;
  sandbox.SMOGON_PRIOR_ENABLED=false;
  const b=sandbox.itemDecide(sp248,'物理','输出',null);
  sandbox.SMOGON_PRIOR_ENABLED=true;
  chk('H12 开关关/开：道具榜首一致（机制覆盖主导，先验仅并列微排序）', b.length>=1&&b[0].zh===b0, 'on='+b0+' off='+(b[0]&&b[0].zh));
})();

/* =========================================================
   §I ③ 体系模板六位生成 + L2 渲染
   ========================================================= */
hdr('§I ③ 体系模板（axis_lib「体系模板」15 轴 × 6 位）');
(function(){
  const lib=sandbox.axisLib();
  chk('I1 AXIS_LIB 内嵌 15 条轴', lib.length===15, 'n='+lib.length);
  const withTpl=lib.filter(a=>a&&a['体系模板']&&typeof a['体系模板']==='object').length;
  chk('I2 15 条轴均含「体系模板」字段', withTpl===15, 'n='+withTpl);
  const POS=['体系核心','打手位','补盲位','联防位','撒钉清钉轮转位','功能位'];
  let ok6=true, bad=[];
  lib.forEach(a=>{ const t=a['体系模板']; POS.forEach(k=>{ if(!t||!t[k]){ok6=false;bad.push(a.id+'/'+k)} }); });
  chk('I3 每轴六位全齐（体系核心/打手位/补盲位/联防位/撒钉清钉轮转位/功能位）', ok6, bad.length?bad.slice(0,5).join(','):'15×6 全齐');
  chk('I4 axisTplOf("rain") 可取模板；缺失轴 → null（优雅降级）', !!sandbox.axisTplOf('rain') && sandbox.axisTplOf('__nope__')===null, '');
  const core=sandbox.spId2Obj(260);   /* 巨沼怪（雨轴样例） */
  const t=sandbox.axisTemplateOf(core,'rain');
  chk('I5 axisTemplateOf 生成六位（每位 1 候选，含补位标注位）', !!t && t.pos.length===6 && t.pos.filter(k=>t.picks[k]).length===6,
    t?t.pos.map(k=>k+':'+(t.picks[k]?(t.picks[k].zh+(t.picks[k].fill?'(补位)':'')):'—')).join(' | '):'null');
  const html=sandbox.axisTplHtml(core,'rain');
  chk('I6 L2 axbar 渲染：含「体系模板」+ 六位名 + 生成口径', /体系模板/.test(html)&&POS.every(k=>html.indexOf(k)>-1)&&/存档池/.test(html)&&/补位/.test(html), 'len='+html.length);
  chk('I7 字段缺失优雅降级：不存在的轴 → axisTplHtml 返回空串', sandbox.axisTplHtml(core,'__nope__')==='', '');
})();

/* =========================================================
   §J 组合（combo）与机制块渲染仍可用
   ========================================================= */
hdr('§J 机制块渲染与非回归抽查');
(function(){
  if(!sp37) return;
  const html=sandbox.mechCoreHtml? sandbox.mechCoreHtml(sp37):null;
  chk('J1 机制块渲染包含 14 项新增 why（巨力）本文', html?/巨力|物攻 ×2/.test(html):false, html?'len='+html.length:'no mechCoreHtml');
})();
(function(){
  if(!sp87) return;
  const w=sandbox.mechAbiWhy(sp87).map(o=>o.why).join(' ');
  chk('J2 mechAbiWhy 对干燥皮肤给出 ER/官方差异登记 why', /差异登记/.test(w)&&/干燥皮肤/.test(w), w.slice(0,110));
})();
/* =========================================================
   §K 回归护栏：v48 G2b 队规模快照（曾因 type_immunity_absorb 过评 5→6）
   ========================================================= */
hdr('§K 回归护栏：v48 G2b 队规模快照（4~6 只）');
(function(){
  const CASES=[['妙蛙花',6],['煤炭龟',6],['土王',4],['坚果哑铃',4],['护城龙',5]];
  const got=CASES.map(c=>{ const s=sandbox.ERDATA.species.filter(x=>x.zh===c[0])[0]||sandbox.ERDATA.species.filter(x=>x.zh.indexOf(c[0])>-1)[0];
    return s? sandbox.buildTeamByNeeds(s).team.length : -1 });
  chk('K1 队规模与 v48 G2b 快照逐只一致（机制评估改写不过评）', got.join(',')===CASES.map(c=>c[1]).join(','), CASES.map((c,i)=>c[0]+'='+got[i]).join(' '));
  chk('K2 关掉机制评估改写层后队规模不变（改写层对该快照零影响）', (function(){
    const saved=sandbox.MECH_EVAL_ON; sandbox.MECH_EVAL_ON=false;
    const g=CASES.map(c=>{ const s=sandbox.ERDATA.species.filter(x=>x.zh===c[0])[0]||sandbox.ERDATA.species.filter(x=>x.zh.indexOf(c[0])>-1)[0];
      return s? sandbox.buildTeamByNeeds(s).team.length : -1 });
    sandbox.MECH_EVAL_ON=saved;
    return g.join(',')===got.join(',');
  })(), CASES.map(c=>c[0]).join('/'));
})();

/* ---------- 汇总 ---------- */
console.log('\n================ v4.12 引擎层自检探针汇总 ================');
console.log('PASS=' + pass + '  FAIL=' + fail);
if (fails.length) { console.log('失败项：'); fails.forEach(f => console.log('  - ' + f)); process.exitCode = 1; }
else console.log('全部通过');
