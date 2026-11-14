// 探针：查看慢速重炮 #1058 / #2188 的种族与全部流派
const H = require('./harness.js');
const { ERDATA, deriveBuilds, MV } = H;

['1058', '2188'].forEach(function (id) {
  const s = ERDATA.species.find(function (x) { return x.id === id; });
  if (!s) { console.log('NOT FOUND', id); return; }
  console.log('===== #' + s.id, s.zh, s.en, '=====');
  console.log('base[HP,攻,防,特攻,特防,速]=', JSON.stringify(s.base), 't1=' + s.t1, 't2=' + s.t2);
  console.log('abis=', JSON.stringify(s.abis), 'inns=', JSON.stringify(s.inns));
  let bs;
  try { bs = deriveBuilds(s, []); } catch (e) { console.log('ERR', e); return; }
  console.log('流派数:', bs.length);
  bs.forEach(function (b, i) {
    const ids = (b.mv.main || []).map(function (x) { return x.id; });
    console.log(' [' + i + '] ' + b.name + ' | role=' + b.roleTag + ' side=' + b.side +
      ' score=' + b.score + ' | 特性=' + (b.abi[0] ? b.abi[0].n : '-') +
      ' | 道具=' + (b.it[0] ? b.it[0][0] : '-') +
      ' | EV=' + JSON.stringify(b.ev.alloc) +
      ' | 招=' + ids.map(function (m) { return MV[m] ? MV[m][1] : m; }).join('/'));
  });
});
