// 探针：扫描 ERDATA.moves[*][10]（lDesc）中所有与「僵直 / 间隔 / 蓄力」相关的措辞，统计并列出样本
const fs=require('fs'),vm=require('vm');
const src=fs.readFileSync('D:/game/elite-redux/配招工具_data.js','utf8');
const ctx={window:{},document:{},console:console};vm.createContext(ctx);
vm.runInContext(src,ctx);
const D=ctx.window.ERDATA||ctx.ERDATA;
const MV=D.moves;
const pats={
  'Needs recharging':/Needs recharging/i,
  'must recharge':/must recharge/i,
  'recharg':/recharg/i,
  'every-other turn':/every-?other turn/i,
  'every other turn':/every other turn/i,
  'can only be used every':/can only be used every/i,
  'every two turns':/every two turns/i,
  'несколько':/never/,
  'interval/间隔':/间隔/i,
  '蓄力/charge':/charg|first turn/i,
  'rests next turn':/rests? next turn|rest next turn/i,
  'cannot move next turn':/can(?:no|')t move next turn/i,
  'sluggish':/sluggish/i,
  'recharge turn':/recharge turn/i,
  'alternate turns':/alternate turn/i,
  'on the next turn':/on the next turn/i,
  'takes a turn':/takes a turn/i,
  'two turns':/two turns/i,
  'must rest':/must rest/i
};
console.log('=== lDesc 关键词命中统计（总 '+MV.length+' 招）===');
const hit={};
Object.keys(pats).forEach(k=>{hit[k]=[]});
MV.forEach(m=>{const d=String(m[10]||'');Object.keys(pats).forEach(k=>{if(pats[k].test(d))hit[k].push(m[0]+' '+m[1])})});
Object.keys(pats).forEach(k=>console.log(k.padEnd(24)+' : '+hit[k].length));
console.log('\n=== 现有 costOf 判据（/Needs recharging/i）命中的招式 ===');
MV.forEach(m=>{if(/Needs recharging/i.test(String(m[10]||'')))console.log('  '+m[0]+' '+m[1])});
console.log('\n=== 未被现有判据覆盖、但含 recharge/every-other/interval 语义的招式 ===');
MV.forEach(m=>{const d=String(m[10]||'');if(/Needs recharging/i.test(d))return;
  if(/recharg|every-?other turn|every other turn|can only be used every|alternate turn|sluggish|must rest|rests? next turn|takes a turn/i.test(d))
    console.log('  '+m[0]+' '+m[1]+'  |  '+d)});
console.log('\n=== 含 charge/first turn（蓄力型）样本前 20 ===');
MV.filter(m=>/charg|first turn/i.test(String(m[10]||''))).slice(0,20).forEach(m=>console.log('  '+m[0]+' '+m[1]+'  |  '+String(m[10]||'').slice(0,110)));
