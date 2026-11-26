// v4.395b 核验：三类名实/死招残留
const H = require('D:/game/elite-redux/tools/headless/harness.js');
const { ERDATA, deriveBuilds, MV } = H;
const by = id => ERDATA.species.find(s => String(s.id) === String(id));
const team = [26, 65, 96, 80, 37, 208].map(by);
const WKID = { '晴': 241, '雨': 240, '沙': 201, '雪': 258 };
const SETID = { '晴': [70, 584, 190, 871], '雨': [2, 989, 867, 189], '沙': [45, 604, 245], '雪': [117, 666, 929, 291, 348, 870, 493] };
const abiIds = b => (b.abi || []).map(x => +x.id).filter(x => x);

function scan(tm, tag) {
  const r = { wall: [], pre: [], aurora: [], renamed: [], kept: [], keptName: [], n: 0, stat: null };
  ERDATA.species.forEach(s => {
    let bs; try { bs = deriveBuilds(s, tm); } catch (e) { return; }
    bs.forEach((b, i) => {
      r.n++;
      const all = (b.mv.main || []).concat(b.mv.func || []);
      const ids = all.map(x => +x.id);
      const aids = abiIds(b);
      const key = (+s.id) + '[' + i + ']';
      const nm = String(b.name || '');
      const mvz = all.map(x => (MV[+x.id] || [])[1]).join('/');
      // ① 名含双墙却无任何墙
      if (!b._v395NameKeep && nm.indexOf('双墙') > -1 && ids.indexOf(113) < 0 && ids.indexOf(115) < 0) r.wall.push(`${key} ${s.zh}|${nm}|${mvz}`);
      // ② 天气前缀无来源
      const ch = nm.charAt(0);
      if ('雨晴沙雪'.indexOf(ch) > -1) {
        let has = ids.indexOf(WKID[ch]) > -1;
        if (!has) has = (SETID[ch] || []).some(x => aids.indexOf(x) > -1);
        if (!has) {
          const row = `${key} ${s.zh}|${nm}|${mvz}`;
          if (b._v395NameKeep) r.keptName.push(row); else r.pre.push(row);
        }
      }
      // ③ 极光幕无雪源
      if (ids.indexOf(657) > -1) {
        let snow = (SETID['雪'] || []).some(x => aids.indexOf(x) > -1) || ids.indexOf(258) > -1;
        if (!snow) r.aurora.push(`${key} ${s.zh}|${nm}|${mvz}`);
      }
      if (b._v395OldName !== undefined) r.renamed.push(`${key} ${s.zh} 「${b._v395OldName}」→「${nm}」`);
      if (b._v395NameKeep) r.kept.push(`${key} ${s.zh}|${nm}${b._v395bName ? '(b已改但旧重名)' : ''}`);
    });
  });
  if (typeof window !== 'undefined' && window._v395bStat) r.stat = window._v395bStat;
  console.log(`\n===== ${tag} =====`);
  console.log(`  全库卡数: ${r.n}`);
  console.log(`  ① 双墙名实残留（名含双墙却无墙）: ${r.wall.length}`);
  r.wall.slice(0, 20).forEach(x => console.log('    ' + x));
  console.log(`  ② 天气前缀无来源残留: ${r.pre.length}`);
  r.pre.slice(0, 20).forEach(x => console.log('    ' + x));
  console.log(`  ② 重名保留原名（前缀未去、但同物种已有该词）: ${r.keptName.length}`);
  r.keptName.slice(0, 20).forEach(x => console.log('    keep ' + x));
  console.log(`  ③ 极光幕无雪源残留: ${r.aurora.length}`);
  r.aurora.slice(0, 20).forEach(x => console.log('    ' + x));
  console.log(`  本版改名卡（带 _v395OldName）: ${r.renamed.length}`);
  console.log(`  同物种重名保留: ${r.kept.length}`);
  return r;
}
const six = scan(team, 'six'); const empty = scan([], 'empty');
console.log('\n总计残留: ① six ' + six.wall.length + ' / empty ' + empty.wall.length);
console.log('          ② six ' + six.pre.length + ' / empty ' + empty.pre.length + '（重名保留 six ' + six.keptName.length + ' / empty ' + empty.keptName.length + '）');
console.log('          ③ six ' + six.aurora.length + ' / empty ' + empty.aurora.length);
const fail = six.wall.length + empty.wall.length + six.pre.length + empty.pre.length + six.aurora.length + empty.aurora.length;
console.log(fail === 0 ? 'RESULT: PASS（三类残留全 0）' : 'RESULT: FAIL');
