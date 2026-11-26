const H = require('./harness.js');
const { ERDATA } = H;
const IDS = [14, 349, 417, 483, 504, 187, 347, 526, 74, 13];
IDS.forEach(id => console.log('MV', id, H.MV[id] ? H.MV[id][2] : '(无)'));
const OLD = H._ER_BOOST_ROLE || {};
const BOOST = [14, 349, 417, 483, 504, 187, 347];
const NEW = {}, add = [], del = [];
ERDATA.species.forEach(s => {
  if (!H.isFinalSp(s) || !H.isValidSp(s)) return;
  let L; try { L = H.learnOf(s) || []; } catch (e) { return; }
  if (BOOST.some(id => L.indexOf(id) > -1)) NEW[s.id] = true;
});
Object.keys(NEW).forEach(k => { if (!OLD[k]) add.push('#' + k); });
Object.keys(OLD).forEach(k => { if (!NEW[k]) del.push('#' + k + '(atk' + H.atkBest(ERDATA.species.find(x => String(x.id) === k) || {}) + ')'); });
console.log('\n旧表', Object.keys(OLD).length, ' 新表(招级7招)', Object.keys(NEW).length, ' 新增', add.length, ' 移除', del.length);
console.log('新增样本:', add.slice(0, 40).join('、'));
console.log('移除样本:', del.slice(0, 40).join('、'));
const ala = ERDATA.species.find(x => String(x.id) === '1507');
console.log('\n胡地 in 新表:', !!NEW[1507], ' 会347:', (H.learnOf(ala) || []).indexOf(347) > -1, ' 会417:', (H.learnOf(ala) || []).indexOf(417) > -1);
console.log('旧表含1507:', !!OLD[1507]);
require('fs').writeFileSync('boost4427.json', JSON.stringify(NEW));
console.log('已写 boost4427.json');
