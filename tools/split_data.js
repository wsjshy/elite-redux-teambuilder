/* v4.98 data.js 分片器（构建期派生；源 data.js 保持冻结不动） */
var fs=require('fs');
var path=process.argv[2]; // er-n5xx dir
var dataSrc=fs.readFileSync(path+'/data.js','utf8');
(0,eval)(dataSrc); // 间接 eval → 全局，var 泄漏到 global

/* 分片清单 */
var LITE=['types','matchup','items','abilities','abiTags','abiAlias','templates','coreNotes','movesNotes','nonFinal','mvDescZh','abiDescZh','sysSet','familyRoot','glossary','usagePrior','usageMeta','tacticRole','synergyRole','nonFinalER','finalOf'];
var SPECIES=['species'];
var ADV=['moves','matchupSp','smogonPrior','mechLib'];

function shard(names){
  var o={};names.forEach(function(k){o[k]=ERDATA[k]});
  /* 顶层变量 nonFinalER/finalOf/smogonPrior 在 data.js 是独立 var，非 ERDATA 子键 → 单独处理 */
  return 'ERDATA['+JSON.stringify(names[0])+']=undefined;\n' + names.map(function(k){
    var v=ERDATA[k];
    return 'ERDATA['+JSON.stringify(k)+']='+JSON.stringify(v)+';';
  }).join('\n');
}
fs.writeFileSync(path+'/data_lite_v498.js', 'if(typeof ERDATA===\'undefined\'){var ERDATA={};}\n'+LITE.map(function(k){return 'ERDATA['+JSON.stringify(k)+']='+JSON.stringify(ERDATA[k])+';'}).join('\n'));
fs.writeFileSync(path+'/data_species_v498.js', '"use strict";\n'+SPECIES.map(function(k){return 'ERDATA['+JSON.stringify(k)+']='+JSON.stringify(ERDATA[k])+';'}).join('\n'));
fs.writeFileSync(path+'/data_adv_v498.js', '"use strict";\n'+ADV.map(function(k){return 'ERDATA['+JSON.stringify(k)+']='+JSON.stringify(ERDATA[k])+';'}).join('\n'));

console.log('species entries='+ERDATA.species.length+' moves='+Object.keys(ERDATA.moves).length);
console.log('shard sizes: lite='+fs.statSync(path+'/data_lite_v498.js').size+' species='+fs.statSync(path+'/data_species_v498.js').size+' adv='+fs.statSync(path+'/data_adv_v498.js').size);
