// 归因：进攻流派中的场地招分别来自哪条生成路径（regular deriveBuilds / mech rw / combo）
const H = require('./harness.js');
const { ERDATA } = H;
const FIELD = { 240: 'weather', 241: 'weather', 201: 'weather', 258: 'weather',
  580: 'terrain', 581: 'terrain', 604: 'terrain', 641: 'terrain',
  366: 'tailwind', 433: 'space', 113: 'wall', 115: 'wall', 657: 'wall' };
const attr = {};
for (const s of ERDATA.species) {
  // mech 路径
  let mb = []; try { mb = mechBuildsOf(s); } catch (e) { mb = []; }
  mb.forEach(b => {
    const ids = (b.mv.main || []).map(x => +x.id);
    ids.forEach(id => {
      if (!FIELD[id]) return;
      const k = `mech:${b.mechRw || '?'}:${FIELD[id]}`;
      attr[k] = attr[k] || { n: 0, ex: [] };
      attr[k].n++;
      if (attr[k].ex.length < 5) attr[k].ex.push(`#${s.id}${s.zh}「${b.name}」${b.roleTag}`);
    });
  });
  // combo 路径
  let cb = []; try { cb = comboBuildsOf(s); } catch (e) { cb = []; }
  cb.forEach(b => {
    (b.mv.main || []).forEach(x => {
      const id = +x.id;
      if (!FIELD[id]) return;
      const k = `combo:${b.name}:${FIELD[id]}`;
      attr[k] = attr[k] || { n: 0, ex: [] };
      attr[k].n++;
      if (attr[k].ex.length < 5) attr[k].ex.push(`#${s.id}${s.zh}「${b.name}」${b.roleTag}`);
    });
  });
}
Object.keys(attr).sort().forEach(k => {
  console.log(`\n${k} ×${attr[k].n}`);
  attr[k].ex.forEach(e => console.log('  ' + e));
});
