const H = require('./harness.js');
const { ERDATA, deriveBuilds, MV } = H;
let n=0;
for(const s of ERDATA.species){
  if(+s.base[5]<100)continue;
  for(const b of deriveBuilds(s,[])){
    if(!b.weatherSelfRemoved)continue;n++;
    const mv=b.mv.main.map(m=>MV[m.id][1]).join('/');
    const sw=b.abiSwappedForWeather?(' 换特性:'+b.abiSwappedForWeather+'→'+b.abi[0].n):'';
    console.log(`#${s.id} ${s.zh} 「${b.name}」 ${mv} | ${b.abi[0].n}${sw}`);
  }
}
console.log('转换总数:',n);
