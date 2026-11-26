// v4.387 A2：三方对照清单（汉化分片 / textproto / 源码 cc+battle_util），源码为准。只读。
const fs=require('fs'),path=require('path');
const dir=__dirname;
const rd=f=>JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'));
const B=rd('_ev4387_b.json'), MAP=rd('_ev4387_a_map.json'), CC=rd('_ev4387_a_cc.json');
const Cby={};Object.values(CC).forEach(c=>{if(c&&c.id)Cby[String(c.id)]=c;});
const Mby={};Object.values(MAP).forEach(c=>{if(c&&c.id)Mby[String(c.id)]=c;});

// 人工核定：源码表达式/条件 + 行号（cc 行号来自 _ev4387_a_cc.json；battle_util 行号另注）
// ver: proto 已核 / 未核 proto
const CUR={
'317':{src:'onDefensiveMultiplier: 效果绝佳时 MUL(.65)（−35%）',line:'abilities.cc L4155',cls:'数字错',
  reco:'受到效果绝佳的攻击时受伤减少 35%（源码 MUL(.65)；图鉴 25% 与源码不符；textproto 标称 −35% 与源码一致）'},
'582':{src:'委托 PERMAFROST.onDefensiveMultiplier → 效果绝佳 MUL(.65)（−35%）',line:'abilities.cc L7525 → L4155',cls:'数字错',
  reco:'受到效果绝佳的攻击时受伤减少 35%（源码委托永冻层 MUL(.65)；图鉴 25% 与源码不符；textproto −35% 一致）'},
'200':{src:'ATE_ABILITY(TYPE_STEEL)：一般招→钢 + 钢本系，无威力倍率；onAfterTypeEffectiveness：自身含钢时恶/幽灵 *mod/=2',line:'abilities.cc L2725–2731',cls:'整句重写（原版文案残留，ER 无倍率）',
  reco:'一般属性招式变为钢属性并获得钢本系加成；自身为钢属性时，恶/幽灵招式伤害减半。（图鉴「钢招威力1.3倍」为原版 Steelworker 文案，ER 源码无任何钢招威力倍率；textproto 亦无倍率）'},
'442':{src:'onOffensiveMultiplier: 对妖精 RESISTANCE(1.5)；onDefensiveMultiplier: 受妖精攻击 RESISTANCE(.5)（RESISTANCE 仅 modifier 半程结算一次）',line:'abilities.cc L5833',cls:'只写进攻半套、防守侧漏记',
  reco:'对妖精属性招式威力 ×1.5；受到妖精属性攻击伤害 ×0.5（textproto 进攻1.5/防守0.5 与源码一致；图鉴漏记防守侧）'},
'440':{src:'onDefensiveMultiplier MUL(.5)（全招受伤减半）；委托 RKS_SYSTEM/COLOR_CHANGE 变属性；omniStab',line:'abilities.cc L5809',cls:'缺幅度',
  reco:'变色+变换自如+毛皮大衣+冰鳞粉；受到所有招式伤害 ×0.5（textproto 列名组合，未量化；源码 MUL(.5) 全招减半）'},
'499':{src:'委托 FILTER 防守 MUL(.65)（效果绝佳 −35%）+ ILLUMINATE 命中',line:'abilities.cc L6549 → FILTER L1705',cls:'缺幅度',
  reco:'冰冻皮肤+发光；效果绝佳攻击受伤 ×0.65（−35%），命中提升（textproto 列名组合，未量化）'},
'524':{src:'委托 AMPLIFIER 声音招增伤 + PUNK_ROCK 声音招进攻 MUL(1.3)/防守 MUL(.5)',line:'abilities.cc L6763 → PUNK_ROCK L3293',cls:'缺幅度',
  reco:'放大器+庞克摇滚；声音招进攻 ×1.3、防守声音招 ×0.5（textproto 列名组合；幅度按源码）'},
'613':{src:'委托 FUR_COAT 物理受伤 MUL(.5)；magicGuard=TRUE（魔法防守）',line:'abilities.cc L7862 → FUR_COAT L2324',cls:'缺幅度',
  reco:'毛皮大衣+魔法防守；受到物理招式伤害 ×0.5，仅受攻击伤害（textproto 列名组合；幅度按源码）'},
'664':{src:'委托 WATER_BUBBLE 进攻 MUL(2.0)/防守 HEATPROOF .5 + FLAMING_SOUL 先制 + 状态免疫',line:'abilities.cc L8388 → WATER_BUBBLE L2710',cls:'缺幅度',
  reco:'水泡+燃烧之魂；水招 ×2.0、火受伤 ×0.5、先制（textproto 列名组合；幅度按源码）'},
'671':{src:'onDefensiveMultiplier: 暴击 MUL(.25)（×1/4）；battle_util.c L7910 随机数 roll 固定 15 → 受伤 ×0.85（最低随机数）',line:'abilities.cc L8463–8467；battle_util.c L7910',cls:'缺幅度（两方均有据，补 85%/1/4 数字）',
  reco:'对手攻击取最低随机数（受伤 ×0.85，battle_util.c L7910）；击中要害时受伤 ×0.25（1/4，abilities.cc L8466）。textproto「min roll 85% / crit 1/4」与源码一致'},
'678':{src:'onDefensiveMultiplier: 接触 MUL(0.5)；火 RESISTANCE(2.0)。RESISTANCE 仅 modifier 半程结算（battle_util.c L7626 resistance 写入 ignored 丢弃），火只 ×2 一次',line:'abilities.cc L8573；battle_util.c L7626',cls:'数字错（上游代码与设计文案既存矛盾）',
  reco:'接触类招式受伤 ×0.5；火属性招式 ×2.0（弱点）。textproto 标称「接触 1/4、火 4 倍」对应两个半程都生效的假设；源码 RESISTANCE 的 resistance 半程被 ignored 丢弃、只结算 modifier 一次，故实际为接触 ×0.5、火 ×2，非 1/4 与 4 倍'},
'682':{src:'委托 HEATPROOF 防守 RESISTANCE(.5)（火/冰 ×0.5）+ JUGGERNAUT + 麻痹免疫',line:'abilities.cc L8609 → HEATPROOF L1458',cls:'缺幅度',
  reco:'耐热+重型坦克；火/冰受伤 ×0.5，麻痹免疫（textproto 列名组合；幅度按源码）'},
'726':{src:'INTOXICATE 一般招→毒+毒本系 + PUNK_ROCK 声音招进攻 MUL(1.3)/防守 MUL(.5)',line:'abilities.cc L9095 → PUNK_ROCK L3293',cls:'缺幅度',
  reco:'剧毒皮肤+庞克摇滚；一般招变毒并获毒本系；声音招进攻 ×1.3、防守声音招 ×0.5（textproto 列名组合）'},
'741':{src:'委托 STALL 防守 MUL(.7)（未出手前 −30%）+ SWIFT_SWIM 雨速',line:'abilities.cc L9261 → STALL L1589',cls:'缺幅度',
  reco:'悠游自如+慢出；本回合未出手前受伤 ×0.7（−30%），雨天提速（textproto 列名组合；幅度按源码）'},
'773':{src:'onEntry SetAbilityState 4；onEndTurn 计数 −1；onAfterTypeEffectiveness: state>0 且 mod≥1.0 时 *mod=0.5',line:'abilities.cc L9546–9560',cls:'数字错/条件错（回合数三方不一致）',
  reco:'入场后特性计数 4（回合末递减）；生效期间效果绝佳招受伤 ×0.5。回合数推导：入场当回合计入、回合末递减，覆盖 4 回合（入场回合+后续 3 回合）；textproto 标称 3 回合、图鉴 5 回合均与源码计数 4 不符；若入场时机不计首回合，实际覆盖回合数以实战为准'},
'779':{src:'委托 MULTISCALE 满血 MUL(.5) + PoisonPoint 接触中毒',line:'abilities.cc L9636 → MULTISCALE L1945',cls:'缺幅度',
  reco:'多重鳞片+毒刺；满血受伤 ×0.5（掉血后失效），接触可能中毒（textproto 列名组合；幅度按源码）'},
'817':{src:'onDefensiveMultiplier: status2 & STATUS2_ENRAGED 时 MUL(.8)（−20%）；减伤仅愤怒状态成立',line:'abilities.cc L10058',cls:'数字错（条件须写明）',
  reco:'在雾中陷入愤怒；愤怒状态下受伤 ×0.8（−20%），非愤怒状态无减伤。图鉴「减半/降低50%」与源码不符；textproto 标称 −20% 与源码一致'},
'829':{src:'FortKnox（无视增伤/连击特性）+ ATE_ABILITY(TYPE_STEEL)（一般招→钢+钢本系，无威力倍率）+ 委托 STEELWORKER afterEff（自身钢时恶/幽灵 /2）',line:'abilities.cc L10146 → STEELWORKER L2725',cls:'整句重写（原版文案残留，ER 无倍率）',
  reco:'坚壁+钢能力士；无视大多数增伤或连击特性；一般招变钢并获钢本系；自身为钢属性时恶/幽灵招式减半，否则获钢本系加成。图鉴未写倍率；源码 ATE 无钢招威力倍率'},
'881':{src:'委托 FOSSILIZED 进攻 MUL(1.2)/防守 RESISTANCE(.5)；岩石招破特性',line:'abilities.cc L10872 → FOSSILIZED L3978',cls:'缺幅度',
  reco:'化石+岩石属性招式无视特性；岩系进攻 ×1.2、防守 ×0.5（textproto 列名组合；幅度按源码）'},
'900':{src:'委托 SAND_GUARD 沙暴中防守 MUL(.5) + SAND_FORCE 沙暴增伤 + sandImmune 沙暴免疫',line:'abilities.cc L11082 → SAND_GUARD L6355',cls:'缺幅度',
  reco:'沙之力+沙之守卫；沙暴中受伤 ×0.5、沙暴下增伤、免疫沙暴（textproto 列名组合；幅度按源码）'},
'925':{src:'委托 TASTE_THE_RAINBOW 入场 + FIRE_SCALES→ICE_SCALES 特殊招防守 MUL(.5)',line:'abilities.cc L12065 → ICE_SCALES L3334',cls:'缺幅度',
  reco:'火鳞+品味彩虹；特殊招受伤 ×0.5（textproto 列名组合；幅度按源码）'},
'932':{src:'onDefensiveMultiplier: 首次未触发攻击 MUL(.65)（−35%）+ 降对手攻击',line:'abilities.cc L12213',cls:'缺幅度',
  reco:'第一次受到攻击受伤 ×0.65（−35%，一次性），并降低对手攻击（textproto −35% 与源码一致；图鉴定性未量化）'},
'936':{src:'委托 THICK_FAT 火/冰 RESISTANCE(.5) + JUGGERNAUT',line:'abilities.cc L11654 → THICK_FAT L1081',cls:'缺幅度',
  reco:'主宰+厚脂肪；火/冰受伤 ×0.5（textproto 列名组合；幅度按源码）'},
'948':{src:'委托 TANGLING_HAIR(GOOEY) 减速 + FLUFFY：接触 MUL(.5)、火 RESISTANCE(2.0)（同 678，resistance 半程被丢弃，火只 ×2 一次）',line:'abilities.cc L11501 → FLUFFY L3004',cls:'缺幅度（按 678 同口径）',
  reco:'卷发+毛茸茸；接触招受伤 ×0.5、火招 ×2.0（弱点）。textproto 仅列组合名；源码 FLUFFY 接触 ×0.5、火 ×2（RESISTANCE 只结算 modifier 一次）'},
'954':{src:'委托 THICK_FAT 火/冰 RESISTANCE(.5) + CORROSION 毒/钢可中毒',line:'abilities.cc L11646 → THICK_FAT L1081',cls:'缺幅度',
  reco:'厚脂肪+腐蚀；火/冰受伤 ×0.5，可使毒/钢属性中毒（textproto 列名组合；幅度按源码）'},
'962':{src:'委托 HUGE_WINGS 进攻 + PRISM_SCALES 防守 MUL(.7)（−30%）+ levitate 飘浮',line:'abilities.cc L11602 → PRISM_SCALES L3670',cls:'缺幅度',
  reco:'棱镜鳞片+巨翼；受伤 ×0.7（−30%），飘浮（textproto 列名组合；幅度按源码）'},
'968':{src:'委托 POISON_POINT 接触中毒 + SHELL_ARMOR（仅暴击免疫，无伤害倍率）',line:'abilities.cc L11678 → SHELL_ARMOR L1352',cls:'无幅度可补，保留原文',
  reco:'硬壳盔甲+毒刺.（保留原文；源码仅暴击免疫，无伤害减伤倍率，不补幅度）'},
'970':{src:'委托 METALLIC 入场加钢属性 + BATTLE_ARMOR 防守 MUL(.8)（−20%）+ 暴击免疫',line:'abilities.cc L11779 → BATTLE_ARMOR L524',cls:'缺幅度',
  reco:'金属化+战斗盔甲；受伤 ×0.8（−20%），加钢属性，暴击免疫（textproto 列名组合；幅度按源码）'},
'997':{src:'委托 SCRAPYARD + BATTLE_ARMOR 防守 MUL(.8)（−20%）+ 暴击免疫',line:'abilities.cc L12442 → BATTLE_ARMOR L524',cls:'缺幅度',
  reco:'战斗盔甲+废料场；受伤 ×0.8（−20%），暴击免疫（textproto 列名组合；幅度按源码）'},
'1004':{src:'onDefensiveMultiplier: typeEffectivenessModifier<1 时 MUL(.7)（−30%）；否则 MUL(.85)（−15%）',line:'abilities.cc L12498',cls:'数字错（条件与幅度双错、方向反）',
  reco:'被抵抗（效果不佳）时受伤 ×0.7（−30%）；其余情况 ×0.85（−15%）。图鉴「所有 −10%、被抵抗 −20%」条件与幅度均错；textproto 15%/30% 与源码一致'},
'1010':{src:'委托 THERMAL_EXCHANGE + HEATPROOF 火/冰 RESISTANCE(.5)',line:'abilities.cc L12562 → HEATPROOF L1458',cls:'缺幅度',
  reco:'热交换+耐热；火/冰受伤 ×0.5（textproto 列名组合；幅度按源码）'},
'1032':{src:'委托 FLAME_BODY + RAW_WOOD 进攻 MUL(1.2)/防守 RESISTANCE(.5)；分片中文名空（待补）',line:'abilities.cc L4375 → RAW_WOOD L4362',cls:'缺幅度（兼缺中文名）',
  reco:'Raw Wood + Flame Body.；进攻 ×1.2、防守 ×0.5（中文名待补，本版不动译名）'},
'1048':{src:'onOffensiveMultiplier: 对虫 RESISTANCE(1.5)；onDefensiveMultiplier: 虫攻方 MUL(.5)。分片 abilities 无条目（不补登记，记台账）',line:'abilities.cc L4111',cls:'分片漏登记（cc/proto 均存在）',
  reco:'台账：cc INSECTEATER 对虫进攻 ×1.5、受虫攻击 ×0.5；textproto L6143–6146 同。分片未登记，v4.388 报告说明，本版不增条目'},
'1053':{src:'委托 IMMOLATE（入场纵火）+ HEATPROOF 防守 RESISTANCE(.5)。分片无条目（不补登记）',line:'abilities.cc L12873 → HEATPROOF L1458',cls:'分片漏登记（cc/proto 均存在）',
  reco:'台账：cc THERMALDWELLER = Immolate + Heatproof（火/冰 ×0.5）；textproto L6178–6180 同。分片未登记，v4.388 报告说明，本版不增条目'},
};

const PROTO_OV={'1048':{protoDesc:'Deal 1.5x dmg to Bug-types. Take 0.5x dmg from Bug-types.',protoExp:'Deals 1.5x damage to Bug-type Pokemon and takes 0.5x damage when attacked by Bug-type Pokemon. Based on attacker/defender Pokemon types, not move types.'},
'1053':{protoDesc:'Heatproof + Immolate.',protoExp:''}};
const rows=B.rows.map(r=>{
  const m=Object.assign({},Mby[String(r.id)]||{},PROTO_OV[String(r.id)]||{}), c=Cby[String(r.id)]||{}, cur=CUR[String(r.id)]||{};
  return {id:r.id,en:r.en,zh:r.zh,shard:r.desc,
    protoDesc:m.proto_desc||m.protoDesc||'〈未核 textproto〉', protoExp:m.proto_expanded||m.protoExp||'',
    src:cur.src||'待核', line:cur.line||'', cls:cur.cls||'待核', reco:cur.reco||'待核',
    protoChecked:!!(m.proto_desc||m.protoDesc)};
});
const byClass={};rows.forEach(r=>byClass[r.cls]=(byClass[r.cls]||0)+1);
function bucket(cls){
  if(/整句重写|进攻半套|防守侧漏记/.test(cls))return '只写进攻半套/防守侧漏记或整句重写';
  if(/数字错/.test(cls))return '数字错';
  if(/漏登记/.test(cls))return '分片漏登记(台账,不补)';
  if(/无幅度/.test(cls))return '无幅度可补(保留原文)';
  return '缺幅度';
}
const byBucket={};rows.forEach(r=>{const b=bucket(r.cls);byBucket[b]=(byBucket[b]||0)+1;});
const noProto=rows.filter(r=>!r.protoChecked).map(r=>r.id);
fs.writeFileSync(path.join(dir,'_ev4387_a2.json'),JSON.stringify({rows,byClass,byBucket,noProto},null,1));
console.log('条数',rows.length,'未核proto',noProto.join(',')||'无');
console.log('bucket',JSON.stringify(byBucket));
console.log('class',JSON.stringify(byClass,null,1));
