// v4.383 探针（只读，不改引擎）：减伤轴 self-centric 拆分 + 强化减伤轴双条件 + 轮转 pivot 核查
const fs = require('fs');
const H = require('./harness.js');
const { ERDATA, deriveBuilds, abiTagOf, _abEnt, NM2ID } = H;

const SRC = JSON.parse(fs.readFileSync(__dirname + '/_src_reduce.json', 'utf8'));

const BOOST = [14,187,334,339,347,349,417,468,483,504,526];
const PIVOT = [369,521];

// 源码钩子中排除：队伍级/纯属性免疫/进攻侧/非减伤
const RED_EXCLUDE = new Set(['87','140','314','353','422','604','776']);
// 纯属性免疫（mod=0，归独立联防位，不计减伤）
const IMM_SRC = new Set(['314','422']);
// 保命（一次性存活/复活/抵挡一次）源码+描述核实
const SURV_IDS = new Set(['5','209','248','427','429','583','629','899']);
// 回复（续航/换人回血/异常治愈/吸取）显式 id 补充
const REC_IDS = new Set(['30','44','61','82','87','90','93','102','115','131','139','144','247','307','333',
  '415','566','875','886','890','991']);
const REC_RE = /回复最大HP|每回合回复|回复造成伤害|吸取.*HP|回复1\/|治愈自身|治愈异常|替换下场时,治愈|下场时回复|回复2\/3|回复1\/4|回复1\/8|回复1\/16|回复1\/3/;
const REC_HEAL_RE = /回复最大HP|回复1\/4|回复1\/8|回复1\/16|回复1\/3|回复造成伤害|吸取.*HP|回复HP|回血/;
const REC_SET_RE = /制造.{0,4}场地|视为在大晴天|出场时制造/;

const allTeam = [26,65,96,80,37,208].map(id => ERDATA.species.find(s => String(s.id) === String(id)));

function abId(n) { return NM2ID ? NM2ID[n] : null; }
function descOf(n) { const e = _abEnt(abId(n)); return e ? String(e[3] || '') : ''; }

function redHits(id, n) {
  id = String(id);
  const hits = [];
  const s = SRC[id];
  if (s && !RED_EXCLUDE.has(id)) {
    (s.defMul || []).forEach(x => hits.push('源码 DEF-MUL: ' + x.slice(0, 120)));
    (s.teAfter || []).forEach(x => hits.push('源码 TE-AFTER: ' + x.slice(0, 120)));
  }
  const tag = abiTagOf(n);
  if (tag && tag.hf && tag.hf.length) hits.push('标签 HF ' + tag.hf.join('/') + (tag.hfMul ? ' mul=' + JSON.stringify(tag.hfMul) : ' ×0.5'));
  return hits;
}

function classify(n) {
  const id = String(abId(n));
  const red = redHits(id, n);
  if (red.length) return { bucket: 'RED', id, red };
  if (IMM_SRC.has(id)) return { bucket: 'IMM', id };
  const tag = abiTagOf(n);
  if (tag && tag.im && tag.im.length) return { bucket: 'IMM', id, im: tag.im };
  if (SURV_IDS.has(id)) return { bucket: 'SURV', id };
  if (REC_IDS.has(id) || REC_RE.test(descOf(n))) {
    const d = descOf(n);
    const sub = REC_SET_RE.test(d) ? 'SET' : REC_HEAL_RE.test(d) ? 'HEAL' : 'STATUS';
    return { bucket: 'REC', id, recSub: sub };
  }
  return { bucket: 'NONE', id };
}

function selfNames(s) { return (s.inns || []).concat(s.abis || []); }
function kitIds(b) {
  const ids = [];
  (b.mv && b.mv.main || []).forEach(m => ids.push(+m.id));
  (b.mv && b.mv.func || []).forEach(m => ids.push(+m.id));
  return ids;
}

const imm = [], rot = [];
for (const s of ERDATA.species) {
  let bs; try { bs = deriveBuilds(s, allTeam); } catch (e) { continue; }
  for (const b of bs) {
    const n = String(b.name || '');
    if (n.indexOf('减伤轴') >= 0) imm.push({ s, b, name: n });
    if (n.indexOf('轮转') >= 0) rot.push({ s, b, name: n });
  }
}

const buck = { RED: 0, IMM: 0, SURV: 0, REC: 0, NONE: 0 };
const recSub = { HEAL: 0, STATUS: 0, SET: 0 };
const cards = { RED: [], IMM: [], SURV: [], REC: [], NONE: [] };
const redAbil = {};
imm.forEach(c => {
  const cls = selfNames(c.s).map(n => ({ n, c: classify(n) }));
  const red = cls.filter(x => x.c.bucket === 'RED');
  const im = cls.filter(x => x.c.bucket === 'IMM');
  const surv = cls.filter(x => x.c.bucket === 'SURV');
  const rec = cls.filter(x => x.c.bucket === 'REC');
  let bucket = red.length ? 'RED' : im.length ? 'IMM' : surv.length ? 'SURV' : rec.length ? 'REC' : 'NONE';
  buck[bucket]++;
  if (bucket === 'REC') {
    const subs = rec.map(x => x.c.recSub || 'STATUS');
    recSub[subs.indexOf('HEAL') >= 0 ? 'HEAL' : subs.indexOf('SET') >= 0 ? 'SET' : 'STATUS']++;
  }
  cards[bucket].push({ id: c.s.id, zh: c.s.zh, name: c.name, cls, it: (c.b.it || []).map(x => x[0]) });
  red.forEach(x => {
    const k = x.n;
    redAbil[k] = redAbil[k] || { id: x.c.id, cnt: 0, red: x.c.red, desc: descOf(x.n).split('\n')[0] };
    redAbil[k].cnt++;
  });
});

const boostAxis = imm.filter(c => c.name.indexOf('强化减伤轴') >= 0);
const boostSplit = { both: 0, noRed: 0, noBoost: 0, neither: 0 };
const boostCards = { both: [], noRed: [], noBoost: [], neither: [] };
boostAxis.forEach(c => {
  const hasRed = selfNames(c.s).some(n => redHits(abId(n), n).length > 0);
  const ids = kitIds(c.b);
  const hasBoost = BOOST.some(id => ids.indexOf(id) >= 0);
  const k = (!hasRed && !hasBoost) ? 'neither' : (!hasRed ? 'noRed' : (!hasBoost ? 'noBoost' : 'both'));
  boostSplit[k]++;
  boostCards[k].push({ id: c.s.id, zh: c.s.zh, name: c.name, hasRed, hasBoost, ids });
});

const rotPrefix = {}, rotNoPivot = [], rotNoPivotPrefix = {}; let rotPivot = 0;
rot.forEach(c => {
  const pre = c.name.split('轮转')[0] + '轮转';
  rotPrefix[pre] = (rotPrefix[pre] || 0) + 1;
  const ids = kitIds(c.b);
  if (PIVOT.some(id => ids.indexOf(id) >= 0)) rotPivot++;
  else { rotNoPivot.push({ id: c.s.id, zh: c.s.zh, name: c.name, ids }); rotNoPivotPrefix[pre] = (rotNoPivotPrefix[pre] || 0) + 1; }
});

// 空队基线（对照：减伤轴生成强依赖队友 immCount）
let emptyImm = 0, emptyRot = 0;
for (const s of ERDATA.species) {
  let bs; try { bs = deriveBuilds(s, []); } catch (e) { continue; }
  for (const b of bs) {
    const n = String(b.name || '');
    if (n.indexOf('减伤轴') >= 0) emptyImm++;
    if (n.indexOf('轮转') >= 0) emptyRot++;
  }
}

const out = [];
out.push('=== v4.383 探针 v2（六人队 allTeam=[26,65,96,80,37,208]，只读未改引擎）===');
out.push('减伤轴（名含「减伤轴」）总数: ' + imm.length);
out.push('  self 真有减伤（RED，保留）: ' + buck.RED);
out.push('  self 无减伤（降级）合计 M=' + (buck.IMM + buck.SURV + buck.REC + buck.NONE));
out.push('    免疫类（纯属性免疫，转「属性免疫联防位」）: ' + buck.IMM);
out.push('    保命类（结实/画皮等一次性存活）: ' + buck.SURV);
out.push('    回复类（再生力/毒疗/自然回复等续航）: ' + buck.REC + '（细分: 直接回血 ' + recSub.HEAL + ' / 异常治愈 ' + recSub.STATUS + ' / 场地·天气设置 ' + recSub.SET + '）');
out.push('    啥都没有: ' + buck.NONE);
out.push('  空队对照: 减伤轴 ' + emptyImm + ' 张 / 轮转 ' + emptyRot + ' 张');
out.push('');
out.push('强化减伤轴 总数: ' + boostAxis.length);
out.push('  有减伤且有强化招: ' + boostSplit.both);
out.push('  缺减伤: ' + boostSplit.noRed + '；缺强化招: ' + boostSplit.noBoost + '；两者都缺: ' + boostSplit.neither);
out.push('');
out.push('轮转全族 总数: ' + rot.length + '；有 pivot(369/521): ' + rotPivot + '；无 pivot: ' + rotNoPivot.length);
out.push('  全族前缀分项: ' + JSON.stringify(rotPrefix));
out.push('  无 pivot 前缀分项: ' + JSON.stringify(rotNoPivotPrefix));
out.push('');
out.push('--- RED 特性字典（id / 描述原文 / 幅度与源码结论）---');
Object.entries(redAbil).sort((a, b) => b[1].cnt - a[1].cnt).forEach(([n, v]) => {
  out.push('  [' + v.id + '] ' + n + '  x' + v.cnt + '  ' + v.red.join('；') + '  || ' + v.desc);
});

out.push('');
out.push('--- 复核备注（待父代理裁定）---');
out.push('1. REC 内 SET 17 张（叶绿体10/水幕12/青草制造者13，按特性命中计）非回血：天气招式效果/灼伤免疫/场地设置，建议补丁阶段挪 NONE；STATUS 42 含异常治愈与树果复用，干劲10 为睡眠免疫。');
out.push('2. 描述与源码幅度不一致（以源码为准）：317 永冻土、582 厚皮 文案 -25%，源码 MUL(.65)=-35%；200 钢能力士、442 妖精猎人 文案只写进攻加成，源码另有防守侧对恶/鬼/妖精减半。');
out.push('3. 待裁定边界：25 神奇守护（非SE清零，近免疫）；864 强投手（每次上场一次接触半减，一次性）；136/231/822 满血半减；天气/先制/性别/对手属性条件型，仅结构可触发才冠名。');
out.push('4. 保命源码核实：5 结实（战斗流程判定一击留1血，无防守倍率钩子）/209 画皮/248 结冻头/427 假死(2次无伤)/429 懦夫(入场守住一次)/583 英勇(noDamageHits=1)/629 薄葬(雾天复活1/4)/899 备用电源(电场地复活25%)；724 幸运光环源码仅挡能力下降，已剔出保命。');
out.push('5. 90 毒疗：自身能力块仅 toxicTerrainImmune，回血在异常回合流程钩子，归回复。');
out.push('6. HEAL 中击倒/接触触发回血：363 强夺(掠食者)/364 掠夺/331 灵魂食者(噬魂)/345 清道夫(拾荒者)/508 纯爱/385 吸血鬼/591 妖精祝福/875 能量之触，与常驻续航分档。');

fs.writeFileSync(__dirname + '/out_v4383_probe.txt', out.join('\r\n'), 'utf8');
fs.writeFileSync(__dirname + '/_ev4383_buckets.json', JSON.stringify({ buck, recSub, emptyImm, emptyRot, boostSplit, boostCards, rotPrefix, rotNoPivotPrefix, rotNoPivot, cards, redAbil }, null, 1), 'utf8');
console.log(out.join('\n'));
console.log('\n[written] out_v4383_probe.txt / _ev4383_buckets.json');
