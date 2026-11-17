// v4.395 核验：全库手动天气招残留 + 与预演逐卡比对
const H = require('D:/game/elite-redux/tools/headless/harness.js');
const { ERDATA, deriveBuilds, MV } = H;
const by = id => ERDATA.species.find(s => String(s.id) === String(id));
const team = [26, 65, 96, 80, 37, 208].map(by);
const WK = { 241: '晴', 240: '雨', 201: '沙', 258: '雪' };
const SETTER = { '晴': ['日照', '干旱', '绯红脉动'], '雨': ['降雨', '积雨云'], '沙': ['扬沙', '沙漠之魂', '沙漠意志'], '雪': ['降雪'] };
const plan = require('D:/game/elite-redux/tools/headless/_v4395_plan.json');
// v4.395b 又在 plan 之外的三个维度动了同一批卡（657 死招换招 / 双墙改名 / 天气前缀）→ 这些卡不再按 v4.395 预演比对
const B395 = require('D:/game/elite-redux/tools/headless/_v4395b_hit.json');
const B_HIT = new Set((B395.six || []).concat(B395.empty || []).map(r => r.id + '[' + r.idx + ']'));
const planKey = (tag) => { const m = {}; plan[tag].forEach(r => m[r.id + '[' + r.idx + ']'] = r); return m };
const PK = { six: planKey('six'), empty: planKey('empty') };

function scan(tm, tag) {
  const res = { residue: [], prank: [], setter: [], score99: [], diffs: [], ok: 0 };
  const abiN = s => (s.abis || []).concat(s.inns || []);
  ERDATA.species.forEach(s => {
    let bs; try { bs = deriveBuilds(s, tm); } catch (e) { return; }
    bs.forEach((b, i) => {
      const all = (b.mv.main || []).concat(b.mv.func || []);
      const hit = all.find(x => WK[+x.id]);
      if (!hit) return;
      const wid = +hit.id, k = WK[wid];
      const prank = (b.abi || []).some(a => String(a && a.n || '').indexOf('恶作剧') > -1);
      const setter = SETTER[k].some(a => abiN(s).some(n => String(n).indexOf(a) > -1));
      const row = { id: +s.id, idx: i, zh: s.zh, k, wid, nm: String(b.name), mv: all.map(x => (MV[+x.id] || [])[1]).join('/') };
      if (prank) { res.prank.push(row); return }
      if (setter) { res.setter.push(row); return }
      if (b.score === 99) { res.score99.push(row); return }
      res.residue.push(row);
    });
  });
  // 比对预演
  ERDATA.species.forEach(s => {
    let bs; try { bs = deriveBuilds(s, tm); } catch (e) { return; }
    bs.forEach((b, i) => {
      const key = (+s.id) + '[' + i + ']';
      const p = PK[tag][key];
      if (!p) return;
      if (B_HIT.has(key)) { res.ok++; return; }   // v4.395b 后续改动的卡由 verify_v4395b 校验
      const now = String(b.name);
      if (now !== p.now) res.diffs.push(`${key} ${p.zh} name 期望「${p.now}」实际「${now}」`);
      const ids = (b.mv.main || []).concat(b.mv.func || []).map(x => (MV[+x.id] || [])[1]);
      const rest = p.rest ? p.rest.split('/') : [];
      const miss = rest.filter(x => ids.indexOf(x) < 0);
      if (miss.length) res.diffs.push(`${key} ${p.zh} 应保留「${miss.join(',')}」| 实际: ${ids.join('/')}`);
      res.ok++;
    });
  });
  console.log(`\n===== ${tag} =====`);
  console.log(`  预演覆盖卡: ${res.ok} / 计划 ${plan[tag].length}`);
  console.log(`  残留手动天气招（非豁免）: ${res.residue.length}`);
  res.residue.slice(0, 20).forEach(r => console.log(`    ${r.id}[${r.idx}] ${r.zh}|${r.nm}|${r.k}${r.wid}|${r.mv}`));
  console.log(`  豁免: 恶作剧 ${res.prank.length} / 天气手 ${res.setter.length} / score99 ${res.score99.length}`);
  res.prank.forEach(r => console.log(`    prank ${r.id}[${r.idx}] ${r.zh}|${r.nm}|${r.k}${r.wid}`));
  console.log(`  与预演差异: ${res.diffs.length}`);
  res.diffs.slice(0, 25).forEach(d => console.log('    ' + d));
  return res;
}
const six = scan(team, 'six'); const empty = scan([], 'empty');
console.log('\n总计: six 残留 ' + six.residue.length + ' / empty 残留 ' + empty.residue.length);
