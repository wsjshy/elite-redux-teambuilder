const fs=require('fs'),path=require('path');
const dir=__dirname;
const files=['data_lite_v498.js','data_adv_v498.js','data_species_v498.js'];
files.forEach(f=>{
  const p=path.join(dir,'..','..',f);
  const b=fs.readFileSync(p);
  const t=b.toString('utf8');
  const crlf=(t.match(/\r\n/g)||[]).length;
  const bare=(t.match(/\n/g)||[]).length-crlf;
  console.log(`${f} bytes=${b.length} lines=${t.split(/\r?\n/).length} CRLF=${crlf} bareLF=${bare}`);
});
// 条目数（harness 已 eval 三分片）
const H=require('./harness.js');
const D=H.ERDATA;
console.log('条目数 abilities',D.abilities.length,'items',D.items.length,'moves',D.moves.length,'species',D.species.length);
