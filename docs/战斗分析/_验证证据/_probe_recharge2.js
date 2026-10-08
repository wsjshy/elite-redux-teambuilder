// 探针2：列出 every-other turn / next turn / two turns / must rest / charge 各组的具体招式与 lDesc
const fs=require('fs'),vm=require('vm');
const src=fs.readFileSync('D:/game/elite-redux/配招工具_data.js','utf8');
const ctx={window:{},document:{},console:console};vm.createContext(ctx);
vm.runInContext(src,ctx);
const D=ctx.window.ERDATA||ctx.ERDATA;
const MV=D.moves;
function dump(title,re,limit){
  console.log('\n=== '+title+' ===');
  let n=0;
  MV.forEach(m=>{const d=String(m[10]||'');if(re.test(d)){n++;if(n<=(limit||30))console.log('  '+m[0]+' '+m[1]+'  |  '+d)}});
  console.log('  小计 '+n);
}
dump('every-other turn',/every-?other turn/i);
dump('on the next turn',/on the next turn/i);
dump('two turns',/two turns/i);
dump('must rest / rests',/must rest|rests next turn|rest next turn/i);
dump('recharg',/recharg/i);
dump('charge / first turn（蓄力型）',/charg|first turn/i,30);
