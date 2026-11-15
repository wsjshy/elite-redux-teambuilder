const c=require('./_ev4387_c.json');
console.log('rotom', JSON.stringify(c.rotom,null,1).slice(0,1200));
console.log('mismatchCount', c.mismatchCount, 'breakdown', JSON.stringify(c.breakdown));
console.log('mismatches len', c.mismatches.length);
c.mismatches.slice(0,10).forEach(m=>console.log(JSON.stringify(m)));
