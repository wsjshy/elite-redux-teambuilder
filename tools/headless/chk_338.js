const H = require('./harness_dbg.js');
const { ERDATA, famAbiRuleOf } = H;
// 229 build moves after finalize
const s=ERDATA.species.find(x=>String(x.id)==='229');
const b=H.deriveBuilds(s,[])[0];
// 模拟强壮之颚在该build的rule
const rule=famAbiRuleOf('强壮之颚');
console.log('强壮之颚 rule:',rule?{check:rule.check.toString().slice(0,80)}:null);
const ids=b.mv.main.map(x=>x.id);
console.log('moves:',ids);
if(rule)console.log('some check:',ids.some(rule.check));
