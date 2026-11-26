const HC = require('./harness.js');
const { ERDATA, deriveBuilds } = HC;
let lt2=0, empty=0;
for (const s of ERDATA.species){ let bs; try{bs=deriveBuilds(s,[])}catch(e){bs=[]}
  if(!bs.length){empty++;continue} if(bs.length<2)lt2++; }
console.log('empty',empty,'lt2',lt2);
