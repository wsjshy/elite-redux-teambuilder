const H = require('./harness_dbg.js');
const { ERDATA } = H;
const WXWORDS={240:['雨'],241:['晴'],201:['沙'],258:['雪','冰雹']};
function bad(id,setupId){const a=ERDATA.abilities[id];const d=String(a[3]||'');
  if(/双打/.test(d)&&/同伴/.test(d))return 'doubles';
  for(const w of WXWORDS[setupId])if(d.indexOf(w)>-1&&/(提升|增至|×|回复|闪避|速度|威力|能力)/.test(d))return 'weather:'+w;
  return null}
for(const [id,setup] of [[93,240],[589,241],[269,258],[482,201]]){
  console.log(`id${id} setup${setup} bad=`,bad(id,setup));
}
